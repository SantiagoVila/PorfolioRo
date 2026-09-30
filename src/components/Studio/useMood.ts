"use client";

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { animate, useMotionValue, type MotionValue } from "framer-motion";
import { LIGHT_CHANGE_MS, lightState, subscribeLight, type LightState, type Mood } from "./mood";

/** The visit's light and how it was chosen (see mood.ts): null on the server and while hydrating. */
export function useLight(): LightState | null {
  return useSyncExternalStore(subscribeLight, lightState, () => null);
}

/** The visit's light (see mood.ts): null on the server and while hydrating. */
export function useMood(): Mood | null {
  return useLight()?.mood ?? null;
}

/**
 * The room changing light: the light it is changing from, and how far it has
 * come (0 → 1 over LIGHT_CHANGE_MS, eased). For values that are mixed from one
 * light to the next (the cap's grade, the name's paint strength); CSS does the
 * rest with transitions. At rest `from` is the light itself and the progress 1.
 */
export function useLightChange(mood: Mood | null): { from: MotionValue<Mood>; t: MotionValue<number> } {
  const from = useMotionValue<Mood>(mood ?? "day");
  const t = useMotionValue(1);
  const shown = useRef<Mood | null>(mood);
  // Before the frame is drawn: the new light's first frame is the old one's.
  useLayoutEffect(() => {
    if (!mood || shown.current === mood) return;
    // The light first known (after hydrating): nothing changes, it simply is.
    if (shown.current === null) {
      shown.current = mood;
      from.set(mood);
      return;
    }
    // From wherever the last change had got to: its target is where this one starts.
    from.set(shown.current);
    shown.current = mood;
    t.set(0);
    const c = animate(t, 1, { duration: LIGHT_CHANGE_MS / 1000, ease: [0.45, 0, 0.25, 1] });
    return () => c.stop();
  }, [mood, from, t]);
  return { from, t };
}
