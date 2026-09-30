"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import type { World } from "@/hooks/useWorld";
import { phoneStageBox } from "./PhoneObject";
import type { Visiting } from "./useVisit";
import { project } from "./worldCamera";

/**
 * Picking the telephone up: Contact. A button over the scene on the
 * telephone's own outline (it follows the camera), so it can have a focus
 * ring of its own size. A pointer over it, or a keyboard focus on it, is a
 * hand reaching for it (`onNear`): it stops ringing and its handset lifts.
 */
export default function PhoneButton({ world, visit, shown, onNear }: { world: World; visit: Visiting; shown: MotionValue<number>; onNear: (near: boolean) => void }) {
  const { view, camera, ready } = world;
  const stage = phoneStageBox(view.portrait);
  const box = useTransform(camera, (c) => {
    const a = project(view, c, stage.x, stage.y);
    const b = project(view, c, stage.x + stage.w, stage.y + stage.h);
    return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  });
  const x = useTransform(box, (b) => b.x);
  const y = useTransform(box, (b) => b.y);
  const w = useTransform(box, (b) => b.w);
  const h = useTransform(box, (b) => b.h);
  const events = useTransform(shown, (v) => (v > 0.5 ? "auto" : "none"));

  return (
    <motion.button
      type="button"
      data-phone-button
      lang="en"
      aria-label="Contact Rosario Medina Studio"
      className="absolute left-0 top-0 z-[25] rounded-[22%] cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--scene-ink)/0.7)]"
      style={{ x, y, width: w, height: h, pointerEvents: events, visibility: ready && visit.phase === "idle" ? "visible" : "hidden" }}
      onPointerEnter={(e) => e.pointerType === "mouse" && onNear(true)}
      onPointerLeave={() => onNear(false)}
      onFocus={() => onNear(true)}
      onBlur={() => onNear(false)}
      onClick={(e) => {
        onNear(false);
        visit.open("contact", e.currentTarget);
      }}
    />
  );
}
