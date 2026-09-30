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
  /**
   * What the window must show of it, most of all the faces: points (fractions
   * of its width/height) and how much each counts. The photograph is placed in
   * each window where these sit deepest inside it (see ColorfullExperience's fitIn).
   */
  keys: readonly Key[];
};

/** A point of a photograph (x, y as fractions) and its weight. */
export type Key = readonly [x: number, y: number, weight: number];

/** A face: its eyes and mouth, and the top of the head. */
const face = (x: number, y: number, size: number, w = 4): Key[] => [
  [x - size * 0.45, y - size * 0.1, w * 0.35],
  [x + size * 0.45, y - size * 0.1, w * 0.35],
  [x, y + size * 0.55, w * 0.3],
  [x, y - size * 0.8, w * 0.15],
];

const PORTRAIT = 5464 / 8192;
const LANDSCAPE = 8192 / 5464;
const photo = (id: string, aspect: number, focal: readonly [number, number], keys: Key[], alt: string): Photo => ({
  id,
  src: `/works/colorfull/${id}.jpg`,
  aspect,
  alt,
  focal,
  keys,
});

// Key points measured on the photographs themselves (faces first; then hands, the fur, the pose).
export const PHOTOS = {
  redFace: photo("IMG_0505", PORTRAIT, [0.47, 0.52], [...face(0.46, 0.5, 0.3, 6), [0.46, 0.8, 0.6], [0.2, 0.2, 0.3]], "Close-up in red faux fur, orange-red make-up across the eyes"),
  redFigure: photo(
    "IMG_0474", PORTRAIT, [0.5, 0.34],
    [...face(0.5, 0.18, 0.08), [0.42, 0.42, 1.2], [0.4, 0.6, 0.8], [0.2, 0.4, 0.6], [0.78, 0.62, 0.6], [0.3, 0.82, 0.25]],
    "Red faux fur coat and red tights, crouching, head tilted back",
  ),
  blueLegs: photo(
    "IMG_0588", LANDSCAPE, [0.56, 0.5],
    [...face(0.71, 0.31, 0.07), [0.8, 0.48, 0.6], [0.58, 0.8, 0.7], [0.45, 0.33, 0.8], [0.62, 0.6, 0.8], [0.13, 0.24, 0.5], [0.09, 0.77, 0.35]],
    "Pale blue faux fur and blue tights, lying back with legs raised",
  ),
  blueLying: photo(
    "IMG_0629", LANDSCAPE, [0.6, 0.45],
    [...face(0.7, 0.3, 0.1), [0.64, 0.64, 1], [0.79, 0.5, 0.5], [0.36, 0.62, 0.6]],
    "Pale blue faux fur, lying on the floor, looking at the camera",
  ),
  together: photo(
    "IMG_0687", LANDSCAPE, [0.52, 0.42],
    [...face(0.36, 0.39, 0.1), ...face(0.68, 0.41, 0.1), [0.25, 0.21, 0.4], [0.33, 0.78, 0.5], [0.6, 0.7, 0.4]],
    "Red and blue faux fur together, close to the camera",
  ),
  backToBack: photo(
    "IMG_0712", LANDSCAPE, [0.5, 0.45],
    [...face(0.39, 0.23, 0.07), ...face(0.58, 0.25, 0.07), [0.5, 0.62, 1], [0.24, 0.6, 0.6], [0.8, 0.55, 0.6], [0.15, 0.8, 0.3], [0.92, 0.62, 0.3]],
    "Red and blue, sitting back to back",
  ),
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
