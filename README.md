# Sistema de anuncios con IA — versión Google Flow

Con esta carpeta puedes crear anuncios publicitarios en video, de principio a
fin, sin editar nada a mano si no quieres: desde la idea hasta el MP4 listo para
subir a Meta.

Hay **doce estilos visuales** distintos, más un efecto, **continuidad**, que se
aplica encima de los estilos con narrador. Cada uno sabe escribir su propio
guion, sus prompts y su montaje.

En esta versión **las imágenes y los videos se generan en Google Flow**, con tu
propia cuenta de Google, y quien maneja Flow es Claude, desde tu Chrome. Tú no
copias ni pegas prompts: miras, apruebas y sigues con lo tuyo.

---

## Lo que necesitas tener

- **Claude Code** (la app de escritorio de Claude o Claude Code en la terminal),
  con tu cuenta de Claude de **plan pago (Pro, Max, Team o Enterprise)**: la
  extensión **Claude in Chrome**, que es con la que Claude maneja Flow, lo
  necesita.
- **Google Chrome** (tiene que ser Chrome: Edge, Brave y los demás navegadores
  parecidos no sirven) y una **cuenta de Google** para **Google Flow**
  (<https://labs.google/fx/tools/flow>, que redirige a flow.google.com). Para
  los videos se recomienda el plan **Google AI Pro o Ultra**, por los créditos.
- Una cuenta de **ElevenLabs**, y si quieres música generada, una de **kie.ai**.

Si te falta algo, Claude te dice dónde sacarlo y te guía.

---

## Empezar (esto es todo lo que tienes que hacer)

1. Descomprime esta carpeta donde quieras y ponle el nombre que prefieras.
2. Abre **Claude Code** en esa carpeta.
3. Escríbele: **"instala esto"** o **"ayúdame a configurar esto"**.

Claude va a revisar tu computadora, instalar lo que falte, explicarte qué
servicio hace qué y cuánto cuesta, y pedirte solo lo que no puede resolver solo:
tus claves de API (te dice dónde sacarlas), instalar la extensión **Claude in
Chrome** e iniciar sesión en Google cuando Flow lo pida. La extensión, instálala
desde el enlace que te pasa Claude (la guía oficial de Anthropic): en la tienda
de Chrome hay otras con nombres parecidos que no son la de Anthropic.

**Los permisos.** Claude Code te va a pedir que apruebes lo que hace Claude
(comandos, acciones en Chrome): si quieres, elige permitirlo siempre en este
proyecto y no tendrás que aprobar lo mismo cientos de veces. La extensión de
Chrome también puede pedirte permiso para actuar en labs.google y
flow.google.com (Google Flow): permítelo.

**No necesitas saber programar, ni abrir una terminal, ni entender qué es Node.**
Si algo no está, Claude te dice qué descargar y te guía. Si tienes que cerrar
Claude Code a mitad de la instalación (por ejemplo, para conectar Chrome),
vuelve a abrirlo en la misma carpeta y dile otra vez "instala esto": sigue
desde lo que falta.

Cuando termine, ya puedes pedirle un anuncio.

---

## Actualizar a una versión nueva

Si ya tienes el sistema instalado y te llega un zip con una versión nueva, no
lo instales de nuevo en otra carpeta: actualiza la tuya.

1. Si Claude está generando algo (imágenes o videos en Flow, la voz, la música
   o el video final), **espera a que termine** y **cierra las otras ventanas**
   de Claude Code.
2. Descarga el `.zip` nuevo. **No lo descomprimas tú** ni lo pongas dentro de
   tu carpeta. En Mac, si la descarga quedó como carpeta (Safari descomprime
   los zip solo), usa esa carpeta en lugar del zip, sin meterla dentro de la
   tuya.
3. Abre en Claude Code **tu** carpeta del sistema (la que tiene tus anuncios en
   `temp/`), arrastra el zip (o esa carpeta) al chat y escribe:
   **"Actualiza el sistema con esta versión nueva: lee el ACTUALIZAR.md que
   trae y síguelo."**
4. Claude te pedirá **permiso varias veces** (descomprimir, copiar, instalar):
   acepta hasta que termine. Si se corta a la mitad, **vuelve a arrastrar el
   zip (o la carpeta) y escribe lo mismo**: si se cortó mientras copiaba los
   archivos, Claude primero deja todo como estaba y después hace la
   actualización completa; si ya los había copiado, solo termina lo que
   faltaba.
5. Al final, **abre una conversación nueva**.

Tus anuncios (`temp/`), tus videos (`output/`) y tus claves (`.env`) no se
tocan, y lo que se reemplaza queda guardado en `respaldos/`. Qué trae cada
versión está en `CAMBIOS.md`; la que tienes instalada, en `VERSION` (las
carpetas de antes del 2026-10-18 no lo tienen: Claude las reconoce solo).

Si cambiaste algo del sistema y quieres que se mantenga al actualizar (otro
modelo, una regla tuya), pídele a Claude que lo anote en `PERSONALIZACION.md`:
cada actualización lo vuelve a aplicar.

---

## Los estilos

| Estilo | Cómo se ve |
|---|---|
| **Crochet** | un mundo en miniatura tejido a mano en lana |
| **Claymation** | stop-motion de plastilina |
| **Zack D Films** | animación 3D de cine, por capítulos, explicando un mecanismo |
| **Estilo Pixar** | el mismo anuncio por capítulos con narrador, pero todo en animación Pixar: el mecanismo se ve dentro del cuerpo translúcido de la persona, en su propia casa, sin fondos técnicos |
| **Estilo Lego** | minifiguras y mundos de ladrillos, con un narrador; el mecanismo en animación médica 3D y tu producto real dentro del mundo Lego |
| **Skeleton Ads** | el personaje esqueleto 3D de TikTok |
| **UGC** | una persona hablando a cámara, como un video de cliente real |
| **Objeto parlante** | el producto cobra vida y habla en primera persona |
| **Musical** | el producto se vende cantado, con una canción original de 1-2 minutos |
| **Historias musicales** | una historia en primera persona, cantada de principio a fin (4 a 10 minutos), sobre animación 3D estilo Pixar: alguien cuenta lo que le pasó, quién le trajo la solución y cómo le fue semana a semana |
| **Podcast** | dos anfitriones conversando frente a micrófonos; el producto entra como recomendación entre amigos, no como venta |
| **Entrevista** | entrevista callejera: alguien fuera de cámara le hace preguntas incómodas a una persona en la calle, y el producto entra cuando ya se confesó |
| **Continuidad** (efecto) | no es un estilo: va encima de Pixar, Zack D Films, Lego, claymation, crochet o skeleton. Cada video pasa de una escena a la siguiente, sin cortes, de principio a fin |

Para pedir uno, basta con decirle a Claude algo como:

> Quiero un anuncio estilo crochet para este producto: [link o foto]

> Hazme un anuncio estilo Pixar con continuidad de [tu producto]

Si tienes un guion que ya te funciona, pégalo: la mayoría de los estilos parten
de él en vez de escribir uno nuevo. Si no sabes cuál elegir, pídele que te los
muestre.

---

## Cómo funciona, en corto

1. **Hablas con la skill.** Te pregunta lo justo: qué producto, a quién le
   hablas, qué oferta tienes. Poco, y de una sola vez.
2. **Arma el anuncio completo por dentro**: el guion, cada toma con su prompt
   de imagen y de video, los B-roll y los textos en pantalla. No te llena el
   chat de prompts: te muestra un resumen corto (el estilo, cuántas tomas,
   cuánto dura). Si quieres ver el guion o los prompts de una toma, pídeselo
   cuando quieras. En historias musicales, antes de eso genera la canción y
   **tú eliges de oído** entre varias versiones: la canción es el audio del
   anuncio y manda sobre todo lo demás.
3. **Te pregunta cómo quieres seguir**, y aquí decides tú:
   - **A)** Que lo produzca todo y te entregue el MP4 terminado.
   - **B)** Que genere solo las imágenes y los videos, y tú los montas en
     CapCut a tu gusto.
   - **C)** Que te pase el paquete de prompts completo (el guion toma por
     toma, los prompts de imagen y video, los B-roll, los textos en pantalla
     y el guion de voz), para revisarlo o producirlo a mano. Después, si
     quieres, sigue con A o B. El manifiesto de tu anuncio, el archivo con el
     que trabaja el motor, no se entrega: es interno del sistema (el de
     `ejemplo-anuncio/` sí está para que lo mires).
4. **Las imágenes y los videos se hacen en Google Flow, en tu Chrome.** Claude
   abre su propio grupo de pestañas, **"Claude"**. Cada vez que lo abre (una vez
   por sesión) te pide que hagas clic derecho en la etiqueta "Claude" y elijas
   **"Mover grupo a una ventana nueva"**: así él trabaja en esa ventana y tú
   sigues en la tuya. **No
   cierres ni minimices la ventana de Claude** hasta que te avise que terminó.
   Antes de bajar cada tanda de archivos te pide permiso en el chat, y si Google
   pide iniciar sesión o un captcha, lo haces tú.
5. **Al final** tienes los MP4 en `output/` y un informe de lo que se hizo y
   lo que costó.

**Nunca se mandan videos a Flow sin decirte antes cuántos créditos van a gastar
y esperar que digas que sí.** Lo mismo con la música en kie.ai.

---

## Los servicios que usa

| Servicio | Para qué | |
|---|---|---|
| **Google Flow** | las imágenes y los videos, con tu cuenta de Google | **obligatorio**. Recomendado el plan Google AI Pro o Ultra, por los créditos de video |
| **ElevenLabs** | la voz en off y los subtítulos | **obligatorio** |
| **kie.ai** | la música de fondo y las canciones, con Suno | **recomendado**. **Obligatorio** solo para musical e historias musicales |

Sin kie.ai funcionan Lego, Zack D Films y skeleton (traen su propia música),
podcast y entrevista (van sin música), y cualquier estilo en el que pongas tu
propio mp3. Si pides un estilo con música generada y no conectaste kie.ai,
Claude te pregunta en ese momento: lo conectas, o ese anuncio sale sin música de
fondo.

---

## Lo que cuesta

**Tú pagas tu propio consumo.** La carpeta no trae ninguna clave ni ninguna
cuenta: cada persona usa las suyas.

- **Google Flow** — se descuenta de los créditos de tu plan de Google. Las
  imágenes cuestan **0 créditos**. Los videos (Omni 1.1 Flash, 720p): **4 s = 7
  créditos, 6 s = 10, 8 s = 12**; los de 10 s, y el modelo de respaldo que se usa
  solo si un video no sale, cuestan más y todavía no están medidos. Como
  referencia, el anuncio de `ejemplo-anuncio/` (crochet, 51 segundos, 32 videos)
  son unos 256 créditos si cada clip sale a la primera. Si un video sale mal y
  se regenera, se vuelve a gastar: Claude te pregunta antes de regenerar un
  video o de pasar al modelo de respaldo. **Las historias musicales son las que
  más gastan, por su largo**: una de 5 minutos son 60 a 80 clips, casi todos de
  7 o 10 créditos (alguno de 12). El total de tu anuncio te lo dice Claude
  cuando ya está armado, antes de mandar los videos. Conviene saberlo antes de
  pedir una, porque el plan de Google tiene un tope de créditos.
- **ElevenLabs** — la voz en off y los subtítulos. Hay plan gratuito para
  probar.
- **kie.ai** — la música de fondo y las canciones. Centavos de dólar por
  anuncio. Se carga saldo por adelantado.
- **Claude** — tu plan pago de Claude (Pro, Max, Team o Enterprise), para
  Claude Code y Claude in Chrome.

> **Ojo con el plan gratuito de ElevenLabs**: no incluye licencia comercial. Si
> vas a publicar el anuncio, necesitas un plan de pago.

Tus claves quedan guardadas en un archivo de tu computadora, `.env`. Nadie más
las ve, y si algún día compartes esta carpeta, ese archivo no se comparte:
nunca lo mandes por chat ni lo subas a ningún lado.

---

## AVISO DE LICENCIA DE REMOTION — LEER ANTES DE USAR

Este proyecto usa **Remotion** para el ensamblado y render del video.

**Remotion es gratis para personas individuales y para empresas de menos de 3 empleados.**

**Las empresas con 3 o mas empleados necesitan una licencia comercial**, y el tier
de automatizacion (render sin intervencion humana, que es exactamente lo que hace
este pipeline) **se cobra por render**.

Esto no es letra chica: es una obligacion legal de cada persona que use este
proyecto, no del autor. Antes de usarlo en un contexto comercial, revisa los
terminos en https://www.remotion.dev/license y compra la licencia si te aplica.

---

## Qué hay en esta carpeta

| | |
|---|---|
| `temp/` | aquí va cada anuncio que crees, en su propia carpeta |
| `output/` | aquí salen los MP4 terminados |
| `ejemplo-anuncio/` | un anuncio real ya hecho, para que veas cómo queda |
| `recursos/` | efectos de sonido y música que algunos estilos usan |
| `.claude/skills/` | las skills: una por estilo, la de continuidad y la que maneja Google Flow |
| `skills/` | las mismas, empaquetadas por si quieres llevarte una a otro proyecto |
| `produccion/` y `remotion/` | el motor. No hace falta que lo toques |
| `respaldos/` y `mis_archivos/` | aparecen al actualizar: la copia de lo que se reemplazó y tus propios archivos que estaban en carpetas del sistema |
| `VERSION` y `CAMBIOS.md` | la versión que tienes y lo que trae cada una |

> **Las skills no se instalan.** Ya están listas dentro de esta carpeta: con
> abrir Claude Code aquí, las tienes. Y solo funcionan aquí — no se mezclan con
> otros proyectos tuyos ni te cambian nada del Claude Code que ya usas.

Lo demás son instrucciones para Claude, no para ti. Si tienes curiosidad,
`COMO-PRODUCIR.md` explica el proceso completo por dentro.

---

## La versión original, por API

Este sistema existe también en una versión que pide las imágenes y los videos a
kie.ai por API, sin Chrome ni Google Flow (ahí se paga cada imagen y cada video
en kie.ai). Son dos carpetas distintas: esta no la reemplaza, y cada una tiene
su propia instalación.

---

## Si algo falla

Díselo a Claude tal cual, con tus palabras: *"me salió un error"*, *"se quedó a
medias"*, *"el video salió raro"*. Él sabe qué revisar y cómo arreglarlo.

Tres casos que conviene conocer:

- **Cerraste la ventana de Claude sin querer.** Lo que ya se descargó no se
  pierde. Dile que siga con el anuncio: abre otra ventana, retoma el mismo
  proyecto de Flow y hace solo lo que falta.
- **Claude no ve tu Chrome.** Abre Google Chrome (en el perfil con tu cuenta de
  Google de Flow), haz clic en el icono de Claude y comprueba que tienes la
  sesión iniciada con la misma cuenta de Claude que usas en Claude Code. Si
  usas Claude Code en la terminal, escribe `/chrome`: muestra la conexión y la
  reconecta.
- **Flow dice que no te quedan créditos.** Claude para y te avisa. Lo generado
  queda en tu proyecto de Flow; sigues cuando se renueven o si subes de plan.

Si el sistema deja de responder o algo se desconfigura, escríbele:

> revisa la configuración

y va a comprobar todo otra vez.
