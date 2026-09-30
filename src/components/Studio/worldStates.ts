/**
 * The portfolio's one continuous scene and its two states, in page scroll.
 *
 * The page scrolls from Rosario's name and the cap (INTRO) down to the desk
 * (WORK), and ends there: the desk is where everything else is reached, from
 * its objects. The books open her projects, the cap opens Rosario herself and
 * the phone the way to reach her (see useVisit). `s` runs 0 → 1; each state
 * holds for a stretch of scroll.
 *
 * Positions are in screens of scroll (window heights).
 */

export const STATES = ["intro", "work"] as const;

/** Scroll (in screens) where each hold starts and ends, and where the transition runs. */
const STOPS = [0, 0.15, 1.3, 1.6];
const VALUES = [0, 0, 1, 1];
/** Total scroll range, in screens; the page is one screen taller than this. */
export const SCROLL_SCREENS = STOPS[STOPS.length - 1];

/** Where each state is seen: the intro at the very top, the desk at the end. */
const HOME = [0, SCROLL_SCREENS];

/** State progress `s` (0–1) for a fraction of the page's scroll range (0–1). */
export function stateAt(fraction: number) {
  const x = Math.min(1, Math.max(0, fraction)) * SCROLL_SCREENS;
  for (let i = 1; i < STOPS.length; i++) {
    if (x <= STOPS[i]) {
      const a = STOPS[i - 1];
      const b = STOPS[i];
      const k = b > a ? (x - a) / (b - a) : 0;
      return VALUES[i - 1] + (VALUES[i] - VALUES[i - 1]) * k;
    }
  }
  return VALUES[VALUES.length - 1];
}

/** Fraction of the scroll range for a state progress `s`: a whole state goes to its home, a fraction into its transition. */
export function fractionFor(s: number) {
  const whole = Math.round(s);
  if (Math.abs(s - whole) < 1e-3) return HOME[whole] / SCROLL_SCREENS;
  for (let i = 1; i < STOPS.length; i++) {
    const [v0, v1] = [VALUES[i - 1], VALUES[i]];
    if (v1 > v0 && s >= v0 && s <= v1) return (STOPS[i - 1] + ((s - v0) / (v1 - v0)) * (STOPS[i] - STOPS[i - 1])) / SCROLL_SCREENS;
  }
  return 1;
}

/** The page's scroll range right now. */
export const scrollRange = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

/** Window scroll position of a state (its home). */
export const stateScrollY = (state: number) => fractionFor(state) * scrollRange();

/** Eased progress inside each transition (holds stay flat): the camera accelerates out of a state and settles into the next. */
export function eased(s: number) {
  const i = Math.floor(s);
  const f = s - i;
  if (f <= 0) return s;
  // Smoothstep: it settles into each state and leaves it gently, but moves at no
  // more than 1.5× the scroll's own pace on the way (a cubic curve reached 3×,
  // which made each change happen all at once, in a narrow band of scroll).
  return i + f * f * (3 - 2 * f);
}
