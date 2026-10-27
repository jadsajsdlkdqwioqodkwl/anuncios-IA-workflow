// Recorte de silencios en los BORDES de un clip, para modo_audio: dialogo_nativo.
//
// En este modo el personaje habla dentro del clip y no hay pista de narracion
// externa. Los clips llegan casi siempre con aire muerto en los bordes: el
// personaje no habla en el primer segundo ni en el ultimo. Concatenados tal
// cual, el anuncio arrastra silencio entre escenas y se siente lento.
//
// REGLA QUE NO SE ROMPE: solo se recortan los bordes EXTERIORES. Nunca por
// dentro del dialogo, porque ahi esta el lip-sync y cualquier corte lo rompe.
//
// Medido el 2026-09-03 sobre dos clips reales de google/gemini-omni-flash-1-1
// (ver temp/prueba-ugc-dialogo/): 1.07s y 1.28s de aire al inicio, 1.87s y
// 1.17s al final. Entre el 30% y el 37% del clip era silencio de borde.
//
// El segundo clip trajo ademas una PAUSA INTERIOR de 1.31s en mitad del
// dialogo. Por eso este modulo se queda solo con el primer y el ultimo tramo,
// y solo si tocan el borde: un recorte que se llevara todos los tramos que
// devuelve silencedetect destrozaria el clip.

import { execFileSync, spawnSync } from 'node:child_process';
import { RECORTE_BORDES } from './config.js';

/**
 * Lee los tramos de silencio que reporta ffmpeg.
 * OJO: silencedetect escribe en STDERR y ffmpeg termina con codigo 0, asi que
 * hay que capturar stderr explicitamente. Leyendo solo stdout no llega nada y
 * el resultado es "no hay silencios" en todos los clips.
 */
function tramosDeSilencio(archivo, umbralDb, duracionMinimaS) {
  const r = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-nostats', '-i', archivo, '-af', `silencedetect=noise=${umbralDb}dB:d=${duracionMinimaS}`, '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
  );
  if (r.error) throw r.error;
  return String(r.stderr || '');
}

/** Duracion del clip, en segundos. */
function duracionDe(archivo) {
  return Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', archivo], {
      encoding: 'utf8',
    }).trim()
  );
}

/**
 * Cuanto silencio hay pegado a cada borde de un clip.
 *
 * Devuelve { duracion, inicio, fin, util, tramos, interiores }, todo en segundos:
 *   inicio  cuanto recortar por delante (ya con el margen de seguridad restado)
 *   fin     cuanto recortar por detras
 *   util    lo que queda: duracion - inicio - fin
 *
 * El margen existe porque la boca empieza a articular ~0.2s ANTES de que entre
 * el audio. Sin el, el clip abre con la boca ya en movimiento.
 */
export function analizarBordes(archivo, opciones = {}) {
  const umbralDb = opciones.umbralDb ?? RECORTE_BORDES.umbralDb;
  const duracionMinimaS = opciones.duracionMinimaS ?? RECORTE_BORDES.duracionMinimaS;
  const margenS = (opciones.margenMs ?? RECORTE_BORDES.margenMs) / 1000;

  const duracion = duracionDe(archivo);
  const texto = tramosDeSilencio(archivo, umbralDb, duracionMinimaS);

  const tramos = [];
  const re = /silence_start:\s*(-?[\d.]+)|silence_end:\s*([\d.]+)/g;
  let abierto = null;
  let m;
  while ((m = re.exec(texto)) !== null) {
    if (m[1] !== undefined) abierto = Math.max(0, Number(m[1]));
    else if (abierto !== null) {
      tramos.push({ desde: abierto, hasta: Number(m[2]) });
      abierto = null;
    }
  }
  // Un silencio que sigue abierto al final del archivo llega hasta el final.
  if (abierto !== null) tramos.push({ desde: abierto, hasta: duracion });

  const EPS = 0.05; // tolerancia para decidir si un tramo "toca" el borde
  const primero = tramos[0];
  const ultimo = tramos[tramos.length - 1];

  const tocaInicio = primero && primero.desde <= EPS;
  const tocaFin = ultimo && ultimo.hasta >= duracion - EPS;

  let inicio = tocaInicio ? Math.max(0, primero.hasta - margenS) : 0;
  let fin = tocaFin ? Math.max(0, duracion - ultimo.desde - margenS) : 0;

  // Si el clip fuera todo silencio, no se recorta nada: algo esta mal y es
  // mejor que se vea el clip entero a entregar un bloque de cero segundos.
  if (duracion - inicio - fin <= 0.5) {
    inicio = 0;
    fin = 0;
  }

  const interiores = tramos.filter(
    (x) => !(x.desde <= EPS) && !(x.hasta >= duracion - EPS)
  );

  return {
    archivo,
    duracion: Number(duracion.toFixed(3)),
    inicio: Number(inicio.toFixed(3)),
    fin: Number(fin.toFixed(3)),
    util: Number((duracion - inicio - fin).toFixed(3)),
    tramos,
    interiores, // se informan, NUNCA se recortan
    umbralDb,
    duracionMinimaS,
    margenMs: opciones.margenMs ?? RECORTE_BORDES.margenMs,
  };
}
