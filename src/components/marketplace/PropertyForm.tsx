"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitPropertyListing, type PropertyFormState } from "@/app/actions/properties";

const initialState: PropertyFormState = { ok: false };

export function PropertyForm() {
  const t = useTranslations("properties.form");
  const tTypes = useTranslations("properties.types");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(submitPropertyListing, initialState);

  if (state.error === "sign_in_required") {
    return (
      <div className="border border-luxury-border bg-luxury-graphite p-6 text-luxury-ivory">
        <p className="mb-4">Please sign in first.</p>
        <Link href="/sign-in" className="text-luxury-gold no-underline hover:underline">Sign in →</Link>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="flex max-w-xl flex-col gap-5 border border-luxury-border bg-luxury-graphite p-6 text-luxury-ivory md:p-8"
    >
      <input type="hidden" name="locale" value={locale} />
      <Field label={t("titleField")} name="title" required />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("description")}
        <textarea name="description" required rows={4} className={inputClass} />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("type")}
          <select name="propertyType" required className={inputClass}>
            {(["ROOM", "APARTMENT", "HOUSE", "LAND", "COMMERCIAL"] as const).map((v) => (
              <option key={v} value={v}>{tTypes(v)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t("intent")}
          <select name="listingIntent" required className={inputClass}>
            <option value="RENT">Rent</option>
            <option value="SALE">Sale</option>
          </select>
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("city")} name="city" required />
        <Field label={t("area")} name="area" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("price")} name="priceAmount" type="number" required />
        <Field label={t("bedrooms")} name="bedrooms" type="number" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 bg-luxury-gold px-5 py-3 text-sm font-semibold text-luxury-black shadow-[0_4px_16px_rgba(201,162,74,0.2)] transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
      >
        {t("submit")}
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

const inputClass =
  "rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none transition-colors duration-200 focus:border-luxury-gold";

function Field({
  label, name, type = "text", required,
}: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input name={name} type={type} required={required} className={inputClass} />
    </label>
  );
}
