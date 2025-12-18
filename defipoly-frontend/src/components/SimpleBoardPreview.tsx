import React from 'react';
import { THEME_CONSTANTS } from '@/utils/themeConstants';
import { createGradientStyle } from '@/utils/themePresets';

interface SimpleBoardPreviewProps {
  customSceneBackground?: string | null;
  customBoardBackground?: string | null;
  customPropertyCardBackground?: string | null;
  cornerSquareStyle?: 'property' | 'profile';
  profilePicture?: string | null;
  writingStyle?: 'light' | 'dark';
  className?: string;
  onClick?: () => void;
}

export const SimpleBoardPreview: React.FC<SimpleBoardPreviewProps> = ({
  customSceneBackground,
  customBoardBackground,
  customPropertyCardBackground,
  cornerSquareStyle = 'property',
  profilePicture,
  writingStyle = 'light',
  className = "",
  onClick
}) => {
  // Get background styles - returns proper CSS properties object
  const getSceneBackgroundStyle = () => {
    if (customSceneBackground) {
      if (customSceneBackground.includes(',')) {
        return {
          backgroundImage: createGradientStyle(customSceneBackground, '180deg')
        };
      } else {
        return {
          backgroundImage: `url(${customSceneBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        };
      }
    }
    return {
      backgroundImage: THEME_CONSTANTS.DEFAULT_SCENE_BACKGROUND
    };
  };

  const getBoardBackgroundStyle = () => {
    if (customBoardBackground) {
      if (customBoardBackground.includes(',')) {
        return {
          backgroundImage: createGradientStyle(customBoardBackground, '135deg')
        };
      } else {
        return {
          backgroundImage: `url(${customBoardBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        };
      }
    }
    return {
      backgroundImage: THEME_CONSTANTS.DEFAULT_BOARD_BACKGROUND
    };
  };

  const getPropertyBackgroundStyle = () => {
    if (customPropertyCardBackground) {
      if (customPropertyCardBackground.includes(',')) {
        return {
          backgroundImage: createGradientStyle(customPropertyCardBackground, '135deg')
        };
      } else {
        return {
          backgroundImage: `url(${customPropertyCardBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        };
      }
    }
    return {
      backgroundImage: 'linear-gradient(135deg, rgba(74, 44, 90, 0.9), rgba(236, 72, 153, 0.7))'
    };
  };

  // Property color groups (simplified representation)
  const propertyColors = [
    '#8B4513', '#8B4513',           // Brown
    '#87CEEB', '#87CEEB', '#87CEEB', // Light Blue  
    '#FF69B4', '#FF69B4', '#FF69B4', // Pink
    '#FFA500', '#FFA500', '#FFA500', // Orange
    '#FF0000', '#FF0000', '#FF0000', // Red
    '#FFFF00', '#FFFF00', '#FFFF00', // Yellow
    '#008000', '#008000', '#008000', // Green
    '#000080', '#000080'             // Dark Blue
  ];

  return (
    <div 
      className={`relative cursor-pointer overflow-hidden ${className}`}
      onClick={onClick}
      style={getSceneBackgroundStyle()}
    >
      {/* Scene overlay */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Board container */}
      <div className="relative w-full h-full p-2 flex items-center justify-center">
        <div className="w-3/4 aspect-square relative">
          {/* Board background */}
          <div 
            className="absolute inset-0 rounded-lg border-2 border-purple-500/30"
            style={getBoardBackgroundStyle()}
          >
            {/* Property tiles around the board */}
            
            {/* Top row */}
            <div className="absolute top-0 left-0 right-0 h-4 flex">
              {/* Top-left corner */}
              <div className="w-4 h-4 overflow-hidden" style={getPropertyBackgroundStyle()}>
                {cornerSquareStyle === 'profile' && profilePicture ? (
                  <img src={profilePicture ?? undefined} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className={`text-[4px] ${writingStyle === 'light' ? 'text-white/60' : 'text-gray-900/60'} leading-none text-center`}>DEFI<br/>POLY</span>
                  </div>
                )}
              </div>
              {Array.from({length: 6}).map((_, i) => (
                <div 
                  key={`top-${i}`}
                  className="flex-1"
                  style={getPropertyBackgroundStyle()}
                />
              ))}
              {/* Top-right corner */}
              <div className="w-4 h-4 overflow-hidden" style={getPropertyBackgroundStyle()}>
                {cornerSquareStyle === 'profile' && profilePicture ? (
                  <img src={profilePicture ?? undefined} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className={`text-[4px] ${writingStyle === 'light' ? 'text-white/60' : 'text-gray-900/60'} leading-none text-center`}>DEFI<br/>POLY</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right column */}
            <div className="absolute right-0 top-4 bottom-4 w-4 flex flex-col">
              {Array.from({length: 5}).map((_, i) => (
                <div 
                  key={`right-${i}`}
                  className="flex-1"
                  style={getPropertyBackgroundStyle()}
                />
              ))}
            </div>
            
            {/* Bottom row */}
            <div className="absolute bottom-0 left-0 right-0 h-4 flex">
              {/* Bottom-left corner */}
              <div className="w-4 h-4 overflow-hidden" style={getPropertyBackgroundStyle()}>
                {cornerSquareStyle === 'profile' && profilePicture ? (
                  <img src={profilePicture ?? undefined} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className={`text-[4px] ${writingStyle === 'light' ? 'text-white/60' : 'text-gray-900/60'} leading-none text-center`}>DEFI<br/>POLY</span>
                  </div>
                )}
              </div>
              {Array.from({length: 6}).map((_, i) => (
                <div 
                  key={`bottom-${i}`}
                  className="flex-1"
                  style={getPropertyBackgroundStyle()}
                />
              ))}
              {/* Bottom-right corner */}
              <div className="w-4 h-4 overflow-hidden" style={getPropertyBackgroundStyle()}>
                {cornerSquareStyle === 'profile' && profilePicture ? (
                  <img src={profilePicture ?? undefined} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className={`text-[4px] ${writingStyle === 'light' ? 'text-white/60' : 'text-gray-900/60'} leading-none text-center`}>DEFI<br/>POLY</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Left column */}
            <div className="absolute left-0 top-4 bottom-4 w-4 flex flex-col">
              {Array.from({length: 5}).map((_, i) => (
                <div 
                  key={`left-${i}`}
                  className="flex-1"
                  style={getPropertyBackgroundStyle()}
                />
              ))}
            </div>
            
            {/* Center area */}
            <div className="absolute top-4 left-4 right-4 bottom-4 flex items-center justify-center">
              <div className={`text-[8px] font-bold text-center leading-none ${
                writingStyle === 'light' ? 'text-white/80' : 'text-gray-900/80'
              }`}>
                DEFI
                <br />
                POLY
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};