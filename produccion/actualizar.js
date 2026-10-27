// Actualiza una carpeta ya instalada del sistema a ESTA version, sin perder
// nada del usuario. Solo modulos de Node, sin dependencias.
//
// Lo corre Claude siguiendo ACTUALIZAR.md, desde la version NUEVA descomprimida
// fuera del proyecto:
//
//   node "<version nueva>/produccion/actualizar.js" "<proyecto>" [--probar] [--restaurar] [--sin-procesos]
//
//   --probar        muestra lo que haria, sin cambiar nada (tambien con
//                   --restaurar: dice que deshace, sin deshacerlo).
//   --restaurar     deshace una actualizacion que quedo a medias. Sirve tambien
//                   el actualizador del propio proyecto:
//                   node produccion/actualizar.js . --restaurar
//                   Si la actualizacion habia terminado y solo quedo la marca
//                   (no se pudo borrar), no deshace nada: quita la marca.
//   --sin-procesos  no mira si hay algo del sistema corriendo (solo si el
//                   usuario confirma que no se esta generando nada en esa carpeta:
//                   el proceso es de otra copia del sistema).
//
// Sale con 0 (listo, o ya estaba al dia), 1 (fallo y dejo el proyecto como
// estaba; o la restauracion no quedo completa y dice que falta; o un error
// inesperado) o 2 (no cambio nada: dice por que). Si ya estaba al dia y la
// ultima actualizacion fue a esta version, nombra su _INFORME.txt (por si los
// pasos de despues de actualizar se cortaron).
//
// QUE ES DE QUIEN
// - Del usuario, nunca se tocan, ni se copian encima, ni se borran: temp/ (sus
//   anuncios), output/ (sus MP4), respaldos/, mis_archivos/, .env (y .env.*
//   menos .env.example), PERSONALIZACION.md, .flow-listo,
//   .instalacion-pendiente.md, todo .claude/ MENOS .claude/skills/ (aunque una
//   version vieja lo haya traido: .claude/launch.json de la version Google Flow
//   del 2026-10-16 se queda), node_modules/ (en cualquier nivel), remotion/out/,
//   .git/ y .agents/. Tampoco nada que no sea del sistema fuera de sus carpetas
//   (una foto o una nota suelta en la raiz se queda donde esta).
// - Del sistema: lo que trae la version nueva, menos eso. Las skills
//   (.claude/skills/ y skills/*.skill) SI son del sistema y se actualizan; las
//   skills propias del usuario (un nombre que ninguna version trajo) no se tocan.
// - Lo que el sistema genera solo y no es ni del sistema ni del usuario
//   (GENERADOS: __pycache__, *.skill.bak de skills-sync, .DS_Store...) no se
//   copia, no cuenta como cambio a mano y no se mueve: se deja como esta. Las
//   unicas excepciones: los __pycache__ de las carpetas del sistema se borran
//   al final (son cache, Python los rehace solo) y los restos de una
//   herramienta que la version nueva ya no trae (OBSOLETOS: el estado del
//   estudio de Remotion, remotion/.estudio-*.json) se quitan con respaldo.
// - Un archivo es "del sistema publicado" si su huella es la de una version
//   publicada (produccion/huellas-versiones.json, que arma
//   produccion/huellas-versiones.js) o la de lo instalado en la ultima
//   actualizacion (respaldos/_huellas_instaladas.json). Si un archivo del
//   sistema no es ninguna de esas, se cambio a mano: se reemplaza igual, se
//   respalda y el informe dice "CAMBIADO A MANO" y donde quedo el del usuario.
//   Los que reescriben las herramientas solas (SE_REGENERAN: los
//   package-lock.json, que reescribe npm, y skills/*.skill, que arma
//   skills-sync desde .claude/skills) nunca cuentan como cambio a mano.
// - Lo que sobra en las carpetas del sistema (CARPETAS_DEL_SISTEMA): si era del
//   sistema, se quita; si es del usuario, se mueve a mis_archivos/ con su ruta
//   (mis_archivos/produccion/mi-script.js). Fuera de esas carpetas solo se
//   quita lo que era del sistema en una version vieja, ya no viene y esta
//   igual a como vino (un documento de la raiz que la version nueva deja de
//   traer); nunca lo del usuario de arriba.
//
// QUE VERSION TIENE INSTALADA
// - La que dice VERSION. Las de antes del actualizador no lo traen: se
//   reconocen por las huellas (la version publicada que mas se parece). Si la
//   que mas se parece es la nueva, "ya esta al dia" solo si todo lo del sistema
//   ya es igual a la nueva; si no, es un zip armado antes de sellar esa
//   version (le faltan archivos de ella): se actualiza como desde la anterior.
//
// COMO NO PIERDE NADA
// - Antes de cambiar nada copia lo que se reemplaza, se quita o se mueve (y
//   produccion/ y remotion/src/ enteras) en respaldos/<fecha>_<hora>_desde_<version>/
//   y escribe respaldos/ACTUALIZACION_EN_CURSO.json: si algo falla o se corta
//   (se cerro la ventana, se apago la PC), el proyecto vuelve a quedar como
//   estaba (al correrlo de nuevo, primero restaura). Los respaldos nunca se
//   borran.
// - Cada archivo se copia a un temporal al lado (...actualizando) y despues se
//   renombra encima: nunca queda un archivo a medio escribir.
// - En Windows un archivo abierto (OneDrive, el antivirus, el Explorador) no se
//   deja copiar ni borrar por un momento: se reintenta.
// - produccion/actualizar.js y CLAUDE.md se copian primero y se restauran al
//   final: mientras la actualizacion este a medias, el CLAUDE.md nuevo avisa de
//   la marca y el actualizador esta en el proyecto para --restaurar.
// - VERSION se escribe al final, si todo salio bien: una actualizacion cortada
//   nunca parece terminada.
// - La restauracion no se corta en el primer archivo que no puede escribir:
//   intenta todo, reintenta al final lo que estaba abierto en otro programa y,
//   si algo sigue sin poderse, deja la marca y dice que falta.
// - Si la marca quedo pero la actualizacion habia terminado (VERSION y
//   respaldos/_huellas_instaladas.json ya son de ella: solo fallo borrar la
//   marca), no se deshace nada: solo se quita la marca.
// - Si no se puede deshacer porque falta el respaldo (alguien borro archivos de
//   respaldos/) o la marca esta danada, se devuelve lo que se pueda y, con la
//   version nueva, se termina la actualizacion hacia adelante: copia todo lo
//   del sistema con un respaldo nuevo de como quedo. La marca vieja queda en
//   respaldos/ con otro nombre. temp/, output/ y .env no se tocaron nunca.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** La version nueva: la carpeta que tiene este produccion/. */
export const NUEVA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** Las huellas de las versiones publicadas (las escribe produccion/huellas-versiones.js). */
export const HUELLAS = 'produccion/huellas-versiones.json';
const ESTE = 'produccion/actualizar.js';

/** Carpetas de la raiz que son del usuario (o que se instalan en cada maquina). */
const RAIZ_DEL_USUARIO = new Set(['temp', 'output', 'respaldos', 'mis_archivos', '.git', '.agents', 'node_modules']);
/** Rutas (con todo lo que tengan adentro) que son del usuario. Todo .claude/ menos las skills, tambien: claudeNoSkills(). */
const RUTAS_DEL_USUARIO = ['remotion/node_modules', 'remotion/out'];
/** Archivos de la raiz que son del usuario o de cada instalacion. */
const ARCHIVOS_DEL_USUARIO = new Set(['PERSONALIZACION.md', '.flow-listo', '.instalacion-pendiente.md']);

/**
 * Lo que el sistema genera solo: no es del sistema publicado ni del usuario.
 * Nunca se copia ni se mueve ni cuenta como cambio a mano (ver arriba).
 */
const GENERADOS = [
  /(^|\/)__pycache__(\/|$)/, // cache de Python (recortar-host.py, tapar-huecos.py)
  /\.py[co]$/i,
  /\.skill\.bak$/i, // respaldos que deja skills-sync --empaquetar
  /(^|\/)(\.DS_Store|Thumbs\.db|desktop\.ini)$/i, // los deja el sistema operativo
  /(^|\/)npm-debug\.log/i,
  /^remotion\/\.estudio-[^/]*\.json$/, // estado del estudio de Remotion (version Google Flow hasta el 2026-10-16)
  /^remotion\/\.props-remotion\.json$/, // los props de un render (ensamblar.js los borra al terminar)
];

/**
 * Restos de una herramienta que la version nueva ya no trae: si la version
 * nueva no tiene `sin`, se quitan con respaldo (no los usa nada). El estudio
 * de Remotion (produccion/estudio.js) salio de la version Google Flow el
 * 2026-10-17 y su estado quedaba en remotion/.estudio-*.json.
 */
const OBSOLETOS = [{ re: /^remotion\/\.estudio-[^/]*\.json$/, sin: 'produccion/estudio.js', que: 'el estado del estudio de Remotion' }];

/**
 * Archivos que reescriben las herramientas solas: se respaldan y se
 * reemplazan como cualquiera, pero nunca cuentan como "cambiados a mano".
 * npm reescribe los package-lock.json al instalar, y los skills/*.skill son el
 * paquete que arma skills-sync desde .claude/skills (lo que se edita a mano
 * es el SKILL.md, y ese si se revisa).
 */
const SE_REGENERAN = [/(^|\/)package-lock\.json$/, /^skills\/[^/]+\.skill$/];

/** Distintos en cada version: nunca cuentan como cambio a mano y no se sellan. */
const CAMBIAN_SIEMPRE = new Set(['VERSION', HUELLAS]);

/**
 * Carpetas que son enteras del sistema: lo que sobra adentro se quita (si era
 * del sistema) o se mueve a mis_archivos/ (si es del usuario). En skills/ y
 * .claude/skills/ las skills propias del usuario se quedan donde estan.
 */
const CARPETAS_DEL_SISTEMA = ['produccion', 'remotion/src', 'recursos', 'ejemplo-anuncio', 'skills', '.claude/skills'];
/** El codigo: se respalda entero y al final no puede sobrar nada adentro. */
const CARPETAS_DE_CODIGO = ['produccion', 'remotion/src'];

/**
 * Los dos sistemas que usan este actualizador (el codigo es el mismo en los
 * dos). produccion/huellas-versiones.json dice de cual es cada version; las
 * versiones de antes del actualizador no lo traen y se reconocen por su marca
 * (la version Google Flow es la unica con produccion/flow/flow.js).
 */
export const SISTEMAS = {
  'sistema-anuncios-ia': { nombre: 'la version por API (imagenes y videos con kie.ai)', marca: null },
  'anuncios-ia-flow': { nombre: 'la version Google Flow (imagenes y videos en Google Flow)', marca: 'produccion/flow/flow.js' },
};

const MARCA = 'ACTUALIZACION_EN_CURSO.json';
const INSTALADO = '_huellas_instaladas.json';
const INFORME = '_INFORME.txt';
/** En un respaldo mientras se hace: si queda, se corto antes de cambiar nada. */
const INCOMPLETO = '_RESPALDO_INCOMPLETO.txt';
/** La copia a medio escribir de un archivo, antes de renombrarla encima. */
const TEMPORAL = '.actualizando';
/**
 * Se copian primero, en este orden (el CLAUDE.md nuevo manda a usar el
 * actualizador: tiene que estar antes), y se restauran al final, al reves.
 */
const PRIMERO = [ESTE, 'CLAUDE.md'];
const MB = 2 ** 20;
/** Desde este tamano la huella va sin normalizar los saltos de linea. */
const GRANDE = 20 * MB;
const RE_VERSION = /^\d{4}-\d{2}-\d{2}[a-z]?$/;
const RE_RESPALDO = /^\d{4}-\d{2}-\d{2}_\d{4}_desde_.+/;
const EXT_VIDEO = /\.(mp4|mov|webm|mkv)$/i;

// ---------- que es del sistema y sus huellas (huellas-versiones.js usa las mismas) ----------

const esEnv = (nombre) => /^\.env(\..+)?$/i.test(nombre) && nombre.toLowerCase() !== '.env.example';

/**
 * True si es algo de .claude/ que no son las skills (archivo o carpeta): es
 * del usuario (sus permisos, la configuracion de Claude Code, las copias de
 * trabajo de .claude/worktrees...). .claude/skills es la carpeta de las skills.
 */
const claudeNoSkills = (rel) => rel.startsWith('.claude/') && rel !== '.claude/skills' && !rel.startsWith('.claude/skills/');

/** rel: ruta relativa con "/". True si es del usuario (o se instala en cada maquina). */
export function delUsuario(rel) {
  const partes = rel.split('/');
  return (
    RAIZ_DEL_USUARIO.has(partes[0]) ||
    partes.includes('node_modules') ||
    RUTAS_DEL_USUARIO.some((r) => rel === r || rel.startsWith(`${r}/`)) ||
    ARCHIVOS_DEL_USUARIO.has(rel) ||
    claudeNoSkills(rel) ||
    esEnv(partes[partes.length - 1])
  );
}

export const esGenerado = (rel) => GENERADOS.some((re) => re.test(rel));
const seRegenera = (rel) => SE_REGENERAN.some((re) => re.test(rel));

/**
 * True si el archivo entra en las huellas de una version: todo lo que viaja en
 * el zip menos VERSION y las huellas (cambian en cada version), lo del usuario
 * (tambien lo de .claude/ que no son skills) y lo generado.
 */
export function seSella(rel) {
  return !CAMBIAN_SIEMPRE.has(rel) && !delUsuario(rel) && !esGenerado(rel) && !rel.endsWith(TEMPORAL);
}

/** True si es un archivo que el actualizador copia de la version nueva. */
export function esDelSistema(rel) {
  return CAMBIAN_SIEMPRE.has(rel) || seSella(rel);
}

const aRel = (f, raiz) => path.relative(raiz, f).split(path.sep).join('/');
const esArchivo = (f) => {
  try {
    return fs.statSync(f).isFile();
  } catch {
    return false;
  }
};

/**
 * Los archivos de una carpeta, como rutas relativas a `raiz` con "/", que
 * cumplen `filtro`. No entra en lo del usuario ni en __pycache__. Los enlaces
 * simbolicos no cuentan.
 */
export function listar(raiz, filtro = () => true, sub = '') {
  const out = [];
  let entradas;
  try {
    entradas = fs.readdirSync(path.join(raiz, sub), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const d of entradas) {
    const rel = sub ? `${sub}/${d.name}` : d.name;
    if (d.isDirectory()) {
      if (delUsuario(rel) || d.name === '__pycache__') continue;
      out.push(...listar(raiz, filtro, rel));
    } else if (d.isFile() && filtro(rel)) out.push(rel);
  }
  return out.sort();
}

/** {ruta relativa: archivo} de todo lo del sistema que hay en una carpeta (la version nueva). */
function archivosDelSistema(raiz) {
  return Object.fromEntries(listar(raiz, esDelSistema).map((rel) => [rel, path.join(raiz, rel)]));
}

const CRLF = Buffer.from('\r\n');

/** El contenido con CRLF cambiado por LF (como bytes.replace de Python). */
function sinCRLF(buf) {
  let i = buf.indexOf(CRLF);
  if (i < 0) return buf;
  const partes = [];
  let desde = 0;
  while (i >= 0) {
    partes.push(buf.subarray(desde, i));
    desde = i + 1; // se salta el \r y queda el \n
    i = buf.indexOf(CRLF, desde);
  }
  partes.push(buf.subarray(desde));
  return Buffer.concat(partes);
}

/**
 * sha256 del contenido. CRLF cuenta como LF: git, un editor de Windows o un
 * descompresor cambian los saltos de linea sin cambiar nada mas, y eso no es
 * un cambio del usuario. Desde GRANDE, tal cual.
 */
export function huellaBytes(buf) {
  return crypto
    .createHash('sha256')
    .update(buf.length > GRANDE ? buf : sinCRLF(buf))
    .digest('hex');
}

export function huella(f) {
  const tam = fs.statSync(f).size;
  if (tam <= GRANDE) return huellaBytes(fs.readFileSync(f));
  const h = crypto.createHash('sha256');
  const fd = fs.openSync(f, 'r');
  const b = Buffer.alloc(MB);
  try {
    let n;
    while ((n = fs.readSync(fd, b, 0, MB, null)) > 0) h.update(b.subarray(0, n));
  } finally {
    fs.closeSync(fd);
  }
  return h.digest('hex');
}

/** Lee produccion/huellas-versiones.json: { sistema, versiones: {version: {ruta: huella}} }, o null. */
export function leerHuellas(f) {
  try {
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (j && typeof j === 'object' && j.versiones && typeof j.versiones === 'object') {
      return { sistema: typeof j.sistema === 'string' ? j.sistema : null, versiones: j.versiones };
    }
  } catch {
    // no esta o no se puede leer: como si no hubiera huellas
  }
  return null;
}

// ---------- copiar, mover y borrar sin perder nada ----------

/** Pausa sin ocupar el procesador (el actualizador es todo sincronico). */
const dormir = (s) => {
  if (s > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, s * 1000);
};

/** Segundos entre intentos; la restauracion los quita mientras reintenta al final. */
let ESPERAS = [2, 2, 2];
/** Los errores de un archivo que otro programa tiene abierto (o de solo lectura). */
const bloqueado = (e) => !!e && typeof e === 'object' && ['EPERM', 'EACCES', 'EBUSY'].includes(e.code);

/** Un archivo abierto en otro programa no se deja copiar ni borrar por un momento: 3 reintentos cada 2 s. */
function reintentar(accion) {
  const esperas = [...ESPERAS, null];
  for (const espera of esperas) {
    try {
      return accion();
    } catch (e) {
      if (espera === null || !bloqueado(e)) throw e;
      dormir(espera);
    }
  }
  return undefined;
}

/** Le quita el solo lectura a f. Devuelve el modo de antes (para volver a ponerlo si algo falla) o null. */
function escribible(f) {
  if (!esArchivo(f)) return null;
  try {
    fs.accessSync(f, fs.constants.W_OK);
    return null;
  } catch {
    const modo = fs.statSync(f).mode & 0o777;
    fs.chmodSync(f, modo | 0o200);
    return modo;
  }
}

function volverModo(f, modo) {
  if (modo === null) return;
  try {
    fs.chmodSync(f, modo);
  } catch {
    // si no se puede, queda escribible: no se pierde nada
  }
}

/** Borra un archivo propio del actualizador (un temporal), sin reintentos ni errores. */
function quitar(f) {
  try {
    if (esArchivo(f)) {
      escribible(f);
      fs.unlinkSync(f);
    }
  } catch {
    // es un temporal: si no se pudo, se quita en la proxima corrida
  }
}

/**
 * Copia a un temporal al lado y lo renombra encima: si se corta, el destino
 * queda entero (el de antes o el nuevo). Si no se puede, el destino queda como
 * estaba, tambien su solo lectura. Conserva la fecha del original.
 */
function copiar(origen, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const tmp = destino + TEMPORAL;
  const modo = escribible(destino);
  try {
    reintentar(() => {
      quitar(tmp);
      fs.copyFileSync(origen, tmp);
      try {
        const st = fs.statSync(origen);
        fs.utimesSync(tmp, st.atime, st.mtime);
      } catch {
        // sin la fecha original la copia vale igual
      }
      fs.renameSync(tmp, destino);
    });
  } catch (e) {
    volverModo(destino, modo);
    throw e;
  } finally {
    quitar(tmp);
  }
}

function mover(origen, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  reintentar(() => fs.renameSync(origen, destino));
}

function borrar(f) {
  if (!esArchivo(f)) return;
  const modo = escribible(f);
  try {
    reintentar(() => fs.unlinkSync(f));
  } catch (e) {
    volverModo(f, modo);
    throw e;
  }
}

/** Solo para carpetas que creo el actualizador (un respaldo que no se termino): tambien lo de solo lectura. */
function borrarCarpeta(d) {
  try {
    fs.rmSync(d, { recursive: true, force: true });
    return;
  } catch {
    // algun archivo de solo lectura: se le quita y se vuelve a intentar
  }
  const todos = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) todos(f);
      else {
        try {
          fs.chmodSync(f, 0o666);
        } catch {
          // sigue con el resto
        }
      }
    }
  };
  try {
    todos(d);
    fs.rmSync(d, { recursive: true, force: true });
  } catch {
    // lo que quede, lo limpia la proxima corrida (tiene _RESPALDO_INCOMPLETO.txt)
  }
}

/** Quita las copias a medio escribir (...actualizando) que dejo un corte, fuera de lo del usuario. */
function sinTemporales(p) {
  for (const rel of listar(p, (r) => r.endsWith(TEMPORAL))) quitar(path.join(p, rel));
}

/**
 * Lo que deja una corrida cortada antes de cambiar nada: copias a medias, la
 * marca a medio escribir y el respaldo que no se termino (tiene
 * _RESPALDO_INCOMPLETO.txt: ninguna marca lo uso, el proyecto no se toco).
 */
function limpiarRestos(p) {
  sinTemporales(p);
  const r = path.join(p, 'respaldos');
  quitar(path.join(r, `${MARCA}.tmp`));
  try {
    for (const d of fs.existsSync(r) ? fs.readdirSync(r, { withFileTypes: true }) : []) {
      if (!d.isDirectory() || !RE_RESPALDO.test(d.name)) continue;
      const dir = path.join(r, d.name);
      if (esArchivo(path.join(dir, INCOMPLETO))) borrarCarpeta(dir);
      else if (!fs.readdirSync(dir).length) fs.rmdirSync(dir);
    }
  } catch {
    // no impide seguir: lo que quede se limpia la proxima vez
  }
}

/** Las unicas carpetas que se borran sin respaldo: los __pycache__ de las carpetas del sistema (son cache). */
function sinPycache(p) {
  const buscar = (dir) => {
    let entradas;
    try {
      entradas = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entradas) {
      if (!e.isDirectory() || e.name === 'node_modules') continue;
      const f = path.join(dir, e.name);
      if (e.name === '__pycache__') fs.rmSync(f, { recursive: true, force: true });
      else buscar(f);
    }
  };
  for (const c of ['produccion', 'recursos', 'remotion/src']) buscar(path.join(p, c));
}

/** f, o f_2, f_3... si ya existe: nunca se pisa nada. */
function libre(f, carpeta = false) {
  let g = f;
  let n = 2;
  const ext = path.extname(f);
  while (fs.existsSync(g)) {
    g = carpeta ? `${f}_${n}` : path.join(path.dirname(f), `${path.basename(f, ext)}_${n}${ext}`);
    n += 1;
  }
  return g;
}

/** Los archivos de una carpeta del proyecto (sin lo generado ni copias a medio escribir), como rutas relativas. */
function archivosEn(p, carpeta) {
  return listar(p, (rel) => rel.startsWith(`${carpeta}/`) && !esGenerado(rel) && !rel.endsWith(TEMPORAL), carpeta);
}

/** La ruta tal como esta en el proyecto (Windows y Mac no distinguen mayusculas), o null si no existe. */
function rutaReal(p, rel) {
  const f = path.join(p, rel);
  if (!esArchivo(f)) return null;
  const nombres = fs.readdirSync(path.dirname(f));
  const base = path.basename(f);
  if (nombres.includes(base)) return rel;
  const otro = nombres.find((n) => n.toLowerCase() === base.toLowerCase()) || base;
  return path.posix.join(path.posix.dirname(rel), otro);
}

/** Byte a byte. */
function iguales(a, b) {
  if (fs.statSync(a).size !== fs.statSync(b).size) return false;
  const fa = fs.openSync(a, 'r');
  const fb = fs.openSync(b, 'r');
  const ba = Buffer.alloc(MB);
  const bb = Buffer.alloc(MB);
  try {
    for (;;) {
      const na = fs.readSync(fa, ba, 0, MB, null);
      const nb = fs.readSync(fb, bb, 0, MB, null);
      if (na !== nb) return false;
      if (na === 0) return true;
      if (!ba.subarray(0, na).equals(bb.subarray(0, nb))) return false;
    }
  } finally {
    fs.closeSync(fa);
    fs.closeSync(fb);
  }
}

/** Cuantos archivos y bytes hay en temp/ y output/, y la huella de .env: al final tienen que dar lo mismo. */
function datos(p) {
  const out = {};
  for (const d of ['temp', 'output']) {
    let n = 0;
    let b = 0;
    const recorrer = (dir) => {
      let entradas;
      try {
        entradas = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entradas) {
        const f = path.join(dir, e.name);
        if (e.isDirectory()) recorrer(f);
        else if (e.isFile()) {
          n += 1;
          b += fs.statSync(f).size;
        }
      }
    };
    recorrer(path.join(p, d));
    out[d] = [n, b];
  }
  out['.env'] = crypto.createHash('sha256').update(fs.readFileSync(path.join(p, '.env'))).digest('hex');
  return out;
}

/** Para el informe: las carpetas de anuncio de temp/ y los videos de output/. */
function resumenDatos(p) {
  const anuncios = (() => {
    try {
      return fs
        .readdirSync(path.join(p, 'temp'), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort();
    } catch {
      return [];
    }
  })();
  const videos = listarTodo(path.join(p, 'output')).filter((f) => EXT_VIDEO.test(f));
  return { anuncios, videos };
}

/** Todos los archivos de una carpeta (rutas relativas), sin filtro: para mirar lo del usuario. */
function listarTodo(dir, sub = '') {
  const out = [];
  let entradas;
  try {
    entradas = fs.readdirSync(path.join(dir, sub), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entradas) {
    const rel = sub ? `${sub}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listarTodo(dir, rel));
    else if (e.isFile()) out.push(rel);
  }
  return out;
}

// ---------- revisar antes de empezar ----------

const normal = (f) => {
  const r = path.resolve(f).replace(/[\\/]+$/, '');
  return process.platform === 'win32' || process.platform === 'darwin' ? r.toLowerCase() : r;
};

function dentro(a, b) {
  const x = normal(a);
  const y = normal(b);
  return x === y || x.startsWith(y + path.sep);
}

/** null si es un proyecto instalado que se puede actualizar; si no, el motivo. */
function revisarProyecto(p) {
  if (!fs.existsSync(p) || !fs.statSync(p).isDirectory()) return `no existe la carpeta ${p}`;
  if (dentro(p, NUEVA)) {
    return (
      'el proyecto es la version nueva (o una carpeta dentro de ella): el proyecto es la carpeta del usuario con sus ' +
      'anuncios en temp/ y su .env, abierta en Claude Code; la version nueva nunca se abre ni se pasa como proyecto'
    );
  }
  if (dentro(NUEVA, p)) {
    // la carpeta que bajo el usuario (en Mac, Safari descomprime solo) o un zip descomprimido dentro del proyecto
    return (
      `la version nueva esta dentro del proyecto (${path.relative(p, NUEVA)}): tiene que quedar fuera. Si es la ` +
      'carpeta que descargo el usuario, que la saque de su carpeta del sistema (o que pase el zip); si es el zip ' +
      'descomprimido ahi, descomprimelo fuera del proyecto, como dice ACTUALIZAR.md'
    );
  }
  // Las pruebas del actualizador corren en la carpeta temporal: solo ellas se saltan esto.
  if (process.env.ANUNCIOS_ACTUALIZAR_PRUEBA !== '1') {
    const temporales = [process.env.TEMP, process.env.TMP, os.tmpdir()].filter(Boolean);
    if (temporales.some((t) => dentro(p, t))) return `${p} esta en la carpeta temporal: es una version descomprimida, no tu proyecto`;
  }
  const partes = normal(p).split(path.sep);
  if (partes.some((x, i) => x === '.claude' && partes[i + 1] === 'worktrees')) {
    return 'esta carpeta es una copia de trabajo de Claude Code (.claude/worktrees): usa la carpeta original';
  }
  for (const falta of ['produccion', 'CLAUDE.md', 'package.json']) {
    if (!fs.existsSync(path.join(p, falta))) {
      return `${p} no es la carpeta del sistema (le falta ${falta}): abre la que tiene tus anuncios en temp/ y tu .env`;
    }
  }
  if (!esArchivo(path.join(p, '.env'))) return 'el sistema no esta instalado en esta carpeta (no tiene .env): sigue INSTALAR.md, no actualices';
  return null;
}

/**
 * Las lineas de comando de los procesos de este sistema que estan corriendo:
 * node o python con una ruta dentro del proyecto (un render de Remotion, un
 * script lanzado con ruta completa) o con un script de produccion/ (lo que
 * lanza npm run: "node produccion/generar-videos.js temp/x"; eso puede ser de
 * otra copia del sistema, y para eso esta --sin-procesos). null si no se pudo
 * mirar.
 */
function procesosDelSistema(p) {
  let r;
  try {
    if (process.platform === 'win32') {
      r = spawnSync(
        'powershell',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          '[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-CimInstance Win32_Process -Filter ' +
            "\"Name like 'node%' or Name like 'python%' or Name = 'py.exe'\" | " +
            "ForEach-Object { [string]$_.ProcessId + ' ' + $_.CommandLine }",
        ],
        { encoding: 'utf8', timeout: 60000, windowsHide: true, maxBuffer: 16 * MB }
      );
    } else {
      r = spawnSync('ps', ['-eo', 'pid=,args='], { encoding: 'utf8', timeout: 60000, maxBuffer: 16 * MB });
    }
  } catch {
    return null;
  }
  if (r.error || r.status !== 0) return null;
  const yo = new Set([process.pid, process.ppid]);
  const raiz = `${normal(p).replace(/\\/g, '/').toLowerCase()}/`;
  const script = /(^|[\s"'=/])produccion\/[\w.-]+\.(c|m)?(js|py)\b/;
  const out = [];
  for (const linea of r.stdout.split(/\r?\n/)) {
    const m = /^\s*(\d+)\s+(.*)$/.exec(linea);
    if (!m || yo.has(Number(m[1]))) continue;
    const comando = m[2].trim();
    if (process.platform !== 'win32') {
      const programa = path.basename(comando.split(/\s+/)[0] || '');
      if (!/^(node|python[\d.]*|py)$/i.test(programa)) continue;
    }
    const c = comando.replace(/\\/g, '/').toLowerCase();
    // la linea entera (con un tope por si es enorme): la carpeta del proceso es lo que dice si es de
    // esta copia del sistema o de otra (para --sin-procesos), y suele venir despues del programa
    if (c.includes(raiz) || script.test(c)) out.push(`PID ${m[1]}: ${comando.length > 1500 ? `${comando.slice(0, 1500)}...` : comando}`);
  }
  return out;
}

export function leerVersion(carpeta) {
  try {
    return fs.readFileSync(path.join(carpeta, 'VERSION'), 'utf8').replace(/^\uFEFF/, '').trim() || null;
  } catch {
    return null;
  }
}

/** De que sistema es una carpeta (ver SISTEMAS). */
function sistemaDe(p) {
  const h = leerHuellas(path.join(p, HUELLAS));
  if (h && h.sistema) return h.sistema;
  const conMarca = Object.entries(SISTEMAS).find(([, s]) => s.marca && esArchivo(path.join(p, s.marca)));
  if (conMarca) return conMarca[0];
  return (Object.entries(SISTEMAS).find(([, s]) => !s.marca) || [null])[0];
}

const nombreSistema = (s) => (SISTEMAS[s] ? SISTEMAS[s].nombre : `"${s}"`);

/**
 * Las huellas de las versiones publicadas ({version: {ruta: huella}}) y
 * Map(ruta -> Set de huellas conocidas), sumando las que traia el proyecto y
 * el registro de lo instalado en la ultima actualizacion.
 */
function cargarHuellas(p) {
  const publicadas = {};
  for (const f of [path.join(p, HUELLAS), path.join(NUEVA, HUELLAS)]) {
    const h = leerHuellas(f);
    if (h) Object.assign(publicadas, h.versiones);
  }
  const conocidas = new Map();
  const sumar = (rel, h) => {
    if (!conocidas.has(rel)) conocidas.set(rel, new Set());
    conocidas.get(rel).add(h);
  };
  for (const arch of Object.values(publicadas)) for (const [rel, h] of Object.entries(arch)) sumar(rel, h);
  try {
    const registro = JSON.parse(fs.readFileSync(path.join(p, 'respaldos', INSTALADO), 'utf8'));
    for (const [rel, h] of Object.entries(registro.archivos || {})) sumar(rel, h);
  } catch {
    // no hay registro (nunca se actualizo con el actualizador)
  }
  return { publicadas, conocidas };
}

/**
 * [version para comparar, como se le dice al usuario]. Sin VERSION se reconoce
 * por las huellas: la version publicada que mas se parece (archivos iguales
 * menos archivos distintos o que faltan; a igualdad, la mas nueva). Si ninguna
 * se parece (menos de la cuarta parte de sus archivos iguales), ['', ''].
 */
function versionInstalada(p, publicadas) {
  const v = leerVersion(p);
  if (v) return [v, v];
  const cache = new Map();
  const suya = (rel) => {
    if (!cache.has(rel)) cache.set(rel, rutaReal(p, rel) === rel ? huella(path.join(p, rel)) : null);
    return cache.get(rel);
  };
  let mejor = '';
  let puntos = -Infinity;
  let parecido = 0;
  for (const [ver, arch] of Object.entries(publicadas).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    let si = 0;
    let no = 0;
    for (const [rel, h] of Object.entries(arch)) {
      if (CAMBIAN_SIEMPRE.has(rel)) continue;
      if (suya(rel) === h) si += 1;
      else no += 1;
    }
    if (si && si - no >= puntos) {
      mejor = ver;
      puntos = si - no;
      parecido = si / (si + no);
    }
  }
  if (!mejor || parecido < 0.25) return ['', ''];
  return [mejor, `${mejor} (sin VERSION)`];
}

// ---------- el plan, el respaldo y la vuelta atras ----------

const nombreDeSkill = (rel) => (/^\.claude\/skills\/([^/]+)\//.exec(rel) || /^skills\/([^/]+)\.skill$/.exec(rel) || [])[1] || null;

/** Que se copia, que se reemplaza, que se quita y que se mueve a mis_archivos/. No cambia nada. */
function planear(p, nueva, conocidas) {
  const plan = { nuevos: [], reemplazar: [], iguales: [], a_mano: [], quitar: [], restos: [], mover: [], propias: [], antes: {} };
  // como estaban las librerias antes (para las lineas INSTALAR)
  for (const rel of ['package.json', 'package-lock.json', 'remotion/package.json', 'remotion/package-lock.json']) {
    plan.antes[rel] = esArchivo(path.join(p, rel)) ? huella(path.join(p, rel)) : null;
  }
  for (const [rel, f] of Object.entries(nueva)) {
    if (rel === 'VERSION') continue;
    let real = rutaReal(p, rel);
    if (real && real !== rel) {
      // el mismo archivo con otras mayusculas: se quita el viejo y se copia el nuevo
      plan.quitar.push(real);
      real = null;
    }
    if (real === null) plan.nuevos.push(rel);
    else if (iguales(f, path.join(p, rel))) plan.iguales.push(rel);
    else {
      plan.reemplazar.push(rel);
      if (!CAMBIAN_SIEMPRE.has(rel) && !seRegenera(rel)) {
        const h = huella(path.join(p, rel));
        if (h !== huella(f) && !(conocidas.get(rel) && conocidas.get(rel).has(h))) plan.a_mano.push(rel);
      }
    }
  }
  const sistema = new Set(Object.keys(nueva).map((r) => r.toLowerCase()));
  const skillsNuevas = new Set(Object.keys(nueva).map(nombreDeSkill).filter(Boolean));
  const skillsConocidas = new Set([...conocidas.keys()].map(nombreDeSkill).filter(Boolean));
  // lo que sobra en las carpetas del sistema: del sistema viejo se quita, del usuario se mueve
  for (const carpeta of CARPETAS_DEL_SISTEMA) {
    for (const rel of archivosEn(p, carpeta)) {
      if (sistema.has(rel.toLowerCase()) || plan.quitar.includes(rel)) continue;
      const skill = nombreDeSkill(rel);
      if (skill && !skillsNuevas.has(skill)) {
        // una skill que la version nueva no trae: si ninguna version la trajo es del usuario y no
        // se toca; si era del sistema, abajo se quita solo si esta igual a como vino
        if (!skillsConocidas.has(skill) && !plan.propias.includes(skill)) plan.propias.push(skill);
        continue;
      }
      if (conocidas.get(rel) && conocidas.get(rel).has(huella(path.join(p, rel)))) plan.quitar.push(rel);
      else plan.mover.push([rel, aRel(libre(path.join(p, 'mis_archivos', ...rel.split('/'))), p)]);
    }
  }
  // en el resto: solo lo que era del sistema en una version vieja, ya no viene y esta igual a como vino
  const movidos = new Set(plan.mover.map(([o]) => o));
  for (const [rel, hs] of [...conocidas.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (sistema.has(rel.toLowerCase()) || plan.quitar.includes(rel) || movidos.has(rel)) continue;
    if (CAMBIAN_SIEMPRE.has(rel) || delUsuario(rel) || esGenerado(rel)) continue;
    if (rutaReal(p, rel) === rel && hs.has(huella(path.join(p, rel)))) plan.quitar.push(rel);
  }
  // los restos de una herramienta que la version nueva ya no trae
  for (const o of OBSOLETOS) {
    if (nueva[o.sin]) continue;
    for (const rel of listar(p, (r) => o.re.test(r), 'remotion')) {
      if (!plan.quitar.includes(rel)) {
        plan.quitar.push(rel);
        plan.restos.push(rel);
      }
    }
  }
  plan.propias.sort();
  return plan;
}

/** Vuelve a poner el archivo del respaldo. Si ya esta igual, no lo copia (solo le devuelve el solo lectura). */
function devolver(resp, p, rel) {
  let real = rutaReal(p, rel);
  if (real && real !== rel) {
    // quedo con otras mayusculas (en Windows CLAUDE.md y claude.md son uno)
    borrar(path.join(p, real));
    real = null;
  }
  const r = path.join(resp, rel);
  const f = path.join(p, rel);
  if (real && iguales(r, f)) {
    const puede = (x) => {
      try {
        fs.accessSync(x, fs.constants.W_OK);
        return true;
      } catch {
        return false;
      }
    };
    if (puede(r) !== puede(f)) fs.chmodSync(f, fs.statSync(r).mode & 0o777);
    return;
  }
  copiar(r, f);
}

/** Hace una tarea de la restauracion. null si quedo hecha; si no, el error o el motivo. */
function tarea(p, resp, t) {
  try {
    if (t[0] === 'devolver') devolver(resp, p, t[1]);
    else if (t[0] === 'quitar') borrar(path.join(p, t[1])); // lo que la actualizacion agrego (y no habia)
    else {
      // "movido": su original vuelve con el respaldo; se quita la copia de mis_archivos/ si es identica
      const [, origen, destino] = t;
      const fd = path.join(p, destino);
      const fr = path.join(resp, origen);
      if (esArchivo(fd) && esArchivo(fr) && iguales(fr, fd)) {
        const fo = path.join(p, origen);
        if (!(esArchivo(fo) && iguales(fr, fo))) return `${origen} todavia no volvio a su lugar`;
        borrar(fd);
      }
    }
    return null;
  } catch (e) {
    return e;
  }
}

/**
 * Intenta todas las tareas sin cortarse en la primera que falla. Las que
 * fallan porque un archivo esta abierto en otro programa se reintentan al
 * final, hasta 10 veces cada 3 s. Devuelve las que no se pudieron, con su motivo.
 */
function hacer(p, resp, tareas) {
  let pendientes = [];
  for (const t of tareas) {
    const e = tarea(p, resp, t);
    if (e !== null) pendientes.push([t, e]);
  }
  const guardadas = ESPERAS;
  ESPERAS = [];
  try {
    for (let i = 0; i < 10; i += 1) {
      if (!pendientes.some(([, e]) => typeof e === 'string' || bloqueado(e))) break;
      dormir(3);
      pendientes = pendientes.map(([t]) => [t, tarea(p, resp, t)]).filter(([, e]) => e !== null);
    }
  } finally {
    ESPERAS = guardadas;
  }
  return pendientes;
}

function motivo(t, e) {
  const rel = t[0] === 'movido' ? t[2] : t[1];
  if (typeof e === 'string') return `${rel} (${e})`;
  if (bloqueado(e)) return `${rel} (esta abierto en otro programa)`;
  if (e && e.code === 'ENOENT') return `${rel} (falta en el respaldo: ${e.path || ''})`;
  return `${rel} (${e && e.message ? e.message : e})`;
}

/**
 * La marca de la actualizacion a medias: { m } si se puede leer; si no,
 * { error } (abierta en otro programa, o danada: le falta lo que dice que se
 * cambio).
 */
function leerMarca(p) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(p, 'respaldos', MARCA), 'utf8'));
    if (!m || typeof m.respaldo !== 'string' || !m.respaldo || ![m.respaldados, m.nuevos, m.movidos].every(Array.isArray)) {
      throw new Error('no dice que respaldo usar ni que se cambio');
    }
    return { m };
  } catch (e) {
    return { error: e };
  }
}

/**
 * True si la marca es de una actualizacion que termino bien: VERSION y el
 * registro de lo instalado (lo ultimo que escribe una actualizacion que salio
 * bien, con el mismo respaldo que la marca) ya son de ella. Solo fallo quitar
 * la marca: no hay nada que deshacer.
 */
function marcaTerminada(p, m) {
  try {
    const reg = JSON.parse(fs.readFileSync(path.join(p, 'respaldos', INSTALADO), 'utf8'));
    return !!m.hacia && reg.version === m.hacia && reg.respaldo === m.respaldo && leerVersion(p) === m.hacia;
  } catch {
    return false;
  }
}

/** Quita la marca con paciencia (un programa la puede tener abierta un rato). null si quedo quitada; si no, el error. */
function quitarMarca(p) {
  const f = path.join(p, 'respaldos', MARCA);
  for (let i = 0; esArchivo(f); i += 1) {
    try {
      reintentar(() => fs.unlinkSync(f));
    } catch (e) {
      if (i < 10) {
        dormir(3);
        continue;
      }
      return e;
    }
  }
  return null;
}

/** La marca de una actualizacion que si termino: se quita, sin deshacer nada. Devuelve 0, o 1 si no se pudo. */
function quitarMarcaTerminada(p, m) {
  const e = quitarMarca(p);
  if (e) {
    console.log(
      `ERROR la actualizacion de ${m.desde} a ${m.hacia} habia terminado bien, pero no se puede quitar respaldos/${MARCA} ` +
        `(${e.code || e.message}): lo tiene abierto otro programa. Cierralo (OneDrive, el Explorador, otra ventana de ` +
        'Claude Code) y vuelve a correr lo mismo. No borres nada a mano.'
    );
    return 1;
  }
  console.log(`La actualizacion de ${m.desde} a ${m.hacia} habia terminado bien: solo quedaba su marca (respaldos/${MARCA}), y se quito. No se deshizo nada.`);
  return 0;
}

/**
 * Aparta la marca de una actualizacion que no se puede deshacer (falta su
 * respaldo o esta danada): queda en respaldos/ con otro nombre, como registro
 * de lo que paso. Devuelve donde quedo.
 */
function apartarMarca(p) {
  const destino = libre(path.join(p, 'respaldos', `ACTUALIZACION_SIN_DESHACER_${fechaHora()}.json`));
  reintentar(() => fs.renameSync(path.join(p, 'respaldos', MARCA), destino));
  return aRel(destino, p);
}

/** Los respaldos de actualizaciones que no terminaron (sin _INFORME.txt): lo de antes de una actualizacion cortada. */
function respaldosSinTerminar(p) {
  const r = path.join(p, 'respaldos');
  try {
    return fs
      .readdirSync(r, { withFileTypes: true })
      .filter((d) => d.isDirectory() && RE_RESPALDO.test(d.name) && !esArchivo(path.join(r, d.name, INFORME)) && !esArchivo(path.join(r, d.name, INCOMPLETO)))
      .map((d) => `respaldos/${d.name}`)
      .sort();
  } catch {
    return [];
  }
}

/** --restaurar --probar: que haria la restauracion, sin hacerla. */
function probarRestaurar(p) {
  const { m, error } = leerMarca(p);
  if (error) {
    console.log(`No se puede leer respaldos/${MARCA} (${error.message}): no se podria deshacer con ella.`);
    console.log('--probar: no se cambio nada.');
    return 0;
  }
  if (marcaTerminada(p, m)) {
    console.log(`La actualizacion de ${m.desde} a ${m.hacia} habia terminado bien: solo quedo su marca. Sin --probar se quita la marca, sin deshacer nada.`);
    console.log('--probar: no se cambio nada.');
    return 0;
  }
  const resp = path.join(p, m.respaldo);
  const enResp = new Set(m.respaldados.map((r) => r.toLowerCase()));
  const agregados = m.nuevos.filter((r) => !enResp.has(r.toLowerCase()) && fs.existsSync(path.join(p, r)));
  const faltan = m.respaldados.filter((r) => !esArchivo(path.join(resp, r)));
  console.log(`Restaurar el proyecto como estaba antes de actualizar de ${m.desde} a ${m.hacia}, con el respaldo ${m.respaldo}:`);
  console.log(`- se devuelven desde el respaldo ${n(m.respaldados.length, 'archivo')} (los que ya estan iguales no se copian)`);
  if (agregados.length) console.log(`- se quitan ${n(agregados.length, 'archivo')} que agrego la actualizacion: ${lista(agregados)}`);
  if (m.movidos.length) console.log(`- vuelven a su lugar ${n(m.movidos.length, 'archivo')} que se habian movido a mis_archivos/`);
  if (faltan.length) {
    console.log(
      `- NO se podria deshacer del todo: ${n(faltan.length, 'archivo')} ya no ${faltan.length === 1 ? 'esta' : 'estan'} en el ` +
        `respaldo: ${lista(faltan)}. Con el zip nuevo, la actualizacion seguiria hacia adelante.`
    );
  }
  console.log('- temp/, output/, .env y respaldos/ no se tocan.');
  console.log('--probar: no se cambio nada.');
  return 0;
}

/**
 * Deja el proyecto como estaba antes de la actualizacion a medias (la marca
 * dice con que respaldo). Nunca toca temp/, output/, .env ni respaldos/.
 * Orden: devuelve lo respaldado, quita las copias movidas a mis_archivos/ y lo
 * que se agrego, y recien al final CLAUDE.md y produccion/actualizar.js (si
 * algo queda pendiente, el CLAUDE.md nuevo sigue avisando de la marca y el
 * actualizador sigue ahi para --restaurar).
 * Devuelve 'ok' (restaurado, sin marca), 'error' (algo abierto en otro
 * programa: la marca sigue y dice que falta) o 'sin-respaldo' (no se puede
 * deshacer del todo: faltan archivos del respaldo o la marca esta danada; se
 * devolvio lo que se pudo y la marca sigue: con la version nueva se sigue hacia
 * adelante).
 */
function restaurar(p) {
  const marca = path.join(p, 'respaldos', MARCA);
  const { m, error } = leerMarca(p);
  if (error) {
    if (bloqueado(error)) {
      console.log(`ERROR no se puede leer respaldos/${MARCA}: lo tiene abierto otro programa. Cierralo (OneDrive, el Explorador, otra ventana de Claude Code) y vuelve a intentar.`);
      return 'error';
    }
    console.log(`No se puede deshacer la actualizacion a medias: respaldos/${MARCA} esta danada (${error.message}) y no dice que se cambio.`);
    return 'sin-respaldo';
  }
  const resp = path.join(p, m.respaldo);
  const respaldados = [...m.respaldados];
  const nuevos = [...m.nuevos];
  const movidos = [...m.movidos];
  console.log(`Restaurando el proyecto como estaba antes de actualizar de ${m.desde} a ${m.hacia}, con el respaldo ${m.respaldo} ...`);
  sinTemporales(p);
  // lo que ya no esta en el respaldo (alguien lo borro): eso no se puede devolver
  const faltanResp = new Set(respaldados.filter((r) => !esArchivo(path.join(resp, r))));
  const enResp = new Set(respaldados.map((r) => r.toLowerCase())); // en Windows CLAUDE.md y claude.md son uno
  const quitarL = nuevos.filter((r) => !enResp.has(r.toLowerCase()));
  const tareas = [
    ...respaldados.filter((r) => !PRIMERO.includes(r)).map((r) => ['devolver', r]),
    ...movidos.map(([o, d]) => ['movido', o, d]),
    ...quitarL.filter((r) => !PRIMERO.includes(r)).map((r) => ['quitar', r]),
  ];
  let pendientes = hacer(p, resp, tareas);
  for (const r of [...PRIMERO].reverse()) {
    // recien ahora: primero el CLAUDE.md de antes, despues el actualizador
    if (!pendientes.length && (respaldados.includes(r) || quitarL.includes(r))) {
      pendientes = hacer(p, resp, [[respaldados.includes(r) ? 'devolver' : 'quitar', r]]);
    }
  }
  sinPycache(p);
  for (const c of m.carpetas_nuevas || []) {
    // las carpetas que creo la actualizacion, si quedaron vacias
    try {
      fs.rmdirSync(path.join(p, c));
    } catch {
      // no esta vacia o ya no esta: se deja
    }
  }
  if (pendientes.length) {
    if (pendientes.every(([t]) => t[0] === 'devolver' && faltanResp.has(t[1]))) {
      // lo unico que falta es lo que ya no esta en el respaldo: nunca se va a poder devolver
      const faltan = pendientes.map(([t]) => t[1]);
      console.log(
        `No se puede deshacer del todo: ${n(faltan.length, 'archivo')} ya no ${faltan.length === 1 ? 'esta' : 'estan'} en el ` +
          `respaldo ${m.respaldo} (se ${faltan.length === 1 ? 'borro' : 'borraron'}): ${lista(faltan, 10)}. Se devolvio todo lo demas.`
      );
      return 'sin-respaldo';
    }
    const detalle = pendientes.slice(0, 10).map(([t, e]) => motivo(t, e));
    console.log(`ERROR la restauracion no quedo completa. Falta: ${detalle.join('; ')}${pendientes.length > 10 ? ` y ${pendientes.length - 10} mas` : ''}.`);
    console.log(
      'Cierra lo que tenga abiertos archivos de esta carpeta (otra ventana de Claude Code, el Explorador, ' +
        'OneDrive, un reproductor) y vuelve a correr el actualizador con --restaurar. Hasta entonces no generes ' +
        `nada: la marca respaldos/${MARCA} sigue puesta.`
    );
    return 'error';
  }
  const malos = [];
  for (const r of respaldados) {
    try {
      if (rutaReal(p, r) !== r || !iguales(path.join(resp, r), path.join(p, r))) malos.push(r);
    } catch {
      malos.push(r);
    }
  }
  malos.push(...quitarL.filter((r) => fs.existsSync(path.join(p, r))));
  if (malos.length) {
    console.log(`ERROR la restauracion no quedo completa: ${malos.slice(0, 10).join(', ')}. Vuelve a correr con --restaurar.`);
    return 'error';
  }
  fs.unlinkSync(marca);
  console.log('Restaurado: el proyecto quedo como estaba antes de esa actualizacion.');
  return 'ok';
}

const n = (k, palabra, plural = `${palabra}s`) => `${k} ${k === 1 ? palabra : plural}`;
const peso = (b) => (b >= MB ? `${(b / MB).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

function lista(rels, k = 15) {
  const t = rels.map((r) => (Array.isArray(r) ? r.join(' -> ') : r));
  return t.slice(0, k).join(', ') + (t.length > k ? ` y ${t.length - k} mas` : '');
}

/**
 * Lo que importa un archivo de codigo con ruta relativa (import ... from './x.js',
 * export ... from, import('./x.js'), import './x.js', new URL('./x.py',
 * import.meta.url)), resuelto contra la raiz del proyecto. Las lineas de
 * comentario no cuentan. Lo mismo que importsRelativos de empaquetar-alumnos.js.
 */
export function importsRelativos(rel, codigo) {
  const sinComentarios = codigo
    .split(/\r?\n/)
    .filter((l) => !/^\s*(\/\/|\/?\*)/.test(l))
    .join('\n');
  const dir = path.posix.dirname(rel);
  const salida = new Set();
  const patrones = [
    /(?:\bfrom|\bimport)\s*\(?\s*(['"])(\.{1,2}\/[^'"\n]+)\1/g,
    /\bnew\s+URL\(\s*(['"])(\.{1,2}\/[^'"\n]+)\1\s*,\s*import\.meta\.url/g,
  ];
  for (const re of patrones) {
    for (const m of sinComentarios.matchAll(re)) salida.add(path.posix.normalize(path.posix.join(dir, m[2])));
  }
  return [...salida];
}

/**
 * El codigo del proyecto ya actualizado: node --check de cada .js de
 * produccion/ (la sintaxis) y, en produccion/ y remotion/src/, que cada import
 * con ruta relativa este (un modulo que falta rompe el comando recien al usarlo;
 * no se cargan los modulos para mirarlo porque varios hacen su trabajo al
 * cargarse). Sin extension se resuelve como el bundler de Remotion. Devuelve
 * los errores.
 */
function chequeoCodigo(p) {
  const errores = [];
  for (const rel of archivosEn(p, 'produccion').filter((r) => /\.(c|m)?js$/.test(r))) {
    const r = spawnSync(process.execPath, ['--check', path.join(p, rel)], { cwd: p, encoding: 'utf8', timeout: 120000, windowsHide: true });
    if (r.error) errores.push(`no se pudo revisar ${rel} con node --check (${r.error.message})`);
    else if (r.status !== 0) {
      const detalle = String(r.stderr || r.stdout).trim().split(/\r?\n/).filter(Boolean).slice(0, 4).join(' | ');
      errores.push(`no pasa node --check: ${rel}: ${detalle}`);
    }
  }
  const esta = (rel) => esArchivo(path.join(p, rel));
  const resuelve = (imp) =>
    esta(imp) || (!path.posix.extname(imp) && ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '/index.js', '/index.jsx'].some((x) => esta(imp + x)));
  for (const c of CARPETAS_DE_CODIGO) {
    for (const rel of archivosEn(p, c).filter((r) => /\.(c|m)?(js|jsx|ts|tsx)$/.test(r))) {
      let codigo;
      try {
        codigo = fs.readFileSync(path.join(p, rel), 'utf8');
      } catch (e) {
        errores.push(`no se pudo leer ${rel} (${e.code || e.message})`);
        continue;
      }
      for (const imp of importsRelativos(rel, codigo)) if (!resuelve(imp)) errores.push(`${rel} importa ${imp}, que no esta`);
    }
  }
  return errores;
}

/**
 * Las lineas INSTALAR: las librerias de npm de una carpeta (la raiz o
 * remotion/) se reinstalan si ya estaban instaladas y cambio su package.json o
 * su package-lock.json. El lock se compara con el de la version instalada
 * (npm lo reescribe al instalar) y, si no se conoce, con el que habia.
 * Remotion sin instalar no se instala solo: el usuario puede montar en CapCut.
 * Cada linea "INSTALAR: <comando>" termina en el comando, sin nada detras: se
 * corre tal cual lo que sigue a "INSTALAR: " (igual en PowerShell y en Bash).
 * El motivo va en la linea de antes.
 */
function lineasInstalar(p, plan, nueva, publicadas, instV) {
  const out = [];
  for (const dir of ['', 'remotion']) {
    const pj = dir ? `${dir}/package.json` : 'package.json';
    const lk = dir ? `${dir}/package-lock.json` : 'package-lock.json';
    if (!nueva[pj]) continue;
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(nueva[pj], 'utf8'));
    } catch {
      continue;
    }
    if (!Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }).length) continue;
    const hNueva = (r) => (nueva[r] ? huella(nueva[r]) : null);
    const pjCambio = plan.antes[pj] !== hNueva(pj);
    const lkInstalado = publicadas[instV] && lk in publicadas[instV] ? publicadas[instV][lk] : plan.antes[lk];
    const lkCambio = (lkInstalado || null) !== hNueva(lk);
    const carpeta = dir ? path.join(p, dir) : p;
    const comando = `npm install --prefix "${carpeta}"`;
    const instalado = fs.existsSync(path.join(carpeta, 'node_modules'));
    const de = dir === 'remotion' ? 'Remotion' : 'la raiz';
    if (instalado && (pjCambio || lkCambio)) out.push(`Cambiaron las librerias de ${de}: hay que reinstalarlas.`, `INSTALAR: ${comando}`);
    else if (!instalado && !dir) out.push(`Faltan las librerias de ${de}: hay que instalarlas.`, `INSTALAR: ${comando}`);
    else if (!instalado) {
      out.push(
        `Remotion no esta instalado en esta carpeta (no hay ${dir}/node_modules): solo hace falta para que el sistema ` +
          `arme el video. Si el usuario lo quiere: ${comando}`
      );
    }
  }
  return out;
}

// ---------- actualizar ----------

function no(motivoTxt) {
  console.log(`NO SE ACTUALIZO (no se cambio nada): ${motivoTxt}`);
  return 2;
}

const slug = (texto) =>
  texto
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^A-Za-z0-9.-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'anterior';

function fechaHora() {
  const d = new Date();
  const dos = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}_${dos(d.getHours())}${dos(d.getMinutes())}`;
}

/** El archivo de un error, relativo al proyecto si esta dentro. */
function nombreError(e, p) {
  if (!e || !e.path) return String(e && e.message ? e.message : e);
  return dentro(e.path, p) ? aRel(path.resolve(e.path), p) : e.path;
}

/** El _INFORME.txt de la ultima actualizacion a esta version (para terminar los pasos de despues si se cortaron). */
function informeDe(p, version) {
  try {
    const reg = JSON.parse(fs.readFileSync(path.join(p, 'respaldos', INSTALADO), 'utf8'));
    if (reg.version === version && reg.respaldo && esArchivo(path.join(p, reg.respaldo, INFORME))) return path.join(p, reg.respaldo, INFORME);
  } catch {
    // sin registro: se busca entre los respaldos
  }
  const hallados = [];
  const r = path.join(p, 'respaldos');
  for (const d of fs.existsSync(r) ? fs.readdirSync(r, { withFileTypes: true }) : []) {
    const f = path.join(r, d.name, INFORME);
    if (!d.isDirectory() || !esArchivo(f)) continue;
    try {
      if (fs.readFileSync(f, 'utf8').split(/\r?\n/)[0].endsWith(` a ${version}.`)) hallados.push(f);
    } catch {
      // no se puede leer: no cuenta
    }
  }
  hallados.sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  return hallados.length ? hallados[hallados.length - 1] : null;
}

function alDia(p, a, nuevaV) {
  let texto = `El sistema ya esta al dia (version ${nuevaV}).`;
  if (leerVersion(p) === null && !a.probar) {
    // lo reconocio por las huellas: solo falta el archivo VERSION
    try {
      copiar(path.join(NUEVA, 'VERSION'), path.join(p, 'VERSION'));
      texto += ' Solo faltaba el archivo VERSION: se volvio a poner.';
    } catch (e) {
      texto += ` Falta el archivo VERSION y no se pudo volver a poner (${e.message}).`;
    }
  } else texto += ' No se cambio nada.';
  console.log(texto);
  const inf = informeDe(p, nuevaV);
  if (inf) {
    console.log(`INFORME de la actualizacion a ${nuevaV}: ${inf}`);
    console.log(
      'Si los pasos de despues de actualizar no se terminaron (se corto la conversacion), sigue con ese ' +
        'informe desde el paso 4 de ACTUALIZAR.md: haz solo lo que falte.'
    );
  }
  return 0;
}

/** Las carpetas que la actualizacion va a crear (para quitarlas si se restaura y quedan vacias), de la mas honda a la menos. */
function carpetasNuevas(p, rels) {
  const out = new Set();
  for (const rel of rels) {
    let d = path.dirname(path.join(p, rel));
    while (normal(d) !== normal(p) && !fs.existsSync(d)) {
      out.add(aRel(d, p));
      d = path.dirname(d);
    }
  }
  return [...out].sort((x, y) => y.split('/').length - x.split('/').length || (x < y ? -1 : x > y ? 1 : 0));
}

function actualizar(p, a) {
  const nuevaV = leerVersion(NUEVA);
  const sisNueva = (leerHuellas(path.join(NUEVA, HUELLAS)) || {}).sistema;
  let publicadas;
  let conocidas;
  let instV;
  let instTxt;
  let nueva;
  let plan;
  try {
    // hasta el respaldo solo se lee: un archivo que otro programa tiene abierto no deja nada a medias
    const sisProyecto = sistemaDe(p);
    if (sisNueva && sisProyecto && sisNueva !== sisProyecto) {
      return no(
        `este zip es de ${nombreSistema(sisNueva)} y tu carpeta es de ${nombreSistema(sisProyecto)}: ` +
          'son dos sistemas distintos. Pide el zip de tu version.'
      );
    }
    ({ publicadas, conocidas } = cargarHuellas(p));
    [instV, instTxt] = versionInstalada(p, publicadas);
    if (!instV) {
      return no(`${p} no es la carpeta del sistema (no se parece a ninguna version publicada): abre la que tiene tus anuncios en temp/ y tu .env`);
    }
    const conVersion = leerVersion(p) !== null;
    if (instV === nuevaV && conVersion) return alDia(p, a, nuevaV);
    if (instV > nuevaV) return no(`tu sistema (${instV}) es mas nuevo que este zip (${nuevaV}): es un zip viejo. Pide el zip mas reciente.`);
    nueva = archivosDelSistema(NUEVA);
    plan = planear(p, nueva, conocidas);
    if (instV === nuevaV) {
      // Sin VERSION, la que mas se parece es la nueva. Esta al dia solo si todo lo del sistema ya es
      // igual a la nueva (solo falta VERSION). Si no, es un zip que se armo antes de sellar esta version
      // (le faltan archivos de ella, como el actualizador): se actualiza, y para las notas de CAMBIOS.md
      // y las librerias cuenta como la ultima publicada antes de esta.
      if (!plan.nuevos.length && !plan.reemplazar.length && !plan.quitar.length && !plan.mover.length) return alDia(p, a, nuevaV);
      const anteriores = Object.keys(publicadas).filter((v) => v < nuevaV).sort();
      instV = anteriores.length ? anteriores[anteriores.length - 1] : '';
      instTxt = `una anterior a la ${nuevaV} (sin VERSION)`;
    }
    const total = listarTodo(NUEVA).reduce((s, rel) => s + fs.statSync(path.join(NUEVA, rel)).size, 0);
    const hace = 2 * total + 200 * MB;
    let libreDisco = null;
    try {
      const st = fs.statfsSync(p);
      libreDisco = st.bavail * st.bsize;
    } catch {
      // no se pudo saber: no se frena por eso
    }
    if (libreDisco !== null && libreDisco < hace) {
      return no(
        `falta espacio en el disco: hay ${Math.floor(libreDisco / MB)} MB libres y hacen falta ${Math.floor(hace / MB)} MB. ` +
          'Libera espacio (el usuario) y vuelve a intentar.'
      );
    }
  } catch (e) {
    if (bloqueado(e)) {
      return no(`no se pudo leer ${nombreError(e, p)}: lo tiene abierto otro programa. Cierralo (OneDrive, el Explorador, otra ventana de Claude Code) y vuelve a intentar.`);
    }
    if (e && e.code) return no(`no se pudo leer ${nombreError(e, p)} (${e.code}). Vuelve a intentar.`);
    throw e;
  }

  const instalar = lineasInstalar(p, plan, nueva, publicadas, instV);
  console.log(`Actualizar de ${instTxt} a ${nuevaV}, en ${p}`);
  console.log(`- archivos nuevos: ${plan.nuevos.length}; a reemplazar: ${plan.reemplazar.length}; iguales: ${plan.iguales.length}`);
  const restos = new Set(plan.restos);
  for (const [clave, texto, valores] of [
    ['nuevos', 'nuevos'],
    ['reemplazar', 'se reemplazan'],
    ['a_mano', 'CAMBIADOS A MANO (se reemplazan; el tuyo queda en el respaldo)'],
    ['quitar', 'se quitan (eran del sistema y la version nueva ya no los trae)', plan.quitar.filter((r) => !restos.has(r))],
    ['restos', `se quitan (${OBSOLETOS.map((o) => o.que).join(', ')}, que la version nueva ya no usa)`],
    ['mover', 'se mueven a mis_archivos/ (son tuyos)'],
    ['propias', 'skills propias del usuario (no se tocan)'],
  ]) {
    const v = valores || plan[clave];
    if (v.length) console.log(`- ${texto}: ${lista(v)}`);
  }
  for (const l of instalar) console.log(`- despues: ${l}`);
  if (a.probar) {
    const d = resumenDatos(p);
    console.log(`- lo tuyo (no se toca): temp/ ${n(d.anuncios.length, 'carpeta')} de anuncio, output/ ${n(d.videos.length, 'video')}, .env presente`);
    console.log('--probar: no se cambio nada.');
    return 0;
  }

  // respaldo: produccion/ y remotion/src/ enteras, cada archivo que se reemplaza, se quita o se
  // mueve, VERSION y el registro anterior
  limpiarRestos(p);
  const resp = libre(path.join(p, 'respaldos', `${fechaHora()}_desde_${slug(instTxt)}`), true);
  const registro = `respaldos/${INSTALADO}`;
  const conjunto = new Set([
    ...CARPETAS_DE_CODIGO.flatMap((c) => archivosEn(p, c)),
    ...plan.reemplazar,
    ...plan.quitar,
    ...plan.mover.map(([o]) => o),
  ]);
  for (const r of ['VERSION', registro]) if (esArchivo(path.join(p, r))) conjunto.add(r);
  const respaldados = [...conjunto].sort();
  const nuevos = [...plan.nuevos, ...['VERSION', registro].filter((r) => !esArchivo(path.join(p, r)))];
  const marca = {
    desde: instTxt,
    hacia: nuevaV,
    respaldo: aRel(resp, p),
    respaldados,
    nuevos,
    movidos: plan.mover,
    quitados: plan.quitar,
    carpetas_nuevas: carpetasNuevas(p, [...plan.nuevos, ...plan.mover.map(([, d]) => d)]),
  };
  let antes;
  try {
    fs.mkdirSync(resp, { recursive: true });
    fs.writeFileSync(
      path.join(resp, INCOMPLETO),
      'Respaldo a medio hacer: se corto antes de cambiar nada en el proyecto. El actualizador lo quita en la proxima corrida.\n',
      'utf8'
    );
    for (const rel of respaldados) copiar(path.join(p, rel), path.join(resp, rel));
    if (respaldados.some((r) => fs.statSync(path.join(resp, r)).size !== fs.statSync(path.join(p, r)).size)) {
      throw new Error('el respaldo no quedo igual al proyecto');
    }
    antes = datos(p);
    fs.unlinkSync(path.join(resp, INCOMPLETO));
    const tmp = path.join(p, 'respaldos', `${MARCA}.tmp`);
    fs.writeFileSync(tmp, JSON.stringify(marca, null, 1), 'utf8');
    fs.renameSync(tmp, path.join(p, 'respaldos', MARCA)); // desde aqui, si se corta, al volver a correrlo se restaura
  } catch (e) {
    borrarCarpeta(resp); // solo la carpeta que se acaba de crear, incompleta
    quitar(path.join(p, 'respaldos', `${MARCA}.tmp`));
    return no(
      `no se pudo hacer el respaldo (${e.message}). Cierra lo que tenga abiertos archivos de la carpeta ` +
        '(otra ventana de Claude Code, el Explorador, OneDrive) y vuelve a intentar.'
    );
  }

  const errores = [];
  const copiarL = [...plan.nuevos, ...plan.reemplazar];
  const quitarCf = new Set(plan.quitar.map((r) => r.toLowerCase()));
  const primero = PRIMERO.filter((r) => copiarL.includes(r) && !quitarCf.has(r.toLowerCase()));
  try {
    for (const rel of primero) copiar(nueva[rel], path.join(p, rel)); // el actualizador (para --restaurar) y el CLAUDE.md nuevo
    for (const rel of plan.quitar) borrar(path.join(p, rel));
    for (const [origen, destino] of plan.mover) mover(path.join(p, origen), path.join(p, destino));
    for (const rel of copiarL) if (!primero.includes(rel)) copiar(nueva[rel], path.join(p, rel));
    sinPycache(p);
    // comprobar: lo del sistema igual a la version nueva, el codigo sin nada de mas, los datos intactos
    for (const [rel, f] of Object.entries(nueva)) {
      if (rel === 'VERSION') continue;
      const fp = path.join(p, rel);
      if (!(esArchivo(fp) && iguales(f, fp))) errores.push(`no quedo igual a la version nueva: ${rel}`);
    }
    for (const c of CARPETAS_DE_CODIGO) for (const r of archivosEn(p, c)) if (!(r in nueva)) errores.push(`sobra: ${r}`);
    if (!errores.length) errores.push(...chequeoCodigo(p));
    const despues = datos(p);
    if (JSON.stringify(despues) !== JSON.stringify(antes)) {
      errores.push(
        `cambiaron temp/, output/ o .env durante la actualizacion (antes ${antes.temp} y ${antes.output}, ` +
          `despues ${despues.temp} y ${despues.output}): hay algo generandose?`
      );
    }
    if (!errores.length) {
      // todo bien: recien ahora VERSION y el registro de lo instalado
      copiar(path.join(NUEVA, 'VERSION'), path.join(p, 'VERSION'));
      if (leerVersion(p) !== nuevaV) errores.push(`VERSION no dice ${nuevaV}`);
      else {
        const instalado = {};
        for (const rel of Object.keys(nueva)) if (!CAMBIAN_SIEMPRE.has(rel)) instalado[rel] = huella(path.join(p, rel));
        fs.writeFileSync(
          path.join(p, registro),
          `${JSON.stringify({ version: nuevaV, sistema: sisNueva, respaldo: aRel(resp, p), archivos: instalado }, null, 1)}\n`,
          'utf8'
        );
      }
    }
  } catch (e) {
    // cualquier falla (tambien un error de este codigo): se restaura
    errores.push(`${e && e.code ? `${e.code}: ` : ''}${e && e.message ? e.message : e}`);
  }
  if (errores.length) {
    console.log('FALLO la actualizacion:');
    for (const e of errores) console.log(`- ${e}`);
    const ok = restaurar(p) === 'ok';
    console.log(
      ok
        ? 'El proyecto quedo como estaba: no se perdio nada.'
        : 'ATENCION: no se pudo restaurar del todo. Sigue lo que dice arriba antes de hacer cualquier otra cosa.'
    );
    return 1;
  }

  // la marca se quita con paciencia. Si quedara puesta no pasa nada malo: la proxima corrida ve que esta
  // actualizacion termino (VERSION y el registro ya son de ella) y solo quita la marca
  const eMarca = quitarMarca(p);
  if (eMarca) {
    console.log(
      `AVISO la actualizacion termino bien, pero no se pudo quitar respaldos/${MARCA} (${eMarca.code || eMarca.message}): ` +
        'lo tiene abierto otro programa. No la borres a mano: cuando se cierre (OneDrive, el Explorador, otra ventana de ' +
        'Claude Code), corre en el proyecto  node produccion/actualizar.js . --restaurar  , que ve que la actualizacion ' +
        'termino y solo quita la marca, sin deshacer nada.'
    );
  }
  try {
    informe(p, { nuevaV, instV, instTxt, plan, resp, antes, instalar, previo: a.previo });
  } catch (e) {
    console.log(`ACTUALIZACION LISTA: de ${instTxt} a ${nuevaV}.`);
    console.log(`Respaldo de lo que se reemplazo: ${aRel(resp, p)}`);
    console.log(`(No se pudo armar el informe completo: ${e.message}. La actualizacion si quedo hecha.)`);
  }
  return 0;
}

/**
 * Lo de "Trabajos a medias" de CAMBIOS.md (el de la version nueva) de cada
 * version mas nueva que la instalada, de la mas vieja a la mas nueva: una
 * linea por vineta. Formato de CAMBIOS.md: "## <version>" y adentro
 * "**Trabajos a medias:**" seguido de texto o vinetas "- ...".
 */
function notasAMedias(instV) {
  let texto;
  try {
    texto = fs.readFileSync(path.join(NUEVA, 'CAMBIOS.md'), 'utf8').replace(/\r\n/g, '\n');
  } catch {
    return [];
  }
  const out = [];
  for (const bloque of texto.split(/^## /m).slice(1).reverse()) {
    const salto = bloque.indexOf('\n');
    const ver = (salto < 0 ? bloque : bloque.slice(0, salto)).trim();
    const cuerpo = salto < 0 ? '' : bloque.slice(salto + 1);
    if (!RE_VERSION.test(ver) || (instV && ver <= instV)) continue;
    const m = /\*\*Trabajos a medias:\*\*([\s\S]*?)(?=\n\*\*|\n## |$)/.exec(cuerpo);
    if (!m) continue;
    for (let vin of `\n${m[1].trim()}`.split(/\n\s*- /)) {
      vin = vin.split(/\s+/).filter(Boolean).join(' ');
      if (vin && !/^nada( nuevo| cambia)?\.?$/i.test(vin)) out.push(`- (${ver}) ${vin}`);
    }
  }
  return out;
}

/** El informe final, en lineas simples para que Claude se lo pase al usuario (queda tambien en el respaldo). */
function informe(p, { nuevaV, instV, instTxt, plan, resp, antes, instalar, previo }) {
  const rResp = aRel(resp, p);
  const restos = new Set(plan.restos);
  const quitados = plan.quitar.filter((r) => !restos.has(r));
  const lineas = [
    `ACTUALIZACION LISTA: de ${instTxt} a ${nuevaV}.`,
    `Respaldo de lo que se reemplazo: ${rResp}`,
    ...(previo ? [previo] : []),
    `Copiados: ${plan.nuevos.length} nuevos y ${plan.reemplazar.length} reemplazados (${plan.iguales.length} ya estaban iguales).`,
  ];
  if (quitados.length) lineas.push(`Quitados (eran del sistema y la version nueva ya no los trae; estan en el respaldo): ${lista(quitados, 40)}`);
  if (plan.restos.length) {
    lineas.push(`Quitados (${OBSOLETOS.map((o) => o.que).join(', ')}, que la version nueva ya no usa; estan en el respaldo): ${lista(plan.restos, 40)}`);
  }
  if (plan.mover.length) lineas.push(`Movidos a mis_archivos/ (eran tuyos, no del sistema): ${lista(plan.mover, 40)}`);
  for (const rel of plan.a_mano) lineas.push(`CAMBIADO A MANO: ${rel} (se reemplazo por el nuevo; el tuyo esta en ${rResp}/${rel})`);
  if (plan.propias.length) lineas.push(`Skills propias (no son del sistema, no se tocaron): ${plan.propias.join(', ')}`);
  lineas.push(...instalar);
  const d = resumenDatos(p);
  const [nt, bt] = antes.temp;
  const [no_, bo] = antes.output;
  lineas.push(
    `Tus datos, igual que antes: temp/ ${n(d.anuncios.length, 'carpeta')} de anuncio (${n(nt, 'archivo')}, ${peso(bt)}), ` +
      `output/ ${n(d.videos.length, 'video')} (${n(no_, 'archivo')}, ${peso(bo)}), .env sin cambios.`
  );
  // un anuncio esta terminado si output/ tiene su video: <carpeta>_9x16_...mp4 (lo nombra ensamblar.js),
  // o renombrado a <carpeta>.mp4 o <carpeta>-..., sin distinguir mayusculas. Cada video cuenta para la
  // carpeta de nombre mas largo que le calza ("crochet-v2_9x16.mp4" es de crochet-v2, no de crochet).
  // Uno montado en CapCut con otro nombre no se reconoce: por eso el texto dice las dos posibilidades.
  const conVideo = new Set();
  for (const v of d.videos) {
    const nombre = path.posix.basename(v).toLowerCase();
    const sinExt = nombre.replace(EXT_VIDEO, '');
    let suyo = '';
    for (const a of d.anuncios) {
      const c = a.toLowerCase();
      if ((sinExt === c || nombre.startsWith(`${c}_`) || nombre.startsWith(`${c}-`)) && c.length > suyo.length) suyo = c;
    }
    if (suyo) conVideo.add(suyo);
  }
  const medias = d.anuncios.filter((a) => !conVideo.has(a.toLowerCase()));
  if (medias.length) {
    const notas = notasAMedias(instV);
    lineas.push(
      'Anuncios de temp/ sin su video en output/ (a medias, o terminados fuera del sistema, por ejemplo en CapCut): ' +
        `${medias.join(', ')}. Al retomarlos, aplica lo de 'Trabajos a medias' de CAMBIOS.md (versiones posteriores ` +
        `a ${instTxt})${notas.length ? ':' : '.'}`
    );
    lineas.push(...notas);
  }
  lineas.push('Al terminar todo, abre una conversacion nueva de Claude Code en esta carpeta.');
  console.log(lineas.join('\n'));
  try {
    fs.writeFileSync(path.join(resp, INFORME), `${lineas.join('\n')}\n`, 'utf8');
  } catch {
    // el informe ya salio por pantalla
  }
}

/** El motivo para no seguir si hay algo del sistema corriendo (una generacion a medias se romperia), o null. */
function procesos(a, p) {
  if (a.sinProcesos) return null;
  const corriendo = procesosDelSistema(p);
  if (corriendo === null) console.log('AVISO no se pudo revisar si hay procesos del sistema corriendo: sigo.');
  else if (corriendo.length) {
    const estudio = corriendo.some((c) => /\b(studio|estudio)\b/i.test(c));
    return (
      `hay ${n(corriendo.length, 'proceso')} del sistema corriendo: espera a que termine y cierra las otras ` +
      'ventanas de Claude Code. Nunca lo cierres tu: puede ser una generacion ya pagada.' +
      (estudio ? ' Si es el estudio de Remotion (studio), el usuario lo puede cerrar sin perder nada.' : '') +
      ` Si la carpeta que aparece no es la de este proyecto, es de otra copia del sistema.\n${corriendo.map((c) => `  - ${c}`).join('\n')}`
    );
  }
  return null;
}

const USO =
  'Uso: node "<version nueva>/produccion/actualizar.js" "<proyecto>" [--probar] [--restaurar] [--sin-procesos]\n' +
  '  <proyecto>       la carpeta del usuario: la que tiene sus anuncios en temp/ y su .env\n' +
  '  --probar         muestra lo que haria, sin cambiar nada\n' +
  '  --restaurar      deshace una actualizacion que quedo a medias\n' +
  '  --sin-procesos   no mira si hay algo del sistema corriendo';

export function main(argv = process.argv.slice(2)) {
  const a = { probar: false, restaurar: false, sinProcesos: false, proyecto: null, error: null };
  for (const x of argv) {
    if (x === '--probar') a.probar = true;
    else if (x === '--restaurar') a.restaurar = true;
    else if (x === '--sin-procesos') a.sinProcesos = true;
    else if (x === '-h' || x === '--help' || x === '--ayuda') {
      console.log(USO);
      return 0;
    } else if (x.startsWith('--')) a.error = `opcion desconocida: ${x}`;
    else if (a.proyecto === null) a.proyecto = x;
    else a.error = `sobra un argumento: ${x}`;
  }
  if (a.error || !a.proyecto) {
    console.log(`${a.error || 'falta la carpeta del proyecto'}\n${USO}`);
    return 2;
  }
  // en PowerShell, "C:\carpeta\" llega como C:\carpeta" (la barra escapa la comilla)
  let p = path.resolve(a.proyecto.replace(/["']+$/, ''));
  try {
    p = fs.realpathSync.native(p);
  } catch {
    // no existe: lo dice revisarProyecto
  }
  const marca = path.join(p, 'respaldos', MARCA);
  if (a.restaurar) {
    // no necesita la version nueva: sirve tambien el produccion/actualizar.js del propio proyecto
    if (!esArchivo(marca)) {
      console.log('No hay ninguna actualizacion a medias: no hay nada que restaurar (las copias de las actualizaciones anteriores estan en respaldos/).');
      return 0;
    }
    if (a.probar) return probarRestaurar(p);
    const { m } = leerMarca(p);
    if (m && marcaTerminada(p, m)) return quitarMarcaTerminada(p, m);
    const mo = procesos(a, p);
    if (mo) return no(mo);
    const r = restaurar(p);
    if (r === 'sin-respaldo') {
      console.log(
        'Para terminar, actualiza con el zip de la version nueva (su ACTUALIZAR.md): sigue hacia adelante y deja todo ' +
          'lo del sistema como en la version nueva, con un respaldo nuevo de como quedo. temp/, output/ y .env no se ' +
          `tocaron. Hasta entonces no generes nada: la marca respaldos/${MARCA} sigue puesta.`
      );
    }
    return r === 'ok' ? 0 : 1;
  }
  const falta = ['VERSION', 'ACTUALIZAR.md', 'CLAUDE.md', ESTE, HUELLAS].filter((x) => !fs.existsSync(path.join(NUEVA, x)));
  if (falta.length) return no(`la version nueva (${NUEVA}) esta incompleta: le falta ${falta.join(', ')}. Vuelve a descargar el zip.`);
  const motivoTxt = revisarProyecto(p) || procesos(a, p); // antes de tocar nada, tambien antes de restaurar
  if (motivoTxt) return no(motivoTxt);
  if (esArchivo(marca)) {
    const { m } = leerMarca(p);
    if (m && marcaTerminada(p, m)) {
      // la anterior termino bien y solo quedo su marca: no se deshace nada
      if (a.probar) {
        console.log(`La actualizacion de ${m.desde} a ${m.hacia} habia terminado bien: solo quedo su marca (respaldos/${MARCA}). Sin --probar se quita, sin deshacer nada.`);
      } else if (quitarMarcaTerminada(p, m)) return 1;
    } else {
      console.log(`La actualizacion anterior quedo a medias (respaldos/${MARCA}). Sin --probar, primero se deshace y despues se actualiza:`);
      if (a.probar) return probarRestaurar(p);
      const r = restaurar(p);
      if (r === 'error') return 1;
      if (r === 'sin-respaldo') {
        // no se puede volver atras: se sigue hacia adelante, con un respaldo nuevo de como quedo
        let apartada;
        try {
          apartada = apartarMarca(p);
        } catch (e) {
          console.log(`ERROR no se pudo apartar respaldos/${MARCA} (${e.code || e.message}): lo tiene abierto otro programa. Cierralo y vuelve a intentar.`);
          return 1;
        }
        console.log(
          'Se sigue hacia adelante: la actualizacion se hace de nuevo con la version nueva, con un respaldo nuevo de ' +
            `como quedo el proyecto. La marca vieja quedo en ${apartada}. temp/, output/ y .env no se tocaron.`
        );
        // para el informe: los archivos de antes de la actualizacion cortada (los cambios a mano del usuario
        // que ya se habian pisado antes del corte estan ahi, no en el respaldo nuevo)
        const viejos = respaldosSinTerminar(p);
        a.previo =
          `Antes de esta hubo una actualizacion cortada que no se pudo deshacer del todo (su marca quedo en ${apartada}).` +
          (viejos.length
            ? ` Lo de antes de aquella esta en ${viejos.join(', ')}: si el usuario habia cambiado a mano un archivo del sistema y no aparece abajo como CAMBIADO A MANO, su version esta ahi.`
            : '');
      }
    }
  }
  return actualizar(p, a);
}

if (process.argv[1] && path.basename(process.argv[1]) === 'actualizar.js') {
  let codigo;
  try {
    codigo = main();
  } catch (e) {
    // un error de este codigo fuera de las partes que ya se cuidan solas (el respaldo y la copia
    // restauran por su cuenta): si quedo la marca, hay que restaurar antes de nada
    console.log(`ERROR inesperado del actualizador: ${e && e.stack ? e.stack : e}`);
    console.log(
      `Si existe respaldos/${MARCA} en el proyecto, corre el actualizador con --restaurar antes de cualquier ` +
        'otra cosa; si no existe, no se cambio nada.'
    );
    codigo = 1;
  }
  process.exitCode = codigo;
}
