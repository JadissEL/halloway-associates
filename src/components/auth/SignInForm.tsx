"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export function SignInForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

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
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        {t("emailLabel")}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-[12px] border border-line bg-surface px-4 py-2.5 text-base outline-none focus:border-plum/40"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending" || status === "sent"}
        className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {status === "sending" ? t("sending") : t("sendLink")}
      </button>
      {status === "sent" && (
        <p className="text-sm text-ink-secondary">{t("checkEmail")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">{t("invalidLink")}</p>
      )}
    </form>
  );
}
