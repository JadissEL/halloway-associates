import { ModalLogo } from "@/components/ModalLogo";
import { ToolCard } from "@/components/ToolCard";
import { logoutAction } from "@/app/actions/auth";
import { categoryLabels, getToolLinks, type ToolLink } from "@/lib/tools";
import { LogOut } from "lucide-react";

function groupByCategory(tools: ToolLink[]) {
  const order: ToolLink["category"][] = [
    "site",
    "infra",
    "analytics",
    "productivity",
  ];
  return order
    .map((category) => ({
      category,
      label: categoryLabels[category],
      tools: tools.filter((t) => t.category === category),
    }))
    .filter((g) => g.tools.length > 0);
}

export function Dashboard() {
  const groups = groupByCategory(getToolLinks());

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-6 py-10">
      <header className="mb-12 flex flex-col gap-6 border-b border-[#1e2430] pb-10 sm:flex-row sm:items-end sm:justify-between">
        <ModalLogo size="lg" />
        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border border-[#1e2430] bg-[#0e1016] px-4 py-2.5 text-sm text-[#9aa3ad] transition-colors hover:border-[#c0c5ce]/25 hover:text-[#e8eaed]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </header>

      <p className="mb-10 max-w-2xl text-sm leading-relaxed text-[#6b7280]">
        Admin-only launcher for Halloway & Associates operations. Not linked from
        the public website.
      </p>

      <div className="space-y-12">
        {groups.map(({ category, label, tools }) => (
          <section key={category}>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-[#9aa3ad]">
              {label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-16 border-t border-[#1e2430] pt-8 text-center text-xs text-[#6b7280]">
        MODAL · Internal use only · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
