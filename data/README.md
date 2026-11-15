# Data and sources · Datos y fuentes

**Tesai does not ingest any dataset.** Every reading in the app (vital signs, cabin environment, sleep, activity, devices and the check-in history before today) is synthetic, generated in the browser by `src/tesai/js/providers/simulated.js` and `src/tesai/js/checkin.js` with a fixed seed, and labeled as simulated on screen. No real personal or health data is committed or collected.

The team found no public dataset of daily, individual, in-flight astronaut vital signs. Individual astronaut medical data exists in NASA repositories, but it is restricted and available only on request, with consent and an attributability review. Aggregated results are published in papers.

What the app does use from real sources are **limits, ranges and design decisions**, each cited in `src/tesai/js/evidence.js` and shown with the "!" button in the app.

## Sources used for limits and design

| Source | Type | Used for | Link | Terms | Accessed |
|---|---|---|---|---|---|
| NASA-STD-3001 Vol. 1 Rev C (crew health) | NASA standard | 600 mSv career limit, 1.3 mSv/day galactic cosmic ray design limit, sleep period | https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf | U.S. Government work | Nov 2026 |
| NASA-STD-3001 Vol. 2, section 6 (environments) | NASA standard | CO₂ 3 mmHg as a 1-hour average, temperature and humidity zones | https://www.nasa.gov/reference/6-0-natural-and-induced-environments-vol-2 | U.S. Government work | Nov 2026 |
| NASA-STD-3001 Vol. 1, section 6 (medical operations) | NASA standard | Privacy of medical and psychological communications (check-in) | https://www.nasa.gov/reference/6-0-medical-operations/ | U.S. Government work | Nov 2026 |
| OCHMO technical briefs (CO₂, ECLSS, habitable atmosphere) | NASA briefs | Context for cabin limits and CO₂ symptoms | See `src/tesai/js/evidence.js` | U.S. Government work | Nov 2026 |
| NASA Human Research Program risk and hazard pages, ARCHeR | NASA web pages | Context for vitals, fitness, sleep, behavioral health, distance from Earth | See `src/tesai/js/evidence.js` | U.S. Government work | Nov 2026 |
| NASA NTRS reports (CO₂ on the ISS, CDSS ConOps, EIMO ConOps, CHP-IDSP, ISS atmosphere) | NASA technical reports | CO₂ symptom range, delay-tolerant design, data flow | See `src/tesai/js/evidence.js` | U.S. Government work | Nov 2026 |
| Canadian Space Agency: radiation monitoring article, Bio-Monitor | CSA web pages | Radiation context, sensor and signal-quality model | See `src/tesai/js/evidence.js` | CSA terms of use | Nov 2026 |
| Carré Technologies: Astroskin technical sheet | Manufacturer document | Sensor channels and signal quality | See `src/tesai/js/evidence.js` | Manufacturer terms | Nov 2026 |
| Peer-reviewed studies (Barger 2014, Basner 2014, Jones 2022, Norsk 2015, Stahn 2017, Van Dongen 2003, and others) | Papers | Sleep, mood, stress, blood pressure, core temperature, self-perception | See `src/tesai/js/evidence.js` | Publisher terms; cited, not copied | Nov 2026 |
| Institute of Medicine (2001), *Safe Passage* | Report | Under-reporting of symptoms by astronauts (check-in privacy) | https://doi.org/10.17226/10218 | National Academies terms; cited, not copied | Nov 2026 |
| MedlinePlus, StatPearls, American Heart Association | Clinical references | Earth adult reference ranges for vital signs | See `src/tesai/js/evidence.js` | Publisher terms | Nov 2026 |

## Real data sources to explore (not used)

Listed in the app's About page: NASA OSDR (Inspiration4 datasets, environmental data), PhysioNet (MMASH, BIDSleep; not astronauts), SOMA, data.nasa.gov and NASA APIs.

## Third-party assets

- Fonts: Plus Jakarta Sans and JetBrains Mono, SIL Open Font License 1.1, served locally from `src/assets/fonts/`.
- No NASA logos, flags or mission identifiers are used.

## Rules

- Every source is listed here or in `src/tesai/js/evidence.js`, with its link.
- Synthetic data is never presented as real. Imported files are labeled "unverified data".
- No real personal or health data is committed.
- Large third-party downloads are not versioned; they are cited by link (see `.gitignore`).
