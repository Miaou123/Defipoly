// ============================================
// FILE: src/components/property-modal/PropertyActionsBar.tsx
// Collapsible inline action buttons wrapper
// ============================================

'use client';

import { useState } from 'react';
import { ShoppingCart, Shield, DollarSign, Crosshair } from 'lucide-react';
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
}

export function PropertyActionsBar({
  propertyId,
  property,
  propertyData,
  balance,
  loading,
  setLoading,
  onClose
}: PropertyActionsBarProps) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);

  const toggleAction = (action: ActionType) => {
    setActiveAction(current => current === action ? null : action);
  };

  return (
    <div className="space-y-2">
      {/* Buttons in one line */}
      <div className="grid grid-cols-4 gap-2">
        {/* Buy Button */}
        <button
          onClick={() => toggleAction('buy')}
          className={`
            flex flex-col items-center justify-center gap-1.5 py-2.5 px-2
            rounded-lg transition-all duration-200
            ${activeAction === 'buy'
              ? 'bg-emerald-500/30 border-2 border-emerald-400/60 shadow-lg shadow-emerald-500/20'
              : 'bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400/50'
            }
          `}
        >
          <ShoppingCart className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-100">Buy</span>
        </button>

        {/* Shield Button */}
        <button
          onClick={() => toggleAction('shield')}
          className={`
            flex flex-col items-center justify-center gap-1.5 py-2.5 px-2
            rounded-lg transition-all duration-200
            ${activeAction === 'shield'
              ? 'bg-blue-500/30 border-2 border-blue-400/60 shadow-lg shadow-blue-500/20'
              : 'bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 hover:border-blue-400/50'
            }
          `}
        >
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="text-xs font-semibold text-blue-100">Shield</span>
        </button>

        {/* Sell Button */}
        <button
          onClick={() => toggleAction('sell')}
          className={`
            flex flex-col items-center justify-center gap-1.5 py-2.5 px-2
            rounded-lg transition-all duration-200
            ${activeAction === 'sell'
              ? 'bg-orange-500/30 border-2 border-orange-400/60 shadow-lg shadow-orange-500/20'
              : 'bg-orange-500/15 border border-orange-500/30 hover:bg-orange-500/25 hover:border-orange-400/50'
            }
          `}
        >
          <DollarSign className="w-5 h-5 text-orange-400" />
          <span className="text-xs font-semibold text-orange-100">Sell</span>
        </button>

        {/* Steal Button */}
        <button
          onClick={() => toggleAction('steal')}
          className={`
            flex flex-col items-center justify-center gap-1.5 py-2.5 px-2
            rounded-lg transition-all duration-200
            ${activeAction === 'steal'
              ? 'bg-rose-500/30 border-2 border-rose-400/60 shadow-lg shadow-rose-500/20'
              : 'bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-400/50'
            }
          `}
        >
          <Crosshair className="w-5 h-5 text-rose-400" />
          <span className="text-xs font-semibold text-rose-100">Steal</span>
        </button>
      </div>

      {/* Expandable panels below */}
      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${activeAction ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
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