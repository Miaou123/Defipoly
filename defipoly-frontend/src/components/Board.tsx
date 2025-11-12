'use client';

import { useState } from 'react';
import { PROPERTIES } from '@/utils/constants';
import { PropertyCard } from './PropertyCard';
import { RewardsPanel } from './RewardsPanel';
import { CornerSquare } from './BoardHelpers';
import { getBoardTheme, getPropertyCardTheme } from '@/utils/themes';
import { useTheme } from '@/contexts/ThemeContext';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
  spectatorMode?: boolean;
  spectatorWallet?: string;
  boardTheme?: string;
  propertyCardTheme?: string;
}

export function Board({ onSelectProperty, spectatorMode = false, spectatorWallet, boardTheme, propertyCardTheme }: BoardProps) {
  const themeContext = useTheme();
  const [showRewardsPanel, setShowRewardsPanel] = useState(true);
  
  // Use theme from context if not explicitly provided (for spectator mode compatibility)
  const currentBoardTheme = boardTheme ? getBoardTheme(boardTheme) : { boardBackground: themeContext.getBoardThemeStyles() };
  const currentPropertyCardTheme = propertyCardTheme ? getPropertyCardTheme(propertyCardTheme) : getPropertyCardTheme(themeContext.propertyCardTheme);
  return (
    <div className="flex items-center justify-center w-full h-full relative">
      <div 
        className="w-full max-w-[min(90vh,90vw)] aspect-square rounded-lg relative z-10 bg-gray-900"
      >
        <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-0 relative z-10">
          
          {/* ========== TOP-LEFT CORNER: Red 1 (Kentucky Avenue) ========== */}
          <div className="col-start-2 row-start-1">
            <PropertyCard propertyId={11} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} />
          </div>

          {/* ========== TOP-left CORNER: DEFIPOLY ========== */}
          <div className="col-start-1 row-start-1">
            <CornerSquare icon="🎲" label="DEFIPOLY" bgColor="bg-purple-600" />
          </div>
          
          {/* ========== TOP ROW: Red (12-13) + Yellow (14-16) ========== */}
          <div className="col-start-3 row-start-1"><PropertyCard propertyId={12} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-4 row-start-1"><PropertyCard propertyId={13} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-5 row-start-1"><PropertyCard propertyId={14} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-6 row-start-1"><PropertyCard propertyId={15} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-7 row-start-1"><PropertyCard propertyId={16} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          


          {/* ========== LEFT SIDE: Orange (10, 9, 8) + Pink (7, 6) ========== */}
          <div className="col-start-1 row-start-2"><PropertyCard propertyId={10} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-1 row-start-3"><PropertyCard propertyId={9} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-1 row-start-4"><PropertyCard propertyId={8} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-1 row-start-5"><PropertyCard propertyId={7} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-1 row-start-6"><PropertyCard propertyId={6} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>

          {/* ========== CENTER: Enhanced Rewards Panel ========== */}
          <div 
            className="col-start-2 col-span-5 row-start-2 row-span-5 flex flex-col items-center justify-center shadow-inner relative overflow-hidden"
            style={(() => {
              const hasCustomBackground = themeContext?.customBoardBackground;
              return {
                background: hasCustomBackground 
                  ? currentBoardTheme.boardBackground
                  : 'linear-gradient(135deg, rgba(88, 28, 135, 0.6), rgba(109, 40, 217, 0.4))',
                backgroundSize: hasCustomBackground ? 'cover' : undefined,
                backgroundPosition: hasCustomBackground ? 'center' : undefined,
                backgroundRepeat: hasCustomBackground ? 'no-repeat' : undefined,
                boxShadow: hasCustomBackground 
                  ? 'inset 0 0 40px rgba(0, 0, 0, 0.4)' 
                  : 'inset 0 0 60px rgba(139, 92, 246, 0.3)',
              };
            })()}
          >
            {/* Toggle button for rewards panel - only show in non-spectator mode */}
            {!spectatorMode && (
              <button
                onClick={() => setShowRewardsPanel(!showRewardsPanel)}
                className="absolute top-2 right-2 z-20 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                title={showRewardsPanel ? 'Hide rewards panel' : 'Show rewards panel'}
              >
                {showRewardsPanel ? '👁️' : '👁️'}
              </button>
            )}

            {/* Rewards Panel - Hidden in spectator mode or when toggled off */}
            {!spectatorMode && showRewardsPanel && (
              <div className="relative z-10">
                <RewardsPanel />
              </div>
            )}
            
            {/* Spectator Mode Center Text */}
            {spectatorMode && (
              <div className="relative z-10 flex items-center justify-center h-full">
                <div className="text-center text-white/60">
                  <div className="text-4xl mb-3">👀</div>
                  <div className="text-lg font-semibold mb-2">Spectator Mode</div>
                  
                  {/* Clickable Address */}
                  {spectatorWallet && (
                    <a
                      href={`https://solscan.io/address/${spectatorWallet}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-white transition-colors text-sm underline decoration-purple-500 hover:decoration-white mb-4 block"
                    >
                      {spectatorWallet.slice(0, 8)}...{spectatorWallet.slice(-8)}
                    </a>
                  )}

                  {/* Navigation Button */}
                  <div className="flex items-center justify-center mt-4">
                    <button
                      onClick={() => window.location.href = '/'}
                      className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all font-semibold text-sm shadow-lg"
                    >
                      🏠 Back to Game
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========== RIGHT SIDE: Green (17-19) + Dark Blue (20-21) ========== */}
          <div className="col-start-7 row-start-2"><PropertyCard propertyId={17} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-7 row-start-3"><PropertyCard propertyId={18} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-7 row-start-4"><PropertyCard propertyId={19} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-7 row-start-5"><PropertyCard propertyId={20} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-7 row-start-6"><PropertyCard propertyId={21} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>

          {/* ========== BOTTOM-LEFT CORNER: Pink 1 (St. James Place) ========== */}
          <div className="col-start-1 row-start-7">
            <PropertyCard propertyId={5} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} />
          </div>

          {/* ========== BOTTOM ROW: Light Blue (4-2) + Brown (1-0) ========== */}
          <div className="col-start-2 row-start-7"><PropertyCard propertyId={4} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-3 row-start-7"><PropertyCard propertyId={3} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-4 row-start-7"><PropertyCard propertyId={2} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-5 row-start-7"><PropertyCard propertyId={1} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          <div className="col-start-6 row-start-7"><PropertyCard propertyId={0} onSelect={onSelectProperty} spectatorMode={spectatorMode} spectatorWallet={spectatorWallet} theme={propertyCardTheme ? currentPropertyCardTheme : getPropertyCardTheme(themeContext.propertyCardTheme)} /></div>
          
          {/* ========== BOTTOM-RIGHT CORNER: DEFIPOLY ========== */}
          <div className="col-start-7 row-start-7">
            <CornerSquare icon="🎲" label="DEFIPOLY" bgColor="bg-purple-600" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .holographic-board {
          transition: box-shadow 0.5s ease-in-out;
        }

        .holographic-board:hover {
          box-shadow: 
            inset 0 0 120px rgba(147, 51, 234, 0.4), 
            0 0 80px rgba(147, 51, 234, 0.5),
            0 0 120px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </div>
  );
}