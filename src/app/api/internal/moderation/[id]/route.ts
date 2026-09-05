import { z } from "zod";
import { isAuthorizedInternalRequest } from "@/lib/internal-auth";
import { prisma } from "@/lib/db/client";
import type { ModerationStatus } from "@prisma/client";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_CHANGES", "SUSPEND", "FLAG", "ESCALATE"]),
  note: z.string().optional(),
});

const ACTION_TO_STATUS: Record<string, ModerationStatus> = {
  APPROVE: "PUBLISHED",
  REJECT: "REJECTED",
  REQUEST_CHANGES: "CHANGES_REQUESTED",
  SUSPEND: "SUSPENDED",
  FLAG: "FLAGGED",
  ESCALATE: "ESCALATED",
};

const NOTIFICATION_MESSAGE: Record<string, string> = {
  APPROVE: "Your property listing has been approved and published.",
  REJECT: "Your property listing was not approved.",
  REQUEST_CHANGES: "Changes were requested on your property listing.",
  SUSPEND: "Your property listing has been suspended.",
  FLAG: "Your property listing has been flagged for review.",
  ESCALATE: "Your property listing has been escalated for further review.",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthorizedInternalRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const newStatus = ACTION_TO_STATUS[body.action];

  try {
    const item = await prisma.moderationItem.findUnique({ where: { id }, include: { property: true } });
    if (!item) return Response.json({ error: "not_found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.moderationItem.update({
        where: { id },
        data: { status: newStatus, lastAction: body.action, moderatorNote: body.note, decidedAt: new Date() },
      });

      if (item.propertyId) {
        await tx.property.update({ where: { id: item.propertyId }, data: { status: newStatus } });
      }

      if (item.property?.ownerId) {
        await tx.notification.create({
          data: {
            userId: item.property.ownerId,
            message: NOTIFICATION_MESSAGE[body.action] ?? "Your listing status changed.",
          },
        });
      }
    });
  } catch (error) {
    console.error("[internal-moderation-action]", error);
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }

  return Response.json({ ok: true, status: newStatus });
}
