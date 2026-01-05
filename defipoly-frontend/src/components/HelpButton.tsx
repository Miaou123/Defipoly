'use client';

import React from 'react';
import { QuestionMarkIcon } from './icons/UIIcons';

interface HelpButtonProps {
  onClick: () => void;
}

export default function HelpButton({ onClick }: HelpButtonProps) {
  const handleClick = () => {
    // Mark that help has been opened
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasOpenedHelp', 'true');
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event('helpOpened'));
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed z-40 group
                 md:w-14 md:h-14 w-8 h-8
                 md:bottom-8 md:right-8 bottom-auto right-4
                 md:top-auto top-40
                 bg-gradient-to-r from-purple-600 to-pink-500 
                 rounded-full shadow-lg
                 hover:scale-110 hover:shadow-purple-500/25 hover:shadow-2xl
                 transition-all duration-300 ease-out
                 border border-white/20 backdrop-blur-sm
                 flex items-center justify-center"
      aria-label="Open help documentation"
    >
      <QuestionMarkIcon 
        className="text-white drop-shadow-lg group-hover:text-purple-100 md:w-8 md:h-8 w-5 h-5" 
        size={20} 
      />
    </button>
  );
}