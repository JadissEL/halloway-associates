"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { locales } from "@/i18n/locales-config";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const enabledLocaleDefs = locales.filter((l) => l.enabled);

export function LocaleSwitcher({
  variant = "desktop",
  dark = false,
}: {
  variant?: "desktop" | "mobile";
  dark?: boolean;
}) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const current = enabledLocaleDefs.find((l) => l.code === locale);

  if (variant === "mobile") {
    return (
      <div className="flex flex-wrap gap-2 py-2" aria-label={t("chooseLanguage")}>
        {enabledLocaleDefs.map((l) => (
          <Link
            key={l.code}
            href={pathname}
            locale={l.code}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide no-underline",
              l.code === locale
                ? dark
                  ? "border-luxury-gold bg-luxury-gold text-luxury-black"
                  : "border-ink bg-ink text-white"
                : dark
                  ? "border-luxury-border text-luxury-muted-foreground hover:text-luxury-ivory"
                  : "border-line text-ink-muted hover:text-ink",
            )}
          >
            {l.code}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("chooseLanguage")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider",
          dark ? "text-luxury-muted-foreground hover:text-luxury-ivory" : "text-ink-muted hover:text-ink",
        )}
      >
        <Globe size={14} />
        {current?.code ?? locale}
      </button>
      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute right-0 top-full z-50 mt-2 min-w-[10rem] rounded-none border py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.3)]",
            dark ? "border-luxury-border bg-luxury-graphite" : "border-line bg-surface",
          )}
        >
          {enabledLocaleDefs.map((l) => (
            <Link
              key={l.code}
              href={pathname}
              locale={l.code}
              onClick={() => setOpen(false)}
              role="option"
              aria-selected={l.code === locale}
              className={cn(
                "flex items-center justify-between px-4 py-2 text-sm no-underline",
                dark
                  ? l.code === locale
                    ? "font-semibold text-luxury-gold"
                    : "text-luxury-ivory hover:text-luxury-gold"
                  : l.code === locale
                    ? "font-semibold text-ink"
                    : "text-ink-secondary hover:text-ink",
              )}
            >
              <span>{l.nativeName}</span>
              <span className={cn("text-xs uppercase", dark ? "text-luxury-muted-foreground" : "text-ink-faint")}>
                {l.code}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
