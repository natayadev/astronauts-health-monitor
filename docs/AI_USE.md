# Use of AI in Tesai

NASA Space Apps Challenge allows AI-generated content when its use is stated. This file is that record.

## The short version

- **No AI runs inside the product.** Every number, level, alert, check-in comparison and message in Tesai comes from deterministic JavaScript and fixed templates. The app makes no calls to any AI service.
- **AI helped build it.** Claude (Anthropic) was used for the visual design, the code, the research summaries and the documentation. ChatGPT (OpenAI), Gemini (Google) and Bob (IBM) were also used. All of it under the team's direction.
- **The decisions are the team's.** The choice of challenge, what to build and what to leave out, the evidence-labeling approach, the private-by-default check-in and the visual direction came from the team.
- **Prototype, not a medical device.** Nothing in Tesai diagnoses anyone.

## AI tools used to build the project

| Tool | What it was used for |
|---|---|
| Claude Design | The visual mockup of the health twin (layout, palette, components) that the app follows |
| Claude Code | Writing, refactoring, reviewing and testing the code (the move from a single file to ES modules, the alert lifecycle, the evidence system, the daily check-in) |
| Claude (chat and research) | Searching and summarizing NASA standards, NTRS reports and papers; auditing the cited numbers against their sources; drafting the README, the submission text and the human factors document |

The team used several Claude models (Fable, Opus and Sonnet), several ChatGPT models (OpenAI), several Gemini models (Google) and Bob (IBM).

## How the AI output was checked

- Every limit in `src/tesai/js/evidence.js` carries its source and a label saying whether it is taken from a source, adapted, or a team design value. Bibliographic details the team could not confirm against the original are flagged in the code (`unverified: true`) for review.
- Unit conversions (ppm to mmHg, mSv/day to µSv/h) were recomputed in code.
- The interface was run and checked in a browser after each change.

## What the AI did not do

- **No AI in the science or the alerts.** The rules engine (`src/tesai/js/rules.js`) and the check-in comparison (`src/tesai/js/checkin.js`) are plain, readable code.
- **No invented data presented as real.** All readings and the check-in history before today are synthetic and labeled.
- **No invented sources.** References were looked up; the ones whose details could not be confirmed are flagged in the code for review.
