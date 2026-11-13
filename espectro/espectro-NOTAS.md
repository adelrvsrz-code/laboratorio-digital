# El espectro — notas de la exposición

Todo el espectro electromagnético, de 1 Hz a 10³⁰ Hz, como un dial que se recorre de lado a lado, con la atmósfera encima: la luz cae desde el espacio y cada frecuencia baja hasta la altitud a la que el aire la detiene. Un único HTML (~76 KB) generado a partir de los archivos `espectro-*`: en local, `dist/el-espectro.html`; publicado en <https://adelrvsrz-code.github.io/laboratorio-digital/el-espectro/>. Versión 1, de noviembre de 2026.

## La idea que organiza todo

- **El espectro es uno solo.** Radio, luz y rayos gamma son lo mismo a distinta frecuencia; el eje horizontal es continuo y logarítmico (treinta órdenes de magnitud) y las bandas son solo tramos con nombre.
- **Casi nada llega al suelo.** La atmósfera deja dos ventanas anchas (la óptica y la de radio) y unas cuantas rendijas en el infrarrojo y las ondas milimétricas. Todo lo demás se queda arriba, y por eso hay telescopios en montañas, aviones, globos y satélites.
- **Cada cosa en su sitio.** Lo cotidiano (la FM, el wifi, el mando a distancia, una radiografía) y lo cósmico (la línea del hidrógeno, el fondo de microondas) comparten eje. Los observatorios se dibujan a su altitud real sobre el tramo que observan.

Elemento memorable: la lluvia de luz. Columnas de color que caen desde el espacio y se cortan a la altura del perfil de la atmósfera; al alejar del todo (tecla `0`) se ve la silueta completa, con las dos ventanas abiertas hasta el suelo.

## Archivos

| Archivo | Qué es |
|---|---|
| `espectro-data.js` | Bandas, perfil y causas de la atmósfera, categorías, niveles de certeza, catálogo, comparaciones de tamaño, recorrido. El que más se edita |
| `espectro-fis.js` | Física: conversiones entre frecuencia, longitud de onda y energía, ley de Wien, interpolación del perfil, color de cada frecuencia. Funciones puras, sin DOM |
| `espectro-app.js` | Formato, estado, dibujo, HUD, entrada, ficha, buscador, arranque |
| `espectro-styles.css`, `espectro-template.html` | Estilos (derivados de `escalas-styles.css`) y esqueleto con los marcadores `{{CSS}} {{FIS}} {{DATA}} {{APP}}` |
| `espectro-build.js`, `espectro-check.js` | Ensamblado y comprobaciones sin navegador |
| `espectro-atm-gen.js` | Herramienta de desarrollo: calcula el tramo de rayos X y gamma del perfil. No entra en el HTML; `espectro-check.js` la usa para comparar |

`espectro-fis.js` se carga antes que los datos porque el catálogo usa sus conversores; sus funciones leen las tablas `ATMOS` y `BANDS` al llamarlas, no al cargar.

## Modelo de datos (`espectro-data.js`)

```js
{ id: 'radio-fm', n: 'Radio FM', f: [87.5e6, 108e6], c: 'com', z: 'conv', p: 1,
  d: 'Ondas de unos tres metros que ya no rebotan en la ionosfera: llegan hasta donde alcanza la vista desde la antena y poco más.' }
```

| Campo | Significado |
|---|---|
| `id` | único, minúsculas, dígitos y guiones; es el enlace profundo (`#radio-fm`) |
| `n` | nombre tal como se muestra |
| `f` | frecuencia en hercios, o intervalo `[a, b]` en cualquier orden. Se escribe en la unidad natural de cada zona con los conversores: `_nm(1550)`, `_um(15)`, `_keV(511)`, `_m(_wien(310))`… |
| `c` | categoría: `com`, `cot`, `nat`, `med`, `obs` (colores en `CATS`) |
| `z` | certeza: `ref` valor de referencia, `conv` convenio o banda asignada, `est` estimación, `rec` récord en movimiento |
| `p` | prioridad del rótulo, 1 a 3: cuando no caben todos, se ven antes los de prioridad 1 |
| `sig` | opcional: cifras significativas con las que se muestra la frecuencia (por defecto 3); longitud de onda y energía usan las mismas, con un máximo de 5 |
| `alt`, `g` | solo observatorios: altitud en km o `'esp'` (en el espacio) y dibujo (`dish`, `dome`, `plane`, `balloon`, `sat`, `array`) |
| `d` | descripción propia, una a tres frases |

Añadir una ficha = añadir una línea y ejecutar `node espectro-check.js` y `node espectro-build.js`. Las fichas de `TOUR` no pueden quitarse sin actualizar esa lista (la comprobación lo avisa).

`BANDS` define cada banda por su frontera superior (`hasta`, en Hz). `SIZES` son los objetos con los que se compara la longitud de onda, de mayor a menor; conviene que no haya más de media década entre dos consecutivos. `ATMOS.perfil` es la tabla de pares `[longitud de onda en m, altitud en km]` que dibuja la silueta, y `ATMOS.causas` dice qué la detiene en cada tramo.

## Cómo funciona la aplicación (`espectro-app.js`)

- **Vista.** El estado es `c` (log₁₀ de la frecuencia bajo la aguja central) y `ppd` (píxeles por década). Arrastrar o la rueda mueven `c`; el pellizco, Ctrl + rueda y +/− cambian `ppd`, entre «cabe el espectro entero» y 1 600 px por década. Abrir una ficha centra la aguja sin tocar el zoom, salvo que su intervalo no quepa en pantalla: entonces se aleja lo justo.
- **Eje vertical.** Altitud comprimida con `asinh(km / 6)`, de 0 a 500 km, para que se distingan el suelo, una montaña de 5 km, un avión a 13, un globo a 40 y la órbita. No es lineal y la ayuda lo dice. Los satélites van en una franja «espacio» por encima, sin altitud.
- **Dibujo.** Todo en un único `canvas`, cada fotograma: franjas de color de 3 px desde debajo de la cabecera (con el borde superior fundido) hasta la altitud del perfil, columnas de trazos que caen (la lluvia), la línea del perfil, el eje de altitud, los observatorios, los rótulos del suelo, el dial con doble escala (frecuencia y longitud de onda) y la aguja con su etiqueta («se queda a unos 35 km · los electrones del aire»). Medido a 60 fps en el navegador sin cabeza. Con `prefers-reduced-motion` la lluvia queda quieta, el desplazamiento no se suaviza y solo se redibuja cuando algo cambia.
- **Perfil promediado.** Cada columna de 3 px abarca un tramo de frecuencias y pinta la media del perfil en ese tramo (`altBand`, sobre una tabla fina con sumas acumuladas). Así las líneas estrechas no parpadean al desplazar: de lejos se ven rebajadas y al acercar se afilan. La etiqueta de la aguja usa siempre el valor exacto, por lo que en una rendija estrecha (Lyman-alfa) el punto de la aguja puede quedar fuera de la línea dibujada.
- **Observatorios.** Se dibujan en tres pasadas (barras, dibujos y rótulos) para que ningún dibujo tape un nombre. Cada rótulo prueba a la derecha de su dibujo y, si choca con otro rótulo o con otro dibujo, a la izquierda; eligen sitio primero los de más prioridad. Los satélites comparten altura, así que sus barras van en dos carriles para no pisarse (Webb y Hubble se solapan entre 0,6 y 1,7 µm).
- **Rótulos.** Las fichas del suelo se reparten en dos filas (una en pantallas bajas) con un orden estable (prioridad y luego frecuencia) para que no bailen al desplazar; la que no cabe queda como punto sobre el dial, con tooltip. Los intervalos se ven como una barra sobre el dial; los observatorios, como una barra con topes a su altitud. Las barras también se pueden pulsar: si coinciden un punto y una barra gana el punto, y entre barras, la más estrecha. Los rótulos se dibujan de menor a mayor prioridad para que, si dos puntos se solapan (GPS cae casi en el centro de la telefonía móvil), el clic vaya al más importante.
- **Interfaz en DOM.** Cabecera, lectura inferior, ficha, buscador y ayuda. La zona activa (`#stage`) es un `div` transparente sobre el canvas; los clics se resuelven contra la lista de rectángulos `S.hits` que deja cada dibujo.
- **Pantallas.** Tres disposiciones: escritorio, móvil vertical (`S.mob`, ancho ≤ 760) y pantalla baja (`S.low`, alto < 560, la del móvil apaisado), que pone la clase `low` en la raíz y encoge cabecera, pie y filas de rótulos. Probado a 1366×820, 2200×1200, 1533×734 a escala 125 %, 390×780, 320×568 y 844×390.
- **Pruebas con las fuentes reales.** Sin red, el navegador sin cabeza usa la tipografía de respaldo y los rótulos miden distinto: así se escaparon tres solapes que solo se vieron al abrir el build en un navegador con Syne e Instrument Sans (un satélite dibujado sobre el nombre de otro, la luz cortando en seco bajo el subtítulo y un rótulo de altitud tras la flecha). Desde entonces las capturas se hacen sirviendo en local las dos familias (paquetes `@fontsource/syne` y `@fontsource/instrument-sans`) en lugar de la hoja de Google Fonts.
- **Teclado y lectores de pantalla.** Flechas para pasar de ficha, Intro para abrir la que está bajo la aguja, y el resto de atajos de la ayuda. En escritorio la ficha es una región `aria-live`; en móvil, donde las flechas no abren ficha, el nombre, la frecuencia y lo que hace la atmósfera se anuncian en una región oculta (`#live`). El catálogo completo es accesible desde el buscador.
- **Recorrido.** Quince fichas de `TOUR`; cada parada dura según lo que haya que leer (entre 7 y 15 segundos).
- **Formato.** `fmt` (cifras significativas, coma decimal, espacio fino), `fmtFreq`, `fmtLen`, `fmtEnergy`, `fmtRange` y `sizeLike`, que compara con `≈`, `×` y `÷`. Por encima de 10¹⁵ Hz la frecuencia se da en notación científica: los prefijos PHz o EHz no los usa casi nadie. Entre 0,1 y 1 eV se escribe «0,8 eV», no «800 meV».
- **Estado.** La ficha abierta va en el hash (`#fibra`); la vista, en `localStorage` (`es:vista`) dentro de `try/catch`.

## Decisiones y motivos

- Un dial que se desplaza, no el zoom de Escalas. La propuesta inicial era reutilizar aquel motor, pero allí cambiar de escala es avanzar; aquí lo que se recorre es un eje y el zoom solo decide cuánto eje se ve. Se reutilizan los estilos, la estructura de la ficha, el buscador y los formateadores.
- La atmósfera como protagonista en lugar de «una onda dibujada a escala». Una onda no puede dibujarse a escala a lo largo de treinta órdenes de magnitud; la altitud a la que se queda la luz sí cabe en pantalla y explica por qué existen los telescopios espaciales.
- Un criterio físico único para el perfil: la altitud a la que la atmósfera que queda por encima suma una profundidad óptica de 1. Es el de las figuras clásicas de aeronomía y permite calcular de verdad el tramo de rayos X y gamma.
- Frecuencia creciente hacia la derecha, como en un dial de radio. La longitud de onda va debajo en la segunda escala.
- Color real solo en el visible (aproximación propia por tramos); fuera, un color de la paleta del laboratorio por banda, fundido entre vecinas. La ayuda lo avisa.
- Fronteras entre bandas por longitud de onda redonda (1 m, 1 mm, 750 nm, 380 nm, 10 nm, 10 pm). Son un convenio y la ficha del tecnecio-99m lo cuenta: rayos X y gamma se distinguen por el origen, no por la energía.
- Los observatorios en tierra se dibujan a su altitud real aunque queden pegados al suelo con este eje: es el dato honesto, y ALMA a 5 km ya asoma por encima de parte del vapor de agua.
- Abrir una ficha no acerca el zoom. La primera versión ajustaba el zoom al intervalo y, con bandas estrechas como la FM o el wifi, saltaba al máximo y ahí se quedaba durante el resto del recorrido.
- El dibujo de la ficha lleva tantas ondas como el número de orden de su banda (una en la radio, siete en los rayos gamma): es cualitativo, pero ya no es el mismo adorno en todas.
- En móvil las flechas no abren ficha (taparía casi todo el cielo): solo centran, y el nombre queda resaltado.
- Los rótulos de altitud que caen detrás de la flecha izquierda se apartan a su derecha: la flecha es DOM y va centrada en vertical, así que según el alto de la ventana tapa uno u otro. En pantallas bajas, el rótulo que no cabe bajo el anterior se omite.
- Sin modo claro real, como en Escalas: la escena es un cielo nocturno. Los tokens existen; los colores del canvas van en el código.

## Qué es dato y qué es esquema

**Constantes y conversiones.** Exactas (c y h del SI de 2019). `espectro-check.js` las contrasta con cuatro valores conocidos.

**Perfil de la atmósfera**, por tramos:

| Tramo | Cómo se obtiene | Fiabilidad |
|---|---|---|
| Rayos gamma y X, hasta 1,24 nm (≥ 1 keV) | Calculado por `espectro-atm-gen.js`: coeficientes de atenuación del aire del NIST (Hubbell y Seltzer, 1 keV–20 MeV), límite de creación de pares por encima (7/9 de la inversa de la longitud de radiación, 36,62 g/cm²) y presión de la U.S. Standard Atmosphere 1976 | ±1 km respecto al cálculo (lo comprueba `espectro-check.js`; desviación máxima actual: 0,8 km). Entre 20 MeV y 1 GeV, medio kilómetro más por la interpolación |
| Rayos X blandos y ultravioleta extremo, 1,24–110 nm | Estimado con secciones eficaces típicas de N₂, O₂ y O (10⁻¹⁸–10⁻¹⁷ cm²) y las columnas de la termosfera | ±20 km; además sube y baja con el ciclo solar |
| Ultravioleta lejano y medio, 110–310 nm | Estimado con secciones eficaces del oxígeno (continuo y bandas de Schumann-Runge, Lyman-alfa) y del ozono (banda de Hartley) y con una columna de ozono media de unas 300 unidades Dobson | ±10 km. Reproduce los rasgos de la curva clásica: unos 100–115 km en el continuo del oxígeno, la rendija de Lyman-alfa hacia 75 km, el mínimo de 30 km cerca de 200 nm y el máximo del ozono hacia 45 km |
| Infrarrojo, submilimétricas y milimétricas | Esquema: posiciones de bandas y ventanas conocidas (1,4, 1,9, 2,7, 4,3, 6,3 y 15 µm; ventanas de 8–13 µm, 350, 450 y 850 µm; líneas de 183, 119 y 60 GHz) y altitudes orientativas | Las posiciones son buenas; las altitudes dependen de la humedad y de la resolución con que se mire. Coherente con dos datos contrastados: SOFIA, a 12,5 km, tenía un 80 % de transmisión media entre 20 µm y 1,3 mm, y ALMA observa a 5 km en las ventanas de 350 y 450 µm |
| Radio larga | Esquema: la ionosfera refleja por debajo de un corte que oscila entre unos 3 y 15 MHz | El perfil la lleva al techo del gráfico porque, vista desde fuera, se refleja tanto más arriba cuanto menor es la frecuencia |

No se dibuja la banda del ozono de 9,6 µm: su profundidad óptica ronda 1 y con este criterio queda en el límite.

**Rayos gamma de muy alta energía.** La altitud indica dónde empieza la cascada, no dónde acaba; por eso MAGIC y LHAASO «ven» desde el suelo lo que según el perfil no llega.

**Catálogo.** Revisión de noviembre de 2026. Contrastado con fuentes oficiales o primarias y corregido donde hacía falta:

| Ficha | Resultado | Fuente |
|---|---|---|
| Voyager 1 | Un día luz (25 900 millones de km) el 18 de noviembre de 2026 | NASA/JPL, recogido por EarthSky y ScienceDaily |
| Yebes, 40 m | 2–90 GHz (antes ponía 116) y 980 m de altitud | Observatorio de Yebes, IGN |
| Fotón récord | 2,5 PeV, publicado en 2024 (antes 1,4 PeV, de 2021) | Colaboración LHAASO, IHEP |
| Hubble | 115 nm–1,7 µm con los instrumentos en servicio; unos 480 km de altura | STScI |
| Gran Telescopio Canarias | 0,36–2,5 µm con los instrumentos en servicio; 2 267 m | GRANTECAN |
| SOFIA | Telescopio de 2,7 m (2,5 útiles); instrumentos infrarrojos de 4,5 a 612 µm; 12–14 km | Centro científico de SOFIA (IPAC) |
| MAGIC | 30 GeV–100 TeV (antes 50 GeV–50 TeV); 2 200 m | Colaboración MAGIC, MPP |
| ALMA | 66 antenas, 35–950 GHz, unos 5 000 m (sin cambios) | ESO |
| Mensajes a submarinos | 76 Hz, en servicio de 1989 a 2004; un cuarto de hora por código de tres letras, dato que las fuentes dan como «según se contó» | Wikipedia («Project ELF»), que cita la hoja informativa de la Marina de EE. UU. |
| Radar meteorológico | Red de AEMET en banda C, a 5,6 GHz; comparte banda con el wifi de 5 GHz | Presentaciones de AEMET publicadas por el MITECO |
| Escáner de aeropuerto | Dos familias: 24–30 GHz y 70–80 GHz | Rohde & Schwarz y Microwave Journal |
| Telefonía móvil y TDT | Móvil de 700 MHz a 3,8 GHz más la banda de 26 GHz; TDT en 470–694 MHz | Ministerio y CNMC |
| Lyman-alfa | Corregido el texto: en los cuásares más remotos acaba en el infrarrojo, no en el visible | Cálculo directo con el desplazamiento al rojo |
| Globos estratosféricos | Intervalo desde 30 keV, coherente con el perfil calculado a 40 km | Cálculo propio |
| Radiografía | Una de tórax, 0,1 mSv: unos diez días de fondo natural (sin cambios en la cifra; el texto decía «unos días») | RadiologyInfo (ACR y RSNA) |
| Fermi | De unos 20 MeV a más de 300 GeV; todo el cielo cada tres horas (sin cambios) | NASA, centro científico de Fermi |
| James Webb | 0,6–28,3 µm, a 1,5 millones de km, por debajo de 50 K (sin cambios) | NASA y STScI |

El resto de las cifras (DCF77, GPS, línea del hidrógeno, fondo cósmico, sodio, H-alfa, candela, lámpara germicida, litografía, cobre K-alfa, tecnecio, aniquilación, cobalto, Planck, Chandra) son valores de referencia estables y están escritos de memoria, sin contrastar una a una en esta revisión. La ficha de los rayos X del cobre dice que la doble hélice se descubrió «con rayos X desviados por fibras de ADN»: es cierto, y a propósito no afirma qué tubo se usó, porque no lo he podido confirmar.

Caducan con el tiempo y habrá que tocarlas: la altura de Hubble, que baja cada año; el récord de LHAASO; las bandas de telefonía.

## Límites conocidos

- La banda visible ocupa un tercio de década: hay que acercar para separar sus fichas.
- No se muestran la ionosfera ni la capa de ozono como capas dibujadas, solo su efecto sobre el perfil.
- La lluvia cae igual en todas las frecuencias: indica hasta dónde llega cada una, no cuánta luz hay. La ayuda lo dice.
- La ficha describe la atmósfera en el centro del intervalo; en intervalos anchos (telefonía móvil, terahercios) hay de todo.
- No hay filtro por categoría ni comparador.
- Sin red se usa la tipografía del sistema y el reparto de rótulos cambia ligeramente.

## Ideas pendientes

- Sustituir el esquema del infrarrojo por un perfil derivado de un modelo de transmisión línea a línea, ejecutado fuera y guardado como tabla de referencia, igual que `luna-ref.json`.
- Siglas de la UIT (VLF, LF, MF, HF, VHF, UHF, SHF, EHF) junto al nombre de la banda: cada una es una década exacta y el público de telecomunicaciones las espera.
- Modo «la Tierra emite»: invertir la lluvia para la radiación que sale (las ventanas son las mismas, y la de 8–13 micras es por donde se enfría el planeta).
- Curvas de cuerpo negro superpuestas con un deslizador de temperatura: del fondo cósmico al Sol y a un disco de acreción.
- Capas dibujadas (troposfera, ozono, ionosfera) y nubes, que cierran la ventana óptica pero no la de radio.
- Enlace profundo a una posición del dial, además de a una ficha.
- Más fichas en los huecos: entre 100 Hz y 50 kHz, el infrarrojo medio, los rayos X blandos y los rayos gamma por encima de 100 TeV.
- Zoom anclado al puntero en lugar de a la aguja.
