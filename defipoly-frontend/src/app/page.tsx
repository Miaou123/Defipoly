'use client';

import { Board } from '@/components/Board';
import { RewardsPanel } from '@/components/RewardsPanel';
import { Portfolio } from '@/components/Portfolio';
import { Leaderboard } from '@/components/Leaderboard';
import { LiveFeed } from '@/components/LiveFeed';
import { PropertyModal } from '@/components/property-modal';
import { FloatingCoinsModal } from '@/components/FloatingCoinsModal';
import { ProfileWallet } from '@/components/ProfileWallet';
import { MobileLayout } from '@/components/MobileLayout';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameState } from '@/contexts/GameStateContext';
import { useRewards } from '@/contexts/RewardsContext';
import { getProfile, clearProfileCache } from '@/utils/profileStorage';
import { ClaimTestTokens } from '@/components/ClaimTestTokens';

export default function Home() {
  const { publicKey } = useWallet();
  const gameState = useGameState();
  const { unclaimedRewards } = useRewards();
  
  
  // Calculate tier count for modal
  const ACCUMULATION_TIERS = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000];
  const tierCount = ACCUMULATION_TIERS.filter(threshold => (unclaimedRewards || 0) >= threshold).length;
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [cornerSquareStyle, setCornerSquareStyle] = useState<'property' | 'profile'>('property');
  const [customBoardBackground, setCustomBoardBackground] = useState<string | null>(null);
  const [customPropertyCardBackground, setCustomPropertyCardBackground] = useState<string | null>(null);
  const [customSceneBackground, setCustomSceneBackground] = useState<string | null>(null);
  const [themeCategory, setThemeCategory] = useState<'dark' | 'medium' | 'light' | null>(null);
  const [writingStyle, setWritingStyle] = useState<'light' | 'dark'>('light');
  const [isMobile, setIsMobile] = useState(false);
  const [sideColumnWidth, setSideColumnWidth] = useState(400);
  
  // Calculate scaleFactor based on side column width (from 0.7 to 1.0)
  const scaleFactor = Math.max(0.7, Math.min(1.0, sideColumnWidth / 400));

  // Check for mobile and calculate column width
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      
      // Calculate side column width based on screen size
      if (width < 1200) {
        setSideColumnWidth(240);
      } else if (width < 1400) {
        setSideColumnWidth(280);
      } else if (width < 1600) {
        setSideColumnWidth(340);
      } else {
        setSideColumnWidth(400);
      }
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // Load profile picture
  useEffect(() => {
    if (publicKey) {
      // Clear cache to force fresh API call
      clearProfileCache(publicKey.toString());
      getProfile(publicKey.toString())
        .then(profile => {
          setProfilePicture(profile.profilePicture);
          setCornerSquareStyle(profile.cornerSquareStyle || 'property');
          setCustomBoardBackground(profile.customBoardBackground || null);
          setCustomPropertyCardBackground(profile.customPropertyCardBackground || null);
          setCustomSceneBackground(profile.customSceneBackground || null);
          setThemeCategory(profile.themeCategory || null);
          setWritingStyle(profile.writingStyle || 'light');
        })
        .catch(error => {
          console.error('Error loading profile:', error);
        });

      // Listen for profile updates
      const handleProfileUpdate = async () => {
        try {
          // Clear cache to force fresh API call
          clearProfileCache(publicKey.toString());
          const updatedProfile = await getProfile(publicKey.toString());
          setProfilePicture(updatedProfile.profilePicture);
          setCornerSquareStyle(updatedProfile.cornerSquareStyle || 'property');
          setCustomBoardBackground(updatedProfile.customBoardBackground || null);
          setCustomPropertyCardBackground(updatedProfile.customPropertyCardBackground || null);
          setCustomSceneBackground(updatedProfile.customSceneBackground || null);
          setThemeCategory(updatedProfile.themeCategory || null);
          setWritingStyle(updatedProfile.writingStyle || 'light');
        } catch (error) {
          console.error('Error updating profile:', error);
        }
      };

      window.addEventListener('storage', handleProfileUpdate);
      window.addEventListener('profileUpdated', handleProfileUpdate);

      return () => {
        window.removeEventListener('storage', handleProfileUpdate);
        window.removeEventListener('profileUpdated', handleProfileUpdate);
      };
    }
    return undefined;
  }, [publicKey]);

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <MobileLayout
          onSelectProperty={setSelectedProperty}
          profilePicture={profilePicture}
          cornerSquareStyle={cornerSquareStyle}
          customBoardBackground={customBoardBackground}
          customPropertyCardBackground={customPropertyCardBackground}
          customSceneBackground={customSceneBackground}
          themeCategory={themeCategory}
        />
        {selectedProperty !== null && (
          <PropertyModal 
            propertyId={selectedProperty}
            onClose={() => setSelectedProperty(null)}
          />
        )}
      </>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen overflow-hidden relative">
      {/* Main grid layout - fixed height, no scrolling */}
      <div 
        className="grid gap-2 p-4 h-full w-full mx-auto max-w-[1920px]"
        style={{
          gridTemplateColumns: `${sideColumnWidth}px 1fr ${sideColumnWidth}px`,
        }}
      >
      {/* LEFT COLUMN: Logo + Portfolio */}
      <div className="flex flex-col gap-2 overflow-hidden min-h-0">
        {/* Logo at top of left column */}
        <a 
          href="/"
          className="flex items-center gap-3 rounded-xl px-4 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img 
            src="/logo.svg" 
            alt="Defipoly Logo" 
            className="w-10 h-10 object-contain"
          />
          <h1 className="font-orbitron text-2xl font-bold text-white">
            Defipoly
          </h1>
        </a>
        
        {/* Test Tokens Claim (only shows for whitelisted wallets) */}
        <div className="flex-shrink-0">
          <ClaimTestTokens />
        </div>
        
        <div className="flex-1 overflow-hidden min-h-0">
          <Portfolio onSelectProperty={setSelectedProperty} scaleFactor={scaleFactor} />
        </div>
      </div>
        {/* CENTER: Board */}
        <div className="flex items-center justify-center overflow-hidden">
          <Board 
            onSelectProperty={setSelectedProperty} 
            onCoinClick={() => setShowCoinModal(true)}
            profilePicture={profilePicture} 
            cornerSquareStyle={cornerSquareStyle} 
            customBoardBackground={gameState.profile.customBoardBackground || customBoardBackground}
            custom3DPropertyTiles={gameState.profile.customPropertyCardBackground || customPropertyCardBackground} 
            customSceneBackground={gameState.profile.customSceneBackground || customSceneBackground}
            boardPresetId={gameState.profile.boardPresetId}
            tilePresetId={gameState.profile.tilePresetId}
            themeCategory={themeCategory}
            writingStyle={writingStyle}
          />
        </div>
        
        {/* RIGHT COLUMN: Profile/Wallet + Leaderboard + Live Feed */}
        <div className="flex flex-col gap-2 overflow-hidden min-h-0">
          {/* Profile & Wallet at top of right column */}
          <div className="flex-shrink-0">
            <ProfileWallet scaleFactor={scaleFactor} />
          </div>
          {/* Fixed height container - no scrolling */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
            {/* Leaderboard - 45% of space */}
            <div className="h-[45%] min-h-0 overflow-hidden">
              <Leaderboard scaleFactor={scaleFactor} />
            </div>
            
            {/* Live Feed - 55% of space */}
            <div className="h-[55%] min-h-0 overflow-hidden">
              <LiveFeed scaleFactor={scaleFactor} />
            </div>
          </div>
        </div>
      </div>

      <PropertyModal 
        propertyId={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
      
      <FloatingCoinsModal
        isOpen={showCoinModal}
        onClose={() => setShowCoinModal(false)}
        rewardsAmount={unclaimedRewards || 0}
      />
    </div>
  );
}