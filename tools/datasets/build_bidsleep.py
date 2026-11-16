"""
Builds src/tesai/data/bidsleep.json, a SMALL sample of the PhysioNet BIDSleep dataset, in Tesai's bundle format.

  python tools/datasets/build_bidsleep.py <folder with BidslabNN/hr.csv and BidslabNN/labels.mat>

Source: Song, T.-A., Zhang, Y., Zhou, Z., & Dutta, J. A multi-night instantaneous heart rate and accelerometry dataset with
EEG sleep stage labels (version 1.0.1). PhysioNet, https://physionet.org/content/bidsleep-dataset/1.0.1/ (DOI 10.13026/rees-1092).
License: Open Data Commons Attribution License v1.0.

The full dataset is 27.9 GB (47 adults, 253 nights). This sample takes ONE night of TWO participants and only the heart rate
file and the sleep-stage labels (about 250 KB downloaded). It does not use the accelerometer files (99 MB per night).
What it keeps: Apple Watch heart rate averaged per minute, and sleep hours / sleep efficiency from the expert-corrected
EEG labels. BIDSleep has no heart rate variability, SpO2, blood pressure, temperature or breathing: those stay null.
Derived by us: sleep hours = 30-second epochs scored as any sleep stage; sleep quality = sleep efficiency (sleep epochs / all epochs).
"""
import csv, json, os, sys
from datetime import datetime, timezone
from scipy.io import loadmat

PICK = [(0, 1), (10, 1)]         # (participant, night)
STEP = 60                        # seconds per reading
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'tesai', 'data', 'bidsleep.json')


def iso(t):
    return datetime.fromtimestamp(946684800 + t, tz=timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def build(root):
    crew, vitals, sleepact = [], [], []
    for n, night in PICK:
        base = os.path.join(root, f'Bidslab{n:02d}')
        rows = [(float(a), float(b)) for a, b in csv.reader(open(os.path.join(base, 'hr.csv'), encoding='utf-8'))]
        lab = loadmat(os.path.join(base, 'labels.mat'))
        stages = [int(x) for x in lab['expert_label'].ravel()]
        start = datetime.strptime(str(lab['recStart'].ravel()[0]).strip(), '%Y-%m-%d %H:%M:%S')
        t_day = start.hour * 3600 + start.minute * 60 + start.second   # keep the time of day of the night
        t0 = rows[0][0]
        bins = {}
        for ts, hr in rows:
            if 30 <= hr <= 220:
                bins.setdefault(int((ts - t0) // STEP), []).append(hr)
        cid = f'bids-{n:02d}'
        vals = sorted(round(sum(v) / len(v)) for v in bins.values())
        crew.append({'id': cid, 'name': f'Participant B{n:02d}', 'role': 'BIDSleep · healthy adult, one night', 'avatar': f'{n:02d}',
                     'baseline': {'hr': vals[len(vals) // 2], 'spo2': None, 'bpSys': None, 'bpDia': None, 'temp': None, 'resp': None, 'hrv': None}})
        last = max(bins)
        for k in range(last + 1):
            v = bins.get(k)
            vitals.append({'astronautId': cid, 'timestamp': iso(t_day + k * STEP), 'source': 'real', 'quality': 'ok' if v else 'missing',
                           'hr': round(sum(v) / len(v)) if v else None, 'spo2': None, 'bpSys': None, 'bpDia': None, 'temp': None,
                           'resp': None, 'hrv': None})
        asleep = sum(1 for s in stages if s > 0)
        sleepact.append({'astronautId': cid, 'day': iso(t_day)[:10], 'source': 'real', 'sleepHours': round(asleep * 30 / 3600, 1),
                         'sleepQuality': round(100 * asleep / len(stages)), 'exerciseMin': None, 'hobbyMin': None, 'steps': None})
    vitals.sort(key=lambda v: v['timestamp'])
    return {
        'meta': {
            'id': 'bidsleep', 'name': 'BIDSleep: multi-night heart rate and accelerometry dataset with EEG sleep stage labels',
            'kind': 'real', 'astronauts': False, 'sample': True,
            'source': 'https://physionet.org/content/bidsleep-dataset/1.0.1/', 'doi': '10.13026/rees-1092',
            'license': 'ODC-By 1.0', 'stepSeconds': STEP,
            'note': 'A small sample: one night of two participants, heart rate and sleep only. Healthy adults, not astronauts.',
        },
        'crew': crew, 'vitals': vitals, 'sleepActivity': sleepact, 'devices': [], 'environment': None,
    }


if __name__ == '__main__':
    bundle = build(sys.argv[1])
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(bundle, f, separators=(',', ':'), ensure_ascii=False)
    print(len(bundle['vitals']), 'readings,', round(os.path.getsize(OUT) / 1024), 'KB ->', os.path.normpath(OUT))
