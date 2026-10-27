// FASE 2.4 — genera la voz en off con ElevenLabs y saca los tiempos exactos.
//
//   node produccion/generar-audio.js temp/mi-anuncio
//   node produccion/generar-audio.js temp/mi-anuncio --rehacer
//
// Ademas del mp3, deja un mapa de tiempos: donde empieza y termina cada linea
// del guion dentro del audio. De ahi salen los cortes de cada toma y los
// subtitulos, sin estimar nada a ojo.
//
// La voz NO se pregunta si ya esta en el .env. Si falta, se lista y se elige
// aca mismo: el usuario no tiene por que saber que existe "npm run voces".
//
// En los estilos con nivel de voz fijo (hoy estilo-lego) la voz se deja ademas
// al nivel del anuncio aprobado (nivelar-voz.js). Los demas estilos no pasan
// por ahi: su voz queda tal como la entrega ElevenLabs.

import fs from 'node:fs';
import path from 'node:path';
import { cargarEnv, requerirClave } from './config.js';
import { seleccionarVoz, ajustesFinales, ELEVENLABS } from './elevenlabs-client.js';
import { validarManifiesto } from './validar-manifiesto.js';
import { nivelarVoz, nivelDeVoz, lineaDeNivel } from './nivelar-voz.js';

const MODELO_TTS = 'eleven_multilingual_v2';
const FORMATO = 'mp3_44100_128';

/**
 * Convierte los tiempos por caracter que devuelve ElevenLabs en un mapa por
 * linea del guion. Va consumiendo el texto en orden, saltando los espacios y
 * la puntuacion que no coincida, para tolerar diferencias menores.
 */
export function tiemposPorLinea(alignment, lineas) {
  const chars = alignment.characters || [];
  const inicios = alignment.character_start_times_seconds || [];
  const fines = alignment.character_end_times_seconds || [];

  const soloLetras = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const resultado = [];
  let cursor = 0;

  for (const linea of lineas) {
    const objetivo = soloLetras(linea.texto);
    if (!objetivo) {
      resultado.push({ ...linea, inicio: null, fin: null, encontrada: false });
      continue;
    }

    let acumulado = '';
    let primerIdx = null;
    let ultimoIdx = null;

    for (let i = cursor; i < chars.length; i++) {
      const c = soloLetras(chars[i]);
      if (!c) continue;
      if (primerIdx === null) primerIdx = i;
      acumulado += c;
      ultimoIdx = i;
      if (acumulado.length >= objetivo.length) break;
    }

    const encontrada = primerIdx !== null && acumulado.startsWith(objetivo.slice(0, Math.min(20, objetivo.length)));
    resultado.push({
      ...linea,
      inicio: primerIdx !== null ? Number(inicios[primerIdx].toFixed(3)) : null,
      fin: ultimoIdx !== null ? Number(fines[ultimoIdx].toFixed(3)) : null,
      encontrada,
    });

    cursor = ultimoIdx !== null ? ultimoIdx + 1 : cursor;
  }

  return resultado;
}

/** Llama al endpoint de TTS con timestamps. */
export async function generarVozConTiempos({ voiceId, texto, ajustes, modelo = MODELO_TTS }) {
  const url = `${ELEVENLABS.base}/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=${FORMATO}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': requerirClave('ELEVENLABS_API_KEY', 'https://elevenlabs.io > perfil > API Keys'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: texto, model_id: modelo, voice_settings: ajustes }),
  });

  const cuerpo = await res.text();
  if (res.status === 401) throw new Error('ElevenLabs rechazo la clave (401). Revisa ELEVENLABS_API_KEY en el .env.');
  if (res.status === 422) throw new Error(`ElevenLabs rechazo la peticion (422): ${cuerpo.slice(0, 400)}`);
  if (!res.ok) throw new Error(`ElevenLabs devolvio HTTP ${res.status}: ${cuerpo.slice(0, 400)}`);

  let json;
  try {
    json = JSON.parse(cuerpo);
  } catch {
    throw new Error(`ElevenLabs devolvio una respuesta no-JSON: ${cuerpo.slice(0, 300)}`);
  }
  if (!json.audio_base64) throw new Error('ElevenLabs no devolvio audio.');

  return {
    audio: Buffer.from(json.audio_base64, 'base64'),
    alignment: json.alignment || null,
    normalizado: json.normalized_alignment || null,
  };
}

/**
 * Solo si el estilo tiene nivel de voz fijo: deja voz.mp3 al nivel del anuncio
 * aprobado e imprime el resultado. Con cualquier otro estilo no hace ni imprime
 * nada. Devuelve false si fallo: la voz y los tiempos ya estan guardados, y
 * voz.mp3 queda como estaba. alignment undefined: se lee de tiempos.json.
 */
function nivelarSiToca(carpeta, carpetaArg, estilo, alignment) {
  if (!nivelDeVoz(estilo)) return true;
  try {
    const r = nivelarVoz(carpeta, { estilo, alignment });
    console.log(`  Nivel:      ${lineaDeNivel(r)}`);
    for (const a of r.avisos) console.log(`              ojo: ${a}`);
    console.log('');
    return true;
  } catch (e) {
    console.log(`  Nivel:      NO SE NIVELO. ${e.message}`);
    console.log(`              Reintenta sin regenerar la voz: npm run voz:nivelar -- ${carpetaArg}\n`);
    return false;
  }
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('generar-audio.js')) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  const rehacer = args.includes('--rehacer');

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/generar-audio.js <carpeta-del-anuncio> [--rehacer]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const rutaManifiesto = path.join(carpeta, 'manifiesto.json');
  if (!fs.existsSync(rutaManifiesto)) {
    console.error(`\n  No encuentro el manifiesto: ${rutaManifiesto}\n`);
    process.exit(1);
  }

  cargarEnv();
  const manifiesto = JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8'));

  const { errores } = validarManifiesto(manifiesto, { carpeta });
  if (errores.length) {
    console.error('\n  El manifiesto tiene errores:\n');
    for (const e of errores) console.error(`  ERROR  ${e}`);
    console.error('');
    process.exit(1);
  }

  if (manifiesto.modo_audio !== 'voz_en_off') {
    console.error(`\n  Este anuncio esta en modo_audio "${manifiesto.modo_audio}".`);
    console.error('  Este script es solo para "voz_en_off". Los otros modos sacan el audio del propio clip\n  o de la cancion (ver COMO-PRODUCIR.md, seccion 2).\n');
    if (manifiesto.modo_audio === 'musica') {
      console.error('  En musica la pista maestra es la cancion, y ya deberia existir antes del manifiesto:');
      console.error(`      npm run cancion  -- ${carpetaArg}            genera las dos versiones`);
      console.error(`      npm run cancion  -- ${carpetaArg} --elegir 1  fija la elegida`);
      console.error(`      npm run tiempos  -- ${carpetaArg}            escribe audio/tiempos.json\n`);
    }
    process.exit(1);
  }

  const dirAudio = path.join(carpeta, 'audio');
  const rutaMp3 = path.join(dirAudio, 'voz.mp3');
  const rutaTiempos = path.join(dirAudio, 'tiempos.json');

  if (fs.existsSync(rutaMp3) && !rehacer) {
    console.log(`\n  Ya existe ${rutaMp3}`);
    console.log('  Si quieres regenerarlo (se cobra de nuevo): agrega --rehacer\n');
    // Una voz que quedo sin nivelar (anuncio viejo o control fallido) se nivela
    // aca, con su tiempos.json. Si ya esta nivelada no se toca.
    if (!nivelarSiToca(carpeta, carpetaArg, manifiesto.estilo, undefined)) process.exit(1);
    process.exit(0);
  }

  console.log(`\n=== Voz en off — ${path.basename(carpeta)} ===`);

  // Aca vive el arreglo: si falta la voz, se elige ahora y se guarda.
  let voz, guardado;
  try {
    ({ voz, guardado } = await seleccionarVoz());
  } catch (e) {
    console.error(`\n  ${e.message}\n`);
    process.exit(1);
  }

  const { ajustes, origen, pisados } = await ajustesFinales(voz.id, manifiesto.voz?.ajustes || null);

  const texto = manifiesto.voz_en_off.trim();
  const palabras = texto.split(/\s+/).length;

  console.log(`\n  Voz:        ${voz.nombre}  (${voz.id})${voz.clonada ? '  [CLONADA]' : ''}`);
  if (!guardado) console.log('              tomada del .env, sin preguntar');
  console.log(`  Modelo:     ${MODELO_TTS}`);
  // Los ajustes se muestran desglosados, no como un JSON de una linea: vienen de
  // la cuenta de ElevenLabs y el pipeline NO los pisa, asi que este es el unico
  // sitio donde se ve con que va a salir la voz.
  const dato = (campo) => (ajustes[campo] === undefined ? 'por defecto de ElevenLabs' : ajustes[campo]);
  console.log(`  Ajustes:    velocidad ${dato('speed')}  ·  stability ${dato('stability')}  ·  style ${dato('style')}`);
  console.log(`              similarity ${dato('similarity_boost')}  ·  speaker_boost ${dato('use_speaker_boost')}`);
  console.log(`              ${origen}${pisados.length ? ` (el manifiesto piso: ${pisados.join(', ')})` : ''}`);
  if (ajustes.speed !== undefined && ajustes.speed !== 1) {
    console.log(`              ojo: velocidad ${ajustes.speed} — la voz no va a ritmo natural, es asi como la tienes guardada`);
  }
  console.log(`  Guion:      ${palabras} palabras, ${texto.length} caracteres`);
  console.log(`  Costo:      se descuenta de tu cuota de caracteres de ElevenLabs\n`);

  try {
    process.stdout.write('  Generando la voz... ');
    const { audio, alignment, normalizado } = await generarVozConTiempos({
      voiceId: voz.id,
      texto,
      ajustes,
    });
    console.log('listo');

    fs.mkdirSync(dirAudio, { recursive: true });
    fs.writeFileSync(rutaMp3, audio);

    const usable = alignment || normalizado;
    if (!usable) {
      console.log('\n  ATENCION: ElevenLabs no devolvio timestamps. El montaje tendra que estimar los cortes.\n');
      // Sin alineamiento se nivela midiendo con compuerta: el tiempos.json que
      // haya en la carpeta es de una voz anterior y no sirve para esta.
      if (!nivelarSiToca(carpeta, carpetaArg, manifiesto.estilo, null)) process.exit(1);
      process.exit(0);
    }

    // Una "linea" por toma, en orden, mas los B-roll asociados a cada una.
    const lineas = manifiesto.tomas.map((t) => ({ toma: t.n, tipo: t.tipo, texto: t.linea, duracionPrevista: t.duracion }));
    const conTiempos = tiemposPorLinea(usable, lineas);

    const duracionTotal = usable.character_end_times_seconds.at(-1);

    fs.writeFileSync(
      rutaTiempos,
      JSON.stringify(
        {
          generado: new Date().toISOString(),
          voz: { id: voz.id, nombre: voz.nombre, clonada: voz.clonada },
          modelo: MODELO_TTS,
          ajustes,
          duracion: Number(duracionTotal.toFixed(3)),
          lineas: conTiempos,
          // El alineamiento crudo queda guardado: de aca salen los subtitulos
          // palabra por palabra en la Fase 2.6.
          alignment: usable,
        },
        null,
        2
      ) + '\n',
      'utf8'
    );

    const sinEncontrar = conTiempos.filter((l) => !l.encontrada);

    console.log(`\n  Audio:      ${rutaMp3}`);
    console.log(`  Duracion:   ${duracionTotal.toFixed(1)}s`);
    console.log(`  Tiempos:    ${rutaTiempos}\n`);
    // Despues de escribir tiempos.json, y con el mismo alineamiento.
    if (!nivelarSiToca(carpeta, carpetaArg, manifiesto.estilo, usable)) process.exitCode = 1;

    console.log('  toma   inicio     fin    dura   prevista');
    for (const l of conTiempos) {
      const dura = l.inicio !== null && l.fin !== null ? (l.fin - l.inicio).toFixed(1) : '  ?';
      const marca = !l.encontrada ? '  <- no la ubique bien' : '';
      console.log(
        `   ${String(l.toma).padStart(3)}  ${String(l.inicio ?? '?').padStart(7)}s ${String(l.fin ?? '?').padStart(7)}s  ${String(dura).padStart(5)}s   ${String(l.duracionPrevista).padStart(5)}s${marca}`
      );
    }

    const previstaTotal = manifiesto.tomas.reduce((s, t) => s + t.duracion, 0);
    console.log(`\n  Real ${duracionTotal.toFixed(1)}s contra ${previstaTotal.toFixed(1)}s estimados por la skill (palabras / 2.4).`);
    console.log('  Manda el audio: el video se ajusta a estos tiempos, no al reves.');

    if (sinEncontrar.length) {
      console.log(`\n  ATENCION: ${sinEncontrar.length} linea(s) no se ubicaron con seguridad en el audio.`);
      console.log('  Suele pasar si el texto de "voz_en_off" no coincide con las lineas de las tomas.');
      for (const l of sinEncontrar) console.log(`      toma ${l.toma}: "${l.texto.slice(0, 60)}..."`);
    }
    console.log('');
  } catch (e) {
    console.error(`\n  ERROR: ${e.message}\n`);
    process.exitCode = 1;
  }
}
