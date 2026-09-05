import { isAuthorizedInternalRequest } from "@/lib/internal-auth";
import { prisma } from "@/lib/db/client";

export async function GET(request: Request) {
  if (!isAuthorizedInternalRequest(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const items = await prisma.moderationItem.findMany({
    where: { status: { in: ["PENDING_REVIEW", "FLAGGED", "ESCALATED"] } },
    include: { property: true },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({
    items: items.map((item) => ({
      id: item.id,
      contentType: item.contentType,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      property: item.property
        ? {
            id: item.property.id,
            title: item.property.title,
            city: item.property.city,
            priceAmount: item.property.priceAmount,
            currency: item.property.currency,
            isDemo: item.property.isDemo,
          }
        : null,
    })),
  });
}
