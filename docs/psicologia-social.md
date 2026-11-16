# Factores psicosociales en el monitoreo de salud de astronautas

Fundamento de diseño del chequeo diario, las alertas y la privacidad de **Tesai**. Equipo Higía, NASA Space Apps Challenge 2026.

> **Cómo leer las citas.** Cada afirmación importante lleva un identificador de fuente entre corchetes (F01, F02…), que remite a las referencias de la sección 10, y una etiqueta de tipo de evidencia: **(D)** directa, con astronautas o misiones espaciales; **(A)** análoga, en aislamiento o ambientes extremos en Tierra; **(I)** indirecta, investigación humana no espacial; **(P)** propuesta de diseño derivada de la evidencia, no validada para esta aplicación.
>
> **Resumen en inglés:** sección 11.

---

## 1. Propósito y alcance

El enunciado del desafío plantea que, en misiones largas, los astronautas cargan con buena parte de la responsabilidad de detectar cambios en su propia salud, y pide software que reúna indicadores y les permita evaluar su estado y actuar [F24]. Eso pone el autorreporte y la interpretación propia en el centro del producto. Este documento aporta la mirada de la psicología social y de los factores humanos a tres decisiones: qué se pregunta, cómo se avisa y qué se protege.

### 1.1 Tres aportes concretos

1. **Qué medir además de lo fisiológico.** La NASA trata como riesgos formales tanto las condiciones cognitivas y conductuales adversas como el funcionamiento inadecuado del equipo (cooperación, coordinación, comunicación y adaptación psicosocial) [F03, F04, F05] (D, A).
2. **Por qué un autorreporte puede no ser honesto.** Está documentada la reticencia de los astronautas a informar síntomas por temor a consecuencias sobre su asignación a vuelos [F11, F14] (D). Un monitor que ignora ese incentivo mide deseabilidad social, no salud.
3. **Cómo se relaciona una persona con un sistema que la evalúa.** La confianza en la automatización y su uso apropiado dependen del diseño, y los errores típicos (confiar de más o descartar avisos) están estudiados [F17, F18, F19] (I).

### 1.2 Tres planos que conviene separar

| Plano | Qué abarca | En Tesai |
|---|---|---|
| Salud fisiológica | Estado del cuerpo: sistema cardiovascular, temperatura, sueño como proceso biológico | Signos vitales, sueño y actividad |
| Salud conductual | Ánimo, estrés, fatiga, cognición y desempeño de la persona | Chequeo diario: ánimo, calma, lucidez mental, calidad del sueño |
| Dinámica psicosocial | Lo que ocurre entre personas: cohesión, conflicto, relación con el control de misión | Chequeo diario: conexión con la tripulación y tensión |

El tercer plano no es propiedad de un individuo. Un ítem sobre tensión en el equipo describe al grupo y expone a terceros, así que no puede tratarse con las mismas reglas de alerta ni de acceso que una hora de sueño (ver 3.2 y 6).

### 1.3 Límites

No es una guía clínica, no diagnostica y no reemplaza a un profesional de la salud. El documento no redacta ítems de seguridad emocional ni protocolos de derivación, y no valida ningún umbral.

## 2. Los cinco peligros y su dimensión psicosocial

La NASA agrupa los riesgos del vuelo espacial humano en cinco peligros: radiación espacial, aislamiento y confinamiento, distancia de la Tierra, gravedad alterada y ambientes hostiles o cerrados [F01, F02] (D).

| Peligro | ¿Dimensión psicosocial? | Qué dice la evidencia | Tipo |
|---|---|---|---|
| Aislamiento y confinamiento | Sí, es el central | La NASA considera esperables los problemas conductuales en grupos confinados durante mucho tiempo, agravados por pérdida de sueño, desincronización circadiana y sobrecarga de trabajo [F01]. En misiones de hasta 6 meses en órbita baja la incidencia de eventos conductuales adversos es relativamente baja, con alteraciones subclínicas del ánimo y ansiedad; se espera que aumente con la duración y la distancia [F03]. Hay conflicto ocasional dentro de las tripulaciones y entre tripulación y Tierra [F04, F05]. | D y A |
| Distancia de la Tierra | Sí | Demora de comunicación de hasta unos 20 minutos por tramo [F01, F02]; la ida y vuelta de una pregunta duplica ese tiempo. La tripulación se vuelve más independiente del control de misión [F02], y el vínculo con Tierra, más frágil: con una demora de 50 segundos en la ISS ya se registraron más frustración y peor calidad percibida de la comunicación [F04, F09]. | D |
| Ambientes hostiles y cerrados | Parcialmente | La NASA lo trata sobre todo como problema ambiental, pero incluye la opinión de la tripulación sobre su entorno de vida [F01], y las medidas estándar de vuelo relevan habitabilidad y convivencia [F10]. | D, limitada |
| Radiación | Indirecta e hipotética | Los efectos cognitivos y conductuales de la radiación se apoyan en modelos animales y celulares; la extrapolación a humanos está en estudio [F01, F03]. Tesai no infiere nada conductual a partir de la dosis. | Modelos animales |
| Gravedad alterada | Sin dimensión psicosocial documentada | Efectos en huesos, músculos, sistema cardiovascular y equilibrio [F01]. | - |

**Consecuencia para el diseño (P):** los ítems psicosociales del chequeo se justifican por los dos primeros peligros. Tesai no vincula radiación ni gravedad con el estado psicológico.

## 3. Marco conceptual

### 3.1 Cohesión del grupo

- **Definición.** El funcionamiento unificado del grupo al trabajar por un objetivo o satisfacer las necesidades psicosociales de sus miembros, con dos componentes: cohesión de tarea (trabajar bien juntos) y cohesión social (llevarse bien) [F04] (D, revisión). La social gana peso a medida que aumentan el aislamiento y el confinamiento [F04] (A).
- **Evolución temporal.** Los datos son mixtos. Se observó un descenso del vínculo con la tripulación en astronautas en la Mir, y de la cohesión en Mars-500 y SIRIUS-19 [F04] (D, A). El "fenómeno del tercer cuarto" (empeoramiento después de la mitad de la misión) puede aparecer en algunas personas, pero no es típico; la duración total predice mejor los problemas [F04] (A, D).
- **Medición.** Las medidas estándar de vuelo de la NASA incluyen un cuestionario de sueño y equipo que releva cohesión y desempeño del equipo, con frecuencia mensual [F10] (D). Sus ítems no están publicados.
- **Límite.** Faltan datos de vuelo a nivel de equipo para cuantificar el efecto de las variables de equipo en misión [F04] (D).
- **En Tesai (P):** el ítem "conexión con la tripulación" mide una percepción individual, cercana a la cohesión social. No se llama "cohesión del equipo", no se espera una caída en un momento fijo de la misión y nunca se muestra como promedio grupal: en una tripulación de cuatro a seis personas, un promedio permite deducir quién respondió qué (3.4).

### 3.2 Conflicto y tensiones interpersonales

- **Con el control de misión.** En Mars-500, los conflictos con el control de misión se reportaron unas cinco veces más que los conflictos entre tripulantes [F07] (A). En Skylab 4, la carga de agenda derivó en conflicto con Tierra [F04] (D).
- **Desplazamiento.** Las tripulaciones tienden a descargar el afecto negativo sobre el control de misión, lo que preserva la relación interna; si ese canal falta, la tensión puede volverse hacia adentro [F04] (D, A). Es clave para misiones con demora.
- **Concentración individual.** En Mars-500, dos de los seis tripulantes reportaron la mayoría de los conflictos percibidos [F07] (A): un conteo grupal puede describir a una o dos personas, no al equipo.
- **Tipos.** El conflicto de relación perjudica desempeño y satisfacción; el de tarea se relaciona de forma más favorable con la calidad de las decisiones [F04] (I).
- **Ausencia de conflicto no es buen clima.** El exceso de acomodación puede suprimir voces disidentes [F04] (A).
- **Precedente de medición.** El cuestionario semanal de Mars-500 preguntaba si hubo conflicto con otro tripulante o con el control de misión, sin nombrar a la otra parte [F07] (A).
- **En Tesai (P):** la tensión es opcional, pregunta por las últimas 24 horas, distingue tripulación y control de misión, no pide nombres y nunca genera una alerta visible para otros. Si reportar una tensión avisara al resto, el incentivo sería no reportarla.

### 3.3 Comunicación con demora y autonomía

- **Efectos.** En un estudio en la ISS con una demora de 50 segundos, las tareas fueron más lentas y hubo más estrés y frustración, menor bienestar y peor calidad percibida de la comunicación [F09, F04] (D). Es una muestra muy chica. En análogos, la desconexión con Tierra bajo demoras de 20 minutos fue un problema relevante, y los mensajes escritos a Tierra se acortaron con el tiempo [F04] (A). CHAPEA 2 incluyó dos semanas simuladas sin señal con la Tierra [F31] (A).
- **Autonomía.** Mayor autonomía se asoció con mejor desempeño y menos estrés, pero también con confusión de roles y caída de cohesión en parte de la tripulación [F04] (A); en la ISS no compensó los efectos de la demora [F04] (D).
- **Qué mitiga.** Los protocolos estructurados de voz y texto redujeron errores bajo demora, y la calidad de la comunicación importa más que su frecuencia [F04] (A, I).
- **Cuánto se sabe.** Las revisiones de la NASA reportan vacíos de investigación significativos: pocos estudios varían la demora con latencias marcianas, y muy pocos prueban contramedidas [F27] (D, A).
- **Norma.** El estándar de la NASA prefiere tiempo real para las comunicaciones médicas privadas, pero admite almacenar y reenviar cuando hay demora [F12] (D).
- **Sesgo de automatización.** La complacencia (dejar de vigilar a la automatización cuando hay otras tareas) y el sesgo de automatización (errores de omisión y de comisión) aparecen también en expertos y equipos, y no se eliminan con entrenamiento [F17] (I). El objetivo de diseño es que la confianza corresponda a la capacidad real del sistema [F18] (I).
- **En Tesai (P):** la herramienta orienta y nunca decide. Cada aviso muestra su motivo, y cada número, la base de su límite. Los mensajes a Tierra son autocontenidos (qué cambió, desde cuándo, respecto de qué), porque con demora no hay repregunta rápida.

### 3.4 Privacidad, confianza y reporte

- **Subregistro documentado.** Hay presión institucional para subreportar: temor a que resultados o síntomas se usen para descalificar de misiones futuras, una cultura que valora el estoicismo, y la percepción de que de una consulta con el médico de vuelo "lo mejor que puede pasar es salir igual" [F11] (D). Por esa reticencia, las cifras de síntomas conductuales pueden subestimar la incidencia real [F11], y el problema sigue mencionándose en documentos recientes [F14] (D).
- **Deseabilidad social.** Responder lo que queda bien. Mars-500 la midió como variable a controlar [F07] (A).
- **Confidencialidad.** El estándar de la NASA trata como comunicación privada la información médica y psicológica que viaja por los sistemas de la nave, con fundamento en la Privacy Act de 1974 [F12] (D). En la ISS, las conferencias psicológicas privadas son quincenales, duran unos 15 a 20 minutos y no se graban [F13] (D).
- **Reidentificación.** En poblaciones tan chicas, datos presentados como anónimos pueden vincularse a personas [F11], y la NASA exige una revisión de atribuibilidad antes de publicar resultados con datos de astronautas [F22] (D).
- **En Tesai (P):**
  - Un panel "Quién ve esto" visible antes de responder. Si la persona no sabe adónde va su respuesta, asume lo peor.
  - Las respuestas quedan en el dispositivo. El resto de la tripulación no ve nada y no hay promedios grupales.
  - Compartir con el oficial médico de la tripulación es opcional y, en el prototipo, solo un concepto.
  - Ningún diseño elimina el subregistro: en el mejor caso, lo reduce.

### 3.5 Sueño, estrés y ánimo

- **Sueño en vuelo.** En el estudio más amplio con actigrafía, el sueño promedió cerca de 6 horas por noche en el transbordador y en la ISS, y la deficiencia ya estaba presente en el entrenamiento previo; el uso de fármacos para dormir fue muy frecuente [F06] (D).
- **Sueño, desempeño y estrés.** En 24 astronautas en misiones de 6 meses, dormir 6 horas o menos se asoció con menor velocidad de respuesta, más estrés y más carga percibida; el estrés aumentó a lo largo de la misión [F08] (D). Es un estudio observacional: asociación, no causalidad.
- **Autopercepción poco confiable.** Con sueño restringido durante dos semanas, el desempeño siguió empeorando mientras la somnolencia subjetiva casi no aumentó: las personas no percibían su deterioro [F15] (I).
- **Registro en vuelo.** El *Reaction Self-Test* de la ISS combinó horarios de sueño, escalas visuales de 11 puntos (calidad de sueño a la mañana; carga, estrés, fatiga mental y cansancio) y una prueba de vigilancia de 3 minutos, programada cada cuatro días, con un 79% de sesiones completadas [F08] (D). Las medidas estándar suman actigrafía continua y cuestionarios mensuales [F10] (D).
- **Subcarga.** Con más automatización, el trabajo físico se reemplaza por el monitoreo de sistemas autónomos y puede aparecer letargo [F25] (D). Un software de monitoreo no debería convertir a la tripulación en vigilante pasiva de pantallas.
- **En Tesai (P):**
  - Los dominios del chequeo (sueño, ánimo, estrés, fatiga mental, equipo) coinciden con lo que la NASA registra [F08, F10]. Eso respalda los temas, no la redacción ni los umbrales.
  - El chequeo devuelve algo a la persona (su propia tendencia), no solo agrega una pantalla.
  - La frecuencia diaria es una elección del equipo, más alta que los precedentes en vuelo. Los días faltantes son esperables y se muestran como faltantes.
  - Como la autopercepción subestima el deterioro, un resultado "similar a lo habitual" no significa "sano".

### 3.6 Diferencias individuales y línea base personal

- **Por qué comparar a cada persona consigo misma.** Las diferencias entre personas en el deterioro por falta de sueño son estables y tienen carácter de rasgo [F16] (I). En Mars-500, las diferencias individuales fueron significativas en todas las medidas de autorreporte, y dos de los seis tripulantes no mostraron alteraciones [F07] (A). Un umbral poblacional único marcaría de más a unas personas y de menos a otras.
- **Riesgos de la línea base personal.**
  - *Línea base contaminada:* la deficiencia de sueño ya existe antes del lanzamiento [F06] (D), así que el "habitual" puede ser un estado ya deteriorado.
  - *Normalización de un deterioro lento:* una ventana móvil puede arrastrar un empeoramiento gradual sin que nunca supere el umbral.
  - *La persona tampoco lo nota:* una línea base hecha solo con autorreporte hereda el punto ciego de la autopercepción [F15] (I).
  - *Ruido tomado por señal:* con pocos días de datos, un desvío chico puede ser variación cotidiana.
- **Criterios para mostrar tendencias sin diagnosticar (P):**
  1. Exigir persistencia antes de marcar un cambio, y un mínimo de días previos.
  2. Describir el cambio en términos del propio dato ("más bajo que lo habitual 3 días seguidos"), sin etiquetas clínicas.
  3. Complementar con medidas objetivas cuando existan (actigrafía, tarea de reacción).
  4. Un piso absoluto de seguridad solo si lo define un profesional.

### 3.7 Incentivos y gamificación

El desafío menciona la gamificación como opción [F24], y Tesai da puntos por misiones diarias. Desde la psicología social (P, sin evidencia específica en tripulaciones):

- **Premiar un autorreporte incentiva inflarlo.** Es deseabilidad social con recompensa explícita: si una meta se cumple declarando un valor, el puntaje mide la declaración. Por eso el chequeo diario no da puntos.
- **Premiar el reconocimiento de alertas incentiva descartarlas.** Tesai no da puntos por reconocer alertas.
- **Las rachas pueden generar culpa** en una población ya exigida. Una racha perdida por un día de carga alta no debería leerse como falla.

## 4. Del marco al chequeo diario de Tesai

### 4.1 Decisiones de diseño

| Decisión | Implementación | Fundamento |
|---|---|---|
| Temas del chequeo | Calidad del sueño, ánimo, calma, lucidez mental y conexión con la tripulación | Coinciden con lo que se registra en vuelo y en análogos [F07, F08, F10] |
| Escalas | Las cinco van de 0 a 10, en la misma dirección (0 = peor, 10 = mejor), con extremos rotulados | Mezclar direcciones favorece errores de marcado; sin anclas, cada persona interpreta la escala a su manera. Los precedentes usaron escalas de 11 puntos o de 100 mm [F07, F08] |
| Período declarado | "Anoche" (sueño), "ahora" (ánimo, calma, lucidez) y "últimas 24 horas" (conexión, tensión) | Sin período, cada persona responde sobre un lapso distinto. El precedente midió el sueño a la mañana [F08] |
| Un solo concepto por ítem | "Calma" en lugar de "tensión o estrés" | Un ítem con dos términos admite dos lecturas (muscular o interpersonal) |
| Tensión opcional | Sí o no, y con quién: tripulación, control de misión o ambos. Sin nombres | 3.2 y el precedente de Mars-500 [F07] |
| Síntomas opcionales | Dolor de cabeza, nariz tapada, irritación de ojos, náuseas. Si se reporta dolor de cabeza o nariz tapada, se muestra al lado el CO₂ reciente de la cabina | En la ISS se reportaron síntomas asociados al CO₂ desde unos 2,3 mmHg [F32] (D). Se muestran juntos, sin afirmar causalidad |
| Privacidad | Respuestas en el dispositivo; nadie más las ve; sin promedios grupales | 3.4 |
| Sin alertas ni puntos | El chequeo no alimenta el motor de alertas ni la gamificación | 3.2, 3.4 y 3.7 |
| Comparación | Con la propia historia: se marca un cambio si hay al menos 5 días previos y los últimos 3 están todos 2 puntos o más por debajo de lo habitual. Es un valor de diseño, sin umbral publicado | 3.6 |
| Saltear un día | Se registra como día faltante, nunca como "normal" | 5.2 |

Las preguntas son originales del equipo. Parecerse a un instrumento estudiado no las valida.

### 4.2 Instrumentos documentados como referencia

| Instrumento | Qué mide | Uso en astronautas o análogos | Por qué no se usa en el prototipo |
|---|---|---|---|
| Actigrafía de muñeca | Actividad, sueño estimado, exposición a la luz | Transbordador, ISS, medidas estándar, Mars-500 [F06, F07, F10] | Requiere un sensor; la app muestra sueño simulado |
| Prueba de vigilancia psicomotora breve (PVT-B, 3 min) | Atención vigilante | ISS y Mars-500 [F07, F08]; validada en laboratorio con 74 adultos, con un umbral de lapso de 355 ms; las versiones más cortas resultaron poco sensibles [F26] (I) | Una versión corta no sería un PVT-B, y en un navegador la latencia del dispositivo puede pesar más que el efecto |
| Batería Cognition | 10 pruebas cognitivas breves | Medidas estándar [F10] | Software específico |
| Escalas visuales analógicas de estado | Estrés, fatiga, cansancio, calidad de sueño, carga | ISS y Mars-500 [F07, F08] | Redacción exacta no publicada |
| Profile of Mood States, forma corta | Perturbación del ánimo, 37 ítems | Mars-500 y medidas para análogos [F07, F10] | Demasiado largo para uso diario |
| Beck Depression Inventory II | Síntomas depresivos | Mars-500 [F07] | Instrumento clínico |
| Consensus Sleep Diary | Diario de sueño estandarizado | - | Desarrollado para investigación de insomnio [F21] |
| NASA-TLX | Carga de trabajo de una tarea | - | Pensado para evaluar una tarea, no un día [F23] |

## 5. Criterios para las alertas

### 5.1 Criterios

| Criterio | Qué implica | Fundamento | Tipo |
|---|---|---|---|
| Explicable | Cada aviso dice qué lo causó, respecto de qué y con cuántos datos | La confianza apropiada depende de poder ajustar cuánto se apoya uno en el sistema a lo que el sistema puede hacer [F18] | I y P |
| Sin culpabilizar | El lenguaje describe un cambio en un dato, no un juicio sobre la persona | El temor a consecuencias alimenta el subregistro [F11, F14]. Que un mensaje neutro mejore el reporte es una inferencia de diseño | D y P |
| Proporcional | El nivel depende de la persistencia y la magnitud del desvío | La variabilidad individual es grande y estable [F07, F16] | I, A y P |
| Sin fatiga de alarmas | Evitar avisos frecuentes de baja importancia | En hospitales, la frecuencia excesiva y las falsas alarmas producen fatiga de alarmas [F19]; la proporción de alarmas accionables varió de menos de 1% a 36%, pero ningún estudio midió la fatiga directamente [F28]. La transferencia a una tripulación es por analogía | I |
| Control del usuario | La persona entiende qué se registra sobre ella | La privacidad médica y psicológica es un requisito del estándar de la NASA [F12] | D y P |
| Derivación humana | En niveles altos el sistema orienta hacia una persona; no decide solo | El sesgo de automatización afecta a expertos y equipos [F17] | I |
| Accesible | El color nunca es el único medio; texto con contraste suficiente | WCAG 2.2, criterios 1.4.1 y 1.4.3 [F20] | Norma |

### 5.2 Riesgos

- **Falsos positivos:** con pocos datos y muchos ítems, aparecen desvíos por azar. Consecuencias: fatiga de alarmas, pérdida de confianza y, en ítems psicosociales, exposición injustificada.
- **Falsos negativos:** subregistro deliberado [F11, F14], autopercepción que no registra el deterioro acumulado [F15] y una línea base que normaliza un empeoramiento lento. El verde significa "sin cambios reportados", no "sano".
- **Dato faltante, anomalía y alerta** son tres cosas distintas:
  - *Dato faltante:* no hay respuesta o no hay lectura. No es verde ni es alerta.
  - *Anomalía:* un valor inverosímil o una lectura con ruido. Pide confirmación, no escalamiento.
  - *Alerta:* un patrón persistente que cumple una regla y tiene una acción asociada.
  - La falta de respuesta puede ser en sí misma relevante (retraimiento), pero interpretarla así es tarea de una persona, no del sistema.

## 6. Ética y privacidad

### 6.1 Práctica documentada y decisión de diseño

| Tema | Práctica documentada | En Tesai (P) |
|---|---|---|
| Confidencialidad médica y psicológica | Comunicación privada según NASA-STD-3001, con base en la Privacy Act de 1974 [F12] | Las respuestas del chequeo no salen del dispositivo |
| Conferencias psicológicas | Quincenales, privadas, no se graban [F13] | El chequeo no reemplaza ese canal; lo menciona como opción |
| Registro médico de exploración | Con control de acceso, accesible para cirujanos de vuelo y el oficial médico de la tripulación [F29] | Compartir con el CMO es opcional y, en el prototipo, solo un concepto |
| Reidentificación | En grupos tan chicos, los datos anónimos pueden vincularse a personas [F11, F22] | Sin promedios grupales de ítems psicosociales |
| Comunicación con demora | Se admite almacenar y reenviar [F12] | El enlace con Tierra es simulado y no transmite datos del chequeo |

### 6.2 Quién ve qué

| Dato | Astronauta | Oficial médico de la tripulación (CMO) | Resto de la tripulación | Equipo médico en Tierra |
|---|---|---|---|---|
| Respuestas del chequeo | Todo | Nada, salvo que el titular active compartir un resumen de tendencia (concepto) | Nada | Nada en el prototipo |
| Alertas de signos vitales propias | Todas | - | Solo las críticas | Aviso simulado si una crítica no se reconoce |

El CMO es un rol documentado: NASA-STD-3001 exige al menos dos por vehículo o plataforma [F30]. Es un tripulante con entrenamiento médico, no necesariamente médico, y en una tripulación chica es además compañero de quienes atiende.

### 6.3 Vigilancia, autonomía y derivación

- **Vigilancia excesiva.** Un sistema diario que escala a terceros puede vivirse como control, y el efecto esperable es peor reporte [F11]. Regla práctica (P): si un dato no cambia ninguna decisión, no se registra.
- **Límites de la autonomía.** Una tripulación es interdependiente, y hay situaciones en las que la seguridad de todos justifica informar a otros. Cuáles son y quién decide es materia de protocolo médico y operativo: la regla tiene que estar escrita y la persona tiene que conocerla antes de responder.
- **Condiciones para una derivación profesional real** (ninguna existe en el prototipo): criterios definidos por profesionales de salud mental y medicina aeroespacial, un destinatario humano capacitado, un canal privado que funcione con demora [F12], un plan local para cuando Tierra no responde a tiempo, y registro de lo actuado.
- **Seguridad emocional.** Cualquier ítem sobre riesgo emocional grave y su protocolo de derivación deben definirlos profesionales de la salud mental. Tesai no incluye ninguno.

## 7. Personas y recorrido

### 7.1 Personas

| | Astronauta | Oficial médico de la tripulación | Equipo médico en Tierra |
|---|---|---|---|
| Contexto | Agenda cargada y sueño corto [F06, F08]. Responsable de detectar cambios en sí mismo [F24]. Sabe que sus datos pueden afectar su carrera [F11] | También es tripulante y par de quienes atiende. Con demora no puede consultar a Tierra en el momento [F01, F02] | Cirujano de vuelo y equipo de salud conductual [F12, F13]. Recibe información con demora |
| Objetivo | Entender su estado en menos de dos minutos y decidir algo concreto | Enterarse a tiempo de lo que requiere su intervención | Seguir tendencias y apoyar decisiones locales |
| Preocupación | Quién ve lo que responde. Que un mal día se convierta en etiqueta | Falsas alarmas. Ver información que no debería | Interpretar datos viejos como actuales |
| Qué necesita ver | Su tendencia respecto de lo habitual, el motivo de cada aviso y qué se comparte | Solo niveles y motivos de quienes requieren atención | Resúmenes autocontenidos, con marca de tiempo |

### 7.2 Un día con el chequeo

| Momento | Qué pasa | Qué hace Tesai | Riesgo | Precaución |
|---|---|---|---|---|
| Mañana | La persona responde el chequeo | Guarda en el dispositivo y actualiza la tira de 14 días | Responder lo que queda bien [F11] | "Quién ve esto" visible antes de responder |
| Cambio sostenido | Tres días seguidos por debajo de lo habitual | Lo describe en términos del propio dato y sugiere opciones (descansar, ajustar el día, hablarlo con el CMO o en la conferencia médica privada) | Que se lea como diagnóstico | Lenguaje descriptivo; la persona decide |
| Día sin responder | No hay respuesta | Lo muestra como faltante | Tomarlo como normalidad o como alarma | No se interpreta ni se escala |
| Dolor de cabeza | La persona lo marca | Muestra el CO₂ reciente de la cabina | Inferir causalidad | Se aclara que mostrar ambos no implica que uno cause el otro |

## 8. Limitaciones

**Del prototipo**

- Es una propuesta de diseño de un hackathon, no una herramienta validada clínicamente.
- Las preguntas del chequeo son originales y no están validadas. La regla de comparación y los umbrales son valores de diseño.
- Los días anteriores del chequeo y todas las lecturas son simulados.
- No implementa control de acceso real, cifrado, canal privado ni protocolo de derivación.

**De los datos**

- No hay datos individuales diarios de salud de astronautas de acceso abierto. Los datos médicos de astronautas se conservan en repositorios de la NASA y pueden pedirse con fines de investigación, con consentimiento y una revisión de atribuibilidad [F22]; los resultados publicados son agregados [F06, F08].

**De la evidencia**

- **Muestras pequeñas:** 3 tripulantes en el estudio de demora de la ISS [F09], 6 en Mars-500 [F07], 24 en el estudio de sueño y estrés [F08].
- **Vuelo y simulación no son equivalentes:** Mars-500 no reprodujo microgravedad, radiación ni riesgo vital, y su tripulación fue solo masculina [F07].
- **Evidencia de equipo escasa en vuelo** [F04].
- **Asociación no es causalidad:** la relación entre sueño, estrés y desempeño en vuelo es observacional [F08].
- **Transferencias por analogía:** la fatiga de alarmas viene de hospitales [F19, F28], y la evidencia sobre automatización, de aviación y laboratorio [F17, F18].
- **Antigüedad:** la fuente principal sobre subregistro es de 2001 [F11].
- Algunas fuentes se consultaron en su resumen o en fragmentos; los números citados deben confirmarse en el original antes de usarlos en otro contexto.

## 9. Preguntas abiertas

1. No hay un criterio validado para separar un episodio de tensión de un patrón.
2. No se sabe qué adherencia tendría un autorreporte diario durante una misión de años.
3. No está demostrado que un lenguaje no culpabilizante o un mayor control sobre los propios datos mejoren la honestidad del reporte en astronautas. Son hipótesis razonables.
4. No hay evidencia directa en humanos de efectos conductuales de la radiación espacial [F03].
5. Qué diseño de mensajería asincrónica funciona mejor con demoras marcianas [F27].

## 10. Referencias

| ID | Referencia |
|---|---|
| F01 | NASA, Office of the Chief Health and Medical Officer. *Human Spaceflight Hazards*. https://www.nasa.gov/ochmo-hmta-human-spaceflight-hazards |
| F02 | NASA (2023). *Human Health and Performance: Keeping Astronauts Safe & Productive On a Mission to Mars*. NTRS 20230015521. https://ntrs.nasa.gov/citations/20230015521 |
| F03 | Dev, S. I., Whiting, S. E., Nelson, G. A., Dotson, V., Mulavara, A., Schorn, J. M. y Williams, T. J. (2025). *Risk of Adverse Cognitive or Behavioral Changes and Psychiatric Disorders*. NASA HRP. NTRS 20250001454. https://ntrs.nasa.gov/citations/20250001454 |
| F04 | Landon, L. B. et al. (2022). *Risk of Performance and Behavioral Health Decrements Due to Inadequate Cooperation, Coordination, Communication, and Psychosocial Adaptation within a Team*. NASA HRP. NTRS 20220007465. https://ntrs.nasa.gov/citations/20220007465 |
| F05 | NASA, Human System Risk Board. *Team Risk*. https://www.nasa.gov/directorates/esdmd/hhp/team-risk/ |
| F06 | Barger, L. K. et al. (2014). Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight. *The Lancet Neurology, 13*(9), 904-912. https://doi.org/10.1016/S1474-4422(14)70122-X |
| F07 | Basner, M. et al. (2014). Psychological and behavioral changes during confinement in a 520-day simulated interplanetary mission to Mars. *PLoS ONE, 9*(3), e93298. https://doi.org/10.1371/journal.pone.0093298 |
| F08 | Jones, C. W., Basner, M., Mollicone, D. J., Mott, C. M. y Dinges, D. F. (2022). Sleep deficiency in spaceflight is associated with degraded neurobehavioral functions and elevated stress in astronauts on six-month missions aboard the International Space Station. *Sleep, 45*(3), zsac006. https://pmc.ncbi.nlm.nih.gov/articles/PMC8919197 |
| F09 | Kintz, N. M. y Palinkas, L. A. (2016). Communication delays impact behavior and performance aboard the International Space Station. *Aerospace Medicine and Human Performance, 87*(11), 940-946. https://doi.org/10.3357/AMHP.4626.2016 |
| F10 | NASA. *Spaceflight Standard Measures* (página institucional) y documentos técnicos NTRS 20170005421, 20180002943, 20190000670 y 20200001281. https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space |
| F11 | Institute of Medicine (2001). *Safe Passage: Astronaut Care for Exploration Missions*. National Academies Press. https://doi.org/10.17226/10218 |
| F12 | NASA. NASA-STD-3001, Vol. 1, sección 6, *Medical Operations*. https://www.nasa.gov/reference/6-0-medical-operations/ |
| F13 | NASA Johnson Space Center, Behavioral Health and Performance Operations. Servicios de salud conductual para astronautas. NTRS 20170003866. https://ntrs.nasa.gov/citations/20170003866 |
| F14 | NASA, OCHMO. *Technical Brief OCHMO-TB-014: Behavioral Health Mishaps*. https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-014-behavioral-health-mishaps.pdf |
| F15 | Van Dongen, H. P. A., Maislin, G., Mullington, J. M. y Dinges, D. F. (2003). The cumulative cost of additional wakefulness. *Sleep, 26*(2), 117-126. https://ntrs.nasa.gov/citations/20040087752 |
| F16 | Van Dongen, H. P. A., Baynard, M. D., Maislin, G. y Dinges, D. F. (2004). Systematic interindividual differences in neurobehavioral impairment from sleep loss: evidence of trait-like differential vulnerability. *Sleep, 27*(3), 423-433. |
| F17 | Parasuraman, R. y Manzey, D. H. (2010). Complacency and bias in human use of automation: an attentional integration. *Human Factors, 52*(3), 381-410. https://doi.org/10.1177/0018720810376055 |
| F18 | Lee, J. D. y See, K. A. (2004). Trust in automation: designing for appropriate reliance. *Human Factors, 46*(1), 50-80. https://doi.org/10.1518/hfes.46.1.50_30392 |
| F19 | Hall, K. K. et al. (2020). *Making Healthcare Safer III*, capítulo sobre fatiga de alarmas. Agency for Healthcare Research and Quality. https://www.ncbi.nlm.nih.gov/books/NBK555522/ |
| F20 | W3C. *Web Content Accessibility Guidelines 2.2*, criterios 1.4.1 y 1.4.3. https://www.w3.org/TR/WCAG22/ |
| F21 | Carney, C. E. et al. (2012). The consensus sleep diary. *Sleep, 35*(2), 287-302. https://doi.org/10.5665/sleep.1642 |
| F22 | Wear, M. L. et al. (2017, 2018). *Protecting Astronaut Medical Privacy: Review of Presentations and Publications for Attributability*; Van Baalen, M. (2017). *Accessing NASA Astronaut Medical and Research Data*. NTRS 20170009498, 20180004918, 20170009502. |
| F23 | Hart, S. G. y Staveland, L. E. (1988). Development of NASA-TLX (Task Load Index). En P. A. Hancock y N. Meshkati (eds.), *Human Mental Workload*, 139-183. |
| F24 | NASA Space Apps Challenge 2026. *Create Health Monitoring Software for Astronauts on Space Missions*. https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/ |
| F25 | NASA HRP. *Evidence Report: Risk of Adverse Cognitive or Behavioral Conditions and Psychiatric Disorders* (2016). NTRS 20160004365. |
| F26 | Basner, M., Mollicone, D. y Dinges, D. F. (2011). Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. *Acta Astronautica, 69*, 949-959. https://doi.org/10.1016/j.actaastro.2011.07.015 |
| F27 | Parisi, M. et al. (2024). Revisión de NASA Ames sobre demora de comunicación (AHFE 2024); Karasinski, J. et al. (2025). NTRS 20250000703. |
| F28 | Paine, C. W. et al. (2016). Systematic review of physiologic monitor alarm characteristics and pragmatic interventions to reduce alarm frequency. *Journal of Hospital Medicine, 11*, 136-144; Winters, B. D. et al. (2018). Technological distractions (part 2): a summary of approaches to manage clinical alarms. *Critical Care Medicine, 46*(1), 130-137. https://doi.org/10.1097/CCM.0000000000002803 |
| F29 | NASA (2021). Capacidades médicas para misiones de exploración. NTRS 20210023828. |
| F30 | NASA. NASA-STD-3001, Vol. 1, Rev. C, requisito V1 3006. https://standards.nasa.gov/sites/default/files/standards/NASA/C//nasa-std-3001-vol-1-rev-c-signature.pdf |
| F31 | NASA. *Houston We Have a Podcast*, episodio 431 (CHAPEA 2). |
| F32 | Law, J. y Alexander, D. (2016). *CO2 on the International Space Station: An Operations Update*. NTRS 20150019624. https://ntrs.nasa.gov/citations/20150019624 |

## 11. English summary

**Purpose.** This document adds a social psychology and human factors perspective to Tesai, a hackathon prototype of health monitoring software for astronauts on long missions. It turns published evidence on isolation, team dynamics, communication delay, trust and self-report into product decisions: what to ask, how to alert, and what to protect. It is not a clinical guide.

**Background.** NASA groups spaceflight risks into five hazards and treats both adverse behavioral conditions and inadequate team functioning as formal risks. For missions of up to six months in low Earth orbit, adverse behavioral events are relatively rare, and the risk is expected to rise with duration and distance. Astronauts averaged about six hours of sleep per night in flight, and short sleep was associated with slower responses and higher stress in a study of 24 astronauts (an observational association).

**Main psychosocial risks.** (1) Team cohesion can decline over long missions, but there is no reliable time pattern. (2) Conflict concentrates on mission control and on a few individuals: in the 520-day Mars-500 simulation, conflicts with mission control were reported about five times more often than conflicts among crew members. (3) Communication delay strains the crew-ground relationship. (4) Astronauts have documented reasons to under-report symptoms, because health data can affect future flight assignments. Self-perception misses accumulated fatigue, and individual differences are large and stable.

**What Tesai does with this.**
- A private daily check-in with five 0–10 scales (sleep quality, mood, calm, mental sharpness, connection with the crew), all in the same direction, with labeled ends and stated time periods. Tension (crew or mission control, no names) and symptoms are optional.
- Answers stay on the device. Other crew members never see them, and there are no group averages, because in a crew of four to six an "anonymous" average points to a person.
- The check-in never raises alerts and never earns points, because rewarding a self-report invites inflating it.
- Each person is compared only with their own history. A change is described in terms of the person's own data, never as a diagnosis. "Similar to your usual" does not mean "healthy".
- A reported headache is shown next to recent cabin CO₂, without claiming cause.
- Missing data is shown as missing, never as normal. The system describes; a human decides.

**Limits.** This is a hackathon prototype. It does not diagnose. The check-in questions are original and unvalidated, and the comparison rule is a design value. All data in the demo is simulated. Key studies have small samples, analog missions differ from spaceflight, and some evidence is transferred by analogy from hospitals and aviation. Any emotional-safety item and any referral protocol must be defined by qualified health professionals.
