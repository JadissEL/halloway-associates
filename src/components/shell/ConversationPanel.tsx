"use client";

import { useEffect, useRef, useState, type DragEvent, type ClipboardEvent } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, ShieldCheck, Paperclip, Mic, Square, UploadCloud } from "lucide-react";
import { useConversation } from "./ConversationContext";
import { QuickAccessRow } from "./QuickAccessRow";
import { AttachmentTray } from "./AttachmentTray";
import { MessageAttachments } from "./MessageAttachments";
import { cn } from "@/lib/utils";
import { renderInlineMarkdown } from "@/lib/chat/render-inline-markdown";

const ACCEPT = "image/*,audio/*,video/*,application/pdf";

export function ConversationPanel() {
  const t = useTranslations("shell");
  const {
    messages, loading, sendMessage, pendingConfirmation, confirmPendingAction, cancelPendingAction,
    pendingAttachments, addFiles, removeAttachment, isUploading,
    isRecordingVoice, startVoiceRecording, stopVoiceRecording, voiceRecordingError,
  } = useConversation();
  const [input, setInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, pendingAttachments.length]);

  const submit = () => {
    const text = input;
    setInput("");
    void sendMessage(text);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) addFiles(files);
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((f): f is File => Boolean(f));
    if (files.length) addFiles(files);
  };

  return (
    <div
      className="relative flex h-full min-h-0 flex-col text-luxury-ivory"
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounterRef.current += 1;
        setIsDragOver(true);
      }}
      onDragLeave={() => {
        dragCounterRef.current -= 1;
        if (dragCounterRef.current <= 0) setIsDragOver(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-luxury-gold bg-luxury-black/85 backdrop-blur-sm"
          >
            <UploadCloud size={28} className="text-luxury-gold" />
            <p className="text-sm font-semibold text-luxury-ivory">Drop to attach</p>
          </motion.div>
        )}
      </AnimatePresence>

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
        <div ref={listRef} className="luxury-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-6 md:px-8">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={`${msg.role}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn(
                  // A flat black shadow at low opacity barely reads against
                  // an already near-black backdrop — no contrast to perceive
                  // depth from. Matches the platform's own established
                  // shadow language instead: gold surfaces (buttons, CTAs)
                  // already cast a gold-tinted glow everywhere else in this
                  // app, and 0.5-opacity black is what every other elevated
                  // dark panel (toasts, the site-assistant window) actually
                  // uses to read as "lifted."
                  "max-w-[85%] rounded-none px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-luxury-gold text-luxury-black shadow-[0_10px_30px_rgba(201,162,74,0.28)]"
                    : "border border-luxury-border bg-luxury-graphite text-luxury-ivory shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
                )}
              >
                {msg.attachments && msg.attachments.length > 0 && <MessageAttachments attachments={msg.attachments} />}
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

      <AttachmentTray attachments={pendingAttachments} onRemove={removeAttachment} />

      {voiceRecordingError && (
        <p className="px-4 pt-2 text-xs text-luxury-destructive md:px-8">{voiceRecordingError}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-end gap-2 border-t border-luxury-border px-4 py-3 md:px-8"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) addFiles(files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach photos, audio, video, or documents"
          className="flex h-[46px] w-[42px] shrink-0 items-center justify-center border border-luxury-border text-luxury-muted-foreground transition-colors duration-200 hover:border-luxury-gold hover:text-luxury-gold"
        >
          <Paperclip size={17} />
        </button>
        <button
          type="button"
          onClick={() => (isRecordingVoice ? stopVoiceRecording() : void startVoiceRecording())}
          aria-label={isRecordingVoice ? "Stop recording" : "Record a voice message"}
          className={cn(
            "flex h-[46px] w-[42px] shrink-0 items-center justify-center border transition-colors duration-200",
            isRecordingVoice
              ? "border-luxury-destructive bg-luxury-destructive/10 text-luxury-destructive"
              : "border-luxury-border text-luxury-muted-foreground hover:border-luxury-gold hover:text-luxury-gold",
          )}
        >
          {isRecordingVoice ? <Square size={15} className="animate-pulse" /> : <Mic size={17} />}
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={t("inputPlaceholder")}
          className="max-h-32 min-h-[46px] flex-1 resize-none rounded-none border border-luxury-border bg-luxury-input px-4 py-3 text-sm text-luxury-ivory outline-none transition-shadow duration-200 placeholder:text-luxury-muted-foreground focus:border-luxury-gold focus:shadow-[0_0_0_1px_var(--color-luxury-gold)]"
        />
        <button
          type="submit"
          disabled={loading || isUploading || (!input.trim() && pendingAttachments.length === 0)}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-none bg-luxury-gold text-luxury-black shadow-[0_4px_16px_rgba(201,162,74,0.25)] transition-all duration-200 hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
          aria-label={t("send")}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
