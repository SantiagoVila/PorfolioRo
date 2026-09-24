"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/** Visible area of an experience's own scroll container (`w`, `h`) and its full width including the scrollbar (`fw`). */
export type Box = { w: number; h: number; fw: number };

/** Size of `ref`, kept up to date; the screen until it is measured. */
export function useBox(ref: RefObject<HTMLElement | null>): Box {
  const [box, setBox] = useState<Box>(() => ({ w: window.innerWidth, h: window.innerHeight, fw: window.innerWidth }));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight, fw: el.offsetWidth }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}
