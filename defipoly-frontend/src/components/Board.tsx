'use client';

import { useState, useEffect, useCallback } from 'react';
import { PROPERTIES } from '@/utils/constants';
import { PropertyCard } from './PropertyCard';
import { RewardsPanel } from './RewardsPanel';
import { useGameState } from '@/contexts/GameStateContext';
import { IncomeFlowOverlay } from './IncomeFlowOverlay';

const DEFAULT_BACKGROUND = 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
  spectatorMode?: boolean;
  spectatorWallet?: string;
  spectatorOwnerships?: any[];
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
  profilePicture: spectatorProfilePic,
  cornerSquareStyle: spectatorCornerStyle,
  customBoardBackground: spectatorCustomBoard,
  customPropertyCardBackground: spectatorCustomCard,
}: BoardProps) {
  const [showRewardsPanel, setShowRewardsPanel] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('1 / 1');
  const [scaleFactor, setScaleFactor] = useState(1);
  const [lastIncomeArrived, setLastIncomeArrived] = useState<number | null>(null);
  
  // Get game state (includes profile for main mode)
  const gameState = useGameState();

  // Callback for when particles arrive at the bank
  const handleParticleArrive = useCallback((incomeValue: number) => {
    setLastIncomeArrived(incomeValue);
    setTimeout(() => setLastIncomeArrived(null), 50);
  }, []);

  // Reset after RewardsPanel processes it
  useEffect(() => {
    if (lastIncomeArrived !== null) {
      const timer = setTimeout(() => setLastIncomeArrived(null), 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [lastIncomeArrived]);
  
  // ========== RESPONSIVE ASPECT RATIO & SCALE ==========
  useEffect(() => {
    const updateResponsive = () => {
      const width = window.innerWidth;
      
      // Smooth continuous scaling based on width
      if (width < 1024) {
        // Mobile - handled separately
        setAspectRatio('1 / 1.2');
        setScaleFactor(0.5);
      } else if (width < 1600) {
        // Interpolate between 1024 and 1600
        const t = (width - 1024) / (1600 - 1024); // 0 to 1
        const scale = 0.5 + (t * 0.5); // 0.5 to 1.0
        setScaleFactor(scale);
        
        // Aspect ratio: interpolate from 1.2 to 1.0
        const aspectHeight = 1.2 - (t * 0.2); // 1.2 to 1.0
        setAspectRatio(`1 / ${aspectHeight.toFixed(2)}`);
      } else {
        setAspectRatio('1 / 1');
        setScaleFactor(1);
      }
    };
    
    updateResponsive();
    window.addEventListener('resize', updateResponsive);
    return () => window.removeEventListener('resize', updateResponsive);
  }, []);
  
  // ========== CUSTOM BACKGROUNDS ==========
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
  
  // Common PropertyCard props
  const cardProps = {
    onSelect: onSelectProperty,
    spectatorMode,
    spectatorWallet,
    spectatorOwnerships,
    customPropertyCardBackground,
    scaleFactor,
  };
  
  return (
      <div className="flex items-center justify-center w-full h-full relative">
        <div 
          className="w-full rounded-lg relative z-10 bg-gray-900"
          style={{
            aspectRatio: aspectRatio,
            maxWidth: 'min(100%, 100vh - 2rem)',
            maxHeight: 'calc(100% - 1rem)',
          }}
        >
        {!spectatorMode && <IncomeFlowOverlay onParticleArrive={handleParticleArrive} />}
        
        <div 
          className="w-full h-full grid gap-0 relative z-10"
          style={{ 
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
          }}
        >
          
          {/* ========== TOP-LEFT CORNER ========== */}
          <div className="col-start-1 row-start-1 h-full w-full">
            <PropertyCard propertyId={-1} onSelect={() => {}} isCorner cornerLabel="DEFIPOLY" customPropertyCardBackground={customPropertyCardBackground} scaleFactor={scaleFactor} />
          </div>
          
          {/* ========== TOP ROW ========== */}
          <div className="col-start-2 row-start-1 h-full w-full"><PropertyCard propertyId={11} {...cardProps} /></div>
          <div className="col-start-3 row-start-1 h-full w-full"><PropertyCard propertyId={12} {...cardProps} /></div>
          <div className="col-start-4 row-start-1 h-full w-full"><PropertyCard propertyId={13} {...cardProps} /></div>
          <div className="col-start-5 row-start-1 h-full w-full"><PropertyCard propertyId={14} {...cardProps} /></div>
          <div className="col-start-6 row-start-1 h-full w-full"><PropertyCard propertyId={15} {...cardProps} /></div>
          <div className="col-start-7 row-start-1 h-full w-full"><PropertyCard propertyId={16} {...cardProps} /></div>

          {/* ========== LEFT SIDE ========== */}
          <div className="col-start-1 row-start-2 h-full w-full"><PropertyCard propertyId={10} {...cardProps} /></div>
          <div className="col-start-1 row-start-3 h-full w-full"><PropertyCard propertyId={9} {...cardProps} /></div>
          <div className="col-start-1 row-start-4 h-full w-full"><PropertyCard propertyId={8} {...cardProps} /></div>
          <div className="col-start-1 row-start-5 h-full w-full"><PropertyCard propertyId={7} {...cardProps} /></div>
          <div className="col-start-1 row-start-6 h-full w-full"><PropertyCard propertyId={6} {...cardProps} /></div>

          {/* ========== CENTER: Rewards Panel ========== */}
          <div 
            className="col-start-2 col-span-5 row-start-2 row-span-5 flex flex-col items-center justify-center shadow-inner relative overflow-hidden"
            style={(() => {
              const hasCustomBackground = !!customBoardBackground;
              const backgroundImage = customBoardBackground;

              const styles: React.CSSProperties = {
                boxShadow: hasCustomBackground 
                  ? 'inset 0 0 40px rgba(0, 0, 0, 0.4)' 
                  : 'inset 0 0 40px rgba(0, 0, 0, 0.3)',
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
                styles.background = DEFAULT_BACKGROUND;
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
                <RewardsPanel incomeArrived={lastIncomeArrived} scaleFactor={scaleFactor} />
              </div>
            )}
          </div>

          {/* ========== RIGHT SIDE ========== */}
          <div className="col-start-7 row-start-2 h-full w-full"><PropertyCard propertyId={17} {...cardProps} /></div>
          <div className="col-start-7 row-start-3 h-full w-full"><PropertyCard propertyId={18} {...cardProps} /></div>
          <div className="col-start-7 row-start-4 h-full w-full"><PropertyCard propertyId={19} {...cardProps} /></div>
          <div className="col-start-7 row-start-5 h-full w-full"><PropertyCard propertyId={20} {...cardProps} /></div>
          <div className="col-start-7 row-start-6 h-full w-full"><PropertyCard propertyId={21} {...cardProps} /></div>

          {/* ========== BOTTOM LEFT CORNER ========== */}
          <div className="col-start-1 row-start-7 h-full w-full">
            <PropertyCard propertyId={5} {...cardProps} />
          </div>

          {/* ========== BOTTOM ROW ========== */}
          <div className="col-start-2 row-start-7 h-full w-full"><PropertyCard propertyId={4} {...cardProps} /></div>
          <div className="col-start-3 row-start-7 h-full w-full"><PropertyCard propertyId={3} {...cardProps} /></div>
          <div className="col-start-4 row-start-7 h-full w-full"><PropertyCard propertyId={2} {...cardProps} /></div>
          <div className="col-start-5 row-start-7 h-full w-full"><PropertyCard propertyId={1} {...cardProps} /></div>
          <div className="col-start-6 row-start-7 h-full w-full"><PropertyCard propertyId={0} {...cardProps} /></div>
          
          {/* ========== BOTTOM-RIGHT CORNER ========== */}
          <div className="col-start-7 row-start-7 h-full w-full">
            <PropertyCard propertyId={-1} onSelect={() => {}} isCorner cornerLabel="DEFIPOLY" customPropertyCardBackground={customPropertyCardBackground} scaleFactor={scaleFactor} />
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