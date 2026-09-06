// Full language roster relevant to the Greek market (spec: "do not hard-code
// around only Greek and English"). `enabled` locales have a real, complete
// `messages/<code>.json` file and are wired into `routing.ts` + the language
// switcher. Turning on a new language later is: translate the JSON file,
// flip `enabled` to true here, and add the code to `routing.locales` —
// nothing else in the app needs to change.
export interface LocaleDefinition {
  code: string;
  englishName: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  enabled: boolean;
}

export const locales: LocaleDefinition[] = [
  { code: "en", englishName: "English", nativeName: "English", dir: "ltr", enabled: true },
  { code: "el", englishName: "Greek", nativeName: "Ελληνικά", dir: "ltr", enabled: true },
  { code: "fr", englishName: "French", nativeName: "Français", dir: "ltr", enabled: true },
  { code: "zh", englishName: "Chinese", nativeName: "中文", dir: "ltr", enabled: false },
  { code: "ar", englishName: "Arabic", nativeName: "العربية", dir: "rtl", enabled: false },
  { code: "sq", englishName: "Albanian", nativeName: "Shqip", dir: "ltr", enabled: false },
  { code: "ru", englishName: "Russian", nativeName: "Русский", dir: "ltr", enabled: false },
  { code: "uk", englishName: "Ukrainian", nativeName: "Українська", dir: "ltr", enabled: false },
  { code: "de", englishName: "German", nativeName: "Deutsch", dir: "ltr", enabled: false },
  { code: "it", englishName: "Italian", nativeName: "Italiano", dir: "ltr", enabled: false },
  { code: "es", englishName: "Spanish", nativeName: "Español", dir: "ltr", enabled: false },
  { code: "tr", englishName: "Turkish", nativeName: "Türkçe", dir: "ltr", enabled: false },
  { code: "sr", englishName: "Serbian", nativeName: "Српски", dir: "ltr", enabled: false },
  { code: "bg", englishName: "Bulgarian", nativeName: "Български", dir: "ltr", enabled: false },
  { code: "ro", englishName: "Romanian", nativeName: "Română", dir: "ltr", enabled: false },
  { code: "pl", englishName: "Polish", nativeName: "Polski", dir: "ltr", enabled: false },
];

export const enabledLocales = locales.filter((l) => l.enabled).map((l) => l.code);

export function getLocaleDefinition(code: string): LocaleDefinition | undefined {
  return locales.find((l) => l.code === code);
}

export function isEnabledLocale(code: string): boolean {
  return enabledLocales.includes(code);
}

// Server actions redirect to `/${locale}/...` using a client-submitted
// hidden field — validate against the enabled roster before it ever reaches
// a redirect() call, rather than trusting z.string() (which accepts
// anything, including "//evil.com").
export function safeLocaleOrDefault(code: string): string {
  return isEnabledLocale(code) ? code : "en";
}
