import sharp from "sharp";

// `sharp`'s .d.ts uses `export = sharp` with a merged `declare namespace
// sharp`, which doesn't reliably resolve as a *type* reference
// (`SharpInstance`) under this project's module settings even though the
// *value* import works fine — deriving the type from the function's own
// return type sidesteps that entirely instead of fighting the interop flags.
type SharpInstance = ReturnType<typeof sharp>;

// Deterministic, dependency-cheap image analysis (spec section 3: "do not
// simply upload every file to an LLM"). Everything here is a real algorithm,
// not a model call — sharp/libvips is already a transitive dependency of
// next/image, so this adds zero new infrastructure. This is the "cheap
// layer" the pipeline runs before anything ever reaches the reasoning model
// (spec section 22).

export interface ImageAnalysis {
  widthPx: number;
  heightPx: number;
  orientation: "landscape" | "portrait" | "square";
  /** 0 (very blurry) – 1 (sharp). Laplacian-variance proxy, see computeBlurScore. */
  blurScore: number;
  /** 0–1 composite of resolution + sharpness; what MediaAsset.qualityScore stores. */
  qualityScore: number;
  /** 64-bit difference hash (as hex) for near-duplicate detection — see duplicate-detection.ts. */
  perceptualHash: string;
  dominantColor: { r: number; g: number; b: number };
  /** Re-encoded, size-capped buffer — what actually gets persisted (see storage.ts). */
  normalized: { buffer: Buffer; mimeType: string; widthPx: number; heightPx: number };
}

const MAX_DIMENSION = 2000;

/**
 * dHash (difference hash): resize to 9x8 grayscale, compare each pixel to
 * its right neighbour -> 64 bits. Near-identical images produce hashes with
 * a small Hamming distance even after re-compression/minor cropping, which
 * is exactly the "near-duplicate" case a naive checksum comparison misses.
 */
async function computeDifferenceHash(input: SharpInstance): Promise<string> {
  const { data } = await input
    .clone()
    .resize(9, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left = data[row * 9 + col];
      const right = data[row * 9 + col + 1];
      bits += left < right ? "1" : "0";
    }
  }
  // Pack into hex for compact storage.
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

/**
 * Sharpness proxy: variance of the gradient magnitude on a downscaled
 * grayscale copy. A blurry photo has low-variance gradients (soft edges); a
 * sharp one has high-variance gradients. This is the same idea as
 * Laplacian-variance blur detection (a common OpenCV recipe) implemented
 * without needing OpenCV/Python — sharp's convolve() runs the actual kernel
 * in native code.
 */
async function computeBlurScore(input: SharpInstance): Promise<number> {
  const small = input.clone().resize(320, 320, { fit: "inside", withoutEnlargement: true }).grayscale();
  const edges = await small
    .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0] })
    .raw()
    .toBuffer();

  let mean = 0;
  for (const v of edges) mean += v;
  mean /= edges.length || 1;

  let variance = 0;
  for (const v of edges) variance += (v - mean) ** 2;
  variance /= edges.length || 1;

  // Empirically, real photos land roughly in the 0-2500 variance range for
  // this kernel/downscale combo; clamp+normalize into 0-1 rather than
  // exposing a raw, hard-to-interpret number to callers.
  return Math.max(0, Math.min(1, variance / 800));
}

export async function analyzeImage(buffer: Buffer): Promise<ImageAnalysis> {
  const img = sharp(buffer, { failOn: "none" }).rotate(); // .rotate() with no args = auto-orient from EXIF
  const metadata = await img.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  const [blurScore, perceptualHash, stats] = await Promise.all([
    computeBlurScore(img),
    computeDifferenceHash(img),
    img.clone().stats(),
  ]);

  const dominant = stats.dominant ?? { r: 128, g: 128, b: 128 };
  const resolutionScore = Math.max(0, Math.min(1, (width * height) / (1600 * 1200)));
  const qualityScore = Math.round((blurScore * 0.7 + resolutionScore * 0.3) * 100) / 100;

  const orientation: ImageAnalysis["orientation"] =
    width === height ? "square" : width > height ? "landscape" : "portrait";

  const normalizedImg = img
    .clone()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 });
  const { data: normalizedBuffer, info } = await normalizedImg.toBuffer({ resolveWithObject: true });

  return {
    widthPx: width,
    heightPx: height,
    orientation,
    blurScore: Math.round(blurScore * 100) / 100,
    qualityScore,
    perceptualHash,
    dominantColor: { r: dominant.r, g: dominant.g, b: dominant.b },
    normalized: {
      buffer: normalizedBuffer,
      mimeType: "image/webp",
      widthPx: info.width,
      heightPx: info.height,
    },
  };
}

/** Hamming distance between two same-length hex hashes — 0 = identical. */
export function hammingDistanceHex(a: string, b: string): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      distance += x & 1;
      x >>= 1;
    }
  }
  return distance;
}
