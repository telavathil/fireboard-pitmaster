# FireBoard Pitmaster

A predictive cooking web application leveraging thermodynamic simulation, state estimation, and the FireBoard Cloud API to forecast internal meat temperatures and cook times.

---

## Project Roadmap & Status

- **[Project Roadmap & Status Board](ROADMAP.md)**: Check this file to see our current progress, active sprint, and task checklists across sessions.

---

## Project Documentation & Specifications

All technical specifications, architectural decisions, and research are stored in the `docs/` folder:

- **[Sprint 1 Technical Specification](docs/project_specification.md)**: The core system blueprint covering frontend, backend, workers, and database.
- **[Sprint 2 Technical Specification](docs/sprint2_specification.md)**: The state estimation and Kalman Filter integration specifications.
- **[Architecture Decision Records (ADRs)](docs/adrs/)**: Log of architectural choices:
  1. [ADR 1: AWS Lightsail Single VPS Deployment](docs/adrs/0001-minimized-aws-lightsail-vps-deployment.md)
  2. [ADR 2: Turso Serverless SQLite Database](docs/adrs/0002-turso-database-integration.md)
  3. [ADR 3: Server-Sent Events (SSE) Streaming](docs/adrs/0003-server-sent-events-streaming.md)
  4. [ADR 4: Ingestion-Triggered Predictions](docs/adrs/0004-event-driven-predictions.md)
  5. [ADR 5: Thematic Pitmaster Naming Conventions](docs/adrs/0005-thematic-pitmaster-naming-conventions.md)
- **[Research Material](docs/research/)**:
  - [Thermodynamic Modeling & API Integration Study](docs/research/Predictive Cooking and FireBoard API Integration S....md)
  - [Kalman Filter Theory & Cooking Telemetry](docs/research/kalman_filter.md)
  - [AWS Monthly Cost Estimation](docs/research/cost_estimate.md)

---

## Pull Alerts (Web Push)

The app is an installable PWA and can send a "Pull now" notification when a cook reaches its pull temperature, even with the app closed. Each device opts in from **Settings → Pull alerts**.

1. Generate a VAPID key pair once and put it in the root `.env` (never commit it):

   ```bash
   docker compose run --rm backend python -c "from py_vapid import Vapid01; from cryptography.hazmat.primitives import serialization as s; import base64; v=Vapid01(); v.generate_keys(); b=lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode(); print('VAPID_PUBLIC_KEY='+b(v.public_key.public_bytes(s.Encoding.X962, s.PublicFormat.UncompressedPoint))); print('VAPID_PRIVATE_KEY='+b(v.private_key.private_numbers().private_value.to_bytes(32,'big')))" >> .env
   ```

   Also set `VAPID_SUBJECT=mailto:you@example.com` (a contact address push services may use).
2. Rebuild: `docker compose up -d --build backend pit_boss stoker`.
3. Push needs HTTPS (or `localhost`). On iPhone/iPad, add the app to the Home Screen first (iOS 16.4+), then turn alerts on from the installed app.

The `pit_boss` worker sends the alert once per cook, while the cook is still on the heat; expired device subscriptions are removed automatically.

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

2. **Run Tests**: Execute the backend test suite inside the container:
   ```bash
   make test
   ```
   Frontend unit, component, and E2E tests are documented in [`frontend/README.md`](frontend/README.md#testing).

3. **Start Application**: Build and start all services (FastAPI, Redis, Stoker, Pit Boss):
   ```bash
   make up
   ```
   *(Or run `make up-d` to launch in the background and `make down` to stop).*

4. **Access Endpoints**:
   * **Backend API Swagger docs**: `http://localhost:8000/docs`
   * **SSE Telemetry stream**: `http://localhost:8000/api/telemetry/stream/{device_id}/{channel_id}`

