---
name: anuncios-continuidad
description: Aplica el efecto Continuidad a un anuncio animado con narrador en voz en off. Cada video va de la imagen de una toma a la imagen de la siguiente (frame inicial y frame final encadenados) y la IA hace el paso entre las dos escenas de forma fluida, sin cortes ni deslizamientos de editor, de principio a fin del anuncio. Usar SIEMPRE que el usuario pida un anuncio "con continuidad", "sin cortes", "que pase de una escena a otra de forma fluida" o "con frame inicial y final encadenados". Se usa junto con el estilo que el usuario eligió, que escribe el guion, los prompts y el manifiesto como siempre. Esta skill toma la producción desde el manifiesto, saca el B-roll, mira las imágenes ya generadas de cada par de tomas, escribe el prompt de video de cada paso y deja el anuncio listo para producir y montar sin cortes. No aplica a anuncios donde alguien habla a cámara, se canta o el producto habla.
---

# Continuidad — tomas encadenadas sin cortes

Convierte un anuncio animado con narrador en voz en off en una cadena sin cortes: cada video empieza en la imagen de una toma y termina en la imagen de la siguiente, y la IA del video hace el paso de una escena a la otra. Las escenas pueden ser del mismo lugar o de lugares distintos; lo que se ve es que el anuncio fluye de una a otra sin saltos. Interactúa siempre en español con el usuario, sin importar el idioma del anuncio.

## Qué cambia y qué no

- **El guion y las imágenes no cambian.** Los hace el estilo del anuncio, como siempre: su paquete completo, su manifiesto, una imagen por toma, y dos (inicial y final) en las tomas que ya las tenían.
- **Cambian los videos.** En vez de un video por toma que arranca en su imagen, cada video va de la imagen de una toma a la de la siguiente:
  - video 1: de la toma 1 a la toma 2 (`video/paso-1.mp4`);
  - video 2: de la toma 2 a la toma 3 (`video/paso-2.mp4`);
  - y así hasta la última toma, que cierra con su propio video (`video/toma-N.mp4`).
- **Sin B-roll.** Un B-roll metido entre dos tomas corta la cadena. El motor lo guarda aparte y no lo produce.
- **Sin transiciones ni efectos de editor** (deslizar, zoom de editor, woosh): el paso lo hace la IA dentro de cada video. `transiciones.json` se ignora.
- **El montaje no corta ningún video**, ni al principio ni al final: solo cambia la velocidad para que cada video empiece con su frase y llegue a la imagen siguiente cuando empieza la frase siguiente.
- **Lo demás sigue como en el estilo**: la voz, la música, los subtítulos y los niveles.

## Cuándo no aplica

En anuncios donde una persona habla a cámara, donde se canta o donde el producto habla en primera persona: ahí la voz vive dentro de cada video y encadenarlos la rompe. El motor lo sabe: `npm run continuidad -- temp/[slug] --preparar` responde "No se puede" en los estilos y los modos de audio que no lo admiten, o con menos de 2 tomas. En ese caso, díselo al usuario en una frase y sigue con el anuncio normal. Si `--preparar` se detiene por otra cosa (un `broll` o un bloque `continuidad` mal escrito), arregla el manifiesto como dice el mensaje y vuelve a correrlo.

## Cómo se usa junto con el estilo

El usuario pide el anuncio en un estilo "con continuidad". **Primero el estilo hace su trabajo completo**, sin cambios: guion, prompts, B-roll y manifiesto, y su resumen corto con la pregunta de cómo seguir (A, todo; B, solo imágenes y videos; o C, el paquete de prompts en el chat, que no produce nada). **Si elige C**, ese paquete es el del estilo (un video por toma, con B-roll y cortes): los prompts de video de cada paso no vienen ahí, porque se escriben recién mirando las imágenes ya generadas (Paso 4). Al entregarlo, avísale en una línea que, producido a mano, sale con cortes, y que el anuncio sin cortes es con A o B. **Cuando elige A o B (de entrada, o después de C), esta skill toma la producción desde el manifiesto, en este orden, que reemplaza el proceso de producción del estilo**: no escribas `transiciones.json` ni produzcas B-roll aunque el estilo los marque como obligatorios; la voz, la música, los subtítulos y los niveles siguen sus reglas. Las únicas paradas son el costo antes de cada gasto y la elección de la voz.

**En esta versión las imágenes y los videos se generan en Google Flow, no en kie.ai.** `npm run imagenes` y `npm run videos` no generan ni cobran nada: arman la lista de trabajo (`flow/cola-imagenes.json` o `flow/cola-videos.json`). El ciclo de Flow, igual para los dos:

1. `npm run imagenes -- temp/[slug]` (o `npm run videos -- temp/[slug]`) arma la cola y hace solo lo que no necesita Flow (las copias de frames).
2. Genera la cola en Google Flow con la skill **flow-generacion** (manejas Chrome con la extensión Claude in Chrome; esa skill explica todo el procedimiento: ventana aparte, subir las referencias, enviar todo, los reintentos y descargar cada archivo con el nombre que dice la cola).
3. `npm run flow:recibir -- temp/[slug]` mueve los archivos descargados a `img/` o `video/`, los convierte y los verifica.
4. Repite 1 a 3 hasta que el comando diga que no queda nada que generar: hay trabajos que esperan a que exista otro archivo.

Las imágenes cuestan 0 créditos en Flow y no esperan el sí. Los videos sí cuestan créditos de Flow: **antes de mandarlos a Flow, dile al usuario cuántos clips son y los créditos que estima `npm run videos`, y espera su ok.** Para rehacer algo, el `--rehacer` va en `npm run imagenes` o `npm run videos` y **una sola vez**, al armar la cola: ahí el archivo viejo pasa a `historial/` (como con `npm run rehacer`). Las vueltas siguientes y la comprobación del final van **sin** `--rehacer`: con él, el comando vuelve a mandar a `historial/` lo que acaba de llegar y lo pide otra vez. `flow:recibir` solo lleva `--rehacer` si el archivo viejo sigue en `img/` o `video/`.

**Lo único que se cobra en kie.ai es la música**, y se corre dos veces: primero con `--solo-plan`, que muestra el costo sin gastar; después del sí del usuario, el mismo comando con `--si`. Sin `--si` se queda esperando una confirmación en la terminal y no genera nada. Si kie.ai no está conectado, `npm run musica` lo explica y hay que preguntarle al usuario: conectarlo o seguir sin música (lo que ese mensaje dice de las transiciones no va con continuidad: aquí no se escriben). Cuando la música va a Suno, `npm run musica -- temp/[slug] --solo-plan` dice si está conectado ("kie.ai: conectado" o "NO conectado"): nunca se abre el `.env` para saberlo. En zack-d-films y skeleton la pista fija se copia a mano de `recursos/musica/`, antes de `npm run musica` (Paso 7), y no necesita kie.ai.

### Paso 1 — Preparar el manifiesto (antes de las imágenes)

```
npm run continuidad -- temp/[slug] --preparar
npm run validar     -- temp/[slug]/manifiesto.json
```

`--preparar` mueve el B-roll del estilo a `continuidad.broll_descartado`, deja `broll: []` y agrega el bloque `continuidad`. Avísale al usuario en una línea que el B-roll del paquete no se produce y que no habrá transiciones de editor.

### Paso 2 — Imágenes y voz

```
npm run imagenes     -- temp/[slug]              (arma flow/cola-imagenes.json)
  -> genera la cola en Google Flow (skill flow-generacion)
npm run flow:recibir -- temp/[slug]
  (repite los tres hasta que npm run imagenes diga que no queda nada)
npm run voces                                    (que el usuario elija la voz; va al .env)
npm run audio    -- temp/[slug]
```

Revisa las imágenes antes de seguir: los pasos se escriben mirándolas, y una imagen que se rehace después obliga a reescribir los dos pasos que la tocan.

### Paso 3 — Duraciones de la cadena

```
npm run continuidad -- temp/[slug] --duraciones
```

Lee los tiempos reales de la voz y escribe en el manifiesto, para cada paso, la duración que se pide; en las tomas con inicial y final, si su clip de siempre más el paso pasarían de 2,5x en su frase, escribe `duracion_propio` con un largo más corto (casi siempre 4 s; mismo prompt y mismas imágenes, el motor solo cambia el número de su cabecera); y fija el clip de cierre. Se puede correr de nuevo sin romper nada: conserva los prompts ya escritos.

### Paso 4 — Mirar cada par y escribir el prompt de cada paso

```
npm run continuidad -- temp/[slug] --pares
```

Lista, paso por paso, las dos imágenes del par (la de salida y la de llegada), las líneas de voz, la cabecera del prompt de video de cada toma y la duración que se pide. **Abre las dos imágenes de cada par y míralas** antes de escribir: el prompt se escribe viendo de dónde sale y a dónde llega. Lee también el prompt de video completo de las dos tomas en `tomas[].prompt_video` del manifiesto: `--pares` muestra solo la cabecera, y las líneas fijas del look salen de ahí.

En el manifiesto, por cada paso:
- escribe solo `prompt_video` y `forma` de `continuidad.pasos[]`; no toques `de`, `a`, `ventana`, `duracion` ni `duracion_propio` (los escribe `--duraciones`), ni nada de `tomas[]`;
- el `[N]` de la cabecera es la `duracion` de ese paso;
- el prompt va en una sola cadena JSON, con `\n` entre líneas y las comillas dobles escapadas;
- `forma` es uno de estos valores exactos: `entrar`, `salir`, `recorrer`, `transformar`, `entorno` (cambiar el entorno) o `rodear`.

Al terminar, `--pares` tiene que decir "Prompts escritos: X de X".

Si después se rehace una imagen (`npm run rehacer`; la imagen nueva se pide con `npm run imagenes -- temp/[slug] --tomas N` y sigue el ciclo de Flow), los dos pasos que la tocan quedan marcados con `"revisar": true` y sus videos van a `historial/`: míralos otra vez con `--pares`, corrige el prompt mirando la imagen nueva y borra `revisar`. Mientras esa marca esté, los videos no arrancan.

### Paso 5 — Antes de pagar los videos

```
npm run plan     -- temp/[slug] --prediccion     (velocidades previstas, no escribe nada)
npm run validar  -- temp/[slug]/manifiesto.json
npm run videos   -- temp/[slug]                  (arma flow/cola-videos.json; dice los clips y los créditos)
  -> dile al usuario cuántos clips y los créditos que estima; espera su ok
  -> genera la cola en Google Flow (skill flow-generacion)
npm run flow:recibir -- temp/[slug]
  (repite hasta que npm run videos diga que no queda nada)
```

Si la predicción muestra un video por encima de 2,5x y su duración no está en el mínimo (4 s), bájala al tramo anterior (4, 6, 8 o 10): la de un paso, en `continuidad.pasos[].duracion` y en el ", Ns." de su cabecera, los dos iguales; la del propio de una toma con inicial y final, en `duracion_propio`. Nunca toques `tomas[].duracion`. Si ya está en 4 s no hay nada que bajar: se paga así y la velocidad va en el informe como decisión del montaje.

### Paso 6 — Revisar la cadena

```
npm run voces:revisar -- temp/[slug]
npm run frames        -- temp/[slug]
npm run frames        -- temp/[slug] --uniones
```

- `npm run frames` deja en `qa/` una tira de 5 cuadros de cada video: ahí se ve el medio del paso (un barrido lateral, un fundido o doble imagen, líneas de luz, texto inventado, el personaje o la etiqueta que cambian).
- `--uniones` deja en `qa/uniones/`, por cada unión, el último cuadro del video, la imagen a la que tenía que llegar y el primer cuadro del siguiente: ahí se ve si arranca y si llega.
- Los videos que salieron del modelo de respaldo se miran con más cuidado.

Un paso que salió mal se corrige reescribiendo su prompt (casi siempre falló la primera frase, o el recorrido no era físico) y se rehace solo ese, con los créditos antes:

```
npm run videos       -- temp/[slug] --pasos K --rehacer    (una sola vez: el clip viejo va a historial/ y ese paso entra en la cola)
  -> dile al usuario los créditos que estima; espera su ok
  -> genera la cola en Google Flow (skill flow-generacion)
npm run flow:recibir -- temp/[slug]                        (sin --rehacer: el clip viejo ya está en historial/)
npm run videos       -- temp/[slug] --pasos K              (para comprobar, sin --rehacer: dice que no queda nada)
```

No vuelvas a correr `--pasos K --rehacer` después de `flow:recibir`: manda a `historial/` el clip que acaba de llegar y lo pone otra vez en la cola, y se pagaría de nuevo.

Si el que salió mal es `video/toma-K.mp4` (el propio de una toma con inicial y final, o el cierre), corrige `tomas[]` de esa toma (`prompt_video`), mueve ese archivo a `historial/` y corre `npm run videos -- temp/[slug] --tomas K`: como los pasos vecinos ya están, solo ese entra en la cola. Con el ok del usuario a los créditos, sigue el ciclo de Flow (`flow:recibir` sin `--rehacer`: el archivo ya no está). No uses `--tomas K --rehacer`: rehace también los dos pasos vecinos.

### Paso 7 — Montaje y entrega

```
npm run musica     -- temp/[slug] --solo-plan    (el costo de Suno y si kie.ai está conectado; en estilo lego, que copia su pista fija, sin costo; en zack-d-films y skeleton, antes copia su pista: ver abajo)
npm run musica     -- temp/[slug] --si
npm run plan       -- temp/[slug]
npm run subtitulos -- temp/[slug]
npm run plan       -- temp/[slug]
npm run ensamblar  -- temp/[slug]
```

La música es la del estilo base. Solo en estilo lego el motor copia la pista fija por su cuenta (`--solo-plan` dice que la copiaría y `--si` la copia, sin costo y sin kie.ai). zack-d-films y skeleton también tienen pista fija, pero se copia **a mano, antes de `npm run musica`**: `recursos/musica/zack-d-films.mp3` (o `recursos/musica/esqueleto.mp3` en skeleton) a `temp/[slug]/musica/fondo.mp3`. Con ella en su lugar, `npm run musica` dice que ya hay una pista y no genera nada. Si no se copia: sin kie.ai conectado, el comando solo indica copiarla (lo que dice de las transiciones no va con continuidad); con kie.ai conectado, `--si` la genera con Suno y cobra.

El plan imprime cada video con su velocidad y dónde llega respecto de su frase. **Las velocidades altas y las llegadas movidas (hasta 0,3 s antes o 0,4 s después) son decisiones del montaje, no defectos**: van en el informe aparte.

Si el usuario eligió **solo imágenes y videos**: los pasos 1 a 6 van igual (la voz hace falta para las duraciones), y el 7 se reduce a la música y a `npm run plan:humano -- temp/[slug]`, que le dice en qué segundo entra cada video y a qué velocidad, sin cortar ninguno. No corras plan, subtitulos ni ensamblar. Dile dónde quedó `plan-montaje.txt`.

Al final, entrégale los MP4 y el informe: qué salió bien, qué paso salió mal y por qué, qué rehiciste o reharías y cuánto costaría, y el costo real (los créditos de Flow de los videos y lo que cobró kie.ai por la música).

## Las 6 formas de pasar de una imagen a la otra

Mira las dos imágenes del par y elige la forma que las une con un movimiento que tenga sentido físico. Si encajan dos, elige la que se cuenta con un solo movimiento de cámara.

| Forma | Cuándo encaja | Cómo se cuenta |
|---|---|---|
| **Entrar** | La imagen de llegada está "adentro" de la de salida: el interior del cuerpo, de un objeto, de una caja, de una pantalla | La cámara se acerca a un detalle de la imagen de salida (un moretón en la piel, una caja, una pantalla) y entra. Si se abre un hueco, el hueco tiene grosor y por él ya se ve el interior antes de cruzarlo |
| **Salir** | La imagen de salida está "adentro" de la de llegada | La cámara se aleja y lo que llenaba el cuadro se achica hasta volverse una parte de la imagen de llegada (el vaso por dentro se vuelve uno de los vasos finos de la pierna) |
| **Recorrer** | El mismo personaje o el mismo espacio, en otro lugar o en otro momento | El personaje hace algo (se levanta, camina, se da vuelta, guarda el celular) y la cámara lo sigue hasta el nuevo lugar; o la cámara sube, baja o avanza por el espacio con profundidad |
| **Transformar** | Dos cosas con forma, color o posición parecidas | Una se convierte en la otra en el mismo lugar, con un verbo físico: se hunde, se escurre, se pliega, se desarma, se infla (el nervio se hunde en la manta y se vuelve la planta del pie) |
| **Cambiar el entorno** | El sujeto es el mismo y cambia dónde está | El sujeto queda nítido y en su lugar, y el fondo desenfocado se convierte en el lugar nuevo |
| **Rodear** | El mismo sujeto desde otro ángulo, o con cosas nuevas alrededor | La cámara gira alrededor o sube hasta mirarlo desde arriba, y lo nuevo entra durante el giro |

## Cómo se escribe el prompt de cada paso

Es corto: pocas palabras, en orden, que digan qué pasa para ir de una imagen a la otra. Así:

```
[Cabecera del look], image-to-video from the START frame to the END frame, [N]s. Vertical 9:16.
It starts exactly on the START frame: [la imagen de salida tal como es: quién o qué, dónde, encuadre, luz].
[La acción de la línea Motion de la toma de salida, más chica, en una frase.] [El recorrido físico hasta la llegada, en una o dos frases.]
It slows down and comes to rest on the END frame: [la imagen de llegada tal como es].
[Las líneas fijas del look, copiadas tal cual.]
One continuous shot, no cuts or wipes. No glowing lines, light streaks or magic effects. No captions, subtitles or added text on screen; [the product label / the text on the screen] stays as it is.
```

`[N]` es la duración que se pide para ese paso. Si el paso sale del frame final de una toma con inicial y final, la frase de la acción se omite: esa acción ya pasó en su propio clip.

**Las reglas, y por qué cada una:**

1. **La primera frase parte de la imagen de salida tal como es**: la describe, o nombra algo que está en ella y desde donde arranca el movimiento. Nunca pongas la cámara en otro lugar al empezar. Medido en una prueba real: un prompt que decía "la cámara sale del interior del vaso" sobre una imagen que mostraba el vaso desde afuera hizo que el video arrancara en otra imagen, pegado adentro del vaso, dos veces seguidas, y el paso no empalmó con el clip anterior. Con la primera frase describiendo el vaso visto desde afuera, arrancó exacto.
2. **El paso es algo físico y concreto.** Qué hace el personaje, qué hace la cámara, qué se mueve, qué queda fijo, qué pasa por delante del lente. "Se levanta, camina hasta el escritorio y se sienta" funciona; una idea abstracta no.
3. **La última frase describe la imagen de llegada y la cámara se detiene ahí.** El cambio va en el medio del clip: al principio la imagen de salida viva unos instantes, después el recorrido, al final se asienta. Nunca todo el cambio en el último segundo.
4. **Para describir el paso, nunca escribas** transition, transición, cut to, next scene, fade, dissolve, morph, slide, swipe ni wipe. Cuando el prompt no le da a la IA un camino físico entre las dos imágenes, las une deslizando el cuadro hacia el costado o saltando de golpe, y eso es justo lo que este efecto evita. Hay dos excepciones, y se copian tal cual: la línea de cierre "One continuous shot, no cuts or wipes." (va siempre: con ella se hicieron las pruebas que salieron bien) y las líneas fijas del look, aunque nombren una de estas palabras para negarla (una línea de rigidez que dice "never bend, melt or morph").
5. **Nada de palabras que inviten a la magia** ("se funden", "se derrite", "se disuelve en luz"; en inglés melts into, blends into, dissolves into light). Medido: con "los videos se funden en la laptop y el sofá se derrite en el escritorio" apareció una línea de luz azul que recorrió el cuadro; con "los videos vuelven al celular, se levanta y camina hasta el escritorio" no apareció nada. Por eso la línea "No glowing lines, light streaks or magic effects" va siempre.
6. **Texto.** Nada impreso encima de la imagen (subtítulos, rótulos, títulos). La etiqueta del producto y el texto que es parte de la escena (una pantalla, un calendario) se quedan tal cual: nómbralos en la última línea para que no salgan en blanco.
7. **El look se copia, no se inventa.**
   - **La cabecera** es la primera línea del prompt de video de la toma de salida, cambiando "from the shot above" por "from the START frame to the END frame" y la duración por la del paso. Si el look cambia entre las dos tomas (de un mundo de juguete al interior del cuerpo, por ejemplo), la cabecera va neutra ("Image-to-video from the START frame to the END frame, [N]s. Vertical 9:16.") y cada look se nombra en su frase.
   - **Las líneas fijas** son todas las del prompt de video de la toma menos la cabecera, Camera y Motion. Lighting sí es fija. Si el prompt es de un solo párrafo, lo mismo frase por frase.
   - **Las que están iguales en las dos tomas van siempre, tal cual.** Una que trae solo una de las dos va también si ese sujeto se mueve durante el paso (una de rigidez, si las minifiguras caminan).
8. **El personaje y el producto se nombran con las mismas palabras** que en los prompts de las tomas, para que no cambien de cara, de ropa ni de etiqueta en el camino.

**Ejemplos con la forma de los que se probaron** (el centro de cada uno es el que arrancó y llegó a su imagen en las pruebas):

Recorrer, entre dos escenas de la vida del personaje:
```
Pixar-Disney style 3D animation, image-to-video from the START frame to the END frame, 6s. Vertical 9:16.
It starts exactly on the START frame: Mateo sitting on the mustard-yellow sofa in the warm evening living room, smiling at his phone, with four floating video screens around him. The floating screens shrink and fly into his phone one by one and disappear. Mateo stands up, walks a few steps to a wooden desk by the window, sits down in front of an open laptop and rests his chin on his hand, thinking. The camera follows him in one smooth continuous move while the sky outside the window turns from evening to night. It slows down and comes to rest on the END frame.
Lighting: warm cinematic glow
One continuous shot, no cuts or wipes. No glowing lines, light streaks or magic effects. No captions, subtitles or added text on screen; the text on the laptop screen stays as it is.
```

Salir, del interior del cuerpo a la lámina de las piernas:
```
Medical 3D animation, image-to-video from the START frame to the END frame, 6s. Vertical 9:16.
It starts exactly on the START frame: the whole lymph vessel and its round node seen from outside on a dark red background, with clear lymph and golden particles flowing through it. The camera slowly pulls back: the vessel and its node get smaller and smaller until they become one of the thin lymph vessels inside a translucent human leg, the dark red background turns deep navy blue, and the camera keeps pulling back until both legs, from the hips to the feet, are in frame, with the pale green fluid around the ankles. It slows down and comes to rest on the END frame.
Lighting: soft volumetric glow
One continuous shot, no cuts or wipes. No glowing lines, light streaks or magic effects. No captions, subtitles or added text on screen.
```

Entrar, de un mundo de juguete al interior del cuerpo (cabecera neutra porque el look cambia):
```
Image-to-video from the START frame to the END frame, 6s. Vertical 9:16.
The camera pushes slowly into the crate of red root pieces on the toy workshop counter. The root pieces break into tiny golden particles that rush forward, and the camera follows them, diving into a pink lymph vessel; the toy workshop falls away behind as the vessel and its swollen node fill the frame with thick murky lymph. It slows down and comes to rest on the END frame.
One continuous shot, no cuts or wipes. No glowing lines, light streaks or magic effects. No captions, subtitles or added text on screen.
```

Estos ejemplos enseñan la forma de escribir, no el contenido: cada paso se escribe mirando sus dos imágenes.

## Las tomas que ya tienen frame inicial y frame final

Si una toma ya viene con su par inicial → final (una transformación, una metáfora que cambia, el mecanismo), **su clip se queda como está, con el prompt que ya tiene**. Lo único que puede cambiar es su largo (ver Duración). La cadena entra por su frame inicial y sale por su frame final:

- el paso anterior llega a su **frame inicial**;
- su propio clip va de su frame inicial a su frame final, como siempre;
- el paso siguiente sale de su **frame final**.

## La última toma

No tiene una imagen siguiente a la que llegar: su clip es el de siempre, el que parte de su imagen (o su par inicial → final, si lo tiene). Ahí termina la cadena, y su clip cubre su frase hasta el final del audio.

## Duración de cada clip

- **Un paso** se pide con la primera duración del generador que cubra la frase de la toma de salida (en Gemini Omni Flash: 4, 6, 8 o 10 s): una frase de 3,3 s pide 4; una de 4,6 pide 6.
- **En una toma con inicial y final**, su propio clip y el paso comparten la frase: el paso se pide de 4 s. Si su clip de siempre más el paso pasan de 2,5 veces su frase (un clip de 6 s en una frase de menos de 4 s), su clip se pide más corto, casi siempre de 4 s: mismo prompt y mismas imágenes, solo cambia el número de la cabecera.
- **La última toma** se pide con la primera duración que cubra su frase hasta el final del audio.

Después, al montar, cada clip se acelera o se frena hasta caber en su frase: **nunca se corta**.

## Los defectos de este efecto

Son defectos de verdad, se rehacen con el prompt corregido:

- el video no arranca en su imagen de salida (casi siempre, la primera frase ponía la cámara en otro lugar);
- el video no llega a su imagen de llegada;
- el cuadro se desliza hacia el costado, salta de golpe o hace un fundido o doble imagen en vez de un recorrido;
- aparecen líneas de luz, destellos o efectos que nadie pidió;
- aparece texto encima de la imagen, o la etiqueta del producto sale en blanco o cambiada;
- el personaje cambia de cara, de ropa o de peinado en el camino.

Además de los defectos propios del estilo del anuncio.

## Reglas que nunca se rompen

- Cada video sale de la imagen de una toma y llega a la imagen de la siguiente; la primera frase del prompt parte de la imagen de salida y la última termina en la de llegada.
- El paso es un movimiento físico; para describirlo, nunca transition, transición, cut to, next scene, fade, dissolve, morph, slide, swipe ni wipe, y nunca palabras de magia. Solo se copian tal cual la línea de cierre y las líneas fijas del look.
- Las tomas que ya tienen inicial y final conservan su video; la cadena entra por su inicial y sale por su final.
- Sin B-roll, sin transiciones de editor, y ningún video se corta: solo cambia la velocidad.
- Nada de texto impreso encima; la etiqueta del producto y el texto de la escena se quedan.
- Los prompts se escriben mirando las imágenes ya generadas, nunca a ciegas.
- Las imágenes y los videos se generan en Google Flow con el ciclo de esta versión (cola, skill flow-generacion, `flow:recibir`). Antes de mandar videos a Flow se le dicen al usuario los clips y los créditos que estima `npm run videos`, y se espera el sí. La música (kie.ai) se muestra con `--solo-plan`, se espera el sí, y recién entonces se corre con `--si`.
