"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Send } from "lucide-react";
import { useConversation } from "./ConversationContext";
import { QuickAccessRow } from "./QuickAccessRow";
import { cn } from "@/lib/utils";

export function ConversationPanel() {
  const t = useTranslations("shell");
  const { messages, loading, sendMessage } = useConversation();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex h-full flex-col bg-luxury-black text-luxury-ivory">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-luxury-gold">
            {t("conciergeLabel")}
          </p>
          <h1 className="font-serif text-3xl font-semibold md:text-5xl">{t("greeting")}</h1>
          <p className="max-w-md text-sm leading-relaxed text-luxury-muted-foreground md:text-base">
            {t("greetingSubtitle")}
          </p>
        </div>
      ) : (
        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-8">
          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={cn(
                "max-w-[85%] rounded-none px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "ml-auto bg-luxury-gold text-luxury-black"
                  : "border border-luxury-border bg-luxury-graphite text-luxury-ivory",
              )}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-luxury-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              {t("send")}…
            </div>
          )}
        </div>
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
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-none border border-luxury-border bg-luxury-input px-4 py-3 text-sm text-luxury-ivory outline-none placeholder:text-luxury-muted-foreground focus:border-luxury-gold"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none bg-luxury-gold text-luxury-black disabled:opacity-40"
          aria-label={t("send")}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
