"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export function SignInForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // /api/auth/verify redirects back here with ?error=invalid (expired/used/
  // tampered link) or ?error=server (a transient failure) when a magic link
  // fails — this previously landed on a completely blank form with no
  // explanation, even though a translation string for exactly this existed.
  const linkError = searchParams.get("error");
  const linkErrorMessage =
    status === "idle" && linkError === "invalid"
      ? t("invalidLink")
      : status === "idle" && linkError === "server"
        ? tCommon("serviceUnavailable")
        : null;

  return (
    <form
      className="mx-auto flex max-w-sm flex-col gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("sending");
        try {
          const res = await fetch("/api/auth/request-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, locale }),
          });
          setStatus(res.ok ? "sent" : "error");
        } catch {
          setStatus("error");
        }
      }}
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium text-luxury-ivory">
        {t("emailLabel")}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-base text-luxury-ivory outline-none focus:border-luxury-gold"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending" || status === "sent"}
        className="rounded-none bg-luxury-gold px-5 py-3 text-sm font-semibold text-luxury-black disabled:opacity-50"
      >
        {status === "sending" ? t("sending") : t("sendLink")}
      </button>
      {status === "sent" && (
        <p className="text-sm text-luxury-muted-foreground">{t("checkEmail")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-400">{t("invalidLink")}</p>
      )}
      {linkErrorMessage && <p className="text-sm text-red-400">{linkErrorMessage}</p>}
    </form>
  );
}
