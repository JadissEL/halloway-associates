"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MapPin, ExternalLink, ArrowRight, Sparkles, CheckCircle2, AlertCircle, Copy, ImageOff } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useConversation } from "./ConversationContext";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DraftCompleteness {
  percent: number;
  missingRequiredFields: string[];
  missingRequiredMedia: string[];
  missingRecommendedMedia: string[];
  needsMorePhotos: boolean;
}

interface ListingDraft {
  id: string;
  status: string;
  fields: { title: string; city: string; priceAmount: number; propertyType: string; listingIntent: string };
  mediaCount: number;
  lowQualityMediaCount: number;
  possibleDuplicateGroups: number;
  completeness: DraftCompleteness;
}

interface MediaItem {
  id: string;
  mediaKind: string;
  processingStatus: string;
  detectedCategory: string | null;
  categoryConfidence: number | null;
  qualityScore: number | null;
  duplicateGroup: string | null;
  aiDescription: string | null;
  previewUrl: string;
}

interface PropertyResult {
  id: string; title: string; city: string; area: string | null;
  priceAmount: number; currency: string; propertyType: string;
  listingIntent: string; isDemo: boolean;
}

interface ProfessionalResult {
  id: string; name: string; category: string; languages: string[];
  bio: string; isPartnerPlatform: boolean; externalUrl: string | null; isDemo: boolean;
}

const cardMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export function WorkspacePanel() {
  const t = useTranslations("shell.workspace");
  const tMarketplace = useTranslations("marketplace");
  const tStatus = useTranslations("requestRooms.status");
  const { workspace, sessionId } = useConversation();
  const locale = useLocale();

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-luxury-border/60 bg-luxury-graphite/45 text-luxury-ivory backdrop-blur-xl">
      <div className="border-b border-luxury-border px-4 py-4">
        <span className="mb-1.5 block h-px w-6 bg-luxury-gold/60" />
        <h2 className="font-serif text-lg">{t("title")}</h2>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!workspace && (
          <div className="flex flex-col items-center gap-2.5 px-3 py-10 text-center">
            <Sparkles size={18} className="text-luxury-gold" strokeWidth={1.5} />
            <p className="text-sm leading-relaxed text-luxury-muted-foreground">{t("empty")}</p>
          </div>
        )}

        {workspace?.type === "properties" && (
          <div className="space-y-3">
            {(workspace.data as { properties: PropertyResult[] }).properties.map((p, i) => (
              <motion.div
                key={p.id}
                {...cardMotion}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group border border-luxury-border bg-luxury-black/40 p-4 transition-colors duration-200 hover:border-luxury-gold"
              >
                {p.isDemo && <Badge variant="gold" className="mb-2">{tMarketplace("demoBadge")}</Badge>}
                <p className="font-serif text-base transition-colors duration-200 group-hover:text-luxury-gold">{p.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-luxury-muted-foreground">
                  <MapPin size={13} />
                  {p.city}
                  {p.area ? `, ${p.area}` : ""}
                </p>
                <p className="text-numeric mt-2 inline-block border border-luxury-gold/40 px-2 py-1 text-sm font-semibold text-luxury-gold">
                  {formatPrice(p.priceAmount, p.currency, locale)}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {workspace?.type === "professionals" && (
          <div className="space-y-3">
            {(workspace.data as { professionals: ProfessionalResult[] }).professionals.map((p, i) => (
              <motion.div
                key={p.id}
                {...cardMotion}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="border border-luxury-border bg-luxury-black/40 p-4 transition-colors duration-200 hover:border-luxury-gold"
              >
                {p.isDemo && <Badge variant="gold" className="mb-2">{tMarketplace("demoBadge")}</Badge>}
                <p className="font-serif text-base">{p.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-luxury-muted-foreground">{p.bio}</p>
                {p.externalUrl && (
                  <a
                    href={p.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-luxury-gold hover:underline"
                  >
                    {p.externalUrl.replace(/^https?:\/\//, "")}
                    <ExternalLink size={13} />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {workspace?.type === "requestRoom" && (
          <RequestRoomCard
            roomId={(workspace.data as { roomId: string }).roomId}
            status={(workspace.data as { status: string }).status}
            statusLabel={tStatus}
          />
        )}

        {workspace?.type === "callBooking" && (
          <RequestRoomCard
            roomId={(workspace.data as { roomId: string }).roomId}
            status={(workspace.data as { status: string }).status}
            statusLabel={tStatus}
          />
        )}

        {workspace?.type === "callSlots" && (
          <p className="text-sm text-luxury-muted-foreground">
            {(workspace.data as { slots: { startTime: string }[] }).slots.length} slots — pick one in the conversation.
          </p>
        )}

        {workspace?.type === "listingDraft" && <ListingDraftPanel data={workspace.data as { draft?: ListingDraft; error?: string; message?: string }} />}

        {workspace?.type === "mediaGallery" && (
          <MediaGalleryPanel data={workspace.data as { count: number; items: MediaItem[] }} sessionId={sessionId} />
        )}
      </div>
    </div>
  );
}

// Completeness score is computed server-side, purely algorithmically, from
// the Property taxonomy (src/lib/media/completeness.ts) — this just renders
// it, it never invents or re-derives a percentage on its own (spec section 24).
function ListingDraftPanel({ data }: { data: { draft?: ListingDraft; error?: string; message?: string } }) {
  if (!data.draft) {
    return <p className="p-2 text-sm text-luxury-muted-foreground">{data.message ?? "No draft found."}</p>;
  }
  const { draft } = data;
  const { completeness } = draft;

  return (
    <motion.div {...cardMotion} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="border border-luxury-border bg-luxury-black/40 p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="font-serif text-base">{draft.fields.title || "Untitled listing"}</p>
          <span className="text-numeric text-lg font-semibold text-luxury-gold">{completeness.percent}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden bg-luxury-graphite">
          <motion.div
            className="h-full bg-luxury-gold"
            initial={{ width: 0 }}
            animate={{ width: `${completeness.percent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-xs text-luxury-muted-foreground">
          {draft.fields.city || "No city yet"} · {draft.mediaCount} photo{draft.mediaCount === 1 ? "" : "s"}
        </p>
      </div>

      {(completeness.missingRequiredFields.length > 0 || completeness.missingRequiredMedia.length > 0) && (
        <div className="border border-luxury-border bg-luxury-black/40 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-luxury-muted-foreground">
            <AlertCircle size={13} /> Still needed
          </p>
          <ul className="space-y-1 text-sm text-luxury-ivory">
            {completeness.missingRequiredFields.map((f) => (
              <li key={f}>· {f}</li>
            ))}
            {completeness.missingRequiredMedia.map((f) => (
              <li key={f}>· A photo of the {f.toLowerCase()}</li>
            ))}
          </ul>
        </div>
      )}

      {completeness.missingRecommendedMedia.length > 0 && (
        <div className="border border-luxury-border bg-luxury-black/40 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-luxury-muted-foreground">
            <Sparkles size={13} /> Would help
          </p>
          <p className="text-sm text-luxury-muted-foreground">{completeness.missingRecommendedMedia.join(", ")}</p>
        </div>
      )}

      {(draft.lowQualityMediaCount > 0 || draft.possibleDuplicateGroups > 0) && (
        <div className="border border-luxury-border bg-luxury-black/40 p-4 text-sm text-luxury-muted-foreground">
          {draft.lowQualityMediaCount > 0 && <p>{draft.lowQualityMediaCount} photo(s) look low quality.</p>}
          {draft.possibleDuplicateGroups > 0 && <p>{draft.possibleDuplicateGroups} possible duplicate group(s).</p>}
        </div>
      )}

      {completeness.percent === 100 && (
        <div className="flex items-center gap-2 border border-luxury-gold bg-luxury-gold/5 p-3 text-sm text-luxury-gold">
          <CheckCircle2 size={15} /> Ready to submit for review
        </div>
      )}
    </motion.div>
  );
}

function MediaGalleryPanel({ data, sessionId }: { data: { count: number; items: MediaItem[] }; sessionId: string }) {
  if (data.count === 0) {
    return <p className="p-2 text-sm text-luxury-muted-foreground">No media analyzed yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {data.items.map((item, i) => (
        <motion.div
          key={item.id}
          {...cardMotion}
          transition={{ duration: 0.25, delay: i * 0.03 }}
          className="group relative aspect-square overflow-hidden border border-luxury-border bg-luxury-black/40"
        >
          {item.mediaKind === "IMAGE" ? (
            // eslint-disable-next-line @next/next/no-img-element -- authenticated /api/media stream, not a next/image-optimizable static asset
            <img src={`${item.previewUrl}?sessionId=${encodeURIComponent(sessionId)}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageOff size={18} className="text-luxury-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-4">
            {item.detectedCategory ? (
              <p className="truncate text-[11px] font-semibold text-white">
                {item.detectedCategory.replace(/_/g, " ")}
                {item.categoryConfidence !== null && (
                  <span className={cn("ml-1 font-normal", item.categoryConfidence < 0.5 ? "text-amber-300" : "text-white/70")}>
                    {Math.round(item.categoryConfidence * 100)}%
                  </span>
                )}
              </p>
            ) : (
              <p className="text-[11px] text-white/60">{item.processingStatus === "PROCESSING" ? "Analyzing…" : "Unclassified"}</p>
            )}
          </div>
          {item.duplicateGroup && (
            <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-luxury-black/80 text-amber-300" title="Possible duplicate">
              <Copy size={11} />
            </span>
          )}
          {item.qualityScore !== null && item.qualityScore < 0.35 && (
            <span className="absolute left-1 top-1 bg-luxury-destructive/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Low quality</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function RequestRoomCard({
  roomId,
  status,
  statusLabel,
}: {
  roomId: string;
  status: string;
  statusLabel: (key: string) => string;
}) {
  const t = useTranslations("requestRooms");
  return (
    <motion.div {...cardMotion} transition={{ duration: 0.3 }} className="border border-luxury-gold bg-luxury-gold/5 p-4">
      <p className="font-serif text-base">{t("title")}</p>
      <p className="mb-3 text-sm text-luxury-muted-foreground">{statusLabel(status)}</p>
      <Link
        href={`/account/requests/${roomId}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-luxury-gold no-underline hover:underline"
      >
        {t("title")}
        <ArrowRight size={14} />
      </Link>
    </motion.div>
  );
}
