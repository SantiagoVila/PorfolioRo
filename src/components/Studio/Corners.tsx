import type { Quad } from "./sceneLayout";

/**
 * Four zero-size markers at an object's corners (TL, TR, BR, BL). Measuring
 * them gives the object's exact on-screen quad, including the desk
 * perspective, hover lift and any scene transform, so a transition can start
 * (and end) exactly where the physical object is.
 */
export function Corners() {
  return (
    <>
      <span data-corner="0" aria-hidden className="absolute left-0 top-0 w-0 h-0 pointer-events-none" />
      <span data-corner="1" aria-hidden className="absolute right-0 top-0 w-0 h-0 pointer-events-none" />
      <span data-corner="2" aria-hidden className="absolute right-0 bottom-0 w-0 h-0 pointer-events-none" />
      <span data-corner="3" aria-hidden className="absolute left-0 bottom-0 w-0 h-0 pointer-events-none" />
    </>
  );
}

/** Screen-space quad of an element that renders <Corners />, or null if it has none. */
export function measureCorners(el: Element | null): Quad | null {
  if (!el) return null;
  const pts = [0, 1, 2, 3].map((i) => el.querySelector(`[data-corner="${i}"]`)?.getBoundingClientRect());
  if (pts.some((p) => !p)) return null;
  return pts.map((p) => [p!.left, p!.top]) as Quad;
}
