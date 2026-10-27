---
name: anuncios-estilo-lego
description: Genera anuncios publicitarios con IA en formato "estilo Lego" (minifiguras LEGO y mundos de ladrillos con el look de The LEGO Movie para todo lo humano, animación médica 3D para el mecanismo y el producto real dentro del mundo Lego, con un narrador en voz en off que abre con el resultado y una línea de tiempo y después cuenta cómo funciona, la prueba, el dolor y su causa) para marcas DTC/Ecommerce en Estados Unidos y Latinoamérica. Lo que no se puede mostrar se cuenta con metáforas hechas de piezas. Acepta un guion ganador ya escrito y lo convierte en tomas. Usar SIEMPRE que el usuario pida un anuncio, video ad, guion o creativo "estilo Lego", "Legos", "minifiguras", "anuncio Lego", o mencione crear anuncios con IA sin especificar estilo (ofrecerlo como opción). Arma el guion en ES/EN/PT, los prompts, el B-roll 1:1, el guion para ElevenLabs y el manifiesto interno; en el chat da un resumen corto y tres opciones (producirlo todo, solo imágenes y videos, o el paquete de prompts).
---

# Generador de Anuncios IA — Estilo Lego

Convierte un producto en un anuncio completo estilo Lego: guion + prompts de imagen y video por cada toma + el manifiesto de producción con el que el pipeline genera las imágenes, los videos, la voz y el montaje. La skill no genera imágenes/video directamente (salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente): describe el anuncio; el motor lo produce. En esta versión del sistema, las imágenes y los videos los generas tú en Google Flow a partir de la cola que arma el motor, y solo después del Paso final. Interactúa siempre en español con el usuario, sin importar el idioma del anuncio.

## Cómo reconocer este estilo

- **Tres looks, y cada uno tiene su trabajo.** No es un solo render para todo el anuncio: la skill decide el look de cada toma según lo que muestra.

| Look | Para qué | Cómo se ve |
|---|---|---|
| **Lego** | Todo lo humano: los personajes, sus lugares, el dolor, el resultado, el CTA cuando lo cierra una minifigura y las metáforas (2.6) | Minifiguras LEGO clásicas (amarillas por defecto) en sets de ladrillos con studs visibles, render de juguete casi fotográfico al estilo de The LEGO Movie. Dentro del set caben cosas reales a escala de la minifigura: telas, líquidos, comida, papel, billetes, frascos |
| **Animación médica 3D** | El mecanismo cuando el producto actúa en el cuerpo: lo que pasa por dentro | Render médico semirrealista: vasos, células, tejido húmedo y brillante, láminas anatómicas translúcidas, partículas que brillan, sobre el fondo oscuro del interior del cuerpo. Nada de Lego |
| **Real sobre piezas** | El producto, el ingrediente, la cápsula, el packshot, y cualquier primer plano cuyo sujeto sea algo real sin minifigura (pastillas, polvo, papel, billetes, gotas, el envase de la competencia) | El producto real con su etiqueta (nunca convertido en ladrillos) y lo real de la toma, apoyados sobre superficies y sets Lego |

- **El esqueleto narrativo** (la plantilla del 2.1): abre con el resultado y una línea de tiempo → cómo funciona → la prueba, y alguien cercano que lo nota → el dolor de antes y su verdadera causa → el producto → la oferta. Narración rápida, casi conversacional, de un **narrador en voz en off**: nadie habla a cámara y nada se canta; la cámara salta de escena en escena. Con la plantilla completa el anuncio ronda el minuto y medio, y lleva B-roll. Subtítulos que "rebotan" palabra por palabra ("Bounce captions"). El mismo personaje puede aparecer en varias escenas y lugares muy distintos.
- **Lo que no se puede mostrar se muestra con una pieza** (2.6). En Lego las partes del cuerpo son piezas que se encajan, se sueltan y se cambian, y cualquier cosa del mundo (una alcancía, un reloj, una torre) se arma y se desarma: la pierna hinchada es una pieza transparente llena de agua turbia, el pelo que se cae es la pieza de pelo que se suelta, la plata que se escapa son monedas cayendo por el hueco de una alcancía de ladrillos. Es la herramienta propia del estilo y sirve para cualquier producto.
- **En el motor** es un estilo de `voz_en_off` con **música fija: "Open Up Emotions"**, pareja y bien por debajo de la voz, sin subir en el final; `npm run musica` la pone sola en el anuncio (sin Suno, sin costo), y si el usuario pide otra, se usa la suya. La voz la elige el usuario y el motor la deja sola a su nivel. Las imágenes salen de Google Flow con Nano Banana Pro, el que reemplaza a GPT Image 2.5 (el modelo exacto lo dice cada trabajo de la cola). Subtítulos, transiciones y efectos van como en cualquier estilo de voz en off.

## Paso 0 — Si el guion ya viene escrito (atajo)

**Este paso solo se activa cuando el guion llega de afuera. Si no llega ninguno, ignóralo entero y empieza por el Paso 1, como siempre.**

Se reconoce porque **el usuario pega un guion** que ya le funciona y pide convertirlo a este estilo ("tengo este anuncio ganador, pásamelo a Lego"). Llega como texto corrido.

### Lo que NO haces cuando llega un guion

- **No escribes un guion nuevo, ni "mejoras" el que te dieron.** Sáltate el Paso 2 entero salvo el desglose (2.5) y las metáforas (2.6): la estructura (2.1 a 2.3) ya está resuelta dentro del texto que llegó.
- **No cambias una sola palabra del texto.** Puedes partirlo en líneas y decidir dónde corta cada toma; nunca reescribirlo, ni acortarlo, ni pulirlo. El usuario lo trajo porque ya le funciona.
- **No preguntas el ángulo, ni el mercado, ni el dolor, ni la oferta.** Todo eso ya está resuelto dentro del guion: dedúcelo leyéndolo.
- **No fuerces el guion dentro de la plantilla del 2.1.** Usa los 4 tipos de toma del 2.1 solo para decidir el look y la plantilla de prompt de cada toma (3.2). **Respeta el guion**: la plantilla es la forma de escribir un guion propio, no un molde al que haya que doblar uno ajeno. Un guion con otro orden (el dolor primero, una pregunta de apertura, una lista) se respeta tal cual.

### Lo que SÍ haces, en este orden

1. Di **en una sola frase** qué ángulo y qué mercado leíste en el guion, para que el usuario te corrija si te equivocaste. No es una pausa: sigues de largo.
2. **Pregunta solo lo que el guion no resuelve y que de verdad te falte**: la foto del envase si el producto se ve y no la adjuntó, y el formato si no es el 9:16 por defecto. Si ya lo tienes, no preguntes nada.
3. Haz el desglose línea por línea del Paso 2.5 **sobre el texto que te dieron**, con su look por toma y las metáforas del 2.6 donde la línea nombre algo que se cuenta mejor con una pieza.
4. De ahí en adelante, todo exactamente igual: ADN visual (3.1), prompts por capítulo (3.2) con el negativo de cada look, Start/End Frame (3.3), B-roll (3.4) y manifiesto (Paso 6).

---

## Paso 1 — Brief del producto

Si el usuario no lo dio todo, pregunta solo lo esencial en una sola tanda, siempre como texto abierto (no uses botones ni formularios, mantén la misma forma de preguntar para todos los campos) — no bloquees si ya es inferible del mensaje o de una imagen/link que compartió:
- Producto: nombre + qué es, y la **foto del envase** si el producto se va a ver (se prepara con `npm run preparar`, ver 6.6)
- Dolor/beneficio principal — idealmente algo con un mecanismo de acción visualizable
- Ingredientes o componentes reales y, si los hay, la dosis — la plantilla los nombra en el tiempo 3; si están en la foto, en la etiqueta o en el link, léelos de ahí y no preguntes
- Mercado/idioma: EE.UU. (inglés), LatAm (español — ¿qué país? ¿hay pago contra entrega?), Brasil (portugués), o varios
- Precio/oferta (descuento, envío gratis, garantía) — y si el usuario pide explícitamente que NO aparezca precio/descuento en el copy, respeta eso
- Formato/aspect ratio: vertical 9:16 por defecto, o el que indique

**No preguntes qué look lleva cada toma, ni el color de las minifiguras, ni qué metáfora usar, ni los plazos de la línea de tiempo.** Lo decide la skill: el look por lo que muestra la toma (3.1), las minifiguras amarillas clásicas por defecto, la metáfora por lo que dice la línea (2.6), y los plazos por cómo actúa el producto (se declaran en el punto 1 de la entrega y en la línea de decisión del resumen del Paso final, para que el usuario los corrija si no son los suyos).

## Paso 2 — Escribir el guion

### 2.1 — La plantilla del estilo (la estructura por defecto)

**Si el usuario no trae su guion (Paso 0) ni pide otra estructura u otro enfoque, el guion se escribe siempre con esta plantilla, sea cual sea el producto.** Nunca le preguntes qué estructura prefiere. Es una estructura, no un texto: cada tiempo dice qué tiene que lograr, cuántas palabras lleva más o menos y qué look usa. **Las palabras se escriben desde cero para cada producto** —ninguna frase sale de otro anuncio— y las cifras salen del producto y del usuario (la dosis, el descuento, la garantía) o de cómo actúa el producto (los plazos); nunca se inventan.

El orden no cambia: **el resultado → cómo funciona → la prueba → el dolor de antes y su verdadera causa → el producto → el cierre.** El que mira ve primero lo que va a conseguir, y la marca no aparece hasta las dos terceras partes del anuncio.

**A — Abre con el resultado** (≈ 9 % del anuncio)
1. **El gancho es el resultado** (≈ 10 palabras · Lego, con la metáfora resuelta o un Start/End del problema al resultado). Una afirmación, no una pregunta: lo que pasa cuando el problema se resuelve. Dice que hay una forma correcta de resolverlo, sin decir cuál, y con eso planta que hay una equivocada: la pagan los tiempos 13 y 14.
2. **Primera marca de tiempo** (≈ 8 · Lego, la metáfora a medio camino). Un plazo corto y la primera señal de que algo cambió.

**B — Cómo funciona** (≈ 19 %)
3. **El ingrediente o el componente, y lo que hace** (≈ 25-30, en 2 a 4 tomas). Se nombra el ingrediente, nunca la marca, con su origen o su dosis si se conocen. Looks en este orden: el ingrediente real sobre piezas → su origen en Lego (el campo, el taller o la fábrica de piezas, con minifiguras trabajando) → lo que hace por dentro en animación médica 3D (o en Lego por dentro, si el producto no actúa en el cuerpo).
4. **Lo que eso destraba** (≈ 11 · Start/End). Lo que llevaba tiempo atascado por fin sale o llega.
5. **La primera señal visible** (≈ 5 · Lego). Algo que el que mira puede comprobar en su rutina: al despertar, al vestirse, al abrir la app.

**C — La prueba** (≈ 25 %, en líneas cortas de 1 a 3 s)
6. **La señal de prueba** (≈ 4 · Lego, la minifigura orgullosa frente al espejo). Una frase corta que le presenta al que mira lo que ve como la prueba.
7. **Segunda marca de tiempo y la ráfaga** (≈ 14-17, en pedazos de 2 o 3 palabras · Lego, con el calendario de piezas y su número dictado, 3.1). El plazo, el cambio, tres cosas que vuelven y un "adiós" a la molestia que el bloque D va a desarrollar.
8. **Alguien cercano lo ve** (≈ 7 · Lego, dos minifiguras). La persona cercana se da cuenta, y la línea dice cuánto tiempo duró el problema.
9. **Tercera marca de tiempo: el resultado completo** (≈ 8-9 · el calendario sin personajes, después Lego). El plazo más largo y los tres beneficios, con los mismos nombres que repite el cierre.
10. **La mirada de esa persona cambia** (≈ 11 · Lego, luz cálida). Lo que esa persona pensaba al verte durante el problema queda atrás; la línea lo dice con el contraste entre el antes y el ahora.

**D — El dolor y su causa** (≈ 17 %)
11. **El recuerdo** (≈ 14-20 · Lego, luz fría de noche, la metáfora en el estado del problema). Dos o tres escenas cortas sin verbo, cada una el reverso de un resultado ya mostrado en el 5, el 7 o el 9, y el miedo de que sea para siempre dicho como pregunta: es la única pregunta del anuncio.
12. **"No era X, era Y"** (≈ 12-14 · Lego, derrotado frente al mismo espejo del 6 → médico 3D). No era lo que el que mira cree o de lo que se culpa; era la causa escondida, con su nombre, y lo que le está haciendo.
13. **Lo que lo empeoraba** (≈ 6 · Lego, con el objeto real de esa alternativa en la mano). Lo que ya usa no solo no funcionó: lo empeoraba.

**E — El producto** (≈ 20 %)
14. **El producto y por qué es distinto** (≈ 25, en 2 tomas · Lego con el envase, real sobre piezas, el envase de la competencia que se cae). Primera vez que se nombra la marca: qué tiene de real, en qué forma o dosis, dónde actúa, y no la forma floja de otras marcas.
15. **El mecanismo otra vez, como trabajo del producto** (≈ 15 · médico 3D o Lego por dentro → Lego). Qué hace, y termina con "sin" y la carga que pide la alternativa.

**F — El cierre** (≈ 10 %)
16. **El resumen** (≈ 6 · Lego). Recupera los tres beneficios del 9.
17. **El CTA** (≈ 5 · la minifigura con el envase real).
18. **La oferta** (≈ 8 · packshot, billetes o el calendario de la garantía). El descuento y la garantía. Si el usuario no quiere precio ni descuento, este tiempo dice solo la garantía, o se quita.

Con la plantilla completa el guion ronda las 200 palabras y unas 29 tomas. **Los nombres y las descripciones de los tiempos dicen su función: no son copy** y ninguna de sus palabras se usa como frase del guion.

**Lo que hace que funcione:**
- **Tres marcas de tiempo, cada una más larga** (unos días, después un día puntual, después semanas; o usos, o meses: la unidad es la del producto), todas antes de la mitad del anuncio.
- **Cada dolor del recuerdo (11) es el reverso de un resultado ya mostrado**, y el "adiós" del 7 lo anuncia.
- **Una sola persona cercana, en dos tiempos (8 y 10)**, a los lados de la tercera marca de tiempo.
- **Segunda persona** (tu cuerpo, tu pareja, tu negocio): la minifigura es el que mira.
- **Todo el arco es de recuperar**: verbos de volver y de recuperar. Si el producto da algo nuevo en vez de devolver algo perdido, los mismos tiempos se dicen con "llega", "empieza", "por fin".
- **El mismo espejo dos veces**: orgulloso en el 6, derrotado en el 12.

**Si el producto no es para el cuerpo** (una app, un software, un servicio, algo para la casa), los 18 tiempos se mantienen:
- las marcas de tiempo cuentan lo que el producto cuenta: el primer uso, la primera semana, el primer mes;
- el ingrediente es la pieza o la función que hace el trabajo, y lo que hace por dentro va en Lego (la máquina de piezas por dentro);
- la persona cercana es la que ve el cambio en ese mundo: el jefe, un cliente, el socio, los hijos;
- "no era X, era Y" separa la excusa de siempre de la causa real;
- lo que lo empeoraba es la otra app, la otra marca o el arreglo casero, y el "sin" del 15 es lo que esa alternativa exige.

**Los 4 tipos de toma** (los capítulos que nombra el resto de la skill). Cada tiempo usa uno, y el tipo decide el look y la plantilla de prompt (3.2):
1. **Personaje/situación** (look Lego): alguien viviendo una situación cotidiana relacionada al problema o al resultado, como minifigura en su mundo de ladrillos. Si lo que hay que contar no se ve o no se muestra literal, aquí entra la metáfora con pieza (2.6).
2. **Producto** (look real sobre piezas, o Lego si lo sostiene la minifigura): el envase real dentro del mundo Lego — en la mano de la minifigura, sobre un mueble de ladrillos, con los ingredientes reales cayendo o flotando alrededor sobre una placa con studs. El origen del ingrediente también puede contarse en Lego (el campo, la fábrica o el taller hechos de piezas, con minifiguras trabajando y el ingrediente real en las bandejas).
3. **Mecanismo interno** (look animación médica 3D): lo que pasa dentro del cuerpo, contado como animación médica semirrealista — el interior de un vaso o de un tejido con las partículas del ingrediente viajando y actuando, o la lámina anatómica translúcida de la parte del cuerpo con lo que se mueve por dentro. Concreto y visual: lo que estaba trabado se destraba, lo que estaba opaco se enciende. **Si el producto no actúa en el cuerpo** (una app, un software, un servicio, algo para la casa), el mecanismo se cuenta dentro del objeto o del sistema en el look Lego: la máquina de ladrillos por dentro, el engranaje que vuelve a girar, la cinta de piezas que se ordena sola.
4. **Resultado/payoff** (look Lego): escena narrativa con la consecuencia social o emocional del beneficio, a veces con humor o un giro, y la metáfora en su estado resuelto.

En la plantilla cada tipo aparece varias veces y no en orden: el mecanismo, por ejemplo, sale en el 4, en el 12 y en el 15.

### 2.2 — Si el usuario pide otra estructura

Si el usuario pide otro enfoque, otra estructura u otro orden, sigue su instrucción. Para un guion así, los 4 tipos de toma van en el orden que pida el ángulo, y sin una duración pedida dura lo que necesite, con el mínimo de 30 s del 2.4. Estos ángulos funcionan:
- **Problema oculto + revelación del mecanismo**: un problema que parece superficial → "pero debajo, algo está pasando" → el mecanismo explicado con claridad (Start/End) → por qué lo obvio no alcanza, y entra el producto como la respuesta a ese mecanismo → resultado y CTA.
- Mito vs. realidad, una cifra que sorprende como gancho, una comparación numerada, o el relato de un descubrimiento (un hallazgo curioso que lleva al mecanismo).

En ese caso la línea 1 es un gancho con un loop de curiosidad que no se resuelve hasta el final.

### 2.3 — El loop de curiosidad en la plantilla

1. **Se abre en el tiempo 1**: el resultado a la vista y "la forma correcta" dicha, sin explicar cuál es.
2. **Se alimenta en B y C**: el ingrediente nombrado sin la marca, y una prueba que crece con cada marca de tiempo.
3. **Se paga en D y E**: la causa que nadie veía (12), lo que lo empeoraba (13) y el producto que lo hace bien (14 y 15). La marca se guarda hasta ahí.
4. **Se cierra en F**: el resumen repite los beneficios del 9 y la oferta da el paso.

### 2.4 — Duración y presupuesto de palabras
**Sin una duración pedida, la plantilla va completa**: unas 200 palabras, alrededor de un minuto y medio de anuncio (las muchas líneas cortas suman pausas: en el anuncio que se midió, 213 palabras dieron 102 s). **Si el usuario pide una duración, esa manda**: el presupuesto es `segundos × 2.4 palabras/segundo`, y la plantilla se acorta **sin cambiar el orden ni sacar bloques**: cada tiempo dice menos (la ráfaga del 7 con dos cosas en vez de tres, el ingrediente en una o dos tomas, el producto en una) y, si hace falta, se juntan tiempos seguidos del mismo bloque (el 9 con el 10, el 16 con el 17). El mínimo es de 30 s (unas 72 palabras).

> **Una duración pedida orienta el presupuesto de palabras; NO es un blanco al que haya que llegar.** Estos números son estimaciones: `÷ 2.4` es un promedio y cada voz habla distinto. En anuncios reales con este cálculo el anuncio terminó entre un 24 % más corto y un 15 % más largo que lo estimado (con muchas líneas cortas, las pausas entre líneas lo alargan). Que el anuncio termine durando 52 s en vez de 60, o 102 en vez de 89, está bien y no hay nada que corregir — el montaje encaja cada toma contra los tiempos reales de la voz, acelerando unas y cortando otras. **Nunca agregues ni quites líneas para llegar a un número.** El guion dura lo que necesita durar para mostrar lo que muestra.

### 2.5 — Desglose línea por línea
Baja el guion a nivel de toma por línea — cada línea/beat tiene su propia toma visual sincronizada, asignada a un tiempo de la plantilla (2.1), a uno de los 4 tipos de toma y a uno de los tres looks. La duración de cada toma es la duración real de decir esa línea (≈ palabras ÷ 2.4), no un número fijo.

**Chequeo antes de cerrar la tabla — ninguna toma pasa de ~9-10 segundos.** El modelo de video no genera clips de más de 10 s, así que una línea que calcule por encima de eso no se puede producir: hay que **dividirla en dos tomas** y renumerar, nunca truncarla. Una línea así casi siempre es dos ideas metidas en una — en la plantilla, el caso típico es el tiempo 3 (el ingrediente y lo que hace) y el 14 (el producto y por qué es distinto): van en varias tomas, no en una.

Arma el guion en esta tabla:

| # | Tiempo | Capítulo | Look | Duración (calculada) | Línea de voz en off | Idea de texto en pantalla (solo para el editor — NUNCA va dentro de los prompts) | Descripción visual |
|---|---|---|---|---|---|---|---|

`Tiempo` es el número de la plantilla (1 a 18); si el guion vino de afuera (Paso 0) o el usuario pidió otra estructura, va `—`. `Capítulo` es el tipo de toma (2.1). `Look` es `Lego`, `Médico 3D` o `Real sobre piezas`. Si la toma usa una metáfora con pieza, la descripción visual la nombra.

Antes de pasar a los prompts, verifica: ¿la línea 1 abre con el resultado y dice que hay una forma correcta, sin explicar cuál? ¿La marca aparece recién en el tiempo 14? ¿Cada dolor del 11 es el reverso de un resultado ya mostrado? Si no, corrígelo antes de seguir. (Con otra estructura pedida por el usuario, verifica que la línea 1 sea el gancho con el loop de curiosidad. Si el guion vino de afuera —Paso 0— no se corrige: se declara dónde está el loop y se sigue.)

**Postura al generar cada prompt**: actúa como un director de arte senior — expande visualmente cada línea para que se vea más rica e imaginativa de lo que el texto dice palabra por palabra, sin perder la idea central.

### 2.6 — Lo que no se puede mostrar, se muestra con una pieza

En Lego todo son piezas: las partes del cuerpo se encajan, se sueltan y se cambian por otras, y cualquier cosa del mundo se arma y se desarma. Eso le da a este estilo una forma propia de contar lo que en imagen literal sería explícito, feo, aburrido o imposible de ver: **lo que hay que contar —una parte del cuerpo, una función, o algo que no tiene cuerpo: el tiempo, la plata, el orden, el estrés, un sistema que falla— se vuelve una pieza o un objeto hecho de piezas, y su estado es el estado de la pieza.** El que mira lo entiende al instante, y la voz en off termina de decirlo.

**Cuándo**: cuando la línea nombra algo que no se ve a simple vista o que en imagen literal sería explícito, feo o aburrido: un síntoma o una función del cuerpo (hinchazón, retención, caída del pelo, kilos, cansancio, dolor, sueño, digestión, rendimiento sexual, piel, ánimo), o el problema o el resultado de un producto que no toca el cuerpo (horas perdidas, plata que se escapa, desorden, estrés, un sistema lento o caído, clientes que no llegan). La metáfora vive en el look Lego (capítulos 1 y 4, y el B-roll de esas tomas). Cuando el producto actúa en el cuerpo, el mismo anuncio puede **además** mostrar el mecanismo literal en animación médica 3D (capítulo 3): las dos cosas conviven, una cuenta cómo se siente y la otra qué pasa por dentro.

**Cómo se arma:**
1. **La pieza y su estado.** Rígida o caída, llena o vacía, encajada o suelta, ancha o delgada, opaca o brillante, rota o armada, oxidada o nueva.
2. **El cambio va con Start/End Frame** (3.3): el START muestra la pieza en el estado del problema y el END en el del resultado. El clic de una pieza que encaja o se cambia por otra es el gesto más Lego que hay. Si el guion pone el problema y la solución en líneas separadas, la toma de la solución es la del Start/End (el START con la pieza todavía en el problema, el END resuelta); va con imagen + video normal solo si la línea muestra el resultado ya resuelto y la pieza no aparece cambiando.
3. **Los objetos del mundo también cuentan**: un calendario hecho de piezas para el paso del tiempo (con el número dictado, ver 3.1), una torre de ladrillos que se arma sola para el progreso, piezas desparramadas en el piso para algo que se desarmó, el producto de la competencia (un frasco, una caja, la pantalla de otra app en un teléfono de piezas) que se cae y se rompe —en un primer plano sin minifigura va en real sobre piezas; en el set junto a la minifigura, en Lego con la cola del producto—, billetes reales de la moneda del mercado en la mano para el ahorro (Paso 4).

**Ejemplos** (orientan, no limitan — cada producto pide la suya; las marcadas como probadas se usan tal cual: forma, color y anclaje):

| Lo que hay que contar | La pieza |
|---|---|
| Piernas pesadas, retención de líquido | la pieza de piernas cambiada por una pieza transparente, el doble de ancha, llena de agua turbia; se drena y vuelve a ser la normal (probado) |
| Caída del cabello | la pieza de pelo que se afloja y cae; después una pieza de pelo nueva que encaja firme |
| Kilos de más | un torso ancho y redondo que se cambia, con un clic, por un torso normal |
| Cansancio, falta de energía | una barra de energía hecha de ladrillos en su espalda que se vacía; después se llena y brilla |
| Hinchazón abdominal | un torso inflado como un globo de plástico que se desinfla |
| Dolor de articulaciones | una bisagra oxidada en el hombro que chirría y no gira; después gira suave |
| Erección y su falta | una varilla rígida del mismo amarillo que sus manos (también cuando lleva pijama, bata o pantalón), encajada en un conector redondo fijo en el centro de la pieza de cadera, que apunta hacia arriba (probado); la falta de ella, una pieza curva y blanda en forma de plátano encajada en el mismo conector, que cuelga entre las piernas (se probó sin decir el conector y salió sostenida en la mano: dile dónde va); el clímax, un chorro de líquido blanco que sale de la punta, **solo en el Motion del video**, con la varilla ya arriba en la imagen (sin probar) |
| Tiempo perdido (una app, un software, un servicio) | un reloj de ladrillos en la pared cuyas piezas se sueltan y caen al piso; después el reloj armado y firme |
| Plata que se escapa (finanzas, seguros, ahorro) | una alcancía de ladrillos con un hueco por donde caen monedas reales; después una pieza encaja en el hueco con un clic |
| Desorden, caos de trabajo (gestión, limpieza, organización) | ladrillos sueltos de todos los colores amontonados sobre el escritorio; después los mismos ladrillos encajados en una torre ordenada |

**La regla de oro del prompt: se describe el objeto, nunca lo que significa.** "A long rigid yellow plastic rod piece plugged into a round socket fixed at the center of his hip piece, pointing straight up" — nunca "penis" ni "erection". "An oversized bulky leg piece in pale cloudy translucent plastic filled with murky water" — nunca "swollen legs from lymphatic congestion". El significado lo ponen la voz en off y la cabeza del que mira; el generador solo ve una pieza de juguete. Por eso además no rechaza el prompt.

**Y se describe dónde va encajada la pieza, hacia dónde apunta o cómo cuelga, y dónde están las manos de la minifigura.** Medido el 2026-10-05: la primera prueba pedía "a long rigid yellow plastic rod piece rising upright from his lap" y que la agarrara con la mano, y salió como un palo sostenido en diagonal; la segunda, con la minifigura sentada de frente, dijo "plugged into a round socket piece fixed at the center of his hip piece between his legs and points straight up from there toward his chin", "the robe covers the base of the socket" y "His hands rest on his knees", y salió como tenía que salir. **Si la pieza se encaja en el personaje y sale en varias tomas**, el punto de anclaje (un stud, un conector discreto) se describe también en su hoja, sin la pieza.

**Lo que sale de una pieza** (un chorro, gotas, agua) **va en el Motion del video**, no dibujado en la imagen; si en un END tiene que quedar algo, queda separado de la pieza y apoyado en el set (3.3).

**La intensidad la pide el anuncio.** Si el producto trata algo íntimo, la metáfora lo dice con claridad. No se suaviza ni se pregunta.

## Paso 3 — ADN visual y prompts

### 3.1 — ADN visual

**Look Lego** (capítulos 1 y 4, las metáforas, y el producto cuando lo sostiene una minifigura):
- **Minifiguras LEGO clásicas**: cabeza cilíndrica con un stud arriba, cara impresa, torso con la ropa impresa, manos en C, piernas de una sola pieza sobre una sola articulación de cadera, sin codos ni rodillas. **Amarillas clásicas por defecto**; otro tono (nougat, marrón, beige) cuando la historia lo pida o para distinguir a un personaje.
- **Sets de ladrillos**: paredes, pisos, muebles y exteriores hechos de ladrillos, placas y tiles con **studs visibles**. Dentro del set caben cosas reales a escala de la minifigura —telas (sábanas, mantas, cortinas), líquidos, comida, papel, billetes, frascos, plantas— y le dan verdad a la escena.
- **Render**: juguete casi fotográfico, el look de The LEGO Movie: plástico ABS inyectado y brillante con costuras de molde y microrayas, macro a la altura de la minifigura, profundidad de campo moderada para que los ladrillos del fondo se sigan leyendo, iluminación cinematográfica según el ánimo de la escena (cálida de día, azul de noche con una lámpara cálida).
- **"LEGO" va escrito en el prompt.** Es la palabra ancla del estilo: sin ella el modelo hace un juguete genérico.

**Look animación médica 3D** (capítulo 3 y el B-roll de mecanismo): render médico semirrealista, tejido húmedo y brillante con capilares finos, membranas translúcidas, células y partículas que brillan, luz volumétrica suave, profundidad de campo de macro, fondo oscuro del interior del cuerpo (granate, azul marino). Sin caritas en las partículas, sin flechas ni rótulos.

**Look real sobre piezas** (capítulo 2, el ingrediente, la cápsula, el packshot): el producto real, fotorrealista, con su vidrio, su plástico y su etiqueta, y los ingredientes reales (hojas, granos, polvo, gotas, cápsulas), apoyados sobre placas y muebles Lego con studs. **El producto nunca se convierte en ladrillos**: es el envase real dentro del mundo Lego, a escala grande: más o menos del alto del torso de la minifigura, sujeto al costado con la mano en C, como en la referencia del estilo (en la prueba se pidió del alto de la cabeza y el torso juntos y salió tan grande que tapó la mano).

**Texto en pantalla**: palabra por palabra o frases muy cortas reveladas progresivamente en sincronía con la voz (no bloque fijo), tipografía blanca gruesa con contorno oscuro — siempre en edición, nunca dentro de los prompts. **Dos excepciones**, y las dos se dictan literal entre comillas: el texto de la etiqueta del producto (en su hoja), y un número o una palabra corta que sea parte de un objeto del mundo (las tarjetas de un calendario de piezas: "DÍA 10"), **en el idioma del anuncio** — si no se dicta, el modelo lo escribe en inglés.

**Lo que no se quiere de otro look va solo en el `Negative prompt:`, nunca nombrado en el prompt positivo** ("not cartoon", "rather than a diagram", "not clay"): el modelo pesa el término más que la negación. Cada look tiene su negativo (3.2). Dos cosas sí van en el positivo porque describen la pieza, no otro estilo, y están probadas: la anatomía de la minifigura ("no elbows or knees") y que el envase es el real ("The product is real and photoreal, not built from bricks").

**Las hojas de referencia** del personaje (look Lego) y del producto (real sobre piezas) van de pie sobre una placa base de studs, delante de una pared lisa de tiles Lego cálidos —nunca blanca ni de estudio—, sin más ambiente ni props, porque la hoja se propaga a todas las tomas y un ambiente ahí se arrastra.

**Ambiente real, en todos los capítulos (verifica esto toma por toma antes de entregar, en silencio, sin preguntarle al usuario)**: en el capítulo 1 (personaje/situación) y el capítulo 4 (resultado/payoff), el fondo siempre es un set Lego concreto y reconocible (dormitorio, cocina, oficina, parque, gimnasio, lo que corresponda), salvo el packshot del CTA (3.2). En el capítulo 2 (producto), una superficie del mundo Lego del anuncio (el mueble de la cocina, la mesita de noche), no un ciclorama. En el capítulo 3 (mecanismo), el interior del cuerpo, con su fondo oscuro de tejido; si el producto no actúa en el cuerpo, el set Lego del objeto o del sistema por dentro (2.1).

**Personaje recurrente — Character Bible (solo si hay).** Si el mismo personaje se repite en varios capítulos, defínelo **una vez** como hoja de referencia: va como entrada de `referencias` en el manifiesto (6.4) y cada toma donde aparece declara su `id`. Sin esto cambia de pelo, de cara impresa y de ropa entre tomas (en la referencia del estilo, sin hoja, la esposa salió con un peinado distinto en cada toma). La hoja, en inglés, 6-10 oraciones, sin marco:

```
Vertical 9:16. LEGO minifigure character reference, photoreal toy photography: [nombre], a classic [yellow] LEGO minifigure representing a [edad]-year-old [woman/man] from [país]: molded [pieza de pelo: largo, forma, color, raya], printed face with [3-4 rasgos impresos fijos: cejas, ojos, gafas, labios, arrugas, barba, pecas], printed [ropa del torso: prenda, color, detalle] on the torso, [color y estampado] leg piece, C-shaped claw hands, cylindrical head with a stud on top. Standing in a relaxed neutral pose, three-quarter view, full figure visible from the hair piece to the feet, standing on a tan LEGO baseplate with visible round studs, plain warm beige wall of smooth LEGO tiles behind [her/him]. Glossy injection-molded ABS plastic with subtle mold seams, macro lens, soft warm lighting. The image is full-bleed and fills the entire frame edge to edge: no picture frame, no wooden frame, no diorama box, no border, no inset panel, no vignette. No text, captions or watermarks.

Negative prompt: human skin, skin pores, realistic human body, human fingers, bent elbows, bent knees, clay, plasticine, vinyl toy, soft rubber, melted plastic, 2D cartoon, anime, 3D cartoon human character, LEGO logo, brand logos on bricks
```

La ropa de la hoja se repite en todo el anuncio salvo que el guion la cambie (pijama de noche, bata, ropa de calle); cuando cambia, la toma lo dice y la cara y el pelo siguen saliendo de la hoja.

> **La hoja de referencia NUNCA lleva marco.** Medido en anuncios reales: una hoja salió dentro de una caja de diorama con marco de madera, y ese marco **se arrastró a seis tomas**, apareciendo y desapareciendo entre cortes porque los primeros planos no lo heredaron. "Sin muebles ni props" no cubre un marco; hay que decirlo explícito y va **pegado dentro del prompt de la hoja**, no recordado. **Y el fondo NO se pide blanco vacío: es peor.** Está documentado con pruebas reales que un fondo neutro sin relación al mundo hace que el modelo invente un ambiente distinto en cada toma. Aquí el fondo es la placa de studs y la pared de tiles: el mundo Lego, liso — lo que se prohíbe es el marco, no el ambiente. **La hoja es lo que más se propaga de todo el anuncio**: lo que salga en ella aparece en cada toma que la use, y arreglarlo después cuesta regenerar imagen y clip de cada una.

**El producto real en el mundo Lego (si el usuario dio foto del envase).** El envase se convierte en una hoja fotorrealista fiel a la etiqueta, apoyada en el mundo Lego, que el motor genera **desde la foto del usuario** (entrada `producto` del manifiesto con `generar_desde_archivo: true`, ver 6.4) y después adjunta a todas las tomas que declaren `producto`. **Antes de escribir el prompt, lee la etiqueta en la foto y dicta su texto literal, línea por línea y entre comillas, dentro del prompt.** Medido el 2026-09-14 con Goli: con la foto adjunta y el prompt genérico ("same label design, colors and text") el modelo reescribió la etiqueta ("B-Vitamins", "30" en vez de "Elderberry Extract", "60") y cambió el color de las gomitas; con el texto dictado la copió exacta al primer intento. Adjuntar la foto fija la forma, los colores y el logo grande; el texto chico solo sale bien si está escrito en el prompt. Esa hoja se adjunta después a todas las tomas con envase, así que un error aquí se repite en cada una.

```
Vertical 9:16. Photoreal 3D render of the exact product in the reference photo, shown as a real product inside a LEGO world: [forma y material del envase, color de la tapa, color del contenido si se ve, color y disposición de la etiqueta]. Same shape, same proportions, same label design, colors and text as the photo. The label text must be copied exactly, letter for letter, from the photo, with no words changed, added or removed: [el texto de la etiqueta, de arriba abajo, cada línea entre comillas]. The product is real and photoreal, not built from bricks, resting naturally on a tan LEGO baseplate with visible round studs in front of a plain warm beige wall of smooth LEGO tiles, soft contact shadow, soft warm cinematic lighting, shallow depth of field. The label text must be as sharp and legible as in the photo. The image is full-bleed and fills the entire frame edge to edge: no frame, no border, no vignette. No additional text, captions or watermarks.

Negative prompt: product made of LEGO bricks, brick-built bottle, cartoon, illustration, 2D, altered label text, misspelled words, invented ingredients
```

"No additional text" nunca significa borrar el texto de la etiqueta: es parte del producto y se dicta literal; lo que se prohíbe son textos ajenos (subtítulos, marcas de agua, leyendas). Si el usuario no dio foto, la entrada `producto` no existe y ninguna toma la declara: el envase se describe en el prompt de cada toma **con las mismas palabras siempre** (forma, material, colores de tapa y etiqueta), cambiando "the exact product from the reference image" por esa descripción, y de la etiqueta se dicta entre comillas solo lo que el usuario dio (el nombre, la cifra principal); no se inventa marca, cifras ni letra chica.

> **Medido el 2026-10-05** en una prueba real (gotero de Nature's Sunshine): la hoja salió con el frasco real sobre la placa de studs y la etiqueta exacta. En las tomas, el logo y el nombre del producto se leen, pero la letra chica no se sostiene ni de cerca: en el B-roll macro salió "Burtial Experts" por "HERBAL EXPERTS". La letra chica alterada fuera de la hoja no es un defecto a regenerar; el nombre o el logo cambiados, sí. Y la hoja de esa prueba tenía una cocina de fondo que se coló en el B-roll en lugar de la cocina de su toma: por eso la plantilla de arriba va con la pared lisa de tiles.

### 3.2 — Prompts por tipo de capítulo

**Regla de formato obligatoria**: cada bloque de prompt debe llevar su etiqueta como encabezado **fuera del bloque de código** — `**Imagen:**` antes del prompt de imagen, `**Video:**` antes del prompt de video — nunca entregues los bloques uno después de otro sin identificar cuál es cuál. Aplica igual en tomas principales y B-roll.

**Fidelidad del producto real (si el usuario adjuntó una foto del envase)**: el producto debe conservar exactamente su forma, proporciones y diseño de etiqueta reales — nunca alargarlo, ensancharlo, deformarlo ni convertirlo en piezas. Cada toma con envase nombra la hoja del producto ("the exact product from the reference image") y declara `producto` en sus `referencias`. **Aclaración importante sobre "no text" (error confirmado que ya pasó antes)**: la instrucción "no additional text/captions/watermarks" se refiere a que la IA NO agregue texto, subtítulos o marcas de agua extra a la imagen — nunca a borrar el texto real que ya es parte del diseño de la etiqueta del producto. Si notas que una imagen generada borró o distorsionó el texto real de la etiqueta, es un error de la herramienta de generación, no algo que el prompt esté pidiendo.

**El producto en la mano de una minifigura: describe el agarre.** Medido el 2026-10-05: "holding it up next to her face" dejó el frasco **flotando** junto a la mano durante todo el clip. Una mano en C no abarca un envase grande: di dónde está la mano ("her C-shaped hand clamped around the middle of the bottle"; con el envase del alto del torso, sin probar todavía) o, si el envase es grande para ella, que lo **abraza contra el torso** o que lo apoya en el mueble de ladrillos a su lado.

**El aspect ratio va en palabras al principio, nunca como parámetro.** Nada de `--ar 9:16`, `--v 6`, `--style`: el motor manda el prompt tal cual al generador, y un flag de Midjourney pegado en el texto llega literal a un modelo que no lo entiende y lo trata como parte de la descripción. `Vertical 9:16` en palabras sí lo entienden todos.

> **La etiqueta `Negative prompt:` NO es un flag y se queda.** Un flag como `--ar` no es lenguaje: llega al modelo y no significa nada. `Negative prompt:` sí es lenguaje, y es la convención que le dice al modelo dónde empieza la lista de lo que NO debe aparecer. Ninguno de estos modelos tiene un campo aparte para el negativo —`nano-banana-2` recibe un solo texto—, así que **el prompt entero se pega junto, etiqueta incluida**, y esa etiqueta es lo único que separa lo que se quiere de lo que no. Quitarla haría que `text, labels, hands` se leyeran como cosas a incluir. Decidido el 2026-09-06, después de que se hubiera cambiado por error a `Avoid:` — no volver a tocarla.

### Negativo por look — va al final de cada prompt de imagen (en un par Start/End, una sola vez, al final del END)

**Cada imagen lleva el negativo de su look, pegado tal cual con su etiqueta: tomas principales, B-roll y hojas. En un par Start/End va una sola vez, al final del END FRAME, y el START va sin él (3.3): así se probó.** No hay un negativo universal porque los tres looks quieren cosas opuestas: lo que el Lego necesita (plástico de juguete) es justo lo que la animación médica no quiere, y al revés.

**Look Lego** (hojas de personaje, capítulos 1 y 4, metáforas):
```
Negative prompt: human skin, skin pores, realistic human body, human fingers, bent elbows, bent knees, clay, plasticine, vinyl toy, soft rubber, melted plastic, 2D cartoon, anime, 3D cartoon human character, LEGO logo, brand logos on bricks
```

**Look animación médica 3D** (capítulo 3 y B-roll de mecanismo):
```
Negative prompt: LEGO, plastic bricks, studs, minifigure, toy, plastic toy look, cartoon faces, blue grid, technical grid background, clean studio backdrop, plain white background, infographic, diagram labels, arrows, text
```

**Look real sobre piezas** (hoja del producto, capítulo 2 sin minifigura, ingrediente, packshot y cualquier primer plano de algo real):
```
Negative prompt: product made of LEGO bricks, brick-built bottle, cartoon, illustration, 2D, altered label text, misspelled words, invented ingredients
```

**Cola del producto en una toma Lego.** Cuando una minifigura sostiene o tiene al lado el envase (look Lego con producto), al negativo Lego se le pega al final de la misma línea:
```
, product made of LEGO bricks, brick-built bottle, altered label text, misspelled words
```

> **De dónde salen.** Del análisis toma por toma del anuncio de referencia del estilo (49 tomas: 32 Lego, 12 de animación médica sin una sola pieza Lego, 4 de ingredientes y cápsulas reales sobre superficies Lego —una termina en células sin Lego— y un packshot, que la referencia hizo fuera del mundo Lego) y de la prueba real del 2026-10-05: con estos tres negativos (en el END de cada par Start/End; los START fueron sin negativo) las minifiguras salieron minifiguras en todas las tomas, la animación médica no tuvo ni un stud, y el producto salió real, con el logo y el nombre bien. El término "3D cartoon human character" del negativo Lego se puso después de la prueba. **Fíjate que el Lego no lleva "photorealistic" en el negativo**: aquí el juguete casi fotográfico es el look. Lo que se le niega es lo humano (piel, dedos, codos, rodillas) y los otros materiales de juguete (plastilina, vinilo).

**Capítulo 1 — Personaje/situación (look Lego)**:
```
Vertical 9:16. LEGO minifigure style 3D render, The LEGO Movie look, photoreal toy photography. [personaje — si hay hoja, "[nombre] from the reference image" — y la situación cotidiana relacionada al problema, con su cara impresa y, si la hay, la metáfora con pieza descrita como objeto: dónde está encajada y cómo está]. All characters are classic LEGO minifigures: cylindrical head with a stud on top, printed face, printed clothing on the torso, C-shaped claw hands, rigid one-piece legs on a single hip joint, no elbows or knees. Brick-built set at minifigure scale: [el lugar concreto hecho de ladrillos con studs visibles, y lo real que hay en él: a real knitted blanket, a real glass of water]. Glossy injection-molded ABS plastic with subtle mold seams and faint micro-scratches, realistic plastic reflections, macro lens at minifigure eye level, moderate depth of field with the bricks in the background still readable, [luz de la escena: warm evening lamp light with cool blue window light behind], 8k, ultra-detailed, no additional text, captions, or watermarks overlaid on the image

Negative prompt: human skin, skin pores, realistic human body, human fingers, bent elbows, bent knees, clay, plasticine, vinyl toy, soft rubber, melted plastic, 2D cartoon, anime, 3D cartoon human character, LEGO logo, brand logos on bricks
```

**Capítulo 2 — Producto.** Dos formas, según la línea:

En la mano de la minifigura (look Lego, con la cola del producto):
```
Vertical 9:16. LEGO minifigure style 3D render, The LEGO Movie look, photoreal toy photography. [personaje — "[nombre] from the reference image" —] [con el agarre descrito: her C-shaped hand clamped around the middle of the exact product from the reference image / hugging the exact product from the reference image against her torso with both arms], [label facing the camera]. The product is the real photoreal [bottle / box / jar], not made of bricks, oversized at minifigure scale, about as tall as [her] torso. [lo que hay alrededor: real fresh herbs and a real glass of water on the brick-built counter]. All characters are classic LEGO minifigures: cylindrical head with a stud on top, printed face, printed clothing on the torso, C-shaped claw hands, rigid one-piece legs on a single hip joint, no elbows or knees. Brick-built set at minifigure scale: [el lugar concreto]. Glossy injection-molded ABS plastic with subtle mold seams and faint micro-scratches, realistic plastic reflections, macro lens at minifigure eye level, moderate depth of field with the bricks in the background still readable, [luz], 8k, ultra-detailed, no additional text, captions, or watermarks overlaid on the image

Negative prompt: human skin, skin pores, realistic human body, human fingers, bent elbows, bent knees, clay, plasticine, vinyl toy, soft rubber, melted plastic, 2D cartoon, anime, 3D cartoon human character, LEGO logo, brand logos on bricks, product made of LEGO bricks, brick-built bottle, altered label text, misspelled words
```

Sobre el mundo Lego, con el ingrediente (look real sobre piezas):
```
Vertical 9:16. Photoreal macro shot inside a LEGO world. The exact product from the reference image stands on [una placa o un mueble Lego con studs visibles: a dark-green LEGO plate], label facing camera, with [los ingredientes reales y lo que hacen: real fresh herb leaves lying on the studs beside it, its black glass dropper held in the air above them with a single glossy amber drop falling from the tip]. [Lo real de la toma: The bottle, the dropper, the drop and the leaves] are real and photoreal; the [plate] and the blurred brick-built [kitchen] behind are glossy injection-molded LEGO plastic. [luz: warm side light], extreme shallow depth of field, 8k, ultra-detailed, no additional text, captions, or watermarks overlaid on the image

Negative prompt: product made of LEGO bricks, brick-built bottle, cartoon, illustration, 2D, altered label text, misspelled words, invented ingredients
```

**Capítulo 3 — Mecanismo interno (look animación médica 3D)**:

Dos formas de mostrarlo, y se eligen según la línea:

- **El macro dentro del tejido**: un plano muy cerrado dentro del vaso, el tejido o el órgano, con lo que pasa ahí: la linfa espesa estancada, el coágulo, la malla, las partículas del ingrediente llegando y destrabando. Es la forma más común.
- **La lámina anatómica translúcida**: la parte del cuerpo que importa (las piernas, el vientre, el órgano) como un modelo anatómico de cristal sobre fondo oscuro, y por dentro se ve el proceso. Sirve cuando la línea necesita ubicar *dónde* pasa algo. En la referencia del estilo se usa incluso para órganos íntimos, en clave clínica.

Las dos van con `referencias: []`: no muestran a ningún personaje del anuncio (la minifigura no tiene anatomía).

```
Vertical 9:16. Medical 3D animation render, semi-realistic scientific visualization. Extreme close-up inside [el vaso / el tejido / el órgano: a human lymphatic vessel running diagonally across the frame], [el estado: thick stagnant cloudy lymph fluid barely moving with tiny dull particles stuck in it / tiny glowing ingredient particles squeezing through and lighting up what they touch], glossy wet translucent [color] tissue walls with fine capillaries, soft volumetric light, cinematic macro depth of field, deep [burgundy / navy] background inside the body, 8k, ultra-detailed, no additional text, captions, labels or watermarks overlaid on the image

Negative prompt: LEGO, plastic bricks, studs, minifigure, toy, plastic toy look, cartoon faces, blue grid, technical grid background, clean studio backdrop, plain white background, infographic, diagram labels, arrows, text
```

Y la lámina anatómica, cuando la línea pide ubicar el proceso en el cuerpo:
```
Vertical 9:16. Medical 3D animation render, semi-realistic scientific visualization. [la parte del cuerpo: a pair of human legs from the hips down] shown as a translucent glass-like anatomical model on a deep [navy] background, revealing inside [el proceso: the lymphatic vessels swollen with cloudy pale fluid pooling around the ankles], [color] vessels and soft glowing fluid, soft volumetric rim light, cinematic depth of field, 8k, ultra-detailed, no additional text, captions, labels or watermarks overlaid on the image

Negative prompt: LEGO, plastic bricks, studs, minifigure, toy, plastic toy look, cartoon faces, blue grid, technical grid background, clean studio backdrop, plain white background, infographic, diagram labels, arrows, text
```

**Capítulo 4 — Resultado/payoff (look Lego)**:
```
Vertical 9:16. LEGO minifigure style 3D render, The LEGO Movie look, photoreal toy photography. [escena de resultado social/emocional relacionada al beneficio — "[nombre] from the reference image" — con la metáfora en su estado resuelto si la hay, descrita como objeto: dónde está encajada y hacia dónde apunta o cómo cuelga, y la expresión de sus caras impresas]. All characters are classic LEGO minifigures: cylindrical head with a stud on top, printed face, printed clothing on the torso, C-shaped claw hands, rigid one-piece legs on a single hip joint, no elbows or knees. Brick-built set at minifigure scale: [el lugar concreto]. Glossy injection-molded ABS plastic with subtle mold seams and faint micro-scratches, realistic plastic reflections, macro lens at minifigure eye level, moderate depth of field with the bricks in the background still readable, [luz], 8k, ultra-detailed, no additional text, captions, or watermarks overlaid on the image

Negative prompt: human skin, skin pores, realistic human body, human fingers, bent elbows, bent knees, clay, plasticine, vinyl toy, soft rubber, melted plastic, 2D cartoon, anime, 3D cartoon human character, LEGO logo, brand logos on bricks
```

**Toma Lego sin personajes** (un objeto del mundo de cerca: el calendario, la torre, el reloj, la alcancía): la plantilla Lego sin la frase "All characters are classic LEGO minifigures: …" —y sin escribir "no minifigures" en el positivo—; el plano se describe por el objeto y su set ("Close-up of the LEGO tile calendar on the brick-built nightstand of the bedroom"). Mismo negativo Lego y, en el video, la cabecera Lego con su línea de rigidez. Medido el 2026-10-05: el calendario de piezas sobre la mesita de noche salió con su texto dictado; una torre chica de ladrillos lisos sobre el mismo mueble, en cambio, salió como un muñeco de piezas con manos. Si es una torre, que sea alta, de muchos colores y sin nada arriba que parezca una cabeza.

**El CTA.** Si cierra la minifigura con el envase: la plantilla del capítulo 4 con el agarre del capítulo 2 y la cola del producto en el negativo. Si cierra el producto solo (packshot): look real sobre piezas, con la plantilla "Sobre el mundo Lego" del capítulo 2, el envase de frente y de cerca sobre un mueble o una placa del mundo del anuncio; es la única toma del capítulo 4 sin un set Lego completo detrás.

**El ángulo de cámara**: las plantillas Lego dicen "at minifigure eye level" porque es el plano más común; si la toma pide otro (picado desde arriba, desde los pies de la cama), cambia esas palabras por ese ángulo.

**Prompt de video** (image-to-video, a partir de la imagen de la toma — describe el movimiento). **La cabecera y la línea que va antes de `Lighting` dependen del look**, porque el modelo de video solo recibe el frame y este texto (las hojas de referencia no viajan al video): es la única instrucción de estilo mientras anima.

Look Lego — con la línea de rigidez, siempre:
```
LEGO minifigure animation, The LEGO Movie style, image-to-video from the shot above, [DURACIÓN]s. Vertical 9:16.
Camera: [un solo movimiento, ej. "slow push-in" / "gentle pan" / "static"]
Motion: [una sola acción propia de esa toma]
Everything made of LEGO stays rigid plastic: minifigure arms rotate only at the shoulder, hands swivel at the wrist, legs swing as one rigid piece from the hip, no bending at elbows or knees, no squash and stretch, bricks never bend, melt or morph, and facial expressions change like a new printed face. Nothing changes shape except what Motion describes.
Lighting: [la luz de la imagen]
```

Si en el clip se mueve algo real dentro del set (un líquido, gotas, vapor, comida, pastillas, papel, billetes, una tela), después de la línea de rigidez va una más, nombrando lo real de la toma: `[The white liquid and its drops] are real and stay real and photoreal the whole time; they never turn into LEGO.` El envase en la mano de la minifigura, aun levantándolo, salió real sin esta línea; lo real que se mueve puede volverse piezas, como las hojas del B-roll de abajo (la línea dentro de una toma Lego está sin probar todavía).

**Motion pide solo lo que una minifigura puede hacer**: los brazos giran hacia adelante y atrás en el hombro (no se abren hacia los lados), las manos en C giran en la muñeca y no se abren ni se cierran (para tomar algo, la mano se acerca y lo engancha), la cabeza gira sobre el cuello, las piernas se balancean desde la cadera, y no hay respiración ni torso que se infle (salvo que esa sea la metáfora).

Look animación médica 3D:
```
Medical 3D animation, image-to-video from the shot above, [DURACIÓN]s. Vertical 9:16.
Camera: [un solo movimiento]
Motion: [una sola acción]
Lighting: soft volumetric glow
```

Look real sobre piezas — con la línea de lo real:
```
Photoreal macro animation inside a LEGO world, image-to-video from the shot above, [DURACIÓN]s. Vertical 9:16.
Camera: [un solo movimiento]
Motion: [una sola acción]
[Lo real de la toma: The bottle, the dropper, the drop and the herb leaves] are real and stay real and photoreal the whole time; only the LEGO pieces are plastic, and they stay rigid.
Lighting: [la luz de la imagen]
```

> **Por qué tres cabeceras, medido el 2026-10-05.** Con la cabecera y la línea de rigidez del Lego, en las tomas de minifigura el plástico no se dobló en ningún clip: brazos que giran en el hombro, piernas de una pieza al caminar, la cara que cambia como una impresión nueva. Pero en el B-roll de las gotas sobre la placa, esa misma cabecera **convirtió las hojas reales en plantas de Lego a mitad del clip**. En la segunda vuelta, con la cabecera de lo real (y otro encuadre), las hojas siguieron siendo hojas. La última frase de la línea de rigidez ("Nothing changes shape except what Motion describes") se agregó en la segunda vuelta y se deja por prudencia: en la primera, sin ella, la pieza de la metáfora ya cambió bien. La animación es **fluida**, no stop-motion: así se movió la referencia del estilo y así anima el modelo de video.

**`[DURACIÓN]` es el largo del clip que se pide**: el primer tramo de 4, 6, 8 o 10 s que cubre la duración de la toma (1.7 → 4, 4.6 → 6, 8.3 → 10), como en la prueba real; el clip se ajusta a la voz en el montaje. El motor no corrige ese número dentro del prompt.

### 3.3 — Start/End Frame: cuándo usarlo y cómo decidirlo (la IA decide sola, nunca presenta opciones al usuario)

**Criterio de uso**: usa el par Start Frame/End Frame en las tomas del **Capítulo 3 (mecanismo interno)**, en tomas de **transformación del producto** (ej. el frasco cerrado → el frasco abierto con la gota cayendo) y en las **transformaciones de una metáfora con pieza** (2.6: la pieza en el estado del problema → en el del resultado) — son las tomas donde mostrar un cambio de estado físico comunica más que un movimiento de cámara. Usa imagen + video normal (Paso 3.2) en las tomas de **Capítulo 1 (personaje/situación)**, **Capítulo 2 sin transformación (el producto quieto)** y **Capítulo 4 (resultado/payoff)** cuando no cambia el estado de una pieza, donde lo que importa es la acción/emoción.

**Tú eliges la toma internamente — nunca le presentes 2-3 opciones al usuario para que elija.** Analiza qué cambio de estado antes→después comunica mejor esa línea del guion, y entrégalo directo como parte del resultado completo.

**Nota sobre por qué suelen salir agrupadas**: no hay una regla que fuerce a las tomas Start/End Frame a estar consecutivas — es una consecuencia natural de que el Capítulo 3 normalmente ocupa un tramo continuo del guion. Si el guion tiene líneas de mecanismo o metáforas repartidas en distintos momentos, las tomas Start/End Frame pueden aparecer separadas igual.

**El START y el END son la misma escena en dos estados, y en el mismo look.** Ejemplos de par: el vaso linfático atascado de linfa turbia → la linfa clara fluyendo (médico); la pieza de piernas transparente llena de agua turbia → la pieza normal (Lego); la pieza-plátano colgando del conector de la cadera → la varilla encajada en el mismo conector, apuntando hacia arriba (Lego); el frasco cerrado sobre la placa → abierto con la gota cayendo (real sobre piezas).

**Especificidad obligatoria de cada prompt** (5-7+ oraciones completas, nunca frases genéricas sin desarrollar): qué es el sujeto, su estado físico exacto, el ambiente concreto donde está, dirección y calidez de la luz, ángulo y distancia de cámara, relaciones espaciales, el look en el que va. Entre el Start y el End Frame: mismo ángulo, mismo encuadre, misma luz, mismo ambiente, misma paleta — SOLO cambia el estado físico del sujeto. En los looks Lego y real sobre piezas, nunca describas al sujeto flotando — siempre "descansando naturalmente sobre [la superficie de la escena: la cama de ladrillos, la placa de studs del piso], con sombra de contacto suave". En la animación médica la relación espacial se dice dentro del cuerpo (el vaso cruza el cuadro en diagonal, el ganglio en la mitad de abajo), sin superficie ni studs.

**En el END de una metáfora, lo que sale de la pieza no queda conectado a ella.** Medido el 2026-10-05: un END con "a small puddle of clear water runs off across the floor studs" dibujó un chorro desde la pierna hasta el charco, y en el clip quedó como un soporte transparente pegado a la pieza. Con "a small flat puddle of clear water lies on the floor studs a little in front of her feet" no quedó nada pegado a la pieza y el clip drenó limpio (en el piso no salió agua sino una placa plana de plástico transparente: lo real dibujado en un frame Lego tiende a salir como pieza). Un chorro o un líquido que sale de la pieza va en el Motion, no en el frame.

**Plantilla — el START y el END van en DOS bloques de código separados**, cada uno con su etiqueta como encabezado FUERA del bloque, igual que el resto de la skill (Paso 3.2 y punto 4 del Paso 5). Nunca los metas en un mismo bloque, y nunca dejes la etiqueta dentro del código: si `**START FRAME:**` queda adentro, se copia al generador como parte del prompt.

El **negative prompt va dentro del bloque del END FRAME**, al final, nunca suelto ni después del prompt de video — **con su etiqueta `Negative prompt:` y todo**: es el negativo del look de la toma (3.2). No hay campo aparte para el negativo en ningún modelo de los que se usan: el bloque entero se copia y se pega junto, y la etiqueta es lo que marca dónde empieza lo que no se quiere.

Una metáfora o un cambio en el mundo Lego (look Lego):

**START FRAME:**
```
Vertical 9:16. LEGO minifigure style 3D render, The LEGO Movie look, photoreal toy photography. [Sujeto — "[nombre] from the reference image" — y dónde está, con el encuadre y el ángulo de cámara: sits on the edge of her brick-built bed, three-quarter view, camera at minifigure eye level] [la pieza en el estado del problema, descrita como objeto: dónde está encajada y cómo está] [su cara impresa] All characters are classic LEGO minifigures: cylindrical head with a stud on top, printed face, printed clothing on the torso, C-shaped claw hands, rigid one-piece legs on a single hip joint, no elbows or knees. Brick-built set at minifigure scale: [el lugar concreto]. [dirección y calidez de la luz] Resting naturally on [la superficie] with a soft contact shadow. Glossy injection-molded ABS plastic with subtle mold seams and faint micro-scratches, realistic plastic reflections, macro lens at minifigure eye level, moderate depth of field with the bricks in the background still readable, 8k, ultra-detailed, no additional text, captions, or watermarks overlaid on the image
```

**END FRAME:**
```
Vertical 9:16. LEGO minifigure style 3D render, The LEGO Movie look, photoreal toy photography. [La misma escena palabra por palabra — mismo sujeto, cámara, encuadre, set, luz, paleta] [solo cambia el estado de la pieza a su estado final, y lo que salió de ella queda aparte, apoyado en el set] [su cara impresa en el estado final] All characters are classic LEGO minifigures: cylindrical head with a stud on top, printed face, printed clothing on the torso, C-shaped claw hands, rigid one-piece legs on a single hip joint, no elbows or knees. Brick-built set at minifigure scale: [el mismo lugar]. [la misma luz] Resting naturally on [la superficie] with a soft contact shadow. Glossy injection-molded ABS plastic with subtle mold seams and faint micro-scratches, realistic plastic reflections, macro lens at minifigure eye level, moderate depth of field with the bricks in the background still readable, 8k, ultra-detailed, no additional text, captions, or watermarks overlaid on the image

Negative prompt: human skin, skin pores, realistic human body, human fingers, bent elbows, bent knees, clay, plasticine, vinyl toy, soft rubber, melted plastic, 2D cartoon, anime, 3D cartoon human character, LEGO logo, brand logos on bricks
```

El mecanismo (look animación médica 3D):

**START FRAME:**
```
Vertical 9:16. Medical 3D animation render, semi-realistic scientific visualization. [Sujeto y encuadre: extreme close-up inside a human lymphatic vessel running diagonally across the frame, a bean-shaped lymph node in the lower half] [estado físico inicial, en detalle] [textura y color del tejido] [ángulo de cámara] Soft volumetric light, cinematic macro depth of field, deep [burgundy] background inside the body, 8k, ultra-detailed, no additional text, captions, labels or watermarks overlaid on the image
```

**END FRAME:**
```
Vertical 9:16. Medical 3D animation render, semi-realistic scientific visualization. [La misma escena palabra por palabra] [solo cambia el estado físico a su estado final] Soft volumetric light, cinematic macro depth of field, deep [burgundy] background inside the body, 8k, ultra-detailed, no additional text, captions, labels or watermarks overlaid on the image

Negative prompt: LEGO, plastic bricks, studs, minifigure, toy, plastic toy look, cartoon faces, blue grid, technical grid background, clean studio backdrop, plain white background, infographic, diagram labels, arrows, text
```

Si la toma médica es la lámina anatómica, el START y el END usan el bloque de la lámina del 3.2 (la parte del cuerpo como translucent glass-like anatomical model, soft volumetric rim light, cinematic depth of field), la misma escena palabra por palabra, y el negativo médico al final del END.

Una transformación del producto sobre el mundo Lego usa el bloque real sobre piezas del 3.2 en los dos frames, con su negativo en el END.

**Video:**
El prompt de video va en un TERCER bloque, aparte, nunca mezclado con los dos anteriores, con la cabecera de su look y "from the START frame to the END frame" (no "from the shot above"):
```
LEGO minifigure animation, The LEGO Movie style, image-to-video from the START frame to the END frame, [DURACIÓN]s. Vertical 9:16.
Camera: static
Motion: [la transición entre los dos estados, una sola]
Everything made of LEGO stays rigid plastic: minifigure arms rotate only at the shoulder, hands swivel at the wrist, legs swing as one rigid piece from the hip, no bending at elbows or knees, no squash and stretch, bricks never bend, melt or morph, and facial expressions change like a new printed face. Nothing changes shape except what Motion describes.
Lighting: [la luz de los frames]
```
Si en la transición se mueve algo real (el agua que sale de la pieza, monedas, un chorro), después de la línea de rigidez va la línea de lo real del 3.2.
En una toma médica la cabecera es `Medical 3D animation, image-to-video from the START frame to the END frame, [DURACIÓN]s. Vertical 9:16.`, sin línea de rigidez y con `Lighting: soft volumetric glow`; en una de real sobre piezas, `Photoreal macro animation inside a LEGO world, image-to-video from the START frame to the END frame, [DURACIÓN]s. Vertical 9:16.`, con su línea de lo real antes de Lighting.

`Motion` describe la transición entre los dos estados ("the murky water drains out of the bulky translucent leg piece onto the floor studs and the piece slims down into her normal slim dark-blue leg piece, while her printed face changes from tired to relieved"); el motor genera el clip con el START como primer frame y el END como último. "Nothing changes shape except what Motion describes" deja dicho que la pieza de la metáfora sí cambia; se agregó por prudencia (3.2).

### 3.4 — Bloque de B-roll (aparte, al final — CON ubicación exacta, no genérica)

**Genera un B-roll por cada toma principal — la misma cantidad, 1 a 1.** Cada B-roll debe indicar explícitamente **dónde va**: después de qué toma y sincronizado con qué línea/idea exacta. Nunca entregues el B-roll como lista suelta — ese criterio es tu trabajo. **Nunca presentes el B-roll en formato de tabla** (esto ha pasado antes y es un error) — cada B-roll lleva su prompt de imagen y su prompt de video en bloques de código separados con etiqueta `**Imagen:**` / `**Video:**`, exactamente el mismo formato que las tomas principales, nunca comprimido en columnas.

**Cada B-roll va en el look de lo que muestra**, con su negativo y su cabecera de video: el detalle de la minifigura o de la metáfora en Lego (la pieza descrita como objeto, con dónde va encajada), el mecanismo en animación médica 3D, el ingrediente, el envase o cualquier objeto real de cerca en real sobre piezas. Un B-roll que es un pedazo de su toma (la misma mesa, el mismo frasco, el mismo rincón más de cerca) lo describe con las mismas palabras que la toma y, además, puede declarar `frame_inicial_de_esta_toma` en sus `referencias` y nombrar esa imagen en el prompt por su posición ("the desk from the second reference image, seen closer"): el motor la resuelve a la imagen inicial de la toma con el mismo número que el B-roll, así que sirve cuando el B-roll N va después de la toma N (lo normal en 1:1). No es regla fija: un B-roll que es otra imagen (una metáfora, otro lugar) va sin ella.

**Si en un B-roll aparece el personaje —o una parte de él: una mano en C sosteniendo algo, la minifigura de espaldas, sus pies— ese B-roll nombra la hoja en el prompt y declara el `id` del personaje en sus `referencias` (6.4).** Si no, sale otra minifigura, y se nota al corte. Lo mismo con el envase: si aparece, declara `producto`. Los B-roll que no muestran ni al personaje ni al producto van con `[]`.

**Visualiza la oferta concretamente**: cuando la línea de CTA (capítulo 4) mencione envío gratis, pago contra entrega, o garantía, ilustra ese detalle de forma concreta (ej. una minifigura repartidora entregando el paquete real en la puerta de ladrillos, billetes reales de la moneda del mercado en la mano para el descuento) en vez de un plano genérico del producto.

**Regla de consistencia al reordenar o editar**: si insertas, eliminas, reordenas o editas una toma después de haber numerado el guion, **renumera TODAS las referencias cruzadas y recalcula la duración de cada línea afectada antes de responder** — no solo la tabla del guion. Nunca digas "las demás tomas quedan igual, solo se corren un número" sin efectivamente reescribir cada referencia.

## Paso 4 — Localización por mercado (afecta CTA, texto en pantalla y tono — NO los prompts visuales)
- **Estados Unidos** (inglés, checkout directo): urgencia por stock/tiempo, prueba social cuantificada, CTA "Shop Now"/"Get Yours Today".
- **LatAm** (español, con contra-entrega): mencionar explícitamente "paga cuando lo recibas"/"pago contra entrega" si aplica, envío a todo el país. Si el usuario pide que NO aparezca precio/descuento, respétalo. Español neutro salvo país específico.
- **Brasil** (portugués): Pix/parcelamento si aplica, tono cálido y directo.

Lo único del mercado que sí entra en un prompt visual es el texto dictado de un objeto del mundo (3.1) —el calendario dice "DÍA 10" en español, "DAY 10" en inglés, "DIA 10" en portugués— y la moneda de los billetes reales, nombrada en el prompt ("real Mexican peso banknotes", "real US dollar bills", "real Brazilian real banknotes"; si el mercado es LatAm sin país, "real colorful banknotes with no readable text").

## Paso 5 — Formato de entrega final

**Regla no negociable**: arma SIEMPRE el paquete completo (guion + todas las tomas + B-roll 1:1 + overlays + guion de voz en off para ElevenLabs + herramientas + manifiesto), desde el primer intento — nunca solo una toma de muestra, nunca "¿quieres que te dé el resto?", nunca omitas el guion limpio de voz en off esperando a que lo pidan. Si no especificó duración, va la plantilla completa (2.4).

**Al terminar, el paquete no se muestra en el chat**: queda interno, en el manifiesto (Paso 6), y en el chat van solo el resumen corto y las tres opciones del Paso final. Se le entrega en el chat si elige la opción C (completo, nunca una muestra) o si pide ver una parte; siempre copiado del manifiesto, y nunca el manifiesto mismo.

Cuando se entrega, va con esta estructura:
1. La estructura en 2-4 líneas — la plantilla del 2.1 (u otra, si el usuario la pidió o trajo su guion): dónde se abre y dónde se paga el loop, las tres marcas de tiempo con sus plazos, quién es la persona cercana y qué metáforas con pieza usa el anuncio
2. Hojas de referencia: Character Bible (una por personaje recurrente) y hoja del producto real en el mundo Lego (solo si dio foto), con sus prompts
3. Tabla de guion línea por línea con tiempo de la plantilla, capítulo, look y duración calculada — indica también qué tomas usan Start/End Frame (Capítulo 3, transformaciones de producto y de metáforas) vs. imagen+video normal
4. Por cada toma: su prompt correspondiente (Start/End Frame + negative prompt, o imagen+video normal) en bloques de código separados, cada uno con su etiqueta, y qué referencias declara
5. Bloque aparte de B-roll (1 por cada toma principal, misma cantidad) con ubicación exacta
6. Notas de overlays/texto en pantalla palabra-por-palabra (nunca dentro de los prompts)
7. **Guion de voz en off limpio, listo para copiar y pegar directo en ElevenLabs** — solo las líneas habladas en orden, sin numeración, sin marcas de tiempo, en un bloque de código aparte. Obligatorio: va siempre en el paquete.
8. Herramientas recomendadas: Imagen — GPT Image 2.5, Nano Banana 2 / Nano Banana Pro, Seedream (los tres looks; con las hojas adjuntas como referencia). Video — Gemini Omni Flash, Kling 3.0 (los dos con start/end frame), Veo 3, Seedance. Overlays — CapCut (plantillas de "karaoke caption") o Premiere. Voz — ElevenLabs, tono cercano y cálido; las voces son multilingües, el idioma lo pone el texto.


---

## Paso 6 — Manifiesto de producción (JSON)

Este paso es **aditivo y no cambia nada de lo anterior**: el paquete del Paso 5 se arma exactamente igual, y además lo escribes en un manifiesto JSON. **El manifiesto es interno del sistema y nunca se muestra en el chat**, ni siquiera en la opción C del Paso final.

**Para qué sirve**: el manifiesto es el único punto de contacto entre esta skill y el pipeline de producción, que lee ese archivo y genera las imágenes, los videos y el audio, y arma el montaje automáticamente. Tú no ejecutas nada de eso ni sabes nada de APIs — solo describes el anuncio en JSON.

**Regla de fidelidad**: los prompts del manifiesto son **exactamente los mismos** que escribiste con los Pasos 3.1, 3.2, 3.3 y 3.4, completos. El manifiesto es la fuente de verdad: cuando el usuario ve un prompt (opción C del Paso final, o porque lo pidió), se copia del manifiesto carácter por carácter. Si lo que le mostraste difiere del manifiesto, el video final no será el que él revisó.

### 6.1 — Dónde va

Siempre en el archivo `temp/[slug-del-anuncio]/manifiesto.json`, donde `[slug-del-anuncio]` es el nombre del producto en kebab-case, y validado con `npm run validar -- temp/[slug]/manifiesto.json` antes del Paso final, corrigiendo lo que marque. **Si lleva la foto del producto**, déjala lista tú antes de validar (6.6); si no sabes dónde está y todavía no está en la carpeta del anuncio, el error de que falta ese archivo es esperable: se resuelve cuando te la pase; cualquier otro error se corrige antes del resumen. **No va en el chat**: en el resumen del Paso final basta media línea que diga que quedó guardado y validado (y, si falta la foto, que se la pida: 6.6).

### 6.2 — Estructura

```json
{
  "estilo": "estilo-lego",
  "modo_audio": "voz_en_off",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "referencias": [
    {
      "id": "protagonista",
      "tipo": "personaje",
      "prompt": "[la hoja de minifigura del 3.1, con su negativo. Una entrada por cada personaje recurrente]"
    },
    {
      "id": "producto",
      "tipo": "producto",
      "archivo": "producto.png",
      "generar_desde_archivo": true,
      "prompt": "[la hoja del producto real en el mundo Lego del 3.1, con el texto de la etiqueta dictado y su negativo]"
    }
  ],
  "tomas": [
    {
      "n": 5,
      "tipo": "B",
      "duracion": 4.6,
      "linea": "[la línea de voz en off de esta toma]",
      "prompt_imagen_inicial": "[el START FRAME completo]",
      "prompt_imagen_final": "[el END FRAME completo, con su negative prompt]",
      "prompt_video": "[prompt de video de la transición, con la cabecera de su look]",
      "referencias": ["protagonista"]
    }
  ],
  "broll": [
    {
      "n": 1,
      "despues_de_toma": 1,
      "sincroniza_con": "[la idea con la que sincroniza]",
      "duracion": 3,
      "prompt_imagen": "[prompt completo del Paso 3.4]",
      "prompt_video": "[prompt de video completo]",
      "referencias": ["producto"]
    }
  ],
  "voz_en_off": "[el guion limpio del punto 7 del Paso 5, idéntico]",
  "overlays": [
    { "texto": "7 días", "toma": 8, "momento": "inicio" }
  ]
}
```

### 6.3 — Cómo se llena cada campo

| Campo | De dónde sale |
|---|---|
| `estilo` | Siempre `"estilo-lego"`. |
| `modo_audio` | Siempre `"voz_en_off"` — narrador único, generado aparte. |
| `mercado` | Del Paso 1/4: `"EEUU"`, `"LatAm"` o `"Brasil"`. |
| `idioma` | `"en"`, `"es"` o `"pt"`, según el mercado. |
| `aspect_ratio` | Del Paso 1. Por defecto `"9:16"`. |
| `referencias` | La lista de referencias del anuncio: **cada personaje recurrente** con su hoja de minifigura, y **el producto** si el usuario dio foto, con `generar_desde_archivo: true` y su hoja como `prompt`. Ver 6.4. |
| `tomas[].n` | El número de toma de la tabla del guion, consecutivo desde 1. |
| `tomas[].tipo` | **`"B"` en las tomas de Capítulo 3 (mecanismo interno), en las de transformación del producto y en las de transformación de una metáfora con pieza** — las que llevan Start/End Frame según el Paso 3.3. **`"A"` en las demás** (Capítulo 1, Capítulo 2 sin transformación y Capítulo 4 sin cambio de estado de una pieza), que van con imagen + video normal. |
| `tomas[].duracion` | La duración calculada en el Paso 2.4 (palabras ÷ 2.4), **redondeada a un decimal** (5.8, nunca 6). |
| `tomas[].linea` | La línea de voz en off de esa toma, exactamente como está en la tabla. |
| `tomas[].prompt_imagen_inicial` | En Tipo B: **el START FRAME**. En Tipo A: el prompt de imagen del capítulo y el look correspondientes (Paso 3.2). |
| `tomas[].prompt_imagen_final` | En Tipo B: **el END FRAME**, con su negative prompt incluido tal como lo escribiste (Paso 3.3). En Tipo A: `null`. |
| `tomas[].prompt_video` | El prompt de video completo, con la cabecera de su look y su línea antes de `Lighting` (rigidez en Lego, lo real en real sobre piezas). |
| `tomas[].referencias` | Ver 6.4. |
| `broll[]` | Uno por cada toma principal (Paso 3.4). |
| `voz_en_off` | El guion limpio del punto 7 del Paso 5, idéntico. |
| `overlays` | Las notas de texto en pantalla del punto 6 del Paso 5 (`momento`: `"inicio"`, `"mitad"` o `"final"` de la toma). Array vacío `[]` si no hay. El motor **no los dibuja**: los valida y los lista en `plan-montaje.txt` para quien monte en CapCut; los subtítulos de la voz sí los pone el pipeline. |

### 6.4 — Separar el bloque Start/End, y el campo `referencias`

**Al pasar una toma Tipo B al manifiesto, separa el bloque.** En el paquete (y en el chat, cuando se le entrega) el START FRAME y el END FRAME van en dos bloques de código con su etiqueta (Paso 3.3). En el manifiesto van en **dos campos distintos**: `prompt_imagen_inicial` y `prompt_imagen_final`. El negative prompt viaja dentro de `prompt_imagen_final`, al final del END, igual que en su bloque.

Hay dos sitios que se llaman igual y hacen cosas distintas:

- **`referencias` del manifiesto** (el de arriba, al mismo nivel que `tomas`): la **lista** de lo que el anuncio reusa entre tomas.
- **`referencias` de cada toma**: los `id` de esa lista que esa toma concreta usa.

**La lista es ABIERTA.** No hay un máximo ni un catálogo cerrado de tipos. Si este anuncio necesita un objeto, un escenario o un elemento recurrente que no es ni personaje ni producto, **emítelo como una entrada más con su propio `prompt`**: no pidas permiso, no inventes un campo nuevo, y no lo repitas a mano dentro del prompt de cada toma. El motor lo trata igual que a un personaje — genera su hoja una sola vez y la reusa en cada toma que la declare.

Cada entrada:

| Campo | Qué es |
|---|---|
| `id` | Lo eliges tú. Letras, números, guion y guion bajo, sin espacios. Único dentro del anuncio. No empieces por `toma-` ni `broll-`. |
| `tipo` | Descriptivo: `personaje`, `producto`, `objeto`, `escenario`, lo que corresponda. El motor **no cambia de comportamiento** según el tipo; sirve para leer el manifiesto. |
| `prompt` | Si la referencia hay que **generarla**. El motor crea su hoja antes que las tomas. |
| `archivo` | Si la **aporta el usuario** (la foto del producto). Solo el nombre del archivo, sin ruta. |
| `generar_desde_archivo` | `true` solo en el producto: el motor genera la hoja del producto real en el mundo Lego del `prompt` **usando el `archivo` como referencia**, y esa hoja es la que se adjunta a las tomas. Es la única entrada que lleva `archivo` y `prompt` a la vez. |

En cualquier otra entrada, `prompt` y `archivo` son excluyentes: una tiene uno o el otro, nunca los dos.

**Qué emite este estilo normalmente:**

- **El producto**, con `archivo`, `generar_desde_archivo: true` y su hoja como `prompt`, si el usuario dio foto del envase (3.1).
- **Cada personaje recurrente**, con su hoja de minifigura como `prompt`. En este estilo casi siempre hay al menos uno, porque todo lo humano es Lego; y si hay pareja, familia o compañeros que se repiten, cada uno lleva la suya.
- **Lo que haga falta**: si un objeto o un lugar concreto reaparece entre capítulos (el dormitorio donde abre y cierra el loop), va como una entrada más. La hoja de un **escenario** es el set Lego **vacío de minifiguras**, en plano general, con la luz de la escena y en el mismo render (aquí sí va el ambiente: la hoja *es* el ambiente); las tomas lo nombran "the bedroom from the reference image" y declaran su `id` junto con los demás.

**Las tomas de animación médica 3D van con `[]`**: no muestran a ningún personaje del anuncio (ni la lámina anatómica: es un cuerpo genérico, no la minifigura). Las tomas Lego declaran a cada personaje que aparece, y las que muestran el envase declaran `producto`.

En las tomas y en los B-roll, además de los `id` de la lista, hay **dos valores reservados**:

- `"frame_anterior"` — no apunta a la lista, apunta al frame de la toma anterior. Úsalo solo cuando la continuidad entre dos tomas importe de verdad.
- `"frame_inicial_de_esta_toma"` — solo en un B-roll que es un pedazo de su toma (3.4): adjunta la imagen inicial de la toma con el mismo número que el B-roll.

Array vacío `[]` si la toma no necesita ninguna referencia.


### El B-roll declara sus referencias igual que una toma

**Si en un B-roll aparece el personaje —o una parte de él: una mano en C sosteniendo algo, la minifigura de espaldas, sus pies, un detalle de ella usando el producto—, ese B-roll TIENE que incluir el `id` del personaje en sus `referencias`. Si no lo incluyes sale otra minifigura, y se nota al corte.**

Lo mismo con el producto: **si el envase aparece en un B-roll, ese B-roll declara `producto`**, o sale un envase inventado.

Los B-roll que no muestran ni al personaje ni al producto —el mecanismo por dentro, un ingrediente suelto, un set vacío— van con `[]` y esta regla no les aplica.

> **De dónde sale.** Medido en anuncios reales: cuando los B-roll declararon las referencias del personaje, salió la misma persona en todos; cuando no, un B-roll de la mano del personaje salió con **otra mujer**, con otro pelo, otra cara y un anillo que el personaje no tiene.


En las tomas Tipo B **no declares nada para el frame final**: la capa de producción siempre le pasa el frame inicial como referencia al generar el final.

### 6.5 — Verificación antes de entregar

1. ¿Hay una entrada en `tomas` por cada fila de la tabla del guion, y los `n` coinciden?
2. ¿Hay un B-roll por cada toma principal?
3. ¿**Las tomas de Capítulo 3 y las de transformación (de producto o de metáfora) tienen `tipo: "B"` con su `prompt_imagen_final`**, y las demás tienen `"A"` con `null`? Debe coincidir con lo que declaraste en el punto 3 del Paso 5.
4. ¿Separaste el START y el END en dos campos, en vez de meter el bloque entero en uno?
4b. ¿Cada `id` que declaran las tomas existe en la lista de `referencias`?
5. ¿Cada prompt del manifiesto está completo, tal como lo escribiste con los Pasos 3.1 a 3.4, sin resumir ni recortar? Lo que el usuario vea después se copia de aquí.
6. ¿Las `linea` de todas las tomas, en orden, dan el mismo texto que `voz_en_off`?
7. ¿**Cada imagen lleva el negativo de su look** (en un par Start/End, al final del END; y las tomas Lego con envase, su cola de producto), **cada video la cabecera de su look** (Lego con la línea de rigidez —y la de lo real si en el clip se mueve algo real—, real sobre piezas con la línea de lo real), **ninguna toma médica nombra LEGO ni studs en el positivo**, **ningún prompt describe el producto hecho de piezas**, y **cada metáfora describe el objeto, dónde va encajado y hacia dónde apunta o cómo cuelga, nunca lo que significa**?
8. ¿El JSON es válido? Comillas dobles, sin comas colgando.

### 6.6 — La foto del producto (nunca inventes el nombre del archivo)

El `archivo` de la entrada del producto es el nombre de un archivo que **tiene que existir de verdad** en la carpeta del anuncio. Si escribes ahí un nombre inventado a partir de la marca, el pipeline se detiene, o peor, genera un envase inventado.

- Si el usuario dio foto → la entrada del producto existe, con `"archivo"` = **el nombre que dejó `preparar-producto.js`**: `producto.png` si la foto ya venía en PNG, `producto.jpg` si venía en JPG o hubo que convertirla. Mira la carpeta antes de escribirlo; si todavía no se corrió el comando, escribe `producto.jpg` y el comando lo corrige en el manifiesto.
- Si no dio ninguna → **la entrada del producto simplemente no está en la lista**, y ninguna toma ni B-roll puede declararla.

**La foto la dejas lista tú**, apenas escribiste el manifiesto y antes de validarlo (6.1), si sabes dónde está: la ruta que te dio el usuario, o la imagen que pegó en el chat (la lees en su ruta local). La ruta va tal cual, aunque sea `.webp` o `.heic` o tenga espacios en el nombre (con la foto en su carpeta, `npm run validar` pasa sin el error del 6.1):

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug-del-anuncio]
```

El comando la copia a la carpeta del anuncio, la convierte si hace falta, y deja el nombre correcto escrito en el manifiesto. Si no sabes dónde está, en el resumen del Paso final pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando, y córrelo tú apenas la tengas. Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. **Ningún comando va en el mensaje del Paso final.**

## Paso final — Pregunta cómo quiere producirlo

Ya armaste el paquete completo (guion, prompts de cada toma, B-roll, texto en
pantalla y guion de voz) y quedó en el manifiesto, guardado y validado (si la
foto del producto todavía no está en su carpeta, eso es lo único pendiente: 6.1).
**Ahora, y solo ahora, pregúntale al usuario cómo quiere seguir.** El paquete
no se pega en el chat: van solo un resumen corto y las tres opciones.

El resumen son 1 a 3 líneas: el estilo, el producto, el mercado y el idioma,
cuántas tomas y cuántos B-roll, y la duración aproximada. Si hay una decisión
que conviene que el usuario sepa, va en UNA línea más: en este estilo suelen ser
los plazos de la línea de tiempo que pusiste tú, o algo como "agregué 'Pagas al
recibirlo' en el cierre por el pago contra entrega". Nada más: ni el guion, ni
los prompts, ni el manifiesto.

No lo decidas tú: las tres salidas son legítimas y cuestan cosas distintas.

```markdown
Listo: anuncio estilo Lego de [producto] para [mercado], en [idioma]. [N] tomas
y [N] B-roll, unos [N] segundos. Todo quedó guardado y validado[, salvo la
foto del producto: pásamela (arrástrala al chat o dime la ruta) y la dejo en
su carpeta].
[Si hace falta, una línea con la decisión que conviene que sepas.]

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero las imágenes y los videos en Google Flow,
armo el montaje y te entrego el MP4 terminado. Antes de los videos te digo
cuántos créditos de Flow gastan.

**B) Genera solo las imágenes y los videos** — los genero en Google Flow y te
los dejo en su carpeta, listos para que los montes tú en CapCut a tu gusto.
También te digo los créditos de Flow antes de los videos.

**C) Entrégame el paquete de prompts** — te paso aquí todo el paquete: el guion
toma por toma, las hojas de referencia, los prompts de imagen y video de cada
toma, el B-roll, el texto en pantalla y el guion de voz para ElevenLabs, para
que lo revises o lo produzcas a mano. Después, si quieres, seguimos con A o B.
```

Si en cualquier momento pide ver el paquete o una parte ("muéstrame el guion",
"pásame los prompts de la toma 3"), muéstrale esa parte, copiada del manifiesto.

### Las imágenes y los videos se generan en Google Flow

En esta versión del sistema, `npm run imagenes` y `npm run videos` no generan
ni cobran nada: arman la lista de trabajo (la cola) y tú generas cada archivo en
Google Flow. Donde el flujo (el de `COMO-PRODUCIR.md` en la opción A, o el de la
opción B) dice `npm run imagenes` o `npm run videos` —con `--solo-plan`, `--si`
o el costo de kie.ai—, va este ciclo, en ese mismo lugar del orden:

1. `npm run imagenes -- temp/[slug]` arma la cola (`temp/[slug]/flow/cola-imagenes.json`)
   y hace solo lo que no necesita Flow (las copias de frames).
2. Genera la cola en Google Flow con la skill `flow-generacion`: manejas Chrome
   con la extensión Claude in Chrome, y esa skill explica todo el procedimiento
   (ventana aparte, subir las referencias, enviar todo, reintentos, descargar
   cada archivo con su nombre).
3. `npm run flow:recibir -- temp/[slug]` mueve las descargas a la carpeta del
   anuncio, las convierte y las verifica.
4. Repite 1 a 3 hasta que la cola diga que no queda nada. Hay trabajos que
   esperan a otros (las tomas a las hojas de referencia, el END FRAME a su
   START, `frame_anterior` a la toma anterior) y recién salen en la vuelta
   siguiente.
5. Lo mismo con `npm run videos -- temp/[slug]`. **Antes de mandar los videos
   a Flow**, dile al usuario cuántos clips son y la estimación de créditos que
   imprime el comando, y espera su ok. Las imágenes cuestan 0 créditos en Flow
   y no necesitan ok.

En esta versión kie.ai solo cobra la música y las canciones de Suno; la voz y
la transcripción siguen por ElevenLabs.

### Si elige A — el anuncio completo

Sigue el proceso de `COMO-PRODUCIR.md` de principio a fin, **sin pararte a
preguntar entre comando y comando**, con las imágenes y los videos en Google
Flow como dice la sección de arriba. El usuario ya dijo que sí: pedirle
permiso en cada paso es hacerle perder el tiempo.

**Y no te saltes la música ni las transiciones** — secciones 3 y 4 de
`COMO-PRODUCIR.md`. Son **obligatorias** en este estilo, el pipeline avisa si
faltan pero no detiene nada, y un anuncio sin ellas se renderiza perfecto y sale
plano. Es el fallo más fácil de cometer de todo el proceso. **En este estilo la
música es fija: "Open Up Emotions".** `npm run musica -- temp/[slug]` la copia
sola desde `recursos/musica/estilo-lego.mp3` (sin Suno, sin costo). Si el
usuario pidió otra música, va su archivo en `temp/[slug]/musica/` (el suyo gana
sobre la pista fija) o una de Suno con `npm run musica -- temp/[slug] --suno`.

**Los niveles no se tocan a mano.** La voz se nivela sola al generar el audio
(`npm run audio`; la original queda en `audio/voz-original.mp3`, y
`npm run voz:nivelar -- temp/[slug]` lo repite si hace falta) y la música, en el
plan. Quedan como en el anuncio aprobado del estilo: la voz a unos −13,6 dB
donde se habla y la música pareja, unos 20 dB por debajo, sin subir al final.
Sea cual sea la voz o la música, el motor mide y ajusta.

Las únicas paradas que sí van, y que no se saltan nunca (además de las de
Google Flow que pide `flow-generacion`, abajo):

1. **Los créditos de Flow, antes de los videos.** Cuántos clips son y la
   estimación que imprime `npm run videos`; espera un sí antes de mandarlos a
   Flow. El usuario paga cada clip con los créditos de su cuenta de Flow (las
   imágenes, 0 créditos). Si pidió música de Suno en vez de la fija, esa se
   cobra en kie.ai: muéstrale ese costo y espera su sí.
2. **La voz la elige el usuario.** El motor narra con la
   `ELEVENLABS_VOICE_ID` del `.env` sin preguntar, así que antes de
   `npm run audio` lista las voces con `npm run voces` y que el usuario elija
   (de hombre o de mujer, la que quiera); la elegida va al `.env`.

Las paradas de Google Flow las pone `flow-generacion` y también van siempre:
pedirle una vez que mueva el grupo de pestañas "Claude" a una ventana aparte,
el permiso de cada tanda de descargas, y el inicio de sesión, la verificación o
el captcha, que hace el usuario.

Al final, entrégale los MP4 **y el informe** que pide `COMO-PRODUCIR.md`: qué
salió bien, qué salió mal toma por toma, qué regenerarías y cuántos créditos de
Flow costaría (una imagen, 0), y lo gastado de verdad: los créditos de Flow de
los videos, y kie.ai solo si hubo música de Suno. Ahí él decide si quiere
ajustar algo.

**Y ten cuidado con qué llamas "lo que salió mal".** El motor imprime avisos
—tomas aceleradas por encima de la guía, B-roll que no entraron, la música que
se repite en loop— y **eso no son fallos: es el montaje funcionando.** El propio
motor lo dice: *"ninguno detiene el montaje"*. Ponlos en un apartado aparte,
como decisiones del montaje, no como defectos.

Defectos de verdad hay pocos y son medibles: fotogramas negros, tramos
congelados, voces coladas, contenido equivocado en una toma, o el nombre o el
logo del envase ilegibles o cambiados (la letra chica alterada en las tomas no
es defecto, ver 3.1). Eso sí va en "lo que salió mal". **En este estilo hay
más que mirar**, y son defectos de contenido que se regeneran con el prompt
revisado:

- una minifigura que salió humana (dedos, codos, rodillas, piel) o que se dobla
  en el clip;
- ladrillos que se derriten o se deforman;
- una pieza Lego colada en una toma de animación médica, o una toma médica que
  salió sobre grid o fondo de estudio, o como diagrama con flechas o rótulos;
- el producto convertido en piezas;
- algo real (hojas, líquido, comida, billetes) que salió como pieza Lego en la
  imagen o se volvió Lego a mitad del clip;
- el envase flotando junto a la mano en vez de agarrado, o tan grande que tapa
  la mano;
- la pieza de la metáfora suelta o sostenida en la mano en vez de encajada
  donde dice el prompt;
- lo que sale de una pieza (agua, líquido) pegado a ella como un soporte;
- algo real que se transforma en otra cosa a mitad del clip (una flor que se
  vuelve otra flor);
- una minifigura que nadie pidió y que entra al set.

Para regenerar una toma en esta versión, cuando el usuario lo pida:
`npm run rehacer -- temp/[slug] --toma N --contexto` muestra lo que no se toca
y los prompts que fallaron; escribe los nuevos (una escena distinta para la
misma intención, nunca el mismo prompt) en un `nuevos.json`
(`prompt_imagen_inicial`, `prompt_imagen_final` si es Start/End,
`prompt_video` y `motivo`) y aplícalos con
`npm run rehacer -- temp/[slug] --toma N --aplicar nuevos.json`. Eso guarda los
prompts anteriores en `prompts-anteriores.json` y saca de la carpeta solo la
imagen (o el par START/END) y el clip de esa toma. Después corre lo que
imprime, en ese orden —`npm run imagenes -- temp/[slug] --tomas N` y
`npm run videos -- temp/[slug] --tomas N --sin-broll`—, cada uno con el ciclo
de Flow de arriba (en vueltas, y con el ok de créditos antes del clip), y
`npm run flow:recibir -- temp/[slug]` **sin `--rehacer`**: los archivos viejos
ya no están. No le agregues `--rehacer` a `npm run imagenes`: con `--tomas N`
también vuelve a pedir las hojas de referencia, y eso cambia la minifigura y el
envase respecto de todas las demás tomas.

**La duración NO es un defecto.** Si el usuario pidió 40 segundos y salieron
44.6, eso está bien y no se corrige. **Nunca cortes una línea del guion, quites
una toma ni inventes copy para llegar a un número**, y no se lo ofrezcas al
usuario como opción. El tiempo que pide orienta el presupuesto de palabras; el
anuncio dura lo que necesita durar. Menciónalo como dato, sin pedir disculpas.

### Si elige B — solo las imágenes y los videos

Corre las fases de generación y **párate antes de ensamblar**:

```
npm run validar   -- temp/[slug]/manifiesto.json
npm run imagenes  -- temp/[slug]        arma la cola: Flow + flow:recibir, en vueltas
npm run audio     -- temp/[slug]        solo si el modo es voz_en_off
npm run videos    -- temp/[slug]        arma la cola: ok de créditos, Flow + flow:recibir, en vueltas
npm run musica    -- temp/[slug]        la pista fija del estilo ("Open Up Emotions")
npm run plan:humano -- temp/[slug]
```

Las imágenes y los videos van con el ciclo de Google Flow de arriba, con la
misma parada de créditos antes de los videos y las de `flow-generacion`
(ventana aparte, permiso de cada tanda de descargas, inicio de sesión o
captcha).

El último deja `plan-montaje.txt` en la carpeta del anuncio: dice qué toma va
con qué línea, en qué segundo, qué B-roll le toca y dónde está el mp3 de la
voz. **Está escrito para que lo lea una persona**, y es lo que necesita para
montarlo en CapCut sin adivinar nada.

Dile dónde quedó todo y qué contiene ese archivo.

### Si elige C — el paquete en el chat

Entrégale el paquete **completo**, nunca una muestra, con la estructura del
Paso 5 (puntos 1 a 8): la estructura del anuncio, las hojas de referencia, la
tabla del guion con el look y la duración de cada toma, los prompts de cada toma
en sus bloques con su etiqueta (el START y el END en dos bloques, con el
negativo al final del END), el B-roll, el texto en pantalla, el guion de voz
limpio para ElevenLabs y las herramientas. **Sin el manifiesto**: es interno del
sistema.

Los prompts, las líneas y el guion de voz que muestras se copian **del
manifiesto**, carácter por carácter: es la fuente de verdad. Si pide cambios,
se hacen en el manifiesto, se vuelve a validar
(`npm run validar -- temp/[slug]/manifiesto.json`) y le muestras lo que cambió,
copiado de ahí.

Al final, ofrécele seguir con A o B con ese mismo paquete, o dejarlo ahí.

---
## Reglas que nunca se rompen
- Cada toma en su look: lo humano en Lego, el mecanismo del cuerpo en animación médica 3D (el de una app, un servicio o un objeto, en Lego), el producto real sobre piezas. Nunca un personaje de dibujo animado, de plastilina o humano en una toma Lego, ni una pieza Lego dentro del cuerpo.
- El producto es siempre el real, con su etiqueta: nunca se convierte en ladrillos.
- Lo que no se puede mostrar se muestra con una pieza, y en el prompt se describe el objeto, dónde va encajado y hacia dónde apunta o cómo cuelga, nunca lo que significa.
- Cada imagen lleva el negativo de su look (en un par Start/End, una sola vez, al final del END) y cada video la cabecera de su look: Lego con la línea de rigidez (y la de lo real si en el clip se mueve algo real), real sobre piezas con la línea de lo real (con la cabecera Lego sola, lo real se vuelve piezas a mitad del clip). Ninguna toma médica nombra LEGO ni studs en el positivo.
- Nunca pongas texto/estadísticas dentro de los prompts de imagen o video — se agregan en edición. Las únicas excepciones son el texto de la etiqueta del producto, que se dicta literal en su hoja, y un número o palabra corta de un objeto del mundo, dictado en el idioma del anuncio.
- Nunca generes el video/imagen tú mismo salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente. En esta versión eso es el Paso final: si elige A o B, generas en Google Flow la cola que arma el motor.
- Cuando se entrega el paquete (opción C, o porque el usuario lo pidió), va completo, nunca una muestra. El manifiesto nunca se muestra en el chat.
