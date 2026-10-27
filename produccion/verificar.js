// Verificacion guiada del entorno. Pensado para un usuario no tecnico:
// dice exactamente que falta y como resolverlo.
// Uso:  npm run verificar
//
// En esta copia (version Google Flow) las imagenes y los videos los genera
// Claude en Flow manejando Chrome: KIE_API_KEY es RECOMENDADA (centavos por
// anuncio; OBLIGATORIA para musicales e historias musicales). Solo la usa Suno:
// la musica de fondo de los estilos que la generan (Pixar, claymation, crochet,
// objeto parlante, UGC) y las canciones (musicales e historias musicales). Lo
// de Chrome y Flow no se puede revisar desde la terminal y sale al final como
// lista para revisar a mano.

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, KIE, cargarEnv } from './config.js';
import { ELEVENLABS } from './elevenlabs-client.js';
import { FLOW, rutaDescargas } from './flow/flow.js';

// Color solo en una terminal de verdad (no al redirigir a un archivo) y nunca
// con NO_COLOR definido.
const conColor = process.stdout.isTTY && !process.env.NO_COLOR;
const pintar = (codigo, t) => (conColor ? `\x1b[${codigo}m${t}\x1b[0m` : t);
const amarillo = (t) => pintar('33', t);
const rojo = (t) => pintar('31', t);

const ok = (m) => console.log(`  OK    ${m}`);
const falla = (m, ayuda) => {
  console.log(`  ${rojo('FALTA')} ${m}`);
  if (ayuda) console.log(`        -> ${ayuda}`);
  problemas++;
};
const aviso = (m, ayuda) => {
  console.log(`  ${amarillo('AVISO')} ${m}`);
  if (ayuda) console.log(`        -> ${ayuda}`);
};

let problemas = 0;
// AVISOS que no frenan (el codigo de salida no cambia), pero sin los cuales
// ningun anuncio sale entero: con alguno pendiente el cierre no dice "Todo listo".
const pendientes = [];

function version(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n')[0].trim();
  } catch {
    return null;
  }
}

// Prueba la clave de ElevenLabs con una consulta gratis: la primera voz de la
// cuenta, lo mismo que pide el motor antes de cada voz en off (listarVoces).
// ElevenLabs contesta 401 a una clave inventada ({"detail":{"status":
// "invalid_api_key"}}) y TAMBIEN a una buena con permisos limitados
// ({"detail":{"status":"missing_permissions"}}, comprobado): esa sirve igual
// para lo que si tiene permitido, asi que es AVISO y no FALTA.
async function probarElevenLabs(clave) {
  try {
    const res = await fetch(`${ELEVENLABS.base}${ELEVENLABS.listarVoces}?page_size=1`, {
      headers: { 'xi-api-key': clave },
    });
    let detalle = {};
    try {
      detalle = (await res.json()).detail || {};
    } catch {
      // sin cuerpo JSON: cuenta solo el HTTP
    }
    if (res.ok) ok(`ElevenLabs respondio (HTTP ${res.status}) y acepto la clave`);
    else if (res.status === 401 && detalle.status === 'missing_permissions') {
      const permiso = (String(detalle.message || '').match(/permission (\w+)/) || [])[1] || 'voices_read';
      aviso(`ElevenLabs reconoce la clave, pero no tiene el permiso ${permiso}: sin el no se puede elegir la voz del narrador`,
        'en https://elevenlabs.io/app/settings/api-keys edita la clave y dale acceso a Voices (lectura), Text to Speech y Speech to Text');
    } else if (res.status === 401 || res.status === 403) falla(`ElevenLabs rechazo la clave (${res.status})`, 'revisa que copiaste la clave completa en el .env');
    else aviso(`ElevenLabs respondio HTTP ${res.status}: no se pudo comprobar la clave`, 'vuelve a correr npm run verificar en un rato');
  } catch (e) {
    falla(`no pude conectarme a ElevenLabs: ${e.message}`, 'revisa tu conexion a internet');
  }
}

console.log('\n=== 1. Programas necesarios ===');

// 20.12 y no solo 20: el motor carga el .env con process.loadEnvFile, que
// recien existe desde Node 20.12. Con 20.0 a 20.11 todo se cae con un error raro.
const [nodeMayor, nodeMenor] = process.versions.node.split('.').map(Number);
if (nodeMayor > 20 || (nodeMayor === 20 && nodeMenor >= 12)) ok(`Node.js ${process.version}`);
else falla(`Node.js ${process.version} es muy viejo (hace falta 20.12 o superior)`, 'instala la version LTS desde https://nodejs.org');

const ff = version('ffmpeg', ['-version']);
if (ff) ok(ff.replace(/ Copyright.*/, ''));
else falla('ffmpeg no esta instalado o no esta en el PATH',
  'En Windows: abre PowerShell y ejecuta  winget install Gyan.FFmpeg  ; despues cierra y vuelve a abrir la terminal.');

console.log('\n=== 2. Archivo .env y claves ===');

const rutaEnv = path.join(RAIZ, '.env');
if (!fs.existsSync(rutaEnv)) {
  falla('no existe el archivo .env', 'la instalacion no termino: el .env lo crea Claude con tus claves (pidele "instala esto"; INSTALAR.md, Paso 4)');
} else {
  ok('.env existe');
  cargarEnv();

  const kie = (process.env.KIE_API_KEY || '').trim();
  // Recomendada, no obligatoria, en esta copia (salvo musicales e historias
  // musicales): las imagenes y los videos salen de Google Flow.
  // kie.ai solo la usa Suno: la musica de fondo (npm run musica) de los
  // estilos que la generan por defecto y las canciones (npm run cancion). Sin
  // clave andan Lego, Zack D Films y skeleton (pista fija, sin Suno), podcast y
  // entrevista (sin musica), y cualquier estilo con un mp3 propio en musica/.
  if (kie) ok(`KIE_API_KEY cargada (${kie.slice(0, 4)}...${kie.slice(-4)}) — musica de fondo y canciones con Suno`);
  else aviso('KIE_API_KEY vacia (recomendada, centavos por anuncio; obligatoria para musicales e historias musicales): sin ella no hay musica de fondo con Suno, que ponen por defecto Pixar, claymation, crochet, objeto parlante y UGC, ni canciones (musicales e historias musicales)',
    'para esos estilos: crea tu cuenta en https://kie.ai , copia la clave de https://kie.ai/api-key en el .env y carga saldo. ' +
      'Sin clave andan Lego, Zack D Films y skeleton (pista fija), podcast y entrevista (sin musica), o cualquier estilo si dejas tu propio mp3 en temp/<anuncio>/musica/. ' +
      'Las imagenes y los videos no la usan: salen de Google Flow');

  // La usan todos los estilos. Sigue como AVISO, igual que en el original,
  // pero queda pendiente para el cierre.
  const eleven = (process.env.ELEVENLABS_API_KEY || '').trim();
  if (eleven) {
    ok(`ELEVENLABS_API_KEY cargada (${eleven.slice(0, 4)}...${eleven.slice(-4)})`);
    await probarElevenLabs(eleven);
  } else {
    aviso('ELEVENLABS_API_KEY vacia: la usan todos los estilos (la voz en off y la transcripcion de lo que se dice o se canta, para subtitulos y cortes)',
      'https://elevenlabs.io -> tu perfil -> API Keys');
    pendientes.push('la clave de ElevenLabs (punto 2)');
  }

  const voz = (process.env.ELEVENLABS_VOICE_ID || '').trim();
  if (voz) ok(`ELEVENLABS_VOICE_ID = ${voz}`);
  else aviso('ELEVENLABS_VOICE_ID vacia: es la voz del narrador en los estilos con voz en off (Pixar, Zack D Films, Lego, claymation, crochet, skeleton)',
    'npm run voces te muestra tus voces con su ID; pega en el .env el de la que elijas');
}

console.log('\n=== 3. Conexion con kie.ai (solo musica y canciones) ===');

// Solo se prueba si hay clave. La consulta es de una tarea que no existe: no
// genera nada ni gasta saldo.
if (!(process.env.KIE_API_KEY || '').trim()) {
  aviso('salteado: no hay KIE_API_KEY que probar (en el punto 2 dice que estilos andan sin ella)');
} else {
  try {
    const res = await fetch(`${KIE.base}${KIE.consultarTarea}?taskId=verificacion-de-entorno`, {
      headers: { Authorization: `Bearer ${process.env.KIE_API_KEY.trim()}` },
    });
    // kie.ai contesta HTTP 200 tambien con una clave mala: el rechazo viene en
    // el cuerpo, {"code":401,...} (comprobado). Con una clave buena, esta
    // consulta de una tarea que no existe da {"code":422,"msg":"recordInfo is null"}.
    let cuerpo = null;
    try {
      cuerpo = await res.json();
    } catch {
      // sin cuerpo JSON: cuenta solo el HTTP
    }
    const codigo = res.status !== 200 ? res.status : Number(cuerpo && cuerpo.code) || res.status;
    if (codigo === 401 || codigo === 403) falla(`kie.ai rechazo la clave (${codigo})`, 'revisa que copiaste la clave completa en el .env');
    else if (codigo === 429) aviso('kie.ai respondio 429 (limite de solicitudes), pero la clave es valida');
    else ok(`kie.ai respondio (HTTP ${res.status}, codigo ${codigo}) y acepto la clave`);
  } catch (e) {
    falla(`no pude conectarme a kie.ai: ${e.message}`, 'revisa tu conexion a internet');
  }
}

console.log('\n=== 4. Carpetas ===');
for (const d of ['temp', 'output', 'produccion', 'skills']) {
  const p = path.join(RAIZ, d);
  if (fs.existsSync(p)) ok(`${d}/`);
  else falla(`falta la carpeta ${d}/`, `creala con: mkdir ${d}`);
}

console.log('\n=== 5. Remotion (arma el video final) ===');
const remotionPkg = path.join(RAIZ, 'remotion', 'package.json');
if (fs.existsSync(path.join(RAIZ, 'remotion', 'node_modules'))) ok('proyecto de Remotion instalado');
else if (fs.existsSync(remotionPkg)) {
  aviso('remotion/ existe pero sin dependencias instaladas: sin ellas no se arma el video final', 'entra a remotion/ y ejecuta: npm install');
  pendientes.push('instalar Remotion (punto 5)');
} else {
  aviso('falta remotion/ (arma el video final)', 'viene dentro del zip del proyecto: vuelve a descomprimirlo');
  pendientes.push('la carpeta remotion/ (punto 5)');
}

console.log('\n=== 6. Skills: lo ejecutado vs lo empaquetado ===');
{
  const { revisar } = await import('./skills-sync.js');
  const filas = revisar();
  const desfase = filas.filter((f) => f.estado === 'desfase');
  const instaladas = filas.filter((f) => f.bytesEjecutada != null);

  if (instaladas.length === 0) {
    aviso('no hay ninguna skill instalada en .claude/skills/', 'node produccion/skills-sync.js --desempaquetar');
  } else if (desfase.length === 0) {
    ok(`${instaladas.length} skill(s) instalada(s), alineadas con su .skill`);
  } else {
    for (const f of desfase) {
      falla(
        `${f.nombre}: lo que se EJECUTA no es lo que dice el .skill`,
        'si lo bueno es .claude/skills (lo normal: es lo que ejecuta Claude Code): npm run skills:empaquetar  ; el detalle: npm run skills'
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Efectos de transicion: donde cae el golpe de cada uno.
//
// INFORMATIVO, no bloquea. El motor se adapta solo: planear-montaje.js mide
// este mismo pico y adelanta la reproduccion para que caiga en el corte
// (resolverTransiciones -> adelantoSeg). Un efecto que golpea a los 0.40s
// funciona igual de bien que uno que golpea a los 0.00s.
//
// Se muestra porque el numero explica lo que se oye. Hasta el 2026-09-06 el
// sonido se montaba desde el corte sin adelanto, y como el deep-woosh es un
// SWELL que tarda 0.40s en picar, su golpe llegaba despues de que la animacion
// (0.28s) habia terminado. Se oia desfasado en los seis anuncios.
//
// La primera version de este chequeo FALLABA si el pico no estaba al principio,
// y eso era pedirle al archivo que se adaptara al motor. Se invirtio: el motor
// se adapta al archivo, y aqui solo se informa.
// ---------------------------------------------------------------------------
console.log('\n=== 7. Efectos de transicion: donde golpea cada uno ===');

const DIR_EFECTOS = path.join(RAIZ, 'recursos', 'efectos-transiciones');

// Se usa LA MISMA funcion que el montaje, importada, no una copia. Tenerla dos
// veces ya salio mal una vez: esta seccion siguio reportando el PICO despues de
// que el motor pasara a anclar el ATAQUE, y decia un adelanto que no era el que
// se aplicaba.
const { segundoDelGolpe } = await import('./planear-montaje.js');

if (!fs.existsSync(DIR_EFECTOS)) {
  aviso('no existe recursos/efectos-transiciones/');
} else {
  // Los archivos con "--" en el nombre son respaldos.
  const efectos = fs.readdirSync(DIR_EFECTOS).filter((f) => f.endsWith('.mp3') && !f.includes('--'));

  for (const nombre of efectos) {
    const adelanto = segundoDelGolpe(path.join(DIR_EFECTOS, nombre));

    if (adelanto === 0) {
      ok(`${nombre}: ataque al empezar — suena desde el corte`);
    } else {
      ok(`${nombre}: ataque en t=${adelanto.toFixed(2)}s — el motor lo adelanta ${adelanto.toFixed(2)}s para que caiga en el corte`);
    }
  }
}

// ---------------------------------------------------------------------------
// 8. Lo que solo usan los estilos hablados (podcast y entrevista): Python 3
// con Pillow y numpy (tapar los huecos de los iconos de la entrevista), rembg
// y onnxruntime (recortar al host del podcast en esquina) y el codificador VP9
// de ffmpeg (el .webm con alfa del host recortado).
//
// Solo AVISOS, nunca FALTA: quien no hace esos estilos no necesita nada de
// esto, y el resultado ("Todo listo" y el codigo de salida) no cambia. Python
// se busca y se corre igual que en el motor (recortar-host.js: -E -P, no -I,
// para ver tambien los paquetes instalados con pip --user). Los paquetes se
// buscan sin importarlos (instantaneo); el chequeo completo del recorte, con
// el modelo, es  npm run recortar -- --verificar.
// ---------------------------------------------------------------------------
console.log('\n=== 8. Podcast y entrevista: Python y VP9 (solo para esos estilos) ===');
{
  const { buscarPython, comandoPython, comandoInstalar, paquetesQueFaltan, PAQUETES_PYTHON, ffmpegConVp9 } = await import(
    './recortar-host.js'
  );
  const python = buscarPython();
  if (!python) {
    aviso(
      'no encuentro Python 3: la entrevista lo usa para tapar los huecos de los iconos y el podcast en esquina para recortar al host',
      'instalalo desde https://www.python.org/downloads/ (marca "Add python.exe to PATH"), abre otra terminal y despues: ' +
        'python -m pip install --user pillow numpy rembg onnxruntime  ; comprueba con: npm run verificar'
    );
  } else {
    ok(`Python ${python.version} (${comandoPython(python)}; el motor lo corre con ${python.banderas.join(' ')})`);
    const deIconos = PAQUETES_PYTHON.iconos;
    const delRecorte = PAQUETES_PYTHON.recorte.filter(([m]) => !deIconos.some(([x]) => x === m));
    const faltanIconos = paquetesQueFaltan(python, deIconos);
    const faltanRecorte = paquetesQueFaltan(python, delRecorte);
    if (faltanIconos === null || faltanRecorte === null) {
      aviso(`Python ${python.version} no pudo decir que paquetes tiene`, 'npm run recortar -- --verificar  (muestra el error completo)');
    } else {
      if (faltanIconos.length) {
        aviso(
          `a Python le faltan ${faltanIconos.join(' y ')}: la entrevista los usa para tapar los huecos de los iconos`,
          `${comandoInstalar(python, faltanIconos)}  ; comprueba con: npm run verificar`
        );
      } else ok('Pillow y numpy (huecos de los iconos de la entrevista)');
      if (faltanRecorte.length) {
        aviso(
          `a Python le faltan ${faltanRecorte.join(' y ')}: el podcast en esquina los usa para recortar al host`,
          `${comandoInstalar(python, faltanRecorte)}  ; comprueba con: npm run recortar -- --verificar`
        );
      } else ok('rembg y onnxruntime (host recortado del podcast en esquina)');
    }
  }
  // Sin ffmpeg (null) ya salio arriba como FALTA.
  const vp9 = ffmpegConVp9();
  if (vp9 === false) {
    aviso(
      'ffmpeg no trae el codificador VP9 (libvpx-vp9): el podcast en esquina lo usa para el video con alfa del host recortado',
      'En Windows: winget install Gyan.FFmpeg  (la version "full"); despues cierra y vuelve a abrir la terminal.'
    );
  } else if (vp9) ok('ffmpeg con VP9 (libvpx-vp9, host recortado del podcast en esquina)');
}

// ---------------------------------------------------------------------------
// 9. Google Flow: las imagenes y los videos los genera Claude en Flow manejando
// Chrome, y los descarga a la carpeta de descargas, de donde flow:recibir los
// toma. Lo unico que se puede revisar desde aqui es esa carpeta; lo demas
// (extension, sesion de Google, la ventana de Claude) se revisa a mano.
// ---------------------------------------------------------------------------
console.log('\n=== 9. Google Flow (imagenes y videos) ===');
{
  const descargas = rutaDescargas();
  const propia = (process.env.FLOW_DESCARGAS || '').trim();
  if (fs.existsSync(descargas) && fs.statSync(descargas).isDirectory()) {
    ok(`carpeta de descargas de Chrome: ${descargas}${propia ? ' (FLOW_DESCARGAS del .env)' : ''}`);
  } else if (propia) {
    falla(`FLOW_DESCARGAS apunta a una carpeta que no existe: ${descargas}`,
      'pon en el .env la carpeta donde Chrome guarda tus descargas (Chrome > Configuracion > Descargas > Ubicacion), o dejala vacia para usar la normal');
  } else {
    falla(`no encuentro la carpeta de descargas: ${descargas}`,
      'si Chrome descarga en otra carpeta, escribela en el .env como FLOW_DESCARGAS=C:\\ruta\\de\\tu\\carpeta');
  }

  // Lo de Chrome y Flow no se ve desde la terminal, asi que la instalacion deja
  // una marca cuando Claude lo comprobo con el usuario (INSTALAR.md, pasos de
  // Chrome y Flow): npm run verificar -- --flow-listo. Sin la marca, el cierre
  // no dice "Todo listo": si el alumno reinicia Claude Code a mitad de la
  // instalacion, la sesion nueva sabe que esos pasos siguen pendientes.
  const marca = path.join(RAIZ, '.flow-listo');
  if (process.argv.includes('--flow-listo')) {
    fs.writeFileSync(marca, JSON.stringify({ confirmado: new Date().toISOString() }) + '\n');
    ok('Chrome + Claude in Chrome + Google Flow: confirmado y anotado (.flow-listo)');
  } else if (fs.existsSync(marca)) {
    ok('Chrome + Claude in Chrome + Google Flow: confirmados en la instalacion');
  } else {
    aviso('Chrome, la extension Claude in Chrome y Google Flow todavia no se confirmaron',
      'son los pasos de Chrome y Google Flow de INSTALAR.md. Al terminarlos: npm run verificar -- --flow-listo');
    pendientes.push('confirmar Chrome, la extension Claude in Chrome y Google Flow (INSTALAR.md)');
  }

  console.log('');
  console.log('  Esto no se puede revisar desde la terminal. Revisalo tu antes del primer anuncio:');
  console.log('  [ ] La extension "Claude in Chrome" esta instalada en Chrome, con tu cuenta de Claude,');
  console.log('      y conectada a Claude Code.');
  console.log(`  [ ] En ese mismo Chrome tienes abierta tu cuenta de Google y Google Flow te deja crear`);
  console.log(`      (${FLOW.url}). Recomendado: plan Google AI Pro o Ultra, por los creditos de video.`);
  console.log('  [ ] Cuando Claude abra su grupo de pestanas "Claude": clic derecho en la etiqueta "Claude" >');
  console.log('      "Mover grupo a una ventana nueva", y sigue trabajando en tu ventana. No cierres la de Claude.');
}

console.log('');
if (problemas === 0 && pendientes.length) {
  console.log(`Casi listo: te falta ${pendientes.join(' y ')}. Sin eso ningun anuncio sale entero.`);
  console.log('Despues revisa a mano la lista del punto 9.\n');
} else if (problemas === 0) {
  console.log('Todo listo (revisa a mano la lista del punto 9). Siguiente paso: abre Claude Code en esta');
  console.log('carpeta y pidele el anuncio, por ejemplo:  hazme un anuncio estilo Pixar de <tu producto>\n');
} else {
  console.log(`Hay ${problemas} cosa(s) por resolver antes de seguir. Ver arriba.\n`);
  process.exitCode = 1;
}
