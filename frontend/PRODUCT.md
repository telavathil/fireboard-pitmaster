# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single user: the owner, cooking on their own smoker with their own FireBoard account. This is a personal tool, not a multi-tenant product. During a cook they are mostly at the grill on a phone, glancing at it from a few feet away, often outdoors, with hands busy or greasy. A laptop or tablet left open indoors is the secondary device.

The job: run a long low-and-slow cook (brisket, pork butt, poultry, and so on) and know exactly when to pull the meat, without babysitting a thermometer or guessing through the stall.

## Product Purpose

FireBoard Pitmaster turns live FireBoard probe telemetry into decisions: current core and pit temperature, a time remaining estimate, whether the stall has started, and the pull temperature that lands the target doneness after carryover during the rest. Success means the meat comes off at the right moment and the cook trusts the numbers enough not to second-guess them.

## Positioning

The FireBoard app shows what the probes read now. Pitmaster predicts what happens next: readings are smoothed with a 1D Kalman filter, a 1D Crank-Nicolson heat-equation solver models the evaporative stall (about 65-75 °C), and the pull recommendation accounts for carryover rise. The value is a prediction you can act on, not another live graph.

## Operating Context

- A cook moves through stages: setup (protein, cut, weight, thickness, cooker type, target temp, probe channel mapping), stabilizing (the filter is still calibrating), active cook, stall, pull alert, rest, then end of cook.
- Cooks run for many hours (often 8-14+), so the screen is checked intermittently over a long session rather than watched continuously.
- Data path: FireBoard Cloud API, polled every 20 s by the `stoker` scheduler and processed by the `pit_boss` worker (Celery), cached in Redis, persisted to Turso, streamed to the browser over SSE.
- Cooker profiles in use: kamado, pellet, offset, electric.

## Capabilities and Constraints

- Frontend: Next.js 16 (App Router, React 19), Tailwind v4. Backend: FastAPI, Celery, Redis, Turso.
- Login is a placeholder: the backend accepts any non-empty username and password and returns a mock token; it does not verify a FireBoard account (the poller uses FireBoard credentials from server config). One active session at a time.
- `?phase=N` is a debug override that only exercises view rendering; `backend/scripts/fast_forward_cook.py` drives a real simulated cook through the full pipeline.
- The backend flags telemetry as `stale` when polling fails; the spec requires a visible alert when data is more than 60 s old.
- Units: the backend works in °C; the UI offers °F and °C.
- The FireBoard API is rate-limited, so update cadence is bounded by polling (about 20 s), not by the UI.
- Open: several UI values are currently hardcoded placeholders (pit temp and humidity on the stall view, fuel level, signal, elapsed time, carryover efficiency, model version, device IP/MAC, all History entries). Each one needs real data or an explicit "not available" state.

## Brand Commitments

- Product name: **FireBoard Pitmaster**. "Ember & Char" and "Hearth Command" in the current UI are leftovers and should not be used.
- Backend naming follows the pitmaster theme (ADR 5: `pit_boss`, `stoker`, `smoker_controller`). That's a codebase convention, not a requirement for UI copy.

## Evidence on Hand

- Real: live telemetry and predictions from the backend pipeline, and the simulation script for complete realistic cooks.
- Research and specs: `docs/research/`, `docs/project_specification.md`, `docs/sprint2_specification.md`, `docs/sprint3_specification.md`.
- Absent: no real cook history, accuracy statistics, or prediction-error figures have been collected yet. Do not fabricate them (for example "± 4.2 min prediction error" or "98.4% carryover efficiency").

## Product Principles

1. **Answer first, model on demand.** Lead with the decision: pull temperature, time remaining, what to do now. Kalman, solver and stall detail stays available but is tucked away until asked for.
2. **Never miss the pull moment.** The pull alert is the most important state in the product. It must be impossible to overlook, including at a glance from across the yard.
3. **Truthful data or none.** Stale, missing or placeholder values must never pass as live readings. Show data age, and degrade to an explicit "no data" state rather than a believable number.
4. **Honest uncertainty.** Estimates carry their confidence, especially early in a cook and during the stall. Never present a guess as certain.
5. **A 12-hour cook is precious.** Destructive actions (ending a session) require deliberate confirmation and cannot be triggered by a stray tap.

## Accessibility & Inclusion

Phone-first outdoor use: readable at arm's length and in direct sunlight (high contrast, large primary figures), and touch targets sized for hurried, imprecise taps. Alerts must not rely on color alone.
