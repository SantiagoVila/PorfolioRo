"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useTransform } from "framer-motion";
import type { ProjectData } from "@/data/projectsData";
import type { ProjectTransition } from "./useProjectTransition";
import { EXPERIENCES } from "./experiences";
import { useFocusTrap } from "./useFocusTrap";

/**
 * Frame shared by every project experience. It only provides infrastructure:
 * the fixed layer above the desk, the fade in/out (driven by the transition),
 * dialog semantics (focus moves in and stays in while it is open) and a
 * consistent "back to the desk" control (Escape is handled by the transition
 * itself, so it also works mid-flight).
 * Everything inside, including background, scrolling, layout, media and
 * interactions, belongs to the experience, so each project can look and
 * behave completely differently.
 */
export default function ProjectShell({ project, transition }: { project: ProjectData; transition: ProjectTransition }) {
  const { phase, shellOpacity, requestClose } = transition;
  const interactive = phase === "open";
  // Loaded before the shell mounts (see useProjectTransition).
  const Experience = EXPERIENCES[project.id];
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const visibility = useTransform(shellOpacity, (v) => (v > 0 ? "visible" : "hidden"));
  // An experience with nested levels can take over the way back (see ExperienceProps).
  const [controlHidden, setControlHidden] = useState(false);

  // Once the project is on screen, move focus into it, and keep it there.
  useEffect(() => {
    if (interactive) closeRef.current?.focus({ preventScroll: true });
  }, [interactive]);
  useFocusTrap(dialogRef, interactive);

  if (!Experience) return null;

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      aria-hidden={!interactive}
      className="fixed inset-0 z-[70]"
      // Visible as soon as it is interactive (even at the first frame of its
      // fade), so focus can move into it right away.
      style={{ opacity: shellOpacity, visibility: interactive ? "visible" : visibility, pointerEvents: interactive ? "auto" : "none" }}
    >
      <Experience project={project} onClose={requestClose} setShellControlHidden={setControlHidden} />

      <button
        ref={closeRef}
        onClick={requestClose}
        data-shell-close
        hidden={controlHidden}
        className="fixed top-6 right-6 sm:top-8 sm:right-8 z-[80] flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white mix-blend-difference px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <span aria-hidden className="block w-6 h-px bg-current" />
        Back to the desk
      </button>
    </motion.div>
  );
}
