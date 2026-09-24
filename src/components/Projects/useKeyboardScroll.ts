"use client";

import { useEffect, type RefObject } from "react";

/**
 * Keyboard scrolling of an experience's own scroll container while focus sits
 * outside it (on the shell's back button, where it lands when a project
 * opens): arrows, Page Up/Down, Home/End and, where the project wants it,
 * Space / Shift+Space (never while a button or link has focus: Space presses
 * it). Keys the scroller receives itself are left to it.
 */
export function useKeyboardScroll(scroller: RefObject<HTMLElement | null>, h: number, { space = false } = {}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = scroller.current;
      if (!el || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const active = document.activeElement;
      if (active && el.contains(active)) return; // the scroller handles its own keys
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      // A focused control keeps its own Space (activation), as Enter always does.
      if (e.key === " " && active?.closest("button, a[href], summary, [role=button], [role=link], [role=checkbox], [role=switch], select")) return;
      const step: Record<string, number> = {
        ArrowDown: 60, ArrowUp: -60, PageDown: h * 0.9, PageUp: -h * 0.9,
        Home: -el.scrollHeight, End: el.scrollHeight,
        ...(space ? { " ": h * 0.9 } : {}),
      };
      if (!(e.key in step)) return;
      e.preventDefault();
      el.scrollBy({ top: e.key === " " && e.shiftKey ? -step[" "] : step[e.key], behavior: "auto" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scroller, h, space]);
}
