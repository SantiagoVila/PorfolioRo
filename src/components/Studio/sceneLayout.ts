/**
 * Studio scene layout, in "stage" pixels.
 *
 * The stage is the native frame of the 16:9 desk plate
 * (public/studio/desk-wide.png, 1672×941). The composition follows the
 * master reference (Referencia1.jpeg): the objects, cap and lettering were
 * measured there and carried onto this plate using its props (cup, keys,
 * crumpled paper) and desk edges as the ruler: 0.89 across, 0.80 in depth
 * (this camera looks at the desk a little lower), back edge at y 440.
 * The stage is scaled as one unit to fit the viewport.
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
  explore: {
    /**
     * Fitting all four objects across a phone held upright shrinks the books
     * to ~80 px. Below this fitted scale (books under ~110 px across) the desk
     * is not fitted: it is shown larger than the screen and explored by dragging.
     */
    below: 0.5,
    /** Stage width in view: Colorfull and The Daily whole, with a third of each neighbour showing. */
    span: 640,
    /** Where the view starts: centred between the cap (834) and the middle pair (882). */
    startX: 860,
    /** How far the view can travel (stage x of its edges): the objects plus a strip of the desk's props. */
    left: 220,
    right: 1540,
  },
};

/** Stage y of the drag hint when exploring: on the desk's front edge, under the labels. */
export const EXPLORE_HINT_Y = 812;

/** Back edge of the desk; wall-mounted text is clipped above it. */
export const WALL_EDGE_Y = 440;

/** Wall lettering: centre x, top of its box, font size (stage px). */
export const WALL_TEXT = { x: 850, top: 115, size: 233 };

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
 * How the cap behaves once it sits on the desk: a still, physical object
 * instead of Scene 1's free 360° spin. Frame 0 is the straight-on pose (the
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
