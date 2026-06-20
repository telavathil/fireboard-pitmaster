# Project Roadmap & Execution Status

This document tracks the current execution state of the **FireBoard Pitmaster** project against the vision established in the guiding research paper: **[Predictive Cooking and FireBoard API Integration Study](docs/research/Predictive Cooking and FireBoard API Integration S....md)**.

---

## Current Status Summary

* **Active Phase**: Sprint 3 (Predictive Solver Integration)
* **Current Focus**: Sprint 3 Planning & Specification Design
* **Project State**: `Sprint 2 Completed` (Mathematical filtering & state estimation active, ready to plan thermodynamic solver)

---

## Roadmap & Execution Checklist

### [Completed] Sprint 1: Ingestion & Storage
Goal: Establish rate-limit compliant FireBoard polling, cache live data in Redis, and persist logs to Turso.

* [x] **Phase 1A: Architectural Design & Decisions**
  * [x] Formulate Lightsail VPS single-node deployment strategy ([ADR 1](docs/adrs/0001-minimized-aws-lightsail-vps-deployment.md))
  * [x] Choose Turso (libsql) as persistent serverless SQLite DB ([ADR 2](docs/adrs/0002-turso-database-integration.md))
  * [x] Select Server-Sent Events (SSE) for client updates ([ADR 3](docs/adrs/0003-server-sent-events-streaming.md))
  * [x] Opt for ingestion-triggered predictions ([ADR 4](docs/adrs/0004-event-driven-predictions.md))
  * [x] Draft and approve Sprint 1 Technical Specification ([docs/project_specification.md](docs/project_specification.md))
* [x] **Phase 1B: Backend Infrastructure Setup**
  * [x] Create backend directory layout and configure dependencies (`requirements.txt`, Dockerfile)
  * [x] Implement Turso schema definition and database configuration
* [x] **Phase 1C: Poller and Cache Pipelines**
  * [x] Implement Pit Boss worker and periodic Stoker scheduler (20s intervals)
  * [x] Build FireBoard authentication agent and API polling client
  * [x] Build Redis ingestion pipeline (storing raw/latest telemetry states)
* [x] **Phase 1D: API Endpoints & SSE Streaming**
  * [x] Implement FastAPI server endpoints (login, active session mapping, config)
  * [x] Implement SSE route to stream raw temperature telemetry to clients
  * [x] Verify containerized multi-service local environment

---

### [Completed] Sprint 2: Filtering & Estimation
Goal: Smooth discretization steps and extract differentiable rate of change ($dT/dt$).
* [x] Define Sprint 2 Technical Specification and design parameters ([docs/sprint2_specification.md](docs/sprint2_specification.md))
* [x] Implement digital 1D Kalman Filter state estimator
* [x] Write unit tests for step-discretization noise filtering using mock inputs
* [x] Connect Kalman filter to the Pit Boss worker ingestion pipeline


---

### [Not Started] Sprint 3: Predictive Solver Integration
Goal: Implement Crank-Nicolson thermodynamic equations and evaporative stall parameters.
* [ ] Define Sprint 3 Technical Specification
* [ ] Write 1D Crank-Nicolson heat equation solver using NumPy/SciPy
* [ ] Implement boundary conditions for standard heat transfer and evaporative stall plateaus (65 °C - 75 °C)
* [ ] Integrate baseline statistical ML model for standard cook durations

---

### [Not Started] Sprint 4: UI Dashboard & Streaming
Goal: Construct Next.js frontend to visualize live graphs, ring timer, and carryover.
* [ ] Define Sprint 4 Technical Specification
* [ ] Create Next.js application layout and page structures
* [ ] Implement Tremor/D3 live sensor graphs and animated ring timer
* [ ] Integrate browser-side carryover resting alert banner
