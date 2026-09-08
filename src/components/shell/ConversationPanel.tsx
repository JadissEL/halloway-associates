"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, ShieldCheck } from "lucide-react";
import { useConversation } from "./ConversationContext";
import { QuickAccessRow } from "./QuickAccessRow";
import { cn } from "@/lib/utils";
import { renderInlineMarkdown } from "@/lib/chat/render-inline-markdown";

export function ConversationPanel() {
  const t = useTranslations("shell");
  const { messages, loading, sendMessage, pendingConfirmation, confirmPendingAction, cancelPendingAction } = useConversation();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex h-full min-h-0 flex-col text-luxury-ivory">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-5"
          >
            <div className="flex flex-col items-center gap-3">
              <span className="h-px w-10 bg-luxury-gold/60" />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-luxury-gold">
                {t("conciergeLabel")}
              </p>
            </div>
            <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-6xl">
              {t("greeting")}
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-luxury-muted-foreground md:text-base">
              {t("greetingSubtitle")}
            </p>
          </motion.div>
        </div>
      ) : (
        <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-8">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={`${msg.role}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn(
                  "max-w-[85%] rounded-none px-4 py-3 text-sm leading-relaxed shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
                  msg.role === "user"
                    ? "ml-auto bg-luxury-gold text-luxury-black"
                    : "border border-luxury-border bg-luxury-graphite text-luxury-ivory",
                )}
              >
                {renderInlineMarkdown(msg.content)}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-luxury-muted-foreground">
              <Loader2 size={14} className="animate-spin text-luxury-gold" />
              {t("send")}…
            </div>
          )}
        </div>
      )}

      {pendingConfirmation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3 flex items-start gap-3 border border-luxury-gold bg-luxury-gold/5 p-3.5 md:mx-8"
        >
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-luxury-gold" />
          <div className="flex-1">
            <p className="text-sm text-luxury-ivory">{pendingConfirmation.summary}</p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => void confirmPendingAction()}
                disabled={loading}
                className="bg-luxury-gold px-4 py-1.5 text-xs font-semibold text-luxury-black transition-all duration-200 hover:brightness-110 disabled:opacity-50"
              >
                {t("confirmAction")}
              </button>
              <button
                type="button"
                onClick={cancelPendingAction}
                disabled={loading}
                className="border border-luxury-border px-4 py-1.5 text-xs font-semibold text-luxury-muted-foreground transition-colors duration-200 hover:text-luxury-ivory disabled:opacity-50"
              >
                {t("cancelAction")}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <QuickAccessRow />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const text = input;
          setInput("");
          void sendMessage(text);
        }}
        className="flex items-end gap-2 border-t border-luxury-border px-4 py-3 md:px-8"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              const text = input;
              setInput("");
              void sendMessage(text);
            }
          }}
          rows={1}
          placeholder={t("inputPlaceholder")}
          className="max-h-32 min-h-[46px] flex-1 resize-none rounded-none border border-luxury-border bg-luxury-input px-4 py-3 text-sm text-luxury-ivory outline-none transition-shadow duration-200 placeholder:text-luxury-muted-foreground focus:border-luxury-gold focus:shadow-[0_0_0_1px_var(--color-luxury-gold)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-none bg-luxury-gold text-luxury-black shadow-[0_4px_16px_rgba(201,162,74,0.25)] transition-all duration-200 hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
          aria-label={t("send")}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
