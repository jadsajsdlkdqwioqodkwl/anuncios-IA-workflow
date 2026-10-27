// Proveedor Google Flow — base comun.
//
// En esta copia del sistema las imagenes y los videos NO se piden a kie.ai:
// los genera Claude en Google Flow (flow.google.com) manejando el navegador
// del usuario. El motor solo arma la LISTA DE TRABAJO (la "cola") y despues
// recibe los archivos descargados.
//
// El contrato con el resto del motor es el de siempre: un archivo esta
// terminado cuando existe con su nombre exacto en img/ o video/. Ningun paso
// posterior (revision, montaje, Remotion) sabe ni le importa quien lo genero.
//
// El ciclo, para cualquier estilo:
//
//   1. npm run imagenes -- <carpeta>      arma flow/cola-imagenes.json
//   2. Claude genera la cola en Flow (skill flow-generacion) y descarga cada
//      archivo con el nombre que dice "descarga" (<slug>__<archivo>)
//   3. npm run flow:recibir -- <carpeta>  mueve, convierte y verifica
//   4. se repite 1-3 hasta que la cola diga "no queda nada": hay trabajos que
//      dependen de otros (frame heredado, frame_anterior, el frame inicial de
//      la misma toma) y recien se pueden pedir cuando el otro ya existe
//   5. lo mismo con npm run videos
//
// kie.ai sigue siendo el proveedor de la MUSICA y las CANCIONES (Suno), que
// Flow no hace. ElevenLabs sigue siendo el de la voz y la transcripcion.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const PROVEEDOR = 'flow';

/**
 * Lo que ofrece Flow, visto en la interfaz el 2026-10-16 (cuenta PRO):
 *  - Imagen: Nano Banana 2.1, Nano Banana 2 Lite, Nano Banana Pro. Las tres a
 *    0 creditos. Descarga en 1K (tamano original, JPG 768x1376 en 9:16) o 2K
 *    (reescalado). 4K pide subir de plan.
 *  - Video: Omni 1.1 Flash, Veo 3.1 Lite / Fast / Quality. Modos Fotogramas
 *    (inicio y fin) o Ingredientes (referencias). 360p o 720p. 4/6/8/10 s.
 *    Omni 1.1 Flash 720p: 4 s = 7, 6 s = 10, 8 s = 12 creditos (10 s sin medir). Descarga en
 *    720p (original, h264 + aac, 24 fps) o 1080p (reescalado).
 *
 * El video de Flow sale con el MISMO formato que el de kie.ai (720x1280,
 * 24 fps, h264 + aac): es el mismo modelo.
 */
export const FLOW = {
  url: 'https://labs.google/fx/tools/flow',
  imagen: {
    principal: 'Nano Banana 2.1',
    // Para lo que en el sistema de kie.ai iba con GPT Image 2.5 a 2K (hojas de
    // personaje de UGC, estilo Lego, podcast, entrevista).
    alta: 'Nano Banana Pro',
  },
  video: {
    principal: 'Omni 1.1 Flash',
    // Solo si Omni falla todos los reintentos. Cuesta mas creditos.
    respaldo: 'Veo 3.1 - Fast',
    resolucion: '720p',
    duraciones: [4, 6, 8, 10],
  },
  /** Reintentos del mismo prompt antes de reescribirlo (decision del sistema). */
  reintentos: 4,
};

/** Duracion de Flow que cubre `segundos` sin quedarse corta. null = mas de 10 s. */
export function duracionFlow(segundos) {
  if (!Number.isFinite(segundos) || segundos <= 0) return FLOW.video.duraciones[0];
  return FLOW.video.duraciones.find((d) => d >= segundos - 1e-6) ?? null;
}

/** Carpeta donde Chrome deja las descargas. Se puede cambiar con FLOW_DESCARGAS en el .env. */
export function rutaDescargas() {
  const propia = (process.env.FLOW_DESCARGAS || '').trim();
  return propia ? path.resolve(propia) : path.join(os.homedir(), 'Downloads');
}

/** Nombre corto del anuncio: el de su carpeta, en minusculas y sin espacios. */
export function slugDe(carpeta) {
  return path
    .basename(path.resolve(carpeta))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Nombre (sin extension) con el que Claude descarga el archivo desde Flow:
 * "<slug>__<nombre-del-archivo-final>". La extension la pone Flow (.jpg o
 * .mp4) y flow:recibir la convierte a la que pide el motor.
 */
export function nombreDescarga(carpeta, archivoRelativo) {
  const base = path.basename(archivoRelativo, path.extname(archivoRelativo));
  return `${slugDe(carpeta)}__${base}`;
}

export const DIR_FLOW = 'flow';
export const rutaCola = (carpeta, tipo) => path.join(carpeta, DIR_FLOW, `cola-${tipo}.json`);

/**
 * @typedef {object} TrabajoFlow  Una imagen o un video que Claude genera en Flow.
 * @property {string} id               id del trabajo en el plan del motor (ej. "toma-3-inicial", "broll-2", "toma-4", "paso-2")
 * @property {string} archivo          destino final, relativo a la carpeta del anuncio (ej. "img/toma-3-inicial.png", "video/toma-4.mp4")
 * @property {string} descarga         nombre SIN extension con el que se descarga de Flow (nombreDescarga)
 * @property {'imagen'|'video'} clase
 * @property {'imagen'|'fotogramas'|'ingredientes'|'texto'} modo
 *           imagen: Flow en modo Imagen (con o sin referencias).
 *           fotogramas: video con frame inicial (y final si hay).
 *           ingredientes: video con imagenes de referencia (sin frames).
 *           texto: video sin ninguna imagen.
 * @property {string} modelo           modelo de Flow a elegir (FLOW.imagen.* o FLOW.video.principal)
 * @property {string|null} respaldo    modelo de Flow si el principal falla todos los reintentos
 * @property {string} prompt           el prompt EXACTO a pegar (ya con la duracion ajustada)
 * @property {string[]} referencias    rutas ABSOLUTAS de las imagenes a adjuntar, EN ORDEN
 * @property {string|null} frame_inicial  ruta absoluta (solo modo fotogramas)
 * @property {string|null} frame_final    ruta absoluta (solo modo fotogramas, tomas B y pasos)
 * @property {number|null} duracion    segundos a elegir en Flow (4/6/8/10), solo video
 * @property {number|null} duracion_pedida segundos que el montaje necesita (el clip debe durar al menos esto)
 * @property {boolean} exacta          continuidad: el clip debe durar `duracion` +-0.1 s
 * @property {string} proporcion       "9:16", "1:1", ...
 * @property {'1K'|'2K'|'720p'} calidad_descarga  opcion del menu de descarga de Flow
 * @property {boolean} habla           el clip trae dialogo (debe venir con pista de audio con voz)
 * @property {boolean} sin_sonido      flow:recibir le reemplaza el audio por silencio (B-roll mudo)
 * @property {'verde'|null} fondo      iconos: se piden sobre verde croma y flow:recibir lo vuelve transparente
 * @property {string} [nota]           aclaracion para Claude (opcional)
 */

/**
 * @typedef {object} BloqueadoFlow  Un trabajo que todavia no se puede pedir.
 * @property {string} id
 * @property {string} archivo
 * @property {string[]} espera        archivos (relativos a la carpeta) que tienen que existir antes
 */

/**
 * Escribe flow/cola-<tipo>.json y devuelve su ruta.
 * `hechos` son los pasos que el motor ya resolvio solo, sin Flow (copias de
 * frames, fotogramas extraidos), para que el resumen los muestre.
 */
export function escribirCola(carpeta, tipo, { trabajos, bloqueados = [], hechos = [], aspectRatio = '9:16' }) {
  const ruta = rutaCola(carpeta, tipo);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  const cola = {
    proveedor: PROVEEDOR,
    tipo,
    anuncio: slugDe(carpeta),
    carpeta: path.resolve(carpeta),
    generado: new Date().toISOString(),
    aspect_ratio: aspectRatio,
    descargas_en: rutaDescargas(),
    trabajos,
    bloqueados,
    hechos,
  };
  fs.writeFileSync(ruta, JSON.stringify(cola, null, 2) + '\n');
  return ruta;
}

export function leerCola(carpeta, tipo) {
  const ruta = rutaCola(carpeta, tipo);
  if (!fs.existsSync(ruta)) return null;
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

/** Resumen para la terminal, igual para imagenes y videos. */
export function imprimirCola(carpeta, tipo, { trabajos, bloqueados = [], hechos = [] }) {
  // Con barras normales: si Claude copia el comando en Git Bash, la invertida se pierde.
  const rel = (path.relative(process.cwd(), rutaCola(carpeta, tipo)) || rutaCola(carpeta, tipo)).split(path.sep).join('/');
  console.log('');
  for (const h of hechos) console.log(`  [listo sin Flow] ${h}`);
  if (trabajos.length === 0 && bloqueados.length === 0) {
    console.log(`  No queda nada que generar en Flow para ${tipo}.`);
    return;
  }
  if (trabajos.length > 0) {
    console.log(`  ${trabajos.length} ${tipo === 'videos' ? 'video(s)' : 'imagen(es)'} para generar en Google Flow AHORA:`);
    for (const t of trabajos) {
      const extra = [
        t.modelo,
        t.duracion ? `${t.duracion} s` : null,
        t.modo !== 'imagen' ? t.modo : null,
        t.referencias?.length ? `${t.referencias.length} ref.` : null,
        t.habla ? 'habla' : null,
        t.sin_sonido ? 'mudo' : null,
      ]
        .filter(Boolean)
        .join(' · ');
      console.log(`    - ${t.archivo}  (${extra})  -> descargar como "${t.descarga}"`);
    }
  }
  if (bloqueados.length > 0) {
    console.log(`  ${bloqueados.length} esperan a que existan otros archivos (salen en la proxima vuelta):`);
    for (const b of bloqueados) console.log(`    - ${b.archivo}  espera ${b.espera.join(', ')}`);
  }
  console.log('');
  console.log(`  Cola: ${rel}`);
  console.log('  Siguiente: generar la cola en Google Flow (skill flow-generacion),');
  console.log(`  despues "npm run flow:recibir -- ${(path.relative(process.cwd(), carpeta) || carpeta).split(path.sep).join('/')}" y volver a correr este comando.`);
}
