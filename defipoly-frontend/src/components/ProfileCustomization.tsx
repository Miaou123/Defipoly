'use client';

import { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from '@/contexts/NotificationContext';
import { BoardThemeModal } from '@/components/modals/BoardThemeModal';
import { PropertyThemeModal } from '@/components/modals/PropertyThemeModal';
import { getBoardTheme, getPropertyCardTheme } from '@/utils/themes';
import { clearProfileCache } from '@/utils/profileStorage';
import { Edit3, Camera } from 'lucide-react';
import { authenticatedFetch } from '@/contexts/AuthContext';

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
  
  // Wallet address
  walletAddress: string;
}

const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101';

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
  walletAddress
}: ProfileCustomizationProps) {
  const { publicKey } = useWallet();
  const { showSuccess, showError } = useNotification();
  
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showBoardThemeModal, setShowBoardThemeModal] = useState(false);
  const [showPropertyThemeModal, setShowPropertyThemeModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function for property card preview background - INSIDE component so it has access to propertyCardTheme
  const getPropertyPreviewBackgroundGradient = () => {
    if (propertyCardTheme === 'default') {
      return 'linear-gradient(135deg, rgba(88, 28, 135, 0.8), rgba(109, 40, 217, 0.6))';
    } else if (propertyCardTheme === 'neon') {
      return 'linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.7))';
    } else if (propertyCardTheme === 'gold') {
      return 'linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.7))';
    } else if (propertyCardTheme === 'minimal') {
      return 'rgba(255, 255, 255, 0.95)';
    }
    return 'linear-gradient(to bottom right, rgba(31, 41, 55, 0.95), rgba(17, 24, 39, 0.9))';
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
        const data = await response.json();
        setProfilePicture(data.profilePicture);
        // Clear profile cache so other components refresh
        clearProfileCache(publicKey.toString());
        // Trigger profile update event for other components
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
      return `url(${customBoardBackground})`;
    }
    return getBoardTheme(boardTheme).boardBackground;
  };

  // Get preview background for property cards
  const getPropertyPreviewBackground = () => {
    if (customPropertyCardBackground) {
      return `url(${customPropertyCardBackground})`;
    }
    const theme = getPropertyCardTheme(propertyCardTheme);
    // Convert Tailwind classes to actual gradients
    if (propertyCardTheme === 'neon') {
      return 'linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.7))';
    } else if (propertyCardTheme === 'gold') {
      return 'linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.7))';
    } else if (propertyCardTheme === 'minimal') {
      return 'rgba(255, 255, 255, 0.95)';
    }
    // Default
    return 'linear-gradient(135deg, rgba(88, 28, 135, 0.8), rgba(109, 40, 217, 0.6))';
  };


  return (
    <>
      {/* Profile Header */}
      <div className="text-center pb-5 mb-5 border-b border-purple-500/20">
        <div className="relative w-24 h-24 mx-auto mb-3 group">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden border-3 border-purple-500/30">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl">👤</span>
            )}
          </div>
          {/* Hover Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={20} className="text-white" />
          </div>
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
              className="w-full px-3 py-1.5 bg-purple-900/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-500 focus:outline-none focus:border-purple-400 text-sm text-center"
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

      {/* Customization Section */}
      <div>
        <div className="grid grid-cols-2 gap-3">
          {/* Board Background */}
          <div className="text-center">
            <div className="text-[10px] text-purple-400 mb-1.5 font-semibold">🎮 Board</div>
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
            <div className="text-[10px] text-purple-400 mb-1.5 font-semibold">🏠 Cards</div>
            <div className="relative group">
              <div 
                className="w-full aspect-square rounded border-2 border-purple-500/25 overflow-hidden cursor-pointer"
                style={(() => {
                  if (propertyCardTheme === 'custom' && customPropertyCardBackground) {
                    return {
                      backgroundImage: `url(${customPropertyCardBackground})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    };
                  } else {
                    return {
                      background: getPropertyPreviewBackgroundGradient(),
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
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 bg-purple-800/20 rounded-md p-2 border border-purple-500/10">
        <div className="text-[9px] text-purple-400 text-center space-y-1">
          <div>
            <span className="font-semibold">💡</span> Upload custom backgrounds (images or GIFs)
          </div>
          <div className="text-purple-500">
            Board: max 5MB • Cards: max 3MB • Profile: max 2MB
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
    </>
  );
}