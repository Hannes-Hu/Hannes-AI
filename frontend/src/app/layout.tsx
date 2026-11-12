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
    "Stelle präzise Fragen zu deinen Dokumenten mit KI-gestützter Hybrid-Suche und exakten Quellenangaben.",
  keywords: ["RAG", "KI", "Dokumente", "PDF", "Enterprise"],
  authors: [{ name: "Hannes AI" }],
  robots: "noindex, nofollow", // Portfolio-Projekt
};

export const viewport: Viewport = {
  themeColor: "#020617",
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
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-slate-950 text-slate-200">
        {children}
      </body>
    </html>
  );
}
