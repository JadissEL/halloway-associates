import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Cloud,
  Globe,
  Github,
  LayoutDashboard,
  Mail,
  Search,
  Server,
  Sheet,
  ShoppingBag,
} from "lucide-react";

export type ToolLink = {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  category: "infra" | "analytics" | "productivity" | "site";
};

function envUrl(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

export function getToolLinks(): ToolLink[] {
  const siteUrl = envUrl("MODAL_SITE_URL", "https://hallowayassociates.com");

  return [
    {
      id: "website",
      name: "Halloway Website",
      description: "Public site — production",
      href: siteUrl,
      icon: Globe,
      category: "site",
    },
    {
      id: "cloudflare",
      name: "Cloudflare",
      description: "DNS, security, email routing",
      href: "https://dash.cloudflare.com/",
      icon: Cloud,
      category: "infra",
    },
    {
      id: "namecheap",
      name: "Namecheap",
      description: "Domain registrar & billing",
      href: "https://www.namecheap.com/myaccount/login/",
      icon: ShoppingBag,
      category: "infra",
    },
    {
      id: "render",
      name: "Render",
      description: "Hosting, deploys, env vars",
      href: "https://dashboard.render.com/web/srv-d8nhgpi8qa3s73f4o0ng",
      icon: Server,
      category: "infra",
    },
    {
      id: "github",
      name: "GitHub",
      description: "halloway-associates repository",
      href: "https://github.com/JadissEL/halloway-associates",
      icon: Github,
      category: "infra",
    },
    {
      id: "analytics",
      name: "Google Analytics",
      description: "GA4 — traffic & Realtime",
      href: envUrl("MODAL_GA_URL", "https://analytics.google.com/"),
      icon: BarChart3,
      category: "analytics",
    },
    {
      id: "search-console",
      name: "Search Console",
      description: "Indexing, sitemap, performance",
      href: envUrl(
        "MODAL_GSC_URL",
        "https://search.google.com/search-console?resource_id=sc-domain:hallowayassociates.com",
      ),
      icon: Search,
      category: "analytics",
    },
    {
      id: "sheets",
      name: "Google Sheets",
      description: "Shared ops & tracking spreadsheets",
      href: envUrl("MODAL_SHEETS_URL", "https://docs.google.com/spreadsheets/"),
      icon: Sheet,
      category: "productivity",
    },
    {
      id: "resend",
      name: "Resend",
      description: "Transactional email & domains",
      href: "https://resend.com/emails",
      icon: Mail,
      category: "infra",
    },
    {
      id: "render-logs",
      name: "Render Logs",
      description: "Live service logs",
      href: "https://dashboard.render.com/web/srv-d8nhgpi8qa3s73f4o0ng/logs",
      icon: LayoutDashboard,
      category: "infra",
    },
  ];
}

export const categoryLabels: Record<ToolLink["category"], string> = {
  site: "Site",
  infra: "Infrastructure",
  analytics: "Analytics & SEO",
  productivity: "Productivity",
};
