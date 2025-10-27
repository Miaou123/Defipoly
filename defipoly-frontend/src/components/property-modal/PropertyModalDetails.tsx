'use client';

interface PropertyModalDetailsProps {
  property: any;
  propertyData: any;
  setBonusInfo: any;
}

export function PropertyModalDetails({ property, propertyData, setBonusInfo }: PropertyModalDetailsProps) {
  const dailyIncome = property.dailyIncome;
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
        <div className="text-[9px] text-purple-400 mb-1.5 uppercase tracking-wider">💰 Income</div>
        <div className="flex items-center gap-2 bg-purple-950/50 rounded-lg p-1.5">
          {/* Base */}
          <div className="flex flex-col flex-1">
            <div className="text-[8px] text-purple-400 uppercase">📊 Base</div>
            <div className="text-sm font-bold text-purple-100">{baseIncomePerSlot.toLocaleString()}</div>
          </div>
          
          <div className="text-purple-400 opacity-50 font-bold text-sm">+</div>
          
          {/* Boost */}
          <div className="flex flex-col flex-1">
            <div className="text-[8px] text-purple-400 uppercase flex items-center gap-1">
              ⚡ Boost <span className={`px-1 py-0.5 rounded text-[7px] font-bold ${hasSetBonus ? 'bg-amber-500 text-amber-950' : 'bg-gray-600 text-gray-300 opacity-60'}`}>+40%</span>
            </div>
            <div className={`text-sm font-bold ${hasSetBonus ? 'text-purple-100' : 'text-purple-100/50 line-through'}`}>
              {bonusAmount.toLocaleString()}
            </div>
          </div>
          
          <div className="text-purple-400 opacity-50 font-bold text-sm">=</div>
          
          {/* Total */}
          <div className={`flex flex-col flex-[1.2] rounded-lg p-1.5 border-2 ${hasSetBonus ? 'bg-green-900/15 border-green-500/30' : 'bg-gray-900/15 border-gray-500/30'}`}>
            <div className="text-[8px] text-purple-400 uppercase">💎 Total</div>
            <div className={`text-lg font-bold ${hasSetBonus ? 'text-green-400' : 'text-gray-400'}`}>
              {hasSetBonus ? totalIncome.toLocaleString() : baseIncomePerSlot.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-purple-500/10"></div>

      {/* Slots Distribution Row */}
      <div>
        <div className="text-[9px] text-purple-400 mb-1.5 uppercase tracking-wider">🎰 Slots</div>
        <div className="space-y-2">
          {/* Values */}
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-lg font-bold text-purple-100">{totalSlots - availableSlots}</span>
              <span className="text-[9px] text-purple-400 ml-1">/ {totalSlots} slots filled</span>
            </div>
            <div>
              <span className="text-lg font-bold text-purple-100">{availableSlots}</span>
              <span className="text-[9px] text-purple-400 ml-1">available</span>
            </div>
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
          <div className="flex gap-3 text-[10px]">
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
  );
}