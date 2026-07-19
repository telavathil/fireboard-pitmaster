import { describe, it, expect } from "vitest";
import { getSvgPathF, getSvgPathAmbientF } from "./chartPaths";
import { TelemetryPayload } from "../types";

function makePoint(overrides: Partial<TelemetryPayload>): TelemetryPayload {
  return {
    channel: 1,
    core_temp_raw: 0,
    core_temp_filtered: 0,
    heating_rate: 0,
    stall_detected: false,
    eta_seconds: 0,
    confidence: "high",
    timestamp: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getSvgPathF", () => {
  it("returns an empty string for no data points", () => {
    expect(getSvgPathF([], 40, 250)).toBe("");
  });

  it("maps core_temp_filtered (C) to an SVG path scaled into the F range", () => {
    const data = [
      makePoint({ core_temp_filtered: 20 }),
      makePoint({ core_temp_filtered: 30 }),
    ];
    expect(getSvgPathF(data, 40, 250)).toBe("M 0,260 L 800,234.28571428571428");
  });

  it("treats a missing/zero core_temp_filtered as 0C", () => {
    const data = [makePoint({ core_temp_filtered: 0 })];
    // 0C -> 32F, scaled into a 40-250F range: y = 300 - ((32-40)/210)*300
    expect(getSvgPathF(data, 40, 250)).toBe("M 0,311.42857142857144");
  });
});

describe("getSvgPathAmbientF", () => {
  it("returns an empty string for no data points", () => {
    expect(getSvgPathAmbientF([], 40, 250)).toBe("");
  });

  it("maps ambient_temp (C) to an SVG path scaled into the F range", () => {
    const data = [
      makePoint({ ambient_temp: 100 }),
      makePoint({ ambient_temp: 110 }),
    ];
    expect(getSvgPathAmbientF(data, 40, 250)).toBe(
      "M 0,54.285714285714306 L 800,28.571428571428555"
    );
  });

  it("defaults to 110C when ambient_temp is missing", () => {
    const data = [makePoint({ ambient_temp: undefined })];
    // 110C -> 230F, scaled into a 40-250F range: y = 300 - ((230-40)/210)*300
    expect(getSvgPathAmbientF(data, 40, 250)).toBe("M 0,28.571428571428555");
  });
});
