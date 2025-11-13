'use client';

import { DiceIcon } from './icons/UIIcons';
import { PropertyCardTheme } from '@/utils/themes';
import { useTheme } from '@/contexts/ThemeContext';

interface CornerSquareProps {
  icon: string;
  label: string;
  bgColor: string;
  theme?: PropertyCardTheme;
  profilePicture?: string | null;
}

export function CornerSquare({ icon, label, bgColor, theme, profilePicture }: CornerSquareProps) {
  const themeContext = useTheme();
  
  // Default theme if not provided
  const cardTheme = theme || {
    id: 'default',
    name: 'Default',
    background: 'bg-white/10 backdrop-blur-sm',
    border: 'border border-white/20',
    textColor: 'text-white',
    accent: 'text-purple-300'
  };

  // Get background based on theme (same logic as PropertyCard)
  const getCardBackground = () => {
    // Check for custom theme and use custom background
    if (cardTheme.id === 'custom' && themeContext.customPropertyCardBackground) {
      return `url(${themeContext.customPropertyCardBackground}) center/cover`;
    }
    
    if (cardTheme.id === 'default') {
      return `linear-gradient(135deg, rgba(88, 28, 135, 0.8), rgba(109, 40, 217, 0.6))`;
    } else if (cardTheme.id === 'neon') {
      return `linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.7))`;
    } else if (cardTheme.id === 'gold') {
      return `linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.7))`;
    } else if (cardTheme.id === 'minimal') {
      return `rgba(255, 255, 255, 0.95)`;
    }
    return `linear-gradient(135deg, rgba(88, 28, 135, 0.8), rgba(109, 40, 217, 0.6))`;
  };

  const getTextColor = () => {
    return cardTheme.id === 'minimal' ? '#1f2937' : '#e9d5ff';
  };

  const getDiceColor = () => {
    if (cardTheme.id === 'minimal') return 'text-gray-700';
    if (cardTheme.id === 'neon') return 'text-pink-300';
    if (cardTheme.id === 'gold') return 'text-yellow-300';
    return 'text-purple-400';
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{
        background: getCardBackground(),
        border: '2px solid rgba(139, 92, 246, 0.3)',
      }}
    >
      {/* Card content */}
      {profilePicture ? (
        // Profile picture display - just the image, no text
        <img 
          src={profilePicture} 
          alt="Player" 
          className="w-full h-full object-cover"
        />
      ) : (
        // Default display - original design with dice and text
        <div className="relative flex flex-col h-full">
          {/* Top color bar */}
          <div 
            className="h-4 w-full flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(109, 40, 217, 0.3))',
            }}
          />

          {/* Middle section with dice and DeFiPoly text */}
          <div 
            className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2"
            style={{
              background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.4), rgba(109, 40, 217, 0.2))',
            }}
          >
            <DiceIcon size={48} className={getDiceColor()} />
            <div 
              className="text-[10px] font-black uppercase tracking-wider"
              style={{ color: getTextColor() }}
            >
              DeFiPoly
            </div>
          </div>
        </div>
      )}
    </div>
  );
}