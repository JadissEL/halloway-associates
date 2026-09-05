import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Standard Next.js-on-a-long-lived-server singleton pattern: in dev, Next's
// module reloading would otherwise create a new PrismaClient (and a new
// connection pool) on every hot reload. Render runs this as a persistent
// Node process, so a plain `pg` driver adapter is the right choice here —
// no need for Neon's HTTP/edge driver, which exists for stateless edge
// functions that can't hold a TCP connection.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
