"use client";

import { useEffect, useRef } from "react";
import { useFrameLoader } from "@/hooks/useFrameLoader";
import { RestPose, useIdleCursor } from "@/hooks/useIdleCursor";

/** Largest on-screen width of the cap canvas (the intro). HeroStage relies on it to land the cap. */
export const CAP_CANVAS_MAX_WIDTH = 800;

interface CapViewerProps {
  /** Rest on a pose instead of spinning freely (used on the studio desk). */
  rest?: RestPose | null;
  /** While resting: whether a touch starting at this point may turn the cap (default: any). */
  acceptTouch?: (x: number, y: number) => boolean;
}

/** Drawable: loaded and decoded, not broken. */
const usable = (img: HTMLImageElement | null | undefined): img is HTMLImageElement => !!img && img.complete && img.naturalWidth > 0;

/**
 * The frame to draw for `index`: itself, or if it failed to load the nearest
 * one that did (going round the loop, the earlier one first on a tie).
 */
function nearestFrame(frames: (HTMLImageElement | null)[], index: number) {
  const n = frames.length;
  for (let d = 0; d <= n / 2; d++) {
    const before = frames[(((index - d) % n) + n) % n];
    if (usable(before)) return before;
    const after = frames[(index + d) % n];
    if (usable(after)) return after;
  }
  return null;
}

export default function CapViewer({ rest = null, acceptTouch }: CapViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { loaded, progress, images, totalFrames } = useFrameLoader();

  const { redraw } = useIdleCursor(
    (index) => {
      if (!loaded || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      const img = nearestFrame(images.current, index);
      if (img) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    },
    { totalFrames, rest, acceptTouch }
  );

  useEffect(() => {
    if (loaded && canvasRef.current) {
      const img = nearestFrame(images.current, 0);
      if (img) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        // Paint the frame the rotation loop is already on, not frame 0.
        redraw();
      }
    }
  }, [loaded, images, redraw]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-medium tracking-widest text-[#191510]/50 uppercase">Loading Frames</p>
          <div className="w-48 h-1 bg-[#191510]/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#191510] transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        className={`w-full object-contain transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ maxWidth: CAP_CANVAS_MAX_WIDTH }}
      />
    </div>
  );
}
