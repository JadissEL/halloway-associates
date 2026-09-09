import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LockKeyhole, ArrowRight } from "lucide-react";

// The AI concierge (search listings, book calls, create/manage a property
// draft on the user's behalf) now requires sign-in to use at all, not just
// to complete specific actions — a deliberate product decision, distinct
// from GatedAction.tsx's "browsing is always free" gate that still applies
// everywhere else (viewing /properties, /professionals, etc. stays fully
// open with no account needed). Rendered by AppPage itself (a server
// component) instead of inside ThreePanelShell, so a signed-out visitor
// never even mounts the chat UI or its client-side session/upload state.
export async function ConciergeGate() {
  const t = await getTranslations("shell.gate");

  return (
    <div className="luxury-surface flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-5 px-6 text-center md:min-h-[calc(100vh-4.5rem)]">
      <div className="flex h-14 w-14 items-center justify-center border border-luxury-gold/40">
        <LockKeyhole size={22} className="text-luxury-gold" />
      </div>
      <span className="h-px w-8 bg-luxury-gold/60" />
      <h1 className="max-w-lg text-balance font-serif text-3xl font-semibold tracking-tight text-luxury-ivory md:text-4xl">
        {t("title")}
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-luxury-muted-foreground md:text-base">
        {t("body")}
      </p>
      <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/sign-in?redirect=/app"
          className="flex items-center gap-2 bg-luxury-gold px-7 py-3.5 text-sm font-semibold text-luxury-black no-underline shadow-[0_8px_28px_rgba(201,162,74,0.3)] transition-all duration-200 hover:brightness-110"
        >
          {t("cta")}
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/properties"
          className="border border-luxury-border px-7 py-3.5 text-sm font-semibold text-luxury-ivory no-underline transition-colors duration-200 hover:border-luxury-gold hover:text-luxury-gold"
        >
          {t("browseInstead")}
        </Link>
      </div>
    </div>
  );
}
