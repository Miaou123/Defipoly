'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { 
  THEME_PRESETS, 
  ThemePreset, 
  getPresetsByCategory 
} from '@/utils/themePresets';

interface ThemePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (preset: ThemePreset) => void;
}

export function ThemePresetModal({
  isOpen,
  onClose,
  onApply
}: ThemePresetModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'dark' | 'medium' | 'light'>('dark');
  const [selectedPreset, setSelectedPreset] = useState<ThemePreset | null>(null);
  
  const presetsInCategory = getPresetsByCategory(selectedCategory);

  const handlePresetSelect = (preset: ThemePreset) => {
    setSelectedPreset(preset);
  };

  const handleApply = () => {
    if (selectedPreset) {
      onApply(selectedPreset);
      onClose();
    }
  };

  const SimpleBoardPreview = ({ preset }: { preset: ThemePreset }) => (
    <div className="w-full max-w-xs mx-auto">
      {/* Board background with scene gradient overlay */}
      <div 
        className="w-full aspect-square rounded-lg border-4 border-gray-600 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${preset.colors[0]} 0%, ${preset.colors[1]} 100%)`
        }}
      >
        {/* Scene gradient overlay (subtle) */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(180deg, ${preset.colors[0]} 0%, ${preset.colors[1]} 100%)`
          }}
        />
        
        {/* Simplified board layout */}
        <div className="absolute inset-4 border-2 border-white/30 rounded">
          {/* Corner squares */}
          <div className="absolute top-0 left-0 w-8 h-8 border border-white/50" />
          <div className="absolute top-0 right-0 w-8 h-8 border border-white/50" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border border-white/50" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border border-white/50" />
          
          {/* Property tiles on sides */}
          {/* Top side */}
          <div className="absolute top-0 left-8 right-8 h-8 flex">
            {Array.from({length: 5}).map((_, i) => (
              <div 
                key={`top-${i}`}
                className="flex-1 border-r border-white/50 last:border-r-0"
                style={{ backgroundColor: `${preset.colors[0]}40` }}
              />
            ))}
          </div>
          
          {/* Bottom side */}
          <div className="absolute bottom-0 left-8 right-8 h-8 flex">
            {Array.from({length: 5}).map((_, i) => (
              <div 
                key={`bottom-${i}`}
                className="flex-1 border-r border-white/50 last:border-r-0"
                style={{ backgroundColor: `${preset.colors[0]}40` }}
              />
            ))}
          </div>
          
          {/* Left side */}
          <div className="absolute left-0 top-8 bottom-8 w-8 flex flex-col">
            {Array.from({length: 5}).map((_, i) => (
              <div 
                key={`left-${i}`}
                className="flex-1 border-b border-white/50 last:border-b-0"
                style={{ backgroundColor: `${preset.colors[0]}40` }}
              />
            ))}
          </div>
          
          {/* Right side */}
          <div className="absolute right-0 top-8 bottom-8 w-8 flex flex-col">
            {Array.from({length: 5}).map((_, i) => (
              <div 
                key={`right-${i}`}
                className="flex-1 border-b border-white/50 last:border-b-0"
                style={{ backgroundColor: `${preset.colors[0]}40` }}
              />
            ))}
          </div>
          
          {/* Center area */}
          <div className="absolute top-8 left-8 right-8 bottom-8 bg-black/10 rounded flex items-center justify-center">
            <div className="text-white/60 text-xs font-bold">MONOPOLY</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-4xl w-full max-h-[90vh] overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-purple-100">
              Theme Presets
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-purple-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-6">
            {/* Left Column - Categories and Presets */}
            <div className="col-span-2">
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
              <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                {presetsInCategory.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={`group relative rounded-lg overflow-hidden transition-all ${
                      selectedPreset?.id === preset.id
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
                        className="absolute bottom-1 right-1 w-4 h-4 rounded border border-gray-600"
                        style={{ backgroundColor: preset.colors[0] }}
                      />
                      {/* Scene color indicator */}
                      <div 
                        className="absolute top-1 left-1 w-4 h-4 rounded border border-gray-600"
                        style={{
                          background: `linear-gradient(45deg, ${preset.colors[0]} 0%, ${preset.colors[1]} 100%)`
                        }}
                      />
                    </div>
                    
                    {/* Preset name on hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-white font-medium px-2 text-center">
                        {preset.name}
                      </span>
                    </div>

                    {/* Selected indicator */}
                    {selectedPreset?.id === preset.id && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <svg 
                          className="w-6 h-6 text-white drop-shadow-md"
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
            </div>

            {/* Right Column - Preview and Controls */}
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-purple-100 mb-4">
                {selectedPreset ? selectedPreset.name : 'Select a preset'}
              </h3>
              
              {selectedPreset && (
                <>
                  {/* Board Preview */}
                  <div className="mb-6">
                    <SimpleBoardPreview preset={selectedPreset} />
                  </div>
                  
                  {/* Color Info */}
                  <div className="mb-6 space-y-3">
                    <div className="text-sm">
                      <div className="text-purple-200 font-medium mb-1">Scene Background</div>
                      <div className="flex gap-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-600"
                          style={{ backgroundColor: selectedPreset.colors[0] }}
                          title={selectedPreset.colors[0]}
                        />
                        <div 
                          className="w-4 h-4 rounded border border-gray-600"
                          style={{ backgroundColor: selectedPreset.colors[1] }}
                          title={selectedPreset.colors[1]}
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="text-purple-200 font-medium mb-1">Board Center</div>
                      <div className="flex gap-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-600"
                          style={{ backgroundColor: selectedPreset.colors[0] }}
                          title={selectedPreset.colors[0]}
                        />
                        <div 
                          className="w-4 h-4 rounded border border-gray-600"
                          style={{ backgroundColor: selectedPreset.colors[1] }}
                          title={selectedPreset.colors[1]}
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="text-purple-200 font-medium mb-1">Property Tiles</div>
                      <div 
                        className="w-4 h-4 rounded border border-gray-600"
                        style={{ backgroundColor: selectedPreset.colors[0] }}
                        title={selectedPreset.colors[0]}
                      />
                    </div>
                  </div>
                  
                  {/* Apply Button */}
                  <button
                    onClick={handleApply}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 transition-colors text-white font-semibold rounded-lg"
                  >
                    Apply Theme
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-purple-500/20">
            <p className="text-xs text-gray-400 text-center">
              Presets apply matching colors to all three areas: scene background, board center, and property tiles.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}