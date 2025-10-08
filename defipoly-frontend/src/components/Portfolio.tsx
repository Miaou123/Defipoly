'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PROPERTIES } from '@/utils/constants';
import { useDefipoly } from '@/hooks/useDefipoly';
import type { PropertyOwnership } from '@/types/accounts';

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

  useEffect(() => {
    console.log('=== PORTFOLIO DEBUG ===');
    console.log('publicKey:', publicKey?.toString());
    console.log('connected:', connected);
    console.log('program:', program);
    console.log('getOwnershipData function:', typeof getOwnershipData);

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
            console.log(`Property ${property.id} ownership data:`, ownershipData);
            
            if (ownershipData) {
              console.log(`  - slotsOwned: ${ownershipData.slotsOwned}`);
              console.log(`  - shieldActive: ${ownershipData.shieldActive}`);
              console.log(`  - player: ${ownershipData.player.toString()}`);
              
              if (ownershipData.slotsOwned > 0) {
                console.log(`✅ Player owns ${ownershipData.slotsOwned} slot(s) of property ${property.id}`);
                ownerships.push({
                  ...ownershipData,
                  propertyInfo: property,
                });
              } else {
                console.log(`❌ Player owns 0 slots of property ${property.id}`);
              }
            } else {
              console.log(`❌ No ownership data for property ${property.id}`);
            }
          } catch (error) {
            console.error(`Error fetching property ${property.id}:`, error);
          }
        }

        console.log('\n📊 Total owned properties:', ownerships.length);
        console.log('Owned properties:', ownerships);
        
        setOwnedProperties(ownerships);

        // Calculate stats
        let income = 0;
        let value = 0;
        ownerships.forEach(owned => {
          const propIncome = owned.propertyInfo.dailyIncome * owned.slotsOwned;
          const propValue = owned.propertyInfo.price * owned.slotsOwned;
          console.log(`Property ${owned.propertyId}: ${propIncome} income, ${propValue} value`);
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
    
    // Refresh every 10 seconds for debugging (increased from 5)
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

      {/* Debug Info */}
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4 text-xs">
        <div className="font-bold text-red-300 mb-2">🐛 Debug Info:</div>
        <div className="text-red-200 space-y-1">
          <div>Connected: {connected ? '✅' : '❌'}</div>
          <div>Program: {program ? '✅' : '❌'}</div>
          <div>Owned Properties: {ownedProperties.length}</div>
          <div>Loading: {loading ? '⏳' : '✅'}</div>
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
          {ownedProperties.map(owned => (
            <div
              key={owned.propertyId}
              onClick={() => onSelectProperty(owned.propertyId)}
              className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-3 cursor-pointer hover:bg-purple-900/15 hover:border-purple-500/40 transition-all"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-semibold text-purple-100">{owned.propertyInfo.name}</div>
                <div className="flex gap-2">
                  {owned.shieldActive && (
                    <div className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                      🛡️ Active
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
          ))}
        </div>
      )}
    </div>
  );
}