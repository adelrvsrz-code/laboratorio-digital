# Laboratorio digital

Colección de exposiciones interactivas sobre ciencia y conocimiento: pequeñas aplicaciones web originales, autocontenidas y pensadas para explorar una idea de forma directa. La primera es **Órdenes de magnitud**, un zoom continuo de la longitud de Planck al universo observable con más de cien objetos a escala. La segunda, **La misma Luna**, muestra por qué todo el planeta ve la misma fase y cada lugar la ve girada de una manera.

## Índice de exposiciones

| Prefijo | Exposición | Estado | Ruta pública |
|---|---|---|---|
| `escalas-` | Órdenes de magnitud | v1, funcional | [`/ordenes-de-magnitud/`](https://adelrvsrz-code.github.io/laboratorio-digital/ordenes-de-magnitud/) |
| `luna-` | La misma Luna | v1, funcional | [`/la-misma-luna/`](https://adelrvsrz-code.github.io/laboratorio-digital/la-misma-luna/) |

El sitio se publica en GitHub Pages, en <https://adelrvsrz-code.github.io/laboratorio-digital/>, desde la rama `main`. Cada exposición vive en su propia ruta y la raíz es la portada del laboratorio, con una entrada por exposición: así los enlaces a una exposición no cambian cuando llega la siguiente. Los enlaces antiguos a la raíz con un objeto de Órdenes de magnitud (`…/#tierra`) se redirigen a su exposición.

Próximas candidatas (ver «Hoja de ruta»): historia universal, relatividad.

## Estructura del repositorio

```
README.md                    visión, diseño, arquitectura, flujo (este archivo)
INSTRUCCIONES-PROYECTO.md    texto de las instrucciones del proyecto de Claude
escalas/                     exposición «Órdenes de magnitud»
  escalas-data.js            catálogo de objetos (tamaños, textos, iconos)
  escalas-icons.js           generadores de iconos SVG
  escalas-app.js             lógica: distribución, zoom, canvas, fichas, buscador…
  escalas-styles.css         estilos y tokens
  escalas-template.html      esqueleto HTML con marcadores {{CSS}} {{DATA}} {{ICONS}} {{APP}}
  escalas-build.js           ensambla todo en un único HTML
  escalas-check.js           comprobaciones del catálogo sin navegador
  escalas-NOTAS.md           decisiones de diseño y guía para ampliar
luna/                        exposición «La misma Luna»
  luna-data.js               lugares, catálogo para dibujar la Luna, textos del recorrido
  luna-mapa.js               costas de la Tierra (generado por luna-mapa-gen.js)
  luna-astro.js              astronomía: Sol, Luna, giro del disco, salidas y puestas (funciones puras)
  luna-render.js             rasterizadores puros: mapa lunar, disco lunar, globo terrestre
  luna-app.js                lógica: estado, dibujo, entrada, recorrido, enlace profundo
  luna-styles.css            estilos y tokens
  luna-template.html         esqueleto HTML con marcadores {{CSS}} {{DATA}} {{MAPA}} {{ASTRO}} {{RENDER}} {{APP}}
  luna-build.js              ensambla todo en un único HTML
  luna-check.js              comprobaciones sin navegador, incluida la astronomía contra luna-ref.json
  luna-ref.json              tabla de referencia (generada por luna-ref-gen.js; solo para las comprobaciones)
  luna-NOTAS.md              decisiones de diseño y guía para ampliar
site/                        raíz del sitio publicado (portada con una entrada por exposición)
.github/workflows/pages.yml  comprueba, ensambla y despliega en GitHub Pages en cada push a main
dist/                        HTML ensamblados en local (ignorado por git: el despliegue los regenera)
LICENSE                      licencia del código (MIT)
LICENSE-CONTENIDOS.md        licencia de textos, iconos e ilustraciones (CC BY-SA 4.0)
```

Cada exposición vive en su carpeta con su prefijo. Los archivos llevan el prefijo también en el nombre para que puedan subirse planos a un proyecto de Claude sin colisiones.

## Principios

- **Original.** Textos, iconos y código propios. Las ideas se reinterpretan; los contenidos de otros sitios no se copian.
- **Riguroso y honesto.** Toda cifra indica qué es: valor de referencia, cota experimental, estimación o dato discutido. Las aproximaciones se redondean y se dice que lo son.
- **A escala, de verdad.** Cuando algo se muestra «a escala», las proporciones entre lo que aparece en pantalla son reales. Si no pueden serlo, se avisa.
- **Un archivo.** Cada exposición es un HTML autocontenido que abre desde el disco y funciona en cualquier alojamiento estático. Única dependencia externa: Google Fonts (con fuentes de respaldo del sistema).
- **Un elemento memorable.** Cada exposición tiene una idea visual fuerte (en Órdenes de magnitud: el zoom continuo con los reinos que cambian de nombre y de tinte). Todo lo demás es sobrio y sirve para orientarse.

## Sistema de diseño compartido

Tokens (en `:root`, con variantes para `prefers-color-scheme: dark` y `[data-theme]`):

| Token | Valor | Uso |
|---|---|---|
| `--void` | `#070b1c` (oscuro: `#05081a`) | fondo de página |
| `--void2` | `#0d1330` | fondo secundario |
| `--ink` | `#eef0ff` | texto principal |
| `--dust` | `#99a2cc` | texto secundario |
| `--line` | `rgba(255,255,255,.12)` | bordes |
| `--glass` | `rgba(10,14,36,.78)` | fondo de botones |
| `--glass2` | `rgba(13,18,46,.94)` | fondo de paneles y diálogos |
| `--tint` | variable | acento que cambia según el contexto (en Escalas, el reino) |

Tipografía: **Syne** (700/800) para títulos, cifras grandes y marcas de agua; **Instrument Sans** (400–700) para texto e interfaz. Cifras con `font-variant-numeric: tabular-nums`. Sin mayúsculas sostenidas en etiquetas.

Formas: botones redondos (`999px`), paneles y diálogos a `20px`, cajas internas a `10–14px`. Bordes de 1 px con `--line`. Sin `backdrop-filter`.

Colores de categoría (paleta que puede reutilizarse como paleta general): violeta `#b794f6`, cian `#5ee0ff`, verde `#7ee8a2`, ámbar `#ffd166`, azul `#5fb3ff`, naranja `#ff9a6a`, magenta `#f58ef5`.

Texto: español de España, frase corta, sin relleno. Coma decimal, espacio fino (U+202F) para miles, escala larga (millón, mil millones, billón). Nombres propios sin artículo en etiquetas; comparaciones con `×` y `÷`.

## Arquitectura común de una exposición

1. **Plantilla** (`*-template.html`): esqueleto con `<meta viewport … viewport-fit=cover>`, enlace a Google Fonts y un marcador por archivo fuente: `{{CSS}}`, `{{DATA}}`, `{{ICONS}}`, `{{APP}}` en Órdenes de magnitud; `{{CSS}}`, `{{DATA}}`, `{{MAPA}}`, `{{ASTRO}}`, `{{RENDER}}`, `{{APP}}` en La misma Luna.
2. **Datos** (`*-data.js`): contenido como estructuras JS simples, separadas de la lógica. Es el archivo que más se edita.
3. **Iconos** (`*-icons.js`): generadores SVG propios con un `viewBox` fijo de `0 0 100 100`; incluyen un tipo genérico `image` para incrustar imágenes propias como data URI.
4. **Lógica** (`*-app.js`): un IIFE con las secciones formato, datos, estado, distribución, dibujo, HUD, entrada, paneles, arranque.
5. **Estilos** (`*-styles.css`): tokens arriba, luego escenario, cabecera, pie, paneles, diálogos, varios, media queries.
6. **Build** (`*-build.js`): solo concatena; no hay transpilación ni minificado. Salida por defecto en `dist/`; el despliegue le pasa como argumento la ruta pública (`_site/<ruta>/index.html`).
7. **Comprobaciones** (`*-check.js`): validaciones del contenido ejecutables con Node sin navegador y sin instalar nada.
8. **Cálculo y rasterizado**, cuando la exposición los necesita (`luna-astro.js`, `luna-render.js`): funciones puras, sin DOM, en archivos propios para poder comprobarlas en Node. Si hay un resultado de referencia contra el que medirlas, se guarda como tabla en el repositorio (`luna-ref.json`) y la herramienta que la generó queda fuera de la exposición.

Rendimiento: lo que se anima de forma continua se dibuja en un único `canvas` con mapas de bits pre-rasterizados (ver `escalas-NOTAS.md`). El DOM queda para la interfaz. Nada de `will-change` en muchos elementos, filtros CSS animados, `backdrop-filter` o `mix-blend-mode` a pantalla completa: en entornos con GPU compartida (el visor de artefactos de Claude, portátiles modestos) dejan mosaicos sin pintar.

Estado y enlaces: el objeto o posición actual va en el hash de la URL (`#tierra`) y la última posición se guarda en `localStorage` dentro de `try/catch`.

## Flujo de trabajo

1. Plan breve antes de construir (objetivo, elemento memorable, datos y fuentes, interacciones, qué queda fuera).
2. Editar los archivos fuente; `node --check` en cada JS; `node <prefijo>-check.js`.
3. `node <prefijo>-build.js` → `dist/<nombre>.html`.
4. Prueba en navegador sin cabeza (Playwright) a 1366×820 y 390×780: capturas, interacción básica, cero errores de consola, fps aproximados.
5. Publicar como artefacto de Claude para probar en otros dispositivos. La versión pública no se sube a mano: en cada push a `main`, GitHub Actions (`.github/workflows/pages.yml`) repite `node --check` y `<prefijo>-check.js`, ensambla cada exposición en `_site/<ruta>/index.html`, copia `site/` como raíz y despliega en GitHub Pages. Si una comprobación falla, no se publica nada. Al añadir una exposición: una línea más de build en el workflow y su entrada en la portada.
6. Actualizar el índice de este README y las NOTAS de la exposición.

Receta de prueba (Node + Playwright):

```js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), errors = [];
  for (const vp of [{ width: 1366, height: 820 }, { width: 390, height: 780 }]) {
    const p = await b.newPage({ viewport: vp });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto('file:///ruta/dist/archivo.html', { waitUntil: 'load' });
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `captura-${vp.width}.png` });
    await p.close();
  }
  console.log(errors.length ? errors : 'sin errores'); await b.close();
})();
```

## Hoja de ruta

- **Historia universal.** Candidata natural tras Escalas: una línea de tiempo logarítmica del Big Bang a hoy, con la misma mecánica de zoom (el tiempo también abarca decenas de órdenes de magnitud) y «reinos» (cosmológico, geológico, biológico, humano).
- **Relatividad.** Pequeños experimentos: dilatación del tiempo y contracción de longitudes con un deslizador de velocidad, diagramas de Minkowski, el reloj de luz, la paradoja de los gemelos. Elemento memorable por decidir.
- **Mejoras de Escalas.** Modo bilingüe (los textos ya están aislados en `escalas-data.js`), más objetos (ver NOTAS), imágenes reales en objetos concretos con el tipo `image`.
- **Mejoras de La misma Luna.** Usar la ubicación del visitante, comparar dos lugares cada uno en su anochecer, el Sol y los eclipses en el cielo del observador (ver NOTAS).
- **Base compartida.** Ya hay dos exposiciones: toca extraer a un archivo común los tokens, los formateadores de números y la plantilla de cabecera y pie, que hoy están duplicados en `escalas-*` y `luna-*`.

## Licencia

- **Código** (lógica, estilos, plantillas, scripts de build y comprobación): [MIT](LICENSE). Úsalo, modifícalo y redistribúyelo conservando el aviso de autoría.
- **Contenidos** (textos del catálogo, iconos, ilustraciones, notas y este README): [CC BY-SA 4.0](LICENSE-CONTENIDOS.md). Cita «Laboratorio digital, Adel Rivas Suárez», enlaza al repositorio y publica las adaptaciones con la misma licencia.
- El HTML ensamblado (el de `dist/` en local y el publicado) combina ambas: su código va bajo MIT y sus contenidos bajo CC BY-SA 4.0.
- **Datos de terceros.** Las costas de `luna/luna-mapa.js` proceden de [Natural Earth](https://www.naturalearthdata.com/) (dominio público). Las series astronómicas de `luna/luna-astro.js` son las publicadas por J. Meeus en «Astronomical Algorithms»; la implementación es propia.
