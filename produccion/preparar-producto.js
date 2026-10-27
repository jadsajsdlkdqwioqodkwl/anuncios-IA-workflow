// Deja la foto del producto lista para el pipeline: la copia dentro de la carpeta
// del anuncio, la convierte si el formato no sirve, y deja el nombre real escrito
// en el manifiesto.
//
// El usuario puede pasar el archivo tal como lo tiene: en Descargas, en el Escritorio,
// en .webp, .heic, con espacios o acentos en el nombre. No tiene que renombrar nada.
//
// Uso:  node produccion/preparar-producto.js "C:\Users\<tu-usuario>\Downloads\creama.webp" neutrogena-hydro-boost

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { DIR_TEMP } from './config.js';

// Formatos que kie.ai acepta como image_input (https://docs.kie.ai/market/google/nanobanana2)
export const FORMATOS_OK = ['jpg', 'jpeg', 'png', 'webp'];
export const MAX_BYTES = 30 * 1024 * 1024;
const LADO_MAX = 2048;

/** Detecta el formato real por los bytes, no por la extension. */
export function formatoReal(ruta) {
  const fd = fs.openSync(ruta, 'r');
  const b = Buffer.alloc(16);
  fs.readSync(fd, b, 0, 16, 0);
  fs.closeSync(fd);

  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && b.slice(1, 4).toString('latin1') === 'PNG') return 'png';
  if (b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (b.slice(0, 4).toString('latin1') === 'GIF8') return 'gif';
  if (b.slice(0, 2).toString('latin1') === 'BM') return 'bmp';
  if (b.slice(0, 4).toString('latin1') === 'II*\0' || b.slice(0, 4).toString('latin1') === 'MM\0*') return 'tiff';
  if (b.slice(4, 8).toString('latin1') === 'ftyp') {
    const marca = b.slice(8, 12).toString('latin1');
    if (marca.startsWith('avif') || marca.startsWith('avis')) return 'avif';
    return 'heic'; // heic, heix, hevc, mif1...
  }
  return null;
}

function dimensiones(ruta) {
  try {
    const salida = execFileSync(
      'ffprobe',
      ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', ruta],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    const [w, h] = salida.split('x').map(Number);
    return Number.isFinite(w) && Number.isFinite(h) ? { w, h } : null;
  } catch {
    return null;
  }
}

/** Busca candidatos recientes en Descargas y Escritorio, para cuando la ruta no existe. */
function sugerirArchivos() {
  const carpetas = [
    path.join(os.homedir(), 'Downloads'),
    path.join(os.homedir(), 'Descargas'),
    path.join(os.homedir(), 'Desktop'),
    path.join(os.homedir(), 'Escritorio'),
  ];
  const encontrados = [];
  for (const c of carpetas) {
    if (!fs.existsSync(c)) continue;
    for (const f of fs.readdirSync(c)) {
      if (!/\.(jpg|jpeg|png|webp|heic|heif|avif|bmp|tiff?|gif)$/i.test(f)) continue;
      const p = path.join(c, f);
      try {
        encontrados.push({ p, t: fs.statSync(p).mtimeMs });
      } catch {}
    }
  }
  return encontrados.sort((a, b) => b.t - a.t).slice(0, 5).map((x) => x.p);
}

/**
 * Deja la foto lista dentro de la carpeta del anuncio.
 * Devuelve { nombre, ruta, convertida, formatoOrigen }.
 */
export function prepararProducto(origen, carpetaAnuncio) {
  if (!fs.existsSync(origen)) {
    const err = new Error(`No encuentro el archivo:\n    ${path.resolve(origen)}`);
    err.sugerencias = sugerirArchivos();
    throw err;
  }
  if (fs.statSync(origen).isDirectory()) {
    throw new Error(`Eso es una carpeta, no un archivo: ${origen}`);
  }

  fs.mkdirSync(carpetaAnuncio, { recursive: true });

  const formato = formatoReal(origen);
  if (!formato) {
    throw new Error(
      `El archivo no parece una imagen (${path.basename(origen)}).\n` +
        '  Revisa que sea una foto y no un PDF, un video o un archivo dañado.'
    );
  }

  const bytes = fs.statSync(origen).size;
  const dim = dimensiones(origen);
  const grande = dim && Math.max(dim.w, dim.h) > LADO_MAX;
  const pesada = bytes > MAX_BYTES;
  const compatible = FORMATOS_OK.includes(formato);

  // Caso facil: ya sirve tal cual. Solo se copia con el nombre canonico.
  if (compatible && !pesada && !grande) {
    const ext = formato === 'jpeg' ? 'jpg' : formato;
    const nombre = `producto.${ext}`;
    const destino = path.join(carpetaAnuncio, nombre);
    fs.copyFileSync(origen, destino);
    return { nombre, ruta: destino, convertida: false, formatoOrigen: formato, dim, bytes };
  }

  // Hay que convertir y/o reducir. Siempre a jpg, que es lo mas seguro para el modelo.
  const nombre = 'producto.jpg';
  const destino = path.join(carpetaAnuncio, nombre);
  const args = ['-y', '-i', origen];
  if (grande) args.push('-vf', `scale='min(${LADO_MAX},iw)':-2`);
  args.push('-q:v', '2', destino);

  try {
    execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    const detalle = (e.stderr?.toString() || '').split('\n').filter(Boolean).slice(-3).join('\n    ');
    if (formato === 'heic' || formato === 'avif') {
      throw new Error(
        `Tu ffmpeg no puede leer archivos ${formato.toUpperCase()} (fotos de iPhone).\n` +
          '  Dos salidas, cualquiera sirve:\n' +
          '    1) Abre la foto en Windows, "Guardar como" y elige JPG. Despues vuelve a correr este comando.\n' +
          '    2) En el iPhone: Ajustes > Camara > Formatos > "Mas compatible". Las fotos nuevas saldran en JPG.\n' +
          (detalle ? `\n  Detalle de ffmpeg:\n    ${detalle}` : '')
      );
    }
    throw new Error(`ffmpeg no pudo convertir la imagen.\n    ${detalle}`);
  }

  return { nombre, ruta: destino, convertida: true, formatoOrigen: formato, dim, bytes };
}

/**
 * Escribe el nombre real del archivo en el manifiesto.
 *
 * Hay dos formas de manifiesto y esta funcion tiene que servirle a las dos:
 *
 *   forma nueva    referencias: [{ id: "producto", archivo: "producto.jpg" }]
 *   forma vieja    producto: { foto: "producto.jpg" }
 *
 * Antes solo escribia la vieja. Con un manifiesto de la forma nueva creaba un
 * bloque `producto.foto` que nadie lee y dejaba la referencia real apuntando a
 * un archivo que no existia: la validacion fallaba con
 * "la referencia producto apunta a producto.jpg y ese archivo no existe",
 * justo despues de haber copiado bien la foto. Detectado el 2026-09-03 en el
 * piloto de UGC.
 */
export function actualizarManifiesto(carpetaAnuncio, nombre) {
  const ruta = path.join(carpetaAnuncio, 'manifiesto.json');
  if (!fs.existsSync(ruta)) return null;

  const m = JSON.parse(fs.readFileSync(ruta, 'utf8'));

  // Forma nueva: la entrada aportada de la lista de referencias.
  const ref = Array.isArray(m.referencias)
    ? m.referencias.find((r) => r && typeof r.archivo === 'string')
    : null;

  if (ref) {
    const antes = ref.archivo;
    if (antes === nombre) return { ruta, antes, despues: nombre, cambio: false, campo: `referencias["${ref.id}"].archivo` };
    ref.archivo = nombre;
    fs.writeFileSync(ruta, JSON.stringify(m, null, 2) + '\n', 'utf8');
    return { ruta, antes, despues: nombre, cambio: true, campo: `referencias["${ref.id}"].archivo` };
  }

  // Forma vieja.
  const antes = m.producto?.foto ?? null;
  if (antes === nombre) return { ruta, antes, despues: nombre, cambio: false, campo: 'producto.foto' };

  m.producto = m.producto || {};
  m.producto.foto = nombre;
  fs.writeFileSync(ruta, JSON.stringify(m, null, 2) + '\n', 'utf8');
  return { ruta, antes, despues: nombre, cambio: true, campo: 'producto.foto' };
}

// --- CLI ---
if (process.argv[1] && process.argv[1].endsWith('preparar-producto.js')) {
  const [, , origen, destinoArg] = process.argv;

  if (!origen || !destinoArg) {
    console.error('\n  Uso: node produccion/preparar-producto.js <foto> <nombre-del-anuncio>');
    console.error('\n  Ejemplo:');
    console.error('    node produccion/preparar-producto.js "C:\\Users\\<tu-usuario>\\Downloads\\creama.webp" neutrogena-hydro-boost');
    console.error('\n  La foto puede estar donde sea y en el formato que sea.');
    console.error('  Si tiene espacios en el nombre, ponla entre comillas.\n');
    process.exit(1);
  }

  // El segundo argumento puede ser el slug del anuncio o una carpeta completa.
  const carpeta = destinoArg.includes(path.sep) || destinoArg.includes('/')
    ? path.resolve(destinoArg)
    : path.join(DIR_TEMP, destinoArg);

  try {
    const r = prepararProducto(origen, carpeta);

    console.log('\n=== Foto del producto lista ===\n');
    console.log(`  Origen:   ${path.resolve(origen)}`);
    console.log(`  Formato:  ${r.formatoOrigen}${r.dim ? ` (${r.dim.w}x${r.dim.h})` : ''}, ${(r.bytes / 1024 / 1024).toFixed(2)} MB`);
    if (r.convertida) console.log('  Accion:   convertida a jpg' + (r.dim && Math.max(r.dim.w, r.dim.h) > LADO_MAX ? ` y reducida a ${LADO_MAX}px de lado mayor` : ''));
    else console.log('  Accion:   copiada tal cual (el formato ya servia)');
    console.log(`  Guardada: ${r.ruta}\n`);

    const upd = actualizarManifiesto(carpeta, r.nombre);
    if (upd && upd.cambio) {
      console.log(`  Manifiesto actualizado: ${upd.campo}: ${JSON.stringify(upd.antes)} -> ${JSON.stringify(upd.despues)}\n`);
    } else if (upd) {
      console.log('  El manifiesto ya apuntaba al archivo correcto.\n');
    } else {
      console.log('  Todavia no hay manifiesto.json en esa carpeta. Cuando lo haya, escribe:');
      console.log(`      "producto": { "foto": "${r.nombre}", ... }\n`);
    }
  } catch (e) {
    console.error(`\n  ${e.message}\n`);
    if (e.sugerencias?.length) {
      console.error('  Archivos de imagen recientes en tus carpetas, por si es alguno de estos:');
      for (const s of e.sugerencias) console.error(`    ${s}`);
      console.error('');
    }
    process.exitCode = 1;
  }
}
