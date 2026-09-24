"use client";

import { useState } from "react";
import { motion, MotionValue } from "framer-motion";
import Image from "next/image";
import { Corners } from "./Corners";

/** Opacity for a layer: fixed, or driven by a transition. */
type Fade = number | MotionValue<number>;

interface BookObjectProps {
  title: string;
  category: string;
  coverImage: string;
  rotation?: number;
  className?: string;
  delay?: number;
  /** Receives the book's element, so a transition can start from its exact position. */
  onClick?: (el: HTMLElement) => void;
}

const COVER_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

/**
 * Same `sizes` everywhere the desk-size cover is drawn, so the browser reuses
 * one cached file. Phones explore a larger desk (see STAGE_FIT.explore): a
 * book there is ~38vw across.
 */
export const DESK_COVER_SIZES = "(max-width: 540px) 40vw, (max-width: 768px) 30vw, 22vw";

/**
 * A hardcover book lying on the desk. It fills its parent: size and
 * perspective come from the scene placement (see StudioScene). Its parts are
 * exported so the opening transition can lift the very same object.
 */
export default function BookObject({
  title,
  category,
  coverImage,
  rotation = 0,
  className = "",
  delay = 0,
  onClick
}: BookObjectProps) {

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`${title} — ${category}`}
      className={`relative w-full h-full cursor-pointer group outline-none ${className}`}
      initial={{ opacity: 0, y: 30, rotateZ: rotation }}
      animate={{ opacity: 1, y: 0, rotateZ: rotation }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.025 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => onClick?.(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e.currentTarget);
        }
      }}
    >
      <BookShadows />
      <BookThickness />
      <BookCover title={title} coverImage={coverImage} />
      <Corners />

      {/* Keyboard focus ring */}
      <div className="absolute -inset-1 rounded-[3px] ring-2 ring-[#191510]/70 opacity-0 group-focus-visible:opacity-100 pointer-events-none" />
    </motion.div>
  );
}

/** Cast + contact shadow on the desk. */
export function BookShadows({ opacity = 1 }: { opacity?: Fade }) {
  return (
    <motion.div className="absolute inset-0 -z-10" style={{ opacity }}>
      {/* Cast shadow: the plate is lit from the upper right, so it falls left and down */}
      <div className="absolute inset-0 bg-black/45 blur-lg -translate-x-2 translate-y-3 transition-all duration-500 group-hover:blur-xl group-hover:translate-y-7 group-hover:bg-black/30" />
      {/* Contact shadow: tight and dark right where the front edge meets the desk; loosens as it lifts */}
      <div className="absolute inset-0 bg-black/55 blur-[3px] -translate-x-[3px] translate-y-[21px] rounded-[2px] transition-all duration-500 group-hover:opacity-40 group-hover:blur-[6px]" />
    </motion.div>
  );
}

/** Back board and page block, peeking out along the bottom/right edge. */
export function BookThickness({ opacity = 1 }: { opacity?: Fade }) {
  return (
    <motion.div className="absolute inset-0 -z-10" style={{ opacity }}>
      <div className="absolute inset-0 bg-[#23201c] translate-x-[3px] translate-y-[17px] rounded-[2px]" />
      <div className="absolute inset-0 bg-[#d9d1c1] translate-x-[2px] translate-y-[13px]" />
      <div className="absolute inset-0 bg-[#ebe5d8] translate-x-[2px] translate-y-[8px]" />
      <div className="absolute inset-0 bg-[#23201c] translate-x-[1px] translate-y-[3px] rounded-[2px]" />
    </motion.div>
  );
}

interface BookCoverProps {
  title: string;
  coverImage: string;
  /** Room light on the desk; a lifted book leaves it behind. */
  grade?: Fade;
  /** Also load a sharp version for when the cover is shown large (transition). */
  hiResSizes?: string;
}

/** The real project cover, printed on board, lit by the room. */
export function BookCover({ title, coverImage, grade = 1, hiResSizes }: BookCoverProps) {
  const [hiResLoaded, setHiResLoaded] = useState(false);
  return (
    <div className="absolute inset-0 bg-[#23201c] overflow-hidden rounded-[2px]">
      <Image
        src={coverImage}
        alt={`${title} cover`}
        fill
        sizes={DESK_COVER_SIZES}
        className="object-cover"
        loading="eager"
        draggable={false}
      />
      {hiResSizes && (
        <Image
          src={coverImage}
          alt=""
          aria-hidden
          fill
          sizes={hiResSizes}
          className={`object-cover transition-opacity duration-300 ${hiResLoaded ? "opacity-100" : "opacity-0"}`}
          loading="eager"
          draggable={false}
          onLoad={() => setHiResLoaded(true)}
        />
      )}
      {/* Room light. The blend mode sits on each fading wrapper, so the layers
          still multiply correctly while a lifted book leaves the light behind. */}
      {/* Room light: pull the print into the plate's warm, dim grade */}
      <motion.div className="absolute inset-0 pointer-events-none mix-blend-multiply" style={{ opacity: grade }}>
        <div className="absolute inset-0 bg-[#a58a70] opacity-[0.34]" />
      </motion.div>
      {/* Light falloff: brighter towards the window (upper right), darker towards the lower left */}
      <motion.div className="absolute inset-0 pointer-events-none mix-blend-multiply" style={{ opacity: grade }}>
        <div className="absolute inset-0 bg-[linear-gradient(215deg,transparent_25%,rgba(60,40,20,0.28)_100%)]" />
      </motion.div>
      <motion.div className="absolute inset-0 pointer-events-none mix-blend-soft-light" style={{ opacity: grade }}>
        <div className="absolute inset-0 bg-[linear-gradient(215deg,rgba(255,244,225,0.35)_0%,transparent_45%)] transition-opacity duration-500 group-hover:opacity-70" />
      </motion.div>
      {/* Print texture and a little age, so it reads as an object, not a screen */}
      <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none" style={{ backgroundImage: COVER_NOISE }} />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,250,240,0.12),transparent_60%)]" />
      {/* Spine hinge */}
      <div className="absolute inset-y-0 left-[4%] w-[3px] bg-black/15 pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/25 to-transparent pointer-events-none" />
      {/* Worn board edges */}
      <div className="absolute inset-0 rounded-[2px] pointer-events-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25),inset_0_0_14px_rgba(40,25,10,0.28)]" />
    </div>
  );
}
