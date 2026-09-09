import Groq from "groq-sdk";
import { getTaxonomy, type ListingTaxonomy } from "./taxonomy";

// Room/category classification without a vision-capable model. This Groq
// account's live model catalog (checked directly against
// https://api.groq.com/openai/v1/models, not assumed) has no vision model —
// only text reasoning (gpt-oss-120b/20b, qwen3, allam) and Whisper audio.
// Adding real image-understanding vision would mean a new paid vendor
// (OpenAI/Anthropic/Google) and a new API key this session cannot
// provision — a genuine infra/cost decision left for a human, not something
// to silently wire in. This module is the honest, working alternative:
// deterministic signal (OCR text pulled from the photo, the filename, image
// stats from image-analysis.ts) feeds a cheap reasoning pass, never raw
// pixels. It's a real, functioning classifier — just lower-ceiling than true
// vision — and swapping in a real vision call later means replacing only
// the `classifyWithModel` branch below, not the pipeline around it.

export interface ClassificationResult {
  category: string;
  subcategory: string | null;
  confidence: number; // 0-1
  method: "keyword" | "model" | "fallback";
}

function keywordScore(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const haystack = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw.toLowerCase())) hits++;
  }
  return hits / keywords.length;
}

function classifyByKeywords(taxonomy: ListingTaxonomy, signalText: string): ClassificationResult | null {
  let best: { key: string; score: number } | null = null;
  for (const category of taxonomy.mediaCategories) {
    const allKeywords = Object.values(category.keywords).flat().filter((k): k is string => Boolean(k));
    const score = keywordScore(signalText, allKeywords);
    if (score > 0 && (!best || score > best.score)) best = { key: category.key, score };
  }
  if (!best) return null;
  // Keyword hits are a strong signal (the word "kitchen" literally appeared
  // in OCR text or the filename) but never full certainty on their own.
  const confidence = Math.min(0.9, 0.55 + best.score * 0.35);
  return { category: best.key, subcategory: null, confidence, method: "keyword" };
}

async function classifyWithModel(
  taxonomy: ListingTaxonomy,
  signals: { filename: string; ocrText: string | null; orientation: string; dominantColor: string },
): Promise<ClassificationResult | null> {
  if (!process.env.GROQ_API_KEY) return null;
  const categories = taxonomy.mediaCategories.map((c) => c.key);

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const model = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You classify a real-estate listing photo into exactly one category from a fixed list, using only indirect textual signals (you cannot see the image). " +
            "Be honest about uncertainty: if the signals don't clearly point to one category, pick the most plausible one but give it a low confidence. " +
            `Categories: ${categories.join(", ")}. ` +
            'Respond with strict JSON: {"category": "<one of the categories>", "confidence": <0..1 number>}.',
        },
        {
          role: "user",
          content: `filename: ${signals.filename}\nocr_text: ${signals.ocrText ?? "(none detected)"}\nimage_orientation: ${signals.orientation}\ndominant_color: ${signals.dominantColor}`,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { category?: string; confidence?: number };
    if (!parsed.category || !categories.includes(parsed.category)) return null;
    const confidence = typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5;
    // The model has no visual signal, so its own stated confidence is
    // optimistic relative to what it can actually know — discount it rather
    // than presenting it at face value (spec section 9: never silently
    // convert uncertainty into fact).
    return { category: parsed.category, subcategory: null, confidence: Math.min(confidence, 0.65), method: "model" };
  } catch (error) {
    console.error("[media:classification:model]", error);
    return null;
  }
}

export async function classifyMedia(
  listingKind: string,
  input: { filename: string; ocrText: string | null; orientation: string; dominantColor: string },
): Promise<ClassificationResult> {
  const taxonomy = getTaxonomy(listingKind);
  if (!taxonomy) return { category: "other", subcategory: null, confidence: 0, method: "fallback" };

  const signalText = `${input.filename} ${input.ocrText ?? ""}`;
  const keywordResult = classifyByKeywords(taxonomy, signalText);
  if (keywordResult && keywordResult.confidence >= 0.75) return keywordResult;

  const modelResult = await classifyWithModel(taxonomy, input);
  if (modelResult && (!keywordResult || modelResult.confidence > keywordResult.confidence)) return modelResult;

  return keywordResult ?? { category: "other", subcategory: null, confidence: 0.2, method: "fallback" };
}
