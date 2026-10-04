import { describe, it, expect } from "vitest";
import { parseHistory, summarizeCook, HistoryEntry } from "./historyModel";

const entry: HistoryEntry = {
  id: "c1",
  device_name: "Backyard",
  meat_type: "beef",
  cut_type: "Brisket flat",
  cooker_type: "kamado",
  weight_kg: 5.4,
  thickness_mm: 75,
  target_temp_c: 95,
  started_at: "2026-10-03T10:00:00Z",
  ended_at: "2026-10-03T22:05:00Z",
  peak_core_c: 95.3,
  reading_count: 2180,
};

describe("parseHistory", () => {
  it("accepts well-formed entries", () => {
    expect(parseHistory([entry])).toEqual([entry]);
  });

  it("drops malformed entries instead of rendering them", () => {
    const bad = [{ ...entry, id: 7 }, { ...entry, target_temp_c: "hot" }, null, "x"];
    expect(parseHistory([...bad, entry])).toEqual([entry]);
  });

  it("returns an empty list for a non-array response", () => {
    expect(parseHistory({ detail: "error" })).toEqual([]);
  });

  it("allows a cook with no readings", () => {
    const empty = { ...entry, ended_at: null, peak_core_c: null, reading_count: 0 };
    expect(parseHistory([empty])).toEqual([empty]);
  });
});

describe("summarizeCook", () => {
  it("summarises date, cut, size, duration and peak against target", () => {
    expect(summarizeCook(entry, "F")).toEqual({
      date: "Sat, Oct 3",
      cut: "Brisket flat",
      details: "5.4 kg · 11.9 lb · Kamado",
      duration: "12 h 5 min",
      hasReadings: true,
      target: "203°",
      peak: "204°",
      peakNote: "on target",
    });
  });

  it("says how far short a cook finished", () => {
    expect(summarizeCook({ ...entry, peak_core_c: 92 }, "F").peakNote).toBe("5° short");
  });

  it("reports overshoot honestly instead of calling it on target", () => {
    expect(summarizeCook({ ...entry, peak_core_c: 110 }, "F").peakNote).toBe("27° over");
  });

  it("calls a peak within one degree of target on target", () => {
    expect(summarizeCook({ ...entry, peak_core_c: 94.6 }, "F").peakNote).toBe("on target");
    expect(summarizeCook({ ...entry, peak_core_c: 95.5 }, "F").peakNote).toBe("on target");
  });

  it("is honest about cooks with no readings", () => {
    const s = summarizeCook({ ...entry, ended_at: null, peak_core_c: null, reading_count: 0 }, "C");
    expect(s.duration).toBe("No readings");
    expect(s.hasReadings).toBe(false);
    expect(s.peak).toBe("None");
    expect(s.peakNote).toBe("");
    expect(s.target).toBe("95°");
  });
});
