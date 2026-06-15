import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Cloud,
  Globe,
  Github,
  LayoutDashboard,
  Mail,
  Search,
  Send,
  Server,
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

const EMAIL_AUTOMATION_SHEET =
  "https://docs.google.com/spreadsheets/d/1tmJS2EiLdZr9hdYNA3gJHijFInU3vAae2urP-em4_AE/edit?gid=0#gid=0";

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
      id: "email-automation",
      name: "Email Automation",
      description: "Auto mail system — leads, status & outreach",
      href: envUrl("MODAL_EMAIL_AUTOMATION_SHEET_URL", EMAIL_AUTOMATION_SHEET),
      icon: Send,
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
