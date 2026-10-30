import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), findMany: vi.fn() }));

vi.mock("@/server/auth", () => ({ getSession: mocks.getSession }));
vi.mock("@/server/db", () => ({ db: { customer: { findMany: mocks.findMany } } }));

import { GET } from "./route";

describe("customer search route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ id: 1 });
    mocks.findMany.mockResolvedValue([]);
  });

  it("searches names and normalized partial phone numbers among active customers", async () => {
    await GET(new Request("http://localhost/api/customers/search?q=%2B62%20812%2034"));

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        OR: [{ name: { contains: "+62 812 34" } }, { phone: { contains: "081234" } }],
      },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
      take: 8,
    });
  });

  it("does not query when unauthenticated", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/customers/search?q=Budi"));

    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
