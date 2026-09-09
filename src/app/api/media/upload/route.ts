import { after } from "next/server";
import { prisma } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isRateLimited, clientIp } from "@/lib/rate-limit";
import { mediaKindFromMime, checksumOf, findDuplicateByChecksum, MAX_SIZE_BYTES } from "@/lib/media/storage";
import { runFastAnalysis, runDeepAnalysis } from "@/lib/media/pipeline";

// The chat's multimodal attach endpoint. Deliberately a plain REST route,
// not an MCP tool: MCP tools operate on small JSON args the model
// constructs, not binary uploads — the model never sees or handles raw
// bytes here, it only ever gets back the structured analysis result via
// get_media_analysis (src/mcp/tools/listings.ts), same as every other
// tool result. Requires sign-in like /api/ai/conversation now does — the
// AI concierge (chat + attachments) is a signed-in-only surface; browsing
// listings is the part of the platform that stays open to anyone.

const MAX_UPLOAD_BODY_BYTES = 32 * 1024 * 1024;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_UPLOAD_BODY_BYTES) {
    return Response.json({ error: "File too large." }, { status: 413 });
  }

  const ip = clientIp(request.headers);
  if (isRateLimited(`media-upload-ip:${ip}`, 40, 10 * 60 * 1000)) {
    return Response.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = form.get("file");
  const sessionId = form.get("sessionId");
  const listingKind = form.get("listingKind");
  const propertyId = form.get("propertyId");

  if (!(file instanceof File) || typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 64) {
    return Response.json({ error: "Invalid upload." }, { status: 400 });
  }

  if (isRateLimited(`media-upload-session:${sessionId}`, 60, 10 * 60 * 1000)) {
    return Response.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
  }

  const mediaKind = mediaKindFromMime(file.type);
  if (!mediaKind) {
    return Response.json({ error: `Unsupported file type: ${file.type || "unknown"}.` }, { status: 415 });
  }
  if (file.size > MAX_SIZE_BYTES[mediaKind]) {
    return Response.json(
      { error: `File too large for ${mediaKind.toLowerCase()} (max ${Math.round(MAX_SIZE_BYTES[mediaKind] / (1024 * 1024))}MB).` },
      { status: 413 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in required.", requiresSignIn: true }, { status: 401 });
  }

  // Ownership: a caller may only attach media to a propertyId they own —
  // the same ownership model every MCP tool uses (authorize.ts), enforced
  // here too since this route bypasses the MCP layer entirely.
  let resolvedPropertyId: string | null = null;
  if (typeof propertyId === "string" && propertyId) {
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { ownerId: true } });
    if (!property || property.ownerId !== user?.id) {
      return Response.json({ error: "Not authorized to attach media to that listing." }, { status: 403 });
    }
    resolvedPropertyId = propertyId;
  }

  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);
  const checksum = checksumOf(rawBuffer);

  const existing = await findDuplicateByChecksum(sessionId, checksum);
  if (existing) {
    return Response.json({
      id: existing.id,
      mediaKind: existing.mediaKind,
      processingStatus: existing.processingStatus,
      duplicate: true,
      previewUrl: `/api/media/${existing.id}`,
    });
  }

  let fast;
  try {
    fast = await runFastAnalysis(mediaKind, rawBuffer);
  } catch (error) {
    console.error("[media:upload:fast-analysis]", error);
    return Response.json({ error: "That file couldn't be processed — please try a different one." }, { status: 422 });
  }

  const created = await prisma.mediaAsset.create({
    data: {
      sessionId,
      userId: user?.id ?? null,
      listingKind: typeof listingKind === "string" && listingKind ? (listingKind as "PROPERTY") : null,
      propertyId: resolvedPropertyId,
      mediaKind,
      originalFilename: file.name || `upload.${mediaKind.toLowerCase()}`,
      mimeType: fast.normalizedMimeType || file.type,
      sizeBytes: fast.normalizedBuffer.length,
      data: new Uint8Array(fast.normalizedBuffer),
      checksum,
      widthPx: fast.widthPx,
      heightPx: fast.heightPx,
      qualityScore: fast.qualityScore,
      blurScore: fast.blurScore,
      orientation: fast.orientation,
      perceptualHash: fast.perceptualHash,
      processingStatus: "UPLOADED",
    },
  });

  // Deferred, slower analysis (OCR/classification/transcription) runs after
  // this response is sent — the user sees the thumbnail + fast metadata
  // immediately, then the UI polls /api/media/[id] for the ANALYZED result.
  after(() => runDeepAnalysis(created.id));

  return Response.json({
    id: created.id,
    mediaKind: created.mediaKind,
    processingStatus: created.processingStatus,
    widthPx: created.widthPx,
    heightPx: created.heightPx,
    qualityScore: created.qualityScore,
    orientation: created.orientation,
    previewUrl: `/api/media/${created.id}`,
  });
}
