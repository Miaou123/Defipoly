import React, { useState } from 'react';
import { 
  THEME_PRESETS, 
  ThemePreset, 
  getPresetsByCategory,
  getSceneGradient,
  getBoardGradient 
} from '@/utils/themePresets';

interface ThemePresetSelectorProps {
  currentSceneBackground?: string | null;
  currentBoardBackground?: string | null; 
  currentTileBackground?: string | null;
  currentBoardPresetId?: string | null;
  currentTilePresetId?: string | null;
  onApply: (preset: ThemePreset) => void;
}

export const ThemePresetSelector: React.FC<ThemePresetSelectorProps> = ({
  currentSceneBackground,
  currentBoardBackground,
  currentTileBackground,
  currentBoardPresetId,
  currentTilePresetId,
  onApply
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'dark' | 'medium' | 'light'>('dark');
  const presetsInCategory = getPresetsByCategory(selectedCategory);

  // Check if a preset is currently selected
  // Note: Since presets now generate image URLs, we can't directly compare
  // This will be enhanced later to check for preset metadata
  const isPresetSelected = (preset: ThemePreset): boolean => {
    // For now, we'll disable the selected state check since we're using image URLs
    // TODO: Add preset ID metadata to uploaded images to enable selection detection
    return false;
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-white mb-4">Theme Presets</h3>
      
      {/* Category Tabs */}
      <div className="flex gap-2 mb-4">
        {(['dark', 'medium', 'light'] as const).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              selectedCategory === category
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-4 gap-3">
        {presetsInCategory.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onApply(preset)}
            className={`group relative rounded-lg overflow-hidden transition-all ${
              isPresetSelected(preset)
                ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-800'
                : 'hover:scale-105'
            }`}
            title={preset.name}
          >
            {/* Preview showing board gradient */}
            <div 
              className="w-full h-16 relative"
              style={{
                background: `linear-gradient(135deg, ${preset.colors[0]} 0%, ${preset.colors[1]} 100%)`
              }}
            >
              {/* Small tile color indicator */}
              <div 
                className={`absolute bottom-1 right-1 w-4 h-4 rounded border ${
                  preset.category === 'light' ? 'border-gray-800' : 'border-gray-600'
                }`}
                style={{ backgroundColor: preset.colors[0] }}
              />
            </div>
            
            {/* Preset name on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-white font-medium px-2 text-center">
                {preset.name}
              </span>
            </div>

            {/* Selected indicator */}
            {isPresetSelected(preset) && (
              <div className="absolute top-1 left-1">
                <svg 
                  className="w-4 h-4 text-white drop-shadow-md"
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Click a preset to apply matching colors to all three areas: scene background, board center, and property tiles.
      </p>
    </div>
  );
};