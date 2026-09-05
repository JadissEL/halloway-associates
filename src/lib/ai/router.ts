import { matchPartnerPlatform } from "./partner-platforms";

export interface RouterResult {
  handled: true;
  reply: string;
  layer: "DETERMINISTIC";
}

export interface RouterMiss {
  handled: false;
}

const GREETINGS: Record<string, RegExp> = {
  en: /^\s*(hi|hello|hey|good morning|good evening)[\s!.,]*$/i,
  el: /^\s*(γεια( σας| σου)?|καλημέρα|καλησπέρα)[\s!.,]*$/i,
  fr: /^\s*(bonjour|salut|bonsoir)[\s!.,]*$/i,
};

const GREETING_REPLY: Record<string, string> = {
  en: "Hi! Tell me what you're trying to do in Greece — housing, a professional, a call to plan your move — and I'll help you get there.",
  el: "Γεια σας! Πείτε μου τι θέλετε να κάνετε στην Ελλάδα — στέγη, έναν επαγγελματία, μια κλήση για τον σχεδιασμό της μετακόμισής σας — και θα σας βοηθήσω.",
  fr: "Bonjour ! Dites-moi ce que vous essayez de faire en Grèce — logement, un professionnel, un appel pour planifier votre déménagement — et je vous aiderai.",
};

const MY_REQUESTS_PATTERN = /\b(my requests|my activity|mes demandes|τα αιτήματά μου)\b/i;

/**
 * Layer 1 of the AI pipeline — pure deterministic pattern matching, zero
 * model tokens spent. Only ever returns `handled: true` for cases where a
 * canned/templated response is clearly correct; anything even slightly
 * ambiguous falls through to retrieval + reasoning (spec: "use AI where
 * intelligence creates value, software where deterministic logic suffices").
 */
export function routeDeterministically(text: string, locale: string): RouterResult | RouterMiss {
  const partner = matchPartnerPlatform(text);
  if (partner) {
    return {
      handled: true,
      layer: "DETERMINISTIC",
      reply: `${partner.description} You can book directly at https://${partner.domain}.`,
    };
  }

  const greetingPattern = GREETINGS[locale] ?? GREETINGS.en;
  if (greetingPattern.test(text)) {
    return {
      handled: true,
      layer: "DETERMINISTIC",
      reply: GREETING_REPLY[locale] ?? GREETING_REPLY.en,
    };
  }

  if (MY_REQUESTS_PATTERN.test(text)) {
    return {
      handled: true,
      layer: "DETERMINISTIC",
      reply:
        locale === "el"
          ? "Μπορείτε να δείτε όλα τα αιτήματά σας στο πάνελ «Η δραστηριότητά μου» στα αριστερά, ή στη σελίδα του λογαριασμού σας."
          : locale === "fr"
            ? "Vous pouvez consulter toutes vos demandes dans le panneau « Mon activité » à gauche, ou sur votre page de compte."
            : "You can see all your requests in the 'My Activity' panel on the left, or on your account page.",
    };
  }

  return { handled: false };
}
