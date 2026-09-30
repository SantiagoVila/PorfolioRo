"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";
import { Fraunces } from "next/font/google";
import CapViewer, { CAP_CANVAS_MAX_WIDTH } from "./CapViewer";
import { CAP_CROWN_TOP, CAP_DESK_FROM, CAP_DESK_REST, CAP_REST, CAP_SHADOW_BAND, capFor } from "./Studio/sceneLayout";
import { LOOK, type MoodLook } from "./Studio/mood";
import { useLightChange, useMood } from "./Studio/useMood";
import { onCap } from "./Studio/capTouch";
import { capIntroRow, project, type Camera, type View } from "./Studio/worldCamera";
import { aboutLayout, type AboutLayout } from "./Studio/aboutLayout";
import { safeInsets } from "./safeArea";
import { ABOUT_T, out, pickUp, within } from "./Studio/visitTimeline";
import type { Visiting } from "./Studio/useVisit";
import { useRevealed } from "./reveal";
import type { World } from "@/hooks/useWorld";

/**
 * The cap: Rosario's identity object, and the one thing that travels through
 * the whole page. In the intro it is the hero, turning freely in front of her
 * name on the wall; on the way to the desk it shrinks and settles onto its spot
 * there, and stays there. Picked up (a click, a tap, or the navigation's
 * About), it is lifted and held up facing the viewer, at the size of her
 * portrait, which takes over from the face it is printed with (see
 * aboutLayout); put down, it goes back to its exact place. It is always the
 * same CapViewer; only this wrapper moves, so there is never a second cap and
 * the frame/cursor system is untouched.
 */

/** The cap's own outline on the frames (frame px): what a click or tap on it is. */
const CAP_BOX = { left: 232, top: CAP_CROWN_TOP, right: 497, bottom: 348 };
/** Held up for About: facing, still, quick to settle. */
const HELD_REST = { frame: 0, cursorRange: 0, easing: 0.16, returnDelay: 0 };
/** Hovered on the desk: it turns to face the pointer's owner. */
const FACING_REST = { ...CAP_DESK_REST, cursorRange: 0, easing: 0.1 };

type Pose = { scale: number; x: number; y: number };
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({ scale: a.scale * Math.pow(b.scale / a.scale, t), x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Scale + translation of the full-screen cap layer (origin: screen centre) that puts the cap on its desk spot under camera c. */
function capOnDesk(view: View, c: Camera) {
  const { w: cw, h: ch } = view;
  const { frameWidth, frameHeight, frameAnchor } = CAP_REST;
  const { anchor, scale: stagePxPerFramePx } = capFor(view.layout);
  // Intro: the canvas is centred on screen, showing the whole frame at this size.
  const screenPxPerFramePx = Math.min(cw, CAP_CANVAS_MAX_WIDTH) / frameWidth;
  // The frame anchor (brim bottom, on the rotation axis) relative to screen centre.
  const anchorX = (frameAnchor.x - frameWidth / 2) * screenPxPerFramePx;
  const anchorY = (frameAnchor.y - frameHeight / 2) * screenPxPerFramePx;
  const scale = (stagePxPerFramePx * c.k) / screenPxPerFramePx;
  const p = project(view, c, anchor.x, anchor.y);
  return { scale, x: p.x - cw / 2 - scale * anchorX, y: p.y - ch / 2 - scale * anchorY };
}

/**
 * Room light for the cap. The frames were lit in a white studio (their shadow
 * is a real, transparent one: see useFrameLoader); in the room they take the
 * visit's light (mood.ts's LOOK: the window's by day, golden at sunset, the
 * lamp's at night), partly against the wall in the intro, fully on the desk.
 * Display-only (a colour matrix over the canvas); the frames are not modified.
 */
const ROOM_LIGHT_FILTER_ID = "cap-room-light";
/** Past the desk, the light leaves it (see StudioScene's shade): the cap, which sits on it, goes into the same shade. */
const deskShadeOn = (s: number) => (s <= 1 ? 0 : Math.min(0.42, (s - 1) * 0.32));
const roomLightMatrix = (light: MoodLook["cap"], s: number, lifted = 0) => {
  const onDesk = Math.min(1, Math.max(0, (s - 0.3) / 0.7));
  // Lifted off the desk towards the viewer, it leaves the desk's light (as the prints do).
  const k = (light.wall + (light.desk - light.wall) * onDesk) * (1 - lifted) + light.wall * 0.5 * lifted;
  const bright = 1 + (light.bright - 1) * (onDesk * (1 - lifted) + 0.5 * lifted);
  const dim = (1 - 0.75 * deskShadeOn(s)) * bright;
  const c = (m: number) => (1 - k * (1 - m)) * dim;
  return `${c(light.r)} 0 0 0 0  0 ${c(light.g)} 0 0 0  0 0 ${c(light.b)} 0 0  0 0 0 1 0`;
};

/** How far the cap is on its way to the desk at state progress s (0–1): ahead of the camera, landed by s = 0.85. */
const capLanding = (s: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, s) / 0.85), 2.2);

export default function HeroStage({ world, visit }: { world: World; visit: Visiting }) {
  const { s, camera, view, ready } = world;
  // The room's light on it: the visit's, mixed from the last one's while the light changes.
  const known = useMood();
  const mood = known ?? "day";
  const { from: lightFrom, t: lightChange } = useLightChange(known);
  const capLight = (): MoodLook["cap"] => {
    const a = LOOK[lightFrom.get()].cap, b = LOOK[mood].cap, t = lightChange.get();
    const mix = (k: keyof MoodLook["cap"]) => a[k] + (b[k] - a[k]) * t;
    return { r: mix("r"), g: mix("g"), b: mix("b"), wall: mix("wall"), desk: mix("desk"), bright: mix("bright") };
  };
  const about = visit.about;
  const held = visit.current === "about";
  // Where it is held for About (per screen; the pixel density sets how large her portrait may be drawn).
  // Laid out as the About visit lays itself out: on the visible screen (window.innerHeight, which a
  // phone's browser bars shorten), whose centre lies (innerHeight − view.h) / 2 from this layer's.
  const heldAt = useRef<{ key: string; layout: AboutLayout } | null>(null);
  const aboutAt = (): AboutLayout | null => {
    if (!view.w || typeof window === "undefined") return null;
    const ih = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const insets = safeInsets();
    const key = [view.w, view.h, ih, dpr, insets.top, insets.right, insets.bottom, insets.left].join();
    if (heldAt.current?.key !== key) {
      const l = aboutLayout(view.w, ih, dpr, insets);
      heldAt.current = { key, layout: { ...l, cap: { ...l.cap, y: l.cap.y + (ih - view.h) / 2 } } };
    }
    return heldAt.current.layout;
  };
  // Hovered on the desk: it rises a little off it (spring), and faces the viewer.
  const [hovered, setHovered] = useState(false);
  const rise = useMotionValue(0);
  useEffect(() => {
    const c = animate(rise, hovered && !held ? 1 : 0, { type: "spring", duration: 0.45, bounce: 0.15 });
    return () => c.stop();
  }, [hovered, held, rise]);

  // Intro: full size, in front of her name. On the way to the desk it leads the
  // camera: it settles onto its spot there (which moves with the camera) during
  // the first part of the move, so it is already sitting on the desk, at its
  // size, when the objects come up in front of it, and the camera settles after.
  // Its size changes geometrically (an even shrink to the eye).
  // At rest in the intro the canvas holds the screen's own pixels (CapViewer);
  // a fraction of a pixel off the grid, the compositor resamples every one of
  // them (a 0.4 px offset costs a 1× screen a third of the cap's fine detail),
  // so there it lands on the device-pixel grid, an offset that fades out on
  // the way to the desk.
  const grid = useMotionValue({ x: 0, y: 0 });
  // Where the scroll puts it (the intro, the desk, or on its way between).
  const scrolled = (): Pose => {
    const c = camera.get();
    const v = s.get();
    const g = grid.get();
    const desk = capOnDesk(view, c);
    // Hovered on the desk: a few px up, as if lifted by a finger (it lifts, its shadow stays).
    const hover = -4 * rise.get() * (view.w / 1440 + 0.5);
    if (v >= 1) return { ...desk, y: desk.y + hover };
    const t = capLanding(v);
    // Placed against her name (see worldCamera's introLayout).
    const { heroY, capScale: hero } = world.intro;
    return { scale: hero * Math.pow(desk.scale / hero, t), x: desk.x * t + g.x * (1 - t), y: heroY + (desk.y - heroY) * t + g.y * (1 - t) + hover * t };
  };
  const pose = useTransform((): Pose => {
    if (!ready) return { scale: 1, x: 0, y: 0 };
    const base = scrolled();
    const a = about.get();
    const layout = a > 0 ? aboutAt() : null;
    if (a <= 0 || !layout) return base;
    // Picked up: from wherever it is to held up facing the viewer (reduced motion: it stays, and fades).
    if (world.reduced) return base;
    const heldUp = mixPose(base, layout.cap, pickUp(within(a, ABOUT_T.lift)));
    // Her photograph has taken its face: the rest of the cap falls away, down and back, from under it.
    const fall = out(within(a, ABOUT_T.capOut));
    if (fall <= 0) return heldUp;
    const drop = fall * 0.08 * 300 * (Math.min(view.w, CAP_CANVAS_MAX_WIDTH) / CAP_REST.frameWidth) * heldUp.scale;
    return { scale: heldUp.scale * (1 - 0.04 * fall), x: heldUp.x, y: heldUp.y + drop };
  });
  // As her photograph takes over its face, the rest of the cap goes.
  const capOpacity = useTransform(about, (a) => (world.reduced ? 1 - within(a, [0, 0.5]) : 1 - within(a, ABOUT_T.capOut)));
  // The two faces meet blurred, so they read as one face changing, not two overlapping.
  const gone = ABOUT_T.capOut[1];
  const capFilter = useTransform(about, (a) => {
    const b = world.reduced || a >= gone ? 0 : 3 * within(a, ABOUT_T.face);
    return b > 0 ? `url(#${ROOM_LIGHT_FILTER_ID}) blur(${b.toFixed(2)}px)` : `url(#${ROOM_LIGHT_FILTER_ID})`;
  });
  // Once it has gone (About open), out of the layer tree.
  const capVisibility = useTransform(about, (a) => (ready && a < gone ? "visible" : "hidden"));
  const capScale = useTransform(pose, (p) => p.scale);
  const capX = useTransform(pose, (p) => p.x);
  const capY = useTransform(pose, (p) => p.y);

  // On the desk the cap rests still on its front pose instead of spinning.
  const [onDesk, setOnDesk] = useState(() => s.get() >= CAP_DESK_FROM);
  useMotionValueEvent(s, "change", (v) => setOnDesk(v >= CAP_DESK_FROM));

  // Entrance: as the curtain lifts, just after her name.
  const revealed = useRevealed();
  // (The same first state on the server and the client; with reduced motion the rise takes no time.)
  const hidden = { opacity: 0, scale: 0.94, y: 24 };

  // The grid offset is measured once the cap has entered and whenever its
  // canvas, the screen or the intro layout changes, while the page is at the intro.
  const [entered, setEntered] = useState(false);
  const capLayerRef = useRef<HTMLDivElement>(null);
  const toGrid = useCallback(() => {
    const canvas = capLayerRef.current?.querySelector("canvas");
    if (!canvas || s.get() !== 0) return;
    const r = canvas.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    const g = grid.get();
    // Where it would be without the offset, and the offset that puts that on the grid.
    const off = (v: number) => (Math.round(v * d) - v * d) / d;
    const next = { x: off(r.left - g.x), y: off(r.top - g.y) };
    if (Math.abs(next.x - g.x) > 0.001 || Math.abs(next.y - g.y) > 0.001) grid.set(next);
  }, [s, grid]);
  useEffect(() => {
    const canvas = capLayerRef.current?.querySelector("canvas");
    if (!entered || !canvas) return;
    // Measured after the frame that lays the change out has been rendered.
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => (raf = requestAnimationFrame(toGrid)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [entered, toGrid, view, world.intro]);
  useMotionValueEvent(s, "change", (v) => {
    if (v === 0 && entered) requestAnimationFrame(() => requestAnimationFrame(toGrid));
  });

  const roomLightRef = useRef<SVGFEColorMatrixElement>(null);
  const light = () => roomLightRef.current?.setAttribute("values", roomLightMatrix(capLight(), s.get(), pickUp(within(about.get(), ABOUT_T.lift))));
  useMotionValueEvent(lightChange, "change", light);
  // Written by `light` from then on (React sets it once, so a new light does not jump before it is mixed).
  const [firstMatrix] = useState(() => roomLightMatrix(LOOK[mood].cap, s.get()));
  useMotionValueEvent(s, "change", light);
  useMotionValueEvent(about, "change", light);
  // The visit's light is known once the page is on the client.
  useLayoutEffect(light);

  // The cap as something to pick up: its outline on screen, following it (a
  // button of its own over the canvas, so the focus ring is not scaled with it).
  const box = useTransform(pose, (p) => {
    const per = (Math.min(view.w, CAP_CANVAS_MAX_WIDTH) / CAP_REST.frameWidth) * p.scale;
    const at = (fx: number, fy: number) => ({
      x: view.w / 2 + p.x + (fx - CAP_REST.frameWidth / 2) * per,
      y: view.h / 2 + p.y + (fy - CAP_REST.frameHeight / 2) * per,
    });
    const tl = at(CAP_BOX.left, CAP_BOX.top);
    const br = at(CAP_BOX.right, CAP_BOX.bottom);
    return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
  });
  const hitX = useTransform(box, (b) => b.x);
  const hitY = useTransform(box, (b) => b.y);
  const hitW = useTransform(box, (b) => b.w);
  const hitH = useTransform(box, (b) => b.h);
  const pickable = visit.phase === "idle";

  const rest = held ? HELD_REST : onDesk ? (hovered ? FACING_REST : CAP_DESK_REST) : null;
  return (
    <>
      <section className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden z-20 pointer-events-none" aria-hidden>
        {/* Cap in front of everything on the desk. Pointer-transparent: the cap
            tracks the cursor via document listeners, and this full-screen layer
            must not cover the desk. */}
        <motion.div
          className="absolute z-30 w-full h-full pointer-events-none"
          initial={hidden}
          animate={revealed ? { opacity: 1, scale: 1, y: 0 } : hidden}
          transition={{
            duration: world.reduced ? 0.5 : 1.7,
            delay: world.reduced ? 0 : 0.5,
            ease: [0.16, 1, 0.3, 1],
            ...(world.reduced ? { y: { duration: 0 }, scale: { duration: 0 } } : {}),
          }}
          onAnimationComplete={() => revealed && setEntered(true)}
        >
          <svg width="0" height="0" className="absolute" aria-hidden>
            <filter id={ROOM_LIGHT_FILTER_ID} colorInterpolationFilters="sRGB">
              <feColorMatrix ref={roomLightRef} type="matrix" values={firstMatrix} />
            </filter>
          </svg>
          <motion.div
            ref={capLayerRef}
            className="w-full h-full flex items-center justify-center"
            style={{ scale: capScale, x: capX, y: capY, opacity: capOpacity, filter: capFilter, visibility: capVisibility }}
          >
            {/* On an upright desk only touches that start on the cap turn it; the
                others are taps on the objects or the page's own scrolling. */}
            <CapViewer rest={rest} acceptTouch={onDesk && view.portrait ? onCap : undefined} />
          </motion.div>
        </motion.div>

        {ready && world.intro.caption && <TurnCaption world={world} />}
      </section>

      {/* Picking the cap up: About. */}
      <motion.button
        type="button"
        data-cap-button
        lang="en"
        aria-label="About Rosario Medina"
        className="absolute left-0 top-0 z-[25] rounded-[40%] cursor-pointer pointer-events-auto outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--scene-ink)/0.7)]"
        style={{ x: hitX, y: hitY, width: hitW, height: hitH, visibility: ready && pickable ? "visible" : "hidden" }}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={(e) => {
          setHovered(false);
          visit.open("about", e.currentTarget);
        }}
      />
    </>
  );
}

const noSubscription = () => () => {};

/**
 * The caption's face, used nowhere else: loaded with the page but not preloaded
 * (the caption only fades in seconds after the reveal), in its real italic.
 */
const captionFace = Fraunces({ subsets: ["latin"], weight: "300", style: "italic", display: "swap", preload: false });

/**
 * The intro's caption for the cap, as in a catalogue: how to turn it (it
 * follows the cursor, or the finger on touch screens). Under the cap's shadow
 * on landscape screens, above the cap on upright ones. It bows out once the cap
 * has been turned for a while, or as soon as the page moves on.
 */
function TurnCaption({ world }: { world: World }) {
  const { s, view, intro } = world;
  const revealed = useRevealed();
  // Server and hydration render the pointer version; touch screens switch right after.
  const touch = useSyncExternalStore(noSubscription, () => !!window.matchMedia?.("(pointer: coarse)").matches, () => false);
  const [used, setUsed] = useState(false);
  useEffect(() => {
    if (used) return;
    let travelled = 0;
    let last: [number, number] | null = null;
    const onMove = (e: PointerEvent) => {
      if (last) travelled += Math.hypot(e.clientX - last[0], e.clientY - last[1]);
      last = [e.clientX, e.clientY];
      if (travelled > 600) setUsed(true);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, [used]);
  const leave = useTransform(s, [0, 0.05], [1, 0]);

  const centre = view.h / 2 + intro.heroY;
  const top = view.portrait
    ? centre + capIntroRow(view, CAP_CROWN_TOP) * intro.capScale - 34
    : centre + capIntroRow(view, CAP_SHADOW_BAND.bottom) * intro.capScale + 6;
  return (
    <motion.div className="absolute left-0 right-0 z-40 pointer-events-none select-none" style={{ top, opacity: leave }}>
      <motion.p
        lang="en"
        // In the room's ink (light at night), just strong enough for AA contrast (4.5:1) on the wall behind it.
        className={`${captionFace.className} text-center text-[13px] tracking-[0.01em] ${view.portrait ? "text-[rgb(var(--scene-ink)/0.85)]" : "text-[rgb(var(--scene-ink)/0.78)]"}`}
        initial={{ opacity: 0 }}
        animate={revealed && !used ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: used ? 1.2 : 1, delay: revealed && !used ? 2.4 : 0, ease: "easeOut" }}
      >
        {touch ? "touch to turn the cap" : "move to turn the cap"}
      </motion.p>
    </motion.div>
  );
}
