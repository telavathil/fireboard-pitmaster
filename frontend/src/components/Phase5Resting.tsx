"use client";

import React from "react";
import WebGLShader from "./WebGLShader";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";
import ForgeStat from "./ui/ForgeStat";
import ForgeRadialGauge from "./ui/ForgeRadialGauge";
import ForgeKeyValueList from "./ui/ForgeKeyValueList";

export default function Phase5Resting() {
  const {
    coreTempF,
    targetTempFDisplay,
    pullTempF,
    peakRestTempC,
    restDurationSeconds,
    formatStopwatch,
    history,
    telemetry,
    getSvgPathF,
    getSvgPathAmbientF,
    minTempF,
    maxTempF,
    handleEndCook,
  } = useCookSession();

  const peakRestTempF = Math.round(peakRestTempC * 9/5 + 32);
  const targetMet = peakRestTempF >= targetTempFDisplay;

  return (
    <>
      {/* Left Column: Session Thermal History */}
      <section className="col-span-12 md:col-span-8 flex flex-col gap-md h-full">
        <ForgeCard
          grow
          layout="column-between"
          minHeight="tall"
          title="Session Thermal History"
          subtitle={`Rest Elapsed: ${formatStopwatch(restDurationSeconds)}`}
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
          <div className="flex-grow chart-grid border border-outline-variant/30 relative overflow-hidden min-h-[220px] mt-md">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          <ForgeStat icon="thermometer" iconColor="primary" label="Core Temp" value={`${coreTempF}°F`} />
          <ForgeStat
            icon="oven_gen"
            iconColor="secondary"
            label="Ambient"
            value={telemetry?.ambient_temp ? `${Math.round(telemetry.ambient_temp * 9/5 + 32)}°F` : "--°F"}
          />
          <ForgeStat icon="trending_down" iconColor="secondary" label="Peak Carryover" value={`${peakRestTempF}°F`} />
          <ForgeStat icon="track_changes" iconColor="outline" label="Target Temperature" value={`${targetTempFDisplay}°F`} />
        </div>
      </section>

      {/* Right Column: Resting timer, schematic, equilibrium status, CTA */}
      <aside className="col-span-12 md:col-span-4 flex flex-col gap-md h-full justify-between">
        {/* Rest Duration Stopwatch */}
        <ForgeCard
          grow
          centered
          hasHighlight
          title={
            <p className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] font-bold">
              Equilibrium Resting Phase
            </p>
          }
        >
          <ForgeRadialGauge
            value={60}
            label="ELAPSED TIME"
            centerText={formatStopwatch(restDurationSeconds)}
            statusBadge="RESTING ACTIVE"
            animation="heat"
          />
          <div className="flex items-center justify-center gap-sm mt-md">
            <span className="bg-primary/20 text-primary border border-primary/40 px-3 py-1 font-label-mono text-[10px] uppercase">
              Peak Core: {peakRestTempF}°F
            </span>
            {targetMet && (
              <span className="flex items-center gap-1 text-secondary-fixed font-label-mono text-[10px] uppercase">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Target Met
              </span>
            )}
          </div>
        </ForgeCard>

        {/* Thermal Equalization Schematic (WebGL) */}
        <ForgeCard
          compactPadding
          title={
            <p className="font-label-mono text-[9px] text-on-surface-variant uppercase tracking-widest">
              Thermal Equalization Schematic
            </p>
          }
          headerExtra={<span className="font-label-mono text-[9px] text-primary/60">SCAN ACTIVE...</span>}
        >
          <div className="relative h-40 w-full bg-background overflow-hidden mt-2">
            <div className="absolute inset-0">
              <WebGLShader />
            </div>
            <div className="absolute inset-0 p-2 flex flex-col justify-between pointer-events-none z-10">
              <div className="flex justify-between items-start">
                <div className="bg-black/60 backdrop-blur-sm p-1.5 border border-outline-variant/30">
                  <p className="font-label-mono text-[8px] text-on-surface-variant uppercase">Surface</p>
                  <p className="font-headline-md text-[10px] text-primary uppercase">Diffusing</p>
                </div>
                <div className="text-right bg-black/60 backdrop-blur-sm p-1.5 border border-outline-variant/30">
                  <p className="font-label-mono text-[8px] text-on-surface-variant uppercase">Core</p>
                  <p className="font-headline-md text-[10px] text-secondary-fixed uppercase">Plateau</p>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-primary/10 border border-primary/30 px-2 py-0.5">
                  <p className="font-label-mono text-[8px] text-primary text-center uppercase">Flow Vector: Inward</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md mt-2">
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Surface Temp</p>
              <div className="w-full bg-surface-container h-1 mt-1">
                <div className="h-full bg-primary" style={{ width: "85%" }}></div>
              </div>
            </div>
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Core Temp</p>
              <div className="w-full bg-surface-container h-1 mt-1">
                <div className="h-full bg-secondary-fixed" style={{ width: "94%" }}></div>
              </div>
            </div>
          </div>
        </ForgeCard>

        {/* Equilibrium Established callout */}
        <ForgeCard>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 border border-secondary-fixed flex items-center justify-center text-secondary-fixed ember-glow flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">science</span>
            </div>
            <h3 className="font-headline-md text-secondary-fixed text-xl uppercase leading-none">
              Equilibrium Established
            </h3>
          </div>
          <p className="font-label-mono text-[9px] text-on-surface-variant leading-relaxed uppercase">
            Convective heat flow has equilibrated. Fiber contraction relaxed. Core moisture redistribution vectors
            stabilizing. <span className="text-primary font-bold">Ready to slice.</span>
          </p>
        </ForgeCard>

        {/* Delta carryover details */}
        <ForgeCard title="Carryover Thermodynamics">
          <ForgeKeyValueList
            items={[
              { label: "INITIAL PULL", value: `${pullTempF}°F Core` },
              { label: "NET CARRYOVER RISE", value: `+${peakRestTempF - pullTempF}°F`, valueColor: "secondary" },
              { label: "CARRYOVER EFFICIENCY", value: "98.4%", valueColor: "green" },
            ]}
          />
        </ForgeCard>

        {/* CTA */}
        <button
          type="button"
          onClick={handleEndCook}
          className="w-full bg-primary-container hover:brightness-110 active:scale-[0.98] transition-all py-md flex items-center justify-center gap-3 group ember-glow"
        >
          <span className="font-headline-lg text-2xl text-on-primary-container uppercase tracking-wider">
            Begin Carving
          </span>
          <span className="material-symbols-outlined text-on-primary-container group-hover:translate-x-2 transition-transform">
            restaurant
          </span>
        </button>
      </aside>
    </>
  );
}
