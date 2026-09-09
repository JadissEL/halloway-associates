"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import {
  VISITOR_STORAGE_KEY,
  type VisitorProfile,
} from "@/lib/chat/types";
import { inferFocusFromText } from "@/lib/chat/knowledge-base";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function loadVisitorProfile(locale: string): VisitorProfile {
  if (typeof window === "undefined") {
    return {
      sessionId: "",
      locale,
      pagesVisited: [],
      interests: [],
      messageCount: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const raw = sessionStorage.getItem(VISITOR_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VisitorProfile;
      return { ...parsed, locale };
    }
  } catch {
    /* fresh session */
  }

  const fresh: VisitorProfile = {
    sessionId: createSessionId(),
    locale,
    pagesVisited: [],
    interests: [],
    messageCount: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(VISITOR_STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

export function saveVisitorProfile(profile: VisitorProfile) {
  sessionStorage.setItem(
    VISITOR_STORAGE_KEY,
    JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }),
  );
}

export function trackPageVisit(pathname: string, locale: string) {
  const profile = loadVisitorProfile(locale);
  if (!profile.pagesVisited.includes(pathname)) {
    profile.pagesVisited = [...profile.pagesVisited, pathname].slice(-30);
  }
  profile.lastPage = pathname;
  saveVisitorProfile(profile);
}

export function trackUserMessage(content: string, locale: string) {
  const profile = loadVisitorProfile(locale);
  profile.messageCount += 1;
  // interests tracks Studio focus tracks only (see ChatFocus's doc comment
  // in types.ts) — a "marketplace" signal is used for the contact-handoff
  // destination in SalesChatbot.tsx, not stored here.
  const focus = inferFocusFromText(content);
  if (focus && focus !== "marketplace" && !profile.interests.includes(focus)) {
    profile.interests = [...profile.interests, focus];
  }
  saveVisitorProfile(profile);
  return profile;
}

export function VisitorTracker() {
  const pathname = usePathname();
  // Was `pathname.startsWith("/fr") ? "fr" : "en"` -- silently mis-tagged
  // every Greek-locale page visit as English (no "el" branch at all). Now
  // that this tracker also runs across the Greece marketplace, not just
  // Studio pages, getting the visitor's actual locale right matters a lot
  // more than it used to; next-intl's own resolved locale is the correct
  // source instead of re-deriving it from the URL.
  const locale = useLocale();

  useEffect(() => {
    trackPageVisit(pathname, locale);
  }, [pathname, locale]);

  return null;
}
