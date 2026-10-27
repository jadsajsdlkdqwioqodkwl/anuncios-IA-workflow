// CONTINUIDAD — anuncio encadenado, sin cortes (efecto opcional).
//
// Cada video va de la imagen de una toma a la imagen de la siguiente y la IA
// hace el paso entre las dos escenas dentro del clip. Sin B-roll, sin
// transiciones del editor, y el montaje SOLO cambia la velocidad: nunca corta
// ni la cabeza ni la cola de un clip.
//
// Se activa SOLO si el manifiesto trae el bloque "continuidad". Sin ese bloque
// ningun script cambia de camino: en los demas archivos solo entra un
// `if (tieneContinuidad(m))` que deriva aqui.
//
//   npm run continuidad -- temp/mi-anuncio --preparar     antes de las imagenes
//   npm run continuidad -- temp/mi-anuncio --duraciones   despues de imagenes y audio
//   npm run continuidad -- temp/mi-anuncio --pares        que imagenes mirar en cada paso
//
// El bloque lo escribe la skill de continuidad, con ayuda de este CLI:
//
//   "broll": [],
//   "continuidad": {
//     "version": 1,
//     "broll_descartado": [ ...el B-roll que escribio el estilo, tal cual... ],
//     "pasos": [
//       { "de": 19, "a": 20, "ventana": 3.59, "duracion": 4, "forma": "recorrer", "prompt_video": "..." },
//       { "de": 21, "a": 22, "ventana": 5.11, "duracion": 4, "duracion_propio": 4, "prompt_video": "..." }
//     ],
//     "cierre": { "toma": 29, "ventana": 4.6, "duracion": 6 }
//   }
//
// Los clips de la cadena (ver cadenaDeClips): un paso por toma salvo la
// ultima (video/paso-<de>.mp4), el clip propio de cada toma B que no es la
// ultima (video/toma-<n>.mp4, inicial -> final, como hoy) y el cierre
// (video/toma-<N>.mp4 de la ultima toma).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  MODELOS,
  MODELOS_VIDEO,
  RESOLUCION_VIDEO,
  ESTILOS_CON_CONTINUIDAD,
  creditosClip,
  duracionPara,
  creditosAUsd,
} from './config.js';
import { listaDeReferencias, esGenerada } from './referencias.js';

export const VERSION_CONTINUIDAD = 1;

/**
 * Reglas del montaje en continuidad. Van APARTE de REGLAS (planear-montaje.js):
 * esas se escriben enteras en todos los planes, y cualquier campo nuevo ahi
 * cambiaria el plan de los anuncios sin continuidad.
 *
 *   guia          sobre esta velocidad se avisa; por debajo no se presta tiempo
 *   fuerte        sobre esta se destaca el aviso (no hay muro: cortar esta prohibido)
 *   minima        ningun clip baja de aqui (24 fps de Omni contra 30 del render:
 *                 por debajo hay cuadros repetidos)
 *   minimaCierre  el clip de la ultima toma puede bajar hasta aqui (lo tapa el
 *                 fade de la musica)
 *   temprano      la imagen nueva puede llegar hasta esto ANTES de su frase
 *   tarde         ... y hasta esto DESPUES (decision del efecto, 2026-10-09)
 */
export const REGLAS_CONTINUIDAD = Object.freeze({
  guia: 2.0,
  fuerte: 2.5,
  minima: 1.0,
  minimaCierre: 0.9,
  temprano: 0.3,
  tarde: 0.4,
});

/** Las 6 formas validadas de pasar de una imagen a la otra (las elige la skill). */
export const FORMAS = ['entrar', 'salir', 'recorrer', 'transformar', 'entorno', 'rodear'];

/** La linea que todo prompt de paso lleva tal cual. */
export const FRASE_SIN_EFECTOS = 'No glowing lines, light streaks or magic effects';

/**
 * La linea de cierre que todo prompt de paso lleva tal cual, probada en Flow el
 * 2026-10-08 (los pasos arrancaron y llegaron a su imagen). Nombra "cuts" y
 * "wipes" para negarlos: es la unica frase propia exenta del chequeo de abajo.
 */
export const FRASE_TOMA_CONTINUA = 'One continuous shot, no cuts or wipes.';

// Palabras que le piden al modelo un efecto de editor (o que lo invitan a
// hacer uno): el paso tiene que ser un movimiento fisico de camara o de escena.
const RE_PALABRAS_DE_EDITOR =
  /\b(transitions?|transici(?:o|ó)n(?:es)?|cut to|next scene|fades?|fading|dissolv(?:e|es|ed|ing)|morph\w*|slid(?:e|es|ing)|swip(?:e|es|ed|ing)|wip(?:e|es|ed|ing))\b/gi;

// ", 6s." de la cabecera (primera linea) del prompt_video: "..., image-to-video
// from the START frame to the END frame, 4s. Vertical 9:16."
const RE_CABECERA = /(,\s*)(\d+(?:[.,]\d+)?)(\s*s\b)/;

// Una ventana de un paso que difiere de la medida mas que esto: el audio cambio.
const TOLERANCIA_VENTANA = 0.05;
const EPS = 1e-9;
const VELOCIDAD_TECHO = 50; // la busqueda de la menor velocidad maxima va de `minima` a esto

const r2 = (x) => Number(x.toFixed(2));
const r3 = (x) => Number(x.toFixed(3));
const esNumero = (x) => typeof x === 'number' && Number.isFinite(x);
const esTexto = (v) => typeof v === 'string' && v.trim().length > 0;
const esObjeto = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
/** "1->2, 2->3, ... y 14 mas": una lista que no llena la pantalla. */
const listaCorta = (xs, max = 10) => (xs.length <= max ? xs.join(', ') : `${xs.slice(0, max).join(', ')} y ${xs.length - max} mas`);
const modeloPrincipal = () => MODELOS.video.principal;

/** Los tramos que acepta el modelo principal (4, 6, 8, 10). Se leen de config.js, no se copian. */
export const tramosDeVideo = () => MODELOS_VIDEO[modeloPrincipal()].duraciones;

/** El menor tramo que cubre `segundos`; si pasa del mas largo, el mas largo. */
export function tramoQueCubre(segundos) {
  const ts = tramosDeVideo();
  return ts.find((d) => d >= segundos - EPS) ?? ts[ts.length - 1];
}

/** true si el manifiesto trae el bloque (aunque este mal: entonces el validador lo rechaza). */
export const tieneContinuidad = (m) => Boolean(m) && typeof m === 'object' && m.continuidad != null;

// ---------------------------------------------------------------- cabecera

/**
 * El numero de ", Ns." en la PRIMERA linea del prompt (la cabecera del look),
 * o null si no lo trae.
 */
export function segundosDeCabecera(prompt) {
  if (typeof prompt !== 'string') return null;
  const primera = prompt.split(/\r?\n/)[0];
  const mm = primera.match(RE_CABECERA);
  return mm ? Number(mm[2].replace(',', '.')) : null;
}

/**
 * Cambia el numero de ", 6s." de la primera linea por `segundos`. No toca nada
 * mas. Lo usan el clip propio de una toma B pedido con `duracion_propio` y el
 * cierre pedido con `cierre.duracion`: mismo prompt, mismas imagenes, solo
 * otro largo (es un dato tecnico, como ajustarDuracionEnPrompt en
 * generar-videos.js). Sin cabecera reconocible, el prompt sale igual.
 */
export function ajustarCabecera(prompt, segundos) {
  if (typeof prompt !== 'string') return prompt;
  const corte = prompt.search(/\r?\n/);
  const primera = corte === -1 ? prompt : prompt.slice(0, corte);
  if (!RE_CABECERA.test(primera)) return prompt;
  return primera.replace(RE_CABECERA, `$1${segundos}$3`) + (corte === -1 ? '' : prompt.slice(corte));
}

// ---------------------------------------------------------------- tiempos

/**
 * Las frases de audio/tiempos.json contra las tomas, 1 a 1 y en orden. Con
 * continuidad cada toma tiene que tener su frase: es lo que fija cuando llega
 * cada imagen. Devuelve una ventana por toma:
 *
 *   ini  donde empieza su clip (la primera desde 0, aunque la voz arranque despues)
 *   obj  donde tiene que llegar la imagen siguiente: el inicio de la frase
 *        siguiente, o el final del audio en la ultima
 *
 * Lanza un error en castellano si no cuadran.
 */
export function ventanasDeFrases(m, tiempos) {
  const tomas = Array.isArray(m?.tomas) ? m.tomas : [];
  const lineas = tiempos?.lineas;
  const T = tiempos?.duracion;
  if (!Array.isArray(lineas) || !esNumero(T) || T <= 0) {
    throw new Error('audio/tiempos.json no trae "lineas" y "duracion". Vuelve a generar la voz: npm run audio -- <carpeta>');
  }
  if (lineas.length !== tomas.length || lineas.some((l, i) => l?.toma !== tomas[i]?.n)) {
    const i = lineas.findIndex((l, k) => l?.toma !== tomas[k]?.n);
    const detalle =
      i === -1
        ? `hay ${lineas.length} frase(s) y ${tomas.length} toma(s)`
        : `la frase ${i + 1} es de la toma ${JSON.stringify(lineas[i]?.toma ?? null)} y la toma ${i + 1} del manifiesto es la ${JSON.stringify(tomas[i]?.n ?? null)}`;
    throw new Error(
      `las frases de audio/tiempos.json no van 1 a 1 con las tomas del manifiesto (${detalle}). ` +
        'Con continuidad cada toma necesita su frase, en el mismo orden: vuelve a generar la voz (npm run audio -- <carpeta>).'
    );
  }
  return tomas.map((t, i) => {
    const ini = i === 0 ? 0 : lineas[i].inicio;
    const obj = i + 1 < lineas.length ? lineas[i + 1].inicio : T;
    if (!esNumero(ini) || !esNumero(obj) || !(obj - ini > EPS)) {
      throw new Error(
        `la frase de la toma ${t.n} en audio/tiempos.json no tiene un tiempo valido (de ${ini} a ${obj}). Vuelve a generar la voz: npm run audio -- <carpeta>.`
      );
    }
    return { toma: t, linea: lineas[i], ini, obj, ventana: obj - ini, ultima: i === tomas.length - 1 };
  });
}

/**
 * Lo que `--duraciones` escribe en el manifiesto, calculado desde los tiempos
 * reales de la voz (puro, no escribe nada):
 *
 *   A o C   el menor tramo que cubre su ventana (10 si la ventana pasa de 10 s).
 *   B       su clip propio va con el largo de siempre (el tramo de t.duracion);
 *           el paso, el menor tramo con el que propio + paso cubren la ventana
 *           (4 s salvo ventanas de mas de 8 s).
 *           Si propio + paso irian a mas de `fuerte` (2.5x) en su ventana, el
 *           propio se pide mas corto (duracion_propio): el mayor tramo que lo
 *           deja en 2.5x o menos, o el mas corto si ninguno alcanza. Decision
 *           del efecto (2026-10-09). Con `propioCorto: false` no se propone.
 *   cierre  la ultima toma: el menor tramo que cubre su ventana.
 *
 * Devuelve { pasos: [{ de, a, ventana, duracion, duracion_propio? }],
 *            cierre: { toma, ventana, duracion }, detalle: [...], duracion: T }
 */
export function proponerDuraciones(m, tiempos, { reglas = REGLAS_CONTINUIDAD, propioCorto = true } = {}) {
  const ventanas = ventanasDeFrases(m, tiempos);
  const ts = tramosDeVideo();
  const pasoPara = (propio, ventana) => ts.find((p) => propio + p >= ventana - EPS) ?? ts[ts.length - 1];
  const pasos = [];
  const detalle = [];
  let cierre = null;

  for (const [i, w] of ventanas.entries()) {
    const t = w.toma;
    const ventana = r2(w.ventana);
    if (w.ultima) {
      const duracion = tramoQueCubre(w.ventana);
      cierre = { toma: t.n, ventana, duracion };
      detalle.push({ rol: 'cierre', de: t.n, tipo: t.tipo, ini: w.ini, obj: w.obj, ventana: w.ventana, clips: [duracion], sinPrestamo: duracion / w.ventana });
      continue;
    }
    const sig = ventanas[i + 1].toma;
    if (t.tipo !== 'B') {
      const duracion = tramoQueCubre(w.ventana);
      pasos.push({ de: t.n, a: sig.n, ventana, duracion });
      detalle.push({ rol: 'paso', de: t.n, a: sig.n, tipo: t.tipo, ini: w.ini, obj: w.obj, ventana: w.ventana, clips: [duracion], sinPrestamo: duracion / w.ventana });
      continue;
    }
    // Toma B: el propio de siempre (el tramo que se le pide hoy a t.duracion).
    const deSiempre = esNumero(t.duracion) ? (duracionPara(modeloPrincipal(), t.duracion) ?? ts[ts.length - 1]) : ts[0];
    let propio = deSiempre;
    let paso = pasoPara(propio, w.ventana);
    if (propioCorto && (propio + paso) / w.ventana > reglas.fuerte + EPS) {
      const candidatos = ts.filter((d) => d < deSiempre).sort((x, y) => y - x);
      const alcanza = candidatos.find((d) => (d + pasoPara(d, w.ventana)) / w.ventana <= reglas.fuerte + EPS);
      const elegido = alcanza ?? candidatos[candidatos.length - 1];
      if (elegido !== undefined) {
        propio = elegido;
        paso = pasoPara(propio, w.ventana);
      }
    }
    pasos.push({ de: t.n, a: sig.n, ventana, duracion: paso, ...(propio !== deSiempre ? { duracion_propio: propio } : {}) });
    detalle.push({
      rol: 'paso',
      de: t.n,
      a: sig.n,
      tipo: 'B',
      ini: w.ini,
      obj: w.obj,
      ventana: w.ventana,
      clips: [propio, paso],
      propioDeSiempre: deSiempre,
      sinPrestamo: (propio + paso) / w.ventana,
    });
  }
  return { pasos, cierre, detalle, duracion: tiempos.duracion };
}

// ---------------------------------------------------------------- cadena

/**
 * Los clips de la cadena, en orden. Funcion pura: la usan los videos, el plan,
 * revisar-voces, revisar-videos y estimar-video.
 *
 *   Toma             Clip                Inicio                  Llegada                   Prompt
 *   A o C, no ultima paso-k.mp4          toma-k-inicial.png      toma-(k+1)-inicial.png    el del paso
 *   B, no ultima     toma-k.mp4 (propio) toma-k-inicial.png      toma-k-final.png          el del estilo
 *   B, no ultima     paso-k.mp4          toma-k-final.png        toma-(k+1)-inicial.png    el del paso
 *   Ultima           toma-N.mp4 (cierre) toma-N-inicial.png      toma-N-final.png si es B  el del estilo
 *
 * "k+1" es siempre la toma siguiente en el array, no n+1.
 *
 * Cada clip: { rol: 'paso'|'propio'|'cierre', id, archivo, linea (la toma
 * cuya frase cubre), deToma, aToma (solo pasos), tipoToma, prompt,
 * imagenInicial, imagenFinal, segundos (lo que se pide; en el propio sin
 * duracion_propio es t.duracion, como hoy), tramo (el tramo de Omni que cubre
 * `segundos`), estimado; los pasos ademas forma, revisar y sinPrompt; el
 * propio y el cierre, cabeceraAjustada }.
 *
 * El prompt del propio con duracion_propio y el del cierre van con el numero
 * de su cabecera cambiado al largo que se pide (ajustarCabecera). El propio
 * sin duracion_propio va exactamente como hoy.
 *
 * Un paso que todavia no esta escrito sale con prompt null y segundos null.
 * Con `estimar: true` sus segundos (y los del cierre) se rellenan: con
 * `tiempos`, lo que propondria --duraciones; sin tiempos, la duracion de la
 * toma (4 s en el paso de una B). Esos clips llevan `estimado: true`.
 */
export function cadenaDeClips(m, { estimar = false, tiempos = null } = {}) {
  const tomas = (Array.isArray(m?.tomas) ? m.tomas : []).filter(esObjeto);
  const c = esObjeto(m?.continuidad) ? m.continuidad : {};
  const pasos = (Array.isArray(c.pasos) ? c.pasos : []).filter(esObjeto);
  const cierre = esObjeto(c.cierre) ? c.cierre : null;

  let propuesta = null;
  if (estimar && tiempos) {
    try {
      propuesta = proponerDuraciones(m, tiempos);
    } catch {
      propuesta = null; // sin tiempos que cuadren se estima con las tomas
    }
  }
  const propuestaDe = (n) => propuesta?.pasos.find((x) => x.de === n) ?? null;
  const tramoDe = (s) => (esNumero(s) && s > 0 ? duracionPara(modeloPrincipal(), s) : null);
  const tramoMinimo = tramosDeVideo()[0];

  const out = [];
  tomas.forEach((t, i) => {
    const ultima = i === tomas.length - 1;
    const sig = tomas[i + 1];
    const p = pasos.find((x) => x.de === t.n) ?? null;

    if (t.tipo === 'B' || ultima) {
      let segundos;
      let estimado = false;
      // Se pide con otro largo que el de la toma: la cabecera dice ese largo.
      let otroLargo = false;
      if (ultima) {
        segundos = esNumero(cierre?.duracion) ? cierre.duracion : null;
        otroLargo = segundos !== null;
        if (segundos === null && estimar) {
          segundos = propuesta?.cierre?.duracion ?? t.duracion;
          estimado = true;
        }
      } else {
        let dp = esNumero(p?.duracion_propio) ? p.duracion_propio : null;
        if (dp === null && !p && estimar && esNumero(propuestaDe(t.n)?.duracion_propio)) {
          dp = propuestaDe(t.n).duracion_propio;
          estimado = true;
        }
        otroLargo = dp !== null;
        segundos = otroLargo ? dp : t.duracion;
      }
      const prompt = otroLargo ? ajustarCabecera(t.prompt_video, segundos) : t.prompt_video;
      out.push({
        rol: ultima ? 'cierre' : 'propio',
        id: `toma-${t.n}`,
        archivo: `toma-${t.n}.mp4`,
        linea: t.n,
        deToma: t.n,
        aToma: null,
        tipoToma: t.tipo,
        prompt,
        cabeceraAjustada: prompt !== t.prompt_video,
        imagenInicial: `toma-${t.n}-inicial.png`,
        imagenFinal: t.tipo === 'B' ? `toma-${t.n}-final.png` : null,
        segundos,
        tramo: tramoDe(segundos),
        estimado,
      });
    }

    if (!ultima) {
      let segundos = esNumero(p?.duracion) ? p.duracion : null;
      let estimado = false;
      if (segundos === null && estimar) {
        segundos = propuestaDe(t.n)?.duracion ?? (t.tipo === 'B' ? tramoMinimo : t.duracion);
        estimado = true;
      }
      out.push({
        rol: 'paso',
        id: `paso-${t.n}`,
        archivo: `paso-${t.n}.mp4`,
        linea: t.n,
        deToma: t.n,
        aToma: sig.n,
        tipoToma: t.tipo,
        prompt: esTexto(p?.prompt_video) ? p.prompt_video : null,
        imagenInicial: t.tipo === 'B' ? `toma-${t.n}-final.png` : `toma-${t.n}-inicial.png`,
        imagenFinal: `toma-${sig.n}-inicial.png`,
        segundos,
        tramo: tramoDe(segundos),
        forma: p?.forma ?? null,
        revisar: p?.revisar === true,
        sinPrompt: !esTexto(p?.prompt_video),
        estimado,
      });
    }
  });
  return out;
}

/**
 * Filtra la cadena para una corrida parcial de videos.
 *   soloTomas [K]  todo lo que toca las imagenes de K: paso-(anterior), toma-K
 *                  si es B o la ultima, y paso-K.
 *   soloPasos [K]  solo paso-K.
 * Con los dos, la union. Sin ninguno, la cadena entera.
 */
export function filtrarCadena(cadena, { soloTomas = null, soloPasos = null } = {}) {
  if (!soloTomas && !soloPasos) return cadena;
  return cadena.filter((c) => {
    if (soloPasos && c.rol === 'paso' && soloPasos.includes(c.deToma)) return true;
    if (soloTomas) {
      if (c.rol === 'paso') return soloTomas.includes(c.deToma) || soloTomas.includes(c.aToma);
      return soloTomas.includes(c.linea);
    }
    return false;
  });
}

/** Cuantos clips de cada clase: { pasos, propios, cierre, total }. */
export function cuentaDeCadena(cadena) {
  const pasos = cadena.filter((c) => c.rol === 'paso').length;
  const propios = cadena.filter((c) => c.rol === 'propio').length;
  const cierre = cadena.filter((c) => c.rol === 'cierre').length;
  return { pasos, propios, cierre, total: cadena.length };
}

/** "34 (28 pasos + 5 propios B + 1 cierre)". */
export function textoCuenta(cadena) {
  const k = cuentaDeCadena(cadena);
  return `${k.total} (${k.pasos} paso${k.pasos === 1 ? '' : 's'} + ${k.propios} propio${k.propios === 1 ? '' : 's'} B + ${k.cierre} cierre)`;
}

/**
 * Las referencias GENERADAS que solo usaba el B-roll descartado: con
 * continuidad no se generan (no hay quien las use). Cuenta como uso el de las
 * tomas, el de un B-roll que quedara y el de una hoja usada que las pida.
 */
export function referenciasSoloDelBrollDescartado(m) {
  if (!tieneContinuidad(m) || !esObjeto(m.continuidad)) return new Set();
  const descartado = Array.isArray(m.continuidad.broll_descartado) ? m.continuidad.broll_descartado : [];
  const enDescartado = new Set(descartado.flatMap((b) => (Array.isArray(b?.referencias) ? b.referencias : [])));
  if (!enDescartado.size) return new Set();
  const lista = listaDeReferencias(m);
  const usadas = new Set();
  for (const b of [...(Array.isArray(m.tomas) ? m.tomas : []), ...(Array.isArray(m.broll) ? m.broll : [])]) {
    for (const v of Array.isArray(b?.referencias) ? b.referencias : []) usadas.add(v);
  }
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const r of lista) {
      if (!usadas.has(r.id) || !Array.isArray(r.referencias)) continue;
      for (const o of r.referencias) {
        if (!usadas.has(o)) {
          usadas.add(o);
          cambio = true;
        }
      }
    }
  }
  return new Set(lista.filter((r) => esGenerada(r) && enDescartado.has(r.id) && !usadas.has(r.id)).map((r) => r.id));
}

/**
 * Costo de la cadena con el modelo principal. Lo que falta por escribir se
 * estima (ver cadenaDeClips con estimar) y se marca.
 */
export function costoDeCadena(m, { tiempos = null, resolucion = RESOLUCION_VIDEO } = {}) {
  const cadena = cadenaDeClips(m, { estimar: true, tiempos });
  let creditos = 0;
  let segundos = 0;
  const excedidos = [];
  for (const c of cadena) {
    const r = esNumero(c.segundos) ? creditosClip(modeloPrincipal(), c.segundos, resolucion) : { excedeTope: true };
    if (r.excedeTope) {
      excedidos.push(c.archivo);
      continue;
    }
    creditos += r.creditos;
    segundos += r.duracion;
  }
  return {
    cadena,
    clips: cadena.length,
    creditos,
    usd: creditosAUsd(creditos),
    segundos,
    estimado: cadena.some((c) => c.estimado),
    excedidos,
  };
}

// ---------------------------------------------------------------- validador

/** Lineas del prompt que no son la cabecera ni Camera/Motion (esas las reescribe el paso). */
function lineasFijas(prompt) {
  if (!esTexto(prompt)) return [];
  const lineas = prompt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  // Un prompt de un solo parrafo (crochet): se compara frase por frase.
  const trozos =
    lineas.length > 1
      ? lineas.slice(1)
      : lineas[0]
          .split(/(?<=[.!?])\s+(?=[A-Z"“¿¡])/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(1);
  return trozos.filter((l) => !/^(camera|motion)\b/i.test(l));
}
const normalizarEspacios = (s) => String(s).replace(/\s+/g, ' ').trim();

/** Avisos sobre el texto de un prompt de paso. */
function revisarPromptDePaso(p, t, sig, id, av) {
  const prompt = p.prompt_video;
  const primera = prompt.split(/\r?\n/)[0];
  const escrito = segundosDeCabecera(prompt);
  if (!/START frame\b.*\bEND frame/i.test(primera)) {
    av(`${id}: la primera linea del prompt no dice "image-to-video from the START frame to the END frame, ${p.duracion}s." (va con la cabecera del look de la toma ${t.n}).`);
  } else if (escrito === null) {
    av(`${id}: la cabecera del prompt no trae el largo (", ${p.duracion}s.").`);
  }
  if (escrito !== null && esNumero(p.duracion) && escrito !== p.duracion) {
    av(`${id}: la cabecera del prompt dice "${escrito}s" y "duracion" es ${p.duracion}. Tienen que coincidir: es el largo que se le pide al modelo.`);
  }

  // Lo que esta igual en los prompts de las dos tomas va tal cual en el paso.
  const enPaso = normalizarEspacios(prompt);
  const deSig = new Set(lineasFijas(sig.prompt_video).map(normalizarEspacios));
  const comunes = [...new Set(lineasFijas(t.prompt_video).map(normalizarEspacios))].filter((l) => deSig.has(l));
  const faltan = comunes.filter((l) => !enPaso.includes(l));
  if (faltan.length) {
    const corto = (s) => (s.length > 90 ? `${s.slice(0, 87)}...` : s);
    av(
      `${id}: le falta${faltan.length > 1 ? 'n' : ''} ${faltan.length} linea(s) que estan iguales en los prompts de la toma ${t.n} y de la ${sig.n}; ` +
        `van tal cual en el paso:\n` +
        faltan.map((l) => `         - "${corto(l)}"\n`).join('').replace(/\n$/, '')
    );
  }

  // Palabras de editor. No cuenta lo copiado tal cual de las tomas, linea o
  // frase (la linea de rigidez Lego dice "melt or morph" y tiene que ir).
  const fuentes = [t.prompt_video, sig.prompt_video].filter(esTexto).map(normalizarEspacios);
  const copiado = (s) => fuentes.some((f) => f.includes(s));
  const propio = prompt
    .split(/\r?\n/)
    .map(normalizarEspacios)
    .filter((l) => l && !copiado(l))
    .flatMap((l) => l.split(/(?<=[.!?])\s+/).filter((s) => s && !copiado(s)))
    .filter((s) => s.toLowerCase() !== FRASE_TOMA_CONTINUA.toLowerCase())
    .join('\n');
  const prohibidas = [...new Set([...propio.matchAll(RE_PALABRAS_DE_EDITOR)].map((x) => x[1].toLowerCase()))];
  if (prohibidas.length) {
    av(
      `${id}: el prompt usa ${prohibidas.map((x) => `"${x}"`).join(', ')}. Eso le pide al modelo un efecto de editor: el paso es un recorrido fisico ` +
        '(que pasa por delante del lente y que queda fijo). Si es una accion real de la escena (algo que se disuelve en agua), ignora este aviso.'
    );
  }
  if (!enPaso.toLowerCase().includes(FRASE_SIN_EFECTOS.toLowerCase())) {
    av(`${id}: el prompt no trae "${FRASE_SIN_EFECTOS}".`);
  }
}

/**
 * Reglas del bloque "continuidad". validar-manifiesto.js lo llama SOLO si el
 * manifiesto lo trae. Empuja a E (errores) y A (avisos) si se pasan, y
 * devuelve { errores, avisos } igual.
 *
 * `exigirPasos` (lo pasa generar-videos.js): faltan pasos, prompts, el cierre,
 * o hay un "revisar": true -> error. Sin el, eso es un aviso: es lo normal
 * antes de imagenes y audio.
 */
export function validarContinuidad(m, { carpeta = null, exigirPasos = false, E = null, A = null } = {}) {
  const errores = [];
  const avisos = [];
  const err = (s) => {
    errores.push(s);
    if (E) E(s);
  };
  const av = (s) => {
    avisos.push(s);
    if (A) A(s);
  };
  const cmd = carpeta ? path.relative(process.cwd(), carpeta).replace(/\\/g, '/') || '.' : '<carpeta>';
  const c = m.continuidad;

  if (!esObjeto(c)) {
    err(`"continuidad" tiene que ser un objeto: { "version": 1, "broll_descartado": [...], "pasos": [...] } — llego ${JSON.stringify(c)}. Lo arma: npm run continuidad -- ${cmd} --preparar`);
    return { errores, avisos };
  }
  if (c.version !== VERSION_CONTINUIDAD) {
    err(`continuidad: "version" tiene que ser ${VERSION_CONTINUIDAD} — llego ${JSON.stringify(c.version)}`);
  }
  if (m.modo_audio !== 'voz_en_off') {
    err(
      `continuidad es solo para anuncios con narrador en voz en off ("modo_audio": "voz_en_off") y este es ${JSON.stringify(m.modo_audio)}. ` +
        'Donde la voz vive dentro del clip o se canta, encadenar los videos la rompe.'
    );
  }
  if (!ESTILOS_CON_CONTINUIDAD.includes(m.estilo)) {
    err(`continuidad no esta disponible para el estilo ${JSON.stringify(m.estilo)}. Estilos con continuidad: ${ESTILOS_CON_CONTINUIDAD.join(', ')}.`);
  }
  if (Array.isArray(m.broll) && m.broll.length > 0) {
    err(
      `con continuidad no hay B-roll: "broll" tiene que ir vacio (trae ${m.broll.length}). Se generaria y se cobraria igual. ` +
        `El del estilo se guarda en continuidad.broll_descartado: npm run continuidad -- ${cmd} --preparar`
    );
  }
  if (c.broll_descartado !== undefined && !Array.isArray(c.broll_descartado)) {
    err('continuidad: "broll_descartado" tiene que ser un array (el B-roll del estilo, tal cual)');
  }
  if (c.pasos !== undefined && !Array.isArray(c.pasos)) {
    err('continuidad: "pasos" tiene que ser un array (vacio hasta que se escriban)');
  }

  const tomas = (Array.isArray(m.tomas) ? m.tomas : []).filter(esObjeto);
  if (tomas.length < 2) {
    err(`continuidad necesita al menos 2 tomas: cada video va de una toma a la siguiente (hay ${tomas.length}).`);
    return { errores, avisos };
  }

  const tramos = tramosDeVideo();
  const listaTramos = `${tramos.join(', ')} (los tramos de ${modeloPrincipal()})`;
  const indice = new Map(tomas.map((t, i) => [t.n, i]));
  const pasos = Array.isArray(c.pasos) ? c.pasos : [];
  const vistos = new Map();
  const sinPrompt = [];
  const aRevisar = [];
  let ultimoIndice = -1;

  pasos.forEach((p, i) => {
    if (!esObjeto(p)) {
      err(`continuidad.pasos[${i}]: cada paso es un objeto { "de", "a", "ventana", "duracion", "prompt_video" } — llego ${JSON.stringify(p)}`);
      return;
    }
    const id = `paso ${p.de}->${p.a}`;
    const k = indice.get(p.de);
    if (k === undefined) {
      err(`continuidad.pasos[${i}]: "de" es ${JSON.stringify(p.de)} y no hay ninguna toma con ese numero.`);
      return;
    }
    if (k === tomas.length - 1) {
      err(`${id}: sale de la ultima toma (${p.de}). La ultima no tiene paso: cierra con su propio video (continuidad.cierre).`);
      return;
    }
    const t = tomas[k];
    const sig = tomas[k + 1];
    if (p.a !== sig.n) {
      err(`${id}: "a" tiene que ser ${sig.n}, la toma que sigue a la ${p.de} en "tomas" — llego ${JSON.stringify(p.a)}.`);
    }
    if (vistos.has(p.de)) {
      err(`${id}: paso repetido (ya hay otro que sale de la toma ${p.de}).`);
      return;
    }
    if (k < ultimoIndice) {
      err(`${id}: esta fuera de orden. Los pasos van en el orden de "tomas".`);
    }
    ultimoIndice = Math.max(ultimoIndice, k);
    vistos.set(p.de, p);

    if (!tramos.includes(p.duracion)) {
      err(`${id}: "duracion" tiene que ser ${listaTramos} — llego ${JSON.stringify(p.duracion)}. La calcula: npm run continuidad -- ${cmd} --duraciones`);
    }
    if (p.duracion_propio !== undefined) {
      if (t.tipo !== 'B') {
        err(`${id}: "duracion_propio" es solo para las tomas B (las que tienen imagen inicial y final y su propio video). La toma ${p.de} es ${t.tipo}.`);
      } else if (!tramos.includes(p.duracion_propio)) {
        err(`${id}: "duracion_propio" tiene que ser ${listaTramos} — llego ${JSON.stringify(p.duracion_propio)}.`);
      }
    }
    if (p.prompt_video !== undefined && p.prompt_video !== null && typeof p.prompt_video !== 'string') {
      err(`${id}: "prompt_video" tiene que ser texto.`);
    } else if (!esTexto(p.prompt_video)) {
      sinPrompt.push(id);
    } else {
      revisarPromptDePaso(p, t, sig, id, av);
    }
    if (p.referencias !== undefined && !(Array.isArray(p.referencias) && p.referencias.length === 0)) {
      err(
        `${id}: un paso no lleva "referencias". Va con su imagen de salida y su imagen de llegada como primer y ultimo cuadro, ` +
          `y ${modeloPrincipal()} no deja mezclar referencias con cuadros.`
      );
    }
    if (p.forma !== undefined && p.forma !== null && !FORMAS.includes(p.forma)) {
      av(`${id}: "forma" es ${JSON.stringify(p.forma)} y no es una de las 6: ${FORMAS.join(', ')}.`);
    }
    if (p.revisar === true) aRevisar.push(id);
  });

  // Cierre: el video de la ultima toma.
  const ultima = tomas[tomas.length - 1];
  let faltaCierre = false;
  if (c.cierre === undefined || c.cierre === null) {
    faltaCierre = true;
  } else if (!esObjeto(c.cierre)) {
    err(`continuidad: "cierre" tiene que ser { "toma": ${ultima.n}, "ventana": ..., "duracion": ... } — llego ${JSON.stringify(c.cierre)}`);
  } else {
    if (c.cierre.toma !== ultima.n) {
      err(`continuidad.cierre: "toma" tiene que ser ${ultima.n}, la ultima toma — llego ${JSON.stringify(c.cierre.toma)}.`);
    }
    if (!tramos.includes(c.cierre.duracion)) {
      err(`continuidad.cierre: "duracion" tiene que ser ${listaTramos} — llego ${JSON.stringify(c.cierre.duracion)}.`);
    }
  }

  // Lo que falta por escribir: normal antes de imagenes y audio; error al pedir videos.
  const faltan = tomas.slice(0, -1).filter((t) => !vistos.has(t.n));
  const nombreFalta = (t) => `${t.n}->${tomas[indice.get(t.n) + 1].n}`;
  const cuantos = faltan.length === tomas.length - 1 ? `los ${faltan.length} pasos` : `${faltan.length} de ${tomas.length - 1} pasos (${listaCorta(faltan.map(nombreFalta))})`;
  if (exigirPasos) {
    if (faltan.length) {
      err(`faltan ${cuantos}. Sin ellos no se generan los videos: npm run continuidad -- ${cmd} --duraciones y despues los prompts (--pares).`);
    }
    if (faltaCierre) err(`falta continuidad.cierre (el video de la ultima toma). Lo escribe: npm run continuidad -- ${cmd} --duraciones`);
    if (sinPrompt.length === 1) {
      err(`${sinPrompt[0]}: "prompt_video" vacio. Se escribe mirando sus dos imagenes: npm run continuidad -- ${cmd} --pares`);
    } else if (sinPrompt.length > 1) {
      err(`${sinPrompt.length} pasos con "prompt_video" vacio (${listaCorta(sinPrompt.map((id) => id.replace('paso ', '')))}). Se escriben mirando sus dos imagenes: npm run continuidad -- ${cmd} --pares`);
    }
    for (const id of aRevisar) {
      err(
        `${id} tiene "revisar": true: se rehizo una de sus imagenes y su prompt se escribio mirando la anterior. ` +
          'Miralo de nuevo (--pares), corrige el prompt si hace falta y borra "revisar".'
      );
    }
  } else {
    if (faltan.length || faltaCierre) {
      const que = [...(faltan.length ? [cuantos] : []), ...(faltaCierre ? ['el cierre'] : [])].join(' y ');
      av(
        `continuidad: faltan ${que}. Es lo normal antes de imagenes y audio: se escriben despues de imagenes y audio ` +
          `(npm run continuidad -- ${cmd} --duraciones y --pares). Los videos no arrancan sin ellos.`
      );
    }
    if (sinPrompt.length) {
      av(`continuidad: ${sinPrompt.length} paso(s) sin "prompt_video" todavia (${listaCorta(sinPrompt.map((id) => id.replace('paso ', '')))}). Los videos no arrancan sin ellos.`);
    }
    for (const id of aRevisar) {
      av(`${id} tiene "revisar": true: se rehizo una de sus imagenes. Revisa su prompt mirando la imagen nueva y borra "revisar"; los videos no arrancan mientras este.`);
    }
  }

  // Referencias que solo usaba el B-roll descartado.
  for (const id of referenciasSoloDelBrollDescartado(m)) {
    av(`la referencia "${id}" solo la usa el B-roll descartado (continuidad.broll_descartado): con continuidad no se genera.`);
  }

  if (carpeta) {
    if (fs.existsSync(path.join(carpeta, 'transiciones.json'))) {
      av('existe transiciones.json: con continuidad se ignora (el paso entre escenas lo hace el video, no el editor).');
    }
    const rutaTiempos = path.join(carpeta, 'audio', 'tiempos.json');
    if (fs.existsSync(rutaTiempos)) {
      let tiempos = null;
      try {
        tiempos = JSON.parse(fs.readFileSync(rutaTiempos, 'utf8'));
      } catch (e) {
        av(`audio/tiempos.json no es JSON valido (${e.message}): no se pudieron revisar las ventanas.`);
      }
      if (tiempos) revisarContraTiempos(m, tiempos, { cmd, av });
    }
  }

  return { errores, avisos };
}

/** Avisos que salen de comparar el bloque con los tiempos reales de la voz. */
function revisarContraTiempos(m, tiempos, { cmd, av }) {
  let propuesta;
  try {
    propuesta = proponerDuraciones(m, tiempos);
  } catch (e) {
    av(e.message.replace(/<carpeta>/g, cmd));
    return;
  }
  const c = m.continuidad;
  const movidas = [];
  for (const p of (Array.isArray(c.pasos) ? c.pasos : []).filter(esObjeto)) {
    const q = propuesta.pasos.find((x) => x.de === p.de);
    if (q && esNumero(p.ventana) && Math.abs(p.ventana - q.ventana) > TOLERANCIA_VENTANA) {
      movidas.push(`${p.de}->${p.a} (${p.ventana}s, medida ${q.ventana}s)`);
    }
  }
  if (esObjeto(c.cierre) && esNumero(c.cierre.ventana) && Math.abs(c.cierre.ventana - propuesta.cierre.ventana) > TOLERANCIA_VENTANA) {
    movidas.push(`cierre ${c.cierre.toma} (${c.cierre.ventana}s, medida ${propuesta.cierre.ventana}s)`);
  }
  if (movidas.length) {
    av(
      `la ventana de ${movidas.length} paso(s) ya no coincide con audio/tiempos.json: el audio cambio y hay que recalcular las duraciones ` +
        `(npm run continuidad -- ${cmd} --duraciones). ${movidas.join(', ')}.`
    );
  }
  try {
    const pred = planearContinuidad({ manifiesto: m, tiempos, largos: null });
    const fuertes = pred.clips.filter((x) => x.velocidad > REGLAS_CONTINUIDAD.fuerte + EPS);
    if (fuertes.length) {
      av(
        `prediccion: ${fuertes.length} clip(s) irian a mas de ${REGLAS_CONTINUIDAD.fuerte.toFixed(1)}x aun prestando tiempo: ` +
          `${fuertes.map((x) => `${x.archivo.replace('.mp4', '')} ${x.velocidad.toFixed(2)}x`).join(', ')}. ` +
          `Baja la duracion pedida (o la del propio de la toma B) antes de pagar. Detalle: npm run plan -- ${cmd} --prediccion`
      );
    }
  } catch (e) {
    av(`prediccion de velocidades: ${e.message}`);
  }
}

/**
 * El resumen de trabajo con continuidad (validar-manifiesto.js lo agrega como
 * resumen.continuidad): { pasos, faltan, propios, cierre, clips, segundos,
 * creditos, usd, estimado }. Lo que falta por escribir se estima (con
 * audio/tiempos.json si esta en `carpeta`; si no, con la duracion de cada
 * toma) y va con estimado: true.
 */
export function resumenContinuidad(m, { carpeta = null, tiempos = null } = {}) {
  if (!tiempos && carpeta) {
    try {
      const ruta = path.join(carpeta, 'audio', 'tiempos.json');
      if (fs.existsSync(ruta)) tiempos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    } catch {
      tiempos = null;
    }
  }
  const tomas = (Array.isArray(m.tomas) ? m.tomas : []).filter(esObjeto);
  const pasosEsperados = Math.max(0, tomas.length - 1);
  const escritos = new Set(
    (esObjeto(m.continuidad) && Array.isArray(m.continuidad.pasos) ? m.continuidad.pasos : [])
      .filter(esObjeto)
      .map((p) => p.de)
      .filter((n) => tomas.slice(0, -1).some((t) => t.n === n))
  );
  const costo = costoDeCadena(m, { tiempos });
  const k = cuentaDeCadena(costo.cadena);
  let conTiempos = false;
  if (costo.estimado && tiempos) {
    try {
      proponerDuraciones(m, tiempos);
      conTiempos = true;
    } catch {
      conTiempos = false;
    }
  }
  return {
    pasos: pasosEsperados,
    faltan: pasosEsperados - escritos.size,
    propios: k.propios,
    cierre: k.cierre,
    clips: costo.clips,
    segundos: costo.segundos,
    creditos: costo.creditos,
    usd: Number(costo.usd.toFixed(2)),
    estimado: costo.estimado,
    estimadoCon: costo.estimado ? (conTiempos ? 'tiempos' : 'tomas') : null,
  };
}

// ---------------------------------------------------------------- montaje

/** Largo real de un clip: cuadros / fps del stream de video (no el contenedor: Omni da 4.010 s de contenedor para 96 cuadros = 4.000 s). */
export function medirClip(rutaVideo) {
  const salida = execFileSync(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=nb_frames,r_frame_rate,avg_frame_rate,duration', '-show_entries', 'format=duration', '-of', 'json', rutaVideo],
    { encoding: 'utf8' }
  );
  const j = JSON.parse(salida);
  const s = j.streams?.[0] ?? {};
  const fraccion = (x) => {
    const [a, b] = String(x ?? '').split('/').map(Number);
    return a > 0 && b > 0 ? a / b : null;
  };
  const fps = fraccion(s.r_frame_rate) ?? fraccion(s.avg_frame_rate);
  const frames = Number(s.nb_frames);
  if (Number.isInteger(frames) && frames > 0 && fps) return { segundos: frames / fps, frames, fps };
  const d = Number(s.duration) || Number(j.format?.duration);
  return { segundos: d, frames: fps && d ? Math.round(d * fps) : null, fps: fps ?? null, aproximado: true };
}

/** Map archivo -> medida de los clips de la cadena que estan en disco (los que faltan no entran). */
export function medirCadena(dirVideo, cadena) {
  const largos = new Map();
  for (const c of cadena) {
    const ruta = path.join(dirVideo, c.archivo);
    if (fs.existsSync(ruta)) largos.set(c.archivo, medirClip(ruta));
  }
  return largos;
}

/**
 * Clips de la cadena que YA estan en video/ y tienen otro largo que el que se
 * pide ahora en el manifiesto. `npm run videos` sin --rehacer los reusa tal
 * cual (los salta como "ya generados") y el montaje les cambia la velocidad
 * para cubrir su frase:
 *   - un paso con otro largo que continuidad.pasos[].duracion (se rehizo la
 *     voz y --duraciones lo paso de 4 a 6 s, o al reves);
 *   - el propio de una B con duracion_propio y otro largo (era de 6 s y se
 *     pide de 4, o al reves). El propio SIN duracion_propio no se revisa: se
 *     pide como hoy y se reusa como hoy;
 *   - el cierre mas corto que continuidad.cierre.duracion (menos 0,1 s): el
 *     ultimo clip tendria que ir lento para llegar al final del audio.
 * `fuera`: archivos que no se revisan (los que la corrida actual vuelve a
 * pedir). Un clip que no se puede medir (sin ffprobe) no se avisa: el montaje
 * lo mide igual. Devuelve [{ clip, largo, pedido }] en el orden de la cadena.
 */
export function clipsConOtroLargo(m, dirVideo, { fuera = [], medir = medirClip } = {}) {
  const excluidos = new Set(fuera);
  const pasos = (Array.isArray(m?.continuidad?.pasos) ? m.continuidad.pasos : []).filter(esObjeto);
  const out = [];
  for (const c of cadenaDeClips(m)) {
    if (excluidos.has(c.archivo)) continue;
    let pedido = c.segundos;
    if (c.rol === 'propio') pedido = pasos.find((p) => p.de === c.linea)?.duracion_propio;
    if (!esNumero(pedido)) continue;
    const ruta = path.join(dirVideo, c.archivo);
    if (!fs.existsSync(ruta)) continue;
    let largo;
    try {
      largo = medir(ruta).segundos;
    } catch {
      continue;
    }
    if (!esNumero(largo)) continue;
    const mal = c.rol === 'cierre' ? largo < pedido - 0.1 : Math.abs(largo - pedido) > 0.1;
    if (mal) out.push({ clip: c, largo, pedido });
  }
  return out;
}

/**
 * El aviso de clipsConOtroLargo, listo para imprimir (vacio si no hay nada).
 * Lo usan `npm run videos` (con `fuera` = lo que esa corrida pide) y
 * `--duraciones` (que no pide nada: revisa todo lo que hay en video/).
 * Lleva el comando que los vuelve a pedir con su largo: los propios y el
 * cierre juntos en un solo --tomas (que tambien rehace los pasos que tocan
 * esas tomas; en una sola corrida, un paso entre dos de ellas se paga una
 * vez), los pasos juntos en un --pasos (solo esos pasos). Un paso que ya
 * rehace el --tomas de este aviso no se repite en el --pasos.
 */
export function avisosDeLargo(m, dirVideo, { fuera = [], carpetaArg = '<carpeta>', medir = medirClip } = {}) {
  const malos = clipsConOtroLargo(m, dirVideo, { fuera, medir });
  if (!malos.length) return [];
  const cadena = cadenaDeClips(m);
  const pasosMalos = new Map(malos.filter((x) => x.clip.rol === 'paso').map((x) => [x.clip.archivo, x]));
  const cubiertos = new Set();
  const L = [];
  const tomasMalas = malos.filter((x) => x.clip.rol !== 'paso');
  if (tomasMalas.length) {
    const uno = tomasMalas.length === 1;
    const lineas = tomasMalas.map((x) => x.clip.linea).join(',');
    const propias = new Set(tomasMalas.map((x) => x.clip.archivo));
    const vecinos = filtrarCadena(cadena, { soloTomas: tomasMalas.map((x) => x.clip.linea) }).filter((x) => !propias.has(x.archivo));
    const tambien = vecinos.filter((x) => fs.existsSync(path.join(dirVideo, x.archivo))).map((x) => x.archivo);
    const vecinosMalos = vecinos.filter((x) => pasosMalos.has(x.archivo)).map((x) => pasosMalos.get(x.archivo));
    for (const x of vecinosMalos) cubiertos.add(x.clip.archivo);
    const pide = uno ? ' Pidelo de nuevo con su largo:' : '';
    for (const { clip: c, largo, pedido } of tomasMalas) {
      L.push(
        c.rol === 'cierre'
          ? `  OJO: video/${c.archivo} ya existe y dura ${largo.toFixed(2)}s, pero el cierre se pide de ${pedido}s (continuidad.cierre.duracion).\n` +
              `       Asi el ultimo clip tendria que ir mas lento para llegar al final del audio.${pide}`
          : `  OJO: video/${c.archivo} ya existe y dura ${largo.toFixed(2)}s, pero se pide de ${pedido}s ("duracion_propio" del paso ${c.linea}).\n` +
              `       Se reusaria con el largo viejo y su frase iria a otra velocidad.${pide}`
      );
    }
    L.push(
      ...(uno ? [] : ['       Pidelos de nuevo con su largo, en una sola corrida (un paso entre dos de esas tomas se pide una sola vez):']),
      `           npm run videos -- ${carpetaArg} --tomas ${lineas} --rehacer`,
      ...(tambien.length
        ? [`       (con --rehacer, --tomas ${lineas} vuelve a pedir tambien ${tambien.join(', ')}; el costo se muestra antes de cobrar)`]
        : []),
      ...vecinosMalos.map(
        (x) => `       (${x.clip.archivo} tambien tiene otro largo: dura ${x.largo.toFixed(2)}s y se pide de ${x.pedido}s; ese comando ya lo pide de nuevo)`
      ),
      ''
    );
  }
  const pasos = [...pasosMalos.values()].filter((x) => !cubiertos.has(x.clip.archivo));
  if (pasos.length === 1) {
    const { clip: c, largo, pedido } = pasos[0];
    L.push(
      `  OJO: video/${c.archivo} ya existe y dura ${largo.toFixed(2)}s, pero el paso ${c.deToma}->${c.aToma} se pide de ${pedido}s (continuidad.pasos[].duracion).\n` +
        '       Se reusaria con el largo viejo y su frase iria a otra velocidad. Pidelo de nuevo con su largo (solo ese paso):',
      `           npm run videos -- ${carpetaArg} --pasos ${c.deToma} --rehacer`,
      ''
    );
  } else if (pasos.length > 1) {
    L.push(`  OJO: ${pasos.length} pasos ya existen con otro largo que el que se pide ahora (continuidad.pasos[].duracion):`);
    for (const { clip: c, largo, pedido } of pasos) {
      L.push(`           video/${c.archivo.padEnd(12)} dura ${largo.toFixed(2)}s, el paso ${c.deToma}->${c.aToma} se pide de ${pedido}s`);
    }
    L.push(
      '       Se reusarian con el largo viejo y sus frases irian a otra velocidad. Pidelos de nuevo con su largo (solo esos pasos;',
      '       el costo se muestra antes de cobrar):',
      `           npm run videos -- ${carpetaArg} --pasos ${pasos.map((x) => x.clip.deToma).join(',')} --rehacer`,
      ''
    );
  }
  return L;
}

const leerLargo = (largos, archivo) => {
  const v = largos instanceof Map ? largos.get(archivo) : largos?.[archivo];
  if (v === undefined || v === null) return null;
  if (esNumero(v)) return { segundos: v, frames: null, fps: null };
  const segundos = [v.segundos, v.L, v.duracion].find(esNumero);
  return esNumero(segundos) ? { segundos, frames: v.frames ?? null, fps: v.fps ?? null } : null;
};

/**
 * EL REPARTO DEL TIEMPO EN CONTINUIDAD. Puro: recibe los largos ya medidos.
 *
 *   largos   Map (u objeto) archivo -> segundos, o -> { segundos, frames, fps }.
 *            null = PREDICCION: cada clip con el tramo que se pide en el
 *            manifiesto (lo que falte, con lo que propondria --duraciones).
 *            Un clip que no esta en `largos` se planea con su tramo y va con
 *            falta: true y un aviso.
 *   respaldo archivos que salieron del modelo de respaldo (para avisar).
 *
 * Reglas, en este orden:
 *   1. Nunca se corta: cada clip ocupa largo / velocidad. Seguidos, el
 *      primero desde 0 y el ultimo hasta el final del audio (T).
 *   2. La imagen siguiente llega cuando empieza su frase, con margen de
 *      `temprano` antes y `tarde` despues; la ultima llega justo en T.
 *   3. Una toma B reparte su frase entre su propio clip y su paso a la MISMA
 *      velocidad.
 *   4. Ningun clip baja de `minima` (el cierre, de `minimaCierre`), salvo que
 *      aun asi no llene su frase (ventana de mas de 10 s): ahi se avisa.
 *   5. Se busca la menor velocidad maxima posible (V*). Solo se presta tiempo
 *      entre frases si sin prestar algun clip pasaria de max(V*, guia).
 *
 * Devuelve { prediccion, reglas, duracion, velocidadMaximaPosible, tope,
 * sinSolucion, velocidadMaxima, clips, bloques, unidades, avisos, resumen }.
 * `clips` es la lista plana que va al plan (plan-montaje.json, continuidad.clips).
 */
export function planearContinuidad({ manifiesto, tiempos, largos = null, respaldo = [], reglas = REGLAS_CONTINUIDAD }) {
  const ventanas = ventanasDeFrases(manifiesto, tiempos);
  const T = tiempos.duracion;
  const prediccion = largos == null;
  const conRespaldo = new Set(respaldo);
  const avisos = [];

  const cadena = cadenaDeClips(manifiesto, { estimar: true, tiempos });
  const clips = cadena.map((c) => {
    const pedido = c.tramo ?? (esNumero(c.segundos) ? tramoQueCubre(c.segundos) : null);
    let medida = prediccion ? null : leerLargo(largos, c.archivo);
    const falta = !prediccion && !medida;
    if (!medida) medida = { segundos: pedido, frames: null, fps: null };
    if (!esNumero(medida.segundos) || !(medida.segundos > 0)) {
      throw new Error(`no se sabe el largo de ${c.archivo}: falta su duracion en continuidad (npm run continuidad -- <carpeta> --duraciones)`);
    }
    if (falta) avisos.push(`falta video/${c.archivo}: se planea con su tramo pedido (${pedido}s). Generalo antes de ensamblar.`);
    if (conRespaldo.has(c.archivo)) {
      avisos.push(`${c.archivo} salio del modelo de respaldo: revisa sus uniones (que arranque y llegue a sus imagenes).`);
    }
    return { c, L: medida.segundos, frames: medida.frames, fps: medida.fps, pedido, falta };
  });

  // Una unidad por frase, con todos sus clips (1, o 2 si es una B que no es la ultima).
  const N = ventanas.length;
  const unidades = ventanas.map((w, k) => {
    const suyos = clips.filter((x) => x.c.linea === w.toma.n);
    const Lu = suyos.reduce((s, x) => s + x.L, 0);
    const ultima = k === N - 1;
    let vmin = ultima ? reglas.minimaCierre : reglas.minima;
    // Clip mas corto que su frase (ventana de mas de 10 s, o un clip que
    // salio corto): se deja ir mas lento que la minima para que llene.
    if (Lu < w.ventana * vmin) vmin = Lu / (w.ventana + reglas.tarde);
    return { k, w, ultima, suyos, Lu, vmin };
  });

  // Hacia adelante: entre que tiempos puede llegar cada unidad si ningun clip
  // pasa de V ni baja de su minima. null si alguna no tiene donde llegar.
  const factible = (V) => {
    let lo = 0;
    let hi = 0;
    const iv = [];
    for (const u of unidades) {
      lo += u.Lu / V;
      hi += u.Lu / u.vmin;
      const a = u.ultima ? T : u.w.obj - reglas.temprano;
      const b = u.ultima ? T : u.w.obj + reglas.tarde;
      lo = Math.max(lo, a);
      hi = Math.min(hi, b);
      if (lo > hi + EPS) return null;
      iv.push([lo, Math.max(lo, hi)]);
    }
    return iv;
  };

  const llegadas = new Array(N);
  let Vstar = null;
  let tope = null;
  const sinSolucion = !factible(VELOCIDAD_TECHO);
  if (sinSolucion) {
    // Ni a 50x entra: cada imagen llega a su frase, sin prestar, y se avisa.
    unidades.forEach((u) => {
      llegadas[u.k] = u.ultima ? T : u.w.obj;
    });
    avisos.push(
      `ATENCION: no hay reparto posible ni a ${VELOCIDAD_TECHO}x: cada imagen llega a su frase sin prestar tiempo. ` +
        'Algun clip es mucho mas largo que su frase: pidelo mas corto.'
    );
  } else {
    // La menor velocidad maxima posible (busqueda binaria, siempre igual).
    let a = reglas.minima;
    let b = VELOCIDAD_TECHO;
    for (let i = 0; i < 60; i++) {
      const mitad = (a + b) / 2;
      if (factible(mitad)) b = mitad;
      else a = mitad;
    }
    Vstar = b;
    tope = Math.max(Vstar, reglas.guia);
    const iv = factible(tope);
    // Hacia atras: cada llegada lo mas cerca posible de su frase.
    llegadas[N - 1] = T;
    for (let k = N - 2; k >= 0; k--) {
      const u1 = unidades[k + 1];
      const lo = Math.max(iv[k][0], llegadas[k + 1] - u1.Lu / u1.vmin);
      const hi = Math.min(iv[k][1], llegadas[k + 1] - u1.Lu / tope);
      llegadas[k] = Math.min(Math.max(unidades[k].w.obj, lo), hi);
    }
  }

  // Cada clip en su lugar. Los tiempos se redondean a milesimas y van
  // encadenados: el desde de cada clip es el hasta (ya redondeado) del anterior.
  const salida = [];
  let t = 0;
  let tR = 0;
  for (const u of unidades) {
    const fin = llegadas[u.k];
    const v = u.Lu / (fin - t);
    u.velocidad = v;
    u.llegada = fin;
    u.deriva = u.ultima ? 0 : fin - u.w.obj;
    u.suyos.forEach((x, j) => {
      const ultimoDeLaFrase = j === u.suyos.length - 1;
      const hasta = ultimoDeLaFrase ? fin : t + x.L / v;
      const hastaR = ultimoDeLaFrase && u.ultima ? T : r3(hasta);
      salida.push({
        archivo: x.c.archivo,
        rol: x.c.rol,
        linea: u.w.toma.n,
        de: x.c.imagenInicial.replace(/\.png$/, ''),
        a: x.c.imagenFinal ? x.c.imagenFinal.replace(/\.png$/, '') : null,
        ...(x.c.rol === 'paso' ? { aToma: x.c.aToma } : {}),
        largoOriginal: r3(x.L),
        frames: x.frames,
        fps: x.fps,
        tramo: x.pedido,
        desde: tR,
        hasta: hastaR,
        velocidad: r3(v),
        recorte: 0,
        objetivo: ultimoDeLaFrase ? r3(u.ultima ? T : u.w.obj) : null,
        deriva: ultimoDeLaFrase ? r3(u.deriva) : null,
        mudo: false,
        ...(x.falta ? { falta: true } : {}),
        ...(x.c.estimado ? { estimado: true } : {}),
        ...(conRespaldo.has(x.c.archivo) ? { respaldo: true } : {}),
      });
      t = hasta;
      tR = hastaR;
    });
  }

  // Comprobaciones antes de entregar: si alguna falla es un error del motor.
  const roto = (que) => {
    throw new Error(`continuidad: el reparto no cumple "${que}". Es un error del motor, no del anuncio.`);
  };
  if (!salida.length || salida[0].desde !== 0) roto('el primer clip empieza en 0');
  for (let i = 1; i < salida.length; i++) if (salida[i].desde !== salida[i - 1].hasta) roto('clips seguidos');
  if (salida[salida.length - 1].hasta !== T) roto('el ultimo clip termina con el audio');
  for (const x of salida) {
    if (x.recorte !== 0) roto('recorte 0');
    if (!(x.hasta > x.desde)) roto('cada clip dura mas de 0');
  }
  if (!sinSolucion) {
    for (const u of unidades) {
      if (u.velocidad < u.vmin - 1e-6) roto(`ningun clip bajo su minima (linea ${u.w.toma.n})`);
      if (u.velocidad > tope + 1e-6) roto(`ningun clip sobre el tope (linea ${u.w.toma.n})`);
      if (!u.ultima && (u.deriva < -reglas.temprano - 1e-6 || u.deriva > reglas.tarde + 1e-6)) roto(`llegada dentro del margen (linea ${u.w.toma.n})`);
    }
  }

  // Avisos de velocidad, por frase.
  for (const u of unidades) {
    const nombres = u.suyos.map((x) => x.c.archivo.replace('.mp4', '')).join(' + ');
    const minima = u.ultima ? reglas.minimaCierre : reglas.minima;
    const llega = u.ultima
      ? ''
      : Math.abs(u.deriva) < 0.005
        ? ''
        : ` (llega ${Math.abs(u.deriva).toFixed(2)}s ${u.deriva < 0 ? 'antes' : 'tarde'} a la ${ventanas[u.k + 1].toma.n})`;
    if (u.velocidad > reglas.fuerte + EPS) {
      avisos.push(
        `MUY RAPIDO: ${nombres} va a ${u.velocidad.toFixed(2)}x aun prestando tiempo${llega}, sobre ${reglas.fuerte.toFixed(1)}x. ` +
          'No se corta: si se ve mal, pide ese clip mas corto (o el propio de la toma B a menos segundos).'
      );
    } else if (u.velocidad > reglas.guia + EPS) {
      avisos.push(`${nombres} va a ${u.velocidad.toFixed(2)}x${llega}, sobre la guia de ${reglas.guia.toFixed(1)}x. No se corta.`);
    }
    if (u.velocidad < minima - EPS) {
      const sugerido = tramoQueCubre(u.w.ventana);
      const pedir =
        u.suyos.length === 1 && u.suyos[0].pedido < sugerido
          ? `pidelo de ${sugerido}s`
          : u.w.ventana > tramosDeVideo().at(-1)
            ? `su frase dura ${u.w.ventana.toFixed(2)}s y el video mas largo es de ${tramosDeVideo().at(-1)}s`
            : 'pidelo mas largo';
      avisos.push(`${nombres} va a ${u.velocidad.toFixed(2)}x (menos de ${minima.toFixed(1)}x): habra cuadros repetidos; ${pedir}.`);
    }
  }

  const velocidades = salida.map((x) => x.velocidad);
  const movidas = unidades.filter((u) => !u.ultima && Math.abs(u.deriva) >= 0.005);
  const resumen = {
    clips: salida.length,
    sobreGuia: salida.filter((x) => x.velocidad > reglas.guia + EPS).length,
    sobreFuerte: salida.filter((x) => x.velocidad > reglas.fuerte + EPS).length,
    bajoMinima: unidades.filter((u) => u.velocidad < (u.ultima ? reglas.minimaCierre : reglas.minima) - EPS).reduce((s, u) => s + u.suyos.length, 0),
    llegadasMovidas: movidas.length,
    maxDeriva: r3(Math.max(0, ...movidas.map((u) => Math.abs(u.deriva)))),
    metraje: r3(clips.reduce((s, x) => s + x.L, 0)),
    faltan: salida.filter((x) => x.falta).length,
  };

  return {
    prediccion,
    reglas: { ...reglas },
    duracion: T,
    velocidadMaximaPosible: Vstar === null ? null : r2(Vstar),
    tope: tope === null ? null : r3(tope),
    sinSolucion,
    velocidadMaxima: Math.max(...velocidades),
    clips: salida,
    bloques: ventanas.map((w, k) => {
      const inicio = w.linea.inicio;
      const fin = k + 1 < N ? ventanas[k + 1].linea.inicio : T;
      return {
        linea: w.toma.n,
        texto: w.linea.texto ?? w.toma.linea,
        inicio,
        fin: r3(fin),
        ventana: r3(fin - inicio),
        tipo: w.toma.tipo,
        clips: unidades[k].suyos.map((x) => x.c.archivo),
      };
    }),
    unidades: unidades.map((u) => ({
      linea: u.w.toma.n,
      tipo: u.w.toma.tipo,
      desde: r3(u.k === 0 ? 0 : llegadas[u.k - 1]),
      ini: r3(u.w.ini),
      objetivo: r3(u.w.obj),
      ventana: r3(u.w.ventana),
      llegada: r3(u.llegada),
      deriva: r3(u.deriva),
      velocidad: r3(u.velocidad),
      minima: r3(u.vmin),
      ultima: u.ultima,
      aToma: u.ultima ? null : ventanas[u.k + 1].toma.n,
      clips: u.suyos.map((x) => x.c.archivo),
    })),
    avisos,
    resumen,
  };
}

/** La prediccion de velocidades antes de pagar los videos: los tramos pedidos, sin clips. No escribe nada. */
export function prediccionContinuidad({ manifiesto, tiempos, reglas = REGLAS_CONTINUIDAD }) {
  return planearContinuidad({ manifiesto, tiempos, largos: null, reglas });
}

/**
 * La tabla del plan (o de la prediccion), lista para imprimir:
 *
 *   lin  frase          tipo  clips en orden                               llega
 *    20  62.14-63.32    A     paso-20 4.00s 2.39x (sobre guia)             0.19s tarde (a la 21)
 *    21  63.32-68.43    B     toma-21 6.00s 2.03x + paso-21 4.00s 2.03x    a tiempo (a la 22)
 *
 * Con `brollGuardados` (un numero) y `hayTransiciones`, suma la linea de lo
 * que no entra en continuidad.
 */
export function lineasTablaContinuidad(plan, { brollGuardados = null, hayTransiciones = false } = {}) {
  const r = plan.reglas;
  const L = [];
  const porArchivo = new Map(plan.clips.map((x) => [x.archivo, x]));
  const filas = plan.unidades.map((u) => {
    const minima = u.ultima ? r.minimaCierre : r.minima;
    const marca =
      u.velocidad > r.fuerte + EPS
        ? ' (MUY RAPIDO)'
        : u.velocidad > r.guia + EPS
          ? ' (sobre guia)'
          : u.velocidad < minima - EPS
            ? ' (cuadros repetidos)'
            : '';
    const clips =
      u.clips
        .map((a) => {
          const x = porArchivo.get(a);
          return `${a.replace('.mp4', '')} ${x.largoOriginal.toFixed(2)}s ${x.velocidad.toFixed(2)}x${x.falta ? ' FALTA' : ''}${x.respaldo ? ' (respaldo)' : ''}`;
        })
        .join(' + ') +
      marca +
      (u.ultima ? ' (cierre)' : '');
    const llega = u.ultima
      ? 'fin del audio'
      : Math.abs(u.deriva) < 0.005
        ? `a tiempo (a la ${u.aToma})`
        : `${Math.abs(u.deriva).toFixed(2)}s ${u.deriva < 0 ? 'antes' : 'tarde'} (a la ${u.aToma})`;
    return { u, frase: `${u.ini.toFixed(2)}-${u.objetivo.toFixed(2)}`, clips, llega };
  });
  const anchoClips = Math.max(14, ...filas.map((f) => f.clips.length));
  L.push(`  lin  ${'frase'.padEnd(14)}  tipo  ${'clips en orden'.padEnd(anchoClips)}  llega`);
  L.push(`  ---  ${'-'.repeat(14)}  ----  ${'-'.repeat(anchoClips)}  ${'-'.repeat(21)}`);
  for (const f of filas) {
    L.push(`  ${String(f.u.linea).padStart(3)}  ${f.frase.padEnd(14)}  ${f.u.tipo.padEnd(4)}  ${f.clips.padEnd(anchoClips)}  ${f.llega}`);
  }
  const s = plan.resumen;
  L.push('');
  L.push(
    `  Velocidad maxima ${plan.velocidadMaxima.toFixed(2)}x` +
      (plan.velocidadMaximaPosible !== null ? ` (la menor posible prestando tiempo: ${plan.velocidadMaximaPosible.toFixed(2)}x)` : ' (sin reparto posible)') +
      `. Sobre ${r.guia.toFixed(1)}x: ${s.sobreGuia} clip(s). Sobre ${r.fuerte.toFixed(1)}x: ${s.sobreFuerte}.`
  );
  L.push(
    `  Llegadas movidas: ${s.llegadasMovidas}${s.llegadasMovidas ? ` (maximo ${s.maxDeriva.toFixed(2)}s)` : ''}` +
      ` (hasta ${r.temprano}s antes o ${r.tarde}s despues de su frase). Metraje: ${Math.round(s.metraje)}s para ${plan.duracion.toFixed(1)}s.`
  );
  L.push('  Ningun clip se corta, ni al principio ni al final: solo cambia la velocidad.');
  if (brollGuardados !== null || hayTransiciones) {
    L.push(
      `  B-roll: no va en continuidad${brollGuardados !== null ? ` (${brollGuardados} guardado(s) en continuidad.broll_descartado)` : ''}.` +
        (hayTransiciones ? ' transiciones.json: se ignora.' : '')
    );
  }
  return L;
}

// ---------------------------------------------------------------- manifiesto en disco

/** Lee el manifiesto y recuerda como estaba escrito (fin de linea, sangria, BOM). */
function leerManifiesto(ruta) {
  const crudo = fs.readFileSync(ruta, 'utf8');
  const bom = crudo.charCodeAt(0) === 0xfeff;
  const texto = bom ? crudo.slice(1) : crudo;
  const m = JSON.parse(texto);
  const sangria = texto.match(/\n([ \t]+)"/)?.[1] ?? '  ';
  return {
    m,
    crudo,
    formato: { eol: texto.includes('\r\n') ? '\r\n' : '\n', sangria, bom, finalConSalto: /\r?\n$/.test(texto) },
  };
}

/** El texto del manifiesto con el mismo formato que tenia. */
function textoDeManifiesto(m, formato) {
  let s = JSON.stringify(m, null, formato.sangria);
  if (formato.eol === '\r\n') s = s.replace(/\n/g, '\r\n');
  if (formato.finalConSalto) s += formato.eol;
  return (formato.bom ? '﻿' : '') + s;
}

/** Escribe solo si cambio. Primero a un temporal y despues renombra. Devuelve true si escribio. */
function escribirManifiesto(ruta, m, { crudo, formato }) {
  const texto = textoDeManifiesto(m, formato);
  if (texto === crudo) return false;
  const tmp = path.join(path.dirname(ruta), `.manifiesto.${process.pid}.tmp`);
  fs.writeFileSync(tmp, texto, 'utf8');
  fs.renameSync(tmp, ruta);
  return true;
}

/**
 * Copia del manifiesto con `continuidad` puesto despues de "broll" (o donde ya
 * estaba). Con `vaciarBroll`, "broll" queda [] (y se agrega si no estaba).
 */
function conBloque(m, bloque, { vaciarBroll = false } = {}) {
  const out = {};
  const yaEstaba = Object.hasOwn(m, 'continuidad');
  let puesto = false;
  for (const [k, v] of Object.entries(m)) {
    if (k === 'continuidad') {
      out.continuidad = bloque;
      puesto = true;
      continue;
    }
    out[k] = k === 'broll' && vaciarBroll ? [] : v;
    if (k === 'broll' && !yaEstaba) {
      out.continuidad = bloque;
      puesto = true;
    }
  }
  if (vaciarBroll && !Object.hasOwn(out, 'broll')) {
    // Sin "broll" el validador se queja: va vacio, justo antes del bloque.
    if (puesto) {
      const { continuidad, ...resto } = out;
      return { ...resto, broll: [], continuidad };
    }
    out.broll = [];
  }
  if (!puesto) out.continuidad = bloque;
  return out;
}

/** El bloque con sus claves conocidas en orden y las demas detras, como estaban. */
function ordenarClaves(obj, orden) {
  const out = {};
  for (const k of orden) if (obj[k] !== undefined) out[k] = obj[k];
  for (const [k, v] of Object.entries(obj)) if (!orden.includes(k)) out[k] = v;
  return out;
}

const iguales = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---------------------------------------------------------------- CLI

function primeraLinea(prompt) {
  if (!esTexto(prompt)) return '(sin prompt_video)';
  const p = prompt.split(/\r?\n/)[0].trim();
  if (p.length <= 200) return p;
  // Un solo parrafo (crochet): hasta el final de la cabecera.
  const mm = p.match(/^.*?,\s*\d+(?:[.,]\d+)?\s*s\b\.?(?:\s*Vertical 9:16\.)?/);
  return mm ? `${mm[0]} [...]` : `${p.slice(0, 197)}...`;
}

function salir(lineas, codigo = 1) {
  for (const l of [].concat(lineas)) console.error(l);
  process.exit(codigo);
}

function cliPreparar({ ruta, carpeta, carpetaArg }) {
  const leido = leerManifiesto(ruta);
  const { m } = leido;
  const nombre = path.basename(carpeta);

  const tomas = Array.isArray(m.tomas) ? m.tomas : [];
  if (m.modo_audio !== 'voz_en_off') {
    salir([
      '',
      `  No se puede: continuidad es solo para anuncios con narrador en voz en off, y este es "modo_audio": ${JSON.stringify(m.modo_audio)}.`,
      '  Donde una persona habla a camara, se canta o el producto habla, la voz vive dentro de cada video y encadenarlos la rompe.',
      '  No se cambio nada: el anuncio sigue normal.',
      '',
    ]);
  }
  if (!ESTILOS_CON_CONTINUIDAD.includes(m.estilo)) {
    salir([
      '',
      `  No se puede: el estilo ${JSON.stringify(m.estilo)} no tiene continuidad.`,
      `  Estilos con continuidad: ${ESTILOS_CON_CONTINUIDAD.join(', ')}.`,
      '  No se cambio nada: el anuncio sigue normal.',
      '',
    ]);
  }
  if (tomas.length < 2) {
    salir(['', `  No se puede: continuidad necesita al menos 2 tomas (cada video va de una a la siguiente) y hay ${tomas.length}.`, '  No se cambio nada.', '']);
  }
  if (m.broll !== undefined && !Array.isArray(m.broll)) {
    salir(['', '  "broll" no es un array. Arreglalo en el manifiesto y vuelve a correr --preparar. No se cambio nada.', '']);
  }
  if (m.continuidad != null && !esObjeto(m.continuidad)) {
    salir(['', `  "continuidad" ya existe y no es un objeto (${JSON.stringify(m.continuidad)}). Arreglalo o borralo y vuelve a correr --preparar. No se cambio nada.`, '']);
  }

  const broll = Array.isArray(m.broll) ? m.broll : [];
  const previo = esObjeto(m.continuidad) ? m.continuidad : null;
  if (previo && previo.version !== undefined && previo.version !== VERSION_CONTINUIDAD) {
    salir(['', `  continuidad.version es ${JSON.stringify(previo.version)} y este motor conoce la ${VERSION_CONTINUIDAD}. No se cambio nada.`, '']);
  }
  let descartado = previo && Array.isArray(previo.broll_descartado) ? previo.broll_descartado : [];
  if (broll.length) {
    if (descartado.length && !iguales(descartado, broll)) {
      salir([
        '',
        `  El manifiesto ya trae un continuidad.broll_descartado (${descartado.length}) distinto del "broll" actual (${broll.length}).`,
        '  No se cual vale: deja uno solo a mano y vuelve a correr --preparar. No se cambio nada.',
        '',
      ]);
    }
    descartado = broll;
  }
  const movidos = broll.length;
  const bloque = ordenarClaves(
    {
      ...(previo ?? {}),
      version: VERSION_CONTINUIDAD,
      broll_descartado: descartado,
      pasos: previo && Array.isArray(previo.pasos) ? previo.pasos : [],
    },
    ['version', 'broll_descartado', 'pasos', 'cierre']
  );
  const nuevo = conBloque(m, bloque, { vaciarBroll: true });
  const escrito = escribirManifiesto(ruta, nuevo, leido);

  const sinUso = [...referenciasSoloDelBrollDescartado(nuevo)];
  console.log(`\n=== Continuidad: preparar — ${nombre} ===\n`);
  if (movidos) {
    console.log(`  B-roll: ${movidos} movido(s) a continuidad.broll_descartado. "broll" queda vacio: el B-roll del paquete no se produce (ni imagenes ni videos).`);
  } else {
    console.log(`  B-roll: ninguno que mover ("broll" ya esta vacio; guardados en continuidad.broll_descartado: ${descartado.length}).`);
  }
  if (sinUso.length) console.log(`  Referencias que solo usaba ese B-roll, que no se generan: ${sinUso.join(', ')}`);
  if (fs.existsSync(path.join(carpeta, 'transiciones.json'))) console.log('  transiciones.json: existe y se va a ignorar.');
  console.log('  Sin transiciones ni efectos del editor: el paso de una escena a la otra lo hace cada video.');
  const nPasos = bloque.pasos.length;
  console.log(
    nPasos
      ? `  Pasos: ya hay ${nPasos} escrito(s); no se tocan.`
      : '  Pasos: se escriben despues de imagenes y audio (--duraciones y --pares).'
  );
  console.log(escrito ? `\n  Manifiesto actualizado: ${ruta}` : '\n  Ya estaba preparado: no se cambio nada.');
  console.log('\n  Siguiente:');
  console.log(`      npm run validar  -- ${carpetaArg}/manifiesto.json`);
  console.log(`      npm run imagenes -- ${carpetaArg}`);
  console.log(`      npm run audio    -- ${carpetaArg}`);
  console.log(`      npm run continuidad -- ${carpetaArg} --duraciones\n`);
}

function cliDuraciones({ ruta, carpeta, carpetaArg }) {
  const leido = leerManifiesto(ruta);
  const { m } = leido;
  if (!esObjeto(m.continuidad)) {
    salir(['', '  Este manifiesto no tiene el bloque "continuidad". Primero:', `      npm run continuidad -- ${carpetaArg} --preparar`, '']);
  }
  const rutaTiempos = path.join(carpeta, 'audio', 'tiempos.json');
  if (!fs.existsSync(rutaTiempos)) {
    salir([
      '',
      '  Falta audio/tiempos.json: las duraciones salen de los tiempos reales de la voz.',
      '  Genera primero la voz:',
      `      npm run audio -- ${carpetaArg}`,
      '',
    ]);
  }
  let tiempos;
  let propuesta;
  try {
    tiempos = JSON.parse(fs.readFileSync(rutaTiempos, 'utf8'));
    propuesta = proponerDuraciones(m, tiempos);
  } catch (e) {
    salir(['', `  ${e.message.replace(/<carpeta>/g, carpetaArg)}`, '  No se cambio nada.', '']);
  }

  // Pasos nuevos, conservando prompt_video, forma y lo demas que ya hubiera
  // en el paso del mismo par. Un paso que ya no corresponde a dos tomas
  // seguidas se descarta (y se dice).
  const previos = (Array.isArray(m.continuidad.pasos) ? m.continuidad.pasos : []).filter(esObjeto);
  const GESTIONADAS = ['de', 'a', 'ventana', 'duracion', 'duracion_propio'];
  const pasos = propuesta.pasos.map((q) => {
    const prev = previos.find((p) => p.de === q.de && p.a === q.a);
    const resto = prev ? Object.fromEntries(Object.entries(prev).filter(([k]) => !GESTIONADAS.includes(k))) : {};
    return { ...q, ...resto };
  });
  const descartados = previos.filter((p) => !propuesta.pasos.some((q) => q.de === p.de && q.a === p.a));
  const cierrePrevio = esObjeto(m.continuidad.cierre) ? m.continuidad.cierre : {};
  const cierre = ordenarClaves({ ...cierrePrevio, ...propuesta.cierre }, ['toma', 'ventana', 'duracion']);
  const bloque = ordenarClaves({ ...m.continuidad, pasos, cierre }, ['version', 'broll_descartado', 'pasos', 'cierre']);
  const nuevo = conBloque(m, bloque); // --duraciones no toca el B-roll (eso es --preparar)
  const escrito = escribirManifiesto(ruta, nuevo, leido);

  // La tabla.
  console.log(`\n=== Continuidad: duraciones — ${path.basename(carpeta)} ===\n`);
  console.log(`  Frases medidas en audio/tiempos.json (${tiempos.duracion.toFixed(2)}s de audio).\n`);
  const filas = propuesta.detalle.map((d) => {
    const nombre = d.rol === 'cierre' ? `cierre ${d.de}` : `${d.de} -> ${d.a}`;
    const pide =
      d.rol === 'cierre'
        ? `toma-${d.de} ${d.clips[0]}s`
        : d.tipo === 'B'
          ? `propio ${d.clips[0]}s${d.clips[0] !== d.propioDeSiempre ? ` (era ${d.propioDeSiempre})` : ''} + paso ${d.clips[1]}s`
          : `paso ${d.clips[0]}s`;
    const v = d.sinPrestamo;
    const marca = v > REGLAS_CONTINUIDAD.fuerte + EPS ? '  MUY RAPIDO' : v > REGLAS_CONTINUIDAD.guia + EPS ? '  sobre guia' : '';
    return { nombre, tipo: d.tipo, frase: `${d.ini.toFixed(2)}-${d.obj.toFixed(2)}`, ventana: `${d.ventana.toFixed(2)}s`, pide, v: `${v.toFixed(2)}x${marca}` };
  });
  const ancho = (k, t) => Math.max(t.length, ...filas.map((f) => f[k].length));
  const w = { nombre: ancho('nombre', 'paso'), frase: ancho('frase', 'frase'), ventana: ancho('ventana', 'ventana'), pide: ancho('pide', 'se pide') };
  console.log(`  ${'paso'.padEnd(w.nombre)}  tipo  ${'frase'.padEnd(w.frase)}  ${'ventana'.padEnd(w.ventana)}  ${'se pide'.padEnd(w.pide)}  sin prestar tiempo`);
  console.log(`  ${'-'.repeat(w.nombre)}  ----  ${'-'.repeat(w.frase)}  ${'-'.repeat(w.ventana)}  ${'-'.repeat(w.pide)}  ------------------`);
  for (const f of filas) {
    console.log(`  ${f.nombre.padEnd(w.nombre)}  ${String(f.tipo).padEnd(4)}  ${f.frase.padEnd(w.frase)}  ${f.ventana.padStart(w.ventana)}  ${f.pide.padEnd(w.pide)}  ${f.v}`);
  }

  const costo = costoDeCadena(nuevo, { tiempos });
  console.log(`\n  Clips: ${textoCuenta(costo.cadena)}. Costo: ${costo.creditos} creditos = US$${costo.usd.toFixed(2)} (${modeloPrincipal()} a ${RESOLUCION_VIDEO}, sin reintentos ni respaldo).`);
  try {
    const pred = prediccionContinuidad({ manifiesto: nuevo, tiempos });
    const s = pred.resumen;
    console.log(
      `  Prevision prestando tiempo (la imagen llega hasta ${REGLAS_CONTINUIDAD.temprano}s antes o ${REGLAS_CONTINUIDAD.tarde}s despues de su frase): ` +
        `velocidad maxima ${pred.velocidadMaxima.toFixed(2)}x; sobre ${REGLAS_CONTINUIDAD.guia.toFixed(1)}x: ${s.sobreGuia}; sobre ${REGLAS_CONTINUIDAD.fuerte.toFixed(1)}x: ${s.sobreFuerte}.`
    );
    const fuertes = pred.clips.filter((x) => x.velocidad > REGLAS_CONTINUIDAD.fuerte + EPS);
    if (fuertes.length) console.log(`  Sobre ${REGLAS_CONTINUIDAD.fuerte.toFixed(1)}x: ${fuertes.map((x) => `${x.archivo.replace('.mp4', '')} ${x.velocidad.toFixed(2)}x`).join(', ')}`);
  } catch (e) {
    console.log(`  Prevision de velocidades: ${e.message}`);
  }
  const cortos = propuesta.detalle.filter((d) => d.tipo === 'B' && d.rol === 'paso' && d.clips[0] !== d.propioDeSiempre);
  if (cortos.length) {
    console.log(
      `  Propio de la toma B pedido mas corto (con su largo de siempre la frase pasaba de ${REGLAS_CONTINUIDAD.fuerte.toFixed(1)}x): ` +
        cortos.map((d) => `toma ${d.de} a ${d.clips[0]}s (era ${d.propioDeSiempre}s)`).join(', ') +
        '. Mismo prompt y mismas imagenes; solo cambia el largo.'
    );
  }
  const cabeceraVieja = pasos.filter((p) => esTexto(p.prompt_video) && segundosDeCabecera(p.prompt_video) !== null && segundosDeCabecera(p.prompt_video) !== p.duracion);
  if (cabeceraVieja.length) {
    console.log(
      `  OJO: la cabecera del prompt ya no dice el largo que se pide en ${cabeceraVieja.map((p) => `${p.de}->${p.a} (dice ${segundosDeCabecera(p.prompt_video)}s, se pide ${p.duracion}s)`).join(', ')}. ` +
        'Corrige ese numero (y el recorrido, si el largo cambio mucho).'
    );
  }
  // Clips que ya estan en video/ con otro largo que el que se pide ahora: los
  // mide igual que `npm run videos` (mismo aviso, mismo comando).
  const avisos = avisosDeLargo(nuevo, path.join(carpeta, 'video'), { carpetaArg });
  if (avisos.length) console.log(`\n${avisos.join('\n').replace(/\n+$/, '')}`);
  if (descartados.length) {
    console.log(`\n  Se descartaron ${descartados.length} paso(s) que ya no van entre dos tomas seguidas:`);
    for (const p of descartados) console.log(`      ${p.de}->${p.a}${esTexto(p.prompt_video) ? `  (tenia prompt: ${primeraLinea(p.prompt_video)})` : ''}`);
  }
  console.log(
    escrito
      ? '\n  Manifiesto actualizado: continuidad.pasos y continuidad.cierre. Los prompt_video y las formas que ya habia se conservan.'
      : '\n  Las duraciones ya estaban asi: no se cambio nada.'
  );
  const faltanPrompts = pasos.filter((p) => !esTexto(p.prompt_video)).length;
  console.log(
    faltanPrompts
      ? `  Faltan ${faltanPrompts} prompt(s) de paso. Siguiente:\n      npm run continuidad -- ${carpetaArg} --pares\n`
      : `  Todos los pasos tienen prompt. Siguiente:\n      npm run plan -- ${carpetaArg} --prediccion\n`
  );
}

function cliPares({ ruta, carpeta, carpetaArg }) {
  const { m } = leerManifiesto(ruta);
  if (!esObjeto(m.continuidad)) {
    salir(['', '  Este manifiesto no tiene el bloque "continuidad". Primero:', `      npm run continuidad -- ${carpetaArg} --preparar`, '']);
  }
  const tomas = (Array.isArray(m.tomas) ? m.tomas : []).filter(esObjeto);
  if (tomas.length < 2) salir(['', '  Continuidad necesita al menos 2 tomas.', '']);
  const cadena = cadenaDeClips(m);
  const img = (f) => {
    const p = path.join(carpeta, 'img', f);
    return `${p.replace(/\\/g, '/')}${fs.existsSync(p) ? '' : '   (FALTA: npm run imagenes)'}`;
  };
  const cita = (s) => (esTexto(s) ? `"${s}"` : '(sin linea)');

  console.log(`\n=== Continuidad: pares — ${path.basename(carpeta)} ===\n`);
  console.log('  Por cada paso: abre las dos imagenes, elige la forma y escribe su prompt en continuidad.pasos[].prompt_video.\n');
  const pasos = cadena.filter((c) => c.rol === 'paso');
  for (const c of pasos) {
    const t = tomas.find((x) => x.n === c.deToma);
    const sig = tomas.find((x) => x.n === c.aToma);
    const pide = c.segundos !== null ? `se pide ${c.segundos}s` : 'duracion sin calcular (--duraciones)';
    console.log(
      `  Paso ${c.deToma} -> ${c.aToma}   (toma ${t.tipo} -> toma ${sig.tipo})   ${pide}   forma: ${c.forma ?? '(sin elegir)'}   prompt: ${c.sinPrompt ? 'FALTA' : 'escrito'}` +
        (c.revisar ? '   REVISAR (se rehizo una imagen)' : '')
    );
    console.log(`    salida:   ${img(c.imagenInicial)}`);
    console.log(`    llegada:  ${img(c.imagenFinal)}`);
    console.log(`    linea ${c.deToma}:  ${cita(t.linea)}`);
    console.log(`    linea ${c.aToma}:  ${cita(sig.linea)}`);
    console.log(`    video ${c.deToma}:  ${primeraLinea(t.prompt_video)}`);
    console.log(`    video ${c.aToma}:  ${primeraLinea(sig.prompt_video)}`);
    if (t.tipo === 'B') {
      const propio = cadena.find((x) => x.rol === 'propio' && x.linea === t.n);
      console.log(
        `    la toma ${t.n} tiene imagen inicial y final: su propio video (${propio.archivo}, de ${propio.imagenInicial} a ${propio.imagenFinal}, ` +
          `${propio.tramo ?? propio.segundos}s) va con su prompt de siempre; el paso sale de su imagen final.`
      );
    }
    console.log('');
  }
  const cierre = cadena.find((c) => c.rol === 'cierre');
  const ultima = tomas[tomas.length - 1];
  console.log(`  Cierre: toma ${ultima.n} (${ultima.tipo})   ${cierre.segundos !== null ? `se pide ${cierre.segundos}s` : 'duracion sin calcular (--duraciones)'}`);
  console.log(
    `    video/${cierre.archivo} arranca en ${img(cierre.imagenInicial)}` +
      (cierre.imagenFinal ? ` y llega a ${img(cierre.imagenFinal)}` : '') +
      ', con el prompt de la toma (no se escribe).'
  );
  const faltan = pasos.filter((c) => c.sinPrompt);
  console.log(`\n  Prompts escritos: ${pasos.length - faltan.length} de ${pasos.length}.${faltan.length ? ` Faltan: ${listaCorta(faltan.map((c) => `${c.deToma}->${c.aToma}`))}` : ''}`);
  if (!faltan.length) console.log(`  Siguiente:\n      npm run plan    -- ${carpetaArg} --prediccion\n      npm run validar -- ${carpetaArg}/manifiesto.json`);
  console.log('');
}

if (process.argv[1] && path.basename(process.argv[1]) === 'continuidad.js') {
  const args = process.argv.slice(2);
  const arg = args.find((a) => !a.startsWith('--'));
  const modos = ['--preparar', '--duraciones', '--pares'].filter((f) => args.includes(f));
  const desconocidos = args.filter((a) => a.startsWith('--') && !['--preparar', '--duraciones', '--pares'].includes(a));
  if (!arg || modos.length !== 1 || desconocidos.length) {
    salir([
      '',
      '  Uso: node produccion/continuidad.js <carpeta-del-anuncio> --preparar | --duraciones | --pares',
      '',
      '    --preparar    antes de las imagenes: el B-roll pasa a continuidad.broll_descartado, "broll" queda vacio',
      '                  y se agrega el bloque "continuidad"',
      '    --duraciones  despues de imagenes y audio: la duracion de cada paso y el cierre, desde audio/tiempos.json',
      '    --pares       las dos imagenes de cada paso, sus lineas y la cabecera de sus prompts, para escribir los pasos',
      ...(desconocidos.length ? ['', `  No conozco: ${desconocidos.join(' ')}`] : []),
      '',
    ]);
  }
  // Se acepta la carpeta o la ruta del manifiesto.
  const carpeta = path.resolve(/\.json$/i.test(arg) ? path.dirname(arg) : arg);
  const carpetaArg = (/\.json$/i.test(arg) ? path.dirname(arg) : arg).replace(/\\/g, '/').replace(/\/+$/, '');
  const ruta = path.join(carpeta, 'manifiesto.json');
  if (!fs.existsSync(ruta)) salir(['', `  No encuentro el manifiesto: ${ruta}`, '']);
  try {
    JSON.parse(fs.readFileSync(ruta, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    salir(['', `  El manifiesto no es JSON valido: ${e.message}`, '  Revisa comillas dobles, comas colgando y comentarios. No se cambio nada.', '']);
  }
  const ctx = { ruta, carpeta, carpetaArg };
  if (modos[0] === '--preparar') cliPreparar(ctx);
  else if (modos[0] === '--duraciones') cliDuraciones(ctx);
  else cliPares(ctx);
}
