// Pistas FIJAS por estilo: la cancion que el motor pone sola en musica/, sin
// Suno y sin costo. La usan generar-musica.js (npm run musica), planear-montaje.js
// (que la copia si musica/ quedo vacia) y ensamblar.js (su aviso de SIN MUSICA).
// Vive aparte para que el plan y el ensamblado no carguen el cliente de kie.ai.

import fs from 'node:fs';
import path from 'node:path';
import { RAIZ } from './config.js';

/** Las extensiones que cuentan como pista en musica/. */
export const EXTENSIONES_PISTA = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];

/**
 * Estilos con pista FIJA que el motor pone solo, sin Suno y sin costo.
 *
 * Solo estilo-lego, decision del estilo del 2026-10-05: el estilo va siempre con
 * "Open Up Emotions" (recursos/musica/LEEME.md cuenta como se preparo). Su
 * nivel en la mezcla no se fija aca: lo mide el plan (planear-montaje.js,
 * MUSICA_POR_ESTILO).
 *
 * zack-d-films y skeleton tambien tienen pista fija, pero se copian A MANO y
 * siguen asi: no estan en esta tabla a proposito.
 */
export const PISTA_FIJA_POR_ESTILO = {
  'estilo-lego': 'estilo-lego.mp3',
};

const DIR_PISTAS_FIJAS = path.join(RAIZ, 'recursos', 'musica');

/** El archivo de la pista fija del estilo dentro de recursos/musica/, o null. */
export function pistaFijaDe(estilo) {
  return (estilo && Object.hasOwn(PISTA_FIJA_POR_ESTILO, estilo) && PISTA_FIJA_POR_ESTILO[estilo]) || null;
}

/** Todas las pistas que hay en musica/, en el orden en que las lista el disco. */
export function pistasEn(carpeta) {
  const dir = path.join(carpeta, 'musica');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((x) => EXTENSIONES_PISTA.includes(path.extname(x).toLowerCase()))
    .map((x) => path.join(dir, x));
}

/** Si `ruta` es, byte a byte, la pista fija del estilo (la que copia el motor). */
export function esPistaFija(ruta, estilo) {
  const archivo = pistaFijaDe(estilo);
  if (!archivo) return false;
  const original = path.join(DIR_PISTAS_FIJAS, archivo);
  if (!fs.existsSync(original) || fs.statSync(ruta).size !== fs.statSync(original).size) return false;
  return fs.readFileSync(ruta).equals(fs.readFileSync(original));
}

/**
 * La pista que va a sonar, con la misma regla para el plan y para
 * `npm run musica`: "fondo.mp3" es la generada o la copiada, y cualquier otro
 * nombre es del usuario y gana. En los estilos con pista fija, ademas, la del
 * usuario gana aunque su nombre empiece con "fondo" (la fija se reconoce por su
 * contenido). Devuelve el nombre del archivo dentro de musica/, o null.
 */
export function elegirPista(carpeta, estilo) {
  const nombres = pistasEn(carpeta).map((p) => path.basename(p));
  if (nombres.length === 0) return null;
  let candidatas = nombres;
  if (pistaFijaDe(estilo)) {
    const delUsuario = nombres.filter((f) => !esPistaFija(path.join(carpeta, 'musica', f), estilo));
    if (delUsuario.length) candidatas = delUsuario;
  }
  return candidatas.find((f) => !f.startsWith('fondo')) || candidatas.find((f) => f === 'fondo.mp3') || candidatas[0];
}

/**
 * Copia la pista fija del estilo a musica/fondo.mp3. Solo si el estilo tiene
 * una y musica/ no trae ninguna pista: la del usuario siempre gana. No cobra nada.
 *
 * Devuelve null si no habia nada que copiar, { destino } si la copio, y
 * { falta } con la ruta esperada si el archivo de recursos/musica/ no esta
 * (quien llama avisa; el anuncio sale sin musica en vez de romperse).
 */
export function copiarPistaFija(carpeta, estilo) {
  const archivo = pistaFijaDe(estilo);
  if (!archivo || pistasEn(carpeta).length) return null;
  const origen = path.join(DIR_PISTAS_FIJAS, archivo);
  if (!fs.existsSync(origen)) return { falta: origen };
  const destino = path.join(carpeta, 'musica', 'fondo.mp3');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origen, destino);
  return { destino };
}
