# 004 — Fade and settle the end-cook dialog in (CONDITIONAL)

- **Status**: DONE (162d383), owner approved
- **Commit**: ef64d44
- **Severity**: LOW
- **Category**: Missed opportunity (preventing a jarring change)
- **Depends on**: none (independent of 001–003)
- **Estimated scope**: 2 files (`globals.css`, `EndCookDialog.tsx`) + `DESIGN.md`, ~30 lines

> **Gate before executing:** `frontend/DESIGN.md:434` currently says *"Don't add motion beyond the pull takeover and simple hover or press feedback."* This plan breaks that rule on purpose and amends it in step 4. Only run it if the owner has agreed. If the owner hasn't agreed, mark the plan SKIPPED. Leaving the dialog instant is a valid result.

## Problem

`EndCookDialog` is a native `<dialog>` opened with `showModal()`. The dialog and its 55% navy backdrop appear in a single frame over the bright yellow live screen. It happens about once per cook, and it's the only full-screen interruption in the app, so the hard cut is the most abrupt visual change outside the pull takeover.

```tsx
// frontend/src/components/live/EndCookDialog.tsx:25-33 — current
<dialog
  ref={ref}
  onCancel={(e) => { e.preventDefault(); onCancel(); }}
  aria-labelledby="end-cook-title"
  className="m-auto w-[min(92vw,420px)] rounded-[14px] bg-tide-ground p-6 text-tide-ink shadow-[0_18px_50px_rgb(19_35_58/0.28)] backdrop:bg-[rgb(13_21_36/0.55)]"
>
```

## Target

Animate the entrance only, using CSS `@starting-style` (no JS):
- **Dialog**: from `opacity: 0; transform: scale(0.97)` to `opacity: 1; transform: scale(1)`, over 200ms with `cubic-bezier(0.16, 1, 0.3, 1)`. Modals stay centred, so the transform origin stays at the default `center`.
- **Backdrop**: opacity from 0 to 1 over the same 200ms and curve.
- **Exit**: instant. Once the user has decided, the dialog gets out of the way. No `allow-discrete` exit transition.
- **Reduced motion**: opacity fade only, no scale.
- **Unsupported browsers** (no `@starting-style`): the dialog appears instantly, same as today.

```css
/* frontend/src/app/globals.css — append after the .tide-alarm reduced-motion block */

/* The end-cook dialog settles in over the band; it closes instantly. */
.tide-dialog[open] {
  opacity: 1;
  transform: scale(1);
  transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.tide-dialog[open]::backdrop {
  opacity: 1;
  transition: opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

@starting-style {
  .tide-dialog[open] { opacity: 0; transform: scale(0.97); }
  .tide-dialog[open]::backdrop { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  @starting-style {
    .tide-dialog[open] { transform: none; }
  }
}
```

## Repo conventions to follow

- Authored motion lives in `frontend/src/app/globals.css` as `tide-*` classes with a `prefers-reduced-motion` block. Exemplars: `.tide-band` and `.tide-alarm`, plus the reduced-motion block that follows them.
- The world's curve is `cubic-bezier(0.16, 1, 0.3, 1)`, written out in full. There is no CSS variable for it, so don't introduce one in this plan.
- The backdrop colour stays in the Tailwind `backdrop:bg-[...]` class. The CSS only animates opacity.

## Steps

1. Append the CSS block from **Target** to `frontend/src/app/globals.css`, directly after the existing `@media (prefers-reduced-motion: reduce) { .tide-band …; .tide-alarm … }` block and before `.tide-layout`.
2. In `frontend/src/components/live/EndCookDialog.tsx`, add `tide-dialog ` to the start of the `<dialog>` className at line 32. Change nothing else.
3. Confirm no Tailwind `opacity-*`, `scale-*` or `transition-*` utility is on the `<dialog>` element. None is at `ef64d44`. If one is, STOP and report.
4. Amend `frontend/DESIGN.md`:
   - Line 434: replace with `- **Don't** add motion beyond the pull takeover, the end-cook dialog's entrance, and simple hover or press feedback.`
   - Line 375: replace the closing sentence `This is the world's only motion moment.` with `This is the world's one authored motion moment.`
   - In `### Menu and Dialog`, append the sentence: `The dialog fades and settles in from 97% scale over 200ms on the world's curve (opacity only under reduced motion), with the backdrop fading alongside; it closes instantly.`

## Boundaries

- Do NOT animate the cook overflow menu (`CookBand.tsx`). It opens straight into this dialog, and animating both would stack motion on one action.
- Do NOT add an exit animation.
- Do NOT change `EndCookDialog`'s open/close logic, focus handling (`autoFocus` on "Keep cooking") or markup.
- Do NOT add dependencies or JS-driven animation.
- If any quoted line doesn't match (drift since `ef64d44`), STOP and report.

## Verification

- **Mechanical** (from `frontend/`): `npm run lint`, `npm test` (`LiveCook.test.tsx` exercises the dialog in jsdom and must stay green), and `npm run build` succeeds, so Tailwind/PostCSS accepts `@starting-style`.
- **Feel check** (`npm run dev`, a live cook or `?phase=N`):
  - Menu → "End cook…": the backdrop fades in while the dialog settles from slightly smaller. It should feel quick, not like something staged.
  - At 10% playback in DevTools → Animations, confirm the motion starts fast and decelerates, that the scale starts from 0.97 and never from 0, and that the backdrop and dialog finish together.
  - "Keep cooking" and Escape close the dialog instantly.
  - Focus lands on "Keep cooking" right away. Pressing Enter during the 200ms entrance works.
  - With reduced motion emulated: a pure fade, no scale.
  - Check iOS Safari (17.5+ supports `@starting-style`) on a real phone. On older browsers, confirm the dialog just appears.
  - Judgement call: if it feels decorative on the phone outdoors, revert it. The code can't settle that.
- **Done when**: the dialog and backdrop fade in over 200ms, close instantly, and `DESIGN.md` describes the change.
