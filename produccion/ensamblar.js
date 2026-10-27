// FASE 2.5 (paso 2) — renderiza el MP4 final con Remotion, a partir de plan-montaje.json.
//
//   node produccion/ensamblar.js temp/mi-anuncio
//
// Este paso es OPCIONAL (COMO-PRODUCIR.md, seccion 8): quien prefiera editar a mano se lleva
// los clips y plan-montaje.txt a CapCut.
//
// AVISO DE LICENCIA: Remotion es gratis para individuos y empresas de menos de
// 3 empleados. Con 3 o mas hace falta licencia comercial, y el tier de
// automatizacion cobra por render. Ver el README.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { RAIZ, DIR_OUTPUT, ESTILOS_HABLADOS, ESTILOS_SIN_MUSICA } from './config.js';
import { escribirPlanLegible } from './plan-para-humanos.js';
import { PISTA_FIJA_POR_ESTILO } from './pista-fija.js';
import { tieneContinuidad, cadenaDeClips, medirClip } from './continuidad.js';

const DIR_REMOTION = path.join(RAIZ, 'remotion');

// Calidad del h264. CRF es calidad constante: el codificador gasta bits donde
// hacen falta y ahorra donde no, en vez de forzar un bitrate fijo.
//
// 18 es el default de Remotion, pensado para material que se va a seguir
// editando: casi sin perdida, pero infla el archivo. 21 en 720x1280 es
// visualmente equivalente y pesa un tercio menos. Meta reencoda todo lo que
// se sube, asi que subir un archivo enorme no mejora lo que ve el usuario:
// solo tarda mas en cargar. Mas alto que 23 si empieza a notarse en las
// texturas de lana, que es justo donde vive este estilo.
const CRF = 21;

/**
 * CONTINUIDAD: lo que impide renderizar un plan de continuidad (o renderizar
 * con un plan viejo un anuncio que ya tiene continuidad). Sin el bloque ni en
 * el manifiesto ni en el plan, devuelve [] sin mirar nada mas.
 *
 *   - el manifiesto trae "continuidad" y el plan no, o al reves: el plan es de
 *     antes del cambio;
 *   - la cadena del manifiesto no es la del plan (cambiaron tomas o pasos);
 *   - el plan se hizo cuando un clip todavia no existia (falta: true): su
 *     velocidad salio del largo pedido, no del real;
 *   - un clip cambio de largo despues del plan (se rehizo): su velocidad ya
 *     no lo hace entrar justo en su lugar.
 */
export function problemasDeContinuidad(carpeta, plan) {
  let manifiesto = null;
  try {
    manifiesto = JSON.parse(fs.readFileSync(path.join(carpeta, 'manifiesto.json'), 'utf8'));
  } catch {
    manifiesto = null;
  }
  const enManifiesto = tieneContinuidad(manifiesto);
  const enPlan = Boolean(plan.continuidad);
  if (!enManifiesto && !enPlan) return [];
  if (enManifiesto && !enPlan) return ['el manifiesto tiene continuidad y el plan es de antes: monta una toma por linea, con B-roll y cortes.'];
  if (!enManifiesto && enPlan && manifiesto) return ['el plan es de continuidad y el manifiesto ya no trae el bloque "continuidad".'];

  const problemas = [];
  if (manifiesto) {
    const enCadena = cadenaDeClips(manifiesto).map((c) => c.archivo).join(', ');
    if (enCadena !== plan.continuidad.clips.map((c) => c.archivo).join(', ')) {
      problemas.push('la cadena de clips del manifiesto ya no es la del plan (cambiaron las tomas o los pasos).');
    }
  }
  const sinClip = plan.continuidad.clips.filter((c) => c.falta).map((c) => c.archivo);
  if (sinClip.length) {
    problemas.push(`el plan se hizo cuando faltaba${sinClip.length > 1 ? 'n' : ''} ${sinClip.join(', ')}: su velocidad sale del largo pedido, no del real.`);
  }
  const cambiados = [];
  for (const c of plan.continuidad.clips) {
    const ruta = path.join(carpeta, 'video', c.archivo);
    if (c.falta || !fs.existsSync(ruta)) continue;
    const medida = medirClip(ruta);
    const distinto = Number.isInteger(c.frames) && Number.isInteger(medida.frames)
      ? medida.frames !== c.frames
      : Math.abs(medida.segundos - c.largoOriginal) > 0.01;
    if (distinto) cambiados.push(`${c.archivo} (en el plan ${c.largoOriginal.toFixed(3)}s, ahora ${medida.segundos.toFixed(3)}s)`);
  }
  if (cambiados.length) problemas.push(`cambio el largo de ${cambiados.join(', ')}: se rehizo despues del plan.`);
  return problemas;
}

/**
 * Los archivos que el plan nombra y no estan en la carpeta del anuncio (lista
 * vacia si estan todos). La usa ensamblar, antes de arrancar el render.
 */
export function archivosQueFaltan(carpeta, plan) {
  // CONTINUIDAD: el plan trae la cadena de clips (plan.continuidad.clips) y los
  // bloques van sin `toma`. ESTILOS HABLADOS: las piezas vienen en plan.escena.
  const continuidad = plan.continuidad ?? null;
  const escena = plan.escena ?? null;
  const faltan = [];
  if (continuidad) {
    for (const c of continuidad.clips) {
      if (!fs.existsSync(path.join(carpeta, 'video', c.archivo))) faltan.push(c.archivo);
    }
  } else {
    for (const b of plan.bloques) {
      if (!fs.existsSync(path.join(carpeta, 'video', b.toma.archivo))) faltan.push(b.toma.archivo);
      if (b.broll && !fs.existsSync(path.join(carpeta, 'video', b.broll.archivo))) faltan.push(b.broll.archivo);
    }
  }
  if (escena) {
    // Las piezas de la escena: los clips viven en video/, el resto (congelado,
    // iconos, foto del producto, efectos) relativo a la carpeta del anuncio.
    for (const p of escena.piezas || []) {
      if (!p.archivo) continue;
      const ruta = p.tipo === 'clip' ? path.join(carpeta, 'video', p.archivo) : path.join(carpeta, p.archivo);
      if (!fs.existsSync(ruta) && !faltan.includes(p.archivo)) faltan.push(p.archivo);
    }
  }
  // La voz en off solo se exige si el plan la declara. En dialogo_nativo el
  // personaje habla dentro del clip y no hay pista aparte.
  if (plan.audio?.voz && !fs.existsSync(path.join(carpeta, plan.audio.voz))) faltan.push(plan.audio.voz);
  return faltan;
}

if (process.argv[1] && process.argv[1].endsWith('ensamblar.js')) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find(
    (a) => !a.startsWith('--') && !['--musica-db', '--sub-tamano', '--concurrencia'].includes(args[args.indexOf(a) - 1])
  );

  // --concurrencia N: cuantos fotogramas renderiza Remotion a la vez. Sin el,
  // Remotion decide (la mitad de los nucleos). Con poca memoria libre (2,5 GB
  // medidos el 2026-10-11 con Cayenne y el 2026-10-13 con la prueba en seco de
  // entrevista A) el extractor falla con "No frame found at position" y con
  // concurrencia 1 sale bien, mas lento. Vale para todos los estilos y no
  // cambia nada del montaje.
  const iCon = args.indexOf('--concurrencia');
  const concurrencia = iCon !== -1 && args[iCon + 1] !== undefined ? Number(args[iCon + 1]) : null;

  // --musica-db N: renderiza SOLO la version con musica, a ese nivel, y le pone
  // el nivel en el nombre del archivo. Sirve para elegir de oido cuanto tiene
  // que sonar la musica sin volver a planear ni gastar creditos: renderizar es
  // gratis. El valor elegido despues se fija en REGLAS, no aca.
  const iDb = args.indexOf('--musica-db');
  const musicaDbForzado = iDb !== -1 && args[iDb + 1] !== undefined ? Number(args[iDb + 1]) : null;

  // --sub-tamano N: renderiza SOLO la version con subtitulos, con ese tamano de
  // letra (proporcion del ancho), y lo pone en el nombre del archivo. Igual que
  // --musica-db: sirve para elegir de ojo sin gastar creditos.
  //
  // OJO: el tamano de subtitulos vive en REGLAS.subtitulos, que es COMPARTIDO
  // por todos los estilos. Si el valor probado aca se adopta, cambia tambien
  // crochet, claymation y los demas. No es un ajuste de UGC.
  const iSub = args.indexOf('--sub-tamano');
  const subTamanoForzado = iSub !== -1 && args[iSub + 1] !== undefined ? Number(args[iSub + 1]) : null;

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/ensamblar.js <carpeta-del-anuncio>\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const rutaPlan = path.join(carpeta, 'plan-montaje.json');

  if (!fs.existsSync(rutaPlan)) {
    console.error(`\n  Falta ${rutaPlan}.\n  Genera el plan primero:\n      npm run plan -- ${carpetaArg}\n`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(DIR_REMOTION, 'node_modules'))) {
    console.error('\n  Remotion no esta instalado. Entra a remotion/ y ejecuta: npm install\n');
    process.exit(1);
  }

  const plan = JSON.parse(fs.readFileSync(rutaPlan, 'utf8'));
  // CONTINUIDAD: el plan trae la cadena de clips (plan.continuidad.clips) y los
  // bloques van sin `toma`. Sin ese bloque, todo sigue como siempre.
  const continuidad = plan.continuidad ?? null;
  // ESTILOS HABLADOS (podcast, entrevista): el plan trae `escena`, las capas de
  // video que renderiza Remotion (clips, congelado, iconos, sticker, texto del
  // CTA, sonidos); los bloques son solo la linea de tiempo del audio. Sin
  // `escena`, todo sigue como siempre.
  const escena = plan.escena ?? null;

  // Verifica que exista todo lo que el plan nombra, antes de arrancar el render.
  const faltan = archivosQueFaltan(carpeta, plan);
  if (faltan.length) {
    console.error(`\n  Faltan archivos que el plan necesita:\n`);
    for (const f of faltan) console.error(`      ${f}`);
    console.error('');
    process.exit(1);
  }

  // CONTINUIDAD: que el plan sea de la cadena que hay en disco. Si no, Remotion
  // montaria el anuncio de antes o pondria un clip a una velocidad pensada
  // para otro largo (y entonces se cortaria o se congelaria).
  const problemas = problemasDeContinuidad(carpeta, plan);
  if (problemas.length) {
    console.error('\n  El plan de montaje no corresponde a lo que hay en la carpeta:\n');
    for (const p of problemas) console.error(`  !  ${p}`);
    console.error(`\n  Vuelve a planear (gratis) y despues ensambla:\n      npm run plan -- ${carpetaArg}\n`);
    process.exit(1);
  }

  const REGLAS_SUBTITULOS_DEFECTO = 0.06137;
  const nombre = path.basename(carpeta);

  if (musicaDbForzado !== null) {
    if (!plan.musica?.archivo) {
      console.error('\n  --musica-db pero este anuncio no tiene pista de musica.\n');
      process.exit(1);
    }
    plan.musica.db = musicaDbForzado;
    console.log(`\n  Prueba de nivel: la musica va a ${musicaDbForzado} dB (solo la version con musica).`);
  }
  fs.mkdirSync(DIR_OUTPUT, { recursive: true });

  // FASE 2.7 — TRES versiones del mismo montaje: mismos cortes, mismas
  // duraciones. Lo unico que cambia son las capas que se apagan.
  //
  //   con-subtitulos              la que se sube a Meta
  //   solo-subtitulos             subtitulos SI, musica NO: para ponerle otra pista
  //   sin-subtitulos-sin-musica   para llevar a CapCut y ponerle lo propio
  //
  // La tercera NO apaga el audio de los clips ni la voz en off: eso es el
  // contenido, no una capa de arreglo. Apaga musica y subtitulos, nada mas.
  // Existe porque hoy hay que elegir entre el MP4 terminado y los clips
  // sueltos, y el punto medio -montado pero sin las capas que uno quiere
  // cambiar- no existia.
  //
  // La SEGUNDA cambio el 2026-09-05 (decision del sistema, vale para TODOS los
  // estilos): antes era "sin subtitulos con musica" y ahora es al reves,
  // "con subtitulos sin musica". El caso real es querer cambiar la pista
  // musical sin perder el subtitulado, que es el trabajo caro. La combinacion
  // vieja -musica sin subtitulos- ya la cubre la tercera para quien la quiera.
  //
  // EXCEPCION — modo_audio "musica": salen DOS, no tres.
  //
  // Las tres de arriba existen para poder cambiar la pista musical. En un
  // anuncio musical no hay pista que cambiar: la cancion es el contenido, no
  // una capa, y va por `audio.voz` justamente para que `sinMusica` no la
  // toque. Con eso, la primera y la segunda version saldrian identicas y la
  // tercera solo se distinguiria por el subtitulo. Quedan dos: con y sin.
  const rutaManifiesto = path.join(carpeta, 'manifiesto.json');
  const manifiesto = fs.existsSync(rutaManifiesto)
    ? JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8'))
    : null;
  const modoAudio = manifiesto?.modo_audio ?? null;
  const esMusical = modoAudio === 'musica';
  // Estilos sin musica por decision del estilo (podcast, entrevista): salen DOS
  // versiones, como el musical, y no se avisa de musica ni de transiciones.
  const sinMusicaPorEstilo = Boolean(manifiesto && ESTILOS_SIN_MUSICA.includes(manifiesto.estilo));

  // Un anuncio hablado (podcast, entrevista) con un plan sin `escena` es un plan
  // de antes de estos estilos: montaria una toma por linea y nada de lo que se
  // ve encima. Igual que con continuidad, se pide volver a planear (gratis).
  if (manifiesto && ESTILOS_HABLADOS.includes(manifiesto.estilo) && !escena) {
    console.error(`\n  El plan de montaje no trae la escena del estilo "${manifiesto.estilo}" (es de antes).`);
    console.error(`\n  Vuelve a planear (gratis) y despues ensambla:\n      npm run plan -- ${carpetaArg}\n`);
    process.exit(1);
  }

  // ---------------------------------------------------------------------
  // Lo que el motor NO comprobaba: la musica de fondo y las transiciones.
  //
  // Las dos son obligatorias en todos los estilos menos los dos cantados
  // (musical e historias musicales), pero un anuncio
  // sin ellas se renderiza perfecto, pasa todas las verificaciones y sale
  // plano. Nadie se entera. Encontrado el 2026-09-08 en la primera prueba
  // del paquete para alumnos: el anuncio salio sin ninguna de las dos.
  //
  // Esto NO detiene el render — a veces se renderiza a proposito sin ellas
  // para probar algo. Solo avisa, y lo hace ANTES y DESPUES, para que el
  // aviso no se pierda entre las lineas de progreso de Remotion.
  //
  // Las de PISTA_FIJA_POR_ESTILO (estilo-lego) las copia el plan solo: si aun
  // asi falta, es que el plan es de antes y basta con volver a planear.
  const PISTA_PROPIA = {
    skeleton: 'esqueleto.mp3',
    'zack-d-films': 'zack-d-films.mp3',
    ...PISTA_FIJA_POR_ESTILO,
  };

  const faltantes = [];
  if (manifiesto && !esMusical && !sinMusicaPorEstilo) {
    if (!plan.musica?.archivo) {
      const propia = PISTA_PROPIA[manifiesto.estilo];
      faltantes.push(
        propia
          ? `SIN MUSICA. El estilo "${manifiesto.estilo}" usa su pista fija:\n` +
            (PISTA_FIJA_POR_ESTILO[manifiesto.estilo]
              ? `     el plan la copia sola de recursos/musica/${propia}:  npm run plan -- ${carpetaArg}`
              : `     copia  recursos/musica/${propia}  ->  ${path.basename(carpeta)}/musica/fondo.mp3`)
          : `SIN MUSICA. En "${manifiesto.estilo}" es obligatoria:\n` +
            `     npm run musica -- ${carpetaArg}`
      );
    }
    // En continuidad no van: el paso entre escenas lo hace cada clip.
    if (!plan.transiciones?.length && !continuidad) {
      faltantes.push(
        'SIN TRANSICIONES. Falta transiciones.json o no declara ningun punto.\n' +
          '     Van 4: entrada del problema, de la solucion, de la prueba y del CTA.\n' +
          `     Y los efectos se copian de recursos/efectos-transiciones/ a ${path.basename(carpeta)}/efectos/`
      );
    }
  }

  const avisarFaltantes = (donde) => {
    if (!faltantes.length) return;
    console.log(`\n  ${'='.repeat(66)}`);
    console.log(`  ESTE ANUNCIO LE FALTA ALGO OBLIGATORIO DE SU ESTILO${donde}`);
    console.log(`  ${'='.repeat(66)}`);
    for (const f of faltantes) console.log(`\n  !  ${f}`);
    console.log('\n  El render funciona igual, pero el anuncio sale plano.');
    console.log(`  ${'='.repeat(66)}\n`);
  };

  avisarFaltantes('');

  //
  // Lo mismo en los estilos SIN musica por decision del estilo (podcast,
  // entrevista, ESTILOS_SIN_MUSICA): no hay pista que cambiar, asi que las
  // versiones con y sin musica serian la misma. Quedan dos: con y sin subtitulos.
  const versiones = esMusical || sinMusicaPorEstilo
    ? [
        {
          archivo: `${nombre}_9x16_con-subtitulos.mp4`,
          sinSubtitulos: false,
          sinMusica: true,
          etiqueta: 'con subtitulos',
        },
        {
          archivo: `${nombre}_9x16_sin-subtitulos.mp4`,
          sinSubtitulos: true,
          sinMusica: true,
          etiqueta: 'sin subtitulos',
        },
      ]
    : [
    { archivo: `${nombre}_9x16_con-subtitulos.mp4`, sinSubtitulos: false, sinMusica: false, etiqueta: 'con subtitulos y musica' },
    {
      archivo: `${nombre}_9x16_solo-subtitulos.mp4`,
      sinSubtitulos: false,
      sinMusica: true,
      etiqueta: 'solo subtitulos, sin musica',
    },
    {
      archivo: `${nombre}_9x16_sin-subtitulos-sin-musica.mp4`,
      sinSubtitulos: true,
      sinMusica: true,
      etiqueta: 'sin subtitulos y sin musica (para CapCut)',
    },
  ];

  if (subTamanoForzado !== null) {
    if (!plan.subtitulos?.length) {
      console.error('\n  --sub-tamano pero este anuncio todavia no tiene subtitulos.\n');
      process.exit(1);
    }
    plan.estiloSubtitulos = { ...plan.estiloSubtitulos, tamano: subTamanoForzado };
    const conSubs = versiones.filter((v) => !v.sinSubtitulos);
    versiones.length = 0;
    versiones.push({
      ...conSubs[0],
      archivo: `${nombre}_9x16_subs-${String(subTamanoForzado).replace('.', 'p')}.mp4`,
      etiqueta: `subtitulos a ${subTamanoForzado} del ancho`,
    });
    console.log(`\n  Prueba de tamano de subtitulos: ${subTamanoForzado} (por defecto ${REGLAS_SUBTITULOS_DEFECTO}).`);
  }

  if (musicaDbForzado !== null) {
    // Para probar niveles de musica sirve cualquier version QUE LA LLEVE. Desde
    // que la segunda version pasó a ser "solo subtitulos", la unica con musica
    // es la primera; buscar ademas por "sin subtitulos" dejaba la lista vacia y
    // reventaba al hacer el spread de undefined.
    const conMusica = versiones.filter((v) => !v.sinMusica);
    versiones.length = 0;
    versiones.push({
      ...conMusica[0],
      archivo: `${nombre}_9x16_musica-${String(musicaDbForzado).replace('-', 'menos')}dB.mp4`,
      etiqueta: `musica a ${musicaDbForzado} dB`,
    });
  }

  // Un archivo que se llama "con-subtitulos" y no los tiene es un archivo
  // que miente. Si todavia no se generaron, esa version no se renderiza.
  const haySubtitulos = Boolean(plan.subtitulos?.length);
  if (!haySubtitulos && subTamanoForzado === null) {
    // Se quitan las versiones que DICEN llevar subtitulos, no "la primera":
    // con --musica-db la lista trae otra cosa en esa posicion y se quedaba en cero.
    const fuera = versiones.filter((v) => !v.sinSubtitulos);
    for (const v of fuera) versiones.splice(versiones.indexOf(v), 1);
    if (fuera.length) {
    console.log('');
    console.log(`  Todavia no hay subtitulos, asi que NO se renderiza "${fuera[0].etiqueta}".`);
    console.log('  Salen las demas. Cuando existan los subtitulos, volve a correr esto');
    console.log('  y se genera la que falta.');
    }
  }

  if (versiones.length === 0) {
    console.error('\n  No queda ninguna version para renderizar.\n');
    process.exit(1);
  }

  console.log(`\n=== Render final — ${nombre} ===\n`);
  console.log(`  Duracion:   ${plan.duracion.toFixed(2)}s`);
  if (continuidad) {
    const cuantos = (rol) => continuidad.clips.filter((c) => c.rol === rol).length;
    console.log(
      `  Piezas:     ${continuidad.clips.length} en cadena (${cuantos('paso')} pasos + ${cuantos('propio')} propios B + ${cuantos('cierre')} cierre), ` +
        'seguidas y sin cortes: solo cambia la velocidad'
    );
  } else if (escena) {
    const cuantos = (tipo) => (escena.piezas || []).filter((p) => p.tipo === tipo).length;
    const partes = ['clip', 'imagen', 'icono', 'texto', 'sonido'].filter((t) => cuantos(t)).map((t) => `${cuantos(t)} ${t}${cuantos(t) > 1 ? 's' : ''}`);
    console.log(`  Piezas:     ${(escena.piezas || []).length} en la escena (${partes.join(' + ')}), sobre ${plan.bloques.length} trozos hablados`);
  } else {
    const piezas = plan.bloques.length + plan.bloques.filter((b) => b.broll).length;
    console.log(`  Piezas:     ${piezas} (${plan.bloques.length} tomas + ${piezas - plan.bloques.length} B-roll)`);
  }
  console.log(`  Formato:    9:16 vertical, h264, CRF ${CRF}`);
  // Las etiquetas ya dicen que es cada version; enumerarlas a mano aqui hacia
  // que en modo musica —donde salen dos— el texto siguiera nombrando tres.
  console.log(`  Versiones:  ${versiones.length} (${versiones.map((v) => v.etiqueta).join(' / ')})`);
  console.log('\n  Remotion es gratis para individuos y empresas de menos de 3 empleados.');
  console.log('  Con 3 o mas hace falta licencia: https://www.remotion.dev/license\n');

  const t0 = Date.now();
  const hechas = [];

  for (const v of versiones) {
    const salida = path.join(DIR_OUTPUT, v.archivo);

    // Los props van por archivo: el plan es grande para la linea de comandos.
    const rutaProps = path.join(carpeta, '.props-remotion.json');
    fs.writeFileSync(rutaProps, JSON.stringify({ plan, sinSubtitulos: v.sinSubtitulos, sinMusica: v.sinMusica }), 'utf8');

    console.log(`  --- ${v.etiqueta} ---`);

    // OJO en Windows: desde Node 20.12 no se puede lanzar un .cmd (npx.cmd) sin
    // shell: true — lo bloquea por seguridad y el spawn falla con EINVAL sin
    // mensaje claro. Por eso va con shell y las rutas entrecomilladas.
    const q = (s) => `"${s}"`;
    const r = spawnSync(
      'npx',
      [
        'remotion',
        'render',
        'src/index.jsx',
        'Anuncio',
        q(salida),
        q(`--props=${rutaProps}`),
        q(`--public-dir=${carpeta}`),
        `--crf=${CRF}`,
        '--log=info',
        ...(Number.isInteger(concurrencia) && concurrencia > 0 ? [`--concurrency=${concurrencia}`] : []),
      ],
      { cwd: DIR_REMOTION, stdio: 'inherit', encoding: 'utf8', shell: true }
    );

    fs.rmSync(rutaProps, { force: true });

    if (r.status !== 0) {
      console.error(`\n  El render "${v.etiqueta}" fallo. Mira el detalle de Remotion arriba.\n`);
      process.exit(1);
    }
    hechas.push({ ...v, salida, bytes: fs.statSync(salida).size });
  }

  // El plan legible se deja siempre, se haya usado Remotion o no.
  const planTxt = escribirPlanLegible(carpeta);

  const seg = ((Date.now() - t0) / 1000).toFixed(0);
  console.log(`\n  Listo en ${seg}s.\n`);
  for (const h of hechas) {
    const mb = h.bytes / 1024 / 1024;
    const mbps = (h.bytes * 8) / plan.duracion / 1e6;
    console.log(`  ${h.archivo}`);
    console.log(`      ${mb.toFixed(1)} MB   ${mbps.toFixed(2)} Mbps`);
  }
  console.log(`\n  Plan para editar a mano: ${planTxt}\n`);

  // Otra vez al final: entre el aviso del principio y aqui pasan cientos de
  // lineas de progreso de Remotion, y un aviso que queda arriba no lo lee nadie.
  avisarFaltantes(' (repetido: se dijo antes de renderizar)');
}
