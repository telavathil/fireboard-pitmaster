"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";
import ForgeCard from "./ui/ForgeCard";
import ForgeKeyValueList from "./ui/ForgeKeyValueList";

export default function SettingsView() {
  const {
    tempUnit,
    setTempUnit,
    updateRate,
    setUpdateRate,
    estimationModel,
    setEstimationModel,
    probeOffset,
    setProbeOffset,
    alarmsEnabled,
    setAlarmsEnabled,
  } = useCookSession();

  return (
    <>
      {/* Left Column - Configuration forms */}
      <div className="col-span-12 md:col-span-8 flex flex-col gap-md">
        <ForgeCard
          title="SYSTEM CONFIGURATION"
          subtitle="TUNING HARNESS PARAMETERS AND INTERFACE CONTROLS"
        />

        <ForgeCard>
          <div className="space-y-md">
            {/* Temperature Unit */}
            <div>
              <label className="block font-label-mono text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                Temperature Display Scale
              </label>
              <div className="flex gap-sm">
                <button
                  type="button"
                  onClick={() => setTempUnit("F")}
                  className={`forge-btn ${tempUnit === "F" ? "forge-btn-active" : ""}`}
                >
                  FAHRENHEIT (°F)
                </button>
                <button
                  type="button"
                  onClick={() => setTempUnit("C")}
                  className={`forge-btn ${tempUnit === "C" ? "forge-btn-active" : ""}`}
                >
                  CELSIUS (°C)
                </button>
              </div>
            </div>

            {/* Telemetry Stream Rate */}
            <div>
              <label className="block font-label-mono text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                SSE Stream Interval
              </label>
              <div className="flex gap-sm">
                {[1, 5, 10].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setUpdateRate(rate)}
                    className={`forge-btn ${updateRate === rate ? "forge-btn-active" : ""}`}
                  >
                    {rate} SECONDS
                  </button>
                ))}
              </div>
            </div>

            {/* Predictive Estimation Model */}
            <div>
              <label className="block font-label-mono text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                Thermodynamic Carryover Prediction Model
              </label>
              <select
                value={estimationModel}
                onChange={(e) => setEstimationModel(e.target.value)}
                className="forge-select py-xs text-sm"
              >
                <option value="linear">LINEAR EXTRAPOLATION</option>
                <option value="exponential">EXPONENTIAL DECAY</option>
                <option value="thermal_mass">THERMAL MASS CAPACITY MODEL</option>
              </select>
            </div>

            {/* Calibration Offset */}
            <div>
              <label className="block font-label-mono text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                Probe 1 Node Calibration Offset (°F)
              </label>
              <input
                type="text"
                value={probeOffset}
                onChange={(e) => setProbeOffset(e.target.value)}
                className="forge-input py-xs text-sm w-32"
                placeholder="0.0"
              />
              <p className="font-label-mono text-[9px] text-outline-variant uppercase mt-1">
                APPLIES RAW TEMPERATURE ADJUSTMENT BEFORE RUNNING DYNAMIC SMOOTHING.
              </p>
            </div>
          </div>
        </ForgeCard>
      </div>

      {/* Right Column - Device status / info */}
      <div className="col-span-12 md:col-span-4 flex flex-col gap-md">
        <ForgeCard title="Hearth Node Device">
          <ForgeKeyValueList
            items={[
              { label: "DEVICE ID", value: "device_sim_123" },
              { label: "IP ENDPOINT", value: "192.168.1.104" },
              { label: "HARDWARE MAC", value: "00:1A:7D:DA:71:11" },
              { label: "SSE BROKER STATUS", value: "CONNECTED", valueColor: "green" },
            ]}
          />
        </ForgeCard>

        <ForgeCard title="Critical Audio Alarm">
          <div className="flex items-center gap-sm mt-4">
            <button
              onClick={() => setAlarmsEnabled(!alarmsEnabled)}
              className={`w-full transition-all ${
                alarmsEnabled
                  ? "font-label-mono px-md py-xs border text-xs cursor-pointer bg-error-container text-on-error-container border-error"
                  : "forge-btn"
              }`}
            >
              {alarmsEnabled ? "AUDIO ALARMS: ON" : "AUDIO ALARMS: MUTED"}
            </button>
          </div>
        </ForgeCard>
      </div>
    </>
  );
}
