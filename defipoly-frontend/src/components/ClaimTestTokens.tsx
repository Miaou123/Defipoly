// ============================================
// FILE: defipoly-frontend/src/components/ClaimTestTokens.tsx
// Auto gas on connect + one-click claim with devnet verification
// ============================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useNotification } from '@/contexts/NotificationContext';
import { useDefipoly } from '@/contexts/DefipolyContext';
import { Loader2, Gift, CheckCircle, AlertCircle } from 'lucide-react';

import { API_BASE_URL } from '@/utils/config';

interface EligibilityStatus {
  wallet: string;
  isWhitelisted: boolean;
  step: 'not_whitelisted' | 'waiting_gas' | 'can_claim' | 'completed';
  canClaim: boolean;
  message: string;
  gasReceived: boolean;
  completed: boolean;
  gasSent?: boolean;
  gasSignature?: string;
}

export function ClaimTestTokens() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { showSuccess, showError, showInfo } = useNotification();
  const { refreshTokenBalance } = useDefipoly();

  const [status, setStatus] = useState<EligibilityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  // Check eligibility on connect (also triggers auto-gas)
  const checkEligibility = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/airdrop/check/${publicKey.toString()}`);
      const data: EligibilityStatus = await response.json();
      setStatus(data);

      // Show notification if gas was just sent
      if (data.gasSent && data.gasSignature) {
        showInfo('Gas Received ⛽', 'You received 0.01 SOL for transaction fees');
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error);
    } finally {
      setLoading(false);
    }
  }, [publicKey, showInfo]);

  useEffect(() => {
    if (connected && publicKey) {
      checkEligibility();
    } else {
      setStatus(null);
    }
  }, [connected, publicKey, checkEligibility]);

  // Claim tokens: sign tx → send via our RPC → verify → receive tokens
  const handleClaimTokens = async () => {
    if (!publicKey || !signTransaction) return;

    setClaimLoading(true);
    try {
      
      showInfo('Claiming Tokens', 'Please approve the transaction in your wallet...');

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 0.0001 * LAMPORTS_PER_SOL,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signedTx = await signTransaction(transaction);
      
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      showInfo('Verifying...', 'Waiting for confirmation...');

      // Wait for tx to land
      await new Promise(r => setTimeout(r, 5000));

      // Let backend verify
      const response = await fetch(`${API_BASE_URL}/api/airdrop/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toString(),
          txSignature: signature,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess(
          'Tokens Claimed! 🎉',
          `Received ${result.solAmount} SOL and ${(result.tokenAmount || 0).toLocaleString()} tokens!`,
          result.tokenSignature
        );
        // Refresh the balance after successful claim
        await refreshTokenBalance();
        await checkEligibility();
      } else {
        showError('Claim Failed', result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('❌ Claim failed:', error);
      
      if (error.message?.includes('User rejected')) {
        // User cancelled
      } else if (error.message?.includes('0x1') || error.message?.includes('insufficient')) {
        showError('Wrong Network', 'Make sure your wallet is set to Devnet!');
      } else {
        showError('Claim Failed', error.message || 'Unknown error');
      }
    } finally {
      setClaimLoading(false);
    }
  };

  // Don't show anything if not connected
  if (!connected) return null;

  // Loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/30 backdrop-blur-lg rounded-xl border border-purple-500/30 p-4">
        <div className="flex items-center justify-center gap-2 text-purple-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Checking eligibility...</span>
        </div>
      </div>
    );
  }

  // Not whitelisted - show form message
  if (!status || !status.isWhitelisted) {
    return (
      <div className="bg-gradient-to-r from-amber-900/40 to-orange-900/30 backdrop-blur-lg rounded-xl border border-amber-500/30 p-4">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400" />
          Whitelist Required
        </h3>
        
        <p className="text-sm text-amber-200 mb-4">
          To receive test tokens, you need to be whitelisted. Please fill out our quick form and you'll be added to the whitelist shortly.
        </p>

        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfq8ZcVmFP_rS3dwWouZX9RFAmcja3LjOhySdVxHXxJ-XWgsg/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
        >
          <Gift className="w-5 h-5" />
          Fill Whitelist Form
        </a>
        
        <p className="text-xs text-amber-300/70 mt-3 text-center">
          After submitting, check back here in a few hours to claim your tokens.
        </p>
      </div>
    );
  }

    // Already completed
    if (status.completed && status.step === 'completed') {
        return (
          <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/20 backdrop-blur-lg rounded-xl border border-green-500/30 p-4">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Test tokens claimed!</span>
            </div>
            <p className="text-sm text-green-300/70 mt-2">Start by buying a property!</p>
              <p className="text-xs text-green-300/50 mt-2">
                Make sure your wallet is set to Devnet to see your token balance and send transactions. In Phantom: Settings → Developer Settings → Testnet Mode → Devnet.
              </p>
          </div>
        );
      }

  // Waiting for gas (shouldn't happen often, auto-sent)
  if (status.step === 'waiting_gas') {
    return (
      <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/30 backdrop-blur-lg rounded-xl border border-purple-500/30 p-4">
        <div className="flex items-center gap-2 text-purple-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Preparing test tokens...</span>
        </div>
      </div>
    );
  }

  // Can claim
  return (
    <div className="bg-gradient-to-r from-purple-900/40 to-cyan-900/30 backdrop-blur-lg rounded-xl border border-purple-500/30 p-4">
      <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <Gift className="w-5 h-5 text-yellow-400" />
        Claim Test Tokens
      </h3>
      
      <p className="text-sm text-purple-300 mb-4">{status.message}</p>

      <div className="bg-purple-900/30 rounded-lg p-3 mb-4 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-purple-200">
        <strong>Important:</strong> You must switch your wallet to <strong>Devnet</strong> to claim tokens and play the game. 
        In Phantom: Settings → Developer Settings → Testnet Mode → Devnet.
        </p>
      </div>

      <button
        onClick={handleClaimTokens}
        disabled={claimLoading || !status.canClaim}
        className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
      >
        {claimLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Claiming...
          </>
        ) : (
          <>
            Claim Tokens
          </>
        )}
      </button>
    </div>
  );
}