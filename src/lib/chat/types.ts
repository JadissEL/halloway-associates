import type { ServiceCategory } from "@/lib/services-data";

export type ChatRole = "user" | "assistant";

// Where a "talk to a human" nudge should point: a Studio focus track routes
// to /contact?focus=..., "marketplace" routes to /book-a-call instead (the
// platform's real human-handoff for property/professional/relocation
// questions — the Studio contact form was never the right destination for
// those). Kept separate from ServiceCategory itself rather than extending
// it: ServiceCategory also drives the unrelated /services filter UI
// (ServiceExplorer.tsx), which has no "marketplace" tab to filter to.
export type ChatFocus = ServiceCategory | "marketplace";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface VisitorProfile {
  sessionId: string;
  locale: string;
  pagesVisited: string[];
  interests: ServiceCategory[];
  messageCount: number;
  lastPage?: string;
  startedAt: string;
  updatedAt: string;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  locale: string;
  visitor: VisitorProfile;
}

export interface ChatResponseBody {
  message: string;
  suggestedFocus?: ChatFocus;
  suggestContact?: boolean;
}

export const VISITOR_STORAGE_KEY = "halloway-visitor-profile";
export const CHAT_STORAGE_KEY = "halloway-chat-history";
