'use client';

import { useEffect } from 'react';
import { checkTailwindLoaded, debugCSS, reloadCSS } from '@/utils/cssDebug';

export function CSSLoadChecker() {
  useEffect(() => {
    const checkCSS = () => {
      const tailwindLoaded = checkTailwindLoaded();
      
      if (!tailwindLoaded) {
        console.warn('⚠️ Tailwind CSS not properly loaded, attempting reload...');
        reloadCSS();
        
        // Check again after a short delay
        setTimeout(() => {
          const recheckLoaded = checkTailwindLoaded();
          if (!recheckLoaded) {
            console.error('❌ CSS loading failed after reload attempt');
            debugCSS();
          } else {
            console.log('✅ CSS reload successful');
          }
        }, 100);
      } else {
        console.log('✅ CSS loaded successfully');
      }
    };

    // Check CSS on mount
    checkCSS();

    // Also check when the page becomes visible (in case of tab switching issues)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(checkCSS, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
}