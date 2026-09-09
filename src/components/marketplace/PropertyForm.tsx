"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitPropertyListing, type PropertyFormState } from "@/app/actions/properties";
import { GatedAction } from "./GatedAction";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Megaphone } from "lucide-react";

const initialState: PropertyFormState = { ok: false };

export function PropertyForm() {
  const t = useTranslations("properties.form");
  const tTypes = useTranslations("properties.types");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState(submitPropertyListing, initialState);

  if (state.error === "sign_in_required") {
    return <GatedAction />;
  }

  return (
    <form
      action={formAction}
      className="flex max-w-xl flex-col gap-5 border border-luxury-border bg-luxury-graphite p-6 text-luxury-ivory md:p-8"
    >
      <input type="hidden" name="locale" value={locale} />
      <Input label={t("titleField")} name="title" required />
      <Textarea label={t("description")} name="description" required rows={4} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label={t("type")} name="propertyType" required>
          {(["ROOM", "APARTMENT", "HOUSE", "LAND", "COMMERCIAL"] as const).map((v) => (
            <option key={v} value={v}>{tTypes(v)}</option>
          ))}
        </Select>
        <Select label={t("intent")} name="listingIntent" required>
          <option value="RENT">Rent</option>
          <option value="SALE">Sale</option>
        </Select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label={t("city")} name="city" required />
        <Input label={t("area")} name="area" hint={t("areaHint")} />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Input label={t("price")} name="priceAmount" type="number" required />
        <Input label={t("livingAreaSqm")} name="livingAreaSqm" type="number" />
        <Input label={t("bedrooms")} name="bedrooms" type="number" />
      </div>
      <Button type="submit" disabled={pending} loading={pending} size="lg" className="mt-2">
        <Megaphone size={15} />
        {t("submit")}
      </Button>
      {state.error === "invalid" && (
        <p className="text-sm text-luxury-destructive">{t("invalidError")}</p>
      )}
      {state.error === "service_unavailable" && (
        <p className="text-sm text-luxury-destructive">{t("serviceUnavailableError")}</p>
      )}
    </form>
  );
}
