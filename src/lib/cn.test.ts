import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins class names in order", () => {
    expect(cn("button", "primary")).toBe("button primary");
  });

  it("drops false, null, and undefined values", () => {
    expect(cn("button", false, null, undefined, "large")).toBe("button large");
  });

  it("returns an empty string when there is nothing to join", () => {
    expect(cn()).toBe("");
  });
});
