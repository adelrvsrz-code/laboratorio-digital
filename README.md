# Laboratorio digital

Colección de exposiciones interactivas sobre ciencia y conocimiento: pequeñas aplicaciones web originales, autocontenidas y pensadas para explorar una idea de forma directa. La primera es **Órdenes de magnitud**, un zoom continuo de la longitud de Planck al universo observable con más de cien objetos a escala. La segunda, **La misma Luna**, muestra por qué todo el planeta ve la misma fase y cada lugar la ve girada de una manera. La tercera, **El espectro**, recorre toda la luz, de la radio a los rayos gamma, y enseña qué parte consigue atravesar la atmósfera.

## Índice de exposiciones

| Prefijo | Exposición | Estado | Ruta pública |
|---|---|---|---|
| `escalas-` | Órdenes de magnitud | v1, funcional; español e inglés | [`/ordenes-de-magnitud/`](https://adelrvsrz-code.github.io/laboratorio-digital/ordenes-de-magnitud/) · [`/en/orders-of-magnitude/`](https://adelrvsrz-code.github.io/laboratorio-digital/en/orders-of-magnitude/) |
| `luna-` | La misma Luna | v1, funcional | [`/la-misma-luna/`](https://adelrvsrz-code.github.io/laboratorio-digital/la-misma-luna/) |
| `espectro-` | El espectro | v1, funcional | [`/el-espectro/`](https://adelrvsrz-code.github.io/laboratorio-digital/el-espectro/) |

El sitio se publica en GitHub Pages, en <https://adelrvsrz-code.github.io/laboratorio-digital/>, desde la rama `main`. Cada exposición vive en su propia ruta y la raíz es la portada del laboratorio, con una entrada por exposición: así los enlaces a una exposición no cambian cuando llega la siguiente. El español es el original y conserva sus rutas; las versiones en inglés van bajo `/en/`, con su portada en `/en/`. Los enlaces antiguos a la raíz con un objeto de Órdenes de magnitud (`…/#tierra`) se redirigen a su exposición.

Próximas candidatas (ver «Hoja de ruta»): historia universal, relatividad.

## Estructura del repositorio

```
README.md                    visión, diseño, arquitectura, flujo (este archivo)
INSTRUCCIONES-PROYECTO.md    texto de las instrucciones del proyecto de Claude
base/                        lo que comparten las exposiciones
  base-fmt.js                formato de números y unidades según el idioma (funciones puras)
  base-idioma.js             enlace de cambio de idioma y aviso; base-idioma.css, sus estilos
  base-build.js              ensamblado común: un HTML por idioma, con sus textos, hreflang y enlace de idioma
  base-cifras.js             extrae las cifras de un texto en cada idioma (solo para las comprobaciones)
  base-check.js              comprobaciones de la base sin navegador
escalas/                     exposición «Órdenes de magnitud»
  escalas-data.js            catálogo de objetos (tamaños, categorías, iconos) y reinos; sin texto
  escalas-textos.es.js       textos en español, el original: interfaz, frases y fichas
  escalas-textos.en.js       su adaptación al inglés, con las mismas claves y las mismas cifras
  escalas-icons.js           generadores de iconos SVG
  escalas-app.js             lógica: distribución, zoom, canvas, fichas, buscador…
  escalas-styles.css         estilos y tokens
  escalas-template.html      esqueleto HTML con marcadores {{CSS}} {{BASE}} {{TEXTOS}} {{DATA}} {{ICONS}} {{APP}}, {{LANG}} {{HREFLANG}} {{IDIOMA}} y {{t:clave}}
  escalas-build.js           ensambla un HTML por idioma
  escalas-check.js           comprobaciones sin navegador: catálogo, iconos, textos, plantilla y cifras entre idiomas
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
espectro/                    exposición «El espectro»
  espectro-data.js           bandas, perfil de la atmósfera, catálogo de fichas, recorrido
  espectro-fis.js            física: conversiones, interpolación del perfil, color (funciones puras)
  espectro-app.js            lógica: formato, estado, dibujo, entrada, ficha, buscador
  espectro-styles.css        estilos y tokens
  espectro-template.html     esqueleto HTML con marcadores {{CSS}} {{FIS}} {{DATA}} {{APP}}
  espectro-build.js          ensambla todo en un único HTML
  espectro-check.js          comprobaciones sin navegador (catálogo, tablas y física, incluido el perfil contra su generador)
  espectro-atm-gen.js        herramienta de desarrollo: calcula el tramo de rayos X y gamma del perfil de la atmósfera
  espectro-NOTAS.md          decisiones de diseño y guía para ampliar
site/                        raíz del sitio publicado: portada en español (index.html) y en inglés (en/index.html)
.github/workflows/pages.yml  comprueba, ensambla y despliega en GitHub Pages en cada push a main
dist/                        HTML ensamblados en local (ignorado por git: el despliegue los regenera)
LICENSE                      licencia del código (MIT)
LICENSE-CONTENIDOS.md        licencia de textos, iconos e ilustraciones (CC BY-SA 4.0)
```

Cada exposición vive en su carpeta con su prefijo, y lo que comparten, en `base/` con el prefijo `base-`. Los archivos llevan el prefijo también en el nombre para que puedan subirse planos a un proyecto de Claude sin colisiones.

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

Texto: frase corta, sin relleno. Nombres propios sin artículo en etiquetas; comparaciones con `×` y `÷`. El original es español de España y el inglés es su adaptación: mismas cifras, no las mismas palabras.

| | Español | Inglés |
|---|---|---|
| Decimales | coma: `3,8` | punto: `3.8` |
| Miles | espacio fino sin salto (U+202F): `12 742` | igual |
| Escala | larga: millón, billón = 10¹², trillón = 10¹⁸ | corta: million, billion = 10⁹, trillion = 10¹² |
| Cifra con palabra | `93 000 millones`, nunca `93 mil millones` | `93 billion` |
| Ortografía | — | británica: metre, colour, centre |

Las cifras calculadas las escribe `base/base-fmt.js` con esas reglas. En los textos escritos a mano los miles se teclean con un espacio normal y la base lo convierte al cargar.

## Arquitectura común de una exposición

1. **Plantilla** (`*-template.html`): esqueleto con `<meta viewport … viewport-fit=cover>`, enlace a Google Fonts y un marcador por archivo fuente: `{{CSS}}`, `{{BASE}}`, `{{TEXTOS}}`, `{{DATA}}`, `{{ICONS}}`, `{{APP}}` en Órdenes de magnitud; `{{CSS}}`, `{{DATA}}`, `{{MAPA}}`, `{{ASTRO}}`, `{{RENDER}}`, `{{APP}}` en La misma Luna; `{{CSS}}`, `{{FIS}}`, `{{DATA}}`, `{{APP}}` en El espectro. En las exposiciones con textos separados, la plantilla no lleva texto: el idioma va en `{{LANG}}`, cada texto fijo en un marcador `{{t:clave}}`, las direcciones de las otras versiones en `{{HREFLANG}}` y el enlace de cambio de idioma en `{{IDIOMA}}`.
2. **Datos** (`*-data.js`): contenido como estructuras JS simples, separadas de la lógica. Es el archivo que más se edita.
3. **Iconos** (`*-icons.js`): generadores SVG propios con un `viewBox` fijo de `0 0 100 100`; incluyen un tipo genérico `image` para incrustar imágenes propias como data URI.
4. **Lógica** (`*-app.js`): un IIFE con las secciones formato, datos, estado, distribución, dibujo, HUD, entrada, paneles, arranque.
5. **Estilos** (`*-styles.css`): tokens arriba, luego escenario, cabecera, pie, paneles, diálogos, varios, media queries.
6. **Build** (`*-build.js`): solo sustituye marcadores; no hay transpilación ni minificado. Salida por defecto en `dist/`; el despliegue le pasa como argumento la ruta pública (`_site/<ruta>/index.html`). Con textos separados, el build usa `base/base-build.js` y ensambla un HTML por idioma: `node <prefijo>-build.js` los deja en `dist/` enlazados entre sí; `--sitio <dir>`, en su ruta pública con `hreflang` (es lo que usa el despliegue); `--suelto [dir]`, sin enlace de idioma, para publicarlos como artefacto de prueba.
7. **Comprobaciones** (`*-check.js`): validaciones del contenido ejecutables con Node sin navegador y sin instalar nada.
8. **Textos** (`*-textos.<idioma>.js`), en las exposiciones ya migradas (hoy, Órdenes de magnitud): todo lo que se lee —interfaz, frases y contenido— en un archivo por idioma, con las mismas claves en todos. Los datos quedan sin texto y la lógica sin cadenas visibles. Las frases con datos dentro son funciones, porque el orden de las palabras cambia con el idioma. El español es el original; cada traducción debe decir las mismas cifras, y la comprobación de la exposición lo exige con `base/base-cifras.js`.
9. **Base compartida** (`base/`): `base-fmt.js` da los formateadores (`fmtLen`, `fmtTime`, `fmtCount`…) con la configuración regional de cada idioma: signo decimal, separador de miles, escala larga o corta, nombres de unidades, singular y plural. Incluye los tres redondeos que usan las exposiciones (`auto`, `fixed`, `sig`). `base-idioma.js` pone el enlace a las otras versiones, que conserva el hash, y lo convierte en aviso cuando el idioma preferido del visitante no es el de la página; no redirige. `base-check.js` comprueba el formato y el extractor de cifras con casos en cada idioma.
10. **Cálculo y rasterizado**, cuando la exposición los necesita (`luna-astro.js`, `luna-render.js`, `espectro-fis.js`): funciones puras, sin DOM, en archivos propios para poder comprobarlas en Node. Si hay un resultado de referencia contra el que medirlas, se guarda como tabla en el repositorio (`luna-ref.json`) y la herramienta que la generó queda fuera de la exposición; si el cálculo de referencia no necesita nada externo, la comprobación lo repite directamente (`espectro-atm-gen.js`).

Rendimiento: lo que se anima de forma continua se dibuja en un único `canvas` con mapas de bits pre-rasterizados (ver `escalas-NOTAS.md`). El DOM queda para la interfaz. Nada de `will-change` en muchos elementos, filtros CSS animados, `backdrop-filter` o `mix-blend-mode` a pantalla completa: en entornos con GPU compartida (el visor de artefactos de Claude, portátiles modestos) dejan mosaicos sin pintar.

Estado y enlaces: el objeto o posición actual va en el hash de la URL (`#tierra`) y la última posición se guarda en `localStorage` dentro de `try/catch`.

## Flujo de trabajo

1. Plan breve antes de construir (objetivo, elemento memorable, datos y fuentes, interacciones, qué queda fuera).
2. Editar los archivos fuente; `node --check` en cada JS; `node <prefijo>-check.js` y, si se toca la base, `node base/base-check.js`.
3. `node <prefijo>-build.js` → `dist/<nombre>.html` (un HTML por idioma en las exposiciones con textos separados).
   Con varios idiomas, la prueba en navegador se hace en todos, y el cambio de idioma y el aviso se prueban sirviendo el sitio en local (`--sitio`).
4. Prueba en navegador sin cabeza (Playwright) a 1366×820 y 390×780: capturas, interacción básica, cero errores de consola, fps aproximados.
5. Publicar como artefacto de Claude para probar en otros dispositivos. La versión pública no se sube a mano: en cada push a `main`, GitHub Actions (`.github/workflows/pages.yml`) repite `node --check` y `<prefijo>-check.js`, ensambla cada exposición en `_site/<ruta>/index.html` (las que tienen varios idiomas, con `--sitio _site`), copia `site/` como raíz y despliega en GitHub Pages. Si una comprobación falla, no se publica nada. Al añadir una exposición: una línea más de build en el workflow y su entrada en las dos portadas.
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

Sin red, el navegador sin cabeza cae en la tipografía de respaldo y los rótulos miden distinto que en producción. Para que las capturas valgan, se sirven Syne e Instrument Sans en local (paquetes `@fontsource/syne` y `@fontsource/instrument-sans`, solo en el entorno de pruebas) respondiendo con `page.route` a la petición de Google Fonts, y se prueba también a escala 125 % (`deviceScaleFactor: 1.25`), que es la habitual en Windows.

## Hoja de ruta

- **Historia universal.** Candidata natural tras Escalas: una línea de tiempo logarítmica del Big Bang a hoy, con la misma mecánica de zoom (el tiempo también abarca decenas de órdenes de magnitud) y «reinos» (cosmológico, geológico, biológico, humano).
- **Relatividad.** Pequeños experimentos: dilatación del tiempo y contracción de longitudes con un deslizador de velocidad, diagramas de Minkowski, el reloj de luz, la paradoja de los gemelos. Elemento memorable por decidir.
- **Bilingüe: español original e inglés.** Un HTML por idioma, generado en el build; el español conserva sus rutas y el inglés va en `/en/…`. Sin selector en caliente ni redirección automática: un enlace que conserva el hash y un aviso discreto cuando el idioma preferido no es el de la página. Hecho: Órdenes de magnitud en los dos idiomas, con portada inglesa en `/en/` y comprobación de que las cifras coinciden. Siguiente: La misma Luna y El espectro con el mismo mecanismo; hasta entonces, la portada inglesa las enlaza en español y lo dice. Cuando haya más exposiciones traducidas convendrá ensamblar también las portadas a partir de una plantilla y sus textos, para que lleven el aviso y no haya que mantenerlas a mano.
- **Mejoras de Escalas.** Más objetos (ver NOTAS), imágenes reales en objetos concretos con el tipo `image`.
- **Mejoras de La misma Luna.** Usar la ubicación del visitante, comparar dos lugares cada uno en su anochecer, el Sol y los eclipses en el cielo del observador (ver NOTAS).
- **Mejoras de El espectro.** Sustituir el tramo infrarrojo del perfil, que es un esquema, por uno derivado de un modelo de transmisión; siglas de la UIT en el dial; la radiación que sale de la Tierra; curvas de cuerpo negro con deslizador de temperatura (ver NOTAS).
- **Base compartida.** Los formateadores de números ya están en `base/base-fmt.js` y los usa Órdenes de magnitud; `fixed` y `sig` reproducen los de La misma Luna y El espectro, que siguen con su copia hasta que migren. Quedan por extraer los tokens y la plantilla de cabecera y pie, duplicados en `escalas-*`, `luna-*` y `espectro-*`.

## Licencia

- **Código** (lógica, estilos, plantillas, scripts de build y comprobación): [MIT](LICENSE). Úsalo, modifícalo y redistribúyelo conservando el aviso de autoría.
- **Contenidos** (textos del catálogo, iconos, ilustraciones, notas y este README): [CC BY-SA 4.0](LICENSE-CONTENIDOS.md). Cita «Laboratorio digital, Adel Rivas Suárez», enlaza al repositorio y publica las adaptaciones con la misma licencia.
- El HTML ensamblado (el de `dist/` en local y el publicado) combina ambas: su código va bajo MIT y sus contenidos bajo CC BY-SA 4.0.
- **Datos de terceros.** Las costas de `luna/luna-mapa.js` proceden de [Natural Earth](https://www.naturalearthdata.com/) (dominio público). Las series astronómicas de `luna/luna-astro.js` son las publicadas por J. Meeus en «Astronomical Algorithms»; la implementación es propia. El tramo de rayos X y gamma del perfil atmosférico de `espectro/` se calcula con los coeficientes de atenuación del aire del NIST (Hubbell y Seltzer) y con la U.S. Standard Atmosphere 1976, ambos de dominio público.
