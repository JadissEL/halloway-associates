import { Prisma, type ConciergeMessage } from "@prisma/client";
import { prisma } from "@/lib/db/client";

// How many prior messages are replayed to the model. The browser used to
// keep the last 40 in sessionStorage and the route rejected anything past
// 30; 40 is that same window, now loaded from the database so a resumed
// chat continues with the turns the model already saw. The full transcript
// (capped below) is what the sidebar reopens.
const MODEL_HISTORY_LIMIT = 40;
const STORED_MESSAGE_LIMIT = 200;
const TITLE_MAX = 72;
const WORKSPACE_JSON_MAX = 200_000;

const WORKSPACE_TYPES = new Set([
  "properties",
  "professionals",
  "requestRoom",
  "callSlots",
  "callBooking",
  "listingDraft",
  "mediaGallery",
]);

const MEDIA_KINDS = new Set(["IMAGE", "AUDIO", "VIDEO", "DOCUMENT"]);

const UNTITLED: Record<string, string> = {
  en: "New conversation",
  fr: "Nouvelle conversation",
  el: "Νέα συνομιλία",
};

const ATTACHMENT_TITLE: Record<string, string> = {
  en: "Attachment",
  fr: "Pièce jointe",
  el: "Συνημμένο",
};

export interface StoredWorkspace {
  type: "properties" | "professionals" | "requestRoom" | "callSlots" | "callBooking" | "listingDraft" | "mediaGallery";
  data: unknown;
}

export interface StoredAttachment {
  id: string;
  mediaKind: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  detectedCategory: string | null;
}

export interface TurnMessage {
  role: "user" | "assistant";
  content: string;
  attachmentIds?: string[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  locale: string;
  activePropertyId: string | null;
  workspace: StoredWorkspace | null;
  updatedAt: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    attachments?: Array<StoredAttachment & { previewUrl: string }>;
  }>;
}

export class ConversationNotFoundError extends Error {
  constructor() {
    super("Conversation not found.");
    this.name = "ConversationNotFoundError";
  }
}

export function deriveConversationTitle(text: string, locale: string, hasAttachments = false): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const placeholder = cleaned.length === 0 || cleaned === "(sent an attachment)";
  if (placeholder) {
    if (hasAttachments) return ATTACHMENT_TITLE[locale] ?? ATTACHMENT_TITLE.en;
    return UNTITLED[locale] ?? UNTITLED.en;
  }
  const firstLine = cleaned.split("\n")[0] ?? cleaned;
  if (firstLine.length <= TITLE_MAX) return firstLine;
  return `${firstLine.slice(0, TITLE_MAX - 1).trimEnd()}…`;
}

export function parseWorkspace(value: unknown): StoredWorkspace | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const type = "type" in value && typeof value.type === "string" ? value.type : null;
  if (!type || !WORKSPACE_TYPES.has(type)) return null;
  const data = "data" in value ? value.data : null;
  return { type: type as StoredWorkspace["type"], data };
}

export function activePropertyIdFromWorkspace(workspace: StoredWorkspace | null): string | null {
  if (!workspace || workspace.type !== "listingDraft") return null;
  const draft = (workspace.data as { draft?: { id?: unknown } } | undefined)?.draft;
  return typeof draft?.id === "string" ? draft.id : null;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function readAttachments(value: Prisma.JsonValue | null): StoredAttachment[] {
  if (!Array.isArray(value)) return [];
  const out: StoredAttachment[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const id = "id" in item && typeof item.id === "string" ? item.id : null;
    const mediaKind = "mediaKind" in item && typeof item.mediaKind === "string" ? item.mediaKind : null;
    if (!id || !mediaKind || !MEDIA_KINDS.has(mediaKind)) continue;
    const detected =
      "detectedCategory" in item && typeof item.detectedCategory === "string" ? item.detectedCategory : null;
    out.push({
      id,
      mediaKind: mediaKind as StoredAttachment["mediaKind"],
      detectedCategory: detected,
    });
  }
  return out;
}

function attachmentIdsOf(message: ConciergeMessage): string[] {
  return readAttachments(message.attachments).map((item) => item.id);
}

function sameAttachmentIds(stored: ConciergeMessage, incoming: string[] | undefined): boolean {
  const left = attachmentIdsOf(stored);
  const right = incoming ?? [];
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

async function resolveAttachments(
  ids: string[] | undefined,
  userId: string,
  sessionId: string,
): Promise<StoredAttachment[] | undefined> {
  if (!ids || ids.length === 0) return undefined;
  const unique = [...new Set(ids)].slice(0, 20);
  const assets = await prisma.mediaAsset.findMany({
    where: { id: { in: unique }, OR: [{ userId }, { sessionId }] },
    select: { id: true, mediaKind: true, detectedCategory: true },
  });
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  const ordered = unique.flatMap((id) => {
    const asset = byId.get(id);
    if (!asset || !MEDIA_KINDS.has(asset.mediaKind)) return [];
    return [
      {
        id: asset.id,
        mediaKind: asset.mediaKind as StoredAttachment["mediaKind"],
        detectedCategory: asset.detectedCategory,
      },
    ];
  });
  return ordered.length > 0 ? ordered : undefined;
}

function toTurnMessage(message: ConciergeMessage): TurnMessage {
  const attachmentIds = attachmentIdsOf(message);
  return {
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    ...(attachmentIds.length > 0 ? { attachmentIds } : {}),
  };
}

function chronological(messages: ConciergeMessage[]): ConciergeMessage[] {
  return [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id));
}

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const rows = await prisma.conciergeConversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: { id: true, title: true, updatedAt: true },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getOwnedConversation(userId: string, id: string): Promise<ConversationDetail | null> {
  const conversation = await prisma.conciergeConversation.findFirst({
    where: { id, userId },
  });
  if (!conversation) return null;

  const newest = await prisma.conciergeMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: STORED_MESSAGE_LIMIT,
  });
  const messages = chronological(newest).map((message) => {
    const attachments = readAttachments(message.attachments);
    return {
      role: message.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: message.content,
      ...(attachments.length > 0
        ? {
            attachments: attachments.map((item) => ({
              ...item,
              previewUrl: `/api/media/${item.id}`,
            })),
          }
        : {}),
    };
  });

  return {
    id: conversation.id,
    title: conversation.title,
    locale: conversation.locale,
    activePropertyId: conversation.activePropertyId,
    workspace: parseWorkspace(conversation.workspace),
    updatedAt: conversation.updatedAt.toISOString(),
    messages,
  };
}

export interface BeginTurnInput {
  userId: string;
  conversationId?: string;
  sessionId: string;
  locale: string;
  activePropertyId?: string;
  incoming: TurnMessage[];
}

export interface BeginTurnResult {
  conversationId: string;
  history: TurnMessage[];
  activePropertyId?: string;
}

// Creates the conversation on the first turn, or appends only the new user
// message when one already exists. Earlier rows are never rewritten from
// the client payload — the database transcript is what the model sees.
export async function beginConversationTurn(input: BeginTurnInput): Promise<BeginTurnResult> {
  const incoming = input.incoming.filter((message) => message.content.trim().length > 0).slice(-MODEL_HISTORY_LIMIT);
  if (incoming.length === 0) {
    throw new Error("No message to persist.");
  }

  if (!input.conversationId) {
    const firstUser = incoming.find((message) => message.role === "user") ?? incoming[0];
    const title = deriveConversationTitle(
      firstUser.content,
      input.locale,
      Boolean(firstUser.attachmentIds && firstUser.attachmentIds.length > 0),
    );
    const created = await prisma.conciergeConversation.create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId,
        title,
        locale: input.locale,
        activePropertyId: input.activePropertyId,
      },
    });
    try {
      await insertMessages(created.id, incoming, input.userId, input.sessionId);
    } catch (error) {
      await prisma.conciergeConversation.delete({ where: { id: created.id } }).catch(() => undefined);
      throw error;
    }
    const stored = await prisma.conciergeMessage.findMany({
      where: { conversationId: created.id },
      orderBy: { createdAt: "asc" },
    });
    return {
      conversationId: created.id,
      history: stored.slice(-MODEL_HISTORY_LIMIT).map(toTurnMessage),
      activePropertyId: input.activePropertyId,
    };
  }

  const existing = await prisma.conciergeConversation.findFirst({
    where: { id: input.conversationId, userId: input.userId },
  });
  if (!existing) throw new ConversationNotFoundError();

  if (input.activePropertyId && input.activePropertyId !== existing.activePropertyId) {
    await prisma.conciergeConversation.update({
      where: { id: existing.id },
      data: { activePropertyId: input.activePropertyId },
    });
  }

  const newest = await prisma.conciergeMessage.findMany({
    where: { conversationId: existing.id },
    orderBy: { createdAt: "desc" },
    take: STORED_MESSAGE_LIMIT,
  });
  const stored = chronological(newest);
  const lastIncoming = incoming[incoming.length - 1];
  const lastStored = stored[stored.length - 1];
  const duplicate =
    lastIncoming.role === "user" &&
    lastStored?.role === "USER" &&
    lastStored.content === lastIncoming.content &&
    sameAttachmentIds(lastStored, lastIncoming.attachmentIds);

  if (lastIncoming.role === "user" && !duplicate) {
    await insertMessages(existing.id, [lastIncoming], input.userId, input.sessionId);
    const [saved] = await prisma.conciergeMessage.findMany({
      where: { conversationId: existing.id },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    if (saved) stored.push(saved);
  }

  return {
    conversationId: existing.id,
    history: stored.slice(-MODEL_HISTORY_LIMIT).map(toTurnMessage),
    activePropertyId: input.activePropertyId ?? existing.activePropertyId ?? undefined,
  };
}

async function insertMessages(
  conversationId: string,
  messages: TurnMessage[],
  userId: string,
  sessionId: string,
): Promise<void> {
  const started = Date.now();
  const data = await Promise.all(
    messages.map(async (message, index) => {
      const attachments =
        message.role === "user" ? await resolveAttachments(message.attachmentIds, userId, sessionId) : undefined;
      return {
        conversationId,
        role: message.role === "user" ? ("USER" as const) : ("ASSISTANT" as const),
        content: message.content.slice(0, 12000),
        attachments: attachments ? toJson(attachments) : undefined,
        createdAt: new Date(started + index),
      };
    }),
  );
  await prisma.conciergeMessage.createMany({ data });
}

export async function finishConversationTurn(input: {
  userId: string;
  conversationId: string;
  assistantContent: string;
  workspace: StoredWorkspace | null;
  activePropertyId?: string | null;
}): Promise<boolean> {
  const content = input.assistantContent.trim().slice(0, 12000);
  if (!content) return false;

  const existing = await prisma.conciergeConversation.findFirst({
    where: { id: input.conversationId, userId: input.userId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.conciergeMessage.create({
    data: {
      conversationId: existing.id,
      role: "ASSISTANT",
      content,
    },
  });

  const workspace = input.workspace ? workspaceJson(input.workspace) : undefined;
  const draftId = activePropertyIdFromWorkspace(input.workspace);
  const activePropertyId = draftId ?? input.activePropertyId ?? undefined;
  await prisma.conciergeConversation.update({
    where: { id: existing.id },
    data: {
      ...(workspace ? { workspace } : {}),
      ...(activePropertyId ? { activePropertyId } : {}),
      // Touch the row even when this turn didn't produce a workspace, so
      // the sidebar's "recent" ordering follows the latest reply.
      updatedAt: new Date(),
    },
  });
  return true;
}

function workspaceJson(workspace: StoredWorkspace): Prisma.InputJsonValue | undefined {
  const json = JSON.stringify(workspace);
  if (json.length > WORKSPACE_JSON_MAX) return undefined;
  return JSON.parse(json) as Prisma.InputJsonValue;
}
