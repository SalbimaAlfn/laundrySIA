import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { JournalError, postEntry, reverseEntry, type PostEntryInput } from "./journal";

// Integration tests use the dedicated test database, never the dev database.
config({ path: ".env.test", override: true, quiet: true });
const { db } = await import("../db");

const marker = "JOURNAL-TEST";
let userId: number;

async function cleanup(): Promise<void> {
  // Find all entries that are reversals of our test entries or are test entries
  const originals = await db.journalEntry.findMany({
    where: { description: { startsWith: marker } },
    select: { id: true },
  });
  const originalIds = originals.map((entry) => entry.id);
  if (originalIds.length === 0) return;

  // Find reversals
  const reversals = await db.journalEntry.findMany({
    where: { reversesEntryId: { in: originalIds } },
    select: { id: true },
  });
  const reversalIds = reversals.map((entry) => entry.id);
  const allIds = [...originalIds, ...reversalIds];

  // Null out all reversesEntryId references to avoid FK issues
  await db.journalEntry.updateMany({
    where: { reversesEntryId: { in: allIds } },
    data: { reversesEntryId: null },
  });
  await db.journalEntry.updateMany({
    where: { id: { in: allIds } },
    data: { reversesEntryId: null },
  });

  await db.journalLine.deleteMany({ where: { entryId: { in: allIds } } });
  // Delete reversals first, then originals
  if (reversalIds.length > 0) {
    await db.journalEntry.deleteMany({ where: { id: { in: reversalIds } } });
  }
  if (originalIds.length > 0) {
    await db.journalEntry.deleteMany({ where: { id: { in: originalIds } } });
  }
}

function input(overrides: Partial<PostEntryInput> = {}): PostEntryInput {
  return {
    date: "2026-10-07",
    description: `${marker} balanced entry`,
    refType: "OPENING",
    lines: [
      { accountCode: "1-100", debit: 1_000 },
      { accountCode: "3-100", credit: 1_000 },
    ],
    createdById: userId,
    ...overrides,
  };
}

function post(overrides: Partial<PostEntryInput> = {}) {
  return db.$transaction((tx) => postEntry(tx, input(overrides)));
}

beforeAll(async () => {
  // The seed creates these accounts, but upsert keeps this file independent.
  await db.account.upsert({
    where: { code: "1-100" },
    update: {},
    create: { code: "1-100", name: "Kas", type: "ASSET" },
  });
  await db.account.upsert({
    where: { code: "3-100" },
    update: {},
    create: { code: "3-100", name: "Modal Pemilik", type: "EQUITY" },
  });

  const user = await db.user.upsert({
    where: { username: "journal-test" },
    update: {},
    create: {
      name: "Journal Test",
      username: "journal-test",
      passwordHash: "not-a-real-hash",
      role: "MANAGER",
    },
  });
  userId = user.id;
});

beforeEach(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await db.user.deleteMany({ where: { username: "journal-test" } });
  await db.$disconnect();
});

describe("postEntry", () => {
  it("inserts a balanced entry and its lines", async () => {
    const { entryId } = await post();

    const entry = await db.journalEntry.findUniqueOrThrow({
      where: { id: entryId },
      include: { lines: { include: { account: true } } },
    });

    expect(entry.description).toBe(`${marker} balanced entry`);
    expect(entry.refType).toBe("OPENING");
    expect(entry.entryDate.toISOString().slice(0, 10)).toBe("2026-10-07");
    expect(entry.lines).toHaveLength(2);

    const cash = entry.lines.find((line) => line.account.code === "1-100");
    const capital = entry.lines.find((line) => line.account.code === "3-100");
    expect(cash).toMatchObject({ debit: 1_000, credit: 0 });
    expect(capital).toMatchObject({ debit: 0, credit: 1_000 });

    expect(entry.lines.reduce((sum, line) => sum + line.debit, 0)).toBe(
      entry.lines.reduce((sum, line) => sum + line.credit, 0),
    );
  });

  it("rejects an unbalanced entry without inserting rows", async () => {
    await expect(
      post({
        lines: [
          { accountCode: "1-100", debit: 1_000 },
          { accountCode: "3-100", credit: 900 },
        ],
      }),
    ).rejects.toMatchObject({ code: "JOURNAL_UNBALANCED" });

    expect(await db.journalEntry.count({ where: { description: { startsWith: marker } } })).toBe(0);
  });

  it("rejects negative amounts", async () => {
    await expect(
      post({
        lines: [
          { accountCode: "1-100", debit: -1 },
          { accountCode: "3-100", credit: 1 },
        ],
      }),
    ).rejects.toMatchObject({ code: "JOURNAL_NEGATIVE_AMOUNT" });
  });

  it("rejects a line with both sides positive", async () => {
    await expect(
      post({
        lines: [
          { accountCode: "1-100", debit: 1_000, credit: 1_000 },
          { accountCode: "3-100", credit: 1_000 },
        ],
      }),
    ).rejects.toMatchObject({ code: "JOURNAL_BOTH_SIDES" });
  });

  it("rejects a line with neither side positive", async () => {
    await expect(
      post({
        lines: [
          { accountCode: "1-100", debit: 0, credit: 0 },
          { accountCode: "3-100", credit: 1_000 },
        ],
      }),
    ).rejects.toMatchObject({ code: "JOURNAL_NO_SIDE" });
  });

  it("rejects fractional rupiah", async () => {
    await expect(
      post({
        lines: [
          { accountCode: "1-100", debit: 1_000.5 },
          { accountCode: "3-100", credit: 1_000.5 },
        ],
      }),
    ).rejects.toMatchObject({ code: "JOURNAL_NOT_INTEGER" });
  });

  it("requires at least two lines", async () => {
    await expect(
      post({
        lines: [{ accountCode: "1-100", debit: 1_000 }],
      }),
    ).rejects.toMatchObject({ code: "JOURNAL_TOO_FEW_LINES" });
  });

  it("rejects an unknown account", async () => {
    await expect(
      post({
        lines: [
          { accountCode: "1-100", debit: 1_000 },
          { accountCode: "9-999", credit: 1_000 },
        ],
      }),
    ).rejects.toMatchObject({ code: "JOURNAL_ACCOUNT_NOT_FOUND" });
  });

  it("rejects an invalid business date", async () => {
    await expect(post({ date: "2026-02-30" })).rejects.toMatchObject({
      code: "JOURNAL_INVALID_DATE",
    });
  });

  it("rolls the entry back when the surrounding transaction fails", async () => {
    await expect(
      db.$transaction(async (tx) => {
        await postEntry(tx, input());
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    expect(await db.journalEntry.count({ where: { description: { startsWith: marker } } })).toBe(0);
  });
});

describe("reverseEntry", () => {
  it("mirrors the original entry and nets its accounts to zero", async () => {
    const original = await post();

    const reversal = await db.$transaction((tx) => reverseEntry(tx, original.entryId, userId));

    const [originalEntry, reversalEntry] = await Promise.all([
      db.journalEntry.findUniqueOrThrow({
        where: { id: original.entryId },
        include: { lines: true },
      }),
      db.journalEntry.findUniqueOrThrow({
        where: { id: reversal.entryId },
        include: { lines: { include: { account: true } } },
      }),
    ]);

    expect(reversalEntry.reversesEntryId).toBe(original.entryId);
    expect(reversalEntry.refType).toBe(originalEntry.refType);
    expect(reversalEntry.entryDate.toISOString()).toBe(originalEntry.entryDate.toISOString());

    const cash = reversalEntry.lines.find((line) => line.account.code === "1-100");
    const capital = reversalEntry.lines.find((line) => line.account.code === "3-100");
    expect(cash).toMatchObject({ debit: 0, credit: 1_000 });
    expect(capital).toMatchObject({ debit: 1_000, credit: 0 });

    const accountIds = originalEntry.lines.map((line) => line.accountId);
    const sums = await db.journalLine.groupBy({
      by: ["accountId"],
      where: { entryId: { in: [original.entryId, reversal.entryId] }, accountId: { in: accountIds } },
      _sum: { debit: true, credit: true },
    });
    for (const sum of sums) {
      const debit = sum._sum.debit ?? 0;
      const credit = sum._sum.credit ?? 0;
      expect(debit - credit).toBe(0);
    }
  });

  it("rejects a second reversal", async () => {
    const original = await post();
    await db.$transaction((tx) => reverseEntry(tx, original.entryId, userId));

    await expect(
      db.$transaction((tx) => reverseEntry(tx, original.entryId, userId)),
    ).rejects.toMatchObject({ code: "JOURNAL_ALREADY_REVERSED" });
  });

  it("rejects reversing a reversal", async () => {
    const original = await post();
    const reversal = await db.$transaction((tx) => reverseEntry(tx, original.entryId, userId));

    await expect(
      db.$transaction((tx) => reverseEntry(tx, reversal.entryId, userId)),
    ).rejects.toMatchObject({ code: "JOURNAL_ALREADY_REVERSED" });
  });

  it("rejects a missing entry", async () => {
    await expect(
      db.$transaction((tx) => reverseEntry(tx, 2_000_000_000, userId)),
    ).rejects.toBeInstanceOf(JournalError);
  });
});
