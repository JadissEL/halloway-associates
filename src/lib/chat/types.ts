import type { ServiceCategory } from "@/lib/services-data";

export type ChatRole = "user" | "assistant";

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
  suggestedFocus?: ServiceCategory;
  suggestContact?: boolean;
}

export const VISITOR_STORAGE_KEY = "halloway-visitor-profile";
export const CHAT_STORAGE_KEY = "halloway-chat-history";
