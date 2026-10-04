import { describe, it, expect } from "vitest";
import {
  DEFAULT_DRAFT,
  PRESETS,
  applyPreset,
  convertEntry,
  parseStoredDraft,
  stepTarget,
  toSessionPayload,
  validateDraft,
  SetupDraft,
} from "./setupModel";

const draft: SetupDraft = {
  ...DEFAULT_DRAFT,
  meatType: "beef",
  cutType: "Brisket flat",
  weight: "12",
  weightUnit: "lb",
  thickness: "3",
  thicknessUnit: "in",
  targetC: 95,
  cookerType: "kamado",
  deviceId: "fb-123",
  deviceName: "Backyard kamado",
};

describe("toSessionPayload", () => {
  it("always sends the backend kilograms, millimetres and Celsius", () => {
    expect(toSessionPayload(draft)).toEqual({
      device_id: "fb-123",
      device_name: "Backyard kamado",
      meat_type: "beef",
      cut_type: "Brisket flat",
      cooker_type: "kamado",
      status: "bare",
      weight_kg: 5.44,
      thickness_mm: 76.2,
      target_temp_c: 95,
    });
  });

  it("passes metric entries through unchanged", () => {
    const metric = { ...draft, weight: "5.4", weightUnit: "kg" as const, thickness: "75", thicknessUnit: "mm" as const };
    expect(toSessionPayload(metric)).toMatchObject({ weight_kg: 5.4, thickness_mm: 75 });
  });

  it("trims the cut name and device fields", () => {
    expect(toSessionPayload({ ...draft, cutType: "  Pork butt ", deviceId: " fb-9 " })).toMatchObject({
      cut_type: "Pork butt",
      device_id: "fb-9",
    });
  });
});

describe("validateDraft", () => {
  it("accepts a complete draft", () => {
    expect(validateDraft(draft)).toEqual({});
  });

  it("requires a cut name and a device", () => {
    const errors = validateDraft({ ...draft, cutType: "  ", deviceId: "" });
    expect(errors.cutType).toMatch(/name the cut/i);
    expect(errors.deviceId).toMatch(/fireboard/i);
  });

  it("rejects weights outside a sensible range in the chosen unit", () => {
    expect(validateDraft({ ...draft, weight: "0" }).weight).toBe("Enter a weight between 0.5 and 88 lb.");
    expect(validateDraft({ ...draft, weight: "abc", weightUnit: "kg" }).weight).toBe("Enter a weight between 0.2 and 40 kg.");
  });

  it("rejects thickness outside a sensible range in the chosen unit", () => {
    expect(validateDraft({ ...draft, thickness: "20" }).thickness).toBe("Enter a thickness between 0.4 and 12 in.");
  });

  it("rejects a target temperature outside 38-104 °C", () => {
    expect(validateDraft({ ...draft, targetC: 30 }).targetC).toMatch(/between/);
  });
});

describe("convertEntry", () => {
  it("converts the typed value when the unit is switched", () => {
    expect(convertEntry("12", "lb", "kg")).toBe("5.44");
    expect(convertEntry("5.44", "kg", "lb")).toBe("11.99");
    expect(convertEntry("3", "in", "mm")).toBe("76.2");
    expect(convertEntry("76.2", "mm", "in")).toBe("3");
  });

  it("leaves an empty or invalid entry alone", () => {
    expect(convertEntry("", "lb", "kg")).toBe("");
    expect(convertEntry("abc", "lb", "kg")).toBe("abc");
  });
});

describe("stepTarget", () => {
  it("steps one degree in the display unit", () => {
    expect(Math.round((stepTarget(95, "F", 1) * 9) / 5 + 32)).toBe(204);
    expect(stepTarget(95, "C", -1)).toBe(94);
  });

  it("stays within the allowed range", () => {
    expect(stepTarget(104, "C", 1)).toBeCloseTo(((220 - 32) * 5) / 9, 5);
  });

  it("reaches 220 °F, the documented upper limit, and stops there", () => {
    const at219 = ((219 - 32) * 5) / 9;
    const up = stepTarget(at219, "F", 1);
    expect(Math.round((up * 9) / 5 + 32)).toBe(220);
    expect(Math.round((stepTarget(up, "F", 1) * 9) / 5 + 32)).toBe(220);
    expect(validateDraft({ ...draft, targetC: up }).targetC).toBeUndefined();
  });
});

describe("presets", () => {
  it("fill protein, cut and target together", () => {
    const brisket = PRESETS.find((p) => p.id === "brisket")!;
    const next = applyPreset({ ...draft, meatType: "pork", cutType: "x" }, brisket);
    expect(next).toMatchObject({ meatType: "beef", cutType: "Brisket flat" });
    expect(Math.round((next.targetC * 9) / 5 + 32)).toBe(203);
  });
});

describe("parseStoredDraft", () => {
  it("restores a saved draft", () => {
    expect(parseStoredDraft(JSON.stringify(draft))).toEqual(draft);
  });

  it("ignores corrupt or tampered storage", () => {
    expect(parseStoredDraft("{not json")).toBeNull();
    expect(parseStoredDraft(JSON.stringify({ ...draft, weightUnit: "stone" }))).toBeNull();
    expect(parseStoredDraft(null)).toBeNull();
  });
});
