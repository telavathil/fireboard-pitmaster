from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List
import uuid
import json
import asyncio
import logging
from datetime import datetime

from app.config import settings
from app.database import init_db, get_db_connection
from app.schemas import CookSessionCreate, CookSessionResponse, LoginRequest
from app.cache import get_latest_telemetry

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Lifespan Context Manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database on startup...")
    init_db()
    yield

# Initialize FastAPI App
app = FastAPI(
    title="FireBoard Pitmaster API",
    description="Sprint 1 - Ingestion, Storage, and Real-Time Stream API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "time": datetime.utcnow().isoformat()}

@app.post("/api/login")
def login(payload: LoginRequest):
    """
    Performs FireBoard account validation and caches credentials.
    In Sprint 1, this validates the login schema and returns a mock user session token.
    """
    logger.info(f"User login attempt for username: {payload.username}")
    if not payload.username or not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required."
        )
    
    # Return mock session token
    return {
        "access_token": f"mock_token_{uuid.uuid4().hex}",
        "token_type": "bearer",
        "username": payload.username
    }

@app.post("/api/sessions", response_model=CookSessionResponse)
def create_session(session_in: CookSessionCreate):
    """
    Creates a new cook session and persists metadata to Turso.
    """
    session_id = uuid.uuid4().hex
    created_at = datetime.utcnow()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            """
            INSERT INTO cook_sessions (
                id, user_id, device_name, device_id, meat_type, cut_type, cooker_type, status, weight_kg, thickness_mm, target_temp_c, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                "pitmaster_user",  # Static single-user representation
                session_in.device_name or "Pitmaster Grill",
                session_in.device_id,
                session_in.meat_type,
                session_in.cut_type,
                session_in.cooker_type,
                session_in.status,
                session_in.weight_kg,
                session_in.thickness_mm,
                session_in.target_temp_c,
                created_at.isoformat()
            )
        )
        conn.commit()
        logger.info(f"Created new cook session: {session_id} in Turso.")
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail="Database write failure.")
    finally:
        conn.close()
        
    return CookSessionResponse(
        id=session_id,
        created_at=created_at,
        **session_in.model_dump()
    )

@app.get("/api/sessions/active")
def get_active_session():
    """
    Retrieves the latest cook session.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM cook_sessions ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="No active cook session found.")
            
        # Map SQL row to dict
        columns = [col[0] for col in cursor.description]
        session_dict = dict(zip(columns, row))
        
        # Parse timestamp string to datetime
        created_at_str = session_dict["created_at"]
        # Format string check
        if "T" in created_at_str:
            session_dict["created_at"] = datetime.fromisoformat(created_at_str)
        else:
            session_dict["created_at"] = datetime.strptime(created_at_str, "%Y-%m-%d %H:%M:%S")
            
        return session_dict
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to read session: {e}")
        raise HTTPException(status_code=500, detail="Database read failure.")
    finally:
        conn.close()

async def sse_telemetry_generator(device_id: str, channel_id: int):
    """
    Asynchronous generator that yields Server-Sent Events (SSE) telemetry data.
    """
    last_timestamp = None
    logger.info(f"SSE client connected for device {device_id} channel {channel_id}")
    
    while True:
        try:
            payload = get_latest_telemetry(device_id, channel_id)
            if payload:
                curr_timestamp = payload.get("timestamp")
                if curr_timestamp != last_timestamp:
                    last_timestamp = curr_timestamp
                    # Format as Server-Sent Event
                    yield f"data: {json.dumps(payload)}\n\n"
            
            # Polling delay
            await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            logger.info(f"SSE client disconnected for device {device_id} channel {channel_id}")
            break
        except Exception as e:
            logger.error(f"Error in SSE generator: {e}")
            await asyncio.sleep(2.0)

@app.get("/api/telemetry/stream/{device_id}/{channel_id}")
async def stream_telemetry(device_id: str, channel_id: int):
    """
    SSE stream endpoint for client applications.
    """
    return StreamingResponse(
        sse_telemetry_generator(device_id, channel_id),
        media_type="text/event-stream"
    )
