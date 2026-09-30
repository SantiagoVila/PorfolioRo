import { edgeOnScreen, footOf, lying, type Lying } from "./deskPlane";

/**
 * Studio scene layout, in "stage" pixels.
 *
 * The stage is the native frame of the studio's photographs (public/studio/
 * moods/<mood>/desk.webp, 1672×941: the same room by day, at sunset and at
 * night, pixel for pixel; see mood.ts). A clean terrazzo desk against a plain
 * wall, a chrome lamp and a small brass tray at the left, a window at the
 * right, the chair's back (a pink throw over it) in front. The cap, the work,
 * the telephone and her name are laid over it here.
 *
 * The photographs are taken from low, a little above the desk (their camera:
 * see deskPlane). The work lies on the desk as the tray does, in that true
 * perspective: four publications set down in a loose row towards the front,
 * each placed by its middle, size and turn on the desk (DESK_OBJECTS). The cap
 * stands at the back, in the middle, in front of her name painted on the
 * wall; the telephone at the right end, by the window.
 *
 * The camera (worldCamera) frames this one room for each shape of screen.
 */

export const STAGE_WIDTH = 1672;
export const STAGE_HEIGHT = 941;

/**
 * Options for useStageFit (it measures the scene's box; the framings
 * themselves are worldCamera's). The safe box: the work, the cap and the
 * telephone, from her name down to the labels.
 */
export const STAGE_FIT = {
  width: STAGE_WIDTH,
  height: STAGE_HEIGHT,
  safeLeft: 200,
  safeRight: 1560,
  safeTop: 60,
  safeBottom: 830,
  focusX: 836,
};

/** Foot of the wall (the desk's back edge); wall-mounted text is clipped above it. */
export const WALL_EDGE_Y = 520;

/** Front edge of the desk (its lip); below it, the chair's back. */
export const DESK_FRONT_Y = 857;

/**
 * The shapes of screen the room is framed for: upright (phones, tablets held
 * upright: the work two by two), landscape, and wide (a phone held sideways,
 * ultra-wide monitors: the photograph's whole width is shorter than the screen
 * is wide, so the frame crops it top and bottom and her name is set lower).
 */
export type Shape = "upright" | "landscape" | "wide";
export function shapeOf(v: { w: number; hs: number; portrait: boolean }): Shape {
  if (v.portrait) return "upright";
  return v.w / v.hs > 2.02 ? "wide" : "landscape";
}

/**
 * Her name painted on the wall: centre x, top of its box, font size (stage
 * px). Behind the cap, which stands in front of its second line (as in the
 * intro). In the intro the name stands higher (up to `introLift`) and a little
 * larger (`introScale`), and settles into this painted place at work.
 */
export const WALL_TEXT: Record<Shape, { x: number; top: number; size: number; introLift: number; introScale: number }> = {
  landscape: { x: 836, top: 92, size: 180, introLift: 300, introScale: 1.1 },
  wide: { x: 836, top: 176, size: 150, introLift: 300, introScale: 1.1 },
  upright: { x: 737, top: 200, size: 118, introLift: 420, introScale: 1.03 },
};

/** Height of the two-line name block, in font sizes (both lines, their leading). */
export const NAME_HEIGHT_EM = 1.52;

/**
 * How the existing 92-frame cap lands on the desk. The frames are 720×405;
 * `frameAnchor` is the bottom of the brim on the cap's rotation axis (below
 * the crown button), measured on the frames. It is pinned to the cap's
 * bottom-centre on the desk (`stageAnchor`), so the cap turns in place.
 * `scale` = stage px per frame px: a cap about 17 cm across, 1260 wall px
 * from the camera (1.11 stage px per wall px there): second to the work in
 * size, so the publications around it have room.
 */
export const CAP_REST = {
  frameWidth: 720,
  frameHeight: 405,
  frameAnchor: { x: 363, y: 348 },
  stageAnchor: { x: 836, y: 548 },
  scale: 0.7,
};

/** Where the cap rests on the desk (its bounding box, crown to brim), on the landscape layout. */
export const CAP_SLOT = {
  x: CAP_REST.stageAnchor.x - 153.7 * CAP_REST.scale,
  y: CAP_REST.stageAnchor.y - 304 * CAP_REST.scale,
  width: 311 * CAP_REST.scale,
  height: 304 * CAP_REST.scale,
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
 * The studio wall continued above the photographs (public/studio/moods/<mood>/
 * wall-above.webp, derived from each one's own wall: see source-assets/
 * derive-desk-moods.py). The framings that show more wall than the photograph
 * has (the intro, taller screens) look up it. Stage coordinates: it spans y
 * -height..0.
 */
export const WALL_ABOVE = { height: 1000 };

export type Point = [x: number, y: number];
/** Corners of an object's face on the stage: TL, TR, BR, BL. */
export type Quad = [Point, Point, Point, Point];

export type DeskObject = {
  /** Project id (see data/projectsData.ts). */
  id: string;
  kind: "book" | "newspaper";
  label: string;
  /** Its face on the plate: TL, TR, BR, BL (its top edge the far one). */
  quad: Quad;
  /** Unprojected size of the object's face (covers are 1792×2400 → 3:4). */
  width: number;
  height: number;
  /** Its thickness, as it shows at its foot (stage px). */
  edge: number;
  /** Centre of the label just in front of it. */
  labelAt: Point;
};

type Placement = { id: string; kind: DeskObject["kind"]; label: string; width: number; height: number; at: Lying; thick: number };

/**
 * The work, as set down on the desk (see deskPlane's `lying`: the stage x of
 * each middle at its depth, the size in wall px, a turn in the desk's plane),
 * and its thickness in wall px. Small-format publications, about 14 × 19 cm
 * (the tray at the back is about 11 cm across); the newspaper, folded, a
 * little larger and thinner; CHACARITA, a field study, the thickest.
 *
 * Landscape: a loose row across the front of the desk, clear of the chair,
 * each turned a little as things set down by hand are, EL DIARIO a little
 * further back. Upright: two by two in the middle of the desk.
 */
const LANDSCAPE: Placement[] = [
  { id: "chacarita", kind: "book", label: "Chacarita", width: 240, height: 321, at: { x: 372, z: 772, w: 140, l: 187, turn: -4 }, thick: 6 },
  { id: "colorfull", kind: "book", label: "Colorfull", width: 240, height: 321, at: { x: 656, z: 760, w: 140, l: 187, turn: 3 }, thick: 4 },
  { id: "journalism", kind: "newspaper", label: "El Diario", width: 260, height: 325, at: { x: 964, z: 800, w: 162, l: 203, turn: -2 }, thick: 3 },
  { id: "bw", kind: "book", label: "B&W", width: 240, height: 321, at: { x: 1272, z: 774, w: 140, l: 187, turn: 4 }, thick: 4 },
];
const UPRIGHT: Placement[] = [
  { id: "chacarita", kind: "book", label: "Chacarita", width: 240, height: 321, at: { x: 596, z: 745, w: 130, l: 173, turn: 3 }, thick: 6 },
  { id: "colorfull", kind: "book", label: "Colorfull", width: 240, height: 321, at: { x: 878, z: 734, w: 130, l: 173, turn: -3 }, thick: 4 },
  { id: "journalism", kind: "newspaper", label: "El Diario", width: 260, height: 325, at: { x: 624, z: 1000, w: 150, l: 188, turn: -3 }, thick: 3 },
  { id: "bw", kind: "book", label: "B&W", width: 240, height: 321, at: { x: 852, z: 985, w: 130, l: 173, turn: 4 }, thick: 4 },
];

const toObject = (p: Placement): DeskObject => {
  const quad = lying(p.at) as Quad;
  const [fx, fy] = footOf(quad);
  return { id: p.id, kind: p.kind, label: p.label, quad, width: p.width, height: p.height, edge: edgeOnScreen(quad, p.thick), labelAt: [fx, fy + 21] };
};

/** Left → right on landscape screens. */
export const DESK_OBJECTS: DeskObject[] = LANDSCAPE.map(toObject);

/**
 * Phones and tablets held upright: the same room, the work two by two in the
 * middle of the desk (the pair in front larger, nearer), the cap behind them
 * against the wall and the telephone at the right, against the wall too.
 * Covers carry their own titles, so no labels.
 */
export const PORTRAIT = {
  /** Stage x range the camera keeps on screen on a phone (the work and a margin of desk; wider on squarer screens). */
  left: 403,
  right: 1053,
  /** Stage x at the centre of the range. */
  centreX: 728,
  objects: Object.fromEntries(UPRIGHT.map((p) => [p.id, toObject(p)])) as Record<string, DeskObject>,
  /** The cap's bottom-centre on the desk, and its size (stage px per frame px). */
  capAnchor: { x: 737, y: 548 },
  capScale: 0.51,
};

/** A desk object as it lies on this layout. */
export const objectFor = (o: DeskObject, upright: boolean): DeskObject => (upright ? PORTRAIT.objects[o.id] ?? o : o);

/** The cap's size on the desk (stage px per frame px), per layout. */
export const capScaleFor = (upright: boolean) => (upright ? PORTRAIT.capScale : CAP_REST.scale);

/**
 * Rosario's telephone: a cream and brass rotary desk telephone standing on the
 * desk against the wall, at the right end by the window: a corner of its own,
 * behind the work and clear of it (Contact). Its layers (public/studio/phone:
 * body, handset, shadow) are cut from the image supplied for it, the studio's
 * earlier plate re-made around it (source-assets/derive-desk-phone.py); `src`
 * and `shadow` are their boxes there, in its px.
 *
 * It is set smaller than it stood there (`scale`), about a real telephone's
 * size beside the publications and the cap, its right end by the window; placed
 * so that the foot of that image's wall (its y 440) falls on this wall's foot
 * (y 520), and the crease its shadow makes where wall meets desk with it.
 * `place` is where its foot (`foot`, the middle of its base's front) stands,
 * on landscape and on upright screens (there at the right of the range the
 * camera shows).
 */
export const PHONE = {
  src: { x: 1085, y: 245, w: 340, h: 255 },
  shadow: { x: 880, y: 232, w: 550, h: 274 },
  foot: { x: 1200, y: 490 },
  /** The foot of the wall in the telephone's image (the crease in its shadow). */
  wallFoot: 440,
  /** The dial's crest (the plate in its middle, where an old telephone carries its number): its middle and radii. */
  dial: { x: 1205, y: 389.5, rx: 23, ry: 17.5 },
  /** The handset's middle (its handle), about which it rattles; and where its cord leaves it, about which it is lifted (so the cord stays on). */
  handset: { x: 1236, y: 276 },
  cordEnd: { x: 1344, y: 291 },
  /** The telephone's own outline (for picking it up), in `src` px: from the left bell to the cord's loop. */
  outline: { x: 1104, y: 250, w: 318, h: 248 },
  scale: 0.725,
  place: { x: 1401, y: 556.25 },
  scalePortrait: 0.52,
  placePortrait: { x: 930, y: 546 },
  /** How much closer the camera comes when it is answered. */
  closer: 1.15,
};

/** Stage position of a point of the telephone's source image, as it stands on this layout. */
export function phoneAt(portrait: boolean, x: number, y: number) {
  const s = portrait ? PHONE.scalePortrait : PHONE.scale;
  const p = portrait ? PHONE.placePortrait : PHONE.place;
  return { x: p.x + (x - PHONE.foot.x) * s, y: p.y + (y - PHONE.foot.y) * s, s };
}
