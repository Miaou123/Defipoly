'use client';

import { Board3DScene } from './3d/Board3DScene';
import { ShowcaseScene } from '@/utils/showcaseScenes';

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
  showcaseMode?: boolean;
  showcaseScene?: ShowcaseScene | null;
  onExitShowcase?: () => void;
  onStartShowcase?: () => void;
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
  showcaseMode = false,
  showcaseScene,
  onExitShowcase,
  onStartShowcase,
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
        showcaseMode={showcaseMode}
        showcaseScene={showcaseScene || null}
        {...(onExitShowcase && { onExitShowcase })}
        {...(onStartShowcase && { onStartShowcase })}
      />
    </div>
  );
}