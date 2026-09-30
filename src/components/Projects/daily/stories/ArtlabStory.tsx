"use client";

import Image from "next/image";
import { Anton, Lora } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { STORIES } from "../dailyContent";
import { Rich } from "../paper";
import type { StoryProps } from "../StoryLayer";
import { ABSTRACT, BIBLIOGRAPHY, CLOSING, NIGHT, PHOTOS, PLACE, ROOM, VOICES, type Photo } from "./artlabText";

/**
 * ARTLAB: a night reportage. The article as published, on black, with the red
 * of its cover headline and folios; Rosario's photographs where the article
 * places them. It opens on its night photograph at full bleed, the frame the
 * newspaper's photograph flies into.
 */

const display = Anton({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const text = Lora({ subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"], display: "swap", preload: false });

const NIGHT_BG = "#0c0b0a";
const LIGHT = "#ece6dc";
/** The red of the cover headline and folios, sampled from the PDF. */
const RED = "rgb(250, 52, 50)";

const story = STORIES.artlab;

function Picture({ p, sizes, className = "", style, priority = false }: { p: Photo; sizes: string; className?: string; style?: CSSProperties; priority?: boolean }) {
  return (
    <figure className={className} style={style}>
      <div className="relative w-full" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
        <Image src={p.src} alt={p.alt} fill sizes={sizes} className="object-cover" loading={priority ? "eager" : "lazy"} draggable={false} />
      </div>
      {(p.caption || p.folio) && (
        <figcaption className={`${text.className} mt-2 text-[13px]`} style={{ color: RED }}>
          {p.caption ?? p.folio}
        </figcaption>
      )}
    </figure>
  );
}

function Paragraphs({ items, lede = false }: { items: string[]; lede?: boolean }) {
  return (
    <>
      {items.map((t, i) => (
        <p key={i} className={lede ? "text-[20px] sm:text-[23px] leading-[1.5] mb-6" : "text-[17px] sm:text-[18px] leading-[1.7] mb-5"}>
          <Rich text={t} />
        </p>
      ))}
    </>
  );
}

function Chapter({ children, wide }: { children: ReactNode; wide: boolean }) {
  return <section className={`mx-auto ${wide ? "px-[6vw]" : "px-5"} py-16 sm:py-24`} style={{ maxWidth: 1440 }}>{children}</section>;
}

export default function ArtlabStory({ box, heroRef, onBack, heroSizes }: StoryProps) {
  const wide = box.w >= 900;
  const grid = (cols: string): CSSProperties => (wide ? { display: "grid", gridTemplateColumns: cols, gap: "4vw", alignItems: "start" } : {});
  return (
    <div className={`${text.className} absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain`} style={{ background: NIGHT_BG, color: LIGHT }} tabIndex={-1}>
      {/* Opening: the night outside ArtLab, the headline in the cover's red */}
      <header className="relative" style={{ height: box.h }}>
        <div ref={heroRef} className="absolute inset-0">
          <Image src={story.image.src} alt={story.image.alt} fill sizes={heroSizes} className="object-cover" style={{ objectPosition: story.image.focal }} loading="eager" draggable={false} />
        </div>
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(12,11,10,0) 35%, rgba(12,11,10,0.85) 88%)" }} />
        <div className={`absolute inset-x-0 bottom-0 ${wide ? "px-[6vw] pb-[7vh]" : "px-5 pb-10"}`}>
          <p className="uppercase tracking-[0.2em] text-[11px] sm:text-[12px]" style={{ color: RED }}>{story.kicker}</p>
          <h2 className={`${display.className} uppercase leading-[0.85] mt-3`} style={{ color: RED, fontSize: wide ? Math.min(box.w * 0.19, box.h * 0.34) : box.w * 0.27 }}>
            {story.headline}
          </h2>
          <p className="italic mt-4 text-[18px] sm:text-[22px]">{story.subhead}</p>
          <p className="mt-2 text-[13px] opacity-75">{story.byline}</p>
        </div>
      </header>

      {/* The abstract, beside the night's artist */}
      <Chapter wide={wide}>
        <div style={grid("1.35fr 1fr")}>
          <div>
            <Paragraphs items={ABSTRACT} lede />
          </div>
          <div className={wide ? "" : "mt-10"}>
            <Picture p={PHOTOS.performer} sizes={wide ? "34vw" : "100vw"} />
            <Picture p={PHOTOS.overhead} sizes={wide ? "18vw" : "60vw"} className="mt-6" style={{ width: wide ? "52%" : "64%", marginLeft: "auto" }} />
          </div>
        </div>
      </Chapter>

      {/* The place: (01) (02) (03) */}
      <Chapter wide={wide}>
        <div style={grid("1fr 1.15fr")}>
          <div>
            <Picture p={PHOTOS.phones} sizes={wide ? "30vw" : "100vw"} className="mb-10" />
            <Paragraphs items={PLACE} />
          </div>
          <div className={wide ? "pt-[12vh]" : "mt-8"}>
            <Picture p={PHOTOS.bar} sizes={wide ? "46vw" : "100vw"} />
            <Picture p={PHOTOS.dinner} sizes={wide ? "24vw" : "70vw"} className="mt-8" style={{ width: wide ? "56%" : "72%" }} />
            <Picture p={PHOTOS.night} sizes={wide ? "40vw" : "100vw"} className="mt-8" style={{ width: wide ? "86%" : "100%", marginLeft: "auto" }} />
          </div>
        </div>
      </Chapter>

      {/* The night of June 4 */}
      <Chapter wide={wide}>
        <div style={grid("1fr 1.2fr")}>
          <Picture p={PHOTOS.bawax} sizes={wide ? "38vw" : "100vw"} />
          <div className={wide ? "" : "mt-10"}>
            <Paragraphs items={NIGHT.slice(0, 2)} />
            <blockquote className={`${display.className} uppercase leading-[0.95] my-10`} style={{ color: RED, fontSize: wide ? "clamp(40px, 4.4vw, 76px)" : "11vw" }}>
              “ArtLab es lo más grande que hay”
            </blockquote>
            <Paragraphs items={NIGHT.slice(2)} />
          </div>
        </div>
      </Chapter>

      {/* The room, and the day after */}
      <Chapter wide={wide}>
        <div style={grid("1.15fr 1fr")}>
          <div><Paragraphs items={ROOM} /></div>
          <Picture p={PHOTOS.chairs} sizes={wide ? "34vw" : "100vw"} className={wide ? "pt-[10vh]" : "mt-8"} />
        </div>
      </Chapter>

      {/* The voices */}
      <Chapter wide={wide}>
        <Picture p={PHOTOS.albisu} sizes={wide ? "70vw" : "100vw"} style={{ width: wide ? "72%" : "100%" }} className="mb-12" />
        <div style={{ columnCount: wide ? 2 : 1, columnGap: "4vw" }}>
          <Paragraphs items={VOICES} />
        </div>
      </Chapter>

      {/* The regulars, and the conclusion */}
      <Chapter wide={wide}>
        <div className="grid gap-3 sm:gap-5" style={{ gridTemplateColumns: wide ? "repeat(4, 1fr)" : "repeat(2, 1fr)" }}>
          {[PHOTOS.bomber, PHOTOS.tracksuit, PHOTOS.scarf, PHOTOS.black].map((p) => (
            <div key={p.src} className="relative" style={{ aspectRatio: "2 / 3" }}>
              <Image src={p.src} alt={p.alt} fill sizes={wide ? "22vw" : "50vw"} className="object-cover" loading="lazy" draggable={false} />
            </div>
          ))}
        </div>
        <div className="mt-14" style={{ maxWidth: 760 }}>
          <Paragraphs items={CLOSING} />
        </div>
      </Chapter>

      {/* Sources and the original document */}
      <footer className={`${wide ? "px-[6vw]" : "px-5"} pb-24 pt-8 border-t`} style={{ borderColor: "rgba(236,230,220,0.2)" }}>
        <p className="text-[13px] uppercase tracking-[0.18em]" style={{ color: RED }}>{BIBLIOGRAPHY.title}</p>
        <p className="mt-3 text-[15px] opacity-80">{BIBLIOGRAPHY.source}</p>
        <p className="mt-1 text-[15px] opacity-80">{BIBLIOGRAPHY.credit}</p>
        <div className="mt-8 flex flex-wrap gap-8 text-[13px] uppercase tracking-[0.18em]">
          <a href={story.pdf.href} target="_blank" rel="noopener" className="border-b pb-1 outline-none focus-visible:ring-2" style={{ borderColor: RED }}>
            {story.pdf.label} ↗
          </a>
          <button onClick={onBack} aria-label="Volver a la portada" className="border-b pb-1 uppercase tracking-[0.18em] outline-none focus-visible:ring-2" style={{ borderColor: RED }}>
            ← El Diario
          </button>
        </div>
      </footer>
    </div>
  );
}
