"use client";

import { useLayoutEffect, useRef, type FocusEvent, type MouseEvent, type PointerEvent } from "react";
import { animate, useMotionValue, type AnimationPlaybackControls, type MotionValue } from "framer-motion";
import type { StageFit } from "@/hooks/useStageFit";
import { DESK_OBJECTS, STAGE_FIT, type DeskObject } from "./sceneLayout";

/**
 * Exploring the desk on a phone: the whole scene (plate, objects, labels, and
 * the cap, see HeroStage) slides under the screen as one piece, driven by a
 * single motion value, `pan` (screen px; 0 = the starting view).
 *
 * Gestures are left to the browser until they show a direction: the scene is
 * `touch-action: pan-y`, so vertical swipes stay native page scrolling (the
 * browser cancels the pointer), and only a clearly horizontal drag moves the
 * desk. A touch that barely moves is still a tap on the object under it; a
 * drag never opens one. On release the desk glides a little and settles; it
 * can be pulled slightly past either end and springs back.
 */

/** Movement (px) before a gesture's direction is decided. */
const SLOP = 10;
/** An ambiguous (diagonal) gesture is given to its dominant axis after this much movement. */
const DIAGONAL = 24;
/** How much one axis must dominate to decide at SLOP. */
const LEAN = 1.2;
/** Furthest the desk can be pulled past either end (px): never far enough to show the plate's edge. */
const OVER = 56;
const MAX_FLING = 2600;

const START_X = STAGE_FIT.explore.startX;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
/** Resistance past the ends: follows the finger less and less, up to OVER. */
const band = (d: number) => (1 - 1 / ((d * 0.55) / OVER + 1)) * OVER;

const centreX = (o: DeskObject) => o.quad.reduce((s, p) => s + p[0], 0) / 4;

/** The cap turns under touches that start on it (see HeroStage); those never pan the desk. */
export function onCap(x: number, y: number) {
  const r = document.querySelector('[data-slot="cap"]')?.getBoundingClientRect();
  return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

/** Stage x to start on: the object of a direct link (?project=id), else the composed starting view. */
function startingX() {
  const id = new URLSearchParams(window.location.search).get("project");
  const obj = DESK_OBJECTS.find((o) => o.id === id);
  return obj ? centreX(obj) : START_X;
}

type Drag = { id: number; x0: number; y0: number; from: number; axis: "x" | "y" | null; samples: [t: number, x: number][] };

export function useDeskPan(fit: StageFit, pan: MotionValue<number>, reduced: boolean) {
  const glide = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef<Drag | null>(null);
  const swallowClick = useRef(false);
  // 0 → 1 once the desk has been dragged (the hint quiets down). A motion
  // value, so the first drag does not re-render the scene.
  const explored = useMotionValue(0);

  // Keep the same part of the desk in view when the screen changes size or
  // turns (or leaves/enters exploring): the stage x at the centre is carried over.
  const last = useRef<{ scale: number; explore: boolean; cx: number | null }>({ scale: 1, explore: false, cx: null });
  useLayoutEffect(() => {
    if (!fit.ready) return;
    const prev = last.current;
    glide.current?.stop();
    const current = prev.explore ? START_X - pan.get() / prev.scale : prev.cx;
    if (!fit.explore) {
      last.current = { scale: fit.scale, explore: false, cx: current };
      pan.set(0);
      return;
    }
    last.current = { scale: fit.scale, explore: true, cx: null };
    pan.set(clamp((START_X - (current ?? startingX())) * fit.scale, fit.explore.min, fit.explore.max));
  }, [fit, pan]);

  const range = fit.explore;

  const settle = (velocity: number) => {
    if (!range) return;
    glide.current?.stop();
    if (reduced) {
      pan.set(clamp(pan.get(), range.min, range.max));
      return;
    }
    // Inertia starts from the current value and ignores the target, but framer
    // skips an animation whose target equals the current value: pass any other.
    glide.current = animate(pan, pan.get() + 1, {
      type: "inertia",
      velocity: clamp(velocity, -MAX_FLING, MAX_FLING),
      min: range.min,
      max: range.max,
      power: 0.28,
      timeConstant: 260,
      // Critically damped: back to the end without wobbling.
      bounceStiffness: 400,
      bounceDamping: 40,
      restDelta: 0.5,
    });
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    swallowClick.current = false;
    if (!range || !e.isPrimary || e.button !== 0 || onCap(e.clientX, e.clientY)) return;
    glide.current?.stop();
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, from: pan.get(), axis: null, samples: [] };
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id || !range) return;
    if (!d.axis) {
      const dx = Math.abs(e.clientX - d.x0);
      const dy = Math.abs(e.clientY - d.y0);
      const dist = Math.hypot(dx, dy);
      if (dist < SLOP) return;
      if (dx > dy * LEAN || (dist >= DIAGONAL && dx > dy)) d.axis = "x";
      else if (dy > dx * LEAN || dist >= DIAGONAL) d.axis = "y";
      else return;
      if (d.axis === "y") {
        // The page's own vertical scroll (or nothing, for a mouse): not ours.
        drag.current = null;
        return;
      }
      // Horizontal: the desk follows from here, without jumping by the slop.
      d.x0 = e.clientX;
      e.currentTarget.setPointerCapture(e.pointerId);
      if (explored.get() === 0) animate(explored, 1, { duration: reduced ? 0 : 0.7 });
    }
    const raw = d.from + e.clientX - d.x0;
    const x = reduced
      ? clamp(raw, range.min, range.max)
      : raw < range.min
        ? range.min - band(range.min - raw)
        : raw > range.max
          ? range.max + band(raw - range.max)
          : raw;
    pan.set(x);
    d.samples.push([e.timeStamp, x]);
    if (d.samples.length > 8) d.samples.shift();
  };

  const end = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (d.axis !== "x") return;
    // A drag is never a tap: swallow the click it would end in.
    swallowClick.current = e.type === "pointerup";
    // Release speed over the last ~100 ms (none if the finger had stopped).
    const recent = d.samples.filter(([t]) => e.timeStamp - t <= 100);
    let velocity = 0;
    if (recent.length >= 2) {
      const [t0, x0] = recent[0];
      const [t1, x1] = recent[recent.length - 1];
      if (t1 > t0) velocity = ((x1 - x0) / (t1 - t0)) * 1000;
    }
    settle(velocity);
  };

  const onClickCapture = (e: MouseEvent<HTMLElement>) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    e.stopPropagation();
    e.preventDefault();
  };

  // Keyboard: an object reached with Tab slides fully into view.
  const onFocus = (e: FocusEvent<HTMLElement>) => {
    if (!range) return;
    const el = e.target;
    const obj = DESK_OBJECTS.find((o) => o.id === el.closest<HTMLElement>("[data-object-id]")?.dataset.objectId);
    if (!obj || !el.matches(":focus-visible")) return;
    const xs = obj.quad.map((p) => p[0]);
    const at = (x: number) => fit.x + pan.get() + x * fit.scale;
    const lo = at(Math.min(...xs));
    const hi = at(Math.max(...xs));
    const margin = 20;
    const shift = lo < margin ? margin - lo : hi > fit.viewportWidth - margin ? fit.viewportWidth - margin - hi : 0;
    if (!shift) return;
    const to = clamp(pan.get() + shift, range.min, range.max);
    glide.current?.stop();
    if (reduced) pan.set(to);
    else glide.current = animate(pan, to, { duration: 0.55, ease: [0.3, 0, 0.2, 1] });
  };

  return {
    explored,
    bind: range
      ? { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end, onClickCapture, onFocus }
      : {},
  };
}
