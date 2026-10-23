import { z } from "zod";
import { validation } from "@/lib/i18n";
import {
  MAX_PASSWORD_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  MIN_USERNAME_LENGTH,
} from "@/lib/limits";
import { personNameSchema } from "./common";

const usernameSchema = z
  .string({ error: validation.required })
  .trim()
  .toLowerCase()
  .min(MIN_USERNAME_LENGTH, { error: validation.username })
  .max(MAX_USERNAME_LENGTH, { error: validation.username })
  .regex(/^[a-z0-9._-]+$/, { error: validation.username });

const passwordSchema = z
  .string({ error: validation.required })
  .min(MIN_PASSWORD_LENGTH, { error: validation.password })
  .max(MAX_PASSWORD_LENGTH, { error: validation.password })
  .regex(/[a-z]/i, { error: validation.password })
  .regex(/\d/, { error: validation.password });

const roleSchema = z.enum(["CASHIER", "MANAGER"], { error: validation.role });

const baseShape = {
  name: personNameSchema,
  username: usernameSchema,
  role: roleSchema,
  isActive: z.boolean().default(true),
};

export const userCreateSchema = z.object({
  ...baseShape,
  password: passwordSchema,
});

/** Password is optional on edit: an empty field means "keep the current one". */
export const userUpdateSchema = z.object({
  ...baseShape,
  password: passwordSchema.optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
