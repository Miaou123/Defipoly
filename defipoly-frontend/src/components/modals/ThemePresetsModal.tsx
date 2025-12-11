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
  const [selectedPreset, setSelectedPreset] = useState<ThemePreset | null>(getPresetsByCategory('dark')[0] || null);
  
  const presetsInCategory = getPresetsByCategory(selectedCategory);

  // Update selected preset when category changes
  const handleCategoryChange = (category: 'dark' | 'medium' | 'light') => {
    setSelectedCategory(category);
    setSelectedPreset(getPresetsByCategory(category)[0] || null);
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
      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all duration-200 ${
        selectedPreset?.id === preset.id
          ? 'bg-purple-500/20 backdrop-blur-sm'
          : 'hover:bg-white/5'
      }`}
    >
      {/* Color swatch */}
      <div className="flex gap-1">
        <div 
          className="w-3 h-3 rounded-sm"
          style={{
            background: `linear-gradient(135deg, ${preset.colors[0]} 0%, ${preset.colors[1]} 100%)`
          }}
        />
        <div 
          className="w-3 h-3 rounded-sm"
          style={{
            background: `linear-gradient(135deg, ${preset.colors[0]} 0%, ${preset.colors[1]} 100%)`
          }}
        />
        <div 
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: preset.colors[0] }}
        />
      </div>
      
      {/* Preset info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate text-purple-100">
          {preset.name}
        </div>
      </div>
    </div>
  );


  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-4xl w-full max-h-[80vh] overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-purple-100">
              Theme Presets
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-purple-400 hover:text-white transition-colors rounded-lg hover:bg-purple-800/30"
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
                    : 'bg-purple-800/40 text-purple-300 hover:bg-purple-700/50'
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
          <div className="w-2/5 border-r border-purple-500/20 bg-gradient-to-b from-purple-800/30 to-purple-900/50">
            <div className="h-full p-3 overflow-y-auto">
              <div className="space-y-1">
                {presetsInCategory.map(preset => (
                  <PresetRow key={preset.id} preset={preset} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="w-3/5 bg-gradient-to-br from-purple-800/20 to-purple-900/30 flex flex-col">
            <div className="flex-1 p-6 flex flex-col items-center justify-center">
              {selectedPreset && (
                <>
                  {/* Preset name */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-1 text-purple-100">
                      {selectedPreset.name}
                    </h3>
                    <p className="capitalize text-sm text-purple-400">
                      {selectedPreset.category} theme
                    </p>
                  </div>

                  {/* Live preview */}
                  <div className="w-full max-w-xs mb-6">
                    <SimpleBoardPreview
                      customSceneBackground={`${selectedPreset.colors[0]},${selectedPreset.colors[1]}`}
                      customBoardBackground={`${selectedPreset.colors[0]},${selectedPreset.colors[1]}`}
                      customPropertyCardBackground={selectedPreset.colors[0]}
                      className="w-full aspect-square rounded-xl shadow-2xl border border-white/20"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="w-full max-w-xs">
                    <div className="flex gap-3">
                      {onReset && (
                        <button
                          onClick={handleReset}
                          className="flex-1 py-2 px-4 bg-red-600/80 hover:bg-red-600 transition-all duration-200 text-white font-medium rounded-lg text-sm"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={handleApply}
                        disabled={!selectedPreset}
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-purple-800 disabled:to-purple-800 disabled:cursor-not-allowed transition-all duration-200 text-white font-medium rounded-lg text-sm"
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