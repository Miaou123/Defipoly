// ============================================
// FILE: defipoly-frontend/src/components/ClaimTestTokens.tsx
// Auto gas on connect + one-click claim with devnet verification
// ============================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useNotification } from '@/contexts/NotificationContext';
import { Loader2, Gift, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_BASE_URL'] || 'http://localhost:3101';

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
      console.log('🔍 Connection endpoint:', connection.rpcEndpoint);
      console.log('🔍 Wallet:', publicKey.toString());
      
      showInfo('Claiming Tokens', 'Please approve the transaction in your wallet...');

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 0.0001 * LAMPORTS_PER_SOL,
        })
      );

      console.log('🔍 Getting blockhash...');
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      console.log('🔍 Blockhash:', blockhash);
      
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('🔍 Signing transaction...');
      const signedTx = await signTransaction(transaction);
      
      console.log('🔍 Sending raw transaction via our RPC...');
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });
      console.log('🔍 Signature:', signature);

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

  // Not whitelisted - don't show
  if (!status || !status.isWhitelisted) return null;

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
              You can play directly from Mainnet. However if you want to see transaction previews and token balances in your Phantom wallet, switch to Devnet in Settings → Developer Settings.
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
          Make sure your wallet is set to <strong>Devnet</strong> before claiming. 
          This transaction verifies you're on the correct network.
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
            <Gift className="w-5 h-5" />
            Claim 0.5 SOL + 10M Tokens
          </>
        )}
      </button>
    </div>
  );
}