import { z } from "zod";
import { validation } from "@/lib/i18n";
import { MAX_PASSWORD_LENGTH, MAX_USERNAME_LENGTH } from "@/lib/limits";

/**
 * Login only checks that both fields are present. Password strength belongs to
 * user creation; showing those rules on the login form would leak them and
 * confuse an existing user whose password predates the current policy.
 */
export const loginSchema = z.object({
  username: z
    .string({ error: validation.required })
    .trim()
    .toLowerCase()
    .min(1, { error: validation.required })
    .max(MAX_USERNAME_LENGTH, { error: validation.username }),
  password: z
    .string({ error: validation.required })
    .min(1, { error: validation.required })
    .max(MAX_PASSWORD_LENGTH, { error: validation.password }),
});

export type LoginInput = z.infer<typeof loginSchema>;
