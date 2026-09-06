import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Sparkles } from "lucide-react";

export async function ComingSoon({ title }: { title: string }) {
  const t = await getTranslations("marketplace");

  return (
    <div className="luxury-surface flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-5 px-6 text-center text-luxury-ivory md:min-h-[calc(100vh-4.5rem)]">
      <div className="flex h-14 w-14 items-center justify-center border border-luxury-gold/40">
        <Sparkles size={22} className="text-luxury-gold" />
      </div>
      <span className="h-px w-8 bg-luxury-gold/60" />
      <p className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-luxury-muted-foreground">{t("comingSoonBody")}</p>
      <Link
        href="/"
        className="border border-luxury-gold px-5 py-2.5 text-sm font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
      >
        {t("comingSoonCta")}
      </Link>
    </div>
  );
}
