// CHECKPOINT OBLIGATORIO entre la Fase 2.3 y el montaje.
//
//   node produccion/revisar-videos.js temp/mi-anuncio
//
// Lista los clips generados y pregunta si estan aprobados. Nada se ensambla
// hasta que el usuario diga que si. Es el unico momento barato para arreglar
// una toma: despues del montaje hay que rehacer el render.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { execFileSync } from 'node:child_process';
import { tieneContinuidad, cadenaDeClips, textoCuenta } from './continuidad.js';

const duracion = (f) => {
  try {
    return Number(
      execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {
        encoding: 'utf8',
      }).trim()
    );
  } catch {
    return null;
  }
};

export function estadoDeRevision(carpeta) {
  const ruta = path.join(carpeta, 'revision.json');
  return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : { aprobado: false, rehacer: [] };
}

export function guardarRevision(carpeta, estado) {
  fs.writeFileSync(path.join(carpeta, 'revision.json'), JSON.stringify(estado, null, 2) + '\n', 'utf8');
}

/**
 * Continuidad: la tabla de la cadena (en vez de una fila por toma) y los clips
 * que salieron del modelo de respaldo (video/log-modelos.json), aparte: en
 * esos hay que mirar las uniones. Devuelve las lineas a imprimir.
 */
export function lineasDeCadena(manifiesto, dirVideo) {
  const cadena = cadenaDeClips(manifiesto);
  const tomas = new Map((manifiesto.tomas || []).map((t) => [t.n, t]));
  const sinPng = (f) => (f ? f.replace(/\.png$/, '') : '(sin imagen final)');
  const L = [];
  L.push(`  Continuidad. Clips en cadena: ${textoCuenta(cadena)}. Sin B-roll.\n`);
  L.push('  lin  clip          rol     dura    de -> a                               linea del guion');
  L.push('  ---  ------------  ------  ------  ------------------------------------  ------------------------------------');
  let lineaAnterior = null;
  for (const c of cadena) {
    const f = path.join(dirVideo, c.archivo);
    const d = fs.existsSync(f) ? duracion(f) : null;
    const marca = d === null || !Number.isFinite(d) ? 'FALTA ' : `${d.toFixed(2)}s`;
    const texto = c.linea !== lineaAnterior ? String(tomas.get(c.linea)?.linea ?? '').slice(0, 36) : '';
    lineaAnterior = c.linea;
    const deA = `${sinPng(c.imagenInicial)} -> ${sinPng(c.imagenFinal)}`;
    L.push(`  ${String(c.linea).padStart(3)}  ${c.archivo.padEnd(12)}  ${c.rol.padEnd(6)}  ${marca.padStart(6)}  ${deA.padEnd(36)}  ${texto}`);
  }

  let respaldo = [];
  try {
    const rutaLog = path.join(dirVideo, 'log-modelos.json');
    const enCadena = new Set(cadena.map((c) => c.archivo));
    if (fs.existsSync(rutaLog)) {
      respaldo = (JSON.parse(fs.readFileSync(rutaLog, 'utf8')).clips || []).filter((x) => x?.respaldo && enCadena.has(x.archivo));
    }
  } catch {
    respaldo = []; // un log ilegible no frena la revision
  }
  if (respaldo.length) {
    L.push('', `  Salieron del modelo de respaldo (${respaldo.length}): mira sus uniones, que arranquen y lleguen a sus imagenes:`);
    for (const x of respaldo) L.push(`      ${x.archivo} -> ${x.modelo}`);
  }
  return L;
}

if (process.argv[1] && process.argv[1].endsWith('revisar-videos.js')) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/revisar-videos.js <carpeta-del-anuncio>\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  const dirVideo = path.join(carpeta, 'video');

  console.log(`\n=== Revision de clips — ${path.basename(carpeta)} ===\n`);
  console.log('  Mira los clips antes de ensamblar. Arreglar una toma ahora cuesta centavos;');
  console.log('  despues del montaje hay que rehacer el render entero.\n');
  console.log(`  Carpeta: ${dirVideo}\n`);

  const conContinuidad = tieneContinuidad(manifiesto);
  if (conContinuidad) {
    // Continuidad: la cadena, clip por clip (no hay una toma = un clip).
    for (const l of lineasDeCadena(manifiesto, dirVideo)) console.log(l);
    console.log('\n  Para las uniones (el ultimo cuadro de cada clip junto a la imagen siguiente):');
    console.log(`      npm run frames -- ${carpetaArg} --uniones`);
  } else {
    console.log('  toma  tipo  dura    linea del guion');
    console.log('  ----  ----  ------  ------------------------------------------------');
    for (const t of manifiesto.tomas) {
      const f = path.join(dirVideo, `toma-${t.n}.mp4`);
      const d = fs.existsSync(f) ? duracion(f) : null;
      const marca = d === null ? 'FALTA ' : `${d.toFixed(2)}s`;
      console.log(`  ${String(t.n).padStart(4)}  ${t.tipo.padEnd(4)}  ${marca.padStart(6)}  ${t.linea.slice(0, 48)}`);
    }

    const brolls = (manifiesto.broll || []).filter((b) => fs.existsSync(path.join(dirVideo, `broll-${b.n}.mp4`)));
    console.log(`\n  B-roll generados: ${brolls.length}`);
  }

  const estado = estadoDeRevision(carpeta);
  if (estado.aprobado) {
    console.log('\n  Estos clips ya estaban aprobados. Si quieres cambiar algo, responde igual.\n');
  }

  if (!stdin.isTTY) {
    console.log('\n  (terminal no interactiva: no puedo preguntarte aca)');
    console.log('  Cuando los hayas visto, apruebalos con:');
    console.log(`      node produccion/revisar-videos.js ${carpetaArg} --aprobar\n`);
    if (args.includes('--aprobar')) {
      guardarRevision(carpeta, { aprobado: true, fecha: new Date().toISOString(), rehacer: [] });
      console.log('  Aprobado.\n');
    }
    process.exit(0);
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  console.log('\n  ¿Estan bien todos?');
  console.log('    - Enter o "si"  -> apruebo y sigo al montaje');
  console.log('    - numeros       -> las tomas que hay que rehacer (ej: 14  o  3,14)\n');

  const r = (await rl.question('  Respuesta: ')).trim().toLowerCase();
  rl.close();

  if (r === '' || r === 'si' || r === 's') {
    guardarRevision(carpeta, { aprobado: true, fecha: new Date().toISOString(), rehacer: [] });
    console.log('\n  Aprobado. Siguiente paso:');
    console.log(`      npm run plan -- ${carpetaArg}\n`);
    process.exit(0);
  }

  const rehacer = r.split(/[,\s]+/).map(Number).filter((x) => Number.isInteger(x) && x > 0);
  if (rehacer.length === 0) {
    console.log('\n  No entendi. Vuelve a correrlo cuando lo tengas claro.\n');
    process.exit(0);
  }

  guardarRevision(carpeta, { aprobado: false, fecha: new Date().toISOString(), rehacer });

  console.log(`\n  Anotado: hay que rehacer la(s) toma(s) ${rehacer.join(', ')}.\n`);
  console.log('  IMPORTANTE: no se regenera con el mismo prompt. Si una toma salio mal,');
  console.log('  el problema esta en la instruccion, y repetirla da lo mismo otra vez.\n');
  console.log('  Pidele a Claude que la rehaga, de una de estas dos formas:\n');
  console.log(`    DIRIGIDO:   "rehaz la toma ${rehacer[0]}: quiero ver [lo que tengas en mente]"`);
  console.log(`    AUTOMATICO: "la toma ${rehacer[0]} no funciono"`);
  console.log('                (Claude lee la linea del guion, entiende que tiene que');
  console.log('                 transmitir, y propone una escena visualmente distinta)\n');
  console.log('  En los dos casos te muestra los prompts nuevos antes de gastar,');
  console.log('  y el clip nuevo antes de reensamblar.\n');
  console.log(`  Para ver el contexto tu mismo:`);
  console.log(`      node produccion/rehacer-toma.js ${carpetaArg} --toma ${rehacer[0]} --contexto\n`);
  if (conContinuidad) {
    console.log('  Con continuidad, si lo que salio mal es un PASO (paso-K.mp4) y sus dos imagenes estan');
    console.log('  bien, no se rehace la toma: se reescribe solo su prompt (continuidad.pasos[de=K].prompt_video,');
    console.log('  mirando sus imagenes) y se rehace ese paso, con el costo a la vista antes de cobrar:');
    console.log(`      npm run continuidad -- ${carpetaArg} --pares`);
    console.log(`      npm run videos -- ${carpetaArg} --pasos K --rehacer\n`);
  }
}
