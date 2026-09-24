import type { Box } from "../../useBox";
import { STORIES } from "../dailyContent";

/**
 * Where each story's photograph lands when it opens out of the newspaper, and
 * the colours of its way back. Kept apart from the stories themselves so the
 * front page can fly a photograph before the story's code has loaded.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Tone = { ink: string; paper: string };

const wide = (box: Box) => box.w / box.h >= 1.1 && box.w >= 900;

/** ARTLAB opens on its night photograph at full bleed. */
export const artlabHero = (box: Box): Rect => ({ x: 0, y: 0, w: box.w, h: box.h });
export const ARTLAB_TONE: Tone = { ink: "#ece6dc", paper: "rgba(12, 11, 10, 0.72)" };

/** arteba opens on its cover, the collage set left of centre. */
const collageAspect = STORIES.arteba.image.width / STORIES.arteba.image.height;
export const artebaHero = (box: Box): Rect => {
  if (wide(box)) {
    const h = box.h * 0.8;
    const w = h * collageAspect;
    return { x: box.w * 0.38 - w / 2, y: (box.h - h) / 2, w, h };
  }
  const w = box.w * 0.62;
  const h = w / collageAspect;
  return { x: (box.w - w) / 2, y: box.h * 0.2, w, h };
};
export const ARTEBA_TONE: Tone = { ink: "#26231f", paper: "rgba(248, 248, 247, 0.85)" };

/** EXPLORERS opens with its photograph filling the right half (the top, on narrow screens). */
export const explorersHero = (box: Box): Rect =>
  wide(box) ? { x: box.w * 0.5, y: 0, w: box.w * 0.5, h: box.h } : { x: 0, y: 0, w: box.w, h: Math.round(box.h * 0.52) };
export const EXPLORERS_TONE: Tone = { ink: "rgb(92, 110, 126)", paper: "rgba(244, 243, 241, 0.85)" };

export const isWide = wide;
