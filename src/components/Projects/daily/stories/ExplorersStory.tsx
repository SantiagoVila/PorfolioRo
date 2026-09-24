"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Archivo } from "next/font/google";
import { STORIES } from "../dailyContent";
import type { Box } from "../../useBox";
import type { StoryProps } from "../StoryLayer";
import { explorersHero, isWide as landscape } from "./geometry";
import {
  AUTHORS, CARTOGRAPHY, COLORS, DREAMERS, IDENTIKIT, INDEX, MACRO, SIGNALS, SIGNALS_SPREAD, SPREAD_SIZE, UNIVERSES,
} from "./explorersContent";

/**
 * EXPLORERS: the report on preteens, as a playful index. Its own paper,
 * slate, acid yellow and magenta, and its heavy grotesque; the index jumps
 * through the report; the introduction and the "señales de cambio" are set as
 * text, and the report's designed spreads carry the trend chapters. It opens
 * with its photograph filling the right half (where the newspaper's lands).
 */

// Variable font: every weight, plus the width axis for its extended display cuts.
const grotesk = Archivo({ subsets: ["latin"], axes: ["wdth"], display: "swap", preload: false });

const story = STORIES.explorers;

/**
 * The report's extended black display line. Set at `size`, then shrunk after
 * layout if any word is wider than its column (the extended cut is wide, and
 * widths vary by letter), so it never runs off the page.
 */
function Heading({ children, color = COLORS.slate, size }: { children: ReactNode; color?: string; size: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = size;
      const over = el.scrollWidth / Math.max(1, el.clientWidth);
      const s = over > 1.001 ? 1 / over : 1;
      el.style.fontSize = s < 1 ? `calc(${size} * ${s.toFixed(4)})` : size;
      setScale(s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement ?? el);
    // The display face loads after first layout; measure again once it has.
    let live = true;
    document.fonts?.ready.then(() => live && fit());
    return () => {
      live = false;
      ro.disconnect();
    };
  }, [size]);
  return (
    <h3 ref={ref} className="font-black uppercase leading-[0.86] tracking-[-0.01em] max-w-full" style={{ color, fontSize: scale < 1 ? `calc(${size} * ${scale.toFixed(4)})` : size, fontStretch: "118%" }}>
      {children}
    </h3>
  );
}

function SpreadImage({ src, alt, width, box }: { src: string; alt: string; width: number; box: Box }) {
  return (
    <div className="relative mx-auto" style={{ width, height: (width * SPREAD_SIZE.height) / SPREAD_SIZE.width }}>
      <Image src={src} alt={alt} fill sizes={`${Math.round((width / box.w) * 100)}vw`} className="object-contain" loading="lazy" draggable={false} />
    </div>
  );
}

export default function ExplorersStory({ box, heroRef, onBack, heroSizes }: StoryProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const wide = landscape(box);
  const hero = explorersHero(box);
  const pad = wide ? "px-[6vw]" : "px-5";
  const spreadW = Math.min(box.w - (wide ? box.w * 0.12 : 40), 1500);
  const jump = (anchor: string) => {
    const el = scroller.current?.querySelector<HTMLElement>(`#explorers-${anchor}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={scroller} className={`${grotesk.className} absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain`} style={{ background: COLORS.paper, color: COLORS.ink }} tabIndex={-1}>
      {/* Opening: the photograph fills its half, the title fills the other */}
      <header className="relative" style={{ height: wide ? box.h : hero.h + box.h * 0.46 }}>
        <div ref={heroRef} className="absolute overflow-hidden" style={{ left: hero.x, top: hero.y, width: hero.w, height: hero.h }}>
          <Image src={story.image.src} alt={story.image.alt} fill sizes={heroSizes} className="object-cover" style={{ objectPosition: story.image.focal }} loading="eager" draggable={false} />
        </div>
        <div className="absolute" style={wide ? { left: box.w * 0.05, top: box.h * 0.18, width: box.w * 0.42 } : { left: 20, right: 20, top: hero.h + 28 }}>
          <p className="uppercase tracking-[0.16em] text-[11px] font-bold" style={{ color: COLORS.slate }}>{story.kicker}</p>
          {/* Fitted to its half: the extended cut runs about 0.82em a letter. */}
          <Heading size={`${wide ? Math.min(box.h * 0.16, (box.w * 0.42) / (story.headline.length * 0.82)) : (box.w - 40) / (story.headline.length * 0.82)}px`}>{story.headline}</Heading>
          <p className="mt-5 font-bold uppercase leading-tight" style={{ color: COLORS.acid, fontSize: wide ? 26 : 19, fontStretch: "110%" }}>{story.subhead}</p>
          <p className="mt-4 text-[13px] uppercase tracking-[0.12em]" style={{ color: COLORS.slate }}>{AUTHORS}</p>
        </div>
      </header>

      {/* The report's index */}
      <nav aria-label="Índice del reporte" className={`${pad} py-20`}>
        <p className="font-black italic text-[44px] sm:text-[60px] tracking-[0.2em]" style={{ color: COLORS.acid }}>ÍNDICE</p>
        <ol className="mt-6 grid gap-2" style={{ gridTemplateColumns: wide ? "1fr 1fr" : "1fr" }}>
          {INDEX.map((item) => (
            <li key={item.label} className="flex items-center gap-3 text-[15px] uppercase font-bold tracking-[0.06em]" style={{ color: COLORS.slate, opacity: item.anchor ? 1 : 0.45 }}>
              <span aria-hidden className="inline-block w-2 h-2 rounded-full" style={{ background: "rgb(236, 142, 72)" }} />
              {item.anchor ? (
                <button onClick={() => jump(item.anchor!)} className="uppercase text-left hover:underline underline-offset-4 outline-none focus-visible:underline">
                  {item.label}
                </button>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Identi-kit */}
      <section id="explorers-identikit" className={`${pad} py-16`} style={{ scrollMarginTop: 24 }}>
        <p className="uppercase text-[12px] font-bold tracking-[0.2em]" style={{ color: COLORS.acid }}>{IDENTIKIT.label}</p>
        <Heading size={wide ? "clamp(40px, 4.4vw, 72px)" : "10vw"} color={COLORS.acid}>{IDENTIKIT.heading}</Heading>
        <div className="mt-10" style={{ columnCount: wide ? 2 : 1, columnGap: "5vw" }}>
          {IDENTIKIT.paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? "text-[21px] leading-[1.45] mb-5 font-medium" : "text-[17px] leading-[1.6] mb-5"}>{p}</p>
          ))}
        </div>
      </section>

      {/* Señales de cambio */}
      <section id="explorers-senales" className={`${pad} py-16`} style={{ scrollMarginTop: 24 }}>
        <Heading size={wide ? "clamp(56px, 7vw, 120px)" : "15vw"} color={COLORS.acid}>Señales de</Heading>
        <Heading size={wide ? "clamp(56px, 7vw, 120px)" : "15vw"}>cambio</Heading>
        <ol className="mt-12 grid gap-x-12 gap-y-10" style={{ gridTemplateColumns: wide ? "1fr 1fr" : "1fr" }}>
          {SIGNALS.map((s, i) => (
            <li key={s.title} className="grid gap-4" style={{ gridTemplateColumns: "auto 1fr" }}>
              <span className="font-black text-[28px] leading-none" style={{ color: COLORS.magenta }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="font-bold text-[17px] leading-snug">{s.title}</p>
                <p className="mt-2 text-[15px] leading-[1.55] opacity-85">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-16"><SpreadImage src={SIGNALS_SPREAD} alt="Página doble: Señales de cambio" width={spreadW} box={box} /></div>
      </section>

      {/* Macrotendencia */}
      <section id="explorers-macro" className="py-16" style={{ scrollMarginTop: 24 }}>
        <div className={pad}><SpreadImage src={MACRO.spreads[0]} alt="Página doble: macrotendencia" width={spreadW} box={box} /></div>
        <div className={`${pad} mt-14`} style={wide ? { display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "5vw" } : undefined}>
          <div>
            <Heading size={wide ? "clamp(56px, 7vw, 120px)" : "16vw"} color={COLORS.acid}>{MACRO.title}</Heading>
            <p className="mt-4 uppercase font-bold tracking-[0.1em] text-[13px]" style={{ color: COLORS.slate }}>Premisa: {MACRO.premise}</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {MACRO.terms.map((t) => (
                <li key={t} className="px-3 py-1.5 rounded-full text-[13px] font-semibold" style={{ background: COLORS.slate, color: COLORS.paper }}>{t}</li>
              ))}
            </ul>
          </div>
          <div className={wide ? "" : "mt-10"}>
            {MACRO.paragraphs.map((p, i) => <p key={i} className="text-[17px] leading-[1.6] mb-5">{p}</p>)}
          </div>
        </div>
        <div className={`${pad} mt-14`}><SpreadImage src={MACRO.spreads[1]} alt="Página doble: explorers" width={spreadW} box={box} /></div>
      </section>

      {/* Cartografía */}
      <section className={`${pad} py-16`} aria-label={CARTOGRAPHY.title}>
        {CARTOGRAPHY.spreads.map((src, i) => (
          <div key={src} className={i ? "mt-10" : ""}><SpreadImage src={src} alt={`Página doble: ${CARTOGRAPHY.title}`} width={spreadW} box={box} /></div>
        ))}
      </section>

      {/* Microtendencias: @Material Dreamers */}
      <section id="explorers-micro" className={`${pad} py-16`} style={{ scrollMarginTop: 24 }}>
        <SpreadImage src={DREAMERS.spreads[0]} alt="Página doble: microtendencias" width={spreadW} box={box} />
      </section>
      <section id="explorers-dreamers" className={`${pad} py-16`} style={{ scrollMarginTop: 24 }}>
        <Heading size={wide ? "clamp(48px, 6vw, 104px)" : "13vw"} color={COLORS.magenta}>{DREAMERS.title}</Heading>
        <p className="mt-4 uppercase font-bold tracking-[0.1em] text-[13px]" style={{ color: COLORS.slate }}>{DREAMERS.theme}</p>
        <div className="mt-8" style={{ columnCount: wide ? 2 : 1, columnGap: "5vw", maxWidth: 1200 }}>
          {DREAMERS.paragraphs.map((p, i) => <p key={i} className="text-[17px] leading-[1.6] mb-5">{p}</p>)}
        </div>
        {DREAMERS.spreads.slice(1).map((src, i) => (
          <div key={src} className="mt-12"><SpreadImage src={src} alt={`Página doble: @Material Dreamers ${i + 1}`} width={spreadW} box={box} /></div>
        ))}
        <ul className="mt-10 flex flex-wrap gap-2" aria-label="Carta de materialidades">
          {DREAMERS.materials.map((m) => (
            <li key={m} className="px-4 py-2 rounded-full text-[14px] font-bold uppercase tracking-[0.06em]" style={{ background: COLORS.magenta, color: "#fff" }}>{m}</li>
          ))}
        </ul>
      </section>

      {/* Universos */}
      <section className={`${pad} py-16`} aria-label="Universos">
        <SpreadImage src={UNIVERSES.spread} alt="Página doble: universos" width={spreadW} box={box} />
        <p className="mt-6 text-[15px] font-semibold uppercase tracking-[0.08em]" style={{ color: COLORS.slate }}>{UNIVERSES.terms.join(" · ")}</p>
      </section>

      <footer className={`${pad} pt-10 pb-24 flex flex-wrap gap-8 text-[14px] uppercase tracking-[0.14em] font-bold`} style={{ color: COLORS.slate }}>
        <a href={story.pdf.href} target="_blank" rel="noopener" className="border-b-2 pb-1 outline-none focus-visible:ring-2" style={{ borderColor: COLORS.acid }}>
          {story.pdf.label} ↗
        </a>
        <button onClick={onBack} aria-label="Back to The Daily" className="border-b-2 pb-1 uppercase tracking-[0.14em] font-bold outline-none focus-visible:ring-2" style={{ borderColor: COLORS.acid }}>
          ← The Daily
        </button>
      </footer>
    </div>
  );
}
