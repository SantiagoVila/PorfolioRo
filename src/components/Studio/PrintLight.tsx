"use client";

import { motion, type MotionValue } from "framer-motion";
import { LIGHT_CHANGE_MS, LOOK, MOODS } from "./mood";
import { edgeLocal, usePrintLight } from "./deskLight";
import type { DeskObject } from "./sceneLayout";
import { useMood } from "./useMood";

/**
 * The desk's light over a publication lying on it (its face and the edge at
 * its foot), multiplied in: one texture per light (see deskLight), the current
 * one showing; changing light, they cross-fade inside one multiplying layer,
 * so the object takes the new light as the room does (over everything of the
 * object, its printed matter included). `grade` fades it all
 * (a lifted object leaves the desk's light behind).
 */
export default function PrintLight({ object, grade = 1 }: { object: DeskObject; grade?: number | MotionValue<number> }) {
  const mood = useMood();
  const tex = usePrintLight(object, mood);
  const edge = edgeLocal(object);
  return (
    <motion.div aria-hidden className="absolute inset-x-0 top-0 z-[15] pointer-events-none mix-blend-multiply" style={{ height: `calc(100% + ${edge.toFixed(2)}px)`, opacity: grade }}>
      {MOODS.map((m) =>
        tex[m] ? (
          <div
            key={m}
            className="absolute inset-0 transition-opacity ease-in-out"
            style={{ backgroundImage: `url(${tex[m]})`, backgroundSize: "100% 100%", opacity: m === mood ? LOOK[m].print : 0, transitionDuration: `${LIGHT_CHANGE_MS}ms` }}
          />
        ) : null,
      )}
    </motion.div>
  );
}
