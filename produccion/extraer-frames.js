// Saca frames de cada clip para una revision visual rapida.
//
//   node produccion/extraer-frames.js temp/mi-anuncio
//   node produccion/extraer-frames.js temp/mi-anuncio --solo-montaje
//
// Deja en qa/ una tira horizontal por clip con 5 fotogramas (inicio, 25%, 50%,
// 75%, final). Con eso se detectan a simple vista: manos deformes, cambios de
// cara o de ropa dentro del mismo clip, material real colandose en el mundo
// tejido, y si el ultimo fotograma llego al estado que pedia el prompt.
//
// En un anuncio por bloques (UGC, tomas tipo R) cada bloque tiene varios planos,
// uno por tramo. Ahi la tira lleva UN fotograma a mitad de CADA tramo, en
// orden: es lo que se revisa (cara, ropa, producto, etiqueta, texto colado,
// persona de mas). Los ganchos alternativos (gancho-<id>.mp4) igual.
//
// Una toma hablada (tipo H, podcast y entrevista) se trata como una A: las 5
// fracciones fijas, sin tramos. El indice guarda ademas lo que se dice en ella
// ("lineas" o "dialogo") y de que referencia salio su frame inicial, para
// revisar la cara, la ropa y que no haya texto colado. Con --solo-montaje, en
// estos estilos entran tambien los clips de plan.escena (B-roll y cutaways).
//
// LIMITE IMPORTANTE: esto son fotogramas fijos. NO sirve para juzgar la fluidez
// del movimiento ni el audio. Eso solo se ve viendo el clip.
//
// CONTINUIDAD (el manifiesto trae el bloque "continuidad"): los pasos
// (paso-K.mp4) entran como clips de la cadena, en su orden, y ademas
//
//   node produccion/extraer-frames.js temp/mi-anuncio --uniones
//
// deja en qa/uniones/ una imagen por union de la cadena: el ULTIMO cuadro del
// clip que llega, la imagen a la que tenia que llegar y el PRIMER cuadro del
// clip que sigue, lado a lado. Es lo que se ve en cada corte del montaje
// (que nunca recorta), asi que ahi se nota si un paso no llego a su imagen.
// Gratis: solo ffmpeg.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { tieneContinuidad, cadenaDeClips } from './continuidad.js';

const N_FRAMES = 5;
const ANCHO = 400; // por fotograma en la tira

const ff = (args) => execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { encoding: 'utf8' });

const duracion = (f) =>
  Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {
      encoding: 'utf8',
    }).trim()
  );

/**
 * Una tira horizontal de N fotogramas de un clip.
 * Con `tiempos` (segundos), un fotograma en cada uno: lo usan los bloques R,
 * con la mitad de cada tramo. Sin `tiempos`, las 5 fracciones fijas de siempre.
 */
export function tiraDeClip(rutaClip, rutaSalida, { tiempos } = {}) {
  const d = duracion(rutaClip);
  // Se evitan los extremos exactos: el primer y ultimo frame suelen venir
  // en negro o a medio decodificar. (Por eso un tiempo dado tampoco pasa del 97%.)
  const fracciones = tiempos ? tiempos.map((t) => Math.min(Math.max(t, 0), d * 0.97) / d) : [0.02, 0.27, 0.5, 0.75, 0.97];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-'));
  const sueltos = [];

  try {
    for (let i = 0; i < fracciones.length; i++) {
      const t = (d * fracciones[i]).toFixed(3);
      const f = path.join(tmp, `f${i}.jpg`);
      ff(['-ss', t, '-i', rutaClip, '-frames:v', '1', '-vf', `scale=${ANCHO}:-2`, '-q:v', '3', f]);
      sueltos.push(f);
    }

    if (sueltos.length === 1) {
      // hstack necesita al menos dos entradas (un bloque de 4 s puede tener un solo tramo).
      fs.copyFileSync(sueltos[0], rutaSalida);
    } else {
      const entradas = sueltos.flatMap((f) => ['-i', f]);
      ff([...entradas, '-filter_complex', `hstack=inputs=${sueltos.length}`, '-q:v', '3', rutaSalida]);
    }

    return { duracion: d, fracciones, segundos: fracciones.map((x) => Number((d * x).toFixed(2))) };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- uniones (continuidad)

const PANEL_ANCHO = 360;
const PANEL_ALTO = 640;
const PANEL_SEPARACION = 6;

/** Cuantos cuadros tiene el stream de video de un clip (null si no se sabe). */
const cuadrosDe = (rutaClip) => {
  try {
    const n = Number(
      execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=nb_frames', '-of', 'csv=p=0', rutaClip], {
        encoding: 'utf8',
      }).trim()
    );
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
};

/** El PRIMER cuadro de un clip, como PNG. */
const primerCuadro = (rutaClip, rutaSalida) => ff(['-i', rutaClip, '-frames:v', '1', rutaSalida]);

/**
 * El ULTIMO cuadro de un clip, como PNG: decodifica el ultimo medio segundo y
 * se queda con el ultimo cuadro que sale (-update 1 pisa el archivo en cada
 * uno). "Duracion menos un poco" no sirve: a 24 fps cae 2 o 3 cuadros antes
 * del final, y lo que se ve en la union es justo el ultimo.
 */
const ultimoCuadro = (rutaClip, rutaSalida) => ff(['-sseof', '-0.5', '-i', rutaClip, '-update', '1', rutaSalida]);

/**
 * Cuanto se parecen dos imagenes (SSIM de 0 a 1, en grises a 360x640). Es
 * orientativo: sirve para ordenar que union mirar primero, no para aprobar.
 */
function parecido(a, b) {
  const r = spawnSync(
    'ffmpeg',
    [
      '-hide_banner', '-i', a, '-i', b,
      '-lavfi', `[0:v]scale=${PANEL_ANCHO}:${PANEL_ALTO},setsar=1,format=gray[x];[1:v]scale=${PANEL_ANCHO}:${PANEL_ALTO},setsar=1,format=gray[y];[x][y]ssim`,
      '-f', 'null', '-',
    ],
    { encoding: 'utf8' }
  );
  const mm = String(r.stderr || '').match(/All:\s*([\d.]+)/);
  return mm ? Number(Number(mm[1]).toFixed(3)) : null;
}

/** Varias imagenes lado a lado, todas a 360x640 (sin deformar), con una raya blanca entre ellas. */
function panelLadoALado(entradas, rutaSalida) {
  const n = entradas.length;
  const filtros = entradas.map(
    (_, i) =>
      `[${i}:v]scale=${PANEL_ANCHO}:${PANEL_ALTO}:force_original_aspect_ratio=decrease,` +
      `pad=${PANEL_ANCHO}:${PANEL_ALTO}:(ow-iw)/2:(oh-ih)/2:color=black,` +
      `pad=${PANEL_ANCHO + (i < n - 1 ? PANEL_SEPARACION : 0)}:${PANEL_ALTO}:0:0:color=white,setsar=1[p${i}]`
  );
  const salida = n > 1 ? `${entradas.map((_, i) => `[p${i}]`).join('')}hstack=inputs=${n}[out]` : null;
  const grafo = [...filtros, ...(salida ? [salida] : [])].join(';');
  ff([...entradas.flatMap((f) => ['-i', f]), '-filter_complex', grafo, '-map', n > 1 ? '[out]' : '[p0]', '-frames:v', '1', '-q:v', '3', rutaSalida]);
}

/**
 * qa/uniones/: una imagen por union de la cadena de continuidad.
 *
 *   00-inicio-<clip>.jpg         la imagen de salida | el primer cuadro del primer clip
 *   NN-<clip>--<siguiente>.jpg   el ultimo cuadro del clip | la imagen a la que tenia
 *                                que llegar | el primer cuadro del siguiente
 *   NN-<clip>-final.jpg          el ultimo cuadro del cierre | su imagen final (si es B)
 *
 * Mas indice.json con el cuadro de cada lado y el parecido (SSIM) con la
 * imagen. Los clips que faltan se saltan y se dice.
 */
export function escribirUniones(carpeta, manifiesto) {
  const dirVideo = path.join(carpeta, 'video');
  const dirImg = path.join(carpeta, 'img');
  const dirUniones = path.join(carpeta, 'qa', 'uniones');
  fs.mkdirSync(dirUniones, { recursive: true });
  // Lo de una corrida anterior (la cadena pudo cambiar): solo lo que escribe esto.
  for (const f of fs.readdirSync(dirUniones)) {
    if (/^\d{2,}-.+\.jpg$/.test(f) || f === 'indice.json') fs.rmSync(path.join(dirUniones, f), { force: true });
  }

  const cadena = cadenaDeClips(manifiesto);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uniones-'));
  const uniones = [];
  const faltan = [];
  const cuadro = new Map(); // `${archivo}:${primero|ultimo}` -> { ruta, n }

  const existeClip = (c) => fs.existsSync(path.join(dirVideo, c.archivo));
  const sacar = (c, cual) => {
    const k = `${c.archivo}:${cual}`;
    if (cuadro.has(k)) return cuadro.get(k);
    const ruta = path.join(tmp, `${c.id}-${cual}.png`);
    const rutaClip = path.join(dirVideo, c.archivo);
    if (cual === 'primero') primerCuadro(rutaClip, ruta);
    else ultimoCuadro(rutaClip, ruta);
    const total = cuadrosDe(rutaClip);
    const v = { ruta, n: cual === 'primero' ? 0 : total !== null ? total - 1 : null };
    cuadro.set(k, v);
    return v;
  };
  const imagen = (archivo) => {
    const ruta = path.join(dirImg, archivo);
    return fs.existsSync(ruta) ? ruta : null;
  };

  try {
    for (const c of cadena) if (!existeClip(c)) faltan.push(c.archivo);

    // Los puntos de la cadena: el arranque, cada corte entre dos clips y el final.
    const puntos = [];
    if (cadena.length) puntos.push({ antes: null, despues: cadena[0], img: cadena[0].imagenInicial });
    for (let i = 1; i < cadena.length; i++) puntos.push({ antes: cadena[i - 1], despues: cadena[i], img: cadena[i - 1].imagenFinal });
    if (cadena.length) puntos.push({ antes: cadena[cadena.length - 1], despues: null, img: cadena[cadena.length - 1].imagenFinal });

    puntos.forEach((p, i) => {
      const nombre =
        p.antes === null
          ? `${String(i).padStart(2, '0')}-inicio-${p.despues.id}.jpg`
          : p.despues === null
            ? `${String(i).padStart(2, '0')}-${p.antes.id}-final.jpg`
            : `${String(i).padStart(2, '0')}-${p.antes.id}--${p.despues.id}.jpg`;
      const rutaImg = p.img ? imagen(p.img) : null;
      const antes = p.antes && existeClip(p.antes) ? sacar(p.antes, 'ultimo') : null;
      const despues = p.despues && existeClip(p.despues) ? sacar(p.despues, 'primero') : null;
      const paneles = [antes?.ruta, rutaImg, despues?.ruta].filter(Boolean);
      const registro = {
        union: nombre,
        antes: p.antes ? { clip: p.antes.archivo, cuadro: antes?.n ?? null, falta: !antes || undefined } : null,
        imagen: p.img ? `img/${p.img}` : null,
        ...(p.img && !rutaImg ? { faltaImagen: true } : {}),
        despues: p.despues ? { clip: p.despues.archivo, cuadro: despues ? 0 : null, falta: !despues || undefined } : null,
        parecido: {
          llegada: antes && rutaImg ? parecido(antes.ruta, rutaImg) : null,
          salida: despues && rutaImg ? parecido(rutaImg, despues.ruta) : null,
        },
      };
      if (paneles.length) {
        panelLadoALado(paneles, path.join(dirUniones, nombre));
        registro.tira = `qa/uniones/${nombre}`;
      }
      uniones.push(registro);
    });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  fs.writeFileSync(
    path.join(dirUniones, 'indice.json'),
    JSON.stringify(
      {
        generado: new Date().toISOString(),
        nota:
          'Cada imagen: ultimo cuadro del clip | imagen a la que tenia que llegar | primer cuadro del siguiente. ' +
          'El montaje no recorta, asi que esto es lo que se ve en cada corte. "parecido" es SSIM (0 a 1): orientativo.',
        clips: cadena.map((c) => c.archivo),
        faltan,
        uniones,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
  return { dirUniones, uniones, faltan, cadena };
}

function cliUniones(args) {
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/extraer-frames.js <carpeta-del-anuncio> --uniones\n');
    process.exit(1);
  }
  const carpeta = path.resolve(carpetaArg);
  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  if (!tieneContinuidad(manifiesto)) {
    console.error('\n  --uniones es solo para anuncios con continuidad (el bloque "continuidad" del manifiesto).\n');
    process.exit(1);
  }

  console.log(`\n=== Uniones de la cadena — ${path.basename(carpeta)} ===\n`);
  const { dirUniones, uniones, faltan, cadena } = escribirUniones(carpeta, manifiesto);
  const f = (x) => (x === null || x === undefined ? '  -  ' : x.toFixed(3));
  console.log('  union                                   llega a la imagen   sale de la imagen');
  for (const u of uniones) {
    console.log(`  ${u.union.replace('.jpg', '').padEnd(38)}  ${f(u.parecido.llegada).padStart(17)}   ${f(u.parecido.salida).padStart(17)}`);
  }
  const conLlegada = uniones.filter((u) => u.parecido.llegada !== null).sort((a, b) => a.parecido.llegada - b.parecido.llegada);
  console.log(`\n  ${uniones.length} uniones de ${cadena.length} clips en ${dirUniones}`);
  console.log('  Cada imagen: ultimo cuadro del clip | imagen a la que tenia que llegar | primer cuadro del siguiente.');
  if (conLlegada.length) {
    console.log(`  Mira primero las que menos se parecen a su imagen: ${conLlegada.slice(0, 5).map((u) => `${u.union.replace('.jpg', '')} (${f(u.parecido.llegada)})`).join(', ')}`);
  }
  console.log('  "parecido" es SSIM de 0 a 1, orientativo: un cambio de luz o de encuadre lo baja sin que este mal.');
  if (faltan.length) console.log(`\n  Faltan ${faltan.length} clip(s), sus uniones van incompletas: ${faltan.join(', ')}`);
  console.log('\n  RECUERDA: son fotogramas fijos. El movimiento y los cuadros congelados en la union\n  hay que verlos reproduciendo el clip.\n');
}

const esCli = Boolean(process.argv[1] && process.argv[1].endsWith('extraer-frames.js'));

if (esCli && process.argv.slice(2).includes('--uniones')) {
  cliUniones(process.argv.slice(2));
} else if (esCli) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  const soloMontaje = args.includes('--solo-montaje');

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/extraer-frames.js <carpeta-del-anuncio> [--solo-montaje]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const dirVideo = path.join(carpeta, 'video');
  const dirQa = path.join(carpeta, 'qa');
  fs.mkdirSync(dirQa, { recursive: true });

  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));

  // Si hay plan de montaje, se puede revisar solo lo que de verdad entra al corte.
  let enElCorte = null;
  const rutaPlan = path.join(carpeta, 'plan-montaje.json');
  if (soloMontaje && fs.existsSync(rutaPlan)) {
    const plan = JSON.parse(fs.readFileSync(rutaPlan, 'utf8'));
    enElCorte = new Set();
    if (plan.continuidad) {
      // Continuidad: lo que entra es la cadena (pasos, propios B y cierre).
      for (const c of plan.continuidad.clips) enElCorte.add(c.archivo);
    } else {
      for (const b of plan.bloques) {
        enElCorte.add(b.toma.archivo);
        if (b.broll) enElCorte.add(b.broll.archivo);
      }
      // Estilos hablados: el B-roll y los cutaways viven en plan.escena, no en
      // los bloques. Un plan sin "escena" no cambia nada.
      for (const p of plan.escena?.piezas || []) if (p?.tipo === 'clip' && p.archivo) enElCorte.add(p.archivo);
    }
  }

  // Continuidad: la cadena manda el orden (y de donde sale cada paso).
  const cadena = tieneContinuidad(manifiesto) ? cadenaDeClips(manifiesto) : null;
  const enCadena = (f) => (cadena ? cadena.findIndex((c) => c.archivo === f) : -1);

  const clips = fs
    .readdirSync(dirVideo)
    .filter((f) => f.endsWith('.mp4'))
    .filter((f) => !enElCorte || enElCorte.has(f))
    .sort((a, b) => {
      if (cadena) {
        // Primero la cadena en su orden; lo que no entra (tomas A viejas,
        // B-roll de antes) despues, como siempre.
        const ia = enCadena(a);
        const ib = enCadena(b);
        if (ia !== -1 || ib !== -1) return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
      }
      const num = (s) => Number(s.match(/\d+/)?.[0] || 0);
      const esToma = (s) => (s.startsWith('toma') ? 0 : 1);
      return esToma(a) - esToma(b) || num(a) - num(b);
    });

  console.log(`\n=== Extrayendo frames — ${path.basename(carpeta)} ===\n`);
  console.log(`  ${clips.length} clips${enElCorte ? ' (solo los que entran al montaje)' : ''}\n`);

  const indice = [];

  let hayBloquesR = false;

  for (const clip of clips) {
    const salida = path.join(dirQa, clip.replace('.mp4', '.jpg'));

    // Bloques R (UGC por bloques): la toma R y cada gancho alternativo
    // (gancho-<id>.mp4) llevan un fotograma a mitad de cada tramo.
    const gancho = clip.startsWith('gancho-')
      ? (manifiesto.ganchos_alternativos || []).find((g) => `gancho-${g.id}.mp4` === clip)
      : null;
    if (gancho || (clip.startsWith('toma') && manifiesto.tomas.find((t) => t.n === Number(clip.match(/\d+/)?.[0]))?.tipo === 'R')) {
      hayBloquesR = true;
      const datosR = gancho || manifiesto.tomas.find((t) => t.n === Number(clip.match(/\d+/)[0]));
      const tramos = Array.isArray(datosR.tramos) ? datosR.tramos : [];
      const info = tiraDeClip(
        path.join(dirVideo, clip),
        salida,
        tramos.length ? { tiempos: tramos.map((tr) => (tr.desde + tr.hasta) / 2) } : {}
      );
      indice.push({
        clip,
        tira: path.relative(carpeta, salida).replace(/\\/g, '/'),
        duracion: Number(info.duracion.toFixed(2)),
        segundos: info.segundos,
        tipo: 'R',
        ...(gancho ? { gancho: gancho.id, reemplaza: gancho.reemplaza } : {}),
        linea: datosR.linea,
        referencias: datosR.referencias || [],
        // Que tiene que verse en cada fotograma: el tramo del que sale.
        tramos: tramos.map((tr, i) => ({ desde: tr.desde, hasta: tr.hasta, linea: tr.linea ?? null, fotograma: info.segundos[i] })),
        esperado: null, // un bloque R no tiene frames que comparar: se mira contra su prompt_video
      });
      console.log(`  ${clip.padEnd(16)} -> qa/${path.basename(salida)}   (${info.segundos.join('s, ')}s)  un fotograma por tramo`);
      continue;
    }

    const info = tiraDeClip(path.join(dirVideo, clip), salida);

    // Continuidad: un paso va de la imagen de su toma a la de la siguiente.
    const paso = cadena?.find((c) => c.rol === 'paso' && c.archivo === clip);
    if (paso) {
      const toma = manifiesto.tomas.find((t) => t.n === paso.deToma);
      indice.push({
        clip,
        tira: path.relative(carpeta, salida).replace(/\\/g, '/'),
        duracion: Number(info.duracion.toFixed(2)),
        segundos: info.segundos,
        tipo: 'paso',
        de: paso.deToma,
        a: paso.aToma,
        linea: toma?.linea,
        referencias: [],
        esperado: { imagenInicial: `img/${paso.imagenInicial}`, imagenFinal: `img/${paso.imagenFinal}` },
      });
      console.log(`  ${clip.padEnd(16)} -> qa/${path.basename(salida)}   (${info.segundos.join('s, ')}s)  paso ${paso.deToma} -> ${paso.aToma}`);
      continue;
    }

    const n = Number(clip.match(/\d+/)[0]);
    const esToma = clip.startsWith('toma');
    const datos = esToma
      ? manifiesto.tomas.find((t) => t.n === n)
      : (manifiesto.broll || []).find((b) => b.n === n);

    indice.push({
      clip,
      tira: path.relative(carpeta, salida).replace(/\\/g, '/'),
      duracion: Number(info.duracion.toFixed(2)),
      segundos: info.segundos,
      tipo: esToma ? datos?.tipo : 'broll',
      linea: esToma ? datos?.linea : datos?.sincroniza_con,
      referencias: datos?.referencias || [],
      esperado: esToma ? { inicial: datos?.prompt_imagen_inicial, final: datos?.prompt_imagen_final } : null,
      // Toma hablada (H): que se dice y de donde salio el frame (si fue copia
      // de una referencia, esperado.inicial es null y esto lo explica).
      ...(esToma && datos?.tipo === 'H'
        ? {
            frame_inicial: datos.frame_inicial ?? null,
            ...(Array.isArray(datos.lineas) ? { lineas: datos.lineas } : {}),
            ...(Array.isArray(datos.dialogo) ? { dialogo: datos.dialogo } : {}),
            ...(Array.isArray(datos.reacciones) ? { reacciones: datos.reacciones } : {}),
          }
        : {}),
    });

    console.log(`  ${clip.padEnd(16)} -> qa/${path.basename(salida)}   (${info.segundos.join('s, ')}s)`);
  }

  fs.writeFileSync(
    path.join(dirQa, 'indice.json'),
    JSON.stringify(
      {
        generado: new Date().toISOString(),
        nota: 'Fotogramas fijos. NO sirven para juzgar la fluidez del movimiento ni el audio.',
        frames: N_FRAMES,
        clips: indice,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  console.log(`\n  Listo. ${clips.length} tiras en ${dirQa}`);
  // (Si todas las tiras son de bloques R, la frase de las fracciones fijas sobra.)
  if (!hayBloquesR || indice.some((x) => x.tipo !== 'R')) console.log('  Cada tira: inicio, 27%, 50%, 75%, final.\n');
  if (hayBloquesR) {
    console.log('  En los bloques R (y sus ganchos): un fotograma a mitad de cada tramo, en orden.');
    console.log('  Revisa en cada uno cara, ropa, producto, etiqueta, texto colado y persona de mas.\n');
  }
  // Tomas habladas (H): la persona habla dentro del clip; se revisa como un bloque R.
  if (indice.some((x) => x.tipo === 'H')) {
    console.log('  En las tomas habladas (H): revisa cara, ropa, manos, producto, texto colado y persona de mas;');
    console.log('  lo que dice cada una esta en qa/indice.json (lineas, dialogo o reacciones).\n');
  }
  console.log('  RECUERDA: son fotogramas fijos. El movimiento y el audio hay que verlos\n  reproduciendo el clip.\n');
}
