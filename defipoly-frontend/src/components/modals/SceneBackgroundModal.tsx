'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from '@/contexts/NotificationContext';
import { authenticatedFetch } from '@/contexts/AuthContext';
import { clearProfileCache } from '@/utils/profileStorage';
import { THEME_CONSTANTS } from '@/utils/themeConstants';

interface SceneBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackground: string | null;
  onBackgroundChange: (bg: string | null) => void;
}

const GRADIENT_PRESETS = [
  {
    name: "Purple Night",
    value: THEME_CONSTANTS.DEFAULT_SCENE_BACKGROUND
  },
  {
    name: "Deep Space",
    value: "linear-gradient(180deg, #000000 0%, #0d0d1a 50%, #000000 100%)"
  },
  {
    name: "Sunset",
    value: "linear-gradient(180deg, #1a0a0a 0%, #2d1a1a 50%, #1a0505 100%)"
  },
  {
    name: "Ocean",
    value: "linear-gradient(180deg, #0a1015 0%, #0d1a2e 50%, #0a1520 100%)"
  },
  {
    name: "Forest",
    value: "linear-gradient(180deg, #0a150a 0%, #1a2e1a 50%, #0a150a 100%)"
  }
];

export function SceneBackgroundModal({
  isOpen,
  onClose,
  currentBackground,
  onBackgroundChange
}: SceneBackgroundModalProps) {
  const { publicKey } = useWallet();
  const { showSuccess, showError } = useNotification();
  const [saving, setSaving] = useState(false);
  const [customColor, setCustomColor] = useState('#0a0015');

  if (!isOpen) return null;

  const handleGradientSelect = async (gradientValue: string) => {
    if (!publicKey) {
      showError('No Wallet', 'Please connect your wallet first');
      return;
    }
    
    setSaving(true);
    try {
      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          customSceneBackground: gradientValue
        }),
      });

      if (response.ok) {
        onBackgroundChange(gradientValue);
        showSuccess('Applied', 'Scene background updated');
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showError('Failed', 'Failed to update scene background');
      }
    } catch (error) {
      console.error('Error updating scene background:', error);
      showError('Error', `Error updating scene background: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCustomColorApply = async () => {
    if (!publicKey) {
      showError('No Wallet', 'Please connect your wallet first');
      return;
    }
    
    setSaving(true);
    try {
      // Convert solid color to a gradient format that works with Canvas background
      const solidColorGradient = `linear-gradient(180deg, ${customColor} 0%, ${customColor} 100%)`;
      
      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          customSceneBackground: solidColorGradient
        }),
      });

      if (response.ok) {
        onBackgroundChange(solidColorGradient);
        showSuccess('Applied', 'Custom scene color applied');
        
        // Clear profile cache and trigger update
        clearProfileCache(publicKey.toString());
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        showError('Failed', 'Failed to apply custom scene color');
      }
    } catch (error) {
      console.error('Error applying custom scene color:', error);
      showError('Error', `Error applying custom scene color: ${error instanceof Error ? error.message : String(error)}`);
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
      const response = await authenticatedFetch(`${process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101'}/api/profile`, {
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
            {/* Gradient Presets */}
            <div>
              <div className="text-sm font-semibold text-purple-200 mb-3">Gradient Presets</div>
              <div className="grid grid-cols-1 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleGradientSelect(preset.value)}
                    disabled={saving}
                    className="flex items-center gap-2 p-2 bg-purple-800/30 hover:bg-purple-700/50 rounded border border-purple-500/20 transition-colors text-left"
                  >
                    <div 
                      className="w-6 h-6 rounded border border-purple-500/30"
                      style={{ background: preset.value }}
                    />
                    <span className="text-purple-100 text-sm">{preset.name}</span>
                  </button>
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
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded transition-colors text-white text-sm font-medium"
                >
                  {saving ? 'Applying...' : 'Apply'}
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
                background: currentBackground || THEME_CONSTANTS.DEFAULT_SCENE_BACKGROUND
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