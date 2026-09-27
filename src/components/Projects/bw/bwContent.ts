/**
 * B&W / THE PUNK-CHIC EDIT: the cover and nine photographs of the shoot.
 *
 * Eight photographs are served as web derivatives in public/works/bw/;
 * IMG_0486 is already a light 4000×6000 export and is served as is. The only
 * words are the ones printed on the cover.
 */

export type Still = {
  /** Camera file name. */
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Grey level of the studio backdrop, measured from the photograph. */
  backdrop: number;
};

const still = (id: string, src: string, width: number, height: number, backdrop: number, alt: string): Still => ({
  id, src, width, height, backdrop, alt,
});

/** In shooting order. The backdrop darkens as the poses get wilder. */
export const STILLS = {
  walk: still("IMG_0255", "/works/bw/IMG_0255.jpg", 2134, 3200, 241, "Full length in an oversized black leather jacket, tiered white ruffle skirt and boots, mid-stride"),
  back: still("IMG_0295", "/works/bw/IMG_0295.jpg", 2134, 3200, 232, "From behind: the leather jacket and a long braid, looking back over the shoulder"),
  front: still("IMG_0309", "/works/bw/IMG_0309.jpg", 2134, 3200, 226, "Facing the camera, both hands gripping the collar of the leather jacket"),
  close: still("IMG_0326", "/works/bw/IMG_0326.jpg", 3602, 5400, 227, "Close-up in the leather jacket: rings, layered chains, a hand at the lapel"),
  raised: still("IMG_0406", "/works/bw/IMG_0406.jpg", 2134, 3200, 216, "White ruffled blouse, black vest and leather trousers, one arm raised trailing a lace cuff"),
  seated: still("IMG_0444", "/works/bw/IMG_0444.jpg", 2134, 3200, 220, "Seated on the floor in the ruffled blouse, vest, studded belts and leather trousers"),
  rest: still("IMG_0460", "/works/bw/IMG_0460.jpg", 2134, 3200, 213, "Close-up, head resting on one hand, a studded leather cuff at the wrist"),
  turn: still("IMG_0468", "/works/bw/IMG_0468.jpg", 2134, 3200, 213, "Mid-turn: hair across the face, a ruffled sleeve blurred in motion"),
  flight: still("IMG_0486", "/works/IMG_0486.jpg", 4000, 6000, 187, "Hair flying, the vest swinging open"),
};

/**
 * Details cut from the full-resolution photographs, served as WebP
 * derivatives in public/works/bw/details/. Each marks a step
 * from armour to release: the fists holding the collar shut (IMG_0309), the
 * jacket opening on the chains (IMG_0326), the ringed fist pulling it open
 * (IMG_0326), the studded cuff under the cheek (IMG_0460) and the bullet belt
 * under the swinging ruffles (IMG_0468).
 */
export const DETAILS = {
  fists: still("IMG_0309 detail", "/works/bw/details/fists.webp", 2000, 1874, 226, "Both fists holding the leather collar shut, a flame-shaped ring on one hand"),
  chains: still("IMG_0326 detail", "/works/bw/details/chains.webp", 2200, 1949, 227, "The jacket opening: layered chains, a ringed hand at the lapel"),
  rings: still("IMG_0326 detail", "/works/bw/details/rings.webp", 1100, 1319, 227, "A fist in a flame-shaped ring pulling the jacket open along its zip"),
  cuff: still("IMG_0460 detail", "/works/bw/details/cuff.webp", 1100, 1161, 213, "Head resting on a ringed hand, a studded leather cuff at the wrist"),
  belt: still("IMG_0468 detail", "/works/bw/details/belt.webp", 2400, 1388, 213, "A bullet-studded belt over leather trousers, white ruffles swinging past"),
};

/** The cover (also the book's face on the desk). */
export const COVER_SRC = "/studio/covers/bw.jpg";

/** Words printed on the cover. */
export const WORDS = {
  title: "B&W",
  edit: "The Punk-Chic Edit",
  radical: ["Radical", "Personality"],
};
