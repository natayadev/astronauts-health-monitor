# Research summary · what Tesai's numbers rest on

A short English summary of the team's research for the judges. The full basis of every number is in the app (the "!" buttons and the About page) and in `src/js/evidence.js`. The human factors rationale, in Spanish with an English summary, is in [`psicologia-social.md`](psicologia-social.md).

## What is backed by a NASA standard

| Item | Value | Source | How Tesai uses it |
|---|---|---|---|
| Cabin CO₂ | 3 mmHg as a 1-hour average | NASA-STD-3001 Vol. 2 [V2 6004] | Attention above ≈ 3,950 ppm (3 mmHg at sea-level pressure). Simplification: Tesai checks each reading, not the 1-hour average |
| CO₂ symptoms | Reported in ISS crews from about 2.3 mmHg | Law & Alexander 2016; OCHMO-TB-004 | Shown next to self-reported headache or stuffy nose in the check-in, without claiming cause |
| Career radiation dose | Under 600 mSv effective dose | NASA-STD-3001 Vol. 1 [V1 4030] | Shown as context |
| Galactic cosmic rays | Under 1.3 mSv/day in free space (design limit) | NASA-STD-3001 Vol. 1 [V1 4033] | Red line at 54 µSv/h (1.3 ÷ 24). Illustrative: a design limit is not an alarm for a single reading |
| Temperature and humidity | Performance zone 20–25 °C and 30–60 %; operating limit 18–27 °C and 25–75 % | NASA-STD-3001 Vol. 2 [V2 6012] | Shown as separate ranges, a simplification of a coupled limit |
| Privacy | Medical and psychological communications are private | NASA-STD-3001 Vol. 1, section 6 | Check-in answers stay on the device |

## What is adapted or a team design value

- **Vital-sign ranges** (heart rate, SpO₂, blood pressure, respiration) start from Earth adult references (MedlinePlus, StatPearls, American Heart Association) and are not validated in flight. Core temperature and HRV limits have no published astronaut threshold.
- **Personal baseline deviation (25 %)**, alert persistence, escalation timing and the check-in comparison rule are team design values.
- **Goals** (sleep 7 h, exercise 60 min, free time 30 min) are design values. For reference, NASA schedules an 8.5-hour sleep period, and ISS astronauts slept about 6 hours a night (Barger et al., 2014).

## What we did not find

- **No public, individual, daily in-flight vital-sign data.** It exists in NASA repositories but is restricted and available on request. All Tesai readings are simulated.
- **No validated daily psychosocial instrument with public access.** The check-in questions are our own. In flight, NASA's Reaction Self-Test ran about every four days, with about 79 % of sessions completed (Jones et al., 2022), and the Standard Measures questionnaires are monthly.
- **No validated alert design for crews with communication delay.** NASA reviews report large research gaps.

## Mars versus the demo scenario

The demo uses ISS-like cabin values and a short simulated ground delay. On the way to Mars, a message can take up to about 20 minutes each way, and the measured radiation rate in transit (about 1.84 mSv/day, roughly 77 µSv/h, Curiosity) would sit above Tesai's red line all the time. A Mars version should show cumulative dose against the 600 mSv career limit, with the expected rate for each mission phase.
