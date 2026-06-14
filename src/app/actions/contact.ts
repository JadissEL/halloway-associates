"use server";

import { z } from "zod";
import { Resend } from "resend";
import { getTranslations } from "next-intl/server";

const contactSchema = z.object({
  name: z.string().min(2),
  company: z.string().optional(),
  email: z.string().email(),
  focus: z.enum(["automation", "revenue", "growth", "product", "other"]),
  message: z.string().min(10),
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

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    email: formData.get("email"),
    focus: formData.get("focus"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      message: "",
      fieldErrors: {
        name: errors.name?.[0] ? t("validation.name") : undefined,
        email: errors.email?.[0] ? t("validation.email") : undefined,
        message: errors.message?.[0] ? t("validation.message") : undefined,
      },
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
      await resend.emails.send({
        from,
        to,
        replyTo: email,
        subject: `[Halloway] Discovery request — ${name}${company ? ` (${company})` : ""}`,
        text: body,
      });
    } catch {
      return { ok: false, message: t("error") };
    }
  } else {
    console.info("[contact-form]", body);
  }

  return { ok: true, message: t("success") };
}
