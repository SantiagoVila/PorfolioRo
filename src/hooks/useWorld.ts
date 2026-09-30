"use client";

import { RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MotionValue, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { safeInsets } from "@/components/safeArea";
import { deskLayoutFor, STAGE_FIT } from "@/components/Studio/sceneLayout";
import { cameraAt, closeOn, introLayout, mixCam, stateCameras, type Camera, type Intro, type View } from "@/components/Studio/worldCamera";
import { eased, fractionFor, stateAt, stateScrollY, STATES } from "@/components/Studio/worldStates";
import { useStageFit } from "./useStageFit";

/** States a link can open directly (/#work …). About and Contact are the cap's and the phone's (see useVisit). */
const HASH_STATES: Record<string, number> = { intro: 0, work: 1, projects: 1 };

/** A point on the stage the camera can be drawn towards, and how much closer it comes. */
export type Aim = { x: number; y: number; closer: number };

/**
 * The page's one scene, driven by scroll. Everything that moves with it reads
 * two motion values: `s`, the state progress (0 intro → 1 work, eased inside
 * the transition; with reduced motion it steps from one state's composition
 * to the next instead), and `camera`, the framing at `s`, drawn part of the
 * way (`aim`, 0–1) towards an object when one asks for it. Neither causes a
 * React render per frame; the only React state here is the size of the screen
 * (which changes the framings). Which state is current is read on demand, or
 * followed by the navigation alone.
 */
export interface World {
  s: MotionValue<number>;
  camera: MotionValue<Camera>;
  view: View;
  /** Framings of the four states for this view. */
  cams: Camera[];
  /** The intro's composition of name and cap for this view. */
  intro: Intro;
  /** Raw state progress (not eased or stepped), e.g. for the navigation's current state. */
  raw: MotionValue<number>;
  /** The state the page is in now (nearest), read on demand (no re-render). */
  currentState: () => number;
  reduced: boolean;
  ready: boolean;
  /** Glide (or jump, with reduced motion) to a state. */
  go: (state: number) => void;
  /** How far the camera is drawn towards the aimed point (0 = not at all). */
  aim: MotionValue<number>;
  /** The point the camera is drawn towards (per view: it is placed again when the screen changes). */
  aimAt: (a: ((view: View) => Aim) | null) => void;
}

export function useWorld(stickyRef: RefObject<HTMLElement | null>, svhRef: RefObject<HTMLElement | null>): World {
  const reduced = !!useReducedMotion();
  // The scene is the whole page, so the page's own scroll progress drives it (no target
  // element to re-measure on every scroll event).
  const { scrollYProgress } = useScroll();
  // Function transforms, not framer's native scroll-timeline path: that one mistracks this sticky layout.
  const raw = useTransform(scrollYProgress, (v) => stateAt(v));
  const s = useTransform(raw, (v) => (reduced ? Math.round(v) : eased(v)));

  const fit = useStageFit(stickyRef, STAGE_FIT);
  const [hs, setHs] = useState(0);
  useLayoutEffect(() => {
    const el = svhRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHs(el.getBoundingClientRect().height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [svhRef]);

  const view = useMemo<View>(() => {
    const w = fit.viewportWidth;
    const h = fit.viewportHeight;
    // (Read again whenever the screen changes size, as turning a phone does.)
    const safeTop = w > 0 ? safeInsets().top : 0;
    return { w, h, hs: Math.min(h, hs || h), portrait: w > 0 && w / h < 1, layout: deskLayoutFor(w, h), fit: { scale: fit.scale, x: fit.x, y: fit.y }, safeTop };
  }, [fit.viewportWidth, fit.viewportHeight, fit.scale, fit.x, fit.y, hs]);
  const cams = useMemo(() => (view.w ? stateCameras(view) : []), [view]);
  const intro = useMemo(() => (cams.length ? introLayout(view, cams) : { lift: 0, scale: 1, heroY: 0, capScale: 1, caption: false }), [view, cams]);

  const camera = useMotionValue<Camera>({ cx: 0, cy: 0, k: 1 });
  const aim = useMotionValue(0);
  const aimRef = useRef<((view: View) => Aim) | null>(null);
  const camsRef = useRef(cams);
  const viewRef = useRef(view);
  // The framing at s, drawn towards the aimed point (if any) by `aim`.
  const place = useRef(() => {});
  useLayoutEffect(() => {
    camsRef.current = cams;
    viewRef.current = view;
    place.current = () => {
      if (!camsRef.current.length) return;
      const base = cameraAt(camsRef.current, s.get());
      const a = aim.get();
      const target = aimRef.current?.(viewRef.current);
      camera.set(a > 0 && target ? mixCam(base, closeOn(viewRef.current, target.x, target.y, target.closer), a) : base);
    };
    place.current();
  }, [cams, view, camera, s, aim]);
  useMotionValueEvent(s, "change", () => place.current());
  useMotionValueEvent(aim, "change", () => place.current());
  const aimAt = (a: ((view: View) => Aim) | null) => {
    aimRef.current = a;
    place.current();
  };

  // Turning the phone or resizing changes the page's height: stay in the same place in the story.
  // Browser bars showing or hiding (a small change in height only) are left alone.
  const lastRaw = useRef(0);
  useMotionValueEvent(raw, "change", (v) => (lastRaw.current = v));
  useEffect(() => {
    let size = [window.innerWidth, window.innerHeight];
    const onResize = () => {
      const [w, h] = size;
      size = [window.innerWidth, window.innerHeight];
      if (w === window.innerWidth && Math.abs(h - window.innerHeight) < 150) return;
      const keep = lastRaw.current;
      requestAnimationFrame(() => window.scrollTo(0, fractionFor(keep) * (document.documentElement.scrollHeight - window.innerHeight)));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const go = (state: number) => {
    const to = stateScrollY(Math.min(STATES.length - 1, Math.max(0, state)));
    window.scrollTo({ top: to, behavior: reduced ? "auto" : "smooth" });
  };

  // A direct link to a state (/#work, /#about, /#contact) opens there. Read once
  // on arrival; navigating never writes it (no history entries). A project link
  // (?project=) takes precedence: it opens over the desk.
  const ready = fit.ready && cams.length > 0;
  useEffect(() => {
    if (!ready) return;
    const target = () => HASH_STATES[window.location.hash.slice(1).toLowerCase()];
    const first = target();
    if (first !== undefined && !new URLSearchParams(window.location.search).has("project")) window.scrollTo(0, stateScrollY(first));
    // The same link followed from the page itself (or the address edited): glide there.
    const onHash = () => {
      const state = target();
      if (state !== undefined) window.scrollTo({ top: stateScrollY(state), behavior: reduced ? "auto" : "smooth" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // Once the scene is measured; `reduced` only changes how the later glides move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return { s, raw, camera, view, cams, intro, currentState: () => Math.round(raw.get()), reduced, ready, go, aim, aimAt };
}
