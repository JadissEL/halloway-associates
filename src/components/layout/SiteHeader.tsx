"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isFeatureEnabled } from "@/lib/features";
import { isStudioRoute } from "@/lib/route-scope";
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

  // The header stays Halloway's existing light chrome on Studio pages
  // (kept as-is, per the design merge decision), but switches to the dark
  // AntaY-co treatment on marketplace pages so it doesn't sit as a stark
  // white bar directly on top of the shell's near-black body — the two were
  // visually unrelated to each other before this.
  const dark = !isStudioRoute(pathname);

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
        dark
          ? scrolled
            ? "border-luxury-border bg-luxury-black/95 backdrop-blur-md"
            : "border-luxury-border/60 bg-luxury-black"
          : scrolled
            ? "border-line bg-surface/95 backdrop-blur-md"
            : "border-transparent bg-surface",
      )}
    >
      <div className="container-wide flex h-16 items-center justify-between gap-4 px-6 md:h-[72px] md:px-8 lg:px-10">
        <Link
          href="/"
          className={cn(
            "whitespace-nowrap text-base font-semibold tracking-tight no-underline lg:text-lg",
            dark ? "text-luxury-ivory" : "text-ink",
          )}
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
                  dark
                    ? active
                      ? "text-luxury-ivory"
                      : "text-luxury-muted-foreground hover:text-luxury-ivory"
                    : active
                      ? "text-ink"
                      : "text-ink-secondary hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex xl:gap-3">
          <NotificationBell dark={dark} />
          <LocaleSwitcher dark={dark} />
          <Link
            href="/post"
            className={cn(
              "whitespace-nowrap text-sm font-medium no-underline",
              dark ? "text-luxury-muted-foreground hover:text-luxury-ivory" : "text-ink-secondary hover:text-ink",
            )}
          >
            {tMarketplace("post")}
          </Link>
          {!dark && (
            <Link
              href="/contact"
              className="whitespace-nowrap text-sm font-medium text-ink-secondary no-underline hover:text-ink"
            >
              {t("discuss")}
            </Link>
          )}
          <Link
            href="/book-a-call"
            className={cn(
              "whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold no-underline transition-colors duration-200",
              dark
                ? "border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black"
                : "rounded-full border border-line text-ink-secondary hover:border-ink hover:text-ink",
            )}
          >
            {tMarketplace("bookACall")}
          </Link>
          <Link
            href="/app"
            className={cn(
              "whitespace-nowrap px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-[0_4px_16px_rgba(59,111,235,0.3)] transition-colors duration-200 hover:bg-luxury-azure-hover",
              dark ? "bg-luxury-azure" : "rounded-full bg-luxury-azure",
            )}
          >
            {tMarketplace("needHelp")}
          </Link>
        </div>

        <button
          type="button"
          className={cn("inline-flex items-center justify-center rounded-md p-2 lg:hidden", dark ? "text-luxury-ivory" : "text-ink")}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className={cn("border-t px-6 py-4 md:hidden", dark ? "border-luxury-border bg-luxury-black" : "border-line bg-surface")}>
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn("py-2 text-base font-medium no-underline", dark ? "text-luxury-ivory" : "text-ink")}
              >
                {link.label}
              </Link>
            ))}
            <LocaleSwitcher variant="mobile" dark={dark} />
            <Link href="/post" className={cn("py-2 text-base font-medium no-underline", dark ? "text-luxury-ivory" : "text-ink")}>
              {tMarketplace("post")}
            </Link>
            <Link
              href="/contact"
              className={cn("py-2 text-base font-medium no-underline", dark ? "text-luxury-ivory" : "text-ink")}
            >
              {t("discuss")}
            </Link>
            <Link
              href="/book-a-call"
              className={cn(
                "mt-2 inline-flex justify-center rounded-full border px-5 py-3 text-sm font-semibold no-underline",
                dark ? "rounded-none border-luxury-gold text-luxury-gold" : "border-line text-ink-secondary",
              )}
            >
              {tMarketplace("bookACall")}
            </Link>
            <Link
              href="/app"
              className={cn(
                "inline-flex justify-center rounded-full px-5 py-3 text-sm font-semibold text-white no-underline",
                dark && "rounded-none",
                "bg-luxury-azure",
              )}
            >
              {tMarketplace("needHelp")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
