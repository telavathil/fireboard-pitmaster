"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";

const COOKER_PROFILES = [
  { id: "kamado", name: "Kamado", icon: "oven_gen", desc: "High Retention / Low Airflow", humidity: 85 },
  { id: "pellet", name: "Pellet Grill", icon: "heat_pump", desc: "Forced Convection / Medium Airflow", humidity: 40 },
  { id: "offset", name: "Offset Smoker", icon: "air", desc: "Natural Convection / High Airflow", humidity: 20 },
  { id: "electric", name: "Electric", icon: "bolt", desc: "Stagnant Air / Ultra-High Retention", humidity: 95 },
];

export default function Phase1Setup() {
  const {
    targetTempF,
    setTargetTempF,
    meatType,
    setMeatType,
    cutType,
    setCutType,
    cookerType,
    setCookerType,
    weightKg,
    setWeightKg,
    thicknessMm,
    setThicknessMm,
    deviceId,
    setDeviceId,
    deviceName,
    setDeviceName,
    isCreatingSession,
    handleCreateSession,
    applyPresetF,
  } = useCookSession();

  // Handle any local errors
  const sessionError = null;

  const thermalInertia = ((parseFloat(weightKg) || 0) * 2.74).toFixed(2);

  return (
    <>
      {/* Page Header */}
      <div className="col-span-12 mb-sm">
        <h1 className="font-display-lg text-headline-lg text-primary uppercase leading-none">Pre-Cook Setup</h1>
        <p className="font-label-mono text-xs text-on-surface-variant uppercase tracking-wide mt-2">
          Calibrating thermal kinetics for {deviceName || "new session"}
        </p>
      </div>

      {/* Target Doneness (Wide Panel) */}
      <div className="col-span-12 md:col-span-8 flex flex-col gap-md">
        <ForgeCard
          title="TARGET DONENESS"
          subtitle="MOLECULAR PROTEIN RECONSTRUCT PARAMETERS"
          hasHighlight
          grow
          layout="column-between"
          headerExtra={
            <div className="text-right">
              <span className="font-display-lg text-[64px] text-primary-container leading-none font-bold">
                {targetTempF}°F
              </span>
              <p className="font-label-mono text-xs text-on-surface-variant uppercase mt-1">
                INTERNAL CORE TARGET
              </p>
            </div>
          }
        >
          <div className="flex flex-col gap-md my-md">
            <div className="flex flex-wrap gap-xs">
              <button
                type="button"
                onClick={() => applyPresetF("beef", "Brisket Flat", 203)}
                className={`forge-btn ${
                  meatType === "beef" && targetTempF === 203 ? "forge-btn-active" : ""
                }`}
              >
                BRISKET (203°F)
              </button>
              <button
                type="button"
                onClick={() => applyPresetF("pork", "Shoulder Butt", 205)}
                className={`forge-btn ${
                  meatType === "pork" && targetTempF === 205 ? "forge-btn-active" : ""
                }`}
              >
                PORK BUTT (205°F)
              </button>
              <button
                type="button"
                onClick={() => applyPresetF("beef", "Prime Ribeye", 135)}
                className={`forge-btn ${
                  meatType === "beef" && targetTempF === 135 ? "forge-btn-active" : ""
                }`}
              >
                MEDIUM RARE (135°F)
              </button>
              <button
                type="button"
                onClick={() => applyPresetF("poultry", "Whole Bird", 165)}
                className={`forge-btn ${
                  meatType === "poultry" && targetTempF === 165 ? "forge-btn-active" : ""
                }`}
              >
                POULTRY (165°F)
              </button>
              <button
                type="button"
                onClick={() => applyPresetF("beef", "Custom", 195)}
                className="forge-btn"
              >
                CUSTOM
              </button>
            </div>

            <div className="py-xs">
              <input
                type="range"
                min="100"
                max="220"
                value={targetTempF}
                onChange={(e) => setTargetTempF(parseInt(e.target.value, 10))}
                className="w-full h-1 cursor-pointer accent-primary bg-surface-container-high"
              />
              <div className="flex justify-between mt-sm font-label-mono text-[10px] text-on-surface-variant">
                <span>100°F (RAW COLD)</span>
                <span>165°F (STALL THRESHOLD)</span>
                <span>212°F (BOILING POINT)</span>
              </div>
            </div>
          </div>
        </ForgeCard>
      </div>

      {/* Channel Mapping (Quick Action) */}
      <div className="col-span-12 md:col-span-4 flex flex-col gap-md">
        <ForgeCard title="CHANNEL MAPPING" grow layout="column-between">
          <form onSubmit={handleCreateSession} className="flex flex-col h-full justify-between mt-md">
            <div className="space-y-sm">
              <div className="flex items-center justify-between p-sm bg-surface-container-lowest border border-outline-variant">
                <div className="flex items-center gap-sm">
                  <span className="w-3 h-3 bg-primary ember-glow inline-block"></span>
                  <span className="font-label-mono text-xs uppercase">Probe 01 (Core)</span>
                </div>
                <span className="material-symbols-outlined text-primary text-lg">link</span>
              </div>
              <div className="flex items-center justify-between p-sm bg-surface-container-lowest border border-outline-variant opacity-60">
                <div className="flex items-center gap-sm">
                  <span className="w-3 h-3 bg-on-surface-variant inline-block"></span>
                  <span className="font-label-mono text-xs uppercase">Probe 02 (Ambient)</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-lg">link_off</span>
              </div>

              <div className="space-y-sm pt-sm">
                <div>
                  <label className="block font-label-mono text-[9px] text-on-surface-variant uppercase mb-1">
                    Probe Node ID
                  </label>
                  <input
                    type="text"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="forge-input py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-label-mono text-[9px] text-on-surface-variant uppercase mb-1">
                    Device Nickname
                  </label>
                  <input
                    type="text"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="forge-input py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            {sessionError && (
              <p className="font-label-mono text-xs text-error uppercase mt-sm animate-pulse">
                {sessionError}
              </p>
            )}
            <button
              type="submit"
              disabled={isCreatingSession}
              className="w-full mt-lg bg-primary-container text-on-primary-container font-headline-md text-headline-md py-md hover:brightness-110 active:scale-95 transition-all ember-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingSession ? "Calibrating..." : "INITIALIZE THERMAL MODEL"}
            </button>
          </form>
        </ForgeCard>
      </div>

      {/* Geometry Calibration (Central Panel) */}
      <div className="col-span-12 md:col-span-7 flex flex-col gap-md">
        <ForgeCard
          title="GEOMETRY CALIBRATION"
          headerExtra={
            <span className="font-label-mono text-xs text-primary-container">3D VOLUMETRIC SCAN READY</span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md items-center mt-md">
            {/* Illustration */}
            <div className="relative aspect-square bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center p-md forge-texture">
              <div className="w-40 h-28 bg-on-primary-fixed-variant/20 border-2 border-primary-container/40 relative transform rotate-12 transition-transform hover:scale-105 duration-700">
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-full h-1/3 bg-primary-container/10 border-b border-primary/20 animate-pulse"></div>
                  <div className="w-full h-1/3 bg-primary-container/20 border-b border-primary/40"></div>
                  <div className="w-full h-1/3 bg-primary-container/30"></div>
                </div>
                <div className="absolute -top-4 -right-4 font-label-mono text-[9px] text-primary bg-surface border border-primary px-1">
                  CORE AXIS
                </div>
              </div>
              <div className="absolute inset-4 border border-outline-variant/20 pointer-events-none"></div>
              <div className="absolute bottom-2 left-2 font-label-mono text-[9px] text-on-surface-variant">
                REF: {(cutType || "N/A").toUpperCase().replace(/\s+/g, "_")}
              </div>
            </div>

            {/* Protein / Cut / Sliders */}
            <div className="space-y-md">
              <div className="grid grid-cols-4 gap-1">
                {["beef", "pork", "poultry", "fish"].map((meat) => (
                  <button
                    key={meat}
                    type="button"
                    onClick={() => setMeatType(meat)}
                    className={`forge-btn py-1 text-[10px] text-center uppercase ${
                      meatType === meat ? "forge-btn-active" : ""
                    }`}
                  >
                    {meat}
                  </button>
                ))}
              </div>

              <div>
                <label className="block font-label-mono text-[10px] text-on-surface-variant uppercase mb-1">
                  Cut / Description
                </label>
                <input
                  type="text"
                  value={cutType}
                  onChange={(e) => setCutType(e.target.value)}
                  className="forge-input py-1.5 text-xs"
                  placeholder="e.g. Brisket Flat"
                />
              </div>

              <div>
                <div className="flex justify-between font-label-mono text-xs uppercase mb-1">
                  <span className="text-on-surface-variant">Thickness (mm)</span>
                  <span className="text-primary">{thicknessMm}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="0.1"
                  value={thicknessMm}
                  onChange={(e) => setThicknessMm(e.target.value)}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between font-label-mono text-xs uppercase mb-1">
                  <span className="text-on-surface-variant">Weight (kg)</span>
                  <span className="text-primary">{weightKg}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full accent-primary"
                />
              </div>

              <div className="p-sm bg-surface-container-high border border-outline-variant">
                <p className="font-label-mono text-[10px] text-on-surface-variant leading-tight uppercase">
                  Estimated Thermal Inertia:
                  <br />
                  <span className="text-secondary-fixed font-bold">{thermalInertia} KJ/K</span>
                </p>
              </div>
            </div>
          </div>
        </ForgeCard>
      </div>

      {/* Cooker Thermal Profile (Cards Grid) */}
      <div className="col-span-12 md:col-span-5 flex flex-col gap-md">
        <ForgeCard title="COOKER THERMAL PROFILE" grow>
          <div className="grid grid-cols-2 gap-md mt-md">
            {COOKER_PROFILES.map((profile) => {
              const isActive = cookerType === profile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setCookerType(profile.id)}
                  className={`p-md border text-left relative overflow-hidden transition-all ${
                    isActive
                      ? "border-primary bg-surface-container-high glow-ember-inner"
                      : "border-outline-variant bg-surface-container-lowest hover:border-primary"
                  }`}
                >
                  <div className="flex justify-between items-start mb-sm">
                    <span
                      className={`material-symbols-outlined ${isActive ? "text-primary" : "text-on-surface-variant"}`}
                    >
                      {profile.icon}
                    </span>
                    {isActive && <span className="font-label-mono text-[10px] text-primary">SELECTED</span>}
                  </div>
                  <h4 className="font-display-lg text-title-lg text-on-surface uppercase">{profile.name}</h4>
                  <p className="font-label-mono text-[10px] text-on-surface-variant mt-xs leading-tight">
                    {profile.desc}
                  </p>
                  <div className="mt-md h-1 bg-surface-container-lowest">
                    <div
                      className={`h-full ${isActive ? "bg-primary-container" : "bg-on-surface-variant"}`}
                      style={{ width: `${profile.humidity}%` }}
                    ></div>
                  </div>
                  <p
                    className={`font-label-mono text-[9px] mt-1 ${isActive ? "text-primary" : "text-on-surface-variant"}`}
                  >
                    HUMIDITY: {profile.humidity}%
                  </p>
                </button>
              );
            })}
          </div>
        </ForgeCard>
      </div>

      {/* Footer / Status Bar */}
      <div className="col-span-12 mt-md pt-md border-t border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-sm opacity-70">
        <div className="flex flex-wrap gap-md font-label-mono text-[10px]">
          <div className="flex gap-xs items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-on-surface">SENSOR NETWORK: CONNECTED</span>
          </div>
          <span className="text-on-surface-variant">API LATENCY: 14MS</span>
          <span className="text-on-surface-variant">MODEL VERSION: TRACER-V4.2.1</span>
        </div>
        <div className="font-label-mono text-[10px] text-on-surface-variant">
          © 2024 EMBER & CHAR | INDUSTRIAL THERMAL MODELING
        </div>
      </div>
    </>
  );
}
