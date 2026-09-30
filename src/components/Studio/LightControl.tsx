"use client";

import { useRef, type KeyboardEvent } from "react";
import { chooseLight, type LightChoice } from "./mood";
import { useLight } from "./useMood";

const OPTIONS: { choice: LightChoice; glyph: string; label: string }[] = [
  { choice: "auto", glyph: "Auto", label: "Automatic light, by the time of day" },
  // (U+FE0E: the symbols as text, in the ink, never as emoji)
  { choice: "day", glyph: "☀︎", label: "Day" },
  { choice: "sunset", glyph: "◐︎", label: "Sunset" },
  { choice: "night", glyph: "☾︎", label: "Night" },
];

/** Symbols set in a face that has them, the same weight wherever the page is read. */
const SYMBOLS = '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols 2", "DejaVu Sans", sans-serif';

/**
 * The studio's light, chosen: AUTO (the visitor's clock), day, sunset or
 * night (see mood.ts). Set in the navigation's own type, after it, as a row of
 * four marks: the current one underlined like the navigation's current place;
 * under AUTO, a small dot marks the light the clock chose. A radio group: Tab
 * reaches the chosen mark, the arrow keys move along the row (and choose).
 */
export default function LightControl() {
  const light = useLight();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const current = light?.choice ?? "auto";

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + OPTIONS.length) % OPTIONS.length;
    chooseLight(OPTIONS[next].choice);
    buttons.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Studio light" lang="en" className="flex items-center gap-[18px]">
      {OPTIONS.map((o, i) => {
        const on = current === o.choice;
        const auto = current === "auto" && o.choice === light?.mood;
        return (
          <button
            key={o.choice}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            tabIndex={on ? 0 : -1}
            onClick={() => chooseLight(o.choice)}
            onKeyDown={(e) => onKey(e, i)}
            className={`group relative py-1 leading-none outline-none transition-opacity duration-300 after:absolute after:-inset-x-[9px] after:-inset-y-4 after:content-[''] focus-visible:ring-2 focus-visible:ring-[rgb(var(--scene-ink)/0.6)] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent ${on ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
          >
            <span
              aria-hidden
              className={o.choice === "auto" ? "text-[8px] min-[375px]:text-[9px] font-bold tracking-[0.3em] uppercase pl-[0.3em]" : "block text-[11px] min-[375px]:text-[12px]"}
              style={o.choice === "auto" ? undefined : { fontFamily: SYMBOLS }}
            >
              {o.glyph}
            </span>
            {/* The current choice, underlined as the navigation's current place is. */}
            <span
              aria-hidden
              className={`absolute left-0 right-0 -bottom-[3px] h-px bg-current origin-left transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${on ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
            />
            {/* Under AUTO: the light the clock chose. */}
            <span aria-hidden className={`absolute left-1/2 -bottom-[7px] -ml-[1.5px] h-[3px] w-[3px] rounded-full bg-current transition-opacity duration-500 ${auto ? "opacity-70" : "opacity-0"}`} />
          </button>
        );
      })}
    </div>
  );
}
