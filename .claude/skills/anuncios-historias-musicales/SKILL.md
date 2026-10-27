---
name: anuncios-historias-musicales
description: Genera anuncios largos (4 a 10+ minutos) estilo "historia musical" para marcas DTC/Ecommerce en Estados Unidos y Latinoamérica — una historia en primera persona cantada con Suno de principio a fin sobre animación 3D estilo Pixar, con estructura de carta de ventas (gancho con loop, declive, mensajero, mecanismo, producto, semana a semana, revancha, moraleja, CTA). Escribe el guion, la letra y dos prompts de estilo, genera la canción de verdad y con los tiempos reales arma personajes, tomas, prompts y el manifiesto interno; en el chat da un resumen corto y tres opciones (producirlo todo, solo imágenes y videos, o el paquete de prompts). Usar SIEMPRE que el usuario pida un anuncio estilo "historia musical", "historias musicales", "anuncio largo cantado", "VSL cantado", "VSL animado", "historia cantada", o mencione crear anuncios con IA sin especificar estilo (ofrecerlo como opción). No es el estilo "musical" corto (jingle de 1-2 minutos con coro), que es anuncios-musicales.
---

# Generador de Anuncios IA — Historias musicales

Convierte un producto en un anuncio largo cantado: una **historia en primera persona** (4 a 10+ minutos) que Suno canta entera sobre escenas 3D estilo Pixar, una toma por línea. Esta skill hace **todo el proceso** — guion, letra, canción, personajes, tomas, prompts y manifiesto — y después el pipeline de siempre produce el MP4. No delega lo creativo en ninguna otra skill (las imágenes y los videos se generan en Google Flow con la skill `flow-generacion`, Paso 9). Interactúa siempre en español con el usuario, sin importar el idioma del anuncio.

## Cómo reconocer este estilo

- **Es una carta de ventas disfrazada de historia**: alguien cuenta lo que le pasó (traición, humillación, deuda, un hijo que la vio llorar), cómo tocó fondo, quién le trajo la solución, qué descubrió del problema, qué pasó semana a semana, y cómo le fue con la persona que lo humilló. El producto entra tarde, ya con la confianza ganada.
- **Se canta de principio a fin.** No hay narrador ni voz en off: la canción es el audio. La voz canta con melodía, sube y baja, y la música acompaña la historia (íntima en el dolor, batería en la transformación).
- **Visual Pixar 3D en todo**: personajes, ambientes domésticos reales, el producto, el mecanismo interno. Nunca fotorrealismo, nunca grid azul ni estudio limpio.
- **Largo**: 4 minutos mínimo. Los originales van de 3:45 a 13:38. Un anuncio de 5 minutos son 60 a 80 tomas.
- **Diferencia con anuncios-musicales**: aquel es un jingle corto con verso y coro que se delega a otra skill visual; este es una historia larga en prosa, sin coro, y lo visual se hace aquí.
- **Diferencia con anuncios-zack-d-films**: comparte el Pixar y la toma por línea, pero aquí no hay narrador que explique un dato: hay una persona contando su vida, y no hay grid ni estudio para el mecanismo.

---

## Reglas obligatorias — léelas antes de generar cualquier cosa

1. **La voz CANTA.** En el prompt de estilo para Suno **nunca** escribas `spoken word`, `speech-level singing`, `narration`, `recitation`, `talking`, `monologue` ni nada parecido. Medido con dinero el 2026-09-14: tres canciones seguidas salieron *contadas* en vez de cantadas, y el único cambio que lo arregló fue pedir `fully sung expressive lead vocal with melodic rises and falls`. Si el usuario quiere partes habladas, no se piden: Suno las mete solo donde le nace.
2. **El arco musical se pide describiendo la subida, sin negativos.** "Without drums" apagó la batería en toda la canción, incluida la transformación. Lo que funciona: `soft piano verses building to a powerful chorus with full drums and bass` — la subida entera en una frase, más las etiquetas por acto en la letra.
3. **Nunca mandes `duration` a Suno.** Trunca por el final y se lleva el CTA. La duración la decide la letra: **minutos ≈ palabras ÷ 125**.
4. **La letra va con sus tildes y su ñ de verdad.** En ASCII, `quedo` no es `quedó` y se canta mal.
5. **Cada línea de la letra es una toma**, de 6 a 14 palabras. Más de 14 se pasa de los 10 segundos que aguanta un clip; menos de 6 da ventanas de 1-2 s que el clip mínimo de 4 s no aprovecha. Medido: 16 palabras = 6,7 s; 18 palabras = 12,6 s.
6. **No se copia ninguna canción ni ningún guion de referencia.** Lo que se replica es la lógica (estructura, arco, voz cantada, dinámica); los nombres, escenas, números y detalles salen del briefing y del producto. Suno varía por diseño y eso está bien.
7. **Sin B-roll.** Cada línea tiene su toma; si una línea necesita dos imágenes, son dos tomas. `"broll": []` siempre.
8. **Sin grid azul ni estudio limpio, nunca.** El mecanismo se muestra como escena Pixar (cuerpo translúcido, tejido, ingredientes, el objeto por dentro) integrada en el mundo del anuncio.
9. **Start/End Frame (Tipo B) solo en tomas de cambio de estado**: el mecanismo antes → después, la persona en el espejo hinchada → con mandíbula, el cable pelado → conectado. Todo lo demás es Tipo A.
10. **Nunca gastes nada sin mostrar el costo y esperar un sí.** En esta versión kie.ai solo cobra la canción (Paso 4). Las imágenes se generan en Google Flow a 0 créditos; los videos se pagan con créditos de Flow, y antes de mandarlos se le dice al usuario cuántos clips son y la estimación de créditos que imprime `npm run videos`. Un anuncio de 5 minutos son 60 a 80 clips: es el estilo que más créditos gasta y hay que decirlo antes.
11. **Los prompts de imagen y video van en inglés, con `Vertical 9:16` en palabras y el negativo universal al final de cada imagen.** Los que se le muestran al usuario (opción C o si los pide) se copian del manifiesto carácter por carácter.
12. **Nunca pongas texto, subtítulos ni cifras dentro de los prompts.** Los subtítulos los pone el pipeline; los stickers ("2x1 + envío gratis") se listan en el paquete como *datos para el editor* y **nunca van al manifiesto** (6.4). La única excepción es el texto de la etiqueta del producto, que es parte del envase y se dicta literal en su hoja (5.3).
13. **Sin efectos de transición y con los clips MUDOS.** Decisión de diseño para este estilo (2026-09-14): el único audio es la canción. No se escribe `transiciones.json`, no se copian efectos, y el manifiesto lleva `"clips_mudos": true` para que el montaje apague el ambiente de todos los clips. Los otros estilos no cambian.

### Las pausas del flujo

| Pausa | Qué se decide |
|---|---|
| Paso 1 | briefing completo, en una sola tanda |
| Paso 4.2 | **cuál de las versiones de la canción se queda** — de oído, nunca la eliges tú |
| Pipeline | los créditos de Flow, antes de mandar los videos (las imágenes, 0 créditos, no esperan) |
| Paso final | cómo quiere producirlo (A, B o C) |

La entrega del guion y la letra (Pasos 2 y 3) **no es una pausa**: se entrega y se sigue con la canción. Si el usuario quiere cambiar algo del guion, lo dice y se corrige antes de generar.

---

## Paso 1 — Briefing

Pregunta en un solo mensaje, como texto abierto, solo lo que no sea inferible de lo que el usuario ya dio. Sin esto se inventa, y lo inventado no vende:

1. **Producto**: nombre, qué es, y la **foto del envase** (obligatoria si el producto se ve; se prepara con `npm run preparar`).
2. **Dolor principal y mecanismo**: qué le pasa a la persona por dentro y por qué lo que probó antes no funcionó (ej. "no es grasa, es desecho atrapado: el sistema linfático se frenó"; "no era el mecánico, eran los empalmes con cinta"). Es lo que se ilustra en las tomas de mecanismo y lo que sostiene la promesa.
3. **Quién cuenta la historia**: género, edad, situación (esposa de 49 con 22 años de casada; mecánico de 52 con el taller endeudado; mamá soltera de 32). Y si el usuario lo tiene, el **detonante / villano**: ex, suegra, mejor amiga, cliente, jefe. Si no lo tiene, la skill propone uno acorde al producto.
4. **Mercado e idioma de la letra**: EE.UU. (inglés), LatAm (español — ¿qué país? ¿pago contra entrega?), Brasil (portugués).
5. **Oferta y cierre**: descuento, garantía, escasez, y **tipo de cierre**: CTA cantado dentro de la canción (lo normal) o solo tarjeta final con el logo (sin CTA cantado). Si el usuario pide que no haya precio, se respeta.
6. **Duración objetivo**, aproximada: 4, 5, 6, 8, 10 minutos. Palabras ≈ minutos × 125. Es una orientación: el anuncio dura lo que dure la canción.
7. **Género musical**: que lo diga, o "ayúdame a elegir" → sugiere 2 según el avatar (tabla del Paso 3.2).
8. **Voz**: ¿la canta un hombre o una mujer? Por defecto, el género de quien cuenta la historia — pero se pregunta.

Formato: 9:16 vertical siempre (es para Meta/TikTok). No se pregunta.

---

## Paso 2 — El guion

### 2.1 — Los cinco actos y sus beats

El guion se escribe en **cinco actos**, que son también las cinco fases de la música. Dentro de cada acto, estos beats, en este orden. Un anuncio de 5 minutos los lleva todos; uno de 4 comprime el contexto y la línea de tiempo; uno de 8-10 los expande con más escenas y más semanas, nunca con relleno.

**Acto 1 — Dolor** *(música íntima: voz y piano, sin batería)*
1. **Gancho de choque en primera persona, con números concretos.** Edades, años, cuántas personas había en la mesa, cuántos meses de alquiler. "Tenía 9 años cuando descubrí a mi madre engañando a mi padre." "Mi suegra me llamó gorda frente a catorce personas." "Debía 4 meses del alquiler del taller."
2. **Loop del producto sin nombrarlo.** Una frase que promete que algo cambió todo y no dice qué: "Lo que puse en la encimera de su cocina cambió nuestras dos vidas." "La única razón por la que mantuve la cabeza en alto fue lo que mi estilista me dio la semana antes."
3. **Puente**: "Déjame contarte lo que pasó." (o equivalente natural en el idioma).
4. **Vida antes y lo que dio a los demás**: "Le di a ese hombre mis veintes." "Veinte años siendo el hombre en el que todos se apoyaban." "Cuidé los carros de todos, menos mi propio negocio."
5. **Declive por edades o por etapas**: "A los 47 dejó de jalarme hacia él. A los 48… A los 49 se volvió cordial." Lista física o material concreta: cara hinchada, sin mandíbula, canas; o los clientes que no volvían, los dedos quemados de soldar.
6. **Escena de humillación y espejo**: una escena real con detalles (la barbacoa donde contó cuántas veces él la tocó; el cliente que gritó delante de su hijo). Remata en el espejo o su equivalente: "Me miré y vi a una mujer que se rindió."
7. **Intentos fallidos + experto despectivo + llanto a solas**: "Lo intenté todo: dietas, gym a las 5, fajas, tés…" → "Mi doctora me dedicó dos minutos: 'Es solo la menopausia. Come menos, camina más.'" → "Salí y lloré en mi auto." Con producto no corporal: "bajé mis precios, me endeudé en herramientas, un colega me dijo 'así es el negocio ahora' y casi le creo."

**Acto 2 — Quiebre** *(la música se cae; voz casi sola; entra un pulso)*
8. **El mensajero**: alguien cercano que ya se ve o le va increíble y trae la solución — la amiga que volvió de viaje, el hermano, la compañera de 58 que parece de 42, el estilista, un cliente apurado. Diálogo directo: "Hermano, tenemos trabajo que hacer. No te vas a quedar así."
9. **Reencuadre del problema (el mecanismo, en palabras del mensajero)**: "No tienes peso de menopausia, tienes desechos atrapados. Cuando baja el estrógeno el sistema linfático se apaga. Eso no es grasa, es desecho: no se quema, se drena." Con una imagen simple (río que se vuelve pantano). Aquí se dice por qué todo lo anterior no podía funcionar.

**Acto 3 — Solución** *(guitarra acústica, percusión ligera)*
10. **El producto, en la mano del mensajero**, con el nombre por primera vez, y **sus partes con un verbo cada una**: "cuatro hierbas: la stillingia rompe…, el fresno espinoso reinicia…, el amor de hortelano barre…, el trébol rojo calma…"; "unos conectores con palanquita: pelar, meter el cable, bajar la palanca, ¡clic!". Cómo se usa, en una frase.
11. **Objeción y promesa con calendario**: "No puede ser, unas gotas no van a arreglar dos años de esto." → "Seis semanas. En la semana dos… en la tres… en la seis no te vas a reconocer. Ya vas a ver."

**Acto 4 — Transformación** *(batería completa, la parte más alta de la canción)*
12. **Línea de tiempo**: semana 1 → 6 (o día 1 → 30, o "a la semana… al mes…"), cada etapa con **un detalle físico concreto y una reacción de un tercero**: "Semana uno: al baño cada hora, el anillo suelto. Semana dos: el cinturón un hoyo más apretado; mi hermana me dijo 'suenas diferente'. Semana tres: la mandíbula volvió; él me tocó la espalda al pasar, no lo hacía en dos años…" En la corta, 3-4 etapas; en la larga, 6.
13. **Escena de revancha**: el villano la ve — "Te ves increíble, ¿qué te hiciste?" — y ella no responde, pasa de largo. Y la clave emocional: "No por él: por mí."
14. **Contagio social**: una desconocida en el baño que ordena ahí mismo; la cuñada, las mamás del fútbol, el hijo que la prueba; "Tu turno." (Prueba social sin decir "miles de clientes".)

**Acto 5 — Cierre** *(firme y seguro; baja para el CTA)*
15. **Moraleja**: "Aquí está la cosa: yo pensé que… No fue eso. … No la yo de los 30: la mujer que se suponía que iba a ser a los 49. Aguda, despierta, viva."
16. **Llamado al espectador**: "Mira, no sé por dónde andas tú ahorita. Tal vez…, tal vez…, tal vez tú eres la que se esconde en el vestido más grande."
17. **Anti-alternativa + CTA**: "No dejes que te vendan Ozempic ni hormonas cuando tu cuerpo solo necesita drenar." → marca, sus partes, escasez ("son lotes pequeños, chequeé ayer y casi no quedaban; si todavía ves el botón naranja aquí abajo…"), oferta ("compra 3 lleva 2", "40% hoy"), garantía ("60 días, pero en seis semanas no la vas a necesitar"), y **una frase de remate** que cierre el loop del gancho: "Eso fue todo lo que le tomó a ella." "Pero ya no es para él: es para mí." "Deja de permitir que ella señale cómo te marchitas." Si el usuario eligió tarjeta final, el acto 5 termina en la moraleja + llamado, y el CTA va en overlay.

### 2.2 — Reglas de escritura

- **Primera persona, prosa hablada, sin rimas ni coro.** Suena a alguien contando, no a poesía. Suno le pone la melodía.
- **Concreto siempre**: nombres de pila para el villano y el mensajero, edades, años, kilos o libras, días, lugares (la cocina, el baño de visitas, el patio, el taller). Lo abstracto no se ve y no se canta.
- **El producto no aparece ni se nombra antes del beat 10.** Antes solo existe el loop del beat 2.
- **La marca solo se dice dos veces**: en el beat 10 y en el CTA.
- **Un beat = varias líneas de 6-14 palabras**; cada línea es una toma y tiene que poder verse (una acción, un lugar, un objeto, una cara). "Y entendí que todo había cambiado" no se ve; "Me miré en el espejo del baño por primera vez en años" sí.
- **Verbos de acción y sensación física**, no evaluaciones: "el anillo me quedó suelto", no "empecé a mejorar".
- **Producto sin antes/después corporal** (herramienta, curso, software, gadget): la línea de tiempo son *usos* ("la primera vez que…, a la semana…, al mes la cola estaba en mi puerta") y el mecanismo es *cómo funciona por dentro* el objeto o el método. El resto de beats no cambia.
- **Versión corta (< 6 min)**: beats 4-5 en dos o tres líneas, línea de tiempo de 3-4 etapas, una sola escena de revancha, contagio en una línea.
- **Localización**: EE.UU. en inglés con "Shop Now / the orange button below", libras y millas; LatAm en español neutro salvo país (y pago contra entrega si aplica), kilos; Brasil en portugués con Pix/parcelamento si aplica.
- **Presupuesto**: palabras ≈ minutos × 125. Es orientación; **nunca agregues ni quites líneas para cuadrar un número**.

### 2.3 — Entrega del guion

Una tabla con todas las líneas numeradas — ese número será el de la toma — con su acto y su beat:

| # | Acto | Beat | Línea (6-14 palabras) | Qué se ve |
|---|---|---|---|---|

"Qué se ve" es una frase para el director de arte (lugar, quién, qué hace); los prompts se escriben en el Paso 6, ya con los tiempos.

Antes de entregar, verifica en silencio: ¿la línea 1 es un gancho con números y la 2 o 3 es el loop sin nombrar el producto? ¿El producto aparece recién en el acto 3? ¿Cada etapa de la línea de tiempo tiene detalle físico y reacción de otro? ¿Hay revancha y remate que cierra el loop? ¿Ninguna línea pasa de 14 palabras?

---

## Paso 3 — La letra y el estilo para Suno

### 3.1 — La letra: el guion con etiquetas por acto

La letra es **el guion tal cual, línea por línea**, con una etiqueta al inicio de cada acto. Las etiquetas le dicen a Suno la intensidad; no se cantan (verificado en diez canciones). Usa exactamente estas cinco, en este orden:

```
[Verse 1 - soft, intimate]
[Verse 2 - tension, building]
[Pre-Chorus - rising, drums enter]
[Chorus - powerful, full band, soaring]
[Outro - warm, confident]
```

- Acto 1 → `[Verse 1 …]`, Acto 2 → `[Verse 2 …]`, Acto 3 → `[Pre-Chorus …]`, Acto 4 → `[Chorus …]`, Acto 5 → `[Outro …]`. **`[Chorus]` no significa que se repita nada**: es la marca de mayor energía, que es la transformación.
- Una línea del guion = una línea de la letra. Sin líneas en blanco dentro de un acto; una línea en blanco antes de cada etiqueta.
- En el idioma del mercado, con tildes reales.

### 3.2 — Los dos prompts de estilo (en inglés, siempre)

Se escriben **dos** prompts de estilo distintos para el mismo avatar, y se generan los dos: Suno da dos versiones de cada uno, el usuario escucha cuatro y elige. Los dos comparten la lógica que funcionó y cambian el género:

**Lo que todo prompt de estilo lleva (la lógica validada, no una plantilla fija):**
- Voz **cantada y expresiva**: `fully sung expressive [female/male] lead vocal with melodic rises and falls`.
- Que es una historia: `storytelling lyrics` / `narrative ballad`.
- **El arco en una frase**, de menos a más: `soft [instrumento] verses building to a powerful chorus with full drums and bass` (o el equivalente del género).
- Dinámica y emoción: `dynamic`, `emotional`, `cinematic` o `heartfelt`.
- Tempo: `mid tempo` (los originales van de 75 a 100 BPM). Nunca `fast`, nunca `rap`.
- Nada de `spoken word`, `speech-level`, `narration`, `no drums`, `no chorus`.
- Máximo ~40 palabras.

**Los dos que mejor sonaron (2026-09-14, voz femenina) — adáptalos al género y al avatar, no los pegues sin pensar:**

```
emotional pop ballad, fully sung expressive female lead vocal with melodic rises and falls, storytelling lyrics, soft piano verses building to a powerful chorus with full drums and bass, dynamic, cinematic, mid tempo
```

```
latin pop storytelling ballad, sung female vocals, melodic and emotional, acoustic guitar and piano verses, big uplifting chorus with driving drums, dynamic build, warm and heartfelt
```

**Género según el avatar** (si el usuario dice "ayúdame a elegir"; si él nombra uno, se usa el suyo):

| Quién cuenta la historia | Géneros que le calzan |
|---|---|
| Mujer 40-60, hogar, matrimonio | balada pop emotiva, pop acústico, country-pop suave |
| Mujer 25-40, mamá joven | pop contemporáneo acústico, R&B-pop suave, pop latino |
| Hombre 40-60, proveedor, oficio | country-folk, folk rock acústico, balada rock suave |
| Hombre 25-40 | pop rock acústico, indie folk, urbano suave |
| Mercado LatAm (cualquiera) | balada pop latina, pop acústico latino, bachata-pop suave |
| Oficio / taller / campo | country-blues, folk rock con guitarra de acero |
| Salud / bienestar mayores 55 | balada clásica con cuerdas, chamber pop |

Prompt de estilo 1 = el género principal del avatar; prompt 2 = el segundo de la fila, o el latino si el mercado es LatAm.

### 3.3 — Bloques: cómo se genera una canción larga

Suno canta bien hasta **~3.500 caracteres por generación** (verificado: 3.300 caracteres = 4:00-4:50 de canción, entera). Más largo, apura o se salta partes. Por eso:

- Letra ≤ 3.500 caracteres → un solo bloque.
- Letra más larga → se **parte en bloques de ≤ 3.500 caracteres, cortando siempre al final de un acto** (nunca a mitad de una escena). Si un acto solo ya pasa de 3.500, se corta entre dos beats. El primer bloque se genera con los dos estilos; los siguientes se agregan con **extend** solo sobre la versión que el usuario elija (el motor lo hace solo, 12 créditos de kie.ai por bloque, y se queda con la versión de cada extend que mejor canta la letra, medido con Scribe). Verificado: el extend devuelve la canción completa y unida, y empalma justo después de la última palabra.
- Guía: 5 min ≈ 3.300 car. (1 bloque) · 6-7 min ≈ 2 bloques · 8-10 min ≈ 3 bloques · 13 min ≈ 4 bloques.

### 3.4 — Entrega y `peticion.json`

Entrega, en bloques de código separados: (1) la letra completa con etiquetas, (2) el prompt de estilo 1, (3) el prompt de estilo 2. Y escribe `temp/[slug]/cancion/peticion.json`:

```json
{
  "letra": "[la letra completa, con etiquetas, con tildes]",
  "bloques": ["[bloque 1]", "[bloque 2]"],
  "estilos": ["[prompt de estilo 1]", "[prompt de estilo 2]"],
  "titulo": "[título corto de la canción]",
  "duracion": null,
  "vocalGender": "f",
  "modelo": "V5_5",
  "idioma": "spa"
}
```

- `bloques` solo si hay más de uno (su unión tiene que ser exactamente la letra). Con un bloque, omite el campo.
- `vocalGender`: `"f"` o `"m"`, lo que respondió el usuario.
- `modelo`: `V5_5` por defecto (validado). `V6` también funcionó; si el usuario lo pide, va.
- `idioma`: `spa`, `eng` o `por` — el de la letra, para que Scribe la mida bien.
- **Antes de seguir, verifica que el JSON conserva las tildes** (lee el archivo y busca una palabra con tilde de la letra).

---

## Paso 4 — Generar la canción

### 4.1 — Generar

```
npm run cancion -- temp/[slug]
```

Muestra el costo en kie.ai (12 créditos por estilo = US$0,12 con dos) y pide confirmación. kie.ai es obligatorio en este estilo (la canción es el anuncio): si no está conectado, `npm run cancion` lo explica, dice cómo conectarlo y no sigue. Deja `cancion/opcion-1..4.mp3`. Dile al usuario dónde están, la duración de cada una y qué estilo es cada par (1-2 = estilo 1, 3-4 = estilo 2).

### 4.2 — El usuario elige *(pausa)*

**Nunca elijas tú.** Que las escuche y diga cuál. Si ninguna le convence, se ajusta el prompt de estilo (no la letra) y se vuelve a generar: cuesta otros US$0,12, y se le dice.

```
npm run cancion -- temp/[slug] --elegir N
```

Si la letra iba en bloques, este comando **extiende solo** con los bloques que faltan y elige la mejor versión de cada extend por alineación. Al final deja `audio/cancion.mp3`, `audio/cancion.json` (los tiempos medidos con Scribe) y el **MAPA DE LA CANCIÓN**: la duración real y los huecos sin letra. Léelo. Esa duración es la del anuncio.

### 4.3 — Medir cada línea

Escribe `temp/[slug]/cancion/lineas.txt`: **una línea por toma**, el texto exacto de la letra sin etiquetas, en orden. Los huecos sin letra se cubren con **tomas de ~3 s, no con una toma larga** (decisión de diseño, 2026-09-14: la cabeza y la cola tienen que ser dinámicas, no un plano de 8 s):

- Intro antes de la primera palabra (> 1,5 s): `[intro]` repetido **redondeo(hueco ÷ 3)** veces al principio (mínimo 1). 8,5 s → tres `[intro]`; 4 s → uno.
- Cola después de la última palabra (> 1,5 s): `[cierre]` repetido redondeo(hueco ÷ 3) veces al final. 14 s → cinco `[cierre]`.
- Hueco de más de 3 s entre dos líneas: `[instrumental]`, también repetido si el hueco pasa de 4,5 s.
- Los huecos de menos de 3 s entre líneas no llevan toma: se los lleva la toma anterior.

Las marcas repetidas se reparten el hueco en partes iguales (lo hace `--lineas` solo). Sus clips se generan a 4 s (el mínimo de Gemini) y el montaje los acelera hasta 1,6× y corta la cola si aún sobra; con ventanas de 2,5-3,3 s eso queda entre 1,2× y 1,6× y se ve fluido.

```
npm run tiempos -- temp/[slug] --lineas
```

Imprime inicio, fin y **ventana** de cada línea (hasta el inicio de la siguiente) y avisa las que pasan de 10 s. Una línea que pase de 10 s se **parte en dos líneas** en `lineas.txt` (mismas palabras, cortadas donde haya una pausa natural) y se vuelve a correr. Con esa tabla se escribe el manifiesto: **la `duracion` de cada toma es su ventana**, con un decimal.

---

## Paso 5 — Personajes (Character Bible)

Los personajes se generan **una vez** como hoja de referencia y se adjuntan en cada toma donde aparecen. Sin esto, en 70 tomas la protagonista cambia de cara diez veces.

### 5.1 — Quiénes van

| id | Cuándo existe |
|---|---|
| `protagonista_antes` | siempre: la persona en su estado inicial (hinchada, cansada, ropa holgada; o agotado, manos gastadas) |
| `protagonista_despues` | siempre que haya transformación visible: la misma persona, misma cara, mismo pelo base, pero con el cambio (mandíbula, piel luminosa, ropa entallada, postura). **Se genera con la hoja de `protagonista_antes` como referencia** para que sea la misma persona |
| `villano` | si hay (ex, suegra, la amiga, el cliente): aparece en 3-8 tomas |
| `mensajero` | siempre: quien trae la solución |
| `producto` | si el usuario dio foto: hoja Pixar generada desde la foto (5.3) |
| otros | pareja, hijos, la desconocida del baño, si se repiten en más de una toma |

**Cuál referencia lleva cada toma**: `protagonista_antes` en los actos 1-3 y en las primeras etapas de la línea de tiempo (semana 1-2); `protagonista_despues` desde la mitad de la línea de tiempo (semana 3 en adelante), la revancha, el contagio y el cierre. El cambio de una a otra es la toma donde el guion dice que "volvió la mandíbula" o su equivalente — y esa toma suele ser Tipo B con las dos hojas.

### 5.2 — Prompt de hoja de personaje

Uno por personaje, en inglés, 6-10 oraciones, sin marco. Para `protagonista_despues` agrega al final: `Same person as the reference image: identical face structure, eyes, nose, hair color and skin tone; only the change described here.`

```
Vertical 9:16. Pixar-Disney style 3D animated character reference: [nombre], a [edad]-year-old [mujer/hombre] from [país], [3-4 rasgos de cara fijos: forma de cara, ojos, nariz, boca], [pelo: color, largo, peinado], [piel], [cuerpo y postura en este estado: hombros caídos, cara hinchada sin mandíbula, vientre marcado bajo la ropa / o el estado después], wearing [ropa concreta y su color, que se repite en todo el anuncio salvo que el guion la cambie]. Standing in a relaxed neutral pose, three-quarter view, full body visible from head to feet, soft warm cinematic lighting, expressive Pixar face with subsurface scattering, plain warm-toned soft wall background with subtle texture in the same render style. The image is full-bleed and fills the entire frame edge to edge: no picture frame, no wooden frame, no diorama box, no border, no inset panel, no vignette. No text, captions or watermarks.

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

> El fondo NO se pide blanco vacío: está medido que un fondo neutro sin relación al mundo hace que el modelo invente un ambiente distinto en cada toma. Se pide liso y cálido con la textura del estilo. Lo que se prohíbe es el marco.

### 5.3 — El producto en Pixar

El envase real se convierte en una hoja Pixar fiel a la etiqueta, generada **desde la foto del usuario**. **Antes de escribir el prompt, lee la etiqueta en la foto y dicta su texto literal, línea por línea y entre comillas, dentro del prompt.** Medido el 2026-09-14 con Goli: con la foto adjunta y el prompt genérico ("same label design, colors and text") el modelo reescribió la etiqueta ("B-Vitamins", "30" en vez de "Elderberry Extract", "60") y cambió el color de las gomitas; con el texto dictado la copió exacta al primer intento. Adjuntar la foto fija la forma, los colores y el logo grande; el texto chico solo sale bien si está escrito en el prompt. Esa hoja se adjunta después a todas las tomas con envase, así que un error aquí se repite en cada una:

```json
{ "id": "producto", "tipo": "producto", "archivo": "producto.jpg", "generar_desde_archivo": true,
  "prompt": "Vertical 9:16. Pixar-Disney style 3D render of the exact product in the reference photo: [forma y material del envase, color de la tapa, color del contenido si se ve, color y disposición de la etiqueta]. Same shape, same proportions, same label design, colors and text as the photo. The label text must be copied exactly, letter for letter, from the photo, with no words changed, added or removed: [el texto de la etiqueta, de arriba abajo, cada línea entre comillas — ejemplo de Goli: the large white \"goli\" logo with \"NUTRITION\" under it, then \"TRIPLE ACTION\", the large word \"IMMUNE\", then \"GUMMIES\", then \"Vitamin C, D & Zinc\" and \"Elderberry Extract\" on two lines, the number \"60\" with \"GUMMIES\" under it, and \"DIETARY SUPPLEMENT\" at the bottom; on the white strip the four icons read \"Gluten-Free\", \"Non-GMO\", \"Gelatin-Free\" and \"Vegan\"]. Rendered as a clean stylized 3D object resting naturally on a warm wooden kitchen surface with a soft contact shadow, soft warm cinematic lighting, shallow depth of field. The label text must be as sharp and legible as in the photo. The image is full-bleed and fills the entire frame edge to edge: no frame, no border, no vignette. No additional text, captions or watermarks.\n\nNegative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, product photography lighting, altered label text, misspelled words, invented ingredients, [color equivocado del contenido, p. ej. black gummies]" }
```

"No additional text" nunca significa borrar el texto de la etiqueta: es parte del producto y se dicta literal; lo que se prohíbe son textos ajenos (subtítulos, marcas de agua, leyendas). Lo que va entre corchetes se rellena con lo que se lee en la foto. Si el usuario no dio foto, la entrada `producto` no existe y ninguna toma la declara.

---

## Paso 6 — Tomas y prompts

### 6.1 — De la tabla de tiempos a las tomas

- Una toma por línea de `lineas.txt`, numeradas igual. `duracion` = la ventana medida (un decimal). Ninguna pasa de 10 s.
- Tomas instrumentales (`[intro]`, `[cierre]`, `[instrumental]`): llevan imagen y video como cualquier otra; su línea es la marca. Como son varias de ~3 s (4.3), cada una es un plano distinto: la intro presenta el mundo en tres planos (la calle de la casa al amanecer → la ventana encendida → el pasillo hacia el cuarto), la cola cierra en cuatro o cinco (la familia, la cocina, el frasco de cerca, el frasco solo al atardecer). Nunca la misma imagen dos veces.
- **Tipo B** solo en cambio de estado (regla 9): el mecanismo (cuerpo translúcido con los vasos atascados de lodo → drenando y brillando; el conector abierto → cerrado con el clic), el espejo (cara hinchada → mandíbula), el frasco cerrado → abierto con la gota cayendo. Entre el START y el END: mismo encuadre, misma luz, mismo fondo, solo cambia el estado. Todo lo demás **Tipo A**.
- **Cámara quieta o un solo movimiento suave** por toma. Las tomas duran 3-8 s; no caben dos acciones.
- **Referencias por toma**: si aparece el protagonista (o una parte: su mano, su espalda, sus pies) → su id según el acto; si aparece el villano o el mensajero → su id; si se ve el envase → `producto`. Si no aparece nadie ni el producto → `[]`. Un B-roll o toma con la mano del personaje sin referencia sale con otra persona: está medido.
- **Mecanismo integrado en el mundo**: el cuerpo translúcido aparece *sobre la persona en su cocina* o como visión en el aire junto a ella, con luz cálida; nunca sobre un fondo de estudio ni un grid. Los ingredientes se ven como plantas y frascos en una mesa, en un mortero, en un campo — no como diagramas.
- **Escenas con dos personas interactuando** traen voces coladas en los clips (medido: 5 en un anuncio de Zack). Aquí no importa: los clips van mudos (regla 13). No se evita la interacción: la historia la necesita.
- **Lo que no se pide** porque el modelo lo hace mal: ciclos de caminata en primer plano (pies deformes), manos manipulando cosas pequeñas con precisión, texto dentro de props (calendarios, pantallas con letras), dos objetos iguales intercambiándose de mano.

### 6.2 — Prompt de imagen (Tipo A y START de Tipo B)

Cada uno con su etiqueta `**Imagen:**` fuera del bloque. 5-7 oraciones: quién (por su id, describiendo lo que hace, no repitiendo la hoja), dónde (ambiente concreto y reconocible), qué hace, expresión, luz, encuadre y distancia de cámara.

```
Vertical 9:16. Pixar-Disney style 3D animation render. [Quién y qué hace, con la emoción de la línea]. [Ambiente concreto: la cocina de una casa de barrio con luz de tarde entrando por la ventana, platos en el escurridor]. [Encuadre: medium close-up / wide shot, cámara a la altura de los ojos]. Warm cinematic lighting, expressive Pixar face with subsurface scattering, realistic-stylized environment, shallow depth of field, vibrant warm color palette. No text, captions or watermarks overlaid on the image.

Negative prompt: photorealistic, photograph, real photography, DSLR, stock photo, live action, real human skin, skin pores, skin wrinkles, realistic hair strands, product photography lighting
```

Para el **END FRAME** de una Tipo B: la misma escena palabra por palabra, cambiando solo la descripción del estado final, con el mismo negativo al final del bloque. START y END en dos bloques separados con `**START FRAME:**` y `**END FRAME:**` fuera del bloque.

### 6.3 — Prompt de video

```
Pixar-Disney style 3D animation, image-to-video from the shot above, [DURACIÓN]s. Vertical 9:16.
Camera: [un solo movimiento suave, o "static"]
Motion: [una sola acción propia de esa toma, con la emoción de la línea]
Lighting: warm cinematic glow
```

En Tipo B, `Motion` describe la transición entre los dos estados ("the golden sludge in the vessels loosens and drains away as the channels light up").

### 6.4 — Datos para el editor (textos en pantalla)

Texto en pantalla que quien monte a mano en CapCut puede agregar, nunca dentro de los prompts: el sticker fijo de la oferta ("2x1 + envío gratis", desde la toma 1), los marcadores de tiempo ("Semana 3") en la primera toma de cada etapa, y la tarjeta final de marca si el cierre es sin CTA cantado. Son **solo información del paquete** (punto 8 del Paso 7): una tabla texto / toma / momento que se guarda en `temp/[slug]/datos-editor.md`, junto al manifiesto, y de ahí se copia cada vez que se muestra: si elige C, si la pide, y al entregar A o B (Paso final), porque ninguno de esos textos sale en el video. **Nunca van al manifiesto**: el motor no dibuja textos y el manifiesto lleva siempre `"overlays": []` (decisión de diseño, 2026-09-14). Los subtítulos de la letra los pone el pipeline solo.

---

## Paso 7 — Formato de entrega

**Regla no negociable**: la primera entrega va completa en su momento. El paquete de la segunda se arma completo y con todos sus chequeos, pero **no se muestra al terminar**: queda en el manifiesto (los datos para el editor, en `datos-editor.md`: 6.4), y en el chat va solo el resumen y las opciones del Paso final. Cuando se entrega (opción C o si el usuario lo pide), va completo, nunca una muestra ni "¿quieres que siga?".

**Primera entrega (después del briefing, antes de generar la canción):**
1. **Ficha del anuncio**: producto, avatar, villano, mensajero, mecanismo en una frase, mercado, duración objetivo, género y voz, tipo de cierre.
2. **Guion por actos**: la tabla del Paso 2.3, completa.
3. **Letra para Suno** (bloque de código) + **los dos prompts de estilo** (dos bloques) + confirmación de que `cancion/peticion.json` quedó escrito con tildes.
4. El comando para generar y el costo.

**Segunda entrega — el paquete (después de `--elegir` y `--lineas`), interno hasta que elija C o lo pida:**
5. **Character Bible**: todas las hojas, cada una en su bloque con su etiqueta.
6. **Tabla de tomas**: `#`, acto, tipo (A/B), duración medida, línea, referencias, qué se ve.
7. **Prompts por toma**: `**Imagen:**` + `**Video:**` (o START/END + Video) en bloques separados.
8. **Datos para el editor**: la tabla de textos en pantalla de 6.4, guardada en `temp/[slug]/datos-editor.md`, con la aclaración de que son para montaje manual y no están en el MP4.
9. **Manifiesto de producción** (Paso 8), guardado en `temp/[slug]/manifiesto.json` y validado con `npm run validar`. Es interno del sistema: **nunca se muestra en el chat**, tampoco en la opción C.
10. Los comandos que siguen (Paso 9), con las imágenes y los videos en Google Flow: las imágenes cuestan 0 créditos; los créditos de los videos los imprime `npm run videos` al armar su cola, y se le dicen al usuario antes de mandarlos.

Entre la primera y la segunda entrega está la pausa de la canción.

---

## Paso 8 — Manifiesto de producción

El manifiesto es la fuente de verdad del paquete: las hojas y los prompts que se le muestren al usuario (opción C o si los pide) se copian de aquí carácter por carácter. Se guarda en `temp/[slug]/manifiesto.json` y es interno: nunca se muestra en el chat.

```json
{
  "estilo": "historias-musicales",
  "modo_audio": "musica",
  "mercado": "LatAm",
  "idioma": "es",
  "aspect_ratio": "9:16",
  "clips_mudos": true,
  "referencias": [
    { "id": "protagonista_antes", "tipo": "personaje", "prompt": "[hoja]" },
    { "id": "protagonista_despues", "tipo": "personaje", "prompt": "[hoja, generada con la de antes como referencia]", "referencias": ["protagonista_antes"] },
    { "id": "villano", "tipo": "personaje", "prompt": "[hoja]" },
    { "id": "mensajero", "tipo": "personaje", "prompt": "[hoja]" },
    { "id": "producto", "tipo": "producto", "archivo": "producto.jpg", "generar_desde_archivo": true, "prompt": "[hoja Pixar del envase]" }
  ],
  "tomas": [
    { "n": 1, "tipo": "A", "duracion": 2.8, "linea": "[intro]", "prompt_imagen_inicial": "[...]", "prompt_imagen_final": null, "prompt_video": "[...]", "referencias": [] },
    { "n": 2, "tipo": "A", "duracion": 6.7, "linea": "[la línea exacta de la letra]", "prompt_imagen_inicial": "[...]", "prompt_imagen_final": null, "prompt_video": "[...]", "referencias": ["protagonista_antes", "villano"] },
    { "n": 24, "tipo": "B", "duracion": 5.6, "linea": "[...]", "prompt_imagen_inicial": "[START FRAME]", "prompt_imagen_final": "[END FRAME con su negativo]", "prompt_video": "[...]", "referencias": ["protagonista_antes"] }
  ],
  "broll": [],
  "overlays": []
}
```

| Campo | De dónde sale |
|---|---|
| `estilo` | siempre `"historias-musicales"` |
| `modo_audio` | siempre `"musica"`; **sin** campo `voz_en_off` |
| `clips_mudos` | siempre `true`: el montaje apaga el ambiente de todos los clips (regla 13) |
| `idioma` | `es`, `en` o `pt` |
| `referencias` | la lista del Paso 5. La entrada `producto` solo si hay foto, siempre `producto.jpg` (lo deja `npm run preparar`) |
| `tomas[].duracion` | la ventana de `--lineas`, un decimal, nunca redondeada a entero |
| `tomas[].linea` | el texto exacto de `lineas.txt` (las instrumentales, su marca) |
| `tomas[].tipo` | `B` solo en cambios de estado, con `prompt_imagen_final`; el resto `A` con `null` |
| `tomas[].referencias` | ids de la lista; `[]` si no aparece nadie |
| `broll` | `[]` siempre |
| `overlays` | `[]` siempre: los textos en pantalla son datos para el editor (6.4), van en `datos-editor.md` y no son parte del montaje |

Justo después del manifiesto y antes de validarlo, si hay foto del producto y todavía no está en la carpeta, déjala lista tú, con la ruta real de la foto que dio el usuario o la de la imagen que pegó en el chat (la lees en su ruta local), tal cual, aunque sea `.webp` o `.heic` o tenga espacios. El comando la deja en la carpeta del anuncio y su nombre en el manifiesto (sin `producto.jpg`, `npm run validar` da error):

```
npm run preparar -- "<ruta de la foto>" [slug]
```

Si no sabes dónde está, en el resumen del Paso final pídesela en una línea (que la arrastre al chat o te diga la ruta), sin pegarle ningún comando, y córrelo tú apenas la tengas. Si el comando falla (no encuentra el archivo, o no puede convertir un `.heic`), no le pases ni el error ni el comando: pídele en una línea (en el resumen del Paso final, si todavía no le escribiste) la ruta correcta o la foto en JPG, y vuelve a correrlo tú. Ningún comando va en el mensaje del Paso final.

**Verificación antes del Paso final:** una toma por línea de `lineas.txt` y en el mismo orden; la unión de las `linea` cantadas es la letra sin etiquetas; ninguna `duracion` > 10; cada Tipo B tiene `prompt_imagen_final` y cada A tiene `null`; cada id declarado existe en `referencias`; cada toma con persona o envase declara su id; el JSON es válido (comillas dobles, sin comas colgando) y `npm run validar -- temp/[slug]/manifiesto.json` pasa (salvo el error de la foto, si no sabes dónde está); si hay textos en pantalla, `temp/[slug]/datos-editor.md` quedó escrito (6.4).

---

## Paso 9 — Producción

El orden, y las diferencias con los otros estilos:

```
npm run preparar  -- "<ruta de la foto>" [slug]     si hay envase
npm run cancion   -- temp/[slug]                     Paso 4.1  (ya hecho)
npm run cancion   -- temp/[slug] --elegir N          Paso 4.2  (ya hecho)
npm run tiempos   -- temp/[slug] --lineas            Paso 4.3  (ya hecho)
   ... aquí se escribe el manifiesto ...
npm run validar   -- temp/[slug]/manifiesto.json
npm run tiempos   -- temp/[slug]                     escribe audio/tiempos.json y avisa ventanas imposibles
npm run imagenes  -- temp/[slug]                     arma la cola: Flow + flow:recibir, en vueltas (abajo)
npm run videos    -- temp/[slug]                     arma la cola: ok de créditos, Flow + flow:recibir, en vueltas
npm run revisar   -- temp/[slug]
npm run plan      -- temp/[slug]
npm run subtitulos -- temp/[slug]
npm run plan      -- temp/[slug]                     otra vez, para meter los subtítulos
npm run ensamblar -- temp/[slug]
```

- **No corras `npm run audio` ni `npm run musica`**: la canción es el audio. Se niegan solos.
- **No escribas `transiciones.json`** ni copies efectos: este estilo va con corte seco.
- **No corras `npm run voces:revisar`**: con `clips_mudos: true` todos los clips van sin audio, así que una voz colada no se oye y no hay nada que silenciar a mano.
- **Salen dos versiones**: `con-subtitulos` y `sin-subtitulos`.
- **Créditos, para decirlos antes de mandar los videos a Flow**: las imágenes cuestan 0 créditos en Flow y no esperan el sí. Los videos se pagan con los créditos de la cuenta de Flow del usuario: `npm run videos` imprime cuántos clips son y la estimación de créditos. Un anuncio de 5 min son 60 a 80 clips, más que cualquier otro estilo. **Se muestra y se espera el sí.**
- **La duración no es un defecto**: el anuncio dura lo que dura la canción. Nunca se corta la letra para cuadrar minutos.
- Antes de entregar, la lista de la sección 6 de `COMO-PRODUCIR.md`: fotogramas negros, tramos congelados, voces, archivos recién generados, y el informe en dos apartados (decisiones del montaje / lo que salió mal) con lo gastado de verdad: los créditos de Flow de los videos y lo que cobró kie.ai por la canción. El anuncio termina ahí: se entregan los MP4 de `output/` y el informe.

### Las imágenes y los videos se generan en Google Flow

En esta versión del sistema, `npm run imagenes` y `npm run videos` no generan ni cobran nada: arman la lista de trabajo (la cola) y tú generas cada archivo en Google Flow. En el lugar de cada uno de esos dos comandos del orden de arriba va este ciclo:

1. `npm run imagenes -- temp/[slug]` arma la cola (`temp/[slug]/flow/cola-imagenes.json`) y hace solo lo que no necesita Flow (las copias de frames).
2. Genera la cola en Google Flow con la skill `flow-generacion`: manejas Chrome con la extensión Claude in Chrome, y esa skill explica todo el procedimiento (ventana aparte, subir las referencias, enviar todo, reintentos, descargar cada archivo con su nombre).
3. `npm run flow:recibir -- temp/[slug]` mueve las descargas a la carpeta del anuncio, las convierte y las verifica.
4. Repite 1 a 3 hasta que la cola diga que no queda nada. Hay trabajos que esperan a otros y salen en la vuelta siguiente: en este estilo, `protagonista_despues` espera la hoja de `protagonista_antes`, y cada toma espera las hojas que adjunta.
5. Lo mismo con `npm run videos -- temp/[slug]`. **Antes de mandar los videos a Flow**, dile al usuario cuántos clips son y la estimación de créditos que imprime el comando, y espera su ok. Las imágenes cuestan 0 créditos en Flow y no necesitan ok.

Los límites del modelo no cambian: Flow usa el mismo Omni 1.1 Flash (clips de 4, 6, 8 o 10 s), así que siguen valiendo el tope de 10 s por toma y el clip mínimo de 4 s (Paso 4.3).

**Para rehacer una toma** (lo que el usuario pida después del informe) se usa `npm run rehacer`, que nunca repite el prompt que falló y guarda los anteriores en `prompts-anteriores.json`. **No uses `--rehacer` en `npm run imagenes` para una toma**: con `--tomas N` la cola también lleva todas las hojas de personaje y la del producto, y `--rehacer` las mandaría a `historial/` y las pediría otra vez (la toma rehecha, y todas las que se rehagan después, saldrían con otra protagonista que el resto del anuncio).

1. `npm run rehacer -- temp/[slug] --toma N --contexto` muestra lo que no se toca (tipo, duración, referencias, línea) y los prompts que fallaron. Escribe una escena distinta para la misma intención en un `nuevos.json` (`prompt_imagen_inicial`, `prompt_imagen_final` si es Tipo B, `prompt_video`).
2. `npm run rehacer -- temp/[slug] --toma N --aplicar nuevos.json` los pone en el manifiesto y manda a `historial/` `toma-N-inicial.png`, `toma-N-final.png` y `toma-N.mp4`: el clip también se rehace, porque sale de la imagen nueva.
3. `npm run imagenes -- temp/[slug] --tomas N` y después `npm run videos -- temp/[slug] --tomas N --sin-broll`, cada uno con el ciclo de Flow de arriba (en una Tipo B, dos vueltas de imágenes: el END FRAME espera al START nuevo; antes del video, el ok de los créditos), y **sin `--rehacer` en ningún comando**, tampoco en `flow:recibir`: lo viejo ya no está. Las hojas que ya están no se vuelven a pedir. Corre `flow:recibir` cuando la imagen nueva esté en Descargas: si no la encuentra, la marca "falta" (la vieja quedó en `flow/descargas/recibidos/` y no se vuelve a usar).
4. Al final, `npm run plan` y `npm run ensamblar`, como imprime el comando.

Si la imagen está bien y solo el clip salió mal (una deformación, un salto), basta `npm run videos -- temp/[slug] --tomas N --rehacer`, **una sola vez**: manda el clip viejo a `historial/` y lo pone en la cola. Con el ok de los créditos sigue el ciclo de Flow, con `flow:recibir` y las vueltas siguientes **sin** `--rehacer`: repetido después de recibir, archiva el clip que acaba de llegar y lo vuelve a pedir (y se paga otra vez).

## Paso final — Pregunta cómo quiere producirlo

Con la canción elegida, el paquete armado (hojas, tomas, prompts, datos para el editor) y el manifiesto guardado y validado, **el paquete no se pega en el chat**: queda en el manifiesto, que es interno y nunca se muestra, ni siquiera en la opción C, y los datos para el editor en `datos-editor.md` (6.4). **Ahora, y solo ahora**, va en el chat solo un resumen corto y la pregunta:

```markdown
Listo: historia musical de [producto] para [mercado], en [idioma], con voz
[femenina/masculina]: [N] tomas, sin B-roll, [m:ss] (lo que dura la canción).
El manifiesto quedó guardado y validado[, salvo tu foto del producto: pásamela
(arrástrala al chat o dime la ruta) y la dejo lista].
[Solo si hay una decisión que conviene que sepas, en una línea: por ejemplo
"agregué 'Pagas al recibirlo' en el CTA por el pago contra entrega".]

¿Cómo quieres seguir?

**A) Prodúcelo todo tú** — genero las imágenes y los videos en Google Flow,
armo el montaje y te entrego el MP4 terminado. Antes de los videos te digo
cuántos créditos de Flow gastan.

**B) Genera solo las imágenes y los videos** — los genero en Google Flow y te
los dejo en su carpeta, listos para que los montes tú en CapCut a tu gusto.
También te digo los créditos de Flow antes de los videos.

**C) Entrégame el paquete de prompts** — te paso aquí las hojas de personaje,
la tabla de tomas con su línea de la letra, los prompts de imagen y video de
cada toma y los textos en pantalla, para que lo revises o lo produzcas a mano.
Después puedes seguir con A o B.
```

El resumen son 1-3 líneas: estilo, producto, mercado e idioma, cuántas tomas (sin B-roll) y lo que dura la canción. La línea de la decisión va solo si hay una que conviene que sepa (si el cierre es solo tarjeta final, es esa: el MP4 termina en la moraleja y el llamado, y la tarjeta con la marca se agrega al montar); si no, no la pongas.

**A**: sigue el Paso 9 de corrido, parándote solo en los créditos de Flow antes de los videos (y en los permisos de descarga que pide `flow-generacion`). **B**: corre hasta que `npm run videos` diga que no queda nada en la cola (con el ciclo de Flow del Paso 9) y después `npm run plan:humano -- temp/[slug]`, que deja `plan-montaje.txt` con qué toma va en qué segundo de la canción. **En A y en B, al entregar** (los MP4 y el informe, o `plan-montaje.txt`), si hay datos para el editor pásale la tabla de `datos-editor.md`, copiada tal cual, con la aclaración de que esos textos no están en el video y se agregan al montar.

### Si elige C — el paquete en el chat

Entrégale la segunda entrega del Paso 7 **completa, nunca una muestra** ni "¿quieres que siga?": la Character Bible, la tabla de tomas, los prompts por toma, los datos para el editor y los comandos que siguen (puntos 5 a 8 y 10), **sin el manifiesto** (punto 9). La letra va en la tabla de tomas, cada línea con su toma y su duración medida. **Las hojas y los prompts se copian del manifiesto carácter por carácter** (y los datos para el editor, de `datos-editor.md`): es la fuente de verdad, y lo que el usuario ve tiene que ser exactamente lo que se va a producir. Si pide cambios, se cambian en el manifiesto y se vuelve a validar (`npm run validar -- temp/[slug]/manifiesto.json`); un texto en pantalla se cambia en `datos-editor.md`.

Al final, ofrécele seguir con A o B, o dejarlo ahí.

Si en cualquier momento pide ver el paquete o una parte ("muéstrame las hojas de personaje", "pásame los prompts de la toma 12"), muéstrale esa parte, copiada del manifiesto (los textos en pantalla, de `datos-editor.md`).

---

## Reglas que nunca se rompen

- Nunca interactúes con el usuario en otro idioma que no sea español.
- Nunca pidas voz hablada en el prompt de estilo. Nunca `duration`. Nunca letra sin tildes.
- Nunca elijas tú la versión de la canción.
- Nunca fotorrealismo, grid azul ni fondo de estudio. Pixar 3D en todo.
- Nunca B-roll. Nunca texto dentro de los prompts. Nunca transiciones ni ambiente de clips: `clips_mudos: true` siempre.
- Nunca una toma de más de 10 s ni una línea de más de 14 palabras.
- Nunca mandes los videos a Flow sin decir cuántos clips son y los créditos que estima `npm run videos`, y esperar un sí (las imágenes, 0 créditos, no esperan).
- Nunca copies un guion o una canción de referencia: la lógica sí, el contenido no.
