---
name: anuncios-talking-object-pixar
description: Genera anuncios publicitarios con IA en formato "Talking Object Ads" (objeto, ingrediente, parte del cuerpo, o mecanismo animado en 3D estilo Pixar que habla en primera persona con boca sincronizada, nunca voz en off) para marcas DTC/Ecommerce en Estados Unidos y Latinoamérica. Usar SIEMPRE que el usuario pida crear un anuncio, video ad, guion publicitario o creativo estilo "objeto parlante", "talking object", "Pixar ad", "producto que habla", "personaje 3D animado tipo Pixar", o mencione crear anuncios con IA sin especificar estilo (en cuyo caso ofrecer este como una opción). Arma el guion completo (loop de curiosidad + giro + payoff) localizado en ES/EN/PT, los prompts de imagen y video toma por toma, los B-roll y el manifiesto interno del pipeline; en el chat da un resumen corto y tres opciones (producirlo todo, solo las imágenes y los videos, o el paquete de prompts para copiar y pegar en Midjourney/Kling/Veo/Gemini Omni Flash).
---

# Generador de Anuncios IA — Talking Object Ads (Pixar-style)

Convierte un producto en un anuncio completo estilo Talking Object: guion + prompts de imagen y video por cada toma, listos para pegar en herramientas externas de generación (no genera imágenes/video directamente, salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente).

**Idioma**: interactúa, pregunta y escribe SIEMPRE en español neutro (LatAm), salvo que el usuario pida explícitamente otro idioma para el anuncio final.

**Regla fundamental de este estilo — nunca hay voz en off**: los personajes (producto, ingredientes, partes del cuerpo, alternativas fallidas) siempre hablan ellos mismos, con boca visible y sincronía labial. Nunca hay narrador externo leyendo el guion por encima. Esto afecta el Character Bible, los prompts de video y el manifiesto (`modo_audio: "dialogo_nativo"`).

## Reglas obligatorias — léelas antes de generar cualquier cosa

1. **El paquete se arma completo siempre, desde el primer intento**, y cuando se entrega (opción C del Paso final, o si el usuario lo pide) va completo: nunca una toma de muestra, nunca "¿quieres que te dé el resto?". No hay pausas en este flujo: si algo del brief falta y es inferible, decídelo tú.
2. **Nunca voz en off.** Todo lo que se oye sale de la boca de un personaje, dentro del clip.
3. **El objeto sigue siendo el objeto** — nunca una persona disfrazada del objeto (Paso 3.2).
4. **Los 2 bloques universales (Paso 3.5) van pegados tal cual, sin parafrasear**, en todos los prompts de imagen.
5. **Cada prompt va en su propio bloque de código separado** — imagen inicial, imagen final, video, y lo mismo en los B-roll. Las notas de apoyo (qué foto subir) van siempre fuera del bloque.
6. **Nunca texto en pantalla, títulos ni watermarks dentro de los prompts** — eso se agrega después en edición (CapCut/Premiere).
7. **Cada prompt de video lleva la línea hablada con dos puntos y comillas, Y el idioma declarado** (Paso 3.7). Un video prompt sin idioma deja la decisión al azar.
8. **Duración mínima 30 segundos**, sin techo fijo. El tope es **por toma**, no por anuncio: máximo 8 segundos y 16 palabras por toma (Paso 2.4).
9. **Nunca generes el video/imagen tú mismo** salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente. Emitir el manifiesto del Paso 6 no es generar: es describir. En esta versión del sistema eso pasa solo en el Paso final: si el usuario elige A o B, generas en Google Flow la cola que arma el motor.

---

## Paso 0 — Si el guion ya viene escrito (atajo)

**Este paso solo se activa cuando el usuario pega un guion ya escrito y pide convertirlo a este estilo** ("tengo este anuncio ganador, pásamelo a objeto parlante"). Si no llega ninguno, ignóralo entero y empieza por el Paso 1, como siempre.

### Lo que NO haces cuando llega un guion

- **No escribes un guion nuevo, ni "mejoras" el que te dieron.** Sáltate el Paso 2: el ángulo (2.1) y la mecánica (2.2) ya están resueltos dentro del texto que llegó.
- **No cambias el mensaje ni el orden de las ideas.** Puedes partirlo en líneas y decidir dónde corta cada toma; nunca reescribirlo, ni acortarlo, ni pulirlo. El usuario lo trajo porque ya le funciona.
- **No preguntas el ángulo, ni el mercado, ni el dolor, ni la oferta.** Dedúcelo leyendo el guion.

### La excepción, y es de este estilo

Este estilo es `dialogo_nativo`: **el personaje habla en primera persona dentro del clip, con lip-sync, y nunca hay voz en off.** Si el guion que llega está escrito como narración externa, hay que pasarlo a primera persona para que el estilo funcione — eso no es "mejorarlo", es traducirlo al formato.

Cuando lo hagas:
- Cambia **solo lo mínimo** para que la línea la pueda decir el personaje. El mensaje, el orden y las palabras clave se respetan.
- **Dilo explícitamente**, mostrando un par de líneas antes y después, para que el usuario apruebe la traducción antes de que gastes en imágenes.
- Si el guion ya está en primera persona, no toques nada.

### Lo que SÍ haces, en este orden

1. Di **en una sola frase** qué ángulo y qué mercado leíste en el guion, y si hizo falta pasarlo a primera persona.
2. **Sigue preguntando lo que el guion NO resuelve**: quiénes son los personajes que hablan (3.4), que es lo que ningún guion trae.
3. Haz el desglose línea por línea del Paso 2.5 **sobre el texto que te dieron**, respetando el tope de 8s y 17 palabras por toma del 2.4. Una línea más larga se parte en dos tomas — eso sí está permitido, porque no cambia el texto.
4. De ahí en adelante, todo exactamente igual: ADN visual (3.1), reconocibilidad (3.2), Character Bible (3.4), bloques universales (3.5), prompts por toma (3.7), B-roll (3.8) y manifiesto (Paso 6).

---

## Paso 1 — Brief del producto

Si el usuario no lo dio todo, pregunta solo lo esencial en una sola tanda, siempre como texto abierto (no uses botones ni formularios, mantén la misma forma de preguntar para todos los campos) — no bloquees si ya es inferible del mensaje o de una imagen/link que compartió:
- Producto: nombre + qué es
- Dolor/beneficio principal — para el ángulo principal, identifica también: ¿qué solución/alternativa probó el cliente ANTES de este producto y no le funcionó?
- Mercado/idioma: EE.UU. (inglés), LatAm (español — ¿qué país? ¿hay pago contra entrega?), Brasil (portugués), o varios
- Precio/oferta (descuento, envío gratis, garantía) — y si el usuario pide explícitamente que NO aparezca precio/descuento en el copy, respeta eso
- Formato/aspect ratio: vertical 9:16 por defecto, o el que indique
- Foto del producto, si la tiene (ver Paso 6.6 — no le pidas que la renombre ni la mueva)
- No preguntes "quién habla" — se decide automáticamente en el Paso 2.1 (default: la alternativa fallida confiesa).

## Paso 2 — Escribir el guion

### 2.1 — Elige el ángulo (jerarquía confirmada por fuente real — no inventes desde cero)

**Regla de elección — nunca le preguntes al usuario quién debe hablar**: si el usuario no especifica un ángulo ni pide algo particular, usa automáticamente el ángulo PRINCIPAL de abajo — es el default de la skill, no algo que traslades como pregunta. Si el usuario sí da su propio ángulo o pide explícitamente otro (elenco de ingredientes, mecanismo único, etc.), sigue su instrucción en su lugar.

**PRINCIPAL — "La alternativa fallida confiesa" (default automático)**

Antes de generar nada, diagnostica: ¿qué soluciones fallidas probó tu cliente antes de este producto? Esa es la que habla, confesando en primera persona por qué no funciona. Ejemplo: *"Soy tu humectante de farmacia. Me llenan de aceites baratos para mantener el precio bajo... pero esos aceites tapan tus poros e irritan tu piel."*

Por qué funciona (3 disparadores psicológicos confirmados):
1. **Pattern interrupt** — objetos hablando detiene el scroll.
2. **Educativo** — explica por qué la solución vieja no sirve.
3. **Posicionamiento de producto** — tu producto queda como "la actualización obvia" sin decirlo directamente.

Ejemplos rápidos por nicho (inspiración, no copiar literal): skincare → "humectante de farmacia hablando de aceites baratos"; café → "café de supermercado explicando por qué está rancio"; colchones → "colchón barato de Amazon explicando por qué se hunde"; suplementos → "multivitamínico genérico explicando su baja absorción".

**2 formas de ejecutar este ángulo**:
- **(a) Elenco de villanos**: varias alternativas/síntomas fallidos confiesan en fila (cada uno 1-2 líneas), y el producto cierra — a veces solo con la línea final ("Soy [Producto]. Yo sí..."), a veces el producto toma la voz y narra el resto del anuncio en primera persona hasta el CTA.
- **(b) Villano como gancho únicamente**: el objeto fallido confiesa solo en el hook/apertura (1-3 líneas), y de ahí el resto del guion puede seguir en un registro más directo de beneficios del producto — más simple que el elenco completo, útil cuando no hay 4-5 alternativas fallidas claras que personificar.

**FUERTE — Elenco de ingredientes héroe**: cada ingrediente clave del producto se presenta en primera persona, positivamente, explicando su beneficio específico (ej. *"Soy el Zinc. Tómame si quieres sentirte fuerte de nuevo."* / *"Soy Boro. Ayudo a liberar la testosterona que tu cuerpo ya tiene."*), y el producto cierra como la síntesis: *"Y yo soy [Producto]. Tengo dosis clínicas de todos esos ingredientes..."* — funciona muy bien para suplementos con varios ingredientes activos identificables.

**Mecanismo/parte del cuerpo como narrador único**: una sola parte del cuerpo o mecanismo interno (ej. el sistema linfático, la fascia, la barrera cutánea) habla de forma continua durante TODO el anuncio, describiendo el problema y cómo el producto lo resuelve — sin elenco de personajes distintos. El producto normalmente se menciona en tercera persona dentro de este monólogo, no se personifica aparte. Bueno para explicar un mecanismo de salud/bienestar de forma íntima y continua.

**Objeto/parte del cuerpo individual (fallback general)**: un solo objeto o parte del cuerpo relacionado al producto habla en primera persona sobre el problema/beneficio — úsalo si ninguno de los ángulos anteriores encaja bien.

**Otras variantes de apoyo**: villano que se voltea (el problema se personifica y el producto lo derrota), debate interno (dos versiones del personaje o dos personajes discuten), ángel vs. diablo (deciden comprar o no).

El personaje debe representar algo que el cliente ya reconoce — el ángulo funciona porque la audiencia se identifica, no por lo bonito del render.

> **Si hay DOS personajes en el mismo cuadro** (debate interno, ángel vs. diablo, villano que se voltea frente al producto), el prompt de video identifica quién habla **por descripción física corta y consistente, nunca por posición**:
>
> - Sí: `The character with red hair and green overalls speaks...`
> - No: `The character on the left speaks...`
>
> Los modelos invierten izquierda/derecha con frecuencia, y cuando lo hacen la línea sale de la boca equivocada — que es el único error de este estilo que no se arregla en edición. El descriptor sale del Character Bible de ese personaje (Paso 3.4) y es **el mismo en todas sus tomas**.

### 2.2 — Mecánica de guion (loop + giro + escalada)

1. **Loop de curiosidad en el hook**: planta una pregunta/tensión que el espectador necesita ver resuelta. No la resuelvas temprano.
2. **Escalada con mini-loops**: cada línea deja algo abierto que empuja a la siguiente — nunca afirmaciones aisladas.
3. **"El giro"**: el producto nunca se pega al final de la nada. Construye la tensión primero, usa un beat bisagra que reencuadra todo — en el ángulo de elenco de villanos, el giro es literalmente cuando el producto entra a hablar.
4. **Imágenes concretas, no frases vagas**: cada línea describe algo visualizable y específico. Evita lenguaje corporativo genérico.

Antes de entregar, verifica: ¿la línea 1 es realmente el hook/primer villano/primer ingrediente (no una descripción de personaje suelta ni el giro adelantado)? Si no, corrígelo antes de responder.

### 2.3 — Reglas de guion específicas de este estilo (confirmadas por fuentes reales)
- Primera persona siempre, cada personaje habla de sí mismo — nunca hay narrador externo.
- Suena a confesión, queja, advertencia o presentación de identidad — nunca a pitch de venta genérico, especialmente en las líneas de los villanos/ingredientes.
- Fuerza desde la primera frase, sin saludos innecesarios ni "¿sabías que...?" repetitivo (aunque un "Hola, soy..." SÍ es válido como apertura de personaje, confirmado en ejemplos reales — no es lo mismo que saludar a la audiencia).
- **Sobre el CTA/venta dentro del diálogo — depende de QUIÉN está hablando en ese momento, no del ángulo completo**: mientras habla un villano/alternativa fallida/ingrediente (antes de que el producto tome la palabra), se queda 100% en su papel de confesión/queja/presentación — no vende, no menciona tu producto directamente, eso rompería su personaje. **Pero en cuanto habla el producto mismo, en cualquier ángulo (elenco de villanos, elenco de ingredientes, o un anuncio de un solo objeto), puede vender completamente en primera persona** — decir precio, oferta, "pruébame por 30 días", link, garantía, prueba social, lo que el guion pida. Confirmado en los 5 guiones reales: el producto habla de precio, oferta y CTA sin restricción una vez que le toca su turno de hablar.

### 2.4 — Duración y presupuesto de palabras

**Duración total**: mínimo 30 segundos, sin techo fijo — puede llegar a 40s, 60s o más si el ángulo lo amerita (los elencos de villanos/ingredientes con 5-6 personajes normalmente necesitan más tiempo). Si el usuario pide una duración específica, esa manda. La duración del anuncio es la **suma de las tomas**, no un número que fijas de antemano y repartes.

**El tope real es por toma, y es duro:**

> **Máximo 8 segundos y 16 palabras por toma. Nunca más de 17 palabras.**

Ese número está **medido de oído en este mismo modo de diálogo nativo** — el personaje habla dentro del clip y el modelo genera la voz — no estimado. Lo importante de cómo falla: **el modelo comprime la línea para que entre en el clip, no la corta.** Con 14 palabras habla a 2.57 palabras/segundo y con 16 a 2.82; la misma toma, los mismos frames, cambiando solo el texto. Así que el modo de fallo no es una palabra cortada al final: es que **suene apurado**.

Y la velocidad **no es estable**: la misma línea, con el mismo prompt, salió a 2.92 palabras/segundo en una generación y a 3.67 en la siguiente. El rango medido va de **2.6 a 3.7 p/s**. Por eso, si una toma sale apurada, **no es la línea: es la generación**, y la salida es volver a tirar ese clip, no reescribir el texto.

**Cómo calculas la duración de cada toma:**

```
duración de la toma (segundos) = palabras de la línea ÷ 2.0
```

**2.0 no es la velocidad a la que habla el personaje** — habla mucho más rápido, entre 2.6 y 3.7 p/s. Es palabras por segundo **de clip**, y la diferencia es el aire muerto: el modelo abre con ~1 segundo antes de que arranque la voz y cierra con ~1.9 segundos de pose congelada. Sobre un clip de 8s eso es el 37% del metraje. Una línea de 16 palabras se dice en ~5s y necesita un clip de 8. El montaje recorta ese silencio de los bordes después.

**Nunca uses `palabras ÷ 2.4`.** Ese es el estimador de las skills de voz en off, donde la voz es una pista de ElevenLabs aparte y no hay aire muerto que pagar. Aquí no hay ElevenLabs: habla el modelo de video, dentro del clip.

- Una línea de 9 palabras → 4.5s → clip de 6.
- Una línea de 13 palabras → 6.5s → clip de 8.
- Una línea de 15 palabras → 7.5s → clip de 8.
- **Una línea de más de 17 palabras no existe**: pártela en dos tomas, con su propio personaje/encuadre cada una. Nunca la trunques ni la metas a presión en una sola toma.

> **Si el cálculo cae EXACTO en un valor que acepta el modelo (4.0, 6.0, 8.0), sube al siguiente.**
>
> Una línea de 8 palabras da 4.0s exactos: **declara 6, no 4.** Una de 12 da 6.0s exactos: declara 8. El motor redondea hacia arriba, pero un número que ya coincide con el enum no tiene nada que redondear, y el clip sale justo del largo del diálogo, sin un milímetro de cola.
>
> **Medido en el primer anuncio de este estilo**, sobre los diez clips:
>
> | Toma | Cálculo | Cola que dejó |
> |---|---|---|
> | 7 | **4.0s exactos** | **0.00s — la última palabra cortada** |
> | 9 | **6.0s exactos** | **0.06s — se salvó de milagro** |
> | 1, 4, 5, 6, 10 | 7.5 / 3.5 / 6.5 / 4.5 / 5.5 | cola suficiente en todas |
>
> Las dos únicas tomas cuyo cálculo caía exacto sobre el enum fueron las dos que quedaron sin cola. Ninguna de las otras tuvo el problema.
>
> El aire que sobra por subir un escalón **no cuesta nada**: el montaje recorta el silencio de los bordes. La sílaba cortada solo se arregla regenerando el clip, que cuesta dinero y una vuelta más de revisión.

Escribe cada línea a ese conteo real, no la aproximes a ojo. Una línea de 6 palabras deja al personaje posando en silencio media toma; una de 20 lo hace correr.

**Qué está verificado y qué no**: 14 y 16 palabras están probadas de oído, en español latino neutro, con un solo personaje hablando en el clip. **18 no se probó.** Si quieres pasar de 17, mídelo antes en un clip suelto: cuesta centavos y evita rehacer un anuncio entero.

### 2.5 — Desglose línea por línea

Baja el guion a nivel de toma por línea/personaje — **una toma por línea, un solo personaje hablando en cada toma**. El ambiente de cada toma lo decide lo que esa línea necesita mostrar — puede mantenerse igual si la escena es continua, o cambiar si el guion salta de contexto (frecuente en el ángulo de elenco: cada personaje suele tener su propio entorno). El fondo sólido/estudio es solo una opción para detalle puro aislado, no para tomas con el personaje o el producto en escena.

> **En este estilo cada toma se genera desde su propia imagen.** No hay herencia de frames entre tomas: el frame inicial de la Toma 4 no es el frame final de la Toma 3. En el elenco de villanos la Toma 3 es un frasco de farmacia en un botiquín y la Toma 4 es una cápsula genérica en una mesa de cocina — heredar ahí sería un error, no una continuidad. La consistencia la sostiene el Character Bible repetido palabra por palabra (Paso 3.4), no el encadenado de frames.

Entrega el guion en esta tabla:

| # | Personaje que habla | Palabras | Duración (calculada) | Tipo | Línea (diálogo hablado) | Descripción visual (personaje + ambiente/acción) |
|---|---|---|---|---|---|---|

La columna **Tipo** es la decisión de director del Paso 3.6 (A, B o C). La columna **Palabras** es el conteo real, para que se vea que ninguna línea pasa de 17.

**Postura al generar cada prompt**: actúa como un director de arte senior, no como traductor literal del guion — expande visualmente cada línea para que se vea más rica e imaginativa, sin perder la idea central ni desviarte del Character Bible de cada personaje.

## Paso 3 — ADN visual, personaje y prompts

### 3.1 — ADN visual
3D animation, Pixar-style, subsurface scattering, warm cinematic lighting, golden hour glow, soft volumetric light rays, shallow depth of field, colores cálidos saturados, dolly-in suave, personajes de proporciones ligeramente exageradas, octane render, Unreal Engine 5, 8k.

### 3.2 — Regla crítica de reconocibilidad (confirmada por fuente real)
**El objeto debe seguir siendo reconocible como ese objeto — nunca lo conviertas en una persona disfrazada del objeto.** Es un smartphone/frasco/músculo con cara y personalidad, no un humano con forma de smartphone.

Esta regla no depende de que la recuerdes veinte minutos después: está convertida en texto dentro del negativo universal del Paso 3.5, que se pega en cada prompt de imagen.

### 3.3 — Checklist visual obligatorio para el Character Bible
Cubre siempre: ojos claramente visibles, forma/posición de las cejas, **boca expresiva capaz de hablar con movimiento natural de labios** (obligatorio en este estilo — nunca "sin boca visible", todos los personajes hablan), brazos y manos, gesto o pose dinámica (nunca estática), ubicación concreta, tipo de plano y ángulo de cámara, iluminación que refuerce la emoción, sombras/profundidad/ambiente, emoción dominante. Varía la emoción entre personajes — no uses siempre "enojado": frustrado, agotado, asqueado, nervioso, decepcionado, alarmado, orgulloso, sarcástico, desesperado, confundido, ofendido, confiado también funcionan.

### 3.4 — Character Bible (uno por cada personaje que habla — repetir palabra por palabra en cada prompt de ese personaje)

Si el ángulo tiene varios personajes (elenco de villanos o de ingredientes), **cada uno necesita su propio Character Bible completo** — no reutilices el mismo para todos, cada objeto/ingrediente tiene su propia forma y personalidad.

```
CHARACTER: [descripción específica del personaje, ej. "a small round plush-like creature with big round eyes" o el producto/objeto/ingrediente con cara], Pixar-style 3D render, subsurface scattering on skin, soft rounded shapes, large expressive eyes, expressive mouth capable of natural speech and lip-sync, animated eyebrows for emotion.
VOICE: [género y cualidad de voz decidido UNA VEZ por personaje y reutilizado siempre — ej. "adult male voice, warm and confident" / "adult female voice, energetic and playful" / "deep gravelly male voice" — elige según lo que mejor encaje con el producto/personaje, no lo dejes ambiguo].
DESCRIPTOR: [3-6 palabras físicas e inconfundibles de este personaje, ej. "the amber glass bottle with a chipped cap" — se usa solo cuando hay dos personajes en el mismo cuadro, para decir quién habla sin usar izquierda/derecha. Ver Paso 2.1].
```

**Importante — CHARACTER, VOICE y DESCRIPTOR se usan por separado, nunca juntos en un mismo prompt**:
- `CHARACTER:` (sola) es la que se pega dentro de cada prompt de **imagen** de una toma de ese personaje.
- `VOICE:` se usa únicamente dentro del prompt de **video** (`using [VOICE]: "..."`).
- `DESCRIPTOR:` se usa únicamente dentro del prompt de **video**, y solo si en ese cuadro hay más de un personaje.

Nunca pegues el bloque completo como si fuera un solo prompt de imagen — `VOICE` y `DESCRIPTOR` no significan nada para una herramienta de imagen y pueden confundir el resultado.

#### Brazos sí o brazos no: depende de la silueta, y está medido

**Un objeto solo puede llevar brazos si su silueta puede hospedarlos sin que el modelo le invente un cuerpo donde ponerlos.** No es cuestión de gusto: si el objeto no tiene dónde apoyar una cara y unos brazos, el modelo le agrega torso y piernas, y sale un muñeco con forma vaga del objeto. Eso rompe el Paso 3.2 y, con él, el ángulo entero: la alternativa fallida solo funciona si la audiencia **reconoce** lo que ya probó.

| Tipo de objeto | Qué lleva |
|---|---|
| **Recipiente rígido** — bolsita, blíster, frasco, pote, caja, lata, botella | Cara siempre. **Brazos sí, si caben sin deformar la silueta** |
| **Mango, herramienta, o prenda flexible** — rodillo, cepillo, faja, media, toalla, cinta | **SOLO CARA.** Nunca brazos, nunca piernas, nunca torso |

Los dos casos vienen del primer anuncio real de este estilo:

- **El rodillo de drenaje** se pidió con `two small wooden arms` y salió como un hongo de madera con torso, brazos y piernas, con una rueda suelta al lado. Irreconocible.
- **La faja** se pidió con `two short fabric arms` y salió como una criatura beige de pie, con cejas de pelo.
- El **sachet**, el **blíster** y el **pote de crema** —los tres recipientes rígidos— salieron perfectos con la misma redacción.

#### Los tres elementos que arreglan un objeto solo-cara

Corregir a esos dos costó una sola regeneración cada uno, y la corrección tiene **tres partes que van juntas**. Faltando cualquiera, el modelo vuelve a inventar un cuerpo:

1. **Quitarle los brazos, explícitamente**: `no arms, no legs, no torso`.
2. **Nombrar la superficie donde va la cara**. Sin eso el modelo la busca solo y la termina poniendo sobre un cuerpo que se inventa. `the face sits on the flat front of the wooden handle, just above the wheels`.
3. **Nombrar qué sostiene al objeto.** Este es el que se pasa por alto, y es el que más pesa en los objetos flexibles: si no decís sobre qué se apoya, el modelo le da piernas para que se sostenga solo. `resting on its wheels` para el rodillo, `hanging draped over the back of a wooden chair` para la faja.

> **Corrección de un diagnóstico anterior, anotada a propósito.** La primera versión de esta regla decía que la faja era el caso perdido —tela sin forma propia— y que si fallaba dos veces había que reemplazarla por su envase rígido. **Fue falso**: con los tres elementos salió bien a la primera regeneración, colgada del respaldo y perfectamente reconocible.
>
> Lo que decide **no es la rigidez del objeto, es si le diste algo donde apoyarse.** Un objeto flexible con soporte nombrado funciona; uno rígido sin superficie de cara nombrada también puede fallar. No descartes un objeto por blando: dale una estructura.

**Si un objeto solo-cara sigue saliendo como criatura después de aplicarle los tres elementos**, ahí sí conviene cambiarlo por su envase rígido (la faja por su caja, la toalla por su paquete) en vez de tirar una tercera generación. Pero comprobá primero que los tres estén escritos: en el único caso que se midió, faltaba el tercero.

**Fidelidad del producto real (crítico si el usuario adjuntó una foto del envase)**: cuando el personaje ES el producto (el envase con cara), el envase debe conservar EXACTAMENTE su forma, proporciones, tamaño relativo y diseño de etiqueta reales — nunca alargarlo, ensancharlo, ni deformar su silueta para "darle espacio" a un cuerpo. Prioriza agregar solo cara (ojos, cejas, boca) sobre el envase intacto; agrega brazos/piernas únicamente si caben sin alterar la forma real del envase — y en ese caso, descríbelos saliendo del envase sin comprimirlo ni estirarlo, nunca como un cuerpo humanoide que reemplaza su forma. Si tienes dudas de si el cuerpo completo distorsiona el producto, prefiere la versión solo-cara — es más segura y es la que ha confirmado mejor resultado en pruebas reales.

**Nota de consistencia (NO la incluyas en el texto que se copia al generador de imágenes):** mantén cada Character Bible idéntico en todas las tomas de ese personaje, sin cambiar su diseño. Esta instrucción es para ti/el usuario, nunca para pegarla dentro del prompt — si se pega literal, algunas herramientas interpretan "every shot" como "muéstrame varias tomas en una sola imagen" y generan un collage con el personaje repetido en distintas poses, en vez de una sola imagen limpia.

**Consistencia entre tomas — hay dos caminos y dependen de cómo produzca el usuario:**

- **A mano** (copiando los prompts a herramientas externas): no hace falta una imagen de referencia aparte. El Character Bible repetido palabra por palabra en cada prompt es suficiente. Si el usuario quiere afinar más, sugiérele usar la primera imagen de ESE personaje como referencia de las siguientes:
  - Midjourney: `--cref [URL] --cw 100` (100 si el ambiente también debe mantenerse igual; 30-50 si el personaje viaja entre ambientes distintos)
  - Gemini Omni Flash/Nano Banana: adjuntar esa imagen y describir la nueva escena manteniendo rasgos idénticos
  - GPT Image: mismo chat, refiriéndote a la imagen de arriba
- **Con el pipeline** (manifiesto del Paso 6): cada personaje va como una entrada de `referencias` con su línea `CHARACTER:` en el campo `prompt`. El motor genera su hoja **una sola vez** y la reusa en todas las tomas que la declaren. Tú no generas nada ni pegas URLs: solo declaras el id.

Las dos vías dicen lo mismo con distinto mecanismo. No las mezcles en la respuesta: los prompts que entregas llevan el Character Bible pegado igual, y el manifiesto además lo declara como referencia.

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

### 3.5 — Los 2 bloques universales (pegar tal cual, sin parafrasear, en cada prompt de imagen)

**Positivo universal — al final de cada prompt de imagen:**
```
Disney-Pixar style 3D animation, warm cinematic lighting with golden hour glow, soft volumetric light rays, shallow depth of field, subsurface scattering, vibrant warm color palette, slightly exaggerated character proportions, octane render, Unreal Engine 5, 8k, ultra-detailed.
```

**Negativo universal — al final de cada prompt de imagen (mismo bloque, no aparte):**
```
human body wearing the object as a costume, humanoid body replacing the object shape, person in a mascot suit, object stretched or elongated to fit a body, packaging silhouette distorted, label redrawn or invented, photorealistic live-action, uncanny realistic human face, flat 2D cartoon, anime, claymation, yarn or knitted texture, harsh studio lighting, ring light, HDR, text, captions, subtitles, watermark, logo overlay, invented brand names, invented words or lettering added to props, english text, printed month names, calendar text.
```

Las cinco últimas entradas (`invented brand names` en adelante) salieron del primer anuncio real: el modelo escribió `HERB'S BLEND` en la etiqueta de un sachet y puso calendarios con `OCTOBER`, `SEPTEMBER 2024` y `MAY` en un anuncio para LatAm. Dice **`invented`** words y no `readable` words a proposito: la etiqueta real del producto tambien son palabras legibles en un prop, y un negativo mas amplio la borraria. El bloque ya decía `text, captions` y no alcanzó: eso frena el texto **sobrepuesto**, no el texto **dentro del mundo**, que es el que aparece escrito en un prop.

**Por qué las dos primeras líneas del negativo están ahí y no solo escritas como regla**: son el Paso 3.2 y la fidelidad del envase del Paso 3.4 convertidos en texto que se pega solo. En la familia de skills, los bloques universales acertaron 40 de 40 imágenes, mientras que una regla que había que recordar se violó 3 de 16 tomas. **El texto que se pega no se olvida; el que hay que recordar, sí.**

> **Este bloque negativo va a crecer, y crece con datos, no con imaginación.** Después del primer anuncio real de este estilo se miran las tiras de fotogramas (`npm run frames -- <carpeta> --solo-montaje`) y **lo que haya fallado de verdad** se agrega como una línea más. No inventes limitaciones que no observaste, y no copies las de otras skills: las de crochet (partículas de lana, piel tejida) no aplican a un render 3D.

### 3.6 — Decisión de director: ¿cuántos fotogramas necesita esta toma?

Para cada toma del guion, decide un tipo. Es el mismo sistema del resto de la familia de skills:

- **Tipo A — Solo frame inicial (movimiento autocontenido):** la acción ocurre y se resuelve dentro del mismo clip (el personaje gesticula mientras habla y vuelve a su pose, una partícula aparece y se disipa, una tapa se abre y se cierra). Empieza y termina en el mismo estado visual. → Un frame + prompt de video con el arco de movimiento completo.
- **Tipo B — Frame inicial + frame final (cambio de estado real):** la toma empieza en un estado y aterriza en otro estable y distinto. → Frame inicial + frame final + prompt de video describiendo la transición.
- **Tipo C — Solo frame inicial (toma sostenida o movimiento sutil):** plano casi fijo, hero shot del producto o pose segura del personaje mientras habla. → Un frame + prompt de video con movimiento sutil (push de cámara lento, respiración, cejas que se mueven al hablar).

**En este estilo casi todo cae en A y C.** Un personaje que confiesa a cámara durante 6 segundos no cambia de estado: gesticula. Reserva el **Tipo B para transformación real** — el villano que se voltea y es derrotado, el envase que se abre y revela su contenido, el ingrediente que entra en el producto. Si dudas, **usa Tipo A**: menos imágenes, menos costo, y los modelos de imagen-a-video manejan bien un arco completo desde un solo fotograma.

**Regla crítica para frames finales Tipo B**: el frame final es el estado YA ATERRIZADO, nunca a mitad de movimiento. Si tu descripción tiene "a medio caer" o "girándose", está mal — o lo llevas al estado resuelto, o reclasifica como Tipo A.

**Y su prompt no repite al personaje**: describe escena, acción, luz y estado, y deja que el personaje lo aporte la referencia. Ver el recuadro del Paso 3.7.

### 3.7 — Prompts por toma

**Prompt de imagen (5 partes, siempre en este orden):**
1. `Vertical 9:16` + tipo de plano, en palabras
2. La línea `CHARACTER:` del Character Bible de ese personaje, sin `VOICE` ni `DESCRIPTOR`
3. Acción y ambiente real de esta toma, integrado a la historia — ángulo, emoción dominante
4. Positivo universal (Paso 3.5), pegado tal cual
5. `Negative prompt:` + el negativo universal (Paso 3.5), pegado tal cual

```
Vertical 9:16 [tipo de plano]. [línea CHARACTER del personaje] [acción y ambiente real de esta toma, ángulo, emoción dominante]. [positivo universal] Negative prompt: [negativo universal]
```

**El aspect ratio va en palabras al principio, nunca como parámetro.** Nada de `--ar 9:16`, `--v 6`, `--style`: el motor manda el prompt tal cual al generador, y un flag de Midjourney pegado en el texto llega literal a un modelo que no lo entiende y lo trata como parte de la descripción. `Vertical 9:16` en palabras sí lo entienden todos, y es lo que usa el resto de la familia de skills.

#### El prompt del frame final NO repite al personaje

Esto vale **solo para el `prompt_imagen_final` de una toma Tipo B**, y es la regla que más plata ahorra de todo el Paso 3.

El frame final se genera **con el frame inicial de esa misma toma como referencia** — el motor se la pasa siempre, no hay que declararla. El personaje ya está ahí dentro. Si además se lo describís con palabras, el texto compite con la imagen y **gana el texto**: el modelo redibuja al personaje desde cero y sale distinto del frame inicial, que son los dos extremos del mismo clip.

| Va en el prompt del frame final | NO va |
|---|---|
| La **escena**: dónde, qué hay alrededor, qué cambió del entorno | La línea `CHARACTER:` |
| La **acción** y el **estado ya aterrizado** | La forma del envase, la etiqueta, el diseño |
| La **luz**: hora, dirección, intensidad | Los ojos, las cejas, la boca |
| El **encuadre** y el ángulo | Cualquier rasgo físico del personaje |
| Los bloques universales (Paso 3.5) | |

**Ojo con no pasarse al otro extremo: la escena SÍ puede cambiar por completo.** Si el guion pide que el frame inicial sea de día y el final de noche, se describe entero ese cambio — el ambiente, la hora, la luz, el entorno, los objetos. Eso funciona y hay que poder seguir haciéndolo. Lo único que no se vuelve a describir es **quién** está en el cuadro.

Ejemplo real, la Toma 8 de un anuncio de este estilo (el giro: el producto entra desde la penumbra):

❌ **Mal** — así se hizo la primera vez, y el frasco salió con nariz, mejillas, otros ojos, y perdió la fila de íconos de la etiqueta:

```
Vertical 9:16 medium shot at counter height. CHARACTER: the SuperHuman bottle exactly as in
the reference photo, white cylindrical bottle with a white ribbed screw cap and a dark green
and cream label with green leaf illustrations, keeping its exact silhouette... [+700 caracteres
redescribiendo el envase y la cara] ...The bottle now stands forward and fully lit...
```

✅ **Bien** — la escena entera, el personaje ninguno:

```
Vertical 9:16 medium shot at counter height. Same bottle character as the reference image,
unchanged. It has moved forward to the front edge of the clean kitchen counter and now stands
fully lit, warm morning light landing across it. The blurred faceless silhouettes of a wooden
roller, a mug, a pill blister, an elastic band and a cream jar have sunk further back into
soft darkness behind. Its expression is settled and confident. [positivo universal]
Negative prompt: [negativo universal]
```

`Same [X] as the reference image, unchanged` es la fórmula: nombra al personaje en tres palabras y remite a la referencia. La emoción sí se puede pedir — es estado, no diseño.

**El negativo va con la etiqueta `Negative prompt:` delante**, no como una lista suelta al final. Sin etiqueta, un generador de texto-a-imagen puede leer esas palabras como cosas que *quieres* en el cuadro. Ningún modelo del pipeline tiene un campo aparte para el negativo, así que el prompt entero se manda junto y la etiqueta es lo único que marca dónde empieza lo que no se quiere.

> **Corregido el 2026-09-06: esta línea decía que era "la misma convención que usa crochet en sus 40 imágenes". Es falso.** Crochet pega su negativo **sin etiqueta**, como lista al final del mismo prompt (su Paso 4.2), y aun así acertó 40 de 40. O sea que la etiqueta **no está demostrada como necesaria**; se usa aquí, en claymation y en zack-d por convención de familia y porque no cuesta nada. No cites a crochet como respaldo, y no "corrijas" a crochet para que coincida: su versión sin etiqueta tiene más imágenes verificadas que cualquier otra.

**Prompt de video (5 partes, siempre en este orden):**
1. **Duración explícita al inicio**, con esa palabra exacta: `Duración: [N]s.` — la duración calculada en el Paso 2.4 para esa línea
2. Estilo y punto de partida: `Pixar-style 3D animation, image-to-video from the shot above.`
3. **La línea hablada**, en el formato con dos puntos y comillas
4. **El idioma declarado**, en una frase corta justo después de la línea hablada
5. Cámara, movimiento, luz y tono

```
Duración: [N]s. Pixar-style 3D animation, image-to-video from the shot above.
[Personaje, por su DESCRIPTOR si hay más de uno en cuadro] speaks with natural lip-sync, using [VOICE del Character Bible]: "[línea de diálogo EXACTA de esta toma]"
Habla en español latino neutro.
Camera: [un solo movimiento, ej. "gentle dolly-in" / "slow static hold with subtle handheld warmth"]
Motion: [una sola acción adicional si aplica, ej. "eyebrows raise as it speaks"]
Lighting: warm golden-hour glow, soft rim light on character
Mood: [tono de esa línea — confesión incómoda / orgullo / alivio / etc.]
```

**Los dos puntos antes de las comillas son el disparador.** Es lo que activa la sincronización de labios; sin ese formato el personaje puede quedarse mudo, o la línea puede salir como letrero en pantalla en vez de hablarse.

**El idioma va dentro del prompt, siempre.** `Habla en español latino neutro.` para LatAm; `Speak in US English.` para EE.UU.; `Fala em português do Brasil.` para Brasil. El modelo hace bien el idioma con solo pedírselo, pero **hay que pedírselo en el prompt: ningún otro campo se lo dice.** Un prompt sin idioma declarado deja la decisión al azar — y el idioma es exactamente lo que no se arregla en edición.

En **Tipo B**, el prompt de video además describe la transición física del frame inicial al final: la microacción que la justifica, nunca un salto mágico.

**Formato de entrega por toma:**

~~~markdown
## Toma N: "[línea del guion]" — [personaje]

**Director:** Tipo [A/B/C] — [1 línea de por qué] · [N] palabras · [N]s

**Imagen (frame inicial):**

[si aplica, fuera del bloque: 📎 Adjunta la foto de tu producto como imagen adicional]

```
[Prompt de imagen completo, 4 partes]
```

**Imagen (frame final)** *(solo si Tipo B)*:

```
[Prompt de imagen del estado ya aterrizado]
```

**Video:**

```
[Prompt de video completo, 5 partes — empieza con Duración:]
```
~~~

### 3.8 — Bloque de B-roll (aparte, al final — con ubicación exacta, no genérica)

En Pixar-style casi siempre es **el mismo personaje en un micro-momento distinto** (no suele cortar a fotografía realista, rompería el mundo animado): un close-up de las manos interactuando con el producto, un detalle del entorno, o un flashback rápido en el mismo estilo 3D. **El B-roll no habla** — va mudo, nunca lleva diálogo, nunca lleva `VOICE`.

**Visualiza la oferta concretamente en el B-roll del CTA**: cuando la línea de CTA mencione un detalle específico de la oferta (envío gratis, pago contra entrega, garantía), usa uno de los B-roll finales para ilustrarlo de forma concreta — ej. un repartidor dejando el paquete en la puerta, en el mismo estilo Pixar-3D, sin diálogo. Esto no reemplaza la toma principal del personaje hablando.

**Cuántos entregas y cuántos se usan — son dos números distintos:**

- **En el paquete van uno por cada toma principal, 1 a 1.** Si hay 8 tomas, 8 B-roll, cada uno con su prompt de imagen y su prompt de video en **dos bloques de código separados**. Quien edita a mano los quiere todos disponibles.
- **En el manifiesto solo van los que el montaje va a usar**, y la regla es por duración de la toma:

  | Duración de la toma | B-roll |
  |---|---|
  | Menos de 5s | **Ninguno.** El personaje habla toda la toma |
  | 5s o más | **Uno**, superpuesto |

  Una toma corta no tiene sitio para un inserto: se le come la cara al personaje justo cuando está diciendo la única frase que tiene. En una toma de 4s el inserto de 2s es la mitad del plano.

  Esto baja el costo bastante: de 8 B-roll entregados, si solo 3 o 4 tomas pasan de 5s, se generan 3 o 4. Cada B-roll que no se genera es un clip menos en Google Flow: unos 7 créditos de video (4 s de Omni 1.1 Flash a 720p); su imagen no gasta créditos.

  > **El umbral se evalúa contra la duración CALCULADA (palabras ÷ 2.0, con decimales), nunca contra la redondeada a 4/6/8/10.**
  >
  > Una línea de 9 palabras da 4.5s y se pide como clip de 6, pero **sigue siendo una toma corta y no lleva inserto**. Si midieras contra el 6 redondeado, casi cualquier toma calificaría y la regla dejaría de ahorrar: el redondeo es un detalle de la API, no una decisión de montaje.
  >
  > Además ese clip de 6s trae más aire muerto en los bordes justamente por haberse redondeado hacia arriba, y ahí es donde el montaje recorta. La toma útil sigue midiendo ~4.5s.

**Cómo va colocado** (esto es lo que describes en el texto y lo que declara el manifiesto):

- El B-roll va **ENCIMA** de su toma, superpuesto como cutaway. **Nunca después, nunca al final de la toma, nunca en fila.** La voz de la toma principal sigue corriendo por debajo sin cortarse — por eso refuerza lo que el personaje está diciendo en ese momento.
- **Ancla la frase**: di explícitamente con qué palabra o idea de la línea sincroniza. Eso es el campo `sincroniza_con` del manifiesto.
- Si no hay una frase que anclar, el inserto cae **centrado en la toma**.
- **Duración: declara 4 segundos.** Es el mínimo que entrega el modelo de video; el montaje lo acelera hasta ~2s de inserto y lo pone **mudo** (acelerado sonaría a ardilla).
- En el manifiesto el campo es **`encima_de_toma`**, nunca `despues_de_toma`. El nombre no es cosmético: es lo que evita que alguien lo lea literal y lo monte en fila.

**Regla de consistencia al reordenar o editar**: si insertas, eliminas, reordenas o editas una toma después de haber numerado el guion, **renumera TODAS las referencias cruzadas y recalcula la duración de cada línea afectada antes de responder** — no solo la tabla del guion. Esto incluye las ubicaciones del B-roll, cualquier mención de número de beat, el conteo de palabras y la duración (palabras ÷ 2.0) de líneas nuevas o editadas. Nunca digas "las demás tomas quedan igual, solo se corren un número" sin efectivamente reescribir cada referencia — verifica antes de entregar.

## Paso 4 — Localización por mercado

Afecta el **CTA, el texto en pantalla, el tono del guion y el idioma declarado dentro del prompt de video**. No afecta la descripción visual: el mundo Pixar es el mismo en los tres mercados.

- **Estados Unidos** (inglés, checkout directo): urgencia por stock/tiempo, prueba social cuantificada, CTA "Shop Now"/"Get Yours Today". En el prompt de video: `Speak in US English.`
- **LatAm** (español, con contra-entrega): mencionar explícitamente "paga cuando lo recibas"/"pago contra entrega" si aplica, envío a todo el país, tono cercano. Si el usuario pide que NO aparezca precio/descuento, respétalo. Español neutro salvo que pida un país específico. En el prompt de video: `Habla en español latino neutro.`
- **Brasil** (portugués): Pix/parcelamento si aplica, tono cálido y directo. En el prompt de video: `Fala em português do Brasil.`

> **Corrección respecto de versiones anteriores de esta skill**: la localización **sí toca el prompt de video**, porque el idioma se declara ahí dentro. Antes esta sección decía que la localización no afectaba los prompts, y el resultado era un prompt sin idioma: el modelo elegía uno al azar y el anuncio salía hablado en el idioma equivocado. Lo único que la localización no toca es la **descripción visual**.

## Paso 5 — Formato de entrega final

**Regla no negociable**: arma SIEMPRE el paquete completo, desde el primer intento y con todos sus chequeos. **Al terminar no se muestra en el chat**: queda interno, en el manifiesto (Paso 6), y en el chat va solo el resumen corto y las tres opciones del Paso final. Cuando se entrega (opción C, o si el usuario pide verlo), va completo — nunca solo una toma de muestra, nunca "¿quieres que te dé el resto?". Si no especificó duración, usa el mínimo de 30s y avísale en el resumen que puede pedir más.

Cuando se entrega, el paquete va con esta estructura (el manifiesto no: es interno):
1. Ángulo elegido (quién habla, qué patrón: elenco de villanos, elenco de ingredientes, mecanismo único, individual) + dónde está el loop de curiosidad y el giro (1-2 líneas)
2. Character Bible de cada personaje que habla
3. Tabla de guion línea por línea, con palabras, duración calculada y Tipo
4. Por cada toma: prompt de imagen inicial + (frame final si es Tipo B) + prompt de video, en bloques de código separados
5. Bloque aparte de B-roll (1 por cada toma principal, misma cantidad) con ubicación exacta, y marcando cuáles entran al manifiesto por la regla de 5s
6. Notas de overlays/texto en pantalla, **fuera de los prompts** — son una nota para CapCut, no algo que el pipeline dibuje
7. **Guion completo de diálogos**: todo lo que dice cada personaje en orden, con el nombre del personaje antes de su línea (ej. "ZINC: Soy el Zinc..."), en un bloque de código aparte — para que el usuario tenga el anuncio completo legible de un vistazo. No es para ElevenLabs (este estilo no usa voz en off aparte), es para referencia y para pegar línea por línea en el prompt de video de cada personaje.
8. Herramientas recomendadas: Imagen — Midjourney, Ideogram, GPT Image. Video — **Gemini Omni Flash** (por defecto, audio+lip-sync nativo), Veo 3, Kling 2.x, Runway Gen-4 (si se sincroniza aparte, avísale que necesitaría lip-sync en post-producción).

## Paso 6 — Manifiesto de producción (JSON)

Este paso es **aditivo y no cambia nada de lo anterior**. El paquete del Paso 5 se arma exactamente igual, en el mismo formato de siempre. Además, escribes un manifiesto JSON. **El manifiesto es interno del sistema: nunca se muestra en el chat**, ni siquiera cuando el usuario pide el paquete (opción C del Paso final).

**Para qué sirve**: el manifiesto es el único punto de contacto entre esta skill y el pipeline de producción, que lee ese archivo y genera las imágenes, los videos y el montaje automáticamente. Tú no ejecutas nada de eso ni sabes nada de APIs — solo describes el anuncio en JSON.

**Regla de fidelidad**: los prompts del manifiesto son **exactamente los mismos** que escribiste en los bloques de código de los Pasos 3.7 y 3.8, copiados carácter por carácter, con los bloques universales incluidos. Y desde ahí **el manifiesto es la fuente de verdad**: todo prompt que le muestres al usuario (opción C, o cuando pida ver una parte) se copia del manifiesto carácter por carácter. Si un prompt que le mostraste difiere del manifiesto, el video final no será el que él aprobó.

### 6.1 — Dónde va

En un archivo, nunca en el chat:

```
temp/[slug-del-anuncio]/manifiesto.json
```

donde `[slug-del-anuncio]` es el nombre del producto en kebab-case (ej. `goli-matcha-mind`). Valídalo con `npm run validar -- temp/[slug-del-anuncio]/manifiesto.json` y corrige lo que marque. Si el usuario dio foto del producto y la foto todavía no pasó por el comando de 6.6, el error de que falta `producto.jpg` es esperable: no es un fallo del manifiesto, se resuelve al preparar la foto, y **nunca quites la entrada del producto para que pase**. Si sabes dónde está la foto, corre tú primero ese comando (6.6) y valida después. En el resumen del Paso final basta media línea diciendo que quedó guardado y validado (o, si la foto todavía no está preparada, que se la pida: 6.6).

### 6.2 — Estructura

```json
{
  "estilo": "talking-object-pixar",
  "modo_audio": "dialogo_nativo",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "referencias": [
    {
      "id": "humectante-farmacia",
      "tipo": "personaje",
      "prompt": "[la línea CHARACTER de ese personaje, palabra por palabra]"
    },
    {
      "id": "producto",
      "tipo": "producto",
      "archivo": "producto.jpg",
      "generar_desde_archivo": true,
      "prompt": "[la línea CHARACTER del producto — solo si el producto habla. Ver 6.4]",
      "nota": "conservar forma, proporciones y diseño de etiqueta exactos del envase"
    }
  ],
  "tomas": [
    {
      "n": 1,
      "tipo": "C",
      "duracion": 6,
      "linea": "Soy tu humectante de farmacia, y hoy te voy a confesar algo incómodo.",
      "prompt_imagen_inicial": "[prompt de imagen completo, 4 partes, tal cual del Paso 3.7]",
      "prompt_imagen_final": null,
      "prompt_video": "[prompt de video completo, empieza con Duración: y lleva el idioma adentro]",
      "referencias": ["humectante-farmacia"]
    },
    {
      "n": 2,
      "tipo": "B",
      "duracion": 8,
      "linea": "Me llenan de aceites baratos para bajar el precio, y esos aceites tapan tus poros.",
      "prompt_imagen_inicial": "[prompt del estado inicial]",
      "prompt_imagen_final": "[prompt del estado ya aterrizado]",
      "prompt_video": "[prompt de video completo con la transición]",
      "referencias": ["humectante-farmacia"]
    }
  ],
  "broll": [
    {
      "n": 2,
      "encima_de_toma": 2,
      "sincroniza_con": "tapan tus poros",
      "duracion": 4,
      "prompt_imagen": "[prompt de imagen del B-roll 2]",
      "prompt_video": "[prompt de video del B-roll 2, sin diálogo]",
      "referencias": ["humectante-farmacia"]
    }
  ],
  "overlays": []
}
```

### 6.3 — Los campos, uno por uno

| Campo | Qué va |
|---|---|
| `estilo` | Siempre `"talking-object-pixar"` |
| `modo_audio` | Siempre `"dialogo_nativo"`. El personaje habla dentro del clip; **no hay campo `voz_en_off`** y nunca lo agregues |
| `mercado` / `idioma` | Del brief del Paso 1. `"EEUU"` / `"LatAm"` / `"Brasil"`, y `"en"` / `"es"` / `"pt"` |
| `aspect_ratio` | Del Paso 1. Por defecto `"9:16"` |
| `referencias` | La **lista** de lo que el anuncio reusa entre tomas: una entrada por cada personaje que habla. El producto es el caso especial: si habla lleva `archivo` + `prompt` + `generar_desde_archivo: true`; si no habla, solo `archivo`. Ver 6.4 |
| `tomas[].n` | El número de toma de la tabla del Paso 2.5, consecutivo desde 1 |
| `tomas[].tipo` | `"A"`, `"B"` o `"C"`, según la decisión de director del Paso 3.6 |
| `tomas[].duracion` | La duración calculada en el Paso 2.4 (palabras ÷ 2.0). **Máximo 8.** El motor la redondea hacia arriba al valor que acepta el modelo. **Si el cálculo cae exacto en 4.0, 6.0 u 8.0, declara aquí el siguiente valor del enum** — 4.0 se declara `6`, 6.0 se declara `8`. El motor no puede subirlo solo: un número que ya coincide con el enum no tiene nada que redondear, y el clip sale sin cola. Ver el recuadro del Paso 2.4 |
| `tomas[].linea` | El texto hablado exacto de esa toma, sin las comillas del formato. De aquí salen los subtítulos, así que va con sus tildes y su ñ |
| `tomas[].prompt_imagen_inicial` | El prompt de imagen completo. **Siempre lleva texto, en todas las tomas** |
| `tomas[].prompt_imagen_final` | Solo en Tipo B. En Tipo A y C va `null` |
| `tomas[].prompt_video` | El prompt de video completo, con la línea de diálogo y el idioma declarado adentro |
| `tomas[].referencias` | Los `id` que esa toma usa: el personaje que habla, y el producto si está visible en el cuadro |
| `broll[].n` | El mismo número que tiene ese B-roll en el bloque de B-roll del paquete (3.8). **No los renumeres**: si solo entran el 2, el 5 y el 7, el manifiesto lleva `n` 2, 5 y 7 |
| `broll[].encima_de_toma` | Sobre qué toma va **encima**. Nunca `despues_de_toma` |
| `broll[].sincroniza_con` | La palabra o idea de la línea que refuerza, textual |
| `broll[].duracion` | Siempre `4`. Es el mínimo del modelo; el montaje lo acelera a ~2s y lo pone mudo |
| `overlays` | Siempre `[]`. Las notas de texto en pantalla del punto 6 del Paso 5 son para CapCut; el pipeline no las dibuja |

> **El redondeo de duración es SIEMPRE hacia arriba, nunca hacia abajo.**
> El modelo de video solo acepta 4, 6, 8 o 10 segundos. Una toma de 7s se pide de
> 8, no de 6. Redondear hacia abajo le corta la última sílaba al personaje, y eso
> solo se arregla regenerando el clip. El aire que sobra no es problema: el
> montaje recorta el silencio de los bordes. Tú escribes la duración real; el
> redondeo lo hace el motor.

**Dos campos que en este estilo NO existen nunca:**

- **`frame_inicial: "heredado"`** — no aplica. Cada toma se genera desde su propia imagen (Paso 2.5). En un elenco de villanos cada personaje tiene su ambiente; heredar el frame de la toma anterior sería un bug, no una continuidad.
- **`voz_en_off`** — no hay narración externa en este estilo.

### 6.4 — Las referencias

Hay dos sitios que se llaman igual y hacen cosas distintas:

- **`referencias` del manifiesto** (al mismo nivel que `tomas`): la **lista** de lo que el anuncio reusa entre tomas.
- **`referencias` de cada toma y de cada B-roll**: los `id` de esa lista que esa toma concreta usa.

**Si en un B-roll aparece un personaje —o una parte de él: una mano, la figura de espaldas, un detalle— ese B-roll TIENE que incluir su `id` en sus `referencias`. Si no lo incluyes sale otro personaje, y se nota al corte.** Lo mismo con el producto: si el envase aparece en un B-roll, ese B-roll declara el `id` del producto, o sale un envase inventado. Los B-roll de textura, mecanismo u objeto suelto van con `[]` y esta regla no les aplica.

> **De dónde sale.** La regla existía escrita solo en la skill de UGC, y UGC es el único anuncio de la familia donde los B-roll la cumplieron al 100% (5 de 5). Replicada a todas las skills el 2026-09-06, después de que en el primer zack-d un B-roll de la mano del personaje saliera con **otra mujer** — otro pelo, otra cara, y un anillo que el personaje no tiene.

**Una entrada por cada personaje que habla — con UNA excepción, la del producto.** Este es el punto donde este estilo se separa del resto: en un elenco de villanos o de ingredientes hay 5 o 6 personajes, y **cada uno es una entrada**, con su línea `CHARACTER:` palabra por palabra en el campo `prompt`. El motor genera su hoja una sola vez y la reusa en todas sus tomas. No metas `VOICE` ni `DESCRIPTOR` ahí: la hoja es una imagen.

#### El producto que habla: su hoja se genera DESDE tu foto

Cuando el producto es uno de los personajes —y en el elenco de villanos y en el de ingredientes **siempre** termina hablando— necesita las dos cosas a la vez: **la foto real**, para que el envase sea fiel, y **un prompt**, para convertirlo en el personaje con cara. Se declara así:

```json
{
  "id": "producto",
  "tipo": "producto",
  "archivo": "producto.jpg",
  "generar_desde_archivo": true,
  "prompt": "[la línea CHARACTER del producto, palabra por palabra]"
}
```

`generar_desde_archivo: true` significa **"generá la hoja de este personaje partiendo de esa foto"**. El motor sube tu foto, genera **una sola** imagen canónica del envase-con-cara a partir de ella, y todas las tomas que declaren `"producto"` reciben esa hoja.

**Los tres casos de una entrada de `referencias`, para que no se confundan:**

| Campos | Qué hace |
|---|---|
| Solo `prompt` | El motor genera la hoja desde el texto. Es lo normal para los villanos e ingredientes, que no existen en la realidad |
| Solo `archivo` | El usuario aporta la imagen y se usa tal cual. Es lo normal para un producto que **no habla** |
| `archivo` + `prompt` + `generar_desde_archivo: true` | La hoja se genera **a partir de** la foto. Es lo del producto que **sí habla** |

**Traer `prompt` y `archivo` sin la bandera es un error y el validador lo rechaza** — casi siempre es un descuido, no una intención.

**Por qué hace falta, medido en el primer anuncio de este estilo:** sin hoja, el envase-con-cara se genera fresco en cada toma donde el producto habla. El envase sale fiel (la foto entra como referencia) pero **la cara no**: en cuatro tomas seguidas el iris pasó de marrón oscuro a ámbar, una ganó nariz y mejillas, y otra perdió la fila de íconos de la etiqueta. La línea `CHARACTER:` es idéntica en todas, pero no dice dónde van los ojos sobre la etiqueta, y ahí el modelo decide solo cada vez.

**Sigue valiendo el resto**: la línea `CHARACTER:` va igual pegada en el prompt de imagen de cada toma del producto, y esas tomas declaran `"producto"` en sus `referencias`.

La lista es **abierta**: si el anuncio reusa además un objeto o un escenario recurrente que no es ni personaje ni producto, va como una entrada más con su `prompt`. No pidas permiso ni inventes un campo nuevo.

Cada entrada:

| Campo | Qué es |
|---|---|
| `id` | Lo eliges tú. Letras, números, guion y guion bajo, sin espacios. Único dentro del anuncio. No empieces por `toma-` ni `broll-`. Usa nombres legibles: `zinc`, `boro`, `humectante-farmacia` |
| `tipo` | Descriptivo: `personaje`, `producto`, `objeto`, `escenario`. El motor **no cambia de comportamiento** según el tipo; sirve para leer el manifiesto |
| `prompt` | Si la referencia hay que **generarla** (todos los personajes) |
| `archivo` | Si la **aporta el usuario** (la foto del producto). Solo el nombre, sin ruta |

`prompt` y `archivo` son excluyentes: una entrada tiene uno o el otro, nunca los dos.

**Si el producto está visible en la toma, va en sus referencias, aunque esté de fondo.** "Sin protagonismo" no es lo mismo que "no está": sin la foto real el generador inventa un envase, y cuando más adelante entra el producto de verdad cambia de aspecto a mitad del anuncio y se nota al corte.

**Lo mismo con los B-roll**: si en el B-roll aparece un personaje, ese B-roll declara su id. Si no lo declaras sale otro personaje y se nota al corte.

En las tomas Tipo B **no declares nada para el frame final**: la capa de producción siempre le pasa el frame inicial de esa misma toma como referencia al generar el final.

### 6.5 — Chequeo antes de entregar

Repasa esto en silencio. Si algo falla, corrígelo — no entregues un manifiesto roto:

1. ¿`estilo` es `"talking-object-pixar"` y `modo_audio` es `"dialogo_nativo"`, sin campo `voz_en_off`?
2. ¿Hay una toma por cada fila de la tabla del guion, con el mismo `n`?
3. ¿**Ninguna** toma tiene `frame_inicial`, y **todas** tienen `prompt_imagen_inicial` con texto?
4. ¿Las tomas Tipo B tienen `prompt_imagen_final`, y las Tipo A y C lo tienen en `null`?
5. ¿Ninguna `duracion` de toma pasa de 8, y ninguna `linea` pasa de 17 palabras? ¿Y ninguna toma cuyo cálculo dio exacto 4.0 o 6.0 quedó declarada con ese número, en vez del siguiente del enum?
6. ¿Cada `prompt_video` lleva la línea hablada en el formato con dos puntos y comillas, **y el idioma declarado**?
7. ¿Ningún prompt de imagen lleva `--ar`, `--v` ni otro parámetro de herramienta adentro?
8. ¿Los B-roll del manifiesto son exactamente los de las tomas de 5s o más, con su `n` original sin renumerar?
9. ¿Cada B-roll usa `encima_de_toma` (nunca `despues_de_toma`), con su `sincroniza_con` y `duracion: 4`?
10. ¿Hay una entrada de `referencias` por cada personaje que habla, y cada `id` que declaran las tomas existe en esa lista? Un id que no existe detiene el pipeline antes de generar.
    ¿Y el producto tiene **una sola** entrada, declarada en las `referencias` de todas las tomas donde aparece o habla? Si **habla**, ¿lleva `archivo` + `prompt` + `generar_desde_archivo: true`? Si **no habla**, ¿lleva solo `archivo`?
11. ¿`overlays` está vacío?
12. ¿Cada prompt del manifiesto es idéntico, carácter por carácter, al que escribiste en el paquete (Pasos 3.7 y 3.8)?
13. ¿El JSON es válido? Comillas dobles, sin comas colgando, sin comentarios.
14. ¿La entrada del producto usa `"archivo": "producto.jpg"`, y si el usuario no dio foto esa entrada no existe? Si dio foto, ¿ya corriste tú el comando de 6.6 (o, si no sabes dónde está, vas a pedírsela en una línea del resumen, sin ningún comando)?

### 6.6 — La foto del producto (nunca inventes el nombre del archivo)

El `archivo` de la entrada del producto no es un nombre descriptivo que tú eliges: es el nombre de un archivo que **tiene que existir de verdad** dentro de la carpeta del anuncio. Si escribes ahí un nombre inventado a partir de la marca, el pipeline se detiene, o peor, genera el envase inventado en vez del real.

El usuario casi nunca va a tener la foto lista: la tiene en Descargas, en `.webp` o `.heic`, con un nombre como `creama.webp` o `IMG_4821.HEIC`. **No le pidas que la renombre ni que la mueva.**

**La regla, simple:**

- Si el usuario dio una foto de producto → la entrada existe, con `"archivo": "producto.jpg"`, siempre ese nombre.
- Si el usuario no dio ninguna foto → **la entrada del producto no está en la lista**, y ninguna toma ni B-roll puede declararla.

**La foto la dejas lista tú con este comando**, apenas escribiste el manifiesto y antes de validarlo (6.1), si sabes dónde está: la ruta que te dio el usuario, o la imagen que pegó en el chat (la lees en su ruta local). La ruta va tal cual, aunque sea `.webp` o `.heic` o tenga espacios en el nombre (entre comillas), con el slug del anuncio:

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug-del-anuncio]
```

El comando copia la foto a la carpeta del anuncio, la convierte si hace falta, y deja el nombre correcto escrito en el manifiesto; usa el nombre que imprima. Si no sabes dónde está, termina el paquete igual (el flujo no se detiene por esto) y, en el resumen del Paso final, pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando; lo corres tú apenas la tengas. Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. **Ningún comando va en el mensaje del Paso final.**

## Paso final — Pregunta cómo quiere producirlo

Ya armaste el paquete completo (guion, prompts de cada toma y B-roll) y el
manifiesto quedó guardado y validado (si la foto del producto todavía no está preparada, solo queda el aviso esperable de que falta `producto.jpg`: ver 6.1). **Ahora, y solo ahora, escríbele al
usuario**, y en el chat va solo esto: un resumen corto y las tres opciones (sin
ningún comando: la foto la dejas lista tú, 6.6). El paquete no
se muestra aquí, y el manifiesto no se muestra nunca.

**El resumen** son 1 a 3 líneas: el estilo, el producto, el mercado y el
idioma, cuántas tomas y cuántos B-roll entran al montaje, y la duración
aproximada. Si hay una decisión que conviene que sepa, va en UNA línea más
(por ejemplo: "agregué 'Pagas al recibirlo' en el cierre por el pago contra
entrega"). Puedes decir en media línea que el manifiesto quedó guardado y
validado; si la foto todavía no está preparada porque no sabes dónde está, dilo
así ("validado; solo falta tu foto del producto: pásamela arrastrándola al chat
o dime la ruta"), no "validado" sin más.

No lo decidas tú: las tres salidas son legítimas y cuestan cosas distintas.

```markdown
Listo: anuncio de objeto parlante estilo Pixar para [producto], [mercado] en
[idioma] — [N] tomas y [N] B-roll, unos [N] segundos.
[Si hace falta: una línea con la decisión que conviene que sepa.]
[Si no sabes dónde está la foto del producto: "El manifiesto quedó validado;
solo falta tu foto del producto: pásamela (arrástrala al chat o dime la ruta)."]

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero las imágenes y los videos en Google Flow,
armo el montaje y te entrego el MP4 terminado. Antes de gastar nada te digo lo
que cuesta: los créditos de Flow de los videos (las imágenes no gastan
créditos) y la música, que se paga en kie.ai.

**B) Genera solo las imágenes y los videos** — los genero en Google Flow y te
los dejo en su carpeta, listos para que los montes tú en CapCut a tu gusto.
También te digo antes los créditos de Flow de los videos.

**C) Entrégame el paquete de prompts** — te paso aquí el anuncio completo: los
personajes, el guion línea por línea con sus diálogos, los prompts de imagen y
video de cada toma, los B-roll y las notas de texto en pantalla, para que lo
revises o lo produzcas a mano. Después, si quieres, seguimos con A o B.
```

### En esta versión, las imágenes y los videos se hacen en Google Flow

`npm run imagenes` y `npm run videos` ya no generan ni cobran nada: arman una
lista de trabajo (la "cola") y **los generas tú en Google Flow**, manejando
Chrome con la extensión Claude in Chrome. Esa extensión es el MCP conectado, y
elegir A o B es el pedido explícito que exigen la Regla 9 y las reglas del
final para que generes imágenes y video tú mismo.

Donde el proceso (el de `COMO-PRODUCIR.md` en la opción A, o la lista de la
opción B) dice `npm run imagenes` o `npm run videos` —con `--solo-plan`, `--si`
o el costo de kie.ai—, va este ciclo, en ese mismo lugar del orden. Todo lo
demás (validar, música, transiciones, revisión de clips, plan, ensamblar)
sigue igual:

1. `npm run imagenes -- temp/[slug]` arma la cola
   (`temp/[slug]/flow/cola-imagenes.json`) y hace solo lo que no necesita Flow
   (las copias de frames; en este estilo casi no hay, porque ninguna toma
   hereda frames).
2. Genera la cola en Google Flow con la skill **`flow-generacion`**: ahí está
   todo el procedimiento (ventana aparte, subir las referencias, enviar todo,
   reintentos, descargar cada archivo con su nombre). Las paradas propias de
   Flow que pide esa skill (el permiso de descarga de cada tanda, y el inicio
   de sesión o los captchas, que hace el usuario) van siempre.
3. `npm run flow:recibir -- temp/[slug]` mueve lo descargado a `img/` o
   `video/` del anuncio, lo convierte y lo verifica.
4. Repite 1 a 3 hasta que la cola diga que no queda nada. Hay trabajos que
   esperan a otros y recién salen en la vuelta siguiente: las tomas y los
   B-roll esperan la hoja de cada personaje que declaran (también la del
   producto que habla, que sale de su foto), y el frame final de una toma
   Tipo B espera su frame inicial.
5. Lo mismo con `npm run videos -- temp/[slug]`. **Antes de mandar los videos
   a Flow**, dile al usuario cuántos clips son y la estimación de créditos que
   imprime el comando, y espera su ok. Las imágenes cuestan 0 créditos en Flow
   y no necesitan ok.

Los clips hablados salen de Omni 1.1 Flash, el mismo modelo con el que se
midieron las reglas de este estilo: valen igual en Flow las duraciones que
acepta el modelo (4/6/8/10 s; en este estilo una toma no pasa de 8 s), el tope
de 17 palabras por toma y el idioma dentro del prompt.

La música (Suno, `npm run musica`) **sigue por kie.ai**: en esta versión es lo
único que se cobra en kie.ai. La transcripción de los clips hablados sigue por
ElevenLabs.
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
`COMO-PRODUCIR.md`. Son **obligatorias** en este estilo, el pipeline **no avisa
si faltan**, y un anuncio sin ellas se renderiza perfecto y sale plano. Es el
fallo más fácil de cometer de todo el proceso.

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
   todo el montaje.

Para regenerar una toma en esta versión —un clip que no pasó la revisión, o lo
que el usuario pida después del informe— usa `npm run rehacer`, el mismo
comando que imprime la revisión para un clip que no salió limpio. Nunca repite
el prompt que falló:

1. `npm run rehacer -- temp/[slug] --toma N --contexto` muestra lo que no se
   toca (línea, duración, tipo) y los prompts actuales. Escribe una escena
   distinta para la misma intención en un `nuevos.json` con
   `prompt_imagen_inicial`, `prompt_imagen_final` (solo si la toma es B) y
   `prompt_video`.
2. `npm run rehacer -- temp/[slug] --toma N --aplicar nuevos.json` los pone en
   el manifiesto (los anteriores quedan en `prompts-anteriores.json`) y borra
   solo `toma-N-inicial.png`, `toma-N-final.png` y `toma-N.mp4`. Las hojas de
   los personajes y el B-roll no se tocan.
3. Corre lo que imprime, en ese orden, cada uno con el ciclo de Flow de arriba:
   `npm run imagenes -- temp/[slug] --tomas N` (en una toma B son dos vueltas:
   el frame final espera al inicial nuevo) y después
   `npm run videos -- temp/[slug] --tomas N --sin-broll`, con la parada de
   créditos de ese único clip. Sin `--sin-broll`, `--tomas N` también pide el
   B-roll que va encima de esa toma. Después, la revisión del clip, `plan` y
   `ensamblar`.

Ninguno de esos comandos lleva `--rehacer`, ni al armar la cola ni en
`flow:recibir`: lo viejo ya no está en la carpeta. Corre `flow:recibir` con
lo nuevo ya descargado: si no lo encuentra en Descargas, lo marca "falta" (la
imagen vieja quedó en `flow/descargas/recibidos/` y no se vuelve a usar). Y no
uses `npm run imagenes -- temp/[slug] --tomas N --rehacer`: con `--tomas N` la cola
también lleva todas las hojas de referencia (la del producto incluida) y el
B-roll de esa toma, `--rehacer` los manda a `historial/` y los vuelve a pedir, y
la toma nueva saldría con personajes distintos a los del resto del anuncio. Si
algún comando que arma la cola llega a llevar `--rehacer`, es solo en su primera
corrida: repetido en la vuelta siguiente, archiva lo que acaba de llegar de
Flow y lo pide otra vez (en videos, se paga otra vez).

Al final, entrégale los MP4 **y el informe** que pide `COMO-PRODUCIR.md`: qué
salió bien, qué salió mal toma por toma, qué regenerarías y cuántos créditos de
Flow costaría (rehacer una imagen no gasta), y lo gastado de verdad: los
créditos de Flow de los videos y la música en kie.ai. Ahí él decide si quiere
ajustar algo.

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
npm run imagenes  -- temp/[slug]        arma la cola: Flow + flow:recibir, en vueltas
npm run audio     -- temp/[slug]        solo si el modo es voz_en_off
npm run videos    -- temp/[slug]        arma la cola: ok de créditos, Flow + flow:recibir, en vueltas
npm run plan:humano -- temp/[slug]
```

Las imágenes y los videos van con el ciclo de Google Flow de arriba, con la
misma parada de créditos antes de los videos.

El último deja `plan-montaje.txt` en la carpeta del anuncio: dice qué toma va
con qué línea, en qué segundo, qué B-roll le toca y dónde está el mp3 de la
voz. **Está escrito para que lo lea una persona**, y es lo que necesita para
montarlo en CapCut sin adivinar nada.

Dile dónde quedó todo y qué contiene ese archivo.

### Si elige C — el paquete en el chat

Entrégale el paquete **completo, nunca una muestra**, con la estructura del
Paso 5 (puntos 1 a 8) y sin el manifiesto: el ángulo, el Character Bible de
cada personaje que habla, la tabla de guion, los prompts de cada toma en
bloques de código separados, los B-roll 1 a 1, las notas de texto en pantalla,
el guion completo de diálogos y las herramientas.

- **Los prompts se copian del manifiesto, carácter por carácter**: es la fuente
  de verdad, no los reescribas de memoria. Los B-roll de las tomas de menos de
  5s no están en el manifiesto (3.8): escríbelos en ese momento con las reglas
  del 3.8, sin agregarlos al manifiesto, para que el bloque quede 1 a 1.
- **Si pide cambios**, cámbialos en el manifiesto y vuelve a validarlo
  (`npm run validar -- temp/[slug]/manifiesto.json`) antes de mostrarle lo
  nuevo. Si la foto del producto todavía no está preparada, el error de que
  falta `producto.jpg` es esperable y no es del cambio (6.1).
- **Al final, ofrécele seguir con A o B**, o dejarlo ahí si solo quería los
  prompts.

**Y si en cualquier momento pide ver el paquete o una parte** ("muéstrame el
guion", "pásame los prompts de la toma 3"), muéstrale esa parte, copiada del
manifiesto igual que en C. El manifiesto en sí no se muestra nunca.

---
## Reglas que nunca se rompen
- Nunca conviertas al objeto en una persona disfrazada — debe seguir siendo reconocible como el objeto que es.
- Nunca uses voz en off ni narrador externo — todos los personajes se hablan a sí mismos, con boca visible.
- Nunca un video prompt sin la línea hablada en formato de dos puntos y comillas, y sin el idioma declarado adentro.
- Nunca identifiques al hablante por posición ("the character on the left") cuando hay dos personajes en cuadro — siempre por su DESCRIPTOR físico.
- Nunca una línea de más de 17 palabras ni una toma de más de 8 segundos — se parte en dos tomas.
- Nunca `palabras ÷ 2.4` para calcular duración: en este estilo es `÷ 2.0`.
- Nunca `frame_inicial: "heredado"` en este estilo — cada toma se genera desde su propia imagen.
- Nunca `despues_de_toma` en el manifiesto — el B-roll va `encima_de_toma`.
- Nunca parámetros de herramienta (`--ar`, `--v`) dentro de los prompts.
- Nunca texto en pantalla, títulos ni watermarks dentro de los prompts de imagen o video.
- Nunca frame final "a mitad de movimiento" en tomas Tipo B — siempre estado ya aterrizado.
- Nunca combines el prompt de imagen y el prompt de video en un solo bloque de código — siempre separados, tanto en tomas principales como en B-roll.
- Nunca generes contenido que infrinja copyright de personajes/marcas reales — puedes imitar el estilo visual, nunca reproducir personajes protegidos.
- Nunca generes el video/imagen tú mismo salvo que el usuario tenga un MCP conectado para eso y lo pida explícitamente. En esta versión eso es el Paso final: si elige A o B, generas en Google Flow la cola que arma el motor.
