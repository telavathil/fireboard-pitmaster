"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CookSession, TelemetryPayload } from "../types";
import { formatEta, formatStopwatch, getMeatLabel } from "../lib/formatters";
import { getSvgPathF, getSvgPathAmbientF } from "../lib/chartPaths";

interface CookSessionContextType {
  // Auth State
  token: string | null;
  username: string;
  setUsername: (u: string) => void;
  password: string;
  setPassword: (p: string) => void;
  authError: string | null;
  isLoggingIn: boolean;
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => void;

  // Active Session State
  activeSession: CookSession | null;
  isLoadingSession: boolean;
  isCreatingSession: boolean;
  handleCreateSession: (e: React.FormEvent) => Promise<void>;
  handleUpdateStatus: (status: string) => Promise<void>;
  handleEndCook: () => void;

  // Navigation
  activeTab: "dashboard" | "probes" | "history" | "settings";
  setActiveTab: (tab: "dashboard" | "probes" | "history" | "settings") => void;

  // Setup Form
  deviceId: string;
  setDeviceId: (id: string) => void;
  deviceName: string;
  setDeviceName: (name: string) => void;
  meatType: string;
  setMeatType: (type: string) => void;
  cutType: string;
  setCutType: (cut: string) => void;
  cookerType: string;
  setCookerType: (cooker: string) => void;
  weightKg: string;
  setWeightKg: (w: string) => void;
  thicknessMm: string;
  setThicknessMm: (t: string) => void;
  targetTempF: number;
  setTargetTempF: (t: number) => void;
  applyPresetF: (meat: string, cut: string, targetF: number) => void;

  // Settings
  tempUnit: "F" | "C";
  setTempUnit: (unit: "F" | "C") => void;
  updateRate: number;
  setUpdateRate: (rate: number) => void;
  estimationModel: string;
  setEstimationModel: (model: string) => void;
  alarmsEnabled: boolean;
  setAlarmsEnabled: (enabled: boolean) => void;
  probeOffset: string;
  setProbeOffset: (offset: string) => void;

  // Telemetry & Connection
  telemetry: TelemetryPayload | null;
  history: TelemetryPayload[];
  isConnected: boolean;

  // Stall & Rest Simulated States
  moistureBudget: number;
  spritzCount: number;
  handleSpritz: () => void;
  restDurationSeconds: number;
  peakRestTempC: number;
  pullTimeSeconds: number;

  // Derived Values
  coreTempF: number;
  targetTempFDisplay: number;
  carryoverRiseF: number;
  pullTempF: number;
  currentPhase: number;
  progressPercent: number;
  debugPhaseOverride: number | null;
  setDebugPhaseOverride: (p: number | null) => void;

  // Helpers
  formatEta: (seconds: number) => string;
  formatStopwatch: (totalSeconds: number) => string;
  getMeatLabel: (meat: string) => string;
  getSvgPathF: (data: TelemetryPayload[], minValF: number, maxValF: number) => string;
  getSvgPathAmbientF: (data: TelemetryPayload[], minValF: number, maxValF: number) => string;
  minTempF: number;
  maxTempF: number;
}

const CookSessionContext = createContext<CookSessionContextType | undefined>(undefined);

export function CookSessionProvider({ children }: { children: React.ReactNode }) {
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

  // Cook Session Form Inputs (Pre-Cook Setup)
  const [deviceId, setDeviceId] = useState<string>("device_sim_123");
  const [deviceName, setDeviceName] = useState<string>("Hearth Grill");
  const [meatType, setMeatType] = useState<string>("beef");
  const [cutType, setCutType] = useState<string>("Brisket Flat");
  const [cookerType, setCookerType] = useState<string>("kamado");
  const [weightKg, setWeightKg] = useState<string>("5.4");
  const [thicknessMm, setThicknessMm] = useState<string>("75.0");
  const [targetTempF, setTargetTempF] = useState<number>(203);
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
  const [pullTimeSeconds, setPullTimeSeconds] = useState<number>(3 * 60 + 1);

  // Debug override check via URL query parameters
  const [debugPhaseOverride, setDebugPhaseOverride] = useState<number | null>(null);

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

  // Check URL phase override
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
          setPeakRestTempC(data.target_temp_c + 0.2);
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

  const applyPresetF = (meat: string, cut: string, targetF: number) => {
    setMeatType(meat);
    setCutType(cut);
    setTargetTempF(targetF);
  };

  // Temperature Conversions / Calculations
  const currentCoreRaw = telemetry ? telemetry.core_temp_raw : 15.0;
  const currentCoreFiltered = telemetry ? telemetry.core_temp_filtered : currentCoreRaw;
  const currentTarget = activeSession ? activeSession.target_temp_c : 95.0;
  const carryoverRise = telemetry?.carryover_rise || 4.2;

  const coreTempF = Math.round(currentCoreFiltered * 9/5 + 32);
  const targetTempFDisplay = activeSession ? Math.round(currentTarget * 9/5 + 32) : targetTempF;
  const carryoverRiseF = Math.round(carryoverRise * 9/5);
  const pullTempF = targetTempFDisplay - carryoverRiseF;

  // SVG Gauge progress
  const progressPercent = Math.max(
    0,
    Math.min(100, ((currentCoreFiltered - 4.0) / (currentTarget - 4.0)) * 100)
  );

  const minTempF = 40;
  const maxTempF = 250;

  // Render logic currentPhase
  let currentPhase = 1;
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


  // Sync state variables onto window for E2E headless validation testing
  if (typeof window !== "undefined") {
    (window as any).activeTab = activeTab;
    (window as any).currentPhase = currentPhase;
  }

  return (
    <CookSessionContext.Provider
      value={{
        token,
        username,
        setUsername,
        password,
        setPassword,
        authError,
        isLoggingIn,
        handleLogin,
        handleLogout,
        activeSession,
        isLoadingSession,
        isCreatingSession,
        handleCreateSession,
        handleUpdateStatus,
        handleEndCook,
        activeTab,
        setActiveTab,
        deviceId,
        setDeviceId,
        deviceName,
        setDeviceName,
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
        targetTempF,
        setTargetTempF,
        applyPresetF,
        tempUnit,
        setTempUnit,
        updateRate,
        setUpdateRate,
        estimationModel,
        setEstimationModel,
        alarmsEnabled,
        setAlarmsEnabled,
        probeOffset,
        setProbeOffset,
        telemetry,
        history,
        isConnected,
        moistureBudget,
        spritzCount,
        handleSpritz,
        restDurationSeconds,
        peakRestTempC,
        pullTimeSeconds,
        coreTempF,
        targetTempFDisplay,
        carryoverRiseF,
        pullTempF,
        currentPhase,
        progressPercent,
        debugPhaseOverride,
        setDebugPhaseOverride,
        formatEta,
        formatStopwatch,
        getMeatLabel,
        getSvgPathF,
        getSvgPathAmbientF,
        minTempF,
        maxTempF,
      }}
    >
      {children}
    </CookSessionContext.Provider>
  );
}

export function useCookSession() {
  const context = useContext(CookSessionContext);
  if (context === undefined) {
    throw new Error("useCookSession must be used within a CookSessionProvider");
  }
  return context;
}
