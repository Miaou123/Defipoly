// ============================================
// FILE: defipoly-frontend/src/components/Header.tsx
// UPDATED: Using custom styled wallet button
// ============================================
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/utils/profileStorage';
import { StyledWalletButton } from './StyledWalletButton';

export function Header() {
  const { connected, publicKey } = useWallet();
  const { tokenBalance } = useDefipoly();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profileData, setProfileData] = useState<{ username: string | null; profilePicture: string | null }>({
    username: null,
    profilePicture: null,
  });
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load profile data
  useEffect(() => {
    if (publicKey && mounted) {
      setLoadingProfile(true);
      
      getProfile(publicKey.toString())
        .then(profile => {
          setProfileData({
            username: profile.username,
            profilePicture: profile.profilePicture,
          });
        })
        .catch(error => {
          console.error('Error loading profile:', error);
        })
        .finally(() => {
          setLoadingProfile(false);
        });

      // Listen for profile updates
      const handleProfileUpdate = async () => {
        try {
          const updatedProfile = await getProfile(publicKey.toString());
          setProfileData({
            username: updatedProfile.username,
            profilePicture: updatedProfile.profilePicture,
          });
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
  }, [publicKey, mounted]);

  return (
    <header className="bg-black/60 backdrop-blur-xl border-b border-purple-500/30 sticky top-0 z-50">
      <div className="w-full px-6 py-4 flex justify-between items-center">
        {/* Left side - Logo */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎲</div>
          <div>
            <h1 className="text-xl font-bold text-purple-100">Defipoly</h1>
            <p className="text-xs text-purple-400">DeFi Monopoly on Solana</p>
          </div>
        </div>

        {/* Right side - Profile, Balance & Wallet */}
        <div className="flex items-center gap-4">
          {mounted && connected && (
            <>
              {/* Balance Display */}
              <div className="bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-500/30">
                <div className="text-xs text-purple-300">Balance</div>
                <div className="text-sm font-bold text-purple-100">{tokenBalance.toLocaleString()} DEFI</div>
              </div>

              {/* Profile Button - Matches balance style */}
              <button
                onClick={() => router.push('/profile')}
                className="bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-500/30 hover:bg-purple-900/50 transition-all flex items-center gap-3"
              >
                {/* Profile Picture or Default Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                  {loadingProfile ? (
                    <span className="text-xs animate-pulse">⏳</span>
                  ) : profileData.profilePicture ? (
                    <img 
                      src={profileData.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">👤</span>
                  )}
                </div>
                
                {/* Username or Address */}
                <div className="text-left">
                  <div className="text-xs text-purple-300">Profile</div>
                  <div className="text-sm font-bold text-purple-100 max-w-[120px] truncate">
                    {loadingProfile ? (
                      'Loading...'
                    ) : profileData.username ? (
                      profileData.username
                    ) : (
                      `${publicKey?.toString().slice(0, 4)}...${publicKey?.toString().slice(-4)}`
                    )}
                  </div>
                </div>
              </button>
            </>
          )}
          
          {/* Custom Styled Wallet Button */}
          {mounted ? (
            <StyledWalletButton variant="header" />
          ) : (
            <div className="w-32 h-10 bg-purple-900/20 rounded-lg animate-pulse"></div>
          )}
        </div>
      </div>
    </header>
  );
}