'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { BriefcaseIcon, TrophyIcon, BroadcastIcon, UserIcon, LoadingIcon, WalletIcon, ChartUpIcon, ShieldIcon, BuildingIcon } from './icons/UIIcons';
import { PROPERTIES } from '@/utils/constants';
import { ShieldAllModal } from './ShieldAllModal';
import { MobilePropertyPanel } from './mobile/MobilePropertyPanel';
import { FloatingCoinsModal } from './FloatingCoinsModal';
import type { PropertyOwnership } from '@/types/accounts';
import { useRouter } from 'next/navigation';

interface OwnedProperty extends PropertyOwnership {
  propertyInfo: typeof PROPERTIES[0];
}

interface ShieldableProperty {
  propertyId: number;
  propertyInfo: typeof PROPERTIES[0];
  slotsOwned: number;
  shieldCost: number;
}

// Helper function to calculate daily income from price and yieldBps
const calculateDailyIncome = (price: number, yieldBps: number): number => {
  return Math.floor((price * yieldBps) / 10000);
};

type TabType = 'portfolio' | 'leaderboard' | 'feed';

interface MobileLayoutProps {
  onSelectProperty: (propertyId: number) => void;
  selectedProperty: number | null;
  onCloseProperty: () => void;
  profilePicture: string | null;
  cornerSquareStyle: 'property' | 'profile';
  customBoardBackground: string | null;
  customPropertyCardBackground: string | null;
  customSceneBackground: string | null;
  themeCategory: 'dark' | 'medium' | 'light' | null;
}

// New Mobile Stats Row component
function MobileStatsRow() {
  const { connected, publicKey } = useWallet();
  const { unclaimedRewards, loading: rewardsLoading } = useRewards();
  const { tokenBalance: balance, loading: balanceLoading } = useDefipoly();
  const { stats } = useGameState();

  if (!connected) return null;

  return (
    <div className="px-4 py-3 border-b border-purple-500/20">
      <div className="flex items-center justify-center">
        {/* Balance */}
        <div className="flex flex-col items-center flex-1">
          <div className="text-[10px] text-purple-300 uppercase tracking-wider mb-0.5">Balance</div>
          <div className="text-lg font-bold text-purple-200 tabular-nums">
            {balanceLoading ? '...' : balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-px h-8 bg-purple-400/30 mx-3"></div>
        
        {/* Unclaimed */}
        <div className="flex flex-col items-center flex-1">
          <div className="text-[10px] text-purple-300 uppercase tracking-wider mb-0.5">Unclaimed</div>
          <div className="text-lg font-bold text-white tabular-nums">
            {rewardsLoading ? '...' : unclaimedRewards >= 100 
              ? unclaimedRewards.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : unclaimedRewards.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-px h-8 bg-purple-400/30 mx-3"></div>
        
        {/* Daily */}
        <div className="flex flex-col items-center flex-1">
          <div className="text-[10px] text-purple-300 uppercase tracking-wider mb-0.5">Daily</div>
          <div className="text-lg font-bold text-green-400 tabular-nums">
            +{stats.dailyIncome > 0 ? stats.dailyIncome.toLocaleString() : '0'}
          </div>
        </div>
      </div>
    </div>
  );
}

// New Mobile Actions Row component (placeholder - removed functionality)
function MobileActionsRow({ onOpenShieldModal }: { onOpenShieldModal: (data: ShieldableProperty[]) => void }) {
  // This component is now empty since we removed both buttons
  return null;
}


export function MobileLayout({ 
  onSelectProperty,
  selectedProperty,
  onCloseProperty,
  profilePicture, 
  cornerSquareStyle,
  customBoardBackground,
  customPropertyCardBackground,
  customSceneBackground,
  themeCategory
}: MobileLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const { publicKey, connected } = useWallet();
  const { profile } = useGameState();
  const { unclaimedRewards } = useRewards();
  const { tokenBalance: balance } = useDefipoly();
  const [scaleFactor, setScaleFactor] = useState(1);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [panelHeight, setPanelHeight] = useState(80);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [showShieldAllModal, setShowShieldAllModal] = useState(false);
  const [shieldAllData, setShieldAllData] = useState<ShieldableProperty[]>([]);
  const router = useRouter();
  
  // Property modal swipe state
  const [modalStartY, setModalStartY] = useState<number | null>(null);
  const [modalTranslateY, setModalTranslateY] = useState(0);
  const [isModalSwiping, setIsModalSwiping] = useState(false);
  
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

  const tabs = [
    { id: 'portfolio' as TabType, icon: BriefcaseIcon, label: 'Portfolio' },
    { id: 'leaderboard' as TabType, icon: TrophyIcon, label: 'Ranks' },
    { id: 'feed' as TabType, icon: BroadcastIcon, label: 'Feed' },
  ];

  // Handle tab switching
  const handleTabSwitch = (tabId: TabType) => {
    setActiveTab(tabId);
    if (panelHeight < 300) setPanelHeight(300);
  };


  const handleTouchStart = (e: React.TouchEvent) => {
    const clientY = e.touches[0]?.clientY;
    if (clientY !== undefined) {
      setStartY(clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !startY) return;
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

  // Property modal touch handlers
  const handleModalTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setModalStartY(touch.clientY);
      setIsModalSwiping(true);
      setModalTranslateY(0);
    }
  };

  const handleModalTouchMove = (e: React.TouchEvent) => {
    if (!modalStartY || !isModalSwiping) return;
    
    const touch = e.touches[0];
    if (touch) {
      const deltaY = touch.clientY - modalStartY;
      // Only allow downward movement
      if (deltaY > 0) {
        setModalTranslateY(deltaY);
      }
    }
  };

  const handleModalTouchEnd = () => {
    if (!isModalSwiping) return;
    
    // Close modal if swiped down more than 150px
    if (modalTranslateY > 150) {
      onCloseProperty();
    }
    
    // Reset state
    setModalStartY(null);
    setModalTranslateY(0);
    setIsModalSwiping(false);
  };

  return (
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Mobile Header with Gradient Bar */}
      <div className="flex-shrink-0 z-20 bg-gradient-to-b from-purple-900/80 via-purple-800/40 to-transparent backdrop-blur-lg">
        {/* Header Row: Logo + Wallet */}
        <div className="flex items-center justify-between px-4 py-3 mt-4 safe-area-top">
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
            <button 
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center overflow-hidden border border-green-500/50">
                {profile?.profilePicture ? (
                  <img 
                    src={profile.profilePicture ?? undefined} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon size={12} className="text-purple-300" />
                )}
              </div>
              <span className="text-green-400 text-xs font-medium">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </span>
            </button>
          ) : (
              <StyledWalletButton variant="header" />
            )}
          </div>
        </div>

        {/* Stats Row: Plain centered text with dividers */}
        {connected && (
          <MobileStatsRow />
        )}

        {/* Buttons Row */}
        {connected && (
          <div className="px-4 pb-4">
            <MobileActionsRow 
              onOpenShieldModal={(data) => { 
                setShieldAllData(data); 
                setShowShieldAllModal(true); 
              }} 
            />
          </div>
        )}
      </div>

      {/* 3D Board - Full screen background */}
      <div className="absolute inset-0 pt-32">
        <div className="relative w-full h-full">
          
          {/* 3D Board */}
          <Board 
            onSelectProperty={onSelectProperty}
            onCoinClick={() => setShowCoinModal(true)}
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
        className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-purple-500/20 z-30 pb-safe"
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
              onClick={() => handleTabSwitch(tab.id)}
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
            <Portfolio onSelectProperty={onSelectProperty} scaleFactor={scaleFactor} isMobile={true} />
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard scaleFactor={scaleFactor} isMobile={true} />
          )}

          {activeTab === 'feed' && (
            <LiveFeed scaleFactor={scaleFactor} isMobile={true} />
          )}
        </div>
      </div>

      {/* Property Panel Overlay - same style as bottom panel but separate */}
      {selectedProperty !== null && (
        <div 
          className="absolute inset-0 z-40 flex items-end"
          onClick={(e) => {
            // Close when clicking outside the modal (on the backdrop)
            if (e.target === e.currentTarget) {
              onCloseProperty();
            }
          }}
        >
          <div 
            className="w-full h-[90vh] bg-black/90 backdrop-blur-lg border-t border-purple-500/20 transition-transform duration-300 ease-out"
            style={{
              transform: `translateY(${modalTranslateY}px)`,
            }}
            onTouchStart={handleModalTouchStart}
            onTouchMove={handleModalTouchMove}
            onTouchEnd={handleModalTouchEnd}
          >
            {/* Property Panel Content */}
            <div className="h-full">
              <MobilePropertyPanel 
                selectedProperty={selectedProperty}
                onSelectProperty={onSelectProperty}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Coins Modal */}
      <FloatingCoinsModal
        isOpen={showCoinModal}
        onClose={() => setShowCoinModal(false)}
        rewardsAmount={unclaimedRewards || 0}
      />

      {/* Shield All Modal */}
      {showShieldAllModal && (
        <ShieldAllModal
          ownedProperties={shieldAllData}
          balance={balance}
          onClose={() => setShowShieldAllModal(false)}
        />
      )}
    </div>
  );
}