"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
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
  const focus = inferFocusFromText(content);
  if (focus && !profile.interests.includes(focus)) {
    profile.interests = [...profile.interests, focus];
  }
  saveVisitorProfile(profile);
  return profile;
}

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const locale = pathname.startsWith("/fr") ? "fr" : "en";
    trackPageVisit(pathname, locale);
  }, [pathname]);

  return null;
}
