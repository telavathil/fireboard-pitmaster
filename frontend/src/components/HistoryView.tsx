"use client";

import React from "react";

export default function HistoryView() {
  return (
    <>
      {/* Left Column - Past Sessions */}
      <div className="col-span-8 flex flex-col gap-md">
        <div className="forge-surface p-md">
          <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-sm">SESSION HISTORY LOG</h2>
          <p className="font-label-mono text-xs text-on-surface-variant uppercase">ARCHIVED TEMPERATURE PROFILES AND KINETIC MODELS</p>
        </div>

        {/* Session Cards */}
        <div className="space-y-sm">
          <div className="forge-surface p-md border-l-4 border-primary/50 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-label-mono text-[10px] text-primary uppercase font-bold tracking-widest bg-primary/10 px-2 py-0.5 border border-primary/20">
                  SUCCESSFUL COOK
                </span>
                <h3 className="font-headline-md text-2xl text-on-surface uppercase mt-2">POST OAK SMOKED BRISKET #3</h3>
                <p className="font-label-mono text-[10px] text-on-surface-variant uppercase mt-1">SESSION ID: #BBQ-2026-0618 | DATE: JUNE 18, 2026</p>
              </div>
              <div className="text-right font-label-mono text-xs">
                <p className="text-on-surface">DURATION: 11h 42m</p>
                <p className="text-secondary-fixed mt-1">PEAK INTERNAL: 203°F</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-sm mt-md pt-sm border-t border-outline-variant/30 text-xs font-label-mono">
              <div>
                <span className="text-outline uppercase text-[10px]">Meat Weight</span>
                <p className="text-on-surface mt-1">5.4 kg (11.9 lbs)</p>
              </div>
              <div>
                <span className="text-outline uppercase text-[10px]">Avg Pit Temp</span>
                <p className="text-on-surface mt-1">228°F (Stable)</p>
              </div>
              <div>
                <span className="text-outline uppercase text-[10px]">Equilibrium Peak</span>
                <p className="text-on-surface mt-1">206.4°F (Carryover)</p>
              </div>
            </div>
          </div>

          <div className="forge-surface p-md border-l-4 border-outline relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-label-mono text-[10px] text-outline-variant uppercase tracking-widest bg-surface-container-high px-2 py-0.5 border border-outline-variant/30">
                  COMPLETED
                </span>
                <h3 className="font-headline-md text-2xl text-on-surface uppercase mt-2">HICKORY PEACH PORK SHOULDER #2</h3>
                <p className="font-label-mono text-[10px] text-on-surface-variant uppercase mt-1">SESSION ID: #BBQ-2026-0610 | DATE: JUNE 10, 2026</p>
              </div>
              <div className="text-right font-label-mono text-xs">
                <p className="text-on-surface">DURATION: 8h 15m</p>
                <p className="text-secondary-fixed mt-1">PEAK INTERNAL: 205°F</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-sm mt-md pt-sm border-t border-outline-variant/30 text-xs font-label-mono">
              <div>
                <span className="text-outline uppercase text-[10px]">Meat Weight</span>
                <p className="text-on-surface mt-1">3.8 kg (8.4 lbs)</p>
              </div>
              <div>
                <span className="text-outline uppercase text-[10px]">Avg Pit Temp</span>
                <p className="text-on-surface mt-1">250°F (Hot & Fast)</p>
              </div>
              <div>
                <span className="text-outline uppercase text-[10px]">Equilibrium Peak</span>
                <p className="text-on-surface mt-1">208.1°F (Carryover)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Historical Analytics */}
      <div className="col-span-4 flex flex-col gap-md">
        <div className="forge-surface p-md">
          <h3 className="font-label-mono text-xs text-on-surface-variant mb-4 uppercase tracking-wider">Historical Analytics</h3>
          <div className="space-y-sm text-xs font-label-mono">
            <div className="flex justify-between">
              <span className="text-outline">TOTAL COOK TIME</span>
              <span className="text-on-surface">42.6 HOURS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">STALL COVERS</span>
              <span className="text-on-surface">3 SESSIONS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">PREDICTION ERROR</span>
              <span className="text-primary font-bold">± 4.2 MINS</span>
            </div>
            <div className="flex justify-between border-t border-outline-variant/30 pt-xs">
              <span className="text-outline">FAVORITE PRESET</span>
              <span className="text-secondary-fixed font-bold">BEEF BRISKET</span>
            </div>
          </div>
        </div>

        <div className="forge-surface p-md flex flex-col justify-center">
          <p className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] mb-4 font-bold">Wood Fuel Distribution</p>
          <div className="space-y-xs font-label-mono text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>POST OAK</span>
                <span>70%</span>
              </div>
              <div className="w-full bg-surface-container-high h-2">
                <div className="bg-primary h-full" style={{ width: "70%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>HICKORY</span>
                <span>20%</span>
              </div>
              <div className="w-full bg-surface-container-high h-2">
                <div className="bg-secondary-fixed h-full" style={{ width: "20%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>PEACH WOOD</span>
                <span>10%</span>
              </div>
              <div className="w-full bg-surface-container-high h-2">
                <div className="bg-outline h-full" style={{ width: "10%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
