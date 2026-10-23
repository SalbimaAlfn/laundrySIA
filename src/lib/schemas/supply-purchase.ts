import { z } from "zod";
import {
  businessDaySchema,
  idSchema,
  optionalNoteSchema,
  paymentSourceSchema,
  supplyQuantityHundredthsSchema,
  totalCostSchema,
} from "./common";

export const supplyPurchaseSchema = z.object({
  supplyId: idSchema,
  quantityHundredths: supplyQuantityHundredthsSchema,
  totalCost: totalCostSchema,
  paidFrom: paymentSourceSchema,
  date: businessDaySchema,
  note: optionalNoteSchema,
});

export type SupplyPurchaseInput = z.infer<typeof supplyPurchaseSchema>;
