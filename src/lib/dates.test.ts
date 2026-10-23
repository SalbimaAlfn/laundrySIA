import { describe, expect, it } from "vitest";
import {
  addBusinessDays,
  businessDate,
  endOfDayWIB,
  formatDate,
  isBusinessDate,
  parseBusinessDate,
  startOfDayWIB,
} from "./dates";

describe("businessDate", () => {
  it("uses the WIB calendar day, not the UTC day", () => {
    expect(businessDate(new Date("2026-10-07T16:59:59.999Z"))).toBe("2026-10-07");
    expect(businessDate(new Date("2026-10-07T17:00:00.000Z"))).toBe("2026-10-08");
    expect(businessDate(new Date("2026-10-08T16:59:59.999Z"))).toBe("2026-10-08");
  });
});

describe("day boundaries", () => {
  it("turns a WIB day into the correct UTC instants", () => {
    const midday = new Date("2026-10-08T10:00:00.000Z");

    expect(parseBusinessDate("2026-10-08").toISOString()).toBe("2026-10-07T17:00:00.000Z");
    expect(startOfDayWIB(midday).toISOString()).toBe("2026-10-07T17:00:00.000Z");
    expect(endOfDayWIB(midday).toISOString()).toBe("2026-10-08T16:59:59.999Z");
  });
});

describe("addBusinessDays", () => {
  it("moves across month and year boundaries", () => {
    expect(addBusinessDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addBusinessDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addBusinessDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("isBusinessDate", () => {
  it("rejects impossible dates", () => {
    expect(isBusinessDate("2026-10-08")).toBe(true);
    expect(isBusinessDate("2024-02-29")).toBe(true);
    expect(isBusinessDate("2026-02-29")).toBe(false);
    expect(isBusinessDate("2026-13-01")).toBe(false);
    expect(isBusinessDate("08-10-2026")).toBe(false);
  });
});

describe("formatDate", () => {
  it("formats a business date in Indonesian and English", () => {
    expect(formatDate("2026-10-08", "id")).toBe("8 Okt 2026");
    expect(formatDate("2026-10-08", "en")).toBe("8 Oct 2026");
  });

  it("formats a UTC timestamp by its WIB date", () => {
    expect(formatDate(new Date("2026-10-07T17:30:00.000Z"), "id")).toBe("8 Okt 2026");
    expect(formatDate(new Date("2026-10-08T16:59:59.999Z"), "id")).toBe("8 Okt 2026");
  });
});
