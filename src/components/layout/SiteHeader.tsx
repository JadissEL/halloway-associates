"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isFeatureEnabled } from "@/lib/features";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function SiteHeader() {
  const t = useTranslations("nav");
  const tMarketplace = useTranslations("marketplaceNav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = [
    { href: "/properties", label: tMarketplace("properties") },
    { href: "/professionals", label: tMarketplace("professionals") },
    { href: "/jobs", label: tMarketplace("jobs") },
    { href: "/services", label: t("services") },
    { href: "/studio", label: t("studio") },
    { href: "/about", label: t("about") },
    ...(isFeatureEnabled("showWork") ? [{ href: "/work", label: t("work") }] : []),
    ...(isFeatureEnabled("showInsights") ? [{ href: "/insights", label: t("insights") }] : []),
  ] as const;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled
          ? "border-luxury-border bg-luxury-black/95 backdrop-blur-md"
          : "border-luxury-border/60 bg-luxury-black",
      )}
    >
      <div className="container-wide flex h-16 items-center justify-between gap-4 px-6 md:h-[72px] md:px-8 lg:px-10">
        <Link
          href="/"
          className="whitespace-nowrap text-base font-semibold tracking-tight text-luxury-ivory no-underline lg:text-lg"
        >
          Halloway <span className="font-semibold">& Associates</span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex xl:gap-6" aria-label="Main">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "whitespace-nowrap text-sm font-medium no-underline transition-colors",
                  active ? "text-luxury-ivory" : "text-luxury-muted-foreground hover:text-luxury-ivory",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex xl:gap-3">
          <NotificationBell />
          <LocaleSwitcher />
          <Link
            href="/post"
            className="whitespace-nowrap border border-luxury-gold px-3.5 py-2.5 text-sm font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
          >
            {tMarketplace("post")}
          </Link>
          <Link
            href="/book-a-call"
            className="whitespace-nowrap border border-luxury-gold px-3.5 py-2.5 text-sm font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
          >
            {tMarketplace("bookACall")}
          </Link>
          <Link
            href="/app"
            className="whitespace-nowrap bg-luxury-azure px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-[0_4px_16px_rgba(59,111,235,0.3)] transition-colors duration-200 hover:bg-luxury-azure-hover"
          >
            {tMarketplace("needHelp")}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-luxury-ivory lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-luxury-border bg-luxury-black px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 text-base font-medium text-luxury-ivory no-underline"
              >
                {link.label}
              </Link>
            ))}
            <LocaleSwitcher variant="mobile" />
            <Link href="/post" className="py-2 text-base font-medium text-luxury-ivory no-underline">
              {tMarketplace("post")}
            </Link>
            <Link href="/contact" className="py-2 text-base font-medium text-luxury-ivory no-underline">
              {t("discuss")}
            </Link>
            <Link
              href="/book-a-call"
              className="mt-2 inline-flex justify-center border border-luxury-gold px-5 py-3 text-sm font-semibold text-luxury-gold no-underline"
            >
              {tMarketplace("bookACall")}
            </Link>
            <Link
              href="/app"
              className="inline-flex justify-center bg-luxury-azure px-5 py-3 text-sm font-semibold text-white no-underline"
            >
              {tMarketplace("needHelp")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
