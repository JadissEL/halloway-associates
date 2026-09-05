"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { createLawyerRequestRoom } from "@/lib/workflows/lawyer-request";

const schema = z.object({
  category: z.string().min(1),
  situation: z.string().min(5),
  consultationMode: z.string().optional(),
  availability: z.string().optional(),
  language: z.string().optional(),
  paymentPreference: z.string().optional(),
  additionalInfo: z.string().optional(),
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

  const { locale, ...input } = parsed.data;
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
