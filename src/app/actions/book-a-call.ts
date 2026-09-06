"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { bookCall } from "@/lib/workflows/call-booking";
import { safeLocaleOrDefault } from "@/i18n/locales-config";

const schema = z.object({
  callType: z.enum(["ORIENTATION", "RELOCATION", "PROPERTY", "BUSINESS", "WORK_LIFE", "INVESTMENT", "CUSTOM", "UNSURE"]),
  slotId: z.string().min(1).max(200),
  reason: z.string().max(500).optional(),
  topics: z.string().max(500).optional(),
  preferredLanguage: z.string().max(50).optional(),
  countryOfOrigin: z.string().max(100).optional(),
  cityOfInterest: z.string().max(100).optional(),
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

  const { locale: rawLocale, topics, ...rest } = parsed.data;
  const locale = safeLocaleOrDefault(rawLocale);
  let result: Awaited<ReturnType<typeof bookCall>>;
  try {
    result = await bookCall(session.userId, {
      ...rest,
      topics: topics ? topics.split(",").map((t) => t.trim()).filter(Boolean) : [],
    });
  } catch (error) {
    console.error("[submit-call-booking]", error);
    return { ok: false, error: "service_unavailable" };
  }

  if ("error" in result) return { ok: false, error: result.error };

  redirect(`/${locale}/account/requests/${result.roomId}`);
}
