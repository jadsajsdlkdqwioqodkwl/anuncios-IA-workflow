---
name: anuncios-entrevista
description: Genera anuncios estilo entrevista callejera con IA (un entrevistador fuera de cámara para a una persona en la calle, le hace preguntas incómodas y el producto entra recién cuando ya se confesó) para marcas DTC/Ecommerce, servicios y productos digitales en Estados Unidos y Latinoamérica. Dos variantes, gancho callejero y entrevista completa. Arma el guion por clips, los prompts de la persona, la calle y la mano con el micrófono, una imagen por clip, los prompts de video, los iconos, los B-roll y el manifiesto interno; en el chat da un resumen corto y tres opciones (producirlo todo, solo imágenes y videos, o el paquete de prompts). Usar SIEMPRE que el usuario pida un anuncio, guion o creativo estilo "entrevista", "entrevista callejera", "street interview", "man on the street", "preguntas en la calle", "gancho callejero", o pida convertir un guion de otro estilo a formato entrevista, o mencione crear anuncios con IA sin especificar estilo (ofrecer este como opción).
---

# Generador de Anuncios IA — Estilo Entrevista Callejera

Convierte un producto, servicio u oferta en un **anuncio estilo entrevista callejera**: alguien va por la vereda, un entrevistador lo para, le hace una pregunta que preferiría no contestar, y de esa confesión sale el producto. Se ve como un clip viral de entrevistas de calle, no como un anuncio — y por eso funciona. Arma el guion por clips, los prompts de los personajes, una imagen por clip, los prompts de video, los iconos, los B-roll y el manifiesto de producción. **Con ese manifiesto, el motor de este sistema produce el anuncio**: arma la lista de lo que hay que generar (la hoja de la persona, la calle y la mano con el micrófono, la imagen de cada clip, cada clip hablado en Omni 1.1 Flash con sus ingredientes, los iconos y los B-roll), que Claude genera en Google Flow manejando el navegador; después recibe los archivos, revisa cada clip (lo que se ve y cada palabra que se dice) y arma el montaje (el congelado con un golpe de glitch, los iconos con su check (A) o con un clic (B), la cadena de B-roll o los fundidos, el producto al centro cuando se nombra (B), el llamado a la acción con su flecha y los subtítulos). Nada se genera antes de que el usuario elija cómo seguir, y los videos no se mandan a Flow sin su ok a los créditos (Paso final).

**Idioma**: interactúa, pregunta y escribe SIEMPRE en español neutro (LatAm), salvo que el usuario pida otro idioma para el anuncio final. **Todos los prompts van en español, en frases simples**, como se le explicaría a una persona. Los diálogos van textuales en el idioma del anuncio.

**Lo que esta skill arma**: el guion, los prompts de los personajes (la persona entrevistada, la calle, la mano con el micrófono), una imagen por clip, los prompts de video, los iconos, los B-roll (imagen + video) y el manifiesto. **El producto no se genera**: el usuario ya tiene su foto en fondo blanco y el motor la adjunta donde toca (la imagen y el video de los clips donde se ve, los B-roll donde se nombra y, en B, el centro de la pantalla cuando se nombra). En un producto digital o un servicio, la captura de la app o la imagen que lo represente cumple el mismo papel.

---

## Por qué funciona el formato

La persuasión la carga **la confesión**, no el producto. Cuando alguien en cámara admite que no subió un anuncio nuevo en tres meses, o que no comió una verdura en toda la semana, el espectador lo admite también — y esa concesión ocurre **antes** de que empiece cualquier venta. Todo lo que viene después hereda esa credibilidad. Por eso el producto no puede aparecer temprano, y la persona entrevistada nunca puede sonar como si le pagaran.

Dos cosas matan el formato: que la persona se lea como actor, o que los clips se lean como tomas separadas. Casi todo lo que sigue existe para evitar una de las dos.

---

## Reglas obligatorias — léelas antes de generar cualquier cosa

1. **Hay 2 pausas obligatorias**: el briefing (Paso 1) y la elección de variante (Paso 2). Después de la segunda, armas **todo de un tiro**: los bloques del paquete y el manifiesto, que se guarda en su archivo. En el chat va solo un resumen corto y la pregunta del Paso final: el paquete no se muestra salvo que elija la opción C o lo pida, y el manifiesto nunca. Sin pausas intermedias, sin "¿continúo?".
2. **No inventes nada que el briefing no haya dicho.** Ciudad, género, edad, quién es la persona, idioma, llamado a la acción: todo se pregunta. Si falta algo, se pregunta en el briefing, no se asume.
3. **Copy desde cero en cada anuncio.** Nunca reutilices frases, cifras, ángulos ni ideas de otros anuncios, aunque sean del mismo producto, ni los ejemplos de esta skill. De un anuncio anterior solo puedes tomar qué es el producto. Tampoco preguntes lo que esta skill ya resuelve.
4. **El producto no aparece antes de su momento.** Nada en la entrevista lo menciona hasta el beat de entrega (variante B) o hasta que la persona lo descubre en su historia (variante A).
5. **La marca la dice el entrevistador, nunca la persona entrevistada** (en B). En A, la persona la nombra dos veces: cuando la descubre en su historia y en el cierre. Esta regla sola hace la mayor parte del trabajo de no sonar guionado.
6. **Un intercambio completo por clip.** Cada clip cierra una idea: una pregunta con su respuesta, o una respuesta con su remate. Nada queda colgado para el clip siguiente.
7. **La duración de cada clip se mide** (sección "Producción") y se redondea hacia arriba a **4, 6, 8 o 10 segundos**, lo único que acepta el generador de clips hablados. El techo es **10 s**: lo que no entra se parte en un corte de idea completa. La duración va en la etiqueta encima del bloque y en el manifiesto, no dentro del prompt.
8. **Cada bloque de prompt va COMPLETO**, en su propio bloque de código. Nunca "[misma estructura que arriba]". Cuando el usuario lo ve (opción C, o la parte que pida), lee exactamente lo que el motor va a mandar.
9. **Los personajes se generan una sola vez y van adjuntos a cada imagen de clip**: la persona entrevistada (hoja de personaje en fondo blanco), la calle vacía, y la mano del entrevistador con el micrófono (fondo blanco; solo en B). Con eso adjunto, el modelo no inventa. El entrevistador no se genera: de él solo entra el brazo con el micrófono, y el otro brazo únicamente para entregar el producto. Su cara y su cuerpo nunca entran en cuadro, y su otra mano no aparece antes de la entrega.
10. **Una imagen por clip, y el video se genera con ingredientes.** La imagen del clip, que se genera con los personajes adjuntos, es la **imagen 1** del video, y el prompt pide usarla como frame inicial. En B van además la mano con el micrófono (**imagen 2**) y, en los clips donde sale, la foto del producto (**imagen 3**). En A, solo la imagen 1. Lo que el clip tiene que mostrar al empezar (la persona, la calle, el brazo con el mic, el producto si ya está) va en la imagen del clip; los ingredientes le recuerdan al video cómo son la mano y el producto para que no los cambie. La imagen describe cómo está la persona al empezar ese clip, que es aproximadamente cómo terminó el anterior. El prompt de video de cada clip termina con una línea "Termina:" y la imagen del clip siguiente empieza con esa misma línea.
11. **Los prompts de video son en español, simples y completos**, con lo que debe pasar y con una lista de **lo que NO debe pasar**. Sin timestamps, sin coordenadas de pantalla ("entra por la esquina inferior izquierda"), sin micro-coreografía ("gira la tapa tres veces"), sin vocabulario de cine, sin cola de calidad ("4K, Ultra HD").
12. **Toda voz sale de un clip de video generado**, incluido el cierre del entrevistador fuera de cámara: ese cierre es un clip más, con la persona en pantalla sin hablar. Nunca se entrega como "genera esta voz en TTS". En la variante A, los clips de la historia también se generan con la persona hablando: de ahí sale su voz, aunque en el montaje el video de esos clips no se vea. Esa voz el motor la deja sin los silencios de adentro y a 1,2x (paso `voz`): es la única voz que se acelera, porque su video no se ve.
13. **Las descripciones de voz de cada persona se copian idénticas** en todos sus clips, y el ambiente mantiene la misma densidad en todos.
14. **Continuidad física, sin magia.** Nada aparece, desaparece, se duplica ni cambia de mano sin la acción que lo explica. **El producto se entrega listo, tal como viene**: cerrado, con su tapa o en su caja, o el celular con la pantalla ya encendida. Nadie lo abre, lo destapa, lo desenvuelve ni lo guarda en cámara. Si hay que probarlo, el entrevistador da una unidad ya lista (en la palma de la mano, en una cucharita, una muestra) y el envase sigue cerrado. Quien lo recibe lo sostiene a la vista hasta el final: no lo guarda en el bolso ni lo deja en ningún lado, y su bolso o mochila sigue donde estaba. El producto solo entra con su foto real: adjunta a la imagen del clip y como imagen 3 del video.
15. **Nunca texto en pantalla dentro de los prompts** (subtítulos, letreros, el llamado a la acción): eso lo pone el motor en el montaje. El único texto visible es el impreso en la etiqueta del producto. Los B-roll y los iconos tampoco llevan texto, y ningún fondo lleva objetos que invitan a texto inventado (lomos de libros, teclados, pantallas con texto, revistas, carteles).
16. **Los B-roll son mudos y nadie habla en ellos.** Su audio no se usa: debajo suena la voz de la persona (A) o nada más que el ambiente del clip anterior (cierre).
17. **Cada palabra se dice una vez, tal como está en el diálogo.** El generador de clips hablados a veces repite, cambia o agrega palabras. Por eso todos los prompts de video llevan sus líneas de NO contra eso ("Nadie repite palabras ni agrega palabras que no están en el diálogo", cada pregunta una sola vez, la última frase una sola vez), y en la revisión cualquier palabra repetida, trabada, cambiada o agregada obliga a regenerar ese clip. Hay una sola excepción, y la decide el motor, no tú: una palabra de una sola letra dicha dos veces, muy rápido y sin pausa, que el motor marca "tolerada" y que siempre se le informa al usuario (Paso final, la revisión de cada clip).
18. **La duración no es un defecto.** Nunca rellenes ni recortes un guion para llegar a un número.
19. **Si llega un guion ya escrito, lee el Paso 0 antes que nada.**

---

## Paso 0 — Si el guion ya viene escrito (atajo)

Solo se activa cuando el usuario pega un guion. Si no llega ninguno, empieza por el Paso 1.

**Si es un guion de entrevista ya hecho**: no lo reescribas ni lo "mejores". Tu trabajo es producirlo: identifica la variante que ya tiene, pártelo en clips por intercambio, mide duraciones, y arma todos los bloques (personajes, imagen de cada clip, prompts de video, iconos, B-roll, plan de montaje, manifiesto). El briefing se reduce a lo que el guion no dice (persona, ciudad, idioma, llamado a la acción, foto del producto).

**Si es un guion ganador escrito para otro formato** (una persona hablando a cámara, una narración, un testimonio, dos personas conversando): el mensaje, el orden de las ideas, la prueba que usa y las palabras clave se respetan. Lo que cambia es la forma: marca cada frase con su función (problema, lo que ya probó, producto, beneficio, prueba, objeción, cierre) y repártela en la estructura de la variante que el usuario elija en el Paso 2. Lo que era afirmación ("sé que piensas que es caro") se vuelve pregunta del entrevistador y respuesta de la persona. El cierre se reemplaza por el de la variante. Deja una nota corta al inicio del Guion mostrando un par de líneas del original y cómo quedaron, para que el usuario vea qué cambió (se ve cuando se entrega el paquete; al terminar, la línea de la decisión del resumen del Paso final lo dice en corto).

En los dos casos, el Paso 2 (variante) se mantiene: el usuario elige cómo se va a ver.

---

## Paso 1 — Briefing obligatorio (primera pausa)

Cuando el usuario pida un anuncio estilo entrevista, NO lo escribas todavía. Pregunta exactamente esto, en un solo mensaje, como texto abierto, solo lo que no te haya dicho ya:

1. **¿Para qué producto o servicio es el anuncio?** (Qué es, si es físico, digital o servicio, y qué problema resuelve. Si tiene foto, que la suba: el motor la adjunta donde toca. En un digital o un servicio, una captura de la app o una imagen que lo represente. Y si el nombre de la marca se puede leer de dos maneras, cómo se pronuncia.)
2. **¿Quién lo compra y cómo describe el problema con sus propias palabras?** (Edad, género, situación. Si tiene frases reales de clientes o comentarios, que las pegue: el guion se construye con ese vocabulario.)
3. **¿Qué ya probaron y abandonaron antes, o qué los frena de comprar?** (El polvo que sabe a pasto y quedó en la alacena, el editor que cobra por video, "ya probé de todo"…)
4. **¿Qué dato real puede usarse como prueba?** (Algo concreto y verdadero: cuántas unidades trae, cuánto dura, cuánto tardó alguien en ver resultado, cuántas personas lo usan. Uno solo.)
5. **¿A quién paran en la calle, y en qué ciudad?** (Género, edad aproximada y quién es: "hombre, 27, dueño de ecommerce de suplementos" · "mujer, 35, mamá que corre con los niños". La ciudad donde ocurre. Del entrevistador solo hace falta el color de piel de sus brazos, que es lo único que se ve de él, y por qué lado quiere que entre su brazo con el micrófono: por defecto, el izquierdo.)
6. **¿Qué llamado a la acción quieres al final?** (Un texto corto que el motor pone en pantalla sobre el cierre, con una flecha hacia abajo; por ejemplo "Haz tu pedido en el botón de abajo" o "Escríbenos por WhatsApp". Es lo que de verdad hace el cliente para comprar.) Y si el anuncio va en otro idioma que no sea español, que lo diga aquí.

**Si sube una foto, reconócela tú**: di qué ves ("Veo que es un tubo de crema con tapa azul; corrígeme si me equivoco") y no preguntes lo obvio. Fíjate cómo viene (cerrado con su tapa, en su caja, en su sobre): así se entrega y así aparece en todo el anuncio. Si la foto trae precio, botones o interfaz de una tienda, o marca de agua, avísale: el generador recrea lo que ve, y lo mejor es una foto del envase solo, de frente, con la etiqueta legible.

Espera la respuesta antes de seguir.

---

## Paso 2 — Elegir la variante (segunda pausa)

Con el briefing en mano, presenta las dos variantes así, en este orden, y termina con tu recomendación:

```markdown
Hay dos formas de hacer este anuncio. Te explico cómo se ve cada una y cuál te recomiendo para [producto].

**A · Gancho callejero**
Cómo se ve: la persona ya está parada frente al entrevistador. Él le dispara tres preguntas rápidas de opción ("¿tinto o blanco?" "¿seco o dulce?" "¿roble o tánico?"); con cada pregunta aparecen dos iconos, uno a cada lado de ella, y cuando elige, el suyo recibe un check con sonido justo en la palabra que dice. En la tercera se traba. La imagen se congela en su cara con un golpe de glitch. Desde ahí, solo se oye su voz, ágil y sin pausas, contando su historia — el problema, cómo descubrió el producto, qué le pasó — mientras se ve una cadena de B-roll: personas reales, animación médica si lo que cuenta lo pide, el producto. Cierra ella, y al final el producto con tu llamado a la acción.
Cuándo encaja: productos de resultado lento (suplementos, cuidado personal, peso), digitales, servicios — donde probarlo en la calle no muestra nada, pero la historia sí.

**B · Entrevista completa**
Cómo se ve: el entrevistador para a la persona en la calle: "Disculpa, pregunta rápida…". Toda la conversación es el anuncio: ella confiesa algo (que no hace lo que debería), cuenta qué ya probó y abandonó (cada cosa que nombra aparece como icono en el centro, sobre su pecho, con un clic), el entrevistador le entrega el producto cerrado, tal como viene (o se lo muestra en el celular), ella lo mira desconfiada — si es algo que se prueba, él le da antes una unidad ya lista y ella la prueba ahí —, y da su veredicto. Los clips van en fila con un fundido corto entre uno y otro. Cierra el entrevistador en voz en off con la marca, mientras ella sigue con el producto en las manos, y en ese momento la foto del producto aparece en el centro con el mismo clic; después, el producto solo con tu llamado a la acción y una flecha.
Cuándo encaja: productos de reacción inmediata (sabor, olor, textura, algo que se siente al instante). También digitales y servicios, mostrándolos en el celular.

**Mi recomendación para [producto]: [A/B], porque [una o dos líneas].**

¿Con cuál vamos?
```

Reglas para recomendar:
- ¿Se puede probar en la calle y reaccionar al instante? → **B**, prueba en vivo: el entrevistador le da una unidad ya lista para probar y el envase cerrado.
- ¿Es físico pero de resultado lento? → **A**, o **B** con "ya lo uso" (el entrevistador se lo entrega cerrado y la persona dice que ya lo usa).
- ¿Es digital o servicio? → **A**, o **B** mostrándolo en el celular (una demo, un resultado, la app).

Espera la elección. Con la variante elegida, arma todo de un tiro y sigue al Paso final.

---

## Las dos variantes — estructura del guion

### Variante A · Gancho callejero

La entrevista es solo el arranque. Dura 6–10 segundos y su función es **demostrar el problema sin decirlo**: el entrevistador le hace **preguntas de opción — "¿esto o aquello?"** — sobre la categoría del producto, la persona elige una cada vez, y llega una en la que **no sabe elegir**. Ese punto donde no sabe ES el dolor que el producto resuelve.

| Parte | Quién | Qué pasa |
|---|---|---|
| **1. Tres preguntas de opción** | Entrevistador → persona | Siempre "¿A o B?", nunca de sí/no. Pregunta 1: elige rápido. Pregunta 2: elige dudando. Pregunta 3: una opción que no sabe qué es, o que la expone — silencio, cara de "no sé". *Vino: "¿Tinto o blanco?" "Blanco, siempre." "¿Seco o dulce?" "Seco… creo." "¿Roble o tánico?" (silencio).* *Almohada: "¿Boca arriba o de costado?" "De costado, toda la vida." "¿Almohada alta o baja?" "Eh… alta." "¿Cervical o viscoelástica?" (silencio).* *Curso de anuncios: "¿Imagen o video?" "Video, claro." "¿Vertical o horizontal?" "Vertical, supongo." "¿Lo cambias cada semana o cada mes?" (silencio).* Las opciones salen del vocabulario de la categoría — lo que un experto distingue y un comprador normal no. **La respuesta dice la opción con la misma palabra de la pregunta** ("¿Alta o baja?" → "Eh… alta."), y esa palabra no puede ser una palabra vacía ("uno", "una", "la", "de", "con"…): el check cae en ella. **Y nunca es solo esa palabra**: lleva una muletilla o una palabra más ("Eh… alta.", "Video, claro."), porque el motor compara palabras sin puntuación ni mayúsculas, y un "Video." a secas es lo mismo que el "video" de la pregunta. Con cada pregunta aparecen sus dos iconos, uno a cada lado de la persona; al elegir, el elegido recibe el check (bloque "Iconos del gancho"). |
| **2. Congelado** | motor | La imagen se congela en su cara con un golpe de glitch (un acercamiento corto, una sacudida, los colores que se separan y el negativo en dos golpes, con un sonido de glitch). Es la costura entre la entrevista y la historia. Lo hace el motor en el montaje: se declara en el manifiesto después de qué clip va. |
| **3. La historia, en su voz** | persona, primera persona, solo su voz | Problema vivido ("cada vez que… no tengo idea") → lo que hacía por defecto ("agarro lo más barato y espero") → lo que quería ("solo quería algo que…") → **descubrimiento por alguien cercano** ("una amiga me pasó…") → el producto, nombrado una vez, con un detalle raro → cómo lo usa → **un dato que solo sabe quien lo compró**. Mientras habla no se la ve: se ve la cadena de B-roll (bloque "B-roll de la historia"). |
| **4. Cierre, en su voz** | persona | Dos líneas en primera persona: se identifica con el espectador y nombra el producto, y dice dónde verlo. *"Si eres como yo, que amas el vino pero elegir uno te parece complicadísimo… [producto] es para ti. Entra a su página y mira las opciones."* Es la única vez que la persona vuelve a nombrar la marca. Después, el B-roll de cierre con el llamado a la acción del briefing. |

El entrevistador **no narra** y **no se ve: ni brazo, ni mano, ni micrófono**. Es solo voz en off, siempre. En esta variante no hay entrega ni nada que mostrar: son las preguntas, el silencio, y después la persona sigue hablando. En esta variante **el entrevistador está frente a ella, junto a la cámara**: ella habla mirándolo a él, de frente, ojos a nivel — **no al lente**, y no a los lados. El encuadre es **de la cintura hacia arriba**, ella centrada. Después del gancho, todo es la voz de la persona: esos clips se generan con ella hablando (al entrevistador que tiene delante, o mirando un momento a otro lado cuando recuerda) — así se obtiene la voz — y en el montaje el motor usa solo ese audio y cubre el video con la cadena de B-roll. El clip arranca ya en plena entrevista. El gancho (las tres preguntas y el silencio) va en un solo clip si entra en 10 s; si no, se parte en dos, y el congelado va después del segundo.

El último clip del gancho termina con la cara de no saber sostenida: el motor deja **0,8 s después de la última palabra del gancho**, para que se vea esa cara antes del congelado. Durante el gancho los subtítulos van **al medio de la pantalla**, y desde el congelado, abajo. La voz de la historia el motor la deja **sin los silencios de adentro y a 1,2x**: como su video no se ve, se acelera sin que se note, y la historia suena ágil.

**Qué cambia respecto a la B en la entrega**: solo se generan los personajes 1 y 2 (no hay mano con micrófono); las imágenes de clip van sin brazo ni micrófono; los videos llevan un solo ingrediente, la imagen del clip; en los prompts de video se quitan las frases del micrófono y el entrevistador es "voz en off" (ver "Variante A — ajustes a las plantillas" más abajo); no hay producto al centro; y se agregan los bloques "Iconos del gancho" y "B-roll de la historia".

### Variante B · Entrevista completa

Todo el anuncio es una sola conversación. La columna son **cinco peldaños**, y cada uno es una pregunta, no un beat de marketing:

| Peldaño | Qué pregunta el entrevistador | Qué logra |
|---|---|---|
| **1. Abordaje + confesión** | "Disculpa, pregunta rápida…" y una pregunta sobre **comportamiento**, nunca sobre productos: *"Sé sincero: ¿hace cuánto no subes un anuncio nuevo de verdad?"* | Una admisión medio vergonzosa que el espectador también tiene que hacerse. |
| **2. Lo que ya probó** | *"¿Alguna vez probaste X?"* / *"¿Y cómo lo haces ahora?"* | Que nombre lo que ya compró y dejó de usar — o el hábito que repite. Es manejo de objeciones disfrazado de curiosidad. Cada cosa que nombra aparece como icono en el centro, con un clic (bloque "Iconos de las menciones"). |
| **3. Entrega** | La otra mano del entrevistador entra con el producto listo, **cerrado tal como viene** (o con el celular con la pantalla ya encendida). *"Toma, a ver qué opinas."* | Primera aparición del producto. La persona lo recibe, lo mira y lee la etiqueta: **tiene que verse desconfiada antes**, el giro solo vale si había de dónde girar. Si es algo que se prueba (se come, se toma, se huele, se pone en la piel), el entrevistador le da primero una **unidad ya lista** (en la palma de su mano, en una cucharita, una muestra), ella la prueba ahí, y el envase le llega cerrado: nadie lo abre en cámara. Si se muestra en pantalla: **primero a la persona, en silencio; después a la cámara.** |
| **4. Veredicto** | *"En serio: ¿lo de antes, o esto?"* | Lo compara con lo del peldaño 2 y elige esto, **sin exagerar**. *"Esto, ni se compara."* El elogio se queda más chico de lo que el producto merece. |
| **5. Remate + cierre** | Un chiste de cierre (*"¿Me lo devuelves?" "Ni loco."* / *"¿Te lo paso?" "Pásamelo ya."*) y luego **el cierre del entrevistador, fuera de cámara**, sobre el plano final: la marca y una frase de lo que es. **Es un clip de video más**: la persona sigue en pantalla, con el producto abrazado contra el pecho o en la mano, sonriendo, con su bolso como siempre; no se va de cuadro ni lo guarda. No habla, y la voz del entrevistador dice la línea. Cuando dice la marca, la foto del producto aparece en el centro con un clic (bloque "El producto al centro"). Después, el B-roll de cierre con el llamado a la acción. | Nadie le habla al espectador. La marca queda dicha y posicionada. |

Ángulos para armar el peldaño 1: **culpa** (lo que sabe que dejó de hacer), **callout** (nombrar lo que la categoría vende y desarmarlo), **costo** (lo que su solución actual le cuesta en plata, tiempo o esfuerzo), **desconfianza** (ya lo quemaron con esa categoría).

El truco de las tres preguntas rápidas de la variante A también sirve como forma de escribir el peldaño 1 cuando el producto lo pide (sin iconos con check: en B los iconos son los de las menciones).

---

## Reglas de escritura del diálogo

- **La persona está atrapada, no actuando.** Contracciones, muletillas ("eh", "o sea", "uff", "capaz"), frases que se cortan y arrancan de nuevo, autoburla. Los fragmentos están bien.
- **Ratio desbalanceado**: preguntas cortas (3–12 palabras), respuestas más largas y sin apuro. Si se invierte, suena a comercial.
- **Sin listas de beneficios, sin registro de marketing.** *Esto sirve: "Espera… okey, ¿esto está bueno de verdad?" Esto mata: "Transformó mi rutina por completo."*
- **Primera persona y pasado** en lo que cuenta la persona ("yo era igual", "lo compré y quedó ahí"). Nunca segunda persona asumiendo algo del espectador.
- **Cada línea del entrevistador es una sola oración.** Nunca una pregunta seguida de un fragmento suelto (*"¿…nuevo?* Nuevo de verdad.") — el modelo le asigna el fragmento a la otra voz.
- **La persona nunca repite las palabras del entrevistador.** El entrevistador no dice nada después de su pregunta hasta que la persona termina.
- **Un solo dato de prueba**, el real que dio el usuario, dicho como detalle sin importancia.
- **Sin precio, sin urgencia, sin descuento** en el diálogo. Eso va en el copy del anuncio.
- **Las frases ancla tienen que ser únicas.** Los iconos, el check, el producto al centro y los B-roll se sincronizan con frases textuales de la línea de su clip; escribe el diálogo de modo que cada frase que vayas a usar como ancla aparezca una sola vez en ese clip (si la respuesta repite la palabra de la pregunta, el ancla de la respuesta lleva la muletilla o una palabra más: "Uff, pesadas"). El motor compara palabras: la puntuación, las tildes y las mayúsculas no cuentan, así que "Pesadas." y el "pesadas" de la pregunta son la misma frase.
- **En el gancho de A, la respuesta dice la opción con la misma palabra de la pregunta, y algo más** ("¿Alta o baja?" → "Eh… alta."; "¿Imagen o video?" → "Video, claro."): el check cae justo en esa palabra, no al empezar la respuesta. Una respuesta que la dice con otra palabra ("la primera", "esa") deja el check donde no va, y una que es solo esa palabra ("Video.") no se distingue de la pregunta.
- **Sin palabras de relleno que no estén escritas.** Si la persona dice una muletilla, va escrita en la línea ("Eh…"); lo que no está escrito no se dice. Una respuesta de una sola palabra va sola, sin "ahm" ni "eh" alrededor, salvo que estén en la línea.

---

## Producción — cómo se parten y miden los clips

### Un intercambio por clip

Cada clip es una idea completa: una pregunta con su respuesta, o una respuesta con su remate. Cuando la persona de la variante A narra su historia, sus líneas se agrupan en bloques que también cierran una idea (el problema; el descubrimiento; el uso y la prueba; el cierre).

### La duración se mide, no se fija

```
Duración = palabras ÷ 2,6          (habla en el caso lento, para que nunca corte)
         + 0,8s por cada cambio de voz
         + tiempo de acción         (1s: algo entra en cuadro o alguien se acomoda · 1,5s: una reacción sostenida, mirar algo en silencio, recibir el producto y leer la etiqueta, o la cara de no saber al final del gancho)
         + 0,5s de cierre
→ redondear hacia arriba al segundo entero
→ subir al siguiente de 4, 6, 8 o 10 (lo único que acepta el generador: 5 → 6, 7 → 8, 9 → 10)
→ si pasa de 10, partir en un corte de idea completa
```

Si en el caso rápido sobra aire, el motor lo recorta con los tiempos de cada palabra (la transcripción de la revisión): deja **0,12 s antes de la primera palabra y 0,25 s después de la última palabra del guion** (el último clip del gancho de A deja 0,8 s, para la cara de no saber). Cuenta la última palabra del guion, no la última que se oye: una repetición o una muletilla que el modelo agregue después del guion queda fuera. Para eso la transcripción tiene que ser del clip que está en `video/` (el motor lo comprueba por el tamaño del archivo): si falta o es de un clip anterior, el motor recorta como puede y avisa que corras `npm run lineas -- temp/[slug] --tomas N`. Si falta tiempo, el modelo corta palabras — y eso no se arregla.

**Presupuesto de palabras por clip** (sale de la fórmula):

| Clip | Dos voces (pregunta + respuesta) | Una voz (la historia de la variante A) |
|---|---|---|
| **10 s** | 12 a 21 | hasta 25 |
| **8 s** | 10 a 17 | hasta 20 |
| **6 s** | 7 a 13 | hasta 15 |
| **4 s** | 5 a 8 | hasta 10 |

Menos del mínimo desperdicia el clip; más del máximo corta. Un clip puede llevar pocas palabras a propósito cuando el momento es una reacción (la cara cambiando al oír algo). Ese aire es del guion, no desperdicio.

### Qué se ve del entrevistador

En variante B, solo su brazo. En variante A, nada: solo su voz en off. Una mano con el **micrófono inalámbrico de solapa** (el transmisor cuadrado negro con su cortavientos peludo, entre el pulgar y el índice, a la altura de la boca de la persona), que entra por un lado del cuadro. La otra mano, solo cuando entrega o muestra el producto: antes de la entrega no aparece, y después de entregar sale de cuadro. **Nunca su cara ni su cuerpo**: al entregar, solo entra su brazo por el borde. Las dos cosas se escriben en la lista de NO de cada clip, porque el modelo tiende a mostrar la otra mano gesticulando o la cara de perfil al entregar. La persona **mira al entrevistador, que está al lado de la cámara, no al lente** — y lo hace como una persona real: gesticula, se ríe, mira a otro lado un momento cuando piensa; su atención vuelve al entrevistador.

### Continuidad: personajes adjuntos + una imagen por clip

```
PERSONAJES — se generan una sola vez
  1. La persona entrevistada   → hoja de personaje: cuerpo entero, 3 vistas, fondo blanco
  2. La calle                  → la locación, vacía, sin gente
  3. La mano con el micrófono  → antebrazo y mano del entrevistador con el mic, fondo blanco (solo B)
  (El producto ya lo tiene el usuario en fondo blanco. El entrevistador no se genera.)

IMAGEN DEL CLIP 1  → la persona ya parada, en plena entrevista, con el brazo y el mic del
                     entrevistador en cuadro · adjunta: persona + calle + mano con micrófono
IMAGEN DEL CLIP N  → cómo está la persona al empezar el clip N (≈ cómo terminó el N-1),
                     siempre con el brazo y el mic en cuadro
                     · adjunta: persona + calle + mano con micrófono (+ producto si ya está en cuadro)

VIDEO DEL CLIP N   → se genera con INGREDIENTES, en este orden:
                       imagen 1 = la imagen del clip N (el prompt la usa como frame inicial)
                       imagen 2 = la mano con el micrófono (solo B)
                       imagen 3 = tu foto del producto (solo en los clips donde sale)
                     + el prompt de video, que nombra cada imagen por su número
```

- **Los personajes van adjuntos a cada imagen de clip.** Con la persona, la calle y el micrófono adjuntos, el modelo no tiene que inventar ninguno de los tres. Es lo que garantiza que se vean igual en todos los clips.
- **Todas las imágenes de clip llevan el brazo del entrevistador con el micrófono en cuadro** (por eso se adjunta también la mano con el mic al generarlas). Así el video arranca sabiendo desde el primer cuadro cómo es la persona, la calle, el mic y el brazo: no inventa nada. Del entrevistador nunca se ve más que ese brazo.
- **El producto va dos veces: en la imagen del clip donde se ve y como imagen 3 del video.** Si no está en el primer cuadro, el generador lo hace entrar distinto; si no va como ingrediente, puede cambiarle la etiqueta. En el clip de la entrega (B, peldaño 3), la imagen ya muestra la otra mano del entrevistador entrando por el mismo lado con el producto (cerrado, tal como viene), todavía sin que la persona lo tome; en los clips siguientes, el producto está donde lo dejó la línea "Termina:" del anterior. Esas imágenes llevan la foto del producto adjunta, y sus videos la llevan como imagen 3.
- **La continuidad se escribe dos veces.** Cada prompt de video termina con una línea `Termina:` que dice cómo queda la persona (postura, manos, qué sostiene, expresión). La imagen del clip siguiente **empieza con esa misma línea**. No va a ser idéntica al último cuadro del clip anterior (no se usa frame final), pero se le parece lo suficiente para que el corte se sienta fluido; en B, además, el motor pone un fundido corto en cada corte.
- **La cámara no se mueve en ningún clip.** El clip 1 ya arranca con la persona parada en plena entrevista (no viene caminando), de los muslos hacia arriba, y así se queda todo el anuncio.
- **Un solo lado para todo el anuncio.** El brazo con el micrófono entra por el lado que el usuario eligió en el briefing (por defecto, el izquierdo), la persona mira hacia ese lado, y cuando el entrevistador entrega el producto lo hace con **la otra mano**, entrando por ese mismo lado. Los iconos no dependen de ese lado: en A van en pareja, uno a cada lado de la persona; en B, de a uno, en el centro sobre su pecho. Ese lado se escribe igual en el personaje 3, en todas las imágenes de clip, en todos los prompts de video y en el manifiesto (`lado_mic`).
- **Continuidad física, sin magia.** El entrevistador entrega el producto listo, cerrado tal como viene ("le entrega [el producto] cerrado"); nadie lo abre ni lo destapa en cámara, y quien lo recibe no lo guarda ni lo deja: lo sigue sosteniendo, y en el cierre lo abraza o lo tiene en la mano, con su bolso o mochila como siempre. Se dice quién sostiene qué y con qué mano, y qué no debe duplicarse ("solo hay un [producto]").
- Si un clip sale con otra cara, otra ropa u otra calle: la imagen del clip salió mal (revísala en `img/`) o el video se alejó de ella. Se rehace con prompts corregidos (Paso final).

### Cómo se escriben los prompts

En español, en frases simples, como se le explicaría a una persona. **Lo que sí funciona**: decir quién hace qué con qué, en orden; decir el estado de cada objeto (cerrado tal como viene, en qué mano); decir cómo termina. **Lo que empeora el resultado**: coordenadas de pantalla ("entra por la esquina inferior izquierda"), micro-coreografía ("gira la tapa tres veces", "sujeta con tres dedos"), maniobras con el producto (abrirlo, destaparlo, guardarlo), adjetivos de cámara, palabras de cine ("cinematic", "bokeh"), colas de calidad ("4K, Ultra HD"), palabras como *overcast, dull, flat* para la luz, y objetos que invitan a texto inventado en los fondos (lomos de libros, teclados, pantallas con texto): el modelo les escribe títulos que no existen.

**Usa palabras neutras** para los objetos, que se entienden igual en cualquier país: "mesa", "encimera", "superficie"; nada de regionalismos que el modelo pueda leer como otra cosa.

**La marca se pronuncia bien.** Si el nombre de la marca, la tienda o la app se puede leer mal (es inventado, mezcla idiomas, junta dos palabras), en la línea de cómo lo dice se aclara cómo se pronuncia (`Dice la marca como "[cómo suena]", con el acento en "[sílaba]".`), **sin cambiar la línea del diálogo**: la línea queda escrita como es, porque contra ella se alinean los subtítulos y la revisión.

Y **siempre una lista de "Lo que NO debe pasar"** al final de cada prompt de video, adaptada a ese clip: sin ella el modelo llena los huecos con lo que se le ocurre.

---

## Formato de entrega

Con la variante elegida, armas **todo de un tiro** el paquete, con estos bloques, en este orden y con estos nombres (nunca "Sección A/B"):

- **Variante A**: Ficha del anuncio · Guion · Personajes · Imagen de cada clip · Prompts de video · Iconos del gancho · B-roll de la historia · B-roll de cierre · Plan de montaje.
- **Variante B**: Ficha del anuncio · Guion · Personajes · Imagen de cada clip · Prompts de video · Iconos de las menciones · El producto al centro · B-roll de cierre · Plan de montaje.

Y con eso, el manifiesto de producción (Sección G), que se escribe en su archivo. **El paquete no se muestra en el chat al terminar**: queda interno, en el manifiesto, y en el chat van solo el resumen corto y la pregunta del Paso final. Este formato es el que se usa cuando el paquete sí se entrega (opción C, o si pide verlo o ver una parte), siempre sin el manifiesto, que nunca se muestra. El "Chequeo final" es un repaso que haces en silencio antes de responder. Cuando el paquete se entrega, va completo: nunca una muestra, nunca "¿quieres que te dé el resto?".

### Ficha del anuncio

Tabla: Producto · Variante elegida (y por qué en una línea) · Público · Dolor · Ángulo · Lo que ya probó / hábito muerto · Prueba concreta · Cierre · Llamado a la acción (el texto que irá en pantalla) · Persona entrevistada · Entrevistador (solo brazos: color de piel) · Ciudad · Lado por donde entra el brazo del entrevistador · Cómo se pronuncia la marca (si se puede leer mal) · Duración total aproximada y número de clips · Palabras totales · Generaciones totales (personajes + imágenes de clip + clips + iconos + B-roll, cada B-roll con su imagen y su video).

### Guion

El guion en orden, con una etiqueta por clip en negrita: **[CLIP 3 · LO QUE YA PROBÓ · 8 s]**, y debajo las líneas con el rol en negrita: **Entrevistador —** "…" / **Ella —** "…". Las notas de montaje van entre líneas como `> 🎬 nota`: en A, los iconos de cada pregunta y con qué palabra (la opción elegida) llega el check, el congelado después del gancho, con qué frase entra cada B-roll; en B, qué icono aparece con qué mención, dónde aparece el producto al centro (con su clic), el fundido entre clips y el B-roll de cierre. En variante A, después del congelado, las líneas de la historia van agrupadas por clip con su etiqueta **[CLIP 4 · LA HISTORIA, parte 1 — solo su voz · 10 s]**.

Si vino de un guion externo (Paso 0), arriba va la nota corta con el antes y el después.

### Personajes

Tres prompts de imagen en variante B (dos en variante A: sin la mano con el micrófono), cada uno en su bloque de código con su etiqueta. Se generan una sola vez, y el motor los adjunta a cada imagen de clip. Al final, una línea: *"Cuando el motor las genere, se revisan las tres antes de seguir: dedos, texto raro, cosas que no van. Todo lo que esté ahí se va a repetir en cada clip."*

**`### 🖼️ PERSONAJE 1 — La persona entrevistada (hoja de personaje)`**

```
Hoja de personaje de [una mujer / un hombre] de [edad], [quién es según el
briefing], de [ciudad]. Cuerpo entero, tres vistas en la misma imagen, una al
lado de la otra: de frente, de tres cuartos y de perfil. Fondo blanco liso.
Misma ropa en las tres vistas: [ropa descrita con su desgaste: "camiseta azul
marino lavada, con el cuello algo estirado, chaqueta oscura, jeans, zapatillas
blancas usadas", bolso o mochila si lleva]. Sin logos ni letras en la ropa.
Cara real: piel con poros, tono desparejo, sin maquillaje, sin retoque, pelo
algo despeinado, expresión tranquila y normal. Proporciones de persona común,
no de modelo. Sin texto en la imagen. Aspect 9:16.
```

**`### 🖼️ PERSONAJE 2 — La calle`**

```
Foto tomada con celular de una vereda en [ciudad], [dos o tres detalles
reconocibles del lugar: tipo de edificios, árboles, un local de esquina, motos
estacionadas]. La vereda está vacía, sin gente. Encuadre vertical, cámara a la
altura del pecho, un poco descentrada, como una foto tomada apurada. Luz de día
natural. Sin texto agregado. Aspect 9:16.
```

**`### 🖼️ PERSONAJE 3 — La mano con el micrófono`** (solo variante B)

```
Antebrazo y mano [izquierda / derecha] de un hombre, piel [color según el
briefing], sin manga, sosteniendo entre el pulgar y el índice un micrófono
inalámbrico apuntando hacia adelante como si fuera a entrevistar a alguien. El
micrófono es tipo transmisor: cuadrado, negro, un poco más grande que una caja
de fósforos, con un cortavientos peludo gris en la parte de arriba y un clip
atrás. El antebrazo y la mano aparecen desde el lado [izquierdo / derecho] de
la imagen. Fondo blanco liso. Solo el antebrazo y la mano con el micrófono,
nada más. Aspect 9:16.
```

Con el entrevistador a la izquierda (lo normal): **mano izquierda entrando por el lado izquierdo de la imagen**. Si el usuario lo quiere a la derecha, se escribe "derecha" y "lado derecho" aquí, en todas las imágenes de clip y en todos los videos: la persona siempre mira hacia ese lado, y el producto se entrega desde ese mismo lado con la otra mano.

Si la mano sale del lado equivocado (izquierda en vez de derecha o al revés): no la regeneres con más palabras — los modelos de imagen confunden izquierda y derecha todo el tiempo. Se voltea horizontalmente (una mano izquierda espejada es una mano derecha exacta): guarda la original en `historial/` y escribe la volteada con el mismo nombre (`ffmpeg -i img/mano-mic.png -vf hflip img/mano-mic-volteada.png`, y después renómbrala a `img/mano-mic.png`).

### Imagen de cada clip

Un prompt de imagen por clip, cada uno con su etiqueta diciendo qué se adjunta (el motor lo hace con los ids del manifiesto). Son cortos: dicen qué imágenes usar, cómo está la persona en ese instante, y el encuadre. Las plantillas de abajo son las de la variante B; para la A se quitan el brazo y el micrófono (ver "Variante A — ajustes a las plantillas").

**`### 🖼️ IMAGEN DEL CLIP 1 · adjunta: hoja de personaje + calle + mano con micrófono`**

```
Usa las imágenes adjuntas: la hoja de personaje es [la mujer / el hombre], la
foto de la calle es el lugar, y la mano con el micrófono es la mano del
entrevistador. [Ella / Él] está parada en esa vereda, de forma natural, en
plena entrevista, [con las manos libres y el bolso cruzado al pecho / lo que
lleve según la hoja de personaje]. La mirada de [ella / él] va hacia el lado
izquierdo de la imagen, donde está el entrevistador, que no se ve; no mira a
la cámara. El brazo del entrevistador con el micrófono entra por el lado
izquierdo de la imagen y queda cerca de [ella / él], a la altura de su boca.
Plano desde los muslos hacia arriba, encuadre vertical. Nadie más en cuadro.
Misma cara, misma ropa, misma calle y mismo micrófono que en las imágenes
adjuntas. Aspect 9:16.
```

**`### 🖼️ IMAGEN DEL CLIP N · adjunta: hoja de personaje + calle + mano con micrófono [+ tu foto del producto]`**

```
Usa las imágenes adjuntas: la hoja de personaje es [la mujer / el hombre], la
foto de la calle es el lugar, y la mano con el micrófono es la mano del
entrevistador. [Si tiene producto: La foto del producto es [producto], con su
etiqueta exactamente igual.]
[Ella / Él] está [la línea "Termina:" del clip anterior, copiada tal cual:
postura, manos, qué sostiene y cómo, expresión]. Está parada de forma natural,
en medio de una conversación. La mirada de [ella / él] va hacia el lado
izquierdo de la imagen, donde está el entrevistador, que no se ve; no mira a
la cámara. El brazo del entrevistador con el micrófono entra por el lado
izquierdo de la imagen y queda cerca de [ella / él], a la altura de su boca.
Plano desde los muslos hacia arriba. Nadie más en cuadro. Misma cara, misma
ropa, misma calle y mismo micrófono que en las imágenes adjuntas. Aspect 9:16.
```

Con el entrevistador a la derecha, "izquierdo" pasa a "derecho" en la mirada y en el brazo, en todas las imágenes de clip.

**La imagen del clip de la entrega** (B, peldaño 3) agrega, antes del encuadre: "La otra mano del entrevistador entra por el mismo lado, un poco más abajo, con [el producto cerrado, tal como viene / el celular con la pantalla ya encendida hacia ella / el producto cerrado y una unidad ya lista en la palma o en una cucharita, si es algo que se prueba], todavía sin que [ella / él] lo tome; [ella / él] lo mira con desconfianza." Esa imagen lleva la foto del producto adjunta. Del entrevistador, en esa imagen, solo entran sus dos antebrazos por el borde: nunca su cara ni su cuerpo.

Todas las imágenes de clip tienen el mismo encuadre (muslos hacia arriba) y el brazo con el mic entrando por el mismo lado. Lo único que cambia entre una y otra es lo que la persona hace, tiene en las manos y expresa — copiado de cómo terminó el clip anterior.

### Prompts de video

Un bloque completo por clip, con etiqueta `### 🎬 CLIP N — [nombre del beat] · Ns · N palabras · ingredientes: imagen del clip N [+ mano con micrófono] [+ tu foto del producto]`. Encima del primer bloque, una sola línea: *el motor genera cada clip a 720p, 9:16, con audio, pidiendo la duración de la etiqueta. Se genera con ingredientes: imagen 1 = la imagen del clip (el prompt la usa como frame inicial); imagen 2 = la mano con el micrófono; imagen 3 = tu foto del producto, en los clips donde sale.* (En A: *se genera con un ingrediente, la imagen del clip, que el prompt usa como frame inicial.*)

**Plantilla de clip con dos voces** (sustituye los corchetes; el género según la persona):

```
Usa la misma imagen de [la mujer / el hombre] en la calle (imagen 1), con sus
mismos accesorios, ropa y el lugar, como frame inicial del video; y la mano
con el micrófono (imagen 2) es la mano del entrevistador. [Si el producto está
en el clip: La foto del producto (imagen 3) es [el producto], con su etiqueta
exactamente igual.]

[Ella / Él] está parada de frente, hablando con el entrevistador, que está al
lado de la cámara y no se ve. La mano con el micrófono está por el lado
izquierdo del video, cerca de [ella / él]; [ella / él] mira hacia ese lado.
[Qué pasa, en frases
simples y en orden: qué hace mientras escucha la pregunta, qué hace mientras
responde, qué entra en cuadro y qué sale, qué hace con las manos.] Todo ocurre
de manera natural.

Mientras el entrevistador habla, el micrófono está retraído hacia el
entrevistador, y cuando va a hablar la persona entrevistada el micrófono está
a la altura de su boca para que hable.

Esto es el diálogo:

Entrevistador: "[pregunta completa]"
[Ella / Él] (persona entrevistada): "[respuesta completa]"

[Cómo lo dice: una frase.] Voz del entrevistador: [género, edad, acento,
intención]. Voz de [ella / él]: [género, edad, acento, intención; habla más
despacio que él]. [Si en el clip se dice la marca y se puede leer mal: Dice la
marca como "[cómo suena]", con el acento en "[sílaba]".] Sonido de calle de
[ciudad]: [tres o cuatro sonidos]. Que se diga cada palabra completa. Pasan
algunas personas caminando por la vereda, todo de forma natural.

Lo que NO debe pasar:
- No aparece ninguna otra persona. [Del entrevistador solo se ve su mano con el micrófono. / En el clip de la entrega: Del entrevistador solo se ven sus brazos: el del micrófono y el que entrega [el producto].]
- [Ella / Él] no mira a la cámara: mira al entrevistador, que está al lado.
- No se corta ninguna palabra del diálogo. [Ella / Él] no repite lo que dice el entrevistador.
- La cámara no se mueve ni cambia de ángulo.
- Nadie repite palabras ni agrega palabras que no están en el diálogo.
- El entrevistador hace cada pregunta una sola vez, de corrido, sin repetirla.
- [Ella / Él] dice su última frase una sola vez, con esas mismas palabras, y no repite nada después.
- [Antes de la entrega: La otra mano del entrevistador no aparece: solo se ve la mano con el micrófono.]
- [En la entrega: La cara y el cuerpo del entrevistador nunca entran en cuadro: al entregar [el producto] solo entra su brazo por el borde.]
- [Después de la entrega: La cara y el cuerpo del entrevistador nunca entran en cuadro.]
- [Si hay producto: El producto no cambia: misma etiqueta que en la imagen. Solo hay un [producto], y sigue cerrado todo el clip: nadie lo abre.]
- [Si hay producto: [Ella / Él] no suelta [el producto]: no se le cae ni lo deja en ningún lado.]
- [Si una respuesta es una sola palabra: [Ella / Él] dice solo esa palabra: no dice "ahm", "eh" ni nada más.]
- [Lo propio de este clip: "no sigue caminando", "no camina ni sale de cuadro", etc.]

Termina: [cómo queda al final: postura, manos, qué sostiene y cómo, expresión].
```

Lo que va **en todos los clips** tal cual: la primera línea de ingredientes (la imagen 1 como frame inicial, con la persona, el lugar y la mano con el mic como imagen 2), "Todo ocurre de manera natural", la línea del micrófono que se retrae cuando habla él y se acerca cuando habla [ella / él], "Esto es el diálogo:", la línea de voces y sonido con "Que se diga cada palabra completa", las siete primeras líneas de la lista de NO, y "Termina:". **En el clip de la entrega**, la primera línea de NO se adapta, porque ahí también entra el brazo que entrega: "No aparece ninguna otra persona. Del entrevistador solo se ven sus brazos: el del micrófono y el que entrega [el producto]." Lo que **cambia según el clip**: la frase de la imagen 3 (solo donde sale el producto), qué pasa, el diálogo, cómo lo dice, las líneas de NO del entrevistador y del producto que le tocan a ese clip, las propias del clip, y cómo termina. En un celular o una app, la línea del producto dice "Solo hay un celular, con la pantalla encendida todo el clip" en vez de "sigue cerrado".

**Ejemplo de la entrega de un producto** (variante B, peldaño 3 — en el estilo que funciona). Producto, persona y copy inventados solo para mostrar la forma: **nunca copies sus frases, su producto ni sus ideas**.

```
Usa la misma imagen de la mujer en la calle (imagen 1), con sus mismos
accesorios, ropa y el lugar, como frame inicial del video; y la mano con el
micrófono (imagen 2) es la mano del entrevistador. La foto del producto
(imagen 3) es la barra de protector solar, con su etiqueta exactamente igual.

Ella está parada de frente, hablando con el entrevistador, que está al lado de
la cámara y no se ve. La mano con el micrófono está por el lado izquierdo del
video, cerca de ella; ella mira hacia ese lado. El entrevistador le entrega la
barra cerrada, con su tapa puesta, con su otra mano, por el mismo lado del
micrófono. Ella la recibe con las dos manos, mira la etiqueta con desconfianza
y la lee de cerca. El brazo que le entregó la barra sale de cuadro. Todo
ocurre de manera natural.

Mientras el entrevistador habla, el micrófono está retraído hacia el
entrevistador, y cuando va a hablar la persona entrevistada el micrófono está
a la altura de su boca para que hable.

Esto es el diálogo:

Entrevistador: "Toma, léelo tú."
Ella (persona entrevistada): "¿Protector en barra? …¿Y esto no me deja la cara blanca?"

Lo dice con desconfianza, alargando la pregunta. Voz del entrevistador: hombre
joven, acento tapatío, curioso y amable. Voz de ella: mujer de 31, acento
tapatío, práctica y algo burlona, habla más despacio que él. Sonido de calle de
Guadalajara: tráfico, pasos, un claxon lejano, pájaros en los árboles. Que se
diga cada palabra completa. Pasan algunas personas caminando por la vereda,
todo de forma natural.

Lo que NO debe pasar:
- No aparece ninguna otra persona. Del entrevistador solo se ven sus brazos: el del micrófono y el que entrega la barra.
- Ella no mira a la cámara: mira al entrevistador, que está al lado.
- No se corta ninguna palabra del diálogo. Ella no repite lo que dice el entrevistador.
- La cámara no se mueve ni cambia de ángulo.
- Nadie repite palabras ni agrega palabras que no están en el diálogo.
- El entrevistador hace cada pregunta una sola vez, de corrido, sin repetirla.
- Ella dice su última frase una sola vez, con esas mismas palabras, y no repite nada después.
- La cara y el cuerpo del entrevistador nunca entran en cuadro: al entregar la barra solo entra su brazo por el borde.
- El producto no cambia: misma etiqueta que en la imagen. Solo hay una barra, y sigue cerrada todo el clip: nadie la abre.
- Ella no suelta la barra: no se le cae ni la deja en ningún lado.

Termina: ella sosteniendo la barra cerrada con las dos manos, con la etiqueta
hacia ella, mirando al entrevistador con una ceja levantada.
```

**Si el producto se prueba en el momento** (algo que se come, se toma, se huele o se pone en la piel), el clip de la entrega cambia así: la imagen muestra la otra mano del entrevistador con [el producto] cerrado y una unidad ya lista (en la palma, en una cucharita, una muestra); en el video, "[Ella / Él] toma [la unidad] y la prueba. Después recibe [el producto] cerrado de esa misma mano, y el brazo sale de cuadro."; y en la lista de NO, "Nadie abre [el producto]: [la unidad] ya viene lista." El envase nunca se abre en cámara, y "Termina:" deja a la persona con [el producto] cerrado en la mano.

**Plantilla del clip de cierre** (variante B: habla solo el entrevistador; la persona está en pantalla sin hablar):

```
Usa la misma imagen de [la mujer / el hombre] en la calle (imagen 1), con sus
mismos accesorios, ropa y el lugar, como frame inicial del video; y la mano
con el micrófono (imagen 2) es la mano del entrevistador. [Si tiene el
producto: La foto del producto (imagen 3) es [el producto], con su etiqueta
exactamente igual.]

[Ella / Él] no habla en este clip. [Qué hace en silencio, en frases simples:
sigue con [el producto] abrazado contra el pecho con las dos manos, con su
[bolso / mochila] al hombro como siempre, y sonríe mientras escucha / sigue
con el celular en la mano, con la pantalla hacia [ella / él], y sonríe.] La
voz del entrevistador se escucha fuera de cámara.

Entrevistador: "[línea de cierre con la marca]"

Voz del entrevistador: [la misma descripción de siempre, idéntica]. [Si la
marca se puede leer mal: Dice la marca como "[cómo suena]", con el acento en
"[sílaba]".] Sonido de calle de [ciudad]: [los mismos sonidos]. Que se diga
cada palabra completa. Pasan algunas personas caminando por la vereda, todo de
forma natural.

Lo que NO debe pasar:
- No aparece ninguna otra persona. Del entrevistador solo se ve su mano con el micrófono.
- [Ella / Él] no habla ni mueve los labios.
- No se corta ninguna palabra.
- La cámara no se mueve ni cambia de ángulo.
- Nadie repite palabras ni agrega palabras que no están en el diálogo.
- El entrevistador dice su línea una sola vez, de corrido, y no repite nada después.
- La cara y el cuerpo del entrevistador nunca entran en cuadro.
- [Si tiene el producto: [Ella / Él] no suelta [el producto], no lo guarda y no se le cae: lo tiene abrazado contra el pecho hasta el final.]
- [Si tiene el producto: No aparece un segundo [producto]. [Ella / Él] no se va de cuadro.]

Termina: [cómo queda: con [el producto] abrazado contra el pecho y el bolso al
hombro, sonriendo, mirando al entrevistador].
```

**Plantilla de clip con una voz** (la historia de la variante A, después del gancho):

```
Usa la misma imagen de [la mujer / el hombre] en la calle (imagen 1), con sus
mismos accesorios, ropa y el lugar, como frame inicial del video.

[Ella / Él] le está contando algo al entrevistador, que está frente a [ella /
él], junto a la cámara, y no se ve. Lo mira de frente mientras habla, a veces
mirando un momento a otro lado mientras recuerda. Dice estas líneas en orden,
con pausas naturales entre ellas, como si el otro reaccionara. Todo ocurre de
manera natural.

[Ella / Él]: "[línea 1]"
[Ella / Él]: "[línea 2]"

[Cómo lo dice: una frase.] Voz de [ella / él]: [la misma descripción que en
el gancho, idéntica]. [Si en el clip dice la marca y se puede leer mal: Dice la
marca como "[cómo suena]", con el acento en "[sílaba]".] Sonido de calle de
[ciudad]: [los mismos sonidos]. Que se diga cada palabra completa. Pasan
algunas personas caminando por la vereda, todo de forma natural.

Lo que NO debe pasar:
- No aparece ninguna otra persona, ninguna mano ni ningún micrófono. Solo [ella / él].
- [Ella / Él] no mira a la cámara ni a los lados: mira al entrevistador que tiene delante y que no se ve.
- No se corta ninguna palabra.
- La cámara no se mueve ni cambia de ángulo.
- Nadie repite palabras ni agrega palabras que no están en el diálogo.
- [Ella / Él] dice su última frase una sola vez, con esas mismas palabras, y no repite nada después.

Termina: [cómo queda, terminando en "mirando al frente"].
```

Los clips de la historia se generan a velocidad normal, con sus pausas naturales: el paso `voz` del motor les quita los silencios de adentro y los pasa a 1,2x después de la revisión. No los escribas apurados ni con menos pausas para compensar.

**Variante A — ajustes a las plantillas.** En la A el entrevistador es solo voz en off: nunca se ve su brazo, su mano ni un micrófono. Por eso:
- **Personajes**: solo la hoja de personaje y la calle. No se entrega el personaje 3.
- **Imagen de cada clip**: se adjuntan hoja de personaje + calle (nunca el producto: en la historia no se la ve, y en el gancho todavía no existe). Se quita la frase del brazo con el micrófono y **cambian la mirada y el encuadre**: "[Ella / Él] mira al frente, al entrevistador que tiene delante y que no se ve; no mira a la cámara ni a los lados. Plano de la cintura hacia arriba, [ella / él] centrada. Sin micrófono, sin entrevistador en cuadro."
- **Las líneas "Termina:" de la variante A** (que la imagen del clip siguiente copia tal cual) dicen siempre **"mirando al frente"**, nunca "mirando al entrevistador". Ejemplo: "Termina: él con los hombros sueltos y una sonrisa tranquila, mirando al frente." Nada de "hacia el lado izquierdo de la imagen": eso es solo de la B.
- **Clip del gancho** (dos voces, las tres preguntas y el silencio): se usa la plantilla de dos voces con la primera línea de la A, solo con la imagen 1 ("Usa la misma imagen de [la mujer / el hombre] en la calle (imagen 1), con sus mismos accesorios, ropa y el lugar, como frame inicial del video."), **sin** la línea del micrófono que se retrae, con "Entrevistador (voz en off):" como etiqueta, y con la acción diciendo que [ella / él] habla de frente con el entrevistador que tiene delante. En la lista de NO, las dos primeras pasan a "No aparece ninguna otra persona, ninguna mano ni ningún micrófono. Solo [ella / él]." y "[Ella / Él] no mira a la cámara ni a los lados: mira al entrevistador que tiene delante."; siguen las demás fijas (no se corta ninguna palabra, la cámara, "Nadie repite palabras…", "El entrevistador hace cada pregunta una sola vez, de corrido, sin repetirla."), y no van las del entrevistador ni las del producto. El silencio de la tercera pregunta se escribe en la acción ("se queda callada, con cara de no saber, hasta el final del clip"): esa cara sostenida es la que el motor muestra 0,8 s antes del congelado. En el clip que termina con ese silencio, la línea de la última frase se cambia por la del silencio: si dice una muletilla ("Eh…"), esa muletilla va en el diálogo, y en la lista de NO: "[Ella / Él] dice solo esa palabra y se queda callada: no dice "ahm", "eh" ni nada más."; si no dice nada: "[Ella / Él] no contesta: se queda callada hasta el final."
- **Clips de la historia**: la plantilla de una voz de arriba, tal cual. Se generan completos (de ahí sale la voz); en el montaje no se ven.

Cuando el entrevistador tiene que entregar algo (solo en variante B): "le entrega [el producto] cerrado, listo, con su otra mano, por el mismo lado del micrófono", y cuando ya lo entregó, "el brazo sale de cuadro". Nadie lo abre ni lo guarda. El mic ocupa una mano; el producto siempre va en la otra. Si se muestra algo en pantalla: primero hacia la persona, ella lo mira en silencio, y recién después gira hacia la cámara.

### Iconos del gancho (variante A)

Por cada pregunta de opción del gancho, **dos iconos**: uno por opción. Aparecen juntos, **en pareja, uno a cada lado de la persona** a la altura del pecho, cuando el entrevistador dice las dos opciones. Cuando la persona elige, **el check entra debajo del icono elegido, con su sonido, justo cuando ella dice la palabra de esa opción** (el motor la busca en la respuesta, siempre después de las opciones, nunca en la pregunta: la última palabra de "check con" que también está en "aparecen con", sin contar palabras vacías como "de", "la", "un", "uno"). El grupo se va cuando empieza la pregunta siguiente, pero nunca antes de un momento después del check (0,9 s), para que el check se vea. En la tercera pregunta (la que no sabe contestar) **no hay elección**: los dos iconos aparecen y se quedan 2,5 s, sin check. Si el gancho va en dos clips, cada grupo pertenece al clip donde se dice su pregunta, y sus frases (aparece, desaparece, check) son de ese mismo clip; si la pregunta siguiente cae en el otro clip, el grupo desaparece solo (frase de desaparición en `null`).

Formato, un grupo por pregunta:

~~~markdown
**Pregunta 1 — "[la pregunta]"** · clip 1 · aparecen con: "[las dos opciones, como se dicen]" · desaparecen con: "[primeras palabras de la pregunta 2]" · elegido: `icono-[opción]` · check con: "[la respuesta, textual: dice la palabra de la opción elegida igual que en la pregunta, con su muletilla o su palabra de más]"

`### 🖼️ icono-[opción A]`
```
[prompt]
```

`### 🖼️ icono-[opción B]`
```
[prompt]
```
~~~

Plantilla del prompt de un icono (en español, uno por icono, completo):

```
Icono plano, estilo sticker, de [la cosa: una persona sentada en una silla de
oficina / una copa de vino tinto / un reloj despertador]: [dos o tres detalles
simples que lo hagan reconocible de un vistazo]. Colores vivos, contorno blanco
grueso alrededor de toda la figura, sobre fondo transparente, sin texto, sin
sombra proyectada. Centrado, ocupa casi todo el cuadro. Cuadrado 1:1.
```

- Cada icono tiene un `id` que empieza por `icono-` y es único en el anuncio (`icono-sentado`, `icono-de-pie`).
- Las frases van **textuales** de la línea de su clip y únicas dentro de ella: "aparecen con" = la frase de la pregunta donde se oyen las dos opciones; "desaparecen con" = las primeras palabras de la pregunta siguiente (o `null` en la última); "check con" = la respuesta de la persona, entera y como la dice, con la palabra de la opción elegida (la misma que está en "aparecen con") y su muletilla o su palabra de más ("Eh… alta.", "Video, claro."). La respuesta nunca es solo esa palabra: el motor compara palabras, sin puntuación ni mayúsculas, así que "Video." sería lo mismo que el "video" de la pregunta, y la muletilla o la palabra de más es lo que la hace única en la línea. El check se busca después de las opciones, nunca en la pregunta.
- El motor los genera cuadrados con fondo transparente y los muestra recortados; si el modelo devuelve fondo, los muestra dentro de una tarjeta blanca redondeada con sombra. Sigue viéndose como sticker: no es un defecto. Si un icono sale con una mancha semitransparente dentro de la figura (el centro de un sol, de una flor), el motor la tapa solo con el color de alrededor y guarda la original en `historial/`; un hueco totalmente transparente (un anillo, el asa de una taza) se respeta, porque puede ser a propósito. Para tapar, el motor usa Python con Pillow y numpy: si faltan, lo avisa y deja el icono como vino (ver "Las imágenes, antes de pagar los clips").

### B-roll de la historia (variante A)

Después del congelado solo se oye la voz de la persona, y el video es una **cadena de B-roll generados con IA**, uno detrás de otro, sin nadie que hable. Un B-roll por idea, **cada 3 a 6 segundos de voz** (entre 6 y 12 en total en un anuncio normal). Cada uno declara con qué frase textual de la historia entra, y el primero arranca con la historia (su frase son las primeras palabras del primer clip de la historia). Cada clip de la historia tiene al menos un B-roll, y entre dos frases de entrada nunca pasan más de 8 s de voz (unas 20 palabras): si pasan, falta un B-roll en medio.

Qué muestra cada uno, según lo que se dice en ese momento: **personas hiperrealistas** viviendo el problema o el uso (en su casa, en su trabajo, en la calle; nunca mirando a cámara), **animación médica 3D** cuando lo que dice habla de lo que pasa dentro del cuerpo (circulación, digestión, una articulación), **el producto real**, con su foto adjunta, cuando lo nombra o cuenta cómo lo usa, o **una escena del problema o del uso** (la alacena con los frascos abandonados, la mesa del desayuno). Si el B-roll muestra a la propia persona entrevistada (en su casa, en su trabajo), se adjunta su hoja de personaje.

Formato, un bloque por B-roll:

~~~markdown
**B-ROLL 1 — [la idea en pocas palabras]** · clip 2 · entra con: "[frase textual de la línea del clip]" · 5 s · adjunta: [nada / tu foto del producto / la hoja de la persona]

`🖼️ Imagen`
```
[prompt de imagen, completo]
```

`🎬 Video (Kling, 5 s, mudo)`
```
[prompt de video, completo]
```
~~~

Plantilla del prompt de imagen (en español, completo; un solo instante):

```
[Qué se ve, en una o dos frases: quién o qué, dónde, en qué estado. Para
personas: "foto realista de una mujer de unos 40 años, de perfil, sentada en
el borde de su cama, frotándose la pantorrilla con las dos manos, con gesto
de cansancio; dormitorio normal, luz de la mañana por la ventana". Para
animación médica: "animación médica 3D de una pierna vista por dentro: las
venas en azul oscuro, la sangre circulando lenta y espesa, sobre fondo oscuro
limpio". Para el producto: "la foto del producto adjunta es [producto], con su
etiqueta exactamente igual; está [de pie sobre la mesa de la cocina junto a un
vaso de agua, con luz suave de la mañana / en la mano de una mujer que lo
sostiene quieto, con la etiqueta de frente]".] Encuadre vertical. Sin texto,
sin logos agregados. [Para personas: Nadie mira a la cámara.] Aspect 9:16.
```

Plantilla del prompt de video para Kling (en español, completo, siempre mudo):

```
Usa la imagen adjunta como frame inicial. [Qué pasa, en una o dos frases
simples, con un movimiento pequeño: "la mujer sigue frotándose la pierna y
cierra los ojos un momento" / "la sangre avanza despacio por las venas y la
cámara se acerca muy lento" / "una mano deja [el producto] sobre la mesa y se
retira"]. La cámara [está quieta / se acerca muy despacio]. Todo ocurre de
manera natural, sin cortes.

Lo que NO debe pasar:
- Nadie habla ni mueve los labios. No hay voces.
- No aparece texto, letreros ni subtítulos.
- [Si hay producto: El producto no cambia: misma etiqueta que en la imagen. Solo hay un [producto].]
- La cámara no cambia de ángulo.
- [Lo propio de este B-roll: "la persona no mira a la cámara", "no aparece otra persona".]
```

- Se piden de **5 s** (Kling acepta duraciones enteras entre 3 y 15). En el montaje, cada B-roll dura desde su frase hasta la frase del siguiente: si la ventana es más larga, el motor lo ralentiza (hasta 0,75x) y, si aún falta, congela el último cuadro con un acercamiento suave; si es más corta, lo recorta (hasta 1,3x si ayuda a mostrar más). Por eso la regla de cada 3 a 6 s: ventanas más largas se ven congeladas.
- El prompt de video no lleva "Duración:" ni "Termina:": los B-roll no se encadenan entre sí.
- El audio del B-roll no se usa nunca: el motor los genera sin sonido y los monta mudos.
- **Nada que invite a texto inventado** en la escena: ni lomos de libros, ni teclados, ni pantallas encendidas con texto, ni revistas, ni carteles. El modelo les escribe letras que no existen. Para llenar un fondo: plantas, jarrones, una canasta, una taza, una lámpara.

**Los B-roll con el producto** (sirve para cualquier producto, también el celular con la app):
- **No se desliza ni se arrastra**: Kling dobla la etiqueta. Queda quieto, o una mano lo apoya y se retira, o lo sostiene quieto con la etiqueta de frente.
- **Tal como en la foto**: si la foto lo muestra cerrado, va cerrado; nunca abierto ni con lo de adentro a la vista si la foto no lo muestra.
- **La mano nunca pasa entre la cámara y la etiqueta.**
- **Luz suave y pareja**, y **ningún color inventado**: ni del envase ni de lo que trae adentro, salvo lo que se ve en la foto o dijo el usuario.
- **Dos B-roll del producto, distintos entre sí**: por ejemplo uno de frente sobre una superficie y otro en la mano o desde arriba; nunca dos casi iguales.
- **Palabras neutras** para el lugar: "mesa", "encimera", "superficie".

### Iconos de las menciones (variante B)

De **2 a 4 cosas que la persona nombra** en la conversación (lo que ya probó y abandonó, el hábito que repite, lo que le cuesta): cada una aparece **en el centro, a la altura del pecho, con un clic**, cuando la dice, y se va 2,5 s después, o con una frase posterior del mismo clip si quieres que dure más. **Van de a una**: si la siguiente entra antes, la anterior se va en ese momento. Por eso, si nombra varias cosas seguidas ("el gimnasio, la bici fija, las pesas…"), cada una es su propio grupo, anclado en su palabra, y van entrando una tras otra; deja un respiro entre una y otra en el diálogo (una coma, una muletilla), porque dos menciones pegadas se ven apenas un instante. Un icono por grupo (dos solo si nombra dos cosas como una sola idea, "pastillas y tés": van en pareja, al centro). Sin elección ni check.

Formato, un grupo por mención, con la misma plantilla de prompt de icono que arriba:

~~~markdown
**Mención 1 — "[lo que nombra]"** · clip 3 · aparece con: "[frase textual]" · desaparece con: "[frase textual posterior del mismo clip]" o sola a los 2,5 s

`### 🖼️ icono-[cosa]`
```
[prompt]
```
~~~

### El producto al centro (variante B)

Cuando el entrevistador nombra el producto (la marca, en su línea; casi siempre en el cierre), **la foto del producto aparece en el centro de la pantalla, sobre el pecho de la persona, como un icono más**: con el mismo clic de los iconos, recortada si la foto tiene fondo transparente o dentro de una tarjeta blanca si no, y se queda 3 s (o hasta que termina ese clip). Se declara con el clip y la frase textual (la marca o el nombre del producto, tal como está escrito en la línea). Vale para cualquier producto: la foto del envase, la captura de la app o la imagen que represente el servicio. Si no hay ninguna imagen del producto, este bloque dice "sin producto al centro: no hay imagen del producto" y no va en el manifiesto. En el manifiesto, este bloque es el campo `sticker_producto`.

~~~markdown
**El producto al centro** · clip 5 · aparece con: "[la marca, textual]" · 3 s · tu foto del producto
~~~

### B-roll de cierre (las dos variantes)

El anuncio termina con un B-roll de **5 a 7 s** en fila después del último clip, con el **producto real** adjunto, pensado para el llamado a la acción: el motor pone encima el texto del CTA del briefing en una cápsula de color en el tercio superior y una flecha roja hacia abajo, con rebote, en el tercio inferior. Por eso **el producto se ve chico, en la franja del medio del cuadro**: a lo alto ocupa menos de un tercio, con mucho espacio libre arriba (ahí va el texto) y abajo (ahí va la flecha). Si sale grande, la flecha cae encima de la etiqueta. **La cámara está quieta**: no se acerca ni se aleja, y el producto no cambia de tamaño ni de lugar; solo se mueve la luz o algo del fondo (la sombra de una cortina, el vapor de una taza). **Sin personas ni manos**, y sin texto propio. En un producto digital: el celular, chico, de pie en la franja del medio, con la pantalla encendida sin texto que se lea. En un servicio: el lugar del servicio, con la misma regla de aire arriba y abajo. Mudo, como todos los B-roll; en B entra con el mismo fundido corto que los clips.

Formato: igual que un B-roll de la historia, con la etiqueta `**B-ROLL DE CIERRE — [idea]** · después del clip N · 6 s · adjunta: tu foto del producto`, su prompt de imagen y su prompt de video para Kling, con estas plantillas:

```
La foto del producto adjunta es [el producto], con su etiqueta exactamente
igual; está [de pie sobre una superficie limpia: una repisa de piedra gris,
una encimera blanca], en [un lugar simple: un baño claro, una sala con una
ventana] con [luz de día suave]. [El producto] se ve pequeño en el cuadro: está
en la franja del medio de la imagen y a lo alto ocupa menos de un tercio, con
mucho espacio libre arriba y abajo. Arriba se ve [la pared] y abajo [la
superficie] vacía. Encuadre vertical. Sin texto agregado. Aspect 9:16.
```

```
Usa la imagen adjunta como frame inicial. [Lo único que se mueve: la sombra de
una cortina pasa despacio por la pared / sale vapor de una taza al lado].
La cámara está quieta y [el producto] no cambia de tamaño ni de lugar. Todo
ocurre de manera natural, sin cortes.

Lo que NO debe pasar:
- Nadie habla ni mueve los labios. No hay voces.
- No aparece texto, letreros ni subtítulos.
- El producto no cambia: misma etiqueta que en la imagen. Solo hay un [producto].
- La cámara no cambia de ángulo, no se acerca ni se aleja.
- No aparece ninguna persona ni ninguna mano.
```

### Plan de montaje

Es lo que el motor hace solo con el manifiesto (y lo que una persona necesita saber si monta a mano). Tabla con una fila por pieza en orden: `# · Pieza · Qué pasa`. Los efectos propios de cada variante:

- **A**: los clips del gancho enteros, cortados en las palabras (0,12 s antes de la primera y 0,25 s después de la última del guion; el último del gancho deja 0,8 s para la cara de no saber); al terminar el último clip del gancho, el congelado de su último cuadro con un golpe de glitch (0,8 s: acercamiento corto, sacudida, los colores que se separan y el negativo en dos golpes, con el sonido de glitch); desde ahí, los clips de la historia solo con su voz, sin los silencios de adentro y a 1,2x, y encima la cadena de B-roll, cada uno desde su frase hasta la frase del siguiente (el primero desde que empieza la historia, el último hasta que termina la voz); los iconos del gancho en pareja, uno a cada lado de la persona, con el check y su sonido debajo del elegido en la palabra de la opción, y el grupo se queda hasta un momento después del check; subtítulos al medio de la pantalla durante el gancho y abajo desde el congelado; al final, el B-roll de cierre con el llamado a la acción y la flecha.
- **B**: los clips en fila, cortados en las palabras (0,12 s antes de la primera y 0,25 s después de la última del guion), con una **disolvencia corta (0,25 s) en cada corte**; los iconos de las menciones de a uno, en el centro sobre el pecho, con un clic al aparecer; el producto al centro, con el mismo clic, cuando el entrevistador lo nombra; subtítulos abajo; al final, el B-roll de cierre con el llamado a la acción y la flecha. Sin blanco y negro.

Y siempre: subtítulos del sistema (una línea, palabra resaltada) en los dos; **sin música**: el ambiente de calle es parte del realismo y el motor no agrega ninguna pista. Los clips que se ven no se aceleran ni se cortan por dentro; la voz de la historia de A sí, porque su video no se ve (paso `voz`). Si un clip sale con otra cara, ropa o calle, se rehace (Paso final).

---

## Lo que falla → qué hacer en su lugar

| Falla | En su lugar |
|---|---|
| El producto aparece en las primeras líneas | Se lee como anuncio desde el segundo 1 → entra en el beat de entrega, o cuando la persona lo descubre en su historia |
| La persona dice la marca (B) | Suena guionada → la marca solo en boca del entrevistador |
| Dos voces con 30 palabras en un clip de 10s | Corta palabras → medir con la fórmula; partir en un corte de idea completa |
| Pregunta seguida de un fragmento suelto | El modelo le asigna el fragmento a la otra voz → una sola oración por turno |
| Timestamps o segundos dentro del prompt | Aprietan el diálogo → describir la acción en orden, sin segundos |
| "La mano entra por la esquina inferior izquierda" | Sale feo → "le entrega X con su otra mano", sin coordenadas |
| Micro-coreografía ("gira la tapa tres veces") | Empeora el resultado → frases simples: quién hace qué con qué, y en qué estado queda cada objeto |
| Describir de nuevo la persona, la calle o la luz en el prompt de video | Contradice la imagen del clip → solo qué pasa, el diálogo, las voces y el sonido |
| Un prompt de video sin la lista de "Lo que NO debe pasar" | El modelo inventa gente, micrófonos, miradas a cámara → la lista siempre, adaptada al clip |
| Un objeto aparece, desaparece o se duplica | Se ve la magia → decir quién lo entrega, quién lo sostiene y con qué mano, y "solo hay un…" |
| El producto entra en un clip sin estar en su imagen | El generador inventa otro envase → la imagen del clip ya lo muestra entrando, con la foto adjunta, y el video la lleva como imagen 3 |
| Entregar el producto abierto, o con la tapa aparte | La tapa aparece de la nada en la mano → se entrega cerrado, listo, tal como viene; nadie lo abre en cámara |
| Que la persona lo pruebe abriéndolo ahí | Maniobra difícil y magia de objetos → el entrevistador le da una unidad ya lista (en la palma, en una cucharita, una muestra) y el envase cerrado |
| Guardar el producto en el bolso o dejarlo en algún lado | Se cae o desaparece → lo sostiene o lo abraza a la vista hasta el final, con su bolso como siempre |
| Aparece la otra mano o la cara del entrevistador | Se rompe la ilusión de calle → sus líneas de NO: la otra mano no aparece antes de la entrega; la cara y el cuerpo nunca entran, al entregar solo su brazo por el borde |
| El remate sale cambiado o repetido | El chiste se pierde → la línea de NO "dice su última frase una sola vez, con esas mismas palabras, y no repite nada después" (y, si se ríe, "se queda riendo en silencio hasta el final") |
| Una palabra repetida, trabada, cambiada o agregada en la transcripción | Se oye y se lee en los subtítulos → se regenera el clip, nunca "suena natural" (la única que no se regenera es la que el motor marca "tolerada": se informa con su segundo) |
| La respuesta de una opción dice otra palabra que la pregunta | El check cae donde no va → la respuesta repite la palabra de la opción ("¿Alta o baja?" → "Eh… alta.") |
| La respuesta de una opción es solo esa palabra ("Video.") | Para el motor es igual a la palabra de la pregunta: no mira puntuación ni mayúsculas → con una muletilla o una palabra más ("Video, claro.") |
| La marca dicha con otro acento o leída mal | Suena a otra marca → en "cómo lo dice", cómo se pronuncia; la línea queda igual |
| La cara o la ropa cambian entre clips | La imagen del clip salió distinta o faltó un personaje adjunto → revisar `img/`, no reescribir el diálogo |
| "Overcast", "dull", "flat" para la luz | El modelo lo lee como gris y apagado → no describir la luz; viene de las imágenes |
| "No text, no logos" como frase general | Borra la etiqueta del producto y los letreros de la calle → solo "sin logos ni letras en la ropa"; la etiqueta "exactamente igual a la foto" |
| Una frase ancla que se repite en el clip | El icono, el check o el B-roll caen en la primera repetición → frases únicas, con la muletilla si hace falta |
| Más de 8 s de voz entre dos B-roll de la historia | Se ve congelado → un B-roll más en medio, con su frase |
| Un B-roll con alguien hablando a cámara | Boca moviéndose sin voz → "nadie habla ni mueve los labios", personas de perfil o en acción |
| El producto se desliza o se arrastra en un B-roll | Kling dobla la etiqueta → queda quieto, o una mano lo apoya y se retira |
| Lomos de libros, un teclado o una pantalla en un fondo | Aparecen letras inventadas → objetos sin letras: plantas, jarrones, una canasta |
| B-roll de cierre con el producto grande, o la cámara que se acerca | La flecha cae encima de la etiqueta → el producto chico en la franja del medio, con aire arriba y abajo, cámara quieta |
| Un icono con fondo blanco | No es un defecto: el motor lo pone en tarjeta → nada que arreglar; si no se entiende qué es, se rehace el icono |

---

## Sección G — Manifiesto de producción (JSON)

Este bloque es **aditivo y no cambia nada de lo anterior**. Todo lo que armas en los bloques anteriores se arma exactamente igual. Además, con el Plan de montaje listo, escribes el manifiesto en su archivo (G.1). **El manifiesto es interno del sistema: nunca se muestra en el chat**, ni siquiera si el usuario elige la opción C.

**Para qué sirve**: el manifiesto es el único punto de contacto entre esta skill y el motor de producción, que lo lee y genera los personajes, la imagen de cada clip, cada clip, los iconos, los B-roll y el montaje. Mientras armas el paquete no ejecutas nada: solo describes el anuncio en JSON.

**Regla de fidelidad**: lo que va en el manifiesto es **exactamente** lo que armaste en los bloques del paquete, copiado carácter por carácter. Desde que está escrito, el manifiesto es la fuente de verdad: lo que el usuario vea después (el paquete de la opción C, o la parte que pida) se copia de él. Cada campo sale de su bloque:

- el `prompt` de cada personaje = su prompt de imagen del bloque Personajes;
- cada `prompt_imagen_inicial` = el bloque de código de la imagen de ese clip;
- cada `prompt_video` = el bloque de código del prompt de video de ese clip;
- cada `texto` del `dialogo` = la línea de ese clip en el Guion, que es la misma que va dentro del prompt (sin las comillas);
- cada `prompt` de icono y cada `prompt_imagen` / `prompt_video` de B-roll = sus bloques de código;
- cada frase ancla (`aparece_con`, `desaparece_con`, `check_con`, `sincroniza_con`) = la frase textual que anotaste en su etiqueta, y es un trozo literal de la `linea` de su clip;
- cada `ingredientes` = las imágenes que nombra la primera línea de su prompt de video, en el mismo orden (imagen 1, imagen 2, imagen 3), y lo mismo que dice la etiqueta del clip.

Si un prompt del manifiesto difiere del que el usuario ve, el video final no es el que él aprobó. Al pasarlo al JSON, los saltos de línea del prompt van como `\n`, las comillas rectas que haya dentro van escapadas (`\"`) y los puntos suspensivos y las comillas tipográficas van tal cual.

### G.1 — Dónde va

Siempre en su archivo, nunca en el chat (ni siquiera en la opción C):

```
temp/[slug-del-anuncio]/manifiesto.json
```

donde `[slug-del-anuncio]` es el nombre del producto en kebab-case más `-entrevista` (por ejemplo, `gomitas-sueno-entrevista`). En el resumen del Paso final basta media línea que diga que quedó guardado y revisado.

**Si `temp/[slug-del-anuncio]/` ya existe con otro anuncio** (otro guion u otra versión del mismo producto), no la reuses: el motor se salta las imágenes y los clips que ya están en la carpeta, y metería piezas viejas en el anuncio nuevo. Usa un slug nuevo (por ejemplo, `gomitas-sueno-entrevista-v2`) y dile al usuario, en el resumen, que esa carpeta ya existía y qué nombre usaste.

### G.2 — Estructura (variante A)

```json
{
  "estilo": "entrevista",
  "modo_audio": "dialogo_nativo",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "entrevista": {
    "variante": "A",
    "lado_mic": "izquierda",
    "lado_iconos": "derecha",
    "marca": "[la marca, como se dice en el guion]",
    "cta": { "texto": "[el llamado a la acción del briefing]", "flecha": true },
    "congelado": { "despues_de_toma": 1 }
  },
  "referencias": [
    { "id": "persona", "tipo": "personaje", "prompt": "[PERSONAJE 1, carácter por carácter]" },
    { "id": "calle", "tipo": "lugar", "prompt": "[PERSONAJE 2, carácter por carácter]" },
    { "id": "producto", "tipo": "producto", "archivo": "producto.jpg", "nota": "conservar forma, colores y etiqueta exactos" }
  ],
  "tomas": [
    {
      "n": 1,
      "tipo": "H",
      "fase": "gancho",
      "duracion": 10,
      "dialogo": [
        { "habla": "entrevistador", "texto": "[pregunta 1]" },
        { "habla": "persona", "texto": "[respuesta 1]" },
        { "habla": "entrevistador", "texto": "[pregunta 2]" },
        { "habla": "persona", "texto": "[respuesta 2]" },
        { "habla": "entrevistador", "texto": "[pregunta 3]" },
        { "habla": "persona", "texto": "[la muletilla del silencio, si dice alguna]" }
      ],
      "linea": "[pregunta 1] [respuesta 1] [pregunta 2] [respuesta 2] [pregunta 3] [la muletilla del silencio, si dice alguna]",
      "prompt_imagen_inicial": "[IMAGEN DEL CLIP 1, carácter por carácter]",
      "prompt_imagen_final": null,
      "prompt_video": "[CLIP 1, carácter por carácter]",
      "referencias": ["persona", "calle"],
      "ingredientes": ["imagen"]
    },
    {
      "n": 2,
      "tipo": "H",
      "fase": "historia 1",
      "solo_voz": true,
      "duracion": 10,
      "dialogo": [
        { "habla": "persona", "texto": "[línea 1]" },
        { "habla": "persona", "texto": "[línea 2]" }
      ],
      "linea": "[línea 1] [línea 2]",
      "prompt_imagen_inicial": "[IMAGEN DEL CLIP 2, carácter por carácter]",
      "prompt_imagen_final": null,
      "prompt_video": "[CLIP 2, carácter por carácter]",
      "referencias": ["persona", "calle"],
      "ingredientes": ["imagen"]
    },
    {
      "n": 3,
      "tipo": "H",
      "fase": "cierre",
      "solo_voz": true,
      "duracion": 8,
      "dialogo": [
        { "habla": "persona", "texto": "[línea de cierre 1]" },
        { "habla": "persona", "texto": "[línea de cierre 2]" }
      ],
      "linea": "[línea de cierre 1] [línea de cierre 2]",
      "prompt_imagen_inicial": "[IMAGEN DEL CLIP 3, carácter por carácter]",
      "prompt_imagen_final": null,
      "prompt_video": "[CLIP 3, carácter por carácter]",
      "referencias": ["persona", "calle"],
      "ingredientes": ["imagen"]
    }
  ],
  "iconos": [
    {
      "grupo": "pregunta-1",
      "toma": 1,
      "aparece_con": "[las dos opciones de la pregunta 1, textual]",
      "desaparece_con": "[primeras palabras de la pregunta 2, textual]",
      "elegido": "icono-[opción A]",
      "check_con": "[respuesta 1, entera y textual: la palabra de la opción elegida con su muletilla o su palabra de más]",
      "iconos": [
        { "id": "icono-[opción A]", "prompt": "[prompt del icono, carácter por carácter]" },
        { "id": "icono-[opción B]", "prompt": "[prompt del icono, carácter por carácter]" }
      ]
    },
    {
      "grupo": "pregunta-2",
      "toma": 1,
      "aparece_con": "[las dos opciones de la pregunta 2, textual]",
      "desaparece_con": "[primeras palabras de la pregunta 3, textual]",
      "elegido": "icono-[opción C]",
      "check_con": "[respuesta 2, entera y textual: la palabra de la opción elegida con su muletilla o su palabra de más]",
      "iconos": [
        { "id": "icono-[opción C]", "prompt": "[prompt]" },
        { "id": "icono-[opción D]", "prompt": "[prompt]" }
      ]
    },
    {
      "grupo": "pregunta-3",
      "toma": 1,
      "aparece_con": "[las dos opciones de la pregunta 3, textual]",
      "desaparece_con": null,
      "elegido": null,
      "check_con": null,
      "iconos": [
        { "id": "icono-[opción E]", "prompt": "[prompt]" },
        { "id": "icono-[opción F]", "prompt": "[prompt]" }
      ]
    }
  ],
  "broll": [
    { "n": 1, "encima_de_toma": 2, "sincroniza_con": "[primeras palabras de la línea 1 del clip 2]", "duracion": 5, "prompt_imagen": "[B-ROLL 1 imagen, carácter por carácter]", "prompt_video": "[B-ROLL 1 video, carácter por carácter]", "referencias": [] },
    { "n": 2, "encima_de_toma": 2, "sincroniza_con": "[frase textual de la línea 2 del clip 2]", "duracion": 5, "prompt_imagen": "[B-ROLL 2 imagen]", "prompt_video": "[B-ROLL 2 video]", "referencias": ["producto"] },
    { "n": 3, "encima_de_toma": 3, "sincroniza_con": "[frase textual del clip 3]", "duracion": 5, "prompt_imagen": "[B-ROLL 3 imagen]", "prompt_video": "[B-ROLL 3 video]", "referencias": [] },
    { "n": 4, "despues_de_toma": 3, "cierre": true, "duracion": 6, "prompt_imagen": "[B-ROLL DE CIERRE imagen]", "prompt_video": "[B-ROLL DE CIERRE video]", "referencias": ["producto"] }
  ],
  "overlays": []
}
```

### G.2 bis — Estructura (variante B)

Lo que cambia respecto a la A: `variante: "B"`, sin `congelado`, con la referencia `mano-mic` (en las imágenes y en los ingredientes de todos los clips), `"producto"` en las imágenes y en los ingredientes de los clips donde se ve, sin `solo_voz`, iconos de las menciones (`elegido` y `check_con` en `null`), `sticker_producto` (el producto al centro), y el B-roll de cierre como único B-roll.

```json
{
  "estilo": "entrevista",
  "modo_audio": "dialogo_nativo",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "entrevista": {
    "variante": "B",
    "lado_mic": "izquierda",
    "lado_iconos": "derecha",
    "marca": "[la marca, como la dice el entrevistador]",
    "cta": { "texto": "[el llamado a la acción del briefing]", "flecha": true }
  },
  "referencias": [
    { "id": "persona", "tipo": "personaje", "prompt": "[PERSONAJE 1, carácter por carácter]" },
    { "id": "calle", "tipo": "lugar", "prompt": "[PERSONAJE 2, carácter por carácter]" },
    { "id": "mano-mic", "tipo": "objeto", "prompt": "[PERSONAJE 3, carácter por carácter]" },
    { "id": "producto", "tipo": "producto", "archivo": "producto.jpg", "nota": "conservar forma, colores y etiqueta exactos" }
  ],
  "tomas": [
    {
      "n": 1,
      "tipo": "H",
      "fase": "abordaje + confesión",
      "duracion": 10,
      "dialogo": [
        { "habla": "entrevistador", "texto": "[abordaje y pregunta]" },
        { "habla": "persona", "texto": "[confesión]" }
      ],
      "linea": "[abordaje y pregunta] [confesión]",
      "prompt_imagen_inicial": "[IMAGEN DEL CLIP 1, carácter por carácter]",
      "prompt_imagen_final": null,
      "prompt_video": "[CLIP 1, carácter por carácter]",
      "referencias": ["persona", "calle", "mano-mic"],
      "ingredientes": ["imagen", "mano-mic"]
    },
    {
      "n": 2,
      "tipo": "H",
      "fase": "lo que ya probó",
      "duracion": 8,
      "dialogo": [
        { "habla": "entrevistador", "texto": "[pregunta]" },
        { "habla": "persona", "texto": "[lo que ya probó]" }
      ],
      "linea": "[pregunta] [lo que ya probó]",
      "prompt_imagen_inicial": "[IMAGEN DEL CLIP 2]",
      "prompt_imagen_final": null,
      "prompt_video": "[CLIP 2]",
      "referencias": ["persona", "calle", "mano-mic"],
      "ingredientes": ["imagen", "mano-mic"]
    },
    {
      "n": 3,
      "tipo": "H",
      "fase": "entrega",
      "duracion": 10,
      "dialogo": [
        { "habla": "entrevistador", "texto": "[la entrega]" },
        { "habla": "persona", "texto": "[la reacción]" }
      ],
      "linea": "[la entrega] [la reacción]",
      "prompt_imagen_inicial": "[IMAGEN DEL CLIP 3, con el producto entrando]",
      "prompt_imagen_final": null,
      "prompt_video": "[CLIP 3]",
      "referencias": ["persona", "calle", "mano-mic", "producto"],
      "ingredientes": ["imagen", "mano-mic", "producto"]
    },
    {
      "n": 4,
      "tipo": "H",
      "fase": "veredicto + remate",
      "duracion": 10,
      "dialogo": [
        { "habla": "entrevistador", "texto": "[la comparación]" },
        { "habla": "persona", "texto": "[el veredicto]" },
        { "habla": "entrevistador", "texto": "[el chiste]" },
        { "habla": "persona", "texto": "[el remate]" }
      ],
      "linea": "[la comparación] [el veredicto] [el chiste] [el remate]",
      "prompt_imagen_inicial": "[IMAGEN DEL CLIP 4]",
      "prompt_imagen_final": null,
      "prompt_video": "[CLIP 4]",
      "referencias": ["persona", "calle", "mano-mic", "producto"],
      "ingredientes": ["imagen", "mano-mic", "producto"]
    },
    {
      "n": 5,
      "tipo": "H",
      "fase": "cierre",
      "duracion": 6,
      "dialogo": [
        { "habla": "entrevistador", "texto": "[línea de cierre con la marca]" }
      ],
      "linea": "[línea de cierre con la marca]",
      "prompt_imagen_inicial": "[IMAGEN DEL CLIP 5]",
      "prompt_imagen_final": null,
      "prompt_video": "[CLIP 5, plantilla de cierre]",
      "referencias": ["persona", "calle", "mano-mic", "producto"],
      "ingredientes": ["imagen", "mano-mic", "producto"]
    }
  ],
  "iconos": [
    {
      "grupo": "mencion-1",
      "toma": 2,
      "aparece_con": "[frase textual donde nombra la cosa 1]",
      "desaparece_con": null,
      "elegido": null,
      "check_con": null,
      "iconos": [ { "id": "icono-[cosa 1]", "prompt": "[prompt del icono, carácter por carácter]" } ]
    },
    {
      "grupo": "mencion-2",
      "toma": 2,
      "aparece_con": "[frase textual donde nombra la cosa 2]",
      "desaparece_con": "[frase textual posterior del mismo clip]",
      "elegido": null,
      "check_con": null,
      "iconos": [ { "id": "icono-[cosa 2]", "prompt": "[prompt del icono, carácter por carácter]" } ]
    }
  ],
  "broll": [
    { "n": 1, "despues_de_toma": 5, "cierre": true, "duracion": 6, "prompt_imagen": "[B-ROLL DE CIERRE imagen, carácter por carácter]", "prompt_video": "[B-ROLL DE CIERRE video, carácter por carácter]", "referencias": ["producto"] }
  ],
  "sticker_producto": { "toma": 5, "sincroniza_con": "[la marca o el nombre del producto, textual, como está en la línea del clip 5]" },
  "overlays": []
}
```

### G.3 — Los campos, uno por uno

| Campo | Qué va |
|---|---|
| `estilo` | Siempre `"entrevista"` |
| `modo_audio` | Siempre `"dialogo_nativo"`: las voces van dentro de cada clip. **No hay campo `voz_en_off`** |
| `mercado` / `idioma` | Del briefing: `"LatAm"`, `"EEUU"`, `"Brasil"`…; `"es"`, `"en"` o `"pt"` |
| `aspect_ratio` | Siempre `"9:16"` |
| `entrevista.variante` | `"A"` o `"B"`, la que eligió el usuario |
| `entrevista.lado_mic` | `"izquierda"` o `"derecha"`: por dónde entra el brazo del entrevistador (en A no se ve, pero se declara igual) |
| `entrevista.lado_iconos` | Siempre el lado contrario a `lado_mic`. Se declara, pero la posición de los iconos la decide el motor: en A, en pareja, uno a cada lado de la persona; en B, de a uno, en el centro |
| `entrevista.marca` | La marca tal como se dice en el guion |
| `entrevista.cta` | `texto` = el llamado a la acción del briefing, tal cual; `flecha: true` |
| `entrevista.congelado` | Solo en A: `despues_de_toma` = el último clip del gancho (1, o 2 si el gancho va en dos clips). En B no existe |
| `referencias` | Los personajes y el producto. Ver G.4 |
| `tomas` | Una entrada por clip, en orden. En el motor cada clip es una "toma" y su video es `video/toma-N.mp4` |
| `tomas[].n` | El número del clip (1, 2, 3…) |
| `tomas[].tipo` | Siempre `"H"`: clip hablado, que el motor genera por ingredientes |
| `tomas[].fase` | El beat del clip (gancho, historia 1, cierre; abordaje + confesión, lo que ya probó, entrega, veredicto + remate, cierre) |
| `tomas[].duracion` | 4, 6, 8 o 10: la de la etiqueta del clip, medida con la fórmula y redondeada hacia arriba |
| `tomas[].dialogo` | Las líneas del clip en orden: `habla` = `"entrevistador"` o `"persona"`, `texto` = la línea sin comillas. En el clip de cierre de B, solo el entrevistador; en la historia de A, solo la persona |
| `tomas[].linea` | Todos los `texto` del `dialogo`, en orden, unidos por un espacio. Los subtítulos, la transcripción y todas las frases ancla se alinean contra este campo |
| `tomas[].solo_voz` | Solo en A, en todos los clips después del congelado: `true`. Se genera entero, se usa su audio y el video lo cubre la cadena de B-roll. El paso `voz` le quita los silencios de adentro y lo pasa a 1,2x. En el gancho y en toda la B no se escribe |
| `tomas[].prompt_imagen_inicial` | El prompt de la imagen del clip, carácter por carácter |
| `tomas[].prompt_imagen_final` | Siempre `null` |
| `tomas[].prompt_video` | El prompt de video del clip, carácter por carácter. Sin "Duración:" (el motor pide `duracion`) |
| `tomas[].referencias` | Los ids que se adjuntan a la **imagen** del clip, en el orden en que el prompt de imagen los nombra: A `["persona", "calle"]`; B `["persona", "calle", "mano-mic"]` y, en los clips donde el producto está en cuadro, `"producto"` al final. Lo que recibe el **video** va aparte, en `ingredientes` |
| `tomas[].ingredientes` | Lo que recibe el **video** del clip, en el mismo orden en que la primera línea de su prompt de video nombra las imágenes (imagen 1, 2, 3). Siempre empieza por `"imagen"` (= `img/toma-N-inicial.png`, la imagen del clip, que el prompt usa como frame inicial); lo que sigue son ids de `referencias`, sin repetir. A: `["imagen"]`. B: `["imagen", "mano-mic"]` y, en los clips donde el producto está en cuadro, `["imagen", "mano-mic", "producto"]`. El producto va en los mismos clips en `referencias` y en `ingredientes` |
| `iconos` | Un grupo por pregunta de opción (A) o por mención (B). `grupo` único; `toma` = el clip; `aparece_con`, `desaparece_con` (o `null` = 2,5 s), `check_con` (o `null`) = frases textuales de la `linea` de ese clip; `elegido` = el `id` del icono con check o `null`; `iconos` = 1 o 2 (3 como máximo), cada uno con `id` (empieza por `icono-`, único en el anuncio) y `prompt`. En A, `check_con` es la respuesta entera: la palabra de la opción elegida, la misma que está en `aparece_con`, con su muletilla o su palabra de más (nunca solo esa palabra). El validador avisa si `check_con` no está después de la pregunta, si es solo la opción o si está más de una vez en la línea: corrígelo antes de seguir |
| `broll` | Los B-roll. Los de la historia (A): `encima_de_toma` = un clip `solo_voz`, `sincroniza_con` = frase textual de su `linea`, `duracion` = 5. El de cierre (las dos variantes): `cierre: true`, `despues_de_toma` = el último clip, `duracion` 5 a 7. Todos con `prompt_imagen`, `prompt_video` y `referencias` (`[]`, `["producto"]` o `["persona"]`). `n` correlativo en orden de aparición. Duraciones enteras |
| `sticker_producto` | El producto al centro. Solo en B y solo con imagen del producto (la referencia `producto`, con su `archivo`): `toma` = el clip donde el entrevistador nombra el producto (casi siempre el cierre), `sincroniza_con` = la marca o el nombre del producto, textual, como está en la `linea` de ese clip. Si no aplica, el campo no existe |
| `overlays` | Siempre `[]`: el texto en pantalla (el CTA) lo pone el motor por `entrevista.cta`, nunca por aquí |

Sin `transiciones.json`, sin `musica`, sin `voz_en_off`: en este estilo el fundido lo decide el motor y no hay música.

### G.4 — Las referencias

En `referencias` va **una entrada por cada imagen que usan los clips**:

- **La persona**: siempre. `id: "persona"`, `tipo: "personaje"`, con `prompt` = PERSONAJE 1, carácter por carácter. El motor genera esa hoja una sola vez y la adjunta a cada imagen de clip (y a los B-roll que la muestren).
- **La calle**: siempre. `id: "calle"`, `tipo: "lugar"`, con `prompt` = PERSONAJE 2.
- **La mano con el micrófono**: solo en B. `id: "mano-mic"`, `tipo: "objeto"`, con `prompt` = PERSONAJE 3. En A no existe.
- **El producto**, cuando el usuario dio la foto (o, en un digital o un servicio, la captura o la imagen que lo representa): `id: "producto"`, `tipo: "producto"`, `archivo: "producto.jpg"` (ese nombre exacto, nunca uno inventado; si `preparar-producto` lo cambia a `.png` o `.webp`, vale el suyo: ver G.5), sin `prompt`, y una `nota` corta. Sin foto (un servicio, un producto digital o un producto físico sin foto), esta entrada **no existe**, ningún clip ni B-roll la lleva en `referencias` ni en `ingredientes`, y no hay `sticker_producto` (no hay producto al centro).

En `tomas[].referencias` van los ids que la imagen de ese clip lleva, **en orden**: es el orden en que el motor manda las imágenes, y tiene que coincidir con el orden en que el prompt de imagen las nombra ("la hoja de personaje es…, la foto de la calle es…, la mano con el micrófono es…, la foto del producto es…"). **Si el producto está en cuadro en ese clip, aunque sea en una mano al borde, va**, y va también en sus `ingredientes` (como imagen 3, después de `"imagen"` y `"mano-mic"`).

### G.5 — La foto del producto (si la dio)

Si el usuario dio la foto, este es el comando que la prepara (con la ruta de su foto y el slug del anuncio):

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug-del-anuncio]
```

Ese comando copia la foto a la carpeta del anuncio con el nombre correcto y la convierte si hace falta (`.heic`, una foto muy grande, con espacios en el nombre); si la deja en otro formato (`producto.png` o `producto.webp`), corrige el nombre en el manifiesto. Por eso tú siempre escribes `"producto.jpg"`. **Después de correrlo, el nombre bueno es el que dejó él**: si vuelves a tocar el manifiesto (por ejemplo, al reescribir un clip que Omni rechazó), deja ese nombre como está y nunca lo "corrijas" de vuelta a `.jpg`, o el validador dirá que la foto no existe. **Lo corres tú**, apenas escribiste el manifiesto y antes de validarlo, si sabes dónde está la foto: la ruta que te dio el usuario, o la imagen que pegó en el chat (la lees en su ruta local), tal cual. Si no lo sabes, en el resumen del Paso final pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando, y córrelo tú apenas la tengas. Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. Ningún comando va en el mensaje del Paso final.

### G.6 — Chequeo antes de entregar

Repasa esto en silencio, además del Chequeo final. Si algo falla, corrígelo: no entregues un manifiesto roto.

1. ¿`estilo` es `"entrevista"`, `modo_audio` es `"dialogo_nativo"`, no hay campo `voz_en_off` y **todas** las tomas son `tipo: "H"`, una por clip, con el mismo número que su etiqueta?
2. ¿Cada `duracion` es 4, 6, 8 o 10, igual a la de la etiqueta del clip, y las palabras del clip están dentro de la guía de esa duración?
3. ¿Cada `linea` es exactamente los `texto` de su `dialogo` unidos en orden por un espacio, y cada `texto` aparece letra por letra dentro de su `prompt_video` (entre comillas, después de "Entrevistador:" o "[Ella / Él]…:")?
4. ¿`prompt_imagen_inicial` está en todos los clips y `prompt_imagen_final` es `null` en todos? ¿Ningún clip lleva `frame_inicial`? ¿Todos los clips llevan `ingredientes`, empezando por `"imagen"` y en el mismo orden en que la primera línea de su prompt de video nombra las imágenes (imagen 1, 2, 3)?
5. ¿Las `referencias` de cada clip existen en la lista, van en el orden en que su prompt de imagen las nombra, y el producto está en todos los clips donde se ve en cuadro, en `referencias` y en `ingredientes`? ¿En A ningún clip lleva `mano-mic` ni `producto` y todos los `ingredientes` son `["imagen"]`; en B todos llevan `mano-mic` en las dos listas?
6. ¿`entrevista.variante` es la elegida; `lado_iconos` es el contrario de `lado_mic`; `cta.texto` es el del briefing; en A `congelado.despues_de_toma` es el último clip del gancho y **todos** los clips posteriores llevan `solo_voz: true`; en B no hay `congelado` ni `solo_voz`?
7. ¿Cada frase ancla (`aparece_con`, `desaparece_con`, `check_con`, `sincroniza_con`) es un trozo literal de la `linea` de su clip (mismas mayúsculas, tildes y puntuación), aparece una sola vez en esa línea (contando solo las palabras: la puntuación, las tildes y las mayúsculas no la hacen distinta), y la frase de desaparición y la del check vienen después de la de aparición? ¿Cada `check_con` contiene la palabra de la opción elegida, la misma que está en `aparece_con`, y esa palabra no es una palabra vacía ("uno", "la", "de", "con")? ¿Ninguna respuesta del gancho es solo esa palabra: lleva una muletilla o una palabra más, y `check_con` la copia entera (sin contar la puntuación ni las mayúsculas, no se repite en la pregunta)?
8. ¿Cada `grupo` es único, cada `id` de icono empieza por `icono-` y es único en el anuncio, cada grupo tiene de 1 a 3 iconos y `elegido` (si no es `null`) es uno de ellos? ¿En A hay un grupo por pregunta, los dos primeros con `elegido` y `check_con`, el último con los dos en `null`; en B todos con `elegido` y `check_con` en `null`?
9. ¿En A cada clip `solo_voz` tiene al menos un B-roll con `encima_de_toma`, el primer B-roll ancla en las primeras palabras del primer clip de la historia, y entre dos frases ancla seguidas no hay más de unas 20 palabras? ¿Las duraciones de B-roll son enteras (5 los de la historia, 5 a 7 el de cierre)?
10. ¿El B-roll de cierre tiene `cierre: true` y `despues_de_toma` = el último clip, y es el único con `despues_de_toma`? ¿`sticker_producto` (el producto al centro) solo está en B, con la imagen del producto, y su frase es la marca o el nombre del producto tal como está en la `linea` de ese clip?
11. ¿`overlays` está vacío y no hay `musica`, `transiciones` ni `voz_en_off`?
12. ¿Cada prompt es idéntico, carácter por carácter, a su bloque de código del paquete?
13. ¿Todos los prompts de video llevan las líneas de NO fijas de su plantilla contra repetir y agregar ("Nadie repite palabras…", cada pregunta una sola vez, la última frase una sola vez) y, en B, las del entrevistador que le tocan a cada clip (la otra mano antes de la entrega; la cara y el cuerpo desde la entrega; en el clip de la entrega, la primera línea dice que del entrevistador solo se ven sus brazos, el del micrófono y el que entrega)? ¿Una respuesta de una sola palabra lleva su línea de "no dice ahm ni eh"?
14. ¿El producto se entrega cerrado, tal como viene (o con una unidad ya lista si se prueba), y en ningún prompt alguien lo abre, lo destapa, lo guarda o lo deja? ¿En el cierre de B la persona lo sigue sosteniendo, con su bolso como siempre?
15. ¿El B-roll de cierre deja el producto chico en la franja del medio, con aire arriba y abajo, la cámara quieta y sin personas ni manos? ¿Ningún B-roll desliza el producto ni tiene libros, teclados o pantallas con texto?
16. ¿La entrada del producto usa `"archivo": "producto.jpg"` (o el `producto.png` o `producto.webp` que dejó `preparar-producto`, si ya corrió: ese no se toca), y si no hay foto esa entrada no existe?
17. ¿El JSON es válido? Comillas dobles, sin comas colgando, saltos de línea como `\n`.

---

## Paso final — Pregunta cómo quiere producirlo

Ya armaste el paquete completo (ficha, guion, personajes, imagen de cada clip, prompts de video, iconos, B-roll y plan de montaje) y el manifiesto quedó guardado en `temp/[slug]/manifiesto.json`, con el chequeo G.6 pasado. **Nada de eso se muestra en el chat**: el paquete queda interno, en el manifiesto, y el manifiesto no se muestra nunca. **Ahora, y solo ahora, en el chat va solo esto: un resumen corto y la pregunta de cómo quiere seguir.**

**El resumen**, de 1 a 3 líneas: la variante (gancho callejero o entrevista completa), el producto, el mercado y el idioma, cuántos clips y cuántos B-roll, la duración aproximada y, en media línea, que el manifiesto quedó guardado y revisado. Si hay una decisión que conviene que sepa, va en UNA línea más (por ejemplo, "agregué 'Pagas al recibirlo' en el cierre por el pago contra entrega", o "el gancho va en dos clips porque las dos preguntas no entraban en 10 s"; si convertiste un guion de otro formato (Paso 0), esa línea dice en corto qué cambió, por ejemplo "tus afirmaciones pasaron a preguntas del entrevistador y el cierre es el de la variante"). Nada más: ni el guion, ni los prompts, ni el manifiesto.

No lo decidas tú: las tres salidas son legítimas y cuestan cosas distintas.

```markdown
[El resumen. Por ejemplo: **Entrevista callejera, gancho callejero**, para
[producto], [mercado] en [idioma]: [N] clips y [N] B-roll, unos [N] segundos.
El manifiesto quedó guardado y revisado.]
[Si hay una decisión que conviene que sepas, aquí, en una línea.]
[Solo si no sabes dónde está la foto del producto: "Pásame la foto del producto
(arrástrala al chat o dime la ruta) y la dejo lista."]

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero los personajes, la imagen de cada clip, los
clips, los iconos y los B-roll en Google Flow, reviso cada clip, armo el
montaje y te entrego el MP4 terminado. Las imágenes no gastan créditos; antes
de generar los videos te digo cuántos créditos de Flow van a usar.

**B) Genera solo las imágenes y los videos** — reviso cada clip y te dejo todo
en su carpeta (clips, iconos, B-roll), con un plan de montaje escrito para que
lo montes tú en CapCut a tu gusto. También te digo los créditos de los videos
antes de generarlos.

**C) Entrégame el paquete de prompts** — te paso aquí el paquete completo: el
guion clip por clip, los prompts de los personajes, los de la imagen y el
video de cada clip, los iconos, los B-roll y el plan de montaje, para que lo
revises o lo produzcas a mano. Después, si quieres, seguimos con A o B.
```

### Lo que vale en A y en B

**Las herramientas las pone el motor, y en esta versión todo se genera en Google Flow.** El motor arma la cola de cada trabajo (su modelo, su prompt exacto, sus referencias en orden, su duración) y tú lo generas en Flow. Las hojas (persona, calle, mano con el micrófono), la imagen de cada clip, las imágenes de los B-roll y los iconos salen de los modelos de imagen de Flow (Nano Banana Pro o Nano Banana 2.1, el que diga la cola), a 0 créditos; los iconos se piden cuadrados sobre fondo verde y `flow:recibir` les deja el fondo transparente. Cada clip hablado sale de Omni 1.1 Flash con sus ingredientes (la imagen del clip como frame inicial y, en B, la mano con el micrófono y la foto del producto donde sale); cada B-roll, también de Flow, mudo: `flow:recibir` le cambia el audio por silencio. Flow solo da videos de 4, 6, 8 o 10 s: la cola ya trae la duración de cada uno (un B-roll de 5 s se pide de 6, y el montaje lo ajusta a su ventana). **Los clips hablados no tienen otro modelo que los reemplace sin más**: usa el `respaldo` solo si la cola lo trae para ese trabajo; si no, y Omni no sale, para y dile al usuario por qué (abajo, "Si Omni falla en un clip").

**Cómo se generan las imágenes y los videos (el ciclo de Flow).** El motor no los pide a ninguna API: arma la lista de trabajo y recibe los archivos. El ciclo, igual para imágenes y para videos:

1. `npm run imagenes -- temp/[slug]` arma `flow/cola-imagenes.json` y hace solo lo que no necesita Flow.
2. Con la skill `flow-generacion` generas la cola en Google Flow (manejas Chrome con la extensión Claude in Chrome). Esa skill explica todo el procedimiento: la ventana aparte, subir las referencias, enviar todo, los reintentos y descargar cada archivo con el nombre del campo `descarga` de su trabajo en la cola (`<slug>__<nombre-sin-extensión>`, por ejemplo `mi-anuncio__toma-3-inicial`).
3. `npm run flow:recibir -- temp/[slug]` mueve lo descargado a `img/` o `video/`, lo convierte y lo verifica.
4. Repites 1 a 3 hasta que la cola diga que no queda nada: hay trabajos que esperan a otros (la imagen de cada clip lleva adjuntas las hojas) y entran en la vuelta siguiente.
5. Lo mismo con `npm run videos -- temp/[slug]` (`flow/cola-videos.json`).

**Para rehacer algo que ya está en `img/` o `video/`, primero sale a `historial/`**: la imagen y el clip de una toma, con `rehacer-toma --aplicar` (abajo); una hoja, un icono o un B-roll, a mano. Si es una hoja, también salen las `img/toma-N-inicial.png` de las tomas que la tienen en `referencias` (se hicieron con la hoja vieja), y sus clips si ya existen (rehacerlos cuesta créditos: espera el ok). Después, el ciclo normal **sin `--rehacer` en ningún comando**: `imagenes` y `videos` ponen en la cola solo lo que falta. No uses `npm run imagenes -- temp/[slug] --tomas N --rehacer`: manda a `historial/` y vuelve a pedir también las hojas de esa toma. (La línea que imprime `rehacer-toma` para volver a pedir un clip que sigue en `video/`, `npm run videos -- temp/[slug] --tomas N --sin-broll --rehacer`, sí sirve: saca a `historial/` solo ese clip al armar la cola. Se corre una vez: `flow:recibir` y la vuelta siguiente van sin `--rehacer`, porque si no `videos` vuelve a archivar lo recién llegado.) Corre `flow:recibir` cuando la descarga nueva ya esté en Descargas: si no la encuentra, la marca "falta" (la vieja quedó en `flow/descargas/recibidos/` y no se vuelve a usar). `flow:recibir --rehacer` sirve solo para cambiar un archivo ya recibido por otra descarga del mismo trabajo mientras la cola actual todavía lo lista (por ejemplo, en Flow preferiste otra versión después de recibir la primera).

**Las dos paradas que sí van, y que no se saltan nunca:**

1. **Los créditos de los videos, antes de mandarlos a Flow.** `npm run validar -- temp/[slug]/manifiesto.json` revisa el manifiesto; el número que manda no es un costo en dólares que pueda imprimir el validador, sino el de `npm run videos`. Las imágenes no esperan ningún sí por los créditos: en Flow cuestan 0. Cuando `npm run videos -- temp/[slug]` arma la cola, imprime cuántos videos son y la estimación de créditos de Flow: díselo al usuario (cuántos clips hablados, cuántos B-roll y los créditos) y espera su ok antes de mandar nada a Flow. Muéstrale la estimación tal como la imprime, también los largos que dice "sin medir" (en la entrevista suelen ser los clips de 10 s; los de 4, 6 y 8 s ya los suma el comando): no inventes una cifra para esos; el costo exacto de cada largo lo muestra el menú de ajustes de Flow (skill `flow-generacion`, sección 4). Sin ofrecer una versión más barata que quite clips o B-roll.
2. **La revisión de los clips, antes de montar.** Un clip que se ve no se puede acelerar ni cortar por dentro: si sale mal, solo se arregla rehaciéndolo, y rehacer después de ensamblar es rehacer todo el montaje.

Además de estas dos paradas, valen las que pone `flow-generacion` en el navegador, también con las imágenes: el permiso de cada tanda de descargas, mover el grupo de pestañas "Claude" a una ventana aparte, y el inicio de sesión, la verificación o el captcha, que hace el usuario.

**Las imágenes, antes de pagar los clips.** Cuando la cola de imágenes diga que no queda nada, míralas tú, en este orden (las hojas, apenas lleguen: si la primera vuelta deja las imágenes de los clips esperando a las hojas, revisa las hojas antes de la segunda vuelta): las hojas (`img/persona.png`: cuerpo entero, tres vistas, sin texto; `img/calle.png`: vacía, sin gente; `img/mano-mic.png`: la mano entrando por el lado pedido con el micrófono bien formado); la imagen de cada clip (`img/toma-N-inicial.png`: la misma persona de la hoja, la misma calle, el brazo con el mic en cuadro y del lado correcto, el producto idéntico a la foto donde toca y cerrado, del entrevistador nada más que sus brazos, nadie más, sin texto); los iconos (`img/icono-*.png`: que sean lo que son, de un vistazo; `img/log-modelos.json` dice de cada uno si salió con transparencia real, y si no, el motor lo muestra en una tarjeta blanca: no es un defecto; si el motor le tapó una mancha semitransparente de adentro, también lo anota ahí, y la original queda en `historial/`); y las imágenes de B-roll (`img/broll-N.png`: nadie mirando a cámara, el producto idéntico a la foto, sin texto ni objetos con letras inventadas; el de cierre, con el producto chico en la franja del medio y aire arriba y abajo). Si una hoja salió mal, rehazla antes de seguir (en Flow no gasta créditos; sácala a `historial/` con las imágenes de clip que ya la usaron, como dice "Para rehacer" arriba) y cuéntaselo al usuario: todo lo que esté ahí se repite en cada clip. Si la mano salió del lado equivocado, voltéala (bloque Personajes) sin pagar nada. Si una imagen de clip o de B-roll salió mal, se rehace esa (sin créditos, por el mismo ciclo de Flow, después de sacarla a `historial/`) con su prompt corregido antes de pagar el clip. **Si `flow:recibir` avisa que hay iconos sin revisar los huecos** (casi siempre porque falta Python o sus paquetes, Pillow y numpy), esos iconos quedaron como vinieron, sin tapar. Ese aviso no trae el comando para instalarlos: lo imprime `npm run imagenes -- temp/[slug] --tapar-huecos` (no genera nada: solo tapa los huecos de los iconos que ya están en `img/`) cuando todavía no puede. Dale al usuario el comando de instalación que imprime, tal cual (sale para el Python que encontró: `python -m pip install --user pillow numpy`, o `py -3 -m pip install --user pillow numpy` si ese es el que hay; sin ningún Python, primero hay que instalar Python 3) y que lo compruebe con `npm run verificar` (sección 8); si en cambio dice que ese Python ya tiene Pillow y numpy, no hay nada que instalar: el problema es el error que muestra arriba. Cuando esté resuelto, vuelve a correr `npm run imagenes -- temp/[slug] --tapar-huecos`. Si está todo bien, sigue sin preguntar.

**La revisión de cada clip — obligatoria.** No te fíes de la tabla de palabras: sirve para escribir bien a la primera, no garantiza nada. Con cada clip generado:

- **Fotogramas** (`npm run frames -- temp/[slug]`, quedan en `qa/`): una tira de cinco por clip (inicio, cuarto, mitad, tres cuartos, final), también de los B-roll. Míralos todos. ¿Es la misma persona que en la hoja, en todos los fotogramas y en todos los clips? ¿Es la misma calle? ¿El brazo con el micrófono está en cuadro, del lado correcto, y del entrevistador no se ve nada más (ni su otra mano antes de la entrega, ni su cara o su cuerpo al entregar)? ¿El producto es idéntico a la foto, hay uno solo, con la etiqueta legible, y sigue cerrado: nadie lo abre, lo guarda, lo suelta ni se le cae? ¿Hay texto en pantalla que no sea la etiqueta? ¿Aparece una persona de más? ¿Algo aparece o desaparece sin una acción? ¿La persona mira al entrevistador y no al lente? En los clips de la historia de A, lo único que importa es que no haya nada raro que se cuele en el audio (otra voz): el video no se ve. En los B-roll: ¿nadie mueve los labios, no hay texto, el producto es el de la foto y no se deslizó?
- **Transcripción** (`npm run lineas -- temp/[slug]`): transcribe cada clip hablado y lo compara con su `linea`; imprime, por clip, si dijo todo (`dijo_todo`), qué palabras faltan, si está limpio (`limpio`) y, si no, qué se oyó de más entre la primera y la última palabra del guion (`agregadas`), y si hay voz después de la última palabra del guion. ¿Dijo todo el guion del clip, en orden, sin cortar palabras, sin cambiarlas y sin saltarse ninguna, y cada voz dijo lo suyo? ¿Está limpio? **Cualquier palabra repetida, trabada, cambiada o agregada es un defecto**, también una muletilla que no está en el guion ("Ahm", "eh", una pregunta repetida, el remate dicho dos veces). Nunca decidas que "suena natural". **La única excepción la decide el motor, no tú**: una palabra de una sola letra ("a", "y", "e", "o", "u", sin importar tildes, mayúsculas ni puntuación) dicha dos veces seguidas, con las dos juntas en menos de 0,2 s y menos de 0,15 s de pausa entre ellas. Esa no ensucia el clip: `lineas` la deja en `toleradas` (no en `agregadas`), la cabecera de la toma dice "LIMPIO (con 1 repeticion tolerada)", debajo sale `tolerada (repeticion de una letra, 0.16 s): "y, y" (3.20s): revisa a oido si quieres`, y al final las junta todas en "REPETICIONES TOLERADAS"; `lineas --solo-plan` y el plan también la avisan. No se regenera, pero **siempre se la informas al usuario, con su clip y su segundo**, para que la escuche: si al oírla prefiere rehacer el clip, se rehace como cualquier otro, con su costo. Todo lo demás sigue siendo un defecto que se regenera, aunque se parezca: una palabra de dos letras o más dicha dos veces ("en, en"), una frase repetida, una trabada, una muletilla, una letra agregada o cambiada (no repetida), la misma letra tres veces, o dos veces pero más lenta o con más pausa. Tú no toleras nada por tu cuenta: si `lineas` dice NO ESTA LIMPIO, se regenera. **No son defecto** las diferencias que son solo de escritura (el motor ya las iguala al comparar): un número escrito con cifras o con letras ("11" / "once", "60" / "sesenta"), un símbolo de precio ("$", "S/"), un "%" dicho "por ciento", una palabra junta o separada ("superbién" / "super bien"), las tildes y las mayúsculas, la marca mal escrita por el transcriptor, o una muletilla que sí está en el guion. Pero **un "%" escrito se tiene que oír**: "ahorra 30" no es "ahorra 30 %", así que sin su "por ciento" ("percent" en inglés, "por cento" en portugués) el clip no está limpio; la moneda escrita con símbolo sí puede no decirse ("$29" dicho "veintinueve" está bien). Y un número dicho a medias ("49.90" oído "cuarenta y nueve") no es escritura: no lo dijo. Lo que se oye **después** de la última palabra del guion tampoco es defecto: el recorte corta en esa palabra. **Una medida de antes de la revisión** (un clip medido cuando todavía no se revisaba el habla) no se da por buena ni por sucia a ciegas: `npm run lineas -- temp/[slug] --solo-plan` y el plan la revisan sobre la transcripción guardada, sin créditos, y la marcan "segun la transcripcion guardada"; un "NO ESTA LIMPIA segun la transcripcion guardada" vale igual que cualquier otro: ese clip se regenera, avisando el costo. **Una medida vieja se vuelve a medir**: si `lineas`, `voz` o el plan dicen "la medida de toma N es de otro clip", ese clip cambió después de medirlo (se regeneró); corre el comando que imprimen, `npm run lineas -- temp/[slug] --tomas N`, antes de seguir.
- **Iconos**: ya revisados con las imágenes; aquí solo confirma que cada grupo tiene sus archivos en `img/`.

**Un clip que no está limpio se regenera, siempre.** No le preguntas al usuario si lo deja pasar: le avisas qué clip, qué se oyó de más y cuánto cuesta rehacerlo, y lo rehaces con la línea de NO que ataca ese fallo (abajo). Hasta 3 veces por clip; si a la tercera sigue sin salir limpio, para y muéstrale las tres transcripciones antes de seguir.

Al terminar, muéstrale al usuario la revisión clip por clip y dónde están los archivos, con cada repetición tolerada aparte (su clip, su segundo y que la revise a oído), y espera su visto bueno antes de montar. Si alguno falla por otra cosa (el fotograma, o la frase que no se dijo), dile cuál, qué falló y cuánto cuesta rehacerlo, y espera el sí. **El diálogo no se toca**: si un clip salió con otra cara, con texto en pantalla, con una persona de más, mirando al lente, con el producto abierto o guardado, con la otra mano o la cara del entrevistador, con palabras cortadas, repetidas, cambiadas o agregadas, o apurado, falló la tirada o la instrucción de la imagen o del video, no el guion. Una toma hablada se rehace con prompts corregidos (los de la imagen y del video, ajustando lo que falló en la acción o en la lista de NO, con el diálogo idéntico letra por letra y la misma duración). Las líneas de NO que funcionan para cada fallo:

- repite o cambia el remate → "[Ella / Él] dice su última frase una sola vez, con esas mismas palabras, y no repite nada después." y, si se ríe, "se queda [riendo] en silencio hasta el final";
- repite o agrega palabras en medio → "Nadie repite palabras ni agrega palabras que no están en el diálogo." y "El entrevistador hace cada pregunta una sola vez, de corrido, sin repetirla.";
- agrega un "ahm" a una respuesta de una palabra → "[Ella / Él] dice solo esa palabra y se queda callada: no dice "ahm", "eh" ni nada más.";
- se ve la otra mano del entrevistador → "La otra mano del entrevistador no aparece: solo se ve la mano con el micrófono.";
- se le ve la cara o el cuerpo al entregar → "La cara y el cuerpo del entrevistador nunca entran en cuadro: al entregar [el producto] solo entra su brazo por el borde.";
- abre o guarda el producto → "Solo hay un [producto], y sigue cerrado todo el clip: nadie lo abre." y "[Ella / Él] no suelta [el producto], no lo guarda y no se le cae."

```
node produccion/rehacer-toma.js temp/[slug] --toma N --contexto        muestra los prompts actuales, el diálogo y los clips vecinos
   ... escribes nuevos.json con prompt_imagen_inicial y prompt_video corregidos ...
node produccion/rehacer-toma.js temp/[slug] --toma N --aplicar nuevos.json   guarda los anteriores, saca el clip y la imagen (quedan en historial/) y borra su medición de lineas-habladas.json
npm run imagenes -- temp/[slug] --tomas N                                arma la cola con la imagen del clip (0 créditos en Flow)
   ... skill flow-generacion: generarla en Flow y descargarla con su nombre ...
npm run flow:recibir -- temp/[slug]                                     sin --rehacer: la imagen vieja ya está en historial/
npm run videos   -- temp/[slug] --tomas N                                arma la cola con el clip, con los mismos ingredientes; lo demás ya existe y no entra
   ... skill flow-generacion: generarlo en Flow y descargarlo con su nombre ...
npm run flow:recibir -- temp/[slug]                                     sin --rehacer: el clip viejo ya está en historial/
npm run frames   -- temp/[slug]
npm run lineas   -- temp/[slug] --tomas N
   ... se revisa de nuevo, como cualquier clip ...
npm run voz      -- temp/[slug] --tomas N                                SOLO si es un clip de la historia de A
npm run lineas   -- temp/[slug] --tomas N                                SOLO historia de A: OTRA VEZ, la voz cambió de tiempos
```

Si la imagen del clip estaba bien y solo cambia el video (lo normal cuando el fallo es de palabras), `nuevos.json` lleva el mismo `prompt_imagen_inicial` de siempre, y antes de correr `imagenes` copias la imagen desde `historial/` de vuelta a `img/toma-N-inicial.png`: el motor se la salta porque ya existe, y no entra en la cola (no hace falta generarla otra vez en Flow). Los `ingredientes` de la toma no cambian. Al regenerar el clip, el motor le quita su medida vieja: por eso `lineas` vuelve a medirlo. Si el clip rehecho es de la historia de A, después de revisarlo pasa por `voz` **con `--tomas N`** (toma el clip nuevo como original) y se mide otra vez con `lineas -- … --tomas N`: `rehacer-toma` te imprime esos dos comandos. El paso `voz` se puede repetir sin daño: los clips que ya procesó se los salta (los reconoce por el tamaño del archivo; solo `--forzar` los vuelve a procesar), y al final imprime el comando exacto de `lineas` con las tomas que procesó: córrelo tal cual. Si ya habías planeado, sigue con plan → subtítulos → plan: los bordes del clip cambiaron, y si no lo haces el plan avisa que `subtitulos.json` es de un plan anterior.

Si vuelve a fallar, se lo dices otra vez, con el costo. Un B-roll o un icono que salió mal se rehace igual, con su prompt corregido en el manifiesto (saca el archivo a `historial/` y vuelve a pasar por el ciclo de Flow con `imagenes` y `videos`, sin `--rehacer`: la cola trae solo lo que falta).

**Si Omni falla en un clip.** En Flow lo ves tú: el clip no sale y Flow muestra un aviso. La skill `flow-generacion` ya reintenta el mismo prompt las veces que dice (hasta 4, sin tocar nada); si aun así no sale, vuelve aquí y mira de qué tipo es el aviso. **En este estilo no se cambia ningún prompt solo en la caja de Flow**, aunque `flow-generacion` (sección 6, paso 2) lo diga para otros trabajos: el prompt que se pega es el de la cola, que sale del manifiesto, y `lineas` compara lo que se oye con la `linea` del manifiesto. Todo cambio va primero al manifiesto, y después se vuelve a armar la cola. Son dos fallos distintos y no se arreglan igual:

- **Fallo del servicio** (algo salió mal, inténtalo más tarde, se queda cargando, servidor ocupado): **no es un rechazo de contenido, y no se toca nada**, ni el copy ni el manifiesto. Espera unos minutos y vuelve a enviar ese trabajo de la cola: lo ya descargado no se vuelve a generar. Si sigue fallando igual, Flow u Omni está caído: avísale al usuario que es una caída del servicio y no un problema de su anuncio, y reintenta cada 15 minutos.
- **Rechazo de contenido** (el aviso habla de políticas, seguridad o contenido sensible: policy, safety, sensitive, prohibited, moderation…; casi siempre en salud y suplementos): insistir con el mismo prompt fallaría igual. Reescribe **solo el diálogo de ese clip**, con su misma función en el guion, su misma duración y sus palabras dentro de la guía. Cambia solo la frase que dispara el rechazo (una promesa de cura, el nombre de una enfermedad, una cifra de kilos) por otra que diga lo mismo con otras palabras. Antes, recibe con `flow:recibir` lo que sí salió de esa cola (al volver a armarla, lo que no esté en ella ya no se reconoce). Actualiza en el manifiesto `dialogo`, `linea` y `prompt_video` de ese clip, y toda frase ancla de iconos, del producto al centro (`sticker_producto`) o de B-roll que apuntara a las palabras que cambiaste, y anota el cambio en `flow/cambios-de-prompt.md`, como pide `flow-generacion`; valida con `npm run validar`, y vuelve a intentar con `rehacer-toma.js --toma N --aplicar nuevos.json` (en `nuevos.json` van el mismo `prompt_imagen_inicial` de siempre, sin cambios, y el `prompt_video` nuevo, el que ya lleva el diálogo reescrito: el motor exige los dos y saca a `historial/` la imagen y el clip), después el ciclo de Flow con `npm run imagenes -- temp/[slug] --tomas N` y `npm run videos -- temp/[slug] --tomas N` (cada uno: cola, `flow-generacion` y `flow:recibir`). La imagen que ya estaba bien no hace falta generarla otra vez: cópiala desde `historial/` de vuelta a `img/toma-N-inicial.png` antes de correr `imagenes`, y el motor se la salta porque ya existe. Después sigue como con cualquier clip rehecho (frames, `lineas --tomas N`, la revisión y, si es de la historia de A, `voz` y `lineas` con `--tomas N`). No le preguntas antes: sin ese cambio el clip no existe. Vale también para un guion ganador: es la única excepción a no tocar su texto.
- **Hasta 3 reescrituras.** Si a la tercera Omni sigue rechazándolo, para y avísale al usuario: qué frase probaste en cada intento y qué motivo dio. No sigas sin él.
- **Si no queda claro de qué tipo es** (Flow muestra un aviso genérico), léelo tú: si habla de políticas o de contenido, es un rechazo; si no, trátalo como fallo del servicio (volver a enviar sin tocar nada), y si vuelve a fallar con el mismo aviso, avísale al usuario con el texto exacto que muestra Flow.
- **Los B-roll** (y los iconos) se tratan igual: un fallo del servicio, esperar y volver a enviar sin tocar nada; uno rechazado por contenido se arregla igual que un clip: solo su prompt de imagen o de video, sin tocar el guion, cambiado en el manifiesto (`prompt_imagen` o `prompt_video` del B-roll, `prompt` del icono) y no en la caja de Flow, anotado en `flow/cambios-de-prompt.md`, y la cola vuelta a armar.

**Nunca aceleres un clip que se ve** (deforma la voz y rompe la sincronización de labios), y nunca le pidas otra duración (en Flow se elige la que dice la cola): la duración de un clip está atada a su diálogo, y se cambia solo en el manifiesto. **La única excepción la hace el motor**: en la A, la voz de la historia (los clips `solo_voz`, que no se ven) va sin los silencios de adentro y a 1,2x, video y audio, con el paso `voz`. El original de cada uno queda en `video/originales/`, y el paso siempre parte de él.

**Un proceso pesado a la vez.** Corre los comandos de a uno, esperando que cada uno termine: nunca dos al mismo tiempo, y menos `voz` o `ensamblar`, que trabajan con video en tu máquina. Si la máquina tiene poca memoria libre, o el render falla con "No frame found at position", corre `ensamblar` con `--concurrencia 1`: tarda más y sale bien. Cada render tarda varios minutos por versión.

### Si elige A — el anuncio completo

Sigue este orden de principio a fin, de a un comando por vez, **sin pararte a preguntar entre comando y comando** fuera de las dos paradas (y de lo que `flow-generacion` pide en el navegador: el permiso de cada tanda de descargas, también la de las imágenes, la ventana aparte, o un inicio de sesión o un captcha, que hace el usuario). El usuario ya dijo que sí: pedirle permiso en cada paso es hacerle perder el tiempo.

**Variante A** (gancho callejero):

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug]   la foto (G.5), si hay foto y no se hizo
npm run validar   -- temp/[slug]/manifiesto.json      revisa el manifiesto (las imágenes no esperan el ok de créditos)
npm run imagenes  -- temp/[slug]                      arma la cola: hojas, imagen de cada clip, iconos e imágenes de B-roll
   ... skill flow-generacion: generar la cola en Google Flow y descargar cada archivo con su nombre ...
npm run flow:recibir -- temp/[slug]                   mueve, convierte y verifica lo descargado
   ... la primera vuelta trae las hojas: revisarlas (arriba) antes de la segunda vuelta ...
   ... repetir imagenes -> Flow -> flow:recibir hasta que la cola diga que no queda nada ...
   ... mirar las imágenes (arriba) ...
npm run videos    -- temp/[slug]                      arma la cola: los clips hablados (Omni, por ingredientes) y los B-roll
   ... cuántos clips y cuántos créditos imprime -> PARADA 1: esperar el ok ...
   ... skill flow-generacion: generar la cola en Google Flow y descargar cada archivo con su nombre ...
npm run flow:recibir -- temp/[slug]                   mueve, convierte y verifica lo descargado
   ... repetir videos -> Flow -> flow:recibir hasta que la cola diga que no queda nada ...
npm run frames    -- temp/[slug]                      cinco fotogramas por clip, en qa/
npm run lineas    -- temp/[slug]                      transcribe cada clip: ¿dijo todo?, ¿está limpio?
   ... revisión de cada clip; un clip no limpio se rehace -> PARADA 2 ...
npm run voz       -- temp/[slug]                      la voz de la historia (solo_voz): sin silencios de adentro y a 1,2x
npm run lineas    -- temp/[slug] --tomas [las que imprime voz, p. ej. 2,3,4]   OTRA VEZ: la voz cambió de tiempos
npm run plan      -- temp/[slug]
node produccion/subtitulos-dialogo.js temp/[slug]     los subtítulos de un anuncio hablado
npm run plan      -- temp/[slug]                      OTRA VEZ: no es un error
npm run ensamblar -- temp/[slug]                      (--concurrencia 1 si hay poca memoria libre)
```

**Variante B** (entrevista completa): igual, sin el paso `voz` ni la segunda medición.

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug]   la foto (G.5), si hay foto y no se hizo
npm run validar   -- temp/[slug]/manifiesto.json      revisa el manifiesto (las imágenes no esperan el ok de créditos)
npm run imagenes  -- temp/[slug]                      arma la cola: hojas, imagen de cada clip, iconos e imágenes de B-roll
   ... skill flow-generacion: generar la cola en Google Flow y descargar cada archivo con su nombre ...
npm run flow:recibir -- temp/[slug]                   mueve, convierte y verifica lo descargado
   ... la primera vuelta trae las hojas: revisarlas (arriba) antes de la segunda vuelta ...
   ... repetir imagenes -> Flow -> flow:recibir hasta que la cola diga que no queda nada ...
   ... mirar las imágenes (arriba) ...
npm run videos    -- temp/[slug]                      arma la cola: los clips hablados (Omni, por ingredientes) y el B-roll de cierre
   ... cuántos clips y cuántos créditos imprime -> PARADA 1: esperar el ok ...
   ... skill flow-generacion: generar la cola en Google Flow y descargar cada archivo con su nombre ...
npm run flow:recibir -- temp/[slug]                   mueve, convierte y verifica lo descargado
   ... repetir videos -> Flow -> flow:recibir hasta que la cola diga que no queda nada ...
npm run frames    -- temp/[slug]                      cinco fotogramas por clip, en qa/
npm run lineas    -- temp/[slug]                      transcribe cada clip: ¿dijo todo?, ¿está limpio?
   ... revisión de cada clip; un clip no limpio se rehace -> PARADA 2 ...
npm run plan      -- temp/[slug]
node produccion/subtitulos-dialogo.js temp/[slug]     los subtítulos de un anuncio hablado
npm run plan      -- temp/[slug]                      OTRA VEZ: no es un error
npm run ensamblar -- temp/[slug]                      (--concurrencia 1 si hay poca memoria libre)
```

**`voz` va después de la revisión y antes del plan** (solo en A): corta cada clip de la historia en sus palabras (0,12 s antes de la primera, 0,25 s después de la última del guion), le quita los silencios de adentro (los de 0,18 s o más, dejando un poco de aire) y lo acelera a 1,2x, video y audio, sin cambiar el tono. Los tiempos de cada palabra cambian, por eso `lineas` vuelve a medir esos clips: al terminar, `voz` imprime el comando exacto de `lineas` con las tomas que procesó, y ese es el que corres. El plan y los subtítulos se arman con esa medida. Se puede correr otra vez sin daño: los clips que ya procesó se los salta (los reconoce por el tamaño del archivo; solo `--forzar` los vuelve a procesar), y siempre parte del original guardado en `video/originales/`. Los clips que se ven (el gancho, y toda la B) no pasan por `voz`: el plan los corta en las palabras sin tocar el archivo.

**El plan corre dos veces**: plan → subtítulos → plan → ensamblar. La primera pasada ubica los iconos, el check, el producto al centro y los B-roll estimando dónde cae cada frase; la segunda los coloca con los tiempos reales de los subtítulos (el check en la palabra elegida, los subtítulos al medio durante el gancho de A). En A, además, el congelado suma 0,8 s al anuncio: por eso los subtítulos salen de un plan que ya lo tiene. `subtitulos.json` guarda la línea de tiempo del plan con el que se hizo: si después cambian los bordes de un clip (se rehízo o se volvió a medir) o el congelado, el plan avisa que `subtitulos.json` es de un plan anterior; vuelve a correr `node produccion/subtitulos-dialogo.js temp/[slug]` y `npm run plan`. Si te saltas la segunda pasada, el montaje queda con las estimaciones y una versión de menos, y `ensamblar` termina bien: es fácil no notarlo. Los subtítulos de este estilo salen de `subtitulos-dialogo.js`, que alinea la `linea` de cada clip con lo que se oye (reusa la transcripción de `lineas`); `npm run subtitulos` es el de voz en off y pide una pista de voz que aquí no existe.

**No hay música ni archivo de transiciones en este estilo.** El motor no busca pista, no avisa que falta y no lee `transiciones.json`: el fundido de la B, el congelado con glitch de la A, el check, el clic y sus sonidos los pone él por el manifiesto. No corras `npm run musica`. (En esta versión kie.ai solo cobra la música y las canciones: este estilo no gasta nada ahí.)

**Al final, entrégale los MP4** (dos versiones: con subtítulos y sin subtítulos, en `output/`) **y el informe**, en tres apartados:

- **Lo que salió bien**: los clips que pasaron la revisión a la primera (misma persona, misma calle, el micrófono bien, el producto y la etiqueta bien, el guion completo), los iconos que salieron con transparencia, y lo que funcionó mejor de lo esperado.
- **Decisiones del montaje**: la duración real (como dato), dónde cayó el congelado, en qué palabra cayó cada check (A), cuánto silencio se le sacó a la voz de la historia y que va a 1,2x (A), cómo quedó cada B-roll (desde qué frase hasta cuál, si se ralentizó o congeló el final), qué iconos se mostraron recortados y cuáles en tarjeta, si el motor le tapó un hueco a algún icono (o si quedó sin tapar porque faltaba Python), dónde apareció el producto al centro (B), el fundido entre clips, cada repetición tolerada que quedó en el anuncio (su clip y su segundo, para que la escuche), y lo que decidiste tú sin consultar.
- **Lo que salió mal**, clip por clip: qué falló en la revisión, qué se rehízo (también cada clip que no salió limpio: qué palabra repitió o agregó, y cuántas veces se rehízo) y cuántos créditos de Flow usó; cada rechazo de Omni, con la frase original, la que la reemplazó y el aviso de Flow; las caídas del servicio, si las hubo (cuánto duraron); fotogramas negros o tramos congelados, si los hubo. Si queda vacío, se dice que quedó vacío: eso es información.

Y al final, el **costo real** en créditos de Flow (los clips, los B-roll y lo rehecho; las imágenes y los iconos no gastan créditos). Ahí él decide si quiere ajustar algo.

**Y ten cuidado con qué llamas "lo que salió mal".** El motor imprime avisos —un clip con palabras fuera de la guía, una ventana de B-roll larga, un icono sin transparencia que va en tarjeta, un ancla estimada por posición en la primera pasada del plan— y **eso no son fallos: es el montaje funcionando.** Ponlos en las decisiones del montaje, no como defectos.

Defectos de verdad hay pocos y son medibles: otra cara, otra calle, el micrófono del lado equivocado o ausente, la otra mano o la cara del entrevistador en cuadro, texto en pantalla, una persona o un producto de más, el producto abierto, con la tapa aparte, guardado o caído, palabras del guion que no se dijeron o se cortaron, palabras repetidas, trabadas, cambiadas o agregadas (una repetición tolerada no es defecto: va en las decisiones del montaje), la persona mirando al lente, fotogramas negros, un B-roll con alguien hablando, o la etiqueta ilegible. Eso sí va en "lo que salió mal", y lo que es de palabras ya se rehízo antes de montar.

**La duración NO es un defecto.** Si el usuario esperaba 40 segundos y salieron 46, eso está bien y no se corrige. **Nunca cortes una línea del guion, quites un clip o un B-roll ni inventes copy para llegar a un número**, y no se lo ofrezcas al usuario como opción. El anuncio dura lo que necesita durar. Menciónalo como dato, sin pedir disculpas.

### Si elige B — solo las imágenes y los videos

Corre la generación, revisa cada clip igual que en A (un clip no limpio se rehace igual), prepara la voz y el plan, y **párate antes de ensamblar**. Los mismos comandos que en A, de a uno, hasta la segunda pasada del plan, y en lugar de `ensamblar`, el plan para humanos:

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug]   la foto (G.5), si hay foto y no se hizo
npm run validar     -- temp/[slug]/manifiesto.json    revisa el manifiesto
npm run imagenes    -- temp/[slug]                    arma la cola de imágenes
   ... skill flow-generacion: generar la cola en Google Flow y descargar cada archivo con su nombre ...
npm run flow:recibir -- temp/[slug]
   ... la primera vuelta trae las hojas: revisarlas antes de la segunda vuelta, igual que en A ...
   ... repetir imagenes -> Flow -> flow:recibir hasta que la cola diga que no queda nada ...
   ... mirar las imágenes, igual que en A ...
npm run videos      -- temp/[slug]                    arma la cola de videos: clips y créditos -> esperar el ok
   ... skill flow-generacion: generar la cola en Google Flow y descargar cada archivo con su nombre ...
npm run flow:recibir -- temp/[slug]
   ... repetir videos -> Flow -> flow:recibir hasta que la cola diga que no queda nada ...
npm run frames      -- temp/[slug]
npm run lineas      -- temp/[slug]
   ... revisión de cada clip, igual que en A ...
npm run voz         -- temp/[slug]                    solo variante A
npm run lineas      -- temp/[slug] --tomas [las que imprime voz]   solo variante A, OTRA VEZ
npm run plan        -- temp/[slug]
node produccion/subtitulos-dialogo.js temp/[slug]
npm run plan        -- temp/[slug]                    OTRA VEZ: con los tiempos reales
npm run plan:humano -- temp/[slug]
```

El último deja `plan-montaje.txt` en la carpeta del anuncio: los clips en orden con el segundo exacto donde se corta cada uno, el congelado (A), la cadena de B-roll con la frase donde entra cada uno, los iconos con su frase de entrada y de salida, dónde van y en qué palabra cae el check, el producto al centro con su frase (B), los sonidos (el check, el glitch, el clic), el fundido entre clips (B) y el texto del llamado a la acción sobre el cierre. **Está escrito para que lo lea una persona**, y es lo que necesita para montarlo en CapCut sin adivinar nada.

Dile dónde quedó todo: los clips en `video/toma-1.mp4`, `toma-2.mp4`… en orden (en A, los de la historia ya sin silencios y a 1,2x; los originales, en `video/originales/`); los B-roll en `video/broll-N.mp4`; los iconos en `img/icono-*.png`; los sonidos en `efectos/` (`check.mp3`, el check de A; `congelado.mp3`, el glitch del congelado; `clic.mp3`, el clic de los iconos y del producto en B); y la transcripción con los tiempos de cada palabra en `lineas-habladas.json`. Y recuérdale lo de CapCut:

- **En A**: congelar el último cuadro del gancho 0,8 s con un golpe de glitch (un acercamiento corto, una sacudida, los colores separados y el negativo en dos golpes) y el sonido `congelado.mp3`; usar solo el audio de los clips de la historia y cubrirlos con los B-roll en orden; los iconos de cada pregunta en pareja, uno a cada lado de la persona, y el check con `check.mp3` debajo del elegido, justo en la palabra que elige; subtítulos al medio de la pantalla durante el gancho y abajo desde el congelado.
- **En B**: un fundido corto entre clips; los iconos de a uno, en el centro sobre el pecho, con `clic.mp3` al aparecer cada uno; la foto del producto igual, al centro con el clic, cuando el entrevistador lo nombra; subtítulos abajo.
- **En los dos**: cortar cada clip 0,12 s antes de la primera palabra y 0,25 s después de la última del guion (el último del gancho de A, 0,8 s), **nunca acelerar ni cortar por dentro un clip que se ve**, subtítulos con palabra resaltada, sin música, y el llamado a la acción con una flecha sobre el B-roll de cierre.

### Si elige C — el paquete en el chat

Entrégale el paquete **completo**, nunca una muestra ni "¿quieres que te dé el resto?", con los bloques y el formato de "Formato de entrega", en ese orden y con esos nombres: Ficha del anuncio · Guion · Personajes · Imagen de cada clip · Prompts de video · Iconos del gancho y B-roll de la historia (A) o Iconos de las menciones y El producto al centro (B) · B-roll de cierre · Plan de montaje. Cada prompt en su propio bloque de código, completo. **Sin el manifiesto**: ni el bloque `json` ni su contenido.

**Lo que muestras se copia del manifiesto, carácter por carácter**: es la fuente de verdad. Cada línea del guion (de `dialogo`) y cada prompt (de los personajes, de la imagen y del video de cada clip, de los iconos y de los B-roll) salen de su campo en `temp/[slug]/manifiesto.json`, con los `\n` vueltos saltos de línea y las `\"` vueltas comillas. No los reescribas de memoria: si difieren en un carácter, el usuario revisa un anuncio que no es el que se va a generar en Flow. Lo que no tiene campo propio en el manifiesto (la Ficha del anuncio, las etiquetas y notas del Guion y el Plan de montaje) tampoco va de memoria: lo armas a partir de él (`duracion` y `fase` de cada clip, `solo_voz`, `congelado`, las frases ancla de iconos, del producto al centro y de B-roll, `sticker_producto`, `cta`, cuántos clips, iconos y B-roll hay), para que diga lo mismo que el motor va a montar.

**Si pide cambios**, se hacen en el manifiesto: lo que pidió y todo lo que depende de eso (si cambia una línea, su `dialogo`, su `linea`, el `prompt_video` que la lleva, la duración si ya no entra, y toda frase ancla de iconos, del producto al centro o de B-roll que apuntaba a esas palabras). Repasa G.6, valida con `npm run validar -- temp/[slug]/manifiesto.json` (si la foto del producto todavía no pasó por G.5, el error de que falta ese archivo es esperable y no es del cambio) y muéstrale lo que cambió, copiado del manifiesto ya corregido.

Al final, ofrécele seguir con A o con B, o dejarlo ahí: el manifiesto ya está listo para que el motor arme las colas de Flow con exactamente lo que vio. Si elige A o B, sigue con su sección, desde el principio.

**Si en cualquier momento pide ver el paquete o una parte** ("muéstrame el guion", "pásame los prompts del clip 3"), muéstrale esa parte, copiada del manifiesto igual que en la opción C y nunca el manifiesto en sí. Si después pide cambios, van igual: al manifiesto, y se vuelve a validar.

---

## Reglas que nunca se rompen

- Nunca más de dos pausas antes del paquete: el briefing y la variante. Después, todo de un tiro: el paquete y el manifiesto (en su archivo), y en el chat solo el resumen corto y la pregunta A/B/C.
- Nunca escribas el guion antes de tener las respuestas del briefing y la variante elegida.
- Nunca una entrega a medias: cuando se entrega el paquete (opción C, o si lo pide), va completo, nunca una muestra ni "¿quieres que te dé el resto?".
- Nunca el manifiesto en el chat: es interno del sistema, ni siquiera va en la opción C.
- Nunca inventes ciudad, género, edad, quién es la persona, idioma ni llamado a la acción: todo sale del briefing.
- Nunca una foto de una persona real como la persona entrevistada: siempre generada con IA desde su hoja de personaje. La única foto real es la del producto.
- Nunca reutilices copy, cifras ni ángulos de otros anuncios, ni los ejemplos de esta skill.
- Nunca el producto antes de su momento, y nunca la marca en boca de la persona en la B.
- Nunca un clip de otra duración que 4, 6, 8 o 10 s, ni más de 10: lo que no entra se parte en un corte de idea completa.
- Nunca un clip con palabras de más (corta) ni de menos (desperdicia): se corrige con la duración del clip o moviendo el corte, nunca rellenando ni recortando el guion.
- Nunca una pregunta del entrevistador de más de una oración, ni la persona repitiendo sus palabras.
- Nunca una voz hecha aparte: toda voz sale de un clip generado, también el cierre del entrevistador y la historia de la A.
- Nunca una imagen de clip sin los personajes adjuntos, ni un clip sin sus ingredientes, ni un producto en un clip sin estar en su imagen y en sus ingredientes con la foto real.
- Nunca un producto que se abre, se destapa, se desenvuelve, se guarda o se deja en cámara: se entrega listo, tal como viene (y, si se prueba, con una unidad ya lista), y quien lo recibe lo sostiene a la vista hasta el final.
- Nunca la cara ni el cuerpo del entrevistador en cuadro, ni su otra mano antes de la entrega.
- Nunca dejes pasar un clip con una palabra repetida, trabada, cambiada o agregada: se regenera, avisando el costo, hasta 3 veces. La única que no se regenera es la que `lineas` marca "tolerada" (una palabra de una letra dicha dos veces, muy rápido y sin pausa); esa se le informa siempre al usuario, con su clip y su segundo. Tú no toleras nada por tu cuenta.
- Nunca una respuesta de opción del gancho sin la palabra de la opción que elige, ni que sea solo esa palabra: lleva una muletilla o una palabra más.
- Nunca un prompt de video sin la lista de "Lo que NO debe pasar" ni sin "Termina:"; nunca "Termina:" ni "Duración:" en un B-roll.
- Nunca texto en pantalla dentro de los prompts, ni un "sin texto" general que borre la etiqueta: el llamado a la acción lo pone el motor.
- Nunca un B-roll con alguien hablando, ni con audio que se use, ni con el producto deslizándose, ni con libros, teclados o pantallas con texto.
- Nunca un B-roll de cierre con el producto grande ni con la cámara moviéndose: el producto chico en la franja del medio, con aire arriba y abajo.
- Nunca una frase ancla que no sea un trozo literal y único de la línea de su clip.
- Nunca más de 8 s de voz entre dos B-roll de la historia, ni un clip de la historia sin B-roll.
- Nunca un objeto que aparece, desaparece o cambia de mano sin una acción que lo explique.
- Nunca un prompt de imagen que describa más de un instante.
- Nunca las palabras de cine, las colas de calidad ni los timestamps dentro de un prompt.
- Nunca inventes prueba social, precios, ofertas, dosis ni modo de uso.
- Nunca un prompt fuera de su propio bloque de código copiable, ni abreviado.
- Nunca un prompt, una línea o una frase ancla en el manifiesto distintos, ni en un carácter, de los del paquete: lo que el usuario ve (opción C, o la parte que pida) se copia del manifiesto.
- Nunca generes nada antes de tener el paquete completo y el manifiesto guardado y de que el usuario elija A o B, ni mandes los videos a Flow antes de que apruebe los créditos que imprime `npm run videos`.
- Nunca aceleres un clip que se ve ni le cambies la duración por fuera del manifiesto. La única voz que se acelera es la de la historia de A (1,2x, sin silencios), y la acelera el motor con el paso `voz`.
- Nunca cambies la línea para que la marca suene bien: cómo se pronuncia va en la indicación de voz.
- Nunca reescribas el diálogo de un clip generado salvo que Omni lo rechace por contenido: entonces solo ese clip, con su misma función y largo, hasta 3 veces, y se informa. Un fallo del servicio de Flow (no de contenido) no se arregla con el texto: se espera y se vuelve a enviar.
- Nunca dos procesos pesados a la vez: un comando por vez.
- Nunca música, blanco y negro ni transiciones de plantilla: el congelado con glitch, el check, el clic, el fundido, el producto al centro y el llamado a la acción los pone el motor por el manifiesto.

---

## Chequeo final antes de entregar

(Lista interna. No se muestra al usuario ni se entrega como bloque.)

- Hice las dos pausas: briefing completo y elección de variante con recomendación.
- No inventé ciudad, género, edad, quién es la persona ni el llamado a la acción: todo salió del briefing.
- El guion sigue la estructura de la variante elegida, beat por beat, y el producto entra en su momento.
- Cada clip es un intercambio completo, con su duración medida y redondeada a 4, 6, 8 o 10 en la etiqueta, y sus palabras dentro de la guía.
- Los personajes con sus prompts en español simple (tres en B, dos en A); una imagen por clip, cada una empezando con la línea "Termina:" del clip anterior, con el brazo y el mic del lado correcto (B) o sin ellos (A), y con el producto donde se ve.
- Cada prompt de video: en español, simple, con la primera línea de ingredientes (imagen 1, y en B imagen 2 y, donde sale el producto, imagen 3), el diálogo, las voces idénticas (con la pronunciación de la marca si hace falta), el sonido, la lista de "Lo que NO debe pasar" adaptada con sus líneas fijas de no repetir, y la línea "Termina:". La etiqueta de cada clip dice sus ingredientes, y coinciden con `ingredientes` del manifiesto.
- En A: los iconos del gancho (dos por pregunta, el elegido con su check y su frase, que dice la palabra de la opción igual que la pregunta y con una muletilla o una palabra más; la última sin elección), el congelado declarado después del último clip del gancho, los clips de la historia marcados solo voz, y la cadena de B-roll (uno por idea, cada 3 a 6 s de voz, el primero con la primera frase de la historia, cada uno con su imagen y su video para Kling, mudo, con el producto adjunto cuando se nombra, sin deslizarlo, y dos B-roll del producto distintos entre sí).
- En B: el producto se entrega cerrado, tal como viene (con una unidad ya lista si se prueba), nadie lo abre ni lo guarda, y en el cierre la persona lo sigue sosteniendo con su bolso como siempre; del entrevistador solo entra el brazo, con las líneas de NO de su otra mano y de su cara en cada clip que le toca; los iconos de las menciones (2 a 4, de a uno, con su frase), el producto al centro con la marca (si hay imagen del producto), y el fundido dicho en el plan de montaje. Sin blanco y negro.
- El B-roll de cierre, con el producto adjunto, chico en la franja del medio, con aire arriba y abajo, la cámara quieta y sin personas ni manos, en las dos variantes.
- Ningún fondo ni B-roll con libros, teclados o pantallas con texto; palabras neutras para los objetos.
- Todos los prompts completos, sin abreviar, sin cola de calidad, sin timestamps, sin texto en pantalla, sin nombres de terceros.
- El plan de montaje tiene los efectos de la variante, dónde entra cada pieza y qué hace el motor con cada una (el corte en las palabras, el glitch, la voz a 1,2x, los iconos en pareja o al centro, el check en la palabra, el producto al centro con su clic, los subtítulos al medio en el gancho).
- El manifiesto pasó el chequeo G.6 y está guardado en `temp/[slug]/manifiesto.json`, sin mostrarlo en el chat; en el chat van solo el resumen corto y la pregunta del Paso final (A, B o C).
