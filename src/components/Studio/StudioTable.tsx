"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useTransform } from "framer-motion";
import { warmCovers } from "@/components/Projects/coverWarmup";
import { preloadExperiences } from "@/components/Projects/experiences";
import { PROJECTS } from "@/data/projectsData";
import type { World } from "@/hooks/useWorld";
import { useRevealed } from "../reveal";
import { safeInsets } from "../safeArea";
import { DESK_OBJECTS, WALL_EDGE_Y } from "./sceneLayout";
import { project } from "./worldCamera";

const INK = [25, 21, 16];
const LIGHT = [239, 232, 220];
const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const mixRgb = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;

/** The scroll cue's pulse: the bar runs down its track (1.8 s), then rests out of sight (0.3 s). */
const PULSE: Keyframe[] = [
  { transform: "translateY(-12px)", easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
  { transform: "translateY(36px)", offset: 1.8 / 2.1 },
  { transform: "translateY(36px)" },
];

/**
 * The desk's own words, present only while the desk is the subject: the one
 * instruction, and the portfolio's years along the floor. And the scroll cue,
 * the one thing carried from the intro: under the hero at first, just above
 * the desk's edge in the wall's ink; as the camera comes down it travels into
 * the corner, turning light over the floor, and stays as the desk's "Scroll".
 */
export default function StudioTable({ world }: { world: World }) {
  const { s, view, cams } = world;
  const revealed = useRevealed();
  const near = useTransform(s, (v) => Math.max(0, 1 - Math.abs(v - 1) * 2.2));
  const y = useTransform(near, (v) => (1 - v) * 24);

  const along = useTransform(s, (v) => smooth((v - 0.08) / 0.8));
  const introEdge = cams.length ? project(view, cams[0], 0, WALL_EDGE_Y).y : view.hs;
  const rise = Math.max(0, view.hs - 32 - (introEdge - 18));
  // Into the corner, clear of a phone's notch or rounded corner when it is held sideways.
  const cueX = useTransform(along, (p) => p * (view.w / 2 - 64 - safeInsets().right));
  const cueY = useTransform(along, (p) => -(1 - p) * rise);
  const cueColor = useTransform(along, (p) => mixRgb(INK, LIGHT, smooth((p - 0.3) / 0.5)));
  const cueOpacity = useTransform(s, (v) => (v <= 1 ? 1 : Math.max(0, 1 - (v - 1) * 2.2)));
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
      <motion.p
        lang="en"
        className="absolute left-[max(env(safe-area-inset-left),2rem)] text-[#191510] text-[9px] font-bold tracking-[0.2em] uppercase leading-relaxed"
        style={{ top: "calc(max(env(safe-area-inset-top), 0px) + 7.5rem)", opacity: near, y }}
      >
        Select a project.
        <span aria-hidden className="block mt-4 text-xl font-light tracking-normal">+</span>
      </motion.p>

      <motion.footer
        aria-hidden
        className="absolute inset-x-0 bottom-0 flex justify-between items-end text-[#efe8dc] py-8 pl-[max(env(safe-area-inset-left),2rem)] pr-[max(env(safe-area-inset-right),2rem)]"
        // Above the phone's browser bars while they show (zero where there are none).
        style={{ opacity: near, y, marginBottom: "calc(100lvh - 100svh + env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col gap-1 text-[8px] md:text-[9px] font-bold tracking-[0.3em] uppercase">
          <span>Portfolio</span>
          <span>2024 — 2025</span>
        </div>
      </motion.footer>

      <motion.div
        aria-hidden
        className="absolute left-1/2 w-16 -ml-8"
        style={{ bottom: "calc(2rem + 100lvh - 100svh + env(safe-area-inset-bottom))", x: cueX, y: cueY, color: cueColor, opacity: cueOpacity }}
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
