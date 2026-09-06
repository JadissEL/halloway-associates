"use client";

import { useTranslations } from "next-intl";
import { PanelLeft, PanelRight, LayoutGrid, MessageSquare, LayoutPanelLeft } from "lucide-react";
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

const MODE_ICONS: Record<string, typeof LayoutPanelLeft> = {
  full: LayoutPanelLeft,
  conversation: MessageSquare,
  results: LayoutGrid,
  history: PanelLeft,
};

function CollapsedRail({ onExpand, icon: Icon }: { onExpand: () => void; icon: typeof PanelLeft }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="hidden h-full w-full flex-col items-center justify-start gap-4 border-luxury-border bg-luxury-graphite/50 pt-4 text-luxury-muted-foreground backdrop-blur-md transition-colors duration-200 hover:text-luxury-gold md:flex"
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
    <div className="luxury-surface flex h-[calc(100vh-4rem)] flex-col md:h-[calc(100vh-4.5rem)]">
      <div className="hidden items-center gap-1 border-b border-luxury-border bg-luxury-black/30 px-4 py-2 backdrop-blur-md md:flex">
        {(["full", "conversation", "results", "history"] as const).map((mode) => {
          const Icon = MODE_ICONS[mode];
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors duration-200",
                viewMode === mode
                  ? "border-luxury-gold text-luxury-gold"
                  : "border-transparent text-luxury-muted-foreground hover:text-luxury-ivory",
              )}
            >
              <Icon size={13} />
              {t(mode)}
            </button>
          );
        })}
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
      <div className="flex items-center justify-around border-t border-luxury-border bg-luxury-black/30 py-1.5 backdrop-blur-md md:hidden">
        {(
          [
            { mode: "conversation" as const, icon: MessageSquare, label: t("conversation") },
            { mode: "results" as const, icon: LayoutGrid, label: t("results") },
            { mode: "history" as const, icon: PanelLeft, label: t("history") },
          ]
        ).map(({ mode, icon: Icon, label }) => {
          const active = viewMode === mode || (mode === "conversation" && viewMode === "full");
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide transition-colors duration-200",
                active ? "text-luxury-gold" : "text-luxury-muted-foreground",
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
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
