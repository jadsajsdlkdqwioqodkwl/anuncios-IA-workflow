// FASE 2.4 para modo_audio: musica — genera la CANCION del anuncio con Suno.
//
//   node produccion/generar-cancion.js temp/mi-anuncio            genera las 2 versiones
//   node produccion/generar-cancion.js temp/mi-anuncio --solo-plan
//   node produccion/generar-cancion.js temp/mi-anuncio --elegir 2  fija la elegida
//
// NO confundir con generar-musica.js. Aquel hace la cama INSTRUMENTAL que va
// por debajo de una voz; este hace la cancion CANTADA que ES el anuncio. En un
// anuncio musical no hay musica de fondo: la cancion ocupa el lugar de la voz.
//
// Corre ANTES que el manifiesto, no despues: la duracion real de la cancion es
// la duracion del anuncio, y el desglose de tomas se escribe sabiendola. Por
// eso este script no lee manifiesto.json — lee cancion/peticion.json, que lo
// escribe la skill de anuncios musicales (o la de historias musicales).
//
// Suno devuelve SIEMPRE dos versiones de la misma letra. Las dos se bajan y
// las elige el usuario de oido; ninguna se descarta sola.
//
// CANCIONES LARGAS (historias musicales, 2026-09-14). Cuatro campos opcionales
// en peticion.json, todos aditivos — sin ellos este script hace exactamente lo
// de siempre:
//
//   "estilos": ["...", "..."]   varios prompts de estilo. Se lanza UNA
//                               generacion por estilo (12 creditos cada una) y
//                               el usuario elige entre todas las versiones.
//   "bloques": ["...", "..."]   la letra partida en bloques de <= ~3.500
//                               caracteres. Se genera SOLO el primero; al
//                               elegir version, los demas se agregan con
//                               EXTEND de Suno sobre la elegida, uno tras otro.
//                               La union de los bloques tiene que ser la letra.
//   "modelo": "V5_5"            V5_5 (por defecto), V6, V6_MINI, V6_WILD...
//   "idioma": "spa"             el de la letra, para Scribe. "eng", "por"...
//
// Verificado con dinero el 2026-09-14 (temp/prueba-historia-musical): una letra
// de 3.300 caracteres se canta entera en una generacion (4:00-4:50); EXTEND
// devuelve la cancion COMPLETA y unida (no solo el trozo nuevo), empalma justo
// despues de la ultima palabra y canta el bloque nuevo entero.
//
// Docs: https://docs.kie.ai/suno-api/generate-music
//       https://docs.kie.ai/suno-api/extend-music
//       https://docs.kie.ai/suno-api/get-timestamped-lyrics

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { execFileSync } from 'node:child_process';
import { KIE, creditosAUsd, cargarEnv, requerirClave } from './config.js';
import { descargar, consultarCreditos, consultarTarea } from './kie-client.js';
import { MUSICA, esperarMusica } from './generar-musica.js';
import { transcribir, alinear, tiemparPalabras, UMBRAL_ALINEACION } from './subtitulos-dialogo.js';

export const CANCION = {
  // Mismo modelo que la cama instrumental: es el unico que acepta `duration`.
  // Los validos son V4, V4_5, V4_5PLUS, V4_5ALL, V5, V5_5, V6, V6_MINI, V6_WILD.
  modelo: 'V5_5',
  modelosValidos: ['V4', 'V4_5', 'V4_5PLUS', 'V4_5ALL', 'V5', 'V5_5', 'V6', 'V6_MINI', 'V6_WILD'],
  endpoint: '/api/v1/generate',
  // EXTEND va por la API nueva de kie (jobs), no por /api/v1/generate.
  // Verificado el 2026-09-14: model "ai-music-api/extend", campos en snake_case.
  extender: { endpoint: '/api/v1/jobs/createTask', modelo: 'ai-music-api/extend' },
  // Letra con tiempos POR PALABRA de la propia Suno. No es transcripcion: son
  // los tiempos reales de la generacion, asi que no hay ASR que pueda
  // equivocarse con el nombre de la marca.
  tiempos: '/api/v1/generate/get-timestamped-lyrics',
  creditos: MUSICA.creditos,
  // 10 a 360s, y solo tiene efecto con customMode + V5_5 o V6.
  duracionMin: 10,
  duracionMax: 360,
  // Cuantos caracteres de letra caben comodos en UNA generacion. La API acepta
  // 5.000, pero pasados ~3.500 Suno apura o se salta partes.
  caracteresPorBloque: 3500,
};

const H = () => ({
  Authorization: `Bearer ${requerirClave('KIE_API_KEY', 'https://kie.ai/api-key')}`,
  'Content-Type': 'application/json',
});

/**
 * Pide la cancion cantada. La letra va en `prompt`, el genero en `style`.
 * instrumental: false es lo que la separa de la cama de fondo.
 */
export async function generarCancion({ letra, estilo, titulo, duracion, vocalGender, modelo }) {
  const cuerpo = {
    prompt: letra,
    style: estilo,
    title: titulo,
    customMode: true,
    instrumental: false, // <- cantada. Es toda la diferencia con generar-musica.js
    model: modelo || CANCION.modelo,
    callBackUrl: MUSICA.callbackInerte,
  };
  // Los dos opcionales solo viajan si el usuario los pidio: mandar `duration`
  // en null hace que Suno caiga a su default de 20s en vez de elegir sola.
  if (duracion != null) cuerpo.duration = Math.round(duracion);
  if (vocalGender) cuerpo.vocalGender = vocalGender;

  const res = await fetch(KIE.base + CANCION.endpoint, { method: 'POST', headers: H(), body: JSON.stringify(cuerpo) });

  const texto = await res.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`kie.ai devolvio una respuesta no-JSON al pedir la cancion: ${texto.slice(0, 300)}`);
  }
  if (json.code !== 200 || !json?.data?.taskId) {
    throw new Error(`kie.ai no creo la tarea de la cancion. code=${json.code} msg=${json.msg || '(sin mensaje)'}`);
  }
  return json.data.taskId;
}

/**
 * Continua una cancion ya generada con un bloque nuevo de letra. Devuelve el
 * taskId. El resultado es la cancion ENTERA (lo anterior + lo nuevo), en dos
 * versiones, como siempre.
 */
export async function extenderCancion({ audioId, letra, estilo, titulo, modelo, continueAt, vocalGender }) {
  const cuerpo = {
    model: CANCION.extender.modelo,
    callBackUrl: MUSICA.callbackInerte,
    input: {
      default_param_flag: true,
      audio_id: audioId,
      prompt: letra,
      model: modelo || CANCION.modelo,
      style: estilo,
      title: titulo,
      continue_at: Number(continueAt.toFixed(2)),
      ...(vocalGender ? { vocal_gender: vocalGender } : {}),
    },
  };
  const res = await fetch(KIE.base + CANCION.extender.endpoint, { method: 'POST', headers: H(), body: JSON.stringify(cuerpo) });
  const texto = await res.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`kie.ai devolvio una respuesta no-JSON al pedir el extend: ${texto.slice(0, 300)}`);
  }
  if (json.code !== 200 || !json?.data?.taskId) {
    throw new Error(`kie.ai no creo la tarea de extend. code=${json.code} msg=${json.msg || '(sin mensaje)'}`);
  }
  return json.data.taskId;
}

/**
 * Espera una tarea de extend (API de jobs) y devuelve las pistas con la misma
 * forma que esperarMusica(): [{ audio_url, id, duration, title }].
 */
export async function esperarExtension(taskId, { timeoutMs = 15 * 60 * 1000 } = {}) {
  const inicio = Date.now();
  let espera = 6000;
  let ultimo = null;
  while (true) {
    if (Date.now() - inicio > timeoutMs) throw new Error(`Timeout esperando el extend (tarea ${taskId}).`);
    const datos = await consultarTarea(taskId);
    if (datos.state !== ultimo) {
      ultimo = datos.state;
      process.stdout.write(`${datos.state} `);
    }
    if (datos.state === 'success') {
      let rj;
      try {
        rj = typeof datos.resultJson === 'string' ? JSON.parse(datos.resultJson) : datos.resultJson;
      } catch {
        throw new Error(`No pude leer resultJson del extend ${taskId}`);
      }
      const pistas = rj?.data || rj?.sunoData || [];
      if (pistas.length === 0) throw new Error('El extend termino sin devolver pistas.');
      return pistas;
    }
    if (datos.state === 'fail') {
      throw new Error(`El extend fallo. ${datos.failCode || ''} ${datos.failMsg || ''}`.trim());
    }
    await new Promise((r) => setTimeout(r, espera));
    espera = Math.min(Math.round(espera * 1.3), 15000);
  }
}

/**
 * Trae la letra con tiempos por palabra de UNA pista concreta.
 * Devuelve { alignedWords, hootCer } o null si Suno no la tiene.
 */
export async function tiemposDeLetra(taskId, audioId) {
  const res = await fetch(KIE.base + CANCION.tiempos, { method: 'POST', headers: H(), body: JSON.stringify({ taskId, audioId }) });

  const texto = await res.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`kie.ai devolvio una respuesta no-JSON al pedir los tiempos: ${texto.slice(0, 300)}`);
  }
  if (json.code !== 200 || !json?.data) {
    throw new Error(
      `kie.ai no devolvio los tiempos de la letra. code=${json.code} msg=${json.msg || '(sin mensaje)'}\n` +
        '  Recuerda que para pistas instrumentales no hay letra que devolver.'
    );
  }
  return { alignedWords: json.data.alignedWords || [], hootCer: json.data.hootCer ?? null };
}

const dur = (archivo) =>
  Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', archivo], {
      encoding: 'utf8',
    }).trim()
  );

/** Las palabras cantadas de la letra, sin las marcas [Verso 1] / [Coro]. */
export function palabrasDeLaLetra(letra) {
  return String(letra)
    .replace(/\[[^\]]*\]/g, ' ')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Los tiempos REALES de cada palabra de la letra.
 *
 * POR QUE NO SE USAN LOS DE SUNO, que vienen gratis en la misma respuesta:
 * porque estan mal donde mas duele. Medido el 2026-09-07 sobre el primer
 * anuncio musical, comparando las 97 palabras contra Scribe: 88 coincidian
 * dentro de +-0.3s, pero 9 estaban desplazadas hasta 4.52s.
 *
 * El patron es claro: cuando hay una nota sostenida seguida de un tramo
 * instrumental, Suno APRETUJA las palabras anteriores y ESTIRA la ultima para
 * tapar el hueco. Reporto "solto" durando 8.85s cuando dura 1.1s.
 *
 * Eso hacia dos daños: los subtitulos salian hasta 4.5s ANTES de que se
 * cantara la palabra, y el tramo instrumental quedaba dentro de la ventana de
 * una toma en vez de tener la suya — que en pantalla se ve como una imagen
 * parada varios segundos.
 *
 * Aqui se transcribe con Scribe y se alinean sus palabras contra la LETRA, que
 * es la que manda. Es exactamente el mecanismo de los subtitulos por
 * alineacion que ya usan UGC y talking-object: el texto nunca sale del
 * transcriptor, solo los tiempos.
 */
export async function tiemposDeLetraMedidos(rutaMp3, letra, { log = console.log, idioma = 'spa' } = {}) {
  const correctas = palabrasDeLaLetra(letra);
  if (correctas.length === 0) return { palabras: [], calidad: 0 };

  // Mono 16k: es lo que Scribe necesita y sube mucho mas rapido.
  const tmp = path.join(path.dirname(rutaMp3), '_scribe.mp3');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', rutaMp3, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', tmp]);

  let asr;
  try {
    asr = await transcribir(tmp, idioma);
  } finally {
    fs.rmSync(tmp, { force: true });
  }

  const { pares, calidad } = alinear(correctas, asr.map((w) => w.text));
  const palabras = tiemparPalabras(correctas, asr, pares).map((p) => ({
    texto: p.texto,
    inicio: Number(Number(p.inicio).toFixed(3)),
    fin: Number(Number(p.fin).toFixed(3)),
  }));

  log(`  Alineacion de la letra: ${(calidad * 100).toFixed(0)}% de las palabras emparejadas`);
  if (calidad < UMBRAL_ALINEACION) {
    log(`  AVISO: por debajo del ${UMBRAL_ALINEACION * 100}%. Los tiempos pueden no ser fiables.`);
    log('  Revisa el mapa de abajo contra la cancion antes de escribir el manifiesto.');
  }

  return { palabras, calidad };
}

const soloLetras = (s) => String(s ?? '').toLowerCase().replace(/\[[^\]]*\]/g, '').replace(/[^\p{L}\p{N}]/gu, '');

/** Lee y valida cancion/peticion.json, que escribe la skill musical. */
export function leerPeticion(carpeta) {
  const ruta = path.join(carpeta, 'cancion', 'peticion.json');
  if (!fs.existsSync(ruta)) {
    throw new Error(
      `Falta ${ruta}.\n` +
        '  Lo escribe la skill de anuncios musicales con la letra elegida.\n' +
        '  Campos: letra, estilo (o estilos), titulo, duracion (o null), vocalGender ("m"/"f" o null).\n' +
        '  Opcionales para canciones largas: bloques, modelo, idioma.'
    );
  }
  const p = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  if (p.duracion === undefined) p.duracion = null; // el default es que Suno decida
  const errores = [];
  if (typeof p.letra !== 'string' || !p.letra.trim()) errores.push('"letra" es obligatoria');

  // Estilos: uno (campo "estilo", de siempre) o varios ("estilos"). Con varios,
  // "estilo" pasa a ser opcional y se ignora si tambien viene.
  if (Array.isArray(p.estilos)) {
    p.estilos = p.estilos.filter((e) => typeof e === 'string' && e.trim());
    if (p.estilos.length === 0) errores.push('"estilos" esta vacio');
    if (!p.estilo) p.estilo = p.estilos[0];
  } else {
    if (typeof p.estilo !== 'string' || !p.estilo.trim()) errores.push('"estilo" es obligatorio (el prompt de estilo, en ingles)');
    p.estilos = p.estilo ? [p.estilo] : [];
  }

  if (typeof p.titulo !== 'string' || !p.titulo.trim()) errores.push('"titulo" es obligatorio');
  if (p.duracion != null) {
    if (typeof p.duracion !== 'number' || p.duracion < CANCION.duracionMin || p.duracion > CANCION.duracionMax) {
      errores.push(`"duracion" debe ser null o un numero entre ${CANCION.duracionMin} y ${CANCION.duracionMax}`);
    }
  }
  if (p.vocalGender != null && p.vocalGender !== 'm' && p.vocalGender !== 'f') {
    errores.push('"vocalGender" debe ser "m", "f" o null');
  }
  if (p.modelo != null && !CANCION.modelosValidos.includes(p.modelo)) {
    errores.push(`"modelo" debe ser uno de ${CANCION.modelosValidos.join(', ')}`);
  }
  if (!p.modelo) p.modelo = CANCION.modelo;
  if (!p.idioma) p.idioma = 'spa';

  // Bloques: la letra partida para generar por partes. Si no vienen, la letra
  // entera es el unico bloque.
  if (p.bloques != null) {
    if (!Array.isArray(p.bloques) || p.bloques.some((b) => typeof b !== 'string' || !b.trim())) {
      errores.push('"bloques" debe ser un array de textos no vacios');
    } else if (typeof p.letra === 'string' && soloLetras(p.bloques.join('\n')) !== soloLetras(p.letra)) {
      errores.push('la union de "bloques" no da exactamente la "letra". Los bloques son la letra partida, no otra cosa.');
    } else {
      for (const [i, b] of p.bloques.entries()) {
        if (b.length > 5000) errores.push(`el bloque ${i + 1} tiene ${b.length} caracteres y la API acepta 5.000`);
      }
    }
  } else {
    p.bloques = [p.letra];
    if (typeof p.letra === 'string' && p.letra.length > CANCION.caracteresPorBloque) {
      errores.push(
        `la letra tiene ${p.letra.length} caracteres. Pasados ${CANCION.caracteresPorBloque} Suno apura o se salta partes: ` +
          'partela en "bloques" (el primero se genera, los demas se extienden).'
      );
    }
  }

  if (errores.length) {
    throw new Error(`cancion/peticion.json tiene errores:\n  - ${errores.join('\n  - ')}`);
  }
  return p;
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('generar-cancion.js')) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--elegir');
  const soloPlan = args.includes('--solo-plan');
  const sinConfirmar = args.includes('--si');
  const iElegir = args.indexOf('--elegir');
  const elegida = iElegir !== -1 ? Number(args[iElegir + 1]) : null;

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/generar-cancion.js <carpeta-del-anuncio> [--solo-plan] [--elegir N]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const dirCancion = path.join(carpeta, 'cancion');
  const dirAudio = path.join(carpeta, 'audio');
  const rutaOpciones = path.join(dirCancion, 'opciones.json');
  cargarEnv();

  // Version Google Flow: en los anuncios musicales kie.ai es OBLIGATORIO (la
  // cancion es el anuncio). Sin clave se explica en vez de cortar con un error.
  if (!soloPlan && !(process.env.KIE_API_KEY || '').trim()) {
    console.log('\n  Los anuncios musicales necesitan kie.ai: la cancion se genera con Suno a traves');
    console.log('  de kie.ai (cuesta centavos) y la cancion ES el anuncio, asi que aca no se puede');
    console.log('  seguir sin ella. Todavia no esta conectado (KIE_API_KEY vacia en el .env).');
    console.log('');
    console.log('  Para conectarlo: crear la cuenta en https://kie.ai , cargar saldo, copiar la clave');
    console.log('  de https://kie.ai/api-key y pegarla en el .env (KIE_API_KEY=). Despues, como');
    if (elegida !== null) {
      console.log(`  siempre: volver a correr  npm run cancion -- ${carpetaArg} --elegir ${elegida}\n`);
    } else {
      console.log(`  siempre: el costo con  npm run cancion -- ${carpetaArg} --solo-plan , esperar el si`);
      console.log(`  y generar con  npm run cancion -- ${carpetaArg} --si\n`);
    }
    process.exit(2);
  }

  // ---------------------------------------------------------- elegir

  if (elegida !== null) {
    if (!fs.existsSync(rutaOpciones)) {
      console.error(`\n  Todavia no hay opciones. Corre primero:\n      npm run cancion -- ${carpetaArg}\n`);
      process.exit(1);
    }
    const opciones = JSON.parse(fs.readFileSync(rutaOpciones, 'utf8'));
    const op = opciones.pistas[elegida - 1];
    if (!op) {
      console.error(`\n  No existe la opcion ${elegida}. Hay ${opciones.pistas.length}.\n`);
      process.exit(1);
    }
    const peticion = opciones.peticion;
    const bloques = Array.isArray(peticion.bloques) && peticion.bloques.length ? peticion.bloques : [peticion.letra];
    const idioma = peticion.idioma || 'spa';
    const estiloElegido = op.estilo || peticion.estilo;

    fs.mkdirSync(dirAudio, { recursive: true });
    const destino = path.join(dirAudio, 'cancion.mp3');
    fs.copyFileSync(path.join(dirCancion, op.archivo), destino);

    console.log(`\n=== Cancion elegida — ${path.basename(carpeta)} ===\n`);
    console.log(`  Opcion ${elegida}: ${op.titulo}${op.estilo ? `\n  Estilo:   ${op.estilo}` : ''}`);

    let audioIdActual = op.audioId;
    let taskIdActual = op.taskId || opciones.taskId;
    let palabras = [];
    let calidad = 0;

    // ---- extensiones: los bloques 2..N se agregan sobre la elegida ----
    //
    // Cada extend devuelve dos versiones de la cancion completa. Aqui NO se le
    // pide al usuario que escuche las dos: se mide cual canta mejor la letra
    // (alineacion con Scribe, que es objetiva) y se sigue con esa. Lo de oido
    // ya lo decidio el usuario al elegir la version base: voz, estilo y ritmo
    // se heredan en el extend.
    if (bloques.length > 1) {
      console.log(`\n  La letra va en ${bloques.length} bloques. Esta version trae solo el bloque 1.`);
      console.log(`  Los ${bloques.length - 1} restantes se agregan ahora con EXTEND (${CANCION.creditos} creditos cada uno).\n`);

      for (let k = 1; k < bloques.length; k++) {
        const letraHastaAqui = bloques.slice(0, k).join('\n\n');
        const letraConEste = bloques.slice(0, k + 1).join('\n\n');

        // Donde cortar: justo despues de la ultima palabra cantada del bloque
        // anterior. Verificado: continue_at 0.8s despues de la ultima palabra
        // empalma limpio; cortar muy antes se come letra, muy despues deja
        // instrumental muerto en medio.
        process.stdout.write(`  Bloque ${k + 1}/${bloques.length}: midiendo donde termina la letra anterior... `);
        const medida = await tiemposDeLetraMedidos(destino, letraHastaAqui, { log: () => {}, idioma });
        const duracionActual = dur(destino);
        const ultima = medida.palabras.filter((p) => Number.isFinite(p.fin)).at(-1);
        const continueAt = Math.min(ultima ? ultima.fin + 0.8 : duracionActual - 1, duracionActual - 0.2);
        console.log(`${continueAt.toFixed(2)}s de ${duracionActual.toFixed(2)}s`);

        // Reuso: si esta extension ya se pago para esta misma opcion, no se
        // vuelve a generar.
        const prefijo = `opcion-${elegida}-bloque-${k + 1}`;
        const rutaMeta = path.join(dirCancion, `${prefijo}.json`);
        let pistas;
        if (fs.existsSync(rutaMeta)) {
          pistas = JSON.parse(fs.readFileSync(rutaMeta, 'utf8')).pistas;
          console.log(`  (reusando ${prefijo}, ya generado)`);
        } else {
          process.stdout.write(`  Extendiendo... `);
          const taskId = await extenderCancion({
            audioId: audioIdActual,
            letra: bloques[k],
            estilo: estiloElegido,
            titulo: peticion.titulo,
            modelo: peticion.modelo || CANCION.modelo,
            continueAt,
            vocalGender: peticion.vocalGender,
          });
          const crudas = await esperarExtension(taskId);
          console.log('listo');
          pistas = [];
          for (const [i, p] of crudas.entries()) {
            const archivo = `${prefijo}-v${i + 1}.mp3`;
            await descargar(p.audio_url || p.audioUrl, path.join(dirCancion, archivo));
            pistas.push({ archivo, audioId: p.id, duracion: Number(p.duration) || dur(path.join(dirCancion, archivo)), taskId });
          }
          fs.writeFileSync(rutaMeta, JSON.stringify({ taskId, continueAt, pistas }, null, 2) + '\n', 'utf8');
        }

        // Elegir la version que mejor canta la letra acumulada.
        let mejor = null;
        for (const p of pistas) {
          const m = await tiemposDeLetraMedidos(path.join(dirCancion, p.archivo), letraConEste, { log: () => {}, idioma });
          console.log(`    ${p.archivo}  ${p.duracion.toFixed(1)}s  alineacion ${(m.calidad * 100).toFixed(0)}%`);
          if (!mejor || m.calidad > mejor.calidad) mejor = { ...p, calidad: m.calidad, palabras: m.palabras };
        }
        fs.copyFileSync(path.join(dirCancion, mejor.archivo), destino);
        audioIdActual = mejor.audioId;
        taskIdActual = mejor.taskId;
        palabras = mejor.palabras;
        calidad = mejor.calidad;
        console.log(`    -> sigue con ${mejor.archivo}\n`);
      }
    }

    const duracionReal = dur(destino);
    console.log(`  Duracion real: ${duracionReal.toFixed(2)}s  <- ESTA es la duracion del anuncio`);

    // Los tiempos por palabra de Suno solo existen para tareas de /generate.
    // Para una cancion extendida no hay; se guarda vacio y no se avisa dos veces.
    let alignedWords = [];
    let hootCer = null;
    if (bloques.length === 1) {
      process.stdout.write('\n  Pidiendo la letra con tiempos... ');
      try {
        ({ alignedWords, hootCer } = await tiemposDeLetra(taskIdActual, audioIdActual));
        console.log(`listo (${alignedWords.length} palabras)`);
      } catch (e) {
        console.log(`no disponibles (${e.message.split('\n')[0]})`);
      }
      // hootCer es el indicador de confianza que devuelve Suno. Se guarda y se
      // avisa, no se usa para descartar nada solo.
      if (hootCer !== null) {
        console.log(`  Confianza de la alineacion (hootCer): ${hootCer.toFixed(3)}`);
        if (hootCer > 0.5) {
          console.log('  AVISO: es alta. Revisa los tiempos con atencion antes de generar imagenes.');
        }
      }
    }

    // Los tiempos que MANDAN salen de aqui, no de Suno. Ver el comentario de
    // tiemposDeLetraMedidos(): los de Suno se desplazan hasta 4.5s alrededor de
    // las notas sostenidas.
    if (palabras.length === 0) {
      process.stdout.write('\n  Midiendo los tiempos reales con Scribe... ');
      ({ palabras, calidad } = await tiemposDeLetraMedidos(destino, peticion.letra, {
        log: (m) => console.log('\n' + m),
        idioma,
      }));
    } else {
      console.log(`\n  Tiempos medidos con Scribe sobre la cancion completa: ${(calidad * 100).toFixed(0)}% de la letra emparejada`);
      if (calidad < UMBRAL_ALINEACION) console.log(`  AVISO: por debajo del ${UMBRAL_ALINEACION * 100}%. Revisa el mapa contra la cancion.`);
    }

    // Chequeo cruzado contra Suno: si difieren mucho, conviene saberlo.
    const porTexto = new Map();
    for (const w of alignedWords) {
      const t = String(w.word).replace(/\[[^\]]*\]/g, ' ').trim().toLowerCase();
      if (t && Number.isFinite(w.startS) && !porTexto.has(t)) porTexto.set(t, w.startS);
    }
    let peor = 0;
    let cuantas = 0;
    for (const p of palabras) {
      const s = porTexto.get(p.texto.toLowerCase());
      if (s === undefined) continue;
      const d = Math.abs(p.inicio - s);
      if (d > 1) cuantas++;
      if (d > peor) peor = d;
    }
    if (cuantas > 0) {
      console.log(`  (Suno difiere en ${cuantas} palabra(s), hasta ${peor.toFixed(2)}s. Mandan los de Scribe.)`);
    }

    fs.writeFileSync(
      path.join(dirAudio, 'cancion.json'),
      JSON.stringify(
        {
          generado: new Date().toISOString(),
          taskId: taskIdActual,
          audioId: audioIdActual,
          titulo: op.titulo,
          archivo: 'audio/cancion.mp3',
          duracion: Number(duracionReal.toFixed(3)),
          estilo: estiloElegido,
          modelo: peticion.modelo || CANCION.modelo,
          bloques: bloques.length,
          vocalGender: peticion.vocalGender ?? null,
          letra: peticion.letra,
          hootCer,
          // LO QUE MANDA: la letra con los tiempos medidos sobre el audio.
          palabras,
          calidadAlineacion: calidad,
          // Lo que devolvio Suno, solo como referencia y para el chequeo
          // cruzado. NO se usa para calcular ventanas ni subtitulos.
          alignedWords,
        },
        null,
        2
      ) + '\n',
      'utf8'
    );

    console.log(`\n  Escrito ${path.join(dirAudio, 'cancion.json')}`);
    console.log(`  Escrito ${destino}`);

    // ------------------------------------------------------------------
    // El mapa de la cancion. Es lo que hay que mirar ANTES de escribir el
    // manifiesto: cada hueco sin letra necesita su propia toma instrumental,
    // porque la ventana de una toma llega hasta el inicio de la siguiente. Un
    // hueco de 9s sin toma propia se lo come la toma anterior, y ahi el clip
    // queda mas corto que su ventana — que es un fallo duro del montaje, no
    // un detalle estetico.
    const conTiempo = palabras.filter((w) => w.texto && Number.isFinite(w.inicio) && Number.isFinite(w.fin));

    const HUECO_MINIMO = 1.5; // por debajo de esto no vale la pena una toma aparte
    console.log('\n  --- MAPA DE LA CANCION ---');
    console.log('  Esto es lo que hay que cubrir con tomas. Los huecos tambien.\n');

    if (conTiempo.length === 0) {
      console.log('    No hay ninguna palabra con tiempo.');
    } else {
      const tramos = [];
      let actual = null;
      for (const w of conTiempo) {
        if (actual && w.inicio - actual.fin < HUECO_MINIMO) {
          actual.fin = w.fin;
          actual.palabras.push(w.texto);
        } else {
          if (actual) tramos.push(actual);
          actual = { inicio: w.inicio, fin: w.fin, palabras: [w.texto] };
        }
      }
      if (actual) tramos.push(actual);

      let cursor = 0;
      const marcar = (desde, hasta, etiqueta) => {
        if (hasta - desde < HUECO_MINIMO) return;
        console.log(
          `    ${desde.toFixed(2).padStart(6)}s -> ${hasta.toFixed(2).padStart(6)}s  ${(hasta - desde).toFixed(1).padStart(5)}s  ${etiqueta}`
        );
      };
      for (const t of tramos) {
        marcar(cursor, t.inicio, 'SIN LETRA  <- necesita toma(s) instrumental(es)');
        console.log(
          `    ${t.inicio.toFixed(2).padStart(6)}s -> ${t.fin.toFixed(2).padStart(6)}s  ${(t.fin - t.inicio).toFixed(1).padStart(5)}s  cantado: ${t.palabras.join(' ').slice(0, 46)}`
        );
        cursor = t.fin;
      }
      marcar(cursor, duracionReal, 'SIN LETRA  <- necesita toma(s) instrumental(es)');

      console.log(`\n    ${tramos.length} tramo(s) cantado(s). Un clip no puede pasar de 10s:`);
      console.log('    un hueco de 20s son 2 o 3 tomas instrumentales, no una.');
    }

    console.log('\n  Siguiente paso: el manifiesto se escribe SABIENDO estos tiempos.');
    console.log(`  Cuando exista, corre:  npm run tiempos -- ${carpetaArg}\n`);
    process.exit(0);
  }

  // ---------------------------------------------------------- generar

  if (fs.existsSync(rutaOpciones)) {
    const opciones = JSON.parse(fs.readFileSync(rutaOpciones, 'utf8'));
    console.log(`\n  Ya hay ${opciones.pistas.length} versiones generadas en ${dirCancion}`);
    console.log('  Escuchalas y fija la que quieras:');
    for (const [i, p] of opciones.pistas.entries()) {
      console.log(`      ${i + 1}) ${p.archivo}  ${p.duracion ? p.duracion.toFixed(1) + 's' : ''}  ${p.titulo}${p.estilo ? `  [${p.estilo.slice(0, 50)}...]` : ''}`);
    }
    console.log(`\n      npm run cancion -- ${carpetaArg} --elegir 1`);
    console.log('\n  Si quieres generar otra tanda (se cobra de nuevo), borra cancion/opciones.json\n');
    process.exit(0);
  }

  let peticion;
  try {
    peticion = leerPeticion(carpeta);
  } catch (e) {
    console.error(`\n  ${e.message}\n`);
    process.exit(1);
  }

  const bloques = peticion.bloques;
  const primerBloque = bloques[0];
  const creditosAhora = CANCION.creditos * peticion.estilos.length;

  console.log(`\n=== Cancion del anuncio — ${path.basename(carpeta)} ===\n`);
  console.log(`  Modelo:     Suno ${peticion.modelo} via kie.ai (CANTADA, con letra)`);
  console.log(`  Titulo:     ${peticion.titulo}`);
  if (peticion.estilos.length === 1) {
    console.log(`  Estilo:     ${peticion.estilo}`);
  } else {
    console.log(`  Estilos:    ${peticion.estilos.length} (una generacion por cada uno, 2 versiones cada una)`);
    for (const [i, e] of peticion.estilos.entries()) console.log(`     ${i + 1}) ${e}`);
  }
  console.log(
    `  Duracion:   ${peticion.duracion != null ? peticion.duracion + 's (FIJA — ver aviso)' : 'la que Suno elija (lo correcto)'}`
  );
  console.log(`  Voz:        ${peticion.vocalGender === 'm' ? 'masculina' : peticion.vocalGender === 'f' ? 'femenina' : 'la que Suno elija'}`);
  console.log(`  Costo:      ${creditosAhora} creditos = US$${creditosAUsd(creditosAhora).toFixed(2)}`);
  if (bloques.length > 1) {
    console.log(`  Bloques:    ${bloques.length}. Ahora se genera SOLO el bloque 1 (${primerBloque.length} caracteres).`);
    console.log(`              Los otros ${bloques.length - 1} se agregan con extend al elegir version: ${CANCION.creditos} creditos cada uno.`);
  }
  console.log(`  Salida:     ${dirCancion}/opcion-N.mp3  (Suno devuelve dos por estilo)\n`);
  console.log('  La duracion de la cancion ES la duracion del anuncio: no se acelera');
  console.log('  ni se corta. El video se adapta a ella.\n');

  // Medido con dinero el 2026-09-07: `duration` NO comprime la letra, la TRUNCA.
  // Se pidieron 60s con una letra de cinco bloques y las dos versiones se
  // cortaron al terminar el Verso 2, sin llegar nunca al puente — que es donde
  // vive el CTA. La misma letra sin tiempo fijo salio en 1:48, entera.
  if (peticion.duracion != null) {
    console.log('  ---------------------------------------------------------------');
    console.log(`  AVISO: pediste ${peticion.duracion}s FIJOS y eso casi seguro va a CORTAR la letra.`);
    console.log('');
    console.log('  `duration` no comprime la cancion: la trunca, y trunca por el FINAL.');
    console.log('  Lo que se pierde es el ultimo bloque, que suele ser el CTA.');
    console.log('');
    console.log('  Para un anuncio mas corto se acorta la LETRA, nunca el parametro.');
    console.log('  Si igual lo quieres asi, escucha las dos versiones hasta el final');
    console.log('  antes de elegir. Para el camino correcto: "duracion": null');
    console.log('  ---------------------------------------------------------------\n');
  }

  const lineas = primerBloque.split('\n').filter((l) => l.trim());
  console.log(`  Letra${bloques.length > 1 ? ' (bloque 1)' : ''}: ${lineas.length} lineas\n`);
  for (const l of lineas.slice(0, 6)) console.log(`    ${l}`);
  if (lineas.length > 6) console.log(`    ... y ${lineas.length - 6} mas`);
  console.log('');

  if (soloPlan) {
    console.log('  --solo-plan: no se genero nada y no se cobro nada.\n');
    process.exit(0);
  }

  if (!sinConfirmar) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    const r = (await rl.question('  Genero la cancion? [s/N]: ')).trim().toLowerCase();
    rl.close();
    if (r !== 's' && r !== 'si') {
      console.log('\n  Cancelado. No se cobro nada.\n');
      process.exit(0);
    }
  }

  try {
    const saldo = await consultarCreditos();
    if (saldo !== null && saldo < creditosAhora) {
      console.error(`\n  Saldo insuficiente: tienes ${saldo} creditos y hacen falta ${creditosAhora}.\n`);
      process.exit(1);
    }

    process.stdout.write('  Generando... ');
    // Una tarea por estilo, todas a la vez.
    const tareas = await Promise.all(
      peticion.estilos.map(async (estilo) => {
        const taskId = await generarCancion({ ...peticion, letra: primerBloque, estilo });
        const pistas = await esperarMusica(taskId);
        return { estilo, taskId, pistas };
      })
    );
    console.log('listo');

    fs.mkdirSync(dirCancion, { recursive: true });
    const guardadas = [];
    for (const t of tareas) {
      for (const p of t.pistas) {
        const n = guardadas.length + 1;
        const archivo = `opcion-${n}.mp3`;
        await descargar(p.audio_url, path.join(dirCancion, archivo));
        guardadas.push({
          archivo,
          audioId: p.id,
          taskId: t.taskId,
          estilo: t.estilo,
          titulo: p.title || peticion.titulo,
          duracion: Number(dur(path.join(dirCancion, archivo)).toFixed(3)),
        });
      }
    }

    fs.writeFileSync(
      rutaOpciones,
      JSON.stringify(
        {
          generado: new Date().toISOString(),
          taskId: tareas[0].taskId,
          tareas: tareas.map((t) => ({ estilo: t.estilo, taskId: t.taskId })),
          peticion,
          pistas: guardadas,
        },
        null,
        2
      ) + '\n',
      'utf8'
    );

    console.log(`\n  Suno devolvio ${guardadas.length} version(es):\n`);
    for (const [i, g] of guardadas.entries()) {
      console.log(`    ${i + 1}) ${g.archivo}   ${g.duracion.toFixed(1)}s   "${g.titulo}"${peticion.estilos.length > 1 ? `   estilo: ${g.estilo.slice(0, 60)}...` : ''}`);
    }
    console.log('\n  Escuchalas y elige. NO se elige sola: la eleccion es de oido.');
    if (bloques.length > 1) {
      console.log(`  (Son solo el bloque 1 de ${bloques.length}: voz, estilo y ritmo. El resto se agrega al elegir.)`);
    }
    console.log(`\n      npm run cancion -- ${carpetaArg} --elegir 1`);
    console.log(`      npm run cancion -- ${carpetaArg} --elegir 2\n`);
  } catch (e) {
    console.error(`\n  ${e.message}\n`);
    process.exit(1);
  }
}
