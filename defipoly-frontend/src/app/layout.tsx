import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { CSSLoadChecker } from "@/components/CSSLoadChecker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Memeopoly - DeFi Monopoly Game",
  description: "Play Monopoly on Solana blockchain",
  other: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.devnet.solana.com https://api.mainnet-beta.solana.com",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white h-screen overflow-hidden`}>
        {/* Glowing orbs */}
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        
        <Providers>
          <CSSLoadChecker />
          {children}
        </Providers>
      </body>
    </html>
  );
}