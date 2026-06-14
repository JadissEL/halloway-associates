"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isFeatureEnabled } from "@/lib/features";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
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
    { href: "/services", label: t("services") },
    { href: "/about", label: t("about") },
    ...(isFeatureEnabled("showWork") ? [{ href: "/work", label: t("work") }] : []),
    ...(isFeatureEnabled("showInsights") ? [{ href: "/insights", label: t("insights") }] : []),
  ] as const;

  const alternateLocale = locale === "en" ? "fr" : "en";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors duration-300",
        scrolled ? "border-line bg-surface/95 backdrop-blur-md" : "border-transparent bg-surface",
      )}
    >
      <div className="container-wide flex h-16 items-center justify-between px-6 md:h-[72px] md:px-10 lg:px-16">
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline md:gap-3"
          aria-label="Halloway & Associates"
        >
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 rounded-[10px] md:h-10 md:w-10"
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-ink md:text-xl">
            Halloway <span className="font-semibold">& Associates</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium no-underline transition-colors",
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "text-ink"
                  : "text-ink-secondary hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={pathname}
            locale={alternateLocale}
            className="rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted no-underline hover:text-ink"
            aria-label={t("language")}
          >
            {alternateLocale}
          </Link>
          <Link
            href="/contact"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white no-underline hover:opacity-90"
          >
            {t("discuss")}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-surface px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 text-base font-medium text-ink no-underline"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={pathname}
              locale={alternateLocale}
              className="py-2 text-sm font-semibold uppercase tracking-wider text-ink-muted no-underline"
            >
              {alternateLocale}
            </Link>
            <Link
              href="/contact"
              className="mt-2 inline-flex justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white no-underline"
            >
              {t("discuss")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
