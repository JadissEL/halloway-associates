import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { createLawyerRequestRoom } from "@/lib/workflows/lawyer-request";
import { bookCall } from "@/lib/workflows/call-booking";
import type {
  PropertyType,
  ListingIntent,
  ProfessionalCategory,
  CallType,
} from "@prisma/client";

// The model's tool-call arguments are untrusted input, same as any other
// request body — the JSON-schema `parameters` above only shapes what the
// model is *encouraged* to send, it doesn't validate what actually arrives.
// Every tool gets a real Zod schema parsed before it touches Prisma.
const PROPERTY_TYPES = ["ROOM", "APARTMENT", "HOUSE", "LAND", "COMMERCIAL"] as const;
const LISTING_INTENTS = ["RENT", "SALE"] as const;
const PROFESSIONAL_CATEGORIES = [
  "LAWYER", "ACCOUNTANT", "ARCHITECT", "ENGINEER", "CLEANER",
  "MOVER", "PROPERTY_MANAGER", "BARBER_GROOMING", "OTHER",
] as const;
const CALL_TYPES = ["ORIENTATION", "RELOCATION", "PROPERTY", "BUSINESS", "WORK_LIFE", "INVESTMENT", "CUSTOM", "UNSURE"] as const;

const toolSchemas = {
  search_properties: z.object({
    city: z.string().max(100).optional(),
    maxPrice: z.number().positive().max(1_000_000_000).optional(),
    propertyType: z.enum(PROPERTY_TYPES).optional(),
    listingIntent: z.enum(LISTING_INTENTS).optional(),
  }),
  find_professionals: z.object({
    category: z.enum(PROFESSIONAL_CATEGORIES),
  }),
  create_lawyer_request: z.object({
    category: z.string().min(1).max(50),
    situation: z.string().min(5).max(4000),
    consultationMode: z.string().max(50).optional(),
    availability: z.string().max(500).optional(),
    language: z.string().max(50).optional(),
    paymentPreference: z.string().max(200).optional(),
    additionalInfo: z.string().max(2000).optional(),
  }),
  get_user_requests: z.object({}),
  get_request_status: z.object({
    roomId: z.string().min(1).max(200),
  }),
  get_available_call_slots: z.object({
    callType: z.enum(CALL_TYPES).optional(),
  }),
  create_call_booking: z.object({
    callType: z.enum(CALL_TYPES),
    slotId: z.string().min(1).max(200),
    reason: z.string().max(500).optional(),
    topics: z.array(z.string().max(100)).max(20).optional(),
    preferredLanguage: z.string().max(50).optional(),
    countryOfOrigin: z.string().max(100).optional(),
    cityOfInterest: z.string().max(100).optional(),
  }),
} as const;

export interface ToolContext {
  userId: string | null;
  locale: string;
}

// Groq's chat-completions API is OpenAI-tool-schema compatible.
export const TOOL_SCHEMAS = [
  {
    type: "function" as const,
    function: {
      name: "search_properties",
      description:
        "Search published property listings (rooms, apartments, houses) by city, price, and type. Only returns real platform data — never invent listings.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string" },
          maxPrice: { type: "number" },
          propertyType: { type: "string", enum: ["ROOM", "APARTMENT", "HOUSE", "LAND", "COMMERCIAL"] },
          listingIntent: { type: "string", enum: ["RENT", "SALE"] },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "find_professionals",
      description:
        "Find approved professionals or partner platforms in a category (lawyer, accountant, architect, engineer, cleaner, mover, property manager, barber/grooming).",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "LAWYER", "ACCOUNTANT", "ARCHITECT", "ENGINEER", "CLEANER",
              "MOVER", "PROPERTY_MANAGER", "BARBER_GROOMING", "OTHER",
            ],
          },
        },
        required: ["category"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_lawyer_request",
      description:
        "Create a lawyer/professional-request Request Room once the user has given enough detail (category, situation, consultation mode, availability, language, payment preference). Requires the user to be signed in.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          situation: { type: "string" },
          consultationMode: { type: "string" },
          availability: { type: "string" },
          language: { type: "string" },
          paymentPreference: { type: "string" },
          additionalInfo: { type: "string" },
        },
        required: ["category", "situation"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_user_requests",
      description: "List the signed-in user's Request Rooms (recent, active, and history).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_request_status",
      description: "Get the current status and timeline of a specific Request Room by id.",
      parameters: {
        type: "object",
        properties: { roomId: { type: "string" } },
        required: ["roomId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_available_call_slots",
      description: "List real available Arrival & Information Call slots, optionally filtered by call type.",
      parameters: {
        type: "object",
        properties: {
          callType: {
            type: "string",
            enum: ["ORIENTATION", "RELOCATION", "PROPERTY", "BUSINESS", "WORK_LIFE", "INVESTMENT", "CUSTOM", "UNSURE"],
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_call_booking",
      description:
        "Book an Arrival & Information Call once the user picked a real available slot (from get_available_call_slots) and a call type. Requires the user to be signed in.",
      parameters: {
        type: "object",
        properties: {
          callType: { type: "string" },
          slotId: { type: "string" },
          reason: { type: "string" },
          topics: { type: "array", items: { type: "string" } },
          preferredLanguage: { type: "string" },
          countryOfOrigin: { type: "string" },
          cityOfInterest: { type: "string" },
        },
        required: ["callType", "slotId"],
      },
    },
  },
];

const SIGN_IN_REQUIRED = {
  error: "sign_in_required",
  message: "The user needs to sign in (via the magic-link sign-in page) before this action can be completed. Ask them to sign in, then offer to continue.",
};

const SERVICE_UNAVAILABLE = {
  error: "service_unavailable",
  message: "This information is temporarily unavailable. Let the user know just this one thing couldn't be completed right now and they can try again shortly.",
};

async function searchProperties(args: {
  city?: string; maxPrice?: number;
  propertyType?: PropertyType; listingIntent?: ListingIntent;
}) {
  const properties = await prisma.property.findMany({
    where: {
      status: "PUBLISHED",
      ...(args.city ? { city: { equals: args.city, mode: "insensitive" } } : {}),
      ...(args.maxPrice ? { priceAmount: { lte: args.maxPrice } } : {}),
      ...(args.propertyType ? { propertyType: args.propertyType } : {}),
      ...(args.listingIntent ? { listingIntent: args.listingIntent } : {}),
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  return {
    count: properties.length,
    properties: properties.map((p) => ({
      id: p.id, title: p.title, city: p.city, area: p.area,
      priceAmount: p.priceAmount, currency: p.currency,
      propertyType: p.propertyType, listingIntent: p.listingIntent,
      isDemo: p.isDemo,
    })),
  };
}

async function findProfessionals(args: { category: ProfessionalCategory }) {
  const professionals = await prisma.professional.findMany({
    where: { category: args.category, status: "APPROVED" },
    take: 10,
  });
  return {
    count: professionals.length,
    professionals: professionals.map((p) => ({
      id: p.id, name: p.name, category: p.category, languages: p.languages,
      bio: p.bio, isPartnerPlatform: p.isPartnerPlatform, externalUrl: p.externalUrl,
      isDemo: p.isDemo,
    })),
  };
}

async function createLawyerRequest(
  args: { category: string; situation: string; consultationMode?: string; availability?: string; language?: string; paymentPreference?: string; additionalInfo?: string },
  ctx: ToolContext,
) {
  if (!ctx.userId) return SIGN_IN_REQUIRED;
  const room = await createLawyerRequestRoom(ctx.userId, args);
  return { roomId: room.id, status: room.status };
}

async function getUserRequests(ctx: ToolContext) {
  if (!ctx.userId) return SIGN_IN_REQUIRED;
  const rooms = await prisma.requestRoom.findMany({
    where: { userId: ctx.userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  return {
    rooms: rooms.map((r) => ({
      id: r.id, type: r.type, status: r.status, updatedAt: r.updatedAt.toISOString(),
    })),
  };
}

async function getRequestStatus(args: { roomId: string }, ctx: ToolContext) {
  if (!ctx.userId) return SIGN_IN_REQUIRED;

  const room = await prisma.requestRoom.findUnique({
    where: { id: args.roomId },
    include: { statusEvents: { orderBy: { createdAt: "asc" } } },
  });
  // Explicit ctx.userId guard above means this can never compare null===null
  // even if RequestRoom.userId ever became nullable in a future migration.
  if (!room || room.userId !== ctx.userId) {
    return { error: "not_found", message: "No such request for this user." };
  }
  return {
    id: room.id, type: room.type, status: room.status,
    timeline: room.statusEvents.map((e) => ({ toStatus: e.toStatus, note: e.note, at: e.createdAt.toISOString() })),
  };
}

async function getAvailableCallSlots(args: { callType?: CallType }) {
  const slots = await prisma.availabilitySlot.findMany({
    where: { isBooked: false, startTime: { gte: new Date() }, ...(args.callType ? { callType: args.callType } : {}) },
    orderBy: { startTime: "asc" },
    take: 10,
  });
  return {
    slots: slots.map((s) => ({ id: s.id, startTime: s.startTime.toISOString(), endTime: s.endTime.toISOString() })),
  };
}

async function createCallBooking(
  args: { callType: CallType; slotId: string; reason?: string; topics?: string[]; preferredLanguage?: string; countryOfOrigin?: string; cityOfInterest?: string },
  ctx: ToolContext,
) {
  if (!ctx.userId) return SIGN_IN_REQUIRED;

  const result = await bookCall(ctx.userId, { ...args, preferredLanguage: args.preferredLanguage ?? ctx.locale });
  if ("error" in result) return result;
  return { bookingId: result.bookingId, roomId: result.roomId, status: "CONFIRMED", slotStart: result.slotStart.toISOString() };
}

export async function executeTool(name: string, rawArgs: string, ctx: ToolContext): Promise<object> {
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(rawArgs || "{}");
  } catch {
    return { error: "invalid_arguments" };
  }

  if (!(name in toolSchemas)) {
    return { error: "unknown_tool" };
  }

  const schema = toolSchemas[name as keyof typeof toolSchemas];
  const parsed = schema.safeParse(rawJson);
  if (!parsed.success) {
    return { error: "invalid_arguments", message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const args = parsed.data;

  try {
    switch (name) {
      case "search_properties":
        return await searchProperties(args as z.infer<typeof toolSchemas.search_properties>);
      case "find_professionals":
        return await findProfessionals(args as z.infer<typeof toolSchemas.find_professionals>);
      case "create_lawyer_request":
        return await createLawyerRequest(args as z.infer<typeof toolSchemas.create_lawyer_request>, ctx);
      case "get_user_requests":
        return await getUserRequests(ctx);
      case "get_request_status":
        return await getRequestStatus(args as z.infer<typeof toolSchemas.get_request_status>, ctx);
      case "get_available_call_slots":
        return await getAvailableCallSlots(args as z.infer<typeof toolSchemas.get_available_call_slots>);
      case "create_call_booking":
        return await createCallBooking(args as z.infer<typeof toolSchemas.create_call_booking>, ctx);
      default:
        return { error: "unknown_tool" };
    }
  } catch (error) {
    // A single tool failing (e.g. a transient Neon hiccup) must not throw
    // uncaught up through groq-client.ts's per-round loop — that would
    // discard every other tool result already gathered this round and abort
    // the whole model turn. Degrade just this one tool instead.
    console.error(`[ai-tools:${name}]`, error);
    return SERVICE_UNAVAILABLE;
  }
}
