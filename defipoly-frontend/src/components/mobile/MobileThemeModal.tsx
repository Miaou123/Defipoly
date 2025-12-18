'use client';

import { useState, useRef } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { useNotification } from '@/contexts/NotificationContext';
import { SimpleBoardPreview } from '@/components/SimpleBoardPreview';
import { THEME_PRESETS } from '@/utils/themePresets';
import { getImageUrl, API_BASE_URL } from '@/utils/config';
import { authenticatedFetch, useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { clearProfileCache } from '@/utils/profileStorage';
import { X } from 'lucide-react';

type TabType = 'presets' | 'board' | 'cards' | 'scene' | 'corners' | 'writing';

interface MobileThemeModalProps {
  onClose: () => void;
}

export function MobileThemeModal({ onClose }: MobileThemeModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const { profile, updateProfile } = useGameState();
  const { showSuccess, showError } = useNotification();
  const { publicKey } = useWallet();
  const { isAuthenticated } = useAuth();
  
  // Custom color states
  const [boardColor, setBoardColor] = useState('#9333ea');
  const [cardsColor, setCardsColor] = useState('#9333ea');
  const [sceneColor, setSceneColor] = useState('#9333ea');
  
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

    if (!publicKey) {
      showError('Error', 'Wallet not connected');
      return;
    }

    // Validate file size (5MB for board, 3MB for cards, 5MB for scene)
    const maxSize = type === 'cards' ? 3 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('File too large', `Max size is ${type === 'cards' ? '3MB' : '5MB'}`);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', publicKey.toString());
      if (type === 'board') {
        formData.append('uploadType', 'board');
        formData.append('themeType', 'board');
        formData.append('boardPresetId', '');
        if (profile.customBoardBackground) {
          formData.append('oldBackgroundUrl', profile.customBoardBackground);
        }
      } else if (type === 'cards') {
        formData.append('uploadType', 'card');
        formData.append('themeType', 'card');
        formData.append('tilePresetId', '');
        if (profile.customPropertyCardBackground) {
          formData.append('oldBackgroundUrl', profile.customPropertyCardBackground);
        }
      } else if (type === 'scene') {
        formData.append('uploadType', 'scene');
        formData.append('themeType', 'scene');
        if (profile.customSceneBackground) {
          formData.append('oldBackgroundUrl', profile.customSceneBackground);
        }
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/api/profile/upload/theme`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Upload failed:', errorData);
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (type === 'board') {
        await updateProfile({ customBoardBackground: data.backgroundUrl });
      } else if (type === 'cards') {
        await updateProfile({ customPropertyCardBackground: data.backgroundUrl });
      } else if (type === 'scene') {
        await updateProfile({ customSceneBackground: data.backgroundUrl });
      }
      
      // Clear profile cache and trigger update like desktop version
      clearProfileCache(publicKey.toString());
      window.dispatchEvent(new Event('profileUpdated'));
      
      showSuccess('Uploaded!', `${type} background updated`);
    } catch (error) {
      console.error('Upload error:', error);
      showError('Upload failed', 'Please try again');
    }
  };

  // Apply preset theme
  const applyPreset = async (preset: any) => {
    if (!isAuthenticated || !publicKey) {
      showError('Authentication Error', 'Please reconnect your wallet');
      return;
    }
    
    const gradientString = `${preset.colors[0]},${preset.colors[1]}`;
    
    const success = await updateProfile({
      boardPresetId: preset.id,
      tilePresetId: preset.id,
      customBoardBackground: gradientString,
      customPropertyCardBackground: gradientString,
      customSceneBackground: gradientString,
    });
    
    if (success) {
      showSuccess('Theme Applied', preset.name);
    } else {
      showError('Update Failed', 'Failed to apply theme preset');
    }
  };


  const tabs: { id: TabType; label: string }[] = [
    { id: 'board', label: 'Board' },
    { id: 'cards', label: 'Cards' },
    { id: 'scene', label: 'Scene' },
    { id: 'corners', label: 'Corners' },
    { id: 'writing', label: 'Text' },
    { id: 'presets', label: 'Presets' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[70] flex items-end"
      onClick={onClose}
    >
      <div 
        className="w-full bg-black/95 backdrop-blur-xl border-t border-purple-500/30 rounded-t-3xl overflow-hidden"
        style={{ 
          height: '85vh',
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle - fixed */}
        <div className="flex justify-center py-2 flex-shrink-0">
          <div className="w-10 h-1 bg-purple-500/40 rounded-full"></div>
        </div>
        
        {/* Header - fixed */}
        <div className="px-4 pb-2 flex items-center justify-between flex-shrink-0">
          <h2 className="text-white font-bold text-lg">Customize Theme</h2>
          <button onClick={onClose} className="text-purple-400 p-1">
            <X size={24} />
          </button>
        </div>
        
        {/* Board Preview */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="w-full max-w-[200px] mx-auto">
            <SimpleBoardPreview
              customSceneBackground={profile.customSceneBackground}
              customBoardBackground={profile.customBoardBackground}
              customPropertyCardBackground={profile.customPropertyCardBackground}
              cornerSquareStyle={profile.cornerSquareStyle || 'property'}
              profilePicture={profile.profilePicture}
              writingStyle={profile.writingStyle || 'light'}
              className="w-full aspect-square rounded-xl border border-purple-500/30"
            />
          </div>
        </div>
        
        {/* Tab Bar - fixed */}
        <div className="flex border-y border-purple-500/20 flex-shrink-0 bg-black/50">
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
        
        {/* Tab Content - this is the ONLY scrollable area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-4">
          
          {/* PRESETS TAB */}
          {activeTab === 'presets' && (
            <div>
              <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Theme Presets</div>
              <div className="grid grid-cols-4 gap-1.5">
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
                      <div className="absolute top-0.5 right-0.5">
                        <div className="w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center text-white text-[6px]">✓</div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[6px] py-0.5 text-center truncate px-0.5">
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
              {/* Color Picker */}
              <div>
                <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Custom Color</div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={boardColor}
                    onChange={(e) => setBoardColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-purple-500/30 cursor-pointer bg-transparent"
                  />
                  <div className="flex-1">
                    <div className="text-white text-sm font-mono">{boardColor}</div>
                    <div className="text-purple-400/60 text-xs">Tap to pick a color</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!isAuthenticated || !publicKey) {
                        showError('Authentication Error', 'Please reconnect your wallet');
                        return;
                      }
                      const colorGradient = `${boardColor},${boardColor}`;
                      const success = await updateProfile({ customBoardBackground: colorGradient, boardPresetId: null });
                      if (success) {
                        showSuccess('Applied', 'Board color updated');
                      } else {
                        showError('Update Failed', 'Failed to update board color');
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              {/* Upload Custom Image */}
              <div className="pt-2 border-t border-purple-500/20">
                <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Or Upload Image</div>
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
                <p className="text-purple-400/50 text-[10px] text-center mt-1">Max 5MB • JPG, PNG, GIF</p>
              </div>
            </div>
          )}
          
          {/* CARDS TAB */}
          {activeTab === 'cards' && (
            <div className="space-y-4">
              {/* Color Picker */}
              <div>
                <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Custom Color</div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={cardsColor}
                    onChange={(e) => setCardsColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-purple-500/30 cursor-pointer bg-transparent"
                  />
                  <div className="flex-1">
                    <div className="text-white text-sm font-mono">{cardsColor}</div>
                    <div className="text-purple-400/60 text-xs">Tap to pick a color</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!isAuthenticated || !publicKey) {
                        showError('Authentication Error', 'Please reconnect your wallet');
                        return;
                      }
                      const colorGradient = `${cardsColor},${cardsColor}`;
                      const success = await updateProfile({ customPropertyCardBackground: colorGradient, tilePresetId: null });
                      if (success) {
                        showSuccess('Applied', 'Card color updated');
                      } else {
                        showError('Update Failed', 'Failed to update card color');
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              {/* Upload Custom Image */}
              <div className="pt-2 border-t border-purple-500/20">
                <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Or Upload Image</div>
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
                <p className="text-purple-400/50 text-[10px] text-center mt-1">Max 3MB • JPG, PNG, GIF</p>
              </div>
            </div>
          )}
          
          {/* SCENE TAB */}
          {activeTab === 'scene' && (
            <div className="space-y-4">
              {/* Color Picker */}
              <div>
                <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Custom Color</div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={sceneColor}
                    onChange={(e) => setSceneColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-purple-500/30 cursor-pointer bg-transparent"
                  />
                  <div className="flex-1">
                    <div className="text-white text-sm font-mono">{sceneColor}</div>
                    <div className="text-purple-400/60 text-xs">Tap to pick a color</div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!isAuthenticated || !publicKey) {
                        showError('Authentication Error', 'Please reconnect your wallet');
                        return;
                      }
                      const colorGradient = `${sceneColor},${sceneColor}`;
                      const success = await updateProfile({ customSceneBackground: colorGradient });
                      if (success) {
                        showSuccess('Applied', 'Scene color updated');
                      } else {
                        showError('Update Failed', 'Failed to update scene color');
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
              
              {/* Upload Custom Image */}
              <div className="pt-2 border-t border-purple-500/20">
                <div className="text-purple-400/60 text-xs uppercase tracking-wider mb-2">Or Upload Image</div>
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
                <p className="text-purple-400/50 text-[10px] text-center mt-1">Max 5MB • JPG, PNG, GIF</p>
              </div>
            </div>
          )}
          
          {/* CORNERS TAB */}
          {activeTab === 'corners' && (
            <div className="space-y-3">
              <div className="text-purple-400/60 text-xs uppercase tracking-wider">Corner Square Style</div>
              <p className="text-purple-300/70 text-xs">Choose what to display in the corner squares.</p>
              
              {/* Side by side options */}
              <div className="grid grid-cols-2 gap-3">
                {/* Property Option */}
                <button
                  onClick={async () => {
                    if (!isAuthenticated || !publicKey) {
                      showError('Authentication Error', 'Please reconnect your wallet');
                      return;
                    }
                    const success = await updateProfile({ cornerSquareStyle: 'property' });
                    if (!success) {
                      showError('Update Failed', 'Failed to update corner style');
                    }
                  }}
                  className={`rounded-xl p-3 text-center transition-all ${
                    profile.cornerSquareStyle === 'property'
                      ? 'bg-purple-900/30 border-2 border-purple-400'
                      : 'bg-purple-900/20 border border-purple-500/20'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-lg bg-purple-800/50 border border-purple-500/30 flex items-center justify-center mb-2">
                    <span className="text-purple-300 text-[5px] leading-none text-center">DEFI<br/>POLY</span>
                  </div>
                  <div className="text-white text-xs font-medium">Property</div>
                  <div className="text-purple-400/60 text-[9px]">Default tiles</div>
                  {profile.cornerSquareStyle === 'property' && (
                    <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-[8px] mx-auto mt-2">✓</div>
                  )}
                </button>
                
                {/* Profile Option */}
                <button
                  onClick={async () => {
                    if (!isAuthenticated || !publicKey) {
                      showError('Authentication Error', 'Please reconnect your wallet');
                      return;
                    }
                    const success = await updateProfile({ cornerSquareStyle: 'profile' });
                    if (!success) {
                      showError('Update Failed', 'Failed to update corner style');
                    }
                  }}
                  className={`rounded-xl p-3 text-center transition-all ${
                    profile.cornerSquareStyle === 'profile'
                      ? 'bg-purple-900/30 border-2 border-purple-400'
                      : 'bg-purple-900/20 border border-purple-500/20'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-lg bg-purple-800/50 border border-purple-500/30 flex items-center justify-center overflow-hidden mb-2">
                    {profile.profilePicture ? (
                      <img src={getImageUrl(profile.profilePicture!)} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center text-sm">👤</div>
                    )}
                  </div>
                  <div className="text-white text-xs font-medium">Profile Pic</div>
                  <div className="text-purple-400/60 text-[9px]">Your avatar</div>
                  {profile.cornerSquareStyle === 'profile' && (
                    <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-[8px] mx-auto mt-2">✓</div>
                  )}
                </button>
              </div>
            
            </div>
          )}
          
          {/* WRITING TAB */}
          {activeTab === 'writing' && (
            <div className="space-y-3">
              <div className="text-purple-400/60 text-xs uppercase tracking-wider">Writing Style</div>
              <p className="text-purple-300/70 text-xs">Controls text color on property tiles.</p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Light Option */}
                <button
                  onClick={async () => {
                    if (!isAuthenticated || !publicKey) {
                      showError('Authentication Error', 'Please reconnect your wallet');
                      return;
                    }
                    const success = await updateProfile({ writingStyle: 'light' });
                    if (!success) {
                      showError('Update Failed', 'Failed to update writing style');
                    }
                  }}
                  className={`rounded-xl p-4 text-center transition-all ${
                    profile.writingStyle === 'light'
                      ? 'bg-purple-900/30 border-2 border-purple-400'
                      : 'bg-purple-900/20 border border-purple-500/20'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-lg bg-purple-800 border border-purple-500/30 flex items-center justify-center mb-2">
                    <span className="text-white text-lg font-bold">Aa</span>
                  </div>
                  <div className="text-white text-xs font-medium">Light</div>
                  <div className="text-purple-400/60 text-[9px]">White text</div>
                  {profile.writingStyle === 'light' && (
                    <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-[8px] mx-auto mt-2">✓</div>
                  )}
                </button>
                
                {/* Dark Option */}
                <button
                  onClick={async () => {
                    if (!isAuthenticated || !publicKey) {
                      showError('Authentication Error', 'Please reconnect your wallet');
                      return;
                    }
                    const success = await updateProfile({ writingStyle: 'dark' });
                    if (!success) {
                      showError('Update Failed', 'Failed to update writing style');
                    }
                  }}
                  className={`rounded-xl p-4 text-center transition-all ${
                    profile.writingStyle === 'dark'
                      ? 'bg-purple-900/30 border-2 border-purple-400'
                      : 'bg-purple-900/20 border border-purple-500/20'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-lg bg-gray-200 border border-purple-500/30 flex items-center justify-center mb-2">
                    <span className="text-gray-800 text-lg font-bold">Aa</span>
                  </div>
                  <div className="text-white text-xs font-medium">Dark</div>
                  <div className="text-purple-400/60 text-[9px]">Dark text</div>
                  {profile.writingStyle === 'dark' && (
                    <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-[8px] mx-auto mt-2">✓</div>
                  )}
                </button>
              </div>
            </div>
          )}
          
          </div>
        </div>
      </div>
    </div>
  );
}