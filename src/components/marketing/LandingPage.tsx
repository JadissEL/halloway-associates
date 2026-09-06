import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Building2, Scale, Briefcase, Car, Store, Plane, PhoneCall, Megaphone,
  MessageSquareText, Sparkles, ShieldCheck, Layers, Languages, ArrowRight,
  type LucideIcon,
} from "lucide-react";

const SERVICES: { key: string; href: string; icon: LucideIcon }[] = [
  { key: "properties", href: "/properties", icon: Building2 },
  { key: "professionals", href: "/professionals", icon: Scale },
  { key: "jobs", href: "/jobs", icon: Briefcase },
  { key: "vehicles", href: "/vehicles", icon: Car },
  { key: "businesses", href: "/businesses", icon: Store },
  { key: "travel", href: "/travel", icon: Plane },
  { key: "bookACall", href: "/book-a-call", icon: PhoneCall },
  { key: "post", href: "/post", icon: Megaphone },
];

const HOW_IT_WORKS_STEPS = ["tell", "match", "track"] as const;
const HOW_IT_WORKS_ICONS: Record<(typeof HOW_IT_WORKS_STEPS)[number], LucideIcon> = {
  tell: MessageSquareText,
  match: Sparkles,
  track: Layers,
};

export async function LandingPage() {
  const t = await getTranslations("landingPage");

  return (
    <div className="bg-luxury-black text-luxury-ivory">
      {/* Hero */}
      <section className="luxury-surface flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-20 text-center md:min-h-[calc(100vh-4.5rem)]">
        <span className="mb-4 h-px w-10 bg-luxury-gold/60" />
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-luxury-gold">
          {t("hero.eyebrow")}
        </p>
        <h1 className="max-w-4xl text-balance font-serif text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
          {t("hero.title")}
        </h1>
        <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-luxury-muted-foreground md:text-lg">
          {t("hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/app"
            className="flex items-center gap-2 bg-luxury-gold px-7 py-3.5 text-sm font-semibold text-luxury-black no-underline shadow-[0_8px_28px_rgba(201,162,74,0.3)] transition-all duration-200 hover:brightness-110"
          >
            {t("hero.startNow")}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/explore"
            className="border border-luxury-border px-7 py-3.5 text-sm font-semibold text-luxury-ivory no-underline transition-colors duration-200 hover:border-luxury-gold hover:text-luxury-gold"
          >
            {t("hero.browseServices")}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-luxury-border px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <span className="mb-3 block h-px w-8 bg-luxury-gold/60" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-luxury-gold">
            {t("howItWorks.eyebrow")}
          </p>
          <h2 className="mb-14 max-w-2xl font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            {t("howItWorks.title")}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((step, i) => {
              const Icon = HOW_IT_WORKS_ICONS[step];
              return (
                <div key={step} className="border border-luxury-border bg-luxury-graphite p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center border border-luxury-gold/40">
                    <Icon size={20} className="text-luxury-gold" />
                  </div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-luxury-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="mb-2 font-serif text-xl">{t(`howItWorks.steps.${step}.title`)}</p>
                  <p className="text-sm leading-relaxed text-luxury-muted-foreground">
                    {t(`howItWorks.steps.${step}.body`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="luxury-surface border-t border-luxury-border px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <span className="mb-3 block h-px w-8 bg-luxury-gold/60" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-luxury-gold">
            {t("services.eyebrow")}
          </p>
          <h2 className="mb-14 max-w-2xl font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            {t("services.title")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map(({ key, href, icon: Icon }) => (
              <Link
                key={key}
                href={href}
                className="group flex flex-col gap-3 border border-luxury-border bg-luxury-black/60 p-5 no-underline transition-colors duration-200 hover:border-luxury-gold"
              >
                <Icon size={22} className="text-luxury-muted-foreground transition-colors duration-200 group-hover:text-luxury-gold" />
                <p className="text-sm leading-relaxed text-luxury-ivory">{t(`services.${key}`)}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-luxury-gold opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-luxury-border px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-5xl">
          <span className="mb-3 block h-px w-8 bg-luxury-gold/60" />
          <p className="mb-14 text-xs font-semibold uppercase tracking-[0.25em] text-luxury-gold">
            {t("trust.eyebrow")}
          </p>
          <div className="grid gap-10 md:grid-cols-3">
            {(
              [
                { key: "multilingual" as const, icon: Languages },
                { key: "humanReview" as const, icon: ShieldCheck },
                { key: "oneThread" as const, icon: Layers },
              ]
            ).map(({ key, icon: Icon }) => (
              <div key={key}>
                <Icon size={24} className="mb-4 text-luxury-gold" />
                <p className="mb-2 font-serif text-xl">{t(`trust.${key}.title`)}</p>
                <p className="text-sm leading-relaxed text-luxury-muted-foreground">{t(`trust.${key}.body`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="luxury-surface border-t border-luxury-border px-6 py-24 text-center md:py-32">
        <h2 className="mx-auto max-w-2xl text-balance font-serif text-3xl font-semibold tracking-tight md:text-5xl">
          {t("finalCta.title")}
        </h2>
        <Link
          href="/app"
          className="mt-10 inline-flex items-center gap-2 bg-luxury-gold px-8 py-4 text-sm font-semibold text-luxury-black no-underline shadow-[0_8px_28px_rgba(201,162,74,0.3)] transition-all duration-200 hover:brightness-110"
        >
          {t("finalCta.button")}
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
