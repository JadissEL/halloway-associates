import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db/client";
import { safeQuery } from "@/lib/db/safe-query";
import { ServiceUnavailableNotice } from "@/components/marketplace/ServiceUnavailableNotice";
import { Badge } from "@/components/ui/Badge";
import {
  Scale, ExternalLink, ArrowRight, Calculator, Compass, Wrench,
  Sparkles, Truck, KeyRound, Scissors, Briefcase, type LucideIcon,
} from "lucide-react";
import type { ProfessionalCategory } from "@prisma/client";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
};

const CATEGORIES: ProfessionalCategory[] = [
  "LAWYER", "ACCOUNTANT", "ARCHITECT", "ENGINEER", "CLEANER",
  "MOVER", "PROPERTY_MANAGER", "BARBER_GROOMING", "OTHER",
];
const VALID_CATEGORIES = new Set<string>(CATEGORIES);

const CATEGORY_ICONS: Record<ProfessionalCategory, LucideIcon> = {
  LAWYER: Scale,
  ACCOUNTANT: Calculator,
  ARCHITECT: Compass,
  ENGINEER: Wrench,
  CLEANER: Sparkles,
  MOVER: Truck,
  PROPERTY_MANAGER: KeyRound,
  BARBER_GROOMING: Scissors,
  OTHER: Briefcase,
};

// A stable, non-random gradient angle/pair per professional so each avatar
// reads as distinct without needing a real headshot -- deterministic from
// the id so it doesn't shift between server and client renders.
function avatarStyle(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const angle = hash % 360;
  const pair = hash % 3;
  const stops =
    pair === 0
      ? ["var(--color-luxury-gold)", "#1c6e8c"]
      : pair === 1
        ? ["#b5622f", "var(--color-luxury-gold)"]
        : ["#5f7a3d", "#1c6e8c"];
  return { background: `linear-gradient(${angle}deg, ${stops[0]}, ${stops[1]})` };
}

function initials(name: string) {
  // Seed/demo entries are titled like "[Demo] Athens Property Law Partners" --
  // strip any leading bracketed tag so the avatar reads real initials ("AP")
  // instead of a stray bracket character.
  const words = name
    .replace(/^\s*\[[^\]]*\]\s*/, "")
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-zA-Z]/.test(w[0] ?? ""));
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase();
}

export default async function ProfessionalsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("marketplaceNav");
  const tShell = await getTranslations("shell.quickAccess");
  const tCat = await getTranslations("professionalsPage");

  // A stale/hand-edited category value must never reach Prisma raw (same
  // class of bug fixed on /properties) — drop it rather than filter on it.
  const category = sp.category && VALID_CATEGORIES.has(sp.category) ? (sp.category as ProfessionalCategory) : undefined;

  const { data: professionals, error: dbError } = await safeQuery(
    () =>
      prisma.professional.findMany({
        where: { status: "APPROVED", ...(category ? { category } : {}) },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    [],
  );

  return (
    <div className="luxury-surface min-h-screen px-4 py-14 text-luxury-ivory md:px-10 md:py-20">
      <div className="mx-auto max-w-4xl">
        {dbError && <ServiceUnavailableNotice />}
        <span className="mb-2 block h-px w-8 bg-luxury-gold/60" />
        <h1 className="text-page-title mb-10">{t("professionals")}</h1>

        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/professionals/lawyer"
            className="group flex items-start gap-4 border border-luxury-gold bg-luxury-gold/5 p-5 no-underline transition-colors duration-200 hover:bg-luxury-gold/10"
          >
            <Scale size={22} className="mt-0.5 shrink-0 text-luxury-gold" />
            <div>
              <p className="font-serif text-lg text-luxury-ivory">{tShell("findLawyer")}</p>
              <p className="text-sm text-luxury-muted-foreground">Start an 8-step request — matched to a real lawyer.</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-luxury-gold">
                Start now
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </div>

        <form className="mb-10 flex flex-wrap items-end gap-3 border-b border-luxury-border pb-10" method="get">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-luxury-muted-foreground">
            {tCat("categoryLabel")}
            <select
              name="category"
              defaultValue={category ?? ""}
              className="rounded-none border border-luxury-border bg-luxury-input px-4 py-2.5 text-sm text-luxury-ivory outline-none transition-colors duration-200 focus:border-luxury-gold"
            >
              <option value="">{tCat("allCategories")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {tCat(`categories.${c}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="bg-luxury-gold px-5 py-2.5 text-sm font-semibold text-luxury-black shadow-[0_4px_16px_rgba(201,162,74,0.2)] transition-all duration-200 hover:brightness-110"
          >
            {t("professionals")}
          </button>
        </form>

        {professionals.length === 0 ? (
          <p className="text-sm text-luxury-muted-foreground">{tCat("noResults")}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((p) => {
              const CategoryIcon = CATEGORY_ICONS[p.category] ?? Briefcase;
              return (
                <div
                  key={p.id}
                  className="border border-luxury-border bg-luxury-graphite p-4 transition-colors duration-200 hover:border-luxury-gold"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center text-sm font-semibold text-luxury-black"
                      style={avatarStyle(p.id)}
                      aria-hidden
                    >
                      {initials(p.name)}
                    </div>
                    <CategoryIcon size={18} className="mt-1 shrink-0 text-luxury-muted-foreground" strokeWidth={1.5} />
                  </div>

                  {p.isDemo && <Badge variant="gold" className="mb-2">demo</Badge>}
                  <p className="font-serif text-base">{p.name}</p>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-luxury-gold">
                    {tCat(`categories.${p.category}`)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-luxury-muted-foreground">{p.bio}</p>
                  {p.externalUrl && (
                    <a
                      href={p.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-luxury-gold hover:underline"
                    >
                      {p.externalUrl.replace(/^https?:\/\//, "")}
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
