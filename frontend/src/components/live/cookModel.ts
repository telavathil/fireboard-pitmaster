import { TelemetryPayload } from "../../types";

export type Stage = "stabilizing" | "cooking" | "stall" | "pull" | "rest";
export type TempUnit = "F" | "C";

export const STAGES: ReadonlyArray<{ id: Stage; label: string }> = [
  { id: "stabilizing", label: "Learning" },
  { id: "cooking", label: "Cooking" },
  { id: "stall", label: "Stall" },
  { id: "pull", label: "Pull" },
  { id: "rest", label: "Rest" },
];

/** Readings older than this are no longer shown as live. Matches the backend spec. */
export const STALE_AFTER_SECONDS = 60;

interface StageInput {
  status: string;
  telemetry: TelemetryPayload | null;
  targetC: number;
  carryoverC: number | null;
}

const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Server times are UTC. Older payloads omit the zone, and the browser would
 * read those as local time, so a zoneless timestamp is treated as UTC.
 */
export function parseServerTime(timestamp: string): number {
  const text = timestamp.trim();
  return new Date(HAS_ZONE.test(text) ? text : `${text}Z`).getTime();
}

export function pullTempC(targetC: number, carryoverC: number | null): number {
  return targetC - (carryoverC ?? 0);
}

export function deriveStage({ status, telemetry, targetC, carryoverC }: StageInput): Stage {
  if (status === "resting") return "rest";
  if (!telemetry) return "stabilizing";
  if (telemetry.core_temp_filtered >= pullTempC(targetC, carryoverC)) return "pull";
  if (telemetry.stall_detected) return "stall";
  if (telemetry.eta_seconds < 0 || telemetry.confidence === "low" || telemetry.confidence === "none") {
    return "stabilizing";
  }
  return "cooking";
}

export function toUnit(celsius: number, unit: TempUnit, opts: { delta?: boolean } = {}): number {
  if (unit === "C") return Math.round(celsius);
  const scaled = (celsius * 9) / 5;
  return Math.round(opts.delta ? scaled : scaled + 32);
}

export function readingAgeSeconds(timestamp: string, now: number): number {
  const readAt = parseServerTime(timestamp);
  if (Number.isNaN(readAt)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.round((now - readAt) / 1000));
}

export function isStale(ageSeconds: number): boolean {
  return ageSeconds > STALE_AFTER_SECONDS;
}

export function formatAge(seconds: number): string {
  if (!Number.isFinite(seconds)) return "no readings yet";
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min ago`;
}

const clockFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export function formatClock(ms: number): string {
  return clockFormat.format(new Date(ms));
}

export function etaToClock(now: number, etaSeconds: number): number | null {
  if (etaSeconds < 0) return null;
  return now + etaSeconds * 1000;
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function stallStartedAt(history: ReadonlyArray<TelemetryPayload>): number | null {
  const last = history[history.length - 1];
  if (!last?.stall_detected) return null;
  let startIndex = history.length - 1;
  while (startIndex > 0 && history[startIndex - 1].stall_detected) {
    startIndex -= 1;
  }
  return parseServerTime(history[startIndex].timestamp);
}
