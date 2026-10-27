// Pista de musica de fondo. PASO OPCIONAL: si no hay musica, el anuncio se
// arma igual.
//
//   node produccion/generar-musica.js temp/mi-anuncio            genera con IA
//   node produccion/generar-musica.js temp/mi-anuncio --solo-plan
//   node produccion/generar-musica.js temp/mi-anuncio --estilo "lo-fi acustico"
//   node produccion/generar-musica.js temp/mi-anuncio --suno     (estilos con pista fija)
//
// Si el usuario prefiere su propia pista, la deja en musica/ dentro de la
// carpeta del anuncio y este script no hace falta.
//
// Los estilos de PISTA_FIJA_POR_ESTILO (hoy solo estilo-lego) no llaman a Suno:
// se copia su pista de recursos/musica/ a musica/fondo.mp3, sin costo. Con
// --suno se genera con IA como en cualquier otro estilo.
//
// Modelo: Suno V5_5 via kie.ai. Es el unico que permite fijar la duracion
// exacta (customMode + V5_5, de 10 a 360s), asi la pista calza con el anuncio
// y no hay que recortarla ni repetirla en loop.
// Docs: https://docs.kie.ai/suno-api/generate-music

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { KIE, RAIZ, ESTILOS_SIN_MUSICA, creditosAUsd, cargarEnv, requerirClave } from './config.js';
import { descargar, consultarCreditos } from './kie-client.js';
import { pistaFijaDe, pistasEn, esPistaFija, elegirPista, copiarPistaFija } from './pista-fija.js';

export const MUSICA = {
  modelo: 'V5_5', // el unico con control de duracion
  endpoint: '/api/v1/generate',
  // OJO: Suno NO usa /api/v1/jobs/recordInfo como el resto de los modelos.
  // Tiene su propio endpoint y sus propios estados.
  consulta: '/api/v1/generate/record-info',
  // La API exige callBackUrl aunque uno vaya a hacer polling. Se manda una
  // direccion inerte: example.com esta reservado por IANA justo para esto.
  callbackInerte: 'https://example.com/callback',
  creditos: 12, // https://kie.ai/pricing -> Suno, Generate Music
  extensiones: ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
};

const ESTADOS_FALLO = ['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'CALLBACK_EXCEPTION', 'SENSITIVE_WORD_ERROR'];

/** Polling propio de Suno. Devuelve las pistas generadas. */
export async function esperarMusica(taskId, { timeoutMs = 10 * 60 * 1000 } = {}) {
  const inicio = Date.now();
  let espera = 4000;
  let ultimo = null;

  while (true) {
    if (Date.now() - inicio > timeoutMs) throw new Error(`Timeout esperando la musica (tarea ${taskId}).`);

    const res = await fetch(`${KIE.base}${MUSICA.consulta}?taskId=${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${requerirClave('KIE_API_KEY', 'https://kie.ai/api-key')}` },
    });
    const json = await res.json();
    const datos = json?.data;
    if (!datos) throw new Error(`kie.ai no devolvio datos de la tarea de musica: ${JSON.stringify(json).slice(0, 200)}`);

    if (datos.status !== ultimo) {
      ultimo = datos.status;
      process.stdout.write(`${datos.status} `);
    }

    if (datos.status === 'SUCCESS') {
      const pistas = datos.response?.sunoData || [];
      if (pistas.length === 0) throw new Error('Suno termino sin devolver pistas.');
      return pistas;
    }
    if (ESTADOS_FALLO.includes(datos.status)) {
      throw new Error(`Suno fallo con estado ${datos.status}. ${datos.errorMessage || ''}`.trim());
    }

    await new Promise((r) => setTimeout(r, espera));
    espera = Math.min(Math.round(espera * 1.3), 15000);
  }
}

/** Busca una pista puesta a mano por el usuario en musica/ */
export function musicaPropia(carpeta) {
  return pistasEn(carpeta)[0] || null;
}

/**
 * Traduce el anuncio a una descripcion de estilo musical.
 * No inventa generos raros: busca una cama sonora que no compita con la voz.
 */
export function estiloSugerido(manifiesto) {
  const partes = ['instrumental background bed for a short ad', 'no vocals', 'no lyrics'];

  // dialogo_nativo sale por su propia rama y NO pasa por el resto.
  //
  // La condicion es el MODO, no el estilo. Antes decia `estilo === 'ugc'`, que
  // funciono mientras UGC era el unico estilo de diálogo nativo: en cuanto entro
  // el segundo (talking-object-pixar) cayo a la rama generica y le pidio a Suno
  // una cama que "leaves room for a voiceover on top", en un estilo cuya regla
  // fundamental es que nunca hay voz en off. El modo es lo que describe como
  // suena el anuncio; el estilo es como se ve.
  //
  // Dos razones, y ninguna es de gusto musical:
  //
  // 1. El criterio del sistema para elegir musica es uno solo: que acompanie lo
  //    que se esta diciendo. Si el copy no es dramatico, la musica no es
  //    dramatica. No es una lista de generos. Por eso aca NO se agrega el
  //    empujon por mercado ("latin pop-folk" y companiia): la musica la manda
  //    el tono del guion, no el pais.
  //
  // 2. En dialogo_nativo el dialogo vive dentro del clip y NO viene
  //    normalizado: medido, llega a -25.8 y -24.0 dBFS de media, contra los
  //    -16/-18 de una voz en off normalizada. Ya esta bajo. Una musica que le
  //    pelee lo tapa, por eso el prompt insiste en que es solo fondo.
  //
  // Tampoco lleva el "builds slightly toward the end" del final: contradice
  // el "no dramatic build".
  if (manifiesto.modo_audio === 'dialogo_nativo') {
    partes.push(
      'minimal understated bed',
      'must match the emotional tone of what is being said, nothing more',
      'must not sound like a produced ad',
      'no dramatic build',
      'must never compete with the speaker — background only',
      'under the speaker' + "'" + 's dialogue inside the clip'
    );
    return partes.join(', ');
  }

  if (manifiesto.estilo === 'crochet') {
    partes.push('warm handmade feel', 'soft ukulele or plucked strings', 'light claps', 'cozy and tactile');
  }
  if (manifiesto.mercado === 'LatAm') partes.push('friendly latin pop-folk touch');
  if (manifiesto.mercado === 'EEUU') partes.push('upbeat modern pop feel');
  if (manifiesto.mercado === 'Brasil') partes.push('light bossa touch');

  partes.push('steady gentle rhythm', 'leaves room for a voiceover on top', 'builds slightly toward the end');
  return partes.join(', ');
}

export async function generarMusica({ prompt, estilo, duracion, titulo }) {
  const res = await fetch(KIE.base + MUSICA.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requerirClave('KIE_API_KEY', 'https://kie.ai/api-key')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      style: estilo,
      title: titulo,
      customMode: true,
      instrumental: true, // sin voces: la narracion es la unica voz del anuncio
      model: MUSICA.modelo,
      callBackUrl: MUSICA.callbackInerte,
      duration: Math.round(duracion),
    }),
  });

  const texto = await res.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`kie.ai devolvio una respuesta no-JSON al pedir musica: ${texto.slice(0, 300)}`);
  }
  if (json.code !== 200 || !json?.data?.taskId) {
    throw new Error(`kie.ai no creo la tarea de musica. code=${json.code} msg=${json.msg || '(sin mensaje)'}`);
  }
  return json.data.taskId;
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('generar-musica.js')) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--estilo'));
  const sinConfirmar = args.includes('--si');
  const soloPlan = args.includes('--solo-plan');
  // Solo cambia algo en los estilos con pista fija: pide Suno en vez de copiarla.
  const conSuno = args.includes('--suno');
  const iE = args.indexOf('--estilo');
  const estiloManual = iE !== -1 ? args[iE + 1] : null;

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/generar-musica.js <carpeta-del-anuncio> [--estilo "..."] [--solo-plan] [--suno]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  cargarEnv();

  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));

  // Estilos SIN musica por decision del estilo (podcast, entrevista; tomada
  // el 2026-10-13): solo se oyen las voces de los clips. Ni Suno, ni
  // pista fija, ni cobro. El plan y el render ya salen sin pista de fondo.
  if (ESTILOS_SIN_MUSICA.includes(manifiesto.estilo)) {
    console.log(`\n=== Musica de fondo — ${path.basename(carpeta)} ===\n`);
    console.log(`  Este estilo ("${manifiesto.estilo}") no lleva musica: solo las voces de los clips.`);
    console.log('  No se genera nada ni se cobra nada. Sigue con:  npm run plan -- ' + carpetaArg + '\n');
    process.exit(0);
  }

  // Un anuncio musical NO lleva cama de fondo: la cancion ya es el audio del
  // anuncio y una pista instrumental por debajo la ensucia. Esto no es una
  // preferencia: es la diferencia entre los dos usos de Suno en el proyecto.
  if (manifiesto.modo_audio === 'musica') {
    console.error(`\n  Este anuncio esta en modo_audio "musica": la cancion ES el audio.`);
    console.error('  No lleva musica de fondo debajo. Este script genera la cama INSTRUMENTAL');
    console.error('  de los otros modos; la cancion cantada la hace generar-cancion.js.\n');
    console.error(`      npm run cancion -- ${carpetaArg}\n`);
    process.exit(1);
  }

  const rutaTiempos = path.join(carpeta, 'audio', 'tiempos.json');
  const duracion = fs.existsSync(rutaTiempos)
    ? JSON.parse(fs.readFileSync(rutaTiempos, 'utf8')).duracion
    : manifiesto.tomas.reduce((s, t) => s + t.duracion, 0);

  console.log(`\n=== Musica de fondo — ${path.basename(carpeta)} ===\n`);

  const propia = musicaPropia(carpeta);
  // La pista fija que copio el motor NO es "una pista tuya": si musica/ trae
  // solo esa, se dice lo que es. Si el usuario dejo la suya al lado, gana la
  // suya, con la misma regla que usa el plan (elegirPista).
  const pistas = pistasEn(carpeta);
  if (propia && pistas.every((p) => esPistaFija(p, manifiesto.estilo))) {
    console.log(`  Ya esta la pista fija del estilo "${manifiesto.estilo}": ${propia}`);
    console.log(`  La copio el motor de recursos/musica/${pistaFijaDe(manifiesto.estilo)}: sin Suno y sin costo.`);
    console.log('  Si quieres otra, deja la tuya en musica/. Para generar con IA, saca fondo.mp3');
    console.log(`  de musica/ y corre:  npm run musica -- ${carpetaArg} --suno\n`);
    process.exit(0);
  }
  if (propia) {
    // Se nombra la que va a sonar en el plan, no la fija que haya quedado al
    // lado. En los estilos sin pista fija se nombra la primera, como antes.
    const elegida = pistaFijaDe(manifiesto.estilo) ? elegirPista(carpeta, manifiesto.estilo) : null;
    const tuya = elegida ? path.join(carpeta, 'musica', elegida) : propia;
    console.log(`  Ya hay una pista tuya: ${tuya}`);
    console.log('  Se usa esa y no se genera nada. Si quieres generar con IA, sacala de musica/.\n');
    process.exit(0);
  }

  // Estilo con pista fija y sin --suno: se copia y listo. No hay red ni cobro.
  if (pistaFijaDe(manifiesto.estilo) && !conSuno) {
    const archivo = pistaFijaDe(manifiesto.estilo);
    console.log(`  El estilo "${manifiesto.estilo}" usa su pista fija: recursos/musica/${archivo}`);
    if (soloPlan) {
      console.log(`  Se copiaria a ${path.join(carpeta, 'musica', 'fondo.mp3')}`);
      console.log('  --solo-plan: no se copio nada y no se cobro nada.\n');
      process.exit(0);
    }
    const copia = copiarPistaFija(carpeta, manifiesto.estilo);
    if (copia?.falta) {
      console.error(`\n  Falta la pista fija del estilo: ${copia.falta}`);
      console.error('  Vuelve a ponerla ahi (recursos/musica/LEEME.md dice como se prepara) o usa --suno.\n');
      process.exit(1);
    }
    console.log(`  Copiada a ${copia.destino}`);
    console.log('  Sin Suno y sin costo. El nivel en la mezcla lo calcula el plan midiendo la pista.');
    console.log(`  Si prefieres una pista de Suno:  npm run musica -- ${carpetaArg} --suno  (saca antes fondo.mp3)\n`);
    process.exit(0);
  }

  // Version Google Flow: kie.ai es RECOMENDADO, no obligatorio. Solo se usa
  // para la musica (Suno). Sin clave no se corta con un error tecnico: se
  // explica y el usuario decide. El plan arma el anuncio igual, sin pista.
  const kieConectado = Boolean((process.env.KIE_API_KEY || '').trim());

  // zack-d-films y skeleton tienen pista fija, pero se copia a mano (no estan
  // en PISTA_FIJA_POR_ESTILO). Sin clave, lo que corresponde es copiarla, no
  // ofrecer Suno.
  const PISTA_A_MANO = { 'zack-d-films': 'zack-d-films.mp3', skeleton: 'esqueleto.mp3' };
  const aMano = PISTA_A_MANO[manifiesto.estilo];
  if (!kieConectado && aMano && fs.existsSync(path.join(RAIZ, 'recursos', 'musica', aMano))) {
    console.log(`  Este estilo ("${manifiesto.estilo}") usa su pista fija: recursos/musica/${aMano}`);
    console.log('  No hace falta kie.ai. Copiala (sin costo) y sigue con las transiciones y el plan:');
    console.log(`     recursos/musica/${aMano}  ->  ${carpetaArg}/musica/fondo.mp3\n`);
    process.exit(soloPlan ? 0 : 2);
  }

  if (!soloPlan && !kieConectado) {
    console.log(`  Este estilo ("${manifiesto.estilo}") lleva musica de fondo generada con Suno,`);
    console.log('  a traves de kie.ai (cuesta centavos por anuncio). En esta version kie.ai se');
    console.log('  usa SOLO para la musica, y todavia no esta conectado (KIE_API_KEY vacia en el .env).');
    console.log('');
    console.log('  Preguntale al usuario si quiere conectarlo ahora:');
    console.log('   - SI: crear la cuenta en https://kie.ai , cargar saldo, copiar la clave de');
    console.log('     https://kie.ai/api-key y pegarla en el .env (KIE_API_KEY=). Despues, como');
    console.log('     siempre: mostrar el costo con  npm run musica -- '+carpetaArg+' --solo-plan ,');
    console.log('     esperar el si y generar con  npm run musica -- '+carpetaArg+' --si');
    console.log('   - NO: el anuncio se arma igual, sin musica de fondo. Seguir con las');
    console.log('     transiciones (COMO-PRODUCIR.md, seccion 4: no se saltan) y despues:');
    console.log(`     npm run plan -- ${carpetaArg}\n`);
    process.exit(2);
  }

  const dirMusica = path.join(carpeta, 'musica');
  const estilo = estiloManual || estiloSugerido(manifiesto);
  // El texto cambia segun donde vive la voz. En dialogo_nativo no hay pista de
  // narracion: la voz esta dentro del clip, sin normalizar y ya baja.
  const prompt =
    manifiesto.modo_audio === 'dialogo_nativo'
      ? `Instrumental background music for a ${duracion.toFixed(0)} second ad. ` +
        `Understated, it must sit under the speaker` + "'" + `s dialogue inside the clip without competing with it. ` +
        `Keep the energy low and steady all the way through.`
      : `Instrumental background music for a ${duracion.toFixed(0)} second ad. ` +
        `Understated, it must sit under a spoken voiceover without competing with it. ` +
        `Keep the energy low and steady through the first half and lift gently toward the end.`;

  console.log(`  Modelo:     Suno ${MUSICA.modelo} via kie.ai (instrumental, sin voces)`);
  console.log(`  Duracion:   ${duracion.toFixed(1)}s (la del anuncio, exacta)`);
  console.log(`  Estilo:     ${estilo}`);
  console.log(`  Costo:      ${MUSICA.creditos} creditos = US$${creditosAUsd(MUSICA.creditos).toFixed(2)}`);
  console.log(`  Salida:     ${path.join(dirMusica, 'fondo.mp3')}\n`);
  console.log('  Una sola pista para todo el anuncio. La variacion emocional se hace');
  console.log('  con volumen en el montaje, no cambiando de cancion.\n');

  if (soloPlan) {
    // Asi nadie tiene que abrir el .env (que tiene claves) para saber si se puede.
    console.log(`  kie.ai:     ${kieConectado ? 'conectado (KIE_API_KEY cargada)' : 'NO conectado (KIE_API_KEY vacia): al correrlo sin --solo-plan se explica y se pregunta'}`);
    console.log('  --solo-plan: no se genero nada y no se cobro nada.\n');
    process.exit(0);
  }

  if (!sinConfirmar) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    const r = (await rl.question('  Genero la pista? [s/N]: ')).trim().toLowerCase();
    rl.close();
    if (r !== 's' && r !== 'si') {
      console.log('\n  Cancelado. El anuncio se puede armar igual, sin musica.\n');
      process.exit(0);
    }
  }

  try {
    const saldo = await consultarCreditos();
    if (saldo !== null && saldo < MUSICA.creditos) {
      console.error(`\n  Saldo insuficiente: tienes ${saldo} creditos y hacen falta ${MUSICA.creditos}.\n`);
      process.exit(1);
    }

    process.stdout.write('  Generando... ');
    const taskId = await generarMusica({
      prompt,
      estilo,
      duracion,
      titulo: `Fondo ${path.basename(carpeta)}`,
    });

    const pistas = await esperarMusica(taskId);
    console.log('listo');

    fs.mkdirSync(dirMusica, { recursive: true });
    const destino = path.join(dirMusica, 'fondo.mp3');
    await descargar(pistas[0].audio_url, destino);

    // Suno suele devolver dos versiones: la segunda queda como alternativa.
    if (pistas[1]) await descargar(pistas[1].audio_url, path.join(dirMusica, 'fondo-alternativa.mp3'));

    console.log(`\n  Pista:  ${destino}`);
    if (pistas[1]) console.log(`  Otra opcion: ${path.join(dirMusica, 'fondo-alternativa.mp3')}  (${pistas[1].duration?.toFixed?.(1) ?? '?'}s)`);
    console.log(`  Duracion real: ${pistas[0].duration?.toFixed?.(1) ?? '?'}s`);
    console.log('\n  Escuchala. Si no te convence, borra el mp3 y vuelve a correr esto,');
    console.log('  o deja tu propia pista en musica/ y lista.\n');
  } catch (e) {
    console.error(`\n  ERROR: ${e.message}`);
    console.error('  La musica es opcional: el anuncio se puede ensamblar igual sin ella.\n');
    process.exitCode = 1;
  }
}
