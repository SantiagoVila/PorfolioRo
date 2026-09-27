import { CAP_CANVAS_MAX_WIDTH } from "../CapViewer";
import {
  CAP_CROWN_TOP,
  CAP_REST,
  CAP_SHADOW_BAND,
  DESK_FRONT_Y,
  NAME_HEIGHT_EM,
  PORTRAIT,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  WALL_ABOVE,
  WALL_EDGE_Y,
  WALL_TEXT,
  WALL_TEXT_PORTRAIT,
} from "./sceneLayout";

/**
 * One camera over the studio for the whole page. A camera is the stage point
 * at the centre of the screen and a scale (screen px per stage px); each
 * state has its own framing, and the page glides between them as it scrolls.
 *
 *   INTRO   looking up the wall: the name, the cap, only the desk's edge.
 *   WORK    down on the desk: the Studio framing (landscape), or the
 *           objects two by two (upright screens).
 *   ABOUT   towards the right of the wall, a little closer: the desk sinks
 *           lower, the wall and Rosario's material take the frame.
 *   CONTACT a little closer again and lower, to the card: the quietest move.
 */

export type Camera = { cx: number; cy: number; k: number };

export interface View {
  /** Layout size of the scene (the full screen, browser bars hidden). */
  w: number;
  h: number;
  /** The part of it surely visible with browser bars showing (100svh). */
  hs: number;
  /** Phones and tablets held upright get their own desk layout. */
  portrait: boolean;
  /** The landscape Studio framing (useStageFit). */
  fit: { scale: number; x: number; y: number };
}

/** Upright screens never enlarge the photograph beyond this. */
const PORTRAIT_MAX_K = 1.3;

/** A camera at scale k and centre x whose stage y lands at fraction f of the visible height. */
function at(v: View, k: number, cx: number, stageY: number, f: number): Camera {
  return clampCam(v, { k, cx, cy: stageY + (v.h / 2 - f * v.hs) / k });
}

/** Keep the frame on the photograph (and its wall continued above), never past its edges. */
function clampCam(v: View, c: Camera): Camera {
  const hw = v.w / (2 * c.k);
  const hh = v.h / (2 * c.k);
  const cx = hw * 2 >= STAGE_WIDTH ? STAGE_WIDTH / 2 : Math.min(STAGE_WIDTH - hw, Math.max(hw, c.cx));
  const cy = Math.min(STAGE_HEIGHT - hh, Math.max(-WALL_ABOVE.height + hh, c.cy));
  return { k: c.k, cx, cy };
}

export function workCamera(v: View): Camera {
  if (!v.portrait) {
    const k = v.fit.scale;
    return { k, cx: (v.w / 2 - v.fit.x) / k, cy: (v.h / 2 - v.fit.y) / k };
  }
  const k = Math.min(v.w / (PORTRAIT.right - PORTRAIT.left), PORTRAIT_MAX_K);
  // The desk's front edge a little above the bottom of what is surely visible,
  // leaving a strip of floor for the portfolio's years.
  return at(v, k, PORTRAIT.centreX, DESK_FRONT_Y, 0.88);
}

/** The four framings, in state order. */
export function stateCameras(v: View): Camera[] {
  const work = workCamera(v);
  const right = (f: number, k: number) => work.cx + (f * v.w) / k;
  if (v.portrait) {
    // The objects' nearest edge to the wall: in the intro it stays just out of frame.
    const objectsTop = Math.min(...Object.values(PORTRAIT.quads).flatMap((q) => q.map(([, y]) => y)));
    return [
      // Up the wall: only a strip of the desk's back edge at the very bottom, none of the objects yet.
      at(v, work.k, work.cx, objectsTop, 1),
      work,
      // About: along the wall to the right, towards her material.
      at(v, work.k * 1.12, right(0.62, work.k * 1.12), WALL_EDGE_Y, 0.9),
      // Contact: further along, past the cap, the desk just out of frame: only the card.
      at(v, work.k * 1.2, right(0.8, work.k * 1.2), WALL_EDGE_Y, 0.97),
    ];
  }
  const ki = work.k * 1.12;
  const ka = work.k * 1.2;
  const kc = work.k * 1.24;
  return [
    at(v, ki, WALL_TEXT.x, WALL_EDGE_Y, 0.9),
    work,
    at(v, ka, right(0.2, ka), WALL_EDGE_Y, 0.8),
    at(v, kc, right(0.3, kc), WALL_EDGE_Y, 0.8),
  ];
}

/**
 * The intro's composition of the two identities, her name on the wall and the
 * cap in front of it, as one block. On landscape screens, from the top: the
 * name; the cap standing in front of its second line, the brim (where it would
 * touch the ground) on the name's baseline, so ROSARIO reads whole; the cap's
 * shadow on the wall; the caption; the scroll cue, just above the desk's edge.
 * The block is centred between the navigation and the desk's edge; the name
 * may be set a little smaller on wide, short screens (never below its painted
 * size), and the cap stands at most CAP_MAX of the visible height (on short
 * screens it is scaled down: the canvas keeps its full resolution). On upright
 * screens the cap stands above the name, which starts (lower if needed) just
 * under the cap's shadow.
 * `lift`: how much higher than its painted place the name stands (stage px);
 * `scale`: the name's size (1 = painted); `heroY`: the cap's offset from the
 * screen's centre (screen px); `capScale`: the intro cap's size (1 = canvas).
 */
export interface Intro {
  lift: number;
  scale: number;
  heroY: number;
  capScale: number;
  /** Whether the caption fits between the cap's shadow and the scroll cue (not on a phone held sideways). */
  caption: boolean;
}

/** Offset of a frame row from the intro cap's centre, on screen (CapViewer's canvas: the screen's width, up to its maximum). */
export const capIntroRow = (v: View, y: number) => (y - CAP_REST.frameHeight / 2) * (Math.min(v.w, CAP_CANVAS_MAX_WIDTH) / CAP_REST.frameWidth);

/** Above the name: the navigation (fraction of the visible height). */
const ABOVE_NAME = 0.13;
/** Below the cap's shadow, screen px: the caption (6 + 18), a gap (8), the cue (50) and its margin above the desk's edge (18). */
const CUE_ROOM = 100;
/** The intro cap's largest share of the visible height (crown to shadow). */
const CAP_MAX = 0.46;

export function introLayout(v: View, cams: Camera[]): Intro {
  const letters = v.portrait ? WALL_TEXT_PORTRAIT : WALL_TEXT;
  const c = cams[0];
  const row = (y: number) => capIntroRow(v, y);
  if (!v.portrait) {
    const capScale = Math.min(1, (CAP_MAX * v.hs) / (row(CAP_SHADOW_BAND.bottom) - row(CAP_CROWN_TOP)));
    const baseline = 0.015 * v.h;
    const below = baseline + (row(CAP_SHADOW_BAND.bottom) - row(CAP_REST.frameAnchor.y)) * capScale + CUE_ROOM;
    const edge = project(v, c, 0, WALL_EDGE_Y).y;
    const top = Math.max(ABOVE_NAME * v.hs, 64);
    const height1 = NAME_HEIGHT_EM * letters.size * c.k;
    const scale = Math.max(1, Math.min(letters.introScale, (edge - top - below) / height1));
    const height = height1 * scale;
    const nameTop = top + Math.max(0, edge - top - height - below) / 2;
    const lift = letters.top - ((nameTop - v.h / 2) / c.k + c.cy);
    const heroY = nameTop + height + baseline - (v.h / 2 + row(CAP_REST.frameAnchor.y) * capScale);
    // The caption (18 px, with 6 px either side) must clear the cue's top (its 50 px above the desk's edge margin).
    const shadowBottom = v.h / 2 + heroY + row(CAP_SHADOW_BAND.bottom) * capScale;
    const caption = shadowBottom + 30 <= edge - 18 - 50;
    return { lift, scale, heroY, capScale, caption };
  }
  const heroY = -0.1 * v.h;
  const shadowBottom = v.h / 2 + heroY + row(CAP_SHADOW_BAND.bottom);
  const nameTop = (shadowBottom + 10 - v.h / 2) / c.k + c.cy;
  return { lift: Math.max(0, Math.min(letters.introLift, letters.top - nameTop)), scale: letters.introScale, heroY, capScale: 1, caption: true };
}

/** The camera at state progress s (0–3): scale glides geometrically, the centre linearly. */
export function cameraAt(cams: Camera[], s: number): Camera {
  const i = Math.min(cams.length - 1, Math.max(0, Math.floor(s)));
  const j = Math.min(cams.length - 1, i + 1);
  const f = Math.min(1, Math.max(0, s - i));
  const a = cams[i];
  const b = cams[j];
  return { k: a.k * Math.pow(b.k / a.k, f), cx: a.cx + (b.cx - a.cx) * f, cy: a.cy + (b.cy - a.cy) * f };
}

/** Screen position of a stage point. */
export const project = (v: View, c: Camera, x: number, y: number) => ({ x: (x - c.cx) * c.k + v.w / 2, y: (y - c.cy) * c.k + v.h / 2 });

/** CSS transform placing the stage (origin top-left) under the camera. */
export const cameraTransform = (v: View, c: Camera) =>
  `translate3d(${(v.w / 2 - c.cx * c.k).toFixed(2)}px, ${(v.h / 2 - c.cy * c.k).toFixed(2)}px, 0) scale(${c.k.toFixed(5)})`;
