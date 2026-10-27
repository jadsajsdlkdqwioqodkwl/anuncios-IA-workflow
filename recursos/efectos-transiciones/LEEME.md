# Efectos de transición

**Copia maestra del proyecto. Valen para TODOS los estilos.**

Van de la mano con las animaciones de entrada: donde hay una animación, hay un
efecto. El emparejamiento no cambia:

| Animación | Efecto |
|---|---|
| `deslizar-derecha` / `deslizar-izquierda` | `woosh.mp3` |
| `zoom` | `deep-woosh.mp3` |

## Cómo se usan

Remotion solo lee archivos que estén **dentro de la carpeta del anuncio** (esa
carpeta es su `--public-dir`). Así que estos dos se **copian** a
`temp/<anuncio>/efectos/` y el `transiciones.json` del anuncio los referencia
desde ahí.

Esta carpeta es el original del que se copian. Antes salían de una carpeta de
Descargas del usuario, que puede moverse o borrarse — y además no viajaría si el
proyecto se comparte.

## Medidas

| | Duración | Ataque | Su animación |
|---|---|---|---|
| `woosh.mp3` | 0.29s | t = 0.05s | deslizamientos, 0.45s |
| `deep-woosh.mp3` | 1.33s | **t = 0.20s** | zoom, **0.5s** |

El **ataque** es el momento en que el efecto empieza a oírse de verdad, y es lo
que se alinea con el corte. No es lo mismo que el pico: el `deep-woosh` es un
**swell** que sigue subiendo hasta t=0.40s, y su pico cae *dentro* de la
animación, que es justo lo que suena bien.

## ESTOS ARCHIVOS NO SE RECORTAN

**El pipeline los adelanta, no los corta.** `planear-montaje.js` mide el ataque
de cada archivo y le dice a Remotion que empiece a sonar esa cantidad **antes**
del corte, así el sonido "llega" justo cuando entra la animación y el swell
crece durante la toma anterior.

Se intentó lo contrario el 2026-09-06 —recortarle 0.35s de cabeza al
`deep-woosh` para que picara al principio— y **se rechazó de oído**:
sonaba cortado y pobre. El swell es el carácter del sonido, no un defecto.

## Si reemplazas un efecto

**No hace falta ajustar nada.** El adelanto se vuelve a medir del archivo nuevo
en el siguiente `npm run plan`, así que un efecto con otra forma cae igual de
bien. Por eso el número no está escrito en ninguna config: escrito a mano, un
efecto nuevo heredaría el valor del viejo y el desfase volvería sin avisar.

Para ver dónde cae el ataque de un archivo, `npm run verificar` lo informa (su
sección 7, la de los efectos; la 8 es otra cosa: Python y VP9 de los estilos
hablados). A mano:

    ffmpeg -i <efecto>.mp3 -af "asetnsamples=2205,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level" -f null -

Cada línea es una ventana de 0.05s.

## Sonidos de los estilos hablados (podcast y entrevista), 2026-10-13 (al día el 2026-10-14)

| Archivo | Para qué | De dónde salió |
|---|---|---|
| `check.mp3` | el "ding" del check cuando la persona elige una opción en el gancho de la entrevista A (y en cualquier icono con `elegido`). Suena en la palabra de la opción elegida | del montaje a mano de referencia (el "sonido ding" de CapCut, 1,15 s) |
| `congelado.mp3` | el golpe del congelado al final del gancho de la entrevista A. Va con la **congelación glitch** elegida en las pruebas el 2026-10-14 (pieza `variante: "glitch"`: acercamiento, sacudida, colores separados y negativo en dos golpes); los planes viejos, sin `variante`, lo usan con la "congelación negativa" de antes | del montaje a mano de referencia (el "glitch sound" de CapCut, 0,68 s) |
| `clic.mp3` | el clic de mouse al aparecer cada icono (cada grupo) y la foto del producto al centro en la entrevista B. En la A no va: el check tiene el suyo | del montaje a mano de referencia (el "sonido click mouse", 0,235 s), el 2026-10-14 |

| | Duración | Ataque medido |
|---|---|---|
| `check.mp3` | 1,15 s | t = 0,05 s |
| `congelado.mp3` | 0,68 s | t = 0,05 s |
| `clic.mp3` | 0,235 s | t = 0,05 s |

Los tres se copian a `temp/<anuncio>/efectos/` cuando el plan los usa, y el plan mide su
ataque como con los demás (se adelantan, no se recortan: el clic de cada icono empieza a
sonar ~0,05 s antes de que el icono aparezca; el check, ~0,05 s antes de la palabra de la
opción elegida, que el plan busca siempre después de la pregunta). Para reemplazar uno, basta con poner el
archivo nuevo con el mismo nombre: el siguiente `npm run plan` compara el de aquí con el
de `efectos/` del anuncio (tamaño y contenido), lo vuelve a copiar si cambió y avisa. Así
el reemplazo llega también a los anuncios ya planeados.
