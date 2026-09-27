/**
 * The four projects on the desk, as the Studio and the project shell see them.
 * Everything else about a project (its imagery, words, layout) lives in its
 * own experience under components/Projects/.
 */
export type ProjectData = {
  id: string;
  /** Name of the project dialog (its accessible name). */
  title: string;
  /** Shown on THE DAILY's front page ear; part of the desk objects' accessible names. */
  category: string;
  /** Book cover on the desk, also the first frame when the book opens. THE DAILY is a newspaper and has none. */
  coverImage?: string;
  /** The project's own language where it isn't the page's (Spanish): its words, captions and descriptions. */
  lang?: "en";
};

export const PROJECTS: Record<string, ProjectData> = {
  chacarita: {
    id: "chacarita",
    title: "Chacarita",
    // The cover's subtitle.
    category: "Urban design field study",
    coverImage: "/studio/covers/chacarita.jpg",
    lang: "en",
  },
  colorfull: {
    id: "colorfull",
    title: "Colorfull",
    // The cover's own words.
    category: "Chromatic contrast & texture",
    coverImage: "/studio/covers/colorfull.jpg",
    lang: "en",
  },
  bw: {
    id: "bw",
    title: "B&W",
    // The cover's own words.
    category: "The Punk-Chic Edit",
    coverImage: "/studio/covers/bw.jpg",
    lang: "en",
  },
  journalism: {
    id: "journalism",
    title: "The Daily",
    // THE DAILY's section line (its masthead ear).
    category: "Articles & Reports",
  },
};
