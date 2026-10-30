import { z } from "zod";
import { validation } from "@/lib/i18n";
import { MAX_MONEY, MAX_ORDER_ITEMS } from "@/lib/limits";
import {
  businessDaySchema,
  idSchema,
  optionalNoteSchema,
  paymentMethodSchema,
  paymentTypeSchema,
  positiveMoneySchema,
  quantityHundredthsSchema,
} from "./common";

export const orderItemSchema = z.object({
  serviceId: idSchema,
  quantityHundredths: quantityHundredthsSchema,
});

/**
 * The client sends service ids and quantities. Prices and totals are always
 * recomputed on the server from the services table, never trusted from input.
 */
export const orderSchema = z
  .object({
    customerId: idSchema,
    items: z
      .array(orderItemSchema, { error: validation.items })
      .min(1, { error: validation.items })
      .max(MAX_ORDER_ITEMS, { error: validation.items }),
    discount: z
      .number({ error: validation.required })
      .int({ error: validation.number })
      .min(0, { error: validation.discount })
      .max(MAX_MONEY, { error: validation.amountTooLarge })
      .default(0),
    note: optionalNoteSchema,
    pickupDate: businessDaySchema,
    paymentType: paymentTypeSchema,
    paymentAmount: positiveMoneySchema.optional(),
    paymentMethod: paymentMethodSchema.default("CASH"),
  })
  .superRefine((value, ctx) => {
    if (value.paymentType === "DEPOSIT" && value.paymentAmount === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["paymentAmount"],
        message: validation.depositAmount,
      });
    }

    if (value.paymentType === "LATER" && value.paymentAmount !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["paymentAmount"],
        message: validation.laterPayment,
      });
    }
  });

export type OrderInput = z.infer<typeof orderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
