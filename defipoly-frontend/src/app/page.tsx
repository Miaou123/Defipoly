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
  const [sideColumnWidth, setSideColumnWidth] = useState(400);
  
  // Calculate scaleFactor based on side column width (from 0.7 to 1.0)
  const scaleFactor = Math.max(0.7, Math.min(1.0, sideColumnWidth / 400));

  // Check for mobile and calculate column width
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      
      // Calculate side column width based on screen size
      if (width < 1200) {
        setSideColumnWidth(240);
      } else if (width < 1400) {
        setSideColumnWidth(280);
      } else if (width < 1600) {
        setSideColumnWidth(340);
      } else {
        setSideColumnWidth(400);
      }
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
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
      <div 
        className="grid gap-2 p-4 h-full w-full mx-auto max-w-[1920px]"
        style={{
          gridTemplateColumns: `${sideColumnWidth}px 1fr ${sideColumnWidth}px`,
        }}
      >
        {/* LEFT COLUMN: Logo + Portfolio */}
        <div className="flex flex-col gap-2 overflow-hidden min-h-0">
          {/* Logo at top of left column */}
          <a 
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img 
              src="/logo.svg" 
              alt="Defipoly Logo" 
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold text-purple-100">Defipoly</h1>
            </div>
          </a>
          
          <div className="flex-1 overflow-hidden min-h-0">
            <Portfolio onSelectProperty={setSelectedProperty} scaleFactor={scaleFactor} />
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
            <ProfileWallet scaleFactor={scaleFactor} />
          </div>
          
          {/* Fixed height container - no scrolling */}
          <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
            {/* Leaderboard - 45% of space */}
            <div className="h-[45%] min-h-0 overflow-hidden">
              <Leaderboard scaleFactor={scaleFactor} />
            </div>
            
            {/* Live Feed - 55% of space */}
            <div className="h-[55%] min-h-0 overflow-hidden">
              <LiveFeed scaleFactor={scaleFactor} />
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