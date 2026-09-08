import Link from "next/link";

// This boundary sits OUTSIDE the [locale] layout (it's what Next.js falls
// back to for any path that doesn't even match a locale-scoped route, e.g.
// /en/properties/some-nonexistent-id), so it has no NextIntlClientProvider
// and no reliable locale to target — the i18n-aware Link from "@/i18n/
// navigation" (a next-intl wrapper) threw here ("No intl context found")
// rather than rendering a 404, which surfaced to users as a raw 500 with a
// leaked server stack trace. Plain next/link's Link needs only the App
// Router context (always present, this boundary is still inside it), not
// next-intl's — so it sidesteps the crash without losing client-side nav.
//
// It also has no [locale]/layout.tsx above it to supply <html>/<body> — the
// root layout (src/app/layout.tsx) is a deliberate passthrough since every
// real page lives under [locale] and gets its document shell from there.
// This is the one boundary that renders with nothing above it, so it has to
// provide its own full document instead of assuming a parent will.
export default function NotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-luxury-black font-sans">
        <div className="luxury-surface flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <p className="eyebrow mb-4">404</p>
          <h1 className="headline mb-4">Page not found</h1>
          <Link
            href="/"
            className="bg-luxury-gold px-6 py-3 text-sm font-semibold text-luxury-black no-underline transition-all duration-200 hover:brightness-110"
          >
            Back to home
          </Link>
        </div>
      </body>
    </html>
  );
}
