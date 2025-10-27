'use client';

import { Board } from '@/components/Board';
import { Portfolio } from '@/components/Portfolio';
import { Leaderboard } from '@/components/Leaderboard';
import { LiveFeed } from '@/components/LiveFeed';
import { PropertyModal } from '@/components/property-modal';
import { SideHeader } from '@/components/SideHeader';
import { 
  BuyPropertyExplanationModal,
  ShieldPropertyExplanationModal,
  StealPropertyExplanationModal
} from '@/components/MechanicsExplanationModals';
import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function Home() {
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [activeExplanationModal, setActiveExplanationModal] = useState<'buy' | 'shield' | 'steal' | null>(null);
  const [showActionBar, setShowActionBar] = useState(true);

  const handleBuyProceed = () => {
    console.log('User understood Buy mechanic, proceeding...');
    setActiveExplanationModal(null);
  };

  const handleShieldProceed = () => {
    console.log('User understood Shield mechanic, proceeding...');
    setActiveExplanationModal(null);
  };

  const handleStealProceed = () => {
    console.log('User understood Steal mechanic, proceeding...');
    setActiveExplanationModal(null);
  };

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Main grid layout - fixed height, no scrolling */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,400px)_minmax(800px,1fr)_minmax(320px,400px)] gap-6 p-4 h-full w-full mx-auto">
        {/* LEFT COLUMN: Logo + Portfolio */}
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Logo at top of left column */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl flex-shrink-0">
            <div className="text-2xl">🎲</div>
            <div>
              <h1 className="text-lg font-bold text-purple-100">Defipoly</h1>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <Portfolio onSelectProperty={setSelectedProperty} />
          </div>
        </div>

        {/* CENTER: Board */}
        <div className="flex items-center justify-center overflow-hidden">
          <Board onSelectProperty={setSelectedProperty} />
        </div>
        
        {/* RIGHT COLUMN: Profile/Wallet + Leaderboard + Live Feed */}
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Profile & Wallet at top of right column */}
          <div className="flex-shrink-0">
            <SideHeader />
          </div>
          
          <div className="flex-1 overflow-auto space-y-4 pr-2">
            <Leaderboard />
            <LiveFeed />
          </div>
        </div>
      </div>

      <PropertyModal 
        propertyId={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />

      {/* Bottom Action Bar with integrated toggle button */}
      <div 
        className={`fixed left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-purple-500/30 z-40 transition-all duration-300 ${
          showActionBar ? 'bottom-0' : '-bottom-full'
        }`}
      >
        {/* Toggle Button - Perfectly aligned with top border */}
        <button
          onClick={() => setShowActionBar(!showActionBar)}
          className="absolute -top-[25px] left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xl border border-purple-500/30 border-b-0 rounded-t-lg px-3 py-1 hover:bg-purple-900/40 transition-colors shadow-lg z-10"
        >
          {showActionBar ? (
            <ChevronDown className="w-4 h-4 text-purple-300" />
          ) : (
            <ChevronUp className="w-4 h-4 text-purple-300" />
          )}
        </button>

        <div className="p-3 pb-3">
          <div className="max-w-7xl mx-auto flex gap-3 justify-center items-center flex-wrap">
            <div className="text-xs text-purple-300 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-500/30">
              <div className="font-medium">ℹ️ Click properties to Buy/Steal</div>
              <div className="opacity-70 text-[10px]">Setup happens automatically on first purchase</div>
            </div>
            <button 
              onClick={() => setActiveExplanationModal('buy')}
              className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-green-500/40"
            >
              <span>🏠</span> Buy Property
            </button>
            <button 
              onClick={() => setActiveExplanationModal('shield')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/40"
            >
              <span>🛡️</span> Shield Property
            </button>
            <button 
              onClick={() => setActiveExplanationModal('steal')}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-red-500/40"
            >
              <span>💰</span> Steal Property
            </button>
          </div>
        </div>
      </div>

      {/* Floating toggle button when bar is hidden - stays visible at bottom */}
      {!showActionBar && (
        <button
          onClick={() => setShowActionBar(!showActionBar)}
          className="fixed bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-xl border border-purple-500/30 rounded-lg px-3 py-1 hover:bg-purple-900/40 transition-all shadow-lg z-50"
        >
          <ChevronUp className="w-4 h-4 text-purple-300" />
        </button>
      )}

      {/* Explanation Modals - Conditionally rendered */}
      {activeExplanationModal === 'buy' && (
        <BuyPropertyExplanationModal 
          onClose={() => setActiveExplanationModal(null)}
          onProceed={handleBuyProceed}
        />
      )}
      {activeExplanationModal === 'shield' && (
        <ShieldPropertyExplanationModal 
          onClose={() => setActiveExplanationModal(null)}
          onProceed={handleShieldProceed}
        />
      )}
      {activeExplanationModal === 'steal' && (
        <StealPropertyExplanationModal 
          onClose={() => setActiveExplanationModal(null)}
          onProceed={handleStealProceed}
        />
      )}
    </div>
  );
}