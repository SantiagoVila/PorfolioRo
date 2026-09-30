"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { IBM_Plex_Mono, Reenie_Beanie } from "next/font/google";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { ABOUT } from "@/data/profile";
import { useFocusTrap } from "@/components/Projects/useFocusTrap";
import { safeInsets } from "@/components/safeArea";
import BackToDesk from "./BackToDesk";
import { aboutLayout, MASTHEAD, PRINT_BORDER, type AboutLayout } from "./aboutLayout";
import type { Visiting } from "./useVisit";
import { ABOUT_T, inOut, within } from "./visitTimeline";

const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", preload: false });
/** Her handwriting, for her own sentence. */
const pen = Reenie_Beanie({ subsets: ["latin"], weight: "400", display: "swap", preload: false });

/** Paper white, for words on the darkened room; its quieter shade for labels (still well above reading contrast there). */
const PAPER = "#f1ebe1";
const PAPER_QUIET = "rgba(241,235,225,0.74)";

/**
 * About: Rosario herself, met through the cap.
 *
 * The cap has been lifted and is held up facing the viewer (HeroStage), the
 * room dimmed behind it, so that the face it is printed with sits exactly
 * where her face is in her portrait, at the same size. Her photograph shows
 * first where that printed face is, then opens out into the whole print while
 * the rest of the cap falls away: the object that stands for her gives way to
 * her. Around the print, in the studio's own voice (the masthead of her About
 * page, typed captions, her own hand), her words, what she has studied and
 * uses, her two colours, and the way on to the phone. Only her content
 * (data/profile.ts).
 *
 * Three compositions: the print and the words side by side (wide screens);
 * the words in two columns beside a print as tall as the screen allows (a
 * phone held sideways); the masthead across the top, the print with her name
 * beside it, her words below (upright). Each fits its screen whole.
 *
 * Mounted from the moment the desk is reached (so the portrait is at hand
 * when the cap is picked up), shown only while the visit is on.
 */
export default function AboutVisit({ visit }: { visit: Visiting }) {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1, insets: safeInsets() }));
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1, insets: safeInsets() });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return <Visit visit={visit} L={aboutLayout(vp.w, vp.h, vp.dpr, vp.insets)} />;
}

function Visit({ visit, L }: { visit: Visiting; L: AboutLayout }) {
  const t = visit.about;
  const reduced = visit.reduced;
  const on = visit.current === "about";
  const open = on && visit.phase === "open";

  // Her face over the printed one (blurred across: one face changing, not two); then the print opens out from it.
  const faceIn = useTransform(t, (v) => (reduced ? within(v, [0, 1]) : within(v, ABOUT_T.face)));
  const faceBlur = useTransform(faceIn, (k) => (reduced || k >= 1 ? "none" : `blur(${(3 * (1 - k)).toFixed(2)}px)`));
  const opening = useTransform(t, (v) => (reduced ? 1 : inOut(within(v, ABOUT_T.print))));
  const b = PRINT_BORDER;
  const pw = L.photo.w + 2 * b.side;
  const ph = L.photo.h + b.side + b.bottom;
  const clip = useTransform(opening, (k) => {
    const f = L.face;
    const r = Math.min(pw - f.left - f.right, ph - f.top - f.bottom) * 0.42 * (1 - k) + 1.5 * k;
    return `inset(${(f.top * (1 - k)).toFixed(1)}px ${(f.right * (1 - k)).toFixed(1)}px ${(f.bottom * (1 - k)).toFixed(1)}px ${(f.left * (1 - k)).toFixed(1)}px round ${r.toFixed(1)}px)`;
  });
  // The print's shadow comes with its edges.
  const printShadow = useTransform(opening, (k) => `0 ${(18 * k).toFixed(1)}px ${(40 * k).toFixed(1)}px -${(14 * k).toFixed(1)}px rgba(0,0,0,${(0.7 * k).toFixed(2)})`);

  // Then her words, one after another (30 to 80 ms apart at full speed).
  const words = (i: number) => (v: number) => {
    const [a, z] = ABOUT_T.words;
    const step = (z - a) / 7;
    return reduced ? within(v, [0.4, 1]) : within(v, [a + i * step * 0.55, a + i * step * 0.55 + step * 2.2]);
  };

  const dialog = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) back.current?.focus({ preventScroll: true });
  }, [open]);
  useFocusTrap(dialog, open);
  const closeOpacity = useTransform(t, words(6));

  const { upright, short } = L;
  const wide = !upright && !short;
  const w = typeof window === "undefined" ? 1440 : window.innerWidth;
  const size = {
    name: upright ? 30 : short ? 28 : Math.round(Math.min(56, Math.max(44, w * 0.032))),
    voice: upright ? 16 : short ? 14 : 20,
    hand: upright ? 25 : short ? 20 : 30,
  };

  const masthead = (
    <h2 id="about-title" tabIndex={-1} className="outline-none inline-block" lang="en">
      <span
        className="block whitespace-nowrap px-3.5 pt-1.5 pb-2.5 text-[#1b1713] font-bold uppercase tracking-[0.04em] text-[13px] leading-none"
        style={{ background: PAPER, clipPath: TORN, transform: "rotate(-1.2deg)" }}
      >
        {ABOUT.studio} <span aria-hidden>|</span> {ABOUT.issue}
        <span className="sr-only">: about {ABOUT.name}</span>
      </span>
    </h2>
  );
  const name = (
    <p className="font-bold uppercase" style={{ fontSize: size.name, lineHeight: 0.86, letterSpacing: "-0.035em" }}>
      Rosario
      <br />
      Medina
    </p>
  );
  const competencies = (
    <p className={`${mono.className} uppercase`} style={{ fontSize: upright ? 9.5 : 10, lineHeight: 1.75, letterSpacing: "0.16em", color: "rgba(241,235,225,0.84)" }}>
      {ABOUT.competencies.items.join(" / ")}
    </p>
  );
  const voice = (
    <>
      <p style={{ fontSize: size.voice, lineHeight: 1.42, maxWidth: "34ch" }} className="text-pretty">
        {ABOUT.statement[0]}
      </p>
      {/* Her own sentence, in her own hand. */}
      <p className={`${pen.className} ${wide ? "mt-4" : "mt-2.5"}`} style={{ fontSize: size.hand, lineHeight: 1.02, maxWidth: "19ch", color: "#f6d9cf" }}>
        {ABOUT.statement[1]}
      </p>
    </>
  );
  const label = (text: string, lang?: string) => (
    <span className="block uppercase" lang={lang} style={{ fontSize: 8.5, letterSpacing: "0.2em", color: PAPER_QUIET }}>
      {text}
    </span>
  );
  const studies = (
    <div className="max-w-[27ch]">
      {label(ABOUT.education.label)}
      <p className="mt-1">{ABOUT.education.text}</p>
    </div>
  );
  const tools = (
    <div>
      {label(ABOUT.tools.label, "en")}
      <p className="mt-1">{ABOUT.tools.items.join(", ")}</p>
    </div>
  );
  const palette = (
    <div>
      {label(ABOUT.paletteName)}
      <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1" lang="en" aria-label={`Her palette, ${ABOUT.paletteName}`}>
        {ABOUT.palette.map((c) => (
          <li key={c.code} className="flex items-center gap-2 whitespace-nowrap">
            <span aria-hidden className="block h-3.5 w-3.5" style={{ background: c.hex }} />
            {c.name} {c.code}
          </li>
        ))}
      </ul>
    </div>
  );
  const origin = <p>{ABOUT.origin}</p>;
  // On to the phone: Contact (her colour marks it, the colour the phone wakes in).
  const onward = (
    <button
      type="button"
      lang="en"
      onClick={() => visit.switchTo("contact")}
      className="group relative flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] py-1 outline-none after:absolute after:-inset-x-2 after:-inset-y-3 after:content-[''] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent transition-transform duration-150 ease-out active:scale-[0.97]"
    >
      <span aria-hidden className="block h-2.5 w-2.5" style={{ background: ABOUT.palette[0].hex }} />
      Contact
      <span aria-hidden className="absolute left-[1.35rem] right-[0.3em] bottom-0 h-px bg-current origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]" />
    </button>
  );
  const small = `${mono.className} text-[10.5px] leading-[1.5]`;

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      aria-hidden={!on}
      lang="es"
      className="fixed inset-0 z-[70] overflow-hidden"
      style={{ visibility: on ? "visible" : "hidden", pointerEvents: open ? "auto" : "none", color: PAPER }}
    >
      {/* The print: her portrait, first only where the cap's printed face was. */}
      <motion.figure className="absolute m-0" style={{ left: L.photo.x - b.side, top: L.photo.y - b.side, width: pw, opacity: faceIn, filter: faceBlur }}>
        <motion.div className="relative" style={{ width: pw, height: ph, background: "#f4f0e8", clipPath: clip, boxShadow: printShadow }}>
          <div className="absolute overflow-hidden" style={{ left: b.side, top: b.side, width: L.photo.w, height: L.photo.h }}>
            <Image src={ABOUT.portrait.src} alt={ABOUT.portrait.alt} lang="en" fill sizes={`${Math.ceil(L.photo.w)}px`} className="object-cover" priority />
          </div>
        </motion.div>
        {/* Where she is from, as the print's caption (on a short screen it joins the words). */}
        {!short && (
          <Word t={t} at={words(5)} className={`${small} mt-3`} as="figcaption">
            <span style={{ color: "rgba(241,235,225,0.84)" }}>{ABOUT.origin}</span>
          </Word>
        )}
      </motion.figure>

      {wide && (
        <div className="absolute flex flex-col justify-center" style={{ left: L.text.x, width: L.text.w, top: 72, bottom: 28 }}>
          <Word t={t} at={words(0)}>{masthead}</Word>
          <Word t={t} at={words(1)} className="mt-5">{name}</Word>
          <Word t={t} at={words(2)} className="mt-3">{competencies}</Word>
          <Word t={t} at={words(3)} className="mt-7">{voice}</Word>
          <Word t={t} at={words(4)} className={`${small} mt-8 flex flex-wrap gap-x-8 gap-y-4`}>
            {studies}
            {tools}
            {palette}
          </Word>
          <Word t={t} at={words(5)} className="mt-9">{onward}</Word>
        </div>
      )}

      {short && (
        <div className="absolute grid grid-cols-2 gap-x-7" style={{ left: L.text.x, width: L.text.w, top: L.text.y }}>
          <div>
            <Word t={t} at={words(0)}>{masthead}</Word>
            <Word t={t} at={words(1)} className="mt-3">{name}</Word>
            <Word t={t} at={words(2)} className="mt-2">{competencies}</Word>
            <Word t={t} at={words(3)} className="mt-3.5">{voice}</Word>
          </div>
          <div className={`${small} pt-0.5`}>
            <Word t={t} at={words(4)} className="flex flex-col gap-3">
              {studies}
              {tools}
              {palette}
            </Word>
            <Word t={t} at={words(5)} className="mt-3" style={{ color: "rgba(241,235,225,0.84)" }}>{origin}</Word>
            <Word t={t} at={words(5)} className="mt-4">{onward}</Word>
          </div>
        </div>
      )}

      {upright && (
        <>
          <Word t={t} at={words(0)} className="absolute" style={{ left: L.frame.left, top: L.frame.top + (MASTHEAD - 26) / 2 }}>{masthead}</Word>
          <div className="absolute flex flex-col gap-3" style={{ left: L.photo.x + L.photo.w + b.side + 16, top: L.photo.y - b.side, right: L.frame.right }}>
            <Word t={t} at={words(1)}>{name}</Word>
            <Word t={t} at={words(2)}>{competencies}</Word>
            <Word t={t} at={words(4)} className={`${small} mt-2`}>{palette}</Word>
          </div>
          <div className="absolute" style={{ left: L.text.x, top: L.text.y + 44, width: L.text.w }}>
            <Word t={t} at={words(3)}>{voice}</Word>
            <Word t={t} at={words(4)} className={`${small} mt-5 grid grid-cols-2 gap-x-5`}>
              {studies}
              {tools}
            </Word>
            <Word t={t} at={words(5)} className="mt-5">{onward}</Word>
          </div>
        </>
      )}

      <BackToDesk ref={back} onClick={visit.requestClose} opacity={closeOpacity} />
    </div>
  );
}

/** One piece of the words, arriving in its turn. */
function Word({
  t,
  at,
  className = "",
  style,
  as = "div",
  children,
}: {
  t: MotionValue<number>;
  at: (v: number) => number;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "figcaption";
  children: ReactNode;
}) {
  const o = useTransform(t, at);
  const y = useTransform(o, (v) => (1 - v) * 8);
  const Tag = as === "figcaption" ? motion.figcaption : motion.div;
  return (
    <Tag className={className} style={{ ...style, opacity: o, y }}>
      {children}
    </Tag>
  );
}

// A torn lower edge, as on the strips of her own About page.
const TORN =
  "polygon(0 0, 100% 0, 100% 78%, 96% 100%, 91% 84%, 85% 97%, 78% 86%, 70% 100%, 62% 88%, 55% 98%, 47% 85%, 39% 97%, 31% 86%, 23% 99%, 15% 87%, 8% 98%, 0 86%)";
