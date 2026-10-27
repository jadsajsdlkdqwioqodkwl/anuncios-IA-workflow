# Cambios de cada versión

La versión instalada está en el archivo `VERSION`. Para actualizar, sigue el `ACTUALIZAR.md` del zip nuevo. La más
nueva va arriba.

## 2026-10-18b
**Lo principal:**
- **`npm run verificar` prueba la clave de ElevenLabs.** Antes solo revisaba que no estuviera vacía y daba por buena
  una clave equivocada: el error aparecía recién al generar la voz o la transcripción. Ahora la prueba contra
  ElevenLabs con una consulta gratis (la primera voz de la cuenta) y una clave rechazada sale como `FALTA`. Una clave
  válida pero con permisos limitados, sin permiso para leer las voces, sale como `AVISO` y dice qué activarle: el
  sistema usa Voices (lectura), Text to Speech y Speech to Text.

**Para instalar:** nada nuevo.

**Trabajos a medias:** nada cambia.

## 2026-10-18
**Lo principal:**
- **Actualizar sin perder nada.** Desde esta versión el sistema trae `VERSION`, este `CAMBIOS.md`, `ACTUALIZAR.md` y
  el actualizador (`produccion/actualizar.js`). Con el zip de una versión nueva, Claude respalda, copia, comprueba
  y, si algo falla o se corta, deja todo como estaba. Nunca toca tus anuncios (`temp/`), tus videos (`output/`) ni
  tus claves (`.env`). Lo que se reemplaza queda en `respaldos/`, y tus scripts o notas que estaban en carpetas del
  sistema (`produccion/`, `remotion/src/`, `recursos/`, `ejemplo-anuncio/`, `skills/` o dentro de las skills del
  sistema) pasan a `mis_archivos/`.
- **`npm run verificar` reconoce una clave de kie.ai equivocada.** kie.ai responde "bien" también a una clave mala
  y pone el rechazo dentro de la respuesta: antes `verificar` la daba por buena y el error aparecía recién al
  generar la música. Ahora lo dice al verificar.

**Para instalar:** nada nuevo: las librerías de Remotion son las mismas. Si el informe del actualizador trae una
línea `INSTALAR`, se corre tal cual.

**Trabajos a medias:** nada cambia.

## 2026-10-17
**Lo principal:**
- **El anuncio se arma por dentro y el chat muestra un resumen corto.** Al terminar, la skill del estilo deja el
  guion, los prompts de imagen y video, el B-roll, los textos en pantalla y el guion de voz guardados y validados en
  el manifiesto (`temp/<anuncio>/manifiesto.json`). En el chat va solo un resumen (estilo, producto, mercado e
  idioma, tomas y B-roll, duración aproximada y, si la hay, una decisión que conviene saber) con tres opciones:
  - **A)** producirlo todo: Google Flow, voz, música, montaje y el MP4 terminado;
  - **B)** solo las imágenes y los videos, para montarlos en CapCut;
  - **C)** el paquete de prompts completo en el chat, para revisarlo o producirlo a mano. Después se puede seguir
    con A o B.

  El manifiesto es interno del sistema y no se entrega nunca, tampoco en la opción C. Si se pide ver el guion o los
  prompts de una toma, se muestra esa parte, copiada del manifiesto. En historias musicales, los textos en pantalla
  para el editor quedan en `temp/<anuncio>/datos-editor.md`.
- **La foto del producto la deja lista Claude.** Ya no se le pasa al usuario un comando para copiarla: si Claude sabe
  dónde está (la ruta, o la imagen pegada en el chat), corre él `preparar-producto` antes de validar el manifiesto;
  si no, la pide en una línea del resumen.
- **Ya no se abre Remotion Studio al final.** El anuncio termina con los MP4 de `output/` y el informe de entrega.
  Sale `npm run estudio` (`produccion/estudio.js`): al actualizar se quita si está como vino, junto con el estado que
  dejaba el estudio (`remotion/.estudio-*.json`). `.claude/launch.json`, que lo abría, se queda donde está: lo de
  `.claude/` que no son las skills es del usuario y el actualizador no lo toca. Ya no sirve para nada; si el usuario
  quiere, lo borra él.
- **Continuidad y la música:** la música es la del estilo base. En Lego el motor copia su pista fija solo; en Zack D
  Films y skeleton la pista fija se copia antes de `npm run musica`, como dice la skill.

**Para instalar:** nada nuevo: las librerías de Remotion son las mismas.

**Trabajos a medias:** siguen igual con la versión nueva: el manifiesto, las colas de Flow y lo ya generado no
cambian, y el motor que produce es el mismo.
- Si quedó una tanda de Flow a medias: si hay archivos ya descargados sin recibir, primero
  `npm run flow:recibir -- temp/<anuncio>`. Después `npm run imagenes -- temp/<anuncio>` (o `videos`) vuelve a armar
  la cola con lo que falta, y en la página de Flow se vuelven a inyectar los ayudantes
  (`npm run -s flow:js -- temp/<anuncio>`) antes de seguir, como dice la skill `flow-generacion`.
- Al terminarlo, se entregan los MP4 de `output/` y el informe, sin Remotion Studio.

## 2026-10-16
Primera versión del sistema en Google Flow.

**Lo principal:**
- Los doce estilos y el efecto continuidad, con las imágenes y los videos generados por Claude en Google Flow, en el
  Chrome del usuario (skill `flow-generacion`). La voz y la transcripción salen de ElevenLabs, y la música y las
  canciones de Suno, por kie.ai.
- **Flow:** el código que se inyecta en la página de Flow es liviano (`npm run -s flow:js`); un recurso cuyo prompt
  se cambió por un rechazo de Flow se nombra a mano antes de descargarlo; regenerar un video o pasar al modelo de
  respaldo (Veo) se pregunta antes, con sus créditos.
- **kie.ai es recomendado, no obligatorio** (sí en musical e historias musicales): si no está conectado,
  `npm run musica` lo explica y se le pregunta al usuario si lo conecta o si el anuncio sale sin música de fondo.
- **La instalación** confirma Chrome, la extensión Claude in Chrome y Google Flow, y lo anota en `.flow-listo`.
- Al terminar un anuncio, el montaje se mostraba en Remotion Studio (`npm run estudio`).

**Para instalar:** todo, con `INSTALAR.md`.

## Versiones sin archivo VERSION
Las de antes del 2026-10-18 no traían `VERSION`. El actualizador las reconoce solo; a mano, se reconocen así:
- **2026-10-16:** no hay `VERSION` ni `ACTUALIZAR.md`, y existen `produccion/estudio.js` y `.claude/launch.json`
  (el estudio de Remotion).
- **2026-10-17:** no hay `VERSION`, `ACTUALIZAR.md` ni `produccion/actualizar.js`, y tampoco
  `produccion/estudio.js`.
