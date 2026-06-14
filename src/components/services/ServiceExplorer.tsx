"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { services, type ServiceCategory } from "@/lib/services-data";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { ArrowLink } from "@/components/icons/ArrowLink";

type Filter = "all" | ServiceCategory;

const filterMap: Record<Filter, string> = {
  all: "filterAll",
  automation: "filterAutomation",
  revenue: "filterRevenue",
  growth: "filterGrowth",
  product: "filterProduct",
};

export function ServiceExplorer() {
  const t = useTranslations("servicesPage");
  const tItems = useTranslations("servicesPage.items");
  const tSeo = useTranslations("seo");
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const category = searchParams.get("category") as ServiceCategory | null;
    if (category && ["automation", "revenue", "growth", "product"].includes(category)) {
      setFilter(category);
    }
  }, [searchParams]);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? services
        : services.filter((s) => s.category === filter),
    [filter],
  );

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label={t("title")}>
        {(Object.keys(filterMap) as Filter[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              filter === key
                ? "bg-ink text-white"
                : "border border-line bg-surface text-ink-secondary hover:text-ink",
            )}
          >
            {t(filterMap[key])}
          </button>
        ))}
      </div>

      <ul className="grid list-none gap-3 p-0 md:grid-cols-2">
        {filtered.map((service) => (
          <li key={service.id}>
            <Link
              href={`/services/${service.id}`}
              className="group block rounded-[16px] border border-line bg-surface p-6 no-underline transition-colors hover:border-plum/25 hover:bg-lavender/20"
            >
              <ServiceIcon name={service.icon} />
              <h2 className="font-semibold text-ink group-hover:text-plum">
                {tItems(`${service.id}.title`)}
              </h2>
              <p className="mt-2 text-sm text-ink-secondary">
                {tItems(`${service.id}.summary`)}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                {tSeo("learnMore")}
                <ArrowLink className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
