import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/db/client";
import { bookCall } from "@/lib/workflows/call-booking";
import { runTool } from "../tool-runtime";
import type { McpScope } from "../types";

const CALL_TYPES = ["ORIENTATION", "RELOCATION", "PROPERTY", "BUSINESS", "WORK_LIFE", "INVESTMENT", "CUSTOM", "UNSURE"] as const;

const getSlotsShape = { callType: z.enum(CALL_TYPES).optional() };

const createBookingShape = {
  callType: z.enum(CALL_TYPES),
  slotId: z.string().min(1).max(200),
  reason: z.string().max(500).optional(),
  topics: z.array(z.string().max(100)).max(20).optional(),
  preferredLanguage: z.string().max(50).optional(),
  countryOfOrigin: z.string().max(100).optional(),
  cityOfInterest: z.string().max(100).optional(),
  confirm: z.boolean().optional()
    .describe("Leave unset on your first call. Only set to true if you are re-issuing this exact call after the user has already explicitly confirmed it in this conversation."),
};

export function registerCallTools(server: McpServer, visibleScopes: Set<McpScope> | null) {
  if (!visibleScopes || visibleScopes.has("call-booking:read")) {
    server.registerTool(
      "get_available_call_slots",
      {
        description: "List real available Arrival & Information Call slots, optionally filtered by call type.",
        inputSchema: getSlotsShape,
        outputSchema: {
          slots: z.array(z.object({ id: z.string(), startTime: z.string(), endTime: z.string() })),
        },
        annotations: { readOnlyHint: true, openWorldHint: false, title: "List call slots" },
        _meta: { requiredScope: "call-booking:read" },
      },
      async (args, extra) =>
        runTool({
          toolName: "get_available_call_slots",
          args,
          authInfo: extra.authInfo,
          requiredScope: "call-booking:read",
          execute: async (a) => {
            const slots = await prisma.availabilitySlot.findMany({
              where: { isBooked: false, startTime: { gte: new Date() }, ...(a.callType ? { callType: a.callType } : {}) },
              orderBy: { startTime: "asc" },
              take: 10,
            });
            return { data: { slots: slots.map((s) => ({ id: s.id, startTime: s.startTime.toISOString(), endTime: s.endTime.toISOString() })) } };
          },
        }),
    );
  }

  if (!visibleScopes || visibleScopes.has("call-booking:create")) {
    server.registerTool(
      "create_call_booking",
      {
        description:
          "Book an Arrival & Information Call once the user picked a real available slot (from get_available_call_slots) and a call type. Requires the user to be signed in. This is a MEDIUM-risk action: the first call proposes it and asks for confirmation, it does not book yet.",
        inputSchema: createBookingShape,
        // No outputSchema — see the matching comment on create_lawyer_request
        // in mcp/tools/requests.ts. Same dual-shape (pendingConfirmation
        // proposal vs. real success/error result) issue, same fix.
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, title: "Book a call" },
        _meta: { requiredScope: "call-booking:create" },
      },
      async (args, extra) =>
        runTool({
          toolName: "create_call_booking",
          args,
          authInfo: extra.authInfo,
          requiredScope: "call-booking:create",
          resourceType: "CALL_BOOKING",
          summarize: (a) => `I'll book your ${a.callType.toLowerCase().replace(/_/g, " ")} call for the slot you picked. Shall I confirm it?`,
          execute: async (a, identity) => {
            if (!identity.userId) throw new Error("unreachable: scope check should have required sign-in");
            const result = await bookCall(identity.userId, { ...a, preferredLanguage: a.preferredLanguage ?? identity.locale });
            if ("error" in result) return { data: result };
            return {
              data: { bookingId: result.bookingId, roomId: result.roomId, status: "CONFIRMED", slotStart: result.slotStart.toISOString() },
              resourceId: result.bookingId,
            };
          },
        }),
    );
  }
}
