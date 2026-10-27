// Configuracion central de la capa de produccion.
// Endpoints y nombres de modelo tomados de https://docs.kie.ai (no de memoria).

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIR_TEMP = path.join(RAIZ, 'temp');
export const DIR_OUTPUT = path.join(RAIZ, 'output');

// Carga .env sin dependencias externas (Node >= 20.12).
export function cargarEnv() {
  const ruta = path.join(RAIZ, '.env');
  if (!fs.existsSync(ruta)) {
    throw new Error("No existe el archivo .env: la instalacion no termino. Pidele a Claude 'instala esto' (sigue INSTALAR.md).");
  }
  process.loadEnvFile(ruta);
}

export function requerirClave(nombre, comoObtenerla) {
  const valor = (process.env[nombre] || '').trim();
  if (!valor) {
    throw new Error(`Falta ${nombre} en el archivo .env.\n  Como obtenerla: ${comoObtenerla}`);
  }
  return valor;
}

export const KIE = {
  base: 'https://api.kie.ai',
  crearTarea: '/api/v1/jobs/createTask',
  consultarTarea: '/api/v1/jobs/recordInfo',
  // OJO: la subida de archivos NO vive en api.kie.ai sino en este host.
  // La pagina de docs muestra api.kie.ai, pero ese devuelve 404. Verificado a mano.
  baseArchivos: 'https://kieai.redpandaai.co',
  subirBase64: '/api/file-base64-upload',
  creditos: '/api/v1/chat/credit',
  // https://kie.ai/pricing  <- precios vigentes. No hardcodear costos aqui.
  precios: 'https://kie.ai/pricing',
};

export const MODELOS = {
  imagen: {
    principal: 'nano-banana-2',
    respaldo: 'gpt-image-2',
  },
  video: {
    // OJO con la eleccion de este modelo. En kie.ai conviven dos "Omni":
    //
    //   gemini-omni-video            image_urls son solo REFERENCIAS.
    //                                No acepta frame final. firstFrameUrl y
    //                                lastFrameUrl ahi son campos de SALIDA.
    //   google/gemini-omni-flash-1-1 acepta first_frame_url + last_frame_url.
    //
    // Nuestras tomas Tipo B necesitan frame final, y los dos cuestan lo mismo,
    // asi que va el flash-1-1. Verificado en:
    //   https://docs.kie.ai/market/google/gemini-omni-flash-1-1
    //   https://docs.kie.ai/market/gemini-omni-video
    principal: 'google/gemini-omni-flash-1-1',
    respaldo: 'kling-3.0/video',
  },
};

/** Resolucion de video por defecto para TODO el pipeline, respaldos incluidos. */
export const RESOLUCION_VIDEO = '720p';

/**
 * UGC POR BLOQUES (tomas tipo "R" = solo referencias, cero frames).
 *
 * En un manifiesto con tomas R no se genera ningun frame: cada bloque se pide
 * a Omni con la imagen del personaje y la foto del producto como REFERENCIAS
 * (image_urls), no como primer cuadro. Lo unico que se genera en la etapa de
 * imagen es la hoja de cada personaje.
 *
 * Por que modelos propios y no MODELOS.imagen / MODELOS.video:
 *
 *  - Imagen: la hoja del personaje sale con GPT Image 2.5 Sunburst a 2K. Fue la
 *    de la prueba real del 2026-10-04 (temp/prueba-ugc-bloques/, Befem): piel
 *    con textura real y cara que Omni sostuvo en los dos bloques. Solo cambia
 *    el modelo de las hojas de manifiestos con tomas R; MODELOS.imagen.principal
 *    NO se toca (cambiarlo para todos los estilos es otro paso, aparte).
 *  - Video: solo flash-1-1 sabe mandar image_urls en ADAPTADORES_VIDEO. Si
 *    algun dia MODELOS.video.principal cambia, los bloques R no se pueden ir con
 *    el: siguen aqui. Y NO tienen respaldo (decision del estilo, 2026-10-04):
 *    kling-3.0 usa image_urls como frames, no genera dialogo y pronuncia mal.
 */
export const MODELO_IMAGEN_UGC = 'gpt-image-2-5-sunburst';
export const RESOLUCION_IMAGEN_UGC = '2K';
export const MODELO_VIDEO_UGC = 'google/gemini-omni-flash-1-1';

/**
 * MODELO DE IMAGEN POR ESTILO.
 *
 * Un estilo que esta en esta tabla genera TODAS sus imagenes con su propia
 * cascada: hojas (personaje, lugar, producto), frames iniciales, frames finales
 * y B-roll. Cada modelo va a su propia resolucion. Un estilo que no esta en la
 * tabla usa MODELOS.imagen a 1K, exactamente como antes.
 *
 *  - estilo-lego (decision del estilo, 2026-10-05): GPT Image 2.5 Sunburst de
 *    principal a 2K (su unico precio medido, ver PRECIOS) y nano-banana-2 de
 *    respaldo a su 1K de siempre. Sin referencias sale el text-to-image y con
 *    referencias el image-to-image: eso lo decide ADAPTADORES_IMAGEN, no esta
 *    tabla.
 *
 * MODELOS.imagen NO se toca (cambiar el modelo de todos los estilos es otro
 * paso, aparte), y las hojas de los bloques UGC tipo R siguen con
 * MODELO_IMAGEN_UGC.
 */
export const MODELO_IMAGEN_POR_ESTILO = {
  'estilo-lego': {
    cascada: ['gpt-image-2-5-sunburst', 'nano-banana-2'],
    resoluciones: { 'gpt-image-2-5-sunburst': '2K', 'nano-banana-2': '1K' },
  },
  // Podcast y entrevista (decision del estilo, 2026-10-13): hojas (hosts, persona,
  // calle, mano con el mic), imagenes de clip y de B-roll con GPT Image 2.5
  // Sunburst a 2K, como las de UGC y Lego. Los iconos van aparte, con
  // MODELO_IMAGEN_ICONOS (gpt-image-2 con fondo transparente).
  podcast: {
    cascada: ['gpt-image-2-5-sunburst', 'nano-banana-2'],
    resoluciones: { 'gpt-image-2-5-sunburst': '2K', 'nano-banana-2': '1K' },
  },
  entrevista: {
    cascada: ['gpt-image-2-5-sunburst', 'nano-banana-2'],
    resoluciones: { 'gpt-image-2-5-sunburst': '2K', 'nano-banana-2': '1K' },
  },
};

/**
 * ESTILOS QUE ADMITEN CONTINUIDAD (produccion/continuidad.js): los animados con
 * narrador en voz en off. Cada video va de la imagen de una toma a la de la
 * siguiente, sin B-roll ni transiciones del editor. Son los valores de
 * "estilo" que escriben sus skills en el manifiesto. La app local lee esta
 * misma lista para ofrecer "¿Deseas continuidad?".
 *
 * Fuera quedan los que tienen la voz dentro del clip (UGC, objeto parlante) o
 * cantada (historias musicales, musicales): encadenar los clips la rompe.
 */
export const ESTILOS_CON_CONTINUIDAD = ['estilo-pixar', 'claymation', 'zack-d-films', 'crochet', 'estilo-lego', 'skeleton'];

/**
 * ESTILOS HABLADOS (podcast y entrevista, 2026-10-13). Su flujo esta en
 * COMO-PRODUCIR.md, seccion 12. Sus tomas son tipo "H": la persona
 * habla dentro del clip (dialogo nativo) y la imagen del clip
 * (img/toma-N-inicial.png) se genera con las referencias (hojas, producto).
 * El video se pide a Omni de una de dos maneras (first_frame_url e
 * image_urls no se mezclan en la misma llamada):
 *
 *  - Frame inicial (podcast, y una toma de entrevista sin "ingredientes"):
 *    esa imagen como first_frame_url, sin referencias.
 *  - Por ingredientes (entrevista, ESTILOS_CON_INGREDIENTES, 2026-10-14):
 *    "tomas[].ingredientes" en orden, como image_urls: "imagen" es la imagen
 *    del clip (imagen 1, que el prompt pide usar como frame inicial) y los
 *    demas son ids de referencias (en B la mano con el microfono y, si sale,
 *    la foto del producto). Asi se hace a mano en Flow y el habla sale mucho
 *    mas limpia (pruebas Befem A y B). Mismo modelo, mismo precio.
 *
 * Todo lo que ramifica por estos estilos ramifica SOLO por ellos: un
 * manifiesto de cualquier otro estilo pasa por el motor exactamente igual que
 * antes. Decisiones del estilo (2026-10-13):
 *
 *  - Sin musica de fondo: ni Suno, ni pista fija, ni el aviso de "sin musica".
 *  - Sin modelo de respaldo para las tomas habladas (Kling no genera dialogo).
 *  - El B-roll de estos estilos se genera con Kling 3.0 (elegido por ser mas
 *    barato), siempre mudo (en el montaje va sin audio), desde una imagen
 *    generada como el B-roll de siempre. Kling cobra por segundo: 14 cr/s a
 *    720p sin audio, 20 con audio (ver MODELOS_VIDEO).
 *  - Los iconos (entrevista) se generan con gpt-image-2 a 1K, cuadrados, con
 *    fondo transparente (campo "background" de la API; si el modelo lo
 *    ignora, el montaje los muestra dentro de una tarjeta blanca).
 */
export const ESTILOS_HABLADOS = ['podcast', 'entrevista'];
export const ESTILOS_SIN_MUSICA = ['podcast', 'entrevista'];
export const ESTILOS_SIN_RESPALDO_VIDEO = ['podcast', 'entrevista'];
export const MODELO_VIDEO_BROLL_POR_ESTILO = { podcast: 'kling-3.0/video', entrevista: 'kling-3.0/video' };
export const SONIDO_BROLL_POR_ESTILO = { podcast: false, entrevista: false };
export const MODELO_IMAGEN_ICONOS = 'gpt-image-2';
export const RESOLUCION_IMAGEN_ICONOS = '1K';
/** Lo unico que acepta Omni Flash para una toma hablada (tipo H). */
export const DURACIONES_H = [4, 6, 8, 10];
/**
 * Estilos cuyas tomas H se generan por INGREDIENTES ("tomas[].ingredientes",
 * ver arriba). El podcast no esta: se aprobo con frame inicial y por
 * ingredientes no se probo. El validador no deja el campo en ningun otro estilo.
 */
export const ESTILOS_CON_INGREDIENTES = ['entrevista'];
/** El ingrediente que es la imagen del clip (img/toma-N-inicial.png); el resto son ids de referencias. */
export const INGREDIENTE_IMAGEN = 'imagen';

/**
 * Capacidades y precios de cada modelo de video. Verificado el 2026-09-01 en
 * https://docs.kie.ai y https://kie.ai/pricing
 *
 * Ojo con dos cosas:
 *  - gemini-omni-video cobra POR VIDEO segun el tramo de duracion, y cobra
 *    IGUAL en 360p, 720p y 1080p. Solo 4k cuesta mas.
 *  - kling-3.0 cobra POR SEGUNDO y ahi 720p si es mas barato que 1080p.
 *    Usamos la variante sin audio: nuestros clips salen mudos.
 */
export const MODELOS_VIDEO = {
  'google/gemini-omni-flash-1-1': {
    // nombre canonico -> { alto en pixeles, valor que espera la API }
    resoluciones: {
      '360p': { alto: 360, api: '360p' },
      '720p': { alto: 720, api: '720p' },
      '1080p': { alto: 1080, api: '1080p' },
      '4k': { alto: 2160, api: '4k' },
    },
    duraciones: [4, 6, 8, 10],
    frameFinal: true, // first_frame_url + last_frame_url
    // Sin frames, acepta hasta 7 imagenes de REFERENCIA en image_urls (no se
    // pueden mezclar con first_frame_url). Lo usan los bloques UGC tipo R y
    // las tomas H de la entrevista por ingredientes (ESTILOS_CON_INGREDIENTES).
    // Probado el 2026-10-04 con 2 (personaje + producto), 10 s 720p = 126 cr.
    referencias: { max: 7 },
    // AUDIO: la doc no expone ningun parametro (no hay sound / generate_audio /
    // enable_audio), y su unico campo de audio, audio_ids, es "mutually exclusive
    // with first_frame_url". Sin embargo, VERIFICADO A MANO el 2026-09-01: los
    // clips SI vienen con pista AAC de ambiente y efectos, sin voces, usando
    // first_frame_url + last_frame_url. Medido con volumedetect: mean -33 a
    // -45 dB con picos de -2 a -14 dB (una pista muda daria ~-91 dB).
    //
    // O sea: hay audio nativo no documentado, gratis, y es justo lo que
    // queremos. No se puede pedir ni apagar por parametro. Si algun dia deja de
    // venir, el plan B es agregar los efectos en Remotion.
    audio: {
      soportado: true,
      documentado: false,
      parametro: null, // sale solo, no se pide
      contenido: 'ambiente y efectos, sin voces (verificado 2026-09-01)',
    },
    cobro: 'por-video',
    // Creditos por video segun el tramo. Identico en 360p, 720p y 1080p.
    precio: {
      '360p': { 4: 63, 6: 84, 8: 105, 10: 126 },
      '720p': { 4: 63, 6: 84, 8: 105, 10: 126 },
      '1080p': { 4: 63, 6: 84, 8: 105, 10: 126 },
      '4k': { 4: 147, 6: 168, 8: 189, 10: 210 },
    },
  },
  'kling-3.0/video': {
    // En Kling la resolucion se pide con "mode", no con un campo resolution.
    resoluciones: {
      '720p': { alto: 720, api: 'std' },
      '1080p': { alto: 1080, api: 'pro' },
      '4k': { alto: 2160, api: '4K' },
    },
    duraciones: null, // libre
    duracionMin: 3,
    duracionMax: 15,
    frameFinal: true, // image_urls[1] es el frame de cierre
    // DECISION TOMADA (2026-09-06): Kling va SIEMPRE con sound: true.
    // Vale para los SEIS estilos: este campo es lo unico que lo decide.
    //
    // Revierte la decision del 2026-09-01, que lo tenia en false. Aquella se
    // tomo por miedo a que Kling generara una voz encimada a la narracion: su
    // "sound" es un interruptor de todo o nada y no permite excluir voces.
    //
    // Por que se revirtio, con el caso que lo mostro: en el primer anuncio de
    // zack-d las tomas 6 y 14 cayeron al respaldo y salieron MUDAS. Las dos son
    // de una sola persona (una estornudando, otra enferma bajo una manta), o sea
    // justo donde no hay dos personajes hablandose, que es el unico sitio donde
    // se han observado voces coladas. Y el estornudo es exactamente el sonido
    // que el modelo pone solo. Se perdio ambiente a cambio de un riesgo que ahi
    // no existia.
    //
    // El riesgo real se maneja aguas abajo y ya esta probado: el chequeo de voces
    // coladas (COMO-PRODUCIR.md, seccion 6) transcribe los clips, y un clip con habla se
    // silencia. En ese mismo anuncio se detectaron y silenciaron 3 clips del
    // modelo PRINCIPAL con esa misma tecnica.
    //
    // Cuesta mas y se acepta: 720p pasa de 14 a 20 creditos por segundo.
    audio: { soportado: true, campo: 'sound', usar: true, puedeExcluirVoces: false },
    cobro: 'por-segundo',
    precio: { '720p': 14, '1080p': 18, '4k': 67 }, // creditos por segundo, sin audio
    precioConAudio: { '720p': 20, '1080p': 27, '4k': 67 },
  },
};

/**
 * Devuelve la resolucion que hay que pedirle a un modelo.
 * Si el modelo ofrece la preferida, esa. Si no, la mas cercana por altura.
 */
export function resolucionPara(modelo, preferida = RESOLUCION_VIDEO) {
  const def = MODELOS_VIDEO[modelo];
  if (!def) throw new Error(`No conozco el modelo de video "${modelo}"`);

  const disponibles = Object.entries(def.resoluciones);
  const exacta = disponibles.find(([nombre]) => nombre.toLowerCase() === preferida.toLowerCase());
  if (exacta) return { nombre: exacta[0], api: exacta[1].api, alto: exacta[1].alto, exacta: true };

  const objetivo = Number(String(preferida).replace(/[^0-9]/g, '')) || 720;
  const [nombre, datos] = disponibles.reduce((mejor, actual) =>
    Math.abs(actual[1].alto - objetivo) < Math.abs(mejor[1].alto - objetivo) ? actual : mejor
  );
  return { nombre, api: datos.api, alto: datos.alto, exacta: false };
}

/** Duracion que hay que pedir para cubrir `segundos` sin quedarse corto. */
export function duracionPara(modelo, segundos) {
  const def = MODELOS_VIDEO[modelo];
  if (!def) throw new Error(`No conozco el modelo de video "${modelo}"`);

  if (def.duraciones) {
    const tramo = def.duraciones.find((d) => d >= segundos);
    // Mas largo que el tope del modelo: se divide, no se trunca.
    return tramo ?? null;
  }
  const d = Math.max(def.duracionMin ?? 1, Math.ceil(segundos));
  return def.duracionMax && d > def.duracionMax ? null : d;
}

/** Creditos de un clip, ya resueltos modelo + resolucion + duracion. */
export function creditosClip(modelo, segundos, preferida = RESOLUCION_VIDEO) {
  const def = MODELOS_VIDEO[modelo];
  const res = resolucionPara(modelo, preferida);
  const dur = duracionPara(modelo, segundos);
  if (dur === null) return { creditos: null, resolucion: res, duracion: null, excedeTope: true };

  const creditos = def.cobro === 'por-segundo' ? def.precio[res.nombre] * dur : def.precio[res.nombre][dur];
  return { creditos, resolucion: res, duracion: dur, excedeTope: false };
}

/**
 * Arma el cuerpo de la peticion de video para cada modelo.
 *
 * OJO en flash-1-1: "image_urls" y "first_frame_url" son MUTUAMENTE EXCLUYENTES.
 * Como nosotros siempre partimos de un frame ya generado, usamos first_frame_url
 * (y last_frame_url en las Tipo B). Las referencias de personaje y producto ya
 * se aplicaron en la etapa de imagen: aqui no se vuelven a mandar.
 *
 * UNICA EXCEPCION, los bloques UGC tipo R: no tienen frames. Llegan con
 * `imagenesReferencia` y SIN frame inicial ni final, y entonces se mandan como
 * image_urls (maximo 7, en el orden recibido: es el "Imagen 1, Imagen 2" del
 * prompt), sin first_frame_url. Ese es el cuerpo de la prueba real del
 * 2026-10-04. En cuanto llega un frame, las referencias se IGNORAN y el cuerpo
 * sale exactamente igual que antes: ningun otro estilo cambia. Las tomas H de
 * la entrevista por ingredientes (2026-10-14) llegan igual que un bloque R: la
 * imagen del clip va como la primera de image_urls, no como first_frame_url.
 */
export const ADAPTADORES_VIDEO = {
  'google/gemini-omni-flash-1-1': ({ prompt, frameInicial, frameFinal, imagenesReferencia, aspectRatio, resolucionApi, duracion }) => {
    if (!frameInicial && !frameFinal && Array.isArray(imagenesReferencia) && imagenesReferencia.length > 0) {
      const max = MODELOS_VIDEO['google/gemini-omni-flash-1-1'].referencias.max;
      if (imagenesReferencia.length > max) {
        // No se recorta en silencio: la imagen que sobra es una que el prompt
        // nombra ("Imagen 8") y que el modelo nunca veria.
        throw new Error(`google/gemini-omni-flash-1-1 acepta hasta ${max} referencias y llegaron ${imagenesReferencia.length}.`);
      }
      return {
        model: 'google/gemini-omni-flash-1-1',
        input: {
          prompt,
          image_urls: [...imagenesReferencia],
          duration: String(duracion),
          aspect_ratio: aspectRatio,
          resolution: resolucionApi,
        },
      };
    }
    return {
      model: 'google/gemini-omni-flash-1-1',
      input: {
        prompt,
        first_frame_url: frameInicial,
        ...(frameFinal ? { last_frame_url: frameFinal } : {}),
        duration: String(duracion),
        aspect_ratio: aspectRatio,
        resolution: resolucionApi,
      },
    };
  },
  'kling-3.0/video': ({ prompt, frameInicial, frameFinal, aspectRatio, resolucionApi, duracion, sonido }) => ({
    model: 'kling-3.0/video',
    input: {
      prompt,
      image_urls: frameFinal ? [frameInicial, frameFinal] : [frameInicial],
      // UNA sola fuente de verdad: el campo declarado en MODELOS.video.respaldo.
      // Hasta el 2026-09-06 esto estaba cableado a false aqui, ignorando ese
      // campo, asi que cambiarlo alla no tenia ningun efecto sobre la llamada.
      //
      // `sonido` (opcional) lo pasa SOLO el B-roll de los estilos hablados
      // (SONIDO_BROLL_POR_ESTILO): ese B-roll va mudo en el montaje y sin audio
      // Kling cobra 14 cr/s en vez de 20. Quien no lo pasa sigue con el de siempre.
      sound: typeof sonido === 'boolean' ? sonido : MODELOS_VIDEO['kling-3.0/video'].audio.usar,
      duration: String(duracion),
      aspect_ratio: aspectRatio,
      mode: resolucionApi,
      multi_shots: false,
    },
  }),
};

/**
 * Cada modelo de imagen nombra sus campos distinto. Este adaptador traduce
 * nuestra peticion generica al cuerpo que espera cada uno.
 *
 *   nano-banana-2   -> image_input
 *   gpt-image-2     -> input_urls, y ADEMAS cambia el string del modelo
 *                      segun haya o no referencias.
 *   gpt-image-2-5-sunburst -> igual que gpt-image-2: input_urls, y el string
 *                      del modelo cambia segun haya o no referencias. Lo usan
 *                      las hojas de manifiestos con tomas R (ver
 *                      MODELO_IMAGEN_UGC) y todas las imagenes de estilo-lego
 *                      (ver MODELO_IMAGEN_POR_ESTILO).
 *
 * Verificado en docs.kie.ai (2026-08-31):
 *   https://docs.kie.ai/market/google/nanobanana2
 *   https://docs.kie.ai/market/gpt/gpt-image-2-text-to-image
 *   https://docs.kie.ai/market/gpt/gpt-image-2-image-to-image
 *
 * Sunburst: el text-to-image se uso de verdad el 2026-10-04 con estos mismos
 * campos (prompt, aspect_ratio, resolution 2K -> 10 creditos, ver
 * temp/prueba-ugc-bloques/prompts-usados.json). El image-to-image
 * (gpt-image-2-5-sunburst-image-to-image con input_urls) sigue la misma forma
 * que gpt-image-2 pero todavia no se ha llamado nunca desde aqui.
 * Los dos verificados en docs.kie.ai el 2026-10-05, coinciden con este cuerpo:
 *   https://docs.kie.ai/market/gpt/gpt-image-2-5-sunburst-text-to-image
 *   https://docs.kie.ai/market/gpt/gpt-image-2-5-sunburst-image-to-image
 * prompt hasta 20000 caracteres, input_urls hasta 16 imagenes (obligatorio en
 * el image-to-image), 9:16 admite 2K. "background" es opcional y no se manda.
 */
export const ADAPTADORES_IMAGEN = {
  'nano-banana-2': ({ prompt, referencias, aspectRatio, resolucion, formato }) => ({
    model: 'nano-banana-2',
    input: {
      prompt,
      image_input: referencias,
      aspect_ratio: aspectRatio,
      resolution: resolucion,
      output_format: formato,
    },
  }),
  // `fondo: 'transparente'` (opcional) lo piden SOLO los iconos de los estilos
  // hablados (ver MODELO_IMAGEN_ICONOS): manda background: "transparent". Quien
  // no lo pasa manda el mismo cuerpo de siempre.
  'gpt-image-2': ({ prompt, referencias, aspectRatio, resolucion, fondo }) => {
    const extra = fondo === 'transparente' ? { background: 'transparent' } : {};
    return referencias.length > 0
      ? {
          model: 'gpt-image-2-image-to-image',
          input: { prompt, input_urls: referencias, aspect_ratio: aspectRatio, resolution: resolucion, ...extra },
        }
      : {
          model: 'gpt-image-2-text-to-image',
          input: { prompt, aspect_ratio: aspectRatio, resolution: resolucion, ...extra },
        };
  },
  'gpt-image-2-5-sunburst': ({ prompt, referencias, aspectRatio, resolucion }) =>
    referencias.length > 0
      ? {
          model: 'gpt-image-2-5-sunburst-image-to-image',
          input: { prompt, input_urls: referencias, aspect_ratio: aspectRatio, resolution: resolucion },
        }
      : {
          model: 'gpt-image-2-5-sunburst-text-to-image',
          input: { prompt, aspect_ratio: aspectRatio, resolution: resolucion },
        },
};

/**
 * Precios en creditos por generacion. Consultados en https://kie.ai/pricing
 * el 2026-09-01. LOS PRECIOS CAMBIAN: si la estimacion se ve rara, vuelve a
 * mirar la pagina y actualiza esta tabla.
 *
 * El costo real de cada tarea llega en "creditsConsumed" al consultarla, asi
 * que lo que se reporta al final del proceso es el gasto real, no el estimado.
 */
export const PRECIOS = {
  consultado: '2026-09-01',
  usdPorCredito: 0.005, // 168 creditos = US$0.84 en toda la tabla
  imagen: {
    'nano-banana-2': { '1K': 8, '2K': 12, '4K': 18 },
    'gpt-image-2': { '1K': 6, '2K': 10, '4K': 16 },
    // 2K MEDIDO el 2026-10-04 (saldo antes/despues de la prueba de UGC por
    // bloques: 10 creditos justos). 1K y 4K NO VERIFICADOS: van en null a
    // proposito, para que nadie estime con un numero inventado. Quien los use,
    // que los mida primero y los anote aqui.
    // El image-to-image (estilo-lego) se estima con este mismo 2K: la pagina
    // del modelo, https://kie.ai/gpt-image-2-5 (leida el 2026-10-05), publica
    // el mismo precio para text-to-image e image-to-image, 6 / 10 / 16
    // creditos a 1K / 2K / 4K. Solo el 2K esta medido.
    'gpt-image-2-5-sunburst': { '1K': null, '2K': 10, '4K': null },
  },
  // Los precios de video viven en MODELOS_VIDEO, arriba: alli dependen
  // de resolucion y tramo de duracion, no de un solo numero.
};

export const creditosAUsd = (creditos) => creditos * PRECIOS.usdPorCredito;

export const CONCURRENCIA = 4;
export const CONCURRENCIA_VIDEO = 3; // los videos pesan mas y tardan mas
export const TIMEOUT_VIDEO_MS = 15 * 60 * 1000; // kie.ai permite 20 solicitudes cada 10s

export const POLLING = {
  intervaloInicialMs: 3000,
  intervaloMaximoMs: 15000,
  factor: 1.4,
  timeoutMs: 6 * 60 * 1000,
};

export const REINTENTOS_POR_MODELO = 3;

/**
 * Recorte de silencios en los bordes, para modo_audio: dialogo_nativo.
 *
 * En este modo el clip es el amo: el personaje habla dentro del clip y no hay
 * pista de narracion externa. Pero los clips llegan con aire muerto en los
 * bordes y, concatenados tal cual, el anuncio arrastra silencio entre escenas.
 *
 * Solo se recortan los BORDES EXTERIORES. Nunca por dentro del dialogo: ahi
 * esta el lip-sync y cualquier corte lo rompe.
 *
 * VALORES MEDIDOS sobre un clip real de google/gemini-omni-flash-1-1
 * (8s, 720p, 9:16, first_frame_url + last_frame_url, 2026-09-03,
 *  ver temp/prueba-ugc-dialogo/):
 *
 *   aire muerto al inicio  1.07 s
 *   aire muerto al final   1.87 s
 *   dialogo util           5.06 s de 8   (37% del clip era silencio)
 *
 * OJO CON EL UMBRAL. No lo "ajustes a un valor mas razonable":
 *
 *   -30 dB  corte limpio, un solo tramo de silencio en cada borde.  <-- este
 *   -35 dB  parte la cola en tres pedazos y NO detecta la cabeza.
 *   -38 dB  no detecta nada.
 *   -40 dB  no detecta nada.
 *
 * El piso de ambiente del modelo ronda los -45 dB, pero trae transitorios que
 * se cuelan por encima de -38. Un umbral "conservador" de -40 dB parece mas
 * seguro y en la practica desactiva el recorte entero sin avisar.
 *
 * El margen existe porque la boca empieza a articular ~0.2 s ANTES de que entre
 * el audio. Con menos de 250 ms el clip abre con la boca ya en movimiento.
 *
 * CUIDADO AL IMPLEMENTAR: silencedetect devuelve TODOS los tramos de silencio,
 * tambien los de adentro. Un segundo clip de prueba (clip-enie.mp4, misma linea)
 * trajo una PAUSA INTERIOR de 1.31 s en mitad del dialogo:
 *
 *   0.00 - 1.28   silencio de cabeza    <- se recorta
 *   1.28 - 3.50   habla
 *   3.50 - 4.82   PAUSA INTERIOR        <- NO se toca, ahi vive el lip-sync
 *   4.82 - 6.83   habla
 *   6.83 - 8.00   silencio de cola      <- se recorta
 *
 * Solo se recortan el PRIMER y el ULTIMO tramo, y solo si tocan el borde
 * (empiezan en 0 / terminan en la duracion del clip). Un recorte que se lleve
 * todos los tramos detectados destroza el clip.
 */
export const RECORTE_BORDES = {
  umbralDb: -30,
  duracionMinimaS: 0.3, // d= de silencedetect: cuanto silencio seguido cuenta
  margenMs: 250,
  medidoCon: 'google/gemini-omni-flash-1-1',
  medidoEl: '2026-09-03',
};
