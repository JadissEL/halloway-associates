"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function SignOutButton() {
  const t = useTranslations("auth");
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/sign-out", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="rounded-none border border-luxury-border px-4 py-2 text-sm font-semibold text-luxury-muted-foreground hover:text-luxury-ivory"
    >
      {t("signOut")}
    </button>
  );
}
