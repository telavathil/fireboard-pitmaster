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
  field-white: "#ffffff"
  night-band: "#1d2a44"
  night-ground: "#0d1524"
  night-amber: "#f2b544"
  night-muted: "#a3a089"
  night-rule: "#2a3754"
  night-tide-blue: "#7fa8de"
  night-pull-red: "#d9443a"
  night-on-pull: "#fff3f1"
  night-field: "#142039"
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
  figure:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.25
    fontVariation: "'wdth' 80"
    fontFeature: "'tnum'"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    fontVariation: "'wdth' 85"
  section:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.25
    fontVariation: "'wdth' 85"
  action:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
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
  pill: "9999px"
spacing:
  gutter-phone: "20px"
  gutter-desktop: "40px"
  section: "20px"
  row: "12px"
  column-gap: "48px"
  rail: "88px"
  content-max: "1200px"
  content-narrow: "640px"
components:
  button-primary:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.table-stock}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "48px"
  button-primary-large:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.table-stock}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "56px"
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
  text-field:
    backgroundColor: "{colors.field-white}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "52px"
  segmented:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "48px"
  segmented-compact:
    typography: "{typography.label}"
    height: "44px"
  segmented-selected:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.table-stock}"
  chip-preset:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  chip-preset-selected:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.table-stock}"
  stepper-button:
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.control}"
    size: "56px"
  setup-summary:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.navy-ink}"
    padding: "12px 0"
  start-bar:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.navy-ink}"
    padding: "12px 20px"
  screen-band:
    backgroundColor: "{colors.almanac-yellow}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.action}"
    padding: "18px 20px 16px"
  history-row:
    textColor: "{colors.navy-ink}"
    typography: "{typography.figure}"
    padding: "12px 0"
  settings-column:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.navy-ink}"
    width: "640px"
  sign-in-column:
    backgroundColor: "{colors.table-stock}"
    textColor: "{colors.navy-ink}"
    width: "400px"
---

# Design System: FireBoard Pitmaster

## Overview

**Creative North Star: "The Cook's Tide Table"**

The cook is read like a tide forecast. One curve runs over clock time, and the next event is printed as a time of day. The reference is a farmer's almanac and a printed tide table: a yellow header band, cool white paper, navy ink, a blue projected line, and condensed figures set large enough to read from a few feet away at the grill. The screen answers three things in order: where the meat is, when it will be ready, and whether to act. Model detail opens on demand.

Density is low and vertical. On a phone the screen is one column of type and rules: band, core figure beside the pull target, stage line, full-width tide chart, forecast rows, pit reading, tab bar. On desktop it splits into a figure-and-table column on the left and a tall chart on the right. Nothing sits in a card. Sections are separated by hairline rules and spacing, the way a printed table is.

The same world carries the second surface, "Start a cook". With no cook running, the Cook tab opens a setup form under the same band: titled sections divided by hairlines, large tap targets, and on the right (or pinned at the bottom on a phone) a summary of the cook as it will start, set in the forecast table's rhythm.

History, Settings and the signed-out sign-in screen live in the same world. Every signed-in screen except the live cook shares one shell: navigation, the yellow band with the screen's title, then the content. History is a printed table of finished cooks, each row's figures in the condensed face; Settings is a short column of hairline-separated sections with the same segmented controls setup uses. Signed out, the band carries the product name over one short sign-in form; there is no navigation until you are in.

Two palettes share one structure. Daylight is yellow, white and navy for direct sun. After dark the ground turns navy and the figures turn amber. Red is kept for one event, the pull, and when the pull comes the whole band turns red.

**Key Characteristics:**
- One condensed grotesk (Archivo, width axis) with tabular figures for everything.
- A yellow band at the top that carries the cook name, data problems, and the pull takeover.
- Hairline rules instead of containers; flat surfaces on every screen: live, setup, history and settings.
- The tide chart: solid past, dashed projection, now line, red pull line.
- Red only for the pull.
- Daylight and night palettes swap through the same tokens.

## Colors

A printed-almanac palette: one warm band color, cool paper, navy ink, one blue for the forecast and one red for the pull.

### Primary
- **Almanac Yellow** (almanac-yellow): The header band behind the cook name and its menu, the text-selection color, and the active-tab marker. It is the screen's one large field of color.
- **Tide Blue** (tide-blue): The dashed projection on the chart, the focus outline, the focused text-field ring and the resting text caret. It means "the model's forecast" or "where keyboard focus is", nothing else.

### Secondary
- **Pull Red** (pull-red, with on-pull for text on it): The pull and only the pull. During the pull stage the band, and with it the active-tab marker, turn red. Elsewhere red appears only as the pull value in the forecast table and the dashed pull line on the chart.

### Neutral
- **Navy Ink** (navy-ink): Body text, the core figure, the past curve on the chart, the now line, the heavy top rule of the forecast table, and the fill of primary buttons. Also the text on the yellow band, and the text and caret of an autofilled field.
- **Table Stock** (table-stock): The page ground, the menu and dialog surface, and the text on navy buttons.
- **Slate Muted** (slate-muted): Notes, captions, chart labels, past and future stages, and the dimmed core figure when a reading can't be trusted.
- **Hairline Grey** (hairline-grey): Row dividers, setup section dividers, chart gridlines and baseline, nav borders, and the 1.5px ring on secondary buttons, unselected segments, chips, step buttons and text fields.
- **Field White** (field-white): The input surface only. One step brighter than the table stock, so a text field reads as a place to write without needing a box around its section.

### Night palette
Under `prefers-color-scheme: dark` the same tokens take night values: night-ground for the page, night-band for the band, night-amber for ink and figures (and for text on the band), night-muted, night-rule, night-tide-blue for the projection, and night-pull-red with night-on-pull for the pull, and night-field for inputs. Components never pick a palette themselves. They use the `--tide-*` custom properties on `.tide-world`, and the palette swaps underneath them.

### Named Rules
**The One Red Rule.** Red belongs to the pull. It shows up as the band during the pull stage, the pull row value, and the pull line on the chart. Never use it for errors, warnings, stale data or decoration. Problems speak in ink: weight, a heavier ring and a warning icon (form errors), or the band itself (lost data).

**The Token Swap Rule.** Every color is read from a `--tide-*` custom property, so daylight, night and pull are token changes on `.tide-world`, never per-component overrides. `.tide-world` is on `<body>` and Archivo is the only face loaded; there is no other styling in the project.

### Browser Surfaces
Surfaces the browser paints itself are pulled back into the world, all scoped to `.tide-world` in `globals.css`:
- **Selection:** Band color with on-band text, so selected text looks like a strip of the band.
- **Focus:** A 2px tide-blue outline at 2px offset on every `:focus-visible` element.
- **Caret:** Tide blue by default.
- **Autofill:** `:-webkit-autofill` / `:autofill` inputs keep the field surface and ink: text fill and caret are set to ink, the browser's background is held off by a very long background-color/color transition, and box-shadow is left alone so the field's own ring still shows.

## Typography

**Display Font:** Archivo (with system-ui, sans-serif), loaded through `next/font` with the `wdth` axis.
**Body Font:** Archivo, the same family.

**Character:** One grotesk family. Width does the work that a second typeface would: the core figure and the pull headline are squeezed to 66% width, the table figures to 76%, the target and summary values to 80%, the dialog title and setup section titles to 85%. Running text stays at normal width. Tabular figures are on across the whole world so numbers don't shift as they update.

### Hierarchy
- **Display** (800, clamp(5.5rem, 27vw, 8.5rem), line-height 0.8, -0.02em, width 66%): The core temperature. One per screen. On setup the target stepper uses the same face at a smaller clamp (clamp(4rem, 18vw, 5.5rem), line-height 0.85) as that screen's one big figure.
- **Alarm** (800, clamp(3.75rem, 17vw, 6rem), line-height 0.88, -0.02em, width 66%): "Pull now" inside the red band.
- **Headline** (700, clamp(1.4rem, 6vw, 1.75rem), width 80%): The pull target beside the core figure.
- **Table figure** (700, 28px, line-height 1, width 76%): Right-aligned times and values in the forecast rows.
- **Figure** (700, 22px, line-height 1.25, width 80%): The secondary figure face. Setup summary values, and the duration, target and peak in every history row, at every width including phones.
- **Title** (700, 24px, width 85%): Dialog headings.
- **Section** (700, 22px, line-height 1.25, width 85%): Section headings on setup ("What's cooking", "Size", "Target") and settings ("Temperature", "Pull alarm sound", "Account"), the "Sign in" heading, and the title of an empty-state message.
- **Action** (17px; 600 for text, 700 for buttons): The band title on every screen (the product name when signed out), every primary button (End cook, Finish cook, Start cook, the pull), the end-cook dialog's Keep cooking (semibold), the pull explanation (regular), the cut name in a history row, and the value typed into a text field. The size that must read at arm's length without being a figure.
- **Body** (400 to 600, 15px, line-height 1.375–1.625): Row labels, notes, status and error messages, segment labels (semibold), secondary button text (semibold). Explanatory paragraphs cap at 42–60ch.
- **Label** (400 to 600, 14px): The stage line, pit reading, details rows, field labels and legends, history column headers, preset chips, compact segments, form errors (all semibold), and settings helper text (regular, muted).
- **Caption** (400 to 600, 13px; chart text 11–12px): Chart captions, row notes, field hints, the history date and detail lines on phones, the peak note, and tab labels (13px semibold).

### Named Rules
**The Width Axis Rule.** Hierarchy comes from size and width together. Big numbers are condensed and heavy; reading text is normal width. Don't add a second display family.

**The Tabular Rule.** All figures are tabular (`font-variant-numeric: tabular-nums`, set on `.tide-world`).

## Layout

Phone first. The main column has a 20px side gutter (40px from 768px), a 1200px maximum width, and named grid areas in reading order: readout, stages, chart, table, meta, details. Vertical spacing is mostly 20px between sections (`mt-5`), 12px inside table rows, and 24px above the chart and the details block.

From 900px the grid splits into two columns, `minmax(320px, 5fr)` and `minmax(0, 7fr)`, with a 48px gap. The readout, stages, table, meta and details stack on the left; the chart spans every row on the right and grows taller (up to 600px, 85% of its width). Below 560px of chart width the chart is 62% of its width, with a 210px minimum.

Setup uses its own grid on the same gutters and maximum width. It is one column on phones; from 900px it splits `minmax(0, 7fr)` / `minmax(300px, 5fr)` with a 48px gap, the reverse of the live split: the form is the wide column and the summary aside sits on the right, sticky 24px from the top. Sections run 24px above and 28px below their content, with a hairline between them; fields inside a section are 20px apart and pair up side by side from 640px. Below 900px the summary's button is hidden and a start bar takes its place: fixed above the tab bar (53px plus the safe-area inset; at the bottom edge beside the rail from 768px), table-stock with a hairline top edge, carrying a one-line recap and the Start cook button. The summary keeps enough bottom padding that the start bar never covers it.

History and Settings sit on the same gutters and 1200px maximum, with bottom padding (112px on phones, 48px from 768px) so the tab bar never covers the last row. The history table starts 24px under the band. Settings content is capped at 640px; its sections use setup's section rhythm (24px above, 28px below, hairline between).

The sign-in screen uses the same gutters and 1200px container with 32px above the form (48px from 768px); the form is a 400px column, left-aligned in the container rather than centered.

Navigation is a bottom tab bar on phones (with safe-area padding) and an 88px left rail from 768px. The band respects the top safe-area inset. The details block carries extra bottom padding on phones so the tab bar never covers it.

## Elevation & Depth

The world is flat. Depth comes from the band's color field and from rules, not from shadows or layered surfaces. Only two things float above the page, and only those two carry shadows.

### Shadow Vocabulary
- **Menu** (`box-shadow: 0 10px 30px rgb(19 35 58 / 0.22)`): The band's overflow menu.
- **Dialog** (`box-shadow: 0 18px 50px rgb(19 35 58 / 0.28)`, backdrop `rgb(13 21 36 / 0.55)`): The end-cook confirmation.

### Named Rules
**The Rules Not Cards Rule.** Group content with hairline rules and space. The forecast table, the setup summary and the history table open with a 1.5px ink rule and separate rows with 1px hairlines; setup and settings sections are divided by a single hairline. Shadows belong to floating layers (menu, dialog) only.

## Shapes

Mostly square. Content areas have no corners at all because they have no containers. Interactive controls get gently rounded corners: 10px on buttons, text fields, segments and step buttons, 12px on the menu, 14px on the dialog. Full pills are kept for two things: the 44px overflow trigger circle and the preset chips. Control outlines are rings (1.5px hairline, darkening to ink on hover), never filled boxes. Focus outlines have a 4px radius. Lines on the chart use round caps and joins.

## Components

### Buttons
Solid, plain and large enough for a greasy thumb.
- **Shape:** Gently rounded (10px).
- **Primary:** Navy ink fill, table-stock text, the action size (17px bold), 20px side padding, at least 48px tall (52px for "Finish cook"). Hover drops opacity to 90%. Used for End cook and Finish cook.
- **Large primary:** "Start cook" is 56px tall at the action size (17px bold), scales to 98% on press, and drops to 50% opacity while disabled ("Starting…"). Full width in the summary aside; content width in the start bar.
- **Secondary:** No fill, at least 48px tall, 10px corners, 20px side padding, a 1.5px hairline-grey ring that turns ink on hover, 15px semibold. An optional 20px icon sits before the label with an 8px gap (Sign out). Used for "Try again" and "Start a cook" in history states and "Sign out" in settings. In the end-cook dialog, "Keep cooking" takes the same ring at the action size so it matches End cook beside it.
- **Pull:** Inside the red band the colors invert: on-pull fill, red text, 17px bold, 56px tall, scales to 98% on press. Paired with a 56px square silence toggle that has a 1.5px ring in the current text color.
- **Focus:** 2px tide-blue outline, 2px offset, on every focusable element.
- **Touch targets:** At least 44px everywhere; primary actions 48–56px.

### Inputs / Fields
Plain, roomy and written in ink.
- **Text field:** Label above (14px semibold), then a field at least 52px tall with 10px corners, the field surface, 16px side padding, and the typed value at the action size (17px semibold). Placeholders are regular weight in slate-muted. At rest a 1.5px hairline ring; on focus a 2px tide-blue ring. Fields that hold credentials carry autocomplete semantics (`username`, `current-password`, `type="password"`); other fields default to `autocomplete="off"`. A unit segmented control can sit inside the row to the right of the field.
- **Hint and error:** A hint sits below in 13px muted text. An error sits below it in 14px semibold ink with a bold 18px warning-circle icon, and the field's ring thickens to 2.5px ink. The ink ring stays while the field is focused; focus then adds the 2px tide-blue outline 2px outside it, so the field reads as both wrong and active. No red, under the One Red Rule. After a failed submit, focus moves to the first invalid field.
- **Segmented control:** A native radio group with its legend above (or visually hidden for unit pickers). Options are 10px-cornered cells with a 1.5px hairline ring, 48px tall at 15px semibold (44px at 14px when compact, for units). The selected option fills with ink and its text turns ground-colored; keyboard focus shows the tide-blue outline on the visible cell. Laid out as an even row, two columns, or two-then-four columns.
- **Preset chip:** A 44px full pill with a 1.5px hairline ring, 14px semibold "Name · target°". Pressed state (`aria-pressed`) is an ink fill with ground-colored text, the same selection grammar as the segmented control.

### Target Stepper
The setup screen's one big figure. The target temperature at display scale (66% width, 800) sits between two 56px square step buttons (10px corners, 1.5px ring, bold 22px minus and plus icons, 97% press scale), with a compact °F/°C segmented control beside it. The figure is a live `output`, so each step is announced.

### Setup Summary
The cook as it will start, set like the forecast table: a 1.5px ink rule on top, 1px hairline under each row, label at 15px medium on the left, value right-aligned at the section size and 80% width, truncated if it runs long. From 900px it is a sticky aside with the full-width Start cook button and any session error (ink, warning icon) under it.

### Start Bar
The narrow-screen stand-in for the summary's button, so starting stays one tap away. Fixed above the tab bar on phones, table-stock with a hairline top edge, 12px by 20px padding: a truncated one-line recap (15px semibold, cut and target) beside the large primary button. A session error appears above the row in ink with a warning icon. Hidden from 900px.

### Navigation
- **Tabs:** Three, Cook / History / Settings (ThermometerSimple, ClockCounterClockwise, GearSix). Setup lives under Cook whenever no cook is running; the live screen takes over that tab once one starts. There is no separate Probes tab.
- **Style:** Table-stock surface with a hairline border on its inner edge. Each item is a 24px Phosphor icon over a 13px semibold label (caption size), at least 52px tall.
- **States:** Inactive items are slate-muted and turn ink on hover. The active item is ink, its icon switches to the fill weight, and a 3px by 32px band-colored marker sits on the top edge (phone) or left edge (rail).

### Screen Shell
Every signed-in screen except the live cook is wrapped in one shell (`src/components/tide/TideScreen.tsx`): the navigation, then the band with the screen title at 17px semibold and optional band content under it (such as a status line), then the screen's content. Setup ("Start a cook"), History and Settings all use it. The live cook screen builds its own band (`CookBand`) because it carries the overflow menu and the red pull takeover. A new signed-in screen uses the shell rather than its own header. The signed-out sign-in screen is exempt: it has no navigation to show, so it draws the band itself (see Sign-in).

### Sign-in
The signed-out entry (`src/components/login/LoginScreen.tsx`), inside the world rather than beside it.
- **Band:** The yellow band with the product name, "FireBoard Pitmaster", as the title at 17px semibold, respecting the top safe-area inset. No navigation and no menu.
- **Form column:** 400px wide, left-aligned in the 1200px container on the usual gutters.
- **Heading and lede:** "Sign in" at the section size (22px bold, 85% width), then a 15px muted lede on what keeps running while signed out.
- **Fields:** Two text fields 20px apart, Username (`autocomplete="username"`) and Password (`type="password"`, `autocomplete="current-password"`). Empty fields are caught before submit with ink field errors, and focus moves to the first invalid field.
- **Server error:** The reason in 15px semibold ink beside a bold 20px warning-circle icon, announced as an alert. No red, under the One Red Rule.
- **Button:** The large primary (56px, full column width, 17px bold, 98% press scale). While busy it reads "Signing in…", is disabled and drops to 50% opacity.

### Band
The yellow header. On the live screen it holds the cook name (action size, semibold, truncated) and the overflow menu; on every other screen it holds that screen's title at the same size, through the shell. Lost or stale data appears inside the band as a 15px semibold message with a Wi-Fi-off icon, so it reads in sun like the pull does. During the pull the band turns red and the pull alarm opens inside it.

### Pull Alarm
"Pull now" at alarm size, one sentence on carryover at the action size (17px regular, max 42ch), then the pull button and silence toggle. It enters with a clip-path reveal from the top (520ms, `cubic-bezier(0.16, 1, 0.3, 1)`) while the band color crossfades (420ms, same curve). Both are turned off under `prefers-reduced-motion`. This is the world's only motion moment.

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
The overflow menu is a 180px table-stock panel (12px radius, menu shadow) with 44px items. The end-cook dialog is a native `<dialog>` (14px radius, 24px padding, dialog shadow) with focus on "Keep cooking" by default and the destructive "End cook" as the primary button. Both buttons are at the action size (17px).

### History Table
Finished cooks as a printed table, newest first. It is a real `<table>` with a visually hidden caption.
- **Desktop (from 768px):** Columns Date / Cook / Duration / Target / Peak under a header row of 14px semibold labels and a 1.5px ink rule; duration, target and peak are right-aligned. Rows are 12px top and bottom with a 1px hairline under each. The date is 15px ink; the cook is its cut at the action size (17px semibold) over a 13px muted "kg · lb · cooker" line.
- **Phones:** The header is hidden and the body opens with the 1.5px ink rule. Each row reflows into a two-column grid: the date across the top (13px muted), then the cut and its detail line on the left with the duration on the right, then "Peak N° of T°" across the bottom with the peak note beside it.
- **Figures:** Duration, target and peak use the figure face (22px bold, 80% width, tabular) at every width.
- **Peak note:** 13px muted under the peak (desktop) or beside it (phones): "on target" within ±1 display degree, otherwise "N° over" or "N° short". Never colored.
- **No readings:** A cook with no readings shows a muted 15px "No readings" for duration and "None" for peak on desktop, and a muted "Target T°" in place of the peak line on phones.

### Screen States
Empty, loading and error are honest sentences in the content area, 40px from the band, no illustration.
- **Loading:** One 15px muted status line ("Loading past cooks…").
- **Error:** The message in 15px semibold ink beside a bold 20px warning-circle icon, then a secondary "Try again" button. No red.
- **Empty:** A section-size title (22px bold, 85% width), a 15px muted explanation capped at 52ch, then a secondary button to the next step ("Start a cook").

### Settings
A single column capped at 640px of hairline-separated sections (Temperature, Pull alarm sound, Account), each with a section-size heading. Choices are the segmented control in two columns with the legend visually hidden, followed by muted 14px helper text that says what the setting does. Account reads "Signed in as {username}" in 15px with the name bold, or "You're signed in." when no username is known, a muted 14px note if a cook is running, and a secondary Sign out button with its icon.

### Estimate Details
A native `<details>` disclosure behind a hairline rule: a 48px summary row with a caret that rotates when open, a short explanation (max 60ch), and label/value rows separated by hairlines.

## Do's and Don'ts

### Do:
- **Do** read every color from the `--tide-*` tokens on `.tide-world` so daylight, night and pull all work.
- **Do** set big numbers in Archivo condensed (66–80% width), heavy, with tabular figures.
- **Do** separate content with hairline rules (1px hairline-grey, 1.5px ink for a table's top rule) and space.
- **Do** put lost or stale data in the band, at band-level readability.
- **Do** show problems in ink: lost data in the band, form errors as semibold ink text with a bold warning icon and a 2.5px ink ring on the field, screen errors as semibold ink text with a warning icon and a secondary "Try again".
- **Do** wrap every new signed-in screen in the shell (navigation, band with title, content); only the live cook screen has its own band, and the signed-out sign-in screen draws the band with the product name and no navigation.
- **Do** mark a selection with an ink fill and ground-colored text (segmented options, preset chips).
- **Do** keep touch targets at least 44px, and primary actions 48–56px.
- **Do** use Phosphor icons (`@phosphor-icons/react`), regular weight, with fill for the active tab.
- **Do** honor `prefers-reduced-motion` for any transition.

### Don't:
- **Don't** use red for anything but the pull.
- **Don't** draw a range or confidence band around the projection. The model gives one path, so the chart shows one dashed line.
- **Don't** put content in cards or give surfaces shadows. Shadows are for the menu and dialog only.
- **Don't** add a second typeface. Width and weight carry the hierarchy.
- **Don't** add motion beyond the pull takeover and simple hover or press feedback.
