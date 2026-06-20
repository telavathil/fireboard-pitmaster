import os
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Override settings dynamically
from app.config import settings
TEST_DB_FILE = "test_tasks.db"
settings.DB_URL = f"sqlite:///{TEST_DB_FILE}"

# Disable FireBoard credentials to force simulation mode
settings.FIREBOARD_USERNAME = ""
settings.FIREBOARD_PASSWORD = ""

from app.database import init_db, get_db_connection
from app.worker import celery_app

# Enable Celery Eager Mode (runs tasks synchronously in-process)
celery_app.conf.task_always_eager = True

# Setup dummy Redis Mock
class MockRedis:
    def __init__(self):
        self.store = {}
        
    def get(self, key):
        return self.store.get(key)
        
    def set(self, key, value):
        self.store[key] = value
        return True
        
    def setex(self, key, time, value):
        self.store[key] = value
        return True
        
    def zadd(self, key, mapping):
        if key not in self.store:
            self.store[key] = []
        for value, score in mapping.items():
            self.store[key].append((value, score))
        return len(mapping)
        
    def zremrangebyscore(self, key, min_val, max_val):
        return 0
        
    def zrange(self, key, start, end, withscores=True):
        if key not in self.store:
            return []
        return self.store[key]

@pytest.fixture(scope="module", autouse=True)
def setup_db_file():
    db_path = Path(TEST_DB_FILE)
    if db_path.exists():
        db_path.unlink()
    # Initialize schema once at module scope
    init_db()
    yield
    if db_path.exists():
        db_path.unlink()

@pytest.fixture(autouse=True)
def cleanup_tables():
    # Clean records to isolate tests
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM telemetry_logs")
        cursor.execute("DELETE FROM cook_sessions")
        conn.commit()
    finally:
        conn.close()

@patch("app.cache.get_redis_client")
def test_simulated_ingestion_and_predictions(mock_get_redis):
    # Setup mock Redis client
    mock_redis = MockRedis()
    mock_get_redis.return_value = mock_redis
    
    # 1. Create a cook session in database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO cook_sessions (id, device_id, meat_type, cut_type, cooker_type, status, weight_kg, thickness_mm, target_temp_c)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("session_999", "device_sim_123", "pork", "shoulder", "kamado", "bare", 3.0, 95.0, 93.0)
    )
    conn.commit()
    conn.close()

    # 2. Trigger poller task (which triggers simulation and predictions eagerly)
    from app.pit_tasks import poll_fireboard_api
    poll_fireboard_api()
    
    # 3. Verify Redis has raw telemetry stored
    assert mock_redis.get("telemetry:latest:device_sim_123:1") is not None
    
    # Check stored payload details
    import json
    payload = json.loads(mock_redis.get("telemetry:latest:device_sim_123:1"))
    assert payload["channel"] == 1
    assert payload["core_temp_raw"] == 4.0  # Initial simulation starting temperature
    assert payload["eta_seconds"] > 0
    assert "carryover_rise" in payload
    assert payload["carryover_rise"] >= 0.0
    
    # 4. Verify telemetry logs were written in Turso database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT session_id, core_temp_raw, core_temp_filtered, ambient_temp FROM telemetry_logs WHERE session_id = ?", ("session_999",))
    logs = cursor.fetchall()
    assert len(logs) == 1
    assert logs[0][0] == "session_999"
    assert logs[0][1] == 4.0  # core_temp_raw
    conn.close()

@patch("app.cache.get_redis_client")
def test_kalman_prediction_with_history(mock_get_redis):
    # Setup mock Redis client
    mock_redis = MockRedis()
    mock_get_redis.return_value = mock_redis
    
    # 1. Create a cook session in database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO cook_sessions (id, device_id, meat_type, cut_type, cooker_type, status, weight_kg, thickness_mm, target_temp_c)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("session_888", "device_sim_456", "pork", "shoulder", "kamado", "bare", 3.0, 95.0, 93.0)
    )
    conn.commit()
    conn.close()

    # 2. Push a sequence of historical temperature readings to Redis to simulate a stepped rise
    # Staircase pattern: 5 steps at 50, 5 steps at 51, 5 steps at 52
    from app.cache import push_raw_history
    start_time = 1700000000.0
    temps = [50.0] * 5 + [51.0] * 5 + [52.0] * 5
    for i, t in enumerate(temps):
        push_raw_history("device_sim_456", 1, t, start_time + i * 20.0)

    # 3. Trigger run_predictions task directly with the final reading
    from app.pit_tasks import run_predictions
    run_predictions(
        session_id="session_888",
        device_id="device_sim_456",
        core_temp=52.0,
        ambient_temp=110.0,
        target_temp=93.0,
        timestamp=start_time + 14 * 20.0
    )


    # 4. Fetch the latest telemetry payload stored in Redis
    import json
    payload = json.loads(mock_redis.get("telemetry:latest:device_sim_456:1"))
    
    # 5. Assertions to verify Kalman integration is working
    assert payload["core_temp_raw"] == 52.0
    # Filtered temp should be different from raw temp (due to smoothing/overshoot), but close to it
    assert abs(payload["core_temp_filtered"] - 52.0) > 0.01
    assert abs(payload["core_temp_filtered"] - 52.0) < 0.5
    # Heating rate should be positive
    assert payload["heating_rate"] > 0.0
    # Confidence should be high because we have a positive estimated rate
    assert payload["confidence"] == "high"
    # ETA seconds should be positive and logical
    assert payload["eta_seconds"] > 0
    assert "carryover_rise" in payload
    assert payload["carryover_rise"] > 0.0
    
    # 6. Verify telemetry logs were written to the database
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT core_temp_raw, core_temp_filtered, eta_seconds FROM telemetry_logs WHERE session_id = ?",
        ("session_888",)
    )
    logs = cursor.fetchall()
    assert len(logs) == 1
    assert logs[0][0] == 52.0
    assert abs(logs[0][1] - 52.0) > 0.01
    assert abs(logs[0][1] - 52.0) < 0.5
    assert logs[0][2] > 0
    conn.close()

