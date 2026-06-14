import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ArrowLinkProps = {
  className?: string;
};

export function ArrowLink({ className }: ArrowLinkProps) {
  return (
    <ArrowRight
      className={cn("inline h-4 w-4 shrink-0", className)}
      strokeWidth={2}
      aria-hidden
    />
  );
}
