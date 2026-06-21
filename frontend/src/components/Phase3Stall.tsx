"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";

export default function Phase3Stall() {
  const {
    coreTempF,
    moistureBudget,
    spritzCount,
    handleSpritz,
  } = useCookSession();

  return (
    <>
      {/* Left Column: Live Chart with Stall overlay */}
      <section className="col-span-8 flex flex-col gap-md h-full">
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
            EST. DURATION: 2.5 HRS
          </div>
        </div>

        <div className="forge-surface p-md flex-grow flex flex-col justify-between min-h-[220px]">
          <div className="flex justify-between items-end mb-md">
            <div>
              <h2 className="font-label-mono text-tertiary-fixed text-xs uppercase tracking-[0.2em]">Stall Plateau Tracking</h2>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="font-display-lg text-5xl text-on-surface leading-none">{coreTempF}°F</span>
                <span className="font-label-mono text-primary text-xs uppercase font-bold px-1.5 py-0.5 border border-primary/20 bg-primary/5 animate-pulse">PLATEAU ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="flex-grow chart-grid border border-outline-variant/30 relative overflow-hidden min-h-[140px]">
            {/* Shaded stall zone */}
            <div className="absolute inset-y-0 left-[35%] right-[25%] stall-zone-bg border-l border-r border-primary/30 flex items-center justify-center">
              <span className="font-label-mono text-[9px] text-primary/70 uppercase tracking-widest -rotate-90">STALL ZONE</span>
            </div>
            
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
              <path d="M0,280 Q200,240 350,180 L650,180 Q800,120 1000,50" fill="none" stroke="#FF4D00" strokeWidth="3"></path>
              <circle cx="500" cy="180" r="5" fill="#FF4D00"></circle>
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div className="forge-surface p-4 flex gap-4 items-center">
            <span className="material-symbols-outlined text-primary text-3xl">thermostat</span>
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Pit Temp</p>
              <p className="font-headline-md text-xl">228°F <span className="text-[10px] font-label-mono text-outline uppercase ml-1">STABLE</span></p>
            </div>
          </div>
          <div className="forge-surface p-4 flex gap-4 items-center">
            <span className="material-symbols-outlined text-secondary-fixed text-3xl">humidity_percentage</span>
            <div>
              <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Relative Humidity</p>
              <p className="font-headline-md text-xl">78% <span className="text-[10px] font-label-mono text-secondary-fixed uppercase ml-1">HIGH</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Column: Widgets */}
      <aside className="col-span-4 flex flex-col gap-md h-full justify-between">
        {/* Moisture Budget Gauge */}
        <div className="forge-surface p-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-label-mono text-xs text-on-surface-variant uppercase">Bark Moisture Budget</h3>
            <span className="font-label-mono text-xs text-primary font-bold">{moistureBudget}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-surface-container-high h-3 border border-outline-variant/30 mb-sm">
            <div
              className="bg-primary h-full transition-all duration-500 shadow-[0_0_10px_rgba(255,87,26,0.4)]"
              style={{ width: `${moistureBudget}%` }}
            ></div>
          </div>

          <p className="font-label-mono text-[9px] text-on-surface-variant leading-relaxed uppercase">
            If moisture drops below 25%, bark surface risks drying out completely, halting convective heat absorption. Click below to spritz surface.
          </p>
        </div>

        {/* Spritz Button Widget */}
        <div className="forge-surface p-md flex flex-col items-center justify-center">
          <p className="font-label-mono text-[10px] text-secondary-fixed uppercase tracking-[0.2em] mb-4 font-bold">Bark Hydration Controls</p>
          
          <button
            onClick={handleSpritz}
            className="action-btn action-btn-secondary py-sm"
          >
            SPRITZ COOKING SURFACE
          </button>
          
          <div className="flex justify-between w-full mt-md text-xs font-label-mono uppercase pt-sm border-t border-outline-variant/30">
            <span className="text-outline">TOTAL SPRITZ COUNT</span>
            <span className="text-on-surface font-bold">{spritzCount} TIMES</span>
          </div>
        </div>

        {/* Kalman model accuracy */}
        <div className="forge-surface p-md">
          <h3 className="font-label-mono text-xs text-on-surface-variant mb-4 uppercase">Stall Phase Status</h3>
          <div className="space-y-sm text-xs font-label-mono">
            <div className="flex justify-between">
              <span className="text-outline">STALL ANGLE</span>
              <span className="text-on-surface">0.02°/min (FLAT)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">EST. BREAKOUT</span>
              <span className="text-secondary-fixed font-bold">172°F Core</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
