import { Composition } from 'remotion';
import { Anuncio } from './Anuncio.jsx';

export const FPS = 30;
export const ANCHO = 720;
export const ALTO = 1280;

// El plan real llega por --props. Este es solo un esqueleto para que Remotion
// pueda registrar la composicion sin datos.
const planVacio = { duracion: 1, bloques: [], audio: { ducking: -19, fadeMs: 80 } };

export const Root = () => (
  <Composition
    id="Anuncio"
    component={Anuncio}
    fps={FPS}
    width={ANCHO}
    height={ALTO}
    durationInFrames={FPS}
    defaultProps={{ plan: planVacio, sinSubtitulos: false, sinMusica: false }}
    calculateMetadata={({ props }) => ({
      // Math.round, no Math.ceil: las piezas de Anuncio.jsx redondean con round,
      // y con ceil la composicion quedaba un fotograma mas larga que el contenido
      // (34.94s: ceil -> 1049 fotogramas, las piezas llegaban al 1047) y ese
      // ultimo fotograma salia negro. El largo total tiene que salir de la misma
      // cuenta que las piezas.
      durationInFrames: Math.max(1, Math.round((props.plan?.duracion || 1) * FPS)),
    })}
  />
);
