import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import { PropertyRefreshProvider } from '@/components/PropertyRefreshContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Memeopoly - DeFi Monopoly Game",
  description: "Play Monopoly on Solana blockchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white min-h-screen overflow-x-hidden`}>
        <WalletContextProvider>
          <NotificationProvider>
            <PropertyRefreshProvider>
              {children}
            </PropertyRefreshProvider>
          </NotificationProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}