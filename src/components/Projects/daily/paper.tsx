"use client";

import type { ReactNode } from "react";

/** The newspaper's type, shared with the newspaper on the desk. */
export { serif, narrow } from "./identity";

/** The archive paper the desk newspaper turns into during the opening transition. */
export const PAPER = "#fdfbf7";
export const INK = "#1f1b16";
/** Printed-photo dots, for the stories that are not leading. */
export const HALFTONE = "radial-gradient(circle, rgba(31,27,22,0.55) 0.8px, transparent 1.25px) 0 0 / 3px 3px";

/** Text with the source's **bold** emphasis. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

/**
 * Newsprint grain for the pages themselves: a small pre-rendered tile of ink
 * specks (public/daily/grain.png, 128px), drawn with normal blending. Cheaper
 * to paint than the SVG noise filter under a blend mode, which is reserved for
 * the brief moment the opening transition's own sheet is on screen.
 */
export function Grain({ opacity = 1 }: { opacity?: number }) {
  return <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url(/daily/grain.png)", backgroundSize: "128px 128px", opacity }} />;
}

export type Children = { children?: ReactNode };
