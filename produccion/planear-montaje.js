// FASE 2.5 (paso 1) — arma el plan de montaje y lo deja en plan-montaje.json.
// NO renderiza nada: primero se aprueba la tabla.
//
//   node produccion/planear-montaje.js temp/mi-anuncio
//
// La regla de oro: manda el audio. Cada linea del guion define una ventana de
// tiempo y la toma de esa linea la ocupa. Las 16 tomas van todas; lo que se
// descarta son B-roll sobrantes.
//
// CONTINUIDAD (solo si el manifiesto trae el bloque "continuidad"): en vez de
// una toma por linea va una cadena de clips seguidos, sin B-roll ni
// transiciones, y solo cambia la velocidad (ver planearMontajeContinuidad).
//
//   node produccion/planear-montaje.js temp/mi-anuncio --prediccion
//
// da las velocidades con los largos que se piden, antes de pagar los videos.
// No escribe nada.

import fs from 'node:fs';
import crypto from 'node:crypto';
import { analizarBordes } from './recortar-bordes.js';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
// Estilos hablados: el host recortado sin fondo del podcast en esquina
// (recorte.json, de `npm run recortar`) y, de `npm run lineas`, las mismas
// reglas que usan la revision del habla, el paso voz y los subtitulos:
// decidirColaHablada (donde termina el guion dentro de un clip: la
// decidirCola del corte de cola de UGC, comparando guion y oido como se
// DICEN, "29" = "veintinueve"; aca solo la usan los bordes de las tomas H de
// entrevista), estadoDeMedida (si la medida de una toma es de ESTE clip) con
// su aviso, el texto de la revision (y el de una repeticion tolerada:
// describirTolerada), la revision misma de una medida de antes de que
// existiera (revisionDeMedidaGuardada: sobre las palabras que ya guardo, sin
// Scribe) y la comparacion "como se dice" (mismasPalabras,
// normalizarComparable: aca, la palabra elegida del check). Los dos modulos
// solo definen funciones al importarse (su CLI corre solo si se los llama
// directo).
import { leerRecorte, recorteParaPieza } from './recortar-host.js';
import {
  avisoMedidaVieja,
  decidirColaHablada,
  describirRevision,
  describirTolerada,
  estadoDeMedida,
  mismasPalabras,
  normalizarComparable,
  revisionDeMedidaGuardada,
  toleradasDe,
} from './lineas-habladas.js';
import { listaDeReferencias, tomaDelBroll } from './referencias.js';
import { copiarPistaFija, elegirPista } from './pista-fija.js';
import { RAIZ, ESTILOS_HABLADOS } from './config.js';
import {
  tieneContinuidad,
  cadenaDeClips,
  medirCadena,
  planearContinuidad,
  lineasTablaContinuidad,
} from './continuidad.js';

// --- Reglas de montaje (replican lo que se hacia a mano en CapCut) ---
export const REGLAS = {
  // Umbral a partir del cual la ventana pide B-roll, segun el tipo de toma.
  umbralBroll: {
    B: 3.5, // ya trae dos acciones adentro: aguanta sola hasta 3.5s
    A: 3.0, // plano sostenido: se estira mal
    C: 3.0, // igual que A: tambien es plano sostenido (ver nota en el informe)
  },
  tomaConBroll: { preferido: 2.5, minimo: 2.0 },
  brollMinimo: 1.2, // si el B-roll queda mas corto que esto, no vale la pena

  // Tope de aceleracion para una Tipo B. Es una GUIA DE CALIDAD, no un muro:
  // pasarse no rompe nada ni detiene el proceso, solo se avisa para que el
  // usuario decida. Editando a mano se han acelerado clips 3x, 4x y hasta 5x
  // sin que se note, cuando el clip original era largo.
  // Se puede cambiar aca, o por linea de comandos con --velocidad-max 2.5
  velocidadMaxima: 1.6,
  // Velocidad a partir de la cual se silencia el ambiente de un clip.
  //
  // null = no se silencia ninguno, que es lo correcto para el render de
  // Remotion: su documentacion dice que "during server-side rendering,
  // playbackRate always preserves the audio pitch". O sea que acelerar un clip
  // NO le sube el tono al ambiente, y no hay nada que evitar.
  // (En la vista previa del navegador si puede sonar agudo; eso es cosa del
  // preview, no del archivo final.)
  //
  // Si algun dia se renderiza por otra via que no conserve el tono, poner aca
  // un numero, por ejemplo 1.25, y los clips mas rapidos saldran mudos.
  velocidadQueDeformaAudio: null,
  fadeAudioMs: 80,

  // El ambiente de los clips va CLARAMENTE audible: es parte de lo que hace
  // que cada toma se sienta real. Debajo de la voz, pero no escondido.
  duckingDb: -10,

  // Subtitulos. Todo en PROPORCION al video, no en pixeles: asi se ve igual
  // si algun dia se renderiza en 1080x1920 o en cualquier otra resolucion.
  subtitulos: {
    // 0.06137 = 44px sobre 720 de ancho. Elegido de ojo el 2026-09-04 comparando
    // el mismo montaje a 0.0722 y a este valor.
    //
    // Lo que lo decidio NO fue el tamano en si, sino los RENGLONES: un bloque
    // como "PANTALLA, REUNION," parte en dos renglones a 0.0722 y entra en uno
    // solo a 0.06137. Un renglon se lee mas rapido y no le roba pantalla al
    // video. Achicar la letra no solo la achica: cambia donde parte el texto.
    //
    // VALE PARA TODOS LOS ESTILOS, a proposito. El tamano de subtitulo no tiene
    // por que variar por estilo; si algun dia alguno lo necesita distinto, esa
    // sera una excepcion con su razon escrita.
    //
    // Para probar otro valor sin tocar esto:
    //     node produccion/ensamblar.js <carpeta> --sub-tamano 0.055
    tamano: 0.06137,
    interlineado: 1.1, // renglones juntos, sin tocarse
    // El contorno se ata al tamano de letra, no al ancho: si la letra baja, el
    // borde baja con ella. Dejarlo fijo embarra el texto en vez de aligerarlo.
    contornoRespectoTamano: 0.135, // 7px sobre 52px de letra
    desdeAbajo: 0.26, // el bloque queda en el tercio inferior, sobre la UI de Meta

    // La palabra que se esta diciendo lleva una caja de color detras. El resto
    // del bloque se queda en blanco. Los tiempos por palabra ya vienen en
    // subtitulos.json, asi que esto es solo pintado.
    //
    // El color CAMBIA DE UN ANUNCIO A OTRO y es estable dentro del mismo. Lo
    // elige colorDeResaltado(): descarta los colores que ya usan los otros
    // anuncios de temp/ y guarda el elegido en color-subtitulos.json dentro de
    // la carpeta, asi dos renders del mismo anuncio salen identicos. Si fuera
    // al azar, re-renderizar cambiaria el color y no habria forma de
    // reproducir una version ya entregada.
    coloresResaltado: ['#E8442A', '#F5A524', '#2F7DE1', '#159A5B', '#B5279B', '#E01E5A', '#7B3FE4', '#0FA3B1', '#D64500', '#3B7A2A'],
    // Respiro de la caja alrededor de la palabra, en proporcion al tamano.
    cajaPadding: 0.12,
    cajaRedondeo: 0.1,
  },

  // Animaciones de entrada + su efecto de sonido. Van de la mano: donde hay una,
  // hay el otro. NO se aplican por regla a todas las tomas — eso las convierte
  // en plantilla, que es justo lo que se evita (COMO-PRODUCIR.md, seccion 4). Las posiciones se declaran
  // a mano en transiciones.json dentro de la carpeta del anuncio.
  transiciones: {
    duracionSeg: 0.45, // lo que tarda un deslizamiento en entrar
    // El zoom entra en 0.5s. Es el numero que se usa a mano en CapCut, y se
    // comprobo con la captura del panel de animacion. Se probaron 0.28s (casi no
    // se nota) y 1.0s (seguia sintiendose rapido); 0.5s es el de CapCut.
    //
    // De donde venia el 0.28, y por que ya no vale. Este comentario decia que
    // "la energia de los dos efectos esta al principio" del archivo. MEDIDO,
    // era falso: el woosh arranca sonando pero el deep-woosh es un SWELL que
    // tarda. Sobre esa suposicion se habia acortado el zoom para que
    // "alcanzara" al golpe, lo que en realidad lo alejaba mas.
    //
    // Ahora la sincronia NO depende de la duracion de la animacion: el sonido
    // se adelanta solo lo que haga falta (resolverTransiciones -> adelantoSeg).
    // Eso libero esta duracion para elegirla por como se VE, que es lo unico
    // que deberia haberla decidido siempre.
    duracionZoomSeg: 0.5,
    // Sonido tal cual viene el archivo, sin atenuar. Es a proposito para la
    // primera escucha: primero se oye, despues se ajusta. Ojo con el 5.9 —
    // un nivel relativo sobre una fuente sin normalizar es una suposicion.
    efectoDb: 0,
    zoomDesde: 1.35, // el zoom entra grande y se asienta en 1
  },

  // Musica de fondo. Es opcional: si no hay pista, el anuncio se arma igual.
  // Prioridad del audio: voz > ambiente de los clips > musica.
  // La musica es solo colchon: va bien abajo para dejarle sitio al ambiente.
  musica: {
    db: -26,
    subeEnPayoffDb: 4, // en el payoff/CTA sube un poco. NUNCA se cambia de tema.
    fadeInSeg: 1.2,
    fadeOutSeg: 1.5,
  },

  // MEZCLA EN dialogo_nativo (UGC, objeto parlante).
  //
  // Aca el dialogo vive DENTRO del clip: no hay pista de voz aparte. Eso cambia
  // dos cosas.
  //
  // 1. No hay nada que agachar. En voz_en_off el ambiente del clip baja -10 dB
  //    para dejarle sitio a la narracion. Aca el ambiente y la voz son la MISMA
  //    pista: agacharla agacharia tambien al personaje. Va a 0 dB, manda.
  //
  // 2. La musica tiene que ir mas abajo que en voz_en_off, y no por gusto:
  //    el dialogo que genera el modelo NO viene normalizado y llega mas bajo
  //    que una voz de ElevenLabs. Medido en los dos clips de prueba del
  //    2026-09-03: mean -25.8 y -24.0 dBFS, picos -8.3 y -7.1. Una voz en off
  //    normalizada anda por -16/-18 dBFS de media. Son ~6 dB de diferencia.
  //
  //    Con la musica a los -26 dB de voz_en_off quedaria practicamente al mismo
  //    nivel medio que el personaje hablando: no lo taparia del todo, pero le
  //    comeria la inteligibilidad justo en las consonantes. Por eso baja a -32.
  //
  // El calculo de arriba daba -32 dB como punto de partida. VERIFICADO DE OIDO
  // sobre el primer anuncio real (2026-09-03): a -32 la musica no se escuchaba,
  // ni siquiera lo suficiente para juzgar si la pista pegaba con el anuncio. Se
  // renderizo el mismo montaje a -32, -26 y -22 dB y se eligio -22: se
  // escucha contra la voz sin taparla.
  //
  // O sea que la diferencia real entre voz en off y dialogo nativo no eran 6 dB
  // sino 4 dB en el otro sentido: la musica va MAS ARRIBA aca (-22) que en voz
  // en off (-26), no mas abajo. La razon: el dialogo dentro del clip suena
  // constante y comprimido, sin los silencios de una narracion, asi que una
  // musica baja no se percibe nunca; y como el clip nunca se agacha (ducking 0),
  // la musica necesita nivel propio para existir.
  //
  // Para volver a probar niveles sin gastar creditos:
  //     node produccion/ensamblar.js <carpeta> --musica-db -26
  dialogoNativo: {
    duckingDb: 0, // el clip ES la voz: no se agacha

    // EL B-ROLL EN dialogo_nativo ES UN INSERTO QUE VA ENCIMA, NO UN CLIP EN FILA.
    //
    // Es un cutaway: se cubre la imagen unos segundos y la voz de la toma
    // principal SIGUE CORRIENDO POR DEBAJO, sin cortarse. Por eso refuerza lo
    // que la persona esta diciendo en ese momento.
    //
    // Metido en fila (como en voz_en_off) le abre un silencio en mitad de la
    // frase a alguien que esta hablando, y ademas estira el anuncio: la
    // duracion total es la suma de las TOMAS PRINCIPALES recortadas, nada mas.
    //
    // duracionObjetivo: un cutaway de 4s deja de ser cutaway. El generador no
    // entrega clips de menos de 3-4s, asi que el inserto SIEMPRE se acelera:
    // velocidad = largo del clip / duracionObjetivo. Un clip de 4s va a 2.0x.
    //
    // margenSegundos: no tapar ni el arranque ni el cierre del plano. El
    // inserto va centrado en su toma con este margen libre a cada lado; si no
    // entra, no se pone y se avisa.
    broll: {
      duracionObjetivo: 2.0,
      margenSegundos: 1.0,
      // Escalera de recuperacion cuando el inserto no entra con el margen
      // preferido. Un B-roll ya se genero y se pago: descartarlo es tirar un
      // activo, asi que antes se intenta que quepa.
      //   1) achicar el margen hasta margenMinimo
      //   2) achicar el inserto hasta duracionMinima
      //   3) recien ahi, descartarlo con aviso
      margenMinimo: 0.5,
      duracionMinima: 1.2,
      // DONDE CAE LA FRASE ANCLA DENTRO DEL INSERTO.
      //
      // No es "el inserto arranca en la frase": es que la frase caiga DENTRO
      // de la ventana del inserto, con la imagen ya en pantalla cuando la
      // palabra se dice. Con 0.35 y un inserto de 2s, la imagen entra 0.7s
      // antes de la frase y se queda 1.3s despues.
      //
      // Arrancar justo en la palabra llega tarde: el corte y la palabra
      // ocurren a la vez y el ojo todavia no leyo la imagen.
      anclaEnFraccion: 0.35,
      // Acelerado 2x el ambiente sube de tono y suena a ardilla, y ya iba muy
      // por debajo. Mientras el inserto esta encima solo se oye la voz de la
      // toma, a su nivel normal: ni agachada ni cortada.
      mudo: true,
    },

    musica: {
      db: -22, // elegido de oido el 2026-09-03, ver comentario arriba
      subeEnPayoffDb: 4,
      fadeInSeg: 1.2,
      fadeOutSeg: 1.5,
    },
  },
};

/**
 * Nivel de musica propio de un ESTILO, cuando lo tiene.
 *
 * El ducking y el resto de la mezcla siguen decidiendose por MODO: el
 * modo describe como suena el anuncio. Lo unico que se decide por estilo es la
 * musica (su nivel y, si hace falta, la subida del payoff), y por un motivo
 * concreto: hay estilos con una pista fija, elegida de oido
 * (recursos/musica/<estilo>.mp3). Hay dos maneras de fijarle el nivel:
 *
 *   - un numero afinado de oido una vez (zack-d-films): vale porque la pista
 *     es siempre la misma;
 *   - un nivel MEDIDO (estilo-lego): la pista fija la pone el motor, pero puede
 *     cambiarse por otra, y el numero tiene que seguirla.
 *
 * Los estilos que no estan aca generan su pista con Suno cada vez, asi que no
 * hay nada que afinar y se quedan con el valor del modo.
 *
 * zack-d-films: -16 dB, elegido de oido el 2026-09-06 comparando
 * renders a -16 y -20 contra los -26 del modo. Renderizar es gratis:
 *     node produccion/ensamblar.js <carpeta> --musica-db -20
 *
 * estilo-lego: el nivel NO es un numero fijo, se MIDE. El estilo tiene pista
 * fija ("Open Up Emotions", la copia sola generar-musica.js), pero el usuario
 * puede dejar la suya o pedir una a Suno, y cada pista viene masterizada a su
 * manera: los mismos -14 dB que quedan bien con una pueden tapar la voz con
 * otra. Lo que se fija es donde tiene que QUEDAR la musica, y el plan calcula
 * la ganancia para llegar ahi:
 *
 *     db = rmsObjetivoDb - (RMS de la pista que va a sonar, por rmsDePista)
 *
 * rmsObjetivoDb sale del anuncio aprobado: temp/lymphatic-drainage-lego-2,
 * aprobado de oido el 2026-10-05 con la musica a -14 dB y sin subida
 * en el payoff (medido en el MP4 final, mono a 8 kHz: voz -13.7 dB donde se
 * habla, musica -33.7 dB RMS). Su musica/fondo.mp3 medida con rmsDePista sobre
 * 0..102.493 s (lo que dura el anuncio) da -19.45 dB, asi que el objetivo es
 * -14.0 + (-19.45) = -33.45. Con la pista fija de recursos/ el plan vuelve a
 * dar -14.0 (sus primeros 150 s son los mismos). Si se cambia la forma de
 * medir, hay que recalibrar este numero con la misma funcion.
 *
 * La subida del payoff va en 0: en la referencia la musica es pareja de
 * principio a fin. db queda de respaldo, si la pista no se puede medir.
 * --musica-db en ensamblar.js sigue mandando sobre lo calculado.
 */
const MUSICA_POR_ESTILO = {
  'zack-d-films': { db: -16 },
  'estilo-lego': {
    db: -14,
    subeEnPayoffDb: 0,
    // minDb/maxDb: tope de lo calculado. Una pista casi muda o rota no se
    // sube mas de -6 dB, y nunca se baja de -30 (haria falta una pista a mas
    // de -3.5 dB RMS, que no existe). Si se toca el tope, se avisa.
    nivelMedido: { rmsObjetivoDb: -33.45, minDb: -30, maxDb: -6 },
  },
};

/**
 * RMS de una pista en dB, de 0 a `hastaSeg`. Decodifica en mono a 44.1 kHz en
 * float32 por un pipe de ffmpeg y lo promedia aca: un solo numero para toda la
 * ventana, sin ponderar ni filtrar. Devuelve null si no se pudo leer o si es
 * silencio puro.
 *
 * Es la medida con la que se calibro MUSICA_POR_ESTILO['estilo-lego']: si se
 * toca algo aca (mono, frecuencia, ventana), ese numero deja de valer.
 */
export function rmsDePista(rutaAudio, hastaSeg) {
  const r = spawnSync('ffmpeg', [
    '-v', 'error', '-i', rutaAudio, '-t', String(hastaSeg),
    '-ac', '1', '-ar', '44100', '-f', 'f32le', '-',
  ], { maxBuffer: 1024 * 1024 * 1024 });
  if (r.status !== 0 || !r.stdout?.length) return null;

  const n = r.stdout.length >> 2;
  let suma = 0;
  for (let i = 0; i < n; i++) {
    const v = r.stdout.readFloatLE(i * 4);
    suma += v * v;
  }
  return suma > 0 ? 10 * Math.log10(suma / n) : null;
}

/**
 * Valores de mezcla segun el modo de audio, y el estilo si tiene nivel propio.
 * En voz_en_off manda la narracion; en dialogo_nativo manda el clip.
 *
 * `musica` cae a propocito en la misma rama que voz_en_off, y no es un olvido:
 * ahi tambien hay una pista maestra externa (la cancion) con el ambiente de los
 * clips agachado por debajo, asi que el ducking de -10 dB es el mismo. Lo que
 * no hay en musica es pista de fondo: la carpeta musica/ va vacia, buscarMusica
 * devuelve null y el bloque de musica del plan queda en null solo. No hay que
 * bloquear nada.
 */
export function mezclaPara(modoAudio, estilo = null) {
  const porEstilo = (estilo && MUSICA_POR_ESTILO[estilo]) || {};

  if (modoAudio === 'dialogo_nativo') {
    return {
      duckingDb: REGLAS.dialogoNativo.duckingDb,
      musica: { ...REGLAS.musica, ...REGLAS.dialogoNativo.musica, ...porEstilo },
    };
  }
  return { duckingDb: REGLAS.duckingDb, musica: { ...REGLAS.musica, ...porEstilo } };
}

/**
 * Busca la pista: primero la que el usuario haya dejado en musica/, si no la
 * generada (o la fija que copio el motor). La regla vive en pista-fija.js
 * porque `npm run musica` tiene que nombrar la misma. Devuelve null si no hay
 * ninguna — y eso esta bien.
 */
function buscarMusica(carpeta, estilo) {
  const elegida = elegirPista(carpeta, estilo);
  return elegida ? `musica/${elegida}` : null;
}

/**
 * Desde donde la musica sube de nivel: la primera toma que muestra el producto.
 * Ese es el giro del anuncio, donde deja de plantearse el problema.
 */
function inicioDelPayoff(manifiesto, bloques) {
  // Cualquier referencia cuyo tipo sea "producto" sirve, se llame como se llame.
  const idsDeProducto = new Set(
    listaDeReferencias(manifiesto)
      .filter((r) => (r.tipo || '').toLowerCase() === 'producto')
      .map((r) => r.id)
  );
  if (idsDeProducto.size === 0) return null;

  const conProducto = manifiesto.tomas.find((t) => (t.referencias || []).some((v) => idsDeProducto.has(v)));
  if (!conProducto) return null;
  const b = bloques.find((x) => x.linea === conProducto.n);
  if (!b) return null;

  // La heuristica es "la primera toma que muestra el producto es el giro".
  // Eso vale cuando el producto APARECE a mitad del anuncio. Pero si esta en
  // cuadro desde la primera toma —en UGC pasa: el envase queda sobre la mesa
  // desde el arranque para que tomarlo sea una accion fisica y no aparezca de
  // la nada— entonces la primera toma con producto es la toma 1, el "giro"
  // cae en el segundo 0, y la musica sube desde el principio: deja de haber
  // dinamica y queda simplemente mas fuerte todo el anuncio.
  //
  // Cuando la heuristica no distingue nada, no sirve. En ese caso el punto de
  // subida pasa al arranque de la ULTIMA toma, que es el CTA: sigue siendo un
  // final que levanta, que es lo que la subida busca.
  if (b.inicio <= 0.001 && bloques.length > 1) {
    const ultima = bloques[bloques.length - 1];
    return ultima.inicio;
  }
  return b.inicio;
}

const dur = (archivo) =>
  Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', archivo], {
      encoding: 'utf8',
    }).trim()
  );

/**
 * Plan de montaje en dialogo_nativo (UGC, objeto parlante).
 *
 * Aca NO hay pista de voz que marque los tiempos: el personaje habla dentro del
 * clip. Se invierte todo respecto de voz_en_off — EL CLIP MANDA Y LA VENTANA SE
 * CALCULA DESDE EL, no al reves. La duracion total del anuncio es la suma de
 * los clips, no un numero fijado de antemano.
 *
 * Dos reglas propias de este modo:
 *
 * 1. RECORTE DE BORDES. Cada clip se recorta por delante y por detras hasta
 *    donde el personaje habla, mas un margen. Nunca por dentro (ahi vive el
 *    lip-sync). Lo resuelve recortar-bordes.js.
 *
 * 2. EL AJUSTE DEPENDE DE SI EL CLIP HABLA, NO DEL TIPO DE TOMA.
 *      - tomas principales: NUNCA se aceleran. Hay una voz adentro y acelerarla
 *        la deforma. Si el dialogo sale apurado, se regenera el clip.
 *      - B-roll: SI se acelera para entrar en su ventana. No tiene voz, no hay
 *        nada que deformar, y el ritmo queda mas dinamico.
 *
 * Y el B-roll va ENTRE escenas, con ventana propia: no puede taparle la cara a
 * alguien que esta hablando.
 */
/** Compara palabras ignorando tildes, mayusculas y puntuacion. */
const normalizarPalabra = (t) =>
  String(t)
    .toLowerCase()
    .normalize('NFD')
    // NFD separa la tilde de la letra; el filtro de abajo se lleva la tilde
    // sola junto con la puntuacion, asi que "linfatico" y "linfatico" con
    // tilde caen en la misma clave.
    .replace(/[^a-z0-9]+/g, '');

/**
 * Lista plana de palabras con su segundo absoluto, sacada de subtitulos.json.
 *
 * Devuelve null si el archivo todavia no existe, y eso NO es un error: los
 * subtitulos se generan A PARTIR de este mismo plan, asi que en la primera
 * pasada no estan. Por eso la secuencia real del montaje es
 *   plan -> subtitulos -> plan -> ensamblar
 * y en la primera pasada los insertos caen centrados.
 */
function palabrasConTiempo(carpeta) {
  const ruta = path.join(carpeta, 'subtitulos.json');
  if (!fs.existsSync(ruta)) return null;
  try {
    const s = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    const pal = [];
    for (const b of s.bloques || []) {
      for (const w of b.palabras || []) pal.push({ t: normalizarPalabra(w.texto), inicio: w.inicio });
    }
    return pal.length ? pal : null;
  } catch {
    return null;
  }
}

/**
 * En que segundo arranca `frase`, buscada SOLO dentro de la ventana de su toma.
 *
 * Acotar la busqueda a la toma no es un detalle: "cada semana" puede aparecer
 * en dos tomas distintas, y el inserto tiene que anclarse al de SU toma.
 * Devuelve null si no aparece — ahi el inserto vuelve a ir centrado.
 */
function segundoDeLaFrase(palabras, frase, desde, hasta) {
  if (!palabras || !frase) return null;
  const objetivo = String(frase).split(/\s+/).map(normalizarPalabra).filter(Boolean);
  if (!objetivo.length) return null;
  for (let i = 0; i <= palabras.length - objetivo.length; i++) {
    if (palabras[i].inicio < desde || palabras[i].inicio > hasta) continue;
    if (objetivo.every((w, j) => palabras[i + j] && palabras[i + j].t === w)) return palabras[i].inicio;
  }
  return null;
}

/**
 * UGC por bloques (tipo R): donde termina el bloque si el modelo repitio el final.
 *
 * POR QUE. Un bloque se genera de 10, 8 o 6 s de una vez, y si su texto es
 * corto para esa duracion el modelo llena el tiempo que le sobra repitiendo el
 * final. Medido el 2026-10-04 (temp/prueba-ugc-bloques/): un bloque de 10 s con
 * 24 palabras termino diciendo "mucho mas tranquila" dos veces. El recorte por
 * silencio no lo ve —la repeticion es voz— y la dejaba entera en el montaje.
 *
 * cortar-cola-ugc.js (npm run ugc:cola) transcribe el bloque y, si hay voz
 * despues de la ultima palabra del guion, deja toma-N.cola.json con `fin`: el
 * segundo del clip donde tiene que terminar. Aca el borde final pasa a ser el
 * MENOR entre el del silencio y ese `fin`. Nunca alarga el bloque, no toca la
 * cabeza ni el interior (el lip-sync), y es el mismo corte no destructivo de
 * siempre: lo aplica la Sequence de Remotion, que dura lo util.
 *
 * Cualquier otra toma, o una R sin cola.json, vuelve con el borde tal cual.
 */
function conCorteDeCola(toma, borde, carpeta, avisos) {
  if (toma.tipo !== 'R') return borde;
  const ruta = path.join(carpeta, `toma-${toma.n}.cola.json`);
  if (!fs.existsSync(ruta)) return borde;

  const nombre = path.basename(ruta);
  const comoRehacer = `npm run ugc:cola -- ${path.relative(process.cwd(), carpeta).replace(/\\/g, '/')} --tomas ${toma.n}`;
  let cola;
  try {
    cola = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch (e) {
    avisos.push(`toma ${toma.n}: ${nombre} no es JSON valido (${e.message}). Se ignora: el bloque se corta solo por silencio.`);
    return borde;
  }

  // El corte se midio sobre UN clip. Si el clip cambio despues (se regenero o
  // se reemplazo a mano), ese segundo ya no significa nada en el clip nuevo.
  if (cola.clip?.bytes != null && cola.clip.bytes !== fs.statSync(borde.archivo).size) {
    avisos.push(`toma ${toma.n}: ${nombre} se midio sobre otro clip. Se ignora. Vuelve a medirlo: ${comoRehacer}`);
    return borde;
  }

  const finCola = Number(cola.fin);
  const finSilencio = borde.duracion - borde.fin;
  // Mismo minimo que analizarBordes: un bloque de medio segundo es un error.
  if (!Number.isFinite(finCola) || finCola - borde.inicio <= 0.5) {
    avisos.push(`toma ${toma.n}: ${nombre} trae un fin invalido (${JSON.stringify(cola.fin)}). Se ignora: ${comoRehacer}`);
    return borde;
  }
  if (finCola >= finSilencio) return borde; // el silencio ya corta antes

  avisos.push(
    `toma ${toma.n}: el bloque termina en ${finCola.toFixed(2)}s del clip y no en ${finSilencio.toFixed(2)}s ` +
      `(corte de cola: ${cola.motivo || nombre}).`
  );
  return {
    ...borde,
    fin: Number((borde.duracion - finCola).toFixed(3)),
    util: Number((finCola - borde.inicio).toFixed(3)),
    // Una pausa que queda despues del corte ya no esta en el montaje.
    interiores: borde.interiores.filter((x) => x.hasta < finCola),
    corteDeCola: finCola,
  };
}

function planearDialogoNativo({ manifiesto, dirVideo, duracionClip, brollPorToma }) {
  // dirVideo es siempre <carpeta>/video: de ahi sale la carpeta del anuncio,
  // que es donde vive subtitulos.json.
  const palabras = palabrasConTiempo(path.dirname(dirVideo));
  const bloques = [];
  const avisos = [];
  const brollUsados = new Set();
  const recortes = [];
  let cursor = 0;

  for (const toma of manifiesto.tomas) {
    const archivoToma = `toma-${toma.n}.mp4`;
    const largo = duracionClip.get(archivoToma);

    if (largo === undefined) {
      avisos.push(`toma ${toma.n}: no encuentro el clip en la carpeta video/`);
      bloques.push({
        linea: toma.n,
        texto: toma.linea,
        inicio: Number(cursor.toFixed(3)),
        fin: Number(cursor.toFixed(3)),
        ventana: 0,
        tipo: toma.tipo,
        toma: { archivo: archivoToma, metodo: 'falta el clip', velocidad: 1, recorte: 0, problema: true },
        motivoBroll: 'la toma no tiene clip',
      });
      continue;
    }

    // dirVideo es <carpeta>/video; el corte de cola vive en <carpeta>.
    const borde = conCorteDeCola(toma, analizarBordes(path.join(dirVideo, archivoToma)), path.dirname(dirVideo), avisos);
    recortes.push(borde);

    // En un bloque R (UGC por bloques) las pausas son a proposito: los cortes
    // entre tramos y el tramo sin dialogo. Avisarlas en cada bloque es ruido.
    if (borde.interiores.length && toma.tipo !== 'R') {
      const detalle = borde.interiores
        .map((x) => `${x.desde.toFixed(2)}-${x.hasta.toFixed(2)}s`)
        .join(', ');
      avisos.push(
        `toma ${toma.n}: tiene ${borde.interiores.length} pausa(s) DENTRO del dialogo (${detalle}). ` +
          'No se tocan: ahi esta el lip-sync. Si el ritmo se siente lento, se regenera el clip mas corto.'
      );
    }

    const duracionToma = borde.util;
    const bloque = {
      linea: toma.n,
      texto: toma.linea,
      inicio: Number(cursor.toFixed(3)),
      fin: Number((cursor + duracionToma).toFixed(3)),
      ventana: duracionToma,
      tipo: toma.tipo,
      toma: {
        archivo: archivoToma,
        largoOriginal: borde.duracion,
        duracion: duracionToma,
        desde: Number(cursor.toFixed(3)),
        // El clip manda: ni se acelera ni se corta por dentro.
        metodo: 'sin-ajuste',
        velocidad: 1,
        recorte: 0,
        // Que parte del clip se usa. Lo aplica Remotion como punto de entrada
        // y de salida, no como corte destructivo.
        recorteInicio: borde.inicio,
        recorteFin: borde.fin,
        pausasInteriores: borde.interiores.length,
        // Solo bloques R con corte de cola aplicado: el segundo del clip donde
        // termina. Lo leen los subtitulos (no alinear contra la repeticion) y
        // el plan para humanos. En cualquier otra toma la clave no existe.
        ...(borde.corteDeCola !== undefined ? { corteDeCola: borde.corteDeCola } : {}),
        problema: false,
      },
      motivoBroll: null,
    };
    cursor += duracionToma;

    // EL B-ROLL VA ENCIMA DE LA TOMA, NO A CONTINUACION.
    //
    // Es un cutaway: cubre la imagen mientras la voz de la toma sigue sonando
    // por debajo. NO suma a la duracion total, por eso el cursor no avanza.
    const cfg = REGLAS.dialogoNativo.broll;
    const broll = brollPorToma.get(toma.n);

    if (!broll) {
      bloque.motivoBroll = 'no hay B-roll para esta toma';
    } else {
      const archivoB = `broll-${broll.n}.mp4`;
      const largoB = duracionClip.get(archivoB);

      // Escalera de recuperacion: primero el margen, despues la duracion.
      // Descartar es el ultimo recurso, no el primero: ese clip ya se pago.
      let margen = cfg.margenSegundos;
      let duracionInserto = cfg.duracionObjetivo;
      let comoEntro = 'con el margen preferido';

      if (duracionToma - 2 * margen < duracionInserto) {
        margen = cfg.margenMinimo;
        comoEntro = `con el margen reducido a ${margen}s por lado`;
      }
      if (duracionToma - 2 * margen < duracionInserto) {
        duracionInserto = Number((duracionToma - 2 * margen).toFixed(3));
        comoEntro = `con margen ${margen}s y el inserto acortado a ${duracionInserto.toFixed(2)}s`;
      }

      if (largoB === undefined) {
        avisos.push(`B-roll ${broll.n}: no encuentro el clip en la carpeta video/`);
        bloque.motivoBroll = 'falta el clip del B-roll';
      } else if (duracionInserto < cfg.duracionMinima) {
        // Ni achicando el margen ni el inserto. Recien aca se descarta.
        bloque.motivoBroll =
          `no cabe el inserto ni en el minimo: la toma ${toma.n} dura ${duracionToma.toFixed(2)}s ` +
          `y para un inserto de ${cfg.duracionMinima}s con ${cfg.margenMinimo}s de margen a cada lado ` +
          `hacen falta ${(cfg.duracionMinima + 2 * cfg.margenMinimo).toFixed(2)}s`;
        avisos.push(
          `B-roll ${broll.n} (toma ${toma.n}): ${bloque.motivoBroll}. ` +
            'QUEDA FUERA — ese clip ya se genero y se pago. Si lo quieres usar, alarga esa toma o ponlo a mano.'
        );
      } else {
        duracionInserto = Number(duracionInserto.toFixed(3));
        // Siempre se acelera: el generador no entrega clips tan cortos.
        const velocidad = Number((largoB / duracionInserto).toFixed(3));
        // DONDE CAE EL INSERTO DENTRO DE SU TOMA.
        //
        // Anclado a su frase (broll.sincroniza_con) cuando hay subtitulos
        // alineados; centrado cuando no los hay todavia.
        //
        // Por que dejo de ir centrado: medido sobre el primer anuncio de
        // talking-object, cuatro de siete insertos caian entre 2.5 y 2.9s
        // ANTES de su frase, y son exactamente los cuatro cuya ancla esta al
        // final de la linea. Con un inserto de 2s, uno que arranca 2.74s antes
        // ya termino antes de que la palabra se diga: no llega temprano, no
        // coincide nunca. Dos de esos cuatro eran los remates del anuncio.
        //
        // El clamp contra los bordes de la toma no es defensivo, hace falta de
        // verdad: en ese anuncio la frase "empieza hoy" caia a 60.29s y el
        // anuncio terminaba a 61.23s. Sin clamp el inserto se salia del final.
        const ancla = segundoDeLaFrase(palabras, broll.sincroniza_con, bloque.inicio, bloque.fin);
        const minimo = bloque.inicio + margen;
        const maximo = bloque.inicio + duracionToma - margen - duracionInserto;
        let desde;
        let anclado;
        if (ancla === null) {
          desde = bloque.inicio + (duracionToma - duracionInserto) / 2;
          anclado = palabras
            ? `centrado: "${broll.sincroniza_con}" no aparece en los subtitulos de esta toma`
            : 'centrado: todavia no hay subtitulos alineados (primera pasada del plan)';
        } else {
          const ideal = ancla - duracionInserto * cfg.anclaEnFraccion;
          const limite = (m) => bloque.inicio + duracionToma - m - duracionInserto;
          desde = Math.min(Math.max(ideal, minimo), maximo);

          // LA FRASE TIENE QUE CAER DENTRO DE LA VENTANA DEL INSERTO.
          //
          // Cuando la frase esta muy cerca del final de la toma, el clamp la
          // deja afuera: el inserto termina ANTES de que la palabra se diga, y
          // entonces no refuerza nada. Es el caso de la ultima frase de un
          // anuncio, que es justo donde mas importa.
          //
          // Antes de darlo por perdido se afloja el margen de cola hasta
          // cfg.margenMinimo, y solo lo justo: `ideal` sigue siendo el tope, asi
          // que el inserto nunca se corre mas de lo necesario. Es la misma
          // escalera de recuperacion que ya se usa cuando el inserto no entra
          // — no hay parametro nuevo.
          //
          // Medido: en el primer anuncio de talking-object, "empieza hoy" caia a
          // 60.29s con el anuncio terminando a 61.16s. Con el margen preferido
          // de 1.0s el inserto cerraba a 60.16s, 0.13s ANTES de la frase.
          // Se afloja HACIA LOS DOS LADOS, y solo si eso alcanza para cubrir.
          //
          // Los dos bordes fallan, y por motivos opuestos: la frase puede caer
          // muy al final de la toma (el inserto cierra antes de que se diga) o
          // muy al principio (el inserto todavia no entro). Medido: en el
          // anuncio de talking-object fallaba la cola; en el de UGC, la cabeza.
          //
          // Si ni con el margen minimo se cubre, se deja el margen PREFERIDO:
          // mover el inserto sin lograr la coincidencia no compra nada y le
          // come el arranque o el cierre del plano para nada.
          const cubreCon = (x) => ancla >= x && ancla <= x + duracionInserto;
          let margenCabeza = margen;
          let margenCola = margen;
          if (!cubreCon(desde) && margen > cfg.margenMinimo) {
            const relajado = Math.min(
              Math.max(ideal, bloque.inicio + cfg.margenMinimo),
              limite(cfg.margenMinimo)
            );
            if (cubreCon(relajado)) {
              desde = relajado;
              margenCabeza = desde - bloque.inicio;
              margenCola = bloque.inicio + duracionToma - (desde + duracionInserto);
            }
          }

          const corrido = desde - ideal;
          const cubre = ancla >= desde && ancla <= desde + duracionInserto;
          anclado =
            `anclado a "${broll.sincroniza_con}" (${ancla.toFixed(2)}s)` +
            (Math.abs(corrido) > 0.01
              ? `, corrido ${corrido > 0 ? '+' : ''}${corrido.toFixed(2)}s para entrar entero en la toma`
              : '') +
            (margenCola < margen || margenCabeza < margen
              ? `, con el margen aflojado a ${Math.min(margenCabeza, margenCola).toFixed(2)}s`
              : '') +
            (cubre ? '' : ' — LA FRASE QUEDA FUERA DEL INSERTO');
          if (!cubre) {
            avisos.push(
              `B-roll ${broll.n} (toma ${toma.n}): la frase "${broll.sincroniza_con}" cae a ${ancla.toFixed(2)}s y el ` +
                `inserto cierra a ${(desde + duracionInserto).toFixed(2)}s. Queda demasiado pegada al final de la toma ` +
                'para que un inserto de ese largo la cubra.'
            );
          }
        }
        desde = Number(desde.toFixed(3));

        bloque.broll = {
          n: broll.n,
          archivo: archivoB,
          sincroniza_con: broll.sincroniza_con,
          largoOriginal: Number(largoB.toFixed(3)),
          duracion: duracionInserto,
          desde,
          superpuesto: true,
          metodo: 'inserto acelerado encima de la toma',
          velocidad,
          recorte: 0,
          mudo: cfg.mudo,
          problema: false,
          anclado,
          anclaSegundo: ancla === null ? null : Number(ancla.toFixed(3)),
        };
        bloque.motivoBroll =
          `inserto de ${duracionInserto.toFixed(2)}s a ${velocidad.toFixed(2)}x, encima de la toma ` +
          `desde ${desde.toFixed(2)}s, ${comoEntro} (sincroniza con "${broll.sincroniza_con}")`;
        bloque.broll.margenUsado = margen;
        bloque.broll.comoEntro = comoEntro;
        if (margen < cfg.margenSegundos || duracionInserto < cfg.duracionObjetivo) {
          avisos.push(
            `B-roll ${broll.n} (toma ${toma.n}): entro ${comoEntro}, no con los valores preferidos ` +
              `(${cfg.duracionObjetivo}s de inserto y ${cfg.margenSegundos}s de margen). La toma dura ${duracionToma.toFixed(2)}s.`
          );
        }
        brollUsados.add(broll.n);
      }
    }

    bloques.push(bloque);
  }

  const brollFuera = (manifiesto.broll || []).filter((b) => !brollUsados.has(b.n)).map((b) => b.n);
  return { bloques, avisos, brollUsados: [...brollUsados], brollFuera, finAudio: Number(cursor.toFixed(3)), recortes };
}

/**
 * Color de resaltado del subtitulo. Distinto en cada anuncio, pero SIEMPRE el
 * mismo dentro del mismo anuncio: sale del nombre de la carpeta, no de un
 * random. Con random, dos renders del mismo anuncio saldrian de colores
 * distintos y no habria forma de reproducir una version entregada.
 */
export function colorDeResaltado(carpeta, paleta) {
  // 1. Si este anuncio ya eligio color, ese se queda. Se guarda en su carpeta
  //    para que dos renders del mismo anuncio salgan identicos: si el color
  //    cambiara al re-renderizar, no habria forma de reproducir una version
  //    ya entregada.
  const propio = path.join(carpeta, 'color-subtitulos.json');
  if (fs.existsSync(propio)) {
    try {
      const g = JSON.parse(fs.readFileSync(propio, 'utf8'));
      if (g.color) return g.color;
    } catch {
      /* archivo roto: se vuelve a elegir abajo */
    }
  }

  // 2. Colores que ya usan los OTROS anuncios. Un hash suelto sobre la paleta
  //    repite color muy seguido (con 6 colores y 4 anuncios, chocar es lo
  //    normal), y lo que se busca es que cada anuncio se vea distinto.
  const usados = new Set();
  const padre = path.dirname(carpeta);
  try {
    for (const d of fs.readdirSync(padre)) {
      if (d === path.basename(carpeta)) continue;
      const otro = path.join(padre, d, 'color-subtitulos.json');
      if (!fs.existsSync(otro)) continue;
      try {
        const g = JSON.parse(fs.readFileSync(otro, 'utf8'));
        if (g.color) usados.add(g.color);
      } catch {
        /* se ignora */
      }
    }
  } catch {
    /* si no se puede listar, se elige de toda la paleta */
  }

  const libres = paleta.filter((c) => !usados.has(c));
  const candidatos = libres.length ? libres : paleta;

  let h = 0;
  for (const c of path.basename(carpeta)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const color = candidatos[h % candidatos.length];

  try {
    fs.writeFileSync(propio, JSON.stringify({ color, elegido: new Date().toISOString() }, null, 2) + '\n', 'utf8');
  } catch {
    /* si no se puede escribir, el color sigue siendo estable por el hash */
  }
  return color;
}

/**
 * Lee transiciones.json de la carpeta del anuncio y lo resuelve contra los
 * bloques ya planificados, para saber en que segundo cae cada una.
 *
 * El archivo lo escribe una persona (o yo, y se puede editar a mano): las
 * posiciones son una decision creativa, no una regla automatica. Si no existe,
 * el anuncio va sin animaciones ni efectos, que es el comportamiento de
 * siempre (corte seco por defecto; COMO-PRODUCIR.md, seccion 4).
 */
/**
 * Segundo en el que un efecto de sonido EMPIEZA A OIRSE de verdad (su ataque),
 * no en el que alcanza su pico.
 *
 * POR QUE HACE FALTA. No todos los efectos arrancan sonando: el `deep-woosh.mp3`
 * es un SWELL que empieza en -54 dB y sube. Puesto a sonar desde el corte, la
 * parte audible llega tarde y se siente desfasado del movimiento.
 *
 * La salida NO es recortarle la cabeza al archivo: eso le quita el swell, que es
 * su caracter, y suena pobre (probado el 2026-09-06, se rechazo de oido).
 * La salida es ADELANTAR la reproduccion, dejando el archivo intacto: la subida
 * ocurre durante la toma anterior y el sonido "llega" justo en el corte.
 *
 * POR QUE EL ATAQUE Y NO EL PICO. La primera version anclaba el PICO al corte
 * (0.40s de adelanto en el deep-woosh) y quedaba demasiado adelantado. Montado
 * a mano en CapCut (con captura de pantalla), el efecto va ~0.2s antes del
 * corte, no 0.4s. Medido, ahi es donde el archivo salta de -31.9 a -23.7 dB —
 * su ataque. Con ese anclaje el pico cae DENTRO de la animacion, que es lo que
 * suena bien. El oido sigue el ataque, no el maximo.
 *
 * Se mide aqui y no se escribe a mano en ninguna config: si alguien reemplaza un
 * efecto por otro con distinta forma, el adelanto se recalcula solo.
 *
 * astats escribe en STDERR y ffmpeg termina con codigo 0 — mismo detalle que
 * silencedetect. Por eso spawnSync.
 */
const VENTANA_PICO_SEG = 0.05;
// Cuanto por debajo del pico se considera que el efecto "ya suena".
// 3 dB no es arbitrario: es el valor con el que la medicion del deep-woosh da
// 0.20s, que es EXACTAMENTE donde se coloca a mano en CapCut. Se comprobo en
// tres capturas con el timecode a la vista: el audio empieza en 00:00:01:04
// (1.133s), el corte esta en 00:00:01:10 (1.333s), y el audio termina en
// 00:00:02:14 (2.467s) — 1.334s de duracion, que cuadra con el archivo real.
const UMBRAL_ATAQUE_DB = 3;

export function segundoDelGolpe(rutaAudio) {
  const r = spawnSync('ffmpeg', [
    '-hide_banner', '-i', rutaAudio,
    '-af', `asetnsamples=${Math.round(44100 * VENTANA_PICO_SEG)},astats=metadata=1:reset=1,` +
           'ametadata=print:key=lavfi.astats.Overall.RMS_level',
    '-f', 'null', '-',
  ], { encoding: 'utf8' });

  // Ojo: matchAll devuelve el array de match completo, no el grupo. Hay que
  // tomar m[1]; con .map(Number) salen NaN y el pico queda siempre en 0.
  const niveles = [...String(r.stderr || '').matchAll(/RMS_level=(-?[\d.]+)/g)].map((m) => Number(m[1]));
  if (!niveles.length) return 0;

  let iPico = 0;
  for (let i = 1; i < niveles.length; i++) if (niveles[i] > niveles[iPico]) iPico = i;

  // El ataque: la PRIMERA ventana que llega a menos de UMBRAL_ATAQUE_DB del
  // pico. En un efecto que ya arranca sonando (el woosh) es la ventana 0 y el
  // adelanto sale 0; en un swell es donde de verdad empieza a oirse.
  const minimo = niveles[iPico] - UMBRAL_ATAQUE_DB;
  let iAtaque = iPico;
  for (let i = 0; i <= iPico; i++) {
    if (niveles[i] >= minimo) { iAtaque = i; break; }
  }
  return Number((iAtaque * VENTANA_PICO_SEG).toFixed(3));
}

export function resolverTransiciones(carpeta, bloques, avisos = []) {
  const ruta = path.join(carpeta, 'transiciones.json');
  if (!fs.existsSync(ruta)) return [];

  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch (e) {
    avisos.push(`transiciones.json no es JSON valido (${e.message}). Se ignora.`);
    return [];
  }

  const efectos = doc.efectos || {};
  const salida = [];

  for (const p of doc.puntos || []) {
    const bloque = bloques.find((b) => b.linea === p.toma);
    if (!bloque) {
      avisos.push(`transiciones: la toma ${p.toma} no existe en el montaje. Se ignora ese punto.`);
      continue;
    }
    const archivo = p.efecto ? efectos[p.efecto] : null;
    if (p.efecto && !archivo) {
      avisos.push(`transiciones: el efecto "${p.efecto}" no esta declarado en "efectos". Va la animacion sin sonido.`);
    }
    if (archivo && !fs.existsSync(path.join(carpeta, archivo))) {
      avisos.push(`transiciones: no encuentro el archivo ${archivo}. Va la animacion sin sonido.`);
    }
    const archivoOk = archivo && fs.existsSync(path.join(carpeta, archivo)) ? archivo : null;
    // Cuanto hay que ADELANTAR el sonido para que su golpe caiga en el corte.
    // Se mide del archivo real; ver segundoDelGolpe().
    const adelantoSeg = archivoOk ? segundoDelGolpe(path.join(carpeta, archivoOk)) : 0;

    salida.push({
      toma: p.toma,
      desde: bloque.toma.desde,
      animacion: p.animacion,
      efecto: p.efecto || null,
      archivo: archivoOk,
      adelantoSeg,
      porque: p.porque || '',
    });
  }

  return salida.sort((a, b) => a.desde - b.desde);
}

/**
 * Los clips de la cadena que salieron del modelo de respaldo, segun
 * video/log-modelos.json (lo escribe generar-videos.js). Solo para avisar:
 * hay que revisar sus uniones. Sin log, o roto, ninguno.
 */
function clipsDeRespaldo(dirVideo) {
  const ruta = path.join(dirVideo, 'log-modelos.json');
  if (!fs.existsSync(ruta)) return [];
  try {
    const log = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    return (Array.isArray(log.clips) ? log.clips : []).filter((c) => c && c.respaldo === true && c.archivo).map((c) => c.archivo);
  } catch {
    return [];
  }
}

/**
 * Plan de montaje en CONTINUIDAD (el manifiesto trae el bloque "continuidad";
 * ver produccion/continuidad.js).
 *
 * Aca no hay una toma por linea: hay una CADENA de clips seguidos (los pasos
 * de una imagen a la siguiente, el clip propio de cada toma B y el cierre).
 * El reparto lo hace planearContinuidad(), que es puro: aca solo se miden los
 * clips en disco (cuadros / fps, no el contenedor) y se le pasan.
 *
 * Reglas, que no son las de ajustar(): nunca se corta ni la cabeza ni la cola
 * de un clip, solo cambia la velocidad; sin B-roll y sin transiciones del
 * editor. Las reglas viven en REGLAS_CONTINUIDAD (continuidad.js), no en
 * REGLAS: REGLAS se escribe entera en todos los planes.
 *
 * Con `prediccion` no se mide nada: cada clip va con el largo que se pide en
 * el manifiesto (npm run plan -- <carpeta> --prediccion).
 *
 * Devuelve lo mismo que planear() (bloques, avisos, brollUsados, brollFuera,
 * finAudio) mas `continuidad`, el plan de la cadena. Los bloques son uno por
 * linea, SIN `toma`: los clips estan en continuidad.clips.
 */
export function planearMontajeContinuidad({ manifiesto, tiempos, dirVideo, prediccion = false }) {
  if (manifiesto.modo_audio !== 'voz_en_off') {
    throw new Error(
      `continuidad es solo para anuncios con narrador en voz en off y este es "modo_audio": ${JSON.stringify(manifiesto.modo_audio)}. ` +
        'Revisalo con: npm run validar -- <carpeta>/manifiesto.json'
    );
  }
  const cadena = cadenaDeClips(manifiesto, { estimar: true, tiempos });
  const largos = prediccion ? null : fs.existsSync(dirVideo) ? medirCadena(dirVideo, cadena) : new Map();
  const respaldo = prediccion ? [] : clipsDeRespaldo(dirVideo);
  const cont = planearContinuidad({ manifiesto, tiempos, largos, respaldo });
  return {
    bloques: cont.bloques,
    avisos: [...cont.avisos],
    brollUsados: [],
    brollFuera: [],
    finAudio: cont.duracion,
    continuidad: cont,
  };
}

// ======================================================= ESTILOS HABLADOS
//
// PODCAST Y ENTREVISTA (tomas tipo H; su flujo esta en COMO-PRODUCIR.md, seccion 12).
//
// Son dialogo nativo —la gente habla dentro del clip— pero el montaje no es
// "una toma por linea con un inserto encima": en podcast una toma de 10 s trae
// VARIAS lineas del guion y el anuncio las intercala con las del otro host; en
// entrevista hay un congelado con golpe, una cadena de B-roll que tapa la
// historia, iconos con check, el producto al centro con un clic y un texto de
// CTA. Nada de eso cabe en `bloques`, que solo sabe de una toma por linea.
//
// Por eso el plan de estos estilos tiene DOS partes:
//   - `bloques`: la linea de tiempo del AUDIO, un bloque por segmento hablado,
//     con la misma forma que en dialogo_nativo (asi subtitulos-dialogo.js,
//     plan-para-humanos.js y ensamblar.js siguen leyendolo), mas `segmento`
//     cuando el bloque es un trozo del clip.
//   - `escena`: las capas de VIDEO que renderiza Remotion (piezas con tipo,
//     capa, marco, desde y duracion en segundos del anuncio).
//
// Todo esto corre SOLO cuando `estilo` esta en ESTILOS_HABLADOS. Cualquier
// otro manifiesto pasa por planear() exactamente igual que antes.
//
// Las reglas viven en REGLAS_HABLADO y se cuelgan de REGLAS como propiedades
// NO enumerables (ver abajo). Por que no van escritas dentro de REGLAS: REGLAS
// se escribe entera en el plan-montaje.json de TODOS los estilos, y dos claves
// nuevas cambiarian el plan de todos los anuncios existentes (la regresion
// exige el mismo plan byte a byte salvo `generado`). Asi REGLAS.podcast y
// REGLAS.entrevista existen para el codigo,
// pero JSON.stringify(REGLAS) y { ...REGLAS } siguen dando lo de siempre. En
// estos dos estilos el plan si las lleva, como reglas.podcast / reglas.entrevista.
export const REGLAS_HABLADO = {
  podcast: {
    // Cutaway: el otro host reaccionando mientras se dice una linea, CON el
    // sonido de su reaccion, cutawayVolumenDb por debajo de la voz (a 0 dB el
    // "hmm" tapaba palabras; -6 se aprobo de oido en Cayenne). Reglas
    // aprobadas en las pruebas (2026-10-14):
    //   - entra cutawayTrasFraseSeg respecto del FIN de la frase que lo
    //     provoca (guion[].cutaway.tras): 0.1 s antes de que termine;
    //   - nunca en los primeros turnoMinSeg del turno de quien habla (turno =
    //     lineas seguidas del mismo host, desde su primera palabra): quien
    //     empieza a hablar se ve;
    //   - dura cutawaySeg y quien habla vuelve a cuadro al menos margenSeg
    //     antes de su ultima palabra del turno (dice su frase final en camara).
    //     Si no entra entero se acorta hasta cutawayMinSeg; mas corto no se lee
    //     y queda fuera. Puede cruzar a la linea siguiente del mismo turno;
    //   - nunca encima de un B-roll ni de otro cutaway.
    // Sin "tras" (manifiestos de antes) entra a los turnoMinSeg del inicio del
    // turno (o al empezar su linea, si la linea va mas adelante en el turno).
    // "Sin cutaway si el que escucha habla a continuacion" no es una regla
    // aparte: sale sola del margen (en Cayenne la linea 7 dura 2,84 s de voz y
    // no le entra ni el minimo).
    cutawaySeg: 1.4,
    cutawayMinSeg: 0.8,
    cutawayTrasFraseSeg: -0.1,
    turnoMinSeg: 2.0,
    cutawayVolumenDb: -6,
    // Margen: el que queda en el turno despues del cutaway, el que se deja al
    // cortar cada linea de su clip (fin de la linea + hasta 0.3 s) y el del
    // B-roll antes del fin de su linea.
    margenSeg: 0.3,
    // De que segundo del clip de reacciones sale cada reaccion: de donde de
    // verdad pasa (su sonido), no de un tercio fijo. Primero los eventos de
    // Scribe que deja `npm run lineas` (la risa, el "hmm"); si no son 3, los
    // golpes de la envolvente de audio: ventanas de ventanaSeg, umbral = la
    // mediana del clip (el ruido de sala) + sobreRuidoDb, unidas si las separa
    // menos de unirHuecoSeg y sin las de menos de minEventoSeg. El recorte
    // empieza antesSeg antes del sonido (el gesto arranca un poco antes).
    // Medido en Cayenne: los golpes de A caen en 1.65 / 3.80 / 6.30 s y se
    // aprobaron recortes a mano en 1.47 / 3.4 / 5.9. Sin nada, el centro del
    // tercio, como antes.
    reacciones: { antesSeg: 0.3, ventanaSeg: 0.05, sobreRuidoDb: 20, unirHuecoSeg: 0.3, minEventoSeg: 0.1 },
    // B-roll encima de una linea: desde su frase hasta el fin del segmento,
    // entre 1.5 y 5 s. Si el clip es mas largo que la ventana se acelera hasta
    // 1.6x para mostrar mas de el y se corta el resto.
    brollMinSeg: 1.5,
    brollMaxSeg: 5,
    brollVelocidadMax: 1.6,
    // Modo esquina: el host que habla va RECORTADO SIN FONDO en la esquina
    // inferior de su lado (video/recorte-toma-N.webm, de `npm run recortar`;
    // marco recorte-<lado>). Mientras no este el recorte, va en una ventana
    // redondeada de ~40 % del ancho (marco esquina-<lado>), con aviso.
    esquina: { ancho: 0.4, margen: 0.04, radio: 0.04 },
    // Mientras va un B-roll el subtitulo sube: en pantalla dividida queda en la
    // union y en esquina por encima del host. Un bloque de subtitulo cuenta
    // como "en el B-roll" si MAS de la mitad de su tiempo cae dentro de una
    // ventana de B-roll (Cayenne, aprobado en la prueba: 9 de 45 bloques). Lo
    // aplica alturasDeSubtitulos(), con los subtitulos definitivos.
    subtitulosEnBroll: { desdeAbajo: 0.45, fraccionMinima: 0.5 },
  },
  entrevista: {
    congeladoSeg: 0.8, // el congelado con golpe al final del gancho
    // El golpe del congelado: la opcion 5, la elegida en las pruebas (2026-10-14),
    // "glitch RGB + negativo". Escena la dibuja con pieza.variante; sin el
    // campo (planes viejos) queda el golpe con destello de antes.
    congeladoVariante: 'glitch',
    disolvenciaSeg: 0.25, // "combinar" entre clips (variante B) y hacia el cierre
    // Bordes de cada clip por los TIEMPOS DE CADA PALABRA (lineas-habladas.json),
    // no por volumen: en la calle el ambiente nunca es silencio y el recorte
    // por silencio no cortaba nada (Befem B toma 1 entraba con 1 s mudo). La
    // cabeza queda cabezaSeg antes de la primera palabra y la cola colaSeg
    // despues de la ULTIMA PALABRA DEL GUION (una repeticion o una muletilla
    // de despues queda fuera). El ultimo clip del gancho de A (el del
    // congelado) lleva colaAntesDelCongeladoSeg: ahi se ve la cara de "no se".
    // Una toma puede pedir otra cola con tomas[].cola_seg.
    cabezaSeg: 0.12,
    colaSeg: 0.25,
    colaAntesDelCongeladoSeg: 0.8,
    // Un hueco entre palabras desde este largo cuenta como pausa interior (solo
    // se informa: por dentro nunca se corta, ahi vive el lip-sync).
    pausaInteriorSeg: 0.3,
    // El paso voz de la variante A (`npm run voz`, recortar-voz.js), sobre las
    // tomas solo_voz de la historia: saca los huecos de adentro desde
    // huecoMinSeg dejando aireSeg de aire a cada lado y acelera video y audio
    // a `velocidad` (atempo, conserva el tono). Es la UNICA excepcion a "nunca
    // acelerar un clip hablado": ahi no se ve la boca (aprobada de oido en la
    // prueba Befem A, 2026-10-14). Las lee
    // recortar-voz.js; el plan no las usa.
    voz: { velocidad: 1.2, huecoMinSeg: 0.18, aireSeg: 0.07 },
    // Iconos de A: en pareja HORIZONTAL, uno a cada lado del cuerpo a la altura
    // del pecho o la panza, con el check DEBAJO del elegido. xs = centroX de
    // cada icono segun cuantos trae el grupo (con 3 no se probo).
    iconosA: { centroY: 0.6, ancho: 0.26, xs: { 1: [0.5], 2: [0.2, 0.8], 3: [0.2, 0.5, 0.8] } },
    // El check (y su sonido) cae en la PALABRA de la opcion elegida ("Dulce",
    // "noche"), no al empezar la respuesta, y el grupo se queda hasta
    // checkQuedaSeg despues del check. La palabra elegida es la ultima de
    // check_con que tambien esta en aparece_con, sin estas palabras vacias.
    checkQuedaSeg: 0.9,
    palabrasVaciasCheck: ['de', 'del', 'o', 'u', 'y', 'e', 'la', 'las', 'el', 'los', 'lo', 'a', 'al', 'en', 'con', 'por', 'para', 'un', 'una', 'uno', 'que', 'eh', 'ah', 'ahm', 'mm', 'este'],
    // Iconos de B: de a uno, CENTRADOS a la altura del pecho; un grupo de 2 va
    // en pareja centrada. Si el siguiente entra antes de que termine el
    // anterior, el anterior se va en ese momento (pero dura al menos minSeg).
    iconosB: { centroY: 0.56, ancho: 0.24, xs: { 1: [0.5], 2: [0.32, 0.68], 3: [0.25, 0.5, 0.75] }, minSeg: 0.6 },
    // La foto del producto en B (sticker_producto): al centro como un icono
    // mas, seg segundos o hasta el fin de su bloque, con su clic. Recortada si
    // la foto tiene transparencia real; si no, en tarjeta blanca.
    producto: { centroX: 0.5, centroY: 0.56, ancho: 0.32, seg: 3 },
    // Subtitulos de A al medio durante el gancho (los bloques que empiezan
    // antes del congelado) y abajo desde ahi. En B, siempre abajo.
    subtitulosGancho: { desdeAbajo: 0.45 },
    // Cadena de B-roll de la historia (variante A): si la ventana es mas larga
    // que el clip se ralentiza hasta 0.75x y lo que falte lo cubre el ultimo
    // fotograma congelado; si es mas corta, a 1x recortado (hasta 1.3x si asi
    // se ve mas del clip).
    brollVelocidadMin: 0.75,
    brollVelocidadMax: 1.3,
    ventanaMaxSeg: 8, // mas de esto en un solo B-roll se hace largo: aviso
    ventanaMinSeg: 1.2, // menos de esto no se alcanza a leer: aviso
    iconoSeg: 2.5, // cuanto dura un icono si no tiene frase de salida
    iconoAncho: 0.22,
    stickerSeg: 3,
    stickerAncho: 0.28,
  },
};
// REGLAS.podcast / REGLAS.entrevista: el mismo objeto, sin enumerarse. Un
// plan de otro estilo no los ve; el de estos estilos los recibe por el spread
// explicito de REGLAS_HABLADO al escribir plan-montaje.json.
for (const estilo of Object.keys(REGLAS_HABLADO)) {
  Object.defineProperty(REGLAS, estilo, { value: REGLAS_HABLADO[estilo], enumerable: false, writable: false });
}

const r3 = (x) => Number(Number(x).toFixed(3));
const clipDeToma = (n) => `toma-${n}.mp4`;
const clipDeBroll = (n) => `broll-${n}.mp4`;
const otroLado = (lado) => (lado === 'derecha' ? 'izquierda' : 'derecha');

function leerJsonSiExiste(ruta) {
  try {
    return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : null;
  } catch {
    return null;
  }
}

/**
 * lineas-habladas.json sin las medidas que son de OTRO clip que el que hay hoy
 * en video/ (estadoDeMedida de `npm run lineas`, la misma regla del paso voz y
 * de los subtitulos: cada entrada trae `tamano`, los bytes del clip que se
 * midio, y si el de video/ pesa otro el clip se regenero; una entrada de
 * antes, sin `tamano`, se compara por el largo +-0,05 s). El largo solo no
 * alcanza: Omni entrega clips del mismo largo (Cayenne: 10.005 s en cuatro
 * tomas; Befem: 10.01 en todas) y el plan cortaba el clip nuevo con los
 * tiempos de palabra del viejo. Una medida vieja cuenta como si faltara, en
 * todo (bordes, segmentos del podcast, frases ancla, revision del habla), y
 * cada estilo avisa con el comando para medirla de nuevo. Devuelve {
 * lineasHabladas, viejas } con viejas = Map(numero de toma -> motivo). Una
 * toma sin clip en video/ conserva su medida (ya tiene su aviso de "falta el
 * clip").
 */
function medidasVigentes(lineasLeidas, dirVideo, duracionClip) {
  const viejas = new Map();
  if (!lineasLeidas || !lineasLeidas.tomas || typeof lineasLeidas.tomas !== 'object') return { lineasHabladas: lineasLeidas, viejas };
  const tomas = {};
  for (const [k, entrada] of Object.entries(lineasLeidas.tomas)) {
    const archivo = clipDeToma(k);
    let vigencia = null;
    if (entrada && duracionClip.has(archivo)) {
      let tamano = null;
      try {
        tamano = fs.statSync(path.join(dirVideo, archivo)).size;
      } catch {
        // sin el clip no hay con que comparar el tamano
      }
      vigencia = estadoDeMedida(entrada, { tamano, largo: duracionClip.get(archivo) });
    }
    if (vigencia?.estado === 'vieja') viejas.set(Number(k), vigencia.motivo);
    else tomas[k] = entrada;
  }
  return { lineasHabladas: { ...lineasLeidas, tomas }, viejas };
}

/**
 * El aviso de las medidas de otro clip de unas tomas, con el texto de `npm
 * run lineas` ("la medida de toma N es de otro clip: corre npm run lineas --
 * <carpeta> --tomas N"), el porque de cada una y `luego`: que pasa mientras
 * tanto.
 */
function avisoDeMedidasViejas(ns, viejas, luego) {
  const motivos = ns.map((n) => (ns.length === 1 ? viejas.get(n) : `toma ${n}: ${viejas.get(n)}`)).join('; ');
  const texto = avisoMedidaVieja(ns);
  return `${texto[0].toUpperCase()}${texto.slice(1)} (${motivos}) y vuelve a planear. ${luego}`;
}

/**
 * Las palabras del ASR de una toma, segun lineas-habladas.json (npm run
 * lineas), en segundos DEL CLIP y normalizadas como las de subtitulos.json
 * (`t`; en `texto`, como las escribio el ASR, para compararlas como se dicen).
 * Null si no se midio esa toma.
 */
function palabrasAsrDeToma(lineasHabladas, n) {
  const t = lineasHabladas?.tomas?.[String(n)];
  if (!t || !Array.isArray(t.palabras)) return null;
  const pal = t.palabras
    .filter((w) => Number.isFinite(w.start))
    .map((w) => ({ t: normalizarPalabra(w.text), inicio: w.start, texto: String(w.text ?? '') }));
  return pal.length ? pal : null;
}

/**
 * En que segundo del ANUNCIO se dice `frase` dentro de `bloque`. Tres fuentes,
 * de la mas exacta a la mas estimada, y se usa la primera que la encuentra:
 *
 *   1. subtitulos.json: palabras alineadas, ya en tiempo del anuncio. Es la
 *      buena; por eso la secuencia es plan -> subtitulos -> plan.
 *   2. las palabras del ASR de lineas-habladas.json (tiempo del clip, se
 *      desplaza al anuncio con el segmento o el recorte del bloque).
 *   3. la posicion de la frase por indice de palabra dentro del texto del
 *      bloque, repartida en su duracion. Es una estimacion: se avisa.
 *
 * Con `desde` (segundo del anuncio) solo vale una frase que EMPIEZA ahi o
 * despues: el check de un grupo de iconos se busca despues de la pregunta,
 * porque la respuesta suele repetir sus palabras ("¿Video o imagen?"
 * "Video."). Sin `desde`, desde el inicio del bloque, como siempre.
 *
 * Devuelve { segundo, fuente, estimado } o null si la frase no esta en el
 * texto del bloque (o no esta despues de `desde`).
 */
function anclaDeFrase({ frase, bloque, palabrasSub, palabrasAsr, desde = null }) {
  if (!frase) return null;
  const piso = desde === null ? bloque.inicio : Math.max(bloque.inicio, desde);
  const exacto = segundoDeLaFrase(palabrasSub, frase, piso, bloque.fin);
  if (exacto !== null) return { segundo: r3(exacto), fuente: 'subtitulos', estimado: false };

  if (palabrasAsr && bloque.toma && !bloque.toma.problema) {
    const desdeClip = bloque.segmento?.desdeClip ?? bloque.toma.recorteInicio ?? 0;
    const hastaClip = bloque.segmento?.hastaClip ?? bloque.toma.largoOriginal - (bloque.toma.recorteFin ?? 0);
    const pisoClip = desde === null ? desdeClip - 0.1 : desdeClip + (piso - bloque.inicio);
    const enClip = segundoDeLaFrase(palabrasAsr, frase, pisoClip, hastaClip + 0.1);
    if (enClip !== null) {
      return { segundo: r3(bloque.inicio + enClip - desdeClip), fuente: 'transcripcion', estimado: true };
    }
  }

  const palabras = String(bloque.texto || '').split(/\s+/).map(normalizarPalabra).filter(Boolean);
  const objetivo = String(frase).split(/\s+/).map(normalizarPalabra).filter(Boolean);
  if (!palabras.length || !objetivo.length) return null;
  for (let i = 0; i <= palabras.length - objetivo.length; i++) {
    if (objetivo.every((w, j) => palabras[i + j] === w)) {
      const fraccion = i / palabras.length;
      const segundo = bloque.inicio + fraccion * (bloque.fin - bloque.inicio);
      if (desde !== null && segundo < piso - 1e-6) continue;
      return { segundo: r3(segundo), fuente: 'posicion', estimado: true };
    }
  }
  return null;
}

/** Texto del aviso cuando una frase ancla salio estimada y no de los subtitulos. */
function avisoDeEstimacion(que, frase, ancla) {
  return (
    `${que}: "${frase}" cae a ${ancla.segundo.toFixed(2)}s ESTIMADO ` +
    (ancla.fuente === 'transcripcion' ? 'por la transcripcion de lineas-habladas.json' : 'por la posicion de la frase en la linea') +
    '. Con subtitulos.json sale exacto: node produccion/subtitulos-dialogo.js <carpeta>  y despues  npm run plan.'
  );
}

/** Las palabras del ASR que sirven para medir: con letras o numeros y con tiempos. */
const palabrasConVoz = (palabras) =>
  (palabras || []).filter(
    (w) => w && /[\p{L}\p{N}]/u.test(String(w.text ?? '')) && Number.isFinite(w.start) && Number.isFinite(w.end)
  );

/** Huecos entre palabras seguidas de al menos `minSeg`, dentro de [desde, hasta] del clip. */
function pausasEntrePalabras(palabras, desde, hasta, minSeg) {
  const dentro = palabras.filter((w) => w.start >= desde - 0.01 && w.end <= hasta + 0.01);
  const pausas = [];
  for (let i = 1; i < dentro.length; i++) {
    if (dentro[i].start - dentro[i - 1].end >= minSeg) pausas.push({ desde: dentro[i - 1].end, hasta: dentro[i].start });
  }
  return pausas;
}

/**
 * Bordes de un clip de entrevista por los TIEMPOS DE CADA PALABRA de
 * lineas-habladas.json (variantes A y B, 2026-10-14). FUNCION PURA: no lee
 * archivos.
 *
 *   linea     el guion de la toma (`linea` del manifiesto)
 *   palabras  las del ASR de su clip, en segundos DEL CLIP y sin recortar
 *   largo     lo que dura el clip
 *   idioma    'es', 'en' o 'pt' (los numeros en letras para comparar)
 *
 * La cabeza queda cabezaSeg antes de la primera palabra que se oye. La cola,
 * colaSeg despues de la ULTIMA PALABRA DEL GUION, que la decide
 * decidirColaHablada() (la de `npm run lineas` y del paso voz: decidirCola,
 * la del corte de cola de UGC, con guion y oido comparados como se dicen).
 * Sin eso, un guion con cifras ("por solo 29 soles") no encontraba su ultima
 * palabra en lo oido ("veintinueve soles") justo cuando el modelo repetia el
 * final, y la repeticion quedaba dentro del anuncio. Si despues se oye una
 * repeticion o una muletilla ('cortar'), queda fuera, y el corte nunca llega
 * a la primera silaba de lo que sobra. Si no se sabe donde termina el guion
 * ('sin-decidir': lo que sigue puede ser el mismo final mal oido), se corta
 * despues de la ultima palabra que se oye y se avisa.
 *
 * Devuelve lo mismo que analizarBordes (inicio y fin = lo que se recorta por
 * delante y por detras, util, interiores) mas `avisos`, o { error } si no hay
 * con que medir: ahi el bloque vuelve a los bordes por silencio.
 */
export function bordesPorPalabras({ linea, palabras, largo, cabezaSeg, colaSeg, pausaMinSeg = 0.3, idioma = 'es' }) {
  const asr = palabrasConVoz(palabras);
  if (!asr.length) return { error: 'Scribe no oyo ninguna palabra en el clip' };
  const avisos = [];
  const cola = decidirColaHablada(linea, asr, { idioma });
  const ultimaOida = asr[asr.length - 1];
  let finVoz = ultimaOida.end;
  let tope = largo;
  if (cola.decision === 'cortar' && cola.ultimaPalabra) {
    finVoz = cola.ultimaPalabra.fin;
    if (cola.sobrantes.length) {
      tope = cola.sobrantes[0].inicio - 0.02;
      const s2 = (x) => `${x.toFixed(2)}s`;
      avisos.push(
        `queda fuera lo que se oye despues de la ultima palabra del guion: "${cola.sobrantes.map((w) => w.texto).join(' ')}" ` +
          `(${s2(cola.sobrantes[0].inicio)}-${s2(cola.sobrantes[cola.sobrantes.length - 1].fin)} del clip)`
      );
    }
  } else if (cola.decision === 'nada' && cola.ultimaPalabra) {
    finVoz = cola.ultimaPalabra.fin;
  } else {
    // El motivo de decidirCola termina en "No se corta nada: ..." (habla de la
    // cola de UGC); aca si se corta, despues de lo ultimo que se oye.
    const motivo = String(cola.motivo || '').replace(/\.?\s*No se corta nada[\s\S]*$/, '');
    avisos.push(`el clip se corta despues de la ultima palabra que se oye, porque no se sabe bien donde termina el guion (${motivo}). Escucha el final del clip`);
  }
  const desde = Math.max(0, asr[0].start - cabezaSeg);
  const hasta = Math.min(largo, finVoz + colaSeg, tope);
  // Mismo minimo que analizarBordes: un bloque de medio segundo es un error.
  if (hasta - desde <= 0.5) return { error: `quedarian ${(hasta - desde).toFixed(2)}s de clip entre la primera y la ultima palabra` };
  return {
    duracion: r3(largo),
    inicio: r3(desde),
    fin: r3(largo - hasta),
    util: r3(hasta - desde),
    interiores: pausasEntrePalabras(asr, desde, hasta, pausaMinSeg),
    finVoz: r3(finVoz),
    avisos,
  };
}

/**
 * Si el clip ya salio recortado por palabras: el paso voz de la variante A
 * (`npm run voz`, recortar-voz.js) deja el original en video/originales/
 * toma-N.mp4 y, en toma-N.json, `salidaTamano` = los bytes del clip que dejo
 * en video/. Si el clip de video/ es ESE (mismo tamano), ya tiene sus bordes
 * cortados y no se vuelven a cortar: los margenes se aplicarian dos veces
 * sobre una medida nueva. Un clip regenerado (otro tamano) se corta como
 * cualquiera. Devuelve el json o null.
 */
function recortadoPorPalabras(dirVideo, archivo) {
  const meta = leerJsonSiExiste(path.join(dirVideo, 'originales', archivo.replace(/\.mp4$/, '.json')));
  if (!meta || !Number.isFinite(meta.salidaTamano)) return null;
  try {
    return fs.statSync(path.join(dirVideo, archivo)).size === meta.salidaTamano ? meta : null;
  } catch {
    return null;
  }
}

/**
 * Bloque ENTERO de una toma H, nunca se toca por dentro. Misma forma que el
 * bloque de dialogo_nativo.
 *
 * Sin `porPalabras` (cualquier toma H que no sea de entrevista): bordes por
 * silencio, como siempre. Con `porPalabras` = { medida, cabezaSeg, colaSeg,
 * pausaMinSeg } (entrevista): bordes por los tiempos de cada palabra
 * (bordesPorPalabras), con `medida` = la entrada de la toma en
 * lineas-habladas.json, que ya llega solo si es de ESTE clip (medidasVigentes:
 * mismo tamano, o mismo largo +-0,05 s en una entrada de antes). Si falta, por
 * silencio como antes y `bloque.toma.sinMedida` = true (el plan junta esas
 * tomas en un solo aviso). `bloque.toma.bordes` dice de donde salieron:
 * 'palabras', 'ya-recortado' (recortadoPorPalabras) o 'silencio'.
 */
function bloqueEnteroH(toma, dirVideo, duracionClip, cursor, avisos, porPalabras = null) {
  const archivo = clipDeToma(toma.n);
  const largo = duracionClip.get(archivo);
  if (largo === undefined) {
    avisos.push(`toma ${toma.n}: no encuentro el clip en la carpeta video/`);
    return {
      linea: toma.n,
      texto: toma.linea,
      inicio: r3(cursor),
      fin: r3(cursor),
      ventana: 0,
      tipo: 'H',
      toma: { archivo, metodo: 'falta el clip', velocidad: 1, recorte: 0, problema: true },
    };
  }
  let borde = null;
  let bordes = 'silencio';
  let sinMedida = false;
  if (porPalabras) {
    // Que sea de este clip ya lo vio medidasVigentes; sin tamano ni largo no
    // hay como saberlo y no se corta por palabras (como antes).
    const m = porPalabras.medida;
    const medidaOk = Boolean(m && Array.isArray(m.palabras) && (Number.isFinite(m.tamano) || Number.isFinite(m.largo)));
    const palabras = medidaOk ? palabrasConVoz(m.palabras) : [];
    if (recortadoPorPalabras(dirVideo, archivo)) {
      borde = { duracion: r3(largo), inicio: 0, fin: 0, util: r3(largo), interiores: pausasEntrePalabras(palabras, 0, largo, porPalabras.pausaMinSeg) };
      bordes = 'ya-recortado';
      sinMedida = !medidaOk;
    } else if (medidaOk) {
      const r = bordesPorPalabras({
        linea: toma.linea,
        palabras,
        largo,
        cabezaSeg: porPalabras.cabezaSeg,
        colaSeg: porPalabras.colaSeg,
        pausaMinSeg: porPalabras.pausaMinSeg,
        idioma: porPalabras.idioma,
      });
      if (r.error) {
        avisos.push(`toma ${toma.n}: no pude cortar los bordes por palabras (${r.error}). Van por silencio.`);
      } else {
        borde = r;
        bordes = 'palabras';
        for (const a of r.avisos) avisos.push(`toma ${toma.n}: ${a}.`);
      }
    } else {
      sinMedida = true;
    }
  }
  if (!borde) borde = analizarBordes(path.join(dirVideo, archivo));
  return {
    linea: toma.n,
    texto: toma.linea,
    inicio: r3(cursor),
    fin: r3(cursor + borde.util),
    ventana: borde.util,
    tipo: 'H',
    toma: {
      archivo,
      largoOriginal: borde.duracion,
      duracion: borde.util,
      desde: r3(cursor),
      metodo: 'sin-ajuste',
      velocidad: 1,
      recorte: 0,
      recorteInicio: borde.inicio,
      recorteFin: borde.fin,
      pausasInteriores: borde.interiores.length,
      problema: false,
      ...(porPalabras ? { bordes, ...(sinMedida ? { sinMedida: true } : {}) } : {}),
    },
  };
}

/** Huella de un archivo (para saber si un sonido de recursos/ cambio). */
const huella = (ruta) => crypto.createHash('sha1').update(fs.readFileSync(ruta)).digest('hex');

/**
 * Un efecto de sonido del montaje (check.mp3, congelado.mp3, clic.mp3): se
 * copia de recursos/efectos-transiciones/ a <carpeta>/efectos/ (Remotion solo
 * lee dentro de la carpeta del anuncio) y se mide su ataque con
 * segundoDelGolpe, como las transiciones de siempre. Devuelve
 * { archivo, adelantoSeg } o null si el archivo no existe en ningun lado.
 *
 * Se vuelve a copiar si el de recursos/ CAMBIO (otro tamano u otro contenido):
 * asi un sonido que se reemplaza ahi llega tambien a los anuncios ya
 * planeados, como dice recursos/efectos-transiciones/LEEME.md. Antes solo se
 * copiaba si faltaba y un anuncio ya planeado seguia con el viejo. Solo lo
 * usan los estilos hablados.
 */
function efectoDeMontaje(carpeta, nombre, cache, avisos) {
  if (cache.has(nombre)) return cache.get(nombre);
  const origen = path.join(RAIZ, 'recursos', 'efectos-transiciones', nombre);
  const destino = path.join(carpeta, 'efectos', nombre);
  if (fs.existsSync(origen)) {
    const habia = fs.existsSync(destino);
    const distinto = habia && (fs.statSync(origen).size !== fs.statSync(destino).size || huella(origen) !== huella(destino));
    if (!habia || distinto) {
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.copyFileSync(origen, destino);
      if (distinto) avisos.push(`efectos/${nombre} era otro sonido: se reemplazo por el de recursos/efectos-transiciones/${nombre}.`);
    }
  } else if (!fs.existsSync(destino)) {
    avisos.push(`Falta recursos/efectos-transiciones/${nombre}: ese sonido no va. Vuelve a ponerlo ahi y planea de nuevo.`);
  }
  const salida = fs.existsSync(destino) ? { archivo: `efectos/${nombre}`, adelantoSeg: segundoDelGolpe(destino) } : null;
  cache.set(nombre, salida);
  return salida;
}

/** Pieza de sonido con su adelanto ya aplicado (el ataque cae en `segundo`). */
function piezaDeSonido(efecto, segundo, porque) {
  return {
    tipo: 'sonido',
    archivo: efecto.archivo,
    desde: r3(Math.max(0, segundo - efecto.adelantoSeg)),
    porque: `${porque} (adelanto ${efecto.adelantoSeg.toFixed(2)}s medido)`,
  };
}

/**
 * Ultimo fotograma util de un clip (justo antes de su recorte final) a
 * img/congelado.png, con ffmpeg. Devuelve { archivo, segundoDelClip, como } o
 * null si fallo.
 *
 * El cuadro se saca SIEMPRE fresco: ffmpeg escribe a un temporal y solo si
 * salio un archivo con contenido se renombra a congelado.png. Antes se escribia
 * directo al destino y se miraba si existia: con un clip de 8,00 s justos
 * (-ss fin - 1/30 cae despues del ultimo cuadro) ffmpeg salia bien sin
 * escribir nada y el plan reusaba un congelado.png viejo, de otro clip, sin
 * avisar (prueba Befem A, 2026-10-14).
 *
 * Intentos, en orden: (1) decodificar el ultimo medio segundo util y quedarse
 * con el ultimo cuadro (-update 1 pisa el archivo con cada cuadro); (2) si el
 * clip no tiene recorte al final, -sseof -0.2 (lo que se uso a mano en la
 * prueba); (3) un cuadro suelto cada vez mas atras. Si nada sale, el congelado
 * queda fuera con un aviso fuerte.
 */
function fotogramaCongelado(carpeta, dirVideo, bloque, avisos) {
  const ruta = path.join(dirVideo, bloque.toma.archivo);
  const recorteFin = bloque.toma.recorteFin ?? 0;
  const fin = bloque.toma.largoOriginal - recorteFin;
  const dirImg = path.join(carpeta, 'img');
  const destino = path.join(dirImg, 'congelado.png');
  const temporal = path.join(dirImg, `congelado-${process.pid}.tmp.png`);
  fs.mkdirSync(dirImg, { recursive: true });
  const desdeUltimo = Math.max(0, fin - 0.5);
  const intentos = [
    { segundo: fin, como: 'ultimo cuadro antes del final util', args: ['-ss', desdeUltimo.toFixed(3), '-i', ruta, '-t', (fin - desdeUltimo).toFixed(3), '-update', '1'] },
    ...(recorteFin < 0.05 ? [{ segundo: fin - 0.2, como: '-sseof -0.2', args: ['-sseof', '-0.2', '-i', ruta, '-update', '1'] }] : []),
    ...[0.1, 0.2, 0.4].map((atras) => ({
      segundo: Math.max(0, fin - atras),
      como: `un cuadro ${atras}s antes del final util`,
      args: ['-ss', Math.max(0, fin - atras).toFixed(3), '-i', ruta, '-frames:v', '1', '-update', '1'],
    })),
  ];
  let error = '';
  for (const it of intentos) {
    fs.rmSync(temporal, { force: true });
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...it.args, temporal], { encoding: 'utf8' });
    if (r.status === 0 && fs.existsSync(temporal) && fs.statSync(temporal).size > 0) {
      fs.renameSync(temporal, destino);
      return { archivo: 'img/congelado.png', segundoDelClip: r3(it.segundo), como: it.como };
    }
    error = String(r.stderr || r.error?.message || '').trim().split(/\r?\n/).filter(Boolean).slice(-1)[0] || 'ffmpeg no escribio ningun cuadro';
  }
  fs.rmSync(temporal, { force: true });
  avisos.push(
    `OJO: no pude sacar el fotograma del congelado de ${bloque.toma.archivo} (${intentos.length} intentos; el ultimo: ${error.slice(0, 120)}). ` +
      'EL CONGELADO QUEDA FUERA: el gancho pasa a la historia sin golpe.' +
      (fs.existsSync(destino) ? ' El img/congelado.png que hay es de antes y no se usa.' : '')
  );
  return null;
}

/**
 * La opcion ELEGIDA, donde cae el check: la ultima palabra de `checkCon` que
 * tambien dice `apareceCon`, sin palabras vacias. Primero como siempre
 * (normalizadas: sin tildes, mayusculas ni puntuacion); si no, como se DICEN,
 * con la comparacion de `npm run lineas` (mismasPalabras/normalizarComparable,
 * la misma de la revision y los bordes): "11" = "once", "superbien" = "super
 * bien" (una palabra de un lado contra dos o tres seguidas del otro; ahi
 * cuenta la primera no vacia de las seguidas). FUNCION PURA.
 *
 * Devuelve { palabra, escrita } (palabra normalizada, escrita = como esta en
 * checkCon) o null si no repite ninguna.
 */
function opcionElegida(checkCon, apareceCon, vacias, idioma = 'es') {
  const escritas = (s) => String(s || '').split(/\s+/).filter((w) => normalizarPalabra(w));
  const check = escritas(checkCon);
  const opciones = escritas(apareceCon);
  const fuera = new Set((vacias || []).map(normalizarPalabra));
  const vacia = (w) => fuera.has(normalizarPalabra(w));
  const normales = new Set(opciones.map(normalizarPalabra));
  const dicha = (ws) => normalizarComparable(ws, idioma);
  // Las opciones de 2 o 3 palabras seguidas (no todas vacias), como se dicen.
  const juntas = (ws) => {
    const s = new Set();
    for (let k = 2; k <= 3; k++) {
      for (let i = 0; i + k <= ws.length; i++) {
        const tramo = ws.slice(i, i + k);
        if (tramo.some((w) => !vacia(w)) && dicha(tramo)) s.add(dicha(tramo));
      }
    }
    return s;
  };
  const opcionesJuntas = juntas(opciones);
  const opcionesDichas = new Set(opciones.map((w) => dicha([w])).filter(Boolean));
  let elegida = null;
  check.forEach((w, i) => {
    if (vacia(w)) return;
    const d = dicha([w]);
    const es =
      normales.has(normalizarPalabra(w)) ||
      (d && opciones.some((o) => dicha([o]) && mismasPalabras(w, o, idioma))) ||
      (d && opcionesJuntas.has(d));
    if (es) elegida = { palabra: normalizarPalabra(w), escrita: w, i };
  });
  // Al reves: dos o tres palabras seguidas de la respuesta que la pregunta
  // dice en una ("super bien" contra "superbien").
  for (let k = 2; k <= 3; k++) {
    for (let i = 0; i + k <= check.length; i++) {
      const tramo = check.slice(i, i + k);
      const primera = tramo.find((w) => !vacia(w));
      if (!primera || !opcionesDichas.has(dicha(tramo))) continue;
      const j = i + tramo.indexOf(primera);
      if (!elegida || j > elegida.i) elegida = { palabra: normalizarPalabra(primera), escrita: primera, i: j };
    }
  }
  return elegida ? { palabra: elegida.palabra, escrita: elegida.escrita } : null;
}

/**
 * La palabra de la opcion ELEGIDA, donde cae el check (opcionElegida), ya
 * normalizada. "Dulce, obvio." con "Dulce o salado" da "dulce"; "Eh... de
 * noche." con "de tarde o de noche" da "noche". Null si no repite ninguna.
 * FUNCION PURA.
 */
export function palabraElegida(checkCon, apareceCon, vacias = REGLAS_HABLADO.entrevista.palabrasVaciasCheck, idioma = 'es') {
  return opcionElegida(checkCon, apareceCon, vacias, idioma)?.palabra ?? null;
}

/**
 * En que segundo del ANUNCIO se dice la palabra elegida (`palabra`
 * normalizada, `escrita` como esta en check_con) dentro de `bloque`,
 * buscandola desde el segundo `desde`. Primero en subtitulos.json; si no
 * esta, en el ASR de lineas-habladas.json desplazado al anuncio (estimado,
 * como anclaDeFrase). En cada uno, primero igual y si no, como se dice
 * (mismasPalabras: "11" = "once"; tambien dos palabras seguidas: "superbien"
 * = "super" "bien", y cae en la primera). Null si no aparece.
 */
function segundoDePalabra({ palabra, escrita = palabra, desde, bloque, palabrasSub, palabrasAsr, idioma = 'es' }) {
  const enVentanaSub = (w) => w.inicio >= desde && w.inicio <= bloque.fin;
  const sub = palabrasSub || [];
  const enSub =
    sub.find((w) => w.t === palabra && enVentanaSub(w)) ||
    sub.find(
      (w, i) => enVentanaSub(w) && w.t && (mismasPalabras(w.t, escrita, idioma) || (sub[i + 1]?.t && mismasPalabras([w.t, sub[i + 1].t], escrita, idioma)))
    );
  if (enSub) return { segundo: r3(enSub.inicio), fuente: 'subtitulos', estimado: false };
  if (palabrasAsr && bloque.toma && !bloque.toma.problema) {
    const desdeClip = bloque.segmento?.desdeClip ?? bloque.toma.recorteInicio ?? 0;
    const alAnuncio = (w) => bloque.inicio + w.inicio - desdeClip;
    const enVentana = (w) => alAnuncio(w) >= desde && alAnuncio(w) <= bloque.fin;
    const texto = (w) => w.texto ?? w.t;
    const w =
      palabrasAsr.find((x) => x.t === palabra && enVentana(x)) ||
      palabrasAsr.find(
        (x, i) =>
          enVentana(x) &&
          (mismasPalabras(texto(x), escrita, idioma) || (palabrasAsr[i + 1] && mismasPalabras([texto(x), texto(palabrasAsr[i + 1])], escrita, idioma)))
      );
    if (w) return { segundo: r3(alAnuncio(w)), fuente: 'transcripcion', estimado: true };
  }
  return null;
}

/** centroX de cada icono de un grupo de `n`, segun la tabla `xs` (o repartidos parejo si no esta). */
function posicionesX(xs, n) {
  if (Array.isArray(xs?.[n]) && xs[n].length === n) return xs[n];
  return Array.from({ length: n }, (_, i) => r3((i + 1) / (n + 1)));
}

/**
 * Los iconos de la escena juntados como entran a pantalla: los de un mismo
 * grupo juntos y el producto (pieza con `producto: true`) solo. Ordenados por
 * su entrada, cada uno con { nombre, piezas, desde, hasta }.
 */
function gruposDeIconos(piezas) {
  const mapa = new Map();
  for (const p of piezas) {
    if (p.tipo !== 'icono') continue;
    const clave = p.producto ? 'producto' : `grupo ${p.grupo}`;
    if (!mapa.has(clave)) mapa.set(clave, { nombre: p.producto ? 'el producto' : `"${p.grupo}"`, piezas: [] });
    mapa.get(clave).piezas.push(p);
  }
  return [...mapa.values()]
    .map((g) => ({
      ...g,
      desde: Math.min(...g.piezas.map((p) => p.desde)),
      hasta: Math.max(...g.piezas.map((p) => p.desde + p.duracion)),
    }))
    .sort((a, b) => a.desde - b.desde);
}

/**
 * Iconos de un anuncio de entrevista (variantes A y B): por cada grupo,
 * sus iconos desde su frase de entrada hasta su frase de salida (o iconoSeg),
 * el check con sonido en el elegido.
 *
 * DONDE VAN (centroX/centroY/ancho, en fracciones del cuadro; Escena los
 * dibuja centrados ahi):
 *   A  en pareja HORIZONTAL, uno a cada lado del cuerpo a la altura del pecho
 *      o la panza (iconosA), con el check DEBAJO del elegido (checkAbajo).
 *   B  de a uno al centro, a la altura del pecho; un grupo de 2, en pareja
 *      centrada (iconosB). Que no se pisen lo resuelve iconosDeAUno().
 * `lado` y `fila` (la pila de antes) se siguen escribiendo solo por
 * compatibilidad: con centroX/centroY Escena no los usa.
 *
 * EL CHECK cae en la PALABRA de la opcion elegida (palabraElegida), buscada
 * desde donde empieza la respuesta (check_con): en "Eh... de noche." cae en
 * "noche" y no en "Eh". La respuesta (y su palabra) se buscan siempre DESPUES
 * del fin de la pregunta (aparece_con): nunca cae en la pregunta. Si no la
 * encuentra, al empezar la respuesta, con aviso. Su sonido va con el. El
 * grupo se queda hasta checkQuedaSeg despues del check aunque su frase de
 * salida caiga antes; puede pasar el fin de su clip (el gancho de A va
 * seguido) pero nunca entra en el congelado.
 */
function piezasDeIconos({ manifiesto, carpeta, bloques, palabrasSub, lineasHabladas, piezas, avisos, efectos, variante = 'A', congelado = null }) {
  const cfg = REGLAS_HABLADO.entrevista;
  let palabrasFin = null; // subtitulos.json con el fin de cada palabra, si hace falta (el fin de la pregunta)
  const idioma = ['es', 'en', 'pt'].includes(manifiesto.idioma) ? manifiesto.idioma : 'es';
  const ent = manifiesto.entrevista || {};
  const ladoMic = ent.lado_mic || 'izquierda';
  const lado = ent.lado_iconos || otroLado(ladoMic);
  const pos = variante === 'B' ? cfg.iconosB : cfg.iconosA;
  // La transparencia real de cada PNG la mide generar-imagenes.js y la anota
  // en img/log-modelos.json. Con ella el icono va recortado; sin ella, dentro
  // de una tarjeta blanca (se sigue viendo como sticker). Nunca falla por esto.
  const log = leerJsonSiExiste(path.join(carpeta, 'img', 'log-modelos.json'));
  const transparenciaDe = (id) => {
    const e = (Array.isArray(log?.imagenes) ? log.imagenes : []).find((x) => x && (x.id === id || x.archivo === `${id}.png`));
    return e && typeof e.transparente === 'boolean' ? e.transparente : null;
  };
  let avisoSinMedida = false;

  for (const g of manifiesto.iconos || []) {
    const bloque = bloques.find((b) => b.linea === g.toma);
    if (!bloque || bloque.toma?.problema) {
      avisos.push(`iconos "${g.grupo}": la toma ${g.toma} no esta en el montaje (falta el clip o la toma). Quedan fuera.`);
      continue;
    }
    const palabrasAsr = palabrasAsrDeToma(lineasHabladas, g.toma);
    const buscar = (frase) => anclaDeFrase({ frase, bloque, palabrasSub, palabrasAsr });

    const ap = buscar(g.aparece_con);
    let desde = ap ? ap.segundo : bloque.inicio;
    if (!ap) {
      avisos.push(`iconos "${g.grupo}": "${g.aparece_con}" no esta en la linea de la toma ${g.toma}. Aparecen al inicio del bloque.`);
    } else if (ap.estimado) {
      avisos.push(avisoDeEstimacion(`iconos "${g.grupo}" (entrada)`, g.aparece_con, ap));
    }
    desde = Math.min(Math.max(desde, bloque.inicio), bloque.fin);

    let fin = desde + cfg.iconoSeg;
    if (g.desaparece_con) {
      const d = buscar(g.desaparece_con);
      if (d && d.segundo > desde + 0.2) {
        fin = d.segundo;
        if (d.estimado) avisos.push(avisoDeEstimacion(`iconos "${g.grupo}" (salida)`, g.desaparece_con, d));
      } else {
        avisos.push(
          `iconos "${g.grupo}": "${g.desaparece_con}" ${d ? 'cae antes que la entrada' : 'no esta en la linea de la toma ' + g.toma}. ` +
            `Desaparecen ${cfg.iconoSeg}s despues de aparecer.`
        );
      }
    }
    fin = Math.min(fin, bloque.fin);
    if (fin - desde < 0.3) {
      avisos.push(`iconos "${g.grupo}": quedarian ${(fin - desde).toFixed(2)}s en pantalla (la frase cae al final del bloque). Quedan fuera.`);
      continue;
    }

    let checkDesde = null;
    if (g.elegido) {
      // El check se busca DESPUES de la pregunta (el fin de aparece_con): la
      // respuesta repite la palabra de la opcion ("¿Video o imagen?"
      // "Video."), y buscada desde el inicio del bloque caia en la pregunta.
      // trasPregunta = el fin de su ultima palabra, con 0,02 s de holgura por
      // si la primera de la respuesta arranca un pelo antes (redondeo del ASR).
      let trasPregunta = null;
      if (ap && g.check_con) {
        palabrasFin ??= palabrasConFin(carpeta) || [];
        const f = finDeFrase({
          frase: g.aparece_con,
          bloque,
          voz: { inicio: bloque.inicio, fin: bloque.fin },
          palabrasFin,
          palabrasAsr: palabrasAsrConFin(lineasHabladas, g.toma),
        });
        if (f) trasPregunta = r3(f.segundo - 0.02);
      }
      const ck = g.check_con ? anclaDeFrase({ frase: g.check_con, bloque, palabrasSub, palabrasAsr, desde: trasPregunta }) : null;
      const despuesDe = trasPregunta !== null ? ` despues de la pregunta ("${g.aparece_con}")` : '';
      let deDonde = null; // de donde salio el segundo del check, para el aviso de estimado
      if (ck) {
        checkDesde = r3(Math.min(Math.max(ck.segundo, desde), fin - 0.1));
        deDonde = { frase: g.check_con, ancla: ck };
      } else {
        // Sin frase de check (o no se encontro): a mitad del tiempo en pantalla.
        checkDesde = r3(desde + (fin - desde) / 2);
        if (g.check_con) avisos.push(`iconos "${g.grupo}": "${g.check_con}" no esta en la linea de la toma ${g.toma}${despuesDe}. El check entra a mitad del tiempo en pantalla.`);
      }
      // La palabra de la opcion elegida, desde donde caeria el check sin ella
      // (y nunca dentro de la pregunta).
      if (g.check_con) {
        const opcion = opcionElegida(g.check_con, g.aparece_con, cfg.palabrasVaciasCheck, idioma);
        const palabra = opcion?.palabra ?? null;
        const buscarDesde = trasPregunta !== null ? Math.max(checkDesde - 0.05, trasPregunta) : checkDesde - 0.05;
        const w = opcion ? segundoDePalabra({ ...opcion, desde: buscarDesde, bloque, palabrasSub, palabrasAsr, idioma }) : null;
        if (w) {
          checkDesde = r3(Math.max(w.segundo, desde));
          deDonde = { frase: palabra, ancla: w };
        } else if (!palabra) {
          avisos.push(
            `iconos "${g.grupo}": "${g.check_con}" no dice ninguna de las opciones con la misma palabra que la pregunta ("${g.aparece_con}"). ` +
              `El check cae a ${checkDesde.toFixed(2)}s, al empezar la respuesta.`
          );
        } else {
          avisos.push(`iconos "${g.grupo}": no encuentro "${palabra}" (la opcion elegida) despues de ${checkDesde.toFixed(2)}s. El check queda ahi, al empezar la respuesta.`);
        }
      }
      if (deDonde?.ancla.estimado) avisos.push(avisoDeEstimacion(`iconos "${g.grupo}" (check)`, deDonde.frase, deDonde.ancla));
      // El grupo se queda hasta un rato despues del check. Puede pasar el fin
      // de su clip si el siguiente es otro clip del gancho (Befem A: la pareja
      // de la noche quedo 0,3 s sobre el clip 2), nunca entrar en el congelado.
      const tope = congelado && bloque.inicio < congelado.desde ? congelado.desde : bloque.fin;
      fin = Math.max(fin, Math.min(tope, checkDesde + cfg.checkQuedaSeg));
    }

    // Fila de cada icono: la primera (0..2, la pila de antes) que no ocupe
    // otro icono ya planeado cuyo tiempo en pantalla se solape con este grupo,
    // y dentro del grupo se sigue hacia abajo. Hoy Escena los pone por
    // centroX/centroY y la fila queda solo por compatibilidad con planes y
    // lectores viejos (plan-para-humanos la nombra).
    const FILAS = 3;
    const ocupadas = new Set(
      piezas
        .filter((p) => p.tipo === 'icono' && !p.producto && p.lado === lado && p.desde < fin && p.desde + p.duracion > desde)
        .map((p) => p.fila)
    );
    let filaMinima = 0;
    const iconos = g.iconos || [];
    const xs = posicionesX(pos.xs, iconos.length);
    if (iconos.length && !Array.isArray(pos.xs?.[iconos.length])) {
      avisos.push(`iconos "${g.grupo}": un grupo de ${iconos.length} iconos no se probo; van repartidos a lo ancho (${xs.join(', ')}).`);
    }
    iconos.forEach((ic, i) => {
      let fila = Math.min(filaMinima, FILAS - 1);
      while (fila < FILAS - 1 && ocupadas.has(fila)) fila++;
      ocupadas.add(fila);
      filaMinima = fila + 1;
      const archivo = `img/${ic.id}.png`;
      if (!fs.existsSync(path.join(carpeta, archivo))) {
        avisos.push(`icono ${ic.id}: falta ${archivo}. Se planea igual; generalo con  npm run imagenes -- <carpeta>`);
      }
      const tr = transparenciaDe(ic.id);
      if (tr === null && !avisoSinMedida) {
        avisoSinMedida = true;
        avisos.push('Hay iconos sin medida de transparencia en img/log-modelos.json: van dentro de una tarjeta blanca. Al generarlos con el motor se mide sola.');
      }
      const pieza = {
        tipo: 'icono',
        archivo,
        desde: r3(desde),
        duracion: r3(fin - desde),
        lado,
        fila,
        sticker: tr === true ? 'recorte' : 'tarjeta',
        // De que grupo y de que toma sale: lo lee el plan legible para contarlo
        // junto a su clip. Remotion no lo usa.
        grupo: g.grupo,
        toma: g.toma,
        porque: `grupo "${g.grupo}": aparece con "${g.aparece_con}"` + (g.desaparece_con ? `, se va con "${g.desaparece_con}"` : ''),
        centroX: xs[i],
        centroY: pos.centroY,
        ancho: pos.ancho,
        ...(variante === 'A' ? { checkAbajo: true } : {}),
      };
      if (g.elegido === ic.id && checkDesde !== null) {
        pieza.check = { desde: checkDesde };
        const ef = efectoDeMontaje(carpeta, 'check.mp3', efectos, avisos);
        if (ef) piezas.push(piezaDeSonido(ef, checkDesde, `check del icono ${ic.id}`));
      }
      piezas.push(pieza);
    });
    if (g.elegido && !iconos.some((ic) => ic.id === g.elegido)) {
      avisos.push(`iconos "${g.grupo}": el elegido "${g.elegido}" no es uno de sus iconos. Sin check.`);
    }
  }

  // A: cada pareja va en el mismo lugar que la siguiente (0,2 / 0,8). Si un
  // grupo sigue en pantalla cuando entra el siguiente (por ejemplo, por los
  // checkQuedaSeg del check), se va en ese momento: dos parejas encimadas no
  // se leen. En B lo resuelve iconosDeAUno(), con el producto incluido.
  if (variante === 'A') {
    const grupos = gruposDeIconos(piezas);
    grupos.forEach((gr, k) => {
      const sig = grupos[k + 1];
      if (!sig || gr.hasta <= sig.desde + 0.001) return;
      const dura = r3(Math.max(0.3, sig.desde - gr.desde));
      for (const p of gr.piezas) p.duracion = dura;
      const sinCheck = gr.piezas.some((p) => p.check && p.check.desde > gr.desde + dura - 0.3);
      avisos.push(
        `iconos ${gr.nombre}: seguian en pantalla cuando entran los de ${sig.nombre} (van en el mismo lugar). Se van a los ${(gr.desde + dura).toFixed(2)}s.` +
          (sinCheck ? ' Su check casi no se ve: separa mas las preguntas.' : '')
      );
    });
  }
}

/**
 * Variante B: los iconos van de a uno al centro, asi que nunca hay dos
 * grupos en pantalla a la vez. Se ordenan por su entrada (el producto es uno
 * mas) y, si el siguiente entra antes de que el anterior termine, el anterior
 * se va en ese momento, con un minimo de iconosB.minSeg (Befem B: el chicle
 * quedo 0,94 s). Cada grupo y el producto suenan con el clic de mouse
 * (recursos/efectos-transiciones/clic.mp3) al aparecer, con su ataque medido.
 */
function iconosDeAUno({ piezas, carpeta, efectos, avisos }) {
  const minSeg = REGLAS_HABLADO.entrevista.iconosB.minSeg;
  const grupos = gruposDeIconos(piezas);
  grupos.forEach((gr, k) => {
    const sig = grupos[k + 1];
    if (!sig || gr.hasta <= sig.desde + 0.001) return;
    const dura = r3(Math.max(minSeg, sig.desde - gr.desde));
    for (const p of gr.piezas) p.duracion = dura;
    if (sig.desde - gr.desde < minSeg) {
      avisos.push(
        `iconos: ${gr.nombre} y ${sig.nombre} entran casi a la vez (${(sig.desde - gr.desde).toFixed(2)}s de diferencia): van los dos al centro y se pisan ` +
          `${(minSeg - (sig.desde - gr.desde)).toFixed(2)}s. Separa las menciones en el guion o juntalas en un grupo de 2.`
      );
    }
  });
  const ef = grupos.length ? efectoDeMontaje(carpeta, 'clic.mp3', efectos, avisos) : null;
  if (ef) {
    for (const gr of grupos) {
      piezas.push(piezaDeSonido(ef, gr.desde, `clic al aparecer ${gr.piezas.map((p) => path.basename(p.archivo)).join(' y ')}`));
    }
  }
}

/**
 * Si una foto tiene transparencia REAL. Es el mismo metodo que
 * medirTransparencia de generar-imagenes.js (ffmpeg la pasa a rgba, extrae el
 * alfa y mira su minimo: un fondo transparente deja pixeles por debajo de
 * 128; una foto sin canal alfa da 255 en todos). Se repite aca para no cargar
 * generar-imagenes.js (cliente de kie.ai) en cada plan. Nunca lanza: si no se
 * puede medir, false, y la foto va en tarjeta blanca.
 */
function fotoConTransparencia(ruta) {
  try {
    const r = spawnSync(
      'ffmpeg',
      ['-hide_banner', '-nostdin', '-i', ruta, '-vf', 'format=rgba,alphaextract,signalstats,metadata=print:key=lavfi.signalstats.YMIN:file=-', '-f', 'null', '-'],
      { encoding: 'utf8' }
    );
    const m = `${r.stdout || ''}\n${r.stderr || ''}`.match(/lavfi\.signalstats\.YMIN=(\d+)/);
    return m ? Number(m[1]) < 128 : false;
  } catch {
    return false;
  }
}

/**
 * Las palabras de subtitulos.json con su INICIO y su FIN (segundos del
 * anuncio), normalizadas como las de palabrasConTiempo. Las usan los cutaways
 * del podcast, que entran despues del FIN de una frase; palabrasConTiempo
 * guarda solo el inicio y la usan todos los estilos, asi que no se toca. Null
 * si todavia no hay subtitulos (primera pasada).
 */
function palabrasConFin(carpeta) {
  const ruta = path.join(carpeta, 'subtitulos.json');
  if (!fs.existsSync(ruta)) return null;
  try {
    const s = JSON.parse(fs.readFileSync(ruta, 'utf8'));
    const pal = [];
    for (const b of s.bloques || []) {
      for (const w of b.palabras || []) {
        if (Number.isFinite(w.inicio) && Number.isFinite(w.fin)) pal.push({ t: normalizarPalabra(w.texto), inicio: w.inicio, fin: w.fin });
      }
    }
    return pal.length ? pal : null;
  } catch {
    return null;
  }
}

/** Las palabras del ASR de una toma (lineas-habladas.json) con inicio y fin, en segundos DEL CLIP. */
function palabrasAsrConFin(lineasHabladas, n) {
  const t = lineasHabladas?.tomas?.[String(n)];
  if (!t || t.reacciones || !Array.isArray(t.palabras)) return null;
  const pal = palabrasConVoz(t.palabras).map((w) => ({ t: normalizarPalabra(w.text), inicio: w.start, fin: w.end }));
  return pal.length ? pal : null;
}

/**
 * Donde se dice `frase` (por palabras normalizadas) con su primera palabra
 * entre `desde` y `hasta`: { inicio, fin } de la frase entera, o null. Es
 * segundoDeLaFrase, pero devuelve tambien el FIN de la ultima palabra.
 */
function tramoDeLaFrase(palabras, frase, desde, hasta) {
  if (!palabras || !frase) return null;
  const objetivo = String(frase).split(/\s+/).map(normalizarPalabra).filter(Boolean);
  if (!objetivo.length) return null;
  for (let i = 0; i <= palabras.length - objetivo.length; i++) {
    if (palabras[i].inicio < desde || palabras[i].inicio > hasta) continue;
    if (objetivo.every((w, j) => palabras[i + j].t === w)) return { inicio: palabras[i].inicio, fin: palabras[i + objetivo.length - 1].fin };
  }
  return null;
}

/**
 * En que segundo del ANUNCIO TERMINA `frase` (la "tras" de un cutaway, la
 * pregunta de un grupo de iconos) dentro de la linea de `bloque`. Las mismas
 * tres fuentes que anclaDeFrase, de la mas exacta a la mas estimada, pero con
 * el fin de la ultima palabra:
 *
 *   1. subtitulos.json (palabrasFin), ya en tiempo del anuncio;
 *   2. las palabras del ASR de lineas-habladas.json (palabrasAsr, tiempo del
 *      clip), desplazadas al anuncio con el segmento del bloque (o, en la
 *      entrevista, con su recorte de cabeza);
 *   3. la posicion de la frase en el texto, repartida entre la primera y la
 *      ultima palabra que se oyen de la linea (voz). Es una estimacion.
 *
 * Devuelve { segundo, fuente, estimado } o null si la frase no esta en la linea.
 */
function finDeFrase({ frase, bloque, voz, palabrasFin, palabrasAsr }) {
  const exacto = tramoDeLaFrase(palabrasFin, frase, bloque.inicio, bloque.fin);
  if (exacto) return { segundo: r3(exacto.fin), fuente: 'subtitulos', estimado: false };

  // El tramo del clip que ocupa el bloque: su segmento (podcast) o el clip
  // entero menos sus bordes (entrevista), como en anclaDeFrase.
  if (palabrasAsr && (bloque.segmento || (bloque.toma && !bloque.toma.problema))) {
    const desdeClip = bloque.segmento?.desdeClip ?? bloque.toma.recorteInicio ?? 0;
    const hastaClip = bloque.segmento?.hastaClip ?? bloque.toma.largoOriginal - (bloque.toma.recorteFin ?? 0);
    const enClip = tramoDeLaFrase(palabrasAsr, frase, desdeClip - 0.1, hastaClip + 0.1);
    if (enClip) return { segundo: r3(bloque.inicio + enClip.fin - desdeClip), fuente: 'transcripcion', estimado: true };
  }

  const palabras = String(bloque.texto || '').split(/\s+/).map(normalizarPalabra).filter(Boolean);
  const objetivo = String(frase).split(/\s+/).map(normalizarPalabra).filter(Boolean);
  if (!palabras.length || !objetivo.length) return null;
  for (let i = 0; i <= palabras.length - objetivo.length; i++) {
    if (objetivo.every((w, j) => palabras[i + j] === w)) {
      const fraccion = (i + objetivo.length) / palabras.length;
      return { segundo: r3(voz.inicio + fraccion * (voz.fin - voz.inicio)), fuente: 'posicion', estimado: true };
    }
  }
  return null;
}

/**
 * Los golpes de sonido de un clip de reacciones (la risa, el "hmm"), medidos
 * con la envolvente RMS como segundoDelGolpe (ffmpeg astats, sin creditos,
 * menos de 1 s por clip): ventanas de cfg.ventanaSeg; umbral = la mediana del
 * clip, que es el ruido de sala porque casi todo el clip es silencio, mas
 * cfg.sobreRuidoDb; las ventanas sobre el umbral se unen si las separa menos
 * de cfg.unirHuecoSeg y quedan fuera las de menos de cfg.minEventoSeg.
 * Devuelve [{ inicio, fin, picoDb }] en segundos del clip ([] si no se pudo
 * medir o el clip no tiene audio).
 *
 * Medido en Cayenne: toma-6 (A) 1.65-2.25 / 3.80-4.05 / 6.30-6.90 s con ruido
 * en -66 dB; toma-7 (B) 0.55-1.10 / 2.65-3.05 / 5.20-6.55 con ruido en -82.
 */
function golpesDeReaccion(rutaClip, cfg) {
  const muestras = Math.round(44100 * cfg.ventanaSeg);
  const r = spawnSync(
    'ffmpeg',
    [
      '-hide_banner', '-nostdin', '-i', rutaClip, '-vn',
      '-af', `aresample=44100,asetnsamples=${muestras},astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level`,
      '-f', 'null', '-',
    ],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
  );
  const niveles = [...String(r.stderr || '').matchAll(/RMS_level=(-?[\d.]+|-inf)/g)].map((m) => (m[1] === '-inf' ? -120 : Number(m[1])));
  if (niveles.length < 3) return [];
  const orden = [...niveles].sort((a, b) => a - b);
  const umbral = orden[Math.floor(orden.length / 2)] + cfg.sobreRuidoDb;
  const golpes = [];
  niveles.forEach((db, i) => {
    if (db < umbral) return;
    const a = i * cfg.ventanaSeg;
    const ultimo = golpes[golpes.length - 1];
    if (ultimo && a - ultimo.fin < cfg.unirHuecoSeg) {
      ultimo.fin = a + cfg.ventanaSeg;
      ultimo.picoDb = Math.max(ultimo.picoDb, db);
    } else {
      golpes.push({ inicio: a, fin: a + cfg.ventanaSeg, picoDb: db });
    }
  });
  return golpes
    .filter((g) => g.fin - g.inicio >= cfg.minEventoSeg - 1e-9)
    .map((g) => ({ inicio: r3(g.inicio), fin: r3(g.fin), picoDb: Number(g.picoDb.toFixed(1)) }));
}

/**
 * Donde EMPIEZA el sonido de cada reaccion (1, 2 y 3) en el clip de
 * reacciones, de la fuente mas fiable a la menos. FUNCION PURA.
 *
 *   eventos  los de Scribe en lineas-habladas.json ({ start } o { inicio })
 *   golpes   los de golpesDeReaccion ({ inicio })
 *   largo    lo que dura el clip; margenSeg el de los tercios de siempre
 *
 *   1. si los eventos de Scribe son exactamente 3, el n-esimo es la reaccion n;
 *   2. si no, y los golpes del audio son 3, el n-esimo golpe;
 *   3. si no, para cada reaccion el evento (o, sin eventos, el golpe) mas
 *      cercano al centro de su tercio, a menos de un tercio y sin repetir el
 *      de otra reaccion;
 *   4. sin nada de eso, null: va el centro del tercio, como antes.
 *
 * Devuelve [r1, r2, r3], cada una { inicio, fuente } con fuente 'eventos',
 * 'audio' o 'tercio' (inicio null).
 */
export function momentosDeReacciones({ eventos = [], golpes = [], largo, margenSeg = 0.3 }) {
  const lista = (xs, fuente) =>
    (xs || []).map((e) => ({ inicio: Number(e.start ?? e.inicio), fuente })).filter((e) => Number.isFinite(e.inicio));
  const ev = lista(eventos, 'eventos');
  const go = lista(golpes, 'audio');
  if (ev.length === 3) return ev.map((e) => ({ inicio: r3(e.inicio), fuente: e.fuente }));
  if (go.length === 3) return go.map((e) => ({ inicio: r3(e.inicio), fuente: e.fuente }));
  const candidatos = ev.length ? ev : go;
  const tercio = Math.max(0, largo - 2 * margenSeg) / 3;
  const usados = new Set();
  const salida = [];
  for (let n = 1; n <= 3; n++) {
    const centro = margenSeg + tercio * (n - 0.5);
    let mejor = null;
    for (const c of candidatos) {
      if (usados.has(c)) continue;
      const d = Math.abs(c.inicio - centro);
      if (d <= tercio && (!mejor || d < mejor.d)) mejor = { c, d };
    }
    if (mejor) {
      usados.add(mejor.c);
      salida.push({ inicio: r3(mejor.c.inicio), fuente: mejor.c.fuente });
    } else {
      salida.push({ inicio: null, fuente: 'tercio' });
    }
  }
  return salida;
}

/**
 * Las piezas de B-roll y de cutaway no se pisan: ventanas [desde, hasta] del
 * anuncio. Devuelve hasta donde puede llegar algo que entra en `desde` sin
 * pisar ninguna (o null si `desde` ya cae dentro de una), y cual la limita.
 */
function hastaSinPisar(desde, hasta, ocupadas) {
  let tope = hasta;
  let contra = null;
  for (const o of ocupadas) {
    if (o.desde <= desde + 1e-6 && desde < o.hasta - 1e-6) return { tope: null, contra: o };
    if (o.desde > desde && o.desde < tope) {
      tope = o.desde;
      contra = o;
    }
  }
  return { tope, contra };
}

/**
 * El texto del Error del podcast cuando no queda ninguna linea para montar
 * (con <carpeta>, que el CLI reemplaza): por que quedo fuera cada toma
 * hablada y el comando que lo arregla, `npm run lineas -- <carpeta> --tomas
 * a,b` (antes `npm run videos` si falta algun clip). `tomasFuera`: Map(n ->
 * { que, medir }), medir false = falta el clip.
 */
function errorSinLineas(tomasFuera) {
  if (!tomasFuera.size) {
    return (
      'no queda ninguna linea del guion para montar: ninguna linea de "guion" esta en una toma hablada del manifiesto (tomas tipo "H" con esa linea en sus "lineas").\n' +
      '  Revisa el manifiesto:\n      npm run validar -- <carpeta>/manifiesto.json'
    );
  }
  // Todas se miden (las que no tienen clip, despues de generarlo).
  const ns = [...tomasFuera.keys()].sort((a, b) => a - b);
  const sinClip = ns.filter((n) => !tomasFuera.get(n).medir);
  let texto =
    'no queda ninguna linea del guion para montar (el plan saldria vacio):\n' +
    ns.map((n) => `      toma ${n}: ${tomasFuera.get(n).que}`).join('\n');
  if (sinClip.length) {
    texto += `\n  Genera primero ${sinClip.length === 1 ? 'el clip que falta' : 'los clips que faltan'}:\n      npm run videos -- <carpeta>`;
  }
  texto +=
    `\n  ${sinClip.length ? 'Despues mide' : 'Mide'} ${ns.length === 1 ? 'la toma' : 'las tomas'} (transcribe los clips, no genera nada) y vuelve a planear:\n` +
    `      npm run lineas -- <carpeta> --tomas ${ns.join(',')}`;
  return texto;
}

/**
 * PODCAST. Hace falta lineas-habladas.json: los tiempos de cada linea
 * dentro de su clip salen de ahi (npm run lineas) y aca no se transcribe nada.
 * Lo que se aprobo en la prueba Cayenne (2026-10-14) y antes se ajustaba a mano
 * (ajustar-cutaways.mjs y ajustar-recorte.mjs) sale de aqui: los cutaways con
 * su sonido, despues de su frase "tras" y con las reglas de turno (paso 5), y
 * en esquina el host recortado sin fondo si recorte.json cubre la ventana.
 * Si no queda ninguna linea (todas sin medida, con la de otro clip o sin
 * clip), lanza un Error con el comando (errorSinLineas): nunca un plan vacio.
 */
function planearPodcast({ manifiesto, carpeta, dirVideo, duracionClip, palabrasSub, lineasHabladas, medidasViejas = new Map(), avisos }) {
  const cfg = REGLAS_HABLADO.podcast;
  const pod = manifiesto.podcast || {};
  const lados = { A: 'izquierda', B: 'derecha', ...(pod.lados || {}) };
  const modoBroll = pod.broll?.modo === 'esquina' ? 'esquina' : 'pantalla-dividida';
  const bloques = [];
  const piezas = [];
  const brollUsados = new Set();
  const bordes = new Map();
  const bordeDe = (archivo) => {
    if (!bordes.has(archivo)) bordes.set(archivo, analizarBordes(path.join(dirVideo, archivo)));
    return bordes.get(archivo);
  };
  // Esquina: el recorte del host sin fondo, si ya se corrio `npm run recortar`.
  const recorteJson = modoBroll === 'esquina' ? leerRecorte(carpeta) : null;
  const sinRecorte = []; // piezas de esquina que quedan en ventana, con el motivo
  // Cutaways: se ubican al final (paso 5), cuando ya se sabe donde va cada
  // linea, cada turno y cada B-roll.
  const cutawaysPedidos = [];
  const vozDe = new Map(); // orden -> { inicio, fin } de la voz de esa linea, en el anuncio
  const ocupadas = []; // ventanas de B-roll (y despues de cutaways) que un cutaway no puede pisar

  // 1) Segmentos: cada linea del guion, dentro de su clip. desdeClip = fin de
  //    la linea anterior + mitad de la pausa (o el borde por silencio si es la
  //    primera); hastaClip = fin de la linea + min(0.3 s, mitad de la pausa
  //    siguiente) (o el borde por silencio si es la ultima, nunca mas alla del
  //    largo). Nunca se corta DENTRO de una linea: ahi vive el lip-sync.
  const segPorOrden = new Map();
  // Por que quedo fuera cada toma hablada, para el error de "no queda ninguna
  // linea" (n -> { que, medir }; medir false = falta el clip, hay que
  // generarlo antes de medirlo), y las lineas cuya salida ya tiene su aviso:
  // el paso 2 no les repite "sin segmento" (era un aviso por linea encima del
  // de la toma, que ya las nombra).
  const tomasFuera = new Map();
  const lineasYaAvisadas = new Set();
  const fueraPorToma = (toma, que, medir) => {
    if (!tomasFuera.has(toma.n)) tomasFuera.set(toma.n, { que, medir });
    for (const l of toma.lineas) lineasYaAvisadas.add(l.orden);
  };
  for (const toma of manifiesto.tomas) {
    if (toma.tipo !== 'H' || !Array.isArray(toma.lineas) || !toma.lineas.length) continue;
    const archivo = clipDeToma(toma.n);
    const ordenes = toma.lineas.map((l) => l.orden).join(', ');
    const largoDisco = duracionClip.get(archivo);
    if (largoDisco === undefined) {
      avisos.push(`toma ${toma.n}: no encuentro el clip en la carpeta video/. Sus lineas (${ordenes}) quedan fuera.`);
      fueraPorToma(toma, `falta su clip (${archivo}) en video/`, false);
      continue;
    }
    const info = lineasHabladas.tomas?.[String(toma.n)];
    // Una medida de otro clip (la toma se regenero) no se usa: cortar con sus
    // tiempos partia el clip nuevo en cualquier lado y hasta daba trozos de
    // duracion negativa (prueba-lineas-seco: "Duracion final: -4.14s").
    if (medidasViejas.has(toma.n)) {
      avisos.push(avisoDeMedidasViejas([toma.n], medidasViejas, `Hasta entonces sus lineas (${ordenes}) quedan fuera del montaje.`));
      fueraPorToma(toma, `su medida es de otro clip (${medidasViejas.get(toma.n)})`, true);
      continue;
    }
    if (!info || !Array.isArray(info.lineas)) {
      avisos.push(`toma ${toma.n}: no esta medida en lineas-habladas.json. Sus lineas (${ordenes}) quedan fuera:  npm run lineas -- <carpeta> --tomas ${toma.n}`);
      fueraPorToma(toma, 'no esta medida en lineas-habladas.json', true);
      continue;
    }
    const borde = bordeDe(archivo);
    const largo = borde.duracion;
    const medidas = toma.lineas
      .map((l) => ({ ...l, ...(info.lineas.find((x) => x.orden === l.orden) || {}) }))
      .filter((l) => {
        const ok = Number.isFinite(l.inicio) && Number.isFinite(l.fin) && l.fin > l.inicio;
        if (!ok) {
          avisos.push(`toma ${toma.n}, linea ${l.orden}: sin tiempos en lineas-habladas.json. Queda fuera del montaje (rehaz la toma o vuelve a medirla).`);
          lineasYaAvisadas.add(l.orden);
          if (!tomasFuera.has(toma.n)) tomasFuera.set(toma.n, { que: `linea ${l.orden} sin tiempos en lineas-habladas.json`, medir: true });
          return false;
        }
        // Una medida sin tamano ni largo no se pudo comparar con el clip: si
        // sus tiempos caen fuera de el, es de otro.
        if (l.inicio < -0.05 || l.fin > largo + 0.05) {
          avisos.push(
            `toma ${toma.n}, linea ${l.orden}: sus tiempos (${l.inicio.toFixed(2)}-${l.fin.toFixed(2)}s) caen fuera del clip, que dura ${largo.toFixed(2)}s: ` +
              `la medida es de otro clip. Queda fuera del montaje:  npm run lineas -- <carpeta> --tomas ${toma.n}`
          );
          lineasYaAvisadas.add(l.orden);
          if (!tomasFuera.has(toma.n)) tomasFuera.set(toma.n, { que: `la medida es de otro clip (los tiempos de la linea ${l.orden} caen fuera del clip)`, medir: true });
          return false;
        }
        return true;
      })
      .sort((a, b) => a.inicio - b.inicio);
    // Si el modelo siguio hablando despues de la ultima palabra del guion
    // (sobran_al_final en lineas-habladas.json: repitio el final), la ultima
    // linea del clip no se estira hasta el borde por silencio, que ahi no
    // existe: termina 0.3 s despues de su ultima palabra. Sin eso, el segmento
    // (video y audio) arrastraba la repeticion aunque los subtitulos ya
    // cayeran bien (revision del 2026-10-13).
    const repitioElFinal = typeof info.sobran_al_final === 'string' && info.sobran_al_final.trim().length > 0;
    medidas.forEach((l, k) => {
      const ant = medidas[k - 1];
      const sig = medidas[k + 1];
      const desdeClip = ant ? ant.fin + (l.inicio - ant.fin) / 2 : Math.min(borde.inicio, l.inicio);
      const hastaClip = sig
        ? l.fin + Math.min(cfg.margenSeg, Math.max(0, (sig.inicio - l.fin) / 2))
        : repitioElFinal
          ? Math.min(largo, l.fin + cfg.margenSeg)
          : Math.min(largo, Math.max(l.fin, largo - borde.fin));
      if (Number.isFinite(l.calidad) && l.calidad < 0.6) {
        avisos.push(`toma ${toma.n}, linea ${l.orden}: alineada solo al ${(l.calidad * 100).toFixed(0)}%. Sus tiempos pueden estar corridos: escucha ese corte.`);
      }
      segPorOrden.set(l.orden, {
        toma,
        archivo,
        largo,
        desdeClip: r3(Math.max(0, desdeClip)),
        hastaClip: r3(Math.min(largo, hastaClip)),
        lineaInicio: l.inicio,
        lineaFin: l.fin,
      });
    });
  }

  // Clip de reacciones de cada host (clase "reacciones", 3 reacciones).
  const reaccionesDe = (host) => manifiesto.tomas.find((t) => t.tipo === 'H' && t.clase === 'reacciones' && t.habla === host);

  // B-roll por linea (en_linea). Uno por linea; los demas quedan fuera.
  const brollPorLinea = new Map();
  for (const b of manifiesto.broll || []) {
    if (b.cierre === true) {
      avisos.push(`B-roll ${b.n}: "cierre" no existe en podcast (el CTA va con los hosts a pantalla completa). Queda fuera.`);
      continue;
    }
    if (!Number.isInteger(b.en_linea)) {
      avisos.push(`B-roll ${b.n}: no dice en que linea va (en_linea). Queda fuera.`);
      continue;
    }
    if (brollPorLinea.has(b.en_linea)) {
      avisos.push(`B-roll ${b.n}: la linea ${b.en_linea} ya tiene el B-roll ${brollPorLinea.get(b.en_linea).n}. Queda fuera.`);
      continue;
    }
    brollPorLinea.set(b.en_linea, b);
  }

  // 2) La conversacion en el orden del guion: un bloque por linea, el cursor
  //    avanza lo que dura su segmento. Cada bloque es una pieza de capa 0.
  let cursor = 0;
  for (const g of manifiesto.guion || []) {
    const seg = segPorOrden.get(g.orden);
    if (!seg) {
      // Si su toma (o la linea) ya se aviso como fuera, no se repite.
      if (!lineasYaAvisadas.has(g.orden)) avisos.push(`linea ${g.orden} (${g.habla}: "${g.texto}"): sin segmento. Queda fuera del montaje.`);
      continue;
    }
    const dur = r3(seg.hastaClip - seg.desdeClip);
    // Nunca un trozo vacio o al reves: correria el resto del anuncio hacia atras.
    if (!(dur > 0)) {
      avisos.push(
        `linea ${g.orden} (${g.habla}): su segmento del clip saldria de ${dur.toFixed(2)}s (${seg.desdeClip.toFixed(2)}-${seg.hastaClip.toFixed(2)}s). ` +
          `Queda fuera del montaje: mira la medida de la toma ${seg.toma.n} (npm run lineas -- <carpeta> --tomas ${seg.toma.n}).`
      );
      if (!tomasFuera.has(seg.toma.n)) tomasFuera.set(seg.toma.n, { que: `el segmento de la linea ${g.orden} saldria de ${dur.toFixed(2)}s`, medir: true });
      continue;
    }
    const bloque = {
      linea: seg.toma.n,
      texto: g.texto,
      inicio: r3(cursor),
      fin: r3(cursor + dur),
      ventana: dur,
      tipo: 'H',
      habla: g.habla,
      ...(g.beat ? { beat: g.beat } : {}),
      toma: {
        archivo: seg.archivo,
        largoOriginal: seg.largo,
        duracion: dur,
        desde: r3(cursor),
        metodo: 'sin-ajuste',
        velocidad: 1,
        recorte: 0,
        recorteInicio: seg.desdeClip,
        recorteFin: r3(seg.largo - seg.hastaClip),
        problema: false,
      },
      segmento: { orden: g.orden, desdeClip: seg.desdeClip, hastaClip: seg.hastaClip },
    };
    piezas.push({
      tipo: 'clip',
      archivo: seg.archivo,
      desde: bloque.inicio,
      duracion: dur,
      recorteInicio: seg.desdeClip,
      velocidad: 1,
      mudo: false,
      capa: 0,
      marco: 'completo',
      porque: `linea ${g.orden}: ${g.habla} dice "${g.texto}"`,
    });

    // Donde se oye la linea dentro del bloque (de su primera a su ultima
    // palabra, medidas por `npm run lineas`): de ahi salen los turnos.
    vozDe.set(g.orden, { inicio: r3(bloque.inicio + seg.lineaInicio - seg.desdeClip), fin: r3(bloque.inicio + seg.lineaFin - seg.desdeClip) });

    // 3) Cutaway: mientras se dice la linea se ve al OTRO host reaccionando.
    //    Se ubica en el paso 5, con las reglas de turno y sin pisar un B-roll
    //    (que puede estar en una linea posterior del mismo turno).
    if (g.cutaway && g.cutaway.host) cutawaysPedidos.push({ g, bloque, seg });

    // 4) B-roll encima de la linea: desde su frase hasta el fin del segmento
    //    menos el margen, entre brollMinSeg y brollMaxSeg. Si la frase cae muy
    //    al final, se adelanta (como el inserto de siempre). El host sigue
    //    sonando debajo; el B-roll va mudo.
    const broll = brollPorLinea.get(g.orden);
    if (broll) {
      const archivoB = clipDeBroll(broll.n);
      const largoB = duracionClip.get(archivoB);
      if (g.cutaway) {
        avisos.push(`B-roll ${broll.n}: la linea ${g.orden} ya lleva cutaway; no van los dos a la vez. Queda fuera.`);
      } else if (largoB === undefined) {
        avisos.push(`B-roll ${broll.n}: no encuentro el clip en la carpeta video/. Queda fuera.`);
      } else {
        const ancla = anclaDeFrase({ frase: broll.sincroniza_con, bloque, palabrasSub, palabrasAsr: palabrasAsrDeToma(lineasHabladas, seg.toma.n) });
        const finUtil = bloque.fin - cfg.margenSeg;
        let desde;
        let comoCae;
        if (ancla) {
          desde = ancla.segundo;
          comoCae = `anclado a "${broll.sincroniza_con}" (${ancla.segundo.toFixed(2)}s${ancla.estimado ? ', estimado' : ''})`;
          if (ancla.estimado) avisos.push(avisoDeEstimacion(`B-roll ${broll.n} (linea ${g.orden})`, broll.sincroniza_con, ancla));
        } else {
          desde = bloque.inicio + Math.max(0, (dur - Math.min(cfg.brollMaxSeg, dur - 2 * cfg.margenSeg)) / 2);
          comoCae = `centrado: "${broll.sincroniza_con}" no esta en la linea ${g.orden}`;
          avisos.push(`B-roll ${broll.n}: "${broll.sincroniza_con}" no esta en la linea ${g.orden}. Va centrado en el segmento.`);
        }
        let ventana = Math.min(cfg.brollMaxSeg, finUtil - desde);
        if (ventana < cfg.brollMinSeg) {
          desde = Math.max(bloque.inicio, finUtil - cfg.brollMinSeg);
          ventana = Math.min(cfg.brollMaxSeg, finUtil - desde);
          comoCae += `, adelantado a ${desde.toFixed(2)}s para que dure ${cfg.brollMinSeg}s`;
        }
        if (ventana < 1.0) {
          avisos.push(`B-roll ${broll.n} (linea ${g.orden}): el segmento dura ${dur.toFixed(2)}s y no queda sitio ni para 1 s de B-roll. Queda fuera.`);
        } else {
          let velocidad = 1;
          let recorte = 0;
          if (largoB > ventana + 0.01) {
            velocidad = r3(Math.min(largoB / ventana, cfg.brollVelocidadMax));
            recorte = r3(Math.max(0, largoB / velocidad - ventana));
          } else {
            ventana = largoB;
            comoCae += `, la ventana se acorta al largo del clip (${largoB.toFixed(2)}s)`;
          }
          ventana = r3(ventana);
          desde = r3(desde);
          const hostSync = r3(seg.desdeClip + (desde - bloque.inicio));
          const lado = lados[g.habla] || 'izquierda';
          let recorteHost = null;
          if (modoBroll === 'esquina') {
            piezas.push({
              tipo: 'clip', archivo: archivoB, desde, duracion: ventana, recorteInicio: 0, velocidad, mudo: true, capa: 1, marco: 'completo',
              porque: `B-roll ${broll.n} en la linea ${g.orden} ("${broll.sincroniza_con}")`,
            });
            // El host que habla, recortado sin fondo si recorte.json cubre esta
            // ventana (recorteParaPieza: archivo recorte-toma-N.webm, marco
            // recorte-<lado>, recorteInicio relativo al .webm y su proporcion).
            // Si no, queda la ventana esquina-<lado> de respaldo, con aviso.
            const hostEsquina = {
              tipo: 'clip', archivo: seg.archivo, desde, duracion: ventana, recorteInicio: hostSync, velocidad: 1, mudo: true, capa: 2, marco: `esquina-${lado}`,
              porque: `${g.habla} en la esquina de su lado mientras va el B-roll ${broll.n}`,
            };
            const r = recorteJson ? recorteParaPieza(hostEsquina, recorteJson, { carpeta }) : null;
            if (r?.ok) {
              Object.assign(hostEsquina, r.cambios);
              hostEsquina.porque += ' (recortado sin fondo)';
              recorteHost = hostEsquina.archivo;
            } else if (recorteJson) {
              sinRecorte.push(`B-roll ${broll.n} (linea ${g.orden}): ${r.motivo}`);
            } else {
              sinRecorte.push(`B-roll ${broll.n} (linea ${g.orden})`);
            }
            piezas.push(hostEsquina);
          } else {
            piezas.push({
              tipo: 'clip', archivo: seg.archivo, desde, duracion: ventana, recorteInicio: hostSync, velocidad: 1, mudo: true, capa: 1, marco: 'mitad-inferior',
              porque: `${g.habla} en la mitad de abajo mientras va el B-roll ${broll.n}`,
            });
            piezas.push({
              tipo: 'clip', archivo: archivoB, desde, duracion: ventana, recorteInicio: 0, velocidad, mudo: true, capa: 2, marco: 'mitad-superior',
              porque: `B-roll ${broll.n} en la linea ${g.orden} ("${broll.sincroniza_con}")`,
            });
          }
          bloque.brollEncima = {
            n: broll.n, archivo: archivoB, sincroniza_con: broll.sincroniza_con, modo: modoBroll, desde, duracion: ventana, velocidad, recorte,
            largoOriginal: r3(largoB), anclaSegundo: ancla ? ancla.segundo : null, comoCae,
            // Esquina: el .webm del host recortado sin fondo, o null si va en
            // la ventana de respaldo (para el plan legible).
            ...(modoBroll === 'esquina' ? { recorteHost } : {}),
          };
          ocupadas.push({ desde, hasta: r3(desde + ventana), que: `el B-roll ${broll.n} (linea ${g.orden})` });
          brollUsados.add(broll.n);
        }
      }
    }

    bloques.push(bloque);
    cursor = bloque.fin;
  }

  // Sin ninguna linea no hay anuncio: antes salia un plan vacio (duracion 0,
  // codigo 0, "ninguno detiene el montaje") cuando todas las medidas faltaban
  // o eran de otro clip, que es justo lo que queda despues de regenerar las
  // tomas (`npm run videos` quita su medida). Se corta con el comando, como
  // cuando falta lineas-habladas.json.
  if (!bloques.length) throw new Error(errorSinLineas(tomasFuera));

  // Esquina sin el recorte del host: la ventana de respaldo, con un solo aviso.
  if (sinRecorte.length) {
    avisos.push(
      recorteJson
        ? `Esquina: el host va en una ventana, no recortado sin fondo, en ${sinRecorte.join('; ')}: corre npm run recortar -- <carpeta> y despues npm run plan -- <carpeta>.`
        : `Esquina: todavia no hay recorte.json, asi que el host va en una ventana en la esquina (${sinRecorte.join(', ')}). ` +
            'Para el host recortado sin fondo, corre npm run recortar -- <carpeta> y despues npm run plan -- <carpeta>. ' +
            'Orden: plan -> subtitulos -> plan -> recortar -> plan -> ensamblar --concurrencia 1 (el recorte nunca a la vez que un render).'
    );
  }

  // 5) Cutaways, con todas las lineas, los turnos y los B-roll ya en su lugar.
  //    Turno = lineas seguidas del mismo host, de su primera a su ultima
  //    palabra. Cada cutaway:
  //      desde  fin de su frase "tras" + cutawayTrasFraseSeg. Sin "tras" (o si
  //             no esta en la linea), inicio del turno + turnoMinSeg, o el
  //             inicio de su linea si va mas adelante. Nunca antes del inicio
  //             del turno + turnoMinSeg.
  //      hasta  desde + cutawaySeg, sin pasar del fin del turno - margenSeg ni
  //             del inicio de un B-roll o de otro cutaway. Con menos de
  //             cutawayMinSeg queda fuera.
  //    Suena (mudo false, cutawayVolumenDb) y la reaccion se corta donde de
  //    verdad pasa en su clip (momentosDeReacciones). Si una palabra cae
  //    dentro de lo que se usa de la reaccion, ese cutaway queda fuera.
  const turnoDe = new Map(); // orden -> { habla, inicio, fin }
  let turno = null;
  for (const b of bloques) {
    const voz = vozDe.get(b.segmento.orden);
    if (!turno || turno.habla !== b.habla) turno = { habla: b.habla, inicio: voz.inicio, fin: voz.fin };
    else turno.fin = Math.max(turno.fin, voz.fin);
    turnoDe.set(b.segmento.orden, turno);
  }

  const palabrasFin = cutawaysPedidos.length ? palabrasConFin(carpeta) : null;
  const cfgR = cfg.reacciones;
  const reacciones = new Map(); // host -> lo medido de su clip de reacciones (o null)
  const reaccionesMedidas = (host, orden) => {
    if (reacciones.has(host)) return reacciones.get(host);
    let info = null;
    const tomaR = reaccionesDe(host);
    const archivoR = tomaR ? clipDeToma(tomaR.n) : null;
    const largoR = archivoR ? duracionClip.get(archivoR) : undefined;
    if (!tomaR) {
      avisos.push(`linea ${orden}: pide un cutaway de ${host} pero ${host} no tiene toma de reacciones. Sin cutaways de ${host}.`);
    } else if (largoR === undefined) {
      avisos.push(`linea ${orden}: el cutaway necesita ${archivoR} y no esta en video/. Sin cutaways de ${host}.`);
    } else {
      // La revision del clip de reacciones (`npm run lineas`): sus palabras
      // (cada una es falla) y sus eventos de sonido, si es de ESTE clip.
      const etiqueta = `toma ${tomaR.n} (reacciones de ${host})`;
      const comoMedir = `npm run lineas -- <carpeta> --tomas ${tomaR.n}`;
      let entrada = lineasHabladas.tomas?.[String(tomaR.n)] || null;
      if (medidasViejas.has(tomaR.n)) {
        // Una medida de otro clip ya no esta en lineasHabladas (medidasVigentes).
        avisos.push(
          `${etiqueta}: ` +
            avisoDeMedidasViejas([tomaR.n], medidasViejas, 'Hasta entonces no se sabe si dice alguna palabra y cada reaccion se ubica solo por el audio.')
        );
        entrada = null;
      } else if (!entrada || entrada.reacciones !== true) {
        avisos.push(
          `${etiqueta}: no esta revisada en lineas-habladas.json. No se sabe si dice alguna palabra (una reaccion no lleva ninguna) ` +
            `y cada reaccion se ubica solo por el audio. Revisala: ${comoMedir}`
        );
        entrada = null;
      }
      const palabras = entrada ? palabrasConVoz(entrada.palabras) : [];
      if (entrada && (entrada.limpio === false || palabras.length)) {
        avisos.push(
          `${etiqueta}: NO ESTA LIMPIO, dice palabras (${palabras.map((w) => `"${String(w.text).trim()}" ${w.start.toFixed(2)}s`).join(', ') || 'ver lineas-habladas.json'}). ` +
            'Una reaccion no lleva ninguna palabra ni monosilabo, en ningun idioma: el clip se regenera aunque esa reaccion no se use ' +
            `(npm run rehacer -- <carpeta> --toma ${tomaR.n} --contexto). ` +
            'Mientras tanto, el cutaway que tenga una palabra dentro queda fuera.'
        );
      }
      const eventos = Array.isArray(entrada?.eventos) ? entrada.eventos : [];
      // Los golpes del audio solo hacen falta si los eventos no son 3.
      const golpes = eventos.length === 3 ? [] : golpesDeReaccion(path.join(dirVideo, archivoR), cfgR);
      const momentos = momentosDeReacciones({ eventos, golpes, largo: largoR, margenSeg: cfg.margenSeg });
      info = { tomaR, archivoR, largoR, palabras, momentos, etiqueta };
    }
    reacciones.set(host, info);
    return info;
  };

  const sinTras = [];
  for (const { g, bloque } of cutawaysPedidos) {
    const host = g.cutaway.host;
    const n = Math.min(3, Math.max(1, Number(g.cutaway.reaccion) || 1));
    const et = `linea ${g.orden}, cutaway de ${host}`;
    const info = reaccionesMedidas(host, g.orden);
    if (!info) continue;
    const turnoL = turnoDe.get(g.orden);
    const voz = vozDe.get(g.orden);
    const minDesde = turnoL.inicio + cfg.turnoMinSeg;

    // Donde entra.
    const tras = typeof g.cutaway.tras === 'string' && g.cutaway.tras.trim() ? g.cutaway.tras.trim() : null;
    let desde = null;
    let comoEntra = '';
    if (tras) {
      const f = finDeFrase({ frase: tras, bloque, voz, palabrasFin, palabrasAsr: palabrasAsrConFin(lineasHabladas, bloque.linea) });
      if (f) {
        desde = f.segundo + cfg.cutawayTrasFraseSeg;
        comoEntra = `justo despues de "${tras}" (termina en ${f.segundo.toFixed(2)}s${f.estimado ? ', estimado' : ''})`;
        if (f.estimado) {
          avisos.push(
            `${et}: el fin de "${tras}" sale ESTIMADO ` +
              (f.fuente === 'transcripcion' ? 'por la transcripcion de lineas-habladas.json' : 'por la posicion de la frase en la linea') +
              '. Con subtitulos.json sale exacto: node produccion/subtitulos-dialogo.js <carpeta>  y despues  npm run plan.'
          );
        }
      } else {
        avisos.push(`${et}: "tras" ("${tras}") no esta en la linea. Entra como sin "tras", a los ${cfg.turnoMinSeg} s del turno de ${g.habla}.`);
      }
    } else {
      sinTras.push(g.orden);
    }
    if (desde === null) {
      desde = Math.max(minDesde, voz.inicio);
      comoEntra = desde > minDesde + 1e-6 ? 'al empezar la linea' : `a los ${cfg.turnoMinSeg} s del turno de ${g.habla}`;
    } else if (desde < minDesde) {
      desde = minDesde;
      comoEntra += `, corrido a los ${cfg.turnoMinSeg} s del turno de ${g.habla}`;
    }
    desde = r3(desde);

    // Hasta donde puede ir: quien habla vuelve antes de terminar su turno, y
    // nunca encima de un B-roll ni de otro cutaway.
    const finTurno = turnoL.fin - cfg.margenSeg;
    const { tope, contra } = hastaSinPisar(desde, Math.min(desde + cfg.cutawaySeg, finTurno), ocupadas);
    if (tope === null) {
      avisos.push(`${et}: caeria en ${desde.toFixed(2)}s, encima de ${contra.que}. Queda fuera.`);
      continue;
    }
    const duracion = r3(tope - desde);
    const limite = contra
      ? `antes de ${contra.que}`
      : `${g.habla} vuelve a cuadro ${cfg.margenSeg} s antes de terminar su turno, en ${turnoL.fin.toFixed(2)}s`;
    if (duracion < cfg.cutawayMinSeg - 1e-6) {
      avisos.push(
        `${et}: entraria en ${desde.toFixed(2)}s y solo le quedan ${Math.max(0, duracion).toFixed(2)}s (${limite}); ` +
          `no entra ni acortado a ${cfg.cutawayMinSeg}s. Queda fuera.`
      );
      continue;
    }
    if (duracion < cfg.cutawaySeg - 1e-6) avisos.push(`${et}: acortado a ${duracion.toFixed(2)}s (${limite}).`);

    // De que segundo del clip de reacciones sale: antesSeg antes de su sonido;
    // sin sonido medido, el centro del tercio n (como antes).
    const m = info.momentos[n - 1];
    let recorteInicio;
    if (m.inicio !== null) {
      recorteInicio = Math.min(Math.max(0, m.inicio - cfgR.antesSeg), Math.max(0, info.largoR - duracion));
    } else {
      const tercio = Math.max(0, info.largoR - 2 * cfg.margenSeg) / 3;
      const centro = cfg.margenSeg + tercio * (n - 0.5);
      recorteInicio = Math.min(Math.max(centro - duracion / 2, cfg.margenSeg), Math.max(0, info.largoR - cfg.margenSeg - duracion));
      avisos.push(
        `${et}: no encontre el sonido de su reaccion ${n} en la toma ${info.tomaR.n}, ni en lineas-habladas.json ni en el audio. ` +
          'Va el centro de su tercio del clip: mira ese cutaway.'
      );
    }
    recorteInicio = r3(recorteInicio);
    const dichas = info.palabras.filter((w) => w.start < recorteInicio + duracion && w.end > recorteInicio);
    if (dichas.length) {
      avisos.push(
        `${et}: la reaccion ${n} dice ${dichas.map((w) => `"${String(w.text).trim()}"`).join(' ')} dentro de lo que se usaria ` +
          `(${recorteInicio.toFixed(2)}-${(recorteInicio + duracion).toFixed(2)}s del clip). Queda fuera: regenera ${info.etiqueta}.`
      );
      continue;
    }

    const descripcion = (info.tomaR.reacciones || []).find((x) => Number(x.n) === n)?.descripcion || null;
    piezas.push({
      tipo: 'clip',
      archivo: info.archivoR,
      desde,
      duracion,
      recorteInicio,
      velocidad: 1,
      mudo: false,
      volumenDb: cfg.cutawayVolumenDb,
      capa: 1,
      marco: 'completo',
      porque: `cutaway: ${host} reaccion ${n}${descripcion ? ` (${descripcion})` : ''} ${comoEntra}, mientras ${g.habla} dice la linea ${g.orden}`,
    });
    ocupadas.push({ desde, hasta: r3(desde + duracion), que: `el cutaway de la linea ${g.orden}` });
    // Tambien en el bloque de su linea, para el plan legible (que cuenta la
    // linea con su cutaway) sin tener que buscar la pieza en la escena.
    bloque.cutaway = {
      host,
      reaccion: n,
      descripcion,
      archivo: info.archivoR,
      desde,
      duracion,
      recorteInicio,
      conSonido: true,
      volumenDb: cfg.cutawayVolumenDb,
      ...(tras ? { tras } : {}),
      // De donde salio el segundo de la reaccion: 'eventos' (Scribe),
      // 'audio' (golpes de la envolvente) o 'tercio' (sin medida).
      momento: m.fuente,
      ...(m.inicio !== null ? { sonidoEn: m.inicio } : {}),
    };
  }
  if (sinTras.length) {
    avisos.push(
      `${sinTras.length === 1 ? `Linea ${sinTras[0]}: el cutaway no trae` : `Lineas ${sinTras.join(', ')}: los cutaways no traen`} "tras" ` +
        `(la frase despues de la cual entra la reaccion). Entra a los ${cfg.turnoMinSeg} s del turno de quien habla; con "tras" entra justo despues de la frase que lo provoca.`
    );
  }

  const brollFuera = (manifiesto.broll || []).filter((b) => !brollUsados.has(b.n)).map((b) => b.n);
  return {
    bloques,
    avisos,
    brollUsados: [...brollUsados],
    brollFuera,
    finAudio: r3(cursor),
    escena: { estilo: 'podcast', modoBroll, lados, piezas },
  };
}

/**
 * ENTREVISTA (variante A, variante B e iconos). Los clips van
 * enteros, con los bordes cortados por los tiempos de cada palabra
 * (bordesPorPalabras; por silencio si la toma no esta medida); lo que cambia
 * es que se ve encima.
 */
function planearEntrevista({ manifiesto, carpeta, dirVideo, duracionClip, palabrasSub, lineasHabladas, medidasViejas = new Map(), avisos }) {
  const cfg = REGLAS_HABLADO.entrevista;
  const ent = manifiesto.entrevista || {};
  const variante = String(ent.variante || 'A').toUpperCase() === 'B' ? 'B' : 'A';
  const ladoMic = ent.lado_mic || 'izquierda';
  // El idioma de los numeros en letras al comparar guion contra oido (el
  // mismo que usa `npm run lineas`).
  const idioma = ['es', 'en', 'pt'].includes(manifiesto.idioma) ? manifiesto.idioma : 'es';
  const congeladoTras = variante === 'A' ? ent.congelado?.despues_de_toma ?? null : null;
  if (variante === 'B' && ent.congelado) avisos.push('entrevista.congelado solo aplica a la variante A. Se ignora.');
  if (variante === 'A' && congeladoTras === null) avisos.push('Variante A sin entrevista.congelado.despues_de_toma: no hay congelado y toda la historia se ve como clips.');

  const bloques = [];
  const piezas = [];
  const brollUsados = new Set();
  const efectos = new Map();
  let cursor = 0;
  let congelado = null;
  let ultimaVisible = null; // ultima pieza de capa 0 que se VE (para la disolvencia)

  const tomasH = manifiesto.tomas.filter((t) => t.tipo === 'H');
  let despuesDelCongelado = false;
  const sinMedida = []; // tomas con bordes por silencio porque falta su medida
  const medidaVieja = []; // tomas con la medida de otro clip (medidasVigentes)
  const sinMedidaTrasVoz = []; // tomas ya recortadas por el paso voz que todavia no se midieron de nuevo
  const sinPasoVoz = []; // tomas solo_voz de A que no pasaron por `npm run voz`
  for (const toma of tomasH) {
    // Bordes por palabras. La cola: la que pida la toma (cola_seg), la del
    // ultimo clip del gancho de A (el del congelado: se ve la cara de "no se")
    // o la de siempre.
    const colaSeg =
      Number.isFinite(toma.cola_seg) && toma.cola_seg >= 0
        ? toma.cola_seg
        : variante === 'A' && toma.n === congeladoTras
          ? cfg.colaAntesDelCongeladoSeg
          : cfg.colaSeg;
    const porPalabras = {
      medida: lineasHabladas?.tomas?.[String(toma.n)] || null,
      cabezaSeg: cfg.cabezaSeg,
      colaSeg,
      pausaMinSeg: cfg.pausaInteriorSeg,
      idioma,
    };
    const bloque = bloqueEnteroH(toma, dirVideo, duracionClip, cursor, avisos, porPalabras);
    if (bloque.toma.sinMedida) {
      if (medidasViejas.has(toma.n)) medidaVieja.push(toma.n);
      else if (bloque.toma.bordes === 'ya-recortado') sinMedidaTrasVoz.push(toma.n);
      else sinMedida.push(toma.n);
    }
    if (!bloque.toma.problema) {
      const soloVoz = variante === 'A' && (toma.solo_voz === true || despuesDelCongelado);
      // El paso voz (recortar-voz.js) procesa SOLO las tomas con solo_voz:
      // true, asi que solo esas pueden estar sin pasar por el.
      if (soloVoz && toma.solo_voz === true && bloque.toma.bordes !== 'ya-recortado') sinPasoVoz.push(toma.n);
      if (variante === 'A' && despuesDelCongelado && toma.solo_voz !== true) {
        avisos.push(
          `toma ${toma.n}: viene despues del congelado y no es solo_voz. Se trata como parte de la historia (solo se oye), ` +
            'pero el paso voz no la toca (ni le saca los silencios ni la acelera): marcala solo_voz: true en el manifiesto.'
        );
      }
      if (bloque.toma.pausasInteriores) {
        avisos.push(`toma ${toma.n}: tiene ${bloque.toma.pausasInteriores} pausa(s) DENTRO del dialogo. No se tocan: ahi esta el lip-sync.`);
      }
      const pieza = {
        tipo: 'clip',
        archivo: bloque.toma.archivo,
        desde: bloque.inicio,
        duracion: bloque.toma.duracion,
        recorteInicio: bloque.toma.recorteInicio,
        velocidad: 1,
        mudo: false,
        capa: 0,
        marco: soloVoz ? 'oculto' : 'completo',
        porque: soloVoz ? `toma ${toma.n}: solo se oye su voz, la cubre la cadena de B-roll` : `toma ${toma.n}${toma.fase ? ` (${toma.fase})` : ''}`,
      };
      // Variante B: "combinar" entre clips. La pieza anterior se alarga la
      // disolvencia (sigue teniendo imagen aunque no le quede borde) y esta
      // entra con fundido encima. El audio no cambia: corte limpio en bloques.
      if (variante === 'B' && ultimaVisible) {
        ultimaVisible.duracion = r3(ultimaVisible.duracion + cfg.disolvenciaSeg);
        pieza.fundidoEntrada = cfg.disolvenciaSeg;
      }
      piezas.push(pieza);
      if (!soloVoz) ultimaVisible = pieza;
      bloque.soloVoz = soloVoz;
      cursor = bloque.fin;
    }
    bloques.push(bloque);

    // Congelado con golpe al final del gancho: ocupa tiempo (el cursor avanza)
    // pero no es hablado, asi que no es un bloque. El siguiente bloque empieza
    // congeladoSeg despues.
    if (variante === 'A' && toma.n === congeladoTras) {
      despuesDelCongelado = true;
      if (bloque.toma.problema) {
        avisos.push(`El congelado va despues de la toma ${toma.n}, que no tiene clip. Sin congelado.`);
      } else {
        const foto = fotogramaCongelado(carpeta, dirVideo, bloque, avisos);
        if (foto) {
          // Golpe con la variante elegida en las pruebas (glitch RGB + negativo).
          piezas.push({
            tipo: 'imagen',
            archivo: foto.archivo,
            desde: r3(cursor),
            duracion: cfg.congeladoSeg,
            capa: 0,
            efecto: 'golpe',
            variante: cfg.congeladoVariante,
            porque: `congelado con ${cfg.congeladoVariante}: ultimo fotograma de ${bloque.toma.archivo} (${foto.como}, segundo ${foto.segundoDelClip} del clip)`,
          });
          // El sonido del congelado es el "glitch" que se usaba en CapCut con
          // la transicion "congelacion negativa" (se agrego el 2026-10-13 en
          // recursos/efectos-transiciones/congelado.mp3, 0.68 s).
          const ef = efectoDeMontaje(carpeta, 'congelado.mp3', efectos, avisos);
          if (ef) piezas.push(piezaDeSonido(ef, cursor, 'golpe del congelado (glitch)'));
          congelado = { desde: r3(cursor), duracion: cfg.congeladoSeg, archivo: foto.archivo, tomaAntes: toma.n, variante: cfg.congeladoVariante };
          cursor = r3(cursor + cfg.congeladoSeg);
          ultimaVisible = null;
        }
      }
    }
  }
  if (sinMedida.length) {
    avisos.push(
      `${sinMedida.length === 1 ? 'La toma' : 'Las tomas'} ${sinMedida.join(', ')} no ${sinMedida.length === 1 ? 'tiene' : 'tienen'} su medida en lineas-habladas.json. ` +
        'Sus bordes van por silencio, que con el ambiente de la calle casi no corta, y los subtitulos ' +
        `saldrian de otra medida. Midelas:  npm run lineas -- <carpeta> --tomas ${sinMedida.join(',')}  y vuelve a planear.`
    );
  }
  if (medidaVieja.length) {
    avisos.push(
      avisoDeMedidasViejas(
        medidaVieja,
        medidasViejas,
        'Hasta entonces cuenta como si faltara: sus bordes van por silencio (o no se cortan de nuevo, si ya pasaron por el paso voz) ' +
          'y las frases ancla y los subtitulos no tienen de donde salir.'
      )
    );
  }
  if (sinMedidaTrasVoz.length) {
    avisos.push(
      `${sinMedidaTrasVoz.length === 1 ? 'La toma' : 'Las tomas'} ${sinMedidaTrasVoz.join(', ')} ya ${sinMedidaTrasVoz.length === 1 ? 'salio recortada' : 'salieron recortadas'} ` +
        `por el paso voz y todavia no ${sinMedidaTrasVoz.length === 1 ? 'tiene' : 'tienen'} su medida: las frases ancla y los subtitulos no tienen de donde salir. ` +
        `Corre  npm run lineas -- <carpeta> --tomas ${sinMedidaTrasVoz.join(',')}  (despues del paso voz hay que medir de nuevo) y vuelve a planear.`
    );
  }
  if (sinPasoVoz.length) {
    avisos.push(
      `${sinPasoVoz.length === 1 ? 'La toma' : 'Las tomas'} ${sinPasoVoz.join(', ')} (solo se oye la voz) no ${sinPasoVoz.length === 1 ? 'paso' : 'pasaron'} por el paso voz: ` +
        `van con sus silencios de adentro y a 1x. Despues de  npm run lineas  corre  npm run voz -- <carpeta> --tomas ${sinPasoVoz.join(',')}  ` +
        'y despues el  npm run lineas  que imprime (hay que medirlas de nuevo).'
    );
  }

  // Historia (variante A): la cadena de B-roll encima de las tomas solo_voz.
  // B-roll k va desde su frase hasta la frase del k+1; el primero desde que
  // empieza la historia, el ultimo hasta que termina.
  const historia = bloques.filter((b) => b.soloVoz && !b.toma.problema);
  let ultimaDeCadena = null;
  if (historia.length) {
    const inicioHist = historia[0].inicio;
    const finHist = historia[historia.length - 1].fin;
    const anclas = [];
    for (const b of manifiesto.broll || []) {
      if (b.cierre === true || !Number.isInteger(b.encima_de_toma)) continue;
      const bloque = historia.find((x) => x.linea === b.encima_de_toma);
      if (!bloque) {
        if (bloques.some((x) => x.linea === b.encima_de_toma)) {
          avisos.push(`B-roll ${b.n}: la toma ${b.encima_de_toma} no es de la historia (no es solo_voz). En la variante A el B-roll solo cubre la historia. Queda fuera.`);
        } else {
          avisos.push(`B-roll ${b.n}: la toma ${b.encima_de_toma} no esta en el montaje. Queda fuera.`);
        }
        continue;
      }
      const ancla = anclaDeFrase({ frase: b.sincroniza_con, bloque, palabrasSub, palabrasAsr: palabrasAsrDeToma(lineasHabladas, bloque.linea) });
      let segundo = bloque.inicio;
      if (!ancla) {
        avisos.push(`B-roll ${b.n}: "${b.sincroniza_con}" no esta en la linea de la toma ${b.encima_de_toma}. Entra al inicio de esa toma.`);
      } else {
        segundo = ancla.segundo;
        if (ancla.estimado) avisos.push(avisoDeEstimacion(`B-roll ${b.n} (toma ${b.encima_de_toma})`, b.sincroniza_con, ancla));
      }
      anclas.push({ broll: b, bloque, segundo, orden: historia.indexOf(bloque) });
    }
    anclas.sort((x, y) => x.orden - y.orden || x.segundo - y.segundo);
    if (!anclas.length) {
      avisos.push('La historia (tomas solo_voz) no tiene ningun B-roll: se oye la voz y no se ve nada. Agrega B-roll con encima_de_toma.');
    }
    anclas.forEach((a, k) => {
      const archivoB = clipDeBroll(a.broll.n);
      const largoB = duracionClip.get(archivoB);
      const desde = k === 0 ? inicioHist : a.segundo;
      const hasta = k + 1 < anclas.length ? anclas[k + 1].segundo : finHist;
      const ventana = r3(hasta - desde);
      if (ventana <= 0.05) {
        avisos.push(`B-roll ${a.broll.n}: su frase cae en el mismo segundo que la del siguiente (${desde.toFixed(2)}s). No le queda ventana. Queda fuera.`);
        return;
      }
      if (largoB === undefined) {
        avisos.push(`B-roll ${a.broll.n}: no encuentro el clip en la carpeta video/. Su tramo (${desde.toFixed(2)}-${hasta.toFixed(2)}s) queda sin imagen.`);
        return;
      }
      if (ventana > cfg.ventanaMaxSeg) {
        avisos.push(`B-roll ${a.broll.n}: cubre ${ventana.toFixed(2)}s (${desde.toFixed(2)}-${hasta.toFixed(2)}s), mas de ${cfg.ventanaMaxSeg}s. Se hace largo: mete otro B-roll en medio.`);
      } else if (ventana < cfg.ventanaMinSeg) {
        avisos.push(`B-roll ${a.broll.n}: solo ${ventana.toFixed(2)}s en pantalla (${desde.toFixed(2)}-${hasta.toFixed(2)}s), menos de ${cfg.ventanaMinSeg}s. Casi no se ve.`);
      }
      let velocidad;
      let congelarFinal = false;
      let recorte = 0;
      if (largoB >= ventana) {
        velocidad = r3(Math.min(largoB / ventana, cfg.brollVelocidadMax));
        recorte = r3(Math.max(0, largoB / velocidad - ventana));
      } else {
        velocidad = r3(Math.max(cfg.brollVelocidadMin, largoB / ventana));
        congelarFinal = largoB / velocidad < ventana - 0.02;
      }
      const pieza = {
        tipo: 'clip',
        archivo: archivoB,
        desde: r3(desde),
        duracion: ventana,
        recorteInicio: 0,
        velocidad,
        mudo: true,
        capa: 1,
        marco: 'completo',
        ...(congelarFinal ? { congelarFinal: true } : {}),
        porque:
          `B-roll ${a.broll.n} de la historia: "${a.broll.sincroniza_con}" (toma ${a.broll.encima_de_toma})` +
          (k === 0 && a.segundo > inicioHist + 0.01 ? `, arranca con la historia aunque su frase cae a ${a.segundo.toFixed(2)}s` : '') +
          (congelarFinal ? `, el clip (${largoB.toFixed(2)}s a ${velocidad}x) no llena la ventana: se congela el ultimo fotograma` : ''),
      };
      piezas.push(pieza);
      ultimaDeCadena = pieza;
      a.bloque.brollEncima = [...(a.bloque.brollEncima || []), { n: a.broll.n, archivo: archivoB, sincroniza_con: a.broll.sincroniza_con, desde: pieza.desde, duracion: ventana, velocidad, recorte, congelarFinal, largoOriginal: r3(largoB) }];
      brollUsados.add(a.broll.n);
    });
  } else if (variante === 'A') {
    for (const b of manifiesto.broll || []) {
      if (b.cierre !== true && Number.isInteger(b.encima_de_toma)) avisos.push(`B-roll ${b.n}: no hay tomas solo_voz que cubrir. Queda fuera.`);
    }
  } else {
    for (const b of manifiesto.broll || []) {
      if (b.cierre !== true) avisos.push(`B-roll ${b.n}: en la variante B solo va el B-roll de cierre (cierre: true). Queda fuera.`);
    }
  }

  // B-roll de cierre (B, y opcional en A): en fila despues del ultimo bloque,
  // mudo, entero a 1x, con disolvencia de entrada, y el texto del CTA encima
  // todo el tiempo. El cursor avanza: finAudio incluye el cierre.
  const cierres = (manifiesto.broll || []).filter((b) => b.cierre === true);
  let cierre = null;
  if (cierres.length > 1) avisos.push(`Hay ${cierres.length} B-roll de cierre; va el primero (${cierres[0].n}).`);
  if (cierres.length) {
    const b = cierres[0];
    const archivoB = clipDeBroll(b.n);
    const largoB = duracionClip.get(archivoB);
    const ultimaToma = tomasH[tomasH.length - 1];
    if (ultimaToma && b.despues_de_toma !== undefined && b.despues_de_toma !== ultimaToma.n) {
      avisos.push(`B-roll de cierre ${b.n}: dice despues_de_toma ${b.despues_de_toma} y la ultima toma es la ${ultimaToma.n}. Va al final igual.`);
    }
    if (largoB === undefined) {
      avisos.push(`B-roll de cierre ${b.n}: no encuentro el clip en la carpeta video/. Sin cierre ni CTA.`);
    } else {
      const previa = ultimaVisible || ultimaDeCadena;
      if (previa) previa.duracion = r3(previa.duracion + cfg.disolvenciaSeg);
      const duracion = r3(largoB);
      piezas.push({
        tipo: 'clip',
        archivo: archivoB,
        desde: r3(cursor),
        duracion,
        recorteInicio: 0,
        velocidad: 1,
        mudo: true,
        capa: 0,
        marco: 'completo',
        fundidoEntrada: cfg.disolvenciaSeg,
        porque: `B-roll de cierre ${b.n}, entero`,
      });
      if (ent.cta?.texto) {
        piezas.push({ tipo: 'texto', texto: ent.cta.texto, flecha: ent.cta.flecha === true, desde: r3(cursor), duracion, capa: 3, porque: 'llamado a la accion sobre el B-roll de cierre' });
      } else {
        avisos.push('El B-roll de cierre va sin texto: entrevista.cta.texto esta vacio.');
      }
      cierre = { n: b.n, archivo: archivoB, desde: r3(cursor), duracion, cta: ent.cta?.texto || null };
      cursor = r3(cursor + duracion);
      brollUsados.add(b.n);
    }
  }

  // El producto al centro cuando se dice la marca (variante B). El campo del
  // manifiesto sigue siendo sticker_producto (toma + sincroniza_con), pero ya
  // no es un sticker en la esquina: es un icono mas, al centro, con su clic
  // (decidido el 2026-10-14). Vale para cualquier
  // producto con foto; un digital o un servicio sin foto no lleva pieza. El
  // marco "sticker-esquina" queda en Escena solo para planes viejos.
  if (manifiesto.sticker_producto && variante !== 'B') {
    avisos.push('sticker_producto solo va en la variante B (el producto al centro, con un clic). En la A se ignora.');
  } else if (manifiesto.sticker_producto) {
    const sp = manifiesto.sticker_producto;
    const bloque = bloques.find((b) => b.linea === sp.toma && !b.toma.problema);
    const producto = listaDeReferencias(manifiesto).find((r) => (r.tipo || '').toLowerCase() === 'producto' && typeof r.archivo === 'string' && r.archivo.trim());
    const rutaFoto = producto ? path.join(carpeta, producto.archivo) : null;
    if (!bloque) {
      avisos.push(`sticker_producto: la toma ${sp.toma} no esta en el montaje. El producto no aparece al centro.`);
    } else if (!producto) {
      avisos.push('sticker_producto: no hay foto del producto (una referencia de tipo "producto" con archivo). El producto no aparece al centro.');
    } else if (!fs.existsSync(rutaFoto)) {
      avisos.push(`sticker_producto: falta ${producto.archivo} en la carpeta del anuncio. El producto no aparece al centro hasta que este.`);
    } else {
      const ancla = anclaDeFrase({ frase: sp.sincroniza_con, bloque, palabrasSub, palabrasAsr: palabrasAsrDeToma(lineasHabladas, sp.toma) });
      let desde = bloque.inicio;
      if (!ancla) {
        avisos.push(`sticker_producto: "${sp.sincroniza_con}" no esta en la linea de la toma ${sp.toma}. El producto entra al inicio del bloque.`);
      } else {
        desde = ancla.segundo;
        if (ancla.estimado) avisos.push(avisoDeEstimacion('producto al centro', sp.sincroniza_con, ancla));
      }
      const duracion = r3(Math.min(cfg.producto.seg, bloque.fin - desde));
      if (duracion < 0.5) {
        avisos.push(`sticker_producto: la frase cae a ${desde.toFixed(2)}s y el bloque termina a ${bloque.fin.toFixed(2)}s. Sin sitio: el producto no aparece al centro.`);
      } else {
        const recortada = fotoConTransparencia(rutaFoto);
        piezas.push({
          tipo: 'icono',
          archivo: producto.archivo,
          desde: r3(desde),
          duracion,
          capa: 3,
          centroX: cfg.producto.centroX,
          centroY: cfg.producto.centroY,
          ancho: cfg.producto.ancho,
          // Recortada si la foto trae transparencia real; si no, en tarjeta blanca.
          sticker: recortada ? 'recorte' : 'tarjeta',
          // Asi la encuentran el plan legible y iconosDeAUno (no es de ningun grupo).
          producto: true,
          toma: sp.toma,
          lado: otroLado(ladoMic), // solo por compatibilidad
          porque: `foto del producto al centro cuando se dice "${sp.sincroniza_con}" (${recortada ? 'con transparencia: recortada' : 'sin transparencia: en tarjeta blanca'})`,
        });
      }
    }
  }

  piezasDeIconos({ manifiesto, carpeta, bloques, palabrasSub, lineasHabladas, piezas, avisos, efectos, variante, congelado });
  // B: de a uno al centro, con el producto, y un clic al aparecer cada uno.
  if (variante === 'B') iconosDeAUno({ piezas, carpeta, efectos, avisos });

  const brollFuera = (manifiesto.broll || []).filter((b) => !brollUsados.has(b.n)).map((b) => b.n);
  return {
    bloques,
    avisos,
    brollUsados: [...brollUsados],
    brollFuera,
    finAudio: r3(cursor),
    escena: { estilo: 'entrevista', variante, ladoMic, ladoIconos: ent.lado_iconos || otroLado(ladoMic), piezas, ...(congelado ? { congelado } : {}), ...(cierre ? { cierre } : {}) },
  };
}

/** Orden de las piezas para leerlas: capa 0 encadenada primero, el resto por capa y segundo. */
function ordenDePieza(p) {
  if (p.tipo === 'sonido') return 9;
  if (p.tipo === 'icono') return 3;
  return p.capa ?? 3;
}

/**
 * Si subtitulos.json se hizo con OTRO plan. subtitulos-dialogo.js guarda en
 * `lineaDeTiempo` los bloques del plan con el que lo hizo ([{ toma, inicio,
 * fin }], en orden, y si los trae, `recorteInicio` / `desdeClip`: el segundo
 * del clip donde empieza el bloque); si los de ahora no son esos, sus
 * palabras caen en otros segundos y todo lo que se ancla a ellas (iconos,
 * check, producto, B-roll, cutaways, alturas) va corrido. FUNCION PURA.
 *
 * Devuelve null si coinciden, o { tipo, que } con el primer cambio:
 *   'bloques'  otra cantidad de bloques o un bloque de otra toma (una toma
 *              entro o salio del montaje: una medida que falta o es de otro
 *              clip, un clip regenerado...). Se mira primero en todos.
 *   'bordes'   los mismos bloques, pero un inicio, un fin o la cabeza del
 *              recorte se movio mas de `tolerancia` (los bordes por palabras,
 *              el congelado). La cabeza solo se compara si la entrada la trae
 *              (los subtitulos.json de antes no la traen).
 */
export function diferenciaDeLineaDeTiempo(lineaDeTiempo, bloques, tolerancia = 0.02) {
  const s2 = (x) => `${Number(x).toFixed(2)}s`;
  const antes = Array.isArray(lineaDeTiempo) ? lineaDeTiempo : [];
  const ahora = bloques || [];
  const cambios = [];
  if (antes.length !== ahora.length) cambios.push(`subtitulos.json se hizo con ${antes.length} bloques y ahora hay ${ahora.length}`);
  const mismaToma = Math.min(antes.length, ahora.length);
  for (let i = 0; i < mismaToma; i++) {
    if (String(antes[i]?.toma) !== String(ahora[i].linea)) {
      cambios.push(`el bloque ${i + 1} era de la toma ${antes[i]?.toma} y ahora es de la ${ahora[i].linea}`);
      break;
    }
  }
  if (cambios.length) return { tipo: 'bloques', que: cambios.join('; ') };

  // Donde empieza el bloque dentro de su clip, hoy: el segmento del podcast o
  // el recorte de la cabeza de la entrevista (0 si el bloque no tiene ninguno).
  const cabezaDe = (b, primero) => {
    const x = primero === 'segmento' ? b.segmento?.desdeClip ?? b.toma?.recorteInicio : b.toma?.recorteInicio ?? b.segmento?.desdeClip;
    return Number.isFinite(x) ? x : 0;
  };
  const cerca = (x, y) => Math.abs(Number(x) - y) <= tolerancia;
  for (let i = 0; i < ahora.length; i++) {
    const a = antes[i];
    const b = ahora[i];
    if (!(cerca(a.inicio, b.inicio) && cerca(a.fin, b.fin))) {
      return { tipo: 'bordes', que: `el bloque ${i + 1} (toma ${b.linea}) iba de ${s2(a.inicio)} a ${s2(a.fin)} y ahora va de ${s2(b.inicio)} a ${s2(b.fin)}` };
    }
    for (const [campo, primero] of [['recorteInicio', 'toma'], ['desdeClip', 'segmento']]) {
      if (!Number.isFinite(a[campo])) continue;
      const hoy = cabezaDe(b, primero);
      if (!cerca(a[campo], hoy)) {
        return {
          tipo: 'bordes',
          que: `el bloque ${i + 1} (toma ${b.linea}) empezaba en el segundo ${s2(a[campo])} de su clip y ahora empieza en el ${s2(hoy)}`,
        };
      }
    }
  }
  return null;
}

/**
 * Plan de montaje de los ESTILOS HABLADOS (podcast, entrevista). Devuelve lo
 * mismo que planear() (bloques, avisos, brollUsados, brollFuera, finAudio) mas
 * `escena`. Lanza un Error (con <carpeta> en el texto) si falta lo que hace
 * falta para planear: el CLI lo muestra y sale.
 */
export function planearHablado({ manifiesto, dirVideo }) {
  const carpeta = path.dirname(dirVideo);
  const duracionClip = new Map();
  if (fs.existsSync(dirVideo)) {
    for (const f of fs.readdirSync(dirVideo)) {
      if (f.endsWith('.mp4')) duracionClip.set(f, dur(path.join(dirVideo, f)));
    }
  }
  const palabrasSub = palabrasConTiempo(carpeta);
  // Solo las medidas de los clips que hay hoy: una de otro clip (la toma se
  // regenero) cuenta como si faltara y cada estilo avisa con el comando.
  const { lineasHabladas, viejas: medidasViejas } = medidasVigentes(
    leerJsonSiExiste(path.join(carpeta, 'lineas-habladas.json')),
    dirVideo,
    duracionClip
  );
  const avisos = [];
  if (!palabrasSub) {
    avisos.push('Todavia no hay subtitulos.json: las frases ancla van estimadas. Despues de  node produccion/subtitulos-dialogo.js <carpeta>  vuelve a planear.');
  }

  let plan;
  if (manifiesto.estilo === 'podcast') {
    if (!lineasHabladas || !lineasHabladas.tomas) {
      throw new Error(
        'falta lineas-habladas.json: en podcast cada linea del guion sale de su clip y hay que medir donde empieza y termina cada una.\n' +
          '  Midelas primero (transcribe los clips, no genera nada):\n      npm run lineas -- <carpeta>'
      );
    }
    plan = planearPodcast({ manifiesto, carpeta, dirVideo, duracionClip, palabrasSub, lineasHabladas, medidasViejas, avisos });
  } else {
    plan = planearEntrevista({ manifiesto, carpeta, dirVideo, duracionClip, palabrasSub, lineasHabladas, medidasViejas, avisos });
  }

  // subtitulos.json de un plan anterior. Con los bordes por palabras o el
  // congelado, volver a planear corre la linea de tiempo, pero los subtitulos
  // (y lo que se ancla a ellos) siguen en los segundos del plan con el que se
  // hicieron. subtitulos-dialogo.js guarda esa linea de tiempo y aqui se
  // compara, en los dos estilos. Un subtitulos.json de antes, sin ella: en la
  // entrevista A queda la pista de siempre (palabras DENTRO del congelado, que
  // es donde la imagen esta quieta); en los demas, sin aviso.
  if (palabrasSub) {
    const subs = leerJsonSiExiste(path.join(carpeta, 'subtitulos.json'));
    const rehacer = 'Vuelve a correr  node produccion/subtitulos-dialogo.js <carpeta>  y despues  npm run plan.';
    if (Array.isArray(subs?.lineaDeTiempo)) {
      // Si cambiaron los bloques mismos (una toma entro o salio: una medida
      // que falta o es de otro clip, un clip regenerado) se dice eso, y no
      // "los bordes o el congelado", que no son la causa.
      const cambio = diferenciaDeLineaDeTiempo(subs.lineaDeTiempo, plan.bloques);
      if (cambio) {
        const que =
          cambio.tipo === 'bloques'
            ? `. Cambiaron los bloques del plan (una toma entro o salio, o cambiaron sus bordes): ${cambio.que}.`
            : ` (cambiaron los bordes o el congelado: ${cambio.que}).`;
        avisos.push(`OJO: subtitulos.json es de un plan anterior${que} Los subtitulos y todo lo que se ancla a sus palabras van corridos. ${rehacer}`);
      }
    } else {
      const c = plan.escena?.congelado;
      if (c && palabrasSub.some((w) => w.inicio > c.desde + 0.05 && w.inicio < c.desde + c.duracion - 0.05)) {
        avisos.push(
          `OJO: subtitulos.json es de un plan anterior (cambiaron los bordes o el congelado): tiene palabras entre ${c.desde.toFixed(2)}s y ` +
            `${(c.desde + c.duracion).toFixed(2)}s, donde la imagen esta congelada. Los subtitulos, los iconos y el check van corridos. ${rehacer}`
        );
      }
    }
  }

  // Revision del habla (`npm run lineas`): un clip hablado del montaje con
  // palabras repetidas, trabadas, cambiadas o agregadas entre la primera y la
  // ultima palabra del guion sale NO LIMPIO y se regenera. El plan lo repite
  // para que no pase de largo. Solo con la medida de ESE clip (las de otro
  // clip ya no estan en lineasHabladas). Una medida vigente de ANTES de la
  // revision (sin `limpio`: los anuncios medidos antes del 2026-10-14) se
  // revisa aca sobre las palabras que ya guardo, con la misma funcion que
  // --solo-plan de `npm run lineas` (revisionDeMedidaGuardada, con el aire
  // de los segmentos de este plan: lo que cae entre dos lineas donde el
  // montaje corta no cuenta): sin Scribe ni creditos, y el aviso dice que es
  // "segun la transcripcion guardada". Sin palabras guardadas no se puede:
  // queda "sin revisar", no "sucia". El porque: `motivo` si lo hay (no se
  // pudo ni comparar), si no lo agregado y lo omitido. Una repeticion
  // TOLERADA (una letra dicha dos veces, rapido y sin pausa: "a, a" en 0,18 s,
  // aprobada de oido, TOLERANCIA_REPETICION de lineas-habladas.js) no ensucia
  // el clip, pero se avisa igual, con su segundo: nunca pasa callada.
  if (lineasHabladas?.tomas) {
    const usadas = [...new Set(plan.bloques.filter((b) => b.tipo === 'H' && !b.toma?.problema).map((b) => b.linea))];
    for (const n of usadas) {
      const medida = lineasHabladas.tomas[String(n)];
      if (!medida || medida.reacciones) continue;
      const guardada = typeof medida.limpio !== 'boolean';
      const entrada = guardada
        ? revisionDeMedidaGuardada(manifiesto, n, medida, { margenSegmento: REGLAS_HABLADO.podcast.margenSeg })
        : medida;
      const toleradas = toleradasDe(entrada);
      if (toleradas.length) {
        plan.avisos.push(
          `toma ${n}${guardada ? ' (segun la transcripcion guardada)' : ''}: ${toleradas.map(describirTolerada).join('; ')}. ` +
            'No la marca NO ESTA LIMPIA: es la unica repeticion que se tolera.'
        );
      }
      if (!entrada || entrada.limpio !== false) continue;
      const motivo = typeof entrada.motivo === 'string' ? entrada.motivo.trim() : '';
      const que =
        motivo ||
        describirRevision({
          agregadas: Array.isArray(entrada.agregadas) ? entrada.agregadas : [],
          omitidas: Array.isArray(entrada.omitidas) ? entrada.omitidas : [],
        }) ||
        'lineas-habladas.json no dice por que: lo mas probable es que no se pudo comparar el guion con lo que se oye; escucha el clip';
      plan.avisos.push(
        guardada
          ? `toma ${n}: NO ESTA LIMPIA segun la transcripcion guardada (${que}). Su medida es de antes de la revision del habla: ` +
              'el plan la reviso sobre las palabras que ya tenia, sin creditos. Un clip hablado que no esta limpio se regenera: ' +
              `npm run rehacer -- <carpeta> --toma ${n} --contexto`
          : `toma ${n}: NO ESTA LIMPIA segun npm run lineas (${que}). Un clip hablado que no esta limpio se regenera: ` +
              `npm run rehacer -- <carpeta> --toma ${n} --contexto`
      );
    }
  }

  // Capa 0 encadenada en orden; las demas capas por capa y segundo. Es el
  // orden en que se leen, no cambia nada de lo que renderiza Remotion.
  plan.escena.piezas.sort((a, b) => ordenDePieza(a) - ordenDePieza(b) || a.desde - b.desde);
  return plan;
}

/**
 * Altura de cada bloque de subtitulo en los ESTILOS HABLADOS
 * (plan.subtitulos[i].desdeAbajo, en fraccion del alto; Anuncio.jsx la
 * dibuja). Devuelve una copia de `subtitulos` con el campo puesto donde va y
 * quitado donde no: sin el campo vale el del estilo (estiloSubtitulos, 0,26).
 *
 *   entrevista A  los bloques que EMPIEZAN antes del congelado van al medio
 *                 (subtitulosGancho): durante el gancho la cara esta abajo y
 *                 el subtitulo no la tapa. Desde el congelado, abajo.
 *   entrevista B  siempre abajo.
 *   podcast       los bloques con MAS de fraccionMinima de su tiempo dentro de
 *                 una ventana de B-roll suben (subtitulosEnBroll): en pantalla
 *                 dividida quedan en la union y en esquina por encima del host.
 *
 * Se calcula al final del plan, con los subtitulos ya leidos: por eso la
 * secuencia plan -> subtitulos -> plan deja las alturas bien en la segunda
 * pasada. Cualquier otro estilo no pasa por aqui.
 */
export function alturasDeSubtitulos(plan, subtitulos, manifiesto) {
  const copia = (subtitulos || []).map((b) => {
    const { desdeAbajo, ...resto } = b;
    return resto;
  });
  const piezas = plan?.escena?.piezas || [];
  if (manifiesto.estilo === 'entrevista') {
    const cfg = REGLAS_HABLADO.entrevista.subtitulosGancho;
    const c = plan?.escena?.variante === 'A' ? plan.escena.congelado : null;
    if (!c) return copia;
    return copia.map((b) => (b.inicio < c.desde ? { ...b, desdeAbajo: cfg.desdeAbajo } : b));
  }
  if (manifiesto.estilo === 'podcast') {
    const cfg = REGLAS_HABLADO.podcast.subtitulosEnBroll;
    // Las ventanas de B-roll, juntando las que se tocan (en dividida o en
    // esquina hay una pieza de B-roll por ventana, pero asi un solape nunca
    // cuenta dos veces).
    const ventanas = piezas
      .filter((p) => p.tipo === 'clip' && /^broll-/.test(String(p.archivo || '')))
      .map((p) => [p.desde, p.desde + p.duracion])
      .sort((a, b) => a[0] - b[0])
      .reduce((acc, [a, b]) => {
        const ult = acc[acc.length - 1];
        if (ult && a <= ult[1]) ult[1] = Math.max(ult[1], b);
        else acc.push([a, b]);
        return acc;
      }, []);
    return copia.map((b) => {
      const dura = b.fin - b.inicio;
      const dentro = ventanas.reduce((s, [a, z]) => s + Math.max(0, Math.min(b.fin, z) - Math.max(b.inicio, a)), 0);
      return dura > 0 && dentro / dura > cfg.fraccionMinima ? { ...b, desdeAbajo: cfg.desdeAbajo } : b;
    });
  }
  return copia;
}

/** Lineas de las dos tablas legibles de un plan hablado (bloques y escena). */
export function lineasTablaHablado(plan) {
  const L = [];
  const s2 = (x) => Number(x).toFixed(2);
  L.push('  Bloques (la linea de tiempo del audio, en orden):');
  L.push('  #    anuncio          clip       en el clip     dura    quien  texto');
  L.push('  ---  ---------------  ---------  -------------  ------  -----  ---------------------------');
  plan.bloques.forEach((b, i) => {
    const num = b.segmento ? String(b.segmento.orden) : String(i + 1);
    const enClip = b.toma.problema
      ? 'FALTA EL CLIP'
      : b.segmento
        ? `${s2(b.segmento.desdeClip)}-${s2(b.segmento.hastaClip)}`
        : `${s2(b.toma.recorteInicio ?? 0)}-${s2(b.toma.largoOriginal - (b.toma.recorteFin ?? 0))}`;
    const texto = String(b.texto || '').replace(/\s+/g, ' ');
    L.push(
      `  ${num.padStart(3)}  ${(s2(b.inicio) + '-' + s2(b.fin)).padEnd(15)}  ${b.toma.archivo.replace('.mp4', '').padEnd(9)}  ${enClip.padEnd(13)}  ${(s2(b.ventana) + 's').padStart(6)}  ${String(b.habla || '').padEnd(5)}  "${texto.length > 48 ? texto.slice(0, 45) + '...' : texto}"`
    );
  });
  L.push('');
  L.push('  Escena (lo que se ve y se oye encima, por capa):');
  L.push('  capa  tipo    desde    dura    que                         marco/detalle');
  L.push('  ----  ------  -------  ------  --------------------------  ----------------------------------------');
  for (const p of plan.escena.piezas) {
    const capa = p.tipo === 'sonido' ? '-' : p.tipo === 'icono' ? 'ico' : String(p.capa ?? '');
    const que = p.tipo === 'texto' ? `"${p.texto}"${p.flecha ? ' + flecha' : ''}` : p.archivo;
    const detalle =
      p.tipo === 'clip'
        ? `${p.marco}, entra en ${s2(p.recorteInicio)}s del clip` +
          (p.velocidad !== 1 ? `, ${s2(p.velocidad)}x` : '') +
          (p.mudo ? ', mudo' : Number.isFinite(p.volumenDb) ? `, con audio a ${p.volumenDb} dB` : ', con audio') +
          (p.congelarFinal ? ', congela el final' : '') +
          (p.fundidoEntrada ? `, fundido ${p.fundidoEntrada}s` : '')
        : p.tipo === 'imagen'
          ? p.efecto ? `efecto ${p.efecto}${p.variante ? ` (${p.variante})` : ''}` : `${p.marco}, ${p.lado}`
          : p.tipo === 'icono'
            ? // Con centroX/centroY (planes de ahora) se dice donde va; sin ellos,
              // la pila de antes (lado y fila).
              (p.producto ? 'producto, ' : '') +
              (p.centroX != null && p.centroY != null
                ? `${p.centroX === 0.5 ? 'al centro' : p.centroX < 0.5 ? 'a la izquierda' : 'a la derecha'} (x ${s2(p.centroX)}, y ${s2(p.centroY)}), ${p.sticker}`
                : `${p.lado}, fila ${p.fila}, ${p.sticker}`) +
              (p.check ? `, check${p.checkAbajo ? ' abajo' : ''} a ${s2(p.check.desde)}s` : '')
            : p.tipo === 'sonido'
              ? p.porque || ''
              : `capa ${p.capa}`;
    L.push(
      `  ${capa.padStart(4)}  ${p.tipo.padEnd(6)}  ${(s2(p.desde) + 's').padStart(7)}  ${(p.duracion !== undefined ? s2(p.duracion) + 's' : '').padStart(6)}  ${String(que).padEnd(26)}  ${detalle}`
    );
  }
  return L;
}

export function planear({ manifiesto, tiempos, dirVideo }) {
  // ESTILOS HABLADOS (podcast, entrevista): su propio plan, con `escena`. Un
  // manifiesto de cualquier otro estilo no pasa por aqui.
  if (ESTILOS_HABLADOS.includes(manifiesto.estilo)) return planearHablado({ manifiesto, dirVideo });

  // CONTINUIDAD: la cadena de clips tiene su propio plan. Sin el bloque en el
  // manifiesto, nada de esto corre.
  if (tieneContinuidad(manifiesto)) return planearMontajeContinuidad({ manifiesto, tiempos, dirVideo });

  // Duracion real de cada clip en disco, no la que pedimos al modelo.
  const duracionClip = new Map();
  for (const f of fs.readdirSync(dirVideo)) {
    if (f.endsWith('.mp4')) duracionClip.set(f, dur(path.join(dirVideo, f)));
  }

  const brollPorToma = new Map();
  for (const b of manifiesto.broll || []) brollPorToma.set(tomaDelBroll(b), b);

  if (manifiesto.modo_audio === 'dialogo_nativo') {
    return planearDialogoNativo({ manifiesto, dirVideo, duracionClip, brollPorToma });
  }

  const lineas = tiempos.lineas;
  const finAudio = tiempos.duracion;

  const bloques = [];
  const avisos = [];
  const brollUsados = new Set();

  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    const toma = manifiesto.tomas.find((t) => t.n === l.toma);

    // 1) La ventana va del inicio de esta linea al inicio de la siguiente,
    //    con lo que se lleva puesta la pausa que hay en medio.
    const inicio = l.inicio;
    const fin = i + 1 < lineas.length ? lineas[i + 1].inicio : finAudio;
    const ventana = Number((fin - inicio).toFixed(3));

    // 2) ¿Entra B-roll?
    const umbral = REGLAS.umbralBroll[toma.tipo] ?? REGLAS.umbralBroll.A;
    const broll = brollPorToma.get(toma.n);
    let duracionToma = ventana;
    let bloqueBroll = null;
    let motivoBroll;

    if (!broll) {
      motivoBroll = 'no hay B-roll para esta toma';
    } else if (ventana <= umbral) {
      motivoBroll = `ventana ${ventana.toFixed(2)}s <= ${umbral}s (tipo ${toma.tipo}): la toma aguanta sola`;
    } else {
      // La toma se lleva 2-2.5s y el B-roll llena el resto.
      let dToma = REGLAS.tomaConBroll.preferido;
      let dBroll = ventana - dToma;
      if (dBroll < REGLAS.brollMinimo) {
        dToma = REGLAS.tomaConBroll.minimo;
        dBroll = ventana - dToma;
      }
      if (dBroll < REGLAS.brollMinimo) {
        motivoBroll = `no cabe: quedarian ${dBroll.toFixed(2)}s de B-roll`;
      } else {
        duracionToma = Number(dToma.toFixed(3));
        bloqueBroll = { duracion: Number(dBroll.toFixed(3)) };
        motivoBroll = `ventana ${ventana.toFixed(2)}s > ${umbral}s (tipo ${toma.tipo})`;
      }
    }

    // 3) Como se ajusta el clip de la toma a su duracion asignada.
    const archivoToma = `toma-${toma.n}.mp4`;
    const largoToma = duracionClip.get(archivoToma);
    const ajusteToma = ajustar(toma.tipo, largoToma, duracionToma, `toma ${toma.n}`, avisos);

    const bloque = {
      linea: toma.n,
      texto: l.texto,
      inicio,
      fin: Number(fin.toFixed(3)),
      ventana,
      tipo: toma.tipo,
      toma: {
        archivo: archivoToma,
        largoOriginal: Number(largoToma.toFixed(3)),
        duracion: duracionToma,
        desde: inicio,
        ...ajusteToma,
      },
      motivoBroll,
    };

    if (bloqueBroll) {
      const archivoB = `broll-${broll.n}.mp4`;
      const largoB = duracionClip.get(archivoB);
      const ajusteB = ajustar('broll', largoB, bloqueBroll.duracion, `B-roll ${broll.n}`, avisos);
      bloque.broll = {
        n: broll.n,
        archivo: archivoB,
        sincroniza_con: broll.sincroniza_con,
        largoOriginal: Number(largoB.toFixed(3)),
        duracion: bloqueBroll.duracion,
        desde: Number((inicio + duracionToma).toFixed(3)),
        ...ajusteB,
      };
      brollUsados.add(broll.n);
    }

    bloques.push(bloque);
  }

  const brollFuera = (manifiesto.broll || []).filter((b) => !brollUsados.has(b.n)).map((b) => b.n);

  return { bloques, avisos, brollUsados: [...brollUsados], brollFuera, finAudio };
}

/**
 * Decide si el clip se acelera o se recorta, y avisa si no alcanza.
 *
 * En voz_en_off la regla sale del TIPO de toma:
 *   Tipo B      -> acelerar (cortarle la cola le quita la segunda accion)
 *   A, C, broll -> cortar desde el final (el primer frame es sagrado)
 *
 * En dialogo_nativo la regla sale de si el clip HABLA o no:
 *   toma principal -> nunca se acelera (deformaria la voz y rompe el lip-sync).
 *                     Lo resuelve planearDialogoNativo con metodo 'sin-ajuste';
 *                     aca solo queda la red de seguridad.
 *   B-roll         -> se acelera para entrar en su ventana. No tiene voz, no
 *                     hay nada que deformar, y el ritmo queda mas dinamico.
 */
function ajustar(tipo, largo, asignada, etiqueta, avisos, opciones = {}) {
  const dialogoNativo = opciones.modoAudio === 'dialogo_nativo';
  if (largo === undefined) {
    avisos.push(`${etiqueta}: no encuentro el clip en la carpeta video/`);
    return { metodo: 'falta el clip', velocidad: 1, recorte: 0, problema: true };
  }

  if (largo < asignada) {
    avisos.push(
      `${etiqueta}: el clip dura ${largo.toFixed(2)}s y la ventana pide ${asignada.toFixed(2)}s. Faltan ${(asignada - largo).toFixed(2)}s.`
    );
    return { metodo: 'clip mas corto que la ventana', velocidad: 1, recorte: 0, problema: true };
  }

  // En dialogo_nativo, un clip CON dialogo no se toca nunca.
  if (dialogoNativo && opciones.conDialogo) {
    return { metodo: 'sin-ajuste', velocidad: 1, recorte: 0, problema: false };
  }

  // Acelerar: las Tipo B de voz_en_off, y TODO el B-roll de dialogo_nativo.
  if (tipo === 'B' || (dialogoNativo && !opciones.conDialogo)) {
    // Acelerar, nunca cortar. En Tipo B cortarle la cola le quita la segunda accion;
    // en B-roll de dialogo_nativo acelerar es justo lo que da el ritmo.
    const velocidad = Number((largo / asignada).toFixed(3));
    const excedeTope = velocidad > REGLAS.velocidadMaxima;

    if (excedeTope) {
      // Aviso, no bloqueo: el plan se arma igual y el usuario decide.
      avisos.push(
        `${etiqueta} (${dialogoNativo ? 'B-roll sin dialogo' : 'Tipo B'}): va a ${velocidad.toFixed(2)}x, por encima de la guia de ${REGLAS.velocidadMaxima}x. ` +
          `Clip ${largo.toFixed(2)}s en una ventana de ${asignada.toFixed(2)}s. ` +
          'Sigue siendo acelerado, no cortado. Si no te convence: sube --velocidad-max, mete un B-roll, o regenera ese clip mas corto.'
      );
    }

    return {
      metodo: 'acelerar',
      velocidad,
      recorte: 0,
      problema: false,
      excedeTope,
      // Solo si hay umbral definido. Con null, ningun clip se silencia.
      audioDeformado:
        REGLAS.velocidadQueDeformaAudio !== null && velocidad >= REGLAS.velocidadQueDeformaAudio,
    };
  }

  // Tipo A, C y B-roll de voz_en_off: PRIMERO acelerar, DESPUES cortar lo que sobre.
  //
  // DECISION TOMADA (2026-09-06). Antes esta rama cortaba y nada mas, a
  // velocidad 1.0. Eso tira metraje ya pagado y corta la toma de golpe, sin
  // dejarle mostrar su arco. Es lo que se hacia a mano en CapCut: acelerar hasta
  // donde la imagen sigue viendose fluida, y recien ahi cortar el resto.
  //
  // Medido sobre el anuncio de zack-d: la toma 7 es un clip de 6.02s en una
  // ventana de 2.50s. Cortando y nada mas se veia el 42% del clip; acelerando a
  // 1.6x y cortando el resto se ve el 66%.
  //
  // El tope es REGLAS.velocidadMaxima, y aqui SI es un muro, no una guia: pasado
  // ese punto la imagen deja de verse fluida y es preferible cortar. En Tipo B
  // sigue siendo guia, porque ahi cortar la cola se lleva la segunda accion.
  const velocidadNecesaria = largo / asignada;
  const velocidad = Number(Math.min(velocidadNecesaria, REGLAS.velocidadMaxima).toFixed(3));
  const largoTrasAcelerar = largo / velocidad;
  const recorte = Number(Math.max(0, largoTrasAcelerar - asignada).toFixed(3));

  if (velocidad === 1) {
    // La ventana ya coincide con el clip: no hay nada que acelerar ni que cortar.
    return { metodo: 'sin ajuste', velocidad: 1, recorte: 0, problema: false };
  }

  return {
    metodo: recorte > 0 ? 'acelerar y cortar desde el final' : 'acelerar',
    velocidad,
    recorte,
    problema: false,
    // El primer frame es sagrado: el recorte siempre sale de la cola.
    audioDeformado:
      REGLAS.velocidadQueDeformaAudio !== null && velocidad >= REGLAS.velocidadQueDeformaAudio,
  };
}

// ---------------------------------------------------------------- CLI

/**
 * npm run plan -- <carpeta> --prediccion   (solo con continuidad)
 *
 * Las velocidades de la cadena ANTES de pagar los videos: el mismo reparto que
 * el plan, con los largos que se piden en el manifiesto en lugar de los clips
 * medidos. No escribe nada.
 */
function cliPrediccion(args) {
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/planear-montaje.js <carpeta-del-anuncio> --prediccion\n');
    process.exit(1);
  }
  const carpeta = path.resolve(carpetaArg);
  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  if (!tieneContinuidad(manifiesto)) {
    console.error(
      '\n  --prediccion es solo para anuncios con continuidad (el bloque "continuidad" del manifiesto).' +
        `\n  Este anuncio no lo trae: su plan es  npm run plan -- ${carpetaArg}\n`
    );
    process.exit(1);
  }
  const rutaTiempos = path.join(carpeta, 'audio', 'tiempos.json');
  if (!fs.existsSync(rutaTiempos)) {
    console.error(`\n  Falta ${rutaTiempos}: la prediccion sale de los tiempos reales de la voz.\n  Genera primero la voz:\n      npm run audio -- ${carpetaArg}\n`);
    process.exit(1);
  }
  const tiempos = JSON.parse(fs.readFileSync(rutaTiempos, 'utf8'));
  let pred;
  try {
    pred = planearMontajeContinuidad({ manifiesto, tiempos, dirVideo: path.join(carpeta, 'video'), prediccion: true }).continuidad;
  } catch (e) {
    console.error(`\n  No se pudo hacer la prediccion: ${e.message.replace(/<carpeta>/g, carpetaArg)}\n`);
    process.exit(1);
  }
  const descartado = manifiesto.continuidad?.broll_descartado;
  const estimados = pred.clips.filter((x) => x.estimado).map((x) => x.archivo.replace('.mp4', ''));

  console.log(`\n=== Prediccion de velocidades (continuidad) — ${path.basename(carpeta)} ===\n`);
  console.log(`  Con el largo que se pide de cada clip, sobre los tiempos reales de la voz (${tiempos.duracion.toFixed(2)}s). No escribe nada.`);
  if (estimados.length) {
    console.log(`  Todavia sin duracion en el manifiesto (van con la que propondria --duraciones): ${estimados.join(', ')}`);
  }
  console.log('');
  const tabla = lineasTablaContinuidad(pred, {
    brollGuardados: Array.isArray(descartado) ? descartado.length : null,
    hayTransiciones: fs.existsSync(path.join(carpeta, 'transiciones.json')),
  });
  for (const l of tabla) console.log(l);
  if (pred.avisos.length) {
    console.log(`\n  --- ${pred.avisos.length} AVISO(S) ---\n`);
    for (const a of pred.avisos) console.log(`  !  ${a}`);
  }
  console.log('\n  No se escribio nada. Con los videos generados, el plan de verdad mide cada clip:');
  console.log(`      npm run plan -- ${carpetaArg}\n`);
}

const esCli = Boolean(process.argv[1] && process.argv[1].endsWith('planear-montaje.js'));

if (esCli && process.argv.slice(2).includes('--prediccion')) {
  cliPrediccion(process.argv.slice(2));
} else if (esCli) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  const iv = args.indexOf('--velocidad-max');
  if (iv !== -1 && args[iv + 1]) REGLAS.velocidadMaxima = Number(args[iv + 1]);
  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/planear-montaje.js <carpeta-del-anuncio>\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  const rutaTiempos = path.join(carpeta, 'audio', 'tiempos.json');
  const esDialogoNativo = manifiesto.modo_audio === 'dialogo_nativo';

  // En dialogo_nativo no hay pista de voz que medir: el personaje habla
  // dentro del clip. generar-audio.js ni siquiera corre en este modo.
  //
  // En musica SI hace falta tiempos.json, pero no lo escribe ElevenLabs: lo
  // escribe tiempos-cancion.js a partir de la letra con tiempos de Suno. La
  // forma del archivo es la misma, por eso de aqui para abajo no hay ninguna
  // rama nueva.
  if (!esDialogoNativo && !fs.existsSync(rutaTiempos)) {
    const comoGenerarlo =
      manifiesto.modo_audio === 'musica'
        ? `Sacalos de la cancion:\n      npm run tiempos -- ${carpetaArg}`
        : `Genera primero la voz:\n      npm run audio -- ${carpetaArg}`;
    console.error(`\n  Falta ${rutaTiempos}. ${comoGenerarlo}\n`);
    process.exit(1);
  }

  const tiempos = fs.existsSync(rutaTiempos) ? JSON.parse(fs.readFileSync(rutaTiempos, 'utf8')) : null;
  const dirVideo = path.join(carpeta, 'video');
  // CONTINUIDAD (el manifiesto trae el bloque): una cadena de clips seguidos,
  // sin B-roll ni transiciones. Todo lo que sigue tiene su rama marcada con
  // `cont`; sin el bloque, el plan sale exactamente como siempre.
  const cont = tieneContinuidad(manifiesto);
  // ESTILOS HABLADOS (podcast, entrevista): plan con `escena`, sin musica ni
  // transiciones del editor. Todo lo que sigue tiene su rama marcada con
  // `hablado`; en los demas estilos el plan sale exactamente como siempre.
  const hablado = ESTILOS_HABLADOS.includes(manifiesto.estilo);
  const planearContinuidadOSalir = () => {
    try {
      return planear({ manifiesto, tiempos, dirVideo });
    } catch (e) {
      console.error(`\n  No se pudo planear la continuidad: ${e.message.replace(/<carpeta>/g, carpetaArg)}\n`);
      process.exit(1);
    }
  };
  const planearHabladoOSalir = () => {
    try {
      return planear({ manifiesto, tiempos, dirVideo });
    } catch (e) {
      console.error(`\n  No se pudo planear el montaje: ${e.message.replace(/<carpeta>/g, carpetaArg)}\n`);
      process.exit(1);
    }
  };
  const plan = cont ? planearContinuidadOSalir() : hablado ? planearHabladoOSalir() : planear({ manifiesto, tiempos, dirVideo });
  if (cont && iv !== -1) {
    plan.avisos.push(
      '--velocidad-max no aplica con continuidad: ahi no hay muro (nunca se corta) y la guia es de ' +
        `${plan.continuidad.reglas.guia}x. Se ignora.`
    );
  }

  console.log(`\n=== Plan de montaje — ${path.basename(carpeta)} ===\n`);
  console.log(
    `  Duracion final: ${plan.finAudio.toFixed(2)}s ` +
      (esDialogoNativo
        ? '(la suma de los clips ya recortados; aca manda el clip)'
        : '(la del audio; el video se adapta)') +
      '\n'
  );

  if (cont) {
    const descartado = manifiesto.continuidad?.broll_descartado;
    console.log(
      `  Continuidad: ${plan.continuidad.clips.length} clips seguidos, de una imagen a la siguiente. ` +
        'Sin B-roll ni transiciones del editor.\n'
    );
    const tabla = lineasTablaContinuidad(plan.continuidad, {
      brollGuardados: Array.isArray(descartado) ? descartado.length : null,
      hayTransiciones: fs.existsSync(path.join(carpeta, 'transiciones.json')),
    });
    for (const l of tabla) console.log(l);
  } else if (hablado) {
    const e = plan.escena;
    console.log(
      manifiesto.estilo === 'podcast'
        ? `  Podcast: ${plan.bloques.length} lineas de la conversacion en el orden del guion, B-roll en modo ${e.modoBroll}. Sin musica ni transiciones del editor.\n`
        : `  Entrevista, variante ${e.variante}: ${plan.bloques.length} clips en fila` +
            (e.congelado ? `, congelado con golpe${e.congelado.variante ? ` (${e.congelado.variante})` : ''} despues de la toma ${e.congelado.tomaAntes}` : '') +
            (e.cierre ? `, B-roll de cierre con el CTA` : '') +
            '. Sin musica ni transiciones del editor.\n'
    );
    for (const l of lineasTablaHablado(plan)) console.log(l);
  } else {

  console.log('  lin  ventana        tipo  clip           dura   ajuste              B-roll');
  console.log('  ---  -------------  ----  -------------  -----  ------------------  ------------------');

  for (const b of plan.bloques) {
    const ventana = `${b.inicio.toFixed(2)}-${b.fin.toFixed(2)}`;
    const aj =
      b.toma.metodo === 'acelerar'
        ? `${b.toma.velocidad.toFixed(2)}x${b.toma.excedeTope ? ' (sobre guia)' : ''}`
        : b.toma.metodo === 'sin-ajuste'
          ? `bordes -${(b.toma.recorteInicio ?? 0).toFixed(2)}/-${(b.toma.recorteFin ?? 0).toFixed(2)}s`
          : b.toma.metodo === 'falta el clip'
            ? 'FALTA EL CLIP'
            : b.toma.metodo === 'acelerar y cortar desde el final'
              ? // Las dos cosas a la vez: la velocidad importa tanto como el recorte,
                // y mostrando solo el recorte parecia que el clip iba a 1.0x.
                `${b.toma.velocidad.toFixed(2)}x y -${b.toma.recorte.toFixed(2)}s`
              : `-${b.toma.recorte.toFixed(2)}s del final`;
    const br = b.broll
      ? `${b.broll.archivo.replace('.mp4', '')} ${b.broll.duracion.toFixed(2)}s`
      : '—';
    console.log(
      `  ${String(b.linea).padStart(3)}  ${ventana.padEnd(13)}  ${b.tipo.padEnd(4)}  ${b.toma.archivo.replace('.mp4', '').padEnd(13)}  ${b.toma.duracion.toFixed(2)}s  ${aj.padEnd(18)}  ${br}`
    );
  }

  } // fin de la rama "sin continuidad" (la tabla de siempre)

  // Los estilos con pista fija que pone el motor (hoy solo estilo-lego): si
  // musica/ esta vacia porque no se corrio `npm run musica`, se copia aca, sin
  // Suno y sin costo, para que el plan no salga nunca sin musica. Los demas
  // estilos no estan en la tabla y copiarPistaFija no hace nada.
  //
  // Los estilos hablados (podcast, entrevista) van SIN musica por decision
  // del estilo: ni se busca pista, ni se copia una fija, ni se avisa.
  const copiaFija =
    manifiesto.modo_audio !== 'musica' && !hablado ? copiarPistaFija(carpeta, manifiesto.estilo) : null;
  const fijaCopiada = Boolean(copiaFija?.destino);
  if (copiaFija?.falta) {
    plan.avisos.push(
      `Falta la pista fija del estilo (${copiaFija.falta}): el anuncio sale sin musica. ` +
        'Vuelve a ponerla ahi (recursos/musica/LEEME.md dice como se prepara) y planea de nuevo.'
    );
  }

  const pista = hablado ? null : buscarMusica(carpeta, manifiesto.estilo);
  const duracionPista = pista ? dur(path.join(carpeta, pista)) : null;

  // Subtitulos, si ya se generaron. Tambien son opcionales.
  const rutaSubs = path.join(carpeta, 'subtitulos.json');
  const subtitulosLeidos = fs.existsSync(rutaSubs)
    ? JSON.parse(fs.readFileSync(rutaSubs, 'utf8')).bloques
    : [];
  // Estilos hablados: la altura de cada bloque (al medio en el gancho de la
  // entrevista A y durante el B-roll del podcast). Los demas, tal cual.
  const subtitulos = hablado ? alturasDeSubtitulos(plan, subtitulosLeidos, manifiesto) : subtitulosLeidos;
  if (hablado) {
    const subidos = subtitulos.filter((b) => b.desdeAbajo !== undefined).length;
    if (subidos) {
      console.log(
        `\n  Subtitulos: ${subidos} de ${subtitulos.length} bloques mas arriba (desdeAbajo ${subtitulos.find((b) => b.desdeAbajo !== undefined).desdeAbajo}), ` +
          (manifiesto.estilo === 'podcast' ? 'los que caen sobre un B-roll.' : 'los del gancho, hasta el congelado.')
      );
    }
  }
  const payoff = pista ? inicioDelPayoff(manifiesto, plan.bloques) : null;
  const mezcla = mezclaPara(manifiesto.modo_audio, manifiesto.estilo);

  // Nivel MEDIDO, solo en los estilos que lo declaran (MUSICA_POR_ESTILO).
  // Se mide la pista que va a sonar, sea la fija, la del usuario o la de Suno,
  // en lo que suena de ella: de 0 al final del anuncio, o entera si es mas
  // corta y va en loop.
  let nivelMedido = null;
  if (pista && mezcla.musica.nivelMedido && manifiesto.modo_audio !== 'musica') {
    const { rmsObjetivoDb, minDb, maxDb } = mezcla.musica.nivelMedido;
    const hastaSeg = Number(Math.min(duracionPista ?? plan.finAudio, plan.finAudio).toFixed(3));
    const rms = rmsDePista(path.join(carpeta, pista), hastaSeg);
    if (rms === null) {
      plan.avisos.push(
        `No se pudo medir el nivel de ${pista}: la musica queda en ${mezcla.musica.db} dB, ` +
          'el del anuncio aprobado del estilo. Para probar otro: node produccion/ensamblar.js <carpeta> --musica-db N'
      );
    } else {
      const calculado = rmsObjetivoDb - rms;
      const db = Number(Math.min(maxDb, Math.max(minDb, calculado)).toFixed(1));
      mezcla.musica.db = db;
      nivelMedido = { rmsDb: Number(rms.toFixed(2)), hastaSeg, rmsObjetivoDb };
      if (Math.abs(db - calculado) > 0.05) {
        nivelMedido.calculadoDb = Number(calculado.toFixed(1));
        plan.avisos.push(
          `La musica pedia ${calculado.toFixed(1)} dB para quedar donde el anuncio aprobado y se dejo ` +
            `en ${db} dB (tope ${minDb}/${maxDb}). Escuchala; si hace falta: --musica-db N en ensamblar.js`
        );
      }
    }
  }

  if (manifiesto.modo_audio === 'musica') {
    // El anuncio musical no lleva pista de fondo, y ofrecerle una seria un
    // error: la cancion ya ocupa ese lugar y una cama por debajo la ensucia.
    console.log('\n  Cancion (pista maestra):');
    console.log(`    audio/cancion.mp3  a 0 dB, entera y sin cortes`);
    console.log(`    el ambiente de los clips va ${mezcla.duckingDb} dB por debajo`);
    console.log('    sin musica de fondo: en este modo la cancion ES el audio del anuncio');
    if (pista) {
      console.log(`\n    AVISO: hay una pista suelta en ${pista} y en modo musica no deberia ir.`);
      console.log('    Sacala de la carpeta musica/ o el anuncio saldra con dos audios encimados.');
    }
  } else if (hablado) {
    console.log('\n  Musica de fondo: ninguna. Este estilo va sin musica (decision del estilo), solo las voces de los clips.');
  } else {

  console.log('\n  Musica de fondo:');
  if (pista) {
    const debajoDe = manifiesto.modo_audio === 'dialogo_nativo'
      ? 'debajo del dialogo del clip'
      : 'debajo de la voz y del ambiente';
    console.log(`    ${pista}  a ${mezcla.musica.db} dB, ${debajoDe}`);
    if (fijaCopiada) {
      console.log(`    (la copio el motor: pista fija del estilo "${manifiesto.estilo}", sin Suno y sin costo)`);
    }
    if (nivelMedido) {
      console.log(
        `    nivel medido: la pista da ${nivelMedido.rmsDb.toFixed(2)} dB RMS de 0 a ${nivelMedido.hastaSeg.toFixed(1)}s` +
          ` -> ${mezcla.musica.db} dB para quedar en ${nivelMedido.rmsObjetivoDb} dB, como el anuncio aprobado del estilo`
      );
    }
    if (manifiesto.modo_audio === 'dialogo_nativo') {
      console.log('    (dialogo_nativo: el clip es la voz y va a 0 dB, sin ducking)');
    }
    if (mezcla.musica.subeEnPayoffDb === 0) {
      console.log('    sin subida en el payoff: pareja de principio a fin (decision del estilo)');
    } else if (payoff !== null) {
      const esUltima = plan.bloques.length > 1 && Math.abs(payoff - plan.bloques[plan.bloques.length - 1].inicio) < 0.01;
      const porQue = esUltima
        ? 'arranque de la ultima toma: el CTA'
        : 'primera toma con producto: el giro';
      console.log(`    sube ${mezcla.musica.subeEnPayoffDb} dB desde ${payoff.toFixed(2)}s (${porQue})`);
    }
    console.log(`    fade in ${mezcla.musica.fadeInSeg}s / fade out ${mezcla.musica.fadeOutSeg}s`);
    if (duracionPista !== null) {
      const corta = duracionPista < plan.finAudio - 0.2;
      console.log(`    pista de ${duracionPista.toFixed(1)}s para un anuncio de ${plan.finAudio.toFixed(1)}s` + (corta ? ' -> se repite en loop' : ''));
    }
  } else {
    console.log('    sin pista. El anuncio se arma igual (paso opcional).');
    console.log('    Para generar una:  npm run musica -- <carpeta>');
    console.log('    O deja la tuya en la subcarpeta musica/');
  }

  } // fin de la rama "no es musica"

  // En continuidad no hay B-roll (la tabla ya dice cuantos quedaron guardados)
  // y las velocidades ya van en la tabla.
  if (!cont) {
  console.log(`\n  B-roll que entran (${plan.brollUsados.length}): ${plan.brollUsados.join(', ') || 'ninguno'}`);
  console.log(`  B-roll que quedan fuera (${plan.brollFuera.length}): ${plan.brollFuera.join(', ') || 'ninguno'}`);

  // Cuenta por velocidad, no por nombre de metodo: hay dos metodos que
  // aceleran ("acelerar" y "acelerar y cortar desde el final") y filtrar por el
  // primero dejaba el contador en 0 en anuncios donde TODAS las tomas aceleran.
  //
  // En los estilos hablados las tomas nunca se aceleran; lo que puede ir a
  // otra velocidad son los B-roll de la escena, y esa cuenta sale de ahi.
  const acelerados = hablado
    ? plan.escena.piezas.filter((p) => p.tipo === 'clip' && (p.velocidad || 1) !== 1)
    : plan.bloques.filter((b) => (b.toma.velocidad || 1) > 1);
  const conAudioRaro = hablado ? [] : plan.bloques.filter((b) => b.toma.audioDeformado);
  console.log(`\n  ${hablado ? 'B-roll a otra velocidad' : 'Clips acelerados'}: ${acelerados.length}`);
  if (conAudioRaro.length) {
    console.log(`  De esos, ${conAudioRaro.length} pasan de ${REGLAS.velocidadQueDeformaAudio}x: su ambiente se va a oir agudo.`);
    console.log(`      ${conAudioRaro.map((b) => b.toma.archivo.replace('.mp4', '')).join(', ')}`);
  }
  } // fin de la rama "sin continuidad" (B-roll y acelerados)

  // TODOS los clips mudos, por decision del estilo. Lo declara el manifiesto
  // con `"clips_mudos": true` (historias musicales, decision del estilo del
  // 2026-09-14: en ese estilo el unico audio es la cancion; ni ambiente ni
  // efectos de los clips). Es distinto de silenciar.json, que apaga clips
  // sueltos por voz colada: aqui no hay nada que revisar, se apagan todos.
  // Los otros estilos no lo declaran y siguen igual.
  if (manifiesto.clips_mudos === true && cont) {
    // Continuidad: se marcan los clips de la cadena (es la lista que monta Remotion).
    for (const c of plan.continuidad.clips) c.mudo = true;
    console.log(`\n  --- clips_mudos: los ${plan.continuidad.clips.length} clips van MUDOS (decision del estilo, no una perdida) ---`);
  } else if (manifiesto.clips_mudos === true) {
    for (const b of plan.bloques) {
      b.toma.audioDeformado = true;
      if (b.broll) b.broll.mudo = true;
    }
    console.log(`\n  --- clips_mudos: los ${plan.bloques.length} clips van MUDOS (decision del estilo, no una perdida) ---`);
  }

  // Clips que hay que montar MUDOS porque traen una voz colada — una frase que
  // nadie escribio, que el modelo mete por su cuenta. La lista la escribe
  // `npm run voces:revisar -- <carpeta> --silenciar` y vive en el anuncio, no
  // en el plan: asi sobrevive a que se vuelva a planear.
  //
  // Silenciar deja la imagen intacta y no cuesta creditos. Se pierde el
  // ambiente de esa toma, y por eso se avisa aqui: es una perdida real y hay
  // que reportarla al usuario.
  const rutaSilenciar = path.join(carpeta, 'silenciar.json');
  if (fs.existsSync(rutaSilenciar) && manifiesto.clips_mudos !== true) {
    let lista = [];
    try {
      lista = JSON.parse(fs.readFileSync(rutaSilenciar, 'utf8')).clips || [];
    } catch (e) {
      plan.avisos.push(`silenciar.json no es JSON valido (${e.message}). Se ignora.`);
    }
    const mudos = new Set(lista);
    const aplicados = [];
    if (hablado) {
      // Estilos hablados: lo que suena son las piezas de la escena (los
      // clips con mudo: false), no los bloques.
      for (const p of plan.escena.piezas) {
        if (p.tipo === 'clip' && !p.mudo && mudos.has(p.archivo)) {
          p.mudo = true;
          if (!aplicados.includes(p.archivo)) aplicados.push(p.archivo);
        }
      }
    } else if (cont) {
      // Continuidad: los clips de la cadena (pasos, propios B y cierre). Un
      // toma-K.mp4 viejo de una toma A ya no entra: sale en el aviso de abajo.
      for (const c of plan.continuidad.clips) {
        if (mudos.has(c.archivo)) {
          c.mudo = true;
          aplicados.push(c.archivo);
        }
      }
    } else {
    for (const b of plan.bloques) {
      if (mudos.has(b.toma.archivo)) {
        b.toma.audioDeformado = true;
        aplicados.push(b.toma.archivo);
      }
      if (b.broll && mudos.has(b.broll.archivo)) {
        b.broll.mudo = true;
        aplicados.push(b.broll.archivo);
      }
    }
    }
    if (aplicados.length) {
      console.log(`\n  --- ${aplicados.length} clip(s) van MUDOS por voz colada ---\n`);
      for (const a of aplicados) console.log(`  x  ${a.replace('.mp4', '')}  (se pierde su ambiente)`);
    }
    const sinUsar = lista.filter((c) => !aplicados.includes(c));
    if (sinUsar.length) {
      plan.avisos.push(
        `silenciar.json nombra ${sinUsar.join(', ')}, que no estan en el montaje. Revisa los nombres.`
      );
    }
  }

  if (plan.avisos.length) {
    console.log(`\n  --- ${plan.avisos.length} AVISO(S) — ninguno detiene el montaje ---\n`);
    for (const a of plan.avisos) console.log(`  !  ${a}`);
  }

  // En continuidad no hay transiciones del editor: el paso entre escenas lo
  // hace cada clip. transiciones.json, si existe, se ignora (lo dice la tabla).
  // En los estilos hablados tampoco: el fundido lo decide el estilo (escena) y
  // transiciones.json, si existe, no se lee.
  const transiciones = cont || hablado ? [] : resolverTransiciones(carpeta, plan.bloques, plan.avisos);
  if (transiciones.length) {
    console.log(`\n  --- ${transiciones.length} transicion(es) de entrada ---\n`);
    for (const t of transiciones) {
      console.log(
        `  ${String(t.desde.toFixed(2)).padStart(6)}s  toma ${String(t.toma).padStart(2)}  ` +
          `${t.animacion.padEnd(20)} ${t.efecto || '(sin sonido)'}${t.porque ? '   — ' + t.porque : ''}`
      );
    }
  }

  const salida = path.join(carpeta, 'plan-montaje.json');
  fs.writeFileSync(
    salida,
    JSON.stringify(
      {
        generado: new Date().toISOString(),
        aprobado: false,
        duracion: plan.finAudio,
        // Estilos hablados: sus reglas (podcast, entrevista) van en el plan
        // junto a las de siempre. Los demas estilos escriben REGLAS tal cual.
        reglas: hablado ? { ...REGLAS, ...REGLAS_HABLADO } : REGLAS,
        // La pista maestra del anuncio, la que va a 0 dB y manda sobre todo lo
        // demas. Cambia de archivo segun el modo:
        //   voz_en_off      audio/voz.mp3      la narracion de ElevenLabs
        //   musica          audio/cancion.mp3  la cancion cantada de Suno
        //   dialogo_nativo  null               no hay: la voz vive en el clip
        //
        // La cancion va AQUI y no en `musica` a proposito: `musica` es la capa
        // que la version sin musica apaga, y apagar la cancion dejaria el
        // anuncio mudo. La cancion no es una capa de arreglo, es el contenido.
        audio: {
          voz:
            manifiesto.modo_audio === 'dialogo_nativo'
              ? null
              : manifiesto.modo_audio === 'musica'
                ? 'audio/cancion.mp3'
                : 'audio/voz.mp3',
          ducking: mezcla.duckingDb,
          fadeMs: REGLAS.fadeAudioMs,
        },
        musica: pista
          ? {
              archivo: pista,
              db: mezcla.musica.db,
              subeEnPayoffDb: mezcla.musica.subeEnPayoffDb,
              payoffDesdeSeg: payoff,
              fadeInSeg: mezcla.musica.fadeInSeg,
              fadeOutSeg: mezcla.musica.fadeOutSeg,
              // Si la pista es mas corta que el anuncio se repite. Suno no
              // siempre respeta la duracion pedida, asi que esto pasa seguido.
              loop: duracionPista !== null && duracionPista < plan.finAudio - 0.2,
              duracionPista,
              // Solo en los estilos de nivel medido: de donde salio `db`.
              ...(nivelMedido ? { nivelMedido } : {}),
            }
          : null,
        bloques: plan.bloques,
        // Solo en los estilos hablados: las capas de video que renderiza
        // Remotion (clips, congelado, iconos, sticker, texto del CTA, sonidos).
        // Los bloques de arriba son la linea de tiempo del audio.
        ...(hablado ? { escena: plan.escena } : {}),
        // Solo con continuidad: la cadena de clips que monta Remotion, en
        // orden, con su segundo de entrada (desde), de salida (hasta) y su
        // velocidad. Nunca se corta: recorte 0 en todos. Los bloques de
        // arriba quedan uno por linea, sin `toma`, para subtitulos y payoff.
        ...(cont
          ? {
              continuidad: {
                reglas: plan.continuidad.reglas,
                velocidadMaximaPosible: plan.continuidad.velocidadMaximaPosible,
                tope: plan.continuidad.tope,
                sinSolucion: plan.continuidad.sinSolucion,
                velocidadMaxima: Number(plan.continuidad.velocidadMaxima.toFixed(3)),
                resumen: plan.continuidad.resumen,
                unidades: plan.continuidad.unidades,
                clips: plan.continuidad.clips,
              },
            }
          : {}),
        subtitulos,
        estiloSubtitulos: {
          ...REGLAS.subtitulos,
          colorResaltado: colorDeResaltado(carpeta, REGLAS.subtitulos.coloresResaltado),
        },
        transiciones,
        reglasTransiciones: REGLAS.transiciones,
        brollFuera: plan.brollFuera,
        avisos: plan.avisos,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  console.log(`\n  Plan guardado en ${salida}`);
  console.log('  Marcado como "aprobado": false. Nada se renderiza hasta que lo revises.\n');
}
