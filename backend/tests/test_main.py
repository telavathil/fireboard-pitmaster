import os
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Override settings dynamically
from app.config import settings
TEST_DB_FILE = "test_main.db"
settings.DB_URL = f"sqlite:///{TEST_DB_FILE}"

from app.main import app
from app.database import init_db, get_db_connection

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
    # Keep the file intact but clean the database records before each test
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM telemetry_logs")
        cursor.execute("DELETE FROM cook_sessions")
        conn.commit()
    finally:
        conn.close()

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_endpoint():
    # Valid login payload
    payload = {"username": "pitmaster@bbq.com", "password": "supersecretpassword"}
    response = client.post("/api/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["username"] == "pitmaster@bbq.com"

    # Missing parameters (Pydantic validation error) should return 422
    response = client.post("/api/login", json={"username": ""})
    assert response.status_code == 422

    # Empty strings (API payload validation error) should return 400
    response = client.post("/api/login", json={"username": "", "password": ""})
    assert response.status_code == 400

def test_session_endpoints():
    # Create cook session
    session_payload = {
        "device_id": "test_device_123",
        "device_name": "Testing Smoker",
        "meat_type": "pork",
        "cut_type": "shoulder",
        "cooker_type": "kamado",
        "status": "bare",
        "weight_kg": 3.5,
        "thickness_mm": 110.0,
        "target_temp_c": 93.0
    }
    
    response = client.post("/api/sessions", json=session_payload)
    assert response.status_code == 200
    session_data = response.json()
    assert "id" in session_data
    assert session_data["meat_type"] == "pork"
    assert session_data["weight_kg"] == 3.5
    
    # Retrieve active session
    active_response = client.get("/api/sessions/active")
    assert active_response.status_code == 200
    active_data = active_response.json()
    assert active_data["id"] == session_data["id"]
    assert active_data["device_id"] == "test_device_123"


def _insert_session(session_id, status, created_at, cut="Brisket flat"):
    conn = get_db_connection()
    try:
        conn.execute(
            """INSERT INTO cook_sessions (id, device_id, device_name, meat_type, cut_type, cooker_type,
               status, weight_kg, thickness_mm, target_temp_c, created_at)
               VALUES (?, 'dev1', 'Backyard', 'beef', ?, 'kamado', ?, 5.4, 75.0, 95.0, ?)""",
            (session_id, cut, status, created_at),
        )
        conn.commit()
    finally:
        conn.close()


def _insert_reading(session_id, timestamp, core_c):
    conn = get_db_connection()
    try:
        conn.execute(
            """INSERT INTO telemetry_logs (session_id, timestamp, core_temp_raw, core_temp_filtered, ambient_temp, eta_seconds)
               VALUES (?, ?, ?, ?, 107.0, 600)""",
            (session_id, timestamp, core_c, core_c),
        )
        conn.commit()
    finally:
        conn.close()


def test_history_is_empty_without_finished_cooks():
    _insert_session("active-1", "bare", "2026-10-04 06:00:00")
    response = client.get("/api/sessions/history")
    assert response.status_code == 200
    assert response.json() == []


def test_history_lists_finished_cooks_with_summary_from_readings():
    _insert_session("done-1", "completed", "2026-10-03 06:00:00")
    _insert_reading("done-1", "2026-10-03 06:20:00", 60.0)
    _insert_reading("done-1", "2026-10-03 17:40:00", 90.5)
    _insert_reading("done-1", "2026-10-03 18:05:00", 88.0)
    _insert_session("active-1", "bare", "2026-10-04 06:00:00")

    entries = client.get("/api/sessions/history").json()

    assert [e["id"] for e in entries] == ["done-1"]
    entry = entries[0]
    assert entry["cut_type"] == "Brisket flat"
    assert entry["target_temp_c"] == 95.0
    assert entry["peak_core_c"] == 90.5
    assert entry["reading_count"] == 3
    assert entry["started_at"].startswith("2026-10-03T06:00:00")
    assert entry["ended_at"].startswith("2026-10-03T18:05:00")
    # Times are stored in UTC and must say so, so clients don't misread them as local.
    assert entry["started_at"].endswith(("Z", "+00:00"))


def test_history_handles_cooks_with_no_readings_and_orders_newest_first():
    _insert_session("older", "completed", "2026-09-20 06:00:00", cut="Pork butt")
    _insert_session("newer", "completed", "2026-10-01 06:00:00", cut="Ribeye")

    entries = client.get("/api/sessions/history").json()

    assert [e["id"] for e in entries] == ["newer", "older"]
    assert entries[0]["peak_core_c"] is None
    assert entries[0]["ended_at"] is None
    assert entries[0]["reading_count"] == 0


def test_history_limit_is_validated_and_applied():
    for day in range(1, 4):
        _insert_session(f"done-{day}", "completed", f"2026-10-0{day} 06:00:00")
    assert len(client.get("/api/sessions/history?limit=2").json()) == 2
    assert client.get("/api/sessions/history?limit=0").status_code == 422
    assert client.get("/api/sessions/history?limit=500").status_code == 422


def test_starting_a_cook_clears_the_devices_previous_readings():
    from unittest.mock import patch
    payload = {
        "device_id": "device_reused", "device_name": "Grill", "meat_type": "beef", "cut_type": "Brisket flat",
        "cooker_type": "kamado", "status": "bare", "weight_kg": 5.4, "thickness_mm": 75.0, "target_temp_c": 95.0,
    }
    with patch("app.main.clear_device_state") as clear:
        assert client.post("/api/sessions", json=payload).status_code == 200
    clear.assert_called_once_with("device_reused", 1)


def test_a_cache_outage_does_not_block_starting_a_cook():
    from unittest.mock import patch
    payload = {
        "device_id": "device_x", "device_name": "Grill", "meat_type": "beef", "cut_type": "Ribs",
        "cooker_type": "kamado", "status": "bare", "weight_kg": 2.0, "thickness_mm": 50.0, "target_temp_c": 93.0,
    }
    with patch("app.main.clear_device_state", side_effect=ConnectionError("redis down")):
        assert client.post("/api/sessions", json=payload).status_code == 200
