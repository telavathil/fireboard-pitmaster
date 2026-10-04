"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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

const TOKEN_KEY = "pitmaster_token";
const USERNAME_KEY = "pitmaster_username";

/** A saved sign-in counts only when both the token and username are present. */
function readSavedAuth(): { token: string; username: string } | null {
  const token = readPref(TOKEN_KEY);
  const username = readPref(USERNAME_KEY);
  return token && username ? { token, username } : null;
}

/** `?phase=N` forces a stage for design review; it only exercises rendering. */
function readPhaseOverride(): number | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("phase");
  const phase = value ? parseInt(value, 10) : Number.NaN;
  return Number.isFinite(phase) ? phase : null;
}

/** When the rest began on this device; if the pull was never logged here, the rest clock starts now. */
function restStartFor(sessionId: string): number {
  const key = `rest_start_${sessionId}`;
  const saved = Number(readPref(key));
  if (saved > 0) return saved;
  const now = Date.now();
  writePref(key, String(now));
  return now;
}

declare global {
  interface Window {
    /** Exposed for Playwright e2e checks. */
    activeTab?: string;
    currentPhase?: number;
  }
}

/** Keeps roughly 12 hours of readings at the backend's 20 s polling cadence. */
const MAX_HISTORY_POINTS = 2160;

const PHASE_BY_STAGE: Record<Stage, number> = { stabilizing: 2, stall: 3, pull: 4, rest: 5, cooking: 6 };
const STAGE_BY_PHASE: Record<number, Stage> = { 2: "stabilizing", 3: "stall", 4: "pull", 5: "rest", 6: "cooking" };

const CookSessionContext = createContext<CookSessionContextType | undefined>(undefined);

export function CookSessionProvider({ children }: { children: React.ReactNode }) {
  // The provider mounts client-side only (see page.tsx), so saved state is read directly at init.
  const [savedAuth] = useState(readSavedAuth);
  const [token, setToken] = useState<string | null>(savedAuth?.token ?? null);
  const [username, setUsername] = useState<string>(savedAuth?.username ?? "");
  const [password, setPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Cook Session State
  const [activeSession, setActiveSession] = useState<CookSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(savedAuth !== null);
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
  const [connectionLost, setConnectionLost] = useState<boolean>(false);

  // When the current rest began (persisted per session in localStorage).
  const [restStart, setRestStart] = useState<number | null>(null);

  const [debugPhaseOverride, setDebugPhaseOverride] = useState<number | null>(readPhaseOverride);

  const backendUrl = BACKEND_URL;

  const fetchActiveSession = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sessions/active`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data: CookSession | null = res.ok ? await res.json() : null;
      setActiveSession(data);
      if (data?.status === "resting") setRestStart(restStartFor(data.id));
    } catch {
      // Backend unreachable: stay signed in; the setup screen's start action reports the problem.
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  // Load the active cook once for a saved sign-in.
  const initialToken = useRef(savedAuth?.token ?? null);
  useEffect(() => {
    if (initialToken.current) void fetchActiveSession(initialToken.current);
  }, [fetchActiveSession]);

  // Live telemetry for the active cook. EventSource reconnects on its own;
  // the UI shows a lost connection only after a real error.
  const streamDeviceId = activeSession?.device_id ?? null;
  const streamSessionId = activeSession?.id ?? null;
  useEffect(() => {
    if (!streamDeviceId) return;
    const eventSource = new EventSource(`${BACKEND_URL}/api/telemetry/stream/${streamDeviceId}/1`);
    eventSource.onopen = () => setConnectionLost(false);
    eventSource.onmessage = (event) => {
      setConnectionLost(false);
      try {
        const payload: TelemetryPayload = JSON.parse(event.data);
        setTelemetry(payload);
        // Maintain a rolling history covering the whole cook
        setHistory((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].timestamp === payload.timestamp) return prev;
          return [...prev, payload].slice(-MAX_HISTORY_POINTS);
        });
      } catch {
        // Ignore a malformed frame; the next reading replaces it.
      }
    };
    eventSource.onerror = () => setConnectionLost(true);
    return () => {
      eventSource.close();
      setConnectionLost(false);
      setTelemetry(null);
      setHistory([]);
    };
  }, [streamDeviceId, streamSessionId]);

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
        writePref(TOKEN_KEY, data.access_token);
        writePref(USERNAME_KEY, username);
        setToken(data.access_token);
        fetchActiveSession(data.access_token);
      } else {
        const errData = await res.json();
        setAuthError(errData.detail || "Sign-in failed. Check your username and password.");
      }
    } catch {
      setAuthError("Couldn't reach the server. Check that the backend is running, then try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USERNAME_KEY);
    } catch {
      // Storage unavailable; the in-memory sign-out below still applies.
    }
    setToken(null);
    setActiveSession(null);
    setActiveTab("dashboard");
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
        setActiveTab("dashboard");
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
        setActiveTab("dashboard");
        return true;
      }
      setActiveSession({ ...activeSession, status: newStatus });
      if (newStatus === "resting") {
        const startedAt = Date.now();
        writePref(`rest_start_${activeSession.id}`, String(startedAt));
        setRestStart(startedAt);
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

  const restStartedAt = activeSession?.status === "resting" ? restStart : null;
  const isConnected = !connectionLost;

  // Carryover peak: the highest core reading since the rest began.
  const restReadings = restStartedAt !== null ? history.filter((r) => parseServerTime(r.timestamp) >= restStartedAt) : [];
  const peakRestTempC = restReadings.length > 0 ? Math.max(...restReadings.map((r) => r.core_temp_filtered)) : null;

  // Expose navigation state for Playwright e2e checks.
  useEffect(() => {
    window.activeTab = activeTab;
    window.currentPhase = currentPhase;
  }, [activeTab, currentPhase]);

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
