/* Simulation · 3D scene (three.js): Mars, the rover and the ship. Shares S and W with sim.js through window. */
import * as THREE from '../vendor/three.module.min.js';

const S = (window.S = { t: 0, collapsed: false, crisis: false, keys: {}, visorDust: 0, playing: false, camera: null, playerYaw: 0 });
const V3 = THREE.Vector3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const M = {
  white: mat(0xeeeeea, { roughness: 0.55 }), grey: mat(0x3a3c40, { roughness: 0.8 }), dark: mat(0x1b1c1f, { roughness: 0.9 }),
  gold: mat(0xc89a3c, { metalness: 1, roughness: 0.18 }), glow: mat(0x0a84ff, { emissive: 0x0a84ff, emissiveIntensity: 2 }),
  green: mat(0x30d158, { emissive: 0x30d158, emissiveIntensity: 0.6 }), panel: mat(0xe6e7e9, { roughness: 0.7 }), floor: mat(0x2b2d31, { roughness: 0.9 }),
};
const RED = new THREE.Color(0xff453a), BLUE = new THREE.Color(0x0a84ff), WHITE = new THREE.Color(0xffffff);

function box(parent, w, h, d, m, x, y, z) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); parent.add(b); return b; }

function makePerson({ helmet = true, suit = 0xeeeeea } = {}) {
  const g = new THREE.Group();
  const cloth = mat(suit, { roughness: helmet ? 0.55 : 0.8 });
  const rT = helmet ? 0.36 : 0.28;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(rT, 0.55, 6, 14), cloth); torso.position.y = 1.25; g.add(torso);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x0a84ff, emissive: 0x0a84ff, emissiveIntensity: 1.4 });
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(helmet ? 0.5 : 0.14, helmet ? 0.07 : 0.14, 0.02), stripeMat);
  stripe.position.set(helmet ? 0 : -0.1, 1.45, -(rT + 0.01)); g.add(stripe);
  if (helmet) {
    box(g, 0.6, 0.75, 0.32, M.white, 0, 1.35, 0.36);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), M.white); h.position.y = 1.9; g.add(h);
    const v = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16, Math.PI * 0.6, Math.PI * 0.8, Math.PI * 0.25, Math.PI * 0.45), M.gold);
    v.position.set(0, 1.9, -0.04); g.add(v);
  } else {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), mat(0xc28e6e, { roughness: 0.8 })); head.position.y = 1.78; g.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.168, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(0x2a1d16, { roughness: 0.9 }));
    hair.position.y = 1.79; hair.rotation.x = 0.35; g.add(hair);
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0.15 * s, 0.9, 0); g.add(hip);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(helmet ? 0.14 : 0.11, 0.6, 4, 10), cloth); leg.position.y = -0.45; hip.add(leg);
    legs.push(hip);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(helmet ? 0.11 : 0.085, 0.55, 4, 10), cloth);
    arm.position.set((rT + 0.12) * s, 1.25, 0); arm.rotation.z = 0.15 * s; g.add(arm);
  }
  g.userData = { stripe, legs };
  return g;
}
function setBadge(p, crit) { const c = crit ? RED : BLUE; p.userData.stripe.material.color.copy(c); p.userData.stripe.material.emissive.copy(c); }

function makeScreen(w, h) {
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round((512 * h) / w);
  const ctx = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  const draw = (title, lines = [], crit = false) => {
    const tr = window.i18n ? window.i18n.tr : (s) => s;
    title = tr(title); lines = lines.map(tr);
    ctx.fillStyle = crit ? '#3b0d0b' : '#0d0f13'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = crit ? '#ff453a' : '#0a84ff'; ctx.fillRect(0, 0, c.width, 8);
    ctx.fillStyle = '#f5f5f7'; ctx.font = '600 38px Geist, system-ui, sans-serif'; ctx.fillText(title, 26, 62);
    ctx.font = '26px Geist, system-ui, sans-serif'; ctx.fillStyle = 'rgba(245,245,247,.75)';
    lines.forEach((l, i) => ctx.fillText(l, 26, 108 + i * 38));
    tex.needsUpdate = true;
  };
  return { mesh, draw };
}

function makeSky(scene, top = 0x9c7766, hor = 0xe7b28c) {
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(hor) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6,0.0,1.0); gl_FragColor = vec4(mix(hor, top, pow(h,0.7)),1.0); }',
  }));
  scene.add(sky);
}

function makeDustTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const r = Math.random() * 2.4 + 0.3, px = Math.random() * 512, py = Math.random() * 512;
    const edge = Math.hypot(px - 256, py - 256) / 362;
    x.fillStyle = `rgba(150,82,48,${(0.15 + edge * 0.55) * Math.random()})`;
    x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
  }
  document.getElementById('dust').style.backgroundImage = `url(${c.toDataURL()})`;
}

/* ---------------- EVA en Marte ---------------- */
function buildMars(scene) {
  const FOG = new THREE.Color(0xd49c76);
  scene.fog = new THREE.Fog(FOG, 25, 230); scene.background = FOG.clone();
  makeSky(scene);
  scene.add(new THREE.HemisphereLight(0xf0c3a0, 0x5a2a18, 1.1));
  const sun = new THREE.DirectionalLight(0xfff0dd, 2.0); sun.position.set(50, 35, -80); scene.add(sun);
  const CR = { x: 70, z: -90, r: 26 };
  const heightAt = (x, z) => {
    let h = (vnoise(x * 0.02, z * 0.02) - 0.5) * 9 + (vnoise(x * 0.08, z * 0.08) - 0.5) * 2.2 + (vnoise(x * 0.3, z * 0.3) - 0.5) * 0.35;
    const d = Math.hypot(x - CR.x, z - CR.z) / CR.r;
    if (d < 1.4) h += d < 1 ? -6 * (1 - d * d) : 3 * Math.cos((d - 1) * 4);
    return h;
  };
  const geo = new THREE.PlaneGeometry(600, 600, 220, 220); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
  const cA = new THREE.Color(0xb5562f), cB = new THREE.Color(0x7a321c), cC = new THREE.Color(0xd08055), tc = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i); pos.setY(i, heightAt(x, z));
    const n = vnoise(x * 0.05, z * 0.05);
    tc.copy(cA).lerp(cB, clamp(n * 1.2 - 0.2, 0, 1)).lerp(cC, clamp(vnoise(x * 0.2, z * 0.2) - 0.6, 0, 0.4));
    col.set([tc.r, tc.g, tc.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 })));

  const P = { beacon: new V3(24, 0, -40), rover: new V3(-14, 0, 8), hab: new V3(-46, 0, 34) };
  const crewStart = new V3(20, 0, -32);
  [P.beacon, P.rover, P.hab, crewStart].forEach((v) => (v.y = heightAt(v.x, v.z)));
  const keep = [P.beacon, P.rover, P.hab, crewStart, new V3(0, 0, 0)];
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), mat(0x6e3420, { roughness: 0.95, flatShading: true }), 420);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(), p3 = new V3(); let n = 0;
  while (n < 420) {
    const x = (Math.random() - 0.5) * 360, z = (Math.random() - 0.5) * 360;
    if (keep.some((k) => Math.hypot(k.x - x, k.z - z) < 8)) continue;
    const s = Math.random() < 0.08 ? 1.2 + Math.random() * 1.6 : 0.15 + Math.random() * 0.55;
    q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, 0)); sc.set(s, s * 0.6, s * 0.9); p3.set(x, heightAt(x, z) + s * 0.2, z);
    rocks.setMatrixAt(n++, m4.compose(p3, q, sc));
  }
  scene.add(rocks);

  const roverLightMat = M.glow.clone();
  const rover = new THREE.Group();
  box(rover, 2.6, 1.4, 4.4, M.white, 0, 1.4, 0);
  box(rover, 2.3, 0.6, 1.2, M.dark, 0, 1.8, -2.0);
  box(rover, 2.7, 0.08, 4.5, roverLightMat, 0, 2.15, 0);
  for (const x of [-1.4, 1.4]) for (const z of [-1.5, 0, 1.5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16), M.dark); w.rotation.z = Math.PI / 2; w.position.set(x, 0.45, z); rover.add(w); }
  rover.position.copy(P.rover); rover.rotation.y = 0.6; scene.add(rover);

  const habLightMat = M.glow.clone();
  const hab = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.white); hab.add(dome);
  const ringL = new THREE.Mesh(new THREE.TorusGeometry(6.02, 0.08, 8, 48), habLightMat); ringL.rotation.x = Math.PI / 2; ringL.position.y = 0.6; hab.add(ringL);
  box(hab, 2, 2.4, 3, M.white, 0, 1.2, -6.5);
  hab.position.copy(P.hab); scene.add(hab);

  const bLightMat = M.glow.clone();
  const beacon = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), M.grey); pole.position.y = 1.1; beacon.add(pole);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), bLightMat); bulb.position.y = 2.25; beacon.add(bulb);
  beacon.position.copy(P.beacon); scene.add(beacon);

  const crew = makePerson({ helmet: true }); crew.position.copy(crewStart); crew.rotation.y = 0.4; scene.add(crew);

  const DN = 1400, dGeo = new THREE.BufferGeometry(), dPos = new Float32Array(DN * 3);
  for (let i = 0; i < DN * 3; i++) dPos[i] = (Math.random() - 0.5) * 60;
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dMat = new THREE.PointsMaterial({ color: 0xe8b08a, size: 0.06, transparent: true, opacity: 0.5, depthWrite: false });
  const dust = new THREE.Points(dGeo, dMat); scene.add(dust);
  makeDustTexture();

  const colliders = [{ p: P.rover, r: 2.8 }, { p: P.hab, r: 7.4 }];
  let fall = 0, storm = 0.12;
  const cp = new V3();
  return {
    mode: 'ground', eye: 1.72, crew,
    pts: { beacon: new V3(P.beacon.x, P.beacon.y + 1.6, P.beacon.z), rover: new V3(P.rover.x, P.rover.y + 2.6, P.rover.z), hab: new V3(P.hab.x, P.hab.y + 3, P.hab.z) },
    spawn: { x: 0, z: 0, yaw: Math.atan2(-P.beacon.x, -P.beacon.z) },
    floor: heightAt,
    crewPt: () => cp.set(crew.position.x, crew.position.y + (S.collapsed ? 0.7 : 1.6), crew.position.z),
    constrain(p) {
      for (const c of colliders) { const dx = p.x - c.p.x, dz = p.z - c.p.z, d = Math.hypot(dx, dz); if (d < c.r) { p.x = c.p.x + (dx / d) * c.r; p.z = c.p.z + (dz / d) * c.r; } }
      p.x = clamp(p.x, -280, 280); p.z = clamp(p.z, -280, 280);
    },
    conf: () => Math.round(Math.max(55, 99 - storm * 18 - S.visorDust * 20)),
    takeAed() {}, onCollapse() {}, onRosc() {},
    update(dt) {
      storm += ((S.crisis ? 0.75 : 0.18) - storm) * dt * 0.05;
      if (S.playing) S.visorDust = clamp(S.visorDust + (S.keys.KeyR ? -dt * 0.9 : dt * storm * 0.022), 0, 0.85);
      document.getElementById('dust').style.opacity = (S.visorDust * 0.95).toFixed(3);
      scene.fog.near = 25 - storm * 18; scene.fog.far = 230 - storm * 150;
      dMat.opacity = 0.3 + storm * 0.6;
      const c = S.camera.position;
      for (let i = 0; i < DN; i++) {
        let x = dPos[i * 3] + dt * (2 + storm * 9), y = dPos[i * 3 + 1] - dt * 0.2, z = dPos[i * 3 + 2] + dt * storm * 3;
        if (x - c.x > 30) x -= 60; if (x - c.x < -30) x += 60;
        if (z - c.z > 30) z -= 60; if (z - c.z < -30) z += 60;
        if (y - c.y < -6) y += 14;
        dPos[i * 3] = x; dPos[i * 3 + 1] = y; dPos[i * 3 + 2] = z;
      }
      dGeo.attributes.position.needsUpdate = true;
      bLightMat.emissiveIntensity = 1 + Math.sin(S.t * 4) * 1.2;
      const ac = S.crisis ? RED : BLUE;
      for (const m of [roverLightMat, habLightMat]) { m.color.copy(ac); m.emissive.copy(ac); m.emissiveIntensity = S.crisis ? 2 + Math.sin(S.t * 10) * 2 : 1.5; }
      fall += ((S.collapsed ? 1 : 0) - fall) * dt * 3;
      crew.rotation.x = (fall * Math.PI) / 2;
      crew.position.y = heightAt(crew.position.x, crew.position.z) + fall * 0.38;
      if (!S.collapsed) crew.rotation.y += dt * 0.15 * Math.sin(S.t * 0.3);
    },
  };
}

/* ---------------- Rover presurizado ---------------- */
function buildRover(scene) {
  const SKY = new THREE.Color(0xd8a27c);
  scene.background = SKY; scene.fog = new THREE.Fog(SKY, 30, 190);
  makeSky(scene);
  scene.add(new THREE.HemisphereLight(0xf0c3a0, 0x5a2a18, 0.9));
  const sunL = new THREE.DirectionalLight(0xfff0dd, 1.8); sunL.position.set(30, 40, -20); scene.add(sunL);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  for (const z of [-1, 2.4]) { const l = new THREE.PointLight(0xfff4e8, 4, 9, 1.2); l.position.set(0, 2.1, z); scene.add(l); }

  const outside = new THREE.Group(); scene.add(outside);
  const circ = (z) => { const a = (z / 100) * Math.PI * 2; return [Math.cos(a) * 4, Math.sin(a) * 4]; };
  const gH = (x, z) => {
    if (Math.abs(x) < 5) return -1.05;
    const [c, s] = circ(z); const e = Math.min(1, (Math.abs(x) - 5) / 30);
    return -1.05 + e * ((vnoise(x * 0.06 + c, s) - 0.3) * 6 + Math.abs(x) * 0.03);
  };
  const gGeo = new THREE.PlaneGeometry(360, 400, 120, 160); gGeo.rotateX(-Math.PI / 2); gGeo.translate(0, 0, -100);
  const gp = gGeo.attributes.position, gc = new Float32Array(gp.count * 3);
  const cA = new THREE.Color(0xb5562f), cB = new THREE.Color(0x7a321c), tc = new THREE.Color();
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i); gp.setY(i, gH(x, z));
    const [c, s] = circ(z);
    tc.copy(cA).lerp(cB, clamp(vnoise(x * 0.15 + c * 3, s * 3) * 1.2 - 0.2, 0, 1));
    if (Math.abs(Math.abs(x) - 1.3) < 0.5) tc.multiplyScalar(0.8);
    gc.set([tc.r, tc.g, tc.b], i * 3);
  }
  gGeo.setAttribute('color', new THREE.BufferAttribute(gc, 3)); gGeo.computeVertexNormals();
  outside.add(new THREE.Mesh(gGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 })));
  const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), mat(0x6e3420, { roughness: 0.95, flatShading: true }), 800);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(), p3 = new V3(); let n = 0;
  for (let i = 0; i < 200; i++) {
    let x = (Math.random() - 0.5) * 300; if (Math.abs(x) < 7) x += x < 0 ? -7 : 7;
    const z0 = Math.random() * 100, s = Math.random() < 0.1 ? 1 + Math.random() * 1.8 : 0.2 + Math.random() * 0.6;
    q.setFromEuler(new THREE.Euler(Math.random() * 3, Math.random() * 3, 0)); sc.set(s, s * 0.6, s * 0.9);
    for (const k of [-3, -2, -1, 0]) { const z = z0 + k * 100; p3.set(x, gH(x, z) + s * 0.2, z); rk.setMatrixAt(n++, m4.compose(p3, q, sc)); }
  }
  outside.add(rk);
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    const m = new THREE.Mesh(new THREE.ConeGeometry(20 + Math.random() * 30, 10 + Math.random() * 18, 7), mat(0x9a5235, { roughness: 1, flatShading: true }));
    m.position.set(side * (110 + Math.random() * 80), -2, -40 - Math.random() * 220); scene.add(m);
  }

  const cab = new THREE.Group(); scene.add(cab);
  const W = 1.35;
  box(cab, 2.7, 0.1, 8.2, M.floor, 0, -0.05, 0);
  box(cab, 2.7, 0.1, 8.2, M.panel, 0, 2.4, 0);
  for (const s of [-1, 1]) {
    box(cab, 0.1, 1.0, 8.2, M.panel, s * W, 0.5, 0);
    box(cab, 0.1, 0.55, 8.2, M.panel, s * W, 2.12, 0);
    for (const z of [-4, -2.6, -1.2, 0.2, 1.6, 3, 4]) box(cab, 0.1, 0.9, 0.22, M.panel, s * W, 1.45, z);
  }
  box(cab, 2.7, 1.0, 0.1, M.panel, 0, 0.5, -4.1);
  box(cab, 2.7, 0.3, 0.1, M.panel, 0, 2.25, -4.1);
  box(cab, 0.12, 1.1, 0.1, M.panel, 0, 1.55, -4.1);
  box(cab, 2.7, 2.5, 0.1, M.panel, 0, 1.2, 4.1);
  box(cab, 0.9, 1.7, 0.02, M.grey, -0.5, 0.95, 4.04);
  box(cab, 2.5, 0.22, 0.7, M.dark, 0, 0.95, -3.7);
  for (const s of [-1, 1]) {
    box(cab, 0.6, 0.12, 0.6, M.grey, s * 0.6, 0.5, -2.8);
    box(cab, 0.6, 0.85, 0.1, M.grey, s * 0.6, 0.95, -2.45);
    box(cab, 0.14, 0.45, 0.14, M.dark, s * 0.6, 0.22, -2.8);
    box(cab, 0.5, 0.55, 3.4, M.grey, s * 1.05, 0.27, 2.0);
  }
  const stripMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.1 });
  box(cab, 0.25, 0.03, 6.5, stripMat, 0, 2.34, 0);
  const dash = makeScreen(1.0, 0.5); dash.mesh.position.set(0, 1.28, -3.62); dash.mesh.rotation.x = -0.55; cab.add(dash.mesh);
  const side = makeScreen(0.8, 0.45); side.mesh.position.set(1.29, 1.45, -0.6); side.mesh.rotation.y = -Math.PI / 2; cab.add(side.mesh);
  const filt = makeScreen(0.7, 0.4); filt.mesh.position.set(0.55, 1.5, 4.04); filt.mesh.rotation.y = Math.PI; cab.add(filt.mesh);
  box(cab, 0.7, 0.5, 0.06, M.grey, 0.55, 0.98, 4.03);
  const aed = new THREE.Group(); box(aed, 0.08, 0.5, 0.42, M.green, 0, 0, 0); box(aed, 0.02, 0.36, 0.3, M.white, 0.05, 0, 0);
  aed.position.set(-1.27, 1.35, 0.9); cab.add(aed);

  const crew = makePerson({ helmet: false, suit: 0x51627a });
  const seat = new V3(-0.6, -0.36, -2.8), floorPos = new V3(0, 0.27, -1.7);
  crew.position.copy(seat); crew.userData.legs.forEach((l) => (l.rotation.x = Math.PI / 2)); scene.add(crew);

  let speed = 6, target = 6, fall = 0, filter = 31;
  dash.draw('Kestrel · ruta 14', ['Velocidad 22 km/h', 'Destino: base Jezero · 38 km', 'Luis: signos normales']);
  side.draw('Tripulación', ['Luis · 74 lpm · 98%', 'Tomás · 88 lpm', 'Tesai: monitoreando']);
  filt.draw('Filtro de regolito', ['Vida útil 31%', 'Cambiar ahora'], true);
  const cp = new V3(), fp = new V3();
  const L = {
    mode: 'cabin', eye: 1.62, crew, shake: 0,
    pts: { filter: new V3(0.55, 1.5, 3.9), aed: new V3(-1.2, 1.35, 0.9) },
    spawn: { x: 0, z: 2.9, yaw: 0 },
    floor: () => 0,
    crewPt: () => (S.collapsed ? cp.set(0, 0.45, -0.45) : cp.set(-0.6, 1.4, -2.8)),
    constrain(p) {
      p.z = Math.min(3.65, p.z);
      const xm = p.z > 0.25 ? 0.72 : 1.1; p.x = clamp(p.x, -xm, xm);
      p.z = Math.max(Math.abs(p.x) > 0.25 ? -2.15 : -3.25, p.z);
    },
    conf: () => 99,
    info: () => ['Velocidad', speed > 0.2 ? `${Math.round(speed * 3.6)} km/h` : 'Detenido'],
    filter: () => filter,
    changeFilter() { filter = 100; filt.draw('Filtro de regolito', ['Vida útil 100%', 'Cambiado por Tomás']); },
    takeAed() { aed.visible = false; },
    onCollapse() {
      target = 0;
      dash.draw('ALERTA · LUIS', ['Paro cardíaco detectado', 'Rover detenido por Tesai', 'Tierra avisada (+20 min)'], true);
      side.draw('ALERTA · LUIS', ['Sin pulso · FV', 'DEA: pared izquierda'], true);
    },
    onRosc() {
      dash.draw('Luis · pulso recuperado', ['Monitoreo continuo', 'Registro enviado a la Tierra']);
      side.draw('Luis · estable', ['Pulso presente', 'Tesai sigue vigilando']);
    },
    update(dt) {
      speed += (target - speed) * dt * (target ? 0.5 : 1.3);
      outside.position.z += speed * dt; if (outside.position.z > 100) outside.position.z -= 100;
      L.shake = speed / 6;
      if (!S.collapsed && filter > 12) filter -= dt * 0.08;
      fall += ((S.collapsed ? 1 : 0) - fall) * dt * 2.5;
      crew.position.lerpVectors(seat, floorPos, fall);
      crew.rotation.x = (fall * Math.PI) / 2;
      crew.userData.legs.forEach((l) => (l.rotation.x = ((1 - fall) * Math.PI) / 2));
      if (S.crisis) { stripMat.emissive.copy(WHITE).lerp(RED, 0.5 + Math.sin(S.t * 8) * 0.5); } else stripMat.emissive.copy(WHITE);
    },
  };
  void fp;
  return L;
}

/* ---------------- Nave en tránsito ---------------- */
function buildShip(scene) {
  scene.background = new THREE.Color(0x020306); scene.fog = null;
  const SN = 2500, sGeo = new THREE.BufferGeometry(), sPos = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) { const v = new V3().randomDirection().multiplyScalar(450); sPos.set([v.x, v.y, v.z], i * 3); }
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  scene.add(new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false })));
  const mars = new THREE.Mesh(new THREE.SphereGeometry(9, 48, 24), mat(0xb4532a, { roughness: 1 })); mars.position.set(5, 3, -420); scene.add(mars);
  const sunL = new THREE.DirectionalLight(0xffffff, 2.0); sunL.position.set(-1, 0.4, 0.3); scene.add(sunL);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a96a8, 0.7));
  for (const z of [-5, 0, 5]) { const pl = new THREE.PointLight(0xffffff, 3, 9, 1.2); pl.position.set(0, 1.0, z); scene.add(pl); }

  const H = 1.45, LEN = 15.2;
  box(scene, 2.9, 0.1, LEN, M.panel, 0, -H, 0); box(scene, 2.9, 0.1, LEN, M.panel, 0, H, 0);
  box(scene, 0.1, 2.9, LEN, M.panel, -H, 0, 0); box(scene, 0.1, 2.9, LEN, M.panel, H, 0, 0);
  const rackA = mat(0xd5d7da, { roughness: 0.75 }), rackB = mat(0xc4c7cc, { roughness: 0.75 });
  let k = 0;
  for (let z = -6.6; z <= 6.7; z += 1.1, k++) {
    const m = k % 2 ? rackA : rackB;
    box(scene, 2.4, 0.05, 1.0, m, 0, -H + 0.07, z); box(scene, 2.4, 0.05, 1.0, m, 0, H - 0.07, z);
    box(scene, 0.05, 2.4, 1.0, m, -H + 0.07, 0, z); box(scene, 0.05, 2.4, 1.0, m, H - 0.07, 0, z);
  }
  const stripMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2 });
  for (const [x, y] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { const s = box(scene, 0.12, 0.12, LEN - 0.4, stripMat, x, y, 0); s.rotation.z = Math.PI / 4; }
  const railMat = mat(0x9ea3aa, { roughness: 0.4, metalness: 0.3 });
  for (const [x, y] of [[-1.3, 0.5], [1.3, -0.5], [0.5, 1.3], [-0.5, -1.3]]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, LEN - 1, 8), railMat); r.rotation.x = Math.PI / 2; r.position.set(x, y, 0); scene.add(r);
  }
  const shape = new THREE.Shape(); shape.moveTo(-H, -H); shape.lineTo(H, -H); shape.lineTo(H, H); shape.lineTo(-H, H); shape.lineTo(-H, -H);
  const hole = new THREE.Path(); hole.absarc(0, 0.1, 0.75, 0, Math.PI * 2, true); shape.holes.push(hole);
  const front = new THREE.Mesh(new THREE.ShapeGeometry(shape, 48), new THREE.MeshStandardMaterial({ color: 0xe4e5e7, roughness: 0.7, side: THREE.DoubleSide }));
  front.position.z = -LEN / 2; scene.add(front);
  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.77, 0.05, 12, 48), M.grey); frame.position.set(0, 0.1, -LEN / 2 + 0.02); scene.add(frame);
  box(scene, 2.9, 2.9, 0.1, M.panel, 0, 0, LEN / 2);
  const hatch = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 12, 40), M.grey); hatch.position.set(0, 0, LEN / 2 - 0.06); scene.add(hatch);

  const lab = makeScreen(0.9, 0.5); lab.mesh.position.set(-1.36, 0.25, -4.5); lab.mesh.rotation.y = Math.PI / 2; scene.add(lab.mesh);
  const stat = makeScreen(0.9, 0.5); stat.mesh.position.set(1.36, 0.25, 1.2); stat.mesh.rotation.y = -Math.PI / 2; scene.add(stat.mesh);
  lab.draw('Laboratorio · cultivo 7', ['Muestra lista para registrar', 'Temp 22.4 °C']);
  stat.draw('Hermes · día 96', ['Mei · 72 lpm · 98%', 'Tomás · 86 lpm', 'Tierra a 12 min 30 s']);
  const aed = new THREE.Group(); box(aed, 0.1, 0.45, 0.4, M.green, 0, 0, 0); box(aed, 0.02, 0.32, 0.28, M.white, -0.06, 0, 0);
  aed.position.set(1.36, -0.3, -2.2); scene.add(aed);
  box(scene, 0.62, 0.06, 1.9, mat(0x4a5a72, { roughness: 0.8 }), 0, -1.36, 4.3);
  for (const z of [3.7, 4.3, 4.9]) box(scene, 0.66, 0.02, 0.08, M.dark, 0, -1.32, z);
  box(scene, 0.5, 0.04, 0.04, M.grey, 0, -1.3, 5.35);

  const crew = new THREE.Group(); const body = makePerson({ helmet: false, suit: 0x56657d }); body.position.y = -1.0; crew.add(body);
  crew.userData = body.userData;
  crew.position.set(-0.75, 0.05, -4.3); crew.rotation.set(0, Math.PI / 2 - 0.2, 0.08); scene.add(crew);
  let mstate = 'idle';
  const drift = new V3(-0.2, -0.1, -3.4), fixPos = new V3(0, -1.05, 4.3), tmp = new V3(), f3 = new V3();
  const lyingQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  return {
    mode: 'zeroG', eye: 0, crew,
    pts: { lab: new V3(-1.2, 0.25, -4.5), aed: new V3(1.2, -0.3, -2.2), cmrs: new V3(0, -0.9, 4.3) },
    spawn: { x: 0, y: 0.1, z: 6.2, yaw: 0 },
    floor: () => 0,
    crewPt: () => crew.position,
    constrain(p, v) {
      const m = 1.12;
      for (const a of ['x', 'y']) { if (p[a] > m) { p[a] = m; if (v) v[a] = 0; } if (p[a] < -m) { p[a] = -m; if (v) v[a] = 0; } }
      if (p.z > 7.2) { p.z = 7.2; if (v) v.z = 0; } if (p.z < -7.2) { p.z = -7.2; if (v) v.z = 0; }
    },
    conf: () => 99,
    info: () => ['Tránsito', 'Día 96 · 225 M km'],
    takeAed() { aed.visible = false; },
    carry() { mstate = 'carried'; },
    fix() { mstate = 'fixed'; },
    onCollapse() {
      mstate = 'limp';
      lab.draw('ALERTA · MEI', ['Paro cardíaco detectado', 'Tierra avisada (+12 min)'], true);
      stat.draw('ALERTA · MEI', ['Sin pulso · FV', 'DEA: rack verde', 'Camilla: fondo del módulo'], true);
    },
    onRosc() {
      lab.draw('Mei · pulso recuperado', ['Monitoreo continuo']);
      stat.draw('Mei · estable', ['Pulso presente', 'Registro enviado a la Tierra']);
    },
    update(dt) {
      const t = S.t;
      if (mstate === 'idle') { crew.position.y = 0.05 + Math.sin(t * 0.8) * 0.04; crew.rotation.z = 0.08 + Math.sin(t * 0.5) * 0.03; }
      else if (mstate === 'limp') { crew.rotation.x += dt * 0.18; crew.rotation.z += dt * 0.07; crew.position.lerp(drift, dt * 0.15); }
      else if (mstate === 'carried') {
        const cam = S.camera; f3.set(0, 0, -1).applyQuaternion(cam.quaternion);
        tmp.copy(cam.position).addScaledVector(f3, 1.15); tmp.y -= 0.35;
        crew.position.lerp(tmp, dt * 4); crew.quaternion.slerp(lyingQ, dt * 2);
      } else if (mstate === 'fixed') { crew.position.lerp(fixPos, dt * 4); crew.quaternion.slerp(lyingQ, dt * 4); }
      if (S.crisis) stripMat.emissive.copy(WHITE).lerp(RED, 0.5 + Math.sin(t * 8) * 0.5); else stripMat.emissive.copy(WHITE);
    },
  };
}

window.W = { THREE, buildMars, buildRover, buildShip, setBadge };
