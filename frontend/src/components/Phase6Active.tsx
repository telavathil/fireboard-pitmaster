"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";

export default function Phase6Active() {
  const {
    telemetry,
    history,
    coreTempF,
    targetTempFDisplay,
    progressPercent,
    moistureBudget,
    carryoverRiseF,
    pullTempF,
    activeSession,
    formatEta,
    getMeatLabel,
    getSvgPathAmbientF,
    getSvgPathF,
    minTempF,
    maxTempF,
  } = useCookSession();

  return (
    <>
      {/* Left Column: Live Chart */}
      <section className="col-span-8 flex flex-col gap-md h-full">
        <ForgeCard
          grow
          layout="column-between"
          minHeight="tall"
          title="Active Session Tracking"
          subtitle="Status: Running"
          headerExtra={
            <div className="flex gap-md font-label-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-primary"></span>
                <span className="uppercase text-[9px]">Core</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-secondary-fixed"></span>
                <span className="uppercase text-[9px]">Ambient</span>
              </div>
            </div>
          }
        >
          {/* Chart SVG */}
          <div className="flex-grow chart-grid border border-outline-variant/30 relative overflow-hidden min-h-[180px] mt-md">
            {history.length > 0 ? (
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path
                  d={getSvgPathAmbientF(history, minTempF, maxTempF)}
                  fill="none"
                  stroke="#ffe16d"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <path
                  d={getSvgPathF(history, minTempF, maxTempF)}
                  fill="none"
                  stroke="#FF4D00"
                  strokeWidth="3"
                />
              </svg>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center text-on-surface-variant opacity-60">
                <span className="material-symbols-outlined text-4xl mb-sm animate-pulse">query_stats</span>
                <p className="font-label-mono text-xs uppercase tracking-wider">Acquiring live telemetry packets...</p>
              </div>
            )}
          </div>
        </ForgeCard>

        <div className="grid grid-cols-2 gap-md">
          <div className="forge-surface p-4 flex gap-4 items-center">
            <span className="material-symbols-outlined text-primary text-3xl">oven_gen</span>
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Ambient Pit Temp</p>
              <p className="font-headline-md text-xl">
                {telemetry?.ambient_temp ? `${Math.round(telemetry.ambient_temp * 9/5 + 32)}°F` : "--°F"}{" "}
                <span className="text-xs text-secondary-fixed font-label-mono ml-2 uppercase font-bold">STABLE</span>
              </p>
            </div>
          </div>
          <div className="forge-surface p-4 flex gap-4 items-center">
            <span className="material-symbols-outlined text-secondary-fixed text-3xl">opacity</span>
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Moisture Balance</p>
              <p className="font-headline-md text-xl">{moistureBudget}% <span className="text-xs text-outline font-label-mono ml-2 uppercase font-bold">OPTIMAL</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Active Live status */}
      <aside className="col-span-4 flex flex-col gap-md h-full justify-between">
        {/* Live progress circle */}
        <ForgeCard
          grow
          centered
          title={
            <p className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] font-bold">
              Target Temperature Gauge
            </p>
          }
        >
          <div className="relative w-36 h-36 flex items-center justify-center mt-4">
            <svg className="w-full h-full -rotate-90">
              <circle className="text-white/5" cx="72" cy="72" fill="transparent" r="64" stroke="currentColor" strokeWidth="6"></circle>
              <circle
                className="text-primary"
                cx="72"
                cy="72"
                fill="transparent"
                r="64"
                stroke="currentColor"
                strokeDasharray={2 * Math.PI * 64}
                strokeDashoffset={(2 * Math.PI * 64) * (1 - progressPercent / 100)}
                strokeWidth="6"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="font-label-mono text-[9px] text-on-surface-variant">Core Temp</span>
              <span className="font-display-lg text-3xl font-bold">{coreTempF}°F</span>
              <span className="font-label-mono text-[8px] text-secondary-fixed mt-1 uppercase">Target: {targetTempFDisplay}°F</span>
            </div>
          </div>
        </ForgeCard>

        {/* ETA & Recommendations */}
        <div className="space-y-sm">
          <ForgeCard
            title={
              <span className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
                Estimated Remaining (ETA)
              </span>
            }
            compactPadding
          >
            <h3 className="font-headline-lg text-3xl text-primary tracking-widest mt-1 leading-none">
              {formatEta(telemetry ? telemetry.eta_seconds : -1)}
            </h3>
          </ForgeCard>

          <ForgeCard compactPadding>
            <div className="flex justify-between items-center w-full">
              <div>
                <span className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">Projected Carryover Rise</span>
                <h3 className="font-headline-lg text-2xl text-secondary-fixed leading-none mt-1">
                  +{carryoverRiseF}°F
                </h3>
              </div>
              <div className="text-right">
                <span className="font-label-mono text-[8px] text-on-surface-variant uppercase block mb-1">Recommendation</span>
                <div className="bg-primary/10 border border-primary/40 px-3 py-1 text-primary font-headline-md text-xs uppercase tracking-wide">
                  PULL AT {pullTempF}°F
                </div>
              </div>
            </div>
          </ForgeCard>

          <ForgeCard compactPadding>
            <div className="text-xs font-label-mono space-y-xs uppercase">
              <div className="flex justify-between">
                <span className="text-outline">CUT / PROTEIN</span>
                <span className="text-on-surface font-bold">{activeSession?.cut_type} ({getMeatLabel(activeSession?.meat_type || "")})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">COOKER</span>
                <span className="text-on-surface font-bold">{activeSession?.cooker_type}</span>
              </div>
            </div>
          </ForgeCard>
        </div>
      </aside>
    </>
  );
}
