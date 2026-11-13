# La misma Luna — notas de la exposición

Simulador de por qué la misma fase de la Luna se ve girada de forma distinta según el lugar. A un lado, la Tierra vista desde la Luna con un observador que se arrastra; al otro, el cielo de ese observador. Un único HTML (~128 KB) generado a partir de los archivos `luna-*`: en local, `dist/la-misma-luna.html`; publicado en <https://adelrvsrz-code.github.io/laboratorio-digital/la-misma-luna/>.

## La idea que organiza todo

- **La fase es global.** En un instante dado, todo el que tiene la Luna sobre el horizonte ve la misma fracción iluminada (el paralaje la cambia menos de un punto porcentual).
- **El giro es local.** Lo que cambia de un lugar a otro es el ángulo del disco respecto a la vertical del observador.
- **La regla del punto sublunar.** El punto sublunar es el lugar que tiene la Luna en el cénit. La *distancia* de un lugar a ese punto fija la altura de la Luna (90° menos la distancia); el *rumbo* con el que se llega al lugar desde ese punto es el ángulo que aparece girado el norte celeste en su cielo. Comprobado con el cálculo completo en 26 lugares: coinciden a menos de 0,5°, y la diferencia es el paralaje.
- De ahí salen los matices que la exposición enseña: la «inversión entre hemisferios» de 180° solo se da cuando dos observadores quedan a lados opuestos del punto sublunar; la frontera no es el ecuador sino la latitud de ese punto (nunca más de unos 28,6° norte o sur, valor de referencia: 23,44° de oblicuidad más 5,14° de inclinación de la órbita); y para un mismo lugar la Luna gira a lo largo de la noche.

Elemento memorable: la Tierra vista desde la Luna sembrada de lunas pequeñas, cada una dibujada como se ve desde ese punto. Forman un molinillo alrededor del punto sublunar y, al arrastrar al observador, su Luna grande gira sin cambiar de fase.

## Archivos

| Archivo | Qué es |
|---|---|
| `luna-data.js` | Lugares, catálogo para dibujar la Luna, nombres de fases y rumbos, pasos del recorrido. El que más se edita |
| `luna-mapa.js` | Costas de la Tierra. Generado, no se edita a mano |
| `luna-astro.js` | Astronomía: funciones puras, sin DOM |
| `luna-render.js` | Rasterizadores puros: máscara de tierra, mapa lunar, disco lunar, globo terrestre |
| `luna-app.js` | Estado, disposición, dibujo, HUD, entrada, recorrido, enlace profundo |
| `luna-styles.css`, `luna-template.html` | Estilos y esqueleto con los marcadores `{{CSS}} {{DATA}} {{MAPA}} {{ASTRO}} {{RENDER}} {{APP}}` |
| `luna-build.js`, `luna-check.js` | Ensamblado y comprobaciones sin navegador |
| `luna-ref.json` | Tabla de referencia para las comprobaciones. Generada |
| `luna-mapa-gen.js`, `luna-ref-gen.js` | Generadores de los dos archivos anteriores. Solo para desarrollo |

## Modelo de datos (`luna-data.js`)

```js
{ id: 'madrid', n: 'Madrid', lat: 40.42, lon: -3.70, tz: 'Europe/Madrid' }
```

| Campo | Significado |
|---|---|
| `id` | único, solo minúsculas y dígitos (sin guiones: el guion separa partes del enlace); es el enlace profundo (`#madrid`) |
| `n` | nombre tal como se muestra |
| `lat`, `lon` | grados, norte y este positivos, redondeados a la centésima |
| `tz` | zona horaria IANA; la hora oficial la calcula el navegador con `Intl` |

El primer lugar del array es el inicial. Añadir un lugar = añadir una línea y ejecutar `node luna-check.js` y `node luna-build.js`. `madrid` y `elcabo` no pueden quitarse: los usa el último paso del recorrido.

`MOON` es el catálogo con el que se dibuja la cara visible: `seas` (casquetes `[latitud, longitud, radio, brillo]` cuya unión suave forma los mares), `floors` (cráteres de fondo oscuro), `spots` (manchas brillantes), `rays` (sistemas de rayos) y `labels` (los tres accidentes que se rotulan). Es un dibujo esquemático propio: los centros de mares, lagos y bahías son los de la nomenclatura de la UAI; radios y brillos están ajustados a ojo. Los cráteres están colocados con coordenadas redondeadas al grado y pendientes de contrastar una a una con el Gazetteer.

`TOUR` son los pasos del recorrido: título, texto y `go`, el nombre de la acción de `GO` en `luna-app.js` que prepara la escena. Los textos no hablan de «izquierda» y «derecha» porque en pantallas estrechas los discos van uno sobre otro.

## Astronomía (`luna-astro.js`)

- `frame(ms)` devuelve el estado geocéntrico en un instante: vectores del Sol y la Luna en un sistema fijo a la Tierra (x hacia Greenwich, z hacia el polo norte), puntos sublunar y subsolar, elongación, fracción iluminada, ejes de la Luna y libración, y la base de la vista «la Tierra desde la Luna» (norte celeste arriba, este a la derecha).
- `observe(frame, lat, lon)` devuelve lo que ve un observador: altura y rumbo de la Luna y del Sol (geométricos y con refracción) y tres ángulos «de reloj», medidos desde el cénit en sentido horario: `limb` (lado iluminado), `north` (norte de la Luna) y `cnorth` (norte celeste).
- `toView` y `fromView` pasan de lugar a posición en el disco y al revés; `nextRise`, `nextSet`, `nextTransit` y `phaseTime` buscan sucesos; `bearing` y `slerp` son geometría de la esfera.

Todo se calcula con vectores: el giro del disco sale de proyectar cénit, polo y Sol sobre el plano perpendicular a la visual, sin fórmulas de ángulo paraláctico. Incluye ΔT (polinomios de Espenak y Meeus), nutación abreviada, paralaje sobre el elipsoide WGS84 y refracción estándar (Sæmundsson). No incluye las libraciones físicas (menos de 0,04°), la altitud del observador ni el achatamiento del disco junto al horizonte.

Error máximo medido por `luna-check.js` frente a astronomy-engine 2.1.19 en 120 instantes y lugares entre 1950 y 2075:

| Magnitud | Error máximo | Tolerancia de la comprobación |
|---|---|---|
| Posición de la Luna | 9,0″ | 15″ |
| Posición del Sol | 32,7″ | 60″ |
| Altura y rumbo de la Luna | 9,2″ | 15″ |
| Giro del disco (los tres ángulos) | 0,044° | 0,1° |
| Libración | 0,060° | 0,1° |
| Salida y puesta (latitudes menores de 62°) | 47 s | 90 s |
| Paso por el meridiano | 0,8 s | 20 s |
| Instante de luna nueva y llena | 68 s | 120 s |

Son cifras de cálculo contra cálculo. Frente al cielo real hay que añadir la refracción de cada noche y el horizonte de cada sitio: un par de minutos en salidas y puestas.

## Dibujo (`luna-render.js`)

- `landMask` convierte las costas en una máscara equirrectangular con un relleno por líneas de barrido propio (no usa canvas, así que también corre en Node).
- `moonMapJob` genera el mapa de brillo de la Luna a partir de `MOON`: unión suave de casquetes, orillas deformadas con ruido, rayos. Tarda unos 0,8 s a 1 024 px de ancho en un portátil, así que trabaja por tandas de pocos milisegundos; hasta que termina, la Luna se ve lisa.
- `moonDisc` pinta la Luna como esfera: ley de Lommel-Seeliger (la luna llena se ve plana, sin oscurecerse hacia el borde), terminador gradual y luz cenicienta. `luna-check.js` comprueba que la fracción de disco que ilumina coincide con la calculada.
- `earthDisc` pinta la Tierra vista desde la Luna píxel a píxel: tierra, mar, hielo y la transición del día a la noche.

## Cómo funciona la aplicación (`luna-app.js`)

- **Estado.** `S.t` (instante), `S.live` (sigue al reloj real), `S.obs` (uno o dos observadores con latitud, longitud y ciudad opcional), más conmutadores de interfaz.
- **Mapas de bits.** La Tierra y la Luna se rasterizan fuera de pantalla y se dibujan con `drawImage`. La Tierra solo se repinta cuando cambia el instante, y a media resolución mientras el tiempo corre; al parar, a resolución completa. Arrastrar al observador no repinta nada: solo gira el mapa de bits de la Luna.
- **Lunas pequeñas.** Son un dibujo vectorial plano de la fase, pre-rasterizado, con una marca en el norte de la Luna. La rejilla está fija en el disco (anillos a altura constante de la Luna), no en la geografía: el patrón no cambia cuando la Tierra rota, son los lugares los que lo atraviesan.
- **Cielo del observador.** La Luna se compone en modo `screen` sobre un color plano que depende de la altura del Sol, así que de día la parte oscura se funde con el azul. Su tamaño sigue al diámetro aparente real. El horizonte se dibuja a escala del disco lunar: solo aparece durante la salida y la puesta.
- **Regla de tiempo.** Una cinta que se desliza bajo una marca fija, con barras para el Sol y la Luna sobre el horizonte del observador. Va en un segundo canvas pequeño dentro del pie.
- **Entrada.** Arrastre y toque sobre el globo, flechas, rueda, regla arrastrable y con teclado, botones de hora y día, reproducción a una hora por segundo.
- **Formato.** `fmt`, `fmtDeg`, `fmtPct`, `fmtLat`, `fmtLon`, `fmtKm`, `clockOf` y las funciones de fecha sobre `Intl` con `es-ES`.
- **Tinte.** `--tint` sigue al cielo del observador activo: violeta de noche, naranja en el crepúsculo, ámbar de día.

### Enlace profundo

Solo letras, dígitos y guiones: `lugar[-vs-lugar][-tAAAAMMDDhhmm][-pasoN]`.

- El lugar es el `id` de una ciudad o unas coordenadas: `n4042w00370` es 40,42° N, 3,70° O.
- `-vs-` añade el segundo observador.
- La `t` lleva el instante en tiempo universal; sin ella, el instante es «ahora».
- `-pasoN` abre el recorrido en ese paso.

Ejemplos: `#madrid`, `#sidney-t202611130930`, `#madrid-vs-elcabo-t202611141456`. El último lugar y el estado de las lunas pequeñas se guardan en `localStorage` (`lml:v1`).

## Decisiones y motivos

- **Cámara fija en la Luna.** El globo no se puede girar libremente: siempre muestra la cara de la Tierra que ve la Luna. Así el disco contiene justo los lugares que tienen la Luna en el cielo, el centro es el punto sublunar y la causa del giro queda a la vista. Con un globo libre, mover al observador y ver girar la Luna sería una correlación sin explicación. La contrapartida es que un lugar de la otra cara no se puede señalar: se marca en el borde como «detrás» y se ofrece ir al instante en que allí sale la Luna.
- **Efemérides reales en lugar de una geometría de juguete.** Lo que se ve se puede comprobar saliendo a la calle. Cuesta unas 250 líneas y una tabla de 120 términos.
- **Comprobación contra un oráculo que no se distribuye.** `luna-ref.json` se generó con astronomy-engine; `luna-check.js` solo lee la tabla y no necesita instalar nada. El laboratorio sigue sin dependencias.
- **Costas de Natural Earth.** Son datos geográficos de dominio público, no una ilustración. Sin costas, mover un punto por una esfera muda no dice nada.
- **Luna dibujada, no fotografiada.** Coherente con los iconos esquemáticos de Órdenes de magnitud y sin material ajeno. Los mares están en su sitio, que es lo que hace falta para ver que el disco gira y no se refleja.
- **Tierra rasterizada por píxel en lugar de polígonos proyectados.** Recortar polígonos esféricos contra el limbo falla cuando el antípoda del centro cae dentro de un continente. Con una máscara y un bucle por píxel no hay casos especiales, y de paso salen gratis el día, la noche y el crepúsculo.
- **Lunas pequeñas vectoriales.** La primera versión reducía el mapa de bits grande: a 12 px un creciente fino desaparecía. El dibujo plano se lee a cualquier fase salvo en luna llena, donde solo queda la marca del norte.
- **Refracción y horas de salida dentro de la v1.** El plan las dejaba fuera, pero hacen falta para resolver el caso «la Luna no está a la vista»: decir cuándo sale y saltar allí.
- **Dos relojes, uno por contexto.** El reloj grande y la regla usan la hora del dispositivo, que es la referencia del visitante. El pie de cada cielo usa la hora del lugar: oficial si es una ciudad, solar media si es un punto cualquiera, porque sin dependencias no hay forma de saber la zona horaria de unas coordenadas.
- **Comparar es siempre en el mismo instante.** Si uno de los dos no tiene la Luna a la vista, se dice. Es la respuesta honesta a «Galicia y Australia»: están a 162° de arco y casi nunca la miran a la vez.
- **El último paso del recorrido busca su instante.** Elige el momento en que el punto sublunar cae sobre el círculo máximo que une Madrid y Ciudad del Cabo: quedan a lados opuestos y el giro es de 180° exactos. Con el paso por el meridiano a secas salían 146°.
- **Segundo canvas para la regla.** El degradado del pie quedaría por encima del canvas de la escena y la apagaría. La escena, que es lo que se anima, sigue en un único canvas.
- **Sin Three.js.** Una esfera en proyección ortográfica son tres productos escalares por píxel.
- **Enlaces solo con letras, dígitos y guiones.** Es lo que el visor de artefactos de Claude deja pasar entre su enlace y `location.hash`; así los enlaces de prueba funcionan igual que los públicos.
- **Sin modo claro real.** Como en Órdenes de magnitud, la escena es oscura por naturaleza; los tokens existen para cumplir con el visor.

## Límites conocidos

- Los eclipses no se representan y el Sol no se dibuja en el cielo del observador.
- Alturas y horas suponen horizonte despejado al nivel del mar y refracción estándar.
- Fechas entre 1900 y 2100.
- La rejilla de lunas pequeñas usa la fase geocéntrica; la de cada observador difiere menos de un punto porcentual.
- La libración se calcula y se aplica al dibujo, pero no se explica.
- La hora oficial de las ciudades depende de la base de zonas horarias del navegador.
- En pantallas apaisadas muy bajas (móvil tumbado) los discos quedan pequeños.
- Hasta que el mapa lunar termina de generarse (menos de un segundo en un portátil, más en un móvil modesto), la Luna se ve sin relieve.

## Ideas pendientes

- «Usar mi ubicación» con la geolocalización del navegador, siempre a petición.
- Comparar dos lugares cada uno en su propio anochecer, con instantes distintos.
- Marcas de las fases principales en la regla.
- El Sol en el cielo del observador y, con él, los eclipses.
- Textura fotográfica opcional (las de la NASA son de dominio público).
- Explicar la libración: por qué a lo largo del mes se ve algo más de media Luna.
- Modo bilingüe: los textos largos están en `luna-data.js`, los de interfaz en la plantilla y en `luna-app.js`.

## Regenerar los archivos derivados

```
node luna-mapa-gen.js ruta/ne_110m_land.geojson 0.12     # costas: Natural Earth 1:110m, tolerancia en grados
npm install astronomy-engine && node luna-ref-gen.js 120   # tabla de referencia
```

Ninguno de los dos pasos hace falta para ensamblar o desplegar.
