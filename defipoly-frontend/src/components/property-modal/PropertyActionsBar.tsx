// ============================================
// FILE: src/components/property-modal/PropertyActionsBar.tsx
// ✅ MOBILE RESPONSIVE VERSION + TOOLTIP HINT FOR NEW USERS
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Shield, DollarSign, Crosshair, HelpCircle } from 'lucide-react';
import { PROPERTIES } from '@/utils/constants';
import {
  BuyPropertySection,
  ShieldPropertySection,
  SellPropertySection,
  StealPropertySection
} from './actions';

type ActionType = 'buy' | 'shield' | 'sell' | 'steal' | null;

interface PropertyActionsBarProps {
  propertyId: number;
  property: typeof PROPERTIES[0];
  propertyData: any;
  balance: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onClose: () => void;
  onOpenHelp: (action: ActionType) => void;
  isMobile?: boolean;
}

export function PropertyActionsBar({
  propertyId,
  property,
  propertyData,
  balance,
  loading,
  setLoading,
  onClose,
  onOpenHelp,
  isMobile = false
}: PropertyActionsBarProps) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [showTooltipHint, setShowTooltipHint] = useState(false);

  // Show tooltip hint for new users who don't own any properties yet
  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenTooltipHint');
    const ownsProperty = propertyData?.owned > 0;
    
    if (!hasSeen && !ownsProperty) {
      setShowTooltipHint(true);
    }
  }, [propertyData?.owned]);

  const dismissTooltipHint = () => {
    localStorage.setItem('hasSeenTooltipHint', 'true');
    setShowTooltipHint(false);
  };

  const toggleAction = (action: ActionType) => {
    setActiveAction(current => current === action ? null : action);
  };

  const openHelpModal = (action: ActionType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (showTooltipHint) dismissTooltipHint();
    onOpenHelp(action);
  };

  const iconSize = isMobile ? 'w-6 h-6' : 'w-5 h-5';
  const textSize = isMobile ? 'text-sm' : 'text-xs';
  const buttonPadding = isMobile ? 'py-3 px-2' : 'py-2.5 px-2';
  const helpButtonSize = isMobile ? 'w-5 h-5' : 'w-4 h-4';

  // Pulse animation classes for help buttons
  const helpButtonPulse = showTooltipHint 
  ? 'animate-pulse ring-4 ring-yellow-400/90 shadow-[0_0_15px_rgba(250,204,21,0.8)]' 
  : '';

  return (
    <div className="space-y-2">
      {/* Tooltip hint for new users */}
      {showTooltipHint && (
        <div className="text-center text-xs text-purple-300 animate-pulse pb-1">
          💡 Tap the <HelpCircle className="inline w-3 h-3" /> icons to learn how each action works
        </div>
      )}

      {/* Buttons in one line */}
      <div className="grid grid-cols-4 gap-2">
        {/* Buy Button */}
        <div className="relative">
          <button
            onClick={() => toggleAction('buy')}
            className={`
              w-full flex flex-col items-center justify-center gap-1.5 ${buttonPadding}
              rounded-lg transition-all duration-200
              ${activeAction === 'buy'
                ? 'bg-emerald-500/30 border-2 border-emerald-400/60 shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400/50'
              }
            `}
          >
            <ShoppingCart className={`${iconSize} text-emerald-400`} />
            <span className={`${textSize} font-semibold text-emerald-100`}>Buy</span>
          </button>
          <button
            className={`absolute -top-2 -right-2 p-1 bg-emerald-600/80 hover:bg-emerald-600 rounded-full transition-colors shadow-lg z-10 ${helpButtonPulse}`}
            onClick={(e) => openHelpModal('buy', e)}
          >
            <HelpCircle className={`${helpButtonSize} text-white`} />
          </button>
        </div>

        {/* Shield Button */}
        <div className="relative">
          <button
            onClick={() => toggleAction('shield')}
            className={`
              w-full flex flex-col items-center justify-center gap-1.5 ${buttonPadding}
              rounded-lg transition-all duration-200
              ${activeAction === 'shield'
                ? 'bg-blue-500/30 border-2 border-blue-400/60 shadow-lg shadow-blue-500/20'
                : 'bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 hover:border-blue-400/50'
              }
            `}
          >
            <Shield className={`${iconSize} text-blue-400`} />
            <span className={`${textSize} font-semibold text-blue-100`}>Shield</span>
          </button>
          <button
            className={`absolute -top-2 -right-2 p-1 bg-blue-600/80 hover:bg-blue-600 rounded-full transition-colors shadow-lg z-10 ${helpButtonPulse}`}
            onClick={(e) => openHelpModal('shield', e)}
          >
            <HelpCircle className={`${helpButtonSize} text-white`} />
          </button>
        </div>

        {/* Sell Button */}
        <div className="relative">
          <button
            onClick={() => toggleAction('sell')}
            className={`
              w-full flex flex-col items-center justify-center gap-1.5 ${buttonPadding}
              rounded-lg transition-all duration-200
              ${activeAction === 'sell'
                ? 'bg-orange-500/30 border-2 border-orange-400/60 shadow-lg shadow-orange-500/20'
                : 'bg-orange-500/15 border border-orange-500/30 hover:bg-orange-500/25 hover:border-orange-400/50'
              }
            `}
          >
            <DollarSign className={`${iconSize} text-orange-400`} />
            <span className={`${textSize} font-semibold text-orange-100`}>Sell</span>
          </button>
          <button
            className={`absolute -top-2 -right-2 p-1 bg-orange-600/80 hover:bg-orange-600 rounded-full transition-colors shadow-lg z-10 ${helpButtonPulse}`}
            onClick={(e) => openHelpModal('sell', e)}
          >
            <HelpCircle className={`${helpButtonSize} text-white`} />
          </button>
        </div>

        {/* Steal Button */}
        <div className="relative">
          <button
            onClick={() => toggleAction('steal')}
            className={`
              w-full flex flex-col items-center justify-center gap-1.5 ${buttonPadding}
              rounded-lg transition-all duration-200
              ${activeAction === 'steal'
                ? 'bg-rose-500/30 border-2 border-rose-400/60 shadow-lg shadow-rose-500/20'
                : 'bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-400/50'
              }
            `}
          >
            <Crosshair className={`${iconSize} text-rose-400`} />
            <span className={`${textSize} font-semibold text-rose-100`}>Steal</span>
          </button>
          <button
            className={`absolute -top-2 -right-2 p-1 bg-rose-600/80 hover:bg-rose-600 rounded-full transition-colors shadow-lg z-10 ${helpButtonPulse}`}
            onClick={(e) => openHelpModal('steal', e)}
          >
            <HelpCircle className={`${helpButtonSize} text-white`} />
          </button>
        </div>
      </div>

      {/* Expandable panels below */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${activeAction ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        {activeAction === 'buy' && (
          <BuyPropertySection
            propertyId={propertyId}
            property={property}
            propertyData={propertyData}
            balance={balance}
            loading={loading}
            setLoading={setLoading}
            onClose={onClose}
          />
        )}

        {activeAction === 'shield' && (
          <ShieldPropertySection
            propertyId={propertyId}
            property={property}
            propertyData={propertyData}
            balance={balance}
            loading={loading}
            setLoading={setLoading}
            onClose={onClose}
          />
        )}

        {activeAction === 'sell' && (
          <SellPropertySection
            propertyId={propertyId}
            property={property}
            propertyData={propertyData}
            loading={loading}
            setLoading={setLoading}
            onClose={onClose}
          />
        )}

        {activeAction === 'steal' && (
          <StealPropertySection
            propertyId={propertyId}
            property={property}
            propertyData={propertyData}
            balance={balance}
            loading={loading}
            setLoading={setLoading}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}