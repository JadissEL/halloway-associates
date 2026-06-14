# Halloway & Associates — Corporate Website

Bilingual (EN/FR) Next.js marketing site for Halloway & Associates Production Lab.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- next-intl (i18n)
- Framer Motion
- Resend (contact form)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en) or [http://localhost:3000/fr](http://localhost:3000/fr).

## Environment variables

Copy `.env.example` to `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=https://www.hallowayassociates.com
CONTACT_TO_EMAIL=hello@hallowayassociates.com
CONTACT_FROM_EMAIL=onboarding@resend.dev
RESEND_API_KEY=
```

Without `RESEND_API_KEY`, contact submissions are logged to the server console.

## Feature flags

Edit `src/lib/features.ts` to enable future sections:

- `showWork` — portfolio / case studies
- `showTestimonials` — client quotes
- `showPress` — media mentions
- `showInsights` — blog / articles

## Deploy

Deploy to Vercel and set environment variables. Point `hallowayassociates.com` DNS to Vercel.

```bash
npm run build
```

## Project structure

```
src/app/[locale]/     Localized routes
src/components/       UI components
messages/             EN + FR copy
email-templates/      Outreach email HTML (separate)
content/work/         Future case study content
```
