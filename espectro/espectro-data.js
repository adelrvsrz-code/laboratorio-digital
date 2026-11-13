/* Contenido de «El espectro»: bandas, atmósfera, catálogo y recorrido. Textos propios.
   Las frecuencias se escriben en la unidad natural de cada zona con los conversores de FIS. */
const { m: _m, cm: _cm, mm: _mm, um: _um, nm: _nm, eV: _eV, keV: _keV, MeV: _MeV, GeV: _GeV, TeV: _TeV, PeV: _PeV, wien: _wien } = FIS;

/* Bandas, de menor a mayor frecuencia. `hasta` es la frontera superior en hercios.
   Las fronteras son un convenio: cambian según el campo y la fuente. */
const BANDS = [
  { id: 'radio', n: 'Ondas de radio', sub: 'De miles de kilómetros a un metro: rodean montañas y rebotan en la ionosfera', col: '#5fb3ff', hasta: _m(1) },
  { id: 'micro', n: 'Microondas', sub: 'De un metro a un milímetro: móviles, radares, satélites y el eco del Big Bang', col: '#5ee0ff', hasta: _mm(1) },
  { id: 'ir', n: 'Infrarrojo', sub: 'La luz que emite todo lo que está templado', col: '#ff9a6a', hasta: _nm(750) },
  { id: 'vis', n: 'Luz visible', sub: 'Menos de una octava: lo único que ven nuestros ojos', col: '#ffd166', hasta: _nm(380) },
  { id: 'uv', n: 'Ultravioleta', sub: 'Broncea, quema y, a partir de cierta energía, arranca electrones', col: '#b794f6', hasta: _nm(10) },
  { id: 'x', n: 'Rayos X', sub: 'Atraviesan la carne y dejan la sombra del hueso', col: '#f58ef5', hasta: _nm(0.01) },
  { id: 'gamma', n: 'Rayos gamma', sub: 'Núcleos, antimateria y los sucesos más violentos del cosmos', col: '#7ee8a2', hasta: Infinity },
];

/* Atmósfera. `perfil`: pares [longitud de onda en metros, altitud en km] a la que se
   queda la radiación que llega del espacio en vertical: donde lo que queda por encima
   suma una profundidad óptica de 1 (el haz se ha reducido a 1/e). 0 = alcanza el suelo.
   Se interpola en el logaritmo de la longitud de onda. No todo el perfil vale lo mismo:
   - CALCULADO (rayos X y gamma, hasta 1,24 nm): sale de espectro-atm-gen.js, con los
     coeficientes de atenuación del aire del NIST y la U.S. Standard Atmosphere 1976.
     espectro-check.js lo vuelve a calcular y compara.
   - ESTIMADO (de 1,24 nm a 310 nm): compuesto a partir de secciones eficaces típicas
     del nitrógeno, el oxígeno y el ozono y de sus columnas en una atmósfera media.
     Reproduce la curva clásica de «altitud de profundidad óptica unidad», con ±10 km.
   - ESQUEMA (infrarrojo, milimétricas y radio): sitúa las ventanas y las bandas opacas,
     pero la altitud es orientativa. Depende de la humedad y, sobre todo, de con cuánta
     resolución se mire: entre línea y línea de una banda el aire es mucho más claro.
   - La radio larga se lleva al techo: la ionosfera la refleja, más arriba cuanto menor
     es la frecuencia, y el corte real oscila entre unos 3 y 15 MHz. */
const ATMOS = {
  techo: 500,
  perfil: [
    /* calculado */
    [1e-22, 21], [1.24e-15, 21], [1.24e-14, 20], [6.2e-14, 20], [1.24e-13, 21], [2.48e-13, 23], [6.2e-13, 26], [1.24e-12, 28],
    [2.48e-12, 30], [6.2e-12, 33], [1.24e-11, 34], [2.48e-11, 36], [4.13e-11, 40], [6.2e-11, 46], [1e-10, 57], [1.55e-10, 66],
    [2.48e-10, 75], [4.13e-10, 83], [6.2e-10, 90], [1.24e-9, 101],
    /* estimado: rayos X blandos y ultravioleta extremo (ionización de N₂, O₂ y O) */
    [2.5e-9, 106], [5e-9, 110], [1e-8, 118], [2e-8, 145], [3e-8, 160], [6e-8, 180], [9e-8, 135], [1e-7, 112], [1.1e-7, 105],
    /* estimado: oxígeno molecular, con la rendija de Lyman-alfa */
    [1.2e-7, 92], [1.216e-7, 76], [1.23e-7, 92], [1.3e-7, 100], [1.35e-7, 113], [1.45e-7, 115], [1.6e-7, 109], [1.7e-7, 101],
    [1.75e-7, 90], [1.8e-7, 80], [1.9e-7, 50], [2e-7, 30],
    /* estimado: ozono */
    [2.1e-7, 32], [2.2e-7, 36], [2.3e-7, 41], [2.55e-7, 45], [2.8e-7, 40], [2.9e-7, 35], [3e-7, 26], [3.05e-7, 21], [3.1e-7, 0],
    /* esquema: infrarrojo cercano y medio */
    [1.3e-6, 0], [1.38e-6, 7], [1.46e-6, 0], [1.78e-6, 0], [1.87e-6, 7], [1.98e-6, 0], [2.45e-6, 0], [2.7e-6, 10], [3e-6, 2], [3.4e-6, 0],
    [4.15e-6, 0], [4.3e-6, 30], [4.5e-6, 0], [5e-6, 0], [5.6e-6, 5], [6.3e-6, 10], [7.4e-6, 4], [8e-6, 0],
    [1.33e-5, 0], [1.4e-5, 10], [1.5e-5, 30], [1.6e-5, 12], [1.75e-5, 7], [2e-5, 5], [3e-5, 9],
    /* esquema: infrarrojo lejano y submilimétricas */
    [5e-5, 10], [2e-4, 10], [3e-4, 8], [3.5e-4, 5], [4e-4, 7], [4.5e-4, 5], [6e-4, 6], [8.5e-4, 2], [1.1e-3, 1], [1.3e-3, 0],
    /* esquema: líneas del agua (183 GHz) y del oxígeno (119 y 60 GHz) */
    [1.5e-3, 0], [1.64e-3, 6], [1.8e-3, 0], [2.45e-3, 0], [2.52e-3, 4], [2.6e-3, 0], [4.3e-3, 0], [4.7e-3, 8], [5e-3, 15], [5.3e-3, 8], [5.8e-3, 0],
    /* esquema: ionosfera */
    [12, 0], [20, 150], [30, 300], [100, 450], [1e3, 500], [1e9, 500],
  ],
  /* Qué la detiene, por tramos de longitud de onda (m). `fin`: 'abs' absorbida, 'suelo' pasa, 'rebote' reflejada. */
  causas: [
    { hasta: 6e-14, fin: 'abs', n: 'el propio aire', d: 'Al pasar junto a un núcleo del aire, el fotón se convierte en un electrón y un positrón que desatan una cascada de partículas. Abajo llega la cascada, no el fotón.' },
    { hasta: 2.5e-11, fin: 'abs', n: 'los electrones del aire', d: 'El fotón choca con los electrones del aire y pierde energía en cada rebote, hasta que algún átomo lo absorbe.' },
    { hasta: 1.24e-9, fin: 'abs', n: 'los átomos del aire', d: 'Cada fotón arranca un electrón interno de un átomo de nitrógeno, oxígeno o argón y desaparece. Basta el poco aire que queda por encima.' },
    { hasta: 1.03e-7, fin: 'abs', n: 'la termosfera', d: 'Arranca electrones a los átomos y moléculas más altos de la atmósfera. Esa absorción es la que crea la ionosfera.' },
    { hasta: 2.05e-7, fin: 'abs', n: 'el oxígeno', d: 'Las moléculas de oxígeno absorben el ultravioleta lejano y se rompen en dos átomos; de esos átomos sueltos nace el ozono.' },
    { hasta: 3.1e-7, fin: 'abs', n: 'el ozono', d: 'El ozono de la estratosfera absorbe casi todo el ultravioleta de onda corta. Para las longitudes de onda que mejor absorbe basta el poco que hay por encima de los 40 kilómetros.' },
    { hasta: 1.3e-6, fin: 'suelo', n: 'ventana óptica', d: 'El aire es casi transparente: por aquí pasan la luz visible y el infrarrojo más cercano.' },
    { hasta: 8e-6, fin: 'abs', n: 'el vapor de agua y el CO₂', d: 'Bandas opacas del vapor de agua y del dióxido de carbono, separadas por ventanas estrechas.' },
    { hasta: 1.33e-5, fin: 'suelo', n: 'ventana infrarroja', d: 'Entre 8 y 13 micras el aire vuelve a ser transparente. Por aquí se enfría la Tierra hacia el espacio.' },
    { hasta: 1.9e-5, fin: 'abs', n: 'el CO₂', d: 'La gran banda del dióxido de carbono, centrada en 15 micras. Como el gas está bien mezclado, absorbe hasta en la estratosfera.' },
    { hasta: 1.2e-3, fin: 'abs', n: 'el vapor de agua', d: 'El vapor de agua de la troposfera lo absorbe casi todo. Solo se ve algo desde montañas muy altas y secas, aviones o globos.' },
    { hasta: 7e-3, fin: 'abs', n: 'el oxígeno y el vapor de agua', d: 'Ventanas milimétricas interrumpidas por líneas del oxígeno y del vapor de agua.' },
    { hasta: 12, fin: 'suelo', n: 'ventana de radio', d: 'De unos milímetros a la decena de metros la atmósfera es transparente, con nubes o sin ellas, de día y de noche.' },
    { hasta: Infinity, fin: 'rebote', n: 'la ionosfera', d: 'Los electrones libres de la ionosfera reflejan estas ondas: las del cosmos vuelven al espacio y las nuestras, al suelo.' },
  ],
  /* Altitudes de referencia que se rotulan en el eje vertical. */
  marcas: [[5, ''], [15, ''], [50, ''], [100, 'línea de Kármán'], [200, ''], [400, 'Estación Espacial']],
};

const CATS = {
  com: { n: 'Comunicaciones', col: '#5fb3ff' },
  cot: { n: 'Técnica y vida cotidiana', col: '#ffd166' },
  nat: { n: 'Naturaleza y cosmos', col: '#ff9a6a' },
  med: { n: 'Medicina y laboratorio', col: '#f58ef5' },
  obs: { n: 'Observatorios', col: '#5ee0ff' },
};

/* Nivel de certeza de cada cifra. */
const CERT = {
  ref: { n: 'valor de referencia', d: 'Medido o definido con precisión.' },
  conv: { n: 'convenio', d: 'Banda asignada por norma o frontera acordada; cambia según el país y la época.' },
  est: { n: 'estimación', d: 'Valor o intervalo aproximado.' },
  rec: { n: 'récord en movimiento', d: 'El mayor valor publicado cuando se escribió esta ficha; puede haberse superado.' },
};

/* Catálogo. f: frecuencia en Hz o intervalo [mín, máx]. c: categoría. z: certeza.
   p: prioridad del rótulo (1 se ve antes). sig: cifras significativas al mostrar.
   Observatorios: alt = altitud en km o 'esp' (en el espacio); g = dibujo. */
const ITEMS = [
  /* radio */
  { id: 'schumann', n: 'Resonancias de Schumann', f: 7.83, c: 'nat', z: 'est', p: 1,
    d: 'Los rayos de todo el planeta hacen vibrar la cavidad que queda entre el suelo y la ionosfera. La nota más grave ronda los 7,83 hercios: una onda casi tan larga como la vuelta a la Tierra.' },
  { id: 'red-electrica', n: 'Red eléctrica', f: 50, c: 'cot', z: 'ref', p: 2,
    d: 'La corriente alterna europea completa 50 ciclos por segundo. Apenas radia, pero su onda mediría unos 6 000 kilómetros, algo más que de Madrid a Nueva York.' },
  { id: 'submarinos', n: 'Mensajes a submarinos', f: 76, c: 'com', z: 'ref', p: 2,
    d: 'Las frecuencias extremadamente bajas penetran más de cien metros en el agua salada. Entre 1989 y 2004, Estados Unidos avisaba así a sus submarinos sumergidos, tan despacio que, según se contó, un código de tres letras tardaba un cuarto de hora.' },
  { id: 'hora-dcf77', n: 'Hora por radio', f: 77.5e3, c: 'com', z: 'ref', p: 2,
    d: 'El emisor DCF77 de Mainflingen, cerca de Fráncfort, difunde la hora oficial alemana a 77,5 kilohercios. Los relojes radiocontrolados de media Europa la escuchan de madrugada para ponerse en hora.' },
  { id: 'onda-media', n: 'Radio AM', f: [526.5e3, 1606.5e3], sig: 5, c: 'com', z: 'conv', p: 1,
    d: 'De noche desaparece la capa baja de la ionosfera que absorbe la onda media; la señal rebota más arriba y una emisora puede oírse a más de mil kilómetros.' },
  { id: 'onda-corta', n: 'Onda corta', f: [3e6, 30e6], c: 'com', z: 'conv', p: 2,
    d: 'Rebota entre la ionosfera y el suelo y puede dar la vuelta al mundo. Radioaficionados y emisoras internacionales alcanzan con ella otros continentes sin satélites ni cables.' },
  { id: 'corte-ionosfera', n: 'Espejo de la ionosfera', f: 1e7, c: 'nat', z: 'est', p: 1,
    d: 'Por debajo de unos 10 megahercios, según la hora y la actividad del Sol, la ionosfera se comporta como un espejo. Para ver el cosmos en ondas más largas hay que salir de la Tierra.' },
  { id: 'radio-fm', n: 'Radio FM', f: [87.5e6, 108e6], c: 'com', z: 'conv', p: 1,
    d: 'Ondas de unos tres metros que ya no rebotan en la ionosfera: llegan hasta donde alcanza la vista desde la antena y poco más.' },
  /* microondas */
  { id: 'tdt', n: 'Televisión terrestre', f: [470e6, 694e6], c: 'com', z: 'conv', p: 2,
    d: 'La televisión digital ocupa en España lo que queda de la banda de UHF después de ceder a la telefonía móvil los tramos de 800 y de 700 megahercios.' },
  { id: 'movil', n: 'Telefonía móvil', f: [694e6, 3.8e9], c: 'com', z: 'conv', p: 1,
    d: 'En España, de la banda de 700 megahercios a la de 3,5 gigahercios, más una milimétrica en 26 gigahercios. Las frecuencias bajas llegan lejos y atraviesan paredes; las altas llevan más datos a menos distancia.' },
  { id: 'hidrogeno-21', n: 'Línea del hidrógeno', f: 1420.405751768e6, sig: 7, c: 'nat', z: 'ref', p: 1,
    d: 'Un átomo de hidrógeno aislado tarda unos diez millones de años en emitir esta onda de 21 centímetros, pero hay tanto hidrógeno que con ella se dibujaron los brazos de la Vía Láctea.' },
  { id: 'gps', n: 'GPS', f: 1575.42e6, sig: 6, c: 'com', z: 'ref', p: 1,
    d: 'Cada satélite emite su hora desde 20 200 kilómetros de altura. La señal llega más débil que el ruido de fondo y el receptor la rescata porque conoce de antemano su código.' },
  { id: 'wifi', n: 'Wifi y Bluetooth', f: [2.4e9, 2.4835e9], sig: 5, c: 'cot', z: 'conv', p: 2,
    d: 'Una banda de uso libre en casi todo el mundo. La comparten el wifi, el Bluetooth y los hornos de microondas, que por eso a veces estropean la conexión.' },
  { id: 'horno', n: 'Horno de microondas', f: 2.45e9, c: 'cot', z: 'ref', p: 1,
    d: 'Sacude las moléculas de agua miles de millones de veces por segundo y el rozamiento calienta la comida. No es una frecuencia especial del agua: se eligió una banda libre que penetra unos centímetros.' },
  { id: 'radar-lluvia', n: 'Radar meteorológico', f: 5.6e9, c: 'cot', z: 'ref', p: 3,
    d: 'Los radares de la red de AEMET, de banda C, emiten pulsos a unos 5,6 gigahercios y escuchan el eco de las gotas: cuanto mayores son, más señal devuelven. Comparten banda con el wifi de 5 gigahercios, que por norma debe callar si detecta uno.' },
  { id: 'voyager', n: 'Voyager 1', f: 8.4e9, c: 'com', z: 'est', p: 2,
    d: 'Emite con unos 20 vatios desde un día luz de distancia, 25 900 millones de kilómetros: cruza esa marca el 18 de noviembre de 2026. Llega tan débil que hacen falta antenas de 70 metros, como la de Robledo de Chavela, para recogerla.' },
  { id: 'tv-satelite', n: 'Televisión por satélite', f: [10.7e9, 12.75e9], sig: 4, c: 'com', z: 'conv', p: 2,
    d: 'Los satélites geoestacionarios emiten hacia las parabólicas domésticas en esta banda. Una lluvia intensa absorbe parte de la señal y puede cortarla.' },
  { id: 'escaner', n: 'Escáner de aeropuerto', f: [24e9, 30e9], c: 'cot', z: 'est', p: 3,
    d: 'Los más extendidos trabajan entre 24 y 30 gigahercios; otros, entre 70 y 80. Sus ondas atraviesan la ropa y rebotan en la piel y en lo que haya oculto. No ionizan: cada fotón lleva cientos de millones de veces menos energía que el de una radiografía.' },
  { id: 'oxigeno-60', n: 'Muro del oxígeno', f: 60e9, c: 'nat', z: 'est', p: 2,
    d: 'El oxígeno del aire absorbe con fuerza alrededor de 60 gigahercios y la señal muere en pocos kilómetros. Se aprovecha para enlaces de corto alcance que nadie puede escuchar de lejos.' },
  { id: 'radar-coche', n: 'Radar del coche', f: [76e9, 81e9], c: 'cot', z: 'conv', p: 3,
    d: 'Ondas de cuatro milímetros con las que el control de crucero mide la distancia y la velocidad del vehículo que va delante.' },
  { id: 'fondo-cosmico', n: 'Fondo cósmico de microondas', f: 160.2e9, sig: 4, c: 'nat', z: 'ref', p: 1,
    d: 'La luz más antigua del universo, emitida cuando tenía unos 380 000 años y enfriada por la expansión hasta 2,725 kelvin. Su máximo cae aquí si se mide por frecuencia; por longitud de onda, en 1,06 milímetros.' },
  /* infrarrojo */
  { id: 'terahercios', n: 'Terahercios', f: [0.3e12, 3e12], c: 'cot', z: 'conv', p: 2,
    d: 'La franja difícil: demasiado rápida para la electrónica y demasiado lenta para la óptica. Empieza a usarse para inspeccionar materiales sin dañarlos.' },
  { id: 'co2', n: 'Banda del CO₂', f: _um(15), c: 'nat', z: 'ref', p: 1,
    d: 'La molécula de dióxido de carbono se dobla a esta frecuencia y atrapa parte del calor que la Tierra emite hacia el espacio. Es la banda central del efecto invernadero.' },
  { id: 'cuerpo', n: 'Tu cuerpo', f: _m(_wien(310)), c: 'nat', z: 'est', p: 1,
    d: 'A 37 grados brillas sobre todo en torno a las 9 micras. Las cámaras térmicas ven esa luz; los ojos, no.' },
  { id: 'fibra', n: 'Fibra óptica', f: _nm(1550), c: 'com', z: 'ref', p: 1,
    d: 'El vidrio de sílice es más transparente a 1 550 nanómetros que a cualquier otra longitud de onda: pierde la mitad de la luz cada quince kilómetros. Casi todo internet viaja por aquí.' },
  { id: 'mando', n: 'Mando a distancia', f: _nm(940), c: 'cot', z: 'est', p: 2,
    d: 'Un led parpadea a unos 940 nanómetros, justo fuera de lo visible. La cámara de muchos móviles sí lo capta: apunta el mando hacia ella y pulsa un botón.' },
  /* visible */
  { id: 'h-alfa', n: 'Rojo del hidrógeno', f: _nm(656.28), sig: 4, c: 'nat', z: 'ref', p: 2,
    d: 'La línea H-alfa, a 656,3 nanómetros. Tiñe de rojo las nebulosas donde nacen estrellas y las protuberancias que asoman por el borde del Sol.' },
  { id: 'sodio', n: 'Amarillo del sodio', f: _nm(589.3), sig: 4, c: 'cot', z: 'ref', p: 2,
    d: 'El color de las farolas de vapor de sodio y de la sal en una llama. En realidad son dos líneas casi pegadas, a 589,0 y 589,6 nanómetros.' },
  { id: 'ojo', n: 'Máximo del ojo', f: 540e12, c: 'nat', z: 'ref', p: 1,
    d: 'El ojo adaptado a la luz del día responde mejor al verde de 555 nanómetros. La candela, unidad de intensidad luminosa, se define justo a esta frecuencia: 540 billones de hercios.' },
  { id: 'sol', n: 'Máximo del Sol', f: _m(_wien(5772)), c: 'nat', z: 'est', p: 1,
    d: 'La superficie del Sol, a 5 772 kelvin, emite su máximo por longitud de onda cerca de los 500 nanómetros. Los ojos evolucionaron para aprovechar la luz que más abunda bajo esta atmósfera.' },
  { id: 'led-azul', n: 'Led azul', f: _nm(450), c: 'cot', z: 'est', p: 2,
    d: 'El led azul de nitruro de galio, premio Nobel de Física de 2014, hizo posible la luz blanca de bajo consumo: un fósforo convierte parte del azul en amarillo y la mezcla se ve blanca.' },
  /* ultravioleta */
  { id: 'uvb', n: 'Ultravioleta B', f: [_nm(315), _nm(280)], c: 'nat', z: 'conv', p: 1,
    d: 'Quema la piel y daña el ADN, pero también fabrica la vitamina D. La capa de ozono detiene la mayor parte antes de que llegue al suelo.' },
  { id: 'germicida', n: 'Lámpara germicida', f: _nm(253.7), sig: 4, c: 'med', z: 'ref', p: 2,
    d: 'Una línea del vapor de mercurio. El ADN absorbe con fuerza cerca de aquí y los microbios expuestos dejan de poder reproducirse.' },
  { id: 'lyman-alfa', n: 'Lyman-alfa', f: _nm(121.567), sig: 5, c: 'nat', z: 'ref', p: 2,
    d: 'La línea más intensa del hidrógeno. La atmósfera la detiene a unos 75 kilómetros, pero en los cuásares lejanos la expansión del universo la estira hasta el visible, y en los más remotos, hasta el infrarrojo.' },
  { id: 'ionizante', n: 'Umbral del hidrógeno', f: _eV(13.6), c: 'nat', z: 'ref', p: 1,
    d: 'Con 13,6 electronvoltios un fotón arranca el electrón del hidrógeno. A partir de esta zona la radiación se llama ionizante: rompe enlaces químicos y daña los tejidos.' },
  { id: 'litografia', n: 'Litografía de chips', f: _nm(13.5), c: 'cot', z: 'ref', p: 1,
    d: 'Los chips más avanzados se dibujan con luz de 13,5 nanómetros, que nace al disparar un láser contra gotas de estaño. Ninguna lente la deja pasar: toda la óptica son espejos en el vacío.' },
  /* rayos X y gamma */
  { id: 'cristalografia', n: 'Rayos X del cobre', f: _keV(8.05), c: 'med', z: 'ref', p: 2,
    d: 'Su longitud de onda, 0,154 nanómetros, es parecida a la distancia entre átomos, y por eso los cristales los desvían en patrones que delatan su estructura. Con rayos X desviados por fibras de ADN se descubrió su doble hélice.' },
  { id: 'radiografia', n: 'Radiografía', f: [_keV(20), _keV(150)], c: 'med', z: 'est', p: 1,
    d: 'El tubo emite un abanico de energías; el hueso, rico en calcio, absorbe más que el tejido blando y deja su sombra. Una radiografía de tórax equivale a unos diez días de radiación natural de fondo.' },
  { id: 'tecnecio', n: 'Tecnecio-99m', f: _keV(140.5), sig: 4, c: 'med', z: 'ref', p: 2,
    d: 'El isótopo más usado en medicina nuclear. Sus fotones son rayos gamma porque salen de un núcleo, aunque tengan menos energía que muchos rayos X: el nombre lo decide el origen, no la energía.' },
  { id: 'aniquilacion', n: 'Aniquilación', f: _keV(511), c: 'med', z: 'ref', p: 1,
    d: 'Cuando un electrón encuentra un positrón, ambos desaparecen y dejan dos fotones de 511 kiloelectronvoltios en sentidos opuestos. La tomografía PET localiza tumores detectando esas parejas.' },
  { id: 'cobalto', n: 'Cobalto-60', f: [_MeV(1.1732), _MeV(1.3325)], sig: 4, c: 'med', z: 'ref', p: 2,
    d: 'Dos líneas, de 1,17 y 1,33 megaelectronvoltios. Durante décadas fueron la base de la radioterapia y todavía esterilizan material sanitario.' },
  /* observatorios */
  { id: 'yebes', n: 'Yebes, 40 m', f: [2e9, 90e9], c: 'obs', z: 'ref', p: 2, alt: 0.98, g: 'dish',
    d: 'El radiotelescopio de 40 metros del Observatorio de Yebes, en Guadalajara, observa entre 2 y 90 gigahercios, dentro de la ventana de radio, y se une a redes que combinan antenas de varios continentes como si fueran una sola.' },
  { id: 'planck', n: 'Planck', f: [30e9, 857e9], c: 'obs', z: 'ref', p: 2, alt: 'esp', g: 'sat',
    d: 'Entre 2009 y 2013 midió el fondo cósmico de microondas en nueve bandas, con diferencias de millonésimas de grado. De su mapa sale la edad del universo: unos 13 800 millones de años.' },
  { id: 'alma', n: 'ALMA', f: [35e9, 950e9], c: 'obs', z: 'ref', p: 1, alt: 5, g: 'dish',
    d: 'Sesenta y seis antenas a 5 000 metros en el desierto de Atacama, por encima de casi todo el vapor de agua. Ve el polvo frío en el que se forman los planetas.' },
  { id: 'sofia', n: 'SOFIA', f: [_um(612), _um(4.5)], c: 'obs', z: 'ref', p: 1, alt: 13, g: 'plane',
    d: 'Un Boeing 747 con un telescopio de 2,7 metros asomado a una compuerta. Entre 2010 y 2022 voló a 12 o 14 kilómetros, por encima del 99 % del vapor de agua, para ver el infrarrojo medio y lejano.' },
  { id: 'webb', n: 'James Webb', f: [_um(28.3), _um(0.6)], c: 'obs', z: 'ref', p: 1, alt: 'esp', g: 'sat',
    d: 'Observa entre 0,6 y 28,3 micras a 1,5 millones de kilómetros de la Tierra, detrás de un parasol que lo mantiene por debajo de 50 kelvin para que no lo deslumbre su propio calor.' },
  { id: 'gtc', n: 'Gran Telescopio Canarias', f: [_um(2.5), _nm(360)], c: 'obs', z: 'ref', p: 1, alt: 2.267, g: 'dome',
    d: 'El mayor telescopio óptico e infrarrojo del mundo, con un espejo segmentado de 10,4 metros en el Roque de los Muchachos, en La Palma. Aprovecha la ventana por la que la luz visible llega al suelo.' },
  { id: 'hubble', n: 'Hubble', f: [_um(1.7), _nm(115)], c: 'obs', z: 'ref', p: 1, alt: 'esp', g: 'sat',
    d: 'En órbita desde 1990, hoy a unos 480 kilómetros de altura. Su espejo de 2,4 metros es modesto, pero no tiene aire delante: ve nítido en el visible y alcanza un ultravioleta que nunca toca el suelo.' },
  { id: 'chandra', n: 'Chandra', f: [_keV(0.1), _keV(10)], c: 'obs', z: 'ref', p: 1, alt: 'esp', g: 'sat',
    d: 'Sus espejos casi cilíndricos desvían los rayos X rozándolos, porque de frente los atravesarían. Ve gas a millones de grados alrededor de agujeros negros y en restos de supernova.' },
  { id: 'globo', n: 'Globos estratosféricos', f: [_keV(30), _MeV(10)], c: 'obs', z: 'est', p: 2, alt: 40, g: 'balloon',
    d: 'A unos 40 kilómetros queda por debajo el 99,7 % del aire. Es la forma barata de observar rayos X duros y rayos gamma sin poner un satélite en órbita.' },
  { id: 'fermi', n: 'Fermi', f: [_MeV(20), _GeV(300)], c: 'obs', z: 'ref', p: 1, alt: 'esp', g: 'sat',
    d: 'Cada fotón gamma que entra en su telescopio principal se convierte en un electrón y un positrón, y sus trazas señalan de dónde venía. Barre el cielo entero cada tres horas.' },
  { id: 'magic', n: 'MAGIC', f: [_GeV(30), _TeV(100)], c: 'obs', z: 'ref', p: 1, alt: 2.2, g: 'dish',
    d: 'Dos espejos de 17 metros en La Palma. No ven el rayo gamma, que muere a kilómetros de altura, sino el destello azulado de la cascada de partículas que deja en el aire.' },
  { id: 'lhaaso', n: 'Fotón récord', f: _PeV(2.5), c: 'obs', z: 'rec', p: 1, alt: 4.41, g: 'array',
    d: 'El observatorio LHAASO, a 4 410 metros en Sichuan, publicó en 2021 un fotón de 1,4 petaelectronvoltios y en 2024 otro de 2,5, ambos llegados de la región del Cisne. Es la luz más energética que se ha detectado.' },
];

/* Con qué comparar la longitud de onda: [metros, texto], de mayor a menor. Valores
   redondeados; la aplicación escribe «≈ X», «X × n» o «X ÷ n». */
const SIZES = [
  [3.844e8, 'la distancia a la Luna'], [4.0075e7, 'la vuelta a la Tierra'], [1.2742e7, 'el diámetro de la Tierra'], [3.474e6, 'el diámetro de la Luna'],
  [1e6, 'la península ibérica'], [3e5, 'la distancia de Madrid a Valencia'], [1e5, 'la isla de Mallorca'], [4.2195e4, 'un maratón'], [1.1e4, 'la altura de vuelo de un avión'],
  [3.5e3, 'una pista de aeropuerto'], [828, 'el Burj Khalifa'], [330, 'la torre Eiffel'], [105, 'un campo de fútbol'], [25, 'una ballena azul'],
  [12, 'un autobús'], [4.5, 'un coche'], [1.7, 'una persona'], [1, 'una guitarra'], [0.297, 'una hoja A4'], [0.07, 'un dedo'], [0.02325, 'una moneda de un euro'],
  [0.01, 'una uña'], [4e-3, 'una hormiga'], [1.5e-3, 'la cabeza de un alfiler'], [3e-4, 'un grano de sal'], [8e-5, 'el grosor de un cabello'],
  [3e-5, 'un grano de polen'], [7.5e-6, 'un glóbulo rojo'], [2e-6, 'una bacteria'], [7.4e-7, 'el paso entre surcos de un DVD'], [1e-7, 'un coronavirus'],
  [3e-8, 'el virus de la polio'], [7e-9, 'el grosor de una membrana celular'], [2e-9, 'el ancho de la hélice de ADN'], [2.8e-10, 'una molécula de agua'],
  [1.06e-10, 'un átomo de hidrógeno'], [1.5e-14, 'un núcleo de uranio'], [1.7e-15, 'un protón'],
];

/* Recorrido guiado: fichas que se visitan en orden. */
const TOUR = ['schumann', 'corte-ionosfera', 'radio-fm', 'horno', 'fondo-cosmico', 'sofia', 'cuerpo', 'fibra', 'sol', 'uvb', 'litografia', 'radiografia', 'aniquilacion', 'magic', 'lhaaso'];
