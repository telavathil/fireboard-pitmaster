from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List
import uuid
import json
import asyncio
import logging
from datetime import datetime, timezone

from app.config import settings
from app.database import init_db, get_db_connection
from app.schemas import CookHistoryEntry, CookSessionCreate, CookSessionResponse, LoginRequest, PushEndpoint, PushSubscriptionIn
from app import push
from app.cache import clear_device_state, get_latest_telemetry

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
        # A reused device must not carry the previous cook's readings into this one
        # (that would show stale temperatures and could fire a false pull alert).
        try:
            clear_device_state(session_in.device_id, 1)
        except Exception as e:
            logger.error(f"Couldn't clear previous readings for device {session_in.device_id}: {e}")
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
        cursor.execute(
            "SELECT * FROM cook_sessions WHERE status != 'completed' ORDER BY created_at DESC LIMIT 1"
        )
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

def _parse_utc(value: Any) -> Any:
    """SQLite CURRENT_TIMESTAMP values are UTC without a zone; attach it so clients don't read them as local."""
    if value is None or isinstance(value, datetime):
        return value
    text = str(value)
    parsed = datetime.fromisoformat(text) if "T" in text else datetime.strptime(text, "%Y-%m-%d %H:%M:%S")
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


HISTORY_QUERY = """
    SELECT s.id, s.device_name, s.meat_type, s.cut_type, s.cooker_type, s.weight_kg, s.thickness_mm,
           s.target_temp_c, s.created_at AS started_at, MAX(t.timestamp) AS ended_at,
           MAX(t.core_temp_filtered) AS peak_core_c, COUNT(t.id) AS reading_count
    FROM cook_sessions s
    LEFT JOIN telemetry_logs t ON t.session_id = s.id
    WHERE s.status = 'completed'
    GROUP BY s.id
    ORDER BY s.created_at DESC
    LIMIT ?
"""


@app.get("/api/sessions/history", response_model=List[CookHistoryEntry])
def get_cook_history(limit: int = Query(50, ge=1, le=200)):
    """
    Lists finished cooks, newest first, summarised from their logged readings.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(HISTORY_QUERY, (limit,))
        columns = [col[0] for col in cursor.description]
        entries = []
        for row in cursor.fetchall():
            entry = dict(zip(columns, row))
            entry["started_at"] = _parse_utc(entry["started_at"])
            entry["ended_at"] = _parse_utc(entry["ended_at"])
            entries.append(entry)
        return entries
    except Exception as e:
        logger.error(f"Failed to read cook history: {e}")
        raise HTTPException(status_code=500, detail="Database read failure.")
    finally:
        conn.close()


@app.patch("/api/sessions/{session_id}")
def update_session_status(session_id: str, payload: Dict[str, Any]):
    """
    Updates the status of a cook session (e.g., transition to resting).
    """
    status_val = payload.get("status")
    if not status_val:
        raise HTTPException(status_code=400, detail="Status is required in the payload.")
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT id FROM cook_sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Session not found.")
            
        cursor.execute(
            "UPDATE cook_sessions SET status = ? WHERE id = ?",
            (status_val, session_id)
        )
        conn.commit()
        logger.info(f"Updated cook session {session_id} status to: {status_val}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update session: {e}")
        raise HTTPException(status_code=500, detail="Database write failure.")
    finally:
        conn.close()
        
    return {"status": "success", "message": f"Updated session to {status_val}"}



@app.get("/api/push/public-key")
def get_push_public_key():
    """The VAPID public key browsers need to subscribe. 503 until push is configured."""
    if not push.push_configured():
        raise HTTPException(status_code=503, detail="Pull alerts aren't set up on the server yet.")
    return {"publicKey": settings.VAPID_PUBLIC_KEY}


@app.post("/api/push/subscribe", status_code=201)
def subscribe_push(subscription: PushSubscriptionIn):
    push.save_subscription(subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth)
    return {"status": "subscribed"}


@app.post("/api/push/unsubscribe")
def unsubscribe_push(payload: PushEndpoint):
    push.delete_subscription(payload.endpoint)
    return {"status": "unsubscribed"}


@app.post("/api/push/test")
def send_test_push(payload: PushEndpoint):
    """Sends a test alert to one device so the user can confirm alerts arrive."""
    if not push.push_configured():
        raise HTTPException(status_code=503, detail="Pull alerts aren't set up on the server yet.")
    delivered = push.send_to_endpoint(
        payload.endpoint,
        {"title": "Pull alerts are on", "body": "This is how a pull alert will look.", "tag": "test", "url": "/"},
    )
    if delivered is None:
        raise HTTPException(status_code=404, detail="This device isn't subscribed.")
    if not delivered:
        raise HTTPException(status_code=502, detail="The push service didn't accept the alert.")
    return {"status": "sent"}


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
