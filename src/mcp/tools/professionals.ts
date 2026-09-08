import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/db/client";
import { runTool } from "../tool-runtime";
import type { McpScope } from "../types";

const PROFESSIONAL_CATEGORIES = [
  "LAWYER", "ACCOUNTANT", "ARCHITECT", "ENGINEER", "CLEANER",
  "MOVER", "PROPERTY_MANAGER", "BARBER_GROOMING", "OTHER",
] as const;

const inputShape = {
  category: z.enum(PROFESSIONAL_CATEGORIES),
};

const outputShape = {
  count: z.number(),
  professionals: z.array(
    z.object({
      id: z.string(), name: z.string(), category: z.enum(PROFESSIONAL_CATEGORIES),
      languages: z.array(z.string()), bio: z.string(),
      isPartnerPlatform: z.boolean(), externalUrl: z.string().nullable(), isDemo: z.boolean(),
    }),
  ),
};

export function registerProfessionalTools(server: McpServer, visibleScopes: Set<McpScope> | null) {
  if (visibleScopes && !visibleScopes.has("professionals:read")) return;
  server.registerTool(
    "find_professionals",
    {
      description:
        "Find approved professionals or partner platforms in a category (lawyer, accountant, architect, engineer, cleaner, mover, property manager, barber/grooming).",
      inputSchema: inputShape,
      outputSchema: outputShape,
      annotations: { readOnlyHint: true, openWorldHint: false, title: "Find professionals" },
      _meta: { requiredScope: "professionals:read" },
    },
    async (args, extra) =>
      runTool({
        toolName: "find_professionals",
        args,
        authInfo: extra.authInfo,
        requiredScope: "professionals:read",
        resourceType: "PROFESSIONAL",
        execute: async () => {
          const professionals = await prisma.professional.findMany({
            where: { category: args.category, status: "APPROVED" },
            take: 10,
          });
          return {
            data: {
              count: professionals.length,
              professionals: professionals.map((p) => ({
                id: p.id, name: p.name, category: p.category, languages: p.languages,
                bio: p.bio, isPartnerPlatform: p.isPartnerPlatform, externalUrl: p.externalUrl,
                isDemo: p.isDemo,
              })),
            },
          };
        },
      }),
  );
}
