"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";

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

  return (
    <>
      {/* Alert Card */}
      <section className="bg-error-container/20 border-2 border-error p-lg flex flex-col gap-md relative overflow-hidden group shrink-0">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-error animate-critical"></div>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-error text-3xl animate-pulse">warning</span>
            <div>
              <h2 className="font-headline-md text-headline-lg uppercase text-on-error-container leading-none">TARGET THRESHOLD REACHED</h2>
              <p className="font-label-mono text-xs text-error uppercase mt-2 tracking-wide font-bold">PULL AT {pullTempF}°F</p>
            </div>
          </div>
        </div>
        
        <p className="text-on-error-container font-body-md text-base opacity-90 max-w-2xl leading-relaxed mt-2 uppercase">
          Remove from heat now. Predicted carryover will cook the meat to your target doneness of {targetTempFDisplay}°F during rest.
        </p>

        <div className="grid grid-cols-4 gap-md border-t border-error/30 pt-md mt-md">
          <div className="bg-background/40 p-4 border border-error/20 flex flex-col justify-between">
            <span className="font-label-mono text-[10px] text-on-surface-variant uppercase block">TIME TO PULL</span>
            <span className="font-headline-lg text-4xl text-error tracking-widest leading-none mt-2 block">{formatStopwatch(pullTimeSeconds)}</span>
          </div>
          <div className="bg-background/40 p-4 border border-error/20 flex flex-col justify-between">
            <span className="font-label-mono text-[10px] text-on-surface-variant uppercase block">CURRENT CORE</span>
            <span className="font-headline-lg text-4xl text-on-surface leading-none mt-2 block">{coreTempF}°F</span>
          </div>
          <div className="bg-background/40 p-4 border border-error/20 flex flex-col justify-between">
            <span className="font-label-mono text-[10px] text-on-surface-variant uppercase block">PROJECTED RISE</span>
            <span className="font-headline-lg text-4xl text-secondary-fixed leading-none mt-2 block">+{carryoverRiseF}°F</span>
          </div>
          <div className="bg-background/40 p-4 border border-error/20 flex flex-col justify-between">
            <span className="font-label-mono text-[10px] text-on-surface-variant uppercase block">FINAL TARGET</span>
            <span className="font-headline-lg text-4xl text-primary-container leading-none mt-2 block">{targetTempFDisplay}°F</span>
          </div>
        </div>
      </section>

      {/* Detail widgets grid layout */}
      <div className="grid grid-cols-12 gap-md flex-grow items-start min-h-[300px]">
        {/* Trajectory Plot Column */}
        <div className="col-span-8 h-full">
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
        <section className="col-span-4 flex flex-col gap-md h-full justify-between min-h-[260px]">
          <ForgeCard title="AMBIENT PIT TEMP">
            <div className="flex items-baseline gap-2 mt-4">
              <span className="font-headline-md text-3xl text-on-surface">226°F</span>
              <span className="font-label-mono text-xs text-secondary-fixed font-bold uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">oven_gen</span> STATUS: STABLE
              </span>
            </div>
            <div className="mt-xs text-[10px] text-on-surface-variant font-label-mono uppercase flex justify-between">
              <span>RATE OF RISE</span>
              <span className="text-secondary-fixed">+0.0°F/min</span>
            </div>
            <div className="mt-1 text-[10px] text-on-surface-variant font-label-mono uppercase flex justify-between">
              <span>TREND</span>
              <span className="text-primary font-bold flex items-center gap-0.5">
                <span className="material-symbols-outlined text-xs">trending_up</span> ACCELERATING
              </span>
            </div>
          </ForgeCard>

          <ForgeCard>
            <div className="flex flex-col gap-sm">
              <button
                onClick={() => handleUpdateStatus("resting")}
                className="action-btn action-btn-accent w-full"
              >
                START RESTING TIMER
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
      <footer className="grid grid-cols-4 gap-md shrink-0">
        <div className="forge-surface p-4 flex gap-4 items-center">
          <span className="material-symbols-outlined text-outline text-2xl">timer</span>
          <div>
            <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">ELAPSED TIME</p>
            <p className="font-headline-md text-lg">14H 22M</p>
          </div>
        </div>
        <div className="forge-surface p-4 flex gap-4 items-center">
          <span className="material-symbols-outlined text-outline text-2xl">propane_tank</span>
          <div>
            <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">FUEL LEVEL</p>
            <p className="font-headline-md text-lg">42%</p>
          </div>
        </div>
        <div className="forge-surface p-4 flex gap-4 items-center">
          <span className="material-symbols-outlined text-outline text-2xl">wifi</span>
          <div>
            <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">SIGNAL</p>
            <p className="font-headline-md text-lg">-62 DBM</p>
          </div>
        </div>
        <div className="forge-surface p-4 flex gap-4 items-center cursor-pointer hover:border-primary group transition-colors">
          <span className="material-symbols-outlined text-outline group-hover:text-primary text-2xl">share</span>
          <div>
            <p className="font-label-mono text-[9px] text-on-surface-variant group-hover:text-primary uppercase">SHARE LIVE</p>
            <p className="font-headline-md text-lg group-hover:text-primary uppercase text-xs tracking-wide">COPY LINK</p>
          </div>
        </div>
      </footer>
    </>
  );
}
