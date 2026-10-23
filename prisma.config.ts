import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma 7 does not load .env automatically. Tests point at .env.test through
// DOTENV_CONFIG_PATH so they never touch the development database.
config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
