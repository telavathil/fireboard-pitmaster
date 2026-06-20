from celery import Celery
from app.config import settings

# Initialize Celery app instance (smoker_controller)
celery_app = Celery(
    "smoker_controller",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.pit_tasks"]
)

# Configure Celery settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Configure task scheduling (Stoker Beat)
    beat_schedule={
        "poll-fireboard-every-20-seconds": {
            "task": "app.pit_tasks.poll_fireboard_api",
            "schedule": 20.0,
        }
    }
)
