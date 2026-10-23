import { describe, expect, it } from "vitest";
import { isValidPhone, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("converts the +62 prefix to a local 0", () => {
    expect(normalizePhone("+62 812-3456-7890")).toBe("081234567890");
    expect(normalizePhone("+6281234567890")).toBe("081234567890");
  });

  it("converts a 62 prefix to a local 0", () => {
    expect(normalizePhone("62 812 3456 7890")).toBe("081234567890");
    expect(normalizePhone("6281234567890")).toBe("081234567890");
  });

  it("removes spaces, dashes, dots, and brackets", () => {
    expect(normalizePhone("0812 3456 7890")).toBe("081234567890");
    expect(normalizePhone("(021) 555-1234")).toBe("0215551234");
    expect(normalizePhone("0812.3456.7890")).toBe("081234567890");
  });

  it("leaves letters in place so validation fails instead of merging digits", () => {
    expect(normalizePhone("08abc12")).toBe("08abc12");
  });
});

describe("isValidPhone", () => {
  it("accepts 9 to 14 digits starting with 0", () => {
    expect(isValidPhone("081234567")).toBe(true);
    expect(isValidPhone("081234567890")).toBe(true);
    expect(isValidPhone("08123456789012")).toBe(true);
    expect(isValidPhone("081234567890123")).toBe(false);
  });

  it("rejects numbers without a local prefix", () => {
    expect(isValidPhone("123456789")).toBe(false);
    expect(isValidPhone("+6281234567890")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});
