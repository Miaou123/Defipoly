'use client';

import { useState, useCallback } from 'react';
import { IncomeFlowOverlay } from './IncomeFlowOverlay';
import { Board3DScene } from './3d/Board3DScene';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
  spectatorMode?: boolean;
  spectatorWallet?: string;
  spectatorOwnerships?: any[];
  profilePicture?: string | null;
  cornerSquareStyle?: 'property' | 'profile';
  customBoardBackground?: string | null;
  customPropertyCardBackground?: string | null;
}

export function Board({ 
  onSelectProperty, 
  spectatorMode = false, 
  spectatorOwnerships = [],
}: BoardProps) {
  const [showAnimations, setShowAnimations] = useState(true);
  const [lastIncomeArrived, setLastIncomeArrived] = useState<number | null>(null);

  // Callback for when particles arrive at the bank
  const handleParticleArrive = useCallback((incomeValue: number) => {
    setLastIncomeArrived(incomeValue);
    setTimeout(() => setLastIncomeArrived(null), 50);
  }, []);

  console.log('Board component rendering', { spectatorMode, spectatorOwnerships });

  return (
    <div className="w-full h-full relative">
      {console.log('Board wrapper div rendered')}
      
      {/* IncomeFlowOverlay - only render when showAnimations is true */}
      {!spectatorMode && showAnimations && (
        <IncomeFlowOverlay onParticleArrive={handleParticleArrive} enabled={showAnimations} />
      )}
      
      {/* 3D Board Scene */}
      <Board3DScene 
        onSelectProperty={onSelectProperty}
        spectatorMode={spectatorMode}
        spectatorOwnerships={spectatorOwnerships}
      />
    </div>
  );
}