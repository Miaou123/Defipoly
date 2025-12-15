'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Square } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNotification } from '@/contexts/NotificationContext';
import { clearProfileCache, getProfile } from '@/utils/profileStorage';
import { CornerSquare } from '../BoardHelpers';
import { authenticatedFetch } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/utils/config';

interface CornerSquareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCornerSquareStyle: 'property' | 'profile';
  onCornerSquareStyleChange: (style: 'property' | 'profile') => void;
}

export function CornerSquareModal({
  isOpen,
  onClose,
  currentCornerSquareStyle,
  onCornerSquareStyleChange
}: CornerSquareModalProps) {
  const { publicKey } = useWallet();
  const { showSuccess, showError } = useNotification();
  const [saving, setSaving] = useState(false);
  const [cornerSquareStyle, setCornerSquareStyle] = useState<'property' | 'profile'>(currentCornerSquareStyle);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const [customPropertyCardBackground, setCustomPropertyCardBackground] = useState<string | null>(null);
  
  // Load current user's profile for preview
  useEffect(() => {
    if (publicKey) {
      getProfile(publicKey.toString())
        .then(profile => {
          setCurrentProfilePicture(profile.profilePicture);
          setCornerSquareStyle(profile.cornerSquareStyle || 'property');
          setCustomPropertyCardBackground(profile.customPropertyCardBackground);
        })
        .catch(error => {
          console.error('Error loading profile for preview:', error);
        });
    }
  }, [publicKey]);
  
  // Save corner style to backend
  const saveCornerStyle = async (style: 'property' | 'profile') => {
    if (!publicKey) return;
    
    setSaving(true);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/profile/themes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          cornerSquareStyle: style,
        }),
      });
      
      if (response.ok) {
        // Clear cache so main page picks up the new corner style
        clearProfileCache(publicKey.toString());
        // Trigger a profile update event
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        onCornerSquareStyleChange(style);
        showSuccess('Saved', 'Corner style preference saved');
      } else {
        showError('Failed', 'Failed to save corner style preference');
      }
    } catch (error) {
      console.error('Error saving corner style:', error);
      showError('Error', 'Error saving corner style');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle corner style change
  const handleCornerStyleChange = (style: 'property' | 'profile') => {
    setCornerSquareStyle(style);
    saveCornerStyle(style);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
      <div 
        className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-md w-full overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-purple-100 flex items-center gap-2">
              <Square size={20} className="text-purple-300" />
              Corner Square Style
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
          
          {/* Corner Square Options */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Property Card Style Option */}
            <div 
              onClick={() => handleCornerStyleChange('property')}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                cornerSquareStyle === 'property' 
                  ? 'border-purple-500 bg-purple-500/20' 
                  : 'border-purple-500/30 bg-purple-800/10 hover:border-purple-500/50'
              }`}
            >
              <div className="text-sm text-purple-200 mb-3 font-medium text-center">Property Card</div>
              <div 
                className="w-full aspect-square rounded border-2 border-purple-500/30"
                style={{
                  background: customPropertyCardBackground 
                    ? (customPropertyCardBackground.startsWith('/uploads/') || customPropertyCardBackground.startsWith('http'))
                      ? `url(${customPropertyCardBackground}) center/cover`
                      : customPropertyCardBackground
                    : '#9333ea'
                }}
              />
              {!customPropertyCardBackground && (
                <p className="text-[10px] text-purple-400 mt-2 text-center">Uses property card theme</p>
              )}
            </div>

            {/* Profile Picture Style Option */}
            <div 
              onClick={() => handleCornerStyleChange('profile')}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                cornerSquareStyle === 'profile' 
                  ? 'border-purple-500 bg-purple-500/20' 
                  : 'border-purple-500/30 bg-purple-800/10 hover:border-purple-500/50'
              }`}
            >
              <div className="text-sm text-purple-200 mb-3 font-medium text-center">Profile Picture</div>
              <div className="w-full aspect-square">
                <CornerSquare 
                  icon="🎲" 
                  label="GO" 
                  bgColor="#8b5cf6"
                  profilePicture={currentProfilePicture}
                  cornerSquareStyle="profile"
                  customPropertyCardBackground={customPropertyCardBackground}
                />
              </div>
              {!currentProfilePicture && (
                <p className="text-[10px] text-purple-400 mt-2 text-center">No profile picture set</p>
              )}
            </div>
          </div>

          {/* Loading State */}
          {saving && (
            <div className="flex items-center justify-center mb-4">
              <div className="text-purple-400 text-sm">⏳ Saving...</div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center">
            <div className="text-xs text-purple-400">
              💡 This affects how corner squares (GO, Jail, etc.) appear on the board
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}