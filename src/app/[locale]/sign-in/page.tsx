import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignInForm } from "@/components/auth/SignInForm";

type Props = { params: Promise<{ locale: string }> };

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <div className="section-padding">
      <div className="container-narrow">
        <h1 className="headline mb-8 text-center">{t("signIn")}</h1>
        <SignInForm />
      </div>
    </div>
  );
}
