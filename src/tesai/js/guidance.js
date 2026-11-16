/**
 * guidance.js · "Second doctor" content.
 * Short, non-diagnostic steps for each kind of alert, in English and Spanish.
 * Text is chosen here (not by the DOM translator) because the same strings are
 * also read aloud by the speech synthesis.
 * Prototype only: simulated data, not medical advice.
 */
import { CONFIG } from './config.js';
import { State } from './state.js';
import { I18N } from './i18n.js';

/** Pick a text by the active language. */
export const t = (en, es) => (State.lang === 'es' ? es : en);
const S = (en, es) => ({ en, es });

const NOTIFY = S('If it stays out of range, or you feel unwell, notify the flight surgeon now.', 'Si sigue fuera de rango, o no te sentís bien, avisá ya al cirujano de vuelo.');
const RECHECK5 = S('Check the sensor is snug and measure again in 5 minutes.', 'Verificá que el sensor esté bien puesto y volvé a medir en 5 minutos.');

/* GUIDE[metric][direction] · direction = 'high' | 'low' | 'any' */
const GUIDE = {
  hr: {
    high: { title: S('Fast heart rate', 'Frecuencia cardíaca alta'), steps: [
      S('Stop what you are doing and stay still, seated or strapped in.', 'Frená lo que estás haciendo y quedate quieto, sentado o sujeto.'),
      S('Breathe slowly: in for 4 seconds, out for 6.', 'Respirá lento: inhalá 4 segundos y exhalá 6.'),
      RECHECK5,
      S('If you feel chest pain or dizziness, or it stays high, notify the flight surgeon now.', 'Si sentís dolor en el pecho o mareo, o sigue alta, avisá ya al cirujano de vuelo.')] },
    low: { title: S('Slow heart rate', 'Frecuencia cardíaca baja'), steps: [
      S('Stay still and tell the crew how you feel.', 'Quedate quieto y contale al equipo cómo te sentís.'),
      RECHECK5,
      S('If you feel dizzy or faint, notify the flight surgeon now.', 'Si sentís mareo o desmayo, avisá ya al cirujano de vuelo.')] }
  },
  spo2: {
    low: { title: S('Low blood oxygen', 'Oxígeno en sangre bajo'), steps: [
      S('Check that the wristband sensor is well placed and your hand is warm.', 'Verificá que el sensor de la muñequera esté bien puesto y la mano caliente.'),
      S('Take slow, deep breaths.', 'Respirá lento y profundo.'),
      S('Check the cabin oxygen and CO₂ in Biometrics.', 'Mirá el oxígeno y el CO₂ de la cabina en Biometría.'),
      S('If it stays low or breathing is hard, notify the flight surgeon now.', 'Si sigue bajo o te cuesta respirar, avisá ya al cirujano de vuelo.')] }
  },
  bp: {
    high: { title: S('High blood pressure', 'Presión arterial alta'), steps: [
      S('Sit and rest for 5 minutes.', 'Sentate y descansá 5 minutos.'),
      S('Check the wristband is snug and measure again.', 'Verificá que la muñequera esté bien puesta y volvé a medir.'),
      S('Drink water and skip caffeine and salty food for now.', 'Tomá agua y evitá cafeína y comidas saladas por ahora.'),
      S('If it stays high, or you have a headache or blurred vision, notify the flight surgeon now.', 'Si sigue alta, o tenés dolor de cabeza o visión borrosa, avisá ya al cirujano de vuelo.')] },
    low: { title: S('Low blood pressure', 'Presión arterial baja'), steps: [
      S('Rest and drink water.', 'Descansá y tomá agua.'),
      S('Move slowly and avoid sudden movements.', 'Movete despacio y evitá movimientos bruscos.'),
      RECHECK5,
      S('If you feel dizzy or faint, notify the flight surgeon now.', 'Si sentís mareo o desmayo, avisá ya al cirujano de vuelo.')] }
  },
  temp: {
    high: { title: S('High body temperature', 'Temperatura corporal alta'), steps: [
      S('Rest and drink water.', 'Descansá y tomá agua.'),
      S('Check the cabin temperature and take off a layer.', 'Revisá la temperatura de la cabina y sacate una capa de ropa.'),
      S('Measure again in 15 minutes.', 'Volvé a medir en 15 minutos.'),
      S('If it keeps rising or you have chills, notify the flight surgeon now.', 'Si sigue subiendo o tenés escalofríos, avisá ya al cirujano de vuelo.')] },
    low: { title: S('Low body temperature', 'Temperatura corporal baja'), steps: [
      S('Add a layer and have a warm drink.', 'Ponete una capa más y tomá algo caliente.'),
      S('Check the cabin temperature.', 'Revisá la temperatura de la cabina.'),
      S('Measure again in 15 minutes.', 'Volvé a medir en 15 minutos.'),
      NOTIFY] }
  },
  resp: {
    high: { title: S('Fast breathing', 'Respiración rápida'), steps: [
      S('Stop and rest. Breathe slowly through the nose.', 'Frená y descansá. Respirá lento por la nariz.'),
      S('Check the cabin CO₂ in Biometrics.', 'Mirá el CO₂ de la cabina en Biometría.'),
      RECHECK5,
      S('If you are short of breath, notify the flight surgeon now.', 'Si te falta el aire, avisá ya al cirujano de vuelo.')] },
    low: { title: S('Slow breathing', 'Respiración lenta'), steps: [
      S('Ask the crew member how they feel and keep them awake.', 'Preguntale al tripulante cómo se siente y mantenelo despierto.'),
      RECHECK5,
      S('If breathing stays slow or they feel drowsy, notify the flight surgeon now.', 'Si sigue lenta o hay somnolencia, avisá ya al cirujano de vuelo.')] }
  },
  hrv: {
    low: { title: S('Low heart rate variability', 'Variabilidad cardíaca baja'), steps: [
      S('Take a short rest.', 'Hacé un descanso corto.'),
      S('Review today\'s sleep and workload.', 'Revisá el sueño y la carga de trabajo de hoy.'),
      S('On its own this is not urgent: keep monitoring.', 'Por sí sola no es urgente: seguí monitoreando.'),
      S('If other signs change too, notify the flight surgeon.', 'Si cambian otros signos, avisá al cirujano de vuelo.')] }
  },
  co2: {
    high: { title: S('High cabin CO₂', 'CO₂ alto en la cabina'), steps: [
      S('Move to a well-ventilated module.', 'Pasá a un módulo bien ventilado.'),
      S('Check the CO₂ scrubber and the fans.', 'Revisá el depurador de CO₂ y los ventiladores.'),
      S('Reduce physical effort until the level drops.', 'Reducí el esfuerzo físico hasta que baje.'),
      S('If it stays high, notify Earth.', 'Si sigue alto, avisá a la Tierra.')] }
  },
  oxygen: {
    any: { title: S('Cabin oxygen out of range', 'Oxígeno de cabina fuera de rango'), steps: [
      S('Check the oxygen supply panel.', 'Revisá el panel de suministro de oxígeno.'),
      S('Reduce physical effort.', 'Reducí el esfuerzo físico.'),
      S('Notify Earth.', 'Avisá a la Tierra.')] }
  },
  pressure: {
    any: { title: S('Cabin pressure out of range', 'Presión de cabina fuera de rango'), steps: [
      S('Check the pressure gauge and the hatch seals.', 'Revisá el manómetro y los sellos de las escotillas.'),
      S('Tell the whole crew.', 'Avisá a todo el equipo.'),
      S('Notify Earth now.', 'Avisá a la Tierra ahora.')] }
  },
  temp_env: {
    any: { title: S('Cabin temperature out of range', 'Temperatura de cabina fuera de rango'), steps: [
      S('Check the cooling loop and the thermostat.', 'Revisá el circuito de refrigeración y el termostato.'),
      S('Adjust your clothing layers.', 'Ajustá tu ropa.'),
      S('If it does not recover, notify Earth.', 'Si no se recupera, avisá a la Tierra.')] }
  },
  humidity: {
    any: { title: S('Cabin humidity out of range', 'Humedad de cabina fuera de rango'), steps: [
      S('Check the humidity control.', 'Revisá el control de humedad.'),
      S('Keep liquids away from electronics.', 'Mantené los líquidos lejos de la electrónica.'),
      S('If it does not recover, notify Earth.', 'Si no se recupera, avisá a la Tierra.')] }
  },
  radiation: {
    high: { title: S('High radiation', 'Radiación alta'), steps: [
      S('Go to the most shielded area of the habitat.', 'Andá a la zona más blindada del hábitat.'),
      S('Limit the time spent outside it.', 'Limitá el tiempo fuera de esa zona.'),
      S('Notify Earth and follow the ground instructions.', 'Avisá a la Tierra y seguí sus instrucciones.')] }
  }
};

const GENERIC = {
  health: { title: S('Reading outside the usual range', 'Lectura fuera de lo habitual'), steps: [
    RECHECK5, S('Rest and drink water.', 'Descansá y tomá agua.'), NOTIFY] },
  environment: { title: S('Cabin value out of range', 'Valor de cabina fuera de rango'), steps: [
    S('Check the cabin equipment and the ventilation.', 'Revisá los equipos de la cabina y la ventilación.'), S('If it stays out of range, notify Earth.', 'Si sigue fuera de rango, avisá a la Tierra.')] }
};

/** 'high' | 'low' | 'any' from the latest trusted reading vs. the attention band. */
function direction(a) {
  let v, th;
  if (a.domain === 'health') {
    const r = State.shown[a.astronautId], key = a.metric === 'bp' ? 'bpSys' : a.metric;
    v = r?.[key]; th = CONFIG.thresholds[key];
  } else if (a.domain === 'environment') {
    v = State.env?.[a.metric]; th = CONFIG.thresholds.env[a.metric];
  }
  if (v == null || !th) return 'any';
  if (v > th.attention[1]) return 'high';
  if (v < th.attention[0]) return 'low';
  return 'any';
}

/** Only health and environment alerts get a second-doctor guide. */
export function hasGuide(a) { return !!a && (a.domain === 'health' || a.domain === 'environment'); }

/** → { title, steps[], who } in the active language, or null. */
export function guideFor(a) {
  if (!hasGuide(a)) return null;
  const lang = State.lang === 'es' ? 'es' : 'en';
  const mkey = a.domain === 'environment' && a.metric === 'temp' ? 'temp_env' : a.metric;
  const g = GUIDE[mkey], dir = direction(a);
  const pick = g ? (g[dir] || g.any || g.high || g.low) : GENERIC[a.domain];
  return { title: pick.title[lang], steps: pick.steps.map(s => s[lang]) };
}

/** Alert text in the active language (alert titles and messages are English at the source). */
export const alertText = s => (State.lang === 'es' ? I18N.tx(s || '') : (s || ''));

/** Spoken intro: situation + who + what was detected. */
export function introScript(a, who) {
  const g = guideFor(a), crit = a.level === 'surgeon';
  const head = crit ? t('Situation. Critical alert.', 'Situación. Aviso crítico.') : t('Notice. Needs attention.', 'Aviso. Requiere atención.');
  return `${head} ${who ? who + '. ' : ''}${g ? g.title + '. ' : ''}${alertText(a.message)}.`;
}

export function stepScript(g, i) {
  return `${t('Step', 'Paso')} ${i + 1}. ${g.steps[i]}`;
}
