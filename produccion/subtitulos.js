// FASE 2.6 — subtitulos a partir de los timestamps de ElevenLabs.
//
//   node produccion/subtitulos.js temp/mi-anuncio
//
// ElevenLabs devuelve el tiempo de inicio y fin de CADA CARACTER. De ahi se
// arman palabras, y de las palabras bloques de 2 a 4 que aparecen en pantalla.
// Nada se estima a ojo.

import fs from 'node:fs';
import path from 'node:path';

export const REGLAS_SUB = {
  minPalabras: 2,
  maxPalabras: 3,
  // Los subtitulos van en UNA SOLA LINEA, nunca partidos en dos renglones.
  // Con el tamano actual (0.06137 del ancho = 44px sobre 720) en Arial Black
  // mayuscula, y los margenes del 8% a cada lado, entran unos 20-22 caracteres.
  // Se corta por caracteres ADEMAS de por palabras: tres palabras cortas caben,
  // tres largas no, y el conteo de palabras solo no distingue esos dos casos.
  maxCaracteres: 20,
  // Si entre dos palabras hay mas silencio que esto, se corta el bloque:
  // respeta las pausas naturales del hablante.
  pausaQueCorta: 0.28,
  // Un bloque no deberia durar mas que esto aunque quepan 4 palabras.
  maxSegundos: 2.2,
  // El bloque se queda un pelin mas despues de la ultima palabra.
  colaSeg: 0.12,
};

/** Agrupa los caracteres alineados en palabras con inicio y fin. */
export function palabrasDesdeAlineacion(alignment) {
  const chars = alignment.characters || [];
  const ini = alignment.character_start_times_seconds || [];
  const fin = alignment.character_end_times_seconds || [];

  const palabras = [];
  let actual = null;

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const esSeparador = /\s/.test(c);

    if (esSeparador) {
      if (actual) {
        palabras.push(actual);
        actual = null;
      }
      continue;
    }

    if (!actual) actual = { texto: '', inicio: ini[i], fin: fin[i] };
    actual.texto += c;
    actual.fin = fin[i];
  }
  if (actual) palabras.push(actual);

  return palabras
    .filter((p) => p.texto.trim().length > 0)
    .map((p) => ({
      texto: p.texto,
      inicio: Number(p.inicio.toFixed(3)),
      fin: Number(p.fin.toFixed(3)),
    }));
}

/** Reparte las palabras en bloques de 2-4, respetando las pausas del hablante. */
export function bloquesDeSubtitulos(palabras, reglas = REGLAS_SUB) {
  const bloques = [];
  let actual = [];

  const cerrar = () => {
    if (actual.length === 0) return;
    bloques.push({
      inicio: actual[0].inicio,
      fin: Number((actual[actual.length - 1].fin + reglas.colaSeg).toFixed(3)),
      texto: actual.map((p) => p.texto).join(' '),
      palabras: actual.map((p) => ({ texto: p.texto, inicio: p.inicio, fin: p.fin })),
    });
    actual = [];
  };

  for (let i = 0; i < palabras.length; i++) {
    const p = palabras[i];
    const anterior = actual[actual.length - 1];

    if (anterior) {
      const hueco = p.inicio - anterior.fin;
      const duraria = p.fin - actual[0].inicio;
      // Largo del renglon si esta palabra se sumara al bloque, contando los
      // espacios. Es lo que decide que todo entre en una sola linea.
      const largoConEsta = actual.reduce((n, x) => n + x.texto.length, 0) + actual.length + p.texto.length;
      const razonParaCortar =
        // Una frase terminada nunca se mezcla con la siguiente.
        /[.!?…]$/.test(anterior.texto) ||
        actual.length >= reglas.maxPalabras ||
        (reglas.maxCaracteres && largoConEsta > reglas.maxCaracteres) ||
        (actual.length >= reglas.minPalabras && hueco >= reglas.pausaQueCorta) ||
        (actual.length >= reglas.minPalabras && duraria > reglas.maxSegundos);

      if (razonParaCortar) cerrar();
    }

    actual.push(p);
  }
  cerrar();

  // La cola no puede pisar el bloque siguiente: si no, se verian dos a la vez.
  for (let i = 0; i < bloques.length - 1; i++) {
    const tope = bloques[i + 1].inicio - 0.02;
    if (bloques[i].fin > tope) bloques[i].fin = Number(tope.toFixed(3));
  }

  return bloques;
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('subtitulos.js')) {
  const carpetaArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/subtitulos.js <carpeta-del-anuncio>\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const rutaTiempos = path.join(carpeta, 'audio', 'tiempos.json');
  if (!fs.existsSync(rutaTiempos)) {
    console.error(`\n  Falta ${rutaTiempos}. Genera primero la voz:\n      npm run audio -- ${carpetaArg}\n`);
    process.exit(1);
  }

  const tiempos = JSON.parse(fs.readFileSync(rutaTiempos, 'utf8'));
  const palabras = palabrasDesdeAlineacion(tiempos.alignment);
  const bloques = bloquesDeSubtitulos(palabras);

  const salida = path.join(carpeta, 'subtitulos.json');
  fs.writeFileSync(
    salida,
    JSON.stringify({ generado: new Date().toISOString(), reglas: REGLAS_SUB, bloques }, null, 2) + '\n',
    'utf8'
  );

  console.log(`\n=== Subtitulos — ${path.basename(carpeta)} ===\n`);
  console.log(`  ${palabras.length} palabras -> ${bloques.length} bloques de ${REGLAS_SUB.minPalabras}-${REGLAS_SUB.maxPalabras}\n`);

  const cuenta = {};
  for (const b of bloques) cuenta[b.palabras.length] = (cuenta[b.palabras.length] || 0) + 1;
  console.log('  palabras por bloque:', Object.entries(cuenta).map(([k, v]) => `${k}->${v}`).join('  '));

  const duraciones = bloques.map((b) => b.fin - b.inicio);
  console.log(`  duracion de bloque: min ${Math.min(...duraciones).toFixed(2)}s  max ${Math.max(...duraciones).toFixed(2)}s`);

  console.log('\n  Primeros 8 bloques:');
  for (const b of bloques.slice(0, 8)) {
    console.log(`    ${b.inicio.toFixed(2)}s - ${b.fin.toFixed(2)}s   "${b.texto}"`);
  }

  console.log(`\n  Escrito en ${salida}\n`);
}
