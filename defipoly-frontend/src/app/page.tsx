'use client';

import { Board } from '@/components/Board';
import { Portfolio } from '@/components/Portfolio';
import { Leaderboard } from '@/components/Leaderboard';
import { LiveFeed } from '@/components/LiveFeed';
import { PropertyModal } from '@/components/property-modal';
import { FloatingCoinsModal } from '@/components/FloatingCoinsModal';
import { ProfileWallet } from '@/components/ProfileWallet';
import { MobileLayout } from '@/components/MobileLayout';
import { ClientOnly } from '@/components/ClientOnly';
import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameState } from '@/contexts/GameStateContext';
import { useRewards } from '@/contexts/RewardsContext';
import { getProfile, clearProfileCache } from '@/utils/profileStorage';
import { ClaimTestTokens } from '@/components/ClaimTestTokens';
import { SHOWCASE_SCENES, ShowcaseScene } from '@/utils/showcaseScenes';
import { ShowcaseMode, ShowcaseOverlay } from '@/components/3d/ShowcaseMode';

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
  const [isClient, setIsClient] = useState(false);
  const [sideColumnWidth, setSideColumnWidth] = useState(400);
  
  // Showcase mode state
  const [showcaseMode, setShowcaseMode] = useState(false);
  const [currentShowcaseScene, setCurrentShowcaseScene] = useState<ShowcaseScene | null>(null);
  const prevWalletConnected = useRef<boolean>(false);
  const hasStartedDemo = useRef(false);
  
  // Calculate scaleFactor based on side column width (from 0.7 to 1.0)
  const scaleFactor = Math.max(0.7, Math.min(1.0, sideColumnWidth / 400));

  // Mark as client-side after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for mobile and calculate column width
  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (!isClient) return;

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
  }, [isClient]);

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
      const handleProfileUpdate = async (event: Event) => {
        const customEvent = event as CustomEvent;
        const detail = customEvent.detail;
        
        // Use event data directly if available (no API call)
        if (detail?.wallet === publicKey.toString() && detail?.profilePicture !== undefined) {
          setProfilePicture(detail.profilePicture);
        } else if (!detail?.wallet || detail?.wallet === publicKey.toString()) {
          // Fallback: refetch (only if no data in event)
          try {
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

  // Showcase controller logic with smooth transitions - resets on each start
  useEffect(() => {
    if (!showcaseMode) {
      setCurrentShowcaseScene(null); // Reset scene when stopping
      return;
    }
    
    // Always start from the beginning (scene 0) when showcase mode starts
    let sceneIndex = 0;
    setCurrentShowcaseScene(SHOWCASE_SCENES[0] || null);
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    const scheduleNextScene = () => {
      const currentScene = SHOWCASE_SCENES[sceneIndex];
      if (!currentScene) return;
      
      timeoutId = setTimeout(() => {
        const nextIndex = (sceneIndex + 1) % SHOWCASE_SCENES.length;
        
        sceneIndex = nextIndex;
        const nextScene = SHOWCASE_SCENES[sceneIndex];
        
        // Use requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
          setCurrentShowcaseScene(nextScene || null);
          scheduleNextScene(); // Schedule the next transition
        });
      }, currentScene.duration * 1000);
    };
    
    // Start the scheduling chain
    scheduleNextScene();
    
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setCurrentShowcaseScene(null); // Ensure clean reset
    };
  }, [showcaseMode]);

  // Auto-exit showcase if user connects wallet (only on wallet connection change, not on showcase start)
  useEffect(() => {
    const isWalletConnected = !!publicKey;
    
    // Only exit if wallet was just connected (not already connected)
    if (showcaseMode && !prevWalletConnected.current && isWalletConnected) {
      setShowcaseMode(false);
      setCurrentShowcaseScene(null);
    }
    
    // Update previous wallet state
    prevWalletConnected.current = isWalletConnected;
  }, [showcaseMode, publicKey]);

  // Auto-start demo mode for unconnected desktop users
  useEffect(() => {
    if (!publicKey && !hasStartedDemo.current && !isMobile && isClient) {
      // Small delay to ensure smooth initial render
      const timer = setTimeout(() => {
        hasStartedDemo.current = true;
        setShowcaseMode(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [publicKey, isMobile, isClient]);

  // Showcase handlers
  const handleStartShowcase = () => {
    setShowcaseMode(true);
  };

  const handleExitShowcase = () => {
    setShowcaseMode(false);
    setCurrentShowcaseScene(null);
  };

  return (
    <ClientOnly fallback={<div className="h-screen bg-black" />}>
      {isMobile ? (
        <MobileLayout
          onSelectProperty={setSelectedProperty}
          selectedProperty={selectedProperty}
          onCloseProperty={() => setSelectedProperty(null)}
          profilePicture={profilePicture}
          cornerSquareStyle={cornerSquareStyle}
          customBoardBackground={customBoardBackground}
          customPropertyCardBackground={customPropertyCardBackground}
          customSceneBackground={customSceneBackground}
          themeCategory={themeCategory}
          showcaseMode={showcaseMode}
          currentShowcaseScene={currentShowcaseScene}
          onStartShowcase={handleStartShowcase}
          onExitShowcase={handleExitShowcase}
        />
      ) : (
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
                profilePicture={gameState.profile.profilePicture || profilePicture} 
                cornerSquareStyle={gameState.profile.cornerSquareStyle || cornerSquareStyle} 
                customBoardBackground={gameState.profile.customBoardBackground || customBoardBackground}
                custom3DPropertyTiles={gameState.profile.customPropertyCardBackground || customPropertyCardBackground} 
                customSceneBackground={gameState.profile.customSceneBackground || customSceneBackground}
                boardPresetId={gameState.profile.boardPresetId}
                tilePresetId={gameState.profile.tilePresetId}
                themeCategory={gameState.profile.themeCategory || themeCategory}
                writingStyle={gameState.profile.writingStyle || writingStyle}
                showcaseMode={showcaseMode}
                showcaseScene={currentShowcaseScene}
                onExitShowcase={handleExitShowcase}
                onStartShowcase={handleStartShowcase}
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

          {selectedProperty !== null && (
            <PropertyModal 
              propertyId={selectedProperty}
              onClose={() => setSelectedProperty(null)}
            />
          )}
                    
          <FloatingCoinsModal
            isOpen={showCoinModal}
            onClose={() => setShowCoinModal(false)}
            rewardsAmount={unclaimedRewards || 0}
          />

          {/* Showcase Overlay */}
          {showcaseMode && currentShowcaseScene && (
            <ShowcaseOverlay 
              currentScene={currentShowcaseScene} 
              onExit={handleExitShowcase} 
            />
          )}
        </div>
      )}
    </ClientOnly>
  );
}