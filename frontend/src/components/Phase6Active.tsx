"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";
import ForgeStat from "./ui/ForgeStat";
import ForgeRadialGauge from "./ui/ForgeRadialGauge";
import ForgeKeyValueList from "./ui/ForgeKeyValueList";

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
          <ForgeStat
            icon="oven_gen"
            iconColor="primary"
            label="Ambient Pit Temp"
            value={telemetry?.ambient_temp ? `${Math.round(telemetry.ambient_temp * 9/5 + 32)}°F` : "--°F"}
            statusText="STABLE"
            statusColor="stable"
          />
          <ForgeStat
            icon="opacity"
            iconColor="secondary"
            label="Moisture Balance"
            value={`${moistureBudget}%`}
            statusText="OPTIMAL"
            statusColor="optimal"
          />
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
          <ForgeRadialGauge
            value={progressPercent}
            label="Core Temp"
            centerText={`${coreTempF}°F`}
            statusBadge={`Target: ${targetTempFDisplay}°F`}
          />
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
            <ForgeKeyValueList
              items={[
                { label: "CUT / PROTEIN", value: `${activeSession?.cut_type} (${getMeatLabel(activeSession?.meat_type || "")})` },
                { label: "COOKER", value: activeSession?.cooker_type || "" },
              ]}
              compact
            />
          </ForgeCard>
        </div>
      </aside>
    </>
  );
}
