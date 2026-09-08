import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/db/client";
import { runTool } from "../tool-runtime";
import type { McpScope } from "../types";

const PROPERTY_TYPES = ["ROOM", "APARTMENT", "HOUSE", "LAND", "COMMERCIAL"] as const;
const LISTING_INTENTS = ["RENT", "SALE"] as const;

const inputShape = {
  city: z.string().max(100).optional(),
  maxPrice: z.number().positive().max(1_000_000_000).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  listingIntent: z.enum(LISTING_INTENTS).optional(),
};

const outputShape = {
  count: z.number(),
  properties: z.array(
    z.object({
      id: z.string(), title: z.string(), city: z.string(), area: z.string().nullable(),
      priceAmount: z.number(), currency: z.string(),
      propertyType: z.enum(PROPERTY_TYPES), listingIntent: z.enum(LISTING_INTENTS),
      isDemo: z.boolean(),
    }),
  ),
};

export function registerPropertyTools(server: McpServer, visibleScopes: Set<McpScope> | null) {
  // null visibleScopes = register everything (used for the internal
  // concierge, which does its own client-side scope filtering before
  // deciding what to offer Groq — see groq-client.ts). A real Set means
  // "only register tools this caller's scopes actually include" — this is
  // what makes tools/list itself honest for external callers, not just
  // call-time enforcement inside each handler.
  if (visibleScopes && !visibleScopes.has("properties:read")) return;
  server.registerTool(
    "search_properties",
    {
      description:
        "Search published property listings (rooms, apartments, houses) by city, price, and type. Only returns real platform data — never invent listings.",
      inputSchema: inputShape,
      outputSchema: outputShape,
      annotations: { readOnlyHint: true, openWorldHint: false, title: "Search properties" },
      _meta: { requiredScope: "properties:read" },
    },
    async (args, extra) =>
      runTool({
        toolName: "search_properties",
        args,
        authInfo: extra.authInfo,
        requiredScope: "properties:read",
        resourceType: "PROPERTY",
        execute: async () => {
          const properties = await prisma.property.findMany({
            where: {
              status: "PUBLISHED",
              ...(args.city ? { city: { equals: args.city, mode: "insensitive" as const } } : {}),
              ...(args.maxPrice ? { priceAmount: { lte: args.maxPrice } } : {}),
              ...(args.propertyType ? { propertyType: args.propertyType } : {}),
              ...(args.listingIntent ? { listingIntent: args.listingIntent } : {}),
            },
            take: 10,
            orderBy: { createdAt: "desc" },
          });
          return {
            data: {
              count: properties.length,
              properties: properties.map((p) => ({
                id: p.id, title: p.title, city: p.city, area: p.area,
                priceAmount: p.priceAmount, currency: p.currency,
                propertyType: p.propertyType, listingIntent: p.listingIntent,
                isDemo: p.isDemo,
              })),
            },
          };
        },
      }),
  );
}
