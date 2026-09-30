import { Archivo_Narrow, Newsreader } from "next/font/google";

/**
 * EL DIARIO's publication identity, shared by the newspaper on the desk and
 * the open front page so both are visibly the same paper: a text face made
 * for news, a narrow grotesque for labels, and the masthead lockup.
 */

export const serif = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], display: "swap", preload: false });
export const narrow = Archivo_Narrow({ subsets: ["latin"], weight: ["500", "600"], display: "swap", preload: false });

/**
 * The masthead: "EL" set small, tracked and turned on its side against a
 * large italic "Diario". Scales with `size` (the height of "Diario").
 */
export function DailyMark({ size, label = "El Diario" }: { size: number; label?: string }) {
  return (
    <span className="inline-flex items-stretch" style={{ fontSize: size }}>
      <span className="sr-only">{label}</span>
      <span
        aria-hidden
        className={`${narrow.className} font-semibold uppercase`}
        style={{ fontSize: "0.17em", letterSpacing: "0.34em", lineHeight: 1, writingMode: "vertical-rl", transform: "rotate(180deg)", margin: "0.3em 0.28em 0.02em 0", textAlign: "end" }}
      >
        El
      </span>
      <span aria-hidden className={`${serif.className} italic font-semibold whitespace-nowrap`} style={{ letterSpacing: "-0.035em", lineHeight: 0.84 }}>
        Diario
      </span>
    </span>
  );
}
