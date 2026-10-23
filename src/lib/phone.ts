/**
 * Normalizes Indonesian phone numbers to digits only, with the local `0`
 * prefix. `+62 812-3456-7890` and `62 812 3456 7890` both become
 * `081234567890`, so the unique index treats them as the same customer.
 */
export function normalizePhone(input: string): string {
  // Reject letters instead of silently gluing digits together.
  if (/[^\d+\s\-().]/.test(input)) return input.trim();

  const compact = input.trim().replace(/[\s\-().]/g, "");

  if (compact.startsWith("+62")) {
    return `0${compact.slice(3).replace(/\D/g, "")}`;
  }

  if (compact.startsWith("62") && compact.length >= 11) {
    return `0${compact.slice(2).replace(/\D/g, "")}`;
  }

  return compact.replace(/\D/g, "");
}

/** A valid local number is 9 to 14 digits and starts with 0. */
export function isValidPhone(phone: string): boolean {
  return /^0\d{8,13}$/.test(phone);
}
