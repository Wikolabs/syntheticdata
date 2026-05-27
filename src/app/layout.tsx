import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "SyntheticData — Donnees d'entrainement illimitees et conformes RGPD",
  description: "Generation de donnees synthetiques statistiquement fideles — entrainez vos modeles sans exposer vos donnees sensibles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={${spaceGrotesk.variable} ${inter.variable}}>
      <body style={{ fontFamily: "var(--font-body)", background: "#ecfeff" }}>{children}</body>
    </html>
  );
}