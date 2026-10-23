const rupiahNumber = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/** Formats an integer rupiah amount as `Rp 40.000`. */
export function formatRupiah(value: number): string {
  return `Rp ${rupiahNumber.format(value)}`;
}

/** Formats a number with Indonesian thousands separators, without the currency. */
export function formatNumberID(value: number): string {
  return rupiahNumber.format(value);
}

/** Reads digits from free text. Returns 0 when there is no number. */
export function parseRupiah(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

/** Like parseRupiah, but keeps "no value" distinct from zero. */
export function parseRupiahOrNull(text: string): number | null {
  const digits = text.replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

/**
 * Quantity input is a decimal with at most two places. Internally we keep
 * hundredths so money math never touches floating point.
 * Accepts `3`, `3,5`, or `3.55`; rejects more than two decimals.
 */
export function toHundredths(text: string): number | null {
  const match = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(text.trim());
  if (!match) return null;

  const whole = Number(match[1] ?? 0);
  const fraction = (match[2] ?? "").padEnd(2, "0");
  return whole * 100 + Number(fraction);
}

/** Displays hundredths as `3,5` or `3,05` using Indonesian decimal comma. */
export function formatQuantity(quantityHundredths: number): string {
  const whole = Math.trunc(quantityHundredths / 100);
  const fraction = Math.abs(quantityHundredths % 100);

  if (fraction === 0) return String(whole);

  const decimals = String(fraction).padStart(2, "0").replace(/0$/, "");
  return `${whole},${decimals}`;
}

/**
 * Unit price is integer rupiah; quantity is integer hundredths.
 * Rounds half up to the nearest rupiah.
 */
export function lineTotal(unitPrice: number, quantityHundredths: number): number {
  return Math.round((unitPrice * quantityHundredths) / 100);
}

export function sumRupiah(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
