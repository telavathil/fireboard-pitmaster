# 4. Ingestion-Triggered Predictions

## Status

Accepted

## Context

The FireBoard API rate limits constrain polling to once every 20 seconds. Once a new temperature coordinate is fetched, we need to run Kalman filtering and thermodynamic solvers (1D Crank-Nicolson) to estimate the remaining time. We must decide whether to calculate predictions on-demand, on a separate time-based schedule (e.g. cron every 60s), or as soon as new data arrives.

## Decision

We will trigger prediction calculations **immediately upon every data ingestion point** (i.e. every 20 seconds as soon as the poller worker receives a successful response from FireBoard).
* The polling worker saves raw metrics to the cache and then immediately pushes a task to the Celery queue to run the Kalman/prediction math.
* The calculated predictions are written to Redis and streamed to the UI over SSE.

## Consequences

* **Pros**:
  * Minimizes calculation lag: the frontend displays the new ETA immediately when the temperature updates.
  * Avoids wasting CPU cycles running math when no new data has been ingested.
* **Cons**:
  * Spikes CPU usage for a short window every 20 seconds (mitigated by limiting the Celery worker concurrency to 1, ensuring that prediction tasks are executed sequentially).
