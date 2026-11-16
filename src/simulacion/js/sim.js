/* Simulation · game loop, scenarios, Tesai's guidance and the HUD. */
const { THREE, buildMars, buildRover, buildShip, setBadge } = window.W;
const S = window.S;
const $ = (id) => document.getElementById(id);
const V3 = THREE.Vector3;
const TS = 60;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const cardinal = (d) => ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(d / 45) % 8];

const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050608);
const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 1200);
camera.rotation.order = 'YXZ';
S.camera = camera;
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ---------- Niveles ---------- */
let L = null;
const collapse = () => doCollapse();
const LEVELS = {
  eva: {
    crew: 'Ana', delay: 1200, hasCpr: false, tag: 'Sol 214', build: buildMars,
    devices: ['Visor', 'Reloj', 'Rover', 'Hábitat', 'Tierra (+20 min)'],
    suit: { label: 'Tu traje · Tomás', o2: 'O<sub>2</sub> traje', pres: '4.3 psi', rad: 0.64, x: 'Polvo visor' },
    startTitle: 'Comienza la caminata · Sol 214', startBody: 'Ana va adelante, junto a la baliza. Tu visor, tu reloj y el rover comparten sus signos vitales.',
    alertTitle: 'Ana: paro cardíaco detectado', alertBody: 'Su biomonitor detectó fibrilación ventricular (simulada). Tesai avisó a todos los dispositivos y a la Tierra, que lo verá en 20 minutos.',
    reply: 'Respondiendo a datos de hace 20 min: «Vemos FV en Ana. Usen el DEA y vuelvan al hábitat.»',
    flow: () => [
      { obj: 'Camina hasta la baliza de muestras', target: () => L.pts.beacon, name: 'Baliza', near: 4, reach: true, timeout: 40, idle: 'Usa <kbd>W A S D</kbd> y el mouse. La baliza está junto a Ana.', enter: 'Hola, Tomás. Monitoreo a Ana y a ti en tiempo real. Todo normal por ahora.', done: collapse },
      { check: 'Evaluar a Ana', obj: 'Ana colapsó. Ve con ella ya', target: () => L.crewPt(), name: 'Ana', near: 2.8, hold: 1.4, act: 'conectar su biomonitor a tu visor', enter: 'Ana colapsó. Ya avisé al rover, al hábitat y a la Tierra. Ve con ella.', packet: 'Evaluación · sin respuesta · FV' },
      { check: 'Traer el DEA del rover', obj: 'Toma el DEA portátil del rover', target: () => L.pts.rover, name: 'Rover', near: 4.6, hold: 1.2, act: 'sacar el DEA del rover', enter: 'Paro cardíaco. Con el traje puesto no se puede hacer RCP: el DEA es lo primero. Está en el rover.', packet: 'DEA retirado del rover' },
      { check: 'Conectar electrodos', obj: 'Conecta el DEA al traje de Ana', target: () => L.crewPt(), name: 'Ana', near: 2.8, hold: 2, act: 'conectar los electrodos al puerto del traje', enter: 'Tienes el DEA. Su traje tiene un puerto de electrodos en el pecho. Ve con ella.' },
      { check: 'Descarga del DEA', type: 'aed', obj: 'Sigue las indicaciones del DEA', enter: 'Electrodos conectados. Nadie toca a Ana: analizando el ritmo.' },
      { check: 'Reevaluar ritmo', type: 'aed2', obj: 'El DEA vuelve a analizar', enter: 'Descarga hecha. Reviso de nuevo su ritmo.' },
      { check: 'Volver al hábitat', type: 'final', obj: 'Ana tiene pulso. Volvamos al hábitat', target: () => L.pts.hab, name: 'Hábitat', enter: 'Ana tiene pulso. Sigo monitoreándola y la Tierra ya recibe todo.' },
    ],
  },
  rover: {
    crew: 'Luis', delay: 1200, hasCpr: true, tag: 'Sol 214 · Kestrel', build: buildRover,
    devices: ['Visor', 'Reloj', 'Pantallas rover', 'Hábitat', 'Tierra (+20 min)'],
    suit: { label: 'Tu visor AR · Tomás', o2: 'O<sub>2</sub> cabina', pres: '14.7 psi', rad: 0.31, x: 'Filtro regolito' },
    startTitle: 'En ruta a la base Jezero', startBody: 'Luis maneja. Tesai monitorea a los dos y muestra todo en tu visor, tu reloj y las pantallas del rover.',
    alertTitle: 'Luis: paro cardíaco detectado', alertBody: 'Tesai detuvo el rover, avisó a todos los dispositivos y a la Tierra, que lo verá en 20 minutos.',
    reply: 'Respondiendo a datos de hace 20 min: «Vemos que Luis colapsó. Detengan el rover, usen el DEA e inicien RCP.»',
    flow: () => [
      { obj: 'Cambia el filtro de regolito (pared trasera)', target: () => L.pts.filter, name: 'Filtro', near: 1.5, hold: 1.2, act: 'cambiar el filtro', timeout: 45, idle: 'El polvo que entra con los trajes satura el filtro. Date vuelta: está atrás.', enter: 'Hola, Tomás. Luis maneja y yo monitoreo a los dos. El filtro de regolito está casi saturado.', done: () => L.changeFilter() },
      { type: 'wait', after: 2.5, obj: 'Filtro cambiado', enter: 'Filtro al 100%. Buen trabajo.', done: collapse },
      { check: 'Evaluar a Luis', obj: 'Luis se desplomó. Ve con él', target: () => L.crewPt(), name: 'Luis', near: 1.7, hold: 1.5, act: 'evaluar si responde y respira', enter: 'Luis se desplomó. Detuve el rover y avisé a la Tierra. Ve con él.', packet: 'Evaluación · sin respuesta · sin respiración' },
      { check: 'Traer el DEA', obj: 'Toma el DEA de la pared izquierda', target: () => L.pts.aed, name: 'DEA', near: 1.4, hold: 1, act: 'tomar el DEA', enter: 'No responde y no respira normal: es un paro cardíaco. Trae el DEA de la pared izquierda.', packet: 'DEA en uso', done: () => L.takeAed() },
      { check: 'Colocar parches', obj: 'Coloca los parches del DEA en Luis', target: () => L.crewPt(), name: 'Luis', near: 1.7, hold: 1.5, act: 'colocar los parches', enter: 'Vuelve con Luis. Un parche bajo la clavícula derecha y otro al costado izquierdo.' },
      { check: 'Descarga del DEA', type: 'aed', obj: 'Sigue las indicaciones del DEA', enter: 'Parches colocados. Nadie toca a Luis: analizando.' },
      { check: 'RCP · 2 ciclos', type: 'cpr', obj: 'RCP: 30 compresiones y 2 ventilaciones, dos veces', note: 'Talón de la mano en el centro del pecho, brazos rectos, unos 5 cm de profundidad.', enter: 'Empieza la RCP ya. Sigue el punto: 30 compresiones, fuerte y rápido.' },
      { check: 'Reevaluar ritmo', type: 'aed2', obj: 'El DEA vuelve a analizar', enter: 'Alto. El DEA analiza de nuevo.' },
      { check: 'Monitoreo', type: 'final', obj: 'Luis tiene pulso. Quédate con él', target: () => L.crewPt(), name: 'Luis', enter: 'Luis tiene pulso. Lo sigo monitoreando y la Tierra ya tiene todo el registro.' },
    ],
  },
  ship: {
    crew: 'Mei', delay: 750, hasCpr: true, tag: 'Nave Hermes', build: buildShip,
    devices: ['Visor', 'Reloj', 'Pantallas nave', 'Tripulación', 'Tierra (+12 min)'],
    suit: { label: 'Tu visor AR · Tomás', o2: 'O<sub>2</sub> cabina', pres: '14.7 psi', rad: 1.82, x: 'Gravedad' },
    startTitle: 'Día 96 rumbo a Marte', startBody: 'Microgravedad. Tesai monitorea a Mei y a ti y envía todo a la Tierra, a 12 minutos y medio de distancia.',
    alertTitle: 'Mei: paro cardíaco detectado', alertBody: 'Su biomonitor detectó fibrilación ventricular (simulada). Tesai avisó a la nave y a la Tierra, que lo verá en 12 min 30 s.',
    reply: 'Respondiendo a datos de hace 12 min: «Vemos a Mei en paro. Fíjenla a la camilla, usen el DEA y hagan RCP.»',
    flow: () => [
      { obj: 'Flota hasta el panel del laboratorio', target: () => L.pts.lab, name: 'Laboratorio', near: 1.7, hold: 1.2, act: 'registrar el experimento', timeout: 45, idle: '<kbd>W A S D</kbd> + mirar · <kbd>Espacio</kbd> sube · <kbd>C</kbd> baja', enter: 'Hola, Tomás. Día 96 de tránsito. Monitoreo a Mei y a ti; la Tierra está a 12 minutos y medio.' },
      { type: 'wait', after: 2.5, obj: 'Experimento registrado', enter: 'Registro guardado y enviado a la Tierra.', done: collapse },
      { check: 'Evaluar a Mei', obj: 'Mei perdió el conocimiento. Ve con ella', target: () => L.crewPt(), name: 'Mei', near: 1.8, hold: 1.4, act: 'evaluar si responde y respira', enter: 'Mei perdió el conocimiento. Avisé a la nave y a la Tierra. Ve con ella.', packet: 'Evaluación · sin respuesta · sin respiración' },
      { check: 'Traer el DEA', obj: 'Toma el DEA del rack verde', target: () => L.pts.aed, name: 'DEA', near: 1.6, hold: 1, act: 'tomar el DEA', enter: 'Paro cardíaco. Trae el DEA del rack verde, en la pared derecha.', packet: 'DEA en uso', done: () => L.takeAed() },
      { check: 'Sujetar a Mei', obj: 'Sujeta a Mei', target: () => L.crewPt(), name: 'Mei', near: 1.8, hold: 1, act: 'sujetarla', enter: 'En microgravedad no puedes reanimarla flotando. Sujétala.', done: () => L.carry() },
      { check: 'Fijarla en la camilla', obj: 'Llévala a la camilla médica', target: () => L.pts.cmrs, name: 'Camilla', near: 1.9, hold: 1.4, act: 'fijarla con las correas', enter: 'La llevas contigo. Ve a la camilla médica, al fondo del módulo.', done: () => L.fix() },
      { check: 'Colocar parches', obj: 'Coloca los parches del DEA', target: () => L.crewPt(), name: 'Mei', near: 1.9, hold: 1.2, act: 'colocar los parches', enter: 'Fijada. Ahora coloca los parches del DEA.' },
      { check: 'Descarga del DEA', type: 'aed', obj: 'Sigue las indicaciones del DEA', enter: 'Nadie toca a Mei: analizando.' },
      { check: 'RCP · 2 ciclos', type: 'cpr', obj: 'RCP en microgravedad: 30 y 2, dos veces', note: 'Engancha los pies en los estribos de la camilla para hacer fuerza. Brazos rectos, centro del pecho.', enter: 'RCP ya. En microgravedad ánclate con los pies para empujar.' },
      { check: 'Reevaluar ritmo', type: 'aed2', obj: 'El DEA vuelve a analizar', enter: 'Alto. Analizando de nuevo.' },
      { check: 'Monitoreo', type: 'final', obj: 'Mei tiene pulso. Mantenla monitoreada', target: () => L.crewPt(), name: 'Mei', enter: 'Mei tiene pulso. Todo queda registrado y enviado a la Tierra.' },
    ],
  },
};

/* ---------- Estado ---------- */
let level = null, flow = [], si = 0, stepT = 0, state = 'menu';
let alertAt = 0, stableAt = 0, replyAt = 0, replied = false;
let hold = 0, lastDom = 0, lastBeep = 0, lastTele = 0, lastMetro = 0, flatUntil = 0, myHr = 88, voice = true;
let compBump = 0, compBob = 0, bannerTimer = 0;
const stats = { packets: 0, mb: 0, good: 0, total: 0 };
const crewV = { hr: 76, spo2: 98, rhythm: 'normal', etco2: 0 };
const packets = [];
const med = { mode: null, phase: null, t0: 0 };
const cpr = { cycle: 1, cycles: 2, count: 0, phase: 'comp', breaths: 0, last: 0, rates: [], note: '' };
const player = { pos: new V3(), yaw: 0, pitch: -0.05, vy: 0, ground: true, bob: 0, vel: new V3() };
const keys = S.keys;

/* ---------- Audio y voz ---------- */
let actx = null;
function beep(f = 880, d = 0.12, v = 0.05, type = 'sine') {
  if (!actx) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.value = f; g.gain.value = v;
  g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + d);
  o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + d);
}
function say(text) {
  if (!voice || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const en = window.i18n && window.i18n.lang === 'en';
    const u = new SpeechSynthesisUtterance(window.i18n ? window.i18n.tr(text) : text); u.lang = en ? 'en-US' : 'es-ES'; u.rate = 1.06;
    const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.startsWith(en ? 'en' : 'es')); if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch (_) {}
}
function assistant(msg, speak = true) { $('aiMsg').textContent = msg; if (speak) say(msg); }
function updateVoiceLabel() { $('voiceState').textContent = voice ? 'Voz · M' : 'Silencio · M'; }

/* ---------- UI helpers ---------- */
function showBanner(title, body, lit = [], ok = true, ms = 6000) {
  $('bTitle').textContent = title; $('bBody').textContent = body;
  [...$('chips').children].forEach((c, i) => c.classList.toggle('lit', lit.includes(i)));
  const b = $('banner'); b.classList.toggle('crit', !ok); b.classList.add('on');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.remove('on'), ms);
}
function sendPacket(name) {
  stats.packets++; stats.mb += 0.08 + Math.random() * 0.5;
  packets.unshift({ name, at: S.t }); if (packets.length > 3) packets.pop();
}
function renderSteps() {
  const ul = $('aiSteps');
  if (!S.collapsed) { ul.innerHTML = ''; return; }
  let html = '<li class="done">Alerta automática enviada</li>';
  flow.forEach((s, i) => { if (s.check) html += `<li class="${i < si ? 'done' : i === si ? 'active' : ''}">${s.check}</li>`; });
  ul.innerHTML = html;
}
const quality = () => (stats.total ? Math.round((stats.good / stats.total) * 100) : 0);

/* ---------- Flujo ---------- */
function enterStep(i) {
  si = i; stepT = 0; hold = 0;
  const s = flow[i];
  if (s.enter) assistant(s.enter);
  if (s.type === 'aed' || s.type === 'aed2') startMed(s.type);
  if (s.type === 'cpr') { Object.assign(cpr, { cycle: 1, count: 0, phase: 'comp', breaths: 0, last: 0, rates: [], note: s.note || '' }); startMed('cpr'); }
  renderSteps();
}
function completeStep() {
  const s = flow[si];
  if (s.packet) sendPacket(s.packet);
  if (s.done) s.done();
  if (si < flow.length - 1) enterStep(si + 1); else renderSteps();
}
function doCollapse() {
  S.collapsed = true; S.crisis = true; alertAt = S.t; lastTele = S.t;
  crewV.rhythm = 'vf';
  L.onCollapse(); setBadge(L.crew, true);
  $('alertGlow').classList.add('on'); $('crew').classList.add('crit');
  const w = $('watch'); w.classList.add('crit', 'buzz'); setTimeout(() => w.classList.remove('buzz'), 2000);
  showBanner(level.alertTitle, level.alertBody, [0, 1, 2, 3, 4], false, 9000);
  sendPacket('ALERTA automática · ECG + SpO₂ + ubicación');
  beep(880, 0.2, 0.08, 'square'); setTimeout(() => beep(660, 0.25, 0.08, 'square'), 220);
}
function rosc() {
  S.crisis = false; stableAt = S.t; crewV.rhythm = 'recover';
  L.onRosc(); setBadge(L.crew, false);
  $('alertGlow').classList.remove('on'); $('crew').classList.remove('crit'); $('watch').classList.remove('crit');
  sendPacket('Pulso recuperado · signos vitales');
  showBanner(`${level.crew} recuperó el pulso`, `Tesai lo registró y lo envió solo a la Tierra. Llegará en ${fmt(level.delay)}.`, [0, 1, 2, 4], true, 6000);
  beep(660, 0.12, 0.05); setTimeout(() => beep(990, 0.18, 0.05), 140);
}

/* ---------- DEA y RCP ---------- */
function startMed(mode) { med.mode = mode; med.phase = mode === 'cpr' ? 'comp' : 'analyze'; med.t0 = S.t; renderMed(); }
function endMed() { med.mode = null; renderMed(); }
function updateAed() {
  if (med.phase === 'analyze' && S.t - med.t0 > 3.2) {
    if (med.mode === 'aed') { med.phase = 'shock'; beep(440, 0.3, 0.07, 'square'); assistant(`Descarga recomendada. Que nadie toque a ${level.crew}. Mantén E.`); }
    else { med.phase = 'rosc'; med.t0 = S.t; assistant(`Ritmo organizado y pulso presente. Recuperamos a ${level.crew}.`); rosc(); }
    renderMed();
  }
  if (med.phase === 'rosc' && S.t - med.t0 > 2.2) { endMed(); completeStep(); }
}
function shock() {
  const f = $('flash'); f.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on')));
  beep(120, 0.35, 0.12, 'sawtooth'); flatUntil = S.t + 0.8;
  sendPacket('Descarga DEA · 200 J');
  endMed(); completeStep();
}
function compress() {
  if (med.mode !== 'cpr' || cpr.phase !== 'comp') return;
  if (cpr.count > 0) {
    const iv = S.t - cpr.last;
    if (iv < 1.5) { const r = 60 / iv; cpr.rates.push(r); if (cpr.rates.length > 4) cpr.rates.shift(); stats.total++; if (r >= 100 && r <= 120) stats.good++; }
  }
  cpr.last = S.t; cpr.count++; compBump = 1; compBob = 1;
  beep(170, 0.07, 0.07);
  if (cpr.count >= 30) { cpr.phase = 'breath'; cpr.breaths = 0; assistant('Treinta. Ahora 2 ventilaciones con la bolsa-mascarilla: presiona E.'); }
  renderMed();
}
function breath() {
  if (med.mode !== 'cpr' || cpr.phase !== 'breath') return;
  cpr.breaths++; beep(520, 0.3, 0.04);
  if (cpr.breaths >= 2) {
    sendPacket(`RCP ciclo ${cpr.cycle} · 30:2 · calidad ${quality()}%`);
    if (cpr.cycle < cpr.cycles) { cpr.cycle++; cpr.count = 0; cpr.phase = 'comp'; cpr.last = 0; assistant(`Ciclo ${cpr.cycle}. Sigue: fuerte y rápido.`); }
    else { endMed(); assistant('Bien hecho. Deja que el DEA vuelva a analizar.'); completeStep(); return; }
  }
  renderMed();
}
function renderMed() {
  const el = $('med');
  if (!med.mode) { el.className = 'card'; return; }
  const name = level.crew;
  let title = '', big = '', sub = '', rate = '', rateColor = 'var(--dim)', note = '', bar = 0, cls = 'card on';
  if (med.mode === 'cpr') {
    title = `RCP guiada · ciclo ${cpr.cycle} de ${cpr.cycles}`;
    if (cpr.phase === 'comp') {
      cls += ' cpr';
      big = `${cpr.count}<small> / 30</small>`; sub = 'Compresiones · Espacio o clic al ritmo del punto';
      const r = cpr.rates.length ? cpr.rates.reduce((a, b) => a + b) / cpr.rates.length : 0;
      if (r) { rate = `${Math.round(r)} cpm · ${r < 100 ? 'más rápido' : r > 120 ? 'más lento' : 'buen ritmo'}`; rateColor = r < 100 || r > 120 ? 'var(--red)' : 'var(--green)'; }
      else rate = 'Objetivo: 100 a 120 por minuto';
      note = cpr.count > 0 && S.t - cpr.last > 3 ? 'No pares: cada segundo sin compresiones cuenta.' : cpr.note;
      bar = cpr.count / 30;
    } else {
      big = `${cpr.breaths}<small> / 2</small>`; sub = 'Ventilaciones · presiona E';
      note = 'Cabeza hacia atrás, mentón arriba. Cada ventilación dura 1 segundo.'; bar = cpr.breaths / 2;
    }
  } else {
    title = med.mode === 'aed' ? 'DEA · desfibrilador' : 'DEA · reanálisis';
    if (med.phase === 'analyze') { cls += ' crit'; big = 'Analizando'; sub = `No toques a ${name}`; bar = clamp((S.t - med.t0) / 3.2, 0, 1); }
    else if (med.phase === 'shock') { cls += ' crit'; big = 'Descarga'; sub = 'Recomendada · mantén E'; note = 'Todos alejados del paciente.'; bar = 1; }
    else { big = 'Pulso'; sub = 'Ritmo organizado detectado'; bar = 1; }
  }
  el.className = cls;
  $('medTitle').textContent = title; $('medBig').innerHTML = big; $('medSub').textContent = sub;
  $('medRate').textContent = rate; $('medRate').style.color = rateColor; $('medNote').textContent = note;
  $('medBar').style.width = `${bar * 100}%`;
}

/* ---------- Entrada ---------- */
function press(code) {
  if (state !== 'play') return;
  const first = !keys[code]; keys[code] = true;
  if (!first) return;
  if (code === 'Space') {
    if (med.mode === 'cpr') compress();
    else if (L.mode === 'ground' && player.ground) { player.vy = 3.4; player.ground = false; }
  }
  if (code === 'KeyE' && med.mode === 'cpr') breath();
  if (code === 'KeyM') { voice = !voice; if (!voice && 'speechSynthesis' in window) speechSynthesis.cancel(); updateVoiceLabel(); }
}
const release = (code) => { keys[code] = false; };
addEventListener('keydown', (e) => { if (e.code === 'Space') e.preventDefault(); if (e.repeat) return; press(e.code); });
addEventListener('keyup', (e) => release(e.code));
addEventListener('blur', () => Object.keys(keys).forEach((k) => (keys[k] = false)));
let locked = false, drag = null;
document.addEventListener('pointerlockchange', () => { const was = locked; locked = document.pointerLockElement === canvas; if (was && !locked && state === 'play') pauseGame(); $('lookHint').classList.toggle('on', state === 'play' && !locked); });
canvas.addEventListener('mousedown', (e) => {
  if (state !== 'play') return;
  if (med.mode === 'cpr') compress();
  if (!locked) { try { canvas.requestPointerLock(); } catch (_) {} drag = { x: e.clientX, y: e.clientY }; }
});
addEventListener('mouseup', () => (drag = null));
addEventListener('mousemove', (e) => {
  if (state !== 'play') return;
  let dx = 0, dy = 0;
  if (locked) { dx = e.movementX; dy = e.movementY; } else if (drag) { dx = e.clientX - drag.x; dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; } else return;
  player.yaw -= dx * 0.0022; player.pitch = clamp(player.pitch - dy * 0.0022, -1.4, 1.4);
});
let touchLook = null;
canvas.addEventListener('touchstart', (e) => { const t0 = e.touches[0]; touchLook = { x: t0.clientX, y: t0.clientY }; if (med.mode === 'cpr') compress(); }, { passive: true });
canvas.addEventListener('touchmove', (e) => { if (!touchLook) return; const t0 = e.touches[0]; player.yaw -= (t0.clientX - touchLook.x) * 0.004; player.pitch = clamp(player.pitch - (t0.clientY - touchLook.y) * 0.004, -1.4, 1.4); touchLook = { x: t0.clientX, y: t0.clientY }; keys.KeyW = true; }, { passive: true });
canvas.addEventListener('touchend', () => { touchLook = null; keys.KeyW = false; });
document.querySelectorAll('.tbtn').forEach((b) => {
  b.addEventListener('touchstart', (e) => { e.preventDefault(); press(b.dataset.k); });
  b.addEventListener('touchend', (e) => { e.preventDefault(); release(b.dataset.k); });
});

/* ---------- Inicio y fin ---------- */
function startLevel(key) {
  level = LEVELS[key];
  L = level.build(scene);
  flow = level.flow();
  document.body.classList.toggle('ar', L.mode !== 'ground');
  player.pos.set(L.spawn.x, L.spawn.y || 0, L.spawn.z); player.yaw = L.spawn.yaw; player.pitch = -0.05;
  if (L.mode !== 'zeroG') player.pos.y = L.floor(player.pos.x, player.pos.z);
  $('delay').textContent = fmt(level.delay);
  $('suitLabel').textContent = level.suit.label; $('o2Label').innerHTML = level.suit.o2;
  $('pres').textContent = level.suit.pres; $('xLabel').textContent = level.suit.x;
  $('crewLabel').textContent = `${level.crew} · biomonitor`; $('lvlTag').textContent = level.tag;
  $('wTitle').textContent = level.crew;
  $('chips').innerHTML = level.devices.map((d) => `<span class="chip">${d}</span>`).join('');
  document.querySelectorAll('.tbtn[data-only]').forEach((b) => (b.style.display = b.dataset.only === key ? '' : 'none'));
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch (_) {}
  state = 'play'; S.playing = true; S.t = 0;
  $('menu').classList.add('hide'); $('hud').classList.add('on'); $('watch').classList.add('on');
  try { canvas.requestPointerLock(); } catch (_) {}
  $('lookHint').classList.add('on');
  enterStep(0);
  showBanner(level.startTitle, level.startBody, [0, 1, 2, 3], true, 6000);
}
document.querySelectorAll('.lv').forEach((b) => b.addEventListener('click', () => startLevel(b.dataset.level)));
$('again').addEventListener('click', () => location.reload());

/* ---------- Pausa y menú ---------- */
function pauseGame() {
  if (state !== 'play') return;
  state = 'pause'; S.playing = false;
  Object.keys(keys).forEach((k) => (keys[k] = false));
  try { document.exitPointerLock(); } catch (_) {}
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $('lookHint').classList.remove('on');
  $('pause').classList.remove('hide');
  $('resume').focus({ preventScroll: true });
}
function resumeGame() {
  if (state !== 'pause') return;
  state = 'play'; S.playing = true;
  $('pause').classList.add('hide');
  try { canvas.requestPointerLock(); } catch (_) {}
  $('lookHint').classList.toggle('on', !locked);
}
$('menuBtn').addEventListener('click', pauseGame);
$('resume').addEventListener('click', resumeGame);
$('pAgain').addEventListener('click', () => location.reload());
addEventListener('keydown', (e) => {
  if (e.code === 'Escape') { if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); }
  else if (e.code === 'KeyP' && !e.repeat) { if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); }
});

function endGame() {
  state = 'end'; S.playing = false;
  try { document.exitPointerLock(); } catch (_) {}
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  const r = stableAt - alertAt;
  $('endTitle').textContent = `Recuperaste a ${level.crew} en ${fmt(r)}. La primera respuesta de la Tierra llegó a los ${fmt(2 * level.delay)}.`;
  $('sReact').textContent = fmt(r);
  $('sEarth').textContent = fmt(2 * level.delay);
  $('sPk').textContent = `${stats.packets} · ${stats.mb.toFixed(1)} MB`;
  $('sCpr').textContent = level.hasCpr ? `${quality()}%` : 'No aplica (traje)';
  $('sDev').textContent = level.devices.length;
  $('endBody').textContent = 'Tesai detectó el paro, alertó a cada dispositivo, te guió como un segundo médico y mandó todo a la Tierra sin que tocaras nada. La simulación acelera el retardo 60 veces.';
  $('hud').classList.remove('on'); $('watch').classList.remove('on'); $('lookHint').classList.remove('on');
  $('end').classList.remove('hide');
}

/* ---------- Movimiento ---------- */
const fwd = new V3(), right = new V3(), f3 = new V3(), acc = new V3(), UP = new V3(0, 1, 0);
function movePlayer(dt) {
  const inCpr = med.mode === 'cpr';
  let mx = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), mz = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  if (inCpr) mx = mz = 0;
  const shift = keys.ShiftLeft || keys.ShiftRight;
  right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  let roll = 0;
  if (L.mode === 'zeroG') {
    const cp = Math.cos(player.pitch);
    f3.set(-Math.sin(player.yaw) * cp, Math.sin(player.pitch), -Math.cos(player.yaw) * cp);
    const up = (keys.Space && !inCpr ? 1 : 0) - (keys.KeyC || keys.ControlLeft ? 1 : 0);
    acc.copy(f3).multiplyScalar(mz).addScaledVector(right, mx).addScaledVector(UP, up);
    if (acc.lengthSq() > 1) acc.normalize();
    const top = shift ? 3.6 : 2.2;
    player.vel.addScaledVector(acc, top * 2 * dt).multiplyScalar(Math.max(0, 1 - dt * 1.6));
    if (player.vel.length() > top) player.vel.setLength(top);
    player.pos.addScaledVector(player.vel, dt);
    L.constrain(player.pos, player.vel);
    camera.position.copy(player.pos);
    roll = Math.sin(S.t * 0.4) * 0.015;
  } else {
    fwd.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    const len = Math.hypot(mx, mz) || 1;
    const base = L.mode === 'cabin' ? [2.0, 3.0] : [3.4, 6.2];
    const speed = (shift ? base[1] : base[0]) * (L.mode === 'ground' ? 1 - S.visorDust * 0.25 : 1);
    player.pos.addScaledVector(fwd, (mz / len) * speed * dt).addScaledVector(right, (mx / len) * speed * dt);
    L.constrain(player.pos);
    const gy = L.floor(player.pos.x, player.pos.z);
    if (L.mode === 'ground') {
      player.vy -= 3.71 * dt; player.pos.y += player.vy * dt;
      if (player.pos.y <= gy) { player.pos.y = gy; player.vy = 0; player.ground = true; }
    } else player.pos.y = gy;
    if ((mx || mz) && player.ground) player.bob += dt * (shift ? 9 : 6);
    const bob = Math.sin(player.bob) * 0.035;
    const shake = L.shake ? Math.sin(S.t * 23) * 0.006 * L.shake : 0;
    camera.position.set(player.pos.x, player.pos.y + L.eye + bob + shake - compBob * 0.05, player.pos.z);
  }
  if (inCpr) {
    const tg = L.crewPt();
    const dx = tg.x - camera.position.x, dy = tg.y - camera.position.y, dz = tg.z - camera.position.z;
    const wantYaw = Math.atan2(-dx, -dz), wantPitch = Math.atan2(dy, Math.hypot(dx, dz));
    let dyaw = wantYaw - player.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
    player.yaw += dyaw * Math.min(1, dt * 3); player.pitch += (wantPitch - player.pitch) * Math.min(1, dt * 3);
    if (L.mode === 'zeroG') camera.position.y -= compBob * 0.05;
  }
  compBob *= Math.max(0, 1 - dt * 10);
  camera.rotation.set(player.pitch, player.yaw, roll);
  const moving = mx || mz;
  myHr += ((S.crisis ? 124 : moving ? (shift ? 112 : 96) : 86) - myHr) * dt * 0.3;
}

/* ---------- Lógica por frame ---------- */
const proj = new V3();
function distTo(v) {
  if (L.mode === 'zeroG') return camera.position.distanceTo(v);
  return Math.hypot(v.x - player.pos.x, v.z - player.pos.z);
}
function logic(dt) {
  const s = flow[si];
  let hint = '', holdNeed = 0, holdAction = null;
  const tgt = s.target ? s.target() : null;
  const d = tgt ? distTo(tgt) : Infinity;
  if (!s.type) {
    const near = d < s.near;
    if (s.reach && near) { completeStep(); return; }
    if (s.hold && near) { hint = `Mantén <kbd>E</kbd> para ${s.act}`; holdNeed = s.hold; holdAction = completeStep; }
    else hint = !S.collapsed && s.idle ? s.idle : `${s.name} a ${d.toFixed(d < 10 ? 1 : 0)} m${S.crisis ? ' · <kbd>Shift</kbd> para apurarte' : ''}`;
    if (s.timeout && stepT > s.timeout) { completeStep(); return; }
  } else if (s.type === 'wait') {
    if (stepT > s.after) { completeStep(); return; }
  } else if (s.type === 'aed' || s.type === 'aed2') {
    updateAed();
    if (med.phase === 'shock') { hint = `Mantén <kbd>E</kbd> para dar la descarga · nadie toca a ${level.crew}`; holdNeed = 1; holdAction = shock; }
    else hint = 'El DEA está trabajando · no toques al paciente';
  } else if (s.type === 'cpr') {
    hint = cpr.phase === 'comp' ? '<kbd>Espacio</kbd> o clic en cada compresión, al ritmo del punto' : 'Presiona <kbd>E</kbd> para cada ventilación';
    if (cpr.phase === 'comp' && S.t - lastMetro > 0.5454) { lastMetro = S.t; beep(1250, 0.03, 0.025); }
  } else if (s.type === 'final') {
    hint = replied ? 'La Tierra ya respondió · cerrando la simulación' : `La respuesta de la Tierra llega en ${fmt((alertAt + (2 * level.delay) / TS - S.t) * TS)}`;
  }

  if (holdAction && keys.KeyE) {
    hold += dt;
    if (hold >= holdNeed) { hold = 0; keys.KeyE = false; beep(1046, 0.08, 0.04); holdAction(); }
  } else hold = Math.max(0, hold - dt * 3);
  $('ring').classList.toggle('on', hold > 0 && !!holdAction);
  $('ringArc').setAttribute('stroke-dashoffset', 176 - 176 * Math.min(1, hold / (holdNeed || 1)));

  if (S.t - lastTele > (S.crisis ? 10 : 15)) { lastTele = S.t; sendPacket(S.crisis ? 'Stream ECG + signos vitales' : 'Telemetría de rutina'); }
  if (S.collapsed && !replied && S.t >= alertAt + (2 * level.delay) / TS) {
    replied = true; replyAt = S.t;
    showBanner('Llegó la respuesta de la Tierra', `${level.reply} ${stableAt ? 'Ustedes ya lo resolvieron.' : 'Llega tarde: tú ya estás actuando.'}`, [4], true, 9000);
    beep(740, 0.15, 0.05);
  }
  if (S.crisis && med.mode !== 'cpr' && S.t - lastBeep > 2.2) { lastBeep = S.t; beep(880, 0.12, 0.04, 'square'); }

  if (!S.collapsed) { crewV.hr = 74 + Math.sin(S.t * 0.4) * 3; crewV.spo2 = 98; }
  else if (S.crisis) {
    crewV.spo2 = Math.max(68, 96 - (S.t - alertAt) * 0.25);
    crewV.etco2 += ((med.mode === 'cpr' ? 8 + quality() * 0.14 : 0) - crewV.etco2) * dt * 0.8;
  } else {
    const k = Math.min(1, (S.t - stableAt) / 20);
    crewV.hr = 112 - k * 24 + Math.sin(S.t) * 2; crewV.spo2 = Math.min(95, 86 + k * 9);
  }

  if (stableAt && replied && S.t - stableAt > 6 && S.t - replyAt > 5) { endGame(); return; }

  const m = $('marker');
  if (tgt && med.mode !== 'cpr') {
    proj.copy(tgt).project(camera);
    const behind = proj.z > 1;
    let x = proj.x, y = proj.y; if (behind) { x = -x; y = -y; }
    const off = behind || Math.abs(x) > 0.9 || Math.abs(y) > 0.85;
    if (off) { const k = 0.9 / Math.max(Math.abs(x), Math.abs(y) / 0.94, 0.0001); x *= k; y *= k; }
    m.style.transform = `translate(${((x + 1) / 2) * innerWidth - 40}px, ${((1 - y) / 2) * innerHeight - 10}px)`;
    m.classList.add('on'); m.classList.toggle('crit', S.crisis);
    $('markerLabel').textContent = `${s.name || ''} · ${d.toFixed(d < 10 ? 1 : 0)} m`;
  } else m.classList.remove('on');
  $('reticle').style.opacity = med.mode ? 0 : 1;

  if (S.t - lastDom > 0.1) { lastDom = S.t; updateDom(s, hint); }
}

function updateDom(s, hint) {
  $('clock').textContent = fmt(S.t);
  if (L.info) { const [a, b] = L.info(); $('infoLabel').textContent = a; $('infoVal').textContent = b; }
  else { const hd = (((-player.yaw * 180) / Math.PI) % 360 + 360) % 360; $('infoLabel').textContent = 'Rumbo'; $('infoVal').textContent = `${String(Math.round(hd)).padStart(3, '0')}° ${cardinal(hd)}`; }
  const eva = L.mode === 'ground';
  $('myHr').textContent = Math.round(myHr);
  $('o2').textContent = eva ? `${(78 - S.t * 0.02).toFixed(0)}%` : '20.9%';
  $('co2').textContent = `${(eva ? 0.4 + (S.crisis ? 0.2 : 0) : 0.3).toFixed(1)} kPa`;
  $('temp').textContent = `${(eva ? 21.4 : 22.1).toFixed(1)} °C`;
  $('batt').textContent = `${Math.round((eva ? 86 : 91) - S.t * 0.03)}%`;
  $('rad').textContent = `${level.suit.rad.toFixed(2)} mSv/d`;
  $('xVal').textContent = eva ? `${Math.round(S.visorDust * 100)}%` : L.filter ? `${Math.round(L.filter())}%` : '0.00 g';
  $('dustWarn').classList.toggle('on', eva && S.visorDust > 0.35);

  const crit = S.crisis;
  $('crewHr').textContent = crit ? '— —' : Math.round(crewV.hr);
  $('crewSpo2').textContent = `${Math.round(crewV.spo2)}%`;
  const rh = $('crewRhythm');
  rh.textContent = !S.collapsed ? 'Ritmo sinusal' : crit ? (med.mode === 'cpr' ? 'FV · RCP en curso' : 'Fibrilación ventricular · crítico') : 'Ritmo recuperándose';
  rh.classList.toggle('crit', crit);
  const k = stableAt ? Math.min(1, (S.t - stableAt) / 20) : 0;
  $('crewBp').textContent = !S.collapsed ? '118/76' : crit ? (med.mode === 'cpr' ? 'RCP' : '— / —') : `${Math.round(96 + k * 12)}/${Math.round(60 + k * 10)}`;
  $('crewRr').textContent = !S.collapsed ? '14 rpm' : crit ? '0 rpm' : '12 rpm';
  $('crewTemp').textContent = !S.collapsed ? '36.8 °C' : '36.5 °C';
  if (crit && med.mode === 'cpr') { $('crewXLabel').innerHTML = 'EtCO<sub>2</sub>'; $('crewX').textContent = `${Math.round(crewV.etco2)} mmHg`; }
  else { $('crewXLabel').textContent = 'Confianza'; $('crewX').textContent = `${L.conf()}%`; }
  const dc = distTo(L.crewPt());
  $('crewDist').textContent = `${dc.toFixed(dc < 10 ? 1 : 0)} m`;

  $('pkCount').textContent = `${stats.packets} · ${stats.mb.toFixed(1)} MB`;
  $('pkList').innerHTML = packets.map((p) => {
    const rem = p.at + level.delay / TS - S.t;
    return `<div class="pk"><span>${p.name}</span><span class="mono ${rem <= 0 ? 'ok' : ''}">${rem > 0 ? `llega ${fmt(rem * TS)}` : 'recibido'}</span></div>`;
  }).join('');
  $('reply').textContent = !S.collapsed ? 'sin pedidos' : replied ? 'recibida' : `en ${fmt((alertAt + (2 * level.delay) / TS - S.t) * TS)}`;

  $('objLabel').textContent = S.collapsed ? `Paso ${Math.max(1, flow.slice(0, si + 1).filter((x) => x.check).length)} de ${flow.filter((x) => x.check).length}` : 'Objetivo';
  $('objText').textContent = s.obj || '';
  $('objHint').innerHTML = hint;
  $('wVal').textContent = crit ? '— —' : Math.round(crewV.hr);
  $('wSub').textContent = !S.collapsed ? 'Todo bien' : crit ? (med.mode === 'cpr' ? 'RCP en curso' : `Paro · a ${dc.toFixed(0)} m`) : 'Pulso presente';
  if (med.mode) renderMed();
}

/* ---------- ECG ---------- */
const ecgCtx = $('ecg').getContext('2d');
const ecgBuf = new Array(230).fill(0);
let ecgAcc = 0, ecgPhase = 0, ecgN = 0;
function ecgNormal(p) {
  if (p < 0.1) return Math.sin((p / 0.1) * Math.PI) * 0.12;
  if (p < 0.16) return 0; if (p < 0.18) return -0.12; if (p < 0.21) return 1; if (p < 0.24) return -0.25;
  if (p < 0.4) return 0; if (p < 0.55) return Math.sin(((p - 0.4) / 0.15) * Math.PI) * 0.22; return 0;
}
function stepEcg(dt) {
  ecgAcc += dt * 90;
  while (ecgAcc >= 1) {
    ecgAcc--; ecgN++;
    let v;
    if (S.t < flatUntil) v = (Math.random() - 0.5) * 0.02;
    else if (S.crisis) { const tt = ecgN / 90; v = 0.32 * Math.sin(tt * 31) + 0.26 * Math.sin(tt * 19 + 1.3) + 0.2 * (Math.random() - 0.5); }
    else { ecgPhase = (ecgPhase + crewV.hr / 60 / 90) % 1; v = ecgNormal(ecgPhase); }
    v += compBump * 0.9; compBump *= 0.6;
    ecgBuf.shift(); ecgBuf.push(v);
  }
  const w = 460, h = 108;
  ecgCtx.clearRect(0, 0, w, h);
  ecgCtx.strokeStyle = S.crisis ? '#ff453a' : '#f5f5f7'; ecgCtx.lineWidth = 2.4; ecgCtx.lineJoin = 'round';
  ecgCtx.beginPath();
  ecgBuf.forEach((v, i) => { const x = (i / (ecgBuf.length - 1)) * w, y = h * 0.62 - v * h * 0.45; i ? ecgCtx.lineTo(x, y) : ecgCtx.moveTo(x, y); });
  ecgCtx.stroke();
}

/* ---------- Loop ---------- */
const clock = new THREE.Clock();
camera.position.set(0, 1.7, 0);
function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (state === 'play') { S.t += dt; stepT += dt; }
  if (L) {
    if (state === 'play') movePlayer(dt);
    L.update(dt);
    if (state === 'play') logic(dt);
    if (state !== 'menu') stepEcg(dt);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
updateVoiceLabel();
tick();
