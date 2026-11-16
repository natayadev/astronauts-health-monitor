"""
Builds src/tesai/data/mmash.json, the real-data excerpt Tesai replays, from the PhysioNet MMASH dataset.

  python tools/datasets/build_mmash.py <folder with the DataPaper/ directory of MMASH>

Source: Rossi et al. (2020), "A public dataset of 24-h multi-levels psycho-physiological responses in young
healthy adults", Data 5(4), 91. PhysioNet: https://physionet.org/content/mmash/1.0.0/ (DOI 10.13026/cerq-fc86).
License: Open Database License (ODbL) 1.0. The excerpt is an adapted database: it keeps this attribution and the same license.

What it keeps: heart rate (Actigraph, 1 Hz, averaged per minute) and heart rate variability (RMSSD of the RR intervals in a
2-minute window) for 4 participants, plus their sleep and activity summary. MMASH does not measure SpO2, blood pressure,
temperature or breathing, so those stay empty (null): Tesai shows "no data" for them. Nothing is invented.
Derived by us: HRV as RMSSD; exercise minutes = minutes with a mean heart rate of 100 bpm or more.
"""
import csv, json, math, os, statistics, sys
from datetime import datetime, timezone

PICK = [12, 13, 19, 22]          # the four recordings with the fewest artifacts
STEP = 60                        # seconds per reading in the excerpt
HRV_WINDOW = 120                 # seconds of RR intervals behind each RMSSD
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'tesai', 'data', 'mmash.json')


def secs(day, hhmmss):
    h, m, s = (int(x) for x in hhmmss.split(':'))
    return (int(day) - 1) * 86400 + h * 3600 + m * 60 + s


def iso(t):
    # MMASH dates are anonymized (day 1 or 2), so the excerpt uses a neutral reference date
    return datetime.fromtimestamp(946684800 + t, tz=timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def rmssd(window):
    ibis = [x for x in window if 0.3 <= x <= 2.0]
    if len(ibis) < 30:
        return None
    d = [b - a for a, b in zip(ibis, ibis[1:]) if abs(b - a) < 0.2]
    if len(d) < 25:
        return None
    return math.sqrt(sum(x * x for x in d) / len(d)) * 1000


def build(root):
    crew, vitals, sleepact = [], [], []
    for n in PICK:
        base = os.path.join(root, f'user_{n}')
        info = next(csv.DictReader(open(os.path.join(base, 'user_info.csv'), encoding='utf-8')))
        act = list(csv.DictReader(open(os.path.join(base, 'Actigraph.csv'), encoding='utf-8')))
        rr = list(csv.DictReader(open(os.path.join(base, 'RR.csv'), encoding='utf-8')))
        slp = list(csv.DictReader(open(os.path.join(base, 'sleep.csv'), encoding='utf-8')))
        hr_by = {}
        steps = 0
        for r in act:
            t = secs(r['day'], r['time'])
            try:
                hr_by[t] = float(r['HR'])
            except ValueError:
                pass
            steps += int(float(r.get('Steps') or 0))
        ibi_t = [(secs(r['day'], r['time']), float(r['ibi_s'])) for r in rr if r['ibi_s']]
        t0, t1 = min(hr_by), max(hr_by)
        rows, k = [], 0
        for t in range(t0 - t0 % STEP + STEP, t1, STEP):
            hrs = [hr_by[x] for x in range(t - STEP, t) if x in hr_by]
            while k < len(ibi_t) and ibi_t[k][0] < t - HRV_WINDOW:
                k += 1
            window, j = [], k
            while j < len(ibi_t) and ibi_t[j][0] <= t:
                window.append(ibi_t[j][1]); j += 1
            hr = round(sum(hrs) / len(hrs)) if len(hrs) >= STEP // 2 else None
            hv = rmssd(window)
            quality = 'ok'
            if hr is None:
                quality = 'missing'
            elif not 30 <= hr <= 220:
                hr, quality = None, 'noisy'
            hrv = round(hv) if hv is not None and 10 <= hv <= 200 else None
            rows.append((t, hr, hrv, quality))
        hrs_all = sorted(r[1] for r in rows if r[1] is not None)
        hrv_all = [r[2] for r in rows if r[2] is not None]
        resting = hrs_all[len(hrs_all) // 2]          # median of the day: this person's typical heart rate
        cid = f'mmash-{n}'
        crew.append({
            'id': cid, 'name': f'Participant {n}', 'role': f"MMASH · healthy adult, {info['Age']} y", 'avatar': str(n),
            'baseline': {'hr': resting, 'spo2': None, 'bpSys': None, 'bpDia': None, 'temp': None, 'resp': None,
                         'hrv': round(statistics.median(hrv_all)) if hrv_all else None},
        })
        for t, hr, hrv, q in rows:
            vitals.append({'astronautId': cid, 'timestamp': iso(t), 'source': 'real', 'quality': q,
                           'hr': hr, 'spo2': None, 'bpSys': None, 'bpDia': None, 'temp': None, 'resp': None, 'hrv': hrv})
        tst = sum(float(r['Total Sleep Time (TST)']) for r in slp if r['Total Sleep Time (TST)'])
        inbed = sum(float(r['Total Minutes in Bed']) for r in slp if r['Total Minutes in Bed'])
        eff = round(sum(float(r['Efficiency']) * float(r['Total Minutes in Bed']) for r in slp) / inbed) if inbed else None
        exercise = sum(1 for r in rows if r[1] is not None and r[1] >= 100)
        sleepact.append({'astronautId': cid, 'day': iso(t0)[:10], 'source': 'real',
                         'sleepHours': round(tst / 60, 1), 'sleepQuality': eff, 'exerciseMin': exercise,
                         'hobbyMin': None, 'steps': steps})
    vitals.sort(key=lambda v: v['timestamp'])
    return {
        'meta': {
            'id': 'mmash', 'name': 'MMASH: Multilevel Monitoring of Activity and Sleep in Healthy people',
            'kind': 'real', 'astronauts': False,
            'source': 'https://physionet.org/content/mmash/1.0.0/', 'doi': '10.13026/cerq-fc86',
            'paper': 'Rossi, A., et al. (2020). A public dataset of 24-h multi-levels psycho-physiological responses in young healthy adults. Data, 5(4), 91.',
            'license': 'ODbL 1.0', 'stepSeconds': STEP,
            'note': 'Heart rate and heart rate variability only. 22 healthy adults, not astronauts; four recordings are used.',
        },
        'crew': crew, 'vitals': vitals, 'sleepActivity': sleepact, 'devices': [], 'environment': None,
    }


if __name__ == '__main__':
    root = sys.argv[1]
    if os.path.isdir(os.path.join(root, 'DataPaper')):
        root = os.path.join(root, 'DataPaper')
    bundle = build(root)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(bundle, f, separators=(',', ':'), ensure_ascii=False)
    print(len(bundle['vitals']), 'readings,', round(os.path.getsize(OUT) / 1024), 'KB ->', os.path.normpath(OUT))
