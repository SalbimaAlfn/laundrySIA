import { z } from "zod";
import { validation } from "@/lib/i18n";

export const supplyCreateSchema = z.object({
  name: z
    .string({ error: validation.required })
    .trim()
    .min(2, { error: validation.name })
    .max(80, { error: validation.name }),
  unit: z
    .string({ error: validation.required })
    .trim()
    .min(1, { error: validation.required })
    .max(20, { error: validation.unit }),
  minQty: z
    .number({ error: validation.required })
    .min(0, { error: validation.amountNegative })
    .max(9_999.99, { error: validation.supplyQuantity })
    .default(0),
});

export type SupplyCreateInput = z.infer<typeof supplyCreateSchema>;
