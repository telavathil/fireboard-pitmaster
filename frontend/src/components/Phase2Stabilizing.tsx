"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";
import ForgeStat from "./ui/ForgeStat";
import ForgeRadialGauge from "./ui/ForgeRadialGauge";
import ForgeKeyValueList from "./ui/ForgeKeyValueList";

export default function Phase2Stabilizing() {
  const { coreTempF } = useCookSession();

  return (
    <>
      {/* Left Column: Live Chart */}
      <section className="col-span-8 flex flex-col gap-md h-full">
        <ForgeCard
          grow
          layout="column-between"
          minHeight="tall"
          title={
            <div>
              <h2 className="font-label-mono text-tertiary-fixed text-xs uppercase tracking-[0.2em]">
                Live Thermal Analysis
              </h2>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="font-display-lg text-5xl text-on-surface leading-none">{coreTempF}°F</span>
                <span className="font-label-mono text-secondary-fixed-dim text-sm">+0.7°F/min</span>
              </div>
            </div>
          }
          headerExtra={
            <div className="flex gap-md font-label-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-primary"></span>
                <span className="uppercase text-[9px]">RAW SENSOR</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-secondary-fixed"></span>
                <span className="uppercase text-[9px]">SMOOTHED TREND</span>
              </div>
            </div>
          }
        >
          <div className="flex-grow chart-grid border border-outline-variant/30 relative overflow-hidden min-h-[180px] mt-md">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
              <path d="M0,80 Q100,75 200,85 T400,70 T600,65 T800,60 T1000,55" fill="none" stroke="#ffe16d" strokeWidth="2"></path>
              <path d="M0,82 L50,78 L100,85 L150,75 L200,88 L250,82 L300,70 L350,75 L400,65 L450,72 L500,68 L550,60 L600,65 L650,62 L700,55 L750,58 L800,50" fill="none" stroke="#ffb59e" strokeDasharray="2 2" strokeWidth="1.5"></path>
            </svg>
          </div>
        </ForgeCard>

        <div className="grid grid-cols-2 gap-md">
          <ForgeStat
            icon="local_fire_department"
            iconColor="primary"
            label="Ambient Pit Temp"
            value="225°F"
            statusText="STABLE"
            statusColor="stable"
          />
          <ForgeStat
            icon="opacity"
            iconColor="secondary"
            label="Surface Moisture"
            value="64%"
            statusText="DECREASING"
            statusColor="decreasing"
          />
        </div>
      </section>

      {/* Right Column: Widgets */}
      <aside className="col-span-4 flex flex-col gap-md h-full">
        {/* Device Status */}
        <ForgeCard
          title={
            <h3 className="font-label-mono text-xs text-on-surface-variant flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              DEVICE STATUS: ONLINE
            </h3>
          }
        >
          <ForgeKeyValueList
            items={[
              { label: "PROBE MODEL", value: "EMBER-X1 V2.4" },
              {
                label: "SIGNAL STRENGTH",
                value: (
                  <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-primary"></div>
                    <div className="w-1 h-3 bg-primary"></div>
                    <div className="w-1 h-3 bg-primary"></div>
                    <div className="w-1 h-3 bg-outline/30"></div>
                  </div>
                ),
              },
            ]}
          />
        </ForgeCard>

        {/* Active Calibration Gauge */}
        <ForgeCard
          centered
          title={
            <p className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] font-bold">
              Thermal Stabilization
            </p>
          }
        >
          <ForgeRadialGauge
            value={75}
            label="CONFIDENCE"
            centerText="75%"
            statusBadge="STABILIZING"
            animation="pulse"
          />
        </ForgeCard>

        {/* Skeleton/Shimmer boxes */}
        <div className="flex-grow flex flex-col gap-sm">
          <ForgeCard compactPadding>
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 shimmer opacity-50"></div>
              <div className="h-3 w-8 shimmer opacity-30"></div>
            </div>
            <div className="h-6 w-3/4 shimmer opacity-40 mt-1"></div>
          </ForgeCard>
          <ForgeCard compactPadding>
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 shimmer opacity-50"></div>
              <div className="h-3 w-8 shimmer opacity-30"></div>
            </div>
            <div className="h-6 w-1/2 shimmer opacity-40 mt-1"></div>
          </ForgeCard>
        </div>
      </aside>
    </>
  );
}
