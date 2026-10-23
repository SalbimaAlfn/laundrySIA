import { hash } from "bcryptjs";
import { config } from "dotenv";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "@/lib/i18n";

const mocks = vi.hoisted(() => ({
  cookieStore: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => mocks.cookieStore,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

// Load the test database before any module that opens a connection.
config({ path: ".env.test", override: true, quiet: true });
const { db } = await import("@/server/db");
const { loginAction } = await import("./auth");
const { SESSION_COOKIE, verifySessionToken } = await import("@/server/session");

const t = getDictionary();
const suffix = Date.now().toString(36).slice(-6);
const activeUsername = `lt_act_${suffix}`;
const inactiveUsername = `lt_inact_${suffix}`;
const password = "Test-Password1";

let activeUserId: number;
let inactiveUserId: number;

function credentials(username: string, candidatePassword: string): FormData {
  const data = new FormData();
  data.set("username", username);
  data.set("password", candidatePassword);
  return data;
}

beforeAll(async () => {
  const passwordHash = await hash(password, 4);

  const active = await db.user.create({
    data: {
      name: "Login Test Active",
      username: activeUsername,
      passwordHash,
      role: "MANAGER",
    },
  });
  activeUserId = active.id;

  const inactive = await db.user.create({
    data: {
      name: "Login Test Inactive",
      username: inactiveUsername,
      passwordHash,
      role: "CASHIER",
      isActive: false,
    },
  });
  inactiveUserId = inactive.id;
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookieStore.get.mockReturnValue(undefined);
});

afterAll(async () => {
  const userIds = [activeUserId, inactiveUserId].filter(
    (id): id is number => typeof id === "number",
  );
  if (userIds.length > 0) {
    await db.auditLog.deleteMany({ where: { entityType: "User", entityId: { in: userIds } } });
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  await db.$disconnect();
});

describe("loginAction", () => {
  it("sets a session cookie, writes an audit row, and redirects a manager home", async () => {
    await expect(loginAction({}, credentials(activeUsername, password))).rejects.toThrow(
      "redirect:/dashboard",
    );

    const cookieCall = mocks.cookieStore.set.mock.calls[0];
    expect(cookieCall?.[0]).toBe(SESSION_COOKIE);
    expect(cookieCall?.[2]).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    const token = cookieCall?.[1];
    expect(typeof token).toBe("string");
    await expect(verifySessionToken(token as string)).resolves.toEqual({
      userId: activeUserId,
      role: "MANAGER",
    });

    const audit = await db.auditLog.findFirst({
      where: { userId: activeUserId, action: "LOGIN" },
      orderBy: { id: "desc" },
    });
    expect(audit?.detail).toMatchObject({ reason: "success" });
  });

  it("rejects a wrong password with the generic message and audits the attempt", async () => {
    const state = await loginAction({}, credentials(activeUsername, "wrong-password"));

    expect(state.passwordError).toBe(t.auth.invalidCredentials);
    expect(mocks.cookieStore.set).not.toHaveBeenCalled();

    const audit = await db.auditLog.findFirst({
      where: { userId: activeUserId, action: "LOGIN_FAILED" },
      orderBy: { id: "desc" },
    });
    expect(audit?.detail).toMatchObject({ reason: "invalid_password" });
  });

  it("does not log in a deactivated user even with the correct password", async () => {
    const state = await loginAction({}, credentials(inactiveUsername, password));

    expect(state.passwordError).toBe(t.auth.inactiveAccount);
    expect(mocks.cookieStore.set).not.toHaveBeenCalled();

    const audit = await db.auditLog.findFirst({
      where: { userId: inactiveUserId, action: "LOGIN_FAILED" },
      orderBy: { id: "desc" },
    });
    expect(audit?.detail).toMatchObject({ reason: "inactive" });
  });
});
