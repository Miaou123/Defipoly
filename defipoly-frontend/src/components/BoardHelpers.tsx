'use client';

import { DiceIcon } from './icons/UIIcons';

interface CornerSquareProps {
  icon: string;
  label: string;
  bgColor: string;
}

export function CornerSquare({ icon, label, bgColor }: CornerSquareProps) {
  // Style ALL corner squares like PropertyCards but blank with dice + DeFiPoly
  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(109, 40, 217, 0.05))`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {/* Border matching PropertyCard style */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '2px solid rgba(139, 92, 246, 0.3)',
        }}
      />

      {/* Card content */}
      <div className="relative flex flex-col h-full">
        {/* Top color bar - use a neutral purple */}
        <div 
          className="h-4 w-full flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(109, 40, 217, 0.3))',
          }}
        />

        {/* Middle section with dice and DeFiPoly text */}
        <div 
          className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2"
          style={{
            background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.4), rgba(109, 40, 217, 0.2))',
          }}
        >
          <DiceIcon size={48} className="text-purple-400" />
          <div 
            className="text-[10px] font-black uppercase text-purple-200 tracking-wider"
          >
            DeFiPoly
          </div>
        </div>

      </div>
    </div>
  );
}

interface FillerSquareProps {
  icon: string;
  label: string;
  bgColor: string;
}

export function FillerSquare({ icon, label, bgColor }: FillerSquareProps) {
  // Style like PropertyCards but blank with dice + DeFiPoly
  return (
    <div 
      className="w-full h-full relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(109, 40, 217, 0.05))`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {/* Border matching PropertyCard style */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '2px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
        }}
      />

      {/* Card content */}
      <div className="relative flex flex-col h-full">
        {/* Top color bar - use a neutral purple */}
        <div 
          className="h-4 w-full flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(109, 40, 217, 0.3))',
          }}
        />

        {/* Middle section with dice and DeFiPoly text */}
        <div 
          className="flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2"
          style={{
            background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.4), rgba(109, 40, 217, 0.2))',
          }}
        >
          <DiceIcon size={48} className="text-purple-400" />
          <div 
            className="text-[10px] font-black uppercase text-purple-200 tracking-wider"
          >
            DeFiPoly
          </div>
        </div>

        {/* Bottom section - empty for now */}
        <div 
          className="px-1 py-1 flex-shrink-0"
          style={{
            background: 'rgba(12, 5, 25, 0.8)',
            borderTop: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <div className="h-3"></div>
        </div>
      </div>
    </div>
  );
}