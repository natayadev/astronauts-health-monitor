# Tesai · health twin for space crews

Made by **Team Higía** (Ezequiel Alfaro, Sebastian Garay, Nataya Flores, Mateo Capararo) for the **NASA Space Apps Challenge 2026**: *Create Health Monitoring Software for Astronauts on Space Missions*. Built with Claude (Claude Design for the visual design, Claude Code for the implementation). It is an independent prototype, not affiliated with NASA.

Web prototype for monitoring astronaut vital signs. It uses a "digital twin" look (mint + teal, glass surfaces, mono numbers) taken from the Claude Design mockup, with a traffic-light scale: **Normal / Attention / Alert flight surgeons**.

> **All data is simulated.** The About page and the startup notice say so; imported file or API data shows an "unverified" badge in the top bar.

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

### Sections (navigation: Overview, Biometrics, History, About; Alerts opens from the bell)

| Section | What it shows |
|---|---|
| Overview | Status strip and next step, twin with six connected vital signs, side detail panel, action bar, missions |
| Biometrics | Vital-sign cards with trend and reading quality, cabin environment (CO₂, oxygen, pressure, temperature, humidity, radiation), sleep and activity |
| Alerts (from the bell) | Alerts with a lifecycle and priority, sensors separate from health, simulated ground link |
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

Six cabin metrics are tracked with a trend, a reference range and a status: CO₂ (ppm), oxygen partial pressure (kPa), cabin pressure (kPa), temperature (°C), humidity (%) and radiation (µSv/h). The ranges come from public NASA material (see Evidence below); the red radiation limit is 54 µSv/h, the 1.3 mSv/day free-space galactic cosmic ray dose from NASA-STD-3001 Vol. 1. A real source can be added through `DataProvider.getEnvironment()`; `Adapters.adaptRestJson.issTelemetry` is a starting point for the public ISS Live feed (verify it is still active).

## Evidence and sources (APA 7)

Every number, goal and alert rule has a basis and sources:

| Basis | Meaning |
|---|---|
| Based on a source | The value follows a published one |
| Adapted from a source | Starts from a source, but Tesai changed it (the note says how) |
| Team design value | Chosen by the team; no published source was found |
| No real data source | Simulated data |

- A **"!" button** sits next to each metric in Biometrics (vital cards, cabin cards, goals, and the side panel), and next to the alert, ground link, sensor and baseline panels. It opens the basis, a short note and the APA 7 references.
- The **About** page lists the evidence by data point, the data provenance and the full alphabetical reference list. The Advanced thresholds table has a "Basis and sources" column.
- Sources live in `SOURCES` (APA 7 HTML) and `EVIDENCE` (basis, note and source ids per data point) in `index.html`. To add or fix a source, edit those two objects.
- Entries marked † have a title or date that could not be verified because the site blocked automated access. Numbers taken from sources were read with automatic extractors, so open the link and confirm a value before quoting it.
- Not backed by a published source: HRV limits, core-temperature limits, the outer heart-rate limits, the sleep goal, the hobby goal, battery levels, hydration, the personal-baseline deviation, escalation timing and the ground-link delay profile.

## Alerts (audit changes)

- One alert per condition, with a lifecycle: active → acknowledged or snoozed → resolved. It is not repeated while the condition lasts.
- Alerts are sorted by priority: P1 critical, P2 health and environment, P3 sensors, P4 reminders. Reminders do not open toasts.
- A critical alert that stays unacknowledged for a minute is escalated (flag, new announcement and a second simulated notice to Earth). Non-critical alerts can be snoozed for 15 minutes and wake up again if the condition is still there. Critical alerts cannot be snoozed.
- You see all of your own alerts (and cabin alerts). Alerts about your teammates appear only when they are critical (red); the crew menu also shows a teammate's status only when it is critical.
- Filters show a count per state.
- Noisy or delayed readings neither open nor close alerts.
- A critical alert stays pinned until it is acknowledged. Acknowledging earns no points.
- Health and sensors are shown separately. With missing metrics the status is "Partial data", not "Normal".
- Thresholds are read-only and are not saved in the browser. They are illustrative, with no clinical validation.
- The ground link is a simulation; nothing is actually transmitted.

## Accessibility and responsive

`prefers-reduced-motion` plus a switch to turn off decorative animations, visible focus, stable focus in lists, a drawer with managed focus, SVG icons, and status shown with an icon and text. Below 1000 px the twin moves to the top, the cards become a grid and the navigation moves to a bottom bar.

## Language (EN | ES)

The **EN | ES** button in the top bar switches the whole interface between English and Spanish. The choice is remembered in the browser. English is the source language; Spanish is applied at runtime by translating the rendered text with a dictionary (`ES_DICT` for exact texts and `ES_PATTERNS` for texts with numbers or names in them, in the I18N section of `index.html`). A text without an entry simply stays in English, so to fix or add a Spanish text, edit those two tables. Names, units and the official challenge title are intentionally not translated.

## Data values

Internal enum values (levels, reading quality, device status, event types) are English identifiers, for example `attention`, `surgeon`, `noisy`, `delayed`, `missing`, `tachycardia`. CSV and JSON imports must use the same values.

## Connect real data

See "HOW TO CONNECT REAL DATA" at the end of `index.html`. There is no public live physiological data for astronauts; the likely path is to combine aggregated public data with simulation, always labeling `source`.
