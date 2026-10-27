// Podcast en modo esquina — recorta al host SIN fondo en los tramos que van en la
// esquina mientras va el B-roll.
//
//   node produccion/recortar-host.js temp/mi-anuncio
//   node produccion/recortar-host.js temp/mi-anuncio --tomas 3,4
//   node produccion/recortar-host.js temp/mi-anuncio --solo-plan     no recorta nada
//   node produccion/recortar-host.js temp/mi-anuncio --rehacer       aunque ya este recortado
//   node produccion/recortar-host.js temp/mi-anuncio --limpiar       al final borra tambien las mascaras
//   node produccion/recortar-host.js temp/mi-anuncio --forzar        aunque parezca haber un render u otro
//                                                                    recorte corriendo (candado colgado)
//   node produccion/recortar-host.js temp/mi-anuncio --hilos 6 --franja 0.078,0.859
//   node produccion/recortar-host.js --verificar                     si esta todo lo que hace falta
//   (npm run recortar -- temp/mi-anuncio; npm run recortar -- --verificar)
//
// Python va con -E -P (-E solo antes de 3.11), NO con -I: -I esconde los
// paquetes instalados con pip --user (ver banderasDePython). Si faltan, el
// mensaje da el comando: python -m pip install --user rembg onnxruntime pillow numpy.
//
// POR QUE EXISTE. En modo esquina el B-roll va a pantalla completa y el host que
// habla aparece encima, recortado sin fondo, pegado a la esquina inferior de su
// lado (A a la izquierda, B a la derecha, uno por vez), no en una ventana con
// marco. Se pidio asi y se aprobo en la prueba Cayenne (2026-10-13), con el
// contorno de la manga dibujado. El recorte lo hace un modelo (BiRefNet lite por
// rembg, en Python) y es caro: unos 10-50 s por mascara segun lo que este abierto
// en la computadora de prueba, unos 7 min por segundo de host. Por eso solo se recortan los
// tramos que de verdad van en la esquina, y por eso es un paso aparte.
//
// QUE HACE. Lee plan-montaje.json, junta por toma las ventanas de las piezas
// `esquina-<lado>` (con 0,1 s de margen por lado) y le pasa el trabajo a
// produccion/recortar-host.py (python -E -P, UN proceso, una sola sesion del
// modelo; ver banderasDePython).
// Deja video/recorte-toma-N.webm (VP9 con alfa) y recorte.json en la carpeta del
// anuncio:
//
//   { "generado": "...", "modelo": "birefnet-general-lite",
//     "franja": [100, 1100], "fps": 24, "proporcion": 0.72,
//     "tomas": { "3": {
//       "archivo": "recorte-toma-3.webm",
//       "inicio_fotograma": 169, "inicio_seg": 7.041666666666667, "fotogramas": 54,
//       "fps": 24, "franja": [100, 1100], "proporcion": 0.72, "lado": "derecha",
//       "tramos": [[7.041667, 9.291667]],
//       "fuente": { "archivo": "toma-3.mp4", "bytes": 3805739 }
//   } } }
//
//   inicio_seg    segundo DEL CLIP (toma-N.mp4) donde empieza el .webm
//   fotogramas    largo del .webm en fotogramas (a `fps`)
//   tramos        en segundos del clip, lo que tiene recorte de verdad. Entre dos
//                 tramos de la misma toma el .webm va TRANSPARENTE: una ventana
//                 cubierta tiene que caer entera dentro de UN tramo
//   franja        filas del clip recortadas (de arriba de la cabeza a antes de la
//                 mesa); proporcion = ancho del clip / (franja[1] - franja[0])
//   fuente.bytes  el tamano del clip que se recorto: si la toma se regenera, el
//                 recorte ya no vale
//   arriba        franja/fps/proporcion de la toma de numero mas alto, por
//                 compatibilidad con el recorte.json de la prueba (que no traia
//                 nada por toma ni `tramos`)
//
// Quien lo lee: planear-montaje.js, con recorteParaPieza() de este archivo:
// si recorte.json cubre la ventana de una pieza esquina-<lado>, la pieza pasa a
// { archivo: "recorte-toma-N.webm", marco: "recorte-<lado>", recorteInicio
// (relativo al .webm), proporcion }; si no, queda la ventana con el aviso
// "corre npm run recortar". Escena.jsx dibuja el marco recorte-* con esa
// proporcion.
//
// Orden de los pasos del podcast en esquina: plan -> subtitulos -> plan ->
// RECORTAR -> plan -> ensamblar --concurrencia 1. Nunca a la vez que un render
// ni que otro recorte: el modelo por si solo ocupa ~6 GB de RAM.
//
// Las mascaras quedan en <carpeta>/.recorte-host/ (pesan poco): si se corta a
// mitad, se retoma donde quedo, y si el plan cambia un poco solo se calculan los
// fotogramas nuevos. Los fotogramas de trabajo se borran al terminar cada toma.
// Si la toma se regenera, sus mascaras viejas se tiran solas.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Valores del recorte. La franja y el contorno son los aprobados en la
 * prueba (clip de 720x1280: filas 100 a 1100), en proporcion del alto para que
 * sirvan con cualquier tamano de clip.
 *   modelo             el de rembg (birefnet-general completo no entro en la
 *                      GPU de 6 GB; u2net_human_seg e isnet dejaban peor el pelo)
 *   margenSeg          aire antes y despues de cada ventana
 *   franja             [arriba, abajo] en fraccion del alto del clip
 *   hilos              hilos de onnxruntime (OMP_NUM_THREADS) del unico proceso
 *   segundosPorMascara para estimar el tiempo (medido: 10-50 s segun la carga)
 *   ramLibreMinGb      con menos RAM libre se avisa (pico medido: ~6,1 GB)
 *   candadoHoras       un candado de "un recorte a la vez" mas viejo que esto
 *                      no vale aunque su proceso parezca vivo (ver
 *                      estadoDelCandado); si el recorte estimo mas, el triple
 */
export const RECORTE_HOST = {
  modelo: 'birefnet-general-lite',
  margenSeg: 0.1,
  franja: [100 / 1280, 1100 / 1280],
  hilos: 8,
  segundosPorMascara: 30,
  ramLibreMinGb: 6.5,
  candadoHoras: 6,
  carpetaTrabajo: '.recorte-host',
};

/** Tolerancia al final de la ventana (la misma de la herramienta de la prueba). */
const EPS_FIN = 0.01;

const RAIZ_PRODUCCION = path.dirname(fileURLToPath(import.meta.url));
const r3 = (x) => Number(Number(x).toFixed(3));
const r6 = (x) => Number(Number(x).toFixed(6));
const par = (x) => x - (x % 2);

/** Donde vive el informe del recorte: en la carpeta del anuncio. */
export const rutaRecorte = (carpeta) => path.join(carpeta, 'recorte.json');

/** recorte.json leido, o null si no hay (o no se puede leer). */
export function leerRecorte(carpeta) {
  try {
    return JSON.parse(fs.readFileSync(rutaRecorte(carpeta), 'utf8'));
  } catch {
    return null;
  }
}

/** "3" para toma-3.mp4 y para recorte-toma-3.webm; null si no es de una toma. */
export function tomaDeArchivo(archivo) {
  const m = /(?:^|recorte-)toma-(\d+)\.(?:mp4|webm)$/.exec(String(archivo || ''));
  return m ? m[1] : null;
}

/** El lado de un marco esquina-* o recorte-*; null si es otro marco. */
export function ladoDeMarco(marco) {
  const m = /^(?:esquina|recorte)-(izquierda|derecha)$/.exec(String(marco || ''));
  return m ? m[1] : null;
}

/**
 * Los tramos (segundos del clip) que tienen recorte de verdad en una entrada de
 * recorte.json. Un recorte.json viejo (el de la prueba) no trae `tramos`: ahi
 * todo el .webm es recorte.
 */
export function tramosDeEntrada(entrada, fpsGeneral) {
  const fps = Number(entrada?.fps ?? fpsGeneral);
  if (Array.isArray(entrada?.tramos) && entrada.tramos.length) {
    return entrada.tramos.map(([a, b]) => [Number(a), Number(b)]);
  }
  const ini = Number(entrada?.inicio_seg);
  const largo = Number(entrada?.fotogramas) / fps;
  return Number.isFinite(ini) && Number.isFinite(largo) ? [[ini, ini + largo]] : [];
}

/**
 * Si recorte.json cubre la ventana de una pieza `esquina-<lado>`, lo que hay que
 * cambiarle a la pieza para que muestre al host recortado:
 *   { ok: true, cambios: { archivo, marco, recorteInicio, proporcion? } }
 * Si no, { ok: false, motivo } (la pieza se queda como ventana, con aviso).
 *
 * recorteInicio pasa a ser relativo al .webm: el de la pieza (segundo del clip)
 * menos inicio_seg, como lo hacia la herramienta de la prueba. La ventana tiene
 * que caer ENTERA dentro de un tramo (entre tramos el .webm es transparente).
 * Con `carpeta`, ademas se comprueba que el .webm exista y que el clip sea el
 * mismo que se recorto (fuente.bytes).
 */
export function recorteParaPieza(pieza, recorte, { carpeta = null } = {}) {
  const lado = /^esquina-/.test(String(pieza?.marco || '')) ? ladoDeMarco(pieza.marco) : null;
  if (!lado) return { ok: false, motivo: 'la pieza no es una ventana de esquina' };
  const toma = tomaDeArchivo(pieza.archivo);
  if (!toma) return { ok: false, motivo: `no se de que toma es ${pieza.archivo}` };
  const entrada = recorte?.tomas?.[toma];
  if (!entrada) return { ok: false, motivo: `recorte.json no tiene la toma ${toma}` };

  const ini = Number(pieza.recorteInicio) || 0;
  const fin = ini + Number(pieza.duracion) * (Number(pieza.velocidad) || 1);
  const tramos = tramosDeEntrada(entrada, recorte.fps);
  if (!tramos.some(([a, b]) => ini >= a - 1e-6 && fin <= b + EPS_FIN)) {
    return { ok: false, motivo: `el recorte de la toma ${toma} no cubre ${ini.toFixed(2)}-${fin.toFixed(2)} s del clip` };
  }

  const archivo = entrada.archivo || `recorte-toma-${toma}.webm`;
  if (carpeta) {
    if (!fs.existsSync(path.join(carpeta, 'video', archivo))) {
      return { ok: false, motivo: `falta video/${archivo}` };
    }
    const bytes = Number(entrada.fuente?.bytes);
    const clip = path.join(carpeta, 'video', `toma-${toma}.mp4`);
    if (Number.isFinite(bytes) && fs.existsSync(clip) && fs.statSync(clip).size !== bytes) {
      return { ok: false, motivo: `la toma ${toma} cambio despues del recorte (se regenero)` };
    }
  }

  const cambios = { archivo, marco: `recorte-${lado}`, recorteInicio: r3(ini - Number(entrada.inicio_seg)) };
  const proporcion = Number(entrada.proporcion ?? recorte.proporcion);
  if (proporcion > 0) cambios.proporcion = proporcion;
  return { ok: true, cambios };
}

/**
 * Las ventanas del host en la esquina, por toma, en segundos del clip:
 *   Map("3" -> { lado, ventanas: [[ini, fin], ...] })
 * Salen de las piezas esquina-<lado> y tambien de las recorte-<lado> que ya
 * estuvieran en el plan (con el recorte.json actual se sabe a que segundo del
 * clip corresponden): asi un recorte nuevo de la toma las sigue cubriendo.
 */
export function ventanasDelPlan(plan, recorte) {
  const porToma = new Map();
  const avisos = [];
  for (const p of plan?.escena?.piezas || []) {
    const lado = ladoDeMarco(p.marco);
    if (!lado || p.tipo !== 'clip') continue;
    const toma = tomaDeArchivo(p.archivo);
    if (!toma) {
      avisos.push(`la pieza ${p.marco} usa ${p.archivo}: no se de que toma es, se salta.`);
      continue;
    }
    let ini = Number(p.recorteInicio) || 0;
    if (p.marco.startsWith('recorte-')) {
      const entrada = recorte?.tomas?.[toma];
      if (!entrada) {
        avisos.push(`la pieza ${p.marco} usa ${p.archivo} pero recorte.json no tiene la toma ${toma}: se salta.`);
        continue;
      }
      ini += Number(entrada.inicio_seg);
    }
    const fin = ini + Number(p.duracion) * (Number(p.velocidad) || 1);
    if (!porToma.has(toma)) porToma.set(toma, { lado, ventanas: [] });
    const t = porToma.get(toma);
    if (t.lado !== lado) avisos.push(`la toma ${toma} aparece de los dos lados; el contorno va del lado ${t.lado}.`);
    t.ventanas.push([r6(ini), r6(fin)]);
  }
  for (const t of porToma.values()) t.ventanas.sort((a, b) => a[0] - b[0]);
  return { porToma, avisos };
}

/**
 * Las ventanas pasadas a fotogramas del clip (contados desde 0), con el margen,
 * unidas si se tocan: [[i0, i1], ...]. Es la misma cuenta de la herramienta de
 * la prueba: i0 = piso((ini - margen) * fps), i1 = techo((fin + margen) * fps).
 */
export function tramosEnFotogramas(ventanas, { fps, total, margenSeg = RECORTE_HOST.margenSeg }) {
  const crudos = ventanas
    .map(([a, b]) => [
      Math.max(0, Math.floor((a - margenSeg) * fps + 1e-9)),
      Math.min(total - 1, Math.ceil((b + margenSeg) * fps - 1e-9)),
    ])
    .filter(([a, b]) => b >= a)
    .sort((x, y) => x[0] - y[0]);
  const unidos = [];
  for (const [a, b] of crudos) {
    const ultimo = unidos[unidos.length - 1];
    if (ultimo && a <= ultimo[1] + 1) ultimo[1] = Math.max(ultimo[1], b);
    else unidos.push([a, b]);
  }
  return unidos;
}

/** Fotogramas con mascara propia (como en el .py): uno de cada dos mas el ultimo. */
export function clavesDe(i0, i1) {
  const claves = [];
  for (let i = i0; i <= i1; i += 2) claves.push(i);
  if (claves[claves.length - 1] !== i1) claves.push(i1);
  return claves;
}

/** Tamano, fps y fotogramas de un clip (ffprobe). */
function infoDeClip(clip) {
  const salida = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,nb_frames:format=duration', '-of', 'json', clip],
    { encoding: 'utf8' }
  );
  const j = JSON.parse(salida);
  const s = j.streams?.[0] || {};
  const [num, den] = String(s.r_frame_rate || '').split('/').map(Number);
  const fps = den ? num / den : num;
  if (!(fps > 0) || !(s.width > 0) || !(s.height > 0)) throw new Error(`ffprobe no pudo leer ${path.basename(clip)}`);
  const total = Number(s.nb_frames) > 0 ? Number(s.nb_frames) : Math.round(Number(j.format?.duration) * fps);
  return { ancho: s.width, alto: s.height, fpsTexto: s.r_frame_rate, fps, total };
}

/** La franja en pixeles (filas pares, por el 4:2:0 del .webm). */
function franjaEnPixeles(alto, franja) {
  const y0 = par(Math.round(franja[0] * alto));
  const y1 = par(Math.round(franja[1] * alto));
  return [y0, Math.min(par(alto), y1)];
}

const mismaFranja = (a, b) => Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];

/**
 * Con que banderas se corre Python. NO con -I (aislado): -I implica -s y deja
 * fuera los paquetes del directorio del usuario, y en un Python instalado para
 * todos pip los pone justo ahi ("Defaulting to user installation"): el alumno
 * los instalaba y el motor seguia diciendo que faltaban. Se usa -E (no lee las
 * variables PYTHON* del entorno) y, desde Python 3.11, -P (no agrega la
 * carpeta del script ni la actual a la ruta de modulos). Antes de 3.11 -P no
 * existe y Python se niega a arrancar con el: ahi va solo -E.
 */
export const banderasDePython = (menor) => (menor >= 11 ? ['-E', '-P'] : ['-E']);

/**
 * Los Python que se prueban, en orden (en Windows el lanzador "py -3" va
 * segundo). Se exporta para que los mensajes digan cuales se probaron
 * (generar-imagenes.js, al tapar los huecos de los iconos).
 */
export const CANDIDATOS_PYTHON = process.platform === 'win32' ? [['python'], ['py', '-3'], ['python3']] : [['python3'], ['python']];

/** undefined = todavia no se busco (se busca una sola vez por proceso). */
let pythonEncontrado;

/**
 * El primer Python 3 que responde: { cmd, pre, version: "3.13.14", banderas },
 * o null si no hay. La version (y con ella las banderas) se detecta una sola
 * vez. El atajo de la Microsoft Store (python.exe que no es Python, codigo
 * 9009) no cuenta.
 */
export function buscarPython() {
  if (pythonEncontrado !== undefined) return pythonEncontrado;
  pythonEncontrado = null;
  for (const [cmd, ...pre] of CANDIDATOS_PYTHON) {
    const r = spawnSync(cmd, [...pre, '-E', '-c', 'import sys; print("%d %d %d" % tuple(sys.version_info[:3]))'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30000,
    });
    const v = !r.error && r.status === 0 ? /^(\d+) (\d+) (\d+)/.exec(String(r.stdout).trim()) : null;
    if (!v || v[1] !== '3') continue;
    pythonEncontrado = { cmd, pre, version: `${v[1]}.${v[2]}.${v[3]}`, banderas: banderasDePython(Number(v[2])) };
    break;
  }
  return pythonEncontrado;
}

/** Como se escribe ese Python en un comando para el usuario ("python", "py -3"). */
export const comandoPython = (python) => [python?.cmd || 'python', ...(python?.pre || [])].join(' ');

/**
 * El comando para instalar paquetes que faltan, CON --user: es lo que pip hace
 * solo cuando Python esta instalado para todos, y con -E/-P el motor si los ve.
 */
export const comandoInstalar = (python, paquetes) => `${comandoPython(python)} -m pip install --user ${paquetes.join(' ')}`;

/**
 * Los paquetes de Python que usan los estilos hablados, con el nombre del
 * modulo (para buscarlo) y el de pip (para instalarlo):
 *   iconos    tapar los huecos de los iconos de la entrevista (tapar-huecos.py)
 *   recorte   el host recortado sin fondo del podcast en esquina (este paso)
 */
export const PAQUETES_PYTHON = {
  iconos: [
    ['PIL', 'pillow'],
    ['numpy', 'numpy'],
  ],
  recorte: [
    ['rembg', 'rembg'],
    ['onnxruntime', 'onnxruntime'],
    ['PIL', 'pillow'],
    ['numpy', 'numpy'],
  ],
};

/**
 * Que paquetes (nombres de pip) no encuentra ese Python, sin importarlos
 * (importlib.util.find_spec: es instantaneo; importar rembg tarda ~10 s).
 * Sirve para avisar (npm run verificar); el recorte de verdad los importa
 * (recortar-host.py --verificar). null si Python no pudo responder.
 */
export function paquetesQueFaltan(python, pares) {
  if (!python) return null;
  const modulos = JSON.stringify(pares.map(([m]) => m));
  const codigo = `import importlib.util as u, json; print(json.dumps([m for m in ${modulos} if u.find_spec(m) is None]))`;
  const r = spawnSync(python.cmd, [...python.pre, ...python.banderas, '-c', codigo], { encoding: 'utf8', windowsHide: true, timeout: 60000 });
  try {
    const faltan = JSON.parse(String(r.stdout).trim().split('\n').pop());
    return pares.filter(([m]) => faltan.includes(m)).map(([, pip]) => pip);
  } catch {
    return null;
  }
}

/** true si ffmpeg trae el codificador VP9 (libvpx-vp9), que hace falta para el .webm con alfa; null si no hay ffmpeg. */
export function ffmpegConVp9() {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8', windowsHide: true });
  if (r.error || r.status !== 0) return null;
  return /libvpx-vp9/.test(String(r.stdout));
}

/** La ruta del script de Python del recorte. */
const RUTA_PY = path.join(RAIZ_PRODUCCION, 'recortar-host.py');

/**
 * Lo que hace falta para recortar, revisado de verdad: ffmpeg con VP9, Python
 * 3, los paquetes IMPORTADOS por recortar-host.py --verificar (asi sale
 * tambien un paquete instalado pero roto) y si el modelo ya esta bajado.
 *   { vp9: true|false|null (null = sin ffmpeg), python, estado: { python,
 *     faltan, modelo } | null, error? }
 */
export function revisarRequisitos() {
  const vp9 = ffmpegConVp9();
  const python = buscarPython();
  if (!python) return { vp9, python: null, estado: null };
  const ver = spawnSync(python.cmd, [...python.pre, ...python.banderas, RUTA_PY, '--verificar'], { encoding: 'utf8', windowsHide: true });
  try {
    return { vp9, python, estado: JSON.parse(String(ver.stdout).trim().split('\n').pop()) };
  } catch {
    return { vp9, python, estado: null, error: String(ver.stderr || ver.stdout || ver.error?.message || '').trim() };
  }
}

/** Como se comprueba despues de instalar (sin carpeta: no recorta nada). */
const COMO_VERIFICAR = 'npm run recortar -- --verificar';

/**
 * Lo que falta para recortar, dicho para el usuario: una lista de
 * { que, ayuda } (vacia si esta todo). Lo usan --verificar y la corrida real.
 */
export function faltasDelRecorte(req) {
  const faltas = [];
  if (req.vp9 === null) {
    faltas.push({
      que: 'ffmpeg no esta instalado o no esta en el PATH',
      ayuda: 'En Windows: winget install Gyan.FFmpeg  (la version "full"), y abre otra terminal.',
    });
  } else if (!req.vp9) {
    faltas.push({
      que: 'ffmpeg no trae el codificador VP9 (libvpx-vp9), que hace falta para el video con alfa',
      ayuda: 'En Windows: winget install Gyan.FFmpeg  (la version "full"), y abre otra terminal.',
    });
  }
  const todos = PAQUETES_PYTHON.recorte.map(([, pip]) => pip);
  if (!req.python) {
    faltas.push({
      que: 'no encuentro Python 3 (el recorte lo hace un modelo que corre en Python)',
      ayuda:
        'Instalalo desde https://www.python.org/downloads/ (marca "Add python.exe to PATH"), abre otra terminal y ' +
        `despues: python -m pip install --user ${todos.join(' ')}. Para comprobarlo: ${COMO_VERIFICAR}`,
    });
  } else if (!req.estado) {
    faltas.push({
      que: `Python ${req.python.version} (${comandoPython(req.python)}) no pudo revisar sus paquetes${req.error ? `: ${req.error.split('\n').pop()}` : ''}`,
      ayuda: `Instala o repara los paquetes: ${comandoInstalar(req.python, todos)}. Para comprobarlo: ${COMO_VERIFICAR}`,
    });
  } else if (req.estado.faltan?.length) {
    faltas.push({
      que: `a Python ${req.estado.python} (${comandoPython(req.python)}) le faltan paquetes para el recorte: ${req.estado.faltan.join(', ')}`,
      ayuda:
        `Instalalos con: ${comandoInstalar(req.python, req.estado.faltan)}  (dentro de un entorno virtual, sin --user). ` +
        `Para comprobarlo: ${COMO_VERIFICAR}`,
    });
  }
  return faltas;
}

/** Bytes que ocupa una carpeta (para el informe). */
function pesoDe(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, e.name);
    total += e.isDirectory() ? pesoDe(ruta) : fs.statSync(ruta).size;
  }
  return total;
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
const minutos = (seg) => (seg < 90 ? `${Math.round(seg)} s` : `${Math.round(seg / 60)} min`);

/** true si el proceso sigue vivo (para el candado de "un recorte a la vez"). */
function procesoVivo(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

/**
 * El candado de "un recorte a la vez": en la carpeta temporal del sistema, no
 * en la del anuncio, para que tampoco corran dos recortes de anuncios
 * distintos. Lleva { pid, anuncio, desde, estimadoSeg }.
 */
export const rutaCandado = () => path.join(os.tmpdir(), 'anuncios-ia-recortar-host.json');

/**
 * Si el candado que dejo otro recorte sigue valiendo: { vigente, motivo, viejo? }.
 * NO vale si es de este proceso, si su proceso ya no existe, o si es VIEJO:
 * tiene mas de RECORTE_HOST.candadoHoras (o del triple de lo que ese recorte
 * estimo, si es mas largo) aunque su PID exista. Un Ctrl+C a destiempo lo deja
 * en disco y Windows reusa los numeros de proceso: sin el limite de horas el
 * recorte quedaba trabado para siempre. `vivo` y `ahora` son para probarlo.
 */
export function estadoDelCandado(candado, { ahora = Date.now(), vivo = procesoVivo } = {}) {
  if (!candado || !Number.isInteger(candado.pid)) return { vigente: false, motivo: 'no hay candado' };
  if (candado.pid === process.pid) return { vigente: false, motivo: 'es de este mismo proceso' };
  const desde = Date.parse(candado.desde);
  const horas = Number.isFinite(desde) ? (ahora - desde) / 3.6e6 : Infinity;
  const tope = Math.max(RECORTE_HOST.candadoHoras, ((Number(candado.estimadoSeg) || 0) * 3) / 3600);
  if (horas > tope) {
    const cuanto = Number.isFinite(horas) ? `tiene ${horas.toFixed(1)} h` : 'no dice desde cuando';
    return { vigente: false, viejo: true, motivo: `${cuanto} y el limite es ${Number(tope.toFixed(1))} h: quedo de un recorte que se corto` };
  }
  if (!vivo(candado.pid)) return { vigente: false, viejo: true, motivo: `su proceso ${candado.pid} ya no existe` };
  return { vigente: true, motivo: `proceso ${candado.pid} vivo, desde hace ${horas.toFixed(1)} h`, topeHoras: Number(tope.toFixed(1)) };
}

/** El candado en disco, o null. */
function leerCandado() {
  try {
    return JSON.parse(fs.readFileSync(rutaCandado(), 'utf8'));
  } catch {
    return null;
  }
}

/**
 * true si parece haber un render de Remotion corriendo (su navegador sin ventana,
 * chrome-headless-shell). Es un indicio, no una certeza: si queda uno colgado, se
 * puede seguir con --forzar.
 */
function hayRender() {
  try {
    const salida =
      process.platform === 'win32'
        ? execFileSync('tasklist', ['/FO', 'CSV', '/NH'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        : execFileSync('ps', ['-A', '-o', 'comm='], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return /chrome-headless-shell/i.test(salida);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- CLI

/**
 * --verificar: si esta todo lo que hace falta para recortar (ffmpeg con VP9,
 * Python 3, los paquetes importados de verdad y el modelo), sin carpeta y sin
 * recortar nada. Sale con 0 si esta todo y con 1 si falta algo.
 */
function cliVerificar() {
  console.log('\n=== Recorte del host (podcast en esquina): lo que hace falta ===\n');
  const req = revisarRequisitos();
  const faltas = faltasDelRecorte(req);
  if (req.vp9) console.log('  OK    ffmpeg con el codificador VP9 (libvpx-vp9)');
  if (req.python) console.log(`  OK    Python ${req.python.version} (${comandoPython(req.python)}; el motor lo corre con ${req.python.banderas.join(' ')})`);
  if (req.estado && !req.estado.faltan?.length) console.log(`  OK    paquetes: ${PAQUETES_PYTHON.recorte.map(([, pip]) => pip).join(', ')}`);
  for (const f of faltas) {
    console.log(`  FALTA ${f.que}`);
    console.log(`        -> ${f.ayuda}`);
  }
  const modelo = req.estado?.modelo;
  if (modelo?.en_cache) console.log(`  OK    modelo ${RECORTE_HOST.modelo} ya bajado (${modelo.ruta})`);
  else if (modelo) console.log(`  AVISO el modelo ${RECORTE_HOST.modelo} no esta todavia: se baja la primera vez que recortes (~220 MB, hace falta internet).`);
  console.log(faltas.length ? `\n  Falta ${faltas.length} cosa(s) para recortar. Ver arriba.\n` : '\n  Todo listo para recortar.\n');
  process.exit(faltas.length ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('recortar-host.js')) {
  const args = process.argv.slice(2);
  if (args.includes('--verificar')) cliVerificar();
  const conValor = ['--tomas', '--hilos', '--franja'];
  const valor = (op) => {
    const i = args.indexOf(op);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const carpetaArg = args.find((a, i) => !a.startsWith('--') && !conValor.includes(args[i - 1]));
  const soloPlan = args.includes('--solo-plan');
  const rehacer = args.includes('--rehacer');
  const limpiar = args.includes('--limpiar');
  const forzar = args.includes('--forzar');
  const soloTomas = valor('--tomas')
    ? valor('--tomas').split(',').map((x) => x.trim()).filter((x) => /^\d+$/.test(x))
    : null;
  const hilos = Number(valor('--hilos')) > 0 ? Math.round(Number(valor('--hilos'))) : RECORTE_HOST.hilos;
  let franja = RECORTE_HOST.franja;
  if (valor('--franja')) {
    const f = valor('--franja').split(',').map(Number);
    if (f.length !== 2 || !(f[0] >= 0 && f[1] <= 1 && f[1] - f[0] > 0.2)) {
      console.error('\n  --franja va como arriba,abajo en fraccion del alto del clip (por ejemplo 0.078,0.859).\n');
      process.exit(1);
    }
    franja = f;
  }

  if (!carpetaArg) {
    console.error(
      '\n  Uso: node produccion/recortar-host.js <carpeta-del-anuncio> [--tomas 3,4] [--solo-plan] [--rehacer] [--limpiar] [--forzar] [--hilos 8] [--franja 0.078,0.859]' +
        '\n       node produccion/recortar-host.js --verificar      (si esta todo lo que hace falta; no recorta nada)\n'
    );
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const rutaPlan = path.join(carpeta, 'plan-montaje.json');
  console.log(`\n=== Recorte del host (podcast en esquina) — ${path.basename(carpeta)} ===\n`);
  if (!fs.existsSync(rutaPlan)) {
    console.error(`  No encuentro ${rutaPlan}. Primero el plan:\n      npm run plan -- ${carpetaArg}\n`);
    process.exit(1);
  }
  const plan = JSON.parse(fs.readFileSync(rutaPlan, 'utf8'));
  if (plan.escena?.estilo !== 'podcast' || plan.escena?.modoBroll !== 'esquina') {
    console.log('  Este plan no es un podcast con el B-roll en modo esquina. Nada que recortar.\n');
    process.exit(0);
  }

  const recorteViejo = leerRecorte(carpeta);
  const { porToma, avisos } = ventanasDelPlan(plan, recorteViejo);
  for (const a of avisos) console.log(`  !  ${a}`);
  if (!porToma.size) {
    console.log('  El plan no tiene al host en la esquina (no cayo ningun B-roll). Nada que recortar.\n');
    process.exit(0);
  }
  if (soloTomas) {
    const fuera = soloTomas.filter((n) => !porToma.has(n));
    if (fuera.length) {
      console.error(`  ${fuera.length === 1 ? 'La toma' : 'Las tomas'} ${fuera.join(', ')} no va(n) en la esquina en este plan.\n`);
      process.exit(1);
    }
  }

  const dirTrabajo = path.join(carpeta, RECORTE_HOST.carpetaTrabajo);
  const trabajos = [];
  let mascarasTotal = 0;
  for (const [toma, { lado, ventanas }] of [...porToma].sort((a, b) => Number(a[0]) - Number(b[0]))) {
    if (soloTomas && !soloTomas.includes(toma)) continue;
    const clip = path.join(carpeta, 'video', `toma-${toma}.mp4`);
    if (!fs.existsSync(clip)) {
      console.log(`  toma ${toma}: no encuentro video/toma-${toma}.mp4, se salta.`);
      continue;
    }
    let info;
    try {
      info = infoDeClip(clip);
    } catch (e) {
      console.log(`  toma ${toma}: ${e.message}, se salta.`);
      continue;
    }
    const franjaPx = franjaEnPixeles(info.alto, franja);
    const ancho = par(info.ancho);
    const tramos = tramosEnFotogramas(ventanas, { fps: info.fps, total: info.total });
    const bytes = fs.statSync(clip).size;
    const textoVentanas = ventanas.map(([a, b]) => `${a.toFixed(2)}-${b.toFixed(2)} s`).join(', ');

    // Ya recortada: recorte.json cubre todas las ventanas, del mismo clip y con la
    // misma franja, y el .webm esta.
    const entrada = recorteViejo?.tomas?.[toma];
    const cubiertas =
      entrada &&
      fs.existsSync(path.join(carpeta, 'video', entrada.archivo || `recorte-toma-${toma}.webm`)) &&
      (entrada.fuente?.bytes === undefined || entrada.fuente.bytes === bytes) &&
      (entrada.franja === undefined || mismaFranja(entrada.franja, franjaPx)) &&
      ventanas.every(([a, b]) =>
        recorteParaPieza(
          { marco: `esquina-${lado}`, archivo: `toma-${toma}.mp4`, recorteInicio: a, duracion: b - a, velocidad: 1 },
          recorteViejo
        ).ok
      );
    if (cubiertas && !rehacer) {
      console.log(`  toma ${toma} (${lado}): ya recortada (${textoVentanas}). Para hacerla otra vez: --rehacer`);
      continue;
    }

    // Mascaras que ya estan en disco (de una corrida cortada o de un plan anterior).
    const dirAlfa = path.join(dirTrabajo, `toma-${toma}`, 'alfa');
    let firma = null;
    try {
      firma = JSON.parse(fs.readFileSync(path.join(dirTrabajo, `toma-${toma}`, 'fuente.json'), 'utf8'));
    } catch {}
    const cacheVale =
      firma && firma.bytes === bytes && mismaFranja(firma.franja, franjaPx) && firma.modelo === RECORTE_HOST.modelo;
    const claves = [...new Set(tramos.flatMap(([a, b]) => clavesDe(a, b)))];
    const porHacer = claves.filter((c) => !(cacheVale && fs.existsSync(path.join(dirAlfa, `a${String(c).padStart(5, '0')}.png`))));
    mascarasTotal += porHacer.length;
    const fotogramas = tramos.reduce((s, [a, b]) => s + b - a + 1, 0);
    console.log(
      `  toma ${toma} (${lado}): ventanas ${textoVentanas} -> ${tramos.length} tramo(s), ${fotogramas} fotogramas, ` +
        `${claves.length} mascaras (${porHacer.length} por calcular)`
    );

    trabajos.push({
      toma,
      clip,
      salida: path.join(carpeta, 'video', `recorte-toma-${toma}.webm`),
      fps: info.fpsTexto,
      fpsNumero: info.fps,
      ancho,
      alto: info.alto,
      total: info.total,
      franja: franjaPx,
      lado,
      tramos,
      fuente: { archivo: `toma-${toma}.mp4`, bytes },
    });
  }

  if (!trabajos.length) {
    console.log('\n  Nada que recortar. Si cambiaste el plan, vuelve a planear:');
    console.log(`      npm run plan -- ${carpetaArg}\n`);
    process.exit(0);
  }

  const estimado = mascarasTotal * RECORTE_HOST.segundosPorMascara;
  console.log(
    `\n  Total: ${mascarasTotal} mascaras, ~${minutos(estimado)} (entre ${minutos(mascarasTotal * 10)} y ` +
      `${minutos(mascarasTotal * 50)} segun lo que este abierto). Pico de RAM: ~6 GB.`
  );

  if (soloPlan) {
    console.log('  --solo-plan: no se recorta nada. Para hacerlo:');
    console.log(`      npm run recortar -- ${carpetaArg}${soloTomas ? ` --tomas ${soloTomas.join(',')}` : ''}\n`);
    process.exit(0);
  }

  // Lo que hace falta: ffmpeg con VP9, Python 3 con los paquetes, el modelo.
  const req = revisarRequisitos();
  const faltas = faltasDelRecorte(req);
  if (faltas.length) {
    console.error('\n  Para recortar falta:');
    for (const f of faltas) console.error(`  - ${f.que}.\n    ${f.ayuda}`);
    console.error('');
    process.exit(1);
  }
  const python = req.python;
  if (req.estado.modelo && !req.estado.modelo.en_cache) {
    console.log(`  !  El modelo ${RECORTE_HOST.modelo} no esta todavia: se baja ahora (~220 MB, una sola vez, hace falta internet).`);
  }

  // Un recorte a la vez en toda la maquina (y nunca con un render): el modelo
  // ocupa ~6 GB. Ver rutaCandado y estadoDelCandado. --forzar salta las dos
  // esperas (por si quedo un candado o un render colgado).
  fs.mkdirSync(dirTrabajo, { recursive: true });
  const candado = rutaCandado();
  const otro = leerCandado();
  const estadoCandado = estadoDelCandado(otro);
  if (estadoCandado.vigente) {
    if (!forzar) {
      console.error(`\n  Ya hay un recorte corriendo (${otro.anuncio}, proceso ${otro.pid}, desde ${otro.desde}).`);
      console.error('  Espera a que termine: dos a la vez traban la computadora.');
      console.error(`  El candado es ${candado}`);
      console.error(`  Si de verdad no hay ningun recorte corriendo (quedo de uno que se corto), agrega --forzar o`);
      console.error(`  borra ese archivo. Por si solo deja de valer a las ${estadoCandado.topeHoras} h de puesto.\n`);
      process.exit(1);
    }
    console.log(`  !  --forzar: sigo aunque el candado ${candado} dice que hay otro recorte (${otro.anuncio}, proceso ${otro.pid}).`);
  } else if (estadoCandado.viejo) {
    console.log(`  !  Habia un candado de otro recorte que ya no vale (${estadoCandado.motivo}). Lo reemplazo: ${candado}`);
  }
  if (hayRender() && !forzar) {
    console.error('\n  Parece que hay un render de Remotion corriendo (chrome-headless-shell).');
    console.error('  Espera a que termine: el recorte y un render a la vez traban la computadora.');
    console.error('  Si no hay ningun render (quedo uno colgado), agrega --forzar.\n');
    process.exit(1);
  }
  fs.writeFileSync(
    candado,
    JSON.stringify({ pid: process.pid, anuncio: path.basename(carpeta), desde: new Date().toISOString(), estimadoSeg: Math.round(estimado) })
  );
  // El candado se va con este proceso, como sea que termine (tambien con
  // Ctrl+C: con un oyente de SIGINT, node no muere a mitad del spawnSync y
  // llega a borrarlo). Solo se borra si sigue siendo el de este proceso.
  const soltarCandado = () => {
    if (leerCandado()?.pid === process.pid) fs.rmSync(candado, { force: true });
  };
  process.on('exit', soltarCandado);
  for (const senal of ['SIGINT', 'SIGTERM']) {
    process.on(senal, () => {
      soltarCandado();
      process.exit(130);
    });
  }
  const libreGb = os.freemem() / 1024 ** 3;
  if (libreGb < RECORTE_HOST.ramLibreMinGb) {
    console.log(
      `  !  Hay ${libreGb.toFixed(1)} GB de RAM libres y el modelo usa ~6 GB: cierra lo que no uses ` +
        '(navegador, otro render). Sigue igual, pero puede ir lento.'
    );
  }
  console.log('  No corras un render ni otro proceso pesado mientras tanto.\n');

  const rutaTrabajo = path.join(dirTrabajo, 'trabajo.json');
  const rutaResultado = path.join(dirTrabajo, 'resultado.json');
  fs.rmSync(rutaResultado, { force: true });
  fs.writeFileSync(
    rutaTrabajo,
    JSON.stringify(
      {
        modelo: RECORTE_HOST.modelo,
        hilos,
        dirTrabajo,
        resultado: rutaResultado,
        tomas: trabajos.map(({ fpsNumero, ...t }) => t),
      },
      null,
      2
    )
  );

  const t0 = Date.now();
  const r = spawnSync(python.cmd, [...python.pre, ...python.banderas, RUTA_PY, rutaTrabajo], { stdio: 'inherit' });
  soltarCandado();
  let resultado = null;
  try {
    resultado = JSON.parse(fs.readFileSync(rutaResultado, 'utf8'));
  } catch {}
  if (!resultado) {
    console.error(
      `\n  El recorte se corto ${r.error ? `(${r.error.message})` : `(codigo ${r.status})`}. ` +
        'Las mascaras hechas quedaron en disco: vuelve a correrlo y sigue donde quedo.\n'
    );
    process.exit(1);
  }

  // recorte.json: las tomas recortadas ahora, mas las de antes que sigan teniendo
  // su .webm.
  const nuevo = {
    generado: new Date().toISOString(),
    modelo: RECORTE_HOST.modelo,
    franja: null,
    fps: null,
    proporcion: null,
    tomas: {},
  };
  for (const [toma, e] of Object.entries(recorteViejo?.tomas || {})) {
    if (fs.existsSync(path.join(carpeta, 'video', e.archivo || `recorte-toma-${toma}.webm`))) nuevo.tomas[toma] = e;
    else console.log(`  !  recorte.json tenia la toma ${toma} pero su .webm no esta: se quita.`);
  }
  for (const t of trabajos) {
    const hecho = resultado.tomas?.[t.toma];
    if (!hecho) continue;
    const i0 = hecho.inicio_fotograma;
    nuevo.tomas[t.toma] = {
      archivo: path.basename(t.salida),
      inicio_fotograma: i0,
      inicio_seg: i0 / t.fpsNumero,
      fotogramas: hecho.fotogramas,
      fps: r6(t.fpsNumero),
      franja: t.franja,
      proporcion: r6(t.ancho / (t.franja[1] - t.franja[0])),
      lado: t.lado,
      tramos: t.tramos.map(([a, b]) => [r6(a / t.fpsNumero), r6((b + 1) / t.fpsNumero)]),
      fuente: t.fuente,
    };
  }
  // Arriba, lo de la toma de numero mas alto (compatibilidad con el recorte.json de la prueba).
  const ultima = Object.values(nuevo.tomas).pop();
  if (ultima) {
    nuevo.franja = ultima.franja ?? recorteViejo?.franja ?? null;
    nuevo.fps = ultima.fps ?? recorteViejo?.fps ?? null;
    nuevo.proporcion = ultima.proporcion ?? null;
  }
  fs.writeFileSync(rutaRecorte(carpeta), JSON.stringify(nuevo, null, 2) + '\n');

  fs.rmSync(rutaTrabajo, { force: true });
  fs.rmSync(rutaResultado, { force: true });
  if (limpiar) fs.rmSync(dirTrabajo, { recursive: true, force: true });

  const seg = (Date.now() - t0) / 1000;
  console.log('');
  for (const t of trabajos) {
    const hecho = resultado.tomas?.[t.toma];
    if (!hecho) {
      console.log(`  toma ${t.toma}: NO se recorto. ${resultado.errores?.[t.toma] || ''}`);
      continue;
    }
    const contorno = hecho.borde_contorno
      ? hecho.toca_borde
        ? `contorno de la manga en el borde ${hecho.borde_contorno}`
        : `sin contorno (el cuerpo no toca el borde ${hecho.borde_contorno})`
      : 'sin contorno';
    console.log(
      `  toma ${t.toma}: video/recorte-toma-${t.toma}.webm, ${hecho.fotogramas} fotogramas, ` +
        `${hecho.mascaras_nuevas} mascaras nuevas y ${hecho.mascaras_reusadas} reusadas, ${contorno}`
    );
  }
  const porMascara = resultado.segundos_por_mascara ? `, ${resultado.segundos_por_mascara} s por mascara` : '';
  const ram = resultado.ram_pico_mb ? `, RAM pico ${(resultado.ram_pico_mb / 1024).toFixed(1)} GB` : '';
  console.log(`\n  Listo en ${minutos(seg)}${porMascara}${ram}.`);
  console.log(`  Guardado en ${rutaRecorte(carpeta)}`);
  if (!limpiar && fs.existsSync(dirTrabajo)) {
    console.log(`  Las mascaras quedan en ${RECORTE_HOST.carpetaTrabajo}/ (${mb(pesoDe(dirTrabajo))}); --limpiar las borra.`);
  }
  console.log('  Ahora vuelve a planear (el host recortado entra en lugar de la ventana) y despues el render, solo:');
  console.log(`      npm run plan -- ${carpetaArg}`);
  console.log(`      npm run ensamblar -- ${carpetaArg} --concurrencia 1\n`);
  if (Object.keys(resultado.errores || {}).length) process.exit(1);
}
