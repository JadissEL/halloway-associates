import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Consolidates the "demo" pill (properties/professionals cards),
// moderation-status chips, and category labels that were each hand-written
// per page with slightly different padding/casing.
const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
  {
    variants: {
      variant: {
        gold: "bg-luxury-gold text-luxury-black",
        outline: "border border-luxury-border text-luxury-muted-foreground",
        subtle: "bg-luxury-graphite text-luxury-ivory",
        destructive: "bg-luxury-destructive/90 text-white",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
