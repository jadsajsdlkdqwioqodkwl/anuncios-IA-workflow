// FASE 2.3 — los clips de video a partir de las imagenes ya generadas.
//
//   node produccion/generar-videos.js temp/mi-anuncio                 todo
//   node produccion/generar-videos.js temp/mi-anuncio --tomas 1,10    solo esas
//   node produccion/generar-videos.js temp/mi-anuncio --solo-plan     muestra el plan, no escribe la cola ni toca nada
//   node produccion/generar-videos.js temp/mi-anuncio --rehacer       vuelve a pedir lo hecho (lo anterior va a historial/; una sola vez)
//   node produccion/generar-videos.js temp/mi-anuncio --ganchos       suma los ganchos alternativos
//   node produccion/generar-videos.js temp/mi-anuncio --pasos 19,20   solo esos pasos (continuidad)
//
// ESTA COPIA USA GOOGLE FLOW (ver flow/flow.js). El CLI ya no llama a kie.ai:
// arma el plan como siempre (construirPlan, la cadena de continuidad, los
// lugares de los bloques R, "ya existe = hecho", --rehacer) y escribe la lista
// de trabajo flow/cola-videos.json, un TrabajoFlow por clip pendiente: modo
// (fotogramas, ingredientes o texto), sus imagenes en orden, la duracion de
// Flow y el prompt exacto que se mandaba a kie. Lo que todavia no se puede
// pedir (falta una imagen, o un lugar cuyo bloque de origen no esta) va a
// "bloqueados". Claude genera la cola en Flow, "npm run flow:recibir" deja cada
// clip en video/ y se vuelve a correr este comando hasta que no quede nada.
// No se cobra ni se pregunta nada aqui (--si se acepta y no hace nada) y
// video/log-modelos.json no se toca (lo escribe flow:recibir). El usuario
// aprueba los creditos en el chat DESPUES de esta corrida, asi que al armar la
// cola solo se MUEVE a historial/ lo que deja de valer (con --rehacer, el clip
// anterior; su recorte de cola; el fotograma de un lugar cuyo origen se vuelve
// a pedir) y se dice como devolverlo; --solo-plan muestra cola, creditos y lo
// que se moveria sin tocar nada. Lo que salio de una toma H (sacarDerivadosDeTomaH)
// lo saca flow:recibir cuando llega el clip nuevo. --rehacer va una sola vez:
// repetido despues de recibir, volveria a pedir lo que acaba de llegar. El codigo de
// kie (generarConCascada, generarBloqueR, ejecutarR) queda abajo pero no corre.
// Lo que sigue describe el motor de kie: en Flow vale el plan, no los modelos.
//
// Continuidad (solo si el manifiesto trae el bloque "continuidad", ver
// continuidad.js): los clips son la cadena — un paso por toma salvo la ultima
// (video/paso-<de>.mp4, de la imagen de una toma a la de la siguiente), el
// clip propio de cada toma B y el cierre (video/toma-<N>.mp4 de la ultima).
// Sin B-roll. --tomas K pide todo lo que toca las imagenes de K (el paso que
// llega, el propio o el cierre de K y el paso que sale); --pasos K, solo ese
// paso. --duracion no se usa: cada largo sale de los tiempos de la voz.
//
// Anuncios por bloques (UGC, tomas tipo R): cada bloque se pide a flash-1-1 SOLO
// con referencias (la hoja del personaje y la foto del producto, en orden, como
// image_urls), sin frames y sin modelo de respaldo. Los "ganchos_alternativos"
// del manifiesto son opcionales: solo se generan con --ganchos, como
// video/gancho-<id>.mp4. Ver generarBloqueR(), abajo.
//
// Lugar repetido (tambien solo R): si un bloque vuelve a un lugar que ya salio
// en otro, lleva como referencia un fotograma de ese otro bloque
// ({ "tipo": "lugar", "de_toma": N, "segundo": S }). El motor lo saca con
// ffmpeg (gratis) a img/<id>.png y genera por pasadas: primero los bloques
// cuyas referencias ya existen, despues los que esperaban ese fotograma. Ver
// ordenarPorLugares() y ejecutarR(), abajo.
//
// Sobre el audio: los clips del modelo principal llegan CON ambiente y efectos
// nativos, sin voces. No se pide ni se apaga por parametro — sale asi. En el
// montaje ese audio se mezcla por debajo de la voz en off (COMO-PRODUCIR.md, seccion 2).
// El modelo de respaldo (Kling) va con sound: false por decision: su interruptor
// no permite excluir voces y una voz chocaria con la narracion.
//
// Estilos hablados (podcast y entrevista, tomas tipo H; su flujo esta en
// COMO-PRODUCIR.md, seccion 12): una toma H va SIN Kling de
// respaldo (no genera el dialogo), y se pide de una de dos maneras:
//
//   - con frame inicial, como una A: img/toma-N-inicial.png como
//     first_frame_url, sin frame final y sin referencias (el podcast, y una
//     toma de entrevista sin "ingredientes": manifiestos de antes);
//   - por INGREDIENTES (entrevista, 2026-10-14): "tomas[].ingredientes" en
//     orden, como image_urls, por el mismo camino que un bloque R
//     (generarBloqueR). "imagen" es img/toma-N-inicial.png (la imagen del
//     clip, imagen 1, que el prompt pide como frame inicial) y el resto son
//     referencias (en B la mano con el microfono y, si sale, el producto).
//     Mismo modelo y mismo precio. Ver rutasDeIngredientes().
//
// Si Omni falla se lee el fallo como en los bloques R (clasificarFalloR):
// error del servidor -> esperar y volver a correr sin cambiar nada; rechazo de
// contenido -> parar y reescribir el copy de esa toma (errorTomaH). Al
// generar una toma H, lo que se saco de su clip anterior (el original de la
// voz en off y el host recortado) va a historial/, y su medida de
// lineas-habladas.json se quita (sacarDerivadosDeTomaH): el clip nuevo se
// mide otra vez con `npm run lineas` (al final se dice con que tomas). El
// B-roll de estos estilos va a Kling (MODELO_VIDEO_BROLL_POR_ESTILO), mudo
// (SONIDO_BROLL_POR_ESTILO: 14 cr/s en vez de 20), con la duracion entera que
// pide el manifiesto (3 a 15 s). Fuera de estos estilos ningun trabajo cambia.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  MODELOS,
  MODELOS_VIDEO,
  RESOLUCION_VIDEO,
  CONCURRENCIA_VIDEO,
  TIMEOUT_VIDEO_MS,
  MODELO_VIDEO_UGC,
  ESTILOS_HABLADOS,
  ESTILOS_SIN_RESPALDO_VIDEO,
  MODELO_VIDEO_BROLL_POR_ESTILO,
  SONIDO_BROLL_POR_ESTILO,
  INGREDIENTE_IMAGEN,
  creditosClip,
  cargarEnv,
} from './config.js';
// Solo lo usa el camino de kie (generarConCascada, generarBloqueR), que en esta copia no corre.
import { generarVideo, subirArchivo } from './kie-client.js';
import { FLOW, duracionFlow, nombreDescarga, escribirCola, imprimirCola } from './flow/flow.js';
import { validarManifiesto } from './validar-manifiesto.js';
import {
  tomaDelBroll,
  listaDeReferencias,
  esGenerada,
  esAportada,
  esLugarDeToma,
  archivoDeHoja,
  archivoDeIngrediente,
} from './referencias.js';
import { archivarSiExiste } from './historial.js';
import { tieneContinuidad, cadenaDeClips, filtrarCadena, textoCuenta, avisosDeLargo } from './continuidad.js';

const REINTENTOS = 3;

/**
 * Bloques R: cuanto se espera entre un intento y el siguiente cuando Omni falla
 * por el SERVIDOR (500, caida, timeout, sobrecarga). Antes del 2.o intento 30 s,
 * antes del 3.o 60 s. El 2026-10-04 Omni estuvo caido ~1 hora (13 fallos "500
 * Internal Error, Please try again later.", sin cobro): reintentar al instante
 * no sirve. Un rechazo de CONTENIDO no se reintenta (el mismo prompt falla igual).
 */
export const ESPERAS_SERVIDOR_MS = [30000, 60000];

// ---------------------------------------------------------------- plan

/** Un trabajo de bloque R (toma o gancho): sin imagenes propias, solo referencias. */
function trabajoR(b, extra) {
  return {
    ...extra,
    tipo: 'R',
    prompt: b.prompt_video,
    segundos: b.duracion,
    imagenInicial: null,
    imagenFinal: null,
    referencias: [...(b.referencias || [])],
  };
}

/**
 * Continuidad: los trabajos son la cadena de clips (cadenaDeClips), en orden.
 * Cada uno con clase 'paso' o 'toma' (el propio de una B y el cierre son
 * video/toma-<n>.mp4, como hoy) y su rol. Sin B-roll ni ganchos.
 *
 *   soloTomas [K]  todo lo que toca las imagenes de K: paso-(anterior), toma-K
 *                  si es B o la ultima, y paso-K.
 *   soloPasos [K]  solo paso-K.
 *
 * El prompt del propio con duracion_propio y el del cierre ya vienen con el
 * numero de su cabecera ajustado al largo que se pide (ajustarCabecera).
 */
export function planContinuidad(m, { soloTomas = null, soloPasos = null } = {}) {
  return filtrarCadena(cadenaDeClips(m), { soloTomas, soloPasos }).map((c) => ({
    id: c.id,
    clase: c.rol === 'paso' ? 'paso' : 'toma',
    rol: c.rol,
    n: c.linea,
    tipo: c.rol === 'paso' ? 'paso' : c.tipoToma,
    archivo: c.archivo,
    prompt: c.prompt,
    segundos: c.segundos,
    imagenInicial: c.imagenInicial,
    imagenFinal: c.imagenFinal,
    deToma: c.deToma,
    aToma: c.aToma,
    descripcion:
      c.rol === 'paso'
        ? `paso ${c.deToma}->${c.aToma} ${c.segundos}s`
        : `toma ${c.linea} (${c.tipoToma}, ${c.rol}) ${c.segundos}s`,
  }));
}

/**
 * Un clip por toma y uno por B-roll, con las imagenes que necesita cada uno.
 * Con `ganchos: true`, ademas uno por gancho alternativo (solo bloques R).
 * Con continuidad, la cadena (ver planContinuidad).
 */
export function construirPlan(m, { soloTomas, ganchos = false, soloPasos = null } = {}) {
  if (tieneContinuidad(m)) return planContinuidad(m, { soloTomas, soloPasos });
  const trabajos = [];

  // Estilos hablados (podcast, entrevista): la toma H va a Omni sin respaldo
  // (ESTILOS_SIN_RESPALDO_VIDEO) y el B-roll a Kling, mudo. Fuera de estos
  // estilos ninguno de estos campos se escribe y los trabajos salen iguales.
  const hablado = ESTILOS_HABLADOS.includes(m.estilo);
  const sinRespaldoH = ESTILOS_SIN_RESPALDO_VIDEO.includes(m.estilo);
  const modeloBroll = hablado ? MODELO_VIDEO_BROLL_POR_ESTILO[m.estilo] ?? MODELOS.video.principal : null;
  const sonidoBroll = hablado && typeof SONIDO_BROLL_POR_ESTILO[m.estilo] === 'boolean' ? SONIDO_BROLL_POR_ESTILO[m.estilo] : undefined;

  const tomas = soloTomas ? m.tomas.filter((t) => soloTomas.includes(t.n)) : m.tomas;
  for (const t of tomas) {
    if (t.tipo === 'R') {
      // Bloque UGC: no hay frame inicial ni final que buscar en img/.
      trabajos.push(
        trabajoR(t, { id: `toma-${t.n}`, clase: 'toma', n: t.n, archivo: `toma-${t.n}.mp4`, descripcion: `toma ${t.n} (R) ${t.duracion}s` })
      );
      continue;
    }
    if (t.tipo === 'H' && Array.isArray(t.ingredientes) && t.ingredientes.length) {
      // Toma hablada por INGREDIENTES (entrevista): va a generarBloqueR con
      // los ingredientes como image_urls, en su orden ("imagen" = la imagen
      // del clip). imagenInicial queda para comprobar que exista y para
      // mostrarla; al modelo no va como first_frame_url.
      trabajos.push({
        id: `toma-${t.n}`,
        clase: 'toma',
        n: t.n,
        tipo: 'H',
        porIngredientes: true,
        archivo: `toma-${t.n}.mp4`,
        prompt: t.prompt_video,
        segundos: t.duracion,
        imagenInicial: `toma-${t.n}-inicial.png`,
        imagenFinal: null,
        referencias: [...t.ingredientes],
        descripcion: `toma ${t.n} (H, por ingredientes) ${t.duracion}s`,
        cascada: [MODELO_VIDEO_UGC],
      });
      continue;
    }
    trabajos.push({
      id: `toma-${t.n}`,
      clase: 'toma',
      n: t.n,
      tipo: t.tipo,
      archivo: `toma-${t.n}.mp4`,
      prompt: t.prompt_video,
      segundos: t.duracion,
      imagenInicial: `toma-${t.n}-inicial.png`,
      // Solo las Tipo B llevan frame de cierre.
      imagenFinal: t.tipo === 'B' ? `toma-${t.n}-final.png` : null,
      descripcion: `toma ${t.n} (${t.tipo}) ${t.duracion}s`,
      // Toma hablada: solo Omni (Kling no genera el dialogo). Sin esta clave,
      // generarConCascada usa la cascada de siempre.
      ...(t.tipo === 'H' && sinRespaldoH ? { cascada: [MODELOS.video.principal] } : {}),
    });
  }

  const brolls = soloTomas ? (m.broll || []).filter((b) => soloTomas.includes(tomaDelBroll(b))) : m.broll || [];
  for (const b of brolls) {
    trabajos.push({
      id: `broll-${b.n}`,
      clase: 'broll',
      n: b.n,
      tipo: 'broll',
      archivo: `broll-${b.n}.mp4`,
      prompt: b.prompt_video,
      segundos: b.duracion,
      imagenInicial: `broll-${b.n}.png`,
      imagenFinal: null,
      // (Sin el nombre del modelo: en esta copia el B-roll va a Flow, ver trabajoFlow.)
      descripcion: `B-roll ${b.n} ${b.duracion}s${hablado ? ' (mudo)' : ''}`,
      // B-roll de un estilo hablado: Kling, mudo, con la duracion entera que
      // pide el manifiesto (el validador la acota a 3-15 s).
      ...(hablado ? { cascada: [modeloBroll], ...(sonidoBroll !== undefined ? { sonido: sonidoBroll } : {}) } : {}),
    });
  }

  // Ganchos alternativos: otras versiones del bloque que reemplazan, para
  // testear en Meta. Opcionales: solo entran si se piden (--ganchos). Con
  // --tomas, solo los que reemplazan a una de esas tomas.
  if (ganchos && Array.isArray(m.ganchos_alternativos)) {
    const lista = soloTomas ? m.ganchos_alternativos.filter((g) => soloTomas.includes(g.reemplaza)) : m.ganchos_alternativos;
    for (const g of lista) {
      trabajos.push(
        trabajoR(g, {
          id: `gancho-${g.id}`,
          clase: 'gancho',
          n: g.reemplaza,
          gancho: g.id,
          archivo: `gancho-${g.id}.mp4`,
          descripcion: `gancho ${g.id} (R, reemplaza la toma ${g.reemplaza}) ${g.duracion}s`,
        })
      );
    }
  }

  return trabajos;
}

/**
 * Rutas en disco de las referencias de un bloque R, EN EL ORDEN de la toma:
 * ese orden es el "Imagen 1, Imagen 2" que nombra el prompt.
 *
 * Una referencia con prompt es una hoja generada (img/<id>.png, tambien la
 * generada a partir de una foto); una con solo archivo es la foto que aporto
 * el usuario, en la carpeta del anuncio. Un lugar con "de_toma" es el
 * fotograma que el motor saca de ese bloque, tambien en img/<id>.png.
 */
export function rutasDeReferencias(m, carpeta, ids) {
  const lista = listaDeReferencias(m);
  return ids.map((id) => {
    const r = lista.find((x) => x.id === id);
    if (r && esLugarDeToma(r)) {
      return { id, ruta: path.join(carpeta, 'img', archivoDeHoja(r)), como: 'fotograma de lugar', deToma: r.de_toma, segundo: r.segundo };
    }
    if (r && esGenerada(r)) return { id, ruta: path.join(carpeta, 'img', archivoDeHoja(r)), como: 'hoja generada' };
    if (r && esAportada(r)) return { id, ruta: path.join(carpeta, r.archivo), como: 'foto aportada' };
    return { id, ruta: null, como: 'no esta en la lista de referencias' };
  });
}

/**
 * Rutas en disco de los INGREDIENTES de una toma H de la entrevista, EN SU
 * ORDEN: ese orden es el "(imagen 1)", "(imagen 2)" que nombra el prompt.
 * "imagen" es la imagen del clip, img/toma-N-inicial.png (la genera
 * generar-imagenes.js como siempre); cualquier otro id es su referencia, igual
 * que en rutasDeReferencias (la mano con el microfono, la foto del producto).
 */
export function rutasDeIngredientes(m, carpeta, n, ids) {
  return ids.map((id) =>
    id === INGREDIENTE_IMAGEN
      ? { id, ruta: path.join(carpeta, archivoDeIngrediente(m, n, id)), como: 'imagen del clip' }
      : rutasDeReferencias(m, carpeta, [id])[0]
  );
}

/**
 * Saca UN fotograma de un clip (ffmpeg, gratis) y lo guarda como PNG. Es la
 * referencia de un lugar repetido. Si `segundo` cae al final del clip (donde
 * ffmpeg ya no encuentra cuadro), se toma 0,1 s antes. Escribe a un temporal y
 * despues renombra: un fotograma a medio escribir nunca queda en img/.
 * Devuelve { ruta, segundo } con el segundo que se uso de verdad.
 */
export function sacarFotograma(rutaVideo, segundo, rutaDestino) {
  let s = Number(segundo);
  try {
    const dur = Number(
      // stderr callado: si el clip esta danado, el error que se muestra es el de ffmpeg (abajo).
      execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', rutaVideo], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
    );
    if (Number.isFinite(dur) && dur > 0) s = Math.min(s, Math.max(0, Number((dur - 0.1).toFixed(3))));
  } catch {
    // Sin ffprobe (o sin duracion legible) se intenta con el segundo tal cual.
  }
  fs.mkdirSync(path.dirname(rutaDestino), { recursive: true });
  const tmp = path.join(path.dirname(rutaDestino), `.${path.basename(rutaDestino, '.png')}.tmp.png`);
  try {
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(s), '-i', rutaVideo, '-frames:v', '1', tmp], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    const detalle = String(e.stderr || e.message || '').trim().split(/\r?\n/).slice(-2).join(' ');
    throw new Error(`no pude sacar el fotograma de ${path.basename(rutaVideo)} en el segundo ${s} (ffmpeg: ${detalle})`);
  }
  if (!fs.existsSync(tmp) || fs.statSync(tmp).size === 0) {
    fs.rmSync(tmp, { force: true });
    throw new Error(`ffmpeg no devolvio ningun cuadro de ${path.basename(rutaVideo)} en el segundo ${s}`);
  }
  fs.renameSync(tmp, rutaDestino);
  return { ruta: rutaDestino, segundo: s };
}

/**
 * Lugares repetidos de los bloques R de ESTE plan (ya filtrado: solo lo que se
 * va a generar). Para cada referencia de lugar decide de donde sale el
 * fotograma (r.estado) y, con eso, en que pasada va cada trabajo:
 *
 *   'ya-sacado'           img/<id>.png existe y su bloque de origen no se
 *                         regenera en esta corrida: se reusa.
 *   'se-saca-ahora'       no existe, el clip del bloque de origen si: se saca
 *                         antes de generar (gratis).
 *   'despues-del-origen'  el bloque de origen se genera en esta corrida: el
 *                         fotograma se saca de su clip NUEVO (si habia uno
 *                         anterior, va a historial/) y quien lo usa espera a
 *                         una pasada posterior.
 *   'falta-origen'        no existe, y el bloque de origen ni esta generado ni
 *                         entra en esta corrida (p. ej. --tomas 4 sin el 1).
 *
 * Marca t.dependeDe (los n de los bloques que tiene que esperar) y t.pasada.
 * Devuelve { pasadas: [[trabajos], ...], faltan: [{ trabajo, ref }] }. Sin
 * lugares, todo queda en una sola pasada, en el orden del plan.
 */
export function ordenarPorLugares(plan, carpeta) {
  const dirVideo = path.join(carpeta, 'video');
  const tomaEnPlan = new Map(plan.filter((t) => t.tipo === 'R' && t.clase === 'toma').map((t) => [t.n, t]));
  const faltan = [];
  for (const t of plan) {
    t.dependeDe = [];
    for (const r of t.rutasReferencias || []) {
      if (r.como !== 'fotograma de lugar') continue;
      r.habiaFotograma = Boolean(r.ruta) && fs.existsSync(r.ruta);
      if (tomaEnPlan.has(r.deToma)) {
        r.estado = 'despues-del-origen';
        if (!t.dependeDe.includes(r.deToma)) t.dependeDe.push(r.deToma);
      } else if (r.habiaFotograma) {
        r.estado = 'ya-sacado';
      } else if (fs.existsSync(path.join(dirVideo, `toma-${r.deToma}.mp4`))) {
        r.estado = 'se-saca-ahora';
      } else {
        r.estado = 'falta-origen';
        faltan.push({ trabajo: t, ref: r });
      }
    }
  }

  // Pasada = 1 + la mayor pasada de sus bloques de origen. El validador ya
  // descarta ciclos; el tope de profundidad es solo una red.
  const memo = new Map();
  const pasadaDe = (t, prof = 0) => {
    if (memo.has(t)) return memo.get(t);
    let p = 1;
    if (prof < 50) {
      for (const n of t.dependeDe) {
        const o = tomaEnPlan.get(n);
        if (o && o !== t) p = Math.max(p, 1 + pasadaDe(o, prof + 1));
      }
    }
    memo.set(t, p);
    return p;
  };
  const pasadas = [];
  for (const t of plan) {
    t.pasada = pasadaDe(t);
    (pasadas[t.pasada - 1] ||= []).push(t);
  }
  return { pasadas: pasadas.filter(Boolean), faltan };
}

// ---------------------------------------------------------------- generacion

/**
 * Toma hablada (H) que se vuelve a generar: lo que se saco de su clip
 * ANTERIOR ya no vale y va a historial/ (costo plata o tiempo: no se tira).
 *
 *   video/originales/toma-N.mp4 y .json   el clip crudo y su medida, que guarda
 *       recortar-voz.js (voz en off de la entrevista A) para partir siempre
 *       del original. Sin ellos, recortar-voz toma el clip nuevo como original.
 *       Van a historial/ como toma-N-original--<fecha>: con el nombre de
 *       siempre chocarian con el clip de video/, archivado en el mismo segundo.
 *   video/recorte-toma-N.webm y su entrada en recorte.json   el host recortado
 *       sin fondo (podcast en esquina, recortar-host.js). Sin la entrada, el
 *       plan vuelve a la ventana en la esquina y avisa que hay que recortar.
 *   su entrada en lineas-habladas.json   donde cae cada palabra, medido sobre
 *       el clip viejo (npm run lineas). Omni entrega los clips de una misma
 *       duracion con el mismo largo (10.005 s, 10.01 s), asi que comparar el
 *       largo no alcanza para darse cuenta de que es de otro clip: se quita, y
 *       el plan, el paso voz y la revision la ven como faltante ("corre npm run
 *       lineas") en vez de cortar el clip nuevo con los tiempos del viejo. No
 *       va a historial/ (se vuelve a medir sin costo de video).
 *
 * Lo llaman generarConCascada y generarBloqueR (solo con tomas H) y
 * rehacer-toma.js. Devuelve los nombres que quedaron en historial/, mas
 * "recorte.json (toma N)" y "lineas-habladas.json (toma N)" si se quito esa
 * entrada (ver entradaQuitada). Si no hay nada, [].
 */
export function sacarDerivadosDeTomaH(carpeta, n) {
  const sacados = [];
  const dirOrig = path.join(carpeta, 'video', 'originales');
  for (const ext of ['.mp4', '.json']) {
    const f = path.join(dirOrig, `toma-${n}${ext}`);
    if (!fs.existsSync(f)) continue;
    const conOtroNombre = path.join(dirOrig, `toma-${n}-original${ext}`);
    fs.renameSync(f, conOtroNombre);
    const guardado = archivarSiExiste(conOtroNombre, carpeta);
    if (guardado) sacados.push(path.basename(guardado));
  }
  const recorte = archivarSiExiste(path.join(carpeta, 'video', `recorte-toma-${n}.webm`), carpeta);
  if (recorte) sacados.push(path.basename(recorte));
  // Las entradas de esa toma en recorte.json y en lineas-habladas.json se
  // midieron sobre el clip viejo.
  for (const archivo of ['recorte.json', 'lineas-habladas.json']) {
    if (quitarEntradaDeToma(path.join(carpeta, archivo), n)) sacados.push(entradaQuitada(archivo, n));
  }
  return sacados;
}

/** Como nombra sacarDerivadosDeTomaH una entrada que quito de un json (no es un archivo de historial/). */
export const entradaQuitada = (archivo, n) => `${archivo} (toma ${n})`;

/**
 * Quita tomas["N"] de un json de la carpeta del anuncio (recorte.json,
 * lineas-habladas.json). true si la habia. Un archivo que no esta o no se
 * puede leer no frena nada: se deja como esta.
 */
function quitarEntradaDeToma(ruta, n) {
  if (!fs.existsSync(ruta)) return false;
  try {
    const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    if (!datos?.tomas || typeof datos.tomas !== 'object' || !(String(n) in datos.tomas)) return false;
    delete datos.tomas[String(n)];
    fs.writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n', 'utf8');
    return true;
  } catch {
    return false; // ilegible: queda como esta
  }
}

/**
 * Lo de sacarDerivadosDeTomaH, dicho en pocas lineas (o nada si no habia
 * nada): los archivos que fueron a historial/, la entrada de recorte.json y la
 * medida de lineas-habladas.json, con el comando para volver a medir.
 */
function avisarDerivadosSacados(sacados, n, carpetaArg) {
  const medida = entradaQuitada('lineas-habladas.json', n);
  const recorte = entradaQuitada('recorte.json', n);
  const aHistorial = sacados.filter((s) => s !== medida && s !== recorte);
  if (aHistorial.length) console.log(`      (lo que salio del clip anterior se guardo en historial/: ${aHistorial.join(', ')})`);
  if (sacados.includes(recorte)) console.log(`      (su host recortado era del clip anterior: se quito de recorte.json)`);
  if (sacados.includes(medida)) {
    console.log(`      (su medida de lineas-habladas.json era del clip anterior y se quito: midelo con npm run lineas -- ${carpetaArg} --tomas ${n})`);
  }
}

/**
 * UNICA EXCEPCION donde el motor toca un prompt.
 *
 * Los prompts los escribe la skill y el motor no los edita. Pero en
 * dialogo_nativo el video prompt empieza con "Duracion: Ns." y el parametro
 * `duration` de la API solo acepta 4, 6, 8 o 10. Cuando la duracion de la
 * escena se redondea hacia arriba (5.2s -> 6), el numero escrito adentro del
 * prompt y el parametro dejan de coincidir, y le estariamos mandando dos
 * duraciones distintas al mismo modelo en la misma llamada.
 *
 * Por eso, y solo por eso, se reescribe ese numero. Es un dato tecnico, no
 * contenido creativo. Ninguna otra parte del prompt se toca nunca.
 *
 * Acepta las formas que escriben las skills: "Duracion: 6s.", "Duración: 6 s",
 * "Duration: 6s." — con o sin tilde, con o sin espacio, en mayuscula o no.
 */
export function ajustarDuracionEnPrompt(prompt, segundosPedidos) {
  if (typeof prompt !== 'string') return { prompt, cambiado: false };
  const re = /(Duraci[oó]n|Duration)(\s*:\s*)(\d+(?:[.,]\d+)?)(\s*s)/i;
  const m = prompt.match(re);
  if (!m) return { prompt, cambiado: false };
  const escrito = Number(String(m[3]).replace(',', '.'));
  if (escrito === segundosPedidos) return { prompt, cambiado: false };
  return {
    prompt: prompt.replace(re, `$1$2${segundosPedidos}$4`),
    cambiado: true,
    antes: escrito,
    despues: segundosPedidos,
  };
}


/**
 * Genera un clip a partir de sus imagenes, con reintentos y cascada de modelos.
 *
 * La cascada es la de siempre (principal y respaldo) salvo que el trabajo
 * traiga la suya (`trabajo.cascada`: las tomas H y el B-roll de los estilos
 * hablados, ver construirPlan). `trabajo.sonido` (true/false), si viene, se
 * pasa tal cual a generarVideo (solo lo lee el adaptador de Kling).
 *
 * Toma H (tipo 'H'): cada fallo se lee como en los bloques R
 * (clasificarFalloR): un rechazo de contenido no se reintenta (el mismo
 * prompt falla igual) y un error del servidor espera ESPERAS_SERVIDOR_MS entre
 * intentos. Si se agotan, el error dice que hacer (errorTomaH). Las demas
 * tomas siguen con los reintentos y el mensaje de siempre.
 */
async function generarConCascada(trabajo, ctx, log) {
  const destino = path.join(ctx.dirVideo, trabajo.archivo);
  // Con --rehacer, el clip anterior se archiva en vez de perderse.
  const archivado = archivarSiExiste(destino, ctx.carpeta);
  if (archivado) console.log(`      (el clip anterior se guardo en historial/${path.basename(archivado)})`);
  const cascada = Array.isArray(trabajo.cascada) && trabajo.cascada.length ? trabajo.cascada : [MODELOS.video.principal, MODELOS.video.respaldo];
  const fallos = [];
  // Toma hablada: los errores enteros (failCode / failMsg), para clasificarlos.
  const esH = trabajo.tipo === 'H';
  const erroresH = [];
  // Toma hablada: el original de la voz y el host recortado salieron del clip anterior.
  if (esH && trabajo.clase === 'toma') avisarDerivadosSacados(sacarDerivadosDeTomaH(ctx.carpeta, trabajo.n), trabajo.n, ctx.carpetaArg);

  // Las imagenes se suben una sola vez y la URL queda cacheada.
  const urlInicial = await subirArchivo(path.join(ctx.dirImg, trabajo.imagenInicial));
  const urlFinal = trabajo.imagenFinal ? await subirArchivo(path.join(ctx.dirImg, trabajo.imagenFinal)) : null;

  for (let nivel = 0; nivel < cascada.length; nivel++) {
    const modelo = cascada[nivel];
    const def = MODELOS_VIDEO[modelo];
    const { creditos, resolucion, duracion, excedeTope } = creditosClip(modelo, trabajo.segundos, RESOLUCION_VIDEO);

    if (excedeTope) {
      throw new Error(
        `${trabajo.descripcion} dura ${trabajo.segundos}s y pasa el tope de ${modelo}.\n` +
          '  Hay que dividirla en dos tomas en el manifiesto, no truncarla.'
      );
    }

    if (trabajo.imagenFinal && !def.frameFinal) {
      fallos.push(`${modelo} no acepta frame final`);
      continue;
    }

    if (nivel > 0) {
      console.log(`\n  ! ${trabajo.descripcion}: fallo ${REINTENTOS} veces con ${cascada[0]}.`);
      console.log(`    Motivo: ${fallos[fallos.length - 1]}`);
      console.log(`    Cambio al modelo de respaldo: ${modelo} (${resolucion.nombre}, ${duracion}s).`);
      console.log('    Puede haber diferencia visual con el resto de los clips.\n');
    }

    for (let intento = 1; intento <= REINTENTOS; intento++) {
      try {
        const ajuste = ajustarDuracionEnPrompt(trabajo.prompt, duracion);
        if (ajuste.cambiado && intento === 1 && nivel === 0) {
          console.log(`      (${trabajo.descripcion}: el prompt decia "Duracion: ${ajuste.antes}s" y el clip se pide de ${ajuste.despues}s; se ajusta el numero dentro del prompt para que no se contradigan)`);
        }

        const r = await generarVideo({
          modelo,
          prompt: ajuste.prompt,
          frameInicial: urlInicial,
          frameFinal: urlFinal,
          aspectRatio: ctx.aspectRatio,
          resolucionApi: resolucion.api,
          duracion,
          // Solo el B-roll de los estilos hablados lo trae (Kling mudo). Sin
          // el, generarVideo manda el cuerpo de siempre.
          ...(typeof trabajo.sonido === 'boolean' ? { sonido: trabajo.sonido } : {}),
          rutaDestino: destino,
          timeoutMs: TIMEOUT_VIDEO_MS,
        });

        log.push({
          id: trabajo.id,
          archivo: trabajo.archivo,
          modelo: r.modeloReal,
          respaldo: nivel > 0,
          intentos: intento,
          tipo: trabajo.tipo,
          segundosUtiles: trabajo.segundos,
          segundosPedidos: duracion,
          resolucion: resolucion.nombre,
          frameFinal: Boolean(urlFinal),
          creditos: r.creditos,
          taskId: r.taskId,
          ...(typeof trabajo.sonido === 'boolean' ? { sonido: trabajo.sonido } : {}),
          // Solo con continuidad: que papel tiene el clip en la cadena y, en
          // los pasos, de que imagen sale y a cual llega.
          ...(trabajo.rol ? { rol: trabajo.rol } : {}),
          ...(trabajo.clase === 'paso'
            ? { deToma: trabajo.deToma, aToma: trabajo.aToma, desde: trabajo.imagenInicial, hasta: trabajo.imagenFinal }
            : {}),
        });

        const marcaB = urlFinal ? ' [inicial+final]' : '';
        const aviso = nivel > 0 ? '  (RESPALDO)' : '';
        console.log(`  OK  ${trabajo.descripcion} -> ${duracion}s${marcaB} — ${r.creditos ?? '?'} cr${aviso}`);
        return { ruta: r.ruta };
      } catch (e) {
        fallos.push(e.message);
        const quedan = REINTENTOS - intento;
        if (esH) {
          // Toma hablada: misma lectura del fallo que en un bloque R.
          erroresH.push(e);
          const clase = clasificarFalloR(e);
          if (clase === 'contenido') {
            // El mismo prompt va a fallar igual: no se gastan los otros intentos.
            console.log(`  ..  ${trabajo.descripcion}: intento ${intento}/${REINTENTOS} rechazado por contenido (${e.message.slice(0, 130)}) — no se reintenta`);
            break;
          }
          const espera = clase === 'servidor' ? ESPERAS_SERVIDOR_MS[Math.min(intento - 1, ESPERAS_SERVIDOR_MS.length - 1)] : 3000 * intento;
          const siguiente = !quedan ? '' : clase === 'servidor' ? ` — error del servidor, reintento en ${Math.round(espera / 1000)} s` : ' — reintento';
          console.log(`  ..  ${trabajo.descripcion}: intento ${intento}/${REINTENTOS} fallo (${e.message.slice(0, 130)})${siguiente}`);
          if (quedan) await new Promise((r) => setTimeout(r, espera));
          continue;
        }
        console.log(`  ..  ${trabajo.descripcion}: intento ${intento}/${REINTENTOS} fallo (${e.message.slice(0, 130)})${quedan ? ' — reintento' : ''}`);
        if (quedan) await new Promise((r) => setTimeout(r, 3000 * intento));
      }
    }
  }

  // Toma hablada: que paso y que hacer, como en un bloque R.
  if (esH) throw errorTomaH(trabajo, erroresH, cascada[0], ctx);

  // Un solo modelo en la cascada (hoy, el B-roll de los estilos hablados): no
  // hubo "dos modelos" que probar.
  const conQue =
    cascada.length > 1
      ? `fallo con los dos modelos (${cascada.join(' y ')})`
      : `fallo ${fallos.length} ${fallos.length === 1 ? 'vez' : 'veces'} con ${cascada[0]} (en este estilo no tiene modelo de respaldo)`;

  // Con continuidad (los trabajos traen `rol`) un clip no se puede saltar: la
  // cadena quedaria cortada. El prompt de un paso vive en continuidad.pasos.
  const opciones = !trabajo.rol
    ? '    a) reescribir prompt_video de esa toma en el manifiesto y volver a correr\n' +
      '    b) saltarte esa toma\n' +
      '    c) probar con otro modelo'
    : trabajo.clase === 'paso'
      ? `    a) reescribir continuidad.pasos[de=${trabajo.deToma}].prompt_video en el manifiesto, mirando sus dos imagenes\n` +
        `       (npm run continuidad -- ${ctx.carpetaArg} --pares), y volver a correr solo ese paso:\n` +
        `           npm run videos -- ${ctx.carpetaArg} --pasos ${trabajo.deToma}\n` +
        '    b) probar con otro modelo\n' +
        '  Saltarse el paso no se puede: la cadena quedaria cortada.'
      : `    a) reescribir prompt_video de la toma ${trabajo.n} en el manifiesto y volver a correr\n` +
        '    b) probar con otro modelo\n' +
        '  Saltarse el clip no se puede: la cadena quedaria cortada.';
  throw new Error(
    `${trabajo.descripcion} ${conQue}.\n` +
      `  Ultimo motivo: ${fallos[fallos.length - 1]}\n\n` +
      '  No voy a inventar un prompt distinto por mi cuenta. Decide tu:\n' +
      opciones
  );
}

/**
 * Toma hablada (H) que Omni no genero: el error con lo que paso y que hacer,
 * con la misma forma que el de un bloque R. Servidor -> no cambies nada,
 * espera y vuelve a correr (los intentos fallidos no cobran). Contenido ->
 * reescribe el copy de ESA toma (linea, lineas o dialogo, y prompt_video),
 * con su misma funcion y su mismo largo, y rehazla. Sin respaldo: Kling no
 * genera el dialogo.
 */
function errorTomaH(trabajo, errores, modelo, ctx) {
  const motivo = [...errores].reverse().find((e) => e?.failCode || e?.failMsg) || errores[errores.length - 1] || new Error('(sin detalle)');
  const clase = clasificarFalloR(motivo);
  const carpetaArg = ctx.carpetaArg;
  const vecesFallo = `${errores.length} ${errores.length === 1 ? 'vez' : 'veces'}`;
  const volverACorrer = (s) => `${s}    npm run videos -- ${carpetaArg} --tomas ${trabajo.n}`;
  // `s` = sangria de las lineas de texto; los comandos van 4 espacios mas adentro.
  const reescribir = (s) =>
    [
      `${s}reescribe solo el copy de esta toma (linea, "lineas" o "dialogo" si los tiene, y prompt_video),`,
      `${s}manteniendo su funcion y su largo, y aplicalo con:`,
      `${s}    node produccion/rehacer-toma.js ${carpetaArg} --toma ${trabajo.n} --contexto`,
      `${s}    node produccion/rehacer-toma.js ${carpetaArg} --toma ${trabajo.n} --aplicar nuevos.json`,
    ].join('\n');

  let titulo;
  let queHacer;
  if (clase === 'servidor') {
    titulo = `${trabajo.descripcion}: ${modelo} fallo ${vecesFallo} por un error del servidor.`;
    queHacer =
      '  Error del servidor de Omni, no es un rechazo de contenido: no cambies nada; espera unos\n' +
      '  minutos y vuelve a correr:\n' +
      `${volverACorrer('  ')}\n` +
      '  SIN --rehacer: asi solo se genera lo que falta y lo ya generado no se vuelve a pagar.\n' +
      '  Los intentos fallidos no cobran.';
  } else if (clase === 'contenido') {
    titulo = `${trabajo.descripcion}: ${modelo} la rechazo por contenido (no se reintento: el mismo prompt falla igual).`;
    queHacer =
      '  Es un rechazo por politicas de contenido (pasa sobre todo con temas de salud). Mira en el\n' +
      '  failMsg que palabra o promesa lo disparo, cambiala y\n' +
      reescribir('  ');
  } else {
    titulo = `${trabajo.descripcion}: ${modelo} fallo ${vecesFallo}.`;
    queHacer =
      '  No se reconoce si es un error del servidor o un rechazo de contenido: lee el failMsg.\n' +
      '  a) Si es del servidor (caida, timeout, sobrecarga): no cambies nada; espera unos\n' +
      '     minutos y vuelve a correr, SIN --rehacer (los intentos fallidos no cobran):\n' +
      `${volverACorrer('     ')}\n` +
      '  b) Si es de contenido (politicas): cambia la palabra o promesa que lo disparo,\n' +
      reescribir('     ');
  }

  const err = new Error(
    `${titulo}\n` +
      `  failCode: ${motivo.failCode ?? '(no vino)'}\n` +
      `  failMsg:  ${motivo.failMsg ?? motivo.message}\n\n` +
      '  En las tomas habladas no hay modelo de respaldo (Kling no genera el dialogo), asi que\n' +
      '  aqui se para.\n\n' +
      queHacer
  );
  err.trabajo = trabajo;
  err.failCode = motivo.failCode;
  err.failMsg = motivo.failMsg;
  err.claseFallo = clase;
  return err;
}

// Como se lee un fallo de Omni en un bloque R (ver clasificarFalloR).
const RE_CONTENIDO = /polic(?:y|ies)|safety|sensitive|prohibit|violat|blocked|moderat|inappropriate|nsfw/i;
const RE_SERVIDOR =
  /internal\s+(?:server\s+)?error|try\s+again\s+later|time\s*-?\s*out|timed\s+out|\bserver\b|overload|\bbusy\b|unavailable|bad\s+gateway|\b429\b|demasiadas solicitudes/i;
const RE_CONTENIDO_SUELTO = /\bcontent\b/i;
const CODIGOS_SERVIDOR = new Set(['500', '502', '503', '504']);

/**
 * De que es un fallo de Omni en un bloque R, por su failCode / failMsg (o el
 * mensaje, si la tarea ni se creo):
 *
 *   'contenido'    rechazo por politicas (policy, safety, sensitive, prohibited,
 *                  violation, blocked, moderation...). Reintentar el mismo prompt
 *                  no sirve: se reescribe el copy de ESE bloque.
 *   'servidor'     el servicio fallo (500/502/503/504, internal error, try again
 *                  later, timeout, server, overloaded, busy). No se cambia nada:
 *                  se espera y se vuelve a correr. No cobra.
 *   'desconocido'  ninguna de las dos.
 *
 * Las palabras de politicas mandan sobre el codigo: kie puede devolver un 500
 * con "rejected by content policy", y eso es contenido. "content" a secas
 * cuenta solo si no hay senales de servidor.
 */
export function clasificarFalloR(e) {
  // Sin failCode (la tarea ni se creo), el codigo sale del mensaje de kie-client:
  // "code=500" (respuesta JSON) o "HTTP 503" (respuesta que no es JSON).
  const codigo = String(e?.failCode ?? String(e?.message ?? '').match(/\b(?:code=|HTTP )(\d{3})\b/)?.[1] ?? '').trim();
  const texto = [e?.failMsg, e?.message].filter(Boolean).join(' ');
  if (RE_CONTENIDO.test(`${codigo} ${texto}`)) return 'contenido';
  if (CODIGOS_SERVIDOR.has(codigo) || RE_SERVIDOR.test(texto)) return 'servidor';
  if (RE_CONTENIDO_SUELTO.test(texto)) return 'contenido';
  return 'desconocido';
}

/**
 * Un bloque UGC tipo R (toma o gancho): solo referencias, cero frames, y SIN
 * cascada. Por el mismo camino va una toma H de la entrevista por
 * ingredientes (trabajo.porIngredientes, tipo 'H'): sus ingredientes son las
 * referencias, en orden, y la imagen del clip va primero. Lo que cambia en H:
 * el log dice 'H' (con porIngredientes), el numero de "Duracion:" del prompt
 * se ajusta como en cualquier toma H (ajustarDuracionEnPrompt), lo que salio
 * del clip anterior va a historial/ (sacarDerivadosDeTomaH) y, si falla, el
 * error es el de una toma hablada (errorTomaH). Un bloque R sale igual que antes.
 *
 * Las referencias se suben en el orden de la toma (es el "Imagen 1, Imagen 2"
 * del prompt) y van a flash-1-1 como image_urls. No hay modelo de respaldo
 * (decision del estilo, 2026-10-04): kling-3.0 usa image_urls como frames, no
 * genera el dialogo y pronuncia mal.
 *
 * Si flash falla, se mira de que es (clasificarFalloR):
 *   - contenido: se para en ese intento (el mismo prompt falla igual) y se dice
 *     que hay que reescribir el copy de ESE bloque.
 *   - servidor: se reintenta hasta REINTENTOS veces, esperando
 *     ESPERAS_SERVIDOR_MS entre intentos; si sigue, se para y se dice que no
 *     hay que cambiar nada, solo volver a correr mas tarde.
 *   - desconocido: los reintentos de siempre y, al final, las dos salidas.
 *
 * El prompt va tal cual, sin ajustarDuracionEnPrompt(): el validador ya exige
 * que "Duracion: Ns." coincida con la duracion, y la duracion ya es una de las
 * que acepta el modelo. En R el motor no toca el prompt en absoluto. (En una
 * toma H por ingredientes si, como en cualquier toma H: ahi esa linea del
 * prompt es opcional y el validador solo avisa si no coincide.)
 */
export async function generarBloqueR(trabajo, ctx, log) {
  const destino = path.join(ctx.dirVideo, trabajo.archivo);
  const modelo = MODELO_VIDEO_UGC;
  const { resolucion, duracion, excedeTope } = creditosClip(modelo, trabajo.segundos, RESOLUCION_VIDEO);
  if (excedeTope || duracion !== trabajo.segundos) {
    throw new Error(`${trabajo.descripcion}: ${modelo} solo genera bloques de 4, 6, 8 o 10 s. Corrige "duracion" en el manifiesto.`);
  }

  // Se suben ANTES de archivar el clip anterior: si una subida falla, el clip
  // viejo se queda donde estaba. Las URLs quedan cacheadas para los demas.
  const urls = [];
  for (const r of trabajo.rutasReferencias) urls.push(await subirArchivo(r.ruta));

  const archivado = archivarSiExiste(destino, ctx.carpeta);
  if (archivado) console.log(`      (el clip anterior se guardo en historial/${path.basename(archivado)})`);
  // El recorte de cola (toma-N.cola.json, lo escribe cortar-cola-ugc.js) se
  // midio sobre el clip ANTERIOR: con un clip nuevo ya no vale. Se archiva
  // tambien, para que el montaje no corte el clip nuevo con la medida vieja.
  if (trabajo.clase === 'toma') {
    const cola = archivarSiExiste(path.join(ctx.carpeta, `toma-${trabajo.n}.cola.json`), ctx.carpeta);
    if (cola) console.log(`      (su recorte de cola se guardo en historial/${path.basename(cola)}: hay que volver a medirlo)`);
  }
  // Toma hablada por ingredientes: el original de la voz y el host recortado
  // salieron del clip anterior.
  const esH = trabajo.tipo === 'H';
  if (esH && trabajo.clase === 'toma') avisarDerivadosSacados(sacarDerivadosDeTomaH(ctx.carpeta, trabajo.n), trabajo.n, ctx.carpetaArg);
  // En H el numero de "Duracion:" del prompt se ajusta como en cualquier toma
  // hablada (no-op si ya coincide); en R el prompt va tal cual.
  const ajuste = esH ? ajustarDuracionEnPrompt(trabajo.prompt, duracion) : { prompt: trabajo.prompt, cambiado: false };
  if (ajuste.cambiado) {
    console.log(`      (${trabajo.descripcion}: el prompt decia "Duracion: ${ajuste.antes}s" y el clip se pide de ${ajuste.despues}s; se ajusta el numero dentro del prompt para que no se contradigan)`);
  }

  const fallos = [];
  for (let intento = 1; intento <= REINTENTOS; intento++) {
    try {
      const r = await generarVideo({
        modelo,
        prompt: ajuste.prompt,
        frameInicial: null,
        frameFinal: null,
        imagenesReferencia: urls,
        aspectRatio: ctx.aspectRatio,
        resolucionApi: resolucion.api,
        duracion,
        rutaDestino: destino,
        timeoutMs: TIMEOUT_VIDEO_MS,
      });

      log.push({
        id: trabajo.id,
        archivo: trabajo.archivo,
        modelo: r.modeloReal,
        respaldo: false,
        intentos: intento,
        // 'R' en los bloques (como siempre); 'H' en una toma hablada por ingredientes.
        tipo: esH ? 'H' : 'R',
        ...(esH ? { porIngredientes: true } : {}),
        segundosUtiles: trabajo.segundos,
        segundosPedidos: duracion,
        resolucion: resolucion.nombre,
        frameFinal: false,
        referencias: trabajo.referencias,
        creditos: r.creditos,
        taskId: r.taskId,
      });

      console.log(`  OK  ${trabajo.descripcion} -> ${duracion}s [${esH ? 'ingredientes' : 'refs'}: ${trabajo.referencias.join(', ')}] — ${r.creditos ?? '?'} cr`);
      return { ruta: r.ruta };
    } catch (e) {
      fallos.push(e);
      const clase = clasificarFalloR(e);
      const quedan = REINTENTOS - intento;
      if (clase === 'contenido') {
        // El mismo prompt va a fallar igual: no se gastan los otros intentos.
        console.log(`  ..  ${trabajo.descripcion}: intento ${intento}/${REINTENTOS} rechazado por contenido (${e.message.slice(0, 130)}) — no se reintenta`);
        break;
      }
      const espera = clase === 'servidor' ? ESPERAS_SERVIDOR_MS[Math.min(intento - 1, ESPERAS_SERVIDOR_MS.length - 1)] : 3000 * intento;
      const siguiente = !quedan ? '' : clase === 'servidor' ? ` — error del servidor, reintento en ${Math.round(espera / 1000)} s` : ' — reintento';
      console.log(`  ..  ${trabajo.descripcion}: intento ${intento}/${REINTENTOS} fallo (${e.message.slice(0, 130)})${siguiente}`);
      if (quedan) await new Promise((r) => setTimeout(r, espera));
    }
  }

  // Toma hablada por ingredientes: que paso y que hacer, como en cualquier
  // toma H (se rehace con rehacer-toma.js, no con la forma corta de los R).
  if (esH) throw errorTomaH(trabajo, fallos, modelo, ctx);

  // El motivo que dio kie. Si algun intento trajo failCode/failMsg (la tarea
  // se creo y el modelo la rechazo), ese es el que importa.
  const motivo = [...fallos].reverse().find((e) => e.failCode || e.failMsg) || fallos[fallos.length - 1];
  const clase = clasificarFalloR(motivo);
  const esGancho = trabajo.clase === 'gancho';
  const carpetaArg = ctx.carpetaArg;
  const volverACorrer = (s) => `${s}    npm run videos -- ${carpetaArg}${esGancho ? ' --ganchos' : ''}`;
  // `s` = sangria de las lineas de texto; el comando va 4 espacios mas adentro.
  const reescribir = (s) =>
    (esGancho
      ? [
          `${s}reescribe solo el copy de este gancho en "ganchos_alternativos" (linea, tramos y`,
          `${s}prompt_video), manteniendo su funcion y su largo, y vuelve a correr:`,
          `${s}    npm run videos -- ${carpetaArg} --ganchos`,
        ]
      : [
          `${s}reescribe solo el copy de este bloque (linea, tramos y prompt_video en el manifiesto),`,
          `${s}manteniendo su funcion y su largo, y vuelve a correr:`,
          `${s}    npm run rehacer -- ${carpetaArg} ${trabajo.n}`,
        ]
    ).join('\n');
  const vecesFallo = `${fallos.length} ${fallos.length === 1 ? 'vez' : 'veces'}`;

  let titulo;
  let queHacer;
  if (clase === 'servidor') {
    titulo = `${trabajo.descripcion}: ${modelo} fallo ${vecesFallo} por un error del servidor.`;
    queHacer =
      '  Error del servidor de Omni, no es un rechazo de contenido: no cambies nada; espera unos\n' +
      '  minutos y vuelve a correr:\n' +
      `${volverACorrer('  ')}\n` +
      '  SIN --rehacer: asi solo se genera lo que falta y lo ya generado no se vuelve a pagar.\n' +
      '  Los intentos fallidos no cobran.';
  } else if (clase === 'contenido') {
    titulo = `${trabajo.descripcion}: ${modelo} lo rechazo por contenido (no se reintento: el mismo prompt falla igual).`;
    queHacer =
      '  Es un rechazo por politicas de contenido (pasa sobre todo con temas de salud). Mira en el\n' +
      '  failMsg que palabra o promesa lo disparo, cambiala y\n' +
      reescribir('  ');
  } else {
    titulo = `${trabajo.descripcion}: ${modelo} fallo ${vecesFallo}.`;
    queHacer =
      '  No se reconoce si es un error del servidor o un rechazo de contenido: lee el failMsg.\n' +
      '  a) Si es del servidor (caida, timeout, sobrecarga): no cambies nada; espera unos\n' +
      '     minutos y vuelve a correr, SIN --rehacer (los intentos fallidos no cobran):\n' +
      `${volverACorrer('     ')}\n` +
      '  b) Si es de contenido (politicas): cambia la palabra o promesa que lo disparo,\n' +
      reescribir('     ');
  }

  const err = new Error(
    `${titulo}\n` +
      `  failCode: ${motivo.failCode ?? '(no vino)'}\n` +
      `  failMsg:  ${motivo.failMsg ?? motivo.message}\n\n` +
      '  En los bloques UGC no hay modelo de respaldo (Kling no genera el dialogo y pronuncia\n' +
      '  mal), asi que aqui se para.\n\n' +
      queHacer
  );
  err.trabajo = trabajo;
  err.failCode = motivo.failCode;
  err.failMsg = motivo.failMsg;
  err.claseFallo = clase;
  throw err;
}

/**
 * Bloques R: los genera por PASADAS (ver ordenarPorLugares). Sin lugares
 * repetidos es una sola pasada, en el orden del plan.
 *
 * Antes de cada trabajo se dejan listos sus fotogramas de lugar (se sacan del
 * clip de origen con ffmpeg si no estan). Cuando un bloque que es origen de un
 * lugar se genera en esta corrida, el fotograma anterior (si habia) va a
 * historial/ y se vuelve a sacar del clip nuevo.
 *
 * Un fallo NO corta la corrida: se termina lo que no depende de el y al final
 * se informa todo junto. Un trabajo cuyo bloque de origen fallo no se genera,
 * y se dice por que.
 */
export async function ejecutarR(pasadas, ctx, log) {
  const fallidos = []; // { trabajo, error }
  const omitidos = []; // { trabajo, motivo }
  const generadas = new Set(); // n de las tomas generadas en esta corrida
  const caidas = new Map(); // n de toma -> por que no esta (para explicar a las que dependian)
  const lugares = ctx.lugares || [];

  for (const [i, pasada] of pasadas.entries()) {
    const candidatos = [];
    for (const t of pasada) {
      const sinOrigen = (t.dependeDe || []).find((n) => !generadas.has(n));
      if (sinOrigen === undefined) {
        candidatos.push(t);
        continue;
      }
      omitidos.push({
        trabajo: t,
        motivo: `necesita el fotograma del bloque ${sinOrigen}, y el bloque ${sinOrigen} ${caidas.get(sinOrigen) || 'no se genero'}.`,
      });
      if (t.clase === 'toma') caidas.set(t.n, 'no se genero (esperaba el fotograma de otro bloque)');
    }

    if (pasadas.length > 1 && candidatos.length) {
      console.log(i === 0 ? `  Pasada 1 de ${pasadas.length}:` : `\n  Pasada ${i + 1} de ${pasadas.length} (vuelven a un lugar ya generado):`);
    }
    const aCorrer = [];
    for (const t of candidatos) {
      try {
        for (const r of t.rutasReferencias || []) {
          if (r.como !== 'fotograma de lugar' || fs.existsSync(r.ruta)) continue;
          const clip = path.join(ctx.dirVideo, `toma-${r.deToma}.mp4`);
          if (!fs.existsSync(clip)) throw new Error(`necesita el fotograma del bloque ${r.deToma} y no esta video/toma-${r.deToma}.mp4.`);
          const s = sacarFotograma(clip, r.segundo, r.ruta);
          console.log(`      (lugar "${r.id}": fotograma del bloque ${r.deToma} en el segundo ${s.segundo} -> img/${path.basename(r.ruta)})`);
        }
      } catch (e) {
        omitidos.push({ trabajo: t, motivo: e.message });
        if (t.clase === 'toma') caidas.set(t.n, 'no se genero');
        continue;
      }
      aCorrer.push(t);
    }

    for (let k = 0; k < aCorrer.length; k += CONCURRENCIA_VIDEO) {
      const lote = aCorrer.slice(k, k + CONCURRENCIA_VIDEO);
      const res = await Promise.allSettled(lote.map((t) => generarBloqueR(t, ctx, log)));
      res.forEach((r, j) => {
        const t = lote[j];
        if (r.status === 'rejected') {
          fallidos.push({ trabajo: t, error: r.reason });
          const clase = r.reason?.claseFallo;
          if (t.clase === 'toma') {
            caidas.set(t.n, clase === 'servidor' ? 'fallo por un error del servidor' : clase === 'contenido' ? 'fue rechazado por contenido' : 'fallo');
          }
          return;
        }
        if (t.clase !== 'toma') return;
        generadas.add(t.n);
        // Clip nuevo de un bloque que es origen de un lugar: su fotograma
        // anterior ya no vale. Se guarda y se vuelve a sacar cuando haga falta.
        for (const l of lugares.filter((x) => x.deToma === t.n)) {
          const guardado = archivarSiExiste(l.ruta, ctx.carpeta);
          if (guardado) {
            console.log(`      (el fotograma anterior del lugar "${l.id}" se guardo en historial/${path.basename(guardado)}: se vuelve a sacar del clip nuevo)`);
          }
        }
      });
    }
  }

  if (!fallidos.length && !omitidos.length) return;
  if (fallidos.length === 1 && !omitidos.length) throw fallidos[0].error;

  const L = [];
  const partes = [];
  if (fallidos.length) partes.push(`${fallidos.length} ${fallidos.length === 1 ? 'clip fallo' : 'clips fallaron'}`);
  if (omitidos.length) partes.push(`${omitidos.length} no se ${omitidos.length === 1 ? 'genero' : 'generaron'}`);
  L.push(`${partes.join(' y ')}.`);
  // Cada mensaje ya empieza con el nombre de su clip.
  for (const f of fallidos) L.push('', `  ${f.error?.message ?? String(f.error)}`);
  if (omitidos.length) {
    L.push('', '  No se generaron:');
    for (const o of omitidos) L.push(`    ${o.trabajo.descripcion}: ${o.motivo}`);
    L.push('  Cuando su bloque de origen este bien, se generan con lo que falta (sin --rehacer):');
    L.push(`      npm run videos -- ${ctx.carpetaArg}${omitidos.some((o) => o.trabajo.clase === 'gancho') ? ' --ganchos' : ''}`);
  }
  const err = new Error(L.join('\n'));
  err.fallidos = fallidos;
  err.omitidos = omitidos;
  throw err;
}

async function ejecutar(trabajos, ctx, log) {
  let enVuelo = [];
  const esperarTodos = async () => {
    if (enVuelo.length) await Promise.all(enVuelo);
    enVuelo = [];
  };

  for (const trabajo of trabajos) {
    // Bloque R, y toma hablada por ingredientes: su propio camino, sin
    // cascada (image_urls). Todo lo demas, como siempre.
    const porReferencias = trabajo.tipo === 'R' || trabajo.porIngredientes === true;
    enVuelo.push(porReferencias ? generarBloqueR(trabajo, ctx, log) : generarConCascada(trabajo, ctx, log));
    if (enVuelo.length >= CONCURRENCIA_VIDEO) await esperarTodos();
  }
  await esperarTodos();
}

// ---------------------------------------------------------------- continuidad

/**
 * Continuidad: el log de esta corrida FUSIONADO con el que ya habia, por
 * archivo. Fuera de continuidad el log se pisa en cada corrida; aqui se
 * corre por partes (--pasos, --tomas) y no se puede perder que clip salio del
 * modelo de respaldo: el montaje lo avisa para revisar sus uniones.
 *
 * Se quedan las entradas anteriores de clips de la cadena que siguen en
 * video/ y que esta corrida no rehizo; van en el orden de la cadena.
 */
export function fusionarLogContinuidad(rutaLog, log, cadena, dirVideo) {
  let previos = [];
  try {
    if (fs.existsSync(rutaLog)) previos = JSON.parse(fs.readFileSync(rutaLog, 'utf8')).clips ?? [];
  } catch {
    previos = []; // un log ilegible no frena nada: se escribe con lo de esta corrida
  }
  const orden = new Map(cadena.map((c, i) => [c.archivo, i]));
  const nuevos = new Set(log.map((x) => x.archivo));
  const quedan = (Array.isArray(previos) ? previos : []).filter(
    (x) => x && orden.has(x.archivo) && !nuevos.has(x.archivo) && fs.existsSync(path.join(dirVideo, x.archivo))
  );
  const pos = (x) => orden.get(x.archivo) ?? Number.MAX_SAFE_INTEGER;
  return [...quedan, ...log].sort((a, b) => pos(a) - pos(b));
}

// ---------------------------------------------------------------- Flow

/**
 * Creditos de Flow MEDIDOS (2026-10-16, cuenta PRO, ver flow/flow.js): Omni
 * 1.1 Flash a 720p, 4 s = 7 creditos, 6 s = 10 y 8 s = 12. Lo demas (10 s y el
 * respaldo) no se midio y el resumen lo dice asi: no se inventa un precio.
 */
const CREDITOS_FLOW_MEDIDOS = { 4: 7, 6: 10, 8: 12 };

/** { porLargo: { 4: clips, ... }, medidos, sinMedir } de una lista de duraciones de Flow. */
function estimarCreditosFlow(duraciones) {
  const porLargo = {};
  for (const d of duraciones) porLargo[d] = (porLargo[d] || 0) + 1;
  let medidos = 0;
  let sinMedir = 0;
  for (const [d, n] of Object.entries(porLargo)) {
    if (CREDITOS_FLOW_MEDIDOS[d] === undefined) sinMedir += n;
    else medidos += CREDITOS_FLOW_MEDIDOS[d] * n;
  }
  return { porLargo, medidos, sinMedir };
}

/** "21 creditos", "21 creditos + 2 clip(s) de 6/10 s sin medir" o "2 clip(s) de 10 s sin medir". */
function textoCreditosFlow({ porLargo, medidos, sinMedir }) {
  const partes = [];
  if (medidos || !sinMedir) partes.push(`${medidos} creditos`);
  if (sinMedir) {
    const largos = Object.keys(porLargo).filter((d) => CREDITOS_FLOW_MEDIDOS[d] === undefined);
    partes.push(`${sinMedir} clip(s) de ${largos.join('/')} s sin medir`);
  }
  return partes.join(' + ');
}

/**
 * Si el clip trae dialogo ("habla" en la cola). Es la regla del montaje
 * (planear-montaje.js, ajustar): en dialogo_nativo la toma principal habla
 * (bloques R, tomas H, tomas del objeto parlante) y el B-roll no. El clip de
 * reacciones del podcast ("clase": "reacciones", linea "") tampoco. En
 * voz_en_off y musica no habla ninguno.
 */
function hablaElClip(m, t) {
  if (m.modo_audio !== 'dialogo_nativo') return false;
  if (t.clase === 'broll') return false;
  if (t.clase === 'gancho') return true;
  const toma = (m.tomas || []).find((x) => x.n === t.n);
  if (toma?.clase === 'reacciones' || (typeof toma?.linea === 'string' && !toma.linea.trim())) return false;
  return true;
}

/**
 * Un clip del plan como TrabajoFlow (typedef en flow/flow.js). `t.flow` ya trae
 * la duracion elegida, si es exacta y el prompt (ver cli).
 *
 *   fotogramas    tomas A/B/C, H con frame inicial, B-roll y la cadena de
 *                 continuidad: frame inicial, y final en las B y los pasos.
 *   ingredientes  bloques R, ganchos y tomas H por ingredientes: las imagenes
 *                 en el orden de rutasDeReferencias / rutasDeIngredientes.
 *   texto         sin ninguna imagen.
 *
 * Sin respaldo donde en kie no lo habia: bloques R, ganchos, tomas H por
 * ingredientes y los estilos de ESTILOS_SIN_RESPALDO_VIDEO (podcast y
 * entrevista; su B-roll iba solo a Kling). El B-roll mudo de esos estilos
 * (SONIDO_BROLL_POR_ESTILO) va con Omni y sin_sonido: flow:recibir le pone
 * silencio.
 */
function trabajoFlow(t, { carpeta, dirImg, manifiesto }) {
  const porReferencias = t.tipo === 'R' || t.porIngredientes === true;
  const refs = porReferencias ? t.rutasReferencias : [];
  const frameInicial = !porReferencias && t.imagenInicial ? path.join(dirImg, t.imagenInicial) : null;
  const frameFinal = !porReferencias && t.imagenFinal ? path.join(dirImg, t.imagenFinal) : null;
  const modo = refs.length ? 'ingredientes' : frameInicial ? 'fotogramas' : 'texto';
  const sinRespaldo = porReferencias || t.clase === 'gancho' || ESTILOS_SIN_RESPALDO_VIDEO.includes(manifiesto.estilo);
  const sinSonido = t.sonido === false;

  // Lo que conviene saber al pedirlo en Flow (el resto lo dicen los campos).
  const notas = [];
  if (refs.length) {
    const orden = refs.map((r, i) => `${i + 1}) ${r.id}${r.como === 'fotograma de lugar' ? ` (fotograma del bloque ${r.deToma}: el lugar)` : ''}`);
    notas.push(`Imagenes en este orden (Imagen 1, Imagen 2... del prompt): ${orden.join(', ')}.`);
    if (t.porIngredientes) notas.push('La 1 es la imagen del clip: el prompt la pide como frame inicial.');
  }
  if (t.rol) {
    notas.push(
      t.clase === 'paso'
        ? `Continuidad, paso ${t.deToma}->${t.aToma}: de ${t.imagenInicial} a ${t.imagenFinal}, sin cortes; dura ${t.flow.duracion} s exactos.`
        : `Continuidad (${t.rol} de la toma ${t.n}): dura ${t.flow.duracion} s exactos.`
    );
  }
  if (sinSonido) notas.push(`B-roll mudo: en kie iba a Kling sin audio; aqui va con ${FLOW.video.principal} y flow:recibir le pone silencio.`);
  if (t.flow.ajuste.cambiado) {
    notas.push(`El prompt decia "Duracion: ${t.flow.ajuste.antes}s" y el clip se pide de ${t.flow.ajuste.despues}s: el numero ya va ajustado.`);
  }

  return {
    id: t.id,
    archivo: `video/${t.archivo}`,
    descarga: nombreDescarga(carpeta, t.archivo),
    clase: 'video',
    modo,
    modelo: FLOW.video.principal,
    respaldo: sinRespaldo ? null : FLOW.video.respaldo,
    prompt: t.flow.ajuste.prompt,
    referencias: refs.map((r) => r.ruta),
    frame_inicial: frameInicial,
    frame_final: frameFinal,
    duracion: t.flow.duracion,
    duracion_pedida: t.segundos,
    exacta: t.flow.exacta,
    proporcion: manifiesto.aspect_ratio || '9:16',
    calidad_descarga: FLOW.video.resolucion,
    habla: hablaElClip(manifiesto, t),
    sin_sonido: sinSonido,
    fondo: null,
    ...(notas.length ? { nota: notas.join(' ') } : {}),
  };
}

/** --solo-plan: lo que iria a la cola, con la forma de imprimirCola, sin escribir nada. */
function imprimirPlanSinCola({ trabajos, bloqueados, hechos }) {
  console.log('');
  for (const h of hechos) console.log(`  [se haria sin Flow] ${h}`);
  if (trabajos.length) {
    console.log(`  ${trabajos.length} video(s) irian a la cola de Google Flow:`);
    for (const t of trabajos) {
      const extra = [t.modelo, `${t.duracion} s`, t.modo, t.referencias.length ? `${t.referencias.length} ref.` : null, t.habla ? 'habla' : null, t.sin_sonido ? 'mudo' : null]
        .filter(Boolean)
        .join(' · ');
      console.log(`    - ${t.archivo}  (${extra})  -> se descargaria como "${t.descarga}"`);
    }
  }
  if (bloqueados.length) {
    console.log(`  ${bloqueados.length} esperarian a que existan otros archivos:`);
    for (const b of bloqueados) console.log(`    - ${b.archivo}  espera ${b.espera.join(', ')}`);
  }
}

// ---------------------------------------------------------------- CLI

// Esta copia no llama a kie desde el CLI: arma la cola de Flow (ver arriba).
if (process.argv[1] && process.argv[1].endsWith('generar-videos.js')) await cli();

async function cli() {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  // --si se acepta y no hace nada: aqui no se cobra nada ni se pregunta (el
  // usuario aprueba la cola en el chat).
  const soloPlan = args.includes('--solo-plan');
  const rehacer = args.includes('--rehacer');
  const idxTomas = args.indexOf('--tomas');
  const soloTomas =
    idxTomas !== -1 && args[idxTomas + 1]
      ? args[idxTomas + 1].split(',').map((s) => Number(s.trim())).filter(Number.isInteger)
      : null;
  const sinBroll = args.includes('--sin-broll');
  // Fuerza la duracion de todos los clips, ignorando la del manifiesto. Sirve
  // para regenerar mas corto cuando la voz real resulto mas rapida que lo
  // estimado por la skill.
  const idxDur = args.indexOf('--duracion');
  const duracionForzada = idxDur !== -1 && args[idxDur + 1] ? Number(args[idxDur + 1]) : null;
  // Suma los ganchos alternativos de un anuncio por bloques (gancho-<id>.mp4).
  const conGanchos = args.includes('--ganchos');
  // Solo con continuidad: esos pasos y nada mas (paso-<K>.mp4).
  const idxPasos = args.indexOf('--pasos');
  const soloPasos =
    idxPasos !== -1 && args[idxPasos + 1] && !args[idxPasos + 1].startsWith('--')
      ? args[idxPasos + 1].split(',').map((s) => Number(s.trim())).filter(Number.isInteger)
      : null;

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/generar-videos.js <carpeta-del-anuncio> [--tomas 1,10] [--solo-plan] [--rehacer] [--ganchos] [--pasos 19,20]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const rutaManifiesto = path.join(carpeta, 'manifiesto.json');
  if (!fs.existsSync(rutaManifiesto)) {
    console.error(`\n  No encuentro el manifiesto: ${rutaManifiesto}\n`);
    process.exit(1);
  }

  // El .env es opcional aqui: los videos no llaman a ninguna API. Solo se lee
  // por FLOW_DESCARGAS (donde deja Chrome las descargas, ver flow/flow.js).
  try {
    cargarEnv();
  } catch {
    // sin .env: las descargas se esperan en la carpeta Descargas de siempre
  }

  const manifiesto = JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8'));
  const conContinuidad = tieneContinuidad(manifiesto);

  if (idxPasos !== -1) {
    if (!conContinuidad) {
      console.error('\n  --pasos es solo para anuncios con continuidad (el bloque "continuidad" del manifiesto),');
      console.error('  y este no lo tiene. Para pedir solo algunas tomas:');
      console.error(`      npm run videos -- ${carpetaArg} --tomas 1,10\n`);
      process.exit(1);
    }
    if (!soloPasos || !soloPasos.length) {
      console.error('\n  --pasos necesita los numeros de las tomas de las que sale cada paso, separados por coma:');
      console.error(`      npm run videos -- ${carpetaArg} --pasos 19,20\n`);
      process.exit(1);
    }
  }

  // Con continuidad se exigen los pasos escritos, sus prompts y el cierre, y
  // ningun "revisar": true (sin continuidad, exigirPasos no se lee).
  const { errores } = validarManifiesto(manifiesto, { carpeta, exigirPasos: conContinuidad });
  if (errores.length) {
    console.error('\n  El manifiesto tiene errores. No armo la cola hasta que se arreglen:\n');
    for (const e of errores) console.error(`  ERROR  ${e}`);
    console.error('');
    process.exit(1);
  }

  const dirImg = path.join(carpeta, 'img');
  const dirVideo = path.join(carpeta, 'video');

  let plan = construirPlan(manifiesto, { soloTomas, ganchos: conGanchos, soloPasos });
  if (sinBroll) plan = plan.filter((t) => t.clase !== 'broll');

  if (conContinuidad) {
    // Cada largo sale de los tiempos reales de la voz (continuidad.pasos y
    // cierre): forzarlo desde afuera descuadra la cadena entera.
    if (idxDur !== -1) {
      console.error('\n  --duracion no se usa con continuidad.');
      console.error('  Cada clip se pide con el largo que dice el manifiesto (continuidad.pasos[].duracion,');
      console.error('  duracion_propio y continuidad.cierre.duracion), calculado desde los tiempos reales');
      console.error('  de la voz. Si la voz cambio, se recalcula:');
      console.error(`      npm run continuidad -- ${carpetaArg} --duraciones\n`);
      process.exit(1);
    }
    const conPaso = new Set(cadenaDeClips(manifiesto).filter((c) => c.rol === 'paso').map((c) => c.deToma));
    const sinPaso = (soloPasos || []).filter((k) => !conPaso.has(k));
    if (sinPaso.length) {
      console.error(`\n  --pasos ${soloPasos.join(',')}: no hay paso que salga de la toma ${sinPaso.join(', ')}.`);
      console.error('  Cada paso se nombra por la toma de la que sale (paso-19 va de la toma 19 a la siguiente);');
      console.error('  la ultima toma no tiene paso (cierra con su propio video).');
      console.error(`  Pasos de este anuncio: ${[...conPaso].join(', ')}\n`);
      process.exit(1);
    }
  }

  // En los bloques R la duracion esta atada a sus tramos, a su guion y al
  // "Duracion: Ns." del prompt: forzarla desde afuera los descuadra a todos.
  if (duracionForzada && plan.some((t) => t.tipo === 'R')) {
    console.error('\n  --duracion no se usa en los bloques R (UGC por bloques).');
    console.error('  La duracion de cada bloque esta atada a sus tramos y a su guion. Si un bloque');
    console.error('  sale apurado o le sobra tiempo, se corrige en el manifiesto (duracion, tramos y');
    console.error('  prompt_video) y se rehace ese bloque:');
    console.error(`      npm run rehacer -- ${carpetaArg} <N>\n`);
    process.exit(1);
  }
  // Una toma hablada por ingredientes se pide con la duracion exacta (Flow:
  // 4, 6, 8 o 10 s), sin redondear.
  const duracionesFlow = FLOW.video.duraciones;
  const listaFlow = `${duracionesFlow.slice(0, -1).join(', ')} o ${duracionesFlow[duracionesFlow.length - 1]} s`;
  if (duracionForzada && plan.some((t) => t.porIngredientes) && !duracionesFlow.includes(duracionForzada)) {
    console.error(`\n  --duracion ${duracionForzada}: las tomas habladas por ingredientes solo se piden de ${listaFlow}.`);
    console.error('  Pide una de esas, o corrige "duracion" (y el "Duracion: Ns." del prompt) en el manifiesto.\n');
    process.exit(1);
  }
  if (duracionForzada) for (const t of plan) t.segundos = duracionForzada;

  // Ya existe = hecho: un clip que esta en video/ no se vuelve a pedir (salvo --rehacer).
  const yaHechos = plan.filter((t) => fs.existsSync(path.join(dirVideo, t.archivo)));
  if (!rehacer && yaHechos.length) plan = plan.filter((t) => !fs.existsSync(path.join(dirVideo, t.archivo)));

  // Bloques R y tomas H por ingredientes: sus imagenes en disco, en el orden
  // de la toma (es el "Imagen 1, Imagen 2" del prompt).
  for (const t of plan) {
    if (t.tipo === 'R') t.rutasReferencias = rutasDeReferencias(manifiesto, carpeta, t.referencias);
    else if (t.porIngredientes) t.rutasReferencias = rutasDeIngredientes(manifiesto, carpeta, t.n, t.referencias);
  }
  // Un id que no esta en "referencias" no lo resuelve ninguna vuelta: es del manifiesto.
  const sinLista = [...new Set(plan.flatMap((t) => (t.rutasReferencias || []).filter((r) => !r.ruta).map((r) => r.id)))];
  if (sinLista.length) {
    console.error(`\n  Estas referencias no estan en la lista "referencias" del manifiesto: ${sinLista.join(', ')}.`);
    console.error(`  No hay archivo que esperar. Corrige el manifiesto (npm run validar -- ${carpetaArg}).\n`);
    process.exit(1);
  }

  // Bloques R con lugares repetidos: de donde sale cada fotograma (r.estado).
  // Sin bloques R esto no corre.
  const lugaresPlan = plan.some((t) => t.tipo === 'R') ? ordenarPorLugares(plan, carpeta) : null;

  // La duracion que se elige en Flow y el prompt de cada clip. Mismas reglas
  // que en kie (Omni y Flow ofrecen 4, 6, 8 y 10 s):
  //   - bloques R y tomas H por ingredientes: la duracion exacta, sin redondear;
  //   - continuidad: cada clip con el largo exacto que pide el manifiesto
  //     (pasos, cierre y duracion_propio; el propio sin duracion_propio, con
  //     el tramo que cubre su toma, como hoy) y exacta: true;
  //   - el resto: el tramo que cubre lo pedido. Mas de 10 s se divide.
  // El prompt es el que se mandaria a kie: ajustarDuracionEnPrompt salvo en R.
  const pasosCont = conContinuidad && Array.isArray(manifiesto.continuidad?.pasos) ? manifiesto.continuidad.pasos : [];
  const largoFijo = (t) =>
    t.rol === 'paso' || t.rol === 'cierre' || (t.rol === 'propio' && typeof pasosCont.find((p) => p?.de === t.n)?.duracion_propio === 'number');
  const erroresDuracion = [];
  for (const t of plan) {
    let duracion;
    if (t.tipo === 'R' || t.porIngredientes) {
      if (!duracionesFlow.includes(t.segundos)) {
        erroresDuracion.push(`${t.descripcion}: ${FLOW.video.principal} solo genera bloques de ${listaFlow}. Corrige "duracion" en el manifiesto.`);
        continue;
      }
      duracion = t.segundos;
    } else if (conContinuidad && largoFijo(t)) {
      if (!duracionesFlow.includes(t.segundos)) {
        erroresDuracion.push(
          `${t.descripcion}: con continuidad cada clip se pide con su largo exacto y Flow solo hace ${listaFlow};\n` +
            `  el manifiesto pide ${t.segundos}s. Se recalcula: npm run continuidad -- ${carpetaArg} --duraciones`
        );
        continue;
      }
      duracion = t.segundos;
    } else {
      duracion = duracionFlow(t.segundos);
      if (duracion === null) {
        const tope = duracionesFlow[duracionesFlow.length - 1];
        erroresDuracion.push(
          t.clase === 'broll'
            ? // Un B-roll no se divide en tomas. En podcast y entrevista iba a
              // Kling en kie (hasta 15 s) y el validador lo sigue aceptando.
              `${t.descripcion} dura ${t.segundos}s: en Flow el B-roll va con ${FLOW.video.principal}, de ${duracionesFlow[0]} a ${tope} s` +
                `${ESTILOS_HABLADOS.includes(manifiesto.estilo) ? ' (en kie iba a Kling, que llegaba a 15 s)' : ''}.\n` +
                `  Baja su "duracion" en el manifiesto a ${tope} o menos.`
            : `${t.descripcion} dura ${t.segundos}s y pasa el tope de ${FLOW.video.principal} (${tope} s).\n` +
                '  Hay que dividirla en dos tomas en el manifiesto, no truncarla.'
        );
        continue;
      }
    }
    // En R el motor no toca el prompt en absoluto (ver generarBloqueR).
    const ajuste = t.tipo === 'R' ? { prompt: t.prompt, cambiado: false } : ajustarDuracionEnPrompt(t.prompt, duracion);
    t.flow = { duracion, exacta: conContinuidad, ajuste };
  }
  if (erroresDuracion.length) {
    console.error('\n  No armo la cola:\n');
    for (const e of erroresDuracion) console.error(`  ${e}\n`);
    process.exit(1);
  }

  // Ganchos alternativos que NO entran en esta corrida (no se paso --ganchos).
  // Se avisan siempre, con su costo, para que nadie los olvide ni los pida sin querer.
  const ganchosFuera =
    conGanchos || !Array.isArray(manifiesto.ganchos_alternativos)
      ? []
      : manifiesto.ganchos_alternativos.filter(
          // (Uno que ya esta en video/ no se olvido: no se avisa.)
          (g) => (!soloTomas || soloTomas.includes(g.reemplaza)) && !fs.existsSync(path.join(dirVideo, `gancho-${g.id}.mp4`))
        );
  const avisoGanchos = () => {
    if (!ganchosFuera.length) return;
    const est = estimarCreditosFlow(ganchosFuera.map((g) => duracionFlow(g.duracion)).filter(Boolean));
    const ids = ganchosFuera.map((g) => g.id).join(', ');
    console.log(`  Opcional:   ${ganchosFuera.length} gancho(s) alternativo(s) (${ids}) NO entran en esta corrida:`);
    console.log(`              ${textoCreditosFlow(est)} de Flow mas. Se piden con:`);
    console.log(`                  npm run videos -- ${carpetaArg} --ganchos\n`);
  };

  const aspectRatio = manifiesto.aspect_ratio || '9:16';
  console.log(`\n=== Videos para Google Flow — ${path.basename(carpeta)} ===\n`);
  if (conContinuidad) {
    // Que clips de la cadena entran, contando los que ya estan hechos.
    if (soloTomas) {
      const deTomas = construirPlan(manifiesto, { soloTomas }).map((t) => t.archivo.replace('.mp4', ''));
      console.log(`  Limitado a las tomas: ${soloTomas.join(', ')} (los clips que tocan sus imagenes: ${deTomas.join(', ') || 'ninguno'})`);
    }
    if (soloPasos) console.log(`  Limitado a los pasos: ${soloPasos.join(', ')} (${soloPasos.map((k) => `paso-${k}`).join(', ')})`);
    if (soloTomas || soloPasos) console.log('');
  } else if (soloTomas) console.log(`  Limitado a las tomas: ${soloTomas.join(', ')}\n`);

  if (yaHechos.length && !rehacer) {
    console.log(`  Ya estan en video/ (no se vuelven a pedir): ${yaHechos.length}\n`);
  }

  // Continuidad: un paso, un propio o un cierre ya hecho con otro largo que el pedido.
  if (conContinuidad) {
    const avisos = avisosDeLargo(manifiesto, dirVideo, { fuera: plan.map((t) => t.archivo), carpetaArg });
    if (avisos.length) console.log(avisos.join('\n'));
  }

  if (plan.length === 0) {
    if (soloPlan) {
      console.log('  No hay nada que generar. Todo listo.\n');
      avisoGanchos();
      console.log('  --solo-plan: no se escribio la cola ni se toco nada.\n');
      return;
    }
    const ruta = escribirCola(carpeta, 'videos', { trabajos: [], bloqueados: [], hechos: [], aspectRatio });
    imprimirCola(carpeta, 'videos', { trabajos: [], bloqueados: [], hechos: [] });
    console.log(`  (cola vacia en ${path.relative(process.cwd(), ruta) || ruta})\n`);
    avisoGanchos();
    return;
  }

  // Bloques R: que imagenes lleva cada uno, en orden, para verlo ANTES de pedirlo.
  const bloquesR = plan.filter((t) => t.tipo === 'R');
  if (bloquesR.length) {
    console.log('  Bloques UGC (tipo R): por ingredientes (las referencias, sin frames) y sin modelo de respaldo.');
    console.log('  Cada uno lleva estas imagenes, en este orden (Imagen 1, Imagen 2...):\n');
    // Un lugar repetido: de donde sale su fotograma (ver ordenarPorLugares).
    const deDondeSale = (r) => {
      const anterior = r.habiaFotograma ? '; el fotograma anterior va a historial/' : '';
      return {
        'ya-sacado': `fotograma del bloque ${r.deToma} en el segundo ${r.segundo}, ya sacado: se reusa`,
        'se-saca-ahora': `se saca del bloque ${r.deToma} en el segundo ${r.segundo}; su clip ya esta, sin Flow`,
        'despues-del-origen': `se saca del bloque ${r.deToma} en el segundo ${r.segundo} cuando ese bloque este en video/ (proxima vuelta)${anterior}`,
        'falta-origen': `falta: el bloque ${r.deToma} no esta en video/ ni entra en esta corrida`,
      }[r.estado];
    };
    const imprimirBloque = (t) => {
      const refs = t.rutasReferencias.map((r, i) =>
        r.como === 'fotograma de lugar'
          ? `${i + 1}) ${r.id} (${path.relative(carpeta, r.ruta).replace(/\\/g, '/')}, ${deDondeSale(r)})`
          : `${i + 1}) ${r.id} (${r.ruta ? path.relative(carpeta, r.ruta).replace(/\\/g, '/') : 'sin archivo'}` +
            `${r.ruta && fs.existsSync(r.ruta) ? '' : ', falta'})`
      );
      console.log(`      ${t.archivo.padEnd(18)} ${t.descripcion}`);
      console.log(`      ${''.padEnd(18)} ${refs.join('  ')}`);
    };
    const pasadas = lugaresPlan.pasadas;
    if (pasadas.length > 1) {
      // Sin lugares que esperar, una sola lista como siempre. Con ellos, en el
      // orden de las vueltas de la cola.
      for (const [i, pasada] of pasadas.entries()) {
        const origenes = [...new Set(pasada.flatMap((t) => t.dependeDe))].sort((a, b) => a - b);
        console.log(
          i === 0
            ? '    Vuelta 1 (sus referencias ya existen):'
            : `    Vuelta ${i + 1} (vuelven a un lugar: se piden cuando ya esta${origenes.length > 1 ? 'n' : ''} ` +
                `${origenes.length > 1 ? 'los bloques' : 'el bloque'} ${origenes.join(', ')}):`
        );
        for (const t of pasada) imprimirBloque(t);
      }
    } else {
      for (const t of bloquesR) imprimirBloque(t);
    }
    console.log('');

    // Un lugar cuyo bloque de origen no esta en video/ ni entra en esta
    // corrida (p. ej. --tomas 4 sin el 1): el bloque espera, pero ese video no
    // va a llegar solo. Se dice como pedirlo.
    if (lugaresPlan.faltan.length) {
      const origenes = [...new Set(lugaresPlan.faltan.map((f) => f.ref.deToma))].sort((a, b) => a - b);
      const pedidas = [...new Set([...(soloTomas || []), ...origenes])].sort((a, b) => a - b);
      const varios = origenes.length > 1;
      console.log(`  OJO: ${varios ? 'los bloques' : 'el bloque'} ${origenes.join(', ')}, origen de un lugar, no ${varios ? 'estan' : 'esta'} en video/ ni ${varios ? 'entran' : 'entra'} en esta corrida.`);
      console.log('  Pidelo tambien en la misma corrida:');
      console.log(`      npm run videos -- ${carpetaArg}${soloTomas ? ` --tomas ${pedidas.join(',')}` : ''}${conGanchos ? ' --ganchos' : ''}\n`);
    }

    // Un bloque que es origen de un lugar se vuelve a pedir, y hay clips YA
    // hechos con su fotograma viejo que no entran en esta corrida: quedan con
    // el lugar anterior. Se avisa; no se piden solos.
    const enPlan = new Set(plan.map((t) => t.archivo));
    for (const l of listaDeReferencias(manifiesto).filter(esLugarDeToma)) {
      if (!plan.some((t) => t.clase === 'toma' && t.n === l.de_toma)) continue;
      const usan = [
        ...manifiesto.tomas.map((t) => ({ uso: t, archivo: `toma-${t.n}.mp4`, nombre: `bloque ${t.n}`, cmd: `${t.n}` })),
        ...(manifiesto.ganchos_alternativos || []).map((g) => ({ uso: g, archivo: `gancho-${g.id}.mp4`, nombre: `gancho ${g.id}`, cmd: `--gancho ${g.id}` })),
      ].filter((x) => (x.uso.referencias || []).includes(l.id) && !enPlan.has(x.archivo) && fs.existsSync(path.join(dirVideo, x.archivo)));
      if (!usan.length) continue;
      console.log(`  OJO: el bloque ${l.de_toma} se vuelve a pedir y es el origen del lugar "${l.id}". Ya estan hechos con`);
      console.log(`  su fotograma anterior, y no entran en esta corrida: ${usan.map((x) => x.nombre).join(', ')}.`);
      console.log('  Revisalos cuando el bloque nuevo este listo; si el lugar cambio, rehazlos:');
      for (const x of usan) console.log(`      npm run rehacer -- ${carpetaArg} ${x.cmd}`);
      console.log('');
    }
  }

  // Continuidad: que se pide en cada clip de la cadena, en orden (de que
  // imagen sale y a cual llega).
  if (conContinuidad) {
    console.log('  Continuidad: cada clip va de su imagen inicial a la final, en este orden (sin B-roll):\n');
    const ancho = Math.max(...plan.map((t) => t.descripcion.length));
    for (const t of plan) {
      const imagenes = t.imagenFinal ? `${t.imagenInicial} -> ${t.imagenFinal}` : `${t.imagenInicial} (sin imagen final)`;
      console.log(`      ${t.archivo.padEnd(12)} ${t.descripcion.padEnd(ancho)}  ${imagenes}`);
    }
    console.log('');
  }

  // Estilo hablado (podcast, entrevista): que se pide en cada clip.
  const hablado = ESTILOS_HABLADOS.includes(manifiesto.estilo);
  const porIngredientes = plan.filter((t) => t.porIngredientes);
  if (hablado) {
    // Las tomas con frame inicial (podcast, y entrevistas de antes) y las que
    // van por ingredientes (entrevista) se explican cada una a su manera.
    if (!porIngredientes.length || porIngredientes.length < plan.filter((t) => t.tipo === 'H').length) {
      console.log('  Tomas habladas (H): su frame inicial como fotograma inicial, sin frame final, sin referencias');
      console.log(`  y sin modelo de respaldo.${porIngredientes.length ? '' : ` B-roll: ${FLOW.video.principal}, mudo.`}\n`);
    }
    if (porIngredientes.length) {
      console.log('  Tomas habladas (H) por ingredientes: estas imagenes, en este orden (imagen 1, imagen 2... del');
      console.log('  prompt; la 1 es la imagen del clip, que el prompt pide como frame inicial), sin modelo de');
      console.log(`  respaldo. B-roll: ${FLOW.video.principal}, mudo.\n`);
    }
    const ancho = Math.max(...plan.map((t) => t.descripcion.length));
    for (const t of plan) {
      const toma = t.clase === 'toma' ? manifiesto.tomas.find((x) => x.n === t.n) : null;
      const deDonde = toma && typeof toma.frame_inicial === 'string' && toma.frame_inicial.trim() ? ` (copia de "${toma.frame_inicial}")` : '';
      if (t.porIngredientes) {
        const rel = (r) => (r.ruta ? path.relative(carpeta, r.ruta).replace(/\\/g, '/') : 'sin archivo');
        const ings = t.rutasReferencias.map(
          (r, i) => `${i + 1}) ${r.id} (${rel(r)}${r.como === 'imagen del clip' ? deDonde : ''}${r.ruta && fs.existsSync(r.ruta) ? '' : ', falta'})`
        );
        console.log(`      ${t.archivo.padEnd(14)} ${t.descripcion.padEnd(ancho)}  ${ings.join('  ')}`);
        continue;
      }
      console.log(`      ${t.archivo.padEnd(14)} ${t.descripcion.padEnd(ancho)}  img/${t.imagenInicial}${deDonde}`);
    }
    console.log('');
  }

  // El prompt decia otra duracion: se ajusto el numero (ajustarDuracionEnPrompt).
  const ajustados = plan.filter((t) => t.flow.ajuste.cambiado);
  for (const t of ajustados) {
    const a = t.flow.ajuste;
    console.log(`      (${t.descripcion}: el prompt decia "Duracion: ${a.antes}s" y el clip se pide de ${a.despues}s; se ajusta el numero dentro del prompt para que no se contradigan)`);
  }
  if (ajustados.length) console.log('');

  // Que puede pedirse ya y que espera a otro archivo (rutas relativas a la
  // carpeta). Una imagen o referencia que falta no corta nada: el clip espera
  // a la proxima vuelta. Un lugar repetido se saca gratis si su bloque de
  // origen ya esta en video/ (aSacar); si el origen esta en esta misma cola,
  // o no esta ni entra en esta corrida, el bloque espera ese video.
  const rel = (ruta) => path.relative(carpeta, ruta).replace(/\\/g, '/');
  const esperaDe = new Map();
  const aSacar = new Map(); // ruta del fotograma -> { r, usan: [trabajos] }
  for (const t of plan) {
    const espera = [];
    if (t.rutasReferencias) {
      for (const r of t.rutasReferencias) {
        if (r.como !== 'fotograma de lugar') {
          if (!fs.existsSync(r.ruta)) espera.push(rel(r.ruta));
          continue;
        }
        if (r.estado === 'se-saca-ahora') {
          if (!aSacar.has(r.ruta)) aSacar.set(r.ruta, { r, usan: [] });
          aSacar.get(r.ruta).usan.push(t);
        } else if (r.estado === 'despues-del-origen' || r.estado === 'falta-origen') {
          espera.push(`video/toma-${r.deToma}.mp4`);
        }
      }
    } else {
      for (const img of [t.imagenInicial, t.imagenFinal]) {
        if (img && !fs.existsSync(path.join(dirImg, img))) espera.push(`img/${img}`);
      }
    }
    esperaDe.set(t, espera);
  }

  // Resumen y creditos de Flow, solo con lo medido.
  const tiposB = plan.filter((t) => t.imagenFinal).length;
  const planR = bloquesR.length > 0;
  const respaldoTxt = `respaldo: ${FLOW.video.respaldo}`;
  if (planR) {
    const nGanchos = plan.filter((t) => t.clase === 'gancho').length;
    console.log(`  Clips:      ${plan.length}  (bloques R${nGanchos ? `, ${nGanchos} de ellos gancho(s) alternativo(s)` : ''})`);
    console.log(`  Modelo:     ${FLOW.video.principal} a ${FLOW.video.resolucion}, por ingredientes, sin respaldo`);
    console.log('  Audio:      la voz la genera el modelo dentro de cada clip (dialogo con lip-sync)\n');
  } else if (conContinuidad) {
    console.log(`  Clips:      ${textoCuenta(plan)}, ${tiposB} con frame inicial + final`);
    console.log(`  Modelo:     ${FLOW.video.principal} a ${FLOW.video.resolucion}, fotogramas, cada clip con su largo exacto (${respaldoTxt})`);
    console.log('  Audio:      ambiente nativo del modelo, sin voces (se mezcla bajo la voz en off)\n');
  } else if (hablado) {
    const nH = plan.filter((t) => t.tipo === 'H').length;
    const nBroll = plan.filter((t) => t.clase === 'broll').length;
    console.log(`  Clips:      ${plan.length}  (${nH} toma(s) hablada(s)${nBroll ? ` + ${nBroll} B-roll` : ''})`);
    const comoH = !porIngredientes.length
      ? ''
      : porIngredientes.length === nH
        ? ', por ingredientes'
        : `, ${porIngredientes.length} por ingredientes y ${nH - porIngredientes.length} con frame inicial`;
    console.log(`  Modelo:     ${FLOW.video.principal} a ${FLOW.video.resolucion} para todo, sin respaldo${comoH}`);
    if (nBroll) console.log('              (el B-roll iba a Kling en kie: aqui va con Omni y flow:recibir le quita el audio)');
    console.log('  Audio:      la voz la genera Omni dentro de cada toma (dialogo con lip-sync); el B-roll va mudo\n');
  } else {
    console.log(`  Clips:      ${plan.length}  (${tiposB} con frame inicial + final)`);
    console.log(`  Modelo:     ${FLOW.video.principal} a ${FLOW.video.resolucion}, fotogramas (${respaldoTxt})`);
    console.log(
      manifiesto.modo_audio === 'dialogo_nativo'
        ? '  Audio:      las tomas hablan dentro del clip (dialogo con lip-sync); el B-roll trae su ambiente\n'
        : manifiesto.modo_audio === 'musica'
          ? '  Audio:      ambiente nativo del modelo, sin voces (se mezcla bajo la cancion)\n'
          : '  Audio:      ambiente nativo del modelo, sin voces (se mezcla bajo la voz en off)\n'
    );
  }
  const yaSePiden = plan.filter((t) => !esperaDe.get(t).length);
  const esperan = plan.filter((t) => esperaDe.get(t).length);
  const est = estimarCreditosFlow(yaSePiden.map((t) => t.flow.duracion));
  console.log(`  Creditos de Flow (${FLOW.video.principal} a ${FLOW.video.resolucion}; solo lo medido el 2026-10-16):`);
  if (yaSePiden.length) {
    console.log('  Largo   clips   creditos c/u   subtotal');
    for (const d of Object.keys(est.porLargo).sort((a, b) => a - b)) {
      const n = est.porLargo[d];
      const cu = CREDITOS_FLOW_MEDIDOS[d];
      console.log(
        cu === undefined
          ? `   ${String(d).padStart(2)}s     ${String(n).padStart(3)}      sin medir`
          : `   ${String(d).padStart(2)}s     ${String(n).padStart(3)}      ${String(cu).padStart(4)}        ${String(n * cu).padStart(5)}`
      );
    }
    console.log('');
  }
  console.log(`  Estimado:   ${yaSePiden.length ? `${textoCreditosFlow(est)} por lo que se pide ahora` : 'nada se pide en esta vuelta'}`);
  if (esperan.length) console.log(`              y ${textoCreditosFlow(estimarCreditosFlow(esperan.map((t) => t.flow.duracion)))} de los ${esperan.length} que esperan (vueltas siguientes)`);
  const conRespaldo = plan.some((t) => !(t.tipo === 'R' || t.porIngredientes || t.clase === 'gancho' || ESTILOS_SIN_RESPALDO_VIDEO.includes(manifiesto.estilo)));
  if (conRespaldo) console.log(`              (un clip que pasa al respaldo, ${FLOW.video.respaldo}, cuesta mas: sin medir)`);
  console.log('  Aqui no se cobra nada: se genera en Flow cuando lo apruebes.\n');
  avisoGanchos();

  // Lo que se resuelve aqui mismo, sin Flow (con --solo-plan, nada).
  const hechos = [];
  const ctxFlow = { carpeta, dirImg, manifiesto };

  // Lo que deja de valer y pasa a historial/ al armar la cola (se mueve, no se
  // borra): el fotograma de un lugar cuyo bloque de origen se vuelve a pedir
  // (en la proxima vuelta se saca del clip nuevo, como hacia ejecutarR) y, de
  // lo que va a la cola (y con --rehacer tambien de lo que espera), el clip
  // anterior y el recorte de cola de los bloques R y tomas H por ingredientes.
  // Lo que salio de una toma H (original de la voz, host recortado, su medida
  // en lineas-habladas.json y recorte.json: sacarDerivadosDeTomaH) NO se toca
  // aqui: lo saca flow:recibir cuando llega el clip nuevo. Asi, si el usuario
  // no aprueba los creditos, la medida sigue en su lugar.
  const queVaAHistorial = () => {
    const lista = [];
    for (const l of listaDeReferencias(manifiesto).filter(esLugarDeToma)) {
      if (!plan.some((t) => t.tipo === 'R' && t.clase === 'toma' && t.n === l.de_toma)) continue;
      const ruta = path.join(dirImg, archivoDeHoja(l));
      if (fs.existsSync(ruta)) lista.push({ ruta, que: `el fotograma anterior del lugar "${l.id}"`, despues: 'se vuelve a sacar del clip nuevo' });
    }
    for (const t of plan) {
      const destino = path.join(dirVideo, t.archivo);
      const existe = fs.existsSync(destino);
      if (esperaDe.get(t).length && !existe) continue;
      if (existe) lista.push({ ruta: destino, que: `${t.archivo}: el clip anterior`, clip: true });
      if (t.clase === 'toma' && (t.tipo === 'R' || t.porIngredientes)) {
        const cola = path.join(carpeta, `toma-${t.n}.cola.json`);
        if (fs.existsSync(cola)) lista.push({ ruta: cola, que: `${t.archivo}: su recorte de cola`, despues: 'hay que volver a medirlo' });
      }
    }
    return lista;
  };
  // --rehacer va una sola vez: el comando de las vueltas siguientes, sin el.
  const sinRehacer = `npm run videos -- ${args.filter((a) => a !== '--rehacer' && a !== '--solo-plan').join(' ')}`;

  if (soloPlan) {
    for (const { r } of aSacar.values()) hechos.push(`img/${path.basename(r.ruta)}: se sacaria del bloque ${r.deToma} en el segundo ${r.segundo} (lugar "${r.id}")`);
    const trabajos = yaSePiden.map((t) => trabajoFlow(t, ctxFlow));
    const bloqueados = esperan.map((t) => ({ id: t.id, archivo: `video/${t.archivo}`, espera: [...new Set(esperaDe.get(t))] }));
    imprimirPlanSinCola({ trabajos, bloqueados, hechos });
    const moveria = queVaAHistorial();
    if (moveria.length) {
      console.log('\n  Sin --solo-plan, al armar la cola pasaria a historial/ (se mueve, no se borra):');
      for (const x of moveria) console.log(`    - ${rel(x.ruta)}  (${x.que.replace(/^[^:]+: /, '')})`);
      console.log('  Pide el ok de los creditos con esta salida, antes de armar la cola.');
    }
    if (rehacer) {
      console.log('\n  Con el ok, la cola se arma UNA sola vez con --rehacer:');
      console.log(`      npm run videos -- ${args.filter((a) => a !== '--solo-plan').join(' ')}`);
      console.log('  y flow:recibir y las vueltas siguientes van sin --rehacer:');
      console.log(`      ${sinRehacer}`);
    }
    console.log('\n  --solo-plan: no se escribio la cola ni se toco nada.\n');
    return;
  }

  fs.mkdirSync(dirVideo, { recursive: true });

  // Lugares: el fotograma sale gratis (ffmpeg) del clip de origen que ya esta.
  // Si no sale (el clip esta danado), quien lo usa espera img/<id>.png, que
  // npm run imagenes no hace: sale solo de ese clip (ver la pista del final).
  const lugaresSinSacar = [];
  for (const { r, usan } of aSacar.values()) {
    try {
      const s = sacarFotograma(path.join(dirVideo, `toma-${r.deToma}.mp4`), r.segundo, r.ruta);
      hechos.push(`img/${path.basename(r.ruta)}: fotograma del bloque ${r.deToma} en el segundo ${s.segundo} (lugar "${r.id}")`);
    } catch (e) {
      console.error(`  ! lugar "${r.id}": ${e.message}`);
      lugaresSinSacar.push(r);
      for (const t of usan) esperaDe.get(t).push(rel(r.ruta));
    }
  }

  // Lo que deja de valer, a historial/ (ver queVaAHistorial).
  const movidos = [];
  for (const x of queVaAHistorial()) {
    const guardado = archivarSiExiste(x.ruta, carpeta);
    if (!guardado) continue;
    movidos.push({ ...x, guardado });
    console.log(`  (${x.que} se guardo en historial/${path.basename(guardado)}${x.despues ? `: ${x.despues}` : ''})`);
  }

  const trabajos = [];
  const bloqueados = [];
  for (const t of plan) {
    const espera = [...new Set(esperaDe.get(t))];
    if (espera.length) bloqueados.push({ id: t.id, archivo: `video/${t.archivo}`, espera });
    else trabajos.push(trabajoFlow(t, ctxFlow));
  }
  // video/log-modelos.json no se toca: lo escribe flow:recibir con lo que llega.
  escribirCola(carpeta, 'videos', { trabajos, bloqueados, hechos, aspectRatio });
  imprimirCola(carpeta, 'videos', { trabajos, bloqueados, hechos });

  // Que hace falta para que salga lo que espera.
  const esperas = [...new Set(bloqueados.flatMap((b) => b.espera))];
  if (esperas.length) console.log('');
  // El fotograma de un lugar que no se pudo sacar no sale de npm run imagenes.
  const fotogramasSinSacar = new Set(lugaresSinSacar.map((r) => rel(r.ruta)));
  if (esperas.some((e) => e.startsWith('img/') && !fotogramasSinSacar.has(e))) {
    console.log(`  Las imagenes que faltan salen de su propia cola: npm run imagenes -- ${carpetaArg}`);
  }
  for (const r of lugaresSinSacar) {
    const tomasCmd = soloTomas ? ` --tomas ${[...new Set([...soloTomas, r.deToma])].sort((a, b) => a - b).join(',')}` : '';
    console.log(`  ${rel(r.ruta)} (lugar "${r.id}") no sale de npm run imagenes: es un fotograma del bloque ${r.deToma} y no`);
    console.log(`  se pudo sacar de video/toma-${r.deToma}.mp4 (el error esta arriba). Si ese clip esta danado, rehaz el`);
    console.log(`  bloque ${r.deToma} (con el ok de sus creditos); cuando llegue, este comando saca el fotograma solo:`);
    console.log(`      npm run rehacer -- ${carpetaArg} ${r.deToma}`);
    console.log(`      npm run videos -- ${carpetaArg}${tomasCmd}${conGanchos ? ' --ganchos' : ''}`);
  }
  const aportadas = esperas.filter((e) => !e.startsWith('img/') && !e.startsWith('video/'));
  if (aportadas.length) {
    console.log(`  ${aportadas.join(', ')}: la aporta el usuario. La foto del producto se deja lista con:`);
    console.log(`      node produccion/preparar-producto.js "<tu-archivo>" ${path.basename(carpeta)}`);
  }
  if (esperas.some((e) => e.startsWith('video/'))) {
    console.log('  Un bloque que vuelve a un lugar sale cuando su bloque de origen esta en video/: este');
    console.log('  comando saca el fotograma solo (gratis) y lo pasa a la cola.');
  }
  console.log('');

  // --rehacer: lo anterior ya esta en historial/ y el usuario todavia no
  // aprobo los creditos. Se dice como devolverlo, y que --rehacer va una sola
  // vez (repetido despues de flow:recibir archivaria lo que acaba de llegar).
  if (rehacer) {
    if (movidos.length) {
      console.log('  --rehacer ya movio a historial/ lo anterior. Si los creditos no se aprueban, devuelvelo a su lugar:');
      for (const x of movidos) console.log(`      ${rel(x.guardado)}  ->  ${rel(x.ruta)}`);
      console.log(`  (Para ver la cola y los creditos sin mover nada: ${sinRehacer} --rehacer --solo-plan)`);
    }
    console.log('  --rehacer va una sola vez. flow:recibir y las vueltas siguientes van SIN --rehacer:');
    console.log(`      ${sinRehacer}\n`);
  }
  // Tomas habladas: cuando lleguen hay que medirlas (como al generar en kie).
  const hablan = trabajos.filter((t) => /^toma-\d+$/.test(t.id) && plan.find((p) => p.id === t.id)?.tipo === 'H');
  if (hablan.length) {
    console.log('  Cuando lleguen (despues de flow:recibir):');
    avisarMedirTomasH(hablan.map((t) => ({ id: t.id, tipo: 'H' })), manifiesto, carpetaArg, console.log);
  }
}

/**
 * Estilos hablados: las tomas H que salieron en esta corrida no tienen medida
 * (sacarDerivadosDeTomaH quito la del clip anterior) y el plan no las puede
 * cortar por palabras hasta medirlas. Se dice el comando exacto, con sus
 * numeros; las "solo_voz" (voz en off de la entrevista A) pasan despues por el
 * paso voz y se miden otra vez. Sin tomas H en el log no imprime nada.
 */
function avisarMedirTomasH(log, manifiesto, carpetaArg, decir) {
  const ns = [
    ...new Set(log.filter((x) => x.tipo === 'H' && /^toma-\d+$/.test(String(x.id))).map((x) => Number(String(x.id).slice(5)))),
  ].sort((a, b) => a - b);
  if (!ns.length) return;
  const soloVoz = ns.filter((n) => manifiesto.tomas.find((t) => t.n === n)?.solo_voz === true);
  decir(`  Tomas habladas nuevas (${ns.join(', ')}): midelas y revisa que esten limpias antes de planear:`);
  decir(`      npm run lineas -- ${carpetaArg} --tomas ${ns.join(',')}`);
  if (soloVoz.length) {
    decir('  Las de voz en off ("solo_voz"), cuando esten limpias, pasan por el paso voz y se miden otra vez:');
    decir(`      npm run voz -- ${carpetaArg} --tomas ${soloVoz.join(',')}`);
    decir(`      npm run lineas -- ${carpetaArg} --tomas ${soloVoz.join(',')}`);
  }
  decir('');
}
