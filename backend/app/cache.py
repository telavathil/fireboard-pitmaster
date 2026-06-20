import redis
from app.config import settings
import json
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger("cache")

# Global Redis client
_redis_client: Optional[redis.Redis] = None

def get_redis_client() -> redis.Redis:
    """
    Returns a thread-safe Redis client instance.
    """
    global _redis_client
    if _redis_client is None:
        logger.info(f"Initializing Redis client connecting to: {settings.REDIS_URL}")
        _redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client

def set_cached_token(username: str, token: str, expire_seconds: int = 86400) -> None:
    """
    Caches the FireBoard login token for a specific user.
    """
    client = get_redis_client()
    key = f"fireboard:token:{username}"
    client.setex(key, expire_seconds, token)

def get_cached_token(username: str) -> Optional[str]:
    """
    Retrieves the cached FireBoard login token.
    """
    client = get_redis_client()
    key = f"fireboard:token:{username}"
    return client.get(key)

def set_latest_telemetry(device_id: str, channel_id: int, payload: Dict[str, Any]) -> None:
    """
    Caches the latest temperature readings for a device channel.
    """
    client = get_redis_client()
    key = f"telemetry:latest:{device_id}:{channel_id}"
    client.set(key, json.dumps(payload))

def get_latest_telemetry(device_id: str, channel_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieves the latest cached temperature readings for a channel.
    """
    client = get_redis_client()
    key = f"telemetry:latest:{device_id}:{channel_id}"
    data = client.get(key)
    if data:
        return json.loads(data)
    return None

def push_raw_history(device_id: str, channel_id: int, temp: float, timestamp: float) -> None:
    """
    Pushes a temperature point into a Redis Sorted Set (ZSET) for historical reference.
    Automatically trims the set to keep only the last 30 minutes of telemetry (1800 seconds).
    """
    client = get_redis_client()
    key = f"telemetry:history:{device_id}:{channel_id}"
    
    # Add point with score as timestamp
    client.zadd(key, {str(temp): timestamp})
    
    # Prune elements older than 30 minutes (current timestamp - 1800)
    cutoff = timestamp - 1800
    client.zremrangebyscore(key, "-inf", cutoff)

def get_raw_history(device_id: str, channel_id: int) -> list:
    """
    Retrieves the last 30 minutes of temperature telemetry as a list of (temp, timestamp) tuples.
    """
    client = get_redis_client()
    key = f"telemetry:history:{device_id}:{channel_id}"
    
    # Retrieve all items in the sorted set with their scores (timestamps)
    results = client.zrange(key, 0, -1, withscores=True)
    # Map back to tuples: (temperature, timestamp)
    return [(float(value), float(score)) for value, score in results]
