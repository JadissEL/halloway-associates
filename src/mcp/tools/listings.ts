import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "@/lib/db/client";
import { runTool } from "../tool-runtime";
import { authorizeOwnership } from "../authorize";
import { computeCompleteness } from "@/lib/media/completeness";
import { getTaxonomy } from "@/lib/media/taxonomy";
import type { McpScope } from "../types";

// The AI-assisted listing workflow (spec sections 10-14): lets the concierge
// materialize and progressively fill a Property draft from conversation +
// media, instead of the user filling PropertyForm.tsx by hand. That manual
// form keeps working unmodified (spec item 1, non-regression) — this is a
// second, additive path onto the exact same Property table and the exact
// same ModerationStatus lifecycle (DRAFT -> PENDING_REVIEW -> ... —
// moderation review is untouched, a draft still goes through the same
// human review before it's ever PUBLISHED).
//
// Only PROPERTY is wired here because it's the only listing type with a
// real Prisma model (see the taxonomy.ts comment) — extending to another
// vertical means adding its model, then a tools file that mirrors this one.

const PROPERTY_TYPES = ["ROOM", "APARTMENT", "HOUSE", "LAND", "COMMERCIAL"] as const;
const LISTING_INTENTS = ["RENT", "SALE"] as const;

const draftFieldsShape = {
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(4000).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  listingIntent: z.enum(LISTING_INTENTS).optional(),
  city: z.string().min(1).max(100).optional(),
  area: z.string().max(100).optional().describe("Neighbourhood/district NAME (e.g. 'Kolonaki') — never a number. For the property's size in square metres, use livingAreaSqm instead."),
  livingAreaSqm: z.number().positive().max(100_000).optional().describe("The property's living area/floor size in square metres — this is what 'X square meters' in the user's message refers to, not the `area` field."),
  priceAmount: z.number().positive().max(1_000_000_000).optional(),
  bedrooms: z.number().int().min(0).max(50).optional(),
  furnished: z.boolean().optional(),
};

function toPropertyData(a: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const key of Object.keys(draftFieldsShape)) {
    if (a[key] !== undefined) data[key] = a[key];
  }
  return data;
}

async function draftSummary(propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return null;
  const media = await prisma.mediaAsset.findMany({
    where: { propertyId, mediaKind: "IMAGE" },
    select: { detectedCategory: true, categoryConfidence: true, userConfirmed: true, duplicateGroup: true, qualityScore: true },
  });
  const confirmedCategories = media
    .filter((m) => m.userConfirmed || (m.categoryConfidence ?? 0) >= 0.6)
    .map((m) => m.detectedCategory)
    .filter((c): c is string => Boolean(c));

  const completeness = computeCompleteness({
    listingKind: "PROPERTY",
    fields: property as unknown as Record<string, unknown>,
    mediaCategoriesPresent: confirmedCategories,
    mediaCount: media.length,
  });

  return {
    id: property.id,
    status: property.status,
    fields: {
      title: property.title, description: property.description, propertyType: property.propertyType,
      listingIntent: property.listingIntent, city: property.city, area: property.area,
      livingAreaSqm: property.livingAreaSqm,
      priceAmount: property.priceAmount, bedrooms: property.bedrooms, furnished: property.furnished,
    },
    mediaCount: media.length,
    lowQualityMediaCount: media.filter((m) => (m.qualityScore ?? 1) < 0.35).length,
    possibleDuplicateGroups: [...new Set(media.map((m) => m.duplicateGroup).filter(Boolean))].length,
    completeness,
  };
}

export function registerListingTools(server: McpServer, visibleScopes: Set<McpScope> | null) {
  if (!visibleScopes || visibleScopes.has("properties:write:own")) {
    server.registerTool(
      "create_property_draft",
      {
        description:
          "Start a new property listing draft from the conversation once the user has expressed intent to list/sell/rent a property (even with minimal detail — you can fill in more later via update_property_draft). Requires sign-in. Links any photos/media already uploaded in this chat session to the new draft automatically. MEDIUM-risk: proposes first, then creates on confirmation.",
        inputSchema: {
          ...draftFieldsShape,
          confirm: z.boolean().optional()
            .describe("Leave unset on your first call. Only set to true if you are re-issuing this exact call after the user has already explicitly confirmed it in this conversation."),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, title: "Start a property listing draft" },
        _meta: { requiredScope: "properties:write:own" },
      },
      async (args, extra) =>
        runTool({
          toolName: "create_property_draft",
          args,
          authInfo: extra.authInfo,
          requiredScope: "properties:write:own",
          resourceType: "PROPERTY",
          summarize: (a) =>
            `I'll start a new ${a.listingIntent === "RENT" ? "rental" : "sale"} listing draft${a.city ? ` in ${a.city}` : ""}${a.propertyType ? ` (${String(a.propertyType).toLowerCase()})` : ""}. Shall I create it?`,
          execute: async (a, identity) => {
            if (!identity.userId) throw new Error("unreachable: scope check should have required sign-in");
            const fields = toPropertyData(a);
            const property = await prisma.property.create({
              data: {
                ownerId: identity.userId,
                title: (fields.title as string) ?? "Untitled listing",
                description: (fields.description as string) ?? "",
                propertyType: (fields.propertyType as (typeof PROPERTY_TYPES)[number]) ?? "APARTMENT",
                listingIntent: (fields.listingIntent as (typeof LISTING_INTENTS)[number]) ?? "SALE",
                city: (fields.city as string) ?? "",
                area: fields.area as string | undefined,
                livingAreaSqm: fields.livingAreaSqm as number | undefined,
                priceAmount: (fields.priceAmount as number) ?? 0,
                bedrooms: fields.bedrooms as number | undefined,
                furnished: fields.furnished as boolean | undefined,
                status: "DRAFT",
              },
            });
            // Any media the user already dropped into this chat session
            // (before the draft existed) belongs to this listing now — this
            // is what makes "here are 15 photos" followed by "I want to
            // sell this apartment" work regardless of order (spec section 13).
            if (identity.sessionId) {
              await prisma.mediaAsset.updateMany({
                where: { sessionId: identity.sessionId, propertyId: null },
                data: { propertyId: property.id, listingKind: "PROPERTY" },
              });
            }
            const summary = await draftSummary(property.id);
            return { data: { draft: summary }, resourceId: property.id };
          },
        }),
    );

    server.registerTool(
      "update_property_draft",
      {
        description:
          "Update fields on a property draft you own (still in DRAFT status, not yet submitted for review). Only include fields you actually have new information for — never overwrite a field with a guess. LOW-risk: applies immediately, no confirmation needed, since it only ever touches your own unpublished draft.",
        inputSchema: { ...draftFieldsShape, propertyId: z.string().min(1).max(200) },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, title: "Update a property draft" },
        _meta: { requiredScope: "properties:write:own" },
      },
      async (args, extra) =>
        runTool({
          toolName: "update_property_draft",
          args,
          authInfo: extra.authInfo,
          requiredScope: "properties:write:own",
          resourceType: "PROPERTY",
          execute: async (a, identity) => {
            const existing = await prisma.property.findUnique({ where: { id: a.propertyId } });
            if (!existing || !authorizeOwnership("Property", existing.ownerId, identity.userId)) {
              return { data: { error: "not_found", message: "No such draft for this user." } };
            }
            if (existing.status !== "DRAFT") {
              return { data: { error: "not_editable", message: "This listing has already been submitted and can no longer be edited this way." } };
            }
            await prisma.property.update({ where: { id: a.propertyId }, data: toPropertyData(a) });
            const summary = await draftSummary(a.propertyId);
            return { data: { draft: summary }, resourceId: a.propertyId };
          },
        }),
    );

    server.registerTool(
      "submit_property_draft",
      {
        description:
          "Submit a completed property draft for moderation review (moves it from DRAFT to PENDING_REVIEW, the same human-reviewed queue every listing goes through — matches the platform's existing 'nothing publishes automatically' policy). Only call this once the user confirms they're ready; check completeness with get_property_draft_status first and mention anything important that's still missing. MEDIUM-risk: proposes first, then submits on confirmation.",
        inputSchema: {
          propertyId: z.string().min(1).max(200),
          confirm: z.boolean().optional()
            .describe("Leave unset on your first call. Only set to true if you are re-issuing this exact call after the user has already explicitly confirmed it in this conversation."),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, title: "Submit listing for review" },
        _meta: { requiredScope: "properties:write:own" },
      },
      async (args, extra) =>
        runTool({
          toolName: "submit_property_draft",
          args,
          authInfo: extra.authInfo,
          requiredScope: "properties:write:own",
          resourceType: "PROPERTY",
          summarize: () => "I'll submit this listing for review. Our team checks every listing before it goes live — shall I submit it now?",
          execute: async (a, identity) => {
            const existing = await prisma.property.findUnique({ where: { id: a.propertyId } });
            if (!existing || !authorizeOwnership("Property", existing.ownerId, identity.userId)) {
              return { data: { error: "not_found", message: "No such draft for this user." } };
            }
            if (existing.status !== "DRAFT") {
              return { data: { error: "already_submitted", message: "This listing was already submitted." } };
            }
            const media = await prisma.mediaAsset.findMany({ where: { propertyId: a.propertyId, mediaKind: "IMAGE" } });
            const imageUrls = media
              .filter((m) => m.processingStatus === "ANALYZED" || m.processingStatus === "UPLOADED")
              .map((m) => `/api/media/${m.id}`);
            await prisma.property.update({
              where: { id: a.propertyId },
              data: { status: "PENDING_REVIEW", images: imageUrls },
            });
            return { data: { propertyId: a.propertyId, status: "PENDING_REVIEW" }, resourceId: a.propertyId };
          },
        }),
    );

    server.registerTool(
      "get_property_draft_status",
      {
        description:
          "Get a property draft's current fields, media summary, and algorithmic completeness score (missing required fields/photos) — use this before deciding what to ask the user next, and before offering to submit.",
        inputSchema: { propertyId: z.string().min(1).max(200) },
        annotations: { readOnlyHint: true, openWorldHint: false, title: "Check draft completeness" },
        _meta: { requiredScope: "properties:write:own" },
      },
      async (args, extra) =>
        runTool({
          toolName: "get_property_draft_status",
          args,
          authInfo: extra.authInfo,
          requiredScope: "properties:write:own",
          resourceType: "PROPERTY",
          execute: async (a, identity) => {
            const existing = await prisma.property.findUnique({ where: { id: a.propertyId } });
            if (!existing || !authorizeOwnership("Property", existing.ownerId, identity.userId)) {
              return { data: { error: "not_found", message: "No such draft for this user." } };
            }
            const summary = await draftSummary(a.propertyId);
            return { data: { draft: summary }, resourceId: a.propertyId };
          },
        }),
    );

    server.registerTool(
      "get_media_analysis",
      {
        description:
          "Get the AI's analysis of media (photos/audio/documents) the user has uploaded in this chat session — detected categories, confidence, extracted text/transcript, quality issues, duplicates. Use this to talk about what you've seen instead of asking the user to describe photos they already sent.",
        inputSchema: { propertyId: z.string().max(200).optional() },
        annotations: { readOnlyHint: true, openWorldHint: false, title: "Review uploaded media" },
        _meta: { requiredScope: "properties:write:own" },
      },
      async (args, extra) =>
        runTool({
          toolName: "get_media_analysis",
          args,
          authInfo: extra.authInfo,
          requiredScope: "properties:write:own",
          resourceType: "PROPERTY",
          execute: async (a, identity) => {
            if (!a.propertyId && !identity.sessionId) return { data: { count: 0, availableCategories: [], items: [] } };
            const items = await prisma.mediaAsset.findMany({
              where: a.propertyId ? { propertyId: a.propertyId } : { sessionId: identity.sessionId! },
              orderBy: { createdAt: "asc" },
              take: 60,
              select: {
                id: true, mediaKind: true, processingStatus: true, detectedCategory: true, categoryConfidence: true,
                extractedText: true, transcript: true, aiDescription: true, qualityScore: true, duplicateGroup: true,
                userConfirmed: true,
              },
            });
            const taxonomy = getTaxonomy("PROPERTY");
            return {
              data: {
                count: items.length,
                availableCategories: taxonomy?.mediaCategories.map((c) => c.key) ?? [],
                items: items.map((item) => ({ ...item, previewUrl: `/api/media/${item.id}` })),
              },
            };
          },
        }),
    );
  }
}
