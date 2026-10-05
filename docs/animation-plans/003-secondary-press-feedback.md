# 003 — Add press feedback to secondary buttons, preset chips and the silence toggle

- **Status**: DONE (86b3e70)
- **Commit**: ef64d44
- **Severity**: LOW
- **Category**: Physicality & origin (press feedback), Cohesion & tokens
- **Depends on**: 001 (`frontend/src/components/tide/press.ts` must exist)
- **Estimated scope**: 6 files, ~8 changed lines

## Problem

Every ring-style secondary button has a hover state but no press state. On a phone, where hover never fires, a tap gets no response at all until the result shows up. The silence toggle in the pull alarm sits right next to "I pulled it, start rest", which does have press feedback, so the two buttons respond differently.

```tsx
// frontend/src/components/history/HistoryScreen.tsx:13-14 (used at :45 "Try again" and :56 "Start a cook")
const secondaryButton =
  "min-h-[48px] rounded-[10px] px-5 text-[15px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink";

// frontend/src/components/settings/PullAlertsSetting.tsx:32-33 ("Send a test alert", "Turn off")
const secondary =
  "min-h-[48px] rounded-[10px] px-5 text-[15px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink disabled:cursor-not-allowed disabled:opacity-50";

// frontend/src/components/tide/StatusScreen.tsx:27 ("Try again")
className="mt-5 min-h-[48px] rounded-[10px] px-5 text-[15px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink"

// frontend/src/components/settings/SettingsScreen.tsx:80 ("Sign out")
className="mt-4 flex min-h-[48px] items-center gap-2 rounded-[10px] px-5 text-[15px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink"

// frontend/src/components/setup/SetupScreen.tsx:103 (preset chips, 44px)
className="min-h-[44px] rounded-full px-4 text-[14px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink aria-pressed:bg-tide-ink aria-pressed:text-tide-ground aria-pressed:ring-tide-ink"

// frontend/src/components/live/PullAlarm.tsx:40 (silence toggle, 56×56 icon button)
className="flex min-h-[56px] w-14 items-center justify-center rounded-[10px] ring-[1.5px] ring-current/70"
```

## Target

Prepend the shared press constant from plan 001. Both constants use a 150ms transform transition on `cubic-bezier(0.16, 1, 0.3, 1)`, and under reduced motion they dim to 80% opacity instead of scaling.

| Element | Constant | Press scale | Why |
| --- | --- | --- | --- |
| 48px secondary buttons (History ×2, PullAlerts ×2, StatusScreen, Sign out) | `PRESS` | 0.98 | Wide text buttons, same as primaries |
| Preset chips (44px pills) | `PRESS_SMALL` | 0.97 | Small target |
| Silence toggle (56×56 icon) | `PRESS_SMALL` | 0.97 | Icon-only square |

Disabled buttons: `:active` still fires on a disabled `<button>` in some browsers. Plan 001's primaries already behave this way, so it's acceptable. Don't add extra `disabled:` handling here.

## Repo conventions to follow

- Exemplar after plan 001: `frontend/src/components/setup/SetupSummary.tsx:7`, where `const PrimaryClasses` is a template literal starting with `${PRESS} `.
- When a string literal becomes a template literal, use backticks and `${...}` exactly as `SetupSummary.tsx:27` does.

## Steps

1. `frontend/src/components/history/HistoryScreen.tsx`: add `import { PRESS } from "../tide/press";`. Change `secondaryButton` to
   `` `${PRESS} min-h-[48px] rounded-[10px] px-5 text-[15px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink` ``
2. `frontend/src/components/settings/PullAlertsSetting.tsx`: add `import { PRESS } from "../tide/press";`. Prepend `${PRESS} ` to `const secondary`, turning it into a template literal.
3. `frontend/src/components/tide/StatusScreen.tsx`: add `import { PRESS } from "./press";`. Prepend `${PRESS} ` to the line-27 className, turning it into a template literal.
4. `frontend/src/components/settings/SettingsScreen.tsx`: add `import { PRESS } from "../tide/press";`. Prepend `${PRESS} ` to the line-80 className.
5. `frontend/src/components/setup/SetupScreen.tsx`: add `import { PRESS_SMALL } from "../tide/press";`. Prepend `${PRESS_SMALL} ` to the preset chip className at line 103.
6. `frontend/src/components/live/PullAlarm.tsx`: add `PRESS_SMALL` to the import from `../tide/press`, which plan 001 already added for `PRESS`. Prepend `${PRESS_SMALL} ` to the silence toggle className at line 40.

## Boundaries

- Do NOT change any colours, rings, sizes or `aria-*` attributes.
- Do NOT touch the nav tabs (`LiveNav.tsx`), segmented controls (`FormParts.tsx` `Segmented`), the cook menu trigger or menu item (`CookBand.tsx`), or the `<details>` summary. They were left out on purpose: they're either high-frequency navigation or already give feedback through a colour change.
- Do NOT touch `frontend/src/app/globals.css`.
- If plan 001 hasn't run, or a quoted line doesn't match, STOP and report.

## Verification

- **Mechanical** (from `frontend/`): `npx tsc --noEmit`, `npm run lint` and `npm test` all pass. `PullAlertsSetting.test.tsx`, `SettingsScreen.test.tsx` and `SetupScreen.test.tsx` must stay green.
- **Feel check** (`npm run dev`):
  - History (empty or error state), Settings → Sign out, Settings → pull-alert buttons: each press settles to 98% and releases cleanly.
  - Setup preset chips: the press dips to 97%, and the selected ink fill still changes instantly.
  - Pull alarm (`?phase=` for the pull stage): the silence toggle and "I pulled it" now respond the same way. Checking this on a real phone outdoors is ideal.
  - With reduced motion emulated, every button above dims while pressed and doesn't scale.
- **Done when**: all nine elements listed in **Problem** use `PRESS` or `PRESS_SMALL`.
