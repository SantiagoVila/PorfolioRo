import type { Quad } from "./sceneLayout";

/**
 * CSS matrix3d that maps a `width × height` box (transform-origin 0 0) onto
 * `quad` (TL, TR, BR, BL). This is a 2D projective transform (homography),
 * which is what makes a flat cover sit on the desk with the reference's
 * exact perspective, instead of an approximated rotateX/rotateZ.
 */
export function quadToMatrix3d(width: number, height: number, quad: Quad): string {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;

  // Unit square → quad (Heckbert, "Fundamentals of Texture Mapping").
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;

  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;

  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;

  // Pre-scale so the box's pixel coordinates map through the unit square.
  const sx = 1 / width;
  const sy = 1 / height;

  // Column-major.
  return `matrix3d(${[
    a * sx, d * sx, 0, g * sx,
    b * sy, e * sy, 0, h * sy,
    0, 0, 1, 0,
    x0, y0, 0, 1,
  ].join(",")})`;
}

/** The point of `quad` at (u, v) of the unit square it is mapped from (u, v may run past 0–1: the same plane carries on). */
export function quadPoint(quad: Quad, u: number, v: number): [number, number] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  const w = g * u + h * v + 1;
  return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w];
}
