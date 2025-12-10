'use client';

// ============================================
// FIXED PropertyModalDetails.tsx
// FIX: Calculate dailyIncome from price and yieldBps instead of using non-existent property.dailyIncome
// ============================================

import { TOKEN_TICKER } from '@/utils/constants';
import { MoneyIcon, StatsIcon, DiamondIcon, SlotMachineIcon, TrendingUpIcon, ClockIcon, BoltIcon, StarIcon, ShieldIcon } from '../icons/UIIcons';

interface PropertyModalDetailsProps {
  property: any;
  propertyData: any;
  setBonusInfo: any;
}

export function PropertyModalDetails({ property, propertyData, setBonusInfo }: PropertyModalDetailsProps) {
  // ✅ FIX: Calculate dailyIncome from price and yieldBps
  // The formula is: (price * yieldBps) / 10000
  const dailyIncome = Math.floor((property.price * property.yieldBps) / 10000);
  const baseIncomePerSlot = dailyIncome;
  const bonusAmount = Math.floor(baseIncomePerSlot * 0.4);
  const totalIncome = baseIncomePerSlot + bonusAmount;
  const hasSetBonus = setBonusInfo?.hasCompleteSet || false;
  
  const totalSlots = property.totalSlots;
  const personalOwned = propertyData?.owned || 0;
  const availableSlots = propertyData?.availableSlots || 0;
  const othersOwned = totalSlots - availableSlots - personalOwned;

  return (
    <div className="bg-purple-900/20 rounded-xl p-3 border border-purple-500/20 space-y-2.5">
      {/* Income Calculation Row */}
      <div>
        <div className="text-[9px] text-purple-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
          <MoneyIcon size={10} className="text-purple-400" />
          Income
        </div>
        <div className="flex items-center gap-2 bg-purple-950/50 rounded-lg p-1.5">
          {/* Base */}
          <div className="flex flex-col flex-1">
            <div className="text-[8px] text-purple-400 uppercase flex items-center gap-1">
              <StatsIcon size={8} className="text-purple-400" />
              Base
            </div>
            <div className="text-sm font-bold text-purple-100">{baseIncomePerSlot.toLocaleString()}</div>
          </div>
          
          <div className="text-purple-400 opacity-50 font-bold text-sm">+</div>
          
          {/* Boost */}
          <div className="flex flex-col flex-1">
            <div className="text-[8px] text-purple-400 uppercase flex items-center gap-1">
              <BoltIcon size={8} className="text-purple-400" />
              Boost <span className={`px-1 py-0.5 rounded text-[7px] font-bold ${hasSetBonus ? 'bg-amber-500 text-amber-950' : 'bg-gray-600 text-gray-300 opacity-60'}`}>+40%</span>
            </div>
            <div className={`text-sm font-bold ${hasSetBonus ? 'text-purple-100' : 'text-purple-100/50 line-through'}`}>
              {bonusAmount.toLocaleString()}
            </div>
          </div>
          
          <div className="text-purple-400 opacity-50 font-bold text-sm">=</div>
          
          {/* Total */}
          <div className={`flex flex-col flex-[1.2] rounded-lg p-1.5 border-2 ${hasSetBonus ? 'bg-green-900/15 border-green-500/30' : 'bg-gray-900/15 border-gray-500/30'}`}>
            <div className="text-[8px] text-purple-400 uppercase flex items-center gap-1">
              <DiamondIcon size={8} className="text-purple-400" />
              Total
            </div>
            <div className={`text-lg font-bold ${hasSetBonus ? 'text-green-400' : 'text-gray-400'}`}>
              {hasSetBonus ? totalIncome.toLocaleString() : baseIncomePerSlot.toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* Set Bonus Info */}
        {hasSetBonus && (
          <div className="mt-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-amber-400 font-medium">
                <span className="flex items-center gap-1">
                  <StarIcon size={10} className="text-amber-400" />
                  Complete Set Bonus Active
                </span>
              </span>
              <span className="text-amber-300">
                +40% on {setBonusInfo.boostedSlots} slot{setBonusInfo.boostedSlots !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Slot Distribution */}
      <div>
        <div className="text-[9px] text-purple-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
          <SlotMachineIcon size={10} className="text-purple-400" />
          Slots ({totalSlots} total)
        </div>
        
        {/* Visual Bar */}
        <div className="h-4 bg-gray-800/50 rounded-full overflow-hidden flex border border-gray-700/50">
          {personalOwned > 0 && (
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center"
              style={{ width: `${(personalOwned / totalSlots) * 100}%` }}
            >
              <span className="text-[8px] font-bold text-white drop-shadow">
                {personalOwned > 0 && `${personalOwned}`}
              </span>
            </div>
          )}
          
          {othersOwned > 0 && (
            <div 
              className="bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center"
              style={{ width: `${(othersOwned / totalSlots) * 100}%` }}
            >
              <span className="text-[8px] font-bold text-white drop-shadow">
                {othersOwned > 0 && `${othersOwned}`}
              </span>
            </div>
          )}
          
          {availableSlots > 0 && (
            <div 
              className="bg-gradient-to-r from-gray-600 to-gray-500 flex items-center justify-center"
              style={{ width: `${(availableSlots / totalSlots) * 100}%` }}
            >
              <span className="text-[8px] font-bold text-white drop-shadow">
                {availableSlots > 0 && `${availableSlots}`}
              </span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-3 mt-2 text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-400">You: <span className="text-green-400 font-semibold">{personalOwned}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-400">Others: <span className="text-red-400 font-semibold">{othersOwned}</span></span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-gray-400">Free: <span className="text-gray-300 font-semibold">{availableSlots}</span></span>
          </div>
        </div>
      </div>

      {/* Property Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-purple-950/30 rounded-lg p-2 border border-purple-500/10">
          <div className="text-[8px] text-purple-400 uppercase mb-0.5 flex items-center gap-1">
            <MoneyIcon size={8} className="text-purple-400" />
            Price
          </div>
          <div className="text-sm font-bold text-purple-100">{property.price.toLocaleString()} ${TOKEN_TICKER}</div>
        </div>
        
        <div className="bg-purple-950/30 rounded-lg p-2 border border-purple-500/10">
          <div className="text-[8px] text-purple-400 uppercase mb-0.5 flex items-center gap-1">
            <TrendingUpIcon size={8} className="text-purple-400" />
            Daily Yield
          </div>
          <div className="text-sm font-bold text-purple-100">{(property.yieldBps / 100).toFixed(1)}%</div>
        </div>
        
        <div className="bg-purple-950/30 rounded-lg p-2 border border-purple-500/10">
          <div className="text-[8px] text-purple-400 uppercase mb-0.5 flex items-center gap-1">
            <ShieldIcon size={8} className="text-purple-400" />
            Shield Cost
          </div>
          <div className="text-sm font-bold text-purple-100">{(property.shieldCostBps / 100).toFixed(0)}%</div>
        </div>
        
        <div className="bg-purple-950/30 rounded-lg p-2 border border-purple-500/10">
          <div className="text-[8px] text-purple-400 uppercase mb-0.5 flex items-center gap-1">
            <ClockIcon size={8} className="text-purple-400" />
            Cooldown
          </div>
          <div className="text-sm font-bold text-purple-100">{property.cooldown}h</div>
        </div>
      </div>
    </div>
  );
}