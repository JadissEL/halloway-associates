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
        <label htmlFor="focus" className="mb-2 block text-sm font-medium text-ink">
          {t("focus")}
        </label>
        <select
          id="focus"
          name="focus"
          defaultValue={focusOptions.includes(defaultFocus as (typeof focusOptions)[number]) ? defaultFocus : "other"}
          className="w-full rounded-[12px] border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-plum/40"
        >
          {focusOptions.map((option) => (
            <option key={option} value={option}>
              {t(`focusOptions.${option}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-ink">
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={cn(
            "w-full resize-y rounded-[12px] border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-plum/40",
            state.fieldErrors?.message && "border-red-400",
          )}
        />
        {state.fieldErrors?.message && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-full bg-ink px-8 py-3.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {pending ? t("sending") : t("submit")}
      </button>

      {state.message && (
        <p
          className={cn(
            "text-sm",
            state.ok ? "text-plum" : "text-red-600",
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
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className={cn(
          "w-full rounded-[12px] border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-plum/40",
          error && "border-red-400",
        )}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
