"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  messages: ShellMessage[];
  workspace: WorkspacePayload | null;
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
const PENDING_QUICK_ACCESS_KEY = "halloway-pending-quick-access";

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

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
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
  return fresh;
}

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const tQuickAccess = useTranslations("shell.quickAccess");
  const [messages, setMessages] = useState<ShellMessage[]>([]);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ConversationState["viewMode"]>("full");
  const [sessionId, setSessionId] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordingError, setVoiceRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const pollTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
    try {
      const saved = sessionStorage.getItem(MESSAGES_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-40)));
      } catch {
        /* ignore */
      }
    }
  }, [messages]);

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

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      const readyAttachments = pendingAttachments.filter((a) => a.serverId && a.status !== "uploading" && a.status !== "failed");
      if ((!trimmed && readyAttachments.length === 0) || loading || !sessionId) return;

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
        const res = await fetch("/api/ai/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: next.map((m) => ({
              role: m.role,
              content: m.content,
              attachmentIds: m.attachments?.map((a) => a.id),
            })),
            locale,
            sessionId,
          }),
        });
        if (!res.ok) throw new Error("concierge failed");
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        if (data.workspace) {
          setWorkspace(data.workspace);
          setViewMode((v) => (v === "conversation" ? "full" : v));
        }
        setPendingConfirmation(data.pendingConfirmation ?? null);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I'm temporarily unavailable. Please try again in a moment." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, locale, messages, sessionId, pendingAttachments],
  );

  const confirmPendingAction = useCallback(async () => {
    if (!pendingConfirmation || loading || !sessionId) return;
    const confirmationId = pendingConfirmation.confirmationId;
    setLoading(true);
    setPendingConfirmation(null);

    try {
      const res = await fetch("/api/ai/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationId, locale, sessionId }),
      });
      if (!res.ok) throw new Error("confirm failed");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.workspace) {
        setWorkspace(data.workspace);
        setViewMode((v) => (v === "conversation" ? "full" : v));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm temporarily unavailable. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [pendingConfirmation, loading, locale, sessionId]);

  const cancelPendingAction = useCallback(() => setPendingConfirmation(null), []);

  useEffect(() => {
    if (!sessionId) return;
    let pendingKey: string | null = null;
    try {
      pendingKey = sessionStorage.getItem(PENDING_QUICK_ACCESS_KEY);
      if (pendingKey) sessionStorage.removeItem(PENDING_QUICK_ACCESS_KEY);
    } catch {
      /* ignore */
    }
    if (pendingKey) {
      void sendMessage(tQuickAccess(pendingKey));
    }
    // Only re-run when the session becomes ready; sendMessage/tQuickAccess are stable enough per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const isUploading = pendingAttachments.some((a) => a.status === "uploading");

  const value = useMemo(
    () => ({
      sessionId, messages, workspace, loading, viewMode, setViewMode, sendMessage,
      pendingConfirmation, confirmPendingAction, cancelPendingAction,
      pendingAttachments, addFiles, removeAttachment, isUploading,
      isRecordingVoice, startVoiceRecording, stopVoiceRecording, voiceRecordingError,
    }),
    [
      sessionId, messages, workspace, loading, viewMode, sendMessage,
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
