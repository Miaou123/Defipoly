'use client';

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
  console.log('Board component rendering', { spectatorMode, spectatorOwnerships });

  return (
    <div className="w-full h-full relative">
      {console.log('Board wrapper div rendered')}
      
      {/* 3D Board Scene with integrated IncomeFlow3D */}
      <Board3DScene 
        onSelectProperty={onSelectProperty}
        spectatorMode={spectatorMode}
        spectatorOwnerships={spectatorOwnerships}
      />
    </div>
  );
}