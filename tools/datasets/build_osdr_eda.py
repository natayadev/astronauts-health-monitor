"""
Builds src/tesai/data/osdr-eda.json: real ISS cabin telemetry from the NASA OSDR Environmental Data App (EDA), in Tesai's format.

  python tools/datasets/build_osdr_eda.py

It calls the public EDA API (https://visualization.osdr.nasa.gov/eda/api/, documented at .../eda/api_reference):
  /missions/{mission}/telemetry_data/?start=...&end=...
and keeps the ISS values (temperature in C, relative humidity in %, CO2 in ppm, every 5 minutes) of one mission over three days.

What is NOT taken: radiation. The EDA gives the dose received by the experiment samples in mGy per day (absorbed dose), while
Tesai's radiation metric is dose equivalent in uSv per hour, so the two cannot be swapped without a quality factor. Oxygen and
cabin pressure are not in the EDA either. Those three stay null and the app shows "no data".
Source: NASA Open Science Data Repository (OSDR), U.S. Government work.
"""
import json, os, urllib.request
from datetime import datetime, timezone

MISSION = 'RR-9'
START, END = '2018-08-20T00:00:00Z', '2018-08-23T00:00:00Z'
API = 'https://visualization.osdr.nasa.gov/eda/api/missions/'
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'tesai', 'data', 'osdr-eda.json')


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'tesai-dataset-builder'})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode('utf-8'))


def build():
    url = f'{API}{MISSION}/telemetry_data/?start={START}&end={END}'
    rows = fetch(url)
    series = []
    for r in rows:
        if any(r.get(k) is None for k in ('temperature_iss', 'humidity_iss', 'co2_iss')):
            continue
        t = datetime.strptime(r['time'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
        series.append({'timestamp': t.strftime('%Y-%m-%dT%H:%M:%SZ'), 'source': 'real', 'co2': round(r['co2_iss']),
                       'oxygen': None, 'temp': round(r['temperature_iss'], 1), 'humidity': round(r['humidity_iss']),
                       'pressure': None, 'radiation': None})
    return {
        'meta': {
            'id': 'osdr-eda', 'name': 'NASA OSDR Environmental Data App: ISS cabin telemetry', 'kind': 'real', 'astronauts': False,
            'source': 'https://visualization.osdr.nasa.gov/eda/', 'api': url, 'mission': MISSION, 'window': [START, END],
            'license': 'U.S. Government work (NASA OSDR)', 'stepSeconds': 300,
            'note': f'ISS cabin temperature, humidity and CO2 recorded during the {MISSION} experiment (three days, every 5 minutes). No radiation, oxygen or pressure.',
        },
        'crew': [], 'vitals': [], 'sleepActivity': [], 'devices': [], 'environment': None, 'environmentSeries': series,
    }


if __name__ == '__main__':
    bundle = build()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(bundle, f, separators=(',', ':'), ensure_ascii=False)
    print(len(bundle['environmentSeries']), 'points,', round(os.path.getsize(OUT) / 1024), 'KB ->', os.path.normpath(OUT))
