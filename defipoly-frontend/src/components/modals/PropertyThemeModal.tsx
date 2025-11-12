'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from '@/contexts/NotificationContext';

const PROPERTY_THEMES = [
  {
    id: 'default',
    name: 'Default Purple',
    preview: 'linear-gradient(135deg, rgba(88, 28, 135, 1), rgba(109, 40, 217, 1))',
    colors: ['#581C87', '#6D28D9']
  },
  {
    id: 'neon',
    name: 'Neon Pink',
    preview: 'linear-gradient(135deg, rgba(147, 51, 234, 1), rgba(236, 72, 153, 1))',
    colors: ['#9333EA', '#EC4899']
  },
  {
    id: 'gold',
    name: 'Golden Glow',
    preview: 'linear-gradient(135deg, rgba(251, 191, 36, 1), rgba(245, 158, 11, 1))',
    colors: ['#FBBF24', '#F59E0B']
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    preview: 'linear-gradient(135deg, rgba(16, 185, 129, 1), rgba(34, 197, 94, 1))',
    colors: ['#10B981', '#22C55E']
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    preview: 'linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(14, 165, 233, 1))',
    colors: ['#3B82F6', '#0EA5E9']
  },
  {
    id: 'fire',
    name: 'Fire Red',
    preview: 'linear-gradient(135deg, rgba(239, 68, 68, 1), rgba(220, 38, 38, 1))',
    colors: ['#EF4444', '#DC2626']
  },
  {
    id: 'minimal',
    name: 'Clean White',
    preview: 'rgba(255, 255, 255, 1)',
    colors: ['#FFFFFF', '#F3F4F6']
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    preview: 'linear-gradient(135deg, rgba(31, 41, 55, 1), rgba(17, 24, 39, 1))',
    colors: ['#1F2937', '#111827']
  }
];

interface PropertyThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  customBackground: string | null;
  onThemeChange: (theme: string) => void;
  onCustomBackgroundChange: (bg: string | null) => void;
}


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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleThemeSelect = (themeId: string) => {
    onThemeChange(themeId);
    onCustomBackgroundChange(null); // Clear custom background when selecting preset
  };

  const handleCustomUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!publicKey) return;
    
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Invalid File', 'Please upload an image file');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showError('File Too Large', 'Please use an image under 3MB.');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', publicKey.toString());
      formData.append('uploadType', 'card');
      formData.append('themeType', 'card');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101'}/api/profile/upload/theme`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onCustomBackgroundChange(data.backgroundUrl);
        onThemeChange('custom');
        showSuccess('Upload Success', 'Property card theme updated');
      } else {
        showError('Upload Failed', 'Failed to upload property theme');
      }
    } catch (error) {
      console.error('Error uploading property theme:', error);
      showError('Upload Error', 'Error uploading property theme');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCustom = () => {
    onCustomBackgroundChange(null);
    onThemeChange('default');
    showSuccess('Removed', 'Custom property theme removed');
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
            <span>🏠</span> Choose Property Card Style
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-purple-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preset Color Themes */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-purple-200 mb-3">Color Themes</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PROPERTY_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className={`relative p-3 rounded-lg border-2 transition-all group ${
                  currentTheme === theme.id && !customBackground
                    ? 'border-purple-400 shadow-lg shadow-purple-500/20'
                    : 'border-purple-500/30 hover:border-purple-400/50'
                }`}
              >
                <div
                  className="w-full h-16 rounded mb-2 border border-white/10"
                  style={{ background: theme.preview, aspectRatio: '3/4' }}
                />
                <div className="text-xs text-purple-200 text-center font-medium mb-1">
                  {theme.name}
                </div>
                {/* Color dots */}
                <div className="flex justify-center gap-1">
                  {theme.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-2 h-2 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                {currentTheme === theme.id && !customBackground && (
                  <div className="absolute top-1 right-1 text-purple-400">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Upload Section */}
        <div className="border-t border-purple-500/20 pt-6">
          <h3 className="text-sm font-semibold text-purple-200 mb-3">Custom Background</h3>
          
          {customBackground && (
            <div className="mb-4 p-3 bg-purple-800/20 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-8 rounded border border-purple-500/30"
                    style={{
                      backgroundImage: `url(${customBackground})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <span className="text-sm text-purple-200">Custom Background Active</span>
                </div>
                <button
                  onClick={handleRemoveCustom}
                  className="px-3 py-1 bg-red-600/80 hover:bg-red-600 rounded text-xs transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCustomUpload}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg transition-colors text-white font-medium"
          >
            {uploading ? 'Uploading...' : customBackground ? 'Change Custom Background' : 'Upload Custom Background'}
          </button>
        </div>

        {/* Preview Section */}
        <div className="mt-6 p-4 bg-purple-800/20 rounded-lg border border-purple-500/20">
          <h4 className="text-sm font-semibold text-purple-200 mb-2">Preview</h4>
          <div className="flex justify-center">
            <div
              className="w-20 h-24 rounded border-2 border-purple-400/30 flex items-center justify-center text-xs text-white font-medium"
              style={{
                backgroundImage: customBackground 
                  ? `url(${customBackground})`
                  : undefined,
                background: !customBackground 
                  ? PROPERTY_THEMES.find(t => t.id === currentTheme)?.preview || PROPERTY_THEMES[0].preview
                  : undefined,
                backgroundSize: customBackground ? 'cover' : undefined,
                backgroundPosition: customBackground ? 'center' : undefined,
                backgroundRepeat: customBackground ? 'no-repeat' : undefined
              }}
            >
              Property
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="text-xs text-purple-400">
            💡 These styles will apply to all property cards on the board
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}