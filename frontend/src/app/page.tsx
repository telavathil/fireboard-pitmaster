"use client";

import React, { useState, useEffect, useRef } from "react";

interface CookSession {
  id: string;
  device_id: string;
  device_name?: string;
  meat_type: string;
  cut_type: string;
  cooker_type: string;
  status: string; // e.g. "bare", "resting", "completed"
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
  confidence: string; // "none", "low", "medium", "high", "complete"
  timestamp: string;
}

const WebGLShader = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return;

    let animationFrameId: number;

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
          vec2 uv = v_texCoord;
          float meatMask = smoothstep(0.45, 0.44, abs(uv.x - 0.5)) * smoothstep(0.35, 0.34, abs(uv.y - 0.5));
          float core = 1.0 - length((uv - 0.5) * vec2(1.2, 1.8));
          core = smoothstep(0.0, 0.6, core);
          float progress = mod(u_time * 0.2, 1.0);
          vec3 charcoal = vec3(0.05, 0.05, 0.06);
          vec3 hotOrange = vec3(1.0, 0.3, 0.0);
          vec3 restingPink = vec3(0.8, 0.2, 0.2);
          float outerHeat = smoothstep(0.3, 0.5, 1.0 - length(uv - 0.5));
          float heatWave = (1.0 - outerHeat) * (1.0 - progress);
          float coreHeat = core * (0.5 + 0.5 * progress);
          vec3 finalColor = mix(restingPink * 0.4, hotOrange, heatWave);
          finalColor = mix(finalColor, restingPink, coreHeat);
          finalColor *= meatMask;
          float glow = exp(-5.0 * (1.0 - heatWave)) * (1.0 - progress);
          finalColor += hotOrange * glow * 0.3 * meatMask;
          vec3 background = charcoal;
          gl_FragColor = vec4(mix(background, finalColor, meatMask), 1.0);
      }
    `;

    const createShader = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");

    const resize = () => {
      const w = canvas.clientWidth || 300;
      const h = canvas.clientHeight || 200;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
    }
    resize();

    const renderFrame = (t: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(renderFrame);
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

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
  // 1. Setup Phase: No active session
  // 2. Resting Phase: Active session with status == "resting"
  // 3. Pull Phase: Active session, telemetry available, and core temp has hit the pull target
  // 4. Calibration Phase: Active session, but telemetry confidence is low/none (first 10-15 mins)
  // 5. Stall Phase: Active session, telemetry stable, and stall is detected
  // 6. Active Cook: Base active cook state

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
                className="w-full bg-surface-container-low border border-outline-variant/40 px-sm py-xs text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
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
                className="w-full bg-surface-container-low border border-outline-variant/40 px-sm py-xs text-sm text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
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
              className="w-full py-sm bg-primary-container text-on-primary-container font-display-lg text-headline-md active:scale-[0.98] transition-transform duration-150 ember-glow cursor-pointer disabled:opacity-50 tracking-wider"
            >
              {isLoggingIn ? "AUTHENTICATING..." : "SIGN IN"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // SHARED DESKTOP LAYOUT SHELL (aside, header)
  // ==========================================
  const renderDesktopSidebar = () => {
    return (
      <aside className="flex flex-col py-md bg-surface-container h-screen w-64 fixed left-0 top-0 border-r border-outline-variant z-50">
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
            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
              activeTab === "dashboard"
                ? "bg-primary-container text-on-primary-container font-bold border-l-4 border-primary"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-mono text-label-mono">Dashboard</span>
          </div>
          <div
            onClick={() => setActiveTab("probes")}
            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
              activeTab === "probes"
                ? "bg-primary-container text-on-primary-container font-bold border-l-4 border-primary"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined">thermostat</span>
            <span className="font-label-mono text-label-mono">Probes</span>
          </div>
          <div
            onClick={() => setActiveTab("history")}
            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
              activeTab === "history"
                ? "bg-primary-container text-on-primary-container font-bold border-l-4 border-primary"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined">history</span>
            <span className="font-label-mono text-label-mono">History</span>
          </div>
          <div
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
              activeTab === "settings"
                ? "bg-primary-container text-on-primary-container font-bold border-l-4 border-primary"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
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
  };

  const renderDesktopHeader = () => {
    return (
      <header className="flex justify-between items-center px-margin-desktop w-[calc(100%-16rem)] ml-64 bg-surface h-20 border-b border-outline-variant z-40 fixed top-0 left-0 right-0">
        <div className="flex items-center gap-gutter">
          <span className="font-headline-lg text-headline-lg uppercase tracking-tighter text-primary">EMBER & CHAR</span>
          <div className="h-6 w-[1px] bg-outline-variant mx-4"></div>
          <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">
            SESSION ID: <span className="text-primary">#{activeSession ? activeSession.id.substring(0, 8).toUpperCase() : "BBQ-2026-0812"}</span>
          </span>
        </div>
        <div className="flex items-center gap-md">
          {activeSession ? (
            <button
              onClick={handleEndCook}
              className="bg-primary-container text-on-primary-container font-headline-md px-6 py-2 tracking-wide active:scale-95 transition-transform uppercase cursor-pointer"
            >
              START NEW COOK
            </button>
          ) : (
            <div className="font-label-mono text-xs text-on-surface-variant uppercase">SYSTEM READY</div>
          )}
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">notifications</span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">account_circle</span>
          </div>
        </div>
      </header>
    );
  };

  // ==========================================
  // PREMIUM TABS & PLACEHOLDER RENDER VIEWS
  // ==========================================
  const renderEmptyDashboardView = () => {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-on-surface font-body-md flex">
        {renderDesktopSidebar()}
        <div className="flex-grow flex flex-col min-h-screen">
          {renderDesktopHeader()}
          <main className="ml-64 mt-20 p-md h-[calc(100vh-5rem)] flex flex-col items-center justify-center bg-background overflow-y-auto">
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
                onClick={() => setActiveTab("probes")}
                className="px-xl py-sm bg-primary-container text-on-primary-container font-headline-md text-xl active:scale-95 duration-100 hover:brightness-110 tracking-wide uppercase cursor-pointer"
              >
                GO TO PROBES SETUP
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  };

  const renderHistoryView = () => {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-on-surface font-body-md flex">
        {renderDesktopSidebar()}
        <div className="flex-grow flex flex-col min-h-screen">
          {renderDesktopHeader()}
          <main className="ml-64 mt-20 p-md h-[calc(100vh-5rem)] grid grid-cols-12 content-start gap-md bg-background overflow-y-auto">
            {/* Left Column - Past Sessions */}
            <div className="col-span-8 flex flex-col gap-md">
              <div className="forge-surface p-md">
                <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-sm">SESSION HISTORY LOG</h2>
                <p className="font-label-mono text-xs text-on-surface-variant uppercase">ARCHIVED TEMPERATURE PROFILES AND KINETIC MODELS</p>
              </div>

              {/* Session Cards */}
              <div className="space-y-sm">
                <div className="forge-surface p-md border-l-4 border-primary/50 relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-label-mono text-[10px] text-primary uppercase font-bold tracking-widest bg-primary/10 px-2 py-0.5 border border-primary/20">
                        SUCCESSFUL COOK
                      </span>
                      <h3 className="font-headline-md text-2xl text-on-surface uppercase mt-2">POST OAK SMOKED BRISKET #3</h3>
                      <p className="font-label-mono text-[10px] text-on-surface-variant uppercase mt-1">SESSION ID: #BBQ-2026-0618 | DATE: JUNE 18, 2026</p>
                    </div>
                    <div className="text-right font-label-mono text-xs">
                      <p className="text-on-surface">DURATION: 11h 42m</p>
                      <p className="text-secondary-fixed mt-1">PEAK INTERNAL: 203°F</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-sm mt-md pt-sm border-t border-outline-variant/30 text-xs font-label-mono">
                    <div>
                      <span className="text-outline uppercase text-[10px]">Meat Weight</span>
                      <p className="text-on-surface mt-1">5.4 kg (11.9 lbs)</p>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-[10px]">Avg Pit Temp</span>
                      <p className="text-on-surface mt-1">228°F (Stable)</p>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-[10px]">Equilibrium Peak</span>
                      <p className="text-on-surface mt-1">206.4°F (Carryover)</p>
                    </div>
                  </div>
                </div>

                <div className="forge-surface p-md border-l-4 border-outline relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-label-mono text-[10px] text-outline-variant uppercase tracking-widest bg-surface-container-high px-2 py-0.5 border border-outline-variant/30">
                        COMPLETED
                      </span>
                      <h3 className="font-headline-md text-2xl text-on-surface uppercase mt-2">HICKORY PEACH PORK SHOULDER #2</h3>
                      <p className="font-label-mono text-[10px] text-on-surface-variant uppercase mt-1">SESSION ID: #BBQ-2026-0610 | DATE: JUNE 10, 2026</p>
                    </div>
                    <div className="text-right font-label-mono text-xs">
                      <p className="text-on-surface">DURATION: 8h 15m</p>
                      <p className="text-secondary-fixed mt-1">PEAK INTERNAL: 205°F</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-sm mt-md pt-sm border-t border-outline-variant/30 text-xs font-label-mono">
                    <div>
                      <span className="text-outline uppercase text-[10px]">Meat Weight</span>
                      <p className="text-on-surface mt-1">3.8 kg (8.4 lbs)</p>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-[10px]">Avg Pit Temp</span>
                      <p className="text-on-surface mt-1">250°F (Hot & Fast)</p>
                    </div>
                    <div>
                      <span className="text-outline uppercase text-[10px]">Equilibrium Peak</span>
                      <p className="text-on-surface mt-1">208.1°F (Carryover)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Historical Analytics */}
            <div className="col-span-4 flex flex-col gap-md">
              <div className="forge-surface p-md">
                <h3 className="font-label-mono text-xs text-on-surface-variant mb-4 uppercase tracking-wider">Historical Analytics</h3>
                <div className="space-y-sm text-xs font-label-mono">
                  <div className="flex justify-between">
                    <span className="text-outline">TOTAL COOK TIME</span>
                    <span className="text-on-surface">42.6 HOURS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">STALL COVERS</span>
                    <span className="text-on-surface">3 SESSIONS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">PREDICTION ERROR</span>
                    <span className="text-primary font-bold">± 4.2 MINS</span>
                  </div>
                  <div className="flex justify-between border-t border-outline-variant/30 pt-xs">
                    <span className="text-outline">FAVORITE PRESET</span>
                    <span className="text-secondary-fixed font-bold">BEEF BRISKET</span>
                  </div>
                </div>
              </div>

              <div className="forge-surface p-md flex flex-col justify-center">
                <p className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] mb-4 font-bold">Wood Fuel Distribution</p>
                <div className="space-y-xs font-label-mono text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>POST OAK</span>
                      <span>70%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2">
                      <div className="bg-primary h-full" style={{ width: "70%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>HICKORY</span>
                      <span>20%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2">
                      <div className="bg-secondary-fixed h-full" style={{ width: "20%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>PEACH WOOD</span>
                      <span>10%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2">
                      <div className="bg-outline h-full" style={{ width: "10%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  };

  const renderSettingsView = () => {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-on-surface font-body-md flex">
        {renderDesktopSidebar()}
        <div className="flex-grow flex flex-col min-h-screen">
          {renderDesktopHeader()}
          <main className="ml-64 mt-20 p-md h-[calc(100vh-5rem)] grid grid-cols-12 content-start gap-md bg-background overflow-y-auto">
            {/* Left Column - Configuration forms */}
            <div className="col-span-8 flex flex-col gap-md">
              <div className="forge-surface p-md">
                <h2 className="font-headline-md text-headline-md text-on-surface uppercase mb-sm">SYSTEM CONFIGURATION</h2>
                <p className="font-label-mono text-xs text-on-surface-variant uppercase">TUNING HARNESS PARAMETERS AND INTERFACE CONTROLS</p>
              </div>

              <div className="forge-surface p-md space-y-md">
                {/* Temperature Unit */}
                <div>
                  <label className="block font-label-mono text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                    Temperature Display Scale
                  </label>
                  <div className="flex gap-sm">
                    <button
                      type="button"
                      onClick={() => setTempUnit("F")}
                      className={`font-label-mono px-md py-xs border text-xs cursor-pointer ${
                        tempUnit === "F"
                          ? "bg-primary-container text-on-primary-container border-primary font-bold"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary"
                      }`}
                    >
                      FAHRENHEIT (°F)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempUnit("C")}
                      className={`font-label-mono px-md py-xs border text-xs cursor-pointer ${
                        tempUnit === "C"
                          ? "bg-primary-container text-on-primary-container border-primary font-bold"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary"
                      }`}
                    >
                      CELSIUS (°C)
                    </button>
                  </div>
                </div>

                {/* Telemetry Stream Rate */}
                <div>
                  <label className="block font-label-mono text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                    SSE Stream Interval
                  </label>
                  <div className="flex gap-sm">
                    {[1, 5, 10].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setUpdateRate(rate)}
                        className={`font-label-mono px-md py-xs border text-xs cursor-pointer ${
                          updateRate === rate
                            ? "bg-primary-container text-on-primary-container border-primary font-bold"
                            : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary"
                        }`}
                      >
                        {rate} SECONDS
                      </button>
                    ))}
                  </div>
                </div>

                {/* Predictive Estimation Model */}
                <div>
                  <label className="block font-label-mono text-xs uppercase tracking-wider text-on-surface-variant mb-2">
                    Thermodynamic Carryover Prediction Model
                  </label>
                  <select
                    value={estimationModel}
                    onChange={(e) => setEstimationModel(e.target.value)}
                    className="bg-surface-container-high border border-outline-variant px-sm py-xs text-sm text-on-surface font-label-mono focus:outline-none focus:border-primary"
                  >
                    <option value="linear">LINEAR EXTRAPOLATION</option>
                    <option value="exponential">EXPONENTIAL DECAY</option>
                    <option value="thermal_mass">THERMAL MASS CAPACITY MODEL</option>
                  </select>
                </div>

                {/* Calibration Offset */}
                <div>
                  <label className="block font-label-mono text-xs uppercase tracking-wider text-on-surface-variant mb-1">
                    Probe 1 Node Calibration Offset (°F)
                  </label>
                  <input
                    type="text"
                    value={probeOffset}
                    onChange={(e) => setProbeOffset(e.target.value)}
                    className="bg-surface-container-high border border-outline-variant/40 px-sm py-xs text-sm text-on-surface font-label-mono w-32 focus:outline-none focus:border-primary"
                    placeholder="0.0"
                  />
                  <p className="font-label-mono text-[9px] text-outline-variant uppercase mt-1">
                    APPLIES RAW TEMPERATURE ADJUSTMENT BEFORE RUNNING DYNAMIC SMOOTHING.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Device status / info */}
            <div className="col-span-4 flex flex-col gap-md">
              <div className="forge-surface p-md">
                <h3 className="font-label-mono text-xs text-on-surface-variant mb-4 uppercase tracking-wider">Hearth Node Device</h3>
                <div className="space-y-sm text-xs font-label-mono">
                  <div className="flex justify-between">
                    <span className="text-outline">DEVICE ID</span>
                    <span className="text-on-surface font-bold">device_sim_123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">IP ENDPOINT</span>
                    <span className="text-on-surface font-bold">192.168.1.104</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">HARDWARE MAC</span>
                    <span className="text-on-surface font-bold">00:1A:7D:DA:71:11</span>
                  </div>
                  <div className="flex justify-between border-t border-outline-variant/30 pt-xs">
                    <span className="text-outline">SSE BROKER STATUS</span>
                    <span className="text-green-500 font-bold">CONNECTED</span>
                  </div>
                </div>
              </div>

              <div className="forge-surface p-md">
                <h3 className="font-label-mono text-xs text-on-surface-variant mb-4 uppercase tracking-wider">Critical Audio Alarm</h3>
                <div className="flex items-center gap-sm">
                  <button
                    onClick={() => setAlarmsEnabled(!alarmsEnabled)}
                    className={`font-label-mono px-md py-xs border text-xs cursor-pointer w-full transition-all ${
                      alarmsEnabled
                        ? "bg-error-container text-on-error-container border-error"
                        : "bg-surface-container-high text-on-surface-variant border-outline-variant"
                    }`}
                  >
                    {alarmsEnabled ? "AUDIO ALARMS: ON" : "AUDIO ALARMS: MUTED"}
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  };

  // ==========================================
  // VIEW ROUTING BY ACTIVE TAB & DEBUG OVERRIDES
  // ==========================================
  if (typeof window !== "undefined") {
    (window as any).activeTab = activeTab;
    (window as any).currentPhase = currentPhase;
  }

  if (activeTab === "history") {
    return renderHistoryView();
  }

  if (activeTab === "settings") {
    return renderSettingsView();
  }

  if (activeTab === "probes") {
    // Probes tab displays the Setup & Calibration UI (which is Phase 1 layout)
    currentPhase = 1;
  }

  if (activeTab === "dashboard") {
    if (!activeSession && debugPhaseOverride === null) {
      return renderEmptyDashboardView();
    }
  }

  // ==========================================
  // PHASE 1: PRE-COOK SETUP
  // ==========================================
  if (currentPhase === 1) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-on-surface font-body-md brushed-metal flex">
        {renderDesktopSidebar()}
        <div className="flex-1 flex flex-col min-h-screen">
          {renderDesktopHeader()}
          <main className="ml-64 mt-20 p-md h-[calc(100vh-5rem)] grid grid-cols-12 content-start gap-md bg-background overflow-y-auto">
            {/* Left Column (col-span-8) */}
            <div className="col-span-8 flex flex-col gap-md">
              {/* Target Doneness */}
              <section className="bg-surface border border-outline-variant p-md relative overflow-hidden group flex-grow flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[2px_0_10px_rgba(255,87,26,0.5)]"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-headline-md text-on-surface uppercase">TARGET DONENESS</h3>
                    <p className="font-label-mono text-xs text-on-surface-variant uppercase">MOLECULAR PROTEIN RECONSTRUCT PARAMETERS</p>
                  </div>
                  <div className="text-right">
                    <span className="font-display-lg text-[64px] text-primary-container leading-none font-bold">{targetTempF}°F</span>
                    <p className="font-label-mono text-xs text-on-surface-variant uppercase mt-1">INTERNAL CORE TARGET</p>
                  </div>
                </div>

                <div className="flex flex-col gap-md my-md">
                  <div className="flex flex-wrap gap-xs">
                    <button
                      type="button"
                      onClick={() => applyPresetF("beef", "Brisket Flat", 203)}
                      className={`font-label-mono px-md py-xs border text-xs cursor-pointer ${
                        meatType === "beef" && targetTempF === 203
                          ? "bg-primary-container text-on-primary-container border-primary font-bold"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary"
                      }`}
                    >
                      BRISKET (203°F)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetF("pork", "Shoulder Butt", 205)}
                      className={`font-label-mono px-md py-xs border text-xs cursor-pointer ${
                        meatType === "pork" && targetTempF === 205
                          ? "bg-primary-container text-on-primary-container border-primary font-bold"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary"
                      }`}
                    >
                      PORK BUTT (205°F)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetF("beef", "Prime Ribeye", 135)}
                      className={`font-label-mono px-md py-xs border text-xs cursor-pointer ${
                        meatType === "beef" && targetTempF === 135
                          ? "bg-primary-container text-on-primary-container border-primary font-bold"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary"
                      }`}
                    >
                      MEDIUM RARE (135°F)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetF("poultry", "Whole Bird", 165)}
                      className={`font-label-mono px-md py-xs border text-xs cursor-pointer ${
                        meatType === "poultry" && targetTempF === 165
                          ? "bg-primary-container text-on-primary-container border-primary font-bold"
                          : "bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-primary"
                      }`}
                    >
                      POULTRY (165°F)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetF("beef", "Custom", 195)}
                      className="bg-surface-container-high text-on-surface-variant border border-outline-variant hover:border-primary font-label-mono px-md py-xs text-xs cursor-pointer"
                    >
                      CUSTOM
                    </button>
                  </div>

                  <div className="py-xs">
                    <input
                      type="range"
                      min="100"
                      max="220"
                      value={targetTempF}
                      onChange={(e) => setTargetTempF(parseInt(e.target.value, 10))}
                      className="w-full h-1 cursor-pointer accent-primary bg-surface-container-high"
                    />
                    <div className="flex justify-between mt-sm font-label-mono text-[10px] text-on-surface-variant">
                      <span>100°F (RAW COLD)</span>
                      <span>165°F (STALL THRESHOLD)</span>
                      <span>212°F (BOILING POINT)</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Geometry Calibration (3D volumetric scanning) */}
              <section className="bg-surface border border-outline-variant p-md relative overflow-hidden flex-grow">
                <div className="flex justify-between items-center mb-md">
                  <h3 className="font-headline-md text-on-surface uppercase">GEOMETRY CALIBRATION</h3>
                  <span className="font-label-mono text-xs text-primary uppercase">3D VOLUMETRIC SCAN READY</span>
                </div>
                <div className="grid grid-cols-2 gap-md items-center">
                  <div className="relative aspect-[3/2] bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center p-sm forge-texture">
                    <div className="w-40 h-24 bg-on-primary-fixed-variant/20 border-2 border-primary/45 relative transform rotate-12 transition-transform hover:scale-105 duration-700">
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-full h-1/3 bg-primary/10 border-b border-primary/20 animate-pulse"></div>
                        <div className="w-full h-1/3 bg-primary/20 border-b border-primary/45"></div>
                        <div className="w-full h-1/3 bg-primary/30"></div>
                      </div>
                      <div className="absolute -top-4 -right-4 font-label-mono text-[10px] text-primary bg-surface border border-primary px-xs uppercase">CORE AXIS</div>
                    </div>
                    <div className="absolute inset-4 border border-outline-variant/20 pointer-events-none"></div>
                    <div className="absolute bottom-2 left-2 font-label-mono text-[10px] text-on-surface-variant uppercase">
                      REF: {meatType.toUpperCase()}_{cutType.replace(/\s+/g, '_').toUpperCase() || "PIECE"}
                    </div>
                  </div>

                  <div className="space-y-sm">
                    <div>
                      <label className="block font-label-mono text-[10px] text-on-surface-variant mb-1 uppercase">THICKNESS (MM)</label>
                      <div className="flex items-center gap-md">
                        <input
                          type="range"
                          min="10"
                          max="150"
                          value={thicknessMm}
                          onChange={(e) => setThicknessMm(e.target.value)}
                          className="flex-grow accent-primary"
                        />
                        <span className="font-label-mono text-primary w-10 text-right">{thicknessMm}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-label-mono text-[10px] text-on-surface-variant mb-1 uppercase">WEIGHT (KG)</label>
                      <div className="flex items-center gap-md">
                        <input
                          type="range"
                          min="0.5"
                          max="10.0"
                          step="0.1"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          className="flex-grow accent-primary"
                        />
                        <span className="font-label-mono text-primary w-10 text-right">{weightKg}</span>
                      </div>
                    </div>
                    <div className="p-sm bg-surface-container-high border border-outline-variant">
                      <p className="font-label-mono text-[10px] text-on-surface-variant leading-tight uppercase">
                        ESTIMATED THERMAL INERTIA:<br />
                        <span className="text-secondary-fixed font-bold">{(parseFloat(weightKg) * 2.74).toFixed(2)} KJ/K</span>
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column (col-span-4) */}
            <div className="col-span-4 flex flex-col gap-md">
              {/* Channel Mapping */}
              <section className="bg-surface border border-outline-variant p-md flex flex-col justify-between flex-grow">
                <div>
                  <h3 className="font-headline-md text-on-surface mb-sm uppercase">CHANNEL MAPPING</h3>
                  <div className="space-y-xs">
                    <div className="flex justify-between items-center p-sm bg-surface-container-lowest border border-outline-variant">
                      <div className="flex items-center gap-sm">
                        <div className="w-3 h-3 bg-primary glow-orange"></div>
                        <span className="font-label-mono text-xs">PROBE 01 (CORE)</span>
                      </div>
                      <span className="material-symbols-outlined text-primary text-sm">link</span>
                    </div>
                    <div className="flex justify-between items-center p-sm bg-surface-container-lowest border border-outline-variant">
                      <div className="flex items-center gap-sm">
                        <div className="w-3 h-3 bg-secondary-fixed"></div>
                        <span className="font-label-mono text-xs">PROBE 02 (AMBIENT)</span>
                      </div>
                      <span className="material-symbols-outlined text-secondary-fixed text-sm">link</span>
                    </div>
                  </div>

                  <div className="mt-md space-y-xs">
                    <label className="block font-label-mono text-[10px] text-on-surface-variant uppercase">Device ID</label>
                    <input
                      type="text"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      className="w-full bg-[#1c1b1c] border border-outline-variant/40 px-sm py-xs text-xs text-on-surface focus:outline-none"
                    />
                    <label className="block font-label-mono text-[10px] text-on-surface-variant uppercase">Device Label</label>
                    <input
                      type="text"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="w-full bg-[#1c1b1c] border border-outline-variant/40 px-sm py-xs text-xs text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-md">
                  {sessionError && (
                    <div className="text-error text-xs font-label-mono bg-error-container/10 border border-error-container/20 p-xs mb-xs">
                      {sessionError}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateSession}
                    disabled={isCreatingSession}
                    className="w-full bg-primary-container text-on-primary-container font-headline-md py-md hover:brightness-110 active:scale-95 transition-all glow-orange cursor-pointer uppercase tracking-wider text-headline-md"
                  >
                    {isCreatingSession ? "INITIALIZING SOLVER..." : "INITIALIZE THERMAL MODEL"}
                  </button>
                </div>
              </section>

              {/* Cooker Profile cards */}
              <section className="bg-surface border border-outline-variant p-md flex-grow">
                <h3 className="font-headline-md text-on-surface mb-sm uppercase">COOKER THERMAL PROFILE</h3>
                <div className="grid grid-cols-2 gap-sm">
                  <button
                    type="button"
                    onClick={() => setCookerType("kamado")}
                    className={`p-sm text-left border relative overflow-hidden transition-all cursor-pointer ${
                      cookerType === "kamado" ? "border-primary bg-surface-container-high glow-orange-inner" : "border-outline-variant bg-surface-container-lowest hover:border-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-primary text-sm mb-1">oven_gen</span>
                    <h4 className="font-headline-md text-xs text-on-surface">KAMADO</h4>
                    <p className="font-label-mono text-[8px] text-on-surface-variant mt-0.5 leading-tight">High Retention / Low Flow</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCookerType("pellet")}
                    className={`p-sm text-left border relative overflow-hidden transition-all cursor-pointer ${
                      cookerType === "pellet" ? "border-primary bg-surface-container-high glow-orange-inner" : "border-outline-variant bg-surface-container-lowest hover:border-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-sm mb-1">heat_pump</span>
                    <h4 className="font-headline-md text-xs text-on-surface">PELLET</h4>
                    <p className="font-label-mono text-[8px] text-on-surface-variant mt-0.5 leading-tight">Forced Convection</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCookerType("offset")}
                    className={`p-sm text-left border relative overflow-hidden transition-all cursor-pointer ${
                      cookerType === "offset" ? "border-primary bg-surface-container-high glow-orange-inner" : "border-outline-variant bg-surface-container-lowest hover:border-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-sm mb-1">air</span>
                    <h4 className="font-headline-md text-xs text-on-surface">OFFSET</h4>
                    <p className="font-label-mono text-[8px] text-on-surface-variant mt-0.5 leading-tight">Natural Draft</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCookerType("oven")}
                    className={`p-sm text-left border relative overflow-hidden transition-all cursor-pointer ${
                      cookerType === "oven" ? "border-primary bg-surface-container-high glow-orange-inner" : "border-outline-variant bg-surface-container-lowest hover:border-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-sm mb-1">bolt</span>
                    <h4 className="font-headline-md text-xs text-on-surface">ELECTRIC</h4>
                    <p className="font-label-mono text-[8px] text-on-surface-variant mt-0.5 leading-tight">Stagnant Air</p>
                  </button>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 5: RESTING PHASE
  // ==========================================
  if (currentPhase === 5) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-on-surface font-body-md flex">
        {renderDesktopSidebar()}
        <div className="flex-grow flex flex-col min-h-screen">
          {renderDesktopHeader()}
          <main className="ml-64 mt-20 p-md h-[calc(100vh-5rem)] grid grid-cols-12 content-start gap-md bg-background overflow-y-auto">
            {/* Left Column: Temperature History Chart */}
            <section className="col-span-7 flex flex-col gap-md h-full">
              <div className="forge-surface p-md flex-grow flex flex-col justify-between">
                <div className="flex justify-between items-end mb-md">
                  <div>
                    <h2 className="font-headline-md text-on-surface uppercase leading-none text-2xl">Session Thermal History</h2>
                    <p className="font-label-mono text-xs text-on-surface-variant uppercase mt-1">FULL DURATION: 11h 42m</p>
                  </div>
                  <div className="flex gap-md font-label-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-primary"></span>
                      <span className="uppercase">Core Temp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-on-tertiary-container"></span>
                      <span className="uppercase">Ambient</span>
                    </div>
                  </div>
                </div>
                
                {/* Visual Chart with Scanline */}
                <div className="relative flex-grow bg-surface-container-lowest border border-outline-variant/50 p-4 overflow-hidden min-h-[220px]">
                  <div className="scanline"></div>
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    <path d="M0 100 L1000 100 M0 200 L1000 200 M0 300 L1000 300" stroke="#262626" strokeWidth="1"></path>
                    
                    {/* Simulated Ambient Line */}
                    <path d="M0 80 Q 100 90 200 70 T 400 85 T 600 75 T 800 80 T 1000 250" fill="none" stroke="#474747" strokeDasharray="4,2" strokeWidth="2"></path>
                    
                    {/* Simulated Core Temp Line */}
                    <path d="M0 380 Q 200 350 400 280 T 600 180 T 800 120 L 850 115 Q 900 115 1000 135" fill="none" stroke="#ff571a" strokeWidth="3"></path>
                    
                    {/* Pull Point Indicator */}
                    <line opacity="0.5" stroke="#ffb59e" strokeDasharray="8,4" strokeWidth="1" x1="850" x2="850" y1="380" y2="10"></line>
                    <circle cx="850" cy="115" fill="#ff571a" r="5"></circle>
                    <text fill="#ff571a" fontFamily="Bebas Neue" fontSize="20" x="690" y="100">PULL POINT ({pullTempF}°F)</text>
                    
                    {/* Peak Temp Indicator */}
                    <circle className="animate-pulse" cx="910" cy="114" fill="#ffe16d" r="6"></circle>
                    <text fill="#ffe16d" fontFamily="Bebas Neue" fontSize="24" x="925" y="105">PEAK TEMP ({Math.round(peakRestTempC * 9/5 + 32)}°F)</text>
                    
                    {/* Resting Phase Shading */}
                    <rect fill="rgba(255, 87, 26, 0.05)" height="400" width="150" x="850" y="0"></rect>
                    <text fill="#ff571a" fontFamily="JetBrains Mono" fontSize="12" opacity="0.6" x="860" y="380">RESTING PHASE ACTIVE</text>
                  </svg>
                </div>
                
                {/* Horizontal bottom metrics matching design */}
                <div className="mt-md grid grid-cols-4 gap-md border-t border-outline-variant/30 pt-md">
                  <div className="border-l border-primary/40 pl-3">
                    <p className="font-label-mono text-[10px] text-on-surface-variant uppercase">Current Core</p>
                    <p className="font-headline-md text-on-surface text-xl">{coreTempF}°F</p>
                  </div>
                  <div className="border-l border-primary/40 pl-3">
                    <p className="font-label-mono text-[10px] text-on-surface-variant uppercase">Current Ambient</p>
                    <p className="font-headline-md text-on-surface text-xl">
                      {telemetry?.ambient_temp ? `${Math.round(telemetry.ambient_temp * 9/5 + 32)}°F` : "76°F"}
                    </p>
                  </div>
                  <div className="border-l border-primary/40 pl-3">
                    <p className="font-label-mono text-[10px] text-on-surface-variant uppercase">Total Cook Time</p>
                    <p className="font-headline-md text-on-surface text-xl">11h 42m</p>
                  </div>
                  <div className="border-l border-primary/40 pl-3">
                    <p className="font-label-mono text-[10px] text-on-surface-variant uppercase">Rest Elapsed</p>
                    <p className="font-headline-md text-primary text-xl">{formatStopwatch(restDurationSeconds)}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column: Resting Summary Panel */}
            <section className="col-span-5 flex flex-col gap-md h-full pr-2">
              {/* Resting Active Header Card */}
              <div className="forge-surface p-md border-primary inner-glow-orange flex flex-col justify-between min-h-[120px]">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 bg-primary-container animate-pulse"></span>
                      <h2 className="font-headline-md text-primary uppercase leading-none text-xl">Resting Active</h2>
                    </div>
                    <p className="font-display-lg text-display-lg tracking-tighter" id="resting-timer">
                      {formatStopwatch(restDurationSeconds).substring(3)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="bg-primary/20 text-primary border border-primary/40 px-3 py-1 font-label-mono text-xs mb-2">
                      PEAK CORE: {Math.round(peakRestTempC * 9/5 + 32)}°F
                    </div>
                    <div className="flex items-center gap-1 justify-end text-secondary-fixed">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span className="font-label-mono text-xs uppercase">Target Met ({targetTempFDisplay}°F)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thermal Equalization Schematic */}
              <div className="forge-surface flex-grow flex flex-col">
                <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                  <h3 className="font-label-mono text-xs uppercase tracking-widest font-bold">Thermal Equalization Schematic</h3>
                  <span className="text-[10px] font-label-mono text-primary/60 animate-pulse">SCAN ACTIVE...</span>
                </div>
                
                {/* SVG cross-section visualizer */}
                <div className="relative flex-grow bg-black overflow-hidden min-h-[160px] flex items-center justify-center">
                  <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none z-10">
                    <div className="flex justify-between items-start">
                      <div className="bg-black/60 backdrop-blur-sm p-2 border border-outline-variant/30">
                        <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">SURFACE REGION</p>
                        <p className="font-headline-md text-xs text-primary uppercase">DIFFUSING HEAT</p>
                      </div>
                      <div className="text-right bg-black/60 backdrop-blur-sm p-2 border border-outline-variant/30">
                        <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">CORE EQUILIBRIUM</p>
                        <p className="font-headline-md text-xs text-secondary-fixed uppercase">PLATEAU REACHED</p>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="bg-primary/10 border border-primary/30 px-4 py-1">
                        <p className="font-label-mono text-[9px] text-primary text-center uppercase">FLOW VECTOR: INWARD</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 w-full h-full">
                    <WebGLShader />
                  </div>
                  <svg className="absolute w-48 h-32 pointer-events-none z-10" viewBox="0 0 100 60">
                    <line x1="50" y1="5" x2="50" y2="55" stroke="#ad897e" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                    <circle cx="50" cy="30" r="3" fill="#ffe16d" className="animate-pulse" />
                  </svg>
                </div>

                <div className="p-3 bg-surface-container-lowest grid grid-cols-2 gap-4 border-t border-outline-variant/20">
                  <div>
                    <p className="font-label-mono text-[10px] text-on-surface-variant uppercase">Surface Temp</p>
                    <div className="w-full bg-surface-container h-1 mt-1">
                      <div className="h-full bg-primary" style={{ width: "85%" }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-label-mono text-[10px] text-on-surface-variant uppercase">Core Temp</p>
                    <div className="w-full bg-surface-container h-1 mt-1">
                      <div className="h-full bg-secondary-fixed" style={{ width: "94%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Equilibrium Status Card */}
              <div className="forge-surface p-sm bg-secondary-container/5 border-secondary-fixed/40">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 border border-secondary-fixed flex items-center justify-center text-secondary-fixed glow-orange">
                    <span className="material-symbols-outlined text-lg">science</span>
                  </div>
                  <h3 className="font-headline-md text-secondary-fixed text-lg uppercase leading-none">Equilibrium Established</h3>
                </div>
                <p className="font-body-md text-xs text-on-surface leading-snug">
                  Core temperature has stabilized and begun a <span className="text-secondary-fixed font-bold">-0.2°C</span> trend. Connective tissues have successfully gelatinized via carry-over heat. <span className="text-primary font-bold">Ready to slice.</span>
                </p>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 gap-md">
                <div className="forge-surface p-3 flex flex-col items-center justify-center">
                  <p className="font-label-mono text-[9px] text-on-surface-variant uppercase mb-1">Moisture Retention</p>
                  <p className="font-headline-md text-xl text-on-surface">98.4%</p>
                  <div className="w-full h-1 bg-surface-container-highest mt-1">
                    <div className="h-full bg-primary" style={{ width: "98.4%" }}></div>
                  </div>
                </div>
                <div className="forge-surface p-3 flex flex-col items-center justify-center text-center">
                  <p className="font-label-mono text-[9px] text-on-surface-variant uppercase mb-1">Carry-over Rise</p>
                  <p className="font-headline-md text-xl text-primary">+{carryoverRiseF}°F</p>
                  <p className="font-label-mono text-[8px] text-on-surface-variant mt-0.5 uppercase">ESTIMATED: +{carryoverRiseF}°F</p>
                </div>
              </div>

              {/* Complete Action Button */}
              <button
                type="button"
                onClick={handleEndCook}
                className="w-full bg-primary-container hover:brightness-110 active:scale-[0.98] transition-all py-6 flex items-center justify-center gap-4 group cursor-pointer"
              >
                <span className="font-headline-lg text-4xl text-on-primary uppercase tracking-wider">Begin Carving</span>
                <span className="material-symbols-outlined text-on-primary group-hover:translate-x-2 transition-transform">restaurant</span>
              </button>
            </section>
          </main>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 4: PULL NOW URGENCY ALERT
  // ==========================================
  if (currentPhase === 4) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-on-surface font-body-md flex">
        {renderDesktopSidebar()}
        <div className="flex-grow flex flex-col min-h-screen">
          {renderDesktopHeader()}
          <main className="ml-64 mt-20 p-md h-[calc(100vh-5rem)] flex flex-col gap-md bg-background overflow-y-auto">
            {/* URGENCY ALERT PANEL (Full width) */}
            <section className="w-full shrink-0 relative bg-surface-container rounded-none border border-primary glow-orange-intense overflow-hidden p-lg metal-texture h-fit">
              <div className="scanline"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-md">
                <div className="space-y-sm max-w-2xl">
                  <div className="flex items-center gap-xs text-primary animate-pulse">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <span className="font-label-mono tracking-widest uppercase text-xs">Target Threshold Reached</span>
                  </div>
                  <h1 className="font-display-lg text-[80px] text-primary leading-none text-glow-orange uppercase italic font-bold">
                    PULL AT {pullTempF}°F
                  </h1>
                  <p className="font-body-lg text-on-surface-variant text-base leading-snug">
                    Remove from heat now. Predicted carryover will cook the meat to your target doneness of <span className="text-secondary-fixed font-bold">{targetTempFDisplay}°F</span> during rest.
                  </p>
                </div>
                <div className="flex flex-col items-center bg-black p-md border border-outline-variant min-w-[140px]">
                  <span className="font-label-mono text-on-surface-variant text-[10px] uppercase tracking-[0.2em]">Time to Pull</span>
                  <div className="font-display-lg text-[48px] text-secondary-fixed leading-none mt-xs">
                    {formatStopwatch(pullTimeSeconds).substring(3)}
                  </div>
                  <div className="w-full h-1 bg-surface-container-highest mt-md overflow-hidden">
                    <div className="h-full bg-secondary-fixed w-2/3 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Carryover Expansion Gauge */}
              <div className="mt-lg relative pt-lg">
                <div className="flex justify-between font-label-mono text-[10px] text-on-surface-variant mb-base uppercase">
                  <span>CURRENT CORE</span>
                  <span className="text-primary">PROJECTED RISE</span>
                  <span>FINAL TARGET</span>
                </div>
                <div className="h-8 w-full bg-surface-container-highest flex border border-outline-variant">
                  <div className="h-full bg-primary-container relative flex items-center justify-end pr-sm" style={{ width: "70%" }}>
                    <div className="font-headline-md text-lg text-on-primary-container font-bold">{coreTempF}°F</div>
                  </div>
                  <div className="h-full bg-gradient-to-r from-primary-container to-secondary-container relative flex items-center justify-end pr-sm" style={{ width: "20%" }}>
                    <div className="font-headline-md text-lg text-secondary-fixed font-bold">+{carryoverRiseF}°F</div>
                  </div>
                  <div className="h-full bg-surface-bright/20 flex-1 relative border-l border-dashed border-secondary-fixed flex items-center justify-end pr-sm">
                    <div className="font-headline-md text-lg text-secondary-fixed font-bold">{targetTempFDisplay}°F</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Section: Chart and Sidebar */}
            <div className="grid grid-cols-12 gap-md w-full">
              {/* Live Chart area */}
              <div className="col-span-8 bg-surface-container border border-outline-variant p-md relative overflow-hidden group flex flex-col justify-between min-h-[300px]">
              <div className="flex justify-between items-center mb-md">
                <div className="font-headline-md text-lg tracking-wide uppercase font-bold">Core Temp Trajectory</div>
                <div className="flex gap-xs items-center">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="font-label-mono text-[10px] text-on-surface-variant">LIVE DATA</span>
                </div>
              </div>
              <div className="flex-grow bg-black/40 border-l border-b border-outline-variant relative min-h-[180px]">
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-10">
                  <div className="border-r border-t border-on-surface"></div><div className="border-r border-t border-on-surface"></div><div className="border-r border-t border-on-surface"></div><div className="border-r border-t border-on-surface"></div><div className="border-r border-t border-on-surface"></div><div className="border-r border-t border-on-surface"></div>
                </div>
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                  <path className="drop-shadow-[0_0_8px_#ff4d00]" d="M0 380 Q 250 350, 500 250 T 1000 40" fill="none" stroke="#ff4d00" strokeWidth="4"></path>
                  <circle className="animate-ping" cx="1000" cy="40" fill="#fff" r="6"></circle>
                  <circle cx="1000" cy="40" fill="#ffb59e" r="4"></circle>
                </svg>
              </div>
              <div className="flex justify-between mt-sm font-label-mono text-[10px] text-on-surface-variant">
                <span>-15 MIN</span>
                <span>-10 MIN</span>
                <span>-5 MIN</span>
                <span className="text-primary font-bold">PULL POINT</span>
              </div>
            </div>

            <div className="col-span-4 flex flex-col gap-md">
              {/* Technical Metrics Sidecar */}
              <div className="bg-surface-container border border-outline-variant p-md metal-texture flex-grow flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="font-label-mono text-xs text-on-surface-variant uppercase tracking-widest">Ambient Pit Temp</span>
                    <div className="font-headline-md text-3xl text-on-surface">
                      {telemetry?.ambient_temp ? `${Math.round(telemetry.ambient_temp * 9/5 + 32)}°F` : "225°F"}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary-fixed">oven_gen</span>
                </div>
                <div className="mt-md flex items-center gap-xs">
                  <span className="text-[10px] font-label-mono text-on-surface-variant">STATUS:</span>
                  <div className="flex-1 h-1 bg-surface-container-highest">
                    <div className="h-full bg-secondary-fixed-dim" style={{ width: "85%" }}></div>
                  </div>
                  <span className="text-[10px] font-label-mono text-secondary-fixed uppercase">STABLE</span>
                </div>
              </div>

              {/* Rate of Rise */}
              <div className="bg-surface-container border border-outline-variant p-md metal-texture flex-grow flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="font-label-mono text-xs text-on-surface-variant uppercase tracking-widest">Rate of Rise</span>
                    <div className="font-headline-md text-3xl text-primary">
                      {telemetry ? `+${(telemetry.heating_rate * 9/5).toFixed(1)}°F/min` : "+0.4°F/min"}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                </div>
                <div className="mt-md space-y-xs">
                  <div className="flex justify-between text-[9px] font-label-mono text-on-surface-variant">
                    <span>TREND</span>
                    <span className="text-primary uppercase">ACCELERATING</span>
                  </div>
                  <div className="h-1 w-full bg-surface-container-highest overflow-hidden">
                    <div className="h-full bg-primary-container" style={{ width: "60%" }}></div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-surface-container border border-outline-variant p-md metal-texture flex flex-col gap-sm">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("resting")}
                  className="w-full py-sm bg-primary text-on-primary font-label-mono uppercase tracking-widest text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  START RESTING TIMER
                </button>
                <button
                  type="button"
                  onClick={handleEndCook}
                  className="w-full py-sm border border-outline text-on-surface font-label-mono uppercase tracking-widest text-xs hover:bg-surface-variant transition-all cursor-pointer"
                >
                  Log Weight & Pull
                </button>
              </div>
            </div>

            {/* Close Bottom Section Grid */}
            </div>

            {/* Secondary Information bar */}
            <div className="grid grid-cols-4 gap-md mt-md">
              <div className="bg-surface-container-low border border-outline-variant p-sm flex items-center gap-md">
                <div className="p-xs bg-surface-container-highest border border-outline-variant">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">timer</span>
                </div>
                <div>
                  <div className="font-label-mono text-[9px] text-on-surface-variant">ELAPSED TIME</div>
                  <div className="font-headline-md text-sm">14H 22M</div>
                </div>
              </div>
              <div className="bg-surface-container-low border border-outline-variant p-sm flex items-center gap-md">
                <div className="p-xs bg-surface-container-highest border border-outline-variant">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">propane_tank</span>
                </div>
                <div>
                  <div className="font-label-mono text-[9px] text-on-surface-variant">FUEL LEVEL</div>
                  <div className="font-headline-md text-sm">42%</div>
                </div>
              </div>
              <div className="bg-surface-container-low border border-outline-variant p-sm flex items-center gap-md">
                <div className="p-xs bg-surface-container-highest border border-outline-variant">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">wifi</span>
                </div>
                <div>
                  <div className="font-label-mono text-[9px] text-on-surface-variant">SIGNAL</div>
                  <div className="font-headline-md text-sm">-62 DBM</div>
                </div>
              </div>
              <div className="bg-surface-container-low border border-outline-variant p-sm flex items-center gap-md">
                <div className="p-xs bg-surface-container-highest border border-outline-variant">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">share</span>
                </div>
                <div>
                  <div className="font-label-mono text-[9px] text-on-surface-variant">SHARE LIVE</div>
                  <div className="font-headline-md text-sm cursor-pointer hover:underline text-primary">COPY LINK</div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 3: STALL DETECTION VIEW
  // ==========================================
  if (currentPhase === 3) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-on-surface font-body-md flex">
        {renderDesktopSidebar()}
        <div className="flex-grow flex flex-col min-h-screen">
          {renderDesktopHeader()}
          <main className="ml-64 mt-20 p-md h-[calc(100vh-5rem)] grid grid-cols-12 content-start gap-md bg-background overflow-y-auto">
            {/* Left Column: Primary Data Visuals */}
            <div className="col-span-8 flex flex-col gap-md h-full">
              {/* Stall Alert Banner */}
              <div className="bg-surface-dim border border-primary/30 p-md flex items-center justify-between glow-ember">
                <div className="flex items-center gap-md">
                  <div className="p-base bg-primary-container/20 border border-primary animate-pulse">
                    <span className="material-symbols-outlined text-primary text-3xl">humidity_percentage</span>
                  </div>
                  <div>
                    <h3 className="font-headline-lg text-lg text-primary leading-none uppercase font-bold">THERMODYNAMIC STALL DETECTED</h3>
                    <p className="font-label-mono text-xs text-on-surface-variant uppercase mt-1">EVAPORATIVE COOLING IN PROGRESS | CORE TEMP PLATEAUED</p>
                  </div>
                </div>
              </div>

              {/* Main Chart Card */}
              <div className="flex-grow bg-surface-container-lowest border border-outline-variant rounded-none relative overflow-hidden flex flex-col p-md min-h-[300px]">
                <div className="flex justify-between items-end mb-lg">
                  <div>
                    <p className="font-label-mono text-xs text-on-surface-variant uppercase tracking-widest">Temperature Progress (Time-Series)</p>
                    <h4 className="font-headline-md text-on-surface text-lg uppercase font-bold">CORE VS AMBIENT THERMAL TRACKING</h4>
                  </div>
                  <div className="flex gap-md font-label-mono text-xs">
                    <div className="flex items-center gap-xs">
                      <div className="w-3 h-3 bg-primary-container"></div>
                      <span className="text-primary">CORE</span>
                    </div>
                    <div className="flex items-center gap-xs">
                      <div className="w-3 h-3 bg-secondary-fixed"></div>
                      <span className="text-secondary-fixed">AMBIENT</span>
                    </div>
                  </div>
                </div>
                
                {/* Visual Chart with Stall shaded zone */}
                <div className="flex-grow relative border-l border-b border-outline-variant/30 min-h-[180px]">
                  <div className="absolute inset-x-0 stall-zone-bg" style={{ bottom: "40%", top: "30%" }}></div>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 font-label-mono text-[9px] text-primary/45 uppercase vertical-rl tracking-[0.2em]">
                    STALL ZONE (65°C - 75°C)
                  </div>
                  {history.length > 0 ? (
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 400">
                      <path d="M 0 50 Q 250 45 500 52 T 1000 48" fill="none" stroke="#fff9ef" strokeWidth="2" opacity="0.4"></path>
                      <path d="M 0 380 Q 150 350 300 280 L 700 260" fill="none" stroke="#ffb59e" strokeWidth="3"></path>
                      <path d="M 700 260 L 850 200 Q 950 120 1000 80" fill="none" opacity="0.6" stroke="#ffb59e" strokeDasharray="8" strokeWidth="2"></path>
                      <circle className="animate-heat" cx="850" cy="200" fill="#ff571a" r="6"></circle>
                    </svg>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center text-on-surface-variant opacity-60">
                      <span className="material-symbols-outlined text-3xl animate-pulse">insights</span>
                      <p className="font-label-mono text-xs uppercase tracking-wider">STALL TRACKER ACQUIRING SIGNALS...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Moisture budget & Stall metrics */}
            <div className="col-span-4 flex flex-col gap-md">
              {/* Moisture budget */}
              <div className="bg-surface-container-lowest border border-outline-variant p-md flex flex-col items-center justify-between brushed-metal flex-grow">
                <h4 className="font-headline-md text-sm text-on-surface mb-md w-full text-center uppercase tracking-wider font-bold">MOISTURE BUDGET</h4>
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="80" cy="80" fill="none" r="70" stroke="#1c1b1c" strokeWidth="10"></circle>
                    <circle
                      className="transition-all duration-1000"
                      cx="80"
                      cy="80"
                      fill="none"
                      r="70"
                      stroke="#ff571a"
                      strokeDasharray={2 * Math.PI * 70}
                      strokeDashoffset={2 * Math.PI * 70 * (1 - moistureBudget / 100)}
                      strokeWidth="10"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-display-lg text-4xl text-primary leading-none font-bold">{moistureBudget}%</span>
                    <span className="font-label-mono text-[9px] text-on-surface-variant uppercase">REMAINING</span>
                  </div>
                </div>

                <div className="mt-md w-full">
                  <div className="h-1 bg-surface-container overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-container to-secondary-container" style={{ width: `${moistureBudget}%` }}></div>
                  </div>
                  <div className="flex justify-between mt-xs font-label-mono text-[9px] text-on-surface-variant uppercase">
                    <span>RATE: 0.12oz/hr</span>
                    <span>SPRITZ APPLIED: {spritzCount}</span>
                  </div>
                </div>
              </div>

              {/* Stall Stats Bento Box */}
              <div className="grid grid-rows-3 gap-sm flex-grow">
                <div className="bg-surface-container-lowest border border-outline-variant p-sm flex justify-between items-center">
                  <div>
                    <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">ENTRY TIME</p>
                    <h5 className="font-headline-md text-on-surface text-lg">12:45 PM</h5>
                  </div>
                  <span className="material-symbols-outlined text-outline text-sm">login</span>
                </div>
                <div className="bg-surface-container-lowest border border-primary/50 p-sm flex justify-between items-center glow-ember">
                  <div>
                    <p className="font-label-mono text-[9px] text-primary uppercase">CURRENT DURATION</p>
                    <h5 className="font-headline-md text-primary text-glow-ember text-lg">1H 12M</h5>
                  </div>
                  <span className="material-symbols-outlined text-primary animate-pulse text-sm">timer</span>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant p-sm flex justify-between items-center">
                  <div>
                    <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">ESTIMATED EXIT</p>
                    <h5 className="font-headline-md text-on-surface text-lg">2:30 PM</h5>
                  </div>
                  <span className="material-symbols-outlined text-outline text-sm">logout</span>
                </div>
              </div>

              {/* Force Breakout */}
              <button
                type="button"
                onClick={handleSpritz}
                className="bg-transparent border-2 border-secondary-fixed text-secondary-fixed font-headline-md py-md hover:bg-secondary-fixed/10 transition-all flex items-center justify-center gap-xs cursor-pointer tracking-wider text-sm font-bold uppercase"
              >
                <span className="material-symbols-outlined text-sm">water_drop</span>
                FORCE BREAKOUT (SPRITZ)
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 2: WARMUP & CALIBRATION
  // ==========================================
  if (currentPhase === 2) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-on-surface font-body-md flex">
        {renderDesktopSidebar()}
        <div className="flex-grow flex flex-col min-h-screen">
          {renderDesktopHeader()}
          <main className="ml-64 mt-20 p-md h-[calc(100vh-5rem)] grid grid-cols-12 content-start gap-md bg-background overflow-y-auto">
            {/* Left Column: Live Chart */}
            <section className="col-span-8 flex flex-col gap-md h-full">
              <div className="forge-surface p-md flex-grow flex flex-col justify-between min-h-[300px]">
                <div className="flex justify-between items-end mb-md">
                  <div>
                    <h2 className="font-label-mono text-tertiary-fixed text-xs uppercase tracking-[0.2em]">Live Thermal Analysis</h2>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="font-display-lg text-5xl text-on-surface leading-none">{coreTempF}°F</span>
                      <span className="font-label-mono text-secondary-fixed-dim text-sm">+0.7°F/min</span>
                    </div>
                  </div>
                  <div className="flex gap-md font-label-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-0.5 bg-primary"></span>
                      <span className="uppercase text-[9px]">RAW SENSOR</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-0.5 bg-secondary-fixed"></span>
                      <span className="uppercase text-[9px]">SMOOTHED TREND</span>
                    </div>
                  </div>
                </div>

                <div className="flex-grow chart-grid border border-outline-variant/30 relative overflow-hidden min-h-[180px]">
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    <path d="M0,80 Q100,75 200,85 T400,70 T600,65 T800,60 T1000,55" fill="none" stroke="#ffe16d" strokeWidth="2"></path>
                    <path d="M0,82 L50,78 L100,85 L150,75 L200,88 L250,82 L300,70 L350,75 L400,65 L450,72 L500,68 L550,60 L600,65 L650,62 L700,55 L750,58 L800,50" fill="none" stroke="#ffb59e" strokeDasharray="2 2" strokeWidth="1.5"></path>
                  </svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="forge-surface p-4 flex gap-4 items-center">
                  <span className="material-symbols-outlined text-primary text-3xl">local_fire_department</span>
                  <div>
                    <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Ambient Pit Temp</p>
                    <p className="font-headline-md text-xl">225°F <span className="text-xs text-secondary-fixed font-label-mono ml-2 uppercase font-bold">STABLE</span></p>
                  </div>
                </div>
                <div className="forge-surface p-4 flex gap-4 items-center">
                  <span className="material-symbols-outlined text-secondary-fixed text-3xl">opacity</span>
                  <div>
                    <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Surface Moisture</p>
                    <p className="font-headline-md text-xl">64% <span className="text-xs text-outline font-label-mono ml-2 uppercase">DECREASING</span></p>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column: Widgets */}
            <aside className="col-span-4 flex flex-col gap-md h-full">
              {/* Device Status */}
              <div className="forge-surface p-md">
                <h3 className="font-label-mono text-xs text-on-surface-variant mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  DEVICE STATUS: ONLINE
                </h3>
                <div className="space-y-sm text-xs font-label-mono">
                  <div className="flex justify-between">
                    <span className="text-outline">PROBE MODEL</span>
                    <span className="text-on-surface">EMBER-X1 V2.4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">SIGNAL STRENGTH</span>
                    <div className="flex gap-0.5">
                      <div className="w-1 h-3 bg-primary"></div>
                      <div className="w-1 h-3 bg-primary"></div>
                      <div className="w-1 h-3 bg-primary"></div>
                      <div className="w-1 h-3 bg-outline/30"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Calibration Gauge */}
              <div className="forge-surface p-md flex flex-col items-center justify-center">
                <p className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] mb-4 font-bold">Thermal Stabilization</p>
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full pulsing-ring"></div>
                  <svg className="w-full h-full -rotate-90">
                    <circle className="text-outline/10" cx="72" cy="72" fill="transparent" r="64" stroke="currentColor" strokeWidth="4"></circle>
                    <circle
                      className="text-primary"
                      cx="72"
                      cy="72"
                      fill="transparent"
                      r="64"
                      stroke="currentColor"
                      strokeDasharray={2 * Math.PI * 64}
                      strokeDashoffset={(2 * Math.PI * 64) * 0.25} // 75%
                      strokeWidth="5"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-label-mono text-[9px] text-on-surface-variant">CONFIDENCE</span>
                    <span className="font-display-lg text-3xl font-bold">75%</span>
                    <span className="font-label-mono text-[8px] text-secondary-fixed mt-1 px-1.5 py-0.5 border border-secondary-fixed/30 bg-secondary-fixed/5 uppercase">
                      STABILIZING
                    </span>
                  </div>
                </div>
              </div>

              {/* Skeleton/Shimmer boxes */}
              <div className="flex-grow flex flex-col gap-sm">
                <div className="forge-surface p-sm">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-20 shimmer opacity-50"></div>
                    <div className="h-3 w-8 shimmer opacity-30"></div>
                  </div>
                  <div className="h-6 w-3/4 shimmer opacity-40 mt-1"></div>
                </div>
                <div className="forge-surface p-sm">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-24 shimmer opacity-50"></div>
                    <div className="h-3 w-8 shimmer opacity-30"></div>
                  </div>
                  <div className="h-6 w-1/2 shimmer opacity-40 mt-1"></div>
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
    );
  }

  // ==========================================
  // PHASE 6: DEFAULT ACTIVE MONITORING DASHBOARD (Desktop View)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-on-surface font-body-md flex">
      {renderDesktopSidebar()}
      <div className="flex-grow flex flex-col min-h-screen">
        {renderDesktopHeader()}
        <main className="ml-64 mt-20 p-md h-[calc(100vh-5rem)] grid grid-cols-12 content-start gap-md bg-background overflow-y-auto">
          {/* Left Column: Live Chart */}
          <section className="col-span-8 flex flex-col gap-md h-full">
            <div className="forge-surface p-md flex-grow flex flex-col justify-between min-h-[300px]">
              <div className="flex justify-between items-end mb-md">
                <div>
                  <h2 className="font-headline-md text-on-surface uppercase leading-none text-xl">Active Session Tracking</h2>
                  <p className="font-label-mono text-xs text-on-surface-variant uppercase mt-1">Status: Running</p>
                </div>
                <div className="flex gap-md font-label-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-primary"></span>
                    <span className="uppercase text-[9px]">Core</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-secondary-fixed"></span>
                    <span className="uppercase text-[9px]">Ambient</span>
                  </div>
                </div>
              </div>

              {/* Chart SVG */}
              <div className="flex-grow chart-grid border border-outline-variant/30 relative overflow-hidden min-h-[180px]">
                {history.length > 0 ? (
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path
                      d={getSvgPathAmbientF(history, minTempF, maxTempF)}
                      fill="none"
                      stroke="#ffe16d"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    />
                    <path
                      d={getSvgPathF(history, minTempF, maxTempF)}
                      fill="none"
                      stroke="#FF4D00"
                      strokeWidth="3"
                    />
                  </svg>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center text-on-surface-variant opacity-60">
                    <span className="material-symbols-outlined text-4xl mb-sm animate-pulse">query_stats</span>
                    <p className="font-label-mono text-xs uppercase tracking-wider">Acquiring live telemetry packets...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="forge-surface p-4 flex gap-4 items-center">
                <span className="material-symbols-outlined text-primary text-3xl">oven_gen</span>
                <div>
                  <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Ambient Pit Temp</p>
                  <p className="font-headline-md text-xl">
                    {telemetry?.ambient_temp ? `${Math.round(telemetry.ambient_temp * 9/5 + 32)}°F` : "--°F"}{" "}
                    <span className="text-xs text-secondary-fixed font-label-mono ml-2 uppercase font-bold">STABLE</span>
                  </p>
                </div>
              </div>
              <div className="forge-surface p-4 flex gap-4 items-center">
                <span className="material-symbols-outlined text-secondary-fixed text-3xl">opacity</span>
                <div>
                  <p className="font-label-mono text-[9px] text-on-surface-variant uppercase">Moisture Balance</p>
                  <p className="font-headline-md text-xl">{moistureBudget}% <span className="text-xs text-outline font-label-mono ml-2 uppercase font-bold">OPTIMAL</span></p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Active Live status */}
          <aside className="col-span-4 flex flex-col gap-md h-full justify-between">
            {/* Live progress circle */}
            <div className="forge-surface p-md flex flex-col items-center justify-center flex-grow">
              <p className="font-label-mono text-[10px] text-primary uppercase tracking-[0.2em] mb-4 font-bold">Target Temperature Gauge</p>
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle className="text-white/5" cx="72" cy="72" fill="transparent" r="64" stroke="currentColor" strokeWidth="6"></circle>
                  <circle
                    className="text-primary"
                    cx="72"
                    cy="72"
                    fill="transparent"
                    r="64"
                    stroke="currentColor"
                    strokeDasharray={2 * Math.PI * 64}
                    strokeDashoffset={(2 * Math.PI * 64) * (1 - progressPercent / 100)}
                    strokeWidth="6"
                  ></circle>
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className="font-label-mono text-[9px] text-on-surface-variant">Core Temp</span>
                  <span className="font-display-lg text-3xl font-bold">{coreTempF}°F</span>
                  <span className="font-label-mono text-[8px] text-secondary-fixed mt-1 uppercase">Target: {targetTempFDisplay}°F</span>
                </div>
              </div>
            </div>

            {/* ETA & Recommendations */}
            <div className="space-y-sm">
              <div className="forge-surface p-4">
                <span className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">Estimated Remaining (ETA)</span>
                <h3 className="font-headline-lg text-3xl text-primary tracking-widest mt-1 leading-none">
                  {formatEta(telemetry ? telemetry.eta_seconds : -1)}
                </h3>
              </div>

              <div className="forge-surface p-4 flex justify-between items-center">
                <div>
                  <span className="font-label-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">Projected Carryover Rise</span>
                  <h3 className="font-headline-lg text-2xl text-secondary-fixed leading-none mt-1">
                    +{carryoverRiseF}°F
                  </h3>
                </div>
                <div className="text-right">
                  <span className="font-label-mono text-[8px] text-on-surface-variant uppercase block mb-1">Recommendation</span>
                  <div className="bg-primary/10 border border-primary/40 px-3 py-1 text-primary font-headline-md text-xs uppercase tracking-wide">
                    PULL AT {pullTempF}°F
                  </div>
                </div>
              </div>

              <div className="forge-surface p-4 text-xs font-label-mono space-y-xs uppercase">
                <div className="flex justify-between">
                  <span className="text-outline">CUT / PROTEIN</span>
                  <span className="text-on-surface font-bold">{activeSession?.cut_type} ({getMeatLabel(activeSession?.meat_type || "")})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">COOKER</span>
                  <span className="text-on-surface font-bold">{activeSession?.cooker_type}</span>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
