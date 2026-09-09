import { createWorker, type Worker } from "tesseract.js";

// Real OCR via tesseract.js (pure WASM, no vendor account, no per-call cost —
// the appropriate choice here since this Groq account has no vision-capable
// model to lean on instead; see the model-catalog note in
// src/mcp/tools/listings.ts). Lazy singleton worker: spinning one up costs
// real time (WASM + traineddata init), and this module is only ever touched
// from background processing (pipeline.ts via `after()`), never on the hot
// request path.
let workerPromise: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker("eng+ell+fra", undefined, {
      // Without this, tesseract.js caches the ~15MB-per-language
      // .traineddata files in process.cwd() — the repo root for a Next.js
      // server process — which is how eng/ell/fra.traineddata ended up
      // sitting there as untracked files. A dedicated, gitignored cache dir
      // keeps that out of the repo while still avoiding a re-download on
      // every worker init within the same running process/deploy.
      cachePath: "node_modules/.cache/tesseract",
    }).catch((error) => {
      workerPromise = null; // allow retry on next call rather than caching a permanent failure
      throw error;
    });
  }
  return workerPromise;
}

export interface OcrResult {
  text: string;
  confidence: number; // 0-1
}

const OCR_TIMEOUT_MS = 20_000;

/**
 * Fails intelligently (spec section 26): returns null rather than throwing
 * when OCR can't complete in time or the image has no legible text — callers
 * treat a null result as "nothing to extract," not an error to surface.
 */
export async function extractTextFromImage(buffer: Buffer): Promise<OcrResult | null> {
  try {
    const worker = await getWorker();
    const result = await Promise.race([
      worker.recognize(buffer),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("ocr_timeout")), OCR_TIMEOUT_MS)),
    ]);
    const text = result.data.text.trim();
    if (!text) return null;
    return { text, confidence: Math.max(0, Math.min(1, result.data.confidence / 100)) };
  } catch (error) {
    console.error("[media:ocr]", error);
    return null;
  }
}
