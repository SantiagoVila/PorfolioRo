import { CAP_CANVAS_MAX_WIDTH } from "../CapViewer";
import {
  CAP_CROWN_TOP,
  CAP_REST,
  CAP_SHADOW_BAND,
  DESK_FRONT_Y,
  DESK_OBJECTS,
  NAME_HEIGHT_EM,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  WALL_ABOVE,
  WALL_EDGE_Y,
  WALL_TEXT,
  arrangementFor,
  shapeOf,
  type DeskLayout,
  type WallText,
} from "./sceneLayout";

/** The labels on the desk in front of the work (stage y, their lower edge). */
const LABELS_Y = Math.max(...DESK_OBJECTS.map((o) => o.labelAt[1])) + 10;

/**
 * One camera over the studio for the whole page. A camera is the stage point
 * at the centre of the screen and a scale (screen px per stage px); each
 * state has its own framing, and the page glides between them as it scrolls.
 *
 *   INTRO   looking up the wall: the name and the cap, only the desk's back
 *           edge.
 *   WORK    the studio as photographed: the wall, the desk, the chair
 *           (framed per shape of screen, see workCamera).
 *
 * An object on the desk can also draw the camera towards itself (the phone,
 * when it is picked up): see closeOn, and useWorld's aim.
 */

export type Camera = { cx: number; cy: number; k: number };

export interface View {
  /** Layout size of the scene (the full screen, browser bars hidden). */
  w: number;
  h: number;
  /** The part of it surely visible with browser bars showing (100svh). */
  hs: number;
  /** Phones and tablets held upright get their own framing (and their own arrangement of the desk: `layout`). */
  portrait: boolean;
  layout: DeskLayout;
  /** The landscape Studio framing (useStageFit; the framings here are worldCamera's own). */
  fit: { scale: number; x: number; y: number };
  /** The screen's safe-area inset at the top (a notch, a status bar over the page; 0 almost everywhere): the navigation moves down past it. */
  safeTop: number;
}

/** Upright screens never enlarge the photograph beyond this. */
const PORTRAIT_MAX_K = 1.3;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

/** Below the navigation (screen px): where her painted name may start at the desk. */
const UNDER_NAV = 64;
/** The same on upright screens, whose navigation takes two rows (the light's marks under the links). */
const UNDER_NAV_UPRIGHT = 112;
/** The upright arrangement this screen shows (a phone's or a tablet's). */
const uprightOf = (v: View) => arrangementFor(v.layout === "tablet" ? "tablet" : "upright");

/** The navigation's own top margin (SiteHeader: max(inset, 1.75rem)): how much of a top inset it already clears. */
const NAV_TOP = 28;
const underNav = (v: View, base: number) => base + Math.max(0, v.safeTop - NAV_TOP);

/**
 * The desk framing, art-directed per shape of screen (one room: only the
 * frame changes; everything on the desk is placed in the photograph's own
 * coordinates, so it stays where it lies).
 *
 * Landscape and wide screens see the photograph's whole width wherever the
 * screen is at least 3:2 (desktops and laptops: the lamp, the window, the
 * chair's back and the pink throw on it), a little less on squarer screens
 * (tablets held sideways: never less than the lamp's shade to the window's
 * frame, 1460 px). Vertically the photograph's foot (the chair) sits at the
 * bottom of the screen and taller screens see more of the wall above. When the
 * photograph is taller than the screen (16:9 and wider: phones held sideways,
 * ultra-wide monitors) the frame keeps her name clear of the navigation and
 * the labels in view, and as much of the chair as fits.
 *
 * Upright screens see the lamp's end of the room (arranged for them: see
 * sceneLayout's UPRIGHT_ARRANGEMENTS), from the photograph's left edge to the
 * arrangement's `right` (a tablet's reaches further into the room), and never
 * so close that her name and the desk's front edge do not both fit under the
 * navigation. The desk's front edge sits near the bottom of what is surely
 * visible, the wall above it.
 */
export function workCamera(v: View): Camera {
  const shape = shapeOf(v);
  if (shape !== "upright") {
    const A = v.w / v.hs;
    const shown = STAGE_WIDTH - (STAGE_WIDTH - 1460) * clamp((1.5 - A) / 0.3, 0, 1);
    const k = v.w / shown;
    const visH = v.hs / k;
    const letters = WALL_TEXT[shape];
    let top = STAGE_HEIGHT - visH;
    const nameClear = letters.top - underNav(v, UNDER_NAV) / k;
    if (top > nameClear) top = Math.max(nameClear, LABELS_Y + 12 / k - visH);
    return clampCam(v, { k, cx: 820, cy: top + v.h / (2 * k) });
  }
  const room = uprightOf(v);
  // From her name's top to the desk's front edge (at 0.92 of the height), under the navigation
  // (in two rows below the navigation's `sm` width: the light's marks under the links).
  const tall = (0.92 * v.hs - underNav(v, v.w >= 640 ? UNDER_NAV : UNDER_NAV_UPRIGHT)) / (DESK_FRONT_Y - room.name.top);
  const k = Math.min(v.w / room.right, tall, PORTRAIT_MAX_K);
  // The frame starts at the photograph's left edge (the lamp): clampCam holds it there.
  // The desk's front edge a little above the bottom of what is surely visible,
  // leaving a strip of the chair's back below it.
  return at(v, k, v.w / (2 * k), DESK_FRONT_Y, 0.92);
}

/**
 * Her name painted on the wall, as this screen shows it: on upright screens
 * it is centred on the desk framing (which starts at the lamp and is as wide
 * as the screen allows), so it stands in the middle of the screen at the desk
 * and in the intro.
 */
export function wallText(v: View): WallText {
  const shape = shapeOf(v);
  return shape === "upright" ? { ...uprightOf(v).name, x: v.w ? workCamera(v).cx : 0 } : WALL_TEXT[shape];
}

/** The two framings, in state order. */
export function stateCameras(v: View): Camera[] {
  const work = workCamera(v);
  const shape = shapeOf(v);
  if (shape === "upright") {
    const room = uprightOf(v);
    // The work's far edges: in the intro they stay just out of frame.
    const objectsTop = Math.min(...Object.values(room.objects).flatMap((o) => o.quad.map(([, y]) => y)));
    // The intro stands a little closer than the desk framing where it must (the page then draws back
    // to the whole corner as it comes down): so that the wall above holds the frame down to the work,
    // and her name, in its painted place, can sit under the cap.
    const k = Math.max(work.k, v.hs / (objectsTop - 4 + WALL_ABOVE.height), uprightNameTop(v) / (room.name.top + WALL_ABOVE.height));
    // Up the wall: none of the work yet (the lamp's shade and its stem at the side)…
    const low = at(v, k, work.cx, objectsTop - 4, 1);
    // …and, on shorter screens, higher still: her name, in its painted place, just under the cap's
    // shadow (the intro holds the cap above her name; the name is only ever lifted into place).
    const high = clampCam(v, { k, cx: work.cx, cy: room.name.top - (uprightNameTop(v) - v.h / 2) / k });
    return [high.cy < low.cy ? high : low, work];
  }
  // Up the wall: the desk's back edge low in the frame (the work lies further forward, out of it).
  return [at(v, work.k * 1.12, WALL_TEXT[shape].x, WALL_EDGE_Y, 0.9), work];
}

/**
 * The desk framing drawn `closer` times nearer to a stage point, centred on
 * it as far as the photograph allows (never past its edges).
 */
export function closeOn(v: View, x: number, y: number, closer: number): Camera {
  return clampCam(v, { k: workCamera(v).k * closer, cx: x, cy: y });
}

/** Part of the way from one framing to another: scale geometrically (an even zoom to the eye), centre linearly. */
export function mixCam(a: Camera, b: Camera, t: number): Camera {
  return { k: a.k * Math.pow(b.k / a.k, t), cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t };
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
  const letters = wallText(v);
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
  const nameTop = (uprightNameTop(v) - v.h / 2) / c.k + c.cy;
  return { lift: Math.max(0, Math.min(letters.introLift, letters.top - nameTop)), scale: letters.introScale, heroY: uprightHeroY(v), capScale: 1, caption: true };
}

/**
 * Upright intro: the cap's offset from the screen's centre. A tenth of the
 * height up on a tall phone; a little more on shorter screens (a phone with
 * its browser's bars showing, tablets), so the name, the swatch under it and
 * the scroll cue keep clear of each other.
 */
const uprightHeroY = (v: View) => -lerp(0.1, 0.13, clamp((v.w / v.h - 0.47) / 0.12, 0, 1)) * v.h;
/** Upright intro: where her name starts on screen, just under the cap's shadow. */
const uprightNameTop = (v: View) => v.h / 2 + uprightHeroY(v) + capIntroRow(v, CAP_SHADOW_BAND.bottom) + 10;

/** The camera at state progress s (0–1). */
export function cameraAt(cams: Camera[], s: number): Camera {
  const i = Math.min(cams.length - 1, Math.max(0, Math.floor(s)));
  const j = Math.min(cams.length - 1, i + 1);
  return mixCam(cams[i], cams[j], Math.min(1, Math.max(0, s - i)));
}

/** Screen position of a stage point. */
export const project = (v: View, c: Camera, x: number, y: number) => ({ x: (x - c.cx) * c.k + v.w / 2, y: (y - c.cy) * c.k + v.h / 2 });

/** CSS transform placing the stage (origin top-left) under the camera. */
export const cameraTransform = (v: View, c: Camera) =>
  `translate3d(${(v.w / 2 - c.cx * c.k).toFixed(2)}px, ${(v.h / 2 - c.cy * c.k).toFixed(2)}px, 0) scale(${c.k.toFixed(5)})`;
