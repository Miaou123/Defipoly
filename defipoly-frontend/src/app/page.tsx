'use client';

import { Board } from '@/components/Board';
import { Portfolio } from '@/components/Portfolio';
import { Leaderboard } from '@/components/Leaderboard';
import { LiveFeed } from '@/components/LiveFeed';
import { PropertyModal } from '@/components/property-modal';
import { ProfileWallet } from '@/components/ProfileWallet';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getProfile } from '@/utils/profileStorage';

export default function Home() {
  const { publicKey } = useWallet();
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [cornerSquareStyle, setCornerSquareStyle] = useState<'property' | 'profile'>('property');

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
    return undefined;
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
    </div>
  );
}