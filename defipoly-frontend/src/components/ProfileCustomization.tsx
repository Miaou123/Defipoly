'use client';

import { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from '@/contexts/NotificationContext';
import { BoardThemeModal } from '@/components/modals/BoardThemeModal';
import { PropertyThemeModal } from '@/components/modals/PropertyThemeModal';
import { SceneBackgroundModal } from '@/components/modals/SceneBackgroundModal';
import { CornerSquareModal } from '@/components/modals/CornerSquareModal';
import { ThemePresetsModal } from '@/components/modals/ThemePresetsModal';
import { SimpleBoardPreview } from '@/components/SimpleBoardPreview';
import { clearProfileCache } from '@/utils/profileStorage';
import { Edit3, Camera } from 'lucide-react';
import { UserIcon, PaletteIcon, GameControllerIcon, HouseIcon, GalaxyIcon, RulerIcon, LightbulbIcon, XCircleIcon } from '@/components/icons/UIIcons';
import { authenticatedFetch } from '@/contexts/AuthContext';
import { THEME_CONSTANTS } from '@/utils/themeConstants';
import { ThemePreset, getSceneGradient, getBoardGradient, createGradientStyle, createSceneGradientStyle } from '@/utils/themePresets';
import { API_BASE_URL, getImageUrl } from '@/utils/config';

interface ProfileCustomizationProps {
  // Profile picture props
  profilePicture: string | null;
  setProfilePicture: (picture: string | null) => void;
  
  // Username props  
  username: string;
  setUsername: (username: string) => void;
  editingUsername: boolean;
  setEditingUsername: (editing: boolean) => void;
  tempUsername: string;
  setTempUsername: (username: string) => void;
  onSaveUsername: () => void;
  
  // Theme props
  boardTheme: string;
  setBoardTheme: (theme: string) => void;
  propertyCardTheme: string;
  setPropertyCardTheme: (theme: string) => void;
  customBoardBackground: string | null;
  setCustomBoardBackground: (bg: string | null) => void;
  customPropertyCardBackground: string | null;
  setCustomPropertyCardBackground: (bg: string | null) => void;
  customSceneBackground: string | null;
  setCustomSceneBackground: (bg: string | null) => void;
  boardPresetId: string | null;
  setBoardPresetId: (presetId: string | null) => void;
  tilePresetId: string | null;
  setTilePresetId: (presetId: string | null) => void;
  cornerSquareStyle: 'property' | 'profile';
  setCornerSquareStyle: (style: 'property' | 'profile') => void;
  writingStyle: 'light' | 'dark';
  setWritingStyle: (style: 'light' | 'dark') => void;
  
  // Wallet address
  walletAddress: string;
}


export function ProfileCustomization({
  profilePicture,
  setProfilePicture,
  username,
  setUsername,
  editingUsername,
  setEditingUsername,
  tempUsername,
  setTempUsername,
  onSaveUsername,
  boardTheme,
  setBoardTheme,
  propertyCardTheme,
  setPropertyCardTheme,
  customBoardBackground,
  setCustomBoardBackground,
  customPropertyCardBackground,
  setCustomPropertyCardBackground,
  customSceneBackground,
  setCustomSceneBackground,
  boardPresetId,
  setBoardPresetId,
  tilePresetId,
  setTilePresetId,
  cornerSquareStyle,
  setCornerSquareStyle,
  writingStyle,
  setWritingStyle,
  walletAddress
}: ProfileCustomizationProps) {
  const { publicKey } = useWallet();
  const { showSuccess, showError } = useNotification();
  
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showBoardThemeModal, setShowBoardThemeModal] = useState(false);
  const [showPropertyThemeModal, setShowPropertyThemeModal] = useState(false);
  const [showSceneBackgroundModal, setShowSceneBackgroundModal] = useState(false);
  const [showCornerSquareModal, setShowCornerSquareModal] = useState(false);
  const [showThemePresetsModal, setShowThemePresetsModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile picture removal
  const handleRemoveProfilePicture = async () => {
    if (!publicKey) return;
    
    try {
      // Delete from backend
      const response = await authenticatedFetch(`${API_BASE_URL}/api/profile/${publicKey.toString()}/picture`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setProfilePicture(null);
        // Clear profile cache so other components refresh
        clearProfileCache(publicKey.toString());
        // Trigger profile update event for other components
        window.dispatchEvent(new Event('profileUpdated'));
        showSuccess('Removed', 'Profile picture removed');
      } else {
        showError('Remove Failed', 'Failed to remove profile picture');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
      showError('Remove Error', 'Error removing profile picture');
    }
  };

  // Profile picture handlers
  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!publicKey) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showError('File Too Large', 'Please use an image under 2MB.');
      return;
    }

    setUploadingPicture(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', publicKey.toString());
      formData.append('uploadType', 'profile');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/api/profile/upload/picture`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Don't call setProfilePicture - it triggers another API save
        // The upload endpoint already saved it to the database
        // Just clear cache and trigger refresh
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
        showSuccess('Upload Success', 'Profile picture updated');
      } else {
        showError('Upload Failed', 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showError('Upload Error', 'Error uploading profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  // Get preview background for board
  const getBoardPreviewBackground = () => {
    if (customBoardBackground) {
      // Check if it's a color format (hex colors or gradient)
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (hexColorRegex.test(customBoardBackground)) {
        // Single hex color
        return customBoardBackground;
      } else if (customBoardBackground.includes(',') && 
                 customBoardBackground.split(',').every(c => hexColorRegex.test(c.trim()))) {
        // Gradient colors
        const colors = customBoardBackground.split(',').map(c => c.trim());
        return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
      } else {
        // Assume it's a URL
        return `url(${customBoardBackground})`;
      }
    }
    return THEME_CONSTANTS.DEFAULT_BOARD_BACKGROUND;
  };

  // Get preview background for property cards
  const getPropertyPreviewBackground = () => {
    if (customPropertyCardBackground) {
      // Check if it's a color format (hex colors)
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (hexColorRegex.test(customPropertyCardBackground)) {
        // Single hex color
        return customPropertyCardBackground;
      } else if (customPropertyCardBackground.includes(',') && 
                 customPropertyCardBackground.split(',').every(c => hexColorRegex.test(c.trim()))) {
        // Gradient colors
        const colors = customPropertyCardBackground.split(',').map(c => c.trim());
        return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
      } else {
        // Assume it's a URL
        return `url(${customPropertyCardBackground})`;
      }
    }
    return 'linear-gradient(135deg, rgba(74, 44, 90, 0.9), rgba(236, 72, 153, 0.7))';
  };

  // Get preview background for scene
  const getScenePreviewBackground = () => {
    if (customSceneBackground) {
      // Check if it's a color format (hex colors or gradient)
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (hexColorRegex.test(customSceneBackground)) {
        // Single hex color
        return customSceneBackground;
      } else if (customSceneBackground.includes(',') && 
                 customSceneBackground.split(',').every(c => hexColorRegex.test(c.trim()))) {
        // Gradient colors
        const colors = customSceneBackground.split(',').map(c => c.trim());
        return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
      } else {
        // Assume it's a URL
        return `url(${customSceneBackground})`;
      }
    }
    return THEME_CONSTANTS.DEFAULT_SCENE_BACKGROUND;
  };

  // Generate image from gradient colors
  const generateGradientImage = (colors: [string, string], width: number, height: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to get canvas context');
      
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'theme-preset.png', { type: 'image/png' });
          resolve(file);
        }
      }, 'image/png', 1.0);
    });
  };

  // Generate solid color image
  const generateSolidColorImage = (color: string, width: number, height: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Unable to get canvas context');
      
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'theme-preset-tile.png', { type: 'image/png' });
          resolve(file);
        }
      }, 'image/png', 1.0);
    });
  };

  // Handle preset reset to default
  const handlePresetReset = async () => {
    if (!publicKey) return;
    
    try {
      showSuccess('Resetting Themes', 'Restoring default theme settings...');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          customSceneBackground: null,
          customBoardBackground: null,
          customPropertyCardBackground: null
        }),
      });

      if (response.ok) {
        // Update local state
        setCustomSceneBackground(null);
        setCustomBoardBackground(null);
        setCustomPropertyCardBackground(null);
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
        
        showSuccess('Reset Complete', 'All themes reset to default');
      } else {
        showError('Failed', 'Failed to reset themes');
      }
    } catch (error) {
      console.error('Error resetting themes:', error);
      showError('Error', 'Error resetting themes');
    }
  };


  // Handle writing style change
  const handleWritingStyleChange = async (newStyle: 'light' | 'dark') => {
    if (!publicKey) return;
    
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/profile/writing-style`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          writingStyle: newStyle
        }),
      });

      if (response.ok) {
        setWritingStyle(newStyle);
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
        showSuccess('Updated', `Writing style changed to ${newStyle}`);
      } else {
        showError('Failed', 'Failed to update writing style');
      }
    } catch (error) {
      console.error('Error updating writing style:', error);
      showError('Error', 'Error updating writing style');
    }
  };

  const handleThemePresetApply = async (preset: ThemePreset) => {
    if (!publicKey) {
      showError('No Wallet', 'Please connect your wallet first');
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          boardPresetId: preset.id,
          tilePresetId: preset.id,
          customBoardBackground: `${preset.colors[0]},${preset.colors[1]}`, // Set board background as gradient
          customPropertyCardBackground: preset.colors[0], // Set property background as solid color
          customSceneBackground: `${preset.colors[0]},${preset.colors[1]}` // Set scene background as gradient
        }),
      });

      if (response.ok) {
        setBoardPresetId(preset.id);
        setTilePresetId(preset.id);
        setCustomBoardBackground(`${preset.colors[0]},${preset.colors[1]}`);
        setCustomPropertyCardBackground(preset.colors[0]);
        setCustomSceneBackground(`${preset.colors[0]},${preset.colors[1]}`);
        setBoardTheme('preset');
        setPropertyCardTheme('preset');
        showSuccess('Applied', `${preset.name} theme applied to all areas`);
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorText = await response.text();
        console.error('Theme preset API error:', errorText);
        showError('Failed', `Failed to apply theme preset: ${response.status}`);
      }
    } catch (error) {
      console.error('Error applying theme preset:', error);
      showError('Error', 'Error applying theme preset');
    }
  };

  return (
    <>
      {/* Profile Header */}
      <div className="text-center pb-5 mb-5 border-b border-purple-500/20">
        <div className="relative w-24 h-24 mx-auto mb-3 group">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden border-3 border-purple-500/30">
            {getImageUrl(profilePicture) ? (
              <img 
                src={getImageUrl(profilePicture)!} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-8 h-8 text-white" />
            )}
          </div>
          {/* Hover Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={20} className="text-white" />
          </div>
          
          {/* Remove Button */}
          {profilePicture && (
            <button
              onClick={handleRemoveProfilePicture}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors border-2 border-purple-900"
              title="Remove Profile Picture"
            >
              <XCircleIcon className="w-3 h-3 text-white" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,image/gif"
          onChange={handleProfilePictureUpload}
          className="hidden"
        />

        {/* Username */}
        {editingUsername ? (
          <div className="space-y-2 mb-3">
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-2 py-1 bg-purple-900/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-500 focus:outline-none focus:border-purple-400 text-xs text-center"
              maxLength={20}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={onSaveUsername}
                className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-500 rounded-md transition-colors text-xs font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingUsername(false);
                  setTempUsername(username);
                }}
                className="flex-1 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <div className="relative group">
              <div 
                className="cursor-pointer min-h-[32px] flex items-center justify-center px-3 py-1 rounded-lg hover:bg-purple-900/30 transition-colors"
                onClick={() => setEditingUsername(true)}
              >
                {username ? (
                  <div className="text-lg font-bold text-purple-100">{username}</div>
                ) : (
                  <div className="text-purple-500 italic text-sm">Click to set username</div>
                )}
                {/* Hover Edit Icon */}
                <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit3 size={12} className="text-purple-400" />
                </div>
              </div>
            </div>
            {/* Wallet Address below username */}
            <div className="text-[10px] font-mono text-purple-400 break-all px-2">
              {walletAddress}
            </div>
          </div>
        )}

      </div>

      {/* Theme Presets Section */}
      <div className="mb-3">
        <h3 className="text-xs font-bold text-purple-100 mb-2 text-center flex items-center justify-center gap-1">
          <PaletteIcon className="w-3 h-3" />
          Theme Presets
        </h3>
        <div className="max-w-32 mx-auto relative group cursor-pointer" onClick={() => setShowThemePresetsModal(true)}>
          <SimpleBoardPreview
            customSceneBackground={customSceneBackground}
            customBoardBackground={customBoardBackground}
            customPropertyCardBackground={customPropertyCardBackground}
            className="w-full aspect-square rounded-lg border-2 border-purple-500/30 transition-all group-hover:border-purple-400/60"
          />
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-white text-center">
              <Camera size={18} className="mx-auto mb-0.5" />
              <div className="text-[10px] font-medium">Choose Theme</div>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Section */}
      <div>
        <h3 className="text-xs font-bold text-purple-100 mb-2 text-center flex items-center justify-center gap-1">
          <PaletteIcon className="w-3 h-3" />
          Customize elements
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {/* Board Background */}
          <div className="text-center">
            <div className="text-[10px] text-purple-400 mb-1.5 font-semibold flex items-center gap-1 justify-center">
              <GameControllerIcon className="w-3 h-3" />
              Board
            </div>
            <div className="relative group">
              <div 
                className="w-full aspect-square rounded border-2 border-purple-500/25 overflow-hidden cursor-pointer"
                style={(() => {
                  const bgValue = getBoardPreviewBackground();
                  if (bgValue.startsWith('url(')) {
                    return {
                      backgroundImage: bgValue,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    };
                  } else {
                    return {
                      background: bgValue
                    };
                  }
                })()}
                onClick={() => setShowBoardThemeModal(true)}
              />
              {/* Hover Overlay */}
              <div 
                className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setShowBoardThemeModal(true)}
              >
                <Camera size={16} className="text-white" />
              </div>
            </div>
          </div>

          {/* Property Card Style */}
          <div className="text-center">
            <div className="text-[10px] text-purple-400 mb-1.5 font-semibold flex items-center gap-1 justify-center">
              <HouseIcon className="w-3 h-3" />
              Cards
            </div>
            <div className="relative group">
              <div 
                className="w-full aspect-square rounded border-2 border-purple-500/25 overflow-hidden cursor-pointer"
                style={(() => {
                  const bgValue = getPropertyPreviewBackground();
                  if (bgValue.startsWith('url(')) {
                    return {
                      backgroundImage: bgValue,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    };
                  } else {
                    return {
                      background: bgValue
                    };
                  }
                })()}
                onClick={() => setShowPropertyThemeModal(true)}
              />
              {/* Hover Overlay */}
              <div 
                className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setShowPropertyThemeModal(true)}
              >
                <Camera size={16} className="text-white" />
              </div>
            </div>
          </div>

          {/* Scene Background */}
          <div className="text-center">
            <div className="text-[10px] text-purple-400 mb-1.5 font-semibold flex items-center gap-1 justify-center">
              <GalaxyIcon className="w-3 h-3" />
              Scene
            </div>
            <div className="relative group">
              <div 
                className="w-full aspect-square rounded border-2 border-purple-500/25 overflow-hidden cursor-pointer"
                style={{ background: getScenePreviewBackground() }}
                onClick={() => setShowSceneBackgroundModal(true)}
              />
              <div 
                className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setShowSceneBackgroundModal(true)}
              >
                <Camera size={16} className="text-white" />
              </div>
            </div>
          </div>

          {/* Corner Square Style */}
          <div className="text-center">
            <div className="text-[10px] text-purple-400 mb-1.5 font-semibold flex items-center gap-1 justify-center">
              <RulerIcon className="w-3 h-3" />
              Corners
            </div>
            <div className="relative group">
              <div 
                className="w-full aspect-square rounded border-2 border-purple-500/25 overflow-hidden cursor-pointer bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center"
                onClick={() => setShowCornerSquareModal(true)}
              >
                <div className="text-white">
                  {cornerSquareStyle === 'profile' ? (
                    <UserIcon className="w-5 h-5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </div>
              <div 
                className="absolute inset-0 bg-black/60 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setShowCornerSquareModal(true)}
              >
                <Camera size={16} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Writing Style Section */}
      <div className="mt-3">
        <h3 className="text-xs font-bold text-purple-100 mb-2 text-center flex items-center justify-center gap-1">
          <LightbulbIcon className="w-3 h-3" />
          Writing Style
        </h3>
        <div className="flex gap-2 max-w-32 mx-auto">
          {/* Light Writing */}
          <button
            onClick={() => handleWritingStyleChange('light')}
            className={`flex-1 p-2 rounded-lg border-2 transition-all duration-200 ${
              writingStyle === 'light'
                ? 'border-purple-400 bg-purple-800/30'
                : 'border-purple-500/25 bg-purple-900/20 hover:border-purple-500/40'
            }`}
          >
            <div className="text-center">
              <div className="w-6 h-6 mx-auto mb-0.5 rounded-full bg-gray-800 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">Aa</span>
              </div>
              <div className="text-[9px] text-purple-300 font-semibold">Light</div>
            </div>
          </button>
          
          {/* Dark Writing */}
          <button
            onClick={() => handleWritingStyleChange('dark')}
            className={`flex-1 p-2 rounded-lg border-2 transition-all duration-200 ${
              writingStyle === 'dark'
                ? 'border-purple-400 bg-purple-800/30'
                : 'border-purple-500/25 bg-purple-900/20 hover:border-purple-500/40'
            }`}
          >
            <div className="text-center">
              <div className="w-6 h-6 mx-auto mb-0.5 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-black text-[10px] font-bold">Aa</span>
              </div>
              <div className="text-[9px] text-purple-300 font-semibold">Dark</div>
            </div>
          </button>
        </div>
        <div className="text-[9px] text-purple-500 text-center mt-2">
          Controls text color on property tiles
        </div>
      </div>

      {/* Tips */}
      <div className="mt-2 bg-purple-800/20 rounded-md p-1.5 border border-purple-500/10">
        <div className="text-[8px] text-purple-400 text-center">
          <div className="font-semibold flex items-center gap-0.5 justify-center">
            <LightbulbIcon className="w-2.5 h-2.5" />
            Upload custom backgrounds
          </div>
          <div className="text-purple-500">
            Board: 5MB • Cards: 3MB • Profile: 2MB
          </div>
        </div>
      </div>

      {/* Modals */}
      <BoardThemeModal
        isOpen={showBoardThemeModal}
        onClose={() => setShowBoardThemeModal(false)}
        currentTheme={boardTheme}
        customBackground={customBoardBackground}
        onThemeChange={setBoardTheme}
        onCustomBackgroundChange={setCustomBoardBackground}
      />

      <PropertyThemeModal
        isOpen={showPropertyThemeModal}
        onClose={() => setShowPropertyThemeModal(false)}
        currentTheme={propertyCardTheme}
        customBackground={customPropertyCardBackground}
        onThemeChange={setPropertyCardTheme}
        onCustomBackgroundChange={setCustomPropertyCardBackground}
      />

      <SceneBackgroundModal
        isOpen={showSceneBackgroundModal}
        onClose={() => setShowSceneBackgroundModal(false)}
        currentBackground={customSceneBackground}
        onBackgroundChange={setCustomSceneBackground}
      />

      <CornerSquareModal
        isOpen={showCornerSquareModal}
        onClose={() => setShowCornerSquareModal(false)}
        currentCornerSquareStyle={cornerSquareStyle}
        onCornerSquareStyleChange={setCornerSquareStyle}
      />

      <ThemePresetsModal
        isOpen={showThemePresetsModal}
        onClose={() => setShowThemePresetsModal(false)}
        onApply={handleThemePresetApply}
        onReset={handlePresetReset}
      />

    </>
  );
}