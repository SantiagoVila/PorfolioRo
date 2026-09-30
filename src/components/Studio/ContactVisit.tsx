"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { ABOUT, CONTACT } from "@/data/profile";
import { useFocusTrap } from "@/components/Projects/useFocusTrap";
import { safeInsets } from "@/components/safeArea";
import type { World } from "@/hooks/useWorld";
import BackToDesk from "./BackToDesk";
import { phoneStageBox } from "./PhoneObject";
import { SCREEN_ON } from "./phoneRing";
import { callCamera, type Visiting } from "./useVisit";
import { useMood } from "./useMood";
import { CONTACT_T, pickUp, within } from "./visitTimeline";
import { project } from "./worldCamera";

const INK = "#191510";
const CARD = "#f7f2e8";

/**
 * Contact: her telephone, answered, hands the visitor her card.
 *
 * The handset comes up off its cradle and the camera leans in, the telephone
 * standing to the right (useVisit's call framing); the dial's crest takes her
 * colour (connected), the room's light draws in a little, and her card rises
 * out of the telephone, as a card from a desk's index would, and settles beside
 * it, square to the reader, large enough to read at a glance: her name, what
 * she does and where, and the two ways to reach her the card is for, her email
 * and her celular, each a link (write, call) with a copy button. Instagram,
 * LinkedIn and her CV follow when she has given them.
 *
 * Nothing is invented (data/profile.ts): until her email and celular are
 * filled in, their lines are on the card, ruled and empty, ready for them,
 * with no text standing in (and hidden from assistive technology).
 */
export default function ContactVisit({ visit, world, callLight }: { visit: Visiting; world: World; callLight: MotionValue<number> }) {
  if (visit.current !== "contact" || !world.view.w) return null;
  return <Call visit={visit} world={world} callLight={callLight} />;
}

type Way = { key: string; label: string; value: string | null; href?: string; external?: boolean; copy?: boolean };

function Call({ visit, world, callLight }: { visit: Visiting; world: World; callLight: MotionValue<number> }) {
  const t = visit.contact;
  const reduced = visit.reduced;
  const open = visit.phase === "open";
  const { view } = world;
  const upright = view.portrait;
  const short = !upright && view.hs < 560;
  const night = useMood() === "night";

  // The call's framing on this screen, and where the telephone stands in it.
  const cam = callCamera(view);
  const box = phoneStageBox(view.layout);
  const a = project(view, cam, box.x, box.y);
  const b = project(view, cam, box.x + box.w, box.y + box.h);
  const phone = { left: a.x, top: a.y, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };

  // The card's place: beside the telephone, left of it (landscape), or above it (upright); clear of a
  // phone's notch and rounded corners, and of the way back in the corner above (it moves down with them).
  const insets = safeInsets();
  const drop = Math.max(0, insets.top - 24);
  const pad = upright ? 18 : Math.max(24, view.w * 0.05);
  const room = upright
    ? { left: pad + insets.left, right: view.w - pad - insets.right, top: 76 + drop, bottom: Math.max(300, phone.top - 18) }
    : { left: Math.max(pad, insets.left + 10), right: phone.left - (short ? 26 : 44), top: (short ? 58 : 76) + drop, bottom: view.hs - Math.max(short ? 14 : 28, insets.bottom + 6) };
  const width = Math.max(260, Math.min(upright ? 440 : 540, room.right - room.left));
  const left = upright ? (room.left + room.right - width) / 2 : Math.max(room.left, room.right - width);
  const compact = short || width < 380;
  const nameSize = Math.round(Math.min(compact ? 34 : 46, width / (compact ? 10.5 : 11.5)));
  const valueSize = compact ? 17 : Math.round(Math.min(22, width / 24));

  const { email, phone: celular, instagram, linkedin, cv } = CONTACT;
  const ways: Way[] = [
    { key: "email", label: "Email", value: email, href: email ? `mailto:${email}` : undefined, copy: true },
    { key: "phone", label: "Celular", value: celular, href: celular ? `tel:${celular.replace(/[^\d+]/g, "")}` : undefined, copy: true },
    ...(instagram ? [{ key: "instagram", label: "Instagram", value: `@${instagram}`, href: `https://instagram.com/${instagram}`, external: true }] : []),
    ...(linkedin ? [{ key: "linkedin", label: "LinkedIn", value: "Perfil", href: linkedin, external: true }] : []),
    ...(cv ? [{ key: "cv", label: "CV", value: "Abrir", href: cv, external: true }] : []),
  ];

  // Out of the telephone: from its middle, small and turned, to its place, square to the reader.
  const cardIn = useTransform(t, (v) => (reduced ? 1 : pickUp(within(v, CONTACT_T.card))));
  const cardOpacity = useTransform(t, (v) => (reduced ? within(v, [0.2, 0.8]) : within(v, [CONTACT_T.card[0], CONTACT_T.card[0] + 0.1])));
  const cardScale = useTransform(cardIn, (k) => 0.12 + 0.88 * k);
  const cardRotate = useTransform(cardIn, (k) => (1 - k) * -9);
  const card = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("100% 100%");
  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    const place = () => setOrigin(`${(phone.cx - el.offsetLeft).toFixed(1)}px ${(phone.cy - el.offsetTop).toFixed(1)}px`);
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phone.cx, phone.cy]);

  // Its lines, in turn, as it settles.
  const words = (i: number) => (v: number) => {
    if (reduced) return within(v, [0.4, 1]);
    const [s, e] = CONTACT_T.words;
    const step = (e - s) / 7;
    return within(v, [s + i * step, s + i * step + step * 2.6]);
  };
  const closeOpacity = useTransform(t, words(4));

  const dialog = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) back.current?.focus({ preventScroll: true });
  }, [open]);
  useFocusTrap(dialog, open);

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-title"
      lang="es"
      className="fixed inset-0 z-[70] overflow-hidden"
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      {/* The room's light draws in: its edges down a little, the desk in front softened. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: callLight, background: `radial-gradient(120% 100% at ${upright ? 50 : 62}% 52%, rgba(20,14,10,0) 40%, rgba(20,14,10,0.38) 100%)` }}
      />

      {/* Her card. */}
      <div className="absolute flex items-center" style={{ left, width, top: room.top, height: Math.max(0, room.bottom - room.top) }}>
        <motion.div
          ref={card}
          className="relative w-full"
          style={{ scale: cardScale, rotate: cardRotate, opacity: cardOpacity, transformOrigin: origin, color: INK }}
        >
          {/* The card itself: heavy paper, a soft shadow on the room */}
          <div
            className="relative overflow-hidden rounded-[3px]"
            style={{
              background: CARD,
              boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 0 0 0.5px rgba(25,21,16,0.14), 0 22px 48px -18px rgba(30,18,8,0.55), 0 4px 10px -4px rgba(30,18,8,0.28)",
            }}
          >
            {/* Her colour down its edge */}
            <span aria-hidden className="absolute inset-y-0 left-0 w-[4px]" style={{ background: SCREEN_ON }} />
            <div className={compact ? "px-6 pt-4 pb-5" : "px-8 pt-6 pb-7"}>
              <Line t={t} at={words(0)}>
                <p lang="en" className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.3em] text-[#191510]/70">
                  {ABOUT.studio}
                  <span aria-hidden className="h-px w-5 bg-current opacity-50" />
                  <span lang="es">Contacto</span>
                </p>
              </Line>
              <Line t={t} at={words(0)} className={compact ? "mt-2" : "mt-3"}>
                <h2 id="contact-title" className="font-black uppercase tracking-[-0.035em]" style={{ fontSize: nameSize, lineHeight: 0.86 }}>
                  {ABOUT.name}
                </h2>
              </Line>
              <Line t={t} at={words(1)} className={compact ? "mt-2" : "mt-3"}>
                <p className="text-[12.5px] leading-snug text-[#191510]/80" style={{ maxWidth: "46ch" }}>
                  {ABOUT.competencies.items.join(" · ")}
                  <span className="text-[#191510]/60"> — {ABOUT.base}</span>
                </p>
              </Line>

              <ul className={compact ? "mt-3" : "mt-5"}>
                {ways.map((w, i) => (
                  <WayRow key={w.key} way={w} valueSize={valueSize} compact={compact} t={t} at={words(2 + Math.min(i, 3))} />
                ))}
              </ul>
            </div>
            {/* An index card's notches, at its foot */}
            <span aria-hidden className="absolute bottom-0 left-[34%] h-[7px] w-[14px] rounded-t-full" style={{ background: "rgba(25,21,16,0.1)" }} />
            <span aria-hidden className="absolute bottom-0 right-[34%] h-[7px] w-[14px] rounded-t-full" style={{ background: "rgba(25,21,16,0.1)" }} />
          </div>
        </motion.div>
      </div>

      <BackToDesk ref={back} onClick={visit.requestClose} opacity={closeOpacity} tone={night ? "light" : "ink"} />
    </div>
  );
}

/**
 * One way to reach her: its name, and its value as a link with a copy button;
 * or, until she has given it, its place on the card, ruled and empty.
 */
function WayRow({ way, valueSize, compact, t, at }: { way: Way; valueSize: number; compact: boolean; t: MotionValue<number>; at: (v: number) => number }) {
  const o = useTransform(t, at);
  const y = useTransform(o, (v) => (1 - v) * 6);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);
  const row = `grid grid-cols-[76px_1fr_auto] items-baseline gap-x-3 border-t border-[#191510]/12 ${compact ? "py-2" : "py-3"}`;

  if (!way.value || !way.href) {
    return (
      <motion.li aria-hidden className={row} style={{ opacity: o, y }}>
        <span className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[#191510]/60">{way.label}</span>
        <span className="block h-px self-end mb-[0.3em] bg-[#191510]/22" style={{ marginTop: valueSize * 0.9 }} />
        <span />
      </motion.li>
    );
  }
  return (
    <motion.li className={row} style={{ opacity: o, y }}>
      <span className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[#191510]/60">{way.label}</span>
      <a
        href={way.href}
        {...(way.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="relative min-w-0 font-medium tracking-[-0.01em] break-all underline decoration-1 underline-offset-[5px] decoration-[#191510]/25 hover:decoration-[#e33831] focus-visible:decoration-[#e33831] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e33831] transition-[text-decoration-color] duration-200 after:absolute after:-inset-2 after:content-['']"
        style={{ fontSize: valueSize, lineHeight: 1.15 }}
      >
        {way.value}
        {way.external && <span className="sr-only"> (se abre en otra pestaña)</span>}
      </a>
      {way.copy ? (
        <button
          type="button"
          onClick={() => void navigator.clipboard?.writeText(way.value ?? "").then(() => setCopied(true), () => {})}
          className="relative text-[9px] font-bold uppercase tracking-[0.22em] text-[#191510]/60 hover:text-[#191510] outline-none focus-visible:ring-2 focus-visible:ring-[#e33831] rounded-[2px] px-1 transition-[color,transform] duration-150 ease-out active:scale-[0.97] after:absolute after:-inset-2 after:content-['']"
          aria-label={copied ? `${way.label} copiado` : `Copiar ${way.label.toLowerCase()}`}
        >
          <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
        </button>
      ) : (
        <span />
      )}
    </motion.li>
  );
}

/** One line of the card, appearing in its turn. */
function Line({ t, at, className = "", children }: { t: MotionValue<number>; at: (v: number) => number; className?: string; children: ReactNode }) {
  const o = useTransform(t, at);
  const y = useTransform(o, (v) => (1 - v) * 6);
  return (
    <motion.div className={className} style={{ opacity: o, y }}>
      {children}
    </motion.div>
  );
}
