import { describe, it, expect } from "vitest";
import { formatEta, formatStopwatch, getMeatLabel } from "./formatters";

describe("formatEta", () => {
  it("formats positive seconds as HH:MM:SS", () => {
    expect(formatEta(3661)).toBe("01:01:01");
  });

  it("returns DONE for exactly zero seconds", () => {
    expect(formatEta(0)).toBe("DONE");
  });

  it("returns CALCULATING for negative seconds", () => {
    expect(formatEta(-5)).toBe("CALCULATING");
  });

  it("returns CALCULATING for null or undefined", () => {
    expect(formatEta(null as unknown as number)).toBe("CALCULATING");
    expect(formatEta(undefined as unknown as number)).toBe("CALCULATING");
  });

  it("pads single-digit hours/minutes/seconds with a leading zero", () => {
    expect(formatEta(5)).toBe("00:00:05");
  });
});

describe("formatStopwatch", () => {
  it("formats seconds as HH:MM:SS", () => {
    expect(formatStopwatch(7325)).toBe("02:02:05");
  });

  it("formats zero as 00:00:00 (no DONE/CALCULATING special-casing)", () => {
    expect(formatStopwatch(0)).toBe("00:00:00");
  });

  it("handles durations over 24 hours by continuing to roll hours forward", () => {
    expect(formatStopwatch(25 * 3600)).toBe("25:00:00");
  });
});

describe("getMeatLabel", () => {
  it("capitalizes the first letter and lowercases the rest", () => {
    expect(getMeatLabel("BEEF")).toBe("Beef");
    expect(getMeatLabel("poultry")).toBe("Poultry");
  });

  it("returns an empty string for falsy input", () => {
    expect(getMeatLabel("")).toBe("");
  });
});
