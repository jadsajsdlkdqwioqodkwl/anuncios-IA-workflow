// Las capas de VIDEO de los estilos hablados (podcast, entrevista): plan.escena.piezas.
//
// Solo entra cuando el plan trae `escena` (lo escribe planear-montaje.js para
// estos dos estilos). Lo de siempre —piezasDeBloques, piezasDeContinuidad, Clip—
// vive en Anuncio.jsx y no se toca: un plan sin `escena` no pasa por aqui.
//
// En estos estilos la linea de tiempo del AUDIO son los bloques (lo hablado) y la
// del VIDEO son estas piezas: un clip puede sonar sin verse (marco "oculto"), verse
// sin sonar (copia muda en media pantalla o en una esquina) o ser una imagen, un
// icono, un rotulo o un sonido suelto. Cada tipo se dibuja aqui.

import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  Img,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { useLayoutEffect, useState } from 'react';

// Misma cuenta que en Anuncio.jsx. Se repite aqui (una linea) para no importar de
// Anuncio.jsx, que importa este archivo: un ciclo de imports por una formula no vale.
const dbALineal = (db) => Math.pow(10, db / 20);
const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

// Medidas de REGLAS_HABLADO en planear-montaje.js (REGLAS.podcast / REGLAS.entrevista). El plan las
// trae en `reglas` para que queden escritas en el anuncio; esto es solo el
// respaldo si un plan viejo no las tuviera. Todas son fracciones del ANCHO.
const ESQUINA = { ancho: 0.4, margen: 0.04, radio: 0.04 };
const ICONO_ANCHO = 0.22;
const STICKER_ANCHO = 0.28;

// Duraciones fijas de las animaciones (segundos). Son de gusto, no de contrato,
// salvo las que el contrato nombra: golpe 0.25 s de escala y 0.3 s de destello,
// icono 0.3 s de pop y 0.2 s de salida.
const GOLPE = { escalaSeg: 0.25, escalaHasta: 1.08, destelloSeg: 0.3, sacudidaFrames: 3 };
const ICONO = { popSeg: 0.3, salidaSeg: 0.2 };
const STICKER = { popSeg: 0.3, salidaSeg: 0.2 };
const TEXTO = { entradaSeg: 0.17, rebotePeriodoSeg: 0.9 };
// Push-in del congelado: lo que falta de pieza se cubre con el ultimo fotograma
// creciendo despacio hasta aqui, para que no se sienta una foto pegada.
const CONGELADO_PUSH_IN = 1.06;

const capaDe = (p) => p.capa ?? (p.tipo === 'clip' ? 0 : 3);

/**
 * Convierte las piezas de plan.escena a fotogramas, UNA sola vez (7.2 y 8).
 *
 * - Capa 0: encadenada igual que piezasDeBloques: el final de una pieza ES el
 *   inicio de la siguiente, la primera arranca en 0 y la ultima llega al final de
 *   la composicion. Ni huecos ni solapes, caiga como caiga cada redondeo (la
 *   razon larga esta en piezasDeBloques; aqui vale la misma).
 * - Disolvencia (entrevista B): si la siguiente de capa 0 trae `fundidoEntrada`, esta se
 *   alarga ese tanto para que haya imagen debajo mientras la siguiente se va
 *   haciendo opaca. El audio NO se alarga: ClipEscena corta el sonido en el
 *   corte limpio (`solapeFrames`), como piden los bloques. La pieza que entra
 *   se dibuja mientras dura el fundido en una capa por encima de todos los
 *   clips (su "doble", ver abajo): en la entrevista A la cadena de B-roll de
 *   capa 1 taparia el fundido del B-roll de cierre, que va en capa 0.
 * - Demas capas: inicio = round(desde), final = round(desde + duracion) o, si
 *   otra pieza de la misma capa arranca justo ahi, el inicio de esa (encadenado
 *   en fotogramas, como la capa 0); recortadas para no pasar del final.
 * - Sonidos: solo `desde`; suenan enteros.
 *
 * Devuelve las piezas ordenadas por capa y por inicio: ese orden es el orden de
 * dibujo (lo de despues tapa lo de antes), y los sonidos van al final.
 */
export const piezasDeEscena = (piezas, fps, durationInFrames) => {
  const aFrames = (seg) => Math.round((seg || 0) * fps);
  const visuales = piezas.filter((p) => p.tipo !== 'sonido');

  const base = visuales.filter((p) => capaDe(p) === 0).sort((a, b) => a.desde - b.desde);
  const inicios = base.map((p) => aFrames(p.desde));
  if (inicios.length) inicios[0] = 0;

  const salida = [];
  base.forEach((p, i) => {
    const desdeFrames = inicios[i];
    const siguiente = i + 1 < base.length ? base[i + 1] : null;
    const solapeFrames = siguiente ? aFrames(siguiente.fundidoEntrada) : 0;
    const hastaLimpio = siguiente ? inicios[i + 1] : durationInFrames;
    const hasta = Math.min(durationInFrames, hastaLimpio + solapeFrames);
    salida.push({
      ...p,
      capa: 0,
      desdeFrames,
      largoFrames: Math.max(1, hasta - desdeFrames),
      // Lo que esta pieza se alarga por la disolvencia de la siguiente: imagen si,
      // sonido no.
      solapeFrames: Math.max(0, hasta - hastaLimpio),
      fundidoFrames: aFrames(p.fundidoEntrada),
    });
  });

  // DEMAS CAPAS: EL FINAL TAMBIEN SE REDONDEA UNA SOLA VEZ, Y ENCADENADO.
  //
  // La primera version hacia `aFrames(p.desde)` y `aFrames(p.duracion)` por
  // separado: dos redondeos independientes, justo lo que piezasDeBloques
  // prohibe. En la entrevista A la cadena de B-roll de capa 1 viene encadenada
  // en segundos (hasta del k = desde del k+1), y cuando ese borde cae en .5 de
  // fotograma quedaba UN fotograma sin nadie; como debajo la capa 0 es un clip
  // `oculto` (solo suena), ese fotograma salia NEGRO. Medido el 2026-10-13 en
  // temp/prueba-entrevista-a-seco: broll-2 desde 16.338 + 3.412 -> 490..591 y
  // broll-3 desde 19.75 -> 593; el 592 (19.733 s) negro. Y en
  // temp/prueba-montaje-seco-a: broll-2 440..585, broll-3 desde 587; el 586 negro.
  //
  // Ahora el final de una pieza es round(desde + duracion), y si otra pieza de
  // la MISMA capa arranca justo donde esta termina (en segundos, con medio
  // fotograma de tolerancia: el plan escribe desde y duracion a milesimas y la
  // suma no da exacta), el final ES el inicio en fotogramas de esa siguiente,
  // como en la capa 0. Las que no se tocan (iconos con aire entre medio, dos
  // iconos a la vez) siguen por su desde y su final, cada uno redondeado una vez.
  const altas = visuales
    .filter((p) => capaDe(p) !== 0)
    .map((p) => ({
      p,
      capa: capaDe(p),
      desdeFrames: Math.max(0, aFrames(p.desde)),
      finSeg: (p.desde || 0) + (p.duracion || 0),
    }));
  const mediaFrameSeg = 0.5 / fps;
  altas.forEach((a) => {
    if (a.desdeFrames >= durationInFrames) return;
    const siguiente = altas.find((b) => b !== a && b.capa === a.capa && Math.abs((b.p.desde || 0) - a.finSeg) < mediaFrameSeg);
    const fin = siguiente ? siguiente.desdeFrames : aFrames(a.finSeg);
    salida.push({
      ...a.p,
      capa: a.capa,
      desdeFrames: a.desdeFrames,
      largoFrames: Math.max(1, Math.min(fin, durationInFrames) - a.desdeFrames),
      solapeFrames: 0,
      fundidoFrames: aFrames(a.p.fundidoEntrada),
    });
  });

  // EL DOBLE DEL FUNDIDO. Una pieza con fundidoEntrada se dibuja dos veces:
  // la base, en su capa, por toda su duracion, y un doble mudo que vive solo
  // los fotogramas del fundido y va encima de TODOS los clips (capa mayor + 0.5)
  // pero debajo de iconos, sticker y rotulo (capa 3). El doble hace la rampa de
  // opacidad; la base se queda invisible esos fotogramas y aparece opaca en el
  // fotograma siguiente al ultimo del doble, asi que no se ve ningun salto. El
  // audio va solo en la base, que no se parte. Un clip "oculto" no tiene imagen
  // que fundir.
  const capaDoble = salida.reduce((m, p) => (p.tipo === 'clip' ? Math.max(m, p.capa) : m), 0) + 0.5;
  salida
    .filter((p) => p.tipo === 'clip' && p.fundidoFrames > 0 && p.marco !== 'oculto')
    .forEach((p) => {
      salida.push({
        ...p,
        doble: true,
        mudo: true,
        capa: capaDoble,
        largoFrames: Math.min(p.largoFrames, p.fundidoFrames),
        solapeFrames: 0,
        congelarFinal: false,
      });
    });

  salida.sort((a, b) => a.capa - b.capa || a.desdeFrames - b.desdeFrames);

  piezas
    .filter((p) => p.tipo === 'sonido')
    .forEach((p) => {
      const desdeFrames = Math.max(0, aFrames(p.desde));
      if (desdeFrames >= durationInFrames) return;
      salida.push({ ...p, desdeFrames, largoFrames: null });
    });

  return salida;
};

/**
 * Cuanto dura de verdad el clip, para saber donde congelarlo (congelarFinal).
 * Si el plan lo trae (`largo` o `largoOriginal`, en segundos) se usa tal cual;
 * si no, se mide del archivo con un <video> de metadatos, sin descargarlo
 * entero, una vez por montaje de la pieza. Mientras se mide, delayRender
 * detiene el fotograma: Remotion no saca ninguno sin la medida.
 * Si el archivo no se deja medir, se devuelve Infinity: no se congela y el clip
 * sigue como siempre.
 */
const useLargoDelClip = (src, conocido, haceFalta) => {
  const [largo, setLargo] = useState(conocido ?? null);
  useLayoutEffect(() => {
    if (!haceFalta || largo != null) return undefined;
    const handle = delayRender(`midiendo el largo de ${src}`);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => {
      setLargo(Number.isFinite(v.duration) && v.duration > 0 ? v.duration : Infinity);
      continueRender(handle);
    };
    v.onerror = () => {
      setLargo(Infinity);
      continueRender(handle);
    };
    v.src = src;
    return () => {
      v.onloadedmetadata = null;
      v.onerror = null;
      v.removeAttribute('src');
    };
    // Solo al montar: la pieza no cambia de archivo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return largo;
};

/**
 * Pantalla dividida (solo la usa el podcast). Correcciones hechas sobre el
 * primer podcast real (2026-10-13): el corte entre el B-roll y el host no es una
 * linea recta sino un degradado (el B-roll baja un poco por encima del host y se
 * desvanece), y el host no se ve con todo el aire de arriba de la cabeza: se
 * encuadra mas abajo, con la cabeza arriba de su mitad y algo del microfono.
 *   brollAlto      alto de la caja del B-roll, en fraccion de la pantalla
 *   fundidoDesde   desde que parte de esa caja empieza a desvanecerse (0-1)
 *   hostEncuadreY  objectPosition vertical del clip del host en su mitad
 */
const DIVIDIDA = { brollAlto: 0.58, fundidoDesde: 0.86, hostEncuadreY: '23%' };

/**
 * Host recortado en la esquina (marco "recorte-izquierda/derecha"): ancho en
 * fraccion de la pantalla, proporcion ancho/alto del .webm recortado (la franja
 * del clip 720x1280 de la cabeza a antes de la mesa: 720x1000) y cuanto del
 * borde interior se desvanece. La proporcion de verdad viene en la pieza
 * (`pieza.proporcion`, de recorte.json, la escribe el plan); esta es la de
 * respaldo para planes que no la traen.
 */
const RECORTE = { ancho: 0.62, proporcion: 720 / 1000, fundido: 0 };

/**
 * La caja y el estilo del video segun el `marco`. Todo en fraccion del ancho.
 * `proporcion` (ancho/alto) solo la usan los marcos recorte-*: la de la pieza si
 * viene y es un numero valido, si no RECORTE.proporcion.
 */
const marcoDe = (marco, medidas, width, height, proporcion) => {
  const cubre = { width: '100%', height: '100%', objectFit: 'cover' };
  if (marco === 'mitad-inferior') {
    // El host en la mitad de abajo, encuadrado con la cabeza arriba (DIVIDIDA).
    return {
      caja: { position: 'absolute', left: 0, top: '50%', width: '100%', height: '50%', overflow: 'hidden' },
      video: { ...cubre, objectPosition: `50% ${DIVIDIDA.hostEncuadreY}` },
    };
  }
  if (marco === 'mitad-superior') {
    const mascara = `linear-gradient(to bottom, #000 0%, #000 ${Math.round(DIVIDIDA.fundidoDesde * 100)}%, transparent 100%)`;
    return {
      caja: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: `${Math.round(DIVIDIDA.brollAlto * 100)}%`,
        overflow: 'hidden',
        WebkitMaskImage: mascara,
        maskImage: mascara,
      },
      video: { ...cubre, objectPosition: '50% 50%' },
    };
  }
  if (marco === 'recorte-izquierda' || marco === 'recorte-derecha') {
    // Podcast en esquina, como se aprobo en la prueba Cayenne: el host recortado SIN fondo (un
    // .webm con alfa) encima del B-roll, sin marco, pegado al borde de abajo y
    // al de su lado, cortado por los dos. Ancho en RECORTE; la proporcion, la del
    // .webm (pieza.proporcion) o la de RECORTE si el plan no la trae.
    const ancho = Math.round(width * RECORTE.ancho);
    const prop = Number(proporcion) > 0 ? Number(proporcion) : RECORTE.proporcion;
    const lado = marco === 'recorte-izquierda' ? 'left' : 'right';
    // El borde interior del clip original cae dentro de la pantalla y cortaba el
    // brazo con una linea recta: se desvanece en RECORTE.fundido del ancho.
    const mascara = `linear-gradient(to ${lado}, transparent 0%, #000 ${Math.round(RECORTE.fundido * 100)}%)`;
    return {
      caja: {
        position: 'absolute',
        bottom: 0,
        [lado]: 0,
        width: ancho,
        height: Math.round(ancho / prop),
        WebkitMaskImage: mascara,
        maskImage: mascara,
      },
      video: { width: '100%', height: '100%', objectFit: 'contain', objectPosition: `${lado === 'left' ? 0 : 100}% 100%` },
      transparente: true,
    };
  }
  if (marco === 'esquina-izquierda' || marco === 'esquina-derecha') {
    const e = medidas.esquina;
    const ancho = Math.round(width * e.ancho);
    const lado = marco === 'esquina-izquierda' ? 'left' : 'right';
    return {
      caja: {
        position: 'absolute',
        bottom: Math.round(width * e.margen),
        [lado]: Math.round(width * e.margen),
        width: ancho,
        // Misma proporcion que el video: el clip entero, reducido, sin recorte.
        height: Math.round((ancho * height) / width),
        borderRadius: Math.round(width * e.radio),
        overflow: 'hidden',
        border: `${Math.max(2, Math.round(width * 0.0055))}px solid white`,
        boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
        backgroundColor: 'black',
      },
      video: cubre,
    };
  }
  return {
    caja: { position: 'absolute', inset: 0, overflow: 'hidden' },
    video: cubre,
  };
};

/**
 * Un clip de la escena dentro de su Sequence.
 *
 * - recorteInicio -> trimBefore; velocidad -> playbackRate; mudo -> volumen 0.
 * - Con mudo:false suena a dbALineal(ducking) (0 dB en estos planes: es la voz)
 *   con el fade de siempre. El fade de salida cae en el corte LIMPIO, aunque la
 *   imagen siga `solapeFrames` mas por la disolvencia de la siguiente pieza.
 * - marco "oculto": no se dibuja nada, solo suena (entrevista A: la historia la
 *   cubre la cadena de B-roll). Se monta como <Audio> para no extraer fotogramas
 *   que nadie ve.
 * - fundidoEntrada: el doble (piezasDeEscena) hace la rampa de opacidad 0 -> 1
 *   encima de todos los clips; la base queda invisible mientras tanto y aparece
 *   opaca justo cuando el doble termina.
 * - congelarFinal: cuando el clip se acaba antes que la pieza, se queda su ultimo
 *   fotograma con un push-in suave. Se hace con <Freeze> alrededor del MISMO
 *   OffthreadVideo (trimBefore y playbackRate incluidos), activo solo desde el
 *   fotograma en que el clip termina: Freeze fija useCurrentFrame() en el ultimo
 *   fotograma de la pieza que aun tenia imagen, y como el fotograma de video que
 *   OffthreadVideo pide es trimBefore + fotograma * velocidad en los dos casos
 *   (medido en Sequence.js: el Sequence negativo de trimBefore conserva su
 *   cumulatedNegativeFrom dentro de Freeze), el congelado es exactamente el
 *   ultimo fotograma que se vio. Congelado va mudo: con Freeze el audio
 *   registraria siempre el mismo fotograma y sonaria mal.
 */
const ClipEscena = ({ pieza, fadeFrames, ducking, medidas }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frames = pieza.largoFrames;
  const velocidad = pieza.velocidad || 1;
  const recorteSeg = pieza.recorteInicio || 0;
  const trimBefore = recorteSeg ? Math.round(recorteSeg * fps) : undefined;
  const src = staticFile(`video/${pieza.archivo}`);

  const audioFrames = Math.max(1, frames - (pieza.solapeFrames || 0));
  // volumenDb: la pieza puede sonar por debajo de la voz (podcast: el sonido de
  // las reacciones, para que no pise las palabras de quien habla).
  const volumenBase = pieza.mudo ? 0 : dbALineal(pieza.volumenDb ?? ducking);
  const volumen =
    volumenBase === 0
      ? 0
      : interpolate(
          frame,
          [0, fadeFrames, Math.max(fadeFrames, audioFrames - fadeFrames), audioFrames],
          [0, volumenBase, volumenBase, 0],
          CLAMP
        );

  const largoClip = useLargoDelClip(src, pieza.largo ?? pieza.largoOriginal ?? null, Boolean(pieza.congelarFinal));
  // Fotogramas de la pieza que el clip cubre con imagen propia. Uno de margen:
  // pedirle al extractor el fotograma justo del final del archivo es pedirle uno
  // que a veces no existe.
  const framesDeVideo =
    pieza.congelarFinal && largoClip != null && Number.isFinite(largoClip)
      ? Math.max(1, Math.floor(((largoClip - recorteSeg) / velocidad) * fps) - 1)
      : null;
  const congela = framesDeVideo != null && framesDeVideo < frames;
  const congelado = congela && frame >= framesDeVideo;

  if (pieza.marco === 'oculto') {
    if (volumenBase === 0) return null;
    return <Audio src={src} trimBefore={trimBefore} playbackRate={velocidad} volume={() => volumen} />;
  }

  // frame + 1: el primer fotograma del doble ya deja ver algo (1/n) y el ultimo
  // llega a 1, que es justo lo que tiene la base en el fotograma siguiente.
  const opacidad = pieza.doble
    ? interpolate(frame + 1, [0, pieza.fundidoFrames], [0, 1], CLAMP)
    : pieza.fundidoFrames > 0 && frame < pieza.fundidoFrames
      ? 0
      : 1;
  const pushIn = congela
    ? interpolate(frame, [framesDeVideo, frames], [1, CONGELADO_PUSH_IN], { ...CLAMP, easing: Easing.out(Easing.quad) })
    : 1;
  const marco = marcoDe(pieza.marco, medidas, width, height, pieza.proporcion);

  return (
    <AbsoluteFill style={{ opacity: opacidad }}>
      <div style={marco.caja}>
        <div style={{ width: '100%', height: '100%', transform: `scale(${pushIn})` }}>
          <Freeze frame={Math.max(0, (framesDeVideo ?? 1) - 1)} active={congelado}>
            <OffthreadVideo
              src={src}
              playbackRate={velocidad}
              trimBefore={trimBefore}
              muted={volumenBase === 0 || congelado}
              volume={() => volumen}
              transparent={Boolean(marco.transparente)}
              style={marco.video}
            />
          </Freeze>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Una imagen: pantalla completa, o con `efecto: "golpe"` (el congelado de la
 * entrevista A), o como `marco: "sticker-esquina"` (la foto del producto cuando
 * se dice la marca).
 */
const ImagenEscena = ({ pieza, medidas }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frames = pieza.largoFrames;
  const src = staticFile(pieza.archivo);

  if (pieza.marco === 'sticker-esquina') {
    // Pop de entrada por spring (con rebote) y salida en fade corto para que no
    // desaparezca de un tajo.
    const pop = spring({ frame, fps, config: { damping: 9, stiffness: 170, mass: 0.7 }, durationInFrames: Math.round(STICKER.popSeg * fps) });
    const salida = Math.max(1, Math.round(STICKER.salidaSeg * fps));
    const opacidad = interpolate(frame, [Math.max(0, frames - salida), frames], [1, 0], CLAMP);
    const ancho = Math.round(width * medidas.stickerAncho);
    const lado = pieza.lado === 'derecha' ? 'right' : 'left';
    return (
      <div
        style={{
          position: 'absolute',
          top: Math.round(height * 0.06),
          [lado]: Math.round(width * 0.04),
          width: ancho,
          opacity: opacidad,
          transform: `scale(${pop})`,
          transformOrigin: lado === 'left' ? 'top left' : 'top right',
          backgroundColor: 'white',
          padding: Math.round(ancho * 0.035),
          borderRadius: Math.round(ancho * 0.06),
          boxShadow: '0 14px 34px rgba(0,0,0,0.45)',
        }}
      >
        <Img src={src} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: Math.round(ancho * 0.03) }} />
      </div>
    );
  }

  if (pieza.efecto === 'golpe' && pieza.variante === 'glitch') {
    // Opcion 5, la elegida en las pruebas (2026-10-14): golpe de escala (1 -> 1.10 en
    // 0.27 s y despues sigue creciendo despacio), sacudida de 3 fotogramas,
    // separacion de canales rojo/azul los primeros 0.45 s y negativo en dos
    // golpes (0-0.15 s y 0.30-0.40 s).
    const t = frame / fps;
    const punch = Math.max(1, Math.round(0.27 * fps));
    const escala = frame < punch ? 1 + 0.1 * (1 - Math.pow(1 - frame / punch, 3)) : 1.1 + (0.045 * (frame - punch)) / fps;
    const sacudidas = [
      [1.6, 1.1],
      [-1.2, -0.7],
      [0.6, 0.3],
    ];
    const s = frame < 3 ? sacudidas[frame] : [0, 0];
    const dx = Math.round((width * s[0]) / 100);
    const dy = Math.round((width * s[1]) / 100);
    const glitch = t < 0.45;
    const negativo = t < 0.15 || (t >= 0.3 && t <= 0.4);
    const corrimiento = Math.round(width * 0.025);
    const filtros = [glitch ? 'url(#congelado-glitch-rgb)' : null, negativo ? 'invert(1)' : null].filter(Boolean).join(' ') || 'none';
    return (
      <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: 'black' }}>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <filter id="congelado-glitch-rgb" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="rojo" />
            <feOffset in="rojo" dx={-corrimiento} dy="0" result="rojoCorrido" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="verde" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="azul" />
            <feOffset in="azul" dx={corrimiento} dy="0" result="azulCorrido" />
            <feBlend in="rojoCorrido" in2="verde" mode="screen" result="rojoVerde" />
            <feBlend in="rojoVerde" in2="azulCorrido" mode="screen" />
          </filter>
        </svg>
        <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${escala})`, filter: filtros }}>
          <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (pieza.efecto === 'golpe') {
    // Golpe: escala 1 -> 1.08 en 0.25 s (frenando), sacudida de 3 fotogramas y
    // destello blanco que se apaga en 0.3 s. La escala se queda arriba: es un
    // congelado, no vuelve.
    const escala = interpolate(frame, [0, Math.max(1, Math.round(GOLPE.escalaSeg * fps))], [1, GOLPE.escalaHasta], {
      ...CLAMP,
      easing: Easing.out(Easing.cubic),
    });
    const sacudidas = [
      [0.9, -0.6],
      [-0.7, 0.45],
      [0.4, -0.25],
    ];
    const s = frame < GOLPE.sacudidaFrames ? sacudidas[frame] : [0, 0];
    const dx = Math.round((width * s[0]) / 100);
    const dy = Math.round((width * s[1]) / 100);
    // "Congelacion negativa" (la transicion de CapCut del montaje a mano, 2026-10-13):
    // durante los primeros fotogramas el cuadro congelado se ve en NEGATIVO y en
    // blanco y negro, con la sacudida, y despues vuelve a su color normal. El
    // destello blanco de antes queda como un velo corto encima del negativo.
    const framesNegativo = Math.max(1, Math.round(GOLPE.destelloSeg * fps));
    const negativo = frame < framesNegativo;
    const destello = interpolate(frame, [0, framesNegativo], [0.35, 0], CLAMP);
    return (
      <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: 'black' }}>
        <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${escala})`, filter: negativo ? 'invert(1) grayscale(1) contrast(1.3)' : 'none' }}>
          <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
        <AbsoluteFill style={{ backgroundColor: 'white', opacity: destello }} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </AbsoluteFill>
  );
};

/** Circulo verde con check blanco: entra con su propio pop en la esquina inferior derecha del icono. */
const Check = ({ desdeFrame, ancho, abajo = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (desdeFrame == null || frame < desdeFrame) return null;
  const pop = spring({ frame: frame - desdeFrame, fps, config: { damping: 8, stiffness: 200, mass: 0.6 }, durationInFrames: Math.round(ICONO.popSeg * fps) });
  const tam = Math.round(ancho * 0.36);
  return (
    <div
      style={{
        position: 'absolute',
        // abajo: centrado debajo del icono (como en los anuncios de referencia, 2026-10-14).
        ...(abajo
          ? { left: Math.round((ancho - tam) / 2), bottom: -Math.round(tam * 0.85) }
          : { right: -Math.round(ancho * 0.08), bottom: -Math.round(ancho * 0.08) }),
        width: tam,
        height: tam,
        borderRadius: '50%',
        backgroundColor: '#22C55E',
        border: `${Math.max(2, Math.round(tam * 0.07))}px solid white`,
        boxShadow: '0 6px 14px rgba(0,0,0,0.4)',
        transform: `scale(${pop})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg viewBox="0 0 24 24" width="64%" height="64%" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 12.5 9.5 18 20 6.5" />
      </svg>
    </div>
  );
};

/**
 * Un icono apilado a un lado, a la altura del pecho: fila 0, 1 o 2 de arriba
 * hacia abajo. Entra con pop (spring, 0.3 s) y sale en fade (0.2 s).
 * `sticker: "recorte"` = el PNG con transparencia tal cual, con sombra;
 * `"tarjeta"` = dentro de una tarjeta blanca redondeada con sombra (para un PNG
 * que llego sin transparencia: sigue pareciendo un sticker).
 */
const IconoEscena = ({ pieza, medidas }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const frames = pieza.largoFrames;
  const ancho = Math.round(width * (pieza.ancho ?? medidas.iconoAncho));
  const pop = spring({ frame, fps, config: { damping: 9, stiffness: 180, mass: 0.7 }, durationInFrames: Math.round(ICONO.popSeg * fps) });
  const salida = Math.max(1, Math.round(ICONO.salidaSeg * fps));
  const opacidad = interpolate(frame, [Math.max(0, frames - salida), frames], [1, 0], CLAMP);
  const lado = pieza.lado === 'izquierda' ? 'left' : 'right';
  const fila = Math.max(0, Math.min(2, pieza.fila || 0));
  // La pila arranca al 42 % de la altura (pecho de alguien encuadrado a media
  // cintura en 9:16) y cada fila baja un icono mas un poco de aire.
  // Con centroX/centroY (fracciones del cuadro) el icono va centrado en ese
  // punto: la pareja horizontal de la entrevista A y el icono al centro de la B.
  const libre = pieza.centroX != null && pieza.centroY != null;
  const top = libre ? Math.round(height * pieza.centroY - ancho / 2) : Math.round(height * 0.42 + fila * (ancho + height * 0.015));
  const posicion = libre ? { left: Math.round(width * pieza.centroX - ancho / 2) } : { [lado]: Math.round(width * 0.05) };
  const checkDesde = pieza.check?.desde != null ? Math.round(pieza.check.desde * fps) - pieza.desdeFrames : null;
  const tarjeta = pieza.sticker === 'tarjeta';

  return (
    <div
      style={{
        position: 'absolute',
        top,
        ...posicion,
        width: ancho,
        height: ancho,
        opacity: opacidad,
        transform: `scale(${pop})`,
        transformOrigin: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          ...(tarjeta
            ? {
                backgroundColor: 'white',
                borderRadius: Math.round(ancho * 0.14),
                padding: Math.round(ancho * 0.08),
                boxShadow: '0 10px 26px rgba(0,0,0,0.4)',
              }
            : {}),
        }}
      >
        <Img
          src={staticFile(pieza.archivo)}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: tarjeta ? Math.round(ancho * 0.08) : 0,
            filter: tarjeta ? 'none' : 'drop-shadow(0 8px 14px rgba(0,0,0,0.45))',
          }}
        />
      </div>
      <Check desdeFrame={checkDesde} ancho={ancho} abajo={Boolean(pieza.checkAbajo)} />
    </div>
  );
};

/**
 * El rotulo del CTA: una capsula del color de resaltado de los subtitulos con el
 * texto en blanco (Arial Black, 0.055 del ancho) en el tercio superior, y si
 * `flecha`, una flecha roja hacia abajo con rebote suave, centrada, por encima
 * de la zona de subtitulos (que se dibujan igual, debajo).
 */
const TextoEscena = ({ pieza, medidas }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  // Entrada rapida (3-5 fotogramas), con
  // un pelo de rebote.
  const entrada = spring({ frame, fps, config: { damping: 11, stiffness: 220, mass: 0.6 }, durationInFrames: Math.max(3, Math.round(TEXTO.entradaSeg * fps)) });
  const tamano = Math.round(width * 0.055);

  // Rebote: baja y vuelve, nunca sube por encima de su sitio (como un dedo que
  // senala). Periodo de 0.9 s.
  const rebote = ((1 - Math.cos((2 * Math.PI * t) / TEXTO.rebotePeriodoSeg)) / 2) * height * 0.012;
  const flechaAncho = Math.round(width * 0.16);
  const flechaAlto = Math.round(height * 0.11);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: Math.round(height * 0.13),
          left: '7%',
          right: '7%',
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${entrada})`,
          opacity: Math.min(1, entrada),
        }}
      >
        <div
          style={{
            backgroundColor: medidas.colorResaltado,
            color: 'white',
            fontFamily: '"Arial Black", "Arial Bold", Gadget, sans-serif',
            fontSize: tamano,
            lineHeight: 1.15,
            textAlign: 'center',
            padding: `${Math.round(tamano * 0.35)}px ${Math.round(tamano * 0.75)}px`,
            borderRadius: Math.round(tamano * 0.6),
            boxShadow: '0 10px 28px rgba(0,0,0,0.4)',
            textShadow: '0 2px 6px rgba(0,0,0,0.35)',
          }}
        >
          {pieza.texto}
        </div>
      </div>
      {pieza.flecha ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: Math.round(height * 0.56),
            width: flechaAncho,
            height: flechaAlto,
            transform: `translateX(-50%) translateY(${rebote}px) scale(${entrada})`,
            opacity: Math.min(1, entrada),
            filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.45))',
          }}
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
            <path d="M36 0 H64 V52 H92 L50 100 L8 52 H36 Z" fill="#E8232A" stroke="white" strokeWidth="5" strokeLinejoin="round" />
          </svg>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const medidasDe = (plan) => ({
  esquina: { ...ESQUINA, ...(plan.reglas?.podcast?.esquina || {}) },
  iconoAncho: plan.reglas?.entrevista?.iconoAncho ?? ICONO_ANCHO,
  stickerAncho: plan.reglas?.entrevista?.stickerAncho ?? STICKER_ANCHO,
  colorResaltado: plan.estiloSubtitulos?.colorResaltado ?? '#E8442A',
});

/**
 * Dibuja las piezas ya convertidas por piezasDeEscena, en su orden (capa, inicio).
 * Los sonidos van a nivel de composicion, sin atenuar: `desde` ya trae el
 * adelanto del ataque medido por el plan.
 */
export const Escena = ({ piezas, plan, fadeFrames, ducking }) => {
  const medidas = medidasDe(plan);
  return (
    <>
      {piezas.map((p, i) => {
        if (p.tipo === 'sonido') {
          return (
            <Sequence key={`sonido-${p.archivo}-${i}`} from={p.desdeFrames}>
              <Audio src={staticFile(p.archivo)} />
            </Sequence>
          );
        }
        let contenido = null;
        if (p.tipo === 'clip') contenido = <ClipEscena pieza={p} fadeFrames={fadeFrames} ducking={ducking} medidas={medidas} />;
        else if (p.tipo === 'imagen') contenido = <ImagenEscena pieza={p} medidas={medidas} />;
        else if (p.tipo === 'icono') contenido = <IconoEscena pieza={p} medidas={medidas} />;
        else if (p.tipo === 'texto') contenido = <TextoEscena pieza={p} medidas={medidas} />;
        if (!contenido) return null;
        return (
          <Sequence key={`${p.tipo}-${p.archivo || 'texto'}-${i}`} from={p.desdeFrames} durationInFrames={p.largoFrames}>
            {contenido}
          </Sequence>
        );
      })}
    </>
  );
};
