'use client';

import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PROGRAM_ID } from '@/utils/constants';

export function Leaderboard() {
  const { connection } = useConnection();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real leaderboard data from blockchain
    setLoading(false);
  }, [connection]);

  return (
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 max-h-[450px] overflow-y-auto">
      <h2 className="text-lg font-semibold text-purple-200 mb-5 pb-4 border-b border-purple-500/20">
        Leaderboard
      </h2>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm text-purple-300">Loading...</div>
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-50">🏆</div>
          <div className="text-sm text-gray-400">
            No players yet<br />
            Be the first to own properties!
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-4 bg-purple-900/10 rounded-xl border border-purple-500/20 hover:bg-purple-900/15 hover:border-purple-500/40 transition-all cursor-pointer"
            >
              <span className="text-xl mr-3">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}</span>
              <span className="flex-1 font-semibold text-purple-100">
                {leader.address.slice(0, 4)}...{leader.address.slice(-4)}
              </span>
              <span className="text-purple-400 font-semibold">{leader.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}