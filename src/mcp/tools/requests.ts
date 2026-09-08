import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/db/client";
import { createLawyerRequestRoom } from "@/lib/workflows/lawyer-request";
import { runTool } from "../tool-runtime";
import { authorizeOwnership } from "../authorize";
import type { McpScope } from "../types";

const createLawyerRequestShape = {
  category: z.string().min(1).max(50),
  situation: z.string().min(5).max(4000),
  consultationMode: z.string().max(50).optional(),
  availability: z.string().max(500).optional(),
  language: z.string().max(50).optional(),
  paymentPreference: z.string().max(200).optional(),
  additionalInfo: z.string().max(2000).optional(),
  confirm: z.boolean().optional()
    .describe("Leave unset on your first call. Only set to true if you are re-issuing this exact call after the user has already explicitly confirmed it in this conversation."),
};

const getRequestStatusShape = { roomId: z.string().min(1).max(200) };

export function registerRequestTools(server: McpServer, visibleScopes: Set<McpScope> | null) {
  if (!visibleScopes || visibleScopes.has("lawyer-request:create")) {
    server.registerTool(
      "create_lawyer_request",
      {
        description:
          "Create a lawyer/professional-request Request Room once the user has given enough detail (category, situation, consultation mode, availability, language, payment preference). Requires the user to be signed in. This is a MEDIUM-risk action: the first call proposes it and asks for confirmation, it does not execute yet.",
        inputSchema: createLawyerRequestShape,
        // No outputSchema here on purpose: this tool genuinely returns one of
        // two different shapes (a pendingConfirmation proposal, or the real
        // {roomId, status} success) depending on the confirmation gate in
        // tool-runtime.ts. A single rigid outputSchema validates
        // structuredContent and, on any mismatch, silently discards the real
        // result and substitutes a generic validation-error CallToolResult
        // (confirmed by reading server/mcp.js's validateToolOutput directly —
        // this is exactly what broke the propose path during testing). A
        // z.union() of both shapes was tried and hits a separate SDK
        // compat-layer bug with this Zod version (union schemas crash
        // normalizeObjectSchema's internal shape-detection with "Cannot read
        // properties of undefined (reading '_zod')"). Omitting outputSchema
        // is the reliable choice; the input schema and every value this tool
        // can return are still fully typed in TypeScript regardless.
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, title: "Request a lawyer" },
        _meta: { requiredScope: "lawyer-request:create" },
      },
      async (args, extra) =>
        runTool({
          toolName: "create_lawyer_request",
          args,
          authInfo: extra.authInfo,
          requiredScope: "lawyer-request:create",
          resourceType: "REQUEST_ROOM",
          summarize: (a) => `I'll open a lawyer request for "${a.category}": ${a.situation.slice(0, 140)}${a.situation.length > 140 ? "…" : ""}. Shall I submit it?`,
          execute: async (a, identity) => {
            // requiredScope already proved identity.userId is set (no scope
            // grants lawyer-request:create to an anonymous caller — see
            // authorize.ts's PUBLIC_SCOPES), but TS doesn't know that, so this
            // stays an explicit runtime guard rather than a non-null assertion.
            if (!identity.userId) throw new Error("unreachable: scope check should have required sign-in");
            const room = await createLawyerRequestRoom(identity.userId, a);
            return { data: { roomId: room.id, status: room.status }, resourceId: room.id };
          },
        }),
    );
  }

  if (!visibleScopes || visibleScopes.has("request:read:own")) {
    server.registerTool(
      "get_user_requests",
      {
        description: "List the signed-in user's Request Rooms (recent, active, and history).",
        inputSchema: {},
        outputSchema: {
          rooms: z.array(z.object({ id: z.string(), type: z.string(), status: z.string(), updatedAt: z.string() })),
        },
        annotations: { readOnlyHint: true, openWorldHint: false, title: "List my requests" },
        _meta: { requiredScope: "request:read:own" },
      },
      async (args, extra) =>
        runTool({
          toolName: "get_user_requests",
          args,
          authInfo: extra.authInfo,
          requiredScope: "request:read:own",
          resourceType: "REQUEST_ROOM",
          execute: async (_a, identity) => {
            const rooms = await prisma.requestRoom.findMany({
              where: { userId: identity.userId! },
              orderBy: { updatedAt: "desc" },
              take: 20,
            });
            return {
              data: { rooms: rooms.map((r) => ({ id: r.id, type: r.type, status: r.status, updatedAt: r.updatedAt.toISOString() })) },
            };
          },
        }),
    );

    server.registerTool(
      "get_request_status",
      {
        description: "Get the current status and timeline of a specific Request Room by id.",
        inputSchema: getRequestStatusShape,
        outputSchema: {
          id: z.string().optional(), type: z.string().optional(), status: z.string().optional(),
          timeline: z.array(z.object({ toStatus: z.string(), note: z.string().nullable(), at: z.string() })).optional(),
          error: z.string().optional(), message: z.string().optional(),
        },
        annotations: { readOnlyHint: true, openWorldHint: false, title: "Check request status" },
        _meta: { requiredScope: "request:read:own" },
      },
      async (args, extra) =>
        runTool({
          toolName: "get_request_status",
          args,
          authInfo: extra.authInfo,
          requiredScope: "request:read:own",
          resourceType: "REQUEST_ROOM",
          execute: async (a, identity) => {
            const room = await prisma.requestRoom.findUnique({
              where: { id: a.roomId },
              include: { statusEvents: { orderBy: { createdAt: "asc" } } },
            });
            // Resource-level check, not just "is this tool allowed at all" —
            // owning *a* request room doesn't authorize reading *this one*.
            if (!room || !authorizeOwnership("RequestRoom", room.userId, identity.userId)) {
              return { data: { error: "not_found", message: "No such request for this user." } };
            }
            return {
              data: {
                id: room.id, type: room.type, status: room.status,
                timeline: room.statusEvents.map((e) => ({ toStatus: e.toStatus, note: e.note, at: e.createdAt.toISOString() })),
              },
              resourceId: room.id,
            };
          },
        }),
    );
  }
}
