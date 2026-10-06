# KOZMIK RUN — v1.9.1 hallogeekz · pack gótico 32-bit

## v1.9.1 — vuelven los personajes originales, escoba sola, historia, oscuridad final, más monedas, móvil
- **vuelven los 3 personajes originales** (pack gótico 32-bit, de perfil): brujo (sombrero estrellado, báculo con cristal morado y grimorio), hombre lobo (piel de lobo gris con ojo naranja, capa roja rasgada, garras) y vampiro (capucha negra con cruz dorada, joya roja, alas de murciélago, jabot blanco).
  - el arte sale de los sprites `pack-gotico-32bit/personajes-32bit/*-derecha.png` (iguales byte a byte a los adjuntos que reenvió marcelo, ya con fondo transparente). se pasan a pixel art real, 10 px → 1 px lógico, con 48 colores, y se muestran a ×2 nítido en el menú.
  - **idle snes en el menú:** animación por partes, a pasos de 1 px, sin sesgo ni interpolación:
    - todos: respiración de 1 px, parpadeo con párpado dibujado sobre el ojo visible (cada ~3 s, a veces doble), cola que se mece
    - brujo: punta del sombrero y capa se mecen; el cristal del báculo titila
    - vampiro: alas que aletean 1 px; capa que se mece
    - hombre lobo: pelaje que se eriza en el borde; brillo en el ojo naranja
  - **dónde aparecen:** el canvas del menú, el héroe de la tarjeta y las miniaturas del selector.
  - **archivos:** `assets/idle_brujo.png`, `assets/idle_vampiro.png`, `assets/idle_hombre-lobo.png` (hojas de 8 cuadros: 4 de respiración + los mismos 4 con parpadeo).
  - se retiraron los stickers de frente (`assets/front_*.png`).
- **transformación completa en escoba:**
  - al empezar la carrera hay un poof con los colores del disfraz y el personaje se convierte en la escoba encantada: no hay jinete.
  - **la escoba:** 4 cuadros con paja que flamea; rota con la velocidad, se mece y se ve más grande (×1,3, ~166 px). el hitbox no cambia.
  - **la elección de personaje se nota:**
    - la estela de polvo mágico toma los colores del personaje: brujo morado/dorado, lobo gris/ámbar, vampiro rojo/negro
    - la atadura de la escoba lleva el color del disfraz
    - cuelga un dije pixel art que se mece 1 px: cristal morado (brujo), ojo ámbar (lobo) o joya roja con cruz dorada (vampiro)
  - **cometa:** la escoba se enciende y se vuelve el cometa morado; adentro solo se ve una silueta tenue de la escoba. al terminar vuelve a ser escoba.
  - al chocar, al terminar la práctica o al volver al menú, el personaje reaparece con un poof.
- **historia de apertura:** se escribe sola tipo máquina de escribir sobre el fondo del juego.
  - se puede saltar con «saltar», tocando, o con espacio/enter/esc.
  - se muestra sola una vez por dispositivo; queda guardado en `kozmicRun.storySeen` y sobrevive al cambio de día.
  - el botón «✦ historia» de la tarjeta la vuelve a abrir.
  - texto:
    > es noche de hallogeekz y el tanuki morado de geekz se pone su disfraz.
    > pero un hechizo travieso lo convierte en una escoba encantada… ¡y sale volando!
    > cruza el bosque tenebroso, el cementerio y el infierno juntando kozmits ✦.
    > con 50 la escoba arde en un cometa morado.
    > al final espera la oscuridad: nadie ha sobrevivido a ella. ¿hasta dónde llegarás?
- **sin explicaciones durante la carrera:**
  - **se quitaron:**
    - «invencible · rompe obstáculos · imán», «fin del cometa», «fin del poder», «¡poder gatuno! 3 s» y «racha ×n»
    - todos los flashes de pantalla completa (entrada a la oscuridad, choque, gato)
  - **quedan:** «+n ✦», «¡cometa morado!», «¡cadena perfecta! +n ✦», «−n ✦» (cadena rota), el nombre del acto y «¡vamos!».
  - la leyenda de «cómo funciona» y el texto de la tarjeta se acortaron.
- **la oscuridad siempre gana:**
  - **escalada:** desde los 90 s sube el tope de velocidad (680 → 780 px/s), los obstáculos salen más seguido, los huecos se angostan y las espadas voladoras van más rápido.
  - **«oscuridad total» a los 156 s** (66 s después de entrar a la oscuridad):
    - un túnel de muros de obsidiana con borde rojo-violeta serpentea (distinto en cada carrera) y se cierra
    - el fondo se oscurece desde los bordes, pero nunca queda negro
    - el hueco baja de 212 px a menos que el hitbox de la escoba (36 px) en ~10 s
  - **en esa fase:**
    - no hay cometa: si estaba activo se apaga y el medidor no lo dispara
    - no hay gatos ni invencibilidad
    - el modo dios de pruebas no aplica
    - ninguna cadena se genera hacia esa fase, así que todas las anteriores siguen siendo 100 % juntables
  - **verificación:** un bot con búsqueda exhaustiva de entradas (`forced191.js`) muere siempre entre los 166,2 y 166,5 s de carrera (~76 s en la oscuridad, ~10,3 s dentro de la fase final). se probaron 8 semillas, con y sin cometa activo al entrar.
- **más monedas (≈ +45 %), siempre en cadenas de habilidad:**
  - más cadenas por acto, más largas (temprano 9–12 · medio 10–14 · tarde 12–16 · oscuridad 15–19) y con monedas un poco más juntas
  - menos espacio entre cadenas, y se pueden encolar más adelante
  - los objetos sueltos ya no caen encima de una línea de cadena (se corren o se omiten)
  - densidad (objetos/s, mismo controlador neutro): ver tabla en el informe; la repetición de entradas planificadas sigue 100 %.
- **móvil:**
  - **pantalla:**
    - en teléfono horizontal el juego ocupa toda la pantalla, ajustado 9:5 con franjas, respetando notch y barra de inicio (`viewport-fit=cover` + `env(safe-area-inset-*)` + `visualViewport`)
    - la tarjeta del menú se compacta a la derecha, con vidas/kozmits/récord y botón de sonido
  - **vertical:** el menú es la página normal. al empezar una carrera aparece un aviso suave «gira tu teléfono», que pausa la carrera; se descarta con «jugar así» (la carrera queda ajustada al ancho).
  - **sin gestos del navegador:** sin scroll, rebote, zoom por pellizco o doble toque, selección de texto ni menú de pulsación larga.
  - **control:**
    - se mantiene para volar en todo el lienzo, el botón «vuela» y, durante la carrera en el celular, cualquier parte de la pantalla
    - es multitáctil y sin demora de 300 ms
    - se suelta con pointerup/cancel, touchend/touchcancel, blur, pestaña oculta o pausa
  - **audio:**
    - se desbloquea en el primer toque (búfer mudo + `resume()` dentro del gesto)
    - en iOS respeta el interruptor de silencio (`audioSession='ambient'`)
    - se reanuda al volver del fondo
  - **rendimiento:**
    - el juego se dibuja siempre en coordenadas 900×500. el lienzo real usa escala ×1–2 según el tamaño y el `devicePixelRatio` (en celular arranca en 1,5) y baja sola si los cuadros van lentos
    - los halos ahora son pre-renderizados (no hay gradientes por cuadro ni `shadowBlur` por partícula)
    - en celular hay un tope de 320 partículas
    - delta-time con sub-pasos de ≤1/60 s: la misma velocidad a 60/120 Hz y con cuadros lentos
    - la carrera se pausa con la pestaña oculta y se reanuda suave
  - **imágenes:**
    - los 4 panoramas pasan a webp (~120–190 kB c/u en vez de ~1–1,2 MB png), con respaldo png
    - barra «cargando arte… n %» en la tarjeta
  - **web app:** `manifest.webmanifest` (pantalla completa, horizontal), íconos 180/192/512 (+ maskable) y metas `apple-mobile-web-app-*`. en android, al empezar se pide pantalla completa y horizontal donde el navegador lo permite.
- se mantienen `BETA=true` (vidas ∞), la clave `kozmicRun`, el gancho `index.html?test`, la música, la luna, el brillo de obstáculos, el cometa y las cadenas de v1.8.4. sin scanlines ni flashes; nunca se sesga el arte.

## v1.9 — idle de frente, escoba voladora, recorrido al azar en cada carrera
- **idle de frente en el menú (pixel art estilo snes):** en el menú, la elección de personaje y entre carreras, el personaje mira al jugador y anima en su lugar con cuadros de sprite (no es una interpolación suave):
  - respiración en 4 cuadros: reposo · inhala (cabeza 1 px arriba, pecho 1 px más ancho) · reposo · exhala (1 px abajo)
  - la capa y la cola se mecen a pasos de 1 px; las orejas o la punta del sombrero también
  - parpadeo cada ~3 s, a veces doble, con párpado dibujado encima
  - flote de 0–2 px lógicos, todo a escala entera sin suavizado
  - el idle aparece en el canvas, en el héroe de la tarjeta (reemplaza el flotado css) y en las miniaturas del selector (la elegida se anima)
  - **origen del arte de frente:**
    | personaje | arte de frente |
    |---|---|
    | vampiro | sticker real de frente `GZ01_vampiro` (hallogeekz) |
    | brujo | sticker real de frente `GZ01_bruja` (sombrero y capa de bruja), con banda y estrellas en dorado |
    | hombre lobo | no existe arte de frente: se armó sobre el frente real de GZ01 (`GZ01_frente_R01`) con capucha de lobo pixel art (orejas, ojos ámbar, hocico, colmillos, piel gris), capa roja rasgada, collar con medialuna y cinturón, siguiendo la paleta del sprite de perfil |
  - el arte de frente se pasó a pixel art de unos 76 px de alto: colores planos, contorno oscuro, luz arriba-izquierda y sombra abajo-derecha con algo de dither. nunca se sesga el arte de perfil.
  - **archivos:** `assets/front_brujo.png`, `assets/front_vampiro.png`, `assets/front_hombre-lobo.png` (hoja de 8 cuadros: 4 de respiración + los mismos con parpadeo).
- **escoba voladora en carrera:**
  - al empezar, el personaje se transforma con un poof de partículas de su color (sin flash) en jinete de una escoba pixel art 32-bit (`assets/broom_32bit.png`, 4 cuadros)
  - **escoba:** mango de madera con vetas, anillos dorados y pomo; amarre morado; paja con mechones que flamean
  - el personaje de perfil va montado: el mango cruza por delante del cuerpo
  - el aparejo entero rota con la velocidad vertical (rotación, no sesgo) y se mece un poco
  - la estela de polvo mágico sale de la punta de la paja con los colores de cada skin; al apretar «vuela» la paja suelta un soplo extra
  - **hitbox:** no cambia (sigue siendo el del personaje); la escoba es solo dibujo
- **el cometa nace de la escoba:** al llegar a 50 objetos ✦, la estela de la paja se enciende morada y en ~0,55 s crece desde la paja hasta envolver al jinete y convertirse en el cometa morado. al terminar vuelve a la escoba: la paja sigue ardiendo morada un momento y el jinete reaparece con un pop. reglas sin cambios: 9 s, aviso en los últimos 2 s, 1,1 s de gracia, el medidor cuenta todos los objetos ✦.
- **recorrido al azar en cada carrera:**
  - **antes:** las carreras reales usaban una semilla diaria, así que todas las carreras del día tenían el mismo recorrido
  - **ahora:** cada carrera (y cada práctica) arranca con una semilla nueva (`crypto.getRandomValues` + reloj + `Math.random`). obstáculos, cadenas, objetos sueltos y gatos cambian siempre
  - para pruebas, `?test` puede fijarla con `__kr.cfg({seed:N})`
  - **verificación headless (`random19.js`):**
    - 5 carreras con semilla nueva: 5 semillas distintas
    - parecido de obstáculos entre pares en los primeros 30 s: ≤ 2 % (posición y tipo)
    - parecido de objetos: ≤ 7 %
    - prefijo idéntico: 0
    - con semilla fija (4242), dos carreras salen idénticas
- **cadenas de habilidad (se re-verificaron en v1.9):**
  | prueba | resultado |
  |---|---|
  | repetir la entrada planificada | **100 % (342/342)** |
  | jugador simulado de lazo cerrado | 98–99 % |
  - densidad de objetos igual que en v1.8.4
- **menú más claro:** el velo de la tarjeta es más suave a los lados, para ver el idle (nada de pantalla negra). el texto de «cómo funciona» ahora dice que cada carrera trae un recorrido nuevo al azar.
- **prueba:** `?test` suma a `window.__kr`:
  - `cfg({seed, god})` (`god` = no choca, solo pruebas)
  - `start`, `skin`, `setT`, `idleFrame`, `rigPop`
- **sin cambios:**
  - `const BETA=true` (vidas ∞ para testers)
  - clave `kozmicRun`
  - música, luna, brillo de obstáculos, cometa y cadenas de v1.8.4
- **rutas:** todas relativas y con mayúsculas/minúsculas exactas (probado en un servidor http con un build liviano).
- **archivos:**
  - **cambiados:** `game.js`, `index.html` (`?v=1.9`, héroe en canvas, textos), `style.css` (idle pixelado, velo), `README.md`
  - **nuevos:** los 3 `assets/front_*.png` y `assets/broom_32bit.png`


## v1.8.4 — cometa morado 64-bit + cadenas de monedas por habilidad
- **cometa morado (transformación):**
  - **cuándo:** cada **50 objetos ✦** que juntas en la carrera (monedas y demás objetos «mas»; los que tomas siendo cometa no suman). el medidor «cometa morado n/50» va en la franja de piedra del suelo, junto al contador de monedas de la carrera. al llegar a 50 vuelve a 0 y te transformas. aparece el texto «¡cometa morado!» y una explosión local de partículas, sin flash de pantalla.
  - **duración:** 9 s, con una barra «cometa morado x.x s» arriba al centro. **aviso:** en los últimos 2 s solo el cometa parpadea suave (baja su opacidad; la pantalla no se toca) y suena un campanazo suave a los 2 s y a 1 s. al terminar sale «fin del cometa» con otra explosión local y tienes **1,1 s de gracia**: los obstáculos se atraviesan sin daño.
  - **juego:** eres invencible y **rompes obstáculos**: estallan en esquirlas y polvo morado y dan **+2 ✦** («¡pum! +2 ✦»). las monedas se **imantan** hacia ti (hasta ~360 px por delante). rebotas en el techo y el suelo en vez de chocar. la velocidad no cambia, para que siga siendo justo y las cadenas sigan cuadrando.
  - **look 64-bit (dibujado en canvas, sin sprite nuevo):** cabeza de plasma con degradado suave y mezcla aditiva. **tonos:** violeta, magenta, índigo, lila y toques de cian y rosa que van rotando de a poco (hue 264–300). **capas:**
    - cinta de cola degradada (cian → índigo → magenta → violeta) con discos brillantes y un trazo central
    - halo en forma de gota
    - 6 lóbulos de plasma en órbita
    - la **silueta de tu skin** en violeta translúcido dentro del cometa
    - núcleo blanco
    - arcos en remolino y destellos de 4 puntas en la cola
  - **audio:** barrido ascendente al transformarte y uno descendente al salir. mientras dura, una **capa de arpegio brillante** suena encima de la canción del acto. va en el mismo reloj de 16avos del acto y sigue sus acordes, así que el tempo por acto no se toca; está mezclada unos 18 dB bajo la música y no satura.
- **cadenas de monedas por habilidad (nuevo generador):**
  - cada cadena es la **trayectoria real del jugador**. se simula una secuencia de mantener/soltar con la física del juego (gravedad 720, empuje −980, velocidad vertical −370…430, pasos de 1/60 s) y con la velocidad de scroll prevista para el momento exacto en que llegas. las monedas van a distancia fija sobre esa curva (44 px, un poco menos en actos tardíos). **formas:** ola, subida, picada, arco, valle y eses; más largas y curvas en actos tardíos, siempre posibles. **largo:** 7–9 monedas en bosque, hasta 10–13 en la oscuridad.
  - **cada cadena se revisa antes de aparecer:**
    - arranca con un tramo recto de 0,5 s
    - no sale de pantalla (50–398 px)
    - deja una salida recuperable
    - no toca obstáculos, con margen y contando la deriva de las espadas voladoras y el vaivén
  - **los obstáculos se acomodan alrededor de las cadenas activas:** los fijos se acortan, los flotantes se mueven y, si no caben, no aparecen. las migas y los objetos sueltos no aparecen encima de una cadena.
  - las monedas de una cadena se ven unidas: hilo de luz tenue entre ellas, destello que viaja y giro en ola. junta **toda** la cadena y sale «**¡cadena perfecta! +N ✦**» (largo × dificultad del acto + racha) con un sonido nuevo y destellos dorados. «racha ×k» si encadenas varias; si se te escapa una moneda, la racha vuelve a 0 (se mantiene el «cadena rota» de antes).
- **verificación automática (headless, `verify184.js`):** modo práctica, 5 momentos (bosque, cementerio, infierno y oscuridad) × 8 semillas × 24 s, unas 340 cadenas:
  | prueba | resultado |
  |---|---|
  | repetir la secuencia de mantener/soltar del generador | **100 % (342/342)** de cadenas juntadas enteras sin chocar, en los 4 actos y las 6 formas |
  | jugador simulado de lazo cerrado (corrige mirando la cadena, a 60/120/144 fps y con dt irregular) | 98–98,5 %; las fallas son de entrada o transición entre cadenas del controlador |
- **densidad de objetos (objetos/s):**
  | acto | v1.8.3 | v1.8.4 |
  |---|---|---|
  | bosque | 3,0 | 3,8 |
  | cementerio | 5,1 | 5,7 |
  | infierno | 5,6 | 6,1 |
  | oscuridad | 9,6 | 9,4 |
- **hud:** el contador de monedas de la carrera quedaba tapado por el suelo; ahora va en la franja de piedra junto al medidor del cometa.
- **prueba:** `index.html?test` suma a `window.__kr`:
  - control: `cfg`, `meter`, `seed`, `practice`, `setHeld`
  - cometa: `comet(seg)`, `cometOff`
  - simulación: `warp`, `step`, `spawnChain`, `pathHits`, `hitBox`, `draw`
- **sin cambios:** `const BETA=true`, clave `kozmicRun`, música, luna y brillo de obstáculos de v1.8.3.
- **archivos cambiados:** `game.js`, `index.html` (`?v=1.8.4` y leyenda), `README.md`. sin assets nuevos.


## v1.8.3 — banda sonora por acto, luna nítida, obstáculos con brillo
- **una canción distinta por escena** (Web Audio, sin archivos). cada una dura 16 compases con sección A (1–8) y B (9–16), con su propia tonalidad, progresión, riff, melodía, instrumentos y carácter. el tempo es fijo por acto y **sube en cada acto** (nunca sube de a poco con la velocidad):
  | acto | tonalidad | bpm | carácter / instrumentos |
  |---|---|---|---|
  | bosque | la dórico (6ª mayor celta), B en la menor natural con cadencia en mi mayor | 140 | aventurero y misterioso: galope en bombo y guitarras, whistle celta con ornamentos (A), arpegio folk pulsado, pandero; en B guitarra líder con dúo en terceras y el whistle una octava arriba |
  | cementerio | re menor armónica (do# sensible) | 152 | gótico e inquietante: órgano de iglesia en cada compás, campana fúnebre, coro «aah» en B, chug a corcheas con acentos sincopados, solista neoclásica (pedal en re, arpegio disminuido de do#) |
  | infierno | mi frigio + disminuido (fa = b2, si♭ = tritono) | 164 | agresivo y pesado: riff de nota pedal en mi con acentos fa/sol/si♭, doble bombo continuo a semicorcheas, china, más distorsión; solista áspera a octavas (A) y en terceras menores (B) |
  | oscuridad | si menor (armónica, napolitano do mayor) | 176 | frenético y climático: blast beat, guitarras trémolo a semicorcheas, colchón de cuerdas, coro en el clímax (compases 13–16), golpes de cierre en fa#; solista dramática en dúo + octava |
- se mantienen: tema del menú (el de v1.8.2), sting de game over + tema triste en loop, sliders de música/efectos, silencio con «m», cambio de acto en el downbeat con redoble + platillo y **fundido** de las colas de la canción anterior.
- arreglo de audio: los envolventes arrancan en 0 (antes un GainNode partía en 1 y podía colarse un clic de 1 muestra al inicio del ruido de platillos).
- **luna nítida (todos los actos):** sprite dedicado `assets/moon_32bit.png` (hoja 6×2 de 72 px, se dibuja ×2 sin suavizado y anclada a píxel entero): disco con contorno oscuro definido, mares, cráteres con pared en sombra/luz, brillo de borde del lado iluminado y limbo oscuro, halo a bandas con dither 32-bit. paleta propia por acto: bosque amarilla · cementerio blanca · infierno roja. **oscuridad:** núcleo plateado sólido encima y fantasmas rojo/cian detrás (asoman como bordes de anaglifo) + velo estéreo tenue; desfase lento y estable de ~4 px, sin temblor rápido; glitch solo breve y raro. los panoramas `bg_pan_*.png` no tienen luna pintada (solo la zona oscurecida donde estaba), así que no hay choque.
- **obstáculos con más brillo** (aura roja intacta): contorno claro fino, más contraste y brillo, bisel de luz arriba-izquierda en espada, relicario, tumbas y enredaderas. **espada (`menos2`):** destello que recorre la hoja + brillo en la guarda + chispa en la punta; el relicario lleva un destello en la gema. las llamas ya eran brillantes y no cambian.
- **sin parpadeo al apretar «vuela»:** se quitó el velo verde de pantalla completa mientras se mantiene el botón (quedan la estela, el resorte de animación y el sonido). los flashes de choque, poder gatuno y entrada a la oscuridad se mantienen.
- archivos nuevos/cambiados: `game.js`, `index.html`, `README.md`, `assets/moon_32bit.png` (nuevo; `moon.png` ya no se usa). prueba automática: `index.html?test` expone `window.__kr` (saltar de acto, render offline del audio con niveles); sin `?test` no hace nada.
- `?v=1.8.3` en index.html para evitar caché. BETA=true.

## v1.8.2 — música por acto, game over, animación, más monedas
- **música por acto (ya no se acelera con la velocidad):** cada acto tiene bpm fijo e intensidad propia — bosque 140 (galope) · cementerio 152 (doble bombo en corcheas, dúo de guitarras en la 2ª mitad) · infierno 164 (doble bombo en semicorcheas + riff de nota pedal armonizado) · oscuridad 176 (blast + guitarras armonizadas + octava). el cambio cae en el downbeat con fill de batería + platillo, y la melodía del acto nuevo arranca desde el compás 1.
- **más melodía:** guitarra líder pegadiza (saw+square, vibrato en notas largas, eco de corchea con puntillo) encima del ritmo speed metal; melodía distinta por acto (4 compases). menú: versión suave de la melodía del bosque.
- **game over:** al chocar se corta la música de juego y suena un sting de derrota (descenso cromático "wah-wah-wah-waaah" + acorde grave de mi menor); luego un tema triste lento (arpegio 72 bpm) mientras se ve el panel. al empezar otra carrera vuelve el tema del bosque.
- **animación del jugador:** resorte de squash/stretch (anticipación al apretar «vuela», rebote al soltar), golpe de ala marcado al subir, squash anclado a los pies; deformación por tiras: **capa/cola flamean** atrás con onda viajera, **sombrero/orejas se mecen** (atrás al subir, adelante al caer), pies patalean. también en el menú y al chocar (agitación).
- **aún más monedas:** `mas1` ~88 % de los sueltos (peso 7.5), casi siempre 1–2 monedas extra junto al suelto, migas de 3 monedas entre obstáculos (50 %), más cadenas (36–62 %, oscuridad hasta 66 %) y cadenas +1 moneda.
- `?v=1.8.2` en index.html para evitar caché. BETA=true.


## v1.8.1 — auras, más monedas, speed metal, animación
- **auras legibles:** todos los obstáculos (`menos`) llevan aura **roja** clara; coleccionables (`mas`) y poder gatuno llevan aura **azul** clara.
- **más monedas:** peso de `mas1` (moneda lunar) ~81 % entre ítems sueltos; más cadenas; a veces un segundo `mas1` junto al suelto.
- **más fácil al inicio:** huecos más anchos (`MIN_ROOM` 188, gap base ~235), velocidad inicial 230 (antes 250), rampa más suave, spawns más espaciados.
- **música:** speed metal suave-pero-feroz por Web Audio (~176 bpm, double-kick, power chords saw, lead limpio). sigue el tempo con la velocidad y el slider de volumen.
- **animación del jugador:** bob idle, flap al subir, squash al caer, lean/flicker de carrera (escala/rotación/offset) en brujo · vampiro · hombre lobo.
- BETA=true · UI español minúsculas · panoramas y reglas mas/menos intactas.

## v1.8 — personajes de perfil + objetos mas/menos (pack gótico 32-bit)
- **personajes nuevos (de perfil, miran a la derecha):** `skin_brujo.png`, `skin_vampiro.png`, `skin_hombre-lobo.png` (recortados y reducidos desde `pack-gotico-32bit/personajes-32bit/*-derecha.png`). se dibujan tal cual, sin sesgo ni espejo, **sin escoba** (el sprite ya es cuerpo completo); inclinación leve con `vy`; la estela sale de la espalda/cola. selector: «brujo», «vampiro», «hombre lobo». un skin guardado viejo (bruja/fantasma) vuelve a brujo. los stickers de frente hallogeekz ya no se cargan.
- **regla de nombres (marcelo):** `masN.png` = coleccionable que vale **N ✦** (+20·N de distancia); aparición con peso ∝ 1/N^1.35 + boost de mas1 (v1.8.1). `menosN.png` = obstáculo puro; alto en juego = **40 + N·18 px** (±8 %), recortado para dejar siempre ≥188 px de hueco.
- tiras múltiples recortadas en sprites sueltos: `mas6a/b/c` (corazones), `menos1a/b/c` (enredaderas), `menos4a/b/c` (tumbas). limpieza de alfa (<40 → 0) y recorte ajustado.

| archivo | arte | valor / tamaño | rareza / uso |
|---|---|---|---|
| mas1 | moneda lunar dorada | 1 ✦ | ~81 % (v1.8.1) · eslabón de cadenas |
| mas2 | gema amatista | 2 ✦ | ~7.6 % · eslabón de cadenas tardías |
| mas3 | grimorio | 3 ✦ | ~4.4 % |
| mas4 | llave calavera | 4 ✦ | ~3.0 % |
| mas6a/b/c | corazón rubí / agrietado / encantado | 6 ✦ | ~1.7 % |
| mas7 | poción de maná | 7 ✦ | ~1.4 % |
| mas8 | poción de vida | 8 ✦ | ~1.2 % |
| menos0 | llama pequeña | 40 px | suelo · fuego fatuo flotante |
| menos1a/b/c | enredadera colgante / rastrera / trepadora | 58 px | techo (a) · suelo (b, c) |
| menos2 | espada gótica | 76 px | clavada en suelo · colgando del techo · espada voladora de lado |
| menos3 | llama mediana | 94 px | suelo · flotante (infierno/oscuridad) |
| menos4a/b/c | lápida / cruz / sarcófago | 112 px | suelo |
| menos5 | llama grande | 130 px | suelo |
| menos6 | relicario | 148 px (recortado al hueco) | colgando de cadena · flotante en péndulo |

- obstáculos por acto: bosque = enredaderas/espada · cementerio = tumbas/relicario · infierno = llamas · oscuridad = todo. llamas parpadean, relicario y enredadera colgante se mecen.
- retirados del juego: estrellas (1/3 ✦), mega dorada 12 ✦, bonus gz02 10 ✦, dulces, fantasmas, murciélagos, calabazas, tumba/enredadera/reja sticker, escoba. se mantienen: **gatos = 3 s invencible**, cadenas (ahora de monedas), actos, panoramas, luna, suelo, BETA=true.
- leyenda y textos actualizados (español minúsculas).

## v1.7 — panoramas de acto (fondos pintados)
- **4 fondos panorámicos** cableados a `drawBg` con scroll parallax horizontal:
  - `bosque` ← `assets/bg_pan_bosque.png` (ruinas musgosas / castillo / luna enmascarada → **amarilla**)
  - `cementerio` ← `assets/bg_pan_cementerio.png` (cementerio gótico / castillo / luna enmascarada → **blanca**)
  - `infierno` ← `assets/bg_pan_infierno.png` (ciudad volcánica de lava → luna **roja** encima)
  - `oscuridad` ← `assets/bg_pan_oscuridad.png` (ruinas púrpura / eclipse enmascarado → luna **estereoscópica**)
- originales en `assets/bg_refs/*_orig.png`; versiones sin luna horneada `*_nomoon.png`; full-bleed 900×500 en `bg_full_*.png`.
- lunas del sistema de color se dibujan **encima** del panorama (la luna/eclipse del arte se tapó con cielo).
- se mantiene la **franja de suelo de castillo** (`bg_castle_floor.png`).
- primer plano aligerado para no tapar el arte; jugabilidad intacta (dulces, poder gatuno, fijos variables, skins de frente, estrellas).
- BETA=true · geekz minúsculas · UI en español.

## v1.6 — dulces = puntos, gatos = poder, fijos de tamaño variable, luna por acto
- **dulces de maíz** (`candy_corn.png`) ahora son **premio**: +2 ✦ c/u (y +40 puntos de distancia), sonido propio, desaparecen al tocarlos. ya no se usan como adorno sobre obstáculos.
- **gatos** (suelo `cat_sit/witch/cauldron` + `cat_bat` flotante) dan **poder gatuno: invencible 3 s**. aura verde/violeta pulsante para reconocerlos; al tocarlos: estallido, sonido, escudo arcoíris sobre el jugador, barra «poder gatuno» en el hud, parpadeo en el último segundo y sonido de fin. durante el poder se atraviesan obstáculos y se rebota en techo/suelo. aparecen como máximo cada ~9–13 s (y no durante el poder). `cat_peek` ya no se usa de adorno.
- **fijos con tamaño variable** (tumba, enredadera, reja, calabaza de suelo): escala aleatoria 0.7–1.4 (hitbox escala igual). el techo se recorta si haría falta para dejar ≥170 px de hueco.
- **luna por acto**: bosque amarilla · cementerio blanca · infierno roja · oscuridad estereoscópica (anaglifo rojo/cian desfasado que tiembla). funde entre actos.
- leyenda actualizada (dulce 2 ✦ · poder: gatos 3 s). BETA=true.

prototipo arcade de geekz. mantén para subir, suelta para bajar, esquiva y junta kozmits ✦.

## v1.5.5 — jugador de frente + obstáculos sticker
- **jugador siempre de frente** (mira a cámara) también en carrera. se quitó por completo `spriteFitSide` (compresión X + sesgo 3/4) y el respaldo `gz01_side`. los skins hallogeekz (`skin_bruja/vampiro/fantasma.png`) se dibujan tal cual, de frente; solo se ajustó tamaño/posición (caja 74 px, sentado sobre la escoba) y una inclinación leve con `vy`.
- **icono nuevo del jugador:** `player_front.png` (GZ01 de frente con borde blanco tipo sticker) como respaldo si un skin no carga.
- **escoba sticker** (`broom.png`): horizontal, cruza por delante a la altura de la cadera; cerdas atrás (estela sale de ahí).
- **obstáculos flotantes estilo sticker chibi** recortados de las hojas de referencia hallogeekz:
  - fantasmas `ghost1–6.png` (hoja de fantasmas)
  - murciélagos `bat.png` (hoja GZ01), `bat_purple.png` (hoja aves), `bat2.png` (hoja pingüinos)
  - **gato murciélago** `cat_bat.png` (flotante nuevo, aparece desde ~8 s)
  - **dulces de maíz** `candy_corn.png`: grupos de 2–3 que giran (obstáculo chico)
- **suelo:** gatos negros `cat_sit.png`, `cat_witch.png`, `cat_cauldron.png` (fijos nuevos); calabazas `pumpkin.png/pumpkin2.png/pumpkin3.png`; `tomb.png`, `vines.png`, `fence.png` redibujados como stickers (contorno oscuro + borde blanco). adornos sobre fijos: calabaza, dulce o `cat_peek.png` asomado.
- los obstáculos se dibujan **encima del primer plano** para que árboles/rejas no los tapen.
- sprites sticker con suavizado (`STICKER` set); fondos SNES siguen pixelados.
- procedencia: recortes en `assets/refs/*_ref.png`.
- BETA=true, UI español minúsculas, clave `kozmicRun`.

## cómo abrir
abre `index.html` en cualquier navegador moderno (doble clic). funciona offline: todo usa rutas relativas
(`style.css`, `game.js`, `assets/`). no necesita servidor ni archivos de audio.

controles: botón «vuela», mantener presionado en el área de juego, o barra espaciadora / ↑ / w.
enter = empezar carrera · m = silenciar/activar sonido · ← → = cambiar disfraz (en el menú).

## v1.5.4 — orientación lateral, sin rayas, SNES más fuerte
- **sticker del jugador** en carrera mira hacia adelante (derecha): skins frontales con squash/sesgo 3/4 (`spriteFitSide`); respaldo `gz01_side`. menú sigue de frente. escoba intacta. *(reemplazado en v1.5.5: todo de frente)*
- **sin rayas horizontales estáticas:** CRT scanlines apagadas, guías de carril y líneas de velocidad quitadas; cornisa del suelo a bloques (no franjas); void sin bandas planas.
- **look SNES/32-bit** reforzado en fondos y props (`bg_*`, tomb, vines, fence, ghosts, bats, pumpkin, moon, broom). **no** se tocan `star*.png` ni `skin_*.png`. `imageSmoothingEnabled=false` + `image-rendering:pixelated`.
- BETA=true, UI español minúsculas, clave `kozmicRun`.

## v1.5.2 — suelo de piedras de castillo
- franja inferior sólida de **ladrillos de castillo** (`bg_castle_floor.png`, tile 32-bit) en todos los actos, con scroll (`world*.45`).
- se dibuja *después* del primer plano para que el playfield vuelva a tener base visible (~52 px).
- props y hit de suelo alineados al borde superior del suelo.

## v1.5.1 — más luz, primer plano, sin chispas en el aire
- **más elementos brillantes** fijos por acto: más faroles (glow pixel), más rayos de luna, ventanas iluminadas (`bg_window`), lava/grietas más intensas, glows anclados en oscuridad.
- **primer plano** (`drawForeground`): árboles/enredaderas, puntas de reja, pilares/grietas y shards de void con parallax más rápido (~0.55–0.7) *delante* del jugador.
- **sin luces flotantes** en el aire: se quitaron luciérnagas, brasas y sparkles pixel que derivaban. quedan props sólidos + líneas de velocidad.
- props nuevos: `bg_vine_hang.png`, `bg_window.png`, `bg_void_shard.png`; `bg_lantern.png` más brillante.

## v1.5 — synthwave horror + fondos 32-bit
- **música synthwave horror (Web Audio):** bajo saw/square grave, pads gated, arpegios ominosos en Fm–Db–Eb–Cm (~118 bpm). notas más fuertes (`loud` ×1.35); `musicVol` por defecto **1.0**. sliders + mute intactos. la tensión sigue subiendo con actos/oscuridad.
- **fondos estilo 90s 32-bit / Castlevania:** tiles y props pixel (paleta limitada) generados con PIL en `assets/bg_*.png`:
  - bosque: `bg_tree`, `bg_lantern`, `bg_fog`, `bg_forest_tile` + luciérnagas pixel
  - cementerio: `bg_tomb_pix`, `bg_fence_pix`, `bg_moonbeam`, `bg_cem_tile`, `bg_bat_far`
  - infierno: `bg_pillar`, `bg_lava_tile`, `bg_crack` + brasas pixel
  - oscuridad: `bg_void_glow` + puntos rojo/púrpura
  - scanlines CRT sutiles sobre el canvas; glows a bloques (no blobs suaves).
- se mantiene: 3 skins + estelas, cadenas, mega 12✦, actos 30 s, void, BETA ∞, escoba, `kozmicRun`.

## v1.4 — 3 skins, cadenas, actos cronometrados y oscuridad
- **3 personajes:** `bruja` (estela púrpura/lima), `vampiro` (rojo/negro), `fantasma` (cian/blanco). el resto sale del selector; si el skin guardado no vale, vuelve a bruja. se guarda en `kozmicRun`.
- **cadenas de estrellas:** spawns en patrones (línea, arco, zigzag, espiral) de 5–7 kozmits. cada una vale 1 ✦; al completar la cadena, bonus = nº de estrellas. líneas guía entre eslabones.
- **mega estrella dorada** (`star_gold.png`): **12 ✦** (más que la púrpura de 3). sigue existiendo el bonus GZ02 de 10 ✦.
- **actos por tiempo (máx. 30 s c/u):**
  - 0–30 s → bosque tenebroso
  - 30–60 s → cementerio
  - 60–90 s → infierno
  - **≥90 s → oscuridad** (fondo negro, título «oscuridad»): velocidad alta (hasta ~720), huecos más estrechos, spawn más denso y agresivo, tensión musical al máximo.
- se mantiene: escoba, BETA vidas ∞, sliders de volumen, flotantes/fijos, tempo/tensión, UI en español minúsculas, clave `kozmicRun`.

## v1.3 — actos, estela potente y música tenebrosa
- **actos de fondo (en orden, con crossfade):**
  - acto 1 · **bosque tenebroso** — `world` 0 → 4000 (árboles, niebla verde, luciérnagas)
  - acto 2 · **cementerio** — `world` 4000 → 9000 (lápidas, rejas, luna, murciélagos)
  - acto 3 · **infierno** — `world` 9000+ (lava, peñascos, brasas, resplandor rojo)
  - transición suave (~700 unidades de `world` de fundido). HUD muestra el nombre de la zona; al entrar a un acto nuevo aparece el título flotante.
- **estela de escoba más potente:** al impulsar (y más aún a alta velocidad) salen más partículas, más brillantes y con mayor vida desde la punta de la escoba. escala con `speed` y boost.
- **música más oscura:** drones graves, progresión menor sombría, arpegios escasos y disonancias/tritonos que crecen con el acto (`setStage`) además del tempo que ya escala con la velocidad. mute y SFX intactos.
- se mantiene: escoba, skins hallogeekz, flotantes/fijos, clave `kozmicRun`, 3 vidas/día, práctica, UI en español minúsculas.

## v1.2 — escoba, obstáculos fijos y tempo
- **escoba (Jet Set Radio):** el jugador va montado en `broom.png` (palo de madera + cerdas de paja, generado con PIL). skin + escoba se inclinan juntos con `vy`. al impulsar, la estela de partículas sale de la punta de la escoba. el selector de skins y todos los `skin_*.png` se mantienen.
- **flotantes vs fijos:**
  - flotantes (bob): fantasmas y murciélagos, con un poco más de amplitud de bob.
  - fijos (suelo/techo): `tomb.png` (lápida), `vines.png` (enredadera/espinas), `fence.png` (reja de hierro) — generados con PIL. sustituyen las torres de neón. algunas llevan calabaza de adorno.
  - spawn: flotantes en el carril del hueco; fijos como bloqueadores de suelo y/o techo. diferencia visual clara (bob + glow vs anclados con sombra).
- **música:** el loop Web Audio sube de tempo (`tempoRate` 1.0 → ~1.55) a medida que suben la velocidad y la distancia del mundo. rampa suave; el mute y los SFX siguen igual.
- se mantiene: clave `kozmicRun`, 3 vidas/día, práctica 7 s, puntuación, UI en español minúsculas.

## v1.1 — skins hallogeekz (octubre)
- el jugador usa por defecto los disfraces hallogeekz de GZ01 (copiados de `animacion/stickers_hallogeekz/png/GZ01_*.png`):
  `skin_bruja.png` (**por defecto**), `skin_vampiro.png`, `skin_fantasma.png`, `skin_esqueleto.png`, `skin_calabaza.png`,
  `skin_momia.png`, `skin_espantapajaros.png`, `skin_gato.png`.
- selector de disfraz con miniaturas en la tarjeta de inicio (o ← → en el menú). la elección se guarda en la misma clave
  `kozmicRun` (campo `skin`) y se mantiene al reiniciarse las vidas cada día.
- `gz01.png` / `gz01_side.png` quedan solo como respaldo si un disfraz no carga.
- en pantallas chicas la tarjeta de inicio ya no se corta (el canvas queda de fondo).

## qué cambió en v1
- **arte real de geekz** (copiado en `assets/`, originales sin tocar):
  - jugador: `gz01_side.png` (perfil lateral de GZ01 recortado de `mascotas/R01_GZ01_GZ02.jpeg`, fondo quitado y volteado para mirar hacia adelante) mientras vuela; `gz01.png` (GZ01 frente, de `web/sitio_base/assets/img/base/`) en menú y tarjeta.
  - kozmits: `star.png` (1 ✦), `star_purple.png` (3 ✦, menos frecuente).
  - bonus raro: `gz02.png` (zorro GZ02, 10 ✦, aparece desde ~1200 de recorrido).
  - obstáculos hallogeekz: `ghost1–4.png` (fantasma_01/03/05/06), `bat.png`, `bat_purple.png`, `pumpkin.png`; `moon.png` (prop_luna) como decoración de fondo.
  - si una imagen no carga, se dibuja una figura simple y el juego sigue funcionando.
- **sonido con Web Audio** (sin mp3): loop chiptune suave que parte con el primer clic/tecla (más completo durante la carrera), sfx de impulso + «jet», kozmit (distinto según valor), choque, botones, práctica lista y récord. botón 🔊/🔇 en la cabecera; la preferencia se guarda (`kozmicRunMute`).
- **dinamismo**: estela de partículas al impulsar, estallido de destellos al juntar, texto flotante (+1 ✦), sacudida de pantalla + destello + animación de caída al chocar, parallax de 2 capas de ciudad, luna, murciélagos lejanos, carriles de neón animados, líneas de velocidad.
- **textos en español** en estilo campaña (minúsculas, con tildes y ¡¿), «geekz» siempre en minúscula.
- **práctica**: igual que antes (7 s, ilimitada, sin choques ni puntos), ahora avisa «¡uy! choque» al tocar un obstáculo para aprender.
- **recorrido** (v1.9): cada carrera usa una semilla nueva al azar (hasta v1.8.4 las reales usaban una semilla diaria basada en la fecha).
- se mantiene: canvas 900×500, física/velocidades/hitboxes del original, 3 carreras por día, puntos = distancia/5 + kozmits, y la misma clave de localStorage `kozmicRun` (los datos guardados siguen sirviendo).

## archivos
- `index.html` — entrada única
- `style.css`, `game.js`
- `assets/` — png usados
