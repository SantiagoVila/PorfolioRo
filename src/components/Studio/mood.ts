/**
 * The studio's light: the same room by day, at golden hour and at night
 * (three photographs of it, pixel for pixel; see source-assets/
 * derive-desk-moods.py).
 *
 * The visitor chooses it (the light control in the navigation), or leaves it
 * to AUTO (the default): the visitor's own clock, read when the page loads and
 * whenever AUTO is chosen again, then kept (the light does not change under
 * someone reading the page).
 *
 *   day      07:00 – 17:29   the window's light: sun and the leaves' shadows
 *   sunset   17:30 – 20:29   golden hour (evening only)
 *   night    20:30 – 06:59   the lamp on, the city in the window
 *
 * A chosen light is kept in localStorage (LIGHT_KEY) and holds on every page
 * load until AUTO is chosen again. `?luz=dia|atardecer|noche` (or
 * day|sunset|night) shows one for that load only, to review it.
 *
 * The light is set before the page is drawn, by a small script in the
 * document's head (MOOD_SCRIPT, see app/layout), which marks the document
 * (<html data-mood>): the room's CSS (its ink, the work's shadows) follows it
 * from the first paint. The scene reads it through a small store (see
 * useMood.ts; null on the server: the room is drawn on the client only).
 * No React here: the layout, a server component, takes the script.
 */

export type Mood = "day" | "sunset" | "night";
export type LightChoice = "auto" | Mood;
export const MOODS: Mood[] = ["day", "sunset", "night"];

/** Where a chosen light is kept (absent: AUTO). */
export const LIGHT_KEY = "rm-studio-light";

/** Minutes after midnight where each light begins. */
const DAY = 7 * 60;
const SUNSET = 17 * 60 + 30;
const NIGHT = 20 * 60 + 30;

const ALIASES: Record<string, Mood> = { day: "day", dia: "day", "día": "day", sunset: "sunset", atardecer: "sunset", night: "night", noche: "night" };
const isMood = (v: unknown): v is Mood => v === "day" || v === "sunset" || v === "night";

/** The light for a time of day (minutes after midnight). */
export function moodAt(minutes: number): Mood {
  if (minutes >= DAY && minutes < SUNSET) return "day";
  if (minutes >= SUNSET && minutes < NIGHT) return "sunset";
  return "night";
}

/** AUTO's light now. */
export const clockMood = () => {
  const d = new Date();
  return moodAt(d.getHours() * 60 + d.getMinutes());
};

/**
 * Run in the document's head before anything is drawn: the review override,
 * else the kept choice, else the clock (as moodAt). Marks where it came from
 * (data-mood-from: url, chosen or auto) for the light control.
 */
export const MOOD_SCRIPT = `(function(){try{var h=document.documentElement,a=${JSON.stringify(ALIASES)},q=new URLSearchParams(location.search),m=a[(q.get("luz")||q.get("mood")||"").toLowerCase()],f="url";if(!m){f="chosen";try{var s=localStorage.getItem("${LIGHT_KEY}");if(s==="day"||s==="sunset"||s==="night")m=s}catch(e){}}if(!m){f="auto";var d=new Date(),t=d.getHours()*60+d.getMinutes();m=t>=${DAY}&&t<${SUNSET}?"day":t>=${SUNSET}&&t<${NIGHT}?"sunset":"night"}h.setAttribute("data-mood",m);h.setAttribute("data-mood-from",f)}catch(e){}})()`;

/* ─────────────── the visit's light, as a small store (client only) ─────────────── */

/**
 * `mood`: the light the room shows (the document's data-mood, what everything
 * laid over the photograph takes). `pending`: a light chosen whose photograph
 * is still loading; the room changes to it, all of it at once, when it has
 * (see StudioScene's Plates and commitLight).
 */
export type LightState = { choice: LightChoice; mood: Mood; pending: Mood | null };

let state: LightState | null = null;
const listeners = new Set<() => void>();

function readChoice(): LightChoice {
  try {
    const v = localStorage.getItem(LIGHT_KEY);
    return isMood(v) ? v : "auto";
  } catch {
    return "auto";
  }
}

/** The light now (as the head's script set it: if it did not run, the kept choice or the clock). */
export function lightState(): LightState {
  if (state) return state;
  const html = document.documentElement;
  const marked = html.getAttribute("data-mood");
  const from = html.getAttribute("data-mood-from");
  const kept = readChoice();
  const mood = isMood(marked) ? marked : kept === "auto" ? clockMood() : kept;
  html.setAttribute("data-mood", mood);
  // A light asked for in the address shows as chosen (for this load only; it is not kept).
  state = { choice: from === "url" ? mood : kept, mood, pending: null };
  return state;
}

/** Choose a light (or AUTO). A chosen light is kept; AUTO forgets it and reads the clock. */
export function chooseLight(choice: LightChoice) {
  try {
    if (choice === "auto") localStorage.removeItem(LIGHT_KEY);
    else localStorage.setItem(LIGHT_KEY, choice);
  } catch {
    // Storage refused (private mode): the choice still holds for this visit.
  }
  const mood = choice === "auto" ? clockMood() : choice;
  const cur = lightState();
  document.documentElement.setAttribute("data-mood-from", choice === "auto" ? "auto" : "chosen");
  const pending = mood === cur.mood ? null : mood;
  if (cur.choice === choice && cur.pending === pending) return;
  state = { ...cur, choice, pending };
  listeners.forEach((l) => l());
  // Should the room not be there to load it (it is drawn only once the page is ready), the light changes anyway.
  if (pending) setTimeout(() => commitLight(pending), 2500);
}

/** The chosen light's photograph is in: the room changes to it (everything together). */
export function commitLight(mood: Mood) {
  const cur = lightState();
  if (cur.pending !== mood) return;
  document.documentElement.setAttribute("data-mood", mood);
  state = { ...cur, mood, pending: null };
  listeners.forEach((l) => l());
}

export function subscribeLight(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** The room's photographs in a light. */
export const moodImages = (m: Mood) => ({
  plate: `/studio/moods/${m}/desk.webp`,
  wallAbove: `/studio/moods/${m}/wall-above.webp`,
  light: `/studio/moods/${m}/light.webp`,
});

/** How long the room takes to change from one light to another (ms). */
export const LIGHT_CHANGE_MS = 1000;

/**
 * How the things laid over the photograph take each light (the rest is CSS,
 * per <html data-mood>: see globals.css).
 */
export interface MoodLook {
  /** Around the photograph (only ever seen past its edges): the wall's tone above, the floor's below. */
  room: string;
  /**
   * Her name painted on the wall: its paint (multiplied into the wall, so the
   * window's bands and the leaves' shadows fall across it as they fall on the
   * wall), and how strongly it reads in the intro and at the desk.
   */
  name: { paint: string; intro: number; work: number };
  /** The shade that lies over the desk while the camera is up the wall, and the intro's falloff (an rgb triplet). */
  shade: string;
  /**
   * The cap's grade (a colour matrix over its frames, which were lit in a white
   * studio): the room's colour (multipliers), how much of it it takes against
   * the wall (intro) and on the desk, and its brightness there.
   */
  cap: { r: number; g: number; b: number; wall: number; desk: number; bright: number };
  /**
   * The telephone's grade (a CSS filter: the same functions in every light, so
   * it can change smoothly), and its shadow: which way it falls (1: to the
   * left, as drawn; -1: to the right) and how dark.
   */
  phone: { filter: string; shadowSide: 1 | -1; shadow: number };
  /** How strongly the work takes the desk's light where it lies (its light map; see deskLight). */
  print: number;
  /** Labels whose patch of desk is brighter than the room's ink allows (at night, the lamp's pool): set in dark ink. */
  darkLabels: string[];
}

export const LOOK: Record<Mood, MoodLook> = {
  day: {
    room: "linear-gradient(to bottom, #d9cfc4 0%, #e7ddd2 45%, #cdbcaa 70%, #b8a590 100%)",
    name: { paint: "#6f5f52", intro: 0.6, work: 0.34 },
    shade: "92, 70, 50",
    cap: { r: 1, g: 0.93, b: 0.86, wall: 0.55, desk: 0.8, bright: 1.03 },
    phone: { filter: "brightness(1.08) sepia(0) saturate(0.95) hue-rotate(0deg)", shadowSide: 1, shadow: 0.8 },
    print: 0.9,
    darkLabels: [],
  },
  sunset: {
    room: "linear-gradient(to bottom, #b9763b 0%, #d4914a 45%, #b87a44 70%, #8f5a31 100%)",
    name: { paint: "#7a3b17", intro: 0.58, work: 0.36 },
    shade: "90, 42, 14",
    cap: { r: 1, g: 0.74, b: 0.46, wall: 0.8, desk: 0.9, bright: 1.02 },
    phone: { filter: "brightness(1.02) sepia(0.35) saturate(1.5) hue-rotate(-8deg)", shadowSide: 1, shadow: 0.95 },
    print: 0.86,
    darkLabels: [],
  },
  night: {
    room: "linear-gradient(to bottom, #2c2a33 0%, #3a3440 45%, #4a3a30 70%, #2a211b 100%)",
    name: { paint: "#16131b", intro: 0.7, work: 0.46 },
    shade: "14, 12, 20",
    cap: { r: 0.95, g: 0.72, b: 0.55, wall: 0.95, desk: 1, bright: 0.66 },
    phone: { filter: "brightness(0.6) sepia(0.25) saturate(1.2) hue-rotate(0deg)", shadowSide: -1, shadow: 0.55 },
    print: 0.88,
    darkLabels: [],
  },
};
