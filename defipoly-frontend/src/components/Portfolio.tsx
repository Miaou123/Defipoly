'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PROPERTIES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import type { PropertyOwnership } from '@/types/accounts';
import { formatTimeRemaining, isShieldExpired } from '@/utils/time';

interface OwnedProperty extends PropertyOwnership {
  propertyInfo: typeof PROPERTIES[0];
}

interface PortfolioProps {
  onSelectProperty: (propertyId: number) => void;
}

export function Portfolio({ onSelectProperty }: PortfolioProps) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { getOwnershipData, program } = useDefipoly();
  const [ownedProperties, setOwnedProperties] = useState<OwnedProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for shield countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('=== PORTFOLIO DEBUG ===');
    console.log('publicKey:', publicKey?.toString());
    console.log('connected:', connected);
    console.log('program:', program);

    if (!publicKey || !connected || !program) {
      console.log('⚠️ Missing requirements - skipping fetch');
      setOwnedProperties([]);
      setDailyIncome(0);
      setPortfolioValue(0);
      return;
    }

    const fetchPortfolio = async () => {
      console.log('🔍 Starting portfolio fetch...');
      setLoading(true);
      
      try {
        const ownerships: OwnedProperty[] = [];

        // Check ownership for each property
        for (const property of PROPERTIES) {
          console.log(`\n📦 Checking property ${property.id} (${property.name})...`);
          
          try {
            const ownershipData = await getOwnershipData(property.id);
            
            if (ownershipData && ownershipData.slotsOwned > 0) {
              console.log(`✅ Player owns ${ownershipData.slotsOwned} slot(s) of property ${property.id}`);
              
              // Create a plain object to avoid any reference issues
              const ownedProperty: OwnedProperty = {
                player: ownershipData.player,
                propertyId: ownershipData.propertyId,
                slotsOwned: ownershipData.slotsOwned,
                shieldActive: ownershipData.shieldActive,
                shieldExpiry: ownershipData.shieldExpiry,
                shieldCyclesQueued: ownershipData.shieldCyclesQueued,
                lastClaimTimestamp: ownershipData.lastClaimTimestamp,
                bump: ownershipData.bump,
                propertyInfo: property,
              };
              
              ownerships.push(ownedProperty);
            }
          } catch (error) {
            console.error(`Error fetching property ${property.id}:`, error);
          }
        }

        console.log('\n📊 Total owned properties:', ownerships.length);

        // CRITICAL: Force a new array reference to trigger React re-render
        setOwnedProperties([...ownerships]);

        // Calculate stats
        let income = 0;
        let value = 0;
        ownerships.forEach(owned => {
          const propIncome = owned.propertyInfo.dailyIncome * owned.slotsOwned;
          const propValue = owned.propertyInfo.price * owned.slotsOwned;
          income += propIncome;
          value += propValue;
        });
        
        console.log('💰 Total daily income:', income);
        console.log('💎 Total portfolio value:', value);
        
        setDailyIncome(income);
        setPortfolioValue(value);
      } catch (error) {
        console.error('❌ Error fetching portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
    
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing portfolio...');
      fetchPortfolio();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [publicKey, connected, program, getOwnershipData]);

  if (!connected) {
    return (
      <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 max-h-[calc(100vh-140px)] overflow-y-auto">
        <div className="text-center py-12">
          <div className="text-5xl mb-3 opacity-50">👛</div>
          <div className="text-sm text-gray-400">
            Connect your wallet<br />to view your portfolio
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-900/8 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 max-h-[calc(100vh-140px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-purple-500/20">
        <h2 className="text-lg font-semibold text-purple-200">My Portfolio</h2>
        <span className="text-sm text-purple-400">
          {ownedProperties.reduce((sum, p) => sum + p.slotsOwned, 0)} slots
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-purple-900/15 p-3 rounded-xl border border-purple-500/30">
          <div className="text-[11px] text-purple-300 uppercase tracking-wider mb-1">Daily Income</div>
          <div className="text-xl font-bold text-purple-100">{dailyIncome.toLocaleString()}</div>
        </div>
        <div className="bg-purple-900/15 p-3 rounded-xl border border-purple-500/30">
          <div className="text-[11px] text-purple-300 uppercase tracking-wider mb-1">Total Value</div>
          <div className="text-xl font-bold text-purple-100">{portfolioValue.toLocaleString()}</div>
        </div>
      </div>

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
          <div className="text-5xl mb-3 opacity-50">🏘️</div>
          <div className="text-sm text-gray-400">
            No properties yet<br />
            Click on the board to start building!
          </div>
        </div>
      )}

      {/* Owned Properties */}
      {ownedProperties.length > 0 && (
        <div className="space-y-3">
          {ownedProperties.map((owned, index) => {
            const shieldExpired = owned.shieldActive && isShieldExpired(owned.shieldExpiry);
            const timeRemaining = owned.shieldActive && !shieldExpired 
              ? formatTimeRemaining(owned.shieldExpiry)
              : null;

            return (
              <div
                key={`property-${owned.propertyId}-${index}`}
                onClick={() => onSelectProperty(owned.propertyId)}
                className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-3 cursor-pointer hover:bg-purple-900/15 hover:border-purple-500/40 transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-semibold text-purple-100">{owned.propertyInfo.name}</div>
                  <div className="flex gap-2">
                    {owned.shieldActive && !shieldExpired && timeRemaining && (
                      <div className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded font-mono">
                        🛡️ {timeRemaining}
                      </div>
                    )}
                    <div className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                      {owned.slotsOwned} slot{owned.slotsOwned > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-purple-300">
                  <span>{owned.propertyInfo.dailyIncome * owned.slotsOwned} DEFI/day</span>
                  <span>{owned.propertyInfo.price * owned.slotsOwned} DEFI</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}