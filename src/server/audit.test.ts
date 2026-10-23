import { config } from "dotenv";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { writeAudit } from "./audit";

// The integration test talks to the separate test database, never the dev one.
config({ path: ".env.test", override: true, quiet: true });
const { db } = await import("./db");

const entityType = "AuditHelperTest";

beforeEach(async () => {
  await db.auditLog.deleteMany({ where: { entityType } });
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { entityType } });
  await db.$disconnect();
});

describe("writeAudit", () => {
  it("writes a row inside a transaction", async () => {
    await db.$transaction(async (tx) => {
      await writeAudit(tx, {
        action: "TEST_COMMIT",
        entityType,
        entityId: 42,
        detail: { marker: "commit" },
      });

      const inside = await tx.auditLog.findFirst({
        where: { entityType, action: "TEST_COMMIT" },
      });
      expect(inside?.detail).toEqual({ marker: "commit" });
    });

    const outside = await db.auditLog.findFirst({
      where: { entityType, action: "TEST_COMMIT" },
    });
    expect(outside).not.toBeNull();
    expect(outside?.entityId).toBe(42);
  });

  it("rolls the audit row back when the transaction fails", async () => {
    await expect(
      db.$transaction(async (tx) => {
        await writeAudit(tx, {
          action: "TEST_ROLLBACK",
          entityType,
          entityId: 43,
        });
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    const count = await db.auditLog.count({
      where: { entityType, action: "TEST_ROLLBACK" },
    });
    expect(count).toBe(0);
  });
});
