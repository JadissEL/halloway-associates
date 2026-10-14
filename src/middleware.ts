import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Metadata routes live at the site root. next-intl's localePrefix:"always"
  // would send /sitemap.xml and /robots.txt to /en/sitemap.xml and
  // /en/robots.txt, which 404, so Google sees no sitemap and no robots.
  // The matcher below also excludes txt/xml; this guard covers the case
  // where a request still reaches the function.
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") {
    return NextResponse.next();
  }

  // API/trpc routes live outside the [locale] segment and must never get
  // next-intl's localePrefix:"always" redirect (it would send e.g.
  // /api/notifications to /en/api/notifications, which 404s — there's no
  // such route). They still need clerkMiddleware to run so auth()/
  // currentUser() resolve inside route handlers; they just skip intl.
  if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|txt|xml|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
