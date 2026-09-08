"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { submitContactForm, type ContactFormState } from "@/app/actions/contact";
import { cn } from "@/lib/utils";

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
        <Field label={t("name")} name="name" required error={state.fieldErrors?.name} />
        <Field label={t("company")} name="company" />
      </div>
      <Field
        label={t("email")}
        name="email"
        type="email"
        required
        error={state.fieldErrors?.email}
      />
      <div>
        <label htmlFor="focus" className="mb-2 block text-sm font-medium text-luxury-ivory">
          {t("focus")}
        </label>
        <select
          id="focus"
          name="focus"
          defaultValue={focusOptions.includes(defaultFocus as (typeof focusOptions)[number]) ? defaultFocus : "other"}
          className="w-full rounded-none border border-luxury-border bg-luxury-input px-4 py-3 text-luxury-ivory outline-none focus:border-luxury-gold"
        >
          {focusOptions.map((option) => (
            <option key={option} value={option}>
              {t(`focusOptions.${option}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-luxury-ivory">
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={cn(
            "w-full resize-y rounded-none border border-luxury-border bg-luxury-input px-4 py-3 text-luxury-ivory outline-none focus:border-luxury-gold",
            state.fieldErrors?.message && "border-luxury-destructive",
          )}
        />
        {state.fieldErrors?.message && (
          <p className="mt-1 text-sm text-luxury-destructive">{state.fieldErrors.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex bg-luxury-gold px-8 py-3.5 text-sm font-semibold text-luxury-black transition-all duration-200 hover:brightness-110 disabled:opacity-60"
      >
        {pending ? t("sending") : t("submit")}
      </button>

      {state.message && (
        <p
          className={cn(
            "text-sm",
            state.ok ? "text-luxury-gold" : "text-luxury-destructive",
          )}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-luxury-ivory">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className={cn(
          "w-full rounded-none border border-luxury-border bg-luxury-input px-4 py-3 text-luxury-ivory outline-none focus:border-luxury-gold",
          error && "border-luxury-destructive",
        )}
      />
      {error && <p className="mt-1 text-sm text-luxury-destructive">{error}</p>}
    </div>
  );
}
