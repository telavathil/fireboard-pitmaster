"""
Web Push for pull alerts.

Subscriptions are stored per device. The pull alert for a cook is sent once,
when the smoothed core first reaches the pull temperature (target minus the
predicted carryover) while the cook is still on the heat.
"""
import json
import logging
from typing import Any, Dict, List, Optional

from pywebpush import WebPushException, webpush

from app.config import settings
from app.database import get_db_connection

logger = logging.getLogger("push")

# Push services drop undelivered messages after this long; a stale pull alert is worse than none.
PULL_ALERT_TTL_SECONDS = 15 * 60
GONE_STATUS_CODES = {404, 410}


def push_configured() -> bool:
    return bool(settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY)


def save_subscription(endpoint: str, p256dh: str, auth: str) -> None:
    conn = get_db_connection()
    try:
        conn.execute(
            """INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)
               ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth""",
            (endpoint, p256dh, auth),
        )
        conn.commit()
    finally:
        conn.close()


def delete_subscription(endpoint: str) -> None:
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", (endpoint,))
        conn.commit()
    finally:
        conn.close()


def list_subscriptions(endpoint: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if endpoint is None:
            cursor.execute("SELECT endpoint, p256dh, auth FROM push_subscriptions")
        else:
            cursor.execute("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE endpoint = ?", (endpoint,))
        return [{"endpoint": e, "keys": {"p256dh": p, "auth": a}} for e, p, a in cursor.fetchall()]
    finally:
        conn.close()


def _send(subscription: Dict[str, Any], payload: Dict[str, Any]) -> bool:
    """Sends one notification. Returns True on delivery to the push service; prunes dead subscriptions."""
    try:
        webpush(
            subscription_info=subscription,
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
            ttl=PULL_ALERT_TTL_SECONDS,
        )
        return True
    except WebPushException as e:
        status = getattr(getattr(e, "response", None), "status_code", None)
        if status in GONE_STATUS_CODES:
            logger.info("Removing expired push subscription.")
            delete_subscription(subscription["endpoint"])
        else:
            logger.error(f"Push delivery failed (status {status}).")
        return False


def send_to_all(payload: Dict[str, Any]) -> int:
    if not push_configured():
        return 0
    return sum(_send(sub, payload) for sub in list_subscriptions())


def send_to_endpoint(endpoint: str, payload: Dict[str, Any]) -> Optional[bool]:
    """Returns None when the endpoint isn't subscribed."""
    matches = list_subscriptions(endpoint)
    if not matches:
        return None
    return _send(matches[0], payload)


def _claim_alert(session_id: str, kind: str) -> bool:
    """Records an alert as sent. Returns False if it was already sent for this cook."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM push_alerts WHERE session_id = ? AND kind = ?", (session_id, kind))
        if cursor.fetchone():
            return False
        cursor.execute("INSERT INTO push_alerts (session_id, kind) VALUES (?, ?)", (session_id, kind))
        conn.commit()
        return True
    finally:
        conn.close()


def maybe_send_pull_alert(
    session_id: str,
    cut_type: str,
    core_c: float,
    target_c: float,
    carryover_c: Optional[float],
    status: str,
) -> bool:
    """Sends the pull alert once, when a cook still on the heat reaches its pull temperature."""
    if not push_configured() or status != "bare":
        return False
    pull_c = target_c - (carryover_c or 0.0)
    if core_c < pull_c:
        return False
    if not _claim_alert(session_id, "pull"):
        return False
    send_to_all(
        {
            "title": "Pull now",
            "body": f"{cut_type} has reached its pull temperature. Open Pitmaster to log the pull.",
            "tag": f"pull-{session_id}",
            "url": "/",
        }
    )
    return True
