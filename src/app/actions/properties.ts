"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { safeLocaleOrDefault } from "@/i18n/locales-config";

const propertySchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(10).max(4000),
  propertyType: z.enum(["ROOM", "APARTMENT", "HOUSE", "LAND", "COMMERCIAL"]),
  listingIntent: z.enum(["RENT", "SALE"]),
  city: z.string().min(2).max(100),
  area: z.string().max(100).optional(),
  priceAmount: z.coerce.number().int().positive().max(1_000_000_000),
  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  furnished: z.coerce.boolean().optional(),
  locale: z.string(),
});

export type PropertyFormState = { ok: boolean; error?: string };

export async function submitPropertyListing(
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "sign_in_required" };
  }

  const parsed = propertySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  const { locale: rawLocale, ...data } = parsed.data;
  const locale = safeLocaleOrDefault(rawLocale);

  try {
    const property = await prisma.property.create({
      data: { ...data, ownerId: session.userId, status: "PENDING_REVIEW" },
    });
    await prisma.moderationItem.create({
      data: { contentType: "PROPERTY", propertyId: property.id, status: "PENDING_REVIEW" },
    });
  } catch (error) {
    console.error("[submit-property]", error);
    return { ok: false, error: "service_unavailable" };
  }

  redirect(`/${locale}/properties?submitted=1`);
}
