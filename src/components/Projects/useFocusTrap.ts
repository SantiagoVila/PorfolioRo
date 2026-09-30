"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], area[href], button, input, select, textarea, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]';

/** Elements Tab can reach inside `root`, in order: not disabled, not inert, not hidden, not tabindex=-1. */
function tabbable(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => {
    if (el.tabIndex < 0 || el.hasAttribute("disabled") || el.closest("[inert]")) return false;
    if (!el.getClientRects().length) return false; // display: none, or `hidden`
    return getComputedStyle(el).visibility !== "hidden";
  });
}

/**
 * Keeps Tab and Shift+Tab inside `ref` while `active` (a modal dialog): past
 * the last control focus wraps to the first and back, instead of leaving for
 * the page behind or the browser's own controls. Whatever is inert inside the
 * dialog (EL DIARIO's front page under an open story) is skipped.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const root = ref.current;
      if (e.key !== "Tab" || !root) return;
      const items = tabbable(root);
      const current = document.activeElement as HTMLElement | null;
      const inside = !!current && root.contains(current);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      // Focus may sit on something Tab itself would not stop at (a scroller
      // focused by script): wrap if nothing tabbable lies ahead of it.
      const follows = (a: Node, b: Node) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
      const atEnd = !!current && (e.shiftKey ? !follows(first, current) || current === first : !follows(current, last) || current === last);
      if (!inside || atEnd) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [ref, active]);
}
