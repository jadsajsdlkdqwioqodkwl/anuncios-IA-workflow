// Sella una version publicada: calcula las huellas de lo que trae su .zip (o
// su carpeta) y las guarda en produccion/huellas-versiones.json, que viaja en
// cada zip. Con ellas el actualizador (produccion/actualizar.js) reconoce que
// version tiene instalada el alumno (las de antes del actualizador no traen
// VERSION) y separa los archivos del sistema de los que el alumno cambio a
// mano. Solo modulos de Node: el zip se lee aqui mismo, sin descomprimirlo.
//
// Uso, en la carpeta de trabajo (la que se empaqueta):
//   node produccion/huellas-versiones.js <zip o carpeta> [--version AAAA-MM-DD] [--sistema <nombre>] [--resellar]
//   node produccion/huellas-versiones.js <zip o carpeta> --comprobar
//   node produccion/huellas-versiones.js --lista
//
// AL PUBLICAR UNA VERSION:
//   1. Sube VERSION (la fecha; con letra si es el segundo zip del dia:
//      2026-10-18b) y agrega arriba en CAMBIOS.md su entrada "## <VERSION>".
//   2. npm run alumnos (produccion/empaquetar-alumnos.js, en las dos
//      versiones): arma el zip dejando fuera lo interno, arma package.json y
//      los .skill en el momento, sella la version DESDE LO QUE VIAJA, lo
//      comprueba leyendo el zip armado y guarda las huellas en
//      produccion/huellas-versiones.json de esta carpeta. El zip lleva sus
//      propias huellas y las de las versiones anteriores.
//   Este script queda para sellar a mano un zip que no armo npm run alumnos
//   (por ejemplo uno viejo, sin VERSION:  --version 2026-10-17b) y para
//   comprobar uno ya armado.
//
// UNA VERSION, UN CONTENIDO: si la version ya estaba sellada con otros
// archivos, no se reemplaza (sale con error), salvo con --resellar. Quien
// instalo el zip anterior tiene esa misma VERSION y el actualizador le diria
// "ya esta al dia" con el zip nuevo; y sin las huellas del anterior, sus
// archivos sin tocar saldrian despues como "CAMBIADO A MANO". Si ese zip ya se
// repartio, sube VERSION (2026-10-18b) y agrega su entrada en CAMBIOS.md.
// --resellar solo si el zip anterior de esa version NO se repartio.
//
// --comprobar  compara el zip (o la carpeta) con las huellas guardadas de su
//              version y dice que no coincide. Sale con 1 si hay diferencias.
// --version    la version del zip; si no se da, la de su VERSION (los zips de
//              antes del actualizador no la traen).
// --sistema    el nombre del sistema: sistema-anuncios-ia o anuncios-ia-flow.
//              Solo la primera vez: despues sale del json.
// --archivo    otro json de huellas (por defecto, el de esta carpeta).
// --resellar   reemplaza las huellas de una version ya sellada con otros
//              archivos (ver arriba).
//
// Lo que se sella: todo lo que trae la version menos VERSION y las huellas
// (cambian en cada version), lo del usuario y lo generado: seSella() de
// actualizar.js, la misma regla que usa el actualizador. Una carpeta que se
// empaqueta con produccion/empaquetar-alumnos.js no se sella directo (el zip
// no es la carpeta tal cual): se sella el zip que arma.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { HUELLAS, SISTEMAS, huella, huellaBytes, leerHuellas, leerVersion, listar, seSella } from './actualizar.js';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RE_VERSION = /^\d{4}-\d{2}-\d{2}[a-z]?$/;

// ---------- leer un zip sin descomprimirlo ----------

class MetodoNoSoportado extends Error {}

/** Un nombre sin la marca UTF-8 del zip: UTF-8 si lo es, si no latin1. */
function nombreDe(crudo, utf8) {
  const t = crudo.toString('utf8');
  return utf8 || !t.includes('\uFFFD') ? t : crudo.toString('latin1');
}

/** Las entradas de un zip: [{ nombre, datos() }]. Lee el directorio central del final del archivo. */
function leerZip(rutaZip) {
  const buf = fs.readFileSync(rutaZip);
  let fin = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      fin = i;
      break;
    }
  }
  if (fin < 0) throw new Error(`${rutaZip} no es un zip (no tiene directorio central)`);
  const total = buf.readUInt16LE(fin + 10);
  let off = buf.readUInt32LE(fin + 16);
  if (total === 0xffff || off === 0xffffffff) throw new MetodoNoSoportado('zip64');
  const entradas = [];
  for (let k = 0; k < total; k += 1) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error(`${rutaZip}: directorio central roto`);
    const flags = buf.readUInt16LE(off + 8);
    const metodo = buf.readUInt16LE(off + 10);
    const crc = buf.readUInt32LE(off + 16);
    const comp = buf.readUInt32LE(off + 20);
    const tam = buf.readUInt32LE(off + 24);
    const ln = buf.readUInt16LE(off + 28);
    const le = buf.readUInt16LE(off + 30);
    const lc = buf.readUInt16LE(off + 32);
    const local = buf.readUInt32LE(off + 42);
    const nombre = nombreDe(buf.subarray(off + 46, off + 46 + ln), (flags & 0x800) !== 0).replace(/\\/g, '/');
    off += 46 + ln + le + lc;
    entradas.push({
      nombre,
      datos() {
        if (flags & 1) throw new MetodoNoSoportado(`${nombre} esta cifrado`);
        if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error(`${rutaZip}: ${nombre} no esta donde dice el directorio`);
        const ini = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
        const crudo = buf.subarray(ini, ini + comp);
        let d;
        if (metodo === 0) d = crudo;
        else if (metodo === 8) d = zlib.inflateRawSync(crudo);
        else throw new MetodoNoSoportado(`${nombre} usa la compresion ${metodo}`);
        if (d.length !== tam) throw new Error(`${rutaZip}: ${nombre} no pesa lo que dice el zip`);
        if (typeof zlib.crc32 === 'function' && zlib.crc32(d) >>> 0 !== crc >>> 0) throw new Error(`${rutaZip}: ${nombre} esta corrupto (CRC)`);
        return d;
      },
    });
  }
  return entradas;
}

/** Si todo cuelga de una misma carpeta ("sistema-anuncios-ia/"), esa carpeta; si no, ''. */
function raizComun(nombres) {
  const primeras = new Set(nombres.map((x) => (x.includes('/') ? x.split('/')[0] : '')));
  return primeras.size === 1 && !primeras.has('') ? `${[...primeras][0]}/` : '';
}

/** Las huellas de una carpeta: { version, archivos }. */
function deCarpeta(dir) {
  const archivos = {};
  for (const rel of listar(dir, seSella)) archivos[rel] = huella(path.join(dir, rel));
  return { version: leerVersion(dir), archivos };
}

/**
 * Las huellas de un zip: { version, archivos }. Si usa una compresion que
 * este lector no conoce, se descomprime con tar (viene con Windows 10/11 y con
 * Mac) en una carpeta temporal y se sella esa carpeta.
 */
function deZip(rutaZip) {
  let entradas;
  try {
    entradas = leerZip(rutaZip);
    const archivos = entradas.filter((e) => !e.nombre.endsWith('/'));
    const raiz = raizComun(archivos.map((e) => e.nombre));
    const out = {};
    let version = null;
    for (const e of archivos) {
      const rel = e.nombre.slice(raiz.length);
      if (rel === 'VERSION') version = e.datos().toString('utf8').replace(/^\uFEFF/, '').trim() || null;
      else if (seSella(rel)) out[rel] = huellaBytes(e.datos());
    }
    return { version, archivos: out };
  } catch (e) {
    if (!(e instanceof MetodoNoSoportado)) throw e;
    console.log(`  (${e.message}: se descomprime con tar en una carpeta temporal)`);
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'huellas-'));
  try {
    const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
    const r = spawnSync(tar, ['-xf', rutaZip, '-C', tmp], { encoding: 'utf8', windowsHide: true });
    if (r.error || r.status !== 0) throw new Error(`no se pudo descomprimir ${rutaZip}: ${r.error ? r.error.message : r.stderr}`);
    const dentro = fs.readdirSync(tmp);
    const dir = dentro.length === 1 && fs.statSync(path.join(tmp, dentro[0])).isDirectory() ? path.join(tmp, dentro[0]) : tmp;
    return deCarpeta(dir);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function deOrigen(origen) {
  const st = fs.statSync(origen);
  if (st.isDirectory()) {
    if (fs.existsSync(path.join(origen, 'produccion', 'empaquetar-alumnos.js'))) {
      throw new Error(
        `${origen} se empaqueta con produccion/empaquetar-alumnos.js (el zip deja cosas fuera y arma package.json y los ` +
          '.skill en el momento): arma el zip con npm run alumnos y sella ese zip.'
      );
    }
    return deCarpeta(origen);
  }
  return deZip(origen);
}

// ---------- el json ----------

const porNombre = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function escribir(f, sistema, versiones) {
  const ordenadas = {};
  for (const v of Object.keys(versiones).sort(porNombre)) {
    ordenadas[v] = Object.fromEntries(Object.entries(versiones[v]).sort(([a], [b]) => porNombre(a, b)));
  }
  const tmp = `${f}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify({ sistema, versiones: ordenadas }, null, 1)}\n`, 'utf8');
  fs.renameSync(tmp, f);
}

/** Lo que cambia entre dos selladas: { distintos, faltan, sobran }. */
function diferencias(guardada, nueva) {
  const distintos = Object.keys(nueva).filter((r) => r in guardada && guardada[r] !== nueva[r]);
  const faltan = Object.keys(guardada).filter((r) => !(r in nueva));
  const sobran = Object.keys(nueva).filter((r) => !(r in guardada));
  return { distintos, faltan, sobran };
}

const algunos = (l) => l.slice(0, 15).join(', ') + (l.length > 15 ? ` y ${l.length - 15} mas` : '');

function principal(argv) {
  const a = { origen: null, version: null, sistema: null, archivo: null, comprobar: false, lista: false, resellar: false };
  for (let i = 0; i < argv.length; i += 1) {
    const x = argv[i];
    if (x === '--version' || x === '--sistema' || x === '--archivo') {
      if (i + 1 >= argv.length) throw new Error(`falta el valor de ${x}`);
      a[x.slice(2)] = argv[(i += 1)];
    } else if (x === '--comprobar') a.comprobar = true;
    else if (x === '--lista') a.lista = true;
    else if (x === '--resellar') a.resellar = true;
    else if (x.startsWith('--')) throw new Error(`opcion desconocida: ${x}`);
    else if (!a.origen) a.origen = x;
    else throw new Error(`sobra un argumento: ${x}`);
  }
  const f = path.resolve(a.archivo || path.join(AQUI, path.basename(HUELLAS)));
  const guardado = leerHuellas(f) || { sistema: null, versiones: {} };

  if (a.lista) {
    console.log(`${path.relative(process.cwd(), f) || f}: sistema ${guardado.sistema || '(sin nombre)'}`);
    for (const v of Object.keys(guardado.versiones).sort(porNombre)) console.log(`  ${v}: ${Object.keys(guardado.versiones[v]).length} archivos`);
    return 0;
  }
  if (!a.origen) throw new Error('falta el zip o la carpeta de la version');
  const origen = path.resolve(a.origen);
  if (!fs.existsSync(origen)) throw new Error(`no existe ${origen}`);

  const { version: vOrigen, archivos } = deOrigen(origen);
  const version = a.version || vOrigen;
  if (!version) throw new Error(`${a.origen} no trae VERSION: di cual es con --version AAAA-MM-DD`);
  if (!RE_VERSION.test(version)) throw new Error(`la version tiene que ser la fecha (2026-10-18, o 2026-10-18b): dice "${version}"`);
  if (a.version && vOrigen && a.version !== vOrigen) throw new Error(`--version dice ${a.version} y el VERSION de ${a.origen} dice ${vOrigen}`);
  const n = Object.keys(archivos).length;
  if (!archivos['CLAUDE.md'] || !Object.keys(archivos).some((r) => r.startsWith('produccion/'))) {
    throw new Error(`${a.origen} no parece una version del sistema (le falta CLAUDE.md o produccion/)`);
  }

  if (a.comprobar) {
    const g = guardado.versiones[version];
    if (!g) {
      console.log(`No hay huellas guardadas de ${version} en ${f}.`);
      return 1;
    }
    const d = diferencias(g, archivos);
    if (!d.distintos.length && !d.faltan.length && !d.sobran.length) {
      console.log(`OK: ${a.origen} coincide con las huellas guardadas de ${version} (${n} archivos).`);
      return 0;
    }
    console.log(`NO coincide con las huellas guardadas de ${version}:`);
    if (d.distintos.length) console.log(`  distintos: ${algunos(d.distintos)}`);
    if (d.faltan.length) console.log(`  sellados que no estan: ${algunos(d.faltan)}`);
    if (d.sobran.length) console.log(`  estan y no se sellaron: ${algunos(d.sobran)}`);
    console.log('  Si este es el zip que se publica, vuelve a sellarlo (sin --comprobar).');
    return 1;
  }

  const sistema = a.sistema || guardado.sistema;
  if (!sistema) throw new Error(`es el primer sellado de ${f}: di el sistema con --sistema (${Object.keys(SISTEMAS).join(' o ')})`);
  if (!(sistema in SISTEMAS)) throw new Error(`no conozco el sistema "${sistema}": ${Object.keys(SISTEMAS).join(' o ')}`);
  if (guardado.sistema && sistema !== guardado.sistema) {
    throw new Error(`${f} es de ${guardado.sistema}, no de ${sistema}: cada sistema lleva su propio archivo de huellas`);
  }
  const antes = guardado.versiones[version];
  const d = antes ? diferencias(antes, archivos) : null;
  const k = d ? d.distintos.length + d.faltan.length + d.sobran.length : 0;
  if (k && !a.resellar) {
    throw new Error(
      `${version} ya esta sellada con otros archivos (cambiaron ${k}: ${algunos([...d.distintos, ...d.faltan, ...d.sobran])}). ` +
        'No se reemplaza: si el zip anterior de esa version ya se repartio, quien lo instalo tiene esa VERSION y el ' +
        'actualizador le diria "ya esta al dia". Sube VERSION (por ejemplo a la misma fecha con una letra: 2026-10-18b), ' +
        'agrega su entrada en CAMBIOS.md y arma el zip de nuevo. Si ese zip NO se repartio, vuelve a correr esto con --resellar.'
    );
  }
  guardado.versiones[version] = archivos;
  escribir(f, sistema, guardado.versiones);
  console.log(`Huellas de ${version} (${sistema}): ${n} archivos, desde ${a.origen}.`);
  if (antes) {
    console.log(k ? `  Reemplaza a las que habia de ${version} (--resellar): cambiaron ${k} archivo(s) (${algunos([...d.distintos, ...d.faltan, ...d.sobran])}).` : `  Iguales a las que ya habia de ${version}.`);
  }
  console.log(`  Guardadas en ${f} (versiones: ${Object.keys(guardado.versiones).sort(porNombre).join(', ')}).`);
  return 0;
}

if (process.argv[1] && path.basename(process.argv[1]) === 'huellas-versiones.js') {
  try {
    process.exitCode = principal(process.argv.slice(2));
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
    process.exitCode = 2;
  }
}
