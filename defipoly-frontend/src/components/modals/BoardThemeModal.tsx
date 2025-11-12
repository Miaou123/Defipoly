'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from '@/contexts/NotificationContext';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;


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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3101'}/api/profile/upload/theme`, {
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
        showError('Upload Failed', 'Failed to upload board theme');
      }
    } catch (error) {
      console.error('Error uploading board theme:', error);
      showError('Upload Error', 'Error uploading board theme');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCustom = () => {
    onCustomBackgroundChange(null);
    onThemeChange('default');
    showSuccess('Removed', 'Custom board theme removed');
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


        {/* Custom Upload Section */}
        <div className="border-t border-purple-500/20 pt-6">
          <h3 className="text-sm font-semibold text-purple-200 mb-3">Custom Background</h3>
          
          {customBackground && (
            <div className="mb-4 p-3 bg-purple-800/20 rounded-lg border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-10 rounded border border-purple-500/30"
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

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="text-xs text-purple-400">
            💡 Images should be under 2MB for best performance
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}