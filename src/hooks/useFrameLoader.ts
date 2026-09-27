"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 92;
/**
 * The cap's frames with a real, transparent contact shadow. Derived from the
 * originals in /frames (unchanged), whose shadow is an opaque patch of the white
 * studio floor that shows as a pale disc on anything darker.
 */
const FRAMES_DIR = "/frames-grounded";

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
