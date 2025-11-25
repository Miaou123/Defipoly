'use client';

import { useMemo } from 'react';
import { MONEY_SYMBOLS } from './icons/GameAssets';

interface MoneyBillsAnimationProps {
  income: number;
  compact?: boolean;
  modalView?: boolean;
}

interface IncomeTier {
  symbol: 'green' | 'diamond';
  count: number;
  pulseDuration: number;
  pulseClass: string;
}

function getIncomeTier(income: number): IncomeTier {
  if (income < 500) return { symbol: 'green', count: 1, pulseDuration: 8, pulseClass: 'building-pulse-8s' };
  if (income < 1500) return { symbol: 'green', count: 2, pulseDuration: 7, pulseClass: 'building-pulse-7s' };
  if (income < 4000) return { symbol: 'green', count: 2, pulseDuration: 6, pulseClass: 'building-pulse-6s' };
  if (income < 8000) return { symbol: 'green', count: 3, pulseDuration: 5, pulseClass: 'building-pulse-5s' };
  if (income < 15000) return { symbol: 'green', count: 3, pulseDuration: 4.5, pulseClass: 'building-pulse-4-5s' };
  
  if (income < 40000) return { symbol: 'diamond', count: 3, pulseDuration: 4, pulseClass: 'building-pulse-4s' };
  if (income < 70000) return { symbol: 'diamond', count: 3, pulseDuration: 3.5, pulseClass: 'building-pulse-3-5s' };
  if (income < 100000) return { symbol: 'diamond', count: 4, pulseDuration: 3, pulseClass: 'building-pulse-3s' };
  if (income < 140000) return { symbol: 'diamond', count: 4, pulseDuration: 2.5, pulseClass: 'building-pulse-2-5s' };
  return { symbol: 'diamond', count: 5, pulseDuration: 2, pulseClass: 'building-pulse-2s' };
}

const SPREAD_ANIMATIONS = ['spreadUp1', 'spreadUp2', 'spreadUp3', 'spreadUp4', 'spreadUp5'];

export function MoneyBillsAnimation({ income, compact = false, modalView = false }: MoneyBillsAnimationProps) {
  const tier = useMemo(() => getIncomeTier(income), [income]);
  
  if (income <= 0) return null;

  const SymbolComponent = MONEY_SYMBOLS[tier.symbol];
  const billSize = modalView ? 28 : (compact ? 12 : 18);

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none z-20"
      style={modalView ? { transform: 'scale(2)', transformOrigin: 'center 70%' } : undefined}
    >
      {Array.from({ length: tier.count }).map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: '50%',
            top: modalView ? '60%' : '60%',
            width: billSize,
            height: billSize,
            transform: 'translate(-50%, -50%)',
            animation: `${SPREAD_ANIMATIONS[i] || SPREAD_ANIMATIONS[0]} ${tier.pulseDuration}s ease-out infinite`,
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
          }}
        >
          <SymbolComponent />
        </div>
      ))}
    </div>
  );
}

export function useIncomePulseClass(income: number): string {
  if (income <= 0) return '';
  return getIncomeTier(income).pulseClass;
}