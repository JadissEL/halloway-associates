import { z } from "zod";
import { requestMagicLink } from "@/lib/auth/magic-link";

const schema = z.object({
  email: z.string().email(),
  locale: z.string().default("en"),
});

export async function POST(request: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    await requestMagicLink(body.email, body.locale);
  } catch (error) {
    console.error("[auth-request-link]", error);
    return Response.json({ error: "Could not send sign-in link." }, { status: 502 });
  }

  // Always succeed with a generic message — never reveal whether an email
  // exists in the system.
  return Response.json({ ok: true });
}
