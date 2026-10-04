import { describe, it, expect } from "vitest";
import {
  deriveStage,
  pullTempC,
  toUnit,
  readingAgeSeconds,
  formatAge,
  formatClock,
  etaToClock,
  formatDuration,
  stallStartedAt,
  isStale,
} from "./cookModel";
import { TelemetryPayload } from "../../types";

function reading(overrides: Partial<TelemetryPayload> = {}): TelemetryPayload {
  return {
    channel: 1,
    core_temp_raw: 60,
    core_temp_filtered: 60,
    ambient_temp: 108,
    heating_rate: 0.3,
    stall_detected: false,
    eta_seconds: 7200,
    carryover_rise: 4,
    confidence: "high",
    timestamp: "2026-10-04T12:00:00",
    ...overrides,
  };
}

describe("deriveStage", () => {
  const base = { status: "bare", targetC: 95, carryoverC: 4 };

  it("is rest whenever the session is resting", () => {
    expect(deriveStage({ ...base, status: "resting", telemetry: reading() })).toBe("rest");
  });

  it("is stabilizing with no telemetry yet", () => {
    expect(deriveStage({ ...base, telemetry: null })).toBe("stabilizing");
  });

  it("is pull once the core reaches target minus carryover", () => {
    expect(deriveStage({ ...base, telemetry: reading({ core_temp_filtered: 91 }) })).toBe("pull");
  });

  it("pulls at the target itself when carryover is unknown", () => {
    const telemetry = reading({ core_temp_filtered: 92 });
    expect(deriveStage({ ...base, carryoverC: null, telemetry })).toBe("cooking");
    expect(deriveStage({ ...base, carryoverC: null, telemetry: reading({ core_temp_filtered: 95 }) })).toBe("pull");
  });

  it("is stall when the backend flags a stall", () => {
    expect(deriveStage({ ...base, telemetry: reading({ core_temp_filtered: 70, stall_detected: true }) })).toBe("stall");
  });

  it("is stabilizing when there is no estimate yet", () => {
    expect(deriveStage({ ...base, telemetry: reading({ confidence: "low", eta_seconds: -1 }) })).toBe("stabilizing");
  });

  it("is cooking otherwise", () => {
    expect(deriveStage({ ...base, telemetry: reading() })).toBe("cooking");
  });
});

describe("temperatures", () => {
  it("subtracts carryover from the target, or uses the target when unknown", () => {
    expect(pullTempC(95, 4)).toBe(91);
    expect(pullTempC(95, null)).toBe(95);
  });

  it("converts to whole degrees in the chosen unit", () => {
    expect(toUnit(95, "F")).toBe(203);
    expect(toUnit(95.4, "C")).toBe(95);
  });

  it("converts a temperature difference without the 32 offset", () => {
    expect(toUnit(5, "F", { delta: true })).toBe(9);
  });
});

describe("data age", () => {
  const now = new Date("2026-10-04T12:00:30").getTime();

  it("measures seconds since the reading", () => {
    expect(readingAgeSeconds("2026-10-04T12:00:18", now)).toBe(12);
  });

  it("never reports a negative age for clock skew", () => {
    expect(readingAgeSeconds("2026-10-04T12:01:00", now)).toBe(0);
  });

  it("treats readings older than 60 seconds as stale", () => {
    expect(isStale(60)).toBe(false);
    expect(isStale(61)).toBe(true);
  });

  it("formats age in plain words", () => {
    expect(formatAge(2)).toBe("just now");
    expect(formatAge(12)).toBe("12 s ago");
    expect(formatAge(185)).toBe("3 min ago");
    expect(formatAge(3900)).toBe("1 h 5 min ago");
  });
});

describe("clock and durations", () => {
  it("formats a clock time", () => {
    expect(formatClock(new Date("2026-10-04T18:40:00").getTime())).toBe("6:40 PM");
  });

  it("turns an ETA into a clock time, or null when there is no estimate", () => {
    const now = new Date("2026-10-04T12:00:00").getTime();
    expect(etaToClock(now, 3600)).toBe(now + 3600 * 1000);
    expect(etaToClock(now, -1)).toBeNull();
  });

  it("formats durations in hours and minutes", () => {
    expect(formatDuration(45 * 60)).toBe("45 min");
    expect(formatDuration(2 * 3600 + 15 * 60)).toBe("2 h 15 min");
    expect(formatDuration(3600)).toBe("1 h");
  });
});

describe("stallStartedAt", () => {
  it("returns the start of the current unbroken stall run", () => {
    const history = [
      reading({ timestamp: "2026-10-04T10:00:00", stall_detected: true }),
      reading({ timestamp: "2026-10-04T10:20:00", stall_detected: false }),
      reading({ timestamp: "2026-10-04T11:00:00", stall_detected: true }),
      reading({ timestamp: "2026-10-04T11:20:00", stall_detected: true }),
    ];
    expect(stallStartedAt(history)).toBe(new Date("2026-10-04T11:00:00").getTime());
  });

  it("is null when the latest reading is not stalled", () => {
    expect(stallStartedAt([reading({ stall_detected: true }), reading()])).toBeNull();
  });
});
