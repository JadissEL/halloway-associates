import {
  Bot,
  Boxes,
  Compass,
  CreditCard,
  Database,
  Globe,
  GraduationCap,
  LineChart,
  Presentation,
  Settings2,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceIconName } from "@/lib/services-data";

const iconMap: Record<ServiceIconName, LucideIcon> = {
  "settings-2": Settings2,
  bot: Bot,
  "graduation-cap": GraduationCap,
  "credit-card": CreditCard,
  "line-chart": LineChart,
  compass: Compass,
  "trending-up": TrendingUp,
  users: Users,
  sparkles: Sparkles,
  globe: Globe,
  database: Database,
  boxes: Boxes,
  presentation: Presentation,
  share: Share2,
};

type ServiceIconProps = {
  name: ServiceIconName;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeStyles = {
  sm: { wrap: "h-9 w-9", icon: "h-4 w-4" },
  md: { wrap: "h-10 w-10", icon: "h-5 w-5" },
  lg: { wrap: "h-12 w-12", icon: "h-6 w-6" },
};

export function ServiceIcon({ name, size = "md", className }: ServiceIconProps) {
  const Icon = iconMap[name];
  const styles = sizeStyles[size];

  return (
    <span
      className={cn(
        "mb-3 inline-flex items-center justify-center rounded-xl bg-lavender/60 text-plum",
        styles.wrap,
        className,
      )}
      aria-hidden
    >
      <Icon className={styles.icon} strokeWidth={1.75} />
    </span>
  );
}
