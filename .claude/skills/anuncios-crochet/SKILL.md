---
name: anuncios-crochet
description: Genera anuncios publicitarios con IA en formato Crochet / Tejido (diorama artesanal en miniatura hecho de lana y ganchillo) para marcas DTC/Ecommerce en Estados Unidos y Latinoamérica. Usar SIEMPRE que el usuario pida crear un anuncio, video ad, guion publicitario o creativo estilo "crochet", "tejido", "ganchillo", "yarn", "lana", "amigurumi", "diorama tejido", "stop-motion de lana", o mencione crear anuncios con IA sin especificar estilo (en cuyo caso ofrecer este como una opción). Arma el guion completo (loop de curiosidad + giro + payoff) localizado en ES/EN/PT, los prompts de imagen y video toma por toma, el B-roll, el guion de voz en off para ElevenLabs y el manifiesto interno del pipeline; en el chat da un resumen corto y tres opciones (producirlo todo, solo las imágenes y los videos, o el paquete de prompts para copiar y pegar en Seedream/Nano Banana Pro/ChatGPT, Seedance/Kling/Veo y ElevenLabs).
---

# Generador de Anuncios IA — Crochet / Tejido

Convierte un producto en un anuncio completo estilo Crochet: guion + prompts de imagen y video por cada toma, listos para pegar en herramientas externas de generación (no genera imágenes/video directamente, salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente).

El mundo visual es un **diorama artesanal en miniatura completamente hecho de lana y ganchillo** — cada superficie, personaje, objeto y prop está tejido. Nada de piel realista, nada de superficies lisas, nada de texturas fotorrealistas en ningún punto del cuadro.

## Reglas obligatorias — léelas antes de generar cualquier cosa

1. **Solo hay UNA pausa en todo el flujo** (Paso 2, ángulo + personaje combinados). Antes y después de esa pausa, nunca te detengas a preguntar nada más — decide sola y arma el anuncio completo de un tiro, hasta el resumen y las opciones del Paso final.
2. **El mundo siempre se enmarca como "diorama tejido en stop-motion"**, nunca como "personaje de crochet". Este framing es lo que logra que el modelo renderice bien la textura de lana en piel/manos/rostros — descríbelo siempre así, nunca digas "piel tejida" de forma directa.
3. **Nunca monstruos con cara ni diagramas técnicos con flechas** para representar el mecanismo/problema — usa el menú de 4 opciones del Paso 6.
4. Los tres bloques universales (Paso 4.2) van pegados **tal cual, sin parafrasear**, en todos los prompts de imagen y video.
5. Nunca texto en pantalla, subtítulos ni watermarks dentro de los prompts — eso se agrega después en edición (CapCut/Premiere), nunca en la generación.
6. Cada bloque de prompt lleva su etiqueta como encabezado — `**Imagen:**` / `**Video:**` — nunca los entregues sin identificar cuál es cuál.
7. Nunca generes el video/imagen tú mismo salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente.
8. **Si el guion ya viene escrito de afuera, lee el Paso 0 antes que nada** — cambia por dónde empiezas y qué preguntas.

---

## Paso 0 — Si el guion ya viene escrito (atajo)

**Este paso solo se activa cuando el guion llega de afuera. Si no llega ninguno, ignóralo entero y empieza por el Paso 1, como siempre.**

Se reconoce por dos vías:
- **El usuario pega un guion** que ya le funciona y pide convertirlo a este estilo ("tengo este anuncio ganador, pásamelo a crochet"). Llega como texto corrido.
- **Te lo entrega la skill de anuncios musicales**, con la letra de una canción ya generada.

### Lo que NO haces cuando llega un guion

- **No escribes un guion nuevo, ni "mejoras" el que te dieron.**
- **No cambias una sola palabra del texto.** Puedes partirlo en líneas y decidir dónde corta cada toma; nunca reescribirlo, ni acortarlo, ni pulirlo. El usuario lo trajo porque ya le funciona.
- **No preguntas el ángulo, ni el mercado, ni el dolor, ni la oferta.** Todo eso ya está resuelto dentro del guion: dedúcelo leyéndolo. Preguntar lo que el guion ya contesta es hacerle perder el tiempo.

### Lo que SÍ haces, en este orden

1. Di **en una sola frase** qué ángulo y qué mercado leíste en el guion, para que el usuario te corrija si te equivocaste. No es una pausa: sigues de largo.
2. **Mantén las pausas que esta skill ya tiene y que el guion NO resuelve.** Un guion trae el ángulo; no trae el personaje. Así que el checkpoint del Paso 2 se hace igual, pero **solo la mitad del personaje** — sin ofrecer alternativas de ángulo, porque ese ya está decidido.
3. Haz el desglose línea por línea del Paso 3.4 **sobre el texto que te dieron**.
4. De ahí en adelante, todo exactamente igual: ADN visual (Paso 4), personaje (Paso 5), prompts por toma (Paso 7), B-roll (7.5) y manifiesto (Paso 10).

### Si el guion viene de la skill de anuncios musicales

Ese caso trae cinco cosas, no una, y **las cinco se usan**:

| Lo que llega | Para qué |
|---|---|
| **La letra** | es el guion: cada línea es una toma |
| **El concepto** | el tono y el punto de vista de la canción |
| **La idea visual** | de dónde salen las escenas, para que no sean literales |
| **La duración real de la canción** | es la duración del anuncio, exacta |
| **Los tiempos de cada línea** | la ventana de cada toma, ya medida |

Y cambian cuatro cosas respecto del flujo normal:

- **Las duraciones ya están medidas: no las estimes.** El presupuesto de `palabras ÷ 2.4` del Paso 3.3 **no aplica aquí**. La duración de cada toma sale de la canción.
- **Los tramos donde no se canta también llevan tomas** — la intro antes de la primera palabra, los puentes, el cierre. Su línea es una marca entre corchetes: `[intro]`, `[instrumental]`, `[cierre]`. No se subtitulan, porque no hay nada cantado ahí. **Un hueco sin toma propia se lo come la toma anterior y rompe el montaje**, así que se cubren todos. Y como ningún clip pasa de 10 segundos, un hueco de 20s son dos o tres tomas, no una.
- **El número de un B-roll es el número de SU toma.** El B-roll de la toma 15 se llama `broll-15`, no el que le toque por orden. Como en musical muchas tomas no llevan B-roll, numerarlos correlativos deja `broll-10` sobre la toma 15 — y eso se lee como un error aunque no lo sea. **Los huecos en la numeración son deliberados y significan "esta toma no lleva B-roll".**
- **Un coro que se repite NO reutiliza tomas.** Cada repetición lleva sus propias tomas nuevas, como cualquier otra línea. Nunca se repite metraje.
- **En el manifiesto** (Paso 10): `modo_audio` es `"musica"` y **no lleva el campo `voz_en_off`**. El B-roll sigue con `despues_de_toma`, igual que siempre. Todo lo demás del manifiesto es idéntico.

---

## Paso 1 — Brief del producto

Si el usuario no lo dio todo, pregunta solo lo esencial en una sola tanda, como texto abierto (no bloquees si ya es inferible del mensaje, una imagen o un link que compartió):
- Producto: nombre + qué es
- Dolor/beneficio principal
- Mercado/idioma: EE.UU. (inglés), LatAm (español — ¿qué país? ¿pago contra entrega?), Brasil (portugués), o varios
- Precio/oferta (descuento, envío gratis, garantía) — si el usuario pide explícitamente que NO aparezca precio/descuento, respeta eso
- Formato/aspect ratio: vertical 9:16 por defecto
- Foto de referencia del producto (envase real), si tiene, para fidelidad de diseño

---

## Paso 2 — Checkpoint combinado: ángulo + personaje (la única pausa del flujo)

Después del brief, investiga el producto y arma en un **solo mensaje** las dos decisiones que sí necesitan input del usuario. No las separes en dos pausas.

**Por qué esta es la única excepción a "decide sola y arma todo de un tiro":** el ángulo es dirección creativa (la skill sabe elegir mejor sola, como en el resto de la familia), pero el personaje es una decisión de producción — afecta cómo se escribe cada toma del guion — así que sí amerita esperar respuesta. Como las dos van en el mismo mensaje, solo hay una pausa, no dos.

Formato del mensaje:

```markdown
**Ángulo elegido:** [ángulo que mejor calza, ver catálogo en Paso 3] — [1 línea de por qué]

¿Prefieres otro?
A) [alternativa 1]
B) [alternativa 2]
C) Escribe el tuyo

**Personaje:** para este producto sugiero [sugerencia concreta de personaje basada en el brief/investigación — demografía, actitud, un rasgo distintivo].

¿Cómo lo hacemos?
A) Uso tu sugerencia
B) Yo describo mi propio personaje
C) Sin personaje fijo — cada toma con su propio personaje o ninguno

Responde con tu elección de ambas (o solo confirma si te parece bien lo sugerido) y te armo el anuncio completo.
```

**Si el ángulo que elegiste necesita dos personajes fijos** que convivan a lo largo del anuncio, el bloque del personaje cambia: **no ofrezcas A/B/C**, porque ese ángulo necesita dos personajes fijos sí o sí. Dilo en ese momento, no después — el usuario tiene que saber desde el checkpoint que va a haber dos, y poder opinar sobre los dos:

```markdown
**Personajes:** este ángulo va con dos personajes fijos que dialogan durante todo el anuncio. Te propongo:
- **[Nombre/rol 1]**: [demografía, edad, actitud, rasgo distintivo]
- **[Nombre/rol 2]**: [demografía, edad, actitud, rasgo distintivo — claramente distinto del primero]

¿Te sirven, o cambias alguno? (puedes cambiar uno solo)
```

Cuando el usuario responda, define los dos con la **Opción D del Paso 5**.

**Regla de formato**: cada opción (A/B/C) siempre en su propio renglón, nunca todas seguidas en una sola línea separadas por puntos o guiones — así se lee de un vistazo. Esto no es un quiz de botones — son varias decisiones distintas en el mismo mensaje (ángulo, personaje, y a veces algún dato del brief que faltó), así que se presentan como texto claro y bien separado, no como selección interactiva.

Si el usuario ya dio todo esto en su primer mensaje (ángulo y personaje explícitos), sáltate esta pausa por completo, arma todo de un tiro y sigue al Paso final.

---

## Paso 3 — Escribir el guion

### 3.1 — Catálogo de ángulos (elige el que mejor calce — no preguntes cuál usar, decide tú)

**Principal — Problema oculto + mecanismo (default automático si el producto no sugiere otro más fuerte):**

Estructura de 5 partes:
1. **Hook por síntomas acumulados**: en vez de una sola frase de hook, considera el patrón "Si [síntoma concreto y visual], necesitas [producto]" repetido 4-6 veces con síntomas distintos — cada uno es un micro-gancho, ninguno se resuelve todavía. Muy efectivo en crochet porque cada síntoma es una toma visual distinta. Alternativa: un solo hook fuerte si el producto no da para tantos síntomas.
2. **Bisagra explícita**: "Ahora, aquí está el problema" / "aquí está el asunto" — marca clara y directa de que viene la revelación, no un giro sutil.
3. **Revelación del mecanismo real, con datos concretos** (no personificado como villano): explica con precisión por qué lo obvio no alcanza — un dato técnico, un proceso, una razón física real.
4. **Producto como solución específica a ESE mecanismo** — no genérica.
5. **CTA con garantía/oferta**, uso concreto (ej. "7 días, una vez antes de dormir") + resultado social visualizado + oferta + cierre con tono directo/humor.

**Alternativa — Alternativa fallida confiesa (monólogo/testimonial):**
1. Pregunta retórica frustrada de apertura ("¿por qué tengo todo esto y sigue igual?")
2. Lista de lo que ya probó y no funcionó — con un detalle humano bien concreto, no genérico
3. Rechazo del marketing vacío ("tecnología avanzada" y similares), con humor
4. Producto como solución simple, sin aspavientos
5. CTA suave, tono de recomendación entre amigos, no venta agresiva

**Alternativa — Anécdota humorística con giro:**
1. Arranca con una situación o diálogo gracioso, muy específico
2. Desarrollo con humor + un giro irónico (lo que buscaba resolver no se resolvió del todo, pero pasó algo mejor/inesperado)
3. Producto presentado como solución práctica consolidada (todo-en-uno), no como cura de un mecanismo oculto
4. Cierre con prueba social numérica + precio + CTA corto y directo

**Otros ángulos portables (válidos si el producto encaja mejor con ellos):** transformación satisfactoria (objeto se transforma a cámara lenta, gancho puramente visual), comparación física lado a lado.

### 3.2 — Mecánica de guion (loop + escalada + giro)
1. **Loop de curiosidad en el hook**: no lo resuelvas temprano.
2. **Escalada con mini-loops**: cada línea deja algo abierto que empuja a la siguiente.
3. **"El giro"**: bisagra explícita antes del producto (ver 3.1).
4. **Imágenes concretas, nunca lenguaje corporativo genérico.**
5. **Una sola idea por beat**: cada línea del guion carga UNA sola idea — nunca amontones "producto reduce cafeína" + "tiene 6 ingredientes" + "cada uno hace tal cosa" en la misma línea. Si sientes que una línea necesita "y además..." para caber todo, es señal de que son 2 ideas y por lo tanto 2 tomas distintas, no una. Esto es lo que mantiene el ritmo ágil y evita tomas sobrecargadas.

Antes de entregar, verifica: ¿la línea 1 es realmente el hook (no una descripción de escena suelta ni el giro adelantado)? Si no, corrígelo antes de responder.

### 3.3 — Duración y presupuesto de palabras
Mínimo 30 segundos, sin techo fijo. Si el usuario pide una duración específica, esa manda. Presupuesto real: `duración objetivo en segundos × 2.4 palabras/segundo`. Escribe el guion a ese conteo real, no lo aproximes a ojo.

> **Una duración pedida orienta el presupuesto de palabras; NO es un blanco al que haya que llegar.** Estos números son estimaciones: `÷ 2.4` es un promedio y cada voz habla distinto. En los anuncios reales de esta familia la voz salió entre un 6% y un 24% más corta que lo estimado. Que el anuncio termine durando 52s en vez de 60 está bien y no hay nada que corregir — el montaje encaja cada toma contra los tiempos reales de la voz, acelerando unas y cortando otras. **Nunca agregues ni quites líneas para llegar a un número.** El guion dura lo que necesita durar para mostrar lo que muestra.

### 3.4 — Desglose línea por línea
Baja el guion a nivel de toma por línea — cada línea/beat tiene su propia toma visual. Duración de cada toma = palabras de esa línea ÷ 2.4. El ambiente lo decide lo que esa línea necesita mostrar.

**Chequeo antes de entregar la tabla**: si alguna línea calcula más de ~9-10 segundos, no la dejes así — es la señal de que esa línea rompió la regla de "una sola idea por beat" (3.2.5). Divídela en 2 tomas más cortas y ajusta la numeración, en vez de generar una sola toma larga.

Entrega el guion en esta tabla:

| # | Duración (calculada) | Línea de voz en off | Texto en pantalla (si difiere) | Descripción visual (personaje + ambiente/acción) |
|---|---|---|---|---|

**Postura al generar cada prompt**: actúa como director de arte senior — no representes literalmente lo que dice el guion, dramatízalo y conviértelo en algo que detenga el scroll.

---

## Paso 4 — ADN visual del mundo tejido

### 4.1 — Encuadre maestro
Todo se describe como **"stop-motion animation diorama scene, handmade knitted and crocheted miniature world"**. Nunca "a crocheted man/woman" — el modelo renderiza mucho mejor la piel tejida cuando todo el mundo (no solo el personaje) se enmarca como diorama.

**Regla de ambiente, igual que en el resto de la familia**: por defecto, cada toma ocurre en un ambiente reconocible relacionado al producto/nicho (cocina, baño tejido, dormitorio, gimnasio, la calle en miniatura) — nunca "flotando" en fondo de color liso, salvo toma de detalle aislado o que el usuario lo pida explícitamente. No es algo que preguntes, decídelo tú y verifícalo en silencio antes de entregar.

### 4.2 — Los 3 bloques universales (pegar tal cual, sin parafrasear, en cada prompt correspondiente)

**Positivo universal — al final de cada prompt de imagen:**
```
The entire scene is fully crocheted and knitted — every surface, character, object, and skin is made of visible yarn stitches and fabric loops. No realistic skin, no smooth surfaces, no photorealistic textures anywhere in the frame. Every element, including hands, arms, faces, and backgrounds, must have visible knit and crochet stitch texture throughout. Stop-motion animation diorama scene, handmade knitted and crocheted miniature world.
```

**Negativo universal — al final de cada prompt de imagen (mismo bloque, no aparte):**
```
realistic skin, smooth skin, photorealistic hands, photorealistic faces, realistic textures, smooth surfaces, CGI render, claymation, clay texture, Pixar style, Disney style, 3D animation, plastic texture, flat cartoon, airbrushed, anime, illustrated, 2D, studio lighting, ring light, HDR, symmetrical lighting, harsh shadows, perfectly exposed, two characters touching, reaching arms between characters, hands manipulating small objects, interlocked fingers, pointing with multiple fingers, complex hand poses.
```

**Línea de cierre universal — al final de cada prompt de video:**
```
Ensure the entire scene remains fully crocheted and knitted throughout every frame — all characters, objects, and surfaces must retain visible yarn stitch texture with no realistic or smooth surfaces at any point. Non-CGI. Non-cinematic. Animations must start at the first frame. Non-disney.
```

### 4.3 — Limitaciones conocidas del modelo (aplícalas siempre, evitan resultados fallidos)
- **Nunca describir "piel tejida" directamente** — deja que el encuadre de diorama la transmita.
- **Evita poses complejas de manos/dedos.** Simplifica a: de pie, sentado, gesto de un solo brazo, apoyado, caminando. Evita señalar con varios dedos o manipulación de objetos pequeños con dos manos. **Tampoco pongas a dos personajes tocándose ni a uno estirando el brazo hacia el otro** — la reacción de un personaje se resuelve en su propio cuerpo (se lleva la mano a su propia cara, se gira, retrocede), nunca en contacto con otro.

  > **Esta limitación va METIDA en el negativo universal (Paso 4.2), no depende de que la recuerdes.** Las últimas cinco entradas de ese bloque —`two characters touching, reaching arms between characters, hands manipulating small objects, interlocked fingers, pointing with multiple fingers, complex hand poses`— son exactamente esta regla convertida en texto que se pega solo.
  >
  > La razón: en una prueba real de 16 tomas, tres fallaron y **las tres violaban este punto** (un brazo estirado hacia la mejilla de otro personaje, y dos manos manipulando un gancho de crochet). La regla estaba escrita aquí desde el principio, pero el checklist de armado del Paso 7.2 nunca la volvía a mencionar, así que se leía al empezar y se olvidaba al escribir el prompt veinte minutos después. Los bloques universales no fallaron ni una vez en 40 imágenes, precisamente porque se pegan en vez de recordarse. Este punto ahora usa ese mismo mecanismo.
- **Los efectos de partículas fallan como nube densa o explosión** (se ven CGI). Usa bolitas de lana individuales, "flotando" o "suspendidas en el aire" — nunca nube ni humo.
- **Evaporación de fragancia/aroma vía partículas no funciona bien.** Usa storytelling con el personaje: huele algo y reacciona (antes: se olfatea la muñeca y frunce el gesto; después: levanta el cuello de su ropa y sonríe satisfecho).
- **Moléculas/partículas como nube densa fallan.** Usa un puñado pequeño de bolitas de lana en el color asociado al producto (ámbar = fragancia, azul = hidratación, verde = herbal, dorado = lujo/energía, blanco = pureza).

### 4.4 — Iluminación (una sola fuente motivada por escena, elige según ambiente)
- Interior de día: "soft natural light from a small diorama window to the left"
- Bar/noche interior: "warm motivated light from tiny knitted overhead pendant lamps"
- Calle de noche: "warm soft glow from tiny crocheted streetlamps"
- Baño/interior limpio: "soft cool flat natural light from a window to the left"
- Exterior de día: "soft diffused daylight from above-left"
- Sala acogedora: "warm lamplight from a tiny knitted floor lamp in the corner"

Nunca uses: studio lighting, ring light, HDR, symmetrical lighting, harsh shadows, perfectly exposed.

---

## Paso 5 — Personaje

Ya resuelto en el checkpoint del Paso 2. Según lo que haya elegido el usuario:

- **Opción A/B (personaje fijo, descrito por el usuario o sugerido por la skill):** genera el prompt de personaje UNA sola vez, al inicio de la entrega, y repítelo palabra por palabra (mismo bloque de descripción) en cada toma donde aparezca — nunca lo varíes entre tomas.
  ```
  Stop-motion animation diorama scene, handmade knitted and crocheted miniature world. Full-body small yarn-textured [demografía] character, [edad], [rasgo distintivo], wearing [outfit en términos de lana/tejido], standing in a neutral pose against a plain flat knitted backdrop of undyed cream wool, uniform single-colour stitch texture, no pattern, no granny squares, no colour blocks, no furniture, no props. The image is full-bleed and fills the entire frame edge to edge: no picture frame, no wooden frame, no diorama box, no border, no inset panel, no vignette. Every element is a handmade fabric prop physically crafted from wool and yarn.
  ```
  Simplifica siempre la pose (de pie, sentado, un solo gesto de brazo) y nunca describas "piel tejida" de forma directa — el encuadre de diorama ya la transmite.

  **El fondo de la hoja de personaje va liso y sin firma visual, pero tejido.** Lana lisa color crema o gris claro, un solo color, sin patrón, sin cuadros, sin muebles ni props. La razón: esa imagen se usa como referencia en todas las tomas siguientes, y un fondo con carácter propio (una pared de cuadros de colores, un mueble) se arrastra a las tomas y le gana al ambiente que pide la escena.

  Que sea liso **no significa vacío ni blanco**: el fondo tiene que seguir siendo lana tejida con su textura de punto visible. Un fondo neutro sin textura hace que el modelo se invente un ambiente distinto en cada toma, y se pierde la continuidad del mundo — está documentado con pruebas reales en la skill de skeleton.

  > **Y NUNCA con marco.** "Sin muebles ni props" no cubre un marco: en el primer anuncio musical la hoja salió dentro de una caja de diorama con marco de madera, y ese marco **se arrastró a seis tomas** — apareciendo y desapareciendo entre cortes, porque los primeros planos no lo heredaron. Una toma quedó peor todavía: la escena entera se renderizó como una foto pegada sobre una pared tejida, metida dentro de un recuadro.
  >
  > Por eso el bloque lleva ahora, pegado y no recordado: `The image is full-bleed and fills the entire frame edge to edge: no picture frame, no wooden frame, no diorama box, no border, no inset panel, no vignette.`
  >
  > **La hoja de personaje es lo que más se propaga de todo el anuncio.** Lo que salga en ella va a aparecer en cada toma que la use, y arreglarlo después cuesta regenerar imagen y clip de cada una.

- **Opción C (sin personaje fijo):** cada toma puede tener su propio personaje momentáneo o ninguno — dale variedad real al anuncio, no repitas el mismo personaje "por accidente". Útil sobre todo para el ángulo de problema+mecanismo con hook de síntomas repetidos, donde cada síntoma puede mostrarse con una persona distinta.

- **Opción D (dos personajes fijos):** para cualquier ángulo donde dos personajes convivan a lo largo del anuncio.

  **Cada uno necesita su propio bloque de descripción completo, y son distintos entre sí** — no reutilices el mismo texto cambiando una palabra. Varía demografía, edad, complexión, outfit tejido y un rasgo distintivo por personaje, para que se distingan de un vistazo dentro del mundo de lana.

  ```
  PERSONAJE 1: Stop-motion animation diorama scene, handmade knitted and crocheted miniature world. Full-body small yarn-textured [demografía] character, [edad], [rasgo distintivo], wearing [outfit en términos de lana/tejido], standing in a neutral pose against a plain flat knitted backdrop of undyed cream wool, uniform single-colour stitch texture, no pattern, no granny squares, no colour blocks, no furniture, no props. The image is full-bleed and fills the entire frame edge to edge: no picture frame, no wooden frame, no diorama box, no border, no inset panel, no vignette. Every element is a handmade fabric prop physically crafted from wool and yarn.
  ```
  ```
  PERSONAJE 2: Stop-motion animation diorama scene, handmade knitted and crocheted miniature world. Full-body small yarn-textured [demografía DISTINTA], [edad DISTINTA], [otro rasgo distintivo], wearing [otro outfit tejido], standing in a neutral pose against a plain flat knitted backdrop of undyed cream wool, uniform single-colour stitch texture, no pattern, no granny squares, no colour blocks, no furniture, no props. The image is full-bleed and fills the entire frame edge to edge: no picture frame, no wooden frame, no diorama box, no border, no inset panel, no vignette. Every element is a handmade fabric prop physically crafted from wool and yarn.
  ```

  En cada toma repite **palabra por palabra** el bloque del personaje o personajes que aparezcan en ella. Si aparecen los dos, van los dos bloques completos en el mismo prompt. Aplican las mismas reglas del Paso 4.3: poses simples, y **los dos personajes nunca se tocan ni estiran el brazo hacia el otro** — dialogan sentados o de pie, cada reacción resuelta en su propio cuerpo.

**Consistencia entre tomas**: no generes una imagen de referencia aparte como paso extra — entrega cada prompt con la descripción del personaje incluida. Si el usuario quiere reforzar consistencia visual, puede subir la primera imagen generada como referencia (`@image1` en Seedream/Nano Banana, o adjuntarla en ChatGPT/Gemini pidiendo mantener el mismo personaje).

Si el producto aparece en la toma, usa `@image1` como referencia también para el producto cuando el usuario suba su foto. Esa referencia sirve para clavar la **silueta, las proporciones y la etiqueta** del envase — nunca su material.

**En crochet el envase va tejido, como todo lo demás.** El producto no es la excepción fotorrealista dentro del cuadro: un envase de material real en medio del mundo de lana rompe el encuadre de diorama y se nota de inmediato.

Conserva reconocibles: la silueta del envase, sus proporciones, los colores de la marca y la tipografía de la etiqueta. Cambia solo el material: toda la superficie con textura de ganchillo visible.

Frase para pegar en el prompt de imagen de cada toma donde aparezca el producto:

```
The product package is itself fully crocheted and knitted in yarn, keeping its exact real silhouette, proportions, brand colours and recognizable label design, with visible crochet stitch texture across its entire surface.
```

---

## Paso 6 — Representación visual del mecanismo/problema (elige la que mejor calce, no preguntes al usuario)

Nunca un monstruo con cara ni un diagrama técnico con flechas/UI plana. Usa una de estas 4 formas, todas coherentes con el mundo tejido:

1. **Objeto/síntoma a escala heroica** (default más simple): el objeto real del problema, agrandado, protagonista de su propia toma — una mancha, un envase vencido, la parte del cuerpo afectada, tejida en lana y puesta en primer plano.
2. **Escena-lugar diegética de proceso**: cuando el producto tiene ángulo de manufactura/pureza/certificación, una mini locación dentro del mismo mundo tejido — una mini fábrica con banda transportadora, una mini estación de control de calidad con lupa/microscopio tejidos.
3. **Reacción del personaje**: cuando ni objeto ni escena calzan bien — el personaje reacciona físicamente (huele, prueba, toca) en vez de mostrar el mecanismo directamente. Útil sobre todo para fragancia/sabor/sensación.
4. **Tablero de hilos conectados** (estilo corcho de investigación): un corcho tejido en la pared con tarjetas de palabras clave (sub-síntomas, causas) conectadas por hilo de lana rojo hacia el producto/causa central. Ideal cuando el ángulo es "problema oculto + mecanismo con datos" y hay varios síntomas que conectar visualmente.

---

## Paso 7 — Prompts por toma

### 7.1 — Decisión de director: ¿cuántos fotogramas necesita esta toma?

Para cada toma del guion, decide un tipo:

- **Tipo A — Solo frame inicial (movimiento autocontenido):** la acción ocurre y se resuelve dentro del mismo clip (ej. bolitas de lana aparecen y se disipan, algo se enciende y se apaga). Empieza y termina en el mismo estado visual. → Un frame + prompt de video con el arco de movimiento completo.
- **Tipo B — Frame inicial + frame final (cambio de estado):** la escena empieza en un estado y aterriza en otro estable y distinto (ej. personaje neutral → personaje sorprendido; producto en la mesa → producto en la mano). → Frame inicial + frame final + prompt de video describiendo la transición.
- **Tipo C — Solo frame inicial (toma sostenida o movimiento sutil):** plano casi fijo, tipo hero shot del producto o pose segura del personaje. → Un frame + prompt de video con movimiento sutil (leve balanceo de fibras de lana, push de cámara lento, respiración).

**Regla crítica para frames finales tipo B**: el frame final es el estado YA ATERRIZADO, nunca a mitad de movimiento. Si tu descripción del frame final tiene "a medio caer" o "mano estirándose", está mal — o lo llevas al estado resuelto, o reclasifica como Tipo A.

> **Y en un frame final de PLANO CERRADO, no pegues el bloque del personaje.**
>
> El bloque del Paso 5 termina con *"standing in a neutral pose against a plain flat knitted backdrop of undyed cream wool"*. En un plano general eso no molesta, porque coincide con la escena. En un plano cerrado —las piernas, las manos, un detalle del cuerpo— **pelea con el encuadre, y el modelo le hace caso al bloque**: devuelve una copia de la hoja de personaje, cuerpo entero sobre fondo crema, en vez de la escena que pediste.
>
> Observado el 2026-09-07 en el primer anuncio musical: el frame final de una toma de piernas sobre un puf salió como la hoja de personaje tal cual. El frame inicial de la MISMA toma, con el mismo bloque, salió perfecto — porque ahí el encuadre no chocaba.
>
> **No hace falta el bloque ahí**: la capa de producción ya le pasa el frame inicial como referencia al generar el final, y de esa imagen sale la identidad del personaje. En el frame final de un plano cerrado describe **solo la escena**, y dilo explícito: *"tight close shot framed on the lower legs only, no face and no full body in frame"*.

Si tienes dudas, por defecto usa Tipo A — menos imágenes, y los modelos de imagen-a-video actuales manejan bien arcos de movimiento completos desde un solo fotograma.

### 7.2 — Estructura del prompt de imagen (5 partes, siempre en este orden)
1. Descripción específica de la escena — qué pasa, quién, dónde, qué props (personaje si aplica, ver Paso 5)
2. Positivo universal (Paso 4.2), pegado tal cual
3. Iluminación (Paso 4.4) — elige la plantilla correcta
4. Negativo universal (Paso 4.2), pegado tal cual
5. Referencia de producto `@image1` cuando el producto real esté en la escena

### 7.3 — Estructura del prompt de video (5 partes, siempre en este orden)
1. **Duración explícita al inicio**: `Stop-motion animation diorama scene, image-to-video from the shot above, [DURACIÓN]s.` — la duración es la calculada en el Paso 3.4 para esa línea, redondeada al entero más cercano.
2. Descripción del movimiento principal — qué se mueve, cómo, a qué ritmo
3. Elementos secundarios — qué se mantiene quieto, qué reacciona sutilmente
4. Dirección de cámara — locked, slow push o slow pull. Mínima.
5. Línea de cierre universal (Paso 4.2), pegada tal cual

### 7.4 — Formato de entrega por toma

**Regla obligatoria de formato**: cada prompt individual (imagen frame inicial, imagen frame final, video) va en SU PROPIO bloque de código separado (triple comilla invertida), nunca todos corridos como texto plano — así el usuario puede copiar cada uno con un clic. Cualquier nota que no sea parte del prompt en sí (ej. avisos de adjuntar `@image1` como referencia) va SIEMPRE fuera del bloque de código, nunca pegada dentro.

~~~markdown
## Toma N: "[línea del guion]"

**Director:** Tipo [A/B/C] — [1 línea de por qué]

**Imagen (frame inicial):**

[si aplica: 📎 Adjunta [foto de referencia] como imagen adicional]

```
[Prompt de imagen completo, 5 partes — SIN la nota de referencia adentro]
```

**Imagen (frame final)** *(solo si Tipo B)*:

```
[Prompt de imagen completo del estado ya aterrizado]
```

**Video:**

```
[Prompt de video completo, 5 partes — empieza con la duración]
```
~~~

### 7.5 — Bloque de B-roll (aparte, al final — con ubicación exacta, no genérica)
Genera **un B-roll por cada toma principal, 1 a 1** (si hay 8 tomas principales, 8 B-roll — nunca menos). Cada B-roll indica explícitamente después de qué toma va y con qué línea/idea sincroniza. Mismo formato de etiquetas `**Imagen:**` / `**Video:**` con cada prompt en su propio bloque de código separado (igual que 7.4), mismo par de bloques universales, y duración al inicio del prompt de video. Macro/close-up del producto o textura tejida, o personajes secundarios reaccionando (un vecino sorprendido, una mascota) — siempre dentro del mundo tejido.

**Regla de consistencia al reordenar**: si insertas, eliminas o reordenas una toma después de numerar el guion, renumera todas las referencias cruzadas y recalcula duración de las líneas afectadas antes de responder — incluyendo ubicaciones de B-roll.

---

## Paso 8 — Localización por mercado (afecta CTA, texto en pantalla y tono — NO los prompts visuales)
- **Estados Unidos** (inglés, checkout directo): urgencia por stock/tiempo, prueba social cuantificada, CTA "Shop Now"/"Get Yours Today".
- **LatAm** (español, con contra-entrega): mencionar explícitamente "paga cuando lo recibas"/"pago contra entrega" si aplica, envío a todo el país. Si el usuario pide que NO aparezca precio/descuento, respétalo. Español neutro salvo país específico.
- **Brasil** (portugués): Pix/parcelamento si aplica, tono cálido y directo.

---

## Paso 9 — Formato de entrega final

**Regla no negociable**: arma SIEMPRE el paquete completo desde el primer intento, con todos sus chequeos — nunca solo una toma de muestra, nunca "¿quieres el resto?". Pero **el paquete no se muestra en el chat al terminar**: queda interno, guardado en el manifiesto (Paso 10), y en el chat va solo el resumen corto y las tres opciones del Paso final. Cuando el paquete se entrega (opción C del Paso final, o si el usuario lo pide), va completo, nunca una muestra.

El paquete tiene esta estructura (es la que se usa cuando se entrega en el chat):
1. Ángulo elegido y por qué (1-2 líneas)
2. Prompt de generación de personaje (si aplica, Paso 5)
3. Tabla de guion línea por línea con duración calculada
4. Por cada toma: bloque completo del Paso 7.4 (director + imagen(es) + video)
5. Bloque de B-roll (1 por cada toma principal)
6. Notas de overlays/texto en pantalla (nunca dentro de los prompts)
7. **Guion de voz en off limpio, listo para copiar y pegar en ElevenLabs** — solo las líneas habladas en orden, sin numeración, en un bloque de código aparte. Obligatorio en el paquete.
8. Herramientas recomendadas: Imagen — Seedream 4.5 (mejor resultado, soporta negative prompt), Nano Banana Pro, ChatGPT/DALL-E. Video — Seedance 1.5 Pro (más económico y confiable), Kling, Veo. Voz — ElevenLabs. Edición/unión final — CapCut, Premiere.
9. **Manifiesto de producción (Paso 10)** — el archivo donde quedan guardados el guion, los prompts, el B-roll, el texto en pantalla y la voz. **Nunca se muestra en el chat**, ni siquiera en la opción C del Paso final: es interno del sistema.

---

---

## Paso 10 — Manifiesto de producción (JSON)

Este paso **no cambia nada de lo anterior**: el paquete del Paso 9 se arma igual, completo. El manifiesto es donde queda guardado: se escribe en su archivo, se valida y **nunca se muestra en el chat** (ni siquiera en la opción C del Paso final).

**Para qué sirve**: el manifiesto es el único punto de contacto entre esta skill y el pipeline de producción, que lee ese archivo y genera las imágenes, los videos y el audio, y arma el montaje automáticamente. Tú no ejecutas nada de eso ni sabes nada de APIs — solo describes el anuncio en JSON.

**Regla de fidelidad**: el manifiesto es la **fuente de verdad**. Los prompts que escribes con el formato de los Pasos 7.4 y 7.5 van en él completos, con los bloques universales incluidos, y todo lo que se le muestre al usuario (el paquete de la opción C del Paso final, o la parte que pida) se copia del manifiesto carácter por carácter. Si lo que le muestras difiere del manifiesto, el video final no será el que él revisó.

### 10.1 — Dónde va

Siempre en su archivo, nunca en el chat:

```
temp/[slug-del-anuncio]/manifiesto.json
```

donde `[slug-del-anuncio]` es el nombre del producto en kebab-case (ej. `ryze-mushroom-coffee`). Después de escribirlo, valídalo con `npm run validar -- temp/[slug-del-anuncio]/manifiesto.json` y corrige lo que marque (si lleva foto del producto, corre antes el comando de 10.6; si no sabes dónde está la foto, el error de que falta ese archivo es esperable: se resuelve cuando te la pase; cualquier otro error se corrige antes del resumen). **No lo pegues en la respuesta** — ni como bloque `json`, ni en la opción C del Paso final: es interno del sistema. En el resumen del Paso final basta media línea diciendo que quedó guardado y validado (y, si falta la foto del producto, que se la pida: 10.6).

### 10.2 — Estructura

```json
{
  "estilo": "crochet",
  "modo_audio": "voz_en_off",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "referencias": [
    {
      "id": "protagonista",
      "tipo": "personaje",
      "prompt": "Stop-motion animation diorama scene, handmade knitted and crocheted miniature world. Full-body small yarn-textured Latina woman character, early 30s, ..."
    },
    {
      "id": "producto",
      "tipo": "producto",
      "archivo": "producto.jpg",
      "nota": "envase tejido en lana, conservando silueta, proporciones y etiqueta reconocibles, con textura de ganchillo visible"
    }
  ],
  "tomas": [
    {
      "n": 1,
      "tipo": "B",
      "duracion": 6.7,
      "linea": "Si a las dos horas de tu café ya sientes el bajón, necesitas cambiar tu café.",
      "prompt_imagen_inicial": "[prompt completo de 5 partes, tal cual del Paso 7.4]",
      "prompt_imagen_final": "[prompt del estado ya aterrizado, tal cual]",
      "prompt_video": "[prompt de video completo, empieza con la duración]",
      "referencias": ["personaje"]
    }
  ],
  "broll": [
    {
      "n": 1,
      "despues_de_toma": 1,
      "sincroniza_con": "bajón otra vez",
      "duracion": 3,
      "prompt_imagen": "[prompt completo, tal cual del Paso 7.5]",
      "prompt_video": "[prompt de video completo]",
      "referencias": ["producto"]
    }
  ],
  "voz_en_off": "[el guion limpio completo, idéntico al del punto 7 del Paso 9]",
  "overlays": [
    { "texto": "7 días", "toma": 8, "momento": "inicio" }
  ]
}
```

### 10.3 — Cómo se llena cada campo

| Campo | De dónde sale |
|---|---|
| `estilo` | Siempre `"crochet"`. |
| `modo_audio` | Siempre `"voz_en_off"` — los clips salen mudos y la voz se genera aparte. |
| `mercado` | Del Paso 1/8: `"EEUU"`, `"LatAm"` o `"Brasil"`. |
| `idioma` | `"en"`, `"es"` o `"pt"`, según el mercado. |
| `aspect_ratio` | Del Paso 1. Por defecto `"9:16"`. |
| `referencias` | La lista de referencias del anuncio. En crochet: **el personaje fijo** si el usuario eligió A o B en el Paso 2 (ninguno si eligió C), **los dos personajes** si el ángulo los necesita (Opción D del Paso 5), y **el producto** si el usuario dio foto. Ver 10.4. |
| `tomas[].n` | El número de toma de la tabla del Paso 3.4, consecutivo desde 1. |
| `tomas[].tipo` | `"A"`, `"B"` o `"C"`, según la decisión de director del Paso 7.1. |
| `tomas[].duracion` | La duración calculada en el Paso 3.4 (palabras ÷ 2.4), con un decimal. **No la redondees aquí** — la redondea la capa de video. |
| `tomas[].linea` | La línea de voz en off de esa toma, exactamente como está en la tabla. |
| `tomas[].prompt_imagen_inicial` | El prompt de imagen completo de 5 partes, tal cual. |
| `tomas[].prompt_imagen_final` | Solo en Tipo B. En Tipo A y C va `null`. |
| `tomas[].prompt_video` | El prompt de video completo, empezando por la duración. |
| `tomas[].referencias` | Ver 10.4. |
| `broll[]` | Uno por cada toma principal (Paso 7.5). `despues_de_toma` y `sincroniza_con` son los que ya indicas en texto. |
| `voz_en_off` | El guion limpio del punto 7 del Paso 9, idéntico. |
| `overlays` | Las notas de texto en pantalla del punto 6 del Paso 9. Array vacío `[]` si no hay. |

### 10.4 — El campo `referencias`

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

`prompt` y `archivo` son excluyentes: una entrada tiene uno o el otro, nunca los dos.

**Qué emite crochet normalmente:**

- **El personaje fijo**, si el usuario eligió A o B en el checkpoint del Paso 2. Su `prompt` es el bloque de descripción del Paso 5, palabra por palabra.
- **Dos personajes**, si el ángulo los necesita — Opción D del Paso 5. Cada uno con su propia entrada y su propio bloque, distintos entre sí.
- **Ninguno**, si el usuario eligió C (sin personaje fijo). En ese caso no hay entrada de personaje y ninguna toma declara una.
- **El producto**, con `archivo`, si el usuario dio foto del envase.
- **Lo que haga falta**: si el anuncio reusa un objeto tejido concreto entre tomas —una taza, un frasco, una mascota de lana— va como una entrada más con su `prompt`.

En las tomas, además de los `id` de la lista, hay **un valor reservado**:

- `"frame_anterior"` — no apunta a la lista, apunta al frame de la toma anterior. Úsalo solo cuando la continuidad entre dos tomas importe de verdad.

Array vacío `[]` si la toma no necesita ninguna referencia.


### El B-roll declara sus referencias igual que una toma

**Si en un B-roll aparece el personaje —o una parte de él: una mano sosteniendo algo, la persona de espaldas, sus pies, un detalle de ella usando el producto—, ese B-roll TIENE que incluir el `id` del personaje en sus `referencias`. Si no lo incluyes sale otra persona, y se nota al corte.**

Lo mismo con el producto: **si el envase aparece en un B-roll, ese B-roll declara el `id` del producto**, o sale un envase inventado.

Los B-roll que no muestran ni al personaje ni al producto —macro de una textura, el mecanismo, un objeto suelto, un ambiente— van con `[]` y esta regla no les aplica.

> **De dónde sale.** La regla existía escrita solo en la skill de UGC, y UGC es el único anuncio de la familia donde los B-roll la cumplieron al 100% (5 de 5). En los demás no estaba escrita y se nota en los números: crochet declaró referencias en 2 de 16 B-roll, skeleton en 2 de 11, y el primer zack-d en 1 de 16 — donde un B-roll de la mano del personaje salió con **otra mujer**, con otro pelo, otra cara y un anillo que el personaje no tiene. Replicada a todas las skills el 2026-09-06.


En las tomas Tipo B **no declares nada para el frame final**: la capa de producción siempre le pasa el frame inicial como referencia al generar el final.

### 10.5 — Verificación antes de entregar

Repasa esto en silencio antes de responder. Si algo falla, corrígelo — no dejes un manifiesto roto:

1. ¿Hay una entrada en `tomas` por cada fila de la tabla del guion, y los `n` coinciden con la tabla?
2. ¿Hay un B-roll por cada toma principal?
3. ¿Todas las tomas Tipo B tienen `prompt_imagen_final`, y todas las Tipo A y C lo tienen en `null`?
4. ¿Cada prompt del manifiesto está completo, con la estructura de 7.2 / 7.3 y los bloques universales del Paso 4.2 pegados tal cual?
5. ¿Las `linea` de todas las tomas, en orden y concatenadas, dan el mismo texto que `voz_en_off`?
6. ¿Cada entrada de `referencias` tiene `prompt` **o** `archivo`, y ninguna las dos a la vez?
7. ¿El JSON es válido? Comillas dobles, sin comas colgando, sin comentarios.
8. ¿La entrada del producto usa `"archivo": "producto.jpg"` (nunca un nombre inventado), y si el usuario no dio foto esa entrada no existe? Si dio foto, ¿corriste tú el comando de 10.6 antes de validar (o, si no sabes dónde está, vas a pedírsela en una línea del resumen, sin ningún comando)?
9. ¿Cada `id` que declaran las tomas existe en la lista de `referencias`? Un id que no existe detiene el pipeline antes de generar.

### 10.6 — La foto del producto (nunca inventes el nombre del archivo)

El `archivo` de la entrada del producto no es un nombre descriptivo que tú eliges: es el nombre de un archivo que **tiene que existir de verdad** dentro de la carpeta del anuncio. Si escribes ahí un nombre inventado a partir de la marca (`neutrogena-hydro-boost.jpg`), el pipeline se detiene, o peor, genera el envase inventado en vez del real.

El usuario casi nunca va a tener la foto lista: la tiene en Descargas, en `.webp` o `.heic`, con un nombre como `creama.webp` o `IMG_4821.HEIC`. **No le pidas que la renombre ni que la mueva** — eso es exactamente lo que un alumno no técnico no va a saber hacer.

**La regla, simple:**

- Si el usuario dio una foto de producto → la entrada existe, con `"archivo": "producto.jpg"`, siempre ese nombre.
- Si el usuario no dio ninguna foto → **la entrada del producto no está en la lista**, y ninguna toma ni B-roll puede declararla.

**El comando que la deja lista es este** (con la ruta de su foto tal cual, aunque sea `.webp` o `.heic` o tenga espacios en el nombre, entre comillas, y el slug del anuncio; cuándo va, en el último párrafo de esta sección):

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug-del-anuncio]
```

El comando copia la foto a la carpeta del anuncio, la convierte si hace falta, y deja el nombre correcto escrito en el manifiesto.

Ese script es el que reconcilia la realidad: si termina guardando `producto.webp` en vez de `producto.jpg`, él mismo corrige el nombre en el manifiesto. Por eso tú siempre escribes `producto.jpg` y no te preocupas por el formato original.

**Lo corres tú**, apenas escribiste el manifiesto y antes de validarlo (10.1), si sabes dónde está la foto: la ruta que te dio el usuario, o la imagen que pegó en el chat (la lees en su ruta local); usa el nombre que imprima. Si no sabes dónde está, arma el anuncio completo igual: el flujo no se detiene por esto (ver Regla obligatoria 1). En el resumen del Paso final pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando, y córrelo tú apenas la tengas (si ya eligió A o B, antes que todo lo demás, antes de `npm run validar`: es el primer paso de `COMO-PRODUCIR.md` y de la lista de B). Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. **El comando nunca va en el chat**: ni en el mensaje del Paso final ni en el paquete de la opción C.

## Paso final — Pregunta cómo quiere producirlo

**Si el guion vino de la skill de anuncios musicales (Paso 0), este Paso final
no va**: con el manifiesto escrito y validado, vuelve a esa skill, que hace el
único resumen y las únicas opciones del anuncio (en musical no hay guion de voz
para ElevenLabs). La foto del producto la dejas lista tú igual (10.6); si no
sabes dónde está, la línea que la pide va en el resumen de esa skill.

Ya armaste el paquete completo —guion, prompts de cada toma, B-roll, texto en
pantalla y guion de voz— y quedó guardado y validado en el manifiesto (si la
foto del producto todavía no está preparada, el único error que queda es el de
esa foto: ver 10.1). **Ahora, y solo ahora, pregúntale al usuario cómo quiere
seguir.**

En el chat va **solo esto**: un resumen corto y las tres opciones. El paquete no
se muestra (para eso está la opción C) y el manifiesto no se muestra nunca. El
resumen, de 1 a 3 líneas: estilo, producto, mercado e idioma, cuántas tomas y
cuántos B-roll, la duración aproximada y, si la hay, UNA línea con la decisión
que conviene que sepa (por ejemplo: "Agregué 'Pagas al recibirlo' en el cierre
por el pago contra entrega"). Puedes cerrar con media línea diciendo que el
manifiesto quedó guardado y validado. Si dio foto y no sabes dónde está,
pídesela en una línea del resumen (que la arrastre al chat o te diga la ruta),
sin ningún comando (ver 10.6).

No lo decidas tú: las tres salidas son legítimas y cuestan cosas distintas.

```markdown
Listo: anuncio estilo crochet de [producto] para [mercado] ([idioma]),
[N] tomas y [N] B-roll, unos [N] segundos. [Si la hay: la decisión que
conviene que sepas, en una línea.]
[Solo si dio foto y no sabes dónde está: "Pásame la foto del producto
(arrástrala al chat o dime la ruta) y la dejo lista."]

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero las imágenes y los videos en Google Flow,
armo el montaje y te entrego el MP4 terminado. Te muestro el costo antes de
gastar nada.

**B) Genera solo las imágenes y los videos** — los genero en Google Flow y te
los dejo en su carpeta, listos para que los montes tú en CapCut a tu gusto.
También te muestro el costo antes.

**C) Entrégame el paquete de prompts** — te paso aquí el guion toma por toma,
los prompts de imagen y video de cada toma, el B-roll, el texto en pantalla y
el guion de voz para ElevenLabs, para que lo revises o lo produzcas a mano.
Después, si quieres, seguimos con A o B.
```

### Las imágenes y los videos salen de Google Flow

En esta versión del sistema el motor **no** genera las imágenes ni los videos:
**los generas tú en Google Flow**, manejando Chrome con la extensión Claude in
Chrome. Que el usuario elija A o B es el pedido explícito de la Regla 7. El
motor arma la lista de trabajo (la cola) y después recibe los archivos.

Donde el proceso dice `npm run imagenes` o `npm run videos`, va este ciclo:

1. `npm run imagenes -- temp/[slug]` arma la cola
   (`temp/[slug]/flow/cola-imagenes.json`) y hace solo lo que no necesita
   Flow (las copias de frames).
2. Genera la cola en Google Flow con la skill **`flow-generacion`**. Ella
   explica todo el procedimiento: ventana aparte, subir las referencias,
   enviar todo, reintentos y descargar cada archivo con el nombre que pide la
   cola.
3. `npm run flow:recibir -- temp/[slug]` mueve los archivos descargados a la
   carpeta del anuncio, los convierte y los verifica.
4. Repite 1-3 hasta que la cola diga que no queda nada: hay trabajos que
   dependen de otros (el frame final de una toma Tipo B espera a su frame
   inicial) y recién salen en la vuelta siguiente.
5. Lo mismo con `npm run videos -- temp/[slug]`.

**Las imágenes no llevan parada**: en Flow cuestan 0 créditos. **Los videos
sí**: antes de mandarlos a Flow, dile al usuario cuántos clips son y la
estimación de créditos que imprime `npm run videos`, y espera su ok.

**Rehacer una toma** (lo que el usuario decida después del informe) no sale
con `--tomas N` solo: lo que ya está en `img/` o `video/` cuenta como terminado
y la cola lo salta. Va por `npm run rehacer`, que nunca repite el prompt que
falló:

1. `npm run rehacer -- temp/[slug] --toma N --contexto` muestra la línea, las
   tomas vecinas y los prompts actuales. Escribe una escena distinta para la
   misma intención en un JSON (`prompt_imagen_inicial`, `prompt_imagen_final`
   si es Tipo B, `prompt_video`).
2. `npm run rehacer -- temp/[slug] --toma N --aplicar nuevos.json` los pone en
   el manifiesto y saca los frames y el clip de esa toma (los prompts viejos
   quedan en `prompts-anteriores.json`).
3. `npm run imagenes -- temp/[slug] --tomas N` con el ciclo de Flow, hasta que
   la cola quede vacía (el frame final de una Tipo B sale en la vuelta
   siguiente). Después `npm run videos -- temp/[slug] --tomas N --sin-broll`,
   con el ok de los créditos, y el mismo ciclo.
4. `npm run flow:recibir -- temp/[slug]` va **sin** `--rehacer`: los archivos
   viejos ya no están. Córrelo después de descargar lo nuevo: si no lo
   encuentra en Descargas, lo marca "falta" (la descarga vieja quedó en
   `flow/descargas/recibidos/` y no se vuelve a usar).

No uses `--rehacer` en `npm run imagenes` para esto: con `--tomas N` también
vuelve a pedir la hoja del personaje (y cambia el personaje de todas las
tomas) y el B-roll de esa toma.

La música de fondo (`npm run musica`) **sigue por kie.ai** y la voz por
ElevenLabs, igual que siempre. En esta versión kie.ai solo cobra la música.
Si kie.ai no está conectado, `npm run musica` lo explica y hay que preguntarle
al usuario: conectarlo o seguir sin música (sin saltarse las transiciones).
`npm run musica -- temp/[slug] --solo-plan` dice si está conectado
("kie.ai: conectado" o "NO conectado"): nunca se abre el `.env` para saberlo.

### Si elige A — el anuncio completo

Sigue el proceso de `COMO-PRODUCIR.md` de principio a fin, con las imágenes y
los videos por el ciclo de Flow de arriba, **sin pararte a preguntar entre
comando y comando** fuera de las paradas de abajo. El usuario ya dijo que sí:
pedirle permiso en cada paso es hacerle perder el tiempo.

**Y no te saltes la música ni las transiciones** — secciones 3 y 4 de
`COMO-PRODUCIR.md`. Son **obligatorias** en este estilo, el pipeline **no avisa
si faltan**, y un anuncio sin ellas se renderiza perfecto y sale plano. Es el
fallo más fácil de cometer de todo el proceso.

Las dos únicas paradas de decisión que sí van, y que no se saltan nunca:

1. **El costo, antes de generar los videos.** Cuántos clips son y la
   estimación de créditos de Flow que imprime `npm run videos`: muéstralo y
   espera un sí. El usuario paga cada clip con los créditos de su plan de
   Flow; las imágenes no gastan. La música, lo único que cobra kie.ai, va en
   esta misma parada: las dos decisiones de gasto van juntas.
2. **La revisión de clips, solo en `dialogo_nativo`** (UGC y objeto parlante).
   Ahí las tomas habladas no se pueden acelerar, así que un clip que sale mal
   solo se arregla regenerando — y regenerar después de ensamblar es rehacer
   todo el montaje.

Aparte de esas dos decisiones, `flow-generacion` pone sus propios pedidos y
también se respetan: mover el grupo de pestañas a una ventana aparte (una vez),
el permiso de descarga de cada tanda (las imágenes salen en varias vueltas:
la hoja, los frames iniciales, los finales Tipo B; y después los videos),
el "Permitir" de Chrome para descargar varios archivos, y el inicio de sesión
o el captcha, que hace el usuario.

Al final, entrégale los MP4 **y el informe** que pide `COMO-PRODUCIR.md`:
qué salió bien, qué salió mal toma por toma, qué regenerarías y cuántos
créditos de Flow costaría (rehacer una imagen no gasta), y el costo real: los
créditos de Flow de los videos y lo que cobró kie.ai por la música. Ahí él
decide si quiere ajustar algo.

**Y ten cuidado con qué llamas "lo que salió mal".** El motor imprime avisos
—tomas aceleradas por encima de la guía, B-roll que no entraron, la música que
se repite en loop— y **eso no son fallos: es el montaje funcionando.** El propio
motor lo dice: *"ninguno detiene el montaje"*. Ponlos en un apartado aparte,
como decisiones del montaje, no como defectos.

Defectos de verdad hay pocos y son medibles: fotogramas negros, tramos
congelados, voces coladas, contenido equivocado en una toma, o texto ilegible en
el envase. Eso sí va en "lo que salió mal".

**La duración NO es un defecto.** Si el usuario pidió 40 segundos y salieron
44.6, eso está bien y no se corrige. **Nunca cortes una línea del guion, quites
una toma ni inventes copy para llegar a un número**, y no se lo ofrezcas al
usuario como opción. El tiempo que pide orienta el presupuesto de palabras; el
anuncio dura lo que necesita durar. Menciónalo como dato, sin pedir disculpas.

### Si elige B — solo las imágenes y los videos

Corre las fases de generación y **párate antes de ensamblar**:

```
npm run preparar  -- "<ruta de la foto>" [slug]   solo si dio foto y no se hizo (10.6)
npm run validar   -- temp/[slug]/manifiesto.json
npm run imagenes  -- temp/[slug]        ciclo de Flow (arriba), hasta que no quede nada
npm run audio     -- temp/[slug]        solo si el modo es voz_en_off
npm run videos    -- temp/[slug]        ciclo de Flow, con el ok de los créditos
npm run plan:humano -- temp/[slug]
```

El último deja `plan-montaje.txt` en la carpeta del anuncio: dice qué toma va
con qué línea, en qué segundo, qué B-roll le toca y dónde está el mp3 de la
voz. **Está escrito para que lo lea una persona**, y es lo que necesita para
montarlo en CapCut sin adivinar nada.

Dile dónde quedó todo y qué contiene ese archivo.

### Si elige C — el paquete en el chat

Entrégale el paquete **completo, nunca una muestra**, con la estructura del
Paso 9 (puntos 1 a 8): ángulo, prompt del personaje, tabla del guion, cada toma
con el formato de 7.4 (director, imagen o imágenes y video), el B-roll, el
texto en pantalla, el guion de voz para ElevenLabs y las herramientas. **Sin el
manifiesto**: ese no se muestra nunca.

Los prompts que muestras se copian del manifiesto **carácter por carácter**: es
la fuente de verdad. Lo que el manifiesto no guarda —el ángulo y su porqué, y
el porqué de cada tipo de toma en la línea **Director**— sale de lo que ya
armaste en esta conversación; si ya no lo tienes a la vista, rehazlo en una
línea desde el guion y el `tipo` de cada toma del manifiesto (las herramientas
son las del punto 8 del Paso 9). El comando de 10.6 no va en el paquete: la
foto la dejas lista tú.

Si el usuario pide cambios, hazlos en el manifiesto, vuelve a validarlo
(`npm run validar -- temp/[slug]/manifiesto.json`) y muéstrale lo que cambió,
copiado de ahí.

Al final, ofrécele seguir con A o B, o dejarlo ahí.

**Y en cualquier momento**, aunque no haya elegido C: si pide ver el paquete o
una parte ("muéstrame el guion", "pásame los prompts de la toma 3"), muéstrale
esa parte, copiada del manifiesto.

---
## Reglas que nunca se rompen
- Todo lo visible está hecho de lana/ganchillo — nunca materiales reales ni texturas fotorrealistas.
- Nunca describas "piel tejida" de forma directa — el encuadre de diorama la transmite sola.
- Nunca poses complejas de manos/dedos.
- Nunca efectos de partículas como nube densa — bolitas de lana individuales, en color asociado al producto.
- Nunca monstruos con cara ni diagramas técnicos con flechas para el mecanismo — usa el menú de 4 opciones del Paso 6.
- Nunca texto en pantalla, títulos ni watermarks dentro de los prompts de imagen o video.
- Nunca frame final "a mitad de movimiento" en tomas Tipo B — siempre estado ya aterrizado.
- Nunca generes el video/imagen tú mismo salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente.
- Nunca más de una pausa en todo el flujo (el checkpoint combinado del Paso 2).
- Nunca muestres el manifiesto en el chat. El paquete se arma siempre completo, pero al terminar va solo el resumen y las tres opciones; cuando se entrega (opción C del Paso final, o si lo pide), va completo, nunca una muestra.
