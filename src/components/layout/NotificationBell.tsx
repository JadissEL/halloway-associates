"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  message: string;
  isRead: boolean;
  requestRoomId: string | null;
  createdAt: string;
}

// Communication Center entry point (spec section 11.2): every workflow
// state change ends up here, deep-linking into its Request Room. Renders
// nothing for signed-out visitors rather than showing a broken bell.
export function NotificationBell() {
  const t = useTranslations("notifications");
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setItems(data.notifications))
      .catch(() => setItems(null));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (items === null) return null;

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={async () => {
          setOpen((v) => !v);
          if (unreadCount > 0) {
            await fetch("/api/notifications/mark-read", { method: "POST" });
            setItems((prev) => prev?.map((n) => ({ ...n, isRead: true })) ?? null);
          }
        }}
        aria-label={t("title")}
        className="relative rounded-full p-2 text-ink-secondary hover:text-ink"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-[14px] border border-line bg-surface py-2 shadow-[0_12px_40px_rgba(26,26,26,0.12)]">
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t("title")}</p>
          {items.length === 0 && <p className="px-4 py-3 text-sm text-ink-secondary">{t("empty")}</p>}
          <ul className="max-h-80 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                {n.requestRoomId ? (
                  <Link
                    href={`/account/requests/${n.requestRoomId}`}
                    className={cn(
                      "block px-4 py-2.5 text-sm no-underline hover:bg-page",
                      n.isRead ? "text-ink-secondary" : "font-medium text-ink",
                    )}
                  >
                    {n.message}
                  </Link>
                ) : (
                  <p className={cn("px-4 py-2.5 text-sm", n.isRead ? "text-ink-secondary" : "font-medium text-ink")}>
                    {n.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
