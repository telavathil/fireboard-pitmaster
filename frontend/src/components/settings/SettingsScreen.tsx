"use client";

import React from "react";
import { SignOut } from "@phosphor-icons/react";
import { useCookSession } from "../../context/CookSessionContext";
import TideScreen from "../tide/TideScreen";
import { Segmented, SetupSection } from "../tide/FormParts";

const TEMP_UNITS = [
  { id: "F", label: "Fahrenheit (°F)" },
  { id: "C", label: "Celsius (°C)" },
] as const;

const ALARM_OPTIONS = [
  { id: "on", label: "On" },
  { id: "off", label: "Off" },
] as const;

export default function SettingsScreen() {
  const { tempUnit, setTempUnit, alarmsEnabled, setAlarmsEnabled, username, activeSession, handleLogout } = useCookSession();

  return (
    <TideScreen title="Settings">
      <main className="mx-auto max-w-[1200px] px-5 pb-28 md:px-10 md:pb-12">
        <div className="max-w-[640px]">
          <SetupSection title="Temperature">
            <Segmented legend="Temperature unit" name="settings-temp-unit" hideLegend value={tempUnit} options={TEMP_UNITS} onChange={setTempUnit} columns={2} />
            <p className="mt-3 text-[14px] text-tide-muted">Used everywhere temperatures are shown. Weight and thickness units are chosen when you start a cook.</p>
          </SetupSection>

          <SetupSection title="Pull alarm sound">
            <Segmented
              legend="Pull alarm sound"
              name="settings-alarm"
              hideLegend
              value={alarmsEnabled ? "on" : "off"}
              options={ALARM_OPTIONS}
              onChange={(v) => setAlarmsEnabled(v === "on")}
              columns={2}
            />
            <p className="mt-3 text-[14px] text-tide-muted">
              The screen always takes over when it&apos;s time to pull. This controls the tone. Browsers may only play it after you&apos;ve tapped the page once.
            </p>
          </SetupSection>

          <SetupSection title="Account">
            <p className="text-[15px]">
              Signed in as <b className="font-bold">{username || "your FireBoard account"}</b>
            </p>
            {activeSession && (
              <p className="mt-2 text-[14px] text-tide-muted">A cook is running. Signing out stops pull alerts on this device.</p>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex min-h-[48px] items-center gap-2 rounded-[10px] px-5 text-[15px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink"
            >
              <SignOut size={20} aria-hidden="true" />
              Sign out
            </button>
          </SetupSection>
        </div>
      </main>
    </TideScreen>
  );
}
