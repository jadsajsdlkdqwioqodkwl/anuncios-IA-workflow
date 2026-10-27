// Mantiene alineados los dos lugares donde vive una skill:
//
//   .claude/skills/<nombre>/SKILL.md   <- EL QUE SE EJECUTA (fuente de verdad)
//   skills/<nombre>.skill              <- el paquete para distribuir (artefacto)
//
// Editar el .skill no cambia nada de lo que corre: es un zip. Por eso la fuente
// de verdad es la carpeta .claude/skills, y el .skill se genera desde ahi.
//
//   node produccion/skills-sync.js            revisa y avisa si hay desfase
//   node produccion/skills-sync.js --empaquetar   .claude/  ->  skills/*.skill
//   node produccion/skills-sync.js --desempaquetar skills/*.skill -> .claude/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { RAIZ } from './config.js';

const DIR_EJECUTADAS = path.join(RAIZ, '.claude', 'skills');
const DIR_PAQUETES = path.join(RAIZ, 'skills');

const leerEjecutada = (nombre) => {
  const p = path.join(DIR_EJECUTADAS, nombre, 'SKILL.md');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
};

// OJO: nunca leas el contenido por la salida de PowerShell. La consola de
// Windows destroza los acentos y las rayas largas, y dos archivos identicos
// parecen distintos. Se extrae a un archivo temporal y se lee con Node.
const leerPaquete = (nombre) => {
  const p = path.join(DIR_PAQUETES, `${nombre}.skill`);
  if (!fs.existsSync(p)) return null;

  const tmp = path.join(os.tmpdir(), `skill-sync-${process.pid}-${nombre}.md`);
  const q = (s) => s.replace(/'/g, "''");
  try {
    execFileSync('powershell', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
      `Add-Type -AssemblyName System.IO.Compression.FileSystem;` +
      `$z=[System.IO.Compression.ZipFile]::OpenRead('${q(p)}');` +
      `$e=$z.Entries | Where-Object { $_.FullName -like '*SKILL.md' } | Select-Object -First 1;` +
      `[System.IO.Compression.ZipFileExtensions]::ExtractToFile($e,'${q(tmp)}',$true);` +
      `$z.Dispose()`,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    const contenido = fs.readFileSync(tmp, 'utf8');
    fs.unlinkSync(tmp);
    return contenido;
  } catch {
    try { fs.unlinkSync(tmp); } catch {}
    return null;
  }
};

/** Nombres de skill vistos en cualquiera de los dos lados. */
function nombres() {
  const s = new Set();
  if (fs.existsSync(DIR_EJECUTADAS)) {
    for (const d of fs.readdirSync(DIR_EJECUTADAS, { withFileTypes: true })) {
      if (d.isDirectory() && fs.existsSync(path.join(DIR_EJECUTADAS, d.name, 'SKILL.md'))) s.add(d.name);
    }
  }
  if (fs.existsSync(DIR_PAQUETES)) {
    for (const f of fs.readdirSync(DIR_PAQUETES)) {
      if (f.endsWith('.skill')) s.add(f.replace(/\.skill$/, ''));
    }
  }
  return [...s].sort();
}

const norm = (s) => (s == null ? null : s.replace(/\r\n/g, '\n').trimEnd());

export function revisar() {
  const filas = [];
  for (const n of nombres()) {
    const eje = norm(leerEjecutada(n));
    const paq = norm(leerPaquete(n));
    let estado;
    if (eje && paq) estado = eje === paq ? 'ok' : 'desfase';
    else if (eje) estado = 'solo-ejecutada';
    else estado = 'solo-paquete';
    filas.push({ nombre: n, estado, bytesEjecutada: eje?.length ?? null, bytesPaquete: paq?.length ?? null });
  }
  return filas;
}

function empaquetar(nombre) {
  const origen = path.join(DIR_EJECUTADAS, nombre, 'SKILL.md');
  const destino = path.join(DIR_PAQUETES, `${nombre}.skill`);
  execFileSync('powershell', [
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
    `Add-Type -AssemblyName System.IO.Compression.FileSystem;` +
    `if (Test-Path '${destino.replace(/'/g, "''")}') { Remove-Item '${destino.replace(/'/g, "''")}' -Force };` +
    `$z=[System.IO.Compression.ZipFile]::Open('${destino.replace(/'/g, "''")}','Create');` +
    `[void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($z,'${origen.replace(/'/g, "''")}','${nombre}/SKILL.md');` +
    `$z.Dispose()`,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
}

function desempaquetar(nombre) {
  const contenido = leerPaquete(nombre);
  if (contenido == null) throw new Error(`no pude leer el paquete de ${nombre}`);
  const dir = path.join(DIR_EJECUTADAS, nombre);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), contenido, 'utf8');
}

if (process.argv[1] && process.argv[1].endsWith('skills-sync.js')) {
  const args = process.argv.slice(2);
  const filas = revisar();

  console.log('\n=== Skills: lo que se ejecuta vs lo que se distribuye ===\n');
  console.log('  .claude/skills/<n>/SKILL.md  es lo que Claude Code corre');
  console.log('  skills/<n>.skill             es solo el paquete para repartir\n');

  for (const f of filas) {
    const marca = { ok: 'OK      ', desfase: 'DESFASE ', 'solo-ejecutada': 'sin-paq ', 'solo-paquete': 'sin-ejec' }[f.estado];
    let detalle = '';
    if (f.estado === 'desfase') detalle = `ejecutada ${f.bytesEjecutada} bytes vs paquete ${f.bytesPaquete} bytes`;
    else if (f.estado === 'solo-paquete') detalle = 'existe el .skill pero no esta instalada en .claude/skills';
    else if (f.estado === 'solo-ejecutada') detalle = 'esta instalada pero no hay .skill para distribuir';
    console.log(`  ${marca} ${f.nombre.padEnd(32)} ${detalle}`);
  }

  const desfasadas = filas.filter((f) => f.estado === 'desfase');

  if (args.includes('--empaquetar')) {
    console.log('');
    for (const f of filas.filter((x) => x.bytesEjecutada != null)) {
      empaquetar(f.nombre);
      console.log(`  empaquetada  ${f.nombre}  ->  skills/${f.nombre}.skill`);
    }
    console.log('');
  } else if (args.includes('--desempaquetar')) {
    console.log('');
    for (const f of filas.filter((x) => x.bytesPaquete != null)) {
      desempaquetar(f.nombre);
      console.log(`  instalada    skills/${f.nombre}.skill  ->  .claude/skills/${f.nombre}/SKILL.md`);
    }
    console.log('');
  } else if (desfasadas.length) {
    console.log('\n  Hay desfase. Lo que se ejecuta NO es lo que vas a repartir.');
    console.log('  Si lo bueno es lo que se ejecuta:   node produccion/skills-sync.js --empaquetar');
    console.log('  Si lo bueno es el paquete:          node produccion/skills-sync.js --desempaquetar\n');
    process.exitCode = 1;
  } else {
    console.log('\n  Todo alineado.\n');
  }
}
