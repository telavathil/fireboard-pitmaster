"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";

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

  return (
    <>
      {/* Left Column (col-span-8) */}
      <div className="col-span-8 flex flex-col gap-md">
        {/* Target Doneness */}
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

        {/* Cook Configuration */}
        <ForgeCard
          title="PROTEIN & ENVELOPE CALIBRATION"
          hasHighlight
        >
          <div className="grid grid-cols-2 gap-md my-sm">
            <div>
              <label className="block font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
                Protein Selection
              </label>
              <div className="grid grid-cols-2 gap-xs">
                {["beef", "pork", "poultry", "fish"].map((meat) => (
                  <button
                    key={meat}
                    type="button"
                    onClick={() => setMeatType(meat)}
                    className={`forge-btn py-xs text-center uppercase ${
                      meatType === meat ? "forge-btn-active" : ""
                    }`}
                  >
                    {meat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
                Cut / Description
              </label>
              <input
                type="text"
                value={cutType}
                onChange={(e) => setCutType(e.target.value)}
                className="forge-input px-md py-2 text-sm"
                placeholder="e.g. Brisket Flat"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-md mt-md">
            <div>
              <label className="block font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
                Cooker Model
              </label>
              <select
                value={cookerType}
                onChange={(e) => setCookerType(e.target.value)}
                className="forge-select py-2"
              >
                <option value="kamado">Kamado (Ceramic)</option>
                <option value="offset">Offset Smoker</option>
                <option value="drum">Ugly Drum Smoker</option>
                <option value="pellet">Pellet Grill</option>
              </select>
            </div>

            <div>
              <label className="block font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
                Weight (KG)
              </label>
              <input
                type="text"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="forge-input py-2"
              />
            </div>

            <div>
              <label className="block font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">
                Core Thickness (MM)
              </label>
              <input
                type="text"
                value={thicknessMm}
                onChange={(e) => setThicknessMm(e.target.value)}
                className="forge-input py-2"
              />
            </div>
          </div>
        </ForgeCard>
      </div>

      {/* Right Column (col-span-4) */}
      <div className="col-span-4 flex flex-col gap-md justify-between">
        {/* Device Sync Info */}
        <ForgeCard
          title="HARDWARE NODE SYNC"
          grow
        >
          <div className="space-y-sm mt-md">
            <div>
              <label className="block font-label-mono text-[9px] text-on-surface-variant uppercase mb-1">
                Probe Node ID
              </label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className="forge-input py-1.5"
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
                className="forge-input py-1.5"
              />
            </div>
          </div>

          <div className="mt-lg border-t border-outline-variant/40 pt-md text-on-surface-variant font-label-mono text-[10px] leading-relaxed uppercase">
            <p className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Bluetooth Broadcast Active
            </p>
            <p className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> SSE Web Socket Ready
            </p>
          </div>
        </ForgeCard>

        {/* Start Cook Action */}
        <ForgeCard>
          <form onSubmit={handleCreateSession}>
            {sessionError && (
              <p className="font-label-mono text-xs text-error uppercase mb-sm animate-pulse">
                {sessionError}
              </p>
            )}
            <button
              type="submit"
              disabled={isCreatingSession}
              className="action-btn action-btn-primary"
            >
              {isCreatingSession ? "Calibrating..." : "INITIALIZE HEARTH COOK"}
            </button>
          </form>
        </ForgeCard>
      </div>
    </>
  );
}
