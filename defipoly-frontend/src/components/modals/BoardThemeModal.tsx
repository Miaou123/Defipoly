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

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #1a0a2e, #171427)", // Purple Night
  "linear-gradient(135deg, #000000, #0d0d1a)", // Deep Space
  "linear-gradient(135deg, #1a0a0a, #2d1a1a)", // Sunset
  "linear-gradient(135deg, #0a1015, #0d1a2e)", // Ocean
  "linear-gradient(135deg, #0a150a, #1a2e1a)", // Forest
];


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

  const handleGradientSelect = async (gradientValue: string) => {
    if (!publicKey) {
      showError('No Wallet', 'Please connect your wallet first');
      return;
    }
    
    setUploading(true);
    try {
      // Generate gradient image instead of storing gradient string
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Unable to get canvas context');
      }
      
      // Create gradient from CSS string
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      
      // Parse gradient colors from CSS string
      const colorMatches = gradientValue.match(/#[0-9a-fA-F]{6}/g);
      if (colorMatches && colorMatches.length >= 2) {
        gradient.addColorStop(0, colorMatches[0]!);
        gradient.addColorStop(1, colorMatches[1]!);
      } else {
        // Fallback to solid color if parsing fails
        const singleColor = colorMatches?.[0] || '#1a0a2e';
        gradient.addColorStop(0, singleColor);
        gradient.addColorStop(1, singleColor);
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Convert to PNG blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png', 1.0);
      });
      const file = new File([blob], 'board-gradient.png', { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', publicKey.toString());
      formData.append('uploadType', 'board');
      formData.append('themeType', 'board');
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
        showSuccess('Applied', 'Board background updated');
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showError('Failed', 'Failed to update board background');
      }
    } catch (error) {
      console.error('Error updating board background:', error);
      showError('Error', `Error updating board background: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCustomColorApply = async () => {
    if (!publicKey) {
      showError('No Wallet', 'Please connect your wallet first');
      return;
    }
    
    setUploading(true);
    try {
      // Convert solid color to a gradient format
      const solidColorGradient = `linear-gradient(135deg, ${customColor}, ${customColor})`;
      
      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          customBoardBackground: solidColorGradient
        }),
      });

      if (response.ok) {
        onCustomBackgroundChange(solidColorGradient);
        showSuccess('Applied', 'Custom board color applied');
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showError('Failed', 'Failed to apply custom board color');
      }
    } catch (error) {
      console.error('Error applying custom board color:', error);
      showError('Error', `Error applying custom board color: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCustomUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!publicKey) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File Too Large', 'Please use an image under 5MB.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', publicKey.toString());
      formData.append('uploadType', 'board');
      formData.append('themeType', 'board');
      if (customBackground) {
        formData.append('oldBackgroundUrl', customBackground);
      }

      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile/upload/theme`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Board upload successful, setting background:', data.backgroundUrl);
        onCustomBackgroundChange(data.backgroundUrl);
        onThemeChange('custom');
        showSuccess('Upload Success', 'Board theme updated');
      } else {
        const errorData = await response.text();
        console.error('Upload failed:', errorData);
        
        // Try to parse error message for better user feedback
        let errorMessage = 'Failed to upload board theme';
        try {
          const errorObj = JSON.parse(errorData);
          if (errorObj.error) {
            if (errorObj.error.includes('database')) {
              errorMessage = 'Database error. Please try again later.';
            } else {
              errorMessage = errorObj.error;
            }
          }
        } catch {
          // If parsing fails, use default message
        }
        
        showError('Upload Failed', errorMessage);
      }
    } catch (error) {
      console.error('Error uploading board theme:', error);
      showError('Upload Error', 'Error uploading board theme');
    } finally {
      setUploading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!publicKey) {
      showError('No Wallet', 'Please connect your wallet first');
      return;
    }
    
    setUploading(true);
    try {
      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          customBoardBackground: null
        }),
      });

      if (response.ok) {
        onCustomBackgroundChange(null);
        showSuccess('Reset', 'Board background reset to default');
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showError('Failed', 'Failed to reset board background');
      }
    } catch (error) {
      console.error('Error resetting board background:', error);
      showError('Error', `Error resetting board background: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-2xl w-full overflow-hidden max-h-[80vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-purple-100 flex items-center gap-2">
            <span>🎮</span> Upload Board Background
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
            {/* Gradient Presets */}
            <div>
              <div className="text-sm font-semibold text-purple-200 mb-3">Gradient Presets</div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {GRADIENT_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handleGradientSelect(preset)}
                    disabled={uploading}
                    className="aspect-square rounded border border-purple-500/30 hover:border-purple-500/60 transition-colors"
                    style={{ background: preset }}
                    title={`Preset ${index + 1}`}
                  />
                ))}
              </div>
            </div>

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
                  onClick={handleCustomColorApply}
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
                onChange={handleCustomUpload}
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
                  JPG, PNG, GIF • Max 5MB
                </small>
              </div>

            {/* Reset Button */}
            {customBackground && (
              <div className="border-t border-purple-500/20 pt-3">
                <button
                  onClick={handleResetToDefault}
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 rounded transition-colors text-white text-sm"
                >
                  {uploading ? 'Resetting...' : 'Reset to Default'}
                </button>
              </div>
            )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-purple-800/20 rounded-lg border border-purple-500/20 p-2 flex items-center justify-center min-h-[240px]">
            <div 
              className="w-full h-40 rounded border-2 border-purple-500/30 max-w-[160px]"
              style={{
                background: customBackground || 'linear-gradient(135deg, #1a0a2e, #171427)'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="text-xs text-purple-400">
            💡 Images should be under 5MB for best performance
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}