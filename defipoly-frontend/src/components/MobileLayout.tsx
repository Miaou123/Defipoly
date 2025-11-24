'use client';

import React, { useState, useRef } from 'react';
import { MobileBoard } from './MobileBoard';
import { Portfolio } from './Portfolio';
import { Leaderboard } from './Leaderboard';
import { LiveFeed } from './LiveFeed';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { StyledWalletButton } from './StyledWalletButton';
import { useGameState } from '@/contexts/GameStateContext';
import { useRewards } from '@/hooks/useRewards';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useNotification } from '@/contexts/NotificationContext';

type TabType = 'board' | 'portfolio' | 'leaderboard' | 'feed';

interface MobileLayoutProps {
  onSelectProperty: (propertyId: number) => void;
  profilePicture: string | null;
  cornerSquareStyle: 'property' | 'profile';
}

function MobileRewardsCard() {
  const { connected, publicKey } = useWallet();
  const { unclaimedRewards, loading: rewardsLoading } = useRewards();
  const { claimRewards, loading: claimLoading } = useDefipoly();
  const { showSuccess, showError } = useNotification();
  const [claiming, setClaiming] = useState(false);
  const claimingRef = useRef(false);

  const handleClaimRewards = async () => {
    if (!connected || !publicKey || unclaimedRewards === 0 || claiming || claimingRef.current) return;
    
    claimingRef.current = true;
    setClaiming(true);
    
    try {
      const signature = await claimRewards();
      if (signature) {
        showSuccess('Rewards Claimed!', 'Successfully claimed rewards!', signature !== 'already-processed' ? signature : undefined);
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      showError('Claim Failed', 'Failed to claim rewards. Please try again.');
    } finally {
      setClaiming(false);
      claimingRef.current = false;
    }
  };

  if (!connected) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/30 backdrop-blur-lg rounded-xl border border-purple-500/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-purple-400 uppercase tracking-wider">Unclaimed Rewards</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white tabular-nums">
              {rewardsLoading ? '...' : unclaimedRewards.toLocaleString()}
            </span>
            <span className="text-sm text-cyan-400 font-bold">DEFI</span>
          </div>
        </div>
        <button
          onClick={handleClaimRewards}
          disabled={claiming || claimLoading || unclaimedRewards === 0}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-sm text-white shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          {claiming ? '⏳' : 'Collect'}
        </button>
      </div>
    </div>
  );
}

export function MobileLayout({ 
  onSelectProperty, 
  profilePicture, 
  cornerSquareStyle 
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const { publicKey, connected } = useWallet();
  const { profile } = useGameState();

  const tabs: { id: TabType; icon: string; label: string }[] = [
    { id: 'board', icon: '🎮', label: 'Board' },
    { id: 'portfolio', icon: '💼', label: 'Portfolio' },
    { id: 'leaderboard', icon: '🏆', label: 'Ranks' },
    { id: 'feed', icon: '📡', label: 'Feed' },
  ];

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-b from-purple-950/50 to-black">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-black/40 backdrop-blur-lg safe-area-top">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.svg" 
            alt="Defipoly" 
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-white text-lg">Defipoly</span>
        </div>
        
        <div className="flex items-center gap-2">
          {connected && publicKey ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden border-2 border-green-500/50">
                {profile?.profilePicture ? (
                  <img 
                    src={profile.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm">👤</span>
                )}
              </div>
              <div className="px-2 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
                <span className="text-green-400 text-xs font-medium">
                  {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </span>
              </div>
            </div>
          ) : (
            <StyledWalletButton variant="header" />
          )}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'board' && (
          <div className="h-full flex flex-col p-3 gap-3">
            {/* Rewards Card - Compact */}
            <div className="flex-shrink-0">
              <MobileRewardsCard />
            </div>
            
            {/* Board - Takes remaining space */}
            <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
              <MobileBoard 
                onSelectProperty={onSelectProperty}
                profilePicture={profilePicture}
                cornerSquareStyle={cornerSquareStyle}
              />
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="h-full overflow-hidden">
            <Portfolio onSelectProperty={onSelectProperty} />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="h-full overflow-hidden">
            <Leaderboard />
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="h-full overflow-hidden">
            <LiveFeed />
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="flex-shrink-0 flex border-t border-purple-500/20 bg-black/60 backdrop-blur-lg pb-safe">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${
              activeTab === tab.id 
                ? 'bg-purple-600/20 border-t-2 border-purple-500' 
                : 'border-t-2 border-transparent'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-[10px] font-medium ${
              activeTab === tab.id ? 'text-purple-300' : 'text-purple-500'
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}