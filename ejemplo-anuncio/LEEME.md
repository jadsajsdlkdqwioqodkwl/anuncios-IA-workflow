# Anuncio de ejemplo — solo para mirar

Esto es un anuncio **real y terminado**, de estilo crochet, para un producto de
skincare. Está aquí para que veas cómo queda el trabajo por dentro.

**No se toca, no se edita y no se usa como punto de partida.** Los anuncios
nuevos se crean en `temp/`, cada uno en su propia carpeta.

## Qué hay aquí

**`manifiesto.json`** — el contrato que emite la skill y que el motor ejecuta.
Es lo más instructivo del paquete. Dentro está:

- las **referencias**: el personaje fijo y la foto del producto, que se reusan
  en todas las tomas para que no cambie de cara entre cortes
- las **16 tomas**, cada una con su línea de guion, su tipo, su duración y sus
  prompts completos de imagen y de video
- los **16 B-roll**, cada uno con la toma a la que acompaña y la frase con la
  que sincroniza
- el **guion limpio de voz en off**, tal como se le manda a ElevenLabs

Fíjate en dos cosas al leer los prompts: los **bloques universales** que se
repiten palabra por palabra en todos (son lo que mantiene el estilo), y que
cada toma dice explícitamente en qué ambiente ocurre — nunca "flotando" en un
fondo liso.

En esta versión esos prompts de imagen y de video los lleva Claude a **Google
Flow**: abre Flow en tu Chrome, genera ahí cada imagen y cada video y los
descarga (quedan en la carpeta de descargas de Chrome, que no hace falta
cambiar); después el sistema los acomoda solo en la carpeta del anuncio. El
manifiesto es el mismo; lo único que cambia es dónde se generan las piezas.

**`producto.jpg`** — la foto del producto que se le pasó a la skill. Es la
referencia que se reusa en todas las tomas donde aparece el envase.

**`plan-montaje.txt`** — la hoja de ruta del montaje, escrita para que la lea
una persona. Dice qué toma va en qué segundo, cuánto se acelera o se recorta
cada clip, qué B-roll le toca y dónde está el mp3 de la voz.

**Este archivo es lo que te llevas a CapCut** si prefieres montar el anuncio tú
mismo en vez de que el sistema lo arme. Con él no tienes que adivinar nada.

## Lo que no está

Las imágenes y los videos generados, y el MP4 final. Pesan cientos de megas y
harían el archivo de descarga inmanejable. Lo que enseña de verdad —cómo se
piensa y cómo se escribe un anuncio— está en los archivos de arriba.

## El anuncio, en números

| | |
|---|---|
| Estilo | crochet, voz en off |
| Duración | 51.3 segundos |
| Piezas | 16 tomas + 16 B-roll: 40 imágenes y 32 videos |
| Imágenes (Google Flow) | 0 créditos |
| Videos (Google Flow, Omni 1.1 Flash a 720p) | unos 256 créditos si cada clip sale a la primera (22 de 4 s, 9 de 6 s y 1 de 8 s) |
| Voz en off y subtítulos | ElevenLabs, con tu plan |
| Música de fondo | Suno por kie.ai, centavos de dólar |

Los créditos salen de contar los clips de este manifiesto por su largo, con
los precios medidos en Flow para Omni 1.1 Flash a 720p (4 s = 7, 6 s = 10 y
8 s = 12 créditos por clip). Antes de mandar los videos, Claude te dice la
cuenta que imprime el motor y espera tu ok; si un largo no está medido ahí,
lo marca "sin medir" en vez de inventar un precio. Un clip que hay que
repetir suma sus créditos otra vez, así que conviene tener margen en la
cuenta de Google (por eso se recomienda el plan Google AI Pro o Ultra).
