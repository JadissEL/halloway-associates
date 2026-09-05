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
