import { z } from "zod";
import { isBusinessDate } from "@/lib/dates";
import { validation } from "@/lib/i18n";
import {
  MAX_MONEY,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_QUANTITY_HUNDREDTHS,
  MAX_SUPPLY_QUANTITY_HUNDREDTHS,
  MIN_NAME_LENGTH,
} from "@/lib/limits";
import { isValidPhone, normalizePhone } from "@/lib/phone";

export const idSchema = z
  .number({ error: validation.required })
  .int({ error: validation.number })
  .positive({ error: validation.id });

export const personNameSchema = z
  .string({ error: validation.required })
  .trim()
  .min(MIN_NAME_LENGTH, { error: validation.name })
  .max(MAX_NAME_LENGTH, { error: validation.name });

export const phoneSchema = z
  .string({ error: validation.required })
  .trim()
  .min(1, { error: validation.required })
  .transform(normalizePhone)
  .refine(isValidPhone, { error: validation.phone });

export const businessDaySchema = z
  .string({ error: validation.date })
  .refine(isBusinessDate, { error: validation.date });

export const optionalNoteSchema = z
  .string()
  .trim()
  .max(MAX_NOTE_LENGTH, { error: validation.note })
  .optional()
  .transform((value) => value || undefined);

export const positiveMoneySchema = z
  .number({ error: validation.required })
  .int({ error: validation.number })
  .min(1, { error: validation.amount })
  .max(MAX_MONEY, { error: validation.amountTooLarge });

export const nonNegativeMoneySchema = z
  .number({ error: validation.required })
  .int({ error: validation.number })
  .min(0, { error: validation.amountNegative })
  .max(MAX_MONEY, { error: validation.amountTooLarge });

export const totalCostSchema = z
  .number({ error: validation.required })
  .int({ error: validation.number })
  .min(1, { error: validation.totalCost })
  .max(MAX_MONEY, { error: validation.amountTooLarge });

export const quantityHundredthsSchema = z
  .number({ error: validation.required })
  .int({ error: validation.number })
  .min(1, { error: validation.quantity })
  .max(MAX_QUANTITY_HUNDREDTHS, { error: validation.quantity });

export const supplyQuantityHundredthsSchema = z
  .number({ error: validation.required })
  .int({ error: validation.number })
  .min(1, { error: validation.supplyQuantity })
  .max(MAX_SUPPLY_QUANTITY_HUNDREDTHS, { error: validation.supplyQuantity });

export const paymentMethodSchema = z.enum(["CASH", "TRANSFER", "EWALLET"], {
  error: validation.paymentMethod,
});

export const paymentTypeSchema = z.enum(["FULL", "DEPOSIT", "LATER"], {
  error: validation.paymentType,
});

export const paymentSourceSchema = z.enum(["CASH", "BANK"], {
  error: validation.paidFrom,
});
