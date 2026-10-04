---
name: FireBoard Pitmaster
description: A live cook read like a tide table. One curve over clock time, the next event printed as a time.
colors:
  almanac-yellow: "#f2c230"
  navy-ink: "#13233a"
  table-stock: "#f5f6f2"
  slate-muted: "#566273"
  hairline-grey: "#cdd2d8"
  tide-blue: "#2e6db4"
  pull-red: "#c8372d"
  on-pull: "#fff7f5"
  night-band: "#1d2a44"
  night-ground: "#0d1524"
  night-amber: "#f2b544"
  night-muted: "#a3a089"
  night-rule: "#2a3754"
  night-tide-blue: "#7fa8de"
  night-pull-red: "#d9443a"
  night-on-pull: "#fff3f1"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(5.5rem, 27vw, 8.5rem)"
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 66"
    fontFeature: "'tnum'"
  alarm:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(3.75rem, 17vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 66"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.4rem, 6vw, 1.75rem)"
    fontWeight: 700
    lineHeight: 1.25
    fontVariation: "'wdth' 80"
    fontFeature: "'tnum'"
  table-figure:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1
    fontVariation: "'wdth' 76"
    fontFeature: "'tnum'"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    fontVariation: "'wdth' 85"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
  caption:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
rounded:
  control: "10px"
  menu: "12px"
  dialog: "14px"
  icon-button: "9999px"
spacing:
  gutter-phone: "20px"
  gutter-desktop: "40px"
  section: "20px"
  row: "12px"
  column-gap: "48px"
  rail: "88px"
  content-max: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.table-stock}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-pull:
    backgroundColor: "{colors.on-pull}"
    textColor: "{colors.pull-red}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "56px"
  band:
    backgroundColor: "{colors.almanac-yellow}"
    textColor: "{colors.navy-ink}"
    padding: "18px 20px 16px"
  band-pull:
    backgroundColor: "{colors.pull-red}"
    textColor: "{colors.on-pull}"
  menu:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.menu}"
    width: "180px"
  dialog:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.dialog}"
    padding: "24px"
    width: "min(92vw, 420px)"
  nav-item:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.slate-muted}"
    typography: "{typography.caption}"
    height: "52px"
  nav-item-active:
    textColor: "{colors.navy-ink}"
---

# Design System: FireBoard Pitmaster

## Overview

**Creative North Star: "The Cook's Tide Table"**

The cook is read like a tide forecast. One curve runs over clock time, and the next event is printed as a time of day. The reference is a farmer's almanac and a printed tide table: a yellow header band, cool white paper, navy ink, a blue projected line, and condensed figures set large enough to read from a few feet away at the grill. The screen answers three things in order: where the meat is, when it will be ready, and whether to act. Model detail opens on demand.

Density is low and vertical. On a phone the screen is one column of type and rules: band, core figure beside the pull target, stage line, full-width tide chart, forecast rows, pit reading, tab bar. On desktop it splits into a figure-and-table column on the left and a tall chart on the right. Nothing sits in a card. Sections are separated by hairline rules and spacing, the way a printed table is.

Two palettes share one structure. Daylight is yellow, white and navy for direct sun. After dark the ground turns navy and the figures turn amber. Red is kept for one event, the pull, and when the pull comes the whole band turns red.

**Key Characteristics:**
- One condensed grotesk (Archivo, width axis) with tabular figures for everything.
- A yellow band at the top that carries the cook name, data problems, and the pull takeover.
- Hairline rules instead of containers; flat surfaces.
- The tide chart: solid past, dashed projection, now line, red pull line.
- Red only for the pull.
- Daylight and night palettes swap through the same tokens.

## Colors

A printed-almanac palette: one warm band color, cool paper, navy ink, one blue for the forecast and one red for the pull.

### Primary
- **Almanac Yellow** (almanac-yellow): The header band behind the cook name and its menu, the text-selection color, and the active-tab marker. It is the screen's one large field of color.
- **Tide Blue** (tide-blue): The dashed projection on the chart and the focus outline. It means "the model's forecast" or "where keyboard focus is", nothing else.

### Secondary
- **Pull Red** (pull-red, with on-pull for text on it): The pull and only the pull. During the pull stage the band, and with it the active-tab marker, turn red. Elsewhere red appears only as the pull value in the forecast table and the dashed pull line on the chart.

### Neutral
- **Navy Ink** (navy-ink): Body text, the core figure, the past curve on the chart, the now line, the heavy top rule of the forecast table, and the fill of primary buttons. Also the text on the yellow band.
- **Table Stock** (table-stock): The page ground, the menu and dialog surface, and the text on navy buttons.
- **Slate Muted** (slate-muted): Notes, captions, chart labels, past and future stages, and the dimmed core figure when a reading can't be trusted.
- **Hairline Grey** (hairline-grey): Row dividers, chart gridlines and baseline, nav borders, and the ring on secondary buttons.

### Night palette
Under `prefers-color-scheme: dark` the same tokens take night values: night-ground for the page, night-band for the band, night-amber for ink and figures (and for text on the band), night-muted, night-rule, night-tide-blue for the projection, and night-pull-red with night-on-pull for the pull. Components never pick a palette themselves. They use the `--tide-*` custom properties on `.tide-world`, and the palette swaps underneath them.

### Named Rules
**The One Red Rule.** Red belongs to the pull. It shows up as the band during the pull stage, the pull row value, and the pull line on the chart. Never use it for errors, warnings, stale data or decoration.

**The Token Swap Rule.** Every color is read from a `--tide-*` custom property, so daylight, night and pull are token changes on `.tide-world`, never per-component overrides.

## Typography

**Display Font:** Archivo (with system-ui, sans-serif), loaded through `next/font` with the `wdth` axis.
**Body Font:** Archivo, the same family.

**Character:** One grotesk family. Width does the work that a second typeface would: the core figure and the pull headline are squeezed to 66% width, the table figures to 76%, the target to 80%, the dialog title to 85%. Running text stays at normal width. Tabular figures are on across the whole world so numbers don't shift as they update.

### Hierarchy
- **Display** (800, clamp(5.5rem, 27vw, 8.5rem), line-height 0.8, -0.02em, width 66%): The core temperature. One per screen.
- **Alarm** (800, clamp(3.75rem, 17vw, 6rem), line-height 0.88, -0.02em, width 66%): "Pull now" inside the red band.
- **Headline** (700, clamp(1.4rem, 6vw, 1.75rem), width 80%): The pull target beside the core figure.
- **Table figure** (700, 28px, line-height 1, width 76%): Right-aligned times and values in the forecast rows.
- **Title** (700, 24px, width 85%): Dialog headings.
- **Body** (400 to 600, 15–17px, line-height 1.375–1.625): Row labels, notes, the band's cook name (17px semibold), button text (16–17px bold). Explanatory paragraphs cap at 42–60ch.
- **Label** (600, 14px): The stage line, pit reading, details rows.
- **Caption** (400, 12–13px): Chart captions, row notes, tab labels (12px semibold), chart axis text (11–12px).

### Named Rules
**The Width Axis Rule.** Hierarchy comes from size and width together. Big numbers are condensed and heavy; reading text is normal width. Don't add a second display family.

**The Tabular Rule.** All figures are tabular (`font-variant-numeric: tabular-nums`, set on `.tide-world`).

## Layout

Phone first. The main column has a 20px side gutter (40px from 768px), a 1200px maximum width, and named grid areas in reading order: readout, stages, chart, table, meta, details. Vertical spacing is mostly 20px between sections (`mt-5`), 12px inside table rows, and 24px above the chart and the details block.

From 900px the grid splits into two columns, `minmax(320px, 5fr)` and `minmax(0, 7fr)`, with a 48px gap. The readout, stages, table, meta and details stack on the left; the chart spans every row on the right and grows taller (up to 600px, 85% of its width). Below 560px of chart width the chart is 62% of its width, with a 210px minimum.

Navigation is a bottom tab bar on phones (with safe-area padding) and an 88px left rail from 768px. The band respects the top safe-area inset. The details block carries extra bottom padding on phones so the tab bar never covers it.

## Elevation & Depth

The world is flat. Depth comes from the band's color field and from rules, not from shadows or layered surfaces. Only two things float above the page, and only those two carry shadows.

### Shadow Vocabulary
- **Menu** (`box-shadow: 0 10px 30px rgb(19 35 58 / 0.22)`): The band's overflow menu.
- **Dialog** (`box-shadow: 0 18px 50px rgb(19 35 58 / 0.28)`, backdrop `rgb(13 21 36 / 0.55)`): The end-cook confirmation.

### Named Rules
**The Rules Not Cards Rule.** Group content with hairline rules and space. The forecast table opens with a 1.5px ink rule and separates rows with 1px hairlines. Shadows belong to floating layers (menu, dialog) only.

## Shapes

Mostly square. Content areas have no corners at all because they have no containers. Interactive controls get gently rounded corners: 10px on buttons, 12px on the menu, 14px on the dialog. The overflow trigger is a 44px circle. Focus outlines have a 4px radius. Lines on the chart use round caps and joins.

## Components

### Buttons
Solid, plain and large enough for a greasy thumb.
- **Shape:** Gently rounded (10px).
- **Primary:** Navy ink fill, table-stock text, 16px bold, 20px side padding, at least 48px tall (52px for "Finish cook"). Hover drops opacity to 90%.
- **Secondary:** No fill, a 1.5px hairline-grey ring that darkens to ink on hover. Used for "Keep cooking".
- **Pull:** Inside the red band the colors invert: on-pull fill, red text, 17px bold, 56px tall, scales to 98% on press. Paired with a 56px square silence toggle that has a 1.5px ring in the current text color.
- **Focus:** 2px tide-blue outline, 2px offset, on every focusable element.
- **Touch targets:** At least 44px everywhere; primary actions 48–56px.

### Navigation
- **Style:** Table-stock surface with a hairline border on its inner edge. Each item is a 24px Phosphor icon over a 12px semibold label, at least 52px tall.
- **States:** Inactive items are slate-muted and turn ink on hover. The active item is ink, its icon switches to the fill weight, and a 3px by 32px band-colored marker sits on the top edge (phone) or left edge (rail).

### Band
The yellow header. It holds the cook name (17px semibold, truncated) and the overflow menu. Lost or stale data appears inside the band as a 15px semibold message with a Wi-Fi-off icon, so it reads in sun like the pull does. During the pull the band turns red and the pull alarm opens inside it.

### Pull Alarm
"Pull now" at alarm size, one sentence on carryover, then the pull button and silence toggle. It enters with a clip-path reveal from the top (520ms, `cubic-bezier(0.16, 1, 0.3, 1)`) while the band color crossfades (420ms, same curve). Both are turned off under `prefers-reduced-motion`. This is the world's only motion moment.

### Tide Chart (signature)
The cook drawn as a tide chart in SVG.
- **Past:** Solid navy-ink line, 2.75px, round caps and joins.
- **Projection:** Dashed tide-blue line (2.5px, dash 7 5) from now to the target time. There is no range band, because the model has no range. It is hidden when data is stale, at the pull, and during the rest.
- **Scale:** Temperature labels sit in a 36px right gutter so they never cross a line; gridlines are hairline at 60% opacity. Hour labels run along the bottom.
- **Now:** A 1px ink hairline labeled "now" in 12px bold.
- **Pull line:** A 1.5px dashed red line (dash 5 4) with a 12px semibold red label, drawn last so nothing covers it.
- **Caption:** One line in 13px muted text saying what solid and dashed mean.

### Forecast Table
A tide-table list: label on the left at 15px medium, value on the right at the table-figure size, optional 13px muted note under the value. A 1.5px ink rule on top, 1px hairline under each row. The pull row's value is red.

### Stage Line
The cook's stages as a wrapping row of 14px semibold words. The current stage is ink with a 2px underline at 6px offset; the others are muted, and future ones drop to 75% opacity.

### Menu and Dialog
The overflow menu is a 180px table-stock panel (12px radius, menu shadow) with 44px items. The end-cook dialog is a native `<dialog>` (14px radius, 24px padding, dialog shadow) with focus on "Keep cooking" by default and the destructive "End cook" as the primary button.

### Estimate Details
A native `<details>` disclosure behind a hairline rule: a 48px summary row with a caret that rotates when open, a short explanation (max 60ch), and label/value rows separated by hairlines.

## Do's and Don'ts

### Do:
- **Do** read every color from the `--tide-*` tokens on `.tide-world` so daylight, night and pull all work.
- **Do** set big numbers in Archivo condensed (66–80% width), heavy, with tabular figures.
- **Do** separate content with hairline rules (1px hairline-grey, 1.5px ink for a table's top rule) and space.
- **Do** put lost or stale data in the band, at band-level readability.
- **Do** keep touch targets at least 44px, and primary actions 48–56px.
- **Do** use Phosphor icons (`@phosphor-icons/react`), regular weight, with fill for the active tab.
- **Do** honor `prefers-reduced-motion` for any transition.

### Don't:
- **Don't** use red for anything but the pull.
- **Don't** draw a range or confidence band around the projection. The model gives one path, so the chart shows one dashed line.
- **Don't** put content in cards or give surfaces shadows. Shadows are for the menu and dialog only.
- **Don't** add a second typeface. Width and weight carry the hierarchy.
- **Don't** add motion beyond the pull takeover and simple hover or press feedback.
