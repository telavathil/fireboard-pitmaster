# 001 — Add shared press feedback and apply it to the end-cook buttons

- **Status**: DONE (7280fe2)
- **Commit**: ef64d44
- **Severity**: MEDIUM
- **Category**: Physicality & origin (press feedback), Cohesion & tokens
- **Estimated scope**: 1 new file, 7 edited files, ~15 changed lines

## Problem

The buttons on the only irreversible flow in the app (ending a cook) have no press state, while primary buttons elsewhere scale to 98% on press. The user is at the grill with greasy hands, and a tap with no visible response invites a second tap.

```tsx
// frontend/src/components/live/EndCookDialog.tsx:48 — "Keep cooking", current
className="min-h-[48px] rounded-[10px] px-5 text-[17px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink"

// frontend/src/components/live/EndCookDialog.tsx:55 — "End cook", current
className="min-h-[48px] rounded-[10px] bg-tide-ink px-5 text-[17px] font-bold text-tide-ground hover:opacity-90"

// frontend/src/components/live/LiveCook.tsx:112 — "Finish cook" (rest stage), current
className="mt-5 min-h-[52px] w-full rounded-[10px] bg-tide-ink px-5 text-[17px] font-bold text-tide-ground hover:opacity-90"
```

The press recipe that does exist is copied by hand into four files, with Tailwind's weak default curve and no reduced-motion handling:

```tsx
// frontend/src/components/live/PullAlarm.tsx:31
"... transition-transform active:scale-[0.98] sm:flex-none"
// frontend/src/components/settings/PullAlertsSetting.tsx:31 (const primary)
// frontend/src/components/setup/SetupSummary.tsx:7 (const PrimaryClasses)
// frontend/src/components/login/LoginScreen.tsx:87
"... transition-transform hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
```

## Target

One shared module that defines press feedback once. Under reduced motion it swaps the scale for a slight dim, so the user still gets feedback without movement:

```ts
// frontend/src/components/tide/press.ts — new file
/**
 * Press feedback for every button in the tide world: a quick, subtle scale on
 * the world's one curve. Under reduced motion the scale becomes a slight dim.
 */
export const PRESS =
  "transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:active:opacity-80";

/** Small targets (chips, icon and step buttons) need a little more scale to read. */
export const PRESS_SMALL =
  "transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:active:opacity-80";
```

Values and where they come from:
- **Duration**: 150ms, inside the 100–160ms budget for press feedback.
- **Curve**: `cubic-bezier(0.16, 1, 0.3, 1)`, the curve already used for the pull takeover in `frontend/src/app/globals.css` (`.tide-band`, `.tide-alarm`).
- **Scale**: 0.98 for buttons 48px tall or more (unchanged from today), 0.97 for small targets.
- **Reduced motion**: no scale; opacity drops to 80% while pressed.

Both strings must stay as full literals in a file under `src/`, because Tailwind v4 scans source for class names. Never build them by string concatenation.

## Repo conventions to follow

- Shared UI building blocks live in `frontend/src/components/tide/` (see `FormParts.tsx`, `TideScreen.tsx`).
- Class constants are module-level `const` strings combined with template literals. Exemplar: `frontend/src/components/setup/SetupSummary.tsx:6-7` (`PrimaryClasses`), used at `:27` as `` className={`${PrimaryClasses} shrink-0 px-6`} ``.
- Import paths are relative (e.g. `../tide/FormParts`).

## Steps

1. Create `frontend/src/components/tide/press.ts` with exactly the contents in **Target**.
2. `frontend/src/components/live/EndCookDialog.tsx`: add `import { PRESS } from "../tide/press";`. Change line 48 to
   `` className={`${PRESS} min-h-[48px] rounded-[10px] px-5 text-[17px] font-semibold ring-[1.5px] ring-tide-rule hover:ring-tide-ink`} ``
   and line 55 to
   `` className={`${PRESS} min-h-[48px] rounded-[10px] bg-tide-ink px-5 text-[17px] font-bold text-tide-ground hover:opacity-90`} ``
3. `frontend/src/components/live/LiveCook.tsx`: add `import { PRESS } from "../tide/press";`. Change the "Finish cook" `className` (line 112) to
   `` className={`${PRESS} mt-5 min-h-[52px] w-full rounded-[10px] bg-tide-ink px-5 text-[17px] font-bold text-tide-ground hover:opacity-90`} ``
4. Move the four existing primaries onto the constant. In each one, delete `transition-transform` and `active:scale-[0.98]` from the string and prepend `${PRESS} `. Leave every other class as it is.
   - `frontend/src/components/live/PullAlarm.tsx:31` (turn the string literal into a template literal)
   - `frontend/src/components/settings/PullAlertsSetting.tsx:31` (`const primary`)
   - `frontend/src/components/setup/SetupSummary.tsx:7` (`const PrimaryClasses`)
   - `frontend/src/components/login/LoginScreen.tsx:87`
5. `frontend/DESIGN.md`: under `### Do:` (just after the line `- **Do** honor \`prefers-reduced-motion\` for any transition.`), add
   `- **Do** give every button press feedback with \`PRESS\` (or \`PRESS_SMALL\` for chips and icon buttons) from \`src/components/tide/press.ts\`; never hand-type a press scale.`

## Boundaries

- Do NOT touch the secondary buttons, preset chips, silence toggle or target stepper. Plans 002 and 003 cover them.
- Do NOT change colours, sizes, padding or hover styles. Motion classes only.
- Do NOT touch `globals.css` or the pull takeover animation.
- Do NOT add dependencies.
- If any quoted line doesn't match what's in the file (drift since `ef64d44`), STOP and report rather than improvising.

## Verification

- **Mechanical** (from `frontend/`): `npx tsc --noEmit`, `npm run lint` and `npm test` all pass with no new warnings. `grep -rn "active:scale-\[0.98\]" src` should match only `src/components/tide/press.ts`.
- **Feel check** (`npm run dev` on port 3002; add `?phase=N` to reach the rest stage without a real cook):
  - Open the cook menu → "End cook…". Pressing and holding "Keep cooking" and "End cook" visibly settles each one to 98%, and it springs back on release.
  - In DevTools → Animations, set playback to 10%. The scale-down starts immediately (strong ease-out) and doesn't creep.
  - Tap quickly several times. Each press retargets from wherever it is, with no jump back to 100% first.
  - In DevTools → Rendering, emulate `prefers-reduced-motion: reduce`. Pressing dims the button with no scale.
  - On a real phone: the press is visible under a thumb, and nothing feels delayed.
- **Done when**: all seven buttons listed in steps 2–4 use `${PRESS}`, and no file outside `press.ts` contains a hand-typed `active:scale-`.
