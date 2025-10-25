'use client';

import { PROPERTIES } from '@/utils/constants';
import { PropertyCard } from './PropertyCard';
import { RewardsPanel } from './RewardsPanel';
import { CornerSquare, FillerSquare } from './BoardHelpers';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
}

export function Board({ onSelectProperty }: BoardProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div 
        className="w-full max-w-[95vw] aspect-square rounded-lg shadow-2xl border-8 border-purple-900/50"
        style={{
          background: 'rgba(12, 5, 25, 0.75)',
          boxShadow: 'inset 0 0 100px rgba(147, 51, 234, 0.2), 0 0 60px rgba(147, 51, 234, 0.3)'
        }}
      >
        <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0">
          
          {/* ========== TOP-LEFT CORNER: Liquidity Pool ========== */}
          <div className="col-start-1 row-start-1">
            <CornerSquare icon="💰" label="Liquidity\nPool" bgColor="bg-yellow-300" />
          </div>
          
          {/* ========== TOP ROW: Red (11-13) + Yellow (14-16) - LEFT TO RIGHT ========== */}
          <div className="col-start-2 row-start-1"><PropertyCard propertyId={11} onSelect={onSelectProperty} /></div>
          <div className="col-start-3 row-start-1"><PropertyCard propertyId={12} onSelect={onSelectProperty} /></div>
          <div className="col-start-4 row-start-1"><PropertyCard propertyId={13} onSelect={onSelectProperty} /></div>
          <div className="col-start-5 row-start-1"><PropertyCard propertyId={14} onSelect={onSelectProperty} /></div>
          <div className="col-start-6 row-start-1"><PropertyCard propertyId={15} onSelect={onSelectProperty} /></div>
          <div className="col-start-7 row-start-1"><PropertyCard propertyId={16} onSelect={onSelectProperty} /></div>
          
          {/* ========== TOP-RIGHT CORNER: SEC Enforcement ========== */}
          <div className="col-start-8 row-start-1">
            <CornerSquare icon="⚖️" label="SEC\nEnforcement" bgColor="bg-orange-400" />
          </div>

          {/* ========== LEFT SIDE: Pink (5-7) BOTTOM + Orange (8-10) TOP ========== */}
          <div className="col-start-1 row-start-2"><PropertyCard propertyId={10} onSelect={onSelectProperty} /></div>
          <div className="col-start-1 row-start-3"><PropertyCard propertyId={9} onSelect={onSelectProperty} /></div>
          <div className="col-start-1 row-start-4"><PropertyCard propertyId={8} onSelect={onSelectProperty} /></div>
          <div className="col-start-1 row-start-5"><PropertyCard propertyId={7} onSelect={onSelectProperty} /></div>
          <div className="col-start-1 row-start-6"><PropertyCard propertyId={6} onSelect={onSelectProperty} /></div>
          <div className="col-start-1 row-start-7"><PropertyCard propertyId={5} onSelect={onSelectProperty} /></div>

          {/* ========== CENTER: Logo & Rewards ========== */}
          <div className="col-start-2 col-span-6 row-start-2 row-span-6 bg-gradient-to-br from-purple-950 via-purple-950 to-purple-900 flex flex-col items-center justify-center border-2 border-purple-900 shadow-inner relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 animate-pulse"></div>
            

            {/* Rewards Panel */}
            <RewardsPanel />
          </div>

          {/* ========== RIGHT SIDE: Green (17-19) TOP + FILLER + Dark Blue (20-21) BOTTOM ========== */}
          <div className="col-start-8 row-start-2"><PropertyCard propertyId={17} onSelect={onSelectProperty} /></div>
          <div className="col-start-8 row-start-3"><PropertyCard propertyId={18} onSelect={onSelectProperty} /></div>
          <div className="col-start-8 row-start-4"><PropertyCard propertyId={19} onSelect={onSelectProperty} /></div>
          <div className="col-start-8 row-start-5">
            <FillerSquare icon="🌉" label="Bridge Protocol" bgColor="bg-cyan-300" />
          </div>
          <div className="col-start-8 row-start-6"><PropertyCard propertyId={20} onSelect={onSelectProperty} /></div>
          <div className="col-start-8 row-start-7"><PropertyCard propertyId={21} onSelect={onSelectProperty} /></div>

          {/* ========== BOTTOM-LEFT CORNER: Rug Pull Prison ========== */}
          <div className="col-start-1 row-start-8">
            <CornerSquare icon="🔒" label="Rug Pull\nPrison" bgColor="bg-gray-400" />
          </div>

          {/* ========== BOTTOM ROW: Brown (0-1) + FILLER + Light Blue (2-4) - RIGHT TO LEFT FROM GO ========== */}
          <div className="col-start-2 row-start-8"><PropertyCard propertyId={4} onSelect={onSelectProperty} /></div>
          <div className="col-start-3 row-start-8"><PropertyCard propertyId={3} onSelect={onSelectProperty} /></div>
          <div className="col-start-4 row-start-8"><PropertyCard propertyId={2} onSelect={onSelectProperty} /></div>
          <div className="col-start-5 row-start-8">
            <FillerSquare icon="⚡" label="Flash Loan" bgColor="bg-purple-300" />
          </div>
          <div className="col-start-6 row-start-8"><PropertyCard propertyId={1} onSelect={onSelectProperty} /></div>
          <div className="col-start-7 row-start-8"><PropertyCard propertyId={0} onSelect={onSelectProperty} /></div>
          
          {/* ========== BOTTOM-RIGHT CORNER: Airdrop Zone (GO) ========== */}
          <div className="col-start-8 row-start-8">
            <CornerSquare icon="🪂" label="Airdrop\nZone" bgColor="bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
}