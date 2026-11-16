# Tesai · sitio

Sitio estático (sin build, sin framework) del proyecto **Tesai** de Team Higía para el **NASA Space Apps Challenge 2026**. Por defecto Tesai reproduce datasets públicos reales (adultos sanos, no astronautas, y cabina de la ISS); la fuente simulada sigue disponible en Avanzado.

```
src/
├─ index.html · styles.css · main.js   Web central: portada, el problema, la app, cómo funciona, sensores, accesos (ES/EN)
├─ shared/                              Lo común a las tres páginas: tokens.css (colores), fonts.css, buttons.css,
│                                       lang.js (un solo idioma, inglés por defecto) y site-bar.js/.css (logo e idioma de la barra superior)
├─ assets/                              Imágenes, tipografías (una sola carpeta), logos y capturas de Tesai (assets/tesai/)
├─ simulacion/                          Simulación inmersiva en primera persona (3 escenarios, con voz)
│  ├─ index.html · styles.css           Estructura y estilos
│  ├─ js/                               i18n.js (textos ES/EN), scene.js (escena 3D), sim.js (bucle, escenarios y HUD)
│  ├─ vendor/                           three.js 0.170.0 (licencia MIT), incluido para que funcione sin conexión
│  └─ img/
└─ tesai/                               Prototipo Tesai: panel de la tripulación, Visor en primera persona,
                                        audio incorporado y segundo doctor (ver tesai/README.md)
```

## Cómo se conectan

- La web central enlaza a `simulacion/` y a `tesai/` con rutas relativas.
- **Idioma:** la web central guarda el idioma elegido (`tesai.lang`) y lo pasa a la simulación; si se cambia dentro de la simulación, la web central lo sigue.
- **Menú de la simulación:** botón *Menú* o tecla Esc durante la simulación → continuar, elegir otra simulación o volver a la web central.
- Tesai abre la simulación desde el Visor y desde *Acerca de*.

## Ejecutar en local

```bash
cd src
python3 -m http.server 8765
# http://localhost:8765/          web central
# http://localhost:8765/simulacion/
# http://localhost:8765/tesai/
```

## Desplegar

`vercel.json` (en la raíz del repo) publica solo `src/`, agrega las cabeceras de seguridad (CSP incluida) y usa `trailingSlash: true` para que `/tesai/` y `/simulacion/` resuelvan bien sus rutas relativas. En otro hosting estático (por ejemplo, Cloudflare Pages) alcanza con publicar `src/` sin paso de build.

Ninguna página tiene `<script>` inline: todo el código está en archivos `.js` del propio sitio.

La simulación y Tesai son material educativo, con datos simulados o tomados de datasets públicos: no diagnostican y no reemplazan al cirujano de vuelo. La guía de RCP es simplificada y no reemplaza un curso certificado.
