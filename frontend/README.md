FireBoard Pitmaster dashboard - a [Next.js](https://nextjs.org) app bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or whichever port you pass via `-p`) to see the result. The app expects a backend at `NEXT_PUBLIC_BACKEND_URL` (defaults to `http://localhost:8000`) - see the [root README](../README.md) for starting the full stack with `make up`.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Testing

There are three layers of tests, plus a couple of legacy manual scripts.

### Unit tests (Vitest)

Pure logic extracted out of `CookSessionContext` - time formatters, SVG chart-path math - lives in `src/lib/` and is tested directly with no rendering involved.

### Component tests (Vitest + React Testing Library)

Colocated with the components they test (e.g. `src/components/Sidebar.test.tsx`), rendered in isolation with `useCookSession` mocked - no backend, no browser. These catch rendering/routing/interaction bugs fast, including regression tests for real bugs found during manual QA (e.g. `src/app/page.test.tsx` guards against the tab-routing logic silently hiding the Empty Dashboard view whenever no cook session is active).

Run both unit and component suites:

```bash
npm run test        # single run
npm run test:watch  # watch mode
```

### E2E tests (Playwright)

Drives the real app in a real browser against the **real backend** - no mocked API responses. This is deliberate: several real bugs (a stale "completed" session being served as active, the Empty Dashboard being unreachable) only showed up against real backend state, not in isolated component tests.

**Prerequisites:**
- The backend stack must be running: `make up-d` from the repo root (or `make up` in a separate terminal).
- A frontend dev server reachable at `http://localhost:3002` - `playwright.config.ts` will reuse one if it's already running there, or start one itself.

```bash
npm run test:e2e
```

Each spec's `beforeEach` clears any leftover active session via the API first (`tests/e2e/helpers.ts`), so runs are deterministic regardless of what a previous run or the background Celery simulator left behind. Specs are organized by flow:

- `login-and-empty-dashboard.spec.ts` - auth, and the Empty Dashboard regression tests
- `session-lifecycle.spec.ts` - Pre-Cook Setup form interactions, session creation, ending a cook
- `phases.spec.ts` - all 6 dashboard phase views, driven via the `?phase=N` debug override the app itself supports, with real button interactions (spritz, silence alarm, pull, carving)
- `settings-and-history.spec.ts` - Settings controls and the History tab

Locators prefer `getByRole` throughout (per [Playwright's guidance](https://www.browserstack.com/guide/playwright-getbyrole)). A couple of components didn't have real ARIA roles or label associations when this suite was written (unlabeled inputs, non-semantic nav items) - those gaps were fixed in the app itself (`Sidebar.tsx`, the login form in `page.tsx`) specifically so the tests could rely on roles instead of CSS/text fallbacks.

#### Validating against a real (not debug-overridden) cook

`?phase=N` only proves a view renders - it never touches real telemetry. To validate the actual pipeline (SSE → Kalman filter → solver → phase computation → UI) end to end, drive a real simulated cook at accelerated speed from the repo root:

```bash
make fast-forward ARGS="--target-c 95 --meat pork --cut 'Shoulder Butt' --cooker pellet"
```

See `backend/scripts/fast_forward_cook.py` for details. It leaves the session active by default, so open the dashboard right after to see the real, non-overridden UI. Note: Phase 3 (Stall) can't be reached this way, real-time or accelerated - the simulator has no plateau modeling, so `?phase=3` is still the only way to see that view.

### Legacy visual-check scripts

`tests/verify_navigation.js` and `tests/verify_phases.js` connect to an already-running Chrome instance over the DevTools Protocol (port 9222) and save screenshots to `tests/screenshots/` for manual review. They predate the Playwright suite above, don't make assertions, and aren't part of CI - kept around for quick ad-hoc visual spot-checks.

```bash
npm run test:nav
npm run test:phases
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
