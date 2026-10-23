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
