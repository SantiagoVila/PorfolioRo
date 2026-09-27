"use client";

import { useSyncExternalStore } from "react";

/**
 * The moment the page is first seen: the preloader's curtain starts to lift.
 * The hero's entrance (her name, the cap, the navigation, the cues) is timed
 * from it, so it plays in view instead of behind the curtain.
 */
const EVENT = "rm:reveal";
/** Never wait longer than this for the curtain (it normally lifts at ~2.4 s). */
const FALLBACK_MS = 5000;

let revealed = false;

export function announceReveal() {
  if (revealed) return;
  revealed = true;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  const fallback = window.setTimeout(announceReveal, FALLBACK_MS);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.clearTimeout(fallback);
  };
}

/** Whether the page has been revealed (false on the server and until the curtain lifts). */
export function useRevealed() {
  return useSyncExternalStore(
    subscribe,
    () => revealed,
    () => false
  );
}
