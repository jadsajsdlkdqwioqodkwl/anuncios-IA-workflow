// Las referencias del anuncio: personajes, producto, objetos recurrentes, lo
// que la skill decida. Lista de longitud variable y tipo ABIERTO.
//
// Este archivo es el UNICO sitio donde se traduce el formato viejo
// (personaje + producto como campos fijos) al formato nuevo (lista). El resto
// del motor solo conoce la lista.
//
// Forma nueva del manifiesto:
//
//   "referencias": [
//     { "id": "presentadora", "tipo": "personaje", "prompt": "..." },
//     { "id": "producto",     "tipo": "producto",  "archivo": "producto.jpg", "nota": "..." },
//     { "id": "cafetera",     "tipo": "objeto",    "prompt": "..." }
//   ]
//
// Y cada toma declara cuales usa por id:  "referencias": ["presentadora", "producto"]

import fs from 'node:fs';
import path from 'node:path';
import { INGREDIENTE_IMAGEN } from './config.js';

/**
 * Valores reservados: no apuntan a la lista de referencias, apuntan a un frame
 * ya generado dentro del mismo anuncio.
 *
 *   frame_anterior             el ultimo frame generado antes de este
 *   frame_inicial_de_esta_toma el frame inicial de la propia toma
 *
 * Los dos los resuelve generar-imagenes.js. El segundo estaba implementado
 * pero no declarado aca, asi que el validador lo rechazaba: un manifiesto que
 * lo usara pasaba por el motor y fallaba en la validacion. Corregido.
 *
 * Se usa mucho en dialogo_nativo: el frame final de una escena se genera con su
 * propio frame inicial como referencia, que es lo que mantiene al personaje
 * identico dentro de la escena.
 */
export const RESERVADAS = ['frame_anterior', 'frame_inicial_de_esta_toma'];

/**
 * A que toma pertenece un B-roll.
 *
 * Hay dos nombres para el mismo vinculo, y la diferencia NO es cosmetica:
 *
 *   despues_de_toma   voz_en_off        el B-roll va EN FILA, despues de la toma
 *   encima_de_toma    dialogo_nativo    el B-roll va ENCIMA de la toma (cutaway)
 *
 * El bug entero del B-roll en UGC nacio de una etiqueta que decia "despues".
 * Dejar el campo llamandose `despues_de_toma` en un modo donde va encima
 * garantiza que alguien lo vuelva a leer literal y repita el error:
 * el nombre del campo es documentacion.
 *
 * Se aceptan los dos para no tocar los manifiestos de voz en off que ya existen.
 */
export function tomaDelBroll(b) {
  return b.encima_de_toma ?? b.despues_de_toma;
}

/** Ids validos: sin espacios, y sin chocar con los archivos de tomas y B-roll. */
const ID_VALIDO = /^[a-z0-9][a-z0-9_-]*$/i;
const ID_PROHIBIDO = /^(toma|broll)-/i;

/**
 * Devuelve SIEMPRE la lista de referencias, venga el manifiesto en la forma
 * nueva o en la vieja. Es la unica funcion que sabe de la forma vieja.
 */
export function listaDeReferencias(manifiesto) {
  // Forma nueva: ya viene la lista.
  if (Array.isArray(manifiesto.referencias)) {
    return manifiesto.referencias.map((r) => ({ ...r }));
  }

  // Forma vieja: se arma la lista a partir de los dos campos fijos.
  // Los ids coinciden con los valores que ya usaban las tomas ("personaje",
  // "producto"), asi que las tomas viejas siguen resolviendo sin tocarlas.
  const lista = [];

  if (manifiesto.personaje?.activo) {
    lista.push({
      id: 'personaje',
      tipo: 'personaje',
      prompt: manifiesto.personaje.prompt,
      _heredado: true,
    });
  }

  if (manifiesto.producto?.foto) {
    lista.push({
      id: 'producto',
      tipo: 'producto',
      archivo: manifiesto.producto.foto,
      nota: manifiesto.producto.nota ?? null,
      _heredado: true,
    });
  }

  return lista;
}

/** true si el manifiesto viene en la forma vieja. */
export const esFormatoHeredado = (m) => !Array.isArray(m.referencias);

/** Una referencia se genera (tiene prompt) o se aporta (tiene archivo). */
export const esGenerada = (r) => typeof r.prompt === 'string' && r.prompt.trim().length > 0;
export const esAportada = (r) => typeof r.archivo === 'string' && r.archivo.trim().length > 0;

/**
 * TERCER CASO: la hoja se GENERA A PARTIR DE la foto del usuario.
 *
 * Nace del primer anuncio de talking-object-pixar, donde el producto es uno de
 * los personajes que hablan. Ahi hacen falta las dos cosas a la vez: la foto
 * real (para que el envase sea fiel) y un prompt (para convertirlo en el
 * personaje con cara). Con solo prompt, la hoja sale con un envase inventado;
 * sin hoja, la cara se genera fresca en cada toma y no coincide consigo misma
 * — medido: el iris paso de marron a ambar entre la toma 8 y la 10.
 *
 * Se pide EXPLICITAMENTE con `generar_desde_archivo: true`. No alcanza con
 * traer los dos campos: declarar "prompt" y "archivo" juntos sin la bandera
 * sigue siendo un error, porque casi siempre es un descuido y esa red no se
 * pierde.
 */
export const esHojaDesdeArchivo = (r) =>
  r.generar_desde_archivo === true && esGenerada(r) && esAportada(r);

/**
 * La foto cruda que aporto el usuario, sin prompt que la transforme.
 * Se separa de la de arriba porque en el frame final Tipo B se tratan igual
 * pero por razones distintas. Ver construirPlan() en generar-imagenes.js.
 */
export const esFotoDelUsuario = (r) => esAportada(r) && !esHojaDesdeArchivo(r);

/** Nombre del archivo de la hoja generada de una referencia. */
export const archivoDeHoja = (r) => `${r.id}.png`;

/**
 * Donde queda la IMAGEN de una referencia, relativo a la carpeta del anuncio,
 * una vez producida: la hoja generada en img/<id>.png (tambien la generada a
 * partir de una foto) o la foto que aporto el usuario, tal cual la dejo
 * preparar-producto.js. Un lugar sacado de un bloque ("de_toma") no cuenta:
 * null. Lo usan las tomas habladas (tipo H, podcast y entrevista, 2026-10-13)
 * que piden esa imagen tal cual como frame inicial ("frame_inicial").
 */
export const archivoDeReferencia = (r) => {
  if (!r || esLugarDeToma(r)) return null;
  if (esGenerada(r)) return `img/${archivoDeHoja(r)}`;
  if (esAportada(r)) return r.archivo;
  return null;
};

/**
 * Donde esta cada INGREDIENTE de una toma H de la entrevista (2026-10-14),
 * relativo a la carpeta del anuncio. Los ingredientes ("tomas[].ingredientes")
 * son las imagenes, en orden, con las que Omni genera el clip (image_urls: el
 * "imagen 1, imagen 2" del prompt):
 *
 *   "imagen"   la imagen del clip, img/toma-N-inicial.png (se genera como
 *              siempre, con su prompt y sus referencias; el prompt de video la
 *              pide como frame inicial).
 *   otro id    esa referencia: su hoja generada (img/<id>.png) o la foto
 *              aportada (la mano con el microfono, el producto...).
 *
 * null si el id no es una referencia con imagen (no esta en la lista, o es un
 * lugar sacado de un bloque). `lista` es opcional (la de listaDeReferencias).
 */
export function archivoDeIngrediente(manifiesto, n, id, lista = null) {
  if (id === INGREDIENTE_IMAGEN) return `img/toma-${n}-inicial.png`;
  return archivoDeReferencia((lista || listaDeReferencias(manifiesto)).find((r) => r.id === id));
}

/**
 * CUARTO CASO, solo en anuncios por bloques (UGC, tomas R): un LUGAR que se
 * saca de un bloque ya generado.
 *
 *   { "id": "lugar-oficina", "tipo": "lugar", "de_toma": 1, "segundo": 6.5, "nota": "..." }
 *
 * Sin prompt ni archivo. Nace del primer anuncio real por bloques (Befem,
 * 2026-10-04): el bloque 4 volvia a la oficina del bloque 1 y, con solo texto
 * ("la misma oficina"), Omni invento otra. Con un fotograma del bloque 1 como
 * "Imagen 2: la oficina... referencia del lugar", salio la misma.
 *
 * El motor (generar-videos.js) saca ese fotograma de video/toma-<de_toma>.mp4
 * en `segundo` y lo deja en img/<id>.png, el mismo nombre que una hoja. Lo que
 * se valida de `de_toma` y `segundo` esta en validar-manifiesto.js (necesita
 * los bloques y los ganchos); aqui solo se reconoce la forma.
 */
export const esLugarDeToma = (r) => Boolean(r) && r.de_toma !== undefined;

/**
 * Valida la lista y el uso que hacen las tomas.
 * `carpeta` es opcional: si se pasa, comprueba que los archivos aportados existan.
 */
export function validarReferencias(manifiesto, { carpeta } = {}) {
  const errores = [];
  const avisos = [];
  const lista = listaDeReferencias(manifiesto);

  const vistos = new Set();

  for (const r of lista) {
    const id = r.id;

    if (typeof id !== 'string' || !ID_VALIDO.test(id)) {
      errores.push(`referencia con id invalido: ${JSON.stringify(id)}. Letras, numeros, guion y guion bajo, sin espacios.`);
      continue;
    }
    if (ID_PROHIBIDO.test(id)) {
      errores.push(`el id "${id}" no se puede usar: choca con los archivos de tomas y B-roll.`);
    }
    if (vistos.has(id)) errores.push(`hay dos referencias con el id "${id}".`);
    vistos.add(id);

    if (!r.tipo || typeof r.tipo !== 'string') {
      avisos.push(`la referencia "${id}" no declara "tipo". No rompe nada (el motor no ramifica por tipo), pero ayuda a leer el manifiesto.`);
    }

    const gen = esGenerada(r);
    const apo = esAportada(r);

    // Lugar sacado de un bloque (solo tomas R): ni se genera ni lo aporta el
    // usuario, lo saca el motor del clip. Su forma propia; de_toma y segundo
    // los valida validar-manifiesto.js.
    if (esLugarDeToma(r)) {
      if (gen || apo) {
        errores.push(
          `la referencia "${id}" es un lugar que se saca del bloque ${JSON.stringify(r.de_toma)} ("de_toma"): no lleva ` +
            `${gen && apo ? '"prompt" ni "archivo"' : gen ? '"prompt"' : '"archivo"'}.\n` +
            `         El motor saca el fotograma del clip de ese bloque y lo guarda en img/${archivoDeHoja(r)}.\n` +
            '         Si el lugar es una foto que ya tienes, quita "de_toma" y "segundo" y deja solo "archivo".'
        );
      }
      if (r.generar_desde_archivo !== undefined || r.referencias !== undefined) {
        errores.push(`la referencia "${id}" es un lugar que se saca de un bloque ("de_toma"): no lleva "generar_desde_archivo" ni "referencias".`);
      }
      continue;
    }

    if (!gen && !apo) {
      errores.push(`la referencia "${id}" no tiene ni "prompt" (para generarla) ni "archivo" (aportada por el usuario).`);
    }

    // Traer "prompt" y "archivo" juntos SIN la bandera sigue siendo un error:
    // es el descuido tipico (dejarse un prompt viejo al pasar la referencia a
    // foto del usuario, o al reves) y esa red no se pierde. El caso legitimo
    // se declara a proposito con `generar_desde_archivo: true`.
    if (gen && apo && r.generar_desde_archivo === undefined) {
      errores.push(
        `la referencia "${id}" tiene "prompt" y "archivo" a la vez.\n` +
          `         Si fue sin querer, deja uno solo: o se genera, o la aporta el usuario.\n` +
          `         Si de verdad quieres generar la hoja A PARTIR de esa foto, declaralo:\n` +
          `           "generar_desde_archivo": true`
      );
    }

    if (r.generar_desde_archivo !== undefined) {
      if (r.generar_desde_archivo !== true) {
        errores.push(
          `la referencia "${id}": "generar_desde_archivo" solo acepta true — llego ${JSON.stringify(r.generar_desde_archivo)}`
        );
      } else if (!gen || !apo) {
        errores.push(
          `la referencia "${id}" declara "generar_desde_archivo": true, que significa ` +
            `"genera la hoja a partir de esta foto", y para eso necesita LOS DOS campos: ` +
            `"archivo" (la foto de entrada) y "prompt" (como convertirla en el personaje).` +
            (gen ? ' Falta "archivo".' : ' Falta "prompt".')
        );
      }
    }

    // Una hoja GENERADA puede pedir otras hojas como referencia (ej. la version
    // "despues" de un personaje se genera con la hoja "antes" adjunta). Como
    // las hojas se generan en el orden de la lista, las que pide tienen que
    // estar ANTES que ella; si no, cuando le toque no habra URL que adjuntar.
    if (Array.isArray(r.referencias)) {
      for (const otra of r.referencias) {
        if (RESERVADAS.includes(otra)) {
          errores.push(`la referencia "${id}" pide "${otra}", y una hoja no puede usar frames de tomas.`);
        } else if (otra === id) {
          if (!esHojaDesdeArchivo(r)) errores.push(`la referencia "${id}" se pide a si misma sin "generar_desde_archivo": true.`);
        } else if (esLugarDeToma(lista.find((x) => x.id === otra))) {
          // Las hojas se generan antes que cualquier video: ese fotograma aun no existe.
          errores.push(`la referencia "${id}" pide "${otra}", que es un lugar sacado de un bloque de video: una hoja no puede usarlo.`);
        } else if (!vistos.has(otra)) {
          errores.push(
            `la referencia "${id}" pide la hoja "${otra}", que no existe o esta DESPUES en la lista.\n` +
              `         Las hojas se generan en orden: pon "${otra}" antes que "${id}".`
          );
        }
      }
      if (!gen) errores.push(`la referencia "${id}" declara "referencias" pero no se genera (no tiene "prompt").`);
    }

    if (apo && carpeta) {
      const ruta = path.join(carpeta, r.archivo);
      if (r.archivo.includes('/') || r.archivo.includes('\\')) {
        errores.push(`"${id}.archivo" debe ser solo el nombre del archivo, no una ruta — llego ${JSON.stringify(r.archivo)}`);
      } else if (!fs.existsSync(ruta)) {
        errores.push(
          `la referencia "${id}" apunta a ${JSON.stringify(r.archivo)} y ese archivo no existe en la carpeta del anuncio.\n` +
            `         Dejalo listo con:\n` +
            `           node produccion/preparar-producto.js "<tu-archivo>" ${path.basename(carpeta)}`
        );
      }
    }
  }

  // Uso desde las tomas y los B-roll: cada id declarado tiene que existir.
  const declaradas = (bloque, etiqueta) => {
    for (const valor of bloque.referencias || []) {
      if (RESERVADAS.includes(valor)) {
        if (valor === 'frame_anterior' && bloque.n === 1 && etiqueta.startsWith('toma')) {
          errores.push(`${etiqueta}: no puede pedir "frame_anterior", es la primera toma.`);
        }
        continue;
      }
      if (!vistos.has(valor)) {
        errores.push(
          `${etiqueta} declara la referencia "${valor}", que no esta en la lista de referencias.\n` +
            `         Referencias disponibles: ${[...vistos].join(', ') || '(ninguna)'}`
        );
      }
    }
  };

  for (const t of manifiesto.tomas || []) declaradas(t, `toma ${t.n}`);
  for (const b of manifiesto.broll || []) declaradas(b, `broll ${b.n}`);

  // Una referencia que nadie usa suele ser sintoma de algo mal escrito.
  // (Los ganchos alternativos, solo en anuncios por bloques, tambien cuentan:
  // un lugar o una hoja puede usarla solo un gancho.)
  const usadas = new Set();
  const ganchos = Array.isArray(manifiesto.ganchos_alternativos) ? manifiesto.ganchos_alternativos : [];
  // Con continuidad, el B-roll del estilo queda guardado en
  // continuidad.broll_descartado: lo que pide cuenta como uso (no es un error
  // de escritura; el aviso propio, "solo la usa el B-roll descartado", lo da
  // validarContinuidad). Es el mismo criterio que tieneContinuidad() de
  // continuidad.js, escrito aqui porque continuidad.js importa este archivo.
  const descartado =
    manifiesto.continuidad != null && Array.isArray(manifiesto.continuidad?.broll_descartado) ? manifiesto.continuidad.broll_descartado : [];
  for (const bloque of [...(manifiesto.tomas || []), ...(manifiesto.broll || []), ...ganchos, ...descartado]) {
    for (const v of bloque?.referencias || []) usadas.add(v);
  }
  for (const id of vistos) {
    if (!usadas.has(id)) avisos.push(`la referencia "${id}" no la usa ninguna toma ni B-roll.`);
  }

  return { errores, avisos, lista };
}
