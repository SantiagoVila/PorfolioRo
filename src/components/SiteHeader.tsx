"use client";

import { useState, type MouseEvent } from "react";
import { motion, useMotionValueEvent, type MotionValue } from "framer-motion";
import type { World } from "@/hooks/useWorld";
import { useRevealed } from "./reveal";

const NAV = [
  { label: "Projects", state: 1, focus: "[data-object-id] [role=button]" },
  { label: "About", state: 2, focus: "#about-title" },
  { label: "Contact", state: 3, focus: "#contact-title" },
];

/**
 * The portfolio's navigation, over the whole scene: the name returns to the
 * intro; Projects, About and Contact glide the page to those states (no
 * history entries). From the keyboard, focus follows to what was chosen.
 */
export default function SiteHeader({ world, opacity, inert }: { world: World; opacity: MotionValue<number>; inert: boolean }) {
  // Only the header re-renders when the state changes.
  const revealed = useRevealed();
  const [current, setCurrent] = useState(() => world.currentState());
  useMotionValueEvent(world.raw, "change", (v) => setCurrent(Math.round(v)));
  const go = (state: number, focus: string | null) => (e: MouseEvent) => {
    world.go(state);
    // A keyboard press (no pointer): move focus along, once the page has arrived.
    if (e.detail !== 0 || !focus) return;
    const land = () => document.querySelector<HTMLElement>(focus)?.focus({ preventScroll: true });
    if ("onscrollend" in window) window.addEventListener("scrollend", land, { once: true });
    else setTimeout(land, 900);
  };
  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 pointer-events-none"
      inert={inert}
      // Arrives last in the entrance, once her name and the cap are in place.
      initial={{ opacity: 0, y: world.reduced ? 0 : -8 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: world.reduced ? 0 : -8 }}
      transition={{ delay: world.reduced ? 0 : 1.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Fades away while a project opens over the scene. */}
      {/* Clear of a phone's notch or rounded corners, held sideways too. */}
      <motion.div
        className="flex justify-between items-start gap-6 pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)] sm:pl-[max(env(safe-area-inset-left),2rem)] sm:pr-[max(env(safe-area-inset-right),2rem)] text-[#191510]"
        style={{ opacity, paddingTop: "max(env(safe-area-inset-top), 1.75rem)" }}
      >
      {/* Hit areas reach past the small type (after:), for fingers. */}
      <button
        onClick={go(0, null)}
        className="relative pointer-events-auto text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase py-1 outline-none after:absolute after:-inset-x-2 after:-inset-y-4 after:content-[''] focus-visible:ring-2 focus-visible:ring-[#191510]/60 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
      >
        Rosario Medina
      </button>
      <nav aria-label="Portfolio" lang="en" className="pointer-events-auto">
        <ul className="flex gap-4 md:gap-8 text-[8px] md:text-[9px] font-bold tracking-[0.3em] uppercase">
          {NAV.map((n) => {
            const on = current === n.state;
            return (
              <li key={n.label}>
                <button
                  onClick={go(n.state, n.focus)}
                  aria-current={on ? "true" : undefined}
                  // Inactive at 95%: AA contrast (4.5:1) with a little margin over the darkest wall behind it (92% needed).
                  className={`group relative py-1 transition-opacity duration-500 outline-none after:absolute after:-inset-x-2 after:-inset-y-4 after:content-[''] focus-visible:ring-2 focus-visible:ring-[#191510]/60 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent ${on ? "opacity-100" : "opacity-95 hover:opacity-100"}`}
                >
                  {n.label}
                  {/* The underline draws in from the left (hover), and stays under the current state. */}
                  <span
                    aria-hidden
                    className={`absolute left-0 right-[0.3em] bottom-0 h-px bg-current origin-left transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${on ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      </motion.div>
    </motion.header>
  );
}
