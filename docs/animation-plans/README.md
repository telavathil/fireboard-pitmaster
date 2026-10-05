# Animation plans

Written by `improve-animations` at commit `ef64d44`, from the `find-animation-opportunities` sweep of `frontend/`. Each plan is self-contained and can be handed to any agent.

| # | Plan | Severity | Depends on | Status |
| --- | --- | --- | --- | --- |
| 001 | [Shared press feedback + end-cook buttons](001-shared-press-feedback.md) | MEDIUM | — | DONE (7280fe2, feat/motion-polish) |
| 002 | [Stepper press transition](002-stepper-press-transition.md) | LOW | 001 | DONE (643e5d2, feat/motion-polish) |
| 003 | [Secondary buttons, chips, silence toggle](003-secondary-press-feedback.md) | LOW | 001 | DONE (86b3e70, feat/motion-polish) |
| 004 | [End-cook dialog entrance](004-end-cook-dialog-entrance.md) (conditional) | LOW | — | DONE (162d383, feat/motion-polish) |

## Execution order

1. **001** first. It creates `frontend/src/components/tide/press.ts`, which 002 and 003 import.
2. **002** and **003** after that, in either order or in parallel. They touch different files, except that 003 extends the `press` import that 001 added to `PullAlarm.tsx`.
3. **004** only if the owner agrees to amend the `DESIGN.md:434` "no motion beyond the pull takeover" rule. It's independent, so it can run at any point.

001–003 are allowed under the current `DESIGN.md` (press feedback is permitted). 004 is the only one that changes the design rules.
