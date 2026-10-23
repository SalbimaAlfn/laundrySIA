import { z } from "zod";
import { validation } from "@/lib/i18n";
import {
  MAX_ADDRESS_LENGTH,
  MAX_NAME_LENGTH,
  MAX_NOTE_LENGTH,
  MIN_NAME_LENGTH,
} from "@/lib/limits";
import { businessDaySchema, nonNegativeMoneySchema, phoneSchema } from "./common";

export const shopProfileSchema = z.object({
  name: z
    .string({ error: validation.required })
    .trim()
    .min(MIN_NAME_LENGTH, { error: validation.name })
    .max(MAX_NAME_LENGTH, { error: validation.name }),
  address: z.string().trim().max(MAX_ADDRESS_LENGTH, { error: validation.address }),
  phone: phoneSchema,
  receiptFooter: z.string().trim().max(MAX_NOTE_LENGTH, { error: validation.textTooLong }),
  pickupRules: z.string().trim().max(MAX_NOTE_LENGTH, { error: validation.textTooLong }),
});

/**
 * Opening balances are posted once. At least one asset must be non-zero so a
 * blank form cannot create an empty journal entry.
 */
export const openingBalanceSchema = z
  .object({
    date: businessDaySchema,
    cash: nonNegativeMoneySchema,
    bank: nonNegativeMoneySchema,
    equipment: nonNegativeMoneySchema,
  })
  .refine((value) => value.cash + value.bank + value.equipment > 0, {
    error: validation.openingAmount,
    path: ["cash"],
  });

export type ShopProfileInput = z.infer<typeof shopProfileSchema>;
export type OpeningBalanceInput = z.infer<typeof openingBalanceSchema>;
