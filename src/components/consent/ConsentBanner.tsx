"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  applyGoogleConsent,
  persistConsent,
  readStoredConsent,
  type ConsentChoice,
} from "@/lib/consent/consent";

const CONSENT_EVENT = "halloway-consent-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CONSENT_EVENT, onStoreChange);
  return () => window.removeEventListener(CONSENT_EVENT, onStoreChange);
}

function getSnapshot() {
  return readStoredConsent() ? "hidden" : "prompt";
}

function getServerSnapshot() {
  return "hidden";
}

export function ConsentBanner() {
  const t = useTranslations("consent");
  const visibility = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) applyGoogleConsent(stored);
  }, []);

  const choose = (choice: ConsentChoice) => {
    persistConsent(choice);
    applyGoogleConsent(choice);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  if (visibility !== "prompt") return null;

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-description"
      // A compact corner card, not a full-width bar: on the AI shell pages
      // every edge of the viewport is claimed by something (chat input at
      // bottom-center, results at right, notification/locale controls in
      // the header) except the top-left, which only overlaps the low-stakes
      // "My Activity" panel rather than any primary control. A full-width
      // bottom bar previously hid the chat input completely on first visit.
      className="fixed left-4 top-20 z-[60] w-[min(19rem,calc(100vw-2rem))] border border-luxury-border bg-luxury-graphite/98 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-md"
    >
      <p id="consent-title" className="text-sm font-semibold text-luxury-ivory">
        {t("title")}
      </p>
      <p id="consent-description" className="mt-1.5 text-sm leading-relaxed text-luxury-muted-foreground">
        {t("body")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => choose("granted")}
          className="bg-luxury-gold px-4 py-2 text-xs font-semibold text-luxury-black transition-all hover:brightness-110"
        >
          {t("accept")}
        </button>
        <button
          type="button"
          onClick={() => choose("denied")}
          className="border border-luxury-border px-4 py-2 text-xs font-semibold text-luxury-muted-foreground transition-colors hover:text-luxury-ivory"
        >
          {t("reject")}
        </button>
      </div>
    </div>
  );
}
