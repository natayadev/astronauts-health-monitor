/* Simulation · Spanish/English texts. Classic script: runs while the page is parsed, before the scene. */
(() => {
  const D = {
    'Simulación · Tesai': 'Simulation · Tesai',
    'Tesai · NASA Space Apps 2026': 'Tesai · NASA Space Apps 2026',
    'Un segundo médico dentro de tu visor.': 'A second doctor inside your visor.',
    'Tesai lee los signos vitales de toda la tripulación, te guía paso a paso en una emergencia y envía todo a la Tierra automáticamente, porque desde Marte la Tierra tarda hasta 20 minutos en enterarse.': 'Tesai reads the whole crew’s vital signs, guides you step by step through an emergency and sends everything to Earth automatically, because from Mars it takes Earth up to 20 minutes to find out.',
    'Simulación 1': 'Simulation 1', 'Simulación 2': 'Simulation 2', 'Simulación 3': 'Simulation 3',
    'EVA en Marte': 'EVA on Mars', 'Rover presurizado': 'Pressurized rover', 'Nave en tránsito': 'Ship in transit',
    'Ana colapsa en plena caminata. Con el traje puesto no hay RCP posible: el DEA del rover es la clave. Y el regolito no deja ver.': 'Ana collapses mid-walk. With the suit on, CPR is impossible: the rover’s AED is the key. And regolith blocks your view.',
    'Luis se desploma al volante. Tesai detiene el rover, avisa a todos y te guía con el DEA y la RCP dentro de la cabina.': 'Luis collapses at the wheel. Tesai stops the rover, alerts everyone and guides you through the AED and CPR inside the cabin.',
    'Día 96 rumbo a Marte. Mei pierde el conocimiento en microgravedad: hay que fijarla a la camilla antes de reanimarla.': 'Day 96 en route to Mars. Mei loses consciousness in microgravity: you must strap her to the stretcher before resuscitating her.',
    'Retardo 20 min': '20 min delay', 'Retardo 12 min': '12 min delay', 'Regolito': 'Regolith', 'DEA': 'AED',
    'RCP guiada': 'Guided CPR', 'Microgravedad': 'Microgravity',
    'Visor con datos': 'Data in your visor', 'ECG, SpO₂, presión, respiración y estado del traje de cada tripulante, siempre a la vista.': 'ECG, SpO₂, blood pressure, breathing and suit status for every crew member, always in view.',
    'Segundo médico': 'Second doctor', 'Detecta el paro, te dice qué hacer y te marca el ritmo de la RCP en tiempo real, con voz.': 'Detects the arrest, tells you what to do and sets the CPR pace in real time, by voice.',
    'Envío automático': 'Automatic uplink', 'Cada evento sale solo hacia la Tierra. Cuando responden, tú ya actuaste.': 'Every event goes to Earth on its own. By the time they reply, you have already acted.',
    'moverse': 'move', 'Mouse': 'Mouse', 'mirar': 'look', 'mantener para actuar': 'hold to act', 'Espacio': 'Space',
    'RCP · saltar · subir': 'CPR · jump · rise', 'limpiar visor': 'clear visor', 'voz del asistente': 'assistant voice',
    'Simulación educativa. La guía de RCP es simplificada y no reemplaza un curso certificado.': 'Educational simulation. The CPR guidance is simplified and does not replace a certified course.',
    'Resumen de la simulación': 'Simulation summary', 'Alerta → pulso recuperado': 'Alert → pulse restored',
    'Primera respuesta posible de la Tierra': 'Earliest possible reply from Earth', 'Paquetes enviados solos a la Tierra': 'Packets sent to Earth automatically',
    'Calidad de la RCP (100–120 cpm)': 'CPR quality (100–120 cpm)', 'Dispositivos alertados': 'Devices alerted', 'Elegir otra simulación': 'Choose another simulation',
    'Volver a Tesai': 'Back to Tesai', 'Iniciar simulación': 'Start the simulation', 'Menú': 'Menu', 'Pausa': 'Paused', 'Simulación en pausa': 'Simulation paused', 'Continuar': 'Resume',
    'El reloj y la guía están detenidos. Tu progreso en esta simulación se pierde si cambias de simulación o vuelves a Tesai.': 'The clock and the guidance are stopped. Your progress in this simulation is lost if you switch simulation or go back to Tesai.',
    'Vista en primera persona de la simulación': 'First-person view of the simulation',
    'Astronauta caminando sobre la superficie rojiza de Marte con un rover al fondo': 'Astronaut walking on the reddish surface of Mars with a rover in the background',
    'Interior de un rover presurizado con vista al desierto marciano': 'Interior of a pressurized rover overlooking the Martian desert',
    'Interior blanco de una nave espacial con una ventana redonda que muestra Marte': 'White spacecraft interior with a round window showing Mars',
    'Rumbo': 'Heading', 'Tu traje · Tomás': 'Your suit · Tomás', 'Tu visor AR · Tomás': 'Your AR visor · Tomás', 'Tu pulso': 'Your pulse',
    'traje': 'suit', 'cabina': 'cabin', 'Presión': 'Pressure', 'Temp.': 'Temp.', 'Batería': 'Battery', 'Radiación': 'Radiation',
    'Polvo visor': 'Visor dust', 'Filtro regolito': 'Regolith filter', 'Gravedad': 'Gravity',
    'Tesai · segundo médico': 'Tesai · second doctor', 'Voz · M': 'Voice · M', 'Silencio · M': 'Muted · M', 'Listo.': 'Ready.',
    'Ritmo sinusal': 'Sinus rhythm', 'Presión art.': 'Blood pressure', 'Respiración': 'Breathing', 'Confianza': 'Confidence',
    'Tierra · envío automático': 'Earth · auto uplink', 'Retardo una vía': 'One-way delay', 'Respuesta médica': 'Medical reply',
    'sin pedidos': 'none requested', 'recibido': 'received', 'recibida': 'received',
    'Regolito en el visor · mantén': 'Regolith on visor · hold', 'Objetivo': 'Objective',
    'Haz clic para mirar con el mouse · Esc para pausar y abrir el menú': 'Click to look with the mouse · Esc to pause and open the menu',
    'Todo bien': 'All good', 'Velocidad': 'Speed', 'Tránsito': 'Transit', 'Día 96 · 225 M km': 'Day 96 · 225 M km',
    'Nave Hermes': 'Hermes ship', 'Hermes · día 96': 'Hermes · day 96', 'Sol 214 · Kestrel': 'Sol 214 · Kestrel',
    'Visor': 'Visor', 'Reloj': 'Watch', 'Rover': 'Rover', 'Hábitat': 'Habitat', 'Pantallas rover': 'Rover screens',
    'Pantallas nave': 'Ship screens', 'Tripulación': 'Crew', 'Tierra (+20 min)': 'Earth (+20 min)', 'Tierra (+12 min)': 'Earth (+12 min)',
    'Tierra avisada (+20 min)': 'Earth notified (+20 min)', 'Tierra avisada (+12 min)': 'Earth notified (+12 min)', 'Tierra a 12 min 30 s': 'Earth 12 min 30 s away',
    'Usa': 'Use', 'y el mouse. La baliza está junto a Ana.': 'and the mouse. The beacon is next to Ana.',
    'Mantén': 'Hold', 'Presiona': 'Press', 'para cada ventilación': 'for each breath', 'para apurarte': 'to hurry',
    'o clic en cada compresión, al ritmo del punto': 'or click on each compression, in time with the dot',
    '+ mirar ·': '+ look ·', 'sube ·': 'up ·', 'baja': 'down',
    'cambiar el filtro': 'change the filter', 'colocar los parches': 'place the pads', 'conectar los electrodos al puerto del traje': 'connect the electrodes to the suit port',
    'conectar su biomonitor a tu visor': 'link her biomonitor to your visor', 'evaluar si responde y respira': 'check if they respond and breathe',
    'fijarla con las correas': 'secure her with the straps', 'registrar el experimento': 'log the experiment', 'sacar el DEA del rover': 'take the AED from the rover',
    'sujetarla': 'grab her', 'tomar el DEA': 'take the AED', 'dar la descarga': 'deliver the shock',
    'Alerta automática enviada': 'Automatic alert sent', 'ALERTA automática · ECG + SpO₂ + ubicación': 'Automatic ALERT · ECG + SpO₂ + location',
    'Alto. Analizando de nuevo.': 'Stop. Analyzing again.', 'Alto. El DEA analiza de nuevo.': 'Stop. The AED is analyzing again.',
    'Ana colapsó. Ve con ella ya': 'Ana collapsed. Go to her now', 'Ana colapsó. Ya avisé al rover, al hábitat y a la Tierra. Ve con ella.': 'Ana collapsed. I already alerted the rover, the habitat and Earth. Go to her.',
    'Ana tiene pulso. Sigo monitoreándola y la Tierra ya recibe todo.': 'Ana has a pulse. I keep monitoring her and Earth is already receiving everything.',
    'Ana tiene pulso. Volvamos al hábitat': 'Ana has a pulse. Let’s head back to the habitat',
    'Ana va adelante, junto a la baliza. Tu visor, tu reloj y el rover comparten sus signos vitales.': 'Ana is ahead, by the beacon. Your visor, your watch and the rover share her vital signs.',
    'Ana: paro cardíaco detectado': 'Ana: cardiac arrest detected', 'Analizando': 'Analyzing', 'Baliza': 'Beacon',
    'Bien hecho. Deja que el DEA vuelva a analizar.': 'Well done. Let the AED analyze again.',
    'Cabeza hacia atrás, mentón arriba. Cada ventilación dura 1 segundo.': 'Head tilted back, chin up. Each breath lasts 1 second.',
    'Cambia el filtro de regolito (pared trasera)': 'Change the regolith filter (back wall)', 'Cambiado por Tomás': 'Replaced by Tomás', 'Cambiar ahora': 'Replace now',
    'Camilla': 'Stretcher', 'Camilla: fondo del módulo': 'Stretcher: end of the module', 'Camina hasta la baliza de muestras': 'Walk to the sample beacon',
    'Coloca los parches del DEA en Luis': 'Place the AED pads on Luis', 'Coloca los parches del DEA': 'Place the AED pads', 'Colocar parches': 'Place pads',
    'Comienza la caminata · Sol 214': 'The walk begins · Sol 214', 'Compresiones · Espacio o clic al ritmo del punto': 'Compressions · Space or click in time with the dot',
    'Conecta el DEA al traje de Ana': 'Connect the AED to Ana’s suit', 'Conectar electrodos': 'Connect electrodes',
    'DEA en uso': 'AED in use', 'DEA retirado del rover': 'AED removed from rover', 'DEA · desfibrilador': 'AED · defibrillator', 'DEA · reanálisis': 'AED · re-analysis',
    'DEA: pared izquierda': 'AED: left wall', 'DEA: rack verde': 'AED: green rack', 'Descarga DEA · 200 J': 'AED shock · 200 J', 'Descarga del DEA': 'AED shock',
    'Descarga hecha. Reviso de nuevo su ritmo.': 'Shock delivered. Checking the rhythm again.', 'Descarga': 'Shock',
    'Destino: base Jezero · 38 km': 'Destination: Jezero base · 38 km', 'Detenido': 'Stopped', 'Día 96 rumbo a Marte': 'Day 96 en route to Mars',
    'El DEA está trabajando · no toques al paciente': 'The AED is working · do not touch the patient', 'El DEA vuelve a analizar': 'The AED is analyzing again',
    'El polvo que entra con los trajes satura el filtro. Date vuelta: está atrás.': 'Dust brought in on the suits clogs the filter. Turn around: it’s behind you.',
    'Electrodos conectados. Nadie toca a Ana: analizando el ritmo.': 'Electrodes connected. Nobody touch Ana: analyzing the rhythm.',
    'Empieza la RCP ya. Sigue el punto: 30 compresiones, fuerte y rápido.': 'Start CPR now. Follow the dot: 30 compressions, hard and fast.',
    'En microgravedad no puedes reanimarla flotando. Sujétala.': 'In microgravity you can’t resuscitate her while floating. Grab her.',
    'En ruta a la base Jezero': 'En route to Jezero base',
    'Engancha los pies en los estribos de la camilla para hacer fuerza. Brazos rectos, centro del pecho.': 'Hook your feet into the stretcher stirrups for leverage. Arms straight, center of the chest.',
    'Evaluación · sin respuesta · FV': 'Assessment · unresponsive · VF', 'Evaluación · sin respuesta · sin respiración': 'Assessment · unresponsive · not breathing',
    'Evaluar a Ana': 'Assess Ana', 'Evaluar a Luis': 'Assess Luis', 'Evaluar a Mei': 'Assess Mei', 'Experimento registrado': 'Experiment logged',
    'FV · RCP en curso': 'VF · CPR in progress', 'Fibrilación ventricular · crítico': 'Ventricular fibrillation · critical',
    'Fijada. Ahora coloca los parches del DEA.': 'Secured. Now place the AED pads.', 'Fijarla en la camilla': 'Strap her to the stretcher',
    'Filtro al 100%. Buen trabajo.': 'Filter at 100%. Good job.', 'Filtro cambiado': 'Filter replaced', 'Filtro de regolito': 'Regolith filter', 'Filtro': 'Filter',
    'Flota hasta el panel del laboratorio': 'Float to the lab panel',
    'Hola, Tomás. Día 96 de tránsito. Monitoreo a Mei y a ti; la Tierra está a 12 minutos y medio.': 'Hi, Tomás. Day 96 of transit. I’m monitoring Mei and you; Earth is twelve and a half minutes away.',
    'Hola, Tomás. Luis maneja y yo monitoreo a los dos. El filtro de regolito está casi saturado.': 'Hi, Tomás. Luis is driving and I’m monitoring you both. The regolith filter is almost clogged.',
    'Hola, Tomás. Monitoreo a Ana y a ti en tiempo real. Todo normal por ahora.': 'Hi, Tomás. I’m monitoring Ana and you in real time. All normal for now.',
    'Kestrel · ruta 14': 'Kestrel · route 14', 'La Tierra ya respondió · cerrando la simulación': 'Earth has replied · closing the simulation',
    'La llevas contigo. Ve a la camilla médica, al fondo del módulo.': 'You’re carrying her. Go to the medical stretcher at the end of the module.',
    'Laboratorio · cultivo 7': 'Lab · culture 7', 'Laboratorio': 'Lab', 'Llegó la respuesta de la Tierra': 'Earth’s reply arrived', 'Llévala a la camilla médica': 'Take her to the medical stretcher',
    'Luis maneja. Tesai monitorea a los dos y muestra todo en tu visor, tu reloj y las pantallas del rover.': 'Luis is driving. Tesai monitors you both and shows everything on your visor, your watch and the rover screens.',
    'Luis se desplomó. Detuve el rover y avisé a la Tierra. Ve con él.': 'Luis collapsed. I stopped the rover and alerted Earth. Go to him.',
    'Luis se desplomó. Ve con él': 'Luis collapsed. Go to him',
    'Luis tiene pulso. Lo sigo monitoreando y la Tierra ya tiene todo el registro.': 'Luis has a pulse. I keep monitoring him and Earth already has the full record.',
    'Luis tiene pulso. Quédate con él': 'Luis has a pulse. Stay with him',
    'Luis · estable': 'Luis · stable', 'Luis · pulso recuperado': 'Luis · pulse restored', 'Luis: paro cardíaco detectado': 'Luis: cardiac arrest detected', 'Luis: signos normales': 'Luis: vitals normal',
    'Mei perdió el conocimiento. Avisé a la nave y a la Tierra. Ve con ella.': 'Mei lost consciousness. I alerted the ship and Earth. Go to her.',
    'Mei perdió el conocimiento. Ve con ella': 'Mei lost consciousness. Go to her', 'Mei tiene pulso. Mantenla monitoreada': 'Mei has a pulse. Keep her monitored',
    'Mei tiene pulso. Todo queda registrado y enviado a la Tierra.': 'Mei has a pulse. Everything is logged and sent to Earth.',
    'Mei · estable': 'Mei · stable', 'Mei · pulso recuperado': 'Mei · pulse restored', 'Mei: paro cardíaco detectado': 'Mei: cardiac arrest detected',
    'Microgravedad. Tesai monitorea a Mei y a ti y envía todo a la Tierra, a 12 minutos y medio de distancia.': 'Microgravity. Tesai monitors Mei and you and sends everything to Earth, twelve and a half minutes away.',
    'Monitoreo continuo': 'Continuous monitoring', 'Monitoreo': 'Monitoring', 'Muestra lista para registrar': 'Sample ready to log',
    'Nadie toca a Mei: analizando.': 'Nobody touch Mei: analyzing.', 'No aplica (traje)': 'N/A (suit)', 'No pares: cada segundo sin compresiones cuenta.': 'Don’t stop: every second without compressions counts.',
    'No responde y no respira normal: es un paro cardíaco. Trae el DEA de la pared izquierda.': 'Unresponsive and not breathing normally: it’s cardiac arrest. Bring the AED from the left wall.',
    'Objetivo: 100 a 120 por minuto': 'Target: 100 to 120 per minute',
    'Parches colocados. Nadie toca a Luis: analizando.': 'Pads placed. Nobody touch Luis: analyzing.', 'Paro cardíaco detectado': 'Cardiac arrest detected',
    'Paro cardíaco. Con el traje puesto no se puede hacer RCP: el DEA es lo primero. Está en el rover.': 'Cardiac arrest. With the suit on, CPR isn’t possible: the AED comes first. It’s in the rover.',
    'Paro cardíaco. Trae el DEA del rack verde, en la pared derecha.': 'Cardiac arrest. Bring the AED from the green rack on the right wall.',
    'Tesai detectó el paro, alertó a cada dispositivo, te guió como un segundo médico y mandó todo a la Tierra sin que tocaras nada. La simulación acelera el retardo 60 veces.': 'Tesai detected the arrest, alerted every device, guided you like a second doctor and sent everything to Earth without you touching a thing. The simulation speeds up the delay 60×.',
    'Tesai detuvo el rover, avisó a todos los dispositivos y a la Tierra, que lo verá en 20 minutos.': 'Tesai stopped the rover and alerted every device and Earth, which will see it in 20 minutes.',
    'Pulso presente': 'Pulse present', 'Pulso recuperado · signos vitales': 'Pulse restored · vital signs', 'Tesai sigue vigilando': 'Tesai keeps watching', 'Pulso': 'Pulse', 'Tesai: monitoreando': 'Tesai: monitoring',
    'RCP en curso': 'CPR in progress', 'RCP en microgravedad: 30 y 2, dos veces': 'CPR in microgravity: 30 and 2, twice',
    'RCP ya. En microgravedad ánclate con los pies para empujar.': 'CPR now. In microgravity, anchor yourself with your feet to push.', 'RCP · 2 ciclos': 'CPR · 2 cycles',
    'RCP: 30 compresiones y 2 ventilaciones, dos veces': 'CPR: 30 compressions and 2 breaths, twice', 'Recomendada · mantén E': 'Advised · hold E', 'Reevaluar ritmo': 'Re-check rhythm',
    'Registro enviado a la Tierra': 'Record sent to Earth', 'Registro guardado y enviado a la Tierra.': 'Record saved and sent to Earth.',
    'Respondiendo a datos de hace 12 min: «Vemos a Mei en paro. Fíjenla a la camilla, usen el DEA y hagan RCP.»': 'Replying to data from 12 min ago: “We see Mei in arrest. Strap her to the stretcher, use the AED and do CPR.”',
    'Respondiendo a datos de hace 20 min: «Vemos FV en Ana. Usen el DEA y vuelvan al hábitat.»': 'Replying to data from 20 min ago: “We see VF on Ana. Use the AED and return to the habitat.”',
    'Respondiendo a datos de hace 20 min: «Vemos que Luis colapsó. Detengan el rover, usen el DEA e inicien RCP.»': 'Replying to data from 20 min ago: “We see Luis collapsed. Stop the rover, use the AED and start CPR.”',
    'Ritmo organizado detectado': 'Organized rhythm detected', 'Ritmo recuperándose': 'Rhythm recovering', 'Rover detenido por Tesai': 'Rover stopped by Tesai',
    'Sigue las indicaciones del DEA': 'Follow the AED prompts', 'Sin pulso · FV': 'No pulse · VF', 'Stream ECG + signos vitales': 'ECG + vitals stream',
    'Su biomonitor detectó fibrilación ventricular (simulada). Tesai avisó a la nave y a la Tierra, que lo verá en 12 min 30 s.': 'Her biomonitor detected ventricular fibrillation (simulated). Tesai alerted the ship and Earth, which will see it in 12 min 30 s.',
    'Su biomonitor detectó fibrilación ventricular (simulada). Tesai avisó a todos los dispositivos y a la Tierra, que lo verá en 20 minutos.': 'The biomonitor detected ventricular fibrillation (simulated). Tesai alerted every device and Earth, which will see it in 20 minutes.',
    'Sujeta a Mei': 'Grab Mei', 'Sujetar a Mei': 'Grab Mei', 'Talón de la mano en el centro del pecho, brazos rectos, unos 5 cm de profundidad.': 'Heel of the hand on the center of the chest, arms straight, about 5 cm deep.',
    'Telemetría de rutina': 'Routine telemetry', 'Tienes el DEA. Su traje tiene un puerto de electrodos en el pecho. Ve con ella.': 'You have the AED. Her suit has an electrode port on the chest. Go to her.',
    'Todos alejados del paciente.': 'Everyone clear of the patient.', 'Toma el DEA de la pared izquierda': 'Take the AED from the left wall', 'Toma el DEA del rack verde': 'Take the AED from the green rack',
    'Toma el DEA portátil del rover': 'Take the portable AED from the rover', 'Traer el DEA del rover': 'Bring the AED from the rover', 'Traer el DEA': 'Bring the AED',
    'Treinta. Ahora 2 ventilaciones con la bolsa-mascarilla: presiona E.': 'Thirty. Now 2 breaths with the bag-valve mask: press E.',
    'Velocidad 22 km/h': 'Speed 22 km/h', 'Ventilaciones · presiona E': 'Breaths · press E', 'Vida útil 100%': 'Lifespan 100%', 'Vida útil 31%': 'Lifespan 31%',
    'Volver al hábitat': 'Return to the habitat', 'Vuelve con Luis. Un parche bajo la clavícula derecha y otro al costado izquierdo.': 'Go back to Luis. One pad below the right collarbone and the other on the left side.',
    'Ustedes ya lo resolvieron.': 'You already handled it.', 'Llega tarde: tú ya estás actuando.': 'It arrives late: you are already acting.',
    'más rápido': 'faster', 'más lento': 'slower', 'buen ritmo': 'good pace'
  };
  const card = { SO: 'SW', O: 'W', NO: 'NW' };
  const R = [
    [/^Recuperaste a (\S+) en (\S+)\. La primera respuesta de la Tierra llegó a los (\S+)\.$/, (m) => `You recovered ${m[1]} in ${m[2]}. Earth’s first reply arrived at ${m[3]}.`],
    [/^(\S+) recuperó el pulso$/, (m) => `${m[1]} regained a pulse`],
    [/^(.+) (Ustedes ya lo resolvieron\.|Llega tarde: tú ya estás actuando\.)$/, (m) => `${tr(m[1])} ${D[m[2]]}`],
    [/^Ciclo (\d+)\. Sigue: fuerte y rápido\.$/, (m) => `Cycle ${m[1]}. Keep going: hard and fast.`],
    [/^Descarga recomendada\. Que nadie toque a (\S+)\. Mantén E\.$/, (m) => `Shock advised. Nobody touch ${m[1]}. Hold E.`],
    [/^La respuesta de la Tierra llega en (\S+)$/, (m) => `Earth’s reply arrives in ${m[1]}`],
    [/^para dar la descarga · nadie toca a (\S+)$/, (m) => `to deliver the shock · nobody touch ${m[1]}`],
    [/^para (.+)$/, (m) => `to ${tr(m[1])}`],
    [/^No toques a (\S+)$/, (m) => `Don’t touch ${m[1]}`],
    [/^Paro · a ([\d.]+) m$/, (m) => `Arrest · ${m[1]} m away`],
    [/^Paso (\d+) de (\d+)$/, (m) => `Step ${m[1]} of ${m[2]}`],
    [/^Tesai lo registró y lo envió solo a la Tierra\. Llegará en (\S+)\.$/, (m) => `Tesai logged it and sent it to Earth on its own. It will arrive in ${m[1]}.`],
    [/^RCP ciclo (\d+) · 30:2 · calidad (\d+)%$/, (m) => `CPR cycle ${m[1]} · 30:2 · quality ${m[2]}%`],
    [/^RCP guiada · ciclo (\d+) de (\d+)$/, (m) => `Guided CPR · cycle ${m[1]} of ${m[2]}`],
    [/^Ritmo organizado y pulso presente\. Recuperamos a (\S+)\.$/, (m) => `Organized rhythm and pulse present. We got ${m[1]} back.`],
    [/^en (\d+:\d+)$/, (m) => `in ${m[1]}`],
    [/^(\d+) cpm · (.+)$/, (m) => `${m[1]} cpm · ${tr(m[2])}`],
    [/^(.+?) · (\d+) lpm(.*)$/, (m) => `${tr(m[1])} · ${m[2]} bpm${m[3]}`],
    [/^(\d{3})° (\S+)$/, (m) => `${m[1]}° ${card[m[2]] || m[2]}`],
    [/^(.+) · ([\d.]+) m$/, (m) => `${tr(m[1])} · ${m[2]} m`],
    [/^(.+) a ([\d.]+) m( ·)?$/, (m) => `${tr(m[1])} · ${m[2]} m${m[3] || ''}`],
    [/^(.+) · biomonitor$/, (m) => `${tr(m[1])} · biomonitor`],
    [/^Temp ([\d.]+ °C)$/, (m) => `Temp ${m[1]}`]
  ];
  function tr(s) {
    if (I.lang !== 'en' || !s) return s;
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim();
    if (!core) return s;
    let out = D[core];
    if (out === undefined) for (const [re, fn] of R) { const m = core.match(re); if (m) { out = fn(m); break; } }
    return out === undefined ? s : lead + out + trail;
  }
  const I = { lang: 'es', tr };
  window.i18n = I;
  const orig = new WeakMap();
  const SKIP = new Set(['SCRIPT', 'STYLE', 'KBD']);
  function apply(node) {
    const p = node.parentNode; if (!p || SKIP.has(p.nodeName)) return;
    const v = node.nodeValue, t = tr(v);
    if (t !== v) { orig.set(node, v); node.nodeValue = t; }
  }
  function walk(root, fn) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) fn(n);
  }
  const ATTRS = ['alt', 'aria-label'];
  function attrs() {
    document.querySelectorAll('[alt],[aria-label]').forEach((el) => ATTRS.forEach((a) => {
      if (!el.hasAttribute(a)) return;
      if (!el.dataset['es' + a.replace('-', '')]) el.dataset['es' + a.replace('-', '')] = el.getAttribute(a);
      const es = el.dataset['es' + a.replace('-', '')];
      el.setAttribute(a, I.lang === 'en' ? (D[es] || es) : es);
    }));
  }
  const kbdEn = (on) => document.querySelectorAll('kbd, .tbtn').forEach((k) => {
    if (k.textContent === 'Espacio' && on) k.textContent = 'Space';
    else if (k.textContent === 'Space' && !on) k.textContent = 'Espacio';
  });
  const mo = new MutationObserver((recs) => {
    if (I.lang !== 'en') return;
    for (const r of recs) {
      if (r.type === 'characterData') apply(r.target);
      else r.addedNodes.forEach((n) => { if (n.nodeType === 3) apply(n); else if (n.nodeType === 1) { walk(n, apply); kbdEn(true); } });
    }
    mo.takeRecords();
  });
  function setLang(l) {
    I.lang = l;
    document.documentElement.lang = l;
    document.title = l === 'en' ? D['Simulación · Tesai'] : 'Simulación · Tesai';
    if (l === 'en') walk(document.body, apply);
    else walk(document.body, (n) => { if (orig.has(n)) { n.nodeValue = orig.get(n); orig.delete(n); } });
    mo.takeRecords();
    attrs(); kbdEn(l === 'en');
  }
  I.set = setLang;
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  TesaiLang.on(setLang);   /* the switch lives in the site bar (shared/site-bar.js); English by default */
})();
