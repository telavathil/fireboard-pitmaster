import { TelemetryPayload } from "../../types";
import { TempUnit, parseServerTime, toUnit } from "./cookModel";

export interface ChartFrame {
  width: number;
  height: number;
  padTop: number;
  padBottom: number;
}

interface ChartInput {
  history: ReadonlyArray<TelemetryPayload>;
  now: number;
  etaClock: number | null;
  targetC: number;
  pullC: number;
  unit: TempUnit;
}

export interface TideChart {
  past: string;
  projection: string | null;
  nowX: number;
  pullY: number;
  pullLabel: string;
  ticks: ReadonlyArray<{ x: number; label: string }>;
  yTicks: ReadonlyArray<{ y: number; label: string }>;
}

const HOUR_MS = 3_600_000;
const MIN_SPAN_MS = 2 * HOUR_MS;
const TAIL_AFTER_TARGET_MS = 20 * 60_000;
const MIN_PROJECTION_PX = 24;
const SCALE_STEP: Record<TempUnit, number> = { F: 25, C: 10 };

const hourFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric" });
const toMs = (r: TelemetryPayload) => parseServerTime(r.timestamp);
const pt = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`;

function timeDomain(history: ChartInput["history"], now: number, etaClock: number | null) {
  const start = history.length > 0 ? Math.min(toMs(history[0]), now) : now - HOUR_MS;
  const projectedEnd = etaClock !== null ? etaClock + TAIL_AFTER_TARGET_MS : now + HOUR_MS;
  const end = Math.max(projectedEnd, start + MIN_SPAN_MS, now);
  return { start, end };
}

function tempDomain(history: ChartInput["history"], targetC: number) {
  const cores = history.map((r) => r.core_temp_filtered);
  const lo = Math.min(...cores, targetC - 60) - 3;
  const hi = Math.max(...cores, targetC) + 6;
  return { lo, hi };
}

/** A tide table prints its height scale; this is the temperature equivalent, in the display unit. */
function tempTicks(lo: number, hi: number, unit: TempUnit, y: (c: number) => number) {
  const step = SCALE_STEP[unit];
  const toC = (v: number) => (unit === "F" ? ((v - 32) * 5) / 9 : v);
  const first = Math.ceil(toUnit(lo, unit) / step) * step;
  const ticks: Array<{ y: number; label: string }> = [];
  for (let v = first; toC(v) <= hi; v += step) ticks.push({ y: y(toC(v)), label: `${v}°` });
  return ticks;
}

function hourTicks(start: number, end: number, x: (t: number) => number) {
  const spanHours = (end - start) / HOUR_MS;
  const stepHours = Math.max(1, Math.ceil(spanHours / 4));
  const first = new Date(start);
  first.setMinutes(0, 0, 0);
  const ticks: Array<{ x: number; label: string }> = [];
  for (let t = first.getTime() + HOUR_MS; t <= end && ticks.length < 5; t += stepHours * HOUR_MS) {
    if (t >= start) ticks.push({ x: x(t), label: hourFormat.format(new Date(t)) });
  }
  return ticks;
}

export function buildTideChart(input: ChartInput, frame: ChartFrame): TideChart {
  const { history, now, etaClock, targetC, pullC, unit } = input;
  const { start, end } = timeDomain(history, now, etaClock);
  const { lo, hi } = tempDomain(history, targetC);
  const plotHeight = frame.height - frame.padTop - frame.padBottom;

  const x = (t: number) => ((t - start) / (end - start)) * frame.width;
  const y = (c: number) => frame.padTop + ((hi - c) / (hi - lo)) * plotHeight;

  const past =
    history.length === 0
      ? ""
      : "M " + history.map((r) => pt(x(toMs(r)), y(r.core_temp_filtered))).join(" L ");

  const last = history[history.length - 1];
  const nowX = x(now);
  let projection: string | null = null;

  // A projection shorter than this is a sliver past "now" (at the pull), not information.
  if (last && etaClock !== null && x(etaClock) - nowX >= MIN_PROJECTION_PX) {
    const x0 = nowX;
    const y0 = y(last.core_temp_filtered);
    const x3 = x(etaClock);
    const y3 = y(targetC);
    const dx = x3 - x0;
    // Ease out of the current reading and settle into the target, like a tide curve.
    const [x1, y1, x2, y2] = [x0 + dx * 0.4, y0, x3 - dx * 0.35, y3];
    projection = `M ${pt(x0, y0)} C ${pt(x1, y1)} ${pt(x2, y2)} ${pt(x3, y3)}`;
  }

  return {
    past,
    projection,
    nowX,
    pullY: y(pullC),
    pullLabel: `${toUnit(pullC, unit)}° pull`,
    ticks: hourTicks(start, end, x),
    yTicks: tempTicks(lo, hi, unit, y),
  };
}
