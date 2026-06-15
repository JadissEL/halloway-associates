import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { DiscussCTA } from "@/components/layout/DiscussCTA";
import { SalesChatbot } from "@/components/chat/SalesChatbot";
import { VisitorTracker } from "@/lib/chat/visitor-client";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import "../globals.css";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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

  if (!routing.locales.includes(locale as "en" | "fr")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const tNav = await getTranslations("nav");

  return (
    <html lang={locale} className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <body className="min-h-screen bg-surface font-sans" suppressHydrationWarning>
        <GoogleAnalytics />
        <JsonLd data={[organizationJsonLd(locale), websiteJsonLd(locale)]} />        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          {tNav("skipToContent")}
        </a>
        <NextIntlClientProvider messages={messages}>
          <SiteHeader />
          <main id="main-content">{children}</main>
          <SiteFooter />
          <DiscussCTA />
          <SalesChatbot />
          <VisitorTracker />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
