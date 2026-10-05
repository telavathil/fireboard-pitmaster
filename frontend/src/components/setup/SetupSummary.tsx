"use client";

import React from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { PRESS } from "../tide/press";

const PrimaryClasses =
  `${PRESS} min-h-[56px] rounded-[10px] bg-tide-ink px-5 text-[17px] font-bold text-tide-ground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`;

interface StartBarProps {
  line: string;
  error: string | null;
  busy: boolean;
}

/** Narrow screens: the start action stays one tap away, pinned above the tab bar. */
export function StartBar({ line, error, busy }: StartBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(53px+env(safe-area-inset-bottom))] z-20 border-t border-tide-rule bg-tide-ground px-5 py-3 md:bottom-0 md:left-[88px] md:px-10 min-[900px]:hidden">
      {error && (
        <p role="alert" className="mb-2 flex items-start gap-2 text-[14px] font-semibold">
          <WarningCircle size={18} weight="bold" className="mt-px shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <div className="flex items-center gap-4">
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">{line}</p>
        <button type="submit" disabled={busy} className={`${PrimaryClasses} shrink-0 px-6`}>
          {busy ? "Starting…" : "Start cook"}
        </button>
      </div>
    </div>
  );
}

interface SetupSummaryProps {
  rows: ReadonlyArray<{ label: string; value: string }>;
  error: string | null;
  busy: boolean;
}

/** The cook as it will start, set in the forecast table's rhythm, with the one primary action. */
export default function SetupSummary({ rows, error, busy }: SetupSummaryProps) {
  return (
    <aside aria-label="Cook summary" className="pb-48 pt-6 md:pb-32 min-[900px]:sticky min-[900px]:pb-10 min-[900px]:top-6 min-[900px]:pt-8">
      <dl className="border-t-[1.5px] border-tide-ink">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 border-b border-tide-rule py-3">
            <dt className="text-[15px] font-medium">{row.label}</dt>
            <dd className="truncate text-right text-[22px] font-bold leading-tight [font-stretch:80%]">{row.value}</dd>
          </div>
        ))}
      </dl>
      {error && (
        <p role="alert" className="mt-4 hidden items-start gap-2 text-[15px] font-semibold min-[900px]:flex">
          <WarningCircle size={20} weight="bold" className="mt-px shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className={`${PrimaryClasses} mt-5 hidden w-full min-[900px]:block`}
      >
        {busy ? "Starting…" : "Start cook"}
      </button>
    </aside>
  );
}
