"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { submitContactForm, type ContactFormState } from "@/app/actions/contact";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Send } from "lucide-react";

const initialState: ContactFormState = { ok: false, message: "" };

const focusOptions = ["automation", "revenue", "growth", "product", "other"] as const;

export function ContactForm() {
  const t = useTranslations("contactPage.form");
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(submitContactForm, initialState);
  const defaultFocus = searchParams.get("focus") ?? "";

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Input label={t("name")} name="name" required error={state.fieldErrors?.name} />
        <Input label={t("company")} name="company" />
      </div>
      <Input label={t("email")} name="email" type="email" required error={state.fieldErrors?.email} />

      <Select
        label={t("focus")}
        name="focus"
        defaultValue={focusOptions.includes(defaultFocus as (typeof focusOptions)[number]) ? defaultFocus : "other"}
      >
        {focusOptions.map((option) => (
          <option key={option} value={option}>
            {t(`focusOptions.${option}`)}
          </option>
        ))}
      </Select>

      <Textarea label={t("message")} name="message" rows={5} required error={state.fieldErrors?.message} />

      <Button type="submit" disabled={pending} loading={pending} size="lg">
        <Send size={15} />
        {pending ? t("sending") : t("submit")}
      </Button>

      {state.message && (
        <p
          className={state.ok ? "text-sm text-luxury-gold" : "text-sm text-luxury-destructive"}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
