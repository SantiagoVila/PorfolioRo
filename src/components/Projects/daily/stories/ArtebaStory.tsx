"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { Cormorant_Garamond } from "next/font/google";
import { STORIES } from "../dailyContent";
import { narrow } from "../paper";
import type { Box } from "../../useBox";
import type { StoryProps } from "../StoryLayer";
import { artebaHero, isWide as landscape } from "./geometry";
import { ARTIST, COVER, INTRO, SECTIONS, TRENDS, type Img, type Trend } from "./artebaContent";

/**
 * Reporte de Tendencias, arteba 2025: the report opened up as a dossier.
 *
 * The report is a research document with a clear structure: the fair, two
 * trends, an artist. Each trend is built the same way (a manifesto, its
 * formulations, keywords and theme, the works that define it, a palette with
 * its codes and a collage, the "Cartografía") and each has its own colour on
 * the page (pink, pale blue). So the story keeps that structure legible
 * instead of showing the pages: an index always in view (a margin on wide
 * screens, a tab row on narrow ones) says where you are; each trend opens on
 * its own colour; the works hang as a board with the report's tombstones; the
 * palette is real colour next to its codes. The cover is set again around the
 * collage, where the newspaper's photograph lands.
 */

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap", preload: false });

const WALL = "#f8f8f7";
const INK = "#26231f";
const story = STORIES.arteba;
const RAIL = 236;

const vw = (px: number, box: Box) => `${Math.max(10, Math.round((px / box.w) * 100))}vw`;
const label = `${narrow.className} uppercase tracking-[0.16em] text-[11px] font-semibold`;

function Cover({ box, heroRef, heroSizes }: { box: Box; heroRef: StoryProps["heroRef"]; heroSizes: string }) {
  const r = artebaHero(box);
  const wide = landscape(box);
  return (
    <section className="relative" style={{ height: box.h, background: WALL, color: INK }} aria-label={COVER.title.join(" ")}>
      <div ref={heroRef} className="absolute overflow-hidden" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
        <Image src={story.image.src} alt={story.image.alt} fill sizes={heroSizes} className="object-cover" style={{ objectPosition: story.image.focal }} loading="eager" draggable={false} />
      </div>
      <p
        className="absolute text-[30px] tracking-wide"
        style={wide ? { left: r.x - 58, top: r.y, writingMode: "vertical-rl", transform: "rotate(180deg)" } : { left: r.x, top: r.y - 52 }}
      >
        {COVER.tag}
      </p>
      <h2
        className="absolute leading-[1.02]"
        style={wide ? { left: r.x + r.w + box.w * 0.035, top: r.y, fontSize: Math.min(box.w * 0.052, 92) } : { left: r.x, top: r.y + r.h + 24, fontSize: box.w * 0.1 }}
      >
        {COVER.title[0]}
        <br />
        {COVER.title[1]}
      </h2>
      <p
        className="absolute text-right leading-[1.05]"
        style={wide ? { right: box.w * 0.06, top: r.y + r.h - 74, fontSize: 38 } : { right: box.w * 0.08, top: r.y + r.h + 24, fontSize: 26 }}
      >
        {COVER.fair[0]}
        <br />
        {COVER.fair[1]}
      </p>
      <p className="absolute text-[15px]" style={wide ? { left: r.x + r.w + 12, top: r.y + r.h - 130, writingMode: "vertical-rl" } : { left: r.x, top: r.y + r.h + 24 + box.w * 0.22 }}>
        {COVER.byline}
      </p>
    </section>
  );
}

/** Which section is in view (the one crossing the upper part of the screen). */
function useActive(scroller: RefObject<HTMLDivElement | null>) {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { root, rootMargin: "-30% 0px -65% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = root.querySelector(`#${s.id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [scroller]);
  return active;
}

/** The report's index: a margin on wide screens, a tab row on narrow ones. Always says where you are. */
function Index({ wide, active, go, height }: { wide: boolean; active: string; go: (id: string) => void; height: number }) {
  if (wide) {
    return (
      <nav aria-label="Índice del reporte" className="sticky top-0 self-start shrink-0 flex flex-col justify-between" style={{ width: RAIL, height, padding: "40px 28px 36px 40px" }}>
        <div>
          <p className="italic text-[24px] leading-[1.05]">{COVER.title.join(" ")}</p>
          <p className={`${label} mt-2 opacity-60`}>{COVER.fair.join(" ")} · {COVER.byline}</p>
          <ol className="mt-10 space-y-3.5">
            {SECTIONS.map((s) => {
              const on = s.id === active;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => go(s.id)}
                    aria-current={on ? "true" : undefined}
                    className="group flex items-baseline gap-3 text-left outline-none focus-visible:underline underline-offset-4"
                  >
                    <span aria-hidden className="block h-px shrink-0 bg-current transition-all duration-300" style={{ width: on ? 22 : 8, opacity: on ? 1 : 0.35 }} />
                    <span className="text-[18px] leading-tight transition-opacity duration-300" style={{ opacity: on ? 1 : 0.5 }}>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <a href={story.pdf.href} target="_blank" rel="noopener" className={`${label} opacity-70 hover:opacity-100 border-b pb-1 self-start outline-none focus-visible:ring-2`} style={{ borderColor: INK }}>
          {story.pdf.label} ↗
        </a>
      </nav>
    );
  }
  return (
    <nav aria-label="Índice del reporte" className="sticky top-0 z-[5] border-b" style={{ background: WALL, borderColor: "rgba(38,35,31,0.15)" }}>
      {/* Left of the story's own back control (top right). */}
      <ol className="flex items-center gap-5 px-5" style={{ height: 88, paddingTop: 22, paddingRight: 150 }}>
        {SECTIONS.map((s) => {
          const on = s.id === active;
          return (
            <li key={s.id}>
              <button onClick={() => go(s.id)} aria-current={on ? "true" : undefined} aria-label={s.label} className={`${label} outline-none focus-visible:underline pb-1 border-b transition-opacity`} style={{ opacity: on ? 1 : 0.45, borderColor: on ? INK : "transparent" }}>
                {s.short}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Figure({ image, width, box, caption }: { image: Img; width: number; box: Box; caption?: ReactNode }) {
  return (
    <figure style={{ width }}>
      <div className="relative w-full" style={{ height: (width * image.height) / image.width, background: "#ecebe8" }}>
        <Image src={image.src} alt={image.alt} fill sizes={vw(width, box)} className="object-cover" loading="lazy" draggable={false} />
      </div>
      {caption && <figcaption className="mt-3">{caption}</figcaption>}
    </figure>
  );
}

function Informe({ box, col, wide }: { box: Box; col: number; wide: boolean }) {
  const [stand, aisle] = INTRO.photos;
  const photoW = wide ? col * 0.44 : col;
  return (
    <section id="informe" aria-label="El informe" className="scroll-mt-24" style={{ padding: wide ? "96px 0 72px" : "40px 0 48px" }}>
      <p className={`${label} opacity-60`}>El informe</p>
      <h2 className="mt-3 leading-[1.02]" style={{ fontSize: wide ? Math.min(col * 0.06, 64) : 38, maxWidth: "18ch" }}>{INTRO.title}</h2>
      <div className={wide ? "mt-12 flex items-start gap-12" : "mt-8"}>
        <div className="text-[18px] leading-[1.6] space-y-4" style={{ maxWidth: "58ch", flex: wide ? 1 : undefined }}>
          {INTRO.paragraphs.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
        </div>
        <div className={wide ? "space-y-6" : "mt-10 space-y-6"} style={{ width: photoW, flexShrink: 0 }}>
          <Figure image={stand} width={photoW} box={box} />
          <Figure image={aisle} width={photoW} box={box} />
        </div>
      </div>
    </section>
  );
}

/** One trend, as the report builds it: its colour, manifesto, formulations, keywords, works, palette and cartography. */
function TrendSection({ t, box, col, wide }: { t: Trend; box: Box; col: number; wide: boolean }) {
  const cols = wide ? 3 : 2;
  const gap = wide ? 28 : 14;
  const tileW = (col - gap * (cols - 1)) / cols;
  // Board: the works dealt into columns, each into the shortest one so far.
  const board: { w: Trend["works"][number]; i: number }[][] = Array.from({ length: cols }, () => []);
  const heights = Array(cols).fill(0);
  t.works.forEach((w, i) => {
    const c = heights.indexOf(Math.min(...heights));
    board[c].push({ w, i });
    heights[c] += (tileW * w.image.height) / w.image.width + 90;
  });
  const cartoW = wide ? Math.min(col * 0.52, (box.h * 0.92 * t.cartografia.width) / t.cartografia.height) : col;
  const fs = wide ? Math.min(col * 0.1, 128) : Math.min(box.w * 0.13, 64);
  const list = (items: string[], title: string) => (
    <div>
      <p className={`${label} mb-3`}>{title}</p>
      <ol className="space-y-2.5 text-[17px] leading-[1.45]">
        {items.map((x, i) => (
          <li key={x.slice(0, 20)} className="flex gap-3"><span className={`${narrow.className} text-[12px] font-semibold opacity-50 pt-1`}>{i + 1}</span><span>{x}</span></li>
        ))}
      </ol>
    </div>
  );
  return (
    <section id={t.id} aria-label={t.title} className="scroll-mt-24" style={{ paddingBottom: wide ? 96 : 56 }}>
      {/* Opening: the trend's own colour, name and theme; the palette with its codes. */}
      <header style={{ background: t.band, margin: wide ? "0 -40px" : "0 -20px", padding: wide ? "72px 40px 40px" : "40px 20px 28px" }}>
        <p className={`${label} opacity-60`}>Tendencia {t.n}</p>
        <h2 className="mt-2 leading-[0.92] tracking-[-0.01em]" style={{ fontSize: fs }}>{t.title}</h2>
        <p className="mt-4 italic text-[22px]">{t.theme[0]} · {t.theme[1]}</p>
        <div className="mt-10">
          <p className={`${label} mb-3 opacity-70`}>Paleta de la tendencia</p>
          <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${wide ? 8 : 4}, minmax(0, 1fr))` }}>
            {t.palette.map((c) => (
              <li key={c.code}>
                <span className="block h-12 sm:h-14 border" style={{ background: c.color, borderColor: "rgba(38,35,31,0.12)" }} />
                <span className={`${narrow.className} mt-1.5 block text-[10.5px] tracking-[0.06em] font-semibold`}>{c.code}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* The manifesto, and the keywords beside it (the report's slashes). */}
      <div className={wide ? "mt-16 flex items-start gap-14" : "mt-10"}>
        <div className="text-[19px] leading-[1.6] space-y-4" style={{ maxWidth: "60ch", flex: wide ? 1 : undefined }}>
          {t.manifesto.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
        </div>
        <div className={wide ? "shrink-0" : "mt-10"} style={{ width: wide ? col * 0.3 : undefined }}>
          <p className="text-[26px] font-semibold">#Palabras clave</p>
          <ul className="mt-3 space-y-1">
            {t.keywords.map((k, i) => (
              <li key={k} className="text-[24px] leading-[1.2]">
                <span aria-hidden className="opacity-60">{"/".repeat(4 + ((i * 5) % 9))}</span>
                {k}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The formulations. */}
      <div className={wide ? "mt-16 grid grid-cols-3 gap-12" : "mt-12 space-y-10"}>
        {list(t.rectoras, "Formulaciones rectoras")}
        {list(t.latentes, "Formulaciones latentes")}
        <div>
          <p className={`${label} mb-3`}>Partido morfológico</p>
          <div className="space-y-2.5 text-[17px] leading-[1.45]">{t.morfologico.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}</div>
        </div>
      </div>

      {/* The works: a board, with the report's tombstones. */}
      <div className="mt-16">
        <p className={`${label} mb-6`}>Obras</p>
        <div className="flex items-start" style={{ gap }}>
          {board.map((column, c) => (
            <div key={c} className="flex flex-col" style={{ gap: wide ? 40 : 28, width: tileW }}>
              {column.map(({ w }) => (
                <Figure
                  key={w.artist}
                  image={w.image}
                  width={tileW}
                  box={box}
                  caption={
                    <>
                      <span className={`${narrow.className} block text-[12px] font-semibold uppercase tracking-[0.1em]`}>{w.artist}</span>
                      {w.work && <span className="mt-1 block italic text-[16px] leading-snug opacity-85">{w.work}</span>}
                    </>
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* The cartography: the report's collage of the trend, and its word, spelled out as printed. */}
      <div className={wide ? "mt-20 flex items-center gap-14" : "mt-14"}>
        <Figure image={t.cartografia} width={cartoW} box={box} />
        <p aria-label="Cartografía" className={`${wide ? "" : "mt-8"} leading-[1.1] uppercase`} style={{ fontSize: wide ? Math.min(col * 0.07, 96) : 60 }}>
          <span className="block">Car</span>
          <span className="block pl-[1.4em]">To</span>
          <span className="block pl-[0.8em]">Gra</span>
          <span className="block">Fia <span className="normal-case">)))</span></span>
        </p>
      </div>
    </section>
  );
}

function Artist({ box, col, wide }: { box: Box; col: number; wide: boolean }) {
  const photoW = wide ? Math.min(col * 0.42, (box.h * 0.86 * ARTIST.photo.width) / ARTIST.photo.height) : col;
  return (
    <section id="artista" aria-label={ARTIST.name} className="scroll-mt-24" style={{ padding: wide ? "72px 0 96px" : "24px 0 56px" }}>
      <p className={`${label} opacity-60`}>Artista</p>
      <h2 className="mt-2 leading-[0.95]" style={{ fontSize: wide ? Math.min(col * 0.08, 104) : 52 }}>{ARTIST.name}</h2>
      <div className={wide ? "mt-12 flex items-start gap-14" : "mt-8"}>
        <div style={{ flex: wide ? 1 : undefined }}>
          <div className="text-[19px] leading-[1.6] space-y-4" style={{ maxWidth: "58ch" }}>
            {ARTIST.paragraphs.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
          </div>
          <div className="mt-10 flex items-end gap-6">
            <Figure image={ARTIST.portrait} width={wide ? 150 : 120} box={box} />
            <Figure image={ARTIST.views} width={wide ? 340 : col - 146} box={box} />
          </div>
        </div>
        <div className={wide ? "shrink-0" : "mt-10"}>
          <Figure
            image={ARTIST.photo}
            width={photoW}
            box={box}
            caption={
              <>
                <span className={`${narrow.className} block text-[12px] font-semibold uppercase tracking-[0.1em]`}>{ARTIST.name}</span>
                <span className="mt-1 block italic text-[16px] opacity-85">{ARTIST.work}</span>
              </>
            }
          />
        </div>
      </div>
    </section>
  );
}

function Ending({ onBack }: { onBack: () => void }) {
  return (
    <section className="py-20 border-t" style={{ borderColor: "rgba(38,35,31,0.15)" }}>
      <p className="italic text-[40px] leading-tight">{COVER.title.join(" ")}</p>
      <p className="mt-2 text-[18px]">{COVER.fair.join(" ")} · {COVER.byline}</p>
      <div className="mt-10 flex flex-wrap gap-8 text-[15px] uppercase tracking-[0.16em]">
        <a href={story.pdf.href} target="_blank" rel="noopener" className="border-b pb-1 outline-none focus-visible:ring-2" style={{ borderColor: INK }}>
          {story.pdf.label} ↗
        </a>
        <button onClick={onBack} aria-label="Back to The Daily" className="border-b pb-1 uppercase tracking-[0.16em] outline-none focus-visible:ring-2" style={{ borderColor: INK }}>
          ← The Daily
        </button>
      </div>
    </section>
  );
}

export default function ArtebaStory({ box, heroRef, onBack, heroSizes }: StoryProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const reduced = !!useReducedMotion();
  const wide = landscape(box);
  const active = useActive(scroller);
  const m = wide ? 40 : 20;
  const col = Math.min(wide ? box.w - RAIL - m * 2 : box.w - m * 2, 1180);
  const go = (id: string) => scroller.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  return (
    <div ref={scroller} className={`${serif.className} absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain`} style={{ background: WALL, color: INK }} tabIndex={-1}>
      <Cover box={box} heroRef={heroRef} heroSizes={heroSizes} />
      <div className={wide ? "flex items-start" : ""}>
        <Index wide={wide} active={active} go={go} height={box.h} />
        <div style={{ width: wide ? col : undefined, padding: `0 ${m}px`, boxSizing: "content-box" }}>
          <Informe box={box} col={col} wide={wide} />
          {TRENDS.map((t) => <TrendSection key={t.id} t={t} box={box} col={col} wide={wide} />)}
          <Artist box={box} col={col} wide={wide} />
          <Ending onBack={onBack} />
        </div>
      </div>
    </div>
  );
}
