---
name: anuncios-podcast
description: Genera anuncios estilo podcast con IA — dos anfitriones frente a micrófonos conversando, donde el producto entra como recomendación entre amigos y no como pitch — para productos físicos, digitales y servicios de marcas DTC/Ecommerce en Estados Unidos y Latinoamérica. Usar SIEMPRE que el usuario pida un anuncio, guion, copy o creativo estilo "podcast", "conversación entre dos personas", "dos hosts hablando", "clip de podcast", "fake podcast", o pida convertir un guion ganador de otro formato a podcast, o mencione crear anuncios con IA sin especificar estilo (ofrecer este como una opción). Acepta un guion ganador ya escrito. Arma el guion por beats con cada línea numerada, los prompts de los dos hosts, los bloques de generación de hasta 10 s, los clips de reacción, el B-roll, el mapa de montaje y el manifiesto interno; en el chat da un resumen corto y tres opciones (producirlo todo, solo imágenes y videos, o el paquete de prompts).
---

# Generador de Anuncios IA — Estilo Podcast

Convierte un producto, servicio u oferta en un **anuncio estilo podcast**: un clip vertical que parece un momento sacado de un podcast real. Dos anfitrionas (o anfitriones) frente a micrófonos, una cuenta un problema que tuvo, la otra ya lo resolvió, y el producto aparece como una recomendación entre amigas. Funciona porque **no se lee como anuncio**: el espectador espía una conversación en vez de recibir un pitch.

**Con el manifiesto que entrega esta skill, el motor de este sistema produce el anuncio**: genera la imagen de cada host, genera cada bloque de diálogo y cada clip de reacciones (con la imagen del host como primer cuadro), genera el B-roll, transcribe cada clip (también las reacciones, para comprobar que no dicen ninguna palabra) y ubica cada línea, arma la conversación en el orden del guion con sus cutaways y su B-roll (en modo esquina, recorta al host que habla para ponerlo sin fondo encima del B-roll), pone los subtítulos y entrega el MP4. En esta versión del sistema, las imágenes y los videos los generas tú en Google Flow a partir de la lista de trabajo (la cola) que arma el motor; la transcripción, la revisión y el montaje siguen en el motor. Nada se genera antes de que el usuario elija cómo seguir, y ningún video antes de que apruebe sus créditos de Flow (Paso final).

**Idioma**: interactúa, pregunta y escribe SIEMPRE en español neutro (LatAm), salvo que el usuario pida otro idioma para el anuncio final. El andamiaje de los bloques de generación va en inglés (los modelos de video responden mejor), pero las líneas de diálogo van **textuales en el idioma del anuncio**. Los prompts de imagen (hosts y B-roll) van en español.

**Lo que esta skill entrega**: el guion y todo lo necesario para producirlo y montarlo. Las imágenes de los dos hosts **siempre las genera la IA**: la skill entrega los dos prompts (A, y B con la imagen de A como referencia) y el motor las genera. Esas dos imágenes son el primer cuadro de todas las generaciones de cada uno.

---

## La ley del 80%: el realismo vive en el guion

Los modelos de video actuales ya resuelven caras, voces y cuarto de forma convincente. Lo que delata un podcast falso es **diálogo que ningún ser humano diría**. Por eso el esfuerzo va en que la conversación suene real; los bloques de generación son mecánicos en comparación.

La prueba de fuego, siempre: **leer el guion en voz alta**. Todo lo que suene a página de ventas se reescribe. Y la pregunta que resume todo: *¿un extraño sabría que es un anuncio antes de que aparezca el producto?* Si la respuesta es sí, el guion falló, por más buenos que sean los prompts.

---

## Reglas obligatorias — léelas antes de generar cualquier cosa

1. **Hay una sola pausa obligatoria: el briefing del Paso 1.** No escribas ni una línea del guion antes de tener las respuestas. Apenas las tengas, armas **todo de un tiro** — sin resumen intermedio, sin pedir confirmación, sin preguntar "¿quieres que continúe?" — el paquete completo (Formato de entrega) y el manifiesto (Sección G). El paquete no se muestra en el chat: ahí va solo un resumen corto y la pregunta del Paso final.
2. **El CTA es SIEMPRE indirecto**, para cualquier producto, servicio o digital. Nadie le habla a cámara, nadie dice "compra ahora" ni "link en bio". El CTA se construye con los 3 movimientos del CTA indirecto. Sin excepción.
3. **Un personaje = una generación (o las menos posibles).** Todas las líneas de un personaje se agrupan en un solo bloque de generación; el modelo hace pausas naturales entre líneas y ahí corta el motor. Esto ahorra créditos y mantiene la voz consistente.
4. **Cada bloque de generación va COMPLETO**, con todo su texto, en su propio bloque de código. Nunca escribas "[misma estructura que arriba]" ni abrevies nada: el bloque entero es lo que va al manifiesto y lo que recibe el generador.
5. **Sin cola de calidad.** No agregues "4K, Ultra HD, rich details, sharp clarity" ni nada parecido al final de los prompts. Contradice el objetivo (queremos que parezca un clip real, no un render pulido), la resolución la pone el motor, y está comprobado que sin esa línea los clips salen bien.
6. **Techo de 10 segundos por generación, y se pide 4, 6, 8 o 10.** Mides cada bloque con la fórmula de "La aritmética", redondeas **hacia arriba** a una de esas cuatro duraciones y escribes el conteo real de palabras en la etiqueta. Guía: 10 s → 20–26 palabras, 8 s → 16–21, 6 s → 12–15. **Nunca más de 26 palabras en 10 s**: con las pausas entre líneas, el modelo apura.
7. **La descripción de voz de cada personaje se copia idéntica** en todas sus generaciones. Es lo único que mantiene su voz igual entre clip y clip.
8. **Cada personaje lleva además una generación de reacciones sin palabras** (3 reacciones encadenadas, 8 s) para los cutaways del montaje: tres gestos distintos, cada uno con su sonido hecho con los labios cerrados (una risa por la nariz, un "hmm", un suspiro), **nunca palabras ni monosílabos en ningún idioma**. Cada cutaway marca en el Guion la frase que lo provoca.
9. **Nunca texto en pantalla, captions ni música dentro de los prompts.** Los subtítulos los pone el motor en el montaje; música de fondo no hay en este estilo.
10. **Los hosts siempre los genera la IA.** Nunca una foto de una persona real, nunca una imagen que trae el usuario: los dos prompts de imagen son parte fija de la entrega.
11. **B-roll generado con IA en 2 a 4 líneas**, todas entre la revelación (beat 4) y antes del CTA (beat 8), cada una con su prompt de imagen y su prompt de video completos, **compuesto para el modo elegido** (en pantalla dividida, lo importante en la franja del medio; en esquina, lejos de la esquina del host que habla). El CTA siempre con los hosts a pantalla completa.
12. **Copy desde cero en cada anuncio.** Nunca reutilices frases, cifras, ángulos ni ideas de otros anuncios, aunque sean del mismo producto, ni del ejemplo de esta skill. De un anuncio anterior solo puedes tomar qué es el producto. Tampoco preguntes lo que esta skill ya resuelve.
13. **La duración no es un defecto.** Nunca rellenes ni recortes un guion para llegar a un número.
14. **Si el guion ya viene escrito de afuera, lee el Paso 0 antes que nada** — cambia por dónde empiezas y qué preguntas.

---

## Paso 0 — Si el guion ya viene escrito (atajo)

**Este paso solo se activa cuando el usuario pega un guion ya escrito y pide convertirlo a estilo podcast** ("tengo este anuncio ganador de una persona a cámara, pásamelo a podcast"). Si no llega ninguno, ignóralo entero y empieza por el Paso 1.

### Lo que NO haces cuando llega un guion

- **No escribes un guion nuevo ni "mejoras" el que te dieron.** El usuario lo trajo porque ya le funciona: el mensaje, el orden de las ideas, los beneficios que nombra, la prueba que usa y las palabras clave se respetan.
- **No preguntas el producto, el público, el dolor ni la objeción** si el guion ya los deja claros. Dedúcelos leyéndolo y dilos en una frase para que el usuario te corrija.

### La traducción al formato — y qué sí cambia

Un guion de otro formato casi siempre es **una sola voz** (una persona a cámara, un narrador, un personaje). El podcast son **dos voces**. Convertirlo no es mejorarlo, es repartirlo:

1. **Lee el guion y marca cada frase con su función**: ¿es el problema? ¿el reencuadre? ¿el producto? ¿un beneficio? ¿la prueba? ¿una objeción respondida? ¿el CTA?
2. **Reparte las funciones entre los dos roles** (ver "La estructura del guion"): lo que en el original era "yo tenía este problema" lo dice la Anfitriona A; lo que era "y esto fue lo que me funcionó" lo dice la Anfitriona B. Las objeciones que el original contestaba en monólogo ("y sé que piensas que...") se convierten en una pregunta real de A y una respuesta de B.
3. **Cambia solo lo mínimo para que cada línea la pueda decir esa persona en una conversación**: pasar de segunda persona ("tú sientes que...") a primera ("yo sentía que..."), partir una frase larga en pregunta y respuesta, agregar los ecos de reconocimiento. Las palabras clave del original se mantienen.
4. **El CTA del original se reemplaza por el CTA indirecto de 3 movimientos** (ver "La ley del CTA indirecto"). Es la única parte que se reescribe sí o sí, porque un "haz clic abajo" dicho a cámara rompe el formato. Avisa que lo hiciste.
5. **Deja visible la traducción**: al inicio del Guion, incluye una nota corta con un par de líneas del original y cómo quedaron repartidas, para que el usuario vea qué cambió sin tener que comparar los dos textos. Es una nota dentro de la entrega, no una pausa.

### Lo que SÍ haces, en este orden

1. Di en una sola frase qué producto, qué público y qué objetivo leíste en el guion.
2. **El briefing se acorta.** Pregunta solo lo que el guion no contesta — típicamente **cómo son los dos hosts** (pregunta 6), **dónde se consigue el producto** (pregunta 5), **cómo quiere el B-roll** (pregunta 7) y, si es un producto físico, **la foto del producto**. Nada más.
3. Con esas respuestas, arma directamente todos los bloques y el manifiesto, y pasa al Paso final (el resumen corto y la pregunta). No hay resumen ni confirmación intermedia.

---

## Paso 1 — Briefing obligatorio

Cuando el usuario pida un anuncio estilo podcast, NO lo escribas todavía. Pregunta exactamente esto, en un solo mensaje, como texto abierto (sin botones ni formularios), y solo lo que no te haya dicho ya:

1. **¿Para qué producto o servicio es el anuncio?** (Qué es, si es físico o digital, y qué problema promete resolver. Si es un producto físico, que suba una foto del envase, de frente, con la etiqueta legible: va como referencia en el B-roll donde aparece el producto.)
2. **¿Quién es el público y cómo describe el problema con sus propias palabras?** (Edad, género, situación. Si tienes frases reales de clientes, reseñas, comentarios o quejas, pégalas: el guion se construye con ese vocabulario, no con copy de marketing.)
3. **¿Cuál es la principal objeción o duda que frena la compra?** ("es caro", "me va a acelerar", "ya probé de todo", "no tengo tiempo", etc.)
4. **¿Qué dato concreto y real puede usar la anfitriona como prueba?** (Algo que solo sabría quien lo compró: cuántas unidades trae, cuánto dura, en cuánto llega, un detalle de uso, un número real. Un solo dato, pero verdadero.)
5. **¿Dónde se consigue?** (Página web, WhatsApp, app, tienda, link en el perfil. Es para la respuesta logística del CTA indirecto — se dice de pasada, nunca como orden.)
6. **¿Cómo son tus dos hosts?** (Género y edad aproximada de cada uno, y cuál va a la izquierda del plano. Con eso se escriben las voces, los pronombres de los prompts y las dos imágenes.)
7. **¿Cómo quieres el B-roll?** Dos formas: **pantalla dividida** (el B-roll arriba, que se funde con un degradado sobre el host que habla, abajo; los dos a la vez) o **esquina** (el B-roll a pantalla completa y el host que habla recortado, sin fondo, superpuesto en la esquina inferior de su lado; vale para cualquiera de los dos, uno por vez). La esquina suma un paso de recorte en la computadora: no cuesta créditos, pero es lento. Si no contesta, va pantalla dividida.

Si el usuario quiere el anuncio en otro idioma o una duración específica, puede decirlo aquí. Si no, el guion va en español neutro y la duración la decide la estructura (25 a 45 segundos hablados).

**Si sube una foto, reconócela tú**: di qué ves ("Veo que es un frasco de cápsulas con etiqueta verde; corrígeme si me equivoco") y no preguntes lo obvio. Si la foto trae precio, botones o interfaz de una tienda, o marca de agua, avísale: el generador recrea lo que ve, y lo mejor es una foto del envase solo, de frente, con la etiqueta legible.

Espera la respuesta. **Con las respuestas en mano, arma directamente todo el paquete** — sin resumen previo ni pedir confirmación — y pasa al Paso final. El resumen corto del Paso final le dice al usuario cómo interpretaste el brief (y la Ficha del anuncio, si pide ver el paquete); si algo no encaja lo pide después.

Si el usuario dejó alguna pregunta sin responder, no vuelvas a pausar: asume lo más razonable, arma igual, y marca ese dato con **[AJUSTAR]** en la Ficha; como la Ficha solo se ve si pide el paquete, dilo también en la línea de decisión del resumen del Paso final, para que lo cambie. La única excepción es que falte el producto mismo — sin eso no hay nada que escribir.

---

## La estructura del guion

### Los dos roles

| | **ANFITRIONA A** (izquierda) | **ANFITRIONA B** (derecha) |
|---|---|---|
| **Rol** | Tiene el problema. **Es el espectador dentro de la escena**: cuenta, reconoce, objeta, pregunta dónde se consigue, y cierra con el endoso. | Ya lo resolvió. **Carga el contenido**: reencuadra el problema, trae el producto, contesta la objeción y da la prueba. |
| **Peso** | ~35% de las palabras | ~65% de las palabras |
| **Habla en** | Preguntas y confesiones cortas | Historias y respuestas |

La asimetría es una decisión de guion, no un accidente: si te sale un 50/50, estás escribiendo dos narradores en vez de una conversación. (Usa los géneros y pronombres que el usuario dio en el briefing; "anfitriona" aquí es solo el nombre del rol.)

A va a la **izquierda** del plano y mira hacia la derecha; B va a la **derecha** y mira hacia la izquierda. Así en el montaje quedan cara a cara. Si el usuario quiere al revés, se invierten las miradas en los dos prompts de imagen y `podcast.lados` en el manifiesto, siempre los dos juntos.

### Los 8 beats, en orden

| # | Beat | Quién | Qué hace |
|---|---|---|---|
| 1 | **Entrada en frío** | A | Arranca a mitad de frase. Sin saludo, sin "bienvenidos", sin presentación. El clip empieza como si el espectador hubiera caído dentro de una charla que ya venía. |
| 2 | **El problema, situado** | A | Primera persona, vivido, con lugar y circunstancia. Hecho con las palabras exactas del cliente real. |
| 3 | **Reconocimiento** | B | La interrupción que hace que el espectador se sienta visto. No es B validando a A: es el espectador viendo que su problema es compartido. |
| 4 | **La revelación / reencuadre** | B | B no recomienda todavía: **cuenta qué le pasó**. Cambia el marco del problema. Narración, no oferta. |
| 5 | **El producto entra como recomendación** | B | Por nombre, de pasada, como se lo dirías a una amiga. Con un detalle de uso, no con beneficios. |
| 6 | **La objeción** | A → B | A hace la pregunta escéptica que el espectador está pensando. B la contesta corto, con un hecho. |
| 7 | **La prueba concreta** | B | **Un solo dato**, real, de dueña: cantidad, duración, tiempo de entrega, un detalle que solo sabe quien lo usó. Dicho como detalle sin importancia. |
| 8 | **CTA indirecto (3 movimientos)** | A → B → A | Ver "La ley del CTA indirecto". |

Entre el 7 y el 8 suele ir bien una **línea de cierre temático** de B: la frase que resume la transformación, sin nombrar el producto. Si el guion queda corto de palabras, ese es el lugar para ganarlas.

Los beats no son turnos rígidos: A puede decir los beats 1 y 2 seguidos (con un cutaway de B escuchando en medio), y B puede encadenar 4 y 5. Lo que no cambia es el **orden** y quién carga cada cosa.

**Nombre de cada beat en el manifiesto** (campo `beat` de cada línea, con estos textos exactos): `entrada en frío` · `el problema` · `reconocimiento` · `revelación` · `producto` · `objeción` (la pregunta de A y la respuesta de B, las dos) · `prueba` · `cierre` (la línea de cierre temático, si la hay) · `cta` (los tres movimientos, siempre las tres últimas líneas).

### Reglas de escritura

- **Lenguaje hablado real**, nunca lenguaje de anuncio: contracciones, muletillas ("o sea", "ay", "no me digas"), interrupciones, ecos de reconocimiento, preguntas contestadas con historias y no con datos.
- **Primera persona y pasado** ("yo era igualita", "a mí me funcionó"). Nunca segunda persona asumiendo algo del espectador ("¿tú también comes de noche?"): suena a anuncio.
- **Cada línea hace una sola cosa.** Un beneficio por línea, nunca dos. Sin adjetivos de marketing ("increíble", "revolucionario", "el mejor").
- **El producto se nombra una vez**, máximo dos. Se recomienda, no se describe.
- **Nada de saludos, presentaciones, "hoy vamos a hablar de", ni despedidas.**
- **Nada de urgencia, descuentos ni "solo por hoy"** dentro del diálogo. Eso va en el copy del post.
- **Producto digital o servicio**: mismos 8 beats. El "detalle de uso" del beat 5 se convierte en cómo lo usó ("hice el módulo 2 un domingo y el lunes ya lo apliqué"); la prueba del beat 7, en un número o un momento concreto ("son doce clases, las hice en dos semanas").
- **Dosis, horario y modo de uso**: si el anuncio los dice, salen de lo que dio el usuario, de la etiqueta o de la página del producto; nunca se inventan.

---

## La ley del CTA indirecto

Nadie le da una orden al espectador. El CTA se construye en **tres movimientos** repartidos entre los dos hosts, siempre en este orden:

| Movimiento | Quién | Qué hace | Por qué funciona |
|---|---|---|---|
| **1. La pregunta** | A | Pregunta dónde o cómo se consigue. *"¿Y dónde lo pides?"*, *"¿Y cómo entro a eso?"*, *"¿Y eso lo venden acá?"* | El espectador no recibe una orden: ve a alguien **pedir la información en su nombre**. |
| **2. La respuesta logística** | B | Dice el canal de pasada, sin urgencia, **hablándole a A, no a cámara**. *"En su página. Lo pides y te llega a la casa."*, *"Está en el perfil de ellos, ahí te sale todo."*, *"Les escribes por WhatsApp y te lo mandan."* | Es información, no instrucción. Suena a lo que le dirías a una amiga. |
| **3. El endoso** | A | La última línea del anuncio muestra a A **decidiendo actuar**, nunca ordenando. *"Se lo voy a mandar a mi hermana ahorita mismo."*, *"Yo lo pido hoy, en serio."*, *"Esto se lo paso a todo el grupo."* | El espectador copia una conducta que vio, en vez de obedecer una instrucción que le dieron. |

El movimiento 3 es el que vende: nadie le dijo al espectador que compre, pero vio a una persona convencida moverse. Vale para producto físico, digital, servicio, comunidad o app — cambia el canal del movimiento 2, la lógica es la misma.

**Lo que rompe el formato**: "haz clic en el link de abajo", "corre que se acaba", mirar a cámara, decir el precio, nombrar un código de descuento. Si el usuario insiste en un CTA directo, explícale en dos líneas por qué rompe la ilusión y ofrécele ponerlo en captions y en el copy del post, donde sí va.

---

## Voz y reacciones

### La descripción de voz (6 atributos, siempre los 6)

Cada host lleva una descripción de voz con estos atributos, y se copia **idéntica** en todas sus generaciones:

1. **Acento** — "neutral Latin American Spanish accent", "soft Mexican accent", etc. Según el mercado.
2. **Velocidad** — "normal speed", "slightly slower", "quick, animated". A y B deben diferenciarse: una más rápida, la otra más pausada.
3. **Micrófono** — "close podcast mic".
4. **Eco / reverberación** — "with little echo and reverberation".
5. **Cambio de volumen al alejarse** — "As her mouth moves away from the microphone, the audio changes in volume." Este es el detalle que hace que suene grabado en un cuarto real. No se omite.
6. **Intención** — cómo dice las cosas: "confessional and self-deprecating", "warm and confident, like someone who's been through it".

Dale a B un registro **un punto más grave y más pausado** que a A: refuerza el rol de quien ya resolvió el problema, y ayuda a que el oído las distinga en el montaje.

### Las reacciones

Cada host lleva **una generación de 8 segundos con 3 reacciones encadenadas, sin palabras**: gestos con los labios cerrados, cada uno con su sonido no verbal (una risa por la nariz, un "hmm", un suspiro, un soplido de sorpresa). Vale cualquier gesto y cualquier sonido de reacción; lo que nunca va es una palabra o un monosílabo, en ningún idioma ("sí", "ajá", "yes", "so", "yeah"): el modelo los mete si el prompt no lo cierra, y en el montaje se oyen. El motor corta cada reacción donde de verdad pasa en su clip y la pone como cutaway mientras habla el otro, **con su propio sonido, un poco más bajo que la voz** (6 dB por debajo), justo después de la frase que el Guion marca para ella. Un clip de reacciones da tres cutaways por el precio de uno.

Escribe las reacciones **en función de lo que ese host está escuchando** en el guion: si A cuenta el problema, B niega despacio con una sonrisa, como quien ya pasó por eso; si B revela el reencuadre, A entrecierra los ojos, sacando cuentas, con un murmullo corto. Instrucciones simples, en inglés, cada una con su gesto y su sonido y con los labios cerrados: `she shakes her head slowly with a closed-lip smile and a soft sigh through her nose`, `she narrows her eyes and lifts her chin a little, as if doing the math, with a short closed-mouth hum`, `she leans back in her chair and lets out a slow, impressed breath through her nose, lips sealed`. Son ejemplos de la forma (gesto + sonido con los labios cerrados): los gestos de cada anuncio salen de lo que ese host escucha. Las reacciones sobreactuadas se ven de IA.

**Las tres reacciones de un host son gestos distintos entre sí**: nunca tres que terminan asintiendo, porque en el montaje dos cutaways iguales se notan. Y **cada una lleva su sonido**: además de que suena en el cutaway, es lo que el motor busca en el clip para saber en qué segundo pasa cada reacción y cortarla ahí.

Cada reacción tiene su número (1, 2, 3), en el orden en que pasa en el clip, y ese número es el que usa el Guion al marcar el cutaway. Una reacción puede usarse en más de una línea; las que no se usan quedan de repuesto.

### Dónde va cada cutaway

Un cutaway es el otro host reaccionando, encima de la imagen de quien habla, durante 1,4 s; el audio de quien habla sigue por debajo. Bien puesto, hace que la conversación se sienta escuchada; mal puesto, interrumpe. Por eso cada uno se marca **con la frase que lo provoca** (`tras` en el manifiesto) y sigue estas reglas:

- **Justo después de la frase que lo provoca**: una confesión, un dato fuerte, un chiste, el nombre del problema. La frase va textual, letra por letra dentro de esa línea, y el motor pone el cutaway al terminar de decirla.
- **Nunca al comienzo de un turno.** Un turno son las líneas seguidas de un mismo host. Quien empieza a hablar tiene que verse: el motor no pone un cutaway en los primeros 2 s del turno. Así que la frase nunca es lo primero que dice un host al tomar la palabra; termina, como pronto, unas seis palabras después de que empezó su turno.
- **Quien habla vuelve a cuadro antes de terminar su turno** y dice su remate en cámara. Después de la frase, a ese turno le tienen que quedar al menos unas cinco palabras (el cutaway dura 1,4 s y quien habla vuelve 0,3 s antes del final). Si no queda tiempo, el motor lo acorta hasta 0,8 s o lo quita, y lo avisa.
- **Nunca encima de un B-roll**: ni en una línea con B-roll, ni con su 1,4 s cayendo sobre el B-roll de la línea siguiente del mismo turno (si esa línea lleva B-roll, la frase no va al final de la suya).
- Puede ir aunque el que reacciona sea el siguiente en hablar: la regla de que quien habla vuelve a cuadro antes de terminar su turno ya evita que se pisen.
- Un cutaway que cae justo donde un mismo host pasa de una generación a otra tapa ese corte: es un buen lugar para uno.

Por eso los cutaways caen en turnos largos: dos o tres líneas seguidas de un mismo host, o una línea larga. Una línea corta suelta (una pregunta, el reconocimiento, el endoso) se ve en cámara. La cantidad no es fija (en un anuncio normal, de tres a cinco): lo que importa es que no le quite la cara a quien está hablando.

---

## La aritmética (obligatoria)

El copy no es libre: está encajado dentro de las restricciones del modelo de video, y de ahí salen números duros.

**Las tres restricciones del modelo**:
1. Una imagen de primer cuadro por generación → un solo host por clip.
2. Duración: se pide **4, 6, 8 o 10 segundos**, y **10 es el techo**. Un clip con tiempo de sobra sale rellenado con aire muerto (eso el montaje lo recorta); uno con palabras de más sale apurado (eso no se arregla).
3. Cada generación sortea una voz nueva → la voz solo es consistente **dentro** de una generación.

**La fórmula**: segundos ≈ palabras ÷ 3, más ~0,7 s por cada pausa entre líneas (una pausa menos que líneas tiene el bloque). El resultado se redondea **hacia arriba** a 4, 6, 8 o 10: eso es lo que se pide y lo que va en `duracion`. Si pasa de 10 s (por ejemplo, 26 palabras en tres líneas: 8,7 + 1,4 = 10,1 s), el bloque se parte en dos: no hay nada por encima de 10 a lo que redondear. Pero la velocidad real de habla **varía entre generaciones** (rango medido en español: 2,6 a 3,7 palabras por segundo), así que cada bloque se dimensiona para entrar con aire: por eso la guía tiene techo.

| Se pide | Palabras del bloque (guía) | Líneas | Qué pasa fuera de la guía |
|---|---|---|---|
| **10 s** | 20–26 | 2 o 3 | Con más de 26, el modelo apura para que entre. Con menos de 20, sobra aire (se pide 8). |
| **8 s** | 16–21 | 2 o 3 | Con más de 21, se pide 10 o se parte. |
| **6 s** | 12–15 | 2 | Con más de 15, se pide 8. |
| **4 s** | 8–10 (rara vez) | 2 | Dos líneas muy cortas. Casi nunca hace falta. |

**Reglas que salen de ahí**:
- **Guion total: 75 a 135 palabras** (25 a 45 segundos hablados). Un anuncio podcast completo es más corto que un párrafo de landing. Cada turno: 4 a 16 palabras.
- **Cada bloque de generación: entre 2 y 3 líneas y dentro de la guía de su duración.** Ideal: bloques de 10 s con 22–26 palabras.
- **Agrupa todas las líneas de un host en un bloque; cuando se pase de 26 palabras (o de 3 líneas), pártelo en dos o tres.** Nunca menos de dos líneas por bloque. Parte donde haya un cambio de beat (por ejemplo: A parte 1 = entrada + problema; A parte 2 = objeción + CTA).
- **Escribe el conteo real de palabras y la duración pedida en la etiqueta de cada bloque.**
- Un guion normal de dos hosts termina en **4 a 6 generaciones de diálogo + 2 de reacciones** (y 2 a 4 B-roll). Eso, contra 12 a 17 clips sueltos si se generara línea por línea, cada uno con voz nueva.

**Sobre los cortes**: el modelo no trunca a mitad del guion — si le queda justo, **acelera** para que entre. Con bloques dimensionados así no debería pasar. Si aun así una toma sale apurada, la salida es volver a tirar ese clip, no reescribir la línea. Lo único que ocurre a veces es que se coma el último fonema de la última línea; en la revisión del Paso final se decide si se regenera.

---

## Formato de entrega

Con el briefing respondido, arma **todo de un tiro** el paquete con estos bloques, en este orden y con estos nombres (nunca "Sección A/B"): Ficha del anuncio · Mapa de hablantes · Imágenes de los hosts · Guion · Bloques de generación · B-roll · Mapa de montaje · Notas de edición · Chequeo. Después va el **Manifiesto de producción** (Sección G), que se guarda en su archivo. **El paquete no se muestra en el chat al terminar**: ahí va solo el resumen corto y la pregunta del Paso final. Esta es la estructura con la que se entrega en el chat si el usuario elige C o pide verlo; el manifiesto, nunca.

### Ficha del anuncio

Tabla con: Producto · Público · Dolor real · Ángulo (el reencuadre en una frase) · Objeción a desactivar · Prueba concreta · Dónde se consigue · Tipo de CTA (siempre "Indirecto: pregunta → respuesta logística → endoso") · Hosts (A y B: género, edad, lado) · Modo de B-roll (pantalla dividida o esquina) · Duración (palabras, segundos hablados estimados, unidades de montaje) · Generaciones (N de diálogo + 2 de reacciones + M B-roll).

### Mapa de hablantes

Tabla con los dos hosts: rol narrativo, número de líneas, palabras, generaciones (con la duración pedida de cada una). Debajo, la **descripción de voz de cada host en español** (los 6 atributos), y el aviso de que la de cada uno va idéntica en todas sus generaciones.

### Imágenes de los hosts (siempre)

Dos prompts de imagen en español, completos, cada uno en su bloque. Las personas salen del briefing: la edad y el género que le dan autoridad al nicho (un producto para mujeres de 30–45 → dos mujeres de esa edad; uno para hombres → hombres), y el que va a la izquierda del plano es A. Encuadre de podcast: del pecho hacia arriba, un micrófono de podcast grande en brazo articulado delante, y **mirándose entre ellos, nunca a la cámara**: **A mira hacia el lado derecho de la imagen y B hacia el lado izquierdo**, así en el montaje quedan cara a cara. El lugar **no es un estudio de podcast**: es un espacio natural (la sala de una casa, un comedor, una oficina con luz cálida). **A es el host (la de la izquierda, la que tiene el problema) y B el guest (la de la derecha, la que ya lo resolvió).** B tiene que verse como otra persona: **otra cara, otro pelo y ropa de otro color y otro tipo** — si las dos salen de blanco parecen la misma. Para que la cara no se parezca, el prompt de B nombra **rasgos concretos que cambian**: forma de la cara (más redonda / más alargada), tono de piel un punto distinto, cejas, labios o nariz distintos, y peinado de otro tipo (recogido si A lo lleva suelto, corto si A lo lleva largo). **La edad se mantiene parecida**: unos pocos años de diferencia como mucho (34 y 38, no 25 y 55) — las dos personas tienen que ser del mismo mundo y del mismo nicho. Decir solo "otra mujer" no alcanza: el modelo repite la cara de la referencia. Y el segundo prompt usa la imagen del primero como referencia: **mismo ambiente, misma luz, mismo micrófono, pero los adornos del fondo cambian de posición** — mismo lugar visto desde otro punto, para que no parezca la misma foto con otra cara.

Tres cosas del encuadre que no se negocian, en las dos hojas, porque cada hoja es el primer cuadro de todas las generaciones de ese host:

- **Los dos hombros y los brazos quedan dentro del cuadro, con aire a los dos lados del cuerpo**: ningún brazo toca el borde de la imagen. En modo esquina el host se recorta sin fondo, y un brazo cortado por el borde queda como una línea recta.
- **El micrófono queda un poco más abajo que la boca y hacia el lado al que mira**, sin taparle la boca ni la barbilla: el modelo de video lee los labios para hablar, y en pantalla dividida se ve justo esa zona (la cabeza arriba y el micrófono abajo).
- **Los adornos del fondo no tienen letras**: una planta, un cuadro, una cortina, jarrones de cerámica, una canasta tejida, una lámpara. Nunca libros (sus lomos), teclados, pantallas, revistas ni cajas con etiquetas: el generador les inventa títulos legibles, y la hoja de un host se ve durante todo el anuncio.

**`### 🖼️ HOST A`**

```
Foto realista de [una mujer / un hombre] de [edad], [rasgos y origen según el
público], sentada en un podcast, vista desde el pecho hacia arriba, un poco
descentrada. Los dos hombros y los brazos quedan dentro del cuadro, con aire a
los dos lados del cuerpo: ningún brazo toca el borde de la imagen. Delante hay
un micrófono de podcast negro, de los grandes, montado en un brazo articulado
que entra por un lado de la imagen. El micrófono queda un poco más abajo que
la boca y hacia el lado al que mira, sin taparle la boca ni la barbilla. Está
en medio de una conversación: mira hacia el lado derecho de la imagen, a la
persona con la que habla, que no se ve. Nunca mira a la cámara. Expresión
natural, escuchando o a punto de hablar. [Pelo, ropa descrita con su desgaste,
un accesorio si aplica.] Cara real: piel con poros, tono desparejo, sin
maquillaje pesado, sin retoque; proporciones de persona común, no de modelo.
El lugar no es un estudio: es [la sala de una casa / un comedor / una oficina],
con [pared de color X], luz cálida de [una lámpara / una ventana], [dos o tres
adornos sin letras: una planta, un cuadro, una cortina] y fondo un poco
desenfocado, como grabado con una cámara real. Sin texto ni logos. Aspect 9:16.
```

**`### 🖼️ HOST B · adjunta: la imagen del host A`**

```
Usa la imagen adjunta como referencia del lugar, la luz y el encuadre. Mantén
la misma [sala / comedor / oficina], la misma pared de color [X], la misma luz
cálida y el mismo tipo de micrófono de podcast en su brazo articulado. Cambia
a la persona: ahora es [una mujer / un hombre] de [edad parecida a la de A,
pocos años de diferencia], [rasgos concretos distintos a los de A: forma de la cara,
tono de piel, cejas, labios o nariz], [peinado de otro tipo que el de A], con ropa de otro color y de otro tipo que
la de A: [si A lleva algo claro, B lleva algo oscuro o de color; si A lleva
blusa, B lleva suéter, chaqueta o camiseta], [accesorio distinto o sin
accesorio]. Está sentada frente al
mismo micrófono, que queda un poco más abajo que la boca y hacia el lado al
que mira, sin taparle la boca ni la barbilla, vista desde el pecho hacia
arriba, un poco descentrada, con el mismo encuadre: los dos hombros y los
brazos dentro del cuadro, con aire a los dos lados del cuerpo, sin que ningún
brazo toque el borde de la imagen. Mira hacia el lado izquierdo de la imagen,
a la persona con la que habla, que no se ve. Nunca mira a la cámara. Cara
real: piel con poros, tono desparejo, sin retoque, proporciones de persona
común. Cambia la posición de los adornos del fondo, todos sin letras: [la
planta ahora queda del otro lado, se ven X en vez de Y, el cuadro ya no está
en cuadro]. Es el mismo ambiente, pero desde otro lugar. Sin texto ni logos.
Aspect 9:16.
```

Al final, una línea: *"El motor genera primero al host A y, con esa imagen adjunta como referencia, al host B. Esas dos imágenes son el primer cuadro de todas las generaciones de cada uno; antes de pagar los clips, las revisamos."*

### Guion, en orden de conversación

El guion como lo verá el espectador, con:
- Una etiqueta de beat en negrita con el tiempo acumulado estimado (con la fórmula de "La aritmética"; el tiempo real lo mide el motor): **[0:12 · BEAT 4 — LA REVELACIÓN]**
- **Cada línea con su número de orden y el rol en negrita**: **3 · B —** "…". El número de orden es único en todo el guion (1, 2, 3… hasta la última línea, sin huecos) y es el que usan los bloques de generación, el B-roll, el mapa de montaje y el manifiesto para nombrar esa línea.
- Los cutaways marcados entre líneas, justo **debajo de la línea que contiene la frase que los provoca**, con esa frase textual, el host que reacciona y el número de su reacción: `> 🎬 Cutaway tras "[frase textual de esa línea]": B [su reacción, en pocas palabras] (reacción 1 de B).` Un cutaway siempre muestra al host que **no** está hablando en esa línea, y sigue las reglas de "Dónde va cada cutaway": nunca en la primera frase de un turno, con al menos unas cinco palabras del mismo turno después de la frase, y lejos de un B-roll.
- Las líneas con B-roll marcadas con 🎥 delante de la línea, y debajo de ella la frase ancla textual sobre la que entra: `> 🎥 B-roll 1 sobre "[frase textual de esa línea]": [qué se ve, en pocas palabras].` Solo entre la revelación (beat 4) y antes del CTA (beat 8), 2 a 4 en total, y **nunca en una línea que ya tiene cutaway**.

### Bloques de generación

Un bloque de código por generación, **todos completos**, cada uno con su etiqueta: `### 🎙️ GENERACIÓN 3 — Anfitriona B, parte 1 · pedir 10 s · 24 palabras · líneas 4, 5 y 7`. La etiqueta dice **qué líneas del Guion contiene** (por su número de orden), **cuántas palabras tiene** y **cuántos segundos se piden** (4, 6, 8 o 10, redondeando hacia arriba la fórmula). Primero los bloques de A (todas sus partes), luego los de B, luego las dos generaciones de reacciones (A y después B). Ese orden es el número de toma del manifiesto. Encima del primer bloque, una sola línea: *"Cada generación se pide con la imagen de ese host como primer cuadro, sin adjuntar nada más."*

**Plantilla de bloque de diálogo** (sustituye los corchetes; She/her o He/his según el host; las líneas van en el idioma del anuncio; **no agregues nada después de la línea Audio**):

```
Podcast-style video. Static camera, medium close-up framing locked to the start
frame throughout. She speaks directly to someone off-camera, delivering multiple
lines with natural pauses between them as if listening to responses.

No captions. No background music. No camera movement or angle changes.

She says each line exactly as written, only once, without repeating, adding or
changing any word, and without "um", "uh" or "eh" that are not in the script.
After her last line she says nothing else: she stays silent, listening, until
the clip ends.

SCRIPT:

Línea 1: "[línea completa, textual]"
Delivery: [emoción, gesto, expresión — en inglés, una línea]

Línea 2: "[línea completa, textual]"
Delivery: [emoción, gesto, expresión]

Línea 3: "[línea completa, textual]"
Delivery: [emoción, gesto, expresión]

Audio: she speaks in a [acento] accent at [velocidad], [intención]. The voice
sounds like it's coming from a close podcast mic with little echo and
reverberation. As her mouth moves away from the microphone, the audio changes
in volume. Soft room tone of a small podcast studio, close-mic'd podcast sound.
```

Las reglas que hacen que funcione: etiquetas simples ("Línea 1 / Delivery") en vez de prosa cinematográfica; **la línea completa primero y la nota de actuación debajo, nunca mezcladas**; cámara estática con encuadre bloqueado al primer cuadro (describir cortes o movimientos hace que el modelo cambie de ángulo a mitad del clip); y la frase *"natural pauses between them as if listening to responses"* no se toca — es la que espacia las líneas para que el motor pueda cortar entre ellas. El párrafo que empieza con *"She says each line exactly as written, only once"* va fijo en todos los bloques de diálogo (con He/his si es un hombre): el modelo a veces repite el final de una línea, agrega una muletilla o cambia una palabra, y una generación así se regenera. Un bloque con 2 líneas lleva solo "Línea 1" y "Línea 2". "Línea 1, 2, 3" numera dentro del bloque; la etiqueta de arriba dice a qué números de orden del Guion corresponden, en ese mismo orden. **Cada línea va letra por letra igual que en el Guion**: el motor alinea la transcripción contra ese texto.

**Si la marca, la tienda o la app puede pronunciarse mal** (un nombre en otro idioma, una palabra inventada, dos palabras pegadas), la nota Delivery de la línea donde se dice cuenta cómo suena, **sin cambiar la línea**: `Delivery: casual, just answering her; she says the brand name as "[cómo suena]", with the stress on [la sílaba fuerte]`. La línea sigue escrita como en el Guion, porque contra ese texto se alinea la transcripción.

**Plantilla de bloque de reacciones** (`### 🎙️ GENERACIÓN 5 — Reacciones de A · pedir 8 s`):

```
Podcast-style video. Static camera, medium close-up framing locked to the start
frame throughout. She is listening, not speaking. Her mouth stays closed the
entire clip. No dialogue at any point.

No captions. No background music. No camera movement or angle changes.

REACTIONS, in this order, with a clear pause between each one:

Reacción 1: [gesto + su sonido no verbal, con los labios cerrados, en inglés]
Reacción 2: [otro gesto distinto + su sonido, con los labios cerrados]
Reacción 3: [otro gesto distinto + su sonido, con los labios cerrados]

Audio: only soft nonverbal sounds made with the lips sealed ([los sonidos de
sus tres reacciones: a nasal laugh, a hum, a sigh…]) and the room tone of a
small podcast studio. No words in any language, no music.
```

Cada reacción dice su gesto y su sonido, con los labios cerrados, por ejemplo: `she shakes her head slowly with a closed-lip smile and a soft sigh through her nose, as if she has been there too` · `she narrows her eyes and lifts her chin a little, as if doing the math, with a short closed-mouth hum` · `she leans back in her chair and lets out a slow, impressed breath through her nose, lips sealed`. Tres gestos distintos (no tres que terminan asintiendo), cada uno con un sonido que se oiga: el motor lo busca para saber dónde pasa cada reacción. La línea Audio nombra esos mismos sonidos entre paréntesis y termina, siempre, con *"No words in any language, no music."*: es la que le cierra la puerta a un "yes" o un "sí" suelto.

Debajo de cada bloque de reacciones, fuera del código, las tres reacciones en español con su número (son las que nombra el Guion en los cutaways y las que van al manifiesto): *Reacción 1: niega despacio con una sonrisa de labios cerrados y un suspiro por la nariz · Reacción 2: entrecierra los ojos y levanta un poco la barbilla, sacando cuentas, con un murmullo corto · Reacción 3: se echa hacia atrás y suelta el aire despacio por la nariz, impresionada.*

### B-roll

Un B-roll por cada línea marcada 🎥 en el Guion: **2 a 4**, todos entre la revelación (beat 4) y antes del CTA (beat 8). Cada uno es un video generado con IA que se ve **encima** del host mientras sigue hablando (el audio de la generación no se corta), en el modo que eligió el usuario: pantalla dividida (el B-roll arriba, que se funde con un degradado sobre el host de abajo) o esquina (el B-roll a pantalla completa y el host que habla recortado, sin fondo, en la esquina inferior de su lado). Entra con la frase ancla y dura hasta que termina esa línea (1,5 a 5 s en pantalla).

Qué se muestra: lo que dice la frase, de forma literal y realista. El producto cuando se nombra o se da la prueba (el frasco sobre la mesa, una unidad lista en la palma junto al envase cerrado, el paquete llegando a la puerta), el lugar o la situación cuando B cuenta su historia (la alacena de noche, la cocina desordenada). Realista por defecto, como una foto; si la frase pide otra cosa (una animación médica de lo que pasa en el cuerpo), se pide eso. **Nunca aparecen los hosts** (ya están en pantalla), nadie mira a cámara y nadie habla. Y nunca objetos que invitan a texto inventado: lomos de libros, teclados, pantallas con texto, agendas o papeles escritos, cajas con etiquetas; el generador les inventa letras.

**Cómo se compone, según el modo.** El motor no muestra el B-roll entero, así que lo importante (lo que ilustra la frase: el producto entero con su etiqueta, la parte del cuerpo, la acción) se compone donde se va a ver:

- **Pantalla dividida**: el B-roll ocupa un poco más de la mitad de arriba de la pantalla, recortado al centro, y su parte de abajo se funde con un degradado sobre el host. De la imagen se ve más o menos la franja del medio. Todo lo que ilustra la frase **cabe en la franja del medio de la imagen, con aire alrededor; arriba y abajo solo queda fondo** (la pared, la mesa, el fondo liso). En el video, **cámara fija** (un acercamiento saca al sujeto de la franja).
- **Esquina**: el B-roll va a pantalla completa y el host que habla en esa línea ocupa, recortado, la esquina de abajo de su lado (un 62 % del ancho y casi la mitad del alto). Lo importante va **en el centro, en la mitad de arriba o del lado contrario, lejos de la esquina de abajo del lado de ese host** (A a la izquierda y B a la derecha, salvo que `podcast.lados` diga otra cosa); esa esquina es solo fondo.

**Con el producto**, para cualquier producto:

- **Cerrado, tal como viene**, si la foto lo muestra cerrado: nunca abriéndose, destapado ni con la tapa en la mano (el generador inventa la boca del envase y le cambia la forma). Si la frase habla de tomarlo o usarlo, se muestra una unidad ya lista (las cápsulas en la palma, una porción en una cucharita, una muestra) junto al envase cerrado.
- **Quieto**: nunca deslizándose ni arrastrado por la mesa (el video dobla y deforma la etiqueta). Si una mano lo trae o lo pasa, la mano lo suelta y se retira, y el producto queda quieto.
- **La mano nunca entre la cámara y la etiqueta.** La etiqueta de frente o hacia arriba, iluminada.
- **Luz suave y difusa**, sin contraluz y sin reflejos fuertes en un envase brillante.
- **Sin colores inventados**: el color del producto, de su contenido y de sus unidades sale de la foto o del brief; si no se sabe, no se nombra.
- **Dos B-roll de producto se ven distintos entre sí**: otro lugar y otro ángulo (uno de frente sobre una mesa, otro cenital en otra superficie).
- **Palabras neutras** en los prompts: "mesa", "encimera", "superficie"; nada de palabras de un solo país.

Por cada B-roll, su etiqueta con dónde va, y dos prompts completos en español, cada uno en su propio bloque de código, con la etiqueta `**Imagen:**` / `**Video:**` **fuera** del bloque:

~~~markdown
### 🎥 B-ROLL 1 — línea 5 (B · Generación 3) · sobre "[frase textual de la línea 5]" · 5 s

**Imagen:** · adjunta: la foto del producto   ← solo si el producto aparece; si no, "sin adjuntar nada"

```
Foto realista vertical 9:16, como tomada con una cámara real, de [lo que dice la frase, en concreto]. [Encuadre: primer plano / plano medio / cenital, con aire alrededor]. [Pantalla dividida: "[Todo lo que ilustra la frase, entero] cabe en la franja del medio de la imagen; arriba y abajo solo queda [el fondo]." / Esquina: "[El sujeto] queda [en el centro / en la mitad de arriba / hacia la derecha o la izquierda], lejos de la esquina de abajo a la [izquierda / derecha]; esa esquina es solo [el fondo]."]. [De dónde viene la luz: suave y difusa; si hay producto, le da de frente y la etiqueta queda iluminada, sin contraluz y sin reflejos fuertes]. Sobre [la superficie] solo hay: [lista]; no hay nada más. [Si hay producto: El producto es exactamente el de la imagen adjunta: misma forma, mismos colores, mismas proporciones, misma etiqueta legible; solo hay uno.] [Si hay una persona: de espaldas, de perfil o solo las manos, nunca entre la cámara y la etiqueta; no mira a cámara.] Sin texto sobreimpreso ni logos agregados. Un solo instante, sin collage.
```

**Video:** · Kling, 5 segundos, sin sonido

```
Duración: 5s. Video vertical 9:16 a partir de la imagen. [Pantalla dividida: Cámara fija. / Esquina: Cámara fija, o un solo movimiento suave que no lleve al sujeto hacia la esquina del host]. [La acción mínima que pide la frase: la mano suelta el frasco y se retira despacio fuera de la imagen; la puerta se abre y entra el paquete…]. La luz no cambia. Nadie habla: no hay voces ni bocas que se muevan. [Si hay producto: El producto no se desliza ni se mueve de su lugar; la etiqueta se mantiene idéntica y legible todo el clip; solo hay un [frasco / paquete / envase].] Sin cortes ni cambios de plano, sin texto, sin subtítulos, sin logos agregados.
```
~~~

En el prompt va solo la frase del modo que eligió el usuario, ya escrita (no las dos ni los corchetes). En esquina, el lado sale del host que habla en esa línea.

Reglas del B-roll:

- **La frase ancla es textual**: va letra por letra dentro de esa línea del Guion. El motor la busca en la transcripción para saber en qué segundo entra.
- **La foto del producto se adjunta siempre que el producto aparezca**, aunque sea de fondo, y en el manifiesto ese B-roll lleva `"referencias": ["producto"]`. Sin producto a la vista, `[]`. Sin foto del producto (servicio, digital), ningún B-roll lo muestra: se muestra el servicio en acción, el resultado en la vida de alguien, o a alguien usando el celular de espaldas o de perfil, sin que se vea la pantalla.
- **Compuesto para su modo**: en pantalla dividida, en la franja del medio y con cámara fija; en esquina, lejos de la esquina de abajo del host que habla en esa línea.
- **Siempre 5 segundos** y mudo: el motor lo pide así y lo recorta o lo acelera un poco para que encaje en su ventana.
- **Un solo instante en el prompt de imagen** (es una foto, no una secuencia) y **un solo movimiento en el de video**.
- **Nunca en una línea con cutaway, nunca en el CTA, nunca antes de la revelación.** El validador rechaza lo primero y avisa de lo demás.
- Un B-roll que se cuela en el CTA rompe la regla del estilo: el CTA siempre con los hosts a pantalla completa.

### Mapa de montaje

Tabla con una fila por unidad de montaje: `# · Tiempo · De dónde sale (Gen N · Línea N, o Gen N · Reacción N en negrita) · Qué va`. En "Qué va": quién habla a pantalla completa; si hay cutaway, de qué generación y qué reacción, después de qué frase (`tras`) y con su sonido; si hay 🎥, qué B-roll y en qué modo (pantalla dividida: el B-roll arriba con un degradado sobre el host, y el host abajo con la cabeza arriba; esquina: el B-roll a pantalla completa y el host recortado, sin fondo, en la esquina inferior de su lado). Debajo, tres notas: que las líneas de un mismo bloque se reparten por toda la línea de tiempo (es lo que compra el batching), que se corta siempre en la pausa y nunca dentro de una palabra, y qué reacciones quedan de repuesto.

Este mapa es exactamente lo que el manifiesto codifica (qué generación contiene cada línea, qué cutaway va en cuál y tras qué frase, qué B-roll sobre qué frase) y lo que usa quien monta a mano en la opción B del Paso final.

**Cómo arma el motor la conversación con este mapa** (para que el usuario sepa qué va a pasar):

1. Transcribe cada generación hablada y ubica el inicio y el fin de cada línea dentro del clip (`npm run lineas`); transcribe también los dos clips de reacciones, con sus sonidos (risas, "hmm"), para comprobar que no dicen ninguna palabra y saber en qué segundo pasa cada reacción. Corta cada clip en **segmentos, uno por línea**, siempre en las pausas entre líneas y nunca dentro de una (del fin de la línea anterior más la mitad de la pausa, hasta el fin de la línea más un poco de aire). Lo que el modelo diga después de la última palabra del guion no entra.
2. Pone los segmentos **en el orden del Guion** (1, 2, 3…), aunque salgan de generaciones distintas. Cada uno se oye a su volumen, sin música debajo.
3. En cada línea con cutaway, pone encima la reacción del otro host, **cortada donde pasa en su clip** (busca el sonido de esa reacción; si no lo encuentra, toma el tercio del clip que le toca y lo avisa) y **con su propio sonido, 6 dB por debajo de la voz**, durante 1,4 s. Entra justo al terminar la frase `tras`, con las reglas de "Dónde va cada cutaway": nunca en los primeros 2 s del turno; quien habla vuelve a cuadro al menos 0,3 s antes de terminar su turno (si no entra, lo acorta hasta 0,8 s, y si tampoco, lo deja fuera con un aviso); nunca encima de un B-roll. Un cutaway sin `tras` (un manifiesto viejo), o con una `tras` que no está en la línea, entra al empezar su línea si esa línea va en medio del turno, o a los 2 s del inicio del turno si es la primera (nunca antes de esos 2 s), con las mismas reglas; el plan lo avisa.
4. En cada línea con B-roll, abre la ventana desde la frase ancla hasta el fin de esa línea, menos un poco de aire (entre 1,5 y 5 s; si la frase cae muy al final, la adelanta) y pone el B-roll mudo encima. **Pantalla dividida**: el B-roll ocupa el 58 % de arriba de la pantalla, recortado al centro (de la imagen se ve la franja del medio), y su parte de abajo se funde con un degradado sobre el host, que va abajo encuadrado con la cabeza arriba, de modo que se ve también su micrófono. **Esquina**: el B-roll a pantalla completa y el host que habla **recortado, sin fondo** (un 62 % del ancho y casi la mitad del alto), pegado a la esquina inferior de su lado (A izquierda, B derecha). El recorte lo hace el paso `npm run recortar` (ver el Paso final); si falta, el plan deja al host en una ventana en esa esquina y avisa que hay que correrlo. El B-roll va a 1x; si dura más que la ventana, se acelera hasta 1,6x para que se vea más de él y se corta el resto; si dura menos, la ventana se acorta a su largo.
5. Sin transiciones, sin música. Subtítulos palabra por palabra con la palabra resaltada, encima de todo. **Mientras va un B-roll, los subtítulos suben**: en pantalla dividida quedan sobre la unión entre el B-roll y el host; en esquina, por encima del host recortado. Dos versiones de salida: con subtítulos y sin subtítulos.

### Notas de edición

No son parte del guion, pero van al final de la entrega, en cinco o seis líneas:

- **Sin música de fondo.** Un clip de podcast real no la lleva; el motor no la agrega y quien monte a mano tampoco debería. Lo que se oye es la voz y el tono del cuarto.
- **B-roll** solo en las líneas marcadas 🎥, en el modo elegido (pantalla dividida o esquina) y compuesto para él: en la franja del medio en pantalla dividida, lejos de la esquina del host que habla en esquina. No cubrir más del 30–40 % del anuncio: el espectador tiene que volver a la escena del podcast lo suficiente para que la ilusión aguante. El CTA, siempre con los hosts.
- **Reacciones con su sonido**, un poco más bajo que la voz, justo después de la frase que las provoca y nunca al comienzo de un turno: quien empieza a hablar se ve, y quien habla vuelve a cuadro para decir su remate.
- **Subtítulos** estilo clip de podcast (negrita, centro-abajo, palabra por palabra): los pone el motor, y mientras va un B-roll suben a la unión entre el B-roll y el host (o por encima del host recortado, en esquina). Quien monte a mano, igual, y un título de gancho arriba, porque el clip abre en frío.
- **Recortar más feo a propósito** (solo si se monta a mano): un 9:16 limpio se lee como IA. Los clips de podcast reales van con letterbox o algo apretados; copiar ese formato sube la credibilidad de inmediato.
- **Si una toma sale apurada**, volver a tirar ese clip, no reescribir. **Si se come el último fonema**, quien monta a mano puede parcharlo con esa palabra generada en un TTS por debajo; con el motor, se decide en la revisión si se regenera.

### Chequeo

Lista de verificación con ✅, que cubra al menos:
- Un extraño no sabe que es un anuncio hasta el segundo [N] (cuando entra el producto).
- El producto entra como recomendación dentro de una historia, no como pitch.
- CTA indirecto completo: pregunta de A → respuesta logística de B → endoso final de A.
- Una voz por host; la descripción de cada uno va idéntica en todas sus generaciones.
- Los 6 atributos de voz están en todas las generaciones habladas.
- Cada generación pide 4, 6, 8 o 10 s y sus palabras están dentro de la guía de esa duración (listar: Gen 1 · 10 s · 24 palabras…). Ninguna pasa de 26 palabras.
- Cada línea del Guion está en exactamente una generación, con su mismo número de orden y su mismo texto.
- Cada bloque de diálogo lleva el párrafo fijo de "She says each line exactly as written, only once", y la marca que puede leerse mal tiene su pronunciación en el Delivery, sin cambiar la línea.
- Los dos hosts tienen los hombros y los brazos dentro del cuadro, el micrófono más abajo que la boca y un fondo sin libros, teclados ni pantallas.
- Las reacciones son sin palabras: labios cerrados, cada una con su sonido no verbal, tres gestos distintos por host y la línea Audio con "No words in any language".
- Cada cutaway marca la frase que lo provoca, textual; no cae en la primera frase de un turno, deja al menos unas cinco palabras del turno después y no pisa un B-roll.
- Hay 2 a 4 B-roll, todos entre la revelación y antes del CTA, ninguno en una línea con cutaway, cada uno con su frase ancla textual y sus dos prompts, compuesto para su modo (franja del medio en pantalla dividida; lejos de la esquina del host en esquina) y, si muestra el producto, quieto, cerrado como en la foto y con la etiqueta a la vista.
- Sin saludo, sin presentación, sin "link en bio" a cámara, sin precio, sin urgencia, sin música.
- Total de palabras y segundos dentro de 75–135 / 25–45 s.
- N generaciones para M unidades de montaje.

---

## Lo que falla → qué hacer en su lugar

| Falla | En su lugar |
|---|---|
| Una generación por línea | Queda por debajo de 4 s, se rellena con aire, y cada clip estrena voz nueva → agrupar por host (ver "La aritmética") |
| Más de 26 palabras en un bloque de 10 s | El modelo apura para que entre → partir el bloque en dos, en un cambio de beat |
| El producto aparece en las primeras líneas | Se lee como anuncio desde el segundo 1 → el producto entra en el beat 5, nunca antes del segundo 15 |
| B recomienda antes de contar su historia | Suena a vendedora → beat 4 (revelación) siempre antes del beat 5 (producto) |
| Dos beneficios en una línea | Suena a landing → una cosa por línea, y mejor si es un detalle de uso que un beneficio |
| CTA dicho a cámara o "link abajo" | Rompe la ilusión → 3 movimientos del CTA indirecto |
| A y B con el mismo peso de palabras | Dos narradores, no una conversación → 35/65 |
| Cortes o movimientos de cámara en el prompt | El modelo cambia de ángulo a mitad del clip → cámara estática + primer cuadro |
| Guion y actuación mezclados en un bloque | Lecturas turbias → pares Línea / Delivery separados |
| Cola de calidad "4K, Ultra HD…" | Pide un render pulido que después hay que disimular → nada después de la línea Audio |
| Bloque abreviado con "[misma estructura]" | El manifiesto quedaría incompleto → todos los bloques completos |
| B-roll en una línea con cutaway, en el CTA o antes de la revelación | El validador lo rechaza o avisa → moverlo a otra línea del tramo revelación→prueba |
| B-roll con una frase ancla que no está en la línea | El motor no sabe dónde ponerlo → copiar la frase textual |
| B-roll compuesto a todo el alto en pantalla dividida | Se corta justo lo que ilustra la frase → todo en la franja del medio, cámara fija |
| B-roll con lo importante en la esquina del host (modo esquina) | El host recortado lo tapa → al centro, arriba o del lado contrario |
| Producto que se desliza, se arrastra o se abre en el B-roll | El video dobla la etiqueta o inventa la boca del envase → la mano lo suelta y se retira; cerrado si la foto lo muestra cerrado |
| La mano entre la cámara y la etiqueta, o dos B-roll de producto iguales | No se lee la marca, o parece el mismo plano dos veces → la mano a un costado; otro lugar y otro ángulo |
| Libros, teclados o pantallas en el fondo de un host o en un B-roll | El generador les inventa títulos legibles, y la hoja de un host se ve todo el anuncio → adornos sin letras |
| Host con un brazo cortado por el borde de la imagen | En esquina el recorte queda con una línea recta → hombros y brazos dentro del cuadro, aire a los lados |
| Micrófono delante de la boca | El modelo pierde los labios y en pantalla dividida se tapa justo lo que se ve → más abajo que la boca, hacia el lado al que mira |
| Reacción con palabras ("yes", "so", "yeah", "sí") | Se oye en el cutaway → labios cerrados, un sonido no verbal por reacción y "No words in any language"; se transcribe y, si dice algo, se regenera |
| Tres reacciones que terminan asintiendo | Dos cutaways se ven iguales → tres gestos distintos, cada uno con su sonido |
| Cutaway al comienzo de un turno | Tapa a quien empieza a hablar → después de la frase que lo provoca; quien empieza se ve unos 2 s |
| Cutaway sin frase `tras`, o con la frase al final del turno | El motor no sabe qué lo provoca y lo pone al empezar la línea (o a los 2 s del turno), o quien habla no alcanza a volver a cuadro → frase textual, con al menos unas cinco palabras del turno después |
| Cutaway mudo, o con el sonido de otro momento (montaje a mano) | El gesto y su sonido se separan → la reacción con su propio sonido, cortada donde pasa en su clip, un poco más baja que la voz |
| Palabras repetidas, cambiadas o agregadas en una generación | No se puede cortar dentro de una línea → se regenera, nunca "suena natural" (la única que no se regenera es la que el motor marca "tolerada": se informa con su segundo) |
| Una marca que se lee como se escribe | El modelo la pronuncia mal → cómo suena, en el Delivery de esa línea, sin cambiar la línea |
| Recorte del host y render a la vez | La computadora se traba y se pierde el trabajo → un proceso pesado a la vez |
| Música de fondo en el montaje | Suena a anuncio, no a podcast → sin música |
| Regenerar un clip entero por un fonema cortado (montaje a mano) | Parchar la palabra con TTS bajo el audio original |

---

## Sección G — Manifiesto de producción (JSON)

Este paso es **aditivo y no cambia nada de lo anterior**. Todo lo del Formato de entrega se arma exactamente igual. Además, justo después del Chequeo, escribes el manifiesto. **El manifiesto es interno del sistema: nunca se muestra en el chat**, ni en el resumen ni en la opción C.

**Para qué sirve**: el manifiesto es el único punto de contacto entre esta skill y el motor de producción, que lo lee y genera las imágenes de los hosts, cada generación, el B-roll y el montaje. Mientras armas el paquete no ejecutas nada: solo describes el anuncio en JSON.

**Regla de fidelidad**: lo que va en el manifiesto es **exactamente** el paquete que armaste, copiado carácter por carácter, y desde ahí el manifiesto es la fuente de verdad: todo prompt o línea que el usuario vea (en la opción C, o cuando pida una parte) se copia de él, carácter por carácter:

- el `prompt` de `host-a` y de `host-b` = sus prompts de imagen de "Imágenes de los hosts";
- cada `prompt_video` = el bloque de código de esa generación (diálogo o reacciones);
- cada `texto` del `guion` y de `lineas` = la línea del Guion, que es la misma que va dentro de `Línea N: "…"` del bloque;
- cada `prompt_imagen` y `prompt_video` de `broll` = los dos bloques de ese B-roll; `sincroniza_con` = la frase ancla textual.

Si un prompt que el usuario vio difiere del que está en el manifiesto, el video final no es el que él revisó. Al pasarlo al JSON, los saltos de línea del prompt van como `\n`, y las comillas rectas de dentro del prompt (`Línea 1: "…"`) van escapadas (`\"`).

### G.1 — Dónde va

En su archivo, después del Chequeo, y **nunca en el chat** (ni en un bloque `json`, ni en la opción C):

```
temp/[slug-del-anuncio]/manifiesto.json
```

donde `[slug-del-anuncio]` es el nombre del producto en kebab-case más `-podcast` (por ejemplo, `kalma-spray-podcast`). En el resumen del Paso final basta media línea que diga que quedó guardado y revisado, con esa ruta.

**Si `temp/[slug-del-anuncio]/` ya existe con otro anuncio** (otro guion u otra versión del mismo producto), no la reuses: el motor se salta las imágenes y los clips que ya están en la carpeta, y metería generaciones viejas en el anuncio nuevo. Usa un slug nuevo (por ejemplo, `kalma-spray-podcast-v2`) y dile al usuario que esa carpeta ya existía y qué nombre usaste.

### G.2 — Estructura

```json
{
  "estilo": "podcast",
  "modo_audio": "dialogo_nativo",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "podcast": {
    "hosts": { "A": "host-a", "B": "host-b" },
    "lados": { "A": "izquierda", "B": "derecha" },
    "broll": { "modo": "pantalla-dividida" }
  },
  "referencias": [
    { "id": "host-a", "tipo": "personaje", "prompt": "[el prompt de imagen del HOST A, carácter por carácter]" },
    { "id": "host-b", "tipo": "personaje", "prompt": "[el prompt de imagen del HOST B, carácter por carácter]", "referencias": ["host-a"] },
    { "id": "producto", "tipo": "producto", "archivo": "producto.jpg", "nota": "conservar forma, colores y etiqueta exactos" }
  ],
  "guion": [
    { "orden": 1, "habla": "A", "texto": "[línea 1, textual]", "beat": "entrada en frío" },
    { "orden": 2, "habla": "A", "texto": "[línea 2, textual]", "beat": "el problema",
      "cutaway": { "host": "B", "reaccion": 1, "tras": "[frase textual de la línea 2 que provoca la reacción]" } },
    { "orden": 3, "habla": "B", "texto": "[línea 3, textual]", "beat": "reconocimiento" },
    { "orden": 4, "habla": "B", "texto": "[línea 4, textual]", "beat": "revelación",
      "cutaway": { "host": "A", "reaccion": 1, "tras": "[frase textual de la línea 4 que provoca la reacción]" } },
    { "orden": 5, "habla": "B", "texto": "[línea 5, textual]", "beat": "producto" },
    { "orden": 6, "habla": "A", "texto": "[línea 6, textual]", "beat": "objeción" },
    { "orden": 7, "habla": "B", "texto": "[línea 7, textual]", "beat": "objeción" },
    { "orden": 8, "habla": "B", "texto": "[línea 8, textual]", "beat": "prueba",
      "cutaway": { "host": "A", "reaccion": 2, "tras": "[frase textual de la línea 8 que provoca la reacción]" } },
    { "orden": 9, "habla": "A", "texto": "[línea 9, textual]", "beat": "cta" },
    { "orden": 10, "habla": "B", "texto": "[línea 10, textual]", "beat": "cta" },
    { "orden": 11, "habla": "A", "texto": "[línea 11, textual]", "beat": "cta" }
  ],
  "tomas": [
    { "n": 1, "tipo": "H", "habla": "A", "duracion": 10, "frame_inicial": "host-a",
      "lineas": [ { "orden": 1, "texto": "[línea 1, textual]" },
                  { "orden": 2, "texto": "[línea 2, textual]" },
                  { "orden": 6, "texto": "[línea 6, textual]" } ],
      "linea": "[línea 1, textual] [línea 2, textual] [línea 6, textual]",
      "prompt_imagen_inicial": null, "prompt_imagen_final": null,
      "prompt_video": "[GENERACIÓN 1 — Anfitriona A, parte 1, carácter por carácter]",
      "referencias": [] },
    { "n": 2, "tipo": "H", "habla": "A", "duracion": 8, "frame_inicial": "host-a",
      "lineas": [ { "orden": 9, "texto": "[línea 9, textual]" },
                  { "orden": 11, "texto": "[línea 11, textual]" } ],
      "linea": "[línea 9, textual] [línea 11, textual]",
      "prompt_imagen_inicial": null, "prompt_imagen_final": null,
      "prompt_video": "[GENERACIÓN 2 — Anfitriona A, parte 2, carácter por carácter]",
      "referencias": [] },
    { "n": 3, "tipo": "H", "habla": "B", "duracion": 10, "frame_inicial": "host-b",
      "lineas": [ { "orden": 3, "texto": "[línea 3, textual]" },
                  { "orden": 4, "texto": "[línea 4, textual]" },
                  { "orden": 5, "texto": "[línea 5, textual]" } ],
      "linea": "[línea 3, textual] [línea 4, textual] [línea 5, textual]",
      "prompt_imagen_inicial": null, "prompt_imagen_final": null,
      "prompt_video": "[GENERACIÓN 3 — Anfitriona B, parte 1, carácter por carácter]",
      "referencias": [] },
    { "n": 4, "tipo": "H", "habla": "B", "duracion": 10, "frame_inicial": "host-b",
      "lineas": [ { "orden": 7, "texto": "[línea 7, textual]" },
                  { "orden": 8, "texto": "[línea 8, textual]" },
                  { "orden": 10, "texto": "[línea 10, textual]" } ],
      "linea": "[línea 7, textual] [línea 8, textual] [línea 10, textual]",
      "prompt_imagen_inicial": null, "prompt_imagen_final": null,
      "prompt_video": "[GENERACIÓN 4 — Anfitriona B, parte 2, carácter por carácter]",
      "referencias": [] },
    { "n": 5, "tipo": "H", "habla": "A", "clase": "reacciones", "duracion": 8, "frame_inicial": "host-a",
      "reacciones": [ { "n": 1, "descripcion": "[reacción 1 de A: gesto y sonido, la misma que debajo de su bloque]" }, { "n": 2, "descripcion": "[reacción 2 de A: otro gesto y su sonido]" }, { "n": 3, "descripcion": "[reacción 3 de A: otro gesto y su sonido]" } ],
      "linea": "", "prompt_imagen_inicial": null, "prompt_imagen_final": null,
      "prompt_video": "[GENERACIÓN 5 — Reacciones de A, carácter por carácter]", "referencias": [] },
    { "n": 6, "tipo": "H", "habla": "B", "clase": "reacciones", "duracion": 8, "frame_inicial": "host-b",
      "reacciones": [ { "n": 1, "descripcion": "[reacción 1 de B: gesto y sonido, la misma que debajo de su bloque]" }, { "n": 2, "descripcion": "[reacción 2 de B: otro gesto y su sonido]" }, { "n": 3, "descripcion": "[reacción 3 de B: otro gesto y su sonido]" } ],
      "linea": "", "prompt_imagen_inicial": null, "prompt_imagen_final": null,
      "prompt_video": "[GENERACIÓN 6 — Reacciones de B, carácter por carácter]", "referencias": [] }
  ],
  "broll": [
    { "n": 1, "encima_de_toma": 3, "en_linea": 5, "sincroniza_con": "[frase textual de la línea 5]", "duracion": 5,
      "prompt_imagen": "[prompt de imagen del B-ROLL 1, carácter por carácter]",
      "prompt_video": "[prompt de video del B-ROLL 1, carácter por carácter]",
      "referencias": ["producto"] },
    { "n": 2, "encima_de_toma": 4, "en_linea": 7, "sincroniza_con": "[frase textual de la línea 7]", "duracion": 5,
      "prompt_imagen": "[prompt de imagen del B-ROLL 2, carácter por carácter]",
      "prompt_video": "[prompt de video del B-ROLL 2, carácter por carácter]",
      "referencias": ["producto"] }
  ],
  "overlays": []
}
```

### G.3 — Los campos, uno por uno

| Campo | Qué va |
|---|---|
| `estilo` | Siempre `"podcast"` |
| `modo_audio` | Siempre `"dialogo_nativo"`: los hosts hablan dentro del clip. **No hay campo `voz_en_off`** |
| `mercado` / `idioma` | Del briefing: `"LatAm"`, `"EEUU"`, `"Brasil"`, `"España"`; `"es"`, `"en"` o `"pt"` |
| `aspect_ratio` | Siempre `"9:16"` |
| `podcast.hosts` | Qué referencia es cada host: `A` → `"host-a"`, `B` → `"host-b"` |
| `podcast.lados` | `A` `"izquierda"` (mira a la derecha) y `B` `"derecha"` (mira a la izquierda). Si el usuario los invirtió, aquí también. En modo esquina, el host que habla va recortado en la esquina inferior de **su** lado, y el B-roll de esa línea deja libre esa esquina |
| `podcast.broll.modo` | `"pantalla-dividida"` (por defecto) o `"esquina"`, de la pregunta 7 del briefing |
| `referencias` | Las dos hojas de los hosts y la foto del producto. Ver G.4 |
| `guion` | La conversación completa en orden: una entrada por línea del Guion, con `orden` (1..N sin huecos), `habla` (`"A"` o `"B"`), `texto` (la línea, textual, sin las comillas) y `beat` (uno de los nueve nombres de "Los 8 beats"). Si la línea lleva cutaway, `cutaway: { "host": "A"|"B", "reaccion": 1|2|3, "tras": "…" }` con el host que **no** habla en esa línea |
| `guion[].cutaway.tras` | La frase de **esa** línea tras la cual entra la reacción, la misma del `> 🎬 Cutaway tras "…"` del Guion: textual, letra por letra dentro del `texto` (sin las comillas), y que aparezca una sola vez en la línea (el motor compara palabras: la puntuación, las tildes y las mayúsculas no la hacen distinta). El motor pone el cutaway al terminar de decirla. El validador exige que sea un trozo literal de la línea y avisa si falta. Nunca la primera frase de un turno, y con al menos unas cinco palabras del mismo turno después (ver "Dónde va cada cutaway") |
| `tomas` | Una entrada por generación, en el orden de los bloques (A, B, reacciones de A, reacciones de B). En el motor cada generación es una "toma" y su clip es `video/toma-N.mp4` |
| `tomas[].n` | El número de la generación (1, 2, 3…) |
| `tomas[].tipo` | Siempre `"H"`: hablada, con la imagen del host como primer cuadro |
| `tomas[].habla` | `"A"` o `"B"`: el host de la generación (también en la de reacciones) |
| `tomas[].duracion` | 4, 6, 8 o 10: lo que se pide, el mismo número de la etiqueta del bloque. Reacciones: 8 |
| `tomas[].frame_inicial` | `"host-a"` o `"host-b"`: la imagen de ese host se usa tal cual como primer cuadro, sin generar nada (costo 0) |
| `tomas[].lineas` | Las líneas del Guion que contiene la generación, **en el orden en que se dicen en el bloque**: `[{ "orden": 1, "texto": "…" }, …]`. Cada `orden` del `guion` aparece en exactamente una toma, con el mismo `habla` y el mismo texto |
| `tomas[].linea` | Los textos de `lineas`, en orden, unidos por un espacio. La transcripción y los subtítulos se alinean contra este campo. En la toma de reacciones, `""` |
| `tomas[].clase` | Solo en las dos tomas de reacciones: `"reacciones"` |
| `tomas[].reacciones` | Solo en esas: las tres reacciones con su `n` (1, 2, 3, en el orden del clip) y una `descripcion` corta en español (la misma que escribiste debajo del bloque), con su gesto y su sonido |
| `tomas[].prompt_imagen_inicial` y `prompt_imagen_final` | Siempre `null`: el primer cuadro es la hoja del host y no hay cuadro final |
| `tomas[].prompt_video` | El bloque de código de esa generación, carácter por carácter |
| `tomas[].referencias` | Siempre `[]`: al video no van referencias (el modelo no acepta primer cuadro y referencias a la vez); las referencias ya están en la imagen del host |
| `broll` | Un B-roll por línea 🎥: `n`, `encima_de_toma` (la toma que contiene esa línea), `en_linea` (el `orden` de la línea; tiene que estar en las `lineas` de esa toma), `sincroniza_con` (frase textual dentro de esa línea), `duracion` 5, `prompt_imagen` (con la frase de composición del modo: franja del medio, o lejos de la esquina del host que dice esa línea), `prompt_video` y `referencias` (`["producto"]` si aparece el producto, `[]` si no). Nunca `despues_de_toma` |
| `overlays` | Siempre `[]`: el texto en pantalla nunca va en los prompts |

Sin `transiciones.json`, sin música, sin `voz_en_off`.

### G.4 — Las referencias

En `referencias` van **tres entradas** (dos si no hay foto del producto):

- **El host A**: `id: "host-a"`, `tipo: "personaje"`, con `prompt` = el prompt de "🖼️ HOST A", carácter por carácter. El motor la genera primero, sin referencias.
- **El host B**: `id: "host-b"`, `tipo: "personaje"`, con `prompt` = el prompt de "🖼️ HOST B", carácter por carácter, y `"referencias": ["host-a"]`: el motor la genera después, con la imagen de A adjunta (es el "usa la imagen adjunta" del prompt).
- **El producto**, solo si el usuario dio la foto: `id: "producto"`, `tipo: "producto"`, `archivo: "producto.jpg"` (ese nombre exacto, nunca uno inventado; si `preparar-producto` lo cambia a `.png` o `.webp`, vale el suyo: ver G.5), sin `prompt`, y una `nota` corta. Sin foto (un servicio, un producto digital o un producto físico sin foto), esta entrada **no existe** y ningún B-roll la declara.

Las dos hojas de los hosts se usan **solo como primer cuadro** (`frame_inicial`) de sus generaciones; la foto del producto se usa **solo como referencia de las imágenes de B-roll** donde el producto aparece. Ninguna va al video como referencia.

### G.5 — La foto del producto (si la dio)

Si el usuario dio la foto, este comando la deja en la carpeta del anuncio (con la ruta de su foto y el slug del anuncio):

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug-del-anuncio]
```

Ese comando copia la foto a la carpeta del anuncio con el nombre correcto y la convierte si hace falta (`.heic`, una foto muy grande, con espacios en el nombre); si la deja en otro formato (`producto.png` o `producto.webp`), corrige el nombre en el manifiesto. Por eso tú siempre escribes `"producto.jpg"`. **Después de correrlo, el nombre bueno es el que dejó él**: si vuelves a tocar el manifiesto (por ejemplo, al reescribir una línea que Omni rechazó), deja ese nombre como está y nunca lo "corrijas" de vuelta a `.jpg`, o el validador dirá que la foto no existe. **Lo corres tú**, apenas escribiste el manifiesto y antes de validarlo, si sabes dónde está la foto: la ruta que te dio el usuario, o la imagen que pegó en el chat (la lees en su ruta local), tal cual. Si no lo sabes, en el resumen del Paso final pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando, y córrelo tú apenas la tengas (en C, antes de volver a validar un cambio). Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. Ningún comando va en el mensaje del Paso final.

### G.6 — Chequeo antes de entregar

Repasa esto en silencio, además del Chequeo de la entrega. Si algo falla, corrígelo: no dejes guardado un manifiesto roto.

1. ¿`estilo` es `"podcast"`, `modo_audio` es `"dialogo_nativo"`, no hay campo `voz_en_off` y **todas** las tomas son `tipo: "H"`?
2. ¿`podcast.hosts.A` y `.B` son `"host-a"` y `"host-b"`, las dos existen en `referencias` con `tipo: "personaje"` y su `prompt`, y `host-b` lleva `"referencias": ["host-a"]`? ¿`podcast.lados` y `podcast.broll.modo` están?
3. ¿`guion` tiene `orden` 1..N sin huecos, cada línea con `habla` A/B, `texto` y uno de los nueve `beat`, y las tres últimas líneas son `cta` (A, B, A)?
4. ¿Cada `orden` del `guion` está en **exactamente una** toma (en sus `lineas`), con el mismo `habla` y el mismo texto, letra por letra? ¿Ninguna toma tiene líneas de las que el guion no tiene?
5. ¿La `linea` de cada toma es exactamente los textos de sus `lineas` unidos en orden por un espacio, y cada texto aparece letra por letra dentro de su `prompt_video` (en `Línea N: "…"`, en ese mismo orden)? ¿Cada `prompt_video` de diálogo lleva el párrafo fijo de *"She says each line exactly as written, only once"* y termina en la línea Audio?
6. ¿Cada `duracion` es 4, 6, 8 o 10, igual a la etiqueta del bloque, y las palabras de la toma están dentro de la guía de esa duración (nunca más de 26)? Fuera de la guía el validador solo avisa, pero el clip sale apurado.
7. ¿Hay **una** toma `clase: "reacciones"` por host, con `duracion: 8`, `linea: ""` y tres `reacciones` numeradas 1, 2, 3 con su `descripcion`? ¿Su `prompt_video` tiene tres gestos distintos, cada uno con los labios cerrados y su sonido no verbal, y la línea Audio termina en *"No words in any language, no music."*?
8. ¿Cada `cutaway` tiene `host` distinto de `habla` de esa línea, `reaccion` 1, 2 o 3 y `tras`, un trozo literal de esa línea (letra por letra, una sola vez en ella)? ¿La frase no es lo primero que dice el host al empezar su turno (termina, como pronto, unas seis palabras después) y le quedan después al menos unas cinco palabras del mismo turno? ¿Su 1,4 s no cae sobre el B-roll de la línea siguiente del mismo turno?
9. ¿Cada toma lleva `frame_inicial` con el id de su host, `prompt_imagen_inicial` y `prompt_imagen_final` en `null` y `referencias: []`? Nada de `"heredado"`.
10. ¿Cada B-roll tiene `encima_de_toma` = la toma que contiene `en_linea`, `sincroniza_con` dentro del texto de esa línea (letra por letra), `duracion` 5, los dos prompts y `referencias` (`["producto"]` si aparece el producto)? ¿Ninguna línea tiene cutaway y B-roll a la vez? ¿Todos caen entre la revelación y antes del CTA? ¿Son 2 a 4? ¿Cada `prompt_imagen` trae la frase de composición de su modo (la franja del medio en pantalla dividida; lejos de la esquina de abajo del lado del host que dice esa línea, en esquina) y, si sale el producto, quieto, cerrado como en la foto y con la etiqueta a la vista?
11. ¿`overlays` está vacío y no hay `despues_de_toma`, `transiciones` ni música en ningún lado?
12. ¿Cada prompt es idéntico, carácter por carácter, al bloque que armaste en el Formato de entrega?
13. ¿La entrada del producto usa `"archivo": "producto.jpg"` (o el `producto.png` o `producto.webp` que dejó `preparar-producto`, si ya corrió: ese no se toca), y si no hay foto esa entrada no existe y ningún B-roll la declara? Si hay foto, ¿sabes dónde está, para correr tú el comando de G.5 antes de validar (o vas a pedírsela en una línea del resumen, sin ningún comando)?
14. ¿El JSON es válido? Comillas dobles, sin comas colgando, saltos de línea como `\n`, comillas rectas de los prompts escapadas.

---

## Paso final — Pregunta cómo quiere producirlo

Ya armaste el paquete completo (ficha, hablantes, hosts, guion, generaciones, B-roll, mapa de montaje, notas y chequeo) y guardaste el manifiesto. **El paquete no se muestra**: en el chat va solo un resumen corto y la pregunta. **Ahora, y solo ahora, pregúntale al usuario cómo quiere seguir.**

**El resumen**, de 1 a 3 líneas: el estilo, el producto, el mercado y el idioma, cuántas generaciones (de diálogo y de reacciones) y cuántos B-roll, en qué modo, y la duración aproximada; media línea con la ruta del manifiesto guardado; y, solo si la hay, **una** línea con la decisión que conviene que sepa (un dato que asumiste y marcaste [AJUSTAR], por ejemplo "en el CTA puse que se consigue en su página: cámbialo si es otro lugar"; el CTA del guion original que cambiaste por el indirecto; si el guion llegó armado, que lo repartiste entre los dos hosts y que, si pide verlo, al inicio del Guion está la nota con cómo quedó; la carpeta que ya existía y el slug nuevo que usaste). Nada más: ni el guion, ni los prompts, ni el manifiesto.

No lo decidas tú: las tres salidas son legítimas y cuestan cosas distintas.

```markdown
Listo: anuncio estilo podcast de [producto] para [mercado], en [idioma]. Dos
[anfitrionas / anfitriones], [N] generaciones de diálogo + 2 de reacciones y
[M] B-roll en [pantalla dividida / esquina], unos [S] segundos. El manifiesto
quedó guardado y revisado en temp/[slug]/manifiesto.json.
[Solo si la hay: una línea con la decisión que conviene que sepas.]
[Solo si no sabes dónde está la foto del producto: "Pásame la foto del producto
(arrástrala al chat o dime la ruta) y la dejo lista."]

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero en Google Flow las imágenes de los dos hosts,
cada generación y el B-roll, reviso cada clip, armo la conversación con sus
cutaways y su B-roll y te entrego el MP4 terminado. Antes de los videos te digo
cuántos créditos de Flow gastan (las imágenes no gastan créditos).
[Solo si el B-roll va en esquina:] El recorte del host lo hace tu computadora:
no cuesta créditos, pero tarda (unos 7 minutos por cada segundo de host
recortado).

**B) Genera solo las imágenes y los videos** — los genero en Google Flow, reviso
cada clip y te los dejo en su carpeta, con el mapa de montaje medido, listos
para que los montes tú en CapCut a tu gusto. También te digo los créditos de
Flow antes de los videos.

**C) Entrégame el paquete de prompts** — te paso aquí el guion por beats con
cada línea numerada, los prompts de los dos hosts, los bloques de generación y
los clips de reacción, el B-roll, el mapa de montaje y las notas de edición,
para que lo revises o lo produzcas a mano. Después, si quieres, seguimos con
A o B.
```

### Las imágenes y los videos se generan en Google Flow

En esta versión del sistema, `npm run imagenes` y `npm run videos` no generan ni
cobran nada: arman la lista de trabajo (la cola) y **tú generas cada archivo en
Google Flow**, manejando Chrome con la extensión Claude in Chrome. Donde el
proceso de abajo dice `npm run imagenes` o `npm run videos`, va este ciclo, en
ese mismo lugar del orden:

1. `npm run imagenes -- temp/[slug]` arma la cola (`temp/[slug]/flow/cola-imagenes.json`)
   y hace solo lo que no necesita Flow: las copias de la hoja de cada host al
   primer cuadro de sus generaciones (`img/toma-N-inicial.png`).
2. Genera la cola en Google Flow con la skill **`flow-generacion`**: esa skill
   explica todo el procedimiento (ventana aparte, subir las referencias, enviar
   todo, reintentos, descargar cada archivo con su nombre).
3. `npm run flow:recibir -- temp/[slug]` mueve las descargas a `img/` o
   `video/` del anuncio, las convierte y las verifica.
4. Repite 1 a 3 hasta que la cola diga que no queda nada. En este estilo
   siempre hay más de una vuelta: la hoja de B espera a la de A (se genera con
   ella adjunta), y las copias al primer cuadro esperan a la hoja de su host.
5. Lo mismo con `npm run videos -- temp/[slug]`: las generaciones habladas, los
   dos clips de reacciones y los videos de B-roll. **Antes de mandar los videos
   a Flow**, dile al usuario cuántos clips son y la estimación de créditos que
   imprime el comando, y espera su ok. El comando tiene medidos los clips de
   4, 6 y 8 s: los de 10 s (muchas generaciones de este estilo) salen "sin
   medir". Para esos, antes de pedir el ok, elige esa
   duración en el menú de ajustes de Flow (muestra cuántos créditos usa) y dale
   al usuario el total con esos números. Las imágenes cuestan 0 créditos en Flow
   y no necesitan ok.

**Para rehacer** algo ya generado, el archivo viejo sale antes a `historial/`:
una generación o un clip de reacciones con `rehacer-toma --aplicar` (más
abajo), una hoja o un B-roll a mano. Después `npm run imagenes` o
`npm run videos` arman la cola solo con lo que falta y se sigue el mismo ciclo,
con `flow:recibir` sin `--rehacer` (el archivo viejo ya no está). **En este
estilo no uses `--rehacer` en `imagenes` ni en `videos`**: `--tomas N` arrastra
siempre las dos hojas y, en videos, el B-roll que va encima de esa toma, y
`--rehacer` los manda a `historial/` al armar la cola y los vuelve a pedir:
hosts con caras nuevas que ya no coinciden con las demás generaciones, y un
B-roll de más pagado con créditos. Una toma no tiene imagen propia que rehacer:
su `toma-N-inicial.png` es una copia de la hoja.

**Al rehacer una hoja o un B-roll ya recibidos, basta con sacar el archivo
final a `historial/`.** `flow:recibir` deja la descarga original de cada imagen
y de cada B-roll en `temp/[slug]/flow/descargas/recibidos/` y no la vuelve a
usar: si el archivo final ya no está y en Descargas todavía no está la descarga
nueva (sigue bajando, falló o salió con otro nombre), lo marca "falta" (si
todavía se está bajando, lo dice). Antes de recibir, confirma la descarga nueva
(`window.__claudeFlow.descargas()`, como dice `flow-generacion`). Las
generaciones habladas y las reacciones no dejan copia: se mueven tal cual.

En esta versión kie.ai solo cobra la música y las canciones de Suno, y este
estilo no lleva música: en un podcast kie.ai no cobra nada. La transcripción
(`npm run lineas`) sigue por ElevenLabs.

### Lo que vale en A y en B

**Las herramientas, en Google Flow.** El modelo de cada imagen y de cada video lo dice su trabajo en la cola. Las dos hojas de los hosts salen de Nano Banana Pro, el que reemplaza a GPT Image 2.5 Sunburst a 2K (A sin referencia; B con la imagen de A adjunta). Cada generación hablada y cada clip de reacciones sale de Omni 1.1 Flash en modo Fotogramas, con la imagen de su host como **primer cuadro** y nada más adjunto (el modelo no acepta primer cuadro y referencias a la vez). Cada B-roll es una imagen (con la foto del producto como referencia si aparece) que Flow anima partiendo de ella, en vez de Kling 3.0, con la duración que dice la cola (Flow no tiene 5 s); `flow:recibir` le cambia el audio por silencio. **No hay modelo de respaldo para los videos de este estilo**: las generaciones habladas, las reacciones y el B-roll llegan a la cola sin `respaldo` (Kling no genera el diálogo), así que si Omni falla en Flow se sigue "Si Omni falla en una generación en Flow". Las imágenes sí traen respaldo (Nano Banana 2.1), y también cuesta 0 créditos: la skill `flow-generacion` dice cuándo usarlo. En modo esquina, el host se recorta sin fondo en la computadora, con un modelo de recorte que corre con Python (sin créditos; la primera vez baja el modelo, unos 220 MB). Sin música.

**Un proceso pesado a la vez.** El recorte del host, el render de `ensamblar` y las generaciones grandes usan mucha memoria: nunca corras dos a la vez (nunca el recorte mientras renderiza, nunca dos recortes), y `ensamblar` va con `--concurrencia 1`, que es más lento pero no se queda sin memoria. Con dos a la vez la computadora se puede trabar y se pierde el trabajo en curso.

**Las dos paradas que sí van, y que no se saltan nunca:**

1. **Los créditos de Flow, antes de los videos.** Antes de nada, `npm run validar -- temp/[slug]/manifiesto.json` revisa el manifiesto; el costo en créditos de kie.ai que pueda imprimir no aplica en esta versión: no se lo muestres. Las imágenes (las dos hojas y las de B-roll) cuestan 0 créditos en Flow y no esperan el sí. Los videos sí: cuando `npm run videos` arme la cola, dile al usuario cuántos clips son y la estimación de créditos de Flow que imprime, y espera un sí antes de mandarlos a Flow. Lo que manda es lo que imprima el comando y, en los clips que salen "sin medir" (los de 10 s), lo que muestre el menú de ajustes de Flow con esa duración elegida (ver el paso 5 del ciclo). El usuario paga cada clip con los créditos de su cuenta de Flow. **En modo esquina, antes de pedir ese sí**, corre `npm run recortar -- --verificar`: el recorte del host necesita Python con sus paquetes (Paso 7 de `INSTALAR.md`). Si falta algo, resuélvelo primero (o propón pantalla dividida): si no, la falta aparece recién en `npm run recortar`, con los créditos de los videos ya gastados.
2. **La revisión de los clips, antes de montar.** Una generación hablada no se puede acelerar ni cortar por dentro de una línea: si sale mal, solo se arregla regenerándola, y regenerar después de ensamblar es rehacer todo el montaje.

En esta versión `imagenes` y `videos` no cobran ni esperan una confirmación en la terminal: no llevan `--si`. Con el sí de los créditos, los videos van a Flow con el ciclo de arriba.

**Las hojas de los hosts, antes de pagar los clips.** Míralas cuando salgan en Flow, antes de descargarlas, y otra vez en `img/host-a.png` y `img/host-b.png` después de `flow:recibir`: esas caras van en todo el anuncio y son el primer cuadro de cada generación. ¿Son dos personas claramente distintas (cara, pelo, ropa), de edad parecida, en el mismo lugar con el mismo micrófono, mirándose en direcciones opuestas (A a la derecha, B a la izquierda), sin mirar a cámara, sin texto, sin dedos de más? ¿Los dos hombros y los brazos quedan dentro del cuadro, sin tocar el borde? ¿El micrófono está más abajo que la boca, sin taparle la boca ni la barbilla? ¿La cabeza queda en la parte de arriba de la imagen y el micrófono un poco más abajo de la mitad (en pantalla dividida se ve más o menos esa franja)? ¿El fondo está libre de libros, pantallas y cualquier cosa con letras? Si una salió mal, regenérala en Flow antes de descargarla: cuesta 0 créditos y no hace falta preguntar (cuéntalo en el informe). Si ya estaba recibida, mueve esa imagen a `historial/`, junto con las `img/toma-N-inicial.png` de las generaciones de ese host (son copias de la hoja vieja; su descarga vieja no se toca: ver "Al rehacer una hoja o un B-roll ya recibidos"), y sigue el ciclo de Flow con `npm run imagenes -- temp/[slug]` (arma la cola solo con lo que falta: una hoja que ya está en `img/` no se vuelve a pedir). Si la que rehaces es la de A, mueve también `host-b.png` (con sus copias) a `historial/`: B sale de la imagen de A y, con la A nueva, tiene que volver a generarse. Mira también las imágenes de B-roll (`img/broll-N.png`): el producto idéntico a la foto, cerrado si la foto lo muestra cerrado, etiqueta legible y sin una mano delante, sin texto inventado, nadie mirando a cámara, y lo importante donde se va a ver (en la franja del medio en pantalla dividida; lejos de la esquina de abajo del host que habla, en esquina). Una imagen de B-roll que falla se trata igual que una hoja: se regenera en Flow o, si ya se recibió, va a `historial/` y sale en otra vuelta del ciclo de `npm run imagenes`, antes de pagar su video. Si están bien, sigue sin preguntar.

**La revisión de cada clip — obligatoria.** No te fíes de la tabla de palabras: sirve para escribir bien a la primera, no garantiza nada. Con cada clip generado:

- **Fotogramas** (`npm run frames -- temp/[slug]`, quedan en `qa/`): una tira por clip. Míralas todas. ¿Es la misma persona que la hoja en toda la generación y en todas las generaciones de ese host? ¿Sigue mirando hacia su lado, sin mirar a cámara? ¿El encuadre y el micrófono se mantienen (sin cambios de ángulo)? ¿Hay texto en pantalla? ¿Aparece alguien más? En las reacciones: ¿boca cerrada todo el clip, tres reacciones que se distinguen (no tres veces el mismo gesto), en orden? En el B-roll: ¿el producto idéntico a la foto, quieto y sin abrirse, etiqueta legible, nadie habla ni mira a cámara, sin texto? ¿Lo que ilustra la frase sigue en la franja del medio (pantalla dividida) o lejos de la esquina del host (esquina) durante todo el clip?
- **Transcripción y líneas** (`npm run lineas -- temp/[slug]`): transcribe cada generación hablada, la compara con su `linea` e imprime una tabla por toma con cada línea, su inicio y su fin dentro del clip y la pausa hasta la siguiente. ¿Dijo todo el guion del bloque, en orden, sin cortar palabras, sin cambiarlas y sin saltarse ninguna (`dijo_todo`, sin `faltan`)? ¿Salió **limpio**: sin palabras repetidas, trabadas, cambiadas o agregadas entre la primera y la última palabra del guion? Si no, la toma queda con `limpio: false` y esas palabras en `agregadas`, y **se regenera**: nunca la dejes pasar porque "suena natural". **La única excepción la decide el motor, no tú**: una palabra de una sola letra ("a", "y", "e", "o", "u", sin importar tildes, mayúsculas ni puntuación) dicha dos veces seguidas, con las dos juntas en menos de 0,2 s y menos de 0,15 s de pausa entre ellas. Esa no ensucia la toma: `lineas` la deja en `toleradas` (no en `agregadas`), la cabecera de la toma dice "LIMPIO (con 1 repeticion tolerada)", debajo sale `tolerada (repeticion de una letra, 0.16 s): "y, y" (3.20s): revisa a oido si quieres`, y al final las junta todas en "REPETICIONES TOLERADAS"; `lineas --solo-plan` y el plan también la avisan. No se regenera, pero **siempre se la informas al usuario, con su generación y su segundo**, para que la escuche: si al oírla prefiere rehacer la generación, se rehace como cualquier otra, con su costo. Todo lo demás sigue siendo un defecto que se regenera, aunque se parezca: una palabra de dos letras o más dicha dos veces ("en, en"), una frase repetida, una trabada, una muletilla, una letra agregada o cambiada (no repetida), la misma letra tres veces, o dos veces pero más lenta o con más pausa. Tú no toleras nada por tu cuenta: si `lineas` dice NO ESTA LIMPIO, se regenera. Las diferencias que son solo de escritura no cuentan (el motor ya las iguala al comparar): un número escrito con cifras o con letras ("11" / "once", "60" / "sesenta"), un símbolo de precio ("$", "S/"), un "%" dicho "por ciento", dos palabras pegadas o separadas, las tildes y las mayúsculas, la marca mal escrita por el transcriptor (escribe mal los nombres de marca), una muletilla que sí está en el guion. Pero **un "%" escrito se tiene que oír**: "ahorra 30" no es "ahorra 30 %", así que sin su "por ciento" ("percent" en inglés, "por cento" en portugués) el clip no está limpio; la moneda escrita con símbolo sí puede no decirse ("$29" dicho "veintinueve" está bien). Y un número dicho a medias ("49.90" oído "cuarenta y nueve") no es escritura: no lo dijo. Voz después de la última palabra del guion (`sobran_al_final`) tampoco cuenta: el montaje no la usa. Lo que se oye **entre dos líneas**, en el tramo que el montaje corta, tampoco (no llega al anuncio; la tabla lo muestra como "entre lineas, donde el montaje corta, no cuenta"); lo que cae en el aire que sí queda, justo después de una línea o justo antes de la siguiente, se oye y cuenta. **Una medida de antes de la revisión** (un clip medido cuando todavía no se revisaba el habla) no se da por buena ni por sucia a ciegas: `npm run lineas -- temp/[slug] --solo-plan` y el plan la revisan sobre la transcripción guardada, sin créditos, y la marcan "segun la transcripcion guardada"; un "NO ESTA LIMPIA segun la transcripcion guardada" vale igual que cualquier otro: ese clip se regenera, avisando el costo. ¿Cada línea quedó ubicada (tiene inicio y fin; una línea "sin ubicar" o con calidad baja se mira a mano)? ¿Hay una pausa entre líneas (ahí corta el motor; sin pausa, el corte queda justo en el borde)? **Una medida vieja se vuelve a medir**: si `lineas` o el plan dicen "la medida de toma N es de otro clip", ese clip cambió después de medirlo (se regeneró); corre el comando que imprimen, `npm run lineas -- temp/[slug] --tomas N`, antes de seguir.
- **Las reacciones, transcritas** (el mismo `npm run lineas`): cada clip de reacciones se transcribe con sus sonidos y queda con `reacciones: true`, las `palabras` que oyó el transcriptor, los `eventos` (la risa, el "hmm", el suspiro, con su segundo) y `limpio`. Los sonidos ya los separa el motor: una risa, un "hmm", un "mm" o un suspiro van a `eventos` aunque el transcriptor los escriba como palabra, y con ellos sabe en qué segundo pasa cada reacción. Lo que queda en `palabras` es una palabra o un monosílabo, en cualquier idioma ("yes", "so", "yeah", "sí", "ajá"), y **es falla, sin excepción** (la repetición tolerada de arriba vale solo en las generaciones habladas): `limpio: false`, y ese clip se regenera, aunque la palabra caiga en una reacción que el guion no usa (su sonido podría colarse en un cutaway). No lo dejes pasar porque "sonaba como un hmm".

Al terminar, muéstrale al usuario la revisión clip por clip y dónde están, con cada repetición tolerada aparte (su generación, su segundo y que la revise a oído), y espera su visto bueno antes de montar. Si alguno falla, dile cuál, qué falló (el fotograma, la línea, las palabras repetidas o agregadas, la palabra que dijo una reacción) y cuántos créditos de Flow cuesta regenerarlo (los que imprime `npm run videos` al armar su cola; si dice "sin medir", como en un clip de 10 s, léelos en el menú de ajustes de Flow con esa duración elegida), y espera el sí. Se regenera **sin tocar el texto**: si una generación salió con otra cara, mirando a cámara, con texto en pantalla, con una línea que falta o apurada, con palabras repetidas, cambiadas o agregadas, o un clip de reacciones que dice alguna palabra, falló la tirada, no el guion. El motor no repite un prompt idéntico, así que al rehacer cambia algo pequeño que ayude, nunca las líneas: en una generación hablada, una nota de Delivery más concreta en la línea que falló (`says it only once, word for word`), o "keeps the exact face of the start frame" en la primera línea del prompt; en un clip de reacciones, la reacción que dijo algo pasa a otro gesto con otro sonido hecho con los labios cerrados (una risa por la nariz en vez de un "hmm"), y el resto del bloque, con "No words in any language", queda igual:

```
node produccion/rehacer-toma.js temp/[slug] --toma N --contexto          muestra las líneas y el prompt de esa generación
node produccion/rehacer-toma.js temp/[slug] --toma N --aplicar nuevos.json   { "prompt_video": "…" }: saca el clip a historial/ (y su recorte, en esquina) y borra su medición
npm run videos -- temp/[slug] --tomas N --sin-broll                       arma la cola solo con ese clip (y dice sus créditos); sin --rehacer
   ... genéralo en Google Flow (skill flow-generacion) ...
npm run flow:recibir -- temp/[slug]                                       sin --rehacer: el clip viejo ya está en historial/
npm run frames -- temp/[slug]
npm run lineas -- temp/[slug] --tomas N
```

El prompt nuevo se lo muestras al usuario (regla de fidelidad) y queda en el manifiesto. Si cambiaste la descripción de una reacción, cámbiala también en `tomas[].reacciones` y debajo de su bloque. Un B-roll que salió mal se rehace moviendo `video/broll-N.mp4` (y `img/broll-N.png`, si el problema era la imagen) a `historial/` (sus descargas viejas no se tocan), y siguiendo el ciclo de Flow con `npm run imagenes` (si sacaste la imagen) y `npm run videos`: la cola trae solo lo que falta. Y se revisa de nuevo. Si vuelve a fallar, se lo dices otra vez, con los créditos. Al regenerar un clip, el motor le quita su medida vieja: por eso `lineas -- … --tomas N` lo vuelve a medir antes de planear. Si regeneras un clip después de haber planeado, sigue con plan → subtítulos → plan (y, en esquina, recortar → plan): los segundos cambian, y si no lo haces el plan avisa que `subtitulos.json` es de un plan anterior.

**Si Omni falla en una generación en Flow.** Los reintentos los hace la skill `flow-generacion` (el mismo prompt, hasta 4 veces, sin tocar nada). Son dos fallos distintos y no se arreglan igual:

- **Error de Flow que no habla de contenido** (un error genérico, tiempo de espera, servidor ocupado): **no es un rechazo de contenido, y no se toca nada**, ni el copy ni el manifiesto. Reintenta; si sigue fallando, espera unos minutos y vuelve a mandarlo. Si sigue fallando igual, Omni está caído (ha pasado: casi una hora de "500 Internal Error"): avísale al usuario que es una caída del servidor y no un problema de su anuncio, y reintenta cada 15 minutos.
- **Rechazo de contenido** (Flow dice que la generación puede incumplir sus políticas; casi siempre en salud y suplementos): muchas veces es un falso positivo y pasa al reintentar. Si a la cuarta sigue rechazada, el mismo prompt fallaría igual. **En una generación hablada no cambies el prompt solo en la caja de Flow** (lo que `flow-generacion` hace con otros trabajos): la transcripción compara lo que se oye con la `linea` del manifiesto, así que el cambio va primero al manifiesto. Reescribe **solo la línea (o las líneas) de esa generación que lo dispara**, con su misma función en el guion, su mismo beat, su mismo host y sus palabras dentro de la guía: cambia la frase que lo provoca (una promesa de cura, el nombre de una enfermedad, una cifra de kilos) por otra que diga lo mismo con otras palabras. Actualiza en el manifiesto el `texto` de esa línea en `guion` y en `lineas`, la `linea` de la toma, la `Línea N: "…"` de su `prompt_video`, y el `sincroniza_con` de un B-roll si colgaba de esa frase. No hay clip que sacar (falló antes de existir): valida (`npm run validar -- temp/[slug]/manifiesto.json`). Antes de rearmar la cola, espera a que termine el resto de la tanda en Flow, descarga lo que salió bien y recíbelo con `flow:recibir`: la cola nueva trae todo lo que no está en `video/`, y lo ya generado en Flow se pagaría dos veces. Después vuelve a armar la cola con `npm run videos -- temp/[slug]` (ya con el prompt nuevo) y manda a Flow solo lo que todavía no se generó: la generación reescrita. Anota el cambio en `flow/cambios-de-prompt.md`, como pide `flow-generacion`. No le preguntas antes: sin ese cambio la generación no existe. Vale también para un guion ganador: es la única excepción a no tocar su texto. En un B-roll, que no se transcribe, vale el cambio en Flow que explica `flow-generacion`.
- **Hasta 3 reescrituras.** Si a la tercera Omni sigue rechazándolo, para y avísale al usuario: qué frase probaste en cada intento y qué mensaje dio Flow. No sigas sin él.
- **Si no sabes de qué tipo es**, lee el mensaje de Flow. Si habla de políticas o de contenido, es un rechazo; si no, trátalo como error de Flow (reintentar sin tocar nada), y si vuelve a fallar igual, avísale al usuario con el mensaje tal cual.

**Nunca aceleres una generación hablada** (deforma la voz y rompe la sincronización de labios), y nunca le pidas otra duración (ni con `--duracion` ni eligiendo en Flow otra que la de la cola): la duración está atada a sus líneas, y se cambia solo en el manifiesto.

### Si elige A — el anuncio completo

Sigue este orden de principio a fin, **sin pararte a preguntar entre comando y comando** fuera de las dos paradas, de la mirada a las hojas y de lo que pide `flow-generacion` (el permiso de cada tanda de descargas). El usuario ya dijo que sí: pedirle permiso en cada paso es hacerle perder el tiempo.

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug]   la foto (G.5), si hay foto y no se hizo
npm run validar   -- temp/[slug]/manifiesto.json      revisa el manifiesto
npm run imagenes  -- temp/[slug]                      cola de hojas y B-roll: Flow + flow:recibir, en vueltas (mirar las hojas)
npm run videos    -- temp/[slug]                      cola de generaciones, reacciones y B-roll: créditos -> PARADA 1: esperar el sí; Flow + flow:recibir
npm run frames    -- temp/[slug]                      una tira de fotogramas por clip
npm run lineas    -- temp/[slug]                      transcribe: ¿dijo todo y limpio? ubica cada línea; reacciones sin palabras
   ... revisión de cada clip -> PARADA 2 ...
npm run plan      -- temp/[slug]
node produccion/subtitulos-dialogo.js temp/[slug]     los subtítulos de un anuncio hablado
npm run plan      -- temp/[slug]                      OTRA VEZ: no es un error
npm run recortar  -- temp/[slug]                      SOLO en esquina: recorta al host sin fondo (lento, sin créditos)
npm run plan      -- temp/[slug]                      SOLO en esquina: una vez más, para usar el recorte
npm run ensamblar -- temp/[slug] --concurrencia 1     cuando todo lo anterior terminó, solo
```

`imagenes` y `videos` son el ciclo de Google Flow de arriba (cola → `flow-generacion` → `flow:recibir`, hasta que la cola diga que no queda nada).

**El plan corre dos veces** (tres en esquina): plan → subtítulos → plan → [esquina: recortar → plan] → ensamblar. La primera pasada arma la conversación con las líneas medidas; los subtítulos salen de ahí; la segunda pasada vuelve a ubicar los B-roll y los cutaways con las palabras exactas de los subtítulos (la frase ancla, la frase `tras`) y sube los subtítulos que caen sobre un B-roll. Si te saltas la segunda, `ensamblar` renderiza igual y los B-roll y los cutaways quedan ubicados a ojo: es fácil no notarlo. `subtitulos.json` guarda la línea de tiempo del plan con el que se hizo: si después cambian los bordes de un clip (se regeneró o se volvió a medir), el plan avisa que `subtitulos.json` es de un plan anterior; vuelve a correr `node produccion/subtitulos-dialogo.js temp/[slug]` y `npm run plan`. Los subtítulos de este estilo salen de `subtitulos-dialogo.js`, que alinea la `linea` de cada toma con lo que se oye (reusa la transcripción de `lineas`); `npm run subtitulos` es el de voz en off y pide una pista de voz que aquí no existe. `npm run plan` necesita `lineas-habladas.json`: si falta, se detiene y lo dice; y si no queda ninguna línea con una medida que sirva (todas son de un clip anterior, o falta algún clip), también se detiene, con lo que pasó en cada toma y el comando a correr (`npm run lineas -- temp/[slug] --tomas …`, antes el ciclo de Flow de `npm run videos` si falta un clip).

**En esquina, el recorte va entre plan y plan.** `npm run recortar` lee del plan los tramos en que cada host va en su esquina, recorta solo esos tramos (deja `video/recorte-toma-N.webm`, el host sin fondo, y `recorte.json`) y el plan siguiente pone al host recortado en cada uno. Tarda: unos 7 minutos por cada segundo de host recortado (con tres B-roll, alrededor de una hora), sin créditos. Corre solo: nada más pesado en paralelo, ni el render. Si el plan avisa "corre npm run recortar" (falta un tramo, o regeneraste un clip después del recorte), córrelo y vuelve a planear antes de ensamblar. Si el comando dice que falta Python o su paquete de recorte, dale al usuario el mensaje tal cual: sin recorte, el plan deja al host en una ventana en su esquina, y eso no es lo que eligió.

**Sin música y sin transiciones.** No corras `npm run musica` (en este estilo no genera nada y lo dice) ni escribas `transiciones.json`: la conversación se corta en seco y se oye solo la voz. `ensamblar` entrega dos versiones: con subtítulos y sin subtítulos; cada una tarda unos 10 minutos con `--concurrencia 1`.

**Al final, entrégale los MP4 y el informe**, en tres apartados:

- **Lo que salió bien**: las generaciones que pasaron la revisión a la primera (misma cara, cada línea dicha, limpia y ubicada, reacciones sin palabras, B-roll con el producto bien) y lo que funcionó mejor de lo esperado.
- **Decisiones del montaje**: la duración real (como dato), de qué clip y qué segundos salió cada línea; cada cutaway que entró, después de qué frase, desde qué segundo de su clip de reacciones y con su sonido; cuáles acortó o quitó el motor por la regla del turno o por un B-roll; dónde entró cada B-roll y a qué velocidad; el modo de B-roll (en esquina, qué tramos llevan al host recortado); qué subtítulos subieron sobre el B-roll; cada repetición tolerada que quedó en el anuncio (su generación y su segundo, para que la escuche); y lo que decidiste tú sin consultar.
- **Lo que salió mal**, clip por clip: qué falló en la revisión, qué se regeneró y cuántos créditos de Flow costó; cada rechazo de Omni en Flow, con la frase original, la que la reemplazó y el mensaje de Flow, y cada prompt cambiado en Flow (`flow/cambios-de-prompt.md`); las caídas del servidor, si las hubo (cuánto duraron); fotogramas negros o tramos congelados, si los hubo. Si queda vacío, se dice que quedó vacío: eso es información.

Y al final, el **costo real**: los créditos de Flow de las generaciones, las reacciones, los videos de B-roll y las regeneraciones (las imágenes no gastan créditos, y en este estilo kie.ai no cobra nada). Ahí él decide si quiere ajustar algo.

**Y ten cuidado con qué llamas "lo que salió mal".** El motor imprime avisos —una generación con palabras fuera de la guía, un cutaway que acortó o quitó porque no entraba en el turno, una reacción cortada por su tercio porque no encontró su sonido, un B-roll acelerado, voz de más al final de un clip— y **eso no son fallos: es el montaje funcionando.** Ponlos en las decisiones del montaje, no como defectos.

Defectos de verdad hay pocos y son medibles: otra cara, mirar a cámara, texto en pantalla, una persona de más, palabras del guion que no se dijeron o se cortaron, palabras repetidas, cambiadas o agregadas dentro del guion (una repetición tolerada no es defecto: va en las decisiones del montaje), una reacción que dice una palabra, una línea que no se pudo ubicar, fotogramas negros, tramos congelados, un B-roll con el producto cambiado o la etiqueta ilegible. Eso sí va en "lo que salió mal", con lo que se regeneró en la revisión para arreglarlo.

**La duración NO es un defecto.** Si el usuario pidió 35 segundos y salieron 41, eso está bien y no se corrige. **Nunca cortes una línea del guion, quites una generación ni inventes copy para llegar a un número**, y no se lo ofrezcas al usuario como opción. El tiempo que pide orienta el guion; el anuncio dura lo que necesita durar. Menciónalo como dato, sin pedir disculpas.

### Si elige B — solo las imágenes y los videos

Corre la generación (en Google Flow, con el ciclo de arriba), revisa cada clip igual que en A y **párate antes de montar**:

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug]   la foto (G.5), si hay foto y no se hizo
npm run validar     -- temp/[slug]/manifiesto.json     revisa el manifiesto
npm run imagenes    -- temp/[slug]                     ciclo de Flow, en vueltas (mirar las hojas)
npm run videos      -- temp/[slug]                     créditos -> esperar el sí; ciclo de Flow
npm run frames      -- temp/[slug]
npm run lineas      -- temp/[slug]
   ... revisión de cada clip, igual que en A ...
npm run plan        -- temp/[slug]
node produccion/subtitulos-dialogo.js temp/[slug]
npm run plan        -- temp/[slug]                     OTRA VEZ: no es un error
npm run recortar    -- temp/[slug]                     SOLO en esquina: el host sin fondo (lento, sin créditos)
npm run plan        -- temp/[slug]                     SOLO en esquina: una vez más, para usar el recorte
npm run plan:humano -- temp/[slug]
```

El plan no renderiza nada: mide y decide los segundos de cada corte, de cada cutaway y de cada B-roll, igual que en A, para que el montaje a mano quede igual que el del motor. El recorte de la esquina sigue la misma regla de un proceso pesado a la vez.

El último deja `plan-montaje.txt` en la carpeta del anuncio: el orden de la conversación línea por línea, de qué clip sale cada una y desde qué segundo hasta cuál; los cutaways (qué clip de reacciones, desde qué segundo de ese clip, después de qué frase y con su sonido, unos 6 dB más bajo que la voz); los B-roll (sobre qué frase, cuánto duran y a qué velocidad) y el modo de B-roll (en pantalla dividida, el B-roll arriba con un degradado sobre el host; en esquina, el host recortado sin fondo, con su archivo). **Está escrito para que lo lea una persona**, y es lo que necesita para montarlo en CapCut sin adivinar nada.

Dile dónde quedó todo: las generaciones en `video/toma-1.mp4`, `toma-2.mp4`… en el orden de los bloques (las dos últimas son las reacciones); los B-roll en `video/broll-1.mp4`…; en esquina, el host recortado sin fondo en `video/recorte-toma-N.webm` (uno por generación con tramos en la esquina; si su editor no lee la transparencia del `.webm`, que use su herramienta de quitar el fondo sobre ese tramo del host); las hojas en `img/host-a.png` y `img/host-b.png`; y la tabla de líneas medidas en `lineas-habladas.json`. Y recuérdale lo de CapCut: cortar en la pausa entre líneas y nunca dentro de una palabra, **nunca acelerar una generación hablada**; las reacciones con su sonido, un poco más bajo que la voz, justo después de la frase que las provoca y desde el segundo de su clip que dice el plan, nunca al comienzo de un turno, y quien habla vuelve a cuadro antes de terminar; en pantalla dividida, el B-roll arriba (un poco más de la mitad de la pantalla) fundido con un degradado sobre el host, que va abajo con la cabeza arriba y el micrófono a la vista; en esquina, el B-roll a pantalla completa y el host recortado en la esquina inferior de su lado; el B-roll siempre mudo; subtítulos palabra por palabra, que suben mientras va el B-roll; y sin música.

### Si elige C — el paquete en el chat

Entrégale el paquete **completo y en una sola respuesta, nunca una muestra** ni "¿quieres que te dé el resto?", con los bloques del Formato de entrega, en su orden y con sus nombres: Ficha del anuncio · Mapa de hablantes · Imágenes de los hosts · Guion · Bloques de generación (con los dos clips de reacciones) · B-roll · Mapa de montaje · Notas de edición · Chequeo. **Sin el manifiesto**: es interno del sistema y no se muestra nunca. Cada prompt va en su propio bloque de código copiable, y los prompts y las líneas que muestras **se copian del manifiesto carácter por carácter** (es la fuente de verdad: regla de fidelidad).

Si pide cambios (una línea, un host, un B-roll, un cutaway), cámbialos primero en el manifiesto, con las reglas de siempre (la aritmética; la línea igual en `guion`, en `lineas`, en la `linea` de la toma y en su `prompt_video`; la frase ancla o la frase `tras` si colgaba de ella), vuelve a validarlo (`npm run validar -- temp/[slug]/manifiesto.json`, sin mostrarle el costo de kie.ai que imprima, que en esta versión no aplica; si hay foto, después del comando de G.5, y si no sabes dónde está, pídele antes la ruta) y muéstrale lo que cambió, copiado del manifiesto.

Al final, ofrécele seguir con A o con B, o dejarlo ahí.

**Si en cualquier momento pide ver el paquete o una parte** ("muéstrame el guion", "pásame el bloque de la generación 3", "¿cómo quedó el prompt del host B?"), antes de elegir, en medio de A o B o después, muéstrale esa parte entera, con los prompts y las líneas copiados del manifiesto; si pide el paquete entero, como en C. El manifiesto mismo, nunca.

---

## Reglas que nunca se rompen

- Nunca más de una pausa antes de la entrega: solo el briefing, y ninguna si el mensaje o el guion ganador ya lo resuelven todo.
- Nunca escribas el guion antes de tener las respuestas del briefing.
- Nunca un CTA directo: siempre los 3 movimientos del CTA indirecto, y el endoso de A es la última línea.
- Nunca una foto de una persona real ni una imagen traída por el usuario como host: los dos hosts se generan con IA, B a partir de A.
- Nunca voz en off ni una voz aparte: la voz la genera el video, y la descripción de voz de cada host va idéntica en todas sus generaciones.
- Nunca reutilices copy, cifras ni ángulos de otros anuncios, ni del ejemplo de esta skill.
- Nunca reescribas, acortes ni pulas un guion ganador (la única excepción es una generación que Omni rechaza por contenido, ver la última regla); nunca lo rellenes para llegar a una duración.
- Nunca una generación de otra duración que 4, 6, 8 o 10 s, ni con más de 26 palabras, ni con una sola línea.
- Nunca una línea del Guion repartida en dos generaciones ni en ninguna: cada `orden` está en exactamente una toma, con el mismo texto letra por letra.
- Nunca un bloque abreviado: todos completos, con sus pares Línea / Delivery y su línea Audio al final, y nada después.
- Nunca un bloque de diálogo sin el párrafo de "She says each line exactly as written, only once"; nunca cambies una línea para que se pronuncie bien la marca (eso va en el Delivery).
- Nunca una reacción con palabras ni monosílabos, en ningún idioma: labios cerrados y solo sonidos no verbales; nunca tres reacciones iguales ni una sin su sonido.
- Nunca un cutaway sin su frase `tras`, al comienzo de un turno, sin dejar que quien habla vuelva a cuadro antes de terminar, ni encima de un B-roll.
- Nunca dejes pasar una generación con palabras repetidas, cambiadas o agregadas, ni un clip de reacciones que dice una palabra: se regenera, avisando el costo. La única que no se regenera es la repetición que `lineas` marca "tolerada" en una generación hablada (una palabra de una letra dicha dos veces, muy rápido y sin pausa); esa se le informa siempre al usuario, con su generación y su segundo. Tú no toleras nada por tu cuenta.
- Nunca texto en pantalla, captions ni música dentro de los prompts.
- Nunca música de fondo en el montaje, ni transiciones.
- Nunca una hoja de host con un brazo cortado por el borde, con el micrófono delante de la boca o con libros, teclados o pantallas en el fondo.
- Nunca un B-roll antes de la revelación, en el CTA o en una línea con cutaway; nunca menos de 2 ni más de 4; nunca sin su frase ancla textual y sus dos prompts completos.
- Nunca un B-roll compuesto a todo el alto en pantalla dividida, ni con lo importante en la esquina del host que habla en modo esquina.
- Nunca un B-roll con el producto a la vista sin la foto del producto como referencia; nunca el producto deslizándose, arrastrado, abriéndose (si la foto lo muestra cerrado) o con una mano delante de la etiqueta; nunca colores que no salen de la foto ni del brief; nunca los hosts dentro de un B-roll; nunca nadie que hable o mire a cámara en él.
- Nunca una referencia en el video de una generación: la imagen del host es el primer cuadro y nada más.
- Nunca dos procesos pesados a la vez (el recorte del host, el render): uno por vez, y `ensamblar` con `--concurrencia 1`.
- Nunca inventes prueba social, precios, ofertas, dosis, horarios ni modo de uso (si el anuncio los necesita y no los tienes, investígalos o pregúntalos).
- Nunca un prompt fuera de su propio bloque de código copiable.
- Nunca un paquete a medias: cuando se entrega (opción C, o si lo pide), va completo y en una sola respuesta, nunca una muestra ni "¿quieres que te dé el resto?". Al terminar de armarlo, en el chat va solo el resumen corto y la pregunta A/B/C.
- Nunca un prompt o una línea que el usuario vea distintos, ni en un carácter, de los del manifiesto: se copian de ahí.
- Nunca el manifiesto en el chat: es interno del sistema, ni siquiera en la opción C.
- Nunca generes nada antes de tener el paquete completo y el manifiesto guardado y de que el usuario elija A o B, ni mandes un video a Flow antes de que apruebe sus créditos (las imágenes, 0 créditos, no esperan el sí).
- Nunca aceleres una generación hablada ni la cortes por dentro de una línea; nunca le cambies la duración por fuera del manifiesto.
- Nunca reescribas el copy de una generación salvo que Omni la rechace por contenido en Flow después de sus 4 reintentos: entonces solo esa línea, primero en el manifiesto, con su misma función y largo, hasta 3 veces, y se informa. Un error de Flow que no habla de contenido (una caída del servidor) no se arregla con el texto: se reintenta, se espera y se vuelve a mandar.

---

## Chequeo final antes de entregar

- Leí el guion en voz alta: nada suena a página de ventas.
- Un extraño no sabría que es un anuncio antes de que aparezca el producto.
- Los 8 beats están, en orden, y cada uno lo dice quien corresponde; cada línea tiene su número de orden y su beat.
- El CTA tiene los 3 movimientos y termina en el endoso de A.
- El guion usa las palabras del cliente real que dio el usuario (o las que deduje del guion original en Paso 0).
- Hay un solo dato de prueba, y es el que el usuario dio como real.
- Cada bloque tiene su conteo de palabras y su duración pedida (4, 6, 8 o 10), y ninguno sale de la guía ni pasa de 26 palabras.
- Cada bloque de diálogo lleva el párrafo de "She says each line exactly as written, only once", y la marca que puede leerse mal tiene su pronunciación en el Delivery.
- Cada host tiene su generación de reacciones (8 s), escritas según lo que escucha, sin palabras, con sus tres reacciones numeradas: tres gestos distintos, cada uno con su sonido hecho con los labios cerrados, y la línea Audio con "No words in any language".
- Cada cutaway tiene su frase `tras`, textual; ninguno cae en la primera frase de un turno, todos dejan al menos unas cinco palabras del turno después y ninguno pisa un B-roll.
- Los dos prompts de imagen de los hosts están, en español, con A mirando a la derecha y B a la izquierda, B con rasgos concretos distintos, los dos con los hombros y los brazos dentro del cuadro, el micrófono más abajo que la boca y adornos sin letras.
- Hay 2 a 4 B-roll, entre la revelación y antes del CTA, con sus dos prompts completos, compuestos para su modo (franja del medio en pantalla dividida; lejos de la esquina del host en esquina) y el producto adjunto cuando aparece, quieto y como en la foto.
- Todos los bloques están completos. Ninguno termina con cola de calidad.
- El mapa de montaje cubre todas las líneas, todos los cutaways (con su frase) y todos los B-roll, con tiempo acumulado.
- El manifiesto quedó guardado en `temp/[slug]/manifiesto.json` y pasó el chequeo G.6; en el chat va solo el resumen corto y la pregunta A/B/C, sin el paquete ni el manifiesto.
