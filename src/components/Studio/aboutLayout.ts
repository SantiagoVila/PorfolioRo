import { ABOUT } from "@/data/profile";
import type { Insets } from "@/components/safeArea";
import { CAP_REST } from "./sceneLayout";

/**
 * Where the cap is held up and where her portrait lies, on one screen: the
 * two faces (the one the cap is printed with and her photograph) meet eye to
 * eye, at the same size, so one can give way to the other.
 *
 * Both are drawn at no more than their own resolution: the cap at most at the
 * intro's size (its canvas, 1 = the frames' fullest detail on this screen),
 * the portrait at most 1.3 device px per pixel of its file. Whichever is
 * tighter sets the size of the meeting.
 */

/** The cap's printed eyes on frame 0 (frame px): the middle between them, and how far apart. */
export const CAP_EYES = { x: 363.5, y: 170, apart: 117 };
/** The part of the print that is her face, brows to lips (frame px, frame 0). */
export const CAP_FACE = { left: 268, top: 112, right: 459, bottom: 306 };
/** Her eyes in the portrait file (px). */
export const PORTRAIT_EYES = { x: 163.5, y: 150, apart: 163 };

const PORTRAIT_MAX_DEVICE_SCALE = 1.3;
/** The widest the cap's canvas is laid out (the intro): see CapViewer. */
const CANVAS_MAX = 800;
/** The print's white border (px) around the photograph. */
export const PRINT_BORDER = { side: 10, bottom: 10 };
/** Upright screens: the top of the composition (under the way back), and the masthead's row above the print. */
export const UPRIGHT_TOP = 70;
export const MASTHEAD = 38;
/** Short landscape screens: the top of the composition. */
const SHORT_TOP = 58;

type Rect = { x: number; y: number; w: number; h: number };

export interface AboutLayout {
  upright: boolean;
  /** Upright: the masthead's row (its top) and the side margins, clear of a phone's notch and rounded corners. */
  frame: { top: number; left: number; right: number };
  /** A landscape screen with little height (a phone held sideways). */
  short: boolean;
  /** The photograph (the image itself, inside the print's border). */
  photo: Rect;
  /** The cap held up: its layer's scale (1 = intro size) and offset from the screen's centre, facing. */
  cap: { scale: number; x: number; y: number };
  /** The printed face on the held cap, in the print's own coordinates (where her photograph shows first). */
  face: { top: number; right: number; bottom: number; left: number };
  /** The words: left edge, top, width (screen px). */
  text: { x: number; y: number; w: number };
}

const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * `insets`: the screen's safe-area insets (a phone's notch or Dynamic Island,
 * its rounded corners, its home bar; 0 almost everywhere). The way back sits
 * in the top corner clear of them (BackToDesk), so the composition starts that
 * much lower, and keeps as clear of them at the sides and the foot.
 */
export function aboutLayout(w: number, h: number, dpr: number, insets: Insets = NO_INSETS): AboutLayout {
  const upright = w / h < 1;
  const short = !upright && h < 560;
  // The way back is at max(inset, 24 px) from the top: whatever it moves down, the composition does too.
  const drop = Math.max(0, insets.top - 24);
  const frame = { top: UPRIGHT_TOP + drop, left: 22 + insets.left, right: 22 + insets.right };
  const sideL = Math.max(24, w * 0.04, insets.left + 10);
  const sideR = Math.max(24, w * 0.04, insets.right + 10);
  const shortTop = SHORT_TOP + drop;
  const shortBottom = Math.max(20, insets.bottom + 6);
  const canvas = Math.min(w, CANVAS_MAX);
  const perFrame = canvas / CAP_REST.frameWidth; // screen px per frame px, at the intro's size
  const src = ABOUT.portrait;

  // The photograph's width: the cap no larger than its intro size (its eyes as far apart as hers),
  // the portrait no larger than its file allows, and the room there is.
  const byCap = (perFrame * src.width * CAP_EYES.apart) / PORTRAIT_EYES.apart;
  const byFile = (src.width * PORTRAIT_MAX_DEVICE_SCALE) / dpr;
  const b = PRINT_BORDER;
  const byRoom = upright ? (w - insets.left - insets.right) * 0.42 : short ? (h - shortTop - shortBottom - b.side - b.bottom) * (src.width / src.height) : Math.min(w * 0.24, h * 0.42);
  const P = Math.floor(Math.min(byCap, byFile, byRoom));
  const H = Math.round((P * src.height) / src.width);

  let photo: Rect;
  let text: AboutLayout["text"];
  if (upright) {
    // Her masthead across the top; under it the print at the left, her name beside it; her words below.
    photo = { x: frame.left + b.side, y: frame.top + MASTHEAD + b.side, w: P, h: H };
    text = { x: frame.left, y: photo.y + H + b.bottom + 12, w: w - frame.left - frame.right };
  } else if (short) {
    // A phone held sideways: the print at the left, as tall as the screen allows; the words in two columns beside it.
    const top = Math.max(shortTop, Math.round((h - (H + b.side + b.bottom)) / 2));
    photo = { x: sideL + b.side, y: top + b.side, w: P, h: H };
    const x = photo.x + P + b.side + 28;
    // Clear of the way back in the corner above.
    text = { x, y: shortTop + 8, w: w - x - sideR };
  } else {
    // The print and the words side by side, the pair centred.
    const gap = Math.max(40, w * 0.045);
    const tw = Math.min(520, w * 0.36);
    const left = Math.round((w - (P + 2 * b.side + gap + tw)) / 2);
    const top = Math.round(h * 0.5 - (H + b.side + b.bottom) / 2) + b.side;
    photo = { x: left + b.side, y: top, w: P, h: H };
    text = { x: left + P + 2 * b.side + gap, y: Math.max(96, top - b.side), w: tw };
  }

  // Her eyes on screen, and the cap held so its printed eyes are there, as far apart.
  const eyes = { x: photo.x + (PORTRAIT_EYES.x / src.width) * P, y: photo.y + (PORTRAIT_EYES.y / src.width) * P };
  const ppf = (PORTRAIT_EYES.apart * (P / src.width)) / CAP_EYES.apart; // screen px per frame px, held
  const scale = ppf / perFrame;
  const cap = {
    scale,
    x: eyes.x - w / 2 - (CAP_EYES.x - CAP_REST.frameWidth / 2) * ppf,
    y: eyes.y - h / 2 - (CAP_EYES.y - CAP_REST.frameHeight / 2) * ppf,
  };
  // The printed face, in the print's coordinates (the print starts one border out from the photograph).
  const at = (fx: number, fy: number) => ({ x: eyes.x + (fx - CAP_EYES.x) * ppf - (photo.x - b.side), y: eyes.y + (fy - CAP_EYES.y) * ppf - (photo.y - b.side) });
  const tl = at(CAP_FACE.left, CAP_FACE.top);
  const br = at(CAP_FACE.right, CAP_FACE.bottom);
  const pw = P + 2 * b.side;
  const ph = H + b.side + b.bottom;
  const face = { top: tl.y, left: tl.x, right: pw - br.x, bottom: ph - br.y };

  return { upright, frame, short, photo, cap, face, text };
}
