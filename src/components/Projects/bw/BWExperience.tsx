"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Bodoni_Moda, Inter_Tight } from "next/font/google";
import type { ExperienceProps } from "../experiences";
import { fillRect, handoffAspect } from "../transitionGeometry";
import { useBox, type Box } from "../useBox";
import { useKeyboardScroll } from "../useKeyboardScroll";
import { FILL_COVER_SIZES } from "../coverWarmup";
import { COVER_SRC, DETAILS, STILLS, WORDS, type Still } from "./bwContent";

/**
 * B&W / THE PUNK-CHIC EDIT as a fashion editorial in the studio's own light:
 * one body between black leather and white ruffles, held and then let go.
 *
 * The cover is cut: it slices into bands that slide apart and uncover the
 * first page, where the edit's name stands in monumental high-contrast serif
 * capitals beside the frame of hair thrown up, on the grey of that frame's own
 * backdrop. The page then opens into the light paper of the studio's seamless
 * and four numbered chapters (silhouette, leather, movement, portrait), each
 * a tight grid of the stills and the details cut from them, captioned only by
 * their camera frame numbers, as on a contact sheet. The only other words are
 * the cover's: the edit's name and its tagline.
 */

const serif = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], display: "swap", preload: false });
const sans = Inter_Tight({ subsets: ["latin"], weight: ["400", "500"], display: "swap", preload: false });

// The transition fills the screen using the desk book's proportions; the cover
// starts in exactly that box so it lands on the same pixels.
const HANDOFF_ASPECT = handoffAspect("bw");

const grey = (g: number) => `rgb(${g}, ${g}, ${g})`;
/** The first page takes the grey of the flight frame's own backdrop; the paper then lightens to the studio's seamless. */
const HERO_GREY = 186;
const PAPER_GREY = 234;
const INK = "#0c0c0c";
const SHUTTER = "cubic-bezier(0.76, 0, 0.24, 1)";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
/**
 * The shutter fires as a frame reaches the screen's edge: a chapter's lead
 * frame opens with a little more ceremony, the others fire quickly after it
 * (seconds), so a reader never scrolls into a closed frame.
 */
const OPEN = { lead: 0.95, support: 0.75 };
const FRAME_MARGIN = "0px 0px 5% 0px";

type Ctx = { scroller: RefObject<HTMLDivElement | null>; box: Box; reduced: boolean; wide: boolean; m: number; g: number };

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const frameNo = (s: Still) => s.id.replace(/^IMG_/, "").replace(/ detail$/, " · detail");

export default function BWExperience({ onClose }: ExperienceProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const box = useBox(scroller);
  const reduced = !!useReducedMotion();
  const wide = box.w >= 760;
  const m = wide ? Math.round(clamp(box.w * 0.03, 24, 56)) : 18;
  const g = wide ? Math.round(clamp(box.w * 0.009, 8, 14)) : 8;
  useKeyboardScroll(scroller, box.h, { space: true });
  const ctx: Ctx = { scroller, box, reduced, wide, m, g };

  return (
    <>
      <div
        ref={scroller}
        tabIndex={0}
        aria-label={`${WORDS.title}: ${WORDS.edit}. Scroll to explore.`}
        className={`${sans.className} absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain outline-none`}
        style={{ background: grey(PAPER_GREY), color: INK }}
      >
        <Hero ctx={ctx} />
        <Silhouette ctx={ctx} />
        <Leather ctx={ctx} />
        <Movement ctx={ctx} />
        <Portrait ctx={ctx} />
        <End ctx={ctx} onClose={onClose} />
      </div>
      <Cut ctx={ctx} />
    </>
  );
}

/* ─────────────────────────────── pieces ─────────────────────────────── */

/** Whether `ref` has come into view (once), `margin` being the observer's root margin. With reduced motion, always. */
function useShown(ref: RefObject<HTMLElement | null>, root: RefObject<HTMLElement | null>, reduced: boolean, margin = "0px 0px -8% 0px") {
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
      { root: root.current, rootMargin: margin, threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, root, reduced, margin]);
  return reduced || shown;
}

/**
 * A still in a frame of the given ratio (default: its own), cut to `pos`. It
 * opens like a shutter, from its middle outwards (the observed element is the
 * unclipped frame: a clipped one never counts as in view); a `lead` frame a
 * little more slowly. A small frame number under it, as on a contact sheet.
 */
function Frame({
  s, ctx, ratio, pos = "50% 50%", sizes = "100vw", delay = 0, lead = false, caption = true, style, className = "", eager = false,
}: {
  s: Still; ctx: Ctx; ratio?: number; pos?: string; sizes?: string; delay?: number; lead?: boolean; caption?: boolean; style?: CSSProperties; className?: string; eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useShown(ref, ctx.scroller, ctx.reduced, FRAME_MARGIN);
  return (
    <figure ref={ref} className={`group ${className}`} style={style}>
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: ratio ?? s.width / s.height,
          background: grey(s.backdrop),
          clipPath: shown ? "inset(0% 0% 0% 0%)" : "inset(50% 0% 50% 0%)",
          transition: ctx.reduced ? undefined : `clip-path ${lead ? OPEN.lead : OPEN.support}s ${SHUTTER} ${delay}ms`,
        }}
      >
        <div className="absolute inset-0 transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]">
          <Image src={s.src} alt={s.alt} fill sizes={sizes} className="object-cover" style={{ objectPosition: pos }} loading={eager ? "eager" : "lazy"} draggable={false} />
        </div>
      </div>
      {caption && (
        <figcaption aria-hidden className="mt-2 text-[9px] tracking-[0.22em] uppercase tabular-nums text-black/45">
          {frameNo(s)}
        </figcaption>
      )}
    </figure>
  );
}

/** A chapter: its number, its name in the edit's serif capitals, a rule; it settles in. */
function Chapter({ n, title, ctx, children, style }: { n: string; title: string; ctx: Ctx; children?: ReactNode; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useShown(ref, ctx.scroller, ctx.reduced);
  // On the narrowest spreads (a tablet held upright) the floor comes down with
  // the page, so every name stays inside its columns and on the screen.
  const size = ctx.wide ? clamp(ctx.box.w * 0.032, Math.min(30, ctx.box.w * 0.0355), 50) : 32;
  const t = (d: number): CSSProperties =>
    ctx.reduced ? {} : { opacity: shown ? 1 : 0, transform: shown ? "none" : "translateY(14px)", transition: `opacity 1s ${EASE} ${d}ms, transform 1.2s ${EASE} ${d}ms` };
  return (
    <div ref={ref} style={style}>
      <p aria-hidden className={`${serif.className} text-[13px] tracking-[0.04em]`} style={t(0)}>
        {n} /
      </p>
      <h2 className={`${serif.className} mt-2 uppercase leading-[0.95] tracking-[0.01em]`} style={{ fontSize: size, ...t(90) }}>
        <span className="sr-only">{n} </span>
        {title}
      </h2>
      <span aria-hidden className="mt-5 block h-px w-10 bg-black/50" style={t(180)} />
      {children && (
        <div className="mt-5" style={t(260)}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Small spaced capitals, the edit's labels. */
function Label({ children, style, light = false }: { children: ReactNode; style?: CSSProperties; light?: boolean }) {
  return (
    <p className={`text-[10px] sm:text-[10.5px] font-medium uppercase leading-[1.7] tracking-[0.28em] ${light ? "text-white/80" : "text-black/70"}`} style={style}>
      {children}
    </p>
  );
}

function Grid({ ctx, cols, children, style, label }: { ctx: Ctx; cols: number; children: ReactNode; style?: CSSProperties; label: string }) {
  return (
    <section
      aria-label={label}
      className="relative grid items-start"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: ctx.g, rowGap: ctx.g * 2, padding: `0 ${ctx.m}px`, ...style }}
    >
      {children}
    </section>
  );
}

const span = (start: number, n: number): CSSProperties => ({ gridColumn: `${start} / span ${n}` });
const cw = (n: number, cols: number) => `${Math.ceil((n / cols) * 100)}vw`;

/* ─────────────────────────────── the cut ─────────────────────────────── */

/**
 * The cover, exactly where the desk's transition left it (filling the
 * screen), is cut into bands that slide apart, alternately left and right,
 * uncovering the first page. It waits for the project to be fully in view
 * (the shell's fade), then leaves the page. With reduced motion it fades.
 */
function Cut({ ctx }: { ctx: Ctx }) {
  const { box, reduced } = ctx;
  const [gone, setGone] = useState(false);
  if (gone) return null;
  const F = fillRect(HANDOFF_ASPECT, box.fw, box.h);
  const n = 7;
  const band = box.h / n;
  const sizes = FILL_COVER_SIZES;
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: n }, (_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 overflow-hidden"
          style={{ top: i * band, height: band + 1, width: box.fw, willChange: "transform" }}
          initial={{ x: 0, opacity: 1 }}
          animate={reduced ? { opacity: 0 } : { x: (i % 2 ? 1 : -1) * box.fw * 1.02 }}
          transition={reduced ? { duration: 0.4, delay: 0.5 } : { duration: 0.95, delay: 0.48 + (i % 2 ? 0.05 : 0) + Math.abs(i - (n - 1) / 2) * 0.04, ease: [0.7, 0, 0.18, 1] }}
          onAnimationComplete={i === 0 ? () => setGone(true) : undefined}
        >
          <div className="absolute" style={{ left: F.x, top: F.y - i * band, width: F.width, height: F.height }}>
            <Image src={COVER_SRC} alt="" fill sizes={sizes} className="object-cover" loading="eager" draggable={false} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─────────────────────────────── 01, the edit ─────────────────────────────── */

/**
 * The first page: "01 /", the edit's name in monumental serif capitals, its
 * subtitle, and the cover's tagline set as a column; the hair thrown up at the
 * right, reaching the top edge, blending into the page's grey. It drifts
 * slower than the page as it leaves.
 */
function Hero({ ctx }: { ctx: Ctx }) {
  const { box, wide, m, reduced, scroller } = ctx;
  const ref = useRef<HTMLElement>(null);
  const flight = STILLS.flight;
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start start", "end start"] });
  // Function transforms, not framer's native scroll-timeline path: that one mistracks nested scrollers.
  const photoY = useTransform(scrollYProgress, (v) => (reduced ? 0 : v * box.h * 0.18));
  const titleY = useTransform(scrollYProgress, (v) => (reduced ? 0 : v * -box.h * 0.1));
  const size = wide ? Math.min(box.w * 0.2, box.h * 0.42) : Math.min(box.w * 0.34, box.h * 0.2);
  const photoW = wide ? Math.min(box.w * 0.56, box.h * 1.02 * (flight.width / flight.height) * 1.25) : box.w;
  const fade = (d: number) => (reduced ? {} : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.1, delay: d, ease: [0.16, 1, 0.3, 1] as const } });

  return (
    <section ref={ref} aria-label={`${WORDS.title}, ${WORDS.edit}`} className="relative overflow-hidden" style={{ height: box.h, background: grey(HERO_GREY) }}>
      <motion.div
        className="absolute top-0 bottom-0 right-0"
        style={{
          width: photoW,
          y: photoY,
          // Into the page's grey at the left edge and at the bottom, so the frame has no edges of its own.
          maskImage: wide ? "linear-gradient(to right, transparent, black 26%), linear-gradient(to bottom, black 80%, transparent)" : "linear-gradient(to bottom, black 55%, transparent 92%)",
          WebkitMaskImage: wide ? "linear-gradient(to right, transparent, black 26%), linear-gradient(to bottom, black 80%, transparent)" : "linear-gradient(to bottom, black 55%, transparent 92%)",
          maskComposite: wide ? "intersect" : undefined,
          WebkitMaskComposite: wide ? "source-in" : undefined,
        }}
      >
        <motion.div className="absolute inset-0" initial={reduced ? false : { scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 2.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <Image src={flight.src} alt={flight.alt} fill sizes={wide ? "60vw" : "100vw"} className="object-cover" style={{ objectPosition: wide ? "50% 18%" : "50% 12%" }} loading="eager" draggable={false} />
        </motion.div>
      </motion.div>

      <motion.div className="absolute" style={{ left: m, top: wide ? box.h * 0.14 : box.h * 0.5, y: titleY }}>
        <motion.p aria-hidden className={`${serif.className} text-[14px] tracking-[0.04em]`} {...fade(1.15)}>
          01 /
        </motion.p>
        <motion.h1
          className={`${serif.className} leading-[0.8] tracking-[-0.03em]`}
          style={{ fontSize: size, marginLeft: -size * 0.04 }}
          initial={reduced ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
        >
          {WORDS.title}
        </motion.h1>
        <motion.p className={`${serif.className} mt-6 uppercase text-[15px] sm:text-[17px] tracking-[0.14em]`} {...fade(1.45)}>
          {WORDS.edit}
        </motion.p>
      </motion.div>

      <motion.div className="absolute" style={wide ? { right: m, top: box.h * 0.46 } : { right: m, top: box.h * 0.14 }} {...fade(1.7)}>
        <Label style={{ textAlign: "right" }}>
          {WORDS.radical[0]}
          <br />
          {WORDS.radical[1]}
        </Label>
        <span aria-hidden className="mt-5 ml-auto block h-px w-10 bg-black/50" />
      </motion.div>

      <motion.div aria-hidden className="absolute flex flex-col items-start gap-3" style={{ left: m, bottom: wide ? box.h * 0.08 : 22 }} {...fade(1.9)}>
        <Label>Scroll</Label>
        <span className="relative block w-px h-10 overflow-hidden bg-black/20">
          {!reduced && <span className="absolute inset-x-0 top-0 h-4 bg-black/70 animate-[bwCue_2.4s_cubic-bezier(0.45,0,0.55,1)_infinite]" />}
        </span>
      </motion.div>
      <style>{`@keyframes bwCue { 0% { transform: translateY(-16px) } 70%, 100% { transform: translateY(40px) } }`}</style>
    </section>
  );
}

/* ─────────────────────────────── 02 silhouette ─────────────────────────────── */

/** The whole look: the black leather volume over the white tiers, full length; from behind, the braid; close, the face. */
function Silhouette({ ctx }: { ctx: Ctx }) {
  const { wide, box } = ctx;
  const { walk, back, close } = STILLS;
  const top: CSSProperties = { background: `linear-gradient(to bottom, ${grey(HERO_GREY)}, ${grey(PAPER_GREY)} ${wide ? box.h * 0.35 : 200}px)` };
  if (!wide) {
    return (
      <Grid ctx={ctx} cols={6} label="02 Silhouette" style={{ ...top, paddingTop: 56 }}>
        <Chapter n="02" title="Silhouette" ctx={ctx} style={span(1, 6)} />
        <Frame s={walk} ctx={ctx} ratio={2 / 3} pos="50% 40%" sizes="66vw" lead style={span(1, 4)} />
        <Frame s={back} ctx={ctx} ratio={3 / 4} pos="50% 22%" sizes="40vw" delay={90} style={{ ...span(5, 2), alignSelf: "end" }} />
        <Frame s={close} ctx={ctx} ratio={4 / 5} pos="50% 22%" sizes="84vw" style={span(2, 5)} />
      </Grid>
    );
  }
  return (
    <Grid ctx={ctx} cols={12} label="02 Silhouette" style={{ ...top, paddingTop: box.h * 0.14 }}>
      <Chapter n="02" title="Silhouette" ctx={ctx} style={{ ...span(1, 3), paddingTop: box.h * 0.06 }} />
      <Frame s={walk} ctx={ctx} ratio={2 / 3} pos="50% 42%" sizes={cw(4, 12)} lead style={span(4, 4)} />
      <div className="grid" style={{ ...span(8, 3), rowGap: ctx.g * 2 }}>
        <Frame s={back} ctx={ctx} ratio={1} pos="50% 20%" sizes={cw(3, 12)} delay={90} />
        <Frame s={close} ctx={ctx} ratio={1} pos="50% 24%" sizes={cw(3, 12)} delay={180} />
      </div>
      <Chapter n="03" title="Leather" ctx={ctx} style={{ ...span(11, 2), paddingTop: box.h * 0.06 }}>
        <Frame s={DETAILS.rings} ctx={ctx} ratio={3 / 4} pos="50% 45%" sizes={cw(2, 12)} delay={270} style={{ marginTop: box.h * 0.1 }} />
      </Chapter>
    </Grid>
  );
}

/* ─────────────────────────────── 03 leather ─────────────────────────────── */

/** The jacket held shut from the front, the fists on its collar, then opening on the chains: one band, three frames of one height. */
function Leather({ ctx }: { ctx: Ctx }) {
  const { wide, box } = ctx;
  const { front } = STILLS;
  const { fists, chains } = DETAILS;
  if (!wide) {
    return (
      <Grid ctx={ctx} cols={6} label="03 Leather" style={{ paddingTop: 64 }}>
        <Chapter n="03" title="Leather" ctx={ctx} style={span(1, 6)} />
        <Frame s={front} ctx={ctx} ratio={4 / 5} pos="50% 30%" lead style={span(1, 6)} />
        <Frame s={fists} ctx={ctx} ratio={1} pos="50% 40%" sizes="50vw" style={span(1, 3)} />
        <Frame s={DETAILS.rings} ctx={ctx} ratio={1} pos="50% 45%" sizes="50vw" delay={90} style={span(4, 3)} />
        <Frame s={chains} ctx={ctx} ratio={4 / 3} pos="50% 45%" style={span(1, 6)} />
      </Grid>
    );
  }
  return (
    <Grid ctx={ctx} cols={12} label="03 Leather, continued" style={{ paddingTop: box.h * 0.1 }}>
      <Frame s={front} ctx={ctx} ratio={4 / 5} pos="50% 26%" sizes={cw(4, 12)} lead style={span(1, 4)} />
      <Frame s={fists} ctx={ctx} ratio={4 / 5} pos="50% 40%" sizes={cw(4, 12)} delay={90} style={span(5, 4)} />
      <Frame s={chains} ctx={ctx} ratio={4 / 5} pos="50% 45%" sizes={cw(4, 12)} delay={180} style={span(9, 4)} />
    </Grid>
  );
}

/* ─────────────────────────────── 04 movement ─────────────────────────────── */

/**
 * Let go, the edit's climax: the turn is the chapter's one large frame, the
 * arm thrown up with the lace and the bullet belt under swinging ruffles
 * smaller beside it. The three drift at their own speeds.
 */
function Movement({ ctx }: { ctx: Ctx }) {
  const { wide, box, reduced, scroller, m, g } = ctx;
  const ref = useRef<HTMLElement>(null);
  const { turn, raised } = STILLS;
  const belt = DETAILS.belt;
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start end", "end start"] });
  const drift = (k: number) => (v: number) => (reduced || !wide ? 0 : (v - 0.5) * box.h * k);
  const y1 = useTransform(scrollYProgress, drift(0.1));
  const y2 = useTransform(scrollYProgress, drift(-0.08));
  const y3 = useTransform(scrollYProgress, drift(0.16));
  if (!wide) {
    return (
      <section ref={ref} aria-label="04 Movement" className="relative grid" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))", columnGap: ctx.g, rowGap: ctx.g * 2, padding: `72px ${ctx.m}px 0` }}>
        <Chapter n="04" title="Movement" ctx={ctx} style={span(1, 6)} />
        {/* The release: the turn at the page's full width, the tallest frame of the edit. */}
        <Frame s={turn} ctx={ctx} ratio={2 / 3} pos="50% 30%" lead style={span(1, 6)} />
        <Frame s={raised} ctx={ctx} ratio={2 / 3} pos="50% 30%" sizes="50vw" style={span(1, 3)} />
        <Frame s={belt} ctx={ctx} ratio={3 / 4} pos="46% 50%" sizes="50vw" delay={90} style={{ ...span(4, 3), marginTop: 48 }} />
      </section>
    );
  }
  // The turn cut square, six columns wide but never taller than 90 % of the
  // screen (a phone held sideways sees all of it); the belt under the
  // chapter's name, the raised arm lower at the right.
  const side = Math.min(((box.w - 2 * m - 11 * g) / 12) * 6 + g * 5, box.h * 0.9);
  return (
    <section ref={ref} aria-label="04 Movement" className="relative grid items-start" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))", columnGap: g, padding: `${box.h * 0.18}px ${m}px ${box.h * 0.06}px` }}>
      <Chapter n="04" title="Movement" ctx={ctx} style={{ ...span(1, 3), gridRow: 1, paddingTop: box.h * 0.04 }} />
      <motion.div style={{ ...span(1, 3), gridRow: 1, alignSelf: "end", y: y3 }}>
        <Frame s={belt} ctx={ctx} ratio={belt.width / belt.height} pos="50% 50%" sizes={cw(3, 12)} delay={180} />
      </motion.div>
      <motion.div style={{ ...span(4, 6), gridRow: 1, width: side, justifySelf: "center", y: y1 }}>
        <Frame s={turn} ctx={ctx} ratio={1} pos="50% 4%" sizes={`${Math.ceil(side)}px`} lead />
      </motion.div>
      <motion.div style={{ ...span(10, 3), gridRow: 1, y: y2, marginTop: box.h * 0.16 }}>
        <Frame s={raised} ctx={ctx} ratio={2 / 3} pos="50% 26%" sizes={cw(3, 12)} delay={90} />
      </motion.div>
    </section>
  );
}

/* ─────────────────────────────── 05 portrait ─────────────────────────────── */

/** Stillness again, closer: seated on the floor, the head resting on one hand, the studded cuff. The cover's tagline beside them. */
function Portrait({ ctx }: { ctx: Ctx }) {
  const { wide, box } = ctx;
  const { seated, rest } = STILLS;
  const cuff = DETAILS.cuff;
  const tagline = (
    <Label>
      {WORDS.radical[0]}
      <br />
      {WORDS.radical[1]}
    </Label>
  );
  if (!wide) {
    return (
      <Grid ctx={ctx} cols={6} label="05 Portrait" style={{ paddingTop: 72 }}>
        <Chapter n="05" title="Portrait" ctx={ctx} style={span(1, 6)}>
          {tagline}
        </Chapter>
        <Frame s={seated} ctx={ctx} ratio={4 / 5} pos="50% 60%" lead style={span(1, 6)} />
        <Frame s={rest} ctx={ctx} ratio={3 / 4} pos="50% 30%" sizes="66vw" style={span(1, 4)} />
        <Frame s={cuff} ctx={ctx} ratio={3 / 4} pos="50% 50%" sizes="34vw" delay={90} style={{ ...span(5, 2), alignSelf: "end" }} />
      </Grid>
    );
  }
  return (
    <Grid ctx={ctx} cols={12} label="05 Portrait" style={{ paddingTop: box.h * 0.12 }}>
      <Chapter n="05" title="Portrait" ctx={ctx} style={{ ...span(1, 3), paddingTop: box.h * 0.06 }}>
        {tagline}
      </Chapter>
      <Frame s={seated} ctx={ctx} ratio={4 / 5} pos="50% 62%" sizes={cw(4, 12)} lead style={span(4, 4)} />
      <Frame s={rest} ctx={ctx} ratio={4 / 5} pos="50% 30%" sizes={cw(3, 12)} delay={90} style={span(8, 3)} />
      <Frame s={cuff} ctx={ctx} ratio={2 / 3} pos="50% 50%" sizes={cw(2, 12)} delay={180} style={{ ...span(11, 2), marginTop: box.h * 0.18 }} />
    </Grid>
  );
}

/* ─────────────────────────────── the end ─────────────────────────────── */

function End({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const { wide, box, m } = ctx;
  return (
    <section aria-label="End" style={{ padding: wide ? `${box.h * 0.2}px ${m}px ${m}px` : `96px ${m}px 28px` }}>
      <div className="flex flex-col items-center text-center">
        <p className={`${serif.className} leading-[0.8] tracking-[-0.03em]`} style={{ fontSize: wide ? clamp(box.w * 0.08, 64, 132) : 72 }}>
          {WORDS.title}
        </p>
        <p className={`${serif.className} mt-5 uppercase text-[14px] tracking-[0.14em]`}>{WORDS.edit}</p>
        <button
          onClick={onClose}
          className="mt-12 inline-flex items-center gap-4 border-b border-black/50 pb-1.5 uppercase tracking-[0.24em] text-[10.5px] font-medium outline-none hover:border-black focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#eaeaea]"
        >
          <span aria-hidden className="block h-px w-8 bg-current" />
          Back to the desk
        </button>
      </div>
      {/* The edit's running foot, as on the last page of a magazine. */}
      <div aria-hidden className="mt-24 flex items-center justify-between border-t border-black/15 pt-4">
        <span className={`${serif.className} text-[15px]`}>{WORDS.title}</span>
        <Label style={{ letterSpacing: "0.24em" }}>{WORDS.edit}</Label>
      </div>
    </section>
  );
}
