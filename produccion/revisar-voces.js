// Busca VOCES COLADAS en los clips generados.
//
//   node produccion/revisar-voces.js temp/mi-anuncio
//   node produccion/revisar-voces.js temp/mi-anuncio --silenciar
//
// Los clips vienen con sonido ambiente y eso ESTA BIEN: pasos, pajaros, un
// reloj, el roce de una tela. Lo que se busca aqui es HABLA — una frase que
// nadie escribio, muchas veces en ingles, que el modelo mete por su cuenta.
//
// POR QUE HACE FALTA UN COMANDO Y NO BASTA CON "transcribelo":
// hasta el 2026-09-08 la lista de verificacion pedia descartar voces coladas
// pero no decia CON QUE. En la primera prueba del paquete para alumnos, la IA
// llego a ese punto, no encontro herramienta y reporto que no podia
// verificarlo. Tenia razon: la funcion de transcribir existia dentro de
// subtitulos-dialogo.js pero no habia forma de llamarla desde fuera.
//
// Mirar los niveles NO sirve: en el anuncio donde aparecio, el clip con voz
// media -25.2 dB y otros cuatro sin ninguna voz median mas alto.
//
// Cuesta centavos: Scribe cobra ~US$0.22 la hora de audio, y un anuncio entero
// son un par de minutos de clips.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { cargarEnv } from './config.js';
import { transcribir } from './subtitulos-dialogo.js';
import { tieneContinuidad, cadenaDeClips } from './continuidad.js';

/**
 * Que clips hay que revisar, segun el modo de audio.
 *
 * En dialogo_nativo las tomas principales NO se tocan nunca: ahi la voz ES el
 * contenido, el personaje habla dentro del clip con lip-sync. Silenciar una
 * rompe el anuncio. Su B-roll si se revisa, como en todos los estilos.
 *
 * Con continuidad (si se pasa el manifiesto y trae el bloque) la lista sale
 * de la cadena: los pasos (paso-K.mp4), el propio de cada B y el cierre, en
 * ese orden, los que esten en disco. Los toma-K.mp4 de las A y los B-roll que
 * quedaron de antes no entran en el montaje: no se transcriben (`fuera`).
 * `faltan`: los de la cadena que todavia no estan.
 */
export function clipsARevisar(modoAudio, archivos, manifiesto = null) {
  if (tieneContinuidad(manifiesto)) {
    const cadena = cadenaDeClips(manifiesto).map((c) => c.archivo);
    const enCadena = new Set(cadena);
    const hay = new Set(archivos);
    return {
      revisar: cadena.filter((f) => hay.has(f)),
      saltadas: [],
      fuera: archivos.filter((f) => !enCadena.has(f)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      faltan: cadena.filter((f) => !hay.has(f)),
    };
  }
  const tomas = archivos.filter((f) => /^toma-\d+\.mp4$/.test(f));
  const brolls = archivos.filter((f) => /^broll-\d+\.mp4$/.test(f));
  const orden = (a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]);
  if (modoAudio === 'dialogo_nativo') return { revisar: brolls.sort(orden), saltadas: tomas.sort(orden) };
  return { revisar: [...tomas.sort(orden), ...brolls.sort(orden)], saltadas: [] };
}

/** Un clip "limpio" devuelve etiquetas de sonido entre corchetes, o nada. */
export function habla(palabras) {
  const texto = palabras.map((p) => p.texto ?? p.text ?? '').join(' ').trim();
  return texto.replace(/\[[^\]]*\]/g, '').trim();
}

// ---------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith('revisar-voces.js')) {
  const args = process.argv.slice(2);
  const carpetaArg = args.find((a) => !a.startsWith('--'));
  const silenciar = args.includes('--silenciar');

  if (!carpetaArg) {
    console.error('\n  Uso: node produccion/revisar-voces.js <carpeta-del-anuncio> [--silenciar]\n');
    process.exit(1);
  }

  const carpeta = path.resolve(carpetaArg);
  const dirVideo = path.join(carpeta, 'video');
  const rutaManifiesto = path.join(carpeta, 'manifiesto.json');

  if (!fs.existsSync(dirVideo)) {
    console.error(`\n  No hay carpeta video/ en ${carpetaArg}. Genera los clips primero.\n`);
    process.exit(1);
  }
  if (!fs.existsSync(rutaManifiesto)) {
    console.error(`\n  Falta ${rutaManifiesto}.\n`);
    process.exit(1);
  }

  cargarEnv();
  const manifiesto = JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8'));
  const modo = manifiesto.modo_audio;
  const archivos = fs.readdirSync(dirVideo).filter((f) => f.endsWith('.mp4'));
  const { revisar, saltadas, fuera, faltan } = clipsARevisar(modo, archivos, manifiesto);

  console.log(`\n=== Voces coladas — ${path.basename(carpeta)} ===\n`);
  console.log(`  modo_audio: ${modo}`);
  console.log(`  a revisar:  ${revisar.length} clips`);
  if (saltadas.length) {
    console.log(`  se saltan:  ${saltadas.length} tomas principales`);
    console.log('              (en dialogo_nativo la voz de la toma ES el contenido:');
    console.log('               el personaje habla con lip-sync y no se toca nunca)');
  }
  if (tieneContinuidad(manifiesto)) {
    // Continuidad: se revisa la cadena (pasos, propios de las B y cierre).
    console.log('              (continuidad: los clips de la cadena — pasos, propios de las tomas B y cierre)');
    if (fuera.length) {
      console.log(`  no entran:  ${fuera.length} clip(s) de antes de continuidad, fuera del montaje: no se transcriben`);
      console.log(`              (${fuera.length > 8 ? `${fuera.slice(0, 8).join(', ')} y ${fuera.length - 8} mas` : fuera.join(', ')})`);
    }
    if (faltan.length) console.log(`  faltan:     ${faltan.length} clip(s) de la cadena todavia sin generar`);
  }
  console.log('');

  const tmp = path.join(carpeta, '_voces-tmp');
  fs.mkdirSync(tmp, { recursive: true });
  const conVoz = [];

  try {
    for (const clip of revisar) {
      const mp3 = path.join(tmp, clip.replace('.mp4', '.mp3'));
      execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(dirVideo, clip), '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', '-y', mp3]);
      let palabras = [];
      try {
        palabras = await transcribir(mp3, 'spa');
      } catch (e) {
        console.log(`  ?    ${clip.padEnd(16)} no se pudo transcribir: ${e.message.slice(0, 50)}`);
        continue;
      }
      const frase = habla(palabras);
      if (frase) {
        conVoz.push(clip);
        console.log(`  VOZ  ${clip.padEnd(16)} "${frase.slice(0, 60)}"`);
      } else {
        console.log(`  ok   ${clip}`);
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(`\n  ${revisar.length} revisados. Con habla: ${conVoz.length}`);

  if (conVoz.length === 0) {
    console.log('  Ninguna voz colada. Nada que hacer.\n');
    process.exit(0);
  }

  console.log('\n  Estos clips traen una frase que nadie escribio y hay que silenciarlos.');
  console.log('  Silenciar deja la imagen intacta, no cuesta creditos y es determinista.');
  console.log('  Se pierde el ambiente de esa toma, y eso se REPORTA siempre.\n');

  const ruta = path.join(carpeta, 'silenciar.json');
  if (silenciar) {
    const previo = fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, 'utf8')).clips || [] : [];
    const juntos = [...new Set([...previo, ...conVoz])].sort();
    fs.writeFileSync(
      ruta,
      JSON.stringify({ generado: new Date().toISOString(), motivo: 'voz colada detectada con Scribe', clips: juntos }, null, 2) + '\n',
      'utf8'
    );
    console.log(`  Escrito ${ruta} con ${juntos.length} clip(s).`);
    console.log('  Vuelve a correr el plan y el ensamblado: se montan mudos.\n');
    console.log(`      npm run plan      -- ${carpetaArg}`);
    console.log(`      npm run ensamblar -- ${carpetaArg}\n`);
  } else {
    console.log('  Para silenciarlos:');
    console.log(`      npm run voces:revisar -- ${carpetaArg} --silenciar\n`);
  }
}
