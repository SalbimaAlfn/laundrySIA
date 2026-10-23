export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 80;
export const MAX_ADDRESS_LENGTH = 200;
export const MAX_NOTE_LENGTH = 200;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 32;
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 72;
export const MAX_TURNAROUND_DAYS = 30;
export const MAX_ORDER_ITEMS = 20;

/** Quantities are integer hundredths. 99_999 = 999,99 kg. */
export const MAX_QUANTITY_HUNDREDTHS = 99_999;

/** Supplies use a wider range: 999_999 = 9.999,99 of a unit. */
export const MAX_SUPPLY_QUANTITY_HUNDREDTHS = 999_999;

/** One billion rupiah is far above any real laundry transaction. */
export const MAX_MONEY = 1_000_000_000;
