import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Rosario Medina — Diseño de indumentaria y accesorios",
  description:
    "Rosario Medina — diseño de indumentaria y accesorios hechos a mano en Rosario, Argentina.",
  openGraph: {
    type: "website",
    title: "Rosario Medina",
    description:
      "Diseño de indumentaria y accesorios hechos a mano en Rosario, Argentina.",
    locale: "es_AR",
  },
  twitter: {
    card: "summary",
    title: "Rosario Medina",
    description:
      "Diseño de indumentaria y accesorios hechos a mano en Rosario, Argentina.",
  },
};

import Preloader from "@/components/Preloader";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--color-paper)] text-[var(--color-ink)] font-sans">
        <Preloader />
        {children}
      </body>
    </html>
  );
}
