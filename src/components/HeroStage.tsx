"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { Fraunces } from "next/font/google";
import CapViewer, { CAP_CANVAS_MAX_WIDTH } from "./CapViewer";
import { CAP_CROWN_TOP, CAP_DESK_FROM, CAP_DESK_REST, CAP_REST, CAP_SHADOW_BAND, PORTRAIT } from "./Studio/sceneLayout";
import { onCap } from "./Studio/capTouch";
import { capIntroRow, project, type Camera, type View } from "./Studio/worldCamera";
import { useRevealed } from "./reveal";
import type { World } from "@/hooks/useWorld";

/**
 * The cap: Rosario's identity object, and the one thing that travels through
 * the whole page. In the intro it is the hero, turning freely in front of her
 * name on the wall; on the way to the desk it shrinks and settles onto its spot
 * there, and from then on it simply stays on the desk while the camera moves
 * (About, Contact). It is always the same CapViewer; only this wrapper moves,
 * so there is never a second cap and the frame/cursor system is untouched.
 */

/** Scale + translation of the full-screen cap layer (origin: screen centre) that puts the cap on its desk spot under camera c. */
function capOnDesk(view: View, c: Camera) {
  const { w: cw, h: ch } = view;
  const { frameWidth, frameHeight, frameAnchor, scale: stagePxPerFramePx } = CAP_REST;
  const anchor = view.portrait ? PORTRAIT.capAnchor : CAP_REST.stageAnchor;
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
 * is a real, transparent one: see useFrameLoader); in the room they take its
 * warm grade, lightly against the wall in the intro, more on the desk, where
 * the photograph's own light is warmer and lower. Display-only (a colour matrix
 * over the canvas); the frames are not modified.
 */
const ROOM_LIGHT_FILTER_ID = "cap-room-light";
const ROOM_LIGHT = { r: 0.9, g: 0.77, b: 0.7 };
const WALL_LIGHT = 0.35;
const DESK_LIGHT = 0.85;
const roomLightStrength = (s: number) => WALL_LIGHT + (DESK_LIGHT - WALL_LIGHT) * Math.min(1, Math.max(0, (s - 0.3) / 0.7));
/** Past the desk, the light leaves it (see StudioScene's shade): the cap, which sits on it, goes into the same shade. */
const deskShadeOn = (s: number) => (s <= 1 ? 0 : Math.min(0.42, (s - 1) * 0.32));
const roomLightMatrix = (s: number) => {
  const k = roomLightStrength(s);
  const dim = 1 - 0.75 * deskShadeOn(s);
  const c = (m: number) => (1 - k * (1 - m)) * dim;
  return `${c(ROOM_LIGHT.r)} 0 0 0 0  0 ${c(ROOM_LIGHT.g)} 0 0 0  0 0 ${c(ROOM_LIGHT.b)} 0 0  0 0 0 1 0`;
};

/** How far the cap is on its way to the desk at state progress s (0–1): ahead of the camera, landed by s = 0.85. */
const capLanding = (s: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, s) / 0.85), 2.2);

export default function HeroStage({ world }: { world: World }) {
  const { s, camera, view, ready } = world;

  // Intro: full size, in front of her name. On the way to the desk it leads the
  // camera: it settles onto its spot there (which moves with the camera) during
  // the first part of the move, so it is already sitting on the desk, at its
  // size, when the objects come up in front of it, and the camera settles after.
  // Its size changes geometrically (an even shrink to the eye).
  // (The camera changes with every change of s: it is the one dependency, s is read with it.)
  const pose = useTransform(camera, (c: Camera) => {
    const v = s.get();
    if (!ready) return { scale: 1, x: 0, y: 0 };
    const desk = capOnDesk(view, c);
    if (v >= 1) return desk;
    const t = capLanding(v);
    // Placed against her name (see worldCamera's introLayout).
    const { heroY, capScale: hero } = world.intro;
    return { scale: hero * Math.pow(desk.scale / hero, t), x: desk.x * t, y: heroY + (desk.y - heroY) * t };
  });
  const capScale = useTransform(pose, (p) => p.scale);
  const capX = useTransform(pose, (p) => p.x);
  const capY = useTransform(pose, (p) => p.y);

  // On the desk the cap rests still on its front pose instead of spinning.
  const [onDesk, setOnDesk] = useState(() => s.get() >= CAP_DESK_FROM);
  useMotionValueEvent(s, "change", (v) => setOnDesk(v >= CAP_DESK_FROM));

  // Entrance: as the curtain lifts, just after her name.
  const revealed = useRevealed();
  const hidden = world.reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 24 };

  const roomLightRef = useRef<SVGFEColorMatrixElement>(null);
  useMotionValueEvent(s, "change", (v) => {
    roomLightRef.current?.setAttribute("values", roomLightMatrix(v));
  });

  return (
    <section className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden z-20 pointer-events-none" aria-hidden>
      {/* Cap in front of everything on the desk. Pointer-transparent: the cap
          tracks the cursor via document listeners, and this full-screen layer
          must not cover the desk. */}
      <motion.div
        className="absolute z-30 w-full h-full pointer-events-none"
        initial={hidden}
        animate={revealed ? { opacity: 1, scale: 1, y: 0 } : hidden}
        transition={{ duration: world.reduced ? 0.5 : 1.7, delay: world.reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id={ROOM_LIGHT_FILTER_ID} colorInterpolationFilters="sRGB">
            <feColorMatrix ref={roomLightRef} type="matrix" values={roomLightMatrix(s.get())} />
          </filter>
        </svg>
        <motion.div
          className="w-full h-full flex items-center justify-center"
          style={{ scale: capScale, x: capX, y: capY, filter: `url(#${ROOM_LIGHT_FILTER_ID})`, visibility: ready ? "visible" : "hidden" }}
        >
          {/* On an upright desk only touches that start on the cap turn it; the
              others are taps on the objects or the page's own scrolling. */}
          <CapViewer rest={onDesk ? CAP_DESK_REST : null} acceptTouch={onDesk && view.portrait ? onCap : undefined} />
        </motion.div>
      </motion.div>

      {ready && world.intro.caption && <TurnCaption world={world} />}
    </section>
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
        // Just dark enough for AA contrast (4.5:1) on the wall behind it, which is darker above the cap (upright screens).
        className={`${captionFace.className} text-center text-[13px] tracking-[0.01em] ${view.portrait ? "text-[#191510]/85" : "text-[#191510]/75"}`}
        initial={{ opacity: 0 }}
        animate={revealed && !used ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: used ? 1.2 : 1, delay: revealed && !used ? 2.4 : 0, ease: "easeOut" }}
      >
        {touch ? "touch to turn the cap" : "move to turn the cap"}
      </motion.p>
    </motion.div>
  );
}
