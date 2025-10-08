'use client';

import { PROPERTIES } from '@/utils/constants';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
}

export function Board({ onSelectProperty }: BoardProps) {
  return (
    <div className="flex items-center justify-center perspective-1500">
      <div className="w-full max-w-[900px] aspect-square bg-gradient-to-br from-[#f5f3eb]/98 to-[#e8e4da]/98 backdrop-blur-xl border-4 border-purple-500/40 rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)] rotate-x-3">
        {/* Board Grid */}
        <div className="w-full h-full grid grid-cols-11 grid-rows-11 gap-0">
          {/* Top-left Corner */}
          <div className="col-start-1 row-start-1 bg-[#f5f3eb] border border-[#d1ccc0] flex flex-col items-center justify-center p-2">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-[9px] font-bold text-center text-gray-800 uppercase">Liquidity<br/>Pool</div>
          </div>
          
          {/* Top-right Corner */}
          <div className="col-start-11 row-start-1 bg-[#f5f3eb] border border-[#d1ccc0] flex flex-col items-center justify-center p-2">
            <div className="text-2xl mb-1">⚖️</div>
            <div className="text-[9px] font-bold text-center text-gray-800 uppercase">SEC<br/>Enforcement</div>
          </div>
          
          {/* Bottom-left Corner */}
          <div className="col-start-1 row-start-11 bg-[#f5f3eb] border border-[#d1ccc0] flex flex-col items-center justify-center p-2">
            <div className="text-2xl mb-1">🔒</div>
            <div className="text-[9px] font-bold text-center text-gray-800 uppercase">Rug Pull<br/>Prison</div>
          </div>
          
          {/* Bottom-right Corner */}
          <div className="col-start-11 row-start-11 bg-[#f5f3eb] border border-[#d1ccc0] flex flex-col items-center justify-center p-2">
            <div className="text-2xl mb-1">🪂</div>
            <div className="text-[9px] font-bold text-center text-gray-800 uppercase">Airdrop<br/>Zone</div>
          </div>

          {/* Center Logo */}
          <div className="col-start-2 col-span-9 row-start-2 row-span-9 bg-gradient-to-br from-purple-700 to-purple-500 flex flex-col items-center justify-center border-2 border-purple-600/30 shadow-inner">
            <div className="text-5xl lg:text-6xl font-extrabold text-white tracking-widest drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              MEMEOPOLY
            </div>
            <div className="text-sm text-white/80 mt-2 font-medium tracking-wider">DeFi Edition</div>
          </div>

          {/* Properties - Distributed around the board */}
          {PROPERTIES.map((prop, idx) => {
            let gridProps = {};
            
            // Top row (2 properties)
            if (idx === 0) gridProps = { gridColumnStart: 2, gridRowStart: 1 };
            if (idx === 1) gridProps = { gridColumnStart: 6, gridRowStart: 1 };
            
            // Right side (2 properties)
            if (idx === 2) gridProps = { gridColumnStart: 11, gridRowStart: 2 };
            if (idx === 3) gridProps = { gridColumnStart: 11, gridRowStart: 6 };
            
            // Bottom row (2 properties)
            if (idx === 4) gridProps = { gridColumnStart: 10, gridRowStart: 11 };
            if (idx === 5) gridProps = { gridColumnStart: 6, gridRowStart: 11 };
            
            // Left side (2 properties)
            if (idx === 6) gridProps = { gridColumnStart: 1, gridRowStart: 10 };
            if (idx === 7) gridProps = { gridColumnStart: 1, gridRowStart: 6 };

            return (
              <div
                key={prop.id}
                className="bg-[#f5f3eb] border border-[#d1ccc0] p-1.5 cursor-pointer hover:scale-110 hover:z-20 transition-transform hover:shadow-xl"
                style={gridProps}
                onClick={() => onSelectProperty(prop.id)}
              >
                <div className={`h-5 w-full ${prop.color} mb-1.5`}></div>
                <div className="text-[8px] font-bold text-center text-gray-900 leading-tight mb-1 px-0.5">
                  {prop.name}
                </div>
                <div className="text-[7px] text-center text-gray-600 font-medium">
                  ${(prop.price / 1000).toFixed(0)}K
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}