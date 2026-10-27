// Rehace una toma que no quedo bien. Dos modos, los dos con el mismo principio:
// NUNCA se reintenta el mismo prompt. Si una toma salio mal, el problema casi
// siempre esta en la instruccion, no en la suerte. Repetirla da lo mismo otra vez.
//
//   Paso 1 — ver el contexto para escribir prompts nuevos:
//     node produccion/rehacer-toma.js temp/mi-anuncio --toma 14 --contexto
//
//   Paso 2 — aplicar los prompts nuevos (los escribe Claude, tu los apruebas):
//     node produccion/rehacer-toma.js temp/mi-anuncio --toma 14 --aplicar nuevos.json
//
// Lo que NUNCA cambia: la linea del guion, la duracion y el tipo de toma. Eso
// esta atado al audio y al montaje. Solo cambian los prompts de imagen y video.
//
// BLOQUES UGC (tipo R, solo referencias, sin frames) — otra logica:
//
//   Rehacer el bloque tal cual (salio con otra cara, con texto, apurado...):
//     node produccion/rehacer-toma.js temp/mi-anuncio 3
//   Ahi SI se regenera con el mismo prompt: en R el texto ya se reviso contra
//   el guion y lo que falla suele ser la tirada, no la instruccion. Si el
//   manifiesto se edito a mano (por un rechazo de Omni), se valida antes.
//
//   --aplicar en R exige solo prompt_video. Si Omni rechazo el bloque por
//   politicas, ademas puede traer "linea" y "tramos": es el unico caso en que
//   se reescribe el copy, solo de ese bloque, con su misma funcion y largo.
//
//   En los dos casos se saca de video/ solo el clip (a historial/, no se
//   pierde) y su recorte de cola toma-N.cola.json, si existe. No hay imagenes
//   que borrar: un bloque R no tiene frames. SALVO que el bloque sea el origen
//   de un lugar repetido ("de_toma": N): ese fotograma (img/<id>.png) salio del
//   clip viejo, asi que tambien va a historial/ (el motor lo vuelve a sacar
//   del clip nuevo) y se avisa que bloques y ganchos lo usaban, para revisarlos.
//   No se regeneran solos.
//
//   Un gancho alternativo (gancho-<id>.mp4), igual:
//     node produccion/rehacer-toma.js temp/mi-anuncio --gancho 1b
//   Valida el manifiesto, saca a historial/ el clip del gancho (y su recorte
//   de cola, si lo hubiera) y deja el comando para regenerarlo:
//     npm run videos -- temp/mi-anuncio --ganchos
//
// TOMAS HABLADAS (tipo H, podcast y entrevista) — como una A:
//
//     node produccion/rehacer-toma.js temp/mi-anuncio --toma 2 --contexto
//     node produccion/rehacer-toma.js temp/mi-anuncio --toma 2 --aplicar nuevos.json
//
//   --contexto muestra ademas lo que se dice en el clip ("lineas" del guion en
//   podcast, "dialogo" en entrevista, "reacciones" en el clip de reacciones),
//   de donde sale su imagen y, en la entrevista, sus "ingredientes" (las
//   imagenes que recibe el video, en orden). --aplicar: con "frame_inicial" (la
//   imagen es una referencia copiada tal cual) no hay imagen que rehacer, solo
//   prompt_video; sin el, prompt_imagen_inicial y prompt_video como en una A.
//   Nunca prompt_imagen_final. Puede traer "ingredientes" (la lista nueva, en
//   el orden en que el prompt nombra las imagenes); si no viene, se conservan
//   los de la toma. El clip va a historial/ (y la imagen, si se rehace), y
//   tambien lo que salio de el: el original de la voz en off
//   (video/originales/toma-N.*, de recortar-voz) y el host recortado
//   (video/recorte-toma-N.webm y su entrada en recorte.json). Se quita su
//   entrada de lineas-habladas.json: hay que volver a medir el clip nuevo con
//   `npm run lineas -- <carpeta> --tomas N` (y, en una toma "solo_voz",
//   recortar la voz de ESA toma, `npm run voz -- <carpeta> --tomas N`, y medir
//   otra vez). Solo tras un rechazo de contenido de Omni el archivo puede traer
//   tambien el copy nuevo de ESA toma ("linea" y, con ella, "lineas" en
//   podcast — se actualiza el mismo texto en "guion" — o "dialogo" en
//   entrevista); se valida antes de escribir.

import fs from 'node:fs';
import path from 'node:path';
import { listaDeReferencias, esGenerada, esLugarDeToma, archivoDeHoja, tomaDelBroll, archivoDeIngrediente } from './referencias.js';
import { validarManifiesto } from './validar-manifiesto.js';
import { archivarSiExiste } from './historial.js';
import { carpetaDeVariante } from './variante-gancho.js';
import { tieneContinuidad } from './continuidad.js';
import { sacarDerivadosDeTomaH, entradaQuitada } from './generar-videos.js';

/** Todo lo que hace falta para reescribir los prompts de una toma. */
export function contextoDeToma(manifiesto, n) {
  const toma = manifiesto.tomas.find((t) => t.n === n);
  if (!toma) throw new Error(`La toma ${n} no existe en el manifiesto.`);

  const i = manifiesto.tomas.indexOf(toma);
  const anterior = manifiesto.tomas[i - 1] || null;
  const siguiente = manifiesto.tomas[i + 1] || null;
  const broll = (manifiesto.broll || []).find((b) => tomaDelBroll(b) === n) || null;

  // Bloque R: lo que importa son sus tramos (y los ganchos que lo reemplazan).
  const extraR =
    toma.tipo === 'R'
      ? {
          tramos: toma.tramos || [],
          ganchos: (manifiesto.ganchos_alternativos || []).filter((g) => g.reemplaza === n),
          // Lugares repetidos: los que usa (fotograma de otro bloque) y los que
          // salen de este bloque (y quien los usa).
          lugares: listaDeReferencias(manifiesto).filter(esLugarDeToma),
          origenDe: listaDeReferencias(manifiesto)
            .filter((r) => esLugarDeToma(r) && r.de_toma === n)
            .map((r) => ({ id: r.id, segundo: r.segundo, usan: quienesUsanLugar(manifiesto, r.id, { excepto: n }) })),
        }
      : {};

  // Toma hablada (H): que se dice en el clip (lineas del guion en podcast,
  // dialogo en entrevista, reacciones en el clip de reacciones), de donde sale
  // su imagen, sus ingredientes (entrevista: las imagenes que recibe el video,
  // en orden, con el archivo de cada una) y que va encima (B-roll, iconos).
  const extraH =
    toma.tipo === 'H'
      ? {
          hablada: {
            frame_inicial: typeof toma.frame_inicial === 'string' && toma.frame_inicial.trim() ? toma.frame_inicial : null,
            ingredientes:
              Array.isArray(toma.ingredientes) && toma.ingredientes.length
                ? toma.ingredientes.map((id) => ({ id, archivo: archivoDeIngrediente(manifiesto, n, id) }))
                : null,
            habla: toma.habla ?? null,
            fase: toma.fase ?? null,
            clase: toma.clase ?? null,
            solo_voz: toma.solo_voz === true,
            lineas: Array.isArray(toma.lineas) ? toma.lineas : null,
            dialogo: Array.isArray(toma.dialogo) ? toma.dialogo : null,
            reacciones: Array.isArray(toma.reacciones) ? toma.reacciones : null,
            brolls: (manifiesto.broll || []).filter((b) => b && tomaDelBroll(b) === n),
            iconos: (Array.isArray(manifiesto.iconos) ? manifiesto.iconos : []).filter((g) => g && g.toma === n),
          },
        }
      : {};

  return {
    ...extraR,
    ...extraH,
    toma,
    intencion: {
      linea: toma.linea,
      anterior: anterior ? anterior.linea : '(es la primera)',
      siguiente: siguiente ? siguiente.linea : '(es la ultima)',
    },
    fijo: { n: toma.n, tipo: toma.tipo, duracion: toma.duracion, referencias: toma.referencias },
    referencias: listaDeReferencias(manifiesto).filter(esGenerada).map((x) => ({ id: x.id, tipo: x.tipo, prompt: x.prompt })),
    producto: manifiesto.producto,
    broll,
  };
}

/**
 * Bloque R: saca de video/ el clip y su recorte de cola para que se
 * regeneren. El clip va a historial/ (costo plata: no se tira); el recorte de
 * cola se midio sobre ese clip y con uno nuevo ya no vale.
 */
export function sacarClipDeBloque(carpeta, n) {
  const sacados = [];
  for (const f of [path.join(carpeta, 'video', `toma-${n}.mp4`), path.join(carpeta, `toma-${n}.cola.json`)]) {
    if (archivarSiExiste(f, carpeta)) sacados.push(path.basename(f));
  }
  return sacados;
}

/**
 * Quien usa un lugar repetido (bloques y ganchos con su id en "referencias"),
 * sin contar al bloque `excepto`. Con `carpeta`, marca cuales ya tienen clip.
 */
function quienesUsanLugar(manifiesto, id, { excepto = null, carpeta = null } = {}) {
  const hecho = (archivo) => Boolean(carpeta) && fs.existsSync(path.join(carpeta, 'video', archivo));
  return [
    ...manifiesto.tomas
      .filter((t) => t.n !== excepto && (t.referencias || []).includes(id))
      .map((t) => ({ nombre: `bloque ${t.n}`, cmd: `${t.n}`, generado: hecho(`toma-${t.n}.mp4`) })),
    ...(Array.isArray(manifiesto.ganchos_alternativos) ? manifiesto.ganchos_alternativos : [])
      .filter((g) => (g?.referencias || []).includes(id))
      .map((g) => ({ nombre: `gancho ${g.id}`, cmd: `--gancho ${g.id}`, generado: hecho(`gancho-${g.id}.mp4`) })),
  ];
}

/**
 * Bloque R que es ORIGEN de un lugar repetido ("de_toma": n): su fotograma
 * (img/<id>.png) se saco del clip que se va a rehacer y ya no vale. Va a
 * historial/; el motor lo vuelve a sacar del clip nuevo cuando un bloque lo
 * necesite. Los que ya se generaron con el NO se tocan: se devuelven para
 * avisar. Devuelve [{ id, segundo, guardado (nombre en historial/ o null), usan }].
 */
export function sacarLugaresDeBloque(carpeta, manifiesto, n) {
  return listaDeReferencias(manifiesto)
    .filter((r) => esLugarDeToma(r) && r.de_toma === n)
    .map((r) => {
      const guardado = archivarSiExiste(path.join(carpeta, 'img', archivoDeHoja(r)), carpeta);
      return {
        id: r.id,
        segundo: r.segundo,
        guardado: guardado ? path.basename(guardado) : null,
        usan: quienesUsanLugar(manifiesto, r.id, { excepto: n, carpeta }),
      };
    });
}

/**
 * Continuidad: los pasos que tocan las imagenes de la toma n — el que llega a
 * ella (sale de la toma anterior en el array) y el que sale de ella. Sus
 * prompts se escribieron mirando esas imagenes. Devuelve
 * [{ de, a, archivo, paso (el objeto del manifiesto, o null si no esta escrito) }].
 */
export function pasosDeToma(manifiesto, n) {
  const tomas = manifiesto.tomas || [];
  const i = tomas.findIndex((t) => t.n === n);
  if (i === -1) return [];
  const pasos = Array.isArray(manifiesto.continuidad?.pasos) ? manifiesto.continuidad.pasos : [];
  const pares = [];
  if (i > 0) pares.push([tomas[i - 1].n, n]);
  if (i < tomas.length - 1) pares.push([n, tomas[i + 1].n]);
  return pares.map(([de, a]) => ({
    de,
    a,
    archivo: `paso-${de}.mp4`,
    paso: pasos.find((p) => p && typeof p === 'object' && p.de === de) ?? null,
  }));
}

/**
 * Continuidad, al rehacer las imagenes de la toma n: los pasos que llegan a
 * ella y salen de ella quedan con "revisar": true, porque su prompt se
 * escribio mirando la imagen vieja (mientras este, los videos no arrancan).
 * Marca sobre `manifiesto`, que se escribe despues. Devuelve los pasos que
 * tocan la toma, escritos o no, para archivar sus clips.
 */
function marcarPasosDeToma(manifiesto, n) {
  const pasos = pasosDeToma(manifiesto, n);
  for (const x of pasos) if (x.paso) x.paso.revisar = true;
  return pasos;
}

/** Continuidad: los clips de esos pasos van a historial/ (no se pierden). */
function archivarPasos(carpeta, pasos) {
  return pasos.filter((x) => archivarSiExiste(path.join(carpeta, 'video', x.archivo), carpeta)).map((x) => x.archivo);
}

/** Los errores que dejaria el manifiesto, sin escribir nada. */
function erroresDe(manifiesto, carpeta) {
  return validarManifiesto(manifiesto, { carpeta }).errores;
}

/**
 * Bloque R: rehacerlo con lo que hay en el manifiesto (que pudo editarse a
 * mano tras un rechazo). Valida primero: si el manifiesto quedo mal, no se
 * saca nada.
 */
export function rehacerBloque(carpeta, n) {
  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  const toma = manifiesto.tomas.find((t) => t.n === n);
  if (!toma) throw new Error(`La toma ${n} no existe en el manifiesto.`);
  if (toma.tipo !== 'R') throw new Error(`La toma ${n} es Tipo ${toma.tipo}, no un bloque R.`);
  const errores = erroresDe(manifiesto, carpeta);
  if (errores.length) {
    throw new Error(
      'El manifiesto tiene errores; no saco nada hasta que se arreglen:\n' + errores.map((e) => `  ERROR  ${e}`).join('\n')
    );
  }
  return { sacados: sacarClipDeBloque(carpeta, n), lugares: sacarLugaresDeBloque(carpeta, manifiesto, n) };
}

/**
 * Gancho alternativo: rehacerlo con lo que hay en el manifiesto (que pudo
 * editarse a mano tras un rechazo). Mismas protecciones que rehacerBloque: el
 * gancho tiene que existir y el manifiesto validar sin errores (entre otras
 * cosas, que reemplace a un bloque R); si no, no se saca nada.
 *
 * Saca a historial/ gancho-<id>.mp4 y su recorte de cola, si lo hubiera
 * (gancho-<id>.cola.json). Hoy el corte de cola de un gancho se mide en la
 * carpeta de su variante (<carpeta>-gancho-<id>/), que no se toca: se rearma
 * entera con `ugc:gancho --reemplazar` cuando el clip nuevo este listo.
 *
 * Devuelve { sacados, gancho, variante (ruta o null), tambienFaltan } —
 * `tambienFaltan`: otros clips que no estan en video/ y que `videos --ganchos`
 * generaria (y cobraria) en la misma corrida.
 */
export function rehacerGancho(carpeta, id) {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(String(id || ''))) {
    throw new Error(`"${id}" no es un id de gancho valido (por ejemplo: 1b).`);
  }
  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  const ganchos = Array.isArray(manifiesto.ganchos_alternativos) ? manifiesto.ganchos_alternativos : [];
  const gancho = ganchos.find((g) => String(g?.id) === String(id));
  if (!gancho) {
    throw new Error(
      ganchos.length
        ? `El manifiesto no tiene el gancho "${id}". Ganchos: ${ganchos.map((g) => g?.id).join(', ')}.`
        : 'El manifiesto no tiene "ganchos_alternativos": no hay ganchos que rehacer.'
    );
  }
  const errores = erroresDe(manifiesto, carpeta);
  if (errores.length) {
    throw new Error(
      'El manifiesto tiene errores; no saco nada hasta que se arreglen:\n' + errores.map((e) => `  ERROR  ${e}`).join('\n')
    );
  }

  const sacados = [];
  for (const f of [path.join(carpeta, 'video', `gancho-${gancho.id}.mp4`), path.join(carpeta, `gancho-${gancho.id}.cola.json`)]) {
    if (archivarSiExiste(f, carpeta)) sacados.push(path.basename(f));
  }

  const dirVideo = path.join(carpeta, 'video');
  const tambienFaltan = [
    ...manifiesto.tomas.map((t) => `toma-${t.n}.mp4`),
    ...ganchos.filter((g) => g !== gancho).map((g) => `gancho-${g.id}.mp4`),
  ].filter((f) => !fs.existsSync(path.join(dirVideo, f)));
  const variante = carpetaDeVariante(carpeta, gancho.id);
  return { sacados, gancho, variante: fs.existsSync(variante) ? variante : null, tambienFaltan };
}

/** --aplicar para un bloque R: solo prompt_video (y linea + tramos tras un rechazo). */
function aplicarEnBloque(carpeta, ruta, manifiesto, toma, nuevos, motivo) {
  if (!nuevos.prompt_video) {
    throw new Error(`La toma ${toma.n} es un bloque R: el archivo de prompts necesita "prompt_video".`);
  }
  if (nuevos.prompt_imagen_inicial || nuevos.prompt_imagen_final) {
    throw new Error(`La toma ${toma.n} es un bloque R (sin frames): no lleva prompt_imagen_inicial ni prompt_imagen_final.`);
  }

  const antes = { linea: toma.linea, tramos: toma.tramos, prompt_video: toma.prompt_video };
  toma.prompt_video = nuevos.prompt_video;
  if (nuevos.linea !== undefined) toma.linea = nuevos.linea;
  if (nuevos.tramos !== undefined) toma.tramos = nuevos.tramos;

  // Se valida ANTES de escribir: linea, tramos, "Duracion: Ns." y las lineas
  // dentro del prompt tienen que seguir cuadrando.
  const errores = erroresDe(manifiesto, carpeta);
  if (errores.length) {
    throw new Error(
      'Con esos cambios el manifiesto queda con errores; no escribi nada:\n' + errores.map((e) => `  ERROR  ${e}`).join('\n')
    );
  }

  const historial = path.join(carpeta, 'prompts-anteriores.json');
  const previo = fs.existsSync(historial) ? JSON.parse(fs.readFileSync(historial, 'utf8')) : { versiones: [] };
  previo.versiones.push({ fecha: new Date().toISOString(), toma: toma.n, tipo: 'R', motivo, ...antes });
  fs.writeFileSync(historial, JSON.stringify(previo, null, 2) + '\n', 'utf8');

  fs.writeFileSync(ruta, JSON.stringify(manifiesto, null, 2) + '\n', 'utf8');
  return {
    historial,
    borrados: sacarClipDeBloque(carpeta, toma.n),
    bloqueR: true,
    lugares: sacarLugaresDeBloque(carpeta, manifiesto, toma.n),
  };
}

/**
 * Toma hablada (H): quita su entrada de lineas-habladas.json (la medida de
 * donde cae cada linea se tomo sobre el clip viejo y con uno nuevo ya no
 * vale; `npm run lineas` la vuelve a escribir). Devuelve true si habia una.
 * Un archivo ilegible no frena el rehacer: se deja como esta.
 */
export function quitarMedidaDeToma(carpeta, n) {
  const ruta = path.join(carpeta, 'lineas-habladas.json');
  if (!fs.existsSync(ruta)) return false;
  let datos;
  try {
    datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch {
    return false;
  }
  if (!datos || typeof datos !== 'object' || !datos.tomas || typeof datos.tomas !== 'object' || !(String(n) in datos.tomas)) return false;
  delete datos.tomas[String(n)];
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n', 'utf8');
  return true;
}

/**
 * --aplicar para una toma hablada (H): como una A, con dos diferencias. Con
 * "frame_inicial" no hay imagen que rehacer (es la referencia copiada tal
 * cual): solo prompt_video. Y nunca prompt_imagen_final. Puede venir
 * "ingredientes" (entrevista: la lista nueva, en el orden en que el prompt
 * nombra las imagenes; null la quita y la toma vuelve a frame inicial); si no
 * viene, se conservan los de la toma. Tras un rechazo de contenido de Omni
 * puede venir ademas el copy nuevo de ESA toma: "linea" y, con ella, "lineas"
 * (podcast: el mismo texto se actualiza en "guion" por su orden) o "dialogo"
 * (entrevista). Se valida ANTES de escribir. Saca a historial/ el clip (y la
 * imagen, si se rehace) y lo que salio de el (sacarDerivadosDeTomaH: el
 * original de la voz en off y el host recortado), y quita su medida de
 * lineas-habladas.json.
 */
function aplicarEnTomaH(carpeta, ruta, manifiesto, toma, nuevos, motivo) {
  const n = toma.n;
  const conFrame = typeof toma.frame_inicial === 'string' && toma.frame_inicial.trim().length > 0;
  if (!nuevos.prompt_video) throw new Error(`La toma ${n} es hablada (H): el archivo de prompts necesita "prompt_video".`);
  if (nuevos.prompt_imagen_final) throw new Error(`La toma ${n} es hablada (H) y solo lleva frame inicial: no lleva prompt_imagen_final.`);
  if (conFrame) {
    if (nuevos.prompt_imagen_inicial) {
      throw new Error(
        `La toma ${n} toma su frame inicial de la referencia "${toma.frame_inicial}" (se copia, no se genera): no hay imagen que rehacer, solo "prompt_video".`
      );
    }
  } else if (!nuevos.prompt_imagen_inicial) {
    throw new Error(`La toma ${n} es hablada (H) sin "frame_inicial": el archivo de prompts necesita prompt_imagen_inicial y prompt_video.`);
  }

  const antes = {
    linea: toma.linea,
    ...(Array.isArray(toma.lineas) ? { lineas: toma.lineas } : {}),
    ...(Array.isArray(toma.dialogo) ? { dialogo: toma.dialogo } : {}),
    ...(Array.isArray(toma.ingredientes) ? { ingredientes: toma.ingredientes } : {}),
    prompt_imagen_inicial: toma.prompt_imagen_inicial,
    prompt_imagen_final: toma.prompt_imagen_final,
    prompt_video: toma.prompt_video,
  };
  toma.prompt_video = nuevos.prompt_video;
  if (!conFrame) toma.prompt_imagen_inicial = nuevos.prompt_imagen_inicial;
  // Ingredientes (entrevista): si vienen, reemplazan a los de la toma (el
  // prompt nuevo puede nombrar otras imagenes); null los quita. Si no vienen,
  // se conservan. El validador de abajo revisa la lista y el prompt.
  if (nuevos.ingredientes === null) delete toma.ingredientes;
  else if (nuevos.ingredientes !== undefined) toma.ingredientes = nuevos.ingredientes;

  // Copy nuevo (solo tras un rechazo de contenido). Podcast: cada linea vive
  // tambien en "guion" con su orden, y la "linea" de la toma es la union de
  // sus textos; entrevista: idem con "dialogo". Si no viene "linea", se arma.
  if (nuevos.lineas !== undefined) {
    toma.lineas = nuevos.lineas;
    const guion = Array.isArray(manifiesto.guion) ? manifiesto.guion : [];
    for (const l of Array.isArray(nuevos.lineas) ? nuevos.lineas : []) {
      const g = guion.find((x) => x && x.orden === l?.orden);
      if (g && typeof l.texto === 'string') g.texto = l.texto;
    }
    if (nuevos.linea === undefined && Array.isArray(nuevos.lineas)) toma.linea = nuevos.lineas.map((l) => l?.texto ?? '').join(' ');
  }
  if (nuevos.dialogo !== undefined) {
    toma.dialogo = nuevos.dialogo;
    if (nuevos.linea === undefined && Array.isArray(nuevos.dialogo)) toma.linea = nuevos.dialogo.map((d) => d?.texto ?? '').join(' ');
  }
  if (nuevos.linea !== undefined) toma.linea = nuevos.linea;

  // Se valida ANTES de escribir: linea, lineas/dialogo, guion y las frases
  // ancla de B-roll e iconos tienen que seguir cuadrando.
  const errores = erroresDe(manifiesto, carpeta);
  if (errores.length) {
    throw new Error(
      'Con esos cambios el manifiesto queda con errores; no escribi nada:\n' + errores.map((e) => `  ERROR  ${e}`).join('\n')
    );
  }

  const historial = path.join(carpeta, 'prompts-anteriores.json');
  const previo = fs.existsSync(historial) ? JSON.parse(fs.readFileSync(historial, 'utf8')) : { versiones: [] };
  previo.versiones.push({ fecha: new Date().toISOString(), toma: n, tipo: 'H', motivo, ...antes });
  fs.writeFileSync(historial, JSON.stringify(previo, null, 2) + '\n', 'utf8');

  fs.writeFileSync(ruta, JSON.stringify(manifiesto, null, 2) + '\n', 'utf8');

  // El clip (y la imagen, si se rehace) van a historial/: costaron plata. Con
  // "frame_inicial" la imagen es la referencia copiada y sigue valiendo. Lo
  // que salio del clip (el original de la voz en off, el host recortado)
  // tambien va, con su propio nombre.
  const borrados = [];
  for (const f of [...(conFrame ? [] : [path.join(carpeta, 'img', `toma-${n}-inicial.png`)]), path.join(carpeta, 'video', `toma-${n}.mp4`)]) {
    if (archivarSiExiste(f, carpeta)) borrados.push(path.basename(f));
  }
  // (sacarDerivadosDeTomaH nombra tambien las entradas que quito de
  // recorte.json y de lineas-habladas.json, que no son archivos de historial/.)
  const derivados = sacarDerivadosDeTomaH(carpeta, n);
  const entradaRecorte = entradaQuitada('recorte.json', n);
  const entradaMedida = entradaQuitada('lineas-habladas.json', n);
  return {
    historial,
    borrados: [...borrados, ...derivados.filter((d) => d !== entradaRecorte && d !== entradaMedida)],
    hablada: {
      conFrame,
      // Ya la quita sacarDerivadosDeTomaH; quitarMedidaDeToma queda por si acaso.
      medidaQuitada: derivados.includes(entradaMedida) || quitarMedidaDeToma(carpeta, n),
      soloVoz: toma.solo_voz === true,
      porIngredientes: Array.isArray(toma.ingredientes) && toma.ingredientes.length > 0,
      recorteQuitado: derivados.some((d) => d === entradaRecorte || d.startsWith(`recorte-toma-${n}--`)),
    },
  };
}

/**
 * Aplica prompts nuevos a una toma. Guarda los viejos por si hay que volver.
 * `nuevos` = { prompt_imagen_inicial, prompt_imagen_final, prompt_video }
 * (en un bloque R: { prompt_video } y, tras un rechazo, tambien linea y tramos;
 * en una toma H: ver aplicarEnTomaH)
 */
export function aplicarPrompts(carpeta, n, nuevos, { motivo = '' } = {}) {
  const ruta = path.join(carpeta, 'manifiesto.json');
  const manifiesto = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  const toma = manifiesto.tomas.find((t) => t.n === n);
  if (!toma) throw new Error(`La toma ${n} no existe.`);

  if (toma.tipo === 'R') return aplicarEnBloque(carpeta, ruta, manifiesto, toma, nuevos, motivo);
  if (toma.tipo === 'H') return aplicarEnTomaH(carpeta, ruta, manifiesto, toma, nuevos, motivo);

  if (!nuevos.prompt_imagen_inicial || !nuevos.prompt_video) {
    throw new Error('Faltan prompt_imagen_inicial o prompt_video en el archivo de prompts.');
  }
  if (toma.tipo === 'B' && !nuevos.prompt_imagen_final) {
    throw new Error(`La toma ${n} es Tipo B: necesita tambien prompt_imagen_final.`);
  }

  // Historial: nunca se pierde lo que habia antes.
  const historial = path.join(carpeta, 'prompts-anteriores.json');
  const previo = fs.existsSync(historial) ? JSON.parse(fs.readFileSync(historial, 'utf8')) : { versiones: [] };
  previo.versiones.push({
    fecha: new Date().toISOString(),
    toma: n,
    motivo,
    prompt_imagen_inicial: toma.prompt_imagen_inicial,
    prompt_imagen_final: toma.prompt_imagen_final,
    prompt_video: toma.prompt_video,
  });
  fs.writeFileSync(historial, JSON.stringify(previo, null, 2) + '\n', 'utf8');

  toma.prompt_imagen_inicial = nuevos.prompt_imagen_inicial;
  toma.prompt_imagen_final = toma.tipo === 'B' ? nuevos.prompt_imagen_final : null;
  toma.prompt_video = nuevos.prompt_video;

  // Continuidad: los pasos que llegan a esta toma y salen de ella se
  // escribieron mirando sus imagenes viejas.
  const pasosTocados = tieneContinuidad(manifiesto) ? marcarPasosDeToma(manifiesto, n) : null;

  fs.writeFileSync(ruta, JSON.stringify(manifiesto, null, 2) + '\n', 'utf8');

  // Se sacan los archivos viejos de esa toma para que se regeneren. En la
  // version Flow no se borran: van a historial/ (el clip costo creditos de
  // Flow y no queda otra copia local), igual que las tomas H.
  const borrados = [];
  for (const f of [
    path.join(carpeta, 'img', `toma-${n}-inicial.png`),
    path.join(carpeta, 'img', `toma-${n}-final.png`),
    path.join(carpeta, 'video', `toma-${n}.mp4`),
  ]) {
    if (archivarSiExiste(f, carpeta)) borrados.push(path.basename(f));
  }

  if (pasosTocados) {
    return {
      historial,
      borrados,
      continuidad: {
        marcados: pasosTocados.filter((x) => x.paso).map((x) => `${x.de}->${x.a}`),
        sinEscribir: pasosTocados.filter((x) => !x.paso).map((x) => `${x.de}->${x.a}`),
        archivados: archivarPasos(carpeta, pasosTocados),
      },
    };
  }
  return { historial, borrados };
}

// ---------------------------------------------------------------- bloques R (salida)

const seg1 = (x) => Number(x).toFixed(1);

/** Que hacer despues de sacar el clip de un bloque R. */
function imprimirSiguientesPasosR(carpetaArg, n) {
  console.log('\n  Ahora regenera ese bloque (te muestra el costo antes de cobrar):');
  console.log(`      npm run videos -- ${carpetaArg} --tomas ${n}`);
  console.log('  Revisalo antes de seguir: fotogramas de cada tramo y transcripcion contra el guion.');
  console.log(`      npm run frames -- ${carpetaArg}`);
  console.log('  Si quedo bien, vuelve a medir la cola y a montar:');
  console.log(`      npm run ugc:cola -- ${carpetaArg}`);
  console.log(`      npm run plan -- ${carpetaArg}`);
  console.log(`      npm run ensamblar -- ${carpetaArg}\n`);
}

/** Que hacer despues de sacar el clip de un gancho alternativo. */
function imprimirSiguientesPasosGancho(carpetaArg, r) {
  const id = r.gancho.id;
  console.log('\n  Ahora regeneralo (te muestra el costo antes de cobrar; lo que ya esta en video/ no se vuelve a pagar):');
  console.log(`      npm run videos -- ${carpetaArg} --ganchos`);
  if (r.tambienFaltan.length) {
    console.log(`  OJO: esa corrida tambien genera, y cobra, lo que falta en video/: ${r.tambienFaltan.join(', ')}.`);
  }
  console.log('  Revisalo antes de seguir: fotogramas de cada tramo.');
  console.log(`      npm run frames -- ${carpetaArg}`);
  if (r.variante) {
    const rel = path.relative(process.cwd(), r.variante);
    const dest = (rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : r.variante).replace(/\\/g, '/');
    console.log(`  Si quedo bien, rearma su version: ${dest}/ se armo con el clip viejo`);
    console.log('  (ahi se revisa su transcripcion con ugc:cola, y se monta):');
    console.log(`      npm run ugc:gancho -- ${carpetaArg} ${id} --reemplazar\n`);
  } else {
    console.log('  Si quedo bien, arma su version del anuncio (ahi se revisa su transcripcion con ugc:cola, y se monta):');
    console.log(`      npm run ugc:gancho -- ${carpetaArg} ${id}\n`);
  }
}

/**
 * Despues de sacar el clip de un bloque que es origen de un lugar repetido:
 * que paso con su fotograma y que bloques o ganchos conviene revisar.
 */
function imprimirLugaresSacados(carpetaArg, n, lugares) {
  for (const l of lugares || []) {
    console.log(`\n  OJO: el bloque ${n} es el origen del lugar "${l.id}" (fotograma en el segundo ${l.segundo}).`);
    console.log(
      l.guardado
        ? `  Ese fotograma salio del clip viejo: se guardo en historial/${l.guardado} y el motor lo\n  vuelve a sacar del clip nuevo cuando un bloque lo necesite.`
        : '  Su fotograma no estaba sacado: el motor lo saca del clip nuevo cuando un bloque lo necesite.'
    );
    const hechos = l.usan.filter((u) => u.generado);
    const pendientes = l.usan.filter((u) => !u.generado);
    if (hechos.length) {
      console.log(`  Lo usaban, y ya estan generados con el lugar del clip viejo: ${hechos.map((u) => u.nombre).join(', ')}.`);
      console.log(`  Cuando el bloque ${n} nuevo este listo, revisalos; si el lugar cambio, rehazlos (no se rehacen solos):`);
      for (const u of hechos) console.log(`      npm run rehacer -- ${carpetaArg} ${u.cmd}`);
    }
    if (pendientes.length) {
      console.log(`  Lo usan tambien, todavia sin generar (van a tomar el fotograma nuevo): ${pendientes.map((u) => u.nombre).join(', ')}.`);
    }
  }
}

/** --contexto de un bloque R: tramos y prompt, sin frames. */
function imprimirContextoR(c, carpetaArg) {
  const n = c.toma.n;
  console.log(`\n=== Contexto para rehacer el bloque ${n} (tipo R: solo referencias, sin frames) ===\n`);
  console.log('  NO SE TOCAN:');
  console.log(`    duracion:    ${c.fijo.duracion}s`);
  const comoRef = (id) => {
    const l = (c.lugares || []).find((x) => x.id === id);
    return l ? ` (fotograma del bloque ${l.de_toma}, segundo ${l.segundo})` : '';
  };
  console.log(
    `    referencias: ${c.fijo.referencias.map((r, i) => `${i + 1}) ${r}${comoRef(r)}`).join('  ') || '(ninguna)'}   (Imagen 1, Imagen 2... del prompt)`
  );
  for (const o of c.origenDe || []) {
    console.log(
      `    lugar:       este bloque es el origen de "${o.id}" (segundo ${o.segundo})` +
        (o.usan.length ? `; lo usan: ${o.usan.map((u) => u.nombre).join(', ')}` : '')
    );
  }
  console.log(`\n  QUE TIENE QUE TRANSMITIR ESTE BLOQUE:`);
  if (c.toma.fase) console.log(`    fase:        ${c.toma.fase}`);
  console.log(`    linea:       "${c.intencion.linea}"`);
  console.log(`    viene de:    "${c.intencion.anterior}"`);
  console.log(`    lleva a:     "${c.intencion.siguiente}"`);
  console.log('\n  TRAMOS:');
  for (const tr of c.tramos) {
    const quien = tr.habla ? ` [${tr.habla}]` : '';
    console.log(`    [${seg1(tr.desde)}–${seg1(tr.hasta)}s]${quien}  ${tr.linea ? `"${tr.linea}"` : '(sin dialogo)'}`);
  }
  if (c.ganchos.length) console.log(`\n  Ganchos alternativos de este bloque: ${c.ganchos.map((g) => g.id).join(', ')} (no cambian con esto)`);
  console.log(`\n  --- video ---\n${c.toma.prompt_video}`);
  for (const ref of c.referencias || []) {
    console.log(`\n  --- referencia "${ref.id}"${ref.tipo ? ` (${ref.tipo})` : ''} — repetir palabra por palabra ---\n${ref.prompt}`);
  }
  console.log('\n  DOS CASOS:');
  console.log('    a) Salio mal (otra cara, texto en pantalla, palabras cortadas, apurado):');
  console.log('       se regenera SIN tocar el texto:');
  console.log(`           npm run rehacer -- ${carpetaArg} ${n}`);
  console.log('    b) Omni lo rechazo (failMsg, casi siempre por politicas):');
  console.log('       se reescribe SOLO el copy de este bloque, con su misma funcion y largo');
  console.log('       (linea, tramos y prompt_video), y despues el mismo comando de arriba.');
  console.log(`       O con un archivo { "prompt_video", "linea", "tramos", "motivo" }:`);
  console.log(`           node produccion/rehacer-toma.js ${carpetaArg} --toma ${n} --aplicar nuevos.json\n`);
}

// ---------------------------------------------------------------- tomas H (salida)

/** --contexto de una toma hablada: que se dice, de donde sale el frame y los prompts. */
function imprimirContextoH(c, carpetaArg) {
  const n = c.toma.n;
  const h = c.hablada;
  console.log(`\n=== Contexto para rehacer la toma ${n} (hablada, tipo H) ===\n`);
  console.log('  NO SE TOCAN (atados al audio y al montaje):');
  console.log('    tipo:          H');
  console.log(`    duracion:      ${c.fijo.duracion}s (Omni: 4, 6, 8 o 10)`);
  if (h.frame_inicial) {
    console.log(`    frame inicial: la referencia "${h.frame_inicial}" copiada tal cual (no hay imagen que rehacer: solo cambia el video)`);
  } else {
    console.log(`    frame inicial: se genera con prompt_imagen_inicial + referencias: ${c.fijo.referencias.join(', ') || '(ninguna)'}`);
  }
  if (h.habla) console.log(`    habla:         ${h.habla}`);
  if (h.fase) console.log(`    fase:          ${h.fase}`);
  if (h.clase) console.log(`    clase:         ${h.clase}`);
  if (h.solo_voz) console.log('    solo_voz:      true (de este clip solo se usa el audio; la imagen la cubre el B-roll)');
  if (h.ingredientes) {
    // Se pueden cambiar con "ingredientes" en nuevos.json; si no vienen, quedan estos.
    console.log('\n  COMO SE PIDE EL VIDEO: por ingredientes, estas imagenes en este orden (las "(imagen N)" del prompt):');
    for (const [i, x] of h.ingredientes.entries()) {
      console.log(`    ${i + 1}) ${x.id}${x.archivo ? ` (${x.archivo})` : ' (no esta en las referencias)'}`);
    }
  } else {
    console.log('\n  COMO SE PIDE EL VIDEO: con la imagen del clip como frame inicial (first_frame_url).');
  }
  console.log('\n  QUE TIENE QUE DECIR ESTA TOMA (el copy solo cambia si Omni la rechazo por contenido):');
  console.log(`    linea:       "${c.intencion.linea}"`);
  if (h.lineas) {
    console.log('    lineas del guion, en el orden en que se dicen:');
    for (const l of h.lineas) console.log(`      ${String(l.orden).padStart(3)})  "${l.texto}"`);
  }
  if (h.dialogo) {
    console.log('    dialogo:');
    for (const d of h.dialogo) console.log(`      [${d.habla}]  "${d.texto}"`);
  }
  if (h.reacciones) {
    console.log('    reacciones (un tercio del clip cada una):');
    for (const r of h.reacciones) console.log(`      ${r.n})  ${r.descripcion}`);
  }
  console.log(`    viene de:    "${c.intencion.anterior}"`);
  console.log(`    lleva a:     "${c.intencion.siguiente}"`);
  if (h.brolls.length) {
    console.log(`\n  B-roll encima de esta toma (no cambian con esto): ${h.brolls.map((b) => `${b.n} ("${b.sincroniza_con}")`).join(', ')}`);
  }
  if (h.iconos.length) {
    console.log(`  Iconos sobre esta toma (no cambian con esto): ${h.iconos.map((g) => `${g.grupo} ("${g.aparece_con}")`).join(', ')}`);
  }
  console.log('\n  PROMPTS ACTUALES (los que fallaron — NO repetir la misma idea):');
  if (!h.frame_inicial) console.log(`\n  --- imagen inicial ---\n${c.toma.prompt_imagen_inicial}`);
  console.log(`\n  --- video ---\n${c.toma.prompt_video}`);
  for (const ref of c.referencias || []) {
    console.log(`\n  --- referencia "${ref.id}"${ref.tipo ? ` (${ref.tipo})` : ''} — repetir palabra por palabra ---\n${ref.prompt}`);
  }
  console.log('\n  Pidele a Claude que escriba una escena DISTINTA para la misma intencion, y aplicala con:');
  console.log(`      node produccion/rehacer-toma.js ${carpetaArg} --toma ${n} --aplicar nuevos.json`);
  console.log(
    h.frame_inicial
      ? '  nuevos.json = { "prompt_video", "motivo" }'
      : '  nuevos.json = { "prompt_imagen_inicial", "prompt_video", "motivo" }'
  );
  if (h.ingredientes) {
    console.log('  Si el prompt nuevo nombra otras imagenes, agrega "ingredientes" (la lista nueva, en ese orden, con');
    console.log('  "imagen" primero); si no viene, se conservan los de arriba.');
  }
  console.log('  Solo si Omni la rechazo por contenido, ademas el copy nuevo de ESTA toma, con su misma funcion y largo:');
  console.log(`  "linea" y ${h.dialogo ? '"dialogo"' : h.lineas ? '"lineas" (el mismo texto se actualiza en "guion")' : '"lineas" o "dialogo"'}.\n`);
}

/**
 * Que hacer despues de aplicar prompts nuevos a una toma hablada, en orden y
 * de a un proceso pesado por vez. Una toma "solo_voz" (voz en off de la
 * entrevista A) pasa ademas por `npm run voz` (recortar-voz.js: saca los
 * silencios y la deja a 1.2x) y se vuelve a medir; un podcast con el host
 * recortado en la esquina vuelve a recortar (`npm run recortar`) y a planear.
 */
function imprimirSiguientesPasosH(carpetaArg, n, { conFrame, medidaQuitada, soloVoz, porIngredientes, recorteQuitado }) {
  console.log('\n  Ahora regenera, en este orden (un proceso pesado a la vez):');
  if (!conFrame) console.log(`      npm run imagenes -- ${carpetaArg} --tomas ${n}`);
  console.log(`      npm run videos -- ${carpetaArg} --tomas ${n} --sin-broll`);
  if (porIngredientes) console.log('  (va por ingredientes: la imagen del clip y sus referencias, en el orden de "ingredientes")');
  console.log('  Revisa el clip (fotogramas, y que diga todo, sin palabras repetidas ni agregadas):');
  console.log(`      npm run frames -- ${carpetaArg}`);
  console.log(`      npm run lineas -- ${carpetaArg} --tomas ${n}`);
  if (medidaQuitada) console.log('  (su medida anterior se quito de lineas-habladas.json: el clip nuevo se mide de cero)');
  console.log('  Si no quedo limpio (repite, traba, cambia o agrega palabras), se vuelve a generar, avisando');
  console.log('  el costo (el clip anterior va a historial/ y su medida se quita), y se mide otra vez:');
  console.log(`      npm run videos -- ${carpetaArg} --tomas ${n} --sin-broll --rehacer`);
  console.log(`      npm run lineas -- ${carpetaArg} --tomas ${n}`);
  console.log('  (una repeticion de una letra que lineas marca "tolerada" no cuenta: se revisa a oido)');
  console.log('  Cuando te convence:');
  if (soloVoz) {
    // Voz en off de A: sin los silencios de adentro y a 1.2x, y medida otra
    // vez. Solo ESTA toma: las demas solo_voz ya pasaron por el paso voz y
    // tienen su medida.
    console.log(`      npm run voz -- ${carpetaArg} --tomas ${n}`);
    console.log(`      npm run lineas -- ${carpetaArg} --tomas ${n}`);
  }
  console.log(`      npm run plan -- ${carpetaArg}`);
  console.log(`      node produccion/subtitulos-dialogo.js ${carpetaArg}`);
  console.log(`      npm run plan -- ${carpetaArg}`);
  if (recorteQuitado) {
    // Podcast con el host recortado en la esquina: el recorte de esta toma
    // era del clip viejo (quedo en historial/); se vuelve a recortar.
    console.log(`      npm run recortar -- ${carpetaArg}`);
    console.log(`      npm run plan -- ${carpetaArg}`);
  }
  console.log(`      npm run ensamblar -- ${carpetaArg}\n`);
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('rehacer-toma.js')) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
  const iT = args.indexOf('--toma');
  const n = iT !== -1 ? Number(args[iT + 1]) : null;
  const verContexto = args.includes('--contexto');
  const iA = args.indexOf('--aplicar');
  const archivoPrompts = iA !== -1 ? args[iA + 1] : null;

  // Gancho alternativo, SOLO anuncios por bloques:  rehacer-toma.js <carpeta> --gancho 1b
  const iG = args.indexOf('--gancho');
  if (iG !== -1) {
    const idGancho = args[iG + 1];
    if (!carpetaArg || !idGancho || idGancho.startsWith('--')) {
      console.error('\n  Uso: node produccion/rehacer-toma.js <carpeta> --gancho <id>   (ej.: --gancho 1b)\n');
      process.exit(1);
    }
    if (iT !== -1 || verContexto || archivoPrompts) {
      console.error('\n  --gancho va solo: no se combina con --toma, --contexto ni --aplicar.');
      console.error('  Si Omni rechazo el gancho, reescribe su copy en "ganchos_alternativos" y despues corre esto.\n');
      process.exit(1);
    }
    const carpetaG = path.resolve(carpetaArg);
    if (!fs.existsSync(path.join(carpetaG, 'manifiesto.json'))) {
      console.error(`\n  No encuentro ${path.join(carpetaG, 'manifiesto.json')}\n`);
      process.exit(1);
    }
    try {
      const r = rehacerGancho(carpetaG, idGancho);
      console.log(`\n  Gancho ${r.gancho.id} (reemplaza al bloque ${r.gancho.reemplaza}) listo para regenerarse con lo que dice el manifiesto.`);
      console.log(
        r.sacados.length
          ? `  Sacados de la carpeta (quedan en historial/): ${r.sacados.join(', ')}`
          : '  No habia clip anterior de este gancho.'
      );
      imprimirSiguientesPasosGancho(carpetaArg, r);
      process.exit(0);
    } catch (e) {
      console.error(`\n  ${e.message}\n`);
      process.exit(1);
    }
  }

  // Forma corta, SOLO para bloques R:  rehacer-toma.js <carpeta> N
  // (Para cualquier otra toma sigue saliendo el "Uso" de siempre.)
  const iCarpeta = args.indexOf(carpetaArg);
  const nPosicional =
    carpetaArg && iT === -1 && !verContexto && !archivoPrompts
      ? args.find((a, i) => i > iCarpeta && /^\d+$/.test(a) && !String(args[i - 1]).startsWith('--'))
      : undefined;
  if (nPosicional) {
    const carpetaR = path.resolve(carpetaArg);
    const rutaM = path.join(carpetaR, 'manifiesto.json');
    const m = fs.existsSync(rutaM) ? JSON.parse(fs.readFileSync(rutaM, 'utf8')) : null;
    const nR = Number(nPosicional);
    if (m?.tomas?.find((t) => t.n === nR)?.tipo === 'R') {
      try {
        const { sacados, lugares } = rehacerBloque(carpetaR, nR);
        console.log(`\n  Bloque ${nR} (R) listo para regenerarse con lo que dice el manifiesto.`);
        console.log(
          sacados.length
            ? `  Sacados de la carpeta (quedan en historial/): ${sacados.join(', ')}`
            : '  No habia clip anterior de este bloque.'
        );
        imprimirLugaresSacados(carpetaArg, nR, lugares);
        imprimirSiguientesPasosR(carpetaArg, nR);
        process.exit(0);
      } catch (e) {
        console.error(`\n  ${e.message}\n`);
        process.exit(1);
      }
    }
  }

  if (!carpetaArg || !n) {
    console.error('\n  Uso:');
    console.error('    node produccion/rehacer-toma.js <carpeta> --toma N --contexto');
    console.error('    node produccion/rehacer-toma.js <carpeta> --toma N --aplicar prompts.json\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  const esBloqueR = manifiesto.tomas.find((t) => t.n === n)?.tipo === 'R';
  const esTomaH = manifiesto.tomas.find((t) => t.n === n)?.tipo === 'H';

  if (verContexto && esBloqueR) {
    imprimirContextoR(contextoDeToma(manifiesto, n), carpetaArg);
    process.exit(0);
  }

  // Toma hablada (H): como una A, con lo que se dice y de donde sale su frame.
  if (verContexto && esTomaH) {
    imprimirContextoH(contextoDeToma(manifiesto, n), carpetaArg);
    process.exit(0);
  }

  if (archivoPrompts && esTomaH) {
    if (!fs.existsSync(archivoPrompts)) {
      console.error(`\n  No encuentro ${archivoPrompts}\n`);
      process.exit(1);
    }
    const nuevos = JSON.parse(fs.readFileSync(archivoPrompts, 'utf8'));
    try {
      const { historial, borrados, hablada } = aplicarPrompts(carpeta, n, nuevos, { motivo: nuevos.motivo || '' });
      console.log(`\n  Prompts de la toma ${n} (hablada) actualizados en el manifiesto.`);
      console.log(`  Los anteriores quedaron guardados en ${path.basename(historial)}`);
      if (borrados.length) console.log(`  Sacados de la carpeta (quedan en historial/): ${borrados.join(', ')}`);
      imprimirSiguientesPasosH(carpetaArg, n, hablada);
      process.exit(0);
    } catch (e) {
      console.error(`\n  ${e.message}\n`);
      process.exit(1);
    }
  }

  if (archivoPrompts && esBloqueR) {
    if (!fs.existsSync(archivoPrompts)) {
      console.error(`\n  No encuentro ${archivoPrompts}\n`);
      process.exit(1);
    }
    const nuevos = JSON.parse(fs.readFileSync(archivoPrompts, 'utf8'));
    try {
      const { historial, borrados, lugares } = aplicarPrompts(carpeta, n, nuevos, { motivo: nuevos.motivo || '' });
      console.log(`\n  Bloque ${n} (R) actualizado en el manifiesto.`);
      console.log(`  Lo anterior quedo guardado en ${path.basename(historial)}`);
      if (borrados.length) console.log(`  Sacados de la carpeta (quedan en historial/): ${borrados.join(', ')}`);
      imprimirLugaresSacados(carpetaArg, n, lugares);
      imprimirSiguientesPasosR(carpetaArg, n);
      process.exit(0);
    } catch (e) {
      console.error(`\n  ${e.message}\n`);
      process.exit(1);
    }
  }

  if (verContexto) {
    const c = contextoDeToma(manifiesto, n);
    console.log(`\n=== Contexto para rehacer la toma ${n} ===\n`);
    console.log('  NO SE TOCAN (atados al audio y al montaje):');
    console.log(`    tipo:        ${c.fijo.tipo}`);
    console.log(`    duracion:    ${c.fijo.duracion}s`);
    console.log(`    referencias: ${c.fijo.referencias.join(', ') || '(ninguna)'}`);
    console.log(`\n  QUE TIENE QUE TRANSMITIR ESTA TOMA:`);
    console.log(`    linea:       "${c.intencion.linea}"`);
    console.log(`    viene de:    "${c.intencion.anterior}"`);
    console.log(`    lleva a:     "${c.intencion.siguiente}"`);
    console.log(`\n  PROMPTS ACTUALES (los que fallaron — NO repetir la misma idea):`);
    console.log(`\n  --- imagen inicial ---\n${c.toma.prompt_imagen_inicial}`);
    if (c.toma.prompt_imagen_final) console.log(`\n  --- imagen final ---\n${c.toma.prompt_imagen_final}`);
    console.log(`\n  --- video ---\n${c.toma.prompt_video}`);
    for (const ref of c.referencias || []) {
      console.log(`\n  --- referencia "${ref.id}"${ref.tipo ? ` (${ref.tipo})` : ''} — repetir palabra por palabra ---\n${ref.prompt}`);
    }
    if (tieneContinuidad(manifiesto)) {
      const pasos = pasosDeToma(manifiesto, n);
      if (pasos.length) {
        console.log(
          `\n  CONTINUIDAD: las imagenes de esta toma son la llegada o la salida de ${pasos.map((x) => `paso-${x.de} (${x.de}->${x.a})`).join(' y ')}.`
        );
        console.log('  Al aplicar prompts nuevos esos pasos quedan con "revisar": true y sus clips van a historial/:');
        console.log('  sus prompts se escribieron mirando las imagenes viejas.');
      }
    }
    console.log('\n  Pidele a Claude que escriba una escena DISTINTA para la misma intencion.\n');
    process.exit(0);
  }

  if (archivoPrompts) {
    if (!fs.existsSync(archivoPrompts)) {
      console.error(`\n  No encuentro ${archivoPrompts}\n`);
      process.exit(1);
    }
    const nuevos = JSON.parse(fs.readFileSync(archivoPrompts, 'utf8'));
    const { historial, borrados, continuidad } = aplicarPrompts(carpeta, n, nuevos, { motivo: nuevos.motivo || '' });

    console.log(`\n  Prompts de la toma ${n} actualizados en el manifiesto.`);
    console.log(`  Los anteriores quedaron guardados en ${path.basename(historial)}`);
    if (borrados.length) console.log(`  Borrados para regenerar: ${borrados.join(', ')}`);
    if (continuidad) {
      // Continuidad: los pasos que tocan esta toma se miran de nuevo antes de los videos.
      const { marcados, sinEscribir, archivados } = continuidad;
      if (marcados.length) {
        console.log(`  Continuidad: ${marcados.length === 1 ? 'el paso' : 'los pasos'} ${marcados.join(' y ')} se escribieron mirando la imagen vieja:`);
        console.log('  quedan con "revisar": true y los videos no arrancan hasta que los mires de nuevo.');
      }
      if (sinEscribir.length) console.log(`  Continuidad: ${sinEscribir.join(' y ')} todavia sin escribir (se escribe con la imagen nueva).`);
      if (archivados.length) console.log(`  Clips de esos pasos guardados en historial/: ${archivados.join(', ')}`);
      console.log('\n  Ahora, en este orden:');
      console.log(`      npm run imagenes -- ${carpetaArg} --tomas ${n}`);
      console.log(`      npm run continuidad -- ${carpetaArg} --pares`);
      console.log('  (mira las imagenes nuevas de cada paso marcado, corrige su prompt_video si hace falta');
      console.log('   y borra "revisar")');
      console.log(`      npm run videos -- ${carpetaArg} --tomas ${n}`);
      console.log('  Revisa los clips y sus uniones:');
      console.log(`      npm run frames -- ${carpetaArg} --uniones`);
      console.log('  Si te convencen:');
      console.log(`      npm run plan -- ${carpetaArg}`);
      console.log(`      npm run ensamblar -- ${carpetaArg}\n`);
      process.exit(0);
    }
    console.log('\n  Ahora regenera, en este orden:');
    console.log(`      npm run imagenes -- ${carpetaArg} --tomas ${n}`);
    console.log(`      npm run videos -- ${carpetaArg} --tomas ${n} --sin-broll`);
    console.log('  Revisa el clip, y si te convence:');
    console.log(`      npm run plan -- ${carpetaArg}`);
    console.log(`      npm run ensamblar -- ${carpetaArg}\n`);
    process.exit(0);
  }

  console.error('\n  Falta --contexto o --aplicar.\n');
  process.exit(1);
}
