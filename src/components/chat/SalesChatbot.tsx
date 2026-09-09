"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { ArrowLink } from "@/components/icons/ArrowLink";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  CHAT_STORAGE_KEY,
  type ChatMessage,
  type ChatResponseBody,
} from "@/lib/chat/types";
import type { ChatFocus } from "@/lib/chat/types";
import {
  loadVisitorProfile,
  saveVisitorProfile,
  trackUserMessage,
} from "@/lib/chat/visitor-client";
import { cn } from "@/lib/utils";
import { renderInlineMarkdown } from "@/lib/chat/render-inline-markdown";

const QUICK_KEYS = ["marketplace", "services", "concierge", "contact"] as const;

export function SalesChatbot() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedFocus, setSuggestedFocus] = useState<ChatFocus | undefined>();
  const [showContactNudge, setShowContactNudge] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved) as ChatMessage[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    }
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: t("welcome"),
        },
      ]);
    }
  }, [open, messages.length, t]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);

      const visitor = trackUserMessage(trimmed, locale);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            locale,
            visitor,
          }),
        });

        if (!res.ok) throw new Error("chat failed");

        const data = (await res.json()) as ChatResponseBody;
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        if (data.suggestedFocus) setSuggestedFocus(data.suggestedFocus);
        if (data.suggestContact) setShowContactNudge(true);

        // VisitorProfile.interests tracks Studio focus tracks specifically
        // (it feeds the Studio service-recommendation context) — "marketplace"
        // isn't one of those, so it only ever drives contactHref below, never
        // gets pushed in here.
        if (data.suggestedFocus && data.suggestedFocus !== "marketplace") {
          const updated = loadVisitorProfile(locale);
          if (!updated.interests.includes(data.suggestedFocus)) {
            updated.interests = [...updated.interests, data.suggestedFocus];
            saveVisitorProfile(updated);
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: t("error") },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, locale, messages, t],
  );

  // The Studio contact form isn't the marketplace's human-handoff — a real
  // person for property/professional/relocation questions is booked via
  // /book-a-call (an Arrival & Information Call), not a discovery-call inbox.
  const contactHref =
    suggestedFocus === "marketplace" ? "/book-a-call" : `/contact?focus=${suggestedFocus ?? "other"}`;

  if (!mounted) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed bottom-24 right-4 z-50 flex h-[min(560px,calc(100vh-7rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden border border-luxury-border bg-luxury-graphite shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:bottom-6 md:right-6"
            role="dialog"
            aria-label={t("title")}
          >
            <header className="flex items-center justify-between border-b border-luxury-border bg-luxury-black/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-luxury-ivory">{t("title")}</p>
                <p className="text-xs text-luxury-muted-foreground">{t("subtitle")}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-luxury-muted-foreground hover:bg-luxury-black hover:text-luxury-ivory"
                aria-label={t("close")}
              >
                <X size={18} />
              </button>
            </header>

            <div ref={listRef} className="luxury-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((msg, i) => (
                <div
                  key={`${msg.role}-${i}`}
                  className={cn(
                    "max-w-[92%] px-3.5 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "ml-auto bg-luxury-gold text-luxury-black shadow-[0_10px_30px_rgba(201,162,74,0.28)]"
                      : "border border-luxury-border bg-luxury-black/40 text-luxury-muted-foreground shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
                  )}
                >
                  {renderInlineMarkdown(msg.content)}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-luxury-muted-foreground">
                  <Loader2 size={14} className="animate-spin text-luxury-gold" />
                  {t("thinking")}
                </div>
              )}
            </div>

            {showContactNudge && (
              <div className="border-t border-luxury-border bg-luxury-gold/5 px-4 py-2">
                <Link
                  href={contactHref}
                  className="inline-flex w-full items-center justify-center gap-1.5 text-center text-xs font-semibold text-luxury-gold no-underline hover:underline"
                >
                  {t("contactNudge")}
                  <ArrowLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            <div className="border-t border-luxury-border px-3 py-2">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {QUICK_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => sendMessage(t(`quick.${key}`))}
                    disabled={loading}
                    className="border border-luxury-border bg-luxury-black px-2.5 py-1 text-[11px] font-medium text-luxury-muted-foreground transition-colors duration-200 hover:border-luxury-gold hover:text-luxury-gold disabled:opacity-50"
                  >
                    {t(`quick.${key}`)}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  rows={1}
                  placeholder={t("placeholder")}
                  className="max-h-24 min-h-[40px] flex-1 resize-none border border-luxury-border bg-luxury-input px-3 py-2 text-sm text-luxury-ivory outline-none focus:border-luxury-gold"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center bg-luxury-gold text-luxury-black disabled:opacity-40"
                  aria-label={t("send")}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <motion.button
          type="button"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-50 flex items-center gap-2 bg-luxury-gold px-4 py-3 text-sm font-semibold text-luxury-black shadow-[0_12px_40px_rgba(0,0,0,0.5)] md:bottom-6 md:right-6"
          aria-label={t("open")}
        >
          <MessageCircle size={18} />
          <span className="hidden sm:inline">{t("open")}</span>
        </motion.button>
      )}
    </>
  );
}
