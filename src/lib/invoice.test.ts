import { describe, expect, it } from "vitest";
import { formatInvoiceNo, nextInvoiceNo } from "./invoice";

describe("formatInvoiceNo", () => {
  it("pads the daily sequence to three digits", () => {
    expect(formatInvoiceNo("2026-10-08", 1)).toBe("INV-20261008-001");
    expect(formatInvoiceNo("2026-10-08", 42)).toBe("INV-20261008-042");
  });

  it("keeps growing beyond three digits", () => {
    expect(formatInvoiceNo("2026-10-08", 1000)).toBe("INV-20261008-1000");
  });
});

describe("nextInvoiceNo", () => {
  it("increments the stored sequence", () => {
    expect(nextInvoiceNo("2026-10-08", 0)).toBe("INV-20261008-001");
    expect(nextInvoiceNo("2026-10-08", 999)).toBe("INV-20261008-1000");
  });
});
