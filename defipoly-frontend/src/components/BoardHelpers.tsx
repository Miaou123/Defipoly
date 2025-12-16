'use client';

import { THEME_CONSTANTS } from '@/utils/themeConstants';
import { getImageUrl } from '@/utils/config';

export interface CornerSquareProps {
  icon: string;
  label: string;
  bgColor: string;
  profilePicture?: string | null | undefined;
  cornerSquareStyle?: 'property' | 'profile';
  customPropertyCardBackground?: string | null | undefined;
  scaleFactor?: number;
}

export function CornerSquare({ icon, label, bgColor, profilePicture, cornerSquareStyle = 'property', customPropertyCardBackground, scaleFactor = 1 }: CornerSquareProps) {
  // Scaled sizes
  const logoSize = Math.max(24, Math.round(48 * scaleFactor));
  const textSize = Math.max(6, Math.round(12 * scaleFactor));
  const padding = Math.max(4, Math.round(8 * scaleFactor));
  const gap = Math.max(2, Math.round(4 * scaleFactor));

  // Helper to check if custom background is a solid color (not an image URL)
  const isCustomBackgroundSolidColor = () => {
    const customBg = customPropertyCardBackground;
    
    if (!customBg) return false;
    
    // If it starts with http, https, /, or contains common image extensions, it's an image URL
    if (customBg.startsWith('http') || customBg.startsWith('/') || 
        customBg.includes('.png') || customBg.includes('.jpg') || 
        customBg.includes('.jpeg') || customBg.includes('.webp') || 
        customBg.includes('.gif')) {
      return false;
    }
    
    // If it starts with # or rgb/rgba, it's a color
    if (customBg.startsWith('#') || customBg.startsWith('rgb')) {
      return true;
    }
    // If we can't determine, assume it's a color
    return true;
  };

  // Check if we have a custom background (solid color or image)
  const hasCustomBackground = !!customPropertyCardBackground;
  const isCustomSolidColor = hasCustomBackground && isCustomBackgroundSolidColor();

  // Get background - either custom or default dark
  const getBackground = () => {
    const customBg = customPropertyCardBackground;
    if (customBg) {
      // Custom background - either solid color or image URL
      if (isCustomSolidColor) {
        return customBg; // Solid color like #9333ea
      } else {
        return `url(${customBg}) center/cover`; // Image URL
      }
    }
    // Default dark theme
    return THEME_CONSTANTS.DEFAULT_BOARD_BACKGROUND;
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{
        background: getBackground(),
        border: `1px solid rgba(139, 92, 246, 0.5)`,
      }}
    >
      {/* Card content */}
      {cornerSquareStyle === 'profile' && getImageUrl(profilePicture) ? (
        // Profile Picture Mode - Show profile picture
        <div className="w-full h-full flex items-center justify-center" style={{ padding }}>
          <img 
            src={getImageUrl(profilePicture)!} 
            alt="Profile" 
            className="w-full h-full object-cover rounded"
          />
        </div>
      ) : cornerSquareStyle === 'property' && hasCustomBackground && !isCustomSolidColor ? (
        // Property Card Mode with Custom Image Background - Show nothing (just the image background)
        <div className="w-full h-full" />
      ) : (
        // Default OR Solid Color Mode - Show Logo and Text
        <div className="w-full h-full flex flex-col items-center justify-center" style={{ padding, gap }}>
          {/* Logo */}
          <img 
            src="/logo.svg" 
            alt="Defipoly Logo" 
            className="object-contain"
            style={{ width: logoSize, height: logoSize }}
          />
          {/* DEFIPOLY Text */}
          <div 
            className="font-orbitron font-black tracking-wider text-white"
            style={{ fontSize: textSize }}
          >
            DEFIPOLY
          </div>
        </div>
      )}
    </div>
  );
}