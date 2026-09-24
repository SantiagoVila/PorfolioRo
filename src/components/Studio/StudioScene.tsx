"use client";

import Image from "next/image";
import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import type { StageFit } from "@/hooks/useStageFit";
import { PROJECTS } from "@/data/projectsData";
import BookObject from "./BookObject";
import DiaryObject from "./DiaryObject";
import { quadToMatrix3d } from "./perspective";
import {
  CAP_SLOT,
  DESK_IMAGE,
  DESK_OBJECTS,
  DeskObject,
  EXPLORE_HINT_Y,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  WALL_EDGE_Y,
  WALL_TEXT,
} from "./sceneLayout";
import { useDeskPan } from "./useDeskPan";

// Bands around the plate when it can't fill the screen continue its own
// edges: wall colour on top, floor colour at the bottom (sampled from desk-wide.png).
const LETTERBOX = "linear-gradient(to bottom, #b39e8e 0%, #b39e8e 40%, #30261e 70%, #30261e 100%)";
const EDGE_FADE = "linear-gradient(to bottom, transparent 0%, #000 6%, #000 94%, transparent 100%)";
// Ultra-wide fallback only (beyond ≈2.6:1, where the safe box limits the
// height): the plate's own side edges fade into the room tone behind it.
const SIDE_FADE = "linear-gradient(to right, transparent 0%, #000 3%, #000 97%, transparent 100%)";

interface StudioSceneProps {
  /** Stage fit, computed once in the page so the cap can land on the same stage. */
  fit: StageFit;
  /** Horizontal pan of the desk while exploring it on a phone (see useDeskPan); shared with the cap. */
  pan: MotionValue<number>;
  /** Receives the clicked object's element, so the opening starts from its exact position. */
  onSelectProject: (id: string, el: HTMLElement) => void;
  /** Object currently lifted off the desk by the project transition (hidden here meanwhile). */
  liftedId?: string | null;
}

/**
 * The physical studio desk. Layers, back to front:
 *   desk plate (environment only) → wall lettering → cap slot → desk objects.
 * Everything lives on a fixed 1280×960 stage that is scaled as one unit, so
 * objects stay glued to the plate at any viewport size. Labels sit outside the
 * stage (positioned from stage coordinates) so they stay legible when it shrinks.
 * The fit is shared with HeroStage, which lands the interactive cap in CAP_SLOT.
 *
 * On phones held upright the desk is shown larger than the screen and
 * explored by dragging: stage and labels move together as one camera, `pan`.
 */
export default function StudioScene({ fit, pan, onSelectProject, liftedId = null }: StudioSceneProps) {
  const reduced = !!useReducedMotion();
  const { explored, bind } = useDeskPan(fit, pan, reduced);
  const explore = fit.explore;
  return (
    <div
      // Clipped without being a scroll container (`clip`; `hidden` where it is
      // unsupported): focusing an object that is off screen must not scroll the
      // scene sideways under the camera.
      className={`absolute inset-0 overflow-hidden ${explore ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{ background: LETTERBOX, overflow: "clip", touchAction: explore ? "pan-y pinch-zoom" : undefined }}
      {...bind}
    >
      {/* The camera. Exploring: its own layer, so the whole desk is painted
          ahead of being dragged into view. */}
      <motion.div className="absolute inset-0" style={{ x: pan, willChange: explore ? "transform" : undefined }}>
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: STAGE_WIDTH,
            height: STAGE_HEIGHT,
            transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})`,
            visibility: fit.ready ? "visible" : "hidden",
            // Letterboxed (narrow screens): melt the plate's top/bottom edges into the bands
            maskImage: fit.y > 0 ? EDGE_FADE : undefined,
            WebkitMaskImage: fit.y > 0 ? EDGE_FADE : undefined,
          }}
        >
          {/* Environment */}
          <Image
            src={DESK_IMAGE}
            alt=""
            fill
            // Exploring, the plate is several screens wide.
            sizes={explore ? `${Math.ceil(((STAGE_WIDTH * fit.scale) / fit.viewportWidth) * 100)}vw` : "100vw"}
            className="object-cover pointer-events-none select-none"
            style={fit.x > 0 ? { maskImage: SIDE_FADE, WebkitMaskImage: SIDE_FADE } : undefined}
            loading="eager"
            draggable={false}
          />

          {/* Name painted on the wall, cut off by the desk's back edge */}
          <div
            className="absolute inset-x-0 top-0 overflow-hidden pointer-events-none select-none"
            style={{ height: WALL_EDGE_Y }}
            aria-hidden
          >
            <div
              className="absolute -translate-x-1/2 flex flex-col items-center text-[#191510] opacity-[0.08] mix-blend-multiply font-black tracking-[-0.045em] leading-[0.76] whitespace-nowrap"
              style={{ left: WALL_TEXT.x, top: WALL_TEXT.top, fontSize: WALL_TEXT.size }}
            >
              <span>ROSARIO</span>
              <span>MEDINA</span>
            </div>
          </div>

          {/* The cap's resting footprint. The cap itself is the Scene 1 CapViewer,
              flown here on scroll (see HeroStage), so there is only ever one. */}
          <div
            data-slot="cap"
            aria-hidden
            className="absolute pointer-events-none"
            style={{ left: CAP_SLOT.x, top: CAP_SLOT.y, width: CAP_SLOT.width, height: CAP_SLOT.height }}
          />

          {/* Desk objects, each projected onto its footprint in the reference */}
          {DESK_OBJECTS.map((obj, i) => (
            <DeskItem key={obj.id} object={obj} lifted={obj.id === liftedId}>
              <DeskObjectView object={obj} delay={0.1 * (i + 1)} onSelect={(el) => onSelectProject(obj.id, el)} />
            </DeskItem>
          ))}
        </div>

        {/* Labels */}
        {fit.ready &&
          DESK_OBJECTS.map((obj) => (
            <div
              key={obj.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-[6px] pointer-events-none text-[#191510]/75"
              style={{ left: fit.x + obj.labelAt[0] * fit.scale, top: fit.y + obj.labelAt[1] * fit.scale }}
            >
              <span className={`${explore ? "text-[9px]" : "text-[8px] md:text-[9px]"} font-bold uppercase tracking-[0.3em] whitespace-nowrap border-b border-[#191510]/35 pb-[5px] px-1`}>
                {obj.label}
              </span>
              <span className="w-3 h-px bg-[#191510]/35" />
            </div>
          ))}
      </motion.div>

      {explore && fit.ready && <ExploreHint fit={fit} range={explore} pan={pan} explored={explored} />}
    </div>
  );
}

/**
 * The only instruction: a short line under the desk, and a small track whose
 * mark shows which part of the desk is in view. The words go once the desk
 * has been dragged; the track stays, quietly.
 */
function ExploreHint({ fit, range, pan, explored }: { fit: StageFit; range: { min: number; max: number }; pan: MotionValue<number>; explored: MotionValue<number> }) {
  const TRACK = 56;
  const MARK = 14;
  // pan = max shows the left end of the desk; the mark sits at the left.
  const markX = useTransform(pan, (p) => {
    const k = range.max > range.min ? (range.max - p) / (range.max - range.min) : 0.5;
    return Math.min(1, Math.max(0, k)) * (TRACK - MARK);
  });
  const wordsOpacity = useTransform(explored, [0, 1], [0.85, 0]);
  const trackOpacity = useTransform(explored, [0, 1], [0.85, 0.4]);
  return (
    <div
      aria-hidden
      className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-[10px] pointer-events-none text-[#efe8dc] text-[8px] font-bold uppercase tracking-[0.3em] whitespace-nowrap"
      style={{ top: fit.y + EXPLORE_HINT_Y * fit.scale }}
    >
      <motion.span style={{ opacity: wordsOpacity }}>Drag to explore</motion.span>
      <motion.span className="flex items-center gap-[10px]" style={{ opacity: trackOpacity }}>
        <span>←</span>
        <span className="relative h-px bg-[#efe8dc]/35" style={{ width: TRACK }}>
          <motion.span className="absolute left-0 -top-px h-[3px] bg-[#efe8dc]" style={{ width: MARK, x: markX }} />
        </span>
        <span>→</span>
      </motion.span>
    </div>
  );
}

function DeskItem({ object, lifted, children }: { object: DeskObject; lifted: boolean; children: React.ReactNode }) {
  return (
    <div
      data-object-id={object.id}
      className="absolute left-0 top-0 origin-top-left"
      style={{
        width: object.width,
        height: object.height,
        transform: quadToMatrix3d(object.width, object.height, object.quad),
        // While lifted, its travelling double is on screen instead. Hidden, not
        // removed: it keeps its layout so its corners can still be measured.
        visibility: lifted ? "hidden" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function DeskObjectView({ object, delay, onSelect }: { object: DeskObject; delay: number; onSelect: (el: HTMLElement) => void }) {
  const project = PROJECTS[object.id];

  if (object.kind === "newspaper") {
    return <DiaryObject title="The Daily" category={project?.category ?? "Articles & Reports"} delay={delay} onClick={onSelect} />;
  }

  // Books only ever show a real cover; never invent one.
  if (!project?.coverImage) return null;

  return (
    <BookObject
      title={object.label}
      category={project.category}
      coverImage={project.coverImage}
      delay={delay}
      onClick={onSelect}
    />
  );
}
