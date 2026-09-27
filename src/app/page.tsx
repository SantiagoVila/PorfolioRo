"use client";

import { useRef } from "react";
import { motion, useTransform } from "framer-motion";
import HeroStage from "@/components/HeroStage";
import SiteHeader from "@/components/SiteHeader";
import AboutContact from "@/components/Studio/AboutContact";
import StudioScene from "@/components/Studio/StudioScene";
import StudioTable from "@/components/Studio/StudioTable";
import { SCROLL_SCREENS } from "@/components/Studio/worldStates";
import ProjectShell from "@/components/Projects/ProjectShell";
import ProjectTransitionLayer from "@/components/Projects/ProjectTransitionLayer";
import { useProjectTransition } from "@/components/Projects/useProjectTransition";
import { clamp01 } from "@/components/Projects/transitionGeometry";
import { useWorld } from "@/hooks/useWorld";
import { PROJECTS } from "@/data/projectsData";

/**
 * The portfolio: one place, Rosario's studio, seen through one camera that
 * the page's scroll moves through four states (see Studio/worldStates):
 * her name and the cap → the desk and its projects → her own material on the
 * wall → a card to reach her. Projects open from their objects on the desk
 * into their own worlds, and close back onto them.
 */
export default function Home() {
  const stickyRef = useRef<HTMLDivElement>(null);
  const svhRef = useRef<HTMLDivElement>(null);
  const world = useWorld(stickyRef, svhRef);

  // Opening a desk object: the object lifts towards the viewer while the
  // studio recedes behind it (blur, dim, a slight pull-back), then the
  // project takes over. The studio stays mounted underneath the whole time.
  const transition = useProjectTransition();
  const { t, reducedMotion, phase, active, shellMounted } = transition;
  const sceneFilter = useTransform(t, (v) => {
    const k = clamp01(v);
    if (k === 0) return "none";
    return reducedMotion ? `brightness(${1 - 0.45 * k})` : `blur(${5 * k}px) brightness(${1 - 0.45 * k})`;
  });
  const sceneScale = useTransform(t, (v) => (reducedMotion ? 1 : 1 - 0.035 * clamp01(v)));
  const headerOpacity = useTransform(t, (v) => 1 - clamp01(v * 1.5));

  return (
    <main
      className="relative bg-[var(--color-paper)] text-[var(--color-ink)] selection:bg-[var(--color-diva-pink)] selection:text-white"
      style={{ height: `${(SCROLL_SCREENS + 1) * 100}vh` }}
    >
      {/* First in reading order; fixed over the scene. */}
      <SiteHeader world={world} opacity={headerOpacity} inert={phase !== "idle"} />

      {/* The studio, pinned while the page scrolls through it */}
      <div ref={stickyRef} className="sticky top-0 w-full h-screen overflow-hidden bg-[#1a1612]">
        <motion.div
          className="absolute inset-0"
          style={{ filter: sceneFilter, scale: sceneScale }}
          inert={phase !== "idle"}
        >
          <StudioScene world={world} onSelectProject={transition.open} liftedId={transition.liftedId} />
          <HeroStage world={world} />
          <StudioTable world={world} />
          <AboutContact world={world} />
        </motion.div>
        {/* The height surely visible with a phone's browser bars showing */}
        <div ref={svhRef} aria-hidden className="absolute left-0 top-0 w-px invisible pointer-events-none" style={{ height: "100svh" }} />
      </div>

      <ProjectTransitionLayer transition={transition} />
      {active && shellMounted && PROJECTS[active.id] && (
        <ProjectShell project={PROJECTS[active.id]} transition={transition} />
      )}
    </main>
  );
}
