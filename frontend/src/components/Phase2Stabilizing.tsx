"use client";

import React from "react";
import { TelemetryPayload } from "../types";

interface Phase2StabilizingProps {
  coreTempF: number;
  telemetry: TelemetryPayload | null;
}

export default function Phase2Stabilizing({ coreTempF, telemetry }: Phase2StabilizingProps) {
  return (
    <>
      {/* Left Column: Live Chart */}
      <section className="col-span-8 flex flex-col gap-md h-full">
        <div className="forge-surface p-md flex-grow flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-end mb-md">
            <div>
              <h2 className="font-label-mono text-tertiary-fixed text-xs uppercase tracking-[0.2em]">Live Thermal Analysis</h2>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="font-display-lg text-5xl text-on-surface leading-none">{coreTempF}°F</span>
                <span className="font-label-mono text-secondary-fixed-dim text-sm">+0.7°F/min</span>
              </div>
            </div>
            <div className="flex gap-md font-label-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-primary"></span>
                <span className="uppercase text-[9px]">RAW SENSOR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-secondary-fixed"></span>
                <span className="uppercase text-[9px]">SMOOTHED TREND</span>
              </div>
            </div>
          </div>

          <div className="flex-grow chart-grid border border-outline-variant/30 relative overflow-hidden min-h-[180px]">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
              <path d="M0,80 Q100,75 200,85 T400,70 T600,65 T800,60 T1000,55" fill="none" stroke="#ffe16d" strokeWidth="2"></path>
              <path d="M0,82 L50,78 L100,85 L150,75 L200,88 L250,82 L300,70 L350,75 L400,65 L450,72 L500,68 L550,60 L600,65 L650,62 L700,55 L750,58 L800,50" fill="none" stroke="#ffb59e" strokeDasharray="2 2" strokeWidth="1.5"></path>
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div className="forge-surface p-4 flex gap-4 items-center">
            <span className="material-symbols-outlined text-primary text-3xl">local_fire_department</span>
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Ambient Pit Temp</p>
              <p className="font-headline-md text-xl">225°F <span className="text-xs text-secondary-fixed font-label-mono ml-2 uppercase font-bold">STABLE</span></p>
            </div>
          </div>
          <div className="forge-surface p-4 flex gap-4 items-center">
            <span className="material-symbols-outlined text-secondary-fixed text-3xl">opacity</span>
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Surface Moisture</p>
              <p className="font-headline-md text-xl">64% <span className="text-xs text-outline font-label-mono ml-2 uppercase">DECREASING</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Widgets */}
      <aside className="col-span-4 flex flex-col gap-md h-full">
        {/* Device Status */}
        <div className="forge-surface p-md">
          <h3 className="font-label-mono text-xs text-on-surface-variant mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            DEVICE STATUS: ONLINE
          </h3>
          <div className="space-y-sm text-xs font-label-mono">
            <div className="flex justify-between">
              <span className="text-outline">PROBE MODEL</span>
              <span className="text-on-surface">EMBER-X1 V2.4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">SIGNAL STRENGTH</span>
              <div className="flex gap-0.5">
                <div className="w-1 h-3 bg-primary"></div>
                <div className="w-1 h-3 bg-primary"></div>
                <div className="w-1 h-3 bg-primary"></div>
                <div className="w-1 h-3 bg-outline/30"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Calibration Gauge */}
        <div className="forge-surface p-md flex flex-col items-center justify-center">
          <p className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] mb-4 font-bold">Thermal Stabilization</p>
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full pulsing-ring"></div>
            <svg className="w-full h-full -rotate-90">
              <circle className="text-outline/10" cx="72" cy="72" fill="transparent" r="64" stroke="currentColor" strokeWidth="4"></circle>
              <circle
                className="text-primary"
                cx="72"
                cy="72"
                fill="transparent"
                r="64"
                stroke="currentColor"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={(2 * Math.PI * 64) * 0.25} // 75%
                strokeWidth="5"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-label-mono text-[9px] text-on-surface-variant">CONFIDENCE</span>
              <span className="font-display-lg text-3xl font-bold">75%</span>
              <span className="font-label-mono text-[8px] text-secondary-fixed mt-1 px-1.5 py-0.5 border border-secondary-fixed/30 bg-secondary-fixed/5 uppercase">
                STABILIZING
              </span>
            </div>
          </div>
        </div>

        {/* Skeleton/Shimmer boxes */}
        <div className="flex-grow flex flex-col gap-sm">
          <div className="forge-surface p-sm">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 shimmer opacity-50"></div>
              <div className="h-3 w-8 shimmer opacity-30"></div>
            </div>
            <div className="h-6 w-3/4 shimmer opacity-40 mt-1"></div>
          </div>
          <div className="forge-surface p-sm">
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 shimmer opacity-50"></div>
              <div className="h-3 w-8 shimmer opacity-30"></div>
            </div>
            <div className="h-6 w-1/2 shimmer opacity-40 mt-1"></div>
          </div>
        </div>
      </aside>
    </>
  );
}
