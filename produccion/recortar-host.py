"""Podcast en modo esquina: recorta al host SIN fondo en los tramos que van en la esquina.

Lo lanza produccion/recortar-host.js (npm run recortar), que lee el plan, junta los
tramos de cada toma y escribe el trabajo. A mano:

    python -E -P produccion/recortar-host.py --verificar       que falta (paquetes, modelo)
    python -E -P produccion/recortar-host.py <trabajo.json>    hace el recorte

(-E -P y no -I: -I deja fuera los paquetes instalados con pip --user. Antes de Python
3.11 no existe -P y va solo -E. El .js elige solo; para revisar desde el motor:
npm run recortar -- --verificar.)

POR QUE EXISTE. En modo esquina el B-roll va a pantalla completa y el host que habla
aparece encima, recortado sin fondo, pegado a la esquina inferior de su lado (A a la
izquierda, B a la derecha, uno por vez). Asi se pidio en la prueba Cayenne
(2026-10-13): "que le quites el fondo y solo se vea el personaje superpuesto", con un
buen recorte de todo el cuerpo y la cabeza. Este es el port de la herramienta de esa
prueba (temp/cayenne-pepper-podcast/_herramientas-prueba/recortar.py), generalizada.

QUE HACE, por toma:
  1. Saca SOLO los fotogramas de los tramos (no el clip entero), ya recortados a la
     franja del host: filas Y0..Y1 (de arriba de la cabeza a antes de la mesa) en
     todo el ancho. La franja llega en pixeles en el trabajo (la calcula el .js en
     proporcion del alto: 100/1280 a 1100/1280 en el clip de la prueba).
  2. Saca la mascara con rembg + BiRefNet lite (birefnet-general-lite, en CPU) cada
     2 fotogramas mas el ultimo de cada tramo, en UN solo proceso (la computadora de prueba tiene
     16 GB: con dos procesos y un render a la vez se trabo). Los intermedios se
     interpolan. Cada mascara queda en disco apenas sale: si se corta, se retoma
     donde quedo, y si despues el tramo cambia un poco solo se calculan las nuevas.
  3. Dibuja el contorno de la manga en el borde INTERIOR (ver contorno_manga).
  4. Codifica video/recorte-toma-N.webm (VP9 con alfa, yuva420p, crf 18) desde el
     primer fotograma del primer tramo hasta el ultimo del ultimo. Entre dos tramos
     de la misma toma los fotogramas van TRANSPARENTES (no se gasta una mascara en
     lo que no se ve): por eso recorte.json dice que tramos son de verdad.
  5. Borra los fotogramas de trabajo (rgb). Las mascaras se quedan (pesan poco y
     ahorran ~35 s cada una si hay que volver a recortar); el .js las borra con
     --limpiar.

Costo medido en la prueba: 30-50 s por mascara, unos 7 min por segundo de host. El
modelo (~220 MB) se baja la primera vez a ~/.rembg/models.
"""
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

MODELO = "birefnet-general-lite"

# Contorno de la manga, en pixeles de un clip de 720x1280 (lo aprobado en la
# prueba). Se escala al ancho (y al alto, `subir`) del clip de verdad.
CONTORNO = {"ancho": 70, "curva": 0.8, "suave": 3, "toca": 4, "subir": 10}
REFERENCIA = (720, 1280)

# Paquetes que hacen falta, con el nombre que lleva pip.
PAQUETES = [("numpy", "numpy"), ("PIL", "pillow"), ("onnxruntime", "onnxruntime"), ("rembg", "rembg")]


def decir(texto):
    print(texto, flush=True)


def paquetes_faltantes():
    faltan = []
    for modulo, pip in PAQUETES:
        try:
            __import__(modulo)
        except Exception:
            faltan.append(pip)
    return faltan


def ruta_modelo():
    """Donde quedaria el modelo y si ya esta. None si rembg no lo sabe decir."""
    try:
        from rembg.sessions.birefnet_general_lite import BiRefNetSessionGeneralLite as S

        nombre = f"{S.name()}.onnx"
        existe = S.resolve_existing(nombre)
        return {"ruta": str(existe or Path(S.model_dir()) / nombre), "en_cache": existe is not None}
    except Exception:
        return None


def ram_pico_mb():
    """Pico de memoria de este proceso, en MB (para el informe). None si no se puede medir."""
    try:
        if os.name == "nt":
            import ctypes
            from ctypes import wintypes

            class PMC(ctypes.Structure):
                _fields_ = [
                    ("cb", wintypes.DWORD),
                    ("PageFaultCount", wintypes.DWORD),
                    ("PeakWorkingSetSize", ctypes.c_size_t),
                    ("WorkingSetSize", ctypes.c_size_t),
                    ("QuotaPeakPagedPoolUsage", ctypes.c_size_t),
                    ("QuotaPagedPoolUsage", ctypes.c_size_t),
                    ("QuotaPeakNonPagedPoolUsage", ctypes.c_size_t),
                    ("QuotaNonPagedPoolUsage", ctypes.c_size_t),
                    ("PagefileUsage", ctypes.c_size_t),
                    ("PeakPagefileUsage", ctypes.c_size_t),
                ]

            k32 = ctypes.windll.kernel32
            k32.GetCurrentProcess.restype = wintypes.HANDLE
            k32.K32GetProcessMemoryInfo.argtypes = [wintypes.HANDLE, ctypes.POINTER(PMC), wintypes.DWORD]
            pmc = PMC()
            pmc.cb = ctypes.sizeof(PMC)
            if not k32.K32GetProcessMemoryInfo(k32.GetCurrentProcess(), ctypes.byref(pmc), pmc.cb):
                return None
            return round(pmc.PeakWorkingSetSize / 2**20)
        import resource

        pico = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        return round(pico / 2**20) if sys.platform == "darwin" else round(pico / 1024)
    except Exception:
        return None


def verificar():
    faltan = paquetes_faltantes()
    return {
        "python": sys.version.split()[0],
        "faltan": faltan,
        "modelo": None if "rembg" in faltan else ruta_modelo(),
    }


# ---------------------------------------------------------------- fotogramas


def extraer(clip, destino, i0, i1, franja, ancho):
    """Los fotogramas i0..i1 (contados desde 0) del clip, ya recortados a la franja,
    como destino/fNNNNN.png con su numero de fotograma del clip.

    Se eligen por numero de fotograma (select), no por tiempo: un -ss puede caer un
    fotograma antes o despues. passthrough para que ffmpeg no rellene con copias el
    hueco desde el segundo 0 hasta el primer fotograma elegido."""
    y0, y1 = franja
    filtro = f"select=between(n\\,{i0}\\,{i1}),crop={ancho}:{y1 - y0}:0:{y0}"
    base = ["ffmpeg", "-v", "error", "-y", "-i", str(clip), "-vf", filtro]
    salida = ["-start_number", str(i0), str(destino / "f%05d.png")]
    r = subprocess.run(base + ["-fps_mode", "passthrough"] + salida, capture_output=True, text=True)
    if r.returncode != 0 and "fps_mode" in (r.stderr or ""):
        # ffmpeg viejo (antes de 5.1): la misma opcion se llamaba -vsync.
        r = subprocess.run(base + ["-vsync", "passthrough"] + salida, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg no pudo sacar los fotogramas de {Path(clip).name}: {(r.stderr or '').strip()[-400:]}")
    faltan = [i for i in range(i0, i1 + 1) if not (destino / f"f{i:05d}.png").exists()]
    if faltan:
        raise RuntimeError(
            f"{Path(clip).name}: ffmpeg no saco {len(faltan)} fotograma(s) del tramo {i0}-{i1} "
            f"(el primero que falta: {faltan[0]}). El clip es mas corto de lo que dice ffprobe?"
        )


def claves_de(i0, i1):
    """Fotogramas con mascara propia: uno de cada dos mas el ultimo del tramo."""
    claves = list(range(i0, i1 + 1, 2))
    if claves[-1] != i1:
        claves.append(i1)
    return claves


# ---------------------------------------------------------------- contorno de la manga


def borde_que_toca(mascaras, toca):
    """Cuantas filas del cuerpo tocan cada borde (izquierdo, derecho), sumadas en
    unas mascaras. Sirve para decir por donde sale la manga."""
    izq = der = 0
    for a in mascaras:
        izq += int((a[:, :toca].max(axis=1) > 128).sum())
        der += int((a[:, -toca:].max(axis=1) > 128).sum())
    return izq, der


def contorno_manga(a, borde, p):
    """El brazo que se sale por el borde INTERIOR del clip (el que cae dentro de la
    pantalla: el izquierdo del clip si el host va en recorte-derecha, el derecho si va
    en recorte-izquierda) no tiene contorno: quedaria cortado en linea recta. Desde la
    fila donde el cuerpo toca ese borde se le dibuja uno: una curva que entra hasta
    `ancho` px en la ultima fila, con borde suave. Asi la manga sale por el borde de
    abajo de la pantalla, como un cuerpo cortado por el cuadro. El borde exterior no se
    toca: coincide con el borde de la pantalla. Aprobado en la prueba (2026-10-13):
    desvanecer el borde se veia como una mancha."""
    import numpy as np

    if borde is None:
        return a
    espejo = borde == "derecho"
    if espejo:
        a = a[:, ::-1]
    toca = np.where(a[:, : p["toca"]].max(axis=1) > 128)[0]
    if len(toca):
        y0 = max(0, int(toca.min()) - p["subir"])
        alto, w = a.shape
        ys = np.arange(alto, dtype=np.float32)[:, None]
        xs = np.arange(w, dtype=np.float32)[None, :]
        corte = p["ancho"] * np.clip((ys - y0) / max(1, alto - 1 - y0), 0, 1) ** p["curva"]
        factor = np.clip((xs - corte) / p["suave"], 0, 1)
        factor[:y0] = 1
        a = a * factor
    return a[:, ::-1] if espejo else a


def parametros_contorno(ancho, alto):
    ex, ey = ancho / REFERENCIA[0], alto / REFERENCIA[1]
    return {
        "ancho": CONTORNO["ancho"] * ex,
        "curva": CONTORNO["curva"],
        "suave": max(1.0, CONTORNO["suave"] * ex),
        "toca": max(1, round(CONTORNO["toca"] * ex)),
        "subir": max(1, round(CONTORNO["subir"] * ey)),
    }


# ---------------------------------------------------------------- una toma


def preparar_carpeta(d, t, modelo):
    """La carpeta de trabajo de la toma. Si el clip o la franja cambiaron (se regenero
    la toma, se cambio la franja) las mascaras viejas no valen: se borra todo."""
    firma = {"clip": Path(t["clip"]).name, "bytes": t["fuente"]["bytes"], "franja": t["franja"], "modelo": modelo}
    ruta = d / "fuente.json"
    if d.exists():
        try:
            vieja = json.loads(ruta.read_text(encoding="utf-8"))
        except Exception:
            vieja = None
        if vieja != firma:
            shutil.rmtree(d)
    (d / "rgb").mkdir(parents=True, exist_ok=True)
    (d / "alfa").mkdir(parents=True, exist_ok=True)
    ruta.write_text(json.dumps(firma), encoding="utf-8")


def recortar_toma(t, trabajo, estado):
    import numpy as np
    from PIL import Image

    n = t["toma"]
    d = Path(trabajo["dirTrabajo"]) / f"toma-{n}"
    preparar_carpeta(d, t, trabajo["modelo"])
    tramos = [(int(a), int(b)) for a, b in t["tramos"]]
    ancho, (y0, y1) = t["ancho"], t["franja"]
    alto = y1 - y0
    p = parametros_contorno(ancho, t["alto"])

    for i0, i1 in tramos:
        if any(not (d / "rgb" / f"f{i:05d}.png").exists() for i in range(i0, i1 + 1)):
            extraer(t["clip"], d / "rgb", i0, i1, t["franja"], ancho)

    claves = sorted({c for i0, i1 in tramos for c in claves_de(i0, i1)})
    pendientes = [i for i in claves if not (d / "alfa" / f"a{i:05d}.png").exists()]
    decir(f"  toma {n}: {sum(b - a + 1 for a, b in tramos)} fotogramas, {len(claves)} mascaras "
          f"({len(claves) - len(pendientes)} ya hechas, {len(pendientes)} por calcular)")

    nuevas = 0
    if pendientes:
        estado.abrir()
    for k, i in enumerate(pendientes):
        t0 = time.time()
        img = Image.open(d / "rgb" / f"f{i:05d}.png").convert("RGB")
        m = estado.mascara(img)
        tmp = d / "alfa" / f"a{i:05d}.tmp.png"
        m.save(tmp)
        os.replace(tmp, d / "alfa" / f"a{i:05d}.png")
        nuevas += 1
        estado.tiempos.append(time.time() - t0)
        media = sum(estado.tiempos) / len(estado.tiempos)
        quedan = len(pendientes) - k - 1 + estado.pendientes_despues()
        decir(f"    mascara {k + 1}/{len(pendientes)} (fotograma {i}): {time.time() - t0:.0f} s"
              + (f", faltan ~{quedan * media / 60:.0f} min" if quedan else ""))

    # Por donde sale la manga: el borde interior segun el lado. Sin lado (a mano), el
    # borde que mas toca el cuerpo en las mascaras.
    muestra = [np.asarray(Image.open(d / "alfa" / f"a{c:05d}.png"), dtype=np.float32) for c in claves[:: max(1, len(claves) // 6)]]
    izq, der = borde_que_toca(muestra, p["toca"])
    lado = t.get("lado")
    if lado == "derecha":
        borde = "izquierdo"
    elif lado == "izquierda":
        borde = "derecho"
    else:
        borde = None if izq == der == 0 else ("izquierdo" if izq >= der else "derecho")
    del muestra
    toca_borde = izq if borde == "izquierdo" else der if borde == "derecho" else 0
    if borde and toca_borde:
        decir(f"    la manga toca el borde {borde} del clip (el interior): se le dibuja el contorno")
    elif borde:
        decir(f"    el cuerpo no toca el borde {borde} del clip (el interior): no hace falta contorno")

    # Componer y codificar: RGBA crudo por la entrada de ffmpeg, sin PNG intermedios.
    s0, s1 = tramos[0][0], tramos[-1][1]
    salida = Path(t["salida"])
    tmp_salida = salida.with_name(salida.stem + ".tmp.webm")
    cmd = [
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{ancho}x{alto}", "-framerate", str(t["fps"]), "-i", "-",
        "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "18", "-auto-alt-ref", "0",
        str(tmp_salida),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    vacio = np.zeros((alto, ancho, 4), dtype=np.uint8).tobytes()
    # Las mascaras de cada tramo: se interpola solo dentro del tramo (el primero y el
    # ultimo fotograma de cada uno siempre tienen la suya).
    de_tramo = {tr: [c for c in claves if tr[0] <= c <= tr[1]] for tr in tramos}
    try:
        for i in range(s0, s1 + 1):
            tramo = next(((a, b) for a, b in tramos if a <= i <= b), None)
            if tramo is None:
                proc.stdin.write(vacio)
                continue
            rgb = np.asarray(Image.open(d / "rgb" / f"f{i:05d}.png").convert("RGB"))
            disponibles = de_tramo[tramo]
            if i in disponibles:
                a = np.asarray(Image.open(d / "alfa" / f"a{i:05d}.png"), dtype=np.float32)
            else:
                antes = max(c for c in disponibles if c < i)
                despues = min(c for c in disponibles if c > i)
                w = (i - antes) / (despues - antes)
                aa = np.asarray(Image.open(d / "alfa" / f"a{antes:05d}.png"), dtype=np.float32)
                ad = np.asarray(Image.open(d / "alfa" / f"a{despues:05d}.png"), dtype=np.float32)
                a = aa * (1 - w) + ad * w
            a = contorno_manga(a, borde, p)
            proc.stdin.write(np.dstack([rgb, np.clip(a, 0, 255).astype(np.uint8)]).tobytes())
        proc.stdin.close()
    except BrokenPipeError:
        pass
    err = proc.stderr.read().decode("utf-8", "replace")
    if proc.wait() != 0:
        raise RuntimeError(f"ffmpeg no pudo codificar {salida.name}: {err.strip()[-400:]}")
    os.replace(tmp_salida, salida)

    shutil.rmtree(d / "rgb", ignore_errors=True)
    return {
        "inicio_fotograma": s0,
        "fotogramas": s1 - s0 + 1,
        "mascaras_nuevas": nuevas,
        "mascaras_reusadas": len(claves) - nuevas,
        "borde_contorno": borde,
        "toca_borde": bool(toca_borde),
    }


class Estado:
    """La sesion del modelo (una sola, se abre recien cuando hace falta una mascara) y
    los tiempos medidos, para estimar lo que falta."""

    def __init__(self, trabajo):
        self.trabajo = trabajo
        self.sesion = None
        self.tiempos = []
        # Mascaras por calcular de cada toma (por su orden en el trabajo) y la que va.
        self.restantes = {}
        self.orden = 0

    def abrir(self):
        if self.sesion is None:
            decir("  abriendo el modelo (BiRefNet lite, CPU)...")
            info = ruta_modelo()
            if info and not info["en_cache"]:
                decir(f"  el modelo no esta en {info['ruta']}: se baja ahora (~220 MB, una sola vez)")
            import onnxruntime as ort
            from rembg import new_session

            opciones = ort.SessionOptions()
            # Menos RAM, misma mascara: sin la reserva de memoria ni el patron de memoria
            # de onnxruntime. Medido el 2026-10-14 en la computadora de prueba (16 GB) con un fotograma
            # de 720x1000: pico de 7,9 GB con lo de siempre y 6,1 GB asi, con mascaras
            # identicas pixel a pixel y la misma velocidad. Con menos hilos no baja.
            opciones.enable_cpu_mem_arena = False
            opciones.enable_mem_pattern = False
            try:
                self.sesion = new_session(self.trabajo["modelo"], sess_opts=opciones, providers=["CPUExecutionProvider"])
            except Exception as e:
                raise RuntimeError(
                    f"no pude abrir el modelo {self.trabajo['modelo']} ({e}). Si es la primera vez, hace falta "
                    "internet para bajarlo (~220 MB)."
                )

    def mascara(self, img):
        from rembg import remove

        self.abrir()
        return remove(img, session=self.sesion, only_mask=True)

    def pendientes_despues(self):
        """Las mascaras que les tocan a las tomas que vienen despues de la actual."""
        return sum(v for k, v in self.restantes.items() if k > self.orden)


def main():
    if len(sys.argv) < 2:
        decir(__doc__)
        sys.exit(1)
    if sys.argv[1] == "--verificar":
        print(json.dumps(verificar()))
        return

    faltan = paquetes_faltantes()
    if faltan:
        decir(f"\n  Faltan paquetes de Python: {', '.join(faltan)}.")
        decir(f"  Instalalos con:  python -m pip install --user {' '.join(faltan)}")
        decir("  y comprueba con:  npm run recortar -- --verificar\n")
        sys.exit(3)

    trabajo = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    os.environ["OMP_NUM_THREADS"] = str(trabajo.get("hilos") or 8)
    estado = Estado(trabajo)
    tomas = trabajo["tomas"]
    # Para el "faltan ~N min": las mascaras que les tocan a las tomas que vienen despues.
    for orden, t in enumerate(tomas):
        d = Path(trabajo["dirTrabajo"]) / f"toma-{t['toma']}" / "alfa"
        claves = {c for a, b in t["tramos"] for c in claves_de(int(a), int(b))}
        estado.restantes[orden] = sum(1 for c in claves if not (d / f"a{c:05d}.png").exists())

    resultado = {"tomas": {}, "errores": {}}
    t_inicio = time.time()
    for orden, t in enumerate(tomas):
        estado.orden = orden
        try:
            r = recortar_toma(t, trabajo, estado)
            resultado["tomas"][str(t["toma"])] = r
            decir(f"  listo {Path(t['salida']).name}: {r['fotogramas']} fotogramas desde el {r['inicio_fotograma']}")
        except Exception as e:
            resultado["errores"][str(t["toma"])] = str(e)
            decir(f"  toma {t['toma']}: ERROR. {e}")

    resultado["segundos"] = round(time.time() - t_inicio)
    resultado["ram_pico_mb"] = ram_pico_mb()
    resultado["segundos_por_mascara"] = round(sum(estado.tiempos) / len(estado.tiempos), 1) if estado.tiempos else None
    Path(trabajo["resultado"]).write_text(json.dumps(resultado, indent=2), encoding="utf-8")
    sys.exit(1 if resultado["errores"] else 0)


if __name__ == "__main__":
    main()
