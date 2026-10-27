// Compara dos manifiestos del mismo anuncio para ver que cambio al ajustar la skill.
// Pensado para responder rapido: "¿la correccion realmente entro en los prompts?"
//
//   node produccion/comparar-manifiestos.js <viejo.json> <nuevo.json>

import fs from 'node:fs';
import path from 'node:path';

// Senales concretas de los ajustes del Paso 5. Si el manifiesto nuevo se genero
// con la skill corregida, estas frases tienen que aparecer/desaparecer.
const SENALES = [
  {
    nombre: 'fondo liso en la hoja de personaje',
    donde: 'personaje.prompt',
    debeAparecer: [/plain flat knitted backdrop/i, /no granny squares/i],
    debeDesaparecer: [/simple crocheted backdrop/i],
  },
  {
    nombre: 'producto tejido en los prompts de imagen',
    donde: 'prompts con producto',
    debeAparecer: [/package is itself fully crocheted/i, /crochet stitch texture across its entire surface/i],
    debeDesaparecer: [/keeps its exact real shape, proportions and design/i, /real product package/i],
  },
];

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

function promptsConProducto(m) {
  const out = [];
  for (const t of m.tomas || []) {
    if ((t.referencias || []).includes('producto')) {
      out.push({ id: `toma ${t.n} inicial`, texto: t.prompt_imagen_inicial });
      if (t.prompt_imagen_final) out.push({ id: `toma ${t.n} final`, texto: t.prompt_imagen_final });
    }
  }
  for (const b of m.broll || []) {
    if ((b.referencias || []).includes('producto')) out.push({ id: `broll ${b.n}`, texto: b.prompt_imagen });
  }
  return out;
}

function comparar(a, b) {
  console.log('\n=== Cabecera ===\n');
  for (const campo of ['estilo', 'modo_audio', 'mercado', 'idioma', 'aspect_ratio']) {
    const igual = a[campo] === b[campo];
    console.log(`  ${igual ? '=' : '~'} ${campo.padEnd(13)} ${igual ? a[campo] : `${a[campo]}  ->  ${b[campo]}`}`);
  }
  const fa = a.producto?.foto ?? null;
  const fb = b.producto?.foto ?? null;
  console.log(`  ${fa === fb ? '=' : '~'} producto.foto ${fa === fb ? fa : `${fa}  ->  ${fb}`}`);
  if (norm(a.producto?.nota) !== norm(b.producto?.nota)) {
    console.log('\n  producto.nota cambio:');
    console.log(`    antes:  ${a.producto?.nota}`);
    console.log(`    ahora:  ${b.producto?.nota}`);
  }

  console.log('\n=== Estructura ===\n');
  console.log(`  tomas:  ${a.tomas.length}  ->  ${b.tomas.length}`);
  console.log(`  broll:  ${a.broll?.length ?? 0}  ->  ${b.broll?.length ?? 0}`);
  const dur = (m) => [...(m.tomas || []), ...(m.broll || [])].reduce((s, x) => s + (x.duracion || 0), 0);
  console.log(`  metraje: ${dur(a).toFixed(1)}s  ->  ${dur(b).toFixed(1)}s`);

  console.log('\n=== Tomas, una por una ===\n');
  const max = Math.max(a.tomas.length, b.tomas.length);
  for (let i = 0; i < max; i++) {
    const ta = a.tomas[i];
    const tb = b.tomas[i];
    if (!ta) { console.log(`  + toma ${tb.n} es nueva`); continue; }
    if (!tb) { console.log(`  - toma ${ta.n} ya no esta`); continue; }

    const difs = [];
    if (ta.tipo !== tb.tipo) difs.push(`tipo ${ta.tipo}->${tb.tipo}`);
    if (ta.duracion !== tb.duracion) difs.push(`dur ${ta.duracion}->${tb.duracion}`);
    const ra = (ta.referencias || []).join(',');
    const rb = (tb.referencias || []).join(',');
    if (ra !== rb) difs.push(`refs [${ra}]->[${rb}]`);
    if (norm(ta.linea) !== norm(tb.linea)) difs.push('linea distinta');
    if (norm(ta.prompt_imagen_inicial) !== norm(tb.prompt_imagen_inicial)) difs.push('prompt inicial distinto');
    if (norm(ta.prompt_imagen_final) !== norm(tb.prompt_imagen_final)) difs.push('prompt final distinto');
    if (norm(ta.prompt_video) !== norm(tb.prompt_video)) difs.push('prompt video distinto');

    console.log(`  ${difs.length ? '~' : '='} toma ${String(ta.n).padStart(2)}  ${difs.join(' | ') || 'sin cambios'}`);
  }

  console.log('\n=== ¿Entraron las correcciones de la skill? ===');
  let todoOk = true;

  for (const s of SENALES) {
    console.log(`\n  ${s.nombre}`);
    const textos =
      s.donde === 'personaje.prompt'
        ? [{ id: 'personaje', texto: b.personaje?.prompt }]
        : promptsConProducto(b);

    if (textos.length === 0) {
      console.log('    (no hay prompts de ese tipo en el manifiesto nuevo)');
      continue;
    }

    for (const re of s.debeAparecer) {
      const faltan = textos.filter((x) => !re.test(x.texto || ''));
      if (faltan.length === 0) {
        console.log(`    SI   aparece  ${re.source.slice(0, 46)}  (en los ${textos.length})`);
      } else {
        todoOk = false;
        console.log(`    NO   falta    ${re.source.slice(0, 46)}  en: ${faltan.map((x) => x.id).join(', ')}`);
      }
    }
    for (const re of s.debeDesaparecer) {
      const quedan = textos.filter((x) => re.test(x.texto || ''));
      if (quedan.length === 0) {
        console.log(`    SI   ya no esta  ${re.source.slice(0, 42)}`);
      } else {
        todoOk = false;
        console.log(`    NO   sigue ahi   ${re.source.slice(0, 42)}  en: ${quedan.map((x) => x.id).join(', ')}`);
      }
    }
  }

  console.log(
    todoOk
      ? '\n  Las dos correcciones del Paso 5 entraron en el manifiesto nuevo.\n'
      : '\n  Alguna correccion NO entro. Revisa arriba antes de gastar en generar.\n'
  );
  return todoOk;
}

if (process.argv[1] && process.argv[1].endsWith('comparar-manifiestos.js')) {
  const [, , rv, rn] = process.argv;
  if (!rv || !rn) {
    console.error('\n  Uso: node produccion/comparar-manifiestos.js <manifiesto-viejo.json> <manifiesto-nuevo.json>\n');
    process.exit(1);
  }
  for (const r of [rv, rn]) {
    if (!fs.existsSync(r)) {
      console.error(`\n  No encuentro: ${path.resolve(r)}\n`);
      process.exit(1);
    }
  }
  const a = JSON.parse(fs.readFileSync(rv, 'utf8'));
  const b = JSON.parse(fs.readFileSync(rn, 'utf8'));
  console.log(`\nviejo: ${path.resolve(rv)}`);
  console.log(`nuevo: ${path.resolve(rn)}`);
  const ok = comparar(a, b);
  if (!ok) process.exitCode = 1;
}
