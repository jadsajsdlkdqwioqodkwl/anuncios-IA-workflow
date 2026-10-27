// Cliente de la API de kie.ai.
// Patron documentado: createTask -> polling de recordInfo -> descargar el archivo.
// Docs: https://docs.kie.ai/market/common/get-task-detail

import fs from 'node:fs';
import path from 'node:path';
import { KIE, POLLING, ADAPTADORES_IMAGEN, ADAPTADORES_VIDEO, requerirClave } from './config.js';

function clave() {
  return requerirClave('KIE_API_KEY', 'crea tu cuenta en kie.ai y copia la key desde https://kie.ai/api-key');
}

function cabeceras() {
  return {
    Authorization: `Bearer ${clave()}`,
    'Content-Type': 'application/json',
  };
}

/** Crea una tarea y devuelve el taskId. */
export async function crearTarea(modelo, input, { callBackUrl } = {}) {
  const cuerpo = { model: modelo, input };
  if (callBackUrl) cuerpo.callBackUrl = callBackUrl;

  const res = await fetch(KIE.base + KIE.crearTarea, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify(cuerpo),
  });

  const texto = await res.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`kie.ai devolvio una respuesta no-JSON (HTTP ${res.status}): ${texto.slice(0, 300)}`);
  }

  if (res.status === 401) {
    throw new Error('kie.ai rechazo la clave (401). Revisa KIE_API_KEY en el .env.');
  }
  if (res.status === 429) {
    throw new Error('kie.ai devolvio 429 (demasiadas solicitudes). Espera unos segundos y reintenta.');
  }
  if (json.code !== 200 || !json?.data?.taskId) {
    throw new Error(`kie.ai no creo la tarea. code=${json.code} msg=${json.msg || json.message || '(sin mensaje)'}`);
  }
  return json.data.taskId;
}

/** Consulta el estado de una tarea. */
export async function consultarTarea(taskId) {
  const url = `${KIE.base}${KIE.consultarTarea}?taskId=${encodeURIComponent(taskId)}`;
  const res = await fetch(url, { headers: cabeceras() });
  const texto = await res.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`kie.ai devolvio una respuesta no-JSON al consultar la tarea (HTTP ${res.status}): ${texto.slice(0, 300)}`);
  }
  if (!json?.data) {
    throw new Error(`kie.ai no devolvio datos de la tarea ${taskId}: ${texto.slice(0, 300)}`);
  }
  return json.data;
}

/**
 * Espera a que la tarea termine. Estados: waiting | queuing | generating | success | fail.
 * Devuelve el array de URLs resultantes.
 */
export async function esperarTarea(taskId, { alActualizar, timeoutMs = POLLING.timeoutMs } = {}) {
  const inicio = Date.now();
  let espera = POLLING.intervaloInicialMs;
  let ultimoEstado = null;

  while (true) {
    if (Date.now() - inicio > timeoutMs) {
      throw new Error(`Timeout esperando la tarea ${taskId} (mas de ${Math.round(timeoutMs / 1000)}s).`);
    }

    const datos = await consultarTarea(taskId);
    if (datos.state !== ultimoEstado) {
      ultimoEstado = datos.state;
      alActualizar?.(datos);
    }

    if (datos.state === 'success') {
      let resultado;
      try {
        resultado = JSON.parse(datos.resultJson || '{}');
      } catch {
        throw new Error(`No pude leer resultJson de la tarea ${taskId}: ${datos.resultJson}`);
      }
      const urls = resultado.resultUrls || [];
      if (urls.length === 0) {
        throw new Error(`La tarea ${taskId} termino sin URLs de resultado.`);
      }
      return { urls, datos };
    }

    if (datos.state === 'fail') {
      const err = new Error(`La tarea ${taskId} fallo. ${datos.failCode || ''} ${datos.failMsg || ''}`.trim());
      err.esFalloDeModelo = true;
      err.failCode = datos.failCode;
      err.failMsg = datos.failMsg;
      throw err;
    }

    await new Promise((r) => setTimeout(r, espera));
    espera = Math.min(Math.round(espera * POLLING.factor), POLLING.intervaloMaximoMs);
  }
}

/**
 * Sube un archivo local y devuelve su URL publica.
 * kie.ai solo acepta URLs como referencia, no archivos. Subir es gratis y los
 * archivos se borran solos a los 3 dias.
 * Docs: https://docs.kie.ai/file-upload-api/upload-file-base-64
 */
const cacheSubidas = new Map();

export async function subirArchivo(rutaLocal, { uploadPath = 'anuncios-ia' } = {}) {
  const absoluta = path.resolve(rutaLocal);
  if (cacheSubidas.has(absoluta)) return cacheSubidas.get(absoluta);

  if (!fs.existsSync(absoluta)) {
    throw new Error(`No puedo subir la referencia porque no existe: ${absoluta}`);
  }

  const ext = path.extname(absoluta).slice(1).toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const base64 = fs.readFileSync(absoluta).toString('base64');

  const res = await fetch(KIE.baseArchivos + KIE.subirBase64, {
    method: 'POST',
    headers: cabeceras(),
    body: JSON.stringify({
      base64Data: `data:${mime};base64,${base64}`,
      uploadPath,
      fileName: `${Date.now()}-${path.basename(absoluta)}`,
    }),
  });

  const texto = await res.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    throw new Error(`kie.ai devolvio una respuesta no-JSON al subir el archivo (HTTP ${res.status}): ${texto.slice(0, 300)}`);
  }

  const url = json?.data?.downloadUrl;
  if (!url) {
    throw new Error(`kie.ai no devolvio URL al subir ${path.basename(absoluta)}: ${texto.slice(0, 300)}`);
  }

  cacheSubidas.set(absoluta, url);
  return url;
}

/** Saldo de creditos de la cuenta. Devuelve null si el endpoint no responde. */
export async function consultarCreditos() {
  try {
    const res = await fetch(KIE.base + KIE.creditos, { headers: cabeceras() });
    const json = await res.json();
    const v = json?.data;
    if (typeof v === 'number') return v;
    if (typeof v?.credit === 'number') return v.credit;
    if (typeof v?.credits === 'number') return v.credits;
    return null;
  } catch {
    return null;
  }
}

/** Descarga una URL a disco. Devuelve la ruta local. */
export async function descargar(url, rutaDestino) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No pude descargar ${url} (HTTP ${res.status}).`);
  }
  fs.mkdirSync(path.dirname(rutaDestino), { recursive: true });
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(rutaDestino, buffer);
  return rutaDestino;
}

/**
 * Genera una imagen y la descarga.
 * El cuerpo exacto lo arma el adaptador del modelo (ver ADAPTADORES_IMAGEN):
 * cada modelo nombra sus campos distinto.
 */
export async function generarImagen({
  modelo,
  prompt,
  imagenesReferencia = [],
  aspectRatio = 'auto',
  resolucion = '1K',
  formato = 'png',
  fondo = null,
  rutaDestino,
  alActualizar,
}) {
  const adaptador = ADAPTADORES_IMAGEN[modelo];
  if (!adaptador) {
    throw new Error(`No hay adaptador para el modelo de imagen "${modelo}". Definidos: ${Object.keys(ADAPTADORES_IMAGEN).join(', ')}`);
  }

  // `fondo` (opcional, 'transparente') es solo para los iconos de los estilos
  // hablados; el adaptador que no lo entiende lo ignora.
  const { model, input } = adaptador({
    prompt,
    referencias: imagenesReferencia,
    aspectRatio,
    resolucion,
    formato,
    fondo,
  });

  const taskId = await crearTarea(model, input);
  alActualizar?.({ state: 'created', taskId, modeloReal: model });
  const { urls, datos } = await esperarTarea(taskId, { alActualizar });
  const ruta = await descargar(urls[0], rutaDestino);
  return { ruta, url: urls[0], taskId, datos, modeloReal: model, creditos: datos.creditsConsumed ?? null };
}

/**
 * Genera un video y lo descarga.
 * El cuerpo lo arma el adaptador del modelo (ver ADAPTADORES_VIDEO):
 * omni usa first_frame_url/last_frame_url, kling usa image_urls[0..1].
 *
 * `imagenesReferencia` (opcional) es solo para los bloques UGC tipo R: URLs ya
 * subidas, en orden, que el adaptador de flash-1-1 manda como image_urls
 * cuando NO hay frames. Quien no lo pasa no ve ningun cambio.
 */
export async function generarVideo({
  modelo,
  prompt,
  frameInicial,
  frameFinal = null,
  imagenesReferencia = null,
  aspectRatio = '9:16',
  resolucionApi,
  duracion,
  sonido = undefined,
  rutaDestino,
  timeoutMs,
  alActualizar,
}) {
  const adaptador = ADAPTADORES_VIDEO[modelo];
  if (!adaptador) {
    throw new Error(`No hay adaptador para el modelo de video "${modelo}". Definidos: ${Object.keys(ADAPTADORES_VIDEO).join(', ')}`);
  }

  // `sonido` (opcional, true/false) es solo para el B-roll de los estilos
  // hablados con Kling; sin el, cada adaptador manda lo de siempre.
  const { model, input } = adaptador({ prompt, frameInicial, frameFinal, imagenesReferencia, aspectRatio, resolucionApi, duracion, sonido });

  const taskId = await crearTarea(model, input);
  alActualizar?.({ state: 'created', taskId, modeloReal: model });
  const { urls, datos } = await esperarTarea(taskId, { alActualizar, timeoutMs });
  const ruta = await descargar(urls[0], rutaDestino);
  return { ruta, url: urls[0], taskId, datos, modeloReal: model, creditos: datos.creditsConsumed ?? null };
}
