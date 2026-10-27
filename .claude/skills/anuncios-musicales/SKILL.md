---
name: anuncios-musicales
description: Genera anuncios publicitarios estilo musical — micro-videos donde el producto se vende a través de una canción original — para marcas DTC/Ecommerce en Estados Unidos y Latinoamérica. Escribe la canción (2-3 opciones de letra + prompt de estilo), la genera de verdad con Suno vía kie.ai, y después convierte esa canción en el anuncio completo delegando la parte visual a la skill de Crochet, Claymation o Zack D Films, que arma las tomas, los prompts y el manifiesto interno; esta skill da en el chat un resumen corto y tres opciones (producirlo todo, solo imágenes y videos, o el paquete de prompts). Usar SIEMPRE que el usuario pida crear un anuncio, video ad o creativo estilo "musical", "canción", "cantado", "jingle", "song ad", "singing ad", o mencione crear anuncios con IA sin especificar estilo (en cuyo caso ofrecer este como una opción).
---

# Generador de Anuncios IA — Estilo Musical

Convierte un producto en un anuncio cantado: la canción **es** el guion del anuncio, y lo visual se construye encima de ella. Interactúa siempre en español con el usuario, sin importar el idioma final del anuncio.

**Esto NO es "un anuncio con música de fondo".** En los otros seis estilos la música es una capa a −26 dB por debajo de una voz. Aquí la canción es el audio del anuncio: no lleva nada debajo, no se corta, no se acelera, y su duración **es** la duración del anuncio.

## Qué hace esta skill, de punta a punta

| Fase | Quién la hace |
|---|---|
| 1. Escribir la canción (2-3 opciones: concepto + letra + estilo + idea visual) | esta skill |
| 2. Generar la canción de verdad con Suno y elegir entre las dos versiones | esta skill, con el pipeline |
| 3. Convertir la canción en tomas, prompts, personajes, B-roll y manifiesto | **la skill visual que elija el usuario** |
| 4. Producir y montar el anuncio | el pipeline de siempre, con las imágenes y los videos en Google Flow |

**La fase 3 se DELEGA, no se copia.** Esta skill nunca escribe prompts de imagen o video: invoca la skill de Crochet, Claymation o Zack D Films y le pasa el paquete. Esas tres tienen un Paso 0 hecho justamente para recibirlo. Copiar aquí su lógica visual sería mantener la misma cosa en dos sitios, y el día que una mejore, la copia se queda vieja sin que nadie lo note.

---

## Reglas obligatorias — léelas antes de generar cualquier cosa

1. **Interactúa siempre en español** con el usuario (preguntas, explicaciones, confirmaciones), sin importar el idioma en el que vaya a cantarse el anuncio.
2. **La LETRA va en el idioma del mercado del anuncio** (inglés para EE.UU., español para LatAm, portugués para Brasil) — nunca en español si el anuncio es para EE.UU.
3. **El SUNO STYLE PROMPT va siempre en inglés**, sin importar el idioma de la letra ni el del usuario. Es la instrucción técnica para Suno y en inglés da resultados más consistentes.
4. **La letra y el prompt de estilo van cada uno en su propio bloque de código separado.** Aunque la canción la generemos por API, esos dos bloques se entregan igual: son legibles, y si el usuario quiere generarla a mano en suno.com los copia de un clic a cada cuadro.
5. Nunca uses hype genérico en la letra: "cinematográfico", "voz profesional", "impresionante", "que quita el aliento".
6. Cada una de las 2-3 opciones debe sentirse realmente distinta — diferente punto de vista, diferente mood, o diferente gancho estructural. Nunca casi-duplicados.
7. **Nunca escribas prompts de imagen o video en esta skill.** Esa parte se delega (Paso 6).
8. **Nunca generes la canción sin mostrar antes el costo y pedir confirmación**, como en todo el proyecto.

### Las pausas del flujo

Hay **cinco puntos donde te detienes a esperar respuesta**, y ninguno se puede fusionar ni saltar:

| Pausa | Qué se decide |
|---|---|
| Paso 1 | brief: producto, mercado, oferta |
| Paso 2 | género, voz y **estilo visual** |
| Paso 3 | ángulo + etapa de consciencia |
| Paso 5.1 | **cuál de las 2-3 letras se produce** |
| Paso 5.3 | **cuál de las 2 versiones de Suno se queda** |

**La duración NO es una de ellas: no se pregunta.** Ver 2.2.

Las tres primeras son para escribir la canción; las dos últimas son de producción y cuestan dinero, así que nunca se deciden solas.

---

## Paso 1 — Recolectar inputs y brief

Pide al usuario:
- **Investigación de marca** (research de mercado, avatar de cliente, brief o notas que tenga) — opcional
- **URL de la página web del producto** — mínimo obligatorio para continuar

**Regla de bloqueo**: si no tiene investigación, la web es obligatoria. Si no tiene ninguna de las dos, detente y vuelve a pedirla.

Cuando lo comparta:
1. Confirma en 1 frase qué marca/producto entendiste que es.
2. Anota 2-3 cosas clave que sacaste de la investigación/web y que van a informar la canción (público objetivo, dolor principal, tono de marca, feature estrella).
3. **En el mismo mensaje**, si no es inferible de lo compartido, pregunta lo que falte:
   - Mercado/idioma del anuncio: EE.UU. (inglés), LatAm (español — ¿qué país? ¿pago contra entrega?), Brasil (portugués), o varios
   - Precio/oferta (descuento, envío gratis, garantía) — si el usuario pide que NO aparezca, respeta eso
4. Pasa al Paso 2.

---

## Paso 2 — Género, duración, voz y estilo visual

Las cuatro preguntas van **en un solo mensaje**, no en cuatro pausas.

### 2.1 — Género

> "¿Qué estilo/género musical quieres? Elige uno o dos géneros — o dime 'ayúdame a elegir' y te sugiero según tu mercado objetivo."

**Si dice "ayúdame a elegir"**: pregunta primero "¿Cuál es tu mercado objetivo? (ej. mamás, fanáticos del fitness, hombres 30-50, mujeres Gen Z, aventureros outdoor)". Luego usa este mapa para sugerir 2-3 con una razón de 1 línea cada uno:

| Demografía | Géneros que resuenan |
|---|---|
| Mamás (general) | Pop, indie pop, acústico ligero |
| Mamás (Gen X / 40+) | Country, pop suave, pop retro |
| Mujeres Gen Z | Pop, hyperpop, R&B, indie pop |
| Hombres Gen Z | Hip-hop, trap, EDM, indie rock |
| Mujeres millennial | Pop, indie pop, R&B, alt-pop |
| Hombres millennial | Indie rock, hip-hop, alt-rock |
| Hombres afrodescendientes (general) | Hip-hop, R&B, trap, neo-soul |
| Mujeres afrodescendientes (general) | R&B, hip-hop, neo-soul, pop |
| Mercado latino | Reggaetón, pop latino, bachata, trap latino |
| Audiencia tech/SaaS | EDM, lo-fi, indie rock, electro-pop |
| Fitness/entusiastas del gym | Hip-hop, EDM, hard rock, trap |
| Aventureros outdoor | Folk, indie folk, alt-rock, americana |
| Compradores de lujo | Ambient, jazz moderno, pop cinematográfico |
| Dueños de mascotas | Folk, indie pop, country |
| Skincare/belleza | Pop, R&B, indie pop, hyperpop |
| Gamers | EDM, synthwave, hyperpop, dubstep |
| Boomers (60+) | Country, rock clásico, pop suave, retro |
| Bienestar/espiritualidad | Ambient, indie folk, acústico suave |
| Oficios/trabajo manual | Country, rock clásico, southern rock |
| Foodies/chefs | Indie pop, jazz-pop, acústico |

Si la demografía no calza exacto, usa el género más cercano y explica por qué.

### 2.2 — La duración NO se pregunta

**No le preguntes al usuario cuánto debe durar la canción. La decide Suno, siempre.**

Esto se probó con dinero el 2026-09-07 y el resultado fue claro: **el parámetro `duration` de Suno no comprime la letra, la CORTA.** Se pidieron 60 segundos con una letra de cinco bloques y las dos versiones se cortaron al terminar el Verso 2 — **sin llegar nunca al puente, que es donde vive el CTA**. La misma letra sin tiempo fijo salió en 1:48 y se cantó entera.

O sea: pedir un tiempo corto no da un anuncio corto, da **un anuncio sin cierre**. Y lo que se pierde siempre es el final, porque Suno trunca por el final.

**La regla, y dilo si el usuario pregunta:** *para un anuncio más corto se acorta la LETRA, nunca el parámetro.* Menos bloques —un verso, un coro y el puente— dan una canción más corta con su cierre intacto.

Lo que sí haces es **avisar de la consecuencia** en algún momento de este paso, sin convertirlo en pregunta:

> "La duración la decide Suno según la letra: normalmente entre 1:30 y 2:30. El anuncio va a durar exactamente lo que dure la canción, y cada segundo son tomas que hay que generar y pagar. Cuando tenga la canción te doy el costo exacto antes de generar nada."

En `cancion/peticion.json` el campo `duracion` va **siempre en `null`**.

### 2.3 — Voz

> "¿La canta un hombre o una mujer? (o dime 'que elija Suno')"

Guarda `"m"`, `"f"` o `null`.

### 2.4 — Estilo visual

> "¿Con qué estilo visual quieres el video? Hay tres:
> A) **Crochet** — diorama artesanal en miniatura, todo tejido en lana
> B) **Claymation** — stop-motion de plastilina
> C) **Zack D Films** — animación 3D cinematográfica"

**Solo esos tres.** No ofrezcas UGC, esqueleto ni objeto parlante: el musical no se produce en esos estilos.

Guarda la elección. **Te va a servir ya en el Paso 4**: la idea visual de cada opción se escribe pensando en ese estilo, no en abstracto. Una idea visual escrita para claymation y producida en crochet sale peor que una escrita para crochet desde el principio.

Espera a que confirme las cuatro cosas antes de pasar al Paso 3.

---

## Paso 3 — Ángulo + etapa de consciencia del cliente

Con la investigación/web + género + duración + estilo visual en mano, propón **UNA sola** recomendación (no varias):

1. **Ángulo** — la razón de compra centrada en el cliente. NUNCA una característica ni un alarde de marca — el resultado o la transformación específica que le importa. Formatos que funcionan:
   - "Detiene [dolor]" → "Detiene que le grites a tus hijos sin querer"
   - "[Estado deseado] sin [objeción común]" → "Gana músculo sin pasar horas en el gym"
   - "[Producto] hace lo que [alternativa] no puede" → "Filtra el agua que tu filtro de jarra no puede"

2. **Etapa de consciencia** — elige UNA:
   - **No consciente** — no sabe que el problema existe
   - **Consciente del problema** — siente el dolor, no sabe que hay soluciones
   - **Consciente de soluciones** — sabe que hay soluciones, no conoce este producto
   - **Consciente del producto** — conoce el producto, no ha comprado
   - **Ya es fan** — cliente fiel/recurrente

Preséntalo así:

```markdown
**Ángulo recomendado:** "[ángulo en lenguaje de cliente]"
**Etapa de consciencia:** [etapa] — [1 línea de por qué calza]
```

Luego pregunta: "¿Vamos con esto o prefieres que ajuste algo?" Espera confirmación.

---

## Paso 4 — Entregar 2-3 guiones de canción

Genera 2-3 opciones distintas para el género + ángulo + etapa + duración + estilo visual ya confirmados. Cada opción debe sentirse DIFERENTE: varía el punto de vista (POV del producto / POV del cliente / narrador externo), el mood (enérgico / emotivo / juguetón / íntimo), o el gancho estructural.

Formato exacto por opción:

```markdown
═══════════════════════════════════
OPCIÓN [N]: "[Frase gancho / título de la canción]"
═══════════════════════════════════

**EL CONCEPTO**
[1-2 frases: ¿cuál es el vibe de la canción? ¿cuál es el punto de vista?]

**LETRA** (en [idioma del mercado])
```
[Verso 1]
[Plantea el ángulo/dolor/gancho — líneas cantables, 4-8 sílabas cada una]

[Coro]
[El gancho repetitivo — pegajoso, resuelve el ángulo]

[Verso 2 — solo si dura 30s+]
[Desarrolla el ángulo o cambia de POV]

[Coro]
[Repite o varía ligeramente]

[Puente — solo si dura 60s+]
[Callback, giro o CTA]
```

**PROMPT DE ESTILO PARA SUNO** (siempre en inglés)
```
[genre], [vocal style], [tempo/BPM], [mood], [production style]
```
(Máximo 25 palabras — Suno funciona mejor con prompts de estilo concisos.)

**IDEA VISUAL** (escrita ya para [el estilo visual elegido])
[2-3 frases: qué debería verse en pantalla, en el vocabulario de ese estilo. Referencia momentos concretos de la letra.]
```

Después de las opciones, cierra con:
"¿Quieres que refine alguna, genere más variaciones, o mejore la letra? Cuando tengas la que te gusta, dime cuál y la producimos."

---

## Paso 5 — Producir la canción

### 5.1 — El usuario elige una opción *(pausa)*

No sigas hasta que diga cuál. Puede pedir más variaciones antes; eso es normal y no cuesta nada.

### 5.2 — Generar

Elige un slug en kebab-case para el anuncio (ej. `goli-matcha-mind`) y escribe `temp/[slug]/cancion/peticion.json`:

```json
{
  "letra": "[la letra completa de la opción elegida, con sus marcas [Verso 1] / [Coro]]",
  "estilo": "[el prompt de estilo en inglés, tal cual]",
  "titulo": "[el título de la canción]",
  "duracion": null,
  "vocalGender": "f"
}
```

**`duracion` va SIEMPRE en `null`** — ver 2.2: un número ahí no acorta la canción, la trunca, y se lleva el cierre. `vocalGender` va en `null` solo si el usuario eligió que Suno decida.

**La letra va con sus tildes y su ñ de verdad.** Escribirla en ASCII (`quedo` en vez de `quedó`) le cambia la palabra al modelo y la canta mal — una prueba entera se perdió por eso. Verifícalo antes de generar.

Después:

```
npm run cancion -- temp/[slug]
```

El comando muestra el costo y pide confirmación antes de cobrar. En los musicales kie.ai es obligatorio (la canción es el anuncio): si no está conectado, `npm run cancion` lo explica, dice cómo conectarlo y no sigue. **Suno devuelve SIEMPRE dos versiones de la misma letra**, y las dos quedan en `cancion/opcion-1.mp3` y `cancion/opcion-2.mp3`.

### 5.3 — El usuario elige la versión *(pausa)*

Preséntale las dos con su duración y dile que las escuche. **Nunca elijas tú**: son dos interpretaciones distintas de la misma letra y la diferencia es de oído, no de métrica.

Cuando elija:

```
npm run cancion -- temp/[slug] --elegir 1
```

Eso deja la canción en `audio/cancion.mp3` y sus tiempos en `audio/cancion.json`, e imprime el **MAPA DE LA CANCIÓN**: qué segundo se canta cada tramo y dónde quedan los huecos sin letra.

**Lee ese mapa con atención antes de seguir.** Es lo que le vas a pasar a la skill visual, y es lo que decide cuántas tomas hacen falta.

> **Los tiempos del mapa los mide Scribe sobre el audio, no los declara Suno.**
> Los de Suno vienen gratis en la misma respuesta y **están mal donde más
> duele**: medido el 2026-09-07, 9 de 97 palabras estaban desplazadas hasta
> 4.52 segundos. Cuando hay una nota sostenida seguida de instrumental, Suno
> apretuja las palabras anteriores y estira la última para tapar el hueco.
>
> Eso hacía que los subtítulos salieran hasta 4.5s antes de cantarse, y que un
> tramo instrumental de 4.5s quedara dentro de la ventana de una toma — en
> pantalla, una imagen parada casi cinco segundos.
>
> `npm run cancion --elegir` ya lo resuelve solo. Lo único que tienes que hacer
> es **fiarte del mapa que imprime**, no de otra cosa.

> **Y presta atención a los huecos SIN LETRA del mapa.** Una canción los tiene
> entre casi todas las líneas. Los de menos de ~3 segundos se los lleva la toma
> anterior sin que se note. **Los de más de 3 segundos necesitan su propia
> toma instrumental**, o esa imagen se queda parada en pantalla todo el hueco.

---

## Paso 6 — Delegar la parte visual

Aquí termina tu parte creativa. **Invoca la skill del estilo visual que el usuario eligió** en el Paso 2.4 — Crochet, Claymation o Zack D Films — dentro de esta misma conversación. Las tres tienen un **Paso 0** escrito para recibir esto.

**Pásale el paquete completo. No solo la letra:**

| Qué | De dónde sale |
|---|---|
| **La letra** de la opción elegida | Paso 4 |
| **El concepto** de esa opción | Paso 4 |
| **La idea visual** de esa opción | Paso 4 |
| **La duración real de la canción** | del mapa del Paso 5.3 |
| **El mapa de tiempos**: qué segundo empieza y termina cada línea, y dónde están los tramos sin letra | del mapa del Paso 5.3 |
| El producto, mercado, idioma y oferta | Paso 1 |

**Por qué las tres primeras y no solo la letra**: la letra dice *qué* se canta; el concepto y la idea visual dicen *cómo se ve*. Sin ellos las escenas salen literales — una ilustración de cada frase en vez de un anuncio.

Y dile explícitamente estas cuatro cosas, que son las que distinguen un musical:

1. **`modo_audio` del manifiesto es `"musica"`**, y no lleva el campo `voz_en_off`.
2. **Las duraciones no se estiman**: salen del mapa. El presupuesto de palabras de esa skill no aplica.
3. **Los tramos sin letra llevan tomas igual**, con la línea `[intro]`, `[instrumental]` o `[cierre]`. Se cubre la canción entera, de 0 hasta el final. Ningún clip pasa de 10 segundos.
4. **El coro repetido no reutiliza tomas.** Cada repetición lleva tomas nuevas.

**Y el cierre es el de esta skill, no el de la visual.** Cuando la skill visual deja el manifiesto escrito y validado, **su Paso final no va**: ni su resumen ni sus opciones A, B y C, que no encajan con un musical (su C ofrece el guion de voz para ElevenLabs y su A pide música de fondo y transiciones). Vuelve aquí, al Paso final de esta skill: en el chat sale un solo resumen y una sola tanda de opciones. Lo único de esa skill que se conserva es la foto del producto, si la hay: la dejas lista tú con su comando, como ella lo indica, y si no sabes dónde está, la línea que se la pide va en el resumen del Paso final de aquí, sin ningún comando.

---

## Paso 7 — Producción (el pipeline de siempre, con tres diferencias)

Una vez que la skill visual dejó el manifiesto:

```
npm run tiempos    -- temp/[slug]      convierte la canción en audio/tiempos.json
npm run imagenes   -- temp/[slug]      arma la cola: ciclo de Google Flow (abajo) hasta que no quede nada
npm run videos     -- temp/[slug]      arma la cola: créditos al usuario, su ok, y ciclo de Google Flow
npm run revisar    -- temp/[slug]
npm run plan       -- temp/[slug]
npm run subtitulos -- temp/[slug]
npm run plan       -- temp/[slug]      otra vez: el plan quiere los subtítulos
npm run ensamblar  -- temp/[slug]
```

`npm run tiempos` avisa si alguna ventana quedó imposible (un tramo sin toma propia, o una toma que necesitaría un clip de más de 10s). **Arreglar eso ahí es editar el manifiesto; descubrirlo después es rehacer clips ya pagados.**

Las tres diferencias del musical, y no son opcionales:

- **NO va música de fondo.** Nunca corras `npm run musica` en un anuncio musical — la canción ya es el audio. El comando se niega solo si lo intentas.
- **NO van efectos de transición ni animaciones de entrada.** Ni woosh, ni deep-woosh, ni zoom, ni deslizamientos. **No escribas `transiciones.json`**: sin ese archivo el anuncio sale con corte seco, que es lo correcto aquí.
- **Salen DOS versiones, no tres**: `con-subtitulos` y `sin-subtitulos`. Las dos con la canción.

**Los subtítulos sí van**, exactamente con el estilo de los otros seis: una sola línea, dos o tres palabras, la palabra que se canta con su caja de color detrás. Las tomas instrumentales no llevan subtítulo porque no hay nada cantado.

### Las imágenes y los videos salen de Google Flow

En esta versión del sistema el motor **no** genera las imágenes ni los videos: arma una lista de trabajo (la cola) y **los generas tú en Google Flow**, manejando Chrome con la extensión Claude in Chrome. Donde la lista de arriba dice `npm run imagenes` o `npm run videos`, va este ciclo; todo lo demás sigue igual y en el mismo orden:

1. `npm run imagenes -- temp/[slug]` arma la cola (`temp/[slug]/flow/cola-imagenes.json`) y hace solo lo que no necesita Flow (las copias de frames).
2. Genera la cola en Google Flow con la skill **`flow-generacion`**: ahí está todo el procedimiento (ventana aparte, subir las referencias, enviar todo, reintentos y descargar cada archivo con el nombre que pide la cola).
3. `npm run flow:recibir -- temp/[slug]` mueve lo descargado a `img/` o `video/` del anuncio, lo convierte y lo verifica.
4. Repite 1-3 hasta que la cola diga que no queda nada: hay trabajos que dependen de otros (un frame heredado, `frame_anterior`, el frame inicial de la misma toma) y recién salen en la vuelta siguiente.
5. Lo mismo con `npm run videos -- temp/[slug]`. **Antes de mandar los videos a Flow**, dile al usuario cuántos clips son y la estimación de créditos que imprime el comando, y espera su ok. Las imágenes cuestan 0 créditos en Flow y no necesitan ok.

**Rehacer una toma** (lo que el usuario decida después del informe) nunca repite el mismo prompt: `npm run rehacer -- temp/[slug] --toma N --contexto` muestra lo que no se toca y los prompts que fallaron; escribe otros y aplícalos con `npm run rehacer -- temp/[slug] --toma N --aplicar nuevos.json`, que saca la imagen y el clip viejos de esa toma. Después, el ciclo de Flow de arriba con los comandos que imprime: `npm run imagenes -- temp/[slug] --tomas N` y `npm run videos -- temp/[slug] --tomas N --sin-broll` (con el ok de los créditos del clip), y `flow:recibir` normal. **Sin `--rehacer`, en ninguna vuelta**: con `--tomas N --rehacer` el motor manda a `historial/` y vuelve a pedir todo lo de esa toma, también la hoja del personaje (sale otro personaje) y el B-roll (un clip más que se paga), y repetido en cada vuelta archiva lo recién llegado y la cola no se vacía nunca. Y corre `flow:recibir` cuando la descarga nueva ya esté en Descargas: si no está, lo marca "falta": la descarga vieja quedó en `flow/descargas/recibidos/` y `flow:recibir` no la vuelve a usar, así que esa toma sigue sin rehacer hasta que llegue la nueva.

**En esta versión kie.ai solo cobra la canción** (`npm run cancion`, Paso 5), que a esta altura ya está pagada. En el Paso 7 kie.ai no cobra nada: el musical no lleva `npm run musica`.

---

## Reglas de letra y guion (aplican a las 2-3 opciones, siempre)

1. **Gancho en los primeros 5 segundos.** Sin importar la duración, lo más pegajoso aparece de inmediato.
2. **La letra vende el ÁNGULO, no la marca.** No repitas el nombre del producto como cántico — cuenta el resultado que le importa al cliente.
3. **Que suene a canción real, no a jingle.** Versos y coros reales, con esquema de rima real. Nunca "cómpralo, cómpralo, cómpralo".
4. **Líneas cortas y cantables.** 4-8 sílabas para ganchos pop — las líneas largas se sienten forzadas al cantarlas.
5. **Vocabulario y energía coherentes con el género y la demografía.** Hip-hop ≠ country ≠ pop.
6. **El coro se repite solo lo que la duración permita.** 15s = gancho + un coro. 30s = verso-coro-verso-coro. 60s = canción completa con puente. 2 minutos = estructura completa con puente y outro.
7. **El prompt de estilo se mantiene ajustado.** Género, estilo vocal, BPM, mood, estilo de producción — esa es la fórmula, sin sobrecargarlo.
8. **La idea visual debe ser PRODUCIBLE en el estilo elegido** — objetos animados, personajes estilizados, escenas simples. Nunca "toma cinematográfica de grúa en live-action".
9. **Nunca uses hype genérico**: "cinematográfico", "voz profesional", "impresionante", "que quita el aliento".
10. **Cada opción debe ser realmente distinta** de las demás.
11. **Escribe la letra sabiendo que cada línea será una toma visual.** Una línea que no se puede ver no se puede producir. Eso no significa escribir literal — significa que detrás de cada línea tiene que haber algo que mostrar.

---

## Paso final — Pregunta cómo quiere producirlo

La skill visual ya armó el paquete completo, con todos sus chequeos: la letra
repartida en tomas, las hojas de personaje, los prompts de imagen y video de
cada toma, el B-roll y el manifiesto. **Ese paquete no se muestra en el chat:**
queda interno, en el manifiesto (`temp/[slug]/manifiesto.json`), escrito y
validado. **El manifiesto no se muestra nunca**, ni siquiera en la opción C: es
interno del sistema.

**Ahora, y solo ahora, pregúntale al usuario cómo quiere seguir.** En el chat
va solo un resumen corto y las tres opciones. No lo decidas tú: las tres salidas
son legítimas y cuestan cosas distintas.

```markdown
Listo: musical en [Crochet / Claymation / Zack D Films] para [producto],
[mercado / idioma]. Canción de [duración]: [N] tomas y [M] B-roll.
[Solo si hay una decisión que conviene que sepa, en una línea: por ejemplo
"la intro instrumental de 6 segundos lleva dos tomas propias".]
El paquete quedó guardado y validado[, salvo tu foto del producto: pásamela
(arrástrala al chat o dime la ruta) y la dejo lista]. ¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero las imágenes y los videos en Google Flow,
armo el montaje y te entrego el MP4 terminado. Te muestro el costo antes de
gastar nada: los créditos de Flow de los videos (las imágenes no gastan).

**B) Genera solo las imágenes y los videos** — los genero en Google Flow y te
los dejo en su carpeta, listos para que los montes tú en CapCut a tu gusto.
También te muestro los créditos de los videos antes.

**C) Entrégame el paquete de prompts** — te paso aquí la letra toma por toma,
las hojas de personaje, los prompts de imagen y video de cada toma y el B-roll,
para que lo revises o lo produzcas a mano. Después puedes seguir con A o B.
```

El resumen son 1-3 líneas: estilo visual, producto, mercado/idioma, cuántas
tomas y B-roll, y cuánto dura (lo que dura la canción). La línea de la decisión
va solo si hay una que conviene que sepa; si no, no la pongas.

Si en cualquier momento pide ver el paquete o una parte ("muéstrame la letra
por toma", "pásame los prompts de la toma 3"), muéstrale esa parte, copiada del
manifiesto.

### Si elige A — el anuncio completo

Sigue el proceso de `COMO-PRODUCIR.md` de principio a fin, con las imágenes y
los videos por el ciclo de Google Flow del Paso 7, **sin pararte a
preguntar entre comando y comando**. El usuario ya dijo que sí: pedirle
permiso en cada paso es hacerle perder el tiempo.

**En musical NO va música de fondo ni transiciones.** La canción ya es el audio,
y este estilo no lleva animaciones de entrada. No escribas `transiciones.json`.

Las dos únicas paradas que sí van, y que no se saltan nunca:

1. **El costo, antes de generar los videos.** Cuántos clips son y la
   estimación de créditos de Flow que imprime `npm run videos`: muéstralo y
   espera un sí. El usuario paga cada clip con los créditos de su plan de
   Flow; las imágenes no gastan. La canción, lo único que cobra kie.ai, ya se
   pagó en el Paso 5.
2. **La revisión de clips, solo en `dialogo_nativo`** (UGC y objeto parlante).
   Ahí las tomas habladas no se pueden acelerar, así que un clip que sale mal
   solo se arregla regenerando — y regenerar después de ensamblar es rehacer
   todo el montaje.

Las paradas propias de Google Flow (el permiso de cada tanda de descargas, y
el inicio de sesión o el captcha que hace el usuario) las pone
`flow-generacion` y también se respetan.

Al final, entrégale los MP4 **y el informe** que pide `COMO-PRODUCIR.md`: qué
salió bien, qué salió mal toma por toma, qué regenerarías y cuántos créditos
de Flow costaría (rehacer una imagen no gasta), y el costo real: los créditos
de Flow de los videos y lo que cobró kie.ai por la canción. Ahí él decide si
quiere ajustar algo.

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
npm run imagenes  -- temp/[slug]        ciclo de Google Flow (Paso 7), hasta que no quede nada
npm run audio     -- temp/[slug]        solo si el modo es voz_en_off
npm run videos    -- temp/[slug]        ciclo de Google Flow, con el ok de los créditos
npm run plan:humano -- temp/[slug]
```

El último deja `plan-montaje.txt` en la carpeta del anuncio: dice qué toma va
con qué línea, en qué segundo, qué B-roll le toca y dónde está el mp3 de la
voz. **Está escrito para que lo lea una persona**, y es lo que necesita para
montarlo en CapCut sin adivinar nada.

Dile dónde quedó todo y qué contiene ese archivo.

### Si elige C — el paquete en el chat

Entrégale el paquete **completo, nunca una muestra**, con la estructura del
"Formato de entrega" de la skill visual que lo armó (Crochet, Claymation o
Zack D Films), **sin el manifiesto**. En musical no va el guion de voz para
ElevenLabs: no hay voz en off, la canción es el audio. La letra va en la tabla
del guion, cada línea con su toma y su ventana del mapa de la canción.

**Los prompts que muestras se copian del manifiesto carácter por carácter**: es
la fuente de verdad, y lo que el usuario ve tiene que ser exactamente lo que se
va a producir. Si pide cambios, se cambian en el manifiesto y se vuelve a
validar (`npm run validar -- temp/[slug]/manifiesto.json`).

Al final, ofrécele seguir con A o B, o dejarlo ahí.

---
## Reglas que nunca se rompen

- Nunca interactúes con el usuario en otro idioma que no sea español, sin importar el idioma del anuncio.
- Nunca escribas la LETRA en un idioma distinto al del mercado elegido.
- Nunca escribas el PROMPT DE ESTILO PARA SUNO en un idioma distinto al inglés.
- Nunca entregues letra y prompt de estilo en el mismo bloque de código.
- Nunca menos de 2 ni más de 3 opciones de canción en la entrega del Paso 4.
- **Nunca escribas prompts de imagen o video toma por toma en esta skill.** Se delega (Paso 6). Si te ves escribiendo un prompt visual, te saltaste el Paso 6.
- **Nunca copies aquí la lógica de Crochet, Claymation o Zack D Films.** Se invocan; no se replican.
- **Nunca elijas tú la letra ni la versión de la canción.** Las dos son del usuario, y las dos cuestan dinero.
- **Nunca ofrezcas un estilo visual que no sea Crochet, Claymation o Zack D Films.**
- **Nunca le pongas música de fondo a un anuncio musical.**
- **Nunca cortes ni aceleres la canción.** El anuncio dura lo que dura ella.
