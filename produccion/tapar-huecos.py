# Tapa los huecos SEMITRANSPARENTES dentro de la figura de un icono (estilos
# hablados, clase icono).
#
#   python -E -P produccion/tapar-huecos.py entrada.png salida.png
#
# (-E -P y no -I: -I deja fuera los paquetes instalados con pip --user, que es
# donde pip los pone en un Python instalado para todos. Antes de Python 3.11 no
# existe -P y va solo -E; generar-imagenes.js elige solo.)
#
# gpt-image-2 a veces deja una mancha semitransparente DENTRO de la figura (el
# centro de un sol, el cielo de una luna): sobre el video se ve como un agujero
# por donde asoma la calle. Esto la tapa:
#
#   1. Figura opaca = alfa > SOLIDO. El cuerpo de estos iconos queda en 251-254,
#      no en 255, por eso el umbral es 250 y no 254.
#   2. Region candidata = grupo de pixeles con alfa <= SOLIDO, conectados entre
#      si (8 vecinos), que NO llega al borde de la imagen: el fondo transparente
#      siempre llega al borde y nunca se toca.
#   3. Se descartan sin decir nada: las regiones de menos de MIN_PX pixeles y las
#      que nunca bajan de CUERPO_DESDE (alfa 245-250 es el mismo ruido que tiene
#      todo el cuerpo opaco de estos iconos: no se ve).
#   4. Se RESPETAN (no se tocan, se informan): las que tienen un nucleo totalmente
#      transparente (al menos FRACCION_VACIA de sus pixeles con alfa <= VACIO),
#      que pueden ser a proposito (un anillo, el asa de una taza, una letra O); y
#      las grandes respecto de la figura (mas de MAX_REGION_FIGURA de la silueta,
#      o su parte que se ve a traves, alfa <= SE_VE, mas de MAX_SE_VE_FIGURA),
#      que pueden ser una parte translucida del dibujo (un vaso).
#   5. Las demas se rellenan: el color (y el alfa) de los vecinos opacos se
#      difunde hacia adentro capa por capa y se suaviza. Despues cada pixel se
#      mezcla con el color que ya tenia segun su alfa: de CUERPO_DESDE para
#      arriba es cuerpo y conserva su color (en 250 entero, en 245 nada); mas
#      transparente que eso es hueco y toma el relleno. No se mezcla en linea
#      recta (alfa/255) porque el modelo, ademas de dejar transparente el hueco,
#      le OSCURECE el color: con la mezcla lineal el sol de Befem quedaba con una
#      mancha oscura en el centro (luminancia -6 de media, -16 en el 5 % peor);
#      asi queda en -0,6 y -2,7, que no se ve. El alfa queda como si el pixel
#      estuviera encima del relleno (alfa + (1 - alfa) * alfa del relleno): opaco
#      como la figura. El borde del hueco empalma solo con los vecinos opacos,
#      que son de donde sale el relleno. Sin costuras.
#
# Imprime UNA linea JSON en stdout:
#   { "pixelesTapados": N, "figura": px de la silueta, "tapadas": [region...],
#     "respetadas": [region + "motivo": "transparente" | "grande"],
#     "salida": ruta o null }
#   region = { "x", "y", "ancho", "alto", "pixeles", "alfaMinimo" }
# Solo escribe la salida si tapo algo (pixelesTapados > 0). Si falta un paquete
# o la imagen no se puede leer: { "error": "...", "faltan": [...] } y codigo 2
# (paquetes) o 1 (otro error). Necesita Pillow y numpy (sin OpenCV ni scipy).

import json
import sys

SOLIDO = 250
CUERPO_DESDE = 245
SE_VE = 200
VACIO = 3
FRACCION_VACIA = 0.10
MIN_PX = 30
MAX_REGION_FIGURA = 0.25
MAX_SE_VE_FIGURA = 0.10
PASADAS_SUAVIZADO = 40


def responder(datos, codigo=0):
    print(json.dumps(datos, ensure_ascii=False, separators=(',', ':')))
    sys.exit(codigo)


faltan = []
try:
    import numpy as np
except ImportError:
    faltan.append('numpy')
try:
    from PIL import Image
except ImportError:
    faltan.append('pillow')
if faltan:
    responder({'error': 'faltan paquetes de Python: ' + ', '.join(faltan), 'faltan': faltan}, 2)


def etiquetar(mascara):
    """Componentes 8-conexas de una mascara booleana, por tramos de fila con
    union-find (sin scipy). Devuelve (etiquetas HxW int32 con 0 = fuera,
    lista de componentes con n, caja y si tocan el borde)."""
    alto, ancho = mascara.shape
    padre = []

    def raiz(i):
        while padre[i] != i:
            padre[i] = padre[padre[i]]
            i = padre[i]
        return i

    tramos = []
    anterior = []
    m8 = mascara.astype(np.int8)
    for y in range(alto):
        d = np.diff(np.concatenate(([0], m8[y], [0])))
        inicios = np.flatnonzero(d == 1).tolist()
        fines = (np.flatnonzero(d == -1) - 1).tolist()
        actuales = []
        j = 0
        for x0, x1 in zip(inicios, fines):
            k = len(tramos)
            tramos.append((y, x0, x1))
            padre.append(k)
            actuales.append(k)
            # Tramos de la fila de arriba que tocan a este (8 vecinos: x0-1..x1+1).
            while j < len(anterior) and tramos[anterior[j]][2] < x0 - 1:
                j += 1
            jj = j
            while jj < len(anterior) and tramos[anterior[jj]][1] <= x1 + 1:
                a, b = raiz(k), raiz(anterior[jj])
                if a != b:
                    padre[max(a, b)] = min(a, b)
                jj += 1
        anterior = actuales

    etiquetas = np.zeros((alto, ancho), np.int32)
    ids = {}
    comps = []
    for k, (y, x0, x1) in enumerate(tramos):
        r = raiz(k)
        if r not in ids:
            ids[r] = len(comps) + 1
            comps.append({'n': 0, 'x0': x0, 'y0': y, 'x1': x1, 'y1': y, 'borde': False})
        c = comps[ids[r] - 1]
        etiquetas[y, x0:x1 + 1] = ids[r]
        c['n'] += x1 - x0 + 1
        c['x0'] = min(c['x0'], x0)
        c['x1'] = max(c['x1'], x1)
        c['y1'] = y
        if y == 0 or y == alto - 1 or x0 == 0 or x1 == ancho - 1:
            c['borde'] = True
    return etiquetas, comps


def suma_vecinos(x):
    """Suma de los 8 vecinos de cada pixel (fuera de la imagen cuenta 0)."""
    alto, ancho = x.shape[:2]
    p = np.pad(x, [(1, 1), (1, 1)] + [(0, 0)] * (x.ndim - 2))
    s = np.zeros_like(x)
    for dy in (0, 1, 2):
        for dx in (0, 1, 2):
            if dy == 1 and dx == 1:
                continue
            s += p[dy:dy + alto, dx:dx + ancho]
    return s


def rellenar(rgba, fuente, region):
    """Difunde el RGBA de los pixeles `fuente` (opacos) hacia `region`: capa por
    capa, cada pixel nuevo toma el promedio de sus vecinos ya conocidos; despues
    unas pasadas de suavizado (promedio de vecinos con el borde fijo) para que
    no queden vetas. Devuelve el RGBA de relleno (float) de todo el recorte."""
    val = np.where(fuente[..., None], rgba, 0.0).astype(np.float32)
    conocido = fuente.astype(np.float32)
    pendiente = region.copy()
    while pendiente.any():
        s = suma_vecinos(val * conocido[..., None])
        c = suma_vecinos(conocido)
        frente = pendiente & (c > 0)
        if not frente.any():
            break
        val[frente] = s[frente] / c[frente][:, None]
        conocido[frente] = 1.0
        pendiente &= ~frente
    for _ in range(PASADAS_SUAVIZADO):
        s = suma_vecinos(val * conocido[..., None])
        c = suma_vecinos(conocido)
        nuevo = s / np.maximum(c, 1.0)[..., None]
        val[region] = nuevo[region]
    return val


def caja(c):
    return {'x': c['x0'], 'y': c['y0'], 'ancho': c['x1'] - c['x0'] + 1, 'alto': c['y1'] - c['y0'] + 1}


def main():
    if len(sys.argv) != 3:
        responder({'error': 'uso: python -E -P produccion/tapar-huecos.py entrada.png salida.png'}, 1)
    entrada, salida = sys.argv[1], sys.argv[2]
    try:
        img = Image.open(entrada)
        img.load()
    except Exception as e:  # noqa: BLE001 - cualquier fallo de lectura se informa igual
        responder({'error': 'no pude leer %s: %s' % (entrada, e)}, 1)

    if 'A' not in img.getbands() and 'transparency' not in img.info:
        # Sin canal alfa (el modelo de respaldo ignora el fondo): no hay huecos.
        responder({'pixelesTapados': 0, 'figura': None, 'tapadas': [], 'respetadas': [], 'salida': None, 'sinAlfa': True})

    rgba = np.array(img.convert('RGBA'))
    alfa = rgba[:, :, 3].astype(np.int32)
    alto, ancho = alfa.shape

    etiquetas, comps = etiquetar(alfa <= SOLIDO)
    planas = etiquetas.ravel()
    total = len(comps) + 1
    vacios = np.bincount(planas, weights=(alfa.ravel() <= VACIO), minlength=total)
    seVen = np.bincount(planas, weights=(alfa.ravel() <= SE_VE), minlength=total)
    minimos = np.full(total, 255, np.int32)
    np.minimum.at(minimos, planas, alfa.ravel())

    # La silueta: todo lo que no es fondo (el fondo es lo transparente que llega al borde).
    figura = alto * ancho - sum(c['n'] for c in comps if c['borde'])

    salida_rgba = rgba.copy()
    tapadas, respetadas = [], []
    tapados = 0
    for i, c in enumerate(comps, start=1):
        if c['borde'] or c['n'] < MIN_PX or minimos[i] >= CUERPO_DESDE:
            continue
        info = dict(caja(c), pixeles=int(c['n']), alfaMinimo=int(minimos[i]))
        if vacios[i] >= FRACCION_VACIA * c['n']:
            respetadas.append(dict(info, motivo='transparente'))
            continue
        if c['n'] > MAX_REGION_FIGURA * figura or seVen[i] > MAX_SE_VE_FIGURA * figura:
            respetadas.append(dict(info, motivo='grande'))
            continue

        # Recorte con 1 pixel de margen: alcanza, porque todo vecino de la region
        # que no es de la region es opaco (la region es maximal).
        y0, y1 = max(0, c['y0'] - 1), min(alto, c['y1'] + 2)
        x0, x1 = max(0, c['x0'] - 1), min(ancho, c['x1'] + 2)
        recorte = rgba[y0:y1, x0:x1].astype(np.float32)
        region = etiquetas[y0:y1, x0:x1] == i
        fuente = recorte[:, :, 3] > SOLIDO
        relleno = rellenar(recorte, fuente, region)

        # Mezcla segun el alfa de cada pixel: el cuerpo (CUERPO_DESDE..SOLIDO)
        # conserva su color; el hueco toma el relleno. El alfa, como si el pixel
        # estuviera encima del relleno.
        alfa_reg = recorte[:, :, 3][region]
        peso = np.clip((alfa_reg - CUERPO_DESDE) / float(SOLIDO - CUERPO_DESDE), 0.0, 1.0)
        rgb = peso[:, None] * recorte[:, :, :3][region] + (1.0 - peso)[:, None] * relleno[:, :, :3][region]
        alfa_nuevo = alfa_reg + (1.0 - alfa_reg / 255.0) * relleno[:, :, 3][region]
        nuevo = np.concatenate([rgb, alfa_nuevo[:, None]], axis=1)
        bloque = salida_rgba[y0:y1, x0:x1]
        bloque[region] = np.clip(np.rint(nuevo), 0, 255).astype(np.uint8)

        tapadas.append(info)
        tapados += int(c['n'])

    if tapados:
        Image.fromarray(salida_rgba, 'RGBA').save(salida, 'PNG')
    responder({
        'pixelesTapados': tapados,
        'figura': int(figura),
        'tapadas': tapadas,
        'respetadas': respetadas,
        'salida': salida if tapados else None,
    })


main()
