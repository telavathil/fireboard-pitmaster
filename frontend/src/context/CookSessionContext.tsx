"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CookSession, TelemetryPayload } from "../types";
import { BACKEND_URL } from "../lib/api";
import { Stage, deriveStage, parseServerTime } from "../components/live/cookModel";
import { SessionPayload } from "../components/setup/setupModel";

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
  sessionError: string | null;
  startCook: (payload: SessionPayload) => Promise<boolean>;
  handleUpdateStatus: (status: string) => Promise<boolean>;
  handleEndCook: () => Promise<boolean>;

  // Navigation
  /** "dashboard" is the Cook tab: setup with no session, the live screen during one. */
  activeTab: "dashboard" | "history" | "settings";
  setActiveTab: (tab: "dashboard" | "history" | "settings") => void;

  // Settings
  tempUnit: "F" | "C";
  setTempUnit: (unit: "F" | "C") => void;
  alarmsEnabled: boolean;
  setAlarmsEnabled: (enabled: boolean) => void;

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

const PREF_KEYS = { unit: "pitmaster_temp_unit", alarms: "pitmaster_alarm_sound" } as const;

function readPref(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode); the choice still applies for this visit.
  }
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

  const [sessionError, setSessionError] = useState<string | null>(null);

  // Active Navigation Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "settings">("dashboard");

  // Settings view inputs
  // Display preferences, remembered on this device. Authenticated screens never
  // server-render, so reading storage in the initializer can't cause a hydration mismatch.
  const [tempUnit, setTempUnitState] = useState<"F" | "C">(() => (readPref(PREF_KEYS.unit) === "C" ? "C" : "F"));
  const [alarmsEnabled, setAlarmsEnabledState] = useState<boolean>(() => readPref(PREF_KEYS.alarms) !== "off");
  const setTempUnit = (unit: "F" | "C") => {
    setTempUnitState(unit);
    writePref(PREF_KEYS.unit, unit);
  };
  const setAlarmsEnabled = (enabled: boolean) => {
    setAlarmsEnabledState(enabled);
    writePref(PREF_KEYS.alarms, enabled ? "on" : "off");
  };

  // Live Telemetry States
  const [telemetry, setTelemetry] = useState<TelemetryPayload | null>(null);
  const [history, setHistory] = useState<TelemetryPayload[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Rest tracking (set when the cook is pulled; persisted per session in localStorage)
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);

  // Debug override check via URL query parameters
  const [debugPhaseOverride, setDebugPhaseOverride] = useState<number | null>(null);

  const backendUrl = BACKEND_URL;

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

  // Starting or ending a cook returns to the Cook tab (setup or live screen).
  useEffect(() => {
    setActiveTab("dashboard");
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
        setActiveTab("dashboard");
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

  /** Creates a cook from a validated setup payload. Resolves true when the session started. */
  const startCook = async (payload: SessionPayload): Promise<boolean> => {
    setSessionError(null);
    setIsCreatingSession(true);

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
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      setSessionError(errData.detail || "The cook couldn't be started. Check the details and try again.");
      return false;
    } catch {
      setSessionError("Couldn't reach the server. Check that the backend is running, then try again.");
      return false;
    } finally {
      setIsCreatingSession(false);
    }
  };

  /** Saves a status change. Resolves true once the backend has it; the session is left as-is otherwise. */
  const handleUpdateStatus = async (newStatus: string): Promise<boolean> => {
    if (!activeSession) return false;
    try {
      const res = await fetch(`${backendUrl}/api/sessions/${activeSession.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) return false;
      if (newStatus === "completed") {
        // A finished cook is never restored as the active session.
        setActiveSession(null);
        setTelemetry(null);
        setHistory([]);
        return true;
      }
      setActiveSession({ ...activeSession, status: newStatus });
      if (newStatus === "resting") {
        const startedAt = Date.now();
        localStorage.setItem(`rest_start_${activeSession.id}`, String(startedAt));
        setRestStartedAt(startedAt);
      }
      return true;
    } catch {
      return false;
    }
  };

  /** Ends the cook only once the backend has saved it, so a failed save never loses a running cook. */
  const handleEndCook = () => handleUpdateStatus("completed");

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
  const restReadings = restStartedAt !== null ? history.filter((r) => parseServerTime(r.timestamp) >= restStartedAt) : [];
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
        sessionError,
        startCook,
        handleUpdateStatus,
        handleEndCook,
        activeTab,
        setActiveTab,
        tempUnit,
        setTempUnit,
        alarmsEnabled,
        setAlarmsEnabled,
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
