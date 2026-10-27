---
name: flow-generacion
description: Genera en Google Flow (flow.google.com), manejando el Chrome del usuario con la extension Claude in Chrome, las imagenes y los videos de la cola que arma el motor (flow/cola-imagenes.json o flow/cola-videos.json), y los descarga con el nombre exacto que el motor espera. Usar SIEMPRE que una skill de anuncios de esta version diga "generar la cola en Google Flow", despues de "npm run imagenes" o "npm run videos", o cuando el usuario pida generar, reintentar o rehacer imagenes o videos de un anuncio en Flow.
---

# Generar la cola del anuncio en Google Flow

En esta version del sistema las imagenes y los videos no se piden por API: los
genera Claude en Google Flow, en el navegador del usuario. El motor arma la
lista de trabajo (la cola) y despues recibe los archivos. Esta skill es el
puente: toma la cola, la genera en Flow, y deja cada archivo en Descargas con el
nombre que el motor reconoce.

El ciclo completo, que la skill del estilo ya indica:

1. `npm run imagenes -- temp/<anuncio>` (o `videos`) arma la cola y la imprime.
2. **Esta skill**: generar la cola en Flow y descargar.
3. `npm run flow:recibir -- temp/<anuncio>` coloca, convierte y verifica.
4. Volver a 1 hasta que el comando diga que no queda nada. Algunos trabajos
   dependen de otros (frame heredado, frame anterior, el frame inicial de la
   misma toma, los lugares de UGC) y salen en la vuelta siguiente.

## 0. Lo que no se negocia

- **El usuario sigue trabajando en su propia ventana.** Claude trabaja solo en
  su grupo de pestanas "Claude", en una ventana aparte.
- **Descargas: un permiso por tanda.** Antes de la primera descarga de cada
  tanda se pide permiso en el chat, diciendo cuantos archivos, de que proyecto
  de Flow y a que carpeta (Descargas). Sin un si claro, no se descarga.
- **Videos: el usuario aprueba los creditos.** Antes de mandar los videos, se le
  dice cuantos clips son y la estimacion de creditos que imprimio
  `npm run videos`, y se espera su ok. Las imagenes cuestan 0 creditos y no
  necesitan ok.
- **Contrasenas, captchas y verificaciones las hace el usuario.** Si Flow o
  Google piden iniciar sesion, verificar o resolver un captcha, se le pide al
  usuario y se espera.
- **El prompt de la cola se pega tal cual.** Solo se cambia cuando Flow lo
  rechaza 4 veces seguidas (seccion 6), y ese cambio se anota.

## 1. Preparar el navegador (una vez por sesion)

1. Cargar las herramientas de Chrome en una sola llamada:
   `ToolSearch` con `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__tabs_close_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__find,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__file_upload,mcp__claude-in-chrome__browser_batch,mcp__claude-in-chrome__list_connected_browsers,mcp__claude-in-chrome__select_browser`.
   Si no aparecen, la extension Claude in Chrome no esta conectada: es el paso
   de Chrome de INSTALAR.md (en la terminal de Claude Code, `/chrome` muestra el
   estado y reconecta). Si hay mas de un Chrome conectado,
   `list_connected_browsers` y `select_browser` con el que tiene la cuenta de
   Google con Flow.
2. `tabs_context_mcp` con `createIfEmpty: true` y `navigate` a
   `https://labs.google/fx/tools/flow` (redirige a flow.google.com). Tomar una
   captura: tiene que verse la cuenta del usuario (y su plan, por ejemplo PRO).
3. **Ventana aparte.** La extension abre el grupo de pestanas "Claude" en la
   ventana que el usuario tenga activa. Pedirle UNA vez:

   > Para que puedas seguir trabajando, haz clic derecho en la etiqueta
   > **"Claude"** de tus pestanas y elige **"Mover grupo a una ventana nueva"**.
   > Despues no cierres ni minimices esa ventana hasta que te avise.

   Despues de que diga que ya lo hizo, confirmar con `tabs_context_mcp` que la
   pestana sigue (mismo tabId). Si el grupo ya no existe, se cerro: crear otro
   y repetir el pedido.
4. **Un proyecto de Flow por anuncio.** Si `temp/<anuncio>/flow/proyecto.txt`
   existe, abrir esa URL (ahi estan las referencias ya subidas y lo generado
   antes). Si no, clic en "Proyecto nuevo" y guardar la URL del proyecto en
   `flow/proyecto.txt`.
5. **Inyectar los ayudantes.** Correr `npm run -s flow:js -- temp/<anuncio>`
   (con `-s`: sin eso npm agrega dos lineas que no son JavaScript) y pegar su
   salida completa en `javascript_tool`. Debe responder
   "N trabajos cargados". De cada prompt viaja solo un tramo unico, asi que el
   pegado es chico aunque la cola sea larga. Hay que repetirlo cada vez que la pagina se
   **recarga** (navigate, F5) y cada vez que la cola cambia (vuelta nueva).
   Abrir recursos con clic NO recarga: los ayudantes siguen vivos. Para
   comprobarlo: `javascript_tool` con `!!window.__claudeFlow`.

   Los ayudantes hacen tres cosas que Flow no deja hacer de otra forma:
   - el boton de cargar archivos no abre la ventana de Windows (que Claude no
     puede manejar) sino que deja un campo "claude file input" para
     `file_upload`;
   - la descarga sale con el nombre de la cola en vez del de Flow;
   - `window.__claudeFlow.identificarPagina()` dice que trabajo de la cola es
     el recurso abierto y deja listo su nombre de descarga.

## 2. Leer la cola

Leer `temp/<anuncio>/flow/cola-imagenes.json` o `cola-videos.json`. Cada
trabajo trae (formato completo en `produccion/flow/flow.js`, TrabajoFlow):

| Campo | Para que |
|---|---|
| `archivo` | destino final (lo coloca flow:recibir, no Claude) |
| `descarga` | nombre con el que se descarga, sin extension |
| `modo` | `imagen`, `fotogramas` (frame inicial y final), `ingredientes` (referencias) o `texto` |
| `modelo` / `respaldo` | modelo de Flow a elegir, y el de respaldo |
| `prompt` | se pega tal cual |
| `referencias` | imagenes a adjuntar, **en este orden** |
| `frame_inicial` / `frame_final` | modo fotogramas: "Iniciar" y "Finalizar" |
| `duracion` | segundos a elegir en Flow (4, 6, 8 o 10) |
| `proporcion` | 9:16, 1:1... |
| `calidad_descarga` | opcion del menu de descarga: 1K, 2K o 720p |
| `habla` | el clip tiene dialogo: revisar que se escuche |
| `fondo` | `verde`: icono sobre verde croma (flow:recibir lo vuelve transparente) |

`bloqueados` son trabajos que todavia no se pueden pedir: no tocarlos.

## 3. Subir las referencias

Primero se suben juntas todas las imagenes distintas que usa la cola
(`referencias`, `frame_inicial`, `frame_final`) y que todavia no esten en el
proyecto. Asi despues solo se eligen de la biblioteca.

1. Clic en el boton "+" de la caja del prompt (`find`: "Agregar menu de
   contenido multimedia"). Se abre la biblioteca del proyecto.
2. Clic en "Cargar contenido multimedia" (abajo a la izquierda). Con los
   ayudantes inyectados NO se abre ninguna ventana.
3. `find` "claude file input" y `file_upload` con las rutas absolutas (hasta
   10 MB por llamada; de a una o varias). Esperar a que cada una aparezca en la
   biblioteca con su nombre (por ejemplo `marisol.png`).
4. Para subir mas, repetir 2-3. Cerrar con Escape.

Los frames que se generan en la misma vuelta (por ejemplo la imagen de una toma
que despues es el frame de su video) ya estan en el proyecto: no hace falta
subirlos, se eligen de la biblioteca. Pero ojo: la biblioteca muestra la
version de Flow, y el motor puede haberla cambiado (por ejemplo una copia de
frame heredado). Ante la duda, subir el archivo del disco.

## 4. Mandar los trabajos

**Se mandan todos seguidos, sin esperar a que termine cada uno.** Flow genera
muchos a la vez. Despues se revisan juntos.

### Ajustes (boton de ajustes de la caja del prompt, el que muestra el modelo)

- Imagen: pestana **Imagen**, la proporcion, el modelo (lista "Seleccionar
  familia de modelos": Nano Banana 2.1, Nano Banana Pro...), **x1**.
- Video: pestana **Video**, **Fotogramas** o **Ingredientes** segun `modo`,
  9:16, modelo (Omni 1.1 Flash por defecto), **720p**, la `duracion`, **x1**.
  El menu muestra cuantos creditos usa.
- Los ajustes se mantienen entre envios. Mirar el texto del boton antes de
  cada envio (por ejemplo "Video · 720p · 8 s · x1") y corregir si cambio.
- Para cerrar el menu de ajustes, clic en una zona vacia de la pagina.

### Por cada trabajo

- **Imagen con referencias**: "+" > elegir cada referencia en la biblioteca >
  "Agregar a la instruccion", **en el orden de la cola**. Las miniaturas quedan
  arriba del prompt.
- **Video fotogramas**: clic en "Iniciar" > elegir `frame_inicial` > "Agregar a
  la instruccion". Si hay `frame_final`: "Finalizar" > elegirlo.
- **Video ingredientes**: "+" > cada referencia en orden.
- Clic en la caja del prompt, escribir el `prompt` (accion `type`) y enviar
  con la flecha. Aparece una tarjeta con el porcentaje.
- **Nunca escribir saltos de linea**: en la caja de Flow, Enter ENVIA. Si el
  prompt trae lineas (por ejemplo el bloque "Negative prompt:" o las lineas
  "Camera:/Motion:" de un video), escribirlo en una sola linea cambiando cada
  salto por un espacio. El contenido es el mismo y `identificarPagina()` lo
  reconoce igual (compara sin importar los espacios).
- Si la caja quedo con referencias del trabajo anterior, quitarlas (la X de la
  caja) antes de armar el siguiente.

Conviene ir anotando en `temp/<anuncio>/flow/envios.md` que se mando (archivo,
modelo, hora) para no mandar dos veces lo mismo si la sesion se corta.

## 5. Revisar lo generado

Cuando las tarjetas terminan (desaparece el porcentaje):

- Abrir cada resultado (clic) o hacer `zoom` sobre la grilla y mirarlo de
  verdad: personaje correcto y consistente, producto real (forma, etiqueta),
  sin texto inventado, sin manos o caras deformes, encuadre y accion que pide
  el prompt. En video: que haya movimiento y, si `habla`, que la boca se mueva.
- Si una **imagen** sale mal: se regenera (0 creditos). Flow guarda las
  versiones; descargar la buena.
- Si un **video** sale mal: **no se regenera sin el ok del usuario**. Regenerar
  un video se cobra otra vez: decirle que clip salio mal, por que, y cuantos
  creditos cuesta repetirlo (los de su duracion), y esperar el si. Los
  reintentos por rechazo de politicas (seccion 6) no cobran y no necesitan ok.
  En los estilos con dialogo, si para arreglarlo hay que cambiar lo que se
  dice, el cambio va primero al manifiesto (COMO-PRODUCIR.md lo explica): un
  clip que dice otra cosa que el manifiesto sale con subtitulos equivocados.

## 6. Fallos y reintentos

Flow a veces rechaza con "No se pudo completar la accion. Es posible que esta
generacion incumpla nuestras politicas". Muchas veces es un falso positivo y
no cobra.

1. **Reintentar hasta 4 veces** con el boton de reintentar de la tarjeta
   (flecha circular). Se pueden reintentar varias tarjetas a la vez.
2. Si a la cuarta sigue fallando, algo del prompt activa el filtro. En la
   tarjeta, "reutilizar instruccion" (flecha de volver) pone el prompt en la
   caja con sus referencias. Cambiar SOLO lo que puede activar el filtro y
   conservar la escena: en anuncios de salud suelen ser partes del cuerpo
   descritas con detalle, agujas, sangre, piel lastimada, ninos, desnudez,
   palabras medicas fuertes, marcas o personas reales. Reenviar.
3. Anotar cada cambio en `temp/<anuncio>/flow/cambios-de-prompt.md` (archivo,
   que se cambio y por que) y contarselo al usuario al final. **Al descargar
   ese recurso, `identificarPagina()` no lo va a reconocer** (su prompt ya no es
   el de la cola). Como sabes cual es, nombralo a mano justo antes de
   descargarlo: `window.__claudeFlow.nombrar('<descarga>')`, con el `descarga`
   de ese trabajo en la cola.
4. Si un video falla todos los intentos con `modelo` y tiene `respaldo`, el
   respaldo (Veo 3.1 Fast) cuesta mas creditos: **preguntarle al usuario y
   esperar el si** (el menu de ajustes de Flow muestra cuanto cuesta) antes de
   mandarlo. Recordar el id para `--respaldo` en flow:recibir.
5. Si Flow dice que no hay creditos, o muestra un limite de generaciones a la
   vez, parar y avisar al usuario.

## 7. Descargar con nombre

Pedir permiso para la tanda (seccion 0). Despues, por cada resultado bueno:

1. Abrir el recurso (clic en su tarjeta). Ojo: Flow titula solo cada recurso
   y una imagen y el video que sale de ella pueden tener el MISMO titulo (o dos
   imagenes, como el START y el END de una toma B). En la grilla, los videos
   tienen el icono de reproducir.
2. Hacer visible su prompt: en imagenes, el boton "Mostrar informacion del
   recurso" (i); en videos, "Mostrar historial".
3. `javascript_tool`: `JSON.stringify(window.__claudeFlow.identificarPagina())`.
   Devuelve `{descarga, archivo}` y deja ese nombre listo. Si devuelve error:
   abrir el panel que falta, verificar que los ayudantes esten inyectados con
   la cola actual, o es un recurso que no es de esta cola (por ejemplo abriste
   la imagen en vez del video): volver y abrir el otro. Con error no se nombra
   nada, asi que nunca baja un archivo con un nombre ajeno.
4. Boton "Descargar contenido multimedia" > la opcion de `calidad_descarga`:
   imagen **1K (Tamano original)** o **2K**; video **720p (Tamano original)**.
5. Confirmar: `JSON.stringify(window.__claudeFlow.descargas())` muestra el
   nombre nuevo en `despues`. Flow muestra "Se descargo tu imagen".
6. Volver a la grilla (flecha de atras) y seguir con el siguiente.

La primera vez Chrome puede preguntar si el sitio puede descargar varios
archivos: pedirle al usuario que haga clic en "Permitir".

## 8. Recibir y seguir

1. `npm run flow:recibir -- temp/<anuncio>` (con `--respaldo id1,id2` si
   alguno salio del modelo de respaldo). `--rehacer` SOLO si el archivo viejo
   sigue en `img/` o `video/` y se quiere reemplazar (lo manda a `historial/`).
   Al rehacer una toma con `npm run rehacer`, el viejo ya salio de la carpeta:
   ahi va sin `--rehacer` (asi lo piden COMO-PRODUCIR.md y las skills).
   Imagenes: si una no sale bien con su `modelo` tras los reintentos, se puede
   probar el `respaldo` (tambien 0 creditos) y se anota igual con `--respaldo`.
2. Leer el resumen: si hay **faltan**, descargar esos; si hay **rechazados**
   (por ejemplo un clip mas corto de lo pedido o un clip hablado sin audio),
   regenerar ese trabajo en Flow y volver a recibir.
3. Volver a correr `npm run imagenes` (o `videos`): si arma una cola nueva,
   reinyectar los ayudantes (`npm run -s flow:js`) y repetir desde la seccion 3.
   Cuando diga que no queda nada, volver a la skill del estilo.

## 9. Al terminar

- Contarle al usuario: cuantas imagenes y videos se generaron, cuantos
  reintentos, que prompts se cambiaron y por que, y los creditos de video
  usados.
- Cerrar la pestana de Claude (`tabs_close_mcp`) solo cuando ya no queden
  trabajos de Flow en el anuncio. Avisarle que ya puede cerrar esa ventana.

## Lo que ensena el uso real (prueba completa del 2026-10-16)

- **Hay dos "+".** El de arriba a la derecha de la pagina abre otro menu
  ("Subir", "Nueva coleccion"...): su "Subir" NO deja el campo "claude file
  input". Usar siempre el "+" de la caja del prompt > "Cargar contenido
  multimedia".
- **Se pueden subir varias referencias en una sola llamada** a `file_upload`
  (todas las rutas juntas, hasta 10 MB en total). Las rutas tienen que estar
  dentro de la carpeta del proyecto: Claude Code solo sube archivos de las
  carpetas que tiene permitidas.
- **La biblioteca esconde lo que ya esta adjunto** en la caja: al agregar la
  segunda referencia, la lista cambia de orden. Mirar antes de cada clic.
- **START y END con el mismo titulo**: en el selector de "Iniciar"/"Finalizar"
  aparecen dos opciones iguales. Hacer clic en una muestra su vista previa a la
  derecha: mirarla (zoom) y recien despues "Agregar a la instruccion".
- **Si las capturas de pantalla fallan** ("timed out"), la ventana de Claude
  quedo tapada o minimizada. No hace falta parar: `find` y `read_page` siguen
  funcionando y los clics por `ref` tambien (botones por su nombre: "Iniciar
  generacion", "Descargar contenido multimedia", "720p Tamano original",
  "Boton Atras..."). Para mirar un resultado, pedirle al usuario que deje la
  ventana de Claude a la vista un momento.
- **Ajustes por nombre**: con el menu de ajustes abierto, `find` encuentra los
  radios "Video", "Fotogramas", "Ingredientes", "720p", "4 s"/"6 s"/"8 s" y el
  texto "N creditos" del costo. Escape cierra el menu.
- **Tiempos medidos**: una imagen tarda unos 30 s; un video de 4 a 6 s, menos
  de un minuto. Mandar todo seguido y revisar despues ahorra mucho.

## Referencia rapida de la interfaz de Flow (2026-10-16)

| Que | Como encontrarlo (`find`) |
|---|---|
| Proyecto nuevo | boton "Proyecto nuevo" en la pagina de inicio de Flow |
| Biblioteca / adjuntar | "Agregar menu de contenido multimedia" (+ de la caja del prompt) |
| Subir archivo | "Cargar contenido multimedia" (dentro de la biblioteca) |
| Adjuntar lo elegido | "Agregar a la instruccion" |
| Ajustes | el boton de la caja del prompt que muestra el modelo |
| Modelo | "Seleccionar familia de modelos" |
| Frames de video | "Iniciar" y "Finalizar" (modo Fotogramas) |
| Informacion de una imagen | "Mostrar informacion del recurso" |
| Prompt de un video | "Mostrar historial" |
| Descargar | "Descargar contenido multimedia" |
| Volver a la grilla | "Boton Atras para volver a la pagina anterior" |

Si Flow cambio la interfaz y algo no aparece con ese nombre, tomar una captura y
buscarlo por lo que hace: el procedimiento es el mismo.
