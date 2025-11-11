'use client';

import { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { compressImage } from '@/utils/profileStorage';
import { useNotification } from '@/contexts/NotificationContext';

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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101';

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
  setCustomPropertyCardBackground
}: ProfileCustomizationProps) {
  const { publicKey } = useWallet();
  const { showSuccess, showError } = useNotification();
  
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadingBoardTheme, setUploadingBoardTheme] = useState(false);
  const [uploadingPropertyTheme, setUploadingPropertyTheme] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const boardThemeInputRef = useRef<HTMLInputElement>(null);
  const propertyThemeInputRef = useRef<HTMLInputElement>(null);

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
      const compressedImage = await compressImage(file);
      
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          profilePicture: compressedImage,
        }),
      });

      if (response.ok) {
        setProfilePicture(compressedImage);
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

  const handleRemoveProfilePicture = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          profilePicture: null,
        }),
      });

      if (response.ok) {
        setProfilePicture(null);
        showSuccess('Removed', 'Profile picture removed');
      }
    } catch (error) {
      console.error('Error removing profile picture:', error);
    }
  };

  // Theme management functions
  const handleBoardThemeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingBoardTheme(true);

    try {
      const compressedImage = await compressImage(file);
      setCustomBoardBackground(compressedImage);
      setBoardTheme('custom');
      // TODO: Save to backend
      showSuccess('Upload Success', 'Board theme updated');
    } catch (error) {
      console.error('Error uploading board theme:', error);
      showError('Upload Error', 'Error uploading board theme');
    } finally {
      setUploadingBoardTheme(false);
    }
  };

  const handlePropertyThemeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingPropertyTheme(true);

    try {
      const compressedImage = await compressImage(file);
      setCustomPropertyCardBackground(compressedImage);
      setPropertyCardTheme('custom');
      // TODO: Save to backend
      showSuccess('Upload Success', 'Property card theme updated');
    } catch (error) {
      console.error('Error uploading property theme:', error);
      showError('Upload Error', 'Error uploading property theme');
    } finally {
      setUploadingPropertyTheme(false);
    }
  };

  const handleRemoveBoardTheme = () => {
    setCustomBoardBackground(null);
    setBoardTheme('classic');
    // TODO: Save to backend
    showSuccess('Removed', 'Board theme reset to default');
  };

  const handleRemovePropertyTheme = () => {
    setCustomPropertyCardBackground(null);
    setPropertyCardTheme('default');
    // TODO: Save to backend
    showSuccess('Removed', 'Property theme reset to default');
  };

  const getBoardThemePreview = () => {
    if (boardTheme === 'custom' && customBoardBackground) {
      return customBoardBackground;
    }
    const themeMap: Record<string, string> = {
      'classic': 'linear-gradient(135deg, rgba(12, 5, 25, 0.95), rgba(26, 11, 46, 0.9))',
      'ocean': 'linear-gradient(135deg, rgba(6, 78, 59, 0.95), rgba(17, 94, 89, 0.9))',
      'fire': 'linear-gradient(135deg, rgba(127, 29, 29, 0.95), rgba(154, 52, 18, 0.9))',
      'dark': 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(0, 0, 0, 0.9))',
    };
    return themeMap[boardTheme] || themeMap['classic'];
  };

  const getPropertyThemePreview = () => {
    if (propertyCardTheme === 'custom' && customPropertyCardBackground) {
      return customPropertyCardBackground;
    }
    const themeMap: Record<string, string> = {
      'default': 'linear-gradient(135deg, rgba(88, 28, 135, 0.8), rgba(109, 40, 217, 0.6))',
      'neon': 'linear-gradient(135deg, rgba(147, 51, 234, 0.9), rgba(236, 72, 153, 0.7))',
      'gold': 'linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.7))',
      'minimal': 'rgba(255, 255, 255, 0.95)',
    };
    return themeMap[propertyCardTheme] || themeMap['default'];
  };

  return (
    <div className="bg-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
      <h2 className="text-xl font-bold text-purple-100 mb-6 flex items-center gap-2">
        <span>🎨</span> Profile & Customization
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-semibold text-purple-200 mb-3 flex items-center gap-2">
            <span>👤</span> Profile Picture
          </h3>
          
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden border-4 border-purple-500/30 mb-3">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureUpload}
            className="hidden"
          />
          <div className="flex gap-2 w-full">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPicture}
              className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-xs disabled:opacity-50"
            >
              {uploadingPicture ? 'Uploading...' : profilePicture ? 'Change' : 'Upload'}
            </button>
            {profilePicture && (
              <button
                onClick={handleRemoveProfilePicture}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Username */}
          <div className="w-full mt-4 pt-4 border-t border-purple-500/20">
            {editingUsername ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 bg-purple-900/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-500 focus:outline-none focus:border-purple-400 text-xs"
                  maxLength={20}
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSaveUsername}
                    className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingUsername(false);
                      setTempUsername(username);
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs text-purple-400 mb-1">Username</div>
                {username ? (
                  <div className="text-sm font-bold text-purple-100 mb-2">{username}</div>
                ) : (
                  <div className="text-purple-500 italic text-xs mb-2">No username set</div>
                )}
                <button
                  onClick={() => setEditingUsername(true)}
                  className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-xs"
                >
                  {username ? 'Edit' : 'Set Username'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Board Background */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-semibold text-purple-200 mb-3 flex items-center gap-2">
            <span>🎮</span> Board Background
          </h3>
          
          <div 
            className="w-20 h-12 rounded-lg border-4 border-purple-500/30 mb-3 overflow-hidden relative bg-gray-800"
          >
            {customBoardBackground ? (
              <img 
                src={customBoardBackground} 
                alt="Board Theme" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-400 text-xs">
                Default
              </div>
            )}
          </div>

          <input
            ref={boardThemeInputRef}
            type="file"
            accept="image/*"
            onChange={handleBoardThemeUpload}
            className="hidden"
          />
          <div className="flex gap-2 w-full">
            <button
              onClick={() => boardThemeInputRef.current?.click()}
              disabled={uploadingBoardTheme}
              className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-xs disabled:opacity-50"
            >
              {uploadingBoardTheme ? 'Uploading...' : customBoardBackground ? 'Change' : 'Upload'}
            </button>
            {customBoardBackground && (
              <button
                onClick={handleRemoveBoardTheme}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Property Card Style */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-semibold text-purple-200 mb-3 flex items-center gap-2">
            <span>🏠</span> Property Cards
          </h3>
          
          <div 
            className="w-16 h-8 rounded border-2 border-purple-500/30 mb-3 overflow-hidden relative bg-gray-800"
          >
            {customPropertyCardBackground ? (
              <img 
                src={customPropertyCardBackground} 
                alt="Property Theme" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-400 text-xs">
                Default
              </div>
            )}
          </div>

          <input
            ref={propertyThemeInputRef}
            type="file"
            accept="image/*"
            onChange={handlePropertyThemeUpload}
            className="hidden"
          />
          <div className="flex gap-2 w-full">
            <button
              onClick={() => propertyThemeInputRef.current?.click()}
              disabled={uploadingPropertyTheme}
              className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-xs disabled:opacity-50"
            >
              {uploadingPropertyTheme ? 'Uploading...' : customPropertyCardBackground ? 'Change' : 'Upload'}
            </button>
            {customPropertyCardBackground && (
              <button
                onClick={handleRemovePropertyTheme}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 rounded-lg transition-colors text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-purple-800/20 rounded-lg p-4 border border-purple-500/10">
        <div className="text-xs text-purple-400 text-center">
          <span className="font-semibold">💡 Tip:</span> Images should be under 2MB and changes apply instantly to your game
        </div>
      </div>
    </div>
  );
}