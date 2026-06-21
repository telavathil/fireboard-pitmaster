"use client";

import React from "react";
import { useCookSession } from "../context/CookSessionContext";

export default function Sidebar() {
  const {
    currentPhase,
    activeTab,
    setActiveTab,
    activeSession,
    handleEndCook,
  } = useCookSession();

  return (
    <aside className="dashboard-sidebar">
      <div className="px-md mb-xl">
        <h1 className="font-headline-md text-headline-md text-on-surface uppercase tracking-tighter leading-none">HEARTH COMMAND</h1>
        {currentPhase === 4 ? (
          <span className="font-label-mono text-[9px] text-error font-bold uppercase tracking-wider block mt-1 animate-pulse">
            PULL WARNING ACTIVE
          </span>
        ) : activeSession ? (
          <span className="font-label-mono text-[9px] text-primary font-bold uppercase tracking-wider block mt-1">
            PHASE {currentPhase}: {activeSession.status.toUpperCase()}
          </span>
        ) : (
          <span className="font-label-mono text-[9px] text-on-surface-variant uppercase tracking-wider block mt-1">
            STANDBY MODE
          </span>
        )}
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
        <div className="p-4 border-t border-outline-variant/30">
          <button
            onClick={handleEndCook}
            className="w-full py-2 border border-error/50 hover:bg-error/10 hover:border-error text-error text-xs font-label-mono transition-all uppercase cursor-pointer"
          >
            END ACTIVE COOK
          </button>
        </div>
      )}
    </aside>
  );
}
