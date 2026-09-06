"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitLawyerRequest, type LawyerRequestFormState } from "@/app/actions/lawyer-request";

const initialState: LawyerRequestFormState = { ok: false };
const inputClass =
  "rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none focus:border-luxury-gold";

export function LawyerRequestForm() {
  const t = useTranslations("lawyerRequest.steps");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(submitLawyerRequest, initialState);

  if (state.error === "sign_in_required") {
    return (
      <div className="rounded-none border border-luxury-border p-6 text-luxury-ivory">
        <p className="mb-4">Please sign in first.</p>
        <Link href="/sign-in" className="text-luxury-gold no-underline">Sign in →</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6 text-luxury-ivory">
      <input type="hidden" name="locale" value={locale} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-serif text-lg">{t("category.title")}</legend>
        <select name="category" required className={inputClass}>
          {(["property", "immigration", "business", "tax", "employment", "family", "contract", "dispute", "other"] as const).map(
            (opt) => (
              <option key={opt} value={opt}>{t(`category.options.${opt}`)}</option>
            ),
          )}
        </select>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-serif text-lg">{t("situation.title")}</legend>
        <textarea name="situation" required rows={4} className={inputClass} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-serif text-lg">{t("consultationMode.title")}</legend>
        <select name="consultationMode" className={inputClass}>
          {(["remote", "office", "phone", "online"] as const).map((opt) => (
            <option key={opt} value={opt}>{t(`consultationMode.options.${opt}`)}</option>
          ))}
        </select>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-serif text-lg">{t("availability.title")}</legend>
        <input name="availability" className={inputClass} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-serif text-lg">{t("language.title")}</legend>
        <input name="language" className={inputClass} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-serif text-lg">{t("payment.title")}</legend>
        <input name="paymentPreference" className={inputClass} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-serif text-lg">{t("additional.title")}</legend>
        <textarea name="additionalInfo" rows={3} className={inputClass} />
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-none bg-luxury-gold px-5 py-3 text-sm font-semibold text-luxury-black disabled:opacity-50"
      >
        {t("submit.button")}
      </button>
      {state.error === "invalid" && (
        <p className="text-sm text-red-400">Please check the required fields.</p>
      )}
      {state.error === "service_unavailable" && (
        <p className="text-sm text-red-400">This part of the platform is temporarily unavailable. Please try again shortly.</p>
      )}
    </form>
  );
}
