/**
 * The desk as the studio's photographs see it (all three lights share one
 * camera: see sceneLayout). Their camera is a pinhole with no tilt: its
 * horizon at y 275, the vanishing point of the desk's depth at (836, 275)
 * (the window's sill and the side wall's foot converge there), a focal length
 * of 1400 px (the terrazzo's chips, the lamp's base and the tray are
 * foreshortened by (y − 275) / 1400). Measured in "wall px" (1 px at the wall),
 * the camera stands 1400 from the wall and 245 above the desk; a point of the
 * desk X across and Z deep is at (836 + 1400·X/Z, 275 + 343000/Z).
 *
 * Things lying on the desk are placed by where their middle is on the
 * photograph (its x at its depth), their size in wall px and a turn in the
 * desk's plane; their corners are projected through the camera, so they lie
 * as the tray lies: the true, low perspective of the photographs.
 */

export type Pt = [x: number, y: number];
export type Corners = [Pt, Pt, Pt, Pt];

export const CAMERA = { cx: 836, horizon: 275, focal: 1400, eye: 245, wall: 1400 };

/** Screen point (stage px) of the desk point X across (wall px from the camera's axis), Z deep. */
export const onDesk = (X: number, Z: number): Pt => [CAMERA.cx + (CAMERA.focal * X) / Z, CAMERA.horizon + (CAMERA.focal * CAMERA.eye) / Z];

/** Depth of the desk at stage row y (y below the horizon). */
export const depthAt = (y: number) => (CAMERA.focal * CAMERA.eye) / (y - CAMERA.horizon);

/** Stage px per wall px, across, at depth Z. */
export const scaleAt = (Z: number) => CAMERA.focal / Z;

export type Lying = {
  /** Stage x of its middle, and its middle's depth (wall px from the camera). */
  x: number;
  z: number;
  /** Width across and length in depth (wall px), as it lies before its turn. */
  w: number;
  l: number;
  /** Its turn in the desk's plane, degrees (positive: its far edge turns to the right). */
  turn: number;
};

/**
 * The face of something lying on the desk, as the photographs' camera sees it:
 * TL, TR, BR, BL of the face, its top edge the far one (its foot towards the
 * viewer, as a magazine set down to be read).
 */
export function lying({ x, z, w, l, turn }: Lying): Corners {
  const X0 = ((x - CAMERA.cx) * z) / CAMERA.focal;
  const a = (turn * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  // Corner offsets (across, deep) in its own frame: far edge first.
  const local: Pt[] = [[-w / 2, l / 2], [w / 2, l / 2], [w / 2, -l / 2], [-w / 2, -l / 2]];
  return local.map(([u, v]) => onDesk(X0 + u * c + v * s, z - u * s + v * c)) as Corners;
}

/** Where its foot's middle is on the desk (for a label just in front of it). */
export function footOf(q: Corners): Pt {
  return [(q[2][0] + q[3][0]) / 2, (q[2][1] + q[3][1]) / 2];
}

/**
 * How tall something `height` wall px tall looks standing at the foot of a
 * lying face (its thickness, seen edge on): in stage px.
 */
export function edgeOnScreen(q: Corners, height: number) {
  const footY = (q[2][1] + q[3][1]) / 2;
  return height * scaleAt(depthAt(footY));
}
