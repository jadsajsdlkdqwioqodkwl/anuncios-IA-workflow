// Imprime el codigo que Claude pega en la pagina de Google Flow (javascript_tool):
// los ayudantes de ayudantes-navegador.js + la cola del anuncio.
//
//   npm run -s flow:js -- temp/mi-anuncio            las dos colas (imagenes y videos)
//   npm run -s flow:js -- temp/mi-anuncio videos     solo una
//
// Con -s (silencioso): sin -s, npm agrega dos lineas de encabezado que no son
// JavaScript y el pegado falla. Se vuelve a pegar cada vez que la pagina de
// Flow se recarga y cada vez que la cola cambia (vuelta nueva).
//
// De cada prompt no se manda el texto entero sino una "clave": el tramo mas
// corto del prompt (normalizado igual que en la pagina) que no aparece en
// ningun otro prompt de la cola. Alcanza para reconocer el recurso abierto y
// el pegado queda chico aunque la cola tenga decenas de trabajos.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerCola } from './flow.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const [carpetaArg, tipoArg] = process.argv.slice(2);

if (!carpetaArg) {
  console.error('Uso: npm run -s flow:js -- temp/<anuncio> [imagenes|videos]');
  process.exit(1);
}
const carpeta = path.resolve(carpetaArg);
const tipos = tipoArg ? [tipoArg] : ['imagenes', 'videos'];

/** La misma normalizacion que usa identificarPagina() en la pagina. */
const normal = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** El tramo mas corto (desde 80 caracteres) de `texto` que no esta en ningun otro. */
function claveUnica(texto, otros) {
  for (const largo of [80, 140, 220]) {
    if (texto.length <= largo) break;
    for (let desde = 0; desde + largo <= texto.length; desde += 30) {
      const tramo = texto.slice(desde, desde + largo);
      if (!otros.some((o) => o.includes(tramo))) return tramo;
    }
  }
  return texto; // dos prompts casi iguales: va entero
}

const trabajos = [];
for (const tipo of tipos) {
  const cola = leerCola(carpeta, tipo);
  if (!cola) continue;
  for (const t of cola.trabajos) trabajos.push({ descarga: t.descarga, archivo: t.archivo, n: normal(t.prompt) });
}
if (trabajos.length === 0) {
  console.error(`No hay trabajos en las colas de ${carpetaArg}. Primero: npm run imagenes -- ${carpetaArg} (o videos).`);
  process.exit(1);
}

const salida = trabajos.map((t, i) => ({
  descarga: t.descarga,
  archivo: t.archivo,
  clave: claveUnica(t.n, trabajos.filter((_, j) => j !== i).map((o) => o.n)),
}));

const ayudantes = fs.readFileSync(path.join(aqui, 'ayudantes-navegador.js'), 'utf8');
process.stdout.write(`${ayudantes}\nwindow.__claudeFlow.cargarCola(${JSON.stringify(salida)});\n`);
