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
  customSceneBackground?: string | null;
  boardPresetId?: string | null;
  tilePresetId?: string | null;
  themeCategory?: 'dark' | 'medium' | 'light' | null;
  writingStyle?: 'light' | 'dark';
  isMobile?: boolean;
}

export function Board({ 
  onSelectProperty,
  onCoinClick,
  spectatorMode = false, 
  spectatorOwnerships = [],
  customBoardBackground,
  custom3DPropertyTiles,
  customSceneBackground,
  boardPresetId,
  tilePresetId,
  themeCategory,
  writingStyle,
  profilePicture,
  cornerSquareStyle,
  isMobile = false,
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
        customSceneBackground={customSceneBackground}
        boardPresetId={boardPresetId}
        tilePresetId={tilePresetId}
        themeCategory={themeCategory}
        writingStyle={writingStyle}
        profilePicture={profilePicture}
        cornerSquareStyle={cornerSquareStyle}
        isMobile={isMobile}
      />
    </div>
  );
}