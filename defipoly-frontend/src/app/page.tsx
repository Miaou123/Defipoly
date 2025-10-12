'use client';

import { Header } from '@/components/Header';
import { Board } from '@/components/Board';
import { Portfolio } from '@/components/Portfolio';
import { Leaderboard } from '@/components/Leaderboard';
import { LiveFeed } from '@/components/LiveFeed';
import { PropertyModal } from '@/components/PropertyModal';
import { 
  BuyPropertyExplanationModal,
  ShieldPropertyExplanationModal,
  StealPropertyExplanationModal
} from '@/components/MechanicsExplanationModals';
import { useState } from 'react';

export default function Home() {
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [activeExplanationModal, setActiveExplanationModal] = useState<'buy' | 'shield' | 'steal' | null>(null);

  const handleBuyProceed = () => {
    // Add your logic here - maybe open a property selection modal
    console.log('User understood Buy mechanic, proceeding...');
    // For now, just close the modal
  };

  const handleShieldProceed = () => {
    // Add your logic here
    console.log('User understood Shield mechanic, proceeding...');
  };

  const handleStealProceed = () => {
    // Add your logic here
    console.log('User understood Steal mechanic, proceeding...');
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr_340px] gap-6 p-6 max-w-[1900px] mx-auto pb-32">
        <Portfolio onSelectProperty={setSelectedProperty} />
        <Board onSelectProperty={setSelectedProperty} />
        <div className="flex flex-col gap-6">
          <Leaderboard />
          <LiveFeed />
        </div>
      </div>

      <PropertyModal 
        propertyId={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-purple-500/30 p-3 z-40">
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
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/40"
          >
            <span>🛡️</span> Shield Property
          </button>
          <button 
            onClick={() => setActiveExplanationModal('steal')}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-red-500/40"
          >
            <span>🎯</span> Steal Property
          </button>
        </div>
      </div>

      {/* Mechanics Explanation Modals */}
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