"use client";

import React, { useState, useEffect, useRef } from "react";

interface CookSession {
  id: string;
  device_id: string;
  device_name?: string;
  meat_type: string;
  cut_type: string;
  cooker_type: string;
  status: string;
  weight_kg: number;
  thickness_mm: number;
  target_temp_c: number;
  created_at: string;
}

interface TelemetryPayload {
  channel: number;
  core_temp_raw: number;
  core_temp_filtered: number;
  ambient_temp?: number;
  heating_rate: number;
  stall_detected: boolean;
  eta_seconds: number;
  carryover_rise?: number;
  confidence: string;
  timestamp: string;
}

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

  // Cook Session Form Inputs
  const [deviceId, setDeviceId] = useState<string>("device_sim_123");
  const [deviceName, setDeviceName] = useState<string>("Pitmaster Grill");
  const [meatType, setMeatType] = useState<string>("pork");
  const [cutType, setCutType] = useState<string>("shoulder");
  const [cookerType, setCookerType] = useState<string>("kamado");
  const [weightKg, setWeightKg] = useState<string>("3.0");
  const [thicknessMm, setThicknessMm] = useState<string>("95.0");
  const [targetTempC, setTargetTempC] = useState<string>("93.0");
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Live Telemetry States
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [history, setHistory] = useState<TelemetryPayload[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

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
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error("Failed to fetch active session:", err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // SSE Stream Handler
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
        
        // Maintain rolling history of the last 30 telemetry points (~10 mins)
        setHistory((prev) => {
          // Avoid duplicate timestamps
          if (prev.length > 0 && prev[prev.length - 1].timestamp === payload.timestamp) {
            console.log("Skipping duplicate timestamp in history:", payload.timestamp);
            return prev;
          }
          const updated = [...prev, payload];
          console.log("History state updated. New size:", updated.length, updated);
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

    const payload = {
      device_id: deviceId,
      device_name: deviceName,
      meat_type: meatType,
      cut_type: cutType,
      cooker_type: cookerType,
      status: "bare",
      weight_kg: parseFloat(weightKg),
      thickness_mm: parseFloat(thicknessMm),
      target_temp_c: parseFloat(targetTempC),
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

  // Helper: Format Time Duration
  const formatEta = (seconds: number) => {
    if (seconds === null || seconds === undefined || seconds < 0) return "CALCULATING";
    if (seconds === 0) return "DONE";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Calculations for dynamic UI elements
  const currentCoreRaw = telemetry ? telemetry.core_temp_raw : 15.0;
  const currentCoreFiltered = telemetry ? telemetry.core_temp_filtered : currentCoreRaw;
  const currentTarget = activeSession ? activeSession.target_temp_c : 93.0;

  // Calculate Progress Percent for circular gauge (relative to starting temperature of 4C)
  const progressPercent = Math.max(
    0,
    Math.min(100, ((currentCoreFiltered - 4.0) / (currentTarget - 4.0)) * 100)
  );

  // SVG Gauge Calculations
  const radius = 80;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // SVG Graph Path Generator
  const getSvgPath = (data: TelemetryPayload[], key: keyof TelemetryPayload, minVal: number, maxVal: number) => {
    if (data.length === 0) return "";
    const width = 800;
    const height = 300;
    const coords = data.map((d, index) => {
      const x = (index / (data.length - 1 || 1)) * width;
      const val = (d[key] as number) || 0;
      const y = height - ((val - minVal) / (maxVal - minVal || 1)) * height;
      return `${x},${y}`;
    });
    return `M ${coords.join(" L ")}`;
  };

  // Dynamic values for graph bounds
  const tempsInHistory = history.flatMap((h) => [
    h.core_temp_raw,
    h.core_temp_filtered,
    h.ambient_temp || 110.0,
  ]);
  const minTemp = tempsInHistory.length > 0 ? Math.max(0, Math.min(...tempsInHistory) - 10) : 0;
  const maxTemp = tempsInHistory.length > 0 ? Math.max(120, Math.max(...tempsInHistory) + 10) : 120;

  return (
    <div className="min-h-screen bg-[#0F0F10] text-[#e5e2e3] font-sans antialiased flex flex-col">
      {/* 1. Login State */}
      {!token ? (
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="glass-card max-w-md w-full p-8 rounded-xl relative overflow-hidden">
            <div className="absolute w-32 h-32 bg-primary-container/10 blur-[50px] -top-10 -right-10 rounded-full"></div>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_fire_department
              </span>
              <h1 className="font-headline-lg text-2xl tracking-wide text-primary">FIREBOARD PITMASTER</h1>
            </div>
            
            <p className="text-on-surface-variant text-sm mb-6 opacity-80">
              Sign in using your credentials to link your FireBoard account and cache session authentication.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1c1b1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="your_fireboard_username"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1c1b1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <div className="text-error text-xs font-medium bg-error-container/10 border border-error-container/20 p-3 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-lg font-bold text-sm tracking-wide bg-primary-container text-on-primary active:scale-[0.98] transition-transform duration-150 shadow-lg amber-glow cursor-pointer disabled:opacity-50"
              >
                {isLoggingIn ? "AUTHENTICATING..." : "SIGN IN"}
              </button>
            </form>
          </div>
        </div>
      ) : isLoadingSession ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
            LOADING COOK SESSION...
          </span>
        </div>
      ) : !activeSession ? (
        /* 2. Create Session State */
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="glass-card max-w-xl w-full p-8 rounded-xl relative overflow-hidden">
            <div className="absolute w-40 h-40 bg-primary-container/5 blur-[80px] -bottom-10 -left-10 rounded-full"></div>
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  outdoor_grill
                </span>
                <h2 className="font-headline-md text-lg text-primary tracking-wide">START NEW COOK</h2>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">logout</span> Sign Out
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                    Device ID
                  </label>
                  <input
                    type="text"
                    required
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="w-full bg-[#1c1b1c] border border-white/10 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50"
                    placeholder="e.g. device_sim_123"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                    Device Name
                  </label>
                  <input
                    type="text"
                    required
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="w-full bg-[#1c1b1c] border border-white/10 rounded-lg px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                    Protein
                  </label>
                  <select
                    value={meatType}
                    onChange={(e) => setMeatType(e.target.value)}
                    className="w-full bg-[#1c1b1c] border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50"
                  >
                    <option value="beef">Beef</option>
                    <option value="pork">Pork</option>
                    <option value="poultry">Poultry</option>
                    <option value="lamb">Lamb</option>
                    <option value="fish">Fish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                    Cut Type
                  </label>
                  <input
                    type="text"
                    required
                    value={cutType}
                    onChange={(e) => setCutType(e.target.value)}
                    className="w-full bg-[#1c1b1c] border border-white/10 rounded-lg px-4 py-2 text-sm text-on-surface"
                    placeholder="e.g. Shoulder, Brisket"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                    Cooker Type
                  </label>
                  <select
                    value={cookerType}
                    onChange={(e) => setCookerType(e.target.value)}
                    className="w-full bg-[#1c1b1c] border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface"
                  >
                    <option value="kamado">Kamado (Ceramic)</option>
                    <option value="pellet">Pellet Smoker</option>
                    <option value="oven">Kitchen Oven</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-[#1c1b1c] border border-white/10 rounded-lg px-4 py-2 text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                    Thickness (mm)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={thicknessMm}
                    onChange={(e) => setThicknessMm(e.target.value)}
                    className="w-full bg-[#1c1b1c] border border-white/10 rounded-lg px-4 py-2 text-sm text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant opacity-75 mb-1">
                    Target Core Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="20"
                    required
                    value={targetTempC}
                    onChange={(e) => setTargetTempC(e.target.value)}
                    className="w-full bg-[#1c1b1c] border border-white/10 rounded-lg px-4 py-2 text-sm text-on-surface"
                  />
                </div>
              </div>

              {sessionError && (
                <div className="text-error text-xs font-medium bg-error-container/10 border border-error-container/20 p-3 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  <span>{sessionError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isCreatingSession}
                className="w-full py-3 rounded-lg font-bold text-sm tracking-wide bg-primary-container text-on-primary active:scale-[0.98] transition-transform duration-150 shadow-lg amber-glow cursor-pointer disabled:opacity-50"
              >
                {isCreatingSession ? "INITIALIZING SOLVER..." : "START ACTIVE COOK"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* 3. Main Dashboard View */
        <>
          <header className="bg-surface/10 backdrop-blur-xl border-b border-white/12 shadow-[0_0_20px_rgba(255,159,10,0.1)] sticky top-0 w-full z-50">
            <div className="flex justify-between items-center px-container-margin py-4 w-full">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
                <div className="flex flex-col">
                  <h1 className="font-headline-md text-headline-lg-mobile md:text-headline-md tracking-wider text-primary">FIREBOARD PITMASTER</h1>
                  <span className="font-label-sm text-label-sm text-on-surface-variant opacity-80">
                    Active Session: {activeSession.device_name} • {activeSession.weight_kg}kg {activeSession.meat_type} {activeSession.cut_type}
                  </span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <nav className="flex gap-6">
                  <button
                    onClick={() => setActiveSession(null)}
                    className="text-on-surface-variant hover:bg-white/5 transition-colors font-label-sm text-label-sm flex items-center gap-1 px-2 py-1 rounded cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span> Change Cook
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-on-surface-variant hover:bg-white/5 transition-colors font-label-sm text-label-sm flex items-center gap-1 px-2 py-1 rounded cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span> Sign Out
                  </button>
                </nav>
                <div className="px-4 py-2 bg-primary-container text-on-primary rounded-lg font-bold text-label-sm shadow-lg amber-glow flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#6cff82] animate-pulse" : "bg-error"}`}></span>
                  {isConnected ? "LIVE STREAM" : "DISCONNECTED"}
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-container-margin py-8 md:py-12 space-y-8 flex-1 w-full">
            {/* Gauge and Status alerts */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex justify-center items-center py-12 relative">
                <div className="absolute w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
                <div className="relative w-80 h-80 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 200 200">
                    <circle className="text-white/5" cx="100" cy="100" fill="transparent" r="80" stroke="currentColor" strokeWidth="8"></circle>
                    <circle
                      className="text-primary progress-ring__circle"
                      cx="100"
                      cy="100"
                      fill="transparent"
                      r="80"
                      stroke="currentColor"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      strokeWidth="8"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                      Remaining
                    </span>
                    <h2 className="font-display-temp text-display-temp text-glow-amber text-primary mt-1">
                      {formatEta(telemetry ? telemetry.eta_seconds : -1)}
                    </h2>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-[10px] text-on-surface-variant opacity-60 uppercase">Core</span>
                        <span className="font-headline-md text-headline-md text-on-surface">{currentCoreFiltered.toFixed(1)}°C</span>
                      </div>
                      <div className="h-8 w-px bg-white/10"></div>
                      <div className="flex flex-col">
                        <span className="font-label-sm text-[10px] text-on-surface-variant opacity-60 uppercase">Target</span>
                        <span className="font-headline-md text-headline-md opacity-60 text-on-surface">{currentTarget}°C</span>
                      </div>
                    </div>
                    {telemetry && (
                      <div className={`mt-4 px-3 py-1 border rounded-full flex items-center gap-1.5 ${
                        telemetry.confidence === "complete" 
                          ? "bg-secondary-container/10 border-secondary-container/20 text-[#6cff82]" 
                          : telemetry.confidence === "high" 
                            ? "bg-secondary-container/10 border-secondary-container/20 text-[#6cff82]" 
                            : "bg-primary/10 border-primary/20 text-primary"
                      }`}>
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {telemetry.confidence === "complete" ? "task_alt" : "verified"}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-tight">
                          Confidence: {telemetry.confidence}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                {/* Stall Alert Banner */}
                {telemetry?.stall_detected ? (
                  <div className="stall-banner glass-card p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-6xl">water_drop</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/20 p-3 rounded-lg pulse-stall text-primary">
                        <span className="material-symbols-outlined">local_fire_department</span>
                      </div>
                      <div>
                        <h3 className="font-headline-md text-headline-md text-primary tracking-tight">
                          🔥 THERMODYNAMIC STALL ACTIVE
                        </h3>
                        <p className="text-on-surface-variant text-sm opacity-90 mt-1">
                          Evaporative cooling plateau detected ({currentCoreFiltered.toFixed(1)}°C). Solver holding ETA estimates until bark forms.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-6 rounded-xl relative overflow-hidden group border-white/5 opacity-75">
                    <div className="flex items-start gap-4">
                      <div className="bg-white/5 p-3 rounded-lg text-on-surface-variant">
                        <span className="material-symbols-outlined">water_drop</span>
                      </div>
                      <div>
                        <h3 className="font-headline-md text-sm font-semibold text-on-surface-variant">
                          Evaporative Stall Status
                        </h3>
                        <p className="text-on-surface-variant text-xs mt-1">
                          Not currently stalling. Surface evaporation rates are below heat flux absorption levels.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Carryover Prediction */}
                <div className="glass-card p-6 rounded-xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/5 p-3 rounded-lg text-secondary">
                      <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div>
                      <h4 className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest">Carryover Rise</h4>
                      <p className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-[#6cff82]">
                        {telemetry?.carryover_rise !== undefined ? `+${telemetry.carryover_rise.toFixed(1)}°C` : "--"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-label-sm text-xs text-on-surface-variant block mb-1">Recommendation</span>
                    {telemetry?.carryover_rise !== undefined ? (
                      <div className="bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg text-primary font-bold text-sm">
                        Pull at {(currentTarget - telemetry.carryover_rise).toFixed(1)}°C
                      </div>
                    ) : (
                      <div className="bg-white/5 px-3 py-1 rounded-lg text-on-surface-variant text-sm font-semibold">
                        Calculating...
                      </div>
                    )}
                    <span className="text-[10px] text-on-surface-variant mt-1 block">
                      to coast to {currentTarget.toFixed(1)}°C
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Telemetry Cards Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Core */}
              <div className="glass-card p-6 rounded-xl flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#ff9f0a]"></div>
                    <h4 className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest">Core Temp</h4>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-xl">sensors</span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display-temp text-4xl text-on-surface">{currentCoreRaw.toFixed(1)}°C</span>
                  <span className="font-label-sm text-xs text-primary opacity-60">RAW</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[11px] text-on-surface-variant">Kalman Filtered</span>
                  <span className="font-bold text-secondary text-sm">{currentCoreFiltered.toFixed(1)}°C</span>
                </div>
              </div>

              {/* Card 2: Ambient */}
              <div className="glass-card p-6 rounded-xl flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                    <h4 className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest">Smoker Ambient</h4>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-xl">oven_gen</span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display-temp text-4xl text-on-surface">
                    {telemetry?.ambient_temp ? `${telemetry.ambient_temp.toFixed(1)}°C` : "--"}
                  </span>
                  <span className="font-label-sm text-xs text-tertiary opacity-60">STABLE</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[11px] text-on-surface-variant">Cooker Settings</span>
                  <span className="font-bold text-on-surface text-sm uppercase">{activeSession.cooker_type}</span>
                </div>
              </div>

              {/* Card 3: Heating Rate */}
              <div className="glass-card p-6 rounded-xl flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <h4 className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest">Heating Rate</h4>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-xl">show_chart</span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display-temp text-4xl text-glow-amber text-primary">
                    {telemetry ? `${telemetry.heating_rate > 0 ? "+" : ""}${telemetry.heating_rate.toFixed(2)}°C` : "--"}
                  </span>
                  <span className="font-label-sm text-xs text-on-surface-variant opacity-60">/ MIN</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[11px] text-on-surface-variant">Thermal Momentum</span>
                  <span className="material-symbols-outlined text-secondary text-sm">
                    {telemetry && telemetry.heating_rate > 0 ? "trending_up" : "trending_flat"}
                  </span>
                </div>
              </div>
            </section>

            {/* Historical Live Graph */}
            <section className="glass-card rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">insights</span>
                  <h3 className="font-headline-md text-headline-md">Temperature History (Rolling 10m)</h3>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span> Core (Raw)
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block"></span> Core (Filtered)
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary inline-block"></span> Ambient
                  </div>
                </div>
              </div>
              <div className="p-6 h-[340px] relative">
                {history.length > 0 ? (
                  <div className="w-full h-full relative border-l border-b border-white/10">
                    <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1="75" x2="800" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="225" x2="800" y2="225" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      
                      {/* Ambient Temp Line */}
                      <path
                        d={getSvgPath(history, "ambient_temp", minTemp, maxTemp)}
                        fill="none"
                        stroke="#bad1ff"
                        strokeDasharray="5,5"
                        strokeWidth="2"
                        opacity="0.5"
                      />
                      
                      {/* Raw Core Temp Line */}
                      <path
                        d={getSvgPath(history, "core_temp_raw", minTemp, maxTemp)}
                        fill="none"
                        stroke="#ffc688"
                        strokeWidth="2.5"
                        opacity="0.4"
                      />

                      {/* Filtered Core Temp Line */}
                      <path
                        d={getSvgPath(history, "core_temp_filtered", minTemp, maxTemp)}
                        fill="none"
                        stroke="#47e266"
                        strokeWidth="3"
                      />
                    </svg>
                    
                    {/* Floating Axis Labels */}
                    <div className="absolute top-2 left-2 text-[10px] text-on-surface-variant opacity-50 bg-[#0F0F10]/85 px-1 py-0.5 rounded">
                      Max: {maxTemp.toFixed(0)}°C
                    </div>
                    <div className="absolute bottom-2 left-2 text-[10px] text-on-surface-variant opacity-50 bg-[#0F0F10]/85 px-1 py-0.5 rounded">
                      Min: {minTemp.toFixed(0)}°C
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center text-on-surface-variant opacity-55 border-l border-b border-white/10">
                    <span className="material-symbols-outlined text-4xl mb-2 animate-pulse">query_stats</span>
                    <p className="text-xs font-semibold uppercase tracking-wider">WAITING FOR STREAM DATA...</p>
                    <p className="text-[10px] opacity-75 mt-1">Graph updates will plot automatically as telemetry arrives.</p>
                  </div>
                )}
              </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
}
