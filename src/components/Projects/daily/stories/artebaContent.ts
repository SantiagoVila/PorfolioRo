/**
 * Reporte de Tendencias, arteba 2025 (periodismo/editorial/Reporte de
 * Trends.pdf), by Rosario Medina.
 *
 * The report is a trend dossier: the fair, then two trends (Smoothness
 * monumenths, Metamorphosis), each with a manifesto, its guiding
 * formulations, keywords, theme, the works that define it, a palette and a
 * collage ("Cartografía"), and an artist spotlight (Alexis Minkiewicz). Every
 * text below is quoted from the report as printed; captions are the report's
 * own tombstones. Images are derivatives cut from renders of the PDF
 * (public/daily/arteba/report/); the palette colours are sampled from the
 * report's own swatches, next to the codes it prints.
 */

export const COVER = {
  tag: "#Desttt",
  title: ["Reporte de", "Tendencias"],
  fair: ["arteba", "2025"],
  byline: "Rosario Medina",
};

const img = (name: string, width: number, height: number, alt: string) => ({ src: `/daily/arteba/report/${name}.webp`, width, height, alt });
export type Img = ReturnType<typeof img>;

export const INTRO = {
  title: "Reporte de tendencias de la edición 2025 arteba",
  paragraphs: [
    "Arteba es una feria internacional de arte contemporáneo que se realiza todos los años en la ciudad de Buenos Aires desde 1991. Su propósito principal es visibilizar y potenciar la producción artística argentina y latinoamericana dentro del circuito global. Se trata de uno de los encuentros culturales más relevantes de la región, ya que reúne a galerías consolidadas, proyectos emergentes y espacios experimentales, generando un mapa diverso del arte actual.",
    "A lo largo de cada edición, la feria convoca a artistas, coleccionistas, curadores, críticos, directores de museos y público general, convirtiéndose en un punto de encuentro donde conviven el mercado del arte, la reflexión crítica y la experiencia estética. Más que un espacio de compraventa de obras, arteba funciona como una plataforma de diálogo e intercambio que consolida a Buenos Aires como un polo clave del arte contemporáneo en América Latina.",
    "Este año ya exposición se llevó a cabo en Costa Salguero los días 29 al 31 de agosto (con pre-aperturas los días 27 y 28).",
    "En cada edición de arteBA, la feria recibe un público heterogéneo que refleja la amplitud del mundo del arte contemporáneo. Por un lado, se destacan los profesionales especializados: curadores, críticos, coleccionistas y directores de museos que recorren los pasillos en busca de nuevas adquisiciones y oportunidades de diálogo con galeristas y artistas. También participan instituciones culturales y gubernamentales, que encuentran en el evento un espacio para establecer vínculos y apoyar la circulación de obras en el ámbito local e internacional. Junto a ellos convive un público más amplio: amantes del arte, estudiantes y visitantes curiosos, que asisten para descubrir propuestas innovadoras, conocer de cerca a artistas emergentes y vivir la experiencia estética que ofrece la feria. Esta diversidad convierte a arteBA en un punto de encuentro único, donde se cruzan intereses comerciales, inquietudes intelectuales y el simple deseo de acercarse al arte contemporáneo desde múltiples miradas.",
  ],
  photos: [
    img("fair-stand", 1400, 594, "Un stand de arteba 2025: paredes blancas, obras colgadas, un plato azul y sillas"),
    img("fair-aisle", 1400, 940, "Un pasillo de la feria, gente caminando entre obras de colores"),
  ],
};

export type Work = { image: Img; artist: string; work?: string };
export type Chip = { code: string; color: string };
export type Trend = {
  id: string;
  n: string;
  title: string;
  /** "Tema" and "PC", as printed in the corner of the trend's page. */
  theme: [string, string];
  /** The trend's own band colour on the report's pages. */
  band: string;
  manifesto: string[];
  keywords: string[];
  rectoras: string[];
  latentes: string[];
  morfologico: string[];
  works: Work[];
  palette: Chip[];
  cartografia: Img;
};

export const TRENDS: Trend[] = [
  {
    id: "smoothness",
    n: "01",
    title: "Smoothness monumenths",
    theme: ["Tema: textil", "PC: Sensibilidad"],
    band: "rgb(250, 227, 235)",
    manifesto: [
      "En el panorama artístico contemporáneo, el textil se vuelve la materia prima de las piezas. Una herramienta escultórica con la capacidad de articular espacio, cuerpo y memoria. Los textiles ya no se conforman con cubrir, envolver o decorar, se alzan, se expanden, reclaman el espacio. Blandos pero imponentes, como si fueran bloques de mármol o piezas de metal, pero con la particularidad de que es flexible, mutable y cercano al cuerpo humano, un material sensible.",
      "No se limita a ilustrar, sino que aporta una dimensión táctil y afectiva. La trama, el encaje y la costura transmiten algo que la pintura y el mármol solo no lograrían: la sensación de cercanía, de haber sido hecho a mano, de algo que contiene historia y cuidado.",
      "La cercanía sensorial de las fibras permiten que las obras trasciendan la mera visualidad para instalarse en el terreno de lo experiencial. Se une a la tradición artesanal los avances tecnológicos, incorporando biotextiles, materiales reciclados y tejidos inteligentes a las obras. Es arquitectura, piel expandida, memoria tejida en volúmenes que respiran. El textil es un organismo escultórico, un puente entre lo íntimo y lo colectivo, entre el arte y la vida.",
    ],
    keywords: ["Textil", "Tridimensionalidad", "Escultura blanda", "Intimidad", "Sensibilidad", "Dimensión táctil"],
    rectoras: [
      "Los textiles dejan de ser el lienzo para constituirse en la materia prima central de las piezas artísticas.",
      "Tacto, cercanía, afecto y transparencia, generan un diálogo a quien la percibe.",
      "Se trasciende el plano bidimensional para erigirse como cuerpo tridimensional.",
    ],
    latentes: [
      "El textil subvierte jerarquías: lo que antes era frágil y secundario se impone como monumental y central.",
      "Cada hilo encarna tiempo, gesto y cuidado, guardando la huella de lo íntimo lo colectivo.",
      "Organismos escultóricos que expanden la percepción más allá de lo visual, convocando al tacto, la cercanía y la inmersión sensorial e íntima, entre las sábanas junto a la obra.",
    ],
    morfologico: [
      "Las estructuras presentan una unión conformada por módulos diferenciados entre sí por su cromaticidad, forma y textura, generando una estructura mayor. Son morfologías abstractas y amorfas carecientes de geometría que poseen una estructura suave.",
      "La paleta es de colores brillantes desaturados que a pesar de su variedad en la matiz, están regidas bajo una armonía,",
      "Hay una pesadez visual, una sensación gravitacional de que hay algo que las atrae hacia abajo.",
    ],
    works: [
      { image: img("labourt", 674, 1024, "Obra de Josefina Labourt: una forma blanda que cae desde un lienzo verde"), artist: "Josefina Labourt", work: "Que mis pies tienen raíz (2025). Óleo sobre tela, gasa y cartapesta. 150 x 210 x 50 cm" },
      { image: img("wall", 727, 595, "Tapiz de Joan Wall: cáñamo tejido con una forma amarilla en el centro"), artist: "Joan Wall", work: "Sin nombre (1970). Cáñamo y sisal teñidos por el artista. 126 × 157 cm" },
      { image: img("koni", 720, 722, "Mushi de Kami Koni: almohadones blandos de algodón estampado en el piso"), artist: "Kami Koni", work: "Mushi (2024). Algodón relleno" },
      { image: img("giarcovich", 704, 592, "FRISO II de Teresa Giarcovich: capas de tul de colores"), artist: "Teresa Giarcovich", work: "FRISO II (2023). Tul y mallas plásticas. 390 x 120 cm" },
      { image: img("trosman", 628, 821, "Obra de Jessica Trosman: tela laqueada y foil arrugados"), artist: "Jessica Trosman", work: "La maldad es la nueva Bondad (2025). Pintura sobre tela laqueada, plástico inyectado y espumado, foil, pvc y aluminio. 100 x 60 x 20 cm" },
      { image: img("brandazza", 673, 977, "Obra de Manuel Brandazza en la feria: formas blandas colgadas sobre una alfombra roja"), artist: "Manuel Brandazza" },
    ],
    palette: [
      { code: "11-0700 TCX", color: "rgb(244, 247, 255)" },
      { code: "11-4101 TCX", color: "rgb(247, 246, 242)" },
      { code: "12-2907 TCX", color: "rgb(248, 224, 232)" },
      { code: "13-2016 TCX", color: "rgb(253, 181, 194)" },
      { code: "12-5806 TCX", color: "rgb(240, 243, 255)" },
      { code: "13-4308 TCX", color: "rgb(89, 164, 176)" },
      { code: "14-1045 TPG", color: "rgb(241, 172, 83)" },
      { code: "18-1163 TCX", color: "rgb(159, 89, 18)" },
    ],
    cartografia: img("cartografia-1", 1400, 1988, "Cartografía de Smoothness monumenths: collage de las obras de la tendencia"),
  },
  {
    id: "metamorphosis",
    n: "02",
    title: "Metamorphosis",
    theme: ["Tema: otra piel", "Pc: herencias mutantes"],
    band: "rgb(243, 244, 251)",
    manifesto: [
      "La historia del arte ya no puede pensarse como un templo de silencios, inmóvil e intocable, sino como un taller vivo donde los íconos cambian de piel. Obras que en otro tiempo parecían fijas hoy se vuelven blandas; lo solemne adquiere un carácter lúdico y lo único se multiplica en versiones posibles. Cada reformulación de una pieza canónica es, al mismo tiempo, un acto de irreverencia y amor: cuestionar para mantener vivo, alterar para volver a mirar. De este modo, la obra deja de ser reliquia y pasa a funcionar como organismo, recordándonos que lo eterno solo existe en la medida en que está dispuesto a transformarse.",
      "En el marco de la posmodernidad, cuando ya no hay un futuro que despierte esperanza, aparece el refugio de la nostalgia. Recrear en lo ya creado se convierte en una práctica que busca novedad en la repetición y devuelve presente a aquello que parecía intocable. Tal como sostiene Zygmunt Bauman, en la modernidad líquida el porvenir ha perdido su carácter de promesa. Si en el pasado el progreso era una fuente de certezas, en la actualidad prevalece la incertidumbre. Cuando el futuro se percibe frágil y difuso, el pasado ofrece un terreno fértil para la reinterpretación. El regreso a lo clásico no implica una repetición pasiva, sino la apertura a nuevas versiones materiales y morfológicas. La nostalgia deja de ser únicamente un refugio melancólico y se convierte en musa.",
    ],
    keywords: ["Reformulación", "Reversión", "Herencia", "Nuevas pieles", "Irreverencia"],
    rectoras: [
      "La obra clásica es tomada como un organismo vivo en permanente transformación.",
      "La reformulación no destruye, regenera, muta y reabre sentidos.",
      "En un acto de irreverencia se reformula lo intocable, cambiando étnias, morfologías y materialidades.",
    ],
    latentes: [
      "Los clásicos del arte juegan a disfrazarse entre telas, cuerpos y étnias.",
      "El canon se abre, se disecciona, se analiza como un cuerpo que puede desarmarse y reconfigurar. Una exploración quirúrgica de la tradición.",
      "La memoria se vuelve futuro.",
      "Cambiar la piel como forma de percibir lo eterno.",
    ],
    morfologico: [
      "Las estructuras se desenvuelven en una figura fondo, el fondo opera en una lógica de módulos que le dan estabilidad y armonía a la figura central. Hay líneas orgánicas, amorfas e indefinidas que recorren el sistema.",
      "La paleta se compone de tonos oscuros y saturados. Poseen una textura modular y armoniosa.",
    ],
    works: [
      { image: img("vitali", 858, 963, "Azucenas de Roman Vitali: un florero con flores hecho de cuentas de acrílico"), artist: "Roman Vitali", work: "“Azucenas” (2023). Cuentas de acrílico facetadas encastrables, cristales. 95 x 83 x 4 cm" },
      { image: img("nomada", 587, 739, "La Venus Bolita de Flor Nomada: una Venus pintada dentro de una caja de madera"), artist: "Flor Nomada", work: "“La Venus Bolita” (2024). Acrílico sobre lienzo. 98 x 78 cm" },
      { image: img("mondongo", 955, 635, "Obra de Mondongo en plastilina, inspirada en Las Espigadoras de Millet"), artist: "Mondongo", work: "(2016). Inspirado en “Las Espigadoras” de Millet. Plastilina" },
      { image: img("edgar", 1034, 740, "Toque de Novissimo Edgar: tejidos de punto y encaje con figuras en rojo y naranja"), artist: "Novissimo Edgar", work: "Toque (2023). Tejidos de punto, algodón, ganchillo, encaje. 88 x 106" },
    ],
    palette: [
      { code: "12-0719 TCX", color: "rgb(249, 240, 122)" },
      { code: "16-1358 TCX", color: "rgb(249, 101, 19)" },
      { code: "18-1249 TCX", color: "rgb(193, 93, 19)" },
      { code: "16-1363 TCX", color: "rgb(234, 92, 30)" },
      { code: "11-4001 TCX", color: "rgb(237, 242, 255)" },
      { code: "15-4719 TCX", color: "rgb(86, 162, 174)" },
      { code: "15-0146 TCX", color: "rgb(119, 198, 78)" },
      { code: "18-6028 TCX", color: "rgb(28, 116, 71)" },
    ],
    cartografia: img("cartografia-2", 1400, 1988, "Cartografía de Metamorphosis: collage de las obras de la tendencia"),
  },
];

export const ARTIST = {
  name: "Alexis Minkiewicz",
  paragraphs: [
    "Minkiewicz suele trabajar con una mirada que oscila entre lo erótico, lo lúdico y lo escultórico clásico, pero siempre filtrado por una sensibilidad contemporánea que desarma los estereotipos. En este caso, Cupido no se presenta como el niño alado de la iconografía tradicional, sino como una figura abstracta, corpórea, más cercana a un organismo en formación que a un cuerpo definido. Hay una tensión entre lo reconocible y lo amorfo: los volúmenes insinúan curvas humanas, pero al mismo tiempo parecen juguetes blandos o figuras en estado embrionario.",
    "La obra te atrapa, te cautiva, te flecha como si la esencia de cupido estuviera en el aire. El espectador no sabe que está viendo, si es erótico u horroroso, pero allí está tallado en el noble mármol dispuesto para ser descifrado. La escultura 360 en cada recoveco tiene una cara nueva, un pliegue, un misterio.",
    "El prolijo trabajo del mármol contrasta con la forma blanda y casi caricaturesca. Esa fricción refuerza el gesto contemporáneo de Minkiewicz: convertir al dios del amor en un ser vulnerable, tierno, sin rasgos heroicos ni angelicales, sino más bien íntimo y corporal.",
    "En el arte la rebeldía, sexualidad, protesta e irreverencia sobran, lo que diferencia a Alexis es que en su discurso tiene la tekné. El artista mixeó todos estos temas contemporáneos y los expresa mediante la esencia de la perfección de la Grecia clásica. Es un cable conector entre aquellas obras que obtenían su magia mediante su complejidad, y la irreverencia postmoderna.",
  ],
  work: "Cupido (2025). Mármol Estremoz. 46 x 35 x 35 cm",
  photo: img("cupido", 1000, 1459, "Cupido de Alexis Minkiewicz en la feria: una escultura de mármol rosado sobre un banco de madera"),
  portrait: img("minkiewicz", 584, 800, "Alexis Minkiewicz tallando una escultura"),
  views: img("cupido-views", 1000, 311, "Cuatro vistas de Cupido"),
};

/** The dossier's sections, in order: the index and the anchors. */
export const SECTIONS = [
  { id: "informe", short: "Informe", label: "El informe" },
  { id: TRENDS[0].id, short: "01", label: `01 ${TRENDS[0].title}` },
  { id: TRENDS[1].id, short: "02", label: `02 ${TRENDS[1].title}` },
  { id: "artista", short: "Artista", label: ARTIST.name },
] as const;
