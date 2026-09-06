"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MapPin, ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useConversation } from "./ConversationContext";

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
  const { workspace } = useConversation();

  return (
    <div className="flex h-full flex-col border-l border-luxury-border/60 bg-luxury-graphite/45 text-luxury-ivory backdrop-blur-xl">
      <div className="border-b border-luxury-border px-4 py-4">
        <span className="mb-1.5 block h-px w-6 bg-luxury-gold/60" />
        <h2 className="font-serif text-lg">{t("title")}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {!workspace && <p className="text-sm text-luxury-muted-foreground">{t("empty")}</p>}

        {workspace?.type === "properties" && (
          <div className="space-y-3">
            {(workspace.data as { properties: PropertyResult[] }).properties.map((p, i) => (
              <motion.div
                key={p.id}
                {...cardMotion}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group border border-luxury-border bg-luxury-black/40 p-4 transition-colors duration-200 hover:border-luxury-gold"
              >
                {p.isDemo && (
                  <span className="mb-2 inline-block bg-luxury-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-luxury-black">
                    {tMarketplace("demoBadge")}
                  </span>
                )}
                <p className="font-serif text-base transition-colors duration-200 group-hover:text-luxury-gold">{p.title}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-luxury-muted-foreground">
                  <MapPin size={13} />
                  {p.city}
                  {p.area ? `, ${p.area}` : ""}
                </p>
                <p className="mt-2 inline-block border border-luxury-gold/40 px-2 py-1 text-sm font-semibold text-luxury-gold">
                  {p.priceAmount} {p.currency}
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
                {p.isDemo && (
                  <span className="mb-2 inline-block bg-luxury-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-luxury-black">
                    {tMarketplace("demoBadge")}
                  </span>
                )}
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
      </div>
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
