import { describe, it, expect } from "vitest";
import { buildTideChart } from "./tideChart";
import { TelemetryPayload } from "../../types";

function at(time: string, coreC: number): TelemetryPayload {
  return {
    channel: 1,
    core_temp_raw: coreC,
    core_temp_filtered: coreC,
    heating_rate: 0.2,
    stall_detected: false,
    eta_seconds: 3600,
    confidence: "high",
    timestamp: `2026-10-04T${time}`,
  };
}

const frame = { width: 400, height: 200, padTop: 10, padBottom: 20 };
const history = [at("08:00:00", 10), at("10:00:00", 50), at("12:00:00", 68)];
const now = new Date("2026-10-04T12:00:00").getTime();
const etaClock = new Date("2026-10-04T18:00:00").getTime();

describe("buildTideChart", () => {
  const chart = buildTideChart({ history, now, etaClock, targetC: 95, pullC: 91, unit: "F" }, frame);

  it("draws the past as a path starting at the left edge", () => {
    expect(chart.past.startsWith("M 0")).toBe(true);
  });

  it("places now between the first reading and the projected target time", () => {
    expect(chart.nowX).toBeGreaterThan(0);
    expect(chart.nowX).toBeLessThan(frame.width);
  });

  it("projects from now to the target without inventing an uncertainty range", () => {
    expect(chart.projection).not.toBeNull();
    expect(chart).not.toHaveProperty("band");
  });

  it("prints a temperature scale in the display unit", () => {
    expect(chart.yTicks.length).toBeGreaterThanOrEqual(2);
    expect(chart.yTicks.every((t) => /^\d+°$/.test(t.label))).toBe(true);
    expect(chart.yTicks.every((t) => t.y >= frame.padTop && t.y <= frame.height - frame.padBottom)).toBe(true);
  });

  it("puts the pull line above the current reading and inside the frame", () => {
    const lastY = Number(chart.past.trim().split(" ").pop()!.split(",")[1]);
    expect(chart.pullY).toBeLessThan(lastY);
    expect(chart.pullY).toBeGreaterThanOrEqual(frame.padTop);
  });

  it("labels at most five clock ticks", () => {
    expect(chart.ticks.length).toBeGreaterThan(1);
    expect(chart.ticks.length).toBeLessThanOrEqual(5);
    expect(chart.ticks[0].label).toMatch(/AM|PM/);
  });

  it("omits the projection when there is no estimate", () => {
    const noEta = buildTideChart({ history, now, etaClock: null, targetC: 95, pullC: 91, unit: "F" }, frame);
    expect(noEta.projection).toBeNull();
  });

  it("returns an empty past path with no readings", () => {
    const empty = buildTideChart({ history: [], now, etaClock: null, targetC: 95, pullC: 91, unit: "F" }, frame);
    expect(empty.past).toBe("");
  });
});
