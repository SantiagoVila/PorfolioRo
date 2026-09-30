"use client";

import { forwardRef } from "react";
import { motion, type MotionValue } from "framer-motion";

/**
 * The way back from a visit, as from a project (ProjectShell): the same words,
 * in the same corner, over whatever the visit shows. Its small type takes the
 * ink that reads on it: paper on the darkened room, ink on her colour (white
 * on Flame Scarlet falls just short of reading contrast at this size).
 */
const BackToDesk = forwardRef<HTMLButtonElement, { onClick: () => void; opacity: MotionValue<number>; tone?: "light" | "ink" }>(function BackToDesk({ onClick, opacity, tone = "light" }, ref) {
  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      lang="en"
      style={{ opacity }}
      className={`fixed top-[max(env(safe-area-inset-top),1.5rem)] right-[max(env(safe-area-inset-right),1.5rem)] sm:top-[max(env(safe-area-inset-top),2rem)] sm:right-[max(env(safe-area-inset-right),2rem)] z-[80] flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] px-2 py-2 outline-none focus-visible:ring-2 transition-transform duration-150 ease-out active:scale-[0.97] after:absolute after:-inset-2 after:content-[''] ${tone === "ink" ? "text-[#0b0908] focus-visible:ring-[#0b0908]/70" : "text-[#f1ebe1] focus-visible:ring-white/80"}`}
    >
      <span aria-hidden className="block w-6 h-px bg-current" />
      Back to the desk
    </motion.button>
  );
});

export default BackToDesk;
