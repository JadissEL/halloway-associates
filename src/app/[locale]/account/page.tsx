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
    <div className="min-h-[calc(100vh-4rem)] bg-luxury-black px-6 py-20 text-luxury-ivory md:min-h-[calc(100vh-4.5rem)]">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <p className="text-lg">{t("signedInAs", { email: user.email })}</p>
        <SignOutButton />
      </div>
    </div>
  );
}
