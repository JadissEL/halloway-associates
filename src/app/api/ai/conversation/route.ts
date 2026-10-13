import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/current-user";
import { detectLanguage } from "@/lib/ai/language";
import { routeDeterministically } from "@/lib/ai/router";
import { retrieveKnowledge } from "@/lib/ai/knowledge/retrieve";
import { buildConciergeSystemPrompt } from "@/lib/ai/system-prompt";
import { runConcierge, confirmConciergeAction } from "@/lib/ai/groq-client";
import { logAiUsage } from "@/lib/ai/usage-log";
import { isRateLimited, clientIp } from "@/lib/rate-limit";
import { identityFromUser } from "@/mcp/authorize";
import { buildAttachmentContext } from "@/lib/media/context";
import {
  ConversationNotFoundError,
  activePropertyIdFromWorkspace,
  beginConversationTurn,
  finishConversationTurn,
  type StoredWorkspace,
  type TurnMessage,
} from "@/lib/chat/conversations";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
        // Media ids from /api/media/upload the user attached to THIS
        // message (spec section 13: attachments join the active
        // conversational context, not a disconnected file list).
        attachmentIds: z.array(z.string().min(1).max(64)).max(20).optional(),
      }),
    )
    .min(1)
    .max(40)
    .optional(),
  // Present instead of `messages` when the user is confirming a previously
  // proposed action (see ConversationPanel.tsx's Confirm button) rather than
  // sending a new chat message.
  confirmationId: z.string().min(1).max(64).optional(),
  // Omitted on the first turn. When set, the transcript already stored for
  // this user is what the model sees — the client array is only how the new
  // user message arrives, and a conversation the caller doesn't own 404s.
  conversationId: z.string().min(1).max(64).optional(),
  locale: z.enum(["en", "el", "fr"]),
  sessionId: z.string().min(8).max(64),
  // The property draft this conversation is currently working on, if any —
  // set client-side once a "listingDraft" workspace payload reveals a real
  // id (see ConversationContext.tsx), and echoed back on every subsequent
  // turn so the model doesn't need the user to remember/type an opaque
  // database id for get/update/submit_property_draft (confirmed missing
  // live: without this, asking a follow-up like "what's still missing on
  // my draft?" made the model ask the user for the id instead of just
  // knowing it, since a confirmed tool's result never re-enters the
  // conversation's own message history — only this plain-text reply does).
  activePropertyId: z.string().min(1).max(64).optional(),
});

export interface WorkspacePayload {
  type: "properties" | "professionals" | "requestRoom" | "callSlots" | "callBooking" | "listingDraft" | "mediaGallery";
  data: unknown;
}

function deriveWorkspacePayload(
  toolCalls: { name: string; result: object }[],
): WorkspacePayload | null {
  // Last matching tool call wins — the most recent thing the user asked about.
  for (let i = toolCalls.length - 1; i >= 0; i--) {
    const { name, result } = toolCalls[i];
    // A MEDIUM-risk tool's result is a *proposal*, not a resource, until
    // it's confirmed (tool-runtime.ts's confirmation gate) — WorkspacePanel's
    // requestRoom/callBooking cards expect real {roomId,status}/
    // {bookingId,...} fields, so showing a still-pending proposal there
    // rendered them blank/"undefined" rather than the pendingConfirmation
    // banner that's already shown above the input for this exact case.
    if ("pendingConfirmation" in result) continue;
    if (name === "search_properties") return { type: "properties", data: result };
    if (name === "find_professionals") return { type: "professionals", data: result };
    if (name === "create_lawyer_request") return { type: "requestRoom", data: result };
    if (name === "get_available_call_slots") return { type: "callSlots", data: result };
    if (name === "create_call_booking") return { type: "callBooking", data: result };
    if (
      name === "create_property_draft" ||
      name === "update_property_draft" ||
      name === "get_property_draft_status"
    )
      return { type: "listingDraft", data: result };
    if (name === "get_media_analysis") return { type: "mediaGallery", data: result };
  }
  return null;
}

async function groundMessages(messages: TurnMessage[]) {
  return Promise.all(
    messages.map(async (message) => {
      if (!message.attachmentIds || message.attachmentIds.length === 0) {
        return { role: message.role, content: message.content };
      }
      const context = await buildAttachmentContext(message.attachmentIds).catch(() => "");
      return {
        role: message.role,
        content: context ? `${message.content}\n${context}` : message.content,
      };
    }),
  );
}

// Persistence is best-effort: a database miss must not swallow a reply the
// model already produced. Ownership is re-checked inside finishConversationTurn.
async function saveAssistantReply(input: {
  userId: string;
  conversationId: string | null;
  reply: string;
  workspace: StoredWorkspace | null;
  activePropertyId?: string | null;
}): Promise<string | null> {
  if (!input.conversationId) return null;
  try {
    const saved = await finishConversationTurn({
      userId: input.userId,
      conversationId: input.conversationId,
      assistantContent: input.reply,
      workspace: input.workspace,
      activePropertyId: input.activePropertyId,
    });
    return saved ? input.conversationId : null;
  } catch (error) {
    console.error("[concierge-conversation]", error);
    return input.conversationId;
  }
}

export async function POST(request: Request) {
  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body.messages && !body.confirmationId) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Rate-limit before the auth check (cheap, no DB hit) so an anonymous
  // flood can't force a user lookup per request either.
  const ip = clientIp(request.headers);
  if (
    isRateLimited(`ai-session:${body.sessionId}`, 30, 5 * 60 * 1000) ||
    isRateLimited(`ai-ip:${ip}`, 60, 5 * 60 * 1000)
  ) {
    return Response.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  // Authorization-sensitive from here on (every path either calls an MCP
  // tool or confirms one) — a fresh DB-backed identity, not just the session
  // cookie's userId/email, per the documented pattern in current-user.ts.
  const user = await getCurrentUser();

  // The AI concierge is a signed-in-only surface (product decision: browsing
  // listings stays open to anyone, but talking to the concierge — which can
  // search on the user's behalf, book calls, and create/manage listings —
  // requires an account). Enforced here, not just by AppPage.tsx hiding the
  // chat UI for a signed-out visitor: a page-level gate alone doesn't stop
  // someone calling this endpoint directly, and every real tool invocation
  // in this codebase is authorized at the API boundary, not the UI's say-so.
  if (!user) {
    return Response.json({ error: "Sign in required.", requiresSignIn: true }, { status: 401 });
  }

  const identity = identityFromUser(user, body.locale, body.sessionId);

  // --- Confirming a previously proposed action -----------------------------
  if (body.confirmationId) {
    const outcome = await confirmConciergeAction(body.confirmationId, identity);
    if (outcome.status === "not_found") {
      const reply =
        body.locale === "el"
          ? "Αυτή η επιβεβαίωση έληξε ή δεν βρέθηκε. Πείτε μου ξανά τι θα θέλατε να κάνω."
          : body.locale === "fr"
            ? "Cette confirmation a expiré ou est introuvable. Dites-moi à nouveau ce que vous aimeriez faire."
            : "That confirmation expired or wasn't found. Tell me again what you'd like to do.";
      const conversationId = await saveAssistantReply({
        userId: user.id,
        conversationId: body.conversationId ?? null,
        reply,
        workspace: null,
        activePropertyId: body.activePropertyId,
      });
      return Response.json({
        reply,
        replyLocale: body.locale,
        layer: "REASONING",
        workspace: null,
        pendingConfirmation: null,
        conversationId,
      });
    }
    const workspace = deriveWorkspacePayload([{ name: outcome.toolName, result: outcome.result }]);
    const reply = outcome.isError
      ? (body.locale === "el" ? "Δεν μπόρεσα να το ολοκληρώσω. Δοκιμάστε ξανά σε λίγο." : body.locale === "fr" ? "Je n'ai pas pu terminer cette action. Réessayez sous peu." : "I couldn't complete that — please try again shortly.")
      : (body.locale === "el" ? "Έγινε." : body.locale === "fr" ? "C'est fait." : "Done.");
    const conversationId = await saveAssistantReply({
      userId: user.id,
      conversationId: body.conversationId ?? null,
      reply,
      workspace,
      activePropertyId: activePropertyIdFromWorkspace(workspace) ?? body.activePropertyId,
    });
    return Response.json({
      reply,
      replyLocale: body.locale,
      layer: "REASONING",
      workspace,
      pendingConfirmation: null,
      conversationId,
    });
  }

  // --- Normal chat turn ------------------------------------------------------
  const messages = body.messages!;
  let conversationId: string | null = body.conversationId ?? null;
  let history: TurnMessage[] = messages.map((message) => ({
    role: message.role,
    content: message.content,
    ...(message.attachmentIds ? { attachmentIds: message.attachmentIds } : {}),
  }));

  try {
    const turn = await beginConversationTurn({
      userId: user.id,
      conversationId: body.conversationId,
      sessionId: body.sessionId,
      locale: body.locale,
      activePropertyId: body.activePropertyId,
      incoming: history,
    });
    conversationId = turn.conversationId;
    // Once a transcript exists, it — not the client array — is the context
    // sent to the model. The caller can only append to a conversation they own.
    history = turn.history;
    if (turn.activePropertyId) body = { ...body, activePropertyId: turn.activePropertyId };
  } catch (error) {
    if (error instanceof ConversationNotFoundError) {
      return Response.json({ error: "Not found." }, { status: 404 });
    }
    console.error("[concierge-conversation]", error);
    conversationId = null;
  }

  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  const { replyLocale } = detectLanguage(lastUserMessage?.content ?? "", body.locale);
  const hasAttachments = history.some((m) => m.attachmentIds && m.attachmentIds.length > 0);

  // Layer 1 — deterministic, zero model tokens. Skipped when media is
  // attached: a canned keyword-matched reply can't account for what was
  // just uploaded, so this turn always needs the reasoning layer to look at
  // the attachment analysis (via buildAttachmentContext below).
  const deterministic = hasAttachments ? { handled: false as const } : routeDeterministically(lastUserMessage?.content ?? "", replyLocale);
  if (deterministic.handled) {
    await logAiUsage({ sessionId: body.sessionId, userId: user?.id, layer: "DETERMINISTIC" }).catch(
      (error) => {
        console.error("[ai-conversation:usage]", error);
      },
    );
    const savedId = await saveAssistantReply({
      userId: user.id,
      conversationId,
      reply: deterministic.reply,
      workspace: null,
      activePropertyId: body.activePropertyId,
    });
    return Response.json({
      reply: deterministic.reply,
      replyLocale,
      layer: "DETERMINISTIC",
      workspace: null,
      pendingConfirmation: null,
      conversationId: savedId,
    });
  }

  // Layer 3 — retrieval, still no reasoning-model call yet, feeds the prompt.
  // A knowledge-layer failure (e.g. DB unreachable) shouldn't block the whole
  // reply — the concierge can still help without extra grounding, it just
  // won't state anything it can't back up (see the system prompt's rules).
  const knowledgeHits = await retrieveKnowledge(lastUserMessage?.content ?? "", { locale: replyLocale }).catch(
    (error) => {
      console.error("[ai-conversation:knowledge]", error);
      return [];
    },
  );

  // Layer 4 — full reasoning + tool-calling, only now that layers 1-3 couldn't resolve it.
  const systemPrompt = buildConciergeSystemPrompt({
    replyLocale,
    isSignedIn: Boolean(user),
    knowledgeHits,
    activePropertyId: body.activePropertyId,
  });

  // Ground each message that has attachments with its media analysis
  // results before they reach the reasoning model (spec sections 13/22) —
  // built server-side from already-computed pipeline output, never raw
  // bytes, and marked as untrusted data (see buildAttachmentContext).
  // History here is the stored transcript (plus this turn), so reopening a
  // chat and continuing it replays the same context the model had before.
  const groundedMessages = await groundMessages(history);

  const startedAt = Date.now();
  try {
    const result = await runConcierge(systemPrompt, groundedMessages, { ...identity, locale: replyLocale });

    await logAiUsage({
      sessionId: body.sessionId,
      userId: user?.id,
      layer: "REASONING",
      model: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      latencyMs: Date.now() - startedAt,
      toolCalls: result.toolCalls.map((t) => ({ name: t.name })),
    });

    const workspace = deriveWorkspacePayload(result.toolCalls);
    const savedId = await saveAssistantReply({
      userId: user.id,
      conversationId,
      reply: result.reply,
      workspace,
      activePropertyId: activePropertyIdFromWorkspace(workspace) ?? body.activePropertyId,
    });

    return Response.json({
      reply: result.reply,
      replyLocale,
      layer: "REASONING",
      workspace,
      pendingConfirmation: result.pendingConfirmation,
      conversationId: savedId,
    });
  } catch (error) {
    console.error("[ai-conversation]", error);
    return Response.json({ error: "Concierge unavailable.", conversationId }, { status: 502 });
  }
}
