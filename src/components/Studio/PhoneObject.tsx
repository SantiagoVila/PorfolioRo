"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { LIGHT_CHANGE_MS, type MoodLook } from "./mood";
import { ringFrames, SCREEN_ON } from "./phoneRing";
import { PHONE, phoneAt, type DeskLayout } from "./sceneLayout";

const SRC = "/studio/phone";

/**
 * Rosario's telephone: cream and brass, a rotary dial, its cord coiled down
 * to the desk. It stands against the wall at the right end of the desk, by the
 * window, in the room's light (`look`, per the visit's light: its grade, and
 * which way its shadow falls: from the window by day, from the lamp at the
 * left at night). Its shadow darkens the wall and desk beneath it (a
 * multiplying layer), the telephone stands in front of that, and its handset
 * lies in the cradle as a layer of its own, so it can move.
 *
 * It rings (`ringing`, decided by the page: at the desk, with nothing open,
 * no hand near it, until it has been answered once): a double ring and a
 * pause, again and again (see phoneRing). The handset rattles about the end
 * its cord leaves from, the telephone buzzes, its shadow answers, and its
 * dial's crest glows in her colour with each ring. With reduced motion
 * nothing moves: the crest alone. `lift` 0 → 1 is lying → answered: the
 * handset tips up off the cradle (a hand near it lifts it a little).
 * `connected`: the call is on, and the dial's crest holds her colour.
 *
 * Drawn in the stage (it moves with the camera); the button that picks it up
 * lies above the scene (see PhoneButton), after the cap in reading order.
 */
export default function PhoneObject({
  layout,
  shown,
  lift,
  ringing,
  connected,
  reduced,
  look,
}: {
  layout: DeskLayout;
  shown: MotionValue<number>;
  lift: MotionValue<number>;
  ringing: boolean;
  connected: MotionValue<number>;
  reduced: boolean;
  look: MoodLook["phone"];
}) {
  const box = phoneAt(layout, PHONE.src.x, PHONE.src.y);
  const s = box.s;
  const w = PHONE.src.w * s;
  const h = PHONE.src.h * s;
  const shadowAt = phoneAt(layout, PHONE.shadow.x, PHONE.shadow.y);
  // Its shadow falls to the left from the window (as drawn), or, at night, to the right from the lamp
  // (mirrored about its foot); changing light, one fades into the other.
  const footInShadow = (PHONE.foot.x - PHONE.shadow.x) * s;
  const change = { transitionProperty: "opacity", transitionDuration: `${LIGHT_CHANGE_MS}ms`, transitionTimingFunction: "ease-in-out" };
  // In the telephone's own box (stage px): where its cord leaves the handset, and its dial's crest.
  const cordEnd = { x: (PHONE.cordEnd.x - PHONE.src.x) * s, y: (PHONE.cordEnd.y - PHONE.src.y) * s };
  const crest = { x: (PHONE.dial.x - PHONE.src.x) * s, y: (PHONE.dial.y - PHONE.src.y) * s, rx: PHONE.dial.rx * s, ry: PHONE.dial.ry * s };

  // Lifted: its earpiece end rises off the cradle, the handset tipping about the end its cord leaves from
  // (so the cord stays on it), as a hand takes it by the handle.
  const handsetY = useTransform(lift, (v) => -v * 2 * s);
  const handsetRotate = useTransform(lift, (v) => v * 6);

  // Ringing: Web Animations of transform (or, with reduced motion, of the crest's opacity alone),
  // which the compositor plays; cancelled the moment it is not ringing.
  const whole = useRef<HTMLDivElement>(null);
  const handset = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const pulse = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ringing) return;
    const f = ringFrames();
    const opts: KeyframeAnimationOptions = { duration: f.period, iterations: Infinity, delay: f.delay, easing: "linear" };
    const runs = reduced
      ? [pulse.current?.animate(f.crest, opts)]
      : [whole.current?.animate(f.body, opts), handset.current?.animate(f.handset, opts), shadow.current?.animate(f.shadow, opts), pulse.current?.animate(f.glow, opts)];
    return () => runs.forEach((a) => a?.cancel());
  }, [ringing, reduced]);

  // The crest in her colour (its relief kept: the colour is laid on its own light and shade).
  const crestStyle = { left: crest.x - crest.rx, top: crest.y - crest.ry, width: crest.rx * 2, height: crest.ry * 2, background: SCREEN_ON, mixBlendMode: "color" as const, transform: "rotate(-6deg)" };
  return (
    <>
      {/* Its shadow on the wall and the desk: it darkens the plate beneath (outside the fading group, so it multiplies with the plate). */}
      <motion.div
        aria-hidden
        className="absolute pointer-events-none select-none"
        style={{ left: shadowAt.x, top: shadowAt.y, width: PHONE.shadow.w * s, height: PHONE.shadow.h * s, opacity: shown, mixBlendMode: "multiply" }}
      >
        <div ref={shadow} className="absolute inset-0">
          {([1, -1] as const).map((side) => (
            <div
              key={side}
              className="absolute inset-0"
              style={{ ...change, opacity: look.shadowSide === side ? look.shadow : 0, transform: side < 0 ? "scaleX(-1)" : undefined, transformOrigin: `${footInShadow}px 0` }}
            >
              <Image src={`${SRC}/phone-shadow.webp`} alt="" fill unoptimized loading="eager" className="object-fill" draggable={false} />
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div
        aria-hidden
        data-phone
        className="absolute pointer-events-none select-none"
        style={{ left: box.x, top: box.y, width: w, height: h, opacity: shown, filter: look.filter, transition: `filter ${LIGHT_CHANGE_MS}ms ease-in-out` }}
      >
        <div ref={whole} className="absolute inset-0">
          <Image src={`${SRC}/phone-body.webp`} alt="" fill unoptimized loading="eager" className="object-fill" draggable={false} />
          {/* The dial's crest: her colour when the call is on (and, with reduced motion, with each ring). */}
          <motion.span data-phone-dial className="absolute rounded-[50%]" style={{ ...crestStyle, opacity: connected }} />
          <span ref={pulse} className="absolute rounded-[50%]" style={{ ...crestStyle, opacity: 0 }} />
          <motion.div className="absolute inset-0" style={{ y: handsetY, rotate: handsetRotate, transformOrigin: `${cordEnd.x}px ${cordEnd.y}px` }}>
            <div ref={handset} className="absolute inset-0" style={{ transformOrigin: `${cordEnd.x}px ${cordEnd.y}px` }}>
              <Image src={`${SRC}/phone-handset.webp`} alt="" fill unoptimized loading="eager" className="object-fill" draggable={false} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}

/** The telephone's outline on the stage (for placing its button over the scene). */
export function phoneStageBox(layout: DeskLayout) {
  const a = phoneAt(layout, PHONE.outline.x, PHONE.outline.y);
  return { x: a.x, y: a.y, w: PHONE.outline.w * a.s, h: PHONE.outline.h * a.s };
}
