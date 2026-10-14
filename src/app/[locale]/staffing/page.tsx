import type { Metadata } from "next";
import {
  Building2,
  HeartPulse,
  Hotel,
  Laptop,
  Scale,
  Store,
  Truck,
  Users,
} from "lucide-react";
import {
  DescribedServicePage,
  describedServiceMetadata,
  type DescribedServiceConfig,
} from "@/components/marketplace/DescribedServicePage";

type Props = { params: Promise<{ locale: string }> };

const service: DescribedServiceConfig = {
  namespace: "staffingPage",
  path: "/staffing",
  serviceType: "Staffing and recruitment",
  focus: "staffing",
  audiences: [
    { key: "employers", icon: Building2 },
    { key: "candidates", icon: Users },
  ],
  topics: [
    { key: "hospitality", icon: Hotel },
    { key: "professional", icon: Scale },
    { key: "technology", icon: Laptop },
    { key: "operations", icon: Truck },
    { key: "care", icon: HeartPulse },
    { key: "retail", icon: Store },
  ],
  steps: ["brief", "review", "introduce", "follow"],
  areaServed: [
    { "@type": "Country", name: "Greece" },
    { "@type": "AdministrativeArea", name: "European Union" },
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return describedServiceMetadata(locale, service);
}

export default async function StaffingPage({ params }: Props) {
  const { locale } = await params;
  return <DescribedServicePage locale={locale} config={service} />;
}
