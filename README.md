# FireBoard Pitmaster

A predictive cooking web application leveraging thermodynamic simulation, state estimation, and the FireBoard Cloud API to forecast internal meat temperatures and cook times.

---

## Project Roadmap & Status

- **[Project Roadmap & Status Board](ROADMAP.md)**: Check this file to see our current progress, active sprint, and task checklists across sessions.

---

## Project Documentation & Specifications

All technical specifications, architectural decisions, and research are stored in the `docs/` folder:

- **[Technical Specification](docs/project_specification.md)**: The core system blueprint covering frontend, backend, workers, and mathematical solvers.
- **[Architecture Decision Records (ADRs)](docs/adrs/)**: Log of architectural choices:
  1. [ADR 1: AWS Lightsail Single VPS Deployment](docs/adrs/0001-minimized-aws-lightsail-vps-deployment.md)
  2. [ADR 2: Turso Serverless SQLite Database](docs/adrs/0002-turso-database-integration.md)
  3. [ADR 3: Server-Sent Events (SSE) Streaming](docs/adrs/0003-server-sent-events-streaming.md)
  4. [ADR 4: Ingestion-Triggered Predictions](docs/adrs/0004-event-driven-predictions.md)
  5. [ADR 5: Thematic Pitmaster Naming Conventions](docs/adrs/0005-thematic-pitmaster-naming-conventions.md)
- **[Research Material](docs/research/)**:
  - [Thermodynamic Modeling & API Integration Study](docs/research/Predictive Cooking and FireBoard API Integration S....md)
  - [AWS Monthly Cost Estimation](docs/research/cost_estimate.md)

---

## Technical Stack

- **Frontend**: Next.js (React), TailwindCSS, Tremor / D3.js (live charting).
- **Backend API**: FastAPI (Python 3.11+).
- **Database**: Turso (Serverless LibSQL/SQLite).
- **Broker & Cache**: Redis (Task queueing & transient telemetry series).
- **Background Tasks**: Celery task runner, configured as the **Pit Boss** worker and **Stoker** scheduler (polling every 20s).
- **Solvers**: 1D Kalman Filter (telemetry smoothing) + 1D Crank-Nicolson finite-difference heat equation solver.

---

## Getting Started (Local Development)

The project includes a **[Makefile](Makefile)** to simplify development and testing inside Docker:

1. **Setup Environment**: Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

2. **Run Tests**: Execute the test suite inside the container:
   ```bash
   make test
   ```

3. **Start Application**: Build and start all services (FastAPI, Redis, Stoker, Pit Boss):
   ```bash
   make up
   ```
   *(Or run `make up-d` to launch in the background and `make down` to stop).*

4. **Access Endpoints**:
   * **Backend API Swagger docs**: `http://localhost:8000/docs`
   * **SSE Telemetry stream**: `http://localhost:8000/api/telemetry/stream/{device_id}/{channel_id}`

