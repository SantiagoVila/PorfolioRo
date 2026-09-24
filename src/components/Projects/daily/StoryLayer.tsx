"use client";

import { useEffect, useRef, type ComponentType, type RefObject } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { STORIES, type StoryId } from "./dailyContent";
import { narrow } from "./paper";
import type { Box } from "../useBox";
import dynamic from "next/dynamic";
import { ARTEBA_TONE, ARTLAB_TONE, EXPLORERS_TONE, artebaHero, artlabHero, explorersHero, type Rect, type Tone } from "./stories/geometry";

export type { Rect };

/** Each story's code (and fonts) loads when it is entered; see `preloadStories`. */
const loaders = {
  artlab: () => import("./stories/ArtlabStory"),
  arteba: () => import("./stories/ArtebaStory"),
  explorers: () => import("./stories/ExplorersStory"),
};
export const preloadStories = () => Object.values(loaders).forEach((load) => void load());
const ArtlabStory = dynamic(loaders.artlab, { ssr: false });
const ArtebaStory = dynamic(loaders.arteba, { ssr: false });
const ExplorersStory = dynamic(loaders.explorers, { ssr: false });
export type StoryProps = {
  box: Box;
  heroRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  /** `sizes` of the photograph on the front page: the hero reuses the same loaded file. */
  heroSizes: string;
};

/** Each story is its own world; the newspaper only knows where its photograph lands. */
const WORLDS: Record<StoryId, { Story: ComponentType<StoryProps>; hero: (box: Box) => Rect; tone: Tone }> = {
  artlab: { Story: ArtlabStory, hero: artlabHero, tone: ARTLAB_TONE },
  arteba: { Story: ArtebaStory, hero: artebaHero, tone: ARTEBA_TONE },
  explorers: { Story: ExplorersStory, hero: explorersHero, tone: EXPLORERS_TONE },
};

export type StoryPhase = "entering" | "open" | "leaving";

type Props = {
  id: StoryId;
  phase: StoryPhase;
  /** Where the photograph sits on the front page. */
  from: Rect;
  box: Box;
  reduced: boolean;
  onLanded: () => void;
  onReturned: () => void;
  onBack: () => void;
  /** The `sizes` the front page used for this photograph, so the flight reuses the loaded file. */
  sizes: string;
};

const FLIGHT = { duration: 0.8, ease: [0.7, 0, 0.18, 1] as const };

/**
 * A story opening out of the newspaper: its photograph grows from its place
 * on the page into the story's own first composition, then the story takes
 * over; leaving reverses it. Sits above the shell's desk button and carries
 * its own way back to THE DAILY.
 */
export default function StoryLayer({ id, phase, from, box, reduced, onLanded, onReturned, onBack, sizes }: Props) {
  const { Story, hero, tone } = WORLDS[id];
  const story = STORIES[id];
  const heroRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(from.x), y = useMotionValue(from.y), w = useMotionValue(from.w), h = useMotionValue(from.h);
  // The travelling photograph is shown only while it flies (a motion value: no re-render).
  const flyer = useMotionValue(phase !== "open" && !reduced ? 1 : 0);
  const flyerVisibility = useTransform(flyer, (v) => (v ? "visible" : "hidden"));
  const content = useMotionValue(phase === "open" ? 1 : 0);

  // Latest callbacks, without restarting the flights when the parent re-renders.
  const cb = useRef({ onLanded, onReturned });
  useEffect(() => {
    cb.current = { onLanded, onReturned };
  });

  useEffect(() => {
    const stops: { stop: () => void }[] = [];
    if (phase === "entering") {
      const to = hero(box);
      if (reduced) {
        stops.push(animate(content, 1, { duration: 0.15, onComplete: () => cb.current.onLanded() }));
      } else {
        flyer.set(1);
        x.set(from.x); y.set(from.y); w.set(from.w); h.set(from.h);
        stops.push(animate(x, to.x, FLIGHT), animate(y, to.y, FLIGHT), animate(w, to.w, FLIGHT));
        stops.push(
          animate(h, to.h, {
            ...FLIGHT,
            onComplete: () => {
              stops.push(animate(content, 1, { duration: 0.35, onComplete: () => { flyer.set(0); cb.current.onLanded(); } }));
            },
          }),
        );
      }
    } else if (phase === "leaving") {
      if (reduced) {
        stops.push(animate(content, 0, { duration: 0.15, onComplete: () => cb.current.onReturned() }));
      } else {
        // From wherever the story's hero is now (it may be scrolled away), back to the page.
        const r = heroRef.current?.getBoundingClientRect();
        const start = r ? { x: r.left, y: r.top, w: r.width, h: r.height } : hero(box);
        x.set(start.x); y.set(start.y); w.set(start.w); h.set(start.h);
        flyer.set(1);
        stops.push(animate(content, 0, { duration: 0.3 }));
        stops.push(animate(x, from.x, FLIGHT), animate(y, from.y, FLIGHT), animate(w, from.w, FLIGHT));
        stops.push(animate(h, from.h, { ...FLIGHT, onComplete: () => cb.current.onReturned() }));
      }
    } else if (phase === "open") {
      content.set(1);
    }
    return () => stops.forEach((s) => s.stop());
    // The flight is keyed on the phase; geometry is read when it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Once the story is on screen, focus its way back.
  useEffect(() => {
    if (phase === "open") backRef.current?.focus({ preventScroll: true });
  }, [phase]);

  return (
    <div className="absolute inset-0 z-[90]" aria-label={story.headline} role="region">
      <motion.div className="absolute inset-0" style={{ opacity: content, pointerEvents: phase === "open" ? "auto" : "none" }} inert={phase !== "open"}>
        <Story box={box} heroRef={heroRef} onBack={onBack} heroSizes={sizes} />
        <button
          ref={backRef}
          onClick={onBack}
          className={`${narrow.className} absolute top-6 right-6 sm:top-8 sm:right-8 z-10 flex items-center gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] outline-none focus-visible:ring-2`}
          style={{ color: tone.ink, background: tone.paper }}
          aria-label="Back to The Daily"
        >
          <span aria-hidden>←</span> The Daily
        </button>
      </motion.div>
      <motion.div aria-hidden className="absolute left-0 top-0 overflow-hidden pointer-events-none" style={{ x, y, width: w, height: h, visibility: flyerVisibility }}>
        <Image src={story.image.src} alt="" fill sizes={sizes} className="object-cover" style={{ objectPosition: story.image.focal }} loading="eager" draggable={false} />
      </motion.div>
    </div>
  );
}
