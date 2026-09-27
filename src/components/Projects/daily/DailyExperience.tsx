"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { HISTORY_KEY, URL_PARAM } from "../useProjectTransition";
import FrontPage, { isBroadsheet } from "./FrontPage";
import StoryLayer, { preloadStories, type Rect, type StoryPhase } from "./StoryLayer";
import { ORDER, STORIES, type StoryId } from "./dailyContent";
import { PAPER } from "./paper";
import { useBox } from "../useBox";
import type { ExperienceProps } from "../experiences";

/**
 * THE DAILY: the newspaper from the desk, opened into an editorial hub.
 *
 * It arrives as the blank sheet the opening transition leaves on screen (the
 * front page starts as that same paper, its ink not yet printed) and prints
 * its front page onto it. The front page holds the three stories; the
 * reader sets its hierarchy by attention, and enters a story from its place
 * on the page. Stories open over the newspaper, which stays underneath with
 * its state, and return into it.
 *
 * History: a story adds one entry on top of THE DAILY's own
 * (?project=journalism&story=id, same history key), so Back, Escape and the
 * shell's control all go up exactly one level (story → THE DAILY → desk)
 * through the existing project history, and Forward re-enters the story.
 */

const PROJECT = "journalism";
const STORY_PARAM = "story";
const STORY_KEY = "rmDailyStory";

type Open = { id: StoryId; phase: StoryPhase; from: Rect };

const storyInUrl = (): StoryId | null => {
  const id = new URLSearchParams(window.location.search).get(STORY_PARAM);
  // Own keys only: `in` would also accept "constructor", "toString", "__proto__"…
  return id && Object.hasOwn(STORIES, id) ? (id as StoryId) : null;
};

export default function DailyExperience({ setShellControlHidden }: ExperienceProps) {
  const root = useRef<HTMLDivElement>(null);
  const box = useBox(root);
  const reduced = !!useReducedMotion();
  const [ranking, setRanking] = useState<StoryId[]>(ORDER);
  const [open, setOpen] = useState<Open | null>(null);
  const openRef = useRef<Open | null>(null);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // While a story is open its own control is the one way up (to THE DAILY):
  // the shell's "Back to the desk" is hidden, out of the tab order and the
  // accessibility tree, instead of sitting underneath with the wrong label.
  const storyOpen = !!open;
  useEffect(() => {
    setShellControlHidden?.(storyOpen);
  }, [storyOpen, setShellControlHidden]);
  useEffect(() => () => setShellControlHidden?.(false), [setShellControlHidden]);

  const images = useRef<Partial<Record<StoryId, HTMLDivElement | null>>>({});
  const links = useRef<Partial<Record<StoryId, HTMLAnchorElement | null>>>({});
  const registerImage = useCallback((id: StoryId) => (el: HTMLDivElement | null) => { images.current[id] = el; }, []);
  const registerLink = useCallback((id: StoryId) => (el: HTMLAnchorElement | null) => { links.current[id] = el; }, []);
  const rectOf = (id: StoryId): Rect => {
    const r = images.current[id]?.getBoundingClientRect();
    return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : { x: box.w / 2, y: box.h / 2, w: 1, h: 1 };
  };

  // The reader's attention sets the hierarchy; the previous lead steps down to second.
  const promote = useCallback((id: StoryId) => {
    setRanking((r) => (r[0] === id ? r : [id, ...r.filter((s) => s !== id)]));
  }, []);

  const enter = useCallback(
    (id: StoryId, { push = true } = {}) => {
      if (openRef.current) return;
      promote(id);
      const next = { id, phase: "entering" as const, from: rectOf(id) };
      openRef.current = next;
      setOpen(next);
      if (push) window.history.pushState({ [HISTORY_KEY]: PROJECT, [STORY_KEY]: id }, "", `?${URL_PARAM}=${PROJECT}&${STORY_PARAM}=${id}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [promote, box],
  );

  const beginLeave = useCallback(() => {
    const cur = openRef.current;
    if (!cur || cur.phase === "leaving") return;
    const next = { ...cur, phase: "leaving" as const, from: rectOf(cur.id) };
    openRef.current = next;
    setOpen(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box]);

  /** From the story's own control: through history when the story has its entry. */
  const requestLeave = useCallback(() => {
    const cur = openRef.current;
    if (!cur) return;
    if (window.history.state?.[STORY_KEY] === cur.id) {
      window.history.back(); // popstate → beginLeave()
    } else {
      window.history.replaceState({ [HISTORY_KEY]: PROJECT }, "", `?${URL_PARAM}=${PROJECT}`);
      beginLeave();
    }
  }, [beginLeave]);

  const landed = useCallback(() => setOpen((o) => (o ? { ...o, phase: "open" } : o)), []);
  const returned = useCallback(() => {
    const id = openRef.current?.id;
    openRef.current = null;
    setOpen(null);
    if (id) requestAnimationFrame(() => links.current[id]?.focus({ preventScroll: true }));
  }, []);

  // Back / Forward within THE DAILY.
  useEffect(() => {
    const onPop = () => {
      const id = storyInUrl();
      const cur = openRef.current;
      if (!id && cur) beginLeave();
      else if (id && !cur && new URLSearchParams(window.location.search).get(URL_PARAM) === PROJECT) enter(id, { push: false });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [beginLeave, enter]);

  // A direct link to a story opens it straight away, over the newspaper.
  useLayoutEffect(() => {
    const id = storyInUrl();
    if (!id) return;
    const next = { id, phase: "open" as const, from: { x: 0, y: 0, w: 1, h: 1 } };
    openRef.current = next;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- one-off sync from the URL on arrival */
    setOpen(next);
    setRanking((r) => [id, ...r.filter((s) => s !== id)]);
  }, []);

  // The front page prints in once, on arrival from the desk, starting only
  // after the first frame has painted (so a slow mount cannot swallow it).
  // Then the stories' code is fetched in the background.
  const [arriving, setArriving] = useState(true);
  const [go, setGo] = useState(false);
  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setGo(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    if (!go) return;
    const t = setTimeout(() => {
      setArriving(false);
      preloadStories();
    }, 1700);
    return () => clearTimeout(t);
  }, [go]);

  const sizes = isBroadsheet(box) ? "60vw" : "100vw";
  return (
    <div ref={root} className="absolute inset-0 overflow-hidden" style={{ background: PAPER }}>
      <div className="absolute inset-0" inert={!!open}>
        <FrontPage
          box={box}
          ranking={ranking}
          onPromote={promote}
          onEnter={(id) => enter(id)}
          registerImage={registerImage}
          registerLink={registerLink}
          parted={open && open.phase !== "leaving" ? open.id : null}
          opening={arriving && !open}
          go={go}
          reduced={reduced}
        />
      </div>
      {open && (
        <StoryLayer
          key={open.id}
          id={open.id}
          phase={open.phase}
          from={open.from}
          box={box}
          reduced={reduced}
          onLanded={landed}
          onReturned={returned}
          onBack={requestLeave}
          sizes={sizes}
        />
      )}
    </div>
  );
}
