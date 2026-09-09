"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, ImageIcon, Music, Video, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { PendingAttachment } from "./ConversationContext";
import { cn } from "@/lib/utils";

const KIND_ICON = { IMAGE: ImageIcon, AUDIO: Music, VIDEO: Video, DOCUMENT: FileText } as const;

// The "Uploading -> Processing -> Analyzing -> Ready" ladder from spec
// section 21, made visible without drowning the user in technical detail —
// one small status pill per attachment, not a progress log.
function statusLabel(a: PendingAttachment): string {
  switch (a.status) {
    case "uploading": return "Uploading…";
    case "processing": return "Processing…";
    case "analyzing": return "Analyzing…";
    case "failed": return a.errorMessage ?? "Failed";
    case "ready":
      if (a.detectedCategory) return `${a.detectedCategory.replace(/_/g, " ")} · ${Math.round((a.categoryConfidence ?? 0) * 100)}%`;
      return "Ready";
  }
}

export function AttachmentTray({
  attachments,
  onRemove,
}: {
  attachments: PendingAttachment[];
  onRemove: (localId: string) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 border-t border-luxury-border px-4 pb-3 pt-3 md:px-8">
      <AnimatePresence initial={false}>
        {attachments.map((a) => {
          const Icon = KIND_ICON[a.mediaKind];
          const busy = a.status === "uploading" || a.status === "processing" || a.status === "analyzing";
          return (
            <motion.div
              key={a.localId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="group relative flex items-center gap-2 border border-luxury-border bg-luxury-black/60 py-1.5 pl-1.5 pr-2.5"
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden bg-luxury-graphite">
                {a.mediaKind === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob: preview URL, not a next/image-optimizable remote asset
                  <img src={a.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon size={15} className="text-luxury-muted-foreground" />
                  </div>
                )}
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center bg-luxury-black/50">
                    <Loader2 size={13} className="animate-spin text-luxury-gold" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="max-w-[9rem] truncate text-xs font-medium text-luxury-ivory">{a.filename}</p>
                <p
                  className={cn(
                    "flex items-center gap-1 text-[11px]",
                    a.status === "failed" ? "text-luxury-destructive" : a.status === "ready" ? "text-luxury-gold" : "text-luxury-muted-foreground",
                  )}
                >
                  {a.status === "failed" && <AlertTriangle size={10} />}
                  {a.status === "ready" && <CheckCircle2 size={10} />}
                  {statusLabel(a)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(a.localId)}
                aria-label="Remove attachment"
                className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-luxury-muted-foreground opacity-0 transition-opacity duration-150 hover:text-luxury-ivory group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
