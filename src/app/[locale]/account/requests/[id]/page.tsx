import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { safeQuery } from "@/lib/db/safe-query";
import { ServiceUnavailableNotice } from "@/components/marketplace/ServiceUnavailableNotice";
import { getSuggestedQuickAccessKeys } from "@/lib/workflows/cross-service-suggestions";
import { CrossServiceSuggestion } from "@/components/workflows/CrossServiceSuggestion";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function RequestRoomPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("requestRooms");

  const session = await getSession();
  if (!session) redirect(`/${locale}/sign-in`);

  const { data: room, error: dbError } = await safeQuery(
    () =>
      prisma.requestRoom.findUnique({
        where: { id },
        include: {
          statusEvents: { orderBy: { createdAt: "asc" } },
          messages: { orderBy: { createdAt: "asc" } },
          attachments: true,
        },
      }),
    null,
  );

  if (dbError) {
    return (
      <div className="min-h-screen bg-luxury-black px-4 py-10 text-luxury-ivory md:px-10">
        <div className="mx-auto max-w-2xl">
          <ServiceUnavailableNotice />
        </div>
      </div>
    );
  }

  if (!room || room.userId !== session.userId) notFound();

  return (
    <div className="min-h-screen bg-luxury-black px-4 py-10 text-luxury-ivory md:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-luxury-gold">
          {room.type.replace(/_/g, " ")}
        </p>
        <h1 className="mb-6 font-serif text-3xl">{t(`status.${room.status}`)}</h1>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-luxury-muted-foreground">
            {t("timeline")}
          </h2>
          <ol className="space-y-3 border-l border-luxury-border pl-4">
            {room.statusEvents.map((e) => (
              <li key={e.id}>
                <p className="text-sm font-medium">{t(`status.${e.toStatus}`)}</p>
                {e.note && <p className="text-xs text-luxury-muted-foreground">{e.note}</p>}
                <p className="text-xs text-luxury-muted-foreground">{e.createdAt.toLocaleString(locale)}</p>
              </li>
            ))}
          </ol>
        </section>

        {room.messages.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-luxury-muted-foreground">
              {t("messages")}
            </h2>
            <div className="space-y-2">
              {room.messages.map((m) => (
                <div key={m.id} className="rounded-none border border-luxury-border p-3 text-sm">
                  {m.content}
                </div>
              ))}
            </div>
          </section>
        )}

        <CrossServiceSuggestion roomId={room.id} keys={getSuggestedQuickAccessKeys(room.type, room.status)} />
      </div>
    </div>
  );
}
