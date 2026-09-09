import { prisma } from "@/lib/db/client";
import { getCurrentUser } from "@/lib/auth/current-user";

type Props = { params: Promise<{ id: string }> };

async function authorizeRead(id: string, sessionIdParam: string | null) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    include: { property: { select: { ownerId: true } } },
  });
  if (!asset) return { asset: null as null, allowed: false };

  const user = await getCurrentUser();
  const ownsDirectly = Boolean(user && asset.userId === user.id);
  const ownsViaProperty = Boolean(user && asset.property?.ownerId === user.id);
  // sessionId is the same client-generated, non-secret identifier already
  // used to scope anonymous chat state (ConversationContext.tsx) — matching
  // it here is consistent with that existing threat model, not a weaker
  // one: ids are unguessable cuids, so this still requires knowing both.
  const matchesSession = Boolean(sessionIdParam && sessionIdParam === asset.sessionId);

  return { asset, allowed: ownsDirectly || ownsViaProperty || matchesSession };
}

// Streams the stored blob — used directly as <img>/<audio>/<video> src in
// the chat UI. Cached aggressively: MediaAsset rows are immutable once
// written (a re-upload creates a new id), so the content behind any given
// id never changes.
export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const url = new URL(request.url);
  const sessionIdParam = url.searchParams.get("sessionId");

  if (url.searchParams.get("status") === "1") {
    const { asset, allowed } = await authorizeRead(id, sessionIdParam);
    if (!asset || !allowed) return Response.json({ error: "Not found." }, { status: 404 });
    return Response.json({
      id: asset.id,
      processingStatus: asset.processingStatus,
      mediaKind: asset.mediaKind,
      detectedCategory: asset.detectedCategory,
      detectedSubcategory: asset.detectedSubcategory,
      categoryConfidence: asset.categoryConfidence,
      extractedText: asset.extractedText,
      transcript: asset.transcript,
      aiDescription: asset.aiDescription,
      qualityScore: asset.qualityScore,
      blurScore: asset.blurScore,
      orientation: asset.orientation,
      duplicateGroup: asset.duplicateGroup,
      userConfirmed: asset.userConfirmed,
      errorMessage: asset.errorMessage,
      widthPx: asset.widthPx,
      heightPx: asset.heightPx,
    });
  }

  const { asset, allowed } = await authorizeRead(id, sessionIdParam);
  if (!asset || !allowed) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.sizeBytes),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

// Lets the user correct an AI classification (spec section 9: the user must
// be able to override AI decisions) or link a previously-unassigned upload
// to a listing draft once one exists.
export async function PATCH(request: Request, { params }: Props) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid request." }, { status: 400 });

  const sessionIdParam = typeof body.sessionId === "string" ? body.sessionId : null;
  const { asset, allowed } = await authorizeRead(id, sessionIdParam);
  if (!asset || !allowed) return Response.json({ error: "Not found." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.detectedCategory === "string") {
    data.detectedCategory = body.detectedCategory;
    data.userConfirmed = true;
    data.categoryConfidence = 1;
  }
  if (typeof body.propertyId === "string") {
    const user = await getCurrentUser();
    const property = await prisma.property.findUnique({ where: { id: body.propertyId }, select: { ownerId: true } });
    if (!property || property.ownerId !== user?.id) {
      return Response.json({ error: "Not authorized to attach media to that listing." }, { status: 403 });
    }
    data.propertyId = body.propertyId;
    data.listingKind = "PROPERTY";
  }
  if (Object.keys(data).length === 0) return Response.json({ error: "Nothing to update." }, { status: 400 });

  const updated = await prisma.mediaAsset.update({ where: { id }, data });
  return Response.json({ id: updated.id, detectedCategory: updated.detectedCategory, userConfirmed: updated.userConfirmed });
}
