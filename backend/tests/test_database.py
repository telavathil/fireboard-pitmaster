import os
import pytest
from pathlib import Path

# Override settings dynamically
from app.config import settings
TEST_DB_FILE = "test_db.db"
settings.DB_URL = f"sqlite:///{TEST_DB_FILE}"

from app.database import get_db_connection, init_db

@pytest.fixture(scope="module", autouse=True)
def setup_db_file():
    # Initialize DB file once for the module
    db_path = Path(TEST_DB_FILE)
    if db_path.exists():
        db_path.unlink()
    init_db()
    yield
    if db_path.exists():
        db_path.unlink()

@pytest.fixture(autouse=True)
def clean_tables():
    # Clear tables before each test to ensure isolation
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM telemetry_logs")
        cursor.execute("DELETE FROM cook_sessions")
        conn.commit()
    finally:
        conn.close()

def test_database_initialization():
    """
    Verifies that tables exist and we can insert/select records correctly.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='cook_sessions'")
    assert cursor.fetchone() is not None
    
    # Test insert and query using explicit columns
    cursor.execute(
        """
        INSERT INTO cook_sessions (id, device_id, meat_type, cut_type, cooker_type, status, weight_kg, thickness_mm, target_temp_c)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("test_session_123", "test_device_abc", "beef", "ribeye", "oven", "bare", 1.2, 45.0, 54.0)
    )
    conn.commit()
    
    # Query with explicit columns to avoid index mismatch on schema ordering
    cursor.execute("SELECT id, device_id, meat_type FROM cook_sessions WHERE id = ?", ("test_session_123",))
    row = cursor.fetchone()
    assert row is not None
    assert row[0] == "test_session_123"
    assert row[1] == "test_device_abc"
    assert row[2] == "beef"
    
    conn.close()
