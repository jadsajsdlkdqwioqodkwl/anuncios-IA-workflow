// Valida un manifiesto contra su contrato: los campos que la capa de produccion espera.
// Es la puerta de entrada de la capa de produccion: si esto no pasa, no se genera nada.
//
// Uso:  node produccion/validar-manifiesto.js temp/mi-anuncio/manifiesto.json

import fs from 'node:fs';
import path from 'node:path';
import { FORMATOS_OK, MAX_BYTES } from './preparar-producto.js';
import {
  listaDeReferencias,
  validarReferencias,
  esFormatoHeredado,
  esAportada,
  esGenerada,
  esLugarDeToma,
  archivoDeHoja,
  tomaDelBroll,
  RESERVADAS,
} from './referencias.js';
import {
  PRECIOS,
  MODELOS,
  MODELOS_VIDEO,
  RESOLUCION_VIDEO,
  MODELO_IMAGEN_UGC,
  RESOLUCION_IMAGEN_UGC,
  MODELO_VIDEO_UGC,
  ESTILOS_HABLADOS,
  MODELO_VIDEO_BROLL_POR_ESTILO,
  MODELO_IMAGEN_ICONOS,
  RESOLUCION_IMAGEN_ICONOS,
  MODELO_IMAGEN_POR_ESTILO,
  DURACIONES_H,
  ESTILOS_CON_INGREDIENTES,
  INGREDIENTE_IMAGEN,
  creditosClip,
  creditosAUsd,
} from './config.js';
import {
  tieneContinuidad,
  validarContinuidad,
  resumenContinuidad,
  referenciasSoloDelBrollDescartado,
} from './continuidad.js';

const MODOS_AUDIO = ['voz_en_off', 'dialogo_nativo', 'musica'];
// R = bloque UGC "solo referencias, cero frames" (ver validarBloqueR, abajo).
// Lo emite unicamente la skill de UGC por bloques.
// H = toma hablada (ver validarTomaH, abajo): con frame inicial o, en la
// entrevista, por ingredientes. La emiten solo las skills de podcast y
// entrevista (ESTILOS_HABLADOS, 2026-10-13).
const TIPOS = ['A', 'B', 'C', 'R', 'H'];
const TOPE_CLIP_SEG = 10; // tope de Gemini Omni Flash

// ---------------------------------------------------------------- bloques R
//
// Un bloque R es un clip de 4, 6, 8 o 10 s que Omni genera de una vez con las
// imagenes de referencia (personaje, producto) y un prompt dividido en
// "tramos" con timestamp. No hay frame inicial ni final: nada que heredar.
//
// La guia de palabras sale de lo medido el 2026-10-04 (temp/prueba-ugc-bloques):
// ~3 palabras por cada segundo que la persona habla. 30 palabras en 10 s
// salieron naturales y completas; con 24 en 10 s le sobro tiempo y el modelo
// repitio el final ("mucho mas tranquila"). Por eso es un AVISO, no un error:
// sirve para escribir bien a la primera, pero cada bloque se revisa igual.
const DURACIONES_R = [4, 6, 8, 10]; // lo unico que acepta Omni
const GUIA_PALABRAS_R = { 4: [9, 12], 6: [15, 18], 8: [21, 24], 10: [26, 30] };
const PALABRAS_POR_SEGUNDO_R = 3; // lo que "resta" cada segundo de tramo mudo
const EPS = 1e-6;

// La misma forma que acepta ajustarDuracionEnPrompt() en generar-videos.js
// ("Duración: 10s.", "Duracion: 10 s", "Duration: 10s."). Se repite aqui y no
// se importa porque generar-videos.js ya importa este archivo.
const RE_DURACION_PROMPT = /(Duraci[oó]n|Duration)(\s*:\s*)(\d+(?:[.,]\d+)?)(\s*s)/i;

// "Imagen N" del prompt contra las referencias del bloque. Omni recibe las
// imagenes en el orden de `referencias` y el prompt las nombra por numero
// ("Imagen 1: Mariana", "Imagen 2: el producto", "el frasco de la imagen 2").
// Declaracion: una linea que EMPIEZA con "Imagen N" (la seccion REFERENCIAS).
const RE_IMAGEN_DECLARADA = /^[ \t]*[-*•]?[ \t]*(?:Imagen|Image|Imagem)[ \t]+(\d+)\b[ \t]*[:.=)\-–—]?[ \t]*(.*)$/gim;
// Mencion en cualquier parte ("idéntico a la imagen 2"), pero no "imagen 9:16" ni "imagen 4K".
const RE_IMAGEN_MENCION = /\b(?:imagen|image|imagem)\s+(\d+)(?![\d.,:]*\d)(?!\s*[kp]\b)/gi;
// Como se reconoce que una declaracion habla de la persona o del producto.
const RE_DECL_IDENTIDAD = /identidad|identity|identidade/i;
const RE_DECL_PRODUCTO = /\b(?:produ(?:cto|ct|to)s?|envase|frasco|empaque|package|packaging|embalagem)\b/i;
// Y que habla de un lugar (un fotograma de otro bloque, o la foto de un lugar):
// "Imagen 2: la oficina. ... úsala solo como referencia del lugar (...)". Se
// mira ANTES que identidad y producto: esa linea suele decir "no copies a la
// persona que aparece" y puede nombrar cosas que hay en el lugar.
const RE_DECL_LUGAR = /referencia\s+del\s+lugar|refer[eê]ncia\s+do\s+lugar|reference\s+(?:for|of|to)\s+the\s+(?:place|location|setting)/i;

/**
 * Que las "Imagen N" del prompt_video cuadren con `referencias`: cuantas se
 * declaran, en que posicion va el producto y que imagen lo nombra. Si no
 * cuadran, el clip sale con la cara o el producto cambiados y nadie lo nota
 * hasta verlo (prueba en seco del 2026-10-04: "Imagen 2" sin producto
 * adjunto, producto adjunto sin "Imagen 2" y el orden invertido pasaban sin
 * un solo aviso). Es un AVISO, no un error: el prompt es texto libre y esto
 * lo lee por palabras. Un aviso por bloque, con todo lo que no cuadra.
 */
function chequearImagenesR(b, id, { tipoDe, A }) {
  if (!Array.isArray(b.referencias) || !esTextoR(b.prompt_video)) return;
  const refs = b.referencias;
  const total = refs.length;
  const imagenes = (n) => `${n} imagen${n === 1 ? '' : 'es'}`;
  const nombres = (ns) => ns.map((n) => `"Imagen ${n}"`).join(', ');

  const declaradas = new Map(); // N -> lo que dice despues de "Imagen N:"
  for (const x of b.prompt_video.matchAll(RE_IMAGEN_DECLARADA)) {
    const n = Number(x[1]);
    if (!declaradas.has(n)) declaradas.set(n, x[2].trim());
  }
  const nums = [...declaradas.keys()].sort((x, y) => x - y);
  const clase = (texto) =>
    RE_DECL_LUGAR.test(texto)
      ? 'lugar'
      : RE_DECL_IDENTIDAD.test(texto)
        ? 'persona'
        : RE_DECL_PRODUCTO.test(texto)
          ? 'producto'
          : 'otra';
  const problemas = [];

  // 1. Cuantas declara el prompt contra cuantas adjunta el bloque.
  if (nums.length !== total || nums.some((n, i) => n !== i + 1)) {
    problemas.push(
      nums.length
        ? `el prompt declara ${imagenes(nums.length)} (${nombres(nums)}) y el bloque adjunta ${total}`
        : `el prompt no declara ninguna imagen ("Imagen 1: ...") y el bloque adjunta ${total}`
    );
  }

  // 2. Menciones sueltas a una imagen que no se adjunta ("idéntico a la imagen 2").
  const sueltas = [...new Set([...b.prompt_video.matchAll(RE_IMAGEN_MENCION)].map((x) => Number(x[1])))]
    .filter((n) => (n < 1 || n > total) && !declaradas.has(n))
    .sort((x, y) => x - y);
  if (sueltas.length) {
    problemas.push(`el prompt nombra la imagen ${sueltas.join(', ')} y el bloque adjunta ${imagenes(total)}`);
  }

  // 3. El producto: en que posicion de `referencias` va y que "Imagen N" lo nombra.
  const enRefs = refs.map((r, i) => (tipoDe(r) === 'producto' ? i + 1 : null)).filter((n) => n !== null);
  const enPrompt = nums.filter((n) => clase(declaradas.get(n)) === 'producto');
  const sinDeclarar = enRefs.filter((k) => !enPrompt.includes(k));
  const sinAdjuntar = enPrompt.filter((n) => !enRefs.includes(n));
  if (sinDeclarar.length && sinAdjuntar.length) {
    problemas.push(
      `el orden no coincide: en "referencias" el producto va en la posicion ${sinDeclarar.join(', ')} ` +
        `y el prompt lo declara como ${nombres(sinAdjuntar)}` +
        (sinAdjuntar.every((n) => refs[n - 1] !== undefined)
          ? ` (ahi va ${sinAdjuntar.map((n) => `"${refs[n - 1]}"`).join(', ')})`
          : '')
    );
  } else if (sinDeclarar.length) {
    problemas.push(
      `el bloque adjunta el producto en la posicion ${sinDeclarar.join(', ')} y el prompt no tiene ` +
        `${sinDeclarar.map((k) => `"Imagen ${k}: el producto"`).join(', ')}`
    );
  } else if (sinAdjuntar.length) {
    problemas.push(
      enRefs.length
        ? `el prompt declara ${nombres(sinAdjuntar)} como el producto y en esa posicion de "referencias" no va el producto`
        : `el prompt declara ${nombres(sinAdjuntar)} como el producto y el bloque no adjunta el producto`
    );
  }

  // 4. El lugar (tipo "lugar": el fotograma de otro bloque, o la foto de un
  //    lugar): lo mismo que el producto. Una linea "Imagen k: la oficina...
  //    referencia del lugar" corresponde a una referencia tipo lugar.
  const lugaresEnRefs = refs.map((r, i) => (tipoDe(r) === 'lugar' ? i + 1 : null)).filter((n) => n !== null);
  const lugaresEnPrompt = nums.filter((n) => clase(declaradas.get(n)) === 'lugar');
  const lugarSinDeclarar = lugaresEnRefs.filter((k) => !lugaresEnPrompt.includes(k));
  const lugarSinAdjuntar = lugaresEnPrompt.filter((n) => !lugaresEnRefs.includes(n));
  if (lugarSinDeclarar.length && lugarSinAdjuntar.length) {
    problemas.push(
      `el orden no coincide: en "referencias" el lugar va en la posicion ${lugarSinDeclarar.join(', ')} ` +
        `y el prompt lo declara como ${nombres(lugarSinAdjuntar)}` +
        (lugarSinAdjuntar.every((n) => refs[n - 1] !== undefined)
          ? ` (ahi va ${lugarSinAdjuntar.map((n) => `"${refs[n - 1]}"`).join(', ')})`
          : '')
    );
  } else if (lugarSinDeclarar.length) {
    problemas.push(
      `el bloque adjunta el lugar "${lugarSinDeclarar.map((k) => refs[k - 1]).join('", "')}" en la posicion ${lugarSinDeclarar.join(', ')} ` +
        `y el prompt no tiene ${lugarSinDeclarar.map((k) => `"Imagen ${k}: <el lugar>... úsala solo como referencia del lugar"`).join(', ')}`
    );
  } else if (lugarSinAdjuntar.length) {
    problemas.push(
      lugaresEnRefs.length
        ? `el prompt declara ${nombres(lugarSinAdjuntar)} como referencia del lugar y en esa posicion de "referencias" no va un lugar`
        : `el prompt declara ${nombres(lugarSinAdjuntar)} como referencia del lugar y el bloque no adjunta ningun lugar (tipo "lugar")`
    );
  }

  if (!problemas.length) return;
  const orden = refs.map((r, i) => `${i + 1}) ${r}`).join('  ') || '(ninguna)';
  A(
    `${id}: las imagenes que nombra el prompt no cuadran con sus "referencias" (se mandan en este orden: ${orden}).\n` +
      problemas.map((p) => `         - ${p}.\n`).join('') +
      '         Omni recibe las imagenes en ese orden y el prompt las nombra por numero: si no coinciden, el clip\n' +
      '         sale con la cara o el producto cambiados. Corrige el prompt o el orden de "referencias".'
  );
}

/** Palabras habladas, contadas como en la prueba real (las muletillas cuentan). */
export const contarPalabras = (s) => String(s || '').split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;

const esTextoR = (v) => typeof v === 'string' && v.trim().length > 0;
const unirLineas = (tramos) =>
  tramos
    .filter((tr) => tr && esTextoR(tr.linea))
    .map((tr) => tr.linea)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Chequeos de un bloque R. Sirve igual para una toma R y para un gancho
 * alternativo (que es otra version del mismo bloque).
 *
 * `chequearIds`: las tomas ya pasan por validarReferencias(), que avisa de un
 * id que no existe; los ganchos no, asi que para ellos se comprueba aqui.
 */
function validarBloqueR(b, id, { idsLista, tipoDe, E, A, chequearIds = false }) {
  if (typeof b.duracion === 'number' && !DURACIONES_R.includes(b.duracion)) {
    E(`${id}: es un bloque R y dura ${b.duracion}s. Omni solo genera bloques de ${DURACIONES_R.join(', ')} s: elige la que le calce a sus palabras.`);
  }

  // Cero frames: el video sale solo de las referencias.
  if (b.prompt_imagen_inicial != null) E(`${id}: es un bloque R (solo referencias, sin frames): "prompt_imagen_inicial" debe ser null`);
  if (b.prompt_imagen_final != null) E(`${id}: es un bloque R (solo referencias, sin frames): "prompt_imagen_final" debe ser null`);
  if (b.frame_inicial !== undefined) E(`${id}: es un bloque R y no lleva "frame_inicial": no hay frames que heredar`);

  // Referencias: de 1 a 7, sin repetir, sin frames. El ORDEN importa: es el
  // "Imagen 1, Imagen 2" que nombra el prompt.
  const max = MODELOS_VIDEO[MODELO_VIDEO_UGC].referencias.max;
  if (!Array.isArray(b.referencias)) {
    if (chequearIds) E(`${id}: "referencias" debe ser un array de ids, en el orden en que el prompt nombra las imagenes`);
  } else {
    if (b.referencias.length < 1 || b.referencias.length > max) {
      E(`${id}: un bloque R lleva de 1 a ${max} referencias y trae ${b.referencias.length}. Son las imagenes que recibe el modelo, en orden.`);
    }
    const vistas = new Set();
    for (const r of b.referencias) {
      if (RESERVADAS.includes(r)) {
        E(`${id}: un bloque R no tiene frames, asi que no puede pedir "${r}"`);
      } else if (chequearIds && !idsLista.has(r)) {
        E(`${id} declara la referencia "${r}", que no esta en la lista de referencias.\n         Referencias disponibles: ${[...idsLista].join(', ') || '(ninguna)'}`);
      }
      if (vistas.has(r)) E(`${id}: la referencia "${r}" esta repetida`);
      vistas.add(r);
    }
    chequearImagenesR(b, id, { tipoDe, A });
  }

  // "Duración: Ns." del prompt = duracion del bloque.
  if (esTextoR(b.prompt_video)) {
    const mm = b.prompt_video.match(RE_DURACION_PROMPT);
    if (!mm) {
      E(`${id}: el prompt_video no trae "Duración: ${b.duracion}s." en la primera linea`);
    } else {
      const escrito = Number(String(mm[3]).replace(',', '.'));
      if (escrito !== b.duracion) {
        E(`${id}: el prompt dice "Duración: ${escrito}s." y "duracion" es ${b.duracion}. Tienen que coincidir: es el largo que se le pide al modelo.`);
      }
      const primera = b.prompt_video.trim().split(/\r?\n/)[0];
      if (!RE_DURACION_PROMPT.test(primera)) A(`${id}: "Duración: ${escrito}s." no esta en la primera linea del prompt_video`);
    }
    if (!/(Habla en|Speaks? in|Fala em)\s+\S/i.test(b.prompt_video)) {
      A(`${id}: el prompt_video no declara el idioma ("Habla en ..."). Sin eso el modelo puede cambiar de idioma o de acento.`);
    }
  }

  // Tramos: seguidos desde 0 hasta la duracion, sin huecos ni encimados.
  if (!Array.isArray(b.tramos) || b.tramos.length === 0) {
    E(`${id}: un bloque R necesita "tramos": [{ "desde": 0, "hasta": 2.2, "linea": "..." }, ...]`);
    return;
  }
  let fin = 0;
  let tramosBien = true;
  for (const [i, tr] of b.tramos.entries()) {
    const et = `${id}, tramo ${i + 1}`;
    if (!tr || typeof tr !== 'object' || typeof tr.desde !== 'number' || typeof tr.hasta !== 'number') {
      E(`${et}: debe ser { "desde": <segundos>, "hasta": <segundos>, "linea": "..." o null }`);
      tramosBien = false;
      continue;
    }
    if (Math.abs(tr.desde - fin) > EPS) {
      E(`${et}: empieza en ${tr.desde}s y deberia empezar en ${fin}s. Los tramos van seguidos desde 0, sin huecos ni encimados.`);
      tramosBien = false;
    }
    if (!(tr.hasta > tr.desde)) {
      E(`${et}: "hasta" (${tr.hasta}) tiene que ser mayor que "desde" (${tr.desde})`);
      tramosBien = false;
    }
    fin = tr.hasta;
    if (tr.linea !== null && !esTextoR(tr.linea)) {
      E(`${et}: "linea" es lo que se dice en ese tramo, o null si es un tramo sin dialogo`);
    }
    if (tr.habla !== undefined && !(Array.isArray(b.referencias) && b.referencias.includes(tr.habla))) {
      E(`${et}: "habla": ${JSON.stringify(tr.habla)} no esta entre las referencias del bloque`);
    }
  }
  if (typeof b.duracion === 'number' && Math.abs(fin - b.duracion) > EPS) {
    E(`${id}: los tramos terminan en ${fin}s y el bloque dura ${b.duracion}s. El ultimo tramo tiene que llegar justo a la duracion.`);
    tramosBien = false;
  }

  const validos = b.tramos.filter((tr) => tr && typeof tr === 'object');
  const hablados = validos.filter((tr) => esTextoR(tr.linea));
  const mudos = validos.filter((tr) => tr.linea === null || tr.linea === undefined);

  // "linea" = las lineas de los tramos unidas en orden. Contra ese campo se
  // alinean los subtitulos y el corte de cola: si no coincide, cortan mal.
  if (esTextoR(b.linea)) {
    const unidas = unirLineas(validos);
    if (unidas !== b.linea.replace(/\s+/g, ' ').trim()) {
      E(
        `${id}: "linea" tiene que ser exactamente las lineas de sus tramos, unidas en orden.\n` +
          `         linea:  "${b.linea}"\n` +
          `         tramos: "${unidas}"`
      );
    }
  }

  // Cada linea, literal dentro del prompt: lo que dice el tramo es lo que el
  // modelo tiene que pronunciar.
  if (esTextoR(b.prompt_video)) {
    for (const [i, tr] of b.tramos.entries()) {
      if (tr && esTextoR(tr.linea) && !b.prompt_video.includes(tr.linea)) {
        E(`${id}, tramo ${i + 1}: la linea "${tr.linea}" no aparece tal cual en el prompt_video. Tiene que estar copiada literal.`);
      }
    }
    // Y al reves: cada DIÁLOGO: “…” del prompt tiene que ser la linea de un
    // tramo. Lo que el modelo dice y no esta en los tramos queda fuera de
    // `linea`: los subtitulos no lo tienen y, si va al final del bloque, el
    // corte de cola lo toma por una repeticion y lo corta del montaje.
    const deTramos = new Set(hablados.map((tr) => tr.linea.trim()));
    const sobran = [...b.prompt_video.matchAll(/DI[AÁ]LOGO\s*:\s*[“"]([^”"]+)[”"]/gi)]
      .map((x) => x[1].trim())
      .filter((d) => !deTramos.has(d));
    for (const d of sobran) {
      A(
        `${id}: el prompt_video tiene DIÁLOGO: “${d}” y esa linea no es la de ningun tramo. ` +
          'Si se dice, va en su tramo (y en "linea"); si no, sacala del prompt.'
      );
    }
  }

  // Varios personajes que hablan: cada tramo dice quien.
  const personajes = Array.isArray(b.referencias) ? [...new Set(b.referencias)].filter((r) => tipoDe(r) === 'personaje') : [];
  if (personajes.length > 1 && hablados.some((tr) => tr.habla === undefined)) {
    A(`${id}: tiene ${personajes.length} personajes y hay tramos con dialogo sin "habla". Indica en cada uno quien lo dice.`);
  }

  // Avisos de escritura (no rompen nada, pero se notan en el clip).
  if (validos.length && mudos.includes(validos[0])) {
    A(`${id}: el primer tramo no tiene dialogo. Un bloque no arranca en silencio: el tramo mudo va en medio.`);
  }
  if (validos.length > 1 && mudos.includes(validos[validos.length - 1])) {
    A(`${id}: el ultimo tramo no tiene dialogo. Cierra con una linea corta y el gesto sostenido; el tramo mudo va en medio.`);
  }
  if (mudos.length > 1) A(`${id}: tiene ${mudos.length} tramos sin dialogo. La guia es como mucho uno por bloque.`);

  const guia = GUIA_PALABRAS_R[b.duracion];
  if (tramosBien && guia) {
    const palabras = hablados.reduce((n, tr) => n + contarPalabras(tr.linea), 0);
    const segMudos = mudos.reduce((s, tr) => s + (tr.hasta - tr.desde), 0);
    const [min, max] = guia.map((x) => Math.max(0, Math.round(x - PALABRAS_POR_SEGUNDO_R * segMudos)));
    const detalle =
      `${palabras} palabras en ${b.duracion}s` +
      (segMudos > 0 ? ` (con ${Number(segMudos.toFixed(2))}s sin dialogo)` : '') +
      `; la guia es ${min} a ${max} (~3 por segundo hablado)`;
    if (palabras < min) {
      A(`${id}: ${detalle}. Le sobra tiempo y el modelo tiende a repetir el final: conviene un bloque de menos segundos.`);
    } else if (palabras > max) {
      A(`${id}: ${detalle}. Va a hablar apurado o a cortar palabras: conviene un bloque de mas segundos o repartir el texto en dos bloques.`);
    }
  }
}

/**
 * Lugares repetidos (solo anuncios por bloques). Cuando un bloque vuelve a un
 * lugar que ya salio en otro, con solo texto Omni inventa otro lugar (Befem,
 * 2026-10-04: el bloque 4 decia "misma oficina" y salio otra). Con un fotograma
 * del bloque donde aparecio como referencia, sale el mismo. Se declara asi, sin
 * prompt ni archivo:
 *
 *   { "id": "lugar-oficina", "tipo": "lugar", "de_toma": 1, "segundo": 6.5, "nota": "..." }
 *
 * y los bloques (o ganchos) que vuelven ahi ponen "lugar-oficina" en sus
 * referencias. El motor saca el fotograma de video/toma-1.mp4 (gratis) y, si
 * el bloque de origen se genera en la misma corrida, genera despues a los que
 * lo usan. La forma (sin prompt ni archivo) la revisa validarReferencias().
 */
function validarLugaresR(m, lista, { hayR, E, A }) {
  const lugares = lista.filter(esLugarDeToma);
  if (!lugares.length) return;
  const tomas = m.tomas.filter((t) => t && typeof t === 'object');
  const ganchos = Array.isArray(m.ganchos_alternativos) ? m.ganchos_alternativos.filter((g) => g && typeof g === 'object') : [];
  const origenDe = new Map(); // id del lugar -> n del bloque de origen (si es valido)
  const posteriores = []; // { n, texto }: avisos de "su origen va despues" (salvo si hay ciclo)

  for (const r of lugares) {
    const id = `la referencia "${r.id}"`;
    if (!hayR) {
      E(`${id} saca el lugar de un bloque ("de_toma"): eso es solo para anuncios por bloques (tomas R).`);
      continue;
    }
    if (r.tipo !== 'lugar') {
      E(`${id} tiene "de_toma", asi que es un lugar sacado de un bloque: su "tipo" tiene que ser "lugar" — llego ${JSON.stringify(r.tipo)}`);
    }

    // de_toma: un bloque R que existe. Nunca un gancho (es opcional: puede no generarse).
    let origen = null;
    const gancho = ganchos.find((g) => String(g.id) === String(r.de_toma));
    if (!Number.isInteger(r.de_toma)) {
      E(
        gancho
          ? `${id}: "de_toma" apunta al gancho "${gancho.id}". Un gancho no puede ser el origen de un lugar (es opcional y puede no generarse). ` +
              `Usa el bloque original: "de_toma": ${JSON.stringify(gancho.reemplaza)}.`
          : `${id}: "de_toma" tiene que ser el numero del bloque de donde se saca el fotograma (ej. 1) — llego ${JSON.stringify(r.de_toma)}`
      );
    } else {
      origen = tomas.find((t) => t.n === r.de_toma) || null;
      if (!origen) {
        E(`${id}: "de_toma" apunta al bloque ${r.de_toma}, que no existe. Bloques: ${tomas.map((t) => t.n).join(', ')}.`);
      } else if (origen.tipo !== 'R') {
        E(`${id}: "de_toma" apunta a la toma ${r.de_toma}, que no es un bloque R.`);
        origen = null;
      } else {
        origenDe.set(r.id, origen.n);
      }
    }

    // segundo: dentro del bloque de origen. Lo elige la skill: la mitad de un
    // tramo donde el lugar se ve bien (plano medio o abierto).
    if (typeof r.segundo !== 'number' || !Number.isFinite(r.segundo)) {
      E(
        `${id}: falta "segundo" (un numero): el momento del bloque de origen donde se ve bien el lugar ` +
          `(la mitad de un tramo en plano medio o abierto) — llego ${JSON.stringify(r.segundo)}`
      );
    } else if (r.segundo < 0 || (origen && typeof origen.duracion === 'number' && r.segundo > origen.duracion)) {
      E(
        `${id}: "segundo" es ${r.segundo} y tiene que estar dentro del bloque de origen` +
          (origen && typeof origen.duracion === 'number' ? `, entre 0 y ${origen.duracion} (el bloque ${origen.n} dura ${origen.duracion}s).` : ', desde 0.')
      );
    }

    if (!origen) continue;
    // Quien lo usa. Un bloque no puede usar un fotograma de si mismo (todavia
    // no existe cuando se genera). Un gancho si puede, aunque reemplace al
    // bloque de origen: usa el fotograma del bloque ORIGINAL.
    for (const t of tomas) {
      if (!Array.isArray(t.referencias) || !t.referencias.includes(r.id)) continue;
      if (t.n === origen.n) {
        E(
          `toma ${t.n} usa el lugar "${r.id}", que se saca de ella misma ("de_toma": ${origen.n}). ` +
            'El fotograma tiene que salir de OTRO bloque, uno donde ese lugar ya aparece.'
        );
      } else if (t.n < origen.n) {
        posteriores.push({
          n: t.n,
          texto:
            `toma ${t.n} usa el lugar "${r.id}", que se saca del bloque ${origen.n}, que va despues. Se puede: ` +
            `el bloque ${t.n} se genera en una segunda pasada, cuando el ${origen.n} ya este generado.`,
        });
      }
    }
  }

  // Ciclos: el bloque 1 usa un lugar del 3 y el 3 usa un lugar del 1. Ninguno
  // se puede generar primero. (El caso de un bloque consigo mismo ya salio arriba.)
  const dependeDe = new Map(); // n -> Set de bloques de origen que necesita
  for (const t of tomas) {
    for (const ref of Array.isArray(t.referencias) ? t.referencias : []) {
      const o = origenDe.get(ref);
      if (o !== undefined && o !== t.n) {
        if (!dependeDe.has(t.n)) dependeDe.set(t.n, new Set());
        dependeDe.get(t.n).add(o);
      }
    }
  }
  const estado = new Map(); // n -> 1 visitando, 2 listo
  const reportados = new Set();
  const enCiclo = new Set();
  const visitar = (n, camino) => {
    if (estado.get(n) === 2) return;
    if (estado.get(n) === 1) {
      const ciclo = [...camino.slice(camino.indexOf(n)), n];
      const clave = [...new Set(ciclo)].sort((x, y) => x - y).join(',');
      for (const x of ciclo) enCiclo.add(x);
      if (!reportados.has(clave)) {
        reportados.add(clave);
        E(
          `los lugares repetidos forman un ciclo: ${ciclo.map((x) => `bloque ${x}`).join(' -> ')} ` +
            '(cada uno usa un fotograma del siguiente). Ninguno se puede generar primero: saca uno de esos fotogramas de otro bloque.'
        );
      }
      return;
    }
    estado.set(n, 1);
    for (const o of dependeDe.get(n) || []) visitar(o, [...camino, n]);
    estado.set(n, 2);
  };
  for (const n of dependeDe.keys()) visitar(n, []);

  // "Su origen va despues" es informativo; dentro de un ciclo ya hay un error.
  for (const p of posteriores) if (!enCiclo.has(p.n)) A(p.texto);
}

/**
 * Costo estimado de un anuncio por bloques. Lo pide el paso final de la skill
 * ANTES de generar: se muestra y se espera el si.
 *
 *   - hojas: cada referencia con prompt (normalmente solo el personaje), con
 *     MODELO_IMAGEN_UGC a RESOLUCION_IMAGEN_UGC.
 *   - bloques: un clip de flash-1-1 por toma R, al precio de su duracion.
 *   - ganchos: aparte y OPCIONALES. No se generan sin --ganchos.
 *
 * Con `carpeta`, marca lo que ya esta en disco: eso no se vuelve a pagar.
 */
function costoBloquesR(m, lista, { carpeta } = {}) {
  const existe = (rel) => Boolean(carpeta) && fs.existsSync(path.join(carpeta, rel));
  const precioHoja = PRECIOS.imagen[MODELO_IMAGEN_UGC]?.[RESOLUCION_IMAGEN_UGC] ?? null;
  const creditosDe = (b) =>
    typeof b.duracion === 'number' ? creditosClip(MODELO_VIDEO_UGC, b.duracion, RESOLUCION_VIDEO).creditos : null;

  const hojas = lista.filter(esGenerada).map((r) => {
    const archivo = `img/${archivoDeHoja(r)}`;
    return { id: r.id, archivo, creditos: precioHoja, yaExiste: existe(archivo) };
  });
  const bloques = m.tomas
    .filter((t) => t.tipo === 'R')
    .map((t) => {
      const archivo = `video/toma-${t.n}.mp4`;
      return { n: t.n, duracion: t.duracion, archivo, creditos: creditosDe(t), yaExiste: existe(archivo) };
    });
  const ganchos = (Array.isArray(m.ganchos_alternativos) ? m.ganchos_alternativos : []).map((g) => {
    const archivo = `video/gancho-${g?.id}.mp4`;
    return { id: g?.id, reemplaza: g?.reemplaza, duracion: g?.duracion, archivo, creditos: creditosDe(g || {}), yaExiste: existe(archivo) };
  });

  // Lugares repetidos: el fotograma lo saca el motor del bloque de origen
  // (ffmpeg): no cuesta nada. Solo aparecen si el manifiesto los usa.
  const lugares = lista.filter(esLugarDeToma).map((r) => {
    const archivo = `img/${archivoDeHoja(r)}`;
    return { id: r.id, archivo, de_toma: r.de_toma, segundo: r.segundo, creditos: 0, yaExiste: existe(archivo) };
  });

  const suma = (xs) => xs.reduce((s, x) => s + (x.creditos ?? 0), 0);
  const pendientes = (xs) => xs.filter((x) => !x.yaExiste);
  return {
    modeloImagen: MODELO_IMAGEN_UGC,
    resolucionImagen: RESOLUCION_IMAGEN_UGC,
    precioHojaVerificado: precioHoja !== null,
    modeloVideo: MODELO_VIDEO_UGC,
    resolucionVideo: RESOLUCION_VIDEO,
    hojas,
    ...(lugares.length ? { lugares } : {}),
    bloques,
    ganchos,
    creditos: {
      hojas: suma(hojas),
      bloques: suma(bloques),
      total: suma(hojas) + suma(bloques),
      pendiente: suma(pendientes(hojas)) + suma(pendientes(bloques)),
      ganchosOpcionales: suma(ganchos),
      ganchosPendiente: suma(pendientes(ganchos)),
    },
  };
}

// ---------------------------------------------------------------- tomas H
//
// Una toma H es un clip hablado de 4, 6, 8 o 10 s que Omni genera a partir de
// la imagen del clip (img/toma-N-inicial.png). Esa imagen o se genera como en
// una toma A (prompt + referencias) o se copia tal cual de una referencia
// ("frame_inicial": una hoja generada o una foto aportada; no se paga). Nunca
// "heredado": no hay frame final anterior. El video se pide de una de dos
// maneras (first_frame_url e image_urls no se mezclan en la misma llamada):
//
//   - con la imagen como primer cuadro (first_frame_url), sin referencias:
//     el podcast, y una toma de entrevista sin "ingredientes" (manifiestos de
//     antes del 2026-10-14);
//   - por INGREDIENTES (solo entrevista, ESTILOS_CON_INGREDIENTES): la lista
//     ordenada "ingredientes" va como image_urls, con la imagen del clip
//     primero ("imagen") y despues referencias (la mano con el microfono, el
//     producto). Ver validarIngredientes.
//
// En la entrevista una toma puede traer "cola_seg" (opcional, 0 a 3 s): cuanto
// queda del clip despues de la ultima palabra del guion (COLA_MAX_SEG).
//
// Solo la escriben las skills de podcast y entrevista (ESTILOS_HABLADOS), y
// todo lo de esta seccion corre SOLO si hay tomas H o el estilo es hablado:
// ningun otro estilo pasa por aqui.
const HOSTS = ['A', 'B'];
const LADOS = ['izquierda', 'derecha'];
const MODOS_BROLL_PODCAST = ['pantalla-dividida', 'esquina'];
const VOCES_ENTREVISTA = ['entrevistador', 'persona'];
// El B-roll de estos estilos se genera con el modelo de MODELO_VIDEO_BROLL_POR_ESTILO
// (Kling): duracion libre pero entera, entre los topes de ese modelo. Se leen al
// validar y no al cargar el modulo: si un dia ese modelo cambia de nombre en
// config.js, que falle solo este estilo y no el import del validador (y de todo
// lo que lo importa) para los demas estilos (hallazgo de revision, 2026-10-13).
// 3 y 15 son los topes de Kling 3.0, por si
// el modelo no trae los suyos.
function topesBrollHablado(estilo) {
  const def = MODELOS_VIDEO[MODELO_VIDEO_BROLL_POR_ESTILO[estilo]];
  return { min: def?.duracionMin ?? 3, max: def?.duracionMax ?? 15 };
}
// Guia de palabras por clip. Es un AVISO: sirve para
// escribir bien a la primera, pero cada clip se revisa igual. Los de 4 s no
// tenian guia propia: se bajan en proporcion (2 a 2,6 palabras por segundo
// en podcast; 1,2 a 2,1 con dos voces y hasta 2,5 con una en entrevista).
const GUIA_PALABRAS_PODCAST = { 10: [20, 26], 8: [16, 21], 6: [12, 15], 4: [8, 10] };
const GUIA_PALABRAS_ENTREVISTA_DOS_VOCES = { 10: [12, 21], 8: [10, 17], 6: [7, 13], 4: [5, 8] };
const GUIA_PALABRAS_ENTREVISTA_UNA_VOZ = { 10: 25, 8: 20, 6: 15, 4: 10 };
// Entrevista A: entre dos frases ancla de la cadena de B-roll no pueden pasar
// mas de estos segundos. Aqui se estima con la duracion
// pedida de cada clip y la posicion de la frase en su linea; el plan lo mide
// de verdad con los subtitulos.
const VENTANA_BROLL_HISTORIA_MAX_SEG = 8;
// Podcast: el motor no pone un cutaway en los primeros 2 s del turno de quien
// habla (quien empieza a hablar se ve). Con la guia de 2 a 2,6 palabras por
// segundo, 2 s son unas 4 palabras: un "cutaway.tras" que termina antes cae
// ahi y la reaccion llegaria tarde. Es un AVISO (estimado por palabras).
const PALABRAS_INICIO_TURNO = 4;
// Entrevista: "tomas[].cola_seg" (opcional) es cuanto queda del clip despues de
// la ultima palabra del guion al cortarlo por palabras; sin el campo el plan
// deja 0,25 s (0,8 s en el ultimo clip del gancho de A, la cara de "no se").
// Mas de 3 s ya no es una cola: es otro clip.
const COLA_MAX_SEG = 3;
// Entrevista: el check cae en la PALABRA de la opcion elegida, la ultima de
// "check_con" que tambien esta en "aparece_con", sin estas palabras vacias
// (2026-10-14). Ya normalizadas como
// palabrasNormalizadas (minusculas, sin tildes).
const PALABRAS_VACIAS_CHECK = new Set(
  'de del o u y e la las el los lo a al en con por para un una uno que eh ah ahm mm este'.split(' ')
);

/**
 * Palabras de un texto normalizadas como las de los subtitulos (misma idea
 * que normalizarPalabra en planear-montaje.js: minusculas, sin tildes ni
 * puntuacion), para buscar una frase "textual" sin que una coma, una tilde o
 * una mayuscula la hagan fallar. Una frase que no pasa por aqui tampoco la
 * encontraria el plan al anclar el B-roll o el icono.
 */
const palabrasNormalizadas = (s) =>
  String(s || '')
    .split(/\s+/)
    .map((w) => w.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, ''))
    .filter(Boolean);

const textoNormalizado = (s) => palabrasNormalizadas(s).join(' ');

/**
 * Donde cae `frase` dentro de `texto`, por palabras. Devuelve null si no
 * esta, o { indice, total, fraccion }: la palabra donde empieza, cuantas tiene
 * el texto y en que parte del texto cae (0 = al principio, 1 = al final), que
 * sirve para estimar en que segundo del clip se dice.
 */
function fraseEn(texto, frase) {
  const palabras = palabrasNormalizadas(texto);
  const objetivo = palabrasNormalizadas(frase);
  if (!palabras.length || !objetivo.length) return null;
  for (let i = 0; i <= palabras.length - objetivo.length; i++) {
    if (objetivo.every((w, j) => palabras[i + j] === w)) {
      return { indice: i, total: palabras.length, fraccion: i / palabras.length };
    }
  }
  return null;
}

/** En que palabras de `texto` empieza `frase`, todas las veces que esta (por palabras, como fraseEn). */
function iniciosEn(texto, frase) {
  const palabras = palabrasNormalizadas(texto);
  const objetivo = palabrasNormalizadas(frase);
  if (!objetivo.length) return [];
  const inicios = [];
  for (let i = 0; i <= palabras.length - objetivo.length; i++) {
    if (objetivo.every((w, j) => palabras[i + j] === w)) inicios.push(i);
  }
  return inicios;
}

/** Cuantas veces esta `frase` dentro de `texto`, por palabras (como fraseEn). */
const vecesEn = (texto, frase) => iniciosEn(texto, frase).length;

/** Los iconos de todos los grupos (entrevista), planos. */
const iconosDe = (m) =>
  (Array.isArray(m.iconos) ? m.iconos : []).flatMap((g) =>
    Array.isArray(g?.iconos) ? g.iconos.filter((ic) => ic && typeof ic === 'object') : []
  );

/**
 * Chequeos de UNA toma H. Lo que es del
 * conjunto (hosts, guion, congelado, B-roll, iconos) va en validarPodcast y
 * validarEntrevista.
 */
function validarTomaH(t, id, { lista, E, A }) {
  const reacciones = t.clase === 'reacciones';

  if (typeof t.duracion === 'number' && !DURACIONES_H.includes(t.duracion)) {
    E(`${id}: es una toma hablada (H) y dura ${t.duracion}s. Omni solo genera clips de ${DURACIONES_H.join(', ')} s: mide el clip y redondea hacia arriba.`);
  }

  // "linea" es todo lo que se dice en el clip, en orden: contra eso se alinean
  // los subtitulos y la transcripcion. Solo el clip de reacciones va sin texto.
  if (typeof t.linea !== 'string') {
    E(`${id}: "linea" debe ser texto: todo lo que se dice en el clip, en orden${reacciones ? ' ("" en el clip de reacciones)' : ''}`);
  } else if (!t.linea.trim() && !reacciones) {
    E(`${id}: "linea" esta vacia. Solo el clip de reacciones ("clase": "reacciones") va sin linea.`);
  } else if (t.linea.trim() && reacciones) {
    E(`${id}: es el clip de reacciones y "linea" tiene que ser "": ahi no se dice nada.`);
  }

  if (t.prompt_imagen_final != null) E(`${id}: es una toma H y "prompt_imagen_final" debe ser null: solo lleva frame inicial`);
  if (t.solo_voz !== undefined && typeof t.solo_voz !== 'boolean') {
    E(`${id}: "solo_voz" solo acepta true o false — llego ${JSON.stringify(t.solo_voz)}`);
  }

  // El frame inicial: o se copia de una referencia (frame_inicial, 0 cr) o se
  // genera con prompt + referencias como en una toma A.
  const fi = t.frame_inicial;
  if (fi !== undefined && fi !== null) {
    if (fi === 'heredado') {
      E(
        `${id}: "frame_inicial": "heredado" no vale en una toma H (no hay frame final anterior que heredar). ` +
          'Pon el id de una referencia (ej. "host-a") o quitalo y escribe "prompt_imagen_inicial".'
      );
    } else if (typeof fi !== 'string' || !fi.trim()) {
      E(`${id}: "frame_inicial" debe ser el id de una referencia (hoja generada o foto aportada) — llego ${JSON.stringify(fi)}`);
    } else {
      const r = lista.find((x) => x.id === fi);
      if (!r) {
        E(
          `${id}: "frame_inicial" apunta a "${fi}", que no esta en la lista de referencias.\n` +
            `         Referencias disponibles: ${lista.map((x) => x.id).join(', ') || '(ninguna)'}`
        );
      } else if (esLugarDeToma(r)) {
        E(`${id}: "frame_inicial" apunta a "${fi}", que es un lugar sacado de un bloque ("de_toma"). El frame inicial tiene que ser una hoja generada o una foto aportada.`);
      }
    }
    if (t.prompt_imagen_inicial != null) {
      E(`${id}: con "frame_inicial" la imagen se copia tal cual (no se genera): "prompt_imagen_inicial" debe ser null`);
    }
    if (!Array.isArray(t.referencias) || t.referencias.length > 0) {
      E(`${id}: con "frame_inicial" las referencias ya estan dentro de esa imagen: "referencias" debe ser []`);
    }
  } else {
    if (!esTextoR(t.prompt_imagen_inicial)) {
      E(`${id}: falta "prompt_imagen_inicial" (sin "frame_inicial", la imagen del frame se genera con ese prompt y sus "referencias")`);
    }
    if (!Array.isArray(t.referencias)) {
      E(`${id}: "referencias" debe ser un array de ids: las de la IMAGEN del clip (al video solo van los "ingredientes", en la entrevista)`);
    }
  }

  // "Duración:" en el prompt no es obligatoria en H; si viene, el motor la
  // ajusta al pedir el clip (ajustarDuracionEnPrompt), pero mejor que coincida.
  if (esTextoR(t.prompt_video) && typeof t.duracion === 'number') {
    const mm = t.prompt_video.match(RE_DURACION_PROMPT);
    if (mm) {
      const escrito = Number(String(mm[3]).replace(',', '.'));
      if (escrito !== t.duracion) {
        A(`${id}: el prompt dice "Duración: ${escrito}s." y "duracion" es ${t.duracion}. El motor la ajusta al pedir el clip, pero conviene que coincidan.`);
      }
    }
  }
}

/** La referencia del producto: el id "producto" o cualquiera de tipo "producto". */
const esIdDeProducto = (idRef, lista) => idRef === 'producto' || lista.find((r) => r.id === idRef)?.tipo === 'producto';

/**
 * Ingredientes de UNA toma H de la entrevista (2026-10-14, tras las pruebas
 * Befem A y B): la lista ORDENADA de imagenes con que Omni genera el clip
 * (image_urls), como se hace a mano en Flow. "imagen" (INGREDIENTE_IMAGEN) es
 * la imagen del clip, img/toma-N-inicial.png, que se sigue generando con su
 * prompt y sus referencias, y va siempre primero (imagen 1: el prompt la pide
 * como frame inicial); los demas son ids de referencias. A: ["imagen"]. B:
 * ["imagen", "mano-mic"], y ["imagen", "mano-mic", "producto"] cuando el
 * producto esta en cuadro. Solo la llama validarEntrevista: en cualquier otro
 * estilo el campo ya es un error.
 */
function validarIngredientes(t, id, { lista, variante, E, A }) {
  const ing = t.ingredientes;
  const max = MODELOS_VIDEO[MODELO_VIDEO_UGC].referencias.max;
  const ejemplo = variante === 'B' ? '["imagen", "mano-mic"] (y "producto" si sale)' : '["imagen"]';
  if (!Array.isArray(ing) || ing.length === 0) {
    E(
      `${id}: "ingredientes" debe ser una lista no vacia: las imagenes del video en el orden en que el prompt las ` +
        `nombra, empezando por "${INGREDIENTE_IMAGEN}" (la imagen del clip). Ej. ${ejemplo} — llego ${JSON.stringify(ing)}`
    );
    return;
  }
  if (ing[0] !== INGREDIENTE_IMAGEN) {
    E(
      `${id}: el primer ingrediente tiene que ser "${INGREDIENTE_IMAGEN}" (la imagen del clip, img/toma-${t.n}-inicial.png, ` +
        `que el prompt pide como frame inicial: imagen 1) — llego ${JSON.stringify(ing[0])}`
    );
  }
  if (ing.length > max) E(`${id}: lleva ${ing.length} ingredientes y Omni recibe como mucho ${max} imagenes.`);
  const vistos = new Set();
  for (const x of ing) {
    if (vistos.has(x)) {
      E(`${id}: el ingrediente ${JSON.stringify(x)} esta repetido`);
      continue;
    }
    vistos.add(x);
    if (x === INGREDIENTE_IMAGEN) continue;
    if (typeof x !== 'string' || !x.trim()) {
      E(`${id}: cada ingrediente es "${INGREDIENTE_IMAGEN}" o el id de una referencia — llego ${JSON.stringify(x)}`);
      continue;
    }
    if (RESERVADAS.includes(x)) {
      E(`${id}: el ingrediente "${x}" no vale: la imagen del clip se pide como "${INGREDIENTE_IMAGEN}"`);
      continue;
    }
    const r = lista.find((y) => y.id === x);
    if (!r) {
      E(
        `${id}: el ingrediente "${x}" no esta en la lista de referencias.\n` +
          `         Referencias disponibles: ${lista.map((y) => y.id).join(', ') || '(ninguna)'}`
      );
    } else if (esLugarDeToma(r)) {
      E(`${id}: el ingrediente "${x}" es un lugar sacado de un bloque ("de_toma"): eso es solo de los bloques R.`);
    }
  }
  // B: la mano del entrevistador con el microfono se ve en todos los clips.
  if (variante === 'B' && !ing.includes('mano-mic')) {
    E(`${id}: en la variante B los ingredientes llevan "mano-mic" (la mano del entrevistador con el microfono, imagen 2) — trae ${JSON.stringify(ing)}`);
  }
  // El producto en cuadro: si la imagen del clip lo lleva, el video tambien
  // recibe su foto, para que la etiqueta quede exactamente igual.
  for (const p of (Array.isArray(t.referencias) ? t.referencias : []).filter((r) => esIdDeProducto(r, lista))) {
    if (ing.includes(p)) continue;
    (variante === 'B' ? E : A)(
      `${id}: la imagen del clip lleva el producto ("${p}" en "referencias") y los ingredientes no. Agregalo ` +
        `(despues de ${variante === 'B' ? '"mano-mic"' : '"imagen"'}) para que el video reciba la foto y la etiqueta quede exactamente igual.`
    );
  }
  chequearImagenesIngredientes(t, id, { lista, A });
}

/**
 * Que las "(imagen N)" del prompt_video cuadren con los ingredientes: la 1 es
 * la imagen del clip, cada una de las demas esta nombrada, ninguna pasa de
 * las que se mandan, y la mano y el producto van en su lugar. Es un AVISO: el
 * prompt es texto libre y esto lo lee por palabras (lo que dice justo antes
 * de "imagen N": "la mano con el micrófono (imagen 2)", "La foto del producto
 * (imagen 3)").
 */
function chequearImagenesIngredientes(t, id, { lista, A }) {
  if (!esTextoR(t.prompt_video) || !Array.isArray(t.ingredientes)) return;
  const ing = t.ingredientes;
  const total = ing.length;
  const antesDe = new Map(); // N -> lo que dice antes de la primera "imagen N", hasta el punto o el punto y coma
  for (const x of t.prompt_video.matchAll(RE_IMAGEN_MENCION)) {
    const n = Number(x[1]);
    if (!antesDe.has(n)) antesDe.set(n, t.prompt_video.slice(Math.max(0, x.index - 80), x.index).split(/[.;:\n]/).pop());
  }
  const problemas = [];
  if (!antesDe.has(1)) {
    problemas.push('no nombra la imagen del clip como "(imagen 1)" (ej. "Usa la misma imagen de la mujer en la calle (imagen 1), ... como frame inicial del video")');
  }
  const deMas = [...antesDe.keys()].filter((n) => n < 1 || n > total).sort((a, b) => a - b);
  if (deMas.length) problemas.push(`nombra la imagen ${deMas.join(', ')} y se mandan ${total}`);
  const RE_MANO = /micr[oó]fono|microphone|microfone|\bmano\b|\bhand\b|\bm[aã]o\b/i;
  ing.forEach((x, i) => {
    const k = i + 1;
    if (k === 1 || typeof x !== 'string') return;
    if (!antesDe.has(k)) {
      problemas.push(`no dice que es la imagen ${k} ("${x}")`);
      return;
    }
    const antes = antesDe.get(k);
    const dice = { mano: RE_MANO.test(antes), producto: RE_DECL_PRODUCTO.test(antes) };
    if (x === 'mano-mic' && dice.producto && !dice.mano) problemas.push(`nombra la imagen ${k} como el producto y en esa posicion va "mano-mic"`);
    if (esIdDeProducto(x, lista) && dice.mano && !dice.producto) problemas.push(`nombra la imagen ${k} como la mano con el microfono y en esa posicion va "${x}"`);
  });
  if (!problemas.length) return;
  A(
    `${id}: las imagenes que nombra el prompt no cuadran con sus "ingredientes" (se mandan en este orden: ${ing.map((x, i) => `${i + 1}) ${x}`).join('  ')}).\n` +
      problemas.map((p) => `         - el prompt ${p}.\n`).join('') +
      '         Omni recibe las imagenes en ese orden y el prompt las nombra por numero: si no coinciden, el clip\n' +
      '         sale con la persona, la mano o el producto cambiados. Corrige el prompt o el orden de "ingredientes".'
  );
}

/**
 * Reglas de conjunto del podcast: los dos hosts,
 * el guion completo y su reparto en clips, el clip de reacciones de cada host,
 * los cutaways y el B-roll por linea. Solo corre con estilo "podcast".
 */
function validarPodcast(m, lista, { tomasH, E, A }) {
  const p = m.podcast;
  if (!p || typeof p !== 'object') {
    E('estilo podcast: falta el bloque "podcast" ({ "hosts": { "A": "host-a", "B": "host-b" }, "lados": { ... }, "broll": { "modo": "pantalla-dividida" } })');
  }
  const hosts = p?.hosts && typeof p.hosts === 'object' ? p.hosts : {};
  for (const h of HOSTS) {
    const id = hosts[h];
    if (!esTextoR(id)) {
      E(`podcast.hosts.${h}: falta el id de la hoja del host ${h} (una referencia generada, con "prompt")`);
      continue;
    }
    const r = lista.find((x) => x.id === id);
    if (!r) E(`podcast.hosts.${h} apunta a "${id}", que no esta en la lista de referencias`);
    else if (!esGenerada(r)) E(`podcast.hosts.${h} apunta a "${id}", que no se genera (no tiene "prompt"). Los dos hosts siempre los genera la IA.`);
  }
  if (esTextoR(hosts.A) && hosts.A === hosts.B) E(`podcast.hosts: A y B apuntan a la misma hoja ("${hosts.A}"). Son dos personas distintas.`);
  if (p?.lados && typeof p.lados === 'object') {
    for (const h of HOSTS) {
      if (p.lados[h] !== undefined && !LADOS.includes(p.lados[h])) {
        E(`podcast.lados.${h} debe ser "izquierda" o "derecha" — llego ${JSON.stringify(p.lados[h])}`);
      }
    }
  }
  if (p?.broll?.modo !== undefined && !MODOS_BROLL_PODCAST.includes(p.broll.modo)) {
    E(`podcast.broll.modo debe ser ${MODOS_BROLL_PODCAST.map((x) => `"${x}"`).join(' o ')} — llego ${JSON.stringify(p.broll.modo)}`);
  }
  if (Array.isArray(m.iconos) && m.iconos.length) E('estilo podcast: "iconos" es solo de la entrevista. Se generarian y se cobrarian sin usarse.');
  if (m.sticker_producto !== undefined && m.sticker_producto !== null) E('estilo podcast: "sticker_producto" (el producto al centro) es solo de la entrevista.');

  // --- guion: la conversacion completa, orden 1..N sin huecos ---
  if (!Array.isArray(m.guion) || m.guion.length === 0) {
    E('estilo podcast: falta "guion": la conversacion completa en orden ([{ "orden": 1, "habla": "A", "texto": "...", "beat": "..." }, ...])');
    return;
  }
  const porOrden = new Map(); // orden -> linea del guion
  m.guion.forEach((l, i) => {
    const et = `guion, linea ${i + 1}`;
    if (!l || typeof l !== 'object') {
      E(`${et}: debe ser { "orden": N, "habla": "A" | "B", "texto": "..." }`);
      return;
    }
    if (!Number.isInteger(l.orden) || l.orden < 1) E(`${et}: "orden" debe ser un entero >= 1 — llego ${JSON.stringify(l.orden)}`);
    else if (porOrden.has(l.orden)) E(`guion: el orden ${l.orden} esta repetido`);
    else porOrden.set(l.orden, l);
    if (!HOSTS.includes(l.habla)) E(`${et}: "habla" debe ser "A" o "B" — llego ${JSON.stringify(l.habla)}`);
    if (!esTextoR(l.texto)) E(`${et}: falta "texto"`);
    // Cutaway: durante esta linea se ve al OTRO host reaccionando, justo
    // despues de la frase "tras" (que se revisa abajo, con los turnos).
    if (l.cutaway !== undefined && l.cutaway !== null) {
      const c = l.cutaway;
      if (!c || typeof c !== 'object') {
        E(`${et}: "cutaway" debe ser { "host": "A" | "B", "reaccion": 1 | 2 | 3, "tras": "<frase textual de esta linea>" }`);
      } else {
        if (!HOSTS.includes(c.host)) E(`${et}: "cutaway.host" debe ser "A" o "B" — llego ${JSON.stringify(c.host)}`);
        else if (c.host === l.habla) E(`${et}: el cutaway muestra al OTRO host reaccionando: "cutaway.host" no puede ser ${l.habla}, que es quien habla`);
        if (!Number.isInteger(c.reaccion) || c.reaccion < 1 || c.reaccion > 3) {
          E(`${et}: "cutaway.reaccion" debe ser 1, 2 o 3 (una reaccion del clip de reacciones de ese host) — llego ${JSON.stringify(c.reaccion)}`);
        }
      }
    }
  });
  const ordenes = [...porOrden.keys()].sort((a, b) => a - b);
  const ultimo = ordenes[ordenes.length - 1] || 0;
  const faltan = [];
  for (let k = 1; k <= ultimo; k++) if (!porOrden.has(k)) faltan.push(k);
  if (faltan.length) E(`guion: faltan los ordenes ${faltan.join(', ')}. Van de 1 a ${ultimo} sin huecos.`);

  // --- cutaways: la frase tras la que entra la reaccion ("cutaway.tras") ---
  //
  // El motor pone el cutaway 0,1 s antes del FIN de esa frase, nunca en los
  // primeros 2 s del turno de quien habla (turno = lineas seguidas del mismo
  // host), con quien habla de vuelta en cuadro antes del fin de su turno y
  // nunca encima de un B-roll. Sin "tras" (manifiestos de antes) entra a los
  // 2 s del inicio del turno. Aqui: que "tras" sea un trozo literal de SU
  // linea (error), y avisos si falta o si cae en las primeras palabras del turno.
  let palabrasDelTurno = 0; // del turno de quien habla, antes de esta linea
  const sinTras = []; // ordenes de las lineas con cutaway sin "tras"
  ordenes.forEach((orden, i) => {
    const l = porOrden.get(orden);
    if (i > 0 && porOrden.get(ordenes[i - 1]).habla !== l.habla) palabrasDelTurno = 0;
    const c = l.cutaway;
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      const et = `guion, linea ${orden}`;
      if (c.tras === undefined || c.tras === null) {
        sinTras.push(orden);
      } else if (!esTextoR(c.tras)) {
        E(`${et}: "cutaway.tras" debe ser una frase textual de esta linea — llego ${JSON.stringify(c.tras)}`);
      } else if (esTextoR(l.texto)) {
        const pos = fraseEn(l.texto, c.tras);
        if (!pos) {
          E(`${et}: "cutaway.tras" ("${c.tras}") no aparece en la linea: "${l.texto}". Tiene que ser un trozo literal de ella.`);
        } else {
          const fin = palabrasDelTurno + pos.indice + palabrasNormalizadas(c.tras).length;
          if (fin <= PALABRAS_INICIO_TURNO) {
            A(
              `${et}: "cutaway.tras" ("${c.tras}") termina en la palabra ${fin} del turno de ${l.habla}. El cutaway nunca entra ` +
                'en los primeros 2 s del turno (quien empieza a hablar se ve), asi que la reaccion llegaria tarde: marca una frase posterior.'
            );
          }
          if (vecesEn(l.texto, c.tras) > 1) {
            A(`${et}: "cutaway.tras" ("${c.tras}") aparece mas de una vez en la linea. Marca un trozo que este una sola vez, para que no haya duda de donde entra.`);
          }
        }
      }
    }
    palabrasDelTurno += palabrasNormalizadas(l.texto).length;
  });
  if (sinTras.length) {
    A(
      `guion, ${sinTras.length === 1 ? `linea ${sinTras[0]}: el cutaway no trae` : `lineas ${sinTras.join(', ')}: sus cutaways no traen`} ` +
        '"tras" (la frase de esa linea despues de la cual entra la reaccion). Sin ella el motor lo pone a los 2 s del inicio ' +
        'del turno; con ella entra justo despues de la frase que lo provoca.'
    );
  }

  // --- tomas: cada linea del guion en exactamente una toma, mismo host, mismo texto ---
  const reaccionesDe = { A: [], B: [] };
  const tomasDeOrden = new Map(); // orden -> [n de toma]
  for (const t of tomasH) {
    const id = `toma ${t.n}`;
    // Ingredientes: solo la entrevista. El podcast se aprobo con frame inicial
    // y por ingredientes no se probo.
    if (t.ingredientes !== undefined && t.ingredientes !== null) {
      E(`${id}: "ingredientes" es solo de la entrevista. En podcast cada clip se genera con su imagen como frame inicial: quita el campo.`);
    }
    // La cola por palabras es de la entrevista: el podcast corta sus clips a su
    // manera y no lee el campo.
    if (t.cola_seg !== undefined && t.cola_seg !== null) {
      A(`${id}: "cola_seg" es solo de la entrevista (la cola del clip al cortarlo por palabras); en podcast no se usa: quita el campo.`);
    }
    if (!HOSTS.includes(t.habla)) {
      E(`${id}: en podcast cada toma H lleva "habla": "A" o "B" (el host que sale en el clip) — llego ${JSON.stringify(t.habla)}`);
    }
    if (t.clase === 'reacciones') {
      if (HOSTS.includes(t.habla)) reaccionesDe[t.habla].push(t.n);
      if (!Array.isArray(t.reacciones) || t.reacciones.length !== 3) {
        E(
          `${id}: el clip de reacciones lleva exactamente 3 "reacciones" ([{ "n": 1, "descripcion": "..." }, ...]) — ` +
            `trae ${Array.isArray(t.reacciones) ? t.reacciones.length : 'ninguna'}`
        );
      } else {
        t.reacciones.forEach((r, i) => {
          if (!r || typeof r !== 'object' || r.n !== i + 1 || !esTextoR(r.descripcion)) {
            E(`${id}, reaccion ${i + 1}: debe ser { "n": ${i + 1}, "descripcion": "..." } (van numeradas 1, 2, 3 en orden)`);
          }
        });
      }
      if (Array.isArray(t.lineas) && t.lineas.length) E(`${id}: es el clip de reacciones y no lleva "lineas": no se dice nada`);
      if (typeof t.duracion === 'number' && t.duracion !== 8) {
        A(`${id}: el clip de reacciones dura ${t.duracion}s; la regla del estilo es 8 s (tres reacciones, una por tercio)`);
      }
      continue;
    }
    if (t.clase !== undefined && t.clase !== null) E(`${id}: "clase" solo acepta "reacciones" — llego ${JSON.stringify(t.clase)}`);
    if (!Array.isArray(t.lineas) || t.lineas.length === 0) {
      E(`${id}: lleva "lineas": las lineas del guion que contiene el clip, en el orden en que se dicen ([{ "orden": 1, "texto": "..." }, ...])`);
      continue;
    }
    const textos = [];
    for (const [i, l] of t.lineas.entries()) {
      const et = `${id}, linea ${i + 1}`;
      if (!l || typeof l !== 'object' || !Number.isInteger(l.orden) || !esTextoR(l.texto)) {
        E(`${et}: debe ser { "orden": N, "texto": "..." }`);
        continue;
      }
      textos.push(l.texto);
      if (!tomasDeOrden.has(l.orden)) tomasDeOrden.set(l.orden, []);
      tomasDeOrden.get(l.orden).push(t.n);
      const g = porOrden.get(l.orden);
      if (!g) {
        E(`${et}: el orden ${l.orden} no esta en el guion`);
        continue;
      }
      if (HOSTS.includes(t.habla) && g.habla !== t.habla) E(`${et}: la linea ${l.orden} del guion la dice ${g.habla} y esta toma es de ${t.habla}`);
      if (esTextoR(g.texto) && textoNormalizado(g.texto) !== textoNormalizado(l.texto)) {
        E(`${et}: el texto no es el de la linea ${l.orden} del guion.\n         guion: "${g.texto}"\n         toma:  "${l.texto}"`);
      }
    }
    // "linea" = los textos de sus lineas unidos: contra eso se alinean los
    // subtitulos y la transcripcion de lineas-habladas.js.
    if (esTextoR(t.linea) && textos.length === t.lineas.length) {
      const unidas = textos.join(' ').replace(/\s+/g, ' ').trim();
      if (t.linea.replace(/\s+/g, ' ').trim() !== unidas) {
        E(`${id}: "linea" tiene que ser exactamente los textos de sus "lineas", unidos por un espacio.\n         linea:  "${t.linea}"\n         lineas: "${unidas}"`);
      }
    }
    const guia = GUIA_PALABRAS_PODCAST[t.duracion];
    if (guia && esTextoR(t.linea)) {
      const palabras = contarPalabras(t.linea);
      if (palabras < guia[0]) {
        A(
          `${id}: ${palabras} palabras en ${t.duracion}s; la guia es ${guia[0]} a ${guia[1]}. Le sobra tiempo, y con tiempo de sobra ` +
            'Omni tiende a repetir o agregar palabras (un clip asi se regenera): conviene un clip de menos segundos.'
        );
      } else if (palabras > guia[1]) {
        A(`${id}: ${palabras} palabras en ${t.duracion}s; la guia es ${guia[0]} a ${guia[1]}. Va a hablar apurado o a cortar: conviene un clip de mas segundos o repartir en dos.`);
      }
    }
  }
  for (const orden of ordenes) {
    const en = tomasDeOrden.get(orden) || [];
    if (en.length === 0) E(`guion: la linea ${orden} no esta en las "lineas" de ninguna toma. Cada linea se dice en un clip.`);
    else if (en.length > 1) E(`guion: la linea ${orden} esta en ${en.length} tomas (${en.join(', ')}). Cada linea va en una sola.`);
  }
  for (const h of HOSTS) {
    if (reaccionesDe[h].length !== 1) {
      E(
        `podcast: el host ${h} necesita exactamente una toma "clase": "reacciones" (3 reacciones, 8 s, "linea": "") — ` +
          `tiene ${reaccionesDe[h].length}${reaccionesDe[h].length > 1 ? ` (tomas ${reaccionesDe[h].join(', ')})` : ''}`
      );
    }
  }

  // --- B-roll: encima de una linea, anclado a una frase de esa linea ---
  //
  // Regla del estilo: el B-roll va de la solucion (la revelacion) hasta antes
  // del CTA. Se mira por `beat`: la revelacion es la primera linea cuyo beat
  // dice "revelacion" o "solucion" (si ninguna lo dice, la linea 4, como en la
  // estructura de la skill); el CTA son las lineas con beat "cta" (si ninguna
  // lo dice, las tres ultimas). Es un AVISO: el guion manda.
  const lineasGuion = ordenes.map((o) => porOrden.get(o));
  const ordenRevelacion =
    lineasGuion.find((l) => /revelaci|soluci/i.test(String(l.beat || '')))?.orden ?? (porOrden.has(4) ? 4 : null);
  const cta = new Set(lineasGuion.filter((l) => /\bcta\b|llamado/i.test(String(l.beat || ''))).map((l) => l.orden));
  if (!cta.size) for (const o of ordenes.slice(-3)) cta.add(o);
  const brollEnLinea = new Map(); // orden -> n del B-roll
  for (const b of Array.isArray(m.broll) ? m.broll : []) {
    if (!b || typeof b !== 'object') continue;
    const id = `broll ${b.n ?? '?'}`;
    if (b.cierre !== undefined || b.despues_de_toma !== undefined) {
      E(`${id}: en podcast el B-roll va ENCIMA de una linea ("encima_de_toma" + "en_linea"); no hay B-roll de cierre ni en fila.`);
      continue;
    }
    const t = tomasH.find((x) => x.n === b.encima_de_toma);
    if (!t) continue; // la toma inexistente ya la reporto el chequeo general
    if (t.clase === 'reacciones') {
      E(`${id}: "encima_de_toma" apunta a la toma ${t.n}, que es el clip de reacciones: no tiene lineas sobre las que ir`);
      continue;
    }
    if (!Number.isInteger(b.en_linea)) {
      E(`${id}: falta "en_linea": el "orden" de la linea del guion sobre la que va (y que esta en la toma ${t.n})`);
      continue;
    }
    const lineasToma = Array.isArray(t.lineas) ? t.lineas : [];
    const l = lineasToma.find((x) => x && x.orden === b.en_linea);
    if (!l) {
      E(`${id}: "en_linea" es ${b.en_linea} y la toma ${t.n} no contiene esa linea (contiene ${lineasToma.map((x) => x?.orden).join(', ') || 'ninguna'})`);
      continue;
    }
    if (!esTextoR(b.sincroniza_con)) E(`${id}: falta "sincroniza_con": una frase textual de la linea ${b.en_linea} ("${l.texto}")`);
    else if (esTextoR(l.texto) && !fraseEn(l.texto, b.sincroniza_con)) {
      E(`${id}: "sincroniza_con" ("${b.sincroniza_con}") no aparece en la linea ${b.en_linea}: "${l.texto}"`);
    }
    if (brollEnLinea.has(b.en_linea)) E(`${id}: la linea ${b.en_linea} ya tiene el B-roll ${brollEnLinea.get(b.en_linea)}. Va uno por linea.`);
    brollEnLinea.set(b.en_linea, b.n);
    const g = porOrden.get(b.en_linea);
    if (g?.cutaway) {
      E(`guion, linea ${b.en_linea}: tiene "cutaway" y el B-roll ${b.n} a la vez. Mientras se dice una linea se ve una sola cosa: el otro host reaccionando o el B-roll.`);
    }
    if (ordenRevelacion !== null && b.en_linea < ordenRevelacion) {
      A(`${id}: cae en la linea ${b.en_linea}, antes de la revelacion (linea ${ordenRevelacion}). La regla del estilo es B-roll desde la solucion hasta antes del CTA.`);
    } else if (cta.has(b.en_linea)) {
      A(`${id}: cae en la linea ${b.en_linea}, que es del CTA. El CTA va con los hosts a pantalla completa: la regla del estilo es B-roll desde la solucion hasta antes del CTA.`);
    }
  }
}

/**
 * Reglas de conjunto de la entrevista: la
 * variante, el congelado y las tomas "solo_voz" (A), la cadena de B-roll de
 * la historia, el B-roll de cierre con el CTA (B, opcional en A), los iconos,
 * el producto al centro ("sticker_producto", B) y los ingredientes de cada
 * toma (validarIngredientes). Solo corre con estilo "entrevista".
 */
function validarEntrevista(m, lista, { tomasH, E, A }) {
  const e = m.entrevista;
  if (!e || typeof e !== 'object') {
    E('estilo entrevista: falta el bloque "entrevista" ({ "variante": "A" | "B", "lado_mic": "...", "lado_iconos": "...", "marca": "...", "cta": { ... }, "congelado": { ... } })');
    return;
  }
  const variante = e.variante;
  if (!['A', 'B'].includes(variante)) {
    E(`entrevista.variante debe ser "A" (gancho + historia solo con voz y B-roll) o "B" (clips en fila) — llego ${JSON.stringify(variante)}`);
    return;
  }
  for (const campo of ['lado_mic', 'lado_iconos']) {
    if (e[campo] !== undefined && !LADOS.includes(e[campo])) {
      E(`entrevista.${campo} debe ser "izquierda" o "derecha" — llego ${JSON.stringify(e[campo])}`);
    }
  }
  if (e.cta !== undefined && e.cta !== null && (typeof e.cta !== 'object' || !esTextoR(e.cta.texto))) {
    E('entrevista.cta lleva "texto" (la frase del llamado a la accion, ej. "Haz tu pedido en el botón de abajo") y "flecha": true o false');
  }

  const porN = new Map(tomasH.map((t) => [t.n, t]));
  const ns = [...porN.keys()].filter(Number.isInteger).sort((a, b) => a - b);
  const ultima = ns[ns.length - 1];

  // Dialogo de cada toma (informativo, pero con forma), guia de palabras e
  // ingredientes.
  const sinIngredientes = []; // n de las tomas que se generarian con frame inicial
  for (const t of tomasH) {
    const id = `toma ${t.n}`;
    // Sin "ingredientes" (manifiestos de antes del 2026-10-14) la toma se
    // genera como antes, con su imagen como frame inicial: no es un error.
    if (t.ingredientes === undefined || t.ingredientes === null) sinIngredientes.push(t.n);
    else if (ESTILOS_CON_INGREDIENTES.includes(m.estilo)) validarIngredientes(t, id, { lista, variante, E, A });
    // Cola propia del clip (opcional): un numero de segundos, de 0 a COLA_MAX_SEG.
    if (t.cola_seg !== undefined && t.cola_seg !== null) {
      if (typeof t.cola_seg !== 'number' || !Number.isFinite(t.cola_seg) || t.cola_seg < 0 || t.cola_seg > COLA_MAX_SEG) {
        E(
          `${id}: "cola_seg" es cuanto queda del clip despues de la ultima palabra del guion: un numero de 0 a ` +
            `${COLA_MAX_SEG} segundos (sin el campo, 0.25; 0.8 en el ultimo clip del gancho de A) — llego ${JSON.stringify(t.cola_seg)}`
        );
      }
    }
    let voces = 1;
    if (t.dialogo !== undefined && t.dialogo !== null) {
      if (!Array.isArray(t.dialogo)) {
        E(`${id}: "dialogo" debe ser un array de { "habla": "entrevistador" | "persona", "texto": "..." }`);
      } else {
        for (const [i, d] of t.dialogo.entries()) {
          if (!d || typeof d !== 'object' || !VOCES_ENTREVISTA.includes(d.habla) || !esTextoR(d.texto)) {
            E(`${id}, dialogo ${i + 1}: debe ser { "habla": "entrevistador" | "persona", "texto": "..." }`);
          }
        }
        voces = new Set(t.dialogo.map((d) => d?.habla).filter((h) => VOCES_ENTREVISTA.includes(h))).size || 1;
      }
    }
    if (esTextoR(t.linea) && typeof t.duracion === 'number') {
      const palabras = contarPalabras(t.linea);
      if (voces >= 2) {
        const guia = GUIA_PALABRAS_ENTREVISTA_DOS_VOCES[t.duracion];
        if (guia && (palabras < guia[0] || palabras > guia[1])) {
          A(
            `${id}: ${palabras} palabras en ${t.duracion}s con dos voces; la guia es ${guia[0]} a ${guia[1]} (las pausas entre pregunta y respuesta cuentan).` +
              (palabras < guia[0] ? ' Con tiempo de sobra Omni tiende a repetir o agregar palabras (un clip asi se regenera).' : '')
          );
        }
      } else {
        const max = GUIA_PALABRAS_ENTREVISTA_UNA_VOZ[t.duracion];
        if (max && palabras > max) A(`${id}: ${palabras} palabras en ${t.duracion}s con una voz; la guia es como mucho ${max}. Va a hablar apurado o a cortar.`);
      }
    }
  }
  if (sinIngredientes.length) {
    const cuales = sinIngredientes.length === 1 ? `la toma ${sinIngredientes[0]} no trae` : `las tomas ${sinIngredientes.join(', ')} no traen`;
    const ejemplo = variante === 'B' ? '["imagen", "mano-mic"], con "producto" detras si sale,' : '["imagen"],';
    A(
      `${cuales} "ingredientes": se generarian como antes, con su imagen como frame inicial. En la entrevista cada clip ` +
        `va por ingredientes (el habla sale mucho mas limpia): ${ejemplo} con el prompt nombrando "(imagen 1)"` +
        `${variante === 'B' ? ', "(imagen 2)"...' : ''} en ese orden.`
    );
  }

  // --- variante A: congelado + historia solo con voz ---
  let congeladoN = null;
  if (variante === 'A') {
    const c = e.congelado;
    if (!c || typeof c !== 'object' || !Number.isInteger(c.despues_de_toma)) {
      E('entrevista.congelado.despues_de_toma: en la variante A es el numero de la ultima toma del gancho (1 o 2), donde la imagen se congela con el golpe');
    } else if (!porN.has(c.despues_de_toma)) {
      E(`entrevista.congelado.despues_de_toma apunta a la toma ${c.despues_de_toma}, que no existe o no es H`);
    } else {
      congeladoN = c.despues_de_toma;
      if (congeladoN === ultima) {
        E(`entrevista.congelado.despues_de_toma es la toma ${congeladoN}, que es la ultima: despues del congelado tiene que venir la historia (tomas "solo_voz" cubiertas con B-roll)`);
      } else if (congeladoN > 2) {
        A(`entrevista.congelado.despues_de_toma es la toma ${congeladoN}; el gancho del estilo son 1 o 2 clips.`);
      }
    }
    if (congeladoN !== null) {
      for (const t of tomasH) {
        const id = `toma ${t.n}`;
        if (t.n > congeladoN) {
          if (t.solo_voz !== true) {
            E(`${id}: va despues del congelado (toma ${congeladoN}) y tiene que llevar "solo_voz": true. De ese clip solo se usa el audio; la imagen la cubre la cadena de B-roll.`);
          }
        } else if (t.solo_voz === true) {
          E(`${id}: es un clip del gancho (hasta la toma ${congeladoN}) y se ve entero: no lleva "solo_voz"`);
        }
      }
    }
  } else {
    if (e.congelado !== undefined && e.congelado !== null) {
      E('entrevista.congelado es solo de la variante A (en B los clips van en fila con disolvencia, sin congelado)');
    }
    for (const t of tomasH) if (t.solo_voz === true) E(`toma ${t.n}: "solo_voz" es solo de la variante A; en B se ven todos los clips`);
  }

  // --- B-roll: la cadena de la historia (A) y el cierre (B; opcional en A) ---
  const historia = congeladoN === null ? [] : tomasH.filter((t) => t.n > congeladoN).sort((a, b) => a.n - b.n);
  const anclas = []; // { n, tomaN, fraccion, frase }: donde cae cada B-roll de la historia
  const tomasConBroll = new Set();
  let cierres = 0;
  for (const b of Array.isArray(m.broll) ? m.broll : []) {
    if (!b || typeof b !== 'object') continue;
    const id = `broll ${b.n ?? '?'}`;
    if (b.cierre !== undefined && b.cierre !== true) {
      E(`${id}: "cierre" solo acepta true (el B-roll final, en fila, con el llamado a la accion encima)`);
    }
    if (b.cierre === true) {
      cierres++;
      if (b.encima_de_toma !== undefined) {
        E(`${id}: el B-roll de cierre va EN FILA despues de la ultima toma: lleva "despues_de_toma": ${ultima}, no "encima_de_toma"`);
      } else if (b.despues_de_toma !== ultima) {
        E(`${id}: es el B-roll de cierre y "despues_de_toma" tiene que ser la ultima toma (${ultima}) — llego ${JSON.stringify(b.despues_de_toma)}`);
      }
      if (!esTextoR(e.cta?.texto)) A(`${id}: hay B-roll de cierre y falta "entrevista.cta.texto": el cierre saldra sin el llamado a la accion encima`);
      continue;
    }
    if (b.encima_de_toma === undefined) continue; // "despues_de_toma" sin cierre ya dio error en el chequeo general
    const t = porN.get(b.encima_de_toma);
    if (!t) continue;
    if (variante === 'B') {
      E(`${id}: en la variante B el unico B-roll es el de cierre ("cierre": true, "despues_de_toma": ${ultima}): los clips se ven enteros, sin nada encima`);
      continue;
    }
    if (congeladoN !== null && t.n <= congeladoN) {
      E(`${id}: va encima de la toma ${t.n}, que es del gancho y se ve entera. En la variante A el B-roll cubre solo las tomas "solo_voz" (despues del congelado, toma ${congeladoN})`);
      continue;
    }
    if (!esTextoR(b.sincroniza_con)) {
      E(`${id}: falta "sincroniza_con": una frase textual de la "linea" de la toma ${t.n}`);
      continue;
    }
    const pos = esTextoR(t.linea) ? fraseEn(t.linea, b.sincroniza_con) : null;
    if (!pos) {
      if (esTextoR(t.linea)) E(`${id}: "sincroniza_con" ("${b.sincroniza_con}") no aparece en la linea de la toma ${t.n}: "${t.linea}"`);
      continue;
    }
    tomasConBroll.add(t.n);
    anclas.push({ n: b.n, tomaN: t.n, fraccion: pos.fraccion, frase: b.sincroniza_con });
  }
  if (cierres > 1) E(`hay ${cierres} B-roll de cierre ("cierre": true). Va uno solo, el ultimo.`);
  if (variante === 'B' && cierres === 0) {
    A('variante B sin B-roll de cierre: el anuncio termina en el ultimo clip, sin el llamado a la accion en pantalla.');
  }
  for (const t of historia) {
    if (!tomasConBroll.has(t.n)) {
      E(`toma ${t.n}: es "solo_voz" y no tiene ningun B-roll encima ("encima_de_toma": ${t.n}). Sin B-roll esa parte de la historia queda sin imagen.`);
    }
  }
  // Ventanas de la cadena, estimadas: el B-roll k va de su frase a la frase
  // del k+1; el primero arranca con la historia aunque su frase caiga despues;
  // el ultimo llega al final. Se estima con la duracion pedida de cada clip.
  if (historia.length && anclas.length) {
    const inicioDe = new Map();
    let acumulado = 0;
    for (const t of historia) {
      inicioDe.set(t.n, acumulado);
      acumulado += typeof t.duracion === 'number' ? t.duracion : 0;
    }
    const puntos = anclas
      .map((a) => ({ ...a, segundo: inicioDe.get(a.tomaN) + a.fraccion * (porN.get(a.tomaN).duracion || 0) }))
      .sort((x, y) => x.segundo - y.segundo || x.n - y.n);
    for (let i = 0; i < puntos.length; i++) {
      const desde = i === 0 ? 0 : puntos[i].segundo;
      const hasta = i + 1 < puntos.length ? puntos[i + 1].segundo : acumulado;
      const ventana = hasta - desde;
      if (ventana > VENTANA_BROLL_HISTORIA_MAX_SEG + EPS) {
        A(
          `broll ${puntos[i].n}: su ventana estimada dura ${ventana.toFixed(1)}s (de ${i === 0 ? 'el inicio de la historia' : `"${puntos[i].frase}"`} ` +
            `a ${i + 1 < puntos.length ? `"${puntos[i + 1].frase}"` : 'el final'}); la regla es como mucho ${VENTANA_BROLL_HISTORIA_MAX_SEG} s entre dos frases ancla. ` +
            'Conviene un B-roll mas en medio. (Estimado con la duracion pedida de cada clip; el plan lo mide con los subtitulos.)'
        );
      }
    }
  }

  // --- iconos: por grupo, sobre una toma H, con sus frases en la linea de esa toma ---
  const grupos = new Set();
  const idsIcono = new Set();
  const idsReferencias = new Set(lista.map((r) => r.id));
  if (m.iconos !== undefined && m.iconos !== null && !Array.isArray(m.iconos)) E('"iconos" debe ser un array de grupos (o no venir)');
  for (const [gi, g] of (Array.isArray(m.iconos) ? m.iconos : []).entries()) {
    if (!g || typeof g !== 'object') {
      E(`iconos, grupo ${gi + 1}: debe ser un objeto { "grupo", "toma", "aparece_con", "desaparece_con", "elegido", "check_con", "iconos": [ ... ] }`);
      continue;
    }
    const et = `iconos, grupo ${esTextoR(g.grupo) ? `"${g.grupo}"` : gi + 1}`;
    if (!esTextoR(g.grupo)) E(`${et}: falta "grupo" (un nombre unico, ej. "pregunta-1")`);
    else if (grupos.has(g.grupo)) E(`${et}: el grupo "${g.grupo}" esta repetido`);
    else grupos.add(g.grupo);
    const t = porN.get(g.toma);
    if (!t) E(`${et}: "toma" apunta a la toma ${JSON.stringify(g.toma)}, que no existe o no es H`);
    else if (t.solo_voz === true) {
      A(`${et}: va sobre la toma ${t.n}, que es "solo_voz": ahi la imagen la cubre el B-roll. Los iconos del estilo van en los clips del gancho.`);
    }
    const linea = t && esTextoR(t.linea) ? t.linea : null;
    const enLinea = (campo, obligatorio) => {
      const v = g[campo];
      if (v === undefined || v === null) {
        if (obligatorio) E(`${et}: falta "${campo}" (frase textual de la linea de la toma ${JSON.stringify(g.toma)})`);
        return null;
      }
      if (!esTextoR(v)) {
        E(`${et}: "${campo}" debe ser una frase textual de la linea de la toma, o null`);
        return null;
      }
      if (!linea) return null;
      const pos = fraseEn(linea, v);
      if (!pos) E(`${et}: "${campo}" ("${v}") no aparece en la linea de la toma ${t.n}: "${linea}"`);
      return pos;
    };
    const aparece = enLinea('aparece_con', true);
    const desaparece = enLinea('desaparece_con', false);
    if (aparece && desaparece && desaparece.indice <= aparece.indice) {
      E(`${et}: "desaparece_con" ("${g.desaparece_con}") cae antes (o en el mismo sitio) que "aparece_con" ("${g.aparece_con}"). Tiene que ser una frase posterior de la misma toma.`);
    }
    const check = enLinea('check_con', false);
    // El check (y su sonido) cae en la PALABRA de la opcion elegida: la ultima
    // de "check_con" que tambien esta en "aparece_con", sin palabras vacias.
    // Si no hay ninguna, el motor lo pone al empezar "check_con", como antes.
    if (esTextoR(g.elegido) && esTextoR(g.check_con) && esTextoR(g.aparece_con)) {
      const deLaPregunta = new Set(palabrasNormalizadas(g.aparece_con).filter((w) => !PALABRAS_VACIAS_CHECK.has(w)));
      if (!palabrasNormalizadas(g.check_con).some((w) => deLaPregunta.has(w))) {
        A(
          `${et}: ninguna palabra de "check_con" ("${g.check_con}") esta en "aparece_con" ("${g.aparece_con}"). El check cae en ` +
            'la palabra de la opcion elegida cuando la respuesta la dice con la misma palabra que la pregunta; asi, cae al empezar "check_con".'
        );
      }
    }
    // "check_con" tiene que estar UNA sola vez en la linea (por palabras
    // normalizadas, como lo busca el plan). El motor lo busca despues del fin
    // de la pregunta, asi que una respuesta que repite la opcion igual que la
    // pregunta ("¿Dulce o salado? Dulce.") en el caso normal no cae en ella;
    // pero cuando ese fin sale ESTIMADO (sin subtitulos ni medida, por la
    // posicion de la pregunta en la linea) puede caer antes de que la pregunta
    // termine de decirse, y el check cae en la pregunta, o despues de que
    // empiece la respuesta, y no la encuentra. Por eso la respuesta lleva algo que
    // la distinga: una muletilla o una palabra mas ("Dulce, obvio.", "Eh... de
    // noche."). "Solo la opcion" = todas sus palabras (las vacias tambien: una
    // muletilla si distingue) estan en "aparece_con". Si "check_con" no esta
    // en ningun lado DESPUES de la pregunta, el plan no lo encuentra y el check
    // cae a mitad del tiempo en pantalla: eso se dice primero. Es un AVISO.
    if (check && aparece && linea && esTextoR(g.elegido)) {
      const inicios = iniciosEn(linea, g.check_con);
      const veces = inicios.length;
      const finPregunta = aparece.indice + palabrasNormalizadas(g.aparece_con).length;
      const deLaPregunta = new Set(palabrasNormalizadas(g.aparece_con));
      const soloLaOpcion = palabrasNormalizadas(g.check_con).every((w) => deLaPregunta.has(w));
      if (!inicios.some((i) => i >= finPregunta)) {
        A(
          `${et}: "check_con" ("${g.check_con}") no esta despues de la pregunta ("${g.aparece_con}") en la linea de la toma ${t.n}: ` +
            'el motor busca la respuesta despues de la pregunta, no la encuentra y el check cae a mitad del tiempo en pantalla. ' +
            'Pon en "check_con" la respuesta tal como esta en la linea, con su muletilla o una palabra mas ("Dulce, obvio.", "Eh... de noche.").'
        );
      } else if (soloLaOpcion) {
        A(
          `${et}: "check_con" ("${g.check_con}") es solo la opcion, con las mismas palabras que la pregunta ("${g.aparece_con}")` +
            (veces > 1 ? ` y esta ${veces} veces en la linea de la toma ${t.n}` : '') +
            '. El motor la busca despues de la pregunta, pero conviene que sea unica: que la respuesta lleve una muletilla o una ' +
            'palabra mas ("Dulce, obvio.", "Eh... de noche.") y que "check_con" la incluya.'
        );
      } else if (veces > 1) {
        A(
          `${et}: "check_con" ("${g.check_con}") esta ${veces} veces en la linea de la toma ${t.n}: "${linea}". ` +
            'Marca un trozo de la respuesta que este una sola vez (con su muletilla o una palabra mas), para que no haya duda de donde cae el check.'
        );
      }
    }
    const iconos = Array.isArray(g.iconos) ? g.iconos : [];
    if (!Array.isArray(g.iconos) || iconos.length < 1 || iconos.length > 3) {
      E(`${et}: "iconos" lleva de 1 a 3 iconos ([{ "id": "icono-...", "prompt": "..." }]) — trae ${Array.isArray(g.iconos) ? iconos.length : 'ninguno'}`);
    }
    for (const [ii, ic] of iconos.entries()) {
      const ei = `${et}, icono ${ii + 1}`;
      if (!ic || typeof ic !== 'object') {
        E(`${ei}: debe ser { "id": "icono-...", "prompt": "..." }`);
        continue;
      }
      if (typeof ic.id !== 'string' || !/^icono-[a-z0-9][a-z0-9_-]*$/i.test(ic.id)) {
        E(`${ei}: "id" debe empezar por "icono-" y no llevar espacios (con el se nombra img/<id>.png) — llego ${JSON.stringify(ic.id)}`);
      } else if (idsIcono.has(ic.id)) E(`${ei}: el id "${ic.id}" ya lo usa otro icono`);
      else if (idsReferencias.has(ic.id)) E(`${ei}: el id "${ic.id}" ya lo usa una referencia: chocarian en img/${ic.id}.png`);
      else idsIcono.add(ic.id);
      if (!esTextoR(ic.prompt)) E(`${ei}: falta "prompt" (icono plano estilo sticker, fondo transparente, sin texto)`);
    }
    if (g.elegido !== undefined && g.elegido !== null) {
      if (!esTextoR(g.elegido) || !iconos.some((ic) => ic?.id === g.elegido)) {
        E(`${et}: "elegido" (${JSON.stringify(g.elegido)}) tiene que ser el id de uno de sus iconos, o null`);
      }
      if (g.check_con === undefined || g.check_con === null) {
        E(`${et}: tiene "elegido" y falta "check_con": la frase con la que aparece (y suena) el check sobre el icono elegido`);
      }
    } else if (g.check_con !== undefined && g.check_con !== null) {
      A(`${et}: tiene "check_con" sin "elegido": no hay icono al que ponerle el check, asi que no pasa nada`);
    }
  }

  // --- el producto al centro (campo "sticker_producto", 2026-10-14) ---
  //
  // Cuando se nombra el producto (la marca o su nombre, tal como estan en la
  // linea), su foto aparece AL CENTRO como un icono mas, 3 s, con su clic. El
  // campo conserva el nombre de cuando era un sticker en la esquina. Solo en
  // la variante B y para cualquier producto: sin foto (un digital o un
  // servicio sin imagen) no hay pieza, y eso es un aviso, no un error.
  const s = m.sticker_producto;
  if (s !== undefined && s !== null) {
    if (typeof s !== 'object') {
      E('"sticker_producto" (el producto al centro) debe ser { "toma": N, "sincroniza_con": "<la marca o el nombre del producto, textual>" }');
    } else {
      const t = porN.get(s.toma);
      if (!t) E(`sticker_producto: "toma" apunta a la toma ${JSON.stringify(s.toma)}, que no existe o no es H`);
      else if (!esTextoR(s.sincroniza_con)) E('sticker_producto: falta "sincroniza_con" (la frase textual donde se nombra el producto: la marca o su nombre)');
      else if (esTextoR(t.linea) && !fraseEn(t.linea, s.sincroniza_con)) {
        E(`sticker_producto: "sincroniza_con" ("${s.sincroniza_con}") no aparece en la linea de la toma ${t.n}: "${t.linea}"`);
      }
      if (variante === 'A') {
        A('sticker_producto: el producto al centro es solo de la variante B. En la A no se agrega esa pieza.');
      } else {
        // La misma foto que busca el plan: la primera referencia de tipo
        // "producto" con "archivo".
        const producto = lista.find((r) => String(r.tipo || '').toLowerCase() === 'producto' && esAportada(r));
        if (!producto) {
          A(
            'sticker_producto: no hay foto del producto (una referencia de tipo "producto" con "archivo"), asi que no se agrega ' +
              'la pieza del producto al centro. En un digital o un servicio sirve una captura o el logo, aportados como "producto".'
          );
        }
      }
    }
  }
}

/**
 * Costo estimado de un anuncio hablado (podcast, entrevista). Lo pide el paso
 * final de la skill ANTES de generar: se muestra y se espera el si.
 *
 *   - hojas: cada referencia con prompt (los hosts; la persona, la calle, la
 *     mano con el mic), con el modelo de imagen del estilo
 *     (MODELO_IMAGEN_POR_ESTILO: Sunburst 2K; si no esta, el de siempre a 1K).
 *   - frames: el frame inicial de cada toma H sin "frame_inicial", mismo
 *     modelo. Con "frame_inicial" se copia la referencia: 0 cr.
 *   - clips: un video de MODELOS.video.principal por toma H, al precio de su
 *     duracion (sin respaldo: Kling no genera dialogo). Por ingredientes
 *     (entrevista) es el mismo modelo y el mismo precio; se marca cuales.
 *   - B-roll: su imagen (mismo modelo que los frames) y su video con
 *     MODELO_VIDEO_BROLL_POR_ESTILO por segundo, SIN audio (va mudo en el
 *     montaje; sin audio Kling cobra 14 cr/s en vez de 20).
 *   - iconos: MODELO_IMAGEN_ICONOS a RESOLUCION_IMAGEN_ICONOS, uno por icono.
 *
 * Con `carpeta`, marca lo que ya esta en disco: eso no se vuelve a pagar.
 */
function costoHablado(m, lista, { carpeta } = {}) {
  const existe = (rel) => Boolean(carpeta) && fs.existsSync(path.join(carpeta, rel));
  // Modelo de imagen del estilo (MODELO_IMAGEN_POR_ESTILO: Sunburst 2K desde el
  // 2026-10-13, decision del estilo); si el estilo no esta en la tabla, el de siempre.
  const delEstilo = MODELO_IMAGEN_POR_ESTILO[m.estilo];
  const modeloImagen = delEstilo?.cascada?.[0] ?? MODELOS.imagen.principal;
  const resolucionImagen = delEstilo?.resoluciones?.[modeloImagen] ?? '1K';
  const precioImagen = PRECIOS.imagen[modeloImagen]?.[resolucionImagen] ?? null;
  const modeloVideo = MODELOS.video.principal;
  const modeloBroll = MODELO_VIDEO_BROLL_POR_ESTILO[m.estilo];
  const precioBrollSegundo = MODELOS_VIDEO[modeloBroll]?.precio?.[RESOLUCION_VIDEO] ?? null; // sin audio
  const topesBroll = topesBrollHablado(m.estilo);
  const precioIcono = PRECIOS.imagen[MODELO_IMAGEN_ICONOS]?.[RESOLUCION_IMAGEN_ICONOS] ?? null;
  const tieneFrame = (t) => typeof t.frame_inicial === 'string' && t.frame_inicial.trim().length > 0;
  const tomasH = m.tomas.filter((t) => t?.tipo === 'H');

  const hojas = lista.filter(esGenerada).map((r) => {
    const archivo = `img/${archivoDeHoja(r)}`;
    return { id: r.id, archivo, creditos: precioImagen, yaExiste: existe(archivo) };
  });
  const frames = tomasH
    .filter((t) => !tieneFrame(t))
    .map((t) => {
      const archivo = `img/toma-${t.n}-inicial.png`;
      return { n: t.n, archivo, creditos: precioImagen, yaExiste: existe(archivo) };
    });
  const copias = tomasH.filter(tieneFrame).map((t) => {
    const archivo = `img/toma-${t.n}-inicial.png`;
    return { n: t.n, archivo, de: t.frame_inicial, creditos: 0, yaExiste: existe(archivo) };
  });
  const clips = tomasH.map((t) => {
    const archivo = `video/toma-${t.n}.mp4`;
    const creditos =
      typeof t.duracion === 'number' && t.duracion > 0 ? creditosClip(modeloVideo, t.duracion, RESOLUCION_VIDEO).creditos : null;
    // Por ingredientes (entrevista): las imagenes que recibe, en orden.
    const ingredientes = Array.isArray(t.ingredientes) && t.ingredientes.length ? [...t.ingredientes] : null;
    return { n: t.n, duracion: t.duracion, archivo, creditos, yaExiste: existe(archivo), ...(ingredientes ? { ingredientes } : {}) };
  });
  const broll = (Array.isArray(m.broll) ? m.broll : [])
    .filter((b) => b && typeof b === 'object')
    .map((b) => {
      const imagen = `img/broll-${b.n}.png`;
      const video = `video/broll-${b.n}.mp4`;
      const segundos =
        Number.isInteger(b.duracion) && b.duracion >= topesBroll.min && b.duracion <= topesBroll.max ? b.duracion : null;
      return {
        n: b.n,
        duracion: b.duracion,
        imagen,
        video,
        creditosImagen: precioImagen,
        creditosVideo: segundos !== null && precioBrollSegundo !== null ? precioBrollSegundo * segundos : null,
        imagenExiste: existe(imagen),
        videoExiste: existe(video),
      };
    });
  const iconos = iconosDe(m).map((ic) => {
    const archivo = `img/${ic.id}.png`;
    return { id: ic.id, archivo, creditos: precioIcono, yaExiste: existe(archivo) };
  });

  const suma = (xs, campo = 'creditos') => xs.reduce((s, x) => s + (x[campo] ?? 0), 0);
  const creditos = {
    hojas: suma(hojas),
    frames: suma(frames),
    clips: suma(clips),
    brollImagenes: suma(broll, 'creditosImagen'),
    brollVideos: suma(broll, 'creditosVideo'),
    iconos: suma(iconos),
  };
  creditos.imagenes = creditos.hojas + creditos.frames + creditos.brollImagenes + creditos.iconos;
  creditos.videos = creditos.clips + creditos.brollVideos;
  creditos.total = creditos.imagenes + creditos.videos;
  creditos.pendiente =
    suma(hojas.filter((x) => !x.yaExiste)) +
    suma(frames.filter((x) => !x.yaExiste)) +
    suma(clips.filter((x) => !x.yaExiste)) +
    suma(broll.filter((b) => !b.imagenExiste), 'creditosImagen') +
    suma(broll.filter((b) => !b.videoExiste), 'creditosVideo') +
    suma(iconos.filter((x) => !x.yaExiste));

  return {
    estilo: m.estilo,
    modeloImagen,
    resolucionImagen,
    precioImagenVerificado: precioImagen !== null,
    modeloVideo,
    resolucionVideo: RESOLUCION_VIDEO,
    modeloBroll,
    precioBrollSegundo,
    modeloIconos: MODELO_IMAGEN_ICONOS,
    resolucionIconos: RESOLUCION_IMAGEN_ICONOS,
    precioIconoVerificado: precioIcono !== null,
    hojas,
    frames,
    copias,
    clips,
    broll,
    iconos,
    creditos,
  };
}

/**
 * @param m            el manifiesto ya parseado
 * @param carpeta      carpeta donde vive el manifiesto. Si se pasa, ademas se
 *                     verifica que la foto del producto exista de verdad en disco.
 * @param exigirPasos  solo con continuidad (lo pasa generar-videos.js): los
 *                     pasos, sus prompts y el cierre tienen que estar escritos.
 */
export function validarManifiesto(m, { carpeta, exigirPasos = false } = {}) {
  const errores = [];
  const avisos = [];
  const E = (msg) => errores.push(msg);
  const A = (msg) => avisos.push(msg);

  const esTexto = (v) => typeof v === 'string' && v.trim().length > 0;

  // --- cabecera ---
  if (!esTexto(m.estilo)) E('falta "estilo" (ej. "crochet")');
  if (!MODOS_AUDIO.includes(m.modo_audio)) {
    E(`"modo_audio" debe ser uno de: ${MODOS_AUDIO.join(', ')} — llego: ${JSON.stringify(m.modo_audio)}`);
  }
  if (!esTexto(m.mercado)) E('falta "mercado"');
  if (!esTexto(m.idioma)) E('falta "idioma"');
  if (!esTexto(m.aspect_ratio)) E('falta "aspect_ratio" (ej. "9:16")');

  // --- referencias (personajes, producto, objetos recurrentes, lo que sea) ---
  //
  // Acepta las dos formas: la lista nueva, o los campos fijos personaje/producto
  // del formato viejo. La conversion vive entera en referencias.js.
  if (esFormatoHeredado(m)) {
    const p = m.personaje;
    if (p && typeof p === 'object' && typeof p.activo !== 'boolean') {
      E('"personaje.activo" debe ser true o false');
    }
    if (p?.activo && !esTexto(p.prompt)) E('"personaje.activo" es true pero no hay "personaje.prompt"');
    if (m.producto && m.producto.foto !== null && !esTexto(m.producto.foto)) {
      E('"producto.foto" debe ser el nombre del archivo, o null si no hay foto');
    }
  }

  const refs = validarReferencias(m, { carpeta });
  for (const e of refs.errores) E(e);
  // Estilos hablados: una hoja que solo se usa como "frame_inicial" de una
  // toma H (los hosts del podcast), una referencia que solo va en los
  // "ingredientes" del video (entrevista), o la foto del producto que solo usa
  // el producto al centro de la entrevista ("sticker_producto"), no aparece en
  // "referencias" de ninguna toma ni B-roll, y validarReferencias avisaria que
  // nadie la usa. Si se usan. Los demas estilos reciben los avisos tal cual.
  const esHablado = ESTILOS_HABLADOS.includes(m.estilo);
  // Topes del B-roll de los estilos hablados; para los demas no se usan.
  const topesBroll = esHablado ? topesBrollHablado(m.estilo) : null;
  const usadasAparte = new Set();
  if (esHablado) {
    for (const t of Array.isArray(m.tomas) ? m.tomas : []) {
      if (t?.tipo === 'H' && typeof t.frame_inicial === 'string') usadasAparte.add(t.frame_inicial);
      if (t?.tipo === 'H' && Array.isArray(t.ingredientes)) {
        for (const x of t.ingredientes) if (typeof x === 'string' && x !== INGREDIENTE_IMAGEN) usadasAparte.add(x);
      }
    }
    if (m.sticker_producto && typeof m.sticker_producto === 'object') {
      usadasAparte.add('producto');
      // (La foto que usa el plan: la primera de tipo "producto" con archivo, sea cual sea su id.)
      const foto = refs.lista.find((r) => String(r.tipo || '').toLowerCase() === 'producto' && esAportada(r));
      if (foto) usadasAparte.add(foto.id);
    }
  }
  for (const a of refs.avisos) {
    if (esHablado && [...usadasAparte].some((id) => a === `la referencia "${id}" no la usa ninguna toma ni B-roll.`)) continue;
    A(a);
  }
  const lista = refs.lista;

  // Los archivos aportados tienen que servirle al modelo: formato y peso.
  if (carpeta) {
    for (const r of lista.filter(esAportada)) {
      const ruta = path.join(carpeta, r.archivo);
      if (!fs.existsSync(ruta)) continue; // ya lo reporto validarReferencias
      const ext = path.extname(r.archivo).slice(1).toLowerCase();
      if (!FORMATOS_OK.includes(ext)) {
        E(
          `la referencia "${r.id}" es .${ext}, y el modelo solo acepta ${FORMATOS_OK.join(', ')}.\n` +
            `         Conviertela con:\n` +
            `           node produccion/preparar-producto.js "${ruta}" ${path.basename(carpeta)}`
        );
      }
      const bytes = fs.statSync(ruta).size;
      if (bytes > MAX_BYTES) {
        E(
          `la referencia "${r.id}" pesa ${(bytes / 1024 / 1024).toFixed(1)} MB y el tope es ${MAX_BYTES / 1024 / 1024} MB.\n` +
            `         Reducela con:\n` +
            `           node produccion/preparar-producto.js "${ruta}" ${path.basename(carpeta)}`
        );
      }
    }
  }

  // --- tomas ---
  if (!Array.isArray(m.tomas) || m.tomas.length === 0) {
    E('"tomas" debe ser un array con al menos una toma');
    return { errores, avisos, resumen: null };
  }

  // Anuncio por bloques (UGC tipo R): reglas de conjunto. Todo lo que sigue
  // ramifica SOLO si hay alguna toma R; los demas manifiestos no pasan por aqui.
  const tomasR = m.tomas.filter((t) => t?.tipo === 'R');
  const hayR = tomasR.length > 0;
  const idsLista = new Set(lista.map((r) => r.id));
  const tipoDe = (idRef) => lista.find((r) => r.id === idRef)?.tipo;
  if (hayR) {
    if (m.modo_audio !== 'dialogo_nativo') {
      E(`hay bloques R y "modo_audio" es ${JSON.stringify(m.modo_audio)}. Los bloques R son "dialogo_nativo": la voz la genera el modelo dentro del clip.`);
    }
    if (tomasR.length !== m.tomas.length) {
      E(`hay ${tomasR.length} toma(s) R y ${m.tomas.length - tomasR.length} de otro tipo. En un anuncio por bloques todas las tomas son R.`);
    }
    if (Array.isArray(m.broll) && m.broll.length > 0) {
      E('un anuncio por bloques (tomas R) no lleva B-roll: "broll" tiene que ir vacio. Se generaria y se cobraria igual.');
    }
    if (Array.isArray(m.overlays) && m.overlays.length > 0) {
      A('un anuncio por bloques (tomas R) no lleva "overlays": el texto en pantalla se agrega en el montaje.');
    }
  }

  // Estilos hablados (podcast, entrevista) y tomas H: reglas de conjunto. Todo
  // lo que sigue ramifica SOLO si hay alguna toma H o el estilo es hablado.
  const tomasH = m.tomas.filter((t) => t?.tipo === 'H');
  const hayH = tomasH.length > 0;
  if (hayH || esHablado) {
    if (m.modo_audio !== 'dialogo_nativo') {
      E(
        `${hayH ? 'hay tomas H' : `el estilo es "${m.estilo}"`} y "modo_audio" es ${JSON.stringify(m.modo_audio)}. ` +
          'Las tomas habladas son "dialogo_nativo": la voz la genera el modelo dentro del clip.'
      );
    }
    if (hayH && !esHablado) {
      E(`hay ${tomasH.length} toma(s) tipo H y el estilo es ${JSON.stringify(m.estilo)}. Las tomas H son solo de los estilos ${ESTILOS_HABLADOS.join(' y ')}.`);
    }
    if (esHablado && tomasH.length !== m.tomas.length) {
      E(`el estilo es "${m.estilo}" y hay ${m.tomas.length - tomasH.length} toma(s) que no son H. En ${m.estilo} todas las tomas son H (habladas).`);
    }
    if (esHablado && Array.isArray(m.overlays) && m.overlays.length > 0) {
      E(`en ${m.estilo} "overlays" va vacio: los iconos, el producto al centro y el CTA se declaran en sus propios campos y el resto se agrega en el montaje.`);
    }
  }

  const numeros = new Set();
  for (const t of m.tomas) {
    const id = `toma ${t?.n ?? '?'}`;
    if (!Number.isInteger(t.n) || t.n < 1) E(`${id}: "n" debe ser un entero >= 1`);
    if (numeros.has(t.n)) E(`${id}: numero de toma repetido`);
    numeros.add(t.n);

    // (H se nombra solo en los estilos que lo usan; los demas ven el mensaje de siempre.)
    if (!TIPOS.includes(t.tipo)) E(`${id}: "tipo" debe ser ${esHablado ? 'A, B, C, R o H' : 'A, B, C o R'} — llego ${JSON.stringify(t.tipo)}`);
    if (typeof t.duracion !== 'number' || !(t.duracion > 0)) E(`${id}: "duracion" debe ser un numero mayor que 0`);
    else if (t.tipo !== 'R' && t.tipo !== 'H' && t.duracion > TOPE_CLIP_SEG) {
      // (En R y en H la duracion la validan validarBloqueR y validarTomaH: solo 4, 6, 8 o 10.)
      E(`${id}: dura ${t.duracion}s y el tope por clip es ${TOPE_CLIP_SEG}s. Hay que dividirla en dos tomas, no truncarla.`);
    }

    // (En H la linea la valida validarTomaH: puede ir vacia solo en el clip de reacciones.)
    if (t.tipo !== 'H' && !esTexto(t.linea)) E(`${id}: falta "linea"`);
    if (!esTexto(t.prompt_video)) E(`${id}: falta "prompt_video"`);
    // "ingredientes" es solo de las tomas H de la entrevista (validarIngredientes).
    // Ningun manifiesto de los otros estilos lo trae: para ellos no cambia nada.
    if (t.ingredientes !== undefined && t.ingredientes !== null && t.tipo !== 'H') {
      E(`${id}: "ingredientes" es solo de las tomas habladas (H) de ${ESTILOS_CON_INGREDIENTES.join(' y ')}; esta toma es tipo ${JSON.stringify(t.tipo)}.`);
    }

    if (t.tipo === 'R') {
      // Bloque UGC: solo referencias, cero frames. Nada de lo de abajo (frame
      // heredado, frame inicial, frame final de la Tipo B) aplica.
      if (!Array.isArray(t.referencias)) {
        E(`${id}: "referencias" debe ser un array de ids, en el orden en que el prompt nombra las imagenes`);
      }
      validarBloqueR(t, id, { idsLista, tipoDe, E, A });
      continue;
    }

    if (t.tipo === 'H') {
      // Toma hablada: ni "heredado" ni frame final. Lo que es del conjunto
      // (hosts, guion, congelado, B-roll, iconos, ingredientes) va mas abajo.
      validarTomaH(t, id, { lista, E, A });
      continue;
    }

    // Frame inicial heredado (Regla 4 de la skill de UGC): desde la Escena 2, el
    // frame inicial NO se genera — se reutiliza tal cual el archivo del frame
    // final de la toma anterior. En ese caso no hay prompt que validar.
    //
    // No confundir con "frame_anterior" dentro de referencias: eso adjunta el
    // frame previo como referencia y genera una imagen nueva igual.
    const heredado = t.frame_inicial === 'heredado';
    if (t.frame_inicial != null && !heredado) {
      E(`${id}: "frame_inicial" solo acepta "heredado" — llego ${JSON.stringify(t.frame_inicial)}`);
    }
    if (heredado) {
      if (m.modo_audio !== 'dialogo_nativo') {
        E(`${id}: "frame_inicial: heredado" es solo para modo_audio dialogo_nativo`);
      }
      if (t.n === 1) {
        E(`${id}: es la primera toma y no puede heredar el frame inicial: no hay toma anterior`);
      }
      if (t.prompt_imagen_inicial != null) {
        E(`${id}: hereda el frame inicial, asi que "prompt_imagen_inicial" debe ser null`);
      }
    } else if (!esTexto(t.prompt_imagen_inicial)) {
      E(`${id}: falta "prompt_imagen_inicial"`);
    }

    if (t.tipo === 'B') {
      if (!esTexto(t.prompt_imagen_final)) E(`${id}: es Tipo B y necesita "prompt_imagen_final"`);
    } else if (t.prompt_imagen_final != null) {
      E(`${id}: es Tipo ${t.tipo} y "prompt_imagen_final" debe ser null`);
    }

    // Que los ids existan lo comprueba validarReferencias; aqui solo la forma.
    if (!Array.isArray(t.referencias)) {
      E(`${id}: "referencias" debe ser un array de ids (vacio si no necesita ninguna)`);
    }
  }

  // --- broll ---
  if (!Array.isArray(m.broll)) {
    E('"broll" debe ser un array (vacio si no hay)');
  } else {
    for (const b of m.broll) {
      const id = `broll ${b?.n ?? '?'}`;
      // El vinculo del B-roll con su toma tiene dos nombres, y la diferencia
      // no es cosmetica: "encima_de_toma" (dialogo_nativo, va superpuesto) y
      // "despues_de_toma" (voz_en_off, va en fila). Ver tomaDelBroll().
      const objetivo = tomaDelBroll(b);
      const campo = b.encima_de_toma !== undefined ? 'encima_de_toma' : 'despues_de_toma';
      if (!Number.isInteger(objetivo) || !numeros.has(objetivo)) {
        E(`${id}: "${campo}" apunta a la toma ${objetivo}, que no existe`);
      }
      if (b.encima_de_toma !== undefined && b.despues_de_toma !== undefined) {
        E(`${id}: trae "encima_de_toma" y "despues_de_toma" a la vez. Va uno solo.`);
      }
      // (En los estilos hablados hay UNA excepcion: el B-roll de cierre de la
      // entrevista va en fila, con "cierre": true. Lo revisa validarEntrevista.)
      if (b.despues_de_toma !== undefined && m.modo_audio === 'dialogo_nativo' && !(esHablado && b.cierre === true)) {
        E(
          `${id}: en dialogo_nativo el B-roll va ENCIMA de la toma, no en fila. Usa "encima_de_toma"` +
            `${esHablado ? ' (o, solo en la entrevista, "cierre": true para el B-roll final)' : ''}.`
        );
      }
      // En musica el montaje es el de voz_en_off: el B-roll va EN FILA,
      // rellenando la ventana de su toma. Aceptar "encima_de_toma" aqui lo
      // dejaria en fila igual y la etiqueta mentiria — que es exactamente el
      // bug que "despues_de_toma" causo en dialogo_nativo.
      if (b.encima_de_toma !== undefined && m.modo_audio === 'musica') {
        E(`${id}: en musica el B-roll va EN FILA, como en voz_en_off. Usa "despues_de_toma".`);
      }
      if (typeof b.duracion !== 'number' || !(b.duracion > 0)) E(`${id}: "duracion" debe ser un numero mayor que 0`);
      if (!esTexto(b.prompt_imagen)) E(`${id}: falta "prompt_imagen"`);
      if (!esTexto(b.prompt_video)) E(`${id}: falta "prompt_video"`);
      if (!Array.isArray(b.referencias)) E(`${id}: "referencias" debe ser un array`);
      // Estilos hablados: el B-roll se genera con Kling (MODELO_VIDEO_BROLL_POR_ESTILO),
      // que cobra por segundo y pide una duracion entera entre sus topes.
      if (
        esHablado &&
        typeof b.duracion === 'number' &&
        b.duracion > 0 &&
        !(Number.isInteger(b.duracion) && b.duracion >= topesBroll.min && b.duracion <= topesBroll.max)
      ) {
        E(
          `${id}: dura ${b.duracion}s. En ${m.estilo} el B-roll se genera con ${MODELO_VIDEO_BROLL_POR_ESTILO[m.estilo]}, ` +
            `que pide segundos enteros entre ${topesBroll.min} y ${topesBroll.max}.`
        );
      }
    }
    // (En los estilos hablados el B-roll no es uno por toma: va donde lo pide el guion.)
    if (!esHablado && m.broll.length > 0 && m.broll.length < m.tomas.length) {
      A(`hay ${m.broll.length} B-roll para ${m.tomas.length} tomas. La skill pide uno por toma principal.`);
    }
  }

  // --- audio ---
  //
  // En musica la pista maestra es la cancion, que se genera ANTES del
  // manifiesto (su duracion real es la duracion del anuncio). Aqui solo se
  // comprueba que este donde el montaje la va a buscar.
  //
  // Una toma cuya linea es una marca entre corchetes —"[intro]",
  // "[instrumental]", "[cierre]"— cubre un tramo donde no se canta nada. Es
  // legitima y no se subtitula. Lo que no puede pasar es que TODAS lo sean:
  // entonces no hay letra y el anuncio no tiene guion.
  if (m.modo_audio === 'musica') {
    const esInstrumental = (t) => /^\s*\[[^\]]*\]\s*$/.test(String(t || ''));
    const cantadas = m.tomas.filter((t) => !esInstrumental(t.linea));
    if (Array.isArray(m.tomas) && m.tomas.length > 0 && cantadas.length === 0) {
      E('todas las tomas son instrumentales: no hay ninguna linea cantada que sostenga el anuncio');
    }
    if (carpeta) {
      const rutaCancion = path.join(carpeta, 'audio', 'cancion.mp3');
      if (!fs.existsSync(rutaCancion)) {
        E(
          'modo_audio es "musica" pero falta audio/cancion.mp3. ' +
            'Generala y elige version:  npm run cancion -- <carpeta>  y  --elegir N'
        );
      }
    }
    if (m.voz_en_off !== undefined && m.voz_en_off !== null) {
      A('modo_audio es "musica" y ademas trae "voz_en_off". Ese campo no se usa aqui: el guion es la letra.');
    }
  }

  if (m.modo_audio === 'voz_en_off') {
    if (!esTexto(m.voz_en_off)) {
      E('"modo_audio" es voz_en_off pero falta el guion en "voz_en_off"');
    } else {
      const normalizar = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
      const unido = normalizar(m.tomas.map((t) => t.linea || '').join(' '));
      if (normalizar(m.voz_en_off) !== unido) {
        A('el texto de "voz_en_off" no coincide con la union de las lineas de las tomas. Los cortes por toma pueden quedar desalineados.');
      }
    }
  }

  // --- overlays ---
  if (!Array.isArray(m.overlays)) {
    E('"overlays" debe ser un array (vacio si no hay)');
  } else {
    for (const o of m.overlays) {
      if (!esTexto(o.texto)) E('un overlay no tiene "texto"');
      if (!numeros.has(o.toma)) E(`overlay "${o.texto}" apunta a la toma ${o.toma}, que no existe`);
    }
  }

  // --- ganchos alternativos (solo anuncios por bloques) ---
  //
  // Otras versiones completas de un bloque (normalmente el 1) con otro
  // arranque, para testear en Meta cual vende mas. Se validan igual que una
  // toma R. No se generan salvo que se pidan: npm run videos -- <carpeta> --ganchos
  if (m.ganchos_alternativos !== undefined && m.ganchos_alternativos !== null) {
    if (!Array.isArray(m.ganchos_alternativos)) {
      E('"ganchos_alternativos" debe ser un array (o no venir)');
    } else {
      if (m.ganchos_alternativos.length > 0 && !hayR) {
        E('"ganchos_alternativos" es solo para anuncios por bloques (tomas R)');
      }
      const idsGanchos = new Set();
      for (const g of m.ganchos_alternativos) {
        const id = `gancho ${g?.id ?? '?'}`;
        if (!g || typeof g !== 'object') {
          E('cada gancho alternativo debe ser un objeto con id, reemplaza, duracion, linea, tramos, prompt_video y referencias');
          continue;
        }
        // El id nombra el clip: gancho-<id>.mp4.
        if (typeof g.id !== 'string' || !/^[a-z0-9][a-z0-9_-]*$/i.test(g.id)) {
          E(`${id}: "id" debe ser corto y sin espacios (ej. "1b"): con el se nombra el clip gancho-<id>.mp4`);
        } else if (idsGanchos.has(g.id)) {
          E(`hay dos ganchos alternativos con el id "${g.id}"`);
        }
        idsGanchos.add(g.id);

        const reemplazada = m.tomas.find((t) => t.n === g.reemplaza);
        if (!reemplazada) {
          E(`${id}: "reemplaza" apunta a la toma ${JSON.stringify(g.reemplaza)}, que no existe`);
        } else if (reemplazada.tipo !== 'R') {
          E(`${id}: reemplaza a la toma ${g.reemplaza}, que no es un bloque R`);
        } else if (typeof g.duracion === 'number' && g.duracion !== reemplazada.duracion) {
          A(`${id}: dura ${g.duracion}s y el bloque ${g.reemplaza}, que reemplaza, dura ${reemplazada.duracion}s. Se pide el mismo largo para que la prueba compare solo el gancho.`);
        }
        if (typeof g.duracion !== 'number' || !(g.duracion > 0)) E(`${id}: "duracion" debe ser un numero mayor que 0`);
        if (!esTexto(g.linea)) E(`${id}: falta "linea"`);
        if (!esTexto(g.prompt_video)) E(`${id}: falta "prompt_video"`);
        validarBloqueR(g, id, { idsLista, tipoDe, E, A, chequearIds: true });
      }
    }
  }

  // --- lugares repetidos: fotograma de otro bloque (solo anuncios por bloques) ---
  validarLugaresR(m, lista, { hayR, E, A });

  // --- continuidad: SOLO si el manifiesto trae el bloque (ver continuidad.js) ---
  const conContinuidad = tieneContinuidad(m);
  if (conContinuidad) validarContinuidad(m, { carpeta, exigirPasos, E, A });

  // --- estilos hablados: SOLO podcast y entrevista (ver validarTomaH y los dos de arriba) ---
  if (esHablado) {
    if (m.estilo === 'podcast') validarPodcast(m, lista, { tomasH, E, A });
    else if (m.estilo === 'entrevista') validarEntrevista(m, lista, { tomasH, E, A });
  }

  // --- resumen de trabajo (insumo del control de costo) ---
  // Cada referencia GENERADA es una imagen mas; las aportadas por el usuario no.
  const hojasAGenerar = lista.filter((r) => typeof r.prompt === 'string' && r.prompt.trim()).length;
  const imagenes =
    // Un frame inicial heredado NO se genera: se copia el archivo de la toma
    // anterior. Contarlo aca inflaba el costo estimado justo antes de pedirle
    // confirmacion al usuario, que es el peor momento para exagerar un numero.
    // Un bloque R no tiene frames: cero imagenes (solo cuentan sus hojas).
    // Una toma H con "frame_inicial" copia esa referencia (0 cr); sin el, un
    // frame inicial como en una A. Los iconos (entrevista) son imagenes mas.
    m.tomas.reduce(
      (n, t) =>
        n +
        (t.tipo === 'R'
          ? 0
          : t.tipo === 'H'
            ? typeof t.frame_inicial === 'string' && t.frame_inicial.trim()
              ? 0
              : 1
            : (t.frame_inicial === 'heredado' ? 0 : 1) + (t.tipo === 'B' ? 1 : 0)),
      0
    ) +
    (Array.isArray(m.broll) ? m.broll.length : 0) +
    hojasAGenerar +
    (esHablado ? iconosDe(m).length : 0);
  const heredadas = m.tomas.filter((t) => t.frame_inicial === 'heredado').length;
  const videos = m.tomas.length + (Array.isArray(m.broll) ? m.broll.length : 0);
  const duracion = [...m.tomas, ...(m.broll || [])].reduce((s, x) => s + (x.duracion || 0), 0);

  const resumen = {
    tomas: m.tomas.length,
    referencias: lista.length,
    hojasAGenerar,
    broll: m.broll?.length ?? 0,
    imagenes,
    heredadas,
    videos,
    duracion: Number(duracion.toFixed(1)),
  };
  // Solo en anuncios por bloques: costo estimado con ganchos aparte.
  if (hayR) resumen.bloquesR = costoBloquesR(m, lista, { carpeta });

  // Solo en los estilos hablados: cuantos frames se copian de una referencia
  // (no se pagan), cuantos iconos, y el costo con el desglose por tipo.
  if (esHablado) {
    resumen.copias = tomasH.filter((t) => typeof t.frame_inicial === 'string' && t.frame_inicial.trim()).length;
    resumen.iconos = iconosDe(m).length;
    resumen.hablado = costoHablado(m, lista, { carpeta });
  }

  // Solo con continuidad: los videos son los clips de la cadena (pasos +
  // propios de las B + cierre), el metraje es la suma de los tramos que se
  // piden, no hay B-roll, y las hojas que solo usaba el B-roll descartado no
  // se generan.
  if (conContinuidad) {
    const c = resumenContinuidad(m, { carpeta });
    const sinUso = referenciasSoloDelBrollDescartado(m).size;
    resumen.hojasAGenerar -= sinUso;
    resumen.imagenes -= sinUso + resumen.broll;
    resumen.broll = 0;
    resumen.videos = c.clips;
    resumen.duracion = c.segundos;
    resumen.continuidad = c;
  }

  return { errores, avisos, resumen };
}

/** Las lineas del costo de un anuncio por bloques, para imprimir. */
export function lineasCostoBloquesR(c, carpetaArg = '<carpeta>') {
  const L = [];
  const usd = (cr) => `US$${creditosAUsd(cr).toFixed(2)}`;
  const marca = (x) => (x.yaExiste ? '   (ya esta en disco: no se vuelve a pagar)' : '');
  L.push('  Costo estimado (anuncio por bloques UGC, tipo R):');
  if (c.hojas.length) {
    const cu = c.precioHojaVerificado ? `${c.hojas[0].creditos} cr c/u` : 'precio NO verificado';
    L.push(`    Imagen de personaje: ${c.hojas.length} con ${c.modeloImagen} a ${c.resolucionImagen} (${cu})`);
    for (const h of c.hojas) L.push(`      ${h.archivo.padEnd(28)} ${String(h.creditos ?? '?').padStart(4)} cr${marca(h)}`);
  } else {
    L.push('    Imagen de personaje: ninguna que generar');
  }
  if (c.lugares?.length) {
    L.push(`    Lugares repetidos:   ${c.lugares.length} fotograma(s) que el motor saca de su bloque (ffmpeg, 0 cr)`);
    for (const l of c.lugares) {
      const yaSacado = l.yaExiste ? '   (ya esta en disco: se reusa)' : '';
      L.push(`      ${l.archivo.padEnd(28)}    0 cr   (del bloque ${l.de_toma}, segundo ${l.segundo})${yaSacado}`);
    }
  }
  L.push(`    Bloques de video:    ${c.bloques.length} con ${c.modeloVideo} a ${c.resolucionVideo}, solo referencias`);
  for (const b of c.bloques) {
    L.push(`      ${b.archivo.padEnd(28)} ${String(b.creditos ?? '?').padStart(4)} cr   (${b.duracion}s)${marca(b)}`);
  }
  // Por comando, con el mismo redondeo que imprimen ellos (creditosAUsd y
  // dos decimales): "Bloques" es el costo que muestra `npm run videos` con
  // todo por generar. Solo si hay imagen con precio: si no, es el total.
  const conSubtotales = c.hojas.length > 0 && c.precioHojaVerificado;
  const ancho = String(c.creditos.total).length;
  const fila = (etq, cr) => `    ${etq.padEnd(12)}${String(cr).padStart(ancho)} creditos = ${usd(cr)}`;
  if (conSubtotales) {
    L.push(`${fila(c.hojas.length === 1 ? 'Imagen:' : 'Imagenes:', c.creditos.hojas)}   (npm run imagenes)`);
    L.push(`${fila('Bloques:', c.creditos.bloques)}   (npm run videos)`);
  }
  L.push(fila('TOTAL:', c.creditos.total));
  // US$0.005 por credito: un monto impar de creditos cae en medio centavo, y
  // cada monto se redondea por separado. Se explica en vez de forzar la suma.
  const centavos = (cr) => Math.round(Number(creditosAUsd(cr).toFixed(2)) * 100);
  const { hojas, bloques, total } = c.creditos;
  if (conSubtotales && centavos(hojas) + centavos(bloques) !== centavos(total)) {
    L.push(`                (cada monto se redondea aparte al centavo: por eso ${usd(hojas)} + ${usd(bloques)} no da justo ${usd(total)})`);
  }
  if (c.creditos.pendiente !== c.creditos.total) {
    L.push(`    Falta pagar: ${c.creditos.pendiente} creditos = ${usd(c.creditos.pendiente)}`);
  }
  if (!c.precioHojaVerificado && c.hojas.length) {
    L.push(`    OJO: el precio de ${c.modeloImagen} a ${c.resolucionImagen} no esta verificado y no entra en el total.`);
  }
  if (c.ganchos.length) {
    L.push(`    OPCIONAL, ganchos alternativos (${c.ganchos.length}): ${c.creditos.ganchosOpcionales} creditos = ${usd(c.creditos.ganchosOpcionales)}`);
    for (const g of c.ganchos) {
      L.push(`      ${g.archivo.padEnd(28)} ${String(g.creditos ?? '?').padStart(4)} cr   (${g.duracion}s, reemplaza al bloque ${g.reemplaza})${marca(g)}`);
    }
    L.push(`      No entran en el total. Se generan solo si se piden:  npm run videos -- ${carpetaArg} --ganchos`);
  }
  L.push(`    Precios de produccion/config.js (kie.ai, ${PRECIOS.consultado}; Sunburst 2K medido el 2026-10-04).`);
  return L;
}

/** Las lineas del costo de un anuncio hablado (podcast, entrevista), para imprimir. */
export function lineasCostoHablado(c) {
  const L = [];
  const usd = (cr) => `US$${creditosAUsd(cr).toFixed(2)}`;
  const marca = (ya) => (ya ? '   (ya esta en disco: no se vuelve a pagar)' : '');
  const cu = (precio) => (precio === null || precio === undefined ? 'precio NO verificado' : `${precio} cr c/u`);
  const fila = (archivo, cr, extra = '') => `      ${archivo.padEnd(28)} ${String(cr ?? '?').padStart(4)} cr${extra}`;
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

  L.push(`  Costo estimado (estilo ${c.estilo}, tomas habladas H):`);
  if (c.hojas.length) {
    L.push(`    Hojas de referencia: ${c.hojas.length} con ${c.modeloImagen} a ${c.resolucionImagen} (${cu(c.hojas[0].creditos)})`);
    for (const h of c.hojas) L.push(fila(h.archivo, h.creditos, marca(h.yaExiste)));
  } else {
    L.push('    Hojas de referencia: ninguna que generar');
  }
  const aGenerar = c.frames.length
    ? `${c.frames.length} a generar con ${c.modeloImagen} a ${c.resolucionImagen} (${cu(c.frames[0].creditos)})`
    : 'ninguno que generar';
  const copias = c.copias.length ? `${c.frames.length ? ' + ' : '; '}${plural(c.copias.length, 'copia', 'copias')} de una referencia (frame_inicial, 0 cr)` : '';
  L.push(`    Frames iniciales:    ${aGenerar}${copias}`);
  for (const f of c.frames) L.push(fila(f.archivo, f.creditos, marca(f.yaExiste)));
  for (const f of c.copias) L.push(fila(f.archivo, 0, `   (copia de "${f.de}")${f.yaExiste ? '   (ya esta en disco: se reusa)' : ''}`));
  // Como se pide cada clip: con su imagen como frame inicial, o por
  // ingredientes (entrevista: image_urls en orden, mismo modelo y precio).
  const porIngredientes = c.clips.filter((k) => k.ingredientes).length;
  const conFrame = c.clips.length - porIngredientes;
  const comoSePiden = !porIngredientes
    ? 'solo frame inicial'
    : !conFrame
      ? 'por ingredientes (image_urls, en orden)'
      : `${porIngredientes} por ingredientes y ${conFrame} con frame inicial`;
  L.push(`    Clips hablados:      ${c.clips.length} con ${c.modeloVideo} a ${c.resolucionVideo}, ${comoSePiden}, sin respaldo`);
  for (const k of c.clips) {
    L.push(fila(k.archivo, k.creditos, `   (${k.duracion}s${k.ingredientes ? `; ${k.ingredientes.join(' + ')}` : ''})${marca(k.yaExiste)}`));
  }
  if (c.broll.length) {
    L.push(
      `    B-roll:              ${c.broll.length}, imagen con ${c.modeloImagen} a ${c.resolucionImagen} (${cu(c.broll[0].creditosImagen)}) ` +
        `y video con ${c.modeloBroll} a ${c.resolucionVideo} sin audio (${c.precioBrollSegundo ?? '?'} cr/s)`
    );
    for (const b of c.broll) {
      L.push(fila(b.imagen, b.creditosImagen, marca(b.imagenExiste)));
      L.push(fila(b.video, b.creditosVideo, `   (${b.duracion}s)${marca(b.videoExiste)}`));
    }
  } else {
    L.push('    B-roll:              ninguno');
  }
  if (c.iconos.length) {
    L.push(`    Iconos:              ${c.iconos.length} con ${c.modeloIconos} a ${c.resolucionIconos}, fondo transparente (${cu(c.iconos[0].creditos)})`);
    for (const i of c.iconos) L.push(fila(i.archivo, i.creditos, marca(i.yaExiste)));
  }
  // Por comando, con el mismo redondeo que imprimen ellos (creditosAUsd y dos
  // decimales): "Imagenes" es lo de `npm run imagenes` y "Videos" lo de
  // `npm run videos`, con todo por generar.
  const ancho = String(c.creditos.total).length;
  const linea = (etq, cr) => `    ${etq.padEnd(12)}${String(cr).padStart(ancho)} creditos = ${usd(cr)}`;
  L.push(`${linea('Imagenes:', c.creditos.imagenes)}   (npm run imagenes)`);
  L.push(`${linea('Videos:', c.creditos.videos)}   (npm run videos)`);
  L.push(linea('TOTAL:', c.creditos.total));
  // US$0.005 por credito: un monto impar de creditos cae en medio centavo, y
  // cada monto se redondea por separado. Se explica en vez de forzar la suma.
  const centavos = (cr) => Math.round(Number(creditosAUsd(cr).toFixed(2)) * 100);
  const { imagenes, videos, total } = c.creditos;
  if (centavos(imagenes) + centavos(videos) !== centavos(total)) {
    L.push(`                (cada monto se redondea aparte al centavo: por eso ${usd(imagenes)} + ${usd(videos)} no da justo ${usd(total)})`);
  }
  if (c.creditos.pendiente !== c.creditos.total) {
    L.push(`    Falta pagar: ${c.creditos.pendiente} creditos = ${usd(c.creditos.pendiente)}`);
  }
  if (!c.precioImagenVerificado) {
    L.push(`    OJO: el precio de ${c.modeloImagen} a ${c.resolucionImagen} no esta verificado y no entra en el total.`);
  }
  if (c.iconos.length && !c.precioIconoVerificado) {
    L.push(`    OJO: el precio de ${c.modeloIconos} a ${c.resolucionIconos} no esta verificado y no entra en el total.`);
  }
  if (c.broll.length && c.precioBrollSegundo === null) {
    L.push(`    OJO: el precio por segundo de ${c.modeloBroll} a ${c.resolucionVideo} no esta en config.js y el video del B-roll no entra en el total.`);
  }
  const conAudio = MODELOS_VIDEO[c.modeloBroll]?.precioConAudio?.[c.resolucionVideo];
  L.push(
    `    Precios de produccion/config.js (kie.ai, ${PRECIOS.consultado}` +
      `${c.broll.length && c.precioBrollSegundo !== null ? `; el B-roll va mudo: ${c.precioBrollSegundo} cr/s en vez de ${conAudio ?? '?'} con audio` : ''}).`
  );
  return L;
}

// --- CLI ---
if (process.argv[1] && process.argv[1].endsWith('validar-manifiesto.js')) {
  const ruta = process.argv[2];
  if (!ruta) {
    console.error('\n  Uso: node produccion/validar-manifiesto.js <ruta-al-manifiesto.json>\n');
    process.exit(1);
  }
  if (!fs.existsSync(ruta)) {
    console.error(`\n  No encuentro el archivo: ${path.resolve(ruta)}\n`);
    process.exit(1);
  }

  let manifiesto;
  try {
    manifiesto = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch (e) {
    console.error(`\n  El archivo no es JSON valido: ${e.message}`);
    console.error('  Revisa comillas dobles, comas colgando y comentarios.\n');
    process.exit(1);
  }

  const { errores, avisos, resumen } = validarManifiesto(manifiesto, { carpeta: path.dirname(path.resolve(ruta)) });

  console.log(`\n=== Validacion de ${path.basename(ruta)} ===\n`);

  if (resumen?.hablado) {
    // Estilo hablado (podcast, entrevista): tomas H, B-roll con Kling, iconos,
    // y los frames que se copian de una referencia no se pagan.
    const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
    console.log('  Trabajo que implica este manifiesto:');
    console.log(
      `    ${plural(resumen.tomas, 'toma hablada', 'tomas habladas')} (H, estilo ${manifiesto.estilo}) + ${resumen.broll} B-roll` +
        (resumen.iconos ? ` + ${plural(resumen.iconos, 'icono', 'iconos')}` : '')
    );
    console.log(
      `    ${plural(resumen.imagenes, 'imagen', 'imagenes')} a generar` +
        (resumen.copias ? ` (+ ${resumen.copias} frame(s) copiado(s) de una referencia, que no se pagan)` : '')
    );
    console.log(`    ${plural(resumen.videos, 'video', 'videos')} a generar`);
    console.log(`    ${resumen.duracion}s de metraje bruto\n`);
  } else if (resumen?.bloquesR) {
    // Anuncio por bloques (UGC tipo R): se habla de bloques, no de tomas, y
    // no hay B-roll ni frames heredados que contar.
    const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
    console.log('  Trabajo que implica este manifiesto:');
    console.log(`    ${plural(resumen.tomas, 'bloque', 'bloques')} (UGC por bloques, tipo R)`);
    console.log(`    ${plural(resumen.imagenes, 'imagen', 'imagenes')} a generar`);
    console.log(
      `    ${plural(resumen.videos, 'video', 'videos')} a generar` +
        (resumen.bloquesR.ganchos.length ? ' (los ganchos alternativos van aparte)' : '')
    );
    console.log(`    ${resumen.duracion}s de metraje bruto\n`);
  } else if (resumen?.continuidad) {
    // Continuidad: cada video va de una toma a la siguiente, sin B-roll.
    const c = resumen.continuidad;
    console.log('  Trabajo que implica este manifiesto:');
    console.log(
      `    ${resumen.tomas} tomas con continuidad: ${c.pasos} paso${c.pasos === 1 ? '' : 's'} + ` +
        `${c.propios} clip${c.propios === 1 ? '' : 's'} propio${c.propios === 1 ? '' : 's'} B + ${c.cierre} cierre`
    );
    console.log(
      `    ${resumen.imagenes} imagenes a generar` +
        (resumen.heredadas ? ` (+ ${resumen.heredadas} frame(s) heredado(s), que se copian y no se pagan)` : '')
    );
    console.log(`    ${resumen.videos} videos a generar (sin B-roll)`);
    console.log(`    ${resumen.duracion}s de metraje bruto (los tramos que se piden)`);
    const estimado = c.estimado
      ? c.estimadoCon === 'tiempos'
        ? ' (estimado: lo que falta se calculo con los tiempos de la voz, como lo haria --duraciones)'
        : ' (estimado: lo que falta se calculo con la duracion de cada toma; se fija despues de imagenes y audio)'
      : '';
    console.log(`    Costo de los videos: ${c.creditos} creditos = US$${c.usd.toFixed(2)}${estimado}\n`);
  } else if (resumen) {
    console.log('  Trabajo que implica este manifiesto:');
    console.log(`    ${resumen.tomas} tomas + ${resumen.broll} B-roll`);
    console.log(
      `    ${resumen.imagenes} imagenes a generar` +
        (resumen.heredadas ? ` (+ ${resumen.heredadas} frame(s) heredado(s), que se copian y no se pagan)` : '')
    );
    console.log(`    ${resumen.videos} videos a generar`);
    console.log(`    ${resumen.duracion}s de metraje bruto\n`);
  }
  if (resumen) {
    if (resumen.bloquesR) {
      // La carpeta tal como la escribio quien corrio el comando.
      for (const l of lineasCostoBloquesR(resumen.bloquesR, path.dirname(ruta).replace(/\\/g, '/'))) console.log(l);
      console.log('');
    }
    if (resumen.hablado) {
      for (const l of lineasCostoHablado(resumen.hablado)) console.log(l);
      console.log('');
    }
  }

  for (const a of avisos) console.log(`  AVISO  ${a}`);
  for (const e of errores) console.log(`  ERROR  ${e}`);

  if (errores.length === 0) {
    console.log(`\n  Manifiesto valido${avisos.length ? ` (con ${avisos.length} aviso/s)` : ''}.\n`);
  } else {
    console.log(`\n  ${errores.length} error(es). El pipeline no puede correr asi.\n`);
    process.exitCode = 1;
  }
}
