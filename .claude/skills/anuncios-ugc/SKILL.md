---
name: anuncios-ugc
description: Genera anuncios estilo UGC (User Generated Content) con IA, una persona generada con IA que habla a cámara todo el anuncio con su propia voz (testimonio, review a cámara, rutina, recomendación, demo, get ready with me, historia personal), para productos físicos, digitales y servicios de marcas DTC/Ecommerce en Estados Unidos y Latinoamérica. Usar SIEMPRE que el usuario pida crear un anuncio, video ad o creativo estilo "UGC", "testimonio", "review a cámara", "A-Roll", "persona hablando a cámara", "creador de contenido", o mencione crear anuncios con IA sin especificar estilo (en cuyo caso ofrecer este como una opción). Acepta un guion ganador ya escrito. Arma el guion por bloques de 10, 8 o 6 segundos, el prompt del personaje, un prompt de video por bloque, dos ganchos alternativos y el manifiesto interno (bloques en Omni Flash, revisión y montaje); en el chat da un resumen corto y tres opciones (producirlo todo, solo la imagen y los videos, o el paquete de prompts).
---

# Generador de Anuncios IA — UGC por bloques

Convierte un producto o servicio en un anuncio UGC completo: una persona generada con IA habla a cámara durante todo el anuncio, con su propia voz, como si lo hubiera grabado y editado ella misma con su celular. Arma el guion repartido en bloques con timestamps, el prompt de imagen del personaje y un prompt de video por bloque, listos para copiar y pegar, y el manifiesto de producción. **Con ese manifiesto, el motor de este sistema produce el anuncio**: arma la lista de lo que hay que generar (la imagen de la persona y cada bloque, que tú generas en Google Flow, los bloques en Omni 1.1 Flash), revisa cada bloque y arma el montaje. Nada se genera antes de que el usuario elija cómo seguir, y los bloques, además, esperan su ok a los créditos de Flow (Paso final).

**Idioma**: interactúa, pregunta y escribe SIEMPRE en español neutro (LatAm). El anuncio puede ir en otro idioma (inglés, portugués…); la conversación con el usuario, no.

## Qué es este estilo y cómo reconocerlo

- **Una persona de aspecto real, generada con IA, habla a cámara todo el anuncio.** La voz la genera el mismo generador de video dentro de cada clip, con los labios sincronizados. No hay voz en off, ni locutor, ni una voz grabada aparte.
- **Casero y auténtico**: vertical 9:16, grabado con celular por la propia persona, en mano o apoyado, leve tembleque, luz natural, cortes secos. Nunca un comercial pulido.
- **Se arma por bloques.** El anuncio es una fila de videos cortos, cada uno generado de una vez (10 s por defecto; 8 o 6 s; 4 s rara vez). Dentro de cada bloque hay **tramos** con timestamps: en cada tramo cambia el plano y la acción, como un video que la persona editó en su celular. Un bloque de 10 s ya trae 4 o 5 planos distintos adentro.
- **Recorre varios lugares** coherentes con lo que se vende: la cocina, el auto, la oficina, el gimnasio, la calle, el local del negocio. Normalmente un lugar por bloque.
- **Sirve para todo**: productos físicos, suplementos, productos digitales (cursos, apps) y servicios (gimnasio, inmobiliaria, clínica, academia).
- **Referencias, no frames**: una imagen generada de la persona (fija su cara) y la foto real del producto. Cada bloque se genera con esas referencias adjuntas; si vuelve a un lugar que ya salió en otro bloque, lleva además un fotograma de ese bloque, que fija el lugar (Sección D, "Lugar que vuelve"). No hay frame inicial ni final, ni frames encadenados, ni B-roll.
- **No es** un podcast (dos personas frente a micrófonos), ni una entrevista callejera, ni voz en off sobre imágenes, ni animación.

Vocabulario de esta skill (úsalo igual con el usuario):

- **Anuncio**: el video final.
- **Bloque**: cada video que se genera de una vez (10, 8 o 6 s; 4 s rara vez).
- **Tramo**: cada timestamp dentro del bloque (por ejemplo `[0.0–2.2s]`), con su plano, su acción, su emoción y, como mucho, una línea hablada.

## Reglas obligatorias — léelas antes de generar cualquier cosa

1. **Hay una sola pausa: el briefing (Paso 1).** Con las respuestas armas todo de una vez, sin resumen para confirmar y sin pausas intermedias: el paquete (Secciones A a E) y el manifiesto, que se guarda en su archivo. En el chat va solo un resumen corto y la pregunta del Paso final: el paquete no se muestra salvo que elija la opción C o lo pida, y el manifiesto nunca. Si el usuario ya dio todo en su mensaje (o en el guion que pegó), no hay pausa: lo armas directo.
2. **La persona habla a cámara todo el anuncio, con la voz que genera el video.** Nunca voz en off, nunca una pista de voz aparte.
3. **Personaje generado con IA, nunca foto de una persona real** (de bancos de imágenes, redes sociales o cualquier otra fuente).
4. **Copy desde cero en cada anuncio.** Nunca reutilices frases, cifras, ángulos ni ideas de otros anuncios, aunque sean del mismo producto, ni del ejemplo de esta skill. De un anuncio anterior solo puedes tomar qué es el producto. Tampoco preguntes lo que esta skill ya resuelve.
5. **Un solo guion para todo el anuncio**, escrito de corrido como una sola historia; después se reparte en bloques y tramos.
6. **La duración de cada bloque se elige por sus palabras** (~3 por segundo hablado; tabla en "Bloques, tramos y palabras"). Que no falte tiempo (sale apurado) ni que sobre (repite palabras al final).
7. **La imagen del personaje es solo referencia de identidad**, nunca el primer cuadro del video. El prompt de cada bloque dicta la ropa, el peinado, el plano y el lugar.
8. **Continuidad física sin magia** dentro de cada bloque: nada aparece, desaparece o cambia de mano sin una acción que lo explique. Si abre el frasco, la tapa queda sobre la mesa.
9. **Nunca texto en pantalla dentro de los prompts** (subtítulos, letreros, cifras): eso va en el montaje. El único texto visible es el impreso en la etiqueta del producto.
10. **Cada prompt va en su propio bloque de código**, listo para copiar con un clic. Las indicaciones (qué adjuntar, de cuántos segundos pedirlo) van fuera del bloque.
11. **La duración no es un defecto.** Nunca rellenes ni recortes un guion para llegar a un número.
12. **Si el usuario pega un guion ya escrito, lee el Paso 0 antes que nada.**

---

## Paso 0 — Si el guion ya viene escrito (guion ganador)

Solo se activa cuando el usuario pega un guion que ya le funciona y pide pasarlo a este estilo ("tengo este anuncio ganador, pásamelo a UGC"). Si no llega ninguno, ignora este paso y empieza por el Paso 1.

### Lo que NO haces

- **No escribes un guion nuevo ni "mejoras" el que llegó**: no se reescribe, no se acorta, no se pule. El mensaje, el orden de las ideas y las palabras se respetan. El usuario lo trajo porque ya le vende.
- **No preguntas lo que el guion ya deja claro** (producto, público, dolor, oferta, CTA): lo deduces leyéndolo.
- **No lo rellenas para llegar a una duración mínima**: dura lo que dura.

### La excepción: de narración a hablado a cámara

En este estilo la persona habla a cámara y nunca hay voz en off. Si el guion está escrito como narración externa (un narrador que habla de "ella" o del producto desde afuera), pásalo a la persona hablando a cámara con el **cambio mínimo**: los pronombres y los verbos que dependen de ellos, nada más. Por ejemplo, "Ana probó de todo y seguía sin dormir" pasa a "Yo probé de todo y seguía sin dormir". Anota el antes y el después de las líneas que cambiaste en la Sección A (queda guardada en `notas-paquete.md`: G.1) y avísalo en la línea de decisión del resumen del Paso final; no es una pausa extra. Si el guion ya se puede decir a cámara tal cual (en primera persona, o hablándole a quien mira: "¿Te cuesta dormir?"), no tocas nada.

**Lo que el guion trae y no se dice.** Las indicaciones de escena ("[VISUAL: …]", "se ve a…") no son palabras habladas: úsalas para la acción de los tramos. Los textos en pantalla no van en los prompts (regla 9): anótalos aparte en la Sección A y pásaselos al entregar A o B (copiados de `notas-paquete.md`), para que decida si los agrega al editar: el motor no pone textos en pantalla (`overlays` va vacío). Escribir una cifra como se dice ("70%" → "setenta por ciento") no es reescribir: es lo que la persona va a pronunciar, y así las palabras se cuentan bien.

### Lo que SÍ haces, en este orden

1. Di en una sola frase qué producto, qué público y qué objetivo leíste, y si hizo falta pasarlo a hablado a cámara.
2. Pregunta, en un solo mensaje, solo lo que el guion no resuelve y de verdad te falta (normalmente la foto del producto, y el país o el idioma si no se deducen). Esa es la única pausa. Si no falta nada, entrega directo.
3. Reparte el guion en bloques y tramos **cortando solo en comas o puntos**. Elige la duración de cada bloque según las palabras que le tocan (tabla de "Bloques, tramos y palabras"): el texto se acomoda eligiendo dónde cortar, nunca cambiando palabras. Si una frase sin comas es larga, dale un tramo más largo; nunca la partas a la mitad.
4. De ahí en adelante la entrega es exactamente igual (A a F, manifiesto y Paso final). El Bloque 1 lleva el texto del usuario intacto; los dos ganchos alternativos (Sección E) son extras para testear y solo cambian el arranque.

---

## Paso 1 — Briefing (la única pausa)

Cuando el usuario pida un anuncio, no escribas nada todavía. Pregunta en **un solo mensaje**, como texto abierto (sin botones ni formularios), solo lo que no te haya dicho ya:

1. **¿Qué vendes?** Producto físico, digital o servicio (gimnasio, inmobiliaria, curso…), qué es y qué problema resuelve. Si es un producto físico, que suba una foto del producto. Si se usa de una forma concreta (suplemento, cosmético, tratamiento), cómo se usa: dosis, horario o modo de uso, si los tiene a mano.
2. **¿A quién se lo vendes?** Edad, situación y dolor principal.
3. **¿Qué prueba social real tienes?** Clientes, reseñas, años en el mercado, resultados. Si no hay, no se inventa: la prueba pasa a ser la demo (mostrar el producto funcionando).
4. **¿En qué país y en qué idioma va el anuncio?** Define el acento y el vocabulario. Por defecto, español latino neutro.
5. **¿Cómo compra el cliente?** Pago contra entrega, tienda online, WhatsApp, TikTok Shop, agendar una cita… Define el CTA.
6. **Opcional:** el estilo de UGC (testimonio, rutina, review, demo, get ready with me, historia personal…) y la duración, si la quiere fijar. Si no, lo decides tú.

**Si sube una foto, reconócela tú**: di qué ves ("Veo que es un sérum facial con gotero, del nicho de cuidado de la piel; corrígeme si me equivoco") y no preguntes lo obvio. Si la foto trae precio, botones o interfaz de una tienda, o marca de agua, avísale: el generador recrea lo que ve, y lo mejor es una foto del envase solo, de frente, con la etiqueta legible. Si no hay pausa porque el usuario ya dio todo, este reconocimiento va al principio de tu respuesta, antes del resumen del Paso final, en una o dos frases.

Espera la respuesta. Después ya no hay más preguntas: armas todo y vas al Paso final.

---

## La entrega — el paquete se arma completo y queda interno

Con el briefing respondido, arma el paquete completo, sin pausas, en este orden: **A → B → C → D → E**, y con eso el manifiesto (Sección G), que se escribe en su archivo. La **F** es un chequeo que haces en silencio antes de responder. **El paquete no se muestra en el chat al terminar**: queda interno, en el manifiesto (lo que no tiene campo en él, en `notas-paquete.md`: G.1), y en el chat van solo el resumen corto y la pregunta del Paso final. Este orden y este formato (A a E) son los que se usan cuando el paquete sí se entrega (opción C del Paso final, o si pide verlo o ver una parte), siempre sin el manifiesto, que nunca se muestra. Cuando se entrega, va completo: nunca una muestra, nunca "¿quieres que te dé el resto?".

Si hay foto y no hubo pausa, la respuesta empieza con el reconocimiento de la foto (Paso 1), en una o dos frases, y después va el resumen del Paso final.

### A. Estrategia

Elige tú la estructura según el briefing; no preguntes cuál usar:

- **Problema → solución**: gancho → problema → descubrimiento → demo → prueba → oferta/CTA. La más versátil.
- **Testimonio o historia personal**: cómo estaba → qué pasó → qué cambió → recomendación.
- **"3 razones por las que…"**: cuando el producto tiene varios beneficios concretos.
- **Objeción primero**: empieza por la duda ("yo tampoco creía en esto"), para categorías donde la gente desconfía.
- **Rutina o get ready with me**: el producto dentro de un momento real del día (belleza, cuidado personal, hábitos).
- **Recorrido o demo**: "te muestro…", para servicios (el gimnasio, el departamento) y productos digitales.

La **duración** la estimas tú: la que el anuncio necesite para mostrar lo que tiene que mostrar. Es aproximada (puede salir algo más o algo menos). Desde cero, como mínimo unos 30 segundos, sin techo. Si el usuario fijó una duración, oriéntate por ella sin forzarla.

Formato:

~~~markdown
**Estructura:** [nombre] — [1 o 2 líneas de por qué esta]
**Promesa central:** [qué gana el cliente, en una frase]
**Objeción principal:** [la duda que frena la compra] → [en qué bloque y cómo la responde el anuncio]
**Duración aproximada:** ~[N] s ([N] bloques)

| Bloque | Fase | Duración | Lugar |
|---|---|---|---|
| 1 | gancho + problema | 10 s | [lugar concreto y momento del día] |
| 2 | [fase] | [N] s | [lugar] |
~~~

Si un bloque vuelve a un lugar que ya salió, en su columna Lugar escribe "[lugar], el mismo del Bloque [N]": ese bloque lleva el fotograma del Bloque [N] (Sección D, "Lugar que vuelve").

Si vino de un guion ganador (Paso 0), agrega aquí el antes y el después de las líneas que pasaste a hablado a cámara, si hubo, y aparte los textos en pantalla que traía, si los tenía.

### B. Guion

Primero escribe el guion entero, de corrido, como una sola historia: así se lee de principio a fin y se nota si fluye. Después repártelo en bloques y tramos según "Bloques, tramos y palabras", y muestra el conteo de palabras de cada bloque.

~~~markdown
**Guion completo:**
[todo el texto hablado, de corrido]

**[Bloque 1 — gancho + problema | 10 s]** · [lugar] · [N] palabras (guía: 26–30)
- [0.0–2.4s] “[línea]”
- [2.4–4.2s] “[línea]”
- [4.2–6.6s] “[línea]”
- [6.6–8.4s] “[línea]”
- [8.4–10.0s] “[línea corta]”

**[Bloque 2 — descubrimiento + demo | 8 s]** · [lugar] · [N] palabras (guía con 1.8 s sin diálogo: 16–19)
- [0.0–2.2s] “[línea]”
- [2.2–4.0s] (sin diálogo: [acción]; se oye [sonido])
- [4.0–6.4s] “[línea]”
- [6.4–8.0s] “[línea corta]”
~~~

Si un bloque tiene un tramo sin diálogo, la guía baja ~3 palabras por cada segundo mudo; escríbela como en el Bloque 2 de arriba.

### C. Personaje y producto

**El personaje.** Un prompt de imagen por personaje; normalmente uno: la persona que habla. Elige a alguien que se parezca a quien compra (edad, situación): quien ve el anuncio tiene que reconocerse. Plantilla:

```
Foto vertical 9:16 tomada con la cámara frontal de un celular, como una selfie casual de referencia. Plano medio, de la cintura hacia arriba. [Quién es: origen y edad; piel (tono) con textura real y poros visibles; cabello (color, largo, textura); ojos; cejas; rasgos distintivos; maquillaje o barba; contextura; tatuajes visibles o "sin tatuajes visibles"]. Lleva [una prenda básica lisa, sin estampados ni logos]. Está de pie frente a una pared lisa color [color] de su casa, mira directamente a cámara con [una expresión leve] y la boca cerrada, los brazos relajados a los costados y las manos vacías. Luz natural suave de una ventana que le da de frente. Estilo UGC auténtico, imagen de celular, sin retoque de estudio. Un solo instante congelado. Sin texto, sin logos, sin marcas de agua, sin objetos en las manos.
```

Debajo, fuera del bloque: "Genérala en vertical 9:16, sin adjuntar ninguna imagen, y revísala antes de seguir: esa cara va en todo el anuncio." La pared lisa, la ropa básica y las manos vacías son a propósito: la imagen solo tiene que fijar la cara, y cada bloque pone su propio lugar, su ropa y lo que tiene en las manos.

Varios personajes: se puede (por ejemplo, dos amigas); por defecto, uno. Un prompt para cada uno, y que se distingan por un rasgo o por la ropa.

**El producto.** Se usa la foto real del usuario como referencia; no se genera. Escribe además su **descripción fija**, que va palabra por palabra en todos los prompts donde se vea: forma y material, colores, tapa, etiqueta (lee la foto y escribe su texto principal literal, entre « »), tamaño respecto de la mano, y "Solo hay un [frasco/tubo/caja]". Muéstrala aquí para que el usuario la revise.

- **Etiqueta con frases de salud o promesas** ("baja de peso", "calma la ansiedad"): en la descripción fija, la que va en PRODUCT / VISUAL KEY, describe la etiqueta (la marca y el nombre del producto entre « », los colores, los sellos) sin dictar el texto de esas frases, y en el guion no las conviertas en promesas de cura. Si aun así el generador rechaza un bloque por políticas, se resuelve como cualquier otro rechazo (más abajo): cambiando la frase del guion que lo dispara por otra que diga lo mismo con otras palabras.
- **Servicio o producto digital**: no hay foto de producto. Se muestra el servicio en acción (el gimnasio, el departamento, la clase) o a la persona con el celular en la mano sin que se lea la pantalla. Si el lugar del servicio sale en varios bloques, escribe su **descripción fija** (colores, equipos o muebles, de dónde viene la luz) y repítela palabra por palabra en el SETTING de esos bloques, como la del producto; desde el segundo bloque en ese lugar, además, va su fotograma (Sección D, "Lugar que vuelve"). Si el usuario quiere un logo o una pantalla como referencia, úsalo con cuidado: el generador recrea lo que ve y suele deformar los textos chicos.
- **Producto físico sin foto**: describe el producto en texto en PRODUCT / VISUAL KEY de cada prompt (sin la línea "Imagen 2" en REFERENCIAS y sin "idéntico a la referencia" ni "a la imagen 2"), y avísale al usuario que, sin la foto, el generador inventa el envase y puede cambiarlo de un bloque a otro: lo mejor es volver a pedir los prompts con la foto.

### D. Prompt de video de cada bloque

Un prompt por bloque, cada uno en su propio bloque de código, con las dos líneas de indicaciones **fuera** del bloque:

~~~markdown
**Bloque 1 — gancho + problema | 10 s**

Adjunta como referencias (ingredientes), en este orden: 1) la imagen de [la creadora], 2) la foto del producto. No como imagen de inicio.
Pídelo de 10 segundos.

```
[prompt completo, con la plantilla de abajo]
```
~~~

Si el producto se ve en algún tramo del bloque, aunque sea de fondo, se adjunta siempre. Si no se ve en ningún tramo, se adjunta solo la imagen de la persona y la línea va en singular, sin orden: "Adjunta como referencia la imagen de [personaje]. No como imagen de inicio." (con dos imágenes o más, va como arriba, numerada y en ese orden). Además se quitan del prompt la línea "Imagen 2" y la sección PRODUCT / VISUAL KEY, y la última línea es la de un bloque sin producto (ver "Cómo llenar la plantilla"). En un servicio o un producto digital sin foto, todos los bloques van así. Si el bloque vuelve a un lugar que ya salió, la línea suma una imagen más, al final: el fotograma de ese lugar (ver "Lugar que vuelve", al final de esta sección).

**Plantilla** (probada en Omni Flash; respeta el orden de las secciones):

```
Duración: 10s.

REFERENCIAS:
Imagen 1: [nombre o "la creadora"]. Úsala solo como referencia de identidad (misma cara, mismo cabello, mismos rasgos y tono de piel). No es el primer cuadro del video: no copies su fondo, su ropa ni su pose.
Imagen 2: el producto. Es la referencia exacta del envase.

STYLE / MOOD:
[Tono del bloque, por ejemplo: UGC realista de respuesta directa, honesto y cercano, como alguien contando algo que de verdad le pasa]. Video vertical 9:16 grabado con celular por [ella misma/él mismo], en mano o apoyado, leve tembleque, cortes secos entre planos como un video que [ella misma/él mismo] editó en el celular. Se siente casero y auténtico, no un comercial pulido.

LANGUAGE / VOICE:
[Idioma y país o acento], natural y cotidiano. Voz [femenina/masculina] de [una mujer/un hombre] de unos [edad] años, [cálida, clara y espontánea], como contándole algo a [una amiga/un amigo], sin tono de [locutora/locutor]. Ritmo ágil pero cómodo, sin sonar memorizado. Habla en [español latino neutro].

MAIN CHARACTER:
[Descripción fija del personaje, igual en todos los bloques]. En este video lleva [ropa] y [peinado].

SETTING:
[Lugar concreto y momento del día]. [De dónde viene la luz: que le dé de frente a la persona y al producto]. Sobre [la superficie] solo hay: [lista]; no hay nada más. Todo se ve real y vivido, no un set.

PERFORMANCE:
[Cómo actúa: gestos concretos y creíbles, miradas a cámara y a lo que hace, energía]. Sin sobreactuar.

PRODUCT / VISUAL KEY:
[Descripción fija del producto, igual en todos los bloques]. Debe verse idéntico a la referencia en todos los planos: misma forma, mismos colores, mismas proporciones, misma etiqueta legible. Solo hay un [frasco]. Cuando aparece, la luz le da de frente y la etiqueta queda iluminada, sin contraluz. En este video [en qué tramos aparece y cómo].

TIMESTAMPS:
[0.0–2.2s]
[Plano o ángulo]. [Acción concreta de cada mano]. [Emoción].
DIÁLOGO: “[línea]”
[2.2–4.2s]
Corte a [plano]: [acción]. [Emoción].
DIÁLOGO: “[línea]”
[4.2–6.0s]
Corte a [plano]: [acción]. Sin diálogo; se oye [el sonido de la acción].
[…]
[8.2–10.0s]
Corte a [plano]: [acción]; al terminar de hablar [sonríe] y se queda [quieta/quieto], [sosteniendo…], en silencio.
DIÁLOGO: “[línea corta]”

AUDIO:
Solo la voz de [ella/él] y el sonido ambiente de [lugar]: [cómo suena el lugar y los sonidos de las acciones]. Ninguna otra voz. Sin música.

*No agregues subtítulos, letreros ni textos sobreimpresos en pantalla; los tiempos entre corchetes son indicaciones de edición y no se escriben. El único texto visible es el impreso en la etiqueta del producto, idéntico a la imagen 2. No debe aparecer otra persona ni un segundo producto, y la cara de [ella/él] no cambia entre planos.
```

**Cómo llenar la plantilla:**

- **`Duración: Ns.` en la primera línea**, igual al "Pídelo de N segundos".
- **REFERENCIAS en el mismo orden que la línea "Adjunta como referencias…"**: la imagen 1 es la primera que se adjunta. Con dos personajes: imagen 1 y 2 las personas, imagen 3 el producto. El fotograma de un lugar que vuelve va siempre al final.
- **LANGUAGE / VOICE, MAIN CHARACTER y PRODUCT / VISUAL KEY van palabra por palabra iguales en todos los bloques.** Solo cambian la ropa y el peinado ("En este video lleva…") y la última frase del producto ("En este video…").
- **Cada línea hablada en formato `DIÁLOGO: “…”`**: los dos puntos y las comillas son lo que dispara la sincronización de labios. La línea es letra por letra la misma del guion (Sección B).
- **Desde el segundo tramo, cada tramo empieza con "Corte a…"** y un plano distinto del anterior (selfie cercano, plano medio con el celular apoyado, tres cuartos, plano desde la mesa, primer plano de las manos).
- **En los tramos con diálogo se le ve la cara**, porque la boca es la que habla. Un primer plano de solo manos va en el tramo sin diálogo.
- **Describe qué hace cada mano y qué hay, y qué NO hay, sobre las superficies.** Lo que no describes, el modelo lo inventa.
- **Nunca un "sin texto" general**: borraría la etiqueta del producto. Se dice "no agregues subtítulos ni letreros" y "el único texto visible es el de la etiqueta".
- **Si el producto no se ve en el bloque** (o es un servicio o un producto digital sin foto), la última línea va así, completa, sin la etiqueta ni la imagen 2:

  ```
  *No agregues subtítulos, letreros ni textos sobreimpresos en pantalla; los tiempos entre corchetes son indicaciones de edición y no se escriben. No debe verse ningún texto ni aparecer otra persona, y la cara de [ella/él] no cambia entre planos.
  ```

- **Lugares con gente** (un gimnasio, una clase, la calle, un local): describe en SETTING a la gente del fondo (lejos, de espaldas o de perfil, sin hablar), y en la última línea "no debe aparecer otra persona" pasa a "las personas del fondo no hablan ni miran a cámara". Sin producto a la vista, completa:

  ```
  *No agregues subtítulos, letreros ni textos sobreimpresos en pantalla; los tiempos entre corchetes son indicaciones de edición y no se escriben. No debe verse ningún texto. Las personas del fondo no hablan ni miran a cámara, y la cara de [ella/él] no cambia entre planos.
  ```

  Con el producto a la vista, la última oración de la plantilla queda: "Las personas del fondo no hablan ni miran a cámara, no debe aparecer un segundo [producto], y la cara de [ella/él] no cambia entre planos."
- **Con dos personajes**: un solo hablante por tramo; la acción del tramo dice quién habla, nombrándolo por su rasgo o su ropa ("la mujer de chaqueta roja mira a cámara"), nunca por "la de la izquierda". La última línea dice "No debe aparecer ninguna persona además de [A] y [B]".

**Lugar que vuelve.** Cuando un bloque vuelve a un lugar que ya salió en otro bloque (la oficina del principio, la cocina de anoche), lleva además, como referencia, un fotograma del bloque donde ese lugar salió primero: el **bloque de origen**. Con solo texto, el generador inventa otro lugar aunque el prompt diga "la misma oficina" y la describa con detalle; con el fotograma como referencia, sale el mismo lugar (probado). Va como referencia, nunca como imagen de inicio, y por eso el bloque de origen se genera antes que los que vuelven a su lugar.

- **De qué segundo sale.** Lo eliges tú: la mitad de un tramo del bloque de origen donde el lugar se ve bien, en plano medio o abierto (no un primer plano de las manos ni una selfie muy cerrada). Al escribir el bloque de origen, que al menos un tramo muestre así el lugar. El bloque de origen es siempre un bloque del anuncio: nunca un gancho, ni el mismo bloque que vuelve.
- **En qué orden.** Personaje(s), producto si se ve, y el lugar al final. Así la persona y el producto conservan su número (la imagen 2 sigue siendo el producto en PRODUCT / VISUAL KEY y en la última línea). Si el producto no se ve en el bloque, el fotograma es la imagen 2.
- **La línea "Adjunta como referencias…"** suma el fotograma como última imagen:

  ~~~markdown
  Adjunta como referencias (ingredientes), en este orden: 1) la imagen de [la creadora], 2) la foto del producto, 3) el fotograma del Bloque [N] en el segundo [S], donde se ve bien [el lugar] (lo saca solo el motor del Bloque [N] ya generado). No como imagen de inicio.
  ~~~

- **En REFERENCIAS**, una línea más, con el mismo número que en la línea "Adjunta…":

  ```
  Imagen [k]: el/la [lugar]. Es el mismo/la misma [lugar] [de cuándo]: úsala solo como referencia del lugar ([qué se ve: paredes, muebles, ventanas, luz]). No copies a la persona que aparece, ni su ropa, ni su pose, ni lo que hay sobre [las superficies].
  ```

  El "[de cuándo]" se dice con la historia, no con el número del bloque (el generador no sabe qué es el Bloque 1): "donde grabó al principio", "de anoche". Por ejemplo, si Andrés (el del ejemplo de más abajo) vuelve a su dormitorio a la mañana siguiente, con el frasco a la vista: "Imagen 3: el dormitorio. Es el mismo dormitorio de anoche: úsala solo como referencia del lugar (paredes, ventana con cortina, cama, mesa de noche y lámpara). No copies a la persona que aparece, ni su ropa, ni su pose, ni lo que hay sobre la mesa de noche ni sobre la cama."
- **El SETTING sigue describiendo el lugar** con los mismos elementos que en el bloque de origen (paredes, muebles, de dónde viene la luz), más lo que hay ahora sobre las superficies, y cierra con "no hay nada más". El texto y el fotograma se refuerzan; la persona, su ropa y lo que hace los dicta este prompt, no el fotograma.
- **También en los ganchos** (Sección E): si el lugar del Bloque 1 vuelve en otro bloque, los ganchos, que ocurren en ese mismo lugar, llevan el fotograma sacado del Bloque 1 original.

### E. Dos ganchos alternativos del Bloque 1

Dos versiones completas extra del prompt del Bloque 1, con otro arranque, para que el usuario arme otras dos versiones del anuncio y pruebe en Meta cuál vende más. El resto del anuncio no cambia.

- **Cambia solo el primer tramo**: otra línea de gancho y otra acción o plano. Todo lo demás va palabra por palabra igual; en PERFORMANCE o SETTING ajusta solo lo que dependa del primer tramo nuevo (por ejemplo, un objeto nuevo que tiene que estar sobre la mesa).
- **El segundo tramo no cambia, así que tiene que empalmar con los tres arranques** (el original y los ganchos B y C). Elige ángulos distintos entre sí y distintos del original (pregunta directa, confesión, objeción, resultado primero, dato curioso) que encajen con lo que se dice y se hace en el segundo tramo; si uno no encaja (por ejemplo, "resultado primero" cuando el segundo tramo todavía muestra el problema), elige otro.
- **PERFORMANCE sin la acción exacta del primer tramo.** Al escribir el Bloque 1 (Sección D), describe en su PERFORMANCE los gestos y la energía en general, sin nombrar lo que hace en el primer tramo: así sirve igual para los tres arranques, y la acción de cada uno va solo en su tramo.
- **Mismo largo**: misma duración y mismos timestamps; la línea nueva tiene la misma cantidad de palabras que la original (una más o una menos).
- **La línea "Adjunta como…"** sigue las reglas de la Sección D: en singular si solo va la imagen de la persona.
- **Si el lugar del Bloque 1 vuelve en otro bloque**, cada gancho lleva también el fotograma de ese lugar sacado del Bloque 1 original (el mismo que usa el bloque que vuelve), como en la Sección D ("Lugar que vuelve"): al final de la línea "Adjunta como…" y de REFERENCIAS, donde el "[de cuándo]" es "donde graba este video". Es lo único que se suma al prompt del Bloque 1 además del primer tramo nuevo. Así, en las tres versiones del anuncio, el arranque y el bloque que vuelve quedan en el mismo lugar.
- Prueba social y cifras: solo las reales del briefing.

~~~markdown
**Gancho B — [ángulo en pocas palabras]**
Primer tramo nuevo: “[línea]” ([N] palabras; la original tiene [M])

Adjunta como referencias (ingredientes), en este orden: 1) la imagen de [personaje], 2) la foto del producto. No como imagen de inicio.
Pídelo de [N] segundos.

```
[prompt completo del Bloque 1 con el primer tramo nuevo]
```

**Gancho C — [ángulo en pocas palabras]**
[igual que el Gancho B]
~~~

### F. Chequeo silencioso (no se muestra)

Antes de responder, revisa esto en silencio. Si algo falla, corrígelo y vuelve a revisar; al usuario solo le llega la versión ya revisada.

1. **Palabras vs duración**: ¿cada bloque está dentro de la guía de su duración, descontando los tramos sin diálogo? Si le sobran segundos, bájalo a 8 o 6 s; si le faltan, súbelo o pasa una frase al bloque siguiente (en un guion ganador, solo moviendo el corte).
2. **Tramos que suman**: ¿cada bloque empieza en 0.0, los tramos siguen sin huecos ni solapes y el último termina justo en la duración del bloque? ¿El número de tramos está en el rango de su duración? ¿Dos bloques seguidos tienen repartos distintos?
3. **Línea literal**: ¿cada línea del guion (B) aparece letra por letra en su prompt (D), en el mismo tramo y dentro de `DIÁLOGO: “…”`? ¿Ningún prompt dice algo que no esté en el guion?
4. **Primera línea e idioma**: ¿cada prompt empieza con `Duración: Ns.` igual a su "Pídelo de N segundos"? ¿Cada uno dice `Habla en …` con el idioma del anuncio?
5. **Tramos mudos y cierres**: ¿como mucho un tramo sin diálogo por bloque, nunca el primero ni el último, con su sonido? ¿El último tramo de cada bloque tiene una línea corta y un gesto sostenido?
6. **Lugares variados**: ¿el anuncio recorre varios ambientes coherentes con lo que se vende, con uno (como mucho dos) por bloque?
7. **Lugar que vuelve**: ¿cada bloque que vuelve a un lugar ya mostrado (y cada gancho, si el lugar del Bloque 1 vuelve en otro bloque) lleva el fotograma del bloque de origen, que es un bloque del anuncio y nunca un gancho ni el mismo bloque? ¿Su "Imagen N" va al final de REFERENCIAS, con el mismo número que en la línea "Adjunta como referencias…" (personaje, producto si se ve, lugar)? ¿El segundo cae a mitad de un tramo del bloque de origen con plano medio o abierto, donde el lugar se ve bien? ¿El SETTING repite los elementos del lugar?
8. **Producto descrito y luz de frente**: ¿la descripción fija del producto está igual en todos los prompts donde aparece, con "Solo hay un…", la luz de frente, la etiqueta legible y sin contraluz? ¿Se adjunta su foto en cada bloque donde se ve, aunque sea de fondo?
9. **Un instante**: ¿el prompt de imagen del personaje describe un solo instante, sin "mientras", "y luego" ni verbos de proceso?
10. **Continuidad física**: ¿dentro de cada bloque nada aparece ni desaparece sin una acción?
11. **Texto y vocabulario**: ¿ningún prompt pide texto en pantalla ni dice "sin texto" a secas? ¿Ninguna palabra de la lista prohibida?
12. **Suena a persona**: ¿hay alguna frase genérica o de folleto? ¿Las muletillas y el vocabulario son los del país del anuncio?
13. **Verdad**: ¿la prueba social, los precios y la oferta son los del briefing, sin nada inventado? ¿La dosis, el horario y el modo de uso, si el anuncio los dice, salen de lo que dio el usuario o de una fuente del producto, nunca inventados? ¿Las frases de salud o promesas de la etiqueta están descritas sin dictar su texto, y el guion no promete curas? ¿El CTA corresponde a cómo compra el cliente?
14. **Ganchos**: ¿los dos ganchos cambian solo el arranque, con la misma duración y dentro de la guía de palabras? ¿Los tres arranques empalman con el segundo tramo, y el PERFORMANCE del Bloque 1 no nombra la acción exacta del primer tramo?
15. **Copy propio**: ¿nada sale de otros anuncios ni del ejemplo de esta skill?
16. **Cierre**: ¿está el manifiesto (Sección G) guardado en su archivo, revisado con su chequeo G.6 y validado (G.1), y lo que no tiene campo en él, en `notas-paquete.md`? ¿En el chat va solo el resumen corto y la pregunta del Paso final (sin ningún comando; si no sabes dónde está la foto, con una línea que se la pida: G.5), sin el paquete ni el manifiesto?

---

## Bloques, tramos y palabras

| Bloque | Tramos | Palabras (si habla en todo el bloque) |
|---|---|---|
| **10 s** (por defecto) | 4 o 5 | 26 a 30 |
| **8 s** | 3 o 4 | 21 a 24 |
| **6 s** | 2 o 3 | 15 a 18 |
| **4 s** (rara vez, por ejemplo un remate) | 1 o 2 | 9 a 12 |

- **Solo 10, 8, 6 o 4 segundos** (lo que acepta Omni Flash).
- **≈3 palabras por cada segundo que la persona habla.** Medido: 30 palabras en 10 s salen naturales y completas. Cada tramo sin diálogo resta ~3 palabras por segundo (un bloque de 10 s con 2 s mudos lleva 20 a 24). Las muletillas cuentan.
- **Elige la duración por las palabras: que no sobre tiempo.** Si a un bloque le sobra tiempo, la persona rellena repitiendo sus últimas palabras (medido: un bloque de 10 s con 24 palabras repitió el final). Si el texto es más corto, el bloque va de 8 o 6 s.
- **Más tramos = más dinámico.** Sin patrón fijo: reparte los segundos según la acción y el diálogo de cada tramo; dos bloques seguidos no repiten el mismo reparto. Los tramos suman exactamente la duración del bloque.
- **Una idea por tramo**, con la línea proporcional al tramo (~3 palabras por segundo: un tramo de 2 s lleva unas 6). Frases completas: el corte cae entre frases, nunca a la mitad de una.
- **Tramo sin diálogo**: como mucho uno por bloque, nunca el primero ni el último, y con el sonido de la acción (la tapa girando, el agua cayendo en el vaso). Úsalo solo cuando la acción lo pide: el generador puede adelantar ahí la línea siguiente.
- **Último tramo de cada bloque**: línea corta + gesto sostenido (se queda quieta, sonriendo, sosteniendo el producto, en silencio). Ese silencio final es el que se recorta en el montaje.
- **Lugares**: el anuncio recorre varios ambientes distintos, coherentes con lo que se vende, no solo la casa (el auto, la oficina, el gimnasio, la calle, el local del negocio, el lugar donde se usa el producto). Normalmente un lugar por bloque (los tramos cambian el plano y la acción); como mucho dos. Un bloque que vuelve a un lugar que ya salió lleva el fotograma de ese lugar (Sección D, "Lugar que vuelve").
- **Timestamps con un decimal y raya**: `[0.0–2.2s]`; el último termina en la duración del bloque (`[8.2–10.0s]`).
- **La tabla es una guía para escribir bien a la primera, no una garantía**: cada bloque generado se revisa igual (ver el Paso final).

## Personaje, voz y producto

**Personaje**

- **Una imagen generada por personaje**: la persona que habla en todo el anuncio. Nunca una foto de una persona real.
- **La descripción dice cómo es**: edad, rasgos, pelo, tono de piel, contextura y si tiene o no tatuajes visibles (un rasgo más). Esa descripción va igual en MAIN CHARACTER de todos los bloques.
- **El prompt de cada bloque dicta la ropa, el peinado y el plano** según la historia: pijama y moño de noche, ropa de trabajo en la oficina, toalla en la cabeza en un get ready with me. Si dos bloques seguidos son el mismo momento, repite la misma ropa palabra por palabra.
- **Peinado, tatuajes y marcas en la utilería no son reglas.** El peinado lo decide la historia. Si en un bloque se cuela algo que no quieres (un tatuaje que la referencia no tenía), se regenera ese bloque. Las marcas reales en objetos de fondo (una bolsa de snacks, una botella de agua) están bien: lo hacen más real. Lo único que no puede aparecer es un segundo producto como el que se vende.
- **Varios personajes**: se puede (un hablante por tramo; se distinguen por un rasgo o por la ropa, nunca por izquierda o derecha). Por defecto, uno.

**Voz**

- **La genera el generador de video dentro del clip y se mantiene igual de un bloque a otro.** No uses una voz aparte (ElevenLabs u otra) ni voces de catálogo.
- **LANGUAGE / VOICE describe el idioma y el acento, la edad y el género aproximados, y el registro** (natural, cercano, sin tono de locutor). Va palabra por palabra igual en todos los bloques y termina con `Habla en [idioma].`

**Producto**

- **La foto real del usuario va como referencia en todos los bloques donde se vea, aunque sea de fondo.** Un envase que aparece sin su referencia lo inventa el generador, y al corte se nota que cambió.
- **Más una descripción textual fija** (forma, colores, tapa, etiqueta con su texto principal literal, tamaño respecto de la mano) y "Solo hay uno". Las frases de salud o promesas de la etiqueta se describen sin dictar su texto (Sección C).
- **Cuando es foco, la luz le da de frente** y la etiqueta queda iluminada y legible, sin contraluz. No alcanza con "luz natural": di de dónde viene. Ojo con ventanas, pantallas o espejos detrás del producto: lo dejan en sombra y el color de marca deja de leerse.
- **Servicio o producto digital**: no hay foto de producto (ver Sección C).

## Diálogo natural — que suene a persona, no a guion leído

- Contracciones y muletillas del país ("o sea", "la verdad", "honestamente", "literal", "tipo"). Cuentan en el conteo de palabras.
- Gramática casual: frases cortas, encadenadas con "y", "pero", "o sea".
- La persona habla de su experiencia ("a mí me ayudó", "yo noté"), no recita características de folleto.
- Números y precios como se dicen en voz alta ("dos por uno", "en tres días").
- En salud, suplementos y belleza, nada de promesas de cura ni de resultados garantizados: además de sonar más creíble, evita que el generador rechace el bloque por políticas.
- **Dosis, horario y modo de uso** ("dos cápsulas antes de cada comida", "una por la mañana"): si el anuncio los necesita, usa los que dio el usuario. Si no los dio, búscalos en la etiqueta o en la página del producto si puedes investigar, o pregúntaselos; **nunca los inventes**. Si el anuncio no los necesita, no hace falta mencionarlos.
- **Bien**: "Okey, o sea, llevo como dos semanas usando esto y honestamente, sí funciona."
- **Mal**: "Este producto revolucionario ha transformado completamente mi rutina."

## Estética anti-cinematográfica y sonido ambiente

**Siempre usar**: grabado con celular, en mano o apoyado, luz natural, estilo UGC, leve tembleque, casual, auténtico, vertical 9:16.

**Nunca usar**: cinematográfico, marcas de cámara profesional (ARRI, RED, Blackmagic), anamórfico, grano de película, iluminación dramática, speed ramp, destello de lente (lens flare), whip pan, grúa, dolly, steadicam, gimbal, ángulo holandés, color grade, LUT, bokeh, épico, que quita el aliento, impresionante, cámara lenta (salvo "cámara lenta de celular"), profundidad de campo a secas (di "profundidad de campo de cámara de celular").

**Sonido ambiente** en la sección AUDIO, según el lugar del bloque:

- Baño: leve reverb de los azulejos.
- Dormitorio: acústica cerrada y suave, sin eco.
- Cocina: sensación de espacio abierto, ruidos suaves de fondo.
- Auto: acústica cercana, amortiguada.
- Exterior: ambiente natural, viento leve.
- Sala o comedor: tono cálido, espacio amoblado.
- Otro lugar: describe su ambiente real (el murmullo de un gimnasio, la calle detrás de una ventana).

**Describe lo que NO está.** Si no dices qué hay sobre la mesa, qué hace cada mano y de dónde viene la luz, el modelo lo inventa y aparecen objetos al azar. Cierra cada lista de objetos con "no hay nada más".

**Un solo instante en el prompt de imagen.** El prompt de imagen del personaje es una foto: un solo momento. Nada de "mientras", "y luego", "abriendo…": si describe dos momentos, el modelo devuelve un collage. Las acciones van en los prompts de video. Si dudas: ¿se puede fotografiar en 1/200 de segundo? Si no, son dos instantes.

---

## Ejemplo de un bloque (solo para fijar el formato)

> Producto, persona y copy inventados para mostrar la forma. **Nunca copies sus frases, su gancho, su personaje ni sus ideas**: cada anuncio se escribe desde cero.

**Así se ve en la Sección B:**

**[Bloque 2 — descubrimiento + demo | 10 s]** · dormitorio, de noche · 28 palabras (guía: 26–30)
- [0.0–2.0s] “Esto me lo regaló mi hermana.”
- [2.0–4.4s] “Kalma, un spray para la almohada.”
- [4.4–6.6s] “Yo dije, ajá, como si eso funcionara.”
- [6.6–8.4s] “Pero esa noche caí rendido.”
- [8.4–10.0s] “Como piedra, te juro.”

**Así se ve en la Sección D:**

**Bloque 2 — descubrimiento + demo | 10 s**

Adjunta como referencias (ingredientes), en este orden: 1) la imagen de Andrés, 2) la foto del producto. No como imagen de inicio.
Pídelo de 10 segundos.

```
Duración: 10s.

REFERENCIAS:
Imagen 1: Andrés. Úsala solo como referencia de identidad (misma cara, mismo cabello, mismos rasgos y tono de piel). No es el primer cuadro del video: no copies su fondo, su ropa ni su pose.
Imagen 2: el producto. Es la referencia exacta del envase.

STYLE / MOOD:
UGC realista de respuesta directa, relajado y con humor seco, como un hombre contando algo que no esperaba que le funcionara. Video vertical 9:16 grabado con celular por él mismo, en mano o apoyado en la mesa de noche, leve tembleque, cortes secos entre planos como un video que él mismo editó en el celular. Se siente casero y auténtico, no un comercial pulido.

LANGUAGE / VOICE:
Español latino neutro, natural y cotidiano. Voz masculina de un hombre de unos 41 años, grave, relajada y cercana, como contándole algo a un amigo, sin tono de locutor. Ritmo tranquilo pero sin pausas largas, sin sonar memorizado. Habla en español latino neutro.

MAIN CHARACTER:
El hombre de la imagen 1: latinoamericano de 41 años, piel morena clara, cabello negro corto con canas en las sienes, barba corta de pocos días, ojos cafés, cejas gruesas, contextura promedio con algo de panza, sin tatuajes visibles. Personalidad tranquila, algo escéptica, con humor seco. En este video lleva una camiseta gris oscuro de algodón, gastada, con un pantalón de pijama azul a cuadros, y el cabello algo despeinado.

SETTING:
Su dormitorio, de noche. La luz cálida de la lámpara de la mesa de noche le da de frente a él y al frasco; la cortina de la ventana está cerrada y no hay otra luz. Sobre la mesa de noche solo hay: la lámpara encendida y un vaso de agua; no hay nada más. Cama con sábanas grises arrugadas y una almohada blanca. Todo se ve real y vivido, no un set.

PERFORMANCE:
Habla mirando a cámara con calma y un poco de ironía. Gestos concretos y creíbles: muestra el frasco, lo destapa, rocía la almohada, lo deja en la mesa de noche, se acuesta. Alterna miradas a cámara y a lo que hace. Sin sobreactuar.

PRODUCT / VISUAL KEY:
El producto es exactamente el frasco de la imagen 2: frasco cilíndrico de vidrio color ámbar con atomizador blanco y tapa transparente; etiqueta blanca con «KALMA» en letras grandes color lila y, debajo, «Spray de almohada» y «Lavanda». Debe verse idéntico a la referencia en todos los planos: misma forma, mismos colores, mismas proporciones, misma etiqueta legible, del tamaño de una mano. Solo hay un frasco. Cuando aparece, la luz le da de frente y la etiqueta queda iluminada, sin contraluz. En este video se ve en su mano en los tres primeros tramos y destapado sobre la mesa de noche en los dos últimos.

TIMESTAMPS:
[0.0–2.0s]
Plano selfie cercano, sentado al borde de la cama. Sostiene el frasco de Kalma cerrado junto a su cara con la mano izquierda, con la etiqueta de frente a cámara, y levanta una ceja, escéptico.
DIÁLOGO: “Esto me lo regaló mi hermana.”
[2.0–4.4s]
Corte a plano medio, con el celular apoyado en la mesa de noche: quita la tapa transparente, la deja sobre la mesa de noche y rocía dos veces la almohada mientras mira a cámara.
DIÁLOGO: “Kalma, un spray para la almohada.”
[4.4–6.6s]
Corte a plano tres cuartos, sentado en la cama: deja el frasco destapado sobre la mesa de noche, junto a su tapa, mira a cámara y pone los ojos en blanco con media sonrisa.
DIÁLOGO: “Yo dije, ajá, como si eso funcionara.”
[6.6–8.4s]
Corte a plano medio desde los pies de la cama, acostado boca arriba: levanta la cabeza hacia cámara y se encoge de hombros, sorprendido.
DIÁLOGO: “Pero esa noche caí rendido.”
[8.4–10.0s]
Corte a selfie frontal cercano con la cabeza en la almohada; detrás, el frasco destapado sobre la mesa de noche con la etiqueta hacia cámara. Sonríe con los ojos entrecerrados; al terminar de hablar se queda quieto, en silencio.
DIÁLOGO: “Como piedra, te juro.”

AUDIO:
Solo la voz de él y el sonido ambiente de un dormitorio de noche: acústica cerrada y suave, sin eco, el roce de las sábanas y el siseo del atomizador. Ninguna otra voz. Sin música.

*No agregues subtítulos, letreros ni textos sobreimpresos en pantalla; los tiempos entre corchetes son indicaciones de edición y no se escriben. El único texto visible es el impreso en la etiqueta del frasco, idéntico a la imagen 2. No debe aparecer otra persona ni un segundo frasco, y la cara de Andrés no cambia entre planos.
```

Fíjate en lo que el ejemplo resuelve: 28 palabras en 10 s con 5 tramos de largos distintos; cada tramo cambia de plano y su línea va a ~3 palabras por segundo (el último, 4 palabras en 1.6 s, deja aire para el gesto final); la tapa y el frasco quedan sobre la mesa de noche por una acción y no desaparecen; la luz viene de frente; la superficie dice qué hay y que no hay nada más; el último tramo cierra con una línea corta y un gesto quieto.

---

## Localización por mercado y CTA

**Mercado e idioma.** Cambian la sección LANGUAGE / VOICE, el vocabulario y las muletillas del guion; lo visual no cambia.

- **Latinoamérica**: español latino neutro por defecto. Si el usuario da un país, usa su acento y su vocabulario (por ejemplo "refri" en México, "nevera" en Colombia, "heladera" en Argentina) y decláralo: `Habla en español de México.`
- **Estados Unidos**: inglés de Estados Unidos (`Habla en inglés de Estados Unidos.`), o español latino si el público es hispano.
- **Brasil**: portugués de Brasil, tono cálido y directo (`Habla en portugués de Brasil.`).
- **España**: español de España (`Habla en español de España.`).

Las líneas de `DIÁLOGO` van escritas en el idioma del anuncio.

**CTA según cómo compra el cliente.** Va en el último bloque, dicho por la persona a cámara (nunca como texto en el video), con un gesto simple: señala hacia abajo o levanta el producto.

- **Pago contra entrega**: que lo pide y lo paga cuando le llega a su casa; envío a todo el país si aplica.
- **Tienda online**: que entre al link o toque el botón de abajo para comprar.
- **WhatsApp**: que escriba por WhatsApp desde el botón del anuncio.
- **TikTok Shop**: que lo compre desde el carrito del video.
- **Agendar una cita** (servicios): que reserve su visita, su clase de prueba o su consulta.
- **Producto digital**: que entre al link y tenga acceso al momento.

**Oferta, precio y prueba social**: solo lo que el usuario dio. Si pidió que no aparezca el precio, respétalo. Nunca inventes descuentos, stock limitado, cifras ni testimonios; si no hay prueba social, la demo es la prueba.

---

## Sección G — Manifiesto de producción (JSON)

Este paso es **aditivo y no cambia nada de lo anterior**. Todo lo que armas en las Secciones A a E se arma exactamente igual, en el mismo formato. Además, con la Sección E lista, escribes el manifiesto en su archivo (G.1). **El manifiesto es interno del sistema: nunca se muestra en el chat**, ni siquiera si el usuario elige la opción C.

**Para qué sirve**: el manifiesto es el único punto de contacto entre esta skill y el motor de producción, que lo lee, arma la cola de la imagen de la persona y de cada bloque para Google Flow, y hace el montaje. Mientras armas el paquete no ejecutas nada: solo describes el anuncio en JSON.

**Regla de fidelidad**: lo que va en el manifiesto es **exactamente** lo que armaste en las Secciones B a E, copiado carácter por carácter. Desde que está escrito, el manifiesto es la fuente de verdad: lo que el usuario vea después (el paquete de la opción C, o la parte que pida) se copia de él. Cada campo sale de su sección:

- el `prompt` del personaje = su prompt de imagen de la Sección C;
- cada `prompt_video` = el bloque de código de ese bloque en la Sección D, y el de cada gancho, el de la Sección E;
- cada `linea` de un tramo = la línea de ese tramo en la Sección B, que es la misma que va dentro de `DIÁLOGO: “…”`.

Si un prompt del manifiesto difiere del que el usuario ve, el video final no es el que él aprobó. Al pasarlo al JSON, los saltos de línea del prompt van como `\n`, las comillas tipográficas “ ” del DIÁLOGO van tal cual, y si algún texto lleva comillas rectas, van escapadas (`\"`).

*(Nota de orden: esta sección está al final del archivo, después del chequeo de la Sección F, pero el manifiesto se escribe justo después de armar la Sección E, y nunca va en la respuesta al usuario. La Sección F es un repaso silencioso tuyo, no contenido que el usuario ve.)*

### G.1 — Dónde va

Siempre en su archivo, nunca en el chat (ni siquiera en la opción C):

```
temp/[slug-del-anuncio]/manifiesto.json
```

donde `[slug-del-anuncio]` es el nombre del producto en kebab-case (por ejemplo, `kalma-spray-almohada`).

**Valídalo antes del Paso final** con `npm run validar -- temp/[slug]/manifiesto.json` y corrige lo que marque (el costo en créditos de kie.ai y en dólares que imprime no aplica en esta versión: no se lo muestres). Si lleva la foto del producto, déjala lista tú antes de validar (G.5); si no sabes dónde está y todavía no está en la carpeta del anuncio, el error de que falta ese archivo es esperable: se resuelve cuando te la pase; cualquier otro error se corrige antes del resumen. En el resumen del Paso final basta media línea que diga que quedó guardado y validado (y, si falta la foto, que se la pida: G.5).

**Lo que no tiene campo en el manifiesto va aparte**, en `temp/[slug-del-anuncio]/notas-paquete.md`, tal cual lo armaste: la Sección A entera (con el antes y el después y los textos en pantalla, si vino de un guion ganador) y el ángulo de cada gancho de la Sección E. De ahí se copia cuando se muestra (opción C, o si lo pide), y de ahí salen los textos en pantalla que se le pasan al entregar A o B. Si un cambio toca algo que esas notas nombran (un bloque, su fase, su duración o su lugar), se actualizan también.

**Si `temp/[slug-del-anuncio]/` ya existe con otro anuncio** (otro guion u otra versión del mismo producto), no la reuses: el motor se salta la imagen de la persona y los clips que ya están en la carpeta, y metería bloques viejos en el anuncio nuevo. Usa un slug nuevo (por ejemplo, `kalma-spray-almohada-v2`) y dile al usuario, en el resumen, que esa carpeta ya existía y qué nombre usaste.

### G.2 — Estructura

```json
{
  "estilo": "ugc",
  "modo_audio": "dialogo_nativo",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "referencias": [
    {
      "id": "personaje",
      "tipo": "personaje",
      "prompt": "[el prompt de imagen del personaje de la Sección C, carácter por carácter]"
    },
    {
      "id": "producto",
      "tipo": "producto",
      "archivo": "producto.jpg",
      "nota": "conservar forma, colores y etiqueta exactos"
    }
  ],
  "tomas": [
    {
      "n": 1,
      "tipo": "R",
      "duracion": 10,
      "fase": "gancho + problema",
      "linea": "[línea del tramo 1] [línea del tramo 2] [línea del tramo 3] [línea del tramo 4] [línea del tramo 5]",
      "tramos": [
        { "desde": 0, "hasta": 2.2, "linea": "[línea del tramo 1]" },
        { "desde": 2.2, "hasta": 4.2, "linea": "[línea del tramo 2]" },
        { "desde": 4.2, "hasta": 6.2, "linea": "[línea del tramo 3]" },
        { "desde": 6.2, "hasta": 8.2, "linea": "[línea del tramo 4]" },
        { "desde": 8.2, "hasta": 10, "linea": "[línea del tramo 5]" }
      ],
      "prompt_imagen_inicial": null,
      "prompt_imagen_final": null,
      "prompt_video": "[el prompt del Bloque 1 de la Sección D, carácter por carácter]",
      "referencias": ["personaje", "producto"]
    },
    {
      "n": 2,
      "tipo": "R",
      "duracion": 8,
      "fase": "descubrimiento + demo",
      "linea": "[línea del tramo 1] [línea del tramo 3] [línea del tramo 4]",
      "tramos": [
        { "desde": 0, "hasta": 2.2, "linea": "[línea del tramo 1]" },
        { "desde": 2.2, "hasta": 4, "linea": null },
        { "desde": 4, "hasta": 6.4, "linea": "[línea del tramo 3]" },
        { "desde": 6.4, "hasta": 8, "linea": "[línea del tramo 4]" }
      ],
      "prompt_imagen_inicial": null,
      "prompt_imagen_final": null,
      "prompt_video": "[el prompt del Bloque 2 de la Sección D, carácter por carácter]",
      "referencias": ["personaje", "producto"]
    }
  ],
  "ganchos_alternativos": [
    {
      "id": "1b",
      "reemplaza": 1,
      "duracion": 10,
      "linea": "[línea nueva del Gancho B] [línea del tramo 2] [línea del tramo 3] [línea del tramo 4] [línea del tramo 5]",
      "tramos": [
        { "desde": 0, "hasta": 2.2, "linea": "[línea nueva del Gancho B]" },
        { "desde": 2.2, "hasta": 4.2, "linea": "[línea del tramo 2]" },
        { "desde": 4.2, "hasta": 6.2, "linea": "[línea del tramo 3]" },
        { "desde": 6.2, "hasta": 8.2, "linea": "[línea del tramo 4]" },
        { "desde": 8.2, "hasta": 10, "linea": "[línea del tramo 5]" }
      ],
      "prompt_video": "[el prompt del Gancho B de la Sección E, carácter por carácter]",
      "referencias": ["personaje", "producto"]
    },
    {
      "id": "1c",
      "reemplaza": 1,
      "duracion": 10,
      "linea": "[línea nueva del Gancho C] [línea del tramo 2] [línea del tramo 3] [línea del tramo 4] [línea del tramo 5]",
      "tramos": [
        { "desde": 0, "hasta": 2.2, "linea": "[línea nueva del Gancho C]" },
        { "desde": 2.2, "hasta": 4.2, "linea": "[línea del tramo 2]" },
        { "desde": 4.2, "hasta": 6.2, "linea": "[línea del tramo 3]" },
        { "desde": 6.2, "hasta": 8.2, "linea": "[línea del tramo 4]" },
        { "desde": 8.2, "hasta": 10, "linea": "[línea del tramo 5]" }
      ],
      "prompt_video": "[el prompt del Gancho C de la Sección E, carácter por carácter]",
      "referencias": ["personaje", "producto"]
    }
  ],
  "broll": [],
  "overlays": []
}
```

### G.3 — Los campos, uno por uno

| Campo | Qué va |
|---|---|
| `estilo` | Siempre `"ugc"` |
| `modo_audio` | Siempre `"dialogo_nativo"`: la persona habla dentro del clip. **No hay campo `voz_en_off`** |
| `mercado` / `idioma` | Del briefing (Paso 1): `"LatAm"`, `"EEUU"`, `"Brasil"`…; `"es"`, `"en"` o `"pt"` |
| `aspect_ratio` | Siempre `"9:16"` |
| `referencias` | La lista de imágenes que usan los bloques. Ver G.4 |
| `referencias[]` de `tipo: "lugar"` | El fotograma de un lugar que vuelve: `de_toma` (el número del bloque de origen) y `segundo` (de dónde se saca), sin `prompt` ni `archivo`: el motor lo saca y lo guarda en `img/<id>.png`. Ver G.4 |
| `tomas` | Una entrada por bloque, en orden. En el motor cada bloque es una "toma" y su clip es `video/toma-N.mp4` |
| `tomas[].n` | El número del bloque (1, 2, 3…) |
| `tomas[].tipo` | Siempre `"R"`: solo referencias, cero frames. Ninguna otra skill lo usa |
| `tomas[].duracion` | 10, 8, 6 o 4: la misma del `Duración: Ns.` de su prompt y del "Pídelo de N segundos" |
| `tomas[].fase` | La fase del bloque en el mapa de la Sección A |
| `tomas[].tramos` | Una entrada por timestamp del bloque: `desde` y `hasta` son los segundos del timestamp, como números (`[2.2–4.2s]` → `2.2` y `4.2`), y `linea` es la línea de ese tramo sin las comillas, o `null` si el tramo es sin diálogo. Con varios personajes, cada tramo con línea lleva además `habla`: el id de quien la dice |
| `tomas[].linea` | Todas las líneas habladas del bloque, en orden, unidas por un espacio. Los subtítulos y el corte de cola se alinean contra este campo |
| `tomas[].prompt_imagen_inicial` y `prompt_imagen_final` | Siempre `null`: no hay frames. Un bloque tampoco lleva `frame_inicial` |
| `tomas[].prompt_video` | El prompt de ese bloque de la Sección D, carácter por carácter |
| `tomas[].referencias` | Los ids de las imágenes que lleva el bloque, **en el mismo orden** que la línea "Adjunta como referencias…" y que "Imagen 1, Imagen 2" del prompt; el lugar que vuelve, si lo lleva, al final |
| `ganchos_alternativos` | Los dos ganchos de la Sección E: `id` `"1b"` (Gancho B) y `"1c"` (Gancho C), `reemplaza: 1`, y los mismos campos que un bloque (`duracion`, `linea`, `tramos`, `prompt_video`, `referencias`) |
| `broll` | Siempre `[]`: este estilo no usa B-roll |
| `overlays` | Siempre `[]`: el texto en pantalla nunca va en los prompts |

### G.4 — Las referencias

En `referencias` va **una entrada por cada imagen que usan los bloques**:

- **El personaje**: siempre. `id: "personaje"`, `tipo: "personaje"`, con `prompt` = su prompt de imagen de la Sección C, carácter por carácter. Esa imagen se genera una sola vez (en Google Flow, por la cola del motor) y va adjunta a cada bloque como referencia de identidad, nunca como imagen de inicio. Con varios personajes: `personaje`, `personaje-2`…, todos con `tipo: "personaje"` y su prompt, y en cada tramo con línea, `"habla": "<id>"` dice quién la dice.
- **El producto**, solo si el usuario dio la foto: `id: "producto"`, `tipo: "producto"`, `archivo: "producto.jpg"` (ese nombre exacto, nunca uno inventado; si `preparar-producto` lo cambia a `.png` o `.webp`, vale el suyo: ver G.5), sin `prompt`, y una `nota` corta. Sin foto (un servicio, un producto digital o un producto físico sin foto, ver Sección C), esta entrada **no existe** y los bloques llevan solo `["personaje"]`.
- **Un logo o una pantalla** que el usuario quiso como referencia (Sección C): una entrada más con su `archivo`, copiado a la carpeta del anuncio con ese mismo nombre.
- **Un lugar que vuelve** (Sección D, "Lugar que vuelve"): `id: "lugar-<lugar>"` (por ejemplo, `lugar-oficina`), `tipo: "lugar"`, `de_toma` = el número del bloque de origen, donde ese lugar sale primero (siempre un bloque del anuncio: nunca un gancho, ni el mismo bloque que lo usa), `segundo` = la mitad de un tramo de ese bloque con plano medio o abierto donde el lugar se ve bien (no un primer plano de las manos ni una selfie muy cerrada; el mismo segundo de la línea "Adjunta como referencias…"), y una `nota` corta. **Sin `prompt` ni `archivo`**: el motor saca ese fotograma del bloque de origen ya generado (con ffmpeg, gratis) y lo guarda en `img/<id>.png`. Una sola entrada por lugar, aunque lo usen varios bloques y los ganchos.

En `tomas[].referencias` van los ids que ese bloque lleva, **en orden**: es el orden en que la cola de Flow lista las imágenes y en que se adjuntan, y por eso tiene que coincidir con "Imagen 1, Imagen 2" del prompt. Lo normal es `["personaje", "producto"]`; si el producto no se ve en ningún tramo del bloque, `["personaje"]`; con dos personajes, `["personaje", "personaje-2", "producto"]`. **Si el producto se ve, aunque sea de fondo, va.** El lugar que vuelve va siempre al final: `["personaje", "producto", "lugar-oficina"]`, o `["personaje", "lugar-oficina"]` si el producto no se ve. Cada bloque lleva de 1 a 7 referencias.

Por ejemplo, un anuncio cuyo Bloque 4 vuelve a la oficina del Bloque 1 (en el Bloque 1, el tramo `[5.6–7.4s]` es un plano medio donde se ve la oficina):

```json
"referencias": [
  { "id": "personaje", "tipo": "personaje", "prompt": "[el prompt de imagen del personaje]" },
  { "id": "producto", "tipo": "producto", "archivo": "producto.jpg", "nota": "conservar forma, colores y etiqueta exactos" },
  { "id": "lugar-oficina", "tipo": "lugar", "de_toma": 1, "segundo": 6.5, "nota": "la oficina del Bloque 1, para el Bloque 4 y los ganchos" }
]
```

El Bloque 1 lleva `["personaje", "producto"]` (es el origen: no lleva su propio lugar); el Bloque 4, sin el producto a la vista, `["personaje", "lugar-oficina"]`, con "Imagen 2: la oficina…" en su prompt. **Los ganchos**, como ocurren en el lugar del Bloque 1, llevan ese lugar solo si vuelve en otro bloque, como aquí: `["personaje", "producto", "lugar-oficina"]`, sacado del Bloque 1 original (`de_toma: 1`) aunque el gancho lo reemplace.

### G.5 — La foto del producto (si la dio)

Si el usuario dio la foto, este es el comando que la prepara (con la ruta de su foto y el slug del anuncio):

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug-del-anuncio]
```

Ese comando copia la foto a la carpeta del anuncio con el nombre correcto y la convierte si hace falta (`.heic`, una foto muy grande, con espacios en el nombre); si la deja en otro formato (`producto.png` o `producto.webp`), corrige el nombre en el manifiesto. Por eso tú siempre escribes `"producto.jpg"`. **Después de correrlo, el nombre bueno es el que dejó él**: si vuelves a tocar el manifiesto (por ejemplo, al reescribir un bloque que Omni rechazó), deja ese nombre como está y nunca lo "corrijas" de vuelta a `.jpg`, o el validador dirá que la foto no existe. **Lo corres tú**, apenas escribiste el manifiesto y antes de validarlo (G.1), si sabes dónde está la foto: la ruta que te dio el usuario, o la imagen que pegó en el chat (la lees en su ruta local), tal cual. Si no lo sabes, en el resumen del Paso final pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando, y córrelo tú apenas la tengas. Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. Ningún comando va en el mensaje del Paso final.

### G.6 — Chequeo antes de entregar

Repasa esto en silencio, además de la Sección F. Si algo falla, corrígelo: no entregues un manifiesto roto.

1. ¿`modo_audio` es `"dialogo_nativo"`, no hay campo `voz_en_off` y **todas** las tomas son `tipo: "R"`, una por bloque, con el mismo número?
2. ¿Cada `duracion` es 10, 8, 6 o 4, y es la misma del `Duración: Ns.` de la primera línea de su `prompt_video`?
3. ¿Los `tramos` de cada bloque van seguidos desde 0 hasta la duración, sin huecos ni solapes, con los mismos segundos de los timestamps del prompt?
4. ¿La `linea` de cada bloque es exactamente las líneas de sus tramos unidas en orden por un espacio, y cada línea aparece letra por letra dentro de su `prompt_video`?
5. ¿Cada `prompt_video` declara el idioma (`Habla en …`)?
6. ¿Las palabras de cada bloque están dentro de la guía de su duración? Fuera de la guía el validador solo avisa, pero el bloque sale apurado o repite el final.
7. ¿Ningún tramo sin diálogo es el primero ni el último de su bloque?
8. ¿`prompt_imagen_inicial` y `prompt_imagen_final` son `null` en todos los bloques, y ninguno lleva `frame_inicial`?
9. ¿Las `referencias` de cada bloque existen en la lista y van en el orden de "Imagen 1, Imagen 2" de su prompt? ¿El producto está en todos los bloques donde se ve? Con varios personajes, ¿cada tramo con línea dice quién habla (`habla`)?
10. ¿Cada lugar (`tipo: "lugar"`) tiene `de_toma` (un bloque `R` que existe, nunca un gancho ni el mismo bloque que lo usa) y `segundo` (un número dentro de la duración de ese bloque, a mitad de un tramo de plano medio o abierto), sin `prompt` ni `archivo`? ¿Cada bloque que vuelve a un lugar lo lleva al final de sus `referencias`, con su línea "Imagen N: … referencia del lugar" en esa misma posición, y los ganchos también si el lugar del Bloque 1 vuelve?
11. ¿Los dos ganchos tienen `reemplaza: 1`, la misma duración que el Bloque 1, y cumplen los puntos 2 a 10?
12. ¿`broll` y `overlays` están vacíos?
13. ¿Cada prompt es idéntico, carácter por carácter, a su bloque de código del paquete (Secciones C, D y E)?
14. ¿La entrada del producto usa `"archivo": "producto.jpg"` (o el `producto.png` o `producto.webp` que dejó `preparar-producto`, si ya corrió: ese no se toca), y si no hay foto esa entrada no existe? Si hay foto, ¿ya corriste tú el comando de G.5 (o, si no sabes dónde está, vas a pedírsela en una línea del resumen, sin ningún comando)?
15. ¿El JSON es válido? Comillas dobles, sin comas colgando, saltos de línea como `\n`. ¿`npm run validar` pasa (salvo el error esperable de la foto que falta: G.1) y quedó escrito `notas-paquete.md`?

---

## Paso final — Pregunta cómo quiere producirlo

Ya armaste el paquete completo (estrategia, guion, personaje y producto, prompts de cada bloque y ganchos) y el manifiesto quedó guardado en `temp/[slug]/manifiesto.json`, revisado con su chequeo G.6 y validado con `npm run validar` (G.1); lo que no tiene campo en él, en `notas-paquete.md`. **Nada de eso se muestra en el chat**: el paquete queda interno, en el manifiesto, y el manifiesto no se muestra nunca. **Ahora, y solo ahora, en el chat va solo esto: un resumen corto y la pregunta de cómo quiere seguir** (sin ningún comando: si no sabes dónde está la foto, el resumen lleva una línea que se la pide, G.5).

**El resumen**, de 1 a 3 líneas: el estilo (UGC y su estructura: testimonio, rutina, problema → solución…), el producto, el mercado y el idioma, cuántos bloques (más los dos ganchos alternativos), la duración aproximada y, en media línea, que el manifiesto quedó guardado y validado. Si hay una decisión que conviene que sepa, va en UNA línea más: por ejemplo, "agregué 'Pagas al recibirlo' en el cierre por el pago contra entrega", que pasaste su guion ganador a hablado a cámara (cuántas líneas cambiaste; el antes y el después los ve en la opción C o si los pide), que su guion traía textos en pantalla (no van en el video: se los pasas al entregar), o, en un producto físico sin foto, que sin ella el generador inventa el envase (Sección C). Nada más: ni el guion, ni los prompts, ni el manifiesto.

No lo decidas tú: las tres salidas son legítimas y cuestan cosas distintas.

```markdown
Listo: anuncio UGC ([estructura]) para [producto], [mercado] en [idioma] —
[N] bloques y dos ganchos alternativos, unos [N] segundos. El manifiesto quedó
guardado y validado[, salvo tu foto del producto: pásamela (arrástrala al chat o
dime la ruta) y la dejo lista].
[Si hace falta: una línea con la decisión que conviene que sepas.]

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero la imagen de la persona y los bloques en
Google Flow, reviso cada uno, armo el montaje y te entrego el MP4 terminado. La
imagen no gasta créditos; antes de generar los bloques te digo cuántos créditos
de Flow van a usar, y el costo de la música.

**B) Genera solo la imagen y los videos** — reviso cada bloque y te los dejo en
su carpeta, listos para que los montes tú en CapCut a tu gusto. También te digo
los créditos de los bloques antes de generarlos.

**C) Entrégame el paquete de prompts** — te paso aquí el paquete completo: la
estrategia, el guion bloque por bloque con el diálogo de cada tramo, el prompt
de la persona, la descripción del producto, el prompt de video de cada bloque
con lo que hay que adjuntar y los dos ganchos alternativos, para que lo revises
o lo produzcas a mano. Después, si quieres, seguimos con A o B.
```

### Lo que vale en A y en B

**Las herramientas las pone el motor, y en esta versión la imagen y los bloques se generan en Google Flow.** El motor arma la cola de cada trabajo (su modelo, su prompt exacto, sus referencias en orden, su duración) y tú lo generas en Flow. La imagen de la persona sale del modelo de imagen que diga la cola (Nano Banana Pro o Nano Banana 2.1), a 0 créditos; cada bloque, de Omni 1.1 Flash por ingredientes, con la imagen de la persona, la foto del producto y, si vuelve a un lugar, el fotograma de ese lugar como referencias, en el orden del manifiesto. **Un bloque no se pasa a otro modelo por tu cuenta**: si la cola trae `respaldo` para un bloque, se usa solo como dice `flow-generacion` (después de todos los reintentos, avisando que gasta más créditos), y ese bloque se revisa con más cuidado: que la voz suene igual que en los otros bloques y que diga todo su guion. Si trae `respaldo: null` y Omni no lo saca, te paras y le dices por qué.

**Cómo se generan la imagen y los bloques (el ciclo de Flow).** El motor no los pide a ninguna API: arma la lista de trabajo y recibe los archivos. El ciclo, igual para la imagen y para los bloques:

1. `npm run imagenes -- temp/[slug]` arma `flow/cola-imagenes.json` (aquí, la imagen de cada personaje) y hace solo lo que no necesita Flow.
2. Con la skill `flow-generacion` generas la cola en Google Flow (manejas Chrome con la extensión Claude in Chrome). Esa skill explica todo el procedimiento: la ventana aparte, subir las referencias, enviar todo, los reintentos y descargar cada archivo con el nombre que dice la cola (`<slug>__<archivo>`).
3. `npm run flow:recibir -- temp/[slug]` mueve lo descargado a `img/` o `video/`, lo convierte y lo verifica.
4. Repites 1 a 3 hasta que la cola diga que no queda nada.
5. Lo mismo con `npm run videos -- temp/[slug]` (`flow/cola-videos.json`). Aquí sí suele haber más de una vuelta: los bloques que vuelven a un lugar esperan a su bloque de origen (más abajo).

`imagenes` y `videos` no llevan `--si`: no generan ni cobran nada, solo arman la cola. Si el archivo que se rehace todavía está en `img/` o `video/`, `flow:recibir` va con `--rehacer`.

**Las dos paradas que sí van, y que no se saltan nunca:**

1. **Los créditos de los bloques, antes de mandarlos a Flow.** `npm run validar -- temp/[slug]/manifiesto.json` revisa el manifiesto; el costo en créditos de kie.ai y en dólares que imprime no aplica en esta versión: no se lo muestres; el número que vale es el de `npm run videos`. La imagen de la persona no espera ningún sí (en Flow cuesta 0 créditos), y el fotograma de un lugar que vuelve tampoco cuesta: lo saca el motor. Cuando `npm run videos -- temp/[slug]` arma la cola, imprime cuántos bloques son y la estimación de créditos de Flow: díselo al usuario y espera su ok antes de mandar nada a Flow; cada bloque gasta créditos de su plan. Si para un largo dice `sin medir` (hoy pasa con los bloques de 10 s), no inventes el número: antes de pedir el ok, mira en el menú de ajustes de Flow (Video, Omni 1.1 Flash, 720p, ese largo, x1: el menú muestra cuántos créditos usa, ver `flow-generacion`; Flow ya está abierto por la imagen de la persona) cuántos créditos gasta un bloque de ese largo y dale el total con ese dato; si no lo puedes ver, díselo como lo imprime el comando (N bloques de 10 s sin medir). Si hay bloques esperando un lugar (entran en una vuelta siguiente), inclúyelos en lo que le dices —cuántos son y de cuántos segundos—, para que el ok cubra todo el anuncio y las vueltas siguientes no vuelvan a preguntar. **Los ganchos alternativos van aparte, como opcionales**: cada uno es un clip más del largo del Bloque 1. Pregunta en el mismo mensaje si los genera también, con el ángulo y la línea con que arranca cada uno (el ángulo, de `notas-paquete.md`; la línea, el primer tramo de `1b` y de `1c`, copiado del manifiesto), para que sepa qué está aprobando; sin un sí, no se generan (con el sí, la cola se vuelve a armar con `npm run videos -- temp/[slug] --ganchos` antes de ir a Flow). En la A, en el mismo mensaje va también el costo de la música, que en esta versión es lo único que cobra kie.ai: `npm run musica -- temp/[slug] --solo-plan` lo muestra sin gastar; díselo en dólares. Esa misma salida dice si kie.ai está conectado ("kie.ai: conectado" o "NO conectado"): nunca se abre el `.env` para saberlo. Si no lo está, `npm run musica` lo explica y la pregunta es otra: conectarlo o seguir sin música (sin saltarse las transiciones).
2. **La revisión de los bloques, antes de montar.** Un bloque hablado no se puede acelerar ni cortar por dentro: si sale mal, solo se arregla regenerándolo, y regenerar después de ensamblar es rehacer todo el montaje.

Con ese ok, `musica` se corre después con `--si`: el usuario ya confirmó, y sin esa marca el comando se queda esperando una confirmación en la terminal.

**La imagen de la persona, antes de los bloques.** Cuando la cola de imágenes diga que no queda nada, mírala tú (`img/personaje.png`): esa cara va en todo el anuncio. Si salió con texto, con algo en las manos, con otra persona, como collage o no se parece a la descripción, regenérala en Flow con el mismo prompt de la cola, sin preguntar (no gasta créditos): `npm run imagenes -- temp/[slug] --rehacer` la pasa a `historial/` y la vuelve a poner en la cola; después, `flow:recibir` sin `--rehacer` (la vieja ya no está en `img/`), y si hay otra vuelta de `imagenes`, también sin `--rehacer`. Si está bien, sigue sin preguntar.

**Los lugares que vuelven los resuelve el motor, en vueltas.** La primera `npm run videos` pone en la cola los bloques cuyas referencias ya existen; los que vuelven a un lugar (y los ganchos que lo usan) quedan esperando a su bloque de origen. Cuando ese bloque ya llegó con `flow:recibir`, la siguiente `npm run videos` saca de él el fotograma del lugar (con ffmpeg, sin Flow y gratis; queda en `img/<id>.png`) y pone en la cola los bloques y ganchos que vuelven a ese lugar. Si el bloque de origen no sale en Flow, los que dependen de él siguen esperando. Si el fotograma ya existe, lo reusa.

**La revisión de cada bloque — obligatoria.** No te fíes de la tabla de palabras: sirve para escribir bien a la primera, no garantiza nada. Con cada bloque generado:

- **Fotogramas** (`npm run frames -- temp/[slug]`, quedan en `qa/`): uno a mitad de cada tramo, también de los ganchos. Míralos todos. ¿Es la misma persona en todos los tramos y en todos los bloques? ¿Lleva la ropa y el peinado que pide el bloque? ¿El producto es idéntico a la foto, hay uno solo, con la etiqueta legible y la luz de frente? ¿Hay texto en pantalla que no sea la etiqueta? ¿Aparece una persona de más? ¿Algo aparece o desaparece sin una acción?
- **Lugar que vuelve** (si el anuncio lo tiene): mira el fotograma (`img/<id>.png`) y los fotogramas del bloque que vuelve. ¿El fotograma muestra bien el lugar? ¿El bloque que vuelve está en el mismo lugar que el de origen? Si salió otro lugar, falló la tirada: se regenera ese bloque. Si el fotograma no muestra bien el lugar (cayó en un primer plano, la persona lo tapa), cambia `segundo` a la mitad de otro tramo del bloque de origen donde sí se vea, mueve `img/<id>.png` a `historial/` y regenera los bloques que lo usan (con los créditos y el ok del usuario).
- **Transcripción** (`npm run ugc:cola -- temp/[slug]`): transcribe cada bloque y lo compara con su `linea`. ¿Dijo todo el guion del bloque, en orden, sin cortar palabras, sin cambiarlas y sin saltarse ninguna? Una marca mal escrita en la transcripción no es un defecto por sí sola: el transcriptor escribe mal los nombres de marca.
- **La repetición del final no es un defecto.** Si al bloque le sobró tiempo y repite al final palabras que ya dijo, `ugc:cola` lo detecta y deja `toma-N.cola.json`: el montaje corta el bloque después de la última palabra del guion, y el mp4 no se toca. Una repetición en medio del bloque, una frase que falta o un "no se pudo decidir" de `ugc:cola` sí se revisan como posible defecto.

Al terminar, muéstrale al usuario la revisión bloque por bloque y dónde están los clips, y espera su visto bueno antes de montar. Si alguno falla, dile cuál, qué falló (el tramo y el fotograma, o la frase) y cuántos créditos de Flow cuesta regenerarlo, y espera el ok. Se regenera **sin tocar el texto**: si un bloque salió con otra cara, con texto en pantalla, con una persona de más, con palabras cortadas o apurado, falló la tirada, no el guion.

```
npm run rehacer      -- temp/[slug] N        saca el clip del bloque N (queda en historial/) y su corte de cola
npm run videos       -- temp/[slug]          arma la cola solo con ese bloque: lo demás ya está y no entra
   ... skill flow-generacion: generarlo en Google Flow y descargarlo con su nombre ...
npm run flow:recibir -- temp/[slug]          sin --rehacer: el clip viejo ya está en historial/
npm run frames       -- temp/[slug]
npm run ugc:cola     -- temp/[slug] --tomas N
```

Y se revisa de nuevo. Si vuelve a fallar, se lo dices otra vez, con los créditos.

**Si rehaces un bloque de origen de un lugar**, `rehacer` guarda también su fotograma en `historial/` y avisa qué bloques y ganchos lo usaban. El fotograma nuevo no se saca solo cuando llega el clip nuevo: sale cuando rehaces un bloque o gancho que lo usa (`npm run videos` lo saca del clip nuevo al armar esa cola), así que mientras tanto no hay `img/<id>.png`. Para comparar, usa las tiras de `qa/` (`npm run frames`) del bloque nuevo y de los que lo usaban. Los bloques que lo usaban no se regeneran solos: si el lugar ya no coincide con el del bloque nuevo, regenera esos también (con los créditos y el ok del usuario).

**Si Omni falla en un bloque.** En Flow lo ves tú: el bloque no sale y Flow muestra un aviso. La skill `flow-generacion` ya reintenta el mismo prompt las veces que dice (muchas veces es un falso positivo y no cobra); si aun así no sale, mira de qué tipo es el aviso. Son dos fallos distintos y no se arreglan igual:

- **Fallo del servicio** (algo salió mal, inténtalo más tarde, se queda cargando, servidor ocupado): **no es un rechazo de contenido, y no se toca nada**, ni el copy ni el manifiesto. Espera unos minutos y vuelve a enviar ese trabajo de la cola: lo ya descargado no se vuelve a generar. Si sigue fallando igual, Flow u Omni está caído: avísale al usuario que es una caída del servicio y no un problema de su anuncio, y reintenta cada 15 minutos.
- **Rechazo de contenido** (el aviso habla de políticas, seguridad o contenido sensible: policy, safety, sensitive, prohibited, moderation…; casi siempre en salud y suplementos): insistir con el mismo prompt fallaría igual. Reescribe **solo el copy de ese bloque**, con su misma función en el guion, su misma duración y sus palabras dentro de la guía. Cambia solo la frase que dispara el rechazo (una promesa de cura, el nombre de una enfermedad, una cifra de kilos) por otra que diga lo mismo con otras palabras. Actualiza en el manifiesto `linea`, `tramos` y `prompt_video` de ese bloque (la línea dentro de `DIÁLOGO: “…”` y lo que dependa de ella), valídalo con `npm run rehacer -- temp/[slug] N`, vuelve a armar la cola con `npm run videos -- temp/[slug]` y sigue el ciclo de Flow con la cola nueva. **El cambio va en el manifiesto, no solo en la caja de Flow**: el prompt que se pega es el de la cola, y los subtítulos y `ugc:cola` se alinean contra la `linea`. Anótalo también en `flow/cambios-de-prompt.md`, como pide `flow-generacion`. No le preguntas antes: sin ese cambio el bloque no existe. Vale también para un guion ganador: es la única excepción a no tocar su texto.
- **Hasta 3 reescrituras.** Si a la tercera Omni sigue rechazándolo, para y avísale al usuario: qué frase probaste en cada intento y qué aviso dio Flow. No sigas sin él.
- **Si no queda claro de qué tipo es** (Flow muestra un aviso genérico), léelo tú: si habla de políticas o de contenido, es un rechazo; si no, trátalo como fallo del servicio (volver a enviar sin tocar nada), y si vuelve a fallar con el mismo aviso, avísale al usuario con el texto exacto que muestra Flow.
- **En un gancho**, lo mismo, pero el copy se reescribe en `ganchos_alternativos` y la cola se vuelve a armar con `npm run videos -- temp/[slug] --ganchos`.

**Nunca aceleres un bloque hablado** (deforma la voz y rompe la sincronización de labios), y nunca le pidas otra duración (en Flow se elige la que dice la cola): la duración de un bloque está atada a sus tramos y a su guion, y se cambia solo en el manifiesto.

### Si elige A — el anuncio completo

Sigue este orden de principio a fin, **sin pararte a preguntar entre comando y comando** fuera de las dos paradas (y de lo que `flow-generacion` pide en el navegador: el permiso de cada tanda de descargas, o un inicio de sesión o un captcha, que hace el usuario). El usuario ya dijo que sí: pedirle permiso en cada paso es hacerle perder el tiempo.

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug]   la foto (G.5), si hay foto y no se hizo
npm run validar      -- temp/[slug]/manifiesto.json    revisa el manifiesto (su costo en kie.ai no aplica; la imagen no espera ningún sí)
npm run imagenes     -- temp/[slug]                    arma la cola: solo la imagen de la persona
   ... skill flow-generacion: generarla en Google Flow y descargarla con su nombre ...
npm run flow:recibir -- temp/[slug]                    mueve, convierte y verifica lo descargado
   ... repetir imagenes -> Flow -> flow:recibir hasta que la cola diga que no queda nada ...
npm run videos       -- temp/[slug]                    arma la cola: los bloques (los que vuelven a un lugar, en una vuelta siguiente)
npm run musica       -- temp/[slug] --solo-plan        el costo de la música en kie.ai, sin gastar
   ... bloques, créditos de Flow, ganchos y música -> PARADA 1: esperar el ok ...
   ... si aprobó los ganchos: npm run videos -- temp/[slug] --ganchos, antes de ir a Flow ...
   ... skill flow-generacion: generar la cola en Google Flow y descargar cada archivo con su nombre ...
npm run flow:recibir -- temp/[slug]                    mueve, convierte y verifica lo descargado
   ... repetir videos -> Flow -> flow:recibir hasta que la cola diga que no queda nada (con --ganchos si los aprobó) ...
npm run frames       -- temp/[slug]                    un fotograma a mitad de cada tramo
npm run ugc:cola     -- temp/[slug]                    transcribe cada bloque y marca dónde cortar si repite el final
   ... revisión de cada bloque -> PARADA 2 ...
npm run musica       -- temp/[slug] --si               la música de fondo (kie.ai, ya aprobada en la PARADA 1)
   ... efectos y transiciones.json (abajo) ...
npm run plan         -- temp/[slug]
node produccion/subtitulos-dialogo.js temp/[slug]      los subtítulos de un anuncio hablado
npm run plan         -- temp/[slug]                    OTRA VEZ: no es un error
npm run ensamblar    -- temp/[slug]
```

**El plan corre dos veces**: plan → subtítulos → plan → ensamblar. Si te saltas la segunda pasada, `ensamblar` renderiza una versión de menos y termina bien: es fácil no notarlo. Los subtítulos de este estilo salen de `subtitulos-dialogo.js`, que alinea la `linea` de cada bloque con lo que se oye; `npm run subtitulos` es el de voz en off y pide una pista de voz que aquí no existe.

**Y no te saltes la música ni las transiciones** — secciones 3 y 4 de `COMO-PRODUCIR.md`. Son **obligatorias** en este estilo; el motor avisa si faltan pero no detiene nada, y un anuncio sin ellas se renderiza perfecto y sale plano. Es el fallo más fácil de cometer de todo el proceso.

- **Música**: en UGC se genera con IA (`npm run musica`), acorde al tono del guion. El volumen lo pone el motor (−22 dB bajo la voz, más alto que en voz en off, a propósito): no lo toques. Si el usuario dejó su propio mp3 en `temp/[slug]/musica/`, se usa ese y no se genera nada.
- **Transiciones**: copia `woosh.mp3` y `deep-woosh.mp3` de `recursos/efectos-transiciones/` a `temp/[slug]/efectos/` y escribe `temp/[slug]/transiciones.json` con las posiciones del problema, la solución, la prueba y el CTA, cada una con su `porque`, como dice `COMO-PRODUCIR.md`. En este estilo **`toma` es el número del bloque que empieza con esa parte del guion**: una transición solo puede ir en el corte entre dos bloques, porque los cortes de dentro de un bloque ya vienen en el clip. Una parte que arranca en medio de un bloque no lleva transición, y si dos quedan en cortes seguidos, se deja una. En un anuncio de pocos bloques salen menos de cuatro, y está bien.

**Los ganchos, al final** (solo si los aprobó). Con el anuncio principal ya ensamblado, cada gancho se arma como otra versión del anuncio, con la misma música, las mismas transiciones y los mismos bloques ya pagados; solo cambia el Bloque 1:

```
npm run ugc:gancho -- temp/[slug] 1b                 crea temp/[slug]-gancho-1b/ con el gancho como Bloque 1
npm run ugc:cola   -- temp/[slug]-gancho-1b --tomas 1
npm run plan       -- temp/[slug]-gancho-1b
node produccion/subtitulos-dialogo.js temp/[slug]-gancho-1b
npm run plan       -- temp/[slug]-gancho-1b
npm run ensamblar  -- temp/[slug]-gancho-1b
```

Lo mismo con `1c`. Sus fotogramas ya los revisaste con los bloques; su transcripción es la de `ugc:cola` de su carpeta, y se juzga igual. Si un gancho falla y el usuario aprueba regenerarlo (con sus créditos), corre `npm run rehacer -- temp/[slug] --gancho 1b` (valida el manifiesto y saca `video/gancho-1b.mp4` a `historial/`), después `npm run videos -- temp/[slug] --ganchos` (la cola trae solo lo que falta) y el ciclo de Flow (`flow:recibir` sin `--rehacer`: el clip viejo ya está en `historial/`), y vuelve a armar su versión con `npm run ugc:gancho -- temp/[slug] 1b --reemplazar`. Nunca uses `--rehacer` sin `--tomas`: vuelve a poner en la cola todo lo que ya estaba generado y pagado.

**Al final, entrégale los MP4** —el anuncio y, si se hicieron, una versión por gancho, para probar en Meta cuál vende más— **y el informe** que pide `COMO-PRODUCIR.md`, en tres apartados:

- **Lo que salió bien**: los bloques que pasaron la revisión a la primera (misma cara, producto y etiqueta bien, el guion completo) y lo que funcionó mejor de lo esperado.
- **Decisiones del montaje**: la duración real (como dato), qué bloques repetían el final y dónde se cortaron, la música (cuál, a qué dB, si se repitió en loop), dónde van las transiciones y por qué, y lo que decidiste tú sin consultar.
- **Lo que salió mal**, bloque por bloque: qué falló en la revisión, qué se regeneró y cuántos créditos de Flow usó; cada rechazo de Omni, con la frase original, la que la reemplazó y el aviso de Flow; las caídas del servicio, si las hubo (cuánto duraron); fotogramas negros o tramos congelados, si los hubo. Si queda vacío, se dice que quedó vacío: eso es información.

Y al final, el **costo real**: los créditos de Flow (los bloques, las regeneraciones y los ganchos; la imagen no gasta créditos) y lo que cobró kie.ai por la música. Ahí él decide si quiere ajustar algo.

**Si su guion ganador traía textos en pantalla** (Paso 0), pásale también esa lista, copiada de `notas-paquete.md`, con la aclaración de que no están en el MP4 y se agregan al editar, si los quiere.

**Y ten cuidado con qué llamas "lo que salió mal".** El motor imprime avisos —un bloque con palabras fuera de la guía, una cola cortada, la música que se repite en loop— y **eso no son fallos: es el montaje funcionando.** El propio motor lo dice: *"ninguno detiene el montaje"*. Ponlos en las decisiones del montaje, no como defectos.

Defectos de verdad hay pocos y son medibles: otra cara, texto en pantalla, una persona o un producto de más, palabras del guion que no se dijeron o se cortaron, fotogramas negros, tramos congelados, o la etiqueta ilegible. Eso sí va en "lo que salió mal".

**La duración NO es un defecto.** Si el usuario pidió 40 segundos y salieron 46, eso está bien y no se corrige. **Nunca cortes una línea del guion, quites un bloque ni inventes copy para llegar a un número**, y no se lo ofrezcas al usuario como opción. El tiempo que pide orienta el guion; el anuncio dura lo que necesita durar. Menciónalo como dato, sin pedir disculpas.

### Si elige B — solo la imagen y los videos

Corre la generación, revisa cada bloque igual que en A y **párate antes de montar**:

```
node produccion/preparar-producto.js "<ruta de la foto>" [slug]   la foto (G.5), si hay foto y no se hizo
npm run validar      -- temp/[slug]/manifiesto.json    revisa el manifiesto (su costo en kie.ai no aplica)
npm run imagenes     -- temp/[slug]                    arma la cola: la imagen de la persona
   ... skill flow-generacion: generarla en Google Flow y descargarla con su nombre ...
npm run flow:recibir -- temp/[slug]
   ... repetir imagenes -> Flow -> flow:recibir hasta que la cola diga que no queda nada ...
npm run videos       -- temp/[slug]                    arma la cola de bloques: bloques y créditos -> esperar el ok (con --ganchos si los quiere)
   ... skill flow-generacion: generar la cola en Google Flow y descargar cada archivo con su nombre ...
npm run flow:recibir -- temp/[slug]
   ... repetir videos -> Flow -> flow:recibir hasta que la cola diga que no queda nada (con --ganchos si los quiere) ...
npm run frames       -- temp/[slug]
npm run ugc:cola     -- temp/[slug]
   ... revisión de cada bloque, igual que en A ...
npm run plan:humano -- temp/[slug]
```

El último deja `plan-montaje.txt` en la carpeta del anuncio: cada bloque con su duración, sus tramos y sus líneas, y las referencias que lleva (un lugar que vuelve dice "fotograma del bloque N, segundo S"). **Está escrito para que lo lea una persona**, y es lo que necesita para montarlo en CapCut sin adivinar nada.

Dile dónde quedó todo: los bloques en `video/toma-1.mp4`, `toma-2.mp4`… en orden; los ganchos en `video/gancho-1b.mp4` y `gancho-1c.mp4` (cada uno reemplaza al Bloque 1 en su versión del anuncio); y, de cada bloque con `toma-N.cola.json`, en qué segundo cortarlo porque repite el final. Y recuérdale lo de CapCut: corte seco entre bloques, recortar solo el silencio de los bordes, **nunca acelerar un bloque hablado**, y subtítulos y música baja (unos −22 dB por debajo de la voz). Si su guion ganador traía textos en pantalla (Paso 0), pásale esa lista, copiada de `notas-paquete.md`, para que los ponga al montar.

### Si elige C — el paquete en el chat

Entrégale el paquete **completo, nunca una muestra**, con el orden y el formato de "La entrega" (Secciones A a E) y sin el manifiesto: la estrategia con el mapa de bloques (A), el guion de corrido y repartido en bloques y tramos, con el conteo de palabras (B), el prompt de la persona y la descripción fija del producto (C), el prompt de video de cada bloque con su línea "Adjunta como referencias…" y su "Pídelo de N segundos" fuera del bloque de código (D), y los dos ganchos alternativos (E). Cada prompt en su propio bloque de código. Si vino de un guion ganador, la A lleva además lo que pide esa sección (el antes y el después de las líneas que pasaste a hablado a cámara y los textos en pantalla que traía).

- **Los prompts y las líneas se copian del manifiesto, carácter por carácter**: es la fuente de verdad, no los reescribas de memoria. Lo que se arma con sus datos también sale de él: el guion de corrido (las `linea` en orden), el conteo de palabras, la descripción fija del producto (la de PRODUCT / VISUAL KEY), la línea "Adjunta como referencias…" (de `referencias`, y de `de_toma` y `segundo` si vuelve a un lugar) y el "Pídelo de N segundos" (de `duracion`). La Sección A y el ángulo de cada gancho se copian de `notas-paquete.md` (G.1).
- **Si pide cambios**, cámbialos en el manifiesto (en un bloque, `linea`, `tramos` y `prompt_video` van juntos; y en `notas-paquete.md`, si toca algo que nombran) y vuelve a validarlo (`npm run validar -- temp/[slug]/manifiesto.json`; el costo en kie.ai que imprime no aplica en esta versión) antes de mostrarle lo nuevo, copiado de ahí.
- **Al final, ofrécele seguir con A o B**, o dejarlo ahí si solo quería los prompts: el manifiesto ya está validado y listo para producir.

**Y si en cualquier momento pide ver el paquete o una parte** ("muéstrame el guion", "pásame el prompt del Bloque 3"), muéstrale esa parte, copiada del manifiesto (o de `notas-paquete.md`) igual que en C. El manifiesto en sí no se muestra nunca.

---

## Reglas que nunca se rompen

- Nunca más de una pausa antes de armar el paquete: solo el briefing, y ninguna si el mensaje o el guion ganador ya lo resuelven todo.
- Nunca escribas el guion antes de tener las respuestas del briefing.
- Nunca una foto de una persona real como personaje: siempre generado con IA.
- Nunca voz en off ni una voz aparte: la voz la genera el video.
- Nunca reutilices copy, cifras ni ángulos de otros anuncios, ni del ejemplo de esta skill.
- Nunca reescribas, acortes ni pulas un guion ganador (la única excepción es un bloque que Omni rechaza por contenido, ver la última regla); nunca lo rellenes para llegar a una duración.
- Nunca un bloque de otra duración que 10, 8, 6 o 4 s, ni tramos que no sumen exactamente la duración del bloque.
- Nunca un bloque con palabras de más (sale apurado) ni de menos (repite al final): se corrige con la duración del bloque o moviendo el corte, nunca rellenando ni recortando el guion.
- Nunca un tramo sin diálogo como primero o último, ni más de uno por bloque.
- Nunca la imagen del personaje como imagen de inicio: siempre como referencia.
- Nunca un prompt de video sin `Duración: Ns.` en la primera línea ni sin `Habla en …`.
- Nunca una línea hablada fuera del formato `DIÁLOGO: “…”`.
- Nunca texto en pantalla dentro de los prompts, ni un "sin texto" general que borre la etiqueta.
- Nunca un objeto que aparece, desaparece o cambia de mano sin una acción que lo explique.
- Nunca un prompt de imagen que describa más de un instante.
- Nunca las palabras de la lista anti-cinematográfica.
- Nunca inventes prueba social, precios, ofertas, dosis, horarios ni modo de uso (si el anuncio los necesita y no los tienes, investígalos o pregúntalos).
- Nunca un prompt fuera de su propio bloque de código copiable.
- Nunca B-roll, frames inicial y final ni frames encadenados: este estilo no los usa (el fotograma de un lugar que vuelve va como referencia, no como imagen de inicio).
- Nunca un bloque que vuelve a un lugar ya mostrado sin el fotograma de ese lugar como referencia: con solo texto, el generador inventa otro lugar.
- Nunca una entrega a medias: cuando se entrega el paquete (opción C, o si lo pide), va completo, nunca una muestra ni "¿quieres que te dé el resto?". Y nunca el manifiesto en el chat, ni siquiera en la opción C.
- Nunca un prompt o una línea distintos, ni en un carácter, entre el manifiesto y lo que el usuario ve: lo que se le muestra se copia del manifiesto.
- Nunca generes nada antes de armar el paquete completo y el manifiesto y de que el usuario elija A o B, ni mandes los bloques a Flow antes de que apruebe los créditos que imprime `npm run videos`.
- Nunca aceleres un bloque hablado ni le cambies la duración por fuera del manifiesto.
- Nunca reescribas el copy de un bloque generado salvo que Omni lo rechace por contenido: entonces solo ese bloque, con su misma función y largo, hasta 3 veces, y se informa. Un fallo del servicio de Flow (no de contenido) no se arregla con el texto: se espera y se vuelve a enviar.
