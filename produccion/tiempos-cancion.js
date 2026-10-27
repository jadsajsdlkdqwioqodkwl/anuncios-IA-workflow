// FASE 2.4b para modo_audio: musica — convierte la letra con tiempos de Suno
// en el mismo audio/tiempos.json que produce ElevenLabs en voz_en_off.
//
//   node produccion/tiempos-cancion.js temp/mi-anuncio
//
// POR QUE ESTE ARCHIVO EXISTE, y por que no hay nada mas que tocar del montaje:
// `tiempos.json` es la columna vertebral del montaje.
// De el comen planear-montaje.js (las ventanas de cada toma), subtitulos.js
// (el tiempo de cada palabra) y plan-para-humanos.js. Si este archivo escribe
// esa MISMA forma, el resto del pipeline funciona sin enterarse de que la voz
// es una cancion.
//
// Corre DESPUES del manifiesto, porque necesita saber que linea es cada toma.
//
// Requiere:  audio/cancion.json   (lo deja generar-cancion.js --elegir N)
//            manifiesto.json      (lo escribe la skill visual)

import fs from 'node:fs';
import path from 'node:path';
import { palabrasDesdeAlineacion } from './subtitulos.js';

/**
 * Una toma INSTRUMENTAL es la que cubre un tramo donde no se canta nada: la
 * intro antes de la primera palabra, un puente, el cierre. Su linea es una
 * marca entre corchetes —"[intro]", "[instrumental]", "[cierre]"— y por eso
 * NO se subtitula: no hay nada cantado que subtitular.
 *
 * El validador exige que toda toma tenga "linea" no vacia, asi que la marca es
 * ademas la unica forma legal de declararla.
 */
export const esInstrumental = (texto) => /^\s*\[[^\]]*\]\s*$/.test(String(texto || ''));

/**
 * Convierte los tiempos POR PALABRA de Suno en la alineacion POR CARACTER que
 * usa el resto del proyecto.
 *
 * No es un formato inventado: es exactamente el que devuelve ElevenLabs
 * (characters / character_start_times_seconds / character_end_times_seconds).
 * Escribiendolo asi, `tiemposPorLinea()` y `palabrasDesdeAlineacion()` se
 * reusan tal cual, sin una linea de codigo duplicada.
 *
 * Los caracteres de cada palabra se reparten linealmente dentro de su ventana.
 * Eso NO inventa precision que no exista: la unidad real sigue siendo la
 * palabra, y es la unica unidad que el subtitulo resalta.
 */
export function alineacionDesdePalabras(alignedWords) {
  const characters = [];
  const inicios = [];
  const fines = [];
  let anteriorFin = null;
  let descartadas = 0;

  for (const w of alignedWords || []) {
    // Suno pega la marca de seccion a la primera palabra del bloque:
    //   "[Verse]\nOtra"  ->  nos quedamos con "Otra".
    const limpio = String(w?.word ?? '')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const ini = Number(w?.startS);
    const fin = Number(w?.endS);
    if (!limpio || !Number.isFinite(ini) || !Number.isFinite(fin) || fin < ini) {
      if (limpio) descartadas++;
      continue;
    }

    // Separador entre palabras: ocupa el hueco, que es lo que hace que
    // palabrasDesdeAlineacion corte donde tiene que cortar.
    if (characters.length) {
      characters.push(' ');
      inicios.push(Number(anteriorFin.toFixed(3)));
      fines.push(Number(Math.max(anteriorFin, ini).toFixed(3)));
    }

    const paso = limpio.length > 0 ? (fin - ini) / limpio.length : 0;
    for (let i = 0; i < limpio.length; i++) {
      characters.push(limpio[i]);
      inicios.push(Number((ini + paso * i).toFixed(3)));
      fines.push(Number((ini + paso * (i + 1)).toFixed(3)));
    }
    anteriorFin = fin;
  }

  return {
    alignment: {
      characters,
      character_start_times_seconds: inicios,
      character_end_times_seconds: fines,
    },
    descartadas,
  };
}

const soloLetras = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/**
 * Ubica cada linea del manifiesto dentro de las palabras de la cancion.
 *
 * POR QUE NO SE REUSA `tiemposPorLinea()` DE generar-audio.js, que hace algo
 * parecido: aquel CONSUME el texto en orden y avanza el cursor aunque la linea
 * no haya coincidido. En una voz en off eso casi no molesta, porque el audio
 * dice exactamente lo que dice el guion. En una cancion no: Suno a veces
 * repite un verso, alarga una palabra o se come una linea, y una sola linea
 * que no calza DESCOLOCA A TODAS LAS SIGUIENTES. Medido en la prueba de
 * bordes: con una linea inventada en medio, la siguiente —que si estaba
 * cantada— caia 1.6s tarde y se marcaba como no encontrada.
 *
 * Aqui se BUSCA hacia adelante desde el cursor y el cursor solo avanza cuando
 * hubo coincidencia. Una linea que falla se queda sin tiempo (y se interpola
 * despues), pero no arrastra a las demas.
 *
 * Buscar hacia adelante y no en toda la cancion es lo que hace que un coro
 * repetido caiga en la repeticion correcta: las tomas van en orden.
 */
export function ubicarLineas(palabras, lineas) {
  const norm = palabras.map((p) => soloLetras(p.texto));
  const resultado = [];
  let cursor = 0;

  for (const linea of lineas) {
    const objetivo = soloLetras(linea.texto);
    if (!objetivo) {
      resultado.push({ ...linea, inicio: null, fin: null, encontrada: false });
      continue;
    }

    // Se compara contra un prefijo: tolera que la cancion adorne el final de
    // la linea (un "yeah", una vocal estirada) sin perder la ubicacion.
    const prefijo = objetivo.slice(0, Math.min(20, objetivo.length));
    let hallada = null;

    for (let p = cursor; p < palabras.length; p++) {
      if (!norm[p]) continue;
      let acumulado = '';
      let ultimo = p;
      for (let q = p; q < palabras.length && acumulado.length < objetivo.length; q++) {
        if (!norm[q]) continue;
        acumulado += norm[q];
        ultimo = q;
      }
      if (acumulado.startsWith(prefijo)) {
        hallada = { desde: p, hasta: ultimo };
        break;
      }
    }

    if (hallada) {
      resultado.push({
        ...linea,
        inicio: Number(palabras[hallada.desde].inicio.toFixed(3)),
        fin: Number(palabras[hallada.hasta].fin.toFixed(3)),
        encontrada: true,
      });
      cursor = hallada.hasta + 1;
    } else {
      resultado.push({ ...linea, inicio: null, fin: null, encontrada: false });
    }
  }

  return resultado;
}

/**
 * Les da un inicio a las tomas instrumentales, repartiendo el hueco entre la
 * linea cantada anterior y la siguiente en proporcion a lo que cada una dura.
 *
 * Tambien tapa el hueco de una linea cantada que no se pudo ubicar: se
 * interpola entre sus vecinas y se marca `encontrada: false`, para que salga
 * en el aviso. Nunca se deja un `inicio` en null: planear-montaje lo usa como
 * numero y un null convierte la ventana en NaN sin decir por que.
 */
export function repartirHuecos(lineas, duracionTotal) {
  const salida = lineas.map((l) => ({ ...l }));
  const avisos = [];

  const tieneTiempo = (l) => typeof l.inicio === 'number' && Number.isFinite(l.inicio);

  let i = 0;
  while (i < salida.length) {
    if (tieneTiempo(salida[i])) {
      i++;
      continue;
    }

    // Tramo seguido de tomas sin tiempo propio.
    let j = i;
    while (j < salida.length && !tieneTiempo(salida[j])) j++;

    const anterior = i > 0 ? salida[i - 1] : null;
    const siguiente = j < salida.length ? salida[j] : null;

    const desde = anterior ? (anterior.fin ?? anterior.inicio) : 0;
    const hasta = siguiente ? siguiente.inicio : duracionTotal;
    const hueco = hasta - desde;

    const tramo = salida.slice(i, j);
    const total = tramo.reduce((s, l) => s + (Number(l.duracionPrevista) || 1), 0);

    if (hueco <= 0.05) {
      // No hay sitio real. Se reparte un margen minimo para no romper el orden
      // y se avisa fuerte: es un guion que no calza con la cancion.
      avisos.push(
        `no hay hueco para ${tramo.length} toma(s) entre ${desde.toFixed(2)}s y ${hasta.toFixed(2)}s ` +
          `(tomas ${tramo.map((t) => t.toma).join(', ')})`
      );
    }

    let cursor = desde;
    for (const l of tramo) {
      const peso = (Number(l.duracionPrevista) || 1) / total;
      const trozo = Math.max(hueco, 0) * peso;
      l.inicio = Number(cursor.toFixed(3));
      l.fin = Number((cursor + trozo).toFixed(3));
      if (l.encontrada === undefined) l.encontrada = true; // instrumental: es correcta por definicion
      cursor += trozo;
    }

    i = j;
  }

  // El orden tiene que ser estrictamente creciente: planear-montaje calcula la
  // ventana como inicio[i+1] - inicio[i], y un retroceso da una ventana negativa.
  for (let k = 1; k < salida.length; k++) {
    if (salida[k].inicio < salida[k - 1].inicio) {
      avisos.push(
        `la toma ${salida[k].toma} arranca en ${salida[k].inicio.toFixed(2)}s, antes que la ${salida[k - 1].toma} ` +
          `(${salida[k - 1].inicio.toFixed(2)}s). Se corrigio para no romper el montaje.`
      );
      salida[k].inicio = salida[k - 1].inicio;
    }
  }

  return { lineas: salida, avisos };
}

/** Arma el tiempos.json completo. Separado del CLI para poder probarlo. */
export function construirTiempos({ manifiesto, cancion }) {
  // `palabras` son los tiempos MEDIDOS sobre el audio con Scribe, alineados
  // contra la letra (lo escribe generar-cancion.js --elegir). Es la fuente
  // buena. `alignedWords` es lo que devolvio Suno y se desplaza hasta 4.5s
  // alrededor de las notas sostenidas — solo se usa si no hay lo otro, y
  // avisando, para no dejar tirado un cancion.json viejo.
  const usaScribe = Array.isArray(cancion.palabras) && cancion.palabras.length > 0;
  const fuente = usaScribe
    ? cancion.palabras.map((p) => ({ word: p.texto, startS: p.inicio, endS: p.fin }))
    : cancion.alignedWords;

  const { alignment, descartadas } = alineacionDesdePalabras(fuente);

  const todas = manifiesto.tomas.map((t) => ({
    toma: t.n,
    tipo: t.tipo,
    texto: t.linea,
    duracionPrevista: t.duracion,
    instrumental: esInstrumental(t.linea),
  }));

  // Solo las cantadas se buscan dentro de la letra: las instrumentales no
  // estan ahi y buscarlas movería el cursor sin motivo.
  const palabras = palabrasDesdeAlineacion(alignment);
  const cantadas = todas.filter((l) => !l.instrumental);
  const ubicadas = ubicarLineas(palabras, cantadas);
  const porToma = new Map(ubicadas.map((l) => [l.toma, l]));

  const mezcladas = todas.map((l) => {
    if (l.instrumental) return { ...l, inicio: null, fin: null, encontrada: true };
    const u = porToma.get(l.toma);
    // Una linea no encontrada se deja SIN tiempo a proposito, para que la
    // interpole repartirHuecos entre sus vecinas. Darle el tiempo que devolvio
    // una busqueda fallida es peor que no darle ninguno: parece medido.
    if (!u?.encontrada) return { ...l, inicio: null, fin: null, encontrada: false };
    return { ...l, inicio: u.inicio, fin: u.fin, encontrada: true };
  });

  const { lineas, avisos } = repartirHuecos(mezcladas, cancion.duracion);

  return {
    generado: new Date().toISOString(),
    origen: usaScribe ? 'scribe-alineado-contra-la-letra' : 'suno-timestamped-lyrics (SIN MEDIR)',
    voz: { id: cancion.audioId, nombre: cancion.titulo, clonada: false },
    modelo: `suno ${cancion.estilo || ''}`.trim(),
    ajustes: { vocalGender: cancion.vocalGender ?? null, hootCer: cancion.hootCer ?? null },
    duracion: cancion.duracion,
    lineas,
    alignment,
    avisos,
    descartadas,
  };
}

/**
 * MODO --lineas: mide cada linea de la letra ANTES de que exista el manifiesto.
 *
 * Para que sirve: en historias musicales cada linea de la letra es una toma, y
 * el manifiesto tiene que llevar la duracion REAL de cada una (de ahi sale la
 * duracion del clip que se pide). Leer 60 o 100 lineas contra las palabras
 * de cancion.json a mano es lento y se equivoca; esto lo imprime.
 *
 * Entrada: cancion/lineas.txt — una linea por toma, en orden, con el mismo
 * texto de la letra (sin las marcas [Verse]). Se permiten marcas solas como
 * "[intro]" o "[cierre]" para reservar tomas instrumentales.
 *
 * Salida: tabla con inicio, fin y ventana (hasta el inicio de la siguiente)
 * de cada linea, y avisos de las que pasan del tope de 10s.
 */
function medirLineas({ cancion, textoLineas }) {
  const usaScribe = Array.isArray(cancion.palabras) && cancion.palabras.length > 0;
  const fuente = usaScribe
    ? cancion.palabras.map((p) => ({ word: p.texto, startS: p.inicio, endS: p.fin }))
    : cancion.alignedWords;
  const { alignment } = alineacionDesdePalabras(fuente);
  const palabras = palabrasDesdeAlineacion(alignment);

  const lineas = textoLineas
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((texto, i) => ({ toma: i + 1, texto, duracionPrevista: 1, instrumental: esInstrumental(texto) }));

  const cantadas = lineas.filter((l) => !l.instrumental);
  const ubicadas = ubicarLineas(palabras, cantadas);
  const porToma = new Map(ubicadas.map((l) => [l.toma, l]));
  const mezcladas = lineas.map((l) => {
    if (l.instrumental) return { ...l, inicio: null, fin: null, encontrada: true };
    const u = porToma.get(l.toma);
    if (!u?.encontrada) return { ...l, inicio: null, fin: null, encontrada: false };
    return { ...l, inicio: u.inicio, fin: u.fin, encontrada: true };
  });
  const { lineas: conTiempo, avisos } = repartirHuecos(mezcladas, cancion.duracion);
  return { lineas: conTiempo, avisos, palabras: palabras.length, usaScribe };
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('tiempos-cancion.js')) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  const modoLineas = args.includes('--lineas');
  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/tiempos-cancion.js <carpeta-del-anuncio> [--lineas]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const rutaCancion = path.join(carpeta, 'audio', 'cancion.json');
  const rutaManifiesto = path.join(carpeta, 'manifiesto.json');

  if (!fs.existsSync(rutaCancion)) {
    console.error(`\n  Falta ${rutaCancion}. Genera y elige la cancion primero:`);
    console.error(`      npm run cancion -- ${carpetaArg}`);
    console.error(`      npm run cancion -- ${carpetaArg} --elegir 1\n`);
    process.exit(1);
  }

  if (modoLineas) {
    const rutaLineas = path.join(carpeta, 'cancion', 'lineas.txt');
    if (!fs.existsSync(rutaLineas)) {
      console.error(`\n  Falta ${rutaLineas}: una linea por toma, con el texto exacto de la letra.\n`);
      process.exit(1);
    }
    const cancion = JSON.parse(fs.readFileSync(rutaCancion, 'utf8'));
    const { lineas, avisos, palabras, usaScribe } = medirLineas({ cancion, textoLineas: fs.readFileSync(rutaLineas, 'utf8') });

    console.log(`\n=== Tiempos por linea — ${path.basename(carpeta)} ===\n`);
    console.log(`  Cancion:   ${cancion.titulo}   ${cancion.duracion.toFixed(2)}s`);
    console.log(`  Palabras:  ${palabras}${usaScribe ? ' (medidas con Scribe)' : ' (de Suno, SIN MEDIR)'}`);
    console.log(`  Lineas:    ${lineas.length}\n`);
    console.log('  toma   inicio      fin  ventana  palabras  linea');
    console.log('  ----  -------  -------  -------  --------  ---------------------------------');
    const TOPE = 10;
    const largas = [];
    const sinUbicar = [];
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i];
      const desde = i === 0 ? 0 : l.inicio;
      const hasta = i + 1 < lineas.length ? lineas[i + 1].inicio : cancion.duracion;
      const ventana = hasta - desde;
      const n = l.instrumental ? 0 : l.texto.split(/\s+/).length;
      const marca = l.instrumental ? '  ~' : !l.encontrada ? '  <- no la ubique' : ventana > TOPE ? '  <- PASA DE 10s' : '';
      if (!l.instrumental && !l.encontrada) sinUbicar.push(l);
      if (ventana > TOPE) largas.push({ ...l, ventana });
      console.log(
        `  ${String(l.toma).padStart(4)}  ${desde.toFixed(2).padStart(6)}s  ${hasta.toFixed(2).padStart(6)}s  ${ventana.toFixed(1).padStart(5)}s  ${String(n).padStart(8)}  ${l.texto.slice(0, 40)}${marca}`
      );
    }
    // Huecos al principio y al final que no tienen toma propia.
    const primera = lineas.find((l) => !l.instrumental);
    if (primera && lineas[0] === primera && primera.inicio > 1.5) {
      console.log(`\n  AVISO: la letra empieza en ${primera.inicio.toFixed(2)}s. Agrega una linea "[intro]" al principio de lineas.txt.`);
    }
    const ultima = lineas[lineas.length - 1];
    if (ultima && !ultima.instrumental && cancion.duracion - ultima.fin > 1.5) {
      console.log(`\n  AVISO: la letra termina en ${ultima.fin.toFixed(2)}s y la cancion en ${cancion.duracion.toFixed(2)}s. Agrega "[cierre]" al final.`);
    }
    if (largas.length) {
      console.log(`\n  ${largas.length} linea(s) con ventana mayor a ${TOPE}s. Partelas en dos tomas (dos lineas en lineas.txt):`);
      for (const l of largas) console.log(`    toma ${l.toma} (${l.ventana.toFixed(1)}s): ${l.texto.slice(0, 70)}`);
    }
    if (sinUbicar.length) {
      console.log(`\n  ${sinUbicar.length} linea(s) no se ubicaron en la letra cantada (tiempo interpolado):`);
      for (const l of sinUbicar) console.log(`    toma ${l.toma}: ${l.texto.slice(0, 70)}`);
    }
    for (const a of avisos) console.log(`\n  AVISO: ${a}`);
    console.log('\n  Con esta tabla se escribe el manifiesto: "duracion" de cada toma = su ventana.');
    console.log(`  Despues:  npm run tiempos -- ${carpetaArg}\n`);
    process.exit(0);
  }

  if (!fs.existsSync(rutaManifiesto)) {
    console.error(`\n  Falta ${rutaManifiesto}. El manifiesto lo escribe la skill visual.\n`);
    process.exit(1);
  }

  const manifiesto = JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8'));
  const cancion = JSON.parse(fs.readFileSync(rutaCancion, 'utf8'));

  if (manifiesto.modo_audio !== 'musica') {
    console.error(`\n  Este anuncio esta en modo_audio "${manifiesto.modo_audio}".`);
    console.error('  Este script es solo para "musica". En voz_en_off los tiempos los da ElevenLabs\n  con  npm run audio.\n');
    process.exit(1);
  }

  const tiempos = construirTiempos({ manifiesto, cancion });
  const salida = path.join(carpeta, 'audio', 'tiempos.json');
  fs.writeFileSync(salida, JSON.stringify(tiempos, null, 2) + '\n', 'utf8');

  const palabras = palabrasDesdeAlineacion(tiempos.alignment);

  console.log(`\n=== Tiempos de la cancion — ${path.basename(carpeta)} ===\n`);
  if (tiempos.origen.startsWith('suno')) {
    console.log('  AVISO: este cancion.json no trae los tiempos medidos con Scribe.');
    console.log('  Se estan usando los de Suno, que se desplazan hasta 4.5s en las notas');
    console.log(`  sostenidas. Vuelve a fijar la cancion:  npm run cancion -- ${carpetaArg} --elegir N\n`);
  }
  console.log(`  Cancion:   ${cancion.titulo}`);
  console.log(`  Duracion:  ${tiempos.duracion.toFixed(2)}s  <- la del anuncio`);
  console.log(`  Palabras:  ${palabras.length} ubicadas${tiempos.descartadas ? ` (${tiempos.descartadas} sin tiempo, descartadas)` : ''}`);
  console.log(`  Tomas:     ${tiempos.lineas.length} (${tiempos.lineas.filter((l) => l.instrumental).length} instrumentales)\n`);

  console.log('  toma   inicio      fin    dura   prevista  linea');
  console.log('  ----  -------  -------  ------  --------  ---------------------------');
  for (const l of tiempos.lineas) {
    const dura = (l.fin - l.inicio).toFixed(1);
    const marca = l.instrumental ? '  ~' : !l.encontrada ? '  <- no la ubique' : '';
    const texto = String(l.texto).slice(0, 34);
    console.log(
      `  ${String(l.toma).padStart(4)}  ${l.inicio.toFixed(2).padStart(6)}s  ${l.fin.toFixed(2).padStart(6)}s  ${dura.padStart(5)}s  ${String(l.duracionPrevista).padStart(7)}s  ${texto}${marca}`
    );
  }

  const sinUbicar = tiempos.lineas.filter((l) => !l.instrumental && !l.encontrada);
  if (sinUbicar.length) {
    console.log(`\n  AVISO: ${sinUbicar.length} linea(s) cantada(s) no se ubicaron en la letra.`);
    console.log('  Su tiempo esta interpolado entre las vecinas, no medido.');
    console.log('  Suele pasar si la linea del manifiesto no coincide con la letra que se canto.');
    for (const l of sinUbicar) console.log(`    toma ${l.toma}: "${l.texto}"`);
  }

  for (const a of tiempos.avisos) console.log(`\n  AVISO: ${a}`);

  // La ventana de cada toma llega hasta el inicio de la siguiente, asi que un
  // tramo sin letra que no tenga su propia toma se lo come la toma anterior.
  // Eso no falla aqui: falla mucho mas tarde, en el montaje, con "clip mas
  // corto que la ventana", y para entonces los clips ya estan pagados.
  const TOPE_CLIP = 10;
  const problemas = [];
  for (let i = 0; i < tiempos.lineas.length; i++) {
    const l = tiempos.lineas[i];
    // La PRIMERA toma se ancla al fotograma 0 en el render, aunque su
    // linea empiece mas tarde. Si la cancion abre
    // con una intro instrumental y la toma 1 es cantada, esa toma se estira
    // sobre toda la intro sin que nada lo diga. Por eso la ventana de la
    // primera se mide desde 0 y no desde su inicio.
    const desde = i === 0 ? 0 : l.inicio;
    const fin = i + 1 < tiempos.lineas.length ? tiempos.lineas[i + 1].inicio : tiempos.duracion;
    const ventana = fin - desde;
    if (ventana > TOPE_CLIP) {
      problemas.push(
        `toma ${l.toma}: su ventana es de ${ventana.toFixed(1)}s y un clip no pasa de ${TOPE_CLIP}s. ` +
          'Parte ese tramo en dos o mas tomas.'
      );
    } else if (ventana - Number(l.duracionPrevista || 0) > 3) {
      problemas.push(
        `toma ${l.toma}: ventana de ${ventana.toFixed(1)}s para una toma declarada de ${l.duracionPrevista}s. ` +
          'Sobra tanto que probablemente falta una toma instrumental en ese hueco.'
      );
    }
  }
  if (problemas.length) {
    console.log('\n  REVISAR ANTES DE GENERAR IMAGENES:');
    for (const p of problemas) console.log(`    - ${p}`);
    console.log('\n  Arreglar esto ahora es editar el manifiesto. Despues es rehacer clips pagados.');
  }

  console.log(`\n  Escrito en ${salida}`);
  console.log('\n  Desde aqui el montaje es el de siempre:');
  console.log(`      npm run plan -- ${carpetaArg}`);
  console.log(`      npm run subtitulos -- ${carpetaArg}`);
  console.log(`      npm run plan -- ${carpetaArg}`);
  console.log(`      npm run ensamblar -- ${carpetaArg}\n`);
}
