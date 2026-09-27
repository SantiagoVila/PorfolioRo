"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { announceReveal } from "./reveal";

/** How long the curtain stays down (the cap's frames load meanwhile). */
const HOLD_MS = 2400;

/**
 * The curtain before the studio: her name in the site's own small caps and a
 * line drawing across (CSS, no re-renders while the page loads). It lifts
 * upwards, and the page's entrance plays as it does (see reveal.ts).
 */
export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    // Disable scroll while loading
    document.body.style.overflow = "hidden";
    const draw = requestAnimationFrame(() => setDrawn(true));
    const lift = setTimeout(() => {
      setIsLoading(false);
      document.body.style.overflow = "";
      announceReveal();
    }, HOLD_MS);

    return () => {
      cancelAnimationFrame(draw);
      clearTimeout(lift);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#191510] text-[#F3EEE3]"
        >
          <div className="flex flex-col items-center gap-7">
            <motion.p
              className="text-[11px] md:text-xs font-bold tracking-[0.35em] uppercase pl-[0.35em]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              Rosario Medina
            </motion.p>
            <div className="relative w-[180px] h-px bg-[#F3EEE3]/15 overflow-hidden">
              <div
                className="absolute inset-0 origin-left bg-[#F3EEE3]/80"
                style={{
                  transform: `scaleX(${drawn ? 1 : 0})`,
                  transition: `transform ${HOLD_MS - 300}ms cubic-bezier(0.45, 0, 0.2, 1)`,
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
