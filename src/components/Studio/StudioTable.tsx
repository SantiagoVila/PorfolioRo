"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { warmCovers } from "@/components/Projects/coverWarmup";
import { preloadExperiences } from "@/components/Projects/experiences";
import { PROJECTS } from "@/data/projectsData";
import type { World } from "@/hooks/useWorld";
import { useRevealed } from "../reveal";
import { DESK_OBJECTS, WALL_EDGE_Y } from "./sceneLayout";
import { project } from "./worldCamera";

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** The scroll cue's pulse: the bar runs down its track (1.8 s), then rests out of sight (0.3 s). */
const PULSE: Keyframe[] = [
  { transform: "translateY(-12px)", easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
  { transform: "translateY(36px)", offset: 1.8 / 2.1 },
  { transform: "translateY(36px)" },
];

/**
 * The intro's scroll cue, under the hero just above the desk's edge, in the
 * room's ink (light at night): it goes as soon as the page starts down. The
 * desk itself carries no words: its publications say what they are (their
 * names show on hover and focus, see StudioScene), and everything else is
 * reached from its objects.
 */
export default function StudioTable({ world }: { world: World }) {
  const { s, view, cams } = world;
  const revealed = useRevealed();

  const introEdge = cams.length ? project(view, cams[0], 0, WALL_EDGE_Y).y : view.hs;
  const rise = Math.max(0, view.hs - 32 - (introEdge - 18));
  const cueY = -rise;
  const cueOpacity = useTransform(s, (v) => 1 - smooth((v - 0.02) / 0.22));
  // The line's pulse runs only while the intro waits for the first scroll.
  const [waiting, setWaiting] = useState(() => s.get() < 0.08);
  // A Web Animation of transform alone, which the browser's compositor plays: the
  // page does no work for it while the reader looks at the intro. Once the page
  // moves on, the bar settles at the top of its track from wherever it was.
  const pulse = useRef<HTMLSpanElement>(null);
  const reduced = world.reduced;
  useEffect(() => {
    const el = pulse.current;
    if (!el || !waiting || !revealed || reduced) return;
    const loop = el.animate(PULSE, { duration: 2100, iterations: Infinity });
    return () => {
      const from = getComputedStyle(el).transform;
      loop.cancel();
      if (from && from !== "none") el.animate([{ transform: from }, { transform: "translateY(0px)" }], { duration: 600, easing: "ease-out" });
    };
  }, [waiting, revealed, reduced]);

  // As the desk comes into view, fetch the covers' large versions and the
  // projects' code in the background, so a first-ever opening never waits.
  useMotionValueEvent(s, "change", (v) => {
    setWaiting(v < 0.08);
    if (v <= 0.6) return;
    warmCovers(DESK_OBJECTS.flatMap((o) => PROJECTS[o.id]?.coverImage ?? []));
    preloadExperiences();
  });

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <motion.div
        aria-hidden
        className="absolute left-1/2 w-16 -ml-8"
        style={{ bottom: "calc(2rem + 100lvh - 100svh + env(safe-area-inset-bottom))", y: cueY, color: "rgb(var(--scene-ink))", opacity: cueOpacity }}
      >
        <motion.div
          className="flex flex-col items-center gap-2.5 text-[8px] md:text-[9px] font-bold tracking-[0.3em] uppercase pl-[0.3em]"
          initial={{ opacity: 0 }}
          animate={revealed ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: world.reduced ? 0 : 1.5 }}
        >
          <span>Scroll</span>
          <span className="relative block w-px h-9 overflow-hidden">
            <span className="absolute inset-0 bg-current opacity-25" />
            <span ref={pulse} className="absolute inset-x-0 top-0 h-3 bg-current" />
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
