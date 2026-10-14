import { services } from "@/lib/services-data";
import { SITE_URL } from "@/lib/seo/site";
import { regions } from "@/lib/regions-data";
import type { ChatFocus } from "./types";

type ServiceCopy = Record<
  string,
  { title: string; summary: string; details: string }
>;

const regionCopyEn: Record<string, string> = {
  morocco: "Morocco — North & West Africa hub. On-site, remote, hybrid. AR/FR/EN.",
  greece: "Greece — Southern Europe. Remote + periodic on-site. EL/EN.",
  spain: "Spain — Iberia & EU. Remote + workshops. ES/EN.",
  italy: "Italy — Southern Europe enterprise. Remote + hybrid. IT/EN.",
  uk: "United Kingdom — London & national. Remote + sprints. EN.",
  usa: "United States — remote-first national delivery. EN.",
  canada: "Canada — Toronto, Montréal, bilingual EN/FR. On-site + remote.",
  uae: "UAE — Dubai, Abu Dhabi, Gulf enterprise. On-site + remote. AR/EN.",
};

const regionCopyFr: Record<string, string> = {
  morocco: "Maroc — hub Afrique du Nord et de l'Ouest. Sur place, à distance, hybride. AR/FR/EN.",
  greece: "Grèce — Europe du Sud. À distance + sur place périodique. EL/EN.",
  spain: "Espagne — Ibérie et UE. À distance + ateliers. ES/EN.",
  italy: "Italie — Europe du Sud entreprise. À distance + hybride. IT/EN.",
  uk: "Royaume-Uni — Londres et national. À distance + sprints. EN.",
  usa: "États-Unis — livraison nationale à distance. EN.",
  canada: "Canada — Toronto, Montréal, bilingue EN/FR. Sur place + à distance.",
  uae: "Émirats arabes unis — Dubaï, Abu Dhabi, Golfe. Sur place + à distance. AR/EN.",
};

const regionCopyEl: Record<string, string> = {
  morocco: "Μαρόκο — κόμβος Βόρειας & Δυτικής Αφρικής. Επιτόπου, εξ αποστάσεως, υβριδικά. AR/FR/EN.",
  greece: "Ελλάδα — Νότια Ευρώπη. Εξ αποστάσεως + περιοδικά επιτόπου. EL/EN.",
  spain: "Ισπανία — Ιβηρική & ΕΕ. Εξ αποστάσεως + εργαστήρια. ES/EN.",
  italy: "Ιταλία — Νότια Ευρώπη, επιχειρήσεις. Εξ αποστάσεως + υβριδικά. IT/EN.",
  uk: "Ηνωμένο Βασίλειο — Λονδίνο & εθνικά. Εξ αποστάσεως + sprints. EN.",
  usa: "Ηνωμένες Πολιτείες — κυρίως εξ αποστάσεως, εθνική παράδοση. EN.",
  canada: "Καναδάς — Τορόντο, Μόντρεαλ, δίγλωσσα EN/FR. Επιτόπου + εξ αποστάσεως.",
  uae: "ΗΑΕ — Ντουμπάι, Άμπου Ντάμπι, Κόλπος. Επιτόπου + εξ αποστάσεως. AR/EN.",
};

function regionCopyFor(locale: string): Record<string, string> {
  if (locale === "fr") return regionCopyFr;
  if (locale === "el") return regionCopyEl;
  return regionCopyEn;
}

export function buildKnowledgeBase(
  locale: string,
  serviceItems: ServiceCopy,
): string {
  const activeRegionCopy = regionCopyFor(locale);
  const regionLines = regions
    .map((r) => `- ${activeRegionCopy[r.id]}`)
    .join("\n");

  const methodology =
    locale === "fr"
      ? "Découvrir → Concevoir → Construire → Mettre à l'échelle"
      : locale === "el"
        ? "Διερεύνηση → Σχεδιασμός → Υλοποίηση → Κλιμάκωση"
        : "Discover → Design → Build → Scale";

  const serviceLines = services
    .map((s) => {
      const copy = serviceItems[s.id];
      if (!copy) return null;
      return `- [${s.category}] ${copy.title}: ${copy.summary}`;
    })
    .filter(Boolean)
    .join("\n");

  // Halloway & Associates is two real, currently-live product lines sharing
  // one brand and one contact/booking system — not a rebrand where one
  // replaced the other. This knowledge base used to describe only the
  // Studio/agency line (the whole site was that, before the pivot); it now
  // covers both, since this widget is the sitewide informational assistant
  // and gets asked about whichever half of the business the visitor landed
  // on. Kept intentionally factual and bounded to what's actually true today
  // (matches src/lib/ai/system-prompt.ts's "WHAT IS ACTUALLY LIVE TODAY"
  // discipline for the main AI concierge) rather than describing the
  // marketplace aspirationally.
  const marketplaceBlock = `
PRODUCT LINE 2 — THE GREECE MARKETPLACE (live at hallowayassociates.com, the site's homepage today):
POSITIONING: "Everything you need in Greece, one platform, one conversation." Properties, vetted professionals, and everyday services in Greece, coordinated through an AI concierge instead of a pile of separate forms.

WHAT'S ACTUALLY LIVE:
- Properties: browse/search real published listings (rooms, apartments, houses, land, commercial; for rent or sale) at /properties, or post your own at /post.
- Professionals: find vetted lawyers, accountants, architects, engineers, cleaners, movers, property managers at /professionals. Barber/grooming bookings route to the platform's partner, ShopTheBarber, rather than a competing in-house flow.
- The AI Concierge (/app, reached via the "I Need Help" button): a real, tool-using AI that can search live listings, open a lawyer request, and book an Arrival & Information Call on your behalf, with human review before anything publishes. It's a different, more capable assistant than this chat window — this widget only answers questions, it cannot search, book, or create anything itself.
- Arrival & Information Calls: book real time slots with a real person at /book-a-call to talk through relocation, investment, or anything else about moving to or living in Greece.
- Sign-in is passwordless (a magic link emailed to you) — no password to set or remember.
- Every listing and every request is human-reviewed before it goes live; nothing publishes automatically.
- Multilingual: the concierge and the platform work in Greek, English, and French today.

NOT YET LIVE — say so plainly if asked, never imply otherwise: jobs, vehicles, travel bookings, businesses/land for sale as their own searchable categories, moving/renovation/cleaning as bookable services, and any tax/cost calculator. Their pages exist as "coming soon."

STAFFING & RECRUITMENT is a real Halloway service, separate from the jobs board (which is not live). The page is /staffing. It serves employers who need staff and candidates looking for a role, in Greece and across the European Union. Sectors described on the page: hospitality and tourism; professional services; technology and digital; logistics and skilled work; health and care; retail and customer roles. Process: the visitor sends a brief through the contact form with focus "staffing" (/contact?focus=staffing); a person reviews it; introductions happen only when there is a fit. There is no listings database, no tool that searches openings or candidates, and no placement counts. Never invent clients, testimonials, salaries, or open roles. A conversation with a person is also available at /book-a-call.

BUSINESS SETUP IN GREECE is a real Halloway service at /business-setup. It helps foreign businesses settle and operate in Greece: company form and registration, tax and social-security registrations (not tax advice in place of an accountant), banking and ordinary administration, premises, hiring alongside the staffing service, and questions once the company exists. A person reviews a brief sent via /contact?focus=business-setup. Do not claim Halloway files documents, quote fees, name a timeline, or name clients.

EXPERT NETWORK is a real Halloway service at /experts. It introduces people to industry experts for questions in Greece, only in real estate, tourism, agriculture, and restaurants and hospitality. A person reviews a brief sent via /contact?focus=experts and makes an introduction only when someone's experience matches the question. An introduction is a conversation, not a report, valuation, or promised outcome. Do not name experts, quote fees, or invent how many people are in the network.

WHEN A VISITOR WANTS TO ACTUALLY DO SOMETHING marketplace-related (search real listings, get matched to a professional, book a call, create/manage a listing, check on a request): you cannot do this yourself — you have no access to live listings or booking data. Tell them plainly to use the AI concierge (the "I Need Help" button, or /app) or, for a live human conversation, /book-a-call. Never claim to have searched, checked availability, or found something.
`.trim();

  return `
COMPANY: Halloway & Associates
WEBSITE: ${SITE_URL}
EMAIL: hello@hallowayassociates.com
CONTACT: ${SITE_URL}/${locale}/contact

Halloway & Associates has two real product lines today — introduce whichever one is actually relevant to what the visitor asked, don't recite both unprompted:

PRODUCT LINE 1 — THE STUDIO (Halloway's original business, now at /studio; still fully active):
POSITIONING: AI, automation, and growth engineering studio. We build production-grade systems — not slide decks.
FOCUS TRACKS: automation, revenue, growth, product (14 service pillars total)
METHODOLOGY: ${methodology}
GLOBAL MARKETS (8):
${regionLines}
CAPABILITY STATS:
- 14 service pillars · 4 focus tracks · 8 global markets · 2–6 week typical MVP window for focused builds
FULL SERVICE CATALOG:
${serviceLines}

${marketplaceBlock}

HOW TO BEHAVE:
- You are an informational guide to the whole site, not a sales-only bot and not the AI concierge — you never take actions, search live data, or promise you've done something; you explain, recommend, and route people to the right real tool or contact point.
- For the Studio side: qualify (industry, pain point, timeline, budget sensitivity) without being pushy, map needs to specific services/focus tracks, prefer a discovery call over long email threads, never invent client logos/case studies/testimonials (not published), be honest about scope.
- For the marketplace side: never invent listings, prices, availability, or professional names — you have no live data access; point to /properties, /professionals, the AI concierge, or /book-a-call instead.
- If a question could be either (e.g. "I need help with something in Greece" from someone who might mean either business), ask one short clarifying question rather than guessing.
`.trim();
}

export function inferFocusFromText(text: string): ChatFocus | undefined {
  const lower = text.toLowerCase();
  // Keep these narrower than the marketplace and Studio checks below.
  // "recruit customers", "incorporated", and "agricultural land" belong to
  // those existing routes, not to the three contact-form services.
  if (
    /\bstaffing\b|\brecruitment\b|\brecruit(?:ing)? (?:a |an |staff|people|someone|employees)\b|\bhire staff\b|\bhiring staff\b|\bneed staff\b|στελέχ|προσλήψ|recrutement/.test(
      lower,
    )
  )
    return "staffing";
  if (
    /business setup|set up a (business|company)|company formation|\bincorporation\b|foreign business|σύσταση επιχείρ|création d'entreprise|s'installer en grèce/.test(
      lower,
    )
  )
    return "business-setup";
  if (
    /expert network|industry expert|(?:real estate|tourism|agriculture|restaurant|hospitality) expert|δίκτυο ειδικών|réseau d'experts/.test(
      lower,
    )
  )
    return "experts";
  if (/propert(y|ies)|apartment|house|room|rent|landlord|tenant|professional|lawyer|accountant|architect|engineer|relocat|moving to greece|athens|thessaloniki|concierge|listing|greece/.test(lower))
    return "marketplace";
  if (/automation|n8n|zapier|workflow|chatbot|ai agent|make\.com/.test(lower))
    return "automation";
  if (/stripe|payment|subscription|revenue|billing|checkout|invoice/.test(lower))
    return "revenue";
  if (/seo|marketing|content|social|ads|funnel|growth|cro/.test(lower))
    return "growth";
  if (/mvp|app|website|saas|product|platform|develop/.test(lower))
    return "product";
  return undefined;
}

