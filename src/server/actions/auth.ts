"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { loginSchema } from "@/lib/schemas";
import { writeAudit } from "@/server/audit";
import { clearSessionCookie, homeForRole, setSessionCookie } from "@/server/auth";
import { db } from "@/server/db";

export type LoginState = {
  usernameError?: string;
  passwordError?: string;
  formError?: string;
};

type LoginAuditReason = "success" | "inactive" | "invalid_password" | "unknown_user";

async function recordLoginAudit(
  userId: number | null,
  action: "LOGIN" | "LOGIN_FAILED",
  detail: { username: string; reason: LoginAuditReason },
): Promise<void> {
  try {
    await db.$transaction((tx) =>
      writeAudit(tx, {
        userId,
        action,
        entityType: "User",
        entityId: userId,
        detail,
      }),
    );
  } catch (error) {
    // A failed audit write must not lock a valid user out of the app.
    console.error("Failed to write login audit log", error);
  }
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const t = getDictionary();
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      usernameError: fieldErrors.username?.[0],
      passwordError: fieldErrors.password?.[0],
    };
  }

  let user: {
    id: number;
    passwordHash: string;
    role: "CASHIER" | "MANAGER";
    isActive: boolean;
  } | null;

  try {
    user = await db.user.findUnique({
      where: { username: parsed.data.username },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });
  } catch {
    return { formError: t.auth.unavailable };
  }

  if (!user) {
    await recordLoginAudit(null, "LOGIN_FAILED", {
      username: parsed.data.username,
      reason: "unknown_user",
    });
    return { passwordError: t.auth.invalidCredentials };
  }

  if (!user.isActive) {
    await recordLoginAudit(user.id, "LOGIN_FAILED", {
      username: parsed.data.username,
      reason: "inactive",
    });
    return { passwordError: t.auth.inactiveAccount };
  }

  let passwordMatches = false;
  try {
    passwordMatches = await compare(parsed.data.password, user.passwordHash);
  } catch {
    return { formError: t.auth.unavailable };
  }

  if (!passwordMatches) {
    await recordLoginAudit(user.id, "LOGIN_FAILED", {
      username: parsed.data.username,
      reason: "invalid_password",
    });
    return { passwordError: t.auth.invalidCredentials };
  }

  await recordLoginAudit(user.id, "LOGIN", {
    username: parsed.data.username,
    reason: "success",
  });
  await setSessionCookie({ id: user.id, role: user.role });
  redirect(homeForRole(user.role));
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login?notice=loggedOut");
}
