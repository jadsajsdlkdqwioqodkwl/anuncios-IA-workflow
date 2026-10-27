# Prepara recursos/musica/estilo-lego.mp3 a partir de "Open Up Emotions"
# (estilo-lego-original.mp3, al lado de este archivo).
#
# OPCIONAL. El motor NO lo corre: usa el mp3 ya preparado. Esto existe solo
# para poder rehacer la pista si algun dia hace falta, y necesita Python con
# numpy, que NO son dependencias del proyecto (el motor es Node + ffmpeg).
#
#     python recursos/musica/preparar-estilo-lego.py [destino.mp3]
#
# La receta es la de un anuncio Lego real, aprobado de oido el 2026-10-05:
#  - toma la parte musical (0 a 77 s; despues se apaga),
#  - aplana el crescendo (de -26 dB a -11 dB RMS) con una curva de ganancia suave
#    para que quede pareja, como la dejo el editor de la referencia,
#  - la repite TRES veces con un cruce de 2 s en cada union (en el anuncio
#    aprobado eran dos, 2:32; con tres son 3:47 y ningun anuncio largo llega
#    al loop duro). Los primeros 150 s son los mismos que los de ese anuncio,
#  - la deja a -20 dB RMS; el nivel final en la mezcla lo calcula el plan
#    midiendo la pista (planear-montaje.js, MUSICA_POR_ESTILO).
import os
import subprocess
import sys

import numpy as np

SR = 44100
AQUI = os.path.dirname(os.path.abspath(__file__))
ORIGEN = os.path.join(AQUI, "estilo-lego-original.mp3")
DESTINO = sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, "estilo-lego.mp3")
FIN_MUSICAL = 77.0
OBJETIVO_DB = -20.0
CRUCE = 2.0
VUELTAS = 3

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", ORIGEN, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
x = x[: int(FIN_MUSICAL * SR)]

# RMS por ventanas de 0,5 s, suavizado sobre ~4 s, y ganancia hacia el objetivo.
win = int(0.5 * SR)
nwin = len(x) // win
rms = np.array([np.sqrt(np.mean(x[i * win:(i + 1) * win] ** 2)) for i in range(nwin)])
rms_db = 20 * np.log10(np.maximum(rms, 1e-6))
k = 8
pad = np.pad(rms_db, (k, k), mode="edge")
suave = np.convolve(pad, np.ones(2 * k + 1) / (2 * k + 1), mode="valid")
ganancia_db = np.clip(OBJETIVO_DB - suave, -18, 12)
centros = (np.arange(nwin) + 0.5) * win
g = np.interp(np.arange(len(x)), centros, 10 ** (ganancia_db / 20))
y = x * g[:, None]

# VUELTAS vueltas con cruce. Cada union es la cola de una vuelta fundida con la
# cabeza de la siguiente; las vueltas del medio pierden cabeza y cola.
c = int(CRUCE * SR)
rampa = np.linspace(0, 1, c)[:, None]
union = y[-c:] * (1 - rampa) + y[:c] * rampa
partes = [y[:-c]]
for i in range(VUELTAS - 1):
    partes.append(union)
    partes.append(y[c:-c] if i < VUELTAS - 2 else y[c:])
z = np.concatenate(partes)
pico = np.max(np.abs(z))
if pico > 0.89:
    z *= 0.89 / pico

def db(a):
    return 20 * np.log10(np.sqrt(np.mean(a ** 2)))

print(f"duracion {len(z)/SR:.1f} s | RMS total {db(z):.1f} dB | pico {20*np.log10(np.max(np.abs(z))):.1f} dBFS")
for s in range(0, int(len(z) / SR), 10):
    print(f"  {s:3d}-{s+10:3d} s: {db(z[s*SR:(s+10)*SR]):6.1f} dB")

subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "libmp3lame", "-b:a", "192k", DESTINO],
               input=z.astype(np.float32).tobytes(), check=True)
print("escrito", DESTINO)
