// Nivel de la voz en off — deja la voz de ElevenLabs al nivel del anuncio
// aprobado, solo en los estilos que tienen ese nivel fijado (hoy estilo-lego).
//
//   node produccion/nivelar-voz.js temp/mi-anuncio
//   node produccion/nivelar-voz.js temp/mi-anuncio --solo-medir     no escribe nada
//
// generar-audio.js lo llama solo, despues de escribir tiempos.json, y tambien
// cuando la voz ya existe (sin --rehacer). Este CLI hace lo mismo sin pasar por
// generar-audio.js: anuncios que ya tienen su voz, o reintentar si el control fallo.
//
// POR QUE EXISTE. ElevenLabs entrega cada voz a su propio nivel. En el segundo
// anuncio Lego (temp/lymphatic-drainage-lego-2/) la voz de Roger llego unos
// 13 dB por debajo de lo que se aprobo de oido el 2026-10-05, y se subio a
// mano con ffmpeg. Aca se hace lo mismo pero midiendo, para que cualquier voz
// nueva quede donde quedo la aprobada sin afinar nada a oido.
//
// COMO MIDE. RMS del habla: solo las muestras que caen dentro de los caracteres
// que no son espacio del alineamiento de ElevenLabs (audio/tiempos.json). Los
// silencios entre frases no cuentan, asi una voz con mas pausas no sale "mas
// baja". Sin alineamiento se usa una compuerta (ventanas de 20 ms por encima de
// -50 dBFS) y se avisa.
//
// COMO SUBE. volume + alimiter, la misma receta de la voz aprobada. El limitador
// se come un poco de la ganancia, asi que se mide la salida y se corrige hasta
// quedar a 0.1 dB del objetivo.
//
// ARCHIVOS. audio/voz-original.mp3 es la voz tal como la entrego ElevenLabs y
// no se toca: siempre se nivela DESDE ella, nunca desde una voz ya nivelada (eso
// la subiria dos veces). audio/voz.mp3 es la nivelada, la que usa el montaje.
// audio/nivelacion.json guarda lo que se hizo y el md5 de las dos. Si voz.mp3 ya
// no coincide con ese md5 (se regenero con npm run audio -- --rehacer), esa voz
// nueva pasa a ser el original. tiempos.json no se toca: la nivelacion no mueve
// ni una muestra, y eso se comprueba antes de dar la voz por buena.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';

/**
 * Nivel del habla al que queda la voz, por estilo. Un estilo que no esta aca no
 * pasa por este modulo: su voz queda como la entrega ElevenLabs.
 *
 * estilo-lego: -13.31 = RMS del habla de temp/lymphatic-drainage-lego-2/audio/
 * voz.mp3, medido con medirHabla() de este archivo (Roger salio de ElevenLabs
 * en -23.56). Ese anuncio se aprobo de oido el 2026-10-05: la voz era
 * voz-original-roger.mp3 + 13 dB con el limitador de abajo, y en el MP4 final
 * medido a mono 8 kHz daba -13.6.
 *
 * compuertaDb es la misma voz aprobada medida con la compuerta, para cuando no
 * hay alineamiento: da 0.2 dB mas porque la compuerta deja afuera los bordes
 * mas bajos de cada palabra. Cada medicion se compara con su propio objetivo.
 */
export const NIVEL_VOZ_POR_ESTILO = {
  'estilo-lego': { objetivoDb: -13.31, compuertaDb: -13.1 },
};

// La receta con la que se subio la voz aprobada. limit=0.84 deja los picos
// 1.5 dB por debajo de 0 dBFS; level=0 apaga el auto-nivel del limitador (si
// no, lleva todo al techo por su cuenta); latency=1 compensa su lookahead: sin
// eso la voz sale 219 muestras (5 ms) corrida y se desfasa de tiempos.json
// (probado: el control de abajo lo frena).
const LIMITADOR = 'alimiter=limit=0.84:attack=5:release=60:level=0:latency=1';
const BITRATE = '192k';

const TASA = 44100; // se mide siempre a 44.1 kHz mono, sea cual sea el archivo
const TOLERANCIA_DB = 0.1;
const MAX_RONDAS = 4;
// Una voz que necesita mas que esto viene rota o casi muda: se sube hasta aca
// y se avisa, en vez de amplificar ruido.
const GANANCIA_MAX_DB = 24;
// Cuanto del habla se puede comer el limitador antes de avisar. En la voz
// aprobada se comio 2.75 dB (de +13 pedidos llegaron +10.25) y sono bien.
const LIMITADOR_FUERTE_DB = 4;
const COMPUERTA = { ventanaS: 0.02, umbralDb: -50 };

// Control de que la voz nivelada no se corrio: mismas muestras que el original
// y desfase 0 en varias ventanas con voz, buscando hasta +-2000 muestras.
const CONTROL = { ventana: 4096, rango: 2000, ventanas: 8, minimoDb: -45 };
// Ni una muestra de diferencia. Medido el 2026-10-05: la voz de lego-2 y 15
// pruebas mas (largos impares, 16 a 48 kHz) decodifican exactamente igual que su
// original, porque libmp3lame deja el retardo y el relleno en el encabezado y
// ffmpeg los recorta al leer. Si aparece una diferencia, algo cambio de verdad.
const TOLERANCIA_MUESTRAS = 0;

const ARCHIVOS = {
  voz: 'voz.mp3',
  original: 'voz-original.mp3',
  registro: 'nivelacion.json',
  tiempos: 'tiempos.json',
};

const db = (x) => (x > 0 ? 10 * Math.log10(x) : -Infinity); // de potencia media a dB
const r2 = (x) => Number(x.toFixed(2));
const conSigno = (x) => `${x >= 0 ? '+' : ''}${x.toFixed(1)}`;
const md5 = (ruta) => crypto.createHash('md5').update(fs.readFileSync(ruta)).digest('hex');

/**
 * Decodifica a mono 44.1 kHz float. El pipe trae los bytes crudos; se copian a
 * un ArrayBuffer propio porque el Buffer de Node no siempre empieza alineado a 4.
 */
function decodificar(ruta) {
  const r = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-loglevel', 'error', '-i', ruta, '-vn', '-ac', '1', '-ar', String(TASA), '-f', 'f32le', 'pipe:1'],
    { maxBuffer: 1024 * 1024 * 1024 }
  );
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`ffmpeg no pudo leer ${path.basename(ruta)}: ${String(r.stderr).trim().slice(0, 300)}`);
  const b = r.stdout;
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length - (b.length % 4)));
}

/** Frecuencia de muestreo del archivo: la salida se escribe a la misma. */
function tasaDe(ruta) {
  return Number(
    execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate', '-of', 'csv=p=0', ruta], {
      encoding: 'utf8',
    }).trim()
  );
}

/** Tramos [desde, hasta) en muestras de los caracteres que no son espacio, unidos. */
function tramosDeHabla(alignment) {
  const chars = alignment.characters || [];
  const inicios = alignment.character_start_times_seconds || [];
  const fines = alignment.character_end_times_seconds || [];
  const sueltos = [];
  for (let i = 0; i < chars.length; i++) {
    if (!chars[i] || !chars[i].trim()) continue;
    const a = Math.round(inicios[i] * TASA);
    const b = Math.round(fines[i] * TASA);
    if (b > a) sueltos.push([a, b]);
  }
  sueltos.sort((x, y) => x[0] - y[0]);
  const tramos = [];
  for (const [a, b] of sueltos) {
    const ultimo = tramos.at(-1);
    if (ultimo && a <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], b);
    else tramos.push([a, b]);
  }
  return tramos;
}

function rmsEnTramosDb(muestras, tramos) {
  let suma = 0;
  let n = 0;
  for (const [a, b] of tramos) {
    const hasta = Math.min(b, muestras.length);
    for (let i = Math.max(0, a); i < hasta; i++) suma += muestras[i] * muestras[i];
    n += Math.max(0, hasta - Math.max(0, a));
  }
  return n ? db(suma / n) : -Infinity;
}

function rmsConCompuertaDb(muestras) {
  const w = Math.round(COMPUERTA.ventanaS * TASA);
  const umbral = 10 ** (COMPUERTA.umbralDb / 10) * w;
  let suma = 0;
  let n = 0;
  for (let p = 0; p + w <= muestras.length; p += w) {
    let e = 0;
    for (let i = p; i < p + w; i++) e += muestras[i] * muestras[i];
    if (e > umbral) {
      suma += e;
      n += w;
    }
  }
  return n ? db(suma / n) : -Infinity;
}

/**
 * RMS del habla en dBFS (20·log10 del RMS; un seno a fondo de escala da -3).
 * Recibe la ruta o las muestras ya decodificadas. Sin alineamiento usa la
 * compuerta. Devuelve { db, metodo: 'alineamiento' | 'compuerta' }.
 */
export function medirHabla(rutaOMuestras, alignment = null) {
  const muestras = typeof rutaOMuestras === 'string' ? decodificar(rutaOMuestras) : rutaOMuestras;
  const tramos = alignment ? tramosDeHabla(alignment) : [];
  if (tramos.length) return { db: rmsEnTramosDb(muestras, tramos), metodo: 'alineamiento' };
  return { db: rmsConCompuertaDb(muestras), metodo: 'compuerta' };
}

/**
 * Desfase entre la salida y el original en varias ventanas con voz (la de mas
 * energia de cada octavo del archivo). Correlacion normalizada por la energia
 * de la ventana de la salida: asi el maximo cae en 0 aunque la salida este
 * subida de nivel. Supone las dos de igual largo (se controla antes).
 */
function desfases(original, salida) {
  const { ventana: W, rango: R, ventanas: N, minimoDb } = CONTROL;
  const util = original.length - W - 2 * R;
  const res = [];
  if (util <= 0) return res;

  for (let k = 0; k < N; k++) {
    const desde = R + Math.floor((util * k) / N);
    const hasta = R + Math.floor((util * (k + 1)) / N);
    let p = -1;
    let eMax = 0;
    for (let q = desde; q <= hasta; q += 1024) {
      let e = 0;
      for (let i = q; i < q + W; i++) e += original[i] * original[i];
      if (e > eMax) {
        eMax = e;
        p = q;
      }
    }
    if (p < 0 || db(eMax / W) < minimoDb) continue; // ese octavo es silencio

    let eSal = 0;
    for (let i = p - R; i < p - R + W; i++) eSal += salida[i] * salida[i];
    let mejor = -Infinity;
    let lagMejor = 0;
    for (let lag = -R; lag <= R; lag++) {
      if (lag > -R) {
        const sale = salida[p + lag - 1];
        const entra = salida[p + lag + W - 1];
        eSal += entra * entra - sale * sale;
      }
      let c = 0;
      for (let i = 0; i < W; i++) c += original[p + i] * salida[p + lag + i];
      const v = eSal > 0 ? c / Math.sqrt(eSal) : -Infinity;
      if (v > mejor) {
        mejor = v;
        lagMejor = lag;
      }
    }
    res.push(lagMejor);
  }
  return res;
}

function aplicar(origen, gananciaDb, destino, tasa) {
  const r = spawnSync(
    'ffmpeg',
    [
      '-hide_banner', '-loglevel', 'error', '-y', '-i', origen, '-vn',
      '-af', `volume=${gananciaDb.toFixed(2)}dB,${LIMITADOR}`,
      '-c:a', 'libmp3lame', '-b:a', BITRATE, '-ar', String(tasa), destino,
    ],
    { encoding: 'utf8' }
  );
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`ffmpeg no pudo nivelar la voz: ${String(r.stderr).trim().slice(0, 300)}`);
}

function leerJson(ruta) {
  if (!fs.existsSync(ruta)) return null;
  try {
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch {
    return null;
  }
}

/** El nivel fijado para el estilo, o null si el estilo no tiene. */
export function nivelDeVoz(estilo) {
  return (estilo && Object.hasOwn(NIVEL_VOZ_POR_ESTILO, estilo) && NIVEL_VOZ_POR_ESTILO[estilo]) || null;
}

/**
 * Nivela audio/voz.mp3 de la carpeta del anuncio.
 *
 * opciones:
 *   estilo     si no viene, se lee del manifiesto
 *   alignment  el de ElevenLabs; si no viene se lee de tiempos.json, y con null
 *              se mide con compuerta (generar-audio.js lo pasa en null cuando
 *              ElevenLabs no devolvio tiempos: el tiempos.json que haya es viejo)
 *
 * Devuelve { estado, estilo, objetivoDb, antesDb, despuesDb, gananciaDb, rondas,
 * metodo, limitadorDb, avisos }. estado es 'sin-nivel' (el estilo no tiene),
 * 'ya-nivelada' (no se toco nada), 'sin-cambios' (ya estaba en el objetivo) o
 * 'nivelada'. Si el control falla, deja voz.mp3 como estaba y lanza error.
 */
export function nivelarVoz(carpeta, opciones = {}) {
  let estilo = opciones.estilo;
  if (estilo === undefined) {
    const manifiesto = leerJson(path.join(carpeta, 'manifiesto.json'));
    if (!manifiesto) throw new Error(`No encuentro o no puedo leer ${path.join(carpeta, 'manifiesto.json')}`);
    estilo = manifiesto.estilo;
  }
  const nivel = nivelDeVoz(estilo);
  if (!nivel) return { estado: 'sin-nivel', estilo, avisos: [] };

  const objetivoPara = (metodo) => (metodo === 'compuerta' ? nivel.compuertaDb ?? nivel.objetivoDb : nivel.objetivoDb);
  const dirAudio = path.join(carpeta, 'audio');
  const rutaVoz = path.join(dirAudio, ARCHIVOS.voz);
  const rutaOriginal = path.join(dirAudio, ARCHIVOS.original);
  const rutaRegistro = path.join(dirAudio, ARCHIVOS.registro);
  const avisos = [];

  // 1. Cual es el original. La regla: voz.mp3 solo se toma como original si NO
  //    es la salida de una nivelacion anterior (su md5 no es el del registro).
  const md5Voz = fs.existsSync(rutaVoz) ? md5(rutaVoz) : null;
  const registro = leerJson(rutaRegistro);
  const vozEsLaNivelada = Boolean(md5Voz && registro?.salida?.md5 === md5Voz);
  let origen;

  if (!fs.existsSync(rutaOriginal)) {
    if (!md5Voz) throw new Error(`No hay voz en ${dirAudio}: falta ${ARCHIVOS.voz}. Genera primero la voz (npm run audio).`);
    if (vozEsLaNivelada) {
      throw new Error(
        `${ARCHIVOS.voz} ya esta nivelada (nivelacion.json) y falta ${ARCHIVOS.original}. ` +
          'No se nivela una voz ya nivelada: devuelve el original a su lugar o regenera la voz.'
      );
    }
    fs.copyFileSync(rutaVoz, rutaOriginal);
    origen = `${ARCHIVOS.voz} pasa a ser ${ARCHIVOS.original} (primera nivelacion)`;
  } else if (md5Voz && !vozEsLaNivelada && md5Voz !== md5(rutaOriginal)) {
    fs.copyFileSync(rutaVoz, rutaOriginal);
    origen = `${ARCHIVOS.voz} cambio desde la ultima nivelacion (voz regenerada): pasa a ser el nuevo ${ARCHIVOS.original}`;
  } else {
    origen = `se nivela desde ${ARCHIVOS.original}`;
  }
  const md5Original = md5(rutaOriginal);

  // 2. Si voz.mp3 ya es la salida de este mismo original a este mismo objetivo,
  //    no hay nada que hacer.
  if (vozEsLaNivelada && registro.original?.md5 === md5Original && registro.objetivoDb === objetivoPara(registro.metodo)) {
    return {
      estado: 'ya-nivelada',
      estilo,
      objetivoDb: registro.objetivoDb,
      antesDb: registro.antesDb,
      despuesDb: registro.despuesDb,
      gananciaDb: registro.gananciaDb,
      rondas: 0,
      metodo: registro.metodo,
      limitadorDb: registro.limitadorDb,
      avisos,
    };
  }

  // 3. Medir el original.
  let alignment = opciones.alignment;
  if (alignment === undefined) alignment = leerJson(path.join(dirAudio, ARCHIVOS.tiempos))?.alignment || null;
  const original = decodificar(rutaOriginal);
  if (alignment) {
    const finAlin = (alignment.character_end_times_seconds || []).reduce((m, t) => Math.max(m, t), 0);
    const durVoz = original.length / TASA;
    if (finAlin > durVoz + 0.5) {
      avisos.push(`el alineamiento de tiempos.json dura ${finAlin.toFixed(1)}s y la voz ${durVoz.toFixed(1)}s: no es de esta voz, se mide con compuerta`);
      alignment = null;
    }
  }
  const antes = medirHabla(original, alignment);
  if (antes.metodo === 'compuerta' && !avisos.length) {
    avisos.push('sin alineamiento de ElevenLabs: el habla se mide con compuerta (-50 dBFS), menos exacta');
  }
  if (!Number.isFinite(antes.db)) throw new Error(`${ARCHIVOS.original} no tiene voz que medir (silencio).`);
  const objetivoDb = objetivoPara(antes.metodo);

  const base = {
    estilo,
    objetivoDb,
    antesDb: r2(antes.db),
    metodo: antes.metodo,
    origen,
    avisos,
  };
  const escribirRegistro = (extra) =>
    fs.writeFileSync(
      rutaRegistro,
      JSON.stringify(
        {
          generado: new Date().toISOString(),
          estilo,
          objetivoDb,
          metodo: antes.metodo,
          antesDb: r2(antes.db),
          ...extra,
          original: { archivo: `audio/${ARCHIVOS.original}`, md5: md5Original },
          salida: { archivo: `audio/${ARCHIVOS.voz}`, md5: md5(rutaVoz) },
        },
        null,
        2
      ) + '\n',
      'utf8'
    );

  // 4. Ya esta en el objetivo: voz.mp3 queda igual al original, sin recodificar.
  if (Math.abs(objetivoDb - antes.db) <= TOLERANCIA_DB) {
    if (md5Voz !== md5Original) fs.copyFileSync(rutaOriginal, rutaVoz);
    escribirRegistro({ despuesDb: r2(antes.db), gananciaDb: 0, rondas: 0, limitadorDb: 0, filtro: null });
    return { ...base, estado: 'sin-cambios', despuesDb: r2(antes.db), gananciaDb: 0, rondas: 0, limitadorDb: 0 };
  }

  // 5. Subir, medir, corregir. La primera ronda pide justo lo que falta. Las
  //    siguientes corrigen con la pendiente entre las dos ultimas mediciones:
  //    cerca del objetivo el limitador deja pasar ~0.4 dB por cada dB pedido
  //    (medido en la voz aprobada), y sumar el error tal cual no llega en 4
  //    rondas. Cada ronda va a su propio temporal y se queda la mas cercana.
  const tasa = tasaDe(rutaOriginal);
  const tope = (g) => Math.min(g, GANANCIA_MAX_DB);
  const temporales = [];
  let mejor = null;
  let anterior = { ganancia: 0, db: antes.db };
  let ganancia = tope(objetivoDb - antes.db);
  if (ganancia < objetivoDb - antes.db) {
    avisos.push(`la voz original esta muy baja (${antes.db.toFixed(1)} dB): la ganancia se topa en +${GANANCIA_MAX_DB} dB`);
  }

  try {
    let rondas = 0;
    for (let ronda = 1; ronda <= MAX_RONDAS; ronda++) {
      const tmp = path.join(dirAudio, `.voz-nivelando-${ronda}.mp3`);
      temporales.push(tmp);
      aplicar(rutaOriginal, ganancia, tmp, tasa);
      const medido = medirHabla(decodificar(tmp), alignment).db;
      rondas = ronda;
      if (!mejor || Math.abs(objetivoDb - medido) < Math.abs(objetivoDb - mejor.db)) mejor = { tmp, ganancia, db: medido };
      const error = objetivoDb - medido;
      if (Math.abs(error) <= TOLERANCIA_DB) break;
      // Pendiente acotada: si dos mediciones casi no se mueven, no se dispara.
      const pendiente = Math.min(1, Math.max(0.1, (medido - anterior.db) / (ganancia - anterior.ganancia || 1)));
      const siguiente = tope(ganancia + error / pendiente);
      if (Math.abs(siguiente - ganancia) < 0.005) break; // topada: no hay mas que subir
      anterior = { ganancia, db: medido };
      ganancia = siguiente;
    }
    if (Math.abs(objetivoDb - mejor.db) > TOLERANCIA_DB) {
      avisos.push(`quedo en ${mejor.db.toFixed(2)} dB, a ${Math.abs(objetivoDb - mejor.db).toFixed(2)} dB del objetivo despues de ${rondas} rondas`);
    }
    // Lo que el limitador le quito al habla: la ganancia pedida menos la que llego.
    const limitadorDb = antes.db + mejor.ganancia - mejor.db;
    if (limitadorDb > LIMITADOR_FUERTE_DB) {
      avisos.push(
        `el limitador le quito ${limitadorDb.toFixed(1)} dB al habla: la voz original tiene picos muy por encima de su nivel, escuchala por si suena aplastada`
      );
    }

    // 6. Controlar la nivelada ANTES de reemplazar voz.mp3: si no pasa, voz.mp3
    // queda como estaba. Recien despues se reemplaza y se escribe el registro,
    // seguidos, para que un corte en el medio no deje un voz.mp3 sin registro
    // (la corrida siguiente lo tomaria por una voz nueva y pisaria el original).
    let salida;
    let lags;
    try {
      salida = decodificar(mejor.tmp);
      if (Math.abs(salida.length - original.length) > TOLERANCIA_MUESTRAS) {
        throw new Error(`la voz nivelada tiene ${salida.length} muestras y el original ${original.length}`);
      }
      lags = desfases(original, salida);
      if (lags.length < 3) throw new Error(`solo ${lags.length} ventanas con voz para comparar contra el original`);
      if (lags.some((l) => l !== 0)) {
        throw new Error(`la voz nivelada quedo corrida respecto del original (desfases ${lags.join(', ')} muestras)`);
      }
    } catch (e) {
      throw new Error(`${e.message}. Se dejo ${ARCHIVOS.voz} como estaba; tiempos.json no se toco.`);
    }

    fs.renameSync(mejor.tmp, rutaVoz);
    escribirRegistro({
      despuesDb: r2(mejor.db),
      gananciaDb: r2(mejor.ganancia),
      rondas,
      limitadorDb: r2(limitadorDb),
      filtro: `volume=${mejor.ganancia.toFixed(2)}dB,${LIMITADOR}`,
      control: { muestras: salida.length, desfases: lags },
    });
    return {
      ...base,
      estado: 'nivelada',
      despuesDb: r2(mejor.db),
      gananciaDb: r2(mejor.ganancia),
      rondas,
      limitadorDb: r2(limitadorDb),
    };
  } finally {
    for (const t of temporales) fs.rmSync(t, { force: true });
  }
}

/** Una linea con el resultado, para generar-audio.js y el CLI. */
export function lineaDeNivel(r) {
  const compuerta = r.metodo === 'compuerta' ? ', medida con compuerta' : '';
  if (r.estado === 'sin-nivel') return `el estilo "${r.estilo}" no tiene nivel de voz fijo: la voz queda como la entrego ElevenLabs`;
  if (r.estado === 'ya-nivelada') {
    return `ya estaba nivelada a ${r.despuesDb} dB (objetivo ${r.objetivoDb}, ${conSigno(r.gananciaDb)} dB desde el original): no se toco nada`;
  }
  if (r.estado === 'sin-cambios') {
    return `la voz ya estaba en ${r.despuesDb} dB (objetivo ${r.objetivoDb}${compuerta}): no hizo falta subirla`;
  }
  return `voz a ${r.despuesDb} dB de habla (objetivo ${r.objetivoDb}, ${conSigno(r.gananciaDb)} dB desde ${r.antesDb}${compuerta}); original en audio/${ARCHIVOS.original}`;
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('nivelar-voz.js')) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  const soloMedir = args.includes('--solo-medir');

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/nivelar-voz.js <carpeta-del-anuncio> [--solo-medir]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const manifiesto = leerJson(path.join(carpeta, 'manifiesto.json'));
  if (!manifiesto) {
    console.error(`\n  No encuentro o no puedo leer el manifiesto: ${path.join(carpeta, 'manifiesto.json')}\n`);
    process.exit(1);
  }

  console.log(`\n=== Nivel de la voz — ${path.basename(carpeta)} ===\n`);
  const nivel = nivelDeVoz(manifiesto.estilo);

  if (soloMedir) {
    const dirAudio = path.join(carpeta, 'audio');
    const alignment = leerJson(path.join(dirAudio, ARCHIVOS.tiempos))?.alignment || null;
    for (const nombre of [ARCHIVOS.voz, ARCHIVOS.original]) {
      const ruta = path.join(dirAudio, nombre);
      if (!fs.existsSync(ruta)) continue;
      const m = medirHabla(ruta, alignment);
      console.log(`  ${nombre.padEnd(18)} ${m.db.toFixed(2)} dB de habla (${m.metodo})`);
    }
    console.log(
      nivel
        ? `\n  Objetivo de ${manifiesto.estilo}: ${nivel.objetivoDb} dB (con compuerta ${nivel.compuertaDb ?? nivel.objetivoDb})`
        : `\n  El estilo "${manifiesto.estilo}" no tiene nivel de voz fijo.`
    );
    console.log('  No se escribio nada.\n');
    process.exit(0);
  }

  if (!nivel) {
    console.log(`  El estilo "${manifiesto.estilo}" no tiene nivel de voz fijo: no se toca nada.\n`);
    process.exit(0);
  }

  try {
    const r = nivelarVoz(carpeta, { estilo: manifiesto.estilo });
    if (r.origen) console.log(`  Original:   ${r.origen}`);
    console.log(`  Nivel:      ${lineaDeNivel(r)}`);
    if (r.rondas) console.log(`              ${r.rondas} ronda(s), el limitador se llevo ${r.limitadorDb} dB del habla`);
    for (const a of r.avisos) console.log(`  !  ${a}`);
    console.log('');
  } catch (e) {
    console.error(`\n  ERROR: ${e.message}\n`);
    process.exit(1);
  }
}
