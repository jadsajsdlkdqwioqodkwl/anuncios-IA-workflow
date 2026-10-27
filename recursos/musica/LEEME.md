# Música por estilo

Pistas elegidas para un estilo concreto. **No son de todos los
estilos**: cada archivo se llama como el estilo al que pertenece.

| Archivo | Estilo | Duración | Pico |
|---|---|---|---|
| `esqueleto.mp3` | anuncios-skeleton-ads | 61.0s | 0.0 dB |
| `zack-d-films.mp3` | anuncios-zack-d-films | 121.5s | 0.0 dB |
| `estilo-lego.mp3` | anuncios-estilo-lego ("Open Up Emotions", preparada) | 227.0s | -1.1 dB |
| `estilo-lego-original.mp3` | la misma, tal cual vino; solo para rehacer la de arriba | 82.3s | 0.0 dB |

## Cómo se usa

Se copia a `temp/<anuncio>/musica/fondo.mp3`. Con eso **Suno no corre**:
`musicaPropia()` de `generar-musica.js` mira esa subcarpeta primero y usa lo que
encuentre, sin gastar créditos.

**`estilo-lego.mp3` la copia el motor solo**, no hay que hacerlo a mano:
`npm run musica -- <carpeta>` la copia en vez de llamar a Suno (sin costo), y
`npm run plan -- <carpeta>` también la copia si `musica/` está vacía. Si el
usuario deja su propia pista en `musica/`, gana la suya. Para una de Suno en
este estilo: `npm run musica -- <carpeta> --suno`. La tabla de estilos que se
copian solos es `PISTA_FIJA_POR_ESTILO` en `produccion/pista-fija.js` (la usan
`generar-musica.js`, `planear-montaje.js` y `ensamblar.js`); `esqueleto.mp3`
y `zack-d-films.mp3` no están ahí y se siguen copiando a mano.

**Si el anuncio dura más que la pista, se repite sola.** El planificador pone
`loop: true` cuando la pista es más corta que el anuncio, así que no hay que
hacer nada.

## Cómo se preparó `estilo-lego.mp3`

Sale de `estilo-lego-original.mp3` con `preparar-estilo-lego.py`, la misma
receta de la música de un anuncio Lego real, aprobado de oído (2026-10-05):

- toma solo la parte musical, de 0 a 77 s (después la pista se apaga);
- aplana el crescendo con una curva de ganancia suave (RMS por ventanas de
  0,5 s, suavizado sobre ~4 s, hacia -20 dB RMS, con la ganancia entre -18 y
  +12 dB), para que suene pareja de principio a fin;
- la repite **tres** veces con un cruce de 2 s en cada unión. En el anuncio
  aprobado eran dos (2:32); con tres son 3:47 y ningún anuncio largo llega al
  loop duro. Los primeros 150 s son los mismos que los del anuncio aprobado;
- normaliza el pico a 0,89 como máximo y la escribe en mp3 a 192 kbps, 44,1 kHz.

El script es **opcional** y el motor no lo usa: el mp3 ya está preparado. Solo
sirve para rehacerlo, y necesita Python con numpy, que no son dependencias del
proyecto:

    python recursos/musica/preparar-estilo-lego.py

## Ojo con el nivel

`esqueleto.mp3` está normalizada a fondo de escala (pico 0.0 dB), bastante más
caliente que una pista de Suno. Con la ganancia de -26 dB del plan su pico cae
en -26 dBFS contra una voz que anda por -16/-18, que es lo que se busca. Si
alguna vez suena alta, se prueba sin re-renderizar los clips:

    node produccion/ensamblar.js <carpeta> --musica-db -30

En **estilo-lego** el nivel no es un número fijo: el plan mide la pista que va
a sonar (la fija, la del usuario o la de Suno) y calcula los dB para que quede
donde quedó en el anuncio aprobado, pareja y sin subir en el payoff. Con
`estilo-lego.mp3` da -14 dB. La calibración está en `MUSICA_POR_ESTILO` de
`planear-montaje.js`, y `--musica-db` sigue sirviendo para probar otro nivel.
