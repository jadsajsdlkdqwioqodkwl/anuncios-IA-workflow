// Tomas habladas con frame inicial (tipo H: podcast y entrevista) — transcribe
// cada clip, comprueba que se dijo el guion y ubica cada linea dentro del clip.
//
//   node produccion/lineas-habladas.js temp/mi-anuncio
//   node produccion/lineas-habladas.js temp/mi-anuncio --tomas 1,3
//   node produccion/lineas-habladas.js temp/mi-anuncio --solo-plan     no transcribe nada
//   (npm run lineas -- temp/mi-anuncio)
//
// POR QUE EXISTE. Un clip de podcast lleva varias lineas seguidas del mismo
// anfitrion (hasta 10 s, lo que acepta Omni), pero en el anuncio esas lineas
// se intercalan con las del otro. El montaje tiene que saber en que segundo
// del clip empieza y termina cada linea para partir el clip en segmentos
// ENTRE linea y linea, nunca dentro de una (ahi vive el lip-sync). Y en los
// dos estilos hace falta saber, antes de montar, si el modelo dijo el guion
// completo, si se comio una palabra o si siguio hablando despues de la
// ultima: es el mismo chequeo que hace el corte de cola de los bloques UGC y
// se reutiliza tal cual (decidirCola), pero aqui es un INFORME: no corta nada.
//
// QUE HACE. Para cada toma H con `linea` (y SOLO esas: ninguna otra toma se
// toca), extrae el audio, lo transcribe con Scribe (transcribir() de
// subtitulos-dialogo.js), alinea `linea` contra lo oido (alinear()) y escribe
// lineas-habladas.json en la carpeta del anuncio:
//
//   { "generado": "...", "tomas": { "1": {
//       "clip": "video/toma-1.mp4", "largo": 10.0, "tamano": 2318456, "calidad": 0.93,
//       "palabras": [ { "text": "O", "start": 0.41, "end": 0.48 }, ... ],
//       "dijo_todo": true, "faltan": [], "sobran_al_final": "",
//       "lineas": [ { "orden": 1, "inicio": 0.41, "fin": 2.86, "calidad": 1.0 }, ... ]
//   } } }
//
//   largo, tamano    lo que dura el clip medido y sus bytes. Una medida es de
//                    OTRO clip (vieja) si el de video/ pesa distinto o, en una
//                    entrada de antes sin `tamano`, si dura distinto (+-0,05 s):
//                    Omni entrega clips del mismo largo, el tamano no se repite.
//                    El plan, el paso voz y los subtitulos la tratan como si
//                    faltara (estadoDeMedida)
//   palabras         lo que oyo Scribe con sus tiempos DENTRO del clip, sin recortar
//   calidad          fraccion de palabras del guion que se oyen
//   dijo_todo        true si no falta ninguna palabra del guion
//   faltan           las palabras del guion que no se oyen (o se oyen
//                    cambiadas), comparando como se DICEN, igual que la
//                    revision del habla (abajo): lo que es solo escritura no
//                    falta ("29" dicho "veintinueve", "superbien" oido "super
//                    bien", la marca que Scribe escribe distinto, "Befem" oido
//                    "Bephem"). Asi una toma no sale "FALTAN" al lado de
//                    "LIMPIO". Y al reves: lo que la revision da por no
//                    dicho o cambiado si falta (un numero dicho a medias,
//                    "49.90" oido "cuarenta y nueve"; un "%" que no se oye),
//                    asi no sale "dijo todo" al lado de "no dijo". La tabla
//                    muestra igual el guion y lo oido
//   sobran_al_final  lo que se oyo despues de la ultima palabra del guion
//   agregadas        lo que se oyo y NO es el guion, desde la primera palabra
//                    que se oye hasta la ultima del guion (revisarHabla; en
//                    el podcast, sin lo que cae entre dos lineas donde el
//                    montaje corta): [{ texto, inicio, fin, tipo }], tipo "repetida",
//                    "trabada", "muletilla", "agregada" o "cambiada" (esta
//                    ultima con `en_lugar_de`: lo que decia el guion ahi)
//   toleradas        las repeticiones de una letra, cortas y sin pausa, que
//                    NO cuentan (TOLERANCIA_REPETICION, aprobada de oido):
//                    [{ texto, inicio, fin }] con las dos veces ("a, a",
//                    8.46-8.64). Siempre se informan; [] si no hay
//   omitidas         palabras del guion que no se dijeron (las que `faltan`
//                    por una diferencia solo de escritura no estan aqui). Un
//                    "%" escrito que no se oye sale como "por ciento (30%)"
//   limpio           true si no hay agregadas ni omitidas (las toleradas no
//                    cuentan). Un clip que no esta limpio se regenera
//                    (2026-10-14, decision del sistema)
//   motivo           solo si no se pudo ni comparar (Scribe no oyo nada, o lo
//                    oido no es el guion): por que no esta limpio
//   lineas           solo si la toma trae `lineas` (podcast): inicio y fin de
//                    cada una en segundos del clip. null si no se encontro:
//                    nunca se inventan tiempos
//
// EL CLIP DE REACCIONES del podcast (clase "reacciones", sin linea) tambien se
// transcribe, con los eventos de audio de Scribe, y su entrada es otra:
//
//   "6": { "clip": "video/toma-6.mp4", "largo": 8.0, "tamano": 1650233, "reacciones": true,
//          "palabras": [ { "text": "Yes", "start": 2.61, "end": 2.8 } ],
//          "eventos": [ { "texto": "(laughs)", "start": 1.62, "end": 2.1 } ],
//          "limpio": false }
//
//   palabras  SOLO las palabras de verdad, en cualquier idioma: cada una es
//             una falla (una reaccion va con los labios cerrados)
//   eventos   los sonidos de reaccion, que valen: los eventos de audio de
//             Scribe y los que escribe como palabra pero no lo son ("mm",
//             "hmm", "mhm", "jaja"). Sirven para ubicar cada reaccion
//   limpio    true si no hay ninguna palabra
//
// Quien lo lee: planear-montaje.js arma con `lineas` los segmentos del podcast
// y subtitulos-dialogo.js reutiliza `palabras` para no transcribir dos veces
// (solo si la medida es de ese clip: estadoDeMedida). Si se rehace una toma,
// su entrada se borra y hay que volver a medirla. El paso voz de la
// entrevista A (recortar-voz.js) tambien la borra: el clip cambio y su medida
// vieja queda en video/originales/.
//
// REVISION DEL HABLA (2026-10-14). Toda palabra repetida, trabada, cambiada o
// agregada obliga a regenerar el clip, nunca "suena natural". Cuenta todo lo
// que queda DENTRO del recorte de bordes: desde la primera palabra que se oye
// hasta la ultima palabra del guion. Lo que se oye despues de esa ultima
// palabra (una repeticion, una muletilla) no cuenta: el recorte lo deja fuera.
// Tampoco cuentan las diferencias que son solo de escritura: un numero en
// cifras ("11" / "once", "S/ 49.90" / "cuarenta y nueve noventa", "2x1" /
// "dos por uno"), palabras pegadas o separadas ("superbien" / "super bien"),
// la marca mal escrita por Scribe ("Bephem" / "Befem") y una muletilla del
// guion escrita distinto ("Eeeh" / "Eh"). Pero un numero dicho a medias
// ("S/ 49.90" oido "cuarenta y nueve") no es escritura: no lo dijo. Un "%"
// escrito se tiene que oir ("treinta POR CIENTO", "percent", "por cento"):
// "ahorra 30" no es "ahorra 30 %"; la moneda escrita con simbolo ("$29") no,
// se puede decir "veintinueve" a secas. En el podcast (toma con `lineas`), lo
// que se oye ENTRE dos lineas en el tramo que el montaje corta
// (huecosQueCortaElMontaje) tampoco cuenta: no se oye en el anuncio. Se
// imprime "NO ESTA LIMPIO". Una sola excepcion, TOLERADA (2026-10-14,
// aprobada de oido): una palabra de UNA letra dicha dos veces seguidas,
// rapido y sin pausa ("a, a" en 0,18 s); no marca NO ESTA LIMPIO pero se
// informa siempre ("tolerada (repeticion de una letra, 0.18 s) ... revisa a
// oido si quieres"). Ver TOLERANCIA_REPETICION. La comparacion
// (palabrasComparables, mismasPalabras, decidirColaHablada) es la misma para
// la revision, el paso voz y el recorte de bordes del plan.
//
// MEDIDAS DE ANTES DE LA REVISION (sin `limpio`). Las palabras ya estan
// guardadas y la revision es una funcion pura: --solo-plan la calcula sobre
// ellas, sin Scribe ni creditos, y la muestra "segun la transcripcion
// guardada" (revisionDeMedidaGuardada, la misma que puede usar el plan).
//
// Costo: Scribe, ~US$0.22 la hora de audio (centavos por anuncio). Lo que
// decide (medirToma, ubicarLineas, revisarHabla, medirReacciones) son
// funciones puras y se prueban sin gastar: temp/prueba-lineas-seco/prueba.mjs
// y, la revision del habla y las reacciones,
// temp/_verificacion/lineas-revision/prueba.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { cargarEnv } from './config.js';
import { alinear, normalizar, transcribir, UMBRAL_ALINEACION } from './subtitulos-dialogo.js';
import { decidirCola, MARGEN_COLA_S, MAX_FINALES_SIN_PAREJA, PAUSA_CLARA_S } from './cortar-cola-ugc.js';

/** Donde vive el informe: en la carpeta del anuncio. */
export const rutaMedidas = (carpeta) => path.join(carpeta, 'lineas-habladas.json');

/** Las palabras de un texto, contadas como las cuentan los subtitulos y el corte de cola. */
export const palabrasDe = (texto) => String(texto ?? '').split(/\s+/).filter(Boolean);

/** Solo las palabras del ASR que sirven: con texto y con tiempos (el mismo filtro que decidirCola). */
export function palabrasValidas(palabrasAsr) {
  return (palabrasAsr || []).filter(
    (w) => w && String(w.text ?? '').trim() && Number.isFinite(w.start) && Number.isFinite(w.end)
  );
}

const s = (x) => `${x.toFixed(2)}s`;
const pct = (x) => `${Math.round(x * 100)}%`;
const r3 = (x) => Number(x.toFixed(3));

/**
 * Ubica cada linea del guion dentro de las palabras del ASR de su clip.
 * FUNCION PURA: no lee archivos ni llama a ninguna API.
 *
 *   lineas       [{ orden, texto }, ...] en el orden en que se dicen en el clip
 *   palabrasAsr  [{ text, start, end }, ...] del clip (ya sin la cola repetida,
 *                si la hubo: medirToma se la quita antes)
 *
 * Devuelve { lineas: [{ orden, inicio, fin, calidad }], avisos }.
 *
 * Se alinea el texto de TODAS las lineas seguido (es lo que se dijo, en ese
 * orden) y despues se reparte por palabra: cada palabra del guion sabe de que
 * linea es. La alineacion es monotona, asi que las lineas salen en orden y no
 * se pisan. inicio = start de la primera palabra del ASR emparejada con la
 * linea; fin = end de la ultima. Una linea sin ninguna pareja queda en null:
 * nunca se inventan tiempos. Con menos del umbral (el de los subtitulos,
 * 60 %) la linea sale con su calidad baja y un aviso, pero con los tiempos
 * que si se midieron.
 *
 * COMO SE DICE (2026-10-14). Guion y oido se comparan como en la revision del
 * habla y el corte de cola (fichasComparables + unirPegadas): "49.90" son
 * tres palabras dichas (cuarenta, nueve, noventa) que se emparejan con lo que
 * oye Scribe, "superbien" es una contra "super bien", y los simbolos de
 * precio no cuentan. Sin eso, una linea que termina en un precio de varias
 * palabras ("Y cuesta solo 49.90.") terminaba en "cuarenta" y el segmento del
 * montaje cortaba el resto del precio. Los tiempos son siempre los de las
 * palabras ORIGINALES del ASR, y el fin se estira sobre la moneda o el "por
 * ciento" dichos pegados al final ("cuarenta y nueve SOLES"): sin una pausa
 * clara (PAUSA_CLARA_S), o siempre si la linea los escribe ("29 soles.").
 * `calidad` cuenta las palabras del guion que se dicen (una moneda escrita o
 * un simbolo suelto no cuentan).
 *
 * PEGADAS ENTRE DOS LINEAS. Del lado de lo oido no se ve donde termina cada
 * linea: dos palabras de Scribe seguidas que, juntas, son una palabra del
 * guion de la toma ("Si." + "No" = "sino") se unian aunque fueran el final
 * de una linea y el principio de la siguiente, y la linea anterior se quedaba
 * con la primera palabra de la otra. Por eso no se unen si la primera cierra
 * una frase (. ? ! ...) o si hay una pausa clara entre ellas
 * (PAUSA_SEPARA_PALABRAS_S); del lado del guion, tampoco si la primera cierra
 * una frase. Solo aca: el final del guion (decidirColaHablada) y `faltan`
 * siguen uniendo como antes, y ahi una palabra pegada dicha con una pausa
 * ("super... bien") no se corta.
 *
 * BORDES MAL OIDOS. Si la ULTIMA palabra de una linea no encontro pareja (lo
 * tipico: una marca, "Befem" oido como "Bephem"), el fin quedaria en la
 * palabra anterior y el segmento del montaje le cortaria la marca. Por eso,
 * como hace el corte de cola con el final del guion (MAX_FINALES_SIN_PAREJA),
 * hasta 2 palabras sin pareja en cada borde de la linea se toman como las
 * palabras del ASR que quedaron sueltas justo ahi, entre esta linea y la
 * vecina. Son tiempos medidos, no inventados, y se avisa cuales se tomaron.
 * Solo en lineas bien alineadas (calidad >= umbral): en una linea que ya no
 * se reconoce, tomar palabras sueltas es adivinar encima de adivinar.
 */
export function ubicarLineas(lineas, palabrasAsr, { umbral = UMBRAL_ALINEACION, idioma = 'es' } = {}) {
  const asr = palabrasValidas(palabrasAsr);
  const lista = Array.isArray(lineas) ? lineas : [];
  const textos = lista.map((l) => palabrasDe(l?.texto));
  const correctas = textos.flat();
  const avisos = [];
  const sinTiempos = (l, calidad = 0) => ({ orden: l.orden, inicio: null, fin: null, calidad });

  if (!lista.length) return { lineas: [], avisos };
  if (!correctas.length) {
    avisos.push('las lineas de la toma no tienen texto: no hay nada que ubicar');
    return { lineas: lista.map((l) => sinTiempos(l)), avisos };
  }
  if (!asr.length) {
    avisos.push('Scribe no oyo ninguna palabra en el clip: ninguna linea tiene tiempos');
    return { lineas: lista.map((l) => sinTiempos(l)), avisos };
  }

  // Guion y oido como se dicen. Las fichas del guion, linea por linea (una
  // cifra o una palabra pegada nunca se junta con la linea vecina), con k =
  // la palabra original en `correctas`; las del oido, con k = la palabra
  // original del ASR.
  const fichasG = [];
  const primeraDe = [];
  let base = 0;
  textos.forEach((t, linea) => {
    primeraDe.push(base);
    for (const f of fichasComparables(t, idioma)) fichasG.push({ ...f, k: f.k + base, kf: f.kf + base, linea });
    base += t.length;
  });
  const todasA = partesComparables(
    asr.map((w) => w.text),
    idioma
  );
  const { g, a } = unirPegadas(fichasG, fichasDePartes(todasA), {
    separadasG: separadasEn(correctas),
    separadasA: separadasEn(
      asr.map((w) => w.text),
      asr
    ),
  });
  const { pares } = alinear(
    g.map((f) => f.t),
    a.map((f) => f.t)
  );

  // Por palabra ORIGINAL del guion: cuantas fichas tiene (0: un simbolo
  // suelto, o la moneda escrita junto a un numero) y con que palabras del ASR
  // se emparejaron.
  const fichasDePalabra = correctas.map(() => 0);
  const parejasDePalabra = correctas.map(() => []);
  g.forEach((f, i) => {
    for (let k = f.k; k <= f.kf; k++) {
      fichasDePalabra[k]++;
      if (pares[i] !== null) for (let j = a[pares[i]].k; j <= a[pares[i]].kf; j++) parejasDePalabra[k].push(j);
    }
  });
  // Lo que le toca a cada linea: sus palabras con fichas, las que encontraron
  // pareja, y la primera y la ultima palabra del ASR que le corresponden.
  const tramos = textos.map((t, linea) => {
    const conFichas = t.map((_, i) => primeraDe[linea] + i).filter((k) => fichasDePalabra[k] > 0);
    const conPareja = conFichas.filter((k) => parejasDePalabra[k].length);
    const js = conPareja.flatMap((k) => parejasDePalabra[k]);
    return { conFichas, conPareja, jIni: js.length ? Math.min(...js) : null, jFin: js.length ? Math.max(...js) : null };
  });
  // Donde arranca la primera linea con pareja a partir de k, y donde termina
  // la ultima con pareja hasta k: los topes entre los que una linea puede
  // tomar palabras sueltas.
  const primeraPareja = (k) => {
    for (let i = k; i < tramos.length; i++) if (tramos[i].jIni !== null) return tramos[i].jIni;
    return asr.length;
  };
  const ultimaPareja = (k) => {
    for (let i = k; i >= 0; i--) if (tramos[i].jFin !== null) return tramos[i].jFin;
    return -1;
  };
  // Una palabra del ASR que es solo la moneda o el por ciento: pegada a un
  // numero (fuera), o cualquiera si la linea la escribe.
  const esUnidad = (j, escrita) => {
    const ps = todasA.filter((p) => p.k === j);
    return ps.length > 0 && ps.every((p) => p.tipo === 'unidad' && (p.fuera || escrita));
  };

  const tomadas = new Set();
  const salida = [];
  for (let k = 0; k < lista.length; k++) {
    const l = lista[k];
    const tr = tramos[k];
    const n = textos[k].length;
    if (!n) {
      avisos.push(`linea ${l.orden}: no tiene texto`);
      salida.push(sinTiempos(l));
      continue;
    }
    const nc = tr.conFichas.length;
    const calidad = nc ? r3(tr.conPareja.length / nc) : 0;
    if (!tr.conPareja.length) {
      avisos.push(`linea ${l.orden}: ninguna de sus palabras aparece en la transcripcion, queda sin tiempos. "${l.texto}"`);
      salida.push(sinTiempos(l, 0));
      continue;
    }
    let jIni = tr.jIni;
    let jFin = tr.jFin;

    // Bordes mal oidos (ver arriba), solo si la linea esta bien alineada.
    // Primero el final: la linea anterior ya tomo las suyas, y lo que esta
    // tome ahora no se lo puede llevar la siguiente (`tomadas`).
    let sinParejaFin = 0;
    let sinParejaIni = 0;
    if (calidad >= umbral) {
      while (sinParejaFin < nc && !parejasDePalabra[tr.conFichas[nc - 1 - sinParejaFin]].length) sinParejaFin++;
      while (sinParejaIni < nc && !parejasDePalabra[tr.conFichas[sinParejaIni]].length) sinParejaIni++;
    }

    if (sinParejaFin > 0) {
      const tope = primeraPareja(k + 1);
      const cupo = Math.min(sinParejaFin, MAX_FINALES_SIN_PAREJA);
      const sueltas = [];
      // Seguidas desde el final de la linea: si una ya la tomo otra linea, ahi
      // se para (no se salta por encima: la linea quedaria con un hueco ajeno).
      for (let j = jFin + 1; j < tope && sueltas.length < cupo && !tomadas.has(j); j++) sueltas.push(j);
      if (sueltas.length) {
        for (const j of sueltas) tomadas.add(j);
        jFin = sueltas[sueltas.length - 1];
        const final = correctas.slice(tr.conFichas[nc - sinParejaFin], primeraDe[k] + n);
        avisos.push(
          `linea ${l.orden}: su final ("${final.join(' ')}") no coincide con lo que oyo Scribe; ` +
            `se toma como tal "${sueltas.map((j) => asr[j].text).join(' ')}" (termina en ${s(asr[jFin].end)})`
        );
      }
    }
    // La moneda o el por ciento dichos al final de la linea ("cuarenta y nueve
    // SOLES") no entran en la comparacion, pero son de la linea: sin una pausa
    // clara, o siempre si la linea los escribe ("29 soles.").
    const escritas = unidadesAlFinal(textos[k], idioma);
    for (let extra = 0, tope = primeraPareja(k + 1); jFin + 1 < tope && !tomadas.has(jFin + 1); extra++) {
      const escrita = extra < escritas;
      if (!esUnidad(jFin + 1, escrita) || (!escrita && asr[jFin + 1].start - asr[jFin].end >= PAUSA_CLARA_S)) break;
      tomadas.add(++jFin);
    }
    if (sinParejaIni > 0) {
      const piso = ultimaPareja(k - 1);
      const cupo = Math.min(sinParejaIni, MAX_FINALES_SIN_PAREJA);
      const sueltas = [];
      for (let j = jIni - 1; j > piso && sueltas.length < cupo && !tomadas.has(j); j--) sueltas.unshift(j);
      if (sueltas.length) {
        for (const j of sueltas) tomadas.add(j);
        jIni = sueltas[0];
        const principio = correctas.slice(primeraDe[k], tr.conFichas[sinParejaIni - 1] + 1);
        avisos.push(
          `linea ${l.orden}: su principio ("${principio.join(' ')}") no coincide con lo que oyo Scribe; ` +
            `se toma como tal "${sueltas.map((j) => asr[j].text).join(' ')}" (empieza en ${s(asr[jIni].start)})`
        );
      }
    }
    if (calidad < umbral) {
      avisos.push(
        `linea ${l.orden}: solo ${pct(calidad)} de sus palabras encontraron pareja (hace falta ${pct(umbral)}): ` +
          `calidad baja, escucha ese tramo del clip. "${l.texto}"`
      );
    }
    salida.push({ orden: l.orden, inicio: asr[jIni].start, fin: asr[jFin].end, calidad });
  }
  return { lineas: salida, avisos };
}

// ---------------------------------------------------------------- revision del habla

/**
 * Un numero en letras, como se dice ("11" -> "once"; "60" -> "sesenta"), en
 * el idioma del anuncio ('es', 'en' o 'pt'). Hasta los cientos de millones;
 * fuera de eso, null. Solo para comparar: los espacios y las tildes los quita
 * la normalizacion, asi que "sesenta y cinco" y "sesentaicinco" no importan.
 */
export function numeroEnLetras(n, idioma = 'es') {
  if (!Number.isInteger(n) || n < 0 || n >= 1e9) return null;
  const f = { es: enLetrasEs, en: enLetrasEn, pt: enLetrasPt }[idioma] || enLetrasEs;
  return f(n);
}

const UNO_A_29_ES = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce',
  'quince', 'dieciseis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidos', 'veintitres',
  'veinticuatro', 'veinticinco', 'veintiseis', 'veintisiete', 'veintiocho', 'veintinueve',
];
const DECENAS_ES = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS_ES = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
function enLetrasEs(n) {
  if (n < 30) return UNO_A_29_ES[n];
  if (n < 100) return DECENAS_ES[Math.floor(n / 10)] + (n % 10 ? ` y ${UNO_A_29_ES[n % 10]}` : '');
  if (n < 1000) return n === 100 ? 'cien' : CENTENAS_ES[Math.floor(n / 100)] + (n % 100 ? ` ${enLetrasEs(n % 100)}` : '');
  if (n < 1e6) {
    const miles = Math.floor(n / 1000);
    return (miles === 1 ? 'mil' : `${enLetrasEs(miles)} mil`) + (n % 1000 ? ` ${enLetrasEs(n % 1000)}` : '');
  }
  const millones = Math.floor(n / 1e6);
  return (millones === 1 ? 'un millon' : `${enLetrasEs(millones)} millones`) + (n % 1e6 ? ` ${enLetrasEs(n % 1e6)}` : '');
}

const UNO_A_19_EN = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen',
  'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const DECENAS_EN = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function enLetrasEn(n) {
  if (n < 20) return UNO_A_19_EN[n];
  if (n < 100) return DECENAS_EN[Math.floor(n / 10)] + (n % 10 ? ` ${UNO_A_19_EN[n % 10]}` : '');
  if (n < 1000) return `${UNO_A_19_EN[Math.floor(n / 100)]} hundred` + (n % 100 ? ` ${enLetrasEn(n % 100)}` : '');
  if (n < 1e6) return `${enLetrasEn(Math.floor(n / 1000))} thousand` + (n % 1000 ? ` ${enLetrasEn(n % 1000)}` : '');
  return `${enLetrasEn(Math.floor(n / 1e6))} million` + (n % 1e6 ? ` ${enLetrasEn(n % 1e6)}` : '');
}

const UNO_A_19_PT = [
  'zero', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze',
  'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove',
];
const DECENAS_PT = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS_PT = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
function enLetrasPt(n) {
  if (n < 20) return UNO_A_19_PT[n];
  if (n < 100) return DECENAS_PT[Math.floor(n / 10)] + (n % 10 ? ` e ${UNO_A_19_PT[n % 10]}` : '');
  if (n < 1000) return n === 100 ? 'cem' : CENTENAS_PT[Math.floor(n / 100)] + (n % 100 ? ` e ${enLetrasPt(n % 100)}` : '');
  if (n < 1e6) {
    const miles = Math.floor(n / 1000);
    return (miles === 1 ? 'mil' : `${enLetrasPt(miles)} mil`) + (n % 1000 ? ` e ${enLetrasPt(n % 1000)}` : '');
  }
  const millones = Math.floor(n / 1e6);
  return (millones === 1 ? 'um milhao' : `${enLetrasPt(millones)} milhoes`) + (n % 1e6 ? ` ${enLetrasPt(n % 1e6)}` : '');
}

const POR_CIENTO = { es: 'por ciento', en: 'percent', pt: 'por cento' };

/**
 * Una palabra tal como se DICE, para comparar: un numero escrito con cifras
 * pasa a letras ("11" -> "once", "60%" -> "sesenta por ciento", "1.500" ->
 * "mil quinientos"); cualquier otra cosa queda igual. Asi "11" y "once" son
 * la misma palabra, este escrita como este en el guion o en lo que oyo Scribe.
 */
export function formaHablada(texto, idioma = 'es') {
  const t = String(texto ?? '');
  const m = t.match(/^([^\p{L}\p{N}]*)(\d{1,3}(?:[.,]\d{3})+|\d+)(%?)([^\p{L}\p{N}]*)$/u);
  if (!m) return t;
  const letras = numeroEnLetras(Number(m[2].replace(/[.,]/g, '')), idioma);
  if (!letras) return t;
  return letras + (m[3] ? ` ${POR_CIENTO[idioma] || POR_CIENTO.es}` : '');
}

// ---------------------------------------------------------------- comparar guion y oido

/**
 * Los simbolos de precio y de porcentaje: se escriben pero no se dicen tal
 * cual ("$29" se dice "veintinueve" o "veintinueve dolares", "60%" se dice
 * "sesenta por ciento"). "S/" y los "$" con letras delante (US$, R$, MX$)
 * solo al principio de una palabra: "y/o" no es un precio.
 */
const SIMBOLOS_PRECIO = /(?<!\p{L})(?:US\$|U\$S|R\$|MX\$|S\/\.?)|[$€£¢%]/giu;
/** El mismo, sin la bandera g: para preguntar si hay alguno. */
const SIMBOLO_PRECIO = new RegExp(SIMBOLOS_PRECIO.source, 'iu');

/** Hay una cifra o un simbolo de precio en el texto (o en alguna palabra de la lista). */
function conCifrasOSimbolos(texto) {
  const t = Array.isArray(texto) ? texto.join(' ') : String(texto ?? '');
  return /\d/.test(t) || SIMBOLO_PRECIO.test(t);
}

/**
 * Lo que se dice pegado a un numero y el guion puede no escribir: la moneda
 * ("$29" / "veintinueve dolares", "S/ 49.90" / "cuarenta y nueve soles con
 * noventa centimos") y el por ciento ("porciento" escrito junto; "por ciento"
 * separado se reconoce aparte). Ya normalizadas. Solo se ignoran PEGADAS a un
 * numero (partesComparables): "sol" en "un dia de sol" sigue contando.
 */
const UNIDADES = new Set([
  'dolar', 'dolares', 'sol', 'soles', 'peso', 'pesos', 'euro', 'euros', 'real', 'reales', 'reais', 'boliviano',
  'bolivianos', 'quetzal', 'quetzales', 'lempira', 'lempiras', 'colon', 'colones', 'guarani', 'guaranies', 'centavo',
  'centavos', 'centimo', 'centimos', 'dollar', 'dollars', 'buck', 'bucks', 'cent', 'cents', 'porciento', 'porcento',
  'percent', 'usd', 'pen', 'mxn', 'cop', 'clp', 'ars',
]);

/** La misma moneda en singular o plural, o el por ciento, como una sola clave ("soles" -> "sol"). */
const CLAVE_UNIDAD = {
  dolares: 'dolar', dollar: 'dolar', dollars: 'dolar', buck: 'dolar', bucks: 'dolar', usd: 'dolar',
  soles: 'sol', pen: 'sol', pesos: 'peso', mxn: 'peso', cop: 'peso', clp: 'peso', ars: 'peso', euros: 'euro',
  reales: 'real', reais: 'real', bolivianos: 'boliviano', quetzales: 'quetzal', lempiras: 'lempira', colones: 'colon',
  guaranies: 'guarani', centavos: 'centavo', centimo: 'centavo', centimos: 'centavo', cent: 'centavo', cents: 'centavo',
  por: 'porciento', per: 'porciento', ciento: 'porciento', cento: 'porciento', porcento: 'porciento', percent: 'porciento',
};
const claveDeUnidad = (t) => CLAVE_UNIDAD[t] || t;

/**
 * El por ciento dicho en dos palabras, ya normalizadas: "por ciento" (es),
 * "por cento" (pt), "per cent" (en).
 */
const esPorCiento = (a, b) => (a === 'por' && /^ci?ento$/.test(String(b))) || (a === 'per' && b === 'cent');

/**
 * Lo que une dos numeros al decirlos: "cuarenta Y nueve", "dos POR uno"
 * (2x1), "uno COMA cinco" (1,5), "cuarenta y nueve CON noventa" (49.90),
 * "veinticuatro POR siete" (24/7), "de dos A tres" (2-3). Solo se ignoran
 * ENTRE dos numeros: "cafe con leche" sigue contando.
 */
const CONECTORES = new Set(['y', 'e', 'con', 'punto', 'coma', 'por', 'x', 'barra', 'a', 'and', 'point', 'virgula', 'ponto', 'by', 'slash']);

/**
 * Las palabras con que se dicen los numeros en cada idioma, ya normalizadas:
 * las de numeroEnLetras de 0 a 1000, las de los miles y millones, y "un" /
 * "una" (es), "um" / "uma" (pt).
 */
const NUMEROS = (() => {
  const extra = {
    es: ['un', 'una', 'mil', 'millon', 'millones', 'cien'],
    en: ['hundred', 'thousand', 'million'],
    pt: ['um', 'uma', 'mil', 'milhao', 'milhoes', 'cem'],
  };
  const porIdioma = {};
  for (const idioma of Object.keys(extra)) {
    const set = new Set(extra[idioma]);
    for (let n = 0; n <= 1000; n++) {
      for (const w of String(numeroEnLetras(n, idioma) || '').split(/\s+/)) {
        const t = normalizar(w);
        if (t && !CONECTORES.has(t)) set.add(t);
      }
    }
    porIdioma[idioma] = set;
  }
  return porIdioma;
})();
const numerosDe = (idioma) => NUMEROS[idioma] || NUMEROS.es;

/**
 * Un numero escrito con cifras, en las palabras con que se dice, sin los
 * conectores ("49" -> ["cuarenta", "nueve"]). Entiende:
 *   - enteros, con punto o coma de miles ("1.500", "1,500": mil quinientos);
 *   - decimales con punto o coma ("49.90" -> cuarenta y nueve noventa,
 *     "1,5" -> uno cinco; ",00" no se dice; un cero adelante, "cero");
 *   - cifras unidas con x, /, : o guion ("2x1", "24/7", "11:30", "2-3"):
 *     cada una por su lado.
 * Devuelve null si no es eso (o si es demasiado grande para numeroEnLetras).
 */
function cifrasEnPalabras(nucleo, idioma) {
  const t = String(nucleo);
  const enPalabras = (n) => {
    const letras = numeroEnLetras(n, idioma);
    return letras ? letras.split(/\s+/).map((w) => normalizar(w)).filter((w) => w && !CONECTORES.has(w)) : null;
  };
  if (/^\d{1,3}([.,])\d{3}(?:\1\d{3})*$/.test(t)) return enPalabras(Number(t.replace(/[.,]/g, '')));
  if (/^\d+$/.test(t)) return enPalabras(Number(t));
  let m = t.match(/^(\d+)[.,](\d+)$/);
  if (m) {
    const entero = enPalabras(Number(m[1]));
    if (!entero) return null;
    if (/^0+$/.test(m[2])) return entero;
    const ceros = m[2].match(/^0*/)[0].length;
    const resto = enPalabras(Number(m[2].slice(ceros)));
    return resto ? [...entero, ...Array(ceros).fill(numeroEnLetras(0, idioma)), ...resto] : null;
  }
  m = t.match(/^\d+(?:[.,]\d+)?(?:[x×/:\-–][\d]+(?:[.,]\d+)?)+$/i);
  if (m) {
    const partes = t.split(/[x×/:\-–]/i).map((p) => cifrasEnPalabras(p, idioma));
    return partes.every(Boolean) ? partes.flat() : null;
  }
  return null;
}

/**
 * Las palabras de un texto listas para comparar guion y oido, cada una con
 * de que palabra ORIGINAL sale (k) y que es (tipo: 'palabra', 'numero',
 * 'unidad', 'conector'). FUNCION PURA.
 *
 *   - sin tildes, sin mayusculas ni puntuacion (normalizar), "okay" = "ok";
 *   - los simbolos de precio y porcentaje no cuentan ($, S/, US$, %...);
 *   - un numero con cifras pasa a las palabras con que se dice, una por
 *     palabra ("49.90" -> cuarenta, nueve, noventa): asi se alinea uno a uno
 *     con lo que oye Scribe, escriba cifras o letras;
 *   - la moneda y el por ciento PEGADOS a un numero quedan fuera (fuera:
 *     true), y tambien los conectores ENTRE dos numeros ("cuarenta Y nueve",
 *     "dos POR uno"): con o sin ellos es lo mismo dicho.
 *
 *   textos   las palabras originales (de palabrasDe, o los `text` del ASR)
 *
 * Devuelve TODAS las partes, con `fuera` en las que no cuentan.
 */
function partesComparables(textos, idioma = 'es') {
  const numeros = numerosDe(idioma);
  const partes = [];
  (textos || []).forEach((texto, k) => {
    const crudo = String(texto ?? '');
    // Un simbolo puede estar pegado ("S/49.90", "$29", "60%"): se quita y lo
    // que queda se mira por pedazos.
    for (const trozo of crudo.replace(SIMBOLOS_PRECIO, ' ').split(/\s+/).filter(Boolean)) {
      const nucleo = trozo.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      let cifras = cifrasEnPalabras(nucleo, idioma);
      // "twenty-nine", "veinti-nueve": palabras de numero unidas con guion.
      if (!cifras && /[-‐-—]/.test(nucleo)) {
        const ps = nucleo.split(/[-‐-—]+/).map((p) => normalizar(p)).filter(Boolean);
        if (ps.length > 1 && ps.every((p) => numeros.has(p))) cifras = ps;
      }
      if (cifras) {
        for (const t of cifras) partes.push({ t, k, tipo: 'numero' });
        continue;
      }
      let t = normalizar(trozo);
      if (!t) continue;
      t = VARIANTES[t] || t;
      const tipo = numeros.has(t) ? 'numero' : UNIDADES.has(t) ? 'unidad' : CONECTORES.has(t) ? 'conector' : 'palabra';
      partes.push({ t, k, tipo });
    }
  });
  // "por ciento" / "por cento" / "per cent" despues de un numero: es el %, una unidad.
  for (let i = 1; i + 1 < partes.length; i++) {
    if (esPorCiento(partes[i].t, partes[i + 1].t) && partes[i - 1].tipo === 'numero') {
      partes[i].tipo = 'unidad';
      partes[i + 1].tipo = 'unidad';
    }
  }
  // El vecino que cuenta hacia un lado, saltando lo que no decide.
  const vecino = (i, paso, salta) => {
    for (let j = i + paso; j >= 0 && j < partes.length; j += paso) if (!salta(partes[j])) return partes[j];
    return null;
  };
  const esUnidadOConector = (p) => p.tipo === 'unidad' || p.tipo === 'conector';
  partes.forEach((p, i) => {
    if (p.tipo !== 'unidad') return;
    if (vecino(i, -1, esUnidadOConector)?.tipo === 'numero' || vecino(i, 1, esUnidadOConector)?.tipo === 'numero') p.fuera = true;
  });
  const saltaConector = (p) => p.tipo === 'conector' || p.fuera;
  partes.forEach((p, i) => {
    if (p.tipo !== 'conector') return;
    if (vecino(i, -1, saltaConector)?.tipo === 'numero' && vecino(i, 1, saltaConector)?.tipo === 'numero') p.fuera = true;
  });
  return partes;
}

/**
 * Las partes que cuentan (sin las `fuera`) como fichas para alinear guion y
 * oido: { t, k, kf }, con k y kf = la primera y la ultima palabra ORIGINAL de
 * donde sale (la misma, salvo que unirPegadas junte varias).
 */
const fichasDePartes = (partes) => partes.filter((p) => !p.fuera).map((p) => ({ t: p.t, k: p.k, kf: p.k }));
const fichasComparables = (textos, idioma) => fichasDePartes(partesComparables(textos, idioma));

/**
 * Lo unido tiene que tener al menos estas letras: "y a" / "ya" no se juntan
 * (cualquier "ya" de otra frase las atraparia); "o sea" / "osea", "a veces" /
 * "aveces", "super bien" / "superbien", si.
 */
const MIN_LETRAS_PEGADAS = 4;

/**
 * Palabras pegadas o separadas distinto en el guion y en lo oido
 * ("superbien" / "super bien", "porque" / "por que", "talvez" / "tal vez"):
 * si 2 o 3 fichas seguidas de un lado, unidas, son una ficha del otro lado,
 * pasan a ser UNA ficha (las letras unidas, k de la primera y kf de la
 * ultima). Asi la alineacion las empareja una a una y el final del guion se
 * encuentra aunque el modelo lo repita ("Me quedo superbien." contra "Me
 * quedo super bien. Super bien."). En el guion nunca se juntan fichas de dos
 * lineas distintas (`linea`). FUNCION PURA.
 *
 *   separadasG, separadasA  opcionales: (ficha, siguiente) => true si esas
 *                           dos fichas seguidas no se pueden unir (separadasEn)
 */
function unirPegadas(g, a, { separadasG = null, separadasA = null } = {}) {
  const deG = new Set(g.map((f) => f.t));
  const deA = new Set(a.map((f) => f.t));
  return { g: unirSiEsta(g, deA, separadasG), a: unirSiEsta(a, deG, separadasA) };
}
function unirSiEsta(fichas, delOtroLado, separadas = null) {
  const salida = [];
  for (let i = 0; i < fichas.length; ) {
    let unida = null;
    for (const n of [3, 2]) {
      const trozo = fichas.slice(i, i + n);
      if (trozo.length < n || trozo.some((f) => f.linea !== trozo[0].linea)) continue;
      if (separadas && trozo.some((f, j) => j > 0 && separadas(trozo[j - 1], f))) continue;
      const t = trozo.map((f) => f.t).join('');
      if (t.length >= MIN_LETRAS_PEGADAS && delOtroLado.has(t)) {
        unida = { ...trozo[0], t, kf: trozo[n - 1].kf, n };
        break;
      }
    }
    if (unida) {
      const { n, ...ficha } = unida;
      salida.push(ficha);
      i += n;
    } else salida.push(fichas[i++]);
  }
  return salida;
}

/**
 * Una pausa asi entre dos palabras de Scribe ya separa: no son una palabra
 * pegada dicha de corrido ("super bien" / "superbien"), son dos.
 */
export const PAUSA_SEPARA_PALABRAS_S = 0.25;

/** La palabra cierra una frase: termina en . ? ! o ... (con comillas o parentesis detras). */
const cierraFrase = (texto) => /[.!?…]["'»”)\]]*$/u.test(String(texto ?? '').trim());

/**
 * Para unirPegadas: dos fichas seguidas no se unen si entre sus palabras
 * ORIGINALES se cierra una frase ("Si." + "No" no es "sino") o, con
 * `tiempos` (lo oido: las palabras del ASR, mismos indices que `textos`),
 * si hay una pausa de mas de PAUSA_SEPARA_PALABRAS_S. Dos fichas de la misma
 * palabra original ("49.90": cuarenta, nueve, noventa) siempre se pueden unir.
 */
function separadasEn(textos, tiempos = null) {
  return (x, y) => {
    if (y.k <= x.kf) return false;
    for (let k = x.kf; k < y.k; k++) if (cierraFrase(textos[k])) return true;
    if (!tiempos) return false;
    const pausa = tiempos[y.k].start - tiempos[x.kf].end;
    return pausa > PAUSA_SEPARA_PALABRAS_S + 1e-9;
  };
}

/**
 * Cuantas palabras OIDAS del final son la moneda o el por ciento que el texto
 * escribe al final junto a un numero ("29 soles." -> 1, "30 por ciento" -> 2,
 * "30%" o "30 %" -> 2, por "por ciento"; "$29" -> 0): se tienen que oir, asi
 * que el corte nunca los deja fuera. Un "%" vale 2: se dice "por ciento" (o
 * "percent", 1, y ahi el corte se para en la palabra que no es unidad).
 */
function unidadesAlFinal(palabras, idioma) {
  const partes = partesComparables(palabras, idioma);
  let n = 0;
  for (let i = palabras.length - 1; i >= 0; i--) {
    n += 2 * (String(palabras[i] ?? '').match(/%/g) || []).length;
    const propias = partes.filter((p) => p.k === i);
    if (!propias.length) continue;
    if (!propias.every((p) => p.tipo === 'unidad' && p.fuera)) break;
    n++;
  }
  return n;
}

/** "un", "una", "uno" (y "veintiun", "veintiuna"...) son la misma palabra cuando el otro lado lo escribio con cifras ("1"). */
const unoComoUno = (t) => t.replace(/^(veinti|)(?:un|una|uno)$/, '$1uno').replace(/^(?:um|uma)$/, 'um');

/**
 * Las palabras de un texto (o de una lista de palabras) como se comparan
 * guion y oido: ver partesComparables. Sin las que no cuentan.
 */
export function palabrasComparables(texto, idioma = 'es') {
  const lista = Array.isArray(texto) ? texto : palabrasDe(texto);
  return partesComparables(lista, idioma)
    .filter((p) => !p.fuera)
    .map((p) => p.t);
}

/**
 * Un texto listo para comparar, todo junto y sin espacios: asi "superbien" y
 * "super bien" son lo mismo, y "11", "once", "S/ 49.90" y "cuarenta y nueve
 * soles con noventa" se escriben igual que como se dicen. Ver
 * partesComparables. Para comparar dos textos, mismasPalabras.
 */
export function normalizarComparable(texto, idioma = 'es') {
  return palabrasComparables(texto, idioma).join('');
}

/**
 * Dos textos (una palabra, una frase o una lista de palabras) dicen lo mismo,
 * aunque esten escritos distinto: numeros con cifras o con letras ("once" /
 * "11", "sesenta" / "60", "mil" / "1000"), simbolos de precio o porcentaje
 * ("$", "S/", "US$", "%"), palabras pegadas o separadas ("superbien" /
 * "super bien"), tildes y mayusculas. Si uno de los dos trae cifras, "un",
 * "una" y "uno" son el mismo "1". FUNCION PURA.
 */
export function mismasPalabras(a, b, idioma = 'es') {
  const x = palabrasComparables(a, idioma);
  const y = palabrasComparables(b, idioma);
  if (x.join('') === y.join('')) return true;
  if (!conCifrasOSimbolos(a) && !conCifrasOSimbolos(b)) return false;
  return x.map(unoComoUno).join('') === y.map(unoComoUno).join('');
}

/**
 * decidirCola() (cortar-cola-ugc.js, la de UGC, que no cambia) comparando
 * guion y oido como se DICEN (partesComparables + unirPegadas), SIEMPRE:
 *   - con un guion que termina en cifras ("Y todo por solo 29 soles.") y el
 *     modelo que repite el final ("...veintinueve soles. Solo veintinueve
 *     soles."), decidirCola sola no encuentra la ultima palabra del guion
 *     ('sin-decidir') y la repeticion queda dentro;
 *   - con una palabra pegada o separada distinto al final ("Me quedo
 *     superbien." contra "...super bien. Super bien.", o "super bien" contra
 *     "superbien. Superbien."), decidirCola sola tampoco ('sin-decidir', o
 *     'nada' con la REPETICION como ultima palabra), y la revision marcaba
 *     NO LIMPIO un clip que el recorte arregla.
 * FUNCION PURA.
 *
 * Misma forma que decidirCola (decision, fin, motivo, sobrantes,
 * transcripcion, ultimaPalabra, calidad, avisos), con las palabras ORIGINALES
 * del ASR (tambien en motivo y avisos), mas `indiceUltima`: el indice en
 * palabrasValidas(palabrasAsr) de la ultima palabra del guion (-1 si no se
 * sabe). La moneda o el por ciento dichos pegados a esa ultima palabra
 * ("veintinueve DOLARES") son parte de ella: el corte nunca cae en medio; y
 * si el guion los escribe al final ("29 soles."), tambien despues de una pausa.
 *
 * Sin cifras, simbolos ni palabras pegadas distinto, sale lo mismo que
 * decidirCola: los clips que ya se midieron cortan igual que siempre. Y si
 * decidirCola corta y la comparacion no se decide, manda decidirCola (nunca
 * corta peor que antes).
 */
export function decidirColaHablada(linea, palabrasAsr, { idioma = 'es' } = {}) {
  // Una repeticion tolerada ("y, y" rapido, TOLERANCIA_REPETICION) cuenta como
  // UNA palabra para buscar el final del guion: si cae justo antes de la
  // ultima palabra y esta empieza con la misma letra ("Pan y, y yo."),
  // decidirCola tomaba la segunda "y" como la ultima palabra ("yo" por
  // prefijo) y cortaba "yo". Se busca sin la primera de la pareja y el indice
  // se devuelve en la lista original.
  const validas = palabrasValidas(palabrasAsr);
  const quitar = new Set();
  for (let i = 0; i + 1 < validas.length; i++) {
    if (repeticionTolerada(validas, i)) {
      quitar.add(i); // la primera de la pareja; la segunda se queda
      i++;
    }
  }
  if (quitar.size) {
    const mapa = validas.map((_, i) => i).filter((i) => !quitar.has(i));
    const r = decidirColaHablada(linea, mapa.map((i) => validas[i]), { idioma });
    return { ...r, indiceUltima: r.indiceUltima >= 0 ? mapa[r.indiceUltima] : -1 };
  }
  const asr = validas;
  const guionOriginal = palabrasDe(linea);
  const todasA = partesComparables(
    asr.map((w) => w.text),
    idioma
  );
  const { g, a } = unirPegadas(fichasComparables(guionOriginal, idioma), fichasDePartes(todasA));
  const asrC = a.map((f) => ({ text: f.t, start: asr[f.k].start, end: asr[f.kf].end }));
  const cola = decidirCola(g.map((f) => f.t).join(' '), asrC);
  const jC = cola.ultimaPalabra ? asrC.findIndex((w) => w.end === cola.ultimaPalabra.fin && w.text === cola.ultimaPalabra.oida) : -1;

  // decidirCola (la de UGC) sobre las palabras tal cual, sin cifras ni
  // simbolos (era lo que se usaba hasta ahora): si ella corta y la comparacion
  // no se decide, se queda la suya. Con cifras no: ahi corta antes de tiempo
  // (toma "2x1" por "dos" y deja fuera "por uno").
  if (cola.decision === 'sin-decidir' && !conCifrasOSimbolos(linea) && !asr.some((w) => conCifrasOSimbolos(w.text))) {
    const tal = decidirCola(linea, asr);
    if (tal.decision === 'cortar') {
      const u = tal.ultimaPalabra;
      return { ...tal, indiceUltima: asr.findIndex((w) => w.end === u.fin && String(w.text) === u.oida) };
    }
  }

  // Los textos de decidirCola (motivo y avisos) nombran las fichas ("befem",
  // "cuarenta nueve noventa"): se cambian por las palabras originales.
  const cuantas = (texto) => texto.split(' ').filter(Boolean).length;
  const finalDelGuion = (n) => (n > 0 && n <= g.length ? guionOriginal.slice(g[g.length - n].k).join(' ') : '');
  const delAsr = (desde, hasta) => (desde <= hasta ? asr.slice(a[desde].k, a[hasta].kf + 1).map((w) => w.text).join(' ') : '');
  const enOriginal = (texto) =>
    String(texto ?? '')
      .replace(/las ultimas \d+ palabras del guion \("([^"]*)"\)/, (_, f) => {
        const original = finalDelGuion(cuantas(f));
        return `las ultimas ${palabrasDe(original).length} palabras del guion ("${original}")`;
      })
      .replace(/el final del guion \("([^"]*)"\)/, (_, f) => `el final del guion ("${finalDelGuion(cuantas(f))}")`)
      .replace(/se toma como tal "([^"]*)"/, (todo, t) => (jC >= 0 ? `se toma como tal "${delAsr(jC - cuantas(t) + 1, jC)}"` : todo));
  const base = {
    decision: cola.decision,
    fin: null,
    sobrantes: [],
    transcripcion: asr.map((w) => w.text).join(' '),
    ultimaPalabra: null,
    calidad: cola.calidad,
    avisos: cola.avisos.map(enOriginal),
    motivo: enOriginal(cola.motivo),
    indiceUltima: -1,
  };
  if (jC < 0) return base;
  let k = a[jC].kf;
  // La moneda o el por ciento dichos pegados a la ultima palabra (no quedaron
  // en la comparacion) son parte de ella, si no hay una pausa clara; si el
  // guion los escribe al final ("29 soles."), aunque la haya.
  const cuentan = new Set(a.flatMap((f) => Array.from({ length: f.kf - f.k + 1 }, (_, i) => f.k + i)));
  const soloUnidad = (j) => todasA.filter((p) => p.k === j).every((p) => p.tipo === 'unidad' && p.fuera);
  const escritas = unidadesAlFinal(guionOriginal, idioma);
  for (let extra = 0; k + 1 < asr.length && !cuentan.has(k + 1) && soloUnidad(k + 1); extra++) {
    if (extra >= escritas && asr[k + 1].start - asr[k].end >= PAUSA_CLARA_S) break;
    k++;
  }

  const ultima = asr[k];
  const resto = asr.slice(k + 1);
  const ultimaPalabra = { guion: guionOriginal[guionOriginal.length - 1], oida: ultima.text, fin: ultima.end };
  const s2 = (x) => `${x.toFixed(2)}s`;
  if (!resto.length) {
    return {
      ...base,
      decision: 'nada',
      ultimaPalabra,
      indiceUltima: k,
      motivo: `el bloque termina con la ultima palabra del guion ("${ultima.text}", ${s2(ultima.end)}): no hay cola que cortar`,
    };
  }
  const sobrantes = resto.map((w) => ({ texto: w.text, inicio: w.start, fin: w.end }));
  const dicho = resto.map((w) => w.text).join(' ');
  const pausa = Math.max(0, resto[0].start - ultima.end);
  if (cola.decision === 'sin-decidir') {
    return {
      ...base,
      ultimaPalabra,
      sobrantes,
      indiceUltima: k,
      motivo:
        `despues de "${ultima.text}" (${s2(ultima.end)}) Scribe oyo "${dicho}" pegado (pausa de ${s2(pausa)}) y no repite el guion: ` +
        'puede ser el mismo final mal transcrito. No se corta nada: escucha el final del bloque',
    };
  }
  // 'cortar' (o 'nada' en la comparacion pero con una moneda suelta despues
  // de una pausa clara: tambien se corta).
  const repite = cola.decision === 'cortar' && /\) repite: "/.test(cola.motivo);
  const fin = Number((ultima.end + Math.min(MARGEN_COLA_S, pausa / 2)).toFixed(3));
  return {
    ...base,
    decision: 'cortar',
    fin,
    ultimaPalabra,
    sobrantes,
    indiceUltima: k,
    motivo:
      `despues de la ultima palabra del guion ("${ultima.text}", termina en ${s2(ultima.end)}) ` +
      `${repite ? 'repite' : 'sigue hablando'}: "${dicho}" (${s2(resto[0].start)}-${s2(resto[resto.length - 1].end)}). ` +
      `El bloque termina en ${s2(fin)}`,
  };
}

/**
 * Muletillas e interjecciones que no son palabras: "eh", "eeeh", "ehm", "ahm",
 * "mm", "mhm", "hmm", "uh", "um", "oh", "uf", "uy", "ay". Se mira la palabra ya
 * normalizada. Una vocal sola no entra ("e", "a", "o", "u" son palabras), ni
 * "em" ni "am" (palabras en portugues y en ingles).
 */
const MULETILLA = /^(?:e+h+m*|e{2,}h*m*|e+m{2,}|a+h+m*|a{2,}h*m*|m+h+m*|m{2,}|h+m+|u+h+m*|u+m+|o+h+|u+f+|p+f+|a+y+|u+y+|h+u+y+)$/;
export const esMuletilla = (texto) => MULETILLA.test(normalizar(texto));

/** Palabras que se dicen igual y se escriben de varias formas ("okay" / "OK"). Ya normalizadas. */
const VARIANTES = { okay: 'ok', okey: 'ok', okei: 'ok', oki: 'ok' };

/** Parecido entre dos textos ya normalizados, de 0 a 1 (1 - distancia de edicion / el mas largo). */
export function parecido(a, b) {
  const x = String(a);
  const y = String(b);
  if (!x.length && !y.length) return 1;
  let previa = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const fila = [i];
    for (let j = 1; j <= y.length; j++) {
      fila[j] = Math.min(previa[j] + 1, fila[j - 1] + 1, previa[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    previa = fila;
  }
  return 1 - previa[y.length] / Math.max(x.length, y.length);
}

/**
 * Desde este parecido, un nombre del guion (la marca, un nombre propio) y lo
 * que escribio Scribe en su lugar son la misma palabra mal escrita: "Befem" /
 * "Bephem" da 0.67, "Cayenne" / "Cayena" 0.71. Una palabra cambiada de verdad
 * queda muy por debajo ("Pero" / "Para", 0.5).
 */
export const PARECIDO_NOMBRE = 0.6;

/** La palabra k de una lista arranca una frase (la primera, tras un punto, dos puntos o puntos suspensivos, o con ¿ ¡). */
function arrancaFrase(palabras, k) {
  return k === 0 || /[.!?…:;]["'»”)]*$/u.test(String(palabras[k - 1])) || /^[¿¡"«“]/u.test(String(palabras[k]));
}

/** La palabra empieza con mayuscula (sin contar los signos de delante). */
const conMayuscula = (texto) => /^\p{Lu}/u.test(String(texto).replace(/^[^\p{L}\p{N}]+/u, ''));

/**
 * Los nombres que trae un manifiesto, para perdonarle a Scribe que los
 * escriba distinto: la marca de la entrevista (`entrevista.marca`) y las
 * palabras con mayuscula EN MEDIO de una frase en cualquier linea hablada
 * ("unas capsulas, Cayenne Pepper se llaman", "en la pagina de Perustore").
 * Una palabra con mayuscula al principio de una frase no dice nada: ahi
 * cualquier palabra la lleva.
 */
export function nombresDelManifiesto(manifiesto) {
  const nombres = new Set();
  const sinSignos = (p) => p.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  const marca = manifiesto?.entrevista?.marca ?? manifiesto?.marca;
  if (typeof marca === 'string') for (const t of palabrasDe(marca)) if (sinSignos(t)) nombres.add(sinSignos(t));
  for (const t of manifiesto?.tomas || []) {
    if (t?.tipo !== 'H' || typeof t.linea !== 'string') continue;
    const ps = palabrasDe(t.linea);
    ps.forEach((p, k) => {
      if (conMayuscula(p) && !arrancaFrase(ps, k) && sinSignos(p)) nombres.add(sinSignos(p));
    });
  }
  return [...nombres];
}

/**
 * Donde empieza y donde termina el guion dentro del clip, con la misma regla
 * que el recorte de bordes por palabras del montaje (planear-montaje.js,
 * bordesPorPalabras): desde la PRIMERA palabra que se oye hasta la ULTIMA
 * PALABRA DEL GUION, que decide decidirColaHablada() (lo que se oye despues,
 * una repeticion o una muletilla, queda fuera; un guion que termina en cifras,
 * "29 soles", se compara con lo que se dice, "veintinueve soles"). Si no se
 * sabe con seguridad donde termina el guion ('sin-decidir': lo que sigue
 * puede ser el mismo final mal oido), llega hasta la ultima palabra que se
 * oye. FUNCION PURA.
 *
 *   linea        el guion de la toma (`linea` del manifiesto)
 *   palabrasAsr  las del ASR del clip, en segundos del clip y sin recortar
 *   idioma       'es', 'en' o 'pt' (para los numeros en letras)
 *
 * Devuelve { palabras, hasta, inicio, fin, siguiente, decision, motivo } o
 * null si Scribe no oyo nada. `palabras` son las del ASR con letras o cifras
 * (sin la puntuacion suelta); `hasta` es el indice de la ultima que cuenta;
 * `siguiente`, el segundo en que arranca la primera que queda fuera (null si
 * no hay): el corte de cola nunca tiene que llegar a ella.
 */
export function limitesDelGuion(linea, palabrasAsr, { idioma = 'es' } = {}) {
  const palabras = palabrasValidas(palabrasAsr).filter((w) => normalizar(w.text));
  if (!palabras.length) return null;
  // Un "%" suelto ("30 %") se queda: dice que el por ciento se tiene que oir.
  const guion = palabrasDe(linea)
    .filter((t) => normalizar(t) || t.includes('%'))
    .join(' ');
  const cola = decidirColaHablada(guion, palabras, { idioma });
  let hasta = palabras.length - 1;
  if ((cola.decision === 'cortar' || cola.decision === 'nada') && cola.indiceUltima >= 0) hasta = cola.indiceUltima;
  return {
    palabras,
    hasta,
    inicio: palabras[0].start,
    fin: palabras[hasta].end,
    siguiente: hasta + 1 < palabras.length ? palabras[hasta + 1].start : null,
    decision: cola.decision,
    motivo: cola.motivo,
  };
}

/**
 * Repeticion TOLERADA (2026-10-14, aprobada de oido). Una repeticion NO
 * marca NO ESTA LIMPIO solo si cumple las tres cosas a la vez:
 *
 *   letras    la palabra repetida tiene UNA sola letra ("a", "y", "e", "o",
 *             "u"), sin contar tildes, mayusculas ni puntuacion ("A," = "a")
 *   totalSeg  las dos veces juntas duran MENOS de 0,2 s, desde el inicio de la
 *             primera hasta el fin de la segunda
 *   pausaSeg  la pausa entre las dos es MENOR a 0,15 s
 *
 * Por que: Cayenne, toma 3 ("...no me llegaba bien a las piernas"): Omni dijo
 * "a," 8.46-8.50 y "a" 8.60-8.64 (0,18 s en total, 0,10 s de pausa). Se
 * escucho en el anuncio aprobado y no se nota: un tropiezo de una letra asi de
 * corto no justifica regenerar el clip. Todo lo demas sigue siendo NO LIMPIO
 * = regenerar: una palabra de 2 letras o mas ("en, en la etiqueta"), una frase
 * repetida ("la abres, la abres", "frente a la, frente a la refri"), una
 * trabada ("con ham- con hambre"), una muletilla ("Ahm, este"), una palabra
 * agregada o cambiada, y una letra repetida pero lenta (0,3 s) o con pausa
 * (0,2 s). Tampoco "a, a, a": eso no es UNA repeticion.
 *
 * Una tolerada SIEMPRE se informa, nunca pasa callada: va en
 * revision.toleradas y en la entrada de lineas-habladas.json, y la tabla, el
 * resumen de `npm run lineas`, --solo-plan y el plan la muestran con su
 * segundo (describirTolerada): "revisa a oido si quieres".
 */
export const TOLERANCIA_REPETICION = Object.freeze({ letras: 1, totalSeg: 0.2, pausaSeg: 0.15, cuales: /^[aeouy]$/ });

/**
 * Si la palabra de mas oidas[k] (una "repetida" de la revision) es una
 * repeticion tolerada (TOLERANCIA_REPETICION). Las dos veces tienen que ser
 * vecinas en lo oido y ser SOLO dos (una tercera igual al lado: no). Los
 * segundos se comparan redondeados al milisegundo, como los da Scribe, para
 * que un 0,2 justo no pase por un error de coma flotante. Devuelve
 * { texto, inicio, fin } con las dos veces ("a, a", del inicio de la primera
 * al fin de la segunda), o null.
 */
function repeticionTolerada(oidas, k, tol = TOLERANCIA_REPETICION) {
  const letrasDe = (i) => normalizar(oidas[i]?.text ?? '');
  const t = letrasDe(k);
  // Solo las cinco aprobadas (a, e, o, u, y; con tilde o mayuscula da
  // igual porque `normalizar` ya las quito): una consonante repetida ("C, C",
  // "B, B") o la "I" del ingles no se toleran.
  if (!t || t.length > tol.letras || !(tol.cuales ?? /^[a-zñ]$/).test(t)) return null;
  let desde = k;
  let hasta = k;
  while (desde > 0 && letrasDe(desde - 1) === t) desde--;
  while (hasta + 1 < oidas.length && letrasDe(hasta + 1) === t) hasta++;
  if (hasta - desde !== 1) return null;
  const a = oidas[desde];
  const b = oidas[hasta];
  if (![a.start, a.end, b.start, b.end].every(Number.isFinite)) return null;
  if (!(r3(b.end - a.start) < tol.totalSeg) || !(r3(b.start - a.end) < tol.pausaSeg)) return null;
  return { texto: `${a.text} ${b.text}`, inicio: a.start, fin: b.end };
}

/**
 * Una repeticion tolerada en una linea, con lo que dura y su segundo:
 * 'tolerada (repeticion de una letra, 0.18 s): "a, a" (8.46s): revisa a oido si quieres'.
 */
export function describirTolerada(x) {
  const dura = Number.isFinite(x?.fin - x?.inicio) ? `${(x.fin - x.inicio).toFixed(2)} s` : '? s';
  const en = Number.isFinite(x?.inicio) ? ` (${s(x.inicio)})` : '';
  return `tolerada (repeticion de una letra, ${dura}): "${x?.texto ?? ''}"${en}: revisa a oido si quieres`;
}

/** Las toleradas de una revision o de una entrada guardada ([] si no trae). */
export const toleradasDe = (x) => (Array.isArray(x?.toleradas) ? x.toleradas : []);

/**
 * Revisa si un clip hablado dijo el guion LIMPIO. FUNCION PURA.
 *
 *   linea        el guion de la toma (`linea` del manifiesto)
 *   palabrasAsr  lo que devuelve transcribir(): [{ text, start, end }, ...]
 *   idioma       'es', 'en' o 'pt' (para los numeros en letras)
 *   marcas       nombres del producto que Scribe puede escribir mal
 *
 * Devuelve { limpio, calidad, agregadas, toleradas, omitidas, escritura,
 * despues, motivo, avisos }:
 *
 *   agregadas  lo que se oyo y no es el guion, por tramos seguidos:
 *              { texto, inicio, fin, tipo } con tipo
 *                "repetida"   dice otra vez palabras del guion ("la abres, la abres")
 *                "trabada"    un pedazo de palabra o un arranque cortado ("con ham- con hambre")
 *                "muletilla"  un sonido de duda que el guion no tiene ("Mhm", "Ahm")
 *                "agregada"   cualquier otra palabra que no esta en el guion
 *                "cambiada"   dijo otra cosa donde el guion decia `en_lugar_de`
 *   toleradas  las repetidas de UNA letra, cortas y sin pausa
 *              (TOLERANCIA_REPETICION): { texto, inicio, fin } con las dos
 *              veces. No estan en agregadas ni cuentan para `limpio`, pero se
 *              informan siempre
 *   omitidas   palabras del guion que no se dijeron
 *   escritura  las diferencias que NO cuentan, para mostrarlas: [{ guion, oido }]
 *   despues    lo que se oye despues de la ultima palabra del guion (no cuenta)
 *   motivo     por que no esta limpio cuando no se puede ni comparar
 *
 * COMO. Se alinea el guion contra lo que se oye (alinear(), la misma de los
 * subtitulos) palabra por palabra como se DICEN (partesComparables: los
 * numeros en letras, sin simbolos de precio ni de porcentaje, sin la moneda
 * pegada a un numero ni los conectores entre dos numeros), y se miran los
 * huecos entre dos palabras con pareja: lo que el guion tiene ahi y lo que
 * se oyo ahi. Un hueco con las mismas letras, sola o pegada a la palabra
 * vecina, es una diferencia de escritura ("superbien" contra "super bien");
 * una muletilla del guion contra otra muletilla, tambien; un nombre contra
 * algo muy parecido (PARECIDO_NOMBRE), tambien. Lo demas cuenta. Y una
 * pareja que la alineacion dio por "parecida" sin ser la misma palabra
 * ("abre" por "abres") es una palabra cambiada, salvo que sea un nombre, una
 * muletilla o un numero escrito con cifras ("1" / "un"). Los textos y los
 * tiempos que devuelve son los de las palabras ORIGINALES.
 *
 * Una muletilla del GUION que no se oye no cuenta: Scribe a veces no las
 * escribe (se avisa). Un numero dicho a medias ("S/ 49.90" oido "cuarenta y
 * nueve") no es escritura: va a omitidas y no se muestra como escritura. Un
 * "%" escrito se tiene que oir ("por ciento", "percent", "por cento"): si no,
 * va a omitidas como "por ciento (30%)".
 */
export function revisarHabla(linea, palabrasAsr, opciones = {}) {
  return revisarHablaPorPalabra(linea, palabrasAsr, opciones).revision;
}

/**
 * revisarHabla, y ademas que fue de cada palabra del guion (para que
 * medirToma no cuente como "faltan" lo que es solo escritura). Devuelve {
 * revision, guion, escritura, sinContar, unidades, malDichas }: `guion` son
 * las palabras del guion con letras o cifras (palabrasDe sin las que
 * normalizar deja vacias) y los otros, conjuntos de indices de `guion`:
 *   escritura  las que se dijeron escritas distinto (cifras, pegadas, la
 *              marca), sin las malDichas ni las unidades
 *   sinContar  muletillas del guion que no se oyen (no cuentan)
 *   unidades   la moneda o el por ciento ESCRITOS (tambien un "%") que no se
 *              oyeron, o se oyeron cambiados ("29 soles" dicho "veintinueve
 *              dolares"); el "%" en la palabra que lo lleva ("30%")
 *   malDichas  las que no se dijeron o se dijeron cambiadas, aunque sea en
 *              parte (un numero dicho a medias): las de omitidas y las de
 *              en_lugar_de
 */
function revisarHablaPorPalabra(linea, palabrasAsr, { idioma = 'es', marcas = [] } = {}) {
  const porPalabra = { escritura: new Set(), sinContar: new Set(), unidades: new Set(), malDichas: new Set() };
  const deMarcas = new Set(
    (Array.isArray(marcas) ? marcas : [marcas])
      .flatMap((m) => palabrasDe(m))
      .map((t) => normalizar(t))
      .filter(Boolean)
  );
  const guion = palabrasDe(linea).filter((t) => normalizar(t));
  // Las palabras del guion como se dicen; k = la palabra original de `guion`.
  const todasG = partesComparables(guion, idioma);
  const pg = todasG.filter((p) => !p.fuera);
  // Un nombre: una de las marcas, o con mayuscula en medio de una frase.
  const nombreDe = guion.map((t, k) => deMarcas.has(normalizar(t)) || (conMayuscula(t) && !arrancaFrase(guion, k)));
  const conCifras = (t) => /\d/.test(String(t));
  const unicas = (ks) => [...new Set(ks)].sort((x, y) => x - y);
  const r = { limpio: false, calidad: 0, agregadas: [], toleradas: [], omitidas: [], escritura: [], despues: '', motivo: '', avisos: [] };
  if (!pg.length) {
    r.motivo = 'la toma no tiene linea en el manifiesto: no hay contra que comparar';
    return { revision: r, guion, ...porPalabra };
  }
  const lim = limitesDelGuion(linea, palabrasAsr, { idioma });
  if (!lim) {
    r.motivo = 'Scribe no oyo ninguna palabra en el clip';
    r.omitidas = unicas(pg.map((p) => p.k)).map((k) => guion[k]);
    return { revision: r, guion, ...porPalabra };
  }
  const oidas = lim.palabras.slice(0, lim.hasta + 1);
  r.despues = lim.palabras
    .slice(lim.hasta + 1)
    .map((w) => w.text)
    .join(' ');
  const todasA = partesComparables(
    oidas.map((w) => w.text),
    idioma
  );
  const pa = todasA.filter((p) => !p.fuera);
  const G = pg.map((p) => p.t);
  const A = pa.map((p) => p.t);
  const { pares, calidad } = alinear(G, A);
  r.calidad = r3(calidad);
  if (calidad < UMBRAL_ALINEACION) {
    r.motivo =
      `no dice el guion: solo ${pct(calidad)} de sus palabras encontraron pareja (hace falta ${pct(UMBRAL_ALINEACION)}). ` +
      'Escucha el clip entero';
    return { revision: r, guion, ...porPalabra };
  }

  // Del indice de una parte comparable a la palabra original (del guion o de lo oido).
  const og = (i) => guion[pg[i].k];
  const oa = (j) => oidas[pa[j].k].text;
  const textoG = (is) => unicas(is.map((i) => pg[i].k)).map((k) => guion[k]).join(' ');
  const textoA = (js) => unicas(js.map((j) => pa[j].k)).map((k) => oidas[k].text).join(' ');
  const tramoA = (js) => {
    const ks = unicas(js.map((j) => pa[j].k));
    return { texto: ks.map((k) => oidas[k].text).join(' '), inicio: oidas[ks[0]].start, fin: oidas[ks[ks.length - 1]].end };
  };
  const nombre = pg.map((p) => nombreDe[p.k]);
  // Lo que es solo escritura, por palabras originales; al final se juntan las
  // que comparten palabra ("49.90" contra "cuarenta y nueve noventa" sale una vez).
  const escritura = [];
  const anotar = (is, js) => escritura.push({ g: unicas(is.map((i) => pg[i].k)), w: unicas(js.map((j) => pa[j].k)) });

  const rango = (desde, hasta) => Array.from({ length: Math.max(0, hasta - desde) }, (_, k) => desde + k);
  // Lo de mas, pegado, contra el guion de al lado: 'entera' si son las mismas
  // palabras enteras que el guion dice justo antes (terminaEnG, hasta la
  // palabra i) o justo despues (empiezaEnG, desde la palabra i): una
  // repeticion. 'cortada' si es el principio de esas palabras pero se corta a
  // mitad ("conham" contra "con hambre"): un arranque trabado. Con una sola
  // letra no se decide "cortada": cualquier palabra empieza con una letra.
  const terminaEnG = (i, texto) => {
    let acum = '';
    let cortada = false;
    for (let k = i; k >= 0 && acum.length <= texto.length + 20; k--) {
      acum = G[k] + acum;
      if (acum === texto) return 'entera';
      if (texto.length >= 2 && acum.length > texto.length && acum.startsWith(texto)) cortada = true;
    }
    return cortada ? 'cortada' : null;
  };
  const empiezaEnG = (i, texto) => {
    let acum = '';
    for (let k = i; k < G.length; k++) {
      acum += G[k];
      if (acum === texto) return 'entera';
      if (acum.length > texto.length) return texto.length >= 2 && acum.startsWith(texto) ? 'cortada' : null;
    }
    return null;
  };

  const anclas = [{ i: -1, j: -1 }];
  pares.forEach((j, i) => {
    if (j !== null) anclas.push({ i, j });
  });
  anclas.push({ i: G.length, j: A.length });
  // Parejas "parecidas" que ya explica un hueco vecino ("super" con
  // "superbien": la otra mitad, "bien", esta en el hueco de al lado).
  const explicadas = new Set();

  for (let k = 0; k + 1 < anclas.length; k++) {
    const a = anclas[k];
    const b = anclas[k + 1];
    const gs = rango(a.i + 1, b.i);
    const ws = rango(a.j + 1, b.j);
    if (!gs.length && !ws.length) continue;
    const cG = gs.map((i) => G[i]).join('');
    const cW = ws.map((j) => A[j]).join('');
    const hayA = a.i >= 0;
    const hayB = b.i < G.length;

    // 1. Las mismas letras, solas o pegadas a la palabra vecina: palabras
    //    pegadas o separadas distinto ("superbien" / "super bien").
    const pruebas = [{ g: gs, w: ws, x: cG, y: cW, usa: [] }];
    if (hayA) pruebas.push({ g: [a.i, ...gs], w: [a.j, ...ws], x: G[a.i] + cG, y: A[a.j] + cW, usa: [a.i] });
    if (hayB) pruebas.push({ g: [...gs, b.i], w: [...ws, b.j], x: cG + G[b.i], y: cW + A[b.j], usa: [b.i] });
    if (hayA && hayB) {
      pruebas.push({ g: [a.i, ...gs, b.i], w: [a.j, ...ws, b.j], x: G[a.i] + cG + G[b.i], y: A[a.j] + cW + A[b.j], usa: [a.i, b.i] });
    }
    const pegada = pruebas.find((p) => p.x && p.x === p.y);
    if (pegada) {
      for (const i of pegada.usa) explicadas.add(i);
      anotar(pegada.g, pegada.w);
      continue;
    }
    // 2. Una muletilla del guion escrita de otra forma ("Eh..." / "Eeeh,").
    if (gs.length && ws.length && gs.every((i) => MULETILLA.test(G[i])) && ws.every((j) => MULETILLA.test(A[j]))) {
      anotar(gs, ws);
      continue;
    }
    // 3. La marca o un nombre mal escrito por Scribe ("Befem" / "Bephem"), o
    //    un numero escrito de otra forma ("21" / "veintiun").
    if (gs.length && ws.length && (gs.some((i) => nombre[i]) || [...gs.map(og), ...ws.map(oa)].some(conCifras)) && parecido(cG, cW) >= PARECIDO_NOMBRE) {
      anotar(gs, ws);
      continue;
    }
    // 4. Una muletilla del guion que no se oye: no cuenta.
    if (gs.length && !ws.length && gs.every((i) => MULETILLA.test(G[i]))) {
      for (const i of gs) porPalabra.sinContar.add(pg[i].k);
      r.avisos.push(`no se oye la muletilla del guion "${textoG(gs)}" (Scribe a veces no las escribe): no cuenta`);
      continue;
    }
    // 5. Palabras del guion que no se dijeron (tambien la parte que falta de
    //    un numero dicho a medias: "49.90" oido "cuarenta y nueve").
    if (!ws.length) {
      for (const i of gs) porPalabra.malDichas.add(pg[i].k);
      r.omitidas.push(...unicas(gs.map((i) => pg[i].k)).map((kk) => guion[kk]));
      continue;
    }
    const tramo = tramoA(ws);
    // 6. Dijo otra cosa en lugar de lo que decia el guion.
    if (gs.length) {
      for (const i of gs) porPalabra.malDichas.add(pg[i].k);
      r.agregadas.push({ ...tramo, tipo: 'cambiada', en_lugar_de: textoG(gs) });
      continue;
    }
    // 7. Palabras de mas: que son. Una palabra cortada con guion ("ham-", con
    //    guion, guion largo o raya) o el principio de lo que sigue sin
    //    terminar es un tropiezo; las mismas palabras enteras otra vez, una
    //    repeticion.
    const conGuionCortado = ws.some((j) => /[-‐-—]$/.test(String(oa(j)).trim()));
    // Un pedazo (de 2 letras o mas) del principio de la palabra vecina del
    // guion, suelto o pegado con guion a otra ("ham-con" antes de "hambre").
    const vecinas = [hayA ? G[a.i] : '', hayB ? G[b.i] : ''].filter(Boolean);
    const pedazos = unicas(ws.map((j) => pa[j].k))
      .flatMap((kk) => String(oidas[kk].text).split(/[-‐-—\s]+/))
      .map((p) => normalizar(p));
    const pedazoDeVecina = pedazos.some((p) => p.length >= 2 && vecinas.some((v) => v.length > p.length && v.startsWith(p)));
    const antes = hayA ? terminaEnG(a.i, cW) : null;
    const despues = hayB ? empiezaEnG(b.i, cW) : null;
    let tipo = 'agregada';
    if (conGuionCortado || pedazoDeVecina || antes === 'cortada' || despues === 'cortada') tipo = 'trabada';
    else if (antes === 'entera' || despues === 'entera') tipo = 'repetida';
    else if (ws.every((j) => MULETILLA.test(A[j]))) tipo = 'muletilla';
    // 8. La unica repeticion que se tolera: una palabra de UNA letra dicha
    //    dos veces, rapido y sin pausa (TOLERANCIA_REPETICION, aprobada de
    //    oido). No cuenta para `limpio`, pero se informa siempre.
    if (tipo === 'repetida') {
      const ks = unicas(ws.map((j) => pa[j].k));
      const tolerada = ks.length === 1 ? repeticionTolerada(oidas, ks[0]) : null;
      if (tolerada) {
        r.toleradas.push(tolerada);
        continue;
      }
    }
    r.agregadas.push({ ...tramo, tipo });
  }

  // Parejas "parecidas" (la alineacion las junto por el principio) que no son
  // la misma palabra ni las explica un hueco vecino.
  for (const { i, j } of anclas.slice(1, -1)) {
    // La misma palabra dicha, escrita distinto: un numero ("11" / "once").
    if (G[i] === A[j] && normalizar(og(i)) !== normalizar(oa(j))) {
      anotar([i], [j]);
      continue;
    }
    if (G[i] === A[j] || explicadas.has(i)) continue;
    if (MULETILLA.test(G[i]) && MULETILLA.test(A[j])) {
      anotar([i], [j]);
      continue;
    }
    // Un numero ("1" por "un") o un nombre parecido: escritura.
    if (conCifras(og(i)) || conCifras(oa(j)) || (nombre[i] && parecido(G[i], A[j]) >= PARECIDO_NOMBRE)) {
      anotar([i], [j]);
      continue;
    }
    porPalabra.malDichas.add(pg[i].k);
    r.agregadas.push({ ...tramoA([j]), tipo: 'cambiada', en_lugar_de: og(i) });
  }

  // La moneda y el por ciento pegados a un numero no entran en la alineacion
  // (se dicen o no segun como se escriba el precio: "$29" / "veintinueve
  // dolares"), pero si el guion los ESCRIBE con palabras ("29 soles", "30 por
  // ciento") tienen que oirse: otra moneda es una palabra cambiada y ninguna,
  // una omitida. En lo oido, un simbolo ("$29", "30%") vale por su moneda o
  // su por ciento: es como Scribe lo escribio.
  //
  // Un "%" escrito tambien se tiene que oir (2026-10-14, decision del sistema):
  // "ahorra 30" no es "ahorra 30 %". Se busca como un "por ciento" escrito; si
  // no se oye, va a omitidas como "por ciento (30%)". La moneda escrita con
  // simbolo ("$29", "S/ 49.90") no: se puede decir "veintinueve" a secas.
  const unidadesDe = (partes) => {
    const lista = [];
    partes.forEach((p, i) => {
      if (p.tipo !== 'unidad' || !p.fuera) return;
      // "por ciento" son dos partes y un solo por ciento.
      if (i > 0 && partes[i - 1].fuera && esPorCiento(partes[i - 1].t, p.t)) return;
      lista.push({ clave: claveDeUnidad(p.t), k: p.k });
    });
    return lista;
  };
  const enGuion = unidadesDe(todasG);
  // Los "%" del guion, en la palabra que los lleva ("30%") o, si van sueltos
  // ("30 %": normalizar los deja fuera de `guion`), en la de antes.
  {
    let k = -1;
    for (const t of palabrasDe(linea)) {
      if (normalizar(t)) k++;
      for (let n = (t.match(/%/g) || []).length; n > 0; n--) {
        const kk = Math.max(0, k);
        const escrito = (normalizar(t) ? t : `${guion[kk] ?? ''} ${t}`).trim().replace(/[.,;:!?…"'»”)\]]+$/u, '');
        enGuion.push({ clave: 'porciento', k: kk, texto: `${POR_CIENTO[idioma] || POR_CIENTO.es} (${escrito})` });
      }
    }
  }
  if (enGuion.length) {
    const oidasU = unidadesDe(todasA);
    let porcientos = 0;
    let monedas = 0;
    // Los simbolos que escribio Scribe, hasta la ultima palabra del guion
    // (tambien un "%" suelto, que palabrasValidas deja pero normalizar no).
    for (const w of palabrasValidas(palabrasAsr)) {
      if (lim.siguiente !== null && w.start >= lim.siguiente) continue;
      const t = String(w.text);
      porcientos += (t.match(/%/g) || []).length;
      monedas += (t.replace(/%/g, '').match(SIMBOLOS_PRECIO) || []).length;
    }
    // "por ciento" se nombra entero; un "%", como "por ciento (30%)".
    const textoU = (u) =>
      u.texto ?? (esPorCiento(normalizar(guion[u.k]), normalizar(guion[u.k + 1] ?? '')) ? `${guion[u.k]} ${guion[u.k + 1]}` : guion[u.k]);
    const faltan = [];
    for (const u of enGuion) {
      const i = oidasU.findIndex((x) => x.clave === u.clave);
      if (i >= 0) oidasU.splice(i, 1);
      else if (u.clave === 'porciento' && porcientos > 0) porcientos--;
      else if (u.clave !== 'porciento' && monedas > 0) monedas--;
      else faltan.push(u);
    }
    for (const u of faltan) {
      // "por ciento" son dos palabras del guion.
      porPalabra.unidades.add(u.k);
      if (!u.texto && esPorCiento(normalizar(guion[u.k]), normalizar(guion[u.k + 1] ?? ''))) porPalabra.unidades.add(u.k + 1);
      const i = oidasU.findIndex((x) => (x.clave === 'porciento') === (u.clave === 'porciento'));
      if (i >= 0) {
        const [x] = oidasU.splice(i, 1);
        r.agregadas.push({ texto: oidas[x.k].text, inicio: oidas[x.k].start, fin: oidas[x.k].end, tipo: 'cambiada', en_lugar_de: textoU(u) });
      } else r.omitidas.push(textoU(u));
    }
  }

  // Una palabra original partida en varias ("49.90": cuarenta, nueve, noventa)
  // no se cuenta dos veces.
  const vistas = new Set();
  r.agregadas = r.agregadas
    .filter((x) => {
      const clave = `${x.tipo}|${x.texto}|${x.inicio}`;
      if (vistas.has(clave)) return false;
      vistas.add(clave);
      return true;
    })
    .sort((x, y) => x.inicio - y.inicio);
  r.toleradas = r.toleradas.filter((x, i, todas) => todas.findIndex((y) => y.inicio === x.inicio) === i).sort((x, y) => x.inicio - y.inicio);
  r.omitidas = [...new Set(r.omitidas)];
  // Una palabra que no se dijo, o se dijo cambiada, aunque una parte si se
  // dijera (un numero dicho a medias: "49.90" oido "cuarenta y nueve"; "30%"
  // sin el por ciento), no es solo escritura: ni se muestra ahi ni se perdona
  // en `faltan` (antes salia "dijo todo el guion" junto a "no dijo 49.90").
  const noSeDijo = new Set([...porPalabra.malDichas, ...porPalabra.unidades]);
  const deEscritura = escritura.filter((e) => !e.g.some((k) => noSeDijo.has(k)));
  // Lo que es solo escritura: juntas las que comparten una palabra original,
  // y con las palabras de en medio ("cuarenta y nueve noventa", con la "y").
  const juntas = [];
  for (const e of deEscritura.sort((x, y) => (x.g[0] ?? -1) - (y.g[0] ?? -1))) {
    const previa = juntas.find((p) => e.g.some((k) => p.g.includes(k)) || e.w.some((k) => p.w.includes(k)));
    if (previa) {
      previa.g = unicas([...previa.g, ...e.g]);
      previa.w = unicas([...previa.w, ...e.w]);
    } else juntas.push({ g: [...e.g], w: [...e.w] });
  }
  // Lo oido, con la moneda o el por ciento que se dijo detras si el guion
  // escribio un simbolo ("$29" = "veintinueve dolares").
  const soloFuera = (k) => todasA.some((p) => p.k === k) && todasA.filter((p) => p.k === k).every((p) => p.fuera);
  const tramoDe = (ks, lista, texto, extender) => {
    if (!ks.length) return '';
    let hasta = ks[ks.length - 1];
    while (extender && hasta + 1 < lista.length && soloFuera(hasta + 1)) hasta++;
    return lista.slice(ks[0], hasta + 1).map(texto).join(' ');
  };
  r.escritura = juntas.map((e) => {
    const g = tramoDe(e.g, guion, (t) => t, false);
    return { guion: g, oido: tramoDe(e.w, oidas, (w) => w.text, SIMBOLO_PRECIO.test(g)) };
  });
  r.limpio = r.agregadas.length === 0 && r.omitidas.length === 0;
  for (const e of deEscritura) for (const k of e.g) porPalabra.escritura.add(k);
  return { revision: r, guion, ...porPalabra };
}

/** Que tiene un clip que no esta limpio, en una linea ("repitio "la abres" (3.20s); ..."). */
export function describirRevision(rev) {
  if (rev.motivo) return rev.motivo;
  const partes = rev.agregadas.map((x) => {
    const en = `(${s(x.inicio)})`;
    if (x.tipo === 'repetida') return `repitio "${x.texto}" ${en}`;
    if (x.tipo === 'trabada') return `se trabo: "${x.texto}" ${en}`;
    if (x.tipo === 'muletilla') return `agrego la muletilla "${x.texto}" ${en}`;
    if (x.tipo === 'cambiada') return `dijo "${x.texto}" en vez de "${x.en_lugar_de}" ${en}`;
    return `agrego "${x.texto}" ${en}`;
  });
  if (rev.omitidas.length) partes.push(`no dijo "${rev.omitidas.join(' ')}"`);
  return partes.join('; ');
}

/**
 * Las palabras del guion que faltan en lo oido (las de `correctas`, en su
 * orden), comparando como se DICE: guion y oido en fichas (fichasComparables
 * + unirPegadas) y alineados. Una palabra falta si alguna de sus fichas no
 * encontro pareja, salvo que la revision la diera por solo escritura o por
 * una muletilla del guion que no se oye. Y falta, aunque sus fichas
 * encontraran pareja, si la revision dice que no se dijo o se dijo cambiada
 * (malDichas: un numero dicho a medias, "49.90" oido "cuarenta y nueve"; o
 * "abre" dicho "abres"): asi una toma no sale "dijo todo el guion" al lado
 * de "no dijo". La moneda o el por ciento escritos ("29 soles", "30%") faltan
 * si la revision dice que no se oyeron (o se oyeron cambiados). Un simbolo
 * suelto ("S/", "—") no falta.
 *
 *   porPalabra  lo que devolvio revisarHablaPorPalabra (indices de su `guion`)
 */
function palabrasQueFaltan(correctas, utiles, porPalabra, idioma) {
  // `guion` de la revision = las palabras de `correctas` con letras o cifras.
  const conTexto = correctas.map((t, i) => i).filter((i) => normalizar(correctas[i]));
  const { g, a } = unirPegadas(
    fichasComparables(
      conTexto.map((i) => correctas[i]),
      idioma
    ),
    fichasComparables(
      utiles.map((w) => w.text),
      idioma
    )
  );
  const { pares } = alinear(
    g.map((f) => f.t),
    a.map((f) => f.t)
  );
  const fichas = conTexto.map(() => 0);
  const conPareja = conTexto.map(() => 0);
  g.forEach((f, i) => {
    for (let k = f.k; k <= f.kf; k++) {
      fichas[k]++;
      if (pares[i] !== null) conPareja[k]++;
    }
  });
  return conTexto
    .filter((_, k) => {
      if (porPalabra.unidades.has(k) || porPalabra.malDichas?.has(k)) return true;
      if (porPalabra.escritura.has(k) || porPalabra.sinContar.has(k)) return false;
      if (!fichas[k]) return false;
      return conPareja[k] < fichas[k];
    })
    .map((i) => correctas[i]);
}

/**
 * El aire que el montaje del podcast deja despues de la ultima palabra de
 * cada linea antes de cortar el clip (planear-montaje.js, planearPodcast:
 * REGLAS_HABLADO.podcast.margenSeg). Aca no se importa: el plan importa este
 * modulo. Si el plan cambia el suyo, lo pasa en `margenSegmento`.
 */
export const MARGEN_SEGMENTO_S = 0.3;

/**
 * Los tramos de un clip con varias lineas (podcast) que el montaje deja
 * FUERA. Entre dos lineas seguidas del clip, el segmento de la primera
 * termina `margenSegmento` despues de su ultima palabra (o en la mitad de la
 * pausa, si es corta) y el de la siguiente empieza en la mitad de la pausa:
 * lo que cae entre esos dos puntos no se oye en el anuncio. Es la regla de
 * los segmentos de planearPodcast (planear-montaje.js), con sus mismos
 * redondeos. Con una pausa de menos de dos margenes no se corta nada. FUNCION
 * PURA.
 *
 *   lineas  [{ orden, inicio, fin }] en segundos del clip (las de
 *           ubicarLineas; las que no tienen tiempos no entran al montaje)
 *
 * Devuelve [{ desde, hasta, entre: [orden, orden] }], en orden.
 */
export function huecosQueCortaElMontaje(lineas, margenSegmento = MARGEN_SEGMENTO_S) {
  const medidas = (Array.isArray(lineas) ? lineas : [])
    .filter((l) => l && Number.isFinite(l.inicio) && Number.isFinite(l.fin) && l.fin > l.inicio)
    .sort((a, b) => a.inicio - b.inicio);
  const huecos = [];
  for (let k = 0; k + 1 < medidas.length; k++) {
    const l = medidas[k];
    const sig = medidas[k + 1];
    const pausa = sig.inicio - l.fin;
    const desde = r3(l.fin + Math.min(margenSegmento, Math.max(0, pausa / 2)));
    const hasta = r3(Math.max(0, l.fin + pausa / 2));
    if (hasta > desde) huecos.push({ desde, hasta, entre: [l.orden, sig.orden] });
  }
  return huecos;
}

/**
 * Mide una toma H contra lo que oyo Scribe. FUNCION PURA.
 *
 *   toma             la toma del manifiesto (`linea`, y `lineas` si es podcast)
 *   palabrasAsr      lo que devuelve transcribir(): [{ text, start, end }, ...]
 *   idioma, marcas   para la revision del habla (revisarHabla)
 *   tiemposDeLineas  opcional: los tiempos de las lineas con que se planea el
 *                    montaje (los guardados), para saber que huecos corta; si
 *                    no, los que mide ubicarLineas ahora
 *   margenSegmento   el aire del segmento del podcast (MARGEN_SEGMENTO_S)
 *
 * Devuelve { calidad, dijo_todo, faltan, sobran_al_final, agregadas, toleradas,
 * omitidas, limpio, lineas?, avisos, utiles, transcripcion, revision }. `utiles` son
 * las palabras del ASR que son el guion (sin la repeticion del final, si la
 * hubo); `lineas` solo si la toma las trae; `revision` es lo que devolvio
 * revisarHabla (con lo que es solo escritura, para mostrarlo, y en el podcast
 * `entreLineas`: lo agregado que cae donde el montaje corta, que no cuenta).
 */
export function medirToma(toma, palabrasAsr, { idioma = 'es', marcas = [], tiemposDeLineas = null, margenSegmento = MARGEN_SEGMENTO_S } = {}) {
  const linea = typeof toma?.linea === 'string' ? toma.linea : '';
  const correctas = palabrasDe(linea);
  const asr = palabrasValidas(palabrasAsr);
  const avisos = [];

  // 1. El chequeo del corte de cola: donde termina el guion y que se oye
  //    despues. Si el modelo repitio el final, lo que viene despues del corte
  //    no cuenta para ubicar nada: alineando contra todo, el final del guion
  //    se emparejaria con la repeticion (empatan y gana la ultima). Es
  //    decidirCola comparando guion y oido como se dicen: numeros, simbolos
  //    y palabras pegadas (decidirColaHablada).
  const cola = decidirColaHablada(linea, asr, { idioma });
  const utiles = cola.decision === 'cortar' ? asr.filter((w) => w.start < cola.fin) : asr;

  // 2. La revision del habla: palabras repetidas, trabadas, cambiadas o
  //    agregadas dentro de lo que queda en el montaje (2026-10-14). Dice
  //    tambien que palabras del guion se dijeron escritas distinto.
  const porPalabra = revisarHablaPorPalabra(linea, asr, { idioma, marcas });
  const revision = porPalabra.revision;

  // 3. Podcast: donde empieza y termina cada linea dentro del clip.
  const ubicadas = Array.isArray(toma?.lineas) && toma.lineas.length ? ubicarLineas(toma.lineas, utiles, { idioma }) : null;

  // 4. Podcast: el montaje parte el clip en un segmento por linea, y lo que se
  //    oye ENTRE dos lineas en el tramo que corta (huecosQueCortaElMontaje)
  //    no llega al anuncio: no cuenta, igual que lo que se oye despues de la
  //    ultima palabra del guion. Solo lo que cae ENTERO ahi ("Mhm" en medio
  //    de una pausa larga); lo que cae en el aire que si queda (justo despues
  //    de una linea, o en la mitad de la pausa antes de la siguiente) se oye
  //    y cuenta como siempre. Antes se contaba todo y un clip aprobado salia
  //    NO LIMPIO (Cayenne, toma 5: "Mhm." entre las lineas 10 y 12).
  if (ubicadas && !revision.motivo) {
    const huecos = huecosQueCortaElMontaje(Array.isArray(tiemposDeLineas) ? tiemposDeLineas : ubicadas.lineas, margenSegmento);
    // Una "cambiada" nunca se descuenta: reemplaza una palabra del guion, asi
    // que esa palabra tampoco llega al anuncio aunque caiga en el hueco.
    const cortada = (x) => x.tipo !== 'cambiada' && huecos.some((h) => x.inicio >= h.desde - 1e-6 && x.fin <= h.hasta + 1e-6);
    revision.entreLineas = revision.agregadas.filter(cortada);
    if (revision.entreLineas.length) {
      revision.agregadas = revision.agregadas.filter((x) => !cortada(x));
      revision.limpio = revision.agregadas.length === 0 && revision.omitidas.length === 0;
    }
  }

  // 5. El guion entero contra lo util, como se DICE (lo mismo que la
  //    revision): calidad y palabras que faltan. Lo que es solo escritura
  //    ("60" dicho "sesenta", "superbien" oido "super bien", la marca mal
  //    escrita por Scribe) no falta: sin esto una toma con cifras salia
  //    "FALTAN" al lado de "LIMPIO".
  let calidad = 0;
  let faltan = correctas.slice();
  if (correctas.length && utiles.length) {
    faltan = palabrasQueFaltan(correctas, utiles, porPalabra, idioma);
    calidad = r3((correctas.length - faltan.length) / correctas.length);
  }

  if (!correctas.length) {
    avisos.push('la toma no tiene linea en el manifiesto: no hay contra que comparar');
  } else if (!asr.length) {
    avisos.push('Scribe no oyo ninguna palabra en el clip');
  } else if (calidad < UMBRAL_ALINEACION) {
    avisos.push(
      `la alineacion fallo (solo ${pct(calidad)} de las palabras del guion encontraron pareja, ` +
        `hace falta ${pct(UMBRAL_ALINEACION)}): escucha el clip entero, puede que no diga el guion`
    );
  } else {
    if (faltan.length) {
      avisos.push(
        `faltan en lo oido: "${faltan.join(' ')}" (no se oyen, o se oyen cambiadas: lo que es solo escritura, ` +
          'como cifras, simbolos, palabras pegadas o la marca, ya no cuenta aqui)'
      );
    }
    if (cola.decision !== 'nada') avisos.push(cola.motivo);
    avisos.push(...cola.avisos);
  }

  const medida = {
    calidad,
    dijo_todo: correctas.length > 0 && faltan.length === 0,
    faltan,
    sobran_al_final: (cola.sobrantes || []).map((w) => w.texto).join(' '),
  };
  medida.agregadas = revision.agregadas;
  medida.toleradas = revision.toleradas;
  medida.omitidas = revision.omitidas;
  medida.limpio = revision.limpio;
  if (ubicadas) {
    medida.lineas = ubicadas.lineas;
    avisos.push(...ubicadas.avisos);
  }
  return { ...medida, avisos, utiles, transcripcion: asr.map((w) => w.text).join(' '), revision };
}

/**
 * La entrada de una toma en lineas-habladas.json, con la forma exacta del
 * contrato, mas la medida completa para la tabla. FUNCION PURA.
 *
 *   largo, tamano  lo que dura el clip medido y sus bytes (el CLI los pone
 *                  siempre; sin tamano la entrada sale como las de antes)
 *   tiemposDeLineas, margenSegmento  como en medirToma (opcionales)
 */
export function entradaDeToma({
  toma,
  palabrasAsr,
  largo = null,
  tamano = null,
  idioma = 'es',
  marcas = [],
  tiemposDeLineas = null,
  margenSegmento = MARGEN_SEGMENTO_S,
}) {
  const medida = medirToma(toma, palabrasAsr, { idioma, marcas, tiemposDeLineas, margenSegmento });
  const motivo = medida.revision?.motivo;
  const entrada = {
    clip: `video/toma-${toma.n}.mp4`,
    largo,
    ...(Number.isFinite(tamano) ? { tamano } : {}),
    calidad: medida.calidad,
    palabras: palabrasValidas(palabrasAsr).map((w) => ({ text: String(w.text), start: w.start, end: w.end })),
    dijo_todo: medida.dijo_todo,
    faltan: medida.faltan,
    sobran_al_final: medida.sobran_al_final,
    agregadas: medida.agregadas,
    // Las repeticiones de una letra que no cuentan (TOLERANCIA_REPETICION):
    // siempre van, aunque vacias, para que el plan y --solo-plan las muestren.
    toleradas: medida.toleradas,
    omitidas: medida.omitidas,
    limpio: medida.limpio,
    // Por que no esta limpio, cuando no se pudo ni comparar (no oyo nada, o
    // lo oido no es el guion): sin esto el aviso no diria nada.
    ...(motivo ? { motivo } : {}),
    ...(medida.lineas ? { lineas: medida.lineas } : {}),
  };
  return { entrada, medida };
}

/**
 * Las opciones de la revision del habla de un manifiesto, las mismas en el
 * CLI, en --solo-plan y en el plan: el idioma de los numeros en letras y la
 * marca y los nombres que Scribe puede escribir distinto.
 */
export function opcionesDeRevision(manifiesto) {
  return {
    idioma: ['es', 'en', 'pt'].includes(manifiesto?.idioma) ? manifiesto.idioma : 'es',
    marcas: nombresDelManifiesto(manifiesto),
  };
}

/**
 * La revision del habla de una medida GUARDADA de antes de que existiera (sin
 * `limpio`: los anuncios medidos antes del 2026-10-14), sobre las palabras
 * que ya guardo: lo que diria `npm run lineas` si Scribe oyera lo mismo, sin
 * Scribe ni creditos. FUNCION PURA. Es entradaDeToma con las opciones del CLI
 * (opcionesDeRevision); los huecos entre lineas que corta el montaje salen de
 * las `lineas` GUARDADAS, que son con las que se planea. El que la llama se
 * asegura de que la medida sea de ESE clip (estadoDeMedida: el plan ya solo
 * tiene las vigentes). La usa --solo-plan, y el plan puede usar la misma; lo
 * que muestran va marcado "segun la transcripcion guardada". Como es la
 * misma revision, la repeticion de una letra corta y sin pausa
 * (TOLERANCIA_REPETICION) tambien sale aca como tolerada, no como sucia.
 *
 *   manifiesto      el del anuncio
 *   n               el numero de la toma
 *   entrada         la de esa toma en lineas-habladas.json
 *   margenSegmento  opcional, como en medirToma
 *
 * Devuelve la entrada como la escribiria `lineas` (limpio, agregadas,
 * toleradas, omitidas y motivo si no se pudo ni comparar; calidad, dijo_todo
 * y faltan comparando como se dice), o null si no hace falta o no se puede: la medida
 * ya trae la revision (`limpio`), es la del clip de reacciones, no guardo
 * sus palabras, o la toma ya no es H con linea.
 */
export function revisionDeMedidaGuardada(manifiesto, n, entrada, { margenSegmento = MARGEN_SEGMENTO_S } = {}) {
  if (!entrada || typeof entrada !== 'object' || entrada.reacciones || typeof entrada.limpio === 'boolean') return null;
  if (!Array.isArray(entrada.palabras)) return null;
  const toma = (manifiesto?.tomas || []).find((t) => t.n === Number(n) && t.tipo === 'H' && typeof t.linea === 'string' && t.linea.trim());
  if (!toma) return null;
  return entradaDeToma({
    toma,
    palabrasAsr: entrada.palabras,
    largo: Number.isFinite(entrada.largo) ? entrada.largo : null,
    tamano: Number.isFinite(entrada.tamano) ? entrada.tamano : null,
    ...opcionesDeRevision(manifiesto),
    tiemposDeLineas: Array.isArray(entrada.lineas) ? entrada.lineas : null,
    margenSegmento,
  }).entrada;
}

// ---------------------------------------------------------------- el clip de reacciones (podcast)

/**
 * Lo que Scribe escribe como palabra pero es un sonido de reaccion, que vale:
 * un murmullo con la boca cerrada ("mm", "hmm", "mhm", "mm-hmm") o una risa
 * escrita ("jaja", "jeje", "haha"). Se mira la palabra ya normalizada. Todo lo
 * demas es una palabra, en cualquier idioma ("yes", "so", "si", "ah", "oh"):
 * una falla. La regla: vale cualquier sonido o gesto, nunca una palabra ni un
 * monosilabo.
 */
export const SONIDO_DE_REACCION = /^(?:[mhn]+|(?:[jh][aeiou]){2,}[jh]?)$/;

/**
 * La reaccion (1, 2 o 3) que cae en el segundo t de un clip de reacciones, si
 * se reparte como el montaje cuando no hay eventos: el clip menos 0.3 s por
 * lado, en tres tercios. Solo para decir donde cayo una palabra.
 */
export function reaccionDelSegundo(t, largo) {
  if (!Number.isFinite(largo) || largo <= 0.6) return null;
  const tercio = (largo - 0.6) / 3;
  return Math.min(3, Math.max(1, 1 + Math.floor((t - 0.3) / tercio)));
}

/**
 * Mide el clip de reacciones contra lo que oyo Scribe con sus eventos de
 * audio (transcribir(..., { eventos: true })). FUNCION PURA.
 *
 * Devuelve { palabras, eventos, limpio, transcripcion }: `palabras` solo las
 * de verdad ({ text, start, end }), `eventos` los sonidos que valen
 * ({ texto, start, end }: los eventos de Scribe y los SONIDO_DE_REACCION),
 * ordenados por tiempo, y limpio = sin ninguna palabra.
 */
export function medirReacciones(itemsAsr) {
  const items = (itemsAsr || []).filter(
    (w) => w && String(w.text ?? '').trim() && Number.isFinite(w.start) && Number.isFinite(w.end)
  );
  const palabras = [];
  const eventos = [];
  for (const w of items) {
    const texto = String(w.text).trim();
    // Un evento: el de Scribe, o uno escrito entre parentesis o corchetes.
    if (w.type === 'audio_event' || /^[([].*[)\]]$/.test(texto)) {
      eventos.push({ texto, start: w.start, end: w.end });
      continue;
    }
    if (w.type !== undefined && w.type !== 'word') continue;
    const n = normalizar(texto);
    if (!n) continue;
    if (SONIDO_DE_REACCION.test(n)) eventos.push({ texto, start: w.start, end: w.end });
    else palabras.push({ text: texto, start: w.start, end: w.end });
  }
  eventos.sort((a, b) => a.start - b.start);
  const transcripcion = items
    .map((w) => (w.type === 'audio_event' ? `*${String(w.text).trim()}*` : String(w.text).trim()))
    .join(' ');
  return { palabras, eventos, limpio: palabras.length === 0, transcripcion };
}

/** La entrada del clip de reacciones en lineas-habladas.json, con la forma del contrato. FUNCION PURA. */
export function entradaDeReacciones({ toma, itemsAsr, largo = null, tamano = null }) {
  const medida = medirReacciones(itemsAsr);
  const entrada = {
    clip: `video/toma-${toma.n}.mp4`,
    largo,
    ...(Number.isFinite(tamano) ? { tamano } : {}),
    reacciones: true,
    palabras: medida.palabras,
    eventos: medida.eventos,
    limpio: medida.limpio,
  };
  return { entrada, medida };
}

/** Lee el informe anterior si existe y es legible; si no, null. */
export function leerMedidas(carpeta) {
  const ruta = rutaMedidas(carpeta);
  if (!fs.existsSync(ruta)) return null;
  try {
    const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    return datos && typeof datos === 'object' ? datos : null;
  } catch {
    return null;
  }
}

/**
 * Escribe el informe. Se MEZCLA con el anterior: con --tomas se miden pocas y
 * las demas conservan su medida. Las entradas de tomas que ya no son H con
 * linea (o que ya no estan) se descartan: medirian otra cosa.
 */
export function escribirMedidas(carpeta, nuevas, vigentes) {
  const previas = leerMedidas(carpeta)?.tomas || {};
  const tomas = {};
  const claves = new Set([...Object.keys(previas), ...Object.keys(nuevas)]);
  for (const k of [...claves].sort((a, b) => Number(a) - Number(b))) {
    if (!vigentes.includes(Number(k))) continue;
    if (nuevas[k]) tomas[k] = nuevas[k];
    else if (previas[k]) tomas[k] = previas[k];
  }
  const ruta = rutaMedidas(carpeta);
  fs.writeFileSync(ruta, JSON.stringify({ generado: new Date().toISOString(), tomas }, null, 2) + '\n', 'utf8');
  return ruta;
}

/**
 * Quita la medida de unas tomas (su clip cambio: la medida vieja ya no es de
 * ese clip y `npm run lineas` la vuelve a escribir). Devuelve los numeros que
 * tenian medida. Un archivo ilegible no se toca.
 */
export function quitarMedidas(carpeta, numeros) {
  const datos = leerMedidas(carpeta);
  if (!datos || !datos.tomas || typeof datos.tomas !== 'object') return [];
  const quitadas = numeros.filter((n) => String(n) in datos.tomas);
  if (!quitadas.length) return [];
  for (const n of quitadas) delete datos.tomas[String(n)];
  fs.writeFileSync(rutaMedidas(carpeta), JSON.stringify(datos, null, 2) + '\n', 'utf8');
  return quitadas;
}

/** Una entrada sin `tamano` (de antes) es del clip si el largo coincide hasta aca. */
export const TOLERANCIA_LARGO_S = 0.05;

/**
 * Si la medida de una toma es del clip que hay hoy en video/. FUNCION PURA.
 *
 *   entrada  la de la toma en lineas-habladas.json (o undefined)
 *   clip     { tamano, largo }: los bytes del clip de hoy y lo que dura
 *
 * Devuelve { estado, motivo }:
 *   'falta'    no hay medida (o no trae palabras)
 *   'vieja'    es de OTRO clip: pesa distinto, o, si la entrada no trae
 *              `tamano` (de antes), dura distinto (mas de TOLERANCIA_LARGO_S).
 *              Comparar solo el largo no alcanza: Omni entrega clips del
 *              mismo largo (Cayenne: 10.005 s en cuatro tomas)
 *   'vigente'  es de este clip (con sinComprobar: true si no hay con que
 *              comprobarlo: ni tamano ni largo)
 * Una medida vieja se trata como si faltara: el plan, el paso voz y los
 * subtitulos no la usan y dicen como volver a medir (avisoMedidaVieja).
 */
export function estadoDeMedida(entrada, { tamano = null, largo = null } = {}) {
  if (!entrada || typeof entrada !== 'object' || !Array.isArray(entrada.palabras)) return { estado: 'falta', motivo: 'no esta medida' };
  if (Number.isFinite(entrada.tamano) && Number.isFinite(tamano)) {
    return entrada.tamano === tamano
      ? { estado: 'vigente', motivo: '' }
      : { estado: 'vieja', motivo: `se midio un clip de ${entrada.tamano} bytes y el de hoy pesa ${tamano}` };
  }
  if (Number.isFinite(entrada.largo) && Number.isFinite(largo)) {
    return Math.abs(entrada.largo - largo) <= TOLERANCIA_LARGO_S
      ? { estado: 'vigente', motivo: '' }
      : { estado: 'vieja', motivo: `mide ${s(entrada.largo)} y el clip dura ${s(largo)}` };
  }
  return { estado: 'vigente', motivo: 'no se puede comprobar que sea de este clip (la medida no trae tamano ni largo)', sinComprobar: true };
}

/**
 * estadoDeMedida contra el clip de la toma en <carpeta>/video/: lee su tamano
 * y, solo si la entrada no trae tamano (de antes), su largo con ffprobe. Sin
 * clip no hay con que comprobar.
 */
export function estadoDeMedidaDelClip(carpeta, n, entrada) {
  const clip = path.join(carpeta, 'video', `toma-${n}.mp4`);
  if (!fs.existsSync(clip)) return estadoDeMedida(entrada, {});
  const tamano = fs.statSync(clip).size;
  const conTamano = Boolean(entrada && Number.isFinite(entrada.tamano));
  return estadoDeMedida(entrada, { tamano, largo: conTamano ? null : largoDeClip(clip) });
}

/** El aviso de una medida vieja, con el comando para volver a medir. */
export function avisoMedidaVieja(numeros, carpeta = '<carpeta>') {
  const ns = [].concat(numeros);
  return `la medida de ${ns.length === 1 ? 'toma' : 'tomas'} ${ns.join(', ')} es de otro clip: corre npm run lineas -- ${carpeta} --tomas ${ns.join(',')}`;
}

/** Extrae el audio de un clip a un mp3 mono de 16 kHz (lo mismo que los subtitulos). */
function audioDeClip(rutaClip, destino) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', rutaClip, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', destino]);
  return destino;
}

/** Largo del clip en segundos (ffprobe), o null si no se pudo medir. */
function largoDeClip(archivo) {
  try {
    const salida = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', archivo], {
      encoding: 'utf8',
    });
    const n = parseFloat(salida);
    return Number.isFinite(n) ? r3(n) : null;
  } catch {
    return null;
  }
}

/** El comando para regenerar una toma que no esta limpia. */
const comandoRehacer = (carpeta, n) => `npm run rehacer -- ${carpeta || '<carpeta>'} --toma ${n} --contexto`;

/**
 * La tabla de una toma: cada linea con su inicio, su fin y la pausa hasta la
 * siguiente. Exportada para poder verla en seco (temp/prueba-lineas-seco).
 * Con `carpeta`, el comando para regenerarla sale con la carpeta real.
 */
export function imprimirToma(toma, entrada, medida, { carpeta = null } = {}) {
  const estado = entrada.dijo_todo ? 'dijo todo el guion' : `FALTAN ${entrada.faltan.length} palabra(s) del guion`;
  const sobra = entrada.sobran_al_final ? '  voz despues del guion (el recorte la deja fuera)' : '';
  const toleradas = toleradasDe(medida.revision ?? entrada);
  const conToleradas = toleradas.length ? ` (con ${toleradas.length} repeticion${toleradas.length === 1 ? '' : 'es'} tolerada${toleradas.length === 1 ? '' : 's'})` : '';
  const limpio = entrada.limpio === undefined ? '' : entrada.limpio ? `  LIMPIO${conToleradas}` : '  NO ESTA LIMPIO';
  console.log(
    `  toma ${toma.n}  ${entrada.clip}  ${entrada.largo === null ? 'largo ?' : s(entrada.largo)}  ` +
      `${pct(entrada.calidad)} alineado  ${estado}${limpio}${sobra}`
  );
  if (entrada.lineas) {
    console.log(
      `      ${'linea'.padStart(5)}  ${'inicio'.padStart(7)}  ${'fin'.padStart(7)}  ${'pausa'.padStart(13)}  ${'alineado'.padStart(8)}  texto`
    );
    entrada.lineas.forEach((l, i) => {
      const texto = (toma.lineas || []).find((x) => x.orden === l.orden)?.texto ?? '';
      const siguiente = entrada.lineas.slice(i + 1).find((x) => x.inicio !== null);
      let pausa = '-';
      if (l.fin !== null) {
        if (siguiente) pausa = s(siguiente.inicio - l.fin);
        else if (entrada.largo !== null) pausa = `${s(Math.max(0, entrada.largo - l.fin))} al fin`;
      }
      const ini = l.inicio === null ? 'sin tiempos' : s(l.inicio);
      const fin = l.fin === null ? '' : s(l.fin);
      console.log(
        `      ${String(l.orden).padStart(5)}  ${ini.padStart(7)}  ${fin.padStart(7)}  ${pausa.padStart(13)}  ${pct(l.calidad).padStart(8)}  "${texto}"`
      );
    });
  } else if (medida.utiles.length) {
    const u = medida.utiles;
    console.log(`      voz de ${s(u[0].start)} a ${s(u[u.length - 1].end)} (${u.length} palabras oidas)`);
  }
  console.log(`      guion: "${toma.linea}"`);
  console.log(`      oido:  "${medida.transcripcion}"`);
  for (const a of medida.avisos) console.log(`      !  ${a}`);
  const rev = medida.revision;
  if (!rev) return;
  if (entrada.limpio === false) {
    console.log(`      NO ESTA LIMPIO: ${describirRevision(rev)} -> regenerar: ${comandoRehacer(carpeta, toma.n)}`);
  }
  // Una tolerada no ensucia el clip, pero se informa siempre (TOLERANCIA_REPETICION).
  for (const x of toleradasDe(rev)) console.log(`      ${describirTolerada(x)}`);
  if (rev.escritura.length) {
    console.log(`      solo escritura, no cuenta: ${rev.escritura.map((e) => `"${e.oido}" = "${e.guion}"`).join('; ')}`);
  }
  if (rev.entreLineas?.length) {
    console.log(`      entre lineas, donde el montaje corta, no cuenta: ${rev.entreLineas.map((x) => `"${x.texto}" (${s(x.inicio)})`).join('; ')}`);
  }
  for (const a of rev.avisos) console.log(`      !  ${a}`);
}

/**
 * El resumen de las repeticiones toleradas (TOLERANCIA_REPETICION) de varias
 * tomas, al final de `npm run lineas` y de --solo-plan: una tolerada no
 * ensucia el clip, pero nunca pasa callada.
 *
 *   conToleradas  [{ n, toleradas, guardada? }]; guardada = revisada sobre la
 *                 transcripcion guardada (--solo-plan)
 */
export function imprimirResumenToleradas(conToleradas) {
  const total = conToleradas.reduce((a, x) => a + x.toleradas.length, 0);
  if (!total) return;
  const { totalSeg, pausaSeg } = TOLERANCIA_REPETICION;
  console.log(
    `  REPETICIONES TOLERADAS (${total}): una letra dicha dos veces, en menos de ${totalSeg} s y con menos de ${pausaSeg} s ` +
      'de pausa. No ensucian el clip (aprobado de oido en un anuncio real):'
  );
  for (const x of conToleradas) {
    for (const t of x.toleradas) console.log(`      toma ${x.n}: ${describirTolerada(t)}${x.guardada ? ' (segun la transcripcion guardada)' : ''}`);
  }
}

/** Lo que se imprime del clip de reacciones: limpio o no, cada palabra con su reaccion, y los sonidos. */
export function imprimirReacciones(toma, entrada, medida, { carpeta = null } = {}) {
  console.log(
    `  toma ${toma.n}  ${entrada.clip}  ${entrada.largo === null ? 'largo ?' : s(entrada.largo)}  ` +
      `reacciones de ${toma.habla ?? '?'}  ${entrada.limpio ? 'LIMPIO (sin palabras)' : 'NO ESTA LIMPIO'}`
  );
  for (const p of entrada.palabras) {
    const n = reaccionDelSegundo((p.start + p.end) / 2, entrada.largo);
    console.log(`      FALLA: dijo "${p.text}" (${s(p.start)}${n ? `, en la reaccion ${n}` : ''})`);
  }
  if (!entrada.limpio) {
    console.log(`      Una reaccion va sin palabras: el clip se regenera -> ${comandoRehacer(carpeta, toma.n)}`);
  }
  console.log(
    `      sonidos: ${entrada.eventos.length ? entrada.eventos.map((e) => `"${e.texto}" ${s(e.start)}`).join(', ') : 'ninguno (Scribe no marco eventos)'}`
  );
  console.log(`      oido:  "${medida.transcripcion}"`);
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('lineas-habladas.js')) {
  const args = process.argv.slice(2);
  const iT = args.indexOf('--tomas');
  const carpetaArg = args.find((a, i) => !a.startsWith('--') && (iT === -1 || i !== iT + 1));
  const soloPlan = args.includes('--solo-plan');
  const soloTomas =
    iT !== -1 && args[iT + 1]
      ? args[iT + 1].split(',').map((x) => Number(x.trim())).filter(Number.isInteger)
      : null;

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/lineas-habladas.js <carpeta-del-anuncio> [--tomas 1,3] [--solo-plan]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const rutaManifiesto = path.join(carpeta, 'manifiesto.json');
  if (!fs.existsSync(rutaManifiesto)) {
    console.error(`\n  No encuentro ${rutaManifiesto}\n`);
    process.exit(1);
  }
  const manifiesto = JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8'));
  const tomasH = (manifiesto.tomas || []).filter((t) => t.tipo === 'H');
  const habladas = tomasH.filter((t) => typeof t.linea === 'string' && t.linea.trim());
  // El clip de reacciones del podcast (sin linea): tambien se transcribe, con
  // los eventos de audio, para ver que no dijo ninguna palabra.
  const reacciones = tomasH.filter((t) => t.clase === 'reacciones' && !(typeof t.linea === 'string' && t.linea.trim()));
  const medibles = tomasH.filter((t) => habladas.includes(t) || reacciones.includes(t));
  const esReaccion = (t) => reacciones.includes(t);

  console.log(`\n=== Lineas habladas (tomas H) — ${path.basename(carpeta)} ===\n`);

  if (!tomasH.length) {
    console.log('  Este manifiesto no tiene tomas tipo H. Nada que hacer: las lineas habladas son solo para podcast y entrevista.\n');
    process.exit(0);
  }
  if (!medibles.length) {
    console.log('  Las tomas H de este manifiesto no tienen linea ni son el clip de reacciones. Nada que transcribir.\n');
    process.exit(0);
  }

  if (soloTomas) {
    const noH = soloTomas.filter((n) => !medibles.some((t) => t.n === n));
    if (noH.length) {
      console.error(
        noH.length === 1
          ? `  La toma ${noH[0]} no existe o no es una toma H con linea ni el clip de reacciones.\n`
          : `  Las tomas ${noH.join(', ')} no existen o no son tomas H con linea ni el clip de reacciones.\n`
      );
      process.exit(1);
    }
  }
  const elegidas = soloTomas ? medibles.filter((t) => soloTomas.includes(t.n)) : medibles;

  const conClip = [];
  for (const t of elegidas) {
    const clip = path.join(carpeta, 'video', `toma-${t.n}.mp4`);
    if (fs.existsSync(clip)) conClip.push({ toma: t, clip });
    else console.log(`  toma ${t.n}: no encuentro video/toma-${t.n}.mp4, se salta.`);
  }

  if (soloPlan) {
    const previas = leerMedidas(carpeta);
    const segundos = conClip.reduce((a, x) => a + (Number(x.toma.duracion) || 0), 0);
    console.log('  --solo-plan: no se transcribe nada.\n');
    if (!conClip.length) console.log('  Ninguna toma tiene clip todavia: no habria nada que transcribir.');
    // Las revisadas aca sobre la transcripcion guardada, y las que no estan limpias.
    const revisadasAca = [];
    const suciasGuardadas = [];
    // Las repeticiones toleradas (guardadas o revisadas aca): se informan siempre.
    const conToleradas = [];
    for (const { toma } of conClip) {
      const previa = previas?.tomas?.[String(toma.n)];
      // Una medida de otro clip (se regenero) es como si no estuviera.
      const vigencia = previa ? estadoDeMedidaDelClip(carpeta, toma.n, previa) : null;
      const vieja = vigencia?.estado === 'vieja' ? `medida de OTRO clip (${vigencia.motivo}): hay que volver a medirla` : null;
      if (esReaccion(toma)) {
        const estado =
          vieja ||
          (previa?.reacciones
            ? `ya medido (${previa.limpio ? 'limpio, sin palabras' : `NO ESTA LIMPIO: ${(previa.palabras || []).length} palabra(s)`})`
            : 'sin medir');
        console.log(`  toma ${toma.n} (${toma.duracion} s, reacciones de ${toma.habla}): se transcribiria con los eventos de audio. Hoy: ${estado}.`);
        continue;
      }
      // Una medida de este clip de ANTES de la revision del habla (sin
      // `limpio`): sus palabras ya estan guardadas y la revision es pura, asi
      // que se calcula aca, sin Scribe ni creditos, y se marca "segun la
      // transcripcion guardada". El archivo no cambia.
      const guardada = previa && !vieja ? revisionDeMedidaGuardada(manifiesto, toma.n, previa) : null;
      const m = guardada || previa;
      // Una tolerada no ensucia, pero va al lado, con su segundo.
      const toleradas = !vieja && typeof m?.limpio === 'boolean' ? toleradasDe(m) : [];
      const tolerada = toleradas.length ? `; ${toleradas.map(describirTolerada).join('; ')}` : '';
      const limpio =
        m?.limpio === undefined
          ? ', sin revisar el habla'
          : m.limpio
            ? `, limpio${tolerada}`
            : `, NO ESTA LIMPIO: ${describirRevision({ agregadas: m.agregadas || [], omitidas: m.omitidas || [], motivo: m.motivo || '' }) || 'ver lineas-habladas.json'}${tolerada}`;
      if (toleradas.length) conToleradas.push({ n: toma.n, toleradas, guardada: Boolean(guardada) });
      const resumen = m ? `${pct(Number(m.calidad) || 0)} alineado${m.dijo_todo ? ', dijo todo' : ', FALTAN palabras'}${limpio}` : '';
      const estado =
        vieja ||
        (guardada
          ? `ya medida, de antes de la revision del habla; segun la transcripcion guardada: ${resumen}`
          : previa
            ? `ya medida (${resumen})`
            : 'sin medir');
      const cuantas = Array.isArray(toma.lineas) ? `, ${toma.lineas.length} linea(s)` : '';
      console.log(`  toma ${toma.n} (${toma.duracion} s${cuantas}): se transcribiria. Hoy: ${estado}.`);
      console.log(`      guion: "${toma.linea}"`);
      if (guardada) {
        revisadasAca.push(toma.n);
        if (!guardada.limpio) suciasGuardadas.push(toma.n);
      }
    }
    if (revisadasAca.length) {
      const una = revisadasAca.length === 1;
      console.log(
        `\n  ${una ? 'La toma' : 'Las tomas'} ${revisadasAca.join(', ')} se ${una ? 'midio' : 'midieron'} antes de la revision del habla: ` +
          `${una ? 'se reviso' : 'se revisaron'} aca sobre las palabras que ya estaban en lineas-habladas.json, sin Scribe ni creditos ` +
          `("segun la transcripcion guardada"). El archivo no cambia; para guardar la revision hay que volver a ${una ? 'medirla' : 'medirlas'}:\n` +
          `      npm run lineas -- ${carpetaArg} --tomas ${revisadasAca.join(',')}`
      );
    }
    if (suciasGuardadas.length) {
      const sola = suciasGuardadas.length === 1;
      console.log(
        `  ${sola ? `La toma ${suciasGuardadas[0]} NO ESTA LIMPIA` : `Las tomas ${suciasGuardadas.join(', ')} NO ESTAN LIMPIAS`} segun la transcripcion guardada. ` +
          `${sola ? 'Se regenera' : 'Cada una se regenera'} hasta que salga limpia, nunca "suena natural", avisando el costo:`
      );
      for (const n of suciasGuardadas) console.log(`      ${comandoRehacer(carpetaArg, n)}`);
    }
    if (conToleradas.length) {
      console.log('');
      imprimirResumenToleradas(conToleradas);
    }
    if (previas?.generado) console.log(`\n  lineas-habladas.json actual: generado el ${previas.generado}.`);
    console.log(
      `\n  Scribe: ~${segundos} s de audio, ~US$${((segundos / 3600) * 0.22).toFixed(4)}. ` +
        `Para hacerlo:\n      npm run lineas -- ${carpetaArg}${soloTomas ? ` --tomas ${soloTomas.join(',')}` : ''}\n`
    );
    process.exit(0);
  }

  if (!conClip.length) {
    console.log('\n  Ninguna toma tiene clip todavia. Genera primero los videos.\n');
    process.exit(1);
  }

  try {
    cargarEnv();
  } catch (e) {
    console.error(`\n  ${e.message}\n`);
    process.exit(1);
  }
  const idioma = manifiesto.idioma === 'es' ? 'spa' : manifiesto.idioma === 'pt' ? 'por' : 'eng';
  // Para la revision del habla: los numeros en letras van en el idioma del
  // anuncio, y a la marca y los nombres se les perdona que Scribe los escriba distinto.
  const revision = opcionesDeRevision(manifiesto);
  const dirTmp = path.join(carpeta, '.stt-lineas');
  fs.mkdirSync(dirTmp, { recursive: true });

  const nuevas = {};
  const errores = [];
  const sucias = [];
  const conToleradas = [];
  for (const { toma, clip } of conClip) {
    try {
      const mp3 = audioDeClip(clip, path.join(dirTmp, `toma-${toma.n}.mp3`));
      // Los bytes del clip medido: asi se sabe despues si la medida es de el.
      const tamano = fs.statSync(clip).size;
      if (esReaccion(toma)) {
        // Sin idioma: una palabra en cualquier idioma ("yes", "so") es falla,
        // y con el idioma fijo Scribe la "traduciria" a lo que espera oir.
        const itemsAsr = await transcribir(mp3, null, { eventos: true });
        const { entrada, medida } = entradaDeReacciones({ toma, itemsAsr, largo: largoDeClip(clip), tamano });
        nuevas[String(toma.n)] = entrada;
        imprimirReacciones(toma, entrada, medida, { carpeta: carpetaArg });
        if (!entrada.limpio) sucias.push({ n: toma.n, que: `reacciones: dijo "${entrada.palabras.map((p) => p.text).join(' ')}"` });
      } else {
        const palabrasAsr = await transcribir(mp3, idioma);
        const { entrada, medida } = entradaDeToma({ toma, palabrasAsr, largo: largoDeClip(clip), tamano, ...revision });
        nuevas[String(toma.n)] = entrada;
        imprimirToma(toma, entrada, medida, { carpeta: carpetaArg });
        if (!entrada.limpio) sucias.push({ n: toma.n, que: describirRevision(medida.revision) });
        if (toleradasDe(entrada).length) conToleradas.push({ n: toma.n, toleradas: toleradasDe(entrada) });
      }
    } catch (e) {
      errores.push(toma.n);
      console.log(`  toma ${toma.n}: ERROR, no se midio. ${e.message}`);
    }
    console.log('');
  }

  fs.rmSync(dirTmp, { recursive: true, force: true });

  const ruta = escribirMedidas(carpeta, nuevas, medibles.map((t) => t.n));
  console.log(`  Guardado en ${ruta}`);
  // Las que no se midieron ahora (--tomas) y son de otro clip: no valen.
  const guardadas = leerMedidas(carpeta)?.tomas || {};
  const viejas = medibles
    .filter((t) => !nuevas[String(t.n)] && guardadas[String(t.n)])
    .filter((t) => estadoDeMedidaDelClip(carpeta, t.n, guardadas[String(t.n)]).estado === 'vieja')
    .map((t) => t.n);
  if (viejas.length) console.log(`\n  !  ${avisoMedidaVieja(viejas, carpetaArg)} (el plan no la usa)`);
  if (sucias.length) {
    console.log(`\n  NO ESTAN LIMPIAS (${sucias.length}):`);
    for (const x of sucias) console.log(`      toma ${x.n}: ${x.que}`);
    console.log(
      '  Cada una se regenera hasta que salga limpia, nunca "suena natural", avisando el costo\n' +
        '  (rehacer la saca a historial/; npm run videos -- <carpeta> --solo-plan muestra lo que cuesta generarla otra vez):'
    );
    for (const x of sucias) console.log(`      ${comandoRehacer(carpetaArg, x.n)}`);
    console.log('');
  }
  if (conToleradas.length) {
    if (!sucias.length) console.log('');
    imprimirResumenToleradas(conToleradas);
    console.log('');
  }
  console.log('  Es un informe: ningun clip se toca. Ahora:');
  console.log(`      npm run plan -- ${carpetaArg}\n`);
  if (errores.length) process.exit(1);
}
