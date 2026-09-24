"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import HeroStage from "@/components/HeroStage";
import StudioTable from "@/components/Studio/StudioTable";
import ProjectShell from "@/components/Projects/ProjectShell";
import ProjectTransitionLayer from "@/components/Projects/ProjectTransitionLayer";
import { useProjectTransition } from "@/components/Projects/useProjectTransition";
import { clamp01 } from "@/components/Projects/transitionGeometry";
import { useStageFit } from "@/hooks/useStageFit";
import { STAGE_FIT } from "@/components/Studio/sceneLayout";
import { PROJECTS } from "@/data/projectsData";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Framer hands opacity transforms of a targeted useScroll to a native
  // ViewTimeline, which mistracks this sticky 200vh layout (opacities drift
  // and snap back to 1 at the end). A function transform drops that
  // acceleration so every derived value follows the same JS-driven progress.
  const progress = useTransform(scrollYProgress, (v) => v);

  // One stage fit for the pinned screen: the desk is laid out with it, and the
  // Scene 1 cap uses it to land exactly on its spot on the desk.
  const stageFit = useStageFit(stickyRef, STAGE_FIT);
  // Phones explore the desk sideways (see useDeskPan); the cap travels with it.
  const deskPan = useMotionValue(0);

  // The page is two screens tall, so after the phone is turned (or the window
  // resized) the old scroll offset would land partway back to the landing.
  // Whoever was at the desk stays at the desk. Toolbars showing or hiding
  // (a small change in height only) are left alone.
  useEffect(() => {
    const bottom = () => document.documentElement.scrollHeight - window.innerHeight;
    let atDesk = window.scrollY >= bottom() - 2;
    let size = [window.innerWidth, window.innerHeight];
    const onScroll = () => {
      atDesk = window.scrollY >= bottom() - 2;
    };
    const onResize = () => {
      const [w, h] = size;
      size = [window.innerWidth, window.innerHeight];
      if (w === window.innerWidth && Math.abs(h - window.innerHeight) < 150) return;
      if (atDesk) window.scrollTo(0, bottom());
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

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

  return (
    <main
      ref={containerRef}
      className="relative bg-[var(--color-paper)] h-[200vh] text-[var(--color-ink)] selection:bg-[var(--color-diva-pink)] selection:text-white"
    >
      {/* Sticky container for the 3D-like transition */}
      <div ref={stickyRef} className="sticky top-0 w-full h-screen overflow-hidden bg-[#1a1612]">
        <motion.div
          className="absolute inset-0 bg-[var(--color-paper)]"
          style={{ filter: sceneFilter, scale: sceneScale }}
          inert={phase !== "idle"}
        >
          <HeroStage scrollYProgress={progress} stageFit={stageFit} deskPan={deskPan} />
          <StudioTable
            scrollYProgress={progress}
            stageFit={stageFit}
            pan={deskPan}
            onSelectProject={transition.open}
            liftedId={transition.liftedId}
          />
        </motion.div>
      </div>

      <ProjectTransitionLayer transition={transition} />
      {active && shellMounted && PROJECTS[active.id] && (
        <ProjectShell project={PROJECTS[active.id]} transition={transition} />
      )}
    </main>
  );
}
