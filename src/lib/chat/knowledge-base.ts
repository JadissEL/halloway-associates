import { services, type ServiceCategory } from "@/lib/services-data";
import { regions } from "@/lib/regions-data";

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

export function buildKnowledgeBase(
  locale: string,
  serviceItems: ServiceCopy,
): string {
  const regionLines = regions
    .map((r) => {
      const copy = locale === "fr" ? regionCopyFr[r.id] : regionCopyEn[r.id];
      return `- ${copy}`;
    })
    .join("\n");

  const methodology =
    locale === "fr"
      ? "Découvrir → Concevoir → Construire → Mettre à l'échelle"
      : "Discover → Design → Build → Scale";

  const serviceLines = services
    .map((s) => {
      const copy = serviceItems[s.id];
      if (!copy) return null;
      return `- [${s.category}] ${copy.title}: ${copy.summary}`;
    })
    .filter(Boolean)
    .join("\n");

  return `
COMPANY: Halloway & Associates — Production Lab
WEBSITE: https://www.hallowayassociates.com
EMAIL: hello@hallowayassociates.com
CONTACT: https://www.hallowayassociates.com/${locale}/contact

POSITIONING: AI, automation, and growth engineering studio. We build production-grade systems — not slide decks.

FOCUS TRACKS: automation, revenue, growth, product (14 service pillars total)

METHODOLOGY: ${methodology}

GLOBAL MARKETS (8):
${regionLines}

CAPABILITY STATS:
- 14 service pillars
- 4 focus tracks
- 8 global markets
- 2–6 week typical MVP window for focused builds

FULL SERVICE CATALOG:
${serviceLines}

SALES RULES:
- Always qualify: industry, pain point, timeline, budget sensitivity (without being pushy)
- Map needs to specific services and focus tracks
- Prefer discovery call over long email threads
- Never invent client logos, case studies, or testimonials (not published yet)
- Be honest about scope; suggest phased pilots when appropriate
`.trim();
}

export function inferFocusFromText(text: string): ServiceCategory | undefined {
  const lower = text.toLowerCase();
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

