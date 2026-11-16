# Dataset converters

Each script turns a published dataset into the bundle Tesai replays (`crew`, `vitals`, `sleepActivity`, `devices`, `environment`) and writes it to `src/tesai/data/`.

| Script | Dataset | Output |
|---|---|---|
| `build_mmash.py` | PhysioNet MMASH (download `MMASH.zip` from https://physionet.org/content/mmash/1.0.0/ and unzip it) | `src/tesai/data/mmash.json` |
| `build_bidsleep.py` | A small sample of PhysioNet BIDSleep: `hr.csv` and `labels.mat` of one night of two participants (the 99 MB motion files are not needed) | `src/tesai/data/bidsleep.json` |
| `build_osdr_eda.py` | NASA OSDR Environmental Data App API (ISS cabin telemetry); it downloads by itself | `src/tesai/data/osdr-eda.json` |

```bash
python tools/datasets/build_mmash.py <folder that contains DataPaper/>
python tools/datasets/build_bidsleep.py <folder with Bidslab00/ and Bidslab10/>
python tools/datasets/build_osdr_eda.py
```

Rules for every converter: keep the source, license and attribution in `meta`; leave what the dataset did not measure as `null` (never fill it with a simulated value); say what was derived.
