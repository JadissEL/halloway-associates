"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";

export interface ShellMessage {
  role: "user" | "assistant";
  content: string;
}

export interface WorkspacePayload {
  type: "properties" | "professionals" | "requestRoom" | "callSlots" | "callBooking";
  data: unknown;
}

interface ConversationState {
  messages: ShellMessage[];
  workspace: WorkspacePayload | null;
  loading: boolean;
  viewMode: "full" | "conversation" | "results" | "history";
  setViewMode: (mode: ConversationState["viewMode"]) => void;
  sendMessage: (text: string) => Promise<void>;
}

const ConversationCtx = createContext<ConversationState | null>(null);

const SESSION_KEY = "halloway-concierge-session-id";
const MESSAGES_KEY = "halloway-concierge-messages";

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
  const [messages, setMessages] = useState<ShellMessage[]>([]);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ConversationState["viewMode"]>("full");
  const [sessionId, setSessionId] = useState("");

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

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || !sessionId) return;

      const next = [...messages, { role: "user" as const, content: trimmed }];
      setMessages(next);
      setLoading(true);
      if (next.length === 1) setViewMode("full");

      try {
        const res = await fetch("/api/ai/conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, locale, sessionId }),
        });
        if (!res.ok) throw new Error("concierge failed");
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
    },
    [loading, locale, messages, sessionId],
  );

  const value = useMemo(
    () => ({ messages, workspace, loading, viewMode, setViewMode, sendMessage }),
    [messages, workspace, loading, viewMode, sendMessage],
  );

  return <ConversationCtx.Provider value={value}>{children}</ConversationCtx.Provider>;
}

export function useConversation(): ConversationState {
  const ctx = useContext(ConversationCtx);
  if (!ctx) throw new Error("useConversation must be used within ConversationProvider");
  return ctx;
}
