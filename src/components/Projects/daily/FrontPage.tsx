"use client";

import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FURNITURE, ISSUE, ORDER, STORIES, type Story, type StoryId } from "./dailyContent";
import { Grain, HALFTONE, INK, narrow, PAPER, serif } from "./paper";
import type { Box } from "../useBox";
import { DailyMark } from "./identity";

/**
 * THE DAILY's front page: three stories competing for the lead.
 *
 * Broadsheet (wide screens): the stories keep their columns; the one the
 * reader dwells on or focuses becomes the lead and the page is re-set around
 * it: its column widens, its headline grows, its photograph prints in colour
 * and its text runs longer, while the others compress into narrower columns
 * printed in black and white. The previous lead steps down to second.
 *
 * Tabloid (narrow screens): one long folded page, stories stacked with their
 * own fixed hierarchy; a tap goes straight into the story.
 */

type Props = {
  box: Box;
  ranking: StoryId[];
  onPromote: (id: StoryId) => void;
  onEnter: (id: StoryId) => void;
  registerImage: (id: StoryId) => (el: HTMLDivElement | null) => void;
  registerLink: (id: StoryId) => (el: HTMLAnchorElement | null) => void;
  /** A story is opening from (or open over) the page: the page parts around it. */
  parted: StoryId | null;
  /** Print the page in (first arrival only): hidden at first, then printed once `go` is set. */
  opening: boolean;
  go: boolean;
  reduced: boolean;
};

const EASE = "cubic-bezier(0.22, 0.7, 0.1, 1)";
const RELAYOUT = 650;
/** Column weights by rank: lead, second, third. */
const WEIGHTS = [5.6, 2.5, 1.9];
const INTENT_MS = 180;

export const isBroadsheet = (box: Box) => box.w >= 900 && box.w / box.h >= 1.1;

const hrefFor = (id: StoryId) => `?project=journalism&story=${id}`;

export default function FrontPage(props: Props) {
  return isBroadsheet(props.box) ? <Broadsheet {...props} /> : <Tabloid {...props} />;
}

/* ─────────────────────────────── shared pieces ─────────────────────────────── */

/** Ear, masthead and index: the top of the page, set exactly as on the desk newspaper. */
function Masthead({ size, onEnter, onPromote, opening, go, reduced, compact }: {
  size: number; onEnter: (id: StoryId) => void; onPromote?: (id: StoryId) => void; opening: boolean; go: boolean; reduced: boolean; compact: boolean;
}) {
  const print = opening && !reduced;
  const wait = print && !go;
  const flank = compact ? 10 : Math.round(Math.min(Math.max(size * 0.085, 10), 14));
  return (
    <header className="relative" style={{ color: INK }}>
      <motion.div
        className={`${narrow.className} flex justify-between uppercase tracking-[0.18em] text-[10px] sm:text-[11px] font-semibold`}
        // On the broadsheet the ear line runs under the shell's back button (top right): keep clear of it.
        style={compact ? undefined : { paddingRight: 250 }}
        initial={print ? { opacity: 0 } : false}
        animate={wait ? { opacity: 0 } : { opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.5 }}
      >
        <span lang="en">{ISSUE.volume} — {ISSUE.section}</span>
        <span>{ISSUE.years}</span>
      </motion.div>
      <motion.div
        className="mt-2 h-[3px] origin-center"
        style={{ background: INK }}
        initial={print ? { scaleX: 0 } : false}
        animate={wait ? { scaleX: 0 } : { scaleX: 1 }}
        transition={{ delay: 0.15, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
      />
      <div className={compact ? "flex flex-col items-center" : "grid grid-cols-[1fr_auto_1fr] items-center"} style={{ paddingBlock: size * 0.07 }}>
        {!compact && (
          <motion.span
            lang="en"
            className={`${narrow.className} uppercase tracking-[0.18em] font-semibold leading-[1.25] opacity-80`}
            style={{ fontSize: flank }}
            initial={print ? { opacity: 0 } : false}
            animate={wait ? { opacity: 0 } : { opacity: 0.8 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            {ISSUE.section.split(" & ").map((w, i) => <span key={w} className="block">{i ? `& ${w}` : w}</span>)}
          </motion.span>
        )}
        <motion.h2
          lang="en"
          className="leading-none"
          initial={print ? { opacity: 0, scale: 0.985 } : false}
          animate={wait ? { opacity: 0, scale: 0.985 } : { opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.2, 0.7, 0.1, 1] }}
        >
          <DailyMark size={size} label={ISSUE.masthead} />
        </motion.h2>
        <motion.span
          className={`${narrow.className} uppercase tracking-[0.18em] font-semibold leading-[1.25] ${compact ? "mt-1" : "text-right"}`}
          style={{ fontSize: flank }}
          initial={print ? { opacity: 0 } : false}
          animate={wait ? { opacity: 0 } : { opacity: 0.8 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          {compact ? ISSUE.author : ISSUE.author.split(" ").map((w) => <span key={w} className="block">{w}</span>)}
        </motion.span>
      </div>
      <motion.div
        className="h-px origin-center"
        style={{ background: INK }}
        initial={print ? { scaleX: 0 } : false}
        animate={wait ? { scaleX: 0 } : { scaleX: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
      />
      <motion.nav
        aria-label="Historias de esta edición"
        className={`${narrow.className} flex ${compact ? "flex-wrap gap-x-4 gap-y-1" : "justify-between"} items-center uppercase tracking-[0.16em] text-[10px] sm:text-[11px] font-semibold py-2`}
        initial={print ? { opacity: 0 } : false}
        animate={wait ? { opacity: 0 } : { opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {ORDER.map((id, i) => (
          <a
            key={id}
            href={hrefFor(id)}
            onClick={(e) => { e.preventDefault(); onEnter(id); }}
            onFocus={() => onPromote?.(id)}
            className="outline-none hover:underline underline-offset-4 focus-visible:underline"
          >
            <span className="opacity-50 mr-2">{String(i + 1).padStart(2, "0")}</span>
            {STORIES[id].headline}
          </a>
        ))}
      </motion.nav>
      <motion.div
        className="h-px origin-center"
        style={{ background: INK }}
        initial={print ? { scaleX: 0 } : false}
        animate={wait ? { scaleX: 0 } : { scaleX: 1 }}
        transition={{ delay: 0.25, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
      />
    </header>
  );
}

/* ─────────────────────────────── furniture ─────────────────────────────── */

const small = `${narrow.className} uppercase tracking-[0.16em] text-[9.5px] sm:text-[10px] font-semibold`;

/** A printer's registration mark. */
function Registration({ size = 14 }: { size?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 14 14" className="shrink-0" style={{ opacity: 0.55 }}>
      <circle cx="7" cy="7" r="4" fill="none" stroke={INK} strokeWidth="0.8" />
      <path d="M7 0V14M0 7H14" stroke={INK} strokeWidth="0.8" />
    </svg>
  );
}

/** A printer's colour bar: the four process inks. */
function ColourBar() {
  return (
    <span aria-hidden className="flex shrink-0" style={{ opacity: 0.7 }}>
      {["#00a0e3", "#e4007c", "#ffed00", INK].map((c) => <span key={c} className="block w-[7px] h-[7px]" style={{ background: c }} />)}
    </span>
  );
}

/** Crop marks at the corners of the printed area. */
function CropMarks({ inset }: { inset: number }) {
  const mark = (pos: CSSProperties, h: boolean) => (
    <span className="absolute block" style={{ ...pos, width: h ? 14 : 1, height: h ? 1 : 14, background: INK, opacity: 0.4 }} />
  );
  const o = inset * 0.35;
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {mark({ left: o, top: inset }, true)}{mark({ left: inset, top: o }, false)}
      {mark({ right: o, top: inset }, true)}{mark({ right: inset, top: o }, false)}
      {mark({ left: o, bottom: inset }, true)}{mark({ left: inset, bottom: o }, false)}
      {mark({ right: o, bottom: inset }, true)}{mark({ right: inset, bottom: o }, false)}
    </div>
  );
}

function PullQuote({ size }: { size: number }) {
  return (
    <figure>
      <blockquote className={`${serif.className} italic leading-[1.05]`} style={{ fontSize: size }}>“{FURNITURE.quote.text}”</blockquote>
      <figcaption className={`${small} mt-1.5 opacity-60`}>{FURNITURE.quote.source}</figcaption>
    </figure>
  );
}

function Keywords() {
  return (
    <div>
      <p className={small}>#Palabras clave · Reporte de Tendencias</p>
      <p className={`${serif.className} mt-1 text-[15px] leading-snug opacity-80`}>{FURNITURE.keywords.join(" · ")}</p>
    </div>
  );
}

function InThisIssue() {
  return (
    <div>
      <p className={small}>En esta edición</p>
      <ul className={`${serif.className} mt-1 text-[14px] leading-[1.35]`}>
        {FURNITURE.inThisIssue.map(([title, count]) => (
          <li key={title} className="flex justify-between gap-4"><span>{title}</span><span className="opacity-60 italic">{count}</span></li>
        ))}
      </ul>
    </div>
  );
}

/** The page's foot: colophon, quote, keywords, index, printer's marks. Real matter only. */
function FolioRail({ height }: { height: number }) {
  const cell = "min-w-0 px-5 first:pl-0 last:pr-0 border-l first:border-l-0";
  return (
    <div aria-hidden className="flex items-stretch border-t pt-3" style={{ height, borderColor: INK }}>
      <div className={`${cell} flex flex-col justify-between`} style={{ borderColor: "rgba(31,27,22,0.3)" }}>
        <p className={small}>{ISSUE.masthead} · {ISSUE.volume}</p>
        <p className={`${small} opacity-60`}>{ISSUE.section} · {ISSUE.years}</p>
      </div>
      <div className={`${cell} flex-[1.4]`} style={{ borderColor: "rgba(31,27,22,0.3)" }}><PullQuote size={20} /></div>
      <div className={`${cell} flex-[1.2]`} style={{ borderColor: "rgba(31,27,22,0.3)" }}><Keywords /></div>
      <div className={`${cell} flex-1`} style={{ borderColor: "rgba(31,27,22,0.3)" }}><InThisIssue /></div>
      <div className={`${cell} flex flex-col items-end justify-between`} style={{ borderColor: "rgba(31,27,22,0.3)" }}>
        <Registration />
        <ColourBar />
      </div>
    </div>
  );
}

/**
 * The story's photograph: in colour when it leads, printed in black-and-white
 * halftone when it does not. The print is a second, statically filtered copy
 * over the colour one; only its opacity changes, so the photograph is never
 * re-filtered while the page is being re-set.
 */
function Photo({ story, lead, height, registerImage, sizes, style }: {
  story: Story; lead: boolean; height: number | string; registerImage: (el: HTMLDivElement | null) => void; sizes: string; style?: CSSProperties;
}) {
  return (
    <div ref={registerImage} className="relative overflow-hidden" style={{ height, transition: `height ${RELAYOUT}ms ${EASE}`, background: "#e9e4da", ...style }}>
      <Image src={story.image.src} alt={story.image.alt} fill sizes={sizes} className="object-cover" style={{ objectPosition: story.image.focal }} loading="eager" draggable={false} />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: lead ? 0 : 1, transition: `opacity ${RELAYOUT}ms ${EASE}`, willChange: "opacity" }}
      >
        <Image
          src={story.image.src}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
          style={{ objectPosition: story.image.focal, filter: "grayscale(1) contrast(1.12) brightness(1.04)" }}
          loading="eager"
          draggable={false}
        />
        <div className="absolute inset-0 mix-blend-multiply" style={{ background: HALFTONE, opacity: 0.4 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────── broadsheet ─────────────────────────────── */

function Broadsheet({ box, ranking, onPromote, onEnter, registerImage, registerLink, parted, opening, go, reduced }: Props) {
  const m = Math.round(Math.min(Math.max(box.w * 0.028, 24), 60));
  const mastSize = Math.round(Math.min(Math.max(Math.min(box.w * 0.085, box.h * 0.125), 56), 168));
  const gutter = Math.round(Math.max(box.w * 0.02, 22));
  const headH = 28 + mastSize * 0.92 + 44 + 16;
  // The ear line sits level with the shell's back button (top right), so the rules below clear it.
  const top = Math.max(m * 0.7, 40);
  // The page's foot, only when the stories can spare the height: shorter pages
  // keep every pixel for the three stories.
  const bare = box.h - top - headH - m * 0.9;
  const rail = bare >= 620 ? 70 : 0;
  const rowH = bare - (rail ? rail + 16 : 0);
  const inner = box.w - m * 2 - gutter * 2;
  const rankOf = (id: StoryId) => ranking.indexOf(id);
  const widthOf = (id: StoryId) => (inner * WEIGHTS[rankOf(id)]) / WEIGHTS.reduce((a, b) => a + b, 0);

  // Promote on intent: a short dwell after the pointer has actually moved over
  // a story (the page may appear under a resting pointer), never a pass-over.
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armed = useRef<StoryId | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const cancel = () => { if (pending.current) clearTimeout(pending.current); pending.current = null; armed.current = null; };
  useEffect(() => cancel, []);
  const onMove = (id: StoryId, e: { pointerType: string; clientX: number; clientY: number }) => {
    if (e.pointerType !== "mouse" || parted) return;
    if (!origin.current) origin.current = { x: e.clientX, y: e.clientY };
    if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) < 8) return;
    if (ranking[0] === id || armed.current === id) return;
    cancel();
    armed.current = id;
    pending.current = setTimeout(() => { armed.current = null; onPromote(id); }, INTENT_MS);
  };

  const partedIndex = parted ? ORDER.indexOf(parted) : -1;
  const print = opening && !reduced;
  const move = reduced ? "none" : `transform 700ms ${EASE}, opacity 500ms ${EASE}`;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: PAPER, color: INK }}>
      <Grain />
      {/* A light fold across the middle, as on the paper on the desk */}
      <div aria-hidden className="absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 pointer-events-none bg-gradient-to-b from-transparent via-black/[0.035] to-white/[0.25]" />
      <div style={{ opacity: parted ? 0 : 1, transition: reduced ? "none" : `opacity 400ms ${EASE}` }}>
        <CropMarks inset={m * 0.5} />
      </div>
      <div
        className="absolute inset-x-0"
        style={{ top, paddingInline: m, opacity: parted ? 0 : 1, transition: reduced ? "none" : `opacity 400ms ${EASE}` }}
      >
        <Masthead size={mastSize} onEnter={onEnter} onPromote={onPromote} opening={opening} go={go} reduced={reduced} compact={false} />
      </div>
      {rail > 0 && (
        <motion.div
          className="absolute"
          style={{ left: m, right: m, top: top + headH + rowH + 16, opacity: parted ? 0 : 1, transition: reduced ? "none" : `opacity 400ms ${EASE}` }}
          initial={print ? { opacity: 0 } : false}
          animate={print && !go ? { opacity: 0 } : { opacity: parted ? 0 : 1 }}
          transition={{ delay: 0.75, duration: 0.6 }}
        >
          <FolioRail height={rail} />
        </motion.div>
      )}

      <div className="absolute flex" style={{ left: m, right: m, top: top + headH, height: rowH }}>
        {ORDER.map((id, i) => {
          const story = STORIES[id];
          const rank = rankOf(id);
          const lead = rank === 0;
          const colW = widthOf(id);
          // Headlines are set to fit their column: one line, or two for long ones.
          const perLine = story.headline.length > 12 ? Math.ceil(story.headline.length / 2) + 1 : story.headline.length;
          const cap = [rowH * 0.2, rowH * 0.095, rowH * 0.075][rank];
          const fs = Math.max(20, Math.min(cap, colW / (perLine * 0.5)));
          const imgH = [rowH * 0.42, rowH * 0.3, rowH * 0.24][rank];
          const away = partedIndex < 0 || id === parted ? 0 : i < partedIndex ? -1 : 1;
          return (
            <article
              key={id}
              className="relative min-w-0 h-full"
              style={{
                flexGrow: WEIGHTS[rank],
                flexBasis: 0,
                marginLeft: i === 0 ? 0 : gutter,
                transition: reduced ? "none" : `flex-grow ${RELAYOUT}ms ${EASE}`,
              }}
              onPointerMove={(e) => onMove(id, e)}
              onPointerLeave={cancel}
            >
              {i > 0 && <span aria-hidden className="absolute top-0 bottom-0 w-px" style={{ left: -gutter / 2, background: INK, opacity: 0.35 }} />}
              <motion.div
                className="h-full"
                initial={print ? { opacity: 0, x: (1 - i) * 36 } : false}
                animate={print && !go ? { opacity: 0, x: (1 - i) * 36 } : { opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + Math.abs(1 - i) * 0.08, duration: 0.8, ease: [0.2, 0.7, 0.1, 1] }}
              >
                <a
                  ref={registerLink(id)}
                  href={hrefFor(id)}
                  onClick={(e: MouseEvent) => { e.preventDefault(); cancel(); onEnter(id); }}
                  onFocus={() => { cancel(); if (!parted) onPromote(id); }}
                  aria-describedby={`daily-deck-${id}`}
                  className="group flex flex-col h-full outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-[#1f1b16] focus-visible:ring-offset-[#fdfbf7]"
                  style={{ transform: `translateX(${away * 14}vw)`, opacity: away ? 0 : 1, transition: move }}
                >
                  <p className={`${narrow.className} uppercase tracking-[0.14em] text-[10.5px] font-semibold pt-3`} style={{ opacity: parted === id ? 0 : 0.75, transition: move }}>
                    {story.kicker}
                  </p>
                  <h3
                    className={`${serif.className} font-semibold leading-[0.95] tracking-[-0.02em] mt-2`}
                    style={{ fontSize: fs, transition: reduced ? "none" : `font-size ${RELAYOUT}ms ${EASE}, opacity 400ms`, opacity: parted === id ? 0 : 1, textWrap: "balance" } as CSSProperties}
                  >
                    {story.headline}
                  </h3>
                  <p
                    className={`${serif.className} italic mt-2 leading-snug`}
                    style={{ fontSize: lead ? 21 : 15, transition: reduced ? "none" : `font-size ${RELAYOUT}ms ${EASE}, opacity 400ms`, opacity: parted === id ? 0 : 0.85 }}
                  >
                    {story.subhead}
                  </p>
                  <Photo story={story} lead={lead} height={imgH} registerImage={registerImage(id)} sizes="60vw" style={{ marginTop: 14 }} />
                  <div
                    id={`daily-deck-${id}`}
                    className={`${serif.className} relative flex-1 min-h-0 overflow-hidden mt-4 leading-[1.5]`}
                    style={{
                      fontSize: lead ? 16.5 : 14.5,
                      columnCount: lead && colW > 640 ? 2 : 1,
                      columnGap: 28,
                      transition: reduced ? "none" : `font-size ${RELAYOUT}ms ${EASE}, opacity 400ms`,
                      opacity: parted === id ? 0 : 1,
                      maskImage: "linear-gradient(to bottom, #000 78%, transparent)",
                      WebkitMaskImage: "linear-gradient(to bottom, #000 78%, transparent)",
                    }}
                  >
                    {story.deck.map((p, k) => (
                      <p key={k} className="mb-3" style={{ textIndent: k ? "1.2em" : 0 }}>{p}</p>
                    ))}
                  </div>
                  <div className={`${narrow.className} flex items-center justify-between gap-3 pt-3 pb-1 border-t uppercase tracking-[0.14em] text-[10.5px] font-semibold`} style={{ borderColor: "rgba(31,27,22,0.35)", opacity: parted === id ? 0 : 1, transition: move }}>
                    <span className="truncate">{story.byline}</span>
                    <span className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                      {lead ? "Leer →" : "→"}
                    </span>
                  </div>
                </a>
              </motion.div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────── tabloid ─────────────────────────────── */

function Tabloid({ box, onEnter, registerImage, registerLink, parted, opening, go, reduced }: Props) {
  const m = box.w >= 640 ? 40 : 20;
  // Solid under the shell's back control (top-6 / sm:top-8, ~31 px tall), fading out above the ear line.
  const headClear = box.w >= 640 ? 88 : 72;
  const mastSize = Math.round(Math.min(box.w * 0.19, 150));
  const wide = box.w >= 640;
  const print = opening && !reduced;
  const [first, second, third] = ORDER.map((id) => STORIES[id]);
  const partedStyle = (id: StoryId): CSSProperties => ({
    opacity: parted && parted !== id ? 0 : 1,
    transition: reduced ? "none" : `opacity 450ms ${EASE}`,
  });
  const textOff = (id: StoryId): CSSProperties => ({ opacity: parted === id ? 0 : 1, transition: reduced ? "none" : "opacity 350ms" });
  const link = (id: StoryId) => ({
    ref: registerLink(id),
    href: hrefFor(id),
    onClick: (e: MouseEvent) => { e.preventDefault(); onEnter(id); },
    className: "group block outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-[#1f1b16] focus-visible:ring-offset-[#fdfbf7]",
  });
  const kicker = (s: Story) => <p className={`${narrow.className} uppercase tracking-[0.14em] text-[10.5px] font-semibold opacity-75`}>{s.kicker}</p>;
  const byline = (s: Story) => (
    <p className={`${narrow.className} mt-3 pt-2 border-t uppercase tracking-[0.14em] text-[10.5px] font-semibold flex justify-between`} style={{ borderColor: "rgba(31,27,22,0.35)" }}>
      <span>{s.byline}</span><span aria-hidden>→</span>
    </p>
  );
  const rise = (d: number) => (print ? { initial: { opacity: 0, y: 24 }, animate: go ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }, transition: { delay: d, duration: 0.7, ease: [0.2, 0.7, 0.1, 1] as const } } : {});

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain" style={{ background: PAPER, color: INK }} data-daily-scroller>
      {/* The shell's "back to the desk" sits over the top of the page: the text
          scrolls under a strip of clean paper instead of colliding with it. */}
      <div
        aria-hidden
        className="sticky top-0 z-20 pointer-events-none"
        style={{ height: headClear, marginBottom: -headClear, background: `linear-gradient(${PAPER} 80%, rgba(253, 251, 247, 0))` }}
      />
      <div className="relative min-h-full" style={{ paddingInline: m, paddingTop: box.w >= 640 ? 96 : 76, paddingBottom: 48 }}>
        <Grain />
        <div style={{ opacity: parted ? 0 : 1, transition: reduced ? "none" : `opacity 400ms ${EASE}` }}>
          <Masthead size={mastSize} onEnter={onEnter} opening={opening} go={go} reduced={reduced} compact />
        </div>

        {/* 1: the lead, across the page */}
        <motion.article className="relative mt-6" style={partedStyle(first.id)} {...rise(0.4)}>
          <a {...link(first.id)} aria-describedby={`daily-deck-${first.id}`}>
            <div style={textOff(first.id)}>
              {kicker(first)}
              <h3 className={`${serif.className} font-semibold leading-[0.92] tracking-[-0.025em] mt-2`} style={{ fontSize: Math.min(box.w * 0.2, 128) }}>{first.headline}</h3>
              <p className={`${serif.className} italic mt-2 text-[19px] leading-snug`}>{first.subhead}</p>
            </div>
            <Photo story={first} lead height={Math.round((box.w - m * 2) * 0.66)} registerImage={registerImage(first.id)} sizes="100vw" style={{ marginTop: 16 }} />
            <div id={`daily-deck-${first.id}`} className={`${serif.className} mt-4 text-[16.5px] leading-[1.55]`} style={{ ...textOff(first.id), columnCount: wide ? 2 : 1, columnGap: 28 }}>
              {first.deck.map((p, k) => <p key={k} className="mb-3" style={{ textIndent: k ? "1.2em" : 0 }}>{p}</p>)}
            </div>
            <div style={textOff(first.id)}>{byline(first)}</div>
          </a>
        </motion.article>

        {/* Furniture: the article's own words, pulled out */}
        <motion.div className="mt-8 pt-4 border-t" style={{ ...partedStyle(first.id), borderColor: "rgba(31,27,22,0.35)" }} {...rise(0.5)}>
          <PullQuote size={wide ? 34 : 28} />
        </motion.div>

        <div aria-hidden className="mt-8 h-[3px]" style={{ background: INK }} />

        {/* 2: photograph beside the story */}
        <motion.article className="relative mt-5" style={partedStyle(second.id)} {...rise(0.55)}>
          <a {...link(second.id)} aria-describedby={`daily-deck-${second.id}`}>
            <div className="grid gap-4" style={{ gridTemplateColumns: "0.9fr 1.1fr" }}>
              <Photo story={second} lead={false} height={Math.round((box.w - m * 2) * 0.6)} registerImage={registerImage(second.id)} sizes="100vw" />
              <div style={textOff(second.id)}>
                {kicker(second)}
                <h3 className={`${serif.className} font-semibold leading-[0.98] tracking-[-0.02em] mt-2`} style={{ fontSize: Math.min(box.w * 0.085, 60) }}>{second.headline}</h3>
                <p className={`${serif.className} italic mt-2 text-[15px] leading-snug`}>{second.subhead}</p>
                <p id={`daily-deck-${second.id}`} className={`${serif.className} mt-3 text-[15px] leading-[1.5]`}>{second.deck[0]}</p>
              </div>
            </div>
            <div style={textOff(second.id)}>{byline(second)}</div>
          </a>
        </motion.article>

        <motion.div className={`mt-6 ${wide ? "grid grid-cols-2 gap-8" : "space-y-5"}`} style={partedStyle(second.id)} {...rise(0.6)}>
          <Keywords />
          <div>
            <p className={small}>Microtendencias · Explorers</p>
            <p className={`${serif.className} mt-1 text-[15px] leading-snug opacity-80`}>{FURNITURE.microtrends.join(" · ")}</p>
          </div>
        </motion.div>

        <div aria-hidden className="mt-7 h-px" style={{ background: INK, opacity: 0.6 }} />

        {/* 3: a narrower story, the photograph set into the text */}
        <motion.article className="relative mt-5" style={partedStyle(third.id)} {...rise(0.65)}>
          <a {...link(third.id)} aria-describedby={`daily-deck-${third.id}`}>
            <div style={textOff(third.id)}>
              {kicker(third)}
              <h3 className={`${serif.className} font-semibold leading-[0.95] tracking-[-0.02em] mt-2`} style={{ fontSize: Math.min(box.w * 0.14, 92) }}>{third.headline}</h3>
              <p className={`${serif.className} italic mt-2 text-[15px] leading-snug`}>{third.subhead}</p>
            </div>
            <div className="mt-4 grid gap-4" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
              <p id={`daily-deck-${third.id}`} className={`${serif.className} text-[15px] leading-[1.5]`} style={textOff(third.id)}>{third.deck[2]}</p>
              <Photo story={third} lead={false} height={Math.round((box.w - m * 2) * 0.42)} registerImage={registerImage(third.id)} sizes="100vw" />
            </div>
            <div style={textOff(third.id)}>{byline(third)}</div>
          </a>
        </motion.article>

        {/* The page's foot: the issue's index and colophon, with the printer's marks */}
        <div aria-hidden className="mt-10 pt-4 border-t-[3px]" style={{ ...partedStyle(third.id), borderColor: INK }}>
          <InThisIssue />
          <div className="mt-6 flex items-center justify-between">
            <p className={`${small} opacity-60`}>{ISSUE.masthead} · {ISSUE.volume} · {ISSUE.years}</p>
            <span className="flex items-center gap-3"><ColourBar /><Registration /></span>
          </div>
        </div>
      </div>
    </div>
  );
}
