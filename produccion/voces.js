// Lista las voces de TU cuenta de ElevenLabs, con nombre e ID, marcando las clonadas.
// Sirve para elegir la voz del anuncio con tus propias voces a la vista.
//
//   npm run voces                lista todo
//   npm run voces -- --propias   solo tus voces (clonadas y profesionales)
//   npm run voces -- --buscar ana

import { cargarEnv } from './config.js';
import { listarVoces, ajustesGuardados } from './elevenlabs-client.js';

cargarEnv();

const args = process.argv.slice(2);
const soloPropias = args.includes('--propias');
const i = args.indexOf('--buscar');
const filtro = i !== -1 && args[i + 1] ? args[i + 1].toLowerCase() : null;

const actual = (process.env.ELEVENLABS_VOICE_ID || '').trim();

try {
  let voces = await listarVoces();

  if (soloPropias) voces = voces.filter((v) => v.propia);
  if (filtro) {
    voces = voces.filter(
      (v) =>
        v.nombre.toLowerCase().includes(filtro) ||
        (v.descripcion || '').toLowerCase().includes(filtro) ||
        Object.values(v.etiquetas).join(' ').toLowerCase().includes(filtro)
    );
  }

  if (voces.length === 0) {
    console.log('\n  No hay voces que mostrar con ese filtro.\n');
    process.exit(0);
  }

  // Tus voces primero: son las que probablemente quieras usar.
  const propias = voces.filter((v) => v.propia);
  const biblioteca = voces.filter((v) => !v.propia);

  const imprimir = (lista) => {
    for (const v of lista) {
      const marca = v.id === actual ? ' <- la del .env' : '';
      const etiqueta = v.clonada ? '[CLONADA]' : v.propia ? `[${v.categoria.toUpperCase()}]` : '';
      console.log(`  ${v.id}  ${v.nombre.padEnd(24)} ${etiqueta}${marca}`);

      const detalles = [];
      const l = v.etiquetas || {};
      for (const k of ['language', 'accent', 'gender', 'age', 'use_case', 'description']) {
        if (l[k]) detalles.push(l[k]);
      }
      if (detalles.length) console.log(`  ${' '.repeat(20)}  ${detalles.join(' · ')}`);
    }
  };

  console.log(`\n=== Voces de tu cuenta de ElevenLabs (${voces.length}) ===\n`);

  if (propias.length) {
    console.log('  --- TUS VOCES (clonadas y profesionales) ---');
    imprimir(propias);
    console.log('');
  }

  if (biblioteca.length) {
    console.log(`  --- BIBLIOTECA (${biblioteca.length}) ---`);
    imprimir(biblioteca);
    console.log('');
  }

  if (actual) {
    const elegida = voces.find((v) => v.id === actual);
    if (elegida) {
      const g = await ajustesGuardados(actual);
      console.log(`  Tu .env apunta a: ${elegida.nombre}  (${actual})`);
      if (g) {
        const partes = Object.entries(g)
          .filter(([, val]) => val !== null && val !== undefined)
          .map(([k, val]) => `${k}=${val}`);
        console.log(`  Ajustes guardados de esa voz: ${partes.join(', ')}`);
        console.log('  El pipeline usa esos por defecto; el manifiesto puede sobrescribirlos.');
      }
      console.log('');
    } else {
      console.log(`  OJO: tu .env tiene ELEVENLABS_VOICE_ID=${actual}, que no esta en esta lista.\n`);
    }
  } else {
    console.log('  Tu .env todavia no tiene ELEVENLABS_VOICE_ID.');
    console.log('  Copia el ID de la voz que quieras y pegalo ahi:');
    console.log('      ELEVENLABS_VOICE_ID=el_id_que_elegiste');
    console.log('  Tambien se acepta el nombre, pero el ID es mas seguro: no cambia si renombras la voz.\n');
  }
} catch (e) {
  console.error(`\n  ${e.message}\n`);
  process.exitCode = 1;
}
