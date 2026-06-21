"use client";

import React from "react";
import { CookSessionProvider, useCookSession } from "../context/CookSessionContext";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import EmptyDashboard from "../components/EmptyDashboard";
import HistoryView from "../components/HistoryView";
import SettingsView from "../components/SettingsView";
import Phase1Setup from "../components/Phase1Setup";
import Phase2Stabilizing from "../components/Phase2Stabilizing";
import Phase3Stall from "../components/Phase3Stall";
import Phase4Pull from "../components/Phase4Pull";
import Phase5Resting from "../components/Phase5Resting";
import Phase6Active from "../components/Phase6Active";

function DashboardContent() {
  const {
    token,
    username,
    setUsername,
    password,
    setPassword,
    authError,
    isLoggingIn,
    handleLogin,
    activeSession,
    activeTab,
    currentPhase,
    debugPhaseOverride,
  } = useCookSession();

  // Render Login Panel if not authenticated
  if (!token) {
    return (
      <div className="flex-grow flex items-center justify-center px-sm py-xl min-h-screen bg-[#0E0E0F]">
        <div className="glass-card max-w-md w-full p-md relative overflow-hidden border border-outline-variant/30">
          <div className="absolute w-32 h-32 bg-primary/10 blur-[50px] -top-10 -right-10 rounded-full"></div>
          <div className="flex items-center gap-sm mb-sm">
            <span className="material-symbols-outlined text-primary text-3xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <h1 className="font-headline-lg text-headline-md tracking-wider text-primary uppercase leading-none">HEARTH COMMAND</h1>
          </div>
          
          <p className="font-body-md text-sm text-on-surface-variant mb-md opacity-85 leading-snug">
            Authenticate to connect your FireBoard probe nodes and load real-time thermal model equations.
          </p>

          <form onSubmit={handleLogin} className="space-y-sm">
            <div>
              <label className="block font-label-mono text-xs uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="forge-input py-xs text-sm"
                placeholder="your_fireboard_username"
              />
            </div>

            <div>
              <label className="block font-label-mono text-xs uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="forge-input py-xs text-sm"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="text-error text-xs font-label-mono bg-error-container/10 border border-error-container/20 p-xs flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="action-btn action-btn-primary py-sm"
            >
              {isLoggingIn ? "AUTHENTICATING..." : "SIGN IN"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Shared layout shell
  const outerClasses = `min-h-screen bg-[#0E0E0F] text-on-surface font-body-md flex${currentPhase === 1 ? " brushed-metal" : ""}`;
  
  // Determine dynamic main tag classes
  let mainClasses = "ml-64 mt-20 p-md h-[calc(100vh-5rem)] bg-background overflow-y-auto";
  if (activeTab === "dashboard" && !activeSession && debugPhaseOverride === null) {
    mainClasses += " flex flex-col items-center justify-center";
  } else if (activeTab === "dashboard" && currentPhase === 4) {
    mainClasses += " flex flex-col gap-md";
  } else {
    mainClasses += " grid grid-cols-12 content-start gap-md";
  }

  return (
    <div className={outerClasses}>
      <Sidebar />
      <div className="flex-grow flex flex-col min-h-screen">
        <Header />
        <main className={mainClasses}>
          {(() => {
            if (activeTab === "history") {
              return <HistoryView />;
            }
            if (activeTab === "settings") {
              return <SettingsView />;
            }
            if (activeTab === "probes" || currentPhase === 1) {
              return <Phase1Setup />;
            }
            if (activeTab === "dashboard") {
              if (!activeSession && debugPhaseOverride === null) {
                return <EmptyDashboard />;
              }
              if (currentPhase === 2) {
                return <Phase2Stabilizing />;
              }
              if (currentPhase === 3) {
                return <Phase3Stall />;
              }
              if (currentPhase === 4) {
                return <Phase4Pull />;
              }
              if (currentPhase === 5) {
                return <Phase5Resting />;
              }
              // Phase 6 Active Cook
              return <Phase6Active />;
            }
            return null;
          })()}
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <CookSessionProvider>
      <DashboardContent />
    </CookSessionProvider>
  );
}
