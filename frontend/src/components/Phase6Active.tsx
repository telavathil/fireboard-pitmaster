"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";
import ForgeStat from "./ui/ForgeStat";
import ForgeKeyValueList from "./ui/ForgeKeyValueList";

export default function Phase6Active() {
  const {
    telemetry,
    history,
    coreTempF,
    carryoverRiseF,
    pullTempF,
    activeSession,
    formatEta,
    getMeatLabel,
    getSvgPathAmbientF,
    getSvgPathF,
    minTempF,
    maxTempF,
    moistureBudget,
  } = useCookSession();

  const filteredVarianceF = telemetry
    ? Math.round(Math.abs(telemetry.core_temp_raw - telemetry.core_temp_filtered) * 9 / 5 * 10) / 10
    : 0;

  const heatingRateFPerMin = telemetry ? Math.round(telemetry.heating_rate * 9 / 5 * 10) / 10 : 0;
  const heatFluxDescription =
    heatingRateFPerMin > 0.3
      ? "Stable upward momentum. No immediate stall predicted."
      : "Momentum flattening. Monitor for stall onset.";

  return (
    <>
      {/* Left Column: Live Chart */}
      <section className="col-span-12 md:col-span-8 flex flex-col gap-md h-full">
        <ForgeCard
          grow
          layout="column-between"
          minHeight="tall"
          title="Thermal Evolution"
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

        <ForgeStat
          icon="opacity"
          iconColor="secondary"
          label="Moisture Balance"
          value={`${moistureBudget}%`}
          statusText="OPTIMAL"
          statusColor="optimal"
        />
      </section>

      {/* Right Column: Probe telemetry + ETA/recommendations */}
      <aside className="col-span-12 md:col-span-4 flex flex-col gap-md h-full justify-between">
        {/* Core Temperature Probe */}
        <ForgeCard
          compactPadding
          hasHighlight
          title={
            <span className="font-label-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
              Core Temperature
            </span>
          }
          headerExtra={
            <span className="font-label-mono text-[9px] text-primary border border-primary/40 px-2 py-0.5 uppercase">
              Probe 01
            </span>
          }
        >
          <h3 className="font-headline-lg text-3xl text-on-surface leading-none mt-1">{coreTempF}°F</h3>
          <div className="flex justify-between items-center mt-2">
            <span className="font-label-mono text-[9px] text-on-surface-variant uppercase">Filtered Variance</span>
            <span className="font-label-mono text-[9px] text-secondary-fixed">±{filteredVarianceF}°F</span>
          </div>
          <div className="w-full bg-surface-container h-1 mt-1">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary-fixed"
              style={{ width: `${Math.min(100, filteredVarianceF * 20)}%` }}
            ></div>
          </div>
        </ForgeCard>

        {/* Smoker Ambient Probe */}
        <ForgeCard
          compactPadding
          title={
            <span className="font-label-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
              Smoker Ambient
            </span>
          }
          headerExtra={
            <span className="font-label-mono text-[9px] text-secondary-fixed border border-secondary-fixed/40 px-2 py-0.5 uppercase">
              Pit Sensor
            </span>
          }
        >
          <h3 className="font-headline-lg text-3xl text-secondary-fixed leading-none mt-1">
            {telemetry?.ambient_temp ? `${Math.round(telemetry.ambient_temp * 9 / 5 + 32)}°F` : "--°F"}
          </h3>
          <p className="font-label-mono text-[9px] text-on-surface-variant uppercase mt-2">Status: Stable</p>
        </ForgeCard>

        {/* Heat Flux */}
        <ForgeCard
          compactPadding
          title={
            <span className="font-label-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
              Heat Flux
            </span>
          }
          headerExtra={
            <span className="font-label-mono text-[8px] text-on-surface-variant uppercase">Heating Rate</span>
          }
        >
          <h3 className="font-headline-lg text-3xl text-primary leading-none mt-1">{heatingRateFPerMin}°/MIN</h3>
          <p className="font-label-mono text-[9px] text-on-surface-variant leading-snug mt-2 uppercase">
            {heatFluxDescription}
          </p>
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
