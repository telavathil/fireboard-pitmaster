import { describe, it, expect } from "vitest";
import { getMeatLabel } from "./formatters";

describe("getMeatLabel", () => {
  it("capitalizes the first letter and lowercases the rest", () => {
    expect(getMeatLabel("BEEF")).toBe("Beef");
    expect(getMeatLabel("poultry")).toBe("Poultry");
  });

  it("returns an empty string for falsy input", () => {
    expect(getMeatLabel("")).toBe("");
  });
});
