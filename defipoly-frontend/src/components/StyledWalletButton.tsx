// ============================================
// FILE: defipoly-frontend/src/components/StyledWalletButton.tsx
// Custom wallet button styled to match Memeopoly design
// ============================================
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Wallet } from 'lucide-react';

interface StyledWalletButtonProps {
  variant?: 'header' | 'board' | 'modal';
}

export function StyledWalletButton({ variant = 'header' }: StyledWalletButtonProps) {
  const { connected, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  // Show loading skeleton until mounted to prevent hydration mismatch
  if (!mounted) {
    if (variant === 'board') {
      return (
        <div className="px-10 py-5 bg-purple-500/20 rounded-2xl animate-pulse">
          <div className="w-64 h-16 bg-purple-500/30 rounded-xl"></div>
        </div>
      );
    }
    if (variant === 'modal') {
      return (
        <div className="px-8 py-4 bg-purple-500/20 rounded-xl animate-pulse">
          <div className="w-48 h-12 bg-purple-500/30 rounded-lg"></div>
        </div>
      );
    }
    // Header variant
    return (
      <div className="px-5 py-2.5 bg-purple-500/20 rounded-lg animate-pulse">
        <div className="w-28 h-6 bg-purple-500/30 rounded"></div>
      </div>
    );
  }

  if (variant === 'board') {
    // Large prominent button for board center
    return (
      <button
        onClick={handleClick}
        className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-500 hover:via-purple-400 hover:to-pink-400 rounded-2xl font-black text-white text-xl transition-all duration-300 flex items-center gap-4 shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 border-2 border-purple-400/30"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
        <Wallet size={28} className="group-hover:rotate-12 transition-transform relative z-10" />
        <span className="relative z-10">
          {connected ? 'Disconnect Wallet' : 'Connect Wallet'}
        </span>
      </button>
    );
  }

  if (variant === 'modal') {
    // Medium button for modals
    return (
      <button
        onClick={handleClick}
        className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-bold text-white text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-purple-500/50 transform hover:scale-105 border border-purple-400/30"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
        <Wallet size={24} className="group-hover:rotate-12 transition-transform relative z-10" />
        <span className="relative z-10">
          {connected ? 'Disconnect Wallet' : 'Connect Wallet'}
        </span>
      </button>
    );
  }

  // Compact button for header
  if (connected && publicKey) {
    return (
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-lg hover:shadow-purple-500/40 border border-purple-400/30"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="hidden sm:inline">
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </span>
        <Wallet size={16} className="sm:hidden" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-lg hover:shadow-purple-500/40 border border-purple-400/30"
    >
      <Wallet size={16} />
      <span className="hidden sm:inline">Connect Wallet</span>
    </button>
  );
}