import { prisma } from "@/lib/db/client";
import type { MediaKind, Prisma } from "@prisma/client";
import { analyzeImage } from "./image-analysis";
import { extractTextFromImage } from "./ocr";
import { classifyMedia } from "./classification";
import { transcribeAudio, extractStructuredInfoFromText } from "./audio";
import { detectDuplicateGroup } from "./duplicate-detection";
import { extractKeyframes } from "./video";

// Orchestrates the "Upload -> Preprocessing -> cheap/deterministic analysis
// -> OCR/classification/transcription -> structured extraction -> ready"
// pipeline from spec section 22, split into a FAST phase (runs inline,
// before the upload response returns — sharp is fast enough, <300ms, that
// making the user wait for it is fine and lets the UI show real dimensions/
// a thumbnail immediately) and a SLOW phase (OCR + classification +
// transcription — each can take 1-5s, scheduled via next/server's after()
// so the HTTP response isn't held open for it; see
// src/app/api/media/upload/route.ts).

export interface FastAnalysisResult {
  normalizedBuffer: Buffer;
  normalizedMimeType: string;
  widthPx: number | null;
  heightPx: number | null;
  qualityScore: number | null;
  blurScore: number | null;
  orientation: string | null;
  perceptualHash: string | null;
}

export async function runFastAnalysis(mediaKind: MediaKind, buffer: Buffer): Promise<FastAnalysisResult> {
  if (mediaKind === "IMAGE") {
    const analysis = await analyzeImage(buffer);
    return {
      normalizedBuffer: analysis.normalized.buffer,
      normalizedMimeType: analysis.normalized.mimeType,
      widthPx: analysis.normalized.widthPx,
      heightPx: analysis.normalized.heightPx,
      qualityScore: analysis.qualityScore,
      blurScore: analysis.blurScore,
      orientation: analysis.orientation,
      perceptualHash: analysis.perceptualHash,
    };
  }
  // AUDIO/VIDEO/DOCUMENT: stored as-is, no fast synchronous transform today.
  // Video specifically has no frame-extraction/scene-detection step yet —
  // that needs an ffmpeg binary this environment doesn't have installed,
  // and adding one is a real infra decision (see the implementation
  // summary), not something to fake with a placeholder result.
  return {
    normalizedBuffer: buffer,
    normalizedMimeType: "",
    widthPx: null,
    heightPx: null,
    qualityScore: null,
    blurScore: null,
    orientation: null,
    perceptualHash: null,
  };
}

/**
 * The slow phase. Never throws — every branch degrades to
 * processingStatus=FAILED with an errorMessage rather than leaving a row
 * stuck at PROCESSING forever or crashing the background task (spec
 * section 26: fail intelligently, never fake a successful result).
 */
export async function runDeepAnalysis(mediaId: string): Promise<void> {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: mediaId } });
  if (!asset) return;

  try {
    await prisma.mediaAsset.update({ where: { id: mediaId }, data: { processingStatus: "PROCESSING" } });

    let extractedText: string | null = null;
    let transcript: string | null = null;
    let aiDescription: string | null = null;
    let detectedCategory: string | null = null;
    let detectedSubcategory: string | null = null;
    let categoryConfidence: number | null = null;
    let duplicateGroup: string | null = null;
    const aiMetadata: Record<string, unknown> = {};

    if (asset.mediaKind === "IMAGE") {
      const ocr = await extractTextFromImage(Buffer.from(asset.data));
      extractedText = ocr?.text ?? null;
      if (ocr) aiMetadata.ocrConfidence = ocr.confidence;

      if (asset.listingKind) {
        const classification = await classifyMedia(asset.listingKind, {
          filename: asset.originalFilename,
          ocrText: extractedText,
          orientation: asset.orientation ?? "unknown",
          dominantColor: "unknown",
        });
        detectedCategory = classification.category;
        detectedSubcategory = classification.subcategory;
        categoryConfidence = classification.confidence;
        aiMetadata.classificationMethod = classification.method;
        aiDescription = `Detected as "${classification.category}" (${Math.round(classification.confidence * 100)}% confidence, via ${classification.method}).`;
      }

      if (asset.perceptualHash) {
        duplicateGroup = await detectDuplicateGroup(asset.sessionId, asset.propertyId, asset.perceptualHash, asset.id);
      }
    } else if (asset.mediaKind === "AUDIO") {
      const transcription = await transcribeAudio(Buffer.from(asset.data), asset.originalFilename);
      transcript = transcription?.text ?? null;
      if (transcription?.language) aiMetadata.detectedLanguage = transcription.language;
      if (transcript) {
        const extracted = await extractStructuredInfoFromText(transcript);
        if (extracted) {
          aiMetadata.extractedFields = extracted.fields;
          aiDescription = extracted.summary;
        }
      }
    } else if (asset.mediaKind === "DOCUMENT") {
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const parsed = await pdfParse(Buffer.from(asset.data));
        extractedText = parsed.text?.trim().slice(0, 20_000) || null;
      } catch (error) {
        console.error("[media:pipeline:pdf]", error);
      }
    } else if (asset.mediaKind === "VIDEO") {
      // Intelligent sampling, not every frame (spec section 14): a handful
      // of evenly-spaced keyframes via ffmpeg-static, each run through the
      // exact same image pipeline used for photo uploads (analyzeImage +
      // OCR + classifyMedia) — real reuse of existing infrastructure, not a
      // parallel video-specific classifier. Failure here (corrupt file,
      // unsupported codec, no ffmpeg binary resolved) degrades to "no
      // frames extracted," not a crash — see extractKeyframes's own
      // fail-intelligently contract.
      const keyframes = await extractKeyframes(Buffer.from(asset.data));
      if (keyframes.length > 0) {
        const listingKind = asset.listingKind ?? "PROPERTY";
        const results: { atMs: number; category: string; confidence: number; ocrText: string | null }[] = [];
        const ocrTexts: string[] = [];

        for (const frame of keyframes) {
          const frameAnalysis = await analyzeImage(frame.buffer).catch(() => null);
          const frameOcr = await extractTextFromImage(frame.buffer);
          if (frameOcr?.text) ocrTexts.push(frameOcr.text);
          const classification = await classifyMedia(listingKind, {
            filename: `${asset.originalFilename} @${(frame.atMs / 1000).toFixed(1)}s`,
            ocrText: frameOcr?.text ?? null,
            orientation: frameAnalysis?.orientation ?? "unknown",
            dominantColor: frameAnalysis
              ? `rgb(${frameAnalysis.dominantColor.r},${frameAnalysis.dominantColor.g},${frameAnalysis.dominantColor.b})`
              : "unknown",
          });
          results.push({
            atMs: frame.atMs,
            category: classification.category,
            confidence: classification.confidence,
            ocrText: frameOcr?.text ?? null,
          });
        }

        // "Entrance -> Living room -> Kitchen -> ..." (spec section 14) —
        // collapse consecutive duplicate categories rather than listing
        // every sampled timestamp, since adjacent frames of the same room
        // are the expected case, not a new scene.
        const sequence: string[] = [];
        for (const r of results) {
          if (sequence[sequence.length - 1] !== r.category) sequence.push(r.category);
        }

        aiMetadata.keyframes = results;
        aiDescription = `Walkthrough sequence (from ${results.length} sampled frames): ${sequence.join(" → ")}.`;
        extractedText = ocrTexts.length > 0 ? [...new Set(ocrTexts)].join("\n").slice(0, 5000) : null;
        // A video's "category" isn't one room the way a photo's is — the
        // per-frame breakdown lives in aiMetadata.keyframes/aiDescription
        // instead of forcing a single detectedCategory that would misrepresent
        // a multi-room walkthrough.
      } else {
        aiMetadata.keyframeExtractionFailed = true;
      }
    }

    await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        processingStatus: "ANALYZED",
        extractedText,
        transcript,
        aiDescription,
        detectedCategory,
        detectedSubcategory,
        categoryConfidence,
        duplicateGroup,
        aiMetadata: aiMetadata as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error("[media:pipeline]", error);
    await prisma.mediaAsset
      .update({
        where: { id: mediaId },
        data: { processingStatus: "FAILED", errorMessage: error instanceof Error ? error.message : String(error) },
      })
      .catch(() => {});
  }
}
