// Escribe plan-montaje.txt: la hoja de ruta para editar el anuncio A MANO.
//
//   node produccion/plan-para-humanos.js temp/mi-anuncio
//
// La Fase 2.5 (montaje automatico en Remotion) es OPCIONAL. Quien prefiera
// editar en CapCut se lleva los clips y este archivo, y no tiene que adivinar
// nada: que clip va con que linea, en que segundo, y que B-roll le toca.
//
// Se genera al terminar los videos, corra o no la 2.5.

import fs from 'node:fs';
import path from 'node:path';
import { tomaDelBroll, listaDeReferencias, esGenerada, esAportada, esLugarDeToma, archivoDeHoja } from './referencias.js';
import { RAIZ, ESTILOS_HABLADOS } from './config.js';
import { tieneContinuidad, cadenaDeClips, medirCadena, planearContinuidad } from './continuidad.js';
// Solo para los estilos hablados: las reglas del montaje (una sola fuente con
// el plan), la palabra donde cae el check, la velocidad del paso voz y si la
// medida de un clip es de ESE clip (lineas-habladas.js ya lo carga
// planear-montaje.js). Ninguno de los tres modulos corre nada al importarse.
import { REGLAS_HABLADO, palabraElegida } from './planear-montaje.js';
import { REGLAS_VOZ } from './recortar-voz.js';
import { estadoDeMedidaDelClip, leerMedidas } from './lineas-habladas.js';

const seg = (s) => {
  const m = Math.floor(s / 60);
  const r = (s % 60).toFixed(2).padStart(5, '0');
  return `${String(m).padStart(2, '0')}:${r}`;
};

/**
 * Plan de un anuncio POR BLOQUES (UGC, tomas tipo R). Va aparte porque casi
 * nada del plan de siempre aplica: no hay voz en off, ni B-roll, ni frames.
 * Lo que si hace falta: cada BLOQUE con sus tramos y lineas, las referencias
 * con que se genero (por si alguien lo rehace a mano), el corte de cola si el
 * clip repite el final, y los ganchos alternativos.
 */
function escribirPlanBloques(carpeta, manifiesto) {
  const L = [];
  const nombre = path.basename(carpeta);
  const rel = path.relative(RAIZ, carpeta);
  const carpetaCmd = rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.replace(/\\/g, '/') : carpeta;

  const rutaPlan = path.join(carpeta, 'plan-montaje.json');
  const plan = fs.existsSync(rutaPlan) ? JSON.parse(fs.readFileSync(rutaPlan, 'utf8')) : null;
  const bloquePorToma = new Map((plan?.bloques || []).map((b) => [b.linea, b]));

  const lista = listaDeReferencias(manifiesto);
  const archivoDeRef = (id) => {
    const r = lista.find((x) => x.id === id);
    // Lugar repetido: el fotograma que el motor saco de otro bloque.
    if (r && esLugarDeToma(r)) return `img/${archivoDeHoja(r)}   (fotograma del bloque ${r.de_toma}, segundo ${r.segundo})`;
    if (r && esGenerada(r)) return `img/${archivoDeHoja(r)}`;
    if (r && esAportada(r)) return r.archivo;
    return '(no esta en la lista de referencias)';
  };
  const s1 = (x) => Number(x).toFixed(1);
  const tramos = (b, sangria) => {
    for (const tr of b.tramos || []) {
      const quien = tr.habla ? ` [${tr.habla}]` : '';
      L.push(`${sangria}[${s1(tr.desde)}–${s1(tr.hasta)}s]${quien}  ${tr.linea ? `"${tr.linea}"` : '(sin dialogo)'}`);
    }
  };
  const referencias = (b, sangria) => {
    (b.referencias || []).forEach((id, i) => L.push(`${sangria}${i + 1}) ${id.padEnd(14)} -> ${archivoDeRef(id)}`));
  };

  L.push('='.repeat(78));
  L.push(`PLAN DE MONTAJE — ${nombre}`);
  L.push('='.repeat(78));
  L.push('');
  L.push('Esto es para armar el anuncio a mano (CapCut, Premiere, lo que uses).');
  L.push('Todos los archivos que se nombran estan en esta misma carpeta.');
  L.push('');
  L.push('ANUNCIO POR BLOQUES (UGC). Cada bloque es un clip de 4 a 10 s donde la persona');
  L.push('habla con su propia voz, con lip-sync. No hay voz en off ni B-roll.');
  L.push('');
  L.push('REGLA MADRE: manda el clip. Los bloques van en orden y en corte seco; la');
  L.push('duracion del anuncio es la suma de los bloques ya recortados.');
  L.push('');
  L.push('LO QUE NO SE HACE, NUNCA:');
  L.push('  - No aceleres un bloque hablado: deforma la voz y desincroniza la boca.');
  L.push('  - No cortes por DENTRO del dialogo: ahi vive el lip-sync.');
  L.push(`  Si un bloque no sirve, se REGENERA (npm run rehacer -- ${carpetaCmd} N). No se ajusta.`);
  L.push('');
  L.push('LO QUE SI: recorta el silencio del principio y del final de cada bloque. Si al');
  L.push('final repite palabras que ya dijo, cortalas (abajo se indica donde, si se midio).');
  L.push('');
  L.push('-'.repeat(78));
  L.push('');

  let acumulado = 0;
  for (const t of manifiesto.tomas) {
    let inicio = acumulado;
    let fin = acumulado + t.duracion;
    const b = bloquePorToma.get(t.n);
    if (b) {
      // Tiempos reales del plan: la ventana es lo que dura el clip recortado.
      inicio = b.inicio;
      fin = b.fin;
    }
    acumulado = fin;

    L.push(`BLOQUE ${t.n}   (${t.duracion} s, tipo R)${t.fase ? `   — ${t.fase}` : ''}`);
    L.push(`  Cuando:   ${seg(inicio)} -> ${seg(fin)}   (${(fin - inicio).toFixed(2)}s de ventana)`);
    L.push(`  Clip:     video/toma-${t.n}.mp4`);
    L.push('  Tramos:');
    tramos(t, '            ');
    L.push(`  Dice:     "${t.linea}"`);
    L.push('  Referencias con que se genera (en este orden, como "ingredientes", no como');
    L.push('  imagen de inicio):');
    referencias(t, '            ');
    if (b?.toma?.recorteInicio !== undefined) {
      L.push(`  Recorte:  ${b.toma.recorteInicio.toFixed(2)}s del INICIO y ${b.toma.recorteFin.toFixed(2)}s del FINAL.`);
      L.push(`            Quedan ${b.toma.duracion.toFixed(2)}s utiles de los ${b.toma.largoOriginal.toFixed(2)}s del clip.`);
      // Sin el "OJO: pausas DENTRO del dialogo" de las otras tomas: en un
      // bloque R las pausas son los cortes entre tramos y el tramo mudo.
    } else {
      L.push('  Recorte:  el silencio de los bordes (mira donde empieza y termina de hablar).');
    }
    // Cola medida por cortar-cola-ugc.js: despues de la ultima palabra del
    // guion el clip siguio hablando (suele repetir el final).
    //
    // Con plan, manda lo que el plan APLICO (b.toma.corteDeCola): si el clip
    // cambio despues de medir, planear-montaje ignora la cola y aqui no se
    // puede decir otra cosa. Sin plan, se muestra lo medido.
    const rutaCola = path.join(carpeta, `toma-${t.n}.cola.json`);
    if (fs.existsSync(rutaCola)) {
      try {
        const cola = JSON.parse(fs.readFileSync(rutaCola, 'utf8'));
        const aplicado = b ? (Number.isFinite(b.toma?.corteDeCola) ? b.toma.corteDeCola : null) : cola.fin;
        const finPorSilencio = b?.toma?.largoOriginal !== undefined ? b.toma.largoOriginal - b.toma.recorteFin : null;
        if (typeof aplicado === 'number') {
          L.push(`            OJO: despues de la ultima palabra del guion sigue hablando. El bloque`);
          L.push(`            termina en el segundo ${aplicado.toFixed(2)} del clip; lo que viene despues se corta.`);
          if (cola.motivo) L.push(`            (${cola.motivo})`);
        } else if (typeof cola.fin === 'number' && !(finPorSilencio !== null && finPorSilencio <= cola.fin + 0.001)) {
          // Hay una cola medida que el plan no aplico, y no porque el silencio
          // ya cortara antes: se midio sobre otro clip, o el plan es anterior.
          L.push(`            OJO: hay un corte de cola medido (toma-${t.n}.cola.json, ${cola.fin.toFixed(2)}s) que`);
          L.push('            este plan NO aplica: o el clip cambio despues de medirlo, o el plan es');
          L.push(`            anterior. Vuelve a correr: npm run ugc:cola -- ${carpetaCmd} --tomas ${t.n}  y  npm run plan`);
        }
      } catch {
        L.push(`            (toma-${t.n}.cola.json no se pudo leer: revisa el final a mano)`);
      }
    }
    L.push('            NO lo aceleres ni le cortes por dentro: rompe el lip-sync.');
    L.push('');
  }

  const ganchos = Array.isArray(manifiesto.ganchos_alternativos) ? manifiesto.ganchos_alternativos : [];
  if (ganchos.length) {
    L.push('-'.repeat(78));
    L.push('');
    L.push('GANCHOS ALTERNATIVOS (opcionales, para probar en Meta cual vende mas)');
    L.push('Cada uno es otra version completa del bloque que reemplaza. El resto del anuncio');
    L.push('no cambia: se arma una version del anuncio por gancho.');
    L.push('');
    for (const g of ganchos) {
      const clip = `video/gancho-${g.id}.mp4`;
      const hecho = fs.existsSync(path.join(carpeta, clip));
      L.push(`GANCHO ${g.id}   (${g.duracion} s) — reemplaza al BLOQUE ${g.reemplaza}`);
      L.push(`  Clip:     ${clip}${hecho ? '' : `   (todavia no generado: npm run videos -- ${carpetaCmd} --ganchos)`}`);
      L.push('  Tramos:');
      tramos(g, '            ');
      L.push(`  Dice:     "${g.linea}"`);
      L.push(`  Version del anuncio con este gancho:  npm run ugc:gancho -- ${carpetaCmd} ${g.id}`);
      L.push(`  (a mano: la misma linea de tiempo, cambiando solo el bloque ${g.reemplaza} por este clip)`);
      L.push('');
    }
  }

  L.push('-'.repeat(78));
  L.push('');
  L.push('SUBTITULOS, TEXTO EN PANTALLA Y MUSICA');
  L.push('  Van en el montaje, nunca dentro de los clips. Musica baja, unos -22 dB por');
  L.push('  debajo de la voz.');
  L.push('');
  L.push('AUDIO DE LOS CLIPS');
  L.push('  La voz viene DENTRO de cada clip, con el ambiente del lugar. No se le agrega');
  L.push('  narracion. Un fade corto (~80ms) en cada corte evita que suene seco.');
  L.push('');
  L.push('='.repeat(78));

  const salida = path.join(carpeta, 'plan-montaje.txt');
  fs.writeFileSync(salida, L.join('\n') + '\n', 'utf8');
  return salida;
}

/**
 * Plan de un anuncio con CONTINUIDAD (el manifiesto trae el bloque; ver
 * produccion/continuidad.js). Va aparte porque las reglas son otras: no hay
 * una toma por linea sino una cadena de clips seguidos, cada uno de una imagen
 * a la siguiente, y NO SE CORTA NADA, ni principio ni final: solo cambia la
 * velocidad. Los segundos y las velocidades salen del mismo reparto que el
 * montaje automatico (planearContinuidad), con los clips que hay en disco.
 */
function escribirPlanContinuidad(carpeta, manifiesto) {
  const L = [];
  const nombre = path.basename(carpeta);
  const rutaTiempos = path.join(carpeta, 'audio', 'tiempos.json');
  const tiempos = fs.existsSync(rutaTiempos) ? JSON.parse(fs.readFileSync(rutaTiempos, 'utf8')) : null;
  const dirVideo = path.join(carpeta, 'video');
  const cadena = cadenaDeClips(manifiesto, { estimar: true, tiempos });

  // Los clips de respaldo (para avisar) y los que van mudos por voz colada.
  const leerJson = (ruta) => {
    try {
      return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')) : null;
    } catch {
      return null;
    }
  };
  const log = leerJson(path.join(dirVideo, 'log-modelos.json'));
  const respaldo = (Array.isArray(log?.clips) ? log.clips : []).filter((c) => c?.respaldo === true).map((c) => c.archivo);
  const silenciar = leerJson(path.join(carpeta, 'silenciar.json'));
  const mudos = new Set(manifiesto.clips_mudos === true ? cadena.map((c) => c.archivo) : Array.isArray(silenciar?.clips) ? silenciar.clips : []);

  let plan = null;
  let porQueSinTiempos = null;
  if (!tiempos) {
    porQueSinTiempos = 'todavia no hay voz, y los segundos salen de ella.';
  } else {
    try {
      const largos = fs.existsSync(dirVideo) ? medirCadena(dirVideo, cadena) : new Map();
      plan = planearContinuidad({ manifiesto, tiempos, largos, respaldo });
    } catch (e) {
      porQueSinTiempos = e.message;
    }
  }

  L.push('='.repeat(78));
  L.push(`PLAN DE MONTAJE — ${nombre}`);
  L.push('='.repeat(78));
  L.push('');
  L.push('Esto es para armar el anuncio a mano (CapCut, Premiere, lo que uses).');
  L.push('Todos los archivos que se nombran estan en esta misma carpeta.');
  L.push('');
  if (tiempos) {
    L.push(`VOZ EN OFF:  audio/voz.mp3        duracion ${tiempos.duracion.toFixed(2)}s`);
    L.push(`             voz: ${tiempos.voz.nombre}${tiempos.voz.clonada ? ' (clonada)' : ''}`);
    L.push('');
    L.push('REGLA MADRE: manda el audio. Pon el mp3 en la linea de tiempo primero');
    L.push('y calza cada clip en su lugar. El video se adapta a la voz, nunca al reves.');
  } else {
    L.push('VOZ EN OFF:  todavia no generada (npm run audio -- <carpeta>)');
  }
  L.push('');
  L.push('CONTINUIDAD: el anuncio se ve como UNA sola toma. Cada clip arranca en la');
  L.push('imagen donde termino el anterior, y el paso de una escena a la siguiente ya');
  L.push('viene DENTRO del clip. Van todos seguidos, en este orden, sin huecos.');
  L.push('');
  L.push('LO QUE NO SE HACE, NUNCA:');
  L.push('  - No cortes nada, ni el principio ni el final de ningun clip: solo se');
  L.push('    cambia la velocidad. Un corte hace saltar la imagen en la union.');
  L.push('  - No pongas transiciones del editor (woosh, zoom, deslizamientos, fundidos)');
  L.push('    ni metas otros clips en medio: el paso entre escenas ya lo hace cada clip.');
  L.push('');
  L.push('COMO SE AJUSTA: cada clip entra en el segundo que dice abajo, a la velocidad');
  L.push('que dice abajo, y termina justo donde entra el siguiente. Si tu editor no');
  L.push('deja poner el numero exacto: velocidad = largo del clip / lo que dura en la');
  L.push('linea de tiempo.');
  if (plan) {
    const r = plan.reglas;
    L.push(`En una frase muy corta, la imagen nueva puede llegar hasta ${r.temprano}s antes o`);
    L.push(`${r.tarde}s despues de su frase: es a proposito, para no acelerar de mas.`);
  }
  L.push('En una toma con imagen inicial y final, su frase se reparte entre sus dos');
  L.push('clips (el suyo y el paso a la siguiente) a la MISMA velocidad.');
  L.push('');
  L.push('-'.repeat(78));
  L.push('');

  const tomas = manifiesto.tomas;
  if (plan) {
    const porArchivo = new Map(plan.clips.map((x) => [x.archivo, x]));
    const porLinea = new Map(plan.bloques.map((b) => [b.linea, b]));
    for (const u of plan.unidades) {
      const t = tomas.find((x) => x.n === u.linea);
      const b = porLinea.get(u.linea);
      L.push(`TOMA ${t.n}   (tipo ${t.tipo})`);
      L.push(`  Frase:    ${seg(b.inicio)} -> ${seg(b.fin)}   (${b.ventana.toFixed(2)}s)`);
      L.push(`  Dice:     "${t.linea}"`);
      u.clips.forEach((archivo, j) => {
        const x = porArchivo.get(archivo);
        const c = cadena.find((y) => y.archivo === archivo);
        const de = c.imagenFinal ? `de ${c.imagenInicial.replace('.png', '')} a ${c.imagenFinal.replace('.png', '')}` : `arranca en ${c.imagenInicial.replace('.png', '')}`;
        L.push(`  ${j + 1}) video/${archivo}   (${x.largoOriginal.toFixed(2)}s, ${de})${x.falta ? '   FALTA: todavia no esta en video/' : ''}`);
        L.push(`     Entra en ${seg(x.desde)} y termina en ${seg(x.hasta)}, a ${x.velocidad.toFixed(2)}x. Entero: sin cortarle nada.`);
        if (mudos.has(archivo)) L.push('     Volumen a 0: trae una voz colada (la imagen va igual).');
        if (x.respaldo) L.push('     Salio del modelo de respaldo: mira que arranque y llegue a sus imagenes.');
      });
      if (u.ultima) {
        L.push(`     Es el cierre: termina con el audio, en ${seg(plan.duracion)}.`);
      } else if (Math.abs(u.deriva) < 0.005) {
        L.push(`     La imagen de la toma ${u.aToma} llega justo cuando empieza su frase (${seg(u.objetivo)}).`);
      } else {
        L.push(
          `     La imagen de la toma ${u.aToma} llega ${Math.abs(u.deriva).toFixed(2)}s ${u.deriva < 0 ? 'ANTES' : 'DESPUES'} de su frase ` +
            `(${seg(u.llegada)} en vez de ${seg(u.objetivo)}), a proposito.`
        );
      }
      L.push('');
    }
  } else {
    const rel = path.relative(RAIZ, carpeta);
    const carpetaCmd = rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.replace(/\\/g, '/') : carpeta;
    L.push(`Sin segundos todavia: ${porQueSinTiempos.replace(/<carpeta>/g, carpetaCmd)}`);
    L.push('Los clips van en este orden; cuando haya voz, cada uno ocupa su frase.');
    L.push('');
    for (const t of tomas) {
      L.push(`TOMA ${t.n}   (tipo ${t.tipo})`);
      L.push(`  Dice:     "${t.linea}"`);
      cadena
        .filter((c) => c.linea === t.n)
        .forEach((c, j) => {
          const de = c.imagenFinal ? `de ${c.imagenInicial.replace('.png', '')} a ${c.imagenFinal.replace('.png', '')}` : `arranca en ${c.imagenInicial.replace('.png', '')}`;
          const hay = fs.existsSync(path.join(dirVideo, c.archivo));
          L.push(`  ${j + 1}) video/${c.archivo}   (${de})${hay ? '' : '   FALTA: todavia no esta en video/'}`);
        });
      L.push('');
    }
  }

  L.push('-'.repeat(78));
  L.push('');
  L.push('SUBTITULOS');
  if (tiempos) {
    L.push('  audio/tiempos.json trae el tiempo exacto de cada caracter de la narracion.');
    L.push('  De ahi salen subtitulos de 2-4 palabras perfectamente sincronizados.');
  } else {
    L.push('  Se generan al crear la voz.');
  }
  L.push('');
  L.push('AUDIO DE LOS CLIPS');
  L.push('  Los clips traen ambiente y efectos, sin voces. Mezclalos por debajo de la');
  L.push('  narracion (unos -18/-20 dB) y ponles un fade corto de ~80ms en cada union');
  L.push('  para que no suenen secos.');
  L.push('');
  L.push('='.repeat(78));

  const salida = path.join(carpeta, 'plan-montaje.txt');
  fs.writeFileSync(salida, L.join('\n') + '\n', 'utf8');
  return salida;
}

/**
 * Plan de un anuncio HABLADO (podcast o entrevista: tomas tipo H; su flujo
 * esta en COMO-PRODUCIR.md, seccion 12). Va aparte porque aqui el
 * montaje no es "una toma por linea": en podcast cada clip trae VARIAS lineas
 * del guion y el anuncio las intercala con las del otro host; en entrevista hay
 * un congelado con golpe, una cadena de B-roll que tapa la historia, iconos con
 * check, el producto al centro y un texto de CTA. Todo eso lo decide
 * planear-montaje.js y queda en plan-montaje.json: `bloques` es el audio (un
 * bloque por trozo hablado) y `escena` lo que se ve encima. Aqui se cuenta para
 * alguien que monta en CapCut, y tiene que decir EXACTAMENTE lo que hace el
 * render con ese mismo plan (las cifras salen del plan y de sus reglas). Sin
 * plan todavia, se cuenta el orden, lo que hara el motor y lo que falta medir.
 *
 * Un plan de antes (cutaways mudos, iconos apilados, congelado con destello,
 * sticker en la esquina, bordes por silencio) se cuenta como esta: es lo que
 * Remotion dibuja con el.
 */
function escribirPlanHablado(carpeta, manifiesto) {
  const L = [];
  const nombre = path.basename(carpeta);
  const rel = path.relative(RAIZ, carpeta);
  const carpetaCmd = rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.replace(/\\/g, '/') : carpeta;
  const esPodcast = manifiesto.estilo === 'podcast';
  // Entrevista variante B: la unica con fundido entre clips.
  const esVarianteB = !esPodcast && String(manifiesto.entrevista?.variante || 'A').toUpperCase() === 'B';
  // El idioma de los numeros en letras al buscar la opcion elegida del check
  // (el mismo que usa el plan: "29" = "twenty-nine" en ingles).
  const idioma = ['es', 'en', 'pt'].includes(manifiesto.idioma) ? manifiesto.idioma : 'es';
  const s2 = (x) => Number(x).toFixed(2);
  const r3 = (x) => Math.round(x * 1000) / 1000;
  // Una cifra de las reglas tal cual (0.8, 1.4, -6) y una fraccion en por ciento (0.58 -> "58 %").
  const n = (x) => String(Number(x));
  const pct = (x) => `${Math.round(Number(x) * 100)} %`;
  // Un parrafo envuelto a 80 columnas: los textos que llevan cifras de las
  // reglas no se pueden cortar a mano.
  const parrafo = (texto, sangria = '') => {
    let linea = '';
    for (const palabra of String(texto).split(/\s+/).filter(Boolean)) {
      if (linea && sangria.length + linea.length + 1 + palabra.length > 80) {
        L.push(sangria + linea);
        linea = palabra;
      } else {
        linea = linea ? `${linea} ${palabra}` : palabra;
      }
    }
    if (linea) L.push(sangria + linea);
  };

  // El plan, si ya se hizo con estos estilos. Uno sin `escena` es de antes
  // (o de otro estilo) y no describe este montaje: se trata como que no hay.
  const rutaPlan = path.join(carpeta, 'plan-montaje.json');
  let plan = null;
  try {
    plan = fs.existsSync(rutaPlan) ? JSON.parse(fs.readFileSync(rutaPlan, 'utf8')) : null;
  } catch {
    plan = null;
  }
  if (plan && !plan.escena) plan = null;
  const piezas = plan ? plan.escena.piezas : [];
  // Las reglas con que se planeo (van en el plan) sobre las de hoy; sin plan,
  // las de hoy (REGLAS_HABLADO de planear-montaje.js: una sola fuente).
  const cfgP = { ...REGLAS_HABLADO.podcast, ...(plan?.reglas?.podcast || {}) };
  const cfgE = { ...REGLAS_HABLADO.entrevista, ...(plan?.reglas?.entrevista || {}) };
  const sinPlan = () => {
    L.push(`Sin segundos todavia: falta el plan de montaje.  npm run plan -- ${carpetaCmd}`);
    if (esPodcast) {
      L.push(`(y antes, medir las lineas dentro de cada clip:  npm run lineas -- ${carpetaCmd})`);
    } else {
      L.push(`(y antes, medir las palabras de cada clip:  npm run lineas -- ${carpetaCmd};  en la variante A,`);
      L.push(`despues  npm run voz -- ${carpetaCmd}  y despues el  npm run lineas --tomas  que imprime)`);
    }
    L.push('Abajo va el orden y lo que lleva cada parte; los segundos salen del plan.');
    L.push('');
  };
  // Bloques de subtitulo que van MAS ARRIBA (plan.subtitulos[i].desdeAbajo),
  // juntados en tramos seguidos: [{ desde, hasta, cuantos, texto, desdeAbajo }].
  const subtitulosSubidos = () => {
    const tramos = [];
    let anteriorSube = false;
    for (const b of plan?.subtitulos || []) {
      const sube = b.desdeAbajo !== undefined;
      if (sube && anteriorSube) {
        const t = tramos[tramos.length - 1];
        t.hasta = b.fin;
        t.cuantos++;
        t.texto.push(b.texto);
      } else if (sube) {
        tramos.push({ desde: b.inicio, hasta: b.fin, cuantos: 1, texto: [b.texto], desdeAbajo: b.desdeAbajo });
      }
      anteriorSube = sube;
    }
    return tramos;
  };
  const alturaBase = plan?.estiloSubtitulos?.desdeAbajo ?? 0.26;
  const listarSubidos = (tramos) => {
    for (const t of tramos) {
      const texto = t.texto.join(' ').replace(/\s+/g, ' ');
      L.push(`      ${seg(t.desde)} -> ${seg(t.hasta)}   "${texto.length > 60 ? texto.slice(0, 57) + '...' : texto}"   (${t.cuantos} bloque${t.cuantos === 1 ? '' : 's'})`);
    }
  };
  const sinSubtitulos = () => {
    L.push(`  Todavia no hay subtitulos.json: corre  node produccion/subtitulos-dialogo.js ${carpetaCmd}`);
    L.push(`  y despues  npm run plan -- ${carpetaCmd}  (ahi se sabe que bloques van mas arriba).`);
  };
  // Un plan de antes de las alturas por bloque: con el, todos los subtitulos
  // salen abajo (asi lo dibuja Remotion).
  const planDeAntes = () => {
    L.push('  OJO: este plan es de antes de esa regla y con el van TODOS abajo. Para que suban');
    L.push(`  donde dice arriba, vuelve a correr  npm run plan -- ${carpetaCmd}.`);
  };

  L.push('='.repeat(78));
  L.push(`PLAN DE MONTAJE — ${nombre}`);
  L.push('='.repeat(78));
  L.push('');
  L.push('Esto es para armar el anuncio a mano (CapCut, Premiere, lo que uses).');
  L.push('Todos los archivos que se nombran estan en esta misma carpeta.');
  L.push('');
  L.push('VOZ EN OFF:  no hay. La gente habla DENTRO de cada clip, con lip-sync.');
  L.push('MUSICA:      ninguna. Este estilo va sin musica de fondo (decision del estilo):');
  L.push('             no le pongas una pista debajo. Solo se oyen las voces de los clips.');
  L.push('');
  L.push('REGLA MADRE: manda el clip. La duracion del anuncio es la suma de los trozos');
  L.push('hablados que se usan, en el orden de abajo.');
  L.push('');
  L.push('LO QUE NO SE HACE, NUNCA:');
  L.push('  - No aceleres un clip hablado: deforma la voz y desincroniza la boca.');
  if (!esPodcast && !esVarianteB) {
    L.push('    La UNICA excepcion es la voz de la historia de la variante A (clips que no');
    L.push('    se ven): esa ya viene acelerada del paso voz y va tal cual, sin tocarla mas.');
  }
  if (esPodcast) {
    L.push('  - No cortes DENTRO de una linea: ahi vive el lip-sync. Se corta entre linea y');
    L.push('    linea, en la pausa, en los segundos que dice abajo.');
  } else {
    L.push('  - No cortes por DENTRO del dialogo: ahi vive el lip-sync. Solo los bordes de');
    L.push('    cada clip, en los segundos que dice abajo.');
  }
  // Una toma hablada (H) no se rehace con la forma corta de los bloques R:
  // se piden prompts nuevos con --contexto y se aplican con --aplicar.
  L.push(`  Si un clip no sirve, se REGENERA (node produccion/rehacer-toma.js ${carpetaCmd} --toma N --contexto,`);
  L.push('  despues --aplicar nuevos.json y npm run videos -- <carpeta> --tomas N --si). No se ajusta.');
  parrafo(
    'Un clip con palabras repetidas, trabadas, cambiadas o agregadas (npm run lineas lo marca NO ESTA LIMPIO) tambien se regenera' +
      (esPodcast ? ', y un clip de reacciones en el que se oye una palabra, igual.' : '.') +
      ' La unica excepcion la decide el motor: una letra (a, e, o, u, y) repetida muy rapido y sin pausa ("a, a", menos de 0,2 s) sale tolerada: se informa con su segundo para revisarla a oido y no se regenera.',
    '  '
  );
  L.push('');

  if (esPodcast) {
    const pod = manifiesto.podcast || {};
    const lados = { A: 'izquierda', B: 'derecha', ...(pod.lados || {}) };
    const modo = plan?.escena?.modoBroll || (pod.broll?.modo === 'esquina' ? 'esquina' : 'pantalla-dividida');
    const reaccionesDe = (host) => manifiesto.tomas.find((t) => t.tipo === 'H' && t.clase === 'reacciones' && t.habla === host);
    const descripcionDe = (host, num) => (reaccionesDe(host)?.reacciones || []).find((x) => Number(x.n) === Number(num))?.descripcion || null;
    const cutawaysDelPlan = (plan?.bloques || []).map((b) => b.cutaway).filter(Boolean);
    // Un plan de antes tiene los cutaways MUDOS y asi los dibuja Remotion: se
    // cuentan como estan. Sin plan (o sin cutaways), como los hace el motor hoy.
    const cutawaysMudos = cutawaysDelPlan.length > 0 && !cutawaysDelPlan.some((c) => c.conSonido);
    // Pantalla dividida y host recortado: las mismas medidas que DIVIDIDA y
    // RECORTE de remotion/src/Escena.jsx (Remotion no las lee del plan; si algun
    // dia van en REGLAS_HABLADO.podcast.dividida, se toman de ahi).
    const dividida = { brollAlto: 0.58, fundidoDesde: 0.86, hostEncuadreY: '23%', ...(cfgP.dividida || {}) };
    // El encuadre del host como lo usa CSS ("23%"); por si llega como numero (0.23).
    const encuadreY = typeof dividida.hostEncuadreY === 'number' ? pct(dividida.hostEncuadreY) : String(dividida.hostEncuadreY).replace(/\s*%$/, ' %');
    const recorteAncho = 0.62;
    // Esquina: los B-roll que en este plan quedaron con el host en una ventana
    // (no esta el recorte sin fondo).
    const enVentana = piezas.filter((p) => p.tipo === 'clip' && /^esquina-/.test(p.marco || ''));

    L.push(`PODCAST. Dos anfitriones: A a la ${lados.A.toUpperCase()} y B a la ${lados.B.toUpperCase()}.`);
    L.push('Cada clip de un host trae VARIAS lineas del guion seguidas, y el anuncio las');
    L.push('intercala con las del otro host en el orden del guion. O sea: de cada clip se');
    L.push('usa un TROZO por linea, en los segundos que dice abajo, y los trozos van en');
    L.push('fila, en corte seco, sin transiciones del editor.');
    L.push('');
    if (cutawaysMudos) {
      L.push('CUTAWAY: mientras un host dice una linea, se ve al OTRO reaccionando: un trozo');
      L.push('de su clip de reacciones, MUDO, ENCIMA de la imagen. El audio de la linea sigue');
      L.push(`sonando igual por debajo. Entra ${cfgP.cutawayDesde ?? 0.6} s despues de que arranca la linea y dura`);
      L.push(`${cfgP.cutawaySeg} s (si la linea es corta, menos).`);
    } else {
      const tras = Number(cfgP.cutawayTrasFraseSeg) || 0;
      const cuandoEntra = tras < 0 ? `${n(-tras)} s antes de que termine` : tras > 0 ? `${n(tras)} s despues de que termina` : 'justo cuando termina';
      parrafo(
        'CUTAWAY: mientras un host habla, se ve al OTRO reaccionando: un trozo de su clip de reacciones ENCIMA de la imagen, ' +
          `CON SU SONIDO (la risa, el "hmm") a ${n(cfgP.cutawayVolumenDb)} dB, mas bajo que la voz, que sigue sonando igual por debajo. ` +
          `Dura ${n(cfgP.cutawaySeg)} s y entra justo despues de la frase que lo provoca (${cuandoEntra}), ` +
          `nunca en los primeros ${n(cfgP.turnoMinSeg)} s del turno de quien habla: quien empieza a hablar se ve. ` +
          `Quien habla vuelve a cuadro al menos ${n(cfgP.margenSeg)} s antes de terminar su turno: si el cutaway no entra entero se acorta ` +
          `hasta ${n(cfgP.cutawayMinSeg)} s, y si ni asi, no va. Nunca encima de un B-roll. ` +
          'Cada reaccion sale del segundo de su clip en que de verdad pasa (su sonido), no de un tercio fijo: abajo va el segundo exacto de cada una.'
      );
    }
    L.push('');
    if (modo === 'esquina') {
      parrafo(
        'B-ROLL (modo esquina): mientras va el B-roll, el B-roll ocupa toda la pantalla, MUDO, y el host que habla va ' +
          'RECORTADO SIN FONDO en la esquina inferior de SU lado, pegado al borde de abajo y al de su lado, grande ' +
          `(${pct(recorteAncho)} del ancho) y cortado por los dos bordes, sin marco. Es video/recorte-toma-N.webm, un video con ` +
          'transparencia que deja el paso npm run recortar. Va mudo: el audio es el de su linea, que sigue sonando igual. ' +
          'Si tu editor no lee la transparencia del .webm, quitale el fondo con su herramienta a ese mismo tramo del clip ' +
          'del host (abajo va el segundo).'
      );
      if (plan && enVentana.length) {
        parrafo(
          `OJO: en este plan ${enVentana.length === 1 ? 'un B-roll va' : `${enVentana.length} B-roll van`} con el host en una ventana ` +
            `redondeada (~${pct(cfgP.esquina?.ancho ?? 0.4)} del ancho, borde blanco fino, sombra) en vez de recortado: falta el recorte. ` +
            `Corre  npm run recortar -- ${carpetaCmd}  y despues  npm run plan -- ${carpetaCmd}  (nunca a la vez que un render).`
        );
      } else if (!plan) {
        parrafo(
          `El recorte se hace despues del plan:  npm run recortar -- ${carpetaCmd}  y otra vez  npm run plan.  Sin el, ` +
            `el host va en una ventana redondeada (~${pct(cfgP.esquina?.ancho ?? 0.4)} del ancho, borde blanco fino, sombra).`
        );
      }
    } else {
      parrafo(
        `B-ROLL (modo pantalla dividida): mientras va el B-roll, el B-roll va ARRIBA, MUDO, en una caja del ${pct(dividida.brollAlto)} ` +
          'del alto, recortado al centro (se ve la franja del medio del clip), y su ultimo ' +
          `${pct(1 - dividida.fundidoDesde)} se desvanece con un degradado sobre el host: no hay una linea de corte. ` +
          'El host que habla va ABAJO, en la mitad de abajo de la pantalla, con su mismo clip encuadrado mas abajo: ' +
          `la cabeza arriba de su mitad y el microfono a la vista (encuadre vertical al ${encuadreY}). ` +
          'Su audio sigue sonando igual.'
      );
    }
    L.push('El B-roll va de la solucion hasta antes del CTA. El CTA (las ultimas lineas) va');
    L.push('siempre con los hosts a pantalla completa. Mientras va un B-roll, los subtitulos');
    L.push('suben (abajo, en SUBTITULOS).');
    L.push('');
    L.push('-'.repeat(78));
    L.push('');
    if (!plan) sinPlan();

    const bloquePorOrden = new Map((plan?.bloques || []).filter((b) => b.segmento).map((b) => [b.segmento.orden, b]));
    const tomaDeLinea = (orden) => manifiesto.tomas.find((t) => t.tipo === 'H' && (t.lineas || []).some((l) => l.orden === orden));
    const brollDeLinea = (orden) => (manifiesto.broll || []).find((b) => b.en_linea === orden);

    for (const g of manifiesto.guion || []) {
      const b = bloquePorOrden.get(g.orden);
      const toma = tomaDeLinea(g.orden);
      L.push(`LINEA ${g.orden}   [${g.habla}]${g.beat ? `   — ${g.beat}` : ''}`);
      if (b) {
        L.push(`  Cuando:   ${seg(b.inicio)} -> ${seg(b.fin)}   (${s2(b.ventana)}s)`);
      } else if (plan) {
        L.push('  Cuando:   QUEDO FUERA del montaje (mira los avisos del final).');
      }
      L.push(`  Dice:     "${g.texto}"`);
      if (b) {
        L.push(`  Clip:     video/${b.toma.archivo}   del segundo ${s2(b.segmento.desdeClip)} al ${s2(b.segmento.hastaClip)} del clip.`);
        L.push('            Ese trozo entero, a 1x. El corte cae en la pausa entre lineas.');
      } else if (toma) {
        L.push(`  Clip:     video/toma-${toma.n}.mp4   (el trozo donde dice esta linea; los segundos los da el plan)`);
      } else {
        L.push('  Clip:     (esta linea no esta en las "lineas" de ninguna toma del manifiesto)');
      }
      if (b?.cutaway) {
        const c = b.cutaway;
        const d = c.descripcion ?? descripcionDe(c.host, c.reaccion);
        const tras = c.tras ?? g.cutaway?.tras ?? null;
        L.push(`  Cutaway:  video/${c.archivo}   (reacciones de ${c.host}), reaccion ${c.reaccion}${d ? ` "${d}"` : ''}.`);
        if (Number.isFinite(c.sonidoEn)) {
          L.push(`            ENCIMA desde ${seg(c.desde)}, ${s2(c.duracion)} s, tomando el clip desde el segundo ${s2(c.recorteInicio)}`);
          L.push(`            (su sonido arranca en el ${s2(c.sonidoEn)}).`);
        } else {
          L.push(`            ENCIMA desde ${seg(c.desde)}, ${s2(c.duracion)} s, tomando el clip desde el segundo ${s2(c.recorteInicio)}.`);
        }
        if (c.conSonido) {
          L.push(
            `            CON SU SONIDO a ${n(c.volumenDb ?? cfgP.cutawayVolumenDb)} dB, ` +
              (tras ? `justo despues de "${tras}".` : 'sin frase marcada ("tras"): va por la regla del turno.')
          );
        } else {
          L.push('            MUDO.');
        }
        if (c.momento === 'tercio') L.push('            OJO: no se encontro el sonido de esta reaccion en su clip: va el centro de su tercio. Miralo.');
      } else if (g.cutaway?.host) {
        const r = reaccionesDe(g.cutaway.host);
        const d = descripcionDe(g.cutaway.host, g.cutaway.reaccion);
        L.push(`  Cutaway:  ${g.cutaway.host} reaccion ${g.cutaway.reaccion}${d ? ` "${d}"` : ''}${r ? ` (video/toma-${r.n}.mp4)` : ''}` + (plan ? '   — en este montaje quedo fuera (mira los avisos).' : ''));
        if (!plan) {
          L.push(
            `            Con su sonido a ${n(cfgP.cutawayVolumenDb)} dB, ` +
              (g.cutaway.tras ? `justo despues de "${g.cutaway.tras}".` : `por la regla del turno (la linea no marca la frase: falta "tras").`)
          );
        }
      }
      const br = brollDeLinea(g.orden);
      if (b?.brollEncima) {
        const x = b.brollEncima;
        // El segundo del clip del host que esta sonando cuando entra el B-roll
        // (la misma cuenta que el plan: hostSync).
        const hostSync = r3(b.segmento.desdeClip + (x.desde - b.inicio));
        const tramoHost = `el trozo de ${b.toma.archivo} que ya esta sonando, desde su segundo ${s2(hostSync)}`;
        L.push(`  B-roll:   video/${x.archivo}   ENCIMA desde ${seg(x.desde)}, ${s2(x.duracion)} s, a ${s2(x.velocidad)}x, MUDO.`);
        if (x.modo === 'esquina') {
          const lado = lados[g.habla] || 'izquierda';
          const host = piezas.find((p) => p.tipo === 'clip' && /^(recorte|esquina)-/.test(p.marco || '') && Math.abs(p.desde - x.desde) < 0.002);
          if (host && host.marco.startsWith('recorte-')) {
            L.push(`            El B-roll a pantalla completa y ${g.habla} RECORTADO SIN FONDO en la esquina inferior ${lado}:`);
            L.push(`            video/${host.archivo} desde su segundo ${s2(host.recorteInicio)}, MUDO`);
            L.push(`            (es ${tramoHost}).`);
          } else {
            L.push(`            El B-roll a pantalla completa y ${g.habla} en una ventana redondeada en la esquina inferior ${lado}`);
            L.push(`            (${tramoHost}, reducido, MUDO).`);
            if (plan) L.push(`            Falta el recorte sin fondo: npm run recortar -- ${carpetaCmd}  y  npm run plan.`);
          }
        } else {
          L.push(`            Pantalla dividida: el B-roll ARRIBA (con el degradado sobre el host) y ${g.habla} ABAJO,`);
          L.push('            con la cabeza arriba de su mitad, MUDO:');
          L.push(`            ${tramoHost}.`);
        }
        L.push(`            Sincroniza con "${x.sincroniza_con}"${x.anclaSegundo !== null && x.anclaSegundo !== undefined ? ` (${seg(x.anclaSegundo)})` : ''}.`);
      } else if (br) {
        L.push(`  B-roll:   video/broll-${br.n}.mp4   (${br.duracion}s)   ENCIMA de esta linea, sincroniza con: "${br.sincroniza_con}"` + (plan ? '   — en este montaje quedo fuera (mira los avisos).' : ''));
      }
      L.push('');
    }

    const reacciones = manifiesto.tomas.filter((t) => t.tipo === 'H' && t.clase === 'reacciones');
    if (reacciones.length) {
      L.push('-'.repeat(78));
      L.push('');
      if (cutawaysMudos) {
        L.push('CLIPS DE REACCIONES (solo para los cutaways; nunca van enteros ni con audio)');
      } else {
        L.push('CLIPS DE REACCIONES (solo para los cutaways, con su sonido; nunca van enteros)');
      }
      for (const r of reacciones) {
        const archivo = `toma-${r.n}.mp4`;
        L.push(
          `  video/${archivo}   reacciones de ${r.habla} (${r.duracion} s). ` +
            (cutawaysMudos ? 'Cada reaccion ocupa un tercio del clip:' : 'De cada una se usa el trozo donde pasa:')
        );
        for (const x of r.reacciones || []) {
          const usos = cutawaysDelPlan.filter((c) => c.archivo === archivo && Number(c.reaccion) === Number(x.n));
          const donde = usos.length
            ? '   -> ' + usos.map((c) => `desde el segundo ${s2(c.recorteInicio)}${Number.isFinite(c.sonidoEn) ? ` (sonido en el ${s2(c.sonidoEn)})` : ''}`).join('; ')
            : plan
              ? '   (no se usa en este montaje)'
              : '';
          L.push(`      ${x.n}) ${x.descripcion}${donde}`);
        }
      }
      if (!cutawaysMudos) L.push('  Una reaccion no lleva ninguna palabra: si se oye una, ese clip se regenera.');
      L.push('');
    }
  } else {
    const ent = manifiesto.entrevista || {};
    const variante = plan?.escena?.variante || (String(ent.variante || 'A').toUpperCase() === 'B' ? 'B' : 'A');
    const ladoMic = ent.lado_mic || 'izquierda';
    const ladoIconos = plan?.escena?.ladoIconos || ent.lado_iconos || (ladoMic === 'derecha' ? 'izquierda' : 'derecha');
    const congeladoTras = variante === 'A' ? ent.congelado?.despues_de_toma ?? null : null;
    const dis = cfgE.disolvenciaSeg;
    const bloquePorToma = new Map((plan?.bloques || []).map((b) => [b.linea, b]));
    const tomasH = manifiesto.tomas.filter((t) => t.tipo === 'H');
    const iconosDelPlan = piezas.filter((p) => p.tipo === 'icono');
    // Lo que trae el plan, para contarlo como esta (ver la cabecera).
    const iconosLibres = !plan || !iconosDelPlan.some((p) => !p.producto && !p.anchoProducto) || iconosDelPlan.some((p) => p.centroX != null && p.centroY != null);
    const bordesPorPalabras = !plan || (plan.bloques || []).some((b) => b.toma?.bordes);
    const piezaCongelado = piezas.find((p) => p.tipo === 'imagen' && p.efecto === 'golpe') || null;
    const congeladoGlitch = !piezaCongelado || piezaCongelado.variante === 'glitch' || plan?.escena?.congelado?.variante === 'glitch';
    // El producto al centro (pieza icono con producto:true; anchoProducto en
    // los planes ajustados a mano de la prueba) o el sticker de antes.
    const productoCentro = iconosDelPlan.find((p) => p.producto || p.anchoProducto) || null;
    const stickerViejo = piezas.find((p) => p.tipo === 'imagen' && p.marco === 'sticker-esquina') || null;
    const conProducto = Boolean(manifiesto.sticker_producto) && (variante === 'B' || stickerViejo);

    // El paso voz (variante A, recortar-voz.js) deja el clip crudo en
    // video/originales/ y, en toma-N.json, salidaTamano = los bytes del clip que
    // dejo en video/. Si el clip de video/ es ese, ya va sin los silencios de
    // adentro y acelerado. Es la misma comprobacion que hace el plan.
    const pasoDeVoz = (num) => {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(carpeta, 'video', 'originales', `toma-${num}.json`), 'utf8'));
        if (!Number.isFinite(meta?.salidaTamano)) return null;
        return fs.statSync(path.join(carpeta, 'video', `toma-${num}.mp4`)).size === meta.salidaTamano ? meta : null;
      } catch {
        return null;
      }
    };
    const hayClip = (num) => fs.existsSync(path.join(carpeta, 'video', `toma-${num}.mp4`));
    // Las tomas de la historia (A): las solo_voz y todo lo que va despues del congelado.
    let trasCongelado = false;
    const historiaA = [];
    for (const t of tomasH) {
      const b = bloquePorToma.get(t.n);
      const soloVoz = b ? Boolean(b.soloVoz) : variante === 'A' && (t.solo_voz === true || trasCongelado);
      if (soloVoz) historiaA.push(t.n);
      if (t.n === congeladoTras) trasCongelado = true;
    }
    const conVoz = historiaA.filter((num) => pasoDeVoz(num)?.modo === 'voz');
    const sinVoz = historiaA.filter((num) => hayClip(num) && pasoDeVoz(num)?.modo !== 'voz');
    // El paso voz (recortar-voz.js) procesa SOLO las tomas con solo_voz: true.
    // Una toma de despues del congelado sin el campo tambien se oye sin verse,
    // pero el paso no la toca: hay que marcarla (como avisa el plan).
    const esSoloVoz = (num) => tomasH.find((t) => t.n === num)?.solo_voz === true;
    const faltaVoz = sinVoz.filter(esSoloVoz);
    const sinMarca = sinVoz.filter((num) => !esSoloVoz(num));
    // Si la medida de un clip en lineas-habladas.json es de OTRO clip (se
    // regenero): la misma comprobacion del plan, por el tamano del archivo.
    const medidas = leerMedidas(carpeta);
    const medidaDeOtroClip = (num) => {
      const entrada = medidas?.tomas?.[String(num)];
      if (!entrada) return null;
      const estado = estadoDeMedidaDelClip(carpeta, num, entrada);
      return estado.estado === 'vieja' ? estado.motivo : null;
    };
    const clips = (ns) => `${ns.length === 1 ? 'el clip' : 'los clips'} ${ns.join(', ')}`;
    const velocidadesVoz = [...new Set(conVoz.map((num) => Number(pasoDeVoz(num).velocidad)).filter(Number.isFinite))];
    const velocidadVoz = velocidadesVoz.length === 1 ? velocidadesVoz[0] : REGLAS_VOZ.velocidad;
    // La cola de cada clip, como la elige el plan: la de la toma, la del ultimo
    // clip del gancho de A o la de siempre.
    const colaDe = (t) =>
      Number.isFinite(t.cola_seg) && t.cola_seg >= 0 ? t.cola_seg : variante === 'A' && t.n === congeladoTras ? cfgE.colaAntesDelCongeladoSeg : cfgE.colaSeg;

    L.push(`ENTREVISTA CALLEJERA, variante ${variante} (${variante === 'A' ? 'gancho callejero' : 'entrevista completa'}).`);
    if (bordesPorPalabras) {
      parrafo(
        'Los clips van en fila, en el orden de abajo, cada uno cortado en sus bordes por los tiempos de cada palabra: ' +
          `${n(cfgE.cabezaSeg)} s antes de la primera palabra y ${n(cfgE.colaSeg)} s despues de la ULTIMA PALABRA DEL GUION ` +
          '(lo que se oye despues, una repeticion o una muletilla, queda fuera).' +
          (variante === 'A' ? ` El ultimo clip del gancho lleva ${n(cfgE.colaAntesDelCongeladoSeg)} s de cola: ahi se ve la cara de "no se".` : '') +
          ' Por dentro no se toca nada. La voz de la persona viene dentro de cada clip y va a su nivel, sin tocar.'
      );
    } else {
      L.push('Los clips van en fila, en el orden de abajo, recortando solo el silencio de los');
      L.push('bordes. La voz de la persona viene dentro de cada clip y va a su nivel, sin tocar.');
    }
    if (variante === 'A') {
      const golpe = congeladoGlitch
        ? 'con un golpe de glitch (acercamiento corto, sacudida, los colores separados y el negativo en dos golpes) y el sonido efectos/congelado.mp3'
        : 'con un golpe';
      let voz;
      if (historiaA.length && conVoz.length === historiaA.length) {
        voz =
          `Esos clips ya vienen del paso voz: sin los silencios de adentro y a ${n(velocidadVoz)}x (video y audio; el tono no cambia). ` +
          'Van tal cual: es la unica excepcion a no acelerar un clip hablado, porque no se ven.';
      } else {
        voz =
          `Esos clips van sin los silencios de adentro y a ${n(velocidadVoz)}x (video y audio; el tono no cambia): lo hace el paso voz, ` +
          `npm run voz -- ${carpetaCmd}${faltaVoz.length ? ` --tomas ${faltaVoz.join(',')}` : ''}, despues de  npm run lineas,  ` +
          'y despues el  npm run lineas  que imprime (hay que medirlos otra vez).' +
          (faltaVoz.length ? ` OJO: ${clips(faltaVoz)} todavia no ${faltaVoz.length === 1 ? 'paso' : 'pasaron'} por el.` : '') +
          (sinMarca.length
            ? ` OJO: ${clips(sinMarca)} ${sinMarca.length === 1 ? 'va' : 'van'} despues del congelado sin "solo_voz": true en el manifiesto, ` +
              'y el paso voz no los toca (siguen con sus silencios y a 1x): hay que marcarlos.'
            : '');
      }
      parrafo(
        `Al terminar el gancho${congeladoTras !== null ? ` (clip ${congeladoTras})` : ''} la imagen se CONGELA ${n(cfgE.congeladoSeg)} s ${golpe}, ` +
          'y desde ahi solo se OYE a la persona: la imagen la pone una cadena de B-roll, uno detras de otro, sin nadie que hable. ' +
          `Los clips de la historia se usan SOLO por su audio.${historiaA.length ? ` ${voz}` : ''}`
      );
    } else {
      L.push(`Entre clip y clip, un fundido corto de ${dis} s (en CapCut: transicion "combinar").`);
      L.push('El audio corta limpio: el fundido es solo de imagen. Sin blanco y negro.');
    }
    if (!iconosLibres) {
      L.push(`Iconos: aparecen apilados a la ${ladoIconos.toUpperCase()} (a la altura del pecho) cuando se dice`);
      L.push('lo que nombran, con un "pop" de entrada, y se van en un fade corto.');
      if (variante === 'A') L.push('El icono ELEGIDO lleva un check verde con sonido cuando la persona responde.');
    } else if (variante === 'A') {
      const a = cfgE.iconosA;
      const xs = a.xs?.[2] || [0.2, 0.8];
      parrafo(
        `Iconos: los de cada pregunta van en PAREJA, uno a cada lado del cuerpo (su centro a ${pct(xs[0])} y a ${pct(xs[1])} del ancho), ` +
          `a la altura del pecho o la panza (${pct(a.centroY)} del alto), cada uno de ${pct(a.ancho)} del ancho. Entran cuando se dice la pregunta, ` +
          'con un "pop", y se van en un fade corto. El ELEGIDO lleva un check verde DEBAJO, con su sonido efectos/check.mp3, ' +
          `justo en la PALABRA de la opcion que elige la persona, y la pareja se queda hasta ${n(cfgE.checkQuedaSeg)} s despues del check. ` +
          'Si una pareja sigue en pantalla cuando entra la siguiente, se va en ese momento (van en el mismo lugar).'
      );
    } else {
      const bb = cfgE.iconosB;
      parrafo(
        `Iconos: de a uno, AL CENTRO, a la altura del pecho (${pct(bb.centroY)} del alto, ${pct(bb.ancho)} del ancho), cuando se dice lo ` +
          'que nombran, con un "pop" y un clic de mouse (efectos/clic.mp3) al aparecer, y se van en un fade corto. Si el siguiente ' +
          `entra antes de que se vaya el anterior, el anterior se va en ese momento (cada uno queda al menos ${n(bb.minSeg)} s). ` +
          'Un grupo de dos va en pareja, centrada.'
      );
    }
    if (conProducto) {
      if (stickerViejo) {
        L.push(`Cuando se dice la marca, la foto del producto entra como sticker (~28 % del ancho,`);
        L.push(`con "pop") en la esquina superior ${ladoMic === 'derecha' ? 'izquierda' : 'derecha'}, ${cfgE.stickerSeg} s.`);
      } else {
        const pr = cfgE.producto;
        parrafo(
          `Cuando se dice la marca, la foto del producto aparece AL CENTRO como un icono mas (${pct(pr.ancho)} del ancho), con su clic, ` +
            `${n(pr.seg)} s (o hasta el fin de su clip): recortada si la foto tiene transparencia; si no, dentro de una tarjeta blanca.`
        );
      }
    }
    if ((manifiesto.broll || []).some((b) => b.cierre === true)) {
      L.push('Al final, un B-roll de cierre con el llamado a la accion en pantalla.');
    }
    L.push('');
    L.push('-'.repeat(78));
    L.push('');
    if (!plan) sinPlan();

    const congelado = plan?.escena?.congelado || null;
    const cierre = plan?.escena?.cierre || null;
    const iconosDe = (num) => iconosDelPlan.filter((p) => !p.producto && !p.anchoProducto && p.toma === num);
    const historia = (plan?.bloques || []).filter((b) => b.soloVoz && !b.toma?.problema);
    const sonidos = piezas.filter((p) => p.tipo === 'sonido');
    // El clic de un icono o del producto: el que nombra su archivo en el porque
    // (asi lo escribe el plan) o, si no, el que arranca justo antes de que aparezca.
    const clicDe = (p) =>
      sonidos.find((s) => /clic\.mp3$/.test(s.archivo) && String(s.porque || '').includes(path.basename(p.archivo))) ||
      sonidos.find((s) => /clic\.mp3$/.test(s.archivo) && s.desde <= p.desde + 0.001 && s.desde > p.desde - 0.5) ||
      null;
    // Las palabras de los subtitulos, para comprobar que el check cae en la
    // palabra elegida (misma normalizacion que el plan: sin tildes ni puntuacion).
    const normal = (t) => String(t).toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '');
    const palabrasSub = (plan?.subtitulos || []).flatMap((b) => b.palabras || []);
    const dondeVa = (p) => {
      const x = Number(p.centroX);
      const lado = x < 0.5 ? 'IZQUIERDA' : 'DERECHA';
      const lugar = Math.abs(x - 0.5) < 0.02 ? 'AL CENTRO' : variante === 'A' ? `a la ${lado} del cuerpo` : `en pareja, a la ${lado.toLowerCase()} del centro`;
      return `${lugar}: su centro a ${pct(p.centroX)} del ancho y ${pct(p.centroY)} del alto, mide ${pct(p.ancho)} del ancho`;
    };

    for (const t of tomasH) {
      const b = bloquePorToma.get(t.n);
      const soloVoz = historiaA.includes(t.n);
      L.push(`CLIP ${t.n}   (toma ${t.n}${t.fase ? `, ${t.fase}` : ''}, ${t.duracion} s)`);
      if (b && !b.toma.problema) {
        L.push(`  Cuando:   ${seg(b.inicio)} -> ${seg(b.fin)}   (${s2(b.ventana)}s)`);
      } else if (b) {
        L.push('  Cuando:   FALTA EL CLIP en video/: no esta en el montaje.');
      }
      L.push(`  Clip:     video/toma-${t.n}.mp4`);
      const voz = pasoDeVoz(t.n);
      if (b?.toma?.recorteInicio !== undefined) {
        const tm = b.toma;
        if (tm.bordes === 'ya-recortado') {
          if (voz?.modo === 'voz') {
            L.push(`            Ya viene del paso voz: sin los silencios de adentro, a ${n(voz.velocidad)}x y cortado en`);
            L.push(`            sus bordes. Va ENTERO y tal cual (${s2(tm.duracion)}s): no lo cortes ni lo aceleres otra vez.`);
          } else {
            L.push(`            Ya viene cortado en sus bordes por las palabras. Va ENTERO (${s2(tm.duracion)}s).`);
          }
          L.push(`            El clip crudo esta en video/originales/toma-${t.n}.mp4.`);
          if (tm.sinMedida) {
            const otro = medidaDeOtroClip(t.n);
            L.push(
              otro
                ? `            OJO: su medida de lineas-habladas.json es de otro clip (${otro}):`
                : '            OJO: falta su medida (despues del paso voz hay que medir de nuevo):'
            );
            L.push(`            npm run lineas -- ${carpetaCmd} --tomas ${t.n}  y  npm run plan.`);
          }
        } else if (tm.bordes === 'palabras') {
          const cola = colaDe(t);
          L.push(`            Corta ${s2(tm.recorteInicio)}s del INICIO y ${s2(tm.recorteFin)}s del FINAL: del segundo ${s2(tm.recorteInicio)} al ${s2(tm.largoOriginal - tm.recorteFin)}.`);
          L.push(
            `            (Por las palabras: ${n(cfgE.cabezaSeg)} s antes de la primera y ${n(cola)} s despues de la ultima del guion` +
              (variante === 'A' && t.n === congeladoTras && cola === cfgE.colaAntesDelCongeladoSeg ? ': la cara de "no se").' : ').')
          );
          L.push(`            Quedan ${s2(tm.duracion)}s utiles de los ${s2(tm.largoOriginal)}s del clip.`);
        } else {
          L.push(`            Recorta ${s2(tm.recorteInicio)}s del INICIO y ${s2(tm.recorteFin)}s del FINAL (silencio).`);
          L.push(`            Quedan ${s2(tm.duracion)}s utiles de los ${s2(tm.largoOriginal)}s del clip.`);
          if (tm.sinMedida) {
            const otro = medidaDeOtroClip(t.n);
            if (otro) {
              L.push(`            OJO: va por silencio porque su medida de lineas-habladas.json es de otro clip (${otro}).`);
              L.push(`            En la calle casi no corta nada: npm run lineas -- ${carpetaCmd} --tomas ${t.n}  y  npm run plan.`);
            } else {
              L.push('            OJO: va por silencio porque falta su medida en lineas-habladas.json (en la calle casi');
              L.push(`            no corta nada): npm run lineas -- ${carpetaCmd} --tomas ${t.n}  y  npm run plan.`);
            }
          }
        }
        if (tm.pausasInteriores) L.push(`            OJO: tiene ${tm.pausasInteriores} pausa(s) DENTRO del dialogo. No las toques.`);
      } else if (!b && soloVoz) {
        L.push(`            Con el paso voz queda sin sus silencios de adentro, a ${n(velocidadVoz)}x y cortado en sus bordes.`);
      } else if (!b && bordesPorPalabras) {
        L.push(
          `            Corta los bordes ${n(cfgE.cabezaSeg)} s antes de la primera palabra y ${n(colaDe(t))} s despues de la ultima del guion` +
            ' (los segundos los da el plan).'
        );
      } else {
        L.push('            Recorta el silencio de los bordes (mira donde empieza y termina de hablar).');
      }
      if (soloVoz && voz?.modo !== 'voz' && hayClip(t.n)) {
        if (esSoloVoz(t.n)) {
          L.push('            OJO: todavia no paso por el paso voz: sigue con sus silencios de adentro y a 1x.');
        } else {
          L.push('            OJO: no tiene "solo_voz": true en el manifiesto y el paso voz no lo toca: sigue con sus');
          L.push('            silencios de adentro y a 1x. Marcalo solo_voz: true y corre el paso voz.');
        }
      }
      if (Array.isArray(t.dialogo) && t.dialogo.length) {
        t.dialogo.forEach((d, i) => L.push(`  ${i === 0 ? 'Dice:   ' : '        '}  [${d.habla}] "${d.texto}"`));
      } else {
        L.push(`  Dice:     "${t.linea}"`);
      }
      // El fundido de entrada (variante B) lo trae la pieza de capa 0 del clip.
      const piezaClip = piezas.find((p) => p.tipo === 'clip' && p.capa === 0 && p.archivo === `toma-${t.n}.mp4`);
      if (soloVoz) {
        L.push('  Se ve:    NADA de este clip: solo se OYE. La imagen la pone la cadena de B-roll (abajo).');
      } else if (piezaClip?.fundidoEntrada) {
        L.push(`  Se ve:    el clip a pantalla completa, entrando con un fundido de ${piezaClip.fundidoEntrada} s`);
        L.push('            sobre el clip anterior (que se alarga eso mismo en imagen, no en audio).');
      } else {
        L.push('  Se ve:    el clip a pantalla completa.');
      }

      // Iconos de este clip: con plan, las piezas (segundos exactos); sin plan,
      // los grupos del manifiesto con sus frases.
      const grupos = (manifiesto.iconos || []).filter((g) => g.toma === t.n);
      if (grupos.length) {
        const piezasIc = iconosDe(t.n);
        for (const g of grupos) {
          const del = piezasIc.filter((p) => p.grupo === g.grupo);
          if (del.length) {
            const p0 = del[0];
            // Por que se va cuando se va: el plan lo alarga hasta un rato despues
            // del check (A) o lo corta cuando entra el siguiente; si no, su frase
            // de salida o el tiempo de siempre.
            const finG = p0.desde + p0.duracion;
            const conCheck = del.find((p) => p.check);
            const entraOtro = iconosDelPlan.some((p) => !del.includes(p) && p.desde > p0.desde + 0.001 && Math.abs(p.desde - finG) < 0.01);
            const sale =
              conCheck && Math.abs(finG - (conCheck.check.desde + cfgE.checkQuedaSeg)) < 0.01
                ? `se queda hasta ${n(cfgE.checkQuedaSeg)} s despues del check`
                : entraOtro
                  ? 'se va al entrar el siguiente'
                  : g.desaparece_con
                    ? `se va con "${g.desaparece_con}"`
                    : `${n(cfgE.iconoSeg)} s en pantalla`;
            L.push(`  Iconos:   grupo "${g.grupo}": desde ${seg(p0.desde)} hasta ${seg(finG)}   (aparece con "${g.aparece_con}", ${sale})`);
            del.forEach((p, i) => {
              const comoVa = p.sticker === 'recorte' ? 'con transparencia: recortado' : 'sin transparencia: dentro de una tarjeta blanca';
              // Con centroX/centroY (planes de ahora) se dice donde va; sin
              // ellos, la fila de la pila de antes (1 = arriba).
              const donde = p.centroX != null && p.centroY != null ? dondeVa(p) : `fila ${(p.fila ?? 0) + 1} de la pila`;
              L.push(`              ${i + 1}) ${p.archivo}   (${donde}; ${comoVa})`);
              if (p.check) {
                // El sonido del check va adelantado su ataque (lo midio el plan):
                // es el check.mp3 que arranca justo antes del check, nunca despues.
                const son = sonidos.find((s) => s.archivo.endsWith('check.mp3') && s.desde <= p.check.desde + 0.001 && s.desde > p.check.desde - 1.5);
                const palabra = g.check_con ? palabraElegida(g.check_con, g.aparece_con, cfgE.palabrasVaciasCheck, idioma) : null;
                let enQue = '';
                if (palabra && palabrasSub.length) {
                  const cae = palabrasSub.some((w) => normal(w.texto) === palabra && Math.abs(w.inicio - p.check.desde) <= 0.02);
                  enQue = cae
                    ? `, en la palabra "${palabra}" (de "${g.check_con}")`
                    : `, al empezar la respuesta "${g.check_con}" (no se encontro la palabra "${palabra}": mira los avisos)`;
                } else if (palabra) {
                  enQue = `, en la palabra "${palabra}" (de "${g.check_con}"; estimado: faltan los subtitulos)`;
                } else if (g.check_con) {
                  enQue = `, al empezar la respuesta "${g.check_con}" (no repite la opcion con la palabra de la pregunta)`;
                }
                L.push(`                 ELEGIDO: check verde${p.checkAbajo ? ' DEBAJO' : ''} a ${seg(p.check.desde)}${enQue}.`);
                if (son) L.push(`                 Sonido ${son.archivo} desde ${seg(son.desde)} (su golpe cae justo en el check).`);
              }
            });
            const clic = variante === 'B' ? clicDe(p0) : null;
            if (clic) L.push(`              Clic: ${clic.archivo} desde ${seg(clic.desde)} (su golpe cae justo cuando aparece).`);
          } else {
            L.push(`  Iconos:   grupo "${g.grupo}": aparece con "${g.aparece_con}"${g.desaparece_con ? `, se va con "${g.desaparece_con}"` : ''}` + (plan ? '   — en este montaje quedo fuera (mira los avisos).' : ''));
            (g.iconos || []).forEach((ic, i) =>
              L.push(
                `              ${i + 1}) img/${ic.id}.png` +
                  (g.elegido === ic.id ? `   ELEGIDO: check verde debajo + sonido efectos/check.mp3${g.check_con ? `, en la opcion que elige al decir "${g.check_con}"` : ''}` : '')
              )
            );
            if (!plan && variante === 'B') L.push('              Con un clic (efectos/clic.mp3) al aparecer.');
          }
        }
      }
      if (conProducto && manifiesto.sticker_producto.toma === t.n) {
        const sp = manifiesto.sticker_producto;
        if (productoCentro) {
          const p = productoCentro;
          L.push(`  Producto: ${p.archivo} AL CENTRO, a la altura del pecho (su centro a ${pct(p.centroX)} del ancho y ${pct(p.centroY)} del alto,`);
          L.push(`            mide ${pct(p.ancho)} del ancho), desde ${seg(p.desde)}, ${s2(p.duracion)} s, cuando dice "${sp.sincroniza_con}", con un "pop".`);
          L.push(`            ${p.sticker === 'recorte' ? 'Recortado: la foto tiene transparencia.' : 'Dentro de una tarjeta blanca: la foto no tiene transparencia.'}`);
          const clic = clicDe(p);
          if (clic) L.push(`            Clic: ${clic.archivo} desde ${seg(clic.desde)} (su golpe cae justo cuando aparece).`);
        } else if (stickerViejo) {
          L.push(`  Sticker:  ${stickerViejo.archivo} como sticker en la esquina superior ${stickerViejo.lado}, desde ${seg(stickerViejo.desde)}, ${s2(stickerViejo.duracion)} s (cuando dice "${sp.sincroniza_con}").`);
        } else {
          L.push(
            `  Producto: la foto del producto AL CENTRO, con un clic, cuando dice "${sp.sincroniza_con}", ${n(cfgE.producto.seg)} s` +
              (plan ? '   — en este montaje quedo fuera (mira los avisos).' : '.')
          );
        }
      }
      L.push('');

      if (variante === 'A' && t.n === congeladoTras) {
        // El sonido del congelado: congelado.mp3 (el glitch) o, en un plan de
        // antes, deep-woosh.mp3.
        const golpe = sonidos.find((p) => /(congelado|deep-woosh)\.mp3$/.test(p.archivo));
        if (congelado) {
          L.push(`CONGELADO   ${seg(congelado.desde)} -> ${seg(congelado.desde + congelado.duracion)}   (${s2(congelado.duracion)}s)`);
          if (congeladoGlitch) {
            // Lo que dibuja Escena.jsx con variante "glitch" (la opcion 5, la elegida en las pruebas).
            const finUtil = b && !b.toma.problema ? b.toma.largoOriginal - (b.toma.recorteFin ?? 0) : null;
            L.push(`  ${congelado.archivo}: el ultimo fotograma de toma-${t.n}.mp4${finUtil !== null ? ` (su segundo ${s2(finUtil)}, donde termina el corte)` : ''}, quieto,`);
            L.push('  con un golpe de GLITCH: acercamiento corto (1 -> 1.10 en 0.27 s, y despues sigue creciendo');
            L.push('  despacio), una sacudida de tres cuadros, los colores separados (rojo y azul corridos) los');
            L.push('  primeros 0.45 s y la imagen en NEGATIVO en dos golpes (de 0 a 0.15 s y de 0.30 a 0.40 s).');
          } else {
            L.push(`  ${congelado.archivo}: el ultimo fotograma de toma-${t.n}.mp4, quieto. Con golpe: zoom corto`);
            L.push('  (1 -> 1.08 en 0.25 s), una sacudida de dos o tres cuadros y un destello blanco que se apaga.');
          }
          if (golpe) L.push(`  Sonido: ${golpe.archivo} arrancando en ${seg(golpe.desde)} (${s2(congelado.desde - golpe.desde)} s antes del corte: ahi cae su ataque).`);
          L.push('  Ocupa tiempo: el siguiente clip empieza cuando termina el congelado.');
        } else {
          parrafo(
            `CONGELADO   despues de este clip: ${n(cfgE.congeladoSeg)} s con su ultimo fotograma quieto y un golpe de glitch ` +
              '(acercamiento corto, sacudida, los colores separados y el negativo en dos golpes), con el sonido efectos/congelado.mp3 ' +
              '(su ataque justo en el corte).' +
              (plan ? ' — en este montaje no se pudo sacar el fotograma (mira los avisos).' : '')
          );
        }
        L.push('');
      }
    }

    // Cadena de B-roll de la historia (A).
    const cadena = piezas.filter((p) => p.tipo === 'clip' && p.capa === 1 && p.mudo && p.marco === 'completo');
    const brollHistoria = (manifiesto.broll || []).filter((b) => b.cierre !== true && Number.isInteger(b.encima_de_toma));
    if (variante === 'A' && (cadena.length || brollHistoria.length)) {
      L.push('-'.repeat(78));
      L.push('');
      if (cadena.length && historia.length) {
        const desde = historia[0].inicio;
        const hasta = historia[historia.length - 1].fin;
        L.push(`CADENA DE B-ROLL (tapa la historia: ${seg(desde)} -> ${seg(hasta)}). Todos MUDOS, a pantalla`);
        L.push('completa, uno detras de otro, en corte seco. Mientras tanto se oye la voz de los clips.');
        cadena.forEach((p, i) => {
          const num = Number(String(p.archivo).replace(/\D/g, ''));
          const br = (manifiesto.broll || []).find((x) => x.n === num);
          L.push(`  ${i + 1}) video/${p.archivo}   ${seg(p.desde)} -> ${seg(p.desde + p.duracion)} (${s2(p.duracion)}s) a ${s2(p.velocidad)}x` + (br ? `   "${br.sincroniza_con}" (toma ${br.encima_de_toma})` : ''));
          if (p.velocidad !== 1 && p.velocidad < 1) L.push(`     Ralentizado para llenar su tramo.`);
          if (p.congelarFinal) L.push('     Aun asi no alcanza: cuando el clip se acaba, su ultimo fotograma se queda quieto (con un zoom muy suave) hasta el final del tramo.');
          if (p.velocidad > 1) L.push('     Acelerado un poco para que se vea mas del clip; lo que sobra se corta del final.');
        });
      } else {
        L.push('CADENA DE B-ROLL (tapa la historia). Mudos, a pantalla completa, uno detras de otro:');
        brollHistoria.forEach((b, i) => L.push(`  ${i + 1}) video/broll-${b.n}.mp4   (${b.duracion}s)   desde que dice "${b.sincroniza_con}" (toma ${b.encima_de_toma}) hasta la frase del siguiente`));
        L.push('  El primero arranca con la historia aunque su frase caiga despues; el ultimo llega al final.');
      }
      L.push('');
    }

    // Cierre con CTA.
    const brollCierre = (manifiesto.broll || []).find((b) => b.cierre === true);
    if (brollCierre) {
      L.push('-'.repeat(78));
      L.push('');
      const texto = piezas.find((p) => p.tipo === 'texto');
      if (cierre) {
        L.push(`CIERRE   ${seg(cierre.desde)} -> ${seg(cierre.desde + cierre.duracion)}   (${s2(cierre.duracion)}s)`);
        L.push(`  video/${cierre.archivo} entero, MUDO, a 1x, entrando con un fundido de ${dis} s sobre lo anterior.`);
      } else {
        L.push('CIERRE   (despues del ultimo clip)');
        L.push(`  video/broll-${brollCierre.n}.mp4 entero, MUDO, a 1x, entrando con un fundido de ${dis} s.` + (plan ? '   — en este montaje quedo fuera (mira los avisos).' : ''));
      }
      const cta = texto?.texto || ent.cta?.texto;
      const flecha = texto ? texto.flecha : ent.cta?.flecha === true;
      if (cta) {
        L.push(`  Texto:  "${cta}"  en una capsula del color de los subtitulos, letra blanca gruesa,`);
        L.push('          en el tercio superior, durante todo el cierre.' + (flecha ? ' Mas una flecha ROJA hacia abajo, con' : ''));
        if (flecha) L.push('          rebote suave, centrada en el tercio inferior (por encima de los subtitulos).');
      } else {
        L.push('  Texto:  ninguno (entrevista.cta.texto esta vacio).');
      }
      L.push('');
    }
  }

  if (plan?.avisos?.length) {
    L.push('-'.repeat(78));
    L.push('');
    L.push('AVISOS DEL PLAN (ninguno detiene el montaje)');
    for (const a of plan.avisos) L.push(`  ! ${a}`);
    L.push('');
  }

  L.push('-'.repeat(78));
  L.push('');
  L.push('SUBTITULOS');
  L.push('  Palabra resaltada, como en todos los estilos. Salen de transcribir los clips:');
  L.push(`      node produccion/subtitulos-dialogo.js ${carpetaCmd}`);
  if (esPodcast) {
    L.push('  Cada linea se subtitula con su trozo de clip, en el orden del guion.');
    const alto = cfgP.subtitulosEnBroll;
    parrafo(
      `Van abajo (a ${n(alturaBase)} del alto, desde abajo) y SUBEN a ${n(alto.desdeAbajo)} mientras va un B-roll ` +
        `(los bloques con mas de ${pct(alto.fraccionMinima)} de su tiempo encima de uno): ` +
        (plan?.escena?.modoBroll === 'esquina' || (!plan && manifiesto.podcast?.broll?.modo === 'esquina')
          ? 'quedan por encima del host recortado.'
          : 'quedan en la union, sobre el degradado.'),
      '  '
    );
    if (plan && plan.subtitulos?.length) {
      const tramos = subtitulosSubidos();
      if (tramos.length) listarSubidos(tramos);
      else if (!plan.reglas?.podcast?.subtitulosEnBroll) planDeAntes();
      else if (piezas.some((p) => p.tipo === 'clip' && /^broll-/.test(String(p.archivo || '')))) L.push('  (En este plan ningun bloque cae sobre un B-roll.)');
    } else if (plan) {
      sinSubtitulos();
    }
  } else {
    const variante = plan?.escena?.variante || (esVarianteB ? 'B' : 'A');
    if (variante === 'A') {
      const alto = cfgE.subtitulosGancho;
      parrafo(
        `Durante el gancho van AL MEDIO de la pantalla (a ${n(alto.desdeAbajo)} del alto, desde abajo: no tapan la cara), ` +
          `y desde el congelado, abajo (a ${n(alturaBase)}).`,
        '  '
      );
      if (plan && plan.subtitulos?.length) {
        const tramos = subtitulosSubidos();
        if (tramos.length) listarSubidos(tramos);
        else if (!plan.reglas?.entrevista?.subtitulosGancho) planDeAntes();
        else if (!plan.escena.congelado) L.push('  (Este plan no tiene congelado: van todos abajo.)');
      } else if (plan) {
        sinSubtitulos();
      }
    } else {
      L.push(`  Siempre abajo (a ${n(alturaBase)} del alto, desde abajo).`);
    }
  }
  L.push('');
  L.push('AUDIO');
  L.push('  La voz viene DENTRO de cada clip y va a su nivel (0 dB), sin agacharla. Los');
  if (esPodcast) {
    const cutawaysDelPlan = (plan?.bloques || []).map((b) => b.cutaway).filter(Boolean);
    const mudos = cutawaysDelPlan.length > 0 && !cutawaysDelPlan.some((c) => c.conSonido);
    if (mudos) {
      L.push('  B-roll y los cutaways van MUDOS. Un fade corto (~80ms) en cada corte evita que suene seco.');
    } else {
      L.push('  B-roll van MUDOS, y el host que se ve con el B-roll tambien (el audio es el de su');
      L.push(`  linea). Los cutaways suenan con su reaccion a ${n(cfgP.cutawayVolumenDb)} dB. Un fade corto (~80ms) en cada`);
      L.push('  corte evita que suene seco.');
    }
  } else {
    L.push('  B-roll van MUDOS. Un fade corto (~80ms) en cada corte evita que suene seco.');
    // Los sonidos del montaje que trae el plan (o los que pondra, sin plan).
    const variante = plan?.escena?.variante || (esVarianteB ? 'B' : 'A');
    const queEs = { 'check.mp3': 'el check', 'congelado.mp3': 'el glitch del congelado', 'deep-woosh.mp3': 'el golpe del congelado', 'clic.mp3': 'cada icono y el producto' };
    const usados = plan
      ? [...new Set(piezas.filter((p) => p.tipo === 'sonido').map((p) => p.archivo))]
      : variante === 'A'
        ? ['efectos/check.mp3', 'efectos/congelado.mp3']
        : ['efectos/clic.mp3'];
    if (usados.length) {
      L.push('  Los sonidos del montaje van a su nivel, en los segundos que dice arriba (cada uno');
      L.push('  arranca un pelo antes, para que su golpe caiga justo):');
      for (const a of usados) L.push(`      ${a}${queEs[path.basename(a)] ? `   (${queEs[path.basename(a)]})` : ''}`);
    }
  }
  L.push('  Sin musica de fondo y sin transiciones de plantilla (woosh, zoom): este estilo');
  L.push('  no las lleva' + (esVarianteB ? ', salvo el fundido corto entre clips' : '') + '.');
  L.push('');
  L.push('='.repeat(78));

  const salida = path.join(carpeta, 'plan-montaje.txt');
  fs.writeFileSync(salida, L.join('\n') + '\n', 'utf8');
  return salida;
}

export function escribirPlanLegible(carpeta) {
  const manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  // Estilos hablados (podcast, entrevista: tomas H): su propio plan, con lo que
  // se ve encima del audio. Cualquier otro estilo sigue como siempre.
  if (ESTILOS_HABLADOS.includes(manifiesto.estilo)) return escribirPlanHablado(carpeta, manifiesto);
  // Anuncio por bloques (UGC tipo R): su propio plan. El resto, como siempre.
  if (manifiesto.tomas.some((t) => t.tipo === 'R')) return escribirPlanBloques(carpeta, manifiesto);
  // Anuncio con continuidad: su propio plan (sin cortes, solo velocidad).
  if (tieneContinuidad(manifiesto)) return escribirPlanContinuidad(carpeta, manifiesto);
  const rutaTiempos = path.join(carpeta, 'audio', 'tiempos.json');
  const dialogoNativo = manifiesto.modo_audio === 'dialogo_nativo';
  // En musica tambien hay pista maestra y tambien hay tiempos.json: lo escribe
  // tiempos-cancion.js con la misma forma. Lo unico distinto es que la pista
  // es una cancion y no se puede tocar.
  const esMusical = manifiesto.modo_audio === 'musica';
  const hayAudio = !dialogoNativo && fs.existsSync(rutaTiempos);
  const tiempos = hayAudio ? JSON.parse(fs.readFileSync(rutaTiempos, 'utf8')) : null;

  // Si ya se planeo el montaje, de ahi salen los recortes de borde reales.
  const rutaPlan = path.join(carpeta, 'plan-montaje.json');
  const plan = fs.existsSync(rutaPlan) ? JSON.parse(fs.readFileSync(rutaPlan, 'utf8')) : null;
  const bloquePorToma = new Map((plan?.bloques || []).map((b) => [b.linea, b]));

  const L = [];
  const nombre = path.basename(carpeta);

  L.push('='.repeat(78));
  L.push(`PLAN DE MONTAJE — ${nombre}`);
  L.push('='.repeat(78));
  L.push('');
  L.push('Esto es para armar el anuncio a mano (CapCut, Premiere, lo que uses).');
  L.push('Todos los archivos que se nombran estan en esta misma carpeta.');
  L.push('');

  if (dialogoNativo) {
    L.push('VOZ EN OFF:  no hay. El personaje habla DENTRO de cada clip, con lip-sync.');
    L.push('');
    L.push('REGLA MADRE: manda el clip. Aca es al reves que en los otros estilos:');
    L.push('la ventana de cada escena es lo que dura su clip, y la duracion total');
    L.push('del anuncio es la suma de los clips. No hay pista de voz que calzar.');
    L.push('');
    L.push('LO QUE NO SE HACE, NUNCA:');
    L.push('  - No aceleres una toma hablada: deforma la voz y desincroniza la boca.');
    L.push('  - No cortes por DENTRO del dialogo: ahi vive el lip-sync.');
    L.push('  Si una toma no te entra, se REGENERA el clip. No se ajusta.');
    L.push('');
    L.push('LO QUE SI: recortale a cada clip el silencio de los BORDES (los valores');
    L.push('van toma por toma mas abajo).');
    L.push('');
    L.push('EL B-ROLL VA ENCIMA, NO EN FILA. Es un cutaway: tapa la imagen unos');
    L.push('segundos mientras la voz de la toma sigue sonando por debajo. No abre');
    L.push('hueco y no alarga el anuncio. Va acelerado y mudo.');
    L.push('La duracion total es la suma de las tomas principales recortadas.');
  } else if (hayAudio && esMusical) {
    L.push(`CANCION:     audio/cancion.mp3     duracion ${tiempos.duracion.toFixed(2)}s`);
    L.push(`             "${tiempos.voz.nombre}"`);
    L.push('');
    L.push('REGLA MADRE: manda la cancion. Ponla en la linea de tiempo primero,');
    L.push('ENTERA, y calza cada clip en su ventana. El video se adapta a ella.');
    L.push('');
    L.push('LO QUE NO SE HACE, NUNCA:');
    L.push('  - No cortes la cancion, no la aceleres, no la recortes.');
    L.push('    La duracion del anuncio ES la duracion de la cancion.');
    L.push('  - No le pongas musica de fondo debajo: la cancion ya es el audio.');
    L.push('  - No le pongas efectos de transicion (woosh, zoom, deslizamientos)');
    L.push('    ni animaciones de entrada. En este estilo no van.');
    L.push('');
    L.push('Las tomas marcadas [intro] / [instrumental] / [cierre] cubren tramos');
    L.push('donde no se canta nada. Van igual, y no llevan subtitulo.');
  } else if (hayAudio) {
    L.push(`VOZ EN OFF:  audio/voz.mp3        duracion ${tiempos.duracion.toFixed(2)}s`);
    L.push(`             voz: ${tiempos.voz.nombre}${tiempos.voz.clonada ? ' (clonada)' : ''}`);
    L.push('');
    L.push('REGLA MADRE: manda el audio. Pon el mp3 en la linea de tiempo primero');
    L.push('y calza cada clip en su ventana. El video se adapta a la voz, nunca al reves.');
  } else if (esMusical) {
    L.push('CANCION:     todavia no generada');
    L.push('             npm run cancion -- <carpeta>   y despues  --elegir N');
    L.push('             npm run tiempos -- <carpeta>');
  } else {
    L.push('VOZ EN OFF:  todavia no generada (npm run audio -- <carpeta>)');
    L.push('Los tiempos de abajo son los ESTIMADOS por la skill, no los reales.');
  }
  L.push('');
  L.push('-'.repeat(78));
  L.push('');

  let acumulado = 0;

  for (let i = 0; i < manifiesto.tomas.length; i++) {
    const t = manifiesto.tomas[i];
    const linea = tiempos?.lineas.find((l) => l.toma === t.n);

    let inicio, fin;
    const bloque = bloquePorToma.get(t.n);
    if (dialogoNativo && bloque) {
      // Los tiempos reales salen del plan: en este modo la ventana es lo que
      // dura el clip ya recortado, no la duracion estimada por la skill.
      inicio = bloque.inicio;
      fin = bloque.fin;
      acumulado = bloque.broll ? bloque.broll.desde + bloque.broll.duracion : fin;
    } else if (linea && linea.inicio !== null) {
      inicio = linea.inicio;
      const sig = tiempos.lineas[i + 1];
      fin = sig ? sig.inicio : tiempos.duracion;
    } else {
      inicio = acumulado;
      fin = acumulado + t.duracion;
      acumulado = fin;
    }

    L.push(`TOMA ${t.n}   (tipo ${t.tipo})`);
    L.push(`  Cuando:   ${seg(inicio)} -> ${seg(fin)}   (${(fin - inicio).toFixed(2)}s de ventana)`);
    L.push(`  Dice:     "${t.linea}"`);
    L.push(`  Clip:     video/toma-${t.n}.mp4`);
    if (dialogoNativo) {
      const b = bloquePorToma.get(t.n);
      if (b?.toma?.recorteInicio !== undefined) {
        L.push(`            Recorta ${b.toma.recorteInicio.toFixed(2)}s del INICIO y ${b.toma.recorteFin.toFixed(2)}s del FINAL (silencio).`);
        L.push(`            Quedan ${b.toma.duracion.toFixed(2)}s utiles de los ${b.toma.largoOriginal.toFixed(2)}s del clip.`);
        if (b.toma.pausasInteriores) {
          L.push(`            OJO: tiene ${b.toma.pausasInteriores} pausa(s) DENTRO del dialogo. No las toques.`);
        }
      } else {
        L.push('            Recorta el silencio de los bordes (mira donde empieza y termina de hablar).');
      }
      L.push('            NO la aceleres ni le cortes por dentro: rompe el lip-sync.');
    } else if (t.tipo === 'B') {
      L.push('            Tipo B: empieza y termina en estados distintos.');
      L.push('            Si sobra metraje ACELERALO, no le cortes el final: perderias la segunda accion.');
    } else {
      L.push('            Plano sostenido: si sobra metraje, corta desde el FINAL.');
      L.push('            El primer fotograma es el compuesto, ese se respeta siempre.');
    }

    const b = (manifiesto.broll || []).find((x) => tomaDelBroll(x) === t.n);
    if (b) {
      L.push(`  B-roll:   video/broll-${b.n}.mp4   (${b.duracion}s)`);
      if (dialogoNativo) {
        const bl = bloquePorToma.get(t.n);
        L.push(`            INSERTO ENCIMA de esta toma (cutaway), sincroniza con: "${b.sincroniza_con}"`);
        if (bl?.broll) {
          L.push(`            Ponlo en ${seg(bl.broll.desde)}, dura ${bl.broll.duracion.toFixed(2)}s, acelerado a ${bl.broll.velocidad.toFixed(2)}x.`);
        } else {
          L.push('            (en este montaje quedo fuera: no entraba sin tapar el arranque o el cierre)');
        }
        L.push('            TAPA LA IMAGEN, NO EL AUDIO: la voz de la toma sigue sonando por debajo,');
        L.push('            a su nivel normal, sin agacharla y sin cortarla. No abre hueco:');
        L.push('            el anuncio NO se alarga por meter un inserto.');
        L.push('            El audio del inserto va MUDO (acelerado sonaria a ardilla).');
      } else {
        L.push(`            va DESPUES de esta toma, sincronizado con: "${b.sincroniza_con}"`);
        L.push('            Metelo solo si la ventana se hace larga y la toma se estira.');
      }
    } else {
      L.push('  B-roll:   no hay para esta toma');
    }

    const ov = (manifiesto.overlays || []).filter((o) => o.toma === t.n);
    for (const o of ov) L.push(`  Texto:    "${o.texto}"  (${o.momento})`);

    L.push('');
  }

  L.push('-'.repeat(78));
  L.push('');
  L.push('B-ROLL SOBRANTES');
  L.push('Cada toma tiene su B-roll generado, pero no hace falta usarlos todos.');
  L.push('Los que no metas simplemente quedan sin usar. No pasa nada.');
  L.push('');
  L.push('SUBTITULOS');
  if (hayAudio) {
    L.push('  audio/tiempos.json trae el tiempo exacto de cada caracter de la narracion.');
    L.push('  De ahi salen subtitulos de 2-4 palabras perfectamente sincronizados.');
  } else {
    L.push('  Se generan al crear la voz.');
  }
  L.push('');
  L.push('AUDIO DE LOS CLIPS');
  L.push('  Los clips traen ambiente y efectos, sin voces. Mezclalos por debajo de la');
  L.push('  narracion (unos -18/-20 dB) y ponles un fade corto de ~80ms en cada corte');
  L.push('  para que no suenen secos.');
  L.push('');
  L.push('='.repeat(78));

  const salida = path.join(carpeta, 'plan-montaje.txt');
  fs.writeFileSync(salida, L.join('\n') + '\n', 'utf8');
  return salida;
}

if (process.argv[1] && process.argv[1].endsWith('plan-para-humanos.js')) {
  const carpetaArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/plan-para-humanos.js <carpeta-del-anuncio>\n');
    process.exit(1);
  }
  const salida = escribirPlanLegible(path.resolve(carpetaArg));
  console.log(`\n  Escrito: ${salida}\n`);
}
