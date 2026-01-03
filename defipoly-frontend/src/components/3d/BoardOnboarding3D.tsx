'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { PointerArrowIcon } from '@/components/icons/UIIcons';
import * as THREE from 'three';

interface BoardOnboarding3DProps {
  hasProperties: boolean;
  showClaimHint?: boolean;
  onClaimHintDismiss?: () => void;
  onStartShowcase?: () => void;
  spectatorMode?: boolean;
}

/**
 * BoardOnboarding3D - Foreground UI overlays for onboarding
 * 
 * States:
 * - Not connected: Title + Connect Wallet button (fullscreen centered)
 * - Connected, no properties: Properties will show golden glow (handled in PropertyTile)
 * - Has properties: Nothing rendered (bank claim handled separately)
 */
export function BoardOnboarding3D({ hasProperties, showClaimHint = false, onClaimHintDismiss, onStartShowcase, spectatorMode }: BoardOnboarding3DProps) {
  // Early return for spectator mode - no overlay
  if (spectatorMode) return null;
  
  const { connected } = useWallet();
  const { visible: walletModalVisible, setVisible } = useWalletModal();
  const [showPropertyHint, setShowPropertyHint] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasOpenedModal, setHasOpenedModal] = useState(false);

  // Handle visibility transitions
  useEffect(() => {
    if (connected) {
      // Fade out the connect UI
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [connected]);

  // Check if user has already opened a property modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasOpened = localStorage.getItem('hasOpenedPropertyModal') === 'true';
      setHasOpenedModal(hasOpened);
      
      // Listen for storage changes to update immediately
      const handleStorageChange = () => {
        const hasOpened = localStorage.getItem('hasOpenedPropertyModal') === 'true';
        setHasOpenedModal(hasOpened);
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Also listen for custom event for same-tab updates
      const handleCustomEvent = () => {
        const hasOpened = localStorage.getItem('hasOpenedPropertyModal') === 'true';
        setHasOpenedModal(hasOpened);
      };
      
      window.addEventListener('propertyModalOpened', handleCustomEvent);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('propertyModalOpened', handleCustomEvent);
      };
    }
    return undefined;
  }, []);

  // Show property hint after delay when connected but no properties and hasn't opened modal
  useEffect(() => {
    if (connected && !hasProperties && !hasOpenedModal) {
      const timer = setTimeout(() => {
        setShowPropertyHint(true);
      }, 5000); // Wait 5 seconds to not feel harassed
      return () => clearTimeout(timer);
    } else {
      setShowPropertyHint(false);
      return undefined;
    }
  }, [connected, hasProperties, hasOpenedModal]);

  // Not connected - show title and connect button (except on mobile)
  // BUT hide if wallet modal is open
  if (!connected && !walletModalVisible && typeof window !== 'undefined' && window.innerWidth > 768) {
    return (
      <Html
        fullscreen
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '8vh',
          height: '100%',
          pointerEvents: 'none',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            pointerEvents: 'auto',
          }}
        >
          {/* Title */}
          <div
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: 'clamp(36px, 8vw, 64px)',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #a855f7, #06b6d4, #a855f7)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite',
              filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 40px rgba(6, 182, 212, 0.5))',
            }}
          >
            DEFIPOLY
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 'clamp(14px, 2vw, 18px)',
              color: 'rgba(255,255,255,0.8)',
              marginTop: '-10px',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            Connect your wallet to start playing
          </div>

          {/* Buttons container - side by side */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {/* Connect button */}
            <button
              onClick={() => setVisible(true)}
              style={{
                background: 'linear-gradient(135deg, #9333ea, #7c3aed, #db2777)',
                border: '2px solid rgba(168, 85, 247, 0.5)',
                borderRadius: '20px',
                padding: '18px 32px',
                color: 'white',
                fontSize: 'clamp(16px, 2vw, 20px)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 0 40px rgba(147, 51, 234, 0.5), 0 8px 30px rgba(0,0,0,0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.boxShadow = '0 0 60px rgba(147, 51, 234, 0.7), 0 12px 40px rgba(0,0,0,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(147, 51, 234, 0.5), 0 8px 30px rgba(0,0,0,0.4)';
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
                <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
              </svg>
              Connect Wallet
            </button>

            {/* Showcase button */}
            {onStartShowcase && (
              <button
                onClick={onStartShowcase}
                style={{
                  background: 'transparent',
                  border: '2px solid rgba(168, 85, 247, 0.5)',
                  borderRadius: '16px',
                  padding: '18px 24px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: 'clamp(14px, 1.8vw, 18px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(168, 85, 247, 0.2)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.8)';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(168, 85, 247, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.2)';
                }}
              >
                <span style={{ fontSize: '18px' }}>🎬</span>
                Watch Demo
              </button>
            )}
          </div>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
          }
        `}</style>
      </Html>
    );
  }

  // For connected users, the hints will be handled by:
  // - Golden property glow (implemented in PropertyTile component)
  // - Bank claim hint (handled separately)
  return null;
}
