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
 */
export function useStageFit(
  containerRef: RefObject<HTMLElement | null>,
  { width, height, safeLeft, safeRight, safeTop, safeBottom, focusX }: StageFitOptions
): StageFit {
  const [fit, setFit] = useState<StageFit>({
    scale: 1, x: 0, y: 0, viewportWidth: 0, viewportHeight: 0, ready: false,
  });

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
      const scale = Math.min(cover, cw / (safeRight - safeLeft), ch / (safeBottom - safeTop));
      const sw = width * scale;
      const sh = height * scale;

      const x = sw > cw ? clamp(cw / 2 - focusX * scale, cw - sw, 0) : (cw - sw) / 2;
      const y = sh > ch ? clamp(ch / 2 - safeMid * scale, ch - sh, 0) : (ch - sh) / 2;

      setFit({ scale, x, y, viewportWidth: cw, viewportHeight: ch, ready: true });
    };

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, width, height, safeLeft, safeRight, safeTop, safeBottom, focusX]);

  return fit;
}
