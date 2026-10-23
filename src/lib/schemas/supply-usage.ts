import { z } from "zod";
import {
  businessDaySchema,
  idSchema,
  optionalNoteSchema,
  supplyQuantityHundredthsSchema,
} from "./common";

export const supplyUsageSchema = z.object({
  supplyId: idSchema,
  quantityHundredths: supplyQuantityHundredthsSchema,
  date: businessDaySchema,
  note: optionalNoteSchema,
});

export type SupplyUsageInput = z.infer<typeof supplyUsageSchema>;
