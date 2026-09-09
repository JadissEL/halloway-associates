import { z } from "zod";
import { requestMagicLink } from "@/lib/auth/magic-link";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { safeLocaleOrDefault } from "@/i18n/locales-config";
import { isRateLimited, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(320),
  locale: z.string().max(10).default("en"),
  // Where to land after clicking the emailed link — e.g. "/app" when the
  // user was sent here from the gated AI concierge. Validated again in
  // magic-link.ts itself; validating here too means an obviously-bad value
  // never even gets embedded in the sent email.
  redirect: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const normalizedEmail = body.email.trim().toLowerCase();
  const ip = clientIp(request.headers);
  // Caps abuse of a fully unauthenticated, Resend-sending endpoint: at most
  // 5 links per email and 20 per IP in a 10-minute window.
  if (
    isRateLimited(`link-email:${normalizedEmail}`, 5, 10 * 60 * 1000) ||
    isRateLimited(`link-ip:${ip}`, 20, 10 * 60 * 1000)
  ) {
    return Response.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    await requestMagicLink(normalizedEmail, safeLocaleOrDefault(body.locale), safeRedirectPath(body.redirect, "/account"));
  } catch (error) {
    console.error("[auth-request-link]", error);
    return Response.json({ error: "Could not send sign-in link." }, { status: 502 });
  }

  // Always succeed with a generic message — never reveal whether an email
  // exists in the system.
  return Response.json({ ok: true });
}
