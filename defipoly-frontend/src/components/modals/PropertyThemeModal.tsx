'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from '@/contexts/NotificationContext';

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
  const [customColor, setCustomColor] = useState('#9333ea');
  const [activeTab, setActiveTab] = useState<'color' | 'image'>('color');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomColorApply = () => {
    onCustomBackgroundChange(`data:image/svg+xml,${encodeURIComponent(`
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="${customColor}" />
      </svg>
    `)}`);
    onThemeChange('custom');
    showSuccess('Applied', 'Custom color applied');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Invalid file', 'Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showError('File too large', 'Please select an image under 5MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onCustomBackgroundChange(result);
        onThemeChange('custom');
        showSuccess('Applied', 'Custom image applied');
        setUploading(false);
      };
      reader.onerror = () => {
        showError('Upload failed', 'Failed to read the image file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showError('Upload failed', 'An error occurred while uploading');
      setUploading(false);
    }
  };

  const handleRemoveCustom = () => {
    onCustomBackgroundChange(null);
    onThemeChange('dark');
    showSuccess('Removed', 'Custom background removed');
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
            <span>🎨</span> Customize Property Cards
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-purple-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6">
          <button
            onClick={() => setActiveTab('color')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-l-lg border transition-colors ${
              activeTab === 'color'
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-purple-800/20 border-purple-500/30 text-purple-300 hover:bg-purple-700/30'
            }`}
          >
            🎨 Solid Color
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-3 px-4 text-sm font-medium rounded-r-lg border transition-colors ${
              activeTab === 'image'
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-purple-800/20 border-purple-500/30 text-purple-300 hover:bg-purple-700/30'
            }`}
          >
            🖼️ Custom Image
          </button>
        </div>

        {/* Color Tab */}
        {activeTab === 'color' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm text-purple-200 block mb-2">Choose Color</label>
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-full h-16 rounded-lg border-2 border-purple-500/30 bg-transparent cursor-pointer"
              />
            </div>
            
            {/* Preview */}
            <div className="p-4 bg-purple-800/20 rounded-lg border border-purple-500/20">
              <div className="text-sm text-purple-200 mb-3">Preview</div>
              <div className="flex justify-center">
                <div 
                  className="w-20 h-20 rounded border-2 border-purple-400/30 flex items-center justify-center text-xs text-white font-medium"
                  style={{
                    backgroundColor: customColor
                  }}
                >
                  Property
                </div>
              </div>
            </div>
            
            <button
              onClick={handleCustomColorApply}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-white font-medium"
            >
              Apply Solid Color
            </button>
          </div>
        )}

        {/* Image Tab */}
        {activeTab === 'image' && (
          <div className="space-y-6">
            <div>
              <label className="text-sm text-purple-200 block mb-2">Upload Image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-16 border-2 border-dashed border-purple-500/30 rounded-lg flex items-center justify-center gap-2 text-purple-300 hover:border-purple-400/50 hover:text-purple-200 transition-colors disabled:opacity-50"
              >
                <Upload size={20} />
                {uploading ? 'Uploading...' : 'Click to upload image'}
              </button>
              <div className="text-xs text-purple-400 mt-2">
                Supported formats: JPG, PNG, GIF • Max size: 5MB
              </div>
            </div>

            {/* Preview */}
            {customBackground && (
              <div className="p-4 bg-purple-800/20 rounded-lg border border-purple-500/20">
                <div className="text-sm text-purple-200 mb-3">Current Custom Background</div>
                <div className="flex justify-center">
                  <div 
                    className="w-20 h-20 rounded border-2 border-purple-400/30 flex items-center justify-center text-xs text-white font-medium"
                    style={{
                      background: `url(${customBackground}) center/cover`
                    }}
                  >
                    Property
                  </div>
                </div>
                <button
                  onClick={handleRemoveCustom}
                  className="w-full mt-4 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-colors text-red-300 text-sm"
                >
                  Remove Custom Background
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
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