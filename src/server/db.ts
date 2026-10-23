import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  return url;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMariaDb(databaseUrl());
  return new PrismaClient({ adapter });
}

// Next.js hot reload evaluates modules more than once. Reuse the client so
// development does not open a new pool on every edit.
const globalForPrisma = globalThis as unknown as { laundrysiaDb?: PrismaClient };

export const db = globalForPrisma.laundrysiaDb ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.laundrysiaDb = db;
}
