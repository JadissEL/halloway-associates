"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitLawyerRequest, type LawyerRequestFormState } from "@/app/actions/lawyer-request";
import { FormStep } from "./FormStep";
import { GatedAction } from "./GatedAction";

const initialState: LawyerRequestFormState = { ok: false };
const inputClass =
  "rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none transition-colors duration-200 focus:border-luxury-gold";

export function LawyerRequestForm() {
  const t = useTranslations("lawyerRequest.steps");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(submitLawyerRequest, initialState);

  if (state.error === "sign_in_required") {
    return <GatedAction />;
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-8 text-luxury-ivory">
      <input type="hidden" name="locale" value={locale} />

      <FormStep number={1} title={t("category.title")}>
        <select name="category" required className={inputClass}>
          {(["property", "immigration", "business", "tax", "employment", "family", "contract", "dispute", "other"] as const).map(
            (opt) => (
              <option key={opt} value={opt}>{t(`category.options.${opt}`)}</option>
            ),
          )}
        </select>
      </FormStep>

      <FormStep number={2} title={t("situation.title")}>
        <textarea name="situation" required rows={4} className={inputClass} />
      </FormStep>

      <FormStep number={3} title={t("consultationMode.title")}>
        <select name="consultationMode" className={inputClass}>
          {(["remote", "office", "phone", "online"] as const).map((opt) => (
            <option key={opt} value={opt}>{t(`consultationMode.options.${opt}`)}</option>
          ))}
        </select>
      </FormStep>

      <FormStep number={4} title={t("availability.title")}>
        <input name="availability" className={inputClass} />
      </FormStep>

      <FormStep number={5} title={t("language.title")}>
        <input name="language" className={inputClass} />
      </FormStep>

      <FormStep number={6} title={t("payment.title")}>
        <input name="paymentPreference" className={inputClass} />
      </FormStep>

      <FormStep number={7} title={t("additional.title")}>
        <textarea name="additionalInfo" rows={3} className={inputClass} />
      </FormStep>

      <button
        type="submit"
        disabled={pending}
        className="ml-11 bg-luxury-gold px-5 py-3 text-sm font-semibold text-luxury-black shadow-[0_4px_16px_rgba(201,162,74,0.2)] transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
      >
        {t("submit.button")}
      </button>
      {state.error === "invalid" && (
        <p className="ml-11 text-sm text-red-400">Please check the required fields.</p>
      )}
      {state.error === "service_unavailable" && (
        <p className="ml-11 text-sm text-red-400">This part of the platform is temporarily unavailable. Please try again shortly.</p>
      )}
    </form>
  );
}
