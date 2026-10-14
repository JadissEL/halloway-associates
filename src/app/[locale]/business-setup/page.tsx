import type { Metadata } from "next";
import {
  Building2,
  ClipboardList,
  Flag,
  Landmark,
  Scale,
  Users,
  Wallet,
} from "lucide-react";
import {
  DescribedServicePage,
  describedServiceMetadata,
  type DescribedServiceConfig,
} from "@/components/marketplace/DescribedServicePage";

type Props = { params: Promise<{ locale: string }> };

const service: DescribedServiceConfig = {
  namespace: "businessSetupPage",
  path: "/business-setup",
  serviceType: "Business setup in Greece",
  focus: "business-setup",
  audiences: [
    { key: "companies", icon: Building2 },
    { key: "founders", icon: Flag },
  ],
  topics: [
    { key: "structure", icon: Landmark },
    { key: "tax", icon: Scale },
    { key: "banking", icon: Wallet },
    { key: "premises", icon: Building2 },
    { key: "people", icon: Users },
    { key: "ongoing", icon: ClipboardList },
  ],
  steps: ["brief", "review", "map", "follow"],
  areaServed: [{ "@type": "Country", name: "Greece" }],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return describedServiceMetadata(locale, service);
}

export default async function BusinessSetupPage({ params }: Props) {
  const { locale } = await params;
  return <DescribedServicePage locale={locale} config={service} />;
}
