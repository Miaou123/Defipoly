'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertTriangle, Settings, Wifi } from 'lucide-react';

interface DevnetConfirmationModalProps {
  isOpen: boolean;
  walletAddress: string;
  onConfirm: () => void;
}

export function DevnetConfirmationModal({ isOpen, walletAddress, onConfirm }: DevnetConfirmationModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleConfirm = () => {
    if (!isConfirmed) return;
    
    // Save confirmation to localStorage with wallet address
    const confirmationKey = 'defipoly_devnet_confirmed';
    localStorage.setItem(confirmationKey, walletAddress);
    
    onConfirm();
  };

  if (!isOpen) return null;

  return createPortal(
    isMobile ? (
      // Mobile: Full Screen - Minimal Dark
      <div className="fixed inset-0 bg-gradient-to-b from-[#0f0a1a] to-[#0a0510] z-[9999] overflow-hidden">
        <div className="h-full w-full flex flex-col" style={{ padding: '56px 24px 32px 24px', paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <h2 className="text-[22px] font-bold text-slate-200 mb-1">Wallet Connected!</h2>
            <p className="text-sm text-slate-500">Confirm your network settings</p>
          </div>
          
          {/* Content */}
          <div className="flex-1 flex flex-col justify-center">
            
            {/* Warning - no box, just border lines */}
            <div className="flex items-start gap-3 py-4 border-t border-b border-amber-500/20 mb-5">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-amber-300 leading-relaxed">
                <strong>Defipoly runs on Solana DEVNET only.</strong><br />
                Using mainnet will cause transaction failures.
              </p>
            </div>
            
            {/* Steps - no container */}
            <div className="mb-5">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 mb-4">
                <Settings className="w-4 h-4" />
                Switch to Devnet in Phantom:
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-[22px] h-[22px] rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[11px] font-bold text-purple-400 flex-shrink-0">1</div>
                  <span className="text-[13px] text-slate-300">Open <strong>Phantom</strong> → Settings (gear icon)</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-[22px] h-[22px] rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[11px] font-bold text-purple-400 flex-shrink-0">2</div>
                  <span className="text-[13px] text-slate-300">Go to <strong>Developer Settings</strong></span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-[22px] h-[22px] rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[11px] font-bold text-purple-400 flex-shrink-0">3</div>
                  <span className="text-[13px] text-slate-300">Enable <strong>Testnet Mode</strong></span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-[22px] h-[22px] rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-[11px] font-bold text-purple-400 flex-shrink-0">4</div>
                  <span className="text-[13px] text-slate-300">Select <strong>"Solana Devnet"</strong></span>
                </div>
              </div>
            </div>
            
            {/* Network - simple line */}
            <div className="flex items-center gap-2 py-3 border-t border-purple-500/15">
              <Wifi className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Required:</span>
              <span className="text-[13px] font-semibold text-green-400">Solana Devnet</span>
              <span className="text-[10px] text-slate-600 font-mono ml-auto">
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            </div>
          </div>
          
          {/* Bottom: Checkbox + Button */}
          <div className="mt-4">
            <label className="flex items-start gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="mt-0.5 w-5 h-5 text-purple-600 bg-slate-800 border-slate-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="text-xs text-slate-400 leading-relaxed">
                I confirm my wallet is set to <strong className="text-slate-300">Solana Devnet</strong>
              </span>
            </label>
            
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                isConfirmed
                  ? 'bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg shadow-purple-500/20'
                  : 'bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Continue to Defipoly
            </button>
          </div>
        </div>
      </div>
    ) : (
      // Desktop: existing modal code
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-green-100">
                Wallet Connected!
              </h2>
            </div>
            <p className="text-purple-300 text-sm">
              Before continuing, please confirm your network settings.
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            
            {/* Warning Box */}
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-amber-200 font-semibold mb-1">Important Network Requirement</h3>
                  <p className="text-amber-200 text-sm">
                    <strong>Defipoly runs on Solana DEVNET only.</strong> Using mainnet will cause transaction failures and may trigger warnings in Phantom.
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-purple-100 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Switch to Devnet in Phantom:
              </h3>
              
              <ol className="space-y-3 text-purple-200">
                <li className="flex items-start gap-3">
                  <span className="bg-purple-500/30 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </span>
                  <span>Open your <strong>Phantom wallet</strong></span>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="bg-purple-500/30 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </span>
                  <span>Click the <strong>Settings</strong> icon (gear icon) in the bottom left</span>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="bg-purple-500/30 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </span>
                  <span>Navigate to <strong>Developer Settings</strong></span>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="bg-purple-500/30 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    4
                  </span>
                  <span>Enable <strong>Testnet Mode</strong> (toggle the switch)</span>
                </li>
                
                <li className="flex items-start gap-3">
                  <span className="bg-purple-500/30 text-purple-300 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    5
                  </span>
                  <span>Select <strong>"Solana Devnet"</strong> from the network dropdown</span>
                </li>
              </ol>
            </div>

            {/* Network Status Display */}
            <div className="bg-purple-900/40 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Wifi className="w-5 h-5 text-purple-300" />
                <span className="text-purple-200 font-medium">Required Network:</span>
                <span className="text-green-400 font-semibold">Solana Devnet</span>
              </div>
              <div className="text-xs text-purple-400">
                Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="bg-purple-950/50 rounded-lg p-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-purple-600 bg-purple-900 border-purple-500 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className="text-purple-200 text-sm">
                  <strong>I confirm my Phantom wallet is set to Solana Devnet</strong> and I understand that using any other network will cause transaction failures.
                </span>
              </label>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleConfirm}
              disabled={!isConfirmed}
              className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                isConfirmed
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-500/25'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Continue to Defipoly
            </button>
          </div>
        </div>
      </div>
    ),
    document.body
  );
}