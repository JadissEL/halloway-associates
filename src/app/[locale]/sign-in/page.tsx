import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignInForm } from "@/components/auth/SignInForm";

type Props = { params: Promise<{ locale: string }> };

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="luxury-surface flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 py-20 text-luxury-ivory md:min-h-[calc(100vh-4.5rem)]">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center font-serif text-3xl font-semibold md:text-4xl">{t("signIn")}</h1>
        <SignInForm />
      </div>
    </div>
  );
}
