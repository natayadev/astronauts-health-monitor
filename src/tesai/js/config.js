/**
 * config.js · SCHEMA, CONFIG, METRICS, LEVELS, CREDITS, ENV_META, SOURCE_LABEL
 * Single source of truth for data contracts and centralized configuration.
 * No API keys live in the browser: a real data source goes through a server-side proxy
 * that holds the keys (see providers/remote.js).
 */

export const SCHEMA = {
  Astronaut: {
    id: 'string (unique)', name: 'string', role: 'string', avatar: 'string (2 letters)',
    baseline: 'object {hr, spo2, bpSys, bpDia, temp, resp, hrv} with the typical resting values of THAT person'
  },
  VitalReading: {
    astronautId: 'string', timestamp: 'ISO-8601 UTC',
    source: '"simulated" | "real"',
    quality: '"ok" | "noisy" | "delayed" | "missing"',
    hr:    { unit: 'bpm',  range: [30, 220], desc: 'heart rate' },
    spo2:  { unit: '%',    range: [70, 100], desc: 'oxygen saturation' },
    bpSys: { unit: 'mmHg', range: [70, 220], desc: 'systolic pressure' },
    bpDia: { unit: 'mmHg', range: [40, 130], desc: 'diastolic pressure' },
    temp:  { unit: '°C',   range: [34, 42],  desc: 'body temperature (core)' },
    resp:  { unit: 'rpm',  range: [5, 40],   desc: 'respiratory rate' },
    hrv:   { unit: 'ms',   range: [10, 200], desc: 'heart rate variability (RMSSD)' },
    note: 'A numeric field may be null (missing data). quality describes the whole reading.'
  },
  Environment: {
    timestamp: 'ISO-8601 UTC', source: '"simulated" | "real"',
    co2:       { unit: 'ppm',   range: [300, 10000] },
    oxygen:    { unit: 'kPa',   range: [10, 40] },
    temp:      { unit: '°C',    range: [10, 40] },
    humidity:  { unit: '%',     range: [0, 100] },
    pressure:  { unit: 'kPa',   range: [60, 110] },
    radiation: { unit: 'µSv/h', range: [0, 500] }
  },
  Device: {
    id: 'string', astronautId: 'string', name: 'string', type: '"patch" | "wristband" | "helmet"',
    status: '"connected" | "degraded" | "disconnected"',
    battery: { unit: '%', range: [0, 100] }, signal: { unit: '%', range: [0, 100] },
    lastSeen: 'ISO-8601 UTC', provides: 'array of metrics it provides (e.g. ["hr","resp"])'
  },
  SleepActivity: {
    astronautId: 'string', day: 'YYYY-MM-DD', source: '"simulated" | "real"',
    sleepHours:   { unit: 'h',   range: [0, 14] },
    sleepQuality: { unit: '%',   range: [0, 100] },
    exerciseMin:  { unit: 'min', range: [0, 300] },
    hobbyMin:     { unit: 'min', range: [0, 600] },
    steps:        { unit: 'steps', range: [0, 40000] }
  },
  Alert: {
    id: 'string', timestamp: 'ISO-8601 UTC', astronautId: 'string | null',
    kind: '"vital" | "environment" | "device" | "reminder" | "achievement"',
    level: '"normal" | "attention" | "surgeon"', metric: 'string', message: 'string', acknowledged: 'boolean'
  },
  Event: {
    type: '"tachycardia" | "hypoxia" | "fever" | "hypertension" | "exercise" | "hobby" | "disconnect" | "recharge" | "co2" | "hydration"',
    astronautId: 'string | null', durationMs: 'number (optional)', params: 'free-form object (optional)'
  }
};

export const CONFIG = {
  dataSource: 'dataset',
  seed: 2026,
  tickMs: 2000,
  historyWindowMin: 30,
  missionStart: '2026-10-04T00:00:00Z',
  api: {
    baseUrl: '',              // the proxy's address; empty = no remote source
    timeoutMs: 8000, retries: 2, retryBackoffMs: 800, cacheTtlMs: 30000
  },
  thresholds: {
    hr:    { attention: [50, 100],    surgeon: [40, 130] },
    spo2:  { attention: [94, 100],    surgeon: [90, 100] },
    bpSys: { attention: [95, 140],    surgeon: [85, 170] },
    bpDia: { attention: [55, 90],     surgeon: [45, 110] },
    temp:  { attention: [36.0, 37.6], surgeon: [35.0, 38.5] },
    resp:  { attention: [10, 20],     surgeon: [8, 28] },
    hrv:   { attention: [25, 200],    surgeon: [12, 250] },
    baselineDeviationPct: 25,
    env: {
      co2:       { attention: [0, 3950],     surgeon: [0, 7000] },
      oxygen:    { attention: [19.5, 23.1],  surgeon: [16, 26] },
      pressure:  { attention: [97.9, 102.7], surgeon: [90, 108] },
      temp:      { attention: [20, 25],      surgeon: [18, 27] },
      humidity:  { attention: [30, 60],      surgeon: [25, 75] },
      radiation: { attention: [0, 21],       surgeon: [0, 54] }
    },
    device: { batteryWarn: 20, batteryCrit: 8, signalWarn: 40 },
    raiseAfter: 2,
    clearAfter: 3,
    reminderExpireMs: 60 * 60000
  },
  gamification: {
    waterPoints: 10,
    goals: { exerciseMin: 60, sleepHours: 7, hobbyMin: 30, batteryMin: 50 }
  },
  alerts: { escalateAfterMs: 60000, snoozeMs: 15 * 60000 },
  uplink: { queueMs: 2000, sendMs: 5000, oneWayDelayS: 1.3 },
  storageKey: 'tesai.v2'
};

export const METRICS = {
  hr:   { label: 'Heart rate',              short: 'HR',   unit: 'bpm',  dec: 0, icon: 'heart', region: 'Cardiac · left ventricle',
          note: 'Resting rate. Brief peaks usually match physical activity or stress; what matters is how long they last and how far they are from your personal baseline.' },
  spo2: { label: 'Blood oxygen · SpO₂',    short: 'SpO₂', unit: '%',    dec: 0, icon: 'o2',    region: 'Pulmonary · both lobes',
          note: 'Peripheral saturation measured by the optical sensor. A noisy reading can show low values without a real problem, which is why it does not raise alerts.' },
  bp:   { label: 'Blood pressure',         short: 'BP',   unit: 'mmHg', dec: 0, icon: 'bp', composite: ['bpSys', 'bpDia'], region: 'Circulatory · peripheral',
          note: 'Systolic / diastolic pressure. It changes with posture, hydration and exercise; it is compared with your own baseline.' },
  temp: { label: 'Core temperature',       short: 'T°',   unit: '°C',   dec: 1, icon: 'temp',  region: 'Abdominal · core',
          note: 'Follows a smooth circadian curve. A sustained deviation weighs more than an isolated value.' },
  resp: { label: 'Respiration',            short: 'RR',   unit: 'rpm',  dec: 0, icon: 'lungs', region: 'Airways',
          note: 'Resting respiratory rate. It rises with exercise and with high CO₂ levels in the cabin.' },
  hrv:  { label: 'Heart rate variability', short: 'HRV',  unit: 'ms',   dec: 0, icon: 'brain', region: 'Neural · autonomic system',
          note: 'Variability between heartbeats (RMSSD). It is naturally very variable, so it is not compared with the baseline like the others.' }
};

export const LEVELS = {
  normal:    { order: 1, label: 'Normal',               short: 'Normal' },
  attention: { order: 2, label: 'Attention',             short: 'Attention' },
  surgeon:   { order: 3, label: 'Alert flight surgeons', short: 'Alert surgeons' },
  partial:   { order: 0, label: 'Partial data',         short: 'Partial data' },
  nodata:    { order: 0, label: 'No data',               short: 'No data' },
  sensor:    { order: 0, label: 'Sensor',                short: 'Sensor' }
};

export const CREDITS = {
  app: 'Tesai',
  team: 'Higía',
  event: 'NASA Space Apps Challenge 2026',
  challenge: 'Create Health Monitoring Software for Astronauts on Space Missions',
  members: ['Ezequiel Alfaro', 'Sebastian Garay', 'Nataya Flores', 'Mateo Capararo']
};

export const ENV_META = {
  co2:       { label: 'CO₂',           short: 'CO₂',   unit: 'ppm',   dec: 0, icon: 'wind',  src: 'NASA-STD-3001 limit: 3 mmHg as a 1-hour average (≈ 3,950 ppm at sea-level pressure). Older 180-day limit: 5.3 mmHg (≈ 7,000 ppm).' },
  oxygen:    { label: 'Oxygen (ppO₂)', short: 'ppO₂',  unit: 'kPa',   dec: 1, icon: 'o2',    src: 'ISS cabin design range for oxygen partial pressure.' },
  pressure:  { label: 'Cabin pressure', short: 'Press.', unit: 'kPa', dec: 1, icon: 'gauge' },
  temp:      { label: 'Temperature',   short: 'Temp.', unit: '°C',   dec: 1, icon: 'temp',  src: 'Crew performance zone 20–25 °C; operating limit 18–27 °C.' },
  humidity:  { label: 'Humidity',      short: 'Hum.',  unit: '%',     dec: 0, icon: 'drop',  src: 'Crew performance zone 30–60 %; operating limit 25–75 %.' },
  radiation: { label: 'Radiation',     short: 'Rad.',  unit: 'µSv/h', dec: 1, icon: 'rad',   src: 'ISS effective dose is typically 0.2–0.5 mSv per day (≈ 8–21 µSv/h). NASA career limit: 600 mSv.' }
};

export const SOURCE_LABEL = { simulated: 'SIMULATED DATA', real: 'UNVERIFIED DATA' };
