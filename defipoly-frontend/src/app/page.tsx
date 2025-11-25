'use client';

import { Board } from '@/components/Board';
import { Portfolio } from '@/components/Portfolio';
import { Leaderboard } from '@/components/Leaderboard';
import { LiveFeed } from '@/components/LiveFeed';
import { PropertyModal } from '@/components/property-modal';
import { ProfileWallet } from '@/components/ProfileWallet';
import { MobileLayout } from '@/components/MobileLayout';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getProfile } from '@/utils/profileStorage';

export default function Home() {
  const { publicKey } = useWallet();
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [cornerSquareStyle, setCornerSquareStyle] = useState<'property' | 'profile'>('property');
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <MobileLayout
          onSelectProperty={setSelectedProperty}
          profilePicture={profilePicture}
          cornerSquareStyle={cornerSquareStyle}
        />
        {selectedProperty !== null && (
          <PropertyModal 
            propertyId={selectedProperty}
            onClose={() => setSelectedProperty(null)}
          />
        )}
      </>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen overflow-hidden relative">
      {/* Main grid layout - fixed height, no scrolling */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr_minmax(320px,400px)] gap-2 p-4 h-full w-full mx-auto max-w-[1920px]">
        {/* LEFT COLUMN: Logo + Portfolio */}
        <div className="flex flex-col gap-2 overflow-hidden min-h-0">
        {/* Logo at top of left column */}
        <div className="flex items-center gap-2 rounded-xl px-2 flex-shrink-0">
          <img 
            src="/logo.svg" 
            alt="Defipoly Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold text-purple-100">Defipoly</h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden min-h-0">
          <Portfolio onSelectProperty={setSelectedProperty} />
        </div>
      </div>

        {/* CENTER: Board */}
        <div className="flex items-center justify-center overflow-hidden">
          <Board onSelectProperty={setSelectedProperty} profilePicture={profilePicture} cornerSquareStyle={cornerSquareStyle} />
        </div>
        
        {/* RIGHT COLUMN: Profile/Wallet + Leaderboard + Live Feed */}
        <div className="flex flex-col gap-2 overflow-hidden min-h-0">
          {/* Profile & Wallet at top of right column */}
          <div className="flex-shrink-0">
            <ProfileWallet />
          </div>
          
          {/* Fixed height container - no scrolling */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
            {/* Leaderboard - 55% of space */}
            <div className="h-[45%] min-h-0 overflow-hidden">
              <Leaderboard />
            </div>
            
            {/* Live Feed - 43% of space */}
            <div className="h-[55%] min-h-0 overflow-hidden">
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