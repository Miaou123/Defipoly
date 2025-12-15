'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from '@/contexts/NotificationContext';
import { authenticatedFetch } from '@/contexts/AuthContext';
import { clearProfileCache } from '@/utils/profileStorage';
import { API_BASE_URL } from '@/utils/config';
import { THEME_CONSTANTS } from '@/utils/themeConstants';
import { createSceneGradientStyle, parseGradient } from '@/utils/themePresets';

interface SceneBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackground: string | null;
  onBackgroundChange: (bg: string | null) => void;
}


export function SceneBackgroundModal({
  isOpen,
  onClose,
  currentBackground,
  onBackgroundChange
}: SceneBackgroundModalProps) {
  const { publicKey } = useWallet();
  const { showSuccess, showError } = useNotification();
  const [saving, setSaving] = useState(false);
  const [customColor1, setCustomColor1] = useState('#0a0015');
  const [customColor2, setCustomColor2] = useState('#1a0a2e');

  // Initialize colors from current background
  useEffect(() => {
    if (currentBackground) {
      const colors = parseGradient(currentBackground);
      if (colors) {
        setCustomColor1(colors[0]);
        setCustomColor2(colors[1]);
      }
    }
  }, [currentBackground]);

  if (!isOpen) return null;


  const handleGradientApply = async () => {
    if (!publicKey) {
      showError('No Wallet', 'Please connect your wallet first');
      return;
    }
    
    setSaving(true);
    try {
      // Store gradient colors in our format
      const gradientValue = `${customColor1},${customColor2}`;
      
      const response = await authenticatedFetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          customSceneBackground: gradientValue
        }),
      });

      if (response.ok) {
        onBackgroundChange(gradientValue);
        showSuccess('Applied', 'Scene gradient applied');
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showError('Failed', 'Failed to apply scene gradient');
      }
    } catch (error) {
      console.error('Error applying scene gradient:', error);
      showError('Error', `Error applying scene gradient: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!publicKey) {
      showError('No Wallet', 'Please connect your wallet first');
      return;
    }
    
    setSaving(true);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          customSceneBackground: null
        }),
      });

      if (response.ok) {
        onBackgroundChange(null);
        showSuccess('Reset', 'Scene background reset to default');
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showError('Failed', 'Failed to reset scene background');
      }
    } catch (error) {
      console.error('Error resetting scene background:', error);
      showError('Error', `Error resetting scene background: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
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
            <span>🌌</span> Scene Background
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
          <div className="flex flex-col gap-4">
            {/* Gradient Colors */}
            <div>
              <div className="text-sm font-semibold text-purple-200 mb-3">Scene Gradient Colors</div>
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-purple-400 w-16">Top:</label>
                  <input
                    type="color"
                    value={customColor1}
                    onChange={(e) => setCustomColor1(e.target.value)}
                    className="w-9 h-9 rounded border-2 border-purple-500/30 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs text-purple-400 font-mono">{customColor1}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-purple-400 w-16">Middle:</label>
                  <input
                    type="color"
                    value={customColor2}
                    onChange={(e) => setCustomColor2(e.target.value)}
                    className="w-9 h-9 rounded border-2 border-purple-500/30 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs text-purple-400 font-mono">{customColor2}</span>
                </div>
                <button
                  onClick={handleGradientApply}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded transition-colors text-white text-sm font-medium"
                >
                  {saving ? 'Applying...' : 'Apply Gradient'}
                </button>
              </div>
            </div>

            {/* Reset Button */}
            {currentBackground && (
              <div className="border-t border-purple-500/20 pt-3">
                <button
                  onClick={handleResetToDefault}
                  disabled={saving}
                  className="w-full px-3 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 rounded transition-colors text-white text-sm"
                >
                  {saving ? 'Resetting...' : 'Reset to Default'}
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-purple-800/20 rounded-lg border border-purple-500/20 p-2 flex items-center justify-center min-h-[300px]">
            <div 
              className="w-full h-48 rounded border-2 border-purple-500/30 max-w-[160px]"
              style={{
                background: currentBackground 
                  ? createSceneGradientStyle(currentBackground)
                  : THEME_CONSTANTS.DEFAULT_SCENE_BACKGROUND
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="text-xs text-purple-400">
            🌌 Changes the 3D scene background behind the board
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}