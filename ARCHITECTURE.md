# Tesai · Architecture

**Tesai** es el prototipo de *health twin* para astronautas de Team Higía (NASA Space Apps Challenge 2026). Este documento describe la arquitectura del frontend modular que reemplazó el monolito original de ~3700 líneas.

> **Nota de estructura:** Tesai vive ahora en `src/tesai/`. Las rutas cortas de módulos (`js/...`, `styles/...`) de este documento son relativas a esa carpeta. El sitio completo (web central + simulación + Tesai) está descrito en `src/README.md`.
>
> Sin bundler, sin framework. Solo HTML, CSS y ES modules nativos del browser. Desplegable en Vercel con un solo `vercel.json` (o en cualquier hosting estático).

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Árbol de archivos](#2-árbol-de-archivos)
3. [Sistema de diseño (CSS)](#3-sistema-de-diseño-css)
4. [Módulos JS](#4-módulos-js)
5. [Flujo de datos](#5-flujo-de-datos)
6. [Sistema de alertas](#6-sistema-de-alertas)
7. [Cómo agregar una fuente de datos real](#7-cómo-agregar-una-fuente-de-datos-real)
8. [Despliegue y seguridad](#8-despliegue-y-seguridad)
9. [Convenciones](#9-convenciones)
10. [Mejoras recomendadas](#10-mejoras-recomendadas-auditoría-del-15-de-noviembre-de-2026)

---

## 1. Visión general

```
Browser
  └── src/tesai/index.html
        ├── <link> × 16 archivos CSS
        └── <script type="module" src="js/app.js">
              └── importa todo el grafo de módulos
```

El HTML es solo estructura semántica. Ninguna página del sitio tiene `<script>` inline, lo que permite una CSP con `script-src 'self'`.
El CSS está organizado en capas (`tokens → base → layout → components`).
El JS usa ES modules estáticos; el browser los resuelve sin bundler.

---

## 2. Árbol de archivos

```
astronauts-health-monitor/
├── vercel.json                     Publica src/, caché de assets y cabeceras de seguridad (CSP incluida)
├── tools/twin/                     Geometría de la figura (no se despliega): build.mjs, scene.mjs, stand.mjs, suit.mjs, overlays/, kit/
├── react/astronaut/                El astronauta como componentes React/Next.js (no se despliega ni lo usa el dashboard); ver su README
└── src/
    ├── index.html                  Web central: portada, el problema, la app, cómo funciona, sensores, accesos, equipo
    ├── main.js                     Textos ES/EN de la portada, guía de sensores y video del Visor
    ├── styles.css                  Estilos de la portada
    ├── shared/                     Lo común a las tres páginas
    │   ├── tokens.css              Colores, superficies, tipografía y sombras (única fuente de color)
    │   ├── fonts.css · buttons.css Tipografías locales y botones
    │   ├── lang.js                 Un solo idioma para todo el sitio (TesaiLang, guardado en tesai.lang)
    │   └── site-bar.js · .css      Barra superior: <tesai-brand> y <tesai-lang>
    ├── assets/
    │   ├── fonts/                  Plus Jakarta Sans y JetBrains Mono (woff2, servidas localmente)
    │   ├── logo/                   Logo, favicon y variantes
    │   ├── tesai/                  Capturas y video del Visor usados en la portada (ES y EN)
    │   └── hero.webp, astronaut.webp
    ├── simulacion/                 Simulación inmersiva en primera persona (3 escenarios, con voz)
    │   ├── index.html              Solo estructura
    │   ├── styles.css              Estilos de la escena, el HUD y los menús
    │   ├── js/i18n.js              Textos ES/EN (script clásico)
    │   ├── js/scene.js             Escena 3D con three.js: Marte, el rover y la nave
    │   ├── js/sim.js               Bucle, escenarios, guía de Tesai y HUD
    │   ├── vendor/                 three.js 0.170.0 (MIT), incluido para funcionar sin conexión
    │   └── img/                    eva.webp, rover.webp, ship.webp
    └── tesai/                      La app Tesai (las rutas src/... del resto del documento son relativas a esta carpeta)
        ├── index.html                  HTML puro de Tesai (~580 líneas)
        ├── assets/
        │   ├── human.png               Astronauta original (traje crema, visor verde): la figura del Overview
        │   ├── visor/                  Fondos del Visor (ship.webp, rover.webp)
        │   └── wearables/              Dibujos isométricos de los dispositivos (Biometría)
        ├── styles/
        │   ├── base.css                Reset, body, utilidades
        │   ├── layout.css              Views, grids, stage, twin
        │   ├── responsive.css          Todos los @media del panel, cargado al final
        │   └── components/
        │       ├── nav.css
        │       ├── cards.css
        │       ├── badges.css
        │       ├── drawer.css
        │       ├── toasts.css
        │       ├── lists.css
        │       ├── charts.css
        │       ├── forms.css
        │       ├── evidence.css
        │       ├── visor.css               Visor: HUD de vidrio en primera persona (mismo lenguaje que la simulación)
        │       ├── wearables.css           Dispositivos de Biometría
        │       ├── checkin.css             Chequeo diario (escalas 0–10, tira de 14 días)
        │       └── twin.css                Astronauta: placa, figura, vista 360°, barrido y overlays de métricas
        └── js/
            ├── app.js                  Entry point: bootstrap, main loop, alert processing
            ├── config.js               SCHEMA, CONFIG, METRICS, LEVELS, CREDITS, ENV_META
            ├── utils.js                Helpers puros (clamp, uid, fmtTime, …)
            ├── rules.js                RulesEngine: lecturas → niveles de semáforo
            ├── state.js                Estado mutable global + ciclo de vida de alertas
            ├── i18n.js                 I18N: ES_DICT, ES_PATTERNS, traducción del DOM
            ├── evidence.js             SOURCES (APA), EVIDENCE, helpers de rendering
            ├── checkin.js              Chequeo diario privado: ítems, almacenamiento local, comparación con la propia historia
            ├── audio.js                Audio incorporado: tonos de aviso y voz (Web Audio + speech synthesis)
            ├── guidance.js             Segundo doctor: guías paso a paso por aviso, EN/ES
            ├── twin/
            │   ├── twin.js             Componente público: createTwin(root) → update(props), scan(), destroy()
            │   ├── astronaut.js        Figura en uso: assets/human.png + capas para overlays; anchorOf(metric)
            │   ├── figure.js           Dibujo isométrico generado + bucle de overlays (conservado, sin uso)
            │   ├── plate.js            Placa: Fig 1, título y línea de lectura
            │   ├── spin.js             Vista 360°: caja con perspectiva que gira
            │   ├── scan.js             Barrido de escaneo
            │   ├── art.js              GENERADO por tools/twin/build.mjs (SVG estático + datos de overlays)
            │   └── overlays/           index.js (registro métrica → overlay), heart.js (frecuencia cardíaca)
            ├── providers/
            │   ├── base.js             Clase abstracta DataProvider
            │   ├── dataset.js          DatasetProvider (fuente por defecto): reproduce data/mmash.json, bidsleep.json y osdr-eda.json
            │   ├── simulated.js        SimulatedProvider (circadian, AR(1), eventos)
            │   ├── remote.js           RemoteProvider skeleton (fetch + retries + caché)
            │   ├── file.js             FileProvider (CSV / JSON importado por el usuario)
            │   └── adapters.js         Normalizer, Adapters, validateVital, parseCsv
            └── ui/
                ├── icons.js            ICONS (27 SVG), LV_ICON
                ├── helpers.js          $ $$ setHtml setText pillHtml chartInner download …
                ├── toasts.js           showToast, dismissToast, closeToastFor
                ├── checkin.js          Vista del chequeo diario (formulario, tendencia, CO₂)
                ├── visor.js            Vista Visor: HUD en primera persona, aviso de situación, segundo doctor
                ├── wearables.js        Dispositivos que se separan en piezas (Biometría)
                └── ui.js               Objeto UI: todas las funciones de render y navegación
```

---

## 3. Sistema de diseño (CSS)

### Orden de carga

```html
shared/tokens.css   →  base.css   →  layout.css   →  components/*.css
```

Cada capa solo lee variables de las capas anteriores; nunca define colores literales fuera de `shared/tokens.css`.

### Tokens (variables CSS)

Todas las variables viven en `:root` dentro de `src/shared/tokens.css`, que usan la landing, el simulador y el panel. Cambiar el tema = editar solo ese archivo.

| Grupo | Variables |
|---|---|
| Paleta base | `--color-white`, `--color-bg`, `--color-ink`, `--color-teal`, `--color-deep`, `--color-aqua`, … |
| Semáforo | `--color-ok`, `--color-warn`, `--color-crit`, `--color-sensor`, `--color-none`, sus variantes `-ink` y `-soft` |
| Superficies | `--glass`, `--glass-2`, `--glass-3`, `--line`, `--line-2`, `--tint` |
| Gradientes | `--grad-brand`, `--grad-accent`, `--grad-dark`, `--grad-page` |
| Sombras | `--shadow-s`, `--shadow-m`, `--shadow-l`, `--shadow-dark` |
| Charts y twin | `--chart-line`, `--band-ok`, `--band-warn`, `--band-crit`, `--twin-body` |
| Tipografía | `--font-ui`, `--font-mono`, `--fs-xs` … `--fs-hero` |
| Forma y movimiento | `--r-pill` … `--r-sm`, `--ease` |

### Vinculación de nivel (data-level)

Los colores de semáforo se aplican a través del atributo `data-level` en el HTML. Cada valor activa `--lv`, `--lv-ink` y `--lv-bg`:

```css
[data-level="normal"]    { --lv: var(--color-ok);     --lv-ink: …; --lv-bg: … }
[data-level="attention"] { --lv: var(--color-warn);   --lv-ink: …; --lv-bg: … }
[data-level="surgeon"]   { --lv: var(--color-crit);   --lv-ink: …; --lv-bg: … }
[data-level="sensor"]    { --lv: var(--color-sensor); --lv-ink: …; --lv-bg: … }
[data-level="partial"],
[data-level="nodata"]    { --lv: var(--color-none);   --lv-ink: …; --lv-bg: … }
```

El estado nunca depende solo del color: siempre hay un `.lvdot` (punto) + texto de nivel junto al indicador.

---

## 4. Módulos JS

### Grafo de dependencias

```
app.js (entry point)
  ├── config.js        (sin dependencias)
  ├── utils.js         (sin dependencias)
  ├── rules.js         → config.js
  ├── state.js         → config.js, utils.js, rules.js
  ├── i18n.js          (importado dinámicamente en main())
  ├── evidence.js      → utils.js
  ├── checkin.js       → config.js, utils.js
  ├── audio.js         → state.js
  ├── guidance.js      → config.js, state.js, i18n.js
  ├── providers/
  │   ├── base.js      (sin dependencias)
  │   ├── simulated.js → base.js, config.js, utils.js, adapters.js
  │   ├── remote.js    → base.js, config.js, adapters.js
  │   ├── file.js      → base.js, config.js, utils.js, adapters.js
  │   └── adapters.js  → config.js, utils.js
  └── ui/
      ├── icons.js     (sin dependencias)
      ├── helpers.js   → config.js, utils.js, state.js
      ├── toasts.js    → state.js, ui/icons.js
      ├── checkin.js   → helpers.js, toasts.js, utils.js, state.js, checkin.js
      ├── visor.js     → helpers.js, icons.js, toasts.js, config.js, utils.js,
      │                   state.js, audio.js, guidance.js
      └── ui.js        → helpers.js, icons.js, toasts.js, config.js,
                          utils.js, state.js, rules.js, i18n.js,
                          evidence.js, ui/visor.js, audio.js, guidance.js,
                          ui/checkin.js, twin/twin.js,
                          app.js  ← (importa refreshSecondary,
                                                   startProvider, runAlertAction)
```

La única referencia circular es `ui.js → app.js` y `app.js → ui.js`. ES modules resuelven ciclos mediante **binding laziness**: los valores se leen en tiempo de llamada, no en tiempo de importación, por lo que no hay problema siempre que ningún módulo use el valor del otro en el top-level (y no lo hacen).

### Responsabilidades por módulo

| Módulo | Responsabilidad |
|---|---|
| `config.js` | Fuente de verdad única para tipos de datos, umbrales, configuración y créditos. Sin side effects. |
| `utils.js` | Funciones puras sin estado: `clamp`, `round`, `uid`, `dayKey`, `fmtTime`, `esc`, `makeRng`. |
| `rules.js` | `RulesEngine` convierte lecturas en niveles. No conoce el DOM ni el estado global. |
| `state.js` | Todo el estado mutable vive aquí (`State`). Exporta funciones de ciclo de vida de alertas, misiones y puntos. Sin acceso al DOM. |
| `i18n.js` | `I18N` traduce el DOM del inglés al español en tiempo de ejecución usando `ES_DICT` y `ES_PATTERNS`. |
| `evidence.js` | `SOURCES` (APA), `EVIDENCE` (basis + nota + refs por dato). Helpers que generan el botón "!" y el popup de fuentes. |
| `providers/base.js` | Interfaz abstracta `DataProvider` con `getCrew`, `getVitals`, `subscribeVitals`, `getEnvironment`, `getDevices`, `getSleepActivity`, `pushEvent`, `destroy`. |
| `providers/simulated.js` | Genera datos fisiológicos sintéticos con un modelo circadiano + AR(1) + eventos inyectables. Seed determinístico. |
| `providers/remote.js` | Skeleton para una API REST con `fetchJson` (timeout, retries, caché TTL). Listo para implementar. |
| `providers/file.js` | Reproduce en tiempo real un CSV o JSON importado por el usuario. |
| `providers/adapters.js` | `Normalizer` valida y limpia cualquier dato antes de que llegue al motor de reglas. `Adapters` mapea formatos externos al `SCHEMA`. |
| `ui/icons.js` | 27 íconos SVG exportados como strings. Trazo de 2 px, estilo Lucide. Sin emojis. |
| `ui/helpers.js` | Helpers de DOM (`$`, `$$`, `setHtml`, `setText`) y de rendering (`pillHtml`, `chartInner`, `fmtVal`, `download`). |
| `ui/toasts.js` | Toast system: cola de máximo 4, auto-dismiss, toasts persistentes para alertas críticas. |
| `checkin.js` | Chequeo diario: ítems (escalas 0–10 en la misma dirección, con período), guardado en `localStorage` con clave propia (`tesai.checkin.v1`), historial simulado rotulado para la demo y regla de comparación con la propia historia. **No** alimenta al `RulesEngine`, no abre alertas y no da puntos. |
| `ui/checkin.js` | `CheckinUI`: formulario, panel "Quién ve esto", tira de 14 días por ítem y cruce de síntomas con el CO₂ de cabina (promedio de 30 min convertido a mmHg con la presión de cabina). |
| `ui/ui.js` | Objeto `UI`: inicialización, navegación, todas las funciones de render (strip, stage, cards, drawer, vistas, misiones, score). Al astronauta solo le pasa props (`syncTwin()`, botones 360° y escaneo); el dibujo vive en `twin/`. |
| `twin/twin.js` | Componente del astronauta: todo el centro del escenario. `createTwin(root)` monta, dentro de `#twin`, la placa, la caja de giro, la figura y el barrido; devuelve `update(props)`, `scan()` (promesa que termina con el barrido) y `destroy()`. No lee `State`: `UI.syncTwin()` le pasa `{ metrics, focus, pinned, motion }` y el botón 360° le pasa `{ spin }`. Reexporta `anchorOf(metric)`, el punto del cuerpo donde termina la línea de cada tarjeta. El botón, la etiqueta "Scanning…", el toast y `#stage.spinning` (que atenúa tarjetas y líneas) siguen en `ui.js`. |
| `twin/astronaut.js` | Figura en uso: el astronauta original (`assets/human.png`), montado como en el primer diseño (todo el escenario, centrado, opacidad 0,95). Define `FIGURE`, `ANCHORS` (puntos del cuerpo en píxeles de la imagen, 1920 × 1080) y `anchorOf`. Expone las capas `defs`, `body`, `live` y `overlays` para superposiciones futuras sobre el traje, que nunca se abre; su registro de overlays está vacío. Misma interfaz que `figure.js`. |
| `twin/figure.js` | **Sin uso, conservado** (volver a usarlo es cambiar un import en `twin.js`). Dibujo isométrico (`art.js`) y bucle de animación de los overlays (solo corre con la figura visible y la pestaña al frente). Avisa a la placa cuando cambia la línea de lectura. Define `FIGURE` y `anchorOf`. |
| `twin/plate.js`, `twin/spin.js`, `twin/scan.js` | Placa con título y lectura; caja con perspectiva para la vista 360°; barrido de escaneo (3,2 s, con su propio degradado y máscara; el brillo usa `#tz-glow`, compartido con los gráficos). |
| `twin/overlays/index.js` | Registro métrica → overlay. Hoy solo `hr`. Cada overlay implementa `mount(ctx) → { update, tick, readout }`. |
| `twin/overlays/heart.js` | Frecuencia cardíaca en vivo: aguja del dial, lámpara, traza en el display del pecho y, al enfocar la métrica, la mirilla del pecho que se abre sobre el corazón latiendo. Un único acumulador de fase (`fase += dt × bpm / 60`). |
| `twin/art.js` | **Generado** por `node tools/twin/build.mjs` (no editar a mano). SVG estático de la figura y datos de sus overlays. La geometría vive en `tools/twin/` (`stand.mjs`, `suit.mjs`, `overlays/heart.mjs`); `--audit` verifica contactos, holguras y orden de pintado. |
| `app.js` | Entry point. Gestiona el ciclo de vida del provider, `onReading`, `onTick`, `refreshSecondary`, `runAlertAction`, y el procesamiento de alertas (`processVitals`, `processEnvironment`, `processDevices`, `checkEscalations`, `checkReminders`). Contiene el `main()` IIFE de arranque. |

---

## 5. Flujo de datos

```
Provider
  │  subscribeVitals(astronautId, callback)
  │
  ▼
app.js · onReading(crew, reading)
  ├── State.history[id].push(reading)
  ├── RulesEngine.evaluateReading(reading, baseline)  →  eval
  ├── State.shown[id] = reading   (si es 'ok' o suficientemente buena)
  └── processVitals(crew, reading, eval)
        └── trackCondition(key, level, buildFn)
              └── upsertAlert / resolveAlert  →  State.alerts

app.js · onTick()   [cada N lecturas]
  ├── refreshSecondary()
  │     ├── provider.getEnvironment()  →  State.env
  │     │     └── RulesEngine.evaluateEnvironment()  →  State.envEval
  │     │           └── processEnvironment()  →  trackCondition()
  │     ├── provider.getDevices(id)    →  State.devicesBy
  │     │     └── processDevices()    →  trackCondition()
  │     └── provider.getSleepActivity(id, day)  →  State.sleepBy
  ├── checkReminders()   →  upsertAlert / resolveAlert
  ├── expireAlerts()
  ├── checkEscalations()
  ├── checkMissions()    →  addPoints
  └── UI.renderLive()
```

### Principio de separación

- Los providers **no conocen** las reglas ni el DOM.
- `RulesEngine` **no conoce** el DOM ni el estado global.
- `State` **no conoce** el DOM.
- `UI` **no modifica** el estado directamente; llama a funciones de `state.js` y `app.js`.

---

## 6. Sistema de alertas

```
Condición fuera de rango
  └── trackCondition(key, level, buildFn)
        ├── N lecturas consecutivas fuera → upsertAlert()
        └── M lecturas consecutivas normal → resolveAlert()

Alert lifecycle
  active → acknowledged
  active → snoozed → active (si la condición persiste)
  active → escalated (si P1 no se ack en 60 s)
  any    → resolved
```

**Prioridades:**

| Prioridad | Dominio |
|---|---|
| P1 | `surgeon` (crítico) |
| P2 | `health`, `environment` |
| P3 | `sensor` |
| P4 | `reminder` |

**Reglas clave:**
- Una condición produce **una sola alerta activa** (no se duplica mientras sigue fuera de rango).
- Lecturas `noisy` y `delayed` **no abren ni cierran** alertas.
- Una alerta crítica sin acknowledge en 60 s se **escala**: se envía una segunda notificación simulada al enlace de tierra y el toast se fija hasta que se acknowledge.
- Los recordatorios usan `expiresAt` y una ventana de supresión para no repetirse cada ciclo.

---

## 7. Cómo agregar una fuente de datos real

El único cambio es implementar `RemoteProvider` en `src/tesai/js/providers/remote.js`. La UI y el motor de reglas no se tocan.

```js
// providers/remote.js — métodos a implementar
async getCrew()                    // GET /crew
async getVitals(id, from, to)      // GET /vitals/:id?from=&to=
subscribeVitals(id, cb)            // polling o WebSocket; retorna unsubscribe()
async getEnvironment()             // GET /environment
async getDevices(id)               // GET /devices/:id
async getSleepActivity(id, day)    // GET /activity/:id?day=
async pushEvent(event)             // POST /events
```

Cada método normaliza su respuesta con `Adapters.*` antes de devolverla:

```js
// Ejemplo: crew proveniente de una API REST
async getCrew() {
  const raw = await this.fetchJson('/crew');
  return Adapters.adaptRestJson.crew(raw);
}
```

`Normalizer.*` valida tipos, rangos y deja `null` todo lo que no cumple. Marcar `source: 'real'` en las lecturas activa el badge **UNVERIFIED** en la barra superior.

**CORS y claves:** la mayoría de las APIs no permiten llamadas directas desde el browser. Usar un proxy serverless (Vercel Functions, por ejemplo) que guarde la API key y cachée las respuestas. El browser solo conoce la dirección del proxy (`CONFIG.api.baseUrl`): ninguna clave vive en el código del cliente. Si el proxy está en otro dominio, hay que sumarlo a `connect-src` en la CSP de `vercel.json`.

**Archivos importados:** el CSV o JSON que carga la persona se trata como no confiable. `Normalizer` deja en los ids solo caracteres seguros, corta los textos y descarta métricas desconocidas, porque los ids terminan en atributos HTML.

---

## 8. Despliegue y seguridad

El proyecto es completamente estático. `vercel.json`, en la raíz del repo, publica solo `src/` (`outputDirectory`), así que `docs/`, `tools/` y `react/` no se suben al sitio.

**Cabeceras de seguridad** (todas las rutas):

| Cabecera | Valor | Para qué |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` | Solo se ejecuta código del propio sitio. `'unsafe-inline'` queda solo para estilos, porque el panel usa atributos `style` |
| `X-Content-Type-Options` | `nosniff` | El browser no adivina tipos de archivo |
| `X-Frame-Options` | `DENY` | No se puede incrustar en otro sitio |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No filtra rutas a otros dominios |
| `Permissions-Policy` | sin cámara, micrófono, ubicación, pagos ni USB | Ninguna se usa |
| `Strict-Transport-Security` | 2 años | Siempre HTTPS |

**Caché:**

| Asset | TTL | Razón |
|---|---|---|
| Fuentes `.woff2` | 1 año (`immutable`) | No cambian entre deploys |
| Imágenes, video y three.js | 30 días + 7 stale | Cambian poco |
| `.css` y `.js` | 1 hora + 1 día stale | Se ven los cambios de un deploy enseguida |

**Para probar localmente:**

```bash
cd src && python3 -m http.server 8765
# → http://localhost:8765/            (web central)
# → http://localhost:8765/simulacion/ (simulación)
# → http://localhost:8765/tesai/      (Tesai)
```

---

## 9. Convenciones

### CSS

- Variables sin prefijo `--color-` están reservadas para valores derivados (`--glass`, `--line`, `--grad-*`, `--shadow-*`, `--band-*`).
- Variables de color base siempre tienen prefijo `--color-`.
- Sin colores literales fuera de `shared/tokens.css`.
- El estado de salud siempre incluye un elemento textual además del color (`.lvdot` + texto del nivel).

### JS

- **Sin side effects en el top-level** de los módulos (excepto `app.js` que contiene el IIFE `main()`).
- `State` es el único objeto mutable global. Ningún otro módulo declara variables de estado globales.
- Las funciones de render en `UI` usan `setHtml` / `setText` con comparación de strings para evitar re-renders innecesarios y perder el foco del teclado.
- Los IDs del DOM referenciados desde JS siguen la convención `kebab-case` y se documentan en el HTML con comentarios de sección.
- Los providers implementan `destroy()` para limpiar timers e intervalos al cambiar la fuente.

### Accesibilidad

- Íconos: SVG con `aria-hidden="true"`. El texto visible o `aria-label` siempre acompaña al ícono.
- Alertas críticas: anunciadas con `aria-live="assertive"`. El resto con `aria-live="polite"`.
- Drawer: `role="dialog"` con `aria-modal="false"` (el contenido de fondo sigue siendo accesible) y foco gestionado manualmente.
- Toasts: `role="status"` para los informativos; los toasts vinculados a alertas con ciclo de vida no usan `role` para no duplicar el anuncio.
- `prefers-reduced-motion`: desactiva animaciones decorativas (twin spin, scan, ECG, pulso del dot crítico). También hay un switch manual en Advanced.

---

## 10. Mejoras recomendadas (auditoría del 15 de noviembre de 2026)

Ninguna cambia lo que se ve en la entrega. Quedan anotadas para después del hackathon.

### Código

- **Líneas muy largas.** `ui/ui.js`, `ui/visor.js` y `simulacion/js/sim.js` arman HTML en líneas de hasta unos 1.000 caracteres. Conviene partir cada pantalla en funciones de render más chicas, una por bloque.
- **Listeners sin baja.** `ui.js` y `sim.js` registran 19 listeners cada uno y no los quitan. Hoy no molesta porque las páginas no se desmontan; si alguna vez pasan a montarse y desmontarse, cada módulo necesita su `destroy()`, como ya tienen los proveedores y el gemelo.
- **Módulos conservados sin uso.** `twin/art.js` (unos 340 KB), `twin/figure.js` y `twin/overlays/` no se importan desde `app.js`: no se descargan, pero pesan en el repo. Si la figura isométrica no vuelve, se pueden mover a `tools/`.
- **`FileProvider._tick`** filtra todas las lecturas en cada tick. Con archivos grandes conviene agrupar por tripulante una sola vez en el constructor.
- **`catch` vacíos.** Los de `localStorage`, audio y bloqueo de puntero son intencionales; conviene dejar un comentario de una línea en cada uno, como ya hacen `state.js` y `checkin.js`.
- **Pruebas.** No hay pruebas automáticas del normalizador, del parser CSV ni del motor de reglas. Son funciones puras: se pueden probar con `node --test` sin sumar dependencias.

### Rendimiento

- **`tesai/assets/human.png`** (1920 × 1080, unos 250 KB) se puede servir como WebP con transparencia. Requiere comparar la figura antes y después.
- **Caché.** `vercel.json` da una hora a los `.js` y `.css`. Con nombres de archivo con versión se podría pasar a caché larga.
- **Minificación.** El sitio no tiene paso de build a propósito. Si se suma uno, three.js ya está minificado y el resto baja cerca de un tercio.
- **Simulación en equipos modestos.** No se midió en dispositivos de gama baja; conviene una opción de calidad reducida (resolución del canvas y sombras).

### Datasets reales (fuente por defecto desde `49dce93`)

- **El panel "Probá una situación" del Visor no actúa sobre datos grabados.** `DatasetProvider` no implementa `pushEvent`. Ahora el aviso lo dice; para que funcione con la fuente por defecto haría falta superponer el evento sobre la lectura reproducida.
- **Muchos avisos por actividad normal.** En MMASH entre un cuarto y la mitad de los minutos caen en "atención" (frecuencia cardíaca de la vida diaria, hasta 162 lpm en ejercicio) y el estado general queda en "datos parciales", porque cuatro de los seis signos no se midieron. Para datos de vida diaria conviene una regla que tenga en cuenta la actividad.
- **`mmash.json` pesa cerca de 1 MB** y se descarga al abrir el panel. Se puede bajar la resolución o cargar bajo demanda.
- **El CO₂ de OSDR** (3.183 a 4.023 ppm en el extracto) no fue contrastado contra la unidad original de la API; conviene dejar asentada la conversión en `build_osdr_eda.py`.
- **Licencias.** El extracto de MMASH conserva ODbL 1.0 (compartir igual); la licencia MIT del repo cubre solo el código.

### Corregido en esta revisión

- Una fecha inválida en un archivo importado ya no interrumpe la importación: la fila se informa como error y el resto sigue.
- El parser CSV acepta campos entre comillas que contienen el separador y comillas dobles escapadas.
- `sleepActivity` importado pasa por el mismo saneo de id y de fecha que el resto.
- El intervalo de simulación leído de `localStorage` se acota a 250–60.000 ms.
- La tabla de umbrales de `#/advanced` muestra la franja de atención en su columna, en vez de repetir el rango normal.
- El panel "Probá una situación" ya no anuncia un evento que la fuente no acepta.
- La guía de presión arterial habla de la muñequera, que es el sensor del modelo, y la nota de SpO₂ dice que Tesai avisa antes que las fuentes.
