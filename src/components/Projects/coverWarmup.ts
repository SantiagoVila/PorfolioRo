import { getImageProps } from "next/image";

/** `sizes` of the cover while held up to the viewer (transition body). */
export const HELD_COVER_SIZES = "80vh";
/** `sizes` of the cover when it fills the screen (transition fill + project hero). */
export const FILL_COVER_SIZES = "100vw";

const warmed = new Set<string>();

/**
 * Fetch and decode the larger versions of the book covers ahead of time, with
 * the exact srcset/sizes the transition and the project hero use (same URLs,
 * so they are served from cache). Without this, a first-ever open fetches and
 * decodes those images mid-flight, which can stall the animation.
 */
export function warmCovers(srcs: string[]) {
  for (const src of srcs) {
    for (const sizes of [HELD_COVER_SIZES, FILL_COVER_SIZES]) {
      const key = `${src}|${sizes}`;
      if (warmed.has(key)) continue;
      warmed.add(key);
      const { props } = getImageProps({ src, alt: "", fill: true, sizes });
      const img = new Image();
      img.decoding = "async";
      if (props.sizes) img.sizes = props.sizes;
      if (props.srcSet) img.srcset = props.srcSet;
      img.src = props.src;
      img.decode().catch(() => undefined);
    }
  }
}
