"use client";

import { useState } from "react";
import { motion, MotionValue, type Variants } from "framer-motion";
import Image from "next/image";
import { Corners } from "./Corners";
import PrintLight from "./PrintLight";
import { edgeLocal } from "./deskLight";
import type { DeskObject } from "./sceneLayout";

/** Opacity for a layer: fixed, or driven by a transition. */
type Fade = number | MotionValue<number>;

interface BookObjectProps {
  title: string;
  category: string;
  coverImage: string;
  /** Where and how it lies (its face and thickness on this layout). */
  object: DeskObject;
  delay?: number;
  /** Receives the book's element, so a transition can start from its exact position. */
  onClick?: (el: HTMLElement) => void;
}

const COVER_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

/**
 * Same `sizes` everywhere the desk-size cover is drawn, so the browser reuses
 * one cached file. On phones a book is about 38vw across.
 */
export const DESK_COVER_SIZES = "(max-width: 540px) 40vw, (max-width: 768px) 30vw, 22vw";

/**
 * Picked up a little: it rises off the desk (in its own plane, towards the
 * back: on screen, up), leaving its shadows on the desk. A finger's press is
 * shallower.
 */
export const LIFT: Variants = { rest: { y: 0 }, lift: { y: -14 }, press: { y: -6 } };
export const LIFT_SPRING = { type: "spring", duration: 0.45, bounce: 0.15 } as const;

/**
 * A magazine lying on the desk. It fills its parent, whose transform lays it
 * on the desk (its face's corners projected through the photographs' camera:
 * see StudioScene and deskPlane), so everything here is drawn in the desk's
 * plane: its shadows on the desk, the page block at its foot (its thickness,
 * which the low camera sees edge on), the cover, the desk's own light over
 * both. The same logic for every publication on the desk (see DiaryObject).
 * Its parts are exported so the opening transition can lift the very same object.
 */
export default function BookObject({ title, category, coverImage, object, delay = 0, onClick }: BookObjectProps) {
  const edge = edgeLocal(object);
  return (
    <motion.div
      role="button"
      tabIndex={0}
      lang="en"
      aria-label={`${title} — ${category}`}
      className="relative w-full h-full cursor-pointer group outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover="lift"
      whileTap="press"
      onClick={(e) => onClick?.(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(e.currentTarget);
        }
      }}
    >
      <BookShadows edge={edge} />
      <motion.div className="absolute inset-0" variants={LIFT} initial="rest" transition={LIFT_SPRING}>
        <BookThickness edge={edge} />
        <BookCover title={title} coverImage={coverImage} />
        <PrintLight object={object} />
        <Corners />
      </motion.div>

      {/* Keyboard focus ring (in the desk's plane, around the publication and its edge) */}
      <div
        className="absolute -inset-2 rounded-[3px] ring-2 ring-[rgb(var(--scene-ink)/0.75)] opacity-0 group-focus-visible:opacity-100 pointer-events-none"
        style={{ bottom: -edge - 8 }}
      />
    </motion.div>
  );
}

/**
 * Its shadows on the desk, in the room's light (see globals.css, per
 * <html data-mood>): where it touches the desk, darkest along its foot, and the
 * short shadow its thickness casts away from the light (the window's, by day
 * and at sunset; the lamp's, at night). As it lifts they loosen.
 */
export function BookShadows({ opacity = 1, edge }: { opacity?: Fade; edge: number }) {
  return <DeskShadows opacity={opacity} edge={edge} />;
}

/** The shadows of anything lying on the desk (the same for every publication). */
export function DeskShadows({ opacity = 1, edge }: { opacity?: Fade; edge: number }) {
  return (
    <motion.div className="absolute inset-0 -z-10 pointer-events-none" style={{ opacity }}>
      <div className="absolute desk-cast transition-[opacity,filter] duration-500 group-hover:opacity-50" style={{ inset: 0, bottom: -edge }} />
      <div className="absolute desk-contact transition-opacity duration-500 group-hover:opacity-40" style={{ left: -3, right: -3, top: -2, bottom: -edge - 2 }} />
      <div className="absolute desk-foot transition-opacity duration-500 group-hover:opacity-30" style={{ left: 2, right: 2, height: 14, bottom: -edge - 9 }} />
    </motion.div>
  );
}

/**
 * Its thickness, at its foot: the cover's board, the block of pages, the back
 * cover (seen edge on by the low camera: a strip of the desk's plane below the
 * face, as tall on screen as the thickness is).
 */
export function BookThickness({ opacity = 1, edge }: { opacity?: Fade; edge: number }) {
  return (
    <motion.div className="absolute inset-x-0 top-full pointer-events-none" style={{ height: edge, opacity }}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(40,32,24,0.55) 0, rgba(40,32,24,0.55) 12%, #f1ebdf 12%, #e6dfd1 40%, #efe9dc 55%, #ddd5c6 82%, rgba(40,32,24,0.6) 82%, rgba(40,32,24,0.6) 100%)",
        }}
      />
      {/* The pages' fine lines */}
      <div className="absolute inset-x-0 top-[14%] bottom-[20%] opacity-40" style={{ background: "repeating-linear-gradient(to bottom, transparent 0 1.5px, rgba(80,64,48,0.35) 1.5px 2px)" }} />
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

/** The real project cover, printed on board. (The desk's light over it: see PrintLight.) */
export function BookCover({ title, coverImage, grade = 1, hiResSizes }: BookCoverProps) {
  const [hiResLoaded, setHiResLoaded] = useState(false);
  return (
    <div className="absolute inset-0 bg-[#23201c] overflow-hidden rounded-[1.5px]">
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
      {/* Its paper: a fine grain, and a soft sheen where the light catches the coated cover */}
      <div className="absolute inset-0 opacity-[0.14] mix-blend-overlay pointer-events-none" style={{ backgroundImage: COVER_NOISE }} />
      <motion.div className="absolute inset-0 pointer-events-none mix-blend-soft-light" style={{ opacity: grade }}>
        <div className="absolute inset-0 bg-[linear-gradient(200deg,rgba(255,250,240,0.3)_0%,transparent_45%)] transition-opacity duration-500 group-hover:opacity-100 opacity-70" />
      </motion.div>
      {/* Spine */}
      <div className="absolute inset-y-0 left-[3.5%] w-[2px] bg-black/12 pointer-events-none" />
      <div className="absolute inset-y-0 left-0 w-[5%] bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
      {/* Its edge */}
      <div className="absolute inset-0 rounded-[1.5px] pointer-events-none shadow-[inset_0_0_0_0.75px_rgba(0,0,0,0.22)]" />
    </div>
  );
}
