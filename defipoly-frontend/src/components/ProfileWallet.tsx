'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/utils/profileStorage';

export function ProfileWallet() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
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

  const handleWalletClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const handleProfileClick = () => {
    if (connected) {
      router.push('/profile');
    }
  };

  if (!mounted) {
    return (
      <div className="bg-black/60 backdrop-blur-xl px-4 py-3 rounded-xl border border-purple-500/30 shadow-xl animate-pulse">
        <div className="h-10 bg-purple-500/20 rounded"></div>
      </div>
    );
  }

  if (!connected) {
    // Show only wallet connect button
    return (
      <button
        onClick={handleWalletClick}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-purple-500/40 border border-purple-400/30"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
          <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
        </svg>
        <span>Connect Wallet</span>
      </button>
    );
  }

  // Connected state - integrated profile + wallet
  return (
    <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-purple-500/30 shadow-xl overflow-hidden">
      {/* Profile Section - Clickable */}
      <button
        onClick={handleProfileClick}
        className="w-full px-4 py-3 hover:bg-purple-900/20 transition-all flex items-center gap-3 text-left"
      >
        {/* Profile Picture */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden flex-shrink-0">
          {loadingProfile ? (
            <span className="text-xs animate-pulse">⏳</span>
          ) : profileData.profilePicture ? (
            <img 
              src={profileData.profilePicture} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl">👤</span>
          )}
        </div>
        
        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-purple-300">Profile</div>
          <div className="text-sm font-bold text-white truncate">
            {loadingProfile ? (
              'Loading...'
            ) : profileData.username ? (
              profileData.username
            ) : (
              'Set Username'
            )}
          </div>
        </div>

        {/* Arrow icon */}
        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Divider */}
      <div className="h-px bg-purple-500/20"></div>

      {/* Wallet Section - Clickable */}
      <button
        onClick={handleWalletClick}
        className="w-full px-4 py-3 hover:bg-purple-900/20 transition-all flex items-center gap-3"
      >
        {/* Wallet Icon */}
        <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-300">
            <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
            <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
          </svg>
        </div>

        {/* Wallet Address */}
        <div className="flex-1 text-left min-w-0">
          <div className="text-xs text-purple-300">Wallet</div>
          <div className="text-sm font-mono font-bold text-white truncate">
            {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
          </div>
        </div>

        {/* Connected Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400 font-semibold">Connected</span>
        </div>
      </button>
    </div>
  );
}