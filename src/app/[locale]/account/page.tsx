import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SignOutButton } from "@/components/auth/SignOutButton";

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
    <div className="section-padding">
      <div className="container-narrow flex items-center justify-between">
        <p className="text-lg text-ink">{t("signedInAs", { email: user.email })}</p>
        <SignOutButton />
      </div>
    </div>
  );
}
