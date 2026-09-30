import { getImageProps } from "next/image";

/**
 * `sizes` of the cover when it fills the screen: the transition's fill and each
 * book's opening cover, so they are one and the same image (cached and decoded
 * before the hand-off). The book's face is 240×321: on screens narrower than
 * that it fills by height (75vh wide), otherwise by width.
 */
export const FILL_COVER_SIZES = "(max-aspect-ratio: 240/321) 75vh, 100vw";
/**
 * `sizes` of the cover while held up to the viewer (transition body): the same
 * image as the fill. Held, it is never wider than it is when it fills the
 * screen, and the fill's file is fetched for the hand-off anyway; a size of its
 * own only fetched and decoded a second, near-identical file of each cover (on
 * a phone, 2048 px beside the fill's 1920 px).
 */
export const HELD_COVER_SIZES = FILL_COVER_SIZES;

const warmed = new Set<string>();

/**
 * Fetch and decode the larger versions of the book covers ahead of time, with
 * the exact srcset/sizes the transition and the project hero use (same URLs,
 * so they are served from cache). Without this, a first-ever open fetches and
 * decodes those images mid-flight, which can stall the animation.
 */
export function warmCovers(srcs: string[]) {
  for (const src of srcs) {
    for (const sizes of new Set([HELD_COVER_SIZES, FILL_COVER_SIZES])) {
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
