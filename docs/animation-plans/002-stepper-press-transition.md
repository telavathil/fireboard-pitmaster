# 002 — Make the target stepper's press animate instead of snapping

- **Status**: DONE (643e5d2)
- **Commit**: ef64d44
- **Severity**: LOW
- **Category**: Interruptibility, Physicality & origin
- **Depends on**: 001 (`frontend/src/components/tide/press.ts` must exist)
- **Estimated scope**: 1 file, 2 changed lines

## Problem

The ± target-temperature buttons scale on press but have no transition, so they jump straight to 97% and back. People tap these in bursts (stepping a target by 5–10°), which makes the jump look like flicker.

```tsx
// frontend/src/components/tide/FormParts.tsx:132 — current (inside TargetStepper's stepButton)
className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] ring-[1.5px] ring-tide-rule hover:ring-tide-ink active:scale-[0.97]"
```

## Target

Use the shared small-target press from plan 001: a 150ms transform transition on `cubic-bezier(0.16, 1, 0.3, 1)`, scaling to 0.97, and dimming to 80% opacity instead of scaling under reduced motion. Because a CSS transition retargets from its current value, rapid taps stay smooth and don't restart.

```tsx
// target
className={`${PRESS_SMALL} flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] ring-[1.5px] ring-tide-rule hover:ring-tide-ink`}
```

## Repo conventions to follow

- `PRESS_SMALL` is exported from `frontend/src/components/tide/press.ts` (created in plan 001). Exemplar of its use after 001: `frontend/src/components/live/EndCookDialog.tsx`, which applies `PRESS` the same way.

## Steps

1. In `frontend/src/components/tide/FormParts.tsx`, add `import { PRESS_SMALL } from "./press";` after the existing imports.
2. Replace the `className` at line 132 with the target string above. This deletes the hand-typed `active:scale-[0.97]`.

## Boundaries

- Do NOT touch `Segmented`, `TextField` or anything else in `FormParts.tsx`.
- Do NOT change the stepper's size, ring or icon.
- If `press.ts` doesn't exist yet, STOP: plan 001 hasn't run.

## Verification

- **Mechanical** (from `frontend/`): `npx tsc --noEmit`, `npm run lint` and `npm test` all pass. `SetupScreen.test.tsx` covers the stepper and must stay green.
- **Feel check** (`npm run dev`, Cook tab with no active cook):
  - Tap + about ten times quickly. The button dips and recovers smoothly on each tap, with no flicker, and the number updates on every tap.
  - At 10% playback in DevTools → Animations, the press eases in rather than jumping.
  - With reduced motion emulated, the button dims while pressed and doesn't scale.
- **Done when**: both step buttons animate their press, and `FormParts.tsx` contains no `active:scale-`.
