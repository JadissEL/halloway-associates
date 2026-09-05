import { getTranslations } from "next-intl/server";

export async function ServiceUnavailableNotice() {
  const t = await getTranslations("common");
  return (
    <div className="mb-6 rounded-none border border-luxury-destructive/60 bg-luxury-destructive/10 px-4 py-3 text-sm text-luxury-ivory">
      {t("serviceUnavailable")}
    </div>
  );
}
