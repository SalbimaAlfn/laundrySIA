import { describe, expect, it } from "vitest";
import { validation } from "@/lib/i18n";
import { loginSchema } from "./auth";

describe("loginSchema", () => {
  it("trims and lowercases the username", () => {
    const result = loginSchema.safeParse({ username: "  Manager  ", password: "short" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("manager");
    }
  });

  it("accepts a short password because strength is checked when it is set", () => {
    expect(loginSchema.safeParse({ username: "manager", password: "short" }).success).toBe(true);
  });

  it("requires both fields", () => {
    const result = loginSchema.safeParse({ username: "", password: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(validation.required);
    }
  });
});
