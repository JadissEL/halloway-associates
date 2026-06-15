"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  applyGoogleConsent,
  persistConsent,
  readStoredConsent,
  type ConsentChoice,
} from "@/lib/consent/consent";

export function ConsentBanner() {
  const t = useTranslations("consent");
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readStoredConsent();
    if (stored) {
      applyGoogleConsent(stored);
      return;
    }
    setVisible(true);
  }, []);

  const choose = (choice: ConsentChoice) => {
    persistConsent(choice);
    applyGoogleConsent(choice);
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-surface/98 p-4 shadow-[0_-8px_32px_rgba(26,26,26,0.08)] backdrop-blur-md md:p-6"
    >
      <div className="container-wide mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="min-w-0 flex-1">
          <p id="consent-title" className="text-sm font-semibold text-ink">
            {t("title")}
          </p>
          <p id="consent-description" className="mt-1.5 text-sm leading-relaxed text-ink-secondary">
            {t("body")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded-full border border-line bg-page px-4 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:text-ink"
          >
            {t("reject")}
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
