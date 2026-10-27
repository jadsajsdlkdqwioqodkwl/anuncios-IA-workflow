// Ayudantes que Claude inyecta en la pagina de Google Flow (con la herramienta
// javascript_tool de Claude in Chrome). NO es un modulo de Node: es codigo de
// navegador. "npm run flow:js -- <carpeta> <imagenes|videos>" lo imprime junto
// con la cola del anuncio, listo para pegar.
//
// Viven en la pagina: si la pagina se RECARGA (navigate, F5) se pierden y hay
// que volver a inyectarlos. Abrir un recurso con clic no recarga la pagina.
//
// Que resuelven (probado en Flow el 2026-10-16):
//
//  1. SUBIR ARCHIVOS. El boton "Cargar contenido multimedia" de Flow crea un
//     <input type=file> al vuelo y abre el selector de Windows, que Claude no
//     puede manejar. El parche intercepta ese input, NO abre el selector, y lo
//     deja en la pagina con aria-label "claude file input" para que la
//     herramienta file_upload le pase las rutas directamente.
//
//  2. DESCARGAR CON NOMBRE. Flow descarga con un <a download> sobre un blob y
//     un nombre propio ("Woman_closing_lunch_..._20261016185050.jpg"). El
//     parche cambia ese nombre por el de la cola ("<slug>__toma-3-inicial.jpg")
//     conservando la extension que puso Flow. El nombre se usa UNA sola vez y
//     se borra, para no renombrar por error otra descarga.
//
//  3. SABER QUE RECURSO ES CUAL. identificarPagina() busca en el texto de la
//     pagina (con el panel de informacion abierto, Flow muestra el prompt
//     completo) cual prompt de la cola esta ahi, y deja listo su nombre de
//     descarga.

(() => {
  const F = (window.__claudeFlow = window.__claudeFlow || {});
  F.version = 1;

  // --- 1. Subir archivos ----------------------------------------------------
  if (!F.parcheArchivos) {
    F.parcheArchivos = true;
    const marcar = (input) => {
      input.setAttribute('data-claude-file', '1');
      input.setAttribute('aria-label', 'claude file input');
      if (!input.isConnected) {
        input.style.display = 'none';
        document.body.appendChild(input);
      }
    };
    const clickOriginal = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () {
      if (this.type === 'file') return marcar(this);
      return clickOriginal.call(this);
    };
    if (HTMLInputElement.prototype.showPicker) {
      const pickerOriginal = HTMLInputElement.prototype.showPicker;
      HTMLInputElement.prototype.showPicker = function () {
        if (this.type === 'file') return marcar(this);
        return pickerOriginal.call(this);
      };
    }
  }

  // --- 2. Descargar con nombre ----------------------------------------------
  F.ultimas = F.ultimas || [];
  if (!F.parcheDescargas) {
    F.parcheDescargas = true;
    const anclaOriginal = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      let tipo = 'otro';
      try {
        const u = new URL(this.href);
        tipo = u.protocol === 'blob:' ? 'blob' : u.origin === location.origin ? 'mismo-origen' : 'externo';
      } catch (e) {}
      if (this.hasAttribute('download')) {
        const antes = this.download || '';
        if (F.nombre && (tipo === 'blob' || tipo === 'mismo-origen')) {
          const ext = (antes.match(/\.[a-z0-9]+$/i) || [''])[0];
          this.download = F.nombre + ext;
          F.nombre = null;
        }
        F.ultimas.push({ antes, despues: this.download, tipo, hora: new Date().toLocaleTimeString() });
      }
      return anclaOriginal.call(this);
    };
  }

  /** Fija a mano el nombre (sin extension) de la PROXIMA descarga. */
  F.nombrar = (nombre) => {
    F.nombre = nombre;
    return `la proxima descarga se llamara ${nombre}.<ext>`;
  };

  // --- 3. Cola e identificacion ---------------------------------------------
  const normal = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  F.cola = F.cola || [];
  /**
   * [{descarga, archivo, clave}] como lo arma "npm run -s flow:js": la clave es
   * un tramo del prompt que no esta en ningun otro de la cola. Tambien acepta
   * {descarga, archivo, prompt} (el prompt entero) si se carga a mano.
   */
  F.cargarCola = (trabajos) => {
    F.cola = trabajos.map((t) => ({ descarga: t.descarga, archivo: t.archivo, clave: t.clave ? normal(t.clave) : normal(t.prompt) }));
    return `${F.cola.length} trabajos cargados`;
  };

  /**
   * Con un recurso abierto y su prompt visible (panel de informacion en
   * imagenes, "Mostrar historial" en videos): devuelve que trabajo de la cola
   * es y deja su nombre listo para la proxima descarga. Si el recurso no es de
   * la cola (por ejemplo la imagen de un video con el mismo titulo), no nombra
   * nada y devuelve error: asi nunca se descarga algo con un nombre ajeno.
   */
  F.identificarPagina = () => {
    if (!F.cola.length) return { error: 'No hay cola cargada: corre npm run flow:js y pega su salida.' };
    const texto = normal(document.body.innerText);
    let candidatos = F.cola.filter((t) => t.clave && texto.includes(t.clave));
    if (candidatos.length === 0) candidatos = F.cola.filter((t) => t.clave && texto.includes(t.clave.slice(0, 400)));
    if (candidatos.length === 0) return { error: 'Ningun prompt de la cola aparece en la pagina. Abre el panel de informacion (boton "Mostrar informacion del recurso").' };
    if (candidatos.length > 1) {
      // Si un prompt contiene a otro, gana el mas largo.
      candidatos.sort((a, b) => b.clave.length - a.clave.length);
      if (candidatos[0].clave.length === candidatos[1].clave.length) {
        return { error: 'Dos trabajos tienen el mismo prompt', candidatos: candidatos.map((c) => c.descarga) };
      }
    }
    const t = candidatos[0];
    F.nombre = t.descarga;
    return { descarga: t.descarga, archivo: t.archivo };
  };

  /** Lo que se descargo en esta pagina (para confirmar que el nombre cambio). */
  F.descargas = () => F.ultimas.slice(-10);

  return `ayudantes de Flow listos (v${F.version}); cola: ${F.cola.length}`;
})();
