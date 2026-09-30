"use client";

import { useEffect, useState, type FocusEvent, type PointerEvent, type ReactNode } from "react";
import Image from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { PROJECTS } from "@/data/projectsData";
import type { World } from "@/hooks/useWorld";
import BookObject from "./BookObject";
import DiaryObject from "./DiaryObject";
import PhoneObject from "./PhoneObject";
import { commitLight, LIGHT_CHANGE_MS, LOOK, moodImages, type Mood } from "./mood";
import { quadToMatrix3d } from "./perspective";
import {
  CAP_REST,
  CAP_SLOT,
  DESK_OBJECTS,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  WALL_ABOVE,
  WALL_EDGE_Y,
  capFor,
  objectFor,
  type DeskObject,
} from "./sceneLayout";
import { useLight, useLightChange } from "./useMood";
import { cameraTransform, project, wallText } from "./worldCamera";
import { useRevealed } from "../reveal";

interface StudioSceneProps {
  world: World;
  /** Receives the clicked object's element, so the opening starts from its exact position. */
  onSelectProject: (id: string, el: HTMLElement) => void;
  /** Object currently lifted off the desk by the project transition (hidden here meanwhile). */
  liftedId?: string | null;
  /** Her telephone: how present it is, how far its handset is lifted, and whether it rings (see page). */
  phoneShown: MotionValue<number>;
  phoneLift: MotionValue<number>;
  phoneRinging: boolean;
  /** The call is on (Contact): the dial's crest holds her colour, and the painted name gives the wall to her card (0–1). */
  phoneConnected: MotionValue<number>;
  callLight: MotionValue<number>;
}

/**
 * Rosario's studio: the one place the whole page happens in. Layers, back to
 * front, on a fixed stage (the 1672×941 photograph of the room in the visit's
 * light, its wall continued above it; see mood.ts) moved as one by the page's
 * camera (see worldCamera):
 *   the room → her name painted on the wall → cap footprint → her telephone by
 *   the window → the work lying on the desk → the light on the desk.
 * The name starts as the intro's identity, high and strong, and settles into
 * its painted place on the wall, softer, the cap standing in front of it. The
 * light falls on the wall in the intro and on the desk at work. The desk
 * carries no permanent words: a publication's name shows just in front of it
 * only while a pointer is over it or the keyboard is on it (outside the stage,
 * positioned from it, so it stays legible).
 *
 * Changing the light, the new photograph fades in over the old one (only the
 * room's layers change: nothing on the desk moves or is mounted again; each
 * thing takes the new light as it comes).
 *
 * The room is drawn on the client only (its light is the visitor's); until
 * then, and on the server, the stage is its tone alone.
 */
export default function StudioScene(props: StudioSceneProps) {
  const light = useLight();
  return <Room {...props} mood={light?.mood ?? "day"} pending={light?.pending ?? null} drawn={light !== null} />;
}

function Room({
  world,
  onSelectProject,
  liftedId = null,
  phoneShown,
  phoneLift,
  phoneRinging,
  phoneConnected,
  callLight,
  mood,
  pending,
  drawn,
}: StudioSceneProps & { mood: Mood; pending: Mood | null; drawn: boolean }) {
  const { view, camera, s, ready } = world;
  const portrait = view.portrait;
  const look = LOOK[mood];
  const transform = useTransform(camera, (c) => (view.w ? cameraTransform(view, c) : "none"));
  const letters = wallText(view);
  // The publication a pointer is over, or the keyboard is on: its name shows (see Labels).
  const [named, setNamed] = useState<string | null>(null);

  // The name: intro identity (higher, stronger) → painted on the wall (softer), in the light's own paint strength
  // (mixed from the last light's while the light changes).
  const { from, t: change } = useLightChange(drawn ? mood : null);
  const { lift, scale: introScale } = world.intro;
  const nameY = useTransform(s, (v) => -lift * (1 - Math.min(1, v)));
  const nameScale = useTransform(s, (v) => 1 + (introScale - 1) * (1 - Math.min(1, v)));
  // While a call is on, the painted name gives the wall over (see ContactVisit).
  const nameOpacity = useTransform(() => {
    const v = Math.min(1, Math.max(0, s.get()));
    const k = v * v * (3 - 2 * v);
    const strength = (m: Mood) => LOOK[m].name.intro + (LOOK[m].name.work - LOOK[m].name.intro) * k;
    const c = change.get();
    return (strength(from.get()) * (1 - c) + strength(mood) * c) * (1 - callLight.get());
  });
  // Light on the desk: dim while the camera is up the wall, full at work.
  const deskShade = useTransform(s, (v) => (v <= 1 ? 0.5 * Math.pow(1 - v, 1.3) : Math.min(0.42, (v - 1) * 0.32)));
  // The room's falloff, in the intro only (the eye goes to her name and the cap):
  // it lifts as the camera comes down to the desk framing, and then
  // leaves the layer tree (a full-screen blended layer costs every frame).
  const vignette = useTransform(s, (v) => (v >= 1 ? 0 : 1 - v * v * (3 - 2 * v)));
  const vignetteShown = useTransform(vignette, (o) => (o > 0 ? "visible" : "hidden"));
  // The objects answer only while the desk is the subject.
  const deskActive = useTransform(s, (v) => (Math.abs(v - 1) < 0.2 ? "auto" : "none"));

  // The photograph is drawn at up to the closest framing's scale: ask for an image that wide.
  const kMax = Math.max(0, ...world.cams.map((c) => c.k));
  const plateSizes = view.w && kMax ? `${Math.ceil(((STAGE_WIDTH * kMax) / view.w) * 100)}vw` : "100vw";

  // Entrance: as the curtain lifts, her name rises into its place on the wall (with reduced motion it only
  // fades in: the first state is the same on the server, which cannot know, and the rise takes no time).
  const revealed = useRevealed();
  const rise = 80;

  const { anchor: cap, scale: capScale } = capFor(view.layout);
  const capK = capScale / CAP_REST.scale;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: look.room, overflow: "clip" }}>
      <motion.div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transform, visibility: ready && drawn ? "visible" : "hidden" }}
      >
        {/* (Once the scene is measured: before that, `sizes` would ask for a file of the wrong width, fetched for nothing.) */}
        {drawn && view.w > 0 && <Plates mood={mood} pending={pending} sizes={plateSizes} />}

        {/* Her name, painted on the wall (multiplied into it: the window's light and the leaves' shadows fall across it) */}
        <div className="absolute inset-x-0 overflow-hidden pointer-events-none select-none" style={{ top: -WALL_ABOVE.height, height: WALL_ABOVE.height + WALL_EDGE_Y }}>
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, y: rise }}
            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: rise }}
            transition={{ duration: world.reduced ? 0.5 : 1.8, delay: world.reduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1], y: { duration: world.reduced ? 0 : 1.8, delay: world.reduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] } }}
          >
            <motion.h1
              className="absolute -translate-x-1/2 flex flex-col items-center mix-blend-multiply font-black tracking-[-0.045em] leading-[0.76] whitespace-nowrap uppercase origin-top transition-colors ease-in-out"
              style={{
                left: letters.x,
                top: WALL_ABOVE.height + letters.top,
                fontSize: letters.size,
                color: look.name.paint,
                transitionDuration: `${LIGHT_CHANGE_MS}ms`,
                y: nameY,
                scale: nameScale,
                opacity: nameOpacity,
              }}
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
            left: cap.x - (CAP_REST.stageAnchor.x - CAP_SLOT.x) * capK,
            top: cap.y - (CAP_REST.stageAnchor.y - CAP_SLOT.y) * capK,
            width: CAP_SLOT.width * capK,
            height: CAP_SLOT.height * capK,
          }}
        />

        {/* Her telephone, by the window. */}
        <PhoneObject layout={view.layout} shown={phoneShown} lift={phoneLift} ringing={phoneRinging} connected={phoneConnected} reduced={world.reduced} look={look.phone} />

        {/* The work, lying on the desk */}
        <motion.div className="absolute inset-0" style={{ pointerEvents: deskActive }}>
          {DESK_OBJECTS.map((obj, i) => {
            const lying = objectFor(obj, view.layout);
            return (
              <DeskItem key={obj.id} object={lying} lifted={obj.id === liftedId}>
                <DeskObjectView
                  object={lying}
                  delay={0.1 * (i + 1)}
                  onSelect={(el) => onSelectProject(obj.id, el)}
                  onFocus={() => world.currentState() !== 1 && world.go(1)}
                  onNear={(near) => setNamed((n) => (near ? obj.id : n === obj.id ? null : n))}
                />
              </DeskItem>
            );
          })}
        </motion.div>

        {/* The room's light: where it is not, the desk falls into shade */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 pointer-events-none"
          style={{ top: WALL_EDGE_Y - 6, bottom: 0, opacity: deskShade, background: `linear-gradient(to bottom, rgba(${look.shade},0.5), rgba(${look.shade},0.85) 70%)` }}
        />
      </motion.div>

      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: vignette, visibility: vignetteShown, background: `radial-gradient(125% 100% at 50% 44%, transparent 52%, rgba(${look.shade},0.34) 100%)` }}
      />

      {/* A publication's name, in front of it while a pointer or the keyboard is on it (landscape; at work; following the camera) */}
      {ready && !portrait && <Labels world={world} dark={look.darkLabels} named={liftedId ? null : named} />}
    </div>
  );
}

type Layer = { mood: Mood; loaded: number; shown: boolean };

/** Not quite hidden: a loaded set the compositor draws (unseen) before it fades in, so its first frame costs nothing. */
const PRIMED = 0.002;

/**
 * The room's photographs (and its wall continued above), one set per light.
 * A chosen light's set is loaded under the current one's, hidden; once both
 * its images are in, the room changes to it (commitLight: everything laid over
 * the photograph starts to take the new light at the same moment) and it fades
 * in over the old set (LIGHT_CHANGE_MS), which leaves once covered. The first
 * set is simply there (the curtain is still down).
 */
function Plates({ mood, pending, sizes }: { mood: Mood; pending: Mood | null; sizes: string }) {
  const [layers, setLayers] = useState<Layer[]>(() => [{ mood, loaded: 2, shown: true }]);
  const target = pending ?? mood;
  // A new light: its set goes on top, hidden until both its images have loaded.
  if (layers[layers.length - 1].mood !== target) {
    setLayers((ls) => [...ls.filter((l) => l.mood !== target), { mood: target, loaded: 0, shown: false }]);
  }
  // (Shown once the room has changed to it: see below.)
  const top = layers[layers.length - 1];
  if (top.mood === mood && !top.shown && top.loaded >= 2) {
    setLayers((ls) => ls.map((l) => (l.mood === mood ? { ...l, shown: true } : l)));
  }
  const loaded = (m: Mood) => setLayers((ls) => ls.map((l) => (l.mood === m ? { ...l, loaded: l.loaded + 1, shown: l.shown || (l.loaded + 1 >= 2 && m === mood) } : l)));
  // Both its images in and decoded: drawn unseen for two frames, then the room changes to it.
  const primed = top.loaded >= 2 && top.mood !== mood ? top.mood : null;
  useEffect(() => {
    if (!primed) return;
    let b = 0;
    const a = requestAnimationFrame(() => (b = requestAnimationFrame(() => commitLight(primed))));
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [primed]);
  // Loaded, and decoded before it is shown (so its first frame is not spent decoding it).
  const ready = (img: HTMLImageElement, m: Mood) => {
    img.decode().then(
      () => loaded(m),
      () => loaded(m),
    );
  };
  // Once the newest set has faded in, the ones beneath go.
  const settled = (m: Mood) => setLayers((ls) => (ls[ls.length - 1].mood === m && ls.length > 1 ? ls.slice(-1) : ls));

  return (
    <>
      {layers.map((l) => {
        const images = moodImages(l.mood);
        return (
          <div
            key={l.mood}
            className="absolute inset-0 pointer-events-none select-none transition-opacity ease-in-out"
            // (A layer of its own while the light changes: ready to fade, not painted again each frame.)
            style={{ opacity: l.shown ? 1 : l.loaded >= 2 ? PRIMED : 0, transitionDuration: l.shown ? `${LIGHT_CHANGE_MS}ms` : "0ms", willChange: layers.length > 1 ? "opacity" : undefined }}
            onTransitionEnd={(e) => e.target === e.currentTarget && l.shown && settled(l.mood)}
          >
            {/* The wall, continued above the photograph (reaching 2 px under it: their edges, anti-aliased
                at a fractional scale, would otherwise let a hairline of the background through). */}
            <Image
              src={images.wallAbove}
              alt=""
              width={STAGE_WIDTH}
              height={WALL_ABOVE.height + 2}
              sizes={sizes}
              className="absolute left-0 max-w-none"
              style={{ top: -WALL_ABOVE.height, width: STAGE_WIDTH, height: WALL_ABOVE.height + 2 }}
              priority
              draggable={false}
              onLoad={(e) => ready(e.currentTarget, l.mood)}
            />
            {/* The studio */}
            <Image src={images.plate} alt="" fill sizes={sizes} className="object-cover" priority draggable={false} onLoad={(e) => ready(e.currentTarget, l.mood)} />
          </div>
        );
      })}
    </>
  );
}

/** The publications' names: each shown only while it is `named` (a pointer over it, the keyboard on it). */
function Labels({ world, dark, named }: { world: World; dark: string[]; named: string | null }) {
  return (
    <>
      {DESK_OBJECTS.map((obj) => (
        <Label key={obj.id} world={world} obj={obj} dark={dark.includes(obj.id)} shown={named === obj.id} />
      ))}
    </>
  );
}

function Label({ world, obj, dark, shown }: { world: World; obj: DeskObject; dark: boolean; shown: boolean }) {
  const { view, camera, s } = world;
  const at = useTransform(camera, (c) => project(view, c, obj.labelAt[0], obj.labelAt[1]));
  const x = useTransform(at, (p) => p.x);
  const y = useTransform(at, (p) => p.y);
  const opacity = useTransform(s, (v) => Math.max(0, 1 - Math.abs(v - 1) * 2.5));
  return (
    <motion.div
      aria-hidden
      className={`absolute left-0 top-0 pointer-events-none transition-colors ease-in-out ${dark ? "text-[#191510]/90" : "text-[rgb(var(--scene-ink)/0.9)]"}`}
      style={{ x, y, opacity, translateX: "-50%", translateY: "-50%", transitionDuration: `${LIGHT_CHANGE_MS}ms` }}
    >
      {/* Comes up quickly as the publication lifts, and goes as quickly. */}
      <div
        className="flex flex-col items-center gap-[5px] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(3px)" }}
      >
        <span className="w-3 h-px bg-current opacity-45" />
        <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.3em] whitespace-nowrap pl-[0.3em]">{obj.label}</span>
      </div>
    </motion.div>
  );
}

function DeskItem({ object, lifted, children }: { object: DeskObject; lifted: boolean; children: ReactNode }) {
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

function DeskObjectView({
  object,
  delay,
  onSelect,
  onFocus,
  onNear,
}: {
  object: DeskObject;
  delay: number;
  onSelect: (el: HTMLElement) => void;
  onFocus: () => void;
  /** A mouse over it, or the keyboard on it (not a touch, which opens it at once). */
  onNear: (near: boolean) => void;
}) {
  const project = PROJECTS[object.id];
  const near = {
    onPointerEnter: (e: PointerEvent<HTMLDivElement>) => e.pointerType === "mouse" && onNear(true),
    onPointerLeave: () => onNear(false),
    onFocus: (e: FocusEvent<HTMLDivElement>) => {
      onFocus();
      if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) onNear(true);
    },
    onBlur: () => onNear(false),
  };

  if (object.kind === "newspaper") {
    return (
      <div className="w-full h-full" {...near}>
        <DiaryObject title={object.label} category={project?.category ?? "Investigación y tendencias"} object={object} delay={delay} onClick={onSelect} />
      </div>
    );
  }

  // Books only ever show a real cover; never invent one.
  if (!project?.coverImage) return null;

  return (
    <div className="w-full h-full" {...near}>
      <BookObject title={object.label} category={project.category} coverImage={project.coverImage} object={object} delay={delay} onClick={onSelect} />
    </div>
  );
}
