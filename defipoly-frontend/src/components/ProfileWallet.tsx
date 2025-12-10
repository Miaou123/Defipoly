'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/contexts/GameStateContext';
import { PointerArrowIcon, LoadingIcon, UserIcon } from './icons/UIIcons';

interface ProfileWalletProps {
  scaleFactor?: number;
}

export function ProfileWallet({ scaleFactor = 1 }: ProfileWalletProps) {
  const { connected, publicKey, disconnect } = useWallet();
  
  // Calculate scaled sizes
  const profilePicSize = Math.max(24, Math.round(40 * scaleFactor));
  const walletIconSize = Math.max(24, Math.round(40 * scaleFactor));
  const textSizeSmall = Math.max(10, Math.round(12 * scaleFactor));
  const textSizeMedium = Math.max(12, Math.round(14 * scaleFactor));
  const padding = Math.max(8, Math.round(16 * scaleFactor));
  const gap = Math.max(8, Math.round(12 * scaleFactor));
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Profile hint state
  const [showProfileHint, setShowProfileHint] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [arrowPosition, setArrowPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Use GameState instead of local storage
  const gameState = useGameState();
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if we should show the profile hint
  useEffect(() => {
    if (!mounted) return;
    
    const hasUsedSpectator = localStorage.getItem('hasUsedSpectator');
    const hasSeenProfileHint = localStorage.getItem('hasSeenProfileHint');
    
    // Show hint if: user has used spectator AND hasn't seen profile hint yet
    if (hasUsedSpectator && !hasSeenProfileHint && connected) {
      setShowProfileHint(true);
    }
  }, [mounted, connected]);

  // Update arrow position when hint is shown
  useEffect(() => {
    if (!showProfileHint || !profileButtonRef.current) return;
    
    const updatePosition = () => {
      const rect = profileButtonRef.current?.getBoundingClientRect();
      if (rect) {
        setArrowPosition({
          top: rect.top + rect.height / 2,
          left: rect.left - 32
        });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showProfileHint]);

  const dismissProfileHint = () => {
    localStorage.setItem('hasSeenProfileHint', 'true');
    setShowProfileHint(false);
    setArrowPosition(null);
  };

  const handleWalletClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const handleProfileClick = () => {
    if (showProfileHint) {
      dismissProfileHint();
    }
    if (connected) {
      router.push('/profile');
    }
  };

  if (!mounted) {
    return (
      <div className="bg-black/60 backdrop-blur-xl px-4 py-3 rounded-xl border border-purple-500/30 shadow-xl animate-pulse">
        <div className="h-10 bg-purple-500/20 rounded"></div>
      </div>
    );
  }

  if (!connected) {
    // Show only wallet connect button
    return (
      <button
        onClick={handleWalletClick}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-semibold transition-all flex items-center justify-center shadow-xl hover:shadow-purple-500/40 border border-purple-400/30"
        style={{ 
          padding: `${Math.round(padding * 0.75)}px ${padding}px`,
          gap: `${gap}px` 
        }}
      >
        <svg width={Math.round(20 * scaleFactor)} height={Math.round(20 * scaleFactor)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
          <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
        </svg>
        <span style={{ fontSize: `${textSizeMedium}px` }}>Connect Wallet</span>
      </button>
    );
  }

  // Connected state - integrated profile + wallet
  return (
    <>
      <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-xl overflow-hidden">
        {/* Profile Section - Clickable */}
        <button
          ref={profileButtonRef}
          onClick={handleProfileClick}
          className={`w-full hover:bg-purple-900/20 transition-all flex items-center text-left ${
            showProfileHint 
              ? 'bg-yellow-500/10 ring-2 ring-inset ring-yellow-400/50 shadow-[inset_0_0_15px_rgba(250,204,21,0.2)]' 
              : ''
          }`}
          style={{ 
            padding: `${Math.round(padding * 0.75)}px ${padding}px`,
            gap: `${gap}px` 
          }}
        >
          {/* Profile Picture */}
          <div 
            className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ width: profilePicSize, height: profilePicSize }}
          >
            {gameState.loading ? (
              <LoadingIcon size={12} className="text-yellow-400 animate-pulse" />
            ) : gameState.profile.profilePicture ? (
              <img 
                src={gameState.profile.profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon size={Math.round(20 * scaleFactor)} className="text-purple-300" />
            )}
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="text-purple-300" style={{ fontSize: `${textSizeSmall}px` }}>Profile</div>
            <div className="font-bold text-white truncate" style={{ fontSize: `${textSizeMedium}px` }}>
              {gameState.loading ? (
                'Loading...'
              ) : gameState.profile.username ? (
                gameState.profile.username
              ) : (
                'Set Username'
              )}
            </div>
          </div>

          {/* Arrow icon */}
          <svg className="text-purple-400" width={Math.round(16 * scaleFactor)} height={Math.round(16 * scaleFactor)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Divider */}
        <div className="h-px bg-purple-500/20"></div>

        {/* Wallet Section - Clickable */}
        <button
          onClick={handleWalletClick}
          className="w-full hover:bg-purple-900/20 transition-all flex items-center"
          style={{ 
            padding: `${Math.round(padding * 0.75)}px ${padding}px`,
            gap: `${gap}px` 
          }}
        >
          {/* Wallet Icon */}
          <div 
            className="rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0"
            style={{ width: walletIconSize, height: walletIconSize }}
          >
            <svg width={Math.round(20 * scaleFactor)} height={Math.round(20 * scaleFactor)} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-300">
              <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
              <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
            </svg>
          </div>

          {/* Wallet Address */}
          <div className="flex-1 text-left min-w-0">
            <div className="text-purple-300" style={{ fontSize: `${textSizeSmall}px` }}>Wallet</div>
            <div className="font-mono font-bold text-white truncate" style={{ fontSize: `${textSizeMedium}px` }}>
              {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
            </div>
          </div>

          {/* Connected Indicator */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-semibold" style={{ fontSize: `${textSizeSmall}px` }}>Connected</span>
          </div>
        </button>
      </div>

      {/* Portal arrow for profile hint */}
      {showProfileHint && arrowPosition && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed animate-bounce-x pointer-events-none"
          style={{ 
            top: arrowPosition.top, 
            left: arrowPosition.left,
            transform: 'translateY(-50%)',
            zIndex: 9999
          }}
        >
          <PointerArrowIcon className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
        </div>,
        document.body
      )}
    </>
  );
}