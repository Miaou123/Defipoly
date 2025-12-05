'use client';

import { Board3DScene } from './3d/Board3DScene';

interface BoardProps {
  onSelectProperty: (propertyId: number) => void;
  onCoinClick?: () => void;
  spectatorMode?: boolean;
  spectatorWallet?: string;
  spectatorOwnerships?: any[];
  profilePicture?: string | null;
  cornerSquareStyle?: 'property' | 'profile';
  customBoardBackground?: string | null;
  customPropertyCardBackground?: string | null;
  custom3DPropertyTiles?: string | null;
}

export function Board({ 
  onSelectProperty,
  onCoinClick,
  spectatorMode = false, 
  spectatorOwnerships = [],
  customBoardBackground,
  custom3DPropertyTiles,
}: BoardProps) {


  return (
    <div className="w-full h-full relative">
      
      {/* 3D Board Scene with integrated IncomeFlow3D */}
      <Board3DScene 
        onSelectProperty={onSelectProperty}
        onCoinClick={onCoinClick}
        spectatorMode={spectatorMode}
        spectatorOwnerships={spectatorOwnerships}
        customBoardBackground={customBoardBackground}
        custom3DPropertyTiles={custom3DPropertyTiles}
      />
    </div>
  );
}