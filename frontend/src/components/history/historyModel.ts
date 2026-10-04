import { TempUnit, formatDuration, parseServerTime, toUnit } from "../live/cookModel";
import { getMeatLabel } from "../../lib/formatters";

/** One finished cook, as returned by GET /api/sessions/history. Times are UTC. */
export interface HistoryEntry {
  id: string;
  device_name: string | null;
  meat_type: string;
  cut_type: string;
  cooker_type: string;
  weight_kg: number;
  thickness_mm: number;
  target_temp_c: number;
  started_at: string;
  ended_at: string | null;
  peak_core_c: number | null;
  reading_count: number;
}

export interface CookSummary {
  date: string;
  cut: string;
  details: string;
  duration: string;
  hasReadings: boolean;
  target: string;
  peak: string;
  peakNote: string;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";

function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    isStr(e.id) &&
    (e.device_name === null || isStr(e.device_name)) &&
    isStr(e.meat_type) &&
    isStr(e.cut_type) &&
    isStr(e.cooker_type) &&
    isNum(e.weight_kg) &&
    isNum(e.thickness_mm) &&
    isNum(e.target_temp_c) &&
    isStr(e.started_at) &&
    (e.ended_at === null || isStr(e.ended_at)) &&
    (e.peak_core_c === null || isNum(e.peak_core_c)) &&
    isNum(e.reading_count)
  );
}

/** Keeps only well-formed entries; anything else from the server is ignored rather than rendered. */
export function parseHistory(data: unknown): HistoryEntry[] {
  return Array.isArray(data) ? data.filter(isEntry) : [];
}

const LB_PER_KG = 2.20462;
/** A peak within this many display degrees of target counts as on target. */
const ON_TARGET_TOLERANCE = 1;

function peakNoteFor(peak: number | null, target: number): string {
  if (peak === null) return "";
  const diff = peak - target;
  if (Math.abs(diff) <= ON_TARGET_TOLERANCE) return "on target";
  return diff < 0 ? `${-diff}° short` : `${diff}° over`;
}

const dateFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

export function summarizeCook(entry: HistoryEntry, unit: TempUnit): CookSummary {
  const started = parseServerTime(entry.started_at);
  const ended = entry.ended_at ? parseServerTime(entry.ended_at) : null;
  const hasReadings = entry.reading_count > 0 && ended !== null && entry.peak_core_c !== null;

  const target = toUnit(entry.target_temp_c, unit);
  const peak = entry.peak_core_c !== null ? toUnit(entry.peak_core_c, unit) : null;

  return {
    date: dateFormat.format(new Date(started)),
    cut: entry.cut_type,
    // The backend records kilograms only, so both units are shown rather than guessing which was typed.
    details: `${entry.weight_kg} kg · ${Math.round(entry.weight_kg * LB_PER_KG * 10) / 10} lb · ${getMeatLabel(entry.cooker_type)}`,
    duration: hasReadings ? formatDuration((ended - started) / 1000) : "No readings",
    hasReadings,
    target: `${target}°`,
    peak: peak !== null ? `${peak}°` : "None",
    peakNote: peakNoteFor(peak, target),
  };
}
