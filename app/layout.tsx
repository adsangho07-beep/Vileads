import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vileads — Lead Generation SaaS pour l'Afrique",
  description:
    "Extrayez des prospects qualifiés depuis Google Maps, ciblez les métropoles africaines et générez des messages de prospection personnalisés par IA.",
  keywords: [
    "lead generation",
    "prospection",
    "Afrique",
    "Google Maps",
    "scraping",
    "IA",
    "SaaS",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
