// Cliente de ElevenLabs.
//
// Se habla DIRECTO con ElevenLabs, no via kie.ai: las voces clonadas y las
// guardadas de la biblioteca viven en la cuenta del usuario y solo son
// accesibles autenticandose con la key de esa cuenta.
//
// Endpoints verificados el 2026-09-01 en https://elevenlabs.io/docs
//   GET /v2/voices                     listado (v1 sigue existiendo, como legado)
//   GET /v1/voices/{id}/settings       ajustes guardados de una voz

import fsSync from 'node:fs';
import pathSync from 'node:path';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { requerirClave, RAIZ } from './config.js';

export const ELEVENLABS = {
  base: 'https://api.elevenlabs.io',
  listarVoces: '/v2/voices',
  listarVocesLegado: '/v1/voices',
  ajustesDeVoz: (id) => `/v1/voices/${encodeURIComponent(id)}/settings`,
};

// Categorias que devuelve la API. "cloned" y "professional" son voces del
// usuario; "premade" y las demas son de la biblioteca publica.
export const CATEGORIAS_PROPIAS = ['cloned', 'professional', 'generated'];

function cabeceras() {
  return {
    'xi-api-key': requerirClave(
      'ELEVENLABS_API_KEY',
      'entra a https://elevenlabs.io, click en tu perfil (abajo a la izquierda) > API Keys'
    ),
    'Content-Type': 'application/json',
  };
}

async function pedir(ruta) {
  const res = await fetch(ELEVENLABS.base + ruta, { headers: cabeceras() });
  const texto = await res.text();

  if (res.status === 401) {
    throw new Error('ElevenLabs rechazo la clave (401). Revisa ELEVENLABS_API_KEY en el .env.');
  }
  if (!res.ok) {
    throw new Error(`ElevenLabs devolvio HTTP ${res.status} en ${ruta}: ${texto.slice(0, 300)}`);
  }
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`ElevenLabs devolvio una respuesta no-JSON en ${ruta}: ${texto.slice(0, 300)}`);
  }
}

/** Todas las voces de la cuenta, paginando hasta el final. */
export async function listarVoces() {
  const voces = [];
  let token = null;

  try {
    do {
      const q = new URLSearchParams({ page_size: '100' });
      if (token) q.set('next_page_token', token);
      const json = await pedir(`${ELEVENLABS.listarVoces}?${q}`);
      voces.push(...(json.voices || []));
      token = json.has_more ? json.next_page_token : null;
    } while (token);
  } catch (e) {
    // Si /v2 no responde, se intenta el endpoint legado antes de rendirse.
    if (voces.length === 0) {
      const json = await pedir(ELEVENLABS.listarVocesLegado);
      voces.push(...(json.voices || []));
    } else {
      throw e;
    }
  }

  return voces.map((v) => ({
    id: v.voice_id,
    nombre: v.name,
    categoria: v.category || 'desconocida',
    propia: CATEGORIAS_PROPIAS.includes(v.category),
    clonada: v.category === 'cloned',
    descripcion: v.description || null,
    etiquetas: v.labels || {},
    ajustes: v.settings || null,
  }));
}

/** Ajustes guardados de una voz en la cuenta. null si no se pueden leer. */
export async function ajustesGuardados(voiceId) {
  try {
    return await pedir(ELEVENLABS.ajustesDeVoz(voiceId));
  } catch {
    return null;
  }
}

/**
 * Resuelve lo que el usuario escribio a un voice_id real.
 * El ID es la fuente de verdad; el nombre es una comodidad que se resuelve aqui.
 */
export async function resolverVoz(idONombre, vocesCache = null) {
  const buscado = (idONombre || '').trim();
  if (!buscado) {
    throw new Error(
      'No hay voz definida.\n' +
        '  Pon ELEVENLABS_VOICE_ID en el .env, o el nombre de la voz.\n' +
        '  Para ver tus voces:  npm run voces'
    );
  }

  const voces = vocesCache || (await listarVoces());

  const porId = voces.find((v) => v.id === buscado);
  if (porId) return { ...porId, resueltoPor: 'id' };

  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const porNombre = voces.filter((v) => norm(v.nombre) === norm(buscado));

  if (porNombre.length === 1) return { ...porNombre[0], resueltoPor: 'nombre' };

  if (porNombre.length > 1) {
    throw new Error(
      `Tienes ${porNombre.length} voces llamadas "${buscado}". Usa el ID para que no haya dudas:\n` +
        porNombre.map((v) => `    ${v.id}   ${v.nombre} (${v.categoria})`).join('\n')
    );
  }

  const parecidas = voces.filter((v) => norm(v.nombre).includes(norm(buscado)));
  throw new Error(
    `No encuentro ninguna voz con ID ni nombre "${buscado}" en tu cuenta.` +
      (parecidas.length
        ? `\n  ¿Sera alguna de estas?\n` + parecidas.slice(0, 5).map((v) => `    ${v.id}   ${v.nombre}`).join('\n')
        : '') +
      '\n  Para ver la lista completa:  npm run voces'
  );
}

/**
 * Ajustes finales de la voz.
 * Por defecto manda lo que el usuario tenga guardado en ElevenLabs. Si el
 * manifiesto trae sugerencias de tono, esas pisan campo por campo.
 */
export async function ajustesFinales(voiceId, ajustesDelManifiesto = null) {
  const guardados = (await ajustesGuardados(voiceId)) || {};
  if (!ajustesDelManifiesto) return { ajustes: guardados, origen: 'guardados en ElevenLabs', pisados: [] };

  const permitidos = ['stability', 'similarity_boost', 'style', 'speed', 'use_speaker_boost'];
  const ajustes = { ...guardados };
  const pisados = [];

  for (const campo of permitidos) {
    if (ajustesDelManifiesto[campo] !== undefined) {
      ajustes[campo] = ajustesDelManifiesto[campo];
      pisados.push(campo);
    }
  }

  return {
    ajustes,
    origen: pisados.length ? 'guardados + sugerencias del manifiesto' : 'guardados en ElevenLabs',
    pisados,
  };
}

// ---------------------------------------------------------------------------
// Seleccion de voz integrada
//
// El objetivo es que un usuario que nunca corrio "npm run voces" pueda llegar a
// generar el audio sin quedarse trabado. Nadie tiene que saber que ese comando
// existe: si falta la voz, el pipeline la pide aca mismo y la deja guardada.
// ---------------------------------------------------------------------------

/** Escribe (o actualiza) ELEVENLABS_VOICE_ID en el .env sin tocar el resto. */
export function guardarVozEnEnv(voiceId) {
  const ruta = pathSync.join(RAIZ, '.env');
  const contenido = fsSync.readFileSync(ruta, 'utf8');
  const finDeLinea = contenido.includes('\r\n') ? '\r\n' : '\n';

  const lineas = contenido.split(/\r?\n/);
  const i = lineas.findIndex((l) => /^\s*ELEVENLABS_VOICE_ID\s*=/.test(l));

  if (i !== -1) lineas[i] = `ELEVENLABS_VOICE_ID=${voiceId}`;
  else lineas.push(`ELEVENLABS_VOICE_ID=${voiceId}`);

  fsSync.writeFileSync(ruta, lineas.join(finDeLinea), 'utf8');
  process.env.ELEVENLABS_VOICE_ID = voiceId;
  return ruta;
}

function imprimirCatalogo(voces) {
  // TODAS las voces, sin filtrar por idioma: el usuario puede querer una voz en
  // ingles para un anuncio en espanol, y esa decision es suya.
  const propias = voces.filter((v) => v.propia);
  const biblioteca = voces.filter((v) => !v.propia);
  const indices = new Map();
  let n = 0;

  const bloque = (titulo, lista) => {
    if (!lista.length) return;
    console.log(`\n  --- ${titulo} ---`);
    for (const v of lista) {
      n += 1;
      indices.set(n, v);
      const etiqueta = v.clonada ? '[CLONADA]' : v.propia ? `[${v.categoria.toUpperCase()}]` : '';
      const l = v.etiquetas || {};
      const detalles = ['language', 'accent', 'gender', 'age', 'use_case']
        .map((k) => l[k])
        .filter(Boolean)
        .join(' · ');
      console.log(`  ${String(n).padStart(3)}. ${v.nombre.padEnd(42)} ${etiqueta}`);
      console.log(`       ${v.id}${detalles ? '   ' + detalles : ''}`);
    }
  };

  bloque('TUS VOCES (clonadas y profesionales)', propias);
  bloque(`BIBLIOTECA (${biblioteca.length})`, biblioteca);
  return indices;
}

/**
 * Devuelve la voz a usar.
 *  - Si el .env tiene un ID valido en esta cuenta: lo usa y no pregunta nada.
 *  - Si esta vacio o el ID no existe aqui: lista y pide elegir, y guarda la
 *    eleccion en el .env para que no vuelva a preguntar.
 */
export async function seleccionarVoz({ preferida = null, interactivo = true } = {}) {
  const delEnv = (preferida || process.env.ELEVENLABS_VOICE_ID || '').trim();
  const voces = await listarVoces();

  if (delEnv) {
    try {
      const v = await resolverVoz(delEnv, voces);
      return { voz: v, preguntado: false, guardado: false };
    } catch {
      console.log(`\n  El ELEVENLABS_VOICE_ID del .env ("${delEnv}") no existe en esta cuenta de ElevenLabs.`);
      console.log('  Puede pasar si la clave es de otra cuenta, o si borraste esa voz.');
      console.log('  Elige una de las que si tienes:');
    }
  } else {
    console.log('\n  Todavia no elegiste la voz de la narracion.');
    console.log('  Estas son las voces de tu cuenta de ElevenLabs:');
  }

  if (!interactivo || !stdin.isTTY) {
    throw new Error(
      'Falta elegir la voz y no puedo preguntartelo aqui (la terminal no es interactiva).\n' +
        '  Corre esto en una terminal normal para ver tus voces:\n' +
        '      npm run voces\n' +
        '  y pega el ID que elijas en el .env:\n' +
        '      ELEVENLABS_VOICE_ID=el_id_que_elegiste'
    );
  }

  const indices = imprimirCatalogo(voces);
  console.log('\n  La voz es identidad de tu marca: elige la que quieras, sin importar el');
  console.log('  idioma del anuncio. Puedes responder con el numero, el ID o el nombre.\n');

  const rl = readline.createInterface({ input: stdin, output: stdout });
  let elegida = null;

  while (!elegida) {
    const r = (await rl.question('  Que voz uso? ')).trim();
    if (!r) continue;

    if (/^\d+$/.test(r) && indices.has(Number(r))) {
      elegida = indices.get(Number(r));
      break;
    }
    try {
      elegida = await resolverVoz(r, voces);
    } catch (e) {
      console.log(`  ${e.message.split('\n')[0]}`);
    }
  }
  rl.close();

  const ruta = guardarVozEnEnv(elegida.id);
  console.log(`\n  Elegida: ${elegida.nombre} (${elegida.id})`);
  console.log(`  Guardada en ${ruta}. No te la vuelvo a preguntar.\n`);

  return { voz: elegida, preguntado: true, guardado: true };
}
