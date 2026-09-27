import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// The one wording for search results and shared links.
const TITLE = "Rosario Medina — Fashion Design & Art Direction";
const DESCRIPTION = "Portfolio de Rosario Medina: diseño de indumentaria, styling, dirección de arte y producción editorial.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    locale: "es_AR",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Edge to edge on phones with rounded corners and notches: the scene fills the
// whole screen, and the header, the desk's words and the scroll cue keep clear
// of the insets themselves (env(safe-area-inset-*)).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

import Preloader from "@/components/Preloader";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--color-paper)] text-[var(--color-ink)] font-sans">
        <Preloader />
        {children}
      </body>
    </html>
  );
}
