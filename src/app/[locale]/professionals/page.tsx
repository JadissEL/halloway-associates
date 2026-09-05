import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db/client";

type Props = { params: Promise<{ locale: string }> };

export default async function ProfessionalsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("marketplaceNav");
  const tShell = await getTranslations("shell.quickAccess");

  const professionals = await prisma.professional.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="min-h-screen bg-luxury-black px-4 py-10 text-luxury-ivory md:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 font-serif text-3xl">{t("professionals")}</h1>

        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/professionals/lawyer"
            className="rounded-none border border-luxury-gold p-5 no-underline"
          >
            <p className="font-serif text-lg text-luxury-ivory">{tShell("findLawyer")}</p>
            <p className="text-sm text-luxury-muted-foreground">Start an 8-step request — matched to a real lawyer.</p>
          </Link>
        </div>

        {professionals.length === 0 ? (
          <p className="text-sm text-luxury-muted-foreground">No professionals listed yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((p) => (
              <div key={p.id} className="rounded-none border border-luxury-border p-4">
                {p.isDemo && (
                  <span className="mb-2 inline-block bg-luxury-gold px-2 py-0.5 text-[10px] font-bold uppercase text-luxury-black">
                    demo
                  </span>
                )}
                <p className="font-serif text-base">{p.name}</p>
                <p className="text-xs uppercase tracking-wide text-luxury-muted-foreground">{p.category.replace(/_/g, " ")}</p>
                <p className="mt-2 text-sm text-luxury-muted-foreground">{p.bio}</p>
                {p.externalUrl && (
                  <a href={p.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-luxury-gold">
                    {p.externalUrl.replace(/^https?:\/\//, "")}
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
