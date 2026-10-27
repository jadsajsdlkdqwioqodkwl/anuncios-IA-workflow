// UGC por bloques — arma una VARIANTE del anuncio con un gancho alternativo.
//
//   node produccion/variante-gancho.js temp/mi-anuncio 1b
//   node produccion/variante-gancho.js temp/mi-anuncio 1b --reemplazar   la rehace si ya existe
//
// La skill entrega dos ganchos alternativos del Bloque 1 (`ganchos_alternativos`
// en el manifiesto) para probar en Meta cual vende mas. Se generan aparte
// (npm run videos -- <carpeta> --ganchos  ->  video/gancho-1b.mp4) y el resto
// del anuncio NO se vuelve a generar: es el mismo, ya pagado.
//
// Esto crea temp/mi-anuncio-gancho-1b/ con:
//   - el manifiesto, con la toma que el gancho reemplaza sustituida por los
//     datos del gancho (mismo n, tipo R) y sin `ganchos_alternativos`
//   - los clips: gancho-1b.mp4 pasa a ser toma-1.mp4; los demas, tal cual
//   - las imagenes (img/), el producto y estado.json
//   - los cortes de cola (toma-N.cola.json) de las OTRAS tomas. El de la toma
//     reemplazada NO: se midio sobre el clip viejo
//   - musica, transiciones, efectos y el color de los subtitulos, para que las
//     dos versiones solo se diferencien en el gancho
//
// NO copia plan-montaje ni subtitulos.json (dependen de los tiempos del clip
// nuevo y se rehacen) ni salidas de render. La carpeta original no se toca.
//
// Lugares repetidos ({ "tipo": "lugar", "de_toma": N }): sus fotogramas viven
// en img/ y se copian con todo lo demas. Si un lugar se sacaba del bloque que
// el gancho reemplaza, en la variante ese bloque ya es el gancho: el lugar
// queda FIJO como foto (<id>.png en la carpeta, con "archivo"), con el
// fotograma del bloque ORIGINAL. Asi todas las versiones quedan en el mismo
// lugar, y la variante no apunta a un bloque que ya no es el de origen.

import fs from 'node:fs';
import path from 'node:path';
import { listaDeReferencias, esAportada, esLugarDeToma, archivoDeHoja } from './referencias.js';
import { sacarFotograma } from './generar-videos.js';

/** Marca que deja este comando en la carpeta que arma. Solo esas se pueden rehacer. */
export const MARCA_VARIANTE = 'variante-gancho.json';

const ID_GANCHO = /^[a-z0-9][a-z0-9_-]*$/i;

/** Nombre de la carpeta de la variante: <slug>-gancho-<id>, al lado de la original. */
export const carpetaDeVariante = (carpeta, id) =>
  path.join(path.dirname(carpeta), `${path.basename(carpeta)}-gancho-${id}`);

/** Ruta para mostrar: relativa a donde se corre el comando (temp/...), con barras normales. */
const paraMostrar = (ruta) => {
  const rel = path.relative(process.cwd(), ruta);
  return (rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : ruta).replace(/\\/g, '/');
};

/**
 * El manifiesto de la variante: la toma `reemplaza` pasa a tener los datos del
 * gancho (duracion, linea, tramos, prompt_video, referencias...), conservando
 * su n y su tipo R. Funcion pura.
 */
export function manifiestoDeVariante(manifiesto, gancho) {
  const n = Number(gancho.reemplaza);
  // `id` y `reemplaza` son del gancho, no de una toma.
  const { id: _id, reemplaza: _reemplaza, ...datos } = gancho;
  const variante = {
    ...manifiesto,
    tomas: manifiesto.tomas.map((t) => (t.n === n ? { ...t, ...datos, n: t.n, tipo: 'R' } : t)),
  };
  // Un lugar que se sacaba del bloque reemplazado queda fijo (ver arriba).
  if (Array.isArray(manifiesto.referencias) && lugaresFijos(manifiesto, n).length) {
    variante.referencias = manifiesto.referencias.map((r) =>
      esLugarDeToma(r) && r.de_toma === n
        ? {
            id: r.id,
            tipo: r.tipo,
            archivo: archivoDeHoja(r),
            nota:
              `fotograma del bloque ${n} del anuncio original (segundo ${r.segundo}), fijo en esta variante: ` +
              `aqui el bloque ${n} es el gancho ${gancho.id}` +
              (r.nota ? `. ${r.nota}` : ''),
          }
        : r
    );
  }
  // La variante ya es una version terminada: no es fuente de mas ganchos.
  delete variante.ganchos_alternativos;
  return variante;
}

/** Los lugares que se sacan del bloque `n` (los que en la variante quedan fijos). */
const lugaresFijos = (manifiesto, n) => listaDeReferencias(manifiesto).filter((r) => esLugarDeToma(r) && r.de_toma === n);

/**
 * Arma la carpeta de la variante. Lanza un Error con un mensaje claro si algo
 * impide armarla (gancho inexistente, falta su clip, la carpeta ya existe...).
 * Devuelve { destino, n, copiados, avisos, conSubtitulos }.
 */
export function armarVariante(carpeta, id, { reemplazar = false, carpetaArg = paraMostrar(carpeta) } = {}) {
  if (!ID_GANCHO.test(String(id || ''))) {
    throw new Error(`"${id}" no es un id de gancho valido (por ejemplo: 1b).`);
  }

  const rutaManifiesto = path.join(carpeta, 'manifiesto.json');
  if (!fs.existsSync(rutaManifiesto)) throw new Error(`No encuentro ${rutaManifiesto}`);
  const texto = fs.readFileSync(rutaManifiesto, 'utf8');
  const manifiesto = JSON.parse(texto);

  const ganchos = Array.isArray(manifiesto.ganchos_alternativos) ? manifiesto.ganchos_alternativos : [];
  const gancho = ganchos.find((g) => String(g.id) === String(id));
  if (!gancho) {
    throw new Error(
      ganchos.length
        ? `El manifiesto no tiene el gancho "${id}". Ganchos disponibles: ${ganchos.map((g) => g.id).join(', ')}.`
        : 'El manifiesto no tiene "ganchos_alternativos": no hay ganchos para armar variantes.'
    );
  }

  const n = Number(gancho.reemplaza);
  const toma = (manifiesto.tomas || []).find((t) => t.n === n);
  if (!toma) throw new Error(`El gancho "${id}" dice que reemplaza a la toma ${gancho.reemplaza}, y esa toma no existe.`);
  if (toma.tipo !== 'R') {
    throw new Error(`El gancho "${id}" reemplaza a la toma ${n}, que no es un bloque tipo R. Esto es solo para UGC por bloques.`);
  }

  const dirVideo = path.join(carpeta, 'video');
  const clipGancho = path.join(dirVideo, `gancho-${id}.mp4`);
  if (!fs.existsSync(clipGancho)) {
    throw new Error(
      `Falta el clip del gancho "${id}": no encuentro video/gancho-${id}.mp4.\n` +
        '  Los ganchos no se generan junto con el anuncio; se piden aparte:\n' +
        `      npm run videos -- ${carpetaArg} --ganchos`
    );
  }

  const destino = carpetaDeVariante(carpeta, id);
  if (fs.existsSync(destino)) {
    if (!reemplazar) {
      throw new Error(
        `Ya existe ${paraMostrar(destino)}/. Para rehacerla desde cero (se borra y se arma de nuevo):\n` +
          `      npm run ugc:gancho -- ${carpetaArg} ${id} --reemplazar`
      );
    }
    // Solo se borra una carpeta que armo este mismo comando.
    if (!fs.existsSync(path.join(destino, MARCA_VARIANTE))) {
      throw new Error(`${paraMostrar(destino)}/ existe pero no la armo este comando (no tiene ${MARCA_VARIANTE}). No la borro: revisala a mano.`);
    }
    fs.rmSync(destino, { recursive: true, force: true });
  }

  const copiados = [];
  const avisos = [];
  const copiar = (origen, relativo) => {
    const final = path.join(destino, relativo);
    fs.mkdirSync(path.dirname(final), { recursive: true });
    fs.cpSync(origen, final, { recursive: true });
    copiados.push(relativo.replace(/\\/g, '/'));
  };

  fs.mkdirSync(path.join(destino, 'video'), { recursive: true });

  // 1. El manifiesto, con los mismos saltos de linea que el original.
  const eol = texto.includes('\r\n') ? '\r\n' : '\n';
  const variante = manifiestoDeVariante(manifiesto, gancho);
  fs.writeFileSync(
    path.join(destino, 'manifiesto.json'),
    JSON.stringify(variante, null, 2).replace(/\n/g, eol) + eol,
    'utf8'
  );
  copiados.push('manifiesto.json');

  // 2. Los clips. El del gancho entra en el lugar de la toma que reemplaza; los
  //    otros ganchos y el clip viejo de esa toma no van.
  copiar(clipGancho, path.join('video', `toma-${n}.mp4`));
  for (const f of fs.existsSync(dirVideo) ? fs.readdirSync(dirVideo) : []) {
    if (!f.endsWith('.mp4') || f === `toma-${n}.mp4` || f.startsWith('gancho-')) continue;
    copiar(path.join(dirVideo, f), path.join('video', f));
  }
  for (const t of manifiesto.tomas) {
    if (t.n !== n && !fs.existsSync(path.join(dirVideo, `toma-${t.n}.mp4`))) {
      avisos.push(`la toma ${t.n} no tiene clip en el original (video/toma-${t.n}.mp4): la variante tampoco.`);
    }
  }

  // 3. Imagenes, producto y estado.
  if (fs.existsSync(path.join(carpeta, 'img'))) copiar(path.join(carpeta, 'img'), 'img');
  for (const r of listaDeReferencias(manifiesto).filter(esAportada)) {
    const ruta = path.join(carpeta, r.archivo);
    if (fs.existsSync(ruta)) copiar(ruta, r.archivo);
    else avisos.push(`la referencia "${r.id}" apunta a ${r.archivo} y no esta en el original.`);
  }
  if (fs.existsSync(path.join(carpeta, 'estado.json'))) copiar(path.join(carpeta, 'estado.json'), 'estado.json');

  // 3b. Lugares que se sacaban del bloque reemplazado: su fotograma (del bloque
  //     ORIGINAL) pasa de img/ a la carpeta, como foto fija (ver arriba). Si en
  //     el original todavia no estaba sacado, se saca ahora de su clip (gratis).
  for (const r of lugaresFijos(manifiesto, n)) {
    const archivo = archivoDeHoja(r);
    const enImg = path.join(destino, 'img', archivo);
    const final = path.join(destino, archivo);
    const clipOriginal = path.join(dirVideo, `toma-${n}.mp4`);
    if (fs.existsSync(enImg)) {
      fs.renameSync(enImg, final);
      copiados.push(archivo);
    } else if (fs.existsSync(clipOriginal)) {
      try {
        const s = sacarFotograma(clipOriginal, r.segundo, final);
        copiados.push(archivo);
        avisos.push(`el lugar "${r.id}" no estaba sacado en el original: se saco ahora de video/toma-${n}.mp4 (segundo ${s.segundo}).`);
      } catch (e) {
        avisos.push(`el lugar "${r.id}" no se pudo sacar de video/toma-${n}.mp4 (${e.message}): deja ${archivo} en la variante a mano.`);
      }
    } else {
      avisos.push(`el lugar "${r.id}" no esta sacado (img/${archivo}) ni esta el clip del bloque ${n} en el original: deja ${archivo} en la variante a mano.`);
    }
  }

  // 4. Cortes de cola de las OTRAS tomas. El de la reemplazada se midio sobre
  //    el clip viejo: copiarlo cortaria el gancho en un segundo que no le toca.
  for (const t of manifiesto.tomas) {
    const cola = `toma-${t.n}.cola.json`;
    if (t.n !== n && fs.existsSync(path.join(carpeta, cola))) copiar(path.join(carpeta, cola), cola);
  }

  // 5. Lo que hace que las dos versiones suenen y se vean igual.
  for (const extra of ['musica', 'efectos', 'transiciones.json', 'color-subtitulos.json']) {
    if (fs.existsSync(path.join(carpeta, extra))) copiar(path.join(carpeta, extra), extra);
  }

  // silenciar.json nombra clips por archivo. El de la toma reemplazada ya es
  // otro clip (el gancho), asi que su entrada no aplica.
  const rutaSilenciar = path.join(carpeta, 'silenciar.json');
  if (fs.existsSync(rutaSilenciar)) {
    try {
      const doc = JSON.parse(fs.readFileSync(rutaSilenciar, 'utf8'));
      const clips = (doc.clips || []).filter((c) => c !== `toma-${n}.mp4` && !String(c).startsWith('gancho-'));
      if (clips.length) {
        fs.writeFileSync(path.join(destino, 'silenciar.json'), JSON.stringify({ ...doc, clips }, null, 2) + '\n', 'utf8');
        copiados.push('silenciar.json');
      }
    } catch (e) {
      avisos.push(`silenciar.json del original no es JSON valido (${e.message}); no se copio.`);
    }
  }

  // 6. La marca: de donde salio esta carpeta.
  fs.writeFileSync(
    path.join(destino, MARCA_VARIANTE),
    JSON.stringify(
      {
        origen: path.basename(carpeta),
        gancho: String(id),
        reemplaza: n,
        clip: `video/gancho-${id}.mp4 -> video/toma-${n}.mp4`,
        creado: new Date().toISOString(),
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  return {
    destino,
    n,
    copiados,
    avisos,
    conSubtitulos: fs.existsSync(path.join(carpeta, 'subtitulos.json')),
  };
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('variante-gancho.js')) {
  const args = process.argv.slice(2);
  const [carpetaArg, id] = args.filter((a) => !a.startsWith('--'));
  const reemplazar = args.includes('--reemplazar');

  if (!carpetaArg || !id) {
    console.error('\n  Uso: node produccion/variante-gancho.js <carpeta-del-anuncio> <id-del-gancho> [--reemplazar]');
    console.error('  Ejemplo: npm run ugc:gancho -- temp/mi-anuncio 1b\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  let r;
  try {
    r = armarVariante(carpeta, id, { reemplazar, carpetaArg });
  } catch (e) {
    console.error(`\n  ${e.message}\n`);
    process.exit(1);
  }

  const dest = paraMostrar(r.destino);
  const clips = r.copiados.filter((c) => c.startsWith('video/')).length;
  console.log(`\n=== Variante con el gancho ${id} — ${path.basename(carpeta)} ===\n`);
  console.log(`  Carpeta nueva: ${dest}/`);
  console.log(`    video/gancho-${id}.mp4  ->  video/toma-${r.n}.mp4 (el gancho reemplaza al bloque ${r.n})`);
  console.log(`    ${clips} clip(s) en total, mas: ${r.copiados.filter((c) => !c.startsWith('video/')).join(', ')}`);
  console.log('  La carpeta original no se toco.');

  if (r.avisos.length) {
    console.log(`\n  --- ${r.avisos.length} AVISO(S) ---\n`);
    for (const a of r.avisos) console.log(`  !  ${a}`);
  }

  console.log('\n  Para armar el video de esta variante:');
  console.log(`    1. Corta la cola del gancho, por si repite el final (transcribe solo ese bloque):`);
  console.log(`         npm run ugc:cola -- ${dest} --tomas ${r.n}`);
  console.log(`    2. npm run plan -- ${dest}`);
  if (r.conSubtitulos) {
    console.log('    3. Subtitulos (el original los lleva), y vuelve a planear:');
    console.log(`         node produccion/subtitulos-dialogo.js ${dest}`);
    console.log(`         npm run plan -- ${dest}`);
    console.log(`    4. npm run ensamblar -- ${dest}`);
  } else {
    console.log(`    3. npm run ensamblar -- ${dest}`);
  }
  console.log('');
}
