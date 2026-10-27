---
name: anuncios-claymation
description: Genera anuncios publicitarios con IA en formato Claymation / stop-motion de plastilina para marcas DTC/Ecommerce en Estados Unidos y Latinoamérica. Usar SIEMPRE que el usuario pida crear un anuncio, video ad, guion publicitario o creativo estilo "claymation", "plastilina", "stop-motion", "clay animation", o mencione crear anuncios con IA sin especificar estilo (en cuyo caso ofrecer este como una opción). Arma el guion completo (loop de curiosidad + giro + payoff) localizado en ES/EN/PT, los prompts de imagen y video toma por toma, el B-roll, el guion de voz para ElevenLabs y el manifiesto interno del pipeline; en el chat da un resumen corto y tres opciones (producirlo todo, solo las imágenes y los videos, o el paquete de prompts para copiar y pegar en Midjourney/Nano Banana/Seedream/Kling/Runway/ElevenLabs).
---

# Generador de Anuncios IA — Claymation / Plastilina

Convierte un producto en un anuncio completo estilo Claymation: guion + prompts de imagen y video por cada toma, listos para pegar en herramientas externas de generación (no genera imágenes/video directamente, salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente).

## Paso 0 — Si el guion ya viene escrito (atajo)

**Este paso solo se activa cuando el guion llega de afuera. Si no llega ninguno, ignóralo entero y empieza por el Paso 1, como siempre.**

Se reconoce por dos vías:
- **El usuario pega un guion** que ya le funciona y pide convertirlo a este estilo ("tengo este anuncio ganador, pásamelo a claymation"). Llega como texto corrido.
- **Te lo entrega la skill de anuncios musicales**, con la letra de una canción ya generada.

### Lo que NO haces cuando llega un guion

- **No escribes un guion nuevo, ni "mejoras" el que te dieron.** Sáltate el Paso 2 entero: la elección de ángulo (2.1) y la mecánica de guion (2.2) ya están resueltas dentro del texto que llegó.
- **No cambias una sola palabra del texto.** Puedes partirlo en líneas y decidir dónde corta cada toma; nunca reescribirlo, ni acortarlo, ni pulirlo. El usuario lo trajo porque ya le funciona.
- **No preguntas el ángulo, ni el mercado, ni el dolor, ni la oferta.** Todo eso ya está resuelto dentro del guion: dedúcelo leyéndolo. Preguntar lo que el guion ya contesta es hacerle perder el tiempo.

### Lo que SÍ haces, en este orden

1. Di **en una sola frase** qué ángulo y qué mercado leíste en el guion, para que el usuario te corrija si te equivocaste. No es una pausa: sigues de largo.
2. **Esta skill no tiene pausas y sigue sin tenerlas**: entrega el paquete completo de un tiro, como siempre.
3. Haz el desglose línea por línea del Paso 2.4 **sobre el texto que te dieron**.
4. De ahí en adelante, todo exactamente igual: ADN visual (3.1), Character Bible (3.3), negative prompt (3.4), prompts por toma (3.5), B-roll (3.6) y manifiesto (Paso 6).

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

- **Las duraciones ya están medidas: no las estimes.** El presupuesto de `palabras ÷ 2.4` del Paso 2.3 **no aplica aquí**. La duración de cada toma sale de la canción.
- **Los tramos donde no se canta también llevan tomas** — la intro antes de la primera palabra, los puentes, el cierre. Su línea es una marca entre corchetes: `[intro]`, `[instrumental]`, `[cierre]`. No se subtitulan, porque no hay nada cantado ahí. **Un hueco sin toma propia se lo come la toma anterior y rompe el montaje**, así que se cubren todos. Y como ningún clip pasa de 10 segundos, un hueco de 20s son dos o tres tomas, no una.
- **El número de un B-roll es el número de SU toma.** El B-roll de la toma 15 se llama `broll-15`, no el que le toque por orden. Como en musical muchas tomas no llevan B-roll, numerarlos correlativos deja `broll-10` sobre la toma 15 — y eso se lee como un error aunque no lo sea. **Los huecos en la numeración son deliberados y significan "esta toma no lleva B-roll".**
- **Un coro que se repite NO reutiliza tomas.** Cada repetición lleva sus propias tomas nuevas, como cualquier otra línea. Nunca se repite metraje.
- **En el manifiesto** (Paso 6): `modo_audio` es `"musica"` y **no lleva el campo `voz_en_off`**. El B-roll sigue con `despues_de_toma`, igual que siempre. Todo lo demás del manifiesto es idéntico.

---

## Paso 1 — Brief del producto

Si el usuario no lo dio todo, pregunta solo lo esencial en una sola tanda, siempre como texto abierto (no uses botones ni formularios, mantén la misma forma de preguntar para todos los campos) — no bloquees si ya es inferible del mensaje o de una imagen/link que compartió:
- Producto: nombre + qué es
- Dolor/beneficio principal
- Mercado/idioma: EE.UU. (inglés), LatAm (español — ¿qué país? ¿hay pago contra entrega?), Brasil (portugués), o varios
- Precio/oferta (descuento, envío gratis, garantía) — y si el usuario pide explícitamente que NO aparezca precio/descuento en el copy, respeta eso
- Formato/aspect ratio: vertical 9:16 por defecto, o el que indique
- Si tiene una foto de referencia del producto (envase real), pídesela para fidelidad de diseño

## Paso 2 — Escribir el guion

### 2.1 — Elige el ángulo (no inventes desde cero)

**Regla de elección**: si el usuario no especifica un ángulo ni pide un estilo de guion particular, usa automáticamente el ángulo PRINCIPAL de abajo — es el default de la skill, no algo que preguntes cada vez. Si el usuario sí da su propio ángulo, idea, o pide explícitamente uno de los otros (transformación satisfactoria, comparación, etc.), sigue su instrucción en su lugar — el usuario siempre tiene prioridad sobre el default.

**PRINCIPAL — Problema oculto + mecanismo personificado (default automático — es el patrón que más se repite en anuncios reales confirmados, en verticales tan distintas como resaca, salud del pie diabético, perfumes y suplementos musculares):**

Estructura de 5 partes:
1. **Problema oculto o acumulativo**: algo que pasa silenciosamente y la persona no lo nota hasta que es grande.
2. **Revelación del mecanismo real**: casi siempre personificado como villano (un monstruo, una molécula, una toxina animada en plastilina) o explicado con una metáfora visual concreta (ej. obreritos de construcción reparando un órgano).
3. **Por qué lo obvio no alcanza**: "ninguna cantidad de X arregla esto" — descarta las soluciones fáciles que la audiencia ya probó.
4. **El producto como solución específica a ESE mecanismo** — no una solución genérica, sino la respuesta exacta al villano/mecanismo revelado.
5. **CTA con garantía/oferta** ("50% mejor o te devolvemos el dinero", "garantía de 30 días").

Ejemplo real (resumido): "El alcohol no es tóxico en sí... es lo que se convierte dentro de tu cuerpo" → se revela el acetaldehído como monstruo rojo espinoso → "ninguna cantidad de agua o analgésicos arregla esto" → obreritos reparando el cerebro → "el compuesto DHM neutraliza el acetaldehído" → producto + garantía.

**Otros ángulos (válidos, úsalos si el producto encaja mejor con ellos que con el principal):**
- **Transformación satisfactoria**: el objeto/ingrediente se transforma físicamente a cámara lenta (efecto oddly-satisfying) — gancho puramente visual, sin mecanismo/villano.
- **Personaje de plastilina "yo antes"**: reacciona exageradamente al problema antes de que aparezca el producto — más simple, un solo personaje, sin elenco de mecanismo.
- **Comparación física en el mismo cuadro**: dos versiones del resultado lado a lado, en plastilina.
- **Absurdo-cómico con punchline**: setup gracioso → producto resuelve el problema de forma exagerada → remate visual.

**Sobre la voz — SIEMPRE voz en off, sin excepciones**: Claymation narra por fuera de la escena y el personaje no mueve la boca en sincronía. `modo_audio` es siempre `"voz_en_off"`. Si el usuario quiere personajes que hablen ellos mismos con lip-sync, ese es otro estilo de la familia (Talking Object), no este.

### 2.2 — Mecánica de guion (loop + giro + escalada)
1. **Loop de curiosidad en el hook**: planta una pregunta/tensión que el espectador necesita ver resuelta. No la resuelvas temprano.
2. **Escalada con mini-loops**: cada línea deja algo abierto que empuja a la siguiente.
3. **"El giro"**: el producto nunca se pega al final de la nada — usa un beat bisagra ("Hasta que...").
4. **Imágenes concretas, no frases vagas**: evita lenguaje corporativo genérico ("revolucionario", "la solución perfecta").

Antes de entregar, verifica: ¿la línea 1 es realmente el hook con el loop de curiosidad (no una descripción de escena suelta ni el giro adelantado)? Si no, corrígelo antes de responder.

### 2.3 — Duración y presupuesto de palabras
Mínimo 30 segundos, sin techo fijo. Si el usuario pide una duración específica, esa manda. Calcula el presupuesto de palabras: `duración objetivo en segundos × 2.4 palabras/segundo`. Escribe el guion a ese conteo real, no lo aproximes a ojo.

> **Una duración pedida orienta el presupuesto de palabras; NO es un blanco al que haya que llegar.** Estos números son estimaciones: `÷ 2.4` es un promedio y cada voz habla distinto. En los anuncios reales de esta familia la voz salió entre un 6% y un 24% más corta que lo estimado. Que el anuncio termine durando 52s en vez de 60 está bien y no hay nada que corregir — el montaje encaja cada toma contra los tiempos reales de la voz, acelerando unas y cortando otras. **Nunca agregues ni quites líneas para llegar a un número.** El guion dura lo que necesita durar para mostrar lo que muestra.

### 2.4 — Desglose línea por línea
Baja el guion a nivel de toma por línea — cada línea/beat tiene su propia toma visual sincronizada. La duración de cada toma es la duración real de decir esa línea (≈ palabras ÷ 2.4), no un número fijo. El ambiente de cada toma lo decide lo que esa línea necesita mostrar — puede mantenerse igual si la escena es continua o cambiar si el guion salta de contexto. El producto se muestra **dentro del ambiente** de la escena (mesa de noche, manos del personaje) — el fondo sólido/estudio es solo una opción para detalle puro aislado (macro de textura, corte transversal de ingrediente).

**Regla reforzada — autoverificación interna y silenciosa, NUNCA le preguntes al usuario si quiere fondo sólido o ambiente (esto se ha saltado antes, revísalo toma por toma tú mismo antes de responder)**: por defecto, SIEMPRE genera cada toma en un ambiente concreto y reconocible relacionado al producto/nicho (dormitorio, cocina, baño, gimnasio, oficina, la calle, lo que corresponda) — nunca "flotando" en un fondo de color liso, salvo que sea explícitamente una toma de detalle aislado. Esto no es una decisión que le preguntes al usuario ni algo que menciones al entregar — simplemente hazlo bien desde el primer intento. Solo cambias a fondo sólido si el usuario lo pide explícitamente (antes de generar, o después, como una edición sobre el resultado ya entregado) — nunca por iniciativa propia y nunca preguntando "¿prefieres fondo sólido o un ambiente?". Antes de entregar la respuesta, repasa cada prompt de imagen uno por uno tú mismo y confirma en silencio que describe un ambiente real.

Entrega el guion en esta tabla:

| # | Duración (calculada) | Línea de voz en off | Texto en pantalla (si difiere) | Descripción visual (personaje + ambiente/acción) |
|---|---|---|---|---|

**Postura al generar cada prompt**: actúa como un director de arte senior/estratega de conversión especializado en stop-motion — tu trabajo no es representar literalmente lo que dice el guion, sino mejorar la idea, dramatizarla, incorporar metáforas visuales y contraste, y convertirla en algo que detenga el scroll. No copies conceptos débiles literalmente: "una persona está cansada" puede convertirse en "una persona diminuta cargando un despertador gigantesco" o "una batería corporal de plastilina casi vacía".

## Paso 3 — ADN visual, personaje y prompts

### 3.1 — ADN visual
- **Render**: claymation, stop-motion animation, handmade clay texture, plasticine, **acabado artesanal pero refinado y profesional** — marcas de escultura sutiles y controladas (NUNCA huellas dactilares caóticas por todos lados, eso se lee amateur/escolar). El estándar es "diorama de estudio de alto presupuesto", no plastilina de niño.
- **Iluminación**: soft studio lighting, slightly flat/diffused, minimal harsh shadows, ligero resplandor de contorno.
- **Ambiente**: el personaje vive en un set/ambiente real hecho en plastilina (dormitorio, cocina, oficina), con props y fondo también en textura de clay.
- **Materiales imitados**: cuando algo sería normalmente vidrio, agua, metal o tela, descríbelo explícitamente como una imitación profesional esculpida en plastilina (ej. "vaso esculpido en plastilina translúcida simulada") — nunca mezcles materiales reales en la escena.
- **Detalle técnico**: Aardman-style, Laika-style stop motion, tactile handcrafted look, 24fps stop-motion cadence, sensación de lente macro, profundidad de campo reducida.

### 3.2 — Vocabulario de ángulo de cámara (variar con intención)
Primerísimo primer plano, primer plano, plano medio, plano general, vista cenital, contrapicado, picado, perspectiva a ras de mesa, cámara frontal simétrica, ángulo dinámico de tres cuartos, sensación de lente macro. El ángulo debe apoyar la emoción y función de esa toma.

### 3.3 — Character Bible (repetir palabra por palabra en cada prompt, si hay personaje)

**Si el anuncio lleva dos personajes, cada uno necesita su propio Character Bible completo** — no reutilices el mismo para ambos: cada uno tiene su propia forma y personalidad.

```
CHARACTER: a claymation character with a rounded handmade clay body, [rasgos específicos del personaje para este anuncio, ej. "simple oval head, small dot eyes, no visible mouth unless emoting"], tactile plasticine material with refined subtle sculpting marks, matte surface finish, muted [color] clay tone..
```


**Nota de consistencia (NO la incluyas en el texto que se copia al generador de imágenes):** mantén cada Character Bible idéntico en todas las tomas de ese personaje, sin cambiar su diseño. Esta instrucción es para ti/el usuario, nunca para pegarla dentro del prompt — si se pega literal, algunas herramientas interpretan "every shot" como "muéstrame varias tomas en una sola imagen" y generan un collage con el personaje repetido en distintas poses, en vez de una sola imagen limpia.

**Consistencia entre tomas**: no generes una imagen de referencia aparte — es un paso extra innecesario. Entrega los prompts de cada toma con el Character Bible incluido. Si el usuario quiere consistencia visual, es su decisión: puede usar cualquier imagen ya generada (normalmente la primera) como referencia, o no usar ninguna. Si pregunta cómo, sugiérele usar la primera toma generada como referencia:
- Midjourney: `--cref [URL] --cw 100` (100 si el ambiente también debe mantenerse igual; 30-50 si el personaje viaja entre ambientes distintos)
- Nano Banana/Gemini: adjuntar esa imagen y escribir "using this exact character and environment, keep the same face/proportions/texture, now show it [nueva acción]"
- GPT Image: mismo chat, refiriéndote a la imagen de arriba

Si el producto (envase real) aparece en la toma, adjunta también su foto real como referencia, y usa el **Prompt maestro de consistencia** si el usuario dio una foto: describe el envase con máxima fidelidad (forma, colores, etiqueta, logotipo) y agrega la instrucción de no modificar el diseño entre escenas. **El envase debe conservar exactamente su forma y proporciones reales, esculpido en plastilina — nunca alargarlo, ensancharlo ni deformar su silueta.** Si el envase se convierte en personaje (con cara), prioriza agregar solo rasgos faciales sobre el envase intacto; agrega brazos/piernas de plastilina únicamente si caben sin alterar su forma real.

> **La hoja de referencia NUNCA lleva marco.** Encontrado el 2026-09-07 en el primer anuncio musical, en crochet, y le toca a cualquier estilo que genere una hoja de personaje: la hoja salió dentro de una caja de diorama con marco de madera, y ese marco **se arrastró a seis tomas**, apareciendo y desapareciendo entre cortes porque los primeros planos no lo heredaron. Una toma quedó peor: la escena entera se renderizó como una foto pegada dentro de un recuadro.
>
> "Sin muebles ni props" no cubre un marco. Hay que decirlo explícito, y va **pegado dentro del prompt de la hoja**, no recordado:
>
> ```
> The image is full-bleed and fills the entire frame edge to edge: no picture frame, no wooden frame, no diorama box, no border, no inset panel, no vignette.
> ```
>
> **Ojo con la reacción instintiva de poner fondo blanco vacío: es peor.** Está documentado con pruebas reales que un fondo neutro sin relación al mundo hace que el modelo invente un ambiente distinto en cada toma. El fondo va liso y con la textura del estilo — lo que se prohíbe es el marco, no el ambiente.
>
> **La hoja es lo que más se propaga de todo el anuncio**: lo que salga en ella aparece en cada toma que la use, y arreglarlo después cuesta regenerar imagen y clip de cada una.

---

### 3.4 — Negative prompt estándar (agregar DEBAJO de cada prompt de imagen, en el mismo bloque — nunca aparte)
```
Negative prompt: amateur clay sculpture, messy fingerprints, excessive fingerprints, uneven childish proportions, crude modeling, malformed anatomy, real-world materials, realistic transparency, real glass, real metal, real fabric, photorealistic textures, flat lighting, stock photo look, CGI hyperrealism, generic 3D render, 2D illustration, anime style, harsh shadows, overly glossy plastic, cluttered composition, weak focal point, text artifacts
```

### 3.5 — Prompts por toma (una por línea del guion)

**Regla de formato obligatoria**: cada bloque de prompt debe llevar su etiqueta como encabezado — `**Imagen (frame inicial):**` antes del prompt de imagen, `**Imagen (frame final):**` cuando la toma lo lleve, y `**Video:**` antes del prompt de video — nunca entregues los bloques de código uno después de otro sin identificar cuál es cuál. Esto aplica igual en las tomas principales y en el B-roll.

**Regla estructural que no se rompe: una toma = un clip de video.** Una toma puede llevar una o dos imágenes, pero siempre produce un solo clip.

**Prompt de imagen (con negative prompt incluido, listo para copiar todo junto)**:
```
Vertical 9:16. [CHARACTER BIBLE si aplica], [acción y ambiente real de esta toma], handmade clay texture with refined subtle sculpting marks, soft diffused lighting, tactile plasticine material, matte surface finish, no text no captions no watermark

Negative prompt: amateur clay sculpture, messy fingerprints, excessive fingerprints, uneven childish proportions, crude modeling, malformed anatomy, real-world materials, realistic transparency, real glass, real metal, real fabric, photorealistic textures, flat lighting, stock photo look, CGI hyperrealism, generic 3D render, 2D illustration, anime style, harsh shadows, overly glossy plastic, cluttered composition, weak focal point, text artifacts
```
Para tomas de detalle puro aislado (macro de textura, ingrediente, sin escena que construir): usa `solid color seamless background` en vez de la descripción de ambiente.

**Prompt de video** (a partir de esa imagen — describe SOLO movimiento). **Antes de escribirlo, decide si esta toma necesita frame final, por lo que la toma HACE, no por lo que dura:**

- **Sin frame final (una sola imagen)** — cuando la acción empieza y termina en el mismo estado visual: un gesto que se resuelve solo, un plano sostenido, un movimiento de cámara sobre una escena que no cambia. La imagen de la toma es el único fotograma.
- **Con frame final (dos imágenes)** — cuando la escena **aterriza en un estado distinto** del que empezó: el personaje pasa de neutral a sorprendido, el producto pasa de cerrado a abierto, algo se transforma. El frame final es el estado **ya aterrizado**, nunca a mitad de movimiento. Si tu descripción del frame final dice "a medio caer" o "estirando la mano", está mal: o lo llevas al estado resuelto, o la toma no necesita frame final.

En caso de duda, una sola imagen: menos imágenes que pagar, y los modelos de imagen-a-video manejan bien un arco de movimiento completo desde un solo fotograma.

> **Nota histórica — no reintroduzcas el frame puente.**
>
> Esta skill tenía antes una regla que partía la toma según su duración (3-5s → 1 clip; 6-9s → 2 sub-clips unidos por un "frame puente" intermedio; +9s → un puente cada 3-5s). **Está eliminada.**
>
> Venía de un tope técnico de ~5 segundos por generación que tenían los modelos de la época (Kling 1.x, Runway Gen-3, Luma): una toma de 7 segundos literalmente no cabía en un clip y había que partirla. **Ese límite ya no existe**: el modelo que usa el pipeline genera hasta 10 segundos en un solo clip, con frame inicial y final.
>
> Y romper "una toma = un clip" rompe el contrato del manifiesto de producción, que asume esa correspondencia en todo el motor: ventanas de tiempo, subtítulos, montaje.
>
> **Si alguna vez una toma larga se siente estática a mitad, la salida es dividir esa línea del guion en dos tomas** — cada una con su propia línea, su propia imagen y su propio clip. Nunca volver al frame puente.

Plantilla del **prompt de video** (una sola, lleve la toma uno o dos fotogramas):
```
Stop-motion claymation animation, image-to-video from the shot above, [DURACIÓN]s.
Camera: [un solo movimiento — vocabulario preciso: "static" / "slight push-in" / "slow pan left" / "arc right"]
Motion: [una sola acción, ej. "character blinks and tilts head slightly"]
Ensure handmade stop-motion clay animation throughout the video. Non CGI. Non cinematic. Animation must start at the first frame. Non-disney. Non cartoon.
[Si hay personaje en la toma, agregar también:] Keep character facial consistency. No character redesign. No facial feature changes.
```

**Prompt del frame final** — solo en las tomas que lo lleven. Mismo formato que el prompt de imagen normal, con el mismo bloque negativo, describiendo el **estado ya aterrizado**:
```
Vertical 9:16. [CHARACTER BIBLE si aplica], [estado final ya resuelto de esta toma — mismo encuadre, misma luz, mismo ambiente que el frame inicial, SOLO cambia el estado del sujeto], handmade clay texture with refined subtle sculpting marks, soft diffused lighting, tactile plasticine material, matte surface finish, no text no captions no watermark

Negative prompt: amateur clay sculpture, messy fingerprints, excessive fingerprints, uneven childish proportions, crude modeling, malformed anatomy, real-world materials, realistic transparency, real glass, real metal, real fabric, photorealistic textures, flat lighting, stock photo look, CGI hyperrealism, generic 3D render, 2D illustration, anime style, harsh shadows, overly glossy plastic, cluttered composition, weak focal point, text artifacts
```

Entre el frame inicial y el final: **mismo ángulo, mismo encuadre, misma luz, mismo fondo, misma paleta — solo cambia el estado del sujeto.** Si cambia el encuadre, no es un frame final: son dos tomas distintas.

Si no sabes qué describir en la dirección visual del video de una toma con dos fotogramas, usa el fallback confirmado: "Create a handmade stop-motion clay animation transition between start and end frame."

Las líneas "Ensure handmade stop-motion..." y "Keep character facial consistency..." son coletillas fijas confirmadas — inclúyelas siempre tal cual, no las parafrasees.

**El aspect ratio va en palabras (`Vertical 9:16`) al principio del prompt de imagen, nunca como parámetro.** Nada de `--ar`, `--v` ni `--style` dentro de un prompt: el motor manda el texto tal cual al generador, y un flag de Midjourney ahí llega literal a un modelo que no lo entiende y lo trata como parte de la descripción. El prompt de video no lleva ratio: hereda el encuadre de su frame. Es lo que hace crochet en sus 40 imágenes.

### 3.6 — Bloque de B-roll (aparte, al final — CON ubicación exacta, no genérica)
Macro/close-up del material o ingrediente en plastilina (textura, corte transversal) mientras la voz narra un beneficio. Mantén siempre la textura refinada (marcas sutiles, no huellas caóticas) incluso en el B-roll.

**Personajes secundarios reaccionando** (confirmado en anuncios reales, técnica de B-roll — no de las tomas principales): además del B-roll de material/ingrediente, puedes usar tomas cortas de B-roll de gente/animales reaccionando al problema o al resultado (una vecina sorprendida, una mascota, un grupo en la calle), todo en plastilina — amplifica el impacto sin necesitar al protagonista en cuadro. **Importante**: esto es una opción de B-roll, no cambia la duración de las tomas principales — esas siguen calculándose por palabras ÷ 2.4 según lo que diga cada línea (a veces 2s, a veces 8s), nunca fuerces todas las tomas a ser cortas de 1-2s solo porque el B-roll usa cortes rápidos. El ritmo rápido final de edición es resultado de unir tomas + B-roll en CapCut, no de que cada toma individual sea ultra-corta.

**Genera un B-roll por cada toma principal — la misma cantidad, 1 a 1** (si hay 7 tomas principales, 7 B-roll; nunca menos). Cada B-roll debe indicar explícitamente **dónde va**: después de qué toma y sincronizado con qué línea/idea exacta. Nunca entregues el B-roll como lista suelta — ese criterio es tu trabajo. Cada B-roll lleva su prompt de imagen (con negative prompt en el mismo bloque, igual que las tomas principales) y su prompt de video en un bloque separado — **cada uno con su etiqueta `**Imagen:**` / `**Video:**` como encabezado, igual que en las tomas principales (regla de formato del Paso 3.5) — este es un punto donde se ha fallado antes, verifica que quede claro cuál bloque es cuál antes de entregar.**

**Regla de consistencia al reordenar o editar**: si insertas, eliminas, reordenas o editas una toma después de haber numerado el guion, **renumera TODAS las referencias cruzadas y recalcula la duración de cada línea afectada antes de responder** — no solo la tabla del guion. Esto incluye las ubicaciones del B-roll ("Insertar dentro de la Toma X"), cualquier mención de número de beat, y la duración (palabras ÷ 2.4) de líneas nuevas o editadas. Nunca digas "las demás tomas quedan igual, solo se corren un número" sin efectivamente reescribir cada referencia — verifica antes de entregar.

## Paso 4 — Localización por mercado (afecta CTA, texto en pantalla y tono — NO los prompts visuales)
- **Estados Unidos** (inglés, checkout directo): urgencia por stock/tiempo, prueba social cuantificada, CTA "Shop Now"/"Get Yours Today".
- **LatAm** (español, con contra-entrega): mencionar explícitamente "paga cuando lo recibas"/"pago contra entrega" si aplica, envío a todo el país, tono cercano. Si el usuario pide que NO aparezca precio/descuento, respétalo. Español neutro salvo país específico.
- **Brasil** (portugués): Pix/parcelamento si aplica, tono cálido y directo.

**Visualiza la oferta concretamente, no solo el producto solo**: cuando la línea de CTA mencione un detalle específico de la oferta (envío gratis, pago contra entrega, garantía de devolución, "sin riesgo", "pruébalo X días"), la descripción visual de esa toma debe ilustrar ese detalle de forma concreta, no ser solo un plano genérico del producto — ej. si dice "pago contra entrega", muestra a un repartidor de plastilina entregando el paquete en la puerta de una casa; si dice "garantía de devolución", muestra el gesto de un apretón de manos o el paquete siendo devuelto con una carita de aprobación. Usa tu criterio para elegir la imagen que mejor represente ese beneficio específico — no lo dejes en un plano de producto solo por defecto cuando el guion te está dando algo más concreto para mostrar.

## Paso 5 — Formato de entrega final

**Regla no negociable**: arma SIEMPRE el paquete completo (guion + Character Bible + todas las tomas con negative prompt incluido + B-roll 1:1 + overlays + guion de voz en off para ElevenLabs + herramientas) desde el primer intento, con todos sus chequeos, y guárdalo en el manifiesto (Paso 6). **Al terminar, el paquete no se muestra en el chat**: queda interno, en el manifiesto, y en el chat va solo el resumen corto y las tres opciones del Paso final. Cuando se entrega el paquete (opción C, o si el usuario lo pide), va completo, nunca una muestra — nunca solo una toma de muestra, nunca "¿quieres que te dé el resto?", nunca sin el guion limpio de voz en off. Si no especificó duración, usa el mínimo de 30s y avísale que puede pedir más.

Cuando se entrega (opción C del Paso final), va con esta estructura:
1. Ángulo elegido y por qué (1-2 líneas) — declara el loop de curiosidad y dónde ocurre el giro
2. Character Bible (si hay personaje)
3. Tabla de guion línea por línea con duración calculada
4. Por cada toma: prompt de imagen (con negative prompt debajo, mismo bloque) + prompt de video en bloques de código separados
5. Bloque aparte de B-roll (1 por cada toma principal, misma cantidad) con ubicación exacta
6. Notas de overlays/texto en pantalla (nunca dentro de los prompts)
7. **Guion de voz en off limpio, listo para copiar y pegar directo en ElevenLabs** — solo las líneas habladas en orden, sin numeración, sin marcas de tiempo, en un bloque de código aparte. Obligatorio desde la primera entrega.
8. Herramientas recomendadas: Imagen — Midjourney (`--style raw` ayuda a la textura), Nano Banana/Seedream (aceptan negative prompt como campo separado). Video — **Kling 3.0** (mejor calidad, soporta frame inicial + frame final), Seedance (opción más económica), Runway Gen-4, Luma Dream Machine. Voz — ElevenLabs, tono cálido/conversacional o el que pida el ángulo.

El manifiesto de producción (Paso 6) **no** va en esta lista: se escribe en su archivo y nunca se muestra en el chat.


---

## Paso 6 — Manifiesto de producción (JSON)

Este paso es **aditivo y no cambia nada de lo anterior**: el paquete del Paso 5 se arma exactamente igual. Además, escribes un manifiesto JSON en su archivo. **El manifiesto es interno del sistema y nunca se muestra en el chat**, ni siquiera en la opción C.

**Para qué sirve**: el manifiesto es el único punto de contacto entre esta skill y el pipeline de producción, que lee ese archivo, arma las colas de imágenes y videos (que después generas en Google Flow, ver el Paso final), genera el audio y arma el montaje. Mientras armas el paquete no ejecutas nada de eso ni sabes nada de APIs — solo describes el anuncio en JSON.

**Regla de fidelidad**: los prompts del manifiesto son **exactamente los mismos** que escribiste en el Paso 3.5 y 3.6, carácter por carácter, con el negative prompt incluido. El manifiesto es la fuente de verdad: cuando le muestres un prompt al usuario (en la opción C, o una parte que te pida), cópialo del manifiesto carácter por carácter. Si lo que le muestras difiere del manifiesto, el video final no será el que él aprobó.

### 6.1 — Dónde va

En `temp/[slug-del-anuncio]/manifiesto.json`, donde `[slug-del-anuncio]` es el nombre del producto en kebab-case, validado con `npm run validar -- temp/[slug-del-anuncio]/manifiesto.json` antes del resumen del Paso final, corrigiendo lo que marque. **Si el usuario dio foto del producto** (6.6) y todavía no está en la carpeta del anuncio, el error de que falta `producto.jpg` es esperable: no es un fallo del manifiesto, se resuelve al preparar la foto, y **nunca quites la entrada del producto para que pase**. Si sabes dónde está la foto, corre tú primero el comando de la foto (6.6) y valida después. Cualquier otro error se corrige antes del resumen.

**No va en el chat**: ni pegado como JSON, ni en la entrega de la opción C. En el resumen basta media línea diciendo que quedó guardado y validado (o, si la foto todavía no está en su carpeta, que se la pida: 6.6).

### 6.2 — Estructura

```json
{
  "estilo": "claymation",
  "modo_audio": "voz_en_off",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "referencias": [
    {
      "id": "anfitrion",
      "tipo": "personaje",
      "prompt": "[el Character Bible completo de este personaje, Paso 3.3, palabra por palabra]"
    },
    {
      "id": "invitado",
      "tipo": "personaje",
      "prompt": "[el Character Bible completo del SEGUNDO personaje, si el ángulo lo tiene]"
    },
    {
      "id": "producto",
      "tipo": "producto",
      "archivo": "producto.jpg",
      "nota": "envase esculpido en plastilina, conservando forma, proporciones y etiqueta reales"
    },
    {
      "id": "microfono-rojo",
      "tipo": "objeto",
      "prompt": "[si hay un elemento recurrente que no es personaje ni producto, va aquí con su propio prompt]"
    }
  ],
  "tomas": [
    {
      "n": 1,
      "tipo": "B",
      "duracion": 5.4,
      "linea": "[la línea de voz en off de esta toma]",
      "prompt_imagen_inicial": "[prompt de imagen completo, con su negative prompt]",
      "prompt_imagen_final": "[prompt del frame final, solo si la toma lo lleva]",
      "prompt_video": "[prompt de video completo]",
      "referencias": ["personaje"]
    }
  ],
  "broll": [
    {
      "n": 1,
      "despues_de_toma": 1,
      "sincroniza_con": "[la idea con la que sincroniza]",
      "duracion": 3,
      "prompt_imagen": "[prompt completo del Paso 3.6]",
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
| `estilo` | Siempre `"claymation"`. |
| `modo_audio` | Siempre `"voz_en_off"` — los clips no llevan diálogo y la voz se genera aparte. |
| `mercado` | Del Paso 1/4: `"EEUU"`, `"LatAm"` o `"Brasil"`. |
| `idioma` | `"en"`, `"es"` o `"pt"`, según el mercado. |
| `aspect_ratio` | Del Paso 1. Por defecto `"9:16"`. |
| `referencias` | La lista de referencias del anuncio. En claymation: **uno o dos personajes**, cada uno con su Character Bible completo del Paso 3.3 (si son dos, distintos entre sí), **el producto** si el usuario dio foto, y **cualquier elemento recurrente** que el anuncio necesite. Ver 6.4. |
| `tomas[].n` | El número de toma de la tabla del Paso 2.4, consecutivo desde 1. |
| `tomas[].tipo` | `"A"` si la toma lleva **una sola imagen**; `"B"` si lleva **frame inicial y frame final** (Paso 3.5). |
| `tomas[].duracion` | La duración calculada en el Paso 2.4 (palabras ÷ 2.4), con un decimal. **No la redondees.** |
| `tomas[].linea` | La línea de voz en off de esa toma, exactamente como está en la tabla. |
| `tomas[].prompt_imagen_inicial` | El prompt de imagen completo **con su negative prompt incluido**, tal como lo escribiste en el Paso 3.5. |
| `tomas[].prompt_imagen_final` | Solo en las tomas Tipo B. En las Tipo A va `null`. |
| `tomas[].prompt_video` | El prompt de video completo. |
| `tomas[].referencias` | Ver 6.4. |
| `broll[]` | Uno por cada toma principal (Paso 3.6). |
| `voz_en_off` | El guion limpio del punto 7 del Paso 5, idéntico. |
| `overlays` | Las notas de texto en pantalla del punto 6 del Paso 5. Array vacío `[]` si no hay. |

### 6.4 — El campo `referencias`

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

**Qué emite claymation normalmente:**

- **Uno o dos personajes**, cada uno con **su Character Bible completo del Paso 3.3** como `prompt`. Si son dos, el propio Paso 3.3 avisa de que no se reutiliza el mismo Bible cambiando una palabra: son personajes distintos, con su propia forma y personalidad.
- **El producto**, con `archivo`, si el usuario dio foto del envase.
- **Cualquier elemento recurrente** que el anuncio necesite: el villano-molécula que reaparece, la mascota de plastilina, el objeto que vuelve entre tomas. Cada uno su entrada, su `id` y su `prompt`.

**Nota**: el Paso 3.3 dice que no generes una imagen de referencia aparte. Eso vale para el flujo manual. Cuando emites una entrada con `prompt`, el pipeline sí genera su hoja automáticamente y la reutiliza — no te cuesta trabajo y es lo que mantiene la consistencia.

En las tomas, además de los `id` de la lista, hay **un valor reservado**:

- `"frame_anterior"` — no apunta a la lista, apunta al frame de la toma anterior. Úsalo solo cuando la continuidad entre dos tomas importe de verdad.

Array vacío `[]` si la toma no necesita ninguna referencia.


### El B-roll declara sus referencias igual que una toma

**Si en un B-roll aparece el personaje —o una parte de él: una mano sosteniendo algo, la persona de espaldas, sus pies, un detalle de ella usando el producto—, ese B-roll TIENE que incluir el `id` del personaje en sus `referencias`. Si no lo incluyes sale otra persona, y se nota al corte.**

Lo mismo con el producto: **si el envase aparece en un B-roll, ese B-roll declara el `id` del producto**, o sale un envase inventado.

Los B-roll que no muestran ni al personaje ni al producto —macro de una textura, el mecanismo, un objeto suelto, un ambiente— van con `[]` y esta regla no les aplica.

> **De dónde sale.** La regla existía escrita solo en la skill de UGC, y UGC es el único anuncio de la familia donde los B-roll la cumplieron al 100% (5 de 5). En los demás no estaba escrita y se nota en los números: crochet declaró referencias en 2 de 16 B-roll, skeleton en 2 de 11, y el primer zack-d en 1 de 16 — donde un B-roll de la mano del personaje salió con **otra mujer**, con otro pelo, otra cara y un anillo que el personaje no tiene. Replicada a todas las skills el 2026-09-06.


En las tomas Tipo B **no declares nada para el frame final**: la capa de producción siempre le pasa el frame inicial como referencia al generar el final.

### 6.5 — Verificación antes de entregar

1. ¿Hay una entrada en `tomas` por cada fila de la tabla del guion, y los `n` coinciden?
2. ¿Hay un B-roll por cada toma principal?
3. ¿Todas las Tipo B tienen `prompt_imagen_final`, y todas las Tipo A lo tienen en `null`?
3b. ¿Cada `id` que declaran las tomas existe en la lista de `referencias`?
4. ¿Cada prompt del manifiesto es idéntico, carácter por carácter, al que escribiste en el Paso 3.5 y 3.6, con su negative prompt?
5. ¿Las `linea` de todas las tomas, en orden, dan el mismo texto que `voz_en_off`?
6. ¿Cada toma produce **un solo clip**? Si estás a punto de emitir dos clips para una toma, para: eso está eliminado (ver la nota del Paso 3.5).
7. ¿El JSON es válido? Comillas dobles, sin comas colgando.

### 6.6 — La foto del producto (nunca inventes el nombre del archivo)

El `archivo` de la entrada del producto es el nombre de un archivo que **tiene que existir de verdad** en la carpeta del anuncio. Si escribes ahí un nombre inventado a partir de la marca, el pipeline se detiene, o peor, genera un envase inventado.

- Si el usuario dio foto → la entrada del producto existe, con `"archivo": "producto.jpg"`, siempre ese nombre.
- Si no dio ninguna → **la entrada del producto simplemente no está en la lista**, y ninguna toma ni B-roll puede declararla.

Y si dio foto, esa foto tiene que quedar en la carpeta del anuncio con este comando, y **lo corres tú**, con el manifiesto ya escrito y antes de validar (6.1), si sabes dónde está el archivo: la ruta que te dio el usuario, o la imagen que pegó en el chat (la lees en su ruta local). La ruta va tal cual, aunque sea `.webp` o `.heic` o tenga espacios en el nombre:

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug-del-anuncio]
```

El comando la copia a la carpeta del anuncio, la convierte si hace falta, y deja el nombre correcto escrito en el manifiesto. Si no sabes dónde está, en el resumen del Paso final pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando, y córrelo tú apenas la tengas. Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. **Ningún comando va en el mensaje del Paso final.**

Ese comando puede dejarla como `producto.png` o `producto.webp`, y en ese caso
corrige él mismo el nombre en el manifiesto. **Después de correrlo, el nombre
bueno es el que dejó él**: si vuelves a tocar el manifiesto (por ejemplo, por un
cambio que pidió en la opción C), no lo "corrijas" de vuelta a `producto.jpg`,
o el validador dirá que la foto no existe.

## Paso final — Pregunta cómo quiere producirlo

**Si llegaste aquí desde la skill de anuncios musicales** (Paso 0), este Paso
final no va: ni el resumen ni las opciones A, B y C. En cuanto el manifiesto
queda escrito y validado, vuelve a esa skill: el cierre es el suyo, con su
propio resumen y sus opciones (en musical no hay guion de voz para ElevenLabs:
la canción es el audio).

Ya armaste el paquete completo (guion, prompts de cada toma, B-roll, texto en
pantalla y guion de voz) y el manifiesto quedó guardado y validado (si la foto
del producto todavía no está en su carpeta, el aviso de que falta es lo único
pendiente: ver 6.1). **Nada de
eso se muestra en el chat. Ahora, y solo ahora, dale un resumen corto y
pregúntale cómo quiere seguir.**

El resumen va en 1 a 3 líneas: estilo, producto, mercado e idioma, cuántas
tomas y cuántos B-roll, y la duración aproximada. Si hay una decisión que
conviene que sepa, va en **una** línea más (por ejemplo: *Agregué "Pagas al
recibirlo" en el cierre por el pago contra entrega*). Nada más: ni el guion, ni
los prompts, ni el manifiesto.

No lo decidas tú: las tres salidas son legítimas y cuestan cosas distintas.

```markdown
Listo: anuncio claymation de [producto] para [mercado] ([idioma]), [N] tomas
y [N] B-roll, unos [N] segundos. Quedó guardado y validado[, salvo la
foto del producto: pásamela (arrástrala al chat o dime la ruta) y la dejo en
su carpeta].
[Una línea con la decisión que conviene que sepas, solo si la hay.]

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero las imágenes y los videos en Google Flow,
armo el montaje y te entrego el MP4 terminado. Antes de gastar nada te digo lo
que cuesta: los créditos de Flow de los videos (las imágenes no gastan
créditos) y la música, que se paga en kie.ai.

**B) Genera solo las imágenes y los videos** — los genero en Google Flow y te
los dejo en su carpeta, listos para que los montes tú en CapCut a tu gusto.
También te digo los créditos de los videos antes.

**C) Entrégame el paquete de prompts** — te paso aquí todo el paquete: el
guion toma por toma, el Character Bible, los prompts de imagen y video de cada
toma, el B-roll, el texto en pantalla y el guion de voz para ElevenLabs, para
que lo revises o lo produzcas a mano. Después, si quieres, seguimos con A o B.
```

### En esta versión, las imágenes y los videos se hacen en Google Flow

El motor ya no genera las imágenes ni los videos: arma una lista de trabajo
(la "cola") y **los generas tú en Google Flow**, manejando Chrome con la
extensión Claude in Chrome. Esa extensión es el MCP conectado y elegir A o B es
el pedido explícito que exigen la introducción y las reglas del final para que
generes imágenes y video tú mismo.

Donde el proceso dice `npm run imagenes` o `npm run videos`, va este ciclo.
Todo lo demás (validar, voz, música, transiciones, plan, ensamblar) sigue
igual y en el mismo orden:

1. `npm run imagenes -- temp/[slug]` arma la cola (`flow/cola-imagenes.json`)
   y hace solo lo que no necesita Flow (las copias de frames).
2. Genera la cola en Google Flow con la skill **`flow-generacion`**: ahí está
   todo el procedimiento (ventana aparte, subir las referencias, enviar todo,
   reintentos, descargar cada archivo con su nombre). Las paradas propias de
   Flow que pide esa skill van siempre: el permiso en el chat antes de cada
   tanda de descargas, pedirle una vez al usuario que mueva el grupo de
   pestañas a una ventana aparte, y el inicio de sesión o el captcha, que hace
   el usuario.
3. `npm run flow:recibir -- temp/[slug]` mueve lo descargado a `img/` o
   `video/` del anuncio, lo convierte y lo verifica.
4. Repite 1-3 hasta que la cola diga que no queda nada: hay trabajos que
   dependen de otros (las hojas de referencia, el frame inicial de la misma
   toma, `frame_anterior`) y recién entran en la vuelta siguiente.
5. Lo mismo con `npm run videos -- temp/[slug]`. **Antes de mandar los videos
   a Flow**, dile al usuario cuántos clips son y la estimación de créditos que
   imprime el comando, y espera su ok. Las imágenes cuestan 0 créditos en Flow
   y no necesitan ok.

La música (Suno, `npm run musica`) **sigue por kie.ai**, igual que antes: en
esta versión es lo único que se cobra en kie.ai. La voz sigue por ElevenLabs.
Si kie.ai no está conectado, `npm run musica` lo explica y hay que preguntarle
al usuario: conectarlo o seguir sin música (sin saltarse las transiciones).
`npm run musica -- temp/[slug] --solo-plan` dice si está conectado
("kie.ai: conectado" o "NO conectado"): nunca se abre el `.env` para saberlo.

**Para regenerar una toma** (lo que el usuario decida después del informe), usa
`npm run rehacer`, que nunca repite el prompt que falló:

1. `npm run rehacer -- temp/[slug] --toma N --contexto` muestra lo que no se
   toca (línea, duración, tipo) y los prompts que fallaron. Escribe una escena
   distinta para la misma intención en un JSON con `prompt_imagen_inicial`,
   `prompt_imagen_final` (solo si la toma es B) y `prompt_video`.
2. `npm run rehacer -- temp/[slug] --toma N --aplicar nuevos.json` guarda los
   prompts viejos en `prompts-anteriores.json` y manda a `historial/` **la
   imagen y el clip** de esa toma: un clip hecho con el frame viejo no sirve
   con la imagen nueva, así que siempre se rehacen los dos.
3. Corre lo que imprime, en ese orden: `npm run imagenes -- temp/[slug] --tomas N`
   con el ciclo de Flow hasta que no quede nada (una toma B lleva dos vueltas:
   el frame final espera al inicial), después
   `npm run videos -- temp/[slug] --tomas N --sin-broll` con el ok de los
   créditos y el ciclo de Flow, y al final `plan` y `ensamblar`.

Ninguno de esos comandos lleva `--rehacer`, tampoco `flow:recibir`: la imagen y
el clip viejos ya no están en la carpeta, así que la cola trae solo esa toma.
No uses `npm run imagenes -- temp/[slug] --tomas N --rehacer`: vuelve a pedir
también las hojas de referencia y el B-roll de esa toma, y la toma nueva saldría
con un personaje distinto al de las demás. Y `--rehacer` repetido en la vuelta
siguiente archiva lo que acaba de llegar y lo vuelve a pedir (en videos, se
paga otra vez).

### Si elige A — el anuncio completo

Sigue el proceso de `COMO-PRODUCIR.md` de principio a fin, **sin pararte a
preguntar entre comando y comando** (salvo las paradas de abajo y las de Flow).
El usuario ya dijo que sí: pedirle permiso en cada paso es hacerle perder el
tiempo.

**Y no te saltes la música ni las transiciones** — secciones 3 y 4 de
`COMO-PRODUCIR.md`. Son **obligatorias** en este estilo, el pipeline **no avisa
si faltan**, y un anuncio sin ellas se renderiza perfecto y sale plano. Es el
fallo más fácil de cometer de todo el proceso.

Las dos únicas paradas que sí van, y que no se saltan nunca (además de las que
pide `flow-generacion`: el permiso de cada tanda de descargas, mover la ventana
una vez, y el inicio de sesión o el captcha, que hace el usuario):

1. **El costo, antes de gastar.** Las imágenes cuestan 0 créditos en Flow y
   no necesitan ok. Los videos sí: cuando `npm run videos` arme la cola, dile
   cuántos clips son y la estimación de créditos de Flow que imprime, y espera
   un sí antes de mandarlos a Flow. La música se sigue pagando en kie.ai:
   muéstrale su costo y espera un sí, como siempre.
2. **La revisión de clips, solo en `dialogo_nativo`** (UGC y objeto parlante).
   Ahí las tomas habladas no se pueden acelerar, así que un clip que sale mal
   solo se arregla regenerando — y regenerar después de ensamblar es rehacer
   todo el montaje.

Al final, entrégale los MP4 **y el informe** que pide `COMO-PRODUCIR.md`: qué
salió bien, qué salió mal toma por toma, qué regenerarías y cuántos créditos de
Flow costaría, y lo que se gastó de verdad (créditos de Flow en los videos; en
kie.ai, solo la música). Ahí él decide si quiere ajustar algo.

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
npm run validar   -- temp/[slug]/manifiesto.json
npm run imagenes  -- temp/[slug]        arma la cola: ciclo de Flow hasta que no quede nada
npm run audio     -- temp/[slug]        solo si el modo es voz_en_off
npm run videos    -- temp/[slug]        arma la cola: créditos al usuario, su ok, y ciclo de Flow
npm run plan:humano -- temp/[slug]
```

`imagenes` y `videos` son el ciclo de Google Flow de arriba (cola →
`flow-generacion` → `flow:recibir`, hasta que la cola diga que no queda nada).

El último deja `plan-montaje.txt` en la carpeta del anuncio: dice qué toma va
con qué línea, en qué segundo, qué B-roll le toca y dónde está el mp3 de la
voz. **Está escrito para que lo lea una persona**, y es lo que necesita para
montarlo en CapCut sin adivinar nada.

Dile dónde quedó todo y qué contiene ese archivo.

### Si elige C — el paquete en el chat

Entrégale el paquete **completo, nunca una muestra**, con la estructura del
Paso 5 (puntos 1 a 8): ángulo, Character Bible, tabla de guion, prompts de
imagen y video de cada toma, B-roll, texto en pantalla, guion de voz para
ElevenLabs y herramientas. **Sin el manifiesto**: ese no se muestra nunca.

Los prompts que le muestras se copian del manifiesto carácter por carácter, con
su negative prompt: el manifiesto es la fuente de verdad. Si pide cambios,
cámbialos en el manifiesto, vuelve a validarlo
(`npm run validar -- temp/[slug]/manifiesto.json`, con el criterio del 6.1 si
la foto todavía no está en su carpeta) y muéstrale lo que cambió,
copiado otra vez del manifiesto.

Al final, ofrécele seguir con A o B, o dejarlo ahí.

Y en cualquier momento, elija lo que elija: si pide ver el paquete o una parte
("muéstrame el guion", "pásame los prompts de la toma 3"), muéstrale esa parte,
copiada del manifiesto.

---
## Reglas que nunca se rompen
- Todo lo visible debe estar hecho de plastilina — nunca materiales reales (descríbelos como imitación esculpida si el objeto normalmente sería vidrio/metal/tela/etc).
- Nunca huellas dactilares caóticas — textura refinada y profesional siempre.
- Nunca pongas texto en pantalla, títulos ni watermarks dentro de los prompts de imagen o video.
- Nunca generes el video/imagen tú mismo salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente.
