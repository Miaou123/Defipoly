'use client';

import { PROPERTIES } from '@/utils/constants';
import { PropertyCard } from './PropertyCard';
import { CornerSquare } from './BoardHelpers';
import { getBoardTheme, getPropertyCardTheme } from '@/utils/themes';
import { useGameState } from '@/contexts/GameStateContext';

interface MobileBoardProps {
  onSelectProperty: (propertyId: number) => void;
  spectatorMode?: boolean;
  spectatorWallet?: string;
  spectatorOwnerships?: any[];
  profilePicture?: string | null;
  cornerSquareStyle?: 'property' | 'profile';
}

export function MobileBoard({ 
  onSelectProperty, 
  spectatorMode = false, 
  spectatorWallet,
  spectatorOwnerships = [],
  profilePicture: spectatorProfilePic,
  cornerSquareStyle: spectatorCornerStyle,
}: MobileBoardProps) {
  const gameState = useGameState();
  
  const customBoardBackground = spectatorMode 
    ? null 
    : gameState.profile.customBoardBackground;
    
  const customPropertyCardBackground = spectatorMode 
    ? null 
    : gameState.profile.customPropertyCardBackground;
    
  const profilePicture = spectatorMode 
    ? spectatorProfilePic 
    : gameState.profile.profilePicture;
    
  const cornerSquareStyle = spectatorMode 
    ? spectatorCornerStyle || 'property'
    : gameState.profile.cornerSquareStyle;

  const propertyCardTheme = spectatorMode 
    ? 'dark' 
    : gameState.profile.propertyCardTheme;
  
  const currentPropertyCardTheme = getPropertyCardTheme(propertyCardTheme || 'dark');
  
  // Common props for PropertyCard
  const cardProps = {
    onSelect: onSelectProperty,
    spectatorMode,
    spectatorWallet,
    spectatorOwnerships,
    theme: currentPropertyCardTheme,
    customPropertyCardBackground,
    compact: true, // Mobile-optimized sizing
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-1">
      {/* Board - slightly taller than wide for 1.2x card height */}
      <div 
        className="rounded-lg bg-gray-900"
        style={{
          width: '100%',
          maxWidth: '100vw',
          aspectRatio: '1 / 1.15', // Makes cards ~1.15x taller uniformly
          maxHeight: '100%',
        }}
      >
        {/* Simple equal 7x7 grid - all cells same size */}
        <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-[1px]">
          {/* ========== ROW 1: Top row ========== */}
          <CornerSquare icon="🎲" label="DEFI" bgColor="bg-purple-600" profilePicture={profilePicture} cornerSquareStyle={cornerSquareStyle} customPropertyCardBackground={customPropertyCardBackground} />
          <PropertyCard propertyId={11} {...cardProps} />
          <PropertyCard propertyId={12} {...cardProps} />
          <PropertyCard propertyId={13} {...cardProps} />
          <PropertyCard propertyId={14} {...cardProps} />
          <PropertyCard propertyId={15} {...cardProps} />
          <PropertyCard propertyId={16} {...cardProps} />

          {/* ========== ROW 2 ========== */}
          <PropertyCard propertyId={10} {...cardProps} />
          <div 
            className="col-span-5 row-span-5 flex items-center justify-center"
            style={{
              background: customBoardBackground 
                ? `url(${customBoardBackground}) center/cover no-repeat`
                : 'linear-gradient(135deg, rgba(88, 28, 135, 0.3), rgba(109, 40, 217, 0.15))',
              boxShadow: 'inset 0 0 20px rgba(139, 92, 246, 0.15)',
            }}
          >
            <div className="text-center opacity-30">
              <div className="text-lg">🎲</div>
            </div>
          </div>
          <PropertyCard propertyId={17} {...cardProps} />

          {/* ========== ROW 3 ========== */}
          <PropertyCard propertyId={9} {...cardProps} />
          <PropertyCard propertyId={18} {...cardProps} />

          {/* ========== ROW 4 ========== */}
          <PropertyCard propertyId={8} {...cardProps} />
          <PropertyCard propertyId={19} {...cardProps} />

          {/* ========== ROW 5 ========== */}
          <PropertyCard propertyId={7} {...cardProps} />
          <PropertyCard propertyId={20} {...cardProps} />

          {/* ========== ROW 6 ========== */}
          <PropertyCard propertyId={6} {...cardProps} />
          <PropertyCard propertyId={21} {...cardProps} />

          {/* ========== ROW 7: Bottom row ========== */}
          <PropertyCard propertyId={5} {...cardProps} />
          <PropertyCard propertyId={4} {...cardProps} />
          <PropertyCard propertyId={3} {...cardProps} />
          <PropertyCard propertyId={2} {...cardProps} />
          <PropertyCard propertyId={1} {...cardProps} />
          <PropertyCard propertyId={0} {...cardProps} />
          <CornerSquare icon="🎲" label="POLY" bgColor="bg-purple-600" profilePicture={profilePicture} cornerSquareStyle={cornerSquareStyle} customPropertyCardBackground={customPropertyCardBackground} />
        </div>
      </div>
    </div>
  );
}