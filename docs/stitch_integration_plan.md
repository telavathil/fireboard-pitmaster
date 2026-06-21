# Plan: Stitch Design Integration & Cook Phase Journey

This document outlines the roadmap to align the FireBoard Pitmaster dashboard UI with the high-fidelity designs from your Google Stitch project workspace. It details how the UI will adapt dynamically to the 5 physical phases of a barbecue cook.

---

## 1. Objectives
* Connect to your **Stitch** project via the local MCP server to retrieve screen designs, SVG components, and layout tokens.
* Re-style the [page.tsx](file:///Users/tobinelavathil/dev/fireboard-pitmaster/frontend/src/app/page.tsx) and [globals.css](file:///Users/tobinelavathil/dev/fireboard-pitmaster/frontend/src/app/globals.css) files to use your custom design theme (color tokens, borders, and Outfit/Inter typography).
* Upgrade the dashboard state router to transition dynamically through the **5 Physical Cook Phases**.

---

## 2. Dynamic Cook Phases Specification

We will implement a state-driven layout that monitors the live telemetry stream (`pit_tasks.py` $\rightarrow$ Server-Sent Events) and adjusts the web app layout:

| Phase | Triggers (Telemetry) | UI Layout Modifications |
| :--- | :--- | :--- |
| **1. Pre-Cook Setup** | `!activeSession` | Renders the calibration form with illustrative line-art cards for meat and cooker configurations. |
| **2. Warmup & Calibration** | `activeSession` active AND `telemetry.confidence === "low"` (first 10-15 mins) | Replaces the countdown timer with a pulsing circular calibration ring and a "Stabilizing" status pill. |
| **3. Evaporative Stall** | `telemetry.stall_detected === true` | Renders a "Stall Active" banner and a live **Moisture Budget Progress Bar** ($t_{\text{stall}}$). |
| **4. Pull Alert** | `currentCore >= (currentTarget - telemetry.carryover_rise)` | Displays a high-contrast, large-format alert panel with pulling instructions and a carryover thermometer gauge. |
| **5. Resting** | User triggers resting OR `currentCore` begins dropping after removal | Displays a resting stopwatch count-up timer, peak temperature tracking, and an animatable SVG showing core heat equalization. |

---

## 3. Step-by-Step Execution Plan

### Step 1: Design Extraction (Stitch MCP)
1. Query the `stitch` MCP server to list all screens in your design project.
2. Fetch the design tokens (colors, padding, shadow boundaries) and specific component layouts.
3. Save the styling tokens as variables inside [globals.css](file:///Users/tobinelavathil/dev/fireboard-pitmaster/frontend/src/app/globals.css).

### Step 2: Implement the Setup & Calibration Screen
1. Replace standard selectors in the "Start New Cook" layout with clean clickable cards for Beef, Pork, Poultry, and Fish.
2. Inject vector illustration instructions showing how to measure core thickness.

### Step 3: Implement the Warmup / Calibration State
1. Update the central circular SVG gauge to display a pulsing calibration state when the Kalman filter is warming up.
2. Show a skeleton shimmer view for the ETA and carryover predictions in the sidebar.

### Step 4: Implement the Stall Phase Layout
1. Bind the "Stall Active" status card to `telemetry.stall_detected`.
2. Compute the moisture budget depletion locally in React, decrementing it at each tick while the stall is active.
3. Apply styled overlay zones on the temperature history chart to highlight the stall.

### Step 5: Implement the Pull Alert Overlay
1. Code a full-screen alert overlay that displays the pull temperature in large numbers ($80\text{px}$ Outfit font) when the removal threshold is reached.
2. Render a carryover temperature rise thermometer indicating how the meat will equalize during the rest.

### Step 6: Implement the Resting Dashboard
1. Create the resting dashboard layout, replacing active cook widgets with a resting count-up timer.
2. Build an SVG visualizer that animates color gradients to show heat diffusing from outer borders into the core.

### Step 7: Automated Visual Verification
1. Run the headless Chrome debugger scripts to capture snapshots of each page layout state (Setup, Calibration, Stall, Pull, and Rest).
2. Save these screenshots in the artifacts folder for pixel-perfect quality verification.
