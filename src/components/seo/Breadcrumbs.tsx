import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Crumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: Crumb[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-6", className)}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-luxury-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
              {index > 0 && <span aria-hidden className="text-luxury-muted-foreground/60">/</span>}
              {isLast || !item.href ? (
                <span className={isLast ? "font-medium text-luxury-ivory" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="font-medium text-luxury-muted-foreground no-underline hover:text-luxury-gold hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
