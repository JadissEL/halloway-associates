import { getSession } from "@/lib/auth/session";
import { listConversations } from "@/lib/chat/conversations";
import { prisma } from "@/lib/db/client";

const TERMINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "unauthenticated" }, { status: 401 });
  }

  let rooms: Awaited<ReturnType<typeof prisma.requestRoom.findMany>> = [];
  let savedItems: Awaited<ReturnType<typeof prisma.savedItem.findMany>> = [];
  try {
    [rooms, savedItems] = await Promise.all([
      prisma.requestRoom.findMany({
        where: { userId: session.userId },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.savedItem.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
  } catch (error) {
    console.error("[account-requests]", error);
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }

  // Isolated from the request-room query: if this migration hasn't been
  // applied yet, Recent/In progress/Saved/History for rooms and saved items
  // still render. Chats simply don't appear until the table exists.
  let conversations: Awaited<ReturnType<typeof listConversations>> = [];
  try {
    conversations = await listConversations(session.userId);
  } catch (error) {
    console.error("[account-requests:conversations]", error);
  }

  const serialized = rooms.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return Response.json({
    recent: serialized.slice(0, 5),
    active: serialized.filter((r) => !TERMINAL_STATUSES.has(r.status)),
    history: serialized.filter((r) => TERMINAL_STATUSES.has(r.status)),
    saved: savedItems.map((s) => ({ itemType: s.itemType, itemId: s.itemId })),
    conversations,
  });
}
