"use client";

import { motion, MotionValue, useMotionValueEvent, useTransform } from "framer-motion";
import { warmCovers } from "@/components/Projects/coverWarmup";
import { preloadExperiences } from "@/components/Projects/experiences";
import { PROJECTS } from "@/data/projectsData";
import { DESK_OBJECTS } from "./sceneLayout";
import type { StageFit } from "@/hooks/useStageFit";
import StudioScene from "./StudioScene";

interface StudioTableProps {
  scrollYProgress: MotionValue<number>;
  stageFit: StageFit;
  /** Horizontal pan of the desk on phones (see useDeskPan). */
  pan: MotionValue<number>;
  onSelectProject: (id: string, el: HTMLElement) => void;
  liftedId?: string | null;
}

export default function StudioTable({ scrollYProgress, stageFit, pan, onSelectProject, liftedId = null }: StudioTableProps) {
  // Table fades in from 0.3 to 1.0
  const opacity = useTransform(scrollYProgress, [0.3, 1], [0, 1]);
  
  // The whole scene has a slight perspective shift as we scroll in
  const rotateX = useTransform(scrollYProgress, [0.3, 1], [15, 0]);
  const scale = useTransform(scrollYProgress, [0.3, 1], [0.95, 1]);
  const y = useTransform(scrollYProgress, [0.3, 1], [150, 0]);

  // Parallax for specific UI elements
  const uiY = useTransform(scrollYProgress, [0.5, 1], [50, 0]);
  const uiOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

  // Only enable interactions when table is visible
  const pointerEvents = useTransform(scrollYProgress, (v) => v > 0.8 ? "auto" : "none");

  // Once the desk is in view, fetch the covers' large versions and the
  // projects' code in the background, so a first-ever opening never waits.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v <= 0.6) return;
    warmCovers(DESK_OBJECTS.flatMap((o) => PROJECTS[o.id]?.coverImage ?? []));
    preloadExperiences();
  });

  return (
    <motion.section 
      className="absolute inset-0 z-10 w-full h-full"
      style={{ 
        opacity,
        pointerEvents,
        perspective: "1200px" 
      }}
    >
      <motion.div 
        className="w-full h-full flex flex-col justify-between"
        style={{ scale, y, rotateX, transformStyle: "preserve-3d" }}
      >
        {/* Physical desk: environment plate + projected desk objects */}
        <StudioScene fit={stageFit} pan={pan} onSelectProject={onSelectProject} liftedId={liftedId} />

        {/* UI Nav (Top) */}
        <motion.header 
          className="relative flex justify-between items-start text-[#191510] z-30 p-8"
          style={{ y: uiY, opacity: uiOpacity }}
        >
          <div className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
            Rosario Medina
          </div>
          <nav className="flex gap-4 md:gap-8 text-[8px] md:text-[9px] font-bold tracking-[0.3em] uppercase opacity-70">
            <button className="hover:opacity-100 transition-opacity border-b border-black pb-1">Projects</button>
            <button className="hover:opacity-100 transition-opacity pb-1">About</button>
            <button className="hover:opacity-100 transition-opacity pb-1">Contact</button>
          </nav>
        </motion.header>

        {/* Left Side Text */}
        <motion.div 
           className="absolute top-[22%] left-8 text-[#191510] z-30"
           style={{ y: uiY, opacity: uiOpacity }}
        >
           <div className="text-[9px] font-bold tracking-[0.2em] uppercase leading-relaxed">
             {/* The desk only drags where it is explored (phones held upright). */}
             {stageFit.explore ? <>Select a project<br />or drag to explore.</> : "Select a project."}
           </div>
           <div className="mt-4 text-xl font-light">+</div>
        </motion.div>

        {/* UI Footer (Bottom) */}
        <motion.footer 
          className="relative flex justify-between items-end text-[#efe8dc] z-30 p-8"
          // Phones: the screen is 100vh (browser toolbars hidden); lift the footer
          // above the toolbars while they show. Zero wherever there are none.
          style={{ y: uiY, opacity: uiOpacity, marginBottom: "calc(100lvh - 100svh)" }}
        >
          <div className="flex flex-col gap-1 text-[8px] md:text-[9px] font-bold tracking-[0.3em] uppercase">
            <span>Portfolio</span>
            <span>2024 — 2025</span>
          </div>
          <div className="text-[8px] md:text-[9px] font-bold tracking-[0.3em] uppercase flex flex-col items-center gap-2">
            <span>Scroll</span>
            <div className="w-[1px] h-6 bg-[#efe8dc]" />
          </div>
        </motion.footer>

      </motion.div>
    </motion.section>
  );
}
