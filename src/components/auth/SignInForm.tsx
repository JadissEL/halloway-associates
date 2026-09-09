"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

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
      <Input
        label={t("emailLabel")}
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        error={status === "error" ? t("invalidLink") : linkErrorMessage ?? undefined}
      />
      <Button type="submit" disabled={status === "sending" || status === "sent"} loading={status === "sending"} size="lg">
        <Mail size={15} />
        {status === "sending" ? t("sending") : t("sendLink")}
      </Button>
      {status === "sent" && (
        <p className="text-sm text-luxury-muted-foreground">{t("checkEmail")}</p>
      )}
    </form>
  );
}
