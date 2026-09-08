import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Partner platform: shopthebarber.app (real, not demo) ----------------
  // Confirmed via direct fetch (2026-09): a barber/grooming booking
  // marketplace ("Book elite barbers & grow your shop"). Geographic scope
  // wasn't published on the page — refine `bio` once confirmed.
  await prisma.professional.upsert({
    where: { id: "partner-shopthebarber" },
    update: {},
    create: {
      id: "partner-shopthebarber",
      name: "ShopTheBarber",
      category: "BARBER_GROOMING",
      languages: ["en", "el"],
      bio: "Book elite barbers and grooming appointments. Halloway & Associates' own platform for this category — recommended instead of third-party barber-booking apps.",
      isPartnerPlatform: true,
      externalUrl: "https://shopthebarber.app",
      isDemo: false,
      status: "APPROVED",
    },
  });

  // --- Demo professionals (clearly flagged, never presented as real) -------
  await prisma.professional.upsert({
    where: { id: "demo-lawyer-1" },
    update: {},
    create: {
      id: "demo-lawyer-1",
      name: "[Demo] Athens Property Law Partners",
      category: "LAWYER",
      languages: ["en", "el"],
      bio: "Placeholder demo entry — replace with a real vetted professional before launch.",
      isDemo: true,
      status: "APPROVED",
    },
  });

  // --- Demo properties -------------------------------------------------------
  const demoProperties = [
    {
      id: "demo-property-1",
      title: "[Demo] Bright 1-bedroom near Syntagma",
      description: "Placeholder demo listing — not a real property.",
      propertyType: "APARTMENT" as const,
      listingIntent: "RENT" as const,
      city: "Athens",
      area: "Syntagma",
      priceAmount: 750,
      bedrooms: 1,
      furnished: true,
    },
    {
      id: "demo-property-2",
      title: "[Demo] Shared room in Kolonaki",
      description: "Placeholder demo listing — not a real property.",
      propertyType: "ROOM" as const,
      listingIntent: "RENT" as const,
      city: "Athens",
      area: "Kolonaki",
      priceAmount: 450,
      bedrooms: 1,
      furnished: true,
    },
    {
      id: "demo-property-3",
      title: "[Demo] Seafront house near Thessaloniki",
      description: "Placeholder demo listing — not a real property.",
      propertyType: "HOUSE" as const,
      listingIntent: "SALE" as const,
      city: "Thessaloniki",
      area: null,
      priceAmount: 210000,
      bedrooms: 3,
      furnished: false,
    },
  ];

  for (const p of demoProperties) {
    await prisma.property.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, status: "PUBLISHED", isDemo: true },
    });
  }

  // --- Default weekly call-booking availability -----------------------------
  const now = new Date();
  const slotTimes: Date[] = [];
  for (let day = 1; day <= 14; day++) {
    const d = new Date(now);
    d.setDate(d.getDate() + day);
    d.setHours(10, 0, 0, 0);
    if (d.getDay() !== 0 && d.getDay() !== 6) slotTimes.push(d);
  }
  for (const start of slotTimes) {
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    await prisma.availabilitySlot.upsert({
      where: { id: `slot-${start.toISOString()}` },
      update: {},
      create: { id: `slot-${start.toISOString()}`, startTime: start, endTime: end, isBooked: false },
    });
  }

  // --- Knowledge base seed (platform + Greece), pending owner approval ------
  await prisma.knowledgeArticle.upsert({
    where: { slug: "cleaning-pricing" },
    update: {},
    create: {
      slug: "cleaning-pricing",
      category: "PLATFORM",
      canonicalLocale: "en",
      canonicalText: "Cleaning services start from [€20] per visit. Exact pricing depends on property size and frequency — confirmed at request time. [Owner: replace bracketed placeholder with real published price.]",
      isApproved: false,
    },
  });
  await prisma.knowledgeArticle.upsert({
    where: { slug: "property-purchase-taxes-overview" },
    update: {},
    create: {
      slug: "property-purchase-taxes-overview",
      category: "GREECE",
      canonicalLocale: "en",
      canonicalText: "Buying property in Greece typically involves a property transfer tax, notary fees, and registration costs, in addition to the purchase price. Rates and thresholds change periodically — this is general orientation, not tax advice. [Owner: review and approve before this is shown to users as platform knowledge.]",
      sourceUrl: null,
      isApproved: false,
    },
  });

  // --- Platform-mechanics knowledge (approved) ------------------------------
  // Unlike the two rows above (external facts — pricing/tax — that need a
  // human owner's sign-off before the concierge states them), these describe
  // the platform's OWN built behavior: verified directly against the running
  // code during a full functional audit (2026-09-07), not sourced externally.
  // Safe to pre-approve — nothing here can go stale except by a real code
  // change, at which point it should be updated alongside that change.
  await prisma.knowledgeArticle.upsert({
    where: { slug: "how-sign-in-works" },
    update: {},
    create: {
      slug: "how-sign-in-works",
      category: "PLATFORM",
      canonicalLocale: "en",
      canonicalText: "Halloway & Associates uses passwordless sign-in: enter your email on the sign-in page and we send a one-time link that expires after 15 minutes. Clicking it signs you in — no password to remember or reset. Sign-in is only required for actions that need to persist, like posting a listing, requesting a professional, or booking a call; browsing and searching never require an account.",
      isApproved: true,
      lastReviewed: new Date(),
    },
  });
  await prisma.knowledgeArticle.upsert({
    where: { slug: "how-listing-moderation-works" },
    update: {},
    create: {
      slug: "how-listing-moderation-works",
      category: "PLATFORM",
      canonicalLocale: "en",
      canonicalText: "Every property listing submitted through the platform is reviewed before it goes live. After you submit, your listing's status is 'pending review' and it will not appear in public search results yet. Once approved, it becomes visible to everyone browsing the platform. There is no fixed review time quoted publicly — if a listing stays pending unusually long, contact us directly.",
      isApproved: true,
      lastReviewed: new Date(),
    },
  });
  await prisma.knowledgeArticle.upsert({
    where: { slug: "how-request-rooms-work" },
    update: {},
    create: {
      slug: "how-request-rooms-work",
      category: "PLATFORM",
      canonicalLocale: "en",
      canonicalText: "When you request a professional (e.g. a lawyer) or book an Arrival & Information Call, we open a 'Request Room' for it — a single place tracking that request's status and history. You can see all your Request Rooms from the AI concierge's Activity panel, or from your account page. Submitting a request does not mean it is confirmed: a lawyer request starts as 'requested' and a call booking is 'confirmed' immediately once a real available slot is reserved — the concierge will always tell you which applies.",
      isApproved: true,
      lastReviewed: new Date(),
    },
  });
  await prisma.knowledgeArticle.upsert({
    where: { slug: "what-demo-listings-mean" },
    update: {},
    create: {
      slug: "what-demo-listings-mean",
      category: "PLATFORM",
      canonicalLocale: "en",
      canonicalText: "Some property and professional listings on the platform are marked with a 'demo' badge. These are placeholder examples used to show how the platform works while more real listings are being added — they are not real properties or professionals available for contact. Listings without a 'demo' badge are real.",
      isApproved: true,
      lastReviewed: new Date(),
    },
  });
  await prisma.knowledgeArticle.upsert({
    where: { slug: "what-the-platform-can-help-with-today" },
    update: {},
    create: {
      slug: "what-the-platform-can-help-with-today",
      category: "PLATFORM",
      canonicalLocale: "en",
      canonicalText: "Today the platform can help you search and post property listings, find and request professionals (lawyers, accountants, architects, engineers, cleaners, movers, property managers, and barber/grooming via our ShopTheBarber partner), and book an Arrival & Information Call with the team. Jobs, vehicles, travel bookings, businesses/land for sale, and calculators are not live yet — if you ask about one of these, we'll tell you honestly rather than guess, and point you to what is available now.",
      isApproved: true,
      lastReviewed: new Date(),
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
