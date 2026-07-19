"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";
import ForgeStat from "./ui/ForgeStat";
import ForgeKeyValueList from "./ui/ForgeKeyValueList";

export default function Phase4Pull() {
  const {
    coreTempF,
    targetTempFDisplay,
    carryoverRiseF,
    pullTempF,
    pullTimeSeconds,
    handleUpdateStatus,
    formatStopwatch,
  } = useCookSession();

  const [alarmSilenced, setAlarmSilenced] = React.useState(false);

  return (
    <>
      {/* Alert Card */}
      <section className="bg-surface-container rounded-none border border-error p-lg relative overflow-hidden group shrink-0 shadow-[0_0_12px_rgba(255,77,0,0.4)]">
        <div className="scanline"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-lg">
          <div className="space-y-sm max-w-2xl">
            <div className={`flex items-center gap-xs text-primary ${alarmSilenced ? "" : "animate-pulse"}`}>
              <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <span className="font-label-mono tracking-widest uppercase text-sm">Target Threshold Reached</span>
            </div>
            <h1 className="font-display-lg text-4xl sm:text-5xl md:text-6xl lg:text-[80px] text-primary leading-none uppercase italic">
              PULL AT {pullTempF}°F
            </h1>
            <p className="font-body-lg text-on-surface-variant text-base">
              Remove from heat now. Predicted carryover will cook the meat to your target doneness of <span className="text-secondary font-bold">{targetTempFDisplay}°F</span> during rest.
            </p>
          </div>

          <div className="flex flex-col items-center bg-black p-md border border-outline-variant w-full md:w-36">
            <span className="font-label-mono text-on-surface-variant text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">Time to Pull</span>
            <div className="font-display-lg text-[48px] text-secondary leading-none mt-xs">{formatStopwatch(pullTimeSeconds)}</div>
            <div className="w-24 h-1 bg-surface-container-highest mt-md overflow-hidden">
              <div className={`h-full bg-secondary w-2/3 ${alarmSilenced ? "" : "animate-pulse"}`}></div>
            </div>
          </div>
        </div>

        {/* Carryover Expansion Gauge */}
        <div className="mt-xl relative pt-lg border-t border-outline-variant/30">
          <div className="flex justify-between font-label-mono text-[10px] text-on-surface-variant mb-xs">
            <span>CURRENT CORE</span>
            <span className="text-primary">PROJECTED RISE</span>
            <span>FINAL TARGET</span>
          </div>
          <div className="h-8 w-full bg-surface-container-highest flex border border-outline-variant">
            <div className="h-full bg-primary-container relative flex items-center justify-end pr-2" style={{ width: "70%" }}>
              <div className="absolute -top-6 right-0 font-headline-md text-xl text-primary">{coreTempF}°F</div>
            </div>
            <div className="h-full bg-gradient-to-r from-primary-container to-secondary-container relative flex items-center justify-end pr-2" style={{ width: "20%" }}>
              <div className="absolute -top-6 right-0 font-headline-md text-xl text-secondary-fixed">+{carryoverRiseF}°F</div>
            </div>
            <div className="h-full bg-surface-bright/20 flex-1 relative border-l border-dashed border-secondary flex items-center justify-end pr-2">
              <div className="absolute -top-6 right-0 font-headline-md text-xl text-secondary-fixed">{targetTempFDisplay}°F</div>
            </div>
          </div>
        </div>
      </section>

      {/* Detail widgets grid layout */}
      <div className="grid grid-cols-12 gap-md flex-grow items-start min-h-[300px]">
        {/* Trajectory Plot Column */}
        <div className="col-span-12 md:col-span-8 h-full">
          <ForgeCard
            grow
            layout="column-between"
            minHeight="medium"
            title="CORE TEMP TRAJECTORY"
            headerExtra={<span className="font-label-mono text-[9px] text-error uppercase font-bold animate-pulse">LIVE DATA</span>}
          >
            <div className="flex-grow chart-grid border border-outline-variant/30 relative overflow-hidden min-h-[140px] flex items-center justify-center mt-sm">
              <div className="absolute inset-y-0 right-[20%] w-[1px] bg-error/40 border-dashed flex items-center justify-center">
                <span className="font-label-mono text-[8px] text-error/80 uppercase -rotate-90 whitespace-nowrap tracking-widest mt-12">PULL POINT</span>
              </div>
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                <path d="M0,320 L250,280 L500,200 L750,120 L800,105 L1000,90" fill="none" stroke="#FF4D00" strokeWidth="3"></path>
                <circle cx="800" cy="105" r="5" fill="#FF4D00"></circle>
              </svg>
              <div className="absolute bottom-xs left-xs right-xs flex justify-between font-label-mono text-[8px] text-on-surface-variant">
                <span>-15 MIN</span>
                <span>-10 MIN</span>
                <span>-5 MIN</span>
                <span>PULL POINT</span>
              </div>
            </div>
          </ForgeCard>
        </div>

        {/* Ambient Temperature Gauge Column */}
        <section className="col-span-12 md:col-span-4 flex flex-col gap-md h-full justify-between min-h-[260px]">
          <ForgeCard title="AMBIENT PIT TEMP">
            <div className="flex items-baseline gap-2 mt-4">
              <span className="font-headline-md text-3xl text-on-surface">226°F</span>
              <span className="font-label-mono text-xs text-secondary-fixed font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">oven_gen</span> STATUS: STABLE
              </span>
            </div>
            <ForgeKeyValueList
              items={[
                { label: "RATE OF RISE", value: "+0.0°F/min", valueColor: "secondary" },
                {
                  label: "TREND",
                  value: (
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">trending_up</span> ACCELERATING
                    </span>
                  ),
                  valueColor: "primary",
                },
              ]}
              compact
            />
          </ForgeCard>

          <ForgeCard>
            <div className="flex flex-col gap-sm">
              <button
                type="button"
                onClick={() => setAlarmSilenced(true)}
                disabled={alarmSilenced}
                className="w-full py-3 bg-secondary text-on-secondary font-headline-md text-xl tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {alarmSilenced ? "ALARM SILENCED" : "SILENCE ALARM"}
              </button>
              <button
                onClick={() => handleUpdateStatus("resting")}
                className="action-btn-outline w-full"
              >
                LOG WEIGHT & PULL
              </button>
            </div>
          </ForgeCard>
        </section>
      </div>

      {/* Footer statistics widgets row layout */}
      <footer className="grid grid-cols-2 md:grid-cols-4 gap-md shrink-0">
        <ForgeStat
          icon="timer"
          label="ELAPSED TIME"
          value="14H 22M"
        />
        <ForgeStat
          icon="propane_tank"
          label="FUEL LEVEL"
          value="42%"
        />
        <ForgeStat
          icon="wifi"
          label="SIGNAL"
          value="-62 DBM"
        />
        <ForgeStat
          icon="share"
          label="SHARE LIVE"
          value={<span className="text-xs tracking-wide uppercase">COPY LINK</span>}
          interactive
          onClick={() => {}}
        />
      </footer>
    </>
  );
}
