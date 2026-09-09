import { cookies } from "next/headers";
import { consumeMagicLink } from "@/lib/auth/magic-link";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { enabledLocales } from "@/i18n/locales-config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const localeParam = url.searchParams.get("locale") ?? "en";
  const locale = enabledLocales.includes(localeParam) ? localeParam : "en";
  // e.g. "/app" when the user was sent to sign in from the gated AI
  // concierge, instead of always landing on /account regardless of why
  // they signed in.
  const redirectPath = safeRedirectPath(url.searchParams.get("redirect"), "/account");

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

    return Response.redirect(`${url.origin}/${locale}${redirectPath}`, 302);
  } catch (error) {
    // A transient DB/crypto failure here must not surface as Next's raw
    // framework error page — send the user back to sign-in with a message
    // they can act on (try again) instead.
    console.error("[auth-verify]", error);
    return Response.redirect(`${url.origin}/${locale}/sign-in?error=server`, 302);
  }
}
