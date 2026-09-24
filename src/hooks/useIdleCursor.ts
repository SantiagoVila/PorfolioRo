"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Holds the cap still on one frame instead of spinning. Cursor/touch turn it
 * within ±cursorRange frames of that pose; once input stops (after
 * `returnDelay` ms, when the pointer leaves the window, or after a touch
 * ends) it eases back to `frame` and stays there. Can be switched on and off
 * while running; the cap eases to it along the shortest way round.
 */
export interface RestPose {
  /** Frame the cap rests on when nobody is interacting. */
  frame: number;
  cursorRange: number;
  /** Per-frame easing towards the goal (gentler than free cursor mode). */
  easing: number;
  /** Ms without input before returning to the rest frame. */
  returnDelay: number;
}

interface IdleCursorOptions {
  totalFrames: number;
  maxTurn?: number;
  idleSpeed?: number;
  easing?: number;
  idleDelay?: number;
  /** When set, rest on a pose instead of the free 360° idle spin. */
  rest?: RestPose | null;
  /** While resting: whether a touch starting at this point may turn the cap (default: any). */
  acceptTouch?: (x: number, y: number) => boolean;
}

export function useIdleCursor(
  onFrame: (index: number) => void,
  options: IdleCursorOptions
) {
  const {
    totalFrames,
    maxTurn = 16,
    idleSpeed = 0.22,
    easing = 0.38,
    idleDelay = 3200,
    rest = null,
    acceptTouch,
  } = options;

  const N = totalFrames;
  const modeRef = useRef<"idle" | "cursor">("idle");
  const currentRef = useRef(0);
  const targetRef = useRef(0);
  const renderedRef = useRef(-1);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  // Restarts the frame loop when it has gone to sleep (see tick).
  const wakeRef = useRef<() => void>(() => {});

  // Latest callback in a ref so the rAF loop and listeners are set up once,
  // instead of restarting whenever the caller re-renders with a new closure.
  const onFrameRef = useRef(onFrame);
  // Same for the rest pose, so switching it doesn't restart the loop.
  const restRef = useRef(rest);
  const acceptTouchRef = useRef(acceptTouch);
  // A resting cap ignores the rest of a touch that did not start on it.
  const touchIgnoredRef = useRef(false);
  useEffect(() => {
    onFrameRef.current = onFrame;
    restRef.current = rest;
    acceptTouchRef.current = acceptTouch;
    // The pose may have changed (desk ↔ Scene 1): let the loop run to it.
    wakeRef.current();
  });

  const isCoarse =
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)").matches;
  const sensitivity = isCoarse ? 1.9 : 1.0;

  const goCursor = useCallback(
    (clientX: number, clientY: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      let nx = ((clientX / w) * 2 - 1) * sensitivity;
      const ny = (clientY / h) * 2 - 1;
      nx = Math.max(-1, Math.min(1, nx));
      let t = -nx * maxTurn;
      if (Math.abs(ny) > 0.9) {
        t *= 1 - (Math.abs(ny) - 0.9) * 2;
      }
      targetRef.current = t;
    },
    [sensitivity, maxTurn]
  );

  const startCursorMode = useCallback(() => {
    modeRef.current = "cursor";
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    wakeRef.current();
  }, []);

  const scheduleIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      modeRef.current = "idle";
      wakeRef.current();
    }, restRef.current?.returnDelay ?? idleDelay);
  }, [idleDelay]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      startCursorMode();
      goCursor(e.clientX, e.clientY);
      scheduleIdle();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!e.touches?.length) return;
      const accept = acceptTouchRef.current;
      touchIgnoredRef.current = !!restRef.current && !!accept && !accept(e.touches[0].clientX, e.touches[0].clientY);
      if (touchIgnoredRef.current) return;
      startCursorMode();
      goCursor(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches?.length || touchIgnoredRef.current) return;
      startCursorMode();
      goCursor(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
      if (touchIgnoredRef.current) return;
      scheduleIdle();
    };

    // Resting cap: the pointer leaving the window counts as input stopping.
    const handleMouseLeave = () => {
      if (!restRef.current) return;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      modeRef.current = "idle";
      wakeRef.current();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    // Signed distance to `goal` the short way round the frame loop.
    const wrapDiff = (goal: number) => {
      let diff = goal - currentRef.current;
      while (diff > N / 2) diff -= N;
      while (diff < -N / 2) diff += N;
      return diff;
    };

    // One step per animation frame. The free spin (Scene 1, no input) never
    // stops; anything easing towards a pose goes to sleep once it is there,
    // and input, the return timer or a change of pose wakes it again.
    const tick = () => {
      rafRef.current = 0;
      const rp = restRef.current;
      let goal: number | null = null;
      if (rp) {
        // No input: hold the rest frame. Input: the cursor target (±maxTurn)
        // reinterpreted as ±cursorRange around it.
        goal = modeRef.current === "idle" ? rp.frame : rp.frame + (targetRef.current / maxTurn) * rp.cursorRange;
        currentRef.current += wrapDiff(goal) * rp.easing;
      } else if (modeRef.current === "idle") {
        currentRef.current += idleSpeed;
      } else {
        goal = targetRef.current;
        currentRef.current += wrapDiff(goal) * easing;
      }
      const settled = goal !== null && Math.abs(wrapDiff(goal)) < 0.01;
      if (settled) currentRef.current = goal!;

      const idx = ((Math.round(currentRef.current) % N) + N) % N;
      if (idx !== renderedRef.current) {
        renderedRef.current = idx;
        onFrameRef.current(idx);
      }

      if (!settled) rafRef.current = requestAnimationFrame(tick);
    };

    wakeRef.current = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    wakeRef.current();

    return () => {
      wakeRef.current = () => {};
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [N, idleSpeed, easing, maxTurn, goCursor, startCursorMode, scheduleIdle]);

  // Re-emit the frame the loop is currently on (e.g. once the canvas is ready).
  const redraw = useCallback(() => {
    if (renderedRef.current >= 0) onFrameRef.current(renderedRef.current);
  }, []);

  return { redraw };
}
