'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useEffect, useState } from 'react';

export function Header() {
  const { connected, publicKey } = useWallet();
  const { tokenBalance } = useDefipoly();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-xl border-b border-purple-500/30 px-8 py-4 sticky top-0 z-50">
      <div className="flex justify-between items-center max-w-[1900px] mx-auto">
        <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          MEMEOPOLY
        </div>
        
        <div className="flex items-center gap-4">
          {mounted && connected && publicKey ? (
            <>
              <div className="text-sm text-purple-300">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </div>
              <div className="text-lg font-semibold text-purple-400">
                {tokenBalance.toLocaleString()} MEME
              </div>
            </>
          ) : null}
          {mounted && <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-purple-800 hover:!from-purple-500 hover:!to-purple-700 !rounded-lg !transition-all !duration-300 hover:!shadow-lg hover:!shadow-purple-500/40" />}
        </div>
      </div>
    </div>
  );
}