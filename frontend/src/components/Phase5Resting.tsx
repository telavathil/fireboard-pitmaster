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
    peakRestTempC,
    restDurationSeconds,
    formatStopwatch,
  } = useCookSession();

  const peakRestTempF = Math.round(peakRestTempC * 9/5 + 32);

  return (
    <>
      {/* Left Column: Live Thermographic WebGL Visualizer */}
      <section className="col-span-8 flex flex-col gap-md h-full">
        <ForgeCard
          grow
          layout="column-between"
          minHeight="tall"
          title={
            <div>
              <h2 className="font-label-mono text-tertiary-fixed text-xs uppercase tracking-[0.2em]">
                Thermal Equilibrium Modeling
              </h2>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase mt-1">
                SIMULATING CORE GRADIENT MOLECULAR CONDUCTION
              </p>
            </div>
          }
          headerExtra={
            <div className="flex gap-md font-label-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="uppercase text-[9px]">SOLVING SCHRÖDINGER EQUATIONS</span>
              </div>
            </div>
          }
        >
          {/* WebGL container */}
          <div className="flex-grow border border-outline-variant/30 relative overflow-hidden min-h-[220px] bg-background mt-md">
            <div className="absolute inset-0">
              <WebGLShader />
            </div>

            {/* SVG overlay to render cross-sections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 300">
              {/* Axes lines */}
              <line x1="100" y1="150" x2="700" y2="150" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="400" y1="50" x2="400" y2="250" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Probe sensor indicators */}
              <circle cx="400" cy="150" r="4" fill="#FF4D00" className="animate-pulse" />
              <circle cx="280" cy="150" r="3" fill="#ffe16d" />
              <circle cx="520" cy="150" r="3" fill="#ffe16d" />

              <text x="400" y="140" fill="#FF4D00" fontSize="8" fontFamily="monospace" textAnchor="middle" letterSpacing="1">CORE NODE</text>
              <text x="280" y="140" fill="#ffe16d" fontSize="8" fontFamily="monospace" textAnchor="middle" letterSpacing="1">MID-OUTER</text>
              <text x="520" y="140" fill="#ffe16d" fontSize="8" fontFamily="monospace" textAnchor="middle" letterSpacing="1">SURFACE</text>

              <text x="20" y="30" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" letterSpacing="1">X-AXIS WIDTH PROFILE</text>
              <text x="20" y="45" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="monospace" letterSpacing="1">GRADIENT VECTOR RESOLUTION: 256PTS</text>
            </svg>
          </div>
        </ForgeCard>

        <div className="grid grid-cols-3 gap-md">
          <ForgeStat
            icon="thermometer"
            iconColor="primary"
            label="Core Temp"
            value={`${coreTempF}°F`}
          />
          <ForgeStat
            icon="trending_down"
            iconColor="secondary"
            label="Peak Carryover Temp"
            value={`${peakRestTempF}°F`}
          />
          <ForgeStat
            icon="track_changes"
            iconColor="outline"
            label="Target Temperature"
            value={`${targetTempFDisplay}°F`}
          />
        </div>
      </section>

      {/* Right Column: Resting timer widgets */}
      <aside className="col-span-4 flex flex-col gap-md h-full justify-between">
        {/* Rest Duration Stopwatch */}
        <ForgeCard
          grow
          centered
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
        </ForgeCard>

        {/* Delta carryover details */}
        <ForgeCard title="Carryover Thermodynamics">
          <ForgeKeyValueList
            items={[
              { label: "INITIAL PULL", value: "191°F Core" },
              { label: "NET CARRYOVER RISE", value: `+${peakRestTempF - 191}°F`, valueColor: "secondary" },
              { label: "CARRYOVER EFFICIENCY", value: "98.4%", valueColor: "green" },
            ]}
          />
        </ForgeCard>

        {/* Resting status logs */}
        <ForgeCard title="Resting logs">
          <p className="font-label-mono text-[9px] text-on-surface-variant leading-relaxed uppercase mt-4">
            Convective heat flow has equilibrated. Fiber contraction relaxed. Core moisture redistribution vectors stabilizing. Estimated carving readiness: 20 mins.
          </p>
        </ForgeCard>
      </aside>
    </>
  );
}
