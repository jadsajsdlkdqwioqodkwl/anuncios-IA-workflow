import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  staticFile,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Escena, piezasDeEscena } from './Escena.jsx';

const dbALineal = (db) => Math.pow(10, db / 20);

/**
 * Un clip dentro de su ventana.
 *
 * - El recorte "desde el final" sale gratis: el clip empieza en su primer
 *   fotograma y la Sequence lo corta cuando se acaba la ventana.
 * - Las Tipo B no se cortan: se aceleran con playbackRate. Al renderizar,
 *   Remotion conserva el tono del audio aunque el clip vaya acelerado
 *   ("playbackRate always preserves the audio pitch"), asi que el ambiente
 *   sigue sonando bien. Solo se silencia un clip si el plan lo marca.
 */
/**
 * Animacion de entrada de una toma. Devuelve el transform del contenedor.
 *
 * Solo se aplica donde el plan lo dice (transiciones.json), nunca por regla a
 * todas las tomas: aplicada por regla se ve como plantilla, que es justo lo que
 * se evita (COMO-PRODUCIR.md, seccion 4).
 *
 *   zoom               entra grande y se asienta
 *   deslizar-derecha   entra desde el borde izquierdo y se desliza HACIA la derecha
 *   deslizar-izquierda entra desde el borde derecho y se desliza HACIA la izquierda
 */
const transformDeEntrada = (animacion, avance, zoomDesde) => {
  if (avance >= 1) return 'none';
  // Suavizado: rapido al principio y frenando al final.
  const e = 1 - Math.pow(1 - avance, 3);
  if (animacion === 'zoom') return `scale(${zoomDesde + (1 - zoomDesde) * e})`;

  // EL DESLIZAMIENTO NUNCA PUEDE DEJAR EL CUADRO DESCUBIERTO.
  //
  // La primera version entraba desde translateX(±100%): en el fotograma 0 la
  // toma estaba entera fuera de pantalla y se veia el fondo negro. Salieron
  // exactamente dos fotogramas negros, en 3.233s y 39.867s, que son los dos
  // deslizamientos. El chequeo de YAVG<5 del 5.9 los cazo.
  //
  // Ahora la toma entra AMPLIADA y desplazada poco: con escala s cubre s veces
  // el ancho, asi que aguanta un desplazamiento de hasta (s-1)/2 sin destapar
  // el borde. Con 1.5 y 22% queda margen (22 < 25), y como las dos cosas se
  // relajan juntas, la desigualdad se mantiene en todo el recorrido.
  const DESPLAZA = 22;
  const ESCALA = 1.5;
  const s = ESCALA + (1 - ESCALA) * e;
  if (animacion === 'deslizar-derecha') return `scale(${s}) translateX(${-DESPLAZA * (1 - e)}%)`;
  if (animacion === 'deslizar-izquierda') return `scale(${s}) translateX(${DESPLAZA * (1 - e)}%)`;
  return 'none';
};

const Clip = ({ pieza, frames, fadeFrames, ducking, transicion, reglasTransiciones }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const volumenBase = pieza.mudo ? 0 : dbALineal(ducking);
  const volumen =
    volumenBase === 0
      ? 0
      : interpolate(
          frame,
          [0, fadeFrames, Math.max(fadeFrames, frames - fadeFrames), frames],
          [0, volumenBase, volumenBase, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

  // Push-in sutil en los planos sostenidos para que no se sientan congelados.
  const escala = pieza.pushIn
    ? interpolate(frame, [0, frames], [1, 1.025], { extrapolateRight: 'clamp' })
    : 1;

  // Animacion de entrada, si esta toma la lleva.
  const rt = reglasTransiciones || {};
  // El zoom entra mas rapido que los deslizamientos para caer junto al golpe
  // del efecto de sonido, que en los dos archivos esta al principio.
  const segundosEntrada =
    transicion?.animacion === 'zoom' ? rt.duracionZoomSeg ?? 0.28 : rt.duracionSeg ?? 0.45;
  const framesEntrada = Math.max(1, Math.round(segundosEntrada * fps));
  const entrada = transicion
    ? transformDeEntrada(transicion.animacion, Math.min(1, frame / framesEntrada), rt.zoomDesde ?? 1.35)
    : 'none';

  return (
    <AbsoluteFill style={{ overflow: 'hidden', backgroundColor: 'black' }}>
      {/* El sonido de la transicion NO se monta aqui: va a nivel de composicion,
          adelantado para que su golpe caiga en el corte. Ver EfectosDeTransicion.
          Aqui no puede ir porque una Sequence no puede sonar antes de empezar. */}
      <AbsoluteFill style={{ transform: entrada }}>
      <AbsoluteFill style={{ transform: `scale(${escala})` }}>
        <OffthreadVideo
          src={staticFile(`video/${pieza.archivo}`)}
          playbackRate={pieza.velocidad || 1}
          // Recorte del borde de entrada (solo dialogo_nativo): el clip no
          // arranca en su fotograma 0 sino donde el personaje empieza a hablar.
          // La cola la corta la Sequence, que dura exactamente lo util.
          // Nunca se corta por DENTRO: ahi esta el lip-sync.
          trimBefore={pieza.recorteInicio ? Math.round(pieza.recorteInicio * fps) : undefined}
          volume={() => volumen}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


/**
 * Musica de fondo: UNA sola pista para todo el anuncio.
 *
 * La variacion emocional se hace con volumen, no cambiando de cancion: cortar
 * a otro tema a mitad se oye como un tajo. Va mas baja durante el planteo del
 * problema y sube un poco en el payoff/CTA.
 */
const Musica = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const m = plan.musica;

  const base = dbALineal(m.db ?? -26);
  const alzada = dbALineal((m.db ?? -26) + (m.subeEnPayoffDb ?? 4));

  const fadeIn = Math.max(1, Math.round((m.fadeInSeg ?? 1.2) * fps));
  const fadeOut = Math.max(1, Math.round((m.fadeOutSeg ?? 1.5) * fps));
  const payoff = Math.round((m.payoffDesdeSeg ?? 0) * fps);
  const rampa = Math.max(1, Math.round(1.5 * fps));

  // Nivel segun el momento del anuncio.
  const nivel = payoff
    ? interpolate(frame, [payoff - rampa, payoff], [base, alzada], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : base;

  // Fades de entrada y de cierre, encima del nivel.
  const sobre = interpolate(
    frame,
    [0, fadeIn, durationInFrames - fadeOut, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return <Audio src={staticFile(m.archivo)} volume={() => nivel * sobre} loop={m.loop ?? false} />;
};


/**
 * Subtitulos estilo redes: 2-4 palabras en pantalla, cada palabra apareciendo
 * en su momento exacto segun los timestamps de ElevenLabs.
 *
 * Van en el tercio inferior pero POR ENCIMA de la zona donde Meta e Instagram
 * ponen su interfaz (nombre de cuenta, boton de CTA, descripcion). Si se
 * bajan mas, la plataforma los tapa.
 */
const Subtitulos = ({ bloques, estilo }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const bloque = bloques.find((b) => t >= b.inicio && t < b.fin);
  if (!bloque) return null;

  // Todo se resuelve contra el ancho real del video, no en pixeles fijos.
  const e = estilo || {};
  const tamano = Math.round(width * (e.tamano ?? 0.0722));
  const contorno = Math.max(1, Math.round(tamano * (e.contornoRespectoTamano ?? 0.135)));
  const interlineado = e.interlineado ?? 1.1;
  // Un bloque puede traer su propia altura (podcast: mientras va el B-roll, el
  // subtitulo sube a la union de la pantalla dividida o por encima del host en
  // la esquina, para no taparle la cara). Sin ella, la del estilo.
  const desdeAbajo = bloque.desdeAbajo ?? e.desdeAbajo ?? 0.26;
  const colorResaltado = e.colorResaltado ?? '#E8442A';
  const cajaPadding = e.cajaPadding ?? 0.12;
  const cajaRedondeo = e.cajaRedondeo ?? 0.1;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: height * desdeAbajo,
        paddingLeft: '8%',
        paddingRight: '8%',
      }}
    >
      <div
        style={{
          display: 'flex',
          // UNA SOLA LINEA, nunca dos renglones. El corte por caracteres lo hace
          // bloquesDeSubtitulos() en subtitulos.js; aca solo se garantiza que
          // nada envuelva aunque el bloque venga largo de un anuncio viejo.
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.26em',
          fontFamily: '"Arial Black", "Arial Bold", Gadget, sans-serif',
          fontSize: tamano,
          lineHeight: interlineado,
          color: 'white',
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        {/* Todas las palabras del bloque estan visibles desde el principio; la
            que se esta diciendo lleva una caja de color detras. Los tiempos por
            palabra vienen de ElevenLabs, asi que el resaltado cae exacto. */}
        {bloque.palabras.map((p, i) => {
          const activa = t >= p.inicio - 0.02 && t < p.fin + 0.06;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                position: 'relative',
                padding: activa ? `${tamano * cajaPadding * 0.5}px ${tamano * cajaPadding}px` : 0,
                margin: activa ? 0 : `${tamano * cajaPadding * 0.5}px ${tamano * cajaPadding}px`,
                borderRadius: activa ? tamano * cajaRedondeo : 0,
                backgroundColor: activa ? colorResaltado : 'transparent',
                WebkitTextStroke: `${contorno}px black`,
                paintOrder: 'stroke fill',
                textShadow: '0 5px 14px rgba(0,0,0,0.55)',
              }}
            >
              {p.texto}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Las piezas de un plan de CONTINUIDAD (plan.continuidad.clips): una cadena de
 * clips seguidos, cada uno de una imagen a la siguiente.
 *
 * - Mismo encadenado en fotogramas que las tomas de siempre: cada pieza llega
 *   hasta el inicio de la siguiente, la primera arranca en 0 y la ultima
 *   llega hasta el final de la composicion. No hay huecos ni solapes.
 * - NUNCA SE CORTA: ni trimBefore ni cola. La velocidad sale de los
 *   fotogramas reales de la pieza, playbackRate = largo del clip * fps /
 *   fotogramas de la pieza, asi que el clip entero entra justo en su pieza:
 *   el redondeo a fotogramas no deja ni un recorte ni un congelado.
 * - Sin push-in (con 1 -> 1.025 por clip habria un salto de escala en cada
 *   union), sin animaciones de entrada y sin B-roll.
 */
const piezasDeContinuidad = (clips, fps, durationInFrames) => {
  const inicios = clips.map((c) => Math.round(c.desde * fps));
  if (inicios.length) inicios[0] = 0;
  return clips.map((c, i) => {
    const desdeFrames = inicios[i];
    const hasta = i + 1 < inicios.length ? inicios[i + 1] : durationInFrames;
    const largoFrames = Math.max(1, hasta - desdeFrames);
    // El largo exacto del stream (cuadros / fps) si el plan lo trae; si no,
    // el redondeado a milesimas.
    const largo = c.frames > 0 && c.fps > 0 ? c.frames / c.fps : c.largoOriginal;
    return {
      archivo: c.archivo,
      tipo: c.rol,
      velocidad: (largo * fps) / largoFrames,
      pushIn: false,
      mudo: Boolean(c.mudo),
      desdeFrames,
      largoFrames,
      transicion: null,
    };
  });
};

/** Las piezas de un plan de siempre: una toma por linea, mas su B-roll si lo lleva. */
const piezasDeBloques = (plan, fps, durationInFrames) => {
  // LA LINEA DE TIEMPO SE CONSTRUYE UNA SOLA VEZ, EN FOTOGRAMAS.
  //
  // Antes cada pieza redondeaba por su cuenta:
  //     from   = Math.round(p.desde * fps)
  //     frames = Math.round(p.duracion * fps)
  // Los dos redondeos son independientes, asi que el final de una toma no tiene
  // por que coincidir con el arranque de la siguiente. En el piloto de UGC:
  //
  //     toma-2  from 195 + 202 frames -> cubre 195..396
  //     toma-3  from 398
  //             el fotograma 397 no lo cubre NADIE -> negro, en 397/30 = 13.2333s
  //
  // Ahora el final de cada toma ES, por definicion, el arranque de la siguiente,
  // y la ultima llega hasta el final de la composicion. No puede haber agujeros
  // ni solapes, caiga como caiga cada redondeo.
  //
  // NO volver a `Math.round(p.duracion * fps)` porque se lee mas simple: eso es
  // exactamente lo que producia el parpadeo.
  const inicios = plan.bloques.map((b) => Math.round(b.toma.desde * fps));

  // LA PRIMERA TOMA SIEMPRE ARRANCA EN EL FOTOGRAMA 0.
  //
  // El encadenado de arriba garantiza que no haya huecos ENTRE piezas, pero no
  // cubre la cabeza: si la primera linea de voz no empieza exactamente en 0.000,
  // la primera Sequence arranca mas tarde y los fotogramas de antes no los pinta
  // nadie -> negro.
  //
  // Paso en el primer anuncio de skeleton: ElevenLabs dejo 0.07s de entrada,
  // Math.round(0.07 * 30) = 2, y los fotogramas 0 y 1 salieron negros. Los
  // cuatro anuncios anteriores arrancaban en 0.000 exacto y por eso nunca se
  // vio. El clip fuente arrancaba en luma 81, asi que no era una escena oscura.
  //
  // Anclar la primera toma al 0 no desincroniza nada: la voz en off se monta
  // desde el frame 0 por su cuenta, y lo unico que cambia es que la primera
  // toma se ve esos milisegundos de mas.
  if (inicios.length) inicios[0] = 0;

  const piezas = [];
  plan.bloques.forEach((b, i) => {
    const desde = inicios[i];
    const hasta = i + 1 < inicios.length ? inicios[i + 1] : durationInFrames;
    piezas.push({
      ...b.toma,
      tipo: b.tipo,
      pushIn: b.tipo === 'A' || b.tipo === 'C',
      mudo: Boolean(b.toma.audioDeformado),
      desdeFrames: desde,
      largoFrames: Math.max(1, hasta - desde),
      // La transicion se busca por numero de toma, no por posicion en el array:
      // el B-roll mete piezas en medio y el indice no coincide con la toma.
      transicion: (plan.transiciones || []).find((t) => t.toma === b.linea) || null,
    });
    if (b.broll) {
      // En dialogo_nativo el B-roll es un INSERTO QUE VA ENCIMA de la toma
      // (superpuesto: true): su Sequence arranca dentro de la ventana de la
      // toma, y como se pinta despues, la tapa. La toma sigue montada debajo,
      // asi que SU AUDIO SIGUE SONANDO — que es justo el punto: la voz no se
      // corta. El inserto va mudo (acelerado, su ambiente sonaria a ardilla).
      //
      // En voz_en_off el B-roll sigue yendo en fila, con su propia ventana.
      // El B-roll va ENCIMA: no entra en el encadenado, pero se recorta para no
      // pasarse del final de la composicion.
      const bDesde = Math.round(b.broll.desde * fps);
      piezas.push({
        ...b.broll,
        tipo: 'broll',
        pushIn: false,
        mudo: Boolean(b.broll.mudo),
        desdeFrames: bDesde,
        largoFrames: Math.max(1, Math.min(Math.round(b.broll.duracion * fps), durationInFrames - bDesde)),
      });
    }
  });
  return piezas;
};

export const Anuncio = ({ plan, sinSubtitulos = false, sinMusica = false }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const fadeFrames = Math.max(1, Math.round(((plan.audio?.fadeMs ?? 80) / 1000) * fps));
  const ducking = plan.audio?.ducking ?? -19;

  // Estilos hablados (podcast, entrevista): las capas de video vienen en
  // plan.escena.piezas y las dibuja Escena.jsx. Solo si el plan trae `escena`;
  // sin ella, nada de esto existe y todo sigue exactamente como siempre.
  const escena = plan.escena?.piezas ? piezasDeEscena(plan.escena.piezas, fps, durationInFrames) : null;

  // Con continuidad las piezas salen de la cadena de clips; sin ella, de los
  // bloques, exactamente como siempre.
  const piezas = escena
    ? []
    : plan.continuidad?.clips
      ? piezasDeContinuidad(plan.continuidad.clips, fps, durationInFrames)
      : piezasDeBloques(plan, fps, durationInFrames);

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {escena ? <Escena piezas={escena} plan={plan} fadeFrames={fadeFrames} ducking={ducking} /> : null}

      {piezas.map((p, i) => {
        const from = p.desdeFrames;
        const frames = p.largoFrames;
        return (
          <Sequence key={`${p.archivo}-${i}`} from={from} durationInFrames={frames}>
            <Clip
              pieza={p}
              frames={frames}
              fadeFrames={fadeFrames}
              ducking={ducking}
              transicion={p.transicion}
              reglasTransiciones={plan.reglasTransiciones}
            />
          </Sequence>
        );
      })}

      {/* Sonidos de transicion. Van a nivel de composicion, no dentro del clip,
          porque tienen que empezar ANTES del corte.

          Por que. El golpe de un efecto no siempre esta al principio del
          archivo: el deep-woosh es un swell que tarda 0.40s en llegar a su pico.
          Sonando desde el corte, el golpe llega tarde y la animacion ya termino.
          Se adelanta la reproduccion "adelantoSeg" (medido del archivo real en
          planear-montaje.js) para que el pico caiga EXACTAMENTE en el corte: el
          swell crece durante la toma anterior, como lo monta un editor.

          NO se recorta el archivo. Se intento el 2026-09-06 y se rechazo
          de oido: cortarle la cabeza le quita el swell, que es su caracter.

          El clamp a 0 cubre una transicion tan cerca del arranque que no haya
          sitio para el adelanto; ahi el golpe queda un poco tarde y no hay nada
          mejor que hacer. Va sin atenuar (efectoDb 0), a proposito. */}
      {(plan.transiciones || []).map((t, i) =>
        t.archivo ? (
          <Sequence
            key={`efecto-${t.toma}-${i}`}
            from={Math.max(0, Math.round((t.desde - (t.adelantoSeg || 0)) * fps))}
          >
            <Audio
              src={staticFile(t.archivo)}
              volume={dbALineal(plan.reglasTransiciones?.efectoDb ?? 0)}
            />
          </Sequence>
        ) : null
      )}

      {/* Musica de fondo, si la hay. Va debajo de todo: voz > ambiente > musica. */}
      {plan.musica?.archivo && !sinMusica ? <Musica plan={plan} /> : null}

      {/* Subtitulos arriba de todo lo visual. */}
      {!sinSubtitulos && plan.subtitulos?.length ? (
        <Subtitulos bloques={plan.subtitulos} estilo={plan.estiloSubtitulos} />
      ) : null}

      {/* La voz en off manda: va entera, sin cortes, desde el frame 0.
          En dialogo_nativo no hay: el personaje habla dentro del clip. */}
      {plan.audio?.voz ? <Audio src={staticFile(plan.audio.voz)} /> : null}
    </AbsoluteFill>
  );
};
