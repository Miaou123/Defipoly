// ============================================
// FILE: defipoly-frontend/src/components/IncomeFlowOverlay.tsx
// Particles spawn from actual property card positions
// Syncs with property card pulse animations via ParticleSpawnContext
// ============================================

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import { useParticleSpawn } from '@/contexts/ParticleSpawnContext';
import { PROPERTIES } from '@/utils/constants';
import { GreenBillSVG, DiamondSVG } from './icons/GameAssets';

interface IncomeTier {
  symbol: 'green' | 'diamond';
  intervalMs: number;
}

function getIncomeTier(income: number): IncomeTier {
  // Bills: 2500ms → 500ms
  if (income < 500)    return { symbol: 'green',   intervalMs: 2500 };
  if (income < 2000)   return { symbol: 'green',   intervalMs: 2000 };
  if (income < 5000)   return { symbol: 'green',   intervalMs: 1500 };
  if (income < 10000)  return { symbol: 'green',   intervalMs: 1000 };
  if (income < 20000)  return { symbol: 'green',   intervalMs: 500 };
  // Diamonds: reset to 2000ms → 500ms (upgrade tier)
  if (income < 50000)  return { symbol: 'diamond', intervalMs: 2000 };
  if (income < 100000) return { symbol: 'diamond', intervalMs: 1500 };
  if (income < 150000) return { symbol: 'diamond', intervalMs: 1000 };
  return                      { symbol: 'diamond', intervalMs: 500 };
}

function getRandomizedInterval(baseMs: number): number {
  const variation = baseMs * 0.2 * (Math.random() * 2 - 1);
  return baseMs + variation;
}

interface Particle {
  id: number;
  symbol: 'green' | 'diamond';
  startX: number;
  startY: number;
  progress: number;
  controlX: number;
  controlY: number;
  rotation: number;
  incomeValue: number;
}

interface PropertyData {
  propertyId: number;
  income: number;
  tier: IncomeTier;
}

interface IncomeFlowOverlayProps {
  enabled?: boolean;
  onParticleArrive?: (incomeValue: number) => void;
}

export function IncomeFlowOverlay({ enabled = true, onParticleArrive }: IncomeFlowOverlayProps) {
  const { ownerships } = useGameState();
  const { triggerSpawn } = useParticleSpawn();
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const spawnTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const onParticleArriveRef = useRef(onParticleArrive);
  const enabledRef = useRef(enabled);
  const triggerSpawnRef = useRef(triggerSpawn);

  useEffect(() => {
    onParticleArriveRef.current = onParticleArrive;
  }, [onParticleArrive]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    triggerSpawnRef.current = triggerSpawn;
  }, [triggerSpawn]);

  // Memoize property data
  const ownedPropertiesWithIncome = useMemo(() => {
    return ownerships
      .filter(o => o.slotsOwned > 0)
      .map(o => {
        const property = PROPERTIES.find(p => p.id === o.propertyId);
        if (!property) return null;
        const income = Math.floor((property.price * property.yieldBps) / 10000) * o.slotsOwned;
        const tier = getIncomeTier(income);
        return { propertyId: o.propertyId, income, tier };
      })
      .filter((p): p is PropertyData => p !== null);
  }, [ownerships]);

  const propertiesKey = useMemo(() => {
    return ownedPropertiesWithIncome.map(p => `${p.propertyId}:${p.income}`).join(',');
  }, [ownedPropertiesWithIncome]);

  // Get property card position from DOM
  const getPropertyPosition = (propertyId: number): { x: number; y: number } | null => {
    const container = containerRef.current;
    if (!container) return null;

    const card = document.querySelector(`[data-property-id="${propertyId}"]`);
    if (!card) return null;

    const cardRect = card.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Return position as percentage of container
    return {
      x: ((cardRect.left + cardRect.width / 2) - containerRect.left) / containerRect.width * 100,
      y: ((cardRect.top + cardRect.height / 2) - containerRect.top) / containerRect.height * 100,
    };
  };

  // Spawn timers effect
  useEffect(() => {
    if (!enabled) {
      spawnTimersRef.current.forEach(timer => clearTimeout(timer));
      spawnTimersRef.current.clear();
      return;
    }

    spawnTimersRef.current.forEach(timer => clearTimeout(timer));
    spawnTimersRef.current.clear();

    let isActive = true;

    const spawnParticle = (propData: PropertyData, intervalUsed: number) => {
      if (!isActive || !enabledRef.current) return;

      // Get actual position from DOM
      const position = getPropertyPosition(propData.propertyId);
      if (!position) return;

      const { tier, income } = propData;
      const startX = position.x;
      const startY = position.y;

      // Random curve control point
      const controlX = startX + (50 - startX) * 0.5 + (Math.random() - 0.5) * 40;
      const controlY = startY + (40 - startY) * 0.5 + (Math.random() - 0.5) * 40;

      const incomeValue = (income / 86400) * (intervalUsed / 1000);

      const particle: Particle = {
        id: particleIdRef.current++,
        symbol: tier.symbol,
        startX,
        startY,
        progress: 0,
        controlX,
        controlY,
        rotation: Math.random() * 360,
        incomeValue,
      };

      setParticles(prev => {
        if (prev.length > 100) {
          return [...prev.slice(-50), particle];
        }
        return [...prev, particle];
      });

      // Trigger building pulse animation via context
      triggerSpawnRef.current(propData.propertyId);
    };

    const scheduleSpawn = (propData: PropertyData) => {
      if (!isActive) return;

      const interval = getRandomizedInterval(propData.tier.intervalMs);
      const timer = setTimeout(() => {
        if (!isActive) return;
        spawnParticle(propData, interval);
        scheduleSpawn(propData);
      }, interval);

      spawnTimersRef.current.set(propData.propertyId, timer);
    };

    // Start spawning with staggered initial delays
    ownedPropertiesWithIncome.forEach((propData, index) => {
      const initialDelay = (index * 200) + Math.random() * propData.tier.intervalMs * 0.5;
      const timer = setTimeout(() => {
        if (!isActive) return;
        spawnParticle(propData, initialDelay);
        scheduleSpawn(propData);
      }, initialDelay);

      spawnTimersRef.current.set(propData.propertyId, timer);
    });

    return () => {
      isActive = false;
      spawnTimersRef.current.forEach(timer => clearTimeout(timer));
      spawnTimersRef.current.clear();
    };
  }, [enabled, propertiesKey]);

  // Animation loop
  useEffect(() => {
    if (!enabled) {
      setParticles([]);
      return;
    }

    let isActive = true;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (!isActive) return;

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setParticles(prev => {
        const updated: Particle[] = [];
        const arrived: number[] = [];

        for (const p of prev) {
          const newProgress = p.progress + deltaTime * 0.67;

          if (newProgress >= 1) {
            arrived.push(p.incomeValue);
          } else {
            updated.push({
              ...p,
              progress: newProgress,
              rotation: p.rotation + deltaTime * 120,
            });
          }
        }

        if (arrived.length > 0) {
          setTimeout(() => {
            arrived.forEach(value => onParticleArriveRef.current?.(value));
          }, 0);
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      isActive = false;
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      spawnTimersRef.current.forEach(timer => clearTimeout(timer));
      spawnTimersRef.current.clear();
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getPosition = (p: Particle) => {
    const t = Math.max(0, p.progress);
    // Target X = 50 (center), Target Y = 38 (higher up, into the bank)
    const targetX = 50;
    const targetY = 44;
    const x = (1 - t) * (1 - t) * p.startX + 2 * (1 - t) * t * p.controlX + t * t * targetX;
    const y = (1 - t) * (1 - t) * p.startY + 2 * (1 - t) * t * p.controlY + t * t * targetY;
    return { x, y };
  };

  if (!enabled || ownedPropertiesWithIncome.length === 0) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {particles.map(p => {
        const pos = getPosition(p);
        // Fade in quickly, stay fully opaque, only fade out at very end
        const fadeIn = Math.min(1, p.progress * 8); // Faster fade in
        const fadeOut = 1 - Math.max(0, (p.progress - 0.85) / 0.15); // Only fade out last 15%
        const opacity = fadeIn * fadeOut;
        const scale = 0.8 - p.progress * 0.3;

        return (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: '24px',
              height: p.symbol === 'green' ? '16px' : '20px',
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${p.rotation}deg)`,
              opacity,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            }}
          >
            {p.symbol === 'green' ? <GreenBillSVG /> : <DiamondSVG />}
          </div>
        );
      })}
    </div>
  );
}