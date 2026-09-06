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

// Lazy on purpose: importing this module must never throw, even when
// DATABASE_URL isn't configured yet (e.g. before Render's env vars are
// set). Every call site already wraps its actual query in try/catch
// (safeQuery, or a route-level try/catch) — this Proxy defers the missing-
// env-var error to the moment a query actually runs, inside those handlers,
// instead of crashing at module load for every route that merely imports
// `prisma`, which would otherwise take down the whole app.
function getClient(): PrismaClient {
  if (!globalThis.__prisma) {
    globalThis.__prisma = createClient();
  }
  return globalThis.__prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
