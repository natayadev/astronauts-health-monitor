# Tesai · sitio

Sitio estático (sin build, sin framework) del proyecto **Tesai** de Team Higía para el **NASA Space Apps Challenge 2026**. Todos los datos son simulados.

```
src/
├─ index.html · styles.css · main.js   Web central: portada, guía de sensores, cómo funciona, accesos (ES/EN)
├─ shared/                              Lo común a las tres páginas: tokens.css (colores), fonts.css, buttons.css,
│                                       lang.js (un solo idioma, inglés por defecto) y site-bar.js/.css (logo e idioma de la barra superior)
├─ assets/                              Imágenes, tipografías (una sola carpeta) y logos
├─ simulacion/                          Simulación inmersiva en primera persona (3 escenarios, con voz)
│  ├─ index.html                        Un solo archivo; three.js se carga desde esm.sh
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
python -m http.server 8765
# http://localhost:8765/          web central
# http://localhost:8765/simulacion/
# http://localhost:8765/tesai/
```

## Desplegar

Cualquier hosting estático sirve apuntando a `src/` (por ejemplo, Cloudflare Pages o Vercel). `vercel.json` usa `trailingSlash: true` para que `/tesai/` y `/simulacion/` resuelvan bien sus rutas relativas.

La simulación y Tesai son simulaciones educativas con datos simulados: no diagnostican y no reemplazan al cirujano de vuelo. La guía de RCP es simplificada y no reemplaza un curso certificado.
