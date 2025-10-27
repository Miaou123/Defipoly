'use client';

import { PROPERTIES } from '@/utils/constants';
import { PropertyCard } from './PropertyCard';
import { RewardsPanel } from './RewardsPanel';
import { CornerSquare } from './BoardHelpers';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
}

export function Board({ onSelectProperty }: BoardProps) {
  return (
    <div className="flex items-center justify-center w-full h-full relative">
      <div 
        className="w-full max-w-[min(90vh,90vw)] aspect-square rounded-lg relative z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(12, 5, 25, 0.95), rgba(26, 11, 46, 0.9))',
        }}
      >
        <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-0 relative z-10">
          
          {/* ========== TOP-LEFT CORNER: Red 1 (Kentucky Avenue) ========== */}
          <div className="col-start-1 row-start-1">
            <PropertyCard propertyId={11} onSelect={onSelectProperty} />
          </div>
          
          {/* ========== TOP ROW: Red (12-13) + Yellow (14-16) ========== */}
          <div className="col-start-2 row-start-1"><PropertyCard propertyId={12} onSelect={onSelectProperty} /></div>
          <div className="col-start-3 row-start-1"><PropertyCard propertyId={13} onSelect={onSelectProperty} /></div>
          <div className="col-start-4 row-start-1"><PropertyCard propertyId={14} onSelect={onSelectProperty} /></div>
          <div className="col-start-5 row-start-1"><PropertyCard propertyId={15} onSelect={onSelectProperty} /></div>
          <div className="col-start-6 row-start-1"><PropertyCard propertyId={16} onSelect={onSelectProperty} /></div>
          
          {/* ========== TOP-RIGHT CORNER: DEFIPOLY ========== */}
          <div className="col-start-7 row-start-1">
            <CornerSquare icon="🎲" label="DEFIPOLY" bgColor="bg-purple-600" />
          </div>

          {/* ========== LEFT SIDE: Orange (10, 9, 8) + Pink (7, 6) ========== */}
          <div className="col-start-1 row-start-2"><PropertyCard propertyId={10} onSelect={onSelectProperty} /></div>
          <div className="col-start-1 row-start-3"><PropertyCard propertyId={9} onSelect={onSelectProperty} /></div>
          <div className="col-start-1 row-start-4"><PropertyCard propertyId={8} onSelect={onSelectProperty} /></div>
          <div className="col-start-1 row-start-5"><PropertyCard propertyId={7} onSelect={onSelectProperty} /></div>
          <div className="col-start-1 row-start-6"><PropertyCard propertyId={6} onSelect={onSelectProperty} /></div>

          {/* ========== CENTER: Enhanced Rewards Panel ========== */}
          <div 
            className="col-start-2 col-span-5 row-start-2 row-span-5 flex flex-col items-center justify-center shadow-inner relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.6), rgba(109, 40, 217, 0.4))',
              boxShadow: 'inset 0 0 60px rgba(139, 92, 246, 0.3)',
            }}
          >
            {/* Rewards Panel */}
            <div className="relative z-10">
              <RewardsPanel />
            </div>
          </div>

          {/* ========== RIGHT SIDE: Green (17-19) + Dark Blue (20-21) ========== */}
          <div className="col-start-7 row-start-2"><PropertyCard propertyId={17} onSelect={onSelectProperty} /></div>
          <div className="col-start-7 row-start-3"><PropertyCard propertyId={18} onSelect={onSelectProperty} /></div>
          <div className="col-start-7 row-start-4"><PropertyCard propertyId={19} onSelect={onSelectProperty} /></div>
          <div className="col-start-7 row-start-5"><PropertyCard propertyId={20} onSelect={onSelectProperty} /></div>
          <div className="col-start-7 row-start-6"><PropertyCard propertyId={21} onSelect={onSelectProperty} /></div>

          {/* ========== BOTTOM-LEFT CORNER: Pink 1 (St. James Place) ========== */}
          <div className="col-start-1 row-start-7">
            <PropertyCard propertyId={5} onSelect={onSelectProperty} />
          </div>

          {/* ========== BOTTOM ROW: Light Blue (4-2) + Brown (1-0) ========== */}
          <div className="col-start-2 row-start-7"><PropertyCard propertyId={4} onSelect={onSelectProperty} /></div>
          <div className="col-start-3 row-start-7"><PropertyCard propertyId={3} onSelect={onSelectProperty} /></div>
          <div className="col-start-4 row-start-7"><PropertyCard propertyId={2} onSelect={onSelectProperty} /></div>
          <div className="col-start-5 row-start-7"><PropertyCard propertyId={1} onSelect={onSelectProperty} /></div>
          <div className="col-start-6 row-start-7"><PropertyCard propertyId={0} onSelect={onSelectProperty} /></div>
          
          {/* ========== BOTTOM-RIGHT CORNER: DEFIPOLY ========== */}
          <div className="col-start-7 row-start-7">
            <CornerSquare icon="🎲" label="DEFIPOLY" bgColor="bg-purple-600" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .holographic-board {
          transition: box-shadow 0.5s ease-in-out;
        }

        .holographic-board:hover {
          box-shadow: 
            inset 0 0 120px rgba(147, 51, 234, 0.4), 
            0 0 80px rgba(147, 51, 234, 0.5),
            0 0 120px rgba(139, 92, 246, 0.3);
        }
      `}</style>
    </div>
  );
}