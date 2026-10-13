import { getCurrentUser } from "@/lib/auth/current-user";
import { getOwnedConversation } from "@/lib/chat/conversations";

type Props = { params: Promise<{ id: string }> };

// Owner-only read of a saved concierge transcript. A missing row and a row
// owned by someone else both 404 — the id is not proof of access.
export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  if (!id || id.length > 64) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Sign in required.", requiresSignIn: true }, { status: 401 });
  }

  try {
    const conversation = await getOwnedConversation(user.id, id);
    if (!conversation) return Response.json({ error: "Not found." }, { status: 404 });
    return Response.json(conversation);
  } catch (error) {
    console.error("[ai-conversation:get]", error);
    return Response.json({ error: "service_unavailable" }, { status: 503 });
  }
}
