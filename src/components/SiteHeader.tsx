"use client";

import { useState, type MouseEvent } from "react";
import { motion, useMotionValueEvent, type MotionValue } from "framer-motion";
import type { World } from "@/hooks/useWorld";
import LightControl from "./Studio/LightControl";
import type { Visit, Visiting } from "./Studio/useVisit";
import { useRevealed } from "./reveal";

type Item = { label: string; to: number | Visit };
/**
 * Each item is a place in the studio: Projects glides down to the desk and
 * its books; About picks up the cap, Contact the phone, exactly as a click on
 * them would (the same visit, the same way back).
 */
const NAV: Item[] = [
  { label: "Projects", to: 1 },
  { label: "About", to: "about" },
  { label: "Contact", to: "contact" },
];

/**
 * The portfolio's navigation, over the whole scene: the name returns to the
 * intro; Projects glides the page to the desk (no history entries); About and
 * Contact pick up the objects that are Rosario and the way to reach her. From
 * the keyboard, focus follows to what was chosen (the desk's first book; a
 * visit takes focus itself, and gives it back here when it ends).
 */
export default function SiteHeader({ world, visit, opacity, inert }: { world: World; visit: Visiting; opacity: MotionValue<number>; inert: boolean }) {
  // Only the header re-renders when the state changes.
  const revealed = useRevealed();
  const [state, setState] = useState(() => world.currentState());
  useMotionValueEvent(world.raw, "change", (v) => setState(Math.round(v)));
  const current: number | Visit = visit.current ?? state;
  const go = (to: number | Visit) => (e: MouseEvent<HTMLButtonElement>) => {
    if (typeof to !== "number") {
      visit.open(to, e.currentTarget);
      return;
    }
    world.go(to);
    // A keyboard press (no pointer): move focus along, once the page has arrived.
    if (e.detail !== 0 || to !== 1) return;
    const land = () => document.querySelector<HTMLElement>("[data-object-id] [role=button]")?.focus({ preventScroll: true });
    if ("onscrollend" in window) window.addEventListener("scrollend", land, { once: true });
    else setTimeout(land, 900);
  };
  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 pointer-events-none"
      inert={inert}
      // Arrives last in the entrance, once her name and the cap are in place. (The same first state on the
      // server and the client, which knows about reduced motion only once hydrated: there it does not slide.)
      initial={{ opacity: 0, y: -8 }}
      animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
      transition={{ delay: world.reduced ? 0 : 1.1, duration: 0.9, ease: [0.16, 1, 0.3, 1], y: { delay: world.reduced ? 0 : 1.1, duration: world.reduced ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] } }}
    >
      {/* Fades away while a project or a visit opens over the scene. */}
      {/* Clear of a phone's notch or rounded corners, held sideways too. */}
      <motion.div
        className="flex justify-between items-start gap-6 pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)] sm:pl-[max(env(safe-area-inset-left),2rem)] sm:pr-[max(env(safe-area-inset-right),2rem)] text-[rgb(var(--scene-ink))] transition-colors duration-1000 ease-in-out"
        style={{ opacity, paddingTop: "max(env(safe-area-inset-top), 1.75rem)" }}
      >
      {/* Hit areas reach past the small type (after:), for fingers. */}
      <button
        onClick={go(0)}
        className="relative pointer-events-auto text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase py-1 outline-none after:absolute after:-inset-x-2 after:-inset-y-4 after:content-[''] focus-visible:ring-2 focus-visible:ring-[rgb(var(--scene-ink)/0.6)] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
      >
        Rosario Medina
      </button>
      <div className="flex flex-col items-end gap-[18px] sm:flex-row sm:items-center sm:gap-7">
      <nav aria-label="Portfolio" lang="en" className="pointer-events-auto">
        <ul className="flex gap-4 md:gap-8 text-[8px] min-[375px]:text-[9px] font-bold tracking-[0.3em] uppercase">
          {NAV.map((n) => {
            const on = current === n.to;
            return (
              <li key={n.label}>
                <button
                  onClick={go(n.to)}
                  aria-current={on ? "true" : undefined}
                  // Inactive at 95%: AA contrast (4.5:1) with a little margin over the darkest wall behind it (92% needed).
                  className={`group relative py-1 transition-opacity duration-500 outline-none after:absolute after:-inset-x-2 after:-inset-y-4 after:content-[''] focus-visible:ring-2 focus-visible:ring-[rgb(var(--scene-ink)/0.6)] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent ${on ? "opacity-100" : "opacity-95 hover:opacity-100"}`}
                >
                  {n.label}
                  {/* The underline draws in from the left (hover), and stays under the current place. */}
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
      {/* The studio's light: after the navigation (under it on a narrow screen), in its type. */}
      <span aria-hidden className="hidden sm:block w-px h-2.5 bg-current opacity-30" />
      <div className="pointer-events-auto">
        <LightControl />
      </div>
      </div>
      </motion.div>
    </motion.header>
  );
}
