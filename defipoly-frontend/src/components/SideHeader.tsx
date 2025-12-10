// ============================================
// FILE: SideHeader.tsx
// Profile and wallet controls for right column
// ============================================
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/utils/profileStorage';
import { StyledWalletButton } from './StyledWalletButton';
import { LoadingIcon, UserIcon } from './icons/UIIcons';

export function SideHeader() {
  const { connected, publicKey } = useWallet();
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
    return undefined;
  }, [publicKey, mounted]);

  return (
    <div className="flex items-center gap-3">
      {mounted && connected && (
        <>
          {/* Profile Button */}
          <button
            onClick={() => router.push('/profile')}
            className="flex-1 bg-black/60 backdrop-blur-xl px-4 py-3 rounded-xl border border-purple-500/30 hover:bg-purple-900/30 transition-all flex items-center gap-3 shadow-xl"
          >
            {/* Profile Picture or Default Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
              {loadingProfile ? (
                <LoadingIcon size={12} className="text-yellow-400 animate-pulse" />
              ) : profileData.profilePicture ? (
                <img 
                  src={profileData.profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon size={20} className="text-purple-300" />
              )}
            </div>
            
            {/* Username or Address */}
            <div className="text-left flex-1">
              <div className="text-xs text-purple-300">Profile</div>
              <div className="text-sm font-bold text-purple-100 truncate">
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
      
      {/* Wallet Button */}
      {mounted ? (
        <StyledWalletButton variant="header" />
      ) : (
        <div className="w-32 h-14 bg-black/60 backdrop-blur-xl rounded-xl animate-pulse border border-purple-500/30"></div>
      )}
    </div>
  );
}