import { z } from "zod";
import { validation } from "@/lib/i18n";
import { MAX_MONEY, MAX_NAME_LENGTH, MAX_TURNAROUND_DAYS, MIN_NAME_LENGTH } from "@/lib/limits";

export const serviceUnitSchema = z.enum(["KG", "PIECE"], { error: validation.unit });

export const serviceSchema = z.object({
  name: z
    .string({ error: validation.required })
    .trim()
    .min(MIN_NAME_LENGTH, { error: validation.serviceName })
    .max(MAX_NAME_LENGTH, { error: validation.serviceName }),
  unit: serviceUnitSchema,
  price: z
    .number({ error: validation.required })
    .int({ error: validation.number })
    .min(1, { error: validation.price })
    .max(MAX_MONEY, { error: validation.amountTooLarge }),
  turnaroundDays: z
    .number({ error: validation.required })
    .int({ error: validation.number })
    .min(0, { error: validation.turnaround })
    .max(MAX_TURNAROUND_DAYS, { error: validation.turnaround }),
  isActive: z.boolean().default(true),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
