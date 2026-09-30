/**
 * Rosario Medina, for the About and Contact visits (the cap and the phone on the desk).
 *
 * ABOUT: transcribed from Rosario's own About page, "About me — RM Studio |
 * Issue 01": her words and headings, in Spanish as she wrote them (one typo
 * corrected: "Lic. on" → "Lic. en"). The portrait (public/about/portrait.webp)
 * is cut from the same page. "Último año" is as printed there and may need
 * updating.
 *
 * The studio's name and masthead ("RM Studio | Issue 01") are the page's own
 * header; the cap carries the same name embroidered ("Rosario Medina Studio").
 *
 * CONTACT: empty (null) until Rosario supplies her details. Fill them here.
 * Answering the telephone on the desk hands the visitor her card (Studio/
 * ContactVisit): her email and her celular are its first lines, always
 * there, each a link (write to her, call her) with a copy button, as soon as
 * it has a value; until then the card keeps their places ruled and empty (no
 * placeholder text, nothing invented). Instagram, LinkedIn and the CV are
 * printed under them only when they have a value.
 */

export const ABOUT = {
  name: "Rosario Medina",
  /** Her studio, and the masthead of her About page. */
  studio: "RM Studio",
  issue: "Issue 01",
  /** Where she is based (from "radicada en Buenos Aires"). */
  base: "Buenos Aires",
  origin: "Oriunda de Misiones, radicada en Buenos Aires.",
  statement: [
    "Apasionada por el diseño y la moda, busco redefinir la estética a través de narrativas visuales originales.",
    "Un enfoque conceptual que fusiona el arte con la funcionalidad.",
  ],
  competencies: { label: "Competencias", items: ["Styling completo", "Dirección artística", "Producción editorial", "Marketing de moda"] },
  education: { label: "Formación", text: "Lic. en Diseño y Gestión de Estéticas para la Moda (UADE — último año)" },
  tools: { label: "Tech & software", items: ["Photoshop", "Premiere", "Canva"] },
  /** Her palette, "El creador", as printed with its Pantone references (colours sampled from the page). */
  paletteName: "El creador",
  palette: [
    { name: "Flame Scarlet", code: "18-1692", hex: "#e33831" },
    { name: "Bluefish", code: "14-4830 TN", hex: "#266390" },
  ],
  portrait: { src: "/about/portrait.webp", width: 431, height: 643, alt: "Rosario Medina, portrait" },
};

export interface ContactInfo {
  /** e.g. "nombre@dominio.com" */
  email: string | null;
  /** Her celular, as it should read, with its country code: e.g. "+54 9 11 1234-5678" (the link dials its digits). */
  phone: string | null;
  /** Handle without the @, e.g. "rosariomedina" */
  instagram: string | null;
  /** Full profile URL, e.g. "https://www.linkedin.com/in/…" */
  linkedin: string | null;
  /** A real CV or portfolio PDF: its public path (e.g. "/cv/rosario-medina.pdf") or URL. */
  cv: string | null;
}

export const CONTACT: ContactInfo = {
  email: null,
  phone: null,
  instagram: null,
  linkedin: null,
  cv: null,
};
