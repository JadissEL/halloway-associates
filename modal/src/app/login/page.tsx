import { LoginForm } from "@/components/LoginForm";

type Props = {
  searchParams: Promise<{ from?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const from =
    typeof params.from === "string" && params.from.startsWith("/")
      ? params.from
      : undefined;

  return <LoginForm redirectFrom={from} />;
}
