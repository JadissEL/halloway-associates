"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";

export interface MessageAttachment {
  id: string;
  mediaKind: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  previewUrl: string;
  detectedCategory?: string | null;
}

export interface ShellMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: MessageAttachment[];
}

export interface WorkspacePayload {
  type: "properties" | "professionals" | "requestRoom" | "callSlots" | "callBooking" | "listingDraft" | "mediaGallery";
  data: unknown;
}

export interface PendingConfirmation {
  confirmationId: string;
  toolName: string;
  summary: string;
}

export type AttachmentStatus = "uploading" | "processing" | "analyzing" | "ready" | "failed";

export interface PendingAttachment {
  localId: string;
  previewUrl: string;
  mediaKind: "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";
  filename: string;
  status: AttachmentStatus;
  serverId?: string;
  detectedCategory?: string | null;
  categoryConfidence?: number | null;
  qualityScore?: number | null;
  duplicateGroup?: string | null;
  errorMessage?: string;
}

interface ConversationState {
  sessionId: string;
  conversationId: string | null;
  messages: ShellMessage[];
  workspace: WorkspacePayload | null;
  restoring: boolean;
  activityRevision: number;
  openConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
  loading: boolean;
  viewMode: "full" | "conversation" | "results" | "history";
  setViewMode: (mode: ConversationState["viewMode"]) => void;
  sendMessage: (text: string) => Promise<void>;
  pendingConfirmation: PendingConfirmation | null;
  confirmPendingAction: () => Promise<void>;
  cancelPendingAction: () => void;
  pendingAttachments: PendingAttachment[];
  addFiles: (files: File[]) => void;
  removeAttachment: (localId: string) => void;
  isUploading: boolean;
  isRecordingVoice: boolean;
  startVoiceRecording: () => Promise<void>;
  stopVoiceRecording: () => void;
  voiceRecordingError: string | null;
}

const ConversationCtx = createContext<ConversationState | null>(null);

const SESSION_KEY = "halloway-concierge-session-id";
const MESSAGES_KEY = "halloway-concierge-messages";
const CONVERSATION_KEY = "halloway-concierge-conversation-id";
const PENDING_QUICK_ACCESS_KEY = "halloway-pending-quick-access";

const WORKSPACE_TYPES = new Set<WorkspacePayload["type"]>([
  "properties",
  "professionals",
  "requestRoom",
  "callSlots",
  "callBooking",
  "listingDraft",
  "mediaGallery",
]);

function rememberConversationId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(CONVERSATION_KEY, id);
    else sessionStorage.removeItem(CONVERSATION_KEY);
    sessionStorage.removeItem(MESSAGES_KEY);
  } catch {
    /* ignore */
  }
}

function parseRestoredAttachments(value: unknown): MessageAttachment[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const attachments = value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const id = "id" in item && typeof item.id === "string" ? item.id : null;
    const mediaKind = "mediaKind" in item ? item.mediaKind : null;
    const previewUrl = "previewUrl" in item && typeof item.previewUrl === "string" ? item.previewUrl : null;
    if (!id || !previewUrl) return [];
    if (mediaKind !== "IMAGE" && mediaKind !== "AUDIO" && mediaKind !== "VIDEO" && mediaKind !== "DOCUMENT") return [];
    const detectedCategory =
      "detectedCategory" in item && (item.detectedCategory === null || typeof item.detectedCategory === "string")
        ? item.detectedCategory
        : null;
    return [{ id, mediaKind, previewUrl, detectedCategory }];
  });
  return attachments.length > 0 ? attachments : undefined;
}

function parseRestoredMessages(value: unknown): ShellMessage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const role = "role" in item ? item.role : null;
    const content = "content" in item ? item.content : null;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return [];
    const attachments = parseRestoredAttachments("attachments" in item ? item.attachments : undefined);
    return [{ role, content, ...(attachments ? { attachments } : {}) }];
  });
}

function parseRestoredWorkspace(value: unknown): WorkspacePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || !("type" in value)) return null;
  const type = value.type;
  if (typeof type !== "string" || !WORKSPACE_TYPES.has(type as WorkspacePayload["type"])) return null;
  return { type: type as WorkspacePayload["type"], data: "data" in value ? value.data : null };
}

// Mirrors src/lib/media/storage.ts's server-side allowlist/caps — checked
// again here purely for fast client-side feedback (spec section 27: never
// trust the client, the server re-validates everything independently).
const ACCEPTED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif",
  "audio/webm", "audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg", "audio/m4a", "audio/x-m4a",
  "video/mp4", "video/webm", "video/quicktime",
  "application/pdf",
]);
const MAX_CLIENT_SIZE_BYTES = 30 * 1024 * 1024;

function mediaKindFromMime(mime: string): PendingAttachment["mediaKind"] {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

function extractDraftId(workspace: WorkspacePayload | null | undefined): string | null {
  if (!workspace || workspace.type !== "listingDraft") return null;
  const draft = (workspace.data as { draft?: { id?: unknown } } | undefined)?.draft;
  return typeof draft?.id === "string" ? draft.id : null;
}

let cachedSessionId: string | null = null;

function getOrCreateSessionId(): string {
  if (cachedSessionId) return cachedSessionId;
  if (typeof window === "undefined") return "";
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      cachedSessionId = existing;
      return existing;
    }
  } catch {
    /* ignore */
  }
  const fresh =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  try {
    sessionStorage.setItem(SESSION_KEY, fresh);
  } catch {
    /* ignore */
  }
  cachedSessionId = fresh;
  return fresh;
}

function subscribeSessionId() {
  return () => {};
}

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const tQuickAccess = useTranslations("shell.quickAccess");
  const [messages, setMessages] = useState<ShellMessage[]>([]);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activityRevision, setActivityRevision] = useState(0);
  const [viewMode, setViewMode] = useState<ConversationState["viewMode"]>("full");
  const sessionId = useSyncExternalStore(subscribeSessionId, getOrCreateSessionId, () => "");
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  // The property draft this conversation is currently working on, once one
  // exists — echoed back to the API on every turn so the model knows which
  // draft "my listing" refers to without the user ever seeing or typing its
  // id (see the request schema comment in route.ts for why this is needed:
  // a confirmed tool's result never re-enters the model's own message
  // history, only the plain-text reply does).
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordingError, setVoiceRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const pollTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const turnRef = useRef(0);
  const discardRecordingRef = useRef(false);

  useEffect(() => {
    const timers = pollTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const pollStatus = useCallback((localId: string, serverId: string) => {
    const poll = async (attempt: number) => {
      try {
        const res = await fetch(`/api/media/${serverId}?status=1&sessionId=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          setPendingAttachments((prev) =>
            prev.map((a) =>
              a.localId === localId
                ? {
                    ...a,
                    status: data.processingStatus === "ANALYZED" ? "ready" : data.processingStatus === "FAILED" ? "failed" : "analyzing",
                    detectedCategory: data.detectedCategory,
                    categoryConfidence: data.categoryConfidence,
                    qualityScore: data.qualityScore,
                    duplicateGroup: data.duplicateGroup,
                    errorMessage: data.errorMessage,
                  }
                : a,
            ),
          );
          if (data.processingStatus === "ANALYZED" || data.processingStatus === "FAILED") return;
        }
      } catch {
        /* transient — keep polling until the attempt cap */
      }
      if (attempt < 15) {
        const timer = setTimeout(() => poll(attempt + 1), Math.min(1500 * (attempt + 1), 6000));
        pollTimersRef.current.set(localId, timer);
      } else {
        setPendingAttachments((prev) => prev.map((a) => (a.localId === localId && a.status !== "ready" ? { ...a, status: "ready" } : a)));
      }
    };
    void poll(0);
  }, [sessionId]);

  const uploadOne = useCallback(
    async (file: File) => {
      const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = URL.createObjectURL(file);
      const mediaKind = mediaKindFromMime(file.type);

      if (!ACCEPTED_MIME.has(file.type)) {
        setPendingAttachments((prev) => [
          ...prev,
          { localId, previewUrl, mediaKind, filename: file.name, status: "failed", errorMessage: "Unsupported file type." },
        ]);
        return;
      }
      if (file.size > MAX_CLIENT_SIZE_BYTES) {
        setPendingAttachments((prev) => [
          ...prev,
          { localId, previewUrl, mediaKind, filename: file.name, status: "failed", errorMessage: "File is too large." },
        ]);
        return;
      }

      setPendingAttachments((prev) => [...prev, { localId, previewUrl, mediaKind, filename: file.name, status: "uploading" }]);

      try {
        const form = new FormData();
        form.append("file", file);
        form.append("sessionId", sessionId);
        const res = await fetch("/api/media/upload", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setPendingAttachments((prev) =>
            prev.map((a) => (a.localId === localId ? { ...a, status: "failed", errorMessage: body.error ?? "Upload failed." } : a)),
          );
          return;
        }
        const data = await res.json();
        setPendingAttachments((prev) =>
          prev.map((a) => (a.localId === localId ? { ...a, status: "processing", serverId: data.id } : a)),
        );
        pollStatus(localId, data.id);
      } catch {
        setPendingAttachments((prev) =>
          prev.map((a) => (a.localId === localId ? { ...a, status: "failed", errorMessage: "Upload failed." } : a)),
        );
      }
    },
    [sessionId, pollStatus],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      for (const file of files.slice(0, 20)) void uploadOne(file);
    },
    [uploadOne],
  );

  const removeAttachment = useCallback((localId: string) => {
    const timer = pollTimersRef.current.get(localId);
    if (timer) clearTimeout(timer);
    setPendingAttachments((prev) => {
      const target = prev.find((a) => a.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.localId !== localId);
    });
  }, []);

  const startVoiceRecording = useCallback(async () => {
    setVoiceRecordingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          return;
        }
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const ext = mimeType === "audio/webm" ? "webm" : "m4a";
        const file = new File([blob], `voice-message.${ext}`, { type: mimeType });
        void uploadOne(file);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVoice(true);
    } catch {
      setVoiceRecordingError("Microphone access was denied or isn't available.");
    }
  }, [uploadOne]);

  const stopVoiceRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecordingVoice(false);
  }, []);

  const noteConversation = useCallback((id: string | null) => {
    setConversationId(id);
    rememberConversationId(id);
    if (id) setActivityRevision((revision) => revision + 1);
  }, []);

  const openConversation = useCallback(async (id: string, options?: { focus?: boolean }) => {
    const turn = ++turnRef.current;
    const focus = options?.focus !== false;
    if (focus) setLoading(true);
    setPendingConfirmation(null);
    try {
      const res = await fetch(`/api/ai/conversations/${encodeURIComponent(id)}`);
      if (turn !== turnRef.current) return;
      if (!res.ok) {
        if (res.status === 404) {
          try {
            if (sessionStorage.getItem(CONVERSATION_KEY) === id) sessionStorage.removeItem(CONVERSATION_KEY);
          } catch {
            /* ignore */
          }
        }
        return;
      }
      const data = await res.json();
      if (turn !== turnRef.current) return;
      const restoredId = typeof data.id === "string" ? data.id : id;
      setConversationId(restoredId);
      rememberConversationId(restoredId);
      setMessages(parseRestoredMessages(data.messages));
      setWorkspace(parseRestoredWorkspace(data.workspace));
      setActivePropertyId(typeof data.activePropertyId === "string" ? data.activePropertyId : null);
      setPendingAttachments((prev) => {
        prev.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
        return [];
      });
      if (focus) {
        setViewMode(window.matchMedia("(min-width: 768px)").matches ? "full" : "conversation");
      }
    } catch {
      /* keep whatever thread is already on screen */
    } finally {
      if (turn === turnRef.current && focus) setLoading(false);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    turnRef.current += 1;
    if (mediaRecorderRef.current) {
      discardRecordingRef.current = true;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecordingVoice(false);
    }
    pollTimersRef.current.forEach((timer) => clearTimeout(timer));
    pollTimersRef.current.clear();
    setPendingAttachments((prev) => {
      prev.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
      return [];
    });
    setMessages([]);
    setWorkspace(null);
    setConversationId(null);
    setActivePropertyId(null);
    setPendingConfirmation(null);
    setLoading(false);
    setVoiceRecordingError(null);
    rememberConversationId(null);
  }, []);

  const postConversation = useCallback(
    async (payload: Record<string, unknown>, activeConversationId: string | null) => {
      const send = (id: string | null) =>
        fetch("/api/ai/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, ...(id ? { conversationId: id } : {}) }),
        });
      let res = await send(activeConversationId);
      // A stored id this user doesn't own (or that was deleted) should not
      // block the message they just typed — continue it as a new chat.
      if (res.status === 404 && activeConversationId) {
        setConversationId(null);
        rememberConversationId(null);
        res = await send(null);
      }
      return res;
    },
    [],
  );

  const applyAssistantPayload = useCallback(
    (data: {
      reply?: unknown;
      workspace?: unknown;
      pendingConfirmation?: PendingConfirmation | null;
      conversationId?: unknown;
    }) => {
      if (typeof data.reply === "string") {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply as string }]);
      }
      const restoredWorkspace = parseRestoredWorkspace(data.workspace);
      if (restoredWorkspace) {
        setWorkspace(restoredWorkspace);
        setViewMode((view) => (view === "conversation" ? "full" : view));
        const draftId = extractDraftId(restoredWorkspace);
        if (draftId) setActivePropertyId(draftId);
      }
      if (typeof data.conversationId === "string") noteConversation(data.conversationId);
      setPendingConfirmation(data.pendingConfirmation ?? null);
    },
    [noteConversation],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      const readyAttachments = pendingAttachments.filter((a) => a.serverId && a.status !== "uploading" && a.status !== "failed");
      if ((!trimmed && readyAttachments.length === 0) || loading || restoring || !sessionId) return;

      const turn = turnRef.current;
      const messageAttachments: MessageAttachment[] = readyAttachments.map((a) => ({
        id: a.serverId!,
        mediaKind: a.mediaKind,
        previewUrl: a.previewUrl,
        detectedCategory: a.detectedCategory,
      }));
      const next: ShellMessage[] = [
        ...messages,
        { role: "user", content: trimmed || "(sent an attachment)", attachments: messageAttachments.length ? messageAttachments : undefined },
      ];
      setMessages(next);
      setPendingAttachments([]);
      setLoading(true);
      setPendingConfirmation(null);
      if (next.length === 1) setViewMode("full");

      try {
        const res = await postConversation(
          {
            messages: next.slice(-40).map((m) => ({
              role: m.role,
              content: m.content,
              attachmentIds: m.attachments?.map((a) => a.id),
            })),
            locale,
            sessionId,
            activePropertyId: activePropertyId ?? undefined,
          },
          conversationId,
        );
        const data = await res.json().catch(() => null);
        if (turn !== turnRef.current) return;
        if (!res.ok || !data || typeof data.reply !== "string") {
          if (data && typeof data.conversationId === "string") noteConversation(data.conversationId);
          throw new Error("concierge failed");
        }
        applyAssistantPayload(data);
      } catch {
        if (turn !== turnRef.current) return;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I'm temporarily unavailable. Please try again in a moment." },
        ]);
      } finally {
        if (turn === turnRef.current) setLoading(false);
      }
    },
    [loading, restoring, locale, messages, sessionId, pendingAttachments, activePropertyId, conversationId, postConversation, noteConversation, applyAssistantPayload],
  );

  const confirmPendingAction = useCallback(async () => {
    if (!pendingConfirmation || loading || restoring || !sessionId) return;
    const turn = turnRef.current;
    const confirmationId = pendingConfirmation.confirmationId;
    setLoading(true);
    setPendingConfirmation(null);

    try {
      const res = await postConversation(
        { confirmationId, locale, sessionId, activePropertyId: activePropertyId ?? undefined },
        conversationId,
      );
      const data = await res.json().catch(() => null);
      if (turn !== turnRef.current) return;
      if (!res.ok || !data || typeof data.reply !== "string") {
        if (data && typeof data.conversationId === "string") noteConversation(data.conversationId);
        throw new Error("confirm failed");
      }
      // This is where a freshly-confirmed create_property_draft's id first
      // becomes known client-side — capturing it here (not just in
      // sendMessage's response handler) is what makes "what's still
      // missing on my draft?" work as the very next message, with no
      // extra turn needed.
      applyAssistantPayload(data);
    } catch {
      if (turn !== turnRef.current) return;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm temporarily unavailable. Please try again in a moment." },
      ]);
    } finally {
      if (turn === turnRef.current) setLoading(false);
    }
  }, [pendingConfirmation, loading, restoring, locale, sessionId, activePropertyId, conversationId, postConversation, noteConversation, applyAssistantPayload]);

  const cancelPendingAction = useCallback(() => setPendingConfirmation(null), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Yield once so this effect doesn't setState synchronously (the
      // session id itself comes from useSyncExternalStore).
      await Promise.resolve();
      if (cancelled) return;
      let pending: string | null = null;
      let storedId: string | null = null;
      try {
        pending = sessionStorage.getItem(PENDING_QUICK_ACCESS_KEY);
        storedId = sessionStorage.getItem(CONVERSATION_KEY);
        sessionStorage.removeItem(MESSAGES_KEY);
      } catch {
        /* ignore */
      }
      if (!pending && storedId) await openConversation(storedId, { focus: false });
      if (!cancelled) setRestoring(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [openConversation]);

  useEffect(() => {
    if (!sessionId || restoring) return;
    let pendingKey: string | null = null;
    try {
      pendingKey = sessionStorage.getItem(PENDING_QUICK_ACCESS_KEY);
      if (pendingKey) sessionStorage.removeItem(PENDING_QUICK_ACCESS_KEY);
    } catch {
      /* ignore */
    }
    if (!pendingKey) return;
    const key = pendingKey;
    const timer = window.setTimeout(() => {
      void sendMessage(tQuickAccess(key));
    }, 0);
    return () => window.clearTimeout(timer);
    // Only re-run when the session becomes ready; sendMessage/tQuickAccess are stable enough per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, restoring]);

  const isUploading = pendingAttachments.some((a) => a.status === "uploading");

  const value = useMemo(
    () => ({
      sessionId, conversationId, messages, workspace, loading, restoring, activityRevision,
      viewMode, setViewMode, sendMessage, openConversation, startNewConversation,
      pendingConfirmation, confirmPendingAction, cancelPendingAction,
      pendingAttachments, addFiles, removeAttachment, isUploading,
      isRecordingVoice, startVoiceRecording, stopVoiceRecording, voiceRecordingError,
    }),
    [
      sessionId, conversationId, messages, workspace, loading, restoring, activityRevision,
      viewMode, sendMessage, openConversation, startNewConversation,
      pendingConfirmation, confirmPendingAction, cancelPendingAction,
      pendingAttachments, addFiles, removeAttachment, isUploading,
      isRecordingVoice, startVoiceRecording, stopVoiceRecording, voiceRecordingError,
    ],
  );

  return <ConversationCtx.Provider value={value}>{children}</ConversationCtx.Provider>;
}

export function useConversation(): ConversationState {
  const ctx = useContext(ConversationCtx);
  if (!ctx) throw new Error("useConversation must be used within ConversationProvider");
  return ctx;
}
