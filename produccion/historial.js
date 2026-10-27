// Archiva el material antes de sobrescribirlo.
//
// `prompts-anteriores.json` ya guardaba los prompts viejos al rehacer una toma,
// pero el archivo generado —la imagen o el clip— se perdia: `--rehacer` lo
// sobrescribe y no queda copia. Si el clip nuevo sale peor que el viejo, no hay
// forma de volver atras sin pagarlo otra vez.
//
// Esto lo arregla con lo mas barato que hay: mover el archivo anterior a
// `historial/` con la fecha en el nombre, antes de generar el nuevo.
//
// Engancha con una idea a futuro, una pantalla para reemplazar clips despues del render:
// para poder cambiar un clip por otro hace falta, primero, no haber tirado el
// que estaba.

import fs from 'node:fs';
import path from 'node:path';

/** Marca de tiempo apta para nombre de archivo: 2026-09-03T18-42-07 */
function sello() {
  return new Date().toISOString().slice(0, 19).replace(/:/g, '-');
}

/**
 * Si `ruta` existe, la mueve a `<carpeta-del-anuncio>/historial/`.
 * Devuelve la ruta del archivo archivado, o null si no habia nada que archivar.
 *
 * `raizAnuncio` es la carpeta del anuncio (temp/mi-anuncio). Si no se pasa, se
 * usa la carpeta que contiene al archivo.
 */
export function archivarSiExiste(ruta, raizAnuncio = null) {
  if (!fs.existsSync(ruta)) return null;

  const raiz = raizAnuncio || path.dirname(path.dirname(ruta));
  const dir = path.join(raiz, 'historial');
  fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(ruta);
  const base = path.basename(ruta, ext);
  const destino = path.join(dir, `${base}--${sello()}${ext}`);

  fs.renameSync(ruta, destino);
  return destino;
}
