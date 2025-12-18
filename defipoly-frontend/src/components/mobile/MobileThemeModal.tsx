'use client';

import { useState, useRef } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { useNotification } from '@/contexts/NotificationContext';
import { SimpleBoardPreview } from '@/components/SimpleBoardPreview';
import { THEME_PRESETS } from '@/utils/themePresets';
import { getImageUrl } from '@/utils/config';
import { X } from 'lucide-react';

type TabType = 'presets' | 'board' | 'cards' | 'scene' | 'corners';

interface MobileThemeModalProps {
  onClose: () => void;
}

export function MobileThemeModal({ onClose }: MobileThemeModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const { profile, updateProfile } = useGameState();
  const { showSuccess, showError } = useNotification();
  
  // Swipe to dismiss state
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  
  // File upload refs
  const boardFileRef = useRef<HTMLInputElement>(null);
  const cardsFileRef = useRef<HTMLInputElement>(null);
  const sceneFileRef = useRef<HTMLInputElement>(null);

  // Touch handlers for swipe to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setStartY(touch.clientY);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !startY) return;
    const touch = e.touches[0];
    if (touch) {
      const deltaY = touch.clientY - startY;
      if (deltaY > 0) {
        setDragOffset(deltaY);
      }
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 150) {
      onClose();
    } else {
      setDragOffset(0);
    }
    setIsDragging(false);
    setStartY(null);
  };

  // Handle file upload (same logic as desktop ProfileCustomization)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'board' | 'cards' | 'scene'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB for board, 3MB for cards, 5MB for scene)
    const maxSize = type === 'cards' ? 3 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('File too large', `Max size is ${type === 'cards' ? '3MB' : '5MB'}`);
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      
      if (type === 'board') {
        await updateProfile({ customBoardBackground: base64 });
      } else if (type === 'cards') {
        await updateProfile({ customPropertyCardBackground: base64 });
      } else if (type === 'scene') {
        await updateProfile({ customSceneBackground: base64 });
      }
      
      showSuccess('Uploaded!', `${type} background updated`);
    };
    reader.readAsDataURL(file);
  };

  // Apply preset theme
  const applyPreset = async (preset: any) => {
    const gradientString = `linear-gradient(to bottom right, ${preset.colors[0]}, ${preset.colors[1]})`;
    
    await updateProfile({
      boardPresetId: preset.id,
      tilePresetId: preset.id,
      customBoardBackground: gradientString,
      customPropertyCardBackground: gradientString,
      customSceneBackground: gradientString,
    });
    showSuccess('Theme Applied', preset.name);
  };

  // Color options for board/cards/scene
  const colorOptions = [
    { gradient: 'from-purple-700 to-purple-900', string: 'linear-gradient(to bottom right, #7c3aed, #581c87)' },
    { gradient: 'from-indigo-700 to-indigo-900', string: 'linear-gradient(to bottom right, #4338ca, #312e81)' },
    { gradient: 'from-blue-700 to-blue-900', string: 'linear-gradient(to bottom right, #1d4ed8, #1e3a8a)' },
    { gradient: 'from-cyan-700 to-cyan-900', string: 'linear-gradient(to bottom right, #0891b2, #164e63)' },
    { gradient: 'from-teal-700 to-teal-900', string: 'linear-gradient(to bottom right, #0f766e, #134e4a)' },
    { gradient: 'from-green-700 to-green-900', string: 'linear-gradient(to bottom right, #15803d, #14532d)' },
    { gradient: 'from-yellow-700 to-yellow-900', string: 'linear-gradient(to bottom right, #a16207, #713f12)' },
    { gradient: 'from-orange-700 to-orange-900', string: 'linear-gradient(to bottom right, #c2410c, #7c2d12)' },
    { gradient: 'from-red-700 to-red-900', string: 'linear-gradient(to bottom right, #dc2626, #7f1d1d)' },
    { gradient: 'from-pink-700 to-pink-900', string: 'linear-gradient(to bottom right, #be185d, #831843)' },
  ];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'presets', label: 'Presets' },
    { id: 'board', label: 'Board' },
    { id: 'cards', label: 'Cards' },
    { id: 'scene', label: 'Scene' },
    { id: 'corners', label: 'Corners' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[70] flex items-end"
      onClick={onClose}
    >
      <div 
        className="w-full bg-black/95 backdrop-blur-xl border-t border-purple-500/30 rounded-t-3xl flex flex-col"
        style={{ 
          height: '85vh',
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3 flex-shrink-0">
          <div className="w-10 h-1 bg-purple-500/40 rounded-full"></div>
        </div>
        
        {/* Header */}
        <div className="px-4 pb-3 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-bold text-lg">Customize Theme</h2>
          <button onClick={onClose} className="text-purple-400 p-1">
            <X size={24} />
          </button>
        </div>
        
        {/* Board Preview - Always Visible */}
        <div className="px-4 pb-3 flex-shrink-0">
          <SimpleBoardPreview
            customSceneBackground={profile.customSceneBackground}
            customBoardBackground={profile.customBoardBackground}
            customPropertyCardBackground={profile.customPropertyCardBackground}
            className="w-full aspect-video rounded-xl border border-purple-500/30"
          />
        </div>
        
        {/* Tab Bar */}
        <div className="flex border-b border-purple-500/20 px-2 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-[11px] font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-purple-300 border-b-2 border-purple-400'
                  : 'text-purple-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Tab Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* PRESETS TAB */}
          {activeTab === 'presets' && (
            <div>
              <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Theme Presets</div>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(THEME_PRESETS).map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`aspect-square rounded-lg border-2 transition-all relative overflow-hidden ${
                      profile.boardPresetId === preset.id
                        ? 'border-purple-400'
                        : 'border-purple-500/20'
                    }`}
                    style={{
                      background: `linear-gradient(to bottom right, ${preset.colors[0]}, ${preset.colors[1]})`
                    }}
                  >
                    {profile.boardPresetId === preset.id && (
                      <div className="w-full h-full flex items-start justify-end p-1">
                        <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-[8px]">✓</div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] p-1 text-center">
                      {preset.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* BOARD TAB */}
          {activeTab === 'board' && (
            <div className="space-y-4">
              <div>
                <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Colors</div>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => updateProfile({ customBoardBackground: color.string })}
                      className={`aspect-square rounded-lg bg-gradient-to-br ${color.gradient} border border-purple-500/20`}
                    />
                  ))}
                </div>
              </div>
              
              <input
                ref={boardFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'board')}
                className="hidden"
              />
              <button 
                onClick={() => boardFileRef.current?.click()}
                className="w-full py-3 border border-dashed border-purple-500/40 rounded-xl text-purple-400 text-sm flex items-center justify-center gap-2"
              >
                📤 Upload Custom Image
              </button>
              <p className="text-purple-400/50 text-[10px] text-center">Max 5MB • JPG, PNG, GIF</p>
            </div>
          )}
          
          {/* CARDS TAB */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div>
                <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Colors</div>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => updateProfile({ customPropertyCardBackground: color.string })}
                      className={`aspect-square rounded-lg bg-gradient-to-br ${color.gradient} border border-purple-500/20`}
                    />
                  ))}
                </div>
              </div>
              
              <input
                ref={cardsFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'cards')}
                className="hidden"
              />
              <button 
                onClick={() => cardsFileRef.current?.click()}
                className="w-full py-3 border border-dashed border-purple-500/40 rounded-xl text-purple-400 text-sm flex items-center justify-center gap-2"
              >
                📤 Upload Custom Image
              </button>
              <p className="text-purple-400/50 text-[10px] text-center">Max 3MB • JPG, PNG, GIF</p>
            </div>
          )}
          
          {/* SCENE TAB */}
          {activeTab === 'scene' && (
            <div className="space-y-4">
              <div>
                <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Colors</div>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => updateProfile({ customSceneBackground: color.string })}
                      className={`aspect-square rounded-lg bg-gradient-to-br ${color.gradient} border border-purple-500/20`}
                    />
                  ))}
                </div>
              </div>
              
              <input
                ref={sceneFileRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'scene')}
                className="hidden"
              />
              <button 
                onClick={() => sceneFileRef.current?.click()}
                className="w-full py-3 border border-dashed border-purple-500/40 rounded-xl text-purple-400 text-sm flex items-center justify-center gap-2"
              >
                📤 Upload Custom Image
              </button>
              <p className="text-purple-400/50 text-[10px] text-center">Max 5MB • JPG, PNG, GIF</p>
            </div>
          )}
          
          {/* CORNERS TAB */}
          {activeTab === 'corners' && (
            <div className="space-y-4">
              <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-1">Corner Square Style</div>
              <p className="text-purple-300/70 text-sm mb-4">Choose what to display in the corner squares of your board.</p>
              
              {/* Property Option */}
              <button
                onClick={() => updateProfile({ cornerSquareStyle: 'property' })}
                className={`w-full rounded-xl p-4 text-left transition-all ${
                  profile.cornerSquareStyle === 'property'
                    ? 'bg-purple-900/30 border-2 border-purple-400'
                    : 'bg-purple-900/20 border border-purple-500/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-purple-800/50 border border-purple-500/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-purple-300 text-[8px]">GO</div>
                      <div className="text-white text-xs font-bold">→</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">Property Style</div>
                    <div className="text-purple-400/60 text-xs">Shows default corner tiles (GO, Jail, etc.)</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    profile.cornerSquareStyle === 'property'
                      ? 'bg-purple-500 text-white text-xs'
                      : 'border border-purple-500/30'
                  }`}>
                    {profile.cornerSquareStyle === 'property' && '✓'}
                  </div>
                </div>
              </button>
              
              {/* Profile Option */}
              <button
                onClick={() => updateProfile({ cornerSquareStyle: 'profile' })}
                className={`w-full rounded-xl p-4 text-left transition-all ${
                  profile.cornerSquareStyle === 'profile'
                    ? 'bg-purple-900/30 border-2 border-purple-400'
                    : 'bg-purple-900/20 border border-purple-500/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-purple-800/50 border border-purple-500/30 flex items-center justify-center overflow-hidden">
                    {profile.profilePicture ? (
                      <img src={getImageUrl(profile.profilePicture)} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center text-xl">👤</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">Profile Picture</div>
                    <div className="text-purple-400/60 text-xs">Shows your profile picture in corners</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    profile.cornerSquareStyle === 'profile'
                      ? 'bg-purple-500 text-white text-xs'
                      : 'border border-purple-500/30'
                  }`}>
                    {profile.cornerSquareStyle === 'profile' && '✓'}
                  </div>
                </div>
              </button>
              
              <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-500/20">
                <p className="text-purple-300/60 text-xs">
                  💡 This affects all 4 corner squares on your board.
                </p>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}