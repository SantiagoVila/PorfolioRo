import { ABOUT } from "@/data/profile";

/** Her colour: the dial's crest when the call is answered (and the accent of the Contact card). */
export const SCREEN_ON = ABOUT.palette[0].hex;

/**
 * The telephone's ring, as keyframes for one cycle: a double ring (two short
 * bursts, as an old bell rings), then a pause of a little over two seconds;
 * again and again, until it is first answered (the page decides when it rings).
 *
 * In each burst the handset rattles in its cradle, rocking about the end its
 * cord leaves from (so the cord stays on it) by about three degrees, its
 * earpiece end hopping a little; the whole telephone buzzes sideways by about
 * a screen pixel and a half, and its shadow answers by less; its dial's crest
 * glows in her colour (`glow`, an opacity), as a lamp would on a switchboard.
 * Each burst swells and fades (never snapping on or off); the rattle is faster
 * than frames can show evenly, so it reads as a buzz, not a wobble. Values in
 * stage px (the telephone's layers are drawn in the stage).
 *
 * With reduced motion nothing moves: the crest takes her colour with each
 * ring (`crest`, an opacity), and lets it go.
 */
export function ringFrames() {
  const period = 3600;
  const bursts: [number, number][] = [
    [0, 440],
    [700, 1140],
  ];
  const half = 40;
  const still = { body: "translate(0px, 0px)", handset: "rotate(0deg) translateY(0px)", shadow: "translate(0px, 0px)" };
  const body: Keyframe[] = [{ offset: 0, transform: still.body }];
  const handset: Keyframe[] = [{ offset: 0, transform: still.handset }];
  const shadow: Keyframe[] = [{ offset: 0, transform: still.shadow }];
  const crest: Keyframe[] = [{ offset: 0, opacity: 0 }];
  const glow: Keyframe[] = [{ offset: 0, opacity: 0 }];
  for (const [a, b] of bursts) {
    for (const k of [body, handset, shadow]) k.push({ offset: a / period, transform: k === body ? still.body : k === handset ? still.handset : still.shadow });
    let sign = 1;
    for (let t = a + half; t < b; t += half) {
      const env = Math.sin((Math.PI * (t - a)) / (b - a));
      body.push({ offset: t / period, transform: `translate(${(sign * 1.4 * env).toFixed(3)}px, 0px)` });
      handset.push({ offset: t / period, transform: `rotate(${(sign * 3 * env).toFixed(3)}deg) translateY(${(-1.2 * env).toFixed(3)}px)` });
      shadow.push({ offset: t / period, transform: `translate(${(sign * 0.55 * env).toFixed(3)}px, 0px)` });
      sign = -sign;
    }
    body.push({ offset: b / period, transform: still.body });
    handset.push({ offset: b / period, transform: still.handset });
    shadow.push({ offset: b / period, transform: still.shadow });
    crest.push({ offset: a / period, opacity: 0 }, { offset: (a + 90) / period, opacity: 0.55 }, { offset: (b - 60) / period, opacity: 0.55 }, { offset: (b + 180) / period, opacity: 0 });
    glow.push({ offset: a / period, opacity: 0 }, { offset: (a + 120) / period, opacity: 0.5 }, { offset: (b - 80) / period, opacity: 0.5 }, { offset: (b + 220) / period, opacity: 0 });
  }
  body.push({ offset: 1, transform: still.body });
  handset.push({ offset: 1, transform: still.handset });
  shadow.push({ offset: 1, transform: still.shadow });
  crest.push({ offset: 1, opacity: 0 });
  glow.push({ offset: 1, opacity: 0 });
  // A short calm after the desk comes into view (or after a hand has left it) before it rings.
  return { period, body, handset, shadow, crest, glow, delay: 900 };
}
