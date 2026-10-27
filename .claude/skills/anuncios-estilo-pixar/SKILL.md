---
name: anuncios-estilo-pixar
description: Genera anuncios publicitarios con IA en formato "estilo Pixar" (animación 3D cálida tipo Pixar/Disney en todas las tomas, con un narrador en voz en off que explica un mecanismo por capítulos con un giro narrativo) para marcas DTC/Ecommerce en Estados Unidos y Latinoamérica. Mismo proceso que Zack D Films, pero sin grid azul ni estudio limpio; el mecanismo se muestra como escena Pixar integrada en el mundo del anuncio (cuerpo translúcido, tejido, ingredientes). Acepta un guion ganador ya escrito. Usar SIEMPRE que el usuario pida un anuncio, video ad, guion o creativo "estilo Pixar", "anuncio Pixar", "animación Pixar con narrador", o mencione crear anuncios con IA sin especificar estilo (ofrecerlo como opción). No es el objeto parlante (ahí el producto habla en primera persona) ni historias musicales (ahí se canta). Arma guion en ES/EN/PT, prompts y el manifiesto interno; en el chat da un resumen corto y tres opciones (producirlo todo, solo imágenes y videos, o el paquete de prompts).
---

# Generador de Anuncios IA — Estilo Pixar

Convierte un producto en un anuncio completo estilo Pixar: guion por capítulos + prompts de imagen y video por cada toma + el manifiesto de producción con el que el pipeline genera las imágenes, los videos, la voz y el montaje. La skill no genera imágenes/video directamente (salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente): describe el anuncio; el motor lo produce. En esta versión del sistema, las imágenes y los videos los generas tú en Google Flow a partir de la cola que arma el motor, y solo después del Paso final. Interactúa siempre en español con el usuario, sin importar el idioma del anuncio.

## Cómo reconocer este estilo (para no confundirlo con Zack D Films, Talking Object ni historias musicales)

- **Animación 3D cálida estilo Pixar/Disney en TODAS las tomas**: personajes, ambientes, producto y mecanismo. No fotografía real, no plastilina, no esqueleto, no render clínico.
- **El mismo esqueleto narrativo que Zack D Films**: pregunta rara de apertura → revelación visual → explicación rápida → giro final. Narración rápida, casi conversacional, de un **narrador en voz en off**. Subtítulos que "rebotan" palabra por palabra ("Bounce captions"). El mismo personaje puede aparecer en varias escenas y lugares muy distintos.
- **La diferencia con Zack D Films está en el mecanismo**: allá las tomas de mecanismo van sobre un grid técnico azul o un estudio limpio, con un look semi-3D de plástico mate más frío que el resto. **Aquí eso no existe.** El mecanismo es una escena Pixar más, integrada en el mundo del anuncio: el cuerpo translúcido de la persona *en su cocina*, el tejido por dentro con luz cálida, los ingredientes como plantas y frascos sobre una mesa. Nunca se pregunta "qué tipo de fondo" porque solo hay uno: el mundo del anuncio.
- **Diferencia con Talking Object**: aquí nadie habla a cámara; una voz en off narra mientras la cámara salta de escena en escena. En Talking Object un objeto habla en primera persona con la boca sincronizada.
- **Diferencia con historias musicales**: aquí se narra, no se canta; el anuncio es corto (30 s en adelante) y lleva B-roll.
- **En el motor** es un estilo de `voz_en_off` igual que Zack D Films, con una sola diferencia de producción: **la música de fondo se genera con Suno** (`npm run musica`, vía kie.ai), no hay pista fija. Subtítulos, transiciones y efectos van como en cualquier estilo de voz en off.

## Paso 0 — Si el guion ya viene escrito (atajo)

**Este paso solo se activa cuando el guion llega de afuera. Si no llega ninguno, ignóralo entero y empieza por el Paso 1, como siempre.**

Se reconoce porque **el usuario pega un guion** que ya le funciona y pide convertirlo a este estilo ("tengo este anuncio ganador, pásamelo a Pixar"). Llega como texto corrido.

Este estilo **no recibe guiones de la skill de anuncios musicales**: esa skill delega solo en Crochet, Claymation y Zack D Films. Si algún día se quiere Pixar como destino musical, se copia el bloque "Si el guion viene de la skill de anuncios musicales" de zack-d-films con `estilo-pixar` y `modo_audio` `"musica"`, y se agrega Pixar a la lista de esa skill.

### Lo que NO haces cuando llega un guion

- **No escribes un guion nuevo, ni "mejoras" el que te dieron.** Sáltate el Paso 2 entero: el ángulo (2.2) y la mecánica (2.3) ya están resueltos dentro del texto que llegó.
- **No cambias una sola palabra del texto.** Puedes partirlo en líneas y decidir dónde corta cada toma; nunca reescribirlo, ni acortarlo, ni pulirlo. El usuario lo trajo porque ya le funciona.
- **No preguntas el ángulo, ni el mercado, ni el dolor, ni la oferta.** Todo eso ya está resuelto dentro del guion: dedúcelo leyéndolo.
- **No fuerces el guion dentro de los 4 capítulos del 2.1.** Si se divide naturalmente en ellos, márcalos y aprovéchalos para decidir los tipos de toma del 3.2. Si no, **respeta el guion**: la estructura de capítulos es una forma de escribir un guion propio, no un molde al que haya que doblar uno ajeno.

### Lo que SÍ haces, en este orden

1. Di **en una sola frase** qué ángulo y qué mercado leíste en el guion, para que el usuario te corrija si te equivocaste. No es una pausa: sigues de largo.
2. **Pregunta solo lo que el guion no resuelve y que de verdad te falte**: la foto del envase si el producto se ve y no la adjuntó, y el formato si no es el 9:16 por defecto. Si ya lo tienes, no preguntes nada.
3. Haz el desglose línea por línea del Paso 2.5 **sobre el texto que te dieron**.
4. De ahí en adelante, todo exactamente igual: ADN visual (3.1), prompts por capítulo (3.2) con su negativo universal, Start/End Frame (3.3), B-roll (3.4) y manifiesto (Paso 6).

---

## Paso 1 — Brief del producto

Si el usuario no lo dio todo, pregunta solo lo esencial en una sola tanda, siempre como texto abierto (no uses botones ni formularios, mantén la misma forma de preguntar para todos los campos) — no bloquees si ya es inferible del mensaje o de una imagen/link que compartió:
- Producto: nombre + qué es, y la **foto del envase** si el producto se va a ver (se prepara con `npm run preparar`, ver 6.6)
- Dolor/beneficio principal — idealmente algo con un mecanismo de acción visualizable
- Mercado/idioma: EE.UU. (inglés), LatAm (español — ¿qué país? ¿hay pago contra entrega?), Brasil (portugués), o varios
- Precio/oferta (descuento, envío gratis, garantía) — y si el usuario pide explícitamente que NO aparezca precio/descuento en el copy, respeta eso
- Formato/aspect ratio: vertical 9:16 por defecto, o el que indique

**No preguntes por el tipo de fondo de las tomas de mecanismo.** En este estilo no hay grid ni estudio: el mecanismo va dentro del mundo del anuncio (3.3), siempre.

## Paso 2 — Escribir el guion por capítulos

### 2.1 — Estructura en 4 capítulos (el guion debe dividirse naturalmente en estos)
1. **Personaje/situación**: alguien viviendo una situación cotidiana relacionada al problema.
2. **Producto**: toma del empaque real o estilizado, a veces con ingredientes cayendo/flotando alrededor.
3. **Mecanismo interno**: lo que pasa dentro del cuerpo (o dentro del objeto), contado como escena Pixar — el cuerpo translúcido de la persona con lo que se mueve por dentro, partículas e ingredientes con caritas expresivas viajando por un tejido cálido, luces doradas, sensación mágica. Integrado en el ambiente donde está la persona, nunca clínico ni frío.
4. **Resultado/payoff**: escena narrativa con la consecuencia social o emocional del beneficio, a veces con humor o un giro.

Si una línea del guion no encaja claramente en uno de estos 4 tipos, probablemente sobra o hay que fusionarla con la anterior.

### 2.2 — Ángulos ganadores

**Regla de elección — nunca le preguntes al usuario qué ángulo prefiere**: si no especifica nada, usa automáticamente el ángulo PRINCIPAL de abajo. Si el usuario da su propia idea o pide otro enfoque, sigue su instrucción en su lugar.

**PRINCIPAL — Problema oculto/mal entendido + revelación del mecanismo (default automático — el mismo patrón confirmado como ganador en Claymation y en los guiones reales del estilo Zack D Films: Viasox, Penrose, cubos afrodisíacos, masticables para perros):**

Estructura de 5 partes:
1. **Problema mal entendido o que parece superficial**: algo que la audiencia ve como normal/cosmético, no como un problema real ("podría parecer que es solo cómo se ven tus piernas ahora").
2. **Revelación de que hay algo más debajo**: "pero debajo de la superficie, algo está pasando" — el giro de atención hacia el mecanismo oculto.
3. **Mecanismo explicado con claridad** (aquí es donde más encaja el Capítulo 3 y el Start/End Frame — ver 3.3): cómo funciona el proceso real, a veces con una escalada dentro de la misma escena/día (ej. "piernas pesadas por la mañana, doloridas al mediodía, zapatos que no calzan por la noche" — la lógica de Día 1 → Día 30 comprimida en horas).
4. **Por qué lo obvio no alcanza / el giro hacia el producto**: "ahora imagina en cambio..." — el producto entra como la respuesta específica a ESE mecanismo, no una solución genérica.
5. **Resultado + CTA**: consecuencia clara, a veces con oferta específica (2x1, garantía).

**Otros ángulos (válidos si el usuario los pide, o como ganchos de apertura dentro del ángulo principal)**: mito vs. realidad, cifra shockeante como hook, comparación numerada, relato de descubrimiento (ej. "notó que sus cabras estaban raras desde que comieron la planta" — funciona cuando no hay un "problema oculto" claro que revelar, sino un hallazgo curioso que lleva al mecanismo).

### 2.3 — Mecánica de guion (loop + giro + escalada, aplicado a la estructura de capítulos)
1. **Hook con loop de curiosidad** (capítulo 1): pregunta extraña/curiosa de apertura que no se resuelve hasta el final.
2. **Revelación visual** (capítulo 2-3): el producto y su mecanismo se presentan como la respuesta.
3. **Explicación rápida** (capítulo 3): concreta, sin lenguaje corporativo.
4. **Giro final** (capítulo 4): el payoff cierra el loop del hook.

### 2.4 — Duración y presupuesto de palabras
Mínimo 30 segundos, sin techo fijo — más capítulos o capítulos repetidos si el producto lo amerita, no hay techo de 20-30 s (esa duración corta es del contenido orgánico del canal de Zack D Films, no una regla para nuestros anuncios). Si el usuario pide una duración específica, esa manda. Calcula el presupuesto de palabras: `duración objetivo en segundos × 2.4 palabras/segundo`.

> **Una duración pedida orienta el presupuesto de palabras; NO es un blanco al que haya que llegar.** Estos números son estimaciones: `÷ 2.4` es un promedio y cada voz habla distinto. En los anuncios reales de esta familia la voz salió entre un 6% y un 24% más corta que lo estimado. Que el anuncio termine durando 52 s en vez de 60 está bien y no hay nada que corregir — el montaje encaja cada toma contra los tiempos reales de la voz, acelerando unas y cortando otras. **Nunca agregues ni quites líneas para llegar a un número.** El guion dura lo que necesita durar para mostrar lo que muestra.

### 2.5 — Desglose línea por línea
Baja el guion a nivel de toma por línea — cada línea/beat tiene su propia toma visual sincronizada, asignada a uno de los 4 capítulos. La duración de cada toma es la duración real de decir esa línea (≈ palabras ÷ 2.4), no un número fijo.

**Chequeo antes de entregar la tabla — ninguna toma pasa de ~9-10 segundos.** El modelo de video no genera clips de más de 10 s, así que una línea que calcule por encima de eso no se puede producir: hay que **dividirla en dos tomas** y renumerar, nunca truncarla. Una línea así casi siempre es dos ideas metidas en una — el caso típico en este estilo es la escalada del punto 3 del ángulo principal ("pesadas por la mañana, doloridas al mediodía, no calzan de noche"), que son tres beats y por lo tanto tres tomas, no una.

Entrega el guion en esta tabla:

| # | Capítulo | Duración (calculada) | Línea de voz en off | Idea de texto en pantalla (solo para el editor — NUNCA va dentro de los prompts) | Descripción visual |
|---|---|---|---|---|---|

Antes de entregar, verifica: ¿el capítulo 1 / línea 1 es realmente el hook con el loop de curiosidad (no una descripción de escena suelta ni el giro adelantado)? Si no, corrígelo antes de responder.

**Postura al generar cada prompt**: actúa como un director de arte senior — expande visualmente cada línea para que se vea más rica e imaginativa de lo que el texto dice palabra por palabra, sin perder la idea central.

## Paso 3 — ADN visual y prompts

### 3.1 — ADN visual

Animación 3D de ALTA CALIDAD estilo Pixar/Disney **en todas las tomas sin excepción**: personajes cálidos y expresivos con subsurface scattering, iluminación cinematográfica cálida, profundidad de campo real, ambientes reconocibles con textura. NO es un estilo plano/clínico ni fotorrealista. Texto en pantalla: palabra por palabra o frases muy cortas reveladas progresivamente en sincronía con la voz (no bloque fijo), tipografía blanca gruesa con contorno oscuro — siempre en edición, nunca dentro de los prompts.

**Lo que este estilo prohíbe, y que sí existe en Zack D Films:**
- Ningún **grid técnico azul**, ningún **fondo de estudio limpio** (blanco, gris, crema), ningún degradado neutro de estudio. Ni en el mecanismo ni en ninguna otra toma.
- Ningún look **semi-3D de plástico mate** con "iluminación plana y clínica". El mecanismo se renderiza con el mismo Pixar cálido que el resto.
- Ningún **diagrama médico frío**. El mecanismo es una escena con luz, tejido y ambiente, no una infografía.

Y esas palabras **no van ni siquiera negadas dentro del prompt positivo** ("not clinical", "rather than a studio", "no grid"): el modelo pesa el término más que la negación. Lo que no se quiere va solo en el `Negative prompt:`.

La única excepción son las **hojas de referencia** del personaje y del producto (más abajo): van sobre una pared lisa, cálida y con textura —nunca blanca ni de estudio—, sin ambiente ni props, porque la hoja se propaga a todas las tomas y un ambiente ahí se arrastra.

**Ambiente real, en todos los capítulos (verifica esto toma por toma antes de entregar, en silencio, sin preguntarle al usuario)**: en el capítulo 1 (personaje/situación) y el capítulo 4 (resultado/payoff), el fondo siempre es un ambiente concreto y reconocible (casa, oficina, calle, gimnasio, lo que corresponda). En el capítulo 2 (producto), una superficie real del mundo del anuncio (la mesa de la cocina, la repisa del baño), no un ciclorama. En el capítulo 3 (mecanismo), el ambiente donde está la persona sigue ahí: el cuerpo translúcido se ve *sobre ella en su cocina* o como una visión en el aire junto a ella; el macro del tejido conserva la luz cálida de esa escena.

**Personaje recurrente — Character Bible (solo si hay).** Este estilo no exige un personaje fijo: muchos anuncios son puro mecanismo. Pero si el mismo personaje se repite en varios capítulos, defínelo **una vez** como hoja de referencia: va como entrada de `referencias` en el manifiesto (6.4) y cada toma donde aparece declara su `id`. Sin esto cambia de cara entre tomas. La hoja, en inglés, 6-10 oraciones, sin marco:

```
Vertical 9:16. Pixar-Disney style 3D animated character reference: [nombre], a [edad]-year-old [mujer/hombre] from [país], [3-4 rasgos de cara fijos: forma de cara, ojos, nariz, boca], [pelo: color, largo, peinado], [piel], [cuerpo y postura], wearing [ropa concreta y su color, que se repite en todo el anuncio salvo que el guion la cambie]. Standing in a relaxed neutral pose, three-quarter view, full body visible from head to feet, soft warm cinematic lighting, expressive Pixar face with subsurface scattering, plain warm-toned soft wall background with subtle texture in the same render style. The image is full-bleed and fills the entire frame edge to edge: no picture frame, no wooden frame, no diorama box, no border, no inset panel, no vignette. No text, captions or watermarks.

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

> **La hoja de referencia NUNCA lleva marco.** Encontrado el 2026-09-07 en el primer anuncio musical, en crochet, y le toca a cualquier estilo que genere una hoja de personaje: la hoja salió dentro de una caja de diorama con marco de madera, y ese marco **se arrastró a seis tomas**, apareciendo y desapareciendo entre cortes porque los primeros planos no lo heredaron. "Sin muebles ni props" no cubre un marco; hay que decirlo explícito y va **pegado dentro del prompt de la hoja**, no recordado. **Y el fondo NO se pide blanco vacío: es peor.** Está documentado con pruebas reales que un fondo neutro sin relación al mundo hace que el modelo invente un ambiente distinto en cada toma. El fondo va liso, cálido y con la textura del estilo — lo que se prohíbe es el marco, no el ambiente. **La hoja es lo que más se propaga de todo el anuncio**: lo que salga en ella aparece en cada toma que la use, y arreglarlo después cuesta regenerar imagen y clip de cada una.

**El producto en Pixar (si el usuario dio foto del envase).** El envase real se convierte en una hoja Pixar fiel a la etiqueta, que el motor genera **desde la foto del usuario** (entrada `producto` del manifiesto con `generar_desde_archivo: true`, ver 6.4) y después adjunta a todas las tomas que declaren `producto`. **Antes de escribir el prompt, lee la etiqueta en la foto y dicta su texto literal, línea por línea y entre comillas, dentro del prompt.** Medido el 2026-09-14 con Goli: con la foto adjunta y el prompt genérico ("same label design, colors and text") el modelo reescribió la etiqueta ("B-Vitamins", "30" en vez de "Elderberry Extract", "60") y cambió el color de las gomitas; con el texto dictado la copió exacta al primer intento. Adjuntar la foto fija la forma, los colores y el logo grande; el texto chico solo sale bien si está escrito en el prompt. Esa hoja se adjunta después a todas las tomas con envase, así que un error aquí se repite en cada una.

```
Vertical 9:16. Pixar-Disney style 3D render of the exact product in the reference photo: [forma y material del envase, color de la tapa, color del contenido si se ve, color y disposición de la etiqueta]. Same shape, same proportions, same label design, colors and text as the photo. The label text must be copied exactly, letter for letter, from the photo, with no words changed, added or removed: [el texto de la etiqueta, de arriba abajo, cada línea entre comillas]. Rendered as a clean stylized 3D object resting naturally on [una superficie del mundo del anuncio: a warm wooden kitchen table / a bathroom shelf] with a soft contact shadow, soft warm cinematic lighting, shallow depth of field. The label text must be as sharp and legible as in the photo. The image is full-bleed and fills the entire frame edge to edge: no frame, no border, no vignette. No additional text, captions or watermarks.

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting, altered label text, misspelled words, invented ingredients
```

"No additional text" nunca significa borrar el texto de la etiqueta: es parte del producto y se dicta literal; lo que se prohíbe son textos ajenos (subtítulos, marcas de agua, leyendas). Si el usuario no dio foto, la entrada `producto` no existe y ninguna toma la declara: el envase se describe en el prompt de la toma.

### 3.2 — Prompts por tipo de capítulo

**Regla de formato obligatoria**: cada bloque de prompt debe llevar su etiqueta como encabezado **fuera del bloque de código** — `**Imagen:**` antes del prompt de imagen, `**Video:**` antes del prompt de video — nunca entregues los bloques uno después de otro sin identificar cuál es cuál. Aplica igual en tomas principales y B-roll.

**Fidelidad del producto real (si el usuario adjuntó una foto del envase)**: el producto debe conservar exactamente su forma, proporciones y diseño de etiqueta reales en el capítulo 2 — nunca alargarlo, ensancharlo ni deformarlo. Cada toma con envase nombra la hoja del producto ("the exact product from the reference image") y declara `producto` en sus `referencias`. **Aclaración importante sobre "no text" (error confirmado que ya pasó antes)**: la instrucción "no additional text/captions/watermarks" se refiere a que la IA NO agregue texto, subtítulos o marcas de agua extra a la imagen — nunca a borrar el texto real que ya es parte del diseño de la etiqueta del producto. Si notas que una imagen generada borró o distorsionó el texto real de la etiqueta, es un error de la herramienta de generación, no algo que el prompt esté pidiendo.

**El aspect ratio va en palabras al principio, nunca como parámetro.** Nada de `--ar 9:16`, `--v 6`, `--style`: el motor manda el prompt tal cual al generador, y un flag de Midjourney pegado en el texto llega literal a un modelo que no lo entiende y lo trata como parte de la descripción. `Vertical 9:16` en palabras sí lo entienden todos, y es lo que usa el resto de la familia de skills.

> **La etiqueta `Negative prompt:` NO es un flag y se queda.** Un flag como `--ar` no es lenguaje: llega al modelo y no significa nada. `Negative prompt:` sí es lenguaje, y es la convención que le dice al modelo dónde empieza la lista de lo que NO debe aparecer. Ninguno de estos modelos tiene un campo aparte para el negativo —`nano-banana-2` recibe un solo texto—, así que **el prompt entero se pega junto, etiqueta incluida**, y esa etiqueta es lo único que separa lo que se quiere de lo que no. Quitarla haría que `text, labels, hands` se leyeran como cosas a incluir. Decidido el 2026-09-06, después de que se hubiera cambiado por error a `Avoid:` — no volver a tocarla.

### Negativo universal — va al final de CADA prompt de imagen, sin excepción

**Se pega tal cual, con su etiqueta, en todas las imágenes: tomas principales, B-roll, hojas y producto.** No hay excepciones por tipo de toma.

```
Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

> **De dónde salió, y por qué no lleva nada más.** Se sacó de los fallos del primer anuncio real de Zack D Films (Goli Immune, 2026-09-06): generar, mirar las tiras, y convertir lo que falló en una línea. Lo que falló fue exactamente esto — **B-roll y tomas de personaje salieron como fotografías**: poros, arrugas, hebras de pelo reales, luz de estudio. Las únicas tomas que salieron estilizadas fueron las que ya llevaban `no photorealism` en su negativo. **Y sí va también en las tomas de producto**: la toma 12 de ese anuncio lleva `no photorealism` en su negativo **y** su etiqueta salió perfectamente legible. Un render 3D estilizado sostiene un texto nítido.

**Colas del negativo.** El universal va siempre; en dos casos se le pega una cola al final de la misma línea:

- **Todas las tomas Tipo B** (el mecanismo del capítulo 3 y las transformaciones de producto del capítulo 2) **y todo B-roll de mecanismo**, porque son las tomas donde el modelo tiende a irse al look técnico:

```
, blue grid, technical grid background, clean studio backdrop, plain white background, medical diagram, infographic, flat clinical lighting, plastic toy look
```

- **La hoja del producto** (3.1), porque lo que falla ahí es la etiqueta:

```
, altered label text, misspelled words, invented ingredients
```

**Capítulo 1 — Personaje/situación**:
```
Vertical 9:16. Pixar-Disney style 3D animation render, [personaje y situación cotidiana relacionada al problema — si hay hoja, "the woman from the reference image"], warm cinematic lighting, expressive facial detail, realistic-stylized environment ([lugar concreto]), shallow depth of field, subsurface scattering, vibrant warm color palette, octane render, 8k, ultra-detailed, no additional text, captions, or watermarks overlaid on the image

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

**Capítulo 2 — Producto**:
```
Vertical 9:16. Pixar-Disney style 3D animation render, [el producto — "the exact product from the reference image" si hay hoja], resting naturally on [superficie del mundo del anuncio] with related elements floating or falling around it ([ingredientes, gotas, hojas]), warm cinematic lighting, shallow depth of field, octane render, 8k, no additional text, captions, or watermarks overlaid on the image

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

**Capítulo 3 — Mecanismo interno (escena Pixar integrada en el mundo)**:

Dos formas de mostrarlo, y se eligen según la línea:

- **El cuerpo translúcido en su ambiente**: la persona (o la parte del cuerpo que importa: las piernas, el vientre, la garganta) se vuelve translúcida como cristal cálido *donde está* — de pie en su cocina, sentada en el sofá — y por dentro se ve lo que pasa: los vasos atascados, el tejido inflamado, las partículas del ingrediente viajando y encendiendo lo que tocan. El ambiente sigue ahí, desenfocado y cálido. Si hay hoja del personaje, esta toma la declara.
- **El macro del tejido con luz de la escena**: un plano muy cerrado dentro del cuerpo o del objeto, tejido semitransparente de tonos cálidos, partículas o moléculas con caritas expresivas, luz dorada y suave, como un mundo Pixar en miniatura. Nunca sobre negro, nunca sobre un fondo de estudio. Va con `referencias: []`.

```
Vertical 9:16. Pixar-Disney style 3D animation render, [la persona — si hay hoja, "the woman from the reference image" — / la parte del cuerpo] shown as a warm translucent glass-like body standing in [el ambiente concreto de la escena: her sunlit kitchen, the living room], revealing inside [el proceso: sluggish golden-brown fluid stuck in the vessels / tiny glowing ingredient particles with subtle expressive faces traveling through warm tissue and lighting it up], soft golden inner glow, warm cinematic lighting matching the room, shallow depth of field, subsurface scattering, magical premium feel, octane render, 8k, no additional text, captions, or watermarks overlaid on the image

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting, blue grid, technical grid background, clean studio backdrop, plain white background, medical diagram, infographic, flat clinical lighting, plastic toy look
```

Y el macro del tejido, cuando la línea pide entrar del todo:
```
Vertical 9:16. Pixar-Disney style 3D animation render, extreme close-up inside [el tejido / el vaso / el órgano / el interior del objeto], warm semi-translucent tissue filling the frame edge to edge, [tiny glowing ingredient particles with subtle expressive faces / thick golden-brown sludge / narrowed channels] [lo que hacen: squeezing through, lighting up what they touch, draining away], soft golden inner glow with the warm light of [la escena: the kitchen at dusk] filtering through, dramatic macro depth of field, subsurface scattering, magical premium feel, octane render, 8k, no additional text, captions, or watermarks overlaid on the image

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting, blue grid, technical grid background, clean studio backdrop, plain white background, medical diagram, infographic, flat clinical lighting, plastic toy look
```

**Capítulo 4 — Resultado/payoff**:
```
Vertical 9:16. Pixar-Disney style 3D animation render, [escena de resultado social/emocional relacionada al beneficio], warm cinematic lighting, expressive characters, shallow depth of field, subsurface scattering, octane render, 8k, no additional text, captions, or watermarks overlaid on the image

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

**Prompt de video** (image-to-video, a partir de cualquiera de las 4 tomas anteriores — describe SOLO movimiento):
```
Pixar-Disney style 3D animation, image-to-video from the shot above, [DURACIÓN]s. Vertical 9:16.
Camera: [un solo movimiento, ej. "slow push-in" / "gentle pan" / "static"]
Motion: [una sola acción propia de esa toma]
Lighting: warm cinematic glow
```

### 3.3 — Start/End Frame: cuándo usarlo y cómo decidirlo (la IA decide sola, nunca presenta opciones al usuario)

**Criterio de uso**: usa el par Start Frame/End Frame en las tomas del **Capítulo 3 (mecanismo interno)** y en tomas de **transformación del producto** (ej. el frasco cerrado → el frasco abierto con la gota cayendo) — son las tomas donde mostrar un cambio de estado físico comunica más que un movimiento de cámara. Usa imagen + video normal (Paso 3.2) en las tomas de **Capítulo 1 (personaje/situación)**, **Capítulo 2 sin transformación (el producto quieto)** y **Capítulo 4 (resultado/payoff)**, donde lo que importa es la acción/emoción, no un cambio de estado.

**Tú eliges la toma internamente — nunca le presentes 2-3 opciones al usuario para que elija.** Analiza qué cambio de estado antes→después comunica mejor esa línea del guion, y entrégalo directo como parte del resultado completo.

**Nota sobre por qué suelen salir agrupadas**: no hay una regla que fuerce a las tomas Start/End Frame a estar consecutivas — es una consecuencia natural de que el Capítulo 3 normalmente ocupa un tramo continuo del guion. Si el guion tiene líneas de mecanismo repartidas en distintos momentos, las tomas Start/End Frame pueden aparecer separadas igual.

**El fondo es el mundo del anuncio, siempre.** No hay opción A ni opción B: el START y el END de una toma de mecanismo son la misma escena Pixar del capítulo 3 (3.2) en dos estados. Ejemplos de par: los vasos de las piernas translúcidas atascados de lodo dorado → drenando y brillando; el tejido opaco e inflamado → luminoso y calmado; el frasco cerrado sobre la mesa → abierto con la gota cayendo; la cara hinchada en el espejo del baño → con la mandíbula marcada.

**Especificidad obligatoria de cada prompt** (5-7+ oraciones completas, nunca frases genéricas sin desarrollar): qué es el sujeto, su estado físico exacto, el ambiente concreto donde está, dirección y calidez de la luz, ángulo y distancia de cámara, relaciones espaciales, cómo se evita el fotorrealismo. Entre el Start y el End Frame: mismo ángulo, mismo encuadre, misma luz, mismo ambiente, misma paleta — SOLO cambia el estado físico del sujeto. Nunca describas al sujeto flotando — siempre "descansando naturalmente sobre [la superficie o el suelo de la escena: la mesa de la cocina, el piso del baño], con sombra de contacto suave".

**Plantilla — el START y el END van en DOS bloques de código separados**, cada uno con su etiqueta como encabezado FUERA del bloque, igual que el resto de la skill (Paso 3.2 y punto 4 del Paso 5). Nunca los metas en un mismo bloque, y nunca dejes la etiqueta dentro del código: si `**START FRAME:**` queda adentro, se copia al generador como parte del prompt.

El **negative prompt va dentro del bloque del END FRAME**, al final, nunca suelto ni después del prompt de video — **con su etiqueta `Negative prompt:` y todo**: es el negativo universal más la cola de mecanismo del 3.2. No hay campo aparte para el negativo en ningún modelo de los que se usan: el bloque entero se copia y se pega junto, y la etiqueta es lo que marca dónde empieza lo que no se quiere.

**START FRAME:**
```
Vertical 9:16. Pixar-Disney style 3D animation render. [Sujeto: la persona translúcida / la parte del cuerpo / el frasco] [estado físico inicial, en detalle] [el ambiente concreto del mundo del anuncio donde está, con su luz: her kitchen with late-afternoon light through the window] [dirección y calidez de la luz] [ángulo y distancia de cámara] [relación espacial, sombra de contacto suave, nunca flotando] Warm cinematic lighting, subsurface scattering, shallow depth of field, magical premium feel, stylized realism only, never photorealistic, no additional text or captions or watermark overlaid on the image
```

**END FRAME:**
```
Vertical 9:16. Pixar-Disney style 3D animation render. [La misma escena palabra por palabra — mismo sujeto, cámara, encuadre, ambiente, luz, paleta] [solo cambia la descripción del estado físico a su estado final] Warm cinematic lighting, subsurface scattering, shallow depth of field, magical premium feel, stylized realism only, never photorealistic, no additional text or captions or watermark overlaid on the image

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting, blue grid, technical grid background, clean studio backdrop, plain white background, medical diagram, infographic, flat clinical lighting, plastic toy look
```

**Video:**
El prompt de video va en un TERCER bloque, aparte, nunca mezclado con los dos anteriores, con esta cabecera (no la de "from the shot above" del 3.2):
```
Pixar-Disney style 3D animation, image-to-video from the START frame to the END frame, [DURACIÓN]s. Vertical 9:16.
Camera: static
Motion: [la transición entre los dos estados, una sola]
Lighting: warm cinematic glow
```
`Motion` describe la transición entre los dos estados ("the golden sludge in the vessels loosens and drains away as the channels light up"); el motor genera el clip con el START como primer frame y el END como último.

### 3.4 — Bloque de B-roll (aparte, al final — CON ubicación exacta, no genérica)

**Genera un B-roll por cada toma principal — la misma cantidad, 1 a 1.** Cada B-roll debe indicar explícitamente **dónde va**: después de qué toma y sincronizado con qué línea/idea exacta. Nunca entregues el B-roll como lista suelta — ese criterio es tu trabajo. **Nunca presentes el B-roll en formato de tabla** (esto ha pasado antes y es un error) — cada B-roll lleva su prompt de imagen y su prompt de video en bloques de código separados con etiqueta `**Imagen:**` / `**Video:**`, exactamente el mismo formato que las tomas principales, nunca comprimido en columnas.

**El B-roll de mecanismo usa el mismo bloque Pixar del capítulo 3** (3.2), con su cola de negativo. En Zack D Films hay dos looks de mecanismo —el B-roll cálido y las tomas principales clínicas— y **aquí hay uno solo**: no existe un B-roll "científico" distinto del resto del anuncio.

**Si en un B-roll aparece el personaje —o una parte de él: una mano sosteniendo algo, la persona de espaldas, sus pies— ese B-roll nombra la hoja en el prompt y declara el `id` del personaje en sus `referencias` (6.4).** Si no, sale otra persona, y se nota al corte. Lo mismo con el envase: si aparece, declara `producto`. Los B-roll que no muestran ni al personaje ni al producto van con `[]`.

**Visualiza la oferta concretamente**: cuando la línea de CTA (capítulo 4) mencione envío gratis, pago contra entrega, o garantía, ilustra ese detalle de forma concreta (ej. un repartidor entregando el paquete en la puerta) en vez de un plano genérico del producto.

**Regla de consistencia al reordenar o editar**: si insertas, eliminas, reordenas o editas una toma después de haber numerado el guion, **renumera TODAS las referencias cruzadas y recalcula la duración de cada línea afectada antes de responder** — no solo la tabla del guion. Nunca digas "las demás tomas quedan igual, solo se corren un número" sin efectivamente reescribir cada referencia.

## Paso 4 — Localización por mercado (afecta CTA, texto en pantalla y tono — NO los prompts visuales)
- **Estados Unidos** (inglés, checkout directo): urgencia por stock/tiempo, prueba social cuantificada, CTA "Shop Now"/"Get Yours Today".
- **LatAm** (español, con contra-entrega): mencionar explícitamente "paga cuando lo recibas"/"pago contra entrega" si aplica, envío a todo el país. Si el usuario pide que NO aparezca precio/descuento, respétalo. Español neutro salvo país específico.
- **Brasil** (portugués): Pix/parcelamento si aplica, tono cálido y directo.

## Paso 5 — Formato de entrega final

**Regla no negociable**: arma SIEMPRE el paquete completo (guion por capítulos + todas las tomas + B-roll 1:1 + overlays + guion de voz en off para ElevenLabs + herramientas), desde el primer intento y con todos sus chequeos — nunca solo una toma de muestra, nunca omitas el guion limpio de voz en off. **Pero al terminar no lo muestres en el chat**: queda interno, en el manifiesto (Paso 6), y en el chat va solo el resumen corto y las tres opciones del Paso final. El paquete se entrega en el chat cuando el usuario elige la opción C o pide verlo entero, y entonces va completo: nunca una muestra, nunca "¿quieres que te dé el resto?". Si pide solo una parte, se le muestra esa parte, copiada del manifiesto (Paso final). Si no especificó duración, usa el mínimo de 30 s y avísale en el resumen que puede pedir más.

Cuando se entrega (opción C del Paso final), va con esta estructura:
1. Ángulo elegido y cómo se reparte en los 4 capítulos (2-4 líneas) — declara el loop de curiosidad y dónde ocurre el giro
2. Hojas de referencia: Character Bible (solo si hay personaje recurrente) y hoja Pixar del producto (solo si dio foto), con sus prompts
3. Tabla de guion línea por línea con capítulo y duración calculada — indica también qué tomas usan Start/End Frame (Capítulo 3 y transformaciones de producto) vs. imagen+video normal (Capítulo 1 y 4)
4. Por cada toma: su prompt correspondiente (Start/End Frame + negative prompt, o imagen+video normal) en bloques de código separados, cada uno con su etiqueta, y qué referencias declara
5. Bloque aparte de B-roll (1 por cada toma principal, misma cantidad) con ubicación exacta
6. Notas de overlays/texto en pantalla palabra-por-palabra (nunca dentro de los prompts)
7. **Guion de voz en off limpio, listo para copiar y pegar directo en ElevenLabs** — solo las líneas habladas en orden, sin numeración, sin marcas de tiempo, en un bloque de código aparte. Obligatorio desde la primera entrega.
8. Herramientas recomendadas: Imagen — Nano Banana Pro, Midjourney, GPT Image (Capítulos 1/2/4); Nano Banana/Seedream (mejor consistencia entre Start/End Frame casi idénticos, Capítulo 3). Video — Kling 2.x/3.0 (soporta start/end frame nativo), Veo 3, Seedance, Runway Gen-4. Overlays — CapCut (plantillas de "karaoke caption") o Premiere. Voz — ElevenLabs, tono cercano y cálido; las voces son multilingües, el idioma lo pone el texto.

El **manifiesto de producción (Paso 6) no va en esta entrega**: se escribe en su archivo y nunca se muestra en el chat, ni siquiera en la opción C.


---

## Paso 6 — Manifiesto de producción (JSON)

Este paso es **aditivo y no cambia nada de lo anterior**: el paquete del Paso 5 se arma exactamente igual. Además, escribes un manifiesto JSON en su archivo (6.1). **El manifiesto es interno del sistema: nunca se muestra en el chat**, ni siquiera cuando se entrega el paquete en la opción C.

**Para qué sirve**: el manifiesto es el único punto de contacto entre esta skill y el pipeline de producción, que lee ese archivo y genera las imágenes, los videos y el audio, y arma el montaje automáticamente. Tú no ejecutas nada de eso ni sabes nada de APIs — solo describes el anuncio en JSON.

**Regla de fidelidad**: los prompts del manifiesto son **exactamente los mismos** que armaste siguiendo los Pasos 3.1, 3.2, 3.3 y 3.4, carácter por carácter, y el manifiesto es la fuente de verdad: cuando le muestres al usuario el paquete o una parte (opción C, o si lo pide), copia los prompts del manifiesto carácter por carácter. Si un prompt que le mostraste difiere del manifiesto, el video final no será el que él aprobó.

### 6.1 — Dónde va

Siempre en el archivo `temp/[slug-del-anuncio]/manifiesto.json`, donde `[slug-del-anuncio]` es el nombre del producto en kebab-case. Después de escribirlo y de pasar la verificación del 6.5, valídalo con `npm run validar -- temp/[slug-del-anuncio]/manifiesto.json` antes del Paso final y corrige lo que marque. Si lleva foto del producto, déjala lista tú antes de validar (6.6); si no sabes dónde está y todavía no está en la carpeta del anuncio, el error de que falta ese archivo es esperable: se resuelve cuando te la pase; cualquier otro error se corrige antes del resumen. **Nunca en el chat**: ni en un bloque `json` de la respuesta, ni en la opción C. En el resumen del Paso final basta con media línea que diga que quedó guardado y validado.

### 6.2 — Estructura

```json
{
  "estilo": "estilo-pixar",
  "modo_audio": "voz_en_off",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "referencias": [
    {
      "id": "protagonista",
      "tipo": "personaje",
      "prompt": "[la hoja de personaje del 3.1, SOLO si hay personaje recurrente. Si no lo hay, esta entrada no existe]"
    },
    {
      "id": "producto",
      "tipo": "producto",
      "archivo": "producto.png",
      "generar_desde_archivo": true,
      "prompt": "[la hoja Pixar del envase del 3.1, con el texto de la etiqueta dictado y su negativo]"
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
      "prompt_video": "[prompt de video de la transición]",
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
| `estilo` | Siempre `"estilo-pixar"`. |
| `modo_audio` | Siempre `"voz_en_off"` — narrador único, generado aparte. |
| `mercado` | Del Paso 1/4: `"EEUU"`, `"LatAm"` o `"Brasil"`. |
| `idioma` | `"en"`, `"es"` o `"pt"`, según el mercado. |
| `aspect_ratio` | Del Paso 1. Por defecto `"9:16"`. |
| `referencias` | La lista de referencias del anuncio: **el personaje recurrente solo si lo hay** — muchos anuncios de este estilo son puro mecanismo y no tienen ninguno — y **el producto** si el usuario dio foto, con `generar_desde_archivo: true` y su hoja Pixar como `prompt`. Ver 6.4. |
| `tomas[].n` | El número de toma de la tabla del guion, consecutivo desde 1. |
| `tomas[].tipo` | **`"B"` en las tomas de Capítulo 3 (mecanismo interno) y en las de transformación del producto** — las que llevan Start/End Frame según el Paso 3.3. **`"A"` en las de Capítulo 1, Capítulo 2 y Capítulo 4**, que van con imagen + video normal. La excepción: una toma de Capítulo 2 que muestre el producto **transformándose** (cerrado → abierto, apagado → activo) sí es `"B"`. |
| `tomas[].duracion` | La duración calculada en el Paso 2.4 (palabras ÷ 2.4), **redondeada a un decimal** (5.8, nunca 6). |
| `tomas[].linea` | La línea de voz en off de esa toma, exactamente como está en la tabla. |
| `tomas[].prompt_imagen_inicial` | En Tipo B: **el START FRAME**. En Tipo A: el prompt de imagen del capítulo correspondiente (Paso 3.2). |
| `tomas[].prompt_imagen_final` | En Tipo B: **el END FRAME**, con su negative prompt incluido tal como lo escribiste en el 3.3. En Tipo A: `null`. |
| `tomas[].prompt_video` | El prompt de video completo. |
| `tomas[].referencias` | Ver 6.4. |
| `broll[]` | Uno por cada toma principal (Paso 3.4). |
| `voz_en_off` | El guion limpio del punto 7 del Paso 5, idéntico. |
| `overlays` | Las notas de texto en pantalla del punto 6 del Paso 5 (`momento`: `"inicio"`, `"mitad"` o `"final"` de la toma). Array vacío `[]` si no hay. El motor **no los dibuja**: los valida y los lista en `plan-montaje.txt` para quien monte en CapCut; los subtítulos de la voz sí los pone el pipeline. |

### 6.4 — Separar el bloque Start/End, y el campo `referencias`

**Al pasar una toma de Capítulo 3 al manifiesto, separa el bloque.** En el paquete (lo que se le entrega al usuario en la opción C) el START FRAME y el END FRAME van en dos bloques de código con su etiqueta (Paso 3.3). En el manifiesto van en **dos campos distintos**: `prompt_imagen_inicial` y `prompt_imagen_final`. El negative prompt viaja dentro de `prompt_imagen_final`, igual que en la entrega.

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
| `generar_desde_archivo` | `true` solo en el producto: el motor genera la hoja Pixar del `prompt` **usando el `archivo` como referencia**, y esa hoja es la que se adjunta a las tomas. Es la única entrada que lleva `archivo` y `prompt` a la vez. |

En cualquier otra entrada, `prompt` y `archivo` son excluyentes: una tiene uno o el otro, nunca los dos.

**Qué emite este estilo normalmente:**

- **El producto**, con `archivo`, `generar_desde_archivo: true` y su hoja Pixar como `prompt`, si el usuario dio foto del envase (3.1).
- **El personaje recurrente SOLO si lo hay.** Muchos anuncios de este estilo son puro mecanismo y su lista es únicamente el producto. Si el guion sí repite un personaje entre capítulos, emítelo con su hoja como `prompt`.
- **Lo que haga falta**: si un objeto o un lugar concreto reaparece entre capítulos (la parada del bus donde abre y cierra el loop), va como una entrada más. La hoja de un **escenario** es el lugar **vacío de personas**, en plano general, con la luz de la escena y en el mismo render Pixar (aquí sí va el ambiente: la hoja *es* el ambiente); las tomas lo nombran "the bus stop from the reference image" y declaran su `id` junto con los demás.

**Las tomas de mecanismo del Capítulo 3 declaran al personaje cuando se ve su cuerpo translúcido** (es la misma persona, tiene que reconocerse); **el macro del tejido va con `[]`**, porque no muestra a nadie.

En las tomas, además de los `id` de la lista, hay **un valor reservado**:

- `"frame_anterior"` — no apunta a la lista, apunta al frame de la toma anterior. Úsalo solo cuando la continuidad entre dos tomas importe de verdad.

Array vacío `[]` si la toma no necesita ninguna referencia.


### El B-roll declara sus referencias igual que una toma

**Si en un B-roll aparece el personaje —o una parte de él: una mano sosteniendo algo, la persona de espaldas, sus pies, un detalle de ella usando el producto—, ese B-roll TIENE que incluir el `id` del personaje en sus `referencias`. Si no lo incluyes sale otra persona, y se nota al corte.**

Lo mismo con el producto: **si el envase aparece en un B-roll, ese B-roll declara `producto`**, o sale un envase inventado.

Los B-roll que no muestran ni al personaje ni al producto —macro de una textura, el mecanismo por dentro, un objeto suelto, un ambiente— van con `[]` y esta regla no les aplica.

> **De dónde sale.** La regla existía escrita solo en la skill de UGC, y UGC es el único anuncio de la familia donde los B-roll la cumplieron al 100% (5 de 5). En los demás no estaba escrita y se nota en los números: crochet declaró referencias en 2 de 16 B-roll, skeleton en 2 de 11, y el primer zack-d en 1 de 16 — donde un B-roll de la mano del personaje salió con **otra mujer**, con otro pelo, otra cara y un anillo que el personaje no tiene. Replicada a todas las skills el 2026-09-06.


En las tomas Tipo B **no declares nada para el frame final**: la capa de producción siempre le pasa el frame inicial como referencia al generar el final.

### 6.5 — Verificación antes de entregar

1. ¿Hay una entrada en `tomas` por cada fila de la tabla del guion, y los `n` coinciden?
2. ¿Hay un B-roll por cada toma principal?
3. ¿**Las tomas de Capítulo 3 y de transformación tienen `tipo: "B"` con su `prompt_imagen_final`**, y las de Capítulo 1, Capítulo 2 sin transformación y Capítulo 4 tienen `"A"` con `null`? Debe coincidir con lo que declaraste en el punto 3 del Paso 5.
4. ¿Separaste el START y el END en dos campos, en vez de meter el bloque entero en uno?
4b. ¿Cada `id` que declaran las tomas existe en la lista de `referencias`?
5. ¿Cada prompt del manifiesto es idéntico, carácter por carácter, al que armaste en el paquete (Pasos 3.1 a 3.4)?
6. ¿Las `linea` de todas las tomas, en orden, dan el mismo texto que `voz_en_off`?
7. ¿**Ninguna toma ni B-roll menciona grid, estudio, fondo blanco ni look plástico** como algo a incluir (las hojas del 3.1 llevan su pared lisa cálida, y eso está bien), y **todas las tomas Tipo B y todo B-roll de mecanismo llevan la cola de negativo del 3.2**, y la hoja del producto la suya?
8. ¿El JSON es válido? Comillas dobles, sin comas colgando.

### 6.6 — La foto del producto (nunca inventes el nombre del archivo)

El `archivo` de la entrada del producto es el nombre de un archivo que **tiene que existir de verdad** en la carpeta del anuncio. Si escribes ahí un nombre inventado a partir de la marca, el pipeline se detiene, o peor, genera un envase inventado.

- Si el usuario dio foto → la entrada del producto existe, con `"archivo"` = **el nombre que dejó `preparar-producto.js`**: `producto.png` si la foto ya venía en PNG, `producto.jpg` si venía en JPG o hubo que convertirla. Mira la carpeta antes de escribirlo; si todavía no se corrió el comando, escribe `producto.jpg` y el comando lo corrige en el manifiesto.
- Si no dio ninguna → **la entrada del producto simplemente no está en la lista**, y ninguna toma ni B-roll puede declararla.

**La foto la dejas lista tú**, apenas escribiste el manifiesto y antes de validarlo (6.1), si sabes dónde está: la ruta que te dio el usuario, o la imagen que pegó en el chat (la lees en su ruta local). La ruta va tal cual, aunque sea `.webp` o `.heic` o tenga espacios en el nombre:

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug-del-anuncio]
```

El comando la copia a la carpeta del anuncio, la convierte si hace falta, y deja el nombre correcto escrito en el manifiesto. Si no sabes dónde está, en el resumen del Paso final pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando, y córrelo tú apenas la tengas. Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. **Ningún comando va en el mensaje del Paso final.**

## Paso final — Pregunta cómo quiere producirlo

Ya armaste el paquete completo (guion, prompts de cada toma, B-roll, texto en
pantalla y guion de voz) y el manifiesto quedó guardado y validado (6.1). **Nada de
eso se muestra en el chat**: el paquete queda interno, en el manifiesto, y el
manifiesto no se muestra nunca. **Ahora, y solo ahora, dale al usuario un
resumen corto y pregúntale cómo quiere seguir.**

El resumen va en 1 a 3 líneas: el estilo, el producto, el mercado y el idioma,
cuántas tomas y cuántos B-roll, y la duración aproximada. Si hay una decisión
que conviene que sepa, súmale **una** línea con ella (por ejemplo: "Agregué
'Pagas al recibirlo' en el cierre por el pago contra entrega"). Nada más: ni la
tabla del guion, ni prompts, ni el JSON, ni ningún comando (la foto del
producto la dejas lista tú: 6.6).

No lo decidas tú: las tres salidas son legítimas y cuestan cosas distintas.

```markdown
**Anuncio estilo Pixar — [producto], [mercado] ([idioma]).** [N] tomas y
[N] B-roll, unos [N] segundos. [La decisión que conviene que sepas, si la hay.]
El manifiesto quedó guardado y validado[, salvo tu foto del producto: pásamela
(arrástrala al chat o dime la ruta) y la dejo lista].

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero las imágenes y los videos en Google Flow,
armo el montaje y te entrego el MP4 terminado. Antes de gastar nada te digo lo
que cuesta: los créditos de Flow de los videos (las imágenes no gastan
créditos) y la música, que se paga en kie.ai.

**B) Genera solo las imágenes y los videos** — los genero en Google Flow y te
los dejo en su carpeta, listos para que los montes tú en CapCut a tu gusto.
También te digo antes los créditos de los videos y el costo de la música.

**C) Entrégame el paquete de prompts** — te paso aquí el guion por capítulos,
las hojas de referencia, los prompts de imagen y video de cada toma, el B-roll,
los textos en pantalla y el guion de voz para ElevenLabs, para que los revises
o los produzcas a mano. Después, si quieres, seguimos con A o B.
```

### En esta versión, las imágenes y los videos se hacen en Google Flow

`npm run imagenes` y `npm run videos` ya no generan ni cobran nada: arman una
lista de trabajo (la "cola") y **los generas tú en Google Flow**, manejando
Chrome con la extensión Claude in Chrome. Esa extensión es el MCP conectado, y
elegir A o B es el pedido explícito que exigen la introducción y las reglas del
final para que generes imágenes y video tú mismo.

Donde el proceso (el de `COMO-PRODUCIR.md` en la opción A, o la lista de la
opción B) dice `npm run imagenes` o `npm run videos` —con `--solo-plan`, `--si`
o el costo de kie.ai—, va este ciclo, en ese mismo lugar del orden. Todo lo
demás (validar, voz, música, transiciones, plan, ensamblar) sigue igual:

1. `npm run imagenes -- temp/[slug]` arma la cola
   (`temp/[slug]/flow/cola-imagenes.json`) y hace solo lo que no necesita Flow
   (las copias de frames).
2. Genera la cola en Google Flow con la skill **`flow-generacion`**: ahí está
   todo el procedimiento (ventana aparte, subir las referencias, enviar todo,
   reintentos, descargar cada archivo con su nombre). Las paradas propias de
   Flow que pide esa skill (el permiso de descarga de cada tanda, y el inicio
   de sesión o los captchas, que hace el usuario) van siempre.
3. `npm run flow:recibir -- temp/[slug]` mueve lo descargado a `img/` o
   `video/` del anuncio, lo convierte y lo verifica.
4. Repite 1 a 3 hasta que la cola diga que no queda nada. Hay trabajos que
   esperan a otros (las tomas a las hojas de referencia, el END FRAME a su
   START, `frame_anterior` a la toma anterior) y recién salen en la vuelta
   siguiente.
5. Lo mismo con `npm run videos -- temp/[slug]`. **Antes de mandar los videos
   a Flow**, dile al usuario cuántos clips son y la estimación de créditos que
   imprime el comando, y espera su ok. Las imágenes cuestan 0 créditos en Flow
   y no necesitan ok.

La música (Suno, `npm run musica`) **sigue por kie.ai**: en esta versión es lo
único que se cobra en kie.ai. La voz y la transcripción siguen por ElevenLabs.
Si kie.ai no está conectado, `npm run musica` lo explica y hay que preguntarle
al usuario: conectarlo o seguir sin música (sin saltarse las transiciones).
`npm run musica -- temp/[slug] --solo-plan` dice si está conectado
("kie.ai: conectado" o "NO conectado"): nunca se abre el `.env` para saberlo.

### Si elige A — el anuncio completo

Sigue el proceso de `COMO-PRODUCIR.md` de principio a fin, **sin pararte a
preguntar entre comando y comando**, con las imágenes y los videos en Google
Flow como dice la sección de arriba. El usuario ya dijo que sí: pedirle
permiso en cada paso es hacerle perder el tiempo.

**Y no te saltes la música ni las transiciones** — secciones 3 y 4 de
`COMO-PRODUCIR.md`. Son **obligatorias** en este estilo, el pipeline avisa si
faltan pero no detiene nada, y un anuncio sin ellas se renderiza perfecto y sale
plano. Es el fallo más fácil de cometer de todo el proceso. **En este estilo la
música se genera con Suno** (`npm run musica -- temp/[slug]`, vía kie.ai): a
diferencia de Zack D Films, no hay pista fija que copiar de `recursos/musica/`.

Las dos únicas paradas que sí van, y que no se saltan nunca (además de las de
Flow que pide `flow-generacion`):

1. **El costo, antes de gastar.** Las imágenes cuestan 0 créditos en Flow y no
   necesitan ok. Los videos sí: cuando `npm run videos` arme la cola, dile
   cuántos clips son y la estimación de créditos de Flow que imprime, y espera
   un sí antes de mandarlos a Flow. La música se sigue pagando en kie.ai:
   muéstrale su costo y espera un sí.
2. **La revisión de clips, solo en `dialogo_nativo`** (UGC y objeto parlante).
   Ahí las tomas habladas no se pueden acelerar, así que un clip que sale mal
   solo se arregla regenerando — y regenerar después de ensamblar es rehacer
   todo el montaje. En este estilo no aplica.

Al final, entrégale los MP4 **y el informe** que pide `COMO-PRODUCIR.md`: qué
salió bien, qué salió mal toma por toma, qué regenerarías y cuántos créditos de
Flow costaría (una imagen, 0), y lo gastado de verdad: los créditos de Flow de
los videos y la música en kie.ai. Ahí él decide si quiere ajustar algo.

**Y ten cuidado con qué llamas "lo que salió mal".** El motor imprime avisos
—tomas aceleradas por encima de la guía, B-roll que no entraron, la música que
se repite en loop— y **eso no son fallos: es el montaje funcionando.** El propio
motor lo dice: *"ninguno detiene el montaje"*. Ponlos en un apartado aparte,
como decisiones del montaje, no como defectos.

Defectos de verdad hay pocos y son medibles: fotogramas negros, tramos
congelados, voces coladas, contenido equivocado en una toma, o texto ilegible en
el envase. Eso sí va en "lo que salió mal". **En este estilo hay uno más que
mirar**: una toma de mecanismo que haya salido sobre fondo de estudio, grid o
como diagrama. Es un defecto de contenido y se regenera con el prompt revisado.

Para regenerar una toma en esta versión, cuando el usuario lo pida, usa
`npm run rehacer`, **no** `--rehacer` sobre `npm run imagenes`: con `--tomas N`
la cola de imágenes también lleva las hojas de referencia y el B-roll de esa
toma, y `--rehacer` los archivaría y los volvería a pedir (la toma nueva saldría
con otro personaje y otro envase que el resto del anuncio).

1. `npm run rehacer -- temp/[slug] --toma N --contexto` muestra lo que no se
   toca y los prompts que fallaron. Escribe prompts nuevos (una escena distinta
   para la misma intención) en un `nuevos.json`.
2. `npm run rehacer -- temp/[slug] --toma N --aplicar nuevos.json` los pone en
   el manifiesto (los anteriores quedan en `prompts-anteriores.json`) y borra
   solo `toma-N-inicial.png`, `toma-N-final.png` y `toma-N.mp4`.
3. Sigue los pasos que imprime, en ese orden, cada generación con el ciclo de
   Flow de arriba y **sin `--rehacer`** (ni al armar la cola ni en
   `flow:recibir`: lo viejo ya no está). Sin continuidad son estos:
   - `npm run imagenes -- temp/[slug] --tomas N`. En una toma B son dos
     vueltas: el END FRAME espera al START nuevo. Las hojas y el B-roll que ya
     están no se vuelven a pedir.
   - `npm run videos -- temp/[slug] --tomas N --sin-broll`, con la parada de
     créditos. El clip se rehace siempre, aunque solo cambie la imagen: sale de
     ella.
   - `npm run plan -- temp/[slug]` y `npm run ensamblar -- temp/[slug]`.

   Con continuidad imprime otro orden, con
   `npm run continuidad -- temp/[slug] --pares` en el medio: síguelo tal cual.
   Y corre `flow:recibir` con la imagen nueva ya descargada: si no la
   encuentra en Descargas, la marca "falta" (la vieja quedó en
   `flow/descargas/recibidos/` y no se vuelve a usar).

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
npm run musica    -- temp/[slug]        la pista de fondo: en este estilo no hay pista fija
npm run plan:humano -- temp/[slug]
```

Las imágenes y los videos van con el ciclo de Google Flow de arriba, con la
misma parada de créditos antes de los videos; la música, con su costo en kie.ai.

El último deja `plan-montaje.txt` en la carpeta del anuncio: dice qué toma va
con qué línea, en qué segundo, qué B-roll le toca y dónde está el mp3 de la
voz. **Está escrito para que lo lea una persona**, y es lo que necesita para
montarlo en CapCut sin adivinar nada.

Dile dónde quedó todo y qué contiene ese archivo.

### Si elige C — el paquete en el chat

Entrégale el paquete **completo**, nunca una muestra, con la estructura del
Paso 5 (puntos 1 a 8): ángulo y reparto en capítulos, hojas de referencia,
tabla del guion, los prompts de cada toma (Start/End Frame o imagen + video)
con su etiqueta y sus referencias, el B-roll, los textos en pantalla, el guion
limpio de voz para ElevenLabs y las herramientas. **Sin el manifiesto**: ni el
JSON ni partes de él.

Los prompts que muestras se copian del manifiesto carácter por carácter: es la
fuente de verdad. Si el usuario pide cambios, se hacen en el manifiesto, se
vuelve a validar (`npm run validar -- temp/[slug]/manifiesto.json`) y se le
muestra lo que cambió, copiado de ahí.

Al final, ofrécele seguir con A o B (o dejarlo ahí): el manifiesto ya está
listo para producir.

Y en cualquier momento, aunque no haya elegido C, si pide ver el paquete o una
parte ("muéstrame el guion", "pásame los prompts de la toma 3"), muéstrale esa
parte, copiada del manifiesto.

---
## Reglas que nunca se rompen
- Nunca uses fotorrealismo — es animación 3D estilo Pixar, no video real.
- Nunca grid azul, fondo de estudio ni look semi-3D plástico — ni en el mecanismo ni en ninguna toma. Pixar 3D en todo, integrado en el mundo del anuncio.
- Nunca pongas texto/estadísticas dentro de los prompts de imagen o video — se agregan en edición. La única excepción es el texto de la etiqueta del producto, que se dicta literal en su hoja.
- Nunca generes el video/imagen tú mismo salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente. En esta versión eso es el Paso final: si elige A o B, generas en Google Flow la cola que arma el motor.
- Cuando se entrega el paquete (opción C, o si lo pide), va completo, nunca una muestra. El manifiesto nunca se muestra en el chat.
