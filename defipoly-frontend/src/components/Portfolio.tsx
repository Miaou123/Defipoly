'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PROPERTIES } from '@/utils/constants';
import { getSetName, isSetComplete, getMinSlots } from '@/utils/gameHelpers';
import { useDefipoly } from '@/hooks/useDefipoly';
import type { PropertyOwnership } from '@/types/accounts';
import { Shield, ChevronDown, ChevronRight, Award, Zap, Wallet } from 'lucide-react';
import { ShieldAllModal } from './ShieldAllModal';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { BUILDING_SVGS } from './icons/GameAssets';
import { useRewards } from '@/hooks/useRewards';
// ✅ NEW: Import the API-based hook
import { useOwnership } from '@/hooks/useOwnership';

interface OwnedProperty extends PropertyOwnership {
  propertyInfo: typeof PROPERTIES[0];
}

interface OwnedPropertyWithShieldCost extends OwnedProperty {
  shieldCost: number;
}

interface PortfolioProps {
  onSelectProperty: (propertyId: number) => void;
}

// Helper function to calculate daily income from price and yieldBps
const calculateDailyIncome = (price: number, yieldBps: number): number => {
  return Math.floor((price * yieldBps) / 10000);
};

export function Portfolio({ onSelectProperty }: PortfolioProps) {
  const { publicKey, connected } = useWallet();
  const { program } = useDefipoly(); // Still need program for transactions
  const { balance, loading: balanceLoading } = useTokenBalance();
  const { dailyIncome: rewardsDailyIncome } = useRewards();
  
  // ✅ NEW: Use API-based ownership hook instead of RPC calls
  const { ownerships, loading: ownershipLoading } = useOwnership();
  
  const [ownedProperties, setOwnedProperties] = useState<OwnedProperty[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6, 7]));
  const [showShieldAllModal, setShowShieldAllModal] = useState(false);

  // Update current time every second for shield timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ NEW: Convert API ownerships to OwnedProperty format
  // This replaces the old fetchPortfolio loop that made 22 RPC calls!
  useEffect(() => {
    if (!connected) {
      setOwnedProperties([]);
      return;
    }

    // Filter and map ownerships to include property info
    const owned: OwnedProperty[] = ownerships
      .filter(o => o.slotsOwned > 0)
      .map(ownership => {
        const propertyInfo = PROPERTIES.find(p => p.id === ownership.propertyId);
        if (!propertyInfo) {
          console.warn(`Property ${ownership.propertyId} not found in PROPERTIES`);
          return null;
        }
        return {
          ...ownership,
          propertyInfo,
        };
      })
      .filter((p): p is OwnedProperty => p !== null);

    setOwnedProperties(owned);
  }, [ownerships, connected]);

  // Helper to check if shield is active
  const isShieldActive = (owned: OwnedProperty): boolean => {
    const now = Date.now() / 1000;
    return owned.slotsShielded > 0 && owned.shieldExpiry.toNumber() > now;
  };

  // Helper to format time remaining
  const formatTimeRemaining = (expiryTimestamp: number): string => {
    const now = Date.now() / 1000;
    const remaining = Math.max(0, expiryTimestamp - now);
    
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = Math.floor(remaining % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  // Toggle set expansion
  const toggleSet = (setId: number) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(setId)) {
      newExpanded.delete(setId);
    } else {
      newExpanded.add(setId);
    }
    setExpandedSets(newExpanded);
  };

  // Group properties by set
  const propertiesBySet = ownedProperties.reduce((acc, prop) => {
    const setId = prop.propertyInfo.setId;
    if (!acc[setId]) acc[setId] = [];
    acc[setId].push(prop);
    return acc;
  }, {} as Record<number, OwnedProperty[]>);

  // Calculate total stats
  const totalSlots = ownedProperties.reduce((sum, p) => sum + p.slotsOwned, 0);
  const totalShielded = ownedProperties.reduce((sum, p) => sum + p.slotsShielded, 0);
  const totalUnshielded = totalSlots - totalShielded;

  // Calculate complete sets
  const completeSets = Object.keys(propertiesBySet).filter(setId => {
    const setIdNum = parseInt(setId);
    const owned = propertiesBySet[setIdNum];
    return isSetComplete(setIdNum, owned.map(p => p.propertyInfo.id));
  }).length;

  // If not connected or no properties owned
  if (!connected) {
    return (
      <div className="w-80 bg-gradient-to-br from-purple-900/90 via-purple-800/90 to-purple-900/90 rounded-xl border border-purple-500/30 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-purple-300" />
          <h2 className="text-lg font-bold text-purple-100">Portfolio</h2>
        </div>
        <p className="text-purple-300 text-sm text-center py-8">
          Connect wallet to view your portfolio
        </p>
      </div>
    );
  }

  // ✅ NEW: Show loading state while fetching from API
  if (ownershipLoading) {
    return (
      <div className="w-80 bg-gradient-to-br from-purple-900/90 via-purple-800/90 to-purple-900/90 rounded-xl border border-purple-500/30 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-purple-300" />
          <h2 className="text-lg font-bold text-purple-100">Portfolio</h2>
        </div>
        <p className="text-purple-300 text-sm text-center py-8">
          Loading portfolio...
        </p>
      </div>
    );
  }

  if (ownedProperties.length === 0) {
    return (
      <div className="w-80 bg-gradient-to-br from-purple-900/90 via-purple-800/90 to-purple-900/90 rounded-xl border border-purple-500/30 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-purple-300" />
          <h2 className="text-lg font-bold text-purple-100">Portfolio</h2>
        </div>
        <p className="text-purple-300 text-sm text-center py-8">
          You don&apos;t own any properties yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-gradient-to-br from-purple-900/90 via-purple-800/90 to-purple-900/90 rounded-xl border border-purple-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-purple-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="w-5 h-5 text-purple-300" />
            <h2 className="text-lg font-bold text-purple-100">Portfolio</h2>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-purple-950/50 rounded-lg p-2">
              <div className="text-xs text-purple-400 mb-0.5">Total Slots</div>
              <div className="text-lg font-bold text-purple-100">{totalSlots}</div>
            </div>
            <div className="bg-purple-950/50 rounded-lg p-2">
              <div className="text-xs text-purple-400 mb-0.5">Complete Sets</div>
              <div className="text-lg font-bold text-green-400">{completeSets}</div>
            </div>
            <div className="bg-purple-950/50 rounded-lg p-2">
              <div className="text-xs text-purple-400 mb-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Shielded
              </div>
              <div className="text-lg font-bold text-blue-400">{totalShielded}</div>
            </div>
            <div className="bg-purple-950/50 rounded-lg p-2">
              <div className="text-xs text-purple-400 mb-0.5">Unshielded</div>
              <div className="text-lg font-bold text-orange-400">{totalUnshielded}</div>
            </div>
          </div>

          {/* Income Display */}
          <div className="mt-2 bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-lg p-2 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-300">Daily Income</span>
              </div>
              <span className="text-sm font-bold text-green-400">
                {rewardsDailyIncome.toLocaleString()} USDC
              </span>
            </div>
          </div>

          {/* Shield All Button */}
          {totalUnshielded > 0 && (
            <button
              onClick={() => setShowShieldAllModal(true)}
              className="mt-2 w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              Shield All Unshielded
            </button>
          )}
        </div>

        {/* Properties by Set */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {Object.keys(propertiesBySet)
            .map(Number)
            .sort((a, b) => a - b)
            .map(setId => {
              const setProps = propertiesBySet[setId];
              const isExpanded = expandedSets.has(setId);
              const setName = getSetName(setId);
              const isComplete = isSetComplete(setId, setProps.map(p => p.propertyInfo.id));
              const setSlots = setProps.reduce((sum, p) => sum + p.slotsOwned, 0);
              const setShielded = setProps.reduce((sum, p) => sum + p.slotsShielded, 0);

              return (
                <div key={setId} className="border-b border-purple-500/20 last:border-0">
                  {/* Set Header */}
                  <button
                    onClick={() => toggleSet(setId)}
                    className="w-full p-3 hover:bg-purple-800/30 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-purple-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-purple-400" />
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-purple-100">
                            {setName}
                          </span>
                          {isComplete && (
                            <Award className="w-3.5 h-3.5 text-green-400" />
                          )}
                        </div>
                        <div className="text-xs text-purple-400">
                          {setProps.length} {setProps.length === 1 ? 'property' : 'properties'} • {setSlots} slots
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {setShielded > 0 && (
                        <div className="flex items-center gap-1 bg-blue-900/40 px-2 py-0.5 rounded">
                          <Shield className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-blue-300">{setShielded}</span>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Properties in Set */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2">
                      {setProps.map(owned => {
                        const shieldActive = isShieldActive(owned);
                        const unshieldedSlots = owned.slotsOwned - owned.slotsShielded;

                        return (
                          <div
                            key={owned.propertyInfo.id}
                            onClick={() => onSelectProperty(owned.propertyInfo.id)}
                            className="bg-purple-950/40 hover:bg-purple-900/50 rounded-lg p-2.5 cursor-pointer transition-colors border border-purple-500/20"
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                {BUILDING_SVGS[owned.slotsOwned] || BUILDING_SVGS[5]}
                                <div>
                                  <div className="text-xs font-semibold text-purple-100">
                                    {owned.propertyInfo.name}
                                  </div>
                                  <div className="text-[10px] text-purple-400">
                                    {owned.slotsOwned} {owned.slotsOwned === 1 ? 'slot' : 'slots'}
                                  </div>
                                </div>
                              </div>
                              {shieldActive && (
                                <div className="flex items-center gap-1 bg-blue-900/60 px-1.5 py-0.5 rounded">
                                  <Shield className="w-3 h-3 text-blue-400" />
                                  <span className="text-[10px] text-blue-300">
                                    {formatTimeRemaining(owned.shieldExpiry.toNumber())}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Stats Bar */}
                            <div className="flex items-center gap-2 text-[10px]">
                              <div className="flex items-center gap-1 text-green-400">
                                <Zap className="w-2.5 h-2.5" />
                                {calculateDailyIncome(owned.propertyInfo.price, owned.propertyInfo.yieldBps)}
                              </div>
                              {owned.slotsShielded > 0 && (
                                <div className="flex items-center gap-1 text-blue-400">
                                  <Shield className="w-2.5 h-2.5" />
                                  {owned.slotsShielded}
                                </div>
                              )}
                              {unshieldedSlots > 0 && (
                                <div className="text-orange-400">
                                  {unshieldedSlots} unshielded
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Shield All Modal */}
      {showShieldAllModal && (
        <ShieldAllModal
          ownedProperties={ownedProperties.map(prop => ({
            ...prop,
            shieldCost: Math.floor((prop.propertyInfo.price * prop.propertyInfo.shieldCostBps) / 10000)
          }))}
          balance={balance}
          onClose={() => setShowShieldAllModal(false)}
        />
      )}
    </>
  );
}