import type { Metadata } from "next";
import { Briefcase, Building2, Plane, Store, UtensilsCrossed, Wheat } from "lucide-react";
import {
  DescribedServicePage,
  describedServiceMetadata,
  type DescribedServiceConfig,
} from "@/components/marketplace/DescribedServicePage";

type Props = { params: Promise<{ locale: string }> };

const service: DescribedServiceConfig = {
  namespace: "expertsPage",
  path: "/experts",
  serviceType: "Expert network",
  focus: "experts",
  audiences: [
    { key: "businesses", icon: Briefcase },
    { key: "operators", icon: Store },
  ],
  topics: [
    { key: "realEstate", icon: Building2 },
    { key: "tourism", icon: Plane },
    { key: "agriculture", icon: Wheat },
    { key: "hospitality", icon: UtensilsCrossed },
  ],
  steps: ["brief", "review", "introduce", "follow"],
  areaServed: [{ "@type": "Country", name: "Greece" }],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return describedServiceMetadata(locale, service);
}

export default async function ExpertsPage({ params }: Props) {
  const { locale } = await params;
  return <DescribedServicePage locale={locale} config={service} />;
}
