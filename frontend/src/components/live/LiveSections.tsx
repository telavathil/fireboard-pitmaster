"use client";

import React from "react";
import { WifiSlash } from "@phosphor-icons/react";
import { STAGES, Stage } from "./cookModel";
import { Readout, TableRow } from "./liveView";

export function CoreReadout({ readout }: { readout: Readout }) {
  return (
    <section aria-label="Core temperature" className="[grid-area:readout] pt-5">
      <div className="flex items-end gap-4">
        <p
          className={`text-[clamp(5.5rem,27vw,8.5rem)] font-extrabold leading-[0.8] tracking-[-0.02em] [font-stretch:66%] ${
            readout.dimmed ? "text-tide-muted" : ""
          }`}
        >
          {readout.figure}
        </p>
        <div className="pb-1">
          <p className="whitespace-nowrap text-[clamp(1.4rem,6vw,1.75rem)] font-bold leading-tight [font-stretch:80%]">
            {readout.target}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[15px] text-tide-muted">{readout.note}</p>
    </section>
  );
}

export function StageLine({ stage }: { stage: Stage }) {
  const currentIndex = STAGES.findIndex((s) => s.id === stage);
  return (
    <ol aria-label="Cook stages" className="[grid-area:stages] mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[14px] font-semibold">
      {STAGES.map((s, i) => {
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;
        return (
          <li
            key={s.id}
            aria-current={isCurrent ? "step" : undefined}
            className={
              isCurrent
                ? "text-tide-ink underline decoration-2 underline-offset-[6px]"
                : isFuture
                  ? "text-tide-muted opacity-75"
                  : "text-tide-muted"
            }
          >
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}

export function TideTable({ rows }: { rows: ReadonlyArray<TableRow> }) {
  if (rows.length === 0) return null;
  return (
    <dl aria-label="Forecast" className="mt-5 border-t-[1.5px] border-tide-ink md:mt-8">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-tide-rule py-3">
          <dt className="text-[15px] font-medium">{row.label}</dt>
          <dd className={`text-right text-[28px] font-bold leading-none [font-stretch:76%] ${row.tone === "pull" ? "text-tide-pull" : ""}`}>
            {row.value}
          </dd>
          {row.note && <dd className="col-start-2 mt-1 text-right text-[13px] text-tide-muted">{row.note}</dd>}
        </div>
      ))}
    </dl>
  );
}

export function ReadingMeta({ pit, ageLabel }: { pit: string; ageLabel: string | null }) {
  return (
    <div className="[grid-area:meta] mt-4 flex justify-between text-[14px] text-tide-muted">
      <span>
        Pit <b className="font-bold text-tide-ink">{pit}</b>
      </span>
      {ageLabel && <span>{ageLabel}</span>}
    </div>
  );
}

/** Lost or stale data is a band-level state, like the pull: it must be readable in sun. */
export function DataProblem({ message }: { message: string }) {
  return (
    <p role="status" className="mx-auto flex max-w-[1200px] items-start gap-2 px-5 pb-4 text-[15px] font-semibold md:px-10">
      <WifiSlash size={20} weight="bold" className="mt-0.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
