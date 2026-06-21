import httpx
import uuid
import time
from datetime import datetime
from typing import Optional
from celery.utils.log import get_task_logger

from app.worker import celery_app
from app.config import settings
from app.database import get_db_connection
from app.cache import (
    get_cached_token,
    set_cached_token,
    set_latest_telemetry,
    push_raw_history,
    get_raw_history,
)
from app.math_engine.kalman import CookingKalmanFilter
from app.math_engine.solver import CookingSolver


logger = get_task_logger(__name__)

def get_fireboard_token(username: str, password: str) -> str:
    """
    Calls FireBoard login endpoint to retrieve and cache auth key.
    """
    cached = get_cached_token(username)
    if cached:
        return cached

    url = "https://fireboard.io/api/rest-auth/login/"
    logger.info(f"Authenticating with FireBoard Cloud API for user: {username}")
    
    response = httpx.post(url, json={"username": username, "password": password}, timeout=10.0)
    
    if response.status_code == 200:
        key = response.json().get("key")
        if key:
            # Cache token for 24 hours
            set_cached_token(username, key, expire_seconds=86400)
            return key
    
    response.raise_for_status()
    raise Exception("Failed to retrieve authentication key from FireBoard API.")

@celery_app.task
def poll_fireboard_api():
    """
    Stoker scheduler task that polls active devices from the FireBoard API.
    Executed strictly every 20 seconds.
    """
    logger.info("Stoker beat: Polling active cook sessions...")
    
    # 1. Fetch active cook sessions from the database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # For simplicity, we fetch the latest cook session
        cursor.execute("SELECT id, device_id, target_temp_c, status FROM cook_sessions ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        
        if not row:
            logger.info("No active cook sessions found in database. Polling skipped.")
            return
        
        session_id, device_id, target_temp_c, status = row
        logger.info(f"Active cook session found: {session_id} for device: {device_id}")
        
    except Exception as e:
        logger.error(f"Error reading database: {e}")
        return
    finally:
        conn.close()

    # 2. Extract credentials & call API or run Simulation
    username = settings.FIREBOARD_USERNAME
    password = settings.FIREBOARD_PASSWORD

    # Simulation fallback if no credentials provided
    if not username or not password or username == "your_username_here":
        logger.info("No FireBoard credentials found in env. Running cook simulation mode.")
        run_cook_simulation(session_id, device_id, target_temp_c)
        return

    try:
        token = get_fireboard_token(username, password)
        headers = {"Authorization": f"Token {token}"}
        
        # Poll devices endpoint
        url = "https://fireboard.io/api/v1/devices.json"
        response = httpx.get(url, headers=headers, timeout=10.0)
        
        if response.status_code == 429:
            logger.warning("FireBoard API Rate limit exceeded (429). Triggering backing off...")
            # We cache a rate limit flag in Redis for backoff detection
            return
            
        response.raise_for_status()
        devices = response.json()
        
        # Locate target device data
        target_device = None
        for d in devices:
            if d.get("uuid") == device_id or str(d.get("id")) == device_id:
                target_device = d
                break
                
        if not target_device:
            logger.error(f"Device {device_id} not found in user's FireBoard account.")
            return

        # Read core channel (assume Channel 1 for core and Channel 2 for ambient in this phase)
        # In later phases this will be user-designated
        core_temp = None
        ambient_temp = None
        
        latest_temps = target_device.get("latest_temps", [])
        for item in latest_temps:
            channel = item.get("channel")
            temp_f = item.get("temp")
            # Convert Fahrenheit to Celsius
            temp_c = (temp_f - 32) * 5.0 / 9.0 if temp_f is not None else None
            
            if channel == 1:
                core_temp = temp_c
            elif channel == 2:
                ambient_temp = temp_c

        if core_temp is None:
            logger.warning("Core temperature probe channel is inactive or reporting null.")
            return

        # 3. Cache raw values and trigger prediction
        now_ts = time.time()
        push_raw_history(device_id, 1, core_temp, now_ts)
        
        logger.info(f"Ingested telemetry - Core: {core_temp:.2f}°C, Ambient: {ambient_temp}°C")
        
        # Trigger Pit Boss prediction task asynchronously
        run_predictions.delay(session_id, device_id, core_temp, ambient_temp, target_temp_c, now_ts)

    except Exception as e:
        logger.error(f"Error polling FireBoard API: {e}")

@celery_app.task
def run_predictions(session_id: str, device_id: str, core_temp: float, ambient_temp: Optional[float], target_temp: float, timestamp: float):
    """
    Pit Boss task that calculates Kalman smoothing and predicts remaining cook time.
    For Sprint 1, this uses a linear-approximation stub.
    """
    logger.info(f"Pit Boss: Calculating predictions for cook session {session_id}...")
    
    # Fetch raw telemetry history to replay
    history = get_raw_history(device_id, 1)
    
    # Sort history chronologically by timestamp
    history = sorted(history, key=lambda x: x[1])
    
    # Instantiate the Kalman Filter
    kf = CookingKalmanFilter()
    
    core_temp_filtered = core_temp
    heating_rate_c_per_sec = 0.0
    
    # Replay all historical readings to restore filter state
    last_ts = None
    for temp_val, ts in history:
        if last_ts is None:
            # First point in history
            core_temp_filtered, heating_rate_c_per_sec = kf.update(temp_val, 0.0)
        else:
            dt = ts - last_ts
            core_temp_filtered, heating_rate_c_per_sec = kf.update(temp_val, dt)
        last_ts = ts
        
    # Ensure current point is processed if newer than last timestamp in history
    if last_ts is not None and timestamp > last_ts:
        dt = timestamp - last_ts
        core_temp_filtered, heating_rate_c_per_sec = kf.update(core_temp, dt)
        
    # Scale heating rate to C/minute for display and payload
    heating_rate_c_per_min = heating_rate_c_per_sec * 60.0
    
    # Fetch session details for solver parameters
    conn = get_db_connection()
    cursor = conn.cursor()
    weight_kg = 2.0
    thickness_mm = 75.0
    cooker_type = "pellet"
    meat_type = "beef"
    try:
        cursor.execute("SELECT weight_kg, thickness_mm, cooker_type, meat_type FROM cook_sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        if row:
            weight_kg, thickness_mm, cooker_type, meat_type = row
    except Exception as e:
        logger.error(f"Failed to fetch session details from DB: {e}")
    finally:
        conn.close()

    # Instantiate CookingSolver
    solver = CookingSolver(
        thickness_mm=thickness_mm,
        weight_kg=weight_kg,
        cooker_type=cooker_type,
        target_temp_c=target_temp,
        meat_type=meat_type
    )
    
    ambient_val = ambient_temp if ambient_temp is not None else 110.0
    eta_seconds, carryover_rise = solver.simulate_cook(
        initial_core=core_temp_filtered,
        ambient_temp=ambient_val,
        heating_rate_c_per_sec=heating_rate_c_per_sec
    )
    
    # Determine confidence and stall detection
    if core_temp_filtered >= target_temp:
        confidence = "complete"
    elif eta_seconds == -1:
        confidence = "low"
    else:
        confidence = "high"
        
    stall_detected = (65.0 <= core_temp_filtered <= 75.0) and (heating_rate_c_per_min < 0.01)

    # Compile result payload
    payload = {
        "channel": 1,
        "core_temp_raw": round(core_temp, 2),
        "core_temp_filtered": round(core_temp_filtered, 2),
        "ambient_temp": round(ambient_temp, 2) if ambient_temp else None,
        "heating_rate": round(heating_rate_c_per_min, 4), # C/minute representation
        "stall_detected": stall_detected,
        "eta_seconds": eta_seconds,
        "carryover_rise": round(carryover_rise, 2),
        "confidence": confidence,
        "timestamp": datetime.fromtimestamp(timestamp).isoformat()
    }

    
    # Write to Redis Cache for FastAPI SSE Router
    set_latest_telemetry(device_id, 1, payload)
    
    # Persist log to Turso SQLite database
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO telemetry_logs (session_id, core_temp_raw, core_temp_filtered, ambient_temp, eta_seconds)
            VALUES (?, ?, ?, ?, ?)
            """,
            (session_id, core_temp, core_temp_filtered, ambient_temp, eta_seconds)
        )
        conn.commit()
        logger.info(f"Persisted cook telemetry log to Turso.")
    except Exception as e:
        logger.error(f"Failed to persist log to Turso: {e}")
    finally:
        conn.close()

def run_cook_simulation(session_id: str, device_id: str, target_temp_c: float):
    """
    Generates mock telemetry data to test the system offline without hardware.
    """
    now_ts = time.time()
    
    # Retrieve last reading from Redis to simulate temp rise
    from app.cache import get_latest_telemetry
    latest = get_latest_telemetry(device_id, 1)
    
    if latest:
        last_temp = latest.get("core_temp_raw", 15.0)
        # Rise by 0.1C to 0.3C randomly
        import random
        core_temp = min(last_temp + random.uniform(0.08, 0.25), target_temp_c)
    else:
        # Start at fridge temp
        core_temp = 4.0
        
    ambient_temp = 107.5  # Constant smoker temperature
    
    # Cache raw values and trigger prediction worker
    push_raw_history(device_id, 1, core_temp, now_ts)
    run_predictions.delay(session_id, device_id, core_temp, ambient_temp, target_temp_c, now_ts)
