"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { Resend } from "resend";
import { getTranslations } from "next-intl/server";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  company: z.string().max(100).optional(),
  email: z.string().email().max(320),
  focus: z.enum(["automation", "revenue", "growth", "product", "other"]),
  message: z.string().min(10).max(5000),
});

export type ContactFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    message?: string;
  };
};

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const t = await getTranslations("contactPage.form");

  // This is a fully anonymous, publicly reachable endpoint that sends a real
  // email per valid submission — without a limit it's a free way to spam
  // hello@hallowayassociates.com and burn Resend quota. Same pattern already
  // used by the AI concierge and magic-link routes (src/lib/rate-limit.ts).
  const ip = clientIp(await headers());
  if (isRateLimited(`contact-ip:${ip}`, 5, 10 * 60 * 1000)) {
    return { ok: false, message: t("rateLimited") };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    email: formData.get("email"),
    focus: formData.get("focus"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const fieldErrors = {
      name: errors.name?.[0] ? t("validation.name") : undefined,
      email: errors.email?.[0] ? t("validation.email") : undefined,
      message: errors.message?.[0] ? t("validation.message") : undefined,
    };
    // `focus` has no dedicated field slot in the UI (it's a fixed <select>
    // that can't normally fail) — but a modified/replayed request could
    // still send an invalid value, and a submission with none of the three
    // field errors above would previously return message: "" and look like
    // nothing happened at all. Fall back to the generic error so failures
    // are never silent.
    const hasFieldError = Object.values(fieldErrors).some(Boolean);
    return {
      ok: false,
      message: hasFieldError ? "" : t("error"),
      fieldErrors,
    };
  }

  const { name, company, email, focus, message } = parsed.data;
  const to = process.env.CONTACT_TO_EMAIL ?? "hello@hallowayassociates.com";
  const from =
    process.env.CONTACT_FROM_EMAIL ?? "onboarding@resend.dev";

  const body = [
    `Name: ${name}`,
    company ? `Company: ${company}` : null,
    `Email: ${email}`,
    `Focus: ${focus}`,
    "",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from,
        to,
        replyTo: email,
        subject: `[Halloway] Discovery request — ${name}${company ? ` (${company})` : ""}`,
        text: body,
      });
      if (error) {
        // The Resend SDK resolves normally (not a throw) on an API-level
        // failure — without checking `error` a rejected send looked
        // identical to a successful one, both to the user and in logs.
        throw new Error(error.message);
      }
    } catch (err) {
      console.error("[contact-form]", err);
      return { ok: false, message: t("error") };
    }
  } else {
    console.info("[contact-form]", body);
  }

  return { ok: true, message: t("success") };
}
