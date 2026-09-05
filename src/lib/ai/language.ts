// Layer 0 of the AI pipeline: figure out what language the user is actually
// writing in, as cheaply as possible (spec section "language detection is
// layered, not one big model call"). Unicode-script buckets are free and
// instant; only genuinely ambiguous Latin-script text needs a heuristic.
// Never spend a model call just to detect language.

export type DetectedLanguage =
  | "el" | "ar" | "zh" | "ru" | "en" | "fr" | "unknown";

const SCRIPT_RANGES: { lang: DetectedLanguage; pattern: RegExp }[] = [
  { lang: "el", pattern: /[Ͱ-Ͽἀ-῿]/ },
  { lang: "ar", pattern: /[؀-ۿݐ-ݿ]/ },
  { lang: "zh", pattern: /[一-鿿㐀-䶿]/ },
  { lang: "ru", pattern: /[Ѐ-ӿ]/ },
];

const FRENCH_STOPWORDS = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "je", "j'ai", "vous",
  "nous", "avec", "pour", "et", "est", "dans", "bonjour", "merci", "s'il",
  "chambre", "appartement", "besoin", "cherche", "louer", "acheter",
]);

const ENGLISH_STOPWORDS = new Set([
  "the", "a", "an", "i", "you", "we", "with", "for", "and", "is", "in",
  "hello", "thanks", "please", "room", "apartment", "need", "looking",
  "rent", "buy",
]);

/** Free, instant script-range check. Returns "unknown" for plain Latin text. */
export function detectByScript(text: string): DetectedLanguage {
  for (const { lang, pattern } of SCRIPT_RANGES) {
    if (pattern.test(text)) return lang;
  }
  return "unknown";
}

/** Cheap stopword heuristic to tell English and French apart. No model call. */
function detectLatinHeuristic(text: string): "en" | "fr" {
  const words = text.toLowerCase().match(/[a-zàâçéèêëîïôûùüÿñæœ']+/g) ?? [];
  let frScore = 0;
  let enScore = 0;
  for (const w of words) {
    if (FRENCH_STOPWORDS.has(w)) frScore += 1;
    if (ENGLISH_STOPWORDS.has(w)) enScore += 1;
  }
  return frScore > enScore ? "fr" : "en";
}

export interface LanguageDetectionResult {
  detected: DetectedLanguage;
  /** The language to actually reply in, honoring what's enabled today. */
  replyLocale: string;
}

export function detectLanguage(text: string, fallbackLocale: string): LanguageDetectionResult {
  const scriptMatch = detectByScript(text);
  if (scriptMatch !== "unknown") {
    const enabled = ["en", "el", "fr"];
    return {
      detected: scriptMatch,
      // Reply in the detected language if we actually support it yet;
      // otherwise fall back to the UI locale rather than guessing.
      replyLocale: enabled.includes(scriptMatch) ? scriptMatch : fallbackLocale,
    };
  }

  const latin = detectLatinHeuristic(text);
  return { detected: latin, replyLocale: latin };
}
