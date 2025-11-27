'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PROPERTIES, getSetBonus } from '@/utils/constants';
import { getSetName, isSetComplete, getMinSlots } from '@/utils/gameHelpers';
import { useDefipoly } from '@/contexts/DefipolyContext';
import type { PropertyOwnership } from '@/types/accounts';
import { Shield, ChevronDown, ChevronRight, Award, Zap, Wallet } from 'lucide-react';
import { ShieldAllModal } from './ShieldAllModal';
import { BuildingIcon } from './icons/UIIcons';
import { useRewards } from '@/contexts/RewardsContext';
import { useGameState } from '@/contexts/GameStateContext';

interface OwnedProperty extends PropertyOwnership {
  propertyInfo: typeof PROPERTIES[0];
}

interface PortfolioProps {
  onSelectProperty: (propertyId: number) => void;
  scaleFactor?: number;
}

// Helper function to calculate daily income from price and yieldBps
const calculateDailyIncome = (price: number, yieldBps: number): number => {
  return Math.floor((price * yieldBps) / 10000);
};

export function Portfolio({ onSelectProperty, scaleFactor = 1 }: PortfolioProps) {
  // Scaled sizes
  const titleSize = Math.max(12, Math.round(18 * scaleFactor));
  const subtitleSize = Math.max(8, Math.round(12 * scaleFactor));
  const textSize = Math.max(9, Math.round(12 * scaleFactor));
  const padding = Math.max(8, Math.round(16 * scaleFactor));
  const headerIconSize = Math.max(14, Math.round(16 * scaleFactor));
  const buttonIconSize = Math.max(12, Math.round(16 * scaleFactor));
  const badgeIconSize = Math.max(9, Math.round(12 * scaleFactor));
  const smallTextSize = Math.max(8, Math.round(10 * scaleFactor));
  const balanceCardPadding = Math.max(6, Math.round(12 * scaleFactor));
  const rowGap = Math.max(6, Math.round(12 * scaleFactor));
  const { publicKey, connected } = useWallet();
  const { program, tokenBalance: balance, loading: balanceLoading } = useDefipoly(); // Still need program for transactions
  // Use backend calculated daily income with set bonuses from GameState
  
  const { ownerships, loading, stats } = useGameState();
  
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

  // Get owned property IDs for set completion check
  const getOwnedPropertyIds = (): number[] => {
    return ownedProperties.map(p => p.propertyInfo.id);
  };

  // Calculate income with variable set bonus
  const calculateIncome = (owned: OwnedProperty, minSlots: number, isComplete: boolean) => {
    const dailyIncomePerSlot = calculateDailyIncome(owned.propertyInfo.price, owned.propertyInfo.yieldBps);
    
    if (!isComplete || minSlots === 0) {
      return {
        baseIncome: dailyIncomePerSlot * owned.slotsOwned,
        bonusIncome: 0,
        totalIncome: dailyIncomePerSlot * owned.slotsOwned,
        bonusedSlots: 0,
        regularSlots: owned.slotsOwned,
        bonusPercent: 0
      };
    }

    // Get the actual variable set bonus for this set
    const setBonus = getSetBonus(owned.propertyInfo.setId);
    const bonusMultiplier = setBonus ? (10000 + setBonus.bps) / 10000 : 1.4; // fallback to 40% if not found
    
    const bonusedSlots = Math.min(owned.slotsOwned, minSlots);
    const regularSlots = owned.slotsOwned - bonusedSlots;
    const baseIncome = dailyIncomePerSlot * regularSlots;
    const bonusIncome = Math.floor(dailyIncomePerSlot * bonusMultiplier * bonusedSlots);
    
    return {
      baseIncome,
      bonusIncome,
      totalIncome: baseIncome + bonusIncome,
      bonusedSlots,
      regularSlots,
      bonusPercent: setBonus?.percent || 40
    };
  };

  // Calculate shield cost for a property
  const calculateShieldCost = (property: typeof PROPERTIES[0], slots: number): number => {
    const shieldCostBps = property.shieldCostBps;
    const dailyIncomePerSlot = calculateDailyIncome(property.price, property.yieldBps);
    return Math.floor((dailyIncomePerSlot * shieldCostBps * slots) / 10000);
  };

  // Calculate shieldable properties with costs for ShieldAllModal
  const shieldAllData = ownedProperties
    .filter(owned => {
      const shieldActive = isShieldActive(owned);
      const unshieldedSlots = owned.slotsOwned - (shieldActive ? owned.slotsShielded : 0);
      return unshieldedSlots > 0;
    })
    .map(owned => ({
      propertyId: owned.propertyId,
      propertyInfo: owned.propertyInfo,
      slotsOwned: owned.slotsOwned,
      shieldCost: calculateShieldCost(owned.propertyInfo, owned.slotsOwned)
    }));

  const hasShieldableProperties = shieldAllData.length > 0;
  const shieldablePropertiesCount = shieldAllData.length;

  // Render Shield All Button
  const renderShieldAllButton = () => {
    if (ownedProperties.length === 0) return null;

    return (
      <button
        onClick={() => hasShieldableProperties && setShowShieldAllModal(true)}
        disabled={!hasShieldableProperties}
        className={`w-full rounded-lg font-semibold transition-all flex items-center justify-center ${
          hasShieldableProperties
            ? 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white'
            : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
        }`}
        style={{ 
          fontSize: `${subtitleSize}px`, 
          gap: `${Math.round(8 * scaleFactor)}px`,
          padding: `${Math.round(10 * scaleFactor)}px ${padding}px`,
          marginBottom: `${padding}px`
        }}
      >
        <div style={{ width: buttonIconSize, height: buttonIconSize }}>
          <Shield style={{ width: '100%', height: '100%' }} />
        </div>
        {hasShieldableProperties 
          ? `Shield ${shieldablePropertiesCount} ${shieldablePropertiesCount === 1 ? 'Property' : 'Properties'}`
          : 'All Properties Protected'
        }
      </button>
    );
  };

  // Group owned properties by setId
  const groupedProperties = ownedProperties.reduce((acc, prop) => {
    const setId = prop.propertyInfo.setId;
    if (!acc[setId]) {
      acc[setId] = [];
    }
    acc[setId]!.push(prop);
    return acc;
  }, {} as Record<number, OwnedProperty[]>);

  const totalSlots = ownedProperties.reduce((sum, p) => sum + p.slotsOwned, 0);

  return (
    <>
      <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 h-full overflow-hidden flex flex-col">
        {/* Header + Balance + Shield Button - Sticky */}
        <div style={{ padding: `${Math.round(padding * 1.5)}px`, paddingBottom: `${padding}px`, gap: `${padding}px`, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-white" style={{ fontSize: `${titleSize}px` }}>My Portfolio</h2>
            <span className="text-purple-400" style={{ fontSize: `${subtitleSize}px` }}>{totalSlots} slots</span>
          </div>

          {/* Token Balance Card - Compact */}
          {connected && (
            <div className="bg-gradient-to-br from-purple-800/40 to-purple-900/40 backdrop-blur-sm rounded-lg border border-purple-500/30" style={{ padding: `${balanceCardPadding}px` }}>
              <div className="flex items-center justify-between" style={{ gap: `${balanceCardPadding}px` }}>
                <div className="flex items-center" style={{ gap: `${Math.round(8 * scaleFactor)}px` }}>
                  <div className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0" style={{ width: `${Math.round(28 * scaleFactor)}px`, height: `${Math.round(28 * scaleFactor)}px` }}>
                    <div style={{ width: headerIconSize, height: headerIconSize }}>
                      <Wallet style={{ width: '100%', height: '100%' }} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-purple-300 font-semibold uppercase tracking-wide" style={{ fontSize: `${smallTextSize}px` }}>
                      Balance
                    </div>
                    <div className="font-black text-white leading-tight" style={{ fontSize: `${Math.round(18 * scaleFactor)}px` }}>
                      {balanceLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        balance.toLocaleString(undefined, { maximumFractionDigits: 0 })
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 uppercase tracking-wide" style={{ fontSize: `${smallTextSize}px` }}>Daily Rewards</div>
                  <div className="font-bold text-green-400 flex items-center" style={{ fontSize: `${subtitleSize}px`, gap: `${Math.round(4 * scaleFactor)}px` }}>
                    <span>📈</span>
                    <span>+{stats.dailyIncome > 0 ? stats.dailyIncome.toLocaleString() : '0'}/day</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Shield All Button */}
          {renderShieldAllButton()}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: `0 ${Math.round(padding * 1.5)}px ${Math.round(padding * 1.5)}px` }}>
        {/* Loading State */}
        {loading && ownedProperties.length === 0 && (
          <div className="text-center" style={{ padding: `${padding * 3}px 0` }}>
            <div style={{ fontSize: `${Math.round(32 * scaleFactor)}px`, marginBottom: `${Math.round(8 * scaleFactor)}px` }}>⏳</div>
            <div className="text-purple-300" style={{ fontSize: `${subtitleSize}px` }}>Loading portfolio...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && ownedProperties.length === 0 && (
          <div className="text-center" style={{ padding: `${padding * 3}px 0` }}>
            <div style={{ margin: `0 auto ${balanceCardPadding}px`, width: Math.round(60 * scaleFactor), height: Math.round(60 * scaleFactor) }}>
              <BuildingIcon size={Math.round(60 * scaleFactor)} className="text-purple-400 opacity-50" />
            </div>
            <div className="text-gray-400" style={{ fontSize: `${subtitleSize}px` }}>
              No properties yet<br />
              Click on a property to start building!
            </div>
          </div>
        )}

        {/* Properties Grouped by Set - SORTED BY HIGHEST TO LOWEST DAILY REWARDS */}
        {!loading && ownedProperties.length > 0 && (
          <div style={{ gap: `${balanceCardPadding}px`, display: 'flex', flexDirection: 'column' }}>
            {Object.entries(groupedProperties)
              .sort(([aSetId, aProps], [bSetId, bProps]) => {
                const ownedPropertyIds = getOwnedPropertyIds();
                
                const aSetIdNum = Number(aSetId);
                const aIsComplete = isSetComplete(aSetIdNum, ownedPropertyIds);
                const aMinSlots = getMinSlots(aSetIdNum);
                const aTotalIncome = aProps.reduce((sum, p) => {
                  const income = calculateIncome(p, aMinSlots, aIsComplete);
                  return sum + income.totalIncome;
                }, 0);

                const bSetIdNum = Number(bSetId);
                const bIsComplete = isSetComplete(bSetIdNum, ownedPropertyIds);
                const bMinSlots = getMinSlots(bSetIdNum);
                const bTotalIncome = bProps.reduce((sum, p) => {
                  const income = calculateIncome(p, bMinSlots, bIsComplete);
                  return sum + income.totalIncome;
                }, 0);

                return bTotalIncome - aTotalIncome;
              })
              .map(([setIdStr, setProperties]) => {
              const setId = Number(setIdStr);
              const isExpanded = expandedSets.has(setId);
              
              const ownedPropertyIds = getOwnedPropertyIds();
              const isComplete = isSetComplete(setId, ownedPropertyIds);
              const minSlots = getMinSlots(setId);
              const setName = getSetName(setId);
              const setColorClass = setProperties[0]?.propertyInfo.color ?? 'default';
              
              const totalSlotsInSet = setProperties.reduce((sum, p) => sum + p.slotsOwned, 0);
              const totalIncomeInSet = setProperties.reduce((sum, p) => {
                const income = calculateIncome(p, minSlots, isComplete);
                return sum + income.totalIncome;
              }, 0);

              return (
                <div 
                  key={`set-${setId}`}
                  className="bg-white/[0.03] rounded-lg overflow-hidden border border-purple-500/10"
                >
                  {/* Set Header - Collapsible */}
                  <button
                    onClick={() => toggleSet(setId)}
                    className="w-full flex items-center justify-between hover:bg-white/[0.03] transition-all"
                    style={{ padding: `${balanceCardPadding}px ${rowGap}px` }}
                  >
                    <div className="flex items-center" style={{ gap: `${Math.round(8 * scaleFactor)}px` }}>
                      <div style={{ width: buttonIconSize, height: buttonIconSize }}>
                        {isExpanded ? 
                          <ChevronDown style={{ width: '100%', height: '100%' }} className="text-purple-400" /> : 
                          <ChevronRight style={{ width: '100%', height: '100%' }} className="text-purple-400" />
                        }
                      </div>
                      <div className={`${setColorClass} rounded-full`} style={{ width: `${rowGap}px`, height: `${rowGap}px` }} />
                      <span className="font-bold text-purple-100" style={{ fontSize: `${subtitleSize}px` }}>{setName}</span>
                    </div>
                    <div style={{ fontSize: `${smallTextSize}px` }}>
                      <span className="text-purple-400">{totalSlotsInSet} slots • </span>
                      <span className={isComplete ? 'text-green-400 font-bold' : 'text-purple-400'}>
                        {totalIncomeInSet.toLocaleString()}/day
                      </span>
                    </div>
                  </button>
                  
                  {/* Expandable Content */}
                  {isExpanded && (
                    <div style={{ padding: `0 ${rowGap}px ${Math.round(8 * scaleFactor)}px` }}>
                      {/* Set Bonus Info Banner */}
                      {isComplete && (
                        <div className="bg-green-900/30 rounded" style={{ padding: `${Math.round(8 * scaleFactor)}px ${Math.round(8 * scaleFactor)}px`, marginBottom: `${Math.round(8 * scaleFactor)}px` }}>
                          <div className="text-green-300 font-bold uppercase tracking-wide flex items-center" style={{ fontSize: `${smallTextSize}px`, gap: `${Math.round(4 * scaleFactor)}px` }}>
                            <div style={{ width: badgeIconSize, height: badgeIconSize }}>
                              <Award style={{ width: '100%', height: '100%' }} />
                            </div>
                            Complete Set Bonus: +{getSetBonus(setId)?.percent || 40}%
                          </div>
                        </div>
                      )}
                      
                      {/* Properties List with Detailed Breakdown */}
                      <div style={{ gap: `${Math.round(6 * scaleFactor)}px`, display: 'flex', flexDirection: 'column' }}>
                        {setProperties.map((owned) => {
                          const income = calculateIncome(owned, minSlots, isComplete);
                          const shieldActive = isShieldActive(owned);
                          const timeRemaining = shieldActive 
                            ? formatTimeRemaining(owned.shieldExpiry.toNumber())
                            : null;
                          
                          return (
                            <div 
                              key={`property-${owned.propertyId}`}
                              onClick={() => onSelectProperty(owned.propertyId)}
                              className="bg-white/[0.02] rounded-lg hover:bg-white/[0.06] transition-all cursor-pointer"
                              style={{ padding: `${Math.round(8 * scaleFactor)}px` }}
                            >
                              <div className="flex items-center justify-between" style={{ marginBottom: `${Math.round(4 * scaleFactor)}px` }}>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-purple-100 truncate" style={{ fontSize: `${smallTextSize}px` }}>
                                    {owned.propertyInfo.name}
                                  </div>
                                </div>
                                <div className="text-right flex items-center" style={{ gap: `${Math.round(8 * scaleFactor)}px` }}>
                                  <div className="font-bold text-purple-200" style={{ fontSize: `${smallTextSize}px` }}>
                                    {owned.slotsOwned} slot{owned.slotsOwned > 1 ? 's' : ''}
                                  </div>
                                  {shieldActive && timeRemaining && (
                                    <div className="bg-amber-500/20 text-amber-400 rounded font-mono flex items-center" style={{ 
                                      fontSize: `${smallTextSize}px`, 
                                      padding: `${Math.round(2 * scaleFactor)}px ${Math.round(6 * scaleFactor)}px`,
                                      gap: `${Math.round(4 * scaleFactor)}px`
                                    }}>
                                      <div style={{ width: badgeIconSize, height: badgeIconSize }}>
                                        <Shield style={{ width: '100%', height: '100%' }} />
                                      </div>
                                      {timeRemaining}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Income breakdown */}
                              <div className="flex items-center flex-wrap" style={{ gap: `${Math.round(8 * scaleFactor)}px`, fontSize: `${smallTextSize}px` }}>
                                {isComplete && income.bonusedSlots > 0 ? (
                                  <>
                                    <div className="flex items-center" style={{ gap: `${Math.round(4 * scaleFactor)}px` }}>
                                      <div style={{ width: badgeIconSize, height: badgeIconSize }}>
                                        <Zap style={{ width: '100%', height: '100%' }} className="text-green-400" />
                                      </div>
                                      <span className="text-green-400 font-bold">{income.bonusedSlots}×</span>
                                      <span className="text-green-300">{Math.floor(income.bonusIncome / income.bonusedSlots)}</span>
                                    </div>
                                    {income.regularSlots > 0 && (
                                      <>
                                        <span className="text-purple-500">+</span>
                                        <div className="flex items-center" style={{ gap: `${Math.round(4 * scaleFactor)}px` }}>
                                          <span className="text-purple-400">{income.regularSlots}×</span>
                                          <span className="text-purple-300">{calculateDailyIncome(owned.propertyInfo.price, owned.propertyInfo.yieldBps)}</span>
                                        </div>
                                      </>
                                    )}
                                    <span className="text-purple-500">=</span>
                                    <span className="text-green-400 font-bold">{income.totalIncome.toLocaleString()}/day</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex items-center" style={{ gap: `${Math.round(4 * scaleFactor)}px` }}>
                                      <span className="text-purple-400 font-bold">{owned.slotsOwned}×</span>
                                      <span className="text-purple-300">{calculateDailyIncome(owned.propertyInfo.price, owned.propertyInfo.yieldBps)}</span>
                                    </div>
                                    <span className="text-purple-500">=</span>
                                    <span className="text-green-400 font-bold">{income.totalIncome.toLocaleString()}/day</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Shield All Modal */}
      {showShieldAllModal && (
        <ShieldAllModal
          ownedProperties={shieldAllData}
          balance={balance}
          onClose={() => setShowShieldAllModal(false)}
        />
      )}
    </>
  );
}