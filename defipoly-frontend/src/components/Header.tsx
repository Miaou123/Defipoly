'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useEffect, useState } from 'react';

export function Header() {
  const { connected, publicKey } = useWallet();
  const { tokenBalance } = useDefipoly();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="bg-black/60 backdrop-blur-xl border-b border-purple-500/30 sticky top-0 z-50">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎲</div>
            <div>
              <h1 className="text-xl font-bold text-purple-100">Defipoly</h1>
              <p className="text-xs text-purple-400">DeFi Monopoly on Solana</p>
            </div>
          </div>
          <div className="w-32 h-10 bg-purple-900/20 rounded-lg animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-black/60 backdrop-blur-xl border-b border-purple-500/30 sticky top-0 z-50">
      <div className="w-full px-6 py-4 flex justify-between items-center">
        {/* Left side - Logo */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎲</div>
          <div>
            <h1 className="text-xl font-bold text-purple-100">Defipoly</h1>
            <p className="text-xs text-purple-400">DeFi Monopoly on Solana</p>
          </div>
        </div>

        {/* Right side - Balance & Wallet */}
        <div className="flex items-center gap-4">
          {connected && (
            <div className="bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-500/30">
              <div className="text-xs text-purple-300">Balance</div>
              <div className="text-sm font-bold text-purple-100">{tokenBalance.toLocaleString()} DEFI</div>
            </div>
          )}
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}