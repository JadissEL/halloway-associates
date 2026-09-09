import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/client";
import type { MediaKind } from "@prisma/client";

// Storage backend for uploaded chat media: Postgres `bytea` via the existing
// Neon connection, not a new object-storage vendor (see the comment on
// MediaAsset in prisma/schema.prisma for why). Every read/write in the
// pipeline goes through this one module — swapping to S3/R2 later means
// rewriting saveMedia/readMediaBlob, nothing else.

export const ACCEPTED_MIME: Record<MediaKind, string[]> = {
  IMAGE: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"],
  AUDIO: ["audio/webm", "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/m4a", "audio/x-m4a"],
  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
  DOCUMENT: ["application/pdf"],
};

// Hard caps chosen for a Postgres-bytea backend, not a CDN-fronted bucket —
// generous enough for real phone photos/voice notes/short walkthroughs,
// small enough that a single row never threatens query/backup performance.
export const MAX_SIZE_BYTES: Record<MediaKind, number> = {
  IMAGE: 15 * 1024 * 1024,
  AUDIO: 20 * 1024 * 1024,
  VIDEO: 30 * 1024 * 1024,
  DOCUMENT: 15 * 1024 * 1024,
};

export function mediaKindFromMime(mimeType: string): MediaKind | null {
  for (const kind of Object.keys(ACCEPTED_MIME) as MediaKind[]) {
    if (ACCEPTED_MIME[kind].includes(mimeType)) return kind;
  }
  return null;
}

export function checksumOf(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function findDuplicateByChecksum(sessionId: string, checksum: string) {
  return prisma.mediaAsset.findFirst({
    where: { sessionId, checksum },
    orderBy: { createdAt: "desc" },
  });
}

export async function readMediaBlob(id: string): Promise<{ data: Buffer; mimeType: string; filename: string } | null> {
  const row = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { data: true, mimeType: true, originalFilename: true },
  });
  if (!row) return null;
  return { data: Buffer.from(row.data), mimeType: row.mimeType, filename: row.originalFilename };
}
