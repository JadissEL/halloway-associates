"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitCallBooking, type BookCallFormState } from "@/app/actions/book-a-call";
import { FormStep } from "./FormStep";
import { GatedAction } from "./GatedAction";

const initialState: BookCallFormState = { ok: false };
const inputClass =
  "rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none transition-colors duration-200 focus:border-luxury-gold";

const REASON_KEYS = [
  "moving", "visiting", "accommodation", "job", "business", "property",
  "investing", "studying", "family", "dailyLife", "procedures", "services",
  "opportunities", "orientation",
] as const;

const CALL_TYPES = ["ORIENTATION", "RELOCATION", "PROPERTY", "BUSINESS", "WORK_LIFE", "INVESTMENT", "CUSTOM", "UNSURE"] as const;

export function BookACallForm({ slots }: { slots: { id: string; startTime: string }[] }) {
  const t = useTranslations("bookACall.steps");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(submitCallBooking, initialState);

  if (state.error === "sign_in_required") {
    return <GatedAction />;
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-8 text-luxury-ivory">
      <input type="hidden" name="locale" value={locale} />

      <FormStep number={1} title={t("reason.title")}>
        <select name="reason" className={inputClass}>
          {REASON_KEYS.map((k) => (
            <option key={k} value={k}>{t(`reason.options.${k}`)}</option>
          ))}
        </select>
      </FormStep>

      <FormStep number={2} title={t("topics.title")}>
        <input name="topics" placeholder="housing, taxes, schools…" className={inputClass} />
      </FormStep>

      <FormStep number={3} title={t("callType.title")}>
        <select name="callType" required className={inputClass}>
          {CALL_TYPES.map((k) => (
            <option key={k} value={k}>{t(`callType.options.${k}`)}</option>
          ))}
        </select>
      </FormStep>

      <FormStep number={4} title={t("slot.title")}>
        <select name="slotId" required className={inputClass}>
          {slots.length === 0 && <option value="">No slots available yet</option>}
          {slots.map((s) => (
            <option key={s.id} value={s.id}>{new Date(s.startTime).toLocaleString(locale)}</option>
          ))}
        </select>
      </FormStep>

      <FormStep number={5} title={t("details.title")}>
        <div className="flex flex-col gap-3">
          <input name="countryOfOrigin" placeholder={t("details.countryOfOrigin")} className={inputClass} />
          <input name="cityOfInterest" placeholder={t("details.cityOfInterest")} className={inputClass} />
          <input name="preferredLanguage" placeholder={t("details.language")} defaultValue={locale} className={inputClass} />
        </div>
      </FormStep>

      <button
        type="submit"
        disabled={pending || slots.length === 0}
        className="ml-11 bg-luxury-gold px-5 py-3 text-sm font-semibold text-luxury-black shadow-[0_4px_16px_rgba(201,162,74,0.2)] transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
      >
        {t("confirm.button")}
      </button>
      {state.error === "invalid" && <p className="ml-11 text-sm text-red-400">Please check the required fields.</p>}
      {state.error === "slot_unavailable" && <p className="ml-11 text-sm text-red-400">That slot was just taken — pick another.</p>}
      {state.error === "service_unavailable" && (
        <p className="ml-11 text-sm text-red-400">This part of the platform is temporarily unavailable. Please try again shortly.</p>
      )}
    </form>
  );
}
