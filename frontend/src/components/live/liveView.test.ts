import { describe, it, expect } from "vitest";
import { buildReadout, buildTableRows, buildFreshness } from "./liveView";
import { TelemetryPayload } from "../../types";

const now = new Date("2026-10-04T12:30:12").getTime();

function reading(overrides: Partial<TelemetryPayload> = {}): TelemetryPayload {
  return {
    channel: 1,
    core_temp_raw: 75.6,
    core_temp_filtered: 75.6,
    ambient_temp: 107.8,
    heating_rate: 0.25,
    stall_detected: false,
    eta_seconds: 3 * 3600,
    carryover_rise: 4.4,
    confidence: "high",
    timestamp: "2026-10-04T12:30:00",
    ...overrides,
  };
}

const base = {
  stage: "cooking" as const,
  targetC: 95,
  telemetry: reading(),
  history: [reading()],
  now,
  unit: "F" as const,
  carryoverC: 4.4,
  restStartedAt: null,
  peakRestTempC: null,
  connected: true,
};

describe("buildReadout", () => {
  it("shows core against the pull temperature while cooking", () => {
    const r = buildReadout(base);
    expect(r.figure).toBe("168°");
    expect(r.target).toBe("→ 195° pull");
    expect(r.note).toBe("27° to go · updated 12 s ago");
    expect(r.dimmed).toBe(false);
  });

  it("shows a placeholder, never a number, with no readings", () => {
    const r = buildReadout({ ...base, telemetry: null, history: [] });
    expect(r.figure).toBe("--°");
  });

  it("dims the figure and says why when the reading is stale", () => {
    const r = buildReadout({ ...base, now: now + 5 * 60_000 });
    expect(r.dimmed).toBe(true);
    expect(r.note).toBe("Last reading 5 min ago");
  });

  it("says it is reconnecting when the connection drops", () => {
    const r = buildReadout({ ...base, connected: false });
    expect(r.dimmed).toBe(true);
    expect(r.note).toBe("Reconnecting. Showing the last reading.");
  });

  it("explains the learning stage instead of inventing an estimate", () => {
    expect(buildReadout({ ...base, stage: "stabilizing" }).note).toMatch(/first estimate/i);
  });

  it("shows rest elapsed and the peak during the rest", () => {
    const r = buildReadout({ ...base, stage: "rest", restStartedAt: now - 24 * 60_000, peakRestTempC: 95.2 });
    expect(r.target).toBe("→ 203° target");
    expect(r.note).toBe("Resting 24 min · peak 203°");
  });
});

describe("buildTableRows", () => {
  it("lists when the target is reached and the pull trigger while cooking", () => {
    const rows = buildTableRows(base);
    expect(rows.map((r) => r.label)).toEqual(["Reaches 203°", "Pull alarm"]);
    expect(rows[0].value).toBe("3:30 PM");
    expect(rows[0].note).toBe("in 3 h");
    expect(rows[1].value).toBe("195°");
  });

  it("names the stall zone before the stall", () => {
    const rows = buildTableRows({ ...base, telemetry: reading({ core_temp_filtered: 50 }) });
    expect(rows[0]).toMatchObject({ label: "Stall zone", value: "149–167°" });
  });

  it("says when the stall started during the stall", () => {
    const history = [
      reading({ timestamp: "2026-10-04T11:02:00", stall_detected: true }),
      reading({ timestamp: "2026-10-04T12:30:00", stall_detected: true }),
    ];
    const rows = buildTableRows({ ...base, stage: "stall", history, telemetry: history[1] });
    expect(rows[0]).toMatchObject({ label: "In the stall since", value: "11:02 AM" });
  });

  it("says the estimate is still coming when there is none", () => {
    const telemetry = reading({ eta_seconds: -1, confidence: "low" });
    const rows = buildTableRows({ ...base, stage: "stabilizing", telemetry });
    expect(rows[0]).toMatchObject({ label: "Reaches 203°", value: "Estimating" });
  });

  it("summarises the rest", () => {
    const rows = buildTableRows({
      ...base,
      stage: "rest",
      restStartedAt: new Date("2026-10-04T12:06:00").getTime(),
      peakRestTempC: 95.2,
    });
    expect(rows.map((r) => [r.label, r.value])).toEqual([
      ["Pulled at", "12:06 PM"],
      ["Peak so far", "203°"],
    ]);
  });
});

describe("stale data in the table", () => {
  it("pauses the forecast time instead of printing it as live", () => {
    const rows = buildTableRows({ ...base, now: now + 3 * 60_000 });
    expect(rows.find((r) => r.label === "Reaches 203°")).toMatchObject({ value: "Paused", note: "resumes with the next reading" });
  });

  it("pauses it when the connection drops", () => {
    const rows = buildTableRows({ ...base, connected: false });
    expect(rows.find((r) => r.label === "Reaches 203°")?.value).toBe("Paused");
  });
});

describe("buildFreshness", () => {
  it("reports the age of the last reading", () => {
    expect(buildFreshness(base)).toEqual({ ageLabel: "Updated 12 s ago", problem: null });
  });

  it("flags stale data in words", () => {
    const f = buildFreshness({ ...base, now: now + 3 * 60_000 });
    expect(f.problem).toBe("No new reading for 3 min. Check the FireBoard and Wi-Fi.");
  });

  it("flags a dropped connection", () => {
    expect(buildFreshness({ ...base, connected: false }).problem).toMatch(/connection lost/i);
  });
});
