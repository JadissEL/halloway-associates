import type { RequestRoomStatus, RequestRoomType } from "@prisma/client";

// Rule table for spec section 7 — "understand relationships between actions
// and proactively, but never spammily, offer the next step." Always an
// explicit optional offer, never an automatic action; the UI (see
// CrossServiceSuggestion) lets the user dismiss it per room.
const RULES: Partial<Record<RequestRoomType, Partial<Record<RequestRoomStatus, string[]>>>> = {
  ARRIVAL_CALL: {
    CONFIRMED: ["findLawyer", "findAccountant", "moveApartment", "rentRoom"],
  },
  LAWYER: {
    REQUESTED: ["findAccountant"],
    COMPLETED: ["cleaning", "propertyManagement"],
  },
  PROPERTY_SEARCH: {
    COMPLETED: ["findLawyer", "cleaning", "moveApartment"],
  },
};

export function getSuggestedQuickAccessKeys(
  type: RequestRoomType,
  status: RequestRoomStatus,
): string[] {
  return RULES[type]?.[status] ?? [];
}
