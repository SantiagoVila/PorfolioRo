"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useAnimationFrame, useMotionValue, useTransform } from "framer-motion";
import { quadToMatrix3d } from "@/components/Studio/perspective";
import { BookCover, BookShadows, BookThickness } from "@/components/Studio/BookObject";
import { NEWSPRINT, NewspaperFront, NewspaperSheets, NewspaperShadows } from "@/components/Studio/DiaryObject";
import type { ActiveObject, ProjectTransition } from "./useProjectTransition";
import { clamp01, heldRect, lerpQuad, projectFillRect, rectQuad } from "./transitionGeometry";
import { FILL_COVER_SIZES, HELD_COVER_SIZES } from "./coverWarmup";
import { PAPER as DAILY_PAPER } from "./daily/paper";

/**
 * The travelling double of the clicked desk object, drawn above everything.
 *
 * Body: the very same object parts as on the desk, projected from the
 * object's live desk quad (t=0) to the held pose (t=1). It sheds its desk
 * shadows, thickness and room light as it lifts. Rendered at the held size
 * (CSS zoom) so it is crisp when presented.
 *
 * Fill: a sharp, screen-sized version that takes over at t=1 and grows to
 * cover the screen (t=2). Books become their full-bleed cover (identical to
 * the project's opening frame); THE DAILY stays paper: its ink fades and the
 * newsprint turns into the archive's paper.
 */
export default function ProjectTransitionLayer({ transition }: { transition: ProjectTransition }) {
  const { active, reducedMotion } = transition;
  if (!active || reducedMotion) return null;
  // Remount per object so sizes are recomputed for it.
  return <Double key={active.id} object={active} transition={transition} />;
}

function Double({ object, transition }: { object: ActiveObject; transition: ProjectTransition }) {
  const { t, deskQuad, cloneReady } = transition;
  const aspect = object.width / object.height;

  // Base resolutions, fixed for this flight: body at the held size; the book's
  // fill at the screen-covering size (it must be sharp: it is the project's
  // first frame). The newspaper's fill stays at the held size and is scaled up:
  // its print is fading to blank paper, and a screen-sized newspaper is costly to paint.
  const [base] = useState(() => {
    const held = heldRect(aspect, window.innerWidth, window.innerHeight);
    const fill = object.kind === "book" ? projectFillRect(aspect) : held;
    return { bodyZoom: held.height / object.height, fillZoom: fill.height / object.height, fill };
  });
  const bodyW = object.width * base.bodyZoom;
  const bodyH = object.height * base.bodyZoom;

  // Recomputed every frame, not only when t changes: near the desk the double
  // must stay glued to the live object (which may still be finishing a hover or
  // tap micro-animation, or moving with the receding scene).
  const bodyAt = (v: number) => {
    const held = rectQuad(heldRect(aspect, window.innerWidth, window.innerHeight));
    if (v >= 1) return quadToMatrix3d(bodyW, bodyH, held);
    return quadToMatrix3d(bodyW, bodyH, lerpQuad(deskQuad() ?? held, held, clamp01(v)));
  };
  const bodyTransform = useMotionValue(bodyAt(t.get()));
  useAnimationFrame(() => bodyTransform.set(bodyAt(t.get())));
  const fillTransform = useTransform(t, (v) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const q = lerpQuad(rectQuad(heldRect(aspect, vw, vh)), rectQuad(projectFillRect(aspect)), clamp01(v - 1));
    return quadToMatrix3d(base.fill.width, base.fill.height, q);
  });

  // Leaving the desk: contact and cast shadow go first, then thickness and room light.
  const deskShadows = useTransform(t, (v) => 1 - clamp01(v * 2.5));
  // Once they have faded, out of the layer tree too: they are blurred (filters),
  // and would otherwise be filtered again on every frame of the flight for nothing.
  const deskShadowsShown = useTransform(deskShadows, (v) => (v > 0 ? "visible" : "hidden"));
  const thickness = useTransform(t, (v) => 1 - clamp01(v * 1.6));
  const roomLight = useTransform(t, (v) => 1 - clamp01(v));
  const heldShadow = useTransform(t, (v) => clamp01(v) * (1 - clamp01((v - 1) * 2)));
  const fillVisible = useTransform(t, (v) => (v > 1 ? 1 : 0));
  // Newspaper only: the print fades and newsprint becomes THE DAILY's own paper.
  const ink = useTransform(t, [1, 1.8], [1, 0]);
  const paper = useTransform(t, [1, 2], [NEWSPRINT, DAILY_PAPER]);

  // Tell the transition once the double has painted, so the real object can hide.
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    const img = bodyRef.current?.querySelector("img");
    const decoded = img ? img.decode().catch(() => undefined) : Promise.resolve();
    const timeout = new Promise((r) => setTimeout(r, 250));
    Promise.race([decoded, timeout]).then(() => {
      if (!cancelled) requestAnimationFrame(() => !cancelled && cloneReady());
    });
    return () => {
      cancelled = true;
    };
  }, [cloneReady]);

  return (
    <div data-transition-layer className="fixed inset-0 z-[60] pointer-events-none overflow-hidden" aria-hidden>
      {/* Body */}
      <motion.div
        ref={bodyRef}
        data-double-body
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{ width: bodyW, height: bodyH, transform: bodyTransform }}
      >
        <div className="relative isolate" style={{ zoom: base.bodyZoom, width: object.width, height: object.height }}>
          <motion.div
            className="absolute inset-0 -z-20 shadow-[0_14px_34px_-8px_rgba(0,0,0,0.6)]"
            style={{ opacity: heldShadow }}
          />
          {object.kind === "book" && object.coverImage ? (
            <>
              <motion.div className="absolute inset-0 -z-10" style={{ visibility: deskShadowsShown }}>
                <BookShadows opacity={deskShadows} />
              </motion.div>
              <BookThickness opacity={thickness} />
              <BookCover title={object.label} coverImage={object.coverImage} grade={roomLight} hiResSizes={HELD_COVER_SIZES} />
            </>
          ) : (
            <>
              <motion.div className="absolute inset-0 -z-10" style={{ visibility: deskShadowsShown }}>
                <NewspaperShadows opacity={deskShadows} />
              </motion.div>
              <NewspaperSheets opacity={thickness} />
              <NewspaperFront title="The Daily" category={object.category} grade={roomLight} />
            </>
          )}
        </div>
      </motion.div>

      {/* Fill */}
      <motion.div
        className="absolute left-0 top-0 origin-top-left overflow-hidden"
        style={{ width: base.fill.width, height: base.fill.height, transform: fillTransform, opacity: fillVisible }}
      >
        {object.kind === "book" && object.coverImage ? (
          <Image src={object.coverImage} alt="" fill sizes={FILL_COVER_SIZES} className="object-cover" loading="eager" draggable={false} />
        ) : (
          <div className="relative" style={{ zoom: base.fillZoom, width: object.width, height: object.height }}>
            <NewspaperFront title="The Daily" category={object.category} grade={0} ink={ink} paper={paper} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
