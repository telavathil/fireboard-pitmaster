import { TempUnit } from "../live/cookModel";

export type Meat = "beef" | "pork" | "poultry" | "fish";
export type Cooker = "kamado" | "pellet" | "offset" | "electric";
export type WeightUnit = "kg" | "lb";
export type LengthUnit = "mm" | "in";
type EntryUnit = WeightUnit | LengthUnit;

export interface SetupDraft {
  meatType: Meat;
  cutType: string;
  weight: string;
  weightUnit: WeightUnit;
  thickness: string;
  thicknessUnit: LengthUnit;
  targetC: number;
  cookerType: Cooker;
  deviceId: string;
  deviceName: string;
}

export type DraftErrors = Partial<Record<keyof SetupDraft, string>>;

export const MEATS: ReadonlyArray<{ id: Meat; label: string }> = [
  { id: "beef", label: "Beef" },
  { id: "pork", label: "Pork" },
  { id: "poultry", label: "Poultry" },
  { id: "fish", label: "Fish" },
];

export const COOKERS: ReadonlyArray<{ id: Cooker; label: string }> = [
  { id: "kamado", label: "Kamado" },
  { id: "pellet", label: "Pellet grill" },
  { id: "offset", label: "Offset smoker" },
  { id: "electric", label: "Electric smoker" },
];

const fToC = (f: number) => ((f - 32) * 5) / 9;

export interface Preset {
  id: string;
  label: string;
  meatType: Meat;
  cutType: string;
  targetC: number;
}

export const PRESETS: ReadonlyArray<Preset> = [
  { id: "brisket", label: "Brisket", meatType: "beef", cutType: "Brisket flat", targetC: fToC(203) },
  { id: "pork-butt", label: "Pork butt", meatType: "pork", cutType: "Pork butt", targetC: fToC(205) },
  { id: "ribeye", label: "Ribeye, medium rare", meatType: "beef", cutType: "Ribeye", targetC: fToC(135) },
  { id: "chicken", label: "Whole chicken", meatType: "poultry", cutType: "Whole chicken", targetC: fToC(165) },
];

export const DEFAULT_DRAFT: SetupDraft = {
  meatType: "beef",
  cutType: "Brisket flat",
  weight: "5.4",
  weightUnit: "kg",
  thickness: "75",
  thicknessUnit: "mm",
  targetC: fToC(203),
  cookerType: "kamado",
  deviceId: "device_sim_123",
  deviceName: "",
};

/** Allowed target range: exactly 100-220 °F, so both ends are reachable in either unit. */
export const TARGET_RANGE_C = { min: fToC(100), max: fToC(220) } as const;

const TO_METRIC: Record<EntryUnit, number> = { kg: 1, lb: 0.45359237, mm: 1, in: 25.4 };

const RANGES: Record<EntryUnit, { min: number; max: number }> = {
  kg: { min: 0.2, max: 40 },
  lb: { min: 0.5, max: 88 },
  mm: { min: 10, max: 300 },
  in: { min: 0.4, max: 12 },
};

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;
const parse = (entry: string) => (entry.trim() === "" ? Number.NaN : Number(entry));

function inRange(entry: string, unit: EntryUnit): boolean {
  const value = parse(entry);
  return Number.isFinite(value) && value >= RANGES[unit].min && value <= RANGES[unit].max;
}

/** Re-expresses a typed value when its unit toggle changes, so switching units never loses the entry. */
export function convertEntry(entry: string, from: EntryUnit, to: EntryUnit): string {
  const value = parse(entry);
  if (!Number.isFinite(value) || from === to) return entry;
  const metric = value * TO_METRIC[from];
  return String(round(metric / TO_METRIC[to], 2));
}

export function stepTarget(targetC: number, unit: TempUnit, delta: number): number {
  const display = unit === "F" ? Math.round((targetC * 9) / 5 + 32) : Math.round(targetC);
  const nextDisplay = display + delta;
  const nextC = unit === "F" ? fToC(nextDisplay) : nextDisplay;
  return Math.min(TARGET_RANGE_C.max, Math.max(TARGET_RANGE_C.min, nextC));
}

export function applyPreset(draft: SetupDraft, preset: Preset): SetupDraft {
  return { ...draft, meatType: preset.meatType, cutType: preset.cutType, targetC: preset.targetC };
}

export function validateDraft(draft: SetupDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.cutType.trim() === "") errors.cutType = "Name the cut, for example Brisket flat.";
  if (!inRange(draft.weight, draft.weightUnit)) {
    const r = RANGES[draft.weightUnit];
    errors.weight = `Enter a weight between ${r.min} and ${r.max} ${draft.weightUnit}.`;
  }
  if (!inRange(draft.thickness, draft.thicknessUnit)) {
    const r = RANGES[draft.thicknessUnit];
    errors.thickness = `Enter a thickness between ${r.min} and ${r.max} ${draft.thicknessUnit}.`;
  }
  if (draft.targetC < TARGET_RANGE_C.min || draft.targetC > TARGET_RANGE_C.max) {
    errors.targetC = "Choose a target between 100 and 220 °F (38 and 104 °C).";
  }
  if (draft.deviceId.trim() === "") errors.deviceId = "Enter the FireBoard device ID.";
  return errors;
}

export interface SessionPayload {
  device_id: string;
  device_name: string;
  meat_type: Meat;
  cut_type: string;
  cooker_type: Cooker;
  status: "bare";
  weight_kg: number;
  thickness_mm: number;
  target_temp_c: number;
}

/** The backend always works in kilograms, millimetres and Celsius. */
export function toSessionPayload(draft: SetupDraft): SessionPayload {
  const toMetric = (entry: string, unit: EntryUnit) => parse(entry) * TO_METRIC[unit];
  return {
    device_id: draft.deviceId.trim(),
    device_name: draft.deviceName.trim(),
    meat_type: draft.meatType,
    cut_type: draft.cutType.trim(),
    cooker_type: draft.cookerType,
    status: "bare",
    weight_kg: round(toMetric(draft.weight, draft.weightUnit), 2),
    thickness_mm: round(toMetric(draft.thickness, draft.thicknessUnit), 1),
    target_temp_c: round(draft.targetC, 1),
  };
}

const isOneOf = <T extends string>(value: unknown, options: ReadonlyArray<{ id: T }> | ReadonlyArray<T>): value is T =>
  (options as ReadonlyArray<unknown>).some((o) => (typeof o === "string" ? o : (o as { id: T }).id) === value);

/** Restores the last cook's setup from storage, rejecting anything malformed. */
export function parseStoredDraft(raw: string | null): SetupDraft | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  const strings = ["cutType", "weight", "thickness", "deviceId", "deviceName"].every((k) => typeof d[k] === "string");
  const valid =
    strings &&
    isOneOf(d.meatType, MEATS) &&
    isOneOf(d.cookerType, COOKERS) &&
    isOneOf(d.weightUnit, ["kg", "lb"] as const) &&
    isOneOf(d.thicknessUnit, ["mm", "in"] as const) &&
    typeof d.targetC === "number" &&
    Number.isFinite(d.targetC);
  if (!valid) return null;
  const { meatType, cutType, weight, weightUnit, thickness, thicknessUnit, targetC, cookerType, deviceId, deviceName } =
    d as unknown as SetupDraft;
  return { meatType, cutType, weight, weightUnit, thickness, thicknessUnit, targetC, cookerType, deviceId, deviceName };
}
