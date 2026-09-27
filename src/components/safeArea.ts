export type Insets = { top: number; right: number; bottom: number; left: number };

const NONE: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
let cached: Insets | null = null;
let listening = false;

/**
 * The screen's safe-area insets in CSS pixels: a phone's notch or Dynamic
 * Island, its rounded corners and home bar (the page runs edge to edge,
 * viewport-fit=cover). What env(safe-area-inset-*) gives CSS, for the layouts
 * computed in script. 0 almost everywhere; read once, and again after the
 * screen changes size (a phone turned sideways gains side insets).
 */
export function safeInsets(): Insets {
  if (typeof window === "undefined") return NONE;
  if (cached) return cached;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;" +
    "padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  cached = {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
  probe.remove();
  if (!listening) {
    listening = true;
    const reset = () => (cached = null);
    window.addEventListener("resize", reset);
    window.addEventListener("orientationchange", reset);
  }
  return cached;
}
