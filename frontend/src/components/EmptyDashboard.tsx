"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";

export default function EmptyDashboard() {
  const { setActiveTab } = useCookSession();
  const goToProbesSetup = () => setActiveTab("probes");

  return (
    <div className="glass-card max-w-lg w-full p-lg text-center border border-outline-variant/30 relative overflow-hidden">
      <div className="absolute w-40 h-40 bg-primary/5 blur-[60px] -top-10 -right-10 rounded-full"></div>
      
      <span className="material-symbols-outlined text-outline text-6xl mb-md animate-pulse">
        sensors_off
      </span>
      
      <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface tracking-tighter leading-none mb-xs">
        PITMASTER DASHBOARD IDLE
      </h2>
      <p className="font-label-mono text-xs text-primary uppercase tracking-widest mb-md">
        NO ACTIVE COOK SESSION DETECTED
      </p>
      
      <p className="text-on-surface-variant font-body-md text-sm mb-lg max-w-sm mx-auto leading-relaxed">
        Connect your physical Hearth probe nodes or configure virtual simulation variables to initialize thermal gradient equations and telemetry charts.
      </p>

      <button
        onClick={goToProbesSetup}
        className="action-btn action-btn-primary px-xl py-sm w-auto"
      >
        GO TO PROBES SETUP
      </button>
    </div>
  );
}
