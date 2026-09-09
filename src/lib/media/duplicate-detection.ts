import { prisma } from "@/lib/db/client";
import { hammingDistanceHex } from "./image-analysis";

// Exact duplicates are caught at upload time via checksum (storage.ts).
// This catches near-duplicates — the same shot taken twice, a slightly
// cropped re-export, a screenshot of the same photo — via perceptual-hash
// Hamming distance, which checksum comparison can never see.
const NEAR_DUPLICATE_THRESHOLD = 8; // out of 64 bits; empirically tight enough to avoid false positives between genuinely different rooms

export async function detectDuplicateGroup(
  sessionId: string,
  propertyId: string | null,
  perceptualHash: string,
  currentId: string,
): Promise<string | null> {
  const candidates = await prisma.mediaAsset.findMany({
    where: {
      id: { not: currentId },
      perceptualHash: { not: null },
      OR: [{ sessionId }, ...(propertyId ? [{ propertyId }] : [])],
    },
    select: { id: true, perceptualHash: true, duplicateGroup: true },
    take: 200,
  });

  for (const candidate of candidates) {
    if (!candidate.perceptualHash) continue;
    if (hammingDistanceHex(candidate.perceptualHash, perceptualHash) <= NEAR_DUPLICATE_THRESHOLD) {
      // Reuse the candidate's existing group if it already has one (a third
      // near-duplicate joining an established pair), otherwise mint a new
      // group id from the two members that just matched.
      const groupId = candidate.duplicateGroup ?? `dup_${candidate.id}`;
      if (!candidate.duplicateGroup) {
        await prisma.mediaAsset.update({ where: { id: candidate.id }, data: { duplicateGroup: groupId } });
      }
      return groupId;
    }
  }
  return null;
}
