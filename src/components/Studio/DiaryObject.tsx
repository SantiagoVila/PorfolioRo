"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, MotionValue } from "framer-motion";
import { DeskShadows, LIFT, LIFT_SPRING } from "./BookObject";
import { Corners } from "./Corners";
import PrintLight from "./PrintLight";
import { edgeLocal } from "./deskLight";
import type { DeskObject } from "./sceneLayout";
import { ISSUE, ORDER, STORIES, type Story } from "@/components/Projects/daily/dailyContent";
import { DailyMark, narrow, serif } from "@/components/Projects/daily/identity";

/** Opacity for a layer: fixed, or driven by a transition. */
type Fade = number | MotionValue<number>;

interface DiaryObjectProps {
  title: string;
  category: string;
  /** Where and how it lies (its face and thickness on this layout). */
  object: DeskObject;
  delay?: number;
  /** Receives the newspaper's element, so a transition can start from its exact position. */
  onClick?: (el: HTMLElement) => void;
}

export const NEWSPRINT = "#e6dfcf";
const INK = "#1f1b16";

const PAPER_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

// Printed-photo dots, for the stories printed in black and white.
const HALFTONE = "radial-gradient(circle, rgba(20,17,14,0.7) 0.45px, transparent 0.75px) 0 0 / 1.6px 1.6px";

const [lead, second, third] = ORDER.map((id) => STORIES[id]);

function Kicker({ children }: { children: ReactNode }) {
  return <div className={`${narrow.className} text-[3.8px] uppercase tracking-[0.16em] font-semibold opacity-75 truncate`}>{children}</div>;
}

function Byline({ children }: { children: ReactNode }) {
  return (
    <div className={`${narrow.className} mt-[3px] pt-[2px] border-t-[0.5px] text-[3.6px] uppercase tracking-[0.14em] font-semibold truncate`} style={{ borderColor: "rgba(31,27,22,0.4)" }}>
      {children}
    </div>
  );
}

/** The story's own photograph as printed on newsprint: colour for the lead, halftone otherwise. */
function PrintedPhoto({ story, colour = false, className, sizes }: { story: Story; colour?: boolean; className: string; sizes: string }) {
  return (
    <div className={`relative overflow-hidden shrink-0 ${className}`} style={{ background: "#cfc6b4" }}>
      <Image
        src={story.image.src}
        alt=""
        fill
        sizes={sizes}
        className="object-cover mix-blend-multiply"
        style={{ objectPosition: story.image.focal, filter: colour ? "saturate(0.9) contrast(1.05) brightness(1.14)" : "grayscale(1) contrast(1.2) brightness(1.08)" }}
        draggable={false}
      />
      {!colour && <div className="absolute inset-0 mix-blend-multiply" style={{ background: HALFTONE, opacity: 0.55 }} />}
    </div>
  );
}

/**
 * EL DIARIO: a folded newspaper lying on the desk, by the magazines. The entry
 * point to the editorial archive (several stories), deliberately not a book,
 * but on the desk by the same physical logic as the magazines (see BookObject):
 * laid on the desk by its parent's transform, its shadows on the desk, its
 * thickness at its foot (a few folded sheets, seen edge on), the desk's light
 * over it. Nothing behind it: the paper is the object. Its parts are exported
 * so the opening transition can lift the very same paper.
 */
export default function DiaryObject({ title, category, object, delay = 0, onClick }: DiaryObjectProps) {
  const edge = edgeLocal(object);
  return (
    <motion.div
      role="button"
      tabIndex={0}
      lang="es"
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
      <NewspaperShadows edge={edge} />
      <motion.div className="absolute inset-0" variants={LIFT} initial="rest" transition={LIFT_SPRING}>
        <NewspaperEdge edge={edge} />
        <NewspaperFront title={title} category={category} />
        <PrintLight object={object} />
        <Corners />
      </motion.div>

      {/* Keyboard focus ring (in the desk's plane, around the paper and its edge) */}
      <div className="absolute -inset-2 ring-2 ring-[rgb(var(--scene-ink)/0.75)] opacity-0 group-focus-visible:opacity-100 pointer-events-none z-20" style={{ bottom: -edge - 8 }} />
    </motion.div>
  );
}

/** Its shadows on the desk: the same as every publication's (see BookObject's DeskShadows). */
export function NewspaperShadows({ opacity = 1, edge }: { opacity?: Fade; edge: number }) {
  return <DeskShadows opacity={opacity} edge={edge} />;
}

/** Its thickness at its foot: the folded sheets' edges, newsprint on newsprint. */
export function NewspaperEdge({ opacity = 1, edge }: { opacity?: Fade; edge: number }) {
  return (
    <motion.div className="absolute inset-x-0 top-full pointer-events-none" style={{ height: edge, opacity }}>
      <div
        className="absolute inset-0"
        style={{ background: `repeating-linear-gradient(to bottom, ${NEWSPRINT} 0 30%, #cfc6b3 30% 36%, #ddd5c3 36% 64%, #c9c0ad 64% 70%, #e0d8c7 70% 100%)` }}
      />
    </motion.div>
  );
}

interface NewspaperFrontProps {
  title: string;
  category: string;
  /** Room light on the desk; a lifted paper leaves it behind. */
  grade?: Fade;
  /** Printed matter (type, photos, creases). Fading it leaves blank paper. */
  ink?: Fade;
  paper?: string | MotionValue<string>;
}

/**
 * The front page: paper, then ink, then the room's light on top. It is the
 * issue that opens on screen, printed small: the same masthead and index, and
 * the three stories with their own photographs, ArtLab leading in colour.
 */
export function NewspaperFront({ title, category, grade = 1, ink = 1, paper = NEWSPRINT }: NewspaperFrontProps) {
  return (
    <motion.div
      className="absolute inset-0 border-[0.5px] border-black/25 overflow-hidden z-10"
      style={{ backgroundColor: paper, color: INK }}
    >
      <motion.div className="absolute inset-0 flex flex-col px-[12px] pt-[9px] pb-[11px]" style={{ opacity: ink }}>
        {/* Ear */}
        <div className={`${narrow.className} flex justify-between text-[4.6px] uppercase tracking-[0.2em] font-semibold opacity-80`}>
          <span>{ISSUE.volume} — {category}</span>
          <span>{ISSUE.city}, {ISSUE.years}</span>
        </div>
        <div className="mt-[2.5px] h-[1.6px]" style={{ background: INK }} />

        {/* Masthead, with its flanks: the same lockup as the open front page */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center pt-[3px] pb-[4px]">
          <span className={`${narrow.className} text-[4.2px] leading-[1.25] uppercase tracking-[0.18em] font-semibold opacity-80`}>
            {ISSUE.sectionLines.map((w) => <span key={w} className="block">{w}</span>)}
          </span>
          <div className="leading-none"><DailyMark size={52} label={title} /></div>
          <span className={`${narrow.className} text-[4.2px] leading-[1.25] uppercase tracking-[0.18em] font-semibold opacity-80 text-right`}>
            {ISSUE.author.split(" ").map((w) => <span key={w} className="block">{w}</span>)}
          </span>
        </div>
        <div className="h-[0.6px]" style={{ background: INK }} />
        <div className={`${narrow.className} flex justify-between text-[4.2px] uppercase tracking-[0.16em] font-semibold py-[2.5px]`}>
          {ORDER.map((id, i) => (
            <span key={id}><span className="opacity-50 mr-[2px]">{String(i + 1).padStart(2, "0")}</span>{STORIES[id].headline}</span>
          ))}
        </div>
        <div className="h-[0.6px]" style={{ background: INK }} />

        {/* The issue: ArtLab leads in colour; the two reports run beside it in black and white */}
        <div className="mt-[6px] grid grid-cols-[1.55fr_1fr] gap-x-[9px] flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <Kicker>{lead.kicker}</Kicker>
            <div className={`${serif.className} font-semibold text-[25px] leading-[0.9] tracking-[-0.025em] mt-[2px]`}>{lead.headline}</div>
            <div className={`${serif.className} italic text-[6.4px] leading-[1.2] mt-[2px] opacity-90`}>{lead.subhead}</div>
            <PrintedPhoto story={lead} colour className="h-[110px] mt-[4px]" sizes="(max-width: 900px) 45vw, 24vw" />
            <div className={`${serif.className} relative flex-1 min-h-0 overflow-hidden mt-[4px] text-[3.5px] leading-[1.45] text-justify`} style={{ columnCount: 2, columnGap: 5 }}>
              {lead.deck.map((p, k) => <p key={k} style={{ textIndent: k ? "1.2em" : 0 }}>{p}</p>)}
            </div>
            <Byline>{lead.byline}</Byline>
          </div>
          <div className="relative flex flex-col min-h-0">
            <span aria-hidden className="absolute top-0 bottom-0 -left-[5px] w-[0.5px]" style={{ background: INK, opacity: 0.45 }} />
            <Kicker>{second.kicker}</Kicker>
            <PrintedPhoto story={second} className="h-[70px] mt-[3px]" sizes="(max-width: 900px) 30vw, 14vw" />
            <div className={`${serif.className} font-semibold text-[10.5px] leading-[0.95] tracking-[-0.015em] mt-[3px]`}>{second.headline}</div>
            <div className={`${serif.className} italic text-[4.6px] leading-[1.2] mt-[2px] opacity-90`}>{second.subhead}</div>
            <Byline>{second.byline}</Byline>
            <div className="h-[0.6px] mt-[5px]" style={{ background: INK }} />
            <div className="mt-[4px] flex-1 min-h-0 flex flex-col">
              <Kicker>{third.kicker}</Kicker>
              <div className={`${serif.className} font-semibold text-[13px] leading-[0.9] tracking-[-0.02em] mt-[2px]`}>{third.headline}</div>
              <div className={`${serif.className} italic text-[4.6px] leading-[1.2] mt-[2px] opacity-90`}>{third.subhead}</div>
              <PrintedPhoto story={third} className="flex-1 min-h-[24px] mt-[3px]" sizes="(max-width: 900px) 30vw, 14vw" />
              <Byline>{third.byline}</Byline>
            </div>
          </div>
        </div>

        {/* Fold crease across the middle, plus a couple of softer handling creases */}
        <div className="absolute inset-x-0 top-[52%] h-[14px] -translate-y-1/2 pointer-events-none bg-gradient-to-b from-transparent via-black/[0.12] to-white/[0.22]" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(118deg,transparent_46%,rgba(0,0,0,0.06)_49%,rgba(255,255,255,0.12)_51%,transparent_54%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(64deg,transparent_70%,rgba(0,0,0,0.05)_72%,rgba(255,255,255,0.1)_73.5%,transparent_76%)]" />
      </motion.div>

      {/* Newsprint grain belongs to the paper, so blank paper keeps it */}
      <div className="absolute inset-0 opacity-[0.22] mix-blend-multiply pointer-events-none" style={{ backgroundImage: PAPER_NOISE }} />

      {/* (The desk's light over it: see PrintLight.) */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ opacity: grade }}>
        {/* Handled edges */}
        <div className="absolute inset-0 shadow-[inset_0_0_12px_rgba(90,70,40,0.16)]" />
      </motion.div>
    </motion.div>
  );
}
