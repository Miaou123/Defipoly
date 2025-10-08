'use client';

import { useDefipoly } from '@/hooks/useDefipoly';
import { useWallet } from '@solana/wallet-adapter-react';

export function SetupWizard() {
  const { connected } = useWallet();
  const { 
    tokenAccountExists, 
    playerInitialized, 
    createTokenAccount, 
    initializePlayer,
    loading 
  } = useDefipoly();

  if (!connected) return null;
  if (tokenAccountExists && playerInitialized) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-purple-900/95 to-purple-800/95 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-purple-100 mb-6 text-center">
          🎮 Welcome to Defipoly!
        </h2>

        <div className="space-y-4">
          {/* Step 1: Token Account */}
          <div className={`p-4 rounded-xl border-2 ${
            tokenAccountExists 
              ? 'bg-green-500/10 border-green-500/50' 
              : 'bg-purple-900/20 border-purple-500/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-purple-100">
                {tokenAccountExists ? '✅' : '1️⃣'} Token Account
              </span>
              {tokenAccountExists && <span className="text-green-400 text-sm">Ready</span>}
            </div>
            {!tokenAccountExists && (
              <>
                <p className="text-sm text-purple-300 mb-3">
                  Create your DEFI token account to start playing
                </p>
                <button
                  onClick={createTokenAccount}
                  disabled={loading}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Token Account'}
                </button>
              </>
            )}
          </div>

          {/* Step 2: Initialize Player */}
          <div className={`p-4 rounded-xl border-2 ${
            !tokenAccountExists
              ? 'bg-gray-900/20 border-gray-500/20 opacity-50'
              : playerInitialized 
                ? 'bg-green-500/10 border-green-500/50' 
                : 'bg-purple-900/20 border-purple-500/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-purple-100">
                {playerInitialized ? '✅' : '2️⃣'} Player Account
              </span>
              {playerInitialized && <span className="text-green-400 text-sm">Ready</span>}
            </div>
            {tokenAccountExists && !playerInitialized && (
              <>
                <p className="text-sm text-purple-300 mb-3">
                  Initialize your player account to start buying properties
                </p>
                <button
                  onClick={initializePlayer}
                  disabled={loading}
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
                >
                  {loading ? 'Initializing...' : 'Initialize Player'}
                </button>
              </>
            )}
          </div>
        </div>

        {tokenAccountExists && playerInitialized && (
          <div className="mt-6 text-center">
            <p className="text-green-400 font-semibold">🎉 All set! Start playing!</p>
          </div>
        )}
      </div>
    </div>
  );
}