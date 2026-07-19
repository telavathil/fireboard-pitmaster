"use client";

import React from "react";
import ForgeCard from "./ui/ForgeCard";
import ForgeKeyValueList from "./ui/ForgeKeyValueList";
import ForgeStat from "./ui/ForgeStat";

export default function HistoryView() {
  return (
    <>
      {/* Left Column - Past Sessions */}
      <div className="col-span-12 md:col-span-8 flex flex-col gap-md">
        <ForgeCard
          title="SESSION HISTORY LOG"
          subtitle="ARCHIVED TEMPERATURE PROFILES AND KINETIC MODELS"
        />

        {/* Session Cards */}
        <div className="space-y-sm">
          <ForgeCard
            hasHighlight
            highlightColor="bg-primary/50"
          >
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
          </ForgeCard>

          <ForgeCard
            hasHighlight
            highlightColor="bg-outline"
          >
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
          </ForgeCard>
        </div>
      </div>

      {/* Right Column - Historical Analytics */}
      <div className="col-span-12 md:col-span-4 flex flex-col gap-md">
        <ForgeCard title="Historical Analytics">
          <ForgeKeyValueList
            items={[
              { label: "TOTAL COOK TIME", value: "42.6 HOURS" },
              { label: "STALL COVERS", value: "3 SESSIONS" },
              { label: "PREDICTION ERROR", value: "± 4.2 MINS", valueColor: "primary" },
              { label: "FAVORITE PRESET", value: "BEEF BRISKET", valueColor: "secondary" },
            ]}
          />
        </ForgeCard>

        <ForgeCard title="Wood Fuel Distribution">
          <div className="space-y-xs font-label-mono text-xs mt-4">
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
        </ForgeCard>
      </div>
    </>
  );
}
