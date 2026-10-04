import { TelemetryPayload } from "../../types";
import {
  Stage,
  TempUnit,
  etaToClock,
  formatAge,
  formatClock,
  formatDuration,
  isStale,
  pullTempC,
  readingAgeSeconds,
  stallStartedAt,
  toUnit,
} from "./cookModel";

/** The solver's evaporative stall band (backend math_engine, 65-75 °C). */
const STALL_ZONE_C = { lo: 65, hi: 75 };

export interface LiveViewInput {
  stage: Stage;
  targetC: number;
  telemetry: TelemetryPayload | null;
  history: ReadonlyArray<TelemetryPayload>;
  now: number;
  unit: TempUnit;
  carryoverC: number | null;
  restStartedAt: number | null;
  peakRestTempC: number | null;
  connected: boolean;
}

export interface Readout {
  figure: string;
  target: string;
  note: string;
  dimmed: boolean;
}

export interface TableRow {
  label: string;
  value: string;
  note?: string;
  tone?: "pull";
}

export interface Freshness {
  ageLabel: string;
  problem: string | null;
}

const deg = (c: number, unit: TempUnit) => `${toUnit(c, unit)}°`;

function ageOf(input: LiveViewInput): number {
  return input.telemetry ? readingAgeSeconds(input.telemetry.timestamp, input.now) : Number.POSITIVE_INFINITY;
}

/** Clock time the backend expects the core to reach target, anchored to the reading it came from. */
export function targetClock(telemetry: TelemetryPayload | null): number | null {
  if (!telemetry || telemetry.confidence === "low" || telemetry.confidence === "none") return null;
  return etaToClock(new Date(telemetry.timestamp).getTime(), telemetry.eta_seconds);
}

/** When the figure can't be trusted as live, the note under it says why, in the first viewport. */
function isTrusted(input: LiveViewInput): boolean {
  return input.telemetry !== null && input.connected && !isStale(ageOf(input));
}

function trustNote(input: LiveViewInput): string | null {
  if (!input.telemetry) return null;
  if (!input.connected) return "Reconnecting. Showing the last reading.";
  const age = ageOf(input);
  return isStale(age) ? `Last reading ${formatAge(age)}` : null;
}

const STAGES_WITH_AGE: ReadonlySet<Stage> = new Set(["stabilizing", "cooking", "stall"]);

export function buildReadout(input: LiveViewInput): Readout {
  const base = buildStageReadout(input);
  const note = trustNote(input);
  if (note) return { ...base, note };
  if (input.telemetry && STAGES_WITH_AGE.has(input.stage)) {
    return { ...base, note: `${base.note} · updated ${formatAge(ageOf(input))}` };
  }
  return base;
}

function buildStageReadout(input: LiveViewInput): Readout {
  const { stage, telemetry, targetC, unit, carryoverC, now } = input;
  const pullC = pullTempC(targetC, carryoverC);
  const figure = telemetry ? deg(telemetry.core_temp_filtered, unit) : "--°";
  const dimmed = !telemetry || isStale(ageOf(input)) || !input.connected;

  if (stage === "rest") {
    const elapsed = input.restStartedAt ? formatDuration((now - input.restStartedAt) / 1000) : "0 min";
    const peak = input.peakRestTempC !== null ? ` · peak ${deg(input.peakRestTempC, unit)}` : "";
    return { figure, target: `→ ${deg(targetC, unit)} target`, note: `Resting ${elapsed}${peak}`, dimmed };
  }
  if (stage === "stabilizing") {
    return { figure, target: `→ ${deg(pullC, unit)} pull`, note: "Learning how this cook heats. First estimate soon.", dimmed };
  }
  if (stage === "pull") {
    return { figure, target: `→ ${deg(pullC, unit)} pull`, note: "Ready to pull", dimmed };
  }
  const toGo = telemetry ? toUnit(pullC, unit) - toUnit(telemetry.core_temp_filtered, unit) : null;
  return { figure, target: `→ ${deg(pullC, unit)} pull`, note: toGo !== null ? `${toGo}° to go` : "Waiting for the first reading", dimmed };
}

function targetRow(input: LiveViewInput): TableRow {
  const label = `Reaches ${deg(input.targetC, input.unit)}`;
  if (input.telemetry && !isTrusted(input)) return { label, value: "Paused", note: "resumes with the next reading" };
  const clock = targetClock(input.telemetry);
  if (clock === null) return { label, value: "Estimating", note: "needs a few more readings" };
  return { label, value: formatClock(clock), note: `in ${formatDuration((clock - input.now) / 1000)}` };
}

function pullRow(input: LiveViewInput): TableRow {
  return {
    label: "Pull alarm",
    value: deg(pullTempC(input.targetC, input.carryoverC), input.unit),
    note: input.carryoverC === null ? "carryover not estimated yet" : "sounds when the core gets there",
    tone: "pull",
  };
}

export function buildTableRows(input: LiveViewInput): TableRow[] {
  const { stage, telemetry, unit } = input;

  if (stage === "rest") {
    const rows: TableRow[] = [];
    if (input.restStartedAt) rows.push({ label: "Pulled at", value: formatClock(input.restStartedAt) });
    if (input.peakRestTempC !== null) rows.push({ label: "Peak so far", value: deg(input.peakRestTempC, unit) });
    return rows;
  }

  if (stage === "pull") {
    const carry = input.carryoverC !== null ? [{ label: "Carryover in rest", value: `+${toUnit(input.carryoverC, unit, { delta: true })}°` }] : [];
    return [...carry, targetRow(input)];
  }

  const lead: TableRow[] = [];
  const stallStart = stage === "stall" ? stallStartedAt(input.history) : null;
  if (stallStart !== null) {
    lead.push({ label: "In the stall since", value: formatClock(stallStart), note: `${formatDuration((input.now - stallStart) / 1000)} so far` });
  } else if (telemetry && telemetry.core_temp_filtered < STALL_ZONE_C.lo) {
    lead.push({ label: "Stall zone", value: `${toUnit(STALL_ZONE_C.lo, unit)}–${toUnit(STALL_ZONE_C.hi, unit)}°`, note: "expect a plateau here" });
  }
  return [...lead, targetRow(input), pullRow(input)];
}

export function buildFreshness(input: LiveViewInput): Freshness {
  const age = ageOf(input);
  const ageLabel = input.telemetry ? `Updated ${formatAge(age)}` : "No readings yet";
  if (!input.connected) {
    return { ageLabel, problem: "Connection lost. Reconnecting; figures are from the last reading." };
  }
  if (input.telemetry && isStale(age)) {
    return { ageLabel, problem: `No new reading for ${formatDuration(age)}. Check the FireBoard and Wi-Fi.` };
  }
  return { ageLabel, problem: null };
}
