import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  type SessionRole,
  verifySessionToken,
} from "@/server/session";

export type SessionUser = {
  id: number;
  name: string;
  username: string;
  role: SessionRole;
};

export function homeForRole(role: SessionRole): "/dashboard" | "/counter" {
  return role === "MANAGER" ? "/dashboard" : "/counter";
}

/**
 * Reads the signed cookie and then checks the database. The database check is
 * deliberate: a deactivated user must lose access even though their token is
 * still valid.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      isActive: true,
    },
  });

  if (!user?.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Every manager page and action calls this itself. Proxy only performs the
 * cheap anonymous-user redirect and is never the sole authorization check.
 */
export async function requireRole(role: SessionRole): Promise<SessionUser> {
  const session = await requireUser();
  if (session.role !== role) {
    redirect("/counter?notice=manager-only");
  }
  return session;
}

export async function setSessionCookie(user: { id: number; role: SessionRole }): Promise<void> {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
