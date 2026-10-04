"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CookSession, TelemetryPayload } from "../types";
import { Stage, deriveStage } from "../components/live/cookModel";

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

  // Live cook (derived only from real session and telemetry data)
  stage: Stage | null;
  carryoverC: number | null;
  restStartedAt: number | null;
  peakRestTempC: number | null;
  currentPhase: number;
  debugPhaseOverride: number | null;
  setDebugPhaseOverride: (p: number | null) => void;
}

/** Keeps roughly 12 hours of readings at the backend's 20 s polling cadence. */
const MAX_HISTORY_POINTS = 2160;

const PHASE_BY_STAGE: Record<Stage, number> = { stabilizing: 2, stall: 3, pull: 4, rest: 5, cooking: 6 };
const STAGE_BY_PHASE: Record<number, Stage> = { 2: "stabilizing", 3: "stall", 4: "pull", 5: "rest", 6: "cooking" };

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

  // Rest tracking (set when the cook is pulled; persisted per session in localStorage)
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);

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

  // Restore when the rest began. If the pull was never logged on this device,
  // the rest clock starts now rather than at an invented time.
  useEffect(() => {
    if (activeSession?.status !== "resting") {
      setRestStartedAt(null);
      return;
    }
    const key = `rest_start_${activeSession.id}`;
    const saved = Number(localStorage.getItem(key));
    const startedAt = saved > 0 ? saved : Date.now();
    if (!(saved > 0)) localStorage.setItem(key, String(startedAt));
    setRestStartedAt(startedAt);
  }, [activeSession?.id, activeSession?.status]);

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
    const eventSource = new EventSource(sseUrl);

    setIsConnected(true);

    // A reconnected stream clears the lost-connection state on its next message.
    eventSource.onopen = () => setIsConnected(true);
    eventSource.onmessage = (event) => {
      setIsConnected(true);
      try {
        const payload: TelemetryPayload = JSON.parse(event.data);
        setTelemetry(payload);
        
        // Maintain a rolling history covering the whole cook
        setHistory((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].timestamp === payload.timestamp) {
            return prev;
          }
          const updated = [...prev, payload];
          return updated.slice(-MAX_HISTORY_POINTS);
        });
      } catch {
        // Ignore a malformed frame; the next reading replaces it.
      }
    };

    // EventSource reconnects on its own; the UI shows the lost connection meanwhile.
    eventSource.onerror = () => setIsConnected(false);

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
          const startedAt = Date.now();
          localStorage.setItem(`rest_start_${activeSession.id}`, String(startedAt));
          setRestStartedAt(startedAt);
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

  const applyPresetF = (meat: string, cut: string, targetF: number) => {
    setMeatType(meat);
    setCutType(cut);
    setTargetTempF(targetF);
  };

  // Live cook derivation. Nothing here falls back to invented readings.
  const carryoverC = telemetry?.carryover_rise ?? null;
  const overrideStage = debugPhaseOverride !== null ? STAGE_BY_PHASE[debugPhaseOverride] ?? null : null;
  const stage: Stage | null =
    overrideStage ??
    (activeSession
      ? deriveStage({ status: activeSession.status, telemetry, targetC: activeSession.target_temp_c, carryoverC })
      : null);
  const currentPhase = debugPhaseOverride ?? (stage ? PHASE_BY_STAGE[stage] : 1);

  // Carryover peak: the highest core reading since the rest began.
  const restReadings = restStartedAt !== null ? history.filter((r) => new Date(r.timestamp).getTime() >= restStartedAt) : [];
  const peakRestTempC = restReadings.length > 0 ? Math.max(...restReadings.map((r) => r.core_temp_filtered)) : null;

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
        stage,
        carryoverC,
        restStartedAt,
        peakRestTempC,
        currentPhase,
        debugPhaseOverride,
        setDebugPhaseOverride,
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
