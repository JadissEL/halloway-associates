import { Inter, Playfair_Display } from "next/font/google";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StudioWidgets } from "@/components/layout/StudioWidgets";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import "../globals.css";
// subsets: "latin" alone silently dropped Greek glyphs from the self-hosted
// font file — confirmed against Next's own Google-fonts metadata (Inter
// does ship a "greek" subset, it just wasn't requested). Since Inter is the
// platform's one interface font (nav, buttons, forms, chat, body text
// everywhere), every el locale page was quietly falling back to the
// browser's default system font for every Greek character on the site,
// not just headlines. latin-ext is added too for full French diacritic
// coverage (œ and less-common accented capitals sit outside base "latin").
const inter = Inter({
  subsets: ["latin", "latin-ext", "greek"],
  variable: "--font-inter",
  display: "swap",
});

// Serif headline face for the new Greece marketplace shell (AntaY-co design
// system, section 1.3). Studio pages don't reference --font-serif, so their
// Inter-only look is unaffected — this only adds a font, it doesn't switch one.
//
// No "greek" subset here on purpose: Playfair Display has no Greek glyphs
// on Google Fonts at all (checked against the same metadata) — for Greek
// text this deliberately, not accidentally, falls through to the Georgia
// serif already declared in --font-serif's stack (globals.css), which does
// have proper Greek coverage and a reasonably close weight/proportion match.
// Weights trimmed from 5 to the 2 actually used anywhere in the app (400 —
// implicit on card/list titles, 600 — every real heading; confirmed by
// auditing every `font-serif` call site) rather than shipping 500/700/800
// nothing renders with.
const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  variable: "--font-playfair",
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    icons: {
      icon: [
        { url: "/brand/logo-mark.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [
        { url: "/brand/logo-mark.png", type: "image/png", sizes: "512x512" },
      ],
    },
    manifest: "/manifest.webmanifest",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    other: {
      "content-language": locale,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const tNav = await getTranslations("nav");

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${playfair.variable} font-sans`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-luxury-black font-sans" suppressHydrationWarning>
        <GoogleAnalytics />
        <JsonLd data={[organizationJsonLd(locale), websiteJsonLd(locale)]} />        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-luxury-gold focus:px-4 focus:py-2 focus:text-luxury-black"
        >
          {tNav("skipToContent")}
        </a>
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <SiteHeader />
            <main id="main-content">{children}</main>
            <SiteFooter />
            <StudioWidgets />
            <ConsentBanner />
          </ToastProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
