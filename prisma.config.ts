// Mirror Next.js's env-file precedence for the Prisma CLI (which doesn't
// go through Next's own env loader): .env, then .env.local overrides it.
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

import { defineConfig } from "prisma/config";

// Only `prisma migrate`/`db push`/`studio` (run manually, locally, once a
// real DATABASE_URL exists) actually need this to be a working connection
// string. `prisma generate` -- which runs on every install/build, including
// on Render before real secrets are configured -- only reads the schema
// file and never opens a connection, but prisma/config's `env()` helper
// throws at config-load time if the variable isn't set, which broke
// `generate` too. A plain fallback avoids that without weakening the real
// runtime client, which never reads this file: src/lib/db/client.ts builds
// its own connection via the pg adapter directly off process.env.DATABASE_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/placeholder",
  },
});
