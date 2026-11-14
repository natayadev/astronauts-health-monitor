# Astro Vitals · prototipo HUD (src/)

Prototipo del NASA Space Apps Challenge 2026 *Health Monitoring Software*. Ver el [README del repositorio](../README.md) para el contexto, alcance y límites.

Panel de monitoreo de signos vitales de astronautas con estética HUD (paleta azul profundo + cian), semáforo de alertas (**Normal / Atención / Avisar a cirujanos de vuelo**), recordatorios tipo notificación, misiones diarias con puntos y racha de objetivos.

> **Todos los datos son simulados.** La insignia amarilla "DATOS SIMULADOS" se muestra mientras corre el simulador. Nunca se presentan datos simulados como reales.

## Correr

Es un solo archivo HTML sin build. Conviene servirlo por HTTP para que el navegador cargue la máscara del holograma desde `assets/`:

```bash
cd src
python -m http.server 8765
```

y abrir `http://localhost:8765/`. (Abrir `index.html` con doble clic también funciona en la mayoría de los navegadores.)

## Estructura

```
src/
├─ index.html          # toda la app: esquema, config, proveedores, reglas, estado, UI y docs
├─ assets/
│  └─ astronaut.png    # silueta en escala de grises usada como máscara del holograma
└─ README.md
```

### Capas dentro de `index.html`

| Capa | Qué contiene |
|---|---|
| (a) `SCHEMA` + `CONFIG` | Esquema único documentado (campos, unidades, rangos). Configuración centralizada: fuente de datos, semilla, tick, URLs/API keys (vacías), **umbrales del semáforo en un solo objeto**. |
| (b) Proveedores | `DataProvider` (contrato), `SimulatedProvider` (activo), `RemoteProvider` (esqueleto con `fetchJson` que ya hace timeout/reintentos/caché), `FileProvider` (CSV/JSON local), `Adapters` + `Normalizer` + `validateVital`. |
| (c) `RulesEngine` | Lecturas normalizadas → `normal` / `atencion` / `cirujano` / `sindatos`. Incluye regla de desviación respecto de la línea base personal. No sabe de dónde vienen los datos. |
| (d) Estado | Store, notificaciones/recordatorios con dedupe y cooldown, misiones, puntos, rangos, racha (persistidos en `localStorage`). |
| (e) UI | HUD, holograma, sparklines, historial con bandas, misiones, alertas, importador, ajustes. |

### Contrato `DataProvider`

```
getCrew()                          → Astronaut[]
getVitals(astronautId, from, to)   → VitalReading[]
subscribeVitals(astronautId, cb)   → unsubscribe()
getEnvironment()                   → Environment
getDevices(astronautId)            → Device[]
getSleepActivity(astronautId, day) → SleepActivity
getAlerts() / pushEvent(event)
```

La UI **solo** llama a estas funciones.

## Qué probar

- **Tripulantes**: pestañas arriba a la derecha. Cada uno tiene línea base propia.
- **Ajustes → Inyectar evento**: taquicardia, hipoxia, fiebre, hipertensión, ejercicio, desconectar sensor, pico de CO₂. Las tarjetas y el holograma cambian de color y se generan alertas.
- **Ajustes → Fuente de datos → Remota**: muestra el error `NotImplementedError` y vuelve a simulada sin romper nada.
- **Datos → Cargar datos**: arrastrá un CSV (hay plantilla descargable) o un JSON exportado; se valida contra el esquema y se usa como fuente (insignia cambia a "DATOS REALES · ARCHIVO").
- **Misiones**: registro manual de ejercicio/hobby, recarga de baterías desde Dispositivos o desde la notificación, reconocer alertas → puntos, rangos y racha.
- **Semilla**: misma semilla ⇒ misma secuencia de datos simulados.

## Accesibilidad y calidad

Auditado con los plugins **Impeccable** (`/impeccable audit index.html`) y **UI UX Pro Max** (estilo HUD / Sci-Fi FUI, riesgo a11y alto). Implementado: `prefers-reduced-motion`, foco visible por teclado, íconos SVG (sin emojis), estados que no dependen solo del color, live regions para alertas, targets táctiles ≥40px en pantallas táctiles, botón Pausar en el historial en vivo, layout sin scroll horizontal a 375px. Los halos cian, las scanlines y la grilla de fondo son decisiones del brief visual (referencia HUD), no descuidos.

## Conectar datos reales

Ver la sección **"CÓMO CONECTAR DATOS REALES"** al final de `index.html`: pasos para implementar `RemoteProvider`, qué endpoint reemplaza a cada función, qué adaptadores completar, manejo de CORS/proxy y límites de uso. Fuentes candidatas (a verificar): NASA Open Data Portal, NASA Open APIs, OSDR/GeneLab, LSDA. No existen datos fisiológicos en vivo públicos de astronautas; lo probable es combinar datos públicos agregados con simulación, siempre etiquetando `source`.
