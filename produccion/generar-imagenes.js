// FASE 2.2 — las imagenes de un anuncio a partir de su manifiesto.
//
// ESTA COPIA USA GOOGLE FLOW: aqui no se le pide nada a kie.ai. El script
// arma la lista de trabajo flow/cola-imagenes.json (ver produccion/flow/flow.js)
// con las imagenes que Claude genera a mano en Google Flow, y resuelve solo lo
// que no necesita Flow (frames heredados y copias de una referencia). Despues
// "npm run flow:recibir -- <carpeta>" mete en img/ lo descargado y se vuelve a
// correr este comando hasta que la cola diga que no queda nada: hay imagenes
// que necesitan otras (la hoja de un personaje, el frame inicial de la misma
// toma, el frame anterior) y recien entran a la cola cuando esas ya existen.
//
//   node produccion/generar-imagenes.js temp/mi-anuncio            arma la cola con lo que falta
//   node produccion/generar-imagenes.js temp/mi-anuncio --tomas 1,12   solo esas tomas (y las hojas)
//   node produccion/generar-imagenes.js temp/mi-anuncio --solo-plan    muestra el plan, no escribe nada
//   node produccion/generar-imagenes.js temp/mi-anuncio --rehacer      manda lo ya hecho a historial/ y lo vuelve a pedir
//   node produccion/generar-imagenes.js temp/mi-anuncio --tapar-huecos solo tapa los huecos de
//                                     los iconos que ya estan en img/ (no genera nada)
//
// Lo que ya esta en img/ NO se vuelve a pedir: una imagen esta hecha cuando
// existe con su nombre exacto.
//
// Estilos hablados (podcast y entrevista, tomas tipo H; su flujo esta en
// COMO-PRODUCIR.md, seccion 12):
//
//   - Una toma H con "frame_inicial" NO genera su frame: la imagen de esa
//     referencia (la hoja img/<id>.png, o la foto aportada convertida a png
//     con ffmpeg) se copia tal cual a img/toma-N-inicial.png, sin Flow. Si la
//     hoja todavia no existe, la copia espera a la vuelta siguiente (cuando la
//     hoja ya llego de Flow), igual que los frames heredados.
//   - Una toma H sin "frame_inicial" genera su frame como una toma A (prompt +
//     referencias).
//   - Los iconos (entrevista) se piden en Flow cuadrados (1:1) y sobre verde
//     croma (#00FF00): el pedido de "fondo transparente" del prompt se cambia
//     por ese verde y flow:recibir lo vuelve transparente. --tapar-huecos tapa
//     los huecos semitransparentes que queden dentro de la figura
//     (produccion/tapar-huecos.py, Python con Pillow y numpy) y mide con ffmpeg
//     si el PNG trae transparencia real ("transparente" en img/log-modelos.json:
//     el montaje lo muestra recortado si la trae y dentro de una tarjeta blanca
//     si no).
//
// Nada de esto corre en otro estilo: un manifiesto sin tomas H y de otro
// estilo produce exactamente el mismo plan que antes.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  MODELOS,
  MODELO_IMAGEN_UGC,
  RESOLUCION_IMAGEN_UGC,
  MODELO_IMAGEN_POR_ESTILO,
  ESTILOS_HABLADOS,
  MODELO_IMAGEN_ICONOS,
  RESOLUCION_IMAGEN_ICONOS,
  cargarEnv,
} from './config.js';
import { validarManifiesto } from './validar-manifiesto.js';
import {
  listaDeReferencias,
  esGenerada,
  esAportada,
  esFotoDelUsuario,
  esHojaDesdeArchivo,
  esLugarDeToma,
  archivoDeHoja,
  archivoDeReferencia,
  tomaDelBroll,
} from './referencias.js';
import { anotarHojaDeReferencia, hojaDeReferencia } from './estado.js';
import { archivarSiExiste } from './historial.js';
import { tieneContinuidad, referenciasSoloDelBrollDescartado } from './continuidad.js';
import { buscarPython, comandoPython, comandoInstalar, paquetesQueFaltan, PAQUETES_PYTHON, CANDIDATOS_PYTHON } from './recortar-host.js';
import { FLOW, nombreDescarga, escribirCola, imprimirCola } from './flow/flow.js';

// El plan (construirPlan) sigue anotando la cascada y la resolucion de kie.ai
// de cada imagen; modeloFlowDe() las traduce a los modelos de Flow.
const RESOLUCION = '1K';

/**
 * Iconos: por debajo de este valor del canal alfa (0 = invisible, 255 =
 * opaco) un pixel cuenta como transparente. Un icono con fondo transparente de
 * verdad tiene el fondo en 0; se deja margen porque algun modelo deja el fondo
 * casi en cero en vez de en cero. Un PNG sin canal alfa da 255 en todos.
 */
const ALFA_TRANSPARENTE_MAX = 128;

/**
 * Iconos con huecos: el script que los tapa. Python se busca y
 * se corre IGUAL que en el recorte del host y en npm run verificar (seccion
 * 8), con buscarPython() de recortar-host.js: los mismos candidatos en el
 * mismo orden (en Windows "python", "py -3", "python3"; en macOS y Linux
 * "python3", "python"), el primer Python 3 que responde (el atajo de la
 * Microsoft Store y Python 2 no cuentan), detectado una sola vez por proceso,
 * y con -E -P (solo -E antes de Python 3.11, que no conoce -P), NO con -I: -I
 * deja fuera los paquetes instalados con pip --user, que es donde pip los pone
 * en un Python instalado para todos, y el alumno los instalaba y el motor
 * seguia diciendo que faltaban. -E no lee las variables PYTHON* y -P no carga
 * nada de la carpeta del script ni de la actual. Asi el comando de instalacion
 * que se imprime (comandoInstalar) es para ese mismo Python, el que revisa
 * verificar.
 */
const SCRIPT_TAPAR_HUECOS = fileURLToPath(new URL('./tapar-huecos.py', import.meta.url));
/** Los paquetes que necesita tapar-huecos.py, con su nombre de pip (pillow, numpy). */
const PAQUETES_ICONOS = PAQUETES_PYTHON.iconos.map(([, pip]) => pip);

/** Una toma H que copia su frame inicial de una referencia ("frame_inicial" con id). */
const copiaSuFrame = (t) => t.tipo === 'H' && typeof t.frame_inicial === 'string' && t.frame_inicial.trim().length > 0;

// ---------------------------------------------------------------- plan

/** Convierte el manifiesto en una lista plana de imagenes a generar, en orden. */
export function construirPlan(m, { soloTomas } = {}) {
  const trabajos = [];

  // Anuncio por bloques (UGC tipo R): sus hojas se generan con un modelo
  // propio (ver MODELO_IMAGEN_UGC en config.js) y el de siempre de respaldo.
  // Sin tomas R, los trabajos salen exactamente igual que antes.
  const hayR = (m.tomas || []).some((t) => t.tipo === 'R');

  // Estilo con modelo de imagen propio (ver MODELO_IMAGEN_POR_ESTILO en
  // config.js, hoy solo estilo-lego): TODAS sus imagenes llevan esa cascada y
  // sus resoluciones. Un estilo que no esta en la tabla queda en {} y sus
  // trabajos salen exactamente igual que antes.
  const delEstilo = Object.hasOwn(MODELO_IMAGEN_POR_ESTILO, m.estilo ?? '') ? MODELO_IMAGEN_POR_ESTILO[m.estilo] : {};

  // Con continuidad no hay B-roll: una hoja generada que SOLO usaba el B-roll
  // descartado (continuidad.broll_descartado) no tiene quien la use y no se
  // genera. Sin continuidad no se salta ninguna.
  const soloDelDescartado = tieneContinuidad(m) ? referenciasSoloDelBrollDescartado(m) : null;

  // Las referencias generadas van PRIMERO, todas, en el orden de la lista.
  // Las aportadas por el usuario no se generan: ya existen en disco.
  for (const r of listaDeReferencias(m).filter(esGenerada)) {
    if (soloDelDescartado?.has(r.id)) continue;
    // Una hoja se genera desde su prompt y nada mas... SALVO que declare
    // `generar_desde_archivo: true`, y entonces entra tambien la foto del
    // usuario como imagen de partida.
    //
    // Que la referencia se pida por su PROPIO id no es un truco: cuando este
    // trabajo corre, la clave ya tiene la URL de la foto subida (el bucle de
    // aportadas va antes que el de generadas, ver mas abajo en este archivo),
    // y recien se sobrescribe con la hoja cuando esta termina de generarse.
    const desdeArchivo = esHojaDesdeArchivo(r);
    // Una hoja tambien puede pedir OTRAS hojas que esten antes en la lista
    // (historias musicales, 2026-09-14: "protagonista_despues" se genera con
    // la hoja de "protagonista_antes" adjunta, para que sea la misma persona
    // con el cambio fisico). Las hojas se generan en orden, una por una, asi
    // que la anterior ya tiene URL cuando le toca a esta. El validador exige
    // ese orden.
    const otrasHojas = Array.isArray(r.referencias) ? r.referencias.filter((x) => x !== r.id) : [];
    trabajos.push({
      id: r.id,
      clase: 'referencia',
      archivo: archivoDeHoja(r),
      prompt: r.prompt,
      referencias: [...(desdeArchivo ? [r.id] : []), ...otrasHojas],
      descripcion:
        `hoja de referencia "${r.id}"${r.tipo ? ` (${r.tipo})` : ''}` +
        (desdeArchivo ? ` — generada A PARTIR DE ${r.archivo}` : '') +
        (otrasHojas.length ? ` — con ${otrasHojas.join(', ')} como referencia` : '') +
        ' — se reusa en todas las tomas que la pidan',
      ...(hayR
        ? {
            cascada: [MODELO_IMAGEN_UGC, MODELOS.imagen.principal],
            resoluciones: { [MODELO_IMAGEN_UGC]: RESOLUCION_IMAGEN_UGC },
          }
        : delEstilo),
    });
  }

  const tomas = soloTomas ? m.tomas.filter((t) => soloTomas.includes(t.n)) : m.tomas;

  // QUE REFERENCIAS SOBREVIVEN AL FRAME FINAL DE UNA TOMA TIPO B.
  //
  // Se distinguen por su ORIGEN, no por su "tipo": el tipo es descriptivo y el
  // motor no ramifica por el. Hay tres origenes y DOS de ellos
  // se conservan, por razones distintas:
  //
  //   1. La foto real del usuario (solo `archivo`)  -> SE CONSERVA.
  //      No arrastra encuadre, y su fidelidad es lo unico que se degrada al
  //      regenerar.
  //   2. La hoja generada desde un prompt (solo `prompt`) -> SE SACA.
  //      Suele ser un plano medio; mandada al frame final, el modelo arrastra
  //      ese encuadre y devuelve al personaje en la misma pose. Ese es todo
  //      el motivo de esta regla.
  //   3. La hoja generada DESDE la foto (`generar_desde_archivo: true`)
  //      -> SE CONSERVA, y esto es una decision, no un efecto lateral de que
  //      la entrada tenga un `archivo`. Esa hoja existe justamente para fijar
  //      la apariencia del personaje entre tomas; sacarla del frame final
  //      seria quitarla del unico frame donde mas se nota que se mueva (los
  //      dos extremos del mismo clip).
  //
  // Para cualquier manifiesto que NO use el caso 3 este conjunto es identico
  // al de antes: esFotoDelUsuario() coincide con esAportada() cuando no hay
  // ninguna hoja-desde-archivo declarada.
  const conservaEnFrameFinal = new Set(
    listaDeReferencias(m)
      .filter((r) => esFotoDelUsuario(r) || esHojaDesdeArchivo(r))
      .map((r) => r.id)
  );

  for (const t of tomas) {
    // Bloque UGC tipo R: solo referencias, cero frames. El video se pide con
    // las hojas y la foto del producto como image_urls (generar-videos.js):
    // aqui no hay nada que generar para esta toma.
    if (t.tipo === 'R') continue;

    if (copiaSuFrame(t)) {
      // Toma hablada (H) con "frame_inicial": el frame inicial ES esa
      // referencia, tal cual (podcast: "host-a" / "host-b"; o una foto
      // aportada). Se copia img/<id>.png (hoja) o la foto convertida a png con
      // ffmpeg. Cuesta cero: no entra en el costo ni pide confirmacion. Si la
      // hoja aun no existe en esta corrida, se genera primero (todas las hojas
      // van antes que las tomas) y recien despues se copia, igual que los
      // heredados. Las referencias ya estan dentro de esa imagen; al video de
      // una H nunca van (Omni no acepta frame inicial y referencias a la vez).
      const ref = listaDeReferencias(m).find((r) => r.id === t.frame_inicial);
      const origen = ref ? archivoDeReferencia(ref) : null;
      trabajos.push({
        id: `toma-${t.n}-inicial`,
        clase: 'copia-de-referencia',
        n: t.n,
        archivo: `toma-${t.n}-inicial.png`,
        // Relativo a la carpeta del anuncio (img/host-a.png, producto.jpg).
        copiarDe: origen,
        copiarDeId: t.frame_inicial,
        prompt: null,
        referencias: [],
        descripcion:
          `toma ${t.n} (H) frame inicial — copia de la referencia "${t.frame_inicial}"` +
          `${origen ? ` (${origen})` : ''} (no se genera, no se paga)`,
      });
    } else if (t.frame_inicial === 'heredado') {
      // Regla 4 de la skill de UGC: el frame inicial NO se genera, es el frame
      // final de la escena anterior. Se copia el archivo tal cual: cuesta cero
      // y garantiza continuidad exacta.
      trabajos.push({
        id: `toma-${t.n}-inicial`,
        clase: 'heredado',
        n: t.n,
        archivo: `toma-${t.n}-inicial.png`,
        copiarDe: `toma-${t.n - 1}-final.png`,
        copiarDeId: `toma-${t.n - 1}-final`,
        prompt: null,
        referencias: [],
        descripcion: `toma ${t.n} frame inicial — heredado de la toma ${t.n - 1} (no se genera, no se paga)`,
      });
    } else {
      trabajos.push({
        id: `toma-${t.n}-inicial`,
        clase: 'toma',
        n: t.n,
        archivo: `toma-${t.n}-inicial.png`,
        prompt: t.prompt_imagen_inicial,
        referencias: t.referencias || [],
        descripcion: `toma ${t.n} (${t.tipo}) frame inicial`,
        ...delEstilo,
      });
    }

    if (t.tipo === 'B') {
      // QUE REFERENCIA LLEVA EL FRAME FINAL. No es un detalle.
      //
      // El frame inicial de la escena va SIEMPRE (regla 10.4 de la skill): es
      // lo que hace que el final sea una evolucion de esa misma toma.
      //
      // En dialogo_nativo, ademas, se filtran las referencias segun su origen:
      // que se conserva y que se saca esta razonado arriba, en
      // `conservaEnFrameFinal`. En resumen: la hoja generada solo desde un
      // prompt se saca porque arrastra su encuadre al frame final y lo deja
      // estatico; la foto del usuario y la hoja generada desde esa foto se
      // conservan.
      //
      // No tocar en voz_en_off: ahi la hoja en el frame final acerto 40 de 40
      // imagenes en el piloto de crochet, y esa rama pasa la lista entera.
      const heredadas =
        m.modo_audio === 'dialogo_nativo'
          ? (t.referencias || []).filter((r) => conservaEnFrameFinal.has(r))
          : [...(t.referencias || [])];

      trabajos.push({
        id: `toma-${t.n}-final`,
        clase: 'toma',
        n: t.n,
        archivo: `toma-${t.n}-final.png`,
        prompt: t.prompt_imagen_final,
        referencias: [...heredadas, 'frame_inicial_de_esta_toma'],
        descripcion: `toma ${t.n} (B) frame final`,
        ...delEstilo,
      });
    }
  }

  const brolls = soloTomas ? (m.broll || []).filter((b) => soloTomas.includes(tomaDelBroll(b))) : m.broll || [];
  for (const b of brolls) {
    trabajos.push({
      id: `broll-${b.n}`,
      clase: 'broll',
      n: b.n,
      archivo: `broll-${b.n}.png`,
      prompt: b.prompt_imagen,
      referencias: b.referencias || [],
      descripcion: `B-roll ${b.n} (toma ${tomaDelBroll(b)})`,
      ...delEstilo,
    });
  }

  // Iconos (entrevista; solo en ESTILOS_HABLADOS): un trabajo por icono de
  // cada grupo, archivo img/<id>.png, con MODELO_IMAGEN_ICONOS (gpt-image-2) a
  // 1K, cuadrado y con fondo transparente. De respaldo,
  // el modelo de siempre: ese ignora el fondo, y por eso el montaje mira
  // "transparente" en log-modelos.json y mete el icono en una tarjeta blanca
  // si hace falta. Con --tomas, solo los grupos que van sobre esas tomas.
  // Fuera de estos estilos no hay iconos y esto no agrega nada.
  if (ESTILOS_HABLADOS.includes(m.estilo)) {
    const grupos = (Array.isArray(m.iconos) ? m.iconos : []).filter(
      (g) => g && typeof g === 'object' && (!soloTomas || soloTomas.includes(g.toma))
    );
    for (const g of grupos) {
      for (const ic of Array.isArray(g.iconos) ? g.iconos : []) {
        if (!ic || typeof ic.id !== 'string' || !ic.id.trim()) continue;
        trabajos.push({
          id: ic.id,
          clase: 'icono',
          grupo: g.grupo,
          toma: g.toma,
          archivo: `${ic.id}.png`,
          prompt: ic.prompt,
          referencias: [],
          descripcion: `icono "${ic.id}" (grupo "${g.grupo}", toma ${g.toma}) — 1:1, fondo transparente`,
          cascada: [MODELO_IMAGEN_ICONOS, MODELOS.imagen.principal],
          resoluciones: { [MODELO_IMAGEN_ICONOS]: RESOLUCION_IMAGEN_ICONOS, [MODELOS.imagen.principal]: RESOLUCION },
          aspectRatio: '1:1',
          fondo: 'transparente',
        });
      }
    }
  }

  return trabajos;
}

// ---------------------------------------------------------------- copias y transparencia

/**
 * Convierte una imagen (jpg, webp...) a PNG con ffmpeg, gratis. Escribe a un
 * temporal y despues renombra: una imagen a medio escribir nunca queda en img/.
 */
function convertirAPng(origen, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const tmp = path.join(path.dirname(destino), `.${path.basename(destino, '.png')}.tmp.png`);
  try {
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', origen, '-frames:v', '1', tmp], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    const detalle = String(e.stderr || e.message || '').trim().split(/\r?\n/).slice(-2).join(' ');
    throw new Error(`no pude convertir ${path.basename(origen)} a png (ffmpeg: ${detalle})`);
  }
  if (!fs.existsSync(tmp) || fs.statSync(tmp).size === 0) {
    fs.rmSync(tmp, { force: true });
    throw new Error(`ffmpeg no devolvio ninguna imagen al convertir ${path.basename(origen)} a png`);
  }
  fs.renameSync(tmp, destino);
  return destino;
}

/**
 * Toma H con "frame_inicial": deja en img/toma-N-inicial.png la imagen de su
 * referencia (trabajo.copiarDe, relativo a la carpeta del anuncio). Una hoja ya
 * es png y se copia; una foto aportada se convierte con ffmpeg. Si habia una
 * copia anterior, va a historial/. Solo archivos: no sube nada ni cobra nada.
 * Devuelve la ruta del archivo escrito.
 */
export function copiarFrameDeReferencia(trabajo, { carpeta, dirImg }) {
  if (!trabajo.copiarDe) {
    throw new Error(
      `${trabajo.descripcion}: la referencia "${trabajo.copiarDeId}" no esta en la lista de referencias, o no es una hoja (prompt) ni una foto (archivo).`
    );
  }
  const origen = path.join(carpeta, trabajo.copiarDe);
  if (!fs.existsSync(origen)) {
    throw new Error(
      `${trabajo.descripcion}: no encuentro ${trabajo.copiarDe}.\n` +
        '  Si es una hoja generada, se genera en esta misma corrida antes que las tomas (sin limitar con --tomas no puede faltar);\n' +
        '  si es una foto, dejala lista con preparar-producto.js.'
    );
  }
  const destino = path.join(dirImg, trabajo.archivo);
  archivarSiExiste(destino, carpeta);
  if (path.extname(origen).toLowerCase() === '.png') fs.copyFileSync(origen, destino);
  else convertirAPng(origen, destino);
  return destino;
}

/**
 * Mide si un PNG trae transparencia REAL (iconos): ffmpeg
 * lo pasa a rgba (un PNG sin canal alfa queda con alfa 255 en todo), extrae
 * el alfa (alphaextract) y signalstats da su minimo (YMIN). Un fondo
 * transparente deja pixeles en 0; por debajo de ALFA_TRANSPARENTE_MAX cuenta.
 *
 * Nunca lanza: si ffmpeg falla o no se puede leer, devuelve transparente:
 * false con el motivo (el montaje lo muestra en tarjeta blanca y listo).
 * Devuelve { transparente, alfaMinimo (0-255 o null), error? }.
 */
export function medirTransparencia(rutaPng) {
  try {
    const r = spawnSync(
      'ffmpeg',
      ['-hide_banner', '-nostdin', '-i', rutaPng, '-vf', 'format=rgba,alphaextract,signalstats,metadata=print:key=lavfi.signalstats.YMIN:file=-', '-f', 'null', '-'],
      { encoding: 'utf8' }
    );
    const salida = `${r.stdout || ''}\n${r.stderr || ''}`;
    const mm = salida.match(/lavfi\.signalstats\.YMIN=(\d+)/);
    if (!mm) {
      const detalle = String(r.stderr || r.error?.message || '').trim().split(/\r?\n/).filter(Boolean).slice(-1)[0] || 'ffmpeg no devolvio YMIN';
      return { transparente: false, alfaMinimo: null, error: detalle };
    }
    const alfaMinimo = Number(mm[1]);
    return { transparente: alfaMinimo < ALFA_TRANSPARENTE_MAX, alfaMinimo };
  } catch (e) {
    return { transparente: false, alfaMinimo: null, error: e.message };
  }
}

/** La ultima linea de stdout que sea un objeto JSON (lo que imprime tapar-huecos.py), o null. */
function ultimoJson(texto) {
  const lineas = String(texto || '').trim().split(/\r?\n/).reverse();
  for (const l of lineas) {
    if (!l.trim().startsWith('{')) continue;
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Iconos con huecos (solo clase icono, que solo existe en los
 * estilos hablados): gpt-image-2 a veces deja una mancha SEMITRANSPARENTE
 * dentro de la figura (el centro de un sol, el cielo de una luna) y sobre el
 * video se ve la calle a traves. produccion/tapar-huecos.py la rellena con el
 * color de alrededor; no toca los huecos totalmente transparentes (pueden ser a
 * proposito: un anillo, un asa) ni las zonas translucidas grandes respecto de
 * la figura (las informa). El detalle del algoritmo esta en el script.
 *
 * Si tapo algo, la imagen tal como vino del modelo va a
 * historial/<nombre>-sin-tapar--<fecha>.png y la tapada queda en su lugar (el
 * script escribe a un temporal y aca se renombra: nunca queda una imagen a
 * medio escribir en img/).
 *
 * Nunca lanza: sin Python o sin sus paquetes (Pillow, numpy) el icono queda
 * como vino y se devuelve huecosTapados: null con el motivo. Se usa UN solo
 * Python, el de buscarPython() (el mismo que revisa npm run verificar y para
 * el que se imprime el comando de instalacion): si ese no tiene los paquetes,
 * no se prueba otro.
 * Devuelve { huecosTapados (pixeles; 0 = no habia; null = no se pudo revisar),
 * sinTapar? (relativo a la carpeta del anuncio), regiones?, respetadas?, error? }.
 */
export function taparHuecosIcono(rutaPng, carpeta) {
  const dir = path.dirname(rutaPng);
  const base = path.basename(rutaPng, path.extname(rutaPng));
  const tmp = path.join(dir, `.${base}.tapado.tmp.png`);
  try {
    const python = buscarPython();
    if (!python) {
      return { huecosTapados: null, error: `no encontre Python 3 instalado; probe ${CANDIDATOS_PYTHON.map((p) => p.join(' ')).join(', ')}` };
    }
    const nombre = comandoPython(python);
    fs.rmSync(tmp, { force: true });
    const r = spawnSync(python.cmd, [...python.pre, ...python.banderas, SCRIPT_TAPAR_HUECOS, rutaPng, tmp], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 180000,
    });
    if (r.error) return { huecosTapados: null, error: `${nombre}: ${r.error.message}` };
    const res = ultimoJson(r.stdout);
    if (!res) {
      // Sin JSON: el script no llego a responder (se corto o fallo antes).
      const detalle = String(r.stderr || r.stdout || '').trim().split(/\r?\n/).filter(Boolean).slice(-1)[0];
      return { huecosTapados: null, error: `"${nombre}" no respondio (codigo ${r.status}${detalle ? `: ${detalle.slice(0, 160)}` : ''})` };
    }
    // Sin Pillow o numpy (res.faltan) u otro error del script.
    if (res.error) return { huecosTapados: null, error: `${nombre}: ${res.error}` };
    const tapados = Number(res.pixelesTapados) || 0;
    const respetadas = Array.isArray(res.respetadas) ? res.respetadas : [];
    if (tapados <= 0) return { huecosTapados: 0, respetadas };
    if (!fs.existsSync(tmp)) return { huecosTapados: null, error: `${nombre}: dijo que tapo ${tapados} pixeles pero no dejo la imagen` };
    // Primero la copia sin tapar en historial/, despues la tapada en su lugar:
    // si algo falla a la mitad, img/ sigue teniendo un icono entero.
    const historial = path.join(carpeta, 'historial');
    fs.mkdirSync(historial, { recursive: true });
    const sello = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const sinTapar = path.join(historial, `${base}-sin-tapar--${sello}.png`);
    fs.copyFileSync(rutaPng, sinTapar);
    try {
      fs.renameSync(tmp, rutaPng);
    } catch (e) {
      fs.rmSync(sinTapar, { force: true });
      throw e;
    }
    return {
      huecosTapados: tapados,
      sinTapar: path.relative(carpeta, sinTapar).split(path.sep).join('/'),
      regiones: Array.isArray(res.tapadas) ? res.tapadas : [],
      respetadas,
    };
  } catch (e) {
    return { huecosTapados: null, error: e.message };
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/** Campos de img/log-modelos.json de un icono: huecos (taparHuecosIcono) y transparencia (medirTransparencia). */
function camposDeIcono(huecos, transparencia) {
  return {
    ...(huecos
      ? {
          huecosTapados: huecos.huecosTapados,
          ...(huecos.sinTapar ? { sinTapar: huecos.sinTapar, huecosRegiones: huecos.regiones } : {}),
          ...(huecos.respetadas?.length ? { huecosRespetados: huecos.respetadas } : {}),
          ...(huecos.error ? { huecosError: huecos.error } : {}),
        }
      : {}),
    ...(transparencia
      ? {
          transparente: transparencia.transparente,
          alfaMinimo: transparencia.alfaMinimo,
          ...(transparencia.error ? { transparenciaError: transparencia.error } : {}),
        }
      : {}),
  };
}

/** Lo que se dice de los huecos de un icono en la linea "OK" de la corrida. */
function textoDeHuecos(huecos) {
  if (!huecos) return '';
  if (huecos.huecosTapados === null) return '  [OJO: no pude revisar si tiene huecos]';
  const cuantos = (motivo) => (huecos.respetadas || []).filter((h) => h.motivo === motivo).length;
  return [
    huecos.huecosTapados > 0 ? `[hueco(s) tapado(s): ${huecos.huecosTapados} px; sin tapar en ${huecos.sinTapar}]` : '',
    cuantos('grande') ? `[OJO: ${cuantos('grande')} zona(s) translucida(s) grande(s) sin tapar: miralo]` : '',
    cuantos('transparente') ? `[${cuantos('transparente')} hueco(s) totalmente transparente(s): no se tocan]` : '',
  ]
    .filter(Boolean)
    .map((s) => `  ${s}`)
    .join('');
}

// ---------------------------------------------------------------- Google Flow
//
// Esta copia NO genera contra kie.ai: el codigo que subia las referencias y
// pedia cada imagen a kie.ai se saco (sigue en el sistema original). Aqui se
// traduce el plan a la cola de Flow (TrabajoFlow, ver produccion/flow/flow.js)
// y se hacen las copias locales cuyo origen ya esta en disco.

/**
 * Modelo de Flow y calidad de descarga de un trabajo del plan. Lo que en kie.ai
 * iba a 2K (GPT Image 2.5 Sunburst: las hojas de un anuncio con tomas R, ver
 * MODELO_IMAGEN_UGC, y todas las imagenes de los estilos de
 * MODELO_IMAGEN_POR_ESTILO: estilo-lego, podcast, entrevista) va con
 * FLOW.imagen.alta a 2K; todo lo demas, iconos incluidos, con
 * FLOW.imagen.principal a 1K. El respaldo es el otro de los dos.
 */
function modeloFlowDe(trabajo) {
  const primero = trabajo.cascada?.[0];
  return primero && trabajo.resoluciones?.[primero] === '2K'
    ? { modelo: FLOW.imagen.alta, respaldo: FLOW.imagen.principal, calidad: '2K' }
    : { modelo: FLOW.imagen.principal, respaldo: FLOW.imagen.alta, calidad: '1K' };
}

/**
 * Iconos en Flow: Flow no entrega PNG con transparencia, asi que se piden sobre
 * verde croma y flow:recibir saca el verde. Esto va al FINAL del prompt, en el
 * idioma del prompt.
 */
const FONDO_VERDE = {
  es:
    'Fondo liso de un solo color, verde croma puro (#00FF00), parejo en todo el cuadro: sin sombras, sin degradados, ' +
    'sin texturas ni reflejos. El icono no usa ese verde en ninguna parte; si algo del icono es verde, que sea de otro ' +
    'tono, bien distinto del fondo.',
  en:
    'Plain solid background in a single pure chroma key green (#00FF00), even across the whole frame: no shadows, ' +
    'no gradients, no textures or reflections. The icon itself does not use that green anywhere; if something in the ' +
    'icon is green, make it a clearly different shade from the background.',
};

/**
 * El pedido de fondo transparente de un prompt de icono, en espanol o en ingles,
 * sin la preposicion que lo introduce: "fondo transparente", "fondo 100%
 * transparente", "fondo: transparente", "PNG transparente", "sin fondo
 * (transparente)", "transparent background", "background transparent",
 * "transparent PNG"... "Un vaso transparente" no entra: tiene que decir fondo
 * (o PNG).
 */
const MUY = String.raw`(?:totalmente\s+|completamente\s+|fully\s+|completely\s+|100\s*%\s+)?`;
const NUCLEO_FONDO = [
  String.raw`\bfondo(?:\s*:\s*|\s+es\s+|\s+)${MUY}transparente(?:\s*\(png\))?`,
  String.raw`\b(?:formato\s+|archivo\s+)?png\s+(?:con\s+fondo\s+)?${MUY}transparente`,
  String.raw`\bsin\s+fondo\s*\((?:png\s+)?transparente\)`,
  String.raw`${MUY}\btransparent\s+(?:png\s+)?background(?:\s*\(png\))?`,
  String.raw`\bbackground(?:\s*:\s*|\s+is\s+|\s+)${MUY}transparent\b`,
  String.raw`\btransparent\s+png(?:\s+(?:file|format))?\b`,
].join('|');
/** Lo que lo introduce: "aislado sobre un", "con el", "isolated on a", "as a", "with the"... */
const ANTES_DEL_FONDO =
  String.raw`(?:\b(?:aislad[oa]s?|isolated)\s+)?` +
  String.raw`(?:\b(?:sobre|con|en|de|como|on|over|against|with|in|as)\s+)?` +
  String.raw`(?:\b(?:un|una|el|a|an|the)\s+)?`;
/** El pedido entero, con lo que lo introduce y el "y" que lo une a lo que sigue. "sin fondo" solo al final de una frase. */
const FONDO_TRANSPARENTE = new RegExp(
  '(?:' +
    [`${ANTES_DEL_FONDO}(?:${NUCLEO_FONDO})`, String.raw`\bsin\s+fondo(?=\s*$)`, String.raw`\bno\s+background(?=\s*$)`].join('|') +
    String.raw`)(?:\s+(?:y|e|and)(?=\s))?`,
  'gi'
);
/**
 * "con fondo transparente y contorno blanco" / "with a transparent background
 * and a white outline": el "con"/"with" es de lo que sigue, asi que queda
 * ("con contorno blanco", "with a white outline").
 */
const FONDO_TRANSPARENTE_UNIDO = new RegExp(
  String.raw`\b(con|with)\s+(?:(?:un|una|el|a|an|the)\s+)?(?:${NUCLEO_FONDO})\s+(?:y|e|and)\s+`,
  'gi'
);
/**
 * Lo que sigue pareciendo un pedido de transparencia despues de limpiar el
 * prompt (una forma de decirlo que la limpieza no conoce): fondo/background/PNG
 * y "transparen..." en la misma frase, o "sin fondo" / "no background".
 */
const QUEDA_TRANSPARENCIA =
  /\b(?:fondo|background|png)\b[^.,;]{0,40}transparen|transparen\w*[^.,;]{0,40}\b(?:fondo|background|png)\b|\bsin\s+fondo\b|\bno\s+background\b/i;

/** "es" o "en": el idioma del prompt, por sus palabras mas comunes (empate = espanol, el de las skills). */
function idiomaDe(texto) {
  const cuenta = (re) => (String(texto).match(re) || []).length;
  const es = cuenta(/\b(?:de|del|la|el|los|las|con|sin|sobre|una|un|y|que|para|por)\b/gi);
  const en = cuenta(/\b(?:the|of|with|without|on|and|an|for|that|from|its)\b/gi);
  return en > es ? 'en' : 'es';
}

const conMayuscula = (s) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

/**
 * El prompt de un icono para Flow: sin el pedido de fondo transparente y con
 * la instruccion de fondo verde croma al final. Se parte en frases (hasta cada
 * coma, punto o punto y coma), se saca la frase que solo pedia el fondo (o
 * solo esas palabras, si la frase dice algo mas) y se arreglan la puntuacion y
 * la mayuscula que quedan. Todo lo demas del prompt queda tal cual.
 *
 *   "...alrededor de toda la figura, sobre fondo transparente, sin texto, ..."
 *   "...alrededor de toda la figura, sin texto, ... Cuadrado 1:1. Fondo liso de un solo color, verde croma puro (#00FF00)..."
 */
export function promptIconoFlow(prompt) {
  const original = String(prompt ?? '');
  // Partes y separadores alternados: [parte, espacio, parte, espacio, ...].
  const piezas = original.split(/(?<=[,.;])(\s+)/);
  const salida = []; // { sep, cuerpo, fin }
  let capitalizar = false;
  for (let i = 0; i < piezas.length; i += 2) {
    const parte = piezas[i];
    const sep = i > 0 ? piezas[i - 1] : '';
    const fin = /[,.;]$/.test(parte) ? parte.slice(-1) : '';
    const cuerpo = fin ? parte.slice(0, -1) : parte;
    const quitado = cuerpo.replace(FONDO_TRANSPARENTE_UNIDO, '$1 ').replace(FONDO_TRANSPARENTE, ' ');
    if (quitado === cuerpo) {
      salida.push({ sep, cuerpo: capitalizar ? conMayuscula(cuerpo) : cuerpo, fin });
      capitalizar = false;
      continue;
    }
    const empiezaOracion = salida.length === 0 || salida[salida.length - 1].fin === '.';
    const limpio = quitado
      .replace(/\s{2,}/g, ' ')
      .trim()
      .replace(/^(?:y|e|and)\s+/i, '')
      .replace(/\s+(?:y|e|and)$/i, '');
    if (/\p{L}/u.test(limpio)) {
      // La frase dice algo mas: solo se sacan esas palabras.
      const mayuscula = capitalizar || (empiezaOracion && /^\p{Lu}/u.test(cuerpo.trim()));
      salida.push({ sep, cuerpo: mayuscula ? conMayuscula(limpio) : limpio, fin });
      capitalizar = false;
      continue;
    }
    // La frase entera era el pedido de fondo: se saca. Si cerraba la oracion,
    // ahora la cierra la frase anterior.
    const previa = salida[salida.length - 1];
    if ((fin === '.' || fin === '') && previa && previa.fin !== '.') previa.fin = '.';
    if (empiezaOracion) capitalizar = true;
  }
  const limpio = salida
    .map((p, i) => (i === 0 ? '' : p.sep) + p.cuerpo + p.fin)
    .join('')
    .trim();
  if (/#00FF00/i.test(limpio)) return limpio;
  return `${limpio}${/[.!?]$/.test(limpio) ? ' ' : limpio ? '. ' : ''}${FONDO_VERDE[idiomaDe(original)]}`;
}

/** true si un prompt de icono ya limpio (promptIconoFlow) todavia parece pedir fondo transparente. */
export function quedaTransparencia(prompt) {
  return QUEDA_TRANSPARENCIA.test(String(prompt ?? ''));
}

const OJO_TRANSPARENCIA =
  'OJO: el prompt todavia parece pedir fondo transparente en una forma que no se pudo sacar sola; ' +
  'corrige esa frase en el manifiesto (el fondo verde lo agrega el motor) y vuelve a correr npm run imagenes antes de generarlo';

/**
 * Donde esta cada referencia de un trabajo, relativa a la carpeta del anuncio,
 * EN EL ORDEN del trabajo. Es la misma semantica con la que se armaban las URLs
 * para kie.ai, pero con archivos:
 *
 *   id de la lista               su hoja (img/<id>.png) o la foto aportada
 *   el propio id de una hoja generada desde archivo   su foto de partida
 *                                (en kie.ai, la URL de la foto subida)
 *   frame_inicial_de_esta_toma   img/toma-N-inicial.png
 *   frame_anterior               el archivo del trabajo anterior del plan,
 *                                sin contar las hojas (en kie.ai,
 *                                ctx.urlUltimoFrame: lo fijaba cada frame,
 *                                copia o B-roll al terminar, y las hojas no)
 *
 * Devuelve [{ rel, etiqueta }]. Lanza si el trabajo pide algo que no existe en
 * el manifiesto (el validador ya no deberia dejarlo pasar).
 */
function rutasDeReferencias(trabajo, { lista, anteriorDe }) {
  return trabajo.referencias.map((r) => {
    if (r === 'frame_anterior') {
      const previo = anteriorDe.get(trabajo.id);
      if (!previo) throw new Error(`${trabajo.id} pide el frame anterior pero no hay ningun frame antes en el plan`);
      return { rel: `img/${previo.archivo}`, etiqueta: `frame anterior (${previo.archivo})` };
    }
    if (r === 'frame_inicial_de_esta_toma') {
      return { rel: `img/toma-${trabajo.n}-inicial.png`, etiqueta: 'frame inicial de esta toma' };
    }
    const ref = lista.find((x) => x.id === r);
    if (ref && trabajo.clase === 'referencia' && r === trabajo.id && esAportada(ref)) {
      return { rel: ref.archivo, etiqueta: `${r} (foto de partida ${ref.archivo})` };
    }
    if (ref && (esGenerada(ref) || esLugarDeToma(ref))) {
      return { rel: `img/${archivoDeHoja(ref)}`, etiqueta: `${r} (${esLugarDeToma(ref) ? 'lugar' : 'hoja'})` };
    }
    if (ref && esAportada(ref)) return { rel: ref.archivo, etiqueta: `${r} (foto ${ref.archivo})` };
    throw new Error(
      `${trabajo.id} pide la referencia "${r}" y no esta en la lista de referencias (o no tiene ni "prompt" ni "archivo").\n` +
        `  Referencias de la lista: ${lista.map((x) => x.id).join(', ') || '(ninguna)'}`
    );
  });
}

/** Un trabajo del plan como TrabajoFlow (produccion/flow/flow.js). `refs` sale de rutasDeReferencias. */
function trabajoFlow(t, refs, { carpeta, aspectRatio }) {
  const archivo = `img/${t.archivo}`;
  const { modelo, respaldo, calidad } = modeloFlowDe(t);
  // Iconos: en kie.ai iban con fondo transparente; en Flow, sobre verde croma.
  const verde = t.fondo === 'transparente';
  const descripcion = verde ? t.descripcion.replace('fondo transparente', 'sobre verde croma (flow:recibir lo vuelve transparente)') : t.descripcion;
  const prompt = verde ? promptIconoFlow(t.prompt) : t.prompt;
  const ojo = verde && quedaTransparencia(prompt) ? `. ${OJO_TRANSPARENCIA}` : '';
  return {
    id: t.id,
    archivo,
    descarga: nombreDescarga(carpeta, archivo),
    clase: 'imagen',
    modo: 'imagen',
    modelo,
    respaldo,
    prompt,
    referencias: refs.map((r) => path.resolve(carpeta, r.rel)),
    frame_inicial: null,
    frame_final: null,
    duracion: null,
    duracion_pedida: null,
    exacta: false,
    proporcion: t.aspectRatio || aspectRatio,
    calidad_descarga: calidad,
    habla: false,
    sin_sonido: false,
    fondo: verde ? 'verde' : null,
    nota: descripcion + (refs.length ? `. Referencias en orden: ${refs.map((r, i) => `${i + 1}) ${r.etiqueta}`).join(', ')}` : '') + ojo,
  };
}

/**
 * Arma la cola de imagenes de Flow a partir del plan (ya sin lo que existe en
 * img/), en el orden del plan:
 *
 *  - Copias locales (frame heredado, frame inicial de una toma H copiado de su
 *    referencia): si el origen existe se hacen aca mismo, sin Flow, y van a
 *    "hechos" (y su entrada a `log`, como siempre); si no, a "bloqueados".
 *  - Todo lo demas: si sus referencias existen va a "trabajos" (lo que Claude
 *    genera ahora en Flow); si falta alguna, a "bloqueados" con lo que espera.
 *
 * Cuenta como existente lo que esta en disco y lo que esta misma corrida acaba
 * de copiar; lo que va a la cola todavia no existe, asi que lo que depende de
 * ello espera a la vuelta siguiente.
 *
 * `simular: true` (--solo-plan) no escribe nada: las copias cuyo origen existe
 * solo cuentan como hechas. `faltan` (opcional) son rutas relativas que se
 * cuentan como inexistentes aunque esten en disco (--rehacer con --solo-plan).
 * Devuelve { trabajos, bloqueados, hechos, log }.
 */
export function colaDeImagenes(plan, { carpeta, manifiesto, simular = false, faltan = null, log = [] }) {
  const dirImg = path.join(carpeta, 'img');
  const aspectRatio = manifiesto.aspect_ratio || '9:16';
  const lista = listaDeReferencias(manifiesto);

  // El "frame anterior" de cada trabajo sale del plan COMPLETO (sin --tomas),
  // asi --tomas N tambien encuentra el de la toma N-1. Las hojas no cuentan.
  const anteriorDe = new Map();
  let previo = null;
  for (const t of construirPlan(manifiesto)) {
    if (t.clase === 'referencia') continue;
    anteriorDe.set(t.id, previo);
    previo = t;
  }

  const hechosAhora = new Set();
  const existe = (rel) => hechosAhora.has(rel) || (!faltan?.has(rel) && fs.existsSync(path.join(carpeta, rel)));
  const trabajos = [];
  const bloqueados = [];
  const hechos = [];

  for (const t of plan) {
    const archivo = `img/${t.archivo}`;

    if (t.clase === 'heredado' || t.clase === 'copia-de-referencia') {
      if (!t.copiarDe) {
        throw new Error(
          `${t.descripcion}: la referencia "${t.copiarDeId}" no esta en la lista de referencias, o no es una hoja (prompt) ni una foto (archivo).`
        );
      }
      const origen = t.clase === 'heredado' ? `img/${t.copiarDe}` : t.copiarDe;
      if (!existe(origen)) {
        bloqueados.push({ id: t.id, archivo, espera: [origen] });
        continue;
      }
      if (!simular) {
        if (t.clase === 'heredado') {
          // Regla 4 de la skill de UGC: el frame final de la toma anterior, tal cual.
          const destino = path.join(dirImg, t.archivo);
          archivarSiExiste(destino, carpeta);
          fs.copyFileSync(path.join(dirImg, t.copiarDe), destino);
          log.push({ id: t.id, archivo: t.archivo, modelo: null, heredadoDe: t.copiarDe, creditos: 0 });
        } else {
          copiarFrameDeReferencia(t, { carpeta, dirImg });
          log.push({ id: t.id, archivo: t.archivo, modelo: null, copiaDe: t.copiarDe, referencia: t.copiarDeId, creditos: 0 });
        }
      }
      hechosAhora.add(archivo);
      hechos.push(`${archivo}  (${t.clase === 'heredado' ? `heredado de ${origen}` : `copia de ${origen}`})`);
      continue;
    }

    const refs = rutasDeReferencias(t, { lista, anteriorDe });
    const espera = [...new Set(refs.map((r) => r.rel).filter((rel) => !existe(rel)))];
    if (espera.length) {
      bloqueados.push({ id: t.id, archivo, espera });
      continue;
    }
    trabajos.push(trabajoFlow(t, refs, { carpeta, aspectRatio }));
  }

  return { trabajos, bloqueados, hechos, log };
}

/**
 * img/log-modelos.json en esta copia lo escriben dos: este script (las copias
 * locales, con las mismas entradas de siempre) y flow:recibir (lo que llega de
 * Flow, con modelo "flow:<modelo>"). Por eso nunca se reescribe entero: cada
 * entrada nueva reemplaza a la del mismo archivo y todas las demas quedan tal
 * cual. Si el log existe y no se puede leer, no se toca (se avisa): perder lo
 * que anoto flow:recibir (la transparencia de los iconos) es peor que no
 * anotar una copia.
 */
function fusionarLog(dirImg, entradas) {
  if (!entradas.length) return;
  const ruta = path.join(dirImg, 'log-modelos.json');
  let anterior = {};
  if (fs.existsSync(ruta)) {
    try {
      anterior = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    } catch (e) {
      console.log(`\n  OJO: no pude leer img/log-modelos.json (${e.message}); no lo toco y las copias de esta corrida no quedan anotadas.`);
      return;
    }
  }
  if (!anterior || typeof anterior !== 'object' || Array.isArray(anterior)) anterior = {};
  const previas = Array.isArray(anterior.imagenes) ? anterior.imagenes : [];
  const clave = (x) => path.basename(String(x?.archivo ?? ''));
  const nuevas = new Set(entradas.map(clave));
  const imagenes = [...previas.filter((x) => !nuevas.has(clave(x))), ...entradas];
  fs.writeFileSync(ruta, JSON.stringify({ ...anterior, generado: new Date().toISOString(), imagenes }, null, 2) + '\n', 'utf8');
}

// ---------------------------------------------------------------- CLI

// El cuerpo del CLI va en una funcion para poder salir con "return" en vez de
// process.exit() (que en Windows con Node 24 aborta si queda algo abierto).
if (process.argv[1] && process.argv[1].endsWith('generar-imagenes.js')) await cli();

/**
 * Al final de la corrida: que iconos tenian huecos y se taparon, cuales tienen
 * una zona translucida grande que no se toco, y cuales no se pudieron revisar
 * (sin Python o sin sus paquetes), con como arreglarlo sin volver a pagar.
 */
function avisarHuecos(entradas, carpetaArg) {
  const tapados = entradas.filter((x) => x.huecosTapados > 0);
  if (tapados.length) {
    console.log(`\n  Huecos tapados en ${tapados.length} icono(s): el modelo dejo partes semitransparentes dentro de la figura.`);
    console.log('  La imagen tal como vino quedo en historial/:');
    for (const x of tapados) console.log(`      ${x.archivo}: ${x.huecosTapados} px (sin tapar: ${x.sinTapar})`);
  }
  const grandes = entradas.filter((x) => (x.huecosRespetados || []).some((h) => h.motivo === 'grande'));
  if (grandes.length) {
    console.log(`\n  OJO: ${grandes.length} icono(s) con una zona translucida GRANDE dentro de la figura, que no se tapo`);
    console.log('  (puede ser parte del dibujo, como un vaso, o un hueco del modelo). Miralos; si es un hueco, regeneralos:');
    for (const x of grandes) console.log(`      ${x.archivo}`);
  }
  const vacios = entradas.filter((x) => (x.huecosRespetados || []).some((h) => h.motivo === 'transparente'));
  if (vacios.length) {
    console.log(`\n  ${vacios.length} icono(s) con un hueco TOTALMENTE transparente dentro de la figura, que no se toca porque`);
    console.log('  suele ser a proposito (un anillo, el asa de una taza). Si en alguno no lo es, regeneralo:');
    for (const x of vacios) console.log(`      ${x.archivo}`);
  }
  const sinRevisar = entradas.filter((x) => x.huecosTapados === null);
  if (sinRevisar.length) {
    console.log(`\n  OJO: no pude revisar si ${sinRevisar.length} icono(s) tienen huecos (${sinRevisar[0].huecosError || 'sin detalle'}):`);
    for (const x of sinRevisar) console.log(`      ${x.archivo}`);
    // El comando de instalacion, para el MISMO Python que se uso (buscarPython:
    // "py -3 -m pip ..." si ese es el que hay). Si ese Python ya tiene los dos
    // paquetes, el problema es otro (el error de arriba) y no se manda a instalar.
    const python = buscarPython();
    const faltan = python ? paquetesQueFaltan(python, PAQUETES_PYTHON.iconos) : null;
    if (!python) {
      console.log('  Para taparlos hace falta Python 3 con Pillow y numpy. Instalalo desde https://www.python.org/downloads/');
      console.log(`  (marca "Add python.exe to PATH"), abre otra terminal y despues: ${comandoInstalar(null, PAQUETES_ICONOS)}`);
      console.log('  Comprueba con  npm run verificar  (seccion 8) y despues, sin generar ni cobrar nada:');
    } else if (faltan === null || faltan.length) {
      console.log(`  Para taparlos hace falta Python 3 con Pillow y numpy: ${comandoInstalar(python, faltan?.length ? faltan : PAQUETES_ICONOS)}`);
      console.log('  (dentro de un entorno virtual, sin --user). Comprueba con  npm run verificar  (seccion 8) y despues,');
      console.log('  sin generar ni cobrar nada:');
    } else {
      console.log(`  ${comandoPython(python)} ya tiene Pillow y numpy: el problema es el de arriba. Cuando lo arregles, sin generar ni cobrar nada:`);
    }
    console.log(`  node produccion/generar-imagenes.js ${carpetaArg} --tapar-huecos`);
  }
}

/**
 * Como siempre: estado.json anota la hoja de cada referencia ya generada (las
 * que solo usaba el B-roll descartado de continuidad, `sinUso`, no).
 */
function anotarHojas(carpeta, manifiesto, sinUso) {
  for (const r of listaDeReferencias(manifiesto).filter(esGenerada)) {
    if (sinUso.has(r.id)) continue;
    const rel = `img/${archivoDeHoja(r)}`;
    if (fs.existsSync(path.join(carpeta, rel)) && hojaDeReferencia(carpeta, r.id) !== rel) anotarHojaDeReferencia(carpeta, r.id, rel);
  }
}

/**
 * --tapar-huecos: tapa los huecos de los iconos que YA estan en img/, sin
 * generar nada ni armar ninguna cola. Para un icono que llego (flow:recibir)
 * cuando faltaba Python, o antes de que existiera este paso. Vuelve a
 * medir la transparencia y actualiza la entrada de cada icono en
 * img/log-modelos.json (si no tenia, la agrega); el resto del log no cambia.
 * Un icono ya tapado no vuelve a cambiar (el script no le encuentra huecos) y
 * conserva lo que se anoto cuando se tapo.
 */
function taparHuecosEnDisco(carpeta, manifiesto, soloTomas, carpetaArg) {
  console.log(`\n=== Huecos de los iconos — ${path.basename(carpeta)} (no genera ni cobra nada) ===\n`);
  if (!ESTILOS_HABLADOS.includes(manifiesto.estilo)) {
    console.log(`  El estilo "${manifiesto.estilo}" no tiene iconos. Nada que hacer.\n`);
    return;
  }
  const dirImg = path.join(carpeta, 'img');
  const iconos = construirPlan(manifiesto, { soloTomas }).filter((t) => t.clase === 'icono');
  if (!iconos.length) {
    console.log('  El manifiesto no tiene iconos. Nada que hacer.\n');
    return;
  }
  const rutaLog = path.join(dirImg, 'log-modelos.json');
  let registro = null;
  try {
    registro = fs.existsSync(rutaLog) ? JSON.parse(fs.readFileSync(rutaLog, 'utf8')) : null;
  } catch {
    registro = null;
  }
  if (!registro || typeof registro !== 'object' || !Array.isArray(registro.imagenes)) registro = { generado: new Date().toISOString(), imagenes: [] };

  const paraAvisar = [];
  for (const t of iconos) {
    const ruta = path.join(dirImg, t.archivo);
    if (!fs.existsSync(ruta)) {
      console.log(`  --  ${t.archivo}: no esta en img/ (se pide en la cola de Flow con npm run imagenes, y flow:recibir le tapa los huecos)`);
      continue;
    }
    const huecos = taparHuecosIcono(ruta, carpeta);
    const transparencia = medirTransparencia(ruta);
    let e = registro.imagenes.find((x) => x && x.archivo === t.archivo);
    if (!e) {
      e = { id: t.id, archivo: t.archivo, modelo: null, creditos: 0 };
      registro.imagenes.push(e);
    }
    // Ya tapado antes y ahora sin nada que tapar (o sin poder revisarlo): se
    // conserva lo anotado entonces (cuantos pixeles, donde quedo el original).
    const conservar = e.huecosTapados > 0 && !(huecos.huecosTapados > 0);
    for (const k of ['transparenciaError', ...(conservar ? [] : ['huecosTapados', 'sinTapar', 'huecosRegiones', 'huecosRespetados', 'huecosError'])]) delete e[k];
    Object.assign(e, camposDeIcono(conservar ? null : huecos, transparencia));
    if (!conservar) paraAvisar.push(e);
    const fondo = transparencia.transparente ? '  [fondo transparente]' : '  [SIN transparencia real: ira en tarjeta blanca]';
    const estado = conservar ? `  [ya estaba tapado: ${e.huecosTapados} px; sin tapar en ${e.sinTapar}]` : textoDeHuecos(huecos) || '  [sin huecos]';
    console.log(`  OK  ${t.archivo}${fondo}${estado}`);
  }
  fs.writeFileSync(rutaLog, JSON.stringify(registro, null, 2) + '\n', 'utf8');
  avisarHuecos(paraAvisar, carpetaArg);
  console.log('\n  Detalle por icono en img/log-modelos.json\n');
}

async function cli() {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  const soloPlan = args.includes('--solo-plan');
  const rehacer = args.includes('--rehacer');
  const idxTomas = args.indexOf('--tomas');
  const soloTomas =
    idxTomas !== -1 && args[idxTomas + 1]
      ? args[idxTomas + 1].split(',').map((s) => Number(s.trim())).filter(Number.isInteger)
      : null;

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/generar-imagenes.js <carpeta-del-anuncio> [--tomas 1,12] [--solo-plan] [--rehacer] [--tapar-huecos]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const rutaManifiesto = path.join(carpeta, 'manifiesto.json');
  if (!fs.existsSync(rutaManifiesto)) {
    console.error(`\n  No encuentro el manifiesto: ${rutaManifiesto}\n`);
    process.exit(1);
  }

  // --tapar-huecos: solo los iconos que ya estan en disco. No genera nada.
  if (args.includes('--tapar-huecos')) {
    taparHuecosEnDisco(carpeta, JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8')), soloTomas, carpetaArg);
    return;
  }

  // Las imagenes en Flow no piden ninguna clave (ni KIE_API_KEY, ni saldo, ni
  // confirmacion: cuestan 0 creditos). El .env se lee solo por FLOW_DESCARGAS
  // (la carpeta de descargas, ver flow.js); sin .env vale la de siempre.
  try {
    cargarEnv();
  } catch {
    // sin .env: las descargas van a la carpeta Descargas del usuario
  }

  const manifiesto = JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8'));

  // Puerta de entrada: si el manifiesto esta mal, no se arma ninguna cola.
  const { errores } = validarManifiesto(manifiesto, { carpeta });
  if (errores.length) {
    console.error('\n  El manifiesto tiene errores. No armo nada hasta que se arreglen:\n');
    for (const e of errores) console.error(`  ERROR  ${e}`);
    console.error('');
    process.exit(1);
  }

  const dirImg = path.join(carpeta, 'img');
  const aspectRatio = manifiesto.aspect_ratio || '9:16';

  let plan = construirPlan(manifiesto, { soloTomas });

  // Lo que ya esta en img/ esta hecho y no se vuelve a pedir.
  const yaHechos = plan.filter((t) => fs.existsSync(path.join(dirImg, t.archivo)));
  if (!rehacer && yaHechos.length) plan = plan.filter((t) => !fs.existsSync(path.join(dirImg, t.archivo)));

  // Los frames heredados y las copias de referencia de las tomas H se copian,
  // no se generan: no van a Flow.
  const aGenerar = plan.filter((t) => t.clase !== 'heredado' && t.clase !== 'copia-de-referencia');
  const heredados = plan.filter((t) => t.clase === 'heredado');
  const copias = plan.filter((t) => t.clase === 'copia-de-referencia');
  const hayBloquesR = manifiesto.tomas.some((t) => t.tipo === 'R');
  // Estilo hablado (podcast, entrevista): copias de referencia e iconos.
  const hablado = ESTILOS_HABLADOS.includes(manifiesto.estilo);

  console.log(`\n=== Imagenes para Google Flow — ${path.basename(carpeta)} ===\n`);
  if (soloTomas) console.log(`  Limitado a las tomas: ${soloTomas.join(', ')}\n`);
  if (hayBloquesR) {
    console.log('  Anuncio por bloques (tomas R): los bloques no llevan frames.');
    console.log('  Aqui solo se generan las hojas de los personajes; el producto es la foto real.\n');
  }
  if (hablado) {
    console.log(`  Estilo ${manifiesto.estilo} (tomas habladas, H): el frame inicial de una toma con "frame_inicial" es la`);
    console.log('  imagen de esa referencia copiada tal cual (sin Flow); el resto de frames se genera como siempre.');
    if (plan.some((t) => t.clase === 'icono')) {
      console.log('  Los iconos se piden en Flow cuadrados (1:1) sobre verde croma (#00FF00) en vez de fondo transparente;');
      console.log('  flow:recibir les saca el verde.');
    }
    console.log('');
  }
  // Continuidad: sin B-roll, y sin las hojas que solo usaba el B-roll descartado.
  const sinUso = tieneContinuidad(manifiesto) ? referenciasSoloDelBrollDescartado(manifiesto) : new Set();
  if (tieneContinuidad(manifiesto)) {
    const guardados = Array.isArray(manifiesto.continuidad?.broll_descartado) ? manifiesto.continuidad.broll_descartado.length : 0;
    console.log(`  Continuidad: sin B-roll (${guardados} guardado(s) en continuidad.broll_descartado, que no se generan).`);
    if (sinUso.size) console.log(`  Tampoco se generan las hojas que solo usaba ese B-roll: ${[...sinUso].join(', ')}.`);
    console.log('');
  }

  if (yaHechos.length && !rehacer) {
    console.log(`  Ya estan en img/ (no se vuelven a pedir): ${yaHechos.length}`);
    for (const t of yaHechos) console.log(`      ${t.archivo}`);
    console.log('');
  }

  if (plan.length === 0) {
    console.log('  No hay nada que generar. Todo listo.');
    if (soloPlan) {
      console.log('\n  --solo-plan: no se escribio la cola ni se toco nada.\n');
      return;
    }
    // La ultima hoja pudo llegar con flow:recibir despues de la vuelta anterior.
    anotarHojas(carpeta, manifiesto, sinUso);
    // La cola vacia igual se escribe: asi flow:recibir sabe que no queda nada pendiente.
    fs.mkdirSync(dirImg, { recursive: true });
    const vacia = { trabajos: [], bloqueados: [], hechos: [] };
    const ruta = escribirCola(carpeta, 'imagenes', { ...vacia, aspectRatio });
    imprimirCola(carpeta, 'imagenes', vacia);
    console.log(`  Cola vacia en ${path.relative(process.cwd(), ruta) || ruta}\n`);
    return;
  }

  console.log('  Se van a generar:');
  for (const t of plan) console.log(`      ${t.archivo.padEnd(24)} ${t.descripcion}`);

  console.log(
    `\n  Imagenes:  ${aGenerar.length} para Google Flow` +
      (heredados.length ? ` + ${heredados.length} heredada(s)` : '') +
      (copias.length ? ` + ${copias.length} copiada(s) de su referencia` : '') +
      (heredados.length || copias.length ? ' (se copian solas, sin Flow)' : '')
  );
  // Una linea por modelo de Flow, con cuantas imagenes van con el y su respaldo.
  const porModelo = new Map();
  for (const t of aGenerar) {
    const f = modeloFlowDe(t);
    const k = `${f.modelo} a ${f.calidad}`;
    const e = porModelo.get(k) || { n: 0, iconos: 0, respaldo: f.respaldo };
    e.n++;
    if (t.fondo === 'transparente') e.iconos++;
    porModelo.set(k, e);
  }
  let primera = true;
  for (const [k, e] of porModelo) {
    const iconos = e.iconos ? ` (${e.iconos} icono(s), 1:1 sobre verde croma)` : '';
    console.log(`  ${primera ? 'Modelo:   ' : '          '} ${k}: ${e.n} imagen(es)${iconos}; si falla, respaldo: ${e.respaldo}`);
    primera = false;
  }
  console.log('  Costo:     0 creditos (las imagenes en Google Flow no cobran)\n');

  if (soloPlan) {
    // Lo que saldria si se corriera ahora, sin copiar ni escribir nada.
    try {
      const faltan = rehacer ? new Set(plan.map((t) => `img/${t.archivo}`)) : null;
      const vista = colaDeImagenes(plan, { carpeta, manifiesto, simular: true, faltan });
      console.log('  Si se armara la cola ahora:');
      console.log(`      a Google Flow en esta vuelta:   ${vista.trabajos.length}`);
      console.log(`      esperan a otros archivos:       ${vista.bloqueados.length}`);
      console.log(`      se copian solas, sin Flow:      ${vista.hechos.length}`);
      console.log('\n  --solo-plan: no se escribio la cola ni se toco nada.\n');
    } catch (e) {
      console.error(`\n  SE DETUVO\n\n  ${e.message}\n`);
      process.exitCode = 1;
    }
    return;
  }

  fs.mkdirSync(dirImg, { recursive: true });

  // --rehacer: lo que ya estaba pasa a historial/ (como siempre) y vuelve a la
  // cola. Se archiva AHORA y no al recibir lo nuevo: si no, la vuelta siguiente
  // veria el archivo viejo como hecho, y lo que depende de el se pediria con
  // la imagen vieja.
  if (rehacer) {
    const archivados = [];
    for (const t of plan) {
      const a = archivarSiExiste(path.join(dirImg, t.archivo), carpeta);
      if (a) archivados.push(`${t.archivo} -> historial/${path.basename(a)}`);
    }
    if (archivados.length) {
      console.log(`  --rehacer: ${archivados.length} imagen(es) anteriores pasaron a historial/ y se vuelven a pedir:`);
      for (const x of archivados) console.log(`      ${x}`);
      console.log('  En las vueltas siguientes (despues de flow:recibir) corre SIN --rehacer: si no, vuelve a archivar lo recien llegado.');
    }
  }

  const log = [];
  try {
    const { trabajos, bloqueados, hechos } = colaDeImagenes(plan, { carpeta, manifiesto, log });
    fusionarLog(dirImg, log);

    anotarHojas(carpeta, manifiesto, sinUso);

    escribirCola(carpeta, 'imagenes', { trabajos, bloqueados, hechos, aspectRatio });
    imprimirCola(carpeta, 'imagenes', { trabajos, bloqueados, hechos });

    for (const t of trabajos.filter((x) => x.fondo === 'verde' && quedaTransparencia(x.prompt))) {
      console.log(`\n  OJO: el prompt de ${t.archivo} todavia parece pedir fondo transparente (no se pudo sacar solo).`);
      console.log('  Corrige esa frase en el manifiesto (el fondo verde lo agrega el motor) y vuelve a correr antes de generarlo.');
    }

    // Lo que espera un archivo que esta corrida no genera (quedo fuera de
    // --tomas, o lo produce otro paso) no va a salir solo en la vuelta siguiente.
    const enEstaCorrida = new Set(plan.map((t) => `img/${t.archivo}`));
    const sueltos = bloqueados.flatMap((b) => b.espera.filter((e) => !enEstaCorrida.has(e)).map((e) => `${b.archivo} espera ${e}`));
    if (sueltos.length) {
      console.log('\n  OJO: esto espera archivos que esta corrida no genera (fuera de --tomas, o los produce otro paso):');
      for (const x of sueltos) console.log(`      ${x}`);
      console.log('  No va a salir solo: corre sin --tomas o incluye esas tomas.');
    }
    console.log('');
  } catch (e) {
    fusionarLog(dirImg, log);
    console.error(`\n  SE DETUVO\n\n  ${e.message}\n`);
    if (log.length) console.error(`  Se alcanzaron a copiar ${log.length} imagen(es) sin Flow. Al volver a correr, esas no se repiten.\n`);
    process.exitCode = 1;
  }
}
