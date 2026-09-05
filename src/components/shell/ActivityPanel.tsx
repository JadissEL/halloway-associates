"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Tab = "recent" | "active" | "saved" | "history";

interface RoomSummary {
  id: string;
  type: string;
  status: string;
  updatedAt: string;
}

interface ActivityData {
  recent: RoomSummary[];
  active: RoomSummary[];
  history: RoomSummary[];
  saved: { itemType: string; itemId: string }[];
}

export function ActivityPanel() {
  const t = useTranslations("shell.activity");
  const tStatus = useTranslations("requestRooms.status");
  const [tab, setTab] = useState<Tab>("recent");
  const [data, setData] = useState<ActivityData | null>(null);
  const [authState, setAuthState] = useState<"loading" | "signed-in" | "signed-out">("loading");

  useEffect(() => {
    fetch("/api/account/requests")
      .then((res) => {
        if (res.status === 401) {
          setAuthState("signed-out");
          return null;
        }
        setAuthState("signed-in");
        return res.json();
      })
      .then((json) => json && setData(json))
      .catch(() => setAuthState("signed-out"));
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "recent", label: t("recent") },
    { key: "active", label: t("active") },
    { key: "saved", label: t("saved") },
    { key: "history", label: t("history") },
  ];

  return (
    <div className="flex h-full flex-col bg-luxury-graphite text-luxury-ivory">
      <h2 className="border-b border-luxury-border px-4 py-4 font-serif text-lg">{t("title")}</h2>
      <div className="flex border-b border-luxury-border">
        {tabs.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            onClick={() => setTab(tabDef.key)}
            className={cn(
              "flex-1 px-2 py-2.5 text-xs font-semibold uppercase tracking-wide",
              tab === tabDef.key
                ? "border-b-2 border-luxury-gold text-luxury-ivory"
                : "text-luxury-muted-foreground hover:text-luxury-ivory",
            )}
          >
            {tabDef.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {authState === "signed-out" && (
          <p className="p-2 text-sm text-luxury-muted-foreground">{t("signInPrompt")}</p>
        )}
        {authState === "signed-in" && data && (
          <ActivityList tab={tab} data={data} emptyLabel={t("empty")} statusLabel={tStatus} />
        )}
      </div>
    </div>
  );
}

function ActivityList({
  tab,
  data,
  emptyLabel,
  statusLabel,
}: {
  tab: Tab;
  data: ActivityData;
  emptyLabel: string;
  statusLabel: (key: string) => string;
}) {
  if (tab === "saved") {
    if (data.saved.length === 0) return <p className="p-2 text-sm text-luxury-muted-foreground">{emptyLabel}</p>;
    return (
      <ul className="space-y-1">
        {data.saved.map((s) => (
          <li key={`${s.itemType}-${s.itemId}`} className="rounded-none border border-luxury-border px-3 py-2 text-sm">
            {s.itemType} · {s.itemId}
          </li>
        ))}
      </ul>
    );
  }

  const rooms = data[tab];
  if (rooms.length === 0) return <p className="p-2 text-sm text-luxury-muted-foreground">{emptyLabel}</p>;

  return (
    <ul className="space-y-1.5">
      {rooms.map((r) => (
        <li key={r.id}>
          <Link
            href={`/account/requests/${r.id}`}
            className="block rounded-none border border-luxury-border px-3 py-2.5 text-sm no-underline hover:border-luxury-gold"
          >
            <p className="font-medium text-luxury-ivory">{r.type.replace(/_/g, " ")}</p>
            <p className="text-xs text-luxury-muted-foreground">{statusLabel(r.status)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
