import { defineRouting } from "next-intl/routing";
import { enabledLocales } from "./locales-config";

export const routing = defineRouting({
  locales: enabledLocales as ["en", "el", "fr"],
  defaultLocale: "en",
  localePrefix: "always",
});
