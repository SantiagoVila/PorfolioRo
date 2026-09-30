"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent, type AnimationPlaybackControls, type MotionValue } from "framer-motion";
import type { World } from "@/hooks/useWorld";
import { PHONE, phoneAt } from "./sceneLayout";
import { closeOn, workCamera, type View } from "./worldCamera";
import { CONTACT_T, DURATION, pickUp, within } from "./visitTimeline";
import { stateScrollY } from "./worldStates";

/**
 * Visiting Rosario from the desk: the cap opens her (ABOUT), the phone the
 * way to reach her (CONTACT). The navigation's About and Contact pick up the
 * very same objects, so there is one About and one Contact.
 *
 * Like the projects' books: one progress value per visit drives the whole
 * choreography (see visitTimeline), the desk stays mounted underneath, and
 * the address mirrors the visit (?about, ?contact) through the History API,
 * so Back / Forward and direct links work (the earlier /#about and /#contact
 * links open the same visits). Escape leaves; focus goes back to what opened
 * it. From one visit the other can be reached directly (About → Contact).
 */

export type Visit = "about" | "contact";
export type VisitPhase = "idle" | "opening" | "open" | "closing";

export interface Visiting {
  about: MotionValue<number>;
  contact: MotionValue<number>;
  /** The visit open, or opening / closing. */
  current: Visit | null;
  phase: VisitPhase;
  reduced: boolean;
  /** Pick the object up. `from` gets focus back when the visit ends (by default, whatever has it now). */
  open: (v: Visit, from?: HTMLElement | null) => void;
  /** Leave (through history, so Back stays consistent). */
  requestClose: () => void;
  /** From the visit open to the other one. */
  switchTo: (v: Visit) => void;
}

const HISTORY_KEY = "rmVisit";

/** The visit the address asks for, if any. */
function visitInUrl(): Visit | null {
  const q = new URLSearchParams(window.location.search);
  if (q.has("about")) return "about";
  if (q.has("contact")) return "contact";
  const h = window.location.hash.slice(1).toLowerCase();
  return h === "about" || h === "contact" ? h : null;
}

/**
 * While a visit is on, Back must only close it: the browser's own scroll
 * restoration would otherwise move the page to where it was when the visit's
 * entry was pushed (the intro, for a phone picked up from there, which brings
 * the page down to the desk). The mode is kept per history entry, so it is
 * set on the entry Back returns to, before the visit's own is pushed; given
 * back once the visit has ended (on that same entry).
 */
function holdScroll(on: boolean) {
  if ("scrollRestoration" in window.history) window.history.scrollRestoration = on ? "manual" : "auto";
}

/**
 * The call's framing: the camera leans in a little, the telephone standing to
 * the right and low, the wall beside and above it taking the rest of the
 * frame (her studio's card is set there; see ContactVisit). Where the dial
 * lands on screen, per shape of screen.
 */
export function callSpot(view: View) {
  const short = !view.portrait && view.hs < 560;
  return view.portrait ? { fx: 0.72, fy: 0.7 } : short ? { fx: 0.8, fy: 0.64 } : { fx: 0.76, fy: 0.7 };
}
const phoneAim = (view: View) => {
  const d = phoneAt(view.layout, PHONE.dial.x, PHONE.dial.y);
  const k = workCamera(view).k * PHONE.closer;
  const { fx, fy } = callSpot(view);
  return { x: d.x - ((fx - 0.5) * view.w) / k, y: d.y - ((fy - 0.5) * view.h) / k, closer: PHONE.closer };
};
/** The camera as the call is on. */
export const callCamera = (view: View) => {
  const a = phoneAim(view);
  return closeOn(view, a.x, a.y, a.closer);
};

export function useVisit(world: World): Visiting {
  const about = useMotionValue(0);
  const contact = useMotionValue(0);
  const reduced = world.reduced;

  const [current, setCurrentState] = useState<Visit | null>(null);
  const [phase, setPhaseState] = useState<VisitPhase>("idle");
  const currentRef = useRef<Visit | null>(null);
  const phaseRef = useRef<VisitPhase>("idle");
  const seq = useRef(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const reducedRef = useRef(reduced);
  useEffect(() => {
    reducedRef.current = reduced;
  });

  const setCurrent = useCallback((v: Visit | null) => {
    currentRef.current = v;
    setCurrentState(v);
  }, []);
  const setPhase = useCallback((p: VisitPhase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  // The telephone's visit draws the camera in to it.
  const { aim, aimAt } = world;
  // (With reduced motion it does not travel: it is there, or not.)
  useMotionValueEvent(contact, "change", (v) => aim.set(reducedRef.current ? (v > 0 ? 1 : 0) : pickUp(within(v, CONTACT_T.aim))));

  /** Play visit `v` to 1 (open) or 0 (closed). False if something newer took over. */
  const run = useCallback(
    async (v: Visit, to: 0 | 1, n: number) => {
      controls.current?.stop();
      const mv = v === "about" ? about : contact;
      const from = mv.get();
      if (from === to) return n === seq.current;
      const full = reducedRef.current ? DURATION.reduced : to ? DURATION[v].open : DURATION[v].close;
      const c = animate(mv, to, { duration: full * Math.abs(to - from), ease: "linear" });
      controls.current = c;
      await c.finished;
      return n === seq.current;
    },
    [about, contact]
  );

  const finish = useCallback(() => {
    setPhase("idle");
    setCurrent(null);
    aimAt(null);
    holdScroll(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPhase, setCurrent]);

  // Back on the desk: focus returns to what opened the visit (once the desk is live again, no longer inert).
  useEffect(() => {
    if (phase !== "idle") return;
    const el = returnFocus.current;
    returnFocus.current = null;
    if (el?.isConnected) el.focus({ preventScroll: true });
  }, [phase]);


  const begin = useCallback(
    async (v: Visit, n: number) => {
      holdScroll(true);
      if (v === "contact") {
        aimAt(phoneAim);
        // Picked up from the intro: the page comes down to the desk as the camera leans in to the phone,
        // so the cap is back in its place beside it, and the visit ends on the desk. Moved step by step
        // from script (a page held by a visit cannot scroll smoothly on its own: the hold cancels it).
        if (world.raw.get() < 1) {
          const to = stateScrollY(1);
          if (reducedRef.current) window.scrollTo(0, to);
          else animate(window.scrollY, to, { duration: DURATION.contact.open * CONTACT_T.aim[1] * 1.3, ease: [0.45, 0.05, 0.15, 1], onUpdate: (y) => window.scrollTo(0, y) });
        }
      }
      setCurrent(v);
      setPhase("opening");
      if (!(await run(v, 1, n))) return;
      setPhase("open");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, setCurrent, setPhase]
  );

  const close = useCallback(async () => {
    const v = currentRef.current;
    if (!v || phaseRef.current === "closing") return;
    const n = ++seq.current;
    setPhase("closing");
    if (!(await run(v, 0, n))) return;
    finish();
  }, [run, finish, setPhase]);

  const open = useCallback(
    (v: Visit, from?: HTMLElement | null, { push = true } = {}) => {
      const cur = currentRef.current;
      // Picked up again while being put down: turn round.
      if (cur === v && phaseRef.current === "closing") {
        const n = ++seq.current;
        holdScroll(true);
        if (push) window.history.pushState({ [HISTORY_KEY]: v }, "", `?${v}`);
        void begin(v, n);
        return;
      }
      if (cur) return;
      const n = ++seq.current;
      returnFocus.current = from ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      // Before the push: the mode belongs to the entry Back returns to.
      holdScroll(true);
      if (push) window.history.pushState({ [HISTORY_KEY]: v }, "", `?${v}`);
      void begin(v, n);
    },
    [begin]
  );

  // One visit to the other: the first is put down, the second picked up.
  const switchTo = useCallback(
    async (v: Visit, { history = true } = {}) => {
      const cur = currentRef.current;
      if (!cur || cur === v) return;
      const n = ++seq.current;
      if (history) window.history.replaceState({ [HISTORY_KEY]: v }, "", `?${v}`);
      setPhase("closing");
      if (!(await run(cur, 0, n))) return;
      aimAt(null);
      void begin(v, n);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run, begin, setPhase]
  );

  const requestClose = useCallback(() => {
    const v = currentRef.current;
    if (!v) return;
    if (window.history.state?.[HISTORY_KEY] === v) window.history.back(); // popstate → close
    else {
      window.history.replaceState(null, "", window.location.pathname);
      void close();
    }
  }, [close]);

  // Escape leaves, mid-way too.
  const escapable = phase === "opening" || phase === "open";
  useEffect(() => {
    if (!escapable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [escapable, requestClose]);

  // Back / Forward.
  useEffect(() => {
    const onPop = () => {
      const v = visitInUrl();
      const cur = currentRef.current;
      if (!v) void close();
      else if (!cur || (cur === v && phaseRef.current === "closing")) open(v, null, { push: false });
      else if (cur !== v) void switchTo(v, { history: false });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [close, open, switchTo]);

  // A direct link: the visit is open on arrival, over the desk (so leaving puts the object back in its place).
  useEffect(() => {
    const v = visitInUrl();
    if (!v || new URLSearchParams(window.location.search).has("project")) return;
    // Not marked as the visit's own entry: leaving it clears the address instead of going back (out of the site).
    window.history.replaceState(null, "", `?${v}`);
    holdScroll(true);
    window.scrollTo(0, stateScrollY(1));
    seq.current++;
    (v === "about" ? about : contact).set(1);
    if (v === "contact") aimAt(phoneAim);
    /* eslint-disable react-hooks/set-state-in-effect -- one-off sync from the URL on load */
    setCurrent(v);
    setPhase("open");
    /* eslint-enable react-hooks/set-state-in-effect */
    // Mount-only: later changes arrive through popstate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The desk must not move under a visit (see globals.css).
  const engaged = phase !== "idle";
  useEffect(() => {
    const root = document.documentElement;
    if (engaged) {
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;top:-999px;width:50px;height:50px;overflow:scroll";
      document.body.appendChild(probe);
      root.style.setProperty("--scrollbar-w", `${probe.offsetWidth - probe.clientWidth}px`);
      probe.remove();
    }
    root.classList.toggle("visit-open", engaged);
    return () => root.classList.remove("visit-open");
  }, [engaged]);

  return { about, contact, current, phase, reduced, open, requestClose, switchTo: (v) => void switchTo(v) };
}
