'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface HelpButtonHintProps {
  hasProperties: boolean;
  hasOpenedHelp: boolean;
  onDismiss: () => void;
}

export default function HelpButtonHint({ hasProperties, hasOpenedHelp, onDismiss }: HelpButtonHintProps) {
  const { connected } = useWallet();
  const [showHint, setShowHint] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Show hint only if:
    // 1. Wallet is connected
    // 2. User has no properties (new player)
    // 3. User hasn't opened help before
    // 4. Add a delay to not overwhelm new users
    if (connected && !hasProperties && !hasOpenedHelp) {
      const timer = setTimeout(() => {
        setShowHint(true);
        setIsAnimating(true);
      }, 8000); // Wait 8 seconds after wallet connection
      return () => clearTimeout(timer);
    } else {
      setShowHint(false);
      setIsAnimating(false);
    }
  }, [connected, hasProperties, hasOpenedHelp]);

  if (!showHint) return null;

  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{
        // POSITION CONTROLS - Adjust these values to move the arrow:
        // Desktop positioning
        ...(isMobile ? {} : {
          bottom: '80px', // Distance from bottom (increase to move up)
          right: '40px',  // Distance from right (increase to move left)
        }),
        // Mobile positioning  
        ...(isMobile ? {
          top: '120px',    // Distance from top (increase to move down)
          right: '13px',   // Distance from right (increase to move left)
        } : {}),
      }}
    >
      {/* Arrow only - no dialog */}
      <div className={`
        ${isAnimating ? 'animate-bounce' : ''}
      `}>
        <svg 
          width="40" 
          height="40" 
          viewBox="0 0 24 24" 
          fill="none"
          className="text-purple-400 drop-shadow-lg filter drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
        >
          <path 
            d="M12 2 L12 16 M12 16 L6 10 M12 16 L18 10" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}