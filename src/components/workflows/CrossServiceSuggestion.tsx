"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function CrossServiceSuggestion({ roomId, keys }: { roomId: string; keys: string[] }) {
  const t = useTranslations("requestRooms.crossService");
  const tQuick = useTranslations("shell.quickAccess");
  const router = useRouter();
  const storageKey = `halloway-cross-service-dismissed-${roomId}`;
  const [dismissed, setDismissed] = useState(
    typeof window !== "undefined" && window.localStorage.getItem(storageKey) === "1",
  );

  if (keys.length === 0 || dismissed) return null;

  return (
    <section className="mt-10 rounded-none border border-luxury-gold p-4">
      <p className="mb-3 font-serif text-base text-luxury-ivory">{t("title")}</p>
      <div className="flex flex-wrap gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => router.push("/app")}
            className="rounded-none border border-luxury-border px-3 py-1.5 text-xs font-medium text-luxury-ivory hover:border-luxury-gold hover:text-luxury-gold"
          >
            {tQuick(key)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(storageKey, "1");
            setDismissed(true);
          }}
          className="rounded-none px-3 py-1.5 text-xs font-medium text-luxury-muted-foreground hover:text-luxury-ivory"
        >
          {t("dismiss")}
        </button>
      </div>
    </section>
  );
}
