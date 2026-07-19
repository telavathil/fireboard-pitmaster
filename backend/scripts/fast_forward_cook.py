"""
Drive a real simulated cook session to completion at accelerated speed, for
validating the dashboard UX end-to-end against genuine telemetry (Kalman
filter, solver ETA, currentPhase computation) instead of the frontend's
?phase=N debug override, which only exercises view rendering.

Why this exists: the backend's simulator only advances via a Celery beat
tick every 20s, raising core temp by 0.08-0.25C per tick (see
run_cook_simulation in app/pit_tasks.py). A real cook from ambient to a
typical target takes HOURS of wall-clock time that way. This script calls
the same simulation + prediction logic directly and synchronously in a
tight loop, bypassing the beat schedule, so a full cook completes in
seconds while still exercising the real pipeline.

Must run inside a container that has the `app` package importable with a
working REDIS_URL/DB_URL (i.e. the pit_boss or stoker image) - it is not
usable from the host directly. See fast_forward_cook.sh / `make
fast-forward` for the wrapper that copies and runs this inside the running
pit_boss container.

Known limitation this cannot work around: Phase 3 (Stall) can never be
reached this way, real-time or accelerated - the simulator has no plateau
modeling, so heating_rate never drops below the stall threshold. Use
?phase=3 in the frontend to validate that view.
"""

import argparse
import random
import sys
import time

import httpx

from app.cache import get_latest_telemetry, push_raw_history
from app.pit_tasks import run_predictions

DEFAULT_BACKEND_URL = "http://backend:8000"
DEFAULT_AMBIENT_TEMP_C = 107.5


def end_active_session(backend_url: str) -> None:
    resp = httpx.get(f"{backend_url}/api/sessions/active", timeout=10.0)
    if resp.status_code == 404:
        return
    resp.raise_for_status()
    session_id = resp.json()["id"]
    httpx.patch(
        f"{backend_url}/api/sessions/{session_id}",
        json={"status": "completed"},
        timeout=10.0,
    )
    print(f"Ended pre-existing active session {session_id}")


def create_session(backend_url: str, args: argparse.Namespace) -> dict:
    payload = {
        "device_id": args.device_id,
        "device_name": "Fast-Forward Validation Rig",
        "meat_type": args.meat,
        "cut_type": args.cut,
        "cooker_type": args.cooker,
        "status": "bare",
        "weight_kg": args.weight_kg,
        "thickness_mm": args.thickness_mm,
        "target_temp_c": args.target_c,
    }
    resp = httpx.post(f"{backend_url}/api/sessions", json=payload, timeout=10.0)
    resp.raise_for_status()
    return resp.json()


def run_ticks(session_id: str, device_id: str, target_temp_c: float, args: argparse.Namespace) -> dict:
    latest = None
    for i in range(1, args.max_ticks + 1):
        now_ts = time.time()
        last_temp = latest.get("core_temp_raw", 15.0) if latest else 4.0
        core_temp = min(last_temp + random.uniform(0.08, 0.25), target_temp_c)
        push_raw_history(device_id, 1, core_temp, now_ts)

        # Call the task body directly (synchronously) rather than .delay():
        # each tick's prediction must be fully written before the next
        # tick reads "latest", or fast iteration races the async worker
        # queue and most ticks silently read stale state.
        run_predictions.run(
            session_id, device_id, core_temp, DEFAULT_AMBIENT_TEMP_C, target_temp_c, now_ts
        )
        latest = get_latest_telemetry(device_id, 1)

        if i % args.log_every == 0 or i == args.max_ticks:
            print(
                f"tick {i}/{args.max_ticks}: raw={latest['core_temp_raw']:.2f} "
                f"filtered={latest['core_temp_filtered']:.2f} "
                f"confidence={latest['confidence']} "
                f"stall={latest['stall_detected']} eta={latest['eta_seconds']}"
            )

        if latest["confidence"] == "complete":
            print(f"Target reached after {i} ticks.")
            break

        time.sleep(args.tick_delay)
    else:
        print(
            f"Reached --max-ticks ({args.max_ticks}) without hitting target "
            f"({target_temp_c}C) - current filtered temp: {latest['core_temp_filtered']:.2f}C"
        )

    return latest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--session-id", help="Continue an existing session instead of creating one")
    parser.add_argument("--device-id", default="device_sim_123")
    parser.add_argument("--target-c", type=float, default=95.0, help="Target core temp in Celsius")
    parser.add_argument("--meat", default="beef")
    parser.add_argument("--cut", default="Brisket Flat")
    parser.add_argument("--cooker", default="kamado")
    parser.add_argument("--weight-kg", type=float, default=5.4)
    parser.add_argument("--thickness-mm", type=float, default=75.0)
    parser.add_argument("--max-ticks", type=int, default=1000, help="Safety cap on ticks if target is never reached")
    parser.add_argument("--tick-delay", type=float, default=0.02, help="Seconds to sleep between ticks")
    parser.add_argument("--log-every", type=int, default=20)
    parser.add_argument("--end", action="store_true", help="End the session when done instead of leaving it active for manual inspection")
    parser.add_argument("--backend-url", default=DEFAULT_BACKEND_URL)
    args = parser.parse_args()

    if args.session_id:
        session_id = args.session_id
        target_temp_c = args.target_c
    else:
        end_active_session(args.backend_url)
        session = create_session(args.backend_url, args)
        session_id = session["id"]
        target_temp_c = session["target_temp_c"]
        print(f"Created session {session_id}: {args.cut} on {args.cooker}, target {target_temp_c}C")

    final_state = run_ticks(session_id, args.device_id, target_temp_c, args)

    if args.end:
        httpx.patch(
            f"{args.backend_url}/api/sessions/{session_id}",
            json={"status": "completed"},
            timeout=10.0,
        )
        print(f"Ended session {session_id}.")
    else:
        print(
            f"Session {session_id} left active - open the dashboard now to see the real "
            f"UI driven by this telemetry (final state: {final_state})."
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
