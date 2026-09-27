/**
 * Studio scene layout, in "stage" pixels.
 *
 * The stage is the native frame of the 16:9 desk plate
 * (public/studio/desk-wide.png, 1672×941). The objects, cap and lettering are
 * placed on it using the plate's own props (cup, keys, crumpled paper) and
 * desk edges as the ruler; the desk's back edge is at y 440. The stage is
 * scaled as one unit to fit the viewport.
 */

export const STAGE_WIDTH = 1672;
export const STAGE_HEIGHT = 941;

/** Clean desk plate: environment only, no cap / books / UI baked in. */
export const DESK_IMAGE = "/studio/desk-wide.png";

/** Stage x kept centred when the stage has to crop horizontally (middle of the objects). */
export const FOCUS_X = 886;

/**
 * Options for useStageFit, shared by the scene and the cap that lands in it.
 * The safe box must always be on screen: horizontally the four objects with
 * a margin; vertically from the top of the ROSARIO lettering down to below
 * the labels and their rules.
 */
export const STAGE_FIT = {
  width: STAGE_WIDTH,
  height: STAGE_HEIGHT,
  safeLeft: 340,
  safeRight: 1430,
  safeTop: 118,
  safeBottom: 768,
  focusX: FOCUS_X,
};

/** Back edge of the desk; wall-mounted text is clipped above it. */
export const WALL_EDGE_Y = 440;

/**
 * Wall lettering: centre x, top of its box, font size (stage px). In the intro
 * the name stands higher (up to `introLift`) and a little larger
 * (`introScale`), and settles into this painted place at work.
 */
export const WALL_TEXT = { x: 850, top: 115, size: 233, introLift: 270, introScale: 1.08 };

/** Height of the two-line name block, in font sizes (both lines, their leading). */
export const NAME_HEIGHT_EM = 1.52;

/** Where the cap rests on the desk (its bounding box). */
export const CAP_SLOT = { x: 741, y: 324, width: 188, height: 176 };

/**
 * How the existing 92-frame cap lands in CAP_SLOT. The frames are 720×405;
 * `frameAnchor` is the bottom of the brim on the cap's rotation axis (below
 * the crown button), measured on the frames. It is pinned to `stageAnchor`,
 * the cap's bottom-centre on the desk, so the cap turns in place. `scale` =
 * stage px per frame px (reference 0.68, × 0.89 for this plate; the cap
 * stands up, so it is not foreshortened like the flat objects).
 */
export const CAP_REST = {
  frameWidth: 720,
  frameHeight: 405,
  frameAnchor: { x: 363, y: 348 },
  stageAnchor: { x: 834, y: 500 },
  scale: 0.605,
};

/**
 * The band of the frames (frame px, top to bottom) taken by the cap's contact
 * shadow across the turn, and the top of its crown (measured on the frames).
 */
export const CAP_SHADOW_BAND = { top: 280, bottom: 379 };
export const CAP_CROWN_TOP = 44;

/**
 * How the cap behaves once it sits on the desk: a still, physical object
 * instead of the intro's free 360° spin. Frame 0 is the straight-on pose (the
 * most symmetric silhouette, eyes to the viewer). Without input it holds that
 * frame exactly; the cursor turns it between frames 80 and 12 (front and
 * three-quarter views only), and it eases back to 0 when input stops.
 */
export const CAP_DESK_REST = {
  frame: 0,
  cursorRange: 12,
  easing: 0.07,
  returnDelay: 900,
};

/** Scroll progress from which the cap switches to its desk behaviour. */
export const CAP_DESK_FROM = 0.55;

/**
 * The studio wall continued above the plate (public/studio/wall-above.webp),
 * derived from the plate's own wall: its colour at the top edge carried
 * upwards and the plaster's grain mirrored upwards. The framings that show
 * more wall than the photograph has (the intro, About, Contact, phones held
 * upright) look up it. Stage coordinates: it spans y -height..0.
 */
export const WALL_ABOVE = { src: "/studio/wall-above.webp", height: 760 };

/** Front edge of the desk (its lip); below is the floor. */
export const DESK_FRONT_Y = 812;

/**
 * Phones and tablets held upright: the same desk, its objects laid out two
 * by two instead of in a row, so all four are on screen at once. Placed on
 * the desk's own perspective plane (fitted from the landscape placement),
 * at 85% with open gutters between them (the phone's narrow frame reads a
 * full-size set as crowded), room behind for the cap against the wall, and
 * a margin of desk at both sides; a little left of centre, where the plate
 * projects them most upright. Covers carry their own titles, so no labels.
 */
export const PORTRAIT = {
  /** Stage x range the camera keeps on screen (the objects, 455 px, plus a margin of desk). */
  left: 310,
  right: 870,
  /** Stage x at the centre of the group. */
  centreX: 590,
  quads: {
    chacarita: [[431.5, 462.0], [589.6, 459.8], [589.8, 588.9], [414.1, 590.8]],
    colorfull: [[618.4, 464.2], [779.6, 466.5], [788.8, 598.4], [609.5, 594.5]],
    journalism: [[399.9, 602.8], [591.7, 606.7], [578.9, 775.6], [362.6, 769.3]],
    bw: [[610.6, 611.4], [791.7, 609.8], [817.8, 778.9], [613.1, 779.6]],
  } as Record<string, Quad>,
  /** The cap's bottom-centre on the desk, against the wall behind the objects. */
  capAnchor: { x: 605.4, y: 449.1 },
};

/** Wall lettering on the upright layout: sized so the name fits the width the camera shows. */
export const WALL_TEXT_PORTRAIT = { x: 590, top: 262, size: 120, introLift: 300, introScale: 1.03 };

export type Point = [x: number, y: number];
/** Corners of an object's top face on the stage: TL, TR, BR, BL. */
export type Quad = [Point, Point, Point, Point];

export type DeskObject = {
  /** Project id (see data/projectsData.ts). */
  id: string;
  kind: "book" | "newspaper";
  label: string;
  /** Top face on the plate (reference placement, carried onto this plate). */
  quad: Quad;
  /** Unprojected size of the object's face (covers are 1792×2400 → 3:4). */
  width: number;
  height: number;
  /** Centre of the label under the object. */
  labelAt: Point;
};

// Left → right, in reference order. Quads and labels mapped from the
// reference: x' = 0.89·(x − 680) + 886, y' = 0.80·(y − 405) + 440.
export const DESK_OBJECTS: DeskObject[] = [
  {
    id: "chacarita",
    kind: "book",
    label: "Chacarita",
    quad: [[369, 534], [565, 519], [595, 690], [371, 708]],
    width: 240,
    height: 321,
    labelAt: [512, 737],
  },
  {
    id: "colorfull",
    kind: "book",
    label: "Colorfull",
    quad: [[616, 533], [801, 519], [857, 684], [651, 704]],
    width: 240,
    height: 321,
    labelAt: [755, 737],
  },
  {
    id: "journalism",
    kind: "newspaper",
    label: "The Daily",
    quad: [[839, 542], [1066, 531], [1149, 704], [913, 726]],
    width: 260,
    height: 325,
    labelAt: [1038, 737],
  },
  {
    id: "bw",
    kind: "book",
    label: "B&W",
    quad: [[1131, 531], [1313, 517], [1402, 678], [1199, 702]],
    width: 240,
    height: 321,
    labelAt: [1294, 737],
  },
];
