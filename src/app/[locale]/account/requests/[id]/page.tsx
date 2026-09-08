import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { safeQuery } from "@/lib/db/safe-query";
import { ServiceUnavailableNotice } from "@/components/marketplace/ServiceUnavailableNotice";
import { getSuggestedQuickAccessKeys } from "@/lib/workflows/cross-service-suggestions";
import { CrossServiceSuggestion } from "@/components/workflows/CrossServiceSuggestion";
import { Paperclip } from "lucide-react";

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
      <div className="luxury-surface min-h-screen px-4 py-14 text-luxury-ivory md:px-10">
        <div className="mx-auto max-w-2xl">
          <ServiceUnavailableNotice />
        </div>
      </div>
    );
  }

  if (!room || room.userId !== session.userId) notFound();

  return (
    <div className="luxury-surface min-h-screen px-4 py-14 text-luxury-ivory md:px-10 md:py-20">
      <div className="mx-auto max-w-2xl">
        <span className="mb-3 block h-px w-8 bg-luxury-gold/60" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-luxury-gold">
          {room.type.replace(/_/g, " ")}
        </p>
        <h1 className="mb-10 font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          {t(`status.${room.status}`)}
        </h1>

        <section className="mb-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-luxury-muted-foreground">
            {t("timeline")}
          </h2>
          <ol className="space-y-6 border-l border-luxury-border pl-6">
            {room.statusEvents.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full bg-luxury-gold" />
                <p className="text-sm font-medium text-luxury-ivory">{t(`status.${e.toStatus}`)}</p>
                {e.note && <p className="mt-0.5 text-xs text-luxury-muted-foreground">{e.note}</p>}
                <p className="mt-0.5 text-xs text-luxury-muted-foreground">{e.createdAt.toLocaleString(locale)}</p>
              </li>
            ))}
          </ol>
        </section>

        {room.messages.length > 0 && (
          <section className="mb-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-luxury-muted-foreground">
              {t("messages")}
            </h2>
            <div className="space-y-2">
              {room.messages.map((m) => (
                <div key={m.id} className="border border-luxury-border bg-luxury-graphite p-3 text-sm">
                  {m.content}
                </div>
              ))}
            </div>
          </section>
        )}

        {room.attachments.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-luxury-muted-foreground">
              {t("attachments")}
            </h2>
            <ul className="space-y-2">
              {room.attachments.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 border border-luxury-border bg-luxury-graphite p-3 text-sm text-luxury-ivory no-underline transition-colors duration-200 hover:border-luxury-gold hover:text-luxury-gold"
                  >
                    <Paperclip size={14} className="shrink-0 text-luxury-muted-foreground" />
                    {a.filename}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <CrossServiceSuggestion roomId={room.id} keys={getSuggestedQuickAccessKeys(room.type, room.status)} />
      </div>
    </div>
  );
}
