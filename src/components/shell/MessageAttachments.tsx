import { Music, Video, FileText } from "lucide-react";
import type { MessageAttachment } from "./ConversationContext";

export function MessageAttachments({ attachments }: { attachments: MessageAttachment[] }) {
  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {attachments.map((a) => (
        <div key={a.id} className="relative h-16 w-16 shrink-0 overflow-hidden border border-black/10 bg-black/10">
          {a.mediaKind === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob: preview URL, not a next/image-optimizable remote asset
            <img src={a.previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {a.mediaKind === "AUDIO" && <Music size={18} />}
              {a.mediaKind === "VIDEO" && <Video size={18} />}
              {a.mediaKind === "DOCUMENT" && <FileText size={18} />}
            </div>
          )}
          {a.detectedCategory && (
            <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-center text-[9px] font-medium uppercase tracking-wide text-white">
              {a.detectedCategory.replace(/_/g, " ")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
