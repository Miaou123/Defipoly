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
        // ✅ FIXED: Changed from /api/players/:wallet/stats to /api/stats/:wallet
        const response = await fetch(`${BACKEND_URL}/api/stats/${publicKey.toString()}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Player stats received:', data); // Debug log
          // total_earned is in lamports (1e9), convert to tokens
          setTotalEarned(data.totalEarned ? data.totalEarned / 1e9 : 0);
        } else {
          console.error('Failed to fetch player stats:', response.status, response.statusText);
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