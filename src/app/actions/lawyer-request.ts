"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createLawyerRequestRoom } from "@/lib/workflows/lawyer-request";
import { safeLocaleOrDefault } from "@/i18n/locales-config";

// Matches LawyerRequestForm.tsx's fixed <select> options exactly — without
// this the schema accepted any 1-50 char string, so a direct/scripted POST
// could store an arbitrary category value in RequestRoom.structuredData.
const CATEGORIES = ["property", "immigration", "business", "tax", "employment", "family", "contract", "dispute", "other"] as const;

const schema = z.object({
  category: z.enum(CATEGORIES),
  situation: z.string().min(5).max(4000),
  consultationMode: z.string().max(50).optional(),
  availability: z.string().max(500).optional(),
  language: z.string().max(50).optional(),
  paymentPreference: z.string().max(200).optional(),
  additionalInfo: z.string().max(2000).optional(),
  locale: z.string(),
});

export type LawyerRequestFormState = { ok: boolean; error?: string };

export async function submitLawyerRequest(
  _prev: LawyerRequestFormState,
  formData: FormData,
): Promise<LawyerRequestFormState> {
  const session = await getSession();
  if (!session) return { ok: false, error: "sign_in_required" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { locale: rawLocale, ...input } = parsed.data;
  const locale = safeLocaleOrDefault(rawLocale);
  let roomId: string;
  try {
    const room = await createLawyerRequestRoom(session.userId, input);
    roomId = room.id;
  } catch (error) {
    console.error("[submit-lawyer-request]", error);
    return { ok: false, error: "service_unavailable" };
  }

  redirect(`/${locale}/account/requests/${roomId}`);
}
