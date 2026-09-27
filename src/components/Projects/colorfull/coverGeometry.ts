/**
 * Geometry of the COLORFULL cover (public/studio/covers/colorfull.jpg,
 * 1792×2400), measured from the image itself. All values are cover pixels.
 *
 * - The two blob windows, as 96 radii at even angles around each blob's
 *   centroid (both blobs are star-shaped: a 256-ray trace matches them at
 *   IoU 0.996 / 0.998). Each radius is the outermost edge between its neighbours
 *   plus 4px, so the smooth curve through them encloses every printed pixel.
 * - Where each photograph sits inside the cover (found by normalised
 *   cross-correlation: IMG_0712 0.99, IMG_0588 0.96, IMG_0505 0.74, the cover
 *   extends that photo's fur and backdrop beyond its frame).
 * - The cover's own typesetting and the blue cut-out figure, as alpha
 *   sprites cut from the cover (public/works/colorfull/cover-*.webp).
 */

export const COVER_W = 1792;
export const COVER_H = 2400;
/** The cover's paper, flat across the whole page (±2). */
export const PAPER = "rgb(248, 240, 221)";

export type BlobShape = { cx: number; cy: number; r: readonly number[] };

/** Top-left window: the red close-up (IMG_0505). */
export const FACE_BLOB: BlobShape = {
  cx: 506.4,
  cy: 829.7,
  r: [
    418, 390, 336.5, 289, 266, 243, 228, 220.5, 211.5, 205, 203, 200.5, 201, 204, 209, 213, 222.5,
    234.5, 245.5, 269.5, 305.5, 336.5, 377.5, 411.5, 430.5, 457.5, 483.5, 501.5, 526, 550, 564.5, 582,
    590.5, 592, 592, 583.5, 568, 552, 521, 495.5, 425, 256.5, 199.5, 182.5, 166.5, 156.5, 152, 147.5,
    144.5, 145, 147, 149, 156, 167.5, 180, 209, 298.5, 357, 401, 423.5, 432, 442, 448, 450.5, 453, 453,
    452.5, 451, 444, 429.5, 413, 384, 361, 352, 346, 351.5, 364.5, 386.5, 407.5, 446, 484.5, 506.5, 528,
    533, 533, 527, 504.5, 477, 447.5, 451, 468, 476, 478, 477.5, 471.5, 452
  ],
};

/** Centre window: the two of them back to back (IMG_0712). */
export const DUO_BLOB: BlobShape = {
  cx: 1044.3,
  cy: 1373.4,
  r: [
    576, 571, 561.5, 551, 546, 539, 534.5, 532, 529, 526, 525, 524, 521.5, 521.5, 522.5, 523.5, 526.5,
    531, 535, 541, 547, 549, 552.5, 552.5, 552, 550, 543.5, 534.5, 524.5, 506.5, 492.5, 468.5, 449.5,
    437, 438.5, 456, 489.5, 644, 692, 703, 709, 709.5, 707, 702.5, 691, 677, 663.5, 631.5, 585, 546,
    506, 482.5, 473, 463.5, 463, 469.5, 478, 486.5, 495, 501, 507, 508.5, 507, 505.5, 499.5, 495.5, 487,
    483, 476, 472, 476, 490, 506, 539.5, 568, 581.5, 602.5, 620, 629.5, 640, 646.5, 648.5, 648.5, 645.5,
    633.5, 618.5, 577, 545.5, 516, 533.5, 567, 578.5, 586, 587.5, 587.5, 583.5
  ],
};

/** Photograph placements inside the cover: left/top and width, in cover px. */
export const IN_COVER = {
  face: {x: 160.0, y: 308.0, w: 727.1},
  duo: {x: 142.0, y: 820.0, w: 1732.0},
  blue: {x: -12.0, y: 1608.0, w: 1851.5},
};

/** Sprites cut from the cover: where each sits on the cover. */
export const SPRITES = {
  title: { src: "/works/colorfull/cover-title.webp", x: 71, y: 96, w: 1667, h: 249, alt: "COLORFULL" },
  contrast: { src: "/works/colorfull/cover-contrast.webp", x: 1179, y: 354, w: 560, h: 104, alt: "Chromatic contrast & texture" },
  fur: { src: "/works/colorfull/cover-fur.webp", x: 52, y: 784, w: 276, h: 104, alt: "Red & blue faux fur" },
  tactility: { src: "/works/colorfull/cover-tactility.webp", x: 1495, y: 1758, w: 245, h: 103, alt: "Playful tactility" },
  cutout: { src: "/works/colorfull/cover-cutout.webp", x: 172, y: 1814, w: 1405, h: 586, alt: "" },
} as const;
