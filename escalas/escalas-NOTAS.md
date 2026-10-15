# Órdenes de magnitud — notas de la exposición

Zoom continuo de 10⁻³⁵ a 10²⁷ metros con 106 objetos dibujados a escala entre sí. Un único HTML (~120 KB) generado a partir de los archivos `escalas-*`: en local, `dist/ordenes-de-magnitud.html`; publicado en <https://adelrvsrz-code.github.io/laboratorio-digital/ordenes-de-magnitud/>.

## Modelo de datos (`escalas-data.js`)

Cada objeto es una línea del array `OBJECTS`:

```js
{ id: 'luna', n: 'Luna', s: 3.474e6, c: 'ast', sub: 'diámetro',
  i: ['planet', { c1: '#e5e7eb', c2: '#4b5563', craters: 9, seed: 3 }],
  d: 'Nuestro satélite: 3 474 kilómetros, algo más de la cuarta parte de la Tierra. Se aleja de nosotros 3,8 centímetros cada año.' }
```

| Campo | Significado |
|---|---|
| `id` | único, minúsculas y guiones; es el enlace profundo (`#luna`) |
| `n` | nombre tal como se muestra (sin artículo) |
| `s` | tamaño en metros; es lo que define el orden y la escala en pantalla |
| `c` | categoría: `fis`, `qui`, `bio`, `hum`, `geo`, `ast`, `cos` (colores en `CATS`) |
| `sub` | qué mide `s`: «diámetro», «longitud», «altura», «distancia media», «cota superior», «longitud de onda»… |
| `k` | opcional: `'d'` distancia, `'w'` longitud de onda (cambia la frase de la luz y desactiva la comparación de volumen) |
| `i` | icono: `[nombre, opciones]` (ver abajo) |
| `d` | descripción propia, una o dos frases, con el dato más memorable |

El array no necesita estar ordenado: la aplicación ordena por `s` al arrancar. Dos objetos con tamaños casi iguales (Manhattan y Fobos) son intencionados y muestran lo útil que es la comparación.

Añadir un objeto = añadir una línea y ejecutar `node escalas-check.js` y `node escalas-build.js`.

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
- **Formato.** `fmtLen` elige la unidad legible (am, fm, pm, nm, µm, mm, cm, m, km, millones de km, UA, años luz); `sci` da la notación científica con superíndices; `fmtTime` el tiempo que tarda la luz; `fmtTimes`/`fmtMult` las comparaciones con escala larga.
- **Reinos.** Once tramos de `log10(tamaño focal)` con nombre, subtítulo y tinte (`--tint`), que colorean la marca de agua y los acentos.

## Decisiones y motivos

- Canvas en lugar de SVG en DOM para los objetos: la primera versión usaba un elemento por objeto con `will-change`, filtro de resplandor y `backdrop-filter`; en el visor de artefactos de Claude aparecían mosaicos sin pintar. Con canvas y mapas de bits pre-rasterizados se mantiene a 60 fps y no hay capas que puedan quedarse a medias.
- Estantería en lugar de posiciones logarítmicas puras: con posiciones proporcionales al logaritmo del tamaño, los objetos de tamaño parecido (Júpiter y Saturno) se solapaban y las regiones vacías (del núcleo al átomo) dejaban la pantalla en blanco. La regla inferior sí es logarítmica y conserva la sensación de distancia.
- Un tamaño «focal» fijo del 42 % de la altura: deja ver el objeto siguiente como fantasma y dos o tres anteriores enteros.
- Fuentes Syne + Instrument Sans: una pareja con carácter y sin las tipografías de siempre; si las fuentes no cargan, el sistema de respaldo es suficiente.
- Sin modo claro real: una escena espacial es oscura por naturaleza; los tokens existen para cumplir con el visor y poder aclarar los paneles si hiciera falta.

## Límites conocidos

- Los tamaños son valores de referencia redondeados; en partículas elementales es la cota superior experimental y en estrellas gigantes o estructuras cósmicas la estimación más citada (indicado en `sub`).
- Las siluetas de animales y edificios son esquemáticas a propósito. Si se sustituyen por imágenes, respetar el recorte al cuadro para no falsear la escala.
- Al cargar, los iconos aparecen un instante como discos de color hasta que se rasterizan.
- Las fuentes de Google requieren red; sin ella se usa la tipografía del sistema.

## Ideas pendientes

- Modo bilingüe (los textos están todos en `escalas-data.js` y en `REALMS`/`CATS`).
- Más objetos en los huecos grandes: entre 10⁻¹⁴ y 10⁻¹⁰ m (neutrino, escala electrodébil como cota), entre 10¹³ y 10¹⁵ m (cinturón de Kuiper, Voyager 1), más galaxias y cúmulos.
- Modo «cabe en»: arrastrar un objeto sobre otro y ver cuántas veces cabe.
- Compartir la vista actual con enlace (ya existe por objeto: `#id`).
