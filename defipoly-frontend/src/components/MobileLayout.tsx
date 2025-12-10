'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Board } from './Board';
import { Portfolio } from './Portfolio';
import { Leaderboard } from './Leaderboard';
import { LiveFeed } from './LiveFeed';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { StyledWalletButton } from './StyledWalletButton';
import { useGameState } from '@/contexts/GameStateContext';
import { useRewards } from '@/contexts/RewardsContext';
import { useDefipoly } from '@/contexts/DefipolyContext';
import { useNotification } from '@/contexts/NotificationContext';
import { BriefcaseIcon, TrophyIcon, BroadcastIcon, UserIcon, LoadingIcon } from './icons/UIIcons';

type TabType = 'board' | 'portfolio' | 'leaderboard' | 'feed';

interface MobileLayoutProps {
  onSelectProperty: (propertyId: number) => void;
  profilePicture: string | null;
  cornerSquareStyle: 'property' | 'profile';
  customBoardBackground: string | null;
  customPropertyCardBackground: string | null;
  customSceneBackground: string | null;
  themeCategory: 'dark' | 'medium' | 'light' | null;
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
      
      const errorMessage = String(error instanceof Error ? error.message : error);
      if (errorMessage.includes('User rejected') || errorMessage.includes('rejected the request')) {
        // User canceled the transaction - don't show an error
        console.log('User canceled the claim transaction');
      } else {
        showError('Claim Failed', 'Failed to claim rewards. Please try again.');
      }
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
          </div>
        </div>
        <button
          onClick={handleClaimRewards}
          disabled={claiming || claimLoading || unclaimedRewards === 0}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-sm text-white shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          {claiming ? <LoadingIcon size={16} className="text-yellow-400 animate-pulse" /> : 'Collect'}
        </button>
      </div>
    </div>
  );
}

export function MobileLayout({ 
  onSelectProperty, 
  profilePicture, 
  cornerSquareStyle,
  customBoardBackground,
  customPropertyCardBackground,
  customSceneBackground,
  themeCategory
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const { publicKey, connected } = useWallet();
  const { profile } = useGameState();
  const [scaleFactor, setScaleFactor] = useState(1);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300); // Initial height of bottom panel
  
  // Calculate scaleFactor based on screen width for mobile
  useEffect(() => {
    const updateScaleFactor = () => {
      const width = window.innerWidth;
      // Scale from 0.7 to 1.0 based on mobile screen width (320px to 480px+)
      const factor = Math.max(0.7, Math.min(1.0, (width - 320) / (480 - 320) * 0.3 + 0.7));
      setScaleFactor(factor);
    };
    
    updateScaleFactor();
    window.addEventListener('resize', updateScaleFactor);
    return () => window.removeEventListener('resize', updateScaleFactor);
  }, []);

  const tabs: { id: TabType; icon: React.FC<{size?: number; className?: string}>; label: string }[] = [
    { id: 'portfolio', icon: BriefcaseIcon, label: 'Portfolio' },
    { id: 'leaderboard', icon: TrophyIcon, label: 'Ranks' },
    { id: 'feed', icon: BroadcastIcon, label: 'Feed' },
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTab === 'board') return;
    const clientY = e.touches[0]?.clientY;
    if (clientY !== undefined) {
      setStartY(clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !startY || activeTab === 'board') return;
    const currentY = e.touches[0]?.clientY;
    if (!currentY) return;
    const diff = startY - currentY;
    setPanelHeight(Math.max(100, Math.min(window.innerHeight - 200, 300 + diff)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setStartY(null);
    setCurrentY(null);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-b from-purple-950/50 to-black relative overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-black/40 backdrop-blur-lg safe-area-top z-20">
        <div className="flex items-center gap-2">
          <img 
            src="/logo.svg" 
            alt="Defipoly" 
            className="w-8 h-8 object-contain"
          />
          <span className="font-orbitron font-bold text-white text-lg">Defipoly</span>
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
                  <UserIcon size={14} className="text-purple-300" />
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

      {/* 3D Board - Full screen background */}
      <div className="absolute inset-0 top-[72px] bottom-0">
        <div className="relative w-full h-full">
          {/* Compact Rewards Bar - Fixed position at top */}
          <div className="absolute top-3 left-3 right-3 z-10">
            <MobileRewardsCard />
          </div>
          
          {/* 3D Board */}
          <Board 
            onSelectProperty={onSelectProperty}
            profilePicture={profilePicture}
            cornerSquareStyle={cornerSquareStyle}
            customBoardBackground={customBoardBackground}
            custom3DPropertyTiles={customPropertyCardBackground}
            customSceneBackground={customSceneBackground}
            themeCategory={themeCategory}
            isMobile={true}
          />
        </div>
      </div>

      {/* Swipeable Bottom Panel */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-purple-500/20 z-30"
        style={{ height: `${panelHeight}px` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 bg-purple-500/60 rounded-full"></div>
        </div>
        
        {/* Tab Navigation */}
        <nav className="flex border-b border-purple-500/20 bg-black/40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id 
                  ? 'bg-purple-600/20 border-b-2 border-purple-500' 
                  : 'border-b-2 border-transparent'
              }`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'text-purple-300' : 'text-purple-500'} />
              <span className={`text-[9px] font-medium ${
                activeTab === tab.id ? 'text-purple-300' : 'text-purple-500'
              }`}>
                {tab.label}
              </span>
            </button>
          ))}
        </nav>
        
        {/* Panel Content */}
        <div className="flex-1 overflow-hidden" style={{ height: `${panelHeight - 80}px` }}>
          {activeTab === 'portfolio' && (
            <Portfolio onSelectProperty={onSelectProperty} scaleFactor={scaleFactor} />
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard scaleFactor={scaleFactor} />
          )}

          {activeTab === 'feed' && (
            <LiveFeed scaleFactor={scaleFactor} />
          )}
        </div>
      </div>
    </div>
  );
}