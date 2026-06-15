import type { ToolLink } from "@/lib/tools";
import { ExternalLink } from "lucide-react";

type Props = {
  tool: ToolLink;
};

export function ToolCard({ tool }: Props) {
  const Icon = tool.icon;

  return (
    <a
      href={tool.href}
      target="_blank"
      rel="noopener noreferrer"
      className="tool-card group silver-ring flex flex-col gap-4 rounded-2xl border border-[#1e2430] bg-[#0e1016] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#c0c5ce]/15 bg-[#141820]">
          <Icon className="h-5 w-5 text-[#c0c5ce]" strokeWidth={1.5} />
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-[#6b7280] opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div>
        <h3 className="font-medium text-[#e8eaed]">{tool.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-[#6b7280]">{tool.description}</p>
      </div>
    </a>
  );
}
