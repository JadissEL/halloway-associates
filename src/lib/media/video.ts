import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

// Real keyframe extraction via a bundled ffmpeg binary (ffmpeg-static) — no
// system install, no API cost, the same "real npm dependency, zero vendor
// account" pattern already used for images (sharp) and OCR (tesseract.js).
// This is what makes VIDEO_UNDERSTANDING (spec section 14) real instead of
// the honest "not implemented yet" it was before: intelligent sampling at a
// handful of evenly-spaced timestamps, not every frame, so cost stays
// bounded regardless of video length.

const PROBE_TIMEOUT_MS = 15_000;
const EXTRACT_TIMEOUT_MS = 15_000;
const KEYFRAME_FRACTIONS = [0.08, 0.25, 0.45, 0.65, 0.85] as const;

export interface VideoKeyframe {
  atMs: number;
  buffer: Buffer;
}

function parseDurationFromStderr(stderr: string): number | null {
  const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const [, hh, mm, ss] = match;
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
}

async function probeDurationSeconds(filePath: string): Promise<number | null> {
  // ffmpeg (not ffprobe -- ffmpeg-static only bundles the former) always
  // prints an "Input #0, ... Duration: HH:MM:SS.ss" banner to stderr while
  // decoding, on both a clean exit AND a non-zero one -- `-f null -` (decode
  // fully, discard output) exits 0 for a well-formed file, so the Duration
  // line has to be read from the success path's stderr, not assumed to only
  // appear alongside a thrown error.
  try {
    const { stderr } = await execFileAsync(ffmpegPath as string, ["-i", filePath, "-f", "null", "-"], {
      timeout: PROBE_TIMEOUT_MS,
    });
    return parseDurationFromStderr(stderr);
  } catch (error) {
    return parseDurationFromStderr((error as { stderr?: string }).stderr ?? "");
  }
}

async function extractFrameAt(filePath: string, atSeconds: number, outPath: string): Promise<Buffer | null> {
  try {
    // -ss before -i seeks fast (keyframe-aligned, not frame-accurate) --
    // fine here, a couple hundred ms of drift doesn't matter for scene
    // sampling. -q:v 3 keeps JPEG quality high without maximizing size.
    await execFileAsync(
      ffmpegPath as string,
      ["-ss", String(atSeconds), "-i", filePath, "-frames:v", "1", "-q:v", "3", "-y", outPath],
      { timeout: EXTRACT_TIMEOUT_MS },
    );
    return await readFile(outPath);
  } catch (error) {
    console.error("[media:video:extract-frame]", error);
    return null;
  }
}

/**
 * Fails intelligently: returns an empty array (never throws) when the
 * container/codec can't be probed or every extraction attempt fails --
 * callers treat that exactly like "no deep video analysis available,"
 * which is the honest pre-existing behavior, not a crash.
 */
export async function extractKeyframes(buffer: Buffer, maxFrames = KEYFRAME_FRACTIONS.length): Promise<VideoKeyframe[]> {
  if (!ffmpegPath) return [];
  const dir = await mkdtemp(join(tmpdir(), "halloway-video-"));
  const inputPath = join(dir, "input.mp4");
  try {
    await writeFile(inputPath, buffer);
    const duration = await probeDurationSeconds(inputPath);
    if (!duration || duration <= 0) return [];

    const fractions = KEYFRAME_FRACTIONS.slice(0, maxFrames);
    const frames: VideoKeyframe[] = [];
    // Sequential, not Promise.all: ffmpeg seeks are CPU-bound and this runs
    // in background processing already (pipeline.ts via after()) -- no
    // reason to spike concurrent CPU load for a few seconds of savings.
    for (let i = 0; i < fractions.length; i++) {
      const atSeconds = duration * fractions[i];
      const outPath = join(dir, `frame-${i}.jpg`);
      const frameBuffer = await extractFrameAt(inputPath, atSeconds, outPath);
      if (frameBuffer) frames.push({ atMs: Math.round(atSeconds * 1000), buffer: frameBuffer });
    }
    return frames;
  } catch (error) {
    console.error("[media:video:extract-keyframes]", error);
    return [];
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
