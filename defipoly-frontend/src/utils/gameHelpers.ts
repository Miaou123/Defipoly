// defipoly-frontend/src/utils/gameHelpers.ts
// Static helper functions for game logic
// This file is NOT auto-generated and won't be overwritten

import { PROPERTIES } from './constants';

// ============================================
// PROPERTY SET HELPERS
// ============================================

/**
 * Get the display name for a property set
 */
export function getSetName(setId: number): string {
  const setNames: { [key: number]: string } = {
    0: 'Brown Set',
    1: 'Light Blue Set',
    2: 'Pink Set',
    3: 'Orange Set',
    4: 'Red Set',
    5: 'Yellow Set',
    6: 'Green Set',
    7: 'Dark Blue Set',
  };
  return setNames[setId] || 'Unknown Set';
}

/**
 * Check if a player owns all properties in a set
 * @param setId - The set ID to check
 * @param ownedPropertyIds - Array of property IDs the player owns
 */
export function isSetComplete(setId: number, ownedPropertyIds: number[]): boolean {
  const propertiesInSet = PROPERTIES.filter(p => p.setId === setId);
  const requiredProps = setId === 0 || setId === 7 ? 2 : 3; // Brown and Dark Blue have 2, others have 3
  
  const ownedInSet = propertiesInSet.filter(p => ownedPropertyIds.includes(p.id)).length;
  return ownedInSet >= requiredProps;
}

/**
 * Get the maximum slots per player for properties in a set
 */
export function getMinSlots(setId: number): number {
  const propertiesInSet = PROPERTIES.filter(p => p.setId === setId);
  if (propertiesInSet.length === 0) return 0;
  
  // Return the maxPerPlayer for properties in this set (they're all the same)
  return propertiesInSet[0].maxPerPlayer;
}

/**
 * Get all property IDs in a set
 */
export function getPropertiesInSet(setId: number): number[] {
  return PROPERTIES.filter(p => p.setId === setId).map(p => p.id);
}

/**
 * Get the set bonus percentage for a set
 */
export function getSetBonusPercent(setId: number): number {
  const bonuses: { [key: number]: number } = {
    0: 30.00,   // Brown
    1: 32.86,   // Light Blue
    2: 35.71,   // Pink
    3: 38.57,   // Orange
    4: 41.43,   // Red
    5: 44.29,   // Yellow
    6: 47.14,   // Green
    7: 50.00,   // Dark Blue
  };
  return bonuses[setId] || 0;
}

/**
 * Get the tier name for a property
 */
export function getTierName(tier: string): string {
  const tierNames: { [key: string]: string } = {
    'brown': 'Brown',
    'lightblue': 'Light Blue',
    'pink': 'Pink',
    'orange': 'Orange',
    'red': 'Red',
    'yellow': 'Yellow',
    'green': 'Green',
    'darkblue': 'Dark Blue',
  };
  return tierNames[tier] || tier;
}

/**
 * Format a large number with K/M suffix
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Calculate daily income from a property
 */
export function calculateDailyIncome(price: number, yieldBps: number): number {
  return (price * yieldBps) / 10000;
}

/**
 * Calculate shield cost for a property
 */
export function calculateShieldCost(price: number, shieldCostBps: number): number {
  return (price * shieldCostBps) / 10000;
}

/**
 * Get color hex from Tailwind class
 */
export function getColorHex(colorClass: string): string {
  const colorMap: { [key: string]: string } = {
    'bg-amber-900': '#78350f',    // Brown
    'bg-sky-300': '#7dd3fc',      // Light Blue
    'bg-pink-400': '#f472b6',     // Pink
    'bg-orange-500': '#f97316',   // Orange
    'bg-red-600': '#dc2626',      // Red
    'bg-yellow-400': '#facc15',   // Yellow
    'bg-green-600': '#16a34a',    // Green
    'bg-blue-900': '#1e3a8a',     // Dark Blue
  };
  return colorMap[colorClass] || '#8b5cf6';
}

/**
 * Get all properties in a set with full info
 */
export function getSetProperties(setId: number) {
  return PROPERTIES.filter(p => p.setId === setId);
}

/**
 * Check if a setId is valid
 */
export function isValidSetId(setId: number): boolean {
  return setId >= 0 && setId <= 7;
}

/**
 * Get the number of properties required to complete a set
 */
export function getRequiredPropertiesForSet(setId: number): number {
  return setId === 0 || setId === 7 ? 2 : 3;
}