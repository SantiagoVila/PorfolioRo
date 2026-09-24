"use client";

import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 92;

export function useFrameLoader() {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let mounted = true;
    const images: HTMLImageElement[] = [];
    let count = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/frames/frame-${String(i).padStart(2, "0")}.webp`;
      img.onload = () => {
        count++;
        if (mounted) {
          setProgress(count / TOTAL_FRAMES);
          if (count === TOTAL_FRAMES) {
            imagesRef.current = images;
            setLoaded(true);
          }
        }
      };
      img.onerror = () => {
        count++;
        if (mounted) setProgress(count / TOTAL_FRAMES);
      };
      images.push(img);
    }

    return () => {
      mounted = false;
    };
  }, []);

  return { loaded, progress, images: imagesRef, totalFrames: TOTAL_FRAMES };
}
