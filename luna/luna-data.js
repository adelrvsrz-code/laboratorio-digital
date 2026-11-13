/* Contenido de «La misma Luna»: lugares, catálogo para dibujar la Luna y textos. Es el archivo que más se edita. */

/* Lugares: id (enlace profundo, solo minúsculas y dígitos), nombre, latitud, longitud (este positivo) y zona horaria IANA.
   Coordenadas del centro urbano redondeadas a la centésima de grado. El primero es el lugar inicial. */
const CITIES = [
  { id: 'madrid', n: 'Madrid', lat: 40.42, lon: -3.70, tz: 'Europe/Madrid' },
  { id: 'santiago', n: 'Santiago de Compostela', lat: 42.88, lon: -8.54, tz: 'Europe/Madrid' },
  { id: 'laspalmas', n: 'Las Palmas de Gran Canaria', lat: 28.12, lon: -15.43, tz: 'Atlantic/Canary' },
  { id: 'londres', n: 'Londres', lat: 51.51, lon: -0.13, tz: 'Europe/London' },
  { id: 'reikiavik', n: 'Reikiavik', lat: 64.15, lon: -21.94, tz: 'Atlantic/Reykjavik' },
  { id: 'tromso', n: 'Tromsø', lat: 69.65, lon: 18.96, tz: 'Europe/Oslo' },
  { id: 'moscu', n: 'Moscú', lat: 55.76, lon: 37.62, tz: 'Europe/Moscow' },
  { id: 'elcairo', n: 'El Cairo', lat: 30.04, lon: 31.24, tz: 'Africa/Cairo' },
  { id: 'dakar', n: 'Dakar', lat: 14.69, lon: -17.45, tz: 'Africa/Dakar' },
  { id: 'nairobi', n: 'Nairobi', lat: -1.29, lon: 36.82, tz: 'Africa/Nairobi' },
  { id: 'elcabo', n: 'Ciudad del Cabo', lat: -33.92, lon: 18.42, tz: 'Africa/Johannesburg' },
  { id: 'nuevayork', n: 'Nueva York', lat: 40.71, lon: -74.01, tz: 'America/New_York' },
  { id: 'mexico', n: 'Ciudad de México', lat: 19.43, lon: -99.13, tz: 'America/Mexico_City' },
  { id: 'quito', n: 'Quito', lat: -0.18, lon: -78.47, tz: 'America/Guayaquil' },
  { id: 'lima', n: 'Lima', lat: -12.05, lon: -77.04, tz: 'America/Lima' },
  { id: 'rio', n: 'Río de Janeiro', lat: -22.91, lon: -43.17, tz: 'America/Sao_Paulo' },
  { id: 'buenosaires', n: 'Buenos Aires', lat: -34.60, lon: -58.38, tz: 'America/Argentina/Buenos_Aires' },
  { id: 'ushuaia', n: 'Ushuaia', lat: -54.80, lon: -68.30, tz: 'America/Argentina/Ushuaia' },
  { id: 'losangeles', n: 'Los Ángeles', lat: 34.05, lon: -118.24, tz: 'America/Los_Angeles' },
  { id: 'anchorage', n: 'Anchorage', lat: 61.22, lon: -149.90, tz: 'America/Anchorage' },
  { id: 'honolulu', n: 'Honolulu', lat: 21.31, lon: -157.86, tz: 'Pacific/Honolulu' },
  { id: 'tokio', n: 'Tokio', lat: 35.68, lon: 139.69, tz: 'Asia/Tokyo' },
  { id: 'pekin', n: 'Pekín', lat: 39.90, lon: 116.40, tz: 'Asia/Shanghai' },
  { id: 'bombay', n: 'Bombay', lat: 19.08, lon: 72.88, tz: 'Asia/Kolkata' },
  { id: 'singapur', n: 'Singapur', lat: 1.35, lon: 103.82, tz: 'Asia/Singapore' },
  { id: 'darwin', n: 'Darwin', lat: -12.46, lon: 130.84, tz: 'Australia/Darwin' },
  { id: 'sidney', n: 'Sídney', lat: -33.87, lon: 151.21, tz: 'Australia/Sydney' },
  { id: 'auckland', n: 'Auckland', lat: -36.85, lon: 174.76, tz: 'Pacific/Auckland' },
  { id: 'mcmurdo', n: 'Base McMurdo', lat: -77.85, lon: 166.67, tz: 'Antarctica/McMurdo' }
];

/* Catálogo para dibujar la cara visible de la Luna. Es un dibujo esquemático propio: cada mar se compone
   con uno o varios casquetes circulares colocados en sus coordenadas selenográficas (latitud norte y
   longitud este positivas). Centros de mares, lagos y bahías: nomenclatura de la UAI (Gazetteer of
   Planetary Nomenclature). Radios y brillos están ajustados a ojo para que el conjunto se reconozca. */
const MOON = {
  /* mares: [latitud, longitud, radio en grados, brillo de 0 a 1] */
  seas: [
    /* Océano de las Tormentas y su unión con el Mar de las Lluvias */
    [42, -58, 9, .47], [30, -58, 11.5, .45], [18, -57, 12.5, .44], [6, -52, 11.5, .45], [-5, -47, 8, .47],
    [21, -43, 8.5, .46], [52, -55, 5, .5], [10, -67, 7, .47], [-1, -61, 5.5, .48], [29, -37, 5.5, .47], [38, -42, 5, .48],
    /* Mar de las Lluvias, Bahía del Arcoíris y Pantano de la Podredumbre */
    [33, -16.5, 17, .45], [44.1, -31.5, 4.2, .46], [26.5, .4, 3.2, .5],
    /* Mar de la Serenidad, Lago de los Sueños y Lago de la Muerte */
    [27.5, 18.5, 10.6, .41], [38, 30, 4.6, .52], [45, 27.2, 2.6, .52],
    /* Mar de la Tranquilidad y Bahía de la Aspereza */
    [9, 30.5, 11.2, .40], [15.5, 37.5, 5.5, .42], [2, 25.5, 5, .43], [-4, 27.4, 3.6, .46],
    /* Mar del Néctar, Mar de la Fecundidad y Mar de las Crisis */
    [-15.2, 35.5, 5.6, .46],
    [-3.5, 52, 8.4, .45], [-12, 53, 6, .47], [3, 47.5, 4.6, .47],
    [17, 56.6, 6.5, .40], [17, 61.6, 6.5, .40],
    /* centro del disco: Mar de los Vapores, Bahía Central y Bahía del Hervor */
    [13.3, 3.6, 3.4, .53], [2.4, 1.7, 2.6, .60], [10.9, -8.8, 3.8, .54], [9.5, -15, 3.2, .56],
    /* suroeste: Mar de las Islas, Mar Conocido, Mar de las Nubes, Mar de la Humedad y Pantano de las Epidemias */
    [7.5, -30.9, 7.4, .47], [-1, -27, 4.6, .49], [-10, -23.1, 5.6, .46], [-21.3, -16.6, 10.4, .47], [-24.4, -38.6, 6.6, .43], [-32, -28.2, 3.4, .52],
    /* Mar del Frío */
    [55, -36, 4, .53], [57, -23, 4, .53], [58, -10, 3.8, .53], [57, 2, 4, .53], [56, 14, 4, .53], [55, 26, 4.4, .53], [53, 37, 3.8, .54],
    /* limbo oriental: Humboldt, Marginal, Smyth, de las Olas, de la Espuma y Austral */
    [56.8, 81.5, 4.4, .5], [13.3, 86.1, 5.2, .5], [1.3, 87.5, 5.4, .48], [6.8, 68.4, 3, .5], [1.1, 65.1, 2.2, .5], [-38.9, 93, 7.5, .56],
    /* limbo occidental: Mar Oriental y Lago de la Primavera */
    [-19.4, -92.8, 4.6, .5], [-16.5, -86.1, 3, .55]
  ],
  /* cráteres de fondo oscuro: Platón, Grimaldi, Endimión, Riccioli y Schickard */
  floors: [[51.6, -9.4, 1.7, .42], [-5.4, -68.4, 2.8, .40], [53.9, 57, 2.1, .44], [-3.3, -74.6, 1.6, .46], [-44.3, -55.3, 2.6, .58]],
  /* manchas brillantes: [latitud, longitud, radio, ganancia]. Aristarco, Proclo, Langrenus, Menelao, Censorino, Dionisio, Stevinus, Tales, Eratóstenes y Arquímedes */
  spots: [[23.7, -47.5, 1.3, .38], [16.1, 46.8, 1, .3], [-8.9, 61.1, 2, .18], [16.3, 16, .8, .25], [-.4, 32.7, .7, .3], [2.8, 17.3, .7, .22], [-32.5, 54.2, 1.2, .2], [61.8, 50.3, 1, .2], [14.5, -11.3, 1, .12], [29.7, -4, 1.3, .1]],
  /* sistemas de rayos: [latitud, longitud, halo, alcance, brazos, semilla, ganancia]. Tycho, Copérnico, Kepler, Byrgius, Anaxágoras y Furnerius */
  rays: [[-43.3, -11.4, 1.5, 42, 13, 7, .26], [9.6, -20.1, 1.7, 13, 10, 3, .22], [8.1, -38, 1.0, 7, 8, 5, .2], [-24.5, -63.7, .9, 8, 6, 9, .18], [73.5, -10.2, 1.0, 11, 7, 2, .18], [-33.5, 59, .9, 8, 6, 4, .16]],
  /* accidentes que se rotulan junto al disco cuando están iluminados: uno al este, uno al sur y uno al oeste */
  labels: [
    { n: 'Mar de las Crisis', lat: 17, lon: 59.1 },
    { n: 'Tycho', lat: -43.3, lon: -11.4 },
    { n: 'Grimaldi', lat: -5.4, lon: -68.4 }
  ]
};

/* Fases: nombre según la elongación (diferencia de longitud eclíptica Luna − Sol, en grados).
   Las cuatro fases principales ocupan ±6°, medio día a cada lado del instante exacto. */
const PHASES = [
  [6, 'Luna nueva'], [84, 'Creciente'], [96, 'Cuarto creciente'], [174, 'Gibosa creciente'],
  [186, 'Luna llena'], [264, 'Gibosa menguante'], [276, 'Cuarto menguante'], [354, 'Menguante'], [360, 'Luna nueva']
];
const WINDS = ['norte', 'noreste', 'este', 'sureste', 'sur', 'suroeste', 'oeste', 'noroeste'];

/* Recorrido guiado. `go` es la acción que prepara la escena (definidas en luna-app.js);
   `demo` es el texto del botón que repite la animación del paso, si la tiene. */
const TOUR = [
  { t: 'La misma fase',
    d: 'El globo es la Tierra tal como se ve desde la Luna en este instante. Todos los lugares de ese disco tienen la Luna en su cielo, y todos la ven con la misma parte iluminada: la fase depende de cómo se colocan el Sol, la Tierra y la Luna, no de dónde estés.',
    go: 'intro' },
  { t: 'Cada cual con su vertical',
    d: 'Cada persona llama «arriba» a la dirección que se aleja del centro de la Tierra. Vistas desde la Luna, esas verticales salen del globo como las púas de un erizo. La otra ventana es el cielo del observador, con su vertical apuntando a lo alto.',
    go: 'vertical' },
  { t: 'Gira, pero no cambia',
    d: 'Si el observador da una vuelta alrededor del centro del globo, la Luna da una vuelta completa en su cielo y la fase no se mueve. Si se aleja del centro, la Luna baja hacia el horizonte sin girar. La distancia al centro decide la altura; la dirección, el giro.',
    go: 'orbit', demo: 'Repetir la vuelta' },
  { t: 'También gira con las horas',
    d: 'La Tierra rota bajo la Luna. Un lugar entra por la izquierda del globo cuando la Luna sale, lo cruza y se va por la derecha cuando se pone. Por el camino cambia su posición respecto al centro, así que la Luna va girando mientras cruza el cielo.',
    go: 'night', demo: 'Repetir desde la salida' },
  { t: 'La frontera no es el ecuador',
    d: 'El centro del globo es el punto sublunar: el lugar que tiene la Luna en el cénit. Quien queda a un lado de él y quien queda al otro la ven girada media vuelta entre sí, como aquí Madrid y Ciudad del Cabo. Ese punto nunca se aleja más de unos 28,6° del ecuador, así que entre los trópicos la Luna se ve de una manera o de la otra según el día.',
    go: 'border' }
];
