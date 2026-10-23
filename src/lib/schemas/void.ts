import { z } from "zod";
import { validation } from "@/lib/i18n";
import { MAX_NOTE_LENGTH } from "@/lib/limits";
import { idSchema } from "./common";

export const voidOrderSchema = z.object({
  orderId: idSchema,
  reason: z
    .string({ error: validation.required })
    .trim()
    .min(5, { error: validation.voidReason })
    .max(MAX_NOTE_LENGTH, { error: validation.voidReason }),
});

export type VoidOrderInput = z.infer<typeof voidOrderSchema>;
