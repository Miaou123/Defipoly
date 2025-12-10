'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from '@/contexts/NotificationContext';
import { authenticatedFetch } from '@/contexts/AuthContext';
import { clearProfileCache } from '@/utils/profileStorage';

interface BoardThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  customBackground: string | null;
  onThemeChange: (theme: string) => void;
  onCustomBackgroundChange: (bg: string | null) => void;
}



export function BoardThemeModal({
  isOpen,
  onClose,
  currentTheme,
  customBackground,
  onThemeChange,
  onCustomBackgroundChange
}: BoardThemeModalProps) {
  const { publicKey } = useWallet();
  const { showSuccess, showError } = useNotification();
  const [uploading, setUploading] = useState(false);
  const [customColor, setCustomColor] = useState('#9333ea');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;


  const handleCustomColorApply = async () => {
    if (!publicKey) {
      showError('No Wallet', 'Please connect your wallet first');
      return;
    }
    
    setUploading(true);
    try {
      // Store as gradient format for consistency
      const colorGradient = `${customColor},${customColor}`;
      
      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          customBoardBackground: colorGradient,
          boardPresetId: null // Clear preset when using custom color
        }),
      });

      if (response.ok) {
        onCustomBackgroundChange(colorGradient);
        onPresetChange(null); // Clear preset when using custom color
        onThemeChange('custom');
        showSuccess('Applied', 'Custom color applied');
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showError('Failed', 'Failed to apply custom color');
      }
    } catch (error) {
      console.error('Error applying custom color:', error);
      showError('Error', `Error applying custom color: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!publicKey) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Please select an image under 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', publicKey.toString());
      formData.append('uploadType', 'board');
      formData.append('themeType', 'board');
      formData.append('boardPresetId', ''); // Clear preset when uploading custom image
      if (customBackground) {
        formData.append('oldBackgroundUrl', customBackground);
      }

      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile/upload/theme`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onCustomBackgroundChange(data.backgroundUrl);
        onPresetChange(null); // Clear preset when uploading custom image
        onThemeChange('custom');
        showSuccess('Upload Success', 'Board theme updated');
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorData = await response.text();
        console.error('Upload failed:', errorData);
        showError('Upload Failed', 'Failed to upload board theme');
      }
    } catch (error) {
      console.error('Error uploading board theme:', error);
      showError('Upload Error', 'Error uploading board theme');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCustom = async () => {
    if (!publicKey) return;
    
    try {
      // Delete the file from server if it's an upload
      if (customBackground && customBackground.startsWith('/uploads/')) {
        await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile/upload/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: publicKey.toString(),
            fileUrl: customBackground,
          }),
        });
      }
      
      // Save to backend - set customBoardBackground to null
      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          customBoardBackground: null,
          boardPresetId: null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove background from backend');
      }
      
      // Clear cache and trigger updates
      clearProfileCache(publicKey.toString());
      window.dispatchEvent(new Event('profileUpdated'));
      
      // Update local state
      onCustomBackgroundChange(null);
      onPresetChange(null);
      onThemeChange('dark');
      showSuccess('Removed', 'Custom background removed');
      
    } catch (error) {
      console.error('Error removing board background:', error);
      showError('Remove Failed', 'Failed to remove custom background');
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-[600px] w-full overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-purple-100 flex items-center gap-2">
              <span>🎮</span>
              Customize Board Background
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-purple-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Separator Line */}
          <div className="border-t border-purple-500/20 mb-6"></div>
          
          {/* Content Row */}
          <div className="grid grid-cols-2 gap-5 mb-4">
            {/* Controls */}
            <div className="flex flex-col gap-3">

              {/* Solid Color */}
              <div className="border-t border-purple-500/20 pt-3">
                <div className="text-sm font-semibold text-purple-200 mb-3">Solid Color</div>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-9 h-9 rounded border-2 border-purple-500/30 bg-transparent cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      handleCustomColorApply().catch(console.error);
                    }}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded transition-colors text-white text-sm font-medium"
                  >
                    {uploading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </div>

              {/* Custom Image */}
              <div className="border-t border-purple-500/20 pt-3">
                <div className="text-sm font-semibold text-purple-200 mb-3">Custom Image</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-500/30 rounded-lg p-4 text-center bg-purple-800/20 cursor-pointer hover:border-purple-500/50 transition-colors"
                >
                  <p className="text-purple-200 text-xs mb-1">
                    {uploading ? '⏳ Uploading...' : '📤 Click to upload'}
                  </p>
                  <small className="text-purple-400 text-[10px]">
                    JPG, PNG, GIF, SVG • Max 5MB
                  </small>
                </div>
              </div>

              {/* Remove Button */}
              {customBackground && (
                <button
                  onClick={handleRemoveCustom}
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 rounded transition-colors text-white text-xs"
                >
                  {uploading ? 'Removing...' : 'Remove Background'}
                </button>
              )}
            </div>

            {/* Preview */}
            <div className="bg-purple-800/20 rounded-lg border border-purple-500/20 p-2 flex items-center justify-center min-h-[240px]">
              <div 
                className="w-full h-40 rounded border-2 border-purple-500/30 max-w-[120px]"
                style={{
                  background: (() => {
                    if (!customBackground) return 'linear-gradient(135deg, #1a0a2e, #171427)';
                    // Check if it's a gradient format (contains comma)
                    if (customBackground.includes(',')) {
                      const colors = customBackground.split(',');
                      return `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
                    }
                    // Otherwise assume it's an image URL
                    return `url(${customBackground}) center/cover`;
                  })()
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <div className="text-xs text-purple-400">
              💡 Your custom board background will be visible during gameplay
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}