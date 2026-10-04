"use client";

import React from "react";
import { CaretDown } from "@phosphor-icons/react";
import { TelemetryPayload } from "../../types";
import { TempUnit, toUnit } from "./cookModel";

interface EstimateDetailsProps {
  telemetry: TelemetryPayload | null;
  carryoverC: number | null;
  unit: TempUnit;
}

const ESTIMATE_STATUS: Record<string, string> = {
  high: "Estimate available",
  complete: "Target reached",
  low: "Not enough data yet",
  none: "Not enough data yet",
};

/** Model detail, on demand: the answer stays first, the workings are one tap away. */
export default function EstimateDetails({ telemetry, carryoverC, unit }: EstimateDetailsProps) {
  const rows: Array<[string, string]> = telemetry
    ? [
        ["Probe reading", `${toUnit(telemetry.core_temp_raw, unit)}°`],
        ["Smoothed reading", `${toUnit(telemetry.core_temp_filtered, unit)}°`],
        ["Heating rate", `${toUnit(telemetry.heating_rate * 60, unit, { delta: true })}° per hour`],
        ["Expected carryover", carryoverC !== null ? `+${toUnit(carryoverC, unit, { delta: true })}°` : "Not estimated yet"],
        ["Estimate", ESTIMATE_STATUS[telemetry.confidence] ?? telemetry.confidence],
      ]
    : [];

  return (
    <details className="group [grid-area:details] mt-6 border-t border-tide-rule pb-28 md:pb-10">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between text-[15px] font-semibold">
        How this estimate works
        <CaretDown size={18} className="transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <p className="max-w-[60ch] text-[14px] leading-relaxed text-tide-muted">
        Probe readings are smoothed with a Kalman filter. A heat-transfer model of this cut then projects when the
        core reaches your target, including time spent in the stall. The pull alarm subtracts the expected carryover,
        so the rest finishes the job.
      </p>
      {rows.length > 0 && (
        <dl className="mt-3 text-[14px]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-tide-rule py-2">
              <dt className="text-tide-muted">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </details>
  );
}
