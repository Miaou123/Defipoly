'use client';

import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PROGRAM_ID } from '@/utils/constants';

interface FeedItem {
  message: string;
  type: 'buy' | 'steal' | 'shield' | 'claim';
  timestamp: number;
}

export function LiveFeed() {
  const { connection } = useConnection();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Subscribe to program events and populate feed
    setLoading(false);
  }, [connection]);

  const addFeedItem = (item: FeedItem) => {
    setFeed(prev => [item, ...prev].slice(0, 20)); // Keep only last 20 items
  };

  return (
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 max-h-[450px] overflow-y-auto">
      <h2 className="text-lg font-semibold text-purple-200 mb-5 pb-4 border-b border-purple-500/20">
        Live Activity
      </h2>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm text-purple-300">Loading...</div>
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-50">📡</div>
          <div className="text-sm text-gray-400">
            No activity yet<br />
            Waiting for transactions...
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((item, idx) => (
            <div
              key={`${item.timestamp}-${idx}`}
              className={`p-4 bg-purple-900/10 rounded-xl border-l-4 text-sm text-purple-200 leading-relaxed animate-slide-in ${
                item.type === 'buy' ? 'border-green-400' :
                item.type === 'steal' ? 'border-red-400' :
                item.type === 'claim' ? 'border-blue-400' :
                'border-amber-400'
              }`}
            >
              {item.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}