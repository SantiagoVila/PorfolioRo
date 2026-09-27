/**
 * CHACARITA: the cover, ten photographs and the project's fashion film.
 *
 * The photographs are served from public/works/ as delivered. DSC04988 (4) is
 * the same frame as DSC04988 (3) and is not used. The film exists only as a
 * GIF captured from a video player; it is served as web derivatives of it
 * (public/works/chacarita/: the player's frame cropped away, native size, no
 * sound). The only text is what is printed on the cover.
 */

export type Frame = {
  /** Camera file number (not printed). */
  id: string;
  src: string;
  /** width / height of the original. */
  aspect: number;
  alt: string;
};

const frame = (id: string, file: string, w: number, h: number, alt: string): Frame => ({
  id,
  src: `/works/${file}`,
  aspect: w / h,
  alt,
});

export const COVER = {
  src: "/studio/covers/chacarita.jpg",
  width: 1792,
  height: 2400,
};

/** Words printed on the cover. */
export const TEXT = {
  title: "Chacarita",
  subtitle: "An urban design field study",
  wearable: "Wearable utility",
  bus: "Couple in the bus",
  ground: "Public space as found art",
};

export const FRAMES = {
  redDoor: frame("DSC05861", "DSC05861 (1) (1).jpg", 3006, 5729, "In the red doorway under the Aluche sign: the denim jacket with coffee cups sewn on as pockets, denim culottes, polka-dot socks"),
  blueDoor: frame("DSC05831", "DSC05831 (1).jpg", 3077, 5862, "Arms spread across the blue doorway: a maroon varsity sweatshirt, a beret and a white lace skirt"),
  cupsJacket: frame("DSC05757", "DSC05757 (1).jpg", 4000, 6000, "The coffee-cup denim jacket walking the street, trees and parked cars behind"),
  cafeStanding: frame("DSC05374", "DSC05374 (1).jpg", 4000, 6000, "The couple in a café: an oversized adidas jersey, a denim jacket over red lace"),
  cafeSeated: frame("DSC05587", "DSC05587 (1).jpg", 4000, 6000, "The couple seated at a small round café table"),
  busStanding: frame("DSC04737", "DSC04737 (1) (1).jpg", 3765, 5621, "Alone in the bus at night, holding the rail: shirt and tie, black mini skirt, blue polka-dot tights"),
  busDriver: frame("DSC04940", "DSC04940 (1).jpg", 3284, 5308, "At the front of the bus, by the driver's seat, in a black track suit"),
  busCouple: frame("DSC04988", "DSC04988 (3) (1).jpg", 3458, 5620, "The couple sprawled across the back seats of the bus, polka-dot legs stretched towards the camera"),
  ground: frame("DSC05927", "DSC05927 (1).jpg", 4000, 6000, "Platform shoes and polka-dot socks stepping over footprints stencilled on the pavement"),
};

/**
 * The fashion film (≈49 s, silent): derivatives of the original GIF, its
 * picture only (774×440), H.264 MP4 first (plays everywhere, hardware
 * decoded), VP9 WebM as a fallback. The poster is a frame of the film: the
 * cup jacket crossing the street.
 */
export const FILM = {
  mp4: "/works/chacarita/film.mp4",
  webm: "/works/chacarita/film.webm",
  poster: "/works/chacarita/film-poster.jpg",
  width: 774,
  height: 440,
  alt: "Chacarita, the fashion film, without sound: the colectivo to Chacarita, then the two walking the barrio's streets, a crossing, a café, and meeting on the street",
};
