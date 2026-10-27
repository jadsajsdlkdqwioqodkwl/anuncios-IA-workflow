---
name: anuncios-zack-d-films
description: Genera anuncios publicitarios con IA en formato "Zack D Films style" (animación 3D cinematográfica tipo Pixar, estructurada en capítulos que explican un mecanismo o dato con un giro narrativo) para marcas DTC/Ecommerce en Estados Unidos y Latinoamérica. Usar SIEMPRE que el usuario pida crear un anuncio, video ad, guion publicitario o creativo estilo "Zack D Films", "explicador animado", "video de datos/mecanismo en 3D", o mencione crear anuncios con IA sin especificar estilo (en cuyo caso ofrecer este como una opción). Arma el guion completo por capítulos localizado en ES/EN/PT, los prompts de imagen y video toma por toma, el B-roll, el guion para ElevenLabs y el manifiesto interno del pipeline; en el chat da un resumen corto y tres opciones (producirlo todo, solo las imágenes y los videos, o el paquete de prompts para copiar y pegar en Midjourney/Nano Banana Pro/Veo 3/Kling/CapCut/ElevenLabs).
---

# Generador de Anuncios IA — Zack D Films style

Convierte un producto en un anuncio completo estilo Zack D Films: guion + prompts de imagen y video por cada toma, listos para pegar en herramientas externas de generación (no genera imágenes/video directamente, salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente).

## Cómo reconocer este estilo (para no confundirlo con Talking Object/Pixar)
- Animación 3D de calidad cine (no fotografía real, no plastilina, no esqueleto)
- Estructura formulaica: pregunta rara de apertura → revelación visual → explicación rápida → giro final
- Narración rápida, casi caótica/conversacional — no un narrador calmado tipo documental
- Subtítulos que "rebotan" palabra por palabra en sincronía con la voz ("Bounce captions")
- El mismo personaje puede aparecer en varias escenas/lugares muy distintos dentro de un mismo anuncio
- Diferencia clave con Talking Object: aquí un NARRADOR en voz en off explica mientras la cámara salta de escena en escena (mini-documental); en Talking Object, UN objeto/personaje habla en primera persona, generalmente en pocos lugares.

## Paso 0 — Si el guion ya viene escrito (atajo)

**Este paso solo se activa cuando el guion llega de afuera. Si no llega ninguno, ignóralo entero y empieza por el Paso 1, como siempre.**

Se reconoce por dos vías:
- **El usuario pega un guion** que ya le funciona y pide convertirlo a este estilo ("tengo este anuncio ganador, pásamelo a Zack D"). Llega como texto corrido.
- **Te lo entrega la skill de anuncios musicales**, con la letra de una canción ya generada.

### Lo que NO haces cuando llega un guion

- **No escribes un guion nuevo, ni "mejoras" el que te dieron.** Sáltate el Paso 2 entero: el ángulo (2.2) y la mecánica (2.3) ya están resueltos dentro del texto que llegó.
- **No cambias una sola palabra del texto.** Puedes partirlo en líneas y decidir dónde corta cada toma; nunca reescribirlo, ni acortarlo, ni pulirlo. El usuario lo trajo porque ya le funciona.
- **No preguntas el ángulo, ni el mercado, ni el dolor, ni la oferta.** Todo eso ya está resuelto dentro del guion: dedúcelo leyéndolo.
- **No fuerces el guion dentro de los 4 capítulos del 2.1.** Si se divide naturalmente en ellos, márcalos y aprovéchalos para decidir los tipos de toma del 3.2. Si no, **respeta el guion**: la estructura de capítulos es una forma de escribir un guion propio, no un molde al que haya que doblar uno ajeno.

### Lo que SÍ haces, en este orden

1. Di **en una sola frase** qué ángulo y qué mercado leíste en el guion, para que el usuario te corrija si te equivocaste. No es una pausa: sigues de largo.
2. **Sigue preguntando lo que el guion NO resuelve.** En esta skill es el tipo de fondo de las tomas de mecanismo (Paso 1): eso va en la misma tanda de siempre, porque ningún guion lo contesta.
3. Haz el desglose línea por línea del Paso 2.5 **sobre el texto que te dieron**.
4. De ahí en adelante, todo exactamente igual: ADN visual (3.1), prompts por tipo (3.2) con su negativo universal, Start/End Frame (3.3), B-roll (3.4) y manifiesto (Paso 6).

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

- **Las duraciones ya están medidas: no las estimes.** El presupuesto de `palabras ÷ 2.4` del Paso 2.4 **no aplica aquí**. La duración de cada toma sale de la canción.
- **Los tramos donde no se canta también llevan tomas** — la intro antes de la primera palabra, los puentes, el cierre. Su línea es una marca entre corchetes: `[intro]`, `[instrumental]`, `[cierre]`. No se subtitulan, porque no hay nada cantado ahí. **Un hueco sin toma propia se lo come la toma anterior y rompe el montaje**, así que se cubren todos. Y como ningún clip pasa de 10 segundos, un hueco de 20s son dos o tres tomas, no una.
- **El número de un B-roll es el número de SU toma.** El B-roll de la toma 15 se llama `broll-15`, no el que le toque por orden. Como en musical muchas tomas no llevan B-roll, numerarlos correlativos deja `broll-10` sobre la toma 15 — y eso se lee como un error aunque no lo sea. **Los huecos en la numeración son deliberados y significan "esta toma no lleva B-roll".**
- **Un coro que se repite NO reutiliza tomas.** Cada repetición lleva sus propias tomas nuevas, como cualquier otra línea. Nunca se repite metraje.
- **En el manifiesto** (Paso 6): `modo_audio` es `"musica"` y **no lleva el campo `voz_en_off`**. El B-roll sigue con `despues_de_toma`, igual que siempre. Todo lo demás del manifiesto es idéntico.

---

## Paso 1 — Brief del producto

Si el usuario no lo dio todo, pregunta solo lo esencial en una sola tanda, siempre como texto abierto (no uses botones ni formularios, mantén la misma forma de preguntar para todos los campos) — no bloquees si ya es inferible del mensaje o de una imagen/link que compartió:
- Producto: nombre + qué es
- Dolor/beneficio principal — idealmente algo con un mecanismo de acción visualizable
- Mercado/idioma: EE.UU. (inglés), LatAm (español — ¿qué país? ¿hay pago contra entrega?), Brasil (portugués), o varios
- Precio/oferta (descuento, envío gratis, garantía) — y si el usuario pide explícitamente que NO aparezca precio/descuento en el copy, respeta eso
- Formato/aspect ratio: vertical 9:16 por defecto, o el que indique
- **Tipo de fondo para las tomas de mecanismo (se pregunta UNA sola vez, para todo el anuncio)**: "¿Qué tipo de fondo prefieres para las tomas de mecanismo/transformación — A) grid técnico azul, o B) estudio limpio y natural (sin grid)?" — guarda la respuesta y reutilízala en todas las tomas que correspondan (Paso 3.3), nunca la vuelvas a preguntar toma por toma.

## Paso 2 — Escribir el guion por capítulos

### 2.1 — Estructura en 4 capítulos (el guion debe dividirse naturalmente en estos)
1. **Personaje/situación**: alguien viviendo una situación cotidiana relacionada al problema.
2. **Producto**: toma del empaque real o estilizado, a veces con ingredientes cayendo/flotando alrededor.
3. **Mecanismo interno**: visualización macro estilizada de lo que pasa dentro del cuerpo — partículas/ingredientes animados sobre superficie orgánica, moléculas con caritas expresivas, luces cálidas, sensación mágica (no clínica ni fría).
4. **Resultado/payoff**: escena narrativa con la consecuencia social o emocional del beneficio, a veces con humor o un giro.

Si una línea del guion no encaja claramente en uno de estos 4 tipos, probablemente sobra o hay que fusionarla con la anterior.

### 2.2 — Ángulos ganadores

**Regla de elección — nunca le preguntes al usuario qué ángulo prefiere**: si no especifica nada, usa automáticamente el ángulo PRINCIPAL de abajo. Si el usuario da su propia idea o pide otro enfoque, sigue su instrucción en su lugar.

**PRINCIPAL — Problema oculto/mal entendido + revelación del mecanismo (default automático — el mismo patrón confirmado como ganador en Claymation, y que se repite en los guiones reales de este estilo: Viasox, Penrose, cubos afrodisíacos, masticables para perros):**

Estructura de 5 partes:
1. **Problema mal entendido o que parece superficial**: algo que la audiencia ve como normal/cosmético, no como un problema real ("podría parecer que es solo cómo se ven tus piernas ahora").
2. **Revelación de que hay algo más debajo**: "pero debajo de la superficie, algo está pasando" — el giro de atención hacia el mecanismo oculto.
3. **Mecanismo explicado con claridad** (aquí es donde más encaja el Capítulo 3 y el estilo de Start/End Frame — ver 3.3): cómo funciona el proceso real, a veces con una escalada dentro de la misma escena/día (ej. "piernas pesadas por la mañana, doloridas al mediodía, zapatos que no calzan por la noche" — la misma lógica de Día1→Día30 de Skeleton, pero comprimida en horas).
4. **Por qué lo obvio no alcanza / el giro hacia el producto**: "ahora imagina en cambio..." — el producto entra como la respuesta específica a ESE mecanismo, no una solución genérica.
5. **Resultado + CTA**: consecuencia clara, a veces con oferta específica (2x1, garantía).

**Otros ángulos (válidos si el usuario los pide, o como ganchos de apertura dentro del ángulo principal)**: mito vs. realidad, cifra shockeante como hook, comparación numerada, relato de descubrimiento (ej. "notó que sus cabras estaban raras desde que comieron la planta" — funciona cuando no hay un "problema oculto" claro que revelar, sino un hallazgo curioso que lleva al mecanismo).

### 2.3 — Mecánica de guion (loop + giro + escalada, aplicado a la estructura de capítulos)
1. **Hook con loop de curiosidad** (capítulo 1): pregunta extraña/curiosa de apertura que no se resuelve hasta el final.
2. **Revelación visual** (capítulo 2-3): el producto y su mecanismo se presentan como la respuesta.
3. **Explicación rápida** (capítulo 3): concreta, sin lenguaje corporativo.
4. **Giro final** (capítulo 4): el payoff cierra el loop del hook.

### 2.4 — Duración y presupuesto de palabras
Mínimo 30 segundos, sin techo fijo — más capítulos o capítulos repetidos si el producto lo amerita, no hay techo de 20-30s (esa duración corta es del contenido orgánico original del canal, no una regla para nuestros anuncios). Si el usuario pide una duración específica, esa manda. Calcula el presupuesto de palabras: `duración objetivo en segundos × 2.4 palabras/segundo`.

> **Una duración pedida orienta el presupuesto de palabras; NO es un blanco al que haya que llegar.** Estos números son estimaciones: `÷ 2.4` es un promedio y cada voz habla distinto. En los anuncios reales de esta familia la voz salió entre un 6% y un 24% más corta que lo estimado. Que el anuncio termine durando 52s en vez de 60 está bien y no hay nada que corregir — el montaje encaja cada toma contra los tiempos reales de la voz, acelerando unas y cortando otras. **Nunca agregues ni quites líneas para llegar a un número.** El guion dura lo que necesita durar para mostrar lo que muestra.

### 2.5 — Desglose línea por línea
Baja el guion a nivel de toma por línea — cada línea/beat tiene su propia toma visual sincronizada, asignada a uno de los 4 capítulos. La duración de cada toma es la duración real de decir esa línea (≈ palabras ÷ 2.4), no un número fijo.

**Chequeo antes de entregar la tabla — ninguna toma pasa de ~9-10 segundos.** El modelo de video no genera clips de más de 10s, así que una línea que calcule por encima de eso no se puede producir: hay que **dividirla en dos tomas** y renumerar, nunca truncarla. Una línea así casi siempre es dos ideas metidas en una — el caso típico en este estilo es la escalada del punto 3 del ángulo principal ("pesadas por la mañana, doloridas al mediodía, no calzan de noche"), que son tres beats y por lo tanto tres tomas, no una.

Arma el guion en esta tabla (es la del punto 3 del Paso 5, la que se muestra cuando se entrega el paquete):

| # | Capítulo | Duración (calculada) | Línea de voz en off | Idea de texto en pantalla (solo para el editor — NUNCA va dentro de los prompts) | Descripción visual |
|---|---|---|---|---|---|

Antes de seguir, verifica: ¿el capítulo 1 / línea 1 es realmente el hook con el loop de curiosidad (no una descripción de escena suelta ni el giro adelantado)? Si no, corrígelo antes de seguir.

**Postura al generar cada prompt**: actúa como un director de arte senior — expande visualmente cada línea para que se vea más rica e imaginativa de lo que el texto dice palabra por palabra, sin perder la idea central.

## Paso 3 — ADN visual y prompts

### 3.1 — ADN visual
Animación 3D de ALTA CALIDAD estilo Pixar/Disney — personajes cálidos y expresivos, iluminación cinematográfica, profundidad de campo real. NO es un estilo plano/clínico ni fotorrealista. Texto en pantalla: palabra por palabra o frases muy cortas reveladas progresivamente en sincronía con la voz (no bloque fijo), tipografía blanca gruesa con contorno oscuro.

Este estilo normalmente NO tiene un personaje fijo recurrente con Character Bible obligatorio (puede haberlo si el mismo personaje se repite en varios capítulos — en ese caso, defínelo igual que en los otros estilos y repítelo palabra por palabra).

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

### 3.2 — Prompts por tipo de capítulo

**Regla de formato obligatoria**: cada bloque de prompt debe llevar su etiqueta como encabezado — `**Imagen:**` antes del prompt de imagen, `**Video:**` antes del prompt de video — nunca entregues los bloques uno después de otro sin identificar cuál es cuál. Aplica igual en tomas principales y B-roll.

**Fidelidad del producto real (si el usuario adjuntó una foto del envase)**: el producto debe conservar exactamente su forma, proporciones y diseño de etiqueta reales en el capítulo 2 — nunca alargarlo, ensancharlo ni deformarlo. **Aclaración importante sobre "no text" (error confirmado que ya pasó antes)**: la instrucción "no additional text/captions/watermarks" se refiere a que la IA NO agregue texto, subtítulos o marcas de agua extra a la imagen — nunca a borrar el texto real que ya es parte del diseño de la etiqueta del producto (nombre de marca, ingredientes, etc.). Si el producto tiene texto en su etiqueta real, ese texto debe verse igual de nítido y legible que en la foto de referencia — es parte del producto, no un overlay. Si notas que una imagen generada borró o distorsionó el texto real de la etiqueta, es un error de la herramienta de generación, no algo que el prompt esté pidiendo.

**Ambiente real, no fondo de estudio vacío (verifica esto toma por toma antes de entregar, en silencio, sin preguntarle al usuario)**: en el capítulo 1 (personaje/situación) y el capítulo 4 (resultado/payoff), el fondo siempre es un ambiente concreto y reconocible (casa, oficina, calle, gimnasio, lo que corresponda) — nunca un fondo plano/estudio. En el capítulo 2 (producto), puede ser una superficie limpia si es una toma de producto puro, pero si el guion da contexto (una cocina, un baño), intégralo también ahí.

**El aspect ratio va en palabras al principio, nunca como parámetro.** Nada de `--ar 9:16`, `--v 6`, `--style`: el motor manda el prompt tal cual al generador, y un flag de Midjourney pegado en el texto llega literal a un modelo que no lo entiende y lo trata como parte de la descripción. `Vertical 9:16` en palabras sí lo entienden todos, y es lo que usa el resto de la familia de skills.

> **La etiqueta `Negative prompt:` del Paso 3.3 NO es un flag y se queda.** Un flag como `--ar` no es lenguaje: llega al modelo y no significa nada. `Negative prompt:` sí es lenguaje, y es la convención que le dice al modelo dónde empieza la lista de lo que NO debe aparecer. Ninguno de estos modelos tiene un campo aparte para el negativo —`nano-banana-2` recibe un solo texto—, así que **el prompt entero se pega junto, etiqueta incluida**, y esa etiqueta es lo único que separa lo que se quiere de lo que no. Quitarla haría que `text, labels, hands` se leyeran como cosas a incluir. Decidido el 2026-09-06, después de que se hubiera cambiado por error a `Avoid:` — no volver a tocarla.

### Negativo universal — va al final de CADA prompt de imagen, sin excepción

**Se pega tal cual, con su etiqueta, en todas las imágenes: tomas principales, B-roll y producto.** No hay excepciones por tipo de toma.

```
Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

> **De dónde salió, y por qué no lleva nada más.** Se sacó de los fallos del primer anuncio real del estilo (Goli Immune, 2026-09-06): generar, mirar las tiras, y convertir lo que falló en una línea. Lo que falló fue exactamente esto — **B-roll y tomas de personaje salieron como fotografías**: poros, arrugas, hebras de pelo reales, luz de estudio. No se le agregó nada "por si acaso".
>
> **La prueba de que las cuatro tomas Tipo B salieron bien es la misma regla al revés**: son las únicas cuatro que ya llevaban un negativo con `no photorealism`, y son las únicas cuatro que salieron estilizadas. El texto que se pega no se olvida.
>
> **Y sí va también en las tomas de producto.** Se consideró exceptuarlas por miedo a perder la nitidez de la etiqueta, y los datos lo desmienten: la toma 12 de ese anuncio lleva `no photorealism` en su negativo **y** su etiqueta salió perfectamente legible. Un render 3D estilizado sostiene un texto nítido. Además no se sabe de antemano en qué toma cae el producto, así que una excepción por número de toma sería un parche para un anuncio, no una regla.

**Capítulo 1 — Personaje/situación**:
```
Vertical 9:16. Pixar-Disney style 3D animation render, [personaje y situación cotidiana relacionada al problema], warm cinematic lighting, expressive facial detail, realistic-stylized environment ([lugar concreto]), shallow depth of field, subsurface scattering, vibrant warm color palette, octane render, 8k, ultra-detailed, no additional text, captions, or watermarks overlaid on the image

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

**Capítulo 2 — Producto**:
```
Vertical 9:16. Pixar-Disney style 3D animation render, [producto/empaque, usar foto de referencia si el usuario la dio], clean product presentation with related elements floating or falling around it, warm cinematic lighting, shallow depth of field, octane render, 8k, no additional text, captions, or watermarks overlaid on the image

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

**Capítulo 3 — B-roll de mecanismo (macro cálido)**:

> **Cuál de los dos looks de mecanismo va aquí, y no son intercambiables.** Este template cálido es el del **B-roll** del Paso 3.4. Las **tomas principales** de Capítulo 3 no usan este bloque: van con Start/End Frame y el look semi-3D del Paso 3.3, que es más limpio y clínico. El corte es intencional (así lo dice la nota al final del 3.3) y sostiene el contraste del anuncio: el mundo cálido de la historia contra la visualización del mecanismo. No mezcles los dos en la misma toma.

```
Vertical 9:16. Stylized 3D macro visualization of [proceso/ingrediente activo] moving across an organic surface (skin/tissue), semi-transparent warm-toned tissue, glowing particles or molecule-like spheres with subtle expressive faces, warm golden-orange light with soft glow, dramatic macro close-up, ultra-detailed, premium documentary visualization style (not cold medical diagram), no additional text, captions, or watermarks overlaid on the image

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

**Capítulo 4 — Resultado/payoff**:
```
Vertical 9:16. Pixar-Disney style 3D animation render, [escena de resultado social/emocional relacionada al beneficio], warm cinematic lighting, expressive characters, shallow depth of field, subsurface scattering, octane render, 8k, no additional text, captions, or watermarks overlaid on the image

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

**Prompt de video** (image-to-video, a partir de cualquiera de las 4 tomas anteriores — describe SOLO movimiento):
```
Pixar-Disney style 3D animation, image-to-video from the shot above, [DURACIÓN]s. Vertical 9:16.
Camera: [un solo movimiento, ej. "slow push-in" / "gentle pan"]
Motion: [una sola acción propia de esa toma]
Lighting: warm cinematic glow
```

### 3.3 — Start/End Frame: cuándo usarlo y cómo decidirlo (formalizado — la IA decide sola, nunca presenta opciones al usuario)

**Criterio de uso** (a diferencia de una técnica "opcional y ambigua", ahora es una regla clara): usa el par Start Frame/End Frame en las tomas del **Capítulo 3 (mecanismo interno)** y en tomas de **transformación del producto** (ej. el frasco cerrado → el frasco con un brillo activo) — son las tomas donde mostrar un cambio de estado físico comunica más que un movimiento de cámara. Usa imagen + video normal (Paso 3.2) en las tomas de **Capítulo 1 (personaje/situación)** y **Capítulo 4 (resultado/payoff)**, donde lo que importa es la acción/emoción, no un cambio de estado.

**Tú eliges la toma internamente — nunca le presentes 2-3 opciones al usuario para que elija.** Analiza qué cambio de estado antes→después comunica mejor esa línea del guion, y entrégalo directo como parte del resultado completo.

**Nota sobre por qué suelen salir agrupadas**: no hay una regla que fuerce a las tomas Start/End Frame a estar consecutivas — es una consecuencia natural de que el Capítulo 3 (mecanismo) normalmente ocupa un tramo continuo del guion. Si el guion tiene líneas de mecanismo repartidas en distintos momentos (no solo un bloque central), las tomas Start/End Frame pueden aparecer separadas igual — depende de la estructura real del guion, no de un patrón fijo de agrupación.

**Fondo — usa la especificación exacta, nunca la interpretes libremente**: usa la respuesta que el usuario dio en el Paso 1, la misma para todas las tomas Start/End Frame de este anuncio, sin volver a preguntar.

- **Opción A (grid técnico azul)**: fondo y piso en tonos **azul brillante, rango #00BFFF a #87CEEB — SIEMPRE, sin excepción**, con líneas finas de grid cian claro, saturación pareja y brillante en todo el cuadro, **nunca oscurecido ni con gradiente hacia tonos oscuros en los bordes o el fondo** — es un azul uniforme de principio a fin, no un degradado que se apaga. Iluminación plana y clínica. No agregues palabras como "dark", "gradiente oscuro", "extending into darkness" ni nada que sugiera sombra o profundidad atmosférica — eso contradice la especificación y es un error confirmado que ya pasó antes, no lo repitas.
- **Opción B (estudio limpio, sin grid)**: la fuente original no especifica un código de color fijo para esta opción — usa un fondo de estudio neutro/claro (blanco, gris claro, o crema), gradiente simple sin grid, iluminación limpia pareja. Si el usuario quiere un color específico para esta opción, pregúntaselo o usa lo que ya haya indicado en el brief.

**Especificidad obligatoria de cada prompt** (5-7+ oraciones completas, nunca frases genéricas sin desarrollar): qué es el sujeto y de qué material, su estado físico exacto, cómo está construido el entorno, dirección y suavidad de la luz, ángulo y distancia de cámara, relaciones espaciales, cómo se evita el fotorrealismo. Entre el Start y el End Frame: mismo ángulo, mismo encuadre, misma luz, mismo fondo, misma paleta — SOLO cambia el estado físico del sujeto. Nunca describas al sujeto flotando — siempre "descansando naturalmente en el espacio, con sombra de contacto suave".

**Plantilla — el START y el END van en DOS bloques de código separados**, cada uno con su etiqueta como encabezado FUERA del bloque, igual que el resto de la skill (Paso 3.2 y punto 4 del Paso 5). Nunca los metas en un mismo bloque, y nunca dejes la etiqueta dentro del código: si `**START FRAME:**` queda adentro, se copia al generador como parte del prompt.

El **negative prompt va dentro del bloque del END FRAME**, al final, nunca suelto ni después del prompt de video — **con su etiqueta `Negative prompt:` y todo**. No hay campo aparte para el negativo en ningún modelo de los que se usan: el bloque entero se copia y se pega junto, y la etiqueta es lo que marca dónde empieza lo que no se quiere (ver el recuadro del Paso 3.2).

**START FRAME:**
```
Vertical 9:16. [Sujeto y material] [estado físico inicial] [construcción del entorno — Opción A: "bright blue grid floor and background in vivid cyan-blue tones (#00BFFF to #87CEEB range), made of thin light cyan grid lines with no thickness and no physical surface, extending evenly with consistent bright saturation, no darkening toward the edges"; Opción B: fondo de estudio limpio sin grid, sin código de color fijo] [dirección y suavidad de la luz — plana y clínica] [ángulo y distancia de cámara] [relación espacial, sombra de contacto suave, nunca flotando] Semi-3D soft plastic-like animation style, smooth matte-to-satin material, rounded simplified geometry, no micro-detail, no pores, no realism noise, stylized realism only, never photorealistic, no additional text or captions or watermark overlaid on the image
```

**END FRAME:**
```
Vertical 9:16. [La misma escena palabra por palabra — mismo sujeto, cámara, encuadre, fondo (con la misma especificación de color exacta que el start frame), luz, paleta] [solo cambia la descripción del estado físico a su estado final] Semi-3D soft plastic-like animation style, smooth matte-to-satin material, rounded simplified geometry, no micro-detail, no pores, no realism noise, stylized realism only, never photorealistic, no additional text or captions or watermark overlaid on the image

Negative prompt: No text, no labels, no UI, no props, no hands, no tools, no cinematic lighting, no photorealism, no dark gradient background
```

**Video:**
El prompt de video (si aplica movimiento de transición) va en un TERCER bloque, aparte, nunca mezclado con los dos anteriores.

Nota: este es un modo semi-3D suave (plástico, mate a satinado) — más limpio/clínico que el Pixar-Disney cálido del resto del anuncio, es intencional para las tomas de mecanismo, no un error de consistencia.

### 3.4 — Bloque de B-roll (aparte, al final — CON ubicación exacta, no genérica)
Las tomas del capítulo 3 (mecanismo interno) funcionan igual que el B-roll científico/anatómico usado en otros estilos de esta serie — superficie orgánica semi-transparente, partículas animadas, paleta cálida con brillos, sensación "documental premium", no diagrama médico frío.

**Genera un B-roll por cada toma principal — la misma cantidad, 1 a 1.** Cada B-roll debe indicar explícitamente **dónde va**: después de qué toma y sincronizado con qué línea/idea exacta. Nunca entregues el B-roll como lista suelta — ese criterio es tu trabajo. **Nunca presentes el B-roll en formato de tabla** (esto ha pasado antes y es un error) — cada B-roll lleva su prompt de imagen y su prompt de video en bloques de código separados con etiqueta `**Imagen:**` / `**Video:**`, exactamente el mismo formato que las tomas principales, nunca comprimido en columnas.

**Visualiza la oferta concretamente**: cuando la línea de CTA (capítulo 4) mencione envío gratis, pago contra entrega, o garantía, ilustra ese detalle de forma concreta (ej. un repartidor entregando el paquete en la puerta) en vez de un plano genérico del producto.

**Regla de consistencia al reordenar o editar**: si insertas, eliminas, reordenas o editas una toma después de haber numerado el guion, **renumera TODAS las referencias cruzadas y recalcula la duración de cada línea afectada antes de responder** — no solo la tabla del guion. Nunca digas "las demás tomas quedan igual, solo se corren un número" sin efectivamente reescribir cada referencia.

## Paso 4 — Localización por mercado (afecta CTA, texto en pantalla y tono — NO los prompts visuales)
- **Estados Unidos** (inglés, checkout directo): urgencia por stock/tiempo, prueba social cuantificada, CTA "Shop Now"/"Get Yours Today".
- **LatAm** (español, con contra-entrega): mencionar explícitamente "paga cuando lo recibas"/"pago contra entrega" si aplica, envío a todo el país. Si el usuario pide que NO aparezca precio/descuento, respétalo. Español neutro salvo país específico.
- **Brasil** (portugués): Pix/parcelamento si aplica, tono cálido y directo.

## Paso 5 — Formato de entrega final

**Regla no negociable**: arma SIEMPRE el paquete completo (guion por capítulos + todas las tomas + B-roll 1:1 + overlays + guion de voz en off para ElevenLabs + herramientas), desde el primer intento y con todos sus chequeos — nunca solo una toma de muestra, nunca omitas el guion limpio de voz en off. **Pero al terminar no lo muestres en el chat**: queda interno (lo que se produce —prompts, líneas, B-roll, voz y overlays— guardado en el manifiesto, Paso 6), y en el chat va solo el resumen corto y las tres opciones del Paso final. El paquete entero se entrega en el chat cuando el usuario elige la opción C o pide verlo entero, y entonces va completo: nunca una muestra, nunca "¿quieres que te dé el resto?". Si pide solo una parte, se le muestra esa parte, copiada del manifiesto (Paso final). Si no especificó duración, usa el mínimo de 30s y, en el resumen del Paso final, junto a la duración, avísale que puede pedir más.

Cuando se entrega (opción C del Paso final), va con esta estructura:
1. Ángulo elegido y cómo se reparte en los 4 capítulos (1-2 líneas) — declara el loop de curiosidad y dónde ocurre el giro
2. Character Bible (solo si hay personaje recurrente)
3. Tabla de guion línea por línea con capítulo y duración calculada — indica también qué tomas usan Start/End Frame (Capítulo 3 y transformaciones de producto) vs. imagen+video normal (Capítulo 1 y 4)
4. Por cada toma: su prompt correspondiente (Start/End Frame + negative prompt, o imagen+video normal) en bloques de código separados, cada uno con su etiqueta — usando el tipo de fondo que el usuario eligió en el Paso 1 para todas las tomas Start/End Frame
5. Bloque aparte de B-roll (1 por cada toma principal, misma cantidad) con ubicación exacta
6. Notas de overlays/texto en pantalla palabra-por-palabra (nunca dentro de los prompts)
7. **Guion de voz en off limpio, listo para copiar y pegar directo en ElevenLabs** — solo las líneas habladas en orden, sin numeración, sin marcas de tiempo, en un bloque de código aparte. Obligatorio desde la primera entrega.
8. Herramientas recomendadas: Imagen — Midjourney, GPT Image, Nano Banana Pro (Capítulos 1/2/4), Nano Banana/Seedream (mejor consistencia entre Start/End Frame casi idénticos, Capítulo 3). Video — Veo 3, Kling 2.x (soporta start/end frame nativo), Runway Gen-4. Overlays — CapCut (plantillas de "karaoke caption") o Premiere. Voz — ElevenLabs, tono cercano y cálido.

El **manifiesto de producción (Paso 6) no va en esta entrega**: se escribe en su archivo y nunca se muestra en el chat, ni siquiera en la opción C.


---

## Paso 6 — Manifiesto de producción (JSON)

Este paso es **aditivo y no cambia nada de lo anterior**: el paquete del Paso 5 se arma exactamente igual. Además, escribes un manifiesto JSON en su archivo (6.1). **El manifiesto es interno del sistema: nunca se muestra en el chat**, ni siquiera cuando se entrega el paquete en la opción C.

**Para qué sirve**: el manifiesto es el único punto de contacto entre esta skill y el pipeline de producción, que lee ese archivo y genera las imágenes, los videos y el audio, y arma el montaje automáticamente. Tú no ejecutas nada de eso ni sabes nada de APIs — solo describes el anuncio en JSON.

**Regla de fidelidad**: los prompts del manifiesto son **exactamente los mismos** que armaste siguiendo los Pasos 3.2, 3.3 y 3.4, carácter por carácter, y el manifiesto es la fuente de verdad: cuando le muestres al usuario el paquete o una parte (opción C, o si lo pide), copia los prompts del manifiesto carácter por carácter. Si un prompt que le mostraste difiere del manifiesto, el video final no será el que él aprobó.

### 6.1 — Dónde va

Siempre en el archivo `temp/[slug-del-anuncio]/manifiesto.json`, donde `[slug-del-anuncio]` es el nombre del producto en kebab-case. Después de escribirlo y de pasar la verificación del 6.5, valídalo con `npm run validar -- temp/[slug-del-anuncio]/manifiesto.json` antes del Paso final y corrige los errores que marque. Si lleva foto del producto, déjala lista tú antes de validar (6.6); si no sabes dónde está y todavía no está en la carpeta del anuncio, el error de que falta ese archivo es esperable: se resuelve con el comando del 6.6 cuando te la pase; cualquier otro error se corrige antes del resumen. **Nunca en el chat**: ni en un bloque `json` de la respuesta, ni en la opción C. En el resumen del Paso final basta con media línea que diga que quedó guardado y validado.

### 6.2 — Estructura

```json
{
  "estilo": "zack-d-films",
  "modo_audio": "voz_en_off",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "referencias": [
    {
      "id": "protagonista",
      "tipo": "personaje",
      "prompt": "[el Character Bible, SOLO si hay personaje recurrente. Si no lo hay, esta entrada no existe]"
    },
    {
      "id": "producto",
      "tipo": "producto",
      "archivo": "producto.jpg",
      "nota": "conservar forma, proporciones y texto real de la etiqueta"
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
      "referencias": []
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
| `estilo` | Siempre `"zack-d-films"`. |
| `modo_audio` | Siempre `"voz_en_off"` — narrador único, generado aparte. |
| `mercado` | Del Paso 1/4: `"EEUU"`, `"LatAm"` o `"Brasil"`. |
| `idioma` | `"en"`, `"es"` o `"pt"`, según el mercado. |
| `aspect_ratio` | Del Paso 1. Por defecto `"9:16"`. |
| `referencias` | La lista de referencias del anuncio. En zack-d: **el personaje recurrente solo si lo hay** — muchos anuncios de este estilo son puro mecanismo y no tienen ninguno — y **el producto** si el usuario dio foto. Ver 6.4. |
| `tomas[].n` | El número de toma de la tabla del guion, consecutivo desde 1. |
| `tomas[].tipo` | **`"B"` en las tomas de Capítulo 3 (mecanismo interno) y en las de transformación del producto** — las que llevan Start/End Frame según el Paso 3.3. **`"A"` en las de Capítulo 1, Capítulo 2 y Capítulo 4**, que van con imagen + video normal. La excepción: una toma de Capítulo 2 que muestre el producto **transformándose** (cerrado → abierto, apagado → activo) sí es `"B"`. |
| `tomas[].duracion` | La duración calculada en el Paso 2.4 (palabras ÷ 2.4), con un decimal. **No la redondees.** |
| `tomas[].linea` | La línea de voz en off de esa toma, exactamente como está en la tabla. |
| `tomas[].prompt_imagen_inicial` | En Tipo B: **el START FRAME**. En Tipo A: el prompt de imagen del capítulo correspondiente (Paso 3.2). |
| `tomas[].prompt_imagen_final` | En Tipo B: **el END FRAME**, con su negative prompt incluido tal como lo escribiste en el 3.3. En Tipo A: `null`. |
| `tomas[].prompt_video` | El prompt de video completo. |
| `tomas[].referencias` | Ver 6.4. |
| `broll[]` | Uno por cada toma principal (Paso 3.4). |
| `voz_en_off` | El guion limpio del punto 7 del Paso 5, idéntico. |
| `overlays` | Las notas de texto en pantalla del punto 6 del Paso 5. Array vacío `[]` si no hay. |

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

`prompt` y `archivo` son excluyentes: una entrada tiene uno o el otro, nunca los dos.

**Qué emite zack-d normalmente:**

- **El producto**, con `archivo`, si el usuario dio foto del envase.
- **El personaje recurrente SOLO si lo hay.** Muchos anuncios de este estilo son puro mecanismo y su lista es únicamente el producto. Si el guion sí repite un personaje entre capítulos, emítelo con su Character Bible como `prompt`.
- **Lo que haga falta**: si un objeto concreto reaparece entre capítulos, va como una entrada más.

**Las tomas de mecanismo del Capítulo 3 normalmente no declaran ninguna referencia**: son escenas abstractas que se sostienen por su propia especificación de fondo y material.

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
3. ¿**Las tomas de Capítulo 3 y de transformación tienen `tipo: "B"` con su `prompt_imagen_final`**, y las de Capítulo 1 y 4 tienen `"A"` con `null`? Debe coincidir con lo que declaraste en el punto 3 del Paso 5.
4. ¿Separaste el START y el END en dos campos, en vez de meter el bloque entero en uno?
4b. ¿Cada `id` que declaran las tomas existe en la lista de `referencias`?
5. ¿Cada prompt del manifiesto es idéntico, carácter por carácter, al que armaste en el paquete (Pasos 3.2 a 3.4)?
6. ¿Las `linea` de todas las tomas, en orden, dan el mismo texto que `voz_en_off`?
7. ¿Todas las tomas Start/End usan **el mismo tipo de fondo** que el usuario eligió en el Paso 1 (grid azul o estudio limpio)?
8. ¿El JSON es válido? Comillas dobles, sin comas colgando.

### 6.6 — La foto del producto (nunca inventes el nombre del archivo)

El `archivo` de la entrada del producto es el nombre de un archivo que **tiene que existir de verdad** en la carpeta del anuncio. Si escribes ahí un nombre inventado a partir de la marca, el pipeline se detiene, o peor, genera un envase inventado.

- Si el usuario dio foto → la entrada del producto existe, con `"archivo": "producto.jpg"`, siempre ese nombre.
- Si no dio ninguna → **la entrada del producto simplemente no está en la lista**, y ninguna toma ni B-roll puede declararla.

Y si dio foto, **la dejas lista tú**, apenas escribiste el manifiesto y antes de validarlo (6.1), si sabes dónde está: la ruta que te dio el usuario, o la imagen que pegó en el chat (la lees en su ruta local). La ruta va tal cual, aunque sea `.webp` o `.heic` o tenga espacios en el nombre (con la foto en su carpeta, `npm run validar` pasa sin el error del 6.1):

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug-del-anuncio]
```

El comando la copia a la carpeta del anuncio, la convierte si hace falta, y deja el nombre correcto escrito en el manifiesto. Si no sabes dónde está, en el resumen del Paso final pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando, y córrelo tú apenas la tengas. Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. **Ningún comando va en el mensaje del Paso final.**

## Paso final — Pregunta cómo quiere producirlo

**Si el anuncio llegó por el Paso 0 desde la skill de anuncios musicales, este
Paso final no va**: el resumen, las opciones y la entrega de la opción C los
hace esa skill (sin guion de voz: la canción es el audio y la letra va en la
tabla del guion). Vuelve a ella con el manifiesto escrito y validado.

Ya armaste el paquete completo (guion, prompts de cada toma, B-roll, texto en
pantalla y guion de voz) y el manifiesto quedó guardado y validado (6.1).
**Nada de eso se muestra en el chat**: el paquete queda interno (lo que se
produce, en el manifiesto), y el manifiesto no se muestra nunca. **Ahora, y
solo ahora, dale al usuario un resumen corto y pregúntale cómo quiere seguir.**

El resumen va en 1 a 3 líneas: el estilo, el producto, el mercado y el idioma,
cuántas tomas y cuántos B-roll, y la duración aproximada (si no pidió una, en
esa misma línea dile que son los 30 s mínimos y que puede pedir más). Si hay
una decisión que conviene que sepa, súmale **una** línea con ella (por ejemplo:
"Agregué 'Pagas al recibirlo' en el cierre por el pago contra entrega"). Nada
más: ni la tabla del guion, ni prompts, ni el JSON, ni el comando de la foto
(lo corres tú: 6.6).

No lo decidas tú: las tres salidas son legítimas y cuestan cosas distintas.

```markdown
**Anuncio estilo Zack D Films — [producto], [mercado] ([idioma]).** [N] tomas
y [N] B-roll, unos [N] segundos[; es el mínimo, si quieres puede ser más largo].
[La decisión que conviene que sepas, si la hay.] El manifiesto quedó guardado y
validado[; solo falta tu foto del producto: pásamela (arrástrala al chat o dime
la ruta) y la dejo lista].

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero las imágenes y los videos en Google Flow,
armo el montaje y te entrego el MP4 terminado. Antes de gastar nada te digo
cuántos créditos de Flow usan los videos (las imágenes no gastan créditos).

**B) Genera solo las imágenes y los videos** — los genero en Google Flow y te
los dejo en su carpeta, listos para que los montes tú en CapCut a tu gusto.
También te digo antes los créditos de los videos.

**C) Entrégame el paquete de prompts** — te paso aquí el guion por capítulos,
los prompts de imagen y video de cada toma (Start/End Frame en las de
mecanismo), el B-roll, los textos en pantalla y el guion de voz para
ElevenLabs, para que los revises o los produzcas a mano. Después, si quieres,
seguimos con A o B.
```

### En esta versión, las imágenes y los videos se hacen en Google Flow

El motor ya no genera las imágenes ni los videos: arma una lista de trabajo
(la "cola") y **los generas tú en Google Flow**, manejando Chrome con la
extensión Claude in Chrome. Esa extensión es el MCP conectado, y que el usuario
elija A o B es el pedido explícito que exigen la introducción y las reglas del
final para que generes imágenes y video tú mismo.

Donde el proceso dice `npm run imagenes` o `npm run videos`, va este ciclo.
Todo lo demás (validar, voz, música, transiciones, plan, ensamblar) sigue
igual y en el mismo orden:

1. `npm run imagenes -- temp/[slug]` arma la cola
   (`temp/[slug]/flow/cola-imagenes.json`) y hace solo lo que no necesita
   Flow (las copias de frames).
2. Genera la cola en Google Flow con la skill **`flow-generacion`**: ahí está
   todo el procedimiento (ventana aparte, subir las referencias, enviar todo,
   reintentos, descargar cada archivo con el nombre que pide la cola).
3. `npm run flow:recibir -- temp/[slug]` mueve lo descargado a `img/` o
   `video/` del anuncio, lo convierte y lo verifica.
4. Repite 1-3 hasta que la cola diga que no queda nada: hay trabajos que
   dependen de otros (las tomas que usan la hoja del personaje recurrente
   esperan a esa hoja, el END FRAME de una toma Tipo B a su START FRAME, y
   `frame_anterior` a la toma anterior) y recién entran en la vuelta
   siguiente.
5. Lo mismo con `npm run videos -- temp/[slug]`. **Antes de mandar los videos
   a Flow**, dile al usuario cuántos clips son y la estimación de créditos que
   imprime el comando, y espera su ok. Las imágenes cuestan 0 créditos en Flow
   y no necesitan ok.

**Para regenerar una toma** (lo que el usuario decida después del informe) usa
`npm run rehacer`, que nunca repite el prompt que falló. **No uses `--rehacer`
en `npm run imagenes` ni en `npm run videos` para una toma**: con `--tomas N`
la cola también lleva la hoja del personaje recurrente y el B-roll de esa
toma, y `--rehacer` los mandaría a `historial/` y los pediría otra vez (la toma
rehecha saldría con otra protagonista que el resto del anuncio, y el clip del
B-roll se pagaría de nuevo).

1. `npm run rehacer -- temp/[slug] --toma N --contexto` muestra lo que no se
   toca (tipo, duración, referencias, línea) y los prompts que fallaron.
   Escribe una escena distinta para la misma intención en un `nuevos.json`
   (`prompt_imagen_inicial`, `prompt_imagen_final` si es Tipo B,
   `prompt_video`).
2. `npm run rehacer -- temp/[slug] --toma N --aplicar nuevos.json` los pone en
   el manifiesto (los anteriores quedan en `prompts-anteriores.json`) y borra
   solo `toma-N-inicial.png`, `toma-N-final.png` y `toma-N.mp4`: el clip se
   rehace siempre, aunque solo cambie la imagen, porque sale de ella.
3. Sigue los pasos que imprime, en ese orden, cada generación con el ciclo de
   arriba y **sin `--rehacer`** (ni al armar la cola ni en `flow:recibir`: lo
   viejo ya no está):
   - `npm run imagenes -- temp/[slug] --tomas N`. En una toma Tipo B son dos
     vueltas: el END FRAME espera al START FRAME nuevo. La hoja y el B-roll
     que ya están no se vuelven a pedir.
   - `npm run videos -- temp/[slug] --tomas N --sin-broll`, con la parada de
     créditos: es un solo clip.
   - `npm run plan -- temp/[slug]` y `npm run ensamblar -- temp/[slug]`.

   Si el anuncio tiene continuidad, imprime otro orden, con
   `npm run continuidad -- temp/[slug] --pares` en el medio: síguelo tal cual.
   Y corre `flow:recibir` con la imagen nueva ya descargada: si no la
   encuentra en Descargas, la marca "falta" (la vieja quedó en
   `flow/descargas/recibidos/` y no se vuelve a usar).

La voz sigue por ElevenLabs. La música de este estilo es su pista fija
(`recursos/musica/zack-d-films.mp3`, sección 3 de `COMO-PRODUCIR.md`), que no
pasa por kie.ai ni cuesta nada, salvo en un anuncio que llega por el Paso 0
desde la skill de anuncios musicales: ahí la música es la canción que esa skill
ya generó con Suno. En esta versión kie.ai solo cobra la música o la canción
que se genere con Suno (`npm run musica` / `npm run cancion`). La pista fija
se copia a mano de `recursos/musica/zack-d-films.mp3` a
`temp/[slug]/musica/fondo.mp3` antes del plan y no necesita kie.ai: sin kie.ai
conectado, `npm run musica` solo indica esa copia.

### Si elige A — el anuncio completo

Sigue el proceso de `COMO-PRODUCIR.md` de principio a fin, con las imágenes y
los videos por el ciclo de Flow de arriba, **sin pararte a preguntar entre
comando y comando**. El usuario ya dijo que sí: pedirle permiso en cada paso
es hacerle perder el tiempo.

**Y no te saltes la música ni las transiciones** — secciones 3 y 4 de
`COMO-PRODUCIR.md`. Son **obligatorias** en este estilo, el pipeline avisa si
faltan pero no detiene nada, y un anuncio sin ellas se renderiza perfecto y sale
plano. Es el fallo más fácil de cometer de todo el proceso.

Las dos únicas paradas que sí van, y que no se saltan nunca:

1. **Los créditos, antes de generar los videos.** Cuando `npm run videos` arme
   la cola, dile cuántos clips son y la estimación de créditos de Flow que
   imprime, y espera un sí antes de mandarlos a Flow: el usuario paga cada
   clip con los créditos de su plan. Las imágenes cuestan 0 créditos y no
   llevan esta parada.
2. **La revisión de clips, solo en `dialogo_nativo`** (UGC y objeto parlante).
   Ahí las tomas habladas no se pueden acelerar, así que un clip que sale mal
   solo se arregla regenerando — y regenerar después de ensamblar es rehacer
   todo el montaje.

Las paradas propias de Google Flow (el permiso de cada tanda de descargas, y
el inicio de sesión o el captcha que hace el usuario) las pone
`flow-generacion` y también se respetan.

Al final, entrégale los MP4 **y el informe** que pide `COMO-PRODUCIR.md`: qué
salió bien, qué salió mal toma por toma, qué regenerarías y cuántos créditos
de Flow costaría (una imagen sola no gasta, pero rehacer la imagen de una toma
obliga a rehacer su clip, y eso son los créditos del clip), y lo que se gastó
de verdad: los créditos de Flow de los videos. Ahí él decide si quiere ajustar
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

Entrégale el paquete **completo**, nunca una muestra, con la estructura del
Paso 5 (puntos 1 a 8): ángulo y reparto en capítulos, Character Bible (solo si
hay personaje recurrente), tabla del guion, los prompts de cada toma (Start/End
Frame con su negative prompt, o imagen + video) con su etiqueta, el B-roll con
su ubicación exacta, los textos en pantalla, el guion limpio de voz para
ElevenLabs y las herramientas. **Sin el manifiesto**: ni el JSON ni partes de
él.

Los prompts que muestras se copian del manifiesto carácter por carácter: es la
fuente de verdad. En las tomas Tipo B, el START FRAME y el END FRAME van en dos
bloques con su etiqueta, copiados de `prompt_imagen_inicial` y
`prompt_imagen_final`. Si el usuario pide cambios, se hacen en el manifiesto,
se vuelve a validar (`npm run validar -- temp/[slug]/manifiesto.json`) y se le
muestra lo que cambió, copiado de ahí.

Lo que el manifiesto no guarda —el ángulo y su reparto en capítulos, el
capítulo y la descripción visual de cada toma, y las herramientas— lo armas a
partir de él (sus líneas, sus tipos y sus prompts), sin contradecir nada de lo
que sí guarda.

Al final, ofrécele seguir con A o B (o dejarlo ahí): el manifiesto ya está
listo para producir.

Y en cualquier momento, aunque no haya elegido C, si pide ver el paquete o una
parte ("muéstrame el guion", "pásame los prompts de la toma 3"), muéstrale esa
parte, copiada del manifiesto (y lo que no guarda, armado como arriba).

---
## Reglas que nunca se rompen
- Nunca uses fotorrealismo — es animación 3D de calidad cine, no video real.
- Nunca pongas texto/estadísticas dentro de los prompts de imagen o video — se agregan en edición.
- Nunca generes el video/imagen tú mismo salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente. En esta versión eso es el Paso final: si elige A o B, generas en Google Flow la cola que arma el motor.
- Cuando se entrega el paquete (opción C, o si lo pide entero), va completo, nunca una muestra; si pide una parte, va esa parte. El manifiesto nunca se muestra en el chat.
