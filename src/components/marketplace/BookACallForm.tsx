"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitCallBooking, type BookCallFormState } from "@/app/actions/book-a-call";

const initialState: BookCallFormState = { ok: false };
const inputClass =
  "rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none focus:border-luxury-gold";

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
        <legend className="mb-1 font-serif text-lg">{t("reason.title")}</legend>
        <select name="reason" className={inputClass}>
          {REASON_KEYS.map((k) => (
            <option key={k} value={k}>{t(`reason.options.${k}`)}</option>
          ))}
        </select>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-serif text-lg">{t("topics.title")}</legend>
        <input name="topics" placeholder="housing, taxes, schools…" className={inputClass} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-serif text-lg">{t("callType.title")}</legend>
        <select name="callType" required className={inputClass}>
          {CALL_TYPES.map((k) => (
            <option key={k} value={k}>{t(`callType.options.${k}`)}</option>
          ))}
        </select>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-serif text-lg">{t("slot.title")}</legend>
        <select name="slotId" required className={inputClass}>
          {slots.length === 0 && <option value="">No slots available yet</option>}
          {slots.map((s) => (
            <option key={s.id} value={s.id}>{new Date(s.startTime).toLocaleString(locale)}</option>
          ))}
        </select>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-serif text-lg">{t("details.title")}</legend>
        <input name="countryOfOrigin" placeholder={t("details.countryOfOrigin")} className={inputClass} />
        <input name="cityOfInterest" placeholder={t("details.cityOfInterest")} className={inputClass} />
        <input name="preferredLanguage" placeholder={t("details.language")} defaultValue={locale} className={inputClass} />
      </fieldset>

      <button
        type="submit"
        disabled={pending || slots.length === 0}
        className="rounded-none bg-luxury-gold px-5 py-3 text-sm font-semibold text-luxury-black disabled:opacity-50"
      >
        {t("confirm.button")}
      </button>
      {state.error === "invalid" && <p className="text-sm text-red-400">Please check the required fields.</p>}
      {state.error === "slot_unavailable" && <p className="text-sm text-red-400">That slot was just taken — pick another.</p>}
      {state.error === "service_unavailable" && (
        <p className="text-sm text-red-400">This part of the platform is temporarily unavailable. Please try again shortly.</p>
      )}
    </form>
  );
}
