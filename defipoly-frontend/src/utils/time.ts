// src/utils/time.ts
import BN from 'bn.js';

export function formatTimeRemaining(expiryTimestamp: BN | number): string {
  const now = Math.floor(Date.now() / 1000);
  const expiry = typeof expiryTimestamp === 'number' 
    ? expiryTimestamp 
    : expiryTimestamp.toNumber();
  
  const remaining = expiry - now;
  
  if (remaining <= 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function getTimeRemaining(expiryTimestamp: BN | number): number {
  const now = Math.floor(Date.now() / 1000);
  const expiry = typeof expiryTimestamp === 'number' 
    ? expiryTimestamp 
    : expiryTimestamp.toNumber();
  
  return Math.max(0, expiry - now);
}

export function isShieldExpired(expiryTimestamp: BN | number): boolean {
  return getTimeRemaining(expiryTimestamp) <= 0;
}