"use client";

import React from "react";
import WebGLShader from "./WebGLShader";
import { useCookSession } from "../context/CookSessionContext";

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
        <div className="forge-surface p-md flex-grow flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-end mb-md">
            <div>
              <h2 className="font-label-mono text-tertiary-fixed text-xs uppercase tracking-[0.2em]">Thermal Equilibrium Modeling</h2>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase mt-1">SIMULATING CORE GRADIENT MOLECULAR CONDUCTION</p>
            </div>
            <div className="flex gap-md font-label-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="uppercase text-[9px]">SOLVING SCHRÖDINGER EQUATIONS</span>
              </div>
            </div>
          </div>

          {/* WebGL container */}
          <div className="flex-grow border border-outline-variant/30 relative overflow-hidden min-h-[220px] bg-background">
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
        </div>

        <div className="grid grid-cols-3 gap-md">
          <div className="forge-surface p-4 flex gap-4 items-center">
            <span className="material-symbols-outlined text-primary text-3xl">thermometer</span>
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Core Temp</p>
              <p className="font-headline-md text-xl">{coreTempF}°F</p>
            </div>
          </div>
          <div className="forge-surface p-4 flex gap-4 items-center">
            <span className="material-symbols-outlined text-secondary-fixed text-3xl">trending_down</span>
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Peak Carryover Temp</p>
              <p className="font-headline-md text-xl">{peakRestTempF}°F</p>
            </div>
          </div>
          <div className="forge-surface p-4 flex gap-4 items-center">
            <span className="material-symbols-outlined text-tertiary-fixed text-3xl">track_changes</span>
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Target Temperature</p>
              <p className="font-headline-md text-xl">{targetTempFDisplay}°F</p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Resting timer widgets */}
      <aside className="col-span-4 flex flex-col gap-md h-full justify-between">
        {/* Rest Duration Stopwatch */}
        <div className="forge-surface p-md flex flex-col items-center justify-center flex-grow">
          <p className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] mb-4 font-bold">Equilibrium Resting Phase</p>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-heat"></div>
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
                strokeDashoffset={(2 * Math.PI * 64) * 0.4} // static fill at 60%
                strokeWidth="6"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="font-label-mono text-[9px] text-on-surface-variant">ELAPSED TIME</span>
              <span className="font-display-lg text-3xl font-bold tracking-wider">{formatStopwatch(restDurationSeconds)}</span>
              <span className="font-label-mono text-[8px] text-secondary-fixed mt-1 uppercase font-bold">RESTING ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Delta carryover details */}
        <div className="forge-surface p-md">
          <h3 className="font-label-mono text-xs text-on-surface-variant mb-4 uppercase">Carryover Thermodynamics</h3>
          <div className="space-y-sm text-xs font-label-mono">
            <div className="flex justify-between">
              <span className="text-outline">INITIAL PULL</span>
              <span className="text-on-surface">191°F Core</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">NET CARRYOVER RISE</span>
              <span className="text-secondary-fixed font-bold">+{peakRestTempF - 191}°F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">CARRYOVER EFFICIENCY</span>
              <span className="text-green-500 font-bold">98.4%</span>
            </div>
          </div>
        </div>

        {/* Resting status logs */}
        <div className="forge-surface p-md">
          <h3 className="font-label-mono text-xs text-on-surface-variant mb-4 uppercase">Resting logs</h3>
          <p className="font-label-mono text-[9px] text-on-surface-variant leading-relaxed uppercase">
            Convective heat flow has equilibrated. Fiber contraction relaxed. Core moisture redistribution vectors stabilizing. Estimated carving readiness: 20 mins.
          </p>
        </div>
      </aside>
    </>
  );
}
