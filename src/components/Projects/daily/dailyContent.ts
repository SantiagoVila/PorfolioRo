/**
 * THE DAILY: the three stories it carries, from the real source material.
 *
 * Source of truth: periodismo/editorial/ (three PDFs; the other three files
 * in periodismo/ are byte-identical duplicates). Every headline, deck and
 * credit below is quoted from those documents; the kickers name what each
 * document says it is. Images are derivatives in public/daily/ (see the Phase 8
 * report); the PDFs themselves are served from public/periodismo/editorial/.
 */

export type StoryId = "artlab" | "arteba" | "explorers";

export type Story = {
  id: StoryId;
  /** Section label: what the document says it is. */
  kicker: string;
  headline: string;
  /** A second line from the document itself. */
  subhead: string;
  /** Opening sentences, quoted. The first is the short deck. */
  deck: string[];
  byline: string;
  image: { src: string; width: number; height: number; alt: string; focal: string };
  pdf: { href: string; label: string };
};

export const STORIES: Record<StoryId, Story> = {
  artlab: {
    id: "artlab",
    kicker: "Artículo de investigación · Chacarita",
    headline: "ArtLab",
    subhead: "El “rehabitar performático”",
    deck: [
      "El espacio urbano contemporáneo ha dejado de ser un mero escenario pasivo para convertirse en una plataforma de constante puesta en escena.",
      "El presente artículo de investigación aborda el ecosistema de ArtLab, como reflejo respaldatorio de la investigación abordada sobre el barrio de Chacarita.",
      "A partir de un trabajo de campo que contrastó las dinámicas nocturnas de performance y los comportamientos diurnos en el espacio, se examina cómo funciona este refugio colectivo.",
    ],
    byline: "Investigación y fotografía: Rosario Medina",
    image: { src: "/daily/artlab/night.jpg", width: 1494, height: 944, alt: "De noche, el público reunido en la puerta de ArtLab", focal: "50% 60%" },
    pdf: { href: "/periodismo/editorial/ARTLAB.pdf", label: "PDF original · 7 MB" },
  },
  arteba: {
    id: "arteba",
    kicker: "Reporte de tendencias · arteba 2025",
    headline: "Reporte de Tendencias",
    subhead: "Smoothness monumenths · Metamorphosis",
    deck: [
      "Arteba es una feria internacional de arte contemporáneo que se realiza todos los años en la ciudad de Buenos Aires desde 1991.",
      "Su propósito principal es visibilizar y potenciar la producción artística argentina y latinoamericana dentro del circuito global.",
      "En el panorama artístico contemporáneo, el textil se vuelve la materia prima de las piezas.",
    ],
    byline: "Rosario Medina",
    image: { src: "/daily/arteba/collage.jpg", width: 1800, height: 2400, alt: "Collage de la portada del reporte: un ojo, labios, un gato, tejidos", focal: "50% 42%" },
    pdf: { href: "/periodismo/editorial/Reporte%20de%20Trends.pdf", label: "PDF original · 27 MB" },
  },
  explorers: {
    id: "explorers",
    kicker: "Reporte de tendencias · Generación Alpha",
    headline: "Explorers",
    subhead: "El futuro hiperconectado y emocional",
    deck: [
      "Los objetivos del presente informe están enmarcados en la investigación sobre el segmento preadolescente, con la intención de detectar tres microtendencias estéticas que consideramos son potenciales escenarios de futuros consumo.",
      "Este recorte generacional, los nacidos a partir de 2010, constituye la primera cohorte completamente inmersa en un ecosistema digital total.",
      "No consumen estéticas: las remixan. No siguen tendencias: las reformulan desde lógicas lúdicas, éticas y comunitarias.",
    ],
    byline: "Medina, Mendía, Verdy, Virgili",
    image: { src: "/daily/explorers/kids.jpg", width: 1200, height: 1200, alt: "Chicos con anteojos de colores que estiran las manos hacia la cámara", focal: "50% 45%" },
    pdf: { href: "/periodismo/editorial/preadolescentes_.pdf", label: "PDF original · 23 MB" },
  },
};

/** Front-page order, left to right; ArtLab (the reported piece) leads at first. */
export const ORDER: StoryId[] = ["artlab", "arteba", "explorers"];

/**
 * The front page's furniture: real snippets set the way a newspaper sets its
 * small matter (a pull quote, keywords, an issue index), none of it invented.
 * The quote is printed in the ArtLab article; the keywords are the report's
 * own; the counts are those of the photographs and documents themselves.
 */
export const FURNITURE = {
  quote: { text: "ArtLab es lo más grande que hay", source: "ArtLab · Artículo de investigación" },
  keywords: ["Textil", "Escultura blanda", "Dimensión táctil", "Nuevas pieles", "Irreverencia"],
  microtrends: ["@Digital Scientists", "@Inner Navigators", "@Material Dreamers"],
  inThisIssue: [
    ["ArtLab", "13 fotografías"],
    ["Reporte de Tendencias", "10 páginas dobles"],
    ["Explorers", "14 páginas dobles"],
  ] as const,
};

/** The paper's own furniture, shared by the newspaper on the desk and the open front page. */
export const ISSUE = { volume: "Vol. 01", section: "Articles & Reports", years: "2024 — 2025", masthead: "The Daily", author: "Rosario Medina" };
