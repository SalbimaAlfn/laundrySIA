import { describe, expect, it } from "vitest";
import {
  formatNumberID,
  formatQuantity,
  formatRupiah,
  lineTotal,
  parseRupiah,
  parseRupiahOrNull,
  sumRupiah,
  toHundredths,
} from "./money";

describe("formatRupiah", () => {
  it("uses Indonesian thousands separators", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(40000)).toBe("Rp 40.000");
    expect(formatRupiah(1234567)).toBe("Rp 1.234.567");
  });

  it("formats plain numbers without the currency", () => {
    expect(formatNumberID(1500)).toBe("1.500");
  });
});

describe("parseRupiah", () => {
  it("reads digits from formatted input", () => {
    expect(parseRupiah("Rp 40.000")).toBe(40000);
    expect(parseRupiah("12.500")).toBe(12500);
    expect(parseRupiah("")).toBe(0);
  });

  it("can keep an empty input distinct from zero", () => {
    expect(parseRupiahOrNull("")).toBeNull();
    expect(parseRupiahOrNull("0")).toBe(0);
  });
});

describe("toHundredths", () => {
  it("accepts whole numbers and one or two decimals", () => {
    expect(toHundredths("3")).toBe(300);
    expect(toHundredths("3,5")).toBe(350);
    expect(toHundredths("3.55")).toBe(355);
    expect(toHundredths("0,05")).toBe(5);
  });

  it("rejects more than two decimals or too many whole digits", () => {
    expect(toHundredths("3,555")).toBeNull();
    expect(toHundredths("1000")).toBeNull();
    expect(toHundredths("")).toBeNull();
    expect(toHundredths("3,")).toBeNull();
    expect(toHundredths("-1")).toBeNull();
  });
});

describe("formatQuantity", () => {
  it("drops trailing zeros but keeps two-place precision", () => {
    expect(formatQuantity(300)).toBe("3");
    expect(formatQuantity(350)).toBe("3,5");
    expect(formatQuantity(305)).toBe("3,05");
    expect(formatQuantity(5)).toBe("0,05");
    expect(formatQuantity(99999)).toBe("999,99");
  });
});

describe("lineTotal", () => {
  it("multiplies integer rupiah by hundredths", () => {
    expect(lineTotal(8000, 550)).toBe(44000);
    expect(lineTotal(7000, 333)).toBe(23310);
    expect(lineTotal(7000, 5)).toBe(350);
  });

  it("rounds half up to the nearest rupiah", () => {
    expect(lineTotal(1234, 333)).toBe(4109);
    expect(lineTotal(1, 50)).toBe(1);
    expect(lineTotal(1, 49)).toBe(0);
  });
});

describe("sumRupiah", () => {
  it("adds integer amounts", () => {
    expect(sumRupiah([40000, 36000, 70000])).toBe(146000);
    expect(sumRupiah([])).toBe(0);
  });
});
