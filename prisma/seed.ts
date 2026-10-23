import { config } from "dotenv";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env", quiet: true });

const accounts = [
  { code: "1-100", name: "Kas", type: "ASSET" },
  { code: "1-110", name: "Bank", type: "ASSET" },
  { code: "1-200", name: "Piutang Usaha", type: "ASSET" },
  { code: "1-300", name: "Persediaan Perlengkapan", type: "ASSET" },
  { code: "1-400", name: "Peralatan", type: "ASSET" },
  { code: "3-100", name: "Modal Pemilik", type: "EQUITY" },
  { code: "4-100", name: "Pendapatan Jasa", type: "REVENUE" },
  { code: "5-100", name: "Beban Perlengkapan", type: "EXPENSE" },
  { code: "5-200", name: "Beban Listrik dan Air", type: "EXPENSE" },
  { code: "5-300", name: "Beban Gaji", type: "EXPENSE" },
  { code: "5-400", name: "Beban Sewa", type: "EXPENSE" },
  { code: "5-900", name: "Beban Lain-lain", type: "EXPENSE" },
] as const;

const services = [
  { name: "Cuci + setrika", unit: "KG", price: 8000, turnaroundDays: 2 },
  { name: "Express", unit: "KG", price: 12000, turnaroundDays: 1 },
  { name: "Kiloan", unit: "KG", price: 7000, turnaroundDays: 3 },
] as const;

const settings = [
  { key: "shop.name", value: "Sari Laundry" },
  { key: "shop.address", value: "Jl. Mawar No. 12, Jakarta" },
  { key: "shop.phone", value: "081234567890" },
  { key: "shop.receipt_footer", value: "Terima kasih sudah mencuci di Sari Laundry." },
  { key: "shop.pickup_rules", value: "Pengambilan cucian harus menunjukkan struk ini." },
  { key: "app.locale", value: "id" },
  { key: "opening.status", value: "unset" },
  { key: "opening.date", value: "" },
  { key: "opening.cash", value: "0" },
  { key: "opening.bank", value: "0" },
  { key: "opening.equipment", value: "0" },
];

async function main(): Promise<void> {
  // The client reads DATABASE_URL at module load, so import it after dotenv.
  const { db } = await import("../src/server/db");
  const { hash } = await import("bcryptjs");

  const [managerHash, cashierHash] = await Promise.all([
    hash("ChangeMe-Manager1", 12),
    hash("ChangeMe-Cashier1", 12),
  ]);

  for (const account of accounts) {
    await db.account.upsert({
      where: { code: account.code },
      update: { name: account.name, type: account.type },
      create: account,
    });
  }

  // Passwords are only written on first creation so re-running the seed never
  // resets a password the owner has already changed.
  await db.user.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      name: "Manajer",
      username: "manager",
      passwordHash: managerHash,
      role: "MANAGER",
    },
  });

  await db.user.upsert({
    where: { username: "cashier" },
    update: {},
    create: {
      name: "Kasir",
      username: "cashier",
      passwordHash: cashierHash,
      role: "CASHIER",
    },
  });

  // Service edits belong to the manager; the seed only fills in missing rows.
  for (const service of services) {
    await db.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }

  // Settings are also manager-owned. Do not overwrite them on a re-run.
  for (const setting of settings) {
    await db.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(
    `Seed complete: ${accounts.length} accounts, 2 users, ${services.length} services, ${settings.length} settings.`,
  );

  await db.$disconnect();
}

main().catch((error: unknown) => {
  console.error("Seed failed.");
  console.error(error);
  process.exitCode = 1;
});
