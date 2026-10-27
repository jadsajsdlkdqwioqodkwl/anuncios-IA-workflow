// FLOW — recibe lo que Claude descargo de Google Flow y lo deja donde lo espera el motor.
//
//   npm run flow:recibir -- temp/mi-anuncio                      mueve, convierte y verifica
//   npm run flow:recibir -- temp/mi-anuncio --solo-ver           solo muestra que encontraria (no mueve nada)
//   npm run flow:recibir -- temp/mi-anuncio --desde <carpeta>    busca las descargas en otra carpeta
//   npm run flow:recibir -- temp/mi-anuncio --respaldo toma-3,broll-2
//                                    esos salieron del modelo de respaldo de Flow (se anota en el log)
//   npm run flow:recibir -- temp/mi-anuncio --rehacer            reemplaza lo que ya estaba (lo viejo va a historial/)
//
// Lee flow/cola-imagenes.json y flow/cola-videos.json (las arman npm run
// imagenes y npm run videos; ver produccion/flow/flow.js) y, por cada trabajo,
// busca en la carpeta de descargas (rutaDescargas() o --desde) el archivo cuyo
// nombre sin extension es exactamente "descarga". Tambien lo acepta si ya esta
// en <carpeta>/flow/descargas/. Chrome numera los repetidos ("nombre (1).jpg"):
// se usa el mas nuevo y se avisa. La extension separa la imagen del video que
// comparten nombre (el B-roll: broll-2.png y broll-2.mp4 descargan los dos
// como "<slug>__broll-2").
//
// Imagenes: se convierten al formato del destino (img/*.png) con ffmpeg, sin
// cambiar el tamano; si la proporcion no se parece a la pedida, aviso. Los
// iconos (fondo "verde") se piden sobre verde croma y aca se les quita el
// fondo (ver quitarVerde), se les tapan los huecos semitransparentes y se mide
// la transparencia, igual que hace generar-imagenes.js con los de kie.ai
// (taparHuecosIcono y medirTransparencia, importadas de ahi).
//
// Videos: ffprobe. Se rechaza el que no trae imagen, el que dura menos de lo
// que necesita el montaje (duracion_pedida - 0,1 s), el de continuidad
// ("exacta") que no dura su duracion +-0,1 s y el que habla y llego sin audio.
// El largo se mide en cuadros / fps (medirClip de continuidad.js), como lo
// mide el montaje. Un B-roll "sin_sonido" sale con el audio cambiado por
// silencio (48 kHz estereo, aac) y el video copiado sin recodificar; todo lo
// demas se MUEVE tal cual: varios pasos comparan bytes y cuadros. Una toma
// hablada (H) saca lo que venia del clip anterior (sacarDerivadosDeTomaH de
// generar-videos.js, igual que al generarla con kie.ai) y al final se dice con
// que tomas correr npm run lineas.
//
// Si el destino ya existe no se toca (salvo --rehacer: lo anterior va a
// historial/ con archivarSiExiste). Lo descargado, una vez colocado, va a
// <carpeta>/flow/descargas/recibidos/ (un video que se movio tal cual YA es el
// archivo final: no queda otra copia); lo rechazado a flow/descargas/rechazados/
// y los repetidos de Chrome que no se usaron a flow/descargas/duplicados/. Lo
// suelto en flow/descargas/ (fuera de esas subcarpetas) es lo que alguien
// movio ahi antes de recibirlo y se toma como una descarga mas. Lo ya recibido
// nunca vuelve a su lugar: si el motor archivo un archivo para rehacerlo
// (--rehacer al armar la cola), figura como "falta" hasta que llegue la
// descarga nueva. Mientras una descarga sigue a medias (.crdownload) no se usa
// ninguna otra para ese trabajo. Nunca se borra nada del usuario.
//
// Al final se fusiona por id en img/log-modelos.json ("imagenes") y en
// video/log-modelos.json ("clips"), con la forma que ya leen
// revisar-videos.js, planear-montaje.js y plan-para-humanos.js (archivo
// relativo a img/ o video/, modelo, respaldo; transparente en los iconos). Las
// entradas de otros ids no se tocan.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { cargarEnv } from './config.js';
import { DIR_FLOW, PROVEEDOR, leerCola, rutaCola, rutaDescargas, slugDe, nombreDescarga } from './flow/flow.js';
import { archivarSiExiste } from './historial.js';
import { medirClip } from './continuidad.js';
import { medirTransparencia, taparHuecosIcono } from './generar-imagenes.js';
import { sacarDerivadosDeTomaH, entradaQuitada } from './generar-videos.js';

const EXT_IMAGEN = ['.jpg', '.jpeg', '.png', '.webp'];
const EXT_VIDEO = ['.mp4', '.m4v', '.mov'];
/** Chrome (y otros navegadores) mientras todavia esta bajando el archivo. */
const EXT_PARCIAL = ['.crdownload', '.part', '.download'];
/** Subcarpeta de flow/descargas/ con los originales ya recibidos (no se vuelven a buscar ahi). */
const SUB_RECIBIDOS = 'recibidos';

/** Segundos de margen en el largo de un clip (duracion_pedida y "exacta"). */
const TOLERANCIA_DURACION = 0.1;
/** Diferencia relativa de proporcion (ancho/alto) que se tolera sin avisar. 768x1376 contra 9:16 da 0,8 %. */
const TOLERANCIA_PROPORCION = 0.03;
/** Lado largo por debajo del cual una imagen pedida a 2K se ve como 1K (1K = 1376, 2K = 2752 en 9:16). */
const LADO_MINIMO_2K = 1800;

/**
 * Iconos sobre verde croma. Medido con tres iconos fabricados en JPG 4:2:0
 * como los de Flow (1024x1024): un circulo rojo con contorno blanco grueso,
 * una hoja verde oscuro (34,139,34) y un bloque amarillo, sobre #00FF00 con
 * vinieta; el mismo sobre un verde mas oscuro y con tinte (20,235->190,45); y un
 * anillo con el agujero del centro mostrando el fondo.
 *
 *  - El color a quitar es el del BORDE de la imagen (mediana del contorno),
 *    no #00FF00 fijo: el modelo pinta "verde croma" con su propio tono y con
 *    vinieta (salio #00f100 y #14d12c). Si el borde no es claramente verde
 *    (G - max(R,B) < verdeMinimo), no se quita nada y se avisa: el icono va
 *    en tarjeta blanca, como uno de kie.ai sin transparencia.
 *  - ffmpeg colorkey (RGB; chromakey en YUV deja un verde oscuro de la figura
 *    casi a la misma distancia del fondo que el blanco del contorno) con
 *    similitud 0,15 y mezcla 0,10: el fondo queda 100 % transparente en los
 *    tres, aun con la vinieta. Con 0,20 la hoja ya se transparentaba.
 *  - Lo que el colorkey transparenta DENTRO de la figura vuelve a opaco
 *    (restaurarInterior) salvo que sea un agujero de verdad (al menos
 *    huecoMinimo de sus pixeles del todo transparentes): con el fondo oscuro
 *    la hoja quedaba gris y semitransparente (9.196 px); asi queda intacta, y
 *    el agujero del anillo sigue transparente.
 *  - Despill SOLO en el borde (despillDelBorde): el filtro despill de ffmpeg
 *    sobre toda la imagen dejaba la hoja gris (32,32,33) y el amarillo
 *    naranja (253,126,0). Aca, a menos de bordePx pixeles de un pixel no
 *    opaco, el verde que sobra (G - max(R,B)) se le suma a R y B: el borde
 *    verdoso del contorno blanco queda blanco (restandolo quedaba gris). Sin
 *    despill el borde tenia ~2.700 pixeles verdosos (exceso de verde hasta
 *    208); con el, ninguno por encima de 20 (maximo 14).
 */
const CROMA = { similitud: 0.15, mezcla: 0.1, bordePx: 3, verdeMinimo: 60, huecoMinimo: 0.1 };

// ---------------------------------------------------------------- utilidades

/** Marca de tiempo apta para nombre de archivo (la misma forma que historial.js). */
const sello = () => new Date().toISOString().slice(0, 19).replace(/:/g, '-');

const aPosix = (p) => p.split(path.sep).join('/');

/** Ruta para mostrar: relativa a donde se corrio el comando si queda mas corta. */
function mostrar(ruta) {
  const rel = path.relative(process.cwd(), ruta);
  return rel && !rel.startsWith('..') && rel.length < ruta.length ? rel : ruta;
}

/** Temporal al lado del destino, con la misma extension (ffmpeg elige el formato por ella). */
const rutaTemporal = (destino) =>
  path.join(path.dirname(destino), `.${path.basename(destino, path.extname(destino))}.flow-recibir.tmp${path.extname(destino)}`);

/** Primera ruta libre en `dir` para "<base><ext>" (si esta ocupada, con fecha y despues con -2, -3...). */
function rutaLibre(dir, base, ext) {
  let ruta = path.join(dir, `${base}${ext}`);
  if (!fs.existsSync(ruta)) return ruta;
  const s = sello();
  ruta = path.join(dir, `${base}--${s}${ext}`);
  for (let i = 2; fs.existsSync(ruta); i++) ruta = path.join(dir, `${base}--${s}-${i}${ext}`);
  return ruta;
}

/**
 * Mueve un archivo. Entre discos (Descargas en C:, el proyecto en D:) rename
 * no puede: se copia al lado del destino con su fecha, se renombra y recien
 * entonces se quita el original (sigue siendo mover, nunca queda a medias).
 */
function moverArchivo(origen, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  try {
    fs.renameSync(origen, destino);
    return destino;
  } catch (e) {
    if (e.code !== 'EXDEV') throw e;
  }
  const tmp = rutaTemporal(destino);
  const st = fs.statSync(origen);
  fs.copyFileSync(origen, tmp);
  fs.utimesSync(tmp, st.atime, st.mtime);
  fs.renameSync(tmp, destino);
  try {
    fs.rmSync(origen);
  } catch {
    // Bloqueado (el navegador, un antivirus): el destino ya esta entero y el
    // original queda donde estaba; la proxima vuelta lo muestra como "ya estaba".
  }
  return destino;
}

/** Ultima linea util de un error de ffmpeg/ffprobe. */
function detalleDeError(e) {
  return String(e?.stderr || e?.message || e || '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-1)[0]
    ?.slice(0, 200) || 'error desconocido';
}

/** ffprobe de streams y formato. Lanza si no lo puede leer. */
function sondear(ruta) {
  const salida = execFileSync(
    'ffprobe',
    [
      '-v', 'error',
      '-show_entries', 'stream=index,codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels,duration',
      '-show_entries', 'format=duration',
      '-of', 'json',
      ruta,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
  const j = JSON.parse(salida);
  return { streams: Array.isArray(j.streams) ? j.streams : [], formato: j.format || {} };
}

const fraccion = (x) => {
  const [a, b] = String(x ?? '').split('/').map(Number);
  return a > 0 && b > 0 ? a / b : null;
};

/** "9:16" -> 0.5625; null si no se entiende. */
function proporcionDe(texto) {
  const m = String(texto || '').match(/^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/);
  return m && Number(m[2]) > 0 ? Number(m[1]) / Number(m[2]) : null;
}

/** Aviso si ancho/alto no se parece a la proporcion pedida; null si se parece (o no se pidio). */
function avisoDeProporcion(ancho, alto, pedida) {
  const p = proporcionDe(pedida);
  if (!p || !ancho || !alto) return null;
  const real = ancho / alto;
  if (Math.abs(real - p) / p <= TOLERANCIA_PROPORCION) return null;
  return `llego en ${ancho}x${alto} (proporcion ${real.toFixed(3)}) y se pidio ${pedida} (${p.toFixed(3)}): revisa que se eligio la proporcion correcta en Flow`;
}

// ---------------------------------------------------------------- descargas

/**
 * Los archivos (no carpetas) de `dir`, con su nombre desarmado:
 *   "slug__toma-3-inicial (2).jpg" -> base "slug__toma-3-inicial", ext ".jpg", copia 2
 *   "slug__toma-4.mp4.crdownload"  -> base "slug__toma-4", ext ".mp4", parcial
 */
function listarDescargas(dir, origen) {
  if (!dir || !fs.existsSync(dir)) return [];
  const salida = [];
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!d.isFile()) continue;
    const ruta = path.join(dir, d.name);
    let resto = d.name;
    const extParcial = path.extname(resto).toLowerCase();
    const parcial = EXT_PARCIAL.includes(extParcial);
    if (parcial) resto = resto.slice(0, -extParcial.length);
    const ext = path.extname(resto).toLowerCase();
    const sinExt = resto.slice(0, resto.length - ext.length);
    const m = sinExt.match(/^(.*?) \((\d+)\)$/);
    const base = m ? m[1] : sinExt;
    let mtimeMs = 0;
    try {
      mtimeMs = fs.statSync(ruta).mtimeMs;
    } catch {
      continue; // se fue mientras se listaba
    }
    salida.push({ nombre: d.name, ruta, base, clave: base.toLowerCase(), ext, copia: m ? Number(m[2]) : null, parcial, mtimeMs, origen });
  }
  return salida;
}

const extensionesDe = (trabajo) => (trabajo.clase === 'video' ? EXT_VIDEO : EXT_IMAGEN);
const esDe = (f, clave, exts) => !f.parcial && f.clave === clave && exts.includes(f.ext);
/** Mas nuevo primero; a igual fecha, el de numero de copia mas alto (Chrome numera hacia arriba). */
const masNuevoPrimero = (a, b) => b.mtimeMs - a.mtimeMs || (b.copia ?? 0) - (a.copia ?? 0);

/**
 * La descarga que corresponde a un trabajo. Primero la carpeta de descargas;
 * si ahi no esta, lo suelto en <carpeta>/flow/descargas/ (alguien la movio
 * ahi antes de recibirla), solo si el destino todavia no existe o, con
 * --rehacer, si es mas nueva que el destino. Lo ya recibido esta en
 * flow/descargas/recibidos/ y no se mira: cuando el motor archiva un destino
 * para rehacerlo, la descarga vieja no vuelve a su lugar.
 *
 * Una descarga a medias (.crdownload) mas nueva que la ultima completa es la
 * que se esta bajando ahora: hasta que termine no se usa ninguna otra (ni una
 * completa mas vieja ni lo de flow/descargas/) y se devuelve en `enCurso`. Una
 * a medias mas vieja que la completa (quedo de un corte) va en `parcialVieja`.
 */
function buscarDescarga(trabajo, { enDescargas, enFlow }, { destinoExiste, mtimeDestino, rehacer }) {
  const clave = String(trabajo.descarga || '').toLowerCase();
  const exts = extensionesDe(trabajo);
  const deDescargas = enDescargas.filter((f) => esDe(f, clave, exts)).sort(masNuevoPrimero);
  const parciales = enDescargas.filter((f) => f.parcial && f.clave === clave && exts.includes(f.ext)).sort(masNuevoPrimero);
  if (parciales.length && (!deDescargas.length || parciales[0].mtimeMs >= deDescargas[0].mtimeMs)) {
    return { elegida: null, otras: [], enCurso: parciales[0], parcialVieja: null };
  }
  if (deDescargas.length) {
    return { elegida: deDescargas[0], otras: deDescargas.slice(1), enCurso: null, parcialVieja: parciales[0] || null };
  }
  const deFlow = enFlow
    .filter((f) => esDe(f, clave, exts))
    .filter((f) => !destinoExiste || (rehacer && f.mtimeMs > mtimeDestino + 1000))
    .sort(masNuevoPrimero);
  return { elegida: deFlow[0] || null, otras: [], enCurso: null, parcialVieja: null };
}

/**
 * Deja la descarga en flow/descargas/<sub>. En recibidos/ va con su nombre
 * limpio (sin el " (1)" de Chrome) y, si ya habia uno con ese nombre (una
 * vuelta anterior), ese se renombra con la fecha: el de nombre exacto es
 * siempre el ultimo. En rechazados/ y duplicados/ va con su nombre tal cual.
 */
function guardarDescarga(f, ctx, sub) {
  const dir = path.join(ctx.dirDescargasFlow, sub);
  fs.mkdirSync(dir, { recursive: true });
  if (sub !== SUB_RECIBIDOS) {
    if (path.resolve(path.dirname(f.ruta)) === path.resolve(dir)) return f.ruta;
    const ext = path.extname(f.nombre);
    return moverArchivo(f.ruta, rutaLibre(dir, path.basename(f.nombre, ext), ext));
  }
  const destino = path.join(dir, `${f.base}${f.ext}`);
  if (path.resolve(f.ruta) === path.resolve(destino)) return destino;
  if (fs.existsSync(destino)) moverArchivo(destino, rutaLibre(dir, `${f.base}--${sello()}`, f.ext));
  return moverArchivo(f.ruta, destino);
}

/**
 * guardarDescarga cuando el archivo final ya esta en su lugar: si no se puede
 * mover la descarga (bloqueada, sin permiso), no se pierde lo recibido ni su
 * entrada del log; se avisa y la descarga queda donde estaba.
 */
function guardarSinFallar(f, ctx, avisos, sub = SUB_RECIBIDOS) {
  try {
    return guardarDescarga(f, ctx, sub);
  } catch (e) {
    avisos.push(`no pude mover ${f.nombre} a flow/descargas/${sub}/ (${e.message}): quedo donde estaba`);
    return null;
  }
}

// ---------------------------------------------------------------- imagenes

/** Ancho y alto de una imagen. Lanza si ffprobe no la puede leer. */
function medirImagen(ruta) {
  const { streams } = sondear(ruta);
  const v = streams.find((s) => s.codec_type === 'video');
  if (!v || !(v.width > 0) || !(v.height > 0)) throw new Error('ffprobe no encuentra una imagen adentro');
  return { ancho: v.width, alto: v.height };
}

/** Convierte (o copia, si ya tiene el formato del destino) a `salida`, sin cambiar el tamano. */
function convertirImagen(origen, salida) {
  const mismo = (e) => (e === '.jpeg' ? '.jpg' : e);
  if (mismo(path.extname(origen).toLowerCase()) === mismo(path.extname(salida).toLowerCase())) {
    fs.copyFileSync(origen, salida);
    return;
  }
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', origen, '-frames:v', '1', salida], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
}

/**
 * Color del fondo de un icono: la mediana del contorno de la imagen reducida
 * a 64x64 (cada pixel del contorno es el promedio de los 16x16 del borde).
 * verde = el fondo es claramente verde croma.
 */
export function colorDeFondo(ruta) {
  const N = 64;
  const raw = execFileSync(
    'ffmpeg',
    ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', ruta, '-frames:v', '1', '-vf', `scale=${N}:${N}:flags=area,format=rgb24`, '-f', 'rawvideo', '-'],
    { maxBuffer: N * N * 3 + 4096, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  const canales = [[], [], []];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (x !== 0 && y !== 0 && x !== N - 1 && y !== N - 1) continue;
      const i = (y * N + x) * 3;
      for (let c = 0; c < 3; c++) canales[c].push(raw[i + c]);
    }
  }
  const [r, g, b] = canales.map((v) => v.sort((a, z) => a - z)[v.length >> 1]);
  const hex = [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  return { r, g, b, hex, verde: g - Math.max(r, b) >= CROMA.verdeMinimo };
}

/**
 * Lo que el colorkey hizo transparente DENTRO de la figura (no conectado con
 * el borde de la imagen) vuelve a ser opaco, salvo que sea un agujero de
 * verdad (un anillo, el asa de una taza: al menos huecoMinimo de sus pixeles
 * del todo transparentes, porque ahi se ve el fondo tal cual). Asi una hoja
 * verde oscuro o un limon dentro del contorno no se transparentan aunque su
 * color quede cerca del verde del fondo. Cambia `px` (rgba crudo) en el lugar.
 */
function restaurarInterior(px, W, H) {
  const N = W * H;
  const noOpaco = (i) => px[i * 4 + 3] < 255;
  const marca = new Uint8Array(N); // 1 = fondo (conectado con el borde), 2 = interior ya visto
  const pila = new Int32Array(N);
  let tope = 0;
  const recorrer = (valor, alVisitar) => {
    while (tope) {
      const i = pila[--tope];
      alVisitar?.(i);
      const x = i % W;
      const y = (i - x) / W;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const k = ny * W + nx;
          if (!marca[k] && noOpaco(k)) {
            marca[k] = valor;
            pila[tope++] = k;
          }
        }
      }
    }
  };
  const sembrar = (i) => {
    if (!marca[i] && noOpaco(i)) {
      marca[i] = 1;
      pila[tope++] = i;
    }
  };
  for (let x = 0; x < W; x++) {
    sembrar(x);
    sembrar((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    sembrar(y * W);
    sembrar(y * W + W - 1);
  }
  recorrer(1);

  let restaurados = 0;
  for (let i = 0; i < N; i++) {
    if (marca[i] || !noOpaco(i)) continue;
    const region = [];
    let vacios = 0;
    marca[i] = 2;
    pila[tope++] = i;
    recorrer(2, (j) => {
      region.push(j);
      if (px[j * 4 + 3] === 0) vacios++;
    });
    if (vacios / region.length >= CROMA.huecoMinimo) continue; // agujero de verdad: se ve el fondo
    for (const j of region) px[j * 4 + 3] = 255;
    restaurados += region.length;
  }
  return restaurados;
}

/**
 * Despill solo en el borde: a menos de bordePx pixeles de un pixel no opaco
 * (el alfa erosionado con un cuadrado de 2*bordePx+1), el verde que sobra
 * (G - max(R,B)) se le suma a R y B. El contorno blanco que quedo verdoso
 * vuelve a blanco; lejos del borde los colores no se tocan. Cambia `px`.
 */
function despillDelBorde(px, W, H) {
  const r = CROMA.bordePx;
  const fila = new Uint8Array(W * H);
  const minimo = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let m = 255;
      for (let k = Math.max(0, x - r); k <= Math.min(W - 1, x + r) && m > 0; k++) m = Math.min(m, px[(y * W + k) * 4 + 3]);
      fila[y * W + x] = m;
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let m = 255;
      for (let k = Math.max(0, y - r); k <= Math.min(H - 1, y + r) && m > 0; k++) m = Math.min(m, fila[k * W + x]);
      minimo[y * W + x] = m;
    }
  }
  for (let i = 0; i < W * H; i++) {
    if (minimo[i] === 255) continue;
    const o = i * 4;
    const sobra = px[o + 1] - Math.max(px[o], px[o + 2]);
    if (sobra <= 0) continue;
    px[o] = Math.min(255, px[o] + sobra);
    px[o + 2] = Math.min(255, px[o + 2] + sobra);
  }
}

/**
 * Quita el fondo verde de un icono (ver CROMA arriba) y escribe un PNG rgba
 * del mismo tamano en `salida`:
 *   1. ffmpeg colorkey con el color del fondo -> alfa (los colores no cambian);
 *   2. lo transparente dentro de la figura que no es un agujero vuelve a opaco;
 *   3. despill solo en el borde;
 *   4. ffmpeg lo guarda como PNG.
 * Devuelve cuantos pixeles se restauraron en el paso 2.
 */
export function quitarVerde(origen, salida, fondo, { ancho, alto }) {
  const px = execFileSync(
    'ffmpeg',
    [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', origen, '-frames:v', '1',
      '-vf', `format=rgba,colorkey=0x${fondo.hex}:${CROMA.similitud}:${CROMA.mezcla}`,
      '-f', 'rawvideo', '-pix_fmt', 'rgba', '-',
    ],
    { maxBuffer: ancho * alto * 4 + 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  if (px.length !== ancho * alto * 4) throw new Error(`ffmpeg devolvio ${px.length} bytes y esperaba ${ancho * alto * 4}`);
  const restaurados = restaurarInterior(px, ancho, alto);
  despillDelBorde(px, ancho, alto);
  execFileSync(
    'ffmpeg',
    ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${ancho}x${alto}`, '-i', '-', '-frames:v', '1', salida],
    { input: px, stdio: ['pipe', 'ignore', 'pipe'] }
  );
  return restaurados;
}

/** Campos de img/log-modelos.json de un icono (los mismos que escribe generar-imagenes.js). */
function camposDeIcono(huecos, transparencia) {
  return {
    ...(huecos
      ? {
          huecosTapados: huecos.huecosTapados,
          ...(huecos.sinTapar ? { sinTapar: huecos.sinTapar, huecosRegiones: huecos.regiones } : {}),
          ...(huecos.respetadas?.length ? { huecosRespetados: huecos.respetadas } : {}),
          ...(huecos.error ? { huecosError: huecos.error } : {}),
        }
      : {}),
    ...(transparencia
      ? {
          transparente: transparencia.transparente,
          alfaMinimo: transparencia.alfaMinimo,
          ...(transparencia.error ? { transparenciaError: transparencia.error } : {}),
        }
      : {}),
  };
}

/** Lo que se dice de un icono en su linea "OK". */
function textoDeIcono(x) {
  const partes = [];
  if (x.fondoQuitado) partes.push(`fondo verde #${x.colorFondo} quitado`);
  else partes.push(`OJO: el fondo no es verde croma (#${x.colorFondo}): no se quito`);
  partes.push(x.transparente ? 'transparente' : 'SIN transparencia real: ira en tarjeta blanca');
  if (x.huecosTapados === null) partes.push('no pude revisar los huecos');
  else if (x.huecosTapados > 0) partes.push(`${x.huecosTapados} px de huecos tapados (sin tapar en ${x.sinTapar})`);
  if ((x.huecosRespetados || []).some((h) => h.motivo === 'grande')) partes.push('OJO: zona translucida grande sin tapar, miralo');
  return `[${partes.join('; ')}]`;
}

function procesarImagen(trabajo, f, ctx) {
  const destino = path.join(ctx.carpeta, trabajo.archivo);
  const avisos = [];
  let medida;
  try {
    medida = medirImagen(f.ruta);
  } catch (e) {
    return { estado: 'rechazado', motivo: `no es una imagen que se pueda leer (${detalleDeError(e)})` };
  }
  const proporcion = avisoDeProporcion(medida.ancho, medida.alto, trabajo.proporcion);
  if (proporcion) avisos.push(proporcion);
  if (trabajo.calidad_descarga === '2K' && Math.max(medida.ancho, medida.alto) < LADO_MINIMO_2K) {
    avisos.push(`se pidio descargar en 2K y llego en ${medida.ancho}x${medida.alto} (parece 1K)`);
  }
  const icono = trabajo.fondo === 'verde';
  let fondo = null;
  if (icono) {
    try {
      fondo = colorDeFondo(f.ruta);
    } catch (e) {
      return { estado: 'rechazado', motivo: `no pude leer el fondo del icono (${detalleDeError(e)})` };
    }
  }
  const detalle = `${medida.ancho}x${medida.alto}`;
  if (ctx.soloVer) {
    const extra = icono ? (fondo.verde ? `  [se le quitaria el fondo verde #${fondo.hex}]` : `  [OJO: el fondo no es verde croma (#${fondo.hex})]`) : '';
    return { estado: 'recibido', detalle: `${detalle}${extra}`, avisos };
  }

  // Primero el archivo nuevo, completo, en un temporal al lado del destino;
  // recien despues se archiva el viejo (--rehacer) y se pone en su lugar.
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const tmp = rutaTemporal(destino);
  let restaurados = 0;
  try {
    if (icono && fondo.verde) restaurados = quitarVerde(f.ruta, tmp, fondo, medida);
    else convertirImagen(f.ruta, tmp);
    const salida = medirImagen(tmp);
    if (salida.ancho !== medida.ancho || salida.alto !== medida.alto) {
      throw new Error(`la conversion cambio el tamano (${medida.ancho}x${medida.alto} -> ${salida.ancho}x${salida.alto})`);
    }
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    return { estado: 'rechazado', motivo: `no pude convertirla a ${path.extname(destino)} (${detalleDeError(e)})` };
  }
  const archivado = ctx.rehacer ? archivarSiExiste(destino, ctx.carpeta) : null;
  fs.renameSync(tmp, destino);

  // Icono: como en generar-imagenes.js, primero se tapan los huecos
  // semitransparentes de adentro de la figura y despues se mide si la
  // transparencia es real. Ninguna de las dos lanza.
  const huecos = icono ? taparHuecosIcono(destino, ctx.carpeta) : null;
  const transparencia = icono ? medirTransparencia(destino) : null;
  const guardada = guardarSinFallar(f, ctx, avisos);

  const respaldo = ctx.respaldo.has(trabajo.id);
  const entrada = {
    id: trabajo.id,
    archivo: aPosix(path.relative(ctx.dirImg, destino)),
    modelo: `${PROVEEDOR}:${(respaldo ? trabajo.respaldo : trabajo.modelo) || 'desconocido'}`,
    proveedor: PROVEEDOR,
    respaldo,
    creditos: 0,
    recibido: new Date().toISOString(),
    ...(guardada ? { descarga: aPosix(path.relative(ctx.carpeta, guardada)) } : {}),
    ancho: medida.ancho,
    alto: medida.alto,
    ...(trabajo.calidad_descarga ? { calidad: trabajo.calidad_descarga } : {}),
    ...(icono ? { fondoQuitado: fondo.verde, colorFondo: fondo.hex, ...(restaurados ? { interiorRestaurado: restaurados } : {}) } : {}),
    ...camposDeIcono(huecos, transparencia),
  };
  return {
    estado: 'recibido',
    detalle: `${detalle}${icono ? `  ${textoDeIcono(entrada)}` : ''}`,
    avisos,
    archivado,
    entrada,
    icono,
  };
}

// ---------------------------------------------------------------- videos

/** Tipo del clip para el log, como lo escribe generar-videos.js. null si no se puede saber. */
function tipoDeClip(id, manifiesto) {
  const s = String(id);
  const m = s.match(/^toma-(\d+)$/);
  if (m) return (manifiesto?.tomas || []).find((t) => t.n === Number(m[1]))?.tipo ?? null;
  if (/^paso-\d+$/.test(s)) return 'paso';
  if (/^broll-\d+$/.test(s)) return 'broll';
  if (/^gancho-/.test(s)) return 'R';
  return null;
}

/** Cambia el audio por silencio (48 kHz estereo, aac) copiando el video tal cual. */
function silenciarVideo(origen, salida, segundos) {
  execFileSync(
    'ffmpeg',
    [
      '-y', '-hide_banner', '-loglevel', 'error', '-nostdin',
      '-i', origen,
      '-f', 'lavfi', '-t', String(Math.ceil(segundos * 1000) / 1000), '-i', 'anullsrc=r=48000:cl=stereo',
      '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
      '-shortest', '-map_metadata', '0', '-movflags', '+faststart',
      salida,
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );
}

/** Pasa a .mp4 sin recodificar (Flow da .mp4; esto es por si llega otro contenedor). */
function remuxarVideo(origen, salida) {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-nostdin', '-i', origen, '-map', '0', '-c', 'copy', '-movflags', '+faststart', salida], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
}

function procesarVideo(trabajo, f, ctx) {
  const destino = path.join(ctx.carpeta, trabajo.archivo);
  const avisos = [];
  let sonda;
  let medida;
  try {
    sonda = sondear(f.ruta);
  } catch (e) {
    return { estado: 'rechazado', motivo: `no se puede leer como video (ffprobe: ${detalleDeError(e)})` };
  }
  const v = sonda.streams.find((s) => s.codec_type === 'video');
  if (!v) return { estado: 'rechazado', motivo: 'no trae imagen (el archivo no tiene stream de video)' };
  const conAudio = sonda.streams.some((s) => s.codec_type === 'audio');
  try {
    medida = medirClip(f.ruta);
  } catch (e) {
    return { estado: 'rechazado', motivo: `no pude medir su largo (ffprobe: ${detalleDeError(e)})` };
  }
  const seg = medida.segundos;
  if (!Number.isFinite(seg) || seg <= 0) return { estado: 'rechazado', motivo: 'no pude medir su largo (ffprobe no da cuadros ni duracion)' };

  const pedida = Number(trabajo.duracion_pedida);
  if (trabajo.duracion_pedida != null && Number.isFinite(pedida) && seg < pedida - TOLERANCIA_DURACION) {
    return {
      estado: 'rechazado',
      motivo: `dura ${seg.toFixed(2)} s y el montaje necesita al menos ${pedida} s${trabajo.duracion ? ` (en Flow va con ${trabajo.duracion} s: revisa la duracion elegida)` : ''}`,
    };
  }
  if (trabajo.exacta && Number.isFinite(Number(trabajo.duracion)) && Math.abs(seg - Number(trabajo.duracion)) > TOLERANCIA_DURACION) {
    return {
      estado: 'rechazado',
      motivo: `continuidad: tiene que durar ${trabajo.duracion} s (+-${TOLERANCIA_DURACION}) y dura ${seg.toFixed(2)} s (${medida.frames ?? '?'} cuadros)`,
    };
  }
  if (trabajo.habla && !conAudio) {
    return { estado: 'rechazado', motivo: 'es un clip con dialogo y llego SIN audio: vuelve a descargarlo (o a generarlo) con sonido' };
  }

  const fps = fraccion(v.r_frame_rate);
  const proporcion = avisoDeProporcion(v.width, v.height, trabajo.proporcion);
  if (proporcion) avisos.push(proporcion);
  if (trabajo.calidad_descarga === '720p' && Math.min(v.width, v.height) !== 720) {
    avisos.push(`se pidio descargar en 720p y llego en ${v.width}x${v.height}`);
  }
  if (fps && Math.abs(fps - 24) > 0.01) avisos.push(`va a ${Number(fps.toFixed(3))} fps (Flow da 24)`);
  if (!trabajo.exacta && Number.isFinite(Number(trabajo.duracion)) && seg > Number(trabajo.duracion) + 0.5) {
    avisos.push(`dura ${seg.toFixed(2)} s y en Flow iba con ${trabajo.duracion} s (sirve: el montaje lo recorta)`);
  }
  if (trabajo.habla && trabajo.sin_sonido) avisos.push('la cola lo pide con dialogo Y sin sonido: no le quito el audio');
  const silenciar = Boolean(trabajo.sin_sonido) && !trabajo.habla;
  const remuxar = f.ext !== path.extname(destino).toLowerCase();

  const detalle = `${v.width}x${v.height}, ${seg.toFixed(2)} s${medida.frames ? ` (${medida.frames} cuadros)` : ''}${conAudio ? '' : ', sin audio'}`;
  if (ctx.soloVer) return { estado: 'recibido', detalle: `${detalle}${silenciar ? '  [se le pondria audio en silencio]' : ''}`, avisos };

  // Sin silencio ni cambio de contenedor, el archivo se mueve tal cual. Si no,
  // se arma completo en un temporal y se comprueba que el video sea el mismo.
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  let tmp = null;
  if (silenciar || remuxar) {
    tmp = rutaTemporal(destino);
    try {
      if (silenciar) silenciarVideo(f.ruta, tmp, seg);
      else remuxarVideo(f.ruta, tmp);
      const otra = medirClip(tmp);
      if (medida.frames && otra.frames !== medida.frames) throw new Error(`cambio la cantidad de cuadros (${medida.frames} -> ${otra.frames})`);
      if (silenciar && !sondear(tmp).streams.some((s) => s.codec_type === 'audio')) throw new Error('quedo sin pista de audio');
    } catch (e) {
      fs.rmSync(tmp, { force: true });
      return { estado: 'rechazado', motivo: `no pude ${silenciar ? 'ponerle audio en silencio' : 'pasarlo a .mp4'} sin recodificar (${detalleDeError(e)})` };
    }
  }

  const tipo = tipoDeClip(trabajo.id, ctx.manifiesto);
  const nToma = tipo === 'H' ? Number(String(trabajo.id).match(/^toma-(\d+)$/)?.[1]) : NaN;
  const archivado = ctx.rehacer ? archivarSiExiste(destino, ctx.carpeta) : null;
  let guardada = null;
  if (tmp) {
    fs.renameSync(tmp, destino);
    guardada = guardarSinFallar(f, ctx, avisos);
  } else {
    moverArchivo(f.ruta, destino);
  }
  // Toma hablada: lo que se saco del clip anterior (original de la voz, host
  // recortado, su medida en lineas-habladas.json) ya no vale para este.
  let sacados = [];
  if (Number.isInteger(nToma)) {
    try {
      sacados = sacarDerivadosDeTomaH(ctx.carpeta, nToma);
    } catch (e) {
      avisos.push(`no pude sacar lo que venia del clip anterior (${e.message}): revisa video/originales/, recorte.json y lineas-habladas.json`);
    }
  }

  const final = tmp ? medirClip(destino) : medida;
  const respaldo = ctx.respaldo.has(trabajo.id);
  const entrada = {
    id: trabajo.id,
    archivo: aPosix(path.relative(ctx.dirVideo, destino)),
    modelo: `${PROVEEDOR}:${(respaldo ? trabajo.respaldo : trabajo.modelo) || 'desconocido'}`,
    proveedor: PROVEEDOR,
    respaldo,
    creditos: 0,
    recibido: new Date().toISOString(),
    ...(tipo ? { tipo } : {}),
    ...(tipo === 'H' && trabajo.modo === 'ingredientes' ? { porIngredientes: true } : {}),
    segundosUtiles: Number(final.segundos.toFixed(3)),
    segundosPedidos: trabajo.duracion ?? null,
    ...(trabajo.duracion_pedida != null ? { segundosNecesarios: trabajo.duracion_pedida } : {}),
    resolucion: `${Math.min(v.width, v.height)}p`,
    frameFinal: Boolean(trabajo.frame_final),
    ...(trabajo.exacta ? { exacta: true } : {}),
    ...(silenciar ? { sinSonido: true } : {}),
    ...(tipo === 'paso' && trabajo.frame_inicial ? { desde: path.basename(trabajo.frame_inicial) } : {}),
    ...(tipo === 'paso' && trabajo.frame_final ? { hasta: path.basename(trabajo.frame_final) } : {}),
    ...(guardada ? { descarga: aPosix(path.relative(ctx.carpeta, guardada)) } : {}),
  };
  return {
    estado: 'recibido',
    detalle: `${detalle}${silenciar ? '  [audio cambiado por silencio]' : ''}`,
    avisos,
    archivado,
    sacados,
    nToma: Number.isInteger(nToma) ? nToma : null,
    entrada,
  };
}

// ---------------------------------------------------------------- logs

/**
 * Fusiona `entradas` en <dir>/log-modelos.json bajo `clave` ("imagenes" o
 * "clips"): la entrada con el mismo id (o el mismo archivo) se reemplaza en
 * su lugar y las nuevas van al final. Todo lo demas del archivo queda igual.
 * Si no existe se crea con la forma de siempre ({ generado, <clave>: [...] });
 * si esta roto se archiva en historial/ y se empieza uno nuevo.
 */
function fusionarLog(dir, clave, entradas, carpeta) {
  if (!entradas.length) return null;
  const ruta = path.join(dir, 'log-modelos.json');
  let registro = null;
  let archivadoRoto = null;
  if (fs.existsSync(ruta)) {
    try {
      registro = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    } catch {
      registro = null;
    }
    if (!registro || typeof registro !== 'object' || Array.isArray(registro)) {
      archivadoRoto = archivarSiExiste(ruta, carpeta);
      registro = null;
    }
  }
  if (!registro) registro = { generado: new Date().toISOString(), [clave]: [] };
  if (!Array.isArray(registro[clave])) registro[clave] = [];
  const lista = registro[clave];
  for (const e of entradas) {
    const i = lista.findIndex((x) => x && (x.id === e.id || x.archivo === e.archivo));
    if (i === -1) {
      lista.push(e);
      continue;
    }
    lista[i] = e;
    // Si habia mas de una con ese id o archivo, queda una sola.
    for (let j = lista.length - 1; j > i; j--) if (lista[j] && (lista[j].id === e.id || lista[j].archivo === e.archivo)) lista.splice(j, 1);
  }
  registro.actualizado = new Date().toISOString();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ruta, JSON.stringify(registro, null, 2) + '\n', 'utf8');
  return { ruta, archivadoRoto };
}

// ---------------------------------------------------------------- principal

function leerManifiesto(carpeta) {
  try {
    return JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Recibe lo descargado de Flow para un anuncio. Devuelve el resumen (y lo
 * imprime con `decir`). Lanza solo por errores reales (carpeta que no existe,
 * una cola ilegible, un archivo que no se puede mover); lo que llego mal es un
 * "rechazado" y no frena nada.
 *
 * Opciones: desde (carpeta de descargas), respaldo (ids), rehacer, soloVer,
 * carpetaArg (como se escribio la carpeta, para los comandos que se sugieren).
 */
export function recibirDeFlow(carpetaEntrada, { desde = null, respaldo = [], rehacer = false, soloVer = false, carpetaArg = null, decir = console.log } = {}) {
  const carpeta = path.resolve(carpetaEntrada);
  const cArg = carpetaArg || mostrar(carpeta);
  if (!fs.existsSync(carpeta) || !fs.statSync(carpeta).isDirectory()) throw new Error(`No encuentro la carpeta del anuncio: ${carpeta}`);

  const colas = [];
  for (const tipo of ['imagenes', 'videos']) {
    let cola;
    try {
      cola = leerCola(carpeta, tipo);
    } catch (e) {
      throw new Error(`No puedo leer ${mostrar(rutaCola(carpeta, tipo))}: ${e.message}`);
    }
    if (!cola) continue;
    // "descarga" la escribe la cola; si faltara, es la de nombreDescarga.
    const trabajos = (Array.isArray(cola.trabajos) ? cola.trabajos : []).map((t) => ({ ...t, descarga: t.descarga || nombreDescarga(carpeta, t.archivo) }));
    colas.push({ tipo, cola, trabajos, bloqueados: Array.isArray(cola.bloqueados) ? cola.bloqueados : [] });
  }
  if (!colas.length) {
    const err = new Error(
      `No hay ninguna cola de Flow en ${mostrar(path.join(carpeta, DIR_FLOW))}.\n` +
        `  Primero hay que armarla:  npm run imagenes -- ${cArg}   (o  npm run videos -- ${cArg})\n` +
        '  y generar en Google Flow lo que diga. Despues, este comando recibe las descargas.'
    );
    err.sinCola = true;
    throw err;
  }

  const dirDescargas = path.resolve(desde || rutaDescargas());
  if (desde && !fs.existsSync(dirDescargas)) throw new Error(`No existe la carpeta de descargas que pasaste con --desde: ${dirDescargas}`);
  const dirDescargasFlow = path.join(carpeta, DIR_FLOW, 'descargas');
  const mismaCarpeta = path.resolve(dirDescargas) === path.resolve(dirDescargasFlow);
  const enDescargas = listarDescargas(dirDescargas, 'descargas');
  const enFlow = mismaCarpeta ? [] : listarDescargas(dirDescargasFlow, 'flow');

  const ctx = {
    carpeta,
    dirImg: path.join(carpeta, 'img'),
    dirVideo: path.join(carpeta, 'video'),
    dirDescargasFlow,
    rehacer,
    soloVer,
    respaldo: new Set(respaldo),
    manifiesto: leerManifiesto(carpeta),
  };
  const slug = slugDe(carpeta);

  decir(`\n=== Recibir de Google Flow — ${path.basename(carpeta)}${soloVer ? ' (solo ver: no se mueve nada)' : ''} ===\n`);
  decir(`  Descargas: ${dirDescargas}${fs.existsSync(dirDescargas) ? '' : '  (NO EXISTE)'}`);
  if (!mismaCarpeta) decir(`  y lo que ya este en ${mostrar(dirDescargasFlow)}`);
  if (rehacer) decir('  --rehacer: lo que ya estaba se reemplaza (lo anterior va a historial/).');

  const resumen = { recibidos: [], yaEstaban: [], faltan: [], rechazados: [], errores: [], avisos: [], iconos: [], tomasH: [] };
  const conocidos = new Set(); // "clave|clase" de todos los trabajos, para las descargas sueltas
  const idsEnCola = new Set();

  for (const { tipo, cola, trabajos, bloqueados } of colas) {
    const etiqueta = tipo === 'videos' ? 'Videos' : 'Imagenes';
    decir(`\n  ${etiqueta}: ${trabajos.length} en la cola${bloqueados.length ? `, ${bloqueados.length} esperando a otros archivos` : ''}  (${mostrar(rutaCola(carpeta, tipo))}, ${cola.generado || 'sin fecha'})`);
    if (cola.anuncio && cola.anuncio !== slug) {
      resumen.avisos.push(`la cola de ${tipo} se armo para "${cola.anuncio}" y esta carpeta es "${slug}": vuelve a correr npm run ${tipo} -- ${cArg}`);
    }
    const entradasLog = [];
    for (const t of trabajos) {
      idsEnCola.add(t.id);
      const clase = t.clase === 'video' ? 'video' : 'imagen';
      conocidos.add(`${String(t.descarga || '').toLowerCase()}|${clase}`);
      const destino = path.join(carpeta, t.archivo);
      const rel = aPosix(t.archivo);
      const destinoExiste = fs.existsSync(destino);
      const mtimeDestino = destinoExiste ? fs.statSync(destino).mtimeMs : 0;
      const { elegida, otras, enCurso, parcialVieja } = buscarDescarga(t, { enDescargas, enFlow }, { destinoExiste, mtimeDestino, rehacer });

      if (!elegida) {
        if (destinoExiste) {
          resumen.yaEstaban.push(rel);
          decir(`    YA  ${rel}  ya estaba${enCurso ? ` (se esta descargando ${enCurso.nombre}: cuando termine, para usarla en su lugar: --rehacer)` : ''}`);
        } else {
          resumen.faltan.push({ archivo: rel, descarga: t.descarga, tipo, descargando: Boolean(enCurso) });
          decir(`    --  ${rel}  falta: ${enCurso ? `todavia se esta descargando (${enCurso.nombre}); cuando termine, vuelve a correr` : `descargar como "${t.descarga}"`}`);
        }
        continue;
      }
      if (parcialVieja) {
        resumen.avisos.push(`${rel}: hay una descarga a medias mas vieja que ${elegida.nombre} (${parcialVieja.nombre}, quedo de un corte?); use la completa`);
      }
      if (destinoExiste && !rehacer) {
        resumen.yaEstaban.push(rel);
        decir(`    YA  ${rel}  ya estaba: no lo toque (hay una descarga, ${elegida.nombre}; para usarla en su lugar: --rehacer)`);
        continue;
      }
      if (otras.length) {
        resumen.avisos.push(`${rel}: habia ${otras.length + 1} descargas con ese nombre (${[elegida, ...otras].map((o) => o.nombre).join(', ')}); use la mas nueva, ${elegida.nombre}${soloVer ? '' : ', y las otras van a flow/descargas/duplicados/'}`);
      }

      let r;
      try {
        r = clase === 'video' ? procesarVideo(t, elegida, ctx) : procesarImagen(t, elegida, ctx);
      } catch (e) {
        // Error real (mover, escribir): la descarga queda donde estaba.
        resumen.errores.push(`${rel}: ${e.message}`);
        decir(`    !!  ${rel}  ERROR: ${e.message}  (la descarga quedo en ${mostrar(elegida.ruta)})`);
        continue;
      }
      for (const a of r.avisos || []) resumen.avisos.push(`${rel}: ${a}`);

      if (r.estado === 'rechazado') {
        let donde = mostrar(elegida.ruta);
        if (!soloVer) {
          const movida = guardarSinFallar(elegida, ctx, resumen.avisos, 'rechazados');
          if (movida) donde = mostrar(movida);
        }
        resumen.rechazados.push({ archivo: rel, motivo: r.motivo, descarga: donde, tipo });
        decir(`    NO  ${rel}  ${soloVer ? 'se rechazaria' : 'RECHAZADO'}: ${r.motivo}${soloVer ? '' : `  (la descarga quedo en ${donde})`}`);
      } else {
        // --respaldo en un trabajo al que la cola no le da modelo de respaldo
        // (ej. tomas H por ingredientes, bloques R): igual en imagenes y videos.
        if (ctx.respaldo.has(t.id) && !t.respaldo) {
          resumen.avisos.push(
            `--respaldo ${t.id}: la cola no le da modelo de respaldo; ${soloVer ? 'se anotaria' : 'se anoto'} respaldo: true con modelo "${PROVEEDOR}:desconocido"`
          );
        }
        resumen.recibidos.push({ archivo: rel, tipo, id: t.id });
        decir(`    ${soloVer ? '->' : 'OK'}  ${rel}  ${soloVer ? 'se recibiria ' : ''}<- ${elegida.nombre}${elegida.origen === 'flow' ? ' (de flow/descargas/)' : ''}  ${r.detalle}`);
        if (r.archivado) decir(`        (lo anterior quedo en historial/${path.basename(r.archivado)})`);
        const deHistorial = (r.sacados || []).filter((s) => s !== entradaQuitada('recorte.json', r.nToma) && s !== entradaQuitada('lineas-habladas.json', r.nToma));
        if (deHistorial.length) decir(`        (lo que salio del clip anterior quedo en historial/: ${deHistorial.join(', ')})`);
        if ((r.sacados || []).length > deHistorial.length) decir('        (su recorte y su medida eran del clip anterior: se quitaron de recorte.json / lineas-habladas.json)');
        if (r.entrada) entradasLog.push(r.entrada);
        if (r.icono) resumen.iconos.push(r.entrada);
        if (r.nToma != null) resumen.tomasH.push(r.nToma);
      }
      if (!soloVer) for (const o of otras) guardarSinFallar(o, ctx, resumen.avisos, 'duplicados');
    }

    // Lo que todavia espera a otros archivos: si ya llego, se hizo antes de tiempo.
    for (const b of bloqueados) {
      const clave = nombreDescarga(carpeta, b.archivo).toLowerCase();
      const exts = /\.(mp4|m4v|mov)$/i.test(b.archivo) ? EXT_VIDEO : EXT_IMAGEN;
      conocidos.add(`${clave}|${exts === EXT_VIDEO ? 'video' : 'imagen'}`);
      const llego = enDescargas.find((f) => esDe(f, clave, exts));
      if (llego) {
        resumen.avisos.push(
          `${aPosix(b.archivo)}: llego ${llego.nombre} pero ese trabajo todavia espera a ${(b.espera || []).join(', ') || 'otros archivos'}; no lo uso. Corre npm run ${tipo} -- ${cArg} y despues recibe otra vez`
        );
      }
    }

    if (!soloVer && entradasLog.length) {
      const dir = tipo === 'videos' ? ctx.dirVideo : ctx.dirImg;
      const hecho = fusionarLog(dir, tipo === 'videos' ? 'clips' : 'imagenes', entradasLog, carpeta);
      if (hecho?.archivadoRoto) resumen.avisos.push(`${mostrar(hecho.ruta)} estaba roto: quedo en historial/${path.basename(hecho.archivadoRoto)} y empece uno nuevo`);
    }
  }

  for (const id of ctx.respaldo) if (!idsEnCola.has(id)) resumen.avisos.push(`--respaldo ${id}: no hay ningun trabajo con ese id en las colas`);

  // Descargas con el nombre de este anuncio que no son de ningun trabajo (un
  // nombre mal escrito, o de una cola vieja).
  const sueltas = enDescargas.filter((f) => {
    if (f.parcial || !f.clave.startsWith(`${slug}__`)) return false;
    const clase = EXT_VIDEO.includes(f.ext) ? 'video' : EXT_IMAGEN.includes(f.ext) ? 'imagen' : null;
    return !clase || !conocidos.has(`${f.clave}|${clase}`);
  });
  if (sueltas.length) {
    resumen.avisos.push(
      `en Descargas hay ${sueltas.length} archivo(s) con el nombre de este anuncio que no son de ningun trabajo de la cola (nombre mal escrito?): ${sueltas.map((f) => f.nombre).join(', ')}`
    );
  }

  imprimirResumen(resumen, { colas, cArg, soloVer, manifiesto: ctx.manifiesto, decir });
  return resumen;
}

function imprimirResumen(resumen, { colas, cArg, soloVer, manifiesto, decir }) {
  const { recibidos, yaEstaban, faltan, rechazados, errores, avisos, iconos, tomasH } = resumen;
  decir('');
  decir(
    `  ${soloVer ? 'Se recibirian' : 'Recibidos'}: ${recibidos.length}   Ya estaban: ${yaEstaban.length}   Faltan: ${faltan.length}   ${soloVer ? 'Se rechazarian' : 'Rechazados'}: ${rechazados.length}${errores.length ? `   Errores: ${errores.length}` : ''}`
  );
  if (rechazados.length) {
    decir(`\n  ${soloVer ? 'Se rechazarian' : 'Rechazados'} (hay que volver a generarlos en Flow):`);
    for (const x of rechazados) decir(`      ${x.archivo}: ${x.motivo}`);
  }
  if (errores.length) {
    decir('\n  ERRORES (no se pudo colocar; la descarga quedo donde estaba):');
    for (const e of errores) decir(`      ${e}`);
  }
  if (avisos.length) {
    decir('\n  Avisos:');
    for (const a of avisos) decir(`      ${a}`);
  }

  const sinTransparencia = iconos.filter((x) => x.transparente === false);
  if (sinTransparencia.length) {
    decir(`\n  OJO: ${sinTransparencia.length} icono(s) quedaron SIN transparencia real (el montaje los muestra en una tarjeta blanca):`);
    for (const x of sinTransparencia) decir(`      ${x.archivo}${x.fondoQuitado ? '' : ` (el fondo no era verde croma: #${x.colorFondo})`}`);
  }
  const sinRevisar = iconos.filter((x) => x.huecosTapados === null);

  if (soloVer) {
    decir('\n  --solo-ver: no se movio ni se escribio nada. Sin --solo-ver se recibe de verdad.\n');
    return;
  }

  decir('\n  Siguiente:');
  let dicho = false;
  for (const { tipo, trabajos, bloqueados } of colas) {
    const faltanTipo = faltan.filter((x) => x.tipo === tipo);
    const descargando = faltanTipo.filter((x) => x.descargando).length;
    const pendientes = faltanTipo.length + rechazados.filter((x) => x.tipo === tipo).length;
    const recibidosTipo = recibidos.filter((x) => x.tipo === tipo).length;
    // Cola vacia (como la deja el motor cuando no queda nada) y nada recibido
    // de ella: no hay vuelta que armar.
    if (!trabajos.length && !bloqueados.length && !recibidosTipo) continue;
    dicho = true;
    if (pendientes) {
      decir(`    - ${pendientes} ${tipo === 'videos' ? 'video(s) sin recibir: generalos en Flow, descargalos' : 'imagen(es) sin recibir: generalas en Flow, descargalas'} con su nombre y vuelve a correr`);
      if (descargando) decir(`      (${descargando} todavia se ${descargando === 1 ? 'esta' : 'estan'} descargando: espera a que ${descargando === 1 ? 'termine' : 'terminen'})`);
      decir(`        npm run flow:recibir -- ${cArg}`);
    }
    if (pendientes === 0 || recibidosTipo) {
      const espera = bloqueados.length ? ` (${bloqueados.length} esperaban a otros archivos)` : '';
      decir(`    - ${pendientes ? 'Cuando esten, arma' : 'Arma'} la siguiente vuelta${espera}; cuando diga que no queda nada, ${tipo === 'imagenes' ? 'siguen los videos' : 'sigue la revision'}:`);
      decir(`        npm run ${tipo} -- ${cArg}`);
    }
  }
  if (!dicho) {
    if (colas.some((c) => c.tipo === 'videos')) {
      decir('    - Las colas de Flow estan vacias: no queda nada por recibir.');
    } else {
      decir('    - La cola de imagenes esta vacia: no queda ninguna por recibir. Siguen los videos:');
      decir(`        npm run videos -- ${cArg}`);
    }
  }
  if (sinRevisar.length) {
    decir(`    - ${sinRevisar.length} icono(s) sin revisar los huecos (${sinRevisar[0].huecosError || 'sin Python'}). Cuando Python con Pillow y numpy`);
    decir('      este listo (npm run verificar, seccion 8), sin generar nada:');
    decir(`        npm run imagenes -- ${cArg} --tapar-huecos`);
  }
  // Como avisarMedirTomasH de generar-videos.js: las tomas H nuevas no tienen
  // medida y las "solo_voz" pasan despues por el paso voz.
  const ns = [...new Set(tomasH)].sort((a, b) => a - b);
  if (ns.length) {
    const soloVoz = ns.filter((n) => (manifiesto?.tomas || []).find((t) => t.n === n)?.solo_voz === true);
    decir(`    - Tomas habladas nuevas (${ns.join(', ')}): midelas y revisa que esten limpias antes de planear:`);
    decir(`        npm run lineas -- ${cArg} --tomas ${ns.join(',')}`);
    if (soloVoz.length) {
      decir('      Las de voz en off ("solo_voz"), cuando esten limpias, pasan por el paso voz y se miden otra vez:');
      decir(`        npm run voz -- ${cArg} --tomas ${soloVoz.join(',')}`);
      decir(`        npm run lineas -- ${cArg} --tomas ${soloVoz.join(',')}`);
    }
  }
  decir('');
}

// ---------------------------------------------------------------- CLI

function cli() {
  const args = process.argv.slice(2);
  const conValor = ['--desde', '--respaldo'];
  const valor = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
  };
  const carpetaArg = args.find((a, i) => !a.startsWith('--') && !conValor.includes(args[i - 1]));
  const desconocidas = args.filter((a) => a.startsWith('--') && !['--solo-ver', '--rehacer', ...conValor].includes(a));

  if (!carpetaArg || desconocidas.length) {
    if (desconocidas.length) console.error(`\n  No conozco: ${desconocidas.join(', ')}`);
    console.error('\n  Uso: npm run flow:recibir -- <carpeta-del-anuncio> [--desde <carpeta>] [--respaldo id1,id2] [--rehacer] [--solo-ver]\n');
    process.exitCode = 1;
    return;
  }
  for (const f of conValor) {
    if (args.includes(f) && !valor(f)) {
      console.error(`\n  ${f} necesita un valor.\n`);
      process.exitCode = 1;
      return;
    }
  }

  // FLOW_DESCARGAS puede venir del .env (rutaDescargas). Sin .env, la de siempre.
  try {
    cargarEnv();
  } catch {
    // sin .env: Descargas del usuario
  }

  try {
    const resumen = recibirDeFlow(carpetaArg, {
      desde: valor('--desde'),
      respaldo: (valor('--respaldo') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      rehacer: args.includes('--rehacer'),
      soloVer: args.includes('--solo-ver'),
      carpetaArg,
    });
    if (resumen.errores.length) process.exitCode = 1;
  } catch (e) {
    console.error(`\n  ${e.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && process.argv[1].endsWith('flow-recibir.js')) cli();
