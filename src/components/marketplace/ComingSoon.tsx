import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function ComingSoon({ title }: { title: string }) {
  const t = await getTranslations("marketplace");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-luxury-black px-6 text-center text-luxury-ivory">
      <p className="font-serif text-2xl">{title}</p>
      <p className="max-w-md text-sm text-luxury-muted-foreground">{t("comingSoonBody")}</p>
      <Link
        href="/"
        className="rounded-none border border-luxury-gold px-5 py-2.5 text-sm font-semibold text-luxury-gold no-underline"
      >
        {t("comingSoonCta")}
      </Link>
    </div>
  );
}
