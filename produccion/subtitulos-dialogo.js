// FASE 2.6 para modo_audio: dialogo_nativo — subtitulos por ALINEACION.
//
//   node produccion/subtitulos-dialogo.js temp/mi-anuncio
//   node produccion/subtitulos-dialogo.js temp/mi-anuncio --solo-plan
//
// En voz_en_off los tiempos vienen gratis: ElevenLabs devuelve el inicio y el
// fin de cada caracter junto con el audio que genero. Aca no hay pista externa
// —el personaje habla dentro del clip— asi que los tiempos hay que medirlos.
//
// ===========================================================================
// EL TEXTO SALE DE `linea` DEL MANIFIESTO. NUNCA DEL ASR.
// ===========================================================================
//
// Scribe solo aporta CUANDO se dijo cada palabra. QUE dice el subtitulo sale
// del manifiesto, palabra por palabra.
//
// La razon no es purismo: estos anuncios llevan nombres de marca y de producto
// inventados. Un ASR los escribe mal casi siempre —"Goli" sale "Golly", "Goly",
// "goli"— y un subtitulo que escribe mal el nombre del producto es peor que no
// tener subtitulo. Alineando, el texto ya es correcto y solo se miden tiempos.
//
// Si la alineacion no encuentra correspondencia para una linea, esa linea SE
// SALTA CON AVISO. No se inventan tiempos y NUNCA se cae al texto del ASR.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { cargarEnv, ESTILOS_HABLADOS, requerirClave } from './config.js';
import { ELEVENLABS } from './elevenlabs-client.js';
import { bloquesDeSubtitulos, REGLAS_SUB } from './subtitulos.js';

const MODELO_STT = 'scribe_v1';

/** Cuanta coincidencia exigimos para dar una linea por alineada. */
export const UMBRAL_ALINEACION = 0.6;

/**
 * Tomas habladas con frame inicial (tipo H: podcast y entrevista, 2026-10-13).
 * Cuando el montaje usa un TROZO del clip (bloque.segmento: una linea del
 * guion dentro de un clip que trae varias), las palabras del ASR que valen
 * para ese bloque son las que ARRANCAN dentro del segmento. Este aire a cada
 * lado cubre el redondeo de los tiempos de Scribe: una palabra que empieza
 * 50 ms antes del corte sigue siendo de este segmento, no del anterior.
 */
export const MARGEN_SEGMENTO_S = 0.1;

/** Las palabras del ASR cuyo `start` cae dentro del segmento (con el aire). FUNCION PURA. */
export function palabrasDelSegmento(palabrasAsr, segmento, margen = MARGEN_SEGMENTO_S) {
  const desde = Number(segmento.desdeClip) - margen;
  const hasta = Number(segmento.hastaClip) + margen;
  return (palabrasAsr || []).filter((w) => Number.isFinite(w?.start) && w.start >= desde && w.start <= hasta);
}

/**
 * Del tiempo DENTRO del clip al tiempo del anuncio montado: el bloque arranca
 * en `inicioBloque` y muestra el clip desde `desdeClip` (el recorte por
 * delante de siempre, o el principio del segmento). FUNCION PURA.
 */
export function desplazarAlAnuncio(conTiempo, inicioBloque, desdeClip) {
  return conTiempo.map((p) => ({
    texto: p.texto,
    inicio: Number((inicioBloque + p.inicio - desdeClip).toFixed(3)),
    fin: Number((inicioBloque + p.fin - desdeClip).toFixed(3)),
  }));
}

/** Normaliza para comparar: sin tildes, sin puntuacion, en minusculas. */
export function normalizar(palabra) {
  return String(palabra)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]/g, '');
}

/**
 * Alinea dos listas de palabras (Needleman-Wunsch) y devuelve, para cada
 * palabra del texto CORRECTO, el indice de la palabra del ASR que le
 * corresponde, o null si no encontro pareja.
 */
export function alinear(correctas, delAsr) {
  const n = correctas.length;
  const m = delAsr.length;
  const HUECO = -1;

  const puntos = (a, b) => {
    const x = normalizar(a);
    const y = normalizar(b);
    if (x === y) return 2;
    // Parecido: comparten prefijo. Cubre "goli"/"golly" y las tildes perdidas.
    const min = Math.min(x.length, y.length);
    let comun = 0;
    while (comun < min && x[comun] === y[comun]) comun++;
    if (min > 0 && comun / min >= 0.6) return 1;
    return -1;
  };

  const M = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) M[i][0] = i * HUECO;
  for (let j = 1; j <= m; j++) M[0][j] = j * HUECO;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      M[i][j] = Math.max(
        M[i - 1][j - 1] + puntos(correctas[i - 1], delAsr[j - 1]),
        M[i - 1][j] + HUECO,
        M[i][j - 1] + HUECO
      );
    }
  }

  const pares = new Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (M[i][j] === M[i - 1][j - 1] + puntos(correctas[i - 1], delAsr[j - 1])) {
      if (puntos(correctas[i - 1], delAsr[j - 1]) > 0) pares[i - 1] = j - 1;
      i--;
      j--;
    } else if (M[i][j] === M[i - 1][j] + HUECO) {
      i--;
    } else {
      j--;
    }
  }

  const emparejadas = pares.filter((x) => x !== null).length;
  return { pares, calidad: n ? emparejadas / n : 0 };
}

/**
 * Con los pares, le pone tiempo a cada palabra correcta.
 * Una palabra sin pareja se interpola entre sus vecinas alineadas: eso mueve un
 * subtitulo unos milisegundos, no le cambia el texto.
 */
export function tiemparPalabras(correctas, palabrasAsr, pares) {
  const salida = correctas.map((texto, i) => {
    const k = pares[i];
    if (k === null || !palabrasAsr[k]) return { texto, inicio: null, fin: null };
    return { texto, inicio: palabrasAsr[k].start, fin: palabrasAsr[k].end };
  });

  for (let i = 0; i < salida.length; i++) {
    if (salida[i].inicio !== null) continue;
    let antes = i - 1;
    while (antes >= 0 && salida[antes].fin === null) antes--;
    let despues = i + 1;
    while (despues < salida.length && salida[despues].inicio === null) despues++;

    const desde = antes >= 0 ? salida[antes].fin : (salida[despues]?.inicio ?? 0);
    const hasta = despues < salida.length ? salida[despues].inicio : desde + 0.3;
    const huecos = despues - antes;
    const paso = (hasta - desde) / Math.max(1, huecos);
    salida[i].inicio = Number((desde + paso * (i - antes - 1)).toFixed(3));
    salida[i].fin = Number((desde + paso * (i - antes)).toFixed(3));
  }

  return salida;
}

/** Extrae el audio de un clip a un mp3 temporal. */
function audioDeClip(rutaClip, destino) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', rutaClip, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', destino]);
  return destino;
}

/**
 * Transcribe con Scribe. Devuelve solo las palabras con sus tiempos.
 *
 * Con { eventos: true } (solo el clip de reacciones del podcast, 2026-10-14)
 * pide ademas los eventos de audio (tag_audio_events: una risa, un suspiro)
 * y devuelve las palabras Y los eventos, cada uno con su `type` de Scribe
 * ('word' o 'audio_event'), en el orden en que se oyen. Sin la opcion la
 * llamada y lo que devuelve son los de siempre: es lo que usan los
 * subtitulos, el corte de cola de UGC y las tomas habladas.
 */
export async function transcribir(rutaAudio, idioma = 'spa', { eventos = false } = {}) {
  const clave = requerirClave('ELEVENLABS_API_KEY', 'copiala desde https://elevenlabs.io/app/settings/api-keys');
  const form = new FormData();
  form.append('model_id', MODELO_STT);
  form.append('timestamps_granularity', 'word');
  if (eventos) form.append('tag_audio_events', 'true');
  if (idioma) form.append('language_code', idioma);
  form.append('file', new Blob([fs.readFileSync(rutaAudio)], { type: 'audio/mpeg' }), path.basename(rutaAudio));

  const res = await fetch(ELEVENLABS.base + '/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': clave },
    body: form,
  });

  const texto = await res.text();
  if (!res.ok) {
    throw new Error(`ElevenLabs STT devolvio ${res.status}: ${texto.slice(0, 300)}`);
  }
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`ElevenLabs STT devolvio una respuesta no-JSON: ${texto.slice(0, 200)}`);
  }
  if (eventos) return (json.words || []).filter((w) => w.type === 'word' || w.type === 'audio_event');
  return (json.words || []).filter((w) => w.type === 'word');
}

/** El bloque muestra un segmento de su clip (podcast): con desdeClip y hastaClip. */
const conSegmento = (b) => Boolean(b?.segmento) && Number.isFinite(b.segmento.desdeClip) && Number.isFinite(b.segmento.hastaClip);

/**
 * La linea de tiempo del plan con el que se hacen los subtitulos (estilos
 * hablados, 2026-10-14): un { toma, inicio, fin } por bloque del plan, en su
 * orden (toma = bloque.linea), mas el segundo del clip donde empieza el
 * bloque, el mismo que se uso para llevar las palabras al anuncio:
 *   desdeClip      el de un bloque con segmento (podcast: una linea del clip)
 *   recorteInicio  el de los demas (entrevista: el clip entero recortado por
 *                  delante; 0 si el bloque no trae recorte)
 * Va en subtitulos.json como `lineaDeTiempo`, y el plan la compara con sus
 * bloques de hoy: si cambiaron los bordes, la cabeza del recorte o el
 * congelado, los subtitulos son de un plan anterior y hay que rehacerlos (sin
 * la cabeza, un recorte que se mueve sin cambiar el largo del bloque pasaba
 * sin aviso). FUNCION PURA.
 */
export function lineaDeTiempoDelPlan(plan) {
  return (plan?.bloques || []).map((b) => {
    const entrada = { toma: b.linea, inicio: b.inicio, fin: b.fin };
    if (conSegmento(b)) entrada.desdeClip = b.segmento.desdeClip;
    else entrada.recorteInicio = Number.isFinite(b.toma?.recorteInicio) ? b.toma.recorteInicio : 0;
    return entrada;
  });
}

/**
 * Construye los subtitulos de un anuncio en dialogo_nativo.
 * Devuelve { bloques, avisos, detalle, lineaDeTiempo }. lineaDeTiempo solo en
 * los estilos hablados (o con tomas H); en los demas, null.
 */
export async function subtitularDialogo(carpeta, { log = console.log } = {}) {
  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  const plan = JSON.parse(fs.readFileSync(path.join(carpeta, 'plan-montaje.json'), 'utf8'));
  const dirTmp = path.join(carpeta, '.stt');
  fs.mkdirSync(dirTmp, { recursive: true });

  const idioma = manifiesto.idioma === 'es' ? 'spa' : manifiesto.idioma === 'pt' ? 'por' : 'eng';
  const todas = [];
  const avisos = [];
  const detalle = [];

  // Tomas habladas con frame inicial (tipo H: podcast y entrevista). Si ya se
  // midieron con `npm run lineas`, lineas-habladas.json trae las palabras del
  // ASR de cada toma y no se vuelve a transcribir. El archivo se mira SOLO en
  // esos estilos o con tomas H: cualquier otro anuncio pasa por aqui igual
  // que siempre.
  const hayH = ESTILOS_HABLADOS.includes(manifiesto.estilo) || (manifiesto.tomas || []).some((t) => t.tipo === 'H');
  let medidas = null;
  if (hayH) {
    const rutaMedidas = path.join(carpeta, 'lineas-habladas.json');
    if (fs.existsSync(rutaMedidas)) {
      try {
        medidas = JSON.parse(fs.readFileSync(rutaMedidas, 'utf8')).tomas || null;
      } catch (e) {
        avisos.push(`lineas-habladas.json no es JSON valido (${e.message}): se transcribe de nuevo. Mejor vuelve a medir: npm run lineas`);
      }
    }
  }
  // Una toma H partida en segmentos aparece en varios bloques: se transcribe
  // una sola vez por corrida.
  const cacheAsr = new Map();
  // Toma H con el final REPETIDO por el modelo (llena el tiempo que le sobra
  // diciendo otra vez las ultimas palabras). `palabras` de lineas-habladas.json
  // viene sin recortar, pero los tiempos de `lineas` que
  // uso el plan se midieron SIN esa cola (medirToma). Para la ultima linea del
  // clip, el plan estira hastaClip hasta el borde por silencio, que con una
  // repeticion no existe: la ventana del segmento abarca las dos veces, la
  // alineacion empata y gana la ULTIMA, y el subtitulo de toda la linea cae
  // sobre la repeticion. Medido en temp/prueba-lineas-seco (toma 2, hastaClip
  // 5.75): "Hasta que probe Befem." salia en 10.66 s cuando se dice en 8.96 s.
  // Mismo cuidado que el corte de cola de R (abajo), con el mismo chequeo que
  // `npm run lineas` (decidirColaHablada: el de UGC, con los numeros del guion
  // comparados como se dicen) y una sola vez por toma. lineas-habladas.js y
  // cortar-cola-ugc.js importan de este archivo: se cargan aqui, solo si hay
  // tomas H, para que ningun otro estilo cargue un modulo nuevo.
  const hablado = hayH ? await import('./lineas-habladas.js') : null;
  const idiomaComparar = ['es', 'en', 'pt'].includes(manifiesto.idioma) ? manifiesto.idioma : 'es';
  const colaPorToma = new Map();
  // Si la medida de cada toma H es del clip de hoy (por su tamano): una de
  // otro clip (se regenero) no se usa, como si faltara. Una vez por toma.
  const vigentePorToma = new Map();
  const carpetaTexto = (path.relative(process.cwd(), carpeta) || carpeta).split(path.sep).join('/');

  for (const bloque of plan.bloques) {
    const toma = manifiesto.tomas.find((t) => t.n === bloque.linea);
    if (!toma) continue;

    const clip = path.join(carpeta, 'video', bloque.toma.archivo);
    if (!fs.existsSync(clip)) {
      avisos.push(`toma ${toma.n}: no encuentro ${bloque.toma.archivo}, se queda sin subtitulos`);
      continue;
    }

    // Toma H: palabras ya medidas (lineas-habladas.json) o ya transcritas en
    // esta corrida. Cualquier otra toma: se transcribe aqui, como siempre.
    const esH = toma.tipo === 'H';
    if (esH && medidas?.[String(toma.n)] && !vigentePorToma.has(toma.n)) {
      const vigencia = hablado.estadoDeMedidaDelClip(carpeta, toma.n, medidas[String(toma.n)]);
      vigentePorToma.set(toma.n, vigencia.estado !== 'vieja');
      if (vigencia.estado === 'vieja') {
        avisos.push(`toma ${toma.n}: ${hablado.avisoMedidaVieja(toma.n, carpetaTexto)} (${vigencia.motivo}). Para los subtitulos se transcribe de nuevo.`);
      }
    }
    let palabrasAsr;
    let origen = '';
    if (esH && vigentePorToma.get(toma.n) && Array.isArray(medidas?.[String(toma.n)]?.palabras)) {
      palabrasAsr = medidas[String(toma.n)].palabras;
      origen = ' (palabras de lineas-habladas.json, sin transcribir)';
    } else if (esH && cacheAsr.has(toma.n)) {
      palabrasAsr = cacheAsr.get(toma.n);
      origen = ' (misma transcripcion que el bloque anterior de esta toma)';
    } else {
      const mp3 = audioDeClip(clip, path.join(dirTmp, `toma-${toma.n}.mp3`));
      palabrasAsr = await transcribir(mp3, idioma);
      if (esH) cacheAsr.set(toma.n, palabrasAsr);
    }
    // UGC por bloques (tipo R) con corte de cola: lo que se dijo DESPUES del
    // corte (el modelo repitio el final) no entra en el montaje. Alineando
    // contra la transcripcion entera, las ultimas palabras del guion se
    // emparejan con la repeticion (empatan y gana la ultima) y su subtitulo
    // caeria despues de que el bloque ya termino. Se alinea solo con lo que
    // queda. Cualquier otra toma, como siempre.
    if (toma.tipo === 'R' && Number.isFinite(bloque.toma.corteDeCola)) {
      palabrasAsr = palabrasAsr.filter((w) => w.start < bloque.toma.corteDeCola);
    }
    // Toma H: fuera la repeticion del final (ver colaPorToma arriba). Vale con
    // segmento (podcast) y con el clip entero (entrevista): la linea del guion
    // se dice primero en la primera vez, y es ahi donde va su subtitulo.
    if (esH) {
      if (!colaPorToma.has(toma.n)) {
        const cola = hablado.decidirColaHablada(toma.linea, palabrasAsr, { idioma: idiomaComparar });
        colaPorToma.set(toma.n, cola.decision === 'cortar' ? cola : null);
        if (cola.decision === 'cortar') {
          const s = (x) => `${x.toFixed(2)}s`;
          const dicho = cola.sobrantes.map((w) => w.texto).join(' ');
          log(
            `  toma ${toma.n}: el modelo repitio el final ("${dicho}", ${s(cola.sobrantes[0].inicio)}-${s(cola.sobrantes[cola.sobrantes.length - 1].fin)}): ` +
              'los subtitulos se alinean con la primera vez que se dijo'
          );
        }
      }
      const cola = colaPorToma.get(toma.n);
      if (cola) palabrasAsr = palabrasAsr.filter((w) => w.start < cola.fin);
    }
    // Toma H partida en segmentos (podcast: una linea del guion por bloque):
    // se alinea el texto DEL SEGMENTO contra las palabras que arrancan dentro
    // de su ventana del clip, no la linea entera de la toma. Sin segmento
    // (entrevista, o cualquier otra toma), como siempre: la linea entera.
    const segmento = esH && conSegmento(bloque) ? bloque.segmento : null;
    if (segmento) palabrasAsr = palabrasDelSegmento(palabrasAsr, segmento);
    const textoCorrecto = segmento ? String(bloque.texto ?? '') : toma.linea;
    const quien = segmento ? `toma ${toma.n} (linea ${segmento.orden})` : `toma ${toma.n}`;
    const correctas = textoCorrecto.split(/\s+/).filter(Boolean);
    const { pares, calidad } = alinear(correctas, palabrasAsr.map((w) => w.text));

    if (calidad < UMBRAL_ALINEACION) {
      // NO se inventan tiempos y NO se usa el texto del ASR. Mejor un subtitulo
      // faltante y un aviso claro, que uno con el nombre del producto mal escrito.
      avisos.push(
        `${quien}: la alineacion fallo (solo ${(calidad * 100).toFixed(0)}% de las palabras encontraron pareja, ` +
          `hace falta ${(UMBRAL_ALINEACION * 100).toFixed(0)}%).\n` +
          `         ESA TOMA QUEDA SIN SUBTITULOS. No se inventan tiempos ni se usa el texto del ASR.\n` +
          `         Linea del manifiesto: "${textoCorrecto}"\n` +
          `         Lo que oyo Scribe:    "${palabrasAsr.map((w) => w.text).join(' ')}"`
      );
      detalle.push({ toma: toma.n, ...(segmento ? { segmento: segmento.orden } : {}), calidad, subtitulada: false });
      continue;
    }

    const conTiempo = tiemparPalabras(correctas, palabrasAsr, pares);

    // Del tiempo DENTRO del clip al tiempo del anuncio montado: el clip se
    // recorta por delante (recorteInicio) y se coloca en bloque.inicio. Con
    // segmento, el clip se muestra desde desdeClip: bloque.inicio + start - desdeClip.
    const recorte = segmento ? segmento.desdeClip : bloque.toma.recorteInicio || 0;
    const desplazadas = desplazarAlAnuncio(conTiempo, bloque.inicio, recorte);

    todas.push(...desplazadas);
    detalle.push({ toma: toma.n, ...(segmento ? { segmento: segmento.orden } : {}), calidad, subtitulada: true, primera: desplazadas[0] });
    log(`  ${quien}: ${(calidad * 100).toFixed(0)}% alineado, ${desplazadas.length} palabras${origen}`);
  }

  fs.rmSync(dirTmp, { recursive: true, force: true });

  const bloques = bloquesDeSubtitulos(
    todas.filter((p) => Number.isFinite(p.inicio) && Number.isFinite(p.fin)),
    REGLAS_SUB
  );
  return { bloques, avisos, detalle, lineaDeTiempo: hayH ? lineaDeTiempoDelPlan(plan) : null };
}

// --- CLI ---
// Sin await de nivel superior: con tomas H, subtitularDialogo importa
// cortar-cola-ugc.js, que a su vez importa este archivo. Si este modulo sigue
// evaluandose (un await arriba), los dos se esperan y Node sale con
// "unsettled top-level await" sin hacer nada (primer podcast real, 2026-10-13).
if (process.argv[1] && process.argv[1].endsWith('subtitulos-dialogo.js')) {
  (async () => {
    const args = process.argv.slice(2);
    const carpetaArg = args.find((a) => !a.startsWith('--'));
    if (!carpetaArg) {
      console.error('\n  Uso: node produccion/subtitulos-dialogo.js <carpeta-del-anuncio>\n');
      process.exit(1);
    }
    const carpeta = path.resolve(carpetaArg);
    cargarEnv();

    console.log(`\n=== Subtitulos por alineacion — ${path.basename(carpeta)} ===\n`);
    console.log('  El texto sale del manifiesto. Scribe solo aporta los tiempos.\n');

    const { bloques, avisos, detalle, lineaDeTiempo } = await subtitularDialogo(carpeta);

    if (avisos.length) {
      console.log(`\n  --- ${avisos.length} AVISO(S) ---\n`);
      for (const a of avisos) console.log(`  !  ${a}`);
    }

    console.log(`\n  ${bloques.length} bloques de subtitulo.\n`);
    console.log('  Primer bloque de cada toma, para comparar contra el video:');
    // Una toma H partida en segmentos sale una vez por linea del guion.
    const etiqueta = (d) => `toma ${d.toma}${d.segmento !== undefined ? ` (linea ${d.segmento})` : ''}`;
    for (const d of detalle) {
      if (!d.subtitulada) {
        console.log(`    ${etiqueta(d)}: SIN SUBTITULOS`);
        continue;
      }
      const b = bloques.find((x) => Math.abs(x.inicio - d.primera.inicio) < 0.05);
      console.log(
        `    ${etiqueta(d)}: ${d.primera.inicio.toFixed(3)}s  "${b ? b.texto : d.primera.texto}"`
      );
    }

    const ruta = path.join(carpeta, 'subtitulos.json');
    // Estilos hablados: con la linea de tiempo del plan con que se hicieron,
    // para que el plan sepa si son de un plan anterior. Los demas, como siempre.
    const datos = lineaDeTiempo ? { generado: new Date().toISOString(), lineaDeTiempo, bloques } : { generado: new Date().toISOString(), bloques };
    fs.writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n', 'utf8');
    console.log(`\n  Guardado en ${ruta}`);
    console.log('  Ahora vuelve a planear y ensamblar para que salga la version con subtitulos.\n');
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
