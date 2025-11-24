// ============================================
// FILE: src/components/property-modal/PropertyModal.tsx
// ✅ MOBILE RESPONSIVE VERSION
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { PROPERTIES, SET_BONUSES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { StyledWalletButton } from '../StyledWalletButton';
import { X } from 'lucide-react';
import { PropertyCard } from '../PropertyCard';
import { PropertyActionsBar } from './PropertyActionsBar';
import {
  BuyPropertyExplanationModal,
  SellPropertyExplanationModal,
  ShieldPropertyExplanationModal,
  StealPropertyExplanationModal
} from '../MechanicsExplanationModals';
import { useGameState } from '@/contexts/GameStateContext';
import { fetchPropertyState } from '@/services/api';

interface PropertyModalProps {
  propertyId: number | null;
  onClose: () => void;
}

type HelpModalType = 'buy' | 'shield' | 'sell' | 'steal' | null;

export function PropertyModal({ propertyId, onClose }: PropertyModalProps) {
  const { connected } = useWallet();
  const { program } = useDefipoly();
  const wallet = useAnchorWallet();
  const property = propertyId !== null ? PROPERTIES.find(p => p.id === propertyId) : null;
  const { balance } = useTokenBalance();
  
  const { getOwnership } = useGameState();
  
  const [loading, setLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [showHelpModal, setShowHelpModal] = useState<HelpModalType>(null);
  const [setBonusInfo, setSetBonusInfo] = useState<{
    hasCompleteSet: boolean;
    boostedSlots: number;
    totalSlots: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile (match main page breakpoint)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Fetch property and ownership data from API
  useEffect(() => {
    if (propertyId === null || !connected) {
      setPropertyData(null);
      return;
    }

    const fetchData = async () => {
      try {
        const ownershipData = wallet ? getOwnership(propertyId) : null;
        const propertyState = await fetchPropertyState(propertyId);

        console.log('🔍 PropertyModal Debug:', {
          propertyId,
          ownershipData,
          propertyState,
          availableSlots: propertyState?.available_slots,
        });
    
        const availableSlots = propertyState?.available_slots ?? property?.maxSlots ?? 0;

        const owned = ownershipData?.slotsOwned || 0;
        const maxSlotsPerProperty = property?.maxPerPlayer || 10;
        const shielded = ownershipData?.slotsShielded || 0;
        const shieldExpiry = ownershipData?.shieldExpiry?.toNumber?.() || 0;
        const isShieldActive = shielded > 0 && shieldExpiry > Math.floor(Date.now() / 1000);

        setPropertyData({
          owned,
          maxSlotsPerProperty,
          availableSlots,
          shielded: isShieldActive ? shielded : 0,
          shieldExpiry: isShieldActive ? shieldExpiry : 0,
        });

        // Check for complete set
        if (property) {
          const propertiesInSet = PROPERTIES.filter(p => p.setId === property.setId);
          const requiredProps = property.setId === 0 || property.setId === 7 ? 2 : 3;
          
          let ownedInSetCount = 0;
          let totalBoostedSlots = 0;
          let totalSlotsInSet = 0;

          for (const p of propertiesInSet) {
            const ownership = getOwnership(p.id);
            if (ownership && ownership.slotsOwned > 0) {
              ownedInSetCount++;
              totalBoostedSlots += ownership.slotsOwned;
            }
            totalSlotsInSet += p.maxSlots;
          }

          const hasCompleteSet = ownedInSetCount >= requiredProps;
          setSetBonusInfo({
            hasCompleteSet,
            boostedSlots: hasCompleteSet ? totalBoostedSlots : 0,
            totalSlots: totalSlotsInSet,
          });
        }

      } catch (error) {
        console.error('Error fetching property data:', error);
      }
    };

    fetchData();
  }, [propertyId, connected, wallet, property, getOwnership]);

  if (propertyId === null || !property) return null;

  const baseIncomePerSlot = Math.floor((property.price * property.yieldBps) / 10000);
  const setBonusData = SET_BONUSES[property.setId.toString() as keyof typeof SET_BONUSES];
  const setBonusBps = setBonusData?.bps || 3000;

  const totalSlots = property.maxSlots;
  const personalOwned = propertyData?.owned || 0;
  const availableSlots = propertyData?.availableSlots || 0;
  const othersOwned = totalSlots - availableSlots - personalOwned;

  const hasSetBonus = setBonusInfo?.hasCompleteSet || false;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 lg:p-4" 
        onClick={onClose}
      >
        <div 
          className={`
            bg-gradient-to-br from-purple-950/95 via-purple-900/95 to-purple-950/95 
            backdrop-blur-xl rounded-2xl border-2 border-purple-500/30 
            shadow-2xl shadow-purple-500/20 overflow-hidden
            ${isMobile 
              ? 'w-full h-full max-h-[100dvh] flex flex-col' 
              : 'max-w-2xl w-full max-h-[90vh]'
            }
          `}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-900/50 to-purple-800/50 border-b border-purple-500/30 p-3 lg:p-4 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg lg:text-2xl font-black text-purple-100 mb-1">{property.name}</h2>
                <div className={`${property.color} h-2 lg:h-2.5 w-16 lg:w-20 rounded-full shadow-lg`}></div>
              </div>
              <button 
                onClick={onClose} 
                className="text-purple-300 hover:text-white transition-colors hover:bg-purple-800/50 rounded-lg p-2"
              >
                <X size={isMobile ? 24 : 20} />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className={`
            p-3 lg:p-4 space-y-3 overflow-y-auto flex-1
            ${isMobile ? 'pb-safe' : ''}
          `}>
            {/* Property Card + Details */}
            <div className={`
              ${isMobile 
                ? 'flex flex-col gap-3' 
                : 'grid grid-cols-[210px_1fr] gap-4'
              }
            `}>
              {/* Property Card */}
              <div className={`
                ${isMobile 
                  ? 'w-full flex justify-center' 
                  : 'w-[200px] h-[250px]'
                }
              `}>
                <div className={isMobile ? 'w-[140px] h-[180px]' : 'w-full h-full'}>
                  <PropertyCard 
                    propertyId={propertyId} 
                    onSelect={() => {}} 
                    modalView={true}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-2">
                {/* Income Section */}
                <div className="bg-purple-950/40 rounded-lg p-2 lg:p-3 border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] lg:text-xs text-purple-400 uppercase">💰 Income</span>
                  </div>
                  
                  {hasSetBonus ? (
                    <>
                      {/* Full calculation with boost - fills width */}
                      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 mt-1 w-full">
                        <div className="flex flex-col">
                          <span className="text-[8px] lg:text-[10px] text-purple-400 uppercase">Base</span>
                          <span className="text-base lg:text-xl font-bold text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                        </div>
                        <span className="text-purple-400 text-lg px-1">+</span>
                        <div className="flex flex-col">
                          <span className="text-[8px] lg:text-[10px] text-green-400 uppercase">Boost <span className="text-green-300">+{(setBonusBps / 100).toFixed(2)}%</span></span>
                          <span className="text-base lg:text-xl font-bold text-green-400">{Math.floor(baseIncomePerSlot * setBonusBps / 10000).toLocaleString()}</span>
                        </div>
                        <span className="text-purple-400 text-lg px-1">=</span>
                        <div className="flex flex-col bg-purple-800/40 rounded px-3 py-1 items-end">
                          <span className="text-[8px] lg:text-[10px] text-purple-300 uppercase">Total</span>
                          <span className="text-base lg:text-xl font-black text-green-300">{Math.floor(baseIncomePerSlot * (10000 + setBonusBps) / 10000).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-2 px-2 py-1 bg-green-500/20 rounded border border-green-500/30 flex items-center justify-between">
                        <span className="text-[9px] lg:text-xs text-green-300 font-semibold">✨ Complete Set Bonus Active</span>
                        <span className="text-[9px] lg:text-xs text-green-400">+{(setBonusBps / 100).toFixed(2)}% on {personalOwned} slots</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs lg:text-sm text-purple-400">Base</span>
                      <span className="text-lg lg:text-2xl font-black text-yellow-300">{baseIncomePerSlot.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Slots Section */}
                <div className="bg-purple-950/40 rounded-lg p-2 lg:p-3 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] lg:text-xs text-purple-400 uppercase">📊 Slots</span>
                    <span className="text-xs lg:text-sm font-bold text-purple-100">{personalOwned} / {totalSlots}</span>
                  </div>
                  
                  {/* Stacked Bar */}
                  <div className="h-2 bg-purple-950/50 rounded-full overflow-hidden flex">
                    {othersOwned > 0 && (
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${(othersOwned / totalSlots) * 100}%` }}
                      />
                    )}
                    {personalOwned > 0 && (
                      <div 
                        className="h-full bg-purple-500"
                        style={{ width: `${(personalOwned / totalSlots) * 100}%` }}
                      />
                    )}
                    {availableSlots > 0 && (
                      <div 
                        className="h-full bg-white/15"
                        style={{ width: `${(availableSlots / totalSlots) * 100}%` }}
                      />
                    )}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex gap-2 lg:gap-3 text-[9px] lg:text-[10px] mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-sm"></div>
                      <span className="text-purple-300">Others: {othersOwned}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-sm"></div>
                      <span className="text-purple-300">You: {personalOwned}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-white/30 rounded-sm"></div>
                      <span className="text-purple-300">Available: {availableSlots}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!connected ? (
              <div className="flex flex-col items-center py-4 lg:py-6 space-y-3">
                <p className="text-purple-200 mb-1 text-center text-xs lg:text-sm">Connect your wallet to interact with this property</p>
                <StyledWalletButton variant="modal" />
              </div>
            ) : (
              <PropertyActionsBar
                propertyId={propertyId}
                property={property}
                propertyData={propertyData}
                balance={balance}
                loading={loading}
                setLoading={setLoading}
                onClose={onClose}
                onOpenHelp={setShowHelpModal}
                isMobile={isMobile}
              />
            )}
          </div>
        </div>
      </div>

      {/* Help Modals */}
      {showHelpModal === 'buy' && (
        <BuyPropertyExplanationModal 
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
      {showHelpModal === 'sell' && (
        <SellPropertyExplanationModal 
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
      {showHelpModal === 'shield' && (
        <ShieldPropertyExplanationModal 
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
      {showHelpModal === 'steal' && (
        <StealPropertyExplanationModal 
          onClose={() => setShowHelpModal(null)}
          onProceed={() => setShowHelpModal(null)}
        />
      )}
    </>
  );
}