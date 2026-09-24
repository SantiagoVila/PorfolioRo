/**
 * EXPLORERS, the trend report on preteens (periodismo/editorial/
 * preadolescentes_.pdf, by Medina, Mendía, Verdy and Virgili). Text quoted in
 * reading order; spreads shown as designed (public/daily/explorers/).
 */

const spread = (n: number) => `/daily/explorers/spread-${String(n).padStart(2, "0")}.webp`;
export const SPREAD_SIZE = { width: 2628, height: 1863 };

export const AUTHORS = "Medina, Mendía, Verdy, Virgili";

/** The report's own colours, sampled from its pages. */
export const COLORS = {
  paper: "rgb(244, 243, 241)",
  slate: "rgb(92, 110, 126)",
  acid: "rgb(196, 196, 60)",
  magenta: "rgb(236, 132, 188)",
  ink: "#23272b",
};

/**
 * The index as printed. Two microtrends it lists (Digital Scientists and
 * Inner Navigators) are not part of this document, so they have no anchor.
 */
export const INDEX: { label: string; anchor?: string }[] = [
  { label: "Introducción / Identi-kit", anchor: "identikit" },
  { label: "Señales de cambio", anchor: "senales" },
  { label: "Macrotendencia", anchor: "macro" },
  { label: "Microtendencias", anchor: "micro" },
  { label: "@Digital Scientists" },
  { label: "@Inner Navigators" },
  { label: "@Material Dreamers", anchor: "dreamers" },
];

export const IDENTIKIT = {
  label: "Identi-kit",
  heading: "El futuro hiperconectado y emocional",
  photo: { src: "/daily/explorers/kids.jpg", width: 1200, height: 1200, alt: "Chicos con anteojos de colores que estiran las manos hacia la cámara" },
  paragraphs: [
    "Los objetivos del presente informe están enmarcados en la investigación sobre el segmento preadolescente, con la intención de detectar tres microtendencias estéticas que consideramos son potenciales escenarios de futuros consumo. Este recorte generacional, los nacidos a partir de 2010, constituye la primera cohorte completamente inmersa en un ecosistema digital total, donde la tecnología no opera como herramienta sino como capa identitaria. Su relación con las pantallas, la inteligencia artificial y los entornos interactivos configura una sensibilidad marcada por la inmediatez, la autoexploración y la navegación fluida entre mundos físicos y virtuales.",
    "En este grupo emergen patrones de comportamiento que articulan autenticidad, emocionalidad y experimentación sensorial. Sus prácticas culturales se alimentan de plataformas fragmentadas (TikTok, YouTube, Roblox, espacios de IA generativa), que funcionan como matrices de creación simbólica. No consumen estéticas: las remixan. No siguen tendencias: las reformulan desde lógicas lúdicas, éticas y comunitarias.",
    "En términos identitarios, se encuentran en un territorio liminal: ya no niños, todavía no adolescentes. Esta transición se manifiesta en una búsqueda temprana de autonomía, un pensamiento más complejo y una mayor sensibilidad hacia la validación entre pares. La socialización ocurre en red, donde las comunidades de interés reemplazan las jerarquías tradicionales y la pertenencia se vuelve líquida, mutante y altamente emocional.",
    "En síntesis, la Generación Alpha preadolescente opera como un radar cultural de alta sensibilidad: hiperconectada, hiperconsciente y orientada a experiencias híbridas.",
  ],
};

export const SIGNALS: { title: string; text: string }[] = [
  { title: "Latest Trend Hunter Report Highlights What’s New in Kids & Play", text: "El reporte de abril 2025 indica que la Generación Alpha se centra en bienestar emocional, autoestima y creatividad, integrando tecnología emergente como IA generativa en el juego." },
  { title: "Exploring the Usage of Generative AI for Group Project‑Based Offline Art Courses in Elementary Schools", text: "Este estudio examinó cómo la IA generativa puede integrarse en cursos de arte presenciales para alumnos de primaria. Los resultados mostraron que AskArt aumentó la motivación y el compromiso de los chicos." },
  { title: "Los adolescentes están adoptando la IA, pero en gran medida no para hacer trampa, según una encuesta", text: "La IA empieza a ser usada por los jóvenes sobre todo fuera del ámbito escolar. El estudio muestra que aprenden mejor cuando buscan por sí mismos los temas que les interesan." },
  { title: "Enjoyment of AI-generated stories blending art and science: impact on preschoolers’ proenvironmental attitudes", text: "Un estudio en China analizó cómo historias creadas con IA pueden fomentar actitudes ecológicas en niños de primaria." },
  { title: "The Guardian view on the arts in schools: classrooms need more creativity", text: "Un editorial de marzo de 2025 advierte que las artes están siendo relegadas frente a materias tradicionales en el Reino Unido y propone que la creatividad debe ocupar un lugar central en la educación." },
  { title: "Como la IA afecta la creatividad de los niños", text: "Investigadores de la UW estudiaron cómo niños de 7 a 13 años usan IA como ChatGPT y DALL-E y descubrieron que la mediación de adultos y compañeros es esencial para integrar estas herramientas de forma significativa." },
  { title: "Celebrating young innovators: A day of tech, creativity and empowerment", text: "Durante el Día Mundial del Niño en Kampala, estudiantes mostraron proyectos de tecnología, diseño y arte." },
  { title: "Un estudio se centra en los usuarios más jóvenes de IA", text: "Una investigación de Common Sense Media muestra que cerca del 30 % de los padres de niños de 0 a 8 años dice que sus hijos ya usan IA para aprender." },
  { title: "Las escuelas ponen la mira en las oportunidades de aprendizaje de la realidad virtual", text: "El artículo muestra que la educación empieza a integrar de forma central espacios físicos y digitales mediante VR/AR." },
  { title: "Fomentando la creatividad infantil a través de la narración de cuentos impulsada por LLM con un robot social", text: "El estudio demuestra que un robot social con IA puede estimular la creatividad infantil mediante la narración de historias." },
];

export const MACRO = {
  title: "explorers",
  premise: "creatividad expandida",
  paragraphs: [
    "En este escenario emergen los Explorers, sujetos suspendidos e inmersos en pantallas, creciendo en un ecosistema donde lo digital y lo físico se fusionan. Cada interacción abre una puerta hacia infinitos mundos posibles. Su curiosidad es desbordante, insaciable, guiada por un impulso vital que los lleva a aprender sin instrucción directa: exploran, descubren, se preguntan y se auto-responden.",
    "La inteligencia artificial acompaña y amplifica este movimiento. No reemplaza la mente sino que la potencia. Acelera su pensamiento, expande su imaginación y habilita nuevas formas de saber.",
    "Así, la macrotendencia Explorers aparece como un futuro donde la curiosidad, la tecnología y la imaginación se entrelazan para dar forma a nuevas estéticas y nuevas maneras de producir conocimiento.",
  ],
  terms: ["Exploración sin límites", "Curiosidad insaciable", "Autoconocimiento activo", "Simbiosis digital-física", "Creatividad expandida", "Virtualidad", "Inteligencia artificial como aliada", "Adaptación"],
  spreads: [spread(6), spread(7)],
};

export const CARTOGRAPHY = { title: "Cartografía", spreads: [spread(8), spread(9)] };

export const DREAMERS = {
  title: "@Material Dreamers",
  theme: "Tema: arte · Premisa: creación híbrida",
  paragraphs: [
    "No observan el mundo: lo crean. Transforman datos en objetos, códigos en formas, pantallas en materia. Para ellos, la digitalidad no es un escape, sino una herramienta para expandir los límites de lo posible.",
    "Su arte no busca imitar la realidad, sino transformarla. Son creadores de un nuevo lenguaje visual y táctil.",
  ],
  materials: ["Gel", "Cera", "Latex", "Slime", "Espuma", "Bioplástico"],
  spreads: [spread(10), spread(11), spread(12), spread(13)],
};

export const UNIVERSES = { terms: ["Transmutación", "Sensibilidad táctil", "Experiencia sensorial", "Expansión", "Arte vivo", "Construcción"], spread: spread(14) };

export const SIGNALS_SPREAD = spread(4);
export const INDEX_SPREAD = spread(2);
