# Cómo se produce un anuncio

Guía operativa para Claude Code. **Léela entera antes de generar nada.**

Cada regla de aquí salió de un anuncio real que salió mal. No son preferencias.

En esta versión del sistema **las imágenes y los videos se generan en Google
Flow**, en el Chrome del usuario, con la extensión Claude in Chrome. El motor no
los pide a ninguna API: arma la lista de trabajo (la *cola*), tú la generas en
Flow con la skill `flow-generacion`, y el motor recibe los archivos. Todo lo
demás —voz, música, revisión, plan y montaje— es el mismo motor de siempre: un
archivo está terminado cuando existe con su nombre exacto en `img/` o `video/`,
y a ningún paso posterior le importa quién lo generó.

| Servicio | Para qué | |
|---|---|---|
| **Google Flow** | las imágenes y los videos | **obligatorio**: la cuenta de Google del usuario (plan Google AI Pro o Ultra recomendado, por los créditos de video) |
| **ElevenLabs** | la voz en off y la transcripción (subtítulos de los estilos hablados, revisión del habla, voces coladas) | **obligatorio** |
| **kie.ai** | **solo** la música de fondo y las canciones, con Suno | **recomendado** (centavos por anuncio); **obligatorio** solo en musicales e historias musicales |

---

## 1. El flujo, de principio a fin

La skill del estilo hace la parte creativa —guion, prompts, manifiesto— y deja
un archivo `temp/[slug]/manifiesto.json`. **Ese paquete queda interno, no se
muestra en el chat**: el usuario ve un resumen corto (estilo, producto, mercado
e idioma, tomas y B-roll, duración aproximada y, si la hay, una decisión que
conviene que sepa) y elige **A** (producir todo), **B** (solo imágenes y
videos) o **C** (el paquete de prompts en el chat, completo y copiado del
manifiesto, para revisarlo o producirlo a mano; después se le ofrece seguir con
A o B). **El manifiesto del anuncio no se muestra nunca** en el chat, ni en la
opción C (el de `ejemplo-anuncio/` sí, está para mirarlo). Si el usuario
pide cambios en el paquete, se hacen en el manifiesto y se vuelve a validar.
Cuando elige producir, **de ahí en adelante el proceso es este**, y el orden
importa:

```
npm run preparar    -- "<ruta de la foto>" [slug]   deja la foto del producto lista
npm run validar     -- temp/[slug]/manifiesto.json
npm run imagenes    -- temp/[slug]          arma la cola: ciclo de Google Flow (1.1)
npm run audio       -- temp/[slug]          SOLO en voz_en_off
npm run videos      -- temp/[slug]          arma la cola: créditos -> sí -> ciclo de Google Flow (1.1)
npm run revisar     -- temp/[slug]
   ...aquí van la MÚSICA y las TRANSICIONES (secciones 3 y 4) ...
npm run plan        -- temp/[slug]
npm run subtitulos  -- temp/[slug]          en dialogo_nativo: node produccion/subtitulos-dialogo.js temp/[slug]
npm run plan        -- temp/[slug]          OTRA VEZ. No es un error
npm run ensamblar   -- temp/[slug]
```

Ese es el flujo de los estilos de voz en off —crochet, claymation, zack-d-films,
estilo pixar, esqueleto y estilo lego— y del objeto parlante. Los demás cambian
el arranque o el medio:

| Estilo | Su flujo |
|---|---|
| **musical** | el de arriba, con la canción primero (abajo) |
| **historias musicales** | la canción primero (abajo) y la sección 9 |
| **estilo lego** | el de arriba, con lo propio de la sección 10: la voz la elige el usuario, se nivela sola, y la música es fija |
| **UGC** | sección 11: bloques hablados, sin B-roll, con su propia revisión |
| **podcast** y **entrevista** | sección 12: tomas habladas, sin música ni transiciones |
| **continuidad** (efecto, va encima de un estilo de voz en off) | sección 13: reemplaza el proceso de producción del estilo |

**En el estilo musical el arranque es otro**, porque la canción existe antes que
el manifiesto y su duración es la del anuncio:

```
npm run cancion  -- temp/[slug] --solo-plan   el costo en kie.ai, sin gastar (antes, la clave: abajo); se espera el sí
npm run cancion  -- temp/[slug] --si          genera las 2 versiones que da Suno
npm run cancion  -- temp/[slug] --elegir N    fija la que eligió el usuario
   ... aquí la skill visual escribe el manifiesto ...
npm run tiempos  -- temp/[slug]               mide la letra y escribe audio/tiempos.json
```

Y de ahí sigue igual, desde `npm run imagenes`. En musical **no se corre
`npm run audio` ni `npm run musica`**: los dos se niegan solos y te dicen por qué.
`npm run cancion` sin `--si` pide la confirmación en la terminal y se queda
esperando: córrelo con `--si` recién cuando el usuario dijo que sí al costo.

**En historias musicales el arranque es el mismo que en musical, con dos pasos
más**, porque la canción dura 4-10 minutos y cada línea de la letra es una toma:

```
npm run cancion  -- temp/[slug] --solo-plan     el costo en kie.ai (dos estilos), sin gastar
npm run cancion  -- temp/[slug] --si            genera 4 versiones (2 estilos × 2)
npm run cancion  -- temp/[slug] --elegir N      fija la que eligió el usuario y, si la
                                                letra iba en bloques, la extiende sola
npm run tiempos  -- temp/[slug] --lineas        mide cada línea de cancion/lineas.txt
   ... aquí la skill escribe el manifiesto con esas ventanas ...
npm run tiempos  -- temp/[slug]                 escribe audio/tiempos.json
```

Y de ahí sigue igual desde `npm run validar`. La sección 9 tiene el detalle.

**En los dos cantados kie.ai es obligatorio**: la canción se hace con Suno y es
el anuncio. Sin `KIE_API_KEY` en el `.env`, `npm run cancion` lo explica, dice
cómo conectarlo y se detiene: ahí no hay opción de seguir sin canción. **Pero
eso lo hace solo al generar**: `--solo-plan` no mira la clave e imprime el costo
igual. Por eso, antes del `--solo-plan`, mira si kie.ai está conectado con
`npm run verificar` (su punto 2 dice "KIE_API_KEY cargada" o "vacia"), sin
abrir el `.env`. Si está vacía, primero se le explica al usuario que sin
kie.ai no hay canción y se conecta (sección 3); recién con la clave puesta se le
muestra el costo y se espera el sí. En el otro orden, el usuario aprueba un
costo y después hay que volver a preguntarle.

### 1.1 El ciclo de Google Flow — imágenes y videos

`npm run imagenes` y `npm run videos` **no generan ni cobran nada**: arman la
cola (`temp/[slug]/flow/cola-imagenes.json` o `cola-videos.json`), la imprimen y
hacen solo lo que no necesita Flow (copiar un frame heredado, copiar la hoja de
un host al primer cuadro de su toma, sacar el fotograma de un lugar que vuelve).
**Donde este documento o una skill dice `npm run imagenes` o `npm run videos`,
va este ciclo, en ese mismo lugar del orden:**

```
npm run imagenes     -- temp/[slug]     arma la cola y dice qué generar AHORA y qué espera
   ... skill flow-generacion: generar la cola en Google Flow y descargar cada archivo con su nombre ...
npm run flow:recibir -- temp/[slug]     mueve lo descargado a img/, lo convierte y lo verifica
npm run imagenes     -- temp/[slug]     otra vuelta: así hasta que diga "No queda nada que generar en Flow"
```

Lo mismo con `npm run videos` (la cola de videos, que `flow:recibir` deja en
`video/`).

**Por qué hay vueltas.** Hay trabajos que necesitan otro archivo y recién entran
a la cola cuando ese ya existe: las tomas esperan las hojas de referencia que
adjuntan, el frame final de una toma B espera su frame inicial, `frame_anterior`
espera la toma anterior, la hoja del host B espera la del A, un bloque UGC que
vuelve a un lugar espera su bloque de origen. El comando los lista como "esperan
a que existan otros archivos". No los toques: salen solos en la vuelta siguiente.

**`flow-generacion` tiene todo el procedimiento del navegador**: ventana aparte,
subir las referencias, mandar todos los trabajos seguidos, revisar lo generado,
reintentos y descargar cada archivo con su nombre. Y pone sus propias paradas,
que **van siempre**:

- **La ventana aparte, una vez por sesión.** La extensión abre el grupo de
  pestañas "Claude" en la ventana que el usuario tenga activa. Se le pide que
  haga clic derecho en la etiqueta **"Claude"** y elija **"Mover grupo a una
  ventana nueva"**, y que no cierre ni minimice esa ventana mientras trabajas.
  Él sigue trabajando en la suya.
- **Un permiso por tanda de descargas**, en el chat: cuántos archivos, de qué
  proyecto de Flow y a qué carpeta. Sin un sí claro, no se descarga. La primera
  vez Chrome puede preguntar si el sitio puede descargar varios archivos: que
  el usuario haga clic en "Permitir".
- **Inicio de sesión, verificaciones y captchas los hace el usuario.** Se le
  pide y se espera.

**Un video que sale mal no se regenera sin el ok del usuario.** Al revisar lo
generado, `flow-generacion` (su sección 5) regenera en Flow lo que sale mal. En
una imagen está bien: cuesta 0 créditos. Pero un video regenerado vuelve a
gastar créditos que el usuario no aprobó. Así que un clip que en esa revisión
sale deformado, sin movimiento, con otra cara o con la boca quieta se le
muestra al usuario, con qué falló y cuántos créditos cuesta rehacerlo, y se
espera su sí (la sección 6 de este documento). Lo mismo con un video que
`flow:recibir` rechaza (abajo). Los reintentos por un rechazo de políticas (la
sección 6 de `flow-generacion`) no cobran y siguen igual, sin preguntar. **El
modelo de respaldo también espera el sí**: si un video falla todos los intentos
con Omni y su trabajo trae `respaldo` (Veo 3.1 - Fast), mandarlo con ese modelo
cuesta más créditos. Se le dice al usuario cuántos (los muestra el menú de
ajustes de Flow con ese modelo elegido) y se espera su sí antes de mandarlo. La
única excepción la pone una skill: en la entrevista, un clip hablado que
`lineas` encuentra sucio se rehace sin preguntar, con su costo dicho (sección
12).

**El prompt de la cola se pega tal cual.** Solo se cambia si Flow lo rechaza por
sus políticas cuatro veces seguidas: entonces se cambia solo lo que puede activar
el filtro, conservando la escena, y se anota en `flow/cambios-de-prompt.md`
(archivo, qué se cambió y por qué) para contárselo al usuario. **En los estilos
con diálogo —los de `dialogo_nativo`: UGC, objeto parlante, podcast y
entrevista— el cambio va primero al manifiesto**, nunca solo en la caja de Flow.
Los subtítulos salen de la `linea` del manifiesto alineada con lo que se oye
(y en UGC, podcast y entrevista, la revisión del habla también compara contra
ella). Si el clip dice otras palabras, el subtítulo muestra el texto viejo, o
esa línea queda sin subtítulo. Qué se toca en UGC, podcast y entrevista está en
las secciones 11 y 12. **En el objeto parlante** se cambia, con su misma
función y su mismo largo (la duración de la toma está atada a sus palabras), la
`linea` de la toma y la misma frase dentro de su `prompt_video` (la línea
hablada entre comillas). Antes se recibe con `flow:recibir` lo que sí salió de
esa tanda. Después se valida con `npm run validar`, se vuelve a armar la cola
con `npm run videos -- temp/[slug]` (que la saca del manifiesto) y se anota en
`flow/cambios-de-prompt.md`.

**Las descargas** llegan a la carpeta Descargas como `<slug>__<archivo>` (por
ejemplo `mi-anuncio__toma-3-inicial.jpg`). No se renombran ni se mueven a mano.
Si Chrome descarga en otra carpeta, va en el `.env` como `FLOW_DESCARGAS=`.

| `flow:recibir` | |
|---|---|
| `npm run flow:recibir -- temp/[slug]` | mueve, convierte (las imágenes a png, los iconos sobre verde a transparencia) y verifica |
| `... --solo-ver` | solo muestra qué encontraría, sin mover nada |
| `... --desde <carpeta>` | busca las descargas en otra carpeta |
| `... --respaldo toma-3,broll-2` | esos salieron del modelo de respaldo de Flow (queda anotado) |
| `... --rehacer` | reemplaza un archivo que ya estaba (lo viejo va a `historial/`); solo si el archivo viejo sigue en `img/` o `video/` |

Lee su resumen: **faltan** son descargas que no encontró (descárgalas; si una
todavía se está bajando, lo dice y espera a que termine); **rechazados** son
archivos que no sirven: un video sin imagen, uno más corto de lo que necesita el
montaje, uno de continuidad que no dura lo pedido, o un clip hablado que llegó
sin audio. Si en Flow el resultado está bien y lo que falló fue la descarga, se
vuelve a descargar (no cuesta nada); si el clip salió así, se regenera en Flow,
con el ok de sus créditos (arriba). El rechazado queda en `flow/descargas/rechazados/`.

Lo que `flow:recibir` coloca pasa a `flow/descargas/recibidos/` y **nunca
vuelve a su lugar**: si un archivo se sacó a `historial/` para rehacerlo, figura
como "falta" hasta que llegue la descarga nueva. Lo único que toma de
`flow/descargas/` es un archivo suelto en esa carpeta (fuera de sus
subcarpetas), que alguien movió ahí antes de recibirlo, y el resumen lo marca
"(de flow/descargas/)".

**La parada de créditos, antes de mandar los videos.** Las imágenes cuestan 0
créditos en Flow y no esperan ningún sí. Los videos sí: cuando `npm run videos`
arma la cola, imprime cuántos clips son y la estimación de créditos de Flow, por
largo. Díselo al usuario —**incluidos los que esperan una vuelta siguiente**,
para que el sí cubra todo el anuncio— y espera su ok antes de mandar nada a
Flow. El comando ya suma los clips de 4, 6 y 8 s (7, 10 y 12 créditos). Los de
10 s y los del respaldo están sin medir y el comando los marca así: no inventes
el número, elige esa duración en el menú de ajustes de
Flow, que muestra cuántos créditos usa, y dale el total con ese dato (sección
5). Con `npm run videos -- temp/[slug] --solo-plan` ves la cola y los créditos
sin escribir nada.

**`imagenes` y `videos` no llevan `--si`**: no cobran ni preguntan nada en la
terminal. Y **`--rehacer` va una sola vez**, al armar la cola: ahí lo viejo pasa
a `historial/` (se mueve, no se borra) y se vuelve a pedir. `flow:recibir` y las
vueltas siguientes van **sin** `--rehacer`: repetido después de recibir, archiva
lo que acaba de llegar y lo pide otra vez —y en videos se paga otra vez—. Para
rehacer una toma no se usa `--rehacer` sino `npm run rehacer` (sección 6).

Al terminar con Flow, se le cuenta al usuario cuántas imágenes y videos se
generaron, cuántos reintentos hubo, qué prompts se cambiaron y por qué, y los
créditos de video usados. La pestaña de Claude se cierra recién cuando no quedan
trabajos de Flow en el anuncio.

### 1.2 Los demás comandos que existen

| | |
|---|---|
| `npm run musica -- temp/[slug]` | la pista de fondo (sección 3): con Suno, o la copia de la pista fija de estilo lego. `--solo-plan` dice el costo y si kie.ai está conectado (sección 3); `--si` genera sin preguntar en la terminal; `--suno` pide una de Suno en un estilo con pista fija |
| `npm run rehacer -- temp/[slug] --toma N --contexto` | lo que no se toca de una toma y los prompts que fallaron (sección 6) |
| `npm run rehacer -- temp/[slug] --toma N --aplicar nuevos.json` | pone los prompts nuevos y saca a `historial/` la imagen y el clip viejos de esa toma |
| `npm run plan:humano -- temp/[slug]` | el plan legible para montar a mano en CapCut |
| `npm run frames -- temp/[slug]` | tiras de fotogramas para revisar el resultado, en `qa/` |
| `npm run voces` | lista las voces de ElevenLabs de la cuenta (`--propias`, `--buscar ana`) |
| `npm run voces:revisar -- temp/[slug]` | busca voces coladas en los clips (sección 6). No hace falta en historias musicales: los clips van mudos |
| `npm run voz:nivelar -- temp/[slug]` | la nivelación de la voz de estilo lego, otra vez (sección 10) |
| `npm run -s flow:js -- temp/[slug]` | el código de los ayudantes que `flow-generacion` pega en la página de Flow (con `-s`: sin él, npm agrega un encabezado que no es JavaScript y el pegado falla) |
| `npm run verificar` | revisa que todo esté instalado y conectado; si algo del entorno falla, empieza por aquí |

Los de un estilo en particular están en su sección: `lineas`, `voz` y `recortar`
(12), `ugc:cola` y `ugc:gancho` (11), `continuidad` (13).

`--solo-plan` sirve en `imagenes`, `videos`, `musica`, `cancion`, `lineas`,
`ugc:cola` y otros: muestra qué harían y cuánto costarían sin gastar. `--si`
salta la confirmación de la terminal en `musica` y `cancion`: úsalo solo si el
usuario ya confirmó el costo.

> **Dos números que no aplican en esta versión.** `npm run validar` puede
> imprimir un costo en créditos y dólares de kie.ai para las imágenes y los
> videos, y `npm run estimar:video` calcula lo mismo: son los precios del
> sistema por API. Aquí las imágenes y los videos salen de Flow, así que **no se
> le muestran al usuario**. El número que vale es el de `npm run videos`.

### 1.3 El plan corre DOS veces, y saltarse la segunda no falla ruidosamente

`plan` escribe `plan-montaje.json`, que es de donde comen los subtítulos y el
ensamblado. Pero el plan también **necesita** los subtítulos, para meterlos
dentro del video. Por eso va: **plan → subtítulos → plan → ensamblar**.

Si te saltas la segunda pasada, `ensamblar` avisa *"todavía no hay
subtítulos"*, renderiza una versión de menos y **termina bien**. Es fácil no
notarlo. Corre el plan dos veces siempre.

Los subtítulos salen de dos comandos distintos, según el modo de audio:
`npm run subtitulos` en voz en off y en los cantados (lee los tiempos de la voz
o de la canción), y `node produccion/subtitulos-dialogo.js temp/[slug]` en
`dialogo_nativo` (UGC, objeto parlante, podcast, entrevista), que alinea la
`linea` del manifiesto con lo que se oye en cada clip. `npm run subtitulos` en un
anuncio hablado pide una pista de voz que ahí no existe.

---

## 2. Los tres modos de audio

El campo `modo_audio` del manifiesto decide todo el montaje. **No lo cambies:**
lo declara la skill.

| | `voz_en_off` | `dialogo_nativo` | `musica` |
|---|---|---|---|
| Estilos | crochet, claymation, zack-d, estilo pixar, esqueleto, estilo lego (y continuidad, que va encima de ellos) | UGC, objeto parlante, podcast, entrevista | musical, historias musicales |
| El audio manda | la voz en off de ElevenLabs | el clip: el personaje habla dentro | la canción |
| `npm run audio` | **sí** | no (se niega solo) | no (se niega solo) |
| Subtítulos | `npm run subtitulos` | `node produccion/subtitulos-dialogo.js` | `npm run subtitulos` |
| B-roll | en fila, rellena la ventana | **encima** de la toma (UGC no lleva; podcast y entrevista, sección 12) | en fila (historias musicales no lleva) |
| Las tomas se aceleran | sí | **nunca** las habladas | sí |
| Música de fondo | **obligatoria** (sección 3) | **obligatoria** en UGC y objeto parlante · **nunca** en podcast y entrevista | **nunca** |
| Animaciones + efectos | **obligatorias** (sección 4), salvo con continuidad | **obligatorias** en UGC y objeto parlante · **nunca** en podcast y entrevista | **nunca** |
| Versiones de salida | 3 | 3 (UGC, objeto parlante) · 2 (podcast, entrevista) | **2** |
| Parada obligatoria | no | **sí** | no |
| Ambiente de los clips | se mezcla bajo la voz | es el audio | musical: bajo la canción · historias musicales: **apagado** (`clips_mudos: true`) |

### La voz de ElevenLabs es MULTILINGÜE — nunca le adviertas del idioma

**Una voz que en ElevenLabs aparece como inglesa canta y habla español perfecto,
con ñ y con tildes.** El idioma lo pone el texto que se le manda, no la voz.

**Nunca le digas al usuario cosas como *"la voz que elegiste está en inglés, te
recomiendo una en español"*.** Es falso, y le hace dudar de una elección que
estaba bien. El modelo que se usa (`eleven_multilingual_v2`) es multilingüe por
diseño.

Lo único que sí importa del texto: **que lleve sus tildes y su ñ de verdad**. Un
guion escrito en ASCII puro le manda al modelo palabras distintas de las que se
escribieron —`quedo` no es `quedó`— y las pronuncia mal.

La voz en off es la del `ELEVENLABS_VOICE_ID` del `.env`. Si está vacía,
`npm run audio` lista las voces y pide elegir una. En estilo lego y en
continuidad, la elige el usuario antes de `npm run audio` (`npm run voces`), y la
elegida va al `.env`.

### La parada obligatoria de `dialogo_nativo`

**Después de generar los videos, párate y muéstraselos al usuario antes de
ensamblar.** No es opcional.

La razón: en ese modo las tomas habladas **no se pueden acelerar** —acelerarlas
deforma la voz y rompe el lip-sync—. Un clip que sale apurado o cortado tiene
una única salida, regenerar, y regenerar después de ensamblar es rehacer todo el
montaje. En los otros modos el montaje absorbe el desajuste; ahí no.

Cómo se revisa, según el estilo:

| Estilo | Con qué |
|---|---|
| objeto parlante | `npm run frames` (las tiras de `qa/`) y `npm run revisar`, mirando cada clip |
| UGC | `npm run frames` y `npm run ugc:cola`, que transcribe cada bloque (sección 11) |
| podcast y entrevista | `npm run frames` y `npm run lineas`, que transcribe cada clip y dice si está limpio (sección 12) |

Y nunca se le pide a una toma hablada otra duración que la de la cola: está
atada a sus líneas, y se cambia solo en el manifiesto.

---

## 3. La música de fondo — obligatoria, y cambia según el estilo

**Todo anuncio lleva música de fondo, salvo los dos cantados (musical e historias
musicales) y los dos de conversación (podcast y entrevista).** No es opcional y
no se le pregunta al usuario si la quiere: se le pregunta, como mucho, si le
gusta la que salió. La única pregunta que puede aparecer antes es si quiere
conectar kie.ai, cuando falta la clave (abajo).

Hay tres caminos, y el estilo decide cuál:

| Estilo | Qué se hace | kie.ai |
|---|---|---|
| **crochet** | se genera con Suno: `npm run musica -- temp/[slug]` | recomendado |
| **claymation** | se genera con Suno | recomendado |
| **objeto parlante** | se genera con Suno | recomendado |
| **UGC** | se genera con Suno | recomendado |
| **estilo pixar** | se genera con Suno (mismo proceso que zack-d, pero **sin** su pista fija) | recomendado |
| **estilo lego** | **NO se genera**: pista fija `recursos/musica/estilo-lego.mp3` ("Open Up Emotions"), **la copia el motor solo** | no se usa |
| **esqueleto** | **NO se genera**: pista fija `recursos/musica/esqueleto.mp3`, **se copia a mano** | no se usa |
| **zack-d-films** | **NO se genera**: pista fija `recursos/musica/zack-d-films.mp3`, **se copia a mano** | no se usa |
| **continuidad** | la del estilo sobre el que va, con su mismo camino | según ese estilo |
| **musical** | **ninguna.** La canción (Suno) ya es el audio del anuncio | **obligatorio** |
| **historias musicales** | **ninguna.** La canción (Suno) ya es el audio del anuncio | **obligatorio** |
| **podcast** | **ninguna**, por decisión del estilo: solo se oyen las voces de los clips | no se usa |
| **entrevista** | **ninguna**, por decisión del estilo | no se usa |

Un anuncio de zack-d-films que llega desde la skill de musicales no lleva su
pista fija: ahí la música es la canción que esa skill ya generó.

### kie.ai es recomendado, no obligatorio — y `npm run musica` lo explica solo

En esta versión kie.ai se usa **solo** para Suno: la música de fondo y las
canciones. Si `KIE_API_KEY` está vacía en el `.env`, `npm run musica` no corta
con un error técnico: explica que el estilo lleva música generada con Suno a
través de kie.ai, que cuesta centavos por anuncio, y dice las dos salidas (y
termina con código 2). Con `--solo-plan` imprime el costo y una línea
`kie.ai:` que dice "conectado" o "NO conectado": así se sabe **sin abrir el
`.env`** (tiene claves; nunca se abre para esto). En los estilos que generan su
música, si dice NO conectado, primero va esta pregunta y recién después, si
conecta, el costo. En el otro orden, el usuario
aprueba un costo y después hay que volver a preguntarle. **Pregúntale cuál
quiere:**

- **Conectarlo ahora**: crear la cuenta en <https://kie.ai>, cargar saldo, copiar
  la clave de <https://kie.ai/api-key> y pegarla en el `.env` (`KIE_API_KEY=`).
  Después sigue como abajo: el costo con `--solo-plan`, el sí y `--si`.
- **Seguir sin música**: el anuncio se arma igual, sin pista de fondo, desde
  `npm run plan`. Las transiciones van igual: no se saltan (sección 4).
  `ensamblar` va a avisar *"SIN MUSICA"*: es lo que eligió el usuario, y va en
  el informe como decisión del montaje.

En musicales e historias musicales no hay esa opción: la canción es el anuncio
(sección 1).

### Cuándo se corre y cómo se paga

La música generada se paga en kie.ai: **muéstrale el costo y espera un sí**.
Con kie.ai conectado (arriba),
`npm run musica -- temp/[slug] --solo-plan` lo dice sin gastar (una pista, US$0.06),
y lo natural es decírselo en la misma parada que los créditos de los videos: las
dos decisiones de gasto van juntas. Con el sí, `npm run musica -- temp/[slug] --si`
(sin `--si` se queda esperando una confirmación en la terminal). Deja
`musica/fondo.mp3` y, si Suno devolvió dos, `musica/fondo-alternativa.mp3`.

### Los estilos con pista fija

**Estilo lego: el motor la copia solo.** `npm run musica -- temp/[slug]` copia
`recursos/musica/estilo-lego.mp3` a `musica/fondo.mp3`, sin Suno y sin costo, y
el plan también la copia si `musica/` quedó vacía. Si el usuario quiere otra:
su archivo en `musica/` (el suyo gana sobre la fija), o una de Suno con
`npm run musica -- temp/[slug] --suno` (sacando antes `fondo.mp3`).

**Esqueleto y zack-d-films: hay que copiarla a mano.** El motor **no la copia
solo**, y no hace falta kie.ai: sin kie.ai conectado, `npm run musica` en estos
dos estilos solo indica esta copia. Antes de correr el plan:

```
copia  recursos/musica/esqueleto.mp3      ->  temp/[slug]/musica/fondo.mp3
copia  recursos/musica/zack-d-films.mp3   ->  temp/[slug]/musica/fondo.mp3
```

`buscarMusica()` mira la subcarpeta `musica/` del anuncio y usa lo que
encuentre. **Si hay una pista ahí, `npm run musica` no corre y no se cobra
nada.** Y al revés: **no corras `npm run musica` en estos dos estilos sin la
pista en su lugar**: con kie.ai conectado iría a Suno y cobraría.

Esas tres pistas son fijas y siempre las mismas: se eligieron una vez y
quedaron. Los otros cinco estilos con música generan una distinta en cada
anuncio, acorde al tono del guion.

### A qué volumen va

El nivel lo pone el motor solo. **No hay que tocarlo**, pero conviene saberlo
para no "corregir" algo que está bien:

| | dB |
|---|---|
| `voz_en_off` (crochet, claymation, esqueleto, estilo pixar) | **−26** |
| `dialogo_nativo` (UGC, objeto parlante) | **−22** |
| **zack-d-films** | **−16** |
| **estilo lego** | **medido**: el plan mide la pista que va a sonar y la deja donde quedó en el anuncio aprobado del estilo (unos −14 con su pista fija, pareja, sin subir en el payoff) |

> **Sí, los números son contraintuitivos y están medidos de oído.** En diálogo
> nativo la música va **más arriba** que en voz en off, no más abajo: el diálogo
> que genera el modelo no viene normalizado y suena constante, así que una
> música baja no se percibe nunca. Y zack-d va a −16 porque a −26 su pista no se
> oía bajo esa voz. En estilo lego el nivel se mide en vez de fijarse porque el
> usuario puede cambiar la pista, y cada pista viene masterizada a su manera.
>
> En el payoff la música sube +4 dB sola (menos en estilo lego, que va pareja).
> Nunca se cambia de canción a mitad del anuncio: la variación emocional se hace
> con volumen.

Para probar otro nivel sin gastar nada:
`node produccion/ensamblar.js temp/[slug] --musica-db -22` (renderiza solo la
versión con música, a ese nivel).

### Si el usuario quiere poner la suya

Que deje su mp3 en `temp/[slug]/musica/` y ya está: se usa esa y no se genera
nada. Cualquier nombre que no sea `fondo` gana sobre la generada (en estilo lego,
la suya gana siempre sobre la fija).

---

## 4. Las animaciones de entrada y los efectos de sonido — obligatorias

**Todo anuncio lleva cuatro, salvo:**

- los dos cantados —musical e historias musicales—, que van a corte seco;
- podcast y entrevista, que tampoco llevan `transiciones.json`: la conversación
  se corta en seco, y lo que la entrevista lleva encima (el congelado con glitch,
  el check, el clic, el fundido) lo pone el motor por el manifiesto;
- un anuncio con **continuidad**: el paso de una escena a la otra lo hace la IA
  dentro de cada video, y `transiciones.json` se ignora.

Van atadas a las cinco partes del guion —hook, problema, solución, prueba, CTA—
y entran en **la primera toma de cada parte**, no en cualquier corte:

| # | Dónde entra | Animación | Efecto |
|---|---|---|---|
| 1 | **el problema** | `deslizar-derecha` | `woosh` |
| 2 | **la solución** (el giro) | `zoom` | `deep-woosh` |
| 3 | **la prueba social** o lo que haga sus veces | `deslizar-izquierda` | `woosh` |
| 4 | **el CTA** | `zoom` | `deep-woosh` |

> **No siempre salen cuatro, y está bien.** En un anuncio corto la prueba y el
> CTA pueden vivir en la misma toma, y tres transiciones en tres cortes seguidos
> se sienten como un tic. Cuando dos posiciones colapsan o quedan pegadas, se
> deja una. En los anuncios reales salieron 4, 4, 3 y 3.

### Cómo se ponen

**Primero copia los dos efectos** a la carpeta del anuncio. Remotion solo lee
archivos que estén dentro de ella:

```
copia  recursos/efectos-transiciones/woosh.mp3       ->  temp/[slug]/efectos/
copia  recursos/efectos-transiciones/deep-woosh.mp3  ->  temp/[slug]/efectos/
```

**Después escribe `temp/[slug]/transiciones.json`** con las posiciones que
decidiste, mirando el guion:

```json
{
  "efectos": {
    "woosh": "efectos/woosh.mp3",
    "deep-woosh": "efectos/deep-woosh.mp3"
  },
  "puntos": [
    { "toma": 2,  "animacion": "deslizar-derecha",  "efecto": "woosh",      "porque": "entrada del PROBLEMA" },
    { "toma": 6,  "animacion": "zoom",              "efecto": "deep-woosh", "porque": "entrada de la SOLUCION" },
    { "toma": 9,  "animacion": "deslizar-izquierda","efecto": "woosh",      "porque": "entrada de la PRUEBA" },
    { "toma": 11, "animacion": "zoom",              "efecto": "deep-woosh", "porque": "entrada del CTA" }
  ]
}
```

`toma` es el número de la toma donde entra esa parte del guion. **El campo
`porque` se escribe siempre**: es lo que permite revisar después si la posición
tenía sentido.

**En UGC, `toma` es el número del bloque que empieza con esa parte del guion**:
una transición solo puede ir en el corte entre dos bloques, porque los cortes de
dentro de un bloque ya vienen en el clip. Una parte que arranca en medio de un
bloque no lleva transición, y en un anuncio de pocos bloques salen menos de
cuatro.

**Sin ese archivo el anuncio sale con corte seco**, sin una sola transición.
`ensamblar` lo avisa antes de renderizar y lo repite al terminar, pero no detiene
nada: es fácil que el aviso pase de largo.

### La sincronía se mide sola — no la toques

El sonido no empieza en el corte: **empieza antes**, porque si no, llega tarde.

| | Duración | Su sonido arranca |
|---|---|---|
| `zoom` + `deep-woosh` | 0.5 s | **0.2 s antes del corte** |
| `deslizar-*` + `woosh` | 0.45 s | 0.05 s antes |

**Ese adelanto no está escrito en ninguna configuración**: el motor lo mide
sobre el archivo de sonido real cada vez que arma un plan. Si algún día se
cambia un efecto por otro, el adelanto se recalcula solo.

> **Por qué `deep-woosh` se adelanta tanto**: no es un golpe, es un *swell* —
> empieza casi inaudible y crece. Se ancla el **ataque** (cuando se vuelve
> audible), no el pico. Anclar el pico lo deja demasiado temprano, y recortarle
> la cabeza al archivo suena pobre. **El archivo no se toca; lo que se mueve es
> cuándo suena.**

### Lo que NO se hace

**Nada de esto se aplica por regla ni por heurística.** Las cuatro posiciones se
deciden leyendo el guion, una por una. Un woosh puesto "cada N tomas" se nota
como lo que es: una plantilla.

Y **nunca en musical, historias musicales, podcast, entrevista ni con
continuidad**: ahí no se escribe `transiciones.json` y no se copian los efectos.

---

## 5. Lo que cuesta

Cada usuario paga lo suyo, en sus propias cuentas.

### Google Flow — las imágenes y los videos

Se descuenta en créditos del plan de Google del usuario. Los videos son lo que
más gasta del anuncio: por eso se recomienda Google AI Pro o Ultra. Medido en la
interfaz de Flow:

| | Modelo | Créditos |
|---|---|---|
| Una imagen (también una hoja, un icono, una imagen de B-roll) | Nano Banana 2.1 / Nano Banana Pro | **0** |
| Un clip de 4 s, 720p | Omni 1.1 Flash | **7** |
| Un clip de 6 s, 720p | Omni 1.1 Flash | **10** |
| Un clip de 8 s, 720p | Omni 1.1 Flash | **12** |
| Un clip de 10 s, 720p | Omni 1.1 Flash | sin medir |
| Un clip del modelo de respaldo | Veo 3.1 - Fast (solo si Omni falla todos los intentos) | más que Omni; sin medir |

El total sale de multiplicar: un anuncio de 9 tomas de 6 s y 9 B-roll de 4 s son
9 × 10 + 9 × 7 = 153 créditos. **Un clip regenerado se paga otra vez**, y
rehacer la imagen de una toma obliga a rehacer su clip (el clip sale de ella):
la imagen no cuesta, el clip sí.

`npm run videos` imprime la estimación con lo que el motor tiene medido, que
son los de 4, 6 y 8 s (los de esta tabla). **Lo que está sin medir —los de
10 s y los del respaldo— el comando lo marca "sin medir"**, por ejemplo
"106 creditos + 2 clip(s) de 10 s sin medir". **Eso se
lee en el menú de ajustes de Flow** (Video, Omni 1.1 Flash, 720p, esa duración,
x1: el menú muestra cuántos créditos usa) y se le da al usuario el total con ese
dato. Si no se puede ver, se le dice tal como lo imprime el comando ("2 clips de
10 s sin medir"). Nunca se inventa una cifra. Y si el menú de Flow muestra otro
número que esta tabla, manda el del menú: los precios cambian.

### kie.ai — solo la música y las canciones (Suno)

1 crédito = US$0.005.

| | créditos | US$ |
|---|---|---|
| Una pista de música de fondo | 12 | 0.06 |
| Una canción (por cada prompt de estilo; Suno da dos versiones) | 12 | 0.06 |
| Cada bloque más de una canción larga (extend) | 12 | 0.06 |

Historias musicales genera con dos estilos: US$0.12 antes de elegir, más
US$0.06 por cada bloque que se agrega con extend.

### ElevenLabs — la voz y las transcripciones

Salen del plan de ElevenLabs del usuario: la voz en off, y las transcripciones
de `voces:revisar`, `ugc:cola`, `lineas` y los subtítulos de los estilos
hablados. Son centavos por anuncio: la transcripción cobra unos US$0.22 por hora
de audio, y un anuncio entero son un par de minutos de clips.

> **Muestra siempre el costo antes de gastar y espera un sí**: los créditos de
> Flow antes de mandar los videos, y kie.ai antes de la música o de la canción.
> Las imágenes no esperan el sí: en Flow cuestan 0. `--solo-plan` te lo dice sin
> gastar. El usuario paga esto.

**Historias musicales es el estilo que más gasta**: 60 a 80 clips para 5
minutos, más que cualquier otro. Hay que decirlo antes de generar la canción
siquiera. Cada toma dura la ventana de su línea, y 5 minutos repartidos en 60 a
80 tomas dan de 3,75 a 5 s por toma de promedio: casi todas se piden en Flow de
4 o de 6 s, **7 o 10 créditos cada una** (alguna línea larga, de 8 s: 12). Eso
es lo que se le dice al usuario antes de la canción, sin un total inventado: el
número del anuncio lo da `npm run videos` cuando ya hay manifiesto, y ahí se
para otra vez a esperar el sí.

---

## 6. Antes de entregar un anuncio — la lista

Se corre **entera** sobre cada MP4 de salida. Lo que se puede medir, se arregla
sin preguntar: volver a renderizar no cuesta créditos.

### Antes de la lista: avisos normales vs. defectos reales

El motor imprime avisos mientras planea y mientras ensambla. **La mayoría no son
fallos: son el montaje funcionando y contándote qué decidió.** El propio motor
lo dice cuando los imprime: *"ninguno detiene el montaje"*.

| Aviso | Qué significa de verdad |
|---|---|
| `toma N acelerada a 1.3x` | el clip era más corto que su ventana y se ajustó el ritmo; es lo normal |
| `B-roll N no entra` | no había hueco; el anuncio queda igual de bien sin él |
| `música en loop` | la pista era más corta que el anuncio y se repitió; no se nota |
| `línea sin match en la canción` | esa línea no se subtitula sola; el resto sí |
| una cola cortada (UGC), un cutaway acortado (podcast), un icono en tarjeta blanca (entrevista) | decisiones del montaje de esos estilos |
| una velocidad alta o una llegada movida (continuidad) | ídem: el montaje cambia la velocidad y nunca corta |
| duración distinta a la pedida | ver el punto de abajo |

**Defectos de verdad hay pocos, y todos se miden:** fotogramas negros, tramos
congelados, voces coladas, contenido equivocado dentro de una toma, o texto
ilegible en el envase. Cada estilo suma los suyos en su skill (una minifigura
que salió humana en estilo lego, un clip hablado que no está limpio en podcast y
entrevista, un paso que no llega a su imagen en continuidad). Esos son los que
van en "lo que salió mal".

**La duración no es un defecto.** El tiempo que pide el usuario orienta el
presupuesto de palabras del guion — no es un contrato. Si pidió 40 segundos y
salieron 44.6, el anuncio está bien y se entrega así. Una diferencia del 10-20%
es normal, y viene de que la voz real no lee exactamente a la velocidad estimada.

**Nunca cortes una línea del guion, quites una toma ni inventes copy para llegar
a un número, y no se lo ofrezcas al usuario como opción.** El guion ya está
aprobado; recortarlo para cuadrar un cronómetro estropea un anuncio que
funcionaba. Se dice la duración real como dato, sin pedir disculpas.

### Lo que arreglas tú, sin consultar

**1. Fotogramas negros.**

```
ffmpeg -i <mp4> -vf "signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null -
```

Filtra los que den `YAVG < 5`. Cualquiera es un agujero en la línea de tiempo.

> Antes de darlo por negro, **compara contra el clip fuente**: un anuncio que
> abre de noche puede tener luma baja legítima. Lo que delata un agujero es que
> el clip fuente sea brillante y la salida no.

**2. Tramos congelados.**

```
ffmpeg -i <mp4> -vf "freezedetect=n=0.003:d=1.2" -f null -
```

Cualquier `freeze_start` es un clip que no alcanzó a cubrir su ventana y el
render repitió el último fotograma.

> **El chequeo de fotogramas negros NO encuentra esto.** Un clip corto no deja
> negro: congela, y el fotograma repetido tiene luma normal. Son dos fallos
> distintos y hacen falta las dos mediciones.

**3. La duración** se anota, no se corrige. Ver arriba.

**4. Los archivos son los recién generados** — mira la fecha de modificación
contra la hora actual. Medir un archivo viejo da un número correcto del objeto
equivocado.

**5. Voces coladas en los clips** — ver abajo.

### Voces coladas: la regla depende del modo

Los clips vienen con sonido ambiente, y **eso está bien y se respeta**: pasos,
pájaros, el roce de una tela. Lo que se busca es **habla** — una frase que nadie
escribió, muchas veces en inglés.

| `modo_audio` | Tomas principales | B-roll |
|---|---|---|
| `voz_en_off` | ninguna voz | ninguna voz |
| `dialogo_nativo` | **la voz ES el contenido**, no se toca | ninguna voz |
| `musica` | ninguna voz | ninguna voz |

**Dónde mirar primero: en las tomas donde dos personajes aparecen
interactuando** — uno entregándole algo al otro, dos figuras que parecen
conversar. Ese criterio ha acertado el 100% de las veces.

**Un guion con muchas interacciones va a traer voces. Cuenta con eso.** En un
anuncio aparecieron cinco.

**Los estilos que hablan son UGC, objeto parlante, podcast y entrevista** — los
de `dialogo_nativo`. Ahí la voz de las tomas principales es el anuncio y no se
toca; sus B-roll sí se revisan, porque en un B-roll nadie debería hablar en
ningún estilo. En podcast y entrevista el B-roll ya llega mudo: `flow:recibir`
le cambia el audio por silencio.

**Cómo se detecta**: transcribiendo el audio del clip. Uno limpio devuelve
etiquetas de sonido —`[birds chirping]`, `[ticking clock]`— o nada; uno con
habla devuelve una frase. **Mirar los niveles no sirve**: un clip con voz medía
más bajo que cuatro clips sin ella.

**No lo hagas a mano — hay un comando**, y sabe solo a qué clips les toca según
el modo (con continuidad, los clips de la cadena):

```
npm run voces:revisar -- temp/[slug]              revisa y reporta
npm run voces:revisar -- temp/[slug] --silenciar  además escribe silenciar.json
```

Cuesta unos centavos por clip (transcribe con ElevenLabs) y dice, clip por clip,
si detectó habla y qué frase. Los que salta los dice también, para que se vea
que no se le escapó ninguno.

**Qué hacer con los que traen voz**: silenciarles la pista. Queda en −91 dB, la
imagen intacta, no cuesta créditos. Regenerar es la otra opción, pero cuesta y
no garantiza nada — la misma toma volvió a salir con voz al regenerarla.

`--silenciar` deja un `silenciar.json` en la carpeta del anuncio, y **`npm run
plan` lo lee solo**: no hay que editar nada a mano. Vuelve a correr `plan` y
después `ensamblar`, y esos clips van mudos.

**Silenciar se decide sin consultar, pero se reporta siempre**, porque se pierde
el ambiente de esa toma.

**Un cero también hay que ganárselo.** Si el comando no encuentra nada, antes de
decir "está limpio" comprueba que el detector funciona: pásale un audio con voz
conocida y confirma que sí lo marca. Un cero de un detector roto y un cero de
verdad se ven idénticos.

### Lo que SÍ se consulta

**Regenerar un clip se pregunta y se espera el OK**, con los créditos de Flow que
cuesta. Señala qué regenerarías y cuánto costaría, y que decida el usuario. A lo
mejor le gusta como está. Una imagen sola no gasta créditos, pero la de una
toma arrastra su clip, y ese sí.

Las excepciones las dicen las skills, y son de antes de pagar los clips: una
hoja de referencia o la imagen de una persona que salió mal se regenera en Flow
sin preguntar (cuesta 0 y todo el anuncio depende de ella), y se cuenta en el
informe. Y en podcast y entrevista, a un clip hablado que no está limpio no se
le ofrece quedarse: se regenera, con su costo dicho (sección 12).

### Cómo se rehace una toma

**Nunca con el mismo prompt**: si una toma salió mal, el problema casi siempre
está en la instrucción, no en la suerte. Y **nunca con
`npm run imagenes -- temp/[slug] --tomas N --rehacer`**: con `--tomas N` la cola
también lleva las hojas de referencia y el B-roll de esa toma, y `--rehacer` los
archivaría y los volvería a pedir. La toma nueva saldría con otro personaje y
otro envase que el resto del anuncio, y el B-roll se pagaría otra vez.

```
npm run rehacer  -- temp/[slug] --toma N --contexto           lo que no se toca y los prompts que fallaron
   ... escribe una escena distinta para la misma intención en nuevos.json:
       prompt_imagen_inicial, prompt_imagen_final (solo si la toma es B), prompt_video ...
npm run rehacer  -- temp/[slug] --toma N --aplicar nuevos.json   los pone en el manifiesto (los anteriores quedan
                                                                 en prompts-anteriores.json) y saca SOLO la imagen
                                                                 (o el par inicial/final) y el clip de esa toma,
                                                                 a historial/ (se mueven, no se borran)
npm run imagenes -- temp/[slug] --tomas N                     ciclo de Flow (en una toma B, dos vueltas)
npm run videos   -- temp/[slug] --tomas N --sin-broll         créditos -> sí -> ciclo de Flow
npm run plan     -- temp/[slug]
npm run ensamblar -- temp/[slug]
```

Sigue los pasos que imprime `--aplicar`, en ese orden, **sin `--rehacer` en
ningún comando**, tampoco en `flow:recibir`: lo viejo ya no está en la carpeta.
`--aplicar` lo manda a `historial/` en todas las tomas, también en las A, B y C
(su imagen o su par inicial/final y su clip): si la toma nueva sale peor, la
anterior se recupera de ahí. Sin `--sin-broll`, `--tomas N` también pide el
B-roll que va encima de esa toma.
El clip se rehace siempre, aunque solo cambie la imagen, porque sale de ella.

Si la imagen está bien y solo el clip salió mal (una deformación, un salto),
basta `npm run videos -- temp/[slug] --tomas N --sin-broll --rehacer`, **una sola
vez**: manda el clip viejo a `historial/` y lo pone en la cola. Con el ok de los
créditos sigue el ciclo de Flow, con `flow:recibir` y las vueltas siguientes sin
`--rehacer`.

UGC, podcast, entrevista y continuidad rehacen a su manera: está en sus
secciones (11, 12 y 13).

### El informe de entrega

Con cada anuncio terminado va un informe, sin adornos, en **dos apartados
separados** — mezclarlos hace que un anuncio bueno parezca roto. Varias skills
le suman un tercero al principio, **lo que salió bien**: se respeta.

**Decisiones del montaje** — lo que el motor resolvió solo:

- Duración real, dicha como dato
- Tomas aceleradas y cuánto
- B-roll que no entraron, y por qué
- Música: cuál se usó, a qué dB, si se repitió en loop (o que el usuario eligió
  seguir sin kie.ai, y por eso no lleva)
- Qué decidiste tú sin consultar, y por qué

**Lo que salió mal** — solo defectos medidos:

- Fotogramas negros o tramos congelados: cuántos, dónde, y si se corrigieron
- Voces coladas, y qué se hizo con ellas
- Imágenes o clips con contenido equivocado, uno por uno
- En Google Flow: los reintentos, los prompts que se cambiaron y por qué
  (`flow/cambios-de-prompt.md`), los clips que salieron del modelo de respaldo
- Qué regenerarías y cuántos créditos de Flow costaría

Y al final, el **costo real**: los créditos de Flow de los videos (los
regenerados incluidos; las imágenes, 0) y lo que cobró kie.ai por la música o la
canción, si hubo. Si el apartado de defectos queda vacío, se dice que quedó
vacío: eso es información, no falta de rigor.

---

## 7. Reglas de medición — cómo NO engañarte solo

Estas tres costaron horas de conclusiones equivocadas.

**Mide la propiedad correcta, no una que se le parezca.** Comparar
`mean_volume` entre dos versiones para saber si una lleva música da −24.6 contra
−24.7: parecen iguales y no lo son. Hay que **restar las señales**.

**Y para restar dos archivos estéreo hay que cruzar los canales de los dos**,
no los del primero:

```
ffmpeg -i a.wav -i b.wav -filter_complex \
  "[0:a][1:a]amerge=inputs=2,pan=stereo|c0=c0-c2|c1=c1-c3,volumedetect" -f null -
```

Con `pan=mono|c0=c0-c1` estarías midiendo el **ancho estéreo de un archivo**, no
la diferencia entre dos. **El control que lo delata**: restar un archivo contra
sí mismo tiene que dar ~−91 dB.

**Si los dos audios no están alineados al sample, la resta no sirve** — 15 ms de
desfase anulan la cancelación y el resultado *sube*. Ahí se comparan
**envolventes** por ventanas. Y para saber si dos archivos son idénticos, lo más
simple es el **MD5 del PCM decodificado**.

**Valida un filtro antes de creerle su silencio.** Un `freezedetect` que no
imprime nada puede significar "no hay congelados" o "no corrió". Se comprueba en
diez segundos fabricando un video con un congelado a propósito.

**Confirma que el archivo que mides es el que acabas de generar.** Un render que
falló deja el archivo viejo en su sitio, y la medición dice que tu arreglo no
sirve cuando ni siquiera corrió. Lo mismo con Flow: si el archivo viejo seguía
en `img/` o `video/`, `flow:recibir` no lo toca aunque haya una descarga nueva
(lo dice con "YA … ya estaba: no lo toque"), y lo que mides sigue siendo el
viejo. Lee su resumen: lo recién colocado sale con "OK".

---

## 8. Cosas del motor que conviene saber

**Un archivo está terminado cuando existe con su nombre exacto** en `img/` o
`video/`. Lo que ya existe no se vuelve a pedir: por eso la cola de una vuelta
nueva trae solo lo que falta, y por eso para rehacer algo primero tiene que
salir de ahí (a `historial/`, nunca borrado).

**Un clip no pasa de 10 segundos.** Una toma que necesite más se parte en dos.
La `duracion` de una toma en el manifiesto es la que dice la skill (en
historias musicales, su ventana con un decimal); **el clip se pide en Flow con
la duración de su enum cerrado —4, 6, 8 o 10— que la cubre**. Flow no tiene
5 s: una toma de 5 se pide de 6 (la cola ya trae la duración, y ajusta el
número dentro del prompt para que no se contradigan) y el montaje lo acomoda a
su ventana. Algunas tomas llevan ya en el manifiesto uno de esos cuatro
números, porque su clip se pide con ese largo exacto: los bloques de UGC y las
tomas habladas de podcast y entrevista (el validador lo exige), y los pasos de
continuidad (los calcula `npm run continuidad -- temp/[slug] --duraciones`).

**Todo B-roll se pide a 4 segundos como mínimo**, porque el modelo no baja de
ahí. Si su hueco en el montaje es mayor, hay que pedirlo más largo o el render
congela el último fotograma.

**Las transiciones y la música tienen su propia sección** — la 3 y la 4. No las
saltes: son obligatorias en ocho estilos (crochet, claymation, zack-d, estilo
pixar, esqueleto, estilo lego, UGC y objeto parlante; con continuidad va la
música del estilo, no las transiciones) y **el motor te avisa si
faltan** —`ensamblar`, antes de renderizar y otra vez al terminar—, pero el
aviso no detiene nada: un anuncio sin ellas se renderiza perfecto y sale plano.

**El montaje automático es opcional.** Llevarse los clips a CapCut es una salida
legítima. `npm run plan:humano -- temp/[slug]` deja `plan-montaje.txt` en la
carpeta del anuncio: dice qué toma va con qué línea, en qué segundo, y qué
B-roll le toca. Está escrito para que lo lea una persona.

**Si el usuario deja un mp3 propio en `musica/` dentro de la carpeta del
anuncio, no se genera música con IA** — se usa la suya y no se cobra nada.

**Las herramientas están fijas en el código**, no en las skills. El modelo de
cada imagen y de cada video lo dice su trabajo en la cola (Nano Banana 2.1 o
Nano Banana Pro para las imágenes, Omni 1.1 Flash para los videos, y el
respaldo si lo trae), y sale de `produccion/flow/flow.js` y `produccion/config.js`.
Cuando una skill menciona Midjourney o Kling, eso es para quien copia los prompts
a mano.

**Un proceso pesado a la vez.** El render de `ensamblar`, el recorte del host
del podcast y el paso `voz` de la entrevista trabajan con video en la
computadora del usuario: de a uno, nunca dos a la vez. Si la máquina tiene poca
memoria libre, o el render falla con *"No frame found at position"*, se corre
`npm run ensamblar -- temp/[slug] --concurrencia 1`: tarda más y sale bien.

---

## 9. Historias musicales — el flujo propio

Es el único estilo donde **primero existe la canción y después todo lo demás**.
La letra es el guion entero (una historia en primera persona de 4-10 minutos),
Suno la canta de principio a fin, y **cada línea de la letra es una toma**. Lo
que cambia respecto a los demás estilos, en orden:

**1. La letra decide la duración, nunca al revés.** Minutos ≈ palabras ÷ 125.
A Suno **no se le manda `duration`** (trunca por el final y se lleva el CTA).
Si la canción salió de 4:47 cuando el usuario pidió "4 minutos", eso está bien:
el anuncio dura lo que dura la canción y **la letra no se recorta ni se estira
para cuadrar un número**.

**2. Se generan dos estilos y el usuario elige de oído.** `npm run cancion`
genera 4 versiones (2 por cada prompt de estilo). Se le dice dónde están, cuánto
dura cada una y cuál estilo es cada par. **Nunca se elige por él.** Si ninguna
le convence se ajusta el prompt de estilo (no la letra) y se vuelve a generar.
`--elegir N` deja `audio/cancion.mp3`, los tiempos medidos con Scribe y el
**mapa de la canción**: la duración real y los huecos sin letra.

**3. Letras largas van por bloques.** Suno canta bien hasta ~3.500 caracteres.
Más largo, la skill parte la letra en bloques (siempre al final de un acto) y
`--elegir` los agrega solo con *extend* sobre la versión elegida, 12 créditos
de kie.ai por bloque, quedándose con la versión de cada extend que mejor canta
la letra.

**4. `cancion/lineas.txt` y `npm run tiempos --lineas`.** Una línea por toma:
el texto exacto de cada línea de la letra, en orden, más las marcas
`[intro]`, `[instrumental]` y `[cierre]` para los huecos sin letra. **Los huecos
se cubren con tomas de ~3 s, no con una larga**: una intro de 8,5 s son tres
`[intro]` seguidos, una cola de 14 s son cinco `[cierre]`; el comando reparte el
hueco en partes iguales. Imprime inicio, fin y **ventana** de cada línea; una
línea que pase de 10 s se parte en dos en `lineas.txt` y se vuelve a medir.
**La `duracion` de cada toma del manifiesto es su ventana**, con un decimal; el
clip se pide en Flow con la duración de 4, 6, 8 o 10 s que la cubre (sección 8).

**5. Los clips van mudos y sin transiciones.** El manifiesto lleva
`"clips_mudos": true` y el plan apaga el ambiente de los 50-80 clips: el único
audio es la canción. No se corre `npm run musica`, no se escribe
`transiciones.json`, no hace falta `npm run voces:revisar` (una voz colada no
se oye). Salen **dos** versiones: con y sin subtítulos.

**6. Personajes con hoja de referencia, y el producto con la etiqueta dictada.**
En 60-80 tomas la protagonista cambia de cara si no hay hoja: la skill genera
`protagonista_antes`, `protagonista_despues` (con la de antes como referencia
para que sea la misma persona), villano, mensajero y los secundarios que se
repiten. En el ciclo de Flow eso son varias vueltas: `protagonista_despues`
espera la hoja de `protagonista_antes`, y cada toma espera las hojas que
adjunta. La hoja del producto se genera desde la foto **con el texto de la
etiqueta escrito literal en el prompt**: con la foto sola, el modelo reescribe
el texto chico ("B-Vitamins" donde decía "Elderberry Extract"), y como esa hoja
se adjunta a todas las tomas con envase, el error se repite en cada una.

**7. Tipo B solo en cambios de estado** (el mecanismo apagado → encendido, el
espejo antes → después). Todo lo demás Tipo A. Sin B-roll: `"broll": []`.

**8. Los textos en pantalla no van al manifiesto.** El motor no dibuja textos;
la skill los entrega como *datos para el editor* (sticker de la oferta, "Semana
3", tarjeta final) para quien monte a mano en CapCut, y el manifiesto lleva
`"overlays": []`.

**9. El costo se dice dos veces**: antes de la canción (US$0,12 en kie.ai por
dos estilos, más US$0,06 por bloque de extend, y que vienen 60 a 80 clips de 7
o 10 créditos cada uno: sección 5) y antes de mandar los videos a Flow (los
créditos que estima `npm run videos`: es el estilo con más clips). Las imágenes, aunque sean muchas, cuestan 0 créditos en Flow y no
esperan el sí. Se muestra y se espera el sí.

El orden completo (`imagenes` y `videos` son el ciclo de Flow de la sección 1.1):

```
npm run preparar   -- "<ruta de la foto>" [slug]
npm run cancion    -- temp/[slug] --solo-plan
npm run cancion    -- temp/[slug] --si
npm run cancion    -- temp/[slug] --elegir N
npm run tiempos    -- temp/[slug] --lineas
   ... manifiesto ...
npm run validar    -- temp/[slug]/manifiesto.json
npm run tiempos    -- temp/[slug]
npm run imagenes   -- temp/[slug]
npm run videos     -- temp/[slug]
npm run revisar    -- temp/[slug]
npm run plan       -- temp/[slug]
npm run subtitulos -- temp/[slug]
npm run plan       -- temp/[slug]
npm run ensamblar  -- temp/[slug]
```

Si después de un cambio hay que rehacer tomas y la numeración se corre (por
ejemplo, al partir la intro en tres), **las imágenes y clips que siguen
sirviendo se renombran al número nuevo, no se regeneran**: renombrar es gratis
y solo se paga lo que no existe. Después hay que volver a correr
`npm run tiempos` (sin `--lineas`) antes de `plan`, o el plan usa los tiempos
viejos.

---

## 10. Estilo Lego — lo propio

Es un estilo de voz en off y sigue el flujo de la sección 1. Lo que cambia:

**1. La voz la elige el usuario.** El motor narra con la `ELEVENLABS_VOICE_ID`
del `.env` sin preguntar, así que antes de `npm run audio` se listan las voces
con `npm run voces` y el usuario elige (de hombre o de mujer, la que quiera). La
elegida va al `.env`.

**2. La voz se nivela sola.** `npm run audio` la deja al nivel del anuncio
aprobado del estilo (unos −13,6 dB donde se habla), sin mover una muestra. La
original queda en `audio/voz-original.mp3` y no se nivela dos veces;
`npm run voz:nivelar -- temp/[slug]` lo repite si hace falta (con `--solo-medir`
mide sin escribir nada). **Los niveles no se tocan a mano**: ni el de la voz ni
el de la música.

**3. La música es fija**: "Open Up Emotions", la copia el motor
(`npm run musica`, y el plan si `musica/` quedó vacía). Sin Suno y sin costo: en
estilo lego kie.ai no cobra nada, salvo que el usuario pida una de Suno. Queda
pareja, unos 20 dB por debajo de la voz, sin subir al final (sección 3).

**4. Las imágenes** salen del modelo de imagen que diga la cola para cada una,
con su respaldo: no se cambia a mano.

**5. Defectos propios del estilo**, que se regeneran con el prompt revisado: una
minifigura que salió humana o que se dobla, ladrillos que se derriten, una pieza
Lego colada en una toma médica (o una toma médica sobre grid o como diagrama),
el producto convertido en piezas, algo real que salió como pieza Lego. La lista
completa está en la skill.

---

## 11. UGC — el flujo propio

Una persona generada con IA habla a cámara todo el anuncio, por **bloques** de
4, 6, 8 o 10 s: cada bloque se genera de una vez en Omni 1.1 Flash por
ingredientes (la imagen de la persona, la foto del producto y, si vuelve a un
lugar, el fotograma de ese lugar), sin frames encadenados y sin B-roll. La voz
la genera el clip: no hay `npm run audio`.

```
npm run preparar     -- "<ruta de la foto>" [slug]   si hay foto y no se hizo
npm run validar      -- temp/[slug]/manifiesto.json  (su costo de kie.ai no aplica)
npm run imagenes     -- temp/[slug]                  ciclo de Flow: la imagen de la persona
npm run videos       -- temp/[slug]                  arma la cola de bloques
npm run musica       -- temp/[slug] --solo-plan      el costo de la música y si kie.ai está conectado, sin gastar (sección 3)
   ... bloques, créditos de Flow, ganchos y música -> PARADA 1: esperar el ok ...
   ... si aprobó los ganchos: npm run videos -- temp/[slug] --ganchos, antes de ir a Flow ...
   ... ciclo de Flow de los videos, en vueltas (con --ganchos si los aprobó) ...
npm run frames       -- temp/[slug]                  un fotograma a mitad de cada tramo
npm run ugc:cola     -- temp/[slug]                  transcribe cada bloque y marca dónde cortar si repite el final
   ... revisión de cada bloque -> PARADA 2 ...
npm run musica       -- temp/[slug] --si
   ... efectos y transiciones.json (sección 4: toma = número de bloque) ...
npm run plan         -- temp/[slug]
node produccion/subtitulos-dialogo.js temp/[slug]
npm run plan         -- temp/[slug]                  OTRA VEZ
npm run ensamblar    -- temp/[slug]
```

- **La imagen de la persona, antes de los bloques.** Esa cara va en todo el
  anuncio. Si salió con texto, con algo en las manos, con otra persona o no se
  parece a la descripción, se regenera en Flow sin preguntar (0 créditos):
  `npm run imagenes -- temp/[slug] --rehacer` una vez, y después el ciclo sin
  `--rehacer`.
- **Los lugares que vuelven salen en vueltas.** Un bloque que vuelve a un lugar
  espera a su bloque de origen; cuando ese llega, la siguiente `npm run videos`
  saca el fotograma del lugar (con ffmpeg, gratis, en `img/<id>.png`) y pone en
  la cola los que lo usan. En la parada de créditos se incluyen esos bloques
  que esperan, para que el sí cubra todo.
- **La repetición del final no es un defecto.** Si a un bloque le sobró tiempo y
  repite al final lo que ya dijo, `ugc:cola` deja `toma-N.cola.json` y el
  montaje corta después de la última palabra del guion. Una repetición en medio,
  una frase que falta o un "no se pudo decidir" sí se revisan.
- **Rehacer un bloque** (la tirada falló: otra cara, texto, apurado) es con el
  mismo prompt: `npm run rehacer -- temp/[slug] N` saca el clip a `historial/`
  (y su corte de cola), después `npm run videos -- temp/[slug]` arma la cola solo
  con ese bloque, el ciclo de Flow con `flow:recibir` sin `--rehacer`,
  `npm run frames` y `npm run ugc:cola -- temp/[slug] --tomas N`.
- **Si Omni rechaza un bloque por contenido** después de los reintentos de
  `flow-generacion`: se reescribe solo el copy de ese bloque en el manifiesto
  (`linea`, `tramos` y `prompt_video`), con su misma función y duración, se
  valida con `npm run rehacer -- temp/[slug] N`, se vuelve a armar la cola y se
  anota en `flow/cambios-de-prompt.md`. Hasta 3 reescrituras; a la tercera, se
  para y se le avisa al usuario. Un fallo del servicio (no de contenido) no se
  arregla con el texto: se espera y se vuelve a enviar.
- **Los ganchos alternativos** son opcionales: un clip más cada uno, del largo
  del Bloque 1, y solo con el sí del usuario. Con el anuncio ya ensamblado, cada
  gancho es otra versión:

  ```
  npm run ugc:gancho -- temp/[slug] 1b          crea temp/[slug]-gancho-1b/ con el gancho como Bloque 1
  npm run ugc:cola   -- temp/[slug]-gancho-1b --tomas 1
  npm run plan       -- temp/[slug]-gancho-1b
  node produccion/subtitulos-dialogo.js temp/[slug]-gancho-1b
  npm run plan       -- temp/[slug]-gancho-1b
  npm run ensamblar  -- temp/[slug]-gancho-1b
  ```

  Para rehacer un gancho: `npm run rehacer -- temp/[slug] --gancho 1b`,
  `npm run videos -- temp/[slug] --ganchos` y el ciclo de Flow, y
  `npm run ugc:gancho -- temp/[slug] 1b --reemplazar`.

---

## 12. Podcast y entrevista — el flujo propio

Los dos son `dialogo_nativo` con **tomas habladas** (tipo H): la voz la genera
Omni dentro de cada clip, sin voz en off. **Sin música y sin transiciones**, y
salen **dos** versiones (con y sin subtítulos). Los videos no tienen modelo de
respaldo: si Omni no lo saca, se sigue lo de "Si Omni falla", abajo.

### Las imágenes

- **Podcast**: las hojas de los dos hosts (A, y B generada con A adjunta: B
  espera a A en el ciclo), y las imágenes de B-roll. El primer cuadro de cada
  generación es una copia de la hoja de su host: `npm run imagenes` la hace
  solo, sin Flow.
- **Entrevista**: las hojas (la persona, la calle vacía, la mano con el
  micrófono), la imagen de cada clip, los iconos y las imágenes de B-roll. Los
  iconos se piden en Flow cuadrados y sobre verde, y `flow:recibir` les deja el
  fondo transparente.
- **Se miran antes de pagar los clips.** Las hojas, apenas llegan: todo lo que
  esté en ellas se repite en cada clip. Si una salió mal se rehace en Flow (0
  créditos) antes de seguir; si ya estaba recibida, sale a mano a `historial/`
  con las imágenes que se hicieron con ella, y la cola de `npm run imagenes` la
  vuelve a pedir. Su descarga vieja quedó en `flow/descargas/recibidos/` y no
  vuelve a su lugar (sección 1.1): no hace falta tocarla.

### El orden

Hasta `lineas` es igual en los dos (`imagenes` y `videos` son el ciclo de Flow):

```
npm run preparar  -- "<ruta de la foto>" [slug]   si hay foto y no se hizo
npm run validar   -- temp/[slug]/manifiesto.json  (su costo de kie.ai no aplica: no se muestra)
npm run imagenes  -- temp/[slug]                  en vueltas; mirar las hojas
npm run videos    -- temp/[slug]                  créditos -> PARADA 1: esperar el sí
npm run frames    -- temp/[slug]
npm run lineas    -- temp/[slug]                  transcribe: ¿dijo todo?, ¿está limpio?
   ... revisión de cada clip -> PARADA 2 ...
```

Después, según el estilo:

```
Podcast, pantalla dividida   plan -> subtitulos-dialogo -> plan -> ensamblar --concurrencia 1
Podcast, esquina             plan -> subtitulos-dialogo -> plan -> recortar -> plan -> ensamblar --concurrencia 1
Entrevista A (gancho)        voz -> lineas --tomas <las que imprime voz> -> plan -> subtitulos-dialogo -> plan -> ensamblar
Entrevista B (completa)      plan -> subtitulos-dialogo -> plan -> ensamblar
Montaje a mano (opción B)    lo mismo hasta el último plan, y después  npm run plan:humano
```

(`plan` = `npm run plan -- temp/[slug]`; `subtitulos-dialogo` =
`node produccion/subtitulos-dialogo.js temp/[slug]`; `voz` y `recortar` =
`npm run voz -- temp/[slug]` y `npm run recortar -- temp/[slug]`.)

- **`--concurrencia 1` va siempre en el podcast**, y en la entrevista si hay
  poca memoria libre. Cada versión tarda unos 10 minutos así.
- **El recorte del host (podcast en esquina) va entre plan y plan**: recorta
  solo los tramos en que el host va en su esquina. Tarda unos 7 minutos por
  cada segundo de host recortado (con tres B-roll, alrededor de una hora), sin
  créditos; la primera vez baja el modelo de recorte (unos 220 MB). Corre solo,
  nada pesado en paralelo.
- **El paso `voz` (entrevista A)** corta cada clip de la historia en sus
  palabras, le quita los silencios de adentro y lo acelera a 1,2x. Es la única
  voz que se acelera, y la acelera el motor. El original queda en
  `video/originales/`; se puede correr otra vez sin daño (`--forzar` rehace lo
  ya hecho). Al terminar imprime el `lineas --tomas …` exacto: ese se corre.
- **Python 3** hace falta solo aquí: para tapar los huecos de los iconos de la
  entrevista (Pillow y numpy) y para el host en la esquina del podcast (rembg y
  onnxruntime). `npm run verificar` dice qué falta y el comando exacto para el
  Python que encontró, del tipo
  `python -m pip install --user rembg onnxruntime pillow numpy`. Si
  `flow:recibir` avisa iconos sin revisar los huecos, se resuelve Python y se
  corre `npm run imagenes -- temp/[slug] --tapar-huecos` (no genera nada).

### La revisión del habla — `npm run lineas`

Transcribe cada clip hablado, lo compara con su `linea` del manifiesto y dice si
dijo todo y si está **limpio**. **Cualquier palabra repetida, trabada, cambiada
o agregada es un defecto, y el clip se regenera**, aunque "suene natural": nunca
se ofrece dejarlo pasar. El costo de rehacerlo se dice siempre: en la entrevista
se rehace sin preguntar (hasta 3 veces; a la tercera se para y se le muestran al
usuario las tres transcripciones), y en el podcast con el sí a los créditos,
como dice su skill.

**La única excepción la decide el motor, no tú**: una palabra de una sola letra
("a", "y", "e", "o", "u") dicha dos veces seguidas, con las dos juntas en menos
de 0,2 s y menos de 0,15 s de pausa entre ellas. `lineas` la deja en
`toleradas` y la toma sale "LIMPIO (con 1 repeticion tolerada)". No se regenera,
pero **siempre se le informa al usuario, con su clip y su segundo**, para que la
escuche. Tú no toleras nada por tu cuenta.

Las diferencias que son solo de escritura no cuentan (el motor ya las iguala):
cifras o letras, símbolos de precio, tildes, mayúsculas, la marca mal escrita
por el transcriptor. Pero un "%" escrito se tiene que oír. En el podcast, los
clips de reacciones se transcriben también: **una palabra en una reacción es
falla**, sin excepción.

Al regenerar un clip, el motor le quita su medida vieja: se vuelve a medir con
`npm run lineas -- temp/[slug] --tomas N` antes de planear. Si es un clip de la
historia de la entrevista A, después pasa otra vez por `voz -- … --tomas N` y
por `lineas -- … --tomas N` (abajo). Si se regenera después de haber planeado,
sigue plan → subtítulos → plan (y, en esquina, recortar → plan).

### Rehacer un clip

```
node produccion/rehacer-toma.js temp/[slug] --toma N --contexto        el diálogo y el prompt de ese clip
node produccion/rehacer-toma.js temp/[slug] --toma N --aplicar nuevos.json   saca el clip (y su imagen en la entrevista) a historial/
npm run imagenes -- temp/[slug] --tomas N                          SOLO entrevista: la imagen del clip (0 créditos), ciclo de Flow
npm run videos   -- temp/[slug] --tomas N --sin-broll              créditos -> sí -> ciclo de Flow; flow:recibir sin --rehacer
npm run frames   -- temp/[slug]
npm run lineas   -- temp/[slug] --tomas N
   ... se revisa como cualquier clip; cuando está bien: ...
npm run voz      -- temp/[slug] --tomas N                          SOLO entrevista A, clip de la historia: el clip nuevo, sin silencios y a 1,2x
npm run lineas   -- temp/[slug] --tomas N                          SOLO entrevista A, clip de la historia: OTRA VEZ, la voz cambió sus tiempos
```

Sigue los pasos que imprime `--aplicar`, en ese orden: son estos, y siguen con
plan → subtítulos → plan (con recortar → plan si el host va en la esquina) →
ensamblar.

**El diálogo no se toca**: si un clip salió con otra cara, mirando a cámara o con
palabras de más, falló la tirada, no el guion. Se cambia algo pequeño del prompt
que ayude (una nota de entrega más concreta, una línea de lo que no debe pasar),
nunca las líneas. En la entrevista, si la imagen del clip estaba bien, se copia
de vuelta desde `historial/` antes de correr `imagenes` y no se genera otra vez.
En estos estilos **no se usa `--rehacer` en `imagenes`**: arrastra las hojas.

### Si Omni falla

- **Fallo del servicio** (error genérico, se queda cargando, servidor ocupado):
  no es un rechazo de contenido y **no se toca nada**. Se espera y se vuelve a
  enviar; si sigue igual, se le avisa al usuario que es una caída del servicio y
  no un problema de su anuncio, y se reintenta cada 15 minutos.
- **Rechazo de contenido** (el aviso habla de políticas; casi siempre en salud y
  suplementos), después de los cuatro reintentos de `flow-generacion`: se
  reescribe **solo la frase que lo dispara**, con su misma función y largo,
  **primero en el manifiesto** (la línea en el guion, la `linea` de la toma, su
  prompt, y la frase ancla que colgara de ella), se valida y se vuelve a armar la
  cola. Antes, se recibe lo que sí salió de la tanda: lo ya generado en Flow se
  pagaría dos veces. Se anota en `flow/cambios-de-prompt.md`. Hasta 3
  reescrituras; a la tercera, se para y se le muestran al usuario las frases
  probadas y los avisos de Flow. Es la única excepción a no tocar un guion
  ganador.

Las skills de los dos estilos tienen el detalle: qué mirar en cada fotograma,
las líneas de "lo que no debe pasar" para cada fallo, y lo que el usuario
necesita para montar a mano.

---

## 13. Continuidad — el flujo propio

Es un efecto que va **encima** de un anuncio animado con narrador en voz en off
(estilo pixar, claymation, zack-d-films, crochet, estilo lego o esqueleto): cada
video va de la imagen de una toma a la imagen de la siguiente, y la IA hace el
paso entre las dos escenas, sin cortes, de principio a fin. **El estilo hace
primero su trabajo completo** (guion, prompts, manifiesto y la pregunta A/B/C).
Si elige C, el paquete es el del estilo (un video por toma, con B-roll y
cortes): los prompts de video de cada paso se escriben recién mirando las
imágenes generadas y no vienen ahí; al entregarlo, avísale en una línea que,
producido a mano, sale con cortes, y que el anuncio sin cortes es con A o B.
Cuando el usuario elige A o B, la skill `anuncios-continuidad` toma la
producción desde el manifiesto, con este orden, que **reemplaza** el proceso de
producción del estilo:

```
npm run continuidad  -- temp/[slug] --preparar     B-roll a un lado, agrega el bloque "continuidad"
npm run validar      -- temp/[slug]/manifiesto.json
npm run imagenes     -- temp/[slug]                 ciclo de Flow, en vueltas; revisar las imágenes
npm run voces                                       que el usuario elija la voz (va al .env)
npm run audio        -- temp/[slug]
npm run continuidad  -- temp/[slug] --duraciones    la duración de cada paso, de los tiempos reales de la voz
npm run continuidad  -- temp/[slug] --pares         mirar las dos imágenes de cada par y escribir su prompt
npm run plan         -- temp/[slug] --prediccion    velocidades previstas, no escribe nada
npm run validar      -- temp/[slug]/manifiesto.json
npm run videos       -- temp/[slug]                 créditos -> sí -> ciclo de Flow, en vueltas
npm run voces:revisar -- temp/[slug]
npm run frames       -- temp/[slug]
npm run frames       -- temp/[slug] --uniones       cada unión: dónde termina, a dónde tenía que llegar, dónde arranca el siguiente
   ... música, según el estilo base (sección 3) ...
npm run plan         -- temp/[slug]
npm run subtitulos   -- temp/[slug]
npm run plan         -- temp/[slug]
npm run ensamblar    -- temp/[slug]
```

- **Si no aplica, el motor lo dice**: `--preparar` responde "No se puede" en los
  estilos y modos que no lo admiten (donde alguien habla a cámara, se canta o el
  producto habla) o con menos de 2 tomas. Se le dice al usuario en una frase y
  se sigue con el anuncio normal.
- **Sin B-roll, sin transiciones de editor**: no se escribe `transiciones.json`
  ni se produce el B-roll, aunque el estilo los marque como obligatorios. La voz,
  la música, los subtítulos y los niveles siguen las reglas del estilo.
- **La música es la del estilo base**: Suno en estilo pixar, claymation y
  crochet (`npm run musica -- temp/[slug] --solo-plan`, que dice el costo y si
  kie.ai está conectado, como dice la sección 3; el sí, y `--si`); la
  copia el motor en estilo lego; **en zack-d-films y esqueleto se copia a mano
  la pista fija antes**, y no se corre `npm run musica` sin ella en su lugar (con
  kie.ai conectado iría a Suno y cobraría).
- **Los prompts de los pasos se escriben mirando las dos imágenes** de cada par;
  `--pares` tiene que terminar diciendo "Prompts escritos: X de X". Si una imagen
  se rehace después (`npm run rehacer`), sus dos pasos quedan marcados para
  revisar y sus videos van a `historial/`; mientras esa marca esté, los videos no
  arrancan.
- **El montaje nunca corta un video**: solo cambia su velocidad para que empiece
  con su frase y llegue a la imagen siguiente cuando empieza la frase siguiente.
  Las velocidades altas y las llegadas movidas (hasta 0,3 s antes o 0,4 s
  después) son decisiones del montaje, no defectos.
- **Rehacer un paso** que salió mal (no arranca en su imagen, no llega, se
  desliza, hace un fundido, aparecen líneas de luz o texto): se reescribe su
  prompt y `npm run videos -- temp/[slug] --pasos K --rehacer`, **una sola vez**;
  con el ok de los créditos, el ciclo de Flow con `flow:recibir` sin
  `--rehacer`, y `npm run videos -- temp/[slug] --pasos K` para comprobar que no
  queda nada. El clip propio de una toma o el de cierre: se corrige su
  `prompt_video`, el archivo va a `historial/` a mano y
  `npm run videos -- temp/[slug] --tomas K` lo pone solo a él en la cola. Nunca
  `--tomas K --rehacer`: rehace también los dos pasos vecinos.
- **Solo imágenes y videos (opción B)**: todo igual hasta revisar la cadena (la
  voz hace falta para las duraciones); después, solo la música y
  `npm run plan:humano -- temp/[slug]`, que dice en qué segundo entra cada video
  y a qué velocidad. No se corren plan, subtítulos ni ensamblar.
