import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default clerkMiddleware(async (auth, request) => {
  // API/trpc routes live outside the [locale] segment and must never get
  // next-intl's localePrefix:"always" redirect (it would send e.g.
  // /api/notifications to /en/api/notifications, which 404s — there's no
  // such route). They still need clerkMiddleware to run so auth()/
  // currentUser() resolve inside route handlers; they just skip intl.
  if (request.nextUrl.pathname.startsWith("/api") || request.nextUrl.pathname.startsWith("/trpc")) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
