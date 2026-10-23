import { z } from "zod";
import { validation } from "@/lib/i18n";
import { MAX_ADDRESS_LENGTH } from "@/lib/limits";
import { personNameSchema, phoneSchema } from "./common";

export const customerSchema = z.object({
  name: personNameSchema,
  phone: phoneSchema,
  address: z
    .string()
    .trim()
    .max(MAX_ADDRESS_LENGTH, { error: validation.address })
    .optional()
    .transform((value) => value || undefined),
});

export type CustomerInput = z.infer<typeof customerSchema>;
