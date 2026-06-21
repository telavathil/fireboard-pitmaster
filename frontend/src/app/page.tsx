"use client";

import React, { useState, useEffect } from "react";
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
import { CookSession, TelemetryPayload } from "../types";

export default function Dashboard() {
  // Authentication State
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Cook Session State
  const [activeSession, setActiveSession] = useState<CookSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [isCreatingSession, setIsCreatingSession] = useState<boolean>(false);

  // Cook Session Form Inputs (Pre-Cook Setup) - matching Stitch dashboard design variables
  const [deviceId, setDeviceId] = useState<string>("device_sim_123");
  const [deviceName, setDeviceName] = useState<string>("Hearth Grill");
  const [meatType, setMeatType] = useState<string>("beef");
  const [cutType, setCutType] = useState<string>("Brisket Flat");
  const [cookerType, setCookerType] = useState<string>("kamado");
  const [weightKg, setWeightKg] = useState<string>("5.4");
  const [thicknessMm, setThicknessMm] = useState<string>("75.0");
  const [targetTempF, setTargetTempF] = useState<number>(203); // using Fahrenheit for Setup UI
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Active Navigation Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "probes" | "history" | "settings">("probes");

  // Settings view inputs
  const [tempUnit, setTempUnit] = useState<"F" | "C">("F");
  const [updateRate, setUpdateRate] = useState<number>(1);
  const [estimationModel, setEstimationModel] = useState<string>("thermal_mass");
  const [alarmsEnabled, setAlarmsEnabled] = useState<boolean>(true);
  const [probeOffset, setProbeOffset] = useState<string>("0.0");

  // Live Telemetry States
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [history, setHistory] = useState<TelemetryPayload[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Phase 3 & 5 UI Simulated/Derived States
  const [moistureBudget, setMoistureBudget] = useState<number>(85);
  const [spritzCount, setSpritzCount] = useState<number>(0);
  const [restDurationSeconds, setRestDurationSeconds] = useState<number>(18 * 60 + 27); // default starting time matching design: 18:27
  const [peakRestTempC, setPeakRestTempC] = useState<number>(93.2);
  const [pullTimeSeconds, setPullTimeSeconds] = useState<number>(3 * 60 + 1); // 03:01 pull countdown timer matching design

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Load token and active session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("pitmaster_token");
    const savedUser = localStorage.getItem("pitmaster_username");
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUsername(savedUser);
      fetchActiveSession(savedToken);
    } else {
      setIsLoadingSession(false);
    }
  }, []);

  // Sync Navigation Tab State based on active cook session status
  useEffect(() => {
    if (activeSession) {
      setActiveTab("dashboard");
    } else {
      setActiveTab("probes");
    }
  }, [activeSession ? activeSession.id : null]);

  // Sync Rest Duration timer (counts up during Phase 5)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession?.status === "resting") {
      const restStart = localStorage.getItem(`rest_start_${activeSession.id}`);
      const startTime = restStart ? parseInt(restStart, 10) : new Date().getTime() - (18 * 60 + 27) * 1000;
      if (!restStart) {
        localStorage.setItem(`rest_start_${activeSession.id}`, startTime.toString());
      }
      
      interval = setInterval(() => {
        setRestDurationSeconds(Math.floor((new Date().getTime() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  // Pull timer countdown in Phase 4
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && telemetry && currentCoreFiltered >= (currentTarget - carryoverRise) && activeSession.status === "bare") {
      interval = setInterval(() => {
        setPullTimeSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, telemetry]);

  // Keep track of peak temperature during resting
  useEffect(() => {
    if (activeSession?.status === "resting" && telemetry) {
      setPeakRestTempC((prev) => Math.max(prev, telemetry.core_temp_filtered));
    }
  }, [activeSession, telemetry]);

  // Simulate Moisture Budget depletion in Stall phase
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && telemetry?.stall_detected && activeSession.status === "bare") {
      interval = setInterval(() => {
        setMoistureBudget((prev) => Math.max(15, prev - 1));
      }, 12000);
    } else if (!telemetry?.stall_detected) {
      setMoistureBudget(85);
    }
    return () => clearInterval(interval);
  }, [activeSession, telemetry]);

  const fetchActiveSession = async (authToken: string) => {
    try {
      const res = await fetch(`${backendUrl}/api/sessions/active`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
        if (data.status === "resting") {
          setPeakRestTempC(data.target_temp_c + 0.2); // peak temp estimation
        }
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error("Failed to fetch active session:", err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // SSE Stream Handler for Telemetry
  useEffect(() => {
    if (!activeSession) {
      setTelemetry(null);
      setHistory([]);
      setIsConnected(false);
      return;
    }

    const sseUrl = `${backendUrl}/api/telemetry/stream/${activeSession.device_id}/1`;
    console.log("Connecting to SSE telemetry stream:", sseUrl);
    const eventSource = new EventSource(sseUrl);

    setIsConnected(true);

    eventSource.onmessage = (event) => {
      try {
        const payload: TelemetryPayload = JSON.parse(event.data);
        setTelemetry(payload);
        
        // Maintain rolling history of the last 30 telemetry points
        setHistory((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].timestamp === payload.timestamp) {
            return prev;
          }
          const updated = [...prev, payload];
          return updated.slice(-30);
        });
      } catch (err) {
        console.error("Failed to parse SSE payload:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE stream experienced an error:", err);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [activeSession]);

  // Actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch(`${backendUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("pitmaster_token", data.access_token);
        localStorage.setItem("pitmaster_username", username);
        setToken(data.access_token);
        fetchActiveSession(data.access_token);
      } else {
        const errData = await res.json();
        setAuthError(errData.detail || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setAuthError("Network error. Could not connect to API server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("pitmaster_token");
    localStorage.removeItem("pitmaster_username");
    setToken(null);
    setActiveSession(null);
    setTelemetry(null);
    setHistory([]);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError(null);
    setIsCreatingSession(true);

    // Convert target Temp from F (slider) to C for database
    const targetC = parseFloat(((targetTempF - 32) * 5 / 9).toFixed(1));

    const payload = {
      device_id: deviceId,
      device_name: deviceName,
      meat_type: meatType,
      cut_type: cutType,
      cooker_type: cookerType,
      status: "bare",
      weight_kg: parseFloat(weightKg),
      thickness_mm: parseFloat(thicknessMm),
      target_temp_c: targetC,
    };

    try {
      const res = await fetch(`${backendUrl}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveSession(data);
        setMoistureBudget(85);
        setSpritzCount(0);
        setPeakRestTempC(93.2);
        setPullTimeSeconds(3 * 60 + 1);
      } else {
        const errData = await res.json();
        setSessionError(errData.detail || "Failed to create session.");
      }
    } catch (err) {
      setSessionError("Failed to communicate with the server.");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeSession) return;
    try {
      const res = await fetch(`${backendUrl}/api/sessions/${activeSession.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updatedSession = { ...activeSession, status: newStatus };
        setActiveSession(updatedSession);
        if (newStatus === "resting") {
          localStorage.setItem(`rest_start_${activeSession.id}`, new Date().getTime().toString());
          setPeakRestTempC(telemetry?.core_temp_filtered || activeSession.target_temp_c);
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleEndCook = () => {
    handleUpdateStatus("completed");
    setActiveSession(null);
    setTelemetry(null);
    setHistory([]);
  };

  const handleSpritz = () => {
    setSpritzCount((prev) => prev + 1);
    setMoistureBudget((prev) => Math.min(95, prev + 8));
  };

  // Helper: Format Time Duration
  const formatEta = (seconds: number) => {
    if (seconds === null || seconds === undefined || seconds < 0) return "CALCULATING";
    if (seconds === 0) return "DONE";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Helper: Format Stopwatch seconds
  const formatStopwatch = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Helper: Get human-readable meat label
  const getMeatLabel = (meat: string) => {
    if (!meat) return "";
    return meat.charAt(0).toUpperCase() + meat.slice(1).toLowerCase();
  };

  const currentCoreRaw = telemetry ? telemetry.core_temp_raw : 15.0;
  const currentCoreFiltered = telemetry ? telemetry.core_temp_filtered : currentCoreRaw;
  const currentTarget = activeSession ? activeSession.target_temp_c : 95.0;
  const carryoverRise = telemetry?.carryover_rise || 4.2;

  // Temperature Conversions for display matching Stitch designs
  const coreTempF = Math.round(currentCoreFiltered * 9/5 + 32);
  const targetTempFDisplay = activeSession ? Math.round(currentTarget * 9/5 + 32) : targetTempF;
  const carryoverRiseF = Math.round(carryoverRise * 9/5);
  const pullTempF = targetTempFDisplay - carryoverRiseF;

  // Render Logic: Determine Current Cook Phase
  let currentPhase = 1;
  
  // Debug override check via URL query parameters
  const [debugPhaseOverride, setDebugPhaseOverride] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("phase");
      if (p) {
        const phaseNum = parseInt(p, 10);
        setDebugPhaseOverride(phaseNum);
        if (phaseNum === 1) {
          setActiveTab("probes");
        } else {
          setActiveTab("dashboard");
        }
      }
    }
  }, []);

  if (debugPhaseOverride !== null) {
    currentPhase = debugPhaseOverride;
  } else if (!activeSession) {
    currentPhase = 1;
  } else if (activeSession?.status === "resting") {
    currentPhase = 5;
  } else if (telemetry && currentCoreFiltered >= (currentTarget - carryoverRise)) {
    currentPhase = 4;
  } else if (!telemetry || telemetry.confidence === "low" || telemetry.confidence === "none") {
    currentPhase = 2;
  } else if (telemetry.stall_detected) {
    currentPhase = 3;
  } else {
    currentPhase = 6; // Regular Active Cook
  }

  // Presets in setup card (displays Fahrenheit)
  const applyPresetF = (meat: string, cut: string, targetF: number) => {
    setMeatType(meat);
    setCutType(cut);
    setTargetTempF(targetF);
  };

  // SVG Gauge Calculations for Active Cook progress
  const progressPercent = Math.max(
    0,
    Math.min(100, ((currentCoreFiltered - 4.0) / (currentTarget - 4.0)) * 100)
  );

  // SVG Graph Path Generator
  const getSvgPathF = (data: TelemetryPayload[], minValF: number, maxValF: number) => {
    if (data.length === 0) return "";
    const width = 800;
    const height = 300;
    const coords = data.map((d, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const valC = d.core_temp_filtered || 0;
      const valF = valC * 9/5 + 32;
      const y = height - ((valF - minValF) / (maxValF - minValF || 1)) * height;
      return `${x},${y}`;
    });
    return `M ${coords.join(" L ")}`;
  };

  const getSvgPathAmbientF = (data: TelemetryPayload[], minValF: number, maxValF: number) => {
    if (data.length === 0) return "";
    const width = 800;
    const height = 300;
    const coords = data.map((d, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const valC = d.ambient_temp || 110.0;
      const valF = valC * 9/5 + 32;
      const y = height - ((valF - minValF) / (maxValF - minValF || 1)) * height;
      return `${x},${y}`;
    });
    return `M ${coords.join(" L ")}`;
  };

  const minTempF = 40;
  const maxTempF = 250;

  // Render Login Panel
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

  // Sync activeTab/currentPhase on window for testing framework
  if (typeof window !== "undefined") {
    (window as any).activeTab = activeTab;
    (window as any).currentPhase = currentPhase;
  }

  if (activeTab === "probes") {
    // Probes tab displays the Setup & Calibration UI (which is Phase 1 layout)
    currentPhase = 1;
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
      <Sidebar
        currentPhase={currentPhase}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSession={activeSession}
        handleEndCook={handleEndCook}
      />
      <div className="flex-grow flex flex-col min-h-screen">
        <Header activeSession={activeSession} handleEndCook={handleEndCook} />
        <main className={mainClasses}>
          {(() => {
            if (activeTab === "history") {
              return <HistoryView />;
            }
            if (activeTab === "settings") {
              return (
                <SettingsView
                  tempUnit={tempUnit}
                  setTempUnit={setTempUnit}
                  updateRate={updateRate}
                  setUpdateRate={setUpdateRate}
                  estimationModel={estimationModel}
                  setEstimationModel={setEstimationModel}
                  probeOffset={probeOffset}
                  setProbeOffset={setProbeOffset}
                  alarmsEnabled={alarmsEnabled}
                  setAlarmsEnabled={setAlarmsEnabled}
                />
              );
            }
            if (activeTab === "probes" || currentPhase === 1) {
              return (
                <Phase1Setup
                  targetTempF={targetTempF}
                  setTargetTempF={setTargetTempF}
                  meatType={meatType}
                  setMeatType={setMeatType}
                  cutType={cutType}
                  setCutType={setCutType}
                  cookerType={cookerType}
                  setCookerType={setCookerType}
                  weightKg={weightKg}
                  setWeightKg={setWeightKg}
                  thicknessMm={thicknessMm}
                  setThicknessMm={setThicknessMm}
                  deviceId={deviceId}
                  setDeviceId={setDeviceId}
                  deviceName={deviceName}
                  setDeviceName={setDeviceName}
                  sessionError={sessionError}
                  isCreatingSession={isCreatingSession}
                  handleCreateSession={handleCreateSession}
                  applyPresetF={applyPresetF}
                />
              );
            }
            if (activeTab === "dashboard") {
              if (!activeSession && debugPhaseOverride === null) {
                return <EmptyDashboard goToProbesSetup={() => setActiveTab("probes")} />;
              }
              if (currentPhase === 2) {
                return <Phase2Stabilizing coreTempF={coreTempF} telemetry={telemetry} />;
              }
              if (currentPhase === 3) {
                return (
                  <Phase3Stall
                    coreTempF={coreTempF}
                    telemetry={telemetry}
                    moistureBudget={moistureBudget}
                    spritzCount={spritzCount}
                    handleSpritz={handleSpritz}
                  />
                );
              }
              if (currentPhase === 4) {
                return (
                  <Phase4Pull
                    activeSession={activeSession}
                    coreTempF={coreTempF}
                    targetTempFDisplay={targetTempFDisplay}
                    carryoverRiseF={carryoverRiseF}
                    pullTempF={pullTempF}
                    pullTimeSeconds={pullTimeSeconds}
                    handleUpdateStatus={handleUpdateStatus}
                    formatStopwatch={formatStopwatch}
                  />
                );
              }
              if (currentPhase === 5) {
                return (
                  <Phase5Resting
                    coreTempF={coreTempF}
                    targetTempFDisplay={targetTempFDisplay}
                    peakRestTempC={peakRestTempC}
                    restDurationSeconds={restDurationSeconds}
                    formatStopwatch={formatStopwatch}
                  />
                );
              }
              // Phase 6 Active Cook
              return (
                <Phase6Active
                  telemetry={telemetry}
                  history={history}
                  coreTempF={coreTempF}
                  targetTempFDisplay={targetTempFDisplay}
                  progressPercent={progressPercent}
                  moistureBudget={moistureBudget}
                  carryoverRiseF={carryoverRiseF}
                  pullTempF={pullTempF}
                  activeSession={activeSession}
                  formatEta={formatEta}
                  getMeatLabel={getMeatLabel}
                  getSvgPathAmbientF={getSvgPathAmbientF}
                  getSvgPathF={getSvgPathF}
                  minTempF={minTempF}
                  maxTempF={maxTempF}
                />
              );
            }
            return null;
          })()}
        </main>
      </div>
    </div>
  );
}
