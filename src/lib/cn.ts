export type ClassValue = string | false | null | undefined;

/**
 * Joins class names and drops empty values. Keeps JSX readable when a class
 * is conditional.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
