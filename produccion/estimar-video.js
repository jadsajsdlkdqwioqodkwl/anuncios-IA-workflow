// Estima lo que cuesta generar los videos de un anuncio, antes de gastar nada.
// Lo usa generar-videos.js en la Fase 2.3 para la pantalla de confirmacion.
//
//   node produccion/estimar-video.js temp/mi-anuncio
//   node produccion/estimar-video.js temp/mi-anuncio --resolucion 1080p
//   node produccion/estimar-video.js temp/mi-anuncio --comparar

import fs from 'node:fs';
import path from 'node:path';
import {
  MODELOS,
  MODELOS_VIDEO,
  RESOLUCION_VIDEO,
  PRECIOS,
  KIE,
  ESTILOS_HABLADOS,
  MODELO_VIDEO_BROLL_POR_ESTILO,
  creditosAUsd,
  creditosClip,
  resolucionPara,
} from './config.js';
import { tieneContinuidad, cadenaDeClips, proponerDuraciones } from './continuidad.js';

/**
 * Lista plana de clips: cada toma y cada B-roll es un clip.
 *
 * Con continuidad, la cadena (cadenaDeClips): un paso por toma salvo la
 * ultima, el propio de cada B y el cierre, sin B-roll. Lo que todavia no esta
 * escrito se estima (con `tiempos`, lo que propondria --duraciones; sin
 * tiempos, la duracion de cada toma) y va con estimado: true.
 *
 * En los estilos hablados (podcast, entrevista; ESTILOS_HABLADOS) el B-roll
 * no se genera con el modelo principal sino con el de
 * MODELO_VIDEO_BROLL_POR_ESTILO (Kling, por segundo, sin audio): ese clip
 * lleva su `modelo`. Los demas estilos no traen ese campo y se estiman como
 * siempre.
 */
export function clipsDe(manifiesto, { tiempos = null } = {}) {
  if (tieneContinuidad(manifiesto)) {
    return cadenaDeClips(manifiesto, { estimar: true, tiempos }).map((c) => ({
      id: c.id,
      segundos: c.segundos,
      tipo: c.rol === 'paso' ? 'paso' : c.tipoToma,
      rol: c.rol,
      ...(c.estimado ? { estimado: true } : {}),
    }));
  }
  const modeloBroll = ESTILOS_HABLADOS.includes(manifiesto.estilo) ? MODELO_VIDEO_BROLL_POR_ESTILO[manifiesto.estilo] : null;
  const clips = [];
  for (const t of manifiesto.tomas || []) {
    clips.push({ id: `toma-${t.n}`, segundos: t.duracion, tipo: t.tipo });
  }
  for (const b of manifiesto.broll || []) {
    clips.push({ id: `broll-${b.n}`, segundos: b.duracion, tipo: 'broll', ...(modeloBroll ? { modelo: modeloBroll } : {}) });
  }
  return clips;
}

export function estimar(manifiesto, { modelo = MODELOS.video.principal, resolucion = RESOLUCION_VIDEO, tiempos = null } = {}) {
  const clips = clipsDe(manifiesto, { tiempos });
  const detalle = [];
  let creditos = 0;
  let segundosPedidos = 0;
  let segundosUtiles = 0;
  const excedidos = [];

  for (const c of clips) {
    // Un clip con modelo propio (el B-roll de los estilos hablados) se cobra
    // con ese modelo; el resto, con el de la estimacion.
    const r = creditosClip(c.modelo ?? modelo, c.segundos, resolucion);
    if (r.excedeTope) {
      excedidos.push(c);
      continue;
    }
    creditos += r.creditos;
    segundosPedidos += r.duracion;
    segundosUtiles += c.segundos;
    detalle.push({ ...c, ...r });
  }

  const res = resolucionPara(modelo, resolucion);
  return {
    modelo,
    resolucionPedida: resolucion,
    resolucionReal: res.nombre,
    resolucionApi: res.api,
    resolucionExacta: res.exacta,
    clips: detalle.length,
    creditos,
    usd: creditosAUsd(creditos),
    segundosPedidos,
    segundosUtiles,
    excedidos,
    detalle,
    // Solo con continuidad: si algun clip de la cadena salio estimado.
    ...(tieneContinuidad(manifiesto) ? { estimado: clips.some((c) => c.estimado) } : {}),
  };
}

if (process.argv[1] && process.argv[1].endsWith('estimar-video.js')) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  const i = args.indexOf('--resolucion');
  const resolucion = i !== -1 && args[i + 1] ? args[i + 1] : RESOLUCION_VIDEO;
  const comparar = args.includes('--comparar');

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/estimar-video.js <carpeta-del-anuncio> [--resolucion 720p] [--comparar]\n');
    process.exit(1);
  }

  const rutaManifiesto = path.join(path.resolve(carpetaArg), 'manifiesto.json');
  if (!fs.existsSync(rutaManifiesto)) {
    console.error(`\n  No encuentro el manifiesto: ${rutaManifiesto}\n`);
    process.exit(1);
  }
  const m = JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8'));

  // Con continuidad, lo que falta por escribir se estima con los tiempos
  // reales de la voz, si ya estan.
  const conContinuidad = tieneContinuidad(m);
  let tiempos = null;
  if (conContinuidad) {
    try {
      const rutaTiempos = path.join(path.resolve(carpetaArg), 'audio', 'tiempos.json');
      if (fs.existsSync(rutaTiempos)) tiempos = JSON.parse(fs.readFileSync(rutaTiempos, 'utf8'));
      // Unos tiempos que no van 1 a 1 con las tomas no sirven para estimar:
      // cadenaDeClips estima entonces con la duracion de cada toma.
      if (tiempos) proponerDuraciones(m, tiempos);
    } catch {
      tiempos = null;
    }
  }

  const e = estimar(m, { resolucion, tiempos });

  console.log(`\n=== Costo de los videos — ${path.basename(path.resolve(carpetaArg))} ===\n`);
  console.log(`  Modelo:      ${e.modelo}`);
  console.log(`  Resolucion:  ${e.resolucionReal}${e.resolucionExacta ? '' : `  (el modelo no ofrece ${e.resolucionPedida}; se usa la mas cercana)`}`);
  if (conContinuidad) {
    const n = (rol) => e.detalle.filter((d) => d.rol === rol).length;
    const pasos = n('paso');
    const propios = n('propio');
    console.log(
      `  Clips:       ${e.clips} (${pasos} paso${pasos === 1 ? '' : 's'} + ${propios} propio${propios === 1 ? '' : 's'} B + ${n('cierre')} cierre), con continuidad: sin B-roll`
    );
    if (e.estimado) {
      console.log(
        tiempos
          ? '               (estimado: lo que falta por escribir se calculo con los tiempos de la voz, como lo haria --duraciones)'
          : '               (estimado: lo que falta por escribir se calculo con la duracion de cada toma; se fija despues de imagenes y audio)'
      );
    }
    console.log('');
  } else {
    console.log(`  Clips:       ${e.clips}\n`);
  }

  const hablado = ESTILOS_HABLADOS.includes(m.estilo);
  if (hablado) {
    // Estilo hablado: las tomas H van con el modelo principal (por tramo) y el
    // B-roll con el suyo (Kling, por segundo, sin audio): una tabla por modelo.
    const porModelo = new Map();
    for (const d of e.detalle) {
      const modelo = d.modelo ?? e.modelo;
      if (!porModelo.has(modelo)) porModelo.set(modelo, {});
      const tramos = porModelo.get(modelo);
      tramos[d.duracion] = (tramos[d.duracion] || 0) + 1;
    }
    for (const [modelo, porTramo] of porModelo) {
      const def = MODELOS_VIDEO[modelo];
      const res = resolucionPara(modelo, e.resolucionPedida).nombre;
      const etiqueta = modelo === e.modelo ? 'tomas habladas (H)' : 'B-roll, sin audio';
      console.log(`  ${modelo} a ${res} — ${etiqueta}`);
      console.log('  Tramo   clips   creditos c/u   subtotal');
      for (const tramo of Object.keys(porTramo).sort((a, b) => a - b)) {
        const n = porTramo[tramo];
        const cu = def.cobro === 'por-segundo' ? def.precio[res] * tramo : def.precio[res][tramo];
        console.log(`   ${String(tramo).padStart(2)}s     ${String(n).padStart(3)}      ${String(cu).padStart(4)}        ${String(n * cu).padStart(5)}`);
      }
      console.log('');
    }
  } else {
    // Cuantos clips caen en cada tramo de duracion
    const porTramo = {};
    for (const d of e.detalle) porTramo[d.duracion] = (porTramo[d.duracion] || 0) + 1;
    const def = MODELOS_VIDEO[e.modelo];
    console.log('  Tramo   clips   creditos c/u   subtotal');
    for (const tramo of Object.keys(porTramo).sort((a, b) => a - b)) {
      const n = porTramo[tramo];
      const cu = def.cobro === 'por-segundo' ? def.precio[e.resolucionReal] * tramo : def.precio[e.resolucionReal][tramo];
      console.log(`   ${String(tramo).padStart(2)}s     ${String(n).padStart(3)}      ${String(cu).padStart(4)}        ${String(n * cu).padStart(5)}`);
    }
  }

  console.log(`${hablado ? '' : '\n'}  TOTAL:  ${e.creditos} creditos = US$${e.usd.toFixed(2)}`);
  console.log(`  Metraje: se pagan ${e.segundosPedidos}s para cubrir ${e.segundosUtiles.toFixed(1)}s utiles`);

  if (e.excedidos.length) {
    console.log(`\n  ATENCION: ${e.excedidos.length} clip(s) pasan del tope del modelo y hay que dividirlos:`);
    for (const c of e.excedidos) console.log(`      ${c.id} (${c.segundos}s)`);
  }

  if (comparar) {
    console.log('\n  --- comparacion de resoluciones ---');
    for (const r of Object.keys(MODELOS_VIDEO[e.modelo].resoluciones)) {
      const alt = estimar(m, { resolucion: r, tiempos });
      const marca = r.toLowerCase() === e.resolucionReal.toLowerCase() ? '  <- elegida' : '';
      console.log(`    ${r.padEnd(7)} ${String(alt.creditos).padStart(5)} creditos = US$${alt.usd.toFixed(2)}${marca}`);
    }
    if (hablado) {
      // Las tomas H no tienen respaldo (Kling no genera dialogo): si Omni
      // falla, se reintenta o se reescribe el copy de esa toma.
      console.log('\n  --- respaldo ---');
      console.log(`    las tomas habladas (H) no tienen modelo de respaldo: solo ${e.modelo}`);
    } else {
      console.log('\n  --- respaldo ---');
      const resp = estimar(m, { modelo: MODELOS.video.respaldo, resolucion, tiempos });
      console.log(`    ${resp.modelo} a ${resp.resolucionReal}: ${resp.creditos} creditos = US$${resp.usd.toFixed(2)}`);
      console.log('    (solo se paga por los clips que fallen con el principal)');
    }
  }

  console.log(`\n  Precios consultados el ${PRECIOS.consultado} en ${KIE.precios}\n`);
}
