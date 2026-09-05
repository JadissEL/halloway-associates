"use client";

import { useTranslations } from "next-intl";
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

export function WorkspacePanel() {
  const t = useTranslations("shell.workspace");
  const tMarketplace = useTranslations("marketplace");
  const tStatus = useTranslations("requestRooms.status");
  const { workspace } = useConversation();

  return (
    <div className="flex h-full flex-col bg-luxury-graphite text-luxury-ivory">
      <h2 className="border-b border-luxury-border px-4 py-4 font-serif text-lg">{t("title")}</h2>
      <div className="flex-1 overflow-y-auto p-4">
        {!workspace && <p className="text-sm text-luxury-muted-foreground">{t("empty")}</p>}

        {workspace?.type === "properties" && (
          <div className="space-y-3">
            {(workspace.data as { properties: PropertyResult[] }).properties.map((p) => (
              <div key={p.id} className="rounded-none border border-luxury-border p-4">
                {p.isDemo && (
                  <span className="mb-1 inline-block bg-luxury-gold px-2 py-0.5 text-[10px] font-bold uppercase text-luxury-black">
                    {tMarketplace("demoBadge")}
                  </span>
                )}
                <p className="font-serif text-base">{p.title}</p>
                <p className="text-sm text-luxury-muted-foreground">
                  {p.city}{p.area ? `, ${p.area}` : ""} · {p.priceAmount} {p.currency}
                </p>
              </div>
            ))}
          </div>
        )}

        {workspace?.type === "professionals" && (
          <div className="space-y-3">
            {(workspace.data as { professionals: ProfessionalResult[] }).professionals.map((p) => (
              <div key={p.id} className="rounded-none border border-luxury-border p-4">
                {p.isDemo && (
                  <span className="mb-1 inline-block bg-luxury-gold px-2 py-0.5 text-[10px] font-bold uppercase text-luxury-black">
                    {tMarketplace("demoBadge")}
                  </span>
                )}
                <p className="font-serif text-base">{p.name}</p>
                <p className="text-sm text-luxury-muted-foreground">{p.bio}</p>
                {p.externalUrl && (
                  <a
                    href={p.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-luxury-gold"
                  >
                    {p.externalUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
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
    <div className="rounded-none border border-luxury-gold p-4">
      <p className="font-serif text-base">{t("title")}</p>
      <p className="mb-3 text-sm text-luxury-muted-foreground">{statusLabel(status)}</p>
      <Link href={`/account/requests/${roomId}`} className="text-sm font-semibold text-luxury-gold no-underline">
        {t("title")} →
      </Link>
    </div>
  );
}
