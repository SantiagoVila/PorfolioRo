"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Anton, Covered_By_Your_Grace, IBM_Plex_Mono } from "next/font/google";
import type { ExperienceProps } from "../experiences";
import { fillRect, handoffAspect } from "../transitionGeometry";
import { useBox, type Box } from "../useBox";
import { useKeyboardScroll } from "../useKeyboardScroll";
import { FILL_COVER_SIZES } from "../coverWarmup";
import { COVER, FILM, FRAMES, TEXT, type Frame } from "./chacaritaContent";

/**
 * CHACARITA, an urban design field study, as a street editorial: the barrio's
 * ordinary frames taken over by two styled bodies, laid out like a field
 * notebook pinned open on paper.
 *
 * The book opens: the cover, landed full-screen from the desk, turns like a
 * page and reveals the red doorway at full bleed under the project's name in
 * heavy condensed capitals. Then five numbered chapters on the paper, each
 * named by what it shows (the ground, the street, the bus, the café, the
 * doors), their photographs set in a tight grid of different sizes with small
 * grey details cut from the same frames; the project's film between the bus
 * and the café, in the dark; and the blue doorway at full bleed to close.
 * Handwritten notes, as in a field notebook, carry the only words the project
 * has: the ones printed on its cover.
 */

const display = Anton({ subsets: ["latin"], weight: "400", display: "swap", preload: false });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", preload: false });
const hand = Covered_By_Your_Grace({ subsets: ["latin"], weight: "400", display: "swap", preload: false });

// The transition fills the screen using the desk book's proportions; the cover
// starts in exactly that box so it lands on the same pixels.
const HANDOFF_ASPECT = handoffAspect("chacarita");

const PAPER = "#ede7dc";
const INK = "#15130f";
const CREAM = "#f5efe4";
const DARK = "#131210";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const CURTAIN = "cubic-bezier(0.77, 0, 0.18, 1)";

type Ctx = {
  scroller: RefObject<HTMLDivElement | null>;
  box: Box;
  reduced: boolean;
  /** Twelve-column spreads; otherwise a six-column notebook page (phones). */
  wide: boolean;
  /** Page margin and grid gutter. */
  m: number;
  g: number;
};

const CHAPTERS = [
  { id: "ch-ground", n: "01", title: "The ground" },
  { id: "ch-street", n: "02", title: "The street" },
  { id: "ch-bus", n: "03", title: "The bus" },
  { id: "ch-cafe", n: "04", title: "The café" },
  { id: "ch-doors", n: "05", title: "The doors" },
] as const;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const FILM_ASPECT = FILM.width / FILM.height;

export default function ChacaritaExperience({ onClose }: ExperienceProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const box = useBox(scroller);
  const reduced = !!useReducedMotion();
  const wide = box.w >= 760;
  const m = wide ? Math.round(clamp(box.w * 0.032, 24, 56)) : 18;
  const g = wide ? Math.round(clamp(box.w * 0.011, 10, 18)) : 10;
  useKeyboardScroll(scroller, box.h, { space: true });
  const ctx: Ctx = { scroller, box, reduced, wide, m, g };

  return (
    <>
      <div
        ref={scroller}
        tabIndex={0}
        aria-label={`${TEXT.title}: ${TEXT.subtitle}. Scroll to explore.`}
        className={`${mono.className} absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain outline-none`}
        style={{ background: PAPER, color: INK }}
      >
        <Hero ctx={ctx} />
        <Ground ctx={ctx} />
        <Bus ctx={ctx} />
        <FilmBand ctx={ctx} />
        <Cafe ctx={ctx} />
        <Doors ctx={ctx} />
        <End ctx={ctx} onClose={onClose} />
      </div>
      <BookOpens ctx={ctx} />
    </>
  );
}

/* ─────────────────────────────── pieces ─────────────────────────────── */

/** Whether `ref` has come into view (once). With reduced motion, always. */
function useShown(ref: RefObject<HTMLElement | null>, root: RefObject<HTMLElement | null>, reduced: boolean) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (reduced || !el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { root: root.current, rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, root, reduced]);
  return reduced || shown;
}

/**
 * A photograph in a frame of the given ratio (default: its own), cut to
 * `pos` (object-position), optionally a closer detail (`zoom` around `pos`)
 * and in grey. It arrives from under a sheet of the page's paper that slides
 * off, settling from a little closer; on hover it leans in slightly.
 */
function Photo({
  f, ctx, ratio, pos = "50% 50%", zoom = 1, gray = false, sizes = "100vw", eager = false, delay = 0, className = "", style, children,
}: {
  f: Frame; ctx: Ctx; ratio?: number; pos?: string; zoom?: number; gray?: boolean; sizes?: string; eager?: boolean; delay?: number;
  className?: string; style?: CSSProperties; children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useShown(ref, ctx.scroller, ctx.reduced);
  const still = ctx.reduced;
  return (
    <div ref={ref} className={`group relative overflow-hidden ${className}`} style={{ aspectRatio: ratio ?? f.aspect, ...style }}>
      <div
        className="absolute inset-0"
        style={{ transform: shown ? "scale(1)" : "scale(1.14)", transition: still ? undefined : `transform 1.7s ${EASE} ${delay}ms` }}
      >
        <div className="absolute inset-0 transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]">
          <div className="absolute inset-0" style={{ transform: zoom !== 1 ? `scale(${zoom})` : undefined, transformOrigin: pos }}>
            <Image
              src={f.src}
              alt={f.alt}
              fill
              sizes={sizes}
              className="object-cover"
              style={{ objectPosition: pos, filter: gray ? "grayscale(1) contrast(1.12) brightness(1.04)" : undefined }}
              loading={eager ? "eager" : "lazy"}
              draggable={false}
            />
          </div>
        </div>
      </div>
      {!still && (
        <div
          aria-hidden
          className="absolute inset-0 origin-top"
          style={{ background: PAPER, transform: shown ? "scaleY(0)" : "scaleY(1)", transition: `transform 1.15s ${CURTAIN} ${delay}ms` }}
        />
      )}
      {children}
    </div>
  );
}

/** A chapter's number, rising through its own line, and its name in small capitals with a rule. */
function Heading({ n, title, ctx, light = false, style }: { n: string; title: string; ctx: Ctx; light?: boolean; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useShown(ref, ctx.scroller, ctx.reduced);
  const size = ctx.wide ? clamp(ctx.box.w * 0.075, 64, 132) : 64;
  return (
    <div ref={ref} style={style}>
      <p aria-hidden className={`${display.className} overflow-hidden leading-[0.84]`} style={{ fontSize: size }}>
        <span
          className="block"
          style={{ transform: shown ? "translateY(0)" : "translateY(105%)", transition: ctx.reduced ? undefined : `transform 1.2s ${EASE}` }}
        >
          {n}
        </span>
      </p>
      <h2 className={`mt-3 text-[10.5px] sm:text-[11px] font-medium uppercase tracking-[0.2em] ${light ? "text-white/80" : "text-black/75"}`}>
        <span className="sr-only">{n} </span>
        {title}
      </h2>
      <span aria-hidden className={`mt-4 block h-px w-8 ${light ? "bg-white/50" : "bg-black/45"}`} />
    </div>
  );
}

/** A note written over the page, as in a field notebook: only the cover's own words. It writes itself in. */
function Note({ children, ctx, rotate = -7, light = false, size, style }: { children: ReactNode; ctx: Ctx; rotate?: number; light?: boolean; size?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const shown = useShown(ref, ctx.scroller, ctx.reduced);
  const fs = size ?? (ctx.wide ? clamp(ctx.box.w * 0.021, 22, 34) : 23);
  // Observed on the outer element: the inner one is clipped away until shown, and a
  // fully clipped element never counts as in view.
  return (
    <p
      ref={ref}
      className={`${hand.className} uppercase leading-[0.98] tracking-[0.02em] pointer-events-none select-none`}
      style={{ fontSize: fs, color: light ? CREAM : INK, transform: `rotate(${rotate}deg)`, ...style }}
    >
      <span
        className="block"
        style={{
          clipPath: shown ? "inset(-20% -5% -20% -5%)" : "inset(-20% 105% -20% -5%)",
          transition: ctx.reduced ? undefined : "clip-path 1.4s cubic-bezier(0.45, 0, 0.2, 1) 0.45s",
        }}
      >
        {children}
      </span>
    </p>
  );
}

/** A spread: a grid of `cols` columns on the page's margins. */
function Spread({ ctx, cols, children, style, id, label }: { ctx: Ctx; cols: number; children: ReactNode; style?: CSSProperties; id?: string; label: string }) {
  return (
    <section
      id={id}
      aria-label={label}
      className="relative grid items-start"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: ctx.g, rowGap: ctx.g, padding: `0 ${ctx.m}px`, ...style }}
    >
      {children}
    </section>
  );
}

const span = (start: number, n: number): CSSProperties => ({ gridColumn: `${start} / span ${n}` });
/** `sizes` for a photograph spanning n of `cols` columns. */
const cw = (n: number, cols: number) => `${Math.ceil((n / cols) * 100)}vw`;

/* ─────────────────────────────── the book opens ─────────────────────────────── */

/**
 * The cover, exactly where the desk's transition left it (filling the screen),
 * turns like a book's cover around the screen's left edge and uncovers the
 * first spread. It waits for the project to be fully in view, then leaves the
 * page. With reduced motion it simply fades.
 */
function BookOpens({ ctx }: { ctx: Ctx }) {
  const { box, reduced } = ctx;
  const [open, setOpen] = useState(false);
  if (open) return null;
  const F = fillRect(HANDOFF_ASPECT, box.fw, box.h);
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: Math.max(box.w, box.h) * 1.6, perspectiveOrigin: "0% 50%" }}>
      <motion.div
        className="absolute left-0 top-0"
        style={{ width: F.width, height: F.height, x: F.x, y: F.y, transformOrigin: `${-F.x}px 50%`, backfaceVisibility: "hidden", willChange: "transform" }}
        initial={{ rotateY: 0, opacity: 1 }}
        animate={reduced ? { opacity: 0 } : { rotateY: -112 }}
        // It turns as soon as the project has faded in over the desk (the shell's fade, 0.45 s).
        transition={reduced ? { duration: 0.4, delay: 0.5 } : { duration: 1.35, delay: 0.48, ease: [0.62, 0, 0.26, 1] }}
        onAnimationComplete={() => setOpen(true)}
      >
        <Image src={COVER.src} alt="" fill sizes={FILL_COVER_SIZES} className="object-cover" loading="eager" draggable={false} />
        {/* The cover darkens as it turns away from the light. */}
        {!reduced && (
          <motion.div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to left, rgba(20,16,12,0.55), rgba(20,16,12,0.15))" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.63, ease: "easeIn" }}
          />
        )}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────── the red door ─────────────────────────────── */

/**
 * The first spread: the red doorway at full bleed, the project's name across
 * it in heavy condensed capitals, the cover's subtitle, and the chapters as an
 * index (each takes you there). It drifts slower than the page as it leaves.
 */
function Hero({ ctx }: { ctx: Ctx }) {
  const { box, wide, m, reduced, scroller } = ctx;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start start", "end start"] });
  // Function transforms, not framer's native scroll-timeline path: that one mistracks nested scrollers.
  const photoY = useTransform(scrollYProgress, (v) => (reduced ? 0 : v * box.h * 0.32));
  const titleY = useTransform(scrollYProgress, (v) => (reduced ? 0 : v * -box.h * 0.12));
  const size = wide ? Math.min(box.w * 0.128, box.h * 0.27) : Math.min(box.w * 0.205, box.h * 0.13);
  const go = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  const letters = TEXT.title.toUpperCase().split("");

  return (
    <section ref={ref} aria-label={`${TEXT.title}, the red doorway`} className="relative overflow-hidden" style={{ height: box.h, background: DARK }}>
      <motion.div className="absolute inset-0" style={{ y: photoY }}>
        <Image
          src={FRAMES.redDoor.src}
          alt={FRAMES.redDoor.alt}
          fill
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: wide ? "50% 27%" : "50% 30%" }}
          loading="eager"
          draggable={false}
        />
        {/* Enough shade low down for the name to read over any part of the door. */}
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(12,10,8,0.5), rgba(12,10,8,0) 48%)" }} />
      </motion.div>

      {/* The running title (on phones the name below is already the whole width). */}
      {wide && (
        <p className={`${display.className} absolute uppercase text-[20px] leading-none tracking-[0.01em] text-white mix-blend-difference`} style={{ left: m, top: 30 }} aria-hidden>
          {TEXT.title}
        </p>
      )}

      <motion.div className="absolute" style={{ left: m - size * 0.02, bottom: wide ? box.h * 0.1 : box.h * 0.12, y: titleY, color: CREAM }}>
        <h1 className={`${display.className} uppercase leading-[0.8] tracking-[-0.005em] flex`} style={{ fontSize: size }} aria-label={TEXT.title}>
          {letters.map((c, i) => (
            <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.02em]">
              <motion.span
                className="inline-block"
                initial={reduced ? false : { y: "108%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.1, delay: 1.2 + i * 0.045, ease: [0.16, 1, 0.3, 1] }}
              >
                {c}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          className="mt-4 text-[11px] sm:text-[12.5px] font-medium uppercase tracking-[0.2em]"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.75, ease: [0.16, 1, 0.3, 1] }}
        >
          {TEXT.subtitle}
        </motion.p>
      </motion.div>

      {/* The chapters, as the field notebook's index. */}
      <motion.nav
        aria-label="Chapters"
        className="absolute text-white mix-blend-difference"
        style={wide ? { right: m, top: box.h * 0.2 } : { left: m, top: box.h * 0.2 }}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.95 }}
      >
        <ol className="flex flex-col gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em]">
          {CHAPTERS.map((c) => (
            <li key={c.id}>
              <button
                onClick={go(c.id)}
                className="group inline-flex items-baseline gap-3 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                <span className="opacity-60">{c.n}</span>
                <span className="relative">
                  {c.title}
                  <span aria-hidden className="absolute left-0 right-0 -bottom-0.5 h-px bg-current origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </motion.nav>

      <div aria-hidden className="absolute flex flex-col items-center gap-3 text-[10px] font-medium uppercase tracking-[0.24em] text-white mix-blend-difference" style={{ right: m, bottom: wide ? box.h * 0.1 : 24 }}>
        <span>Scroll</span>
        <span className="relative block w-px h-10 overflow-hidden bg-white/40">
          {!reduced && <span className="absolute inset-x-0 top-0 h-4 bg-current animate-[chacaritaCue_2.2s_cubic-bezier(0.45,0,0.55,1)_infinite]" />}
        </span>
      </div>
      <style>{`@keyframes chacaritaCue { 0% { transform: translateY(-16px) } 70%, 100% { transform: translateY(40px) } }`}</style>
    </section>
  );
}

/* ─────────────────────────────── 01 the ground, 02 the street ─────────────────────────────── */

/**
 * The notebook's first spread: the shoes stepping over footprints stencilled
 * on the pavement (the public space the project reads as found art), and the
 * cup jacket walking the street (its wearable utility), with a grey detail of
 * the street's trees cut from the same frame.
 */
function Ground({ ctx }: { ctx: Ctx }) {
  const { wide, box, m } = ctx;
  const { ground, cupsJacket: cups } = FRAMES;
  if (!wide) {
    return (
      <>
        <Spread ctx={ctx} cols={6} id={CHAPTERS[0].id} label={`${CHAPTERS[0].n} ${CHAPTERS[0].title}`} style={{ paddingTop: 64 }}>
          <Heading n={CHAPTERS[0].n} title={CHAPTERS[0].title} ctx={ctx} style={span(1, 3)} />
          <Photo f={ground} ctx={ctx} ratio={4 / 5} pos="50% 74%" style={{ ...span(1, 6), marginTop: 18 }}>
            <Note ctx={ctx} rotate={-8} style={{ position: "absolute", right: 16, top: "52%", maxWidth: "52%" }}>
              {TEXT.ground}
            </Note>
          </Photo>
        </Spread>
        <Spread ctx={ctx} cols={6} id={CHAPTERS[1].id} label={`${CHAPTERS[1].n} ${CHAPTERS[1].title}`} style={{ paddingTop: 56 }}>
          <Heading n={CHAPTERS[1].n} title={CHAPTERS[1].title} ctx={ctx} style={span(1, 3)} />
          <Note ctx={ctx} rotate={-5} style={{ ...span(4, 3), alignSelf: "end", marginBottom: 6 }}>
            {TEXT.wearable}
          </Note>
          <Photo f={cups} ctx={ctx} ratio={3 / 4} pos="50% 30%" style={{ ...span(1, 6), marginTop: 18 }} />
          <Photo f={cups} ctx={ctx} ratio={1} pos="12% 6%" zoom={2.3} gray sizes="40vw" delay={200} style={{ ...span(1, 3), marginTop: -box.w * 0.18, marginLeft: -m / 2 }} />
        </Spread>
      </>
    );
  }
  return (
    <Spread ctx={ctx} cols={12} id={CHAPTERS[0].id} label={`${CHAPTERS[0].n} ${CHAPTERS[0].title}, ${CHAPTERS[1].n} ${CHAPTERS[1].title}`} style={{ paddingTop: box.h * 0.12 }}>
      <Photo f={ground} ctx={ctx} ratio={4 / 5} pos="50% 74%" sizes={cw(5, 12)} style={span(1, 5)}>
        <Note ctx={ctx} rotate={-8} style={{ position: "absolute", right: "7%", top: "50%", maxWidth: "46%" }}>
          {TEXT.ground}
        </Note>
        <Heading n={CHAPTERS[0].n} title={CHAPTERS[0].title} ctx={ctx} style={{ position: "absolute", left: "6%", bottom: "5%" }} />
      </Photo>
      <div style={{ ...span(6, 2), alignSelf: "end", paddingBottom: 8 }}>
        <Note ctx={ctx} rotate={-6}>{TEXT.wearable}</Note>
        <span aria-hidden className="mt-8 block text-[18px]">→</span>
      </div>
      <Photo f={cups} ctx={ctx} ratio={3 / 4} pos="50% 34%" sizes={cw(4, 12)} delay={120} style={{ ...span(8, 4), marginTop: box.h * 0.1 }}>
        <div id={CHAPTERS[1].id} className="absolute" style={{ left: "6%", top: "5%", scrollMarginTop: box.h * 0.12 }}>
          <Heading n={CHAPTERS[1].n} title={CHAPTERS[1].title} ctx={ctx} />
        </div>
      </Photo>
      <Photo f={cups} ctx={ctx} ratio={1 / 2.6} pos="10% 4%" zoom={2.6} gray sizes={cw(1, 12)} delay={260} style={{ ...span(12, 1), marginTop: box.h * 0.1 }} />
    </Spread>
  );
}

/* ─────────────────────────────── 03 the bus ─────────────────────────────── */

/** Night on the colectivo: each figure alone, then the couple on the back seats, overlapping like prints on a table. */
function Bus({ ctx }: { ctx: Ctx }) {
  const { wide, box } = ctx;
  const { busStanding: standing, busDriver: driver, busCouple: couple } = FRAMES;
  const c = CHAPTERS[2];
  if (!wide) {
    return (
      <Spread ctx={ctx} cols={6} id={c.id} label={`${c.n} ${c.title}`} style={{ paddingTop: 72 }}>
        <Heading n={c.n} title={c.title} ctx={ctx} style={span(1, 3)} />
        <Note ctx={ctx} rotate={-6} style={{ ...span(4, 3), alignSelf: "end", marginBottom: 6 }}>
          {TEXT.bus}
        </Note>
        <Photo f={standing} ctx={ctx} ratio={2 / 3} pos="50% 42%" sizes="50vw" style={{ ...span(1, 3), marginTop: 18 }} />
        <Photo f={driver} ctx={ctx} ratio={2 / 3} pos="42% 55%" sizes="50vw" delay={120} style={{ ...span(4, 3), marginTop: 18 + box.w * 0.12 }} />
        <Photo f={couple} ctx={ctx} ratio={4 / 5} pos="52% 62%" style={{ ...span(1, 6), marginTop: -box.w * 0.06 }} />
      </Spread>
    );
  }
  return (
    <Spread ctx={ctx} cols={12} id={c.id} label={`${c.n} ${c.title}`} style={{ paddingTop: box.h * 0.1 }}>
      <div style={span(1, 2)}>
        <Heading n={c.n} title={c.title} ctx={ctx} />
        <Note ctx={ctx} rotate={-7} style={{ marginTop: 34 }}>
          {TEXT.bus}
        </Note>
      </div>
      <Photo f={standing} ctx={ctx} ratio={2 / 3} pos="50% 42%" sizes={cw(3, 12)} style={span(3, 3)} />
      <Photo f={driver} ctx={ctx} ratio={2 / 3} pos="42% 55%" sizes={cw(3, 12)} delay={120} style={{ ...span(6, 3), marginTop: box.h * 0.12 }} />
      <Photo f={couple} ctx={ctx} ratio={3 / 4} pos="52% 62%" sizes={cw(4, 12)} delay={240} style={{ ...span(9, 4), marginTop: box.h * 0.04, marginLeft: -ctx.g * 3, boxShadow: "0 24px 50px -28px rgba(20,16,12,0.55)" }} />
    </Spread>
  );
}

/* ─────────────────────────────── the film ─────────────────────────────── */

/** The project's film between the bus and the café, in the dark, never shown larger than its own picture. */
function FilmBand({ ctx }: { ctx: Ctx }) {
  const { wide, box, m } = ctx;
  const fw = Math.min(FILM.width, wide ? box.w * 0.56 : box.w - m * 2);
  return (
    <section aria-label="The film" className="relative" style={{ background: DARK, color: CREAM, marginTop: wide ? box.h * 0.16 : 88, padding: wide ? `${box.h * 0.14}px ${m}px` : `64px ${m}px 56px` }}>
      <div className={wide ? "flex items-center justify-between gap-10" : "flex flex-col gap-8"}>
        <div>
          <p aria-hidden className={`${display.className} uppercase leading-[0.84]`} style={{ fontSize: wide ? clamp(box.w * 0.06, 52, 104) : 56 }}>
            Film
          </p>
          <h2 className="mt-3 text-[10.5px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">{TEXT.title}, the film</h2>
          <span aria-hidden className="mt-4 block h-px w-8 bg-white/40" />
        </div>
        <Film ctx={ctx} width={fw} />
      </div>
    </section>
  );
}

/**
 * The film: muted, inline, no player chrome. Its files (and its poster) are
 * attached only when it comes within a screen of view; it plays while at least
 * half of it is on screen and pauses otherwise (and while the tab is hidden).
 * With reduced motion it rests on its poster until asked. One small control
 * plays or pauses it.
 */
function Film({ ctx, width }: { ctx: Ctx; width: number }) {
  const { scroller, reduced } = ctx;
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [seen, setSeen] = useState(false);
  const [choice, setChoice] = useState<"auto" | "play" | "pause">("auto");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    const root = scroller.current;
    if (!v || !root) return;
    const approach = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setNear(true);
        approach.disconnect();
      }
    }, { root, rootMargin: "100% 0px" });
    const view = new IntersectionObserver(([e]) => setSeen(e.intersectionRatio >= 0.5), { root, threshold: [0, 0.5, 1] });
    approach.observe(v);
    view.observe(v);
    return () => {
      approach.disconnect();
      view.disconnect();
    };
  }, [scroller]);

  const want = near && seen && (choice === "play" || (choice === "auto" && !reduced));
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const apply = () => {
      if (want && !document.hidden) v.play().catch(() => {});
      else v.pause();
    };
    apply();
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, [want]);

  return (
    <figure className="shrink-0" style={{ width }}>
      <video
        ref={ref}
        muted
        playsInline
        loop
        preload={near ? "auto" : "none"}
        poster={near ? FILM.poster : undefined}
        aria-label={FILM.alt}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="block bg-black"
        style={{ width, height: width / FILM_ASPECT }}
      >
        {near && (
          <>
            <source src={FILM.mp4} type="video/mp4" />
            <source src={FILM.webm} type="video/webm" />
          </>
        )}
      </video>
      <div style={{ paddingTop: 6 }}>
        <button
          onClick={() => setChoice(playing ? "pause" : "play")}
          aria-label={playing ? "Pause the film" : "Play the film"}
          className="inline-flex items-center gap-2.5 py-2 pr-3 font-medium uppercase tracking-[0.18em] text-[10.5px] text-white/65 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-4 focus-visible:ring-offset-[#131210]"
        >
          <span aria-hidden className="relative block w-2 h-2.5">
            {playing ? (
              <>
                <span className="absolute left-0 top-0 h-full w-[2.5px] bg-current" />
                <span className="absolute right-0 top-0 h-full w-[2.5px] bg-current" />
              </>
            ) : (
              <span className="absolute inset-0 bg-current" style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
            )}
          </span>
          {playing ? "Pause" : "Play"}
        </button>
      </div>
    </figure>
  );
}

/* ─────────────────────────────── 04 the café ─────────────────────────────── */

/** By day, the two of them at a café: standing, then seated at the small round table; a grey detail of the palm above them. */
function Cafe({ ctx }: { ctx: Ctx }) {
  const { wide, box, m } = ctx;
  const { cafeStanding: standing, cafeSeated: seated } = FRAMES;
  const c = CHAPTERS[3];
  if (!wide) {
    return (
      <Spread ctx={ctx} cols={6} id={c.id} label={`${c.n} ${c.title}`} style={{ paddingTop: 72 }}>
        <Heading n={c.n} title={c.title} ctx={ctx} style={span(1, 3)} />
        <Photo f={seated} ctx={ctx} ratio={1} pos="40% 8%" zoom={2.2} gray sizes="40vw" style={{ ...span(5, 2), alignSelf: "end" }} />
        <Photo f={standing} ctx={ctx} ratio={4 / 5} pos="50% 30%" sizes="84vw" style={{ ...span(1, 5), marginTop: 18, marginLeft: -m / 2 }} />
        <Photo f={seated} ctx={ctx} ratio={4 / 5} pos="50% 48%" sizes="80vw" delay={120} style={{ ...span(2, 5), marginTop: -box.w * 0.1, marginRight: -m / 2, boxShadow: "0 22px 44px -26px rgba(20,16,12,0.55)" }} />
      </Spread>
    );
  }
  return (
    <Spread ctx={ctx} cols={12} id={c.id} label={`${c.n} ${c.title}`} style={{ paddingTop: box.h * 0.1 }}>
      <Heading n={c.n} title={c.title} ctx={ctx} style={span(1, 2)} />
      <Photo f={standing} ctx={ctx} ratio={4 / 5} pos="50% 30%" sizes={cw(4, 12)} style={span(3, 4)} />
      <Photo f={seated} ctx={ctx} ratio={4 / 5} pos="50% 48%" sizes={cw(4, 12)} delay={120} style={{ ...span(7, 4), marginTop: box.h * 0.14 }} />
      <Photo f={seated} ctx={ctx} ratio={3 / 4} pos="40% 8%" zoom={2.4} gray sizes={cw(2, 12)} delay={240} style={{ ...span(11, 2), marginTop: box.h * 0.02 }} />
    </Spread>
  );
}

/* ─────────────────────────────── 05 the doors ─────────────────────────────── */

/** The blue doorway at full bleed, arms spread across it: the story opened on one door and closes on the other. */
function Doors({ ctx }: { ctx: Ctx }) {
  const { wide, box, m } = ctx;
  const c = CHAPTERS[4];
  return (
    <section id={c.id} aria-label={`${c.n} ${c.title}`} className="relative" style={{ marginTop: wide ? box.h * 0.18 : 88 }}>
      <Photo f={FRAMES.blueDoor} ctx={ctx} ratio={wide ? Math.max(box.w / box.h, 1.6) : 3 / 4} pos={wide ? "50% 24%" : "50% 22%"}>
        <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to top right, rgba(12,10,8,0.5), rgba(12,10,8,0) 45%)" }} />
        <Heading n={c.n} title={c.title} ctx={ctx} light style={{ position: "absolute", left: m, bottom: wide ? box.h * 0.08 : 24, color: CREAM }} />
      </Photo>
    </section>
  );
}

/* ─────────────────────────────── the end ─────────────────────────────── */

function End({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const { wide, box } = ctx;
  return (
    <section aria-label="End" className="flex flex-col items-center text-center" style={{ padding: wide ? `${box.h * 0.16}px 0` : "88px 0 96px" }}>
      <p className={`${display.className} uppercase leading-[0.82]`} style={{ fontSize: wide ? clamp(box.w * 0.07, 56, 120) : 64 }}>
        {TEXT.title}
      </p>
      <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-black/65">{TEXT.subtitle}</p>
      <button
        onClick={onClose}
        className="mt-12 inline-flex items-center gap-4 border-b border-black/50 pb-1.5 uppercase tracking-[0.2em] text-[11px] font-medium outline-none hover:border-black focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#ede7dc]"
      >
        <span aria-hidden className="block h-px w-8 bg-current" />
        Back to the desk
      </button>
    </section>
  );
}
