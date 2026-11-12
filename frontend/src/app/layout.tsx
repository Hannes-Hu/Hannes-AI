import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hannes AI — RAG-Plattform",
  description:
    "Präzise Frage-Antwort-Plattform mit lokaler Hybrid-Suche, Cross-Encoder Re-Ranking und exakter Quellenattribution.",
  keywords: ["RAG", "KI", "Dokumente", "PDF", "Search"],
  authors: [{ name: "Hannes AI" }],
  robots: "noindex, nofollow",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
