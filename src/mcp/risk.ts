// Risk tiering per the platform's own action policy: LOW (search/read) can
// execute directly; MEDIUM (create a request/booking) requires the user to
// explicitly confirm first. Nothing in the current tool set is HIGH-risk
// (delete/publish/cancel) or FORBIDDEN-by-default — those categories exist
// here so a future tool has somewhere to declare itself without inventing a
// new model.
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export const TOOL_RISK: Record<string, RiskLevel> = {
  search_properties: "LOW",
  find_professionals: "LOW",
  get_user_requests: "LOW",
  get_request_status: "LOW",
  get_available_call_slots: "LOW",
  create_lawyer_request: "MEDIUM",
  create_call_booking: "MEDIUM",
};

export function requiresConfirmation(toolName: string): boolean {
  return TOOL_RISK[toolName] !== "LOW";
}
