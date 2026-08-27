import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "streamdown/styles.css";
import "./globals.css";

const plex_sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plex_mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Biblioteca Markdown | Raiz Educação",
  description: "Visualizador local e seguro de documentos Markdown publicados.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html className={`${plex_sans.variable} ${plex_mono.variable}`} lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
