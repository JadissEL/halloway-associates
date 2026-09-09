import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// The platform's one button primitive (design-system pass): every hand-rolled
// "border border-luxury-gold px-5 py-2.5 text-sm font-semibold..." string
// scattered across property/professional/post/contact/sign-in pages was the
// same 4-5 visual intents copy-pasted with small drifts (different padding,
// different transition durations, `rounded-none` sometimes omitted). This
// makes the intent explicit and gives every future button the same focus
// ring, disabled state, and loading state for free. class-variance-authority
// was already an installed dependency with zero call sites before this.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-semibold no-underline outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none focus-visible:ring-2 focus-visible:ring-luxury-gold focus-visible:ring-offset-2 focus-visible:ring-offset-luxury-black",
  {
    variants: {
      variant: {
        primary: "bg-luxury-gold text-luxury-black shadow-[0_4px_16px_rgba(201,162,74,0.25)] hover:brightness-110",
        secondary: "border border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-black",
        ghost: "border border-luxury-border text-luxury-ivory hover:border-luxury-gold hover:text-luxury-gold",
        quiet: "text-luxury-muted-foreground hover:text-luxury-ivory",
        cta: "bg-luxury-azure text-white shadow-[0_4px_16px_rgba(59,111,235,0.3)] hover:bg-luxury-azure-hover",
        destructive: "border border-luxury-destructive text-luxury-destructive hover:bg-luxury-destructive hover:text-white",
      },
      size: {
        sm: "px-3.5 py-2 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3.5 text-sm",
        icon: "h-[42px] w-[42px] shrink-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
