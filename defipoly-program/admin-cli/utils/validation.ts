import { PublicKey } from '@solana/web3.js';

export function validatePublicKey(input: string): boolean {
  try {
    new PublicKey(input);
    return true;
  } catch {
    return false;
  }
}

export function validateNumber(input: string, min: number = 0, max: number = Infinity): boolean {
  const num = parseFloat(input);
  return !isNaN(num) && num >= min && num <= max;
}

export function validatePropertyId(input: string): boolean {
  return validateNumber(input, 0, 21);
}