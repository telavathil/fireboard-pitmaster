# 3. Server-Sent Events (SSE) for Real-Time UI Telemetry and Prediction Streaming

## Status

Accepted

## Context

The Next.js client needs to receive active temperature updates, state logs, and predicted ETA calculations from the backend as they are generated. We need a reliable, low-resource streaming mechanism.

## Decision

We will use **Server-Sent Events (SSE)** via HTTP for streaming live data from the FastAPI backend to the Next.js frontend, rather than WebSockets.
* Telemetry and prediction objects are updated in Redis by background workers and then published over SSE channels.
* Client-to-server operations (like modifying target temperature or starting a new cook session) will be handled through standard POST/PUT REST endpoints.

## Consequences

* **Pros**:
  * Simple to implement in standard HTTP and naturally works through standard reverse proxies and load balancers without special WebSocket configuration (e.g. timeout settings).
  * Extremely low memory footprint and automatic reconnection capabilities built-in on the browser client via `EventSource`.
  * Reduces socket-management overhead on our single-node VPS.
* **Cons**:
  * Unidirectional data flow. Clients cannot send commands back to the server over the same connection (not a problem for this dashboard, as actions are simple button clicks that map well to REST API calls).
