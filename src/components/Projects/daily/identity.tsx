import { Archivo_Narrow, Newsreader } from "next/font/google";

/**
 * THE DAILY's publication identity, shared by the newspaper on the desk and
 * the open front page so both are visibly the same paper: a text face made
 * for news, a narrow grotesque for labels, and the masthead lockup.
 */

export const serif = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap", preload: false });
export const narrow = Archivo_Narrow({ subsets: ["latin"], weight: ["500", "600"], display: "swap", preload: false });

/**
 * The masthead: "THE" set small, tracked and turned on its side against a
 * large italic "Daily". Scales with `size` (the height of "Daily").
 */
export function DailyMark({ size, label = "The Daily" }: { size: number; label?: string }) {
  return (
    <span className="inline-flex items-stretch" style={{ fontSize: size }}>
      <span className="sr-only">{label}</span>
      <span
        aria-hidden
        className={`${narrow.className} font-semibold uppercase`}
        style={{ fontSize: "0.15em", letterSpacing: "0.34em", lineHeight: 1, writingMode: "vertical-rl", transform: "rotate(180deg)", margin: "0.3em 0.3em 0.02em 0", textAlign: "end" }}
      >
        The
      </span>
      <span aria-hidden className={`${serif.className} italic font-semibold whitespace-nowrap`} style={{ letterSpacing: "-0.035em", lineHeight: 0.84 }}>
        Daily
      </span>
    </span>
  );
}
