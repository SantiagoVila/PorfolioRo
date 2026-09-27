"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useTransform } from "framer-motion";
import { PROJECTS } from "@/data/projectsData";
import type { World } from "@/hooks/useWorld";
import BookObject from "./BookObject";
import DiaryObject from "./DiaryObject";
import { quadToMatrix3d } from "./perspective";
import {
  CAP_REST,
  CAP_SLOT,
  DESK_IMAGE,
  DESK_OBJECTS,
  PORTRAIT,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  WALL_ABOVE,
  WALL_EDGE_Y,
  WALL_TEXT,
  WALL_TEXT_PORTRAIT,
  type DeskObject,
  type Quad,
} from "./sceneLayout";
import { cameraTransform, project } from "./worldCamera";
import { useRevealed } from "../reveal";

// Around the photograph (only ever seen past its edges): wall tone above, floor tone below.
const ROOM = "linear-gradient(to bottom, #9c8676 0%, #b39e8e 45%, #30261e 70%, #30261e 100%)";

interface StudioSceneProps {
  world: World;
  /** Receives the clicked object's element, so the opening starts from its exact position. */
  onSelectProject: (id: string, el: HTMLElement) => void;
  /** Object currently lifted off the desk by the project transition (hidden here meanwhile). */
  liftedId?: string | null;
}

/**
 * Rosario's studio: the one place the whole page happens in. Layers, back to
 * front, on a fixed stage (the 1672×941 desk plate, its wall continued above
 * it) moved as one by the page's camera (see worldCamera):
 *   wall above → desk plate → her name on the wall → cap footprint → desk
 *   objects → the room's light.
 * The name starts as the intro's identity, high and strong, and settles into
 * its painted place on the wall, sinking behind the desk's back edge. The
 * light falls on the wall in the intro and on the desk at work; later it
 * leaves the desk again as the wall takes over. Labels sit outside the stage
 * (positioned from it) so they stay legible.
 *
 * Upright screens get the same desk with the objects two by two (PORTRAIT).
 */
export default function StudioScene({ world, onSelectProject, liftedId = null }: StudioSceneProps) {
  const { view, camera, s, ready } = world;
  const portrait = view.portrait;
  const transform = useTransform(camera, (c) => (view.w ? cameraTransform(view, c) : "none"));
  const letters = portrait ? WALL_TEXT_PORTRAIT : WALL_TEXT;

  // The name: intro identity (higher, stronger) → painted on the wall (work onwards).
  const { lift, scale: introScale } = world.intro;
  const nameY = useTransform(s, (v) => -lift * (1 - Math.min(1, v)));
  const nameScale = useTransform(s, (v) => 1 + (introScale - 1) * (1 - Math.min(1, v)));
  const nameOpacity = useTransform(s, (v) => 0.08 + 0.17 * Math.max(0, 1 - v * 1.25));
  // Light on the desk: dim in the intro (the wall is lit), full at work, receding again as the wall takes over.
  const deskShade = useTransform(s, (v) => (v <= 1 ? 0.62 * Math.pow(1 - v, 1.3) : Math.min(0.42, (v - 1) * 0.32)));
  // The room's falloff, in the intro only (the eye goes to her name and the cap):
  // it lifts as the camera comes down to the desk framing, and then
  // leaves the layer tree (a full-screen blended layer costs every frame).
  const vignette = useTransform(s, (v) => (v >= 1 ? 0 : 1 - v * v * (3 - 2 * v)));
  const vignetteShown = useTransform(vignette, (o) => (o > 0 ? "visible" : "hidden"));
  // The objects answer only while the desk is the subject.
  const deskActive = useTransform(s, (v) => (Math.abs(v - 1) < 0.2 ? "auto" : "none"));

  // The plate is drawn at up to the closest framing's scale: ask for an image that wide.
  const kMax = Math.max(0, ...world.cams.map((c) => c.k));
  const plateSizes = view.w && kMax ? `${Math.ceil(((STAGE_WIDTH * kMax) / view.w) * 100)}vw` : "100vw";

  // Entrance: as the curtain lifts, her name rises into its place on the wall.
  const revealed = useRevealed();
  const rise = world.reduced ? 0 : 80;

  const quadOf = (o: DeskObject): Quad => (portrait ? PORTRAIT.quads[o.id] ?? o.quad : o.quad);
  const cap = portrait ? PORTRAIT.capAnchor : CAP_REST.stageAnchor;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: ROOM, overflow: "clip" }}>
      <motion.div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform, visibility: ready ? "visible" : "hidden" }}
      >
        {/* The wall, continued above the photograph */}
        <Image
          src={WALL_ABOVE.src}
          alt=""
          width={STAGE_WIDTH}
          height={WALL_ABOVE.height}
          sizes={plateSizes}
          className="absolute left-0 max-w-none pointer-events-none select-none"
          style={{ top: -WALL_ABOVE.height, width: STAGE_WIDTH, height: WALL_ABOVE.height }}
          priority
          draggable={false}
        />
        {/* The studio */}
        <Image
          src={DESK_IMAGE}
          alt=""
          fill
          sizes={plateSizes}
          className="object-cover pointer-events-none select-none"
          priority
          draggable={false}
        />

        {/* Her name, on the wall: cut off by the desk's back edge */}
        <div className="absolute inset-x-0 overflow-hidden pointer-events-none select-none" style={{ top: -WALL_ABOVE.height, height: WALL_ABOVE.height + WALL_EDGE_Y }}>
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, y: rise }}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: rise }}
            transition={{ duration: world.reduced ? 0.5 : 1.8, delay: world.reduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.h1
              className="absolute -translate-x-1/2 flex flex-col items-center text-[#191510] mix-blend-multiply font-black tracking-[-0.045em] leading-[0.76] whitespace-nowrap uppercase origin-top"
              style={{ left: letters.x, top: WALL_ABOVE.height + letters.top, fontSize: letters.size, y: nameY, scale: nameScale, opacity: nameOpacity }}
            >
              <span>Rosario</span>
              <span>Medina</span>
            </motion.h1>
          </motion.div>
        </div>

        {/* The cap's resting footprint. The cap itself is the intro's CapViewer,
            flown here on scroll (see HeroStage), so there is only ever one. */}
        <div
          data-slot="cap"
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: cap.x - (CAP_REST.stageAnchor.x - CAP_SLOT.x),
            top: cap.y - (CAP_REST.stageAnchor.y - CAP_SLOT.y),
            width: CAP_SLOT.width,
            height: CAP_SLOT.height,
          }}
        />

        {/* Desk objects, each projected onto its footprint */}
        <motion.div className="absolute inset-0" style={{ pointerEvents: deskActive }}>
          {DESK_OBJECTS.map((obj, i) => (
            <DeskItem key={obj.id} object={obj} quad={quadOf(obj)} lifted={obj.id === liftedId}>
              <DeskObjectView object={obj} delay={0.1 * (i + 1)} onSelect={(el) => onSelectProject(obj.id, el)} onFocus={() => world.currentState() !== 1 && world.go(1)} />
            </DeskItem>
          ))}
        </motion.div>

        {/* The room's light: where it is not, the desk falls into shade */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 pointer-events-none"
          style={{ top: WALL_EDGE_Y - 6, bottom: 0, opacity: deskShade, background: "linear-gradient(to bottom, rgba(26,19,13,0.55), rgba(20,14,10,0.9) 70%)" }}
        />
      </motion.div>

      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: vignette, visibility: vignetteShown, background: "radial-gradient(125% 100% at 50% 44%, transparent 52%, rgba(22,15,10,0.38) 100%)" }}
      />

      {/* Labels (landscape): under each object, following the camera, only at work */}
      {ready && !portrait && <Labels world={world} />}
    </div>
  );
}

function Labels({ world }: { world: World }) {
  return (
    <>
      {DESK_OBJECTS.map((obj) => (
        <Label key={obj.id} world={world} obj={obj} />
      ))}
    </>
  );
}

function Label({ world, obj }: { world: World; obj: DeskObject }) {
  const { view, camera, s } = world;
  const at = useTransform(camera, (c) => project(view, c, obj.labelAt[0], obj.labelAt[1]));
  const x = useTransform(at, (p) => p.x);
  const y = useTransform(at, (p) => p.y);
  const opacity = useTransform(s, (v) => Math.max(0, 1 - Math.abs(v - 1) * 2.5));
  return (
    <motion.div
      aria-hidden
      className="absolute left-0 top-0 flex flex-col items-center gap-[6px] pointer-events-none text-[#191510]/90"
      style={{ x, y, opacity, translateX: "-50%", translateY: "-50%" }}
    >
      <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.3em] whitespace-nowrap border-b border-[#191510]/35 pb-[5px] px-1">{obj.label}</span>
      <span className="w-3 h-px bg-[#191510]/35" />
    </motion.div>
  );
}

function DeskItem({ object, quad, lifted, children }: { object: DeskObject; quad: Quad; lifted: boolean; children: ReactNode }) {
  return (
    <div
      data-object-id={object.id}
      className="absolute left-0 top-0 origin-top-left"
      style={{
        width: object.width,
        height: object.height,
        transform: quadToMatrix3d(object.width, object.height, quad),
        // While lifted, its travelling double is on screen instead. Hidden, not
        // removed: it keeps its layout so its corners can still be measured.
        visibility: lifted ? "hidden" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function DeskObjectView({ object, delay, onSelect, onFocus }: { object: DeskObject; delay: number; onSelect: (el: HTMLElement) => void; onFocus: () => void }) {
  const project = PROJECTS[object.id];

  if (object.kind === "newspaper") {
    return (
      <div className="w-full h-full" onFocus={onFocus}>
        <DiaryObject title="The Daily" category={project?.category ?? "Articles & Reports"} delay={delay} onClick={onSelect} />
      </div>
    );
  }

  // Books only ever show a real cover; never invent one.
  if (!project?.coverImage) return null;

  return (
    <div className="w-full h-full" onFocus={onFocus}>
      <BookObject title={object.label} category={project.category} coverImage={project.coverImage} delay={delay} onClick={onSelect} />
    </div>
  );
}
