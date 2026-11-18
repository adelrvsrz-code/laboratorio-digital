# Órdenes de magnitud — notas de la exposición

Zoom continuo de 10⁻³⁵ a 10²⁷ metros con 106 objetos dibujados a escala entre sí. Un HTML autocontenido por idioma (~138 KB cada uno) generado a partir de los archivos `escalas-*` y de la base compartida (`base/`):

| Idioma | En local | Publicado |
|---|---|---|
| Español (original) | `dist/ordenes-de-magnitud.html` | <https://adelrvsrz-code.github.io/laboratorio-digital/ordenes-de-magnitud/> |
| Inglés | `dist/orders-of-magnitude.html` | <https://adelrvsrz-code.github.io/laboratorio-digital/en/orders-of-magnitude/> |

## Modelo de datos (`escalas-data.js`)

El catálogo no lleva texto: solo lo que vale en cualquier idioma. Cada objeto es una línea del array `OBJECTS`:

```js
{ id: 'luna', s: 3.474e6, c: 'ast', i: ['planet', { c1: '#e5e7eb', c2: '#4b5563', craters: 9, seed: 3 }] }
```

| Campo | Significado |
|---|---|
| `id` | único, minúsculas y guiones; es el enlace profundo (`#luna`) y la clave de sus textos. No se traduce |
| `s` | tamaño en metros; es lo que define el orden y la escala en pantalla |
| `c` | categoría: `fis`, `qui`, `bio`, `hum`, `geo`, `ast`, `cos` (colores en `CATS`) |
| `k` | opcional: `'d'` distancia, `'w'` longitud de onda (cambia la frase de la luz y desactiva la comparación de volumen) |
| `i` | icono: `[nombre, opciones]` (ver abajo) |

El array no necesita estar ordenado: la aplicación ordena por `s` al arrancar. Dos objetos con tamaños casi iguales (Manhattan y Fobos) son intencionados y muestran lo útil que es la comparación.

`REALMS` son los once reinos, de menor a mayor: `[límite superior en log10(metros), id, tinte]`.

## Textos (`escalas-textos.<idioma>.js`)

Todo lo que se lee está en un archivo por idioma, con las mismas claves en todos: `escalas-textos.es.js`, que es el original, y `escalas-textos.en.js`, que es su adaptación al inglés (no una traducción palabra por palabra). Cada uno define un objeto `T`:

| Parte | Contenido |
|---|---|
| `lang` | código del idioma; decide también el formato de los números (`base/base-fmt.js`) |
| `ui` | textos fijos: los de la plantilla (marcador `{{t:clave}}`) y los que pide la lógica (`T.ui['clave']`) |
| `f` | frases con datos dentro, como funciones: `luzTarda(tiempo, k)`, `igual(a, b)`, `mayorVol(veces, volumen)`… |
| `cats` | nombre de cada categoría |
| `realms` | nombre y subtítulo de cada reino, por su `id` |
| `obj` | los textos de cada objeto, por su `id` |

```js
'luna': { n: 'Luna', sub: 'diámetro', d: 'Nuestro satélite: 3 474 kilómetros, algo más de la cuarta parte de la Tierra. Se aleja de nosotros 3,8 centímetros cada año.' },
```

| Campo | Significado |
|---|---|
| `n` | nombre tal como se muestra (sin artículo) |
| `sub` | qué mide el tamaño: «diámetro», «longitud», «altura», «distancia media», «cota superior», «longitud de onda»… |
| `d` | descripción propia, una o dos frases, con el dato más memorable |
| `lab` | solo si el icono lleva un rótulo que se traduce (hoy, «1 año» en el año luz) |

Añadir un objeto = una línea en `escalas-data.js` y otra en cada archivo de textos, con el mismo `id`; después, `node escalas-check.js` y `node escalas-build.js`. La comprobación falla si a un idioma le falta un objeto, un campo o una clave, si la plantilla o la lógica piden un texto que no existe, si queda texto dentro del catálogo o si un texto traducido no dice las mismas cifras que el original.

Añadir un texto de interfaz = una clave nueva en `ui` de cada idioma y su marcador en la plantilla. Si la frase lleva datos, va en `f` como función: el orden de las palabras cambia de un idioma a otro y no se puede montar a trozos.

Los números calculados no se escriben en los textos: los da la base en el formato del idioma. Las cifras que van dentro de una descripción sí se escriben a mano, con las convenciones del README: en español, «13 800 millones» y «3,8»; en inglés, «13.8 billion» y «3.8». Los miles se teclean con un espacio normal; al cargar, `prose` lo convierte en espacio fino sin salto para que la cifra no se parta entre dos líneas.

Cada texto debe decir las mismas cifras en todos los idiomas. `escalas-check.js` las extrae con `base/base-cifras.js`, que entiende el formato y la escala de cada idioma (20 000 billones = 20 quadrillion = 2 × 10¹⁶), los números con letra corrientes y las cantidades vagas («decenas de miles de millones» = «tens of billions»), y falla si no coinciden. Si una frase no admite una redacción paralela, se reescribe hasta que la admita.

## Idiomas

- **Rutas.** El español conserva la suya (`/ordenes-de-magnitud/`); el inglés va en `/en/orders-of-magnitude/`. Los `id` no se traducen: `#tierra` abre la Tierra en las dos versiones.
- **Ensamblado.** `node escalas-build.js` deja los dos HTML en `dist/`, enlazados entre sí; `--sitio <dir>` los pone en su ruta pública con dirección canónica y `hreflang` (inglés como `x-default`), que es lo que usa el despliegue; `--suelto [dir]` los ensambla sin enlace de idioma, para publicarlos como artefacto de prueba.
- **Enlace y aviso.** Bajo el subtítulo hay un enlace discreto a la otra versión («English», «Español») que conserva el hash, así que lleva a la misma ficha. No se redirige a nadie: si el idioma preferido del visitante no es el de la página, ese mismo enlace se muestra como aviso («Also available in English», «También en español») y se puede cerrar. Idioma preferido: el último elegido (`localStorage`, clave `lab:idioma`, común a todo el laboratorio) y, si no hay, español para quien lo declara en el navegador en cualquier posición (también catalán, gallego o euskera) e inglés para los demás. El mecanismo es de la base (`base-idioma.js`, `base-idioma.css`).
- **Añadir un idioma.** Un `escalas-textos.<idioma>.js` con las mismas claves; su configuración regional en `base-fmt.js` y sus casos en `base-check.js`; sus tablas de números en `base-cifras.js`; su nombre y sus textos de aviso en `base-build.js`; y su nombre de archivo y su ruta en `escalas-build.js`. Solo idiomas que el autor pueda revisar.
- **Convenciones del inglés.** Ortografía británica (metre, colour, centre, haemoglobin, caesium), punto decimal, miles con espacio fino como en español y escala corta. *Football* es el balón y *football pitch* el campo, como en el inglés británico.

## Iconos (`escalas-icons.js`)

Generadores que devuelven un SVG en un cuadro de 100×100 unidades. **El cuadro completo representa el tamaño `s`**: un objeto de 27 m de longitud debe ocupar los 100 de ancho. Lo que sobresale del cuadro (anillos, resplandores, flagelos) es decorativo y se dibuja gracias a un `viewBox` ampliado al rasterizar (`-60 -60 220 220`).

Tipos reutilizables con opciones: `planet` (gradiente, bandas, manchas, cráteres, anillo, casquete, `extra` con SVG libre), `star`, `blackhole`, `galaxy`, `irregular`, `nebula`, `atom`, `nucleus`, `molecule`, `cage`, `wave`, `particle`, `distance`, `beam`, `asteroid`, `image`. El resto son dibujos únicos (`whale`, `eiffel`, `tardigrade`…).

Para usar una imagen propia: `i: ['image', { src: 'data:image/webp;base64,…', round: true, fit: 'slice' }]`. La imagen debe venir recortada al objeto y, a poder ser, con fondo transparente. Solo imágenes con derechos propios o licencia compatible.

## Cómo funciona la aplicación (`escalas-app.js`)

- **Escala.** El estado es `logS = log10(metros por píxel)`. El objeto «focal» es el que mide `fpx` píxeles (42 % de la altura de la ventana). `logFor(o)` devuelve el `logS` que centra un objeto.
- **Distribución «estantería».** Los objetos se ordenan por tamaño y se colocan de izquierda a derecha, cada uno en una ranura de ancho `clamp(d, 22, 1.15·H)` más un hueco; la cámara se centra en el rango continuo del objeto focal. Los tamaños en pantalla son siempre proporcionales a los reales; las posiciones horizontales no (evitan solapes y huecos vacíos). Los objetos mayores que la pantalla se dibujan como siluetas tenues («fantasmas») y los menores de 11 px como puntos de color con tooltip.
- **Dibujo.** Todo lo que se mueve va en un único `canvas`: estrellas con paralaje y los objetos. Cada icono SVG se convierte una vez en imagen (data URI) y se rasteriza bajo demanda en mapas de bits de tamaño potencia de dos (32–2048 px), con una cola de una rasterización grande por fotograma y una caché con tope de 96 MB. Mientras no existe el mapa, se pinta un disco tenue del color de la categoría.
- **Etiquetas y HUD** son DOM: 106 elementos `.lbl` reposicionados por transform, el panel de ficha, la regla logarítmica (SVG estático con el marcador movido por transform), la lectura de escala y los diálogos.
- **Entrada.** Rueda y trackpad, arrastre horizontal, pellizco, teclado (flechas, +/−, Inicio/Fin, espacio, /, r, c, ?), regla arrastrable, puntos de la regla, buscador, filtros, comparador, recorrido automático con pausa en cada objeto.
- **Formato.** Viene de la base compartida (`base/base-fmt.js`), en el idioma del archivo de textos: `fmtLen` elige la unidad legible (am, fm, pm, nm, µm, mm, cm, m, km, millones de km, UA, años luz); `sci` da la notación científica con superíndices; `fmtTime` el tiempo que tarda la luz; `fmtCount`, `fmtTimes` y `fmtMult` las comparaciones con la escala del idioma (larga en español, corta en inglés). Ante una palabra de escala la cifra lleva como mucho tres significativas, y en español no se mezcla cifra con «mil»: «93 000 millones de años luz», «120 000 billones». `escalas-app.js` no contiene texto visible.
- **Lectura en pantallas estrechas.** Hasta 760 px de ancho el pie va en dos filas: arriba, el reino y los botones de zoom; abajo, la notación científica y la lectura de escala a todo el ancho. La lectura y la cifra de la ficha reciben una clase según su longitud (`m`, `l`) que reduce el cuerpo, y pueden partirse en dos líneas equilibradas; así ninguna se corta.
- **Reinos.** Once tramos de `log10(tamaño focal)` con nombre, subtítulo y tinte (`--tint`), que colorean la marca de agua y los acentos. Los tramos y los tintes están en `REALMS` (`escalas-data.js`); los nombres, en los textos.
- **Ensamblado.** `node escalas-build.js` (ver «Idiomas»). El build inserta los archivos y resuelve en la plantilla el idioma, los textos fijos, las direcciones de las otras versiones y el enlace de cambio de idioma.

## Decisiones y motivos

- Canvas en lugar de SVG en DOM para los objetos: la primera versión usaba un elemento por objeto con `will-change`, filtro de resplandor y `backdrop-filter`; en el visor de artefactos de Claude aparecían mosaicos sin pintar. Con canvas y mapas de bits pre-rasterizados se mantiene a 60 fps y no hay capas que puedan quedarse a medias.
- Estantería en lugar de posiciones logarítmicas puras: con posiciones proporcionales al logaritmo del tamaño, los objetos de tamaño parecido (Júpiter y Saturno) se solapaban y las regiones vacías (del núcleo al átomo) dejaban la pantalla en blanco. La regla inferior sí es logarítmica y conserva la sensación de distancia.
- Un tamaño «focal» fijo del 42 % de la altura: deja ver el objeto siguiente como fantasma y dos o tres anteriores enteros.
- Fuentes Syne + Instrument Sans: una pareja con carácter y sin las tipografías de siempre; si las fuentes no cargan, el sistema de respaldo es suficiente.
- Sin modo claro real: una escena espacial es oscura por naturaleza; los tokens existen para cumplir con el visor y poder aclarar los paneles si hiciera falta.
- Textos fuera del catálogo y de la lógica, en un archivo por idioma. Es el primer paso del plan bilingüe (español original, inglés después). Con los dos idiomas en la misma línea del catálogo cada HTML cargaría con los dos; con un archivo por idioma el build elige uno y el resultado sigue siendo un único archivo en un único idioma. La contrapartida es que un objeto ya no es una sola línea: lo vigila `escalas-check.js`.
- El build resuelve los textos de la plantilla en lugar de rellenarlos al arrancar: el título, la descripción y el atributo `lang` quedan escritos en el HTML, que es lo que leen los buscadores y las vistas previas de enlaces, y no hay parpadeo de textos al cargar.
- Frases como funciones y formato en la base. Montar frases a trozos fija el orden de las palabras del español; y la escala larga o corta (billón frente a *billion*) no es un texto que se traduce sino una regla de formato, así que vive con los separadores y las unidades en `base-fmt.js` y se comprueba con casos en los dos idiomas (`base-check.js`).
- Inglés como adaptación con las mismas cifras, no como traducción literal. El riesgo de traducir una exposición sobre órdenes de magnitud está en la escala: «billones» no es *billions*. Por eso la regla no es de estilo sino de comprobación: cada par de textos debe dar las mismas cifras, y se probó además en el navegador, ficha por ficha (1 590 textos calculados y escritos, iguales en los dos idiomas).
- Aviso en lugar de redirección. Google desaconseja redirigir por el idioma del navegador porque puede dejar versiones sin ver a visitantes y buscadores, y aquí el riesgo sería perder de los resultados el original en español. Además, mucha gente lee español con el navegador en inglés, y un enlace compartido debe abrir lo que se envió. Por eso basta con que el navegador declare español en cualquier posición para no avisar.
- Un HTML por idioma generado en el build, no un selector en caliente: cada archivo sigue siendo único y autocontenido, y lleva su `lang`, su título y su descripción, que es lo que leen buscadores y vistas previas.
- «93 000 millones», no «93 mil millones». La Ortografía de la RAE solo admite mezclar cifra y palabra con sustantivos como millón o billón, no con «mil»; las descripciones ya lo hacían así y las cifras calculadas no. De paso, ante una palabra de escala la cifra se limita a tres significativas («120 000 billones» en vez de «120 208»): los tamaños del catálogo no dan para más.
- Miles sin salto al cargar, no en las fuentes. Un espacio fino sin salto escrito en el archivo es invisible y se pierde con facilidad; se teclea un espacio normal y `prose` lo convierte.
- Pie en dos filas en móvil. Con el reino, los botones y la lectura en una sola fila no cabían cifras como «12 742 km» a 390 px y la lectura se salía de la pantalla. Probado a 320, 360, 390, 414 y 430 px con los 106 objetos en los dos idiomas.
- La separación de textos se hizo sin cambio visible y se comprobó contra la versión anterior en el navegador: textos fijos, las 106 fichas, el buscador, 639 pares del comparador y 27 capturas idénticas píxel a píxel (escritorio, móvil y escritorio a escala 125 %), además de 750 000 valores de los formateadores. La única diferencia es un fallo corregido: con la cifra 1 se leía «1 millones» (Mitocondria ÷ Radiación gamma, o la lectura de escala al pasar por «1 millones de km»); ahora, «1 millón», «mil millones», «1 billón».

## Límites conocidos

- Los tamaños son valores de referencia redondeados; en partículas elementales es la cota superior experimental y en estrellas gigantes o estructuras cósmicas la estimación más citada (indicado en `sub`).
- Las siluetas de animales y edificios son esquemáticas a propósito. Si se sustituyen por imágenes, respetar el recorte al cuadro para no falsear la escala.
- Al cargar, los iconos aparecen un instante como discos de color hasta que se rasterizan.
- Las fuentes de Google requieren red; sin ella se usa la tipografía del sistema.
- Los tamaños que se muestran en años luz salen de convertir un dato en metros y enseñan más cifras de las que tiene: la ficha de Andrómeda dice «221 971 años luz» junto a una descripción que dice «unos 220 000». Se arreglaría guardando esos tamaños como múltiplos del año luz.
- Las portadas del sitio (`site/`) son páginas escritas a mano, una por idioma: llevan el enlace a la otra versión, pero no el aviso.

## Ideas pendientes

- Más objetos en los huecos grandes: entre 10⁻¹⁴ y 10⁻¹⁰ m (neutrino, escala electrodébil como cota), entre 10¹³ y 10¹⁵ m (cinturón de Kuiper, Voyager 1), más galaxias y cúmulos.
- Modo «cabe en»: arrastrar un objeto sobre otro y ver cuántas veces cabe.
- Compartir la vista actual con enlace (ya existe por objeto: `#id`).
