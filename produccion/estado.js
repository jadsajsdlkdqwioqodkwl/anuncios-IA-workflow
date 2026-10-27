// Estado de producción de un anuncio: qué se generó ya y dónde quedó.
//
// Vive en estado.json, SEPARADO del manifiesto. El manifiesto es lo que la
// skill emite y no debe cambiar mientras el pipeline corre: es el contrato.
// El progreso es otra cosa y va aquí.

import fs from 'node:fs';
import path from 'node:path';

const NOMBRE = 'estado.json';

export function rutaEstado(carpeta) {
  return path.join(carpeta, NOMBRE);
}

export function leerEstado(carpeta) {
  const ruta = rutaEstado(carpeta);
  if (!fs.existsSync(ruta)) return { referencias: {} };
  try {
    const e = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    return { referencias: {}, ...e };
  } catch {
    return { referencias: {} };
  }
}

function guardar(carpeta, estado) {
  fs.writeFileSync(
    rutaEstado(carpeta),
    JSON.stringify({ actualizado: new Date().toISOString(), ...estado }, null, 2) + '\n',
    'utf8'
  );
}

/** Anota dónde quedó la hoja generada de una referencia. */
export function anotarHojaDeReferencia(carpeta, id, rutaRelativa) {
  const estado = leerEstado(carpeta);
  estado.referencias[id] = rutaRelativa;
  guardar(carpeta, estado);
  return estado;
}

/** Ruta relativa de la hoja de una referencia, o null si no se generó. */
export function hojaDeReferencia(carpeta, id) {
  return leerEstado(carpeta).referencias[id] ?? null;
}
