"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

  // On a phone held sideways the project keeps clear of the notch and rounded
  // corners, as Safari itself would if the page didn't run edge to edge: it lies
  // between the side safe-area insets, and those bands take the project's own
  // background colour. They have no width anywhere else, so nothing changes there.
  const stageRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const root = stageRef.current?.firstElementChild;
    if (root) dialogRef.current?.style.setProperty("--project-bg", getComputedStyle(root).backgroundColor);
  }, [Experience]);

  if (!Experience) return null;

  return (
    <motion.div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      lang={project.lang}
      aria-hidden={!interactive}
      className="fixed inset-0 z-[70]"
      // Visible as soon as it is interactive (even at the first frame of its
      // fade), so focus can move into it right away.
      style={{ opacity: shellOpacity, visibility: interactive ? "visible" : visibility, pointerEvents: interactive ? "auto" : "none" }}
    >
      <div aria-hidden className="absolute inset-y-0 left-0 w-[env(safe-area-inset-left)]" style={{ background: "var(--project-bg)" }} />
      <div aria-hidden className="absolute inset-y-0 right-0 w-[env(safe-area-inset-right)]" style={{ background: "var(--project-bg)" }} />
      <div ref={stageRef} className="absolute inset-y-0 left-[env(safe-area-inset-left)] right-[env(safe-area-inset-right)]">
        <Experience project={project} onClose={requestClose} setShellControlHidden={setControlHidden} />
      </div>

      <button
        ref={closeRef}
        onClick={requestClose}
        data-shell-close
        lang="en"
        hidden={controlHidden}
        className="fixed top-[max(env(safe-area-inset-top),1.5rem)] right-[max(env(safe-area-inset-right),1.5rem)] sm:top-[max(env(safe-area-inset-top),2rem)] sm:right-[max(env(safe-area-inset-right),2rem)] z-[80] flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white mix-blend-difference px-2 py-2 outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <span aria-hidden className="block w-6 h-px bg-current" />
        Back to the desk
      </button>
    </motion.div>
  );
}
