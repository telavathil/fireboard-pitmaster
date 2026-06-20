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
