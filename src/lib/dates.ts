export const WIB_TIME_ZONE = "Asia/Jakarta";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The app runs on WIB (UTC+7, no daylight saving). Business dates are the
 * calendar date a Jakarta shop would see on the wall clock, not the UTC date.
 */
export function businessDate(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() + WIB_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses `YYYY-MM-DD` as midnight WIB. */
export function parseBusinessDate(value: string): Date {
  return new Date(`${value}T00:00:00+07:00`);
}

/** First instant of the WIB day that contains `date`. */
export function startOfDayWIB(date: Date): Date {
  return parseBusinessDate(businessDate(date));
}

/** Last instant of the WIB day that contains `date`. */
export function endOfDayWIB(date: Date): Date {
  return new Date(startOfDayWIB(date).getTime() + DAY_MS - 1);
}

/** Adds calendar days to a `YYYY-MM-DD` string without time-zone drift. */
export function addBusinessDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const shifted = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days));
  return shifted.toISOString().slice(0, 10);
}

/** True only for a real calendar date in `YYYY-MM-DD` form. */
export function isBusinessDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

export type DateLocale = "id" | "en";

const formatters: Record<DateLocale, Intl.DateTimeFormat> = {
  id: new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: WIB_TIME_ZONE,
  }),
  en: new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: WIB_TIME_ZONE,
  }),
};

/**
 * Formats a business-date string or a Date in WIB. A `YYYY-MM-DD` string is
 * treated as the Jakarta calendar date itself, which is how Prisma `@db.Date`
 * values are shown in reports.
 */
export function formatDate(value: Date | string, locale: DateLocale = "id"): string {
  const date = typeof value === "string" ? parseBusinessDate(value) : value;
  return formatters[locale].format(date);
}
