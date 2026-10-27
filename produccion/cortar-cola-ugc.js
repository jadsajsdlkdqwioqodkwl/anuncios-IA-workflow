// UGC por bloques (tipo R) — corta la COLA de un bloque cuando el modelo sigue
// hablando despues de la ultima palabra del guion.
//
//   node produccion/cortar-cola-ugc.js temp/mi-anuncio
//   node produccion/cortar-cola-ugc.js temp/mi-anuncio --tomas 2,3
//   node produccion/cortar-cola-ugc.js temp/mi-anuncio --solo-plan     no transcribe nada
//
// POR QUE EXISTE. Un bloque se pide de 10, 8 o 6 s de una vez. Si el texto es
// corto para esa duracion, el modelo llena el tiempo que le sobra REPITIENDO el
// final. Medido el 2026-10-04 (temp/prueba-ugc-bloques/, Befem): el bloque 2
// llevaba 24 palabras en 10 s y termino diciendo "...y ando mucho mas
// tranquila, mucho mas tranquila". El recorte de bordes por silencio
// (recortar-bordes.js) no lo puede ver: la repeticion ES voz, no silencio.
//
// QUE HACE. Transcribe cada bloque con Scribe (transcribir() de
// subtitulos-dialogo.js), alinea la transcripcion contra `linea` del manifiesto
// y busca donde termina el guion. Si despues hay mas palabras, escribe
// toma-N.cola.json en la carpeta del anuncio:
//
//   { toma, fin, motivo, sobrantes, transcripcion, ultima_palabra, calidad, clip, generado }
//
// `fin` es el segundo DEL CLIP ORIGINAL (sin recortar) donde tiene que terminar
// el bloque: el fin de la ultima palabra del guion + 0.25 s. planear-montaje.js
// lo lee y termina el bloque en el menor entre ese punto y el borde por
// silencio. El mp4 NO se toca: el corte lo aplica el montaje, como el de bordes.
//
// Si no hay nada despues del guion, no escribe nada, y borra un cola.json viejo
// de esa toma si lo hubiera: seria de otra medicion y ya no vale.
//
// Costo: Scribe, ~US$0.22 la hora de audio (centavos por anuncio). La decision
// (decidirCola) es una funcion pura y se prueba sin gastar nada.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { cargarEnv } from './config.js';
import { alinear, normalizar, transcribir, UMBRAL_ALINEACION } from './subtitulos-dialogo.js';

/**
 * Aire que se deja despues de la ultima palabra del guion. Es el mismo margen
 * del recorte de bordes (RECORTE_BORDES.margenMs = 250): la boca termina de
 * cerrarse un poco despues de que se apaga el audio.
 */
export const MARGEN_COLA_S = 0.25;

/**
 * Cuantas palabras FINALES del guion pueden quedarse sin pareja en la
 * transcripcion y aun asi decidir.
 *
 * Pasa con los nombres de marca: el guion dice "Befem" y Scribe oye "Bephem".
 * La alineacion no los empareja, y sin este cuidado esa palabra quedaria
 * DESPUES del guion y se cortaria como si fuera una repeticion. Por eso, si
 * faltan 1 o 2 palabras al final, se toman como tales las siguientes de la
 * transcripcion. Si faltan mas, no se sabe donde termina el guion y no se
 * corta nada: es preferible dejar una repeticion (se ve en la revision) a
 * cortarle palabras al guion sin avisar.
 */
export const MAX_FINALES_SIN_PAREJA = 2;

/**
 * Lo que sobra despues del guion se corta SOLO si es claramente otra cosa:
 *   - repite palabras del guion (el caso medido: "mucho mas tranquila" otra vez), o
 *   - llega despues de una pausa clara (una muletilla suelta, un "okay").
 *
 * Si no cumple ninguna de las dos, puede ser el MISMO final mal transcrito: un
 * ASR que parte "recibir" en "re cibir" deja "cibir" pegado detras del guion, y
 * cortarlo le comeria la ultima palabra. Ahi no se corta y se avisa.
 *
 * 0.3 s es la duracion minima de silencio del recorte de bordes
 * (RECORTE_BORDES.duracionMinimaS): lo que el motor ya llama "silencio".
 */
export const PAUSA_CLARA_S = 0.3;

/**
 * Dos palabras "se parecen": iguales sin tildes ni puntuacion, o (si las dos
 * tienen 3 letras o mas) con el MISMO criterio de prefijo comun de la
 * alineacion de los subtitulos. Se le pregunta a alinear() en vez de copiar su
 * regla, para que no se separen.
 *
 * El minimo de 3 letras no es decorativo: con prefijo comun, una palabra de
 * una letra del guion ("y", "a", "o") se "parece" a cualquier cosa que empiece
 * igual ("okay", "al"), y un pedazo de palabra mal oido pasaria por repeticion.
 */
const parecidas = (a, b) => {
  const x = normalizar(a);
  const y = normalizar(b);
  if (x === y) return x.length > 0;
  return x.length >= 3 && y.length >= 3 && alinear([a], [b]).calidad === 1;
};

/** La linea hablada de un bloque. Si falta `linea`, se arma con sus tramos. */
export function lineaDeToma(toma) {
  if (typeof toma.linea === 'string' && toma.linea.trim()) return toma.linea;
  return (toma.tramos || [])
    .map((t) => t.linea)
    .filter((l) => typeof l === 'string' && l.trim())
    .join(' ');
}

/** Donde vive el corte de cola de un bloque: en la carpeta del anuncio. */
export const rutaCola = (carpeta, n) => path.join(carpeta, `toma-${n}.cola.json`);

const s = (x) => `${x.toFixed(2)}s`;

/**
 * Decide si un bloque tiene cola que cortar. FUNCION PURA: no lee ni escribe
 * archivos y no llama a ninguna API.
 *
 *   linea        el guion del bloque (`linea` del manifiesto)
 *   palabrasAsr  lo que devuelve transcribir(): [{ text, start, end }, ...]
 *
 * Devuelve { decision, fin, motivo, sobrantes, transcripcion, ultimaPalabra,
 * calidad, avisos }, con decision:
 *   'cortar'       hay voz despues del guion; `fin` es donde termina el bloque
 *   'nada'         el bloque termina con la ultima palabra del guion
 *   'sin-decidir'  no se sabe con seguridad donde termina el guion, o lo que
 *                  sigue podria ser el mismo final mal oido: no se corta nada
 *                  y `motivo` dice que escuchar
 *
 * DONDE TERMINA EL GUION. No alcanza con alinear la transcripcion entera: con
 * una repeticion, la alineacion empareja el final del guion con la SEGUNDA vez
 * que se dijo (empatan en puntaje y gana la ultima), y la cola quedaria
 * adentro. Por eso se alinea contra cada PRINCIPIO de la transcripcion (las
 * primeras k palabras) y se busca el k mas corto que ya alcanza la mejor
 * coincidencia: ahi el guion ya se dijo entero, y lo que viene despues sobra.
 */
export function decidirCola(linea, palabrasAsr) {
  const correctas = String(linea || '').split(/\s+/).filter(Boolean);
  const asr = (palabrasAsr || []).filter(
    (w) => w && String(w.text ?? '').trim() && Number.isFinite(w.start) && Number.isFinite(w.end)
  );
  const transcripcion = asr.map((w) => w.text).join(' ');
  const base = { fin: null, sobrantes: [], transcripcion, ultimaPalabra: null, calidad: 0, avisos: [] };

  if (!correctas.length) {
    return { ...base, decision: 'sin-decidir', motivo: 'el bloque no tiene linea en el manifiesto: no hay contra que comparar' };
  }
  if (!asr.length) {
    return { ...base, decision: 'sin-decidir', motivo: 'Scribe no oyo ninguna palabra en el clip' };
  }

  // 1. El principio mas corto de la transcripcion que ya contiene el guion.
  //    Solo se reemplaza con una mejora estricta: en un empate se queda el k
  //    mas corto, que es justo el que deja la repeticion afuera.
  const textos = asr.map((w) => w.text);
  let mejor = null;
  for (let k = 1; k <= textos.length; k++) {
    const { pares, calidad } = alinear(correctas, textos.slice(0, k));
    if (!mejor || calidad > mejor.calidad + 1e-9) mejor = { k, pares, calidad };
  }
  base.calidad = Number(mejor.calidad.toFixed(3));

  // El mismo umbral que los subtitulos: por debajo, la alineacion no es fiable.
  if (mejor.calidad < UMBRAL_ALINEACION) {
    return {
      ...base,
      decision: 'sin-decidir',
      motivo:
        `la alineacion fallo (solo ${(mejor.calidad * 100).toFixed(0)}% de las palabras del guion encontraron pareja, ` +
        `hace falta ${(UMBRAL_ALINEACION * 100).toFixed(0)}%). No se corta nada: revisa el bloque a mano`,
    };
  }

  // 2. La ultima palabra del guion que encontro pareja, y cuantas faltan detras.
  let iUltima = correctas.length - 1;
  while (iUltima >= 0 && mejor.pares[iUltima] === null) iUltima--;
  const faltan = correctas.length - 1 - iUltima;
  let jFin = mejor.pares[iUltima];
  let resto = asr.slice(jFin + 1);
  const avisos = [];

  if (faltan > MAX_FINALES_SIN_PAREJA) {
    return {
      ...base,
      decision: 'sin-decidir',
      motivo:
        `las ultimas ${faltan} palabras del guion ("${correctas.slice(iUltima + 1).join(' ')}") no aparecen en la ` +
        'transcripcion, asi que no se sabe donde termina el guion. No se corta nada: revisa el bloque a mano',
    };
  }
  // Lo mas probable es que Scribe las haya escrito distinto (una marca). Se
  // toman como esas palabras las que siguen en la transcripcion.
  const tomadas = resto.slice(0, faltan);
  if (faltan > 0) {
    const finales = correctas.slice(iUltima + 1).join(' ');
    avisos.push(
      tomadas.length
        ? `el final del guion ("${finales}") no coincide con lo que oyo Scribe; se toma como tal "${tomadas.map((w) => w.text).join(' ')}"`
        : `el final del guion ("${finales}") no aparece en la transcripcion: puede que el bloque no lo haya dicho`
    );
    jFin += tomadas.length;
    resto = resto.slice(tomadas.length);
  }

  const ultima = asr[jFin];
  const ultimaPalabra = { guion: correctas[correctas.length - 1], oida: ultima.text, fin: ultima.end };

  if (!resto.length) {
    return {
      ...base,
      decision: 'nada',
      ultimaPalabra,
      avisos,
      motivo: `el bloque termina con la ultima palabra del guion ("${ultima.text}", ${s(ultima.end)}): no hay cola que cortar`,
    };
  }

  // 3. Hay voz despues del guion. Se corta solo si es claramente otra cosa
  //    (ver PAUSA_CLARA_S): o repite el guion, o llega tras una pausa clara.
  const conocidas = [...correctas, ...tomadas.map((w) => w.text)];
  const repite = resto.every((w) => conocidas.some((c) => parecidas(c, w.text)));
  const pausa = Math.max(0, resto[0].start - ultima.end);
  const sobrantes = resto.map((w) => ({ texto: w.text, inicio: w.start, fin: w.end }));
  const dicho = resto.map((w) => w.text).join(' ');

  if (!repite && pausa < PAUSA_CLARA_S) {
    return {
      ...base,
      decision: 'sin-decidir',
      ultimaPalabra,
      sobrantes,
      avisos,
      motivo:
        `despues de "${ultima.text}" (${s(ultima.end)}) Scribe oyo "${dicho}" pegado (pausa de ${s(pausa)}) y no repite el guion: ` +
        'puede ser el mismo final mal transcrito. No se corta nada: escucha el final del bloque',
    };
  }

  //    El bloque termina en la ultima palabra mas el margen. Si lo que sobra
  //    arranca antes, el margen se achica a la mitad de la pausa: ni se come
  //    el final de la palabra ni asoma la primera silaba de la repeticion.
  const fin = Number((ultima.end + Math.min(MARGEN_COLA_S, pausa / 2)).toFixed(3));

  return {
    ...base,
    decision: 'cortar',
    fin,
    ultimaPalabra,
    sobrantes,
    avisos,
    motivo:
      `despues de la ultima palabra del guion ("${ultima.text}", termina en ${s(ultima.end)}) ` +
      `${repite ? 'repite' : 'sigue hablando'}: "${dicho}" (${s(resto[0].start)}-${s(resto[resto.length - 1].end)}). ` +
      `El bloque termina en ${s(fin)}`,
  };
}

/**
 * Decide y deja el archivo como corresponde: escribe toma-N.cola.json si hay
 * que cortar; si no, borra uno viejo si existia. Separada de la transcripcion
 * para poder probarla con una transcripcion ya guardada, sin gastar.
 */
export function procesarToma({ carpeta, toma, palabrasAsr }) {
  const ruta = rutaCola(carpeta, toma.n);
  const r = decidirCola(lineaDeToma(toma), palabrasAsr);

  if (r.decision === 'cortar') {
    const clip = path.join(carpeta, 'video', `toma-${toma.n}.mp4`);
    const datos = {
      toma: toma.n,
      fin: r.fin,
      motivo: r.motivo,
      sobrantes: r.sobrantes,
      transcripcion: r.transcripcion,
      ultima_palabra: r.ultimaPalabra,
      calidad: r.calidad,
      avisos: r.avisos,
      // Huella del clip que se midio. Si el clip cambia (se regenero o se
      // reemplazo a mano), el montaje no aplica este corte a un clip ajeno.
      clip: {
        archivo: `video/toma-${toma.n}.mp4`,
        bytes: fs.existsSync(clip) ? fs.statSync(clip).size : null,
      },
      generado: new Date().toISOString(),
    };
    fs.writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n', 'utf8');
    return { ...r, escrito: ruta, borrado: false };
  }

  const habia = fs.existsSync(ruta);
  if (habia) fs.rmSync(ruta);
  return { ...r, escrito: null, borrado: habia };
}

/** Extrae el audio de un clip a un mp3 mono de 16 kHz (lo mismo que los subtitulos). */
function audioDeClip(rutaClip, destino) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', rutaClip, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', destino]);
  return destino;
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('cortar-cola-ugc.js')) {
  const args = process.argv.slice(2);
  const iT = args.indexOf('--tomas');
  const carpetaArg = args.find((a, i) => !a.startsWith('--') && (iT === -1 || i !== iT + 1));
  const soloPlan = args.includes('--solo-plan');
  const soloTomas =
    iT !== -1 && args[iT + 1]
      ? args[iT + 1].split(',').map((x) => Number(x.trim())).filter(Number.isInteger)
      : null;

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/cortar-cola-ugc.js <carpeta-del-anuncio> [--tomas 2,3] [--solo-plan]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const rutaManifiesto = path.join(carpeta, 'manifiesto.json');
  if (!fs.existsSync(rutaManifiesto)) {
    console.error(`\n  No encuentro ${rutaManifiesto}\n`);
    process.exit(1);
  }
  const manifiesto = JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8'));
  const bloquesR = (manifiesto.tomas || []).filter((t) => t.tipo === 'R');

  console.log(`\n=== Corte de cola (UGC por bloques) — ${path.basename(carpeta)} ===\n`);

  if (!bloquesR.length) {
    console.log('  Este manifiesto no tiene bloques tipo R. Nada que hacer: el corte de cola es solo para UGC por bloques.\n');
    process.exit(0);
  }

  if (soloTomas) {
    const noR = soloTomas.filter((n) => !bloquesR.some((t) => t.n === n));
    if (noR.length) {
      console.error(
        noR.length === 1
          ? `  La toma ${noR[0]} no existe o no es un bloque tipo R.\n`
          : `  Las tomas ${noR.join(', ')} no existen o no son bloques tipo R.\n`
      );
      process.exit(1);
    }
  }
  const elegidos = soloTomas ? bloquesR.filter((t) => soloTomas.includes(t.n)) : bloquesR;

  const conClip = [];
  for (const t of elegidos) {
    const clip = path.join(carpeta, 'video', `toma-${t.n}.mp4`);
    if (fs.existsSync(clip)) conClip.push({ toma: t, clip });
    else console.log(`  bloque ${t.n}: no encuentro video/toma-${t.n}.mp4, se salta.`);
  }

  if (soloPlan) {
    const segundos = conClip.reduce((a, x) => a + (Number(x.toma.duracion) || 0), 0);
    console.log('  --solo-plan: no se transcribe nada.\n');
    for (const { toma } of conClip) {
      const ruta = rutaCola(carpeta, toma.n);
      let estado = 'sin corte de cola';
      if (fs.existsSync(ruta)) {
        try {
          estado = `ya tiene corte de cola en ${s(Number(JSON.parse(fs.readFileSync(ruta, 'utf8')).fin))}`;
        } catch {
          estado = `tiene un ${path.basename(ruta)} ilegible (se reemplaza al correr)`;
        }
      }
      console.log(`  bloque ${toma.n} (${toma.duracion} s): se transcribiria. Hoy: ${estado}.`);
      console.log(`      guion: "${lineaDeToma(toma)}"`);
    }
    console.log(
      `\n  Scribe: ~${segundos} s de audio, ~US$${((segundos / 3600) * 0.22).toFixed(4)}. ` +
        `Para hacerlo:\n      npm run ugc:cola -- ${carpetaArg}${soloTomas ? ` --tomas ${soloTomas.join(',')}` : ''}\n`
    );
    process.exit(0);
  }

  if (!conClip.length) {
    console.log('\n  Ningun bloque tiene clip todavia. Genera primero los videos.\n');
    process.exit(1);
  }

  try {
    cargarEnv();
  } catch (e) {
    console.error(`\n  ${e.message}\n`);
    process.exit(1);
  }
  const idioma = manifiesto.idioma === 'es' ? 'spa' : manifiesto.idioma === 'pt' ? 'por' : 'eng';
  const dirTmp = path.join(carpeta, '.stt-cola');
  fs.mkdirSync(dirTmp, { recursive: true });

  const errores = [];
  for (const { toma, clip } of conClip) {
    try {
      const mp3 = audioDeClip(clip, path.join(dirTmp, `toma-${toma.n}.mp3`));
      const palabrasAsr = await transcribir(mp3, idioma);
      const r = procesarToma({ carpeta, toma, palabrasAsr });

      if (r.decision === 'cortar') {
        console.log(`  bloque ${toma.n}: SE CORTA LA COLA en ${s(r.fin)}`);
      } else if (r.decision === 'nada') {
        console.log(`  bloque ${toma.n}: nada que cortar`);
      } else {
        console.log(`  bloque ${toma.n}: NO SE PUDO DECIDIR, no se corta nada`);
      }
      console.log(`      ${r.motivo}`);
      for (const a of r.avisos) console.log(`      !  ${a}`);
      // Siempre, tambien cuando se corta: esta salida ES la revision de la
      // transcripcion contra el guion (que lo dijo todo, sin cortar ni cambiar
      // palabras). Una marca mal escrita por Scribe no es un defecto.
      console.log(`      guion: "${lineaDeToma(toma)}"`);
      console.log(`      oido:  "${r.transcripcion}"`);
      if (r.calidad > 0 && r.calidad < 1) {
        console.log(
          `      !  solo ${Math.round(r.calidad * 100)}% de las palabras del guion encontraron pareja en lo oido: ` +
            'escucha el bloque (puede faltar o cambiar una palabra; una marca mal escrita no cuenta).'
        );
      }
      if (r.escrito) console.log(`      guardado en ${path.basename(r.escrito)}`);
      if (r.borrado) console.log(`      borrado el ${path.basename(rutaCola(carpeta, toma.n))} anterior (ya no vale)`);
    } catch (e) {
      errores.push(toma.n);
      console.log(`  bloque ${toma.n}: ERROR, no se toco su corte de cola. ${e.message}`);
    }
  }

  fs.rmSync(dirTmp, { recursive: true, force: true });

  console.log('\n  El mp4 no se toca: el corte lo aplica el montaje. Ahora:');
  console.log(`      npm run plan -- ${carpetaArg}\n`);
  if (errores.length) process.exit(1);
}
