"use client";

import React from "react";
import { CookSession } from "../types";

interface SidebarProps {
  currentPhase: number;
  activeTab: "dashboard" | "probes" | "history" | "settings";
  setActiveTab: (tab: "dashboard" | "probes" | "history" | "settings") => void;
  activeSession: CookSession | null;
  handleEndCook: () => void;
}

export default function Sidebar({
  currentPhase,
  activeTab,
  setActiveTab,
  activeSession,
  handleEndCook,
}: SidebarProps) {
  return (
    <aside className="dashboard-sidebar">
      <div className="px-md mb-xl">
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tighter leading-none">HEARTH COMMAND</h1>
        {currentPhase === 4 ? (
          <div className="mt-xs py-1 px-2 bg-error-container text-on-error-container font-label-mono text-[10px] uppercase tracking-widest inline-block animate-critical">
            CRITICAL: PULL NOW
          </div>
        ) : (
          <p className="font-label-mono text-[10px] text-primary-container tracking-widest opacity-80 mt-xs">PITMASTER DASHBOARD v4.2</p>
        )}
        <p className="mt-xs text-on-surface-variant font-label-mono text-[11px] uppercase">
          Active Session: {activeSession ? activeSession.cut_type : "None"}
        </p>
      </div>
      <nav className="flex-1 space-y-1">
        <div
          onClick={() => setActiveTab("dashboard")}
          className={`nav-item ${activeTab === "dashboard" ? "nav-item-active" : ""}`}
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-mono text-label-mono">Dashboard</span>
        </div>
        <div
          onClick={() => setActiveTab("probes")}
          className={`nav-item ${activeTab === "probes" ? "nav-item-active" : ""}`}
        >
          <span className="material-symbols-outlined">thermostat</span>
          <span className="font-label-mono text-label-mono">Probes</span>
        </div>
        <div
          onClick={() => setActiveTab("history")}
          className={`nav-item ${activeTab === "history" ? "nav-item-active" : ""}`}
        >
          <span className="material-symbols-outlined">history</span>
          <span className="font-label-mono text-label-mono">History</span>
        </div>
        <div
          onClick={() => setActiveTab("settings")}
          className={`nav-item ${activeTab === "settings" ? "nav-item-active" : ""}`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-mono text-label-mono">Settings</span>
        </div>
      </nav>
      
      {activeSession && (
        <div className="px-md mb-xs">
          <button
            onClick={handleEndCook}
            className="w-full bg-outline-variant hover:bg-outline text-on-surface font-headline-md py-sm hover:brightness-110 active:scale-95 duration-100 transition-all uppercase tracking-wide text-xs mb-sm"
          >
            END ACTIVE COOK
          </button>
        </div>
      )}

      <div className="px-md pt-md border-t border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-container-highest border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
          </div>
          <div>
            <p className="font-label-mono text-xs text-on-surface">C. ANDERSON</p>
            <p className="font-label-mono text-[10px] text-primary">MASTER PITMASTER</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
