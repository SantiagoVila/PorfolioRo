"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { IBM_Plex_Mono, Reenie_Beanie } from "next/font/google";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { ABOUT, CONTACT } from "@/data/profile";
import type { World } from "@/hooks/useWorld";
import { safeInsets } from "../safeArea";
import { project, type Camera, type View } from "./worldCamera";

/**
 * The wall is Rosario herself. Her own material is pinned on it, to the right
 * of the desk: her portrait, a typed sheet with her words, her two colours;
 * and a card to reach her. Work belongs to the desk, so it comes into view
 * only as the camera turns from the desk to the wall; About brings it forward
 * to be read; Contact lets it recede and brings the card forward.
 *
 * Each piece is laid out once at its natural size and only placed and scaled
 * by the scene (motion values; no React renders while scrolling). The text is
 * real document content for screen readers; tape and shadows are decoration.
 */

const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap", preload: false });
/** Her handwriting, for her own sentence on the scrap. */
const pen = Reenie_Beanie({ subsets: ["latin"], weight: "400", display: "swap", preload: false });

/** Where the material is pinned (stage px: top-left corner and width). */
const PIN = {
  landscape: { about: { x: 1262, y: 150, w: 300 }, contact: { x: 1452, y: 336, w: 104 } },
  portrait: { about: { x: 905, y: 150, w: 320 }, contact: { x: 1160, y: 330, w: 112 } },
};

type Place = { x: number; y: number; k: number; o: number };
type Size = { w: number; h: number };

const mix = (a: Place, b: Place, t: number): Place => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  k: a.k * Math.pow(b.k / a.k, t),
  o: a.o + (b.o - a.o) * t,
});

/** Pinned on the wall under camera c. */
function pinned(view: View, c: Camera, pin: { x: number; y: number; w: number }, size: Size, o: number): Place {
  const p = project(view, c, pin.x, pin.y);
  return { x: p.x, y: p.y, k: Math.max(0.05, (pin.w * c.k) / size.w), o };
}

/** Fitted, centred, into a screen box. */
function inBox(size: Size, x0: number, y0: number, x1: number, y1: number, max: number, o = 1): Place {
  const k = Math.min(max, (x1 - x0) / size.w, (y1 - y0) / size.h);
  return { x: (x0 + x1 - size.w * k) / 2, y: (y0 + y1 - size.h * k) / 2, k, o };
}

/** Top of the area below the navigation. */
const TOP = 76;

/** A landscape screen too short for the full composition (a phone held sideways). */
const isShort = (view: View) => !view.portrait && view.hs < 560;

function layout(view: View, cams: Camera[], c: Camera, s: number, about: Size, card: Size) {
  const { w, hs, portrait } = view;
  const short = isShort(view);
  const pin = portrait ? PIN.portrait : PIN.landscape;
  // Where each is read. On short landscape screens (a phone held sideways) the
  // material takes the whole width under the navigation, or it would be too small
  // (short of the phone's notch and rounded corners at the sides).
  const read = portrait
    ? inBox(about, w * 0.04, TOP, w * 0.96, hs * 0.96, 1.2)
    : short
      ? inBox(about, Math.max(w * 0.03, safeInsets().left + 8), 56, Math.min(w * 0.97, w - safeInsets().right - 8), hs - 10, 1.15)
      : inBox(about, w * (w < 1200 ? 0.3 : 0.34), Math.max(TOP, hs * 0.1), w * 0.965, hs * 0.93, 1.15);
  const cardRead = portrait
    ? inBox(card, w * 0.06, hs * 0.18, w * 0.94, hs * 0.8, 1.25)
    : short
      ? inBox(card, w * 0.2, hs * 0.14, w * 0.8, hs * 0.97, 1.3)
      : inBox(card, w * 0.44, hs * 0.16, w * 0.9, hs * 0.84, 1.45);
  // At About the card waits: tucked into the corner of the sheet (landscape),
  // or just below the fold (upright, and short screens), so it never covers her words.
  const tuck: Place = portrait || short
    ? { x: w * 0.5, y: hs * 1.02, k: 0.62, o: 1 }
    : { x: read.x + about.w * read.k - card.w * 0.5 * 0.92, y: read.y + about.h * read.k - card.h * 0.5 * 0.55, k: 0.5, o: 1 };
  // At Contact the rest of the material steps back towards the wall (on upright
  // and short screens, out of the way entirely: a faint sheet there reads as a smudge).
  const back = mix(read, pinned(view, cams[3], pin.about, about, 1), 0.55);
  back.o = portrait || short ? 0 : 0.2;

  // The intro's wall belongs to her name and work to the desk: the material comes
  // into view on its spot on the wall as the camera leaves the desk for it.
  let a: Place;
  let b: Place;
  if (s <= 1) {
    a = pinned(view, c, pin.about, about, 0);
    b = pinned(view, c, pin.contact, card, 0);
  } else if (s <= 2) {
    const t = s - 1;
    const seen = Math.min(1, t / 0.35);
    a = mix(pinned(view, c, pin.about, about, seen), read, t);
    b = mix(pinned(view, c, pin.contact, card, seen), tuck, t);
  } else {
    const t = s - 2;
    a = mix(read, back, t);
    b = mix(tuck, cardRead, t);
  }
  return { a, b };
}

type Layout = { a: Place; b: Place } | null;

/** One piece's place as motion values. */
function usePlaced(place: MotionValue<Layout>, which: "a" | "b") {
  return {
    x: useTransform(place, (p) => (p ? p[which].x : 0)),
    y: useTransform(place, (p) => (p ? p[which].y : 0)),
    scale: useTransform(place, (p) => (p ? p[which].k : 1)),
    opacity: useTransform(place, (p) => (p ? p[which].o : 0)),
  };
}

export default function AboutContact({ world }: { world: World }) {
  const { s, camera, view, cams, ready } = world;
  const short = isShort(view);
  const aboutRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [sizes, setSizes] = useState<{ about: Size; card: Size } | null>(null);
  useLayoutEffect(() => {
    const a = aboutRef.current;
    const c = cardRef.current;
    if (!a || !c) return;
    const measure = () => setSizes({ about: { w: a.offsetWidth, h: a.offsetHeight }, card: { w: c.offsetWidth, h: c.offsetHeight } });
    const ro = new ResizeObserver(measure);
    ro.observe(a);
    ro.observe(c);
    return () => ro.disconnect();
  }, [view.portrait, short]);

  // The camera changes with every change of s, so it is the one dependency (s is read with it);
  // when the layout changes without a scroll, it is nudged so the pieces are placed again.
  useLayoutEffect(() => {
    if (sizes) camera.set({ ...camera.get() });
  }, [sizes, camera]);
  const place = useTransform(camera, (c: Camera): Layout => {
    if (!sizes || !cams.length) return null;
    return layout(view, cams, c, s.get(), sizes.about, sizes.card);
  });
  const aboutStyle = usePlaced(place, "a");
  const cardStyle = usePlaced(place, "b");
  const cardActive = useTransform(s, (v) => (v > 2.6 ? "auto" : "none"));

  // While the camera moves, the pieces are layers of their own, so its zoom does not
  // repaint their paper and type on every frame; once it rests (and they are read)
  // they are painted again at their size, sharp.
  const settle = useRef(0);
  useMotionValueEvent(s, "change", () => {
    const pieces = [aboutRef.current, cardRef.current];
    if (!settle.current) for (const el of pieces) if (el) el.style.willChange = "transform";
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      settle.current = 0;
      for (const el of pieces) if (el) el.style.willChange = "";
    }, 200);
  });
  useEffect(() => () => window.clearTimeout(settle.current), []);

  const focusTo = (state: number) => () => {
    if (world.currentState() !== state) world.go(state);
  };

  return (
    <div className="absolute inset-0 z-40 overflow-hidden pointer-events-none" style={{ visibility: ready && sizes ? "visible" : "hidden" }}>
      <motion.section
        ref={aboutRef}
        aria-labelledby="about-title"
        className="absolute left-0 top-0 origin-top-left"
        style={aboutStyle}
        onFocus={focusTo(2)}
      >
        <AboutMaterial portrait={view.portrait} compact={short} />
      </motion.section>
      <motion.section
        ref={cardRef}
        aria-labelledby="contact-title"
        className="absolute left-0 top-0 origin-top-left"
        style={{ ...cardStyle, pointerEvents: cardActive }}
        onFocus={focusTo(3)}
      >
        <ContactCard />
      </motion.section>
    </div>
  );
}

/* ─────────────────────────────── the material ─────────────────────────────── */

const PAPER_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/** A sheet of paper on the wall: a slight tilt, its own grain, a soft shadow. */
function Paper({ children, className = "", style, tone = "#f1ebdf" }: { children?: ReactNode; className?: string; style?: CSSProperties; tone?: string }) {
  return (
    <div
      className={`relative ${className}`}
      style={{ background: tone, boxShadow: "0 1px 1px rgba(40,28,18,0.18), 0 14px 28px -12px rgba(40,28,18,0.55)", ...style }}
    >
      <div aria-hidden className="absolute inset-0 opacity-[0.16] mix-blend-multiply pointer-events-none" style={{ backgroundImage: PAPER_NOISE }} />
      {children}
    </div>
  );
}

/** A strip of masking tape. */
function Tape({ style }: { style: CSSProperties }) {
  return <span aria-hidden className="absolute h-5 w-20 bg-[#e8dcc3]/75 shadow-[0_1px_1px_rgba(0,0,0,0.08)]" style={style} />;
}

/** Where a piece is pinned in the composition (design px; the whole composition is placed and scaled by the scene). */
const pinAt = (left: number, top: number, width: number, rotate: number, z = 0): CSSProperties => ({
  position: "absolute",
  left,
  top,
  width,
  transform: `rotate(${rotate}deg)`,
  zIndex: z,
});

// A torn lower edge, as on the strips of her own About page.
const TORN =
  "polygon(0 0, 100% 0, 100% 78%, 96% 100%, 91% 84%, 85% 97%, 78% 86%, 70% 100%, 62% 88%, 55% 98%, 47% 85%, 39% 97%, 31% 86%, 23% 99%, 15% 87%, 8% 98%, 0 86%)";

const LAYOUTS = {
  landscape: {
    w: 780,
    h: 660,
    photo: pinAt(0, 44, 286, -2.2),
    strip: pinAt(150, 12, 300, 1.6, 3),
    chips: pinAt(592, 22, 170, 3, 2),
    sheet: pinAt(318, 70, 430, 0.9, 1),
    card: pinAt(318, 452, 222, 1.6, 2),
    note: pinAt(562, 470, 214, -3.2, 2),
    photoW: 286,
    name: 60,
    pad: "px-8 pt-8 pb-9",
  },
  compact: {
    w: 770,
    h: 336,
    photo: pinAt(0, 26, 176, -2.2),
    strip: pinAt(58, 4, 250, 1.6, 3),
    chips: pinAt(452, 6, 160, 3, 2),
    sheet: pinAt(196, 30, 356, 0.9, 1),
    card: pinAt(572, 40, 198, 1.6, 2),
    note: pinAt(568, 196, 200, -3.2, 2),
    photoW: 176,
    name: 38,
    pad: "px-6 pt-6 pb-6",
  },
};

/**
 * Her About page, "RM Studio | Issue 01", as her own material pinned to the
 * studio wall: the portrait print, the masthead torn from the page (the
 * section's heading), the name in the same heavy capitals as the name on the
 * wall with her competencies as one line, her origin and statement, her own
 * sentence written on a scrap, a typed index card (studies, tools) and her two
 * colours as swatches. Only her words; composed, not a list.
 */
function AboutMaterial({ portrait, compact }: { portrait: boolean; compact: boolean }) {
  if (portrait) return <AboutMaterialUpright />;
  const L = compact ? LAYOUTS.compact : LAYOUTS.landscape;
  return (
    <div className="relative" style={{ width: L.w, height: L.h }}>
      <h2
        id="about-title"
        lang="en"
        tabIndex={-1}
        className="outline-none focus-visible:ring-2 focus-visible:ring-[#1b1713]/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        style={L.strip}
      >
        <span className="block px-4 pt-2 pb-3 bg-[#1b1713] text-[#f4efe6] font-bold uppercase tracking-[0.04em] text-[15px] leading-none" style={{ clipPath: TORN }}>
          {ABOUT.studio} <span aria-hidden>|</span> {ABOUT.issue}
          <span className="sr-only">: about {ABOUT.name}</span>
        </span>
      </h2>

      <figure style={L.photo}>
        <Paper tone="#f7f3ec" className="p-2.5 pb-9">
          <div className="relative w-full" style={{ aspectRatio: `${ABOUT.portrait.width} / ${ABOUT.portrait.height}` }}>
            <Image src={ABOUT.portrait.src} alt={ABOUT.portrait.alt} lang="en" fill sizes={`${Math.round(L.photoW * 1.6)}px`} className="object-cover" />
          </div>
        </Paper>
        <Tape style={{ top: -9, left: "22%", transform: "rotate(-5deg)" }} />
      </figure>

      <Paper className={`${L.pad} text-[#221b14]`} style={L.sheet}>
        <p className="font-bold uppercase leading-[0.84] tracking-[-0.035em]" style={{ fontSize: L.name }}>
          Rosario
          <br />
          Medina
        </p>
        <p className={`${mono.className} mt-4 text-[10px] uppercase leading-[1.75] tracking-[0.16em] text-[#221b14]/75`}>
          {ABOUT.competencies.items.join(" · ")}
        </p>
        <span aria-hidden className="mt-5 block h-px w-10 bg-[#221b14]/45" />
        <div className={`${mono.className} ${compact ? "mt-4 text-[12px] leading-[1.5]" : "mt-5 text-[12.5px] leading-[1.6]"}`}>
          <p>{ABOUT.origin}</p>
          <p className="mt-2.5">{ABOUT.statement[0]}</p>
        </div>
        <Tape style={{ top: -8, right: 30, transform: "rotate(4deg)" }} />
      </Paper>

      {/* Studies and tools, typed on an index card under a red rule (her Flame Scarlet). */}
      <Paper tone="#fbf8f2" className="px-4 pt-3.5 pb-4" style={{ ...L.card, borderTop: `3px solid ${ABOUT.palette[0].hex}` }}>
        <dl className={`${mono.className} text-[10.5px] leading-[1.5] text-[#221b14]`}>
          <dt className="text-[8.5px] uppercase tracking-[0.2em] text-[#221b14]/64">{ABOUT.education.label}</dt>
          <dd className="mt-1">{ABOUT.education.text}</dd>
          <dt className="mt-3 text-[8.5px] uppercase tracking-[0.2em] text-[#221b14]/64" lang="en">{ABOUT.tools.label}</dt>
          <dd className="mt-1">{ABOUT.tools.items.join(" · ")}</dd>
        </dl>
      </Paper>

      {/* Her own sentence, written on a scrap and pinned. */}
      <div style={L.note}>
        <Paper tone="#f8f4ec" className="px-4 pt-4 pb-3.5">
          <p className={`${pen.className} text-[#1d2a44] leading-[1.02]`} style={{ fontSize: compact ? 21 : 24 }}>
            {ABOUT.statement[1]}
          </p>
        </Paper>
        <span
          aria-hidden
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full shadow-[0_2px_3px_rgba(0,0,0,0.3)]"
          style={{ background: ABOUT.palette[0].hex }}
        />
      </div>

      <ul lang="en" aria-label={`Her palette, ${ABOUT.paletteName}`} className="flex gap-3" style={L.chips}>
        {ABOUT.palette.map((c) => (
          <li key={c.code}>
            <Paper tone="#f6f2ea" className={`${compact ? "w-[62px]" : "w-[74px]"} p-1.5 pb-2`}>
              <span aria-hidden className={`block ${compact ? "h-9" : "h-12"}`} style={{ background: c.hex }} />
              <span className={`${mono.className} mt-1.5 block text-[7px] leading-[1.35] text-[#3a3026]`}>
                Pantone {c.code}
                <br />
                {c.name}
              </span>
            </Paper>
          </li>
        ))}
      </ul>
    </div>
  );
}


/**
 * The same material on an upright screen, in the order it is read: the
 * portrait with the masthead and the swatches beside it, the sheet, then the
 * index card and her note side by side. Each piece is tucked a little into
 * the one above, as pinned papers; the heights follow the real text.
 */
function AboutMaterialUpright() {
  return (
    <div className="relative flex flex-col" style={{ width: 360 }}>
      <div className="relative" style={{ height: 292 }}>
        <h2
          id="about-title"
          lang="en"
          tabIndex={-1}
          className="outline-none focus-visible:ring-2 focus-visible:ring-[#1b1713]/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
          style={pinAt(88, 4, 262, 2, 3)}
        >
          <span className="block px-4 pt-2 pb-3 bg-[#1b1713] text-[#f4efe6] font-bold uppercase tracking-[0.04em] text-[15px] leading-none" style={{ clipPath: TORN }}>
            {ABOUT.studio} <span aria-hidden>|</span> {ABOUT.issue}
            <span className="sr-only">: about {ABOUT.name}</span>
          </span>
        </h2>
        <figure style={pinAt(4, 28, 178, -2.4)}>
          <Paper tone="#f7f3ec" className="p-2 pb-7">
            <div className="relative w-full" style={{ aspectRatio: `${ABOUT.portrait.width} / ${ABOUT.portrait.height}` }}>
              <Image src={ABOUT.portrait.src} alt={ABOUT.portrait.alt} lang="en" fill sizes="360px" className="object-cover" />
            </div>
          </Paper>
          <Tape style={{ top: -9, left: "22%", transform: "rotate(-5deg)" }} />
        </figure>
        <ul lang="en" aria-label={`Her palette, ${ABOUT.paletteName}`} className="flex flex-col gap-2.5" style={pinAt(214, 84, 76, 3)}>
          {ABOUT.palette.map((c) => (
            <li key={c.code}>
              <Paper tone="#f6f2ea" className="w-[70px] p-1.5 pb-2">
                <span aria-hidden className="block h-10" style={{ background: c.hex }} />
                <span className={`${mono.className} mt-1.5 block text-[7px] leading-[1.35] text-[#3a3026]`}>
                  Pantone {c.code}
                  <br />
                  {c.name}
                </span>
              </Paper>
            </li>
          ))}
        </ul>
      </div>

      <Paper className="px-6 pt-6 pb-8 text-[#221b14]" style={{ margin: "-6px 8px 0 12px", transform: "rotate(0.8deg)", zIndex: 1 }}>
        <p className="font-bold uppercase leading-[0.84] tracking-[-0.035em] text-[40px]">
          Rosario
          <br />
          Medina
        </p>
        <p className={`${mono.className} mt-4 text-[10px] uppercase leading-[1.75] tracking-[0.16em] text-[#221b14]/75`}>
          {ABOUT.competencies.items.join(" · ")}
        </p>
        <span aria-hidden className="mt-4 block h-px w-10 bg-[#221b14]/45" />
        <div className={`${mono.className} mt-4 text-[12px] leading-[1.55]`}>
          <p>{ABOUT.origin}</p>
          <p className="mt-2">{ABOUT.statement[0]}</p>
        </div>
        <Tape style={{ top: -8, right: 30, transform: "rotate(4deg)" }} />
      </Paper>

      <div className="flex items-start gap-3" style={{ marginTop: -14, zIndex: 2 }}>
        <Paper tone="#fbf8f2" className="px-3.5 pt-3 pb-3.5" style={{ width: 176, transform: "rotate(-1.8deg)", borderTop: `3px solid ${ABOUT.palette[0].hex}` }}>
          <dl className={`${mono.className} text-[10.5px] leading-[1.45] text-[#221b14]`}>
            <dt className="text-[8.5px] uppercase tracking-[0.2em] text-[#221b14]/64">{ABOUT.education.label}</dt>
            <dd className="mt-1">{ABOUT.education.text}</dd>
            <dt className="mt-2.5 text-[8.5px] uppercase tracking-[0.2em] text-[#221b14]/64" lang="en">{ABOUT.tools.label}</dt>
            <dd className="mt-1">{ABOUT.tools.items.join(" · ")}</dd>
          </dl>
        </Paper>
        <div className="relative" style={{ width: 170, marginTop: 10, transform: "rotate(2.6deg)" }}>
          <Paper tone="#f8f4ec" className="px-3.5 pt-3.5 pb-3">
            <p className={`${pen.className} text-[#1d2a44] leading-[1.02] text-[22px]`}>{ABOUT.statement[1]}</p>
          </Paper>
          <span
            aria-hidden
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full shadow-[0_2px_3px_rgba(0,0,0,0.3)]"
            style={{ background: ABOUT.palette[0].hex }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The last thing on the wall: her studio's card. The name, what she does (her
 * own competencies) and where she is, and under a rule each way to reach her
 * that exists (data/profile.ts): the address to write to or copy, Instagram,
 * LinkedIn, the CV. A missing one is simply not printed.
 */
function ContactCard() {
  const [copied, setCopied] = useState(false);
  const { email, instagram, linkedin, cv } = CONTACT;
  const copy = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* no clipboard: the address stays visible to copy by hand */
    }
  };
  // Hit areas reach past the small type (after:), for fingers.
  const action =
    "relative underline underline-offset-4 decoration-[#221b14]/35 hover:decoration-[#221b14] outline-none after:absolute after:-inset-x-2 after:-inset-y-2.5 after:content-[''] focus-visible:ring-2 focus-visible:ring-[#221b14]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f1e7]";
  const links = [
    instagram ? { label: "Instagram", text: `@${instagram}`, href: `https://instagram.com/${instagram}` } : null,
    linkedin ? { label: "LinkedIn", text: "Profile", href: linkedin } : null,
    cv ? { label: "CV", text: "Open", href: cv } : null,
  ].filter((l): l is { label: string; text: string; href: string } => l !== null);
  const any = !!email || links.length > 0;
  return (
    <Paper className="w-[360px] px-7 pt-6 pb-7 text-[#221b14]" tone="#f6f1e7" style={{ transform: "rotate(-1.2deg)" }}>
      <div className="flex items-start justify-between">
        <h2
          id="contact-title"
          lang="en"
          tabIndex={-1}
          className={`${mono.className} text-[10px] uppercase tracking-[0.24em] text-[#221b14]/64 outline-none focus-visible:ring-2 focus-visible:ring-[#221b14]/60 focus-visible:ring-offset-4 focus-visible:ring-offset-[#f6f1e7]`}
        >
          Contact
        </h2>
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.06em]">
          <span aria-hidden className="block h-2.5 w-2.5" style={{ background: ABOUT.palette[0].hex }} />
          {ABOUT.studio}
        </span>
      </div>
      <p className="mt-7 text-[34px] font-bold leading-[0.9] tracking-[-0.03em]">{ABOUT.name}</p>
      <p className={`${mono.className} mt-3 text-[10px] uppercase leading-[1.7] tracking-[0.16em] text-[#221b14]/70`}>
        {ABOUT.competencies.items.join(" · ")}
      </p>
      <p className={`${mono.className} mt-3 text-[10.5px] tracking-[0.06em] text-[#221b14]/80`}>{ABOUT.base}</p>

      {any && (
        <div lang="en" className="mt-6 border-t border-[#221b14]/20 pt-5">
          {email && (
            <div>
              <a href={`mailto:${email}`} className={`${action} text-[17px] font-medium break-all`}>
                {email}
              </a>
              <div className={`${mono.className} mt-2 flex gap-5 text-[10px] uppercase tracking-[0.18em]`}>
                <a href={`mailto:${email}`} className={action}>
                  Write
                </a>
                <button type="button" onClick={copy} className={`${action} uppercase tracking-[0.18em]`}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <span role="status" aria-live="polite" className="sr-only">
                {copied ? "Email address copied" : ""}
              </span>
            </div>
          )}
          {links.length > 0 && (
            <ul className={`${mono.className} ${email ? "mt-5" : ""} space-y-2 text-[10.5px]`}>
              {links.map((l) => (
                <li key={l.label} className="flex items-baseline gap-3">
                  <span className="w-[74px] shrink-0 text-[8.5px] uppercase tracking-[0.2em] text-[#221b14]/64">{l.label}</span>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className={action}>
                    {l.text} <span aria-hidden>↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <Tape style={{ top: -9, left: "50%", transform: "translateX(-50%) rotate(-3deg)" }} />
    </Paper>
  );
}
