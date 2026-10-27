---
name: anuncios-skeleton-ads
description: Genera anuncios publicitarios con IA en formato "Skeleton Ads" (personaje esqueleto 3D viral de TikTok/Meta) para marcas DTC/Ecommerce en Estados Unidos y Latinoamérica. Usar SIEMPRE que el usuario pida crear un anuncio, video ad, guion publicitario o creativo estilo "esqueleto", "skeleton ad", "personaje esqueleto que habla", "Day 1 Day 30 ad", "what happens if ad", o mencione crear anuncios con IA sin especificar estilo (en cuyo caso ofrecer este como una opción). Arma el guion completo (loop de curiosidad + escalada + giro + payoff, o formato parody-review) localizado en ES/EN/PT, los prompts de imagen y video toma por toma, el B-roll, el guion de voz para ElevenLabs y el manifiesto interno del pipeline; en el chat da un resumen corto y tres opciones (producirlo todo, solo las imágenes y los videos, o el paquete de prompts para copiar y pegar en Midjourney/Kling/Veo/Nano Banana/Seedance/ElevenLabs).
---

# Generador de Anuncios IA — Skeleton Ads

Convierte un producto en un anuncio completo estilo Skeleton Ads: guion + prompts de imagen y video por cada toma, listos para pegar en herramientas externas de generación (no genera imágenes/video directamente, salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente).

## Paso 0 — Si el guion ya viene escrito (atajo)

**Este paso solo se activa cuando el usuario pega un guion ya escrito y pide convertirlo a este estilo** ("tengo este anuncio ganador, pásamelo a esqueleto"). Si no llega ninguno, ignóralo entero y empieza por el Paso 1, como siempre.

### Lo que NO haces cuando llega un guion

- **No escribes un guion nuevo, ni "mejoras" el que te dieron.** Sáltate el Paso 2: el formato (2.0) y las mecánicas (2.1) ya están resueltos dentro del texto que llegó.
- **No cambias una sola palabra del texto.** Puedes partirlo en líneas y decidir dónde corta cada toma; nunca reescribirlo, ni acortarlo, ni pulirlo. El usuario lo trajo porque ya le funciona.
- **No preguntas el ángulo, ni el mercado, ni el dolor, ni la oferta.** Todo eso ya está resuelto dentro del guion: dedúcelo leyéndolo.
- **No fuerces el guion dentro de la escalada de seis marcadores del 2.1.** Si el guion ya escala, márcalo y aprovéchalo. Si no, respeta el guion: esa estructura es una forma de escribir uno propio, no un molde al que doblar uno ajeno.

### Lo que SÍ haces, en este orden

1. Di **en una sola frase** qué ángulo y qué mercado leíste en el guion, para que el usuario te corrija si te equivocaste. No es una pausa: sigues de largo.
2. **Sigue preguntando lo que el guion NO resuelve.** Aquí es la variante del personaje esqueleto (3.1): ningún guion la contesta, y sin ella no hay Character Bible.
3. Haz el desglose línea por línea del Paso 2.4 **sobre el texto que te dieron**, con su presupuesto de duración del 2.3.
4. De ahí en adelante, todo exactamente igual: personaje (3.1-3.3), prompts por toma (3.4), B-roll (3.5) y manifiesto (Paso 6).

---

## Paso 1 — Brief del producto

Si el usuario no lo dio todo, pregunta solo lo esencial en una sola tanda, siempre como texto abierto (no uses botones ni formularios, mantén la misma forma de preguntar para todos los campos) — no bloquees si ya es inferible del mensaje o de una imagen/link que compartió:
- Producto: nombre + qué es
- Dolor/beneficio principal
- Mercado/idioma: EE.UU. (inglés), LatAm (español — ¿qué país? ¿hay pago contra entrega?), Brasil (portugués), o varios
- Precio/oferta (descuento, envío gratis, garantía) — y si el usuario pide explícitamente que NO aparezca precio/descuento en el copy, respeta eso
- Formato/aspect ratio: vertical 9:16 por defecto, o el que indique
- NUNCA preguntes la variante de esqueleto, ni siquiera como opción — decide automáticamente según el producto (Paso 3.1), salvo que el usuario la mencione por su cuenta sin que se la preguntes.
- No preguntes por el formato de Skeleton Ad — se decide automáticamente en el Paso 2.0 (default: formato principal).

## Paso 2 — Elegir formato y escribir el guion

### 2.0 — Elegir el formato correcto

**Regla de elección — nunca le preguntes al usuario cuál formato prefiere**: si el usuario no especifica ni pide un estilo particular, usa automáticamente el **formato principal** — es el default de la skill, no una decisión que traslades al usuario. Solo usa el formato alterno si el usuario lo pide explícitamente, o si el producto claramente encaja mejor con humor de reseña que con una progresión escalada (en ese caso, decláralo tú mismo en 1 línea al entregar, no lo preguntes antes).

**Formato principal — Escalada progresiva** (el mejor documentado, default automático): narración en **segunda persona, tiempo presente** — el esqueleto es el avatar visual de "tú" viviendo una progresión, no habla de sí mismo en primera persona.

**Formato alterno — Parody-review en primera persona**: el esqueleto "prueba" el producto y da su opinión en primera persona, tono de creador real. Úsalo cuando el producto encaje mejor con humor de reseña que con una progresión escalada, o si el usuario lo pide explícitamente.

### 2.1 — Formato principal: las 4 mecánicas obligatorias (todo guion debe cumplir las 4)

**A. Hook de loop de curiosidad**: una pregunta que el espectador necesita ver contestada, y que no se resuelve hasta el final. Plantillas: "¿Qué pasaría si ___?" / "¿Qué pasa si ___ todos los días?" / "¿Cuánto tiempo puedes ___ antes de ___?" / "¿Cuántos ___ se necesitan para ___?" / "¿Qué pasa si NUNCA ___?"

**B. Columna de escalada**: una progresión de marcadores que se intensifica. Tres tipos — elige uno:
- **Tiempo**: usa un plazo REALISTA según el ángulo y el producto, nunca una fórmula fija que siempre llegue a un año. Si es Transformación (el beneficio se acumula con el uso constante), usa un arco corto y creíble para esa categoría — **por defecto Día 1 → Día 3 → Día 5 → Día 10 → Día 20 → Día 30**, casi nunca más de 60 días, porque un producto de consumo no tarda un año en mostrar efecto. Si es Costo de no actuar (consecuencias de NO usar el producto), ahí sí puede extenderse a meses o años, porque el punto es el deterioro del problema, no la velocidad del producto (ej. Día 1 → 1 mes → 3 años). Si es Origen/Escenario, es un escenario hipotético/especulativo ("qué pasaría si..."), puede usar años/décadas pero debe sentirse claramente fantástico, nunca como promesa literal de cuándo funciona el producto.

  > **MÍNIMO CUATRO O CINCO MARCADORES. Tres no es una escalada.** Con Día 1 → Día 14 → Día 30 no hay progresión: hay tres fotos sueltas. Lo que retiene es ver la curva subiendo escalón por escalón, y cada escalón necesita su propia imagen concreta y distinta. Puede haber más de seis si el producto lo pide — pero **por debajo de cuatro el formato deja de funcionar**.
- **Cantidad**: 1 → 5 → 25 → 42
- **Etapa**: Etapa 1 → Etapa 5

**Regla de orden obligatoria — NO te la saltes**: la primera línea del guion es SIEMPRE la pregunta del hook (mecánica A) como su propio beat independiente — nunca empieces directo en "Día 1" o el primer marcador de la escalada. "Día 1" es el PRIMER punto de la escalada (mecánica B) y va justo DESPUÉS del hook, no en su lugar. Estructura mínima: `[Beat 1: hook — pregunta] → [Beat 2: Día 1 — primer punto de la escalada] → [Beat 3: Día X — siguiente punto] → ... → [Beat final: payoff]`. Ejemplo correcto: "¿Qué pasa si nunca arreglas tu barrera de piel? Día 1: apenas una molestia. Día 30: ya no puedes salir sin maquillaje. Día 365: ..." — el hook es una línea propia, "Día 1" no la reemplaza.

**C. Especificidad visceral concreta**: cada beat es UNA imagen física, sensorial, visible — nunca un claim abstracto. Traduce cada beneficio a algo que se pueda ver/sentir. Ejemplos:
| Beneficio abstracto | Imagen visceral |
|---|---|
| "Te da energía" | "Parpadeas y ya limpiaste toda la casa. Te quedas mirando la lista de pendientes vacía, temblando de energía sobrante." |
| "Mejora tu piel" | "Tu piel se sentía papel de lija. Ahora rebota la luz como porcelana." |
| "Reduce la ansiedad" | "Tus pensamientos rugían como tráfico. Ahora es un susurro que puedes apagar." |
| "Ahorra dinero" | "Tu carrito de compras era un agujero negro. Ahora es una alcancía que no para de sonar." |
| "Costo de no actuar" | "Día 90: sigues improvisando con lo mismo de siempre. Las grietas ya se ven desde la puerta." |

**D. Payoff**: termina en **triunfo** (transformado, imparable, coronado) o **catástrofe** (fallo total, ruina) — nunca en un cierre plano.

**Playbook de diagnóstico** (elige el ángulo según el producto, nunca por defecto):
| Pregunta sobre el producto | Ángulo | Columna | Payoff |
|---|---|---|---|
| ¿El beneficio se acumula con el uso constante? | **Transformación** — "usa esto X días" | Tiempo | Triunfo |
| ¿Hay un status quo doloroso que empeora sin actuar? | **Costo de no actuar** | Tiempo | Catástrofe |
| ¿La gente fuerza una forma vieja/mala de resolverlo? | **Límite/sobrecarga** | Cantidad | Catástrofe |
| ¿El producto es vívido en un mundo/época inesperada? | **Origen/escenario** | Tiempo/Etapa | Triunfo |
A veces conviene fusionar dos ángulos. Di en una línea por qué elegiste el ángulo.

**Reglas de escritura**: segunda persona tiempo presente ("Te despiertas. Día uno. Tu piel se siente como papel de lija."), una imagen concreta por beat, escala cada beat más que el anterior, SIN voz corporativa (prohibido "revolucionario", "sin fisuras", "solución", "cambia las reglas del juego"), abre el loop en el hook y ciérralo en el payoff (nunca contestes antes), mini-loops entre beats para retención ("...pero eso no es nada comparado con el día 30"). Además: **especificidad = credibilidad** (números y detalles concretos — "Día 14", "3am" — vencen a los claims vagos); **escala el riesgo, no solo la línea de tiempo** (cada beat debe subir lo que está en juego, no solo avanzar el reloj); **una sola idea por beat** (meter dos ideas mata el ritmo y el loop).

Al presentar el guion, **declara explícitamente**: qué loop abriste en el hook, y en qué beat exacto ocurre "el giro" hacia el producto. Antes de entregar, verifica tú mismo: ¿la línea 1 es la pregunta del hook (no "Día 1" ni ningún marcador de la escalada)? Si no, corrígelo antes de responder.

**Swipe file (patrones reales, estudia el tono, no copies literal)**:
- Transformación/Tiempo: "Día uno... sabe a agua con tiza, te sientes estafado. Día 14 llega la saturación, combustible de cohete. Día 30 la niebla mental desaparece, enfocado láser."
- Costo de no actuar/Tiempo: "Día uno una toalla en el piso... un mes moho verde peludo... 3 años una infección en la sangre."
- Límite/Cantidad: "Un vaso refrescante... 15 vasos cuajando como queso... 42 vasos tu estómago revienta."
- Origen/Escenario: "Día uno pierdes la cama suave... Año 20 el candado biológico ya giró, la sociedad humana es un mundo alienígena."

### 2.2 — Formato alterno: parody-review en primera persona

- Escrito en primera persona, ~20-35 palabras por cada ~10s de esa sección.
- Suena a queja/advertencia/dato sorprendente/mini-rant, nunca a pitch de venta.
- El esqueleto se queda 100% en su papel de "creador real" — el CTA/precio va como beat final separado, no dicho por el esqueleto mismo.
- Ángulos: parody-reseña honesta (escepticismo → sorpresa), POV desde adentro del cuerpo, ruptura de 4ta pared (amigo dando consejo).

### 2.3 — Presupuesto de palabras y duración (aplica a ambos formatos)

Mínimo 30 segundos, sin techo fijo — puede llegar a 40s, 60s o más si el ángulo lo amerita (formato principal suele ser 5-7 beats, ~110-160 palabras totales). Si el usuario pide una duración específica, esa manda. Calcula el presupuesto de palabras: `duración objetivo en segundos × 2.4 palabras/segundo`. Escribe el guion a ese conteo real, no lo aproximes a ojo.

> **Una duración pedida orienta el presupuesto de palabras; NO es un blanco al que haya que llegar.** Estos números son estimaciones: `÷ 2.4` es un promedio y cada voz habla distinto. En los anuncios reales de esta familia la voz salió entre un 6% y un 24% más corta que lo estimado — este mismo estilo estimó 52.5s y la voz entregó 39.9s. Que salga más corto está bien y no hay nada que corregir: el montaje encaja cada toma contra los tiempos reales de la voz, acelerando unas y cortando otras. **Nunca agregues ni quites líneas para llegar a un número** — ya se hizo una vez en este estilo y el copy agregado quedó sin sentido. El guion dura lo que necesita durar para mostrar lo que muestra.

### 2.4 — Desglose línea por línea

Baja el guion a nivel de toma por línea/beat — cada uno tiene su propia toma visual sincronizada. La duración de cada toma es la duración real de decir esa línea (≈ palabras ÷ 2.4), no un número fijo. El ambiente de cada toma lo decide lo que esa línea necesita mostrar — puede mantenerse igual si la escena es continua, o cambiar por completo si el guion salta de contexto/época (común en el ángulo Origen/Escenario). El fondo sólido/estudio es solo una opción para detalle puro aislado (no aplica casi nunca en este estilo).

Entrega el guion en esta tabla:

| # | Duración (calculada) | Línea de voz en off | Idea de texto en pantalla (solo para el editor — NUNCA va dentro de los prompts) | Descripción visual (personaje + ambiente/acción) |
|---|---|---|---|---|

**Variedad de encuadre obligatoria**: no repitas el mismo plano en todos los beats — varía tipo establecimiento general → medio → dos-shot con un humano reaccionando → close-up de manejo del producto → toma hero/triunfo final. **Personajes secundarios reaccionando** (gente en la calle, compañeros de oficina, según la época/mundo del anuncio) amplifican el arco del esqueleto — inclúyelos cuando el ángulo lo permita.

**Postura al generar cada prompt**: actúa como un director de arte senior, no como traductor literal del guion — expande visualmente cada línea para que se vea más rica e imaginativa, sin perder la idea central ni desviarte del Character Bible.

## Paso 3 — ADN visual, personaje y prompts

### 3.1 — Variantes del personaje esqueleto (elige una según el producto, nunca "Cute" por defecto)

> **Catálogo visual: `recursos/esqueletos/`** (8 imágenes + `catalogo.json`).
>
> Son **referencias para mirar, no referencias del manifiesto**. El personaje del
> anuncio lo sigue generando el Character Bible del Paso 3.2, y la hoja hero que
> sale de ahí es la que se reusa en todas las tomas. El catálogo sirve para dos
> cosas: ver el rostro, la silueta y cómo lee un cuerpo translúcido **antes** de
> decidir, y escribir mejor el Bible sabiendo qué aspecto tiene la variante.
>
> Cada entrada dice a qué variante de esta lista corresponde. Hay tres tonos de
> ámbar donde aquí hay una sola "Resina Ámbar" — esa diferencia solo se ve, no
> se describe.
>
> **Sigue vigente la regla de no preguntar la variante**: se elige
> automáticamente según el producto. Lo que cambia es que ahora la elección se
> puede **mostrar** en vez de solo enunciarla, junto con la alternativa que
> compite, y el usuario puede corregirla si quiere. Mostrar no es preguntar.
1. **Bare-Bones Cinematic** (default): esqueleto anatómico completo, proporciones humanas adultas, hueso marfil realista (NO tipo juguete, NO chibi, NO terrorífico), ojos grandes expresivos con esclerótica blanca, cara emotiva. Sin ropa.
2. **Dressed Skeleton**: el mismo esqueleto vestido con outfit temático completo — bueno para moda, identidad, o escenarios de época (ángulo Origen/Escenario).
3. **X-Ray con órganos**: cuerpo translúcido brillante mostrando esqueleto + órganos internos brillando en rojo/naranja sobre contorno azulado — ideal para suplementos/salud. **Refinamiento**: en vez de iluminar todos los órganos genéricamente, resalta/ilumina el sistema u órgano específico relacionado al beneficio del producto (ej. sistema circulatorio con arterias rojas y venas azules + brillo rosado en el corazón para algo cardiovascular; sistema digestivo iluminado para un digestivo; etc.) — más preciso y relevante que un glow genérico. Se le pueden agregar pequeños accesorios (banda para la cabeza, gorra, lentes) sin necesidad de vestirlo completo — eso sería la variante Dressed.
4. **Cute Cartoon Mascot**: esqueleto chibi, tierno — solo si la marca es intencionalmente juguetona/infantil.
5. **Cristal Transparente** (nueva): cuerpo completamente transparente/incoloro tipo vidrio o cristal pulido, esqueleto marfil claramente visible dentro, sin tinte de color. Se siente más "modelo de exhibición/referencia" que médico — buena opción neutral cuando no quieres el tono azulado clínico del X-Ray, o como base para la imagen hero por su claridad.
6. **Resina Ámbar** (nueva): cuerpo translúcido en tono ámbar/dorado cálido tipo resina pulida o vidrio de miel, esqueleto color crema visible brillando a través. Se siente premium/coleccionable — buena opción para productos de belleza/lujo/bienestar que quieren un tono cálido en vez del frío del X-Ray o el incoloro del Cristal.

**Nota — versión infantil**: si el producto es para niños, usa las mismas Character Bibles pero con proporciones de niño en vez de adulto: reemplaza "natural adult human proportions, tall and lanky" por "child-sized proportions, shorter stature, slightly larger head-to-body ratio" en cualquiera de las 6 variantes — el resto de la descripción (ojos, textura, tono) se mantiene igual.

### 3.2 — Character Bible (repetir palabra por palabra en cada prompt de imagen — nunca cambia de diseño una vez fijado; rellena [THEME]/[paleta] una vez según el mundo del anuncio, nunca cambies la parte del personaje)

Bare-Bones Cinematic:
```
CHARACTER: a full anatomical skeleton with natural adult human proportions, tall and lanky, smooth ivory-cream bones with realistic bone detail (NOT toy-smooth, NOT chibi, NOT scary), large expressive cartoon eyes with white sclera and dark pupils, emotive and lovable face. No clothing..
STYLE: cinematic 3D animated render, photoreal [THEME] environment, warm [paleta] color grade, soft volumetric light with drifting steam/atmosphere, shallow depth of field. FORMAT: 9:16 vertical.
```
X-Ray con órganos:
```
CHARACTER: a translucent glowing anatomical human body revealing the full white skeleton plus visible internal organs glowing through a blue-tinted translucent skin outline, with [sistema/órgano específico relacionado al beneficio, ej. "the circulatory system highlighted — red arteries and blue veins running through limbs and torso, with a soft pink-magenta glow around the heart"] as the focal highlight, large expressive cartoon eyes with white sclera and dark pupils..
STYLE: clean sci-fi medical 3D render, cool blue translucent body with warm glow on the highlighted system, [ambiente: entorno real con brillo de rayos-X, o fondo degradado azul limpio], soft rim light. FORMAT: 9:16 vertical.
```
Dressed Skeleton:
```
CHARACTER: the same friendly skeleton (ivory bones, large expressive cartoon eyes with white sclera and dark pupils) wearing a complete [outfit temático según THEME]; skull, hands and any exposed bones still visible..
STYLE: cinematic 3D animated render, photoreal [THEME] environment, warm [paleta] color grade, soft volumetric light, shallow depth of field. FORMAT: 9:16 vertical.
```
Cute Cartoon Mascot:
```
CHARACTER: a cute chibi cartoon skeleton with an oversized round skull, big adorable eyes, a small rounded body, and smooth toy-like bones; bright, friendly, non-scary..
STYLE: playful Pixar-style 3D animated render, simple clean [pastel/THEME] background, soft even studio lighting, glossy finish. FORMAT: 9:16 vertical.
```
Cristal Transparente:
```
CHARACTER: a full anatomical human figure with a completely clear, colorless glass-like transparent body, the full ivory-cream skeleton clearly visible inside (skull, ribcage, spine, pelvis, limb bones, joints), large expressive cartoon eyes with white sclera and dark pupils visible within the transparent skull, emotive and friendly face. No clothing (small accessories like a headband are okay if the product calls for it)..
STYLE: clean bright product-photography 3D render, plain light [THEME/paleta] studio background, soft even studio lighting, glossy glass-like surface with subtle highlights, high clarity, no color tint. FORMAT: 9:16 vertical.
```
Resina Ámbar:
```
CHARACTER: a full anatomical human figure with a warm amber-gold translucent glossy body (like polished amber resin), the cream-colored skeleton visible glowing through the translucent amber surface (skull, ribcage, spine, pelvis, limb bones, joints), pale expressive eyes visible within the skull, calm friendly face. No clothing..
STYLE: clean bright product-photography 3D render, plain light [THEME/paleta] studio background, soft even studio lighting, glossy polished amber resin surface with warm highlights. FORMAT: 9:16 vertical.
```

**Nota de consistencia (NO la incluyas en el texto que se copia al generador de imágenes):** mantén cada Character Bible idéntico en todas las tomas de ese personaje, sin cambiar su diseño. Esta instrucción es para ti/el usuario, nunca para pegarla dentro del prompt — si se pega literal, algunas herramientas interpretan "every shot" como "muéstrame varias tomas en una sola imagen" y generan un collage con el personaje repetido en distintas poses, en vez de una sola imagen limpia.

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

### 3.3 — Consistencia entre tomas: sistema de 3 capas con imagen hero (reinstalado, corregido)

Este es el mecanismo de consistencia más importante de toda la producción — protegerlo es la regla #1.

1. **Texto fijo**: pega el Character Bible completo (CHARACTER + STYLE) en cada prompt, palabra por palabra.
2. **Imagen hero de referencia**: genera primero UNA imagen limpia, de cuerpo completo, pose neutral relajada (no T-pose forzado salvo que el usuario la prefiera así de referencia técnica), iluminación pareja, **fondo simple pero ya con una versión sencilla del mismo tema/mundo del anuncio** (NUNCA un fondo neutro en blanco vacío sin relación al ambiente — eso hace que el modelo invente un ambiente distinto en cada toma siguiente, confirmado en pruebas reales). Ejemplo: si el anuncio ocurre en una oficina moderna, la hero no lleva fondo blanco de estudio, lleva una versión simple/desenfocada de esa misma oficina.
3. **Referencia + no acumular drift**: cada imagen siguiente referencia la imagen hero (no la toma anterior, para no acumular error). Mecanismo por herramienta:
   - **Nano Banana/Gemini**: adjuntar la imagen hero como referencia y escribir "Using the attached skeleton character, keep its exact face, eyes, and bone style. Now show it [nueva acción/escena]."
   - **GPT Image**: seguir generando en el mismo chat, apuntando a la imagen hero: "Same skeleton character as the image above — identical eyes and proportions. New scene: [...]." Repite el texto del Character Bible cada vez.
   - **Midjourney**: `--cref [URL de la hero] --cw 100` (lock de personaje), `--sref [URL]` para lock de estilo, mismo `--seed [n]` si lo expone la herramienta, `--ar 9:16 --v 7`.
   - **Seedance**: pon la hero en el slot de imagen de referencia; pega el Character Bible como prompt + la nueva acción.

**Si el producto aparece en la toma**: recuérdale al usuario adjuntar también la foto real del producto como referencia adicional (segunda referencia), para que el producto se vea fiel, no solo el personaje.

Prompt de la imagen hero:
```
[CHARACTER BIBLE], clean neutral full-body shot, relaxed stance, even lighting, simple [THEME] background (versión simple del mismo mundo/ambiente del anuncio, no un fondo blanco vacío). No text, no captions, no words, no letters, no watermark, no UI
```

### 3.4 — Prompts por toma (una por línea del guion)

**Prompt de imagen** (el aspect ratio va en palabras dentro del texto, nunca como parametro: el motor manda el prompt tal cual al generador y un flag de Midjourney llega literal):
```
[CHARACTER BIBLE], [acción y expresión de esta toma], [ambiente cotidiano concreto, o ambiente de época si el ángulo es Origen/Escenario], handheld selfie-style framing (formato alterno) o encuadre más cinematográfico (formato principal), bright even lighting (alterno) o grading cálido ambientado (principal), highly detailed 3D render, no text, no captions, no words, no letters, no watermark, no UI
```

**Prompt de video** (image-to-video, a partir de esa imagen — describe SOLO movimiento, nunca diálogo ni texto):
```
3D animated skeleton character video, image-to-video from the shot above, [DURACIÓN]s.
Camera: [un solo movimiento — ej. "slow push-in", "subtle handheld shake", "slight punch-in on reaction"]
Motion: [una sola acción, ej. "blinks, head tilts", "exaggerated shocked reaction"]
Lighting: [según formato]
```

### 3.5 — Bloque de B-roll (aparte, al final — CON ubicación exacta, no genérica)

Este estilo depende mucho del B-roll para no sentirse como "solo un esqueleto hablando". **Genera un B-roll por cada toma principal — la misma cantidad, 1 a 1** (si hay 7 tomas principales, 7 B-roll; si hay 12, 12 B-roll; nunca menos). El patrón real en anuncios virales de suplementos intercala al esqueleto con **cortes cortos de animación científica/anatómica** (células, mitocondrias, articulaciones, torrente sanguíneo — semi-transparente, tonos azul/púrpura/verde, estética documental médico premium) exactamente cuando la voz menciona el beneficio fisiológico. Casi nunca lleva al esqueleto en cuadro.

Cada B-roll debe indicar explícitamente **dónde va**: después de qué toma y sincronizado con qué línea/idea exacta (ej. "Insertar dentro de la Toma 3, justo cuando se dice 'apoya la función celular'"). Nunca entregues el B-roll como lista suelta para que el usuario decida — ese criterio es tu trabajo. Cada B-roll lleva su prompt de imagen Y su prompt de video para animarlo, igual que las tomas principales — no solo la imagen.

**Regla de consistencia al reordenar o editar**: si en algún momento insertas, eliminas, reordenas o editas una toma (ej. el usuario pide agregar el hook que faltaba, o quitar una toma), **renumera TODAS las referencias cruzadas y recalcula la duración de cada línea afectada antes de responder** — no solo la tabla del guion. Esto incluye las ubicaciones del B-roll ("Insertar dentro de la Toma X"), cualquier mención de número de beat en el resumen del ángulo, y la duración (palabras ÷ 2.4) de cualquier línea nueva o editada. Nunca digas "las demás tomas quedan igual, solo se corren un número" sin efectivamente reescribir cada referencia y recalcular cada número — verifica antes de entregar.

Prompt de imagen tipo:
```
Semi-transparent 3D medical/scientific animation, [célula/mitocondria/articulación/etc.], soft glowing translucent tissue, blue-purple-teal color palette, dramatic macro close-up, volumetric lighting, ultra-detailed scientific visualization, documentary medical style, dark background, no text, no captions, no words, no letters, no watermark, no UI
```

Prompt de video para el B-roll (image-to-video, mismo formato que las tomas principales):
```
Semi-transparent 3D medical/scientific animation, image-to-video from the shot above, [DURACIÓN]s.
Camera: [un solo movimiento, ej. "slow push-in", "slight orbit"]
Motion: [una sola acción, ej. "particles drift and pulse gently"]
```

Incluye siempre el disclaimer legal si el producto es un suplemento/salud: "results may vary. Consult with doctor" o equivalente en el idioma del anuncio.

## Paso 4 — Localización por mercado (afecta CTA, texto en pantalla y tono — NO los prompts visuales)
- **Estados Unidos** (inglés, checkout directo): urgencia por stock/tiempo ("Only X left"), prueba social cuantificada, CTA "Shop Now"/"Get Yours Today".
- **LatAm** (español, con contra-entrega): mencionar explícitamente "paga cuando lo recibas"/"pago contra entrega" si aplica, envío a todo el país, tono cercano. CTA: "Pide el tuyo y paga cuando llegue" (COD) o "Cómpralo ahora con envío gratis" (checkout directo). Si el usuario pide que NO aparezca precio/descuento, respétalo. Español neutro salvo que pida un país específico.
- **Brasil** (portugués): Pix/parcelamento si aplica, tono cálido y directo.
- CTA de bajo perfil en ambos formatos — nunca "¡Compra ya!" en mayúsculas, rompe el tono del estilo.

**Visualiza la oferta concretamente, no solo el producto solo**: cuando la línea de CTA mencione un detalle específico de la oferta (envío gratis, pago contra entrega, garantía de devolución, "sin riesgo"), la descripción visual de esa toma debe ilustrar ese detalle de forma concreta — ej. si dice "pago contra entrega", muestra a un repartidor entregando el paquete en la puerta de una casa (puede ser el esqueleto mismo recibiéndolo, o un B-roll de la entrega). No lo dejes en un plano genérico del producto por defecto cuando el guion te está dando algo más concreto para mostrar.

## Paso 5 — Formato de entrega final

**Regla no negociable**: arma SIEMPRE el paquete completo (guion + Character Bible + todas las tomas + B-roll 1:1 + overlays + **guion de voz en off para ElevenLabs** + herramientas) desde el primer intento y con todos sus chequeos — nunca solo una toma de muestra, nunca omitas el guion limpio de voz en off. El paquete **no se muestra en el chat al terminar**: queda interno, en el manifiesto (Paso 6), y en el chat solo van el resumen corto y las opciones del Paso final. **Cuando se entrega el paquete** (opción C, o si el usuario lo pide), va completo, nunca una muestra, nunca "¿quieres que te dé el resto?". Si no especificó duración, usa el mínimo de 30s y avísale que puede pedir más.

El paquete tiene esta estructura (es la que se usa en el chat cuando el usuario elige C o lo pide):
1. Formato elegido (principal o alterno) + ángulo + variante de esqueleto, y por qué (1-2 líneas) — declara el loop de curiosidad y dónde ocurre el giro
2. Character Bible (con bloque STYLE relleno para el tema/mundo elegido)
3. Prompt de la imagen hero (generar primero, referencia maestra)
4. Tabla de guion línea por línea con duración calculada
5. Por cada toma: prompt de imagen + prompt de video en bloques de código separados
6. Bloque aparte de B-roll (1 por cada toma principal, misma cantidad) con ubicación exacta, cada uno con su prompt de imagen y de video
7. Notas de overlays/texto en pantalla y disclaimer si aplica (nunca dentro de los prompts)
8. **Guion de voz en off limpio, listo para copiar y pegar directo en ElevenLabs** — solo las líneas habladas en orden, sin numeración, sin nombres de toma, sin marcas de tiempo, en un bloque de código aparte. Nunca falta: cuando se entrega el paquete, este bloque va siempre, sin que el usuario tenga que pedirlo aparte.
9. Herramientas recomendadas: Imagen — Nano Banana 2, GPT/ChatGPT Image, Seedance, Midjourney. Video — Kling (still como start frame, "slow push-in"/"subtle handheld", 5s o 10s), Seedance (audio nativo, hasta ~15s, bueno para sonido ambiente, sin diálogo), Veo (fuerte adherencia al prompt, ~8s con audio nativo, mejor para tomas hero/payoff). Voz — ElevenLabs, una sola voz narradora calmada/dramática (formato principal) o casual/cómica (formato alterno).
10. Checklist de ensamblaje final: generar la voz en off del guion del paso 8 en ElevenLabs (una sola voz); generar cada clip desde su imagen fija con la duración de su línea; ordenar los clips en la línea de tiempo ajustados a la voz; si quiere subtítulos, agregarlos EN EL EDITOR (nunca quemados en el material generado) — blanco, sans-serif, contorno oscuro delgado, 2-3 palabras a la vez estilo karaoke, centrados en el tercio inferior; música de fondo (cama tensa/curiosa que sube en el payoff, por debajo del volumen de la voz); exportar en 9:16, 1080×1920.
11. **Manifiesto de producción (Paso 6)** — se escribe en el archivo `temp/[slug]/manifiesto.json` y **nunca se muestra en el chat**, ni siquiera cuando se entrega el paquete: es interno del sistema. Aditivo: no reemplaza nada de lo anterior.


---

## Paso 6 — Manifiesto de producción (JSON)

Este paso es **aditivo y no cambia nada de lo anterior**. Todo lo del Paso 5 se arma exactamente igual. Además, escribes un manifiesto JSON en un archivo.

**Para qué sirve**: el manifiesto es el único punto de contacto entre esta skill y el pipeline de producción, que lee ese archivo y genera las imágenes, los videos y el audio, y arma el montaje automáticamente. Tú no ejecutas nada de eso ni sabes nada de APIs — solo describes el anuncio en JSON.

**Regla de fidelidad**: los prompts del manifiesto son **exactamente los mismos** que escribiste en los Pasos 3.4 y 3.5, copiados carácter por carácter. El manifiesto es la fuente de verdad: todo prompt que le muestres al usuario (opción C, o porque pide una parte) se copia del manifiesto carácter por carácter. Si un prompt que le muestras difiere del manifiesto, el video final no será el que él revisó.

### 6.1 — Dónde va

Siempre en el archivo `temp/[slug-del-anuncio]/manifiesto.json`, donde `[slug-del-anuncio]` es el nombre del producto en kebab-case. Después de escribirlo y de pasar la verificación del 6.5, valídalo con `npm run validar -- temp/[slug-del-anuncio]/manifiesto.json` y corrige lo que marque antes del Paso final. Si lleva la foto del producto, déjala lista tú antes de validar (6.6); si no sabes dónde está y todavía no está en la carpeta del anuncio, el error de que falta ese archivo es esperable: se resuelve cuando te la pase; cualquier otro error se corrige antes del resumen. **Nunca se muestra en el chat**, ni siquiera en la opción C: es interno del sistema. En el resumen del Paso final basta con media línea que diga que quedó guardado y validado (y, si falta la foto, que se la pida: 6.6).

### 6.2 — Estructura

```json
{
  "estilo": "skeleton",
  "modo_audio": "voz_en_off",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "referencias": [
    {
      "id": "esqueleto",
      "tipo": "personaje",
      "prompt": "[el prompt de la IMAGEN HERO del Paso 3.3, completo, con el Character Bible dentro]"
    },
    {
      "id": "producto",
      "tipo": "producto",
      "archivo": "producto.jpg",
      "nota": "conservar forma, proporciones y etiqueta reales del envase"
    }
  ],
  "tomas": [
    {
      "n": 1,
      "tipo": "A",
      "duracion": 5.4,
      "linea": "[la línea de voz en off de esta toma]",
      "prompt_imagen_inicial": "[prompt de imagen completo del Paso 3.4]",
      "prompt_imagen_final": null,
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
      "prompt_imagen": "[prompt completo del Paso 3.5]",
      "prompt_video": "[prompt de video completo]",
      "referencias": ["producto"]
    }
  ],
  "voz_en_off": "[el guion limpio del punto 8 del Paso 5, idéntico]",
  "overlays": [
    { "texto": "Día 30", "toma": 4, "momento": "inicio" }
  ]
}
```

### 6.3 — Cómo se llena cada campo

| Campo | De dónde sale |
|---|---|
| `estilo` | Siempre `"skeleton"`. |
| `modo_audio` | Siempre `"voz_en_off"` — una sola voz narradora, generada aparte. |
| `mercado` | Del Paso 1/4: `"EEUU"`, `"LatAm"` o `"Brasil"`. |
| `idioma` | `"en"`, `"es"` o `"pt"`, según el mercado. |
| `aspect_ratio` | Del Paso 1. Por defecto `"9:16"`. |
| `referencias` | La lista de referencias del anuncio. En skeleton: **siempre el esqueleto**, con el prompt de su imagen hero del Paso 3.3 (no el Character Bible suelto), y **el producto** si el usuario dio foto. Ver 6.4. |
| `tomas[].n` | El número de toma de la tabla del Paso 2.4, consecutivo desde 1. |
| `tomas[].tipo` | **Siempre `"A"`.** Este estilo usa una sola imagen por toma; no hay frame final. |
| `tomas[].duracion` | La duración calculada en el Paso 2.3/2.4 (palabras ÷ 2.4), con un decimal. **No la redondees.** |
| `tomas[].linea` | La línea de voz en off de esa toma, exactamente como está en la tabla. |
| `tomas[].prompt_imagen_inicial` | El prompt de imagen completo del Paso 3.4, tal como lo escribiste. |
| `tomas[].prompt_imagen_final` | **Siempre `null`** en este estilo. |
| `tomas[].prompt_video` | El prompt de video completo. |
| `tomas[].referencias` | Ver 6.4. |
| `broll[]` | Uno por cada toma principal (Paso 3.5). |
| `voz_en_off` | El guion limpio del punto 8 del Paso 5, idéntico. |
| `overlays` | Las notas de texto en pantalla del punto 7 del Paso 5. Array vacío `[]` si no hay. |

### 6.4 — El campo `referencias` y la imagen hero

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

**Qué emite skeleton normalmente:**

- **Siempre el esqueleto**, con **el prompt de su imagen hero del Paso 3.3** como `prompt` — el prompt completo de la hero, no el Character Bible suelto. Si emites solo el Bible, el pipeline generaría una hoja distinta de la que la skill especifica y se perdería la regla del fondo.
- **El producto**, con `archivo`, si el usuario dio foto del envase.
- **Lo que haga falta**: cualquier objeto o elemento que reaparezca entre tomas.

**El sistema de 3 capas del Paso 3.3 es exactamente lo que hace el pipeline**, sin que tengas que explicarlo:

- La **capa 1** (Character Bible pegado en cada prompt) la cumples tú al escribir los prompts de cada toma.
- La **capa 2** (imagen hero) la genera el pipeline a partir del `prompt` de esa entrada, una sola vez, antes que todo lo demás.
- La **capa 3** (referenciar la hero, nunca la toma anterior, para no acumular drift) es el comportamiento por defecto: cada toma que declara el `id` del esqueleto recibe la hoja, nunca el frame previo. Por eso **evita `"frame_anterior"` en este estilo** — el Paso 3.3 es explícito en que referenciar la toma anterior acumula error.

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
3. ¿**Todas** las tomas tienen `tipo: "A"` y `prompt_imagen_final: null`?
4. ¿Cada prompt del manifiesto es idéntico, carácter por carácter, al que escribiste en los Pasos 3.4 y 3.5?
5. ¿Las `linea` de todas las tomas, en orden, dan el mismo texto que `voz_en_off`?
6. ¿La entrada del esqueleto lleva el prompt de la **imagen hero**, no solo el Character Bible suelto?
6b. ¿Cada `id` que declaran las tomas existe en la lista de `referencias`?
7. ¿El JSON es válido? Comillas dobles, sin comas colgando.

### 6.6 — La foto del producto (nunca inventes el nombre del archivo)

El `archivo` de la entrada del producto es el nombre de un archivo que **tiene que existir de verdad** en la carpeta del anuncio. Si escribes ahí un nombre inventado a partir de la marca, el pipeline se detiene, o peor, genera un envase inventado.

- Si el usuario dio foto → la entrada del producto existe, con `"archivo": "producto.jpg"`, siempre ese nombre.
- Si no dio ninguna → **la entrada del producto simplemente no está en la lista**, y ninguna toma ni B-roll puede declararla.

**La foto la dejas lista tú**, apenas escribiste el manifiesto y antes de validarlo (6.1), si sabes dónde está: la ruta que te dio el usuario, o la imagen que pegó en el chat (la lees en su ruta local). La ruta va tal cual, aunque sea `.webp` o `.heic` o tenga espacios en el nombre:

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug-del-anuncio]
```

El comando la copia a la carpeta del anuncio, la convierte si hace falta, y deja el nombre correcto escrito en el manifiesto. Si no sabes dónde está, en el resumen del Paso final pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando, y córrelo tú apenas la tengas. Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. **Ningún comando va en el mensaje del Paso final.**

### 6.7 — Nota sobre el checklist de ensamblaje

El punto 10 del Paso 5 describe el montaje a mano (generar la voz, ordenar los clips, subtítulos en el editor, música, exportar 9:16). **Sigue siendo válido y va igual en el paquete** (el que se entrega en la opción C) — mucha gente prefiere editar en CapCut.

Si el usuario usa el pipeline, esos pasos ocurren solos a partir de este manifiesto. Los dos caminos conviven: el manifiesto no reemplaza el checklist, lo automatiza para quien quiera.

## Paso final — Pregunta cómo quiere producirlo

Ya armaste el paquete completo (guion, Character Bible, prompts de cada toma,
B-roll, texto en pantalla, guion de voz y herramientas) y el manifiesto quedó
guardado en `temp/[slug]/manifiesto.json`, verificado (6.5) y validado (6.1; si
la foto del producto todavía no está en su carpeta, eso es lo único pendiente).
**Nada de eso se muestra en el chat al terminar**: el paquete queda interno, en
el manifiesto, y el manifiesto no se muestra nunca. **Ahora, y solo ahora,
pregúntale al usuario cómo quiere seguir.**

En el chat va solo esto: un **resumen corto** (1-3 líneas: estilo y formato,
producto, mercado/idioma, cuántas tomas y B-roll, duración aproximada y, si
hay, UNA línea con la decisión que conviene que sepa) y las tres opciones.

No lo decidas tú: las tres salidas son legítimas y cuestan cosas distintas.

```markdown
Listo: anuncio Skeleton Ads ([formato], esqueleto [variante]) de [producto]
para [mercado], en [idioma]. [N] tomas + [N] B-roll, unos [N] segundos. El
paquete completo quedó guardado y validado[, salvo la foto del producto:
pásamela (arrástrala al chat o dime la ruta) y la dejo en su carpeta].
[Solo si hay: UNA línea con la decisión que conviene que sepa, p. ej.
"Agregué 'Pagas al recibirlo' en el cierre por el pago contra entrega".]

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero las imágenes y los videos en Google Flow,
armo el montaje y te entrego el MP4 terminado. Antes de gastar nada te digo
cuántos créditos de Flow cuestan los videos (las imágenes no gastan).

**B) Genera solo las imágenes y los videos** — los genero en Google Flow y te
los dejo en su carpeta, listos para que los montes tú en CapCut a tu gusto.
Antes de los videos te digo cuántos créditos de Flow gastan.

**C) Entrégame el paquete de prompts** — te paso aquí el paquete completo:
guion línea por línea, Character Bible, prompt de la imagen hero, prompts de
imagen y de video de cada toma, B-roll, texto en pantalla, guion de voz para
ElevenLabs y herramientas, para que lo revises o lo produzcas a mano. Después
puedes seguir con A o B.
```

Si en cualquier momento pide ver el paquete o una parte ("muéstrame el
guion", "pásame los prompts de la toma 3"), muéstrale esa parte, copiada del
manifiesto. El manifiesto en sí, nunca.

### En esta versión, las imágenes y los videos se generan en Google Flow

El motor ya no pide las imágenes ni los videos a ninguna API: arma una lista de
trabajo (la "cola") y **los generas tú en Google Flow**, manejando Chrome con la
extensión Claude in Chrome. Esa extensión es el MCP conectado del que hablan la
introducción y la última regla de esta skill, y que el usuario elija A o B es
el pedido explícito.

Donde el proceso (este paso o `COMO-PRODUCIR.md`) dice `npm run imagenes` o
`npm run videos` —con `--solo-plan`, `--si` o el costo en kie.ai—, va este
ciclo. Todo lo demás (validar, la foto del producto, voz, música,
transiciones, plan, ensamblar) sigue igual y en el mismo orden:

1. `npm run imagenes -- temp/[slug]` arma la cola
   (`temp/[slug]/flow/cola-imagenes.json`) y hace solo lo que no necesita Flow
   (las copias de frames).
2. Genera la cola en Google Flow con la skill **`flow-generacion`**: ahí está
   todo el procedimiento (ventana aparte, subir las referencias, enviar todo,
   reintentos, descargar cada archivo con su nombre).
3. `npm run flow:recibir -- temp/[slug]` mueve lo descargado a `img/` o
   `video/` del anuncio, lo convierte y lo verifica.
4. Repite 1-3 hasta que la cola diga que no queda nada: hay trabajos que
   dependen de otros (las tomas y los B-roll que llevan la imagen hero del
   esqueleto esperan a que exista) y salen en la vuelta siguiente.
5. Lo mismo con `npm run videos -- temp/[slug]`. **Antes de mandar los videos
   a Flow**, dile al usuario cuántos clips son y la estimación de créditos que
   imprime el comando, y espera su ok. Las imágenes cuestan 0 créditos en Flow
   y no necesitan ok.

La música de este estilo **no se genera**: es la pista fija
`recursos/musica/esqueleto.mp3`, que se copia a mano a
`temp/[slug]/musica/fondo.mp3` antes del plan (sección 3 de `COMO-PRODUCIR.md`).
Sin Suno y sin costo: en skeleton kie.ai no cobra nada ni hace falta (sin
kie.ai conectado, `npm run musica` solo indica esa copia). No corras
`npm run musica` sin esa pista en su lugar: con kie.ai conectado iría a Suno y
cobraría. La voz sigue por ElevenLabs.

**Para regenerar una toma** (solo si el usuario lo decide después del informe):
el camino es `npm run rehacer`, que nunca repite el prompt que falló.

1. `npm run rehacer -- temp/[slug] --toma N --contexto` muestra lo que no se
   toca y los prompts que fallaron. Escribe una escena distinta para la misma
   línea, con el esqueleto de la hero tal cual, y aplícala con
   `npm run rehacer -- temp/[slug] --toma N --aplicar nuevos.json` (un JSON con
   `prompt_imagen_inicial`, `prompt_video` y `motivo`). Guarda los prompts
   anteriores y saca de la carpeta solo la imagen y el clip de esa toma. Al
   terminar imprime el orden que sigue: es este, salvo con continuidad, que
   agrega sus pasos.
2. `npm run imagenes -- temp/[slug] --tomas N` y el ciclo de Flow: la cola trae
   solo esa imagen y usa la hero del esqueleto que ya está.
3. `npm run videos -- temp/[slug] --tomas N --sin-broll` y el ciclo de Flow,
   con su parada de créditos: solo el clip de esa toma, sin su B-roll.
4. `npm run plan -- temp/[slug]` y `npm run ensamblar -- temp/[slug]`.

**Sin `--rehacer`** en `imagenes` ni en `videos`: en skeleton ese flag archiva
también la hero del esqueleto (`img/esqueleto.png`) y el B-roll de la toma y
los vuelve a pedir —un esqueleto distinto a mitad del anuncio—, y en los videos
vuelve a archivar en cada vuelta el clip que acaba de llegar, gastando créditos
otra vez. `flow:recibir --rehacer` solo hace falta si el archivo de destino
todavía existe.

### Si elige A — el anuncio completo

Sigue el proceso de `COMO-PRODUCIR.md` de principio a fin, con las imágenes y
los videos por el ciclo de Flow de arriba, **sin pararte a preguntar entre
comando y comando**. El usuario ya dijo que sí: pedirle permiso en cada paso es
hacerle perder el tiempo.

**Y no te saltes la música ni las transiciones** — secciones 3 y 4 de
`COMO-PRODUCIR.md`. Son **obligatorias** en este estilo, el pipeline **no avisa
si faltan**, y un anuncio sin ellas se renderiza perfecto y sale plano. Es el
fallo más fácil de cometer de todo el proceso.

Las dos únicas paradas que sí van, y que no se saltan nunca:

1. **El costo, antes de gastar.** Las imágenes cuestan 0 créditos en Flow y
   no necesitan ok. Los videos sí: cuando `npm run videos` arme la cola, dile
   cuántos clips son y la estimación de créditos de Flow que imprime, y espera
   un sí antes de mandarlos a Flow.
2. **La revisión de clips, solo en `dialogo_nativo`** (UGC y objeto parlante).
   Ahí las tomas habladas no se pueden acelerar, así que un clip que sale mal
   solo se arregla regenerando — y regenerar después de ensamblar es rehacer
   todo el montaje.

Los permisos que pide `flow-generacion` (descargar cada tanda, mover la ventana
de Chrome) son parte de esa skill y también van.

Al final, entrégale los MP4 **y el informe** que pide `COMO-PRODUCIR.md`: qué
salió bien, qué salió mal toma por toma, qué regenerarías y cuántos créditos de
Flow costaría (la imagen no gasta; el clip de la toma, sí), y lo que se gastó de
verdad: los créditos de Flow de los videos. Ahí él decide si quiere ajustar
algo.

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
Paso 5 (puntos 1 a 10: formato y ángulo, Character Bible, prompt de la imagen
hero, tabla del guion, prompt de imagen y de video de cada toma, B-roll, texto
en pantalla, guion de voz para ElevenLabs, herramientas y checklist de
ensamblaje). **Sin el manifiesto** (el punto 11): es interno del sistema y no
se muestra nunca.

Los prompts que le muestras **se copian del manifiesto carácter por
carácter**: el manifiesto es la fuente de verdad. Si pide cambios, se cambian
en el manifiesto y se vuelve a validar (la verificación del 6.5 y
`npm run validar -- temp/[slug]/manifiesto.json`; si la foto del producto
todavía no está en la carpeta, el error que avisa eso es esperable y se
arregla con el comando del 6.6). Después le muestras lo que cambió, copiado
del manifiesto.

Al final, ofrécele seguir con A o B, o dejarlo ahí:

```markdown
¿Quieres que lo produzca? **A)** todo, con las imágenes y los videos en Google
Flow, hasta el MP4 terminado, o **B)** solo las imágenes y los videos en Google
Flow, para que lo montes tú. O lo dejamos aquí.
```

---
## Reglas que nunca se rompen
- Nunca cambies el diseño del esqueleto, sus ojos o proporciones a mitad del anuncio.
- Nunca pongas el diálogo hablado dentro de los prompts de video — la voz se graba aparte.
- Nunca pongas texto en pantalla, títulos ni watermarks dentro de los prompts de imagen o video.
- Nunca generes el video/imagen tú mismo salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente — el output de esta skill son prompts, no archivos multimedia.

