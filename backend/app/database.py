import sqlite3
import libsql
from app.config import settings
import logging

logger = logging.getLogger("database")

def get_db_connection():
    """
    Establishes and returns a database connection to Turso (via libsql) or local SQLite (via sqlite3).
    """
    url = settings.DB_URL
    token = settings.DB_AUTH_TOKEN

    # Normalize sqlite protocol and use python's built-in sqlite3 client
    if url.startswith("sqlite://"):
        path = url.replace("sqlite:///", "").replace("sqlite://", "")
        if not path:
            path = ":memory:"
        logger.info(f"Connecting to local SQLite database at: {path}")
        # sqlite3 supports busy timeout to automatically retry when locked
        return sqlite3.connect(path, timeout=30.0)
    
    logger.info(f"Connecting to remote Turso database at: {url}")
    return libsql.connect(url, auth_token=token)

def init_db():
    """
    Executes initial table creations for cook sessions and telemetry logs.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create cook_sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cook_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                device_name TEXT,
                device_id TEXT,
                meat_type TEXT,
                cut_type TEXT,
                cooker_type TEXT,
                status TEXT,
                weight_kg REAL,
                thickness_mm REAL,
                target_temp_c REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create telemetry_logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                core_temp_raw REAL,
                core_temp_filtered REAL,
                ambient_temp REAL,
                eta_seconds INTEGER,
                FOREIGN KEY (session_id) REFERENCES cook_sessions(id) ON DELETE CASCADE
            )
        """)
        
        conn.commit()
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise e
    finally:
        conn.close()
