// Entrevista, variante A — la voz de la historia (clips solo_voz) sin los
// silencios de adentro y a 1.2x, video y audio.
//
//   node produccion/recortar-voz.js temp/mi-anuncio
//   node produccion/recortar-voz.js temp/mi-anuncio --tomas 3,4
//   node produccion/recortar-voz.js temp/mi-anuncio --velocidad 1.2
//   node produccion/recortar-voz.js temp/mi-anuncio --forzar        vuelve a cortar las ya recortadas
//   node produccion/recortar-voz.js temp/mi-anuncio --solo-plan     no toca ningun clip
//   (npm run voz -- temp/mi-anuncio)
//
// POR QUE EXISTE. En la variante A la historia la cuenta la voz de la persona
// sobre la cadena de B-roll: esos clips (tomas solo_voz) no se ven, solo se
// oyen. Omni los genera con pausas largas entre frase y frase y, a ritmo de
// anuncio, la historia se arrastra. En Befem A (2026-10-14) se aprobo de oido
// sacarle los silencios de adentro y pasarla a 1.2x. Es la UNICA excepcion a
// "nunca acelerar un clip hablado": en un clip que se ve, acelerar deforma la
// voz y rompe la sincronizacion de labios; aqui no hay labios a la vista y
// atempo conserva el tono.
//
// QUE HACE. Para cada toma H con solo_voz de la entrevista (y SOLO esas: en
// cualquier otro estilo avisa y no hace nada), con los tiempos de cada
// palabra de lineas-habladas.json (por volumen no sirve: el ambiente de calle
// nunca es silencio):
//   - se queda con lo que va desde la primera palabra que se oye hasta la
//     ULTIMA PALABRA DEL GUION (limitesDelGuion de lineas-habladas.js, la
//     misma regla del recorte de bordes del montaje): lo que se oye despues,
//     una repeticion o una muletilla, queda fuera;
//   - parte la voz en tramos donde hay un silencio de huecoMinSeg (0.18 s) o
//     mas, y deja aireSeg (0.07 s) a cada lado de cada tramo; antes de la
//     primera palabra, cabezaSeg (0.12 s), y despues de la ultima, colaSeg
//     (0.25 s), sin llegar nunca a la palabra que queda fuera;
//   - une los tramos, con 12 ms de fundido en cada corte para que no suene
//     un clic, y acelera video y audio a 1.2x (atempo: conserva el tono).
//
// ORIGINALES. El clip crudo queda en video/originales/toma-N.mp4 y su medida
// en toma-N.json: { palabras, largo } del clip crudo, y modo, velocidad,
// tramos, salidaTamano (los bytes del clip que se dejo en video/) y
// salidaLargo. Si el clip de video/ no es el que dejo este paso (otro
// tamano: se regenero), ese pasa a ser el original nuevo, el anterior va a
// historial/, y su medida tiene que ser de ESE clip (npm run lineas antes; se
// comprueba por el tamano, o por el largo en una medida de antes).
//
// UNA SOLA VEZ. Una toma ya recortada (su clip de video/ pesa salidaTamano)
// se salta: correrlo otra vez no toca nada, ni el clip ni su medida. Con
// --forzar se vuelve a cortar, siempre desde el original guardado (nunca lo
// ya recortado): sirve para probar otra --velocidad.
//
// DESPUES. Los tiempos del clip cambiaron: su entrada de lineas-habladas.json
// se quita (era del clip crudo, que queda en originales/) y hay que volver a
// medir: al final se imprime el comando exacto, `npm run lineas -- <carpeta>
// --tomas N,...` con las tomas que se cortaron (y las ya recortadas que
// siguen sin medir); despues plan, subtitulos y plan. El montaje reconoce el
// clip ya recortado (salidaTamano) y no le vuelve a cortar los bordes.
//
// Costo: ninguno. Solo ffmpeg, unos segundos por clip; no gasta creditos.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { archivarSiExiste } from './historial.js';
import {
  avisoMedidaVieja,
  estadoDeMedida,
  estadoDeMedidaDelClip,
  leerMedidas,
  limitesDelGuion,
  quitarMedidas,
  TOLERANCIA_LARGO_S,
} from './lineas-habladas.js';
import { REGLAS_HABLADO } from './planear-montaje.js';

/**
 * Las reglas de la entrevista en el montaje (REGLAS_HABLADO.entrevista), o {}
 * si todavia no se pueden leer. Se leen al USARLAS, nunca al importar este
 * archivo: asi importarlo no tiene efectos, aunque planear-montaje.js lo
 * importe a su vez (en un ciclo, REGLAS_HABLADO todavia no existe al cargar).
 */
function deEntrevista() {
  try {
    return REGLAS_HABLADO?.entrevista || {};
  } catch {
    return {};
  }
}

/**
 * Las medidas del paso. Primero REGLAS_HABLADO.entrevista.voz (las del paso
 * voz, si el montaje las define: velocidad, huecoMinSeg, aireSeg, cabezaSeg,
 * colaSeg); despues las de la entrevista que el montaje tambien usa (cabeza y
 * cola del recorte de bordes, vozVelocidad, huecoMinSeg, aireSeg), para que
 * las dos cosas corten igual; y si no estan, estos mismos valores.
 */
const regla = (claveVoz, claveEntrevista, porDefecto) => {
  const e = deEntrevista();
  return e.voz?.[claveVoz] ?? e[claveEntrevista] ?? porDefecto;
};
export const REGLAS_VOZ = {
  get velocidad() {
    return regla('velocidad', 'vozVelocidad', 1.2); // lo aprobado de oido en Befem A
  },
  get huecoMinSeg() {
    return regla('huecoMinSeg', 'huecoMinSeg', 0.18); // un silencio mas corto no se corta
  },
  get aireSeg() {
    return regla('aireSeg', 'aireSeg', 0.07); // lo que se deja a cada lado de un tramo de voz
  },
  get cabezaSeg() {
    return regla('cabezaSeg', 'cabezaSeg', 0.12); // antes de la primera palabra
  },
  get colaSeg() {
    return regla('colaSeg', 'colaSeg', 0.25); // despues de la ultima palabra del guion
  },
  fundidoSeg: 0.012, // en cada corte, para que no suene un clic
  // Una medida de antes (sin tamano) es de este clip si el largo coincide hasta aca.
  get toleranciaLargoSeg() {
    return TOLERANCIA_LARGO_S;
  },
};

/** Entre estas velocidades atempo suena natural; fuera de eso no se acepta. */
export const VELOCIDAD_MIN = 1;
export const VELOCIDAD_MAX = 1.5;

const r3 = (x) => Math.round(x * 1000) / 1000;
const s = (x) => `${x.toFixed(2)}s`;

/**
 * Los tramos de voz que quedan. FUNCION PURA.
 *
 *   palabras   las del ASR del clip CRUDO, con letras o cifras (limitesDelGuion().palabras)
 *   hasta      el indice de la ultima palabra que cuenta (la ultima del guion)
 *   siguiente  el segundo en que arranca la primera que queda fuera, o null
 *   largo      lo que dura el clip crudo
 *
 * Devuelve [[desde, hasta], ...] en segundos del clip crudo, en orden y sin
 * pisarse.
 */
export function tramosDeVoz({ palabras, hasta, siguiente = null, largo }, reglas = REGLAS_VOZ) {
  const voz = (palabras || []).slice(0, hasta + 1);
  if (!voz.length) return [];
  const grupos = [];
  let ini = voz[0].start;
  let fin = voz[0].end;
  for (const p of voz.slice(1)) {
    if (p.start - fin >= reglas.huecoMinSeg) {
      grupos.push([ini, fin]);
      ini = p.start;
    }
    fin = Math.max(fin, p.end);
  }
  grupos.push([ini, fin]);
  // La cola nunca llega a la primera silaba de lo que queda fuera: si arranca
  // antes, se achica a la mitad de la pausa (como el corte de cola de UGC).
  const cola = siguiente === null ? reglas.colaSeg : Math.min(reglas.colaSeg, Math.max(0, (siguiente - fin) / 2));
  const tope = Number.isFinite(largo) ? largo : Infinity;
  return grupos.map(([a, b], i) => [
    r3(Math.max(0, a - (i === 0 ? reglas.cabezaSeg : reglas.aireSeg))),
    r3(Math.min(tope, b + (i === grupos.length - 1 ? cola : reglas.aireSeg))),
  ]);
}

/**
 * El filtro de ffmpeg: cada tramo recortado (video y audio, con su fundido),
 * todos unidos, y la velocidad (setpts para el video, atempo para el audio).
 * FUNCION PURA.
 */
export function filtroDeVoz(tramos, velocidad, fundido = REGLAS_VOZ.fundidoSeg) {
  const partes = tramos
    .map(
      ([a, b], i) =>
        `[0:v]trim=${r3(a)}:${r3(b)},setpts=PTS-STARTPTS[v${i}];` +
        `[0:a]atrim=${r3(a)}:${r3(b)},asetpts=PTS-STARTPTS,afade=t=in:d=${fundido},` +
        `afade=t=out:st=${r3(Math.max(0, b - a - fundido))}:d=${fundido}[a${i}];`
    )
    .join('');
  const entradas = tramos.map((_, i) => `[v${i}][a${i}]`).join('');
  const final = velocidad !== 1 ? `[vc]setpts=PTS/${velocidad}[v];[ac]atempo=${velocidad}[a]` : '[vc]null[v];[ac]anull[a]';
  return `${partes}${entradas}concat=n=${tramos.length}:v=1:a=1[vc][ac];${final}`;
}

/** Cuanto dura lo que queda, a esa velocidad. */
export const largoDeSalida = (tramos, velocidad) => r3(tramos.reduce((t, [a, b]) => t + (b - a), 0) / velocidad);

// ---------------------------------------------------------------- ffprobe

function duracionDe(archivo) {
  const n = parseFloat(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', archivo], { encoding: 'utf8' })
  );
  return Number.isFinite(n) ? r3(n) : null;
}

/** El largo anotado si lo hay; si no, el del clip medido con ffprobe (null si tampoco se puede). */
function largoAnotadoOMedido(anotado, archivo) {
  if (Number.isFinite(anotado)) return anotado;
  try {
    return duracionDe(archivo);
  } catch {
    return null;
  }
}

/** Los cuadros por segundo del video (24 si no se puede leer) y si tiene audio. */
function streamsDe(archivo) {
  const salida = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,r_frame_rate', '-of', 'json', archivo], {
    encoding: 'utf8',
  });
  const streams = JSON.parse(salida).streams || [];
  const v = streams.find((x) => x.codec_type === 'video');
  let fps = 24;
  if (v?.r_frame_rate) {
    const [num, den] = v.r_frame_rate.split('/').map(Number);
    if (num > 0 && den > 0) fps = r3(num / den);
  }
  return { video: Boolean(v), audio: streams.some((x) => x.codec_type === 'audio'), fps };
}

// ---------------------------------------------------------------- una toma

/**
 * Prepara una toma sin tocar nada: de que clip se parte (el original
 * guardado o el de video/, que pasa a ser el original), con que palabras, y
 * los tramos que quedan. Devuelve { n, fuente, palabras, largo, limites,
 * tramos, salida, avisos }, { n, error } o, si ya esta recortada y no se pide
 * `forzar`, { n, saltada: true, velocidadHecha, salidaLargo }: no se toca
 * (salidaLargo es el anotado en originales/toma-N.json o, si no lo trae, lo
 * que dura el clip de video/ medido con ffprobe; null si tampoco se puede).
 *
 *   idioma        el del anuncio (los numeros del guion en letras)
 *   carpetaTexto  como se escribe la carpeta en los comandos que se sugieren
 */
export function prepararToma({ carpeta, toma, medidas, velocidad, reglas = REGLAS_VOZ, forzar = false, idioma = 'es', carpetaTexto = '<carpeta>' }) {
  const n = toma.n;
  const clip = path.join(carpeta, 'video', `toma-${n}.mp4`);
  const dirOrig = path.join(carpeta, 'video', 'originales');
  const origMp4 = path.join(dirOrig, `toma-${n}.mp4`);
  const origJson = path.join(dirOrig, `toma-${n}.json`);
  const avisos = [];
  if (!fs.existsSync(clip)) return { n, error: `no encuentro video/toma-${n}.mp4` };
  if (typeof toma.linea !== 'string' || !toma.linea.trim()) return { n, error: 'no tiene linea en el manifiesto: no hay guion contra que cortar' };

  let info = null;
  if (fs.existsSync(origJson)) {
    try {
      info = JSON.parse(fs.readFileSync(origJson, 'utf8'));
    } catch {
      avisos.push(`video/originales/toma-${n}.json no se puede leer: el clip de video/ se toma como el original`);
    }
  }
  const tamano = fs.statSync(clip).size;
  let fuente;
  let palabras;
  let largo;
  if (info && info.salidaTamano === tamano) {
    // El clip de video/ es el que dejo este paso: ya esta recortado. Sin
    // --forzar no se toca (correr el paso dos veces no cambia nada).
    if (!forzar) {
      // Un clip que recorto la herramienta de prueba de Befem A no anoto
      // salidaLargo: se mide el de video/ (es ese mismo clip, pesa salidaTamano).
      return { n, saltada: true, velocidadHecha: info.velocidad, salidaLargo: largoAnotadoOMedido(info.salidaLargo, clip), clip };
    }
    // Con --forzar se vuelve a cortar desde el original.
    if (!fs.existsSync(origMp4) || !Array.isArray(info.palabras) || !info.palabras.length) {
      return {
        n,
        error:
          `video/toma-${n}.mp4 ya esta recortado, pero en video/originales/ falta el clip original o su medida: ` +
          'no se puede volver a recortar sin recortar lo recortado',
      };
    }
    fuente = 'original';
    palabras = info.palabras;
    largo = Number.isFinite(info.largo) ? info.largo : duracionDe(origMp4);
  } else {
    // El clip de video/ es crudo (primera vez, o se regenero): pasa a ser el
    // original, y su medida tiene que ser de ESE clip.
    fuente = 'crudo';
    const medida = medidas?.tomas?.[String(n)];
    if (!medida || !Array.isArray(medida.palabras) || !medida.palabras.length) {
      return { n, error: `falta su medida en lineas-habladas.json. Corre antes:  npm run lineas -- ${carpetaTexto} --tomas ${n}` };
    }
    // La medida tiene que ser de ESTE clip: por el tamano (o por el largo, en
    // una medida de antes). Una de otro clip (se regenero) es como si faltara.
    const real = duracionDe(clip);
    const vigencia = estadoDeMedida(medida, { tamano, largo: real });
    if (vigencia.estado === 'vieja') return { n, error: `${avisoMedidaVieja(n, carpetaTexto)} (${vigencia.motivo}).` };
    if (vigencia.sinComprobar) avisos.push(vigencia.motivo);
    if (medida.limpio === false) {
      avisos.push('la toma NO ESTA LIMPIA (npm run lineas): se recorta igual, pero hay que regenerarla');
    }
    if (info || fs.existsSync(origMp4)) avisos.push('el clip de video/ es nuevo (se regenero): el original anterior va a historial/');
    palabras = medida.palabras;
    largo = Number.isFinite(real) ? real : medida.largo;
  }

  const limites = limitesDelGuion(toma.linea, palabras, { idioma });
  if (!limites) return { n, error: 'Scribe no oyo ninguna palabra en el clip: no hay voz que recortar' };
  if (limites.decision === 'sin-decidir') {
    avisos.push(`no se sabe bien donde termina el guion (${limites.motivo}): se corta despues de la ultima palabra que se oye`);
  }
  const fuera = limites.palabras.slice(limites.hasta + 1);
  if (fuera.length) {
    avisos.push(
      `queda fuera lo que se oye despues de la ultima palabra del guion: "${fuera.map((w) => w.text).join(' ')}" ` +
        `(${s(fuera[0].start)}-${s(fuera[fuera.length - 1].end)})`
    );
  }
  const tramos = tramosDeVoz({ palabras: limites.palabras, hasta: limites.hasta, siguiente: limites.siguiente, largo }, reglas);
  if (!tramos.length || tramos.some(([a, b]) => !(b > a))) return { n, error: 'los tramos de voz salieron vacios: revisa la medida del clip' };
  return {
    n,
    fuente,
    clip,
    origMp4,
    origJson,
    palabras: palabras.map((w) => ({ text: String(w.text), start: w.start, end: w.end })),
    largo,
    tramos,
    velocidad,
    salida: largoDeSalida(tramos, velocidad),
    avisos,
  };
}

/** Manda un original viejo (mp4 y json) a historial/ como toma-N-original--<fecha>. */
function archivarOriginal(carpeta, p) {
  for (const ruta of [p.origMp4, p.origJson]) {
    if (!fs.existsSync(ruta)) continue;
    const renombrado = ruta.replace(/(toma-\d+)\.(mp4|json)$/, '$1-original.$2');
    fs.renameSync(ruta, renombrado);
    archivarSiExiste(renombrado, carpeta);
  }
}

/** Hace el recorte de una toma ya preparada: guarda el original, corta, acelera y anota. */
export function aplicarToma(carpeta, p, reglas = REGLAS_VOZ) {
  fs.mkdirSync(path.dirname(p.origMp4), { recursive: true });
  if (p.fuente === 'crudo') {
    archivarOriginal(carpeta, p);
    fs.copyFileSync(p.clip, p.origMp4);
  }
  const { video, audio, fps } = streamsDe(p.origMp4);
  if (!video || !audio) throw new Error(`el clip original no tiene ${!video ? 'video' : 'audio'}`);
  const tmp = p.clip.replace(/\.mp4$/, '.voz-tmp.mp4');
  try {
    execFileSync(
      'ffmpeg',
      [
        '-v', 'error', '-y', '-i', p.origMp4,
        '-filter_complex', filtroDeVoz(p.tramos, p.velocidad, reglas.fundidoSeg),
        '-map', '[v]', '-map', '[a]',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-r', String(fps), '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-ar', '48000', '-b:a', '192k',
        tmp,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] }
    );
    fs.renameSync(tmp, p.clip);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
  const meta = {
    palabras: p.palabras,
    largo: p.largo,
    modo: 'voz',
    velocidad: p.velocidad,
    tramos: p.tramos,
    salidaTamano: fs.statSync(p.clip).size,
    salidaLargo: duracionDe(p.clip),
    generado: new Date().toISOString(),
  };
  fs.writeFileSync(p.origJson, JSON.stringify(meta, null, 2) + '\n', 'utf8');
  return meta;
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('recortar-voz.js')) {
  const args = process.argv.slice(2);
  const valor = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
  const conValor = new Set(['--tomas', '--velocidad']);
  const carpetaArg = args.find((a, i) => !a.startsWith('--') && !(i > 0 && conValor.has(args[i - 1])));
  const soloPlan = args.includes('--solo-plan');
  const forzar = args.includes('--forzar');

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/recortar-voz.js <carpeta-del-anuncio> [--tomas 3,4] [--velocidad 1.2] [--forzar] [--solo-plan]\n');
    process.exit(1);
  }
  const carpeta = path.resolve(carpetaArg);
  const rutaManifiesto = path.join(carpeta, 'manifiesto.json');
  if (!fs.existsSync(rutaManifiesto)) {
    console.error(`\n  No encuentro ${rutaManifiesto}\n`);
    process.exit(1);
  }
  const manifiesto = JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8'));

  console.log(`\n=== Voz de la historia (entrevista A) — ${path.basename(carpeta)} ===\n`);

  if (manifiesto.estilo !== 'entrevista') {
    console.log(
      `  Este anuncio es "${manifiesto.estilo ?? 'sin estilo'}": recortar la voz es solo para la entrevista (la voz de la historia\n` +
        '  de la variante A, tomas solo_voz). No se toca nada.\n'
    );
    process.exit(0);
  }
  const deVoz = (manifiesto.tomas || []).filter((t) => t.tipo === 'H' && t.solo_voz === true);
  if (!deVoz.length) {
    console.log('  Este anuncio no tiene tomas solo_voz (la voz de la historia de la variante A). No se toca nada.\n');
    process.exit(0);
  }

  let velocidad = REGLAS_VOZ.velocidad;
  if (valor('--velocidad') !== undefined) {
    velocidad = Number(valor('--velocidad'));
    if (!Number.isFinite(velocidad) || velocidad < VELOCIDAD_MIN || velocidad > VELOCIDAD_MAX) {
      console.error(`  --velocidad tiene que ser un numero entre ${VELOCIDAD_MIN} y ${VELOCIDAD_MAX} (el valor aprobado es 1.2). Llego: ${valor('--velocidad')}\n`);
      process.exit(1);
    }
  }
  let elegidas = deVoz;
  if (valor('--tomas') !== undefined) {
    const pedidas = String(valor('--tomas'))
      .split(',')
      .map((x) => Number(x.trim()))
      .filter(Number.isInteger);
    const otras = pedidas.filter((n) => !deVoz.some((t) => t.n === n));
    if (!pedidas.length || otras.length) {
      const que = !otras.length
        ? '--tomas no trae ningun numero.'
        : otras.length === 1
          ? `La toma ${otras[0]} no existe o no es de la voz de la historia (solo_voz).`
          : `Las tomas ${otras.join(', ')} no existen o no son de la voz de la historia (solo_voz).`;
      console.error(`  ${que} Las de la voz de la historia son: ${deVoz.map((t) => t.n).join(', ')}.\n`);
      process.exit(1);
    }
    elegidas = deVoz.filter((t) => pedidas.includes(t.n));
  }

  const medidas = leerMedidas(carpeta);
  const idioma = ['es', 'en', 'pt'].includes(manifiesto.idioma) ? manifiesto.idioma : 'es';
  const planes = elegidas.map((toma) => prepararToma({ carpeta, toma, medidas, velocidad, forzar, idioma, carpetaTexto: carpetaArg }));
  if (soloPlan) console.log('  --solo-plan: no se toca ningun clip.\n');

  const hechas = [];
  const saltadas = [];
  const errores = [];
  for (const p of planes) {
    if (p.error) {
      errores.push(p.n);
      console.log(`  toma ${p.n}: NO SE RECORTA. ${p.error}`);
      console.log('');
      continue;
    }
    if (p.saltada) {
      // Ya recortada: no se toca. Si su medida no es la del clip recortado,
      // va al comando de lineas del final.
      const vigencia = estadoDeMedidaDelClip(carpeta, p.n, medidas?.tomas?.[String(p.n)]);
      const medida = vigencia.estado === 'vigente' ? 'ya medida' : vigencia.estado === 'vieja' ? 'su medida es de otro clip' : 'falta medirla';
      saltadas.push({ n: p.n, sinMedida: vigencia.estado !== 'vigente' });
      const otraVelocidad = valor('--velocidad') !== undefined && Number(p.velocidadHecha) !== velocidad;
      // Lo que se sabe del recorte hecho: sin dato, no se nombra.
      const hecho = [
        Number.isFinite(p.velocidadHecha) ? `a ${p.velocidadHecha}x` : '',
        Number.isFinite(p.salidaLargo) ? `dura ${s(p.salidaLargo)}` : '',
      ].filter(Boolean);
      console.log(
        `  toma ${p.n}: ya recortada (${hecho.length ? `${hecho.join(', ')}; ` : ''}${medida}), ${soloPlan ? 'se saltaria' : 'se salta'}. ` +
          `${otraVelocidad ? `Pediste ${velocidad}x: para` : 'Para'} cortarla otra vez desde su original: --forzar`
      );
      console.log('');
      continue;
    }
    const dentro = p.tramos.reduce((t, [a, b]) => t + (b - a), 0);
    const desde = p.fuente === 'original' ? 'desde su original guardado' : 'el clip de video/ pasa a ser el original';
    console.log(
      `  toma ${p.n} (${desde}): ${s(p.largo)} -> ${s(p.salida)} a ${p.velocidad}x, ${p.tramos.length} tramo(s), ` +
        `se sacan ${s(Math.max(0, p.largo - dentro))} de silencio y bordes`
    );
    console.log(`      tramos: ${p.tramos.map(([a, b]) => `${a.toFixed(2)}-${b.toFixed(2)}`).join('  ')}`);
    for (const a of p.avisos) console.log(`      !  ${a}`);
    if (!soloPlan) {
      try {
        const meta = aplicarToma(carpeta, p);
        hechas.push(p.n);
        console.log(
          `      listo: video/toma-${p.n}.mp4${Number.isFinite(meta.salidaLargo) ? ` dura ${s(meta.salidaLargo)}` : ''}; el original esta en video/originales/`
        );
      } catch (e) {
        errores.push(p.n);
        console.log(`      ERROR, no se recorto: ${String(e.stderr || e.message).trim().slice(0, 400)}`);
      }
    }
    console.log('');
  }

  if (soloPlan) {
    const opciones = `${valor('--tomas') ? ` --tomas ${valor('--tomas')}` : ''}${valor('--velocidad') ? ` --velocidad ${valor('--velocidad')}` : ''}${forzar ? ' --forzar' : ''}`;
    if (planes.some((p) => !p.error && !p.saltada)) console.log(`  Para hacerlo:  npm run voz -- ${carpetaArg}${opciones}`);
    else if (saltadas.length) console.log('  No se cortaria nada: ya estan recortadas (para volver a cortarlas desde el original: --forzar).');
    const sinMedir = saltadas.filter((x) => x.sinMedida).map((x) => x.n);
    if (sinMedir.length) console.log(`  Las ya recortadas que siguen sin su medida:  npm run lineas -- ${carpetaArg} --tomas ${sinMedir.join(',')}`);
    console.log('');
    process.exit(errores.length ? 1 : 0);
  }
  if (hechas.length) {
    const quitadas = quitarMedidas(carpeta, hechas);
    if (quitadas.length) console.log(`  Su medida vieja se quito de lineas-habladas.json (la del clip crudo queda en video/originales/).`);
  }
  // Las que hay que medir: las que se cortaron ahora y las ya recortadas que
  // siguen sin su medida.
  const porMedir = [...hechas, ...saltadas.filter((x) => x.sinMedida).map((x) => x.n)].sort((a, b) => a - b);
  if (porMedir.length) {
    console.log(
      hechas.length
        ? '  Los tiempos de esos clips cambiaron. Ahora, en este orden:'
        : '  No se corto nada, pero hay clips ya recortados sin su medida. Ahora, en este orden:'
    );
    console.log(`      npm run lineas -- ${carpetaArg} --tomas ${porMedir.join(',')}`);
    console.log(`      npm run plan -- ${carpetaArg}`);
    console.log(`      node produccion/subtitulos-dialogo.js ${carpetaArg}`);
    console.log(`      npm run plan -- ${carpetaArg}\n`);
  } else if (saltadas.length && !errores.length) {
    console.log('  Nada que hacer: las tomas ya estaban recortadas y medidas. No se toco ningun archivo.\n');
  }
  if (errores.length) process.exit(1);
}
