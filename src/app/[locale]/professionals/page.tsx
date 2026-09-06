import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db/client";
import { safeQuery } from "@/lib/db/safe-query";
import { ServiceUnavailableNotice } from "@/components/marketplace/ServiceUnavailableNotice";
import { Scale, ExternalLink, ArrowRight } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export default async function ProfessionalsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplaceNav");
  const tShell = await getTranslations("shell.quickAccess");

  const { data: professionals, error: dbError } = await safeQuery(
    () =>
      prisma.professional.findMany({
        where: { status: "APPROVED" },
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
        <h1 className="mb-10 font-serif text-4xl font-semibold tracking-tight md:text-5xl">{t("professionals")}</h1>

        <div className="mb-12 grid gap-4 sm:grid-cols-2">
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

        {professionals.length === 0 ? (
          <p className="text-sm text-luxury-muted-foreground">No professionals listed yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((p) => (
              <div
                key={p.id}
                className="border border-luxury-border bg-luxury-graphite p-4 transition-colors duration-200 hover:border-luxury-gold"
              >
                {p.isDemo && (
                  <span className="mb-2 inline-block bg-luxury-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-luxury-black">
                    demo
                  </span>
                )}
                <p className="font-serif text-base">{p.name}</p>
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-luxury-gold">
                  {p.category.replace(/_/g, " ")}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
