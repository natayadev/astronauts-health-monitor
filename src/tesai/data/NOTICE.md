# Real data in this folder

`mmash.json` is an adapted excerpt of **MMASH: Multilevel Monitoring of Activity and Sleep in Healthy people**
(PhysioNet, version 1.0.0, DOI 10.13026/cerq-fc86, https://physionet.org/content/mmash/1.0.0/), published under the
**Open Database License (ODbL) 1.0**. Source paper: Rossi et al. (2020), *A public dataset of 24-h multi-levels
psycho-physiological responses in young healthy adults*, Data 5(4), 91.

What was changed (script: `tools/datasets/build_mmash.py`):

- Four of the 22 recordings (participants 12, 13, 19 and 22).
- Heart rate: the 1 Hz Actigraph values averaged per minute. Heart rate variability: RMSSD of the RR intervals in the
  two minutes before each point. Sleep: total sleep time and efficiency from the sleep file. Exercise minutes: minutes
  with a mean heart rate of 100 bpm or more (our own derivation). Steps: the Actigraph total.
- The original dates are anonymized (day 1 and 2), so the excerpt uses a neutral reference date.
- Nothing was added: SpO2, blood pressure, temperature and breathing are `null` because MMASH did not measure them.

As an adapted database, this excerpt keeps the same license (ODbL 1.0) and this attribution.
The people in the recordings are healthy young adults, **not astronauts**.


## bidsleep.json: a small sample of BIDSleep

One night of two participants (Bidslab00 and Bidslab10, night 1) from **BIDSleep** (Song, Zhang, Zhou and Dutta; PhysioNet, version 1.0.1,
DOI 10.13026/rees-1092, https://physionet.org/content/bidsleep-dataset/1.0.1/), under the **Open Data Commons Attribution License v1.0**.
Only the Apple Watch heart rate (averaged per minute) and the expert-corrected EEG sleep stages (sleep hours and sleep efficiency) were used;
the accelerometer files were not. The full dataset has 47 adults and 253 nights. These are healthy adults, **not astronauts**.

## osdr-eda.json: ISS cabin telemetry

Cabin temperature, relative humidity and CO2 recorded on the ISS during the RR-9 experiment (2018-08-20 to 2018-08-23, every 5 minutes), from the
**NASA Open Science Data Repository, Environmental Data App** (https://visualization.osdr.nasa.gov/eda/, public API). NASA work, no copyright claimed.
Radiation is not included (the EDA reports absorbed dose in mGy/day for the samples, not dose equivalent).
