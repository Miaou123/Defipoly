'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PROPERTIES, getSetName } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import type { PropertyOwnership } from '@/types/accounts';
import { Shield, ChevronDown, ChevronRight, Award, Trophy, Zap, Wallet } from 'lucide-react';
import { ShieldAllModal } from './ShieldAllModal';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { BuildingIcon } from './GameIcons';

interface OwnedProperty extends PropertyOwnership {
  propertyInfo: typeof PROPERTIES[0];
}

interface PortfolioProps {
  onSelectProperty: (propertyId: number) => void;
}

// Group properties by setId from PROPERTIES constant
const PROPERTY_SETS = PROPERTIES.reduce((acc, prop) => {
  if (!acc[prop.setId]) {
    acc[prop.setId] = [];
  }
  acc[prop.setId].push(prop);
  return acc;
}, {} as Record<number, typeof PROPERTIES>);

export function Portfolio({ onSelectProperty }: PortfolioProps) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { getOwnershipData, program } = useDefipoly();
  const { balance, loading: balanceLoading } = useTokenBalance();
  const [ownedProperties, setOwnedProperties] = useState<OwnedProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
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

  // Fetch portfolio data
  useEffect(() => {
    if (!publicKey || !connected || !program) {
      setOwnedProperties([]);
      setDailyIncome(0);
      setPortfolioValue(0);
      return;
    }

    const fetchPortfolio = async () => {
      setLoading(true);
      try {
        const ownerships: OwnedProperty[] = [];
        let totalIncome = 0;
        let totalValue = 0;

        for (const property of PROPERTIES) {
          try {
            const ownership = await getOwnershipData(property.id);
            if (ownership && ownership.slotsOwned > 0) {
              const ownedProperty: OwnedProperty = {
                ...ownership,
                propertyInfo: property,
              };
              ownerships.push(ownedProperty);
              
              const income = property.dailyIncome * ownership.slotsOwned;
              totalIncome += income;
              totalValue += property.price * ownership.slotsOwned;
            }
          } catch (error) {
            // Property not owned or error fetching
          }
        }

        setOwnedProperties(ownerships);
        setDailyIncome(totalIncome);
        setPortfolioValue(totalValue);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [publicKey, connected, program, getOwnershipData]);

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

  // Check if user owns all properties in a set (complete set bonus)
  const isSetComplete = (setId: number): boolean => {
    const setProperties = PROPERTY_SETS[setId] || [];
    const totalInSet = setProperties.length;
    const ownedInSet = ownedProperties.filter(op => op.propertyInfo.setId === setId).length;
    return ownedInSet === totalInSet;
  };

  // Get minimum slots for a set
  const getMinSlots = (setId: number): number => {
    const setOwnedProps = ownedProperties.filter(op => op.propertyInfo.setId === setId);
    if (setOwnedProps.length === 0) return 0;
    return Math.min(...setOwnedProps.map(p => p.slotsOwned));
  };

  // Calculate income with set bonus
  const calculateIncome = (owned: OwnedProperty, minSlots: number, isComplete: boolean) => {
    if (!isComplete || minSlots === 0) {
      return {
        baseIncome: owned.propertyInfo.dailyIncome * owned.slotsOwned,
        bonusIncome: 0,
        totalIncome: owned.propertyInfo.dailyIncome * owned.slotsOwned,
        bonusedSlots: 0,
        regularSlots: owned.slotsOwned
      };
    }

    const bonusedSlots = Math.min(owned.slotsOwned, minSlots);
    const regularSlots = owned.slotsOwned - bonusedSlots;
    const baseIncome = owned.propertyInfo.dailyIncome * regularSlots;
    const bonusIncome = Math.floor(owned.propertyInfo.dailyIncome * 1.4 * bonusedSlots);
    
    return {
      baseIncome,
      bonusIncome,
      totalIncome: baseIncome + bonusIncome,
      bonusedSlots,
      regularSlots
    };
  };

// Calculate shield cost for a property
const calculateShieldCost = (property: typeof PROPERTIES[0], slots: number): number => {
  // Use actual shield cost BPS from property config (graduated 10-17% by set)
  const shieldCostBps = property.shieldCostBps;
  const dailyIncomePerSlot = property.dailyIncome;
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
        className={`w-full mb-4 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
          hasShieldableProperties
            ? 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white'
            : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
        }`}
      >
        <Shield className="w-4 h-4" />
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
    acc[setId].push(prop);
    return acc;
  }, {} as Record<number, OwnedProperty[]>);

  const totalSlots = ownedProperties.reduce((sum, p) => sum + p.slotsOwned, 0);

  return (
    <>
      <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 h-full overflow-hidden flex flex-col">
        {/* Header + Balance + Shield Button - Sticky */}
        <div className="p-6 pb-4 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">My Portfolio</h2>
            <span className="text-sm text-purple-400">{totalSlots} slots</span>
          </div>

          {/* Token Balance Card - Compact */}
          {connected && (
            <div className="bg-gradient-to-br from-purple-800/40 to-purple-900/40 backdrop-blur-sm rounded-lg border border-purple-500/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] text-purple-300 font-semibold uppercase tracking-wide">
                      Balance
                    </div>
                    <div className="text-lg font-black text-white leading-tight">
                      {balanceLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        balance.toLocaleString(undefined, { maximumFractionDigits: 0 })
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-purple-400 uppercase tracking-wide">Value</div>
                  <div className="text-sm font-bold text-purple-200">
                    {portfolioValue > 0 ? (portfolioValue / 1000).toFixed(0) + 'K' : '0'}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Shield All Button */}
          {renderShieldAllButton()}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Loading State */}
        {loading && ownedProperties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-2xl mb-2">⏳</div>
            <div className="text-sm text-purple-300">Loading portfolio...</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && ownedProperties.length === 0 && (
          <div className="text-center py-12">
            <BuildingIcon size={60} className="mx-auto mb-3 text-purple-400 opacity-50" />
            <div className="text-sm text-gray-400">
              No properties yet<br />
              Click on the board to start building!
            </div>
          </div>
        )}

        {/* Properties Grouped by Set - SORTED BY HIGHEST TO LOWEST DAILY REWARDS */}
        {!loading && ownedProperties.length > 0 && (
          <div className="space-y-3">
            {Object.entries(groupedProperties)
              .sort(([aSetId, aProps], [bSetId, bProps]) => {
                // Calculate total income for set A
                const aSetId_num = Number(aSetId);
                const aIsComplete = isSetComplete(aSetId_num);
                const aMinSlots = getMinSlots(aSetId_num);
                const aTotalIncome = aProps.reduce((sum, p) => {
                  const income = calculateIncome(p, aMinSlots, aIsComplete);
                  return sum + income.totalIncome;
                }, 0);

                // Calculate total income for set B
                const bSetId_num = Number(bSetId);
                const bIsComplete = isSetComplete(bSetId_num);
                const bMinSlots = getMinSlots(bSetId_num);
                const bTotalIncome = bProps.reduce((sum, p) => {
                  const income = calculateIncome(p, bMinSlots, bIsComplete);
                  return sum + income.totalIncome;
                }, 0);

                // Sort by total income descending (highest first)
                return bTotalIncome - aTotalIncome;
              })
              .map(([setIdStr, setProperties]) => {
              const setId = Number(setIdStr);
              const isExpanded = expandedSets.has(setId);
              const isComplete = isSetComplete(setId);
              const minSlots = getMinSlots(setId);
              const setName = getSetName(setId);
              const setColorClass = setProperties[0].propertyInfo.color;
              
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
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? 
                        <ChevronDown className="w-4 h-4 text-purple-400" /> : 
                        <ChevronRight className="w-4 h-4 text-purple-400" />
                      }
                      <div className={`${setColorClass} w-3 h-3 rounded-full`} />
                      <span className="font-bold text-sm text-purple-100">{setName} Set</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-purple-400">{totalSlotsInSet} slots • </span>
                      <span className={isComplete ? 'text-green-400 font-bold' : 'text-purple-400'}>
                        {totalIncomeInSet.toLocaleString()}/day
                      </span>
                    </div>
                  </button>
                  
                  {/* Expandable Content */}
                  {isExpanded && (
                    <div className="px-3 pb-2">
                      {/* Set Bonus Info Banner */}
                      {isComplete && (
                        <div className="bg-green-900/30 rounded px-2 py-1.5 mb-2">
                          <div className="text-[10px] text-green-300 font-bold uppercase tracking-wide flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Complete Set Bonus: +40%
                          </div>
                        </div>
                      )}
                      
                      {/* Properties List with Detailed Breakdown */}
                      <div className="space-y-1.5">
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
                              className="bg-white/[0.02] rounded-lg px-2 py-2 hover:bg-white/[0.06] transition-all cursor-pointer"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-purple-100 truncate">
                                    {owned.propertyInfo.name}
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  <div className="text-xs font-bold text-purple-200">
                                    {owned.slotsOwned} slot{owned.slotsOwned > 1 ? 's' : ''}
                                  </div>
                                  {shieldActive && timeRemaining && (
                                    <div className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                                      <Shield className="w-3 h-3" />
                                      {timeRemaining}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* ALWAYS show detailed breakdown - same format for both complete and non-complete */}
                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                {isComplete && income.bonusedSlots > 0 ? (
                                  <>
                                    {/* Complete set with bonus */}
                                    <div className="flex items-center gap-1">
                                      <Zap className="w-3 h-3 text-green-400" />
                                      <span className="text-green-400 font-bold">{income.bonusedSlots}×</span>
                                      <span className="text-green-300">{Math.floor(owned.propertyInfo.dailyIncome * 1.4)}</span>
                                    </div>
                                    {income.regularSlots > 0 && (
                                      <>
                                        <span className="text-purple-500">+</span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-purple-400">{income.regularSlots}×</span>
                                          <span className="text-purple-300">{owned.propertyInfo.dailyIncome}</span>
                                        </div>
                                      </>
                                    )}
                                    <span className="text-purple-500">=</span>
                                    <span className="text-green-400 font-bold">{income.totalIncome.toLocaleString()}/day</span>
                                  </>
                                ) : (
                                  <>
                                    {/* Non-complete set - SAME FORMAT, just no bonus */}
                                    <div className="flex items-center gap-1">
                                      <span className="text-purple-400 font-bold">{owned.slotsOwned}×</span>
                                      <span className="text-purple-300">{owned.propertyInfo.dailyIncome}</span>
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