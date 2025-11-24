import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from '@/components/AppShell';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Defipoly - DeFi Monopoly Game",
  description: "A blockchain-based Monopoly game on Solana",
  icons: {
    icon: '/logo.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.className} min-h-screen bg-gradient-to-b from-gray-950 via-purple-950 to-gray-950`}
        suppressHydrationWarning
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}