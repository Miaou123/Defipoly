'use client';

import { DiceIcon } from './icons/UIIcons';
import { useTheme } from '@/contexts/ThemeContext';
import { getPropertyCardTheme } from '@/utils/themes';

interface CornerSquareProps {
  icon: string;
  label: string;
  bgColor: string;
}

export function CornerSquare({ icon, label, bgColor }: CornerSquareProps) {
  const themeContext = useTheme();
  
  // Get the same background as property cards
  const getCardBackground = () => {
    try {
      // Check if there's a custom property card background
      if (themeContext?.propertyCardTheme === 'custom' && themeContext?.customPropertyCardBackground) {
        return `url(${themeContext.customPropertyCardBackground})`;
      }
      
      // Use dark theme gradient - fully opaque
      return 'linear-gradient(135deg, rgba(31, 41, 55, 1), rgba(17, 24, 39, 1))';
    } catch (error) {
      // Fallback to dark theme if there's any error - fully opaque
      return 'linear-gradient(135deg, rgba(31, 41, 55, 1), rgba(17, 24, 39, 1))';
    }
  };

  const isCustomBg = themeContext?.propertyCardTheme === 'custom' && themeContext?.customPropertyCardBackground;

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{
        background: getCardBackground(),
        backgroundSize: isCustomBg ? 'cover' : undefined,
        backgroundPosition: isCustomBg ? 'center' : undefined,
        backgroundRepeat: isCustomBg ? 'no-repeat' : undefined,
      }}
    >
      {/* Border matching PropertyCard style */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '2px solid rgba(107, 114, 128, 1)',
        }}
      />

      {/* Card content */}
      <div className="relative flex flex-col h-full">
        {/* Top color bar - use a neutral gray */}
        <div 
          className="h-4 w-full flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(55, 65, 81, 1), rgba(31, 41, 55, 1))',
          }}
        />

        {/* Middle section with dice and DeFiPoly text */}
        <div 
          className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2"
          style={{
            background: 'linear-gradient(135deg, rgba(31, 41, 55, 1), rgba(17, 24, 39, 1))',
          }}
        >
          <DiceIcon size={48} className="text-gray-400" />
          <div 
            className="text-[10px] font-black uppercase text-gray-200 tracking-wider"
          >
            DeFiPoly
          </div>
        </div>

      </div>
    </div>
  );
}

interface FillerSquareProps {
  icon: string;
  label: string;
  bgColor: string;
}

export function FillerSquare({ icon, label, bgColor }: FillerSquareProps) {
  const themeContext = useTheme();
  
  // Default theme if none provided - same as PropertyCard
  const cardTheme = getPropertyCardTheme(themeContext.propertyCardTheme);
  
  // Get background based on theme with fallback - copy from PropertyCard
  const getCardBackground = () => {
    try {
      // Check if there's a custom property card background
      if (themeContext.propertyCardTheme === 'custom' && themeContext.customPropertyCardBackground) {
        return `url(${themeContext.customPropertyCardBackground})`;
      }
      
      // Use the background from the theme object, which now contains CSS gradient strings
      return cardTheme.background || 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))';
    } catch (error) {
      // Fallback to default if there's any error - fully opaque
      return 'linear-gradient(135deg, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))';
    }
  };

  const isCustomBg = themeContext?.propertyCardTheme === 'custom' && themeContext?.customPropertyCardBackground;

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{
        backgroundImage: isCustomBg ? getCardBackground() : undefined,
        background: !isCustomBg ? getCardBackground() : undefined,
        backgroundSize: isCustomBg ? 'cover' : undefined,
        backgroundPosition: isCustomBg ? 'center' : undefined,
        backgroundRepeat: isCustomBg ? 'no-repeat' : undefined,
      }}
    >
      {/* Border matching PropertyCard style */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '2px solid rgba(107, 114, 128, 0.3)',
          borderRadius: '8px',
        }}
      />

      {/* Card content */}
      <div className="relative flex flex-col h-full">
        {/* Top color bar - use a neutral gray */}
        <div 
          className="h-4 w-full flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(55, 65, 81, 1), rgba(31, 41, 55, 1))',
          }}
        />

        {/* Middle section with dice and DeFiPoly text */}
        <div 
          className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2"
          style={{
            background: getCardBackground(),
          }}
        >
          <DiceIcon size={48} className="text-purple-400" />
          <div 
            className="text-[10px] font-black uppercase text-purple-200 tracking-wider"
          >
            DeFiPoly
          </div>
        </div>

        {/* Bottom section - empty for now */}
        <div 
          className="px-1 py-1 flex-shrink-0"
          style={{
            background: 'rgba(12, 5, 25, 0.8)',
            borderTop: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div className="h-3"></div>
        </div>
      </div>
    </div>
  );
}