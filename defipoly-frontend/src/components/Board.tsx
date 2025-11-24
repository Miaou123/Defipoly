'use client';

import { useState, useEffect } from 'react';
import { PROPERTIES } from '@/utils/constants';
import { PropertyCard } from './PropertyCard';
import { RewardsPanel } from './RewardsPanel';
import { CornerSquare } from './BoardHelpers';
import { getBoardTheme, getPropertyCardTheme } from '@/utils/themes';
import { useGameState } from '@/contexts/GameStateContext';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
  spectatorMode?: boolean;
  spectatorWallet?: string;
  spectatorOwnerships?: any[];
  boardTheme?: string;
  propertyCardTheme?: string;
  profilePicture?: string | null;
  cornerSquareStyle?: 'property' | 'profile';
  customBoardBackground?: string | null;
  customPropertyCardBackground?: string | null;
}

export function Board({ 
  onSelectProperty, 
  spectatorMode = false, 
  spectatorWallet,
  spectatorOwnerships = [],
  boardTheme: spectatorBoardTheme,
  propertyCardTheme: spectatorPropertyTheme,
  profilePicture: spectatorProfilePic,
  cornerSquareStyle: spectatorCornerStyle,
  customBoardBackground: spectatorCustomBoard,
  customPropertyCardBackground: spectatorCustomCard,
}: BoardProps) {
  const [showRewardsPanel, setShowRewardsPanel] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('1 / 1');
  const [scaleFactor, setScaleFactor] = useState(1);
  
  // Get game state (includes profile for main mode)
  const gameState = useGameState();
  
  // ========== RESPONSIVE ASPECT RATIO & SCALE ==========
  useEffect(() => {
    const updateResponsive = () => {
      const width = window.innerWidth;
      if (width < 1200) {
        setAspectRatio('1 / 1.2');  // Taller cards on small screens
        setScaleFactor(0.7);         // Reduce text/icons by 30%
      } else if (width < 1400) {
        setAspectRatio('1 / 1.1');  // Slightly taller on medium screens
        setScaleFactor(0.85);        // Reduce text/icons by 15%
      } else {
        setAspectRatio('1 / 1');    // Square on large screens
        setScaleFactor(1);           // Full size
      }
    };
    
    updateResponsive();
    window.addEventListener('resize', updateResponsive);
    return () => window.removeEventListener('resize', updateResponsive);
  }, []);
  
  // ========== SMART THEME SELECTION ==========
  const boardTheme = spectatorMode 
    ? spectatorBoardTheme 
    : gameState.profile.boardTheme;
    
  const propertyCardTheme = spectatorMode 
    ? spectatorPropertyTheme 
    : gameState.profile.propertyCardTheme;
    
  const customBoardBackground = spectatorMode 
    ? spectatorCustomBoard 
    : gameState.profile.customBoardBackground;
    
  const customPropertyCardBackground = spectatorMode 
    ? spectatorCustomCard 
    : gameState.profile.customPropertyCardBackground;
    
  const profilePicture = spectatorMode 
    ? spectatorProfilePic 
    : gameState.profile.profilePicture;
    
  const cornerSquareStyle = spectatorMode 
    ? spectatorCornerStyle || 'property'
    : gameState.profile.cornerSquareStyle;
  
  // ========== GET THEME OBJECTS ==========
  const currentBoardTheme = getBoardTheme(boardTheme || 'dark');
  const currentPropertyCardTheme = getPropertyCardTheme(propertyCardTheme || 'dark');
  
  // Common PropertyCard props
  const cardProps = {
    onSelect: onSelectProperty,
    spectatorMode,
    spectatorWallet,
    spectatorOwnerships,
    theme: currentPropertyCardTheme,
    customPropertyCardBackground,
    scaleFactor, // Pass scale factor to cards
  };
  
  return (
      <div className="flex items-center justify-center w-full h-full relative">
        <div 
          className="w-full rounded-lg relative z-10 bg-gray-900"
          style={{
            aspectRatio: aspectRatio,
            maxWidth: 'min(100%, 100vh - 2rem)',
            maxHeight: '100%',
          }}
        >
        <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-0 relative z-10">
          
          {/* ========== TOP-LEFT CORNER ========== */}
          <div className="col-start-1 row-start-1">
            <CornerSquare icon="🎲" label="DEFIPOLY" bgColor="bg-purple-600" profilePicture={profilePicture} cornerSquareStyle={cornerSquareStyle} customPropertyCardBackground={customPropertyCardBackground} />
          </div>
          
          {/* ========== TOP ROW ========== */}
          <div className="col-start-2 row-start-1"><PropertyCard propertyId={11} {...cardProps} /></div>
          <div className="col-start-3 row-start-1"><PropertyCard propertyId={12} {...cardProps} /></div>
          <div className="col-start-4 row-start-1"><PropertyCard propertyId={13} {...cardProps} /></div>
          <div className="col-start-5 row-start-1"><PropertyCard propertyId={14} {...cardProps} /></div>
          <div className="col-start-6 row-start-1"><PropertyCard propertyId={15} {...cardProps} /></div>
          <div className="col-start-7 row-start-1"><PropertyCard propertyId={16} {...cardProps} /></div>

          {/* ========== LEFT SIDE ========== */}
          <div className="col-start-1 row-start-2"><PropertyCard propertyId={10} {...cardProps} /></div>
          <div className="col-start-1 row-start-3"><PropertyCard propertyId={9} {...cardProps} /></div>
          <div className="col-start-1 row-start-4"><PropertyCard propertyId={8} {...cardProps} /></div>
          <div className="col-start-1 row-start-5"><PropertyCard propertyId={7} {...cardProps} /></div>
          <div className="col-start-1 row-start-6"><PropertyCard propertyId={6} {...cardProps} /></div>

          {/* ========== CENTER: Rewards Panel ========== */}
          <div 
            className="col-start-2 col-span-5 row-start-2 row-span-5 flex flex-col items-center justify-center shadow-inner relative overflow-hidden"
            style={(() => {
              const hasCustomBackground = !!customBoardBackground;
              const backgroundImage = customBoardBackground;

              const styles: React.CSSProperties = {
                boxShadow: hasCustomBackground 
                  ? 'inset 0 0 40px rgba(0, 0, 0, 0.4)' 
                  : 'inset 0 0 60px rgba(139, 92, 246, 0.3)',
              };
              
              if (hasCustomBackground) {
                if (backgroundImage && backgroundImage.includes('url(') && backgroundImage.includes('center/cover')) {
                  styles.background = backgroundImage;
                } else if (backgroundImage) {
                  styles.backgroundImage = `url(${backgroundImage})`;
                  styles.backgroundSize = 'cover';
                  styles.backgroundPosition = 'center';
                  styles.backgroundRepeat = 'no-repeat';
                }
              } else {
                styles.background = 'linear-gradient(135deg, rgba(88, 28, 135, 0.6), rgba(109, 40, 217, 0.4))';
              }
              
              return styles;
            })()}
          >
            {!spectatorMode && (
              <button
                onClick={() => setShowRewardsPanel(!showRewardsPanel)}
                className="absolute top-2 right-2 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                title={showRewardsPanel ? 'Hide rewards panel' : 'Show rewards panel'}
              >
                {showRewardsPanel ? '👁️' : '👁️'}
              </button>
            )}

            {!spectatorMode && showRewardsPanel && (
              <div className="relative z-10">
                <RewardsPanel />
              </div>
            )}
          </div>

          {/* ========== RIGHT SIDE ========== */}
          <div className="col-start-7 row-start-2"><PropertyCard propertyId={17} {...cardProps} /></div>
          <div className="col-start-7 row-start-3"><PropertyCard propertyId={18} {...cardProps} /></div>
          <div className="col-start-7 row-start-4"><PropertyCard propertyId={19} {...cardProps} /></div>
          <div className="col-start-7 row-start-5"><PropertyCard propertyId={20} {...cardProps} /></div>
          <div className="col-start-7 row-start-6"><PropertyCard propertyId={21} {...cardProps} /></div>

          {/* ========== BOTTOM LEFT CORNER ========== */}
          <div className="col-start-1 row-start-7">
            <PropertyCard propertyId={5} {...cardProps} />
          </div>

          {/* ========== BOTTOM ROW ========== */}
          <div className="col-start-2 row-start-7"><PropertyCard propertyId={4} {...cardProps} /></div>
          <div className="col-start-3 row-start-7"><PropertyCard propertyId={3} {...cardProps} /></div>
          <div className="col-start-4 row-start-7"><PropertyCard propertyId={2} {...cardProps} /></div>
          <div className="col-start-5 row-start-7"><PropertyCard propertyId={1} {...cardProps} /></div>
          <div className="col-start-6 row-start-7"><PropertyCard propertyId={0} {...cardProps} /></div>
          
          {/* ========== BOTTOM-RIGHT CORNER ========== */}
          <div className="col-start-7 row-start-7">
            <CornerSquare icon="🎲" label="DEFIPOLY" bgColor="bg-purple-600" profilePicture={profilePicture} cornerSquareStyle={cornerSquareStyle} customPropertyCardBackground={customPropertyCardBackground} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .holographic-board {
          transition: box-shadow 0.5s ease-in-out;
        }

        .holographic-board:hover {
          box-shadow: 
            inset 0 0 120px rgba(147, 51, 234, 0.4), 
            0 0 80px rgba(147, 51, 234, 0.5),
            0 0 120px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </div>
  );
}