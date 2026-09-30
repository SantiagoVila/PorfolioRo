"use client";

import { useEffect, useState } from "react";
import { MOODS, moodImages, type Mood } from "./mood";
import { quadPoint } from "./perspective";
import { STAGE_HEIGHT, STAGE_WIDTH, type DeskObject } from "./sceneLayout";

/**
 * The work lying on the desk takes the desk's own light: the window's bands
 * and the leaves' shadows by day and at sunset, the lamp's pool at night. The
 * light is a multiplier map of the photograph (public/studio/moods/<mood>/
 * light.webp, a quarter of the stage's size: see source-assets/
 * derive-desk-moods.py). Laid over a face in perspective, it has to be warped
 * into the face's own coordinates: each object gets a small texture sampled
 * through its own homography (its face and its edge at its foot), drawn once
 * per light and layout and kept. The object, its travelling double (when it is
 * opened) and its hover all carry the same texture in the same place.
 */

/** Texels across a texture (the light map is soft: this is plenty). */
const TEX_W = 40;

type Map = { data: Uint8ClampedArray; w: number; h: number };
const maps: Partial<Record<Mood, Promise<Map>>> = {};

function lightMap(m: Mood): Promise<Map> {
  return (maps[m] ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const g = c.getContext("2d", { willReadFrequently: true });
      if (!g) return reject(new Error("no canvas"));
      g.drawImage(img, 0, 0);
      resolve({ data: g.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height });
    };
    img.onerror = () => reject(new Error(`light map ${m}`));
    img.src = moodImages(m).light;
  }));
}

/** An object's thickness in its own px (the strip at its foot), from how tall it shows. */
export function edgeLocal(o: DeskObject) {
  const [[, y0], [, y1], [, y2], [, y3]] = o.quad;
  const faceH = (y2 + y3 - y0 - y1) / 2;
  return (o.edge * o.height) / faceH;
}

const done = new Map<string, string>();
const going = new Map<string, Promise<string>>();
const keyOf = (m: Mood, o: DeskObject) => `${m}|${o.id}|${o.quad.flat().map((v) => v.toFixed(1)).join(",")}`;

/** The light over an object's face and edge, in its own coordinates (a data URL), in a light. */
export function lightTexture(m: Mood, o: DeskObject): Promise<string> {
  const key = keyOf(m, o);
  const ready = done.get(key);
  if (ready) return Promise.resolve(ready);
  let p = going.get(key);
  if (p) return p;
  p = lightMap(m).then((map) => {
    const e = edgeLocal(o);
    const span = (o.height + e) / o.height; // v runs past the face, over its edge
    const texH = Math.max(8, Math.round((TEX_W * (o.height + e)) / o.width));
    const c = document.createElement("canvas");
    c.width = TEX_W;
    c.height = texH;
    const g = c.getContext("2d");
    if (!g) throw new Error("no canvas");
    const out = g.createImageData(TEX_W, texH);
    const sx = map.w / STAGE_WIDTH, sy = map.h / STAGE_HEIGHT;
    for (let j = 0; j < texH; j++) {
      for (let i = 0; i < TEX_W; i++) {
        const [x, y] = quadPoint(o.quad, (i + 0.5) / TEX_W, ((j + 0.5) / texH) * span);
        // Bilinear, in the map's px.
        const fx = Math.min(map.w - 1.001, Math.max(0, x * sx - 0.5));
        const fy = Math.min(map.h - 1.001, Math.max(0, y * sy - 0.5));
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = fx - x0, ty = fy - y0;
        const at = (xx: number, yy: number, ch: number) => map.data[(yy * map.w + xx) * 4 + ch];
        const o4 = (j * TEX_W + i) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const top = at(x0, y0, ch) * (1 - tx) + at(x0 + 1, y0, ch) * tx;
          const bot = at(x0, y0 + 1, ch) * (1 - tx) + at(x0 + 1, y0 + 1, ch) * tx;
          out.data[o4 + ch] = top * (1 - ty) + bot * ty;
        }
        out.data[o4 + 3] = 255;
      }
    }
    g.putImageData(out, 0, 0);
    const url = c.toDataURL("image/png");
    done.set(key, url);
    going.delete(key);
    return url;
  });
  going.set(key, p);
  return p;
}

/** The textures an object has, per light (those drawn so far). */
export function texturesFor(o: DeskObject): Partial<Record<Mood, string>> {
  const t: Partial<Record<Mood, string>> = {};
  for (const m of MOODS) {
    const url = done.get(keyOf(m, o));
    if (url) t[m] = url;
  }
  return t;
}

/**
 * An object's light textures: the current light's drawn at once, the other two
 * right after (small, and ready before anyone changes the light, so a change
 * cross-fades from the first frame).
 */
export function usePrintLight(o: DeskObject, mood: Mood | null): Partial<Record<Mood, string>> {
  const [tex, setTex] = useState(() => texturesFor(o));
  useEffect(() => {
    if (!mood) return;
    let live = true;
    const order = [mood, ...MOODS.filter((m) => m !== mood)];
    (async () => {
      for (const m of order) {
        try {
          await lightTexture(m, o);
        } catch {
          continue;
        }
        if (!live) return;
        setTex(texturesFor(o));
      }
    })();
    return () => {
      live = false;
    };
  }, [mood, o]);
  return tex;
}
