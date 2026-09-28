"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 92;
/**
 * The cap's frames, cleaned from the originals (source-assets/cap-frames) by
 * source-assets/derive-clean-frames.py: the whole cap as photographed (no
 * holes where the floor was keyed out: the face print's greys, the dark inside
 * seen through the back opening, the brim's edge), its edge freed of the white
 * studio matte, and a real, transparent contact shadow where the floor was.
 * /frames-grounded (their earlier derivation) is kept only as that script's
 * source for the shadow.
 */
const FRAMES_DIR = "/frames-clean";

/**
 * Preloads the cap's frames. Loading completes once every frame has settled,
 * loaded or failed; a frame that failed is `null` in `images`, so a missing
 * frame can neither hold the loader nor be drawn.
 */
export function useFrameLoader() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    let mounted = true;
    const images: (HTMLImageElement | null)[] = [];
    let count = 0;

    const settle = () => {
      count++;
      if (!mounted) return;
      setProgress(count / TOTAL_FRAMES);
      if (count === TOTAL_FRAMES) {
        imagesRef.current = images;
        setLoaded(true);
      }
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `${FRAMES_DIR}/frame-${String(i).padStart(2, "0")}.webp`;
      img.onload = settle;
      img.onerror = () => {
        images[i] = null;
        settle();
      };
      images.push(img);
    }

    return () => {
      mounted = false;
    };
  }, []);

  return { loaded, progress, images: imagesRef, totalFrames: TOTAL_FRAMES };
}
