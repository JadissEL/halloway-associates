"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { bookCall } from "@/lib/workflows/call-booking";

const schema = z.object({
  callType: z.enum(["ORIENTATION", "RELOCATION", "PROPERTY", "BUSINESS", "WORK_LIFE", "INVESTMENT", "CUSTOM", "UNSURE"]),
  slotId: z.string().min(1),
  reason: z.string().optional(),
  topics: z.string().optional(),
  preferredLanguage: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  cityOfInterest: z.string().optional(),
  locale: z.string(),
});

export type BookCallFormState = { ok: boolean; error?: string };

export async function submitCallBooking(
  _prev: BookCallFormState,
  formData: FormData,
): Promise<BookCallFormState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "sign_in_required" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { locale, topics, ...rest } = parsed.data;
  const result = await bookCall(session.userId, {
    ...rest,
    topics: topics ? topics.split(",").map((t) => t.trim()).filter(Boolean) : [],
  });

  if ("error" in result) return { ok: false, error: result.error };

  redirect(`/${locale}/account/requests/${result.roomId}`);
}
