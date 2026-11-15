# Tesai · health twin for space crews

Made by **Team Higía** (Ezequiel Alfaro, Sebastian Garay, Nataya Flores, Mateo Capararo) for the **NASA Space Apps Challenge 2026**: *Create Health Monitoring Software for Astronauts on Space Missions*. Built with Claude (Claude Design for the visual design, Claude Code for the implementation). It is an independent prototype, not affiliated with NASA.

Web prototype for monitoring astronaut vital signs. It uses a "digital twin" look (mint + teal, glass surfaces, mono numbers) taken from the Claude Design mockup, with a traffic-light scale: **Normal / Attention / Alert flight surgeons**.

> **All data is simulated.** The "SIMULATED DATA" badge is always visible. Imported data is labeled "unverified".

## Run

It is a single `index.html` with no build step. Serving it over HTTP works best:

```bash
cd src
python -m http.server 8765
```

Open `http://localhost:8765/`. The fonts live in `assets/fonts/`, so it also works offline.

## Structure

```
src/
├─ index.html        # the whole app: CSS tokens, HTML, schema, config, providers, rules, state and UI
├─ assets/fonts/     # Plus Jakarta Sans and JetBrains Mono (SIL OFL), local
└─ README.md
```

### Sections (navigation: 4 + About)

| Section | What it shows |
|---|---|
| Overview | Status strip and next step, twin with six connected vital signs, side detail panel, action bar, missions |
| Biometrics | Vital-sign cards with trend and reading quality, cabin environment (CO₂, oxygen, pressure, temperature, humidity, radiation), sleep and activity |
| Diagnostics | Alerts with a lifecycle, sensors separate from health, simulated ground link |
| History | Chart with traffic-light bands and baseline, signal quality, missions and streak |
| About | Team credits, the NASA challenge, how Claude was used, sources for the cabin ranges and notices |
| Advanced (hidden) | Data source, import/export, demo mode, appearance, thresholds (read-only), schema. Not in the navigation: open `#/advanced` |

### Layers inside `index.html`

| Layer | Contents |
|---|---|
| (a) `SCHEMA` + `CONFIG` | Documented schema and centralized configuration (thresholds, simulated link, empty API keys) |
| (b) Providers | `DataProvider` (contract), `SimulatedProvider`, `RemoteProvider` (skeleton), `FileProvider`, adapters and normalizer |
| (c) `RulesEngine` | Readings → `normal` / `attention` / `surgeon` / `partial` / `nodata`. It does not know where the data comes from |
| (d) State | Alert lifecycle, ground link, missions, points, streak |
| (e) UI | Twin, cards, drawer, views, SVG charts, toasts |

## Theme

All color lives in CSS variables in the `:root` block (base palette, traffic light, surfaces, gradients, shadows, charts, typography, radii). There are no literal colors outside that block; derived colors use `color-mix` on the palette. To re-theme, change those variables (for example `--teal`, `--deep`, `--aqua`, `--bg`).

Alert levels also show a colored dot (green, amber, red, slate for sensors/reminders, gray for partial or no data) next to the level text, so status never relies on color alone.

## Cabin environment

Six cabin metrics are tracked with a trend, a reference range and a status: CO₂ (ppm), oxygen partial pressure (kPa), cabin pressure (kPa), temperature (°C), humidity (%) and radiation (µSv/h). The ranges come from public NASA material (ISS cabin design range around 101.3 kPa, ppO₂ 19.5–23.1 kPa, CO₂ operating target below 3 mmHg, temperature and humidity operating limits, and a typical ISS dose of 0.2–0.5 mSv per day). They are illustrative until checked against the current NASA-STD-3001 and JSC 20584 documents; the sources are listed in About. A real source can be added through `DataProvider.getEnvironment()`; `Adapters.adaptRestJson.issTelemetry` is a starting point for the public ISS Live feed (verify it is still active).

## Alerts (audit changes)

- One alert per condition, with a lifecycle: active → acknowledged or snoozed → resolved. It is not repeated while the condition lasts.
- Alerts are sorted by priority: P1 critical, P2 health and environment, P3 sensors, P4 reminders. Reminders do not open toasts.
- A critical alert that stays unacknowledged for a minute is escalated (flag, new announcement and a second simulated notice to Earth). Non-critical alerts can be snoozed for 15 minutes and wake up again if the condition is still there. Critical alerts cannot be snoozed.
- Filters show a count per state and can be limited to the selected crew member.
- Noisy or delayed readings neither open nor close alerts.
- A critical alert stays pinned until it is acknowledged. Acknowledging earns no points.
- Health and sensors are shown separately. With missing metrics the status is "Partial data", not "Normal".
- Thresholds are read-only and are not saved in the browser. They are illustrative, with no clinical validation.
- The ground link is a simulation; nothing is actually transmitted.

## Accessibility and responsive

`prefers-reduced-motion` plus a switch to turn off decorative animations, visible focus, stable focus in lists, a drawer with managed focus, SVG icons, and status shown with an icon and text. Below 1000 px the twin moves to the top, the cards become a grid and the navigation moves to a bottom bar.

## Data values

Internal enum values (levels, reading quality, device status, event types) are English identifiers, for example `attention`, `surgeon`, `noisy`, `delayed`, `missing`, `tachycardia`. CSV and JSON imports must use the same values.

## Connect real data

See "HOW TO CONNECT REAL DATA" at the end of `index.html`. There is no public live physiological data for astronauts; the likely path is to combine aggregated public data with simulation, always labeling `source`.
