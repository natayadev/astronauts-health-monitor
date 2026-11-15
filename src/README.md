# Tesai · gemelo de salud para tripulación

Prototipo web de monitoreo de signos vitales de astronautas. Estilo "gemelo digital" (menta + teal, vidrio, números en mono) tomado del diseño de Claude Design, con semáforo **Normal / Atención / Avisar a cirujanos de vuelo**.

> **Todos los datos son simulados.** La insignia "DATOS SIMULADOS" está siempre visible. Los datos importados se rotulan "SIN VERIFICAR".

## Correr

Es un solo `index.html` sin build. Conviene servirlo por HTTP:

```bash
cd src
python -m http.server 8765
```

Abrir `http://localhost:8765/`. Las fuentes están en `assets/fonts/`, así que funciona sin conexión.

## Estructura

```
src/
├─ index.html        # app completa: tokens CSS, HTML, esquema, config, proveedores, reglas, estado y UI
├─ assets/fonts/     # Plus Jakarta Sans y JetBrains Mono (SIL OFL), locales
└─ README.md
```

### Secciones (navegación: 4 + Sistema)

| Sección | Qué muestra |
|---|---|
| Resumen | Franja de estado y siguiente paso, gemelo con seis signos vitales conectados, detalle lateral, barra de acciones, misiones |
| Biometría | Tarjetas con tendencia y calidad de lectura, entorno de cabina, sueño y actividad |
| Diagnóstico | Avisos con ciclo de vida, sensores aparte de salud, enlace con Tierra simulado |
| Historial | Gráfico con bandas del semáforo y línea base, calidad de señal, misiones y racha |
| Sistema | Fuente de datos, importar/exportar, modo demostración, apariencia, umbrales (solo lectura), esquema |

### Capas dentro de `index.html`

| Capa | Contenido |
|---|---|
| (a) `SCHEMA` + `CONFIG` | Esquema documentado y configuración centralizada (umbrales, enlace simulado, claves API vacías) |
| (b) Proveedores | `DataProvider` (contrato), `SimulatedProvider`, `RemoteProvider` (esqueleto), `FileProvider`, adaptadores y normalizador |
| (c) `RulesEngine` | Lecturas → `normal` / `atencion` / `cirujano` / `parcial` / `sindatos`. No sabe de dónde vienen los datos |
| (d) Estado | Avisos con ciclo de vida, enlace con Tierra, misiones, puntos, racha |
| (e) UI | Gemelo, tarjetas, drawer, vistas, gráficos SVG, toasts |

## Tema

Todo el color vive en variables CSS del bloque `:root` (paleta base, semáforo, superficies, gradientes, sombras, gráficos, tipografía, radios). Fuera de ese bloque no hay colores literales; los derivados usan `color-mix` sobre la paleta. Para re-tematizar basta cambiar esas variables (por ejemplo `--teal`, `--deep`, `--aqua`, `--bg`).

## Avisos (cambios de la auditoría)

- Una alerta por condición, con ciclo activa → reconocida → resuelta. No se repite mientras la condición dure.
- Las lecturas ruidosas o retrasadas no abren ni cierran avisos.
- Un aviso crítico queda fijo hasta reconocerse. Reconocer no da puntos.
- Salud y sensores se muestran por separado. Con métricas faltantes el estado es "Datos parciales", no "Normal".
- Los umbrales son de solo lectura y no se guardan en el navegador. Son ilustrativos, sin validación clínica.
- El enlace con Tierra es una simulación; no hay transmisión real.

## Accesibilidad y responsive

`prefers-reduced-motion` y un interruptor para apagar las animaciones decorativas, foco visible, foco estable en las listas, drawer con foco gestionado, íconos SVG, estados con ícono y texto. Por debajo de 1000 px el gemelo queda arriba, las tarjetas pasan a grilla y la navegación se mueve a una barra inferior.

## Conectar datos reales

Ver "CÓMO CONECTAR DATOS REALES" al final de `index.html`. No existen datos fisiológicos en vivo públicos de astronautas; lo probable es combinar datos públicos agregados con simulación, siempre rotulando `source`.
