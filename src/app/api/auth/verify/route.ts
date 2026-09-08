import { cookies } from "next/headers";
import { consumeMagicLink } from "@/lib/auth/magic-link";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";
import { enabledLocales } from "@/i18n/locales-config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const localeParam = url.searchParams.get("locale") ?? "en";
  const locale = enabledLocales.includes(localeParam) ? localeParam : "en";

  if (!token) {
    return Response.redirect(`${url.origin}/${locale}/sign-in?error=invalid`, 302);
  }

  try {
    const verified = await consumeMagicLink(token);
    if (!verified) {
      return Response.redirect(`${url.origin}/${locale}/sign-in?error=invalid`, 302);
    }

    const sessionToken = createSessionToken(verified);
    const store = await cookies();
    store.set(SESSION_COOKIE, sessionToken, sessionCookieOptions);

    return Response.redirect(`${url.origin}/${locale}/account`, 302);
  } catch (error) {
    // A transient DB/crypto failure here must not surface as Next's raw
    // framework error page — send the user back to sign-in with a message
    // they can act on (try again) instead.
    console.error("[auth-verify]", error);
    return Response.redirect(`${url.origin}/${locale}/sign-in?error=server`, 302);
  }
}
