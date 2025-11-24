'use client';

import { useState, useEffect } from 'react';

interface MobileBlockerProps {
  children: React.ReactNode;
}

export function MobileBlocker({ children }: MobileBlockerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024 ;
      setIsMobile(mobile);
      setChecked(true);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render anything until we've checked
  if (!checked) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-black to-purple-900 flex items-center justify-center p-6">
        {/* Glowing orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <img 
            src="/logo.svg" 
            alt="Defipoly Logo" 
            className="w-32 h-32 mx-auto mb-8 object-contain"
          />

          {/* Message */}
          <h1 className="text-2xl font-bold text-white mb-4">
            Desktop Only
          </h1>
          <p className="text-purple-300 mb-8 leading-relaxed">
            Defipoly is not yet available on mobile devices. 
            Please visit us on a desktop or laptop computer for the full experience.
          </p>

          {/* Twitter Link */}
          
           <a href="https://x.com/defipoly_sol"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold text-white transition-all transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Follow @defipoly_sol
          </a>

          <p className="text-purple-500 text-sm mt-6">
            Follow us for updates on mobile support!
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}