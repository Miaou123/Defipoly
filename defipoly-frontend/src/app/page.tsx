'use client';

import { Board } from '@/components/Board';
import { Portfolio } from '@/components/Portfolio';
import { Leaderboard } from '@/components/Leaderboard';
import { LiveFeed } from '@/components/LiveFeed';
import { PropertyModal } from '@/components/property-modal';
import { ProfileWallet } from '@/components/ProfileWallet';
import { 
  BuyPropertyExplanationModal,
  SellPropertyExplanationModal,
  ShieldPropertyExplanationModal,
  StealPropertyExplanationModal
} from '@/components/MechanicsExplanationModals';
import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getProfile } from '@/utils/profileStorage';

export default function Home() {
  const { publicKey } = useWallet();
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [activeExplanationModal, setActiveExplanationModal] = useState<'buy' | 'sell' | 'shield' | 'steal' | null>(null);
  const [showActionBar, setShowActionBar] = useState(true);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [cornerSquareStyle, setCornerSquareStyle] = useState<'property' | 'profile'>('property');

  const handleBuyProceed = () => {
    console.log('User understood Buy mechanic, proceeding...');
    setActiveExplanationModal(null);
  };

  const handleSellProceed = () => {
    console.log('User understood Sell mechanic, proceeding...');
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

  // Load profile picture
  useEffect(() => {
    if (publicKey) {
      getProfile(publicKey.toString())
        .then(profile => {
          console.log('🔍 [MAIN PAGE] Loaded profile for main game:', profile);
          setProfilePicture(profile.profilePicture);
          setCornerSquareStyle(profile.cornerSquareStyle || 'property');
          console.log('🔍 [MAIN PAGE] Set state:', {
            profilePicture: profile.profilePicture,
            cornerSquareStyle: profile.cornerSquareStyle || 'property'
          });
        })
        .catch(error => {
          console.error('Error loading profile:', error);
        });

      // Listen for profile updates
      const handleProfileUpdate = async () => {
        try {
          const updatedProfile = await getProfile(publicKey.toString());
          setProfilePicture(updatedProfile.profilePicture);
          setCornerSquareStyle(updatedProfile.cornerSquareStyle || 'property');
        } catch (error) {
          console.error('Error updating profile:', error);
        }
      };

      window.addEventListener('storage', handleProfileUpdate);
      window.addEventListener('profileUpdated', handleProfileUpdate);

      return () => {
        window.removeEventListener('storage', handleProfileUpdate);
        window.removeEventListener('profileUpdated', handleProfileUpdate);
      };
    }
  }, [publicKey]);

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Main grid layout - fixed height, no scrolling */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(320px,400px)_minmax(800px,1fr)_minmax(320px,400px)] gap-6 p-4 h-full w-full mx-auto">
        {/* LEFT COLUMN: Logo + Portfolio */}
        <div className="flex flex-col gap-2 overflow-hidden">
          {/* Logo at top of left column */}
          <div className="flex items-center gap-3 rounded-xl px-4 flex-shrink-0">
            <img 
              src="/logo.svg" 
              alt="Defipoly Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-purple-100">Defipoly</h1>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <Portfolio onSelectProperty={setSelectedProperty} />
          </div>
        </div>

        {/* CENTER: Board */}
        <div className="flex items-center justify-center overflow-hidden">
          <Board onSelectProperty={setSelectedProperty} profilePicture={profilePicture} cornerSquareStyle={cornerSquareStyle} />
        </div>
        
        {/* RIGHT COLUMN: Profile/Wallet + Leaderboard + Live Feed */}
        <div className="flex flex-col gap-2 overflow-hidden">
          {/* Profile & Wallet at top of right column */}
          <div className="flex-shrink-0">
            <ProfileWallet />
          </div>
          
          {/* Fixed height container - no scrolling */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Leaderboard - 60% of space */}
            <div className="h-[55%]">
              <Leaderboard />
            </div>
            
            {/* Live Feed - 40% of space */}
            <div className="h-[43%]">
              <LiveFeed />
            </div>
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

        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="text-center mb-3">
            <p className="text-xs text-purple-300">
              💡 Click a property to get started
            </p>
          </div>
          
          <div className="flex gap-2 justify-center flex-wrap">
            <button 
              onClick={() => setActiveExplanationModal('buy')}
              className="px-4 py-2 bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-500/50 text-emerald-100 hover:border-emerald-400/70 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
            >
              <span>🏠</span> Buy Property
            </button>
            <button 
              onClick={() => setActiveExplanationModal('sell')}
              className="px-4 py-2 bg-orange-600/40 hover:bg-orange-600/60 border border-orange-500/50 text-orange-100 hover:border-orange-400/70 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
            >
              <span>💰</span> Sell Property
            </button>
            <button 
              onClick={() => setActiveExplanationModal('shield')}
              className="px-4 py-2 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-500/50 text-blue-100 hover:border-blue-400/70 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
            >
              <span>🛡️</span> Shield Property
            </button>
            <button 
              onClick={() => setActiveExplanationModal('steal')}
              className="px-4 py-2 bg-red-600/40 hover:bg-red-600/60 border border-red-500/50 text-red-100 hover:border-red-400/70 rounded-lg font-semibold text-sm transition-all flex items-center gap-2"
            >
              <span>🎯</span> Steal Property
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
      {activeExplanationModal === 'sell' && (
        <SellPropertyExplanationModal 
          onClose={() => setActiveExplanationModal(null)}
          onProceed={handleSellProceed}
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