"use client";

import { useTranslations } from "next-intl";
import { PanelLeft, PanelRight, LayoutGrid, MessageSquare } from "lucide-react";
import { ConversationProvider, useConversation } from "./ConversationContext";
import { ActivityPanel } from "./ActivityPanel";
import { ConversationPanel } from "./ConversationPanel";
import { WorkspacePanel } from "./WorkspacePanel";
import { cn } from "@/lib/utils";

const GRID_BY_MODE: Record<string, string> = {
  full: "md:grid-cols-[280px_1fr_360px]",
  conversation: "md:grid-cols-[56px_1fr_56px]",
  results: "md:grid-cols-[56px_1fr_360px]",
  history: "md:grid-cols-[280px_1fr_56px]",
};

function CollapsedRail({ onExpand, icon: Icon }: { onExpand: () => void; icon: typeof PanelLeft }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="hidden h-full w-full flex-col items-center justify-start gap-4 border-luxury-border bg-luxury-graphite pt-4 text-luxury-muted-foreground hover:text-luxury-gold md:flex"
      aria-label="Expand panel"
    >
      <Icon size={18} />
    </button>
  );
}

function ShellInner() {
  const t = useTranslations("shell.viewModes");
  const { viewMode, setViewMode } = useConversation();

  const leftVisible = viewMode === "full" || viewMode === "history";
  const rightVisible = viewMode === "full" || viewMode === "results";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:h-[calc(100vh-4.5rem)]">
      <div className="hidden items-center gap-2 border-b border-luxury-border bg-luxury-black px-4 py-2 md:flex">
        {(["full", "conversation", "results", "history"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={cn(
              "rounded-none px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
              viewMode === mode
                ? "bg-luxury-gold text-luxury-black"
                : "text-luxury-muted-foreground hover:text-luxury-ivory",
            )}
          >
            {t(mode)}
          </button>
        ))}
      </div>

      <div className={cn("grid flex-1 grid-cols-1 overflow-hidden", GRID_BY_MODE[viewMode])}>
        <div className="hidden md:block md:overflow-hidden">
          {leftVisible ? <ActivityPanel /> : <CollapsedRail icon={PanelLeft} onExpand={() => setViewMode("full")} />}
        </div>

        <div className="overflow-hidden">
          <ConversationPanel />
        </div>

        <div className="hidden md:block md:overflow-hidden">
          {rightVisible ? <WorkspacePanel /> : <CollapsedRail icon={PanelRight} onExpand={() => setViewMode("full")} />}
        </div>
      </div>

      {/* Mobile: conversation is primary; results/activity reachable via the
          bottom tab bar rather than squeezed into three columns (spec 3.6). */}
      <div className="flex items-center justify-around border-t border-luxury-border bg-luxury-black py-2 md:hidden">
        <button
          type="button"
          onClick={() => setViewMode("conversation")}
          className="flex flex-col items-center gap-1 px-3 py-1 text-luxury-muted-foreground"
        >
          <MessageSquare size={18} />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("results")}
          className="flex flex-col items-center gap-1 px-3 py-1 text-luxury-muted-foreground"
        >
          <LayoutGrid size={18} />
        </button>
        <button
          type="button"
          onClick={() => setViewMode("history")}
          className="flex flex-col items-center gap-1 px-3 py-1 text-luxury-muted-foreground"
        >
          <PanelLeft size={18} />
        </button>
      </div>
      {/* Mobile stacked results/activity, shown under the conversation when selected */}
      <div className="border-t border-luxury-border md:hidden">
        {viewMode === "results" && <div className="h-64 overflow-y-auto"><WorkspacePanel /></div>}
        {viewMode === "history" && <div className="h-64 overflow-y-auto"><ActivityPanel /></div>}
      </div>
    </div>
  );
}

export function ThreePanelShell() {
  return (
    <ConversationProvider>
      <ShellInner />
    </ConversationProvider>
  );
}
