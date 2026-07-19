"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";
import ForgeStat from "./ui/ForgeStat";
import ForgeRadialGauge from "./ui/ForgeRadialGauge";
import ForgeKeyValueList from "./ui/ForgeKeyValueList";

export default function Phase3Stall() {
  const {
    coreTempF,
    moistureBudget,
    spritzCount,
    handleSpritz,
    activeSession,
    history,
    getSvgPathF,
    getSvgPathAmbientF,
    minTempF,
    maxTempF,
  } = useCookSession();

  const sessionLabel = activeSession
    ? `${activeSession.cut_type.toUpperCase().replace(/\s+/g, "_")}_${activeSession.id.slice(-4).toUpperCase()}`
    : "SESSION";

  return (
    <>
      {/* Left Column: Live Chart with Stall overlay */}
      <section className="col-span-12 md:col-span-8 flex flex-col gap-md h-full">
        {/* Evaporative Stall Detected Banner */}
        <div className="stall-banner p-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl animate-pulse">warning</span>
            <div>
              <h2 className="font-headline-md text-xl text-on-surface uppercase leading-none">Evaporative Stall Detected</h2>
              <p className="font-label-mono text-[10px] text-on-surface-variant uppercase mt-1">Latent heat of vaporization matches heat input. Temperature rise flatlining.</p>
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/30 px-3 py-1 font-label-mono text-xs text-primary font-bold uppercase">
            ACTIVE SESSION: {sessionLabel}
          </div>
        </div>

        <ForgeCard
          grow
          layout="column-between"
          minHeight="short"
          title={
            <div>
              <h2 className="font-label-mono text-tertiary-fixed text-xs uppercase tracking-[0.2em]">
                Stall Plateau Tracking
              </h2>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="font-display-lg text-5xl text-on-surface leading-none">{coreTempF}°F</span>
                <span className="font-label-mono text-primary text-xs uppercase font-bold px-1.5 py-0.5 border border-primary/20 bg-primary/5 animate-pulse">
                  PLATEAU ACTIVE
                </span>
              </div>
            </div>
          }
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
          <div className="flex-grow chart-grid border border-outline-variant/30 relative overflow-hidden min-h-[140px] mt-md">
            {/* Shaded stall zone */}
            <div className="absolute inset-y-0 left-[35%] right-[25%] stall-zone-bg border-l border-r border-primary/30 flex items-center justify-center z-10">
              <span className="font-label-mono text-[9px] text-primary/70 uppercase tracking-widest -rotate-90">STALL ZONE</span>
            </div>

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

            <div className="absolute bottom-1 left-2 font-label-mono text-[9px] text-on-surface-variant uppercase z-10">Stall Entry</div>
            <div className="absolute bottom-1 right-2 font-label-mono text-[9px] text-on-surface-variant uppercase z-10">Live Now</div>
          </div>
        </ForgeCard>

        <div className="grid grid-cols-2 gap-md">
          <ForgeStat
            icon="thermostat"
            iconColor="primary"
            label="Pit Temp"
            value="228°F"
            statusText="STABLE"
            statusColor="decreasing"
          />
          <ForgeStat
            icon="humidity_percentage"
            iconColor="secondary"
            label="Relative Humidity"
            value="78%"
            statusText="HIGH"
            statusColor="high"
          />
        </div>
      </section>

      {/* Right Column: Widgets */}
      <aside className="col-span-12 md:col-span-4 flex flex-col gap-md h-full justify-between">
        {/* Moisture Budget Gauge */}
        <ForgeCard
          centered
          title={
            <h3 className="font-label-mono text-xs text-on-surface-variant uppercase w-full text-center">
              Bark Moisture Budget
            </h3>
          }
        >
          <ForgeRadialGauge
            value={moistureBudget}
            label="Remaining"
            centerText={`${moistureBudget}%`}
          />
          <div className="flex justify-between w-full mt-sm">
            <span className="font-label-mono text-[10px] text-secondary-fixed uppercase">Saturated</span>
            <span className="font-label-mono text-[10px] text-primary uppercase">Bark Formed</span>
          </div>

          <p className="font-label-mono text-[9px] text-on-surface-variant leading-relaxed uppercase mt-md">
            If moisture drops below 25%, bark surface risks drying out completely, halting convective heat absorption. Click below to spritz surface.
          </p>
        </ForgeCard>

        {/* Spritz Button Widget */}
        <ForgeCard
          centered
          title={
            <p className="font-label-mono text-[10px] text-secondary-fixed uppercase tracking-[0.2em] font-bold">
              Bark Hydration Controls
            </p>
          }
        >
          <button
            onClick={handleSpritz}
            className="w-full mt-4 py-3 bg-transparent border-2 border-secondary text-secondary hover:bg-secondary/10 active:scale-[0.98] transition-all font-headline-md text-xl tracking-widest flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
            FORCE BREAKOUT (SPRITZ)
          </button>

          <div className="flex justify-between w-full mt-md text-xs font-label-mono uppercase pt-sm border-t border-outline-variant/30">
            <span className="text-outline">TOTAL SPRITZ COUNT</span>
            <span className="text-on-surface font-bold">{spritzCount} TIMES</span>
          </div>
        </ForgeCard>

        {/* Kalman model accuracy */}
        <ForgeCard title="Stall Phase Status">
          <ForgeKeyValueList
            items={[
              { label: "STALL ANGLE", value: "0.02°/min (FLAT)" },
              { label: "EST. BREAKOUT", value: "172°F Core", valueColor: "secondary" },
            ]}
          />
        </ForgeCard>
      </aside>
    </>
  );
}
