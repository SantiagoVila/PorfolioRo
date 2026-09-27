/**
 * COLORFULL: the cover and six photographs (45 MP each), served as 3200px
 * derivatives in public/works/colorfull/. The only words are the ones printed
 * on the cover, used as the cover's own typesetting.
 */

export type Photo = {
  /** Camera file name. */
  id: string;
  src: string;
  /** width / height. */
  aspect: number;
  alt: string;
  /** Point kept in view when the photograph fills a window (fractions of its width/height). */
  focal: readonly [number, number];
};

const PORTRAIT = 5464 / 8192;
const LANDSCAPE = 8192 / 5464;
const photo = (id: string, aspect: number, focal: readonly [number, number], alt: string): Photo => ({
  id,
  src: `/works/colorfull/${id}.jpg`,
  aspect,
  alt,
  focal,
});

export const PHOTOS = {
  redFace: photo("IMG_0505", PORTRAIT, [0.5, 0.44], "Close-up in red faux fur, orange-red make-up across the eyes"),
  redFigure: photo("IMG_0474", PORTRAIT, [0.5, 0.42], "Red faux fur coat and red tights, crouching, head tilted back"),
  blueLegs: photo("IMG_0588", LANDSCAPE, [0.5, 0.55], "Pale blue faux fur and blue tights, lying back with legs raised"),
  blueLying: photo("IMG_0629", LANDSCAPE, [0.56, 0.48], "Pale blue faux fur, lying on the floor, looking at the camera"),
  together: photo("IMG_0687", LANDSCAPE, [0.5, 0.4], "Red and blue faux fur together, close to the camera"),
  backToBack: photo("IMG_0712", LANDSCAPE, [0.55, 0.5], "Red and blue, sitting back to back"),
};

/** The cover (also the book's face on the desk). */
export const COVER_SRC = "/studio/covers/colorfull.jpg";

/** Words printed on the cover. */
export const WORDS = {
  title: "COLORFULL",
  contrast: "Chromatic contrast & texture",
  fur: "Red & blue faux fur",
  tactility: "Playful tactility",
};

/**
 * What shows inside each window where its photograph ends: the backdrop,
 * sampled from the cover (red and duo windows) and from IMG_0588.
 */
export const BACKDROP = {
  red: "rgb(223, 191, 150)",
  blue: "rgb(227, 191, 143)",
  duo: "rgb(243, 212, 175)",
};
