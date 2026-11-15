# Tesai · health twin for space crews

Made by **Team Higía** (Ezequiel Alfaro, Sebastian Garay, Nataya Flores, Mateo Capararo) for the **NASA Space Apps Challenge 2026**: *Create Health Monitoring Software for Astronauts on Space Missions*. Built with Claude (Claude Design for the visual design, Claude Code for the implementation). It is an independent prototype, not affiliated with NASA.

Web prototype for monitoring astronaut health. It uses a "digital twin" look (mint and teal, glass surfaces, mono numbers) taken from the Claude Design mockup, with a traffic-light scale: **Normal / Attention / Alert flight surgeons**, plus separate states for partial data, missing data and sensor problems.

> **All data is simulated.** The About page and the startup notice say so. Imported file or API data shows an "unverified" badge in the top bar.

## Run

There is no build step: plain HTML, CSS and native ES modules. ES modules need to be served over HTTP:

```bash
cd src
python -m http.server 8765
```

Open `http://localhost:8765/`. The fonts live in `assets/fonts/`, so it also works offline.

## Structure

```
src/
├─ index.html            # semantic HTML only (no inline styles or scripts)
├─ styles/               # tokens → base → layout → components/*.css
├─ js/
│  ├─ app.js             # entry point, main loop, alert processing
│  ├─ config.js          # schema, thresholds, levels, credits
│  ├─ rules.js           # readings → levels (knows nothing about the data source)
│  ├─ state.js           # runtime state, alert lifecycle, missions, points
│  ├─ checkin.js         # private daily check-in: items, local storage, own-history comparison
│  ├─ evidence.js        # SOURCES (APA) and EVIDENCE (basis of every number)
│  ├─ i18n.js            # Spanish dictionary applied at runtime
│  ├─ providers/         # simulated, file and remote data providers + normalizer
│  ├─ twin/              # astronaut: twin.js (component), figure/plate/spin/scan.js, overlays/ (one per metric), art.js (generated)
│  └─ ui/                # UI controller, check-in view, helpers, icons, toasts
└─ assets/fonts/         # Plus Jakarta Sans and JetBrains Mono (SIL OFL), local
```

The full module map, data flow and alert system are in [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

### Sections (navigation: Overview, Biometrics, Check-in, History, About; Alerts opens from the bell)

| Section | What it shows |
|---|---|
| Overview | Status strip and next step, twin with six connected vital signs, side detail panel, action bar, missions |
| Biometrics | Vital-sign cards with trend and reading quality, cabin environment (CO₂, oxygen, pressure, temperature, humidity, radiation), sleep and activity |
| Check-in | Private daily check-in: five 0–10 scales (sleep quality, mood, calm, mental sharpness, connection with the crew), optional tension and symptoms, "who sees this", a 14-day comparison with your own history, and symptoms shown next to recent cabin CO₂ |
| Alerts (from the bell) | Alerts with a lifecycle and priority, sensors separate from health, simulated ground link |
| History | Chart with traffic-light bands and baseline, signal quality, missions and streak |
| About | Team credits, the NASA challenge, how Claude was used, evidence by data point, references and notices |
| Advanced (hidden) | Data source, import/export, demo mode, appearance, thresholds (read-only), schema. Not in the navigation: open `#/advanced` |

## Astronaut twin

The figure in the middle of Overview is an isometric SVG drawing with live, data-driven overlays. It lives in `js/twin/` and is built like a component: `createTwin(root)` fills the `#twin` element with the plate, the figure, the 360° view and the scan sweep, and returns `update(props)`, `scan()` and `destroy()`. It never reads app state. `UI.syncTwin()` passes it `{ metrics, focus, pinned, motion }` on every render, and the 360° button passes `{ spin }`.

- **Parts.** `twin.js` puts the pieces together; `figure.js` draws the figure and runs the overlays; `plate.js` is the frame and its readout; `spin.js` turns the figure for the 360° view; `scan.js` runs the scan sweep. All of it is styled in `styles/components/twin.css`.

- **Overlays** are registered per metric in `js/twin/overlays/index.js`. Heart rate is the first: the console dial reads beats per minute, the lamp and the chest display follow each beat, and hovering or selecting the Heart rate card opens the chest port on the beating heart. With no trusted reading nothing beats.
- **The drawing** is static markup in `js/twin/art.js`, generated from the geometry in `../tools/twin/` (`stand.mjs`, `suit.mjs`, `overlays/heart.mjs`). The app still has no build step: `art.js` is committed. Regenerate it only when the drawing or the heart-rate limits in `config.js` change:

```bash
node tools/twin/build.mjs            # write src/js/twin/art.js (run from the repo root; tested on Node 22)
node tools/twin/build.mjs --audit    # also check contacts, clearances and paint order
```

## Daily check-in

- **Private by default.** Answers are saved only in this browser (`localStorage`, key `tesai.checkin.v1`). Other crew members never see them, there are no group averages, and nothing is transmitted. The "share with the crew medical officer" switch is a concept only.
- **Not a clinical instrument.** The questions are the team's own. Every scale runs 0 (worst) to 10 (best), with labeled ends and a stated time period ("last night", "right now", "last 24 hours").
- **Compared only with yourself.** An item is marked "Lower than your usual for 3 days" when there are at least 5 earlier answers and the last 3 days are all 2 or more points below the usual. This rule is a team design value.
- **Never raises alerts and never earns points.** Rewarding a self-reported value invites inflating it.
- **Simulated history.** The 13 days before today are simulated and labeled, so the comparison has something to show in the demo. What you answer today replaces the simulated value for today.
- The design rationale is in [`../docs/psicologia-social.md`](../docs/psicologia-social.md).

## Theme

All color lives in CSS variables in `styles/tokens.css` (base palette, traffic light, surfaces, gradients, shadows, charts, typography, radii). There are no literal colors outside that file; derived colors use `color-mix` on the palette.

Alert levels also show a colored dot next to the level text, so status never relies on color alone.

## Cabin environment

Six cabin metrics are tracked with a trend, a reference range and a status: CO₂ (ppm), oxygen partial pressure (kPa), cabin pressure (kPa), temperature (°C), humidity (%) and radiation (µSv/h). The ranges come from public NASA material (see Evidence below).

Two known simplifications, also stated in each "!" note:
- **CO₂** is checked reading by reading, while NASA-STD-3001 sets the 3 mmHg limit as a 1-hour average.
- **Radiation**: the red line (54 µSv/h) is NASA's 1.3 mSv/day design limit divided by 24. The demo scenario is ISS-like. A Mars transit (about 77 µSv/h measured by Curiosity) would need cumulative dose against the 600 mSv career limit instead.

## Evidence and sources

Every number, goal and alert rule has a basis and sources:

| Basis | Meaning |
|---|---|
| Based on a source | The value follows a published one |
| Adapted from a source | Starts from a source, but Tesai changed it (the note says how) |
| Team design value | Chosen by the team; no published source was found |
| No real data source | Simulated data |

- A **"!" button** sits next to each metric, goal, check-in panel and alert rule. It opens the basis, a short note and the references in APA format.
- The **About** page lists the evidence by data point, the data provenance and the full reference list.
- Sources live in `js/evidence.js` (`SOURCES` and `EVIDENCE`). To add or fix a source, edit those two objects.
- Entries marked † have a title or date that could not be confirmed against the original. Confirm a value in the original source before quoting it elsewhere.
- Not backed by a published source: HRV limits, core-temperature limits, the outer heart-rate limits, the sleep goal, the hobby goal, battery levels, hydration, the personal-baseline deviation, escalation timing, the ground-link delay profile and the check-in comparison rule.

## Alerts

- One alert per condition, with a lifecycle: active → acknowledged or snoozed → resolved.
- Priorities: P1 critical, P2 health and environment, P3 sensors, P4 reminders. Reminders do not open toasts.
- A critical alert that stays unacknowledged for a minute is escalated (simulated notice to Earth). Non-critical alerts can be snoozed for 15 minutes.
- You see all of your own alerts and the cabin alerts. A teammate's alerts appear only when they are critical.
- Noisy or delayed readings neither open nor close alerts. With missing metrics the status is "Partial data", not "Normal".
- Acknowledging an alert earns no points.
- Thresholds are read-only and illustrative, with no clinical validation.

## Accessibility and responsive

`prefers-reduced-motion` plus a switch to turn off decorative animations, visible focus, a drawer with managed focus, SVG icons, and status shown with an icon and text. The check-in uses native radio buttons and checkboxes, so it works with the keyboard and screen readers.

## Language (EN | ES)

The **EN | ES** button switches the interface between English and Spanish. English is the source language. Spanish is applied at runtime from `ES_DICT` (exact texts) and `ES_PATTERNS` (texts with numbers or names) in `js/i18n.js`. A text without an entry stays in English. Evidence notes and references are not translated.

## Data values

Internal enum values (levels, reading quality, device status, event types) are English identifiers, for example `attention`, `surgeon`, `noisy`, `delayed`, `missing`, `tachycardia`. CSV and JSON imports must use the same values.

## Connect real data

Implement a provider with the `DataProvider` interface (`js/providers/base.js`). `js/providers/remote.js` is a skeleton with timeout, retries and cache, and `js/providers/adapters.js` normalizes external formats to the schema in `js/config.js`. There is no public live physiological data for astronauts; the likely path is to combine aggregated public data with simulation, always labeling `source`.
