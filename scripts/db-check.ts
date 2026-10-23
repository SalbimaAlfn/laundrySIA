import { config } from "dotenv";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env", quiet: true });

async function main(): Promise<void> {
  // Import after the environment is loaded, because the client reads DATABASE_URL
  // when the module is first evaluated.
  const { db } = await import("../src/server/db");
  const rows = await db.$queryRaw<Array<{ ok: number | bigint }>>`SELECT 1 AS ok`;
  const value = rows[0]?.ok;
  console.log(`Database connection OK: SELECT 1 returned ${String(value)}.`);
  await db.$disconnect();
}

main().catch((error: unknown) => {
  console.error("Database connection failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
