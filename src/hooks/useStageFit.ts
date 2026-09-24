"use client";

import { RefObject, useLayoutEffect, useState } from "react";

interface StageFitOptions {
  width: number;
  height: number;
  /** Horizontal stage range that must stay visible, even if that means letterboxing. */
  safeLeft: number;
  safeRight: number;
  /** Vertical stage range that must stay visible (wall lettering down to the labels). */
  safeTop: number;
  safeBottom: number;
  /** Stage x kept centred when the stage is cropped horizontally. */
  focusX: number;
  /** Small screens: show the stage larger than the screen and let it be explored instead. */
  explore?: {
    /** Explore when fitting the safe box would scale the stage below this. */
    below: number;
    /** Stage width in view while exploring. */
    span: number;
    /** Stage x at the centre of the starting view. */
    startX: number;
    /** Stage x range the view may travel over. */
    left: number;
    right: number;
  };
}

export interface StageFit {
  scale: number;
  /** Stage origin inside the container, in container pixels. */
  x: number;
  y: number;
  /** Container size the fit was computed for. */
  viewportWidth: number;
  viewportHeight: number;
  ready: boolean;
  /**
   * Set when the stage is explored instead of fitted: the range of the
   * horizontal pan (container px, added to `x`; 0 = the starting view).
   */
  explore: { min: number; max: number } | null;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Scales a fixed-size stage to its container like `object-fit: cover`, but
 * never so much that the safe box (safeLeft–safeRight × safeTop–safeBottom)
 * is cropped:
 *  - narrow/portrait screens: the width limit wins; the stage is centred
 *    with bands above and below;
 *  - ultra-wide screens: the height limit wins, so lettering, objects and
 *    labels all stay in view; the stage is centred with bands left and right.
 * Within those limits the stage is positioned to centre the safe box.
 *
 * With `explore`, screens too narrow for that to stay legible (phones held
 * upright) get a larger stage that crops horizontally: `span` stage px in
 * view, starting around `startX`, panned by the scene within `explore`.
 */
export function useStageFit(
  containerRef: RefObject<HTMLElement | null>,
  { width, height, safeLeft, safeRight, safeTop, safeBottom, focusX, explore }: StageFitOptions
): StageFit {
  const [fit, setFit] = useState<StageFit>({
    scale: 1, x: 0, y: 0, viewportWidth: 0, viewportHeight: 0, ready: false, explore: null,
  });
  const { below, span, startX, left, right } = explore ?? {};

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      // Layout size, unaffected by ancestor transforms (e.g. the scroll-in scale).
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (!cw || !ch) return;

      const safeMid = (safeTop + safeBottom) / 2;
      const cover = Math.max(cw / width, ch / height);
      const fitted = Math.min(cover, cw / (safeRight - safeLeft), ch / (safeBottom - safeTop));

      if (below !== undefined && span && startX !== undefined && left !== undefined && right !== undefined && fitted < below) {
        // Exploring: `span` across, but the safe box's height must still fit.
        const scale = Math.min(cw / span, (ch * 0.9) / (safeBottom - safeTop));
        const sh = height * scale;
        const y = sh > ch ? clamp(ch / 2 - safeMid * scale, ch - sh, 0) : (ch - sh) / 2;
        // Pan p shows stage x = startX - p / scale at the centre of the screen.
        const half = cw / (2 * scale);
        let min = (startX - (right - half)) * scale;
        let max = (startX - (left + half)) * scale;
        if (min > max) min = max = (min + max) / 2;
        setFit({ scale, x: cw / 2 - startX * scale, y, viewportWidth: cw, viewportHeight: ch, ready: true, explore: { min, max } });
        return;
      }

      const scale = fitted;
      const sw = width * scale;
      const sh = height * scale;

      const x = sw > cw ? clamp(cw / 2 - focusX * scale, cw - sw, 0) : (cw - sw) / 2;
      const y = sh > ch ? clamp(ch / 2 - safeMid * scale, ch - sh, 0) : (ch - sh) / 2;

      setFit({ scale, x, y, viewportWidth: cw, viewportHeight: ch, ready: true, explore: null });
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, width, height, safeLeft, safeRight, safeTop, safeBottom, focusX, below, span, startX, left, right]);

  return fit;
}
