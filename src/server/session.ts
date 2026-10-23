import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "laundrysia_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const SESSION_ISSUER = "laundrysia";
const SESSION_AUDIENCE = "laundrysia-app";

export type SessionRole = "CASHIER" | "MANAGER";

export type SessionPayload = {
  userId: number;
  role: SessionRole;
};

export type TokenUser = {
  id: number;
  role: SessionRole;
};

function sessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

function isSessionRole(value: unknown): value is SessionRole {
  return value === "CASHIER" || value === "MANAGER";
}

/**
 * The token carries only the user id and role. Names and usernames are always
 * read from the database so a renamed or deactivated user is reflected on the
 * next request.
 */
export async function createSessionToken(user: TokenUser): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(sessionSecret());
}

/** Verifies signature, issuer, audience, expiry, and payload shape. */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0 || !isSessionRole(payload.role)) {
      return null;
    }

    return { userId, role: payload.role };
  } catch {
    return null;
  }
}
