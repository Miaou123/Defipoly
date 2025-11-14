'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface CornerSquareProps {
  icon: string;
  label: string;
  bgColor: string;
  profilePicture?: string | null;
  cornerSquareStyle?: 'property' | 'profile';
  customPropertyCardBackground?: string | null;
}

export function CornerSquare({ icon, label, bgColor, profilePicture, cornerSquareStyle = 'property', customPropertyCardBackground }: CornerSquareProps) {
  const themeContext = useTheme();
  
  // Debug logging for corner squares
  console.log('🏠 [CORNER] CornerSquare props:', {
    cornerSquareStyle,
    profilePicture,
    hasProfilePic: !!profilePicture,
    customPropertyCardBackground,
    themeContextCustomPropertyCardBackground: themeContext.customPropertyCardBackground
  });

  // Helper to check if custom background is a solid color (not an image URL)
  const isCustomBackgroundSolidColor = () => {
    const customBg = customPropertyCardBackground || themeContext.customPropertyCardBackground;
    
    console.log('🎨 [CORNER] Checking if solid color:', {
      customBg,
      hasValue: !!customBg,
      startsWithHash: customBg?.startsWith('#'),
      startsWithRgb: customBg?.startsWith('rgb'),
      startsWithHttp: customBg?.startsWith('http'),
      startsWithSlash: customBg?.startsWith('/'),
      hasImageExt: customBg?.includes('.png') || customBg?.includes('.jpg')
    });
    
    if (!customBg) return false;
    
    // If it starts with http, https, /, or contains common image extensions, it's an image URL
    if (customBg.startsWith('http') || customBg.startsWith('/') || 
        customBg.includes('.png') || customBg.includes('.jpg') || 
        customBg.includes('.jpeg') || customBg.includes('.webp') || 
        customBg.includes('.gif')) {
      console.log('🎨 [CORNER] Detected as IMAGE URL');
      return false;
    }
    
    // If it starts with # or rgb/rgba, it's a color
    if (customBg.startsWith('#') || customBg.startsWith('rgb')) {
      console.log('🎨 [CORNER] Detected as SOLID COLOR');
      return true;
    }
    
    console.log('🎨 [CORNER] Could not determine type, treating as color');
    // If we can't determine, assume it's a color
    return true;
  };

  // Check if we have a custom background (solid color or image)
  const hasCustomBackground = !!(customPropertyCardBackground || themeContext.customPropertyCardBackground);
  const isCustomSolidColor = hasCustomBackground && isCustomBackgroundSolidColor();

  console.log('🏠 [CORNER] Final decision:', {
    hasCustomBackground,
    isCustomSolidColor,
    cornerSquareStyle,
    willShowLogo: !(cornerSquareStyle === 'profile' && profilePicture) && 
                   !(cornerSquareStyle === 'property' && hasCustomBackground && !isCustomSolidColor)
  });

  // Get background - either custom or default dark
  const getBackground = () => {
    const customBg = customPropertyCardBackground || themeContext.customPropertyCardBackground;
    if (customBg) {
      // Custom background - either solid color or image URL
      if (isCustomSolidColor) {
        return customBg; // Solid color like #9333ea
      } else {
        return `url(${customBg}) center/cover`; // Image URL
      }
    }
    // Default dark theme
    return `linear-gradient(to bottom right, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))`;
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{
        background: getBackground(),
        border: '2px solid rgba(139, 92, 246, 0.3)',
      }}
    >
      {/* Card content */}
      {cornerSquareStyle === 'profile' && profilePicture ? (
        // Profile Picture Mode - Show profile picture
        <div className="w-full h-full flex items-center justify-center p-2">
          <img 
            src={profilePicture} 
            alt="Profile" 
            className="w-full h-full object-cover rounded"
          />
        </div>
      ) : cornerSquareStyle === 'property' && hasCustomBackground && !isCustomSolidColor ? (
        // Property Card Mode with Custom Image Background - Show nothing (just the image background)
        <div className="w-full h-full" />
      ) : (
        // Default OR Solid Color Mode - Show Logo and Text
        <div className="w-full h-full flex flex-col items-center justify-center p-2 gap-1">
          {/* Logo */}
          <img 
            src="/logo.svg" 
            alt="Defipoly Logo" 
            className="w-12 h-12 object-contain"
          />
          {/* DEFIPOLY Text */}
          <div 
            className="text-xs font-black tracking-wider text-white"
          >
            DEFIPOLY
          </div>
        </div>
      )}
    </div>
  );
}