# 2. Turso Serverless SQLite Database (libsql) for Persistent Cook Data

## Status

Accepted

## Context

Our database must store persistent cook session metadata (meat type, weight, thickness, target temperatures) and downsampled historical telemetry for graph rendering. While running PostgreSQL inside a container on the single AWS Lightsail instance is possible, database processes consume constant background memory (~150-250MB RAM) and require setting up automated database backup procedures to prevent loss of personal cook histories in case of VPS failure.

## Decision

We will use **Turso (serverless LibSQL/SQLite)** for persistent relational data storage instead of hosting PostgreSQL locally.
* The Python FastAPI application and Celery workers will communicate with Turso over HTTP/WebSockets via the official `libsql` client.
* Active Redis cache instances will remain on-server for quick caching, while historical cook records will be flushed to Turso.

## Consequences

* **Pros**:
  * Reduces Lightsail VPS memory pressure to zero for database operations.
  * Completely free tier (up to 9 GB storage) with automated cloud backups.
  * Simple, file-less client configuration using a database URL and auth token.
* **Cons**:
  * Relies on internet connectivity from the VPS to the Turso cloud (which is already a dependency since we are polling the FireBoard Cloud API).
  * Increases database query latency slightly compared to local SQLite or localhost Postgres (mitigated by caching active states in Redis).
