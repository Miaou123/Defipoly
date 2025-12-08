'use client';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Home } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from '@/contexts/NotificationContext';
import { clearProfileCache } from '@/utils/profileStorage';
import { authenticatedFetch } from '@/contexts/AuthContext';

interface PropertyThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  customBackground: string | null;
  onThemeChange: (theme: string) => void;
  onCustomBackgroundChange: (bg: string | null) => void;
}

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #9333ea, #ec4899)", // Purple Night
  "linear-gradient(135deg, #000000, #1e1e1e)", // Deep Space
  "linear-gradient(135deg, #dc2626, #fb923c)", // Sunset
  "linear-gradient(135deg, #0891b2, #064e3b)", // Ocean
  "linear-gradient(135deg, #22c55e, #15803d)", // Forest
];

export function PropertyThemeModal({
  isOpen,
  onClose,
  currentTheme,
  customBackground,
  onThemeChange,
  onCustomBackgroundChange
}: PropertyThemeModalProps) {
  const { publicKey } = useWallet();
  const { showSuccess, showError } = useNotification();
  const [customColor, setCustomColor] = useState('#9333ea');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      canvas.height = 300;
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
        const singleColor = colorMatches?.[0] || '#9333ea';
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
      const file = new File([blob], 'gradient-theme.png', { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', publicKey.toString());
      formData.append('uploadType', 'card');
      formData.append('themeType', 'card');
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
        showSuccess('Applied', 'Property card background updated');
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showError('Failed', 'Failed to update property card background');
      }
    } catch (error) {
      console.error('Error updating property card background:', error);
      showError('Error', `Error updating property card background: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCustomColorApply = async (colorOrGradient?: string) => {
    const finalColor = colorOrGradient || customColor;
    if (!publicKey) {
      showError('No Wallet', 'Please connect your wallet first');
      return;
    }
    
    setUploading(true);
    try {
      // Check if we have an auth token
      const token = localStorage.getItem('defipoly_auth_token');
      if (!token) {
        showError('Not Authenticated', 'Please refresh the page and try again');
        return;
      }

      // Create a 100x100 PNG with the selected color
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Unable to get canvas context');
      }
      
      // Fill the canvas with the selected color or create a simple gradient representation
      if (colorOrGradient && colorOrGradient.includes('gradient')) {
        // For gradients, use a simple solid color representation
        ctx.fillStyle = '#9333ea'; // Purple as default for gradients
      } else {
        ctx.fillStyle = finalColor;
      }
      ctx.fillRect(0, 0, 100, 100);
      
      // Convert to PNG blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png', 1.0);
      });
      const file = new File([blob], 'color-theme.png', { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', publicKey.toString());
      formData.append('uploadType', 'card');
      formData.append('themeType', 'card');
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
        onThemeChange('custom');
        showSuccess('Applied', 'Custom color applied');
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
      showError('Invalid file', 'Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('File too large', 'Please select an image under 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', publicKey.toString());
      formData.append('uploadType', 'card');
      formData.append('themeType', 'card');
      if (customBackground) {
        formData.append('oldBackgroundUrl', customBackground);
      }

      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile/upload/theme`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🎯 [PropertyThemeModal] Upload response:', data);
        console.log('🎯 [PropertyThemeModal] Background URL:', data.backgroundUrl);
        onCustomBackgroundChange(data.backgroundUrl);
        onThemeChange('custom');
        showSuccess('Upload Success', 'Property cards theme updated');
      } else {
        const errorData = await response.text();
        console.error('Upload failed:', errorData);
        showError('Upload Failed', 'Failed to upload property cards theme');
      }
    } catch (error) {
      console.error('Error uploading property cards theme:', error);
      showError('Upload Error', 'Error uploading property cards theme');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCustom = async () => {
    if (!publicKey) return;
    
    console.log('🗑️ [PropertyThemeModal] Removing custom background:', customBackground);
    
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
      
      // Save to backend - set customPropertyCardBackground to null
      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          customPropertyCardBackground: null
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
      onThemeChange('dark');
      showSuccess('Removed', 'Custom background removed');
      
    } catch (error) {
      console.error('Error removing property card background:', error);
      showError('Remove Failed', 'Failed to remove custom background');
    }
  };

  if (!isOpen) return null;

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
              <Home size={20} className="text-purple-300" />
              Customize Property Cards
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
                  className="w-full px-3 py-2 bg-red-600/80 hover:bg-red-600 rounded transition-colors text-white text-xs"
                >
                  Remove Background
                </button>
              )}
            </div>

            {/* Preview */}
            <div className="bg-purple-800/20 rounded-lg border border-purple-500/20 p-2 flex items-center justify-center min-h-[240px]">
              <div 
                className="w-full h-40 rounded border-2 border-purple-500/30 max-w-[120px]"
                style={{
                  background: customBackground 
                    ? `url(${customBackground}) center/cover`
                    : customColor
                }}
              />
            </div>
          </div>


          {/* Footer */}
          <div className="text-center">
            <div className="text-xs text-purple-400">
              💡 Your custom style will apply to all property cards on the board
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}