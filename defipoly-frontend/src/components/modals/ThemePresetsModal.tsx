'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { 
  THEME_PRESETS, 
  ThemePreset, 
  getPresetsByCategory 
} from '@/utils/themePresets';
import { SimpleBoardPreview } from '@/components/SimpleBoardPreview';

interface ThemePresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (preset: ThemePreset) => void;
  onReset?: () => void;
}

export function ThemePresetsModal({
  isOpen,
  onClose,
  onApply,
  onReset
}: ThemePresetsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'dark' | 'medium' | 'light'>('dark');
  const [selectedPreset, setSelectedPreset] = useState<ThemePreset | null>(getPresetsByCategory('dark')[0]);
  
  const presetsInCategory = getPresetsByCategory(selectedCategory);

  // Update selected preset when category changes
  const handleCategoryChange = (category: 'dark' | 'medium' | 'light') => {
    setSelectedCategory(category);
    setSelectedPreset(getPresetsByCategory(category)[0]);
  };

  const handleApply = () => {
    if (selectedPreset) {
      onApply(selectedPreset);
      onClose();
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
      onClose();
    }
  };

  const PresetRow = ({ preset }: { preset: ThemePreset }) => (
    <div
      onClick={() => setSelectedPreset(preset)}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
        selectedPreset?.id === preset.id
          ? 'bg-purple-500/20 backdrop-blur-sm'
          : 'hover:bg-white/5'
      }`}
    >
      {/* Color swatch */}
      <div className="flex gap-1">
        <div 
          className="w-4 h-4 rounded-sm"
          style={{
            background: `linear-gradient(135deg, ${preset.scene[0]} 0%, ${preset.scene[1]} 100%)`
          }}
        />
        <div 
          className="w-4 h-4 rounded-sm"
          style={{
            background: `linear-gradient(135deg, ${preset.board[0]} 0%, ${preset.board[1]} 100%)`
          }}
        />
        <div 
          className="w-4 h-4 rounded-sm"
          style={{ backgroundColor: preset.tile }}
        />
      </div>
      
      {/* Preset info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {preset.name}
        </div>
        <div className="text-xs text-gray-400 capitalize">
          {preset.category}
        </div>
      </div>
    </div>
  );


  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div 
        className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Theme Presets
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Category Tabs */}
          <div className="flex gap-2">
            {(['dark', 'medium', 'light'] as const).map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
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
        </div>

        {/* Split Panel Content */}
        <div className="flex h-[500px]">
          {/* Left Panel - Preset List */}
          <div className="w-2/5 border-r border-white/10 bg-gradient-to-b from-gray-800/50 to-gray-900/50">
            <div className="h-full p-4">
              <div className="space-y-1">
                {presetsInCategory.map(preset => (
                  <PresetRow key={preset.id} preset={preset} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="w-3/5 bg-gradient-to-br from-gray-800/30 to-gray-900/30 flex flex-col">
            <div className="flex-1 p-6 flex flex-col items-center justify-center">
              {selectedPreset && (
                <>
                  {/* Preset name */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {selectedPreset.name}
                    </h3>
                    <p className="text-gray-400 capitalize text-sm">
                      {selectedPreset.category} theme
                    </p>
                  </div>

                  {/* Live preview */}
                  <div className="w-full max-w-xs mb-6">
                    <SimpleBoardPreview
                      customSceneBackground={`${selectedPreset.scene[0]},${selectedPreset.scene[1]}`}
                      customBoardBackground={`${selectedPreset.board[0]},${selectedPreset.board[1]}`}
                      customPropertyCardBackground={selectedPreset.tile}
                      className="w-full aspect-square rounded-xl shadow-2xl border border-white/20"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="w-full max-w-xs">
                    <div className="flex gap-3">
                      {onReset && (
                        <button
                          onClick={handleReset}
                          className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-500 transition-all duration-200 text-white font-medium rounded-lg text-sm"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={handleApply}
                        disabled={!selectedPreset}
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 text-white font-medium rounded-lg text-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}