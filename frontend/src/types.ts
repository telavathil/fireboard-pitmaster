export interface CookSession {
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

export interface TelemetryPayload {
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
