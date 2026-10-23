import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cookieStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  };

  return {
    cookieStore,
    findUnique: vi.fn(),
    redirect: vi.fn((url: string) => {
      throw new Error(`redirect:${url}`);
    }),
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => mocks.cookieStore,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/db", () => ({
  db: {
    user: {
      findUnique: mocks.findUnique,
    },
  },
}));

import { getSession, requireRole, requireUser } from "./auth";
import { createSessionToken, type SessionRole } from "./session";

const manager = {
  id: 1,
  name: "Manajer",
  username: "manager",
  role: "MANAGER" as const,
  isActive: true,
};

const cashier = {
  id: 2,
  name: "Kasir",
  username: "cashier",
  role: "CASHIER" as const,
  isActive: true,
};

async function signInAs(user: { id: number; role: SessionRole }): Promise<void> {
  mocks.cookieStore.get.mockReturnValue({
    name: "laundrysia_session",
    value: await createSessionToken(user),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SESSION_SECRET = "test-only-secret-that-is-long-enough-for-hs256";
  mocks.cookieStore.get.mockReturnValue(undefined);
  mocks.findUnique.mockResolvedValue(null);
});

describe("getSession", () => {
  it("returns null without a session cookie", async () => {
    await expect(getSession()).resolves.toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("returns null for a tampered token", async () => {
    mocks.cookieStore.get.mockReturnValue({ name: "laundrysia_session", value: "not-a-token" });

    await expect(getSession()).resolves.toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a deactivated user even when the token is valid", async () => {
    await signInAs(manager);
    mocks.findUnique.mockResolvedValue({ ...manager, isActive: false });

    await expect(getSession()).resolves.toBeNull();
  });

  it("returns the active user with the role from the database", async () => {
    await signInAs(manager);
    mocks.findUnique.mockResolvedValue(manager);

    await expect(getSession()).resolves.toEqual({
      id: manager.id,
      name: manager.name,
      username: manager.username,
      role: manager.role,
    });
  });
});

describe("requireUser", () => {
  it("redirects to login without a session", async () => {
    await expect(requireUser()).rejects.toThrow("redirect:/login");
  });
});

describe("requireRole", () => {
  it("allows a user with the required role", async () => {
    await signInAs(manager);
    mocks.findUnique.mockResolvedValue(manager);

    await expect(requireRole("MANAGER")).resolves.toMatchObject({
      id: manager.id,
      role: "MANAGER",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("denies a cashier and sends them back to the counter", async () => {
    await signInAs(cashier);
    mocks.findUnique.mockResolvedValue(cashier);

    await expect(requireRole("MANAGER")).rejects.toThrow("redirect:/counter?notice=manager-only");
  });
});
