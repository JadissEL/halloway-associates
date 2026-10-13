"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogIn, Inbox, AlertTriangle, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversation } from "./ConversationContext";

type Tab = "recent" | "active" | "saved" | "history";

interface RoomSummary {
  id: string;
  type: string;
  status: string;
  updatedAt: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

interface ActivityData {
  recent: RoomSummary[];
  active: RoomSummary[];
  history: RoomSummary[];
  saved: { itemType: string; itemId: string }[];
  conversations?: ConversationSummary[];
}

export function ActivityPanel() {
  const t = useTranslations("shell.activity");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("requestRooms.status");
  const locale = useLocale();
  const { activityRevision, conversationId, openConversation, startNewConversation } = useConversation();
  const [tab, setTab] = useState<Tab>("recent");
  const [data, setData] = useState<ActivityData | null>(null);
  const [authState, setAuthState] = useState<"loading" | "signed-in" | "signed-out" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/requests")
      .then((res) => {
        if (res.status === 401) {
          setAuthState("signed-out");
          return null;
        }
        if (!res.ok) {
          setAuthState((current) => (current === "signed-in" ? current : "error"));
          return null;
        }
        setAuthState("signed-in");
        return res.json();
      })
      .then((json) => {
        if (!cancelled && json) setData(json);
      })
      .catch(() => {
        if (!cancelled) setAuthState((current) => (current === "signed-in" ? current : "error"));
      });
    return () => {
      cancelled = true;
    };
  }, [activityRevision]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "recent", label: t("recent") },
    { key: "active", label: t("active") },
    { key: "saved", label: t("saved") },
    { key: "history", label: t("history") },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-luxury-border/60 bg-luxury-graphite/45 text-luxury-ivory backdrop-blur-xl">
      <div className="border-b border-luxury-border px-4 py-4">
        <span className="mb-1.5 block h-px w-6 bg-luxury-gold/60" />
        <h2 className="font-serif text-lg">{t("title")}</h2>
        {authState === "signed-in" && (
          <button
            type="button"
            onClick={startNewConversation}
            className="mt-3 flex w-full items-center justify-center gap-1.5 border border-luxury-gold/70 px-3 py-2 text-xs font-semibold text-luxury-gold transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
          >
            <Plus size={14} />
            {t("newConversation")}
          </button>
        )}
      </div>
      <div className="flex border-b border-luxury-border">
        {tabs.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            onClick={() => setTab(tabDef.key)}
            className={cn(
              "flex-1 px-2 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors duration-200",
              tab === tabDef.key
                ? "border-b-2 border-luxury-gold text-luxury-ivory"
                : "text-luxury-muted-foreground hover:text-luxury-ivory",
            )}
          >
            {tabDef.label}
          </button>
        ))}
      </div>
      <div className="luxury-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {authState === "signed-out" && (
          <div className="flex flex-col items-center gap-3 px-3 py-10 text-center">
            <div className="flex h-11 w-11 items-center justify-center border border-luxury-gold/40 text-luxury-gold">
              <LogIn size={18} />
            </div>
            <p className="text-sm leading-relaxed text-luxury-muted-foreground">{t("signInPrompt")}</p>
            <Link
              href="/sign-in"
              className="mt-1 border border-luxury-gold px-4 py-2 text-xs font-semibold text-luxury-gold no-underline transition-colors duration-200 hover:bg-luxury-gold hover:text-luxury-black"
            >
              {tAuth("signIn")}
            </Link>
          </div>
        )}
        {authState === "error" && (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <AlertTriangle size={18} className="text-luxury-destructive" />
            <p className="text-sm text-luxury-muted-foreground">{tCommon("serviceUnavailable")}</p>
          </div>
        )}
        {authState === "signed-in" && data && (
          <ActivityList
            tab={tab}
            data={data}
            emptyLabel={t("empty")}
            chatsLabel={t("chats")}
            requestsLabel={t("requests")}
            chatLabel={t("chatLabel")}
            statusLabel={tStatus}
            locale={locale}
            activeConversationId={conversationId}
            onOpenConversation={(id) => void openConversation(id)}
          />
        )}
      </div>
    </div>
  );
}

function ActivityList({
  tab,
  data,
  emptyLabel,
  chatsLabel,
  requestsLabel,
  chatLabel,
  statusLabel,
  locale,
  activeConversationId,
  onOpenConversation,
}: {
  tab: Tab;
  data: ActivityData;
  emptyLabel: string;
  chatsLabel: string;
  requestsLabel: string;
  chatLabel: string;
  statusLabel: (key: string) => string;
  locale: string;
  activeConversationId: string | null;
  onOpenConversation: (id: string) => void;
}) {
  if (tab === "saved") {
    if (data.saved.length === 0) return <EmptyTab label={emptyLabel} />;
    return (
      <ul className="space-y-1.5">
        {data.saved.map((s) => (
          <li
            key={`${s.itemType}-${s.itemId}`}
            className="border border-luxury-border border-l-2 border-l-luxury-gold/40 bg-luxury-black/40 px-3 py-2 text-sm"
          >
            {s.itemType} · {s.itemId}
          </li>
        ))}
      </ul>
    );
  }

  const rooms = data[tab];
  const chats = tab === "recent" ? (data.conversations ?? []).slice(0, 5) : tab === "history" ? (data.conversations ?? []) : [];
  if (chats.length === 0 && rooms.length === 0) return <EmptyTab label={emptyLabel} />;

  return (
    <div className="space-y-4">
      {chats.length > 0 && (
        <section>
          <h3 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-muted-foreground">
            {chatsLabel}
          </h3>
          <ul className="space-y-1.5">
            {chats.map((chat) => {
              const active = chat.id === activeConversationId;
              const updated = formatUpdated(chat.updatedAt, locale);
              return (
                <li key={chat.id}>
                  <button
                    type="button"
                    onClick={() => onOpenConversation(chat.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "group block w-full border border-luxury-border border-l-2 bg-luxury-black/40 px-3 py-2.5 text-left text-sm transition-colors duration-200 hover:border-luxury-gold hover:border-l-luxury-gold",
                      active ? "border-l-luxury-gold" : "border-l-luxury-border",
                    )}
                  >
                    <p className="flex items-start gap-1.5 font-medium text-luxury-ivory transition-colors duration-200 group-hover:text-luxury-gold">
                      <MessageSquare size={13} className="mt-0.5 shrink-0 text-luxury-gold" />
                      <span className="line-clamp-2">{chat.title}</span>
                    </p>
                    <p className="mt-0.5 pl-5 text-xs text-luxury-muted-foreground">
                      {chatLabel}
                      {updated ? ` · ${updated}` : ""}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {rooms.length > 0 && (
        <section>
          {chats.length > 0 && (
            <h3 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-luxury-muted-foreground">
              {requestsLabel}
            </h3>
          )}
          <ul className="space-y-1.5">
            {rooms.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/account/requests/${r.id}`}
                  className="group block border border-luxury-border border-l-2 border-l-luxury-border bg-luxury-black/40 px-3 py-2.5 text-sm no-underline transition-colors duration-200 hover:border-luxury-gold hover:border-l-luxury-gold"
                >
                  <p className="font-medium text-luxury-ivory transition-colors duration-200 group-hover:text-luxury-gold">
                    {r.type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-luxury-muted-foreground">{statusLabel(r.status)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function formatUpdated(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-3 py-10 text-center">
      <Inbox size={18} className="text-luxury-muted-foreground" strokeWidth={1.5} />
      <p className="text-sm text-luxury-muted-foreground">{label}</p>
    </div>
  );
}
