import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { prisma } from "@/lib/db/client";
import { safeQuery } from "@/lib/db/safe-query";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ServiceUnavailableNotice } from "@/components/marketplace/ServiceUnavailableNotice";
import { BookACallForm } from "@/components/marketplace/BookACallForm";
import { GatedAction } from "@/components/marketplace/GatedAction";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const el = locale === "el";
  return buildPageMetadata({
    locale,
    path: "/book-a-call",
    title: el
      ? "Κλείστε κλήση άφιξης | Halloway & Associates"
      : "Book an Arrival Call | Halloway & Associates",
    description: el
      ? "Κλείστε μια κλήση με την ομάδα για μετεγκατάσταση, ενοικίαση ή εγκατάσταση στην Αθήνα και την Ελλάδα."
      : "Book a call with the team about relocation, rentals, or getting set up in Athens and Greece.",
  });
}

export default async function BookACallPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bookACall");
  const user = await getCurrentUser();

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
    <div className="luxury-surface min-h-screen px-4 py-14 md:px-10 md:py-20">
      <div className="mx-auto max-w-xl">
        {dbError && <ServiceUnavailableNotice />}
        <span className="mb-3 block h-px w-8 bg-luxury-gold/60" />
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-luxury-gold">{t("eyebrow")}</p>
        <h1 className="text-page-title mb-3">{t("title")}</h1>
        <p className="mb-10 text-sm leading-relaxed text-luxury-muted-foreground">{t("subtitle")}</p>
        {user ? (
          <BookACallForm slots={slots.map((s) => ({ id: s.id, startTime: s.startTime.toISOString() }))} />
        ) : (
          <GatedAction />
        )}
      </div>
    </div>
  );
}
