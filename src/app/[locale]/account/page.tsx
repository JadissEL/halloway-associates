import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  return (
    <div className="luxury-surface min-h-[calc(100vh-4rem)] px-6 py-20 text-luxury-ivory md:min-h-[calc(100vh-4.5rem)]">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <p className="text-lg">{t("signedInAs", { email: user.email })}</p>
        <SignOutButton />
      </div>
      <div className="mx-auto mt-8 max-w-2xl">
        <Link
          href="/app"
          className="inline-flex border border-luxury-gold px-5 py-2.5 text-sm font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
        >
          {t("viewActivity")}
        </Link>
      </div>
    </div>
  );
}
