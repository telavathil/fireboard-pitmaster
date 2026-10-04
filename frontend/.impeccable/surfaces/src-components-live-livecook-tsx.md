---
version: 1
slug: "src-components-live-livecook-tsx"
primary_target: "src/components/live/LiveCook.tsx"
related_targets: ["src/app/page.tsx"]
---

# Live cook screen

Mode: Operate. Scope: one live screen for every in-cook stage (stabilizing, cooking, stall, pull, rest), replacing Phase2-6. Setup, History, Settings untouched for now.

Audience/job: the owner on a phone at the grill, glancing from a few feet, sun or night, over 8-14 h. Read core vs pull in a second; never miss the pull.

Truth limits: `eta_seconds` is time to the doneness target, not to pull; confidence is binary (estimate / none); no ± range exists, so none is printed. Pull is a temperature trigger. No placeholder values.

## Direction contract

THESIS: The cook is a tide forecast: one curve over clock time with the next event printed as a time, refusing the thermometer-app ring gauge and stat-tile grid.
OWN-WORLD: Almanac-yellow header band, cool white table stock, navy ink, tide-blue projection, red only for the pull (the band itself turns red). Condensed grotesk (Archivo, width axis) with tabular figures; hairline rules, no cards, no shadows. Night: navy ground, amber figures.
STORY: Where the meat is, when it will be ready, whether to act. Stage line lights only the current stage. Model detail opens on demand.
FIRST VIEWPORT: Phone: band (app, cook, menu) / core temp at specimen size beside pull target / stage line / tide chart full width (past solid, projection dashed with no range band, temperature scale, now hairline, pull line red) / tide-table rows (event, time large right) / pit / tab bar. Data age sits in the readout note; lost or stale data is a band-level message. Desktop: side rail; figure + table left, larger chart right.
FORM: Farmer's almanac and tide tables, candidate 7 of 7, seed fbe99849. Code-led (image generation unavailable).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Reference: .impeccable/mocks/decision/compare.html (critique reference, not approved comp).
Open: exact night palette; touch scrubbing of chart. Push notifications: separate backend task.
