import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images?: string[] | null;
  icon: LucideIcon;
  label?: string;
  className?: string;
  iconSize?: number;
};

// Renders the first real photo when a listing has one; otherwise falls back
// to the branded `.media-placeholder` tile (see globals.css) instead of a
// bare icon on a flat box. Property.images exists in the schema today but
// nothing captures it yet, so every listing currently takes the fallback.
export function MediaTile({ images, icon: Icon, label, className, iconSize = 32 }: Props) {
  const src = images?.[0];

  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-luxury-black/60", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- listing photos come from arbitrary user-supplied URLs, not a known set of remote hosts */}
        <img src={src} alt={label ?? ""} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <div className={cn("media-placeholder", className)} role="img" aria-label={label ?? ""}>
      <Icon size={iconSize} strokeWidth={1.5} className="media-placeholder__icon" />
    </div>
  );
}
