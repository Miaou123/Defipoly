'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Board } from '@/components/Board';
import { getProfilesBatch, ProfileData } from '@/utils/profileStorage';
import { useEffect } from 'react';

export default function SpectatorPage() {
  const params = useParams();
  const router = useRouter();
  const walletAddress = params.wallet as string;
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!walletAddress) return;
      
      try {
        const profiles = await getProfilesBatch([walletAddress]);
        setProfile(profiles[walletAddress] || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [walletAddress]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getDisplayName = () => {
    return profile?.username || formatAddress(walletAddress);
  };

  const goBackToUserBoard = () => {
    router.push('/');
  };

  const goBackToLeaderboard = () => {
    router.push('/');
  };

  if (!walletAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center relative z-10">
        <div className="text-white text-center">
          <div className="text-xl mb-2">❌</div>
          <div>Invalid wallet address</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <Board 
          onSelectProperty={() => {}} // No property actions in spectator mode
          spectatorMode={true}
          spectatorWallet={walletAddress}
        />
      </div>
    </div>
  );
}