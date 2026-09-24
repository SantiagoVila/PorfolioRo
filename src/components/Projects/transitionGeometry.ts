import { DESK_OBJECTS, type Quad } from "@/components/Studio/sceneLayout";

/**
 * Geometry of the object → project transition. Progress `t`:
 *   0 = lying on the desk (its measured on-screen quad)
 *   1 = "held": upright, centred, facing the viewer
 *   2 = "fill": scaled until it covers the screen (the project's first frame)
 */

export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Proportions of a desk object's face: the box it fills the screen with at
 * t = 2. A book's experience frames its opening cover in exactly this box, so
 * the hand-off lands on the same pixels.
 */
export function handoffAspect(id: string) {
  const o = DESK_OBJECTS.find((d) => d.id === id)!;
  return o.width / o.height;
}

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpQuad(a: Quad, b: Quad, t: number): Quad {
  return a.map(([x, y], i) => [lerp(x, b[i][0], t), lerp(y, b[i][1], t)]) as Quad;
}

export function rectQuad({ x, y, width, height }: Rect): Quad {
  return [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
}

/** Held up to the viewer: centred, as large as fits comfortably, same aspect as the object. */
export function heldRect(aspect: number, vw: number, vh: number): Rect {
  const height = Math.min(vh * 0.72, (vw * 0.78) / aspect);
  const width = height * aspect;
  return { x: (vw - width) / 2, y: (vh - height) / 2, width, height };
}

/** Covering the screen, centred (the same crop as `object-fit: cover`). */
export function fillRect(aspect: number, vw: number, vh: number): Rect {
  const width = Math.max(vw, vh * aspect);
  const height = width / aspect;
  return { x: (vw - width) / 2, y: (vh - height) / 2, width, height };
}
