import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { ThreePanelShell } from "@/components/shell/ThreePanelShell";
import { ConciergeGate } from "@/components/shell/ConciergeGate";
import { getCurrentUser } from "@/lib/auth/current-user";

// The three-panel AI concierge workspace — previously the site root, now
// reached via the landing page's "Start now" CTA and every nav entry point
// ("I Need Help", quick-access tags, etc.). Not indexed: this is the
// product surface people are sent to, not a page meant to rank on its own
// (the marketing landing page at `/` covers that job now).
//
// Sign-in is required to use the concierge at all (checked server-side,
// before ThreePanelShell's client-side chat state ever mounts) — a
// deliberate product decision distinct from the rest of the marketplace,
// where browsing listings never requires an account.
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "homeMetadata" });

  return buildPageMetadata({
    locale,
    path: "app",
    title: t("title"),
    description: t("description"),
    noindex: true,
  });
}

export default async function AppPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations("nav");
  const user = await getCurrentUser();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(locale, [{ name: tNav("home"), path: "app" }])} />
      {user ? <ThreePanelShell /> : <ConciergeGate />}
    </>
  );
}
