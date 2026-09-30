/**
 * The choreography of the two visits, as shares of one progress value per
 * visit (0 on the desk → 1 in the visit; closing plays it back, faster). Each
 * part of the scene reads its own span of it, with its own easing.
 *
 * ABOUT (the cap): the room recedes while the cap is lifted from its place
 * and held up facing the viewer, at the size of her portrait; her face, which
 * the cap is printed with, gives way to her real face, and the cap falls away
 * around it into the print; then her words.
 *
 * CONTACT (the telephone): answered, its handset comes up off the cradle; the
 * camera leans in, the telephone to the right; the dial's crest takes her
 * colour (connected); the room's light draws in a little, and her card rises
 * out of the telephone and settles beside it; then its lines, the ways to
 * reach her first.
 */

import { cubicBezier } from "framer-motion";

export type Span = readonly [number, number];

export const ABOUT_T = {
  recede: [0, 0.44] as Span,
  /** Lifted and held up; then a beat, held still, facing the viewer. */
  lift: [0, 0.4] as Span,
  /** Her face over the cap's printed one (blurred across, so it reads as one face changing). */
  face: [0.47, 0.54] as Span,
  /** The rest of the cap falls away. */
  capOut: [0.52, 0.66] as Span,
  /** The print opens out from her face. */
  print: [0.53, 0.77] as Span,
  words: [0.7, 1] as Span,
};

export const CONTACT_T = {
  /** Answered: the handset comes up off its cradle. */
  answer: [0, 0.22] as Span,
  /** The camera leans in: the telephone to the right, room beside it for her card. */
  aim: [0.03, 0.55] as Span,
  /** The dial's crest takes her colour: connected. */
  crest: [0.16, 0.32] as Span,
  /** The room's light draws in a little. */
  light: [0.2, 0.6] as Span,
  /** Her card rises out of the telephone and settles beside it. */
  card: [0.2, 0.72] as Span,
  /** Its lines. */
  words: [0.42, 1] as Span,
};

/** Seconds, opening and closing (closing is quicker: the reader has decided). */
export const DURATION = {
  about: { open: 1.7, close: 1.05 },
  contact: { open: 1.35, close: 0.9 },
  /** Reduced motion: a plain crossfade, no travel. */
  reduced: 0.35,
};

/** 0–1 share of `v` through span `[a, b]`. */
export const within = (v: number, [a, b]: Span) => Math.min(1, Math.max(0, (v - a) / (b - a)));
/** Travel on screen (the room receding, a glass rising). */
export const inOut = cubicBezier(0.77, 0, 0.175, 1);
/** An object picked up: it answers the press at once, then settles softly where it is held. */
export const pickUp = cubicBezier(0.45, 0.05, 0.15, 1);
/** Arrivals and things switching on. */
export const out = cubicBezier(0.23, 1, 0.32, 1);
