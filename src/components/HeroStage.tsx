"use client";

import { useRef, useState } from "react";
import { motion, MotionValue, useMotionValueEvent, useTransform } from "framer-motion";
import CapViewer, { CAP_CANVAS_MAX_WIDTH } from "./CapViewer";
import { CAP_DESK_FROM, CAP_DESK_REST, CAP_REST } from "./Studio/sceneLayout";
import type { StageFit } from "@/hooks/useStageFit";
import { onCap } from "./Studio/useDeskPan";
import BackgroundNoise from "./BackgroundNoise";
import FluidBackground from "./FluidBackground";

interface HeroStageProps {
  scrollYProgress?: MotionValue<number>;
  /** Stage fit of the studio desk; the cap lands on it at the end of the scroll. */
  stageFit?: StageFit;
  /** Horizontal pan of the desk on phones: the cap sits on the desk, so it moves with it. */
  deskPan?: MotionValue<number>;
}

/**
 * Scale + translation of the full-screen cap layer (origin: screen centre)
 * that puts the Scene 1 cap exactly on its spot on the desk. The cap keeps
 * being the same CapViewer; only this wrapper moves, so there is never a
 * second cap and the frame/cursor system is untouched.
 */
function capLanding(fit: StageFit) {
  const { viewportWidth: cw, viewportHeight: ch, scale: stageScale } = fit;
  const { frameWidth, frameHeight, frameAnchor, stageAnchor, scale: stagePxPerFramePx } = CAP_REST;

  // Scene 1: the canvas is centred on screen, showing the whole frame at this size.
  const screenPxPerFramePx = Math.min(cw, CAP_CANVAS_MAX_WIDTH) / frameWidth;
  // The frame anchor (brim bottom, on the rotation axis) relative to screen centre.
  const anchorX = (frameAnchor.x - frameWidth / 2) * screenPxPerFramePx;
  const anchorY = (frameAnchor.y - frameHeight / 2) * screenPxPerFramePx;

  const scale = (stagePxPerFramePx * stageScale) / screenPxPerFramePx;
  // Move the scaled anchor onto the stage anchor, in screen space.
  const x = fit.x + stageAnchor.x * stageScale - cw / 2 - scale * anchorX;
  const y = fit.y + stageAnchor.y * stageScale - ch / 2 - scale * anchorY;
  return { scale, x, y };
}

// Before the stage is measured (first paint), keep the old resting values.
const FALLBACK_LANDING = { scale: 0.35, x: 0, y: 20 };

/**
 * Room light for the cap once it is on the desk. The frames were shot on a
 * white backdrop: their baked shadow has a light, cool-grey ring that is
 * invisible on the Scene 1 paper but glows on the darker desk. Multiplying the
 * canvas by desk colour ÷ ring colour (desk ≈ 180,155,137 under the cap on
 * desk-wide.png vs ring ≈ 200,201,197, both sampled) melts the ring into the desk, leaves the shadow's darker core as
 * a contact shadow, and gives the cap the same warm room grade as the covers.
 * Display-only: the frames are not modified. k ramps 0 → 1 as the desk fades in,
 * so Scene 1 is untouched.
 */
const ROOM_LIGHT_FILTER_ID = "cap-room-light";
const ROOM_LIGHT = { r: 0.9, g: 0.77, b: 0.7 };
const roomLightStrength = (p: number) => Math.min(1, Math.max(0, (p - 0.3) / 0.7));
const roomLightMatrix = (k: number) => {
  const c = (m: number) => 1 - k * (1 - m);
  return `${c(ROOM_LIGHT.r)} 0 0 0 0  0 ${c(ROOM_LIGHT.g)} 0 0 0  0 0 ${c(ROOM_LIGHT.b)} 0 0  0 0 0 1 0`;
};

export default function HeroStage({ scrollYProgress, stageFit, deskPan }: HeroStageProps) {
  // Fallback for standalone testing
  const fallbackProgress = useTransform(() => 0);
  const progress = scrollYProgress || fallbackProgress;

  // The cap shrinks and travels onto its spot on the desk. It lands at the end
  // of the scroll, together with the table's own scroll-in motion.
  const landing = stageFit?.ready ? capLanding(stageFit) : FALLBACK_LANDING;
  const capScale = useTransform(progress, [0, 1], [1, landing.scale]);
  // Its spot moves with the desk when the desk is panned (phones).
  const capX = useTransform(() => Math.min(1, Math.max(0, progress.get())) * (landing.x + (deskPan?.get() ?? 0)));
  const capY = useTransform(progress, [0, 1], [0, landing.y]);

  // On the desk the cap rests still on its front pose instead of spinning.
  // Scene 1 (above the threshold) keeps the original free spin.
  const [onDesk, setOnDesk] = useState(() => progress.get() >= CAP_DESK_FROM);
  // What of Scene 1 is still on screen: the liquid background (until 0.4) and
  // the scroll hint (until 0.1). Past those, their animations stop.
  const [fluidOn, setFluidOn] = useState(() => progress.get() < 0.4);
  const [hintOn, setHintOn] = useState(() => progress.get() < 0.1);
  useMotionValueEvent(progress, "change", (v) => {
    setOnDesk(v >= CAP_DESK_FROM);
    setFluidOn(v < 0.4);
    setHintOn(v < 0.1);
  });

  // Room light on the desk (see ROOM_LIGHT_FILTER_ID). Off in Scene 1.
  const roomLightRef = useRef<SVGFEColorMatrixElement>(null);
  useMotionValueEvent(progress, "change", (v) => {
    roomLightRef.current?.setAttribute("values", roomLightMatrix(roomLightStrength(v)));
  });
  const capFilter = useTransform(progress, (v) =>
    roomLightStrength(v) > 0 ? `url(#${ROOM_LIGHT_FILTER_ID})` : "none"
  );

  // The background text scales up slightly and fades out
  const textScale = useTransform(progress, [0, 0.5], [1, 1.2]);
  const textOpacity = useTransform(progress, [0, 0.3], [0.12, 0]);

  // The fluid background fades out to reveal the table texture
  const fluidOpacity = useTransform(progress, [0, 0.4], [1, 0]);
  // Once faded out, hide it so its WebGL canvas stops catching the table's clicks
  const fluidVisibility = useTransform(progress, (v) => (v >= 0.4 ? "hidden" : "visible"));

  // The "Scroll or Drag" indicator fades out immediately
  const scrollIndicatorOpacity = useTransform(progress, [0, 0.1], [1, 0]);

  return (
    <section className="absolute inset-0 w-full h-[100vh] flex items-center justify-center overflow-hidden z-20 pointer-events-none">
      <motion.div className="absolute inset-0 bg-[#F3EEE3] -z-10" style={{ opacity: fluidOpacity, visibility: fluidVisibility }}>
        <div className="absolute inset-0 z-0">
          <FluidBackground active={fluidOn} />
        </div>
        <BackgroundNoise />
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(25, 21, 16, 0.05) 100%)'
        }} />
      </motion.div>

      {/* HUGE text in background.
          Outer layer: one-time entrance. Inner layer: scroll-driven values.
          Keeping them on separate elements stops the two from fighting. */}
      <motion.div
        className="absolute z-0 w-full flex flex-col items-center justify-center pointer-events-none select-none"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div style={{ opacity: textOpacity, scale: textScale }}>
          <h1 className="text-[22vw] sm:text-[20vw] font-black tracking-tighter text-[#191510] mix-blend-multiply whitespace-nowrap leading-[0.75] flex flex-col items-center">
            <span>ROSARIO</span>
            <span>MEDINA</span>
          </h1>
        </motion.div>
      </motion.div>

      {/* Cap in foreground. Pointer-transparent: the cap tracks the cursor via
          document listeners, and this full-screen layer must not cover the table. */}
      <motion.div
        className="absolute z-30 w-full h-full pointer-events-none"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <svg width="0" height="0" className="absolute" aria-hidden>
          <filter id={ROOM_LIGHT_FILTER_ID} colorInterpolationFilters="sRGB">
            <feColorMatrix ref={roomLightRef} type="matrix" values={roomLightMatrix(roomLightStrength(progress.get()))} />
          </filter>
        </svg>
        <motion.div
          className="w-full h-full flex items-center justify-center"
          style={{ scale: capScale, x: capX, y: capY, filter: capFilter }}
        >
          {/* While the desk is explored by dragging, only touches that start on
              the cap turn it; the others pan, scroll or tap the desk. */}
          <CapViewer rest={onDesk ? CAP_DESK_REST : null} acceptTouch={onDesk && stageFit?.explore ? onCap : undefined} />
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        // Phones: this screen is 100vh (toolbars hidden); stay above the toolbars while they show.
        style={{ bottom: "calc(2rem + 100lvh - 100svh)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <motion.div
          className="text-[10px] font-bold tracking-[0.3em] text-[#191510]/80 uppercase flex flex-col items-center gap-3"
          style={{ opacity: scrollIndicatorOpacity }}
        >
          <span>Scroll or Drag</span>
          <div className="w-[1px] h-12 bg-[#191510]/20 overflow-hidden relative">
            <motion.div
              className="w-full h-4 bg-[#191510]"
              animate={hintOn ? { y: [-16, 48] } : { y: -16 }}
              transition={hintOn ? { repeat: Infinity, duration: 1.5, ease: "linear" } : { duration: 0 }}
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
