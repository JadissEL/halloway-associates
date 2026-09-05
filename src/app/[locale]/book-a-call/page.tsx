import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db/client";
import { safeQuery } from "@/lib/db/safe-query";
import { ServiceUnavailableNotice } from "@/components/marketplace/ServiceUnavailableNotice";
import { BookACallForm } from "@/components/marketplace/BookACallForm";

type Props = { params: Promise<{ locale: string }> };

export default async function BookACallPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bookACall");

  const { data: slots, error: dbError } = await safeQuery(
    () =>
      prisma.availabilitySlot.findMany({
        where: { isBooked: false, startTime: { gte: new Date() } },
        orderBy: { startTime: "asc" },
        take: 20,
      }),
    [],
  );

  return (
    <div className="min-h-screen bg-luxury-black px-4 py-10 md:px-10">
      <div className="mx-auto max-w-xl">
        {dbError && <ServiceUnavailableNotice />}
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-luxury-gold">{t("eyebrow")}</p>
        <h1 className="mb-3 font-serif text-3xl text-luxury-ivory">{t("title")}</h1>
        <p className="mb-8 text-sm text-luxury-muted-foreground">{t("subtitle")}</p>
        <BookACallForm slots={slots.map((s) => ({ id: s.id, startTime: s.startTime.toISOString() }))} />
      </div>
    </div>
  );
}
