"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, MotionValue, useMotionValue, useReducedMotion } from "framer-motion";
import type { AnimationPlaybackControls } from "framer-motion";
import { PROJECTS } from "@/data/projectsData";
import { DESK_OBJECTS } from "@/components/Studio/sceneLayout";
import { measureCorners } from "@/components/Studio/Corners";
import type { Quad } from "@/components/Studio/sceneLayout";
import { loadExperience } from "./experiences";

/**
 * Opening a desk object and returning to it.
 *
 * One motion value, `t`, drives the whole thing (see transitionGeometry):
 * 0 on the desk → 1 held up → 2 filling the screen. Opening animates t to 2,
 * then fades the project shell in; closing fades the shell out and animates t
 * back to 0, landing on the object's *live* position on the desk. Every run
 * gets a sequence number, so a newer action (close mid-open, reopen
 * mid-close, browser back) cleanly takes over from wherever t is.
 *
 * The Studio Scene is never unmounted: scroll position, cap and desk state
 * survive. The URL mirrors the open project (?project=id) with the native
 * History API, so browser back/forward and direct links work without a
 * routing rewrite.
 */

export type Phase = "idle" | "opening" | "open" | "closing";

export interface ActiveObject {
  id: string;
  kind: "book" | "newspaper";
  label: string;
  category: string;
  coverImage?: string;
  /** Unprojected face size on the desk (aspect of the object). */
  width: number;
  height: number;
}

export interface ProjectTransition {
  t: MotionValue<number>;
  shellOpacity: MotionValue<number>;
  phase: Phase;
  active: ActiveObject | null;
  /** Desk object currently lifted off the desk (hidden there while its double travels). */
  liftedId: string | null;
  /** Whether the project shell (and its experience) is mounted. */
  shellMounted: boolean;
  reducedMotion: boolean;
  /** Live on-screen quad of the active object on the desk. */
  deskQuad: () => Quad | null;
  open: (id: string, el: HTMLElement) => void;
  /** Close from the UI: goes through history so browser back stays consistent. */
  requestClose: () => void;
  /** The travelling double has painted its first frame; the desk object may now hide. */
  cloneReady: () => void;
}

/** Exported so an experience with nested states (THE DAILY's stories) can extend the same entries. */
export const URL_PARAM = "project";
export const HISTORY_KEY = "rmProject";

// Segment A = desk ↔ held (0–1), segment B = held ↔ fill (1–2).
const TIMING = {
  open: {
    A: { duration: 0.85, ease: [0.65, 0, 0.2, 1] as const },
    B: { duration: 0.7, ease: [0.7, 0, 0.12, 1] as const },
  },
  close: {
    B: { duration: 0.6, ease: [0.45, 0, 0.25, 1] as const },
    A: { duration: 0.85, ease: [0.35, 0, 0.15, 1] as const },
  },
  shellIn: 0.45,
  shellOut: 0.3,
  reduced: 0.35,
};

function describe(id: string): ActiveObject | null {
  const desk = DESK_OBJECTS.find((o) => o.id === id);
  const project = PROJECTS[id];
  if (!desk || !project) return null;
  return {
    id,
    kind: desk.kind,
    label: desk.label,
    category: project.category,
    coverImage: project.coverImage,
    width: desk.width,
    height: desk.height,
  };
}

const nextFrames = (n: number) =>
  new Promise<void>((resolve) => {
    const step = (left: number) => (left <= 0 ? resolve() : requestAnimationFrame(() => step(left - 1)));
    step(n);
  });

const deskElement = (id: string) =>
  document.querySelector<HTMLElement>(`[data-object-id="${id}"] [role=button]`);

export function useProjectTransition(): ProjectTransition {
  const t = useMotionValue(0);
  const shellOpacity = useMotionValue(0);
  const reducedMotion = !!useReducedMotion();

  const [phase, setPhaseState] = useState<Phase>("idle");
  const [active, setActive] = useState<ActiveObject | null>(null);
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const [shellMounted, setShellMounted] = useState(false);

  const phaseRef = useRef<Phase>("idle");
  const activeRef = useRef<ActiveObject | null>(null);
  const elRef = useRef<HTMLElement | null>(null);
  const originRef = useRef<Quad | null>(null);
  const seqRef = useRef(0);
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);
  const shellControlsRef = useRef<AnimationPlaybackControls | null>(null);
  const pendingStartRef = useRef<(() => void) | null>(null);
  const reducedRef = useRef(reducedMotion);
  useEffect(() => {
    reducedRef.current = reducedMotion;
  });

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const deskQuad = useCallback((): Quad | null => {
    const live = measureCorners(elRef.current);
    if (live) originRef.current = live;
    return originRef.current;
  }, []);

  /** Animate t to 0 or 2 through the held pose, segment by segment. False if superseded. */
  const run = useCallback(
    async (target: 0 | 2, seq: number) => {
      controlsRef.current?.stop();
      if (reducedRef.current) {
        const c = animate(t, target, { duration: TIMING.reduced, ease: "linear" });
        controlsRef.current = c;
        await c.finished;
        return seq === seqRef.current;
      }
      const forward = target > t.get();
      for (const stop of forward ? [1, 2] : [1, 0]) {
        const from = t.get();
        if (forward ? from >= stop : from <= stop) continue;
        const inA = forward ? stop === 1 : stop === 0;
        const seg = forward ? (inA ? TIMING.open.A : TIMING.open.B) : inA ? TIMING.close.A : TIMING.close.B;
        const c = animate(t, stop, { duration: seg.duration * Math.abs(stop - from), ease: [...seg.ease] });
        controlsRef.current = c;
        await c.finished;
        if (seq !== seqRef.current) return false;
      }
      return seq === seqRef.current;
    },
    [t]
  );

  const fadeShell = useCallback(
    async (to: 0 | 1, seq: number) => {
      shellControlsRef.current?.stop();
      if (shellOpacity.get() === to) return seq === seqRef.current;
      const c = animate(shellOpacity, to, { duration: to ? TIMING.shellIn : TIMING.shellOut, ease: "easeOut" });
      shellControlsRef.current = c;
      await c.finished;
      return seq === seqRef.current;
    },
    [shellOpacity]
  );

  const finishClosed = useCallback(() => {
    setPhase("idle");
    setActive(null);
    activeRef.current = null;
    setLiftedId(null);
    setShellMounted(false);
    t.set(0);
    shellOpacity.set(0);
  }, [setPhase, t, shellOpacity]);

  const openTo = useCallback(
    async (seq: number) => {
      setPhase("opening");
      if (!(await run(2, seq))) return;
      // The project's code: normally fetched long before (preloadExperiences);
      // if not, the filled frame (its own first frame) simply holds until it is.
      await loadExperience(activeRef.current!.id).catch(() => {});
      if (seq !== seqRef.current) return;
      // Mount the project only once the screen is filled and still: its first
      // render is the one expensive moment, and here it can't cause a hitch in
      // the flight. Its hero is the image already on screen, so it's cached.
      setShellMounted(true);
      await nextFrames(2);
      if (seq !== seqRef.current) return;
      setPhase("open");
      await fadeShell(1, seq);
    },
    [run, fadeShell, setPhase]
  );

  const close = useCallback(async () => {
    if (phaseRef.current === "idle" || phaseRef.current === "closing") return;
    const seq = ++seqRef.current;
    pendingStartRef.current = null;
    controlsRef.current?.stop();
    setPhase("closing");
    if (!(await fadeShell(0, seq))) return;
    if (!(await run(0, seq))) return;
    finishClosed();
  }, [fadeShell, run, finishClosed, setPhase]);

  const open = useCallback(
    (id: string, el: HTMLElement, { push = true } = {}) => {
      // Clicking the same object again while it is flying back: turn around.
      if (phaseRef.current === "closing" && activeRef.current?.id === id) {
        const seq = ++seqRef.current;
        if (push) window.history.pushState({ [HISTORY_KEY]: id }, "", `?${URL_PARAM}=${id}`);
        void openTo(seq);
        return;
      }
      if (phaseRef.current !== "idle") return;
      const obj = describe(id);
      if (!obj) return;

      const seq = ++seqRef.current;
      elRef.current = el;
      originRef.current = measureCorners(el);
      activeRef.current = obj;
      setActive(obj);
      setPhase("opening");
      if (push) window.history.pushState({ [HISTORY_KEY]: id }, "", `?${URL_PARAM}=${id}`);

      const start = () => {
        if (seq !== seqRef.current) return;
        if (!reducedRef.current) setLiftedId(id);
        void openTo(seq);
      };
      // Wait for the travelling double to paint before hiding the real object,
      // so the swap is invisible. Reduced motion has no double.
      if (reducedRef.current) start();
      else pendingStartRef.current = start;
    },
    [openTo, setPhase]
  );

  const cloneReady = useCallback(() => {
    const start = pendingStartRef.current;
    pendingStartRef.current = null;
    start?.();
  }, []);

  const requestClose = useCallback(() => {
    const id = activeRef.current?.id;
    if (id && window.history.state?.[HISTORY_KEY] === id) {
      window.history.back(); // popstate → close()
    } else {
      window.history.replaceState(null, "", window.location.pathname);
      void close();
    }
  }, [close]);

  // Escape leaves the project, and also cancels an opening mid-flight.
  const escapable = phase === "opening" || phase === "open";
  useEffect(() => {
    if (!escapable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [escapable, requestClose]);

  // Browser back / forward.
  useEffect(() => {
    const onPop = () => {
      const id = new URLSearchParams(window.location.search).get(URL_PARAM);
      if (!id) {
        void close();
      } else if (phaseRef.current === "idle" || activeRef.current?.id === id) {
        const el = deskElement(id);
        if (el) open(id, el, { push: false });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [close, open]);

  // Direct link (?project=id): open straight into the project with the desk
  // underneath, so closing flies the object back to its place.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get(URL_PARAM);
    const obj = id ? describe(id) : null;
    if (!id || !obj) return;
    window.scrollTo(0, document.documentElement.scrollHeight);
    const seq = ++seqRef.current;
    elRef.current = deskElement(id);
    activeRef.current = obj;
    t.set(2);
    /* eslint-disable react-hooks/set-state-in-effect -- one-off sync from the URL on load */
    setActive(obj);
    setLiftedId(id);
    setPhase("opening");
    /* eslint-enable react-hooks/set-state-in-effect */
    // The project is shown once its code is here (the filled frame holds meanwhile).
    void loadExperience(id)
      .catch(() => {})
      .then(() => {
        if (seq !== seqRef.current) return;
        setShellMounted(true);
        setPhase("open");
        void fadeShell(1, seq);
      });
    // Mount-only: the URL is read once; later changes arrive through popstate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Freeze page scroll while a project is involved; the desk must not move under
  // it. A class (see globals.css) rather than body.style, so other code writing
  // body.style.overflow (the Preloader) can neither undo nor leak the lock.
  const engaged = phase !== "idle";
  useEffect(() => {
    document.documentElement.classList.toggle("project-open", engaged);
    return () => document.documentElement.classList.remove("project-open");
  }, [engaged]);

  // Back on the desk: return keyboard focus to the object that was opened.
  useEffect(() => {
    if (phase === "idle") elRef.current?.focus({ preventScroll: true });
  }, [phase]);

  return {
    t,
    shellOpacity,
    phase,
    active,
    liftedId,
    shellMounted,
    reducedMotion,
    deskQuad,
    open,
    requestClose,
    cloneReady,
  };
}
