'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export function usePlayerStats() {
  const { publicKey } = useWallet();
  const [totalEarned, setTotalEarned] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setTotalEarned(0);
      return;
    }

    const fetchPlayerStats = async () => {
      setLoading(true);
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${BACKEND_URL}/api/players/${publicKey.toString()}/stats`);
        
        if (response.ok) {
          const data = await response.json();
          // total_earned is in lamports (1e9), convert to tokens
          setTotalEarned(data.totalEarned ? data.totalEarned / 1e9 : 0);
        }
      } catch (error) {
        console.error('Error fetching player stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayerStats();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchPlayerStats, 10000);
    return () => clearInterval(interval);
  }, [publicKey]);

  return { totalEarned, loading };
}